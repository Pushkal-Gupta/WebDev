---
slug: dns-prefetch
module: sd-network
title: DNS Prefetch and Preconnect
subtitle: Hide DNS, TCP, and TLS latency before the user clicks — the cheapest page-speed win.
difficulty: Beginner
position: 45
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Resource Hints — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/html-resource-hints/"
    type: blog
  - title: "OSTEP — I/O Devices"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/file-devices.pdf"
    type: book
  - title: "nginx — http modules"
    url: "https://github.com/nginx/nginx"
    type: repo
status: published
---

## intro
`<link rel="dns-prefetch">` and `<link rel="preconnect">` are HTML hints that tell the browser to start the DNS lookup (and optionally the TCP and TLS handshake) for a third-party origin before any resource from that origin is requested. By the time your script tag or image actually needs `cdn.example.com`, the connection is already warm — saving 100–300 ms per origin on a cold page load.

## whyItMatters
- **The W3C Resource Hints spec** (REC since 2019) defines `dns-prefetch`, `preconnect`, `prefetch`, `prerender`; Chromium, WebKit, and Gecko all ship them and Lighthouse rewards their correct use.
- **HTTP Archive and Google's Core Web Vitals data** consistently show that pages pulling from 10+ origins (CDN, analytics, fonts, ads, video, social embeds) lose 200-500 ms of LCP to connection setup alone — preconnect recovers most of it.
- **Cloudflare, Akamai, and Fastly** documentation recommends preconnecting to their CDN endpoint as the cheapest single page-speed optimization; Shopify's theme-perf checklist makes it mandatory.
- **Google Fonts** explicitly recommends `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` in their setup snippet; missing the `crossorigin` flag forces a duplicate connection and is one of the top Lighthouse audits.

## intuition
Every cold connection to a new origin pays three serial costs: a **DNS lookup** (20-120 ms to translate `cdn.example.com` into an IP), a **TCP handshake** (1 RTT for SYN/SYN-ACK/ACK, typically 30-80 ms), and a **TLS handshake** (1-2 RTTs depending on TLS 1.2 vs 1.3 and resumption state, 60-200 ms). Stacked, that is 200-400 ms before a single byte of payload arrives. On a page that pulls from 10 third-party origins, the serial cost across all of them can exceed 2 seconds of pure connection setup — fully half of a "fast" page-load budget.

The browser only discovers it needs an origin when it encounters a `<script src>`, `<img src>`, `<link href>`, or `fetch()` referencing it during HTML parsing. By that time, the connection setup happens **in serial with rendering** — every blocking script tag stalls First Contentful Paint by however long its origin takes to connect. Resource hints fix this by telling the browser **before parsing reaches the reference** that it should start the DNS/TCP/TLS work in the background.

The takeout-order analogy is precise. Without preconnect, you read the menu, pick a dish, look up the phone number, dial, wait for an answer, then place the order — every step serial. Preconnect is dialing the restaurant **while** you read the menu — by the time you decide, the line is already open and someone is waiting to take your order. The cost moved from the critical path into parallel idle time.

Three hint types, increasing in cost. `dns-prefetch` resolves only DNS (cheap, can apply liberally to 20+ origins). `preconnect` resolves DNS + opens TCP + completes TLS (expensive — opens a real socket — limit to 4-6 critical origins). `preload` and `prefetch` go further, actually fetching a specific resource. Use the lightest hint that solves your problem; over-preconnecting wastes the user's socket budget, battery, and mobile data.

## visualization
Cold load without hints (timeline): HTML download 100 ms → parse → see `<script src="cdn.example.com/app.js">` → DNS 80 ms → TCP 60 ms → TLS 120 ms → fetch 50 ms. Total: 410 ms to first byte of app.js. With `<link rel="preconnect" href="https://cdn.example.com">` in the head: HTML download 100 ms (in parallel: DNS 80 → TCP 60 → TLS 120 finish by ms 260) → parse → see script tag → fetch 50 ms. Total: 150 ms — the preconnect overlapped with HTML download.

## bruteForce
Do nothing — let the browser discover origins lazily as it parses HTML and CSS. Every new origin pays full DNS + TCP + TLS cost serially. On a page with 8 origins, that's 8 × ~250 ms of avoidable latency. The render-blocking script tag at the top is the worst victim: it can stall first paint by hundreds of milliseconds for no reason other than connection setup.

## optimal
The right strategy is a **tiered hint stack** placed in the `<head>` before any blocking resource: `preconnect` for the 3-5 most critical origins, `dns-prefetch` for the long tail, and `preload` for specific known resources (LCP image, hero font). Order matters — the browser processes hints in document order, so place them above any blocking `<script>` or `<link rel="stylesheet">`.

