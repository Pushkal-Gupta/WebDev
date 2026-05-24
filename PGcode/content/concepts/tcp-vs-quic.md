---
slug: tcp-vs-quic
module: cs-core
title: TCP vs QUIC
subtitle: Head-of-line blocking, 0-RTT handshakes, and how multiplexed streams over UDP changed the modern internet.
difficulty: Advanced
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 8: The Trouble with Distributed Systems"
    url: "https://dataintensive.net/"
    type: book
  - title: "High Scalability — QUIC and HTTP/3 Deep Dive"
    url: "http://highscalability.com/"
    type: blog
  - title: "donnemartin/system-design-primer — Networking"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
TCP has carried the web for forty years on a simple promise: an ordered, reliable byte stream between two endpoints. QUIC, finalized as RFC 9000 in 2021 and the substrate of HTTP/3, throws out the kernel implementation, runs over UDP, and rebuilds the same guarantees in user space — but with multiplexed independent streams, a faster handshake, and connection migration across IP changes. The interview-relevant punchline: QUIC fixes TCP's head-of-line blocking, ships TLS as part of the transport, and resumes connections in 0 round trips.

## whyItMatters
Every modern CDN (Cloudflare, Fastly, Google) speaks HTTP/3 over QUIC. A single packet loss in an HTTP/2-over-TCP connection stalls *every* multiplexed stream on that connection because TCP cannot deliver bytes out of order; QUIC lets the other streams keep flowing. On mobile networks (high loss, IP changes when you walk from WiFi to LTE), the difference is night and day. Interviewers ask "why is HTTP/3 faster?" expecting you to answer with these three words — *head-of-line blocking* — and explain them in detail.

## intuition
TCP is a single conveyor belt: anything dropped halts everything behind it until the missing piece is retransmitted. HTTP/2 over TCP put 100 logical streams on one belt — one dropped packet stalls all 100. QUIC replaces the belt with 100 parallel cables sharing one congestion controller; a drop on cable 7 only blocks cable 7. The handshake is also folded together: TLS 1.3 + transport setup in one round trip for a new connection, zero round trips for a resumed one (the client just sends data alongside the resume ticket).

## visualization
TCP head-of-line blocking with HTTP/2 multiplexing:

```
Time -->
Stream A: [A1 A2 .. A4 A5]   <- A3 dropped, A4 A5 BUFFERED in kernel
Stream B: [B1 B2 B3 B4 B5]   <- B is fine but cannot deliver until A3 arrives
```

QUIC independent streams:

```
Time -->
Stream A: [A1 A2 .. A4 A5]   <- A3 dropped, A4 A5 BUFFERED for stream A only
Stream B: [B1 B2 B3 B4 B5]   <- DELIVERED immediately
```

## bruteForce
The "just use TCP forever" stance — works, well understood, every router and middlebox loves it. But on a 2% loss link, HTTP/2's multiplexing benefits collapse: throughput drops to single-stream because of HOL blocking. Worse, TCP's handshake costs 1 RTT before TLS, and TLS adds another 1–2. On a 200 ms RTT mobile link, that's half a second of dead air before the first byte. Brute force fixes are HTTP/2 server push, more parallel TCP connections (wasting congestion-control state), and resignation.

## optimal
For new public-facing services, terminate HTTP/3 at the edge (Nginx with `quic_enabled on`, Caddy by default, Envoy 1.22+, Cloudflare). Keep HTTP/2 over TCP as a fallback (browsers alpn-negotiate automatically). For internal RPC, the picture is more nuanced — gRPC over HTTP/2 is still standard, and QUIC's userland CPU cost (about 2× TCP for raw throughput because crypto and packet pacing live in userspace) makes it less attractive on east-west links where loss is near zero. Use QUIC for `north-south` (browser ↔ edge) and TCP for `east-west` (service ↔ service) until kernel-offloaded QUIC matures.

## complexity
time: TCP handshake — 1 RTT, +1–2 RTT for TLS 1.3. QUIC — 1 RTT new, 0 RTT resumed. Per-packet processing — TCP in kernel (DMA, segmentation offload), QUIC in userspace (more CPU until GSO/GRO support lands).
space: Per-connection state grows with multiplexed streams; QUIC connection IDs decouple identity from 5-tuple, allowing migration without resetting buffers.
notes: QUIC connections are identified by a connection ID, not (src_ip, src_port, dst_ip, dst_port). A phone moving from WiFi to LTE keeps the same QUIC connection; the TCP equivalent would tear down and reconnect.

