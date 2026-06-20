---
slug: queue-priority-fair-sched
module: sd-microservices
title: Fair Multi-Tenant Queue
subtitle: Weighted fair queuing — N tenants share a worker pool without one tenant starving others. Round-robin per tenant, then weighted.
difficulty: Intermediate
position: 59
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Stream Processing"
    url: "https://dataintensive.net/"
    type: book
  - title: "AWS — multi-tenant queue patterns"
    url: "https://aws.amazon.com/builders-library/"
    type: blog
  - title: "Netflix/zuul — adaptive concurrency control"
    url: "https://github.com/Netflix/zuul"
    type: repo
status: published
---

## intro
A SaaS backend serves N tenants. They share workers (web/API/job processors). A naïve FIFO queue lets one bursty tenant monopolize workers → other tenants starve. **Fair multi-tenant queuing** ensures every tenant gets a share — exactly equal (round-robin) or weighted by plan tier.

## whyItMatters
The "noisy neighbor" problem. Without fairness:
- A free-tier customer floods the API → enterprise customers get 5xx.
- A batch import job fills the worker pool → real-time requests time out.
- One bug in customer X's code → cascading failure for everyone.

Stripe, Cloudflare, Slack all run multi-tenant fair scheduling. It's a hard requirement past 10 tenants.

## intuition
Two approaches:

**Per-tenant queue + round-robin**:
- Maintain N queues, one per tenant.
- Worker pulls round-robin: T1's queue → T2's queue → ... → Tn's queue → back to T1.
- Each tenant gets 1/N of capacity. Empty queues skipped.

**Weighted fair queuing (WFQ)**:
- Each tenant has a weight (free=1, paid=10, enterprise=100).
- Worker picks the tenant with the smallest "virtual finish time."
- Effectively gives each tenant capacity proportional to weight.

**Token bucket per tenant + global queue**:
- Each tenant has a token bucket sized by their plan.
- When tokens available, requests can be served.
- Throttles bursting individual tenants.

## visualization
```
Naive FIFO (broken):
  Queue: T1 T1 T1 T1 T1 T1 T1 T1 T2 T3
  Workers: process T1 (8 jobs) → T2 → T3. T2 + T3 wait.

Per-tenant round-robin:
  T1 queue: J1, J2, J3, J4, J5
  T2 queue: J6
  T3 queue: J7

  Worker round-robin:
    J1 (T1), J6 (T2), J7 (T3), J2 (T1), [T2 empty], [T3 empty], J3 (T1), ...
  T2 + T3 served promptly; T1 doesn't dominate.

Weighted fair (T1=1, T2=10):
  Virtual time advances slower for higher-weight tenants.
  T2 processed at 10× the rate of T1.
```

## bruteForce
**Single global queue (FIFO)**: noisy-neighbor problem.

**Rate limiter only**: rejects under load instead of fairly queuing — bad UX.

**Strict priority**: highest priority eats everything; lower starve.

Fair queuing is the only stable answer.

## optimal
**Implementation pattern**:
1. **Receive** job → derive tenant_id → enqueue into `queue[tenant_id]`.
2. **Worker** runs loop:
   ```
   while True:
       tenant = pick_next_tenant()   # round-robin or WFQ
       job = queue[tenant].pop()
       if job: process(job)
       else: skip
   ```
3. **Pick policy**:
   - Round-robin: cycle through non-empty queues.
   - Weighted: pick tenant with smallest `virtual_time`. Update on dequeue.

**Distributed across workers**: use Redis Streams with consumer groups — each tenant gets its own stream; workers pull round-robin across streams.

**Kafka**: per-tenant partition (use tenant_id as key). Caps you at N partitions per topic; OK up to 1000 tenants.

**Bulkheading** (related): isolate tenant pools entirely. T1 has 10 workers, T2 has 10 workers. No sharing. Stronger isolation at cost of unused capacity.

