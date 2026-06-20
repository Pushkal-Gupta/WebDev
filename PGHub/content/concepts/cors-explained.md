---
slug: cors-explained
module: sd-network
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
CORS surprises every web developer at least once: local dev calling an API at a different port fails, a SaaS embed gets blocked on customer domains, a `fetch` returns a response that JavaScript sees as opaque and cannot read. Understanding CORS unlocks cross-origin APIs, third-party widgets, public CDN assets, embedded iframes, and cookie-based auth across subdomains. The model is specified in the *Fetch Living Standard* (WHATWG) with HTTP-side requirements in RFC 6454 (the Web Origin Concept) and the related preflight semantics maintained by the W3C. Every major SaaS platform (Stripe, Auth0, Plaid, Algolia) has to think about CORS for its embeddable widgets; every reverse-proxy config (Nginx, Envoy, Cloudflare Workers) ships CORS helpers; misconfiguring it is the cause of a substantial fraction of "my API works in curl but not in the browser" tickets.

## intuition
**Origin** = scheme + host + port. `https://a.com`, `http://a.com`, and `https://a.com:8080` are three different origins. The browser enforces the **Same-Origin Policy** (SOP): JavaScript can only read responses whose origin matches the page's origin. Cross-origin writes — form posts, image loads, script tags — have always been allowed because the early web was built that way; cross-origin *reads* are blocked unless the server opts in.

CORS is the server's opt-in protocol. For a *simple* request (GET, HEAD, or POST with a basic content type, no custom headers), the browser sends it normally and then checks the response's `Access-Control-Allow-Origin` header. If the header allows the page's origin (or is `*`), JavaScript gets to read the body; otherwise the browser hides the response. For anything more interesting (PUT, DELETE, JSON content type, custom headers), the browser sends a **preflight** `OPTIONS` request first asking "would you allow this real request?" The server responds with the allowed methods, headers, and credentials policy; only then does the browser send the real request.

The single most confusing piece is `Access-Control-Allow-Credentials: true`. Without it cookies and the `Authorization` header are stripped from cross-origin requests. With it the response must specify an explicit origin (`*` is forbidden), and the browser will send cookies — which is exactly when CSRF protection becomes relevant and you need `SameSite=Strict` or anti-CSRF tokens.

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
Configure CORS at the edge (CDN, API gateway, reverse proxy) rather than inside every service so the policy lives in one place. Pin `Access-Control-Allow-Origin` to a specific origin list — never use `*` for endpoints that handle cookies or sensitive data, because `*` plus `Allow-Credentials: true` is forbidden by spec and would expose the API to any origin. Cache preflights with `Access-Control-Max-Age: 86400` to skip the extra `OPTIONS` round-trip for 24 hours.

```nginx
map $http_origin $cors_origin {
    default "";
    "~^https://(app|admin)\.example\.com$" $http_origin;
}

server {
    location /api/ {
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin $cors_origin always;
            add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE' always;
            add_header Access-Control-Allow-Headers 'Content-Type, Authorization' always;
            add_header Access-Control-Allow-Credentials 'true' always;
            add_header Access-Control-Max-Age 86400 always;
            return 204;
        }
        add_header Access-Control-Allow-Origin $cors_origin always;
        add_header Access-Control-Allow-Credentials 'true' always;
        proxy_pass http://backend;
    }
}
```

The critical pattern is the `map` directive that whitelists exact origins via regex — never echo `$http_origin` back unconditionally or you have effectively disabled CORS protection. Pair this with `Access-Control-Expose-Headers` for any custom response headers JavaScript needs to read (the browser hides them by default), and remember that `Set-Cookie` always requires `Allow-Credentials: true` plus an explicit origin to actually land. For SaaS embeds whose customer origins are unknown ahead of time, the safest pattern is to load the widget from your own subdomain inside an iframe and communicate via `postMessage`, sidestepping CORS entirely.

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
