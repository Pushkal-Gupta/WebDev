---
slug: http2-multiplex
module: cs-network-protocols
title: HTTP/2 Multiplexing
subtitle: Many streams on one TCP connection — and the head-of-line blocking that hides inside.
difficulty: Intermediate
position: 52
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "HTTP/2 Specification — RFC 7540"
    url: "https://http2.github.io/http2-spec/"
    type: blog
  - title: "HTTP/2 Multiplexing — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/http-2-multiplexing/"
    type: blog
  - title: "nginx HTTP/2 module"
    url: "https://github.com/nginx/nginx"
    type: repo
status: published
---

## intro
HTTP/1.1 serializes requests per TCP connection — one in flight at a time. Browsers worked around this by opening 6 parallel sockets per origin. HTTP/2 replaces that with multiplexing: one connection, many concurrent *streams*. Each request and response is a stream of frames, interleaved on the wire and reassembled by the receiver. Header compression (HPACK), server push, and stream prioritization round out the protocol. The win is dramatic — until TCP's head-of-line blocking spoils it.

## whyItMatters
- **RFC 7540 (HTTP/2, 2015)** and **RFC 9113 (HTTP/2 revised, 2022)** standardize the protocol; over 95% of HTTPS traffic on the public internet uses HTTP/2 or HTTP/3 (Cloudflare, Google traffic data).
- **gRPC's transport layer** is HTTP/2 — every Stubby-derived RPC framework relies on stream multiplexing and HEADERS/DATA framing.
- **Nginx, HAProxy, Envoy, IIS, Apache, Caddy** all ship HTTP/2 support; **Akamai, Cloudflare, Fastly** terminate HTTP/2 at the edge for billions of daily requests.
- **HTTP/3 (RFC 9114)** replaces TCP with QUIC over UDP precisely to escape TCP head-of-line blocking; Cloudflare reports 30% of their traffic on HTTP/3 in 2024. Knowing the HOL trade-off separates "read a blog" from "shipped it."

## intuition
HTTP/1.1 serializes requests per TCP connection — **one request in flight at a time per connection**. Browsers worked around this by opening up to 6 parallel TCP connections per origin (per the RFC 2616 hint, but enforced by browser convention). Each parallel connection paid its own TCP and TLS handshake cost (3 RTTs per connection), competed with siblings for bandwidth (TCP congestion-control instances fighting each other), and serialized requests within itself. Header bytes repeated verbatim on every request — cookies alone often exceeded body size on cookie-heavy sites.

**HTTP/2 (RFC 7540) replaces this with multiplexing**: one TLS-encrypted TCP connection per origin, with many concurrent **streams** flowing over it. Each request and response is a stream of typed **frames** (HEADERS, DATA, WINDOW_UPDATE, RST_STREAM, ...) tagged with a numeric stream-id; the server and client interleave frames from different streams on the wire and demultiplex by stream-id on the receiver. Stream concurrency is bounded by the server's advertised `SETTINGS_MAX_CONCURRENT_STREAMS` (typically 100-128). Header compression (**HPACK**) uses a shared dynamic table so repeated headers (cookies, content-type) cost a few bytes instead of hundreds. Stream priority hints let the client mark "render-blocking CSS is urgent, lazy-load images can wait."

The drive-through analogy: HTTP/1.1 is a single-lane drive-through where cars queue, one at a time; a slow order blocks everyone behind. HTTP/2 widens it to many lanes (streams) over one road (TCP connection). Cars can interleave — fast orders zip past slow ones. The win is dramatic for the common case of many small requests (HTML + 50 images + 20 JS files).

**But there is a catch the protocol cannot fix**: TCP itself still delivers bytes in strict order. If one TCP packet is lost mid-stream, the kernel refuses to deliver any subsequent bytes — even bytes belonging to **other** HTTP/2 streams — until the retransmit arrives in order. This is **TCP head-of-line (HOL) blocking**, and HTTP/2 multiplexing makes it worse than HTTP/1.1's 6-connection model: one lost packet now stalls all 100 streams on the single connection, where it would have stalled only 1/6 of the requests before. The interview question "does HTTP/2 solve HOL blocking?" has a one-line answer: "at the HTTP layer, yes; at the TCP layer, no — and that's exactly why HTTP/3 moved to QUIC over UDP."

