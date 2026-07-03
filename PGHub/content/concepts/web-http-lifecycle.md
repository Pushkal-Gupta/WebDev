---
slug: web-http-lifecycle
module: web-fundamentals
title: The HTTP Request Lifecycle
subtitle: Every step between typing a URL and seeing a page — address lookup, connection, encryption, request, response, and the caching that skips the whole trip next time.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 15
prereqs: [web-html-dom-tree]
relatedProblems: []
references:
  - title: "MDN — An overview of HTTP"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"
    type: article
  - title: "MDN — HTTP response status codes"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status"
    type: article
  - title: "MDN — HTTP caching"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching"
    type: article
  - title: "web.dev — Prevent unnecessary network requests with the HTTP Cache"
    url: "https://web.dev/articles/http-cache"
    type: article
  - title: "RFC 9110 — HTTP Semantics"
    url: "https://www.rfc-editor.org/rfc/rfc9110"
    type: spec
status: published
---

## intro
Type an address, press Enter, and a page appears — but between those two moments the browser runs a precise sequence of network steps, each one a prerequisite for the next. The name in the bar has to become a numeric IP address, a connection has to be opened to that address, that connection usually has to be encrypted, and only then can a request go out and a response come back. This lesson walks that sequence end to end: URL parsing, DNS resolution, the TCP handshake, the TLS handshake, the shape of an HTTP request and response, the meaning of status codes and headers, and the caching model that lets the browser skip most of the work the second time around.

## whyItMatters
Almost everything you build or debug on the web rides on this pipeline, so knowing where the time goes is knowing where to optimise and where to look when it breaks. A slow first paint might be DNS, a stalled TCP connection, an expensive TLS handshake, a redirect chain, or a server that took two seconds to respond — and each has a completely different fix. Reading a status code correctly tells you whether the problem is your request, the server, or a proxy in between. Understanding caching headers is the difference between a site that feels instant on repeat visits and one that re-downloads a megabyte of unchanged assets every time. Interviewers ask "what happens when you type a URL" precisely because a good answer touches DNS, transport, security, and application semantics in one coherent story — it shows you understand the whole stack rather than one corner of it.

## intuition
Picture ordering a specific part from a warehouse on the other side of the world. You know the company's name, but a name is not a location — so first you look the company up in a directory to get its street address. That lookup is **DNS**: the browser turns `example.com` into an IP address like `93.184.216.34`, asking a chain of name servers until one answers, and remembering the answer for a while so it need not ask again.

Now you have an address but no way to talk yet. You place a phone call to the warehouse and wait for them to pick up and confirm the line is clear — a short back-and-forth of "can you hear me?" / "yes, can you?" / "yes." That is the **TCP three-way handshake**: SYN, SYN-ACK, ACK, three messages that establish a reliable, ordered channel before any real data flows. Because the warehouse handles sensitive orders, you also agree on a secret code so nobody eavesdropping on the line can read your order — the two sides prove identity and negotiate encryption keys. That is the **TLS handshake**, and it costs another round trip or two.

Only now do you actually place the order. You say exactly what you want and how: "I'd like to **GET** part number `/index.html`, here is my account info and what formats I accept." That is the **HTTP request** — a method, a path, and headers. The warehouse processes it and ships back a package with a label on top: "**200 OK**, here is your part, it weighs this much, it's this type, and you may keep it on your shelf for a week." That label is the **status line and response headers**; the part inside is the **body**.

The clever part is the shelf. Because the label said you may keep the part for a week, next time you need it you skip the directory lookup, the phone call, the secret code, and the shipping entirely — you just take it off your own shelf. That is **caching**, and it is why a page that took a full trip the first time loads instantly the second.

## visualization
```
  YOU TYPE:  https://example.com/index.html
      |
      v
  [1] URL PARSE     browser splits scheme=https host=example.com path=/index.html
      |
      v
  [2] DNS LOOKUP    resolver: example.com  ->  93.184.216.34   (cached by TTL)
      |
      v
  [3] TCP HANDSHAKE  SYN  ->   <- SYN-ACK   ACK ->   (channel open)
      |
      v
  [4] TLS HANDSHAKE  hello / cert / keys    (encryption agreed, https only)
      |
      v
  [5] HTTP REQUEST   GET /index.html   Host: example.com   headers...
      |
      v
  [6] HTTP RESPONSE  200 OK   Content-Type: text/html   Cache-Control...  <body>
      |
      v
  [7] RENDER         parse HTML -> fetch css/js/img (reuse connection) -> paint
```

