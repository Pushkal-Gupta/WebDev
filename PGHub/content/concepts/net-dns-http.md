---
slug: net-dns-http
module: computer-networks
title: DNS & the HTTP Lifecycle
subtitle: How a typed-in name becomes an IP address through a hierarchy of name servers, then how the browser fetches the page with an HTTP request and response.
difficulty: Beginner
position: 4
estimatedReadMinutes: 14
prereqs: [net-tcp-reliability]
relatedProblems: []
references:
  - title: "Kurose & Ross — Computer Networking companion site"
    url: "https://gaia.cs.umass.edu/kurose_ross/index.php"
    type: book
  - title: "Cloudflare Learning Center — What is DNS?"
    url: "https://www.cloudflare.com/learning/dns/what-is-dns/"
    type: article
  - title: "Cloudflare Learning Center — What is HTTP?"
    url: "https://www.cloudflare.com/learning/ddos/glossary/hypertext-transfer-protocol-http/"
    type: article
  - title: "MDN — An overview of HTTP"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"
    type: article
  - title: "RFC 9110 — HTTP Semantics"
    url: "https://www.rfc-editor.org/rfc/rfc9110"
    type: spec
  - title: "RFC 1035 — Domain Names: Implementation and Specification"
    url: "https://www.rfc-editor.org/rfc/rfc1035"
    type: spec
status: published
---

## intro
You type `example.com` into a browser and a page appears. Two distinct machines turn that into reality. First, **DNS** — the Domain Name System — translates the human-friendly name into a numeric IP address, because routers only know how to forward packets to addresses, not names. Second, **HTTP** — the HyperText Transfer Protocol — runs over the connection to that address and carries the actual request for a page plus the server's reply. This lesson follows the whole chain: how a name is resolved by walking a hierarchy of name servers, how caching makes the second visit nearly instant, and how an HTTP request and response are structured, status-coded, and revalidated.

## whyItMatters
Almost every networked action a user takes begins with these two steps, so they sit on the critical path of perceived speed. A slow or misconfigured DNS lookup adds dead time before a single byte of content moves; a missing cache header forces a full re-download of content that never changed. Understanding the request/response model is also the foundation for everything built on top of the web: REST APIs, CDNs, load balancers, authentication flows, and browser security all speak HTTP and depend on its status codes and headers behaving predictably. Interviewers reach for "what happens when you type a URL and press enter" precisely because a good answer touches DNS, TCP, TLS, HTTP, and caching in one coherent story — it reveals whether a candidate sees the network as a connected system rather than a set of disconnected facts.

## intuition
Think of DNS as a phone book, but one so large that no single book could hold it — so it is split into a hierarchy and you look things up by walking down it. The name `www.example.com` is read right-to-left as a path: the **root** at the top knows who is responsible for each top-level domain; the **TLD** server for `.com` knows who is responsible for `example.com`; and that domain's **authoritative** server holds the actual record mapping `www.example.com` to an IP. Your computer does not walk this tree itself. It hands the whole question to a **recursive resolver** (usually run by your ISP or a public service), and the resolver does the legwork — asking the root, then the TLD, then the authoritative server in turn (these are **iterative** queries, each one returning a referral to the next server down), until it has the answer to hand back to you.

The magic that makes the web fast is **caching with a TTL**. Every record carries a time-to-live: a number of seconds it may be remembered. After the first lookup, the resolver caches the answer, your operating system caches it, and the browser caches it too. The second time you visit, the walk down the hierarchy is skipped entirely — the answer comes straight from a nearby cache in microseconds instead of multiple network round-trips.

Once the IP is known, **HTTP** is just a structured note exchanged over the connection. The browser writes a request: a line saying *what* it wants (`GET /index.html`), a set of **headers** giving context (which host, what formats it accepts, any cached validators), and an optional body. The server writes back a reply: a **status line** with a code summarizing the outcome, its own headers, and the body — the HTML, image, or JSON. The whole conversation is request-then-reply, and the status code is the one-glance summary of how it went.

## visualization
```
DNS resolution of  www.example.com   (first visit, cache MISS)

  Browser ── "what is www.example.com?" ──> Recursive Resolver
                                                 |
       ask Root .......... "ask the .com TLD server" <─ referral
       ask .com TLD ...... "ask ns1.example.com"     <─ referral
       ask Authoritative . "A  www.example.com 93.184.216.34  TTL 3600"
                                                 |
  Browser <────────── 93.184.216.34 ────────────┘   (now cached)

HTTP request                         HTTP response
  GET /index.html HTTP/1.1             HTTP/1.1 200 OK
  Host: www.example.com                Content-Type: text/html
  Accept: text/html                    Cache-Control: max-age=600
  If-None-Match: "a1b2c3"              ETag: "a1b2c3"
  (blank line)                         (blank line)
                                       <html> ... </html>
```

