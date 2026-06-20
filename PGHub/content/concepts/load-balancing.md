---
slug: load-balancing
module: sd-reliability
title: Load Balancing
subtitle: Distribute incoming traffic across a pool of servers so no single node is the bottleneck.
difficulty: Beginner
position: 1
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
A load balancer sits in front of a fleet of servers and routes each incoming request to one of them. From the client's perspective there is a single endpoint; behind that endpoint, many instances share the work. This is the simplest piece of "make it scale horizontally" infrastructure — and it shows up in nearly every system design interview.

## whyItMatters
A single web server handles maybe a few thousand requests per second before it tips over. A load balancer turns "scale up by buying a bigger box" (vertical, eventually capped) into "scale out by adding boxes" (horizontal, effectively unbounded). It also delivers health checks (route around dead servers), zero-downtime deploys (drain traffic from a node, restart it, rejoin), TLS termination, header rewriting, request mirroring for shadow traffic, and a hook for DDoS mitigation. Every cloud provider's L4 / L7 LB (AWS ALB / NLB, GCP Cloud Load Balancing, Azure Front Door), every open-source proxy (HAProxy, Nginx, Envoy, Caddy, Traefik), and every service mesh (Istio, Linkerd, Consul Connect) implements some flavor of this. "Design Twitter, Uber, or YouTube" interview questions all start with a load balancer in the first sketch.

## intuition
Think of a fast-food chain with one counter and ten registers behind it. A greeter at the counter looks at the queue at each register and routes you to the shortest one. The greeter does not cook anything; they just distribute work. If a register breaks, the greeter stops sending people there. If a busy lunch hits, you add more registers without changing the greeter. That greeter is the load balancer.

Two families. **L4 load balancers** (NLB, HAProxy in TCP mode, Envoy `tcp_proxy`) operate at the transport layer — they see TCP connections and route them to backends without parsing the bytes. Fast (millions of connections per second per box), low CPU, suitable for TLS passthrough and non-HTTP protocols. **L7 load balancers** (ALB, Nginx, Envoy, Traefik) terminate the application protocol (HTTP, gRPC, WebSocket), see request paths and headers, and can route based on host, path, header, or weighted percentage. Slower per request but unlock canary deployments, A/B routing, header-based feature flags, and per-route timeouts.

Algorithm choice matters less than it sounds. Round-robin is the default and works fine when backends are homogeneous. Least-connections is better when backend response times vary (long-tail requests pile up on slow backends with round-robin). Weighted variants handle heterogeneous backends (a beefier box gets a higher weight). Consistent hashing (Karger et al. 1997) is the right answer when you need session affinity or cache locality — it minimizes key remappings when backends come and go, which is why Memcached clients and shard-aware databases use it.

## visualization
```
Client ─┐
Client ─┼─► [Load Balancer] ─┬─► Server A
Client ─┘                    ├─► Server B
                             └─► Server C
        (health checks ←──────┘)
```

## bruteForce
Skip the LB entirely and put one server's IP in DNS. Works at toy scale. Breaks the moment that server hits CPU/memory/connection limits, and any reboot is a full outage. Round-robin DNS is a small improvement — DNS hands out different IPs in rotation — but DNS TTLs make it slow to react to failure and gives you no real-time control.

## optimal
Run a dedicated L4 or L7 load balancer at every layer of the stack. At the edge: an L7 LB that terminates TLS, routes by host or path, and emits access logs. Behind that: per-service L4 or L7 LBs for fine-grained traffic shaping. In a service mesh: sidecar L7 LBs (Envoy in Istio, Linkerd's microproxy) that handle service-to-service traffic with mTLS and per-route policy.

```yaml
# Envoy: L7 LB with health checks, retries, outlier detection
clusters:
- name: backend
  connect_timeout: 1s
  type: STRICT_DNS
  lb_policy: LEAST_REQUEST          # better tail than round-robin
  load_assignment:
    cluster_name: backend
    endpoints: [{ lb_endpoints: [...] }]
  health_checks:
  - timeout: 1s
    interval: 5s
    unhealthy_threshold: 3
    healthy_threshold: 2
    http_health_check: { path: /healthz }
  outlier_detection:
    consecutive_5xx: 5
    interval: 10s
    base_ejection_time: 30s
  circuit_breakers:
    thresholds:
    - max_connections: 1024
      max_pending_requests: 256
      max_requests: 1024
```

The critical settings are `health_checks` (probe each backend every 5 s on `/healthz` and eject after 3 failures so dead boxes leave rotation quickly), `outlier_detection` (eject backends that emit 5 consecutive 5xx responses for 30 seconds so a flaky node does not pollute traffic), and `circuit_breakers` (refuse new requests when the backend is overloaded rather than queuing forever). Layer with a global anycast LB (Cloudflare, Fastly, AWS Global Accelerator) for geographic routing and DDoS absorption, then regional LBs for intra-region distribution. Push session state into a shared cache (Redis, Memcached) so backends are stateless and the LB can route any user to any backend — sticky sessions are a smell that almost always indicates state in the wrong place.

## complexity
- **Latency added**: typically <1ms for L4, ~1–5ms for L7.
- **Capacity**: a single modern LB instance handles 100k+ requests/sec; cluster behind anycast for more.
- **Failure mode**: the LB itself is now a single point of failure — run at least two in active-active with health-checked DNS or anycast.

## pitfalls
- Putting session state on individual servers, then trying to bolt on stickiness later — push state to Redis/DB and stay stateless.
- Health-check endpoints that don't actually exercise the dependencies (a server that's lost its DB connection will pass a "200 OK on /health" check).
- Slow-start: dumping full traffic onto a freshly booted node before its caches warm up causes latency spikes.
- Forgetting to pass `X-Forwarded-For` so backend logs lose the real client IP.

## interviewTips
- Always sketch the LB explicitly. "Clients hit the load balancer, which forwards to N stateless web servers" is the second sentence of most senior-level answers.
- Be ready to compare L4 (TCP-level, fast, dumb) vs. L7 (HTTP-aware, can route by URL or header).
- Mention health checks, TLS termination, and the LB-as-SPOF problem proactively.
- When the question shifts to "what if one region is down?", introduce a second LB layer (GeoDNS / anycast).

## code.python
```python
# A tiny round-robin "load balancer" picker.
from itertools import cycle

class RoundRobin:
    def __init__(self, servers):
        self._cycle = cycle(servers)
    def pick(self):
        return next(self._cycle)

lb = RoundRobin(["10.0.0.1", "10.0.0.2", "10.0.0.3"])
for _ in range(5):
    print(lb.pick())
```

## code.javascript
```javascript
class RoundRobin {
  constructor(servers) { this.servers = servers; this.i = 0; }
  pick() { const s = this.servers[this.i % this.servers.length]; this.i++; return s; }
}
const lb = new RoundRobin(["10.0.0.1", "10.0.0.2", "10.0.0.3"]);
for (let i = 0; i < 5; i++) console.log(lb.pick());
```

## code.java
```java
import java.util.*;
class RoundRobin {
    private final List<String> servers;
    private int i = 0;
    RoundRobin(List<String> s) { this.servers = s; }
    synchronized String pick() { return servers.get((i++) % servers.size()); }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
struct RoundRobin {
    std::vector<std::string> servers;
    size_t i = 0;
    std::string pick() { return servers[i++ % servers.size()]; }
};
```