## bruteForce
The naive way to fetch a page is to treat every single resource as if it were the very first request ever made: open a brand-new TCP connection for the HTML, tear it down, open another for the stylesheet, another for each image, running the full DNS lookup and TLS handshake every time, and re-downloading identical files on every visit because nothing is remembered. This is how the earliest web worked, and it is catastrophically slow — a page with forty assets pays forty handshakes, each costing multiple round trips, and a returning visitor re-fetches bytes that never changed. Every avoidable round trip is latency the user feels directly.

## optimal
The real pipeline removes redundant work at every stage. **URL parsing** splits the address into scheme, host, optional port, path, and query. **DNS** resolves the host to an IP, but the answer is cached at the OS and browser for its TTL, so most lookups are free. The **TCP three-way handshake** (SYN, SYN-ACK, ACK) establishes one reliable channel, and crucially that same connection is **kept alive and reused** for many requests rather than reopened per resource. Over HTTPS, the **TLS handshake** then negotiates keys and verifies the server's certificate; session resumption lets repeat connections skip most of it.

Then comes **HTTP itself**. A request is a **method** (`GET` to read, `POST` to create, `PUT` to replace, `PATCH` to modify, `DELETE` to remove, `HEAD` for headers only), a **path**, **headers** (`Host`, `Accept`, `Authorization`, `Cookie`, `User-Agent`), and an optional **body**. The response opens with a **status line** whose code falls into five classes: **1xx** informational, **2xx** success (`200 OK`, `201 Created`, `204 No Content`), **3xx** redirection (`301` permanent, `302` found, `304 Not Modified`), **4xx** client error (`400`, `401`, `403`, `404`), and **5xx** server error (`500`, `502`, `503`). Response headers describe the body (`Content-Type`, `Content-Length`) and control caching.

**Caching** is the biggest win. `Cache-Control: max-age=3600` tells the browser it may reuse a response for an hour with no network trip at all — a "fresh" hit. Once stale, the browser **revalidates** cheaply: it stored the response's `ETag` (a content fingerprint) or `Last-Modified` date, and sends a **conditional request** with `If-None-Match` or `If-Modified-Since`. If nothing changed, the server replies **`304 Not Modified`** with no body, and the browser reuses its copy — a full round trip saved on the payload. This layered model, connection reuse plus caching plus conditional revalidation, is what makes the modern web feel fast.

## complexity
time: A cold first request costs several serial round trips — roughly one RTT for DNS (if uncached), one for the TCP handshake, one or two for TLS, then one for the request/response itself, so latency is dominated by `k · RTT` where `k` is the number of round trips, not by bytes on the wire. A warm request on a reused, already-encrypted connection collapses this to a single RTT, and a fresh cache hit costs zero network round trips.
space: The browser stores DNS answers (bounded by TTL), open connections in a pool, TLS session state, and the response cache keyed by URL. Cache space is capped and evicted, trading disk for avoided round trips.
notes: The lever that matters is round trips, not bandwidth. Cutting DNS, handshake, and redirect hops, reusing connections, and serving from cache attacks the `k · RTT` term directly — which is why caching and connection reuse beat raw throughput for perceived speed.

## pitfalls
- **Blocking on DNS as if it were instant.** An uncached DNS lookup is a real round trip and can stall the whole request. Fix: rely on the OS/browser cache, use sensible TTLs, and preconnect or prefetch DNS (`<link rel="dns-prefetch">`, `rel="preconnect">`) for known third-party hosts.
- **Ignoring the HTTPS handshake cost.** TLS adds round trips on the first connection to a host. Fix: reuse connections instead of opening one per resource, enable session resumption, and avoid scattering assets across many origins that each need a fresh handshake.
- **Confusing 3xx redirects with caching.** A `301`/`302` is a redirect that costs another full request to a new URL; a `304 Not Modified` is a cache revalidation that reuses the body you already have. Fix: read the status class deliberately — a redirect chain is latency to eliminate, a `304` is the cache working correctly.
- **Getting Cache-Control wrong.** `no-cache` does not mean "don't cache" — it means "cache but always revalidate before use"; `no-store` is the one that forbids storage. Setting `max-age` too high on assets that change (or too low on immutable ones) either serves stale content or wastes round trips. Fix: long `max-age` plus content-hashed filenames for static assets, revalidation for HTML.
- **Treating a 200-from-cache as a network hit.** A `200 OK` served from the disk or memory cache never touched the network; assuming every `200` means a fresh server round trip leads to wildly wrong performance conclusions. Fix: check whether the response came from cache (DevTools shows "from disk/memory cache") before blaming or crediting the server.

