---
slug: cache-eviction-policies
module: sd-caching-cdn
title: Cache Eviction Policies
subtitle: When the cache is full, which entry do you evict? LRU / LFU / FIFO / TTL / W-TinyLFU. Hit ratio is everything.
difficulty: Intermediate
position: 46
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Caffeine — W-TinyLFU caching library (Ben Manes)"
    url: "https://github.com/ben-manes/caffeine"
    type: repo
  - title: "Redis docs — eviction policies"
    url: "https://redis.io/docs/manual/eviction/"
    type: blog
  - title: "USENIX FAST — 'TinyLFU: A Highly Efficient Cache Admission Policy'"
    url: "https://dl.acm.org/doi/10.1145/3149371"
    type: book
status: published
---

## intro
Caches are bounded. When a new entry arrives and the cache is full, the **eviction policy** decides what to drop. The right policy yields 50% hit rate; the wrong one yields 15% — same memory budget. Common choices: **LRU** (least-recently used), **LFU** (least-frequently used), **FIFO**, **TTL** (time-based), **W-TinyLFU** (modern winner).

## whyItMatters
Cache hit rate is multiplicative through your stack:
- 90% hit rate → 10% queries hit the DB.
- 95% hit rate → **half the DB load** (5% queries).
- 99% hit rate → **another 5×** reduction.

That's why Caffeine's W-TinyLFU adoption matters: it consistently beats LRU by 5-30% hit rate on real workloads.

## intuition
**LRU**: evict whichever entry hasn't been touched longest. Good when recency predicts future access ("hot keys keep being hot"). Easy to implement (doubly-linked list + hashmap).

**LFU**: evict the least-frequently accessed. Better than LRU when access patterns are stable but skewed. Suffers from "frequency bloat" — old popular items dominate forever.

**FIFO**: evict oldest inserted regardless of access. Worst hit rate; almost no one uses it intentionally.

**TTL**: evict after fixed time-to-live. Useful for staleness-sensitive data (auth tokens, weather). Combined with LRU is common.

**ARC (Adaptive Replacement)**: balances LRU + LFU dynamically. Used by PostgreSQL buffer pool.

**W-TinyLFU**: maintain a tiny approximate-frequency counter (4-bit Count-Min Sketch); admit new items only if their predicted frequency exceeds the victim's. Best-in-class for general workloads.

**SLRU (Segmented LRU)**: 2 segments — "probation" + "protected." First access → probation. Re-access → promoted to protected. Common one-hit wonders never enter the main pool.

## visualization
```
LRU cache (capacity = 3):
  state: head → [B] → [C] → [A] → tail  (A is LRU)
  access B → state: head → [B] → [C] → [A] → tail (B promoted? no — B was already head)
  access A → state: head → [A] → [B] → [C] → tail
  add D → state: head → [D] → [A] → [B] → tail  (evicts C — was LRU before A's move)

LFU counters:
  A:3, B:5, C:2, D:1
  add E → evict D (count 1) → A:3, B:5, C:2, E:1 + start counter

W-TinyLFU:
  Sketch counts seen-freq of every URL.
  When admitting newURL into full cache:
    if predicted_freq(newURL) > predicted_freq(victim): admit + evict victim.
    else: skip (one-hit wonders bounce off the door).
  Result: only frequently-accessed items get cached. Dramatic hit-rate jump on Zipfian workloads.
```

## bruteForce
**Random eviction**: surprisingly OK as a baseline. ~70% the hit rate of LRU on many workloads with simpler logic.

**No eviction (just grow)**: OOM eventually. Not a cache.

## optimal
**Choose by workload**:

| Workload | Policy |
|---|---|
| Web sessions (recency matters) | LRU |
| API responses with skewed access (1% URLs = 50% traffic) | W-TinyLFU |
| Auth tokens with expiry | TTL |
| OS page cache | ARC / 2Q |
| CDN edge cache | TTL + LRU (cap on size) |
| In-memory DB (Redis) | configurable: allkeys-lfu / allkeys-lru |

**Redis** (`maxmemory-policy`):
- `noeviction` (default): error on full + write.
- `allkeys-lru`: evict any key, LRU.
- `allkeys-lfu`: evict any key, LFU.
- `volatile-lru`: only keys with TTL.
- `volatile-ttl`: shortest-remaining-TTL first.

**Caffeine (JVM)** = W-TinyLFU by default — best general-purpose pick for in-app caching.

**Multi-tier caching**: L1 (in-process, small, sub-µs latency) + L2 (Redis, mid, ~1ms) + L3 (CDN, geo-distributed, varied). Each tier with its own policy.

**TTL + eviction together**: TTL stops staleness; LRU/LFU manages size. Both run together.

## complexity
- **LRU**: O(1) get, O(1) put. Hashmap + doubly-linked list.
- **LFU**: O(1) per op with the right impl (Caffeine uses a frequency-bucket linked list).
- **W-TinyLFU**: O(1) per op + small constant for sketch updates.
- **ARC**: O(1) per op with 4 LRU lists.

## pitfalls
- **LRU on scans**: a single full-table scan evicts every hot entry. Use SLRU or ARC.
- **LFU stuck on old popular items**: items that WERE popular dominate even after they cool off. W-TinyLFU's sketch decay solves this.
- **Wrong TTL choice**: too short → high miss rate; too long → stale data. Tune per data type.
- **Cache stampede**: TTL expires, 1000 concurrent requests hit origin. Use SingleFlight / request coalescing.
- **Caching computed results that depend on changing state**: stale data shown to users. Invalidate on write.

## interviewTips
- For "design a cache" — discuss the policy choice + multi-tier + invalidation strategy.
- For "improve cache hit rate" — try W-TinyLFU (5-30% improvement over LRU on real workloads).
- For senior interviews, discuss **cache stampede mitigation** (SingleFlight), **cache penetration** (negative caching), **cache breakdown** (mutex on miss).

## code.python
```python
# LRU via OrderedDict
from collections import OrderedDict
class LRU:
    def __init__(self, capacity):
        self.cap = capacity; self.od = OrderedDict()
    def get(self, k):
        if k not in self.od: return None
        self.od.move_to_end(k)
        return self.od[k]
    def put(self, k, v):
        if k in self.od: self.od.move_to_end(k)
        elif len(self.od) >= self.cap: self.od.popitem(last=False)  # evict oldest
        self.od[k] = v

# functools.lru_cache for memoization
from functools import lru_cache
@lru_cache(maxsize=1024)
def slow_fn(x): return compute(x)
```

## code.javascript
```javascript
// LRU via Map (insertion-ordered)
class LRU {
  constructor(cap) { this.cap = cap; this.map = new Map(); }
  get(k) {
    if (!this.map.has(k)) return undefined;
    const v = this.map.get(k);
    this.map.delete(k); this.map.set(k, v);
    return v;
  }
  put(k, v) {
    if (this.map.has(k)) this.map.delete(k);
    else if (this.map.size >= this.cap) this.map.delete(this.map.keys().next().value);
    this.map.set(k, v);
  }
}
```

## code.java
```java
// Caffeine = W-TinyLFU
Cache<String, Value> cache = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(Duration.ofMinutes(10))
    .recordStats()
    .build();
cache.put("k", v);
Value got = cache.getIfPresent("k");
System.out.println(cache.stats().hitRate());
```

## code.cpp
```cpp
// Folly's EvictingCacheMap — LRU
#include <folly/EvictingCacheMap.h>
folly::EvictingCacheMap<std::string, std::string> cache(/*capacity=*/10000);
cache.set("k", "v");
auto it = cache.find("k");
if (it != cache.end()) std::cout << it->second;
```