## visualization
Trace two parallel requests for /a.json (small) and /b.bin (large) under HTTP/2: client opens one TLS connection. Sends HEADERS frame for stream 1 (/a) and stream 3 (/b). Server begins responding: DATA frames for stream 3 (large body, many frames) interleave with DATA frames for stream 1. Client demultiplexes by stream-id and finishes /a long before /b. Now drop one TCP packet mid-stream: even though /a's frames arrived in full, TCP refuses to deliver subsequent bytes (including more /a frames if any) until the retransmit. Both streams stall.

## bruteForce
HTTP/1.1 over 6 parallel TCP connections per origin. Each connection independently does TCP and TLS handshakes (6× setup cost), competes with the others for bandwidth (TCP congestion-control fights itself), and serializes requests within each connection (head-of-line at the request layer). Header bytes repeat verbatim on every request — your cookies alone often exceed the body size. Wasteful and fragile.

## optimal
The right configuration is **HTTP/2 over a single TLS connection per origin, with HPACK enabled, sensible `MAX_CONCURRENT_STREAMS`, small DATA frames for interleaving, and HTTP/3 for latency-critical mobile / lossy-network paths**.

```nginx
# nginx HTTP/2 + HTTP/3 (h3) example.
server {
    listen 443 ssl http2;                    # HTTP/2 over TLS
    listen 443 quic reuseport;               # HTTP/3 over QUIC/UDP
    add_header Alt-Svc 'h3=":443"; ma=86400'; # advertise HTTP/3 support

    http2_max_concurrent_streams 128;        # cap per-connection concurrency
    http2_chunk_size 8k;                     # smaller DATA frames -> better interleaving
    keepalive_requests 10000;                # reuse connection across many requests

    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    ssl_protocols TLSv1.3;                   # HTTP/2 requires TLS 1.2+; HTTP/3 requires TLS 1.3
}
```

Why this is right: a **single TLS connection per origin** plus multiplexing eliminates the 6-connection handshake cost of HTTP/1.1 (saving 5 RTTs of TCP+TLS), shares one TCP congestion window (no self-contention), and lets HPACK's dynamic table amortize header overhead across hundreds of requests. **Slicing DATA frames small** (8 KB instead of 16 KB max) improves interleaving so urgent stream 1 frames are not stuck behind a 16 KB DATA frame for stream 7. **`MAX_CONCURRENT_STREAMS` of 100-128** balances client concurrency against server resource cost (each stream consumes a few KB of state).

**HPACK details that matter**:
- Dynamic table default size is 4 KB; tune up to 64 KB for cookie-heavy or header-heavy workloads.
- A misbehaving intermediary that strips headers can corrupt the HPACK dynamic table and break every subsequent request on the connection — use HPACK-aware proxies.
- HPACK is also why HTTP/2 makes header injection attacks (CRLF injection) impossible — headers are framed, not newline-delimited.

**When to prefer HTTP/3 (RFC 9114)**:
- **Mobile / lossy networks**: TCP's HOL blocking hurts most when packet loss is non-trivial (>0.5%). QUIC's per-stream flow control eliminates this — a lost packet on stream 5 does not stall stream 7.
- **Connection migration**: QUIC connections survive IP changes (Wi-Fi to LTE handoff); TCP connections do not.
- **0-RTT resumption**: QUIC can carry application data in the very first packet on a return visit; TCP requires a fresh handshake. Big win for repeated short connections.
- **Browser support**: Chrome, Firefox, Safari, Edge all ship HTTP/3 in 2024; Cloudflare reports >30% of their traffic on HTTP/3.