## complexity
- **Per-job overhead**: O(log N) with priority queue of tenants.
- **Memory**: O(active tenants × queue length).
- **Worker idle time**: less than FIFO if multiple tenants compete; more if only one tenant has work (since round-robin can no-op).

## pitfalls
- **No upper bound on per-tenant queue**: one tenant queues 1M jobs → OOM. Cap per-tenant queue length.
- **Tenant_id derivation wrong**: free-tier traffic routed as enterprise. Use authenticated tenant from JWT, not user-supplied header.
- **Quota policy ambiguity**: weight = absolute concurrency? rate-per-second? bytes-per-second? Pick one + document.
- **Forgetting starvation under skew**: weighted fair can still starve a 0-weight tenant. Use minimum-share floor.
- **Workers not aware of fairness**: pool of generic workers polling global FIFO. Workers need to know about queue topology.

## interviewTips
- For "how do you prevent one customer from impacting others" → per-tenant queue + round-robin / WFQ.
- Mention **bulkheading** as the stronger alternative.
- For senior interviews, discuss **virtual-time queues (WFQ)**, **per-tier quotas (free vs enterprise)**, **adaptive concurrency control** (Netflix Zuul).

## code.python
```python
import heapq, threading, time
class FairScheduler:
    def __init__(self):
        self.queues = {}        # tenant_id -> list[job]
        self.weights = {}       # tenant_id -> weight (default 1)
        self.virtual_t = {}     # tenant_id -> virtual time
        self.lock = threading.Lock()

    def enqueue(self, tenant_id, job, weight=1):
        with self.lock:
            self.queues.setdefault(tenant_id, []).append(job)
            self.weights[tenant_id] = weight
            self.virtual_t.setdefault(tenant_id, 0.0)

    def dequeue(self):
        with self.lock:
            # Pick tenant with lowest virtual time AND non-empty queue.
            candidates = [(self.virtual_t[t], t) for t, q in self.queues.items() if q]
            if not candidates: return None
            _, tenant = min(candidates)
            job = self.queues[tenant].pop(0)
            self.virtual_t[tenant] += 1.0 / self.weights[tenant]
            return (tenant, job)
```

## code.javascript
```javascript
// Round-robin per-tenant queue
class RR {
  constructor() { this.q = new Map(); this.cursor = []; }
  enqueue(t, job) {
    if (!this.q.has(t)) { this.q.set(t, []); this.cursor.push(t); }
    this.q.get(t).push(job);
  }
  dequeue() {
    for (let i = 0; i < this.cursor.length; i++) {
      const t = this.cursor.shift();
      this.cursor.push(t);
      const queue = this.q.get(t);
      if (queue.length) return [t, queue.shift()];
    }
    return null;
  }
}
```

## code.java
```java
// Per-tenant queue + weighted virtual time
class FairQueue<J> {
    Map<String, Deque<J>> queues = new HashMap<>();
    Map<String, Double> virt = new HashMap<>();
    Map<String, Integer> weight = new HashMap<>();

    public synchronized void enqueue(String tenant, J job, int w) {
        queues.computeIfAbsent(tenant, k -> new ArrayDeque<>()).add(job);
        weight.put(tenant, w);
        virt.putIfAbsent(tenant, 0.0);
    }
    public synchronized Map.Entry<String, J> dequeue() {
        String chosen = null; double bestVT = Double.MAX_VALUE;
        for (var e : queues.entrySet()) {
            if (e.getValue().isEmpty()) continue;
            if (virt.get(e.getKey()) < bestVT) { bestVT = virt.get(e.getKey()); chosen = e.getKey(); }
        }
        if (chosen == null) return null;
        J job = queues.get(chosen).poll();
        virt.merge(chosen, 1.0 / weight.get(chosen), Double::sum);
        return Map.entry(chosen, job);
    }
}
```

## code.cpp
```cpp
// Same shape: std::map<std::string, std::deque<Job>> queues;
// std::map<std::string, double> virtual_time;
// Pick tenant with lowest virtual_time among non-empty queues.
```
