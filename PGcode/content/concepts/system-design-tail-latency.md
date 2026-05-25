---
slug: system-design-tail-latency
module: sd-reliability
title: Taming Tail Latency
subtitle: p99 / p99.9 latency dominates user experience at scale — hedged requests, request reissue, micro-rebooting. The patterns Google taught the world.
difficulty: Advanced
position: 66
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Dean & Barroso — The Tail at Scale (CACM 2013)"
    url: "https://research.google/pubs/the-tail-at-scale/"
    type: blog
  - title: "AWS Builders' Library — Avoiding fallback in distributed systems"
    url: "https://aws.amazon.com/builders-library/"
    type: blog
  - title: "Netflix/concurrency-limits — adaptive concurrency"
    url: "https://github.com/Netflix/concurrency-limits"
    type: repo
status: published
---

## intro
At scale, the **slow tail** of latency — p99, p99.9 — dominates user experience. Even if a service has p50 = 10ms, if a page renders by fanning out to 100 subqueries, the probability that all 100 finish in 10ms is `0.5^100 = 10^-30` — every page hits the slow tail. Tail latency is its own engineering discipline; mean and median tell you nothing useful at scale.

## whyItMatters
A page rendering at p50 = 10ms but p99 = 1s, hitting 100 backends in parallel:
- Probability ALL 100 finish in 10ms ≈ 0.

The page is **always** slow. Google's "Tail at Scale" paper (2013) named this and laid out the playbook now everyone uses.

Tail latency manifests:
- GC pauses, JIT compilation, lock contention.
- Packet loss + TCP retransmit (200ms minimum).
- Slow disk reads on a degraded SSD.
- Scheduler queueing on a noisy host.

## intuition
Two strategies:

**Reduce variance** (preferred):
- Eliminate sources: dedicated CPU cores, avoid GC pauses, separate hot/cold data.
- Bulkhead: isolate noisy neighbors.
- Connection pool sizing: avoid queueing.

