---
slug: strangler-fig-migration
module: sd-microservices
title: Strangler Fig Migration
subtitle: Incrementally replace a legacy system by routing new traffic to the rewrite while old endpoints proxy through. Coined by Martin Fowler.
difficulty: Intermediate
position: 63
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Strangler Fig Application"
    url: "https://martinfowler.com/bliki/StranglerFigApplication.html"
    type: blog
  - title: "Microsoft — Strangler Fig pattern"
    url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig"
    type: blog
  - title: "donnemartin/system-design-primer — migration strategies"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
You have a monolith too large to rewrite in one shot. **Strangler Fig** migrates piece by piece: stand up a façade in front of the monolith, route new endpoints to the rewrite, keep proxying old endpoints to the monolith. Each release strangles a little more of the legacy code, until the original is gone.

Named after Australian strangler figs that grow on host trees, eventually replacing them entirely.

## whyItMatters
Big-bang rewrites famously fail (Netscape 6, Twitter Rails-to-Scala). Reasons:
- Business stops shipping features for 18 months.
- New system catches all old bugs + fresh ones.
- Switch-over weekend is a coin flip.

Strangler Fig ships value continuously, lets you abort cheaply, and never has a do-or-die cutover.

## intuition
1. **Façade** (HTTP reverse proxy, API gateway, or smart client) sits in front of both monolith + new service.
2. Initial state: all routes go to monolith.
3. Pick a vertical slice (e.g., user-profile endpoints). Rewrite it in the new service.
4. Update the façade to route `GET /users/*` and `POST /users` to the new service. Other routes still proxy to monolith.
5. New service may need access to legacy data — sync via CDC or shared DB during transition.
6. Once all slices are migrated, retire the monolith.

## visualization
```
Stage 0 (before):
  Client → Monolith

Stage 1 (façade in place, nothing migrated yet):
  Client → Façade → Monolith

Stage 2 (user-profile migrated):
  Client → Façade → /users/* → NewService (Users)
                  → /*       → Monolith

Stage 3 (orders also migrated):
  Client → Façade → /users/* → NewService (Users)
                  → /orders/*→ NewService (Orders)
                  → /*       → Monolith

Stage N (everything migrated):
  Client → Façade → NewService (all)
  Monolith decommissioned.
```

## bruteForce
**Big-bang rewrite + cutover**: high risk, halts feature shipping, no incremental validation.

**Live both systems forever**: data drift, doubled cost, never finishes.

**Modify monolith in place**: limited by its constraints (language, framework); doesn't address the reason you're rewriting.

Strangler Fig avoids all three.

## optimal
**Façade options**:
- **API gateway** (Kong, Envoy, AWS API Gateway): route by URL path / method / header.
- **Reverse proxy** (NGINX, HAProxy): simpler routing.
- **Service mesh** (Istio, Linkerd): if you're already on Kubernetes.
- **In-app routing**: BFF (backend-for-frontend) calls one of the two.

**Data sync** during transition (the hard part):
- **Read-through**: new service reads from monolith's DB directly (tight coupling).
- **CDC** (Debezium → Kafka): new service maintains its own DB, kept in sync via change-data-capture.
- **Dual-write**: both services write on mutations. Risky — eventually inconsistent.
- **API call back**: new service calls old service's APIs for legacy data. Slowest.

**Vertical slice selection**: pick slices with **clear bounded contexts** + **low coupling**. Don't pick "all CRUD on `users` table" — pick "user-profile read endpoints" first, then "user-update", then "user-delete".

**Feature-flag the routing**: per-user routing during validation. 1% → 10% → 100%.

## complexity
- **Engineering time**: months to years. Each slice = full design+test+deploy.
- **Operational complexity**: peaks mid-migration when both systems are live + sync infrastructure runs.
- **Data consistency burden**: highest when both systems write to overlapping state.

## pitfalls
- **No retirement step**: stays half-migrated forever. Set a sunset date for the monolith.
- **Façade becomes the new monolith**: routing logic accumulates business rules. Keep the façade dumb (path + method routing only).
- **Underestimated data sync**: dual-write divergence shows up months later. Use CDC as the primary sync, not dual-write.
- **Wrong slice order**: rewriting "easy" slices first, leaving the gnarly authentication tangle for last. Tackle the hard slice early or you may abandon mid-migration.
- **No rollback plan per slice**: a slice goes live, breaks; revert means a façade config change but data may have diverged. Plan rollback per slice.
- **Cross-service transactions**: an operation that was a single monolith tx now spans 2 services → distributed-tx complexity. Often forces saga patterns or domain redesign.

## interviewTips
- For "how do you migrate a legacy monolith to microservices" → Strangler Fig with façade.
- Cite **bounded contexts** (DDD) as the basis for slice selection.
- For senior interviews, discuss **data sync strategies** (CDC vs dual-write), **service boundaries**, **migrating shared databases** (separate-then-replicate).

## code.python
```python
# Conceptually: façade is an HTTP gateway with route table.
# Sample with FastAPI as a façade.
from fastapi import FastAPI, Request
import httpx
app = FastAPI()
NEW_SERVICE = "http://users-svc:8080"
MONOLITH = "http://monolith:8080"
NEW_ROUTES = {("GET", "/users"), ("POST", "/users"), ("GET", "/users/{id}")}

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def route(request: Request, path: str):
    target = NEW_SERVICE if (request.method, f"/{path}") in NEW_ROUTES else MONOLITH
    async with httpx.AsyncClient() as c:
        upstream = await c.request(request.method, f"{target}/{path}",
                                   headers=request.headers, content=await request.body())
    return upstream.content, upstream.status_code, dict(upstream.headers)
```

## code.javascript
```javascript
// NGINX façade config (excerpt)
//   location /users { proxy_pass http://new-users-svc; }
//   location /     { proxy_pass http://monolith; }

// Or Envoy:
// route_config:
//   virtual_hosts:
//     - routes:
//       - match: { prefix: "/users" }
//         route: { cluster: new_users_svc }
//       - match: { prefix: "/" }
//         route: { cluster: monolith }
```

## code.java
```java
// Spring Cloud Gateway
@Bean
public RouteLocator routes(RouteLocatorBuilder b) {
    return b.routes()
        .route("users-new",  r -> r.path("/users/**").uri("http://new-users-svc"))
        .route("monolith",   r -> r.path("/**").uri("http://monolith"))
        .build();
}
```

## code.cpp
```cpp
// Typically deployed as Envoy / NGINX config rather than C++ code.
// Conceptually: parse incoming request, lookup in route table, forward to upstream cluster.
```
