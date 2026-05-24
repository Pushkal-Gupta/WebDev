---
slug: cors-explained
module: system-design
title: CORS — Cross-Origin Resource Sharing
subtitle: Browsers block cross-origin JS reads by default. Server opt-in via `Access-Control-Allow-*` headers. Preflight on non-simple requests.
difficulty: Intermediate
position: 34
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "MDN — CORS"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
    type: book
  - title: "expressjs/cors — Express middleware (reference impl)"
    url: "https://github.com/expressjs/cors"
    type: repo
  - title: "html.spec.whatwg.org — Fetch Standard"
    url: "https://fetch.spec.whatwg.org/"
    type: blog
status: published
---

## intro
A browser at `https://app.example.com` makes a `fetch('https://api.bank.com/balance')`. By default the browser sends the request (TCP, headers, etc.) but **blocks the JS from reading the response** if the response doesn't include the right CORS headers. This is the **Same-Origin Policy** + **CORS** opt-in.

The model: same-origin is automatic; cross-origin requires server consent via `Access-Control-Allow-Origin` (and friends). Non-simple requests (custom headers, non-GET/POST/HEAD, etc.) get a **preflight OPTIONS** request first.

## whyItMatters
CORS surprises every web developer at least once:
- Local dev → API at different port → broken.
- SaaS embedded widget → blocked on customer domains.
- `fetch` returns a response that JS sees as opaque + can't read body.

Understanding CORS unlocks: cross-origin APIs, third-party widgets, public CDN assets, embedded iframes, cookie-based auth across subdomains.

## intuition
**Origin** = scheme + host + port. `https://a.com` ≠ `http://a.com` ≠ `https://a.com:8080`.

**Same-origin**: read freely.

**Cross-origin** writes (forms, navigation, image loads, script tags): always allowed — this is historical legacy.

**Cross-origin JS reads** (fetch, XHR, EventSource): blocked unless server returns `Access-Control-Allow-Origin: <your-origin>` (or `*`).

**Preflight**: for requests with non-default methods/headers (PUT, DELETE, custom headers, `Content-Type: application/json` triggers it too), browser FIRST sends `OPTIONS /resource` with `Access-Control-Request-Method` + `Access-Control-Request-Headers`. Server responds with allowed methods/headers; browser then sends the real request.

## visualization
```
Simple GET (no preflight):
  Browser ──GET /api/data Origin: app.example.com──► api.bank.com
  Browser ◄──200 OK + body + Access-Control-Allow-Origin: app.example.com─── api.bank.com
  JS reads body. ✓

POST with JSON body (preflight):
  Browser ──OPTIONS /api/transfer
            Origin: app.example.com
            Access-Control-Request-Method: POST
            Access-Control-Request-Headers: Content-Type──► api.bank.com
  Browser ◄──204 No Content
            Access-Control-Allow-Origin: app.example.com
            Access-Control-Allow-Methods: POST
            Access-Control-Allow-Headers: Content-Type
            Access-Control-Max-Age: 86400──── api.bank.com

  Browser ──POST /api/transfer (the real one)──► api.bank.com
  Browser ◄──200 OK + body + Access-Control-Allow-Origin: app.example.com──── api.bank.com
  JS reads body. ✓
```

## bruteForce
**JSONP** (historical hack): wrap response in a script tag callback. Only GET; no longer recommended.

**Server-side proxy**: your origin proxies to the cross-origin API. Works but adds a hop + you're now responsible for auth.

**`Access-Control-Allow-Origin: *`**: easiest but disables auth (`Authorization` headers + cookies are blocked when wildcard is used).

The correct path: specific origin + `Access-Control-Allow-Credentials: true` if cookies/auth needed.

## optimal
**Server response headers**:
- `Access-Control-Allow-Origin: https://app.example.com` (specific origin OR `*`)
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Allow-Credentials: true` (if cookies/auth needed)
- `Access-Control-Max-Age: 86400` (cache preflight for 24h to skip re-OPTIONS)
- `Access-Control-Expose-Headers: X-Custom-Header` (JS can only read these custom response headers)

**Preflight cache** is critical: without `Max-Age`, every PUT/DELETE incurs a round-trip per request. With `Max-Age: 86400`, browser remembers for 24h.

**Dynamic origin allowlist** (typical):
```js
// Express
app.use(cors({
  origin: (origin, callback) => {
    const allowed = ['https://app.example.com', 'https://staging.example.com'];
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  maxAge: 86400,
}));
```

## complexity
- **Preflight overhead**: 1 extra round-trip per unique (method, origin, headers) combo. Mitigated by `Max-Age`.
- **No size impact**: CORS is just headers.
- **Browser-side only**: server-to-server requests don't have CORS.

## pitfalls
- **Wildcard + credentials**: `Access-Control-Allow-Origin: *` + `Allow-Credentials: true` → browser rejects. Must pin specific origin.
- **Preflight not cached**: missing `Access-Control-Max-Age` → every PUT triggers an OPTIONS. Performance killer.
- **Forgetting to expose custom response headers**: JS can read `Content-Type` by default but NOT `X-Request-Id` unless you set `Expose-Headers`.
- **Cross-subdomain cookies**: `app.example.com` setting cookie → API at `api.example.com` doesn't get it unless cookie's `Domain=example.com`.
- **Server fails to handle OPTIONS**: returns 404 / 405 → preflight fails → real request never sent. Always wire CORS middleware before the route handler.

## interviewTips
- For "browser can't read API response" → CORS missing or misconfigured.
- Distinguish **CORS** (browser-enforced, cross-origin reads) from **CSRF** (server-side, prevents unwanted state changes from another site).
- Mention **preflight caching** as a perf win.
- For senior: explain why wildcard + credentials is forbidden (CSRF risk).

## code.python
```python
# Flask-CORS
from flask_cors import CORS
CORS(app,
     origins=['https://app.example.com', 'https://staging.example.com'],
     supports_credentials=True,
     max_age=86400)
```

## code.javascript
```javascript
// Express + cors
const cors = require('cors');
app.use(cors({
  origin: ['https://app.example.com'],
  credentials: true,
  maxAge: 86400,
}));
```

## code.java
```java
// Spring Boot
@Configuration
class CorsConfig implements WebMvcConfigurer {
    public void addCorsMappings(CorsRegistry r) {
        r.addMapping("/api/**")
         .allowedOrigins("https://app.example.com")
         .allowedMethods("GET", "POST", "PUT", "DELETE")
         .allowedHeaders("Content-Type", "Authorization")
         .allowCredentials(true)
         .maxAge(86400);
    }
}
```

## code.cpp
```cpp
// Drogon / oatpp / Crow — set headers in middleware
// Example for Crow:
// CROW_ROUTE(app, "/api/data").methods(crow::HTTPMethod::OPTIONS)
//   ([]{ return crow::response{204}.header("Access-Control-Allow-Origin", "https://app.example.com"); });
```