## interviewTips
- Answer "what happens when you type a URL" as an ordered pipeline — URL parse, DNS, TCP handshake, TLS handshake, HTTP request, response, render — and name what each step costs in round trips, so the interviewer hears that you understand latency, not just the list.
- Be precise about status classes and the caching pair: 2xx success, 3xx redirect, 4xx client error, 5xx server error, and distinguish a `304 Not Modified` (conditional revalidation with `ETag`/`If-None-Match`) from a `301`/`302` redirect. Mixing those up is the classic tell.
- Explain the two caching modes crisply: a *fresh* response (`Cache-Control: max-age`) is reused with zero network trips, while a *stale* one is revalidated with a conditional request that returns `304` and no body — connection reuse plus caching is the answer to "how would you make this faster."

## keyTakeaways
- Loading a URL is a fixed serial pipeline — parse, DNS, TCP, TLS, request, response, render — and its cost is measured in round trips (`k · RTT`), so the biggest speedups come from removing hops, not adding bandwidth.
- HTTP semantics are a method plus path plus headers on the way out, and a status line plus headers plus body on the way back; the five status classes (1xx–5xx) tell you at a glance whether success, redirection, or an error occurred and whose fault it is.
- Caching is the pipeline's escape hatch: `Cache-Control` serves fresh responses with no network trip, and `ETag`/`Last-Modified` conditional requests revalidate stale ones for a cheap `304 Not Modified` instead of re-downloading the body.

## code.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Requests a page triggers</title>
    <!-- Warm up the connection to a known third-party host early. -->
    <link rel="preconnect" href="https://example.com" />
    <!-- A stylesheet request: blocks render until it arrives. -->
    <link rel="stylesheet" href="/styles/main.css" />
  </head>
  <body>
    <h1>The browser fires one request per resource below</h1>
    <!-- An image request: the browser reuses the open connection. -->
    <img src="/images/logo.png" alt="logo" width="120" height="40" />

    <!-- A script request: 'defer' lets HTML finish parsing first. -->
    <script src="/scripts/app.js" defer></script>

    <!-- A programmatic request made from JS, not the markup. -->
    <script>
      fetch('/api/status')
        .then((response) => {
          console.log('status', response.status); // e.g. 200
          console.log('type', response.headers.get('content-type'));
          return response.text();
        })
        .then((body) => console.log('body length', body.length));
    </script>
  </body>
</html>
```

## code.javascript
```javascript
// Fetch a resource, inspect the response, then demonstrate a conditional
// request that lets the server answer 304 Not Modified when nothing changed.
async function loadWithRevalidation(url) {
  // First request: no validators, so the server sends the full body.
  const first = await fetch(url);
  console.log('first status:', first.status); // 200

  const etag = first.headers.get('etag');
  const lastModified = first.headers.get('last-modified');
  const body = await first.text();
  console.log('bytes downloaded:', body.length);
  console.log('cache-control:', first.headers.get('cache-control'));

  // Second request: send the validators we stored. If the resource is
  // unchanged the server replies 304 with no body and we reuse our copy.
  const headers = {};
  if (etag) headers['If-None-Match'] = etag;
  if (lastModified) headers['If-Modified-Since'] = lastModified;

  const second = await fetch(url, { headers, cache: 'no-cache' });
  if (second.status === 304) {
    console.log('304 Not Modified — reused cached body, saved the payload');
    return body; // the copy we already have
  }
  console.log('changed — server sent a fresh body,', second.status);
  return second.text();
}

loadWithRevalidation('https://example.com/index.html')
  .then((html) => console.log('final length:', html.length))
  .catch((err) => console.error('request failed:', err));
```

## code.python
```python
# Send a GET by hand and print the response's structure:
# the status line, then a few headers, then how the body arrives.
import urllib.request
import urllib.error

def fetch(url: str) -> None:
    request = urllib.request.Request(
        url,
        method="GET",
        headers={
            "Accept": "text/html",
            "User-Agent": "pghub-lifecycle-demo/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request) as response:
            # Status line: version-independent code + reason phrase.
            print(f"status: {response.status} {response.reason}")

            # A few response headers that describe the body and caching.
            for name in ("Content-Type", "Content-Length",
                         "Cache-Control", "ETag", "Last-Modified"):
                value = response.headers.get(name)
                if value:
                    print(f"{name}: {value}")

            body = response.read()
            print(f"body bytes: {len(body)}")
    except urllib.error.HTTPError as err:
        # 4xx / 5xx arrive here: still a valid response with a status line.
        print(f"status: {err.code} {err.reason}")

if __name__ == "__main__":
    fetch("https://example.com/index.html")
```