## bruteForce
The naive way to map names to addresses is a single global file: one big `hosts` table listing every name and its IP, copied to every machine. This is literally how the early ARPANET worked — a `HOSTS.TXT` file maintained centrally and downloaded by everyone. It needs no protocol and no servers: resolving a name is a local lookup. But it does not scale on any axis. Every new host or address change requires editing the one file and redistributing it to the entire network, so updates are slow and conflicts are constant. There is a single point of failure and a single bottleneck for the whole namespace, and there is no notion of caching or delegation — every machine carries the entire world's records whether it needs them or not. With millions of domains changing constantly, a flat global file is hopeless.

## optimal
The scalable design replaces the flat file with **hierarchical delegation plus caching**. The namespace is a tree; authority over each branch is delegated to whoever owns it. The root servers delegate each top-level domain (`.com`, `.org`, country codes) to TLD operators, who in turn delegate each registered domain to its owner's **authoritative** name servers. No single server holds everything — each holds only its slice and points down to the next. To resolve a name, your machine asks a **recursive resolver**, which performs **iterative** queries: it asks the root (gets a referral to the TLD), asks the TLD (gets a referral to the authoritative server), and asks the authoritative server (gets the final record). Records come in types: **A** maps a name to an IPv4 address, **AAAA** to IPv6, and **CNAME** aliases one name to another so it can be re-resolved. Every answer carries a **TTL**, and the result is cached at multiple levels — resolver, OS, and browser — so repeat lookups skip the walk entirely. This is what makes DNS both globally distributed and fast.

Once the address is known, **HTTP** carries the content. The client sends a **request line** (method + path + version), **headers**, and an optional body; the server returns a **status line**, headers, and a body. Methods express intent: `GET` reads, `POST` submits, `PUT`/`PATCH` update, `DELETE` removes, `HEAD` fetches headers only. The **status code** classes summarize the result: `1xx` informational, `2xx` success (`200 OK`), `3xx` redirection (`301` moved permanently, `304 Not Modified`), `4xx` client error (`404 Not Found`), `5xx` server error (`500`). **Caching** mirrors DNS's idea: `Cache-Control: max-age=N` tells the client how long a response stays fresh, and **conditional requests** revalidate cheaply — the client sends `If-None-Match` with the stored `ETag` (or `If-Modified-Since` with a date), and if nothing changed the server replies `304 Not Modified` with no body, saving the whole download. Modern transports layer on top without changing this model: **HTTPS** wraps HTTP in **TLS** for encryption, and **HTTP/2** and **HTTP/3** multiplex many requests over one connection (HTTP/3 over QUIC/UDP) for lower latency.

## complexity
time: A cold DNS resolution costs up to three network round-trips down the hierarchy (root, TLD, authoritative); a warm lookup is a single cache read, effectively O(1). An HTTP exchange is one round-trip for the request/response after the connection (plus the TCP and TLS handshakes on a fresh connection).
space: Caches are bounded by the number of distinct records times their entry size, with TTL-based eviction. An HTTP message's size is dominated by its body; headers add a small, bounded overhead.
notes: Total page latency is the sum of independent round-trips — \( L \approx \text{RTT}_{\text{DNS}} + \text{RTT}_{\text{TCP}} + \text{RTT}_{\text{TLS}} + \text{RTT}_{\text{HTTP}} \) — which is why caching the DNS answer and reusing connections (keep-alive, HTTP/2 multiplexing) matter so much.

## pitfalls
- Confusing the resolver's recursive query with the iterative queries it makes. Your machine asks the recursive resolver *one* question and waits for the final answer; the resolver then makes several iterative queries down the hierarchy, each returning a referral rather than the answer. Mixing these up is the most common DNS interview slip.
- Forgetting that a stale DNS cache is governed by TTL, not by you. After changing a domain's IP, old answers persist in resolver and OS caches until their TTL expires — which is why DNS changes "take time to propagate." Lowering the TTL *before* a planned change is the fix.
- Treating `301` and `302` as interchangeable, or `304` as an error. `301` is a permanent redirect (cacheable, updates bookmarks); `302`/`307` are temporary; `304 Not Modified` is a *success* path that tells the client to use its cached copy — there is no body and nothing went wrong.
- Sending a conditional request without storing the validator. `If-None-Match` only works if you kept the `ETag` from the earlier response (and `If-Modified-Since` needs the `Last-Modified` date). Without the stored validator the server cannot answer `304` and must resend the whole body.
- Assuming `GET` and `POST` differ only in where parameters go. `GET` is meant to be safe and idempotent (no side effects, repeatable), so it is cacheable and can be retried freely; `POST` is neither, so browsers warn before resubmitting it. Using `GET` for an action that changes state is a real bug, not a style choice.

## interviewTips
- For "what happens when you type a URL and hit enter," narrate the pipeline in order: DNS resolve (resolver walks root, TLD, authoritative, with caching), TCP handshake, TLS handshake for HTTPS, then the HTTP request/response, and mention caching at each layer. Breadth in the right order beats depth on one piece.
- When asked how DNS scales, lead with the two mechanisms together: hierarchical delegation (no server holds everything) and TTL-based caching at resolver/OS/browser (most lookups never reach the authoritative server). One without the other misses the point.
- Be ready to explain conditional requests concretely: client stores an `ETag`, re-requests with `If-None-Match`, server compares and returns `304` with no body if unchanged. It shows you understand HTTP caching as a round-trip saver, not just a header.

