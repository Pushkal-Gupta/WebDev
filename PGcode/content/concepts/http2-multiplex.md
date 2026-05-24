---
slug: http2-multiplex
module: cs-core
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
Most production HTTP today is HTTP/2 (and increasingly HTTP/3). Knowing the wire format and its failure modes is mandatory for backend, performance, and reliability roles. The classic interview trap: "HTTP/2 solves head-of-line blocking, right?" The answer is "only at the HTTP layer — TCP's HOL blocking remains, which is exactly why HTTP/3 moved to QUIC over UDP." Understanding that nuance separates "I read a blog post" from "I have shipped this."

## intuition
HTTP/1.1 is a single-lane drive-through: cars (requests) line up, one at a time, and a slow order blocks everyone behind. HTTP/2 widens it to many lanes (streams) over one road (TCP connection). Cars can interleave — fast orders zip past slow ones inside the kitchen. But if one car spills oil on the road (a TCP packet is lost), every lane stalls because the road itself is blocked until the spill is cleaned up (the packet is retransmitted and arrives in order).

## visualization
Trace two parallel requests for /a.json (small) and /b.bin (large) under HTTP/2: client opens one TLS connection. Sends HEADERS frame for stream 1 (/a) and stream 3 (/b). Server begins responding: DATA frames for stream 3 (large body, many frames) interleave with DATA frames for stream 1. Client demultiplexes by stream-id and finishes /a long before /b. Now drop one TCP packet mid-stream: even though /a's frames arrived in full, TCP refuses to deliver subsequent bytes (including more /a frames if any) until the retransmit. Both streams stall.

## bruteForce
HTTP/1.1 over 6 parallel TCP connections per origin. Each connection independently does TCP and TLS handshakes (6× setup cost), competes with the others for bandwidth (TCP congestion-control fights itself), and serializes requests within each connection (head-of-line at the request layer). Header bytes repeat verbatim on every request — your cookies alone often exceed the body size. Wasteful and fragile.

## optimal
HTTP/2 over a single connection per origin. HPACK compresses header sets using a shared dynamic table — cookies and other repeats cost a few bytes. Streams are bidirectional and concurrent up to the server-advertised limit (typically 100-128). Stream priority hints let the client mark "render-blocking CSS is urgent, lazy-load images are background." Server push (now largely deprecated) lets servers pre-send associated resources. For latency-sensitive workloads where packet loss is common, prefer HTTP/3 (QUIC over UDP) which removes TCP-level HOL entirely.

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
