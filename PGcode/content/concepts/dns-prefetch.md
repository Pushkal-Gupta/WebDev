---
slug: dns-prefetch
module: system-design
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
Real-world pages pull from 10+ origins (CDN, analytics, fonts, ads, video, social embeds). Each new origin costs one DNS lookup (20–120 ms), one TCP handshake (1 RTT), and one TLS handshake (1–2 RTTs). Stacked, that's 500+ ms before a single byte of content arrives. Prefetch and preconnect parallelize this work with the initial HTML parse, turning serial latency into a non-blocking background task. Lighthouse and Core Web Vitals reward it; users feel it as snappier navigation.

## intuition
Imagine ordering takeout. The naive flow: read the menu, pick a dish, look up the restaurant's phone number, dial, wait for someone to answer, place the order. Preconnect is dialing the restaurant *while* you read the menu — by the time you decide, the line is already open and someone is waiting to take your order. The total time drops by however long the phone call took to set up.

## visualization
Cold load without hints (timeline): HTML download 100 ms → parse → see `<script src="cdn.example.com/app.js">` → DNS 80 ms → TCP 60 ms → TLS 120 ms → fetch 50 ms. Total: 410 ms to first byte of app.js. With `<link rel="preconnect" href="https://cdn.example.com">` in the head: HTML download 100 ms (in parallel: DNS 80 → TCP 60 → TLS 120 finish by ms 260) → parse → see script tag → fetch 50 ms. Total: 150 ms — the preconnect overlapped with HTML download.

## bruteForce
Do nothing — let the browser discover origins lazily as it parses HTML and CSS. Every new origin pays full DNS + TCP + TLS cost serially. On a page with 8 origins, that's 8 × ~250 ms of avoidable latency. The render-blocking script tag at the top is the worst victim: it can stall first paint by hundreds of milliseconds for no reason other than connection setup.

## optimal
Add `<link rel="preconnect" href="https://important-origin.com" crossorigin>` for the 3-5 most important third-party origins (CDN, fonts, primary API). Add `<link rel="dns-prefetch" href="//less-important.com">` for the rest — DNS-only is cheaper and the browser can do dozens. Place them *first* in the head, before any blocking resource. The `crossorigin` attribute matters for fonts and CORS-requiring resources — without it, the warmed connection cannot be reused.

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
