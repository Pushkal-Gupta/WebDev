---
slug: etag-conditional
module: sd-caching-cdn
title: ETag and Conditional Requests
subtitle: HTTP ETag plus If-None-Match for cache validation that saves bandwidth without going stale.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Use the latest HTTP for performance"
    url: "https://martinfowler.com/articles/web-services-edge.html"
    type: blog
  - title: "Microservices.io — API design"
    url: "https://microservices.io/articles/whoops.html"
    type: book
  - title: "donnemartin/system-design-primer — Caching"
    url: "https://github.com/donnemartin/system-design-primer#cache"
    type: repo
status: published
---

## intro
An ETag is an opaque server-issued identifier for a specific version of a resource. When the client re-requests the resource it sends the previous ETag in `If-None-Match`. If the resource has not changed, the server returns `304 Not Modified` with an empty body; the client serves its cached copy. ETags also gate writes through `If-Match` to prevent the lost-update problem in optimistic concurrency control.

## whyItMatters
- **RFC 9110 (HTTP Semantics, 2022)** standardizes `ETag`, `If-None-Match`, and `If-Match` as the canonical mechanisms for cache validation and optimistic concurrency control across the entire web.
- **AWS S3, Azure Blob, and Google Cloud Storage** all return strong ETags on every `GET`, and S3's `If-Match` header on `PUT` is the documented way to prevent lost-update races between concurrent writers.
- **Cloudflare, Akamai, and Fastly** CDNs honor `If-None-Match` revalidation against origin, turning repeat requests for unchanged resources into 200-byte `304` responses; this is the bandwidth-saving backbone of the modern web.
- **GitHub's REST API and Stripe's API** use ETags on resource endpoints so polling clients (CI bots, webhook fallbacks) can long-poll without burning rate limits — and use `If-Match` on writes to prevent two engineers from simultaneously editing the same resource.

## intuition
Most resources change infrequently, but clients hit them constantly — avatars, product catalogs, user profiles, feature flags, S3 objects. Without validation, every refresh re-downloads identical bytes, wasting bandwidth on the client, CPU on the server, and money on the CDN. The naive alternative — `Cache-Control: max-age=3600` and pray — trades stale data for performance and offers no way to know when the cached copy went stale.

The HTTP cache-validation flow solves this with a versioned token. The server, on every response, computes an **ETag** — an opaque string that uniquely identifies the current version of the resource (typically a hash of the canonical payload or a logical version like `v17`). The client caches the body and the ETag. On the next request, the client sends `If-None-Match: "<etag>"`. The server compares: if the current ETag still matches, it replies `304 Not Modified` with no body (just headers); the client serves its cached copy. If the ETag has changed, the server replies `200 OK` with the new body and a new ETag. The expensive bytes travel only when content actually changed.

The library-card analogy: each book has a card glued inside saying "edition 7." When you want to re-read, you tell the librarian "I have edition 7." If they say "still edition 7," you walk to your shelf copy; if they say "no, edition 8," they hand you the new book. The card transfer is cheap; the book transfer happens only when needed.

The same primitive solves the **lost-update problem** on writes. The client reads a resource, gets ETag `v17`, edits locally, and PUTs with `If-Match: "v17"`. If another client already updated the resource to `v18`, the server replies `412 Precondition Failed` and the client must re-fetch, re-merge, and retry. This is HTTP-native optimistic concurrency control — no application-layer version field, no row-level lock, just a header.

## visualization
Round 1: `GET /api/products/42` → `200 OK`, `ETag: "v17-9af3"`, body 12 KB. Browser caches body and tag. Round 2 (one minute later): `GET /api/products/42`, `If-None-Match: "v17-9af3"` → `304 Not Modified`, ~200 bytes total. Write path: `PUT /api/products/42` with `If-Match: "v17-9af3"`. Another client already updated to v18 → server replies `412 Precondition Failed`, your write is rejected, you re-fetch, merge, retry.

## bruteForce
Set a long `Cache-Control: max-age=3600` and hope. Fast when fresh, but stale data for up to an hour with no way to know it changed. Or set `no-store` and refetch every time — correct but wasteful, especially over mobile networks. Neither addresses the write-side lost-update race at all.

## optimal
The right pattern is **strong, deterministic ETags computed from canonical payload content** (not random per response), paired with `Cache-Control: private, max-age=N, must-revalidate` for freshness windows and `If-Match` enforcement on writes for optimistic concurrency. RFC 9110 Section 8.8 is the normative reference; RFC 7232 covers conditional-request semantics.

