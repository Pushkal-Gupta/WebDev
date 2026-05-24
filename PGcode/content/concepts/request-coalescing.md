---
slug: request-coalescing
module: system-design
title: Request Coalescing — SingleFlight
subtitle: Collapse N concurrent calls for the same key into one — the killer defense against thundering herds.
difficulty: Intermediate
position: 8
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "AWS Builders' Library — Avoiding fallback in distributed systems"
    url: "https://aws.amazon.com/builders-library/"
    type: blog
  - title: "Highscalability — Cache stampedes case studies"
    url: "http://highscalability.com/"
    type: blog
  - title: "donnemartin/system-design-primer — Thundering herd"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
Request coalescing — also called single-flight, promise-deduplication, or in-flight request merging — is the simple idea that if 1000 concurrent callers ask for the same key, you should do the work *once* and hand the same answer to all 1000. Caches, RPC clients, and database connection pools all need this primitive. Without it, every cold cache miss for a hot key becomes a 1000x amplification at the origin and a self-inflicted DDoS.

## whyItMatters
The cache stampede / dogpile / thundering herd problem is one of the top three causes of cascading outages in distributed systems. A popular key expires, every cache-miss handler races to the origin, the origin saturates, all those handlers time out, retry, and the system enters a spiral. Single-flight breaks the spiral by serializing the in-flight work per key — one call out, broadcast the answer. It is a five-line fix that prevents a class of incidents.

## intuition
Maintain a map of `key -> Promise<Result>` for in-flight calls. When a caller asks for key K: if the map has an entry, await the existing promise; if not, create one, store it, run the work, resolve it, then delete the entry. The first caller pays the latency; the rest pay only the cost of awaiting the resolved promise. The map entry must be deleted on both success and failure so the next miss is not stuck.

## visualization
1000 concurrent gets for the same key with and without single-flight:

```
WITHOUT single-flight:
  caller_1 .. caller_1000  -> all see cache MISS
  caller_1 .. caller_1000  -> all call origin.get(K)
  origin handles 1000 identical requests
  -> 1000x amplification

WITH single-flight:
  caller_1  -> cache MISS -> registers in-flight[K] = promise_1
              -> calls origin.get(K) (the only real call)
  caller_2 .. caller_1000  -> cache MISS -> see in-flight[K] -> await promise_1
  origin responds                          -> promise_1 resolves with value V
  all 1000 callers receive V
  in-flight[K] deleted
  -> 1x amplification
```

## bruteForce
No coalescing, no defense — and a "fix" by adding random jitter to TTLs (so keys do not all expire at the same wall-clock moment). Jitter spreads the herd over a window but does not prevent it: one expired hot key still gets stampeded by every concurrent request that arrives during the refetch window. Doubling jitter spreads the pain; it does not eliminate it.

## optimal
Use a per-process single-flight map for in-process callers and pair it with a distributed lock (Redis SET NX EX) for cross-process coalescing on truly hot keys. Variants worth knowing:
- **Soft TTL + probabilistic early refresh (XFetch)** — when TTL remainder drops below threshold, one in N requests is elected to refresh in the background; the rest serve cached. Statistically guarantees the herd does not all hit on expiry.
- **Stale-while-revalidate** — serve the stale value to every caller while one background fetch refreshes. No caller waits even on miss.
- **Two-level coalescing** — in-process map collapses requests within a node; distributed lock collapses requests across nodes. The combo gives near-perfect amplification reduction.
Always delete the map entry in a `finally` to avoid stuck keys when the underlying fetch throws.

## complexity
time: First caller pays origin latency; subsequent callers pay O(promise-await) (microseconds). With N concurrent callers, origin sees 1 request instead of N — amplification reduction is the headline metric.
space: O(distinct in-flight keys), typically bounded by working set hotness — usually <100 entries even on huge services.
notes: SingleFlight only deduplicates within the *same process*. Across pods you need a distributed lock or distributed cache; otherwise N pods still send N origin requests for the same key.

## pitfalls
- Forgetting to delete the map entry on error — the next caller awaits a forever-pending or already-rejected promise.
- Using single-flight on *write* paths — collapsing two writes into one silently drops one user's intent.
- Storing the result in the cache *outside* the single-flight, allowing later callers to race past the cache check and refetch.
- Building it with `setTimeout` or a queue without timeouts — a stuck origin call holds back every waiter; always wrap with a deadline.
- Assuming Go's `singleflight.Group` is process-global without realizing each goroutine spawning a new Group defeats it.

## interviewTips
- Bring up single-flight whenever the interviewer raises caching, retries, or any "what happens when this hot thing dies?" scenario.
- Distinguish in-process coalescing from distributed coalescing (Redis SET NX EX) — both have their place; a senior answer mentions both.
- Pair it with stale-while-revalidate and XFetch in a "stampede defense in depth" trio.
- Mention Go's `golang.org/x/sync/singleflight` and JavaScript's pattern with a `Map<string, Promise>` as off-the-shelf references — shows you know the primitive is mature.
- For "design a high-traffic configuration service" — coalescing on the read path and tag-based purge on the write path is the canonical answer.

## code.python
```python
import asyncio
from typing import Awaitable, Callable, TypeVar

T = TypeVar("T")

class SingleFlight:
    def __init__(self):
        self._inflight: dict[str, asyncio.Future] = {}

    async def do(self, key: str, fn: Callable[[], Awaitable[T]]) -> T:
        fut = self._inflight.get(key)
        if fut is not None:
            return await fut
        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        self._inflight[key] = fut
        try:
            result = await fn()
            fut.set_result(result)
            return result
        except BaseException as e:
            fut.set_exception(e)
            raise
        finally:
            self._inflight.pop(key, None)
```

## code.javascript
```javascript
class SingleFlight {
  constructor() { this.inflight = new Map(); }
  async do(key, fn) {
    const existing = this.inflight.get(key);
    if (existing) return existing;
    const p = (async () => {
      try { return await fn(); }
      finally { this.inflight.delete(key); }
    })();
    this.inflight.set(key, p);
    return p;
  }
}

const sf = new SingleFlight();
async function getUser(id) {
  return sf.do(`user:${id}`, async () => {
    const hit = await cache.get(`user:${id}`);
    if (hit) return hit;
    const u = await db.user(id);
    await cache.setex(`user:${id}`, 300, u);
    return u;
  });
}
```

## code.java
```java
class SingleFlight {
    private final ConcurrentHashMap<String, CompletableFuture<?>> inflight = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public <T> CompletableFuture<T> doWork(String key, Supplier<CompletableFuture<T>> work) {
        return (CompletableFuture<T>) inflight.computeIfAbsent(key, k -> {
            CompletableFuture<T> f = work.get();
            f.whenComplete((v, e) -> inflight.remove(k));
            return f;
        });
    }
}
```

## code.cpp
```cpp
#include <future>
#include <mutex>
#include <unordered_map>
#include <memory>
#include <functional>

template <typename T>
class SingleFlight {
public:
    std::shared_future<T> do_work(const std::string& key, std::function<T()> fn) {
        std::unique_lock lk(m_);
        auto it = inflight_.find(key);
        if (it != inflight_.end()) return it->second;

        std::promise<T> p;
        auto fut = p.get_future().share();
        inflight_[key] = fut;
        lk.unlock();

        try {
            p.set_value(fn());
        } catch (...) {
            p.set_exception(std::current_exception());
        }

        std::unique_lock lk2(m_);
        inflight_.erase(key);
        return fut;
    }

private:
    std::mutex m_;
    std::unordered_map<std::string, std::shared_future<T>> inflight_;
};
```
