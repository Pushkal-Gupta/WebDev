---
slug: fan-out-fan-in
module: system-design
title: Fan-Out / Fan-In
subtitle: Split a job across N workers, then collect their results into one ordered or aggregated stream.
difficulty: Intermediate
position: 50
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Microservices.io — Scatter-Gather"
    url: "https://microservices.io/patterns/data/cqrs.html"
    type: book
  - title: "Martin Fowler — Parallel Pipelines"
    url: "https://martinfowler.com/articles/patterns-of-distributed-systems/"
    type: blog
  - title: "donnemartin/system-design-primer — Asynchronism"
    url: "https://github.com/donnemartin/system-design-primer#asynchronism"
    type: repo
status: published
---

## intro
Fan-out splits one request into N independent units of work dispatched to N workers; fan-in collects their results. The pattern lights up whenever you can carve a task into shards: map-reduce, parallel HTTP calls, batch image processing, sharded search. The structure is simple — distribute, run, aggregate — but every step hides a footgun.

## whyItMatters
Latency dominates user experience, and the cheapest way to cut latency is parallelism. A serial pipeline of 10 calls at 100 ms each is 1 second; in parallel it's 100 ms. Fan-out is also the cleanest unit of horizontal scale: add workers, get throughput. The pattern shows up in almost every interview that mentions "process millions of X concurrently" — being able to describe how the splitting, the aggregation, and the failure modes work separates good answers from generic ones.

## intuition
Think of a restaurant kitchen taking a ten-person order. The expediter splits the ticket: appetizers to the cold station, mains to the grill, desserts to pastry. Each station works independently. When everything is ready, the expediter plates the order so it arrives at the table simultaneously. Fan-out is the split; fan-in is the plating.

## visualization
Job J of size 100 → split into 4 shards of 25 → workers W1..W4 each take ~250 ms → join channel collects 4 partial results → reduce to final answer in 10 ms. Total wall time: max(workers) + reduce ≈ 260 ms. Serial alternative: 1000 ms. Speedup capped by the longest worker (the straggler).

## bruteForce
Loop sequentially over each shard, call the worker, append to a result list, return. Trivial to write and reason about; throughput equals one worker's. Acceptable only for jobs small enough that latency doesn't matter or for cases where parallelism would overload downstream.

## optimal
Use a thread pool, async tasks, or a worker queue. Submit N jobs, await all (or first-N, or best-of-N depending on semantics), then reduce. Critical knobs:
- **Concurrency cap**: parallelism limited by min(cores, downstream capacity). Use a semaphore or bounded pool.
- **Per-job timeout**: a straggler shouldn't hold the whole batch hostage. Time out and either retry on a different worker or drop the shard with a partial-result flag.
- **Speculative execution**: for read-only shards, fire a backup request after the p95 deadline to a different replica and take whichever returns first.
- **Aggregation strategy**: sum / merge / sort-merge / first-wins. Pick the one that matches the contract.

For idempotent shards, fan-out is trivially safe. For non-idempotent ones, dedupe by request ID before applying side effects.

## complexity
time: O(n / p) where p is workers, plus aggregation cost
space: O(n) for collected partial results
notes: Speedup is bounded by Amdahl's law: serial portions and the straggler dominate as p grows.

## pitfalls
- Unbounded parallelism — a fan-out that spawns 10k goroutines per request will DDoS your own downstream.
- Forgetting tail latency — average is fine, p99 is dominated by the slowest shard. Use hedged requests.
- Partial failure handling — what happens when 9 of 10 shards succeed? Decide explicitly: fail-all, partial, or compensating action.
- Memory blow-up in the aggregator — buffering all partial results when a streaming reduce would do.
- Ordering — fan-in does not preserve input order unless you index shards explicitly.

## interviewTips
- Compare with map-reduce: fan-out/fan-in is the in-process micro version.
- Mention hedged requests as the classic tail-latency mitigation (Google's "The Tail at Scale" paper).
- Discuss when *not* to parallelize: small jobs where coordination overhead exceeds savings.

## code.python
```python
import asyncio

async def worker(i, item):
    await asyncio.sleep(0.05)
    return item * item

async def fan_out_in(items, concurrency=8):
    sem = asyncio.Semaphore(concurrency)
    async def guarded(i, item):
        async with sem:
            return await worker(i, item)
    results = await asyncio.gather(*[guarded(i, x) for i, x in enumerate(items)])
    return sum(results)

print(asyncio.run(fan_out_in(range(100))))
```

## code.javascript
```javascript
async function fanOutIn(items, concurrency = 8) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (true) {
      const i = index++;
      if (i >= items.length) return;
      results[i] = await Promise.resolve(items[i] * items[i]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results.reduce((a, b) => a + b, 0);
}

fanOutIn(Array.from({ length: 100 }, (_, i) => i)).then(console.log);
```

## code.java
```java
import java.util.*;
import java.util.concurrent.*;

public class FanOut {
    public static long fanOutIn(List<Integer> items, int concurrency) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(concurrency);
        List<Future<Long>> fs = new ArrayList<>();
        for (int x : items) fs.add(pool.submit(() -> (long) x * x));
        long sum = 0;
        for (Future<Long> f : fs) sum += f.get(5, TimeUnit.SECONDS);
        pool.shutdown();
        return sum;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <future>
#include <numeric>

long fan_out_in(const std::vector<int>& items, int concurrency) {
    std::vector<std::future<long>> fs;
    fs.reserve(items.size());
    for (int x : items) {
        fs.push_back(std::async(std::launch::async, [x]{ return (long)x * x; }));
    }
    long sum = 0;
    for (auto& f : fs) sum += f.get();
    return sum;
}
```