**Anti-patterns and gotchas**:
- **Believing HTTP/2 fully solves HOL** — it solves application-layer HOL only. TCP still serializes the byte stream, so one lost packet stalls every multiplexed stream on the connection. HTTP/3 is the actual fix.
- **Counting on Server Push** for performance — almost every browser disabled it because it usually duplicated cached resources. Use **103 Early Hints** (RFC 8297) instead, which is a server-driven preload hint without the cache-busting downsides.
- **Long-polling and streaming endpoints on a shared connection**: they hold a stream open and, with poor priority configuration, can starve other streams. Either use a dedicated connection for streams or set per-stream weights explicitly.
- **HTTP/2 cleartext (h2c)** without TLS: technically valid but browsers refuse to use it; in production, always layer over TLS. The handshake uses ALPN to negotiate h2 during the TLS hello.
- **Counting frames as round-trips**: each stream's HEADERS + DATA + END_STREAM is one logical request, not multiple round-trips. The protocol's win is exactly that frames flow without per-frame acks.

## complexity
time: setup ~ 1 TCP RTT + 1-2 TLS RTTs (then reused for all streams); per-request overhead ~ a few HPACK bytes
space: ~ 64 KB per connection for stream state + HPACK dynamic table (default 4 KB)
notes: SETTINGS frames negotiate connection-wide limits at handshake. Window-update frames implement per-stream and per-connection flow control independent of TCP's flow control.

## pitfalls
- Believing HTTP/2 fully solves HOL — it solves it at the application layer only. TCP still serializes the bytes underneath, so a single lost packet stalls every stream.
- Mismatched frame sizes: a server sending one giant DATA frame for stream 5 monopolizes the wire and delays urgent stream 1 frames waiting behind it. Slice DATA frames small.
- HPACK table desync: a misbehaving intermediary that strips headers can corrupt the dynamic table and break every subsequent request on the connection.
- Counting on Server Push for performance — almost every browser disabled it because it usually duplicated cached resources. Use 103 Early Hints instead.

## interviewTips
- Lead with "HTTP/2 multiplexes streams over one TCP; HTTP/3 multiplexes over QUIC/UDP to escape TCP HOL." That single sentence frames the topic.
- Mention HPACK by name — interviewers want to hear it.
- Explain why HTTP/1.1 used 6 connections (per-spec hint, browser convention) and why HTTP/2 dropped it (one connection is more friendly to TCP congestion control).
- If asked when to *not* use HTTP/2, mention long-polling and streaming endpoints — they can starve other streams on the same connection if priority is mishandled.

## code.python
```python
import httpx

with httpx.Client(http2=True) as client:
    r1 = client.get('https://nghttp2.org/httpbin/get')
    r2 = client.get('https://nghttp2.org/httpbin/headers')
    print(r1.http_version, r1.status_code)
    print(r2.http_version, r2.status_code)
```

## code.javascript
```javascript
const http2 = require('http2');

const client = http2.connect('https://nghttp2.org');
for (const path of ['/httpbin/get', '/httpbin/headers', '/httpbin/ip']) {
  const req = client.request({ ':path': path });
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => console.log(path, body.length));
  req.end();
}
setTimeout(() => client.close(), 3000);
```

## code.java
```java
import java.net.URI;
import java.net.http.*;

public class Http2Demo {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newBuilder().version(HttpClient.Version.HTTP_2).build();
        String[] paths = {"/get", "/headers", "/ip"};
        for (String p : paths) {
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://httpbin.org" + p)).build();
            client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                  .thenAccept(r -> System.out.println(p + " " + r.version() + " " + r.statusCode()));
        }
        Thread.sleep(3000);
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <string>

struct Http2Stream {
    int id;
    std::string path;
    bool done = false;
};

int main() {
    Http2Stream s1{1, "/a.json"}, s3{3, "/b.bin"};
    std::cout << "stream " << s1.id << " HEADERS sent\n";
    std::cout << "stream " << s3.id << " HEADERS sent\n";
    std::cout << "stream " << s1.id << " DATA frame 1/1 (END_STREAM)\n";
    std::cout << "stream " << s3.id << " DATA frame 1/40\n";
    std::cout << "interleaved on one TCP connection via multiplexing\n";
}
```
