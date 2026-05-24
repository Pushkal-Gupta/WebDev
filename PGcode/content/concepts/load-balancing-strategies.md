---
slug: load-balancing-strategies
module: system-design
title: Load Balancing Strategies
subtitle: Round-robin / least-connections / least-latency / consistent-hash / power-of-2 choices. Pick by traffic shape + backend state.
difficulty: Intermediate
position: 45
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Cloudflare Learning — Load balancing"
    url: "https://www.cloudflare.com/learning/performance/what-is-load-balancing/"
    type: book
  - title: "NGINX docs — Load balancing methods"
    url: "https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/"
    type: blog
  - title: "envoyproxy/envoy — L7 load balancer"
    url: "https://github.com/envoyproxy/envoy"
    type: repo
status: published
---

## intro
A **load balancer** sits between clients and a pool of backends, routing each request to one of them. Algorithm choice matters: **round-robin** rotates; **least-connections** prefers idle backends; **least-latency** picks the fastest; **consistent hashing** keeps the same client/key sticky to the same backend; **power-of-two-choices** randomly samples 2 and picks the less loaded. Each strategy fits different workloads.

## whyItMatters
The default strategy in your LB / service mesh has 10× impact on tail latency, cache hit rate, and operational pain:
- AWS NLB / ALB / GCP LB / nginx / Envoy / Istio — all expose these choices.
- Wrong choice = hot spots, cache misses, retry storms.

A senior systems-design interview expects you to pick + justify the strategy.

## intuition
**Round-robin**: simple, fair if backends are identical. Fails when backends have different capacity or current load.

**Least-connections**: track active conn count per backend; route to the lowest. Adapts to backend speed differences. Standard for HTTP-keep-alive workloads.

**Least-latency / weighted least-response-time** (Envoy P2C-LR): track recent p95 latency per backend; route to fastest. Best for heterogeneous backends.

**Consistent hashing**: hash a key (user_id, sessionId, URL path) modulo N backends → same key always lands on same backend. Critical for caches (CDN, Memcached); deterministic routing minimizes cache misses on backend changes. Use **ring** + virtual nodes for smooth rebalancing.

**Power-of-two-choices (P2C)**: sample 2 random backends, pick the less loaded. Strong theoretical guarantee: max load `O(log log n)` vs `O(log n)` for pure random. Used in Envoy, Finagle.

**IP hash / session affinity**: derive backend from client IP. Sticky sessions; works for stateful backends but creates hot spots if some IPs are heavier.

## visualization
```
Round-robin (4 backends, 8 requests):
  req 1 → B1   req 2 → B2   req 3 → B3   req 4 → B4
  req 5 → B1   req 6 → B2   req 7 → B3   req 8 → B4

Least-connections (B1 currently has 3 active conns, B2:1, B3:1, B4:5):
  next req → B2 (or B3, tie). Skip B4.

Consistent hash (user_id → ring position):
  Ring (hashed) = [B1 @ 100, B2 @ 200, B3 @ 300, B4 @ 400]
  user 42 hashes to 250 → first backend clockwise = B3.
  Always B3 → backend cache stays warm for this user.
  Remove B3: user 42 now → B4. Only users between 200..300 reshuffle.

Power-of-two (4 backends with loads [10, 3, 8, 5]):
  Pick 2 random: say B1 (10) + B4 (5). Use B4.
  Pick 2 random: say B2 (3) + B3 (8). Use B2.
  Drives loads toward equality without measuring all backends.
```

## bruteForce
**Random**: simple but max-loaded backend grows as O(log n / log log n). Worse than even round-robin under load.

**Pick least-loaded across all**: O(n) per route; with N=1000 backends and 100k req/s, that's 100M comparisons/sec. Use P2C instead.

**Single backend (no LB)**: SPOF; no scaling.