## keyTakeaways
- DNS turns a name into an IP by walking a hierarchy — a recursive resolver issues iterative queries to the root, the TLD, then the authoritative server — and TTL-based caching at the resolver, OS, and browser makes repeat lookups nearly free.
- HTTP is a request/response protocol: the client sends a method, path, headers, and optional body; the server replies with a status line, headers, and body, where the status-code class (2xx/3xx/4xx/5xx) summarizes the outcome at a glance.
- HTTP caching mirrors DNS caching: `Cache-Control` sets freshness and conditional requests (`If-None-Match` + `ETag`) let an unchanged resource return `304 Not Modified` with no body, saving the full download.

## code.python
```python
# A raw HTTP/1.1 GET over a TCP socket, plus a DNS lookup — no high-level library.
import socket

host = "example.com"

# 1) DNS: resolve the name to an IP (this is what gethostbyname walks for us).
ip = socket.gethostbyname(host)
print("resolved", host, "->", ip)

# 2) HTTP: open a TCP connection and write a request by hand.
with socket.create_connection((ip, 80), timeout=5) as sock:
    request = (
        f"GET / HTTP/1.1\r\n"
        f"Host: {host}\r\n"          # required in HTTP/1.1 (virtual hosting)
        f"Accept: text/html\r\n"
        f"Connection: close\r\n"     # let the server close when done
        f"\r\n"                      # blank line ends the headers
    )
    sock.sendall(request.encode("ascii"))

    # 3) Read the response and split the status line + headers from the body.
    raw = b""
    while chunk := sock.recv(4096):
        raw += chunk

head, _, body = raw.partition(b"\r\n\r\n")
status_line, *headers = head.decode("iso-8859-1").split("\r\n")
print(status_line)                   # e.g. HTTP/1.1 200 OK
print(len(body), "bytes of body")
```

## code.javascript
```javascript
// Node's low-level http module: build a GET request and parse the response.
import http from "node:http";
import dns from "node:dns/promises";

const host = "example.com";

// DNS: resolve A records explicitly so we can see the address.
const { address } = await dns.lookup(host);
console.log("resolved", host, "->", address);

// HTTP: send a conditional GET. If we held an ETag, the server could reply 304.
const req = http.request(
  { host, path: "/", method: "GET", headers: { Accept: "text/html" } },
  (res) => {
    console.log("status", res.statusCode); // 200, 301, 304, 404, ...
    console.log("cache-control", res.headers["cache-control"]);
    console.log("etag", res.headers.etag);
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => console.log(body.length, "bytes of body"));
  },
);
req.end();
```

## code.java
```java
// HttpURLConnection: a GET with a conditional header, reading the status + body.
import java.io.*;
import java.net.*;

public class HttpGet {
    public static void main(String[] args) throws IOException {
        // DNS: resolve the host to its address.
        InetAddress addr = InetAddress.getByName("example.com");
        System.out.println("resolved -> " + addr.getHostAddress());

        URL url = new URL("http://example.com/");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Accept", "text/html");
        // If we had stored one, an ETag here enables a 304 Not Modified reply.
        // conn.setRequestProperty("If-None-Match", "\"a1b2c3\"");

        int code = conn.getResponseCode();          // 200, 301, 304, 404, 500...
        System.out.println("status " + code + " " + conn.getResponseMessage());
        System.out.println("Cache-Control: " + conn.getHeaderField("Cache-Control"));

        if (code == HttpURLConnection.HTTP_NOT_MODIFIED) {
            System.out.println("use cached copy");   // no body to read
        } else {
            try (var in = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                long bytes = in.lines().mapToInt(String::length).sum();
                System.out.println(bytes + " chars of body");
            }
        }
    }
}
```

## code.cpp
```cpp
// POSIX sockets: resolve a name with getaddrinfo, then write a raw HTTP/1.1 GET.
#include <iostream>
#include <string>
#include <cstring>
#include <netdb.h>
#include <unistd.h>
#include <sys/socket.h>

int main() {
    const char* host = "example.com";

    // DNS: getaddrinfo walks the resolver for us and returns socket-ready addresses.
    addrinfo hints{}, *res;
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    if (getaddrinfo(host, "80", &hints, &res) != 0) { perror("getaddrinfo"); return 1; }

    int fd = socket(res->ai_family, res->ai_socktype, res->ai_protocol);
    if (connect(fd, res->ai_addr, res->ai_addrlen) != 0) { perror("connect"); return 1; }

    // HTTP: write the request line + headers, end with a blank line.
    std::string req =
        "GET / HTTP/1.1\r\n"
        "Host: example.com\r\n"
        "Accept: text/html\r\n"
        "Connection: close\r\n\r\n";
    send(fd, req.data(), req.size(), 0);

    // Read the start of the response: the status line tells us how it went.
    char buf[4096];
    ssize_t n = recv(fd, buf, sizeof(buf) - 1, 0);
    if (n > 0) { buf[n] = '\0'; std::cout << std::string(buf, 0, 64) << "\n"; } // HTTP/1.1 200 OK ...

    freeaddrinfo(res);
    close(fd);
}
```
