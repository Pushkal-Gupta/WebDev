---
slug: load-balancing
module: system-design
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
A single web server handles maybe a few thousand requests per second before it tips over. A load balancer turns "scale up by buying a bigger box" (vertical, eventually capped) into "scale out by adding boxes" (horizontal, effectively unbounded). It also gives you health checks (route around dead servers), zero-downtime deploys (drain traffic from a node, restart it, rejoin), and a hook for SSL termination + DDoS mitigation.

## intuition
Think of a fast-food chain with one counter and ten registers behind it. A greeter at the counter looks at the queue at each register and routes you to the shortest one. The greeter doesn't cook anything — they just distribute work. If a register breaks, the greeter stops sending people there. If a busy lunch hits, you add more registers; the greeter doesn't need to change. That greeter is the load balancer.

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
Run a dedicated L4 or L7 load balancer (HAProxy, Nginx, ALB/NLB, Envoy) with these key knobs:

- **Algorithm**: round-robin, least-connections, weighted (capacity-aware), consistent-hash (for session stickiness or cache locality).
- **Health checks**: TCP, HTTP, or app-level. Pull unhealthy nodes out of rotation within seconds.
- **Sticky sessions**: optional — needed only if your app stores per-user state on a single node (avoid this if you can; push state to a shared cache).
- **TLS termination**: terminate HTTPS at the LB so backend servers can speak plaintext over the private network.
- **Layered LBs**: a global anycast LB (DNS / GeoDNS) routes by region; a regional LB routes within the region.

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
