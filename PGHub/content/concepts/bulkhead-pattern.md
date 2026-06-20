---
slug: bulkhead-pattern
module: sd-reliability
title: Bulkhead Pattern
subtitle: Separate thread pools, connection pools, and resource quotas per downstream so one slow dependency cannot drown the service.
difficulty: Intermediate
position: 53
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Netflix Tech Blog — Making the Netflix API more resilient (Hystrix)"
    url: "https://netflixtechblog.com/making-the-netflix-api-more-resilient-a8ec62159c2d"
    type: blog
  - title: "Netflix Tech Blog — Fault Tolerance in a High Volume, Distributed System"
    url: "https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a"
    type: blog
  - title: "Microsoft — Cloud Design Patterns: Bulkhead"
    url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead"
    type: docs
  - title: "Resilience4j — Bulkhead module"
    url: "https://resilience4j.readme.io/docs/bulkhead"
    type: docs
status: published
---

## intro
A **bulkhead** partitions a service's runtime resources — threads, connections, semaphore permits, even CPU shares — so that a single misbehaving downstream cannot consume the pool every other caller depends on. The name comes from shipbuilding: a hull divided into watertight compartments survives a single breach. In software, the breach is a slow database, a stuck third-party API, or a hot partition; the bulkhead is the pool isolating that call path from every other one.

## whyItMatters
The default Java servlet stack uses one shared thread pool for inbound work. A single slow dependency latches every Tomcat worker, the queue fills, healthy endpoints start timing out, and the load balancer marks the whole node down — over one bad dependency. Netflix hit this exact failure repeatedly in 2011-2012 and shipped Hystrix specifically to prevent it: each downstream got its own thread pool with a small bounded queue and fail-fast semantics, so a stuck `recommendations-service` could not take down `playback`. The pattern is now standard in Resilience4j, Envoy connection pools, AWS App Mesh, and every service mesh that ships per-upstream connection caps.

## intuition
Imagine a hospital ER with one shared waiting room. A single patient with a contagious infection sits there for six hours and everyone else gets exposed. Now imagine the same ER with separate rooms — pediatrics, trauma, infectious disease. The slow patient occupies one room; everyone else flows normally. That's the bulkhead.

In a service, the "rooms" are bounded pools — one per downstream dependency, plus optionally one per tenant or per call type. Each pool has a fixed max concurrency (say 20 threads or 50 semaphore permits) and a tiny queue (say 5 slots). When a downstream goes slow, its pool saturates. New calls to *that* downstream get a fast reject (a typed exception, an HTTP 503, or a fallback value). Calls to every other downstream are untouched because they live in different pools.

The deep insight: queuing theory says latency tail explodes when utilization approaches 100%. A shared pool sized for normal load hits 100% the moment one slow caller stalls. A per-dependency pool caps that caller at its own pool size, so the shared resource (CPU, memory, the JVM itself) stays well below saturation. You trade a small amount of capacity (some pools sit idle) for the guarantee that no single failure can cascade.

The two implementations: **thread-pool bulkhead** runs each call on a dedicated executor — true isolation but a context switch per call. **Semaphore bulkhead** caps concurrency on the calling thread itself — cheaper, no extra threads, but the calling thread is still blocked while the downstream is slow. Pick semaphore for low-latency in-process calls; pick thread-pool for anything that goes over the network where the calling thread shouldn't pay the latency tax.

## visualization
```
WITHOUT bulkhead (shared pool of 100 threads):
  [ recommendations slow ]
  ----thread 1 stuck on recs
  ----thread 2 stuck on recs
  ----thread N stuck on recs   <-- all 100 latch in 30s
  result: playback, search, login ALL fail

WITH bulkhead (per-dependency pools):
  recs  : [#####...] 20/20 saturated, fast-rejects new calls
  pay   : [##.......]  4/20 healthy
  search: [###......]  6/20 healthy
  login : [##.......]  3/20 healthy
  result: only recs degrades; the rest serve normally
```

## bruteForce
Use one shared thread pool, set it large, hope for the best. Add a global request timeout and call it resilience. Works until one slow dependency holds threads longer than the timeout fires (timeouts only interrupt the *blocking* call, not the caller waiting on `Future.get`), or until the queue grows faster than work drains. The classic symptom: every endpoint slows in lockstep with one bad upstream because they all share the same workers. You can't tell from metrics which downstream caused it — every endpoint looks equally broken.

