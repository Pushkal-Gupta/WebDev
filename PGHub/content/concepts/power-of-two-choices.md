---
slug: power-of-two-choices
module: sd-reliability
title: Power of Two Choices
subtitle: Pick two servers at random, send the request to the less-loaded one. Cuts max load from O(log n) to O(log log n).
difficulty: Intermediate
position: 19
estimatedReadMinutes: 5
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
A classic randomized load-balancing trick: instead of routing each request to a single random server, **sample TWO at random and pick the less-loaded one**. The max load across n servers drops from `O(log n / log log n)` (uniform random) to `O(log log n)` — a huge improvement at essentially the same cost.

## whyItMatters
Production load balancers use this:
- **Nginx, HAProxy, Envoy** — implement P2C variants (often called "least-loaded among two").
- **AWS NLB, GCP backend services** — power-of-2 style selection.
- **Distributed task queues** — workers pull from one of two random queues.
- **Hash table chaining** — Cuckoo hashing is a close cousin (two hash functions).

The math is striking: doubling the choice set from 1 to 2 gets you exponential improvement; going from 2 to 3 barely helps.

## intuition
Plain random load balancing: each of n requests goes to a uniformly random server. By birthday-paradox-style accounting, some server will end up with `O(log n / log log n)` requests just by chance.

Sampling TWO and picking the less-loaded one introduces a feedback loop: a heavily-loaded server is one of two candidates more often than the lightly-loaded ones, but it'll only be picked when its random partner is even more heavily loaded — vanishingly unlikely once the system is balanced. Max load drops to `O(log log n)`.

## visualization
```
n = 8 servers, 8 requests.

Pure random (one choice):  one server might get 3 requests (max load 3).
P2C (two choices):         max load stays at 1 or 2 with overwhelming probability.

Visualize: roll two 8-sided dice per request, pick the slot with fewer balls.
```

## bruteForce
**Round-robin**: deterministic — perfectly even but stateful (need a shared counter). Doesn't adapt to actual server load if requests have varying cost.

**Single random**: stateless, simple, but max load grows as O(log n / log log n).

## optimal
```
def route(request, servers):
    a, b = random.sample(servers, 2)
    pick = a if load_of(a) <= load_of(b) else b
    record_request(pick, request)
    return pick
```

That's it. No central coordinator, no global state — just two random samples per request.

**Variations**:
- **Power of `d` choices** for d > 2: marginal returns are tiny; d = 2 is the sweet spot.
- **Weighted P2C**: weight each pick by inverse capacity (e.g., bigger servers get more traffic).
- **P2C with stale state**: in distributed systems where load info is stale (gossip lag), still works well — just not optimally.

## complexity
- **Per request**: O(1) — sample two, compare loads.
- **Max load**: `O(log log n)` whp with P2C; `O(log n / log log n)` with pure random.
- **Network coordination**: zero. Each LB node decides locally.

## pitfalls
- **Stale load data**: in a distributed LB, each instance may have outdated views of server load. P2C is fairly robust to staleness; pure least-loaded (compare all servers) actually performs WORSE under staleness because the "least-loaded" view is wrong.
- **Sampling without replacement**: pick TWO DIFFERENT servers. Sampling with replacement (could pick the same one twice) collapses to pure random.
- **Comparing irrelevant metrics**: pick the metric that matters (active connections, queue depth, recent p99 latency) — not just CPU.
- **Server pool changes during execution**: handle gracefully — if one of the two sampled servers is removed mid-decision, retry.

## interviewTips
- For "design load balancer for N stateless servers" — mention P2C alongside round-robin, least-connections, consistent hashing.
- Cite the **O(log log n) bound** as the surprising win.
- For very senior interviews, contrast with **JSQ (Join-Shortest-Queue)** which is theoretically better but needs global state — P2C is the practical compromise.
- Mention nginx's `least_conn` mode uses a similar approach under the hood.

## code.python
```python
import random
class P2CBalancer:
    def __init__(self, servers):
        self.servers = list(servers)
        self.load = { s: 0 for s in self.servers }
    def pick(self):
        a, b = random.sample(self.servers, 2)
        return a if self.load[a] <= self.load[b] else b
    def request(self):
        s = self.pick()
        self.load[s] += 1
        return s
    def release(self, s):
        self.load[s] = max(0, self.load[s] - 1)

lb = P2CBalancer(['s1','s2','s3','s4','s5'])
for _ in range(1000): lb.request()
print(lb.load)   # roughly even; max only ~210 vs uniform random's ~250
```

## code.javascript
```javascript
class P2C {
  constructor(servers) {
    this.servers = [...servers];
    this.load = new Map(this.servers.map(s => [s, 0]));
  }
  pick() {
    const i = Math.floor(Math.random() * this.servers.length);
    let j = Math.floor(Math.random() * (this.servers.length - 1));
    if (j >= i) j++;
    const a = this.servers[i], b = this.servers[j];
    return this.load.get(a) <= this.load.get(b) ? a : b;
  }
  request() { const s = this.pick(); this.load.set(s, this.load.get(s) + 1); return s; }
}
```

## code.java
```java
import java.util.*;
class P2CBalancer {
    private final String[] servers;
    private final Map<String, Integer> load = new HashMap<>();
    private final Random rng = new Random();
    public P2CBalancer(String[] s) { servers = s; for (String x : s) load.put(x, 0); }
    public String pick() {
        int i = rng.nextInt(servers.length);
        int j = rng.nextInt(servers.length - 1);
        if (j >= i) j++;
        return load.get(servers[i]) <= load.get(servers[j]) ? servers[i] : servers[j];
    }
    public String request() { String s = pick(); load.merge(s, 1, Integer::sum); return s; }
}
```

## code.cpp
```cpp
#include <vector>
#include <unordered_map>
#include <random>
#include <string>
class P2C {
    std::vector<std::string> servers;
    std::unordered_map<std::string,int> load;
    std::mt19937 rng{std::random_device{}()};
public:
    P2C(const std::vector<std::string>& s) : servers(s) { for (auto& x : s) load[x] = 0; }
    std::string pick() {
        std::uniform_int_distribution<int> d(0, servers.size() - 1);
        int i = d(rng), j;
        do { j = d(rng); } while (j == i);
        return load[servers[i]] <= load[servers[j]] ? servers[i] : servers[j];
    }
    std::string request() { auto s = pick(); load[s]++; return s; }
};
```
