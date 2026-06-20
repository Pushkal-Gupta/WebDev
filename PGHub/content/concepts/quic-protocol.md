---
slug: quic-protocol
module: cs-network-protocols
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
HTTP/3 is QUIC. Google, Cloudflare, Meta, Apple, and Akamai all default to QUIC for hot paths because median page-load is around 15% faster on lossy networks and 50% or more faster on connection-migration scenarios like mobile handoffs. The IETF standardized QUIC in RFC 9000 (May 2021) and HTTP/3 in RFC 9114 (June 2022). Knowing QUIC is baseline networking literacy for senior backend and platform interviews — and "why not just TCP" is a question every load-balancer team is asked. QUIC also enables 0-RTT resumption (TLS 1.3 baked in), connection migration without renegotiation, and end-to-end encryption of transport metadata that TCP exposes to middleboxes.

## intuition
TCP's biggest defect is *head-of-line blocking at the transport layer*. If you multiplex 100 requests on one TCP connection (HTTP/2) and packet number 4 is lost, requests 5 through 100 wait for the retransmission even though their bytes have already arrived. The OS's TCP stack hands data to the application in strict order, so until the missing byte arrives nothing past it can be delivered. QUIC fixes this by treating each stream independently — packet loss on stream A does not stall stream B, because QUIC implements its own per-stream sequencing on top of unordered UDP datagrams.

TLS is mandatory and the handshake is built in. A new TCP+TLS 1.3 connection takes two round-trips (TCP three-way handshake then TLS); QUIC takes one. With session resumption, QUIC achieves 0-RTT — the very first request packet contains both the resumed crypto context and the application data. The trade-off is that 0-RTT data is replay-vulnerable, so use it only for idempotent operations (`GET`s, never `POST`s that change state).

The most underrated feature is *connection migration*. A QUIC connection is identified by a connection ID, not by the IP+port tuple. When your phone moves from Wi-Fi to LTE, the IP changes but the connection ID stays the same — the QUIC stack on both ends notices the address change, validates the new path with a small probe, and keeps the connection alive. TCP, in contrast, drops the connection and forces a full reconnect plus re-auth. For mobile apps streaming video or long-running gRPC calls, this is a major reliability improvement.

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
Run QUIC at the edge (Cloudflare, Fastly, Nginx with the QUIC patches in 1.25+, Envoy, Caddy, AWS CloudFront, GCP Cloud Load Balancer). Terminate QUIC there and speak HTTP/2 or HTTP/1.1 to origin internally — origin-side QUIC is rarely worth the CPU overhead until your kernel and NIC support QUIC offload. Open UDP/443 inbound and outbound; most corporate firewalls now allow it but enterprise networks sometimes block UDP for security reasons (have a TCP fallback). Advertise via `Alt-Svc: h3=":443"; ma=86400` so capable clients learn and persist the upgrade.

```nginx
# Nginx 1.25+ with QUIC support compiled in
server {
    listen 443 ssl http2;             # TCP path
    listen 443 quic reuseport;        # QUIC path on UDP/443
    ssl_protocols TLSv1.3;
    ssl_early_data on;                # enable 0-RTT for idempotent requests
    quic_retry on;                    # mitigate amplification attacks
    add_header Alt-Svc 'h3=":443"; ma=86400' always;
    add_header X-Early-Data $ssl_early_data always;
}
```

The critical line is `add_header Alt-Svc 'h3=":443"; ma=86400'` — without it browsers will not discover the HTTP/3 endpoint. Pair with `quic_retry on` to defend against the IP-spoofing amplification attack inherent to any UDP protocol that responds with more bytes than it received. For 0-RTT, only allow idempotent methods (`GET`, `HEAD`, `OPTIONS`) and check the `Early-Data: 1` header at the application layer to refuse non-idempotent operations. Rotate connection IDs (RFC 9000 Section 5.1) to defeat passive linkability across path migrations. Monitor `QUIC handshake duration`, `connection migrations`, and `0-RTT acceptance rate` as core SRE metrics for any QUIC-enabled edge.

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
