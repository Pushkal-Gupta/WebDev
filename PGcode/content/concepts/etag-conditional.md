---
slug: etag-conditional
module: system-design
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
Most resources change infrequently, but clients hit them constantly — avatars, product catalogs, user profiles, feature configs. Without validation, every refresh re-downloads identical bytes. ETags collapse those repeat requests into a few-hundred-byte `304`, cutting bandwidth and latency dramatically. On the write side, `If-Match` is how a REST API rejects "save" calls that were composed against a now-stale view.

## intuition
Imagine a library card glued to the inside cover of a book showing "edition 7." Whenever you want to re-read, you tell the librarian "I have edition 7" — if they say "still edition 7," you go straight to your shelf copy; if they say "no, edition 8," they hand you the new book. ETags are that edition stamp at HTTP scale.

## visualization
Round 1: `GET /api/products/42` → `200 OK`, `ETag: "v17-9af3"`, body 12 KB. Browser caches body and tag. Round 2 (one minute later): `GET /api/products/42`, `If-None-Match: "v17-9af3"` → `304 Not Modified`, ~200 bytes total. Write path: `PUT /api/products/42` with `If-Match: "v17-9af3"`. Another client already updated to v18 → server replies `412 Precondition Failed`, your write is rejected, you re-fetch, merge, retry.

## bruteForce
Set a long `Cache-Control: max-age=3600` and hope. Fast when fresh, but stale data for up to an hour with no way to know it changed. Or set `no-store` and refetch every time — correct but wasteful, especially over mobile networks. Neither addresses the write-side lost-update race at all.

## optimal
Generate strong ETags as a hash of the canonical serialized resource (e.g., `W/"sha256-of-payload-first-12"`). On reads, honor `If-None-Match` and return `304` with no body. On writes, require `If-Match` and return `412 Precondition Failed` when the supplied tag does not equal the current version. For collections, an ETag can be a hash of `(max(updated_at), count)` to invalidate when any member changes. Combine with `Cache-Control: private, max-age=N, must-revalidate` so the client uses the cached copy fresh for N seconds, then validates with an `If-None-Match` after.

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
