---
slug: api-gateway-pattern
module: system-design
title: API Gateway Pattern
subtitle: One edge layer for auth, rate-limit, routing, and response shaping across many backend services.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Microservices.io — API Gateway pattern"
    url: "https://microservices.io/patterns/apigateway.html"
    type: book
  - title: "Martin Fowler — Backends For Frontends"
    url: "https://martinfowler.com/articles/gateway-pattern.html"
    type: blog
  - title: "donnemartin/system-design-primer — API Gateway"
    url: "https://github.com/donnemartin/system-design-primer#api-gateway"
    type: repo
status: published
---

## intro
An API gateway is a single front door that sits between clients and a fleet of internal services. It handles cross-cutting concerns — TLS termination, authentication, authorization, rate limiting, request routing, response aggregation, schema translation, and observability — so each downstream service can stay narrow and protocol-pure. Done right it turns "thirty services × five client types" from N×M into N+M.

## whyItMatters
Without a gateway, every team reinvents auth middleware, every mobile client knows the topology of your microservices, and every breaking refactor becomes a coordinated multi-team release. With a gateway, the public contract is stable while internal services evolve freely. It is also the natural place to enforce abuse controls and SLO-aware throttling before bad traffic reaches your databases.

## intuition
Think of an airport. Without one, every airline would build its own security, customs, and gate signage. With one, passengers go through a single, consistent screening and dispatch — and the airlines (services) can focus on actually flying planes. The gateway is that terminal: opinionated about ingress, neutral about what happens past the gate.

## visualization
Imagine `GET /v1/orders/123` hitting the gateway. Step 1: TLS terminates. Step 2: JWT verified against the issuer's JWKS. Step 3: rate-limit bucket for `user_42` decremented. Step 4: route table matches `/v1/orders/*` → `orders-svc`. Step 5: gateway calls `orders-svc/internal/orders/123`, attaches a tenant header, and times the response. Step 6: response shaped — strip internal fields, fold in user display name from `profile-svc` if requested. Step 7: structured access log emitted.

## bruteForce
Expose every microservice directly. Each one runs its own auth library, its own throttling, its own CORS handler. The mobile app hardcodes ten hostnames. A 5xx in `profile-svc` returns a raw stack trace because nobody owned the public error contract. This works for a hackathon and becomes unmaintainable past three services.

## optimal
Use a dedicated gateway (Kong, Envoy + a control plane, Apigee, AWS API Gateway, custom Express/Spring app) for the cross-cutting layer. For very different client types (mobile, web, partner), adopt the Backends-For-Frontends variant: one gateway per client persona so you do not bloat a single config trying to please everyone. Keep business logic out of the gateway — it routes, authenticates, throttles, and shapes; it should not own domain rules.

## complexity
time: O(1) per route lookup (trie or hashmap)
space: O(R + U) for R route entries and U active rate-limit buckets
notes: The real cost is the extra network hop (typically 1–3 ms intra-AZ) and the gateway becoming a tier-zero dependency. Plan for HA replicas and zero-downtime config reloads from day one.

## pitfalls
- Letting business logic creep into the gateway — "just one little if statement" becomes a parallel codebase nobody owns.
- Making the gateway a single point of failure with one replica and no health checks.
- Centralizing rate limits in memory; survives one pod restart, not a region failover.
- Forgetting to propagate trace IDs — debugging a 502 across the gateway becomes guesswork.
- Coupling all clients to one fat gateway when their needs diverge — split into BFFs.

## interviewTips
- Distinguish gateway (L7, auth + routing + shaping) from load balancer (L4/L7, traffic distribution). Many candidates conflate them.
- Mention concrete features: JWT validation, per-route rate limits, request/response transforms, canary routing, WAF.
- Bring up the BFF pattern when mobile and web have different needs.
- If pushed on resilience: gateway should circuit-break per downstream and shed load before saturating.

