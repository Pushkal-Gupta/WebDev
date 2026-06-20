---
slug: cdn-edge-caching
module: sd-caching-cdn
title: CDN + Edge Caching
subtitle: Serve static + dynamic content from the geographically-closest data center — drops latency by 50-90%.
difficulty: Intermediate
position: 12
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Architecture & enterprise patterns"
    url: "https://martinfowler.com/tags/application%20architecture.html"
    type: book
  - title: "High Scalability — All-time greatest hits"
    url: "http://highscalability.com/all-time-favorites/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A **Content Delivery Network (CDN)** is a fleet of cache servers ("edges") distributed across the globe. When a user requests an asset, the request hits the nearest edge — not your origin server in `us-east-1`. The edge serves a cached copy if it has one; otherwise it pulls from the origin (or a regional shield) and caches the response. Adding a CDN typically cuts global p95 latency by 50–90% for static content and 30–60% for cacheable dynamic content.

## whyItMatters
Every modern web app uses one. Real wins:
- **Images, JS bundles, CSS, fonts** served from a 5ms-away edge vs a 200ms-away origin.
- **Origin offload**: 95%+ of requests never reach your app servers → smaller fleet, lower cost.
- **DDoS absorption**: CDNs have terabits/sec of capacity. Your origin doesn't.
- **TLS termination at the edge**: 1-RTT handshakes close to the user.
- **API caching**: even POST `/api/feed` can be cacheable with the right `Cache-Control` headers.

Without a CDN, your site is unusable in any region your origin isn't in. With one, geographic distance becomes free.

## intuition
The internet is fast at the speed of light. New York ↔ Singapore is 13,000 km, RTT ~180ms baseline. Putting an edge server in Singapore drops that to ~5ms for already-cached content. Each cache hit is essentially a network-RAM read, not a transcontinental TCP fetch.

A CDN works in tiers:
1. **Edge POPs** (Points of Presence) — hundreds globally, the user's nearest hop.
2. **Regional shields** — pull from a small set of regional caches that aggregate misses, protecting origin from edge-thundering-herd.
3. **Origin** — your actual server, hit on a true miss.

## visualization
```
User in Tokyo:
   browser ──5ms──► Tokyo edge ──cache hit──► response (5ms total)
                                 │
                                 └─miss──► Tokyo shield ──miss──► origin in Virginia (~160ms)
                                                                  │
                                                                  └──► response cached in shield + edge
   next user in Tokyo:           response from edge (5ms)
```

## bruteForce
No CDN — every request hits origin. Works fine if 100% of your users are in the same region as your origin. Catastrophic globally; a single TCP round-trip from London to Sydney is 250ms, page paint stretches to seconds.

## optimal
**Set up**: point your DNS at the CDN (`CNAME` or proxied), configure origin pull, set `Cache-Control` headers on responses.

**Cache key**: edges identify a cached response by URL + select request headers. By default the path + query string + `Vary:`-listed headers. Tune to your content:
- Personalized HTML: don't cache, OR cache with `Vary: Authorization`.
- Static assets: cache aggressively (`Cache-Control: public, max-age=31536000, immutable`).
- API responses: cache by query params, set short TTLs.

**Cache-Control directives that matter**:
- `public` vs `private` (private = only browser, not CDN).
- `max-age=N`: how long to cache.
- `s-maxage=N`: how long the CDN caches (often > browser's max-age).
- `stale-while-revalidate=N`: serve stale for N seconds while async-fetching fresh.
- `stale-if-error=N`: serve stale if origin is down — instant resilience.
- `immutable`: hint that the asset will never change (e.g. hashed filenames).

**Purging**: invalidate by URL, prefix, or tag. Most CDNs invalidate in <30 seconds globally. Critical for content updates.

**Edge computing**: run small JS/WASM at the edge (Cloudflare Workers, Fastly Compute@Edge) for routing, A/B tests, auth checks — without round-tripping to origin.

## complexity
- **Cache hit latency**: ~5-20ms (TCP + edge RAM).
- **Cache miss latency**: edge → shield → origin = baseline RTT + processing.
- **Origin offload**: typically 95-99% for static assets, 30-90% for HTML, 20-50% for API.
- **Cost**: $0.01-0.10 per GB egress depending on region. Free tier covers most hobby projects.

## pitfalls
- **Caching personalized content**: leaking another user's auth-gated response to the wrong viewer. Always `Vary: Authorization` or set `Cache-Control: private`.
- **Forgetting to purge after deploy**: users see stale JS. Use hashed filenames + `immutable` and reference them from never-cached HTML.
- **Long TTL on dynamic content without `stale-while-revalidate`**: updates take forever to propagate. SWR makes the staleness invisible.
- **CORS preflight responses not cached**: every CORS-tagged request hits origin twice (OPTIONS + actual). Set `Access-Control-Max-Age` on the OPTIONS response.
- **`Vary: User-Agent`**: explodes cache cardinality. Avoid; use `Vary: Sec-CH-UA` if you really need device-class differentiation.

## interviewTips
- For "make this faster" / "lower latency" / "serve global users" — a CDN is your first answer.
- Always cite **TTL + Cache-Control + purge** as the three knobs.
- Mention `stale-while-revalidate` — interviewers love that you know modern HTTP caching.
- For senior interviews, contrast **edge compute** (Workers, Lambda@Edge) with traditional CDN: edge can run code, not just cache.

## code.python
```python
# Setting cache headers in Flask.
from flask import make_response

def index():
    resp = make_response(render_page())
    resp.headers["Cache-Control"] = "public, max-age=300, s-maxage=600, stale-while-revalidate=86400"
    return resp

def static_asset():
    resp = serve_file("/static/app.abc123.js")
    resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return resp
```

## code.javascript
```javascript
// Express middleware.
app.use('/static', express.static('public', {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  },
}));

app.get('/feed', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600');
  res.json(await getFeed());
});
```

## code.java
```java
// Spring annotation.
@GetMapping("/static/app.js")
public ResponseEntity<Resource> staticFile() {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
        .body(resource);
}
```

## code.cpp
```cpp
// Pseudo — most C++ web frameworks expose a header API.
// Beast / Pistache / Crow all let you set:
// response.set(http::field::cache_control, "public, max-age=31536000, immutable");
```