```python
import hashlib, json
from flask import Flask, request, abort, make_response

app = Flask(__name__)
STORE = {"42": {"name": "Widget", "price": 999, "version": 17}}

def etag_for(obj):
    # Canonical serialization: sorted keys -> byte-stable hash.
    payload = json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()
    digest = hashlib.sha256(payload).hexdigest()[:16]
    return f'W/"{digest}"'                           # weak: semantic equivalence

@app.get("/api/products/<pid>")
def get_product(pid):
    obj = STORE.get(pid) or abort(404)
    tag = etag_for(obj)
    if request.headers.get("If-None-Match") == tag:
        return ("", 304, {"ETag": tag,
                          "Cache-Control": "private, max-age=60, must-revalidate"})
    resp = make_response(json.dumps(obj))
    resp.headers["ETag"] = tag
    resp.headers["Cache-Control"] = "private, max-age=60, must-revalidate"
    resp.headers["Vary"] = "Accept-Encoding, Accept-Language"
    return resp

@app.put("/api/products/<pid>")
def put_product(pid):
    obj = STORE.get(pid) or abort(404)
    if_match = request.headers.get("If-Match")
    if if_match is None:
        abort(428)                                   # Precondition Required
    if if_match != etag_for(obj):
        abort(412)                                   # Precondition Failed
    STORE[pid] = {**request.get_json(), "version": obj["version"] + 1}
    return ("", 204, {"ETag": etag_for(STORE[pid])})
```

Why this is right: hashing the **canonical** serialization (sorted keys, compact separators) means two semantically identical resources produce the same ETag, so cache hits actually happen across server restarts and replica reboots. Random ETags defeat validation — every request would look "changed" and the entire optimization collapses. The `W/` prefix marks the ETag as **weak** (semantic equivalence, ignoring whitespace and key order); use strong ETags (no prefix) only when byte identity matters (binary deltas, signed payloads). `Vary: Accept-Encoding` is mandatory if you compress responses — a gzipped and identity copy must not share an ETag, or browsers will mis-cache.

**Status codes**: `304 Not Modified` (cache hit on read), `412 Precondition Failed` (write rejected, stale ETag), `428 Precondition Required` (server demands `If-Match` to prevent silent overwrite — see RFC 6585). Returning a body with 304 violates the spec and breaks some clients.

**For collections**: an ETag can be `sha256(max(updated_at), count)` so the list invalidates when any member changes; or use a monotonic counter bumped on every write. **For CDN-level invalidation**: surrogate keys (Fastly's `Surrogate-Key`, Cloudflare's Cache-Tag) extend the same idea — tag responses with logical keys and purge by tag, not by URL.

**ETag vs Last-Modified**: ETag is finer-grained (sub-second changes), survives clock skew between replicas, and is the only correct choice when content can change multiple times per second. `Last-Modified`/`If-Modified-Since` is simpler but breaks on sub-second resolution and replica clock drift. RFC 9110 recommends ETag as the primary mechanism; Last-Modified is the legacy fallback.

## complexity
time: O(B) to hash payload of size B once on response; O(1) compare on subsequent requests
space: O(1) — the ETag itself is tiny (16–64 bytes)
notes: Strong vs weak ETags matter: `W/` means semantic equivalence (whitespace differences ignored), no prefix means byte-identical. Pick weak for JSON; strong only when byte identity is meaningful (e.g., binary deltas).

## pitfalls
- Echoing a randomly-generated ETag on every response — every request looks "changed," cache validation is defeated.
- Using strong ETags for JSON that gets re-serialized with key reordering between hits.
- Forgetting `Vary: Accept-Encoding` — gzipped and identity responses must not share an ETag.
- Returning a body with `304` — spec violation, some clients break.
- Ignoring `If-Match` on writes and silently overwriting concurrent edits.

## interviewTips
- Connect ETags to optimistic concurrency control — they are the HTTP-native way to implement it.
- Mention status codes precisely: `304 Not Modified`, `412 Precondition Failed`, `428 Precondition Required`.
- Contrast with `Last-Modified` / `If-Modified-Since`: ETag is finer-grained (sub-second changes) and survives clock skew.
- For CDN questions, mention surrogate keys / cache tags as the server-fleet equivalent of ETag invalidation.