## code.python
```python
from flask import Flask, request, abort, jsonify
import jwt, time, requests
from collections import defaultdict

app = Flask(__name__)
ROUTES = {"/v1/orders": "http://orders-svc", "/v1/users": "http://users-svc"}
RATE = defaultdict(list)
LIMIT, WINDOW = 100, 60

def check_rate(user):
    now = time.time()
    RATE[user] = [t for t in RATE[user] if t > now - WINDOW]
    if len(RATE[user]) >= LIMIT:
        abort(429)
    RATE[user].append(now)

@app.before_request
def gateway():
    token = request.headers.get("Authorization", "").removeprefix("Bearer ")
    try:
        claims = jwt.decode(token, JWKS, algorithms=["RS256"])
    except jwt.InvalidTokenError:
        abort(401)
    check_rate(claims["sub"])
    request.user_id = claims["sub"]

@app.route("/<path:p>", methods=["GET", "POST"])
def route(p):
    for prefix, upstream in ROUTES.items():
        if request.path.startswith(prefix):
            r = requests.request(request.method, upstream + request.path,
                                 headers={"X-User-Id": request.user_id}, data=request.get_data())
            return r.content, r.status_code
    abort(404)
```

## code.javascript
```javascript
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const ROUTES = { '/v1/orders': 'http://orders-svc', '/v1/users': 'http://users-svc' };
const buckets = new Map();
const LIMIT = 100, WINDOW = 60_000;

function checkRate(user) {
  const now = Date.now();
  const hits = (buckets.get(user) || []).filter(t => t > now - WINDOW);
  if (hits.length >= LIMIT) throw { status: 429 };
  hits.push(now);
  buckets.set(user, hits);
}

app.use(async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    req.user = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
    checkRate(req.user.sub);
    next();
  } catch (e) {
    res.status(e.status || 401).end();
  }
});

app.all('*', async (req, res) => {
  const entry = Object.entries(ROUTES).find(([p]) => req.path.startsWith(p));
  if (!entry) return res.sendStatus(404);
  const upstream = await fetch(entry[1] + req.path, { method: req.method, headers: { 'X-User-Id': req.user.sub } });
  res.status(upstream.status).send(await upstream.text());
});
```

## code.java
```java
@RestController
public class GatewayController {
    private final Map<String, String> routes = Map.of("/v1/orders", "http://orders-svc", "/v1/users", "http://users-svc");
    private final Map<String, Deque<Long>> buckets = new ConcurrentHashMap<>();
    private static final int LIMIT = 100; private static final long WIN = 60_000;

    private void rate(String user) {
        long now = System.currentTimeMillis();
        Deque<Long> q = buckets.computeIfAbsent(user, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && q.peekFirst() < now - WIN) q.pollFirst();
            if (q.size() >= LIMIT) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS);
            q.add(now);
        }
    }

    @RequestMapping("/**")
    public ResponseEntity<byte[]> route(HttpServletRequest req, @RequestHeader("Authorization") String auth) {
        Claims c = Jwts.parserBuilder().setSigningKey(KEY).build().parseClaimsJws(auth.substring(7)).getBody();
        rate(c.getSubject());
        String path = req.getRequestURI();
        return routes.entrySet().stream().filter(e -> path.startsWith(e.getKey())).findFirst()
            .map(e -> upstream(e.getValue() + path, req, c.getSubject()))
            .orElse(ResponseEntity.notFound().build());
    }
}
```

## code.cpp
```cpp
struct Gateway {
    std::unordered_map<std::string, std::string> routes{{"/v1/orders", "http://orders-svc"}};
    std::unordered_map<std::string, std::deque<long>> buckets;
    static constexpr int LIMIT = 100;
    static constexpr long WIN_MS = 60'000;
    std::mutex mu;

    void rate(const std::string& user) {
        std::lock_guard<std::mutex> g(mu);
        auto now = now_ms();
        auto& q = buckets[user];
        while (!q.empty() && q.front() < now - WIN_MS) q.pop_front();
        if ((int)q.size() >= LIMIT) throw HttpError{429};
        q.push_back(now);
    }

    HttpResponse handle(const HttpRequest& req) {
        auto claims = verify_jwt(req.header("Authorization"));
        rate(claims.sub);
        for (auto& [prefix, upstream] : routes)
            if (req.path.rfind(prefix, 0) == 0)
                return proxy(upstream + req.path, req, claims.sub);
        return HttpResponse{404};
    }
};
```
