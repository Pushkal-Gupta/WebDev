---
slug: http2-vs-http3
module: cs-network-protocols
title: HTTP/2 vs HTTP/3
subtitle: HTTP/2 multiplexed everything over one TCP connection — and got hit by head-of-line blocking. HTTP/3 moves to UDP+QUIC to fix it.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Operating Systems: Three Easy Pieces"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Jepsen — Distributed-systems consistency analyses"
    url: "https://jepsen.io/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
HTTP/1.1 sent one request per TCP connection (or many sequentially over a kept-alive connection). **HTTP/2** added multiplexing — many requests interleaved over one connection — but everything still rode TCP. **HTTP/3** rewrote the transport from scratch on UDP via **QUIC**, fixing the head-of-line-blocking flaw HTTP/2 inherited from TCP and rolling encryption + handshake into one round-trip.

## whyItMatters
Page-load performance is dominated by network round-trips. A modern site might pull 80 resources. Over HTTP/1.1 with the browser's 6-connection-per-origin cap, that is a queue. HTTP/2 (RFC 7540, 2015) cut it to one connection with multiplexed streams, but a single lost TCP packet stalls every stream until retransmission — head-of-line blocking. HTTP/3 (RFC 9114, 2022) over QUIC (RFC 9000) isolates loss per-stream, so one dropped packet only affects the stream that needed it. For mobile users on lossy networks the difference is dramatic: Google's measurements show 12% faster median page load and 30% faster long-tail. Operationally HTTP/3 also delivers 0-RTT resumption (TLS 1.3 baked in), connection migration across IPs (Wi-Fi to 5G handoff without dropping requests), and the kernel-bypass benefits of UDP for high-RPS APIs.

## intuition
HTTP/2 is one TCP connection with many simultaneous *streams*. Frames from different streams interleave on the wire, identified by a stream ID. The streams are independent at the HTTP layer, but TCP underneath is a single byte stream that must deliver in order. So a single lost TCP packet blocks delivery of all subsequent bytes until TCP retransmits — even for streams whose data already arrived. That is HTTP/2's head-of-line (HoL) blocking.

HTTP/3 is built on QUIC, which runs on UDP. QUIC implements its own per-stream reliability: each stream has its own sequence numbers and acks, and loss in stream A does not block stream B. QUIC also bundles TLS 1.3 into its handshake so connection setup is one round-trip (or zero, with 0-RTT resumption), versus TCP's three-way handshake plus a separate TLS handshake. Connection identifiers are independent of the IP/port tuple, which means a phone roaming from Wi-Fi to LTE keeps the same QUIC connection alive — no reconnect, no re-auth, no lost requests.

The trade-offs land elsewhere. UDP is sometimes throttled or blocked by corporate firewalls. QUIC's per-packet crypto adds CPU compared to TCP+TLS; until OS kernels offload it via GSO/GRO and hardware vendors ship QUIC offload (in progress for Intel and Mellanox NICs), high-RPS servers see roughly 2x the CPU cost. Most deployments offer both: HTTP/2 baseline, HTTP/3 advertised via `Alt-Svc: h3=":443"` so capable clients can upgrade.

## visualization
```
HTTP/2 over TCP:                  HTTP/3 over QUIC/UDP:
  [stream1 frame] →                 [stream1 packet]  ─┐
  [stream2 frame] →                 [stream2 packet]  ─┤  independent reliability
  [stream1 frame] → (lost)          [stream1 packet]  ─┤
  [stream3 frame] (blocked!)        [stream3 packet]  ─┘  not blocked by stream1 loss
  [stream2 frame] (blocked!)
```

## bruteForce
Stick with HTTP/1.1. Works but every site bundles & inlines aggressively to dodge the per-connection limit. Modern toolchains assume HTTP/2 or higher.

## optimal
Enable HTTP/2 at the load balancer (Nginx, Envoy, Caddy, AWS ALB, Cloudflare). It is free and delivers 10-30% page-load improvement on resource-heavy sites with no application change. Then enable HTTP/3 for the same hostname so clients on lossy networks (mobile in particular) auto-upgrade via `Alt-Svc`. Cloudflare, Fastly, AWS CloudFront, Google Cloud Load Balancer, and modern Nginx (with the QUIC patches merged in 1.25+) all support it.

