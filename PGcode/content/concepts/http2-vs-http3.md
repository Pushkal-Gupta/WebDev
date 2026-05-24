---
slug: http2-vs-http3
module: cs-core
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
Page-load performance: a modern site might pull 80 resources. Over HTTP/1.1 with browser parallelism = 6 connections, that's a queue. HTTP/2 cut that to one connection but a single lost TCP packet would stall every stream. HTTP/3 over QUIC isolates loss per-stream — one dropped packet only affects the one stream that needed it. For lossy mobile networks the difference is dramatic. Operationally: HTTP/3 also gets you 0-RTT resumption, connection migration across IPs (Wi-Fi → 5G handoff without dropping requests), and TLS 1.3 baked in.

## intuition
- **HTTP/2**: one TCP connection, many simultaneous "streams." Frames from different streams are interleaved on the wire. A single TCP loss blocks delivery of all subsequent bytes until TCP retransmits — even for unrelated streams. This is HoL blocking.
- **HTTP/3**: built on QUIC (which runs on UDP). Each stream is independently reliable inside QUIC. Loss in stream A doesn't block stream B.

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
**Enable HTTP/2** at the load balancer (Nginx, Envoy, ALB). Free 10–30% on page-load for resource-heavy sites. No code change needed.

**Enable HTTP/3** for clients on lossy networks (mobile users in particular). Browsers (Chrome, Firefox, Safari, Edge) auto-upgrade via the `Alt-Svc: h3=":443"` header. Cloudflare and Fastly support it out of the box.

**Connection management changes** with HTTP/2 / HTTP/3:
- Don't shard your domains anymore — you want connections to coalesce.
- Stop inlining small images; the per-request overhead is gone.
- Server push exists in HTTP/2 (deprecated in HTTP/3); use only with caution (clients can already cache and 103-Early-Hints solves most of the same problem).

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
