---
slug: quic-protocol
module: cs-core
title: QUIC Protocol
subtitle: A UDP-based transport with built-in TLS 1.3, real multiplexing without head-of-line blocking, and 0-RTT resumption — what HTTP/3 actually runs on.
difficulty: Advanced
position: 60
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "highscalability.com — QUIC and HTTP/3"
    url: "http://highscalability.com/"
    type: blog
  - title: "GeeksforGeeks — QUIC Protocol"
    url: "https://www.geeksforgeeks.org/quic-protocol/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
QUIC (RFC 9000) is a transport protocol that runs on UDP and replaces the TCP+TLS stack underneath HTTP/3. It folds the TLS 1.3 handshake into the connection setup (so the first request lands in 1 RTT instead of 2-3), gives every stream its own loss-recovery state (so one dropped packet only stalls one stream instead of the whole connection), and binds the connection to a 64-bit *connection ID* rather than the four-tuple (so a phone switching from Wi-Fi to LTE keeps the same connection alive).

## whyItMatters
HTTP/3 is QUIC. Google, Cloudflare, Meta, and Apple all default to QUIC for hot paths because the median page-load is ~15% faster on lossy networks and *much* faster (50%+) on connection-migration scenarios like mobile handoff. Knowing QUIC is now baseline networking literacy for senior backend and platform interviews — and "why not just TCP" is a question every load-balancer team is asked.

## intuition
TCP's biggest defect is *head-of-line blocking at the transport layer*. If you multiplex 100 requests on one TCP connection (HTTP/2) and packet #4 is lost, requests 5-100 wait for the retransmit even though their bytes already arrived. QUIC fixes this by treating each stream independently — packet loss on stream A does not stall stream B. The other big win: TLS is mandatory, the handshake is built in, and *connection IDs* are not tied to source IP, so you can migrate networks without renegotiation.

## visualization
```
TCP + TLS 1.3 + HTTP/2:
  Client                              Server
    | -- SYN --------------->           | \
    | <-- SYN/ACK ----------- |          |  TCP handshake (1 RTT)
    | -- ACK --------------->           | /
    | -- ClientHello ------> |          | \
    | <-- ServerHello + ... -|          |  TLS handshake (1 RTT)
    | -- Finished ---------> |          | /
    | -- HTTP req ----------> |         |    first byte: 2 RTT later

QUIC (HTTP/3):
    | -- Initial(ClientHello) + 0-RTT app data ->
    | <-- Initial(ServerHello) + Handshake + 1-RTT response ->
                                                first byte: 1 RTT (or 0-RTT resume)

Per-stream loss isolation:
  Stream A packet 7 lost  -> only stream A waits for retransmit.
  Streams B, C, D continue delivering bytes to the application.
```

## bruteForce
"Just keep using TCP + TLS + HTTP/2." Works fine on a wired connection with 0% loss. On a 4G link with 2% loss, HTTP/2's transport-layer head-of-line blocking serializes every multiplexed request behind any single lost packet, so the speedup of multiplexing vanishes. Connection migration (Wi-Fi -> LTE) requires a full new TCP+TLS handshake — multi-second stall.

## optimal
- Run QUIC at the edge (Cloudflare, Fastly, nginx-quic, Envoy, Caddy) — terminate QUIC there and speak HTTP/1.1 or HTTP/2 to origin internally.
- Open UDP/443 outbound and inbound; most corporate firewalls now allow it.
- Use 0-RTT carefully — replay-safe operations only (idempotent GETs). A POST sent in 0-RTT can be replayed by an attacker.
- Advertise via `Alt-Svc: h3=":443"` so clients learn HTTP/3 is available and upgrade on the next request.
- Monitor `QUIC handshake duration` and `connection migrations` — if migrations are not happening, your connection IDs are not rotating.
- Use connection-ID rotation to defeat passive on-path tracking.

## complexity
time: 1 RTT for first connection; 0 RTT for resumed sessions. Stream-level recovery is independent.
space: O(active_streams * window_size) per connection; QUIC's flow control is two-level (connection + per-stream).
notes: UDP-based, so it lives outside the kernel's TCP optimizations — most QUIC stacks (quiche, msquic, quic-go) run in userspace, which means CPU per byte is higher than TCP. Kernel-bypass and io_uring narrow the gap.

## pitfalls
- UDP blocked by middleboxes — corporate networks, cheap VPNs, captive portals. Always keep TCP+HTTP/2 as a fallback.
- 0-RTT replay attacks on non-idempotent requests — never accept 0-RTT POSTs to billing or auth endpoints.
- Stateless reset confusion — if your server restarts, in-flight connections get a stateless reset and need a clean retry path.
- Ignoring connection-ID rotation — defeats on-path linkability but few stacks rotate by default; configure it.
- Building load balancers that hash on the 4-tuple — kills connection migration. Use the connection ID instead.
- Treating QUIC as "just faster TCP" — its security boundary, congestion-control behavior, and pacing differ. Re-tune.

