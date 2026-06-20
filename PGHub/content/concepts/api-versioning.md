---
slug: api-versioning
module: sd-api
title: API Versioning
subtitle: Evolve a public API without breaking existing clients — URI / header / accept-version strategies, deprecation lifecycle, payload contracts.
difficulty: Intermediate
position: 39
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — API versioning"
    url: "https://martinfowler.com/articles/enterpriseREST.html"
    type: book
  - title: "Stripe API — versioning by date pinning"
    url: "https://stripe.com/docs/api/versioning"
    type: blog
  - title: "google/gnostic — OpenAPI tooling"
    url: "https://github.com/google/gnostic"
    type: repo
status: published
---

## intro
Your API is in production. A million clients depend on it. You need to add a field, rename one, remove one, change a response shape. Naive: just deploy → break every client. **API versioning** is the contract for evolving the API safely. Three common strategies: **URI versioning** (`/v2/users`), **header versioning** (`Accept-Version: 2`), and **date-pinned versioning** (Stripe's `Stripe-Version: 2024-06-20`).

## whyItMatters
Without versioning:
- Renaming a field silently breaks parsers.
- Adding a required field rejects existing clients.
- Removing a field crashes downstream business logic.
- Mobile apps with N-month update cycles can't migrate immediately.

Every public API needs a versioning strategy. Internal APIs sometimes skip it (deploy server + client together), but the moment you have multiple consumers, you need a contract.

## intuition
Three philosophies:

1. **URI versioning** (`GET /v2/users`):
   - Easy to route, easy to cache.
   - Visible in logs and curl commands.
   - "All endpoints jump from v1 to v2" — big-bang releases.

2. **Header versioning** (`Accept-Version: 2.1` or `Accept: application/vnd.example.v2+json`):
   - Cleaner URLs.
   - Per-endpoint independent versioning possible.
   - Less curl-friendly; harder to debug.

3. **Date-pinned versioning** (Stripe): client sends `Stripe-Version: 2024-06-20` header; server picks the API behavior for that snapshot date.
   - Continuous evolution, no "v3" releases.
   - Clients upgrade on their own timeline.
   - Server maintains compatibility shims forever (expensive but customer-friendly).

The right choice depends on:
- **Consumer count** (more = pickier strategy).
- **Pace of change** (fast iteration = date-pinned).
- **Mobile / embedded consumers** (long upgrade cycles = explicit per-version).

## visualization
```
URI versioning:
  GET /v1/users/7   → returns {id, name, email}
  GET /v2/users/7   → returns {id, name, email, profile: {...}}

Header versioning:
  GET /users/7  Accept-Version: 1   → {id, name, email}
  GET /users/7  Accept-Version: 2   → {id, name, email, profile: {...}}

Date-pinned (Stripe):
  GET /v1/customers/cus_123  Stripe-Version: 2023-08-16  → old shape
  GET /v1/customers/cus_123  Stripe-Version: 2024-06-20  → new shape
  Server has shims for every API change between those dates.
```

## bruteForce
**No versioning**: works until you make your first breaking change. Then breaks every consumer simultaneously.

**Add new endpoint per change** (e.g., `/users-with-profile`): pollutes the API surface. Multiplies endpoints.

**Force all clients to upgrade simultaneously**: only works for internal APIs you control end-to-end.

## optimal
**Compatibility rules** (per Roy Fielding + every mature API):
- **Additive changes are NON-breaking**: add new optional field, add new endpoint, add new query param.
- **Removing or renaming is breaking**: needs new version.
- **Changing field type / semantics is breaking**.
- **Reordering JSON array semantics is breaking**.

**Deprecation lifecycle**:
1. Document deprecation, add `Deprecation: <date>` header to responses.
2. 6-12 month sunset notice (e.g., GitHub gives 12 months).
3. Email all API key owners; show banner in developer dashboard.
4. Increase failure rate over the last week (returns 410 randomly).
5. Final shutdown.

**Server-side strategies**:
- URI versioning: route to different controller per `/v1/` vs `/v2/` prefix.
- Header versioning: middleware reads `Accept-Version`, dispatches to right handler.
- Date-pinned: middleware reads `Stripe-Version`, applies "before-this-date" or "after-this-date" transformations to response.

**Schema-driven**: maintain OpenAPI / gRPC proto file per version. Generate client SDKs from it. Run contract tests to verify v1 server matches v1 SDK.

## complexity
- **URI version**: O(1) routing overhead.
- **Header version**: O(1) middleware check.
- **Date-pinned**: O(N transformations) per response where N = changes between client's version and current.
- **Maintenance cost**: each live version is one more code path to maintain.

## pitfalls
- **Versioning the URL but not internal logic**: `/v1/users` and `/v2/users` calling the same handler means changes leak across versions.
- **Forgotten compatibility shims**: 5 years later, no one remembers why `nameDeprecated` field exists. Tag with sunset dates in code.
- **Implicit version assumption**: client sends no version → server defaults to "latest" → next release breaks them. Default to OLDEST supported version or REQUIRE explicit version.
- **Date-pinning without ratchets**: a client pinning to 2010-01-01 forever. Set a min-version cutoff (e.g., reject older than 24 months).
- **GraphQL exception**: GraphQL handles versioning differently — additive schema evolution + `@deprecated` directive. No URL versioning.

## interviewTips
- For "design a public API for evolution" — URI versioning for clarity, date-pinning for finer-grained migrations.
- Mention **Stripe's date-pinned approach** as the gold standard for long-lived APIs.
- For senior interviews, discuss **deprecation lifecycle**, **SDK regeneration**, **contract testing**.

## code.python
```python
# Flask URI versioning
from flask import Blueprint
v1 = Blueprint('v1', __name__, url_prefix='/v1')
v2 = Blueprint('v2', __name__, url_prefix='/v2')

@v1.route('/users/<id>')
def get_user_v1(id):
    return {'id': id, 'name': '...', 'email': '...'}

@v2.route('/users/<id>')
def get_user_v2(id):
    return {'id': id, 'name': '...', 'email': '...', 'profile': {...}}

app.register_blueprint(v1)
app.register_blueprint(v2)
```

## code.javascript
```javascript
// Express header versioning
app.get('/users/:id', (req, res) => {
  const version = req.headers['accept-version'] || '1';
  if (version === '1') return res.json({ id: req.params.id, name: '...' });
  if (version === '2') return res.json({ id: req.params.id, name: '...', profile: {} });
  res.status(406).send('Unsupported version');
});
```

## code.java
```java
// Spring URI versioning
@RestController
@RequestMapping("/v1/users")
class UserControllerV1 {
    @GetMapping("/{id}")
    public UserV1 get(@PathVariable Long id) { return new UserV1(id, name, email); }
}
@RestController
@RequestMapping("/v2/users")
class UserControllerV2 {
    @GetMapping("/{id}")
    public UserV2 get(@PathVariable Long id) { return new UserV2(id, name, email, profile); }
}
```

## code.cpp
```cpp
// Drogon URI versioning
// app.registerHandler("/v1/users/{id}", &UserV1::get, {Get});
// app.registerHandler("/v2/users/{id}", &UserV2::get, {Get});
```