## pitfalls
- Believing QUIC removes HOL blocking entirely — it removes *transport-level* HOL between streams, but the application can still serialize work (e.g., a single HTTP/3 request still blocks on its own ordered bytes).
- Running QUIC on a network that drops UDP — many corporate firewalls block UDP > 53; QUIC silently falls back to TCP and you lose all the benefits.
- Treating 0-RTT as free — 0-RTT data is replay-vulnerable (the server may see it twice), so it is only safe for idempotent requests.
- Ignoring CPU cost — QUIC pegs a core long before TCP at the same throughput; size your edge fleet accordingly.
- Forgetting connection migration validates the new path before sending data — otherwise it is a vector for amplification attacks.

## interviewTips
- Use the phrase "head-of-line blocking" early; it is the magic word.
- Know the layering: HTTP/3 → QUIC → UDP → IP, vs HTTP/2 → TLS → TCP → IP. Crypto is *inside* QUIC, not above it.
- Cite 0-RTT carefully: faster, but replay-safe only for idempotent requests.
- Mention connection IDs and migration — they are the differentiator for mobile.
- For "why hasn't TCP added this?" — kernel deployment is slow; QUIC is in userspace so it can iterate at Chrome-release cadence.

## code.python
```python
# QUIC client with aioquic
import asyncio
from aioquic.asyncio.client import connect
from aioquic.h3.connection import H3Connection
from aioquic.h3.events import HeadersReceived, DataReceived

async def fetch(url):
    async with connect("www.example.com", 443, alpn_protocols=["h3"]) as conn:
        h3 = H3Connection(conn._quic)
        sid = conn._quic.get_next_available_stream_id()
        h3.send_headers(sid, [
            (b":method", b"GET"), (b":path", b"/"),
            (b":scheme", b"https"), (b":authority", b"www.example.com"),
        ], end_stream=True)
        conn.transmit()
        # iterate events until end of stream...

asyncio.run(fetch("https://www.example.com/"))
```

## code.javascript
```javascript
// Node 21+ supports HTTP/3 via the experimental Http3 server module.
import { createQuicSocket } from "node:net";  // example shape; see node docs

const socket = createQuicSocket({ endpoint: { port: 0 } });
const session = await socket.connect({
  address: "www.example.com",
  port: 443,
  alpn: "h3",
  servername: "www.example.com",
});

const stream = session.openStream({ halfOpen: false });
stream.end("GET / HTTP/3\r\nHost: www.example.com\r\n\r\n");
for await (const chunk of stream) process.stdout.write(chunk);
```

## code.java
```java
// Netty's incubator-codec-http3 over Netty-QUIC
EventLoopGroup group = new NioEventLoopGroup();
QuicSslContext ctx = QuicSslContextBuilder.forClient()
    .applicationProtocols(Http3.supportedApplicationProtocols())
    .build();

ChannelHandler codec = Http3.newQuicClientCodecBuilder()
    .sslContext(ctx).maxIdleTimeout(30, TimeUnit.SECONDS)
    .initialMaxData(10_000_000)
    .initialMaxStreamDataBidirectionalLocal(1_000_000)
    .build();

Bootstrap b = new Bootstrap().group(group)
    .channel(NioDatagramChannel.class).handler(codec);
Channel ch = b.bind(0).sync().channel();
// open quic stream, send H3 request frame, read response frames...
```

## code.cpp
```cpp
// CLI sketch using msquic.
#include <msquic.h>

const QUIC_API_TABLE* MsQuic;
MsQuicOpen2(&MsQuic);

HQUIC reg, conf, conn;
MsQuic->RegistrationOpen(nullptr, &reg);

QUIC_BUFFER alpn = { sizeof("h3") - 1, (uint8_t*)"h3" };
QUIC_SETTINGS settings{}; settings.IsSet.IdleTimeoutMs = 1;
settings.IdleTimeoutMs = 30000;
MsQuic->ConfigurationOpen(reg, &alpn, 1, &settings, sizeof(settings), nullptr, &conf);
MsQuic->ConfigurationLoadCredential(conf, &(QUIC_CREDENTIAL_CONFIG){
    .Type = QUIC_CREDENTIAL_TYPE_NONE, .Flags = QUIC_CREDENTIAL_FLAG_CLIENT });

MsQuic->ConnectionOpen(reg, ConnectionCallback, nullptr, &conn);
MsQuic->ConnectionStart(conn, conf, QUIC_ADDRESS_FAMILY_UNSPEC, "www.example.com", 443);
```