**Mask variance** (when sources can't be eliminated):
- **Hedged requests**: send the request twice (or after a threshold), use whichever returns first.
- **Tied requests**: send to two replicas; first to start cancels the other.
- **Request reissue**: if no response in T ms, send to a different replica.
- **Quorum reads**: send to N, accept first majority.

## visualization
```
Without hedging:
  request A → replica 1 → 95% return in 10ms, 5% take 200ms (slow tail)
  Page p99 latency = ~200ms

With hedging at 50ms:
  request A → replica 1 (start now)
  At t=50ms, if no response: also send to replica 2
  Take whichever returns first.
  
  P(both slow) = 0.05 * 0.05 = 0.0025 → 99.75% of requests now within ~50ms.
  Cost: ~5% extra requests (only for the slow tail).

Fan-out scenario:
  100 parallel sub-queries each with p99 = 200ms
  Without hedge: page p99 = 200ms (almost certainly one is slow)
  With hedge: per-subquery p99 → 50ms, page p99 ~ 50-100ms
```

## bruteForce
**Ignore the tail; optimize p50**: typical mistake; page latency stays bad despite p50 improvements.

**Tighter timeouts**: causes more errors at slight tail spikes. Tradeoff: timeout < retry budget or you cascade.

**Bigger machines**: per-host variance unchanged; only helps if bottleneck is capacity, not jitter.

**Retry on timeout**: works but adds load on the slowest path; hedging is smarter (start before failure).

## optimal
**Hedged requests** (Google's pattern):
1. Send request to replica A.
2. If no response within T (e.g., 95th-percentile expected latency), also send to replica B.
3. Use first response; cancel the slower one.
4. Limit hedge rate: only top 5% of requests should hedge (cap at 1.05× original load).

**Tied requests**:
- Send to A and B simultaneously.
- Each replica, before executing, checks if the other has started.
- Whoever starts first cancels the other.
- Pros: lower latency than hedged; cons: requires inter-replica coordination.

**Adaptive concurrency** (Little's law applied):
- Track in-flight request count + p99 latency.
- If p99 rising → reduce allowed concurrency → shorter queues → lower latency.
- Netflix's `concurrency-limits` library.

**Request prioritization**:
- High-priority requests skip queues.
- Low-priority shed first under load.

**Avoid head-of-line blocking**:
- TCP HoL → use HTTP/2 or HTTP/3 (QUIC).
- App-level queue HoL → use separate queues per priority.

**Connection multiplexing carefully**:
- HTTP/2 single connection over flaky network = full pipeline stalls. Spread across N connections.

**Backend canary / micro-rebooting**:
- Periodically restart hosts to clear GC-driven memory pressure.
- Or run multiple processes per host; restart the slow one.

## complexity
- **Hedge overhead**: ~5% extra load with 95th-percentile threshold.
- **Latency improvement**: typical p99 cut by 5-10× when hedging on uncorrelated slow tail.
- **Cost**: more replicas + cancellation logic + monitoring.

## pitfalls
- **Hedging correlated tails.** When every replica slows together (shared DB, shared network) the second request hits the same bottleneck and adds zero benefit while doubling load. Fix: diagnose with per-dependency latency dashboards before enabling hedging; address the shared cause (sharding, capacity, isolation) rather than masking it.
- **Hedge cascade.** Hedging adds load; that load grows queues; queues raise the p95 threshold that triggers hedges; the system feeds itself. Fix: cap hedge rate at ~5% of traffic with a token bucket and disable hedging entirely above a load-shedding threshold.
- **Cancellation forgotten.** A hedged-but-lost in-flight RPC keeps burning CPU, DB connections, and downstream tokens. Fix: use cancellable RPCs (gRPC `context.WithCancel`, HTTP/2 `RST_STREAM`) and propagate cancellation through the whole call chain.
- **Tail latency measured as mean of tail.** Averaging the slowest requests hides the actual long tail. Fix: always quote and alert on p99 and p99.9 directly; never reduce a percentile to a mean.
- **Single-host p99 monitoring.** Per-host percentiles miss the fleet-wide tail because each host's worst request happens at a different time. Fix: ship raw histograms (HDR / t-digest), aggregate across hosts, then compute the percentile.
- **Hedging non-idempotent operations.** A second `POST /charge` charges the user twice. Fix: gate hedging behind an idempotency check (HTTP verb whitelist or explicit idempotency key) and only hedge reads and idempotent writes.

## interviewTips
- For "page latency is high despite fast services" → fan-out tail amplification + hedge.
- Cite **Dean & Barroso's "The Tail at Scale"** — canonical reference.
- For senior interviews, discuss **head-of-line blocking** in HTTP/2/3, **request prioritization**, **adaptive concurrency**, **back-pressure**.

## code.python
```python
import asyncio
async def hedged(coro_factory, hedge_after=0.05):
    """Run a coroutine; if it doesn't finish in hedge_after seconds, start a second instance.
    Return whichever finishes first."""
    t1 = asyncio.create_task(coro_factory())
    done, pending = await asyncio.wait({t1}, timeout=hedge_after)
    if done: return done.pop().result()
    t2 = asyncio.create_task(coro_factory())
    done, _ = await asyncio.wait({t1, t2}, return_when=asyncio.FIRST_COMPLETED)
    for p in pending: p.cancel()
    return done.pop().result()
```

## code.javascript
```javascript
async function hedged(reqFactory, hedgeAfterMs = 50) {
  const p1 = reqFactory();
  const timer = new Promise(res => setTimeout(() => res('hedge'), hedgeAfterMs));
  const first = await Promise.race([p1.then(r => ['p1', r]), timer]);
  if (first !== 'hedge') return first[1];
  const p2 = reqFactory();
  const winner = await Promise.race([p1, p2]);
  return winner;
}
```

## code.java
```java
// CompletableFuture-based hedge
public CompletableFuture<Response> hedged(Supplier<CompletableFuture<Response>> factory, Duration hedgeAfter) {
    CompletableFuture<Response> p1 = factory.get();
    return p1.applyToEither(
        p1.completeOnTimeout(null, hedgeAfter.toMillis(), TimeUnit.MILLISECONDS)
          .thenCompose(r -> r != null ? CompletableFuture.completedFuture(r) : factory.get()),
        r -> r
    );
}
```

## code.cpp
```cpp
#include <future>
#include <chrono>
#include <atomic>
#include <functional>
#include <stdexcept>

template <typename Resp>
Resp hedged(std::function<Resp()> request, std::chrono::milliseconds hedge_after) {
    auto cancelled = std::make_shared<std::atomic<bool>>(false);
    auto run = [request, cancelled]() -> Resp {
        Resp r = request();
        if (cancelled->load()) throw std::runtime_error("cancelled");
        return r;
    };

    auto f1 = std::async(std::launch::async, run);
    if (f1.wait_for(hedge_after) == std::future_status::ready) {
        cancelled->store(true);
        return f1.get();
    }
    auto f2 = std::async(std::launch::async, run);
    while (true) {
        if (f1.wait_for(std::chrono::milliseconds(1)) == std::future_status::ready) {
            cancelled->store(true);
            return f1.get();
        }
        if (f2.wait_for(std::chrono::milliseconds(1)) == std::future_status::ready) {
            cancelled->store(true);
            return f2.get();
        }
    }
}
```