```nginx
server {
    listen 443 ssl http2;
    listen 443 quic reuseport;
    add_header Alt-Svc 'h3=":443"; ma=86400';
    http2_max_concurrent_streams 128;
    quic_retry on;
    ssl_protocols TLSv1.3;
}
```

The critical line is `add_header Alt-Svc 'h3=":443"; ma=86400'` — it tells supporting clients (Chrome, Firefox, Safari, Edge) that the same origin also speaks HTTP/3 on UDP/443, and to remember that fact for 24 hours. Connection-management changes from HTTP/1.1 days no longer apply: do not shard your domains (you want connections to coalesce), do not inline tiny images (per-request overhead is gone), and avoid HTTP/2 server push (deprecated; use `103 Early Hints` to prefetch hero assets without the cache-mismatch problems push had). For high-RPS APIs that already saturate CPU on TLS, defer HTTP/3 rollout until your kernel and NIC support QUIC offload — until then the per-packet crypto cost can outweigh the loss-resilience benefit.

## complexity
- **Handshake**:
  - HTTP/1.1 + TLS 1.2: 3 RTT.
  - HTTP/2 + TLS 1.3: 2 RTT.
  - HTTP/3 (QUIC + TLS 1.3): 1 RTT cold; **0 RTT** on resumption (with replay-safe requests only).
- **Multiplexing**: HTTP/2 = unlimited streams per connection, HTTP/3 same.
- **Encryption**: HTTP/2 typically TLS 1.2/1.3 (cleartext h2c exists but no browser uses it). HTTP/3 is encrypted by definition (QUIC includes TLS 1.3).

## pitfalls
- **Assuming HTTP/2 fixes HoL completely**: it doesn't — TCP's HoL is still in the path.
- **Enabling HTTP/3 on internal services without QUIC support throughout**: QUIC traffic looks weird to many DPIs and middleboxes; some networks block it.
- **Server push abuse**: pushing resources the client already cached wastes bandwidth and bloats memory. The mechanism is effectively dead.
- **Mixing HTTP/3 with very-strict firewalls**: enterprise environments often block UDP 443.
- **Debugging tools**: most HTTP debuggers are designed for HTTP/1.1; H2/H3 require specialized tooling (Wireshark + key-log files, h2spec, curl --http3).

## interviewTips
- For "design a high-throughput website" — bring up HTTP/2 multiplexing immediately, then HTTP/3 for mobile / lossy networks.
- Mention **head-of-line blocking** by name — it's the canonical motivation for HTTP/3.
- Know **0-RTT resumption** is replay-safe ONLY for idempotent requests. Don't put state-changing POSTs in 0-RTT.
- For senior interviews, discuss **QUIC connection migration** (Wi-Fi → cellular without dropping connections) as a unique HTTP/3 win.

## code.python
```python
# httpx supports HTTP/2 directly; HTTP/3 requires aioquic.
import httpx
with httpx.Client(http2=True) as client:
    r = client.get('https://example.com/')
    print(r.http_version)   # 'HTTP/2'
```

## code.javascript
```javascript
// Node 21+ supports HTTP/2 natively; HTTP/3 via undici.
const http2 = require('http2');
const session = http2.connect('https://example.com');
const req = session.request({ ':path': '/' });
req.on('response', headers => console.log(headers[':status']));
req.on('end', () => session.close());
```

## code.java
```java
// Java 11+ http client supports HTTP/2; HTTP/3 via third-party libraries.
import java.net.URI;
import java.net.http.*;
HttpClient client = HttpClient.newBuilder().version(HttpClient.Version.HTTP_2).build();
HttpResponse<String> r = client.send(
    HttpRequest.newBuilder(URI.create("https://example.com/")).build(),
    HttpResponse.BodyHandlers.ofString());
System.out.println(r.version());
```

## code.cpp
```cpp
// Most C++ HTTP libraries support HTTP/2 (cpr, Beast); HTTP/3 via msquic / quiche.
// Configuration is library-specific; sketching the intent only.
```