```html
<head>
  <!-- Tier 1: preconnect to render-blocking critical origins.
       Use crossorigin for fonts and any CORS-requiring resources. -->
  <link rel="preconnect" href="https://cdn.example.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://api.example.com">

  <!-- Tier 2: dns-prefetch for the long tail (analytics, ads, embeds). -->
  <link rel="dns-prefetch" href="//www.google-analytics.com">
  <link rel="dns-prefetch" href="//connect.facebook.net">
  <link rel="dns-prefetch" href="//player.vimeo.com">

  <!-- Tier 3: preload the LCP image and hero font (full fetch, not just connection). -->
  <link rel="preload" as="image" href="https://cdn.example.com/hero.webp" fetchpriority="high">
  <link rel="preload" as="font" type="font/woff2"
        href="https://fonts.gstatic.com/s/inter/v12/Inter-Regular.woff2" crossorigin>

  <!-- Render-blocking resources come AFTER hints. -->
  <link rel="stylesheet" href="https://cdn.example.com/app.css">
</head>
```

Why this is right: the browser begins DNS + TCP + TLS for the preconnected origins in parallel with HTML parse, so by the time the `<link rel="stylesheet">` references them, the connection is warm and the payload fetch starts immediately. The `crossorigin` attribute is non-negotiable for fonts and any resource with `crossorigin` on its actual fetch — without it, the browser opens an anonymous connection that cannot be reused by the credentialed font request, forcing a second handshake that defeats the entire optimization. Google Fonts' setup guide spells this out explicitly.

**Socket budget**: each preconnect consumes an active TCP socket and TLS state in the browser, kept alive for ~10 seconds. Chromium caps preconnects to roughly 6-10 per origin tab; over-preconnecting (20+) causes the browser to silently drop hints. DNS-prefetch is essentially free (one UDP packet) and can scale to dozens.

**When preconnect is wasted**: with **HTTP/2 connection coalescing** (RFC 7540), multiple origins served from the same IP with a wildcard cert share one connection — preconnecting to both is redundant. With **QUIC/HTTP/3** (RFC 9114), the 0-RTT resumption on subsequent visits already eliminates most of the handshake cost. **103 Early Hints** (RFC 8297) is the server-driven alternative: the server sends a `103 Early Hints` response with `Link: <...>; rel=preconnect` headers before the final response body, letting the browser warm connections during the server's own thinking time. Cloudflare and Fastly both ship Early Hints support.

Measure with the **Resource Timing API** (`performance.getEntriesByType('resource')` → check `connectStart` vs `connectEnd`); Lighthouse's "Preconnect to required origins" audit and "Avoid multiple page redirects" both surface missed opportunities.

## complexity
time: saves ~200-400 ms per cold-loaded origin; near-zero overhead per hint
space: a few bytes per hint in the HTML; one extra socket per preconnect (browsers cap parallel preconnects, typically to 6-10)
notes: Preconnect uses real resources — sockets, OS file descriptors, TLS state — so do not preconnect to 50 origins. Browsers will silently drop excess hints. DNS-prefetch is essentially free and can be applied liberally.

## pitfalls
- Preconnecting to origins you never actually use — wastes the user's socket budget and battery.
- Forgetting `crossorigin` on font preconnects — the browser opens a connection without credentials, then has to open a *second* one for the actual font fetch.
- Adding hints below blocking scripts — the parser already paused, defeating the purpose.
- Confusing `preload` (fetch the resource) with `preconnect` (open the connection only) — preload is a heavier hammer with different trade-offs.

## interviewTips
- Distinguish the four hints crisply: dns-prefetch (DNS only), preconnect (DNS + TCP + TLS), prefetch (low-priority resource fetch), preload (high-priority resource fetch).
- Mention the socket-budget trade-off — interviewers want to hear that more hints is not always better.
- Bring up HTTP/2 connection coalescing: multiple origins served from the same IP with a wildcard cert share one connection, making preconnect unnecessary for them.
- Tie it to Core Web Vitals — LCP improvements are the typical ROI.

## code.python
```python
def inject_resource_hints(html: str, origins: list[str]) -> str:
    hints = "\n".join(
        f'<link rel="preconnect" href="{o}" crossorigin>' for o in origins[:5]
    )
    return html.replace("<head>", f"<head>\n{hints}", 1)

page = "<html><head><title>x</title></head><body></body></html>"
print(inject_resource_hints(page, ["https://cdn.example.com", "https://fonts.gstatic.com"]))
```

## code.javascript
```javascript
function preconnect(origin, crossorigin = true) {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  if (crossorigin) link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

['https://cdn.example.com', 'https://fonts.gstatic.com', 'https://api.example.com']
  .forEach((o) => preconnect(o));
```

## code.java
```java
import java.util.List;

public class HintInjector {
    public static String inject(String html, List<String> origins) {
        StringBuilder hints = new StringBuilder();
        for (String o : origins.subList(0, Math.min(5, origins.size()))) {
            hints.append("<link rel=\"preconnect\" href=\"").append(o).append("\" crossorigin>\n");
        }
        return html.replaceFirst("<head>", "<head>\n" + hints);
    }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
#include <sstream>

std::string injectHints(const std::string& html, const std::vector<std::string>& origins) {
    std::ostringstream hints;
    size_t n = std::min<size_t>(5, origins.size());
    for (size_t i = 0; i < n; ++i)
        hints << "<link rel=\"preconnect\" href=\"" << origins[i] << "\" crossorigin>\n";
    std::string out = html;
    size_t pos = out.find("<head>");
    if (pos != std::string::npos) out.insert(pos + 6, "\n" + hints.str());
    return out;
}
```