## optimal
**Allocate a bounded pool per downstream**. Size each pool to the *95th-percentile concurrency you expect for that dependency under normal load*, not the peak. Add a tiny queue (5-10 entries) so a brief spike doesn't reject; beyond that, fail fast with a typed `BulkheadFullException` and let the caller fall back (cached value, default response, queued retry).

**Two flavors**:
- **Thread-pool bulkhead** (Hystrix-style): each downstream gets a `ThreadPoolExecutor` with bounded queue. The calling thread submits and waits on a future with a hard timeout. Best when the downstream is over-the-network and you want the calling thread released immediately on timeout. Costs one context switch per call and a separate stack frame per pool.
- **Semaphore bulkhead** (Resilience4j default): a `Semaphore(max_permits)` gates entry into the protected call. Calling thread does the work directly; if `tryAcquire(timeout)` fails, fast-reject. Best for in-process or local calls; near-zero overhead.

**Sizing**:
- `max_concurrency ≈ throughput × p99_latency` (Little's Law). If a downstream serves 50 req/s at p99=100ms, you need ~5 concurrent slots to keep up; size the pool to 10-20 for headroom.
- **Never** size pools at "total threads available". The whole point is unused capacity reserved for healthy paths.

**Composing**:
- Combine with **timeout** (cap wall-clock per call), **retry** (bounded, jittered), and **circuit breaker** (open after error rate > threshold). Bulkhead caps concurrency; the others cap latency, attempts, and total failure rate.
- Resilience4j: `Bulkhead.decorateSupplier(bulkhead, supplier)`. Stack with `TimeLimiter`, `Retry`, `CircuitBreaker`.

**Per-tenant bulkheads**: in multi-tenant systems, partition pools per customer or tenant ID so a noisy neighbor cannot drown small tenants. Service meshes do this via per-cluster connection limits.

## complexity
- **Memory**: O(pools × pool_size) — typically a few hundred KB per pool for thread-pool variant; semaphore is essentially zero.
- **Latency**: thread-pool adds ~10-50µs per call for handoff; semaphore adds a few ns for the permit acquire.
- **Throughput cap**: capped at `sum(pool_sizes)`; over-provisioning costs idle threads, under-provisioning costs fast-rejects.
- **Failure-domain isolation**: O(1) — one slow downstream can occupy at most its pool's permits; the rest stay free.

## pitfalls
- **Sharing a thread pool across "similar" downstreams** because it feels wasteful. That defeats the pattern — make the partition the same as the failure domain (one pool per upstream).
- **Unbounded queue** in front of the pool. A 100,000-entry queue is not resilience — it's a memory leak that ends in OOM. Cap the queue at single digits.
- **Tuning by guessing**. Without measuring `p99_latency × throughput`, pool sizes drift to "whatever number we set last quarter". Re-derive from real metrics during the on-call review.
- **Bulkhead without timeout**. A semaphore bulkhead with no per-call timeout still hangs forever — it just hangs at a bounded concurrency. Always pair with `TimeLimiter` or a wall-clock guard.
- **Forgetting fallbacks**. The bulkhead's value is "fail fast so the caller can degrade gracefully". If the caller has no fallback, fast-reject just turns timeouts into 503s. Define what each call returns on `BulkheadFull`.
- **Treating bulkhead as a substitute for circuit breaker**. They solve different problems: bulkhead caps concurrent failure; circuit breaker stops sending traffic to a known-broken downstream. Stack both.

## interviewTips
- Open with the failure mode: "one slow dependency saturating a shared pool takes down unrelated endpoints". That's why bulkhead exists; everything else is mechanism.
- Know **semaphore vs thread-pool** isolation and when each wins. Senior interviewers will probe.
- Cite **Hystrix** and Netflix's outage history as origin; mention **Resilience4j** as the modern replacement (Hystrix is in maintenance).
- For "design a multi-tenant system" — per-tenant bulkheads. For "the database got slow and the whole service died" — bulkhead per data source.

## code.python
```python
# Semaphore bulkhead using asyncio.Semaphore.
# Wraps an async downstream call with bounded concurrency and fast-reject.
import asyncio
import time
from contextlib import asynccontextmanager

class Bulkhead:
    def __init__(self, name: str, max_concurrent: int, acquire_timeout_s: float = 0.0):
        self.name = name
        self._sem = asyncio.Semaphore(max_concurrent)
        self._timeout = acquire_timeout_s
        self.rejects = 0

    @asynccontextmanager
    async def enter(self):
        if self._timeout > 0:
            try:
                await asyncio.wait_for(self._sem.acquire(), timeout=self._timeout)
            except asyncio.TimeoutError:
                self.rejects += 1
                raise BulkheadFull(self.name)
        else:
            if not self._sem.locked() and self._sem._value > 0:
                await self._sem.acquire()
            else:
                self.rejects += 1
                raise BulkheadFull(self.name)
        try:
            yield
        finally:
            self._sem.release()

class BulkheadFull(Exception):
    pass

recs_bh = Bulkhead('recommendations', max_concurrent=20, acquire_timeout_s=0.05)

async def get_recs(user_id: str):
    try:
        async with recs_bh.enter():
            return await downstream_recs(user_id)
    except BulkheadFull:
        return fallback_recs()  # cached or default
```

## code.javascript
```javascript
// Per-host connection pool acts as a bulkhead in Node.
// Each downstream gets its own undici Pool with bounded connections + queue.
import { Pool, errors } from 'undici';

const pools = new Map();

function poolFor(origin, { connections = 20, pipelining = 1 } = {}) {
  if (!pools.has(origin)) {
    pools.set(origin, new Pool(origin, {
      connections,
      pipelining,
      headersTimeout: 2000,
      bodyTimeout: 5000,
    }));
  }
  return pools.get(origin);
}

async function call(origin, path, fallback) {
  const pool = poolFor(origin);
  // queued > 5 means downstream is slow; reject fast instead of piling up.
  const stats = pool.stats;
  if (stats.pending > 5) return fallback();
  try {
    const { body } = await pool.request({ path, method: 'GET' });
    return await body.json();
  } catch (e) {
    if (e instanceof errors.ConnectTimeoutError || e instanceof errors.BodyTimeoutError) {
      return fallback();
    }
    throw e;
  }
}
```

## code.java
```java
// Resilience4j-style bulkhead using ExecutorService + Semaphore.
// One pool per downstream; calls beyond capacity are rejected immediately.
import java.util.concurrent.*;

public class Bulkhead<T> {
    private final String name;
    private final ExecutorService pool;
    private final Semaphore permits;
    private final long acquireMs;

    public Bulkhead(String name, int maxConcurrent, int queueSize, long acquireMs) {
        this.name = name;
        this.permits = new Semaphore(maxConcurrent);
        this.acquireMs = acquireMs;
        this.pool = new ThreadPoolExecutor(
            maxConcurrent, maxConcurrent, 60, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(queueSize),
            new ThreadPoolExecutor.AbortPolicy()
        );
    }

    public CompletableFuture<T> submit(Callable<T> work, java.util.function.Supplier<T> fallback) {
        boolean got;
        try { got = permits.tryAcquire(acquireMs, TimeUnit.MILLISECONDS); }
        catch (InterruptedException ie) { Thread.currentThread().interrupt(); return CompletableFuture.completedFuture(fallback.get()); }
        if (!got) return CompletableFuture.completedFuture(fallback.get());

        CompletableFuture<T> cf = new CompletableFuture<>();
        try {
            pool.submit(() -> {
                try { cf.complete(work.call()); }
                catch (Exception ex) { cf.complete(fallback.get()); }
                finally { permits.release(); }
            });
        } catch (RejectedExecutionException rex) {
            permits.release();
            cf.complete(fallback.get());
        }
        return cf;
    }
}
```

## code.cpp
```cpp
// Counting-semaphore bulkhead (C++20).
// Calls that cannot acquire a permit within the timeout fall back immediately.
#include <semaphore>
#include <chrono>
#include <functional>
#include <optional>

template <typename T>
class Bulkhead {
public:
    Bulkhead(std::ptrdiff_t max_concurrent, std::chrono::milliseconds acquire_timeout)
        : sem_(max_concurrent), timeout_(acquire_timeout) {}

    T run(std::function<T()> work, std::function<T()> fallback) {
        if (!sem_.try_acquire_for(timeout_)) return fallback();
        struct Releaser {
            std::counting_semaphore<>& s;
            ~Releaser() { s.release(); }
        } r{sem_};
        try { return work(); }
        catch (...) { return fallback(); }
    }

private:
    std::counting_semaphore<> sem_;
    std::chrono::milliseconds timeout_;
};
```