## optimal
**Selection rubric**:
| Workload | Strategy |
|---|---|
| Stateless homogeneous backends | Round-robin (simplest) |
| Long-lived connections (WebSockets) | Least-connections |
| Heterogeneous backend speed | Least-response-time / P2C latency-aware |
| Caching layer (CDN, Memcached, in-memory cache) | Consistent hashing |
| Multi-region routing | Latency-based DNS (Route 53) + nearest-LB |
| 10k+ backends | P2C (skip O(n) lookups) |

**Health checks**: every strategy needs the LB to remove unhealthy backends. Active checks (LB pings backend's `/healthz` every 5s) + passive (track recent error rate; eject backends with > 5% errors for N seconds).

**Outlier detection** (Envoy): identifies backends with significantly worse latency than peers; ejects them temporarily.

**Slow-start**: when a new backend joins, ramp traffic gradually over 30-60s so it can warm caches / JIT before full load.

**Stickiness vs balance trade-off**: consistent hashing maximizes cache hit but creates uneven load if keys aren't uniform. Add virtual nodes (each backend gets 100 hash positions) to spread load.

## complexity
- **Round-robin**: O(1) per route.
- **Least-connections**: O(1) with min-heap.
- **Consistent hashing**: O(log V) where V = virtual node count.
- **Power-of-two**: O(1) for the two random samples + comparison.

## pitfalls
- **Round-robin with sticky sessions**: contradiction. Pick one.
- **Consistent hashing without virtual nodes**: removing one backend reshuffles a huge arc of keys. Use 100-200 virtual nodes per backend.
- **Stale health-check state**: a backend marked unhealthy stays out for too long; recovery delayed. Tune ejection time.
- **Cold backend taking full load**: no slow-start → first 10s of traffic all 500s.
- **LB itself as SPOF**: deploy multiple LB instances; use DNS round-robin or anycast IP.

## interviewTips
- For "design a load balancer" — discuss the algorithm options + health checks + slow-start + outlier detection.
- For "design a CDN" — consistent hashing for cache nodes; latency-based DNS for client routing.
- For senior interviews, discuss **P2C theoretical bound** and why it beats pure random.

## code.python
```python
# Consistent hashing with virtual nodes
import hashlib, bisect
class ConsistentHash:
    def __init__(self, vnodes_per_node=150):
        self.vnodes_per_node = vnodes_per_node
        self.ring = []           # sorted list of (hash, node)
        self.nodes = set()
    def _hash(self, key):
        return int(hashlib.md5(key.encode()).hexdigest(), 16)
    def add(self, node):
        self.nodes.add(node)
        for i in range(self.vnodes_per_node):
            h = self._hash(f'{node}#{i}')
            bisect.insort(self.ring, (h, node))
    def route(self, key):
        if not self.ring: return None
        h = self._hash(key)
        idx = bisect.bisect_right(self.ring, (h, ''))
        return self.ring[idx % len(self.ring)][1]

ch = ConsistentHash()
for b in ['B1', 'B2', 'B3', 'B4']: ch.add(b)
print(ch.route('user42'))    # always same backend until B's change
```

## code.javascript
```javascript
// Power-of-two-choices
class P2C {
  constructor(backends) { this.backends = backends; this.load = new Map(backends.map(b => [b, 0])); }
  pick() {
    const i = Math.floor(Math.random() * this.backends.length);
    let j = Math.floor(Math.random() * (this.backends.length - 1));
    if (j >= i) j++;
    const a = this.backends[i], b = this.backends[j];
    return this.load.get(a) <= this.load.get(b) ? a : b;
  }
  release(backend) { this.load.set(backend, Math.max(0, this.load.get(backend) - 1)); }
}
```

## code.java
```java
// Spring Cloud LoadBalancer — pluggable strategy
@Bean
ReactorLoadBalancer<ServiceInstance> roundRobin(Environment env, LoadBalancerClientFactory f) {
    return new RoundRobinLoadBalancer(f.getLazyProvider(env.getProperty("name"), ServiceInstanceListSupplier.class), env.getProperty("name"));
}
```

## code.cpp
```cpp
// Envoy uses C++ — see source/extensions/load_balancing_policies/
// Custom LB: implement LoadBalancer interface in Envoy filter.
```
