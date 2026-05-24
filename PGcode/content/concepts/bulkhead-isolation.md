---
slug: bulkhead-isolation
module: system-design
title: Bulkhead Isolation
subtitle: Partition resources so one failing component cannot drain the rest of the system.
difficulty: Intermediate
position: 48
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Microservices.io — Bulkhead Pattern"
    url: "https://microservices.io/patterns/reliability/bulkhead.html"
    type: book
  - title: "Martin Fowler — CircuitBreaker"
    url: "https://martinfowler.com/bliki/CircuitBreaker.html"
    type: blog
  - title: "donnemartin/system-design-primer — Availability Patterns"
    url: "https://github.com/donnemartin/system-design-primer#availability-patterns"
    type: repo
status: published
---

## intro
Ships survive a hull breach because their interior is divided into watertight bulkheads — a single flooded compartment cannot sink the vessel. The bulkhead pattern brings the same idea to software: partition shared resources (threads, connections, queues) so a single dependency's misbehavior cannot starve every caller.

## whyItMatters
The classic outage pattern: a downstream service slows from 50 ms to 5 s. Threads that were serving it pile up waiting. The same thread pool is shared with healthy endpoints, so requests to *those* endpoints can't get a worker. Within a minute the entire service is unresponsive. Bulkheads contain the blast radius: only the misbehaving caller's pool runs dry, and the rest of the API stays alive.

## intuition
Think of a restaurant with one shared dishwasher serving all stations. If the salad station starts producing dishes ten times faster, the grill station eventually runs out of clean plates. Bulkheading means giving each station its own dishwasher: the salad backlog is now visible only at the salad sink, and the grill keeps plating.

## visualization
Total threads: 100. Shared pool: any request can take any thread → 60 slow-downstream requests park 60 threads → 40 left for everything → next burst exhausts the pool → all endpoints time out. Bulkheaded pool: 20 reserved for service A, 30 for B, 50 for C. Service B going slow consumes 30 threads; A and C still have full capacity. Service-A latency unaffected.

## bruteForce
Run all calls on the global executor or default HTTP client. Add timeouts and hope for the best. Timeouts limit how long a thread is wasted, but they do nothing to prevent *all* threads being wasted simultaneously on the same dependency. The fix-of-last-resort is "restart the JVM" once a week.

## optimal
Allocate dedicated resource pools per downstream (semaphore-style or thread-pool-style) with hard caps. When the pool is full, reject fast — return 503 or a cached fallback rather than queuing. Pair bulkheads with circuit breakers (skip calls when the dependency is known dead) and timeouts (cap the cost of any single call). Pick pool sizes from peak QPS times p99 latency: pool ≥ qps × latency_seconds. Monitor pool saturation per dependency — that signal predicts customer-visible failures earlier than error rate.

## complexity
time: O(1) per request (semaphore acquire/release)
space: O(p) where p is the number of bulkheaded pools
notes: Memory cost is constant per pool; latency overhead is one atomic increment on the hot path.

## pitfalls
- Oversizing every pool — defeats the purpose, since the sum exceeds the host's capacity.
- Sharing a connection pool with the bulkhead — threads are isolated but the JDBC pool is the real bottleneck.
- Forgetting to bulkhead the *queue*, not just the *executor* — unbounded queues hide the failure until OOM.
- No fallback: rejecting fast is better than hanging, but a cached/default response is better still.
- Per-request bulkheading at the API gateway only — internal service-to-service calls also need isolation.

## interviewTips
- Pair with circuit breaker, timeout, retry-with-jitter — call it "the resilience quartet."
- Cite Netflix Hystrix as the canonical implementation and Resilience4j as its modern successor.
- Mention thread-pool vs semaphore bulkheads — semaphore is cheaper, thread-pool also isolates CPU.

## code.python
```python
import asyncio
from contextlib import asynccontextmanager

class Bulkhead:
    def __init__(self, max_concurrent):
        self.sem = asyncio.Semaphore(max_concurrent)
        self.rejected = 0
    @asynccontextmanager
    async def slot(self):
        if self.sem.locked():
            self.rejected += 1
            raise RuntimeError("bulkhead full")
        async with self.sem:
            yield

billing = Bulkhead(20)
search = Bulkhead(50)

async def call_billing():
    async with billing.slot():
        await asyncio.sleep(0.1)
        return "ok"
```

## code.javascript
```javascript
class Bulkhead {
  constructor(max) { this.max = max; this.inFlight = 0; this.rejected = 0; }
  async run(fn) {
    if (this.inFlight >= this.max) {
      this.rejected++;
      throw new Error("bulkhead full");
    }
    this.inFlight++;
    try { return await fn(); }
    finally { this.inFlight--; }
  }
}

const billing = new Bulkhead(20);
const search = new Bulkhead(50);

async function callBilling() {
  return billing.run(async () => {
    const res = await fetch("/billing");
    return res.json();
  });
}
```

## code.java
```java
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicLong;

public class Bulkhead {
    private final Semaphore sem;
    private final AtomicLong rejected = new AtomicLong();

    public Bulkhead(int permits) { this.sem = new Semaphore(permits); }

    public <T> T run(java.util.function.Supplier<T> task) {
        if (!sem.tryAcquire()) {
            rejected.incrementAndGet();
            throw new IllegalStateException("bulkhead full");
        }
        try { return task.get(); }
        finally { sem.release(); }
    }
}
```

## code.cpp
```cpp
#include <atomic>
#include <stdexcept>
#include <functional>

class Bulkhead {
    const int max_;
    std::atomic<int> inFlight{0};
    std::atomic<long> rejected{0};
public:
    explicit Bulkhead(int m) : max_(m) {}
    template <class F>
    auto run(F fn) -> decltype(fn()) {
        int cur = inFlight.fetch_add(1) + 1;
        if (cur > max_) {
            inFlight.fetch_sub(1);
            rejected.fetch_add(1);
            throw std::runtime_error("bulkhead full");
        }
        try {
            auto r = fn();
            inFlight.fetch_sub(1);
            return r;
        } catch (...) {
            inFlight.fetch_sub(1);
            throw;
        }
    }
};
```