## code.python
```python
import hashlib, json
from flask import Flask, request, abort, make_response

app = Flask(__name__)
STORE = {"42": {"name": "Widget", "price": 999, "version": 17}}

def etag_for(obj):
    payload = json.dumps(obj, sort_keys=True).encode()
    return 'W/"' + hashlib.sha256(payload).hexdigest()[:16] + '"'

@app.get("/api/products/<pid>")
def get_product(pid):
    obj = STORE.get(pid) or abort(404)
    tag = etag_for(obj)
    if request.headers.get("If-None-Match") == tag:
        return ("", 304, {"ETag": tag})
    resp = make_response(json.dumps(obj))
    resp.headers["ETag"] = tag
    resp.headers["Cache-Control"] = "private, max-age=60, must-revalidate"
    return resp

@app.put("/api/products/<pid>")
def put_product(pid):
    obj = STORE.get(pid) or abort(404)
    if request.headers.get("If-Match") != etag_for(obj):
        abort(412)
    STORE[pid] = {**request.get_json(), "version": obj["version"] + 1}
    return ("", 204, {"ETag": etag_for(STORE[pid])})
```

## code.javascript
```javascript
import crypto from 'crypto';
import express from 'express';

const app = express();
app.use(express.json());
const store = { '42': { name: 'Widget', price: 999, version: 17 } };

function etagFor(obj) {
  const payload = JSON.stringify(obj, Object.keys(obj).sort());
  return 'W/"' + crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16) + '"';
}

app.get('/api/products/:id', (req, res) => {
  const obj = store[req.params.id];
  if (!obj) return res.sendStatus(404);
  const tag = etagFor(obj);
  res.setHeader('ETag', tag);
  res.setHeader('Cache-Control', 'private, max-age=60, must-revalidate');
  if (req.headers['if-none-match'] === tag) return res.status(304).end();
  res.json(obj);
});

app.put('/api/products/:id', (req, res) => {
  const obj = store[req.params.id];
  if (!obj) return res.sendStatus(404);
  if (req.headers['if-match'] !== etagFor(obj)) return res.sendStatus(412);
  store[req.params.id] = { ...req.body, version: obj.version + 1 };
  res.status(204).setHeader('ETag', etagFor(store[req.params.id])).end();
});
```

## code.java
```java
@RestController
public class ProductController {
    private final Map<String, Product> store = new ConcurrentHashMap<>();

    private String etagFor(Product p) {
        byte[] bytes = JsonMapper.canonical(p);
        byte[] h = MessageDigest.getInstance("SHA-256").digest(bytes);
        return "W/\"" + HexFormat.of().formatHex(h, 0, 8) + "\"";
    }

    @GetMapping("/api/products/{id}")
    public ResponseEntity<Product> get(@PathVariable String id, @RequestHeader(value = "If-None-Match", required = false) String inm) {
        Product p = store.get(id);
        if (p == null) return ResponseEntity.notFound().build();
        String tag = etagFor(p);
        if (tag.equals(inm)) return ResponseEntity.status(304).eTag(tag).build();
        return ResponseEntity.ok().eTag(tag).cacheControl(CacheControl.maxAge(60, SECONDS).mustRevalidate()).body(p);
    }

    @PutMapping("/api/products/{id}")
    public ResponseEntity<Void> put(@PathVariable String id, @RequestBody Product body, @RequestHeader("If-Match") String ifm) {
        Product p = store.get(id);
        if (p == null) return ResponseEntity.notFound().build();
        if (!ifm.equals(etagFor(p))) return ResponseEntity.status(412).build();
        body.version = p.version + 1; store.put(id, body);
        return ResponseEntity.noContent().eTag(etagFor(body)).build();
    }
}
```

## code.cpp
```cpp
std::string etag_for(const Product& p) {
    auto bytes = json_canonical(p);
    auto digest = sha256(bytes);
    return "W/\"" + hex(digest).substr(0, 16) + "\"";
}

HttpResponse get_product(const HttpRequest& req, Store& store) {
    auto it = store.find(req.path_param("id"));
    if (it == store.end()) return {404};
    auto tag = etag_for(it->second);
    if (req.header("If-None-Match") == tag)
        return {304, {{"ETag", tag}}, ""};
    return {200, {{"ETag", tag}, {"Cache-Control", "private, max-age=60, must-revalidate"}}, to_json(it->second)};
}

HttpResponse put_product(const HttpRequest& req, Store& store) {
    auto it = store.find(req.path_param("id"));
    if (it == store.end()) return {404};
    if (req.header("If-Match") != etag_for(it->second)) return {412};
    auto next = from_json<Product>(req.body); next.version = it->second.version + 1;
    store[req.path_param("id")] = next;
    return {204, {{"ETag", etag_for(next)}}, ""};
}
```
