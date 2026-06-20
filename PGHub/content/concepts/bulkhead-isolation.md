---
slug: bulkhead-isolation
module: sd-reliability
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
- **Netflix's Hystrix** (open-sourced 2012, now in maintenance mode) made bulkheads mainstream — per-dependency thread pools with semaphore fallbacks, born from the 2008 AWS outage that took down `netflix.com`.
- **Resilience4j** is Hystrix's modern successor (Java/Kotlin), shipping bulkhead, circuit breaker, retry, rate limiter, and timeout as composable decorators; **Polly** (.NET) and **failsafe-go** (Go) provide the same primitives.
- **Kubernetes resource requests/limits** (CPU and memory per pod), **Linux cgroups**, and **AWS Lambda's per-function concurrency limit** are bulkheads at the container/process layer — one runaway workload cannot starve siblings.
- **Real outage case studies** — the 2017 GitLab incident, the 2019 Cloudflare 502 event, and AWS's RDS Multi-AZ failure modes — all trace back to shared thread pools or connection pools being drained by one slow dependency; bulkheads would have contained each blast radius.

## intuition
The failure mode bulkheads prevent is **resource exhaustion via a single misbehaving dependency**. The textbook scenario: your service exposes 10 endpoints, each calling a different downstream. Normally each downstream responds in 50 ms, and your shared thread pool of 100 workers handles 2000 RPS comfortably. One downstream (say `billing`) slows from 50 ms to 5 seconds — perhaps a Postgres lock contention spike. Within a minute, every thread is parked waiting on `billing`; the pool has zero free workers; requests to the other 9 endpoints can no longer acquire a worker; your entire service starts returning 503s. One slow dependency took down the whole API.

The fix is to **partition shared resources**: give each downstream its own dedicated pool with a hard cap. When `billing`'s pool fills up, new `billing` requests are rejected fast (fail-fast 503 or a cached fallback), but the other 9 endpoints still have their full pools available. The blast radius shrinks from "the whole service" to "one endpoint."

The naval analogy is precise. Ships survive hull breaches because their interior is divided into **watertight bulkheads** — a single flooded compartment cannot sink the vessel. Without bulkheads, water from one breach floods the entire hull and the ship sinks; with bulkheads, the breach is contained and the ship limps home. Titanic famously had bulkheads but they were too short — water poured over the tops when the bow tilted, defeating the design. The lesson translates: bulkheads work only if every shared resource downstream of the partition is also partitioned (thread pool AND connection pool AND queue), otherwise the partitioned threads simply queue up at the next shared resource.

The disciplines that pair with bulkheads: **timeouts** cap how long any single request can hold a slot, **circuit breakers** stop sending requests to known-dead downstreams (preserving slot inventory), and **retry with jitter** prevents thundering-herd recovery. Together they form what the Hystrix team called the "resilience quartet."

## visualization
Total threads: 100. Shared pool: any request can take any thread → 60 slow-downstream requests park 60 threads → 40 left for everything → next burst exhausts the pool → all endpoints time out. Bulkheaded pool: 20 reserved for service A, 30 for B, 50 for C. Service B going slow consumes 30 threads; A and C still have full capacity. Service-A latency unaffected.

## bruteForce
Run all calls on the global executor or default HTTP client. Add timeouts and hope for the best. Timeouts limit how long a thread is wasted, but they do nothing to prevent *all* threads being wasted simultaneously on the same dependency. The fix-of-last-resort is "restart the JVM" once a week.

## optimal
The right architecture is **per-dependency resource pools with hard caps and fail-fast rejection**, sized from Little's Law and paired with timeouts plus circuit breakers. Two flavors exist: **thread-pool bulkheads** isolate CPU and blocked I/O on dedicated threads (heavier, also isolates GC pressure); **semaphore bulkheads** count permits without owning threads (lighter, only isolates concurrency). Use thread-pool when the downstream's blocking behavior could starve your CPU; use semaphore for fast non-blocking calls.

```python
import asyncio
from contextlib import asynccontextmanager
from time import monotonic

class Bulkhead:
    def __init__(self, name: str, max_concurrent: int, queue_size: int = 0):
        self.name = name
        self.max = max_concurrent
        self.sem = asyncio.Semaphore(max_concurrent)
        self.queue = asyncio.Semaphore(queue_size) if queue_size else None
        self.inflight = 0
        self.rejected = 0
        self.metrics = {"saturation": 0.0, "p99_wait_ms": 0.0}

    @asynccontextmanager
    async def slot(self, timeout: float = 1.0):
        if self.queue:
            if not self.queue.locked() and self.queue._value == 0:
                self.rejected += 1
                raise BulkheadFullError(self.name)
        try:
            await asyncio.wait_for(self.sem.acquire(), timeout=timeout)
        except asyncio.TimeoutError:
            self.rejected += 1
            raise BulkheadFullError(self.name)
        t0 = monotonic()
        self.inflight += 1
        self.metrics["saturation"] = self.inflight / self.max
        try:
            yield
        finally:
            self.inflight -= 1
            self.sem.release()
            self.metrics["p99_wait_ms"] = (monotonic() - t0) * 1000

# Per-downstream pools sized via Little's Law: pool = qps * p99_latency_seconds
billing  = Bulkhead("billing",  max_concurrent=20)   # 200 qps * 0.1s
search   = Bulkhead("search",   max_concurrent=50)   # 500 qps * 0.1s
payments = Bulkhead("payments", max_concurrent=10)   # 50  qps * 0.2s

async def call_billing(req):
    async with billing.slot(timeout=0.05):           # fail-fast at 50ms
        return await http.post("/billing", json=req, timeout=1.0)
```

Why this is right: per-dependency pools mean `billing` saturation cannot starve `search` or `payments` — the blast radius collapses to one endpoint. Fail-fast rejection (BulkheadFullError) is critical — **queuing under saturation is worse than rejecting** because queues add latency without adding throughput (Kingman's formula proves this for M/M/1, and Buffer Bloat made the lesson famous in TCP).

**Sizing via Little's Law**: pool size >= peak_qps * p99_latency_seconds. For a 200 QPS endpoint with 100 ms p99, allocate at least 20 slots; add 30-50% headroom for retries and bursts. Oversizing every pool defeats the purpose — total slots across pools must not exceed the host's CPU + memory budget, otherwise you have inverted the partition.

**Bulkhead the queue, not just the executor**. Unbounded queues hide failure until OOM; cap with `LinkedBlockingQueue(50)` or `asyncio.Queue(maxsize=50)`. **Bulkhead the connection pool too** — threads can be isolated but if all callers share one JDBC pool of 30 connections, the JDBC pool is the real bottleneck (this is the most common production miss).

**Production tooling**: Hystrix (legacy, still in Netflix's stack), Resilience4j (Java), Polly (.NET), failsafe-go (Go), `aiobreaker` and `pybreaker` (Python). Istio's `outlierDetection` and Envoy's `circuit_breakers` provide bulkheads at the mesh layer — useful when you cannot modify app code. Monitor **pool saturation per dependency** (utilization > 80% = approaching failure); this signal leads customer-visible 503s by 30-60 seconds, giving on-call time to react before the page fires.

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