## interviewTips
- Lead with three wins: 1-RTT handshake, per-stream loss isolation, connection migration.
- Know HTTP/3 = HTTP semantics over QUIC. The "/3" is the version label, not a new protocol family.
- Mention 0-RTT *and* its replay risk in the same breath.
- Compare to HTTP/2: same multiplexing, but no transport HoL blocking.
- For "design a global API": QUIC at the edge, region anycast, HTTP/2 to origin internally.

## code.python
```python
# aioquic — async QUIC client
import asyncio
from aioquic.asyncio.client import connect
from aioquic.h3.connection import H3Connection
from aioquic.h3.events import HeadersReceived, DataReceived

async def fetch(host, port=443, path="/"):
    async with connect(host, port, alpn_protocols=["h3"]) as conn:
        h3 = H3Connection(conn._quic)
        sid = conn._quic.get_next_available_stream_id()
        h3.send_headers(sid, [
            (b":method", b"GET"), (b":scheme", b"https"),
            (b":authority", host.encode()), (b":path", path.encode()),
        ], end_stream=True)
        body = bytearray()
        async for ev in h3.events():
            if isinstance(ev, DataReceived) and ev.stream_id == sid:
                body.extend(ev.data)
                if ev.stream_ended:
                    return bytes(body)

asyncio.run(fetch("cloudflare-quic.com"))
```

## code.javascript
```javascript
// Node 21+ has experimental HTTP/3 client; userland uses @kixelated/quic or fetch-h3.
// In modern browsers, the Fetch API auto-uses HTTP/3 via Alt-Svc — no API change.
const res = await fetch("https://cloudflare-quic.com/", { cache: "no-store" });
console.log(res.headers.get("alt-svc"));  // h3=":443"; ma=86400
// Subsequent requests on the same origin use HTTP/3 transparently.

// Server (Node): http3 via the `node:http2` HTTP/3 preview or a Caddy/nginx-quic reverse proxy.
// Production pattern: terminate HTTP/3 at the edge, speak HTTP/2 to Node.
```

## code.java
```java
// Netty has incubating QUIC support (netty-incubator-codec-quic).
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioDatagramChannel;
import io.netty.incubator.codec.quic.*;

QuicSslContext ctx = QuicSslContextBuilder.forClient()
    .applicationProtocols("h3").build();

ChannelHandler codec = new QuicClientCodecBuilder()
    .sslContext(ctx)
    .maxIdleTimeout(30, TimeUnit.SECONDS)
    .initialMaxData(10_000_000)
    .initialMaxStreamDataBidirectionalLocal(1_000_000)
    .build();

Bootstrap bs = new Bootstrap().group(new NioEventLoopGroup(1))
    .channel(NioDatagramChannel.class).handler(codec);
Channel ch = bs.bind(0).sync().channel();
QuicChannel quic = QuicChannel.newBootstrap(ch)
    .streamHandler(new ChannelInboundHandlerAdapter())
    .remoteAddress(new InetSocketAddress("cloudflare-quic.com", 443))
    .connect().get();
// Open H3 streams on `quic`...
```

## code.cpp
```cpp
// Microsoft msquic — production-grade userspace QUIC.
#include <msquic.h>

QUIC_API_TABLE* api;
MsQuicOpen2(&api);
HQUIC reg; api->RegistrationOpen(nullptr, &reg);
HQUIC conf;
QUIC_BUFFER alpn = { sizeof("h3") - 1, (uint8_t*)"h3" };
QUIC_SETTINGS s = {};
s.IsSet.IdleTimeoutMs = 1; s.IdleTimeoutMs = 30000;
api->ConfigurationOpen(reg, &alpn, 1, &s, sizeof(s), nullptr, &conf);

QUIC_CREDENTIAL_CONFIG cred = {};
cred.Type  = QUIC_CREDENTIAL_TYPE_NONE;
cred.Flags = QUIC_CREDENTIAL_FLAG_CLIENT;
api->ConfigurationLoadCredential(conf, &cred);

HQUIC conn;
api->ConnectionOpen(reg,
    [](HQUIC, void*, QUIC_CONNECTION_EVENT*) -> QUIC_STATUS { return 0; },
    nullptr, &conn);
api->ConnectionStart(conn, conf, QUIC_ADDRESS_FAMILY_UNSPEC,
                     "cloudflare-quic.com", 443);
```
