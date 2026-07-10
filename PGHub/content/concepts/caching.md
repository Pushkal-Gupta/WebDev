---
slug: caching
module: sd-caching-cdn
title: Caching
subtitle: Store the answer to expensive work close to the caller so the next caller gets it instantly.
difficulty: Beginner
position: 2
estimatedReadMinutes: 8
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
A cache is fast, finite storage holding the results of slow operations so you can serve them again without redoing the work. The "slow operation" might be a DB query, a fan-out call to ten microservices, a 200ms remote API, or a rendered HTML page. The "fast storage" is RAM (in-process map, Redis, Memcached) or a CDN edge node. Caching is the single biggest scale lever you have before you change architecture.

## whyItMatters
Most reads in most systems are repeats. Front-page articles, popular product pages, the same user hitting their own profile a hundred times — a cache hit avoids the DB round-trip entirely. A real hit rate of 90% turns 100k DB reads/sec into 10k, which is the difference between buying one DB shard and ten.

## intuition
A waiter who memorizes today's specials doesn't run to the kitchen for every order. Most tables order from the specials list, so the kitchen never sees those questions. When the special runs out (invalidation), the waiter updates their memory. When a table orders something exotic, the waiter does go to the kitchen — and now memorizes that too if it's likely to be ordered again. The kitchen is the database; the waiter's memory is the cache.

What's actually happening is a bet on repetition. Reads in real systems are rarely uniform — a small set of keys is asked for constantly while a long tail is asked for once. Put concrete numbers on it: suppose a product page costs 50 ms to assemble from the database and you serve 100k page views/sec, but 90% of those views hit the same 1,000 hot products. Cache those 1,000 rendered results in RAM with a 1 ms lookup and 90k of every 100k requests never touch the database at all — DB load drops from 100k to 10k reads/sec, and average latency falls from 50 ms toward roughly 0.9 × 1 ms + 0.1 × 50 ms ≈ 6 ms. That is the entire pitch: you trade a bounded amount of fast memory for a large, skewed slice of slow work you no longer redo. The cache only wins when the same answers are requested repeatedly and the underlying data changes slowly enough that a slightly stale copy is acceptable — which, for the hot set of most systems, is exactly the case.

## visualization
```
Cache-aside read path: hit, then miss + fill, then a stampede guard.

request(key=P42) -> CACHE.get(P42)
   HIT  -> return value                                    (~1 ms)   [90% of reads]
   MISS -> DB.query(P42) -> CACHE.set(P42, val, ttl=60) -> return  (~50 ms) [10%]

write(P42, newVal):
   DB.update(P42, newVal) -> CACHE.delete(P42)     (next read re-fills)

stampede: P42 TTL expires -> 5,000 concurrent misses
   single-flight: 1 request fills, 4,999 wait on it -> 1 DB query, not 5,000
```

## bruteForce
Hit the database every time. Correct but slow. Works until concurrency × latency × DB throughput hits its ceiling.

## optimal
Pick a pattern (each has tradeoffs):

- **Cache-aside (lazy)**: on read, check cache → on miss, read DB and populate cache. On write, update DB and invalidate cache. Simple, app controls everything, can serve stale on miss-storms.
- **Read-through**: cache sits between app and DB; app only talks to cache; cache pulls from DB on miss. Cleaner code, less control.
- **Write-through**: every write goes to cache and DB synchronously. Strong consistency, slower writes.
- **Write-back**: writes go to cache, flushed to DB asynchronously. Fastest writes, risks data loss on cache crash.

Then pick an **eviction policy** when the cache fills: LRU (least-recently-used) is the default. LFU (least-frequently-used) works better for skewed distributions. TTL (time-to-live) is the simplest — set "this entry expires in 60 seconds."

Pick a **scope**: in-process (fastest, single node), shared (Redis/Memcached cluster, all app nodes hit it), CDN (edge, closest to user).

The decision that dominates all others is **staleness tolerance per data type**, because it picks the write pattern for you. Data that must never be wrong on read (account balance, permissions) wants write-through or cache-aside with explicit invalidation on write; data that tolerates seconds of lag (product prices, feed ranking) is happy with TTL expiry and no invalidation logic at all. Cache-aside is the default because it fails safe — a cache outage degrades to hitting the database directly, never to serving wrong data — whereas write-back trades durability for speed and can lose the last few writes if the cache node dies before flushing. The failure mode that bites hardest at scale is not a miss but a *correlated* miss: a popular key expires and thousands of concurrent requests all miss and stampede the database in the same instant. Defend it with jittered TTLs, single-flight request coalescing (one fill in progress, everyone else waits on it), and stale-while-revalidate (serve the expired value while one background fetch refreshes it). Size the cache from the hot-set working size, not the total dataset, and watch hit ratio as the health metric — a hit rate sliding from 92% to 80% doubles database load without any traffic change.

## complexity
- **Hit latency**: ~1ms (in-process), ~5ms (shared cache same DC), ~20ms (CDN).
- **Miss penalty**: full backend latency + a tiny cache-fill overhead.
- **Memory**: bounded by eviction; tune for hit rate ≥ 90% on hot keys.

## pitfalls
- **Cache stampede / thundering herd**: TTL expires at the same instant for thousands of clients; they all miss and slam the DB. Mitigate with jittered TTLs, request-coalescing (single in-flight fill), or a probabilistic early-recompute window.
- **Stale data**: write-back / lazy invalidation can serve old values for a window. Be explicit about acceptable staleness per data type.
- **Cache as source of truth**: a Redis crash should never lose data. The DB is canonical; the cache is disposable.
- **Hot keys**: one key getting 90% of the traffic overloads a single shard. Use replication or local in-process caches in front.
- **Negative caching**: caching "this record doesn't exist" prevents the same query from hammering the DB during an attack — but TTL these aggressively.

## interviewTips
- Default to **cache-aside + LRU + TTL** unless the question pushes you toward something else.
- Specify *what* you cache (objects, query results, rendered HTML) and *where* (in-process vs. shared vs. edge).
- Mention invalidation strategy and stale-while-revalidate explicitly — "the hard part of caching" is invalidation.
- Talk about hit ratio as a measurable metric you'd watch in production.

## code.python
```python
# Cache-aside pattern, sketched with a dict + TTL.
import time

class TTLCache:
    def __init__(self): self.store = {}
    def get(self, k):
        v = self.store.get(k)
        if v and v[1] > time.time(): return v[0]
        self.store.pop(k, None); return None
    def set(self, k, v, ttl=60):
        self.store[k] = (v, time.time() + ttl)

def get_user(uid, cache, db):
    v = cache.get(uid)
    if v: return v
    v = db.fetch(uid)
    cache.set(uid, v, ttl=60)
    return v
```

## code.javascript
```javascript
class TTLCache {
  constructor() { this.store = new Map(); }
  get(k) {
    const v = this.store.get(k);
    if (v && v.expires > Date.now()) return v.value;
    this.store.delete(k); return null;
  }
  set(k, value, ttlMs = 60_000) {
    this.store.set(k, { value, expires: Date.now() + ttlMs });
  }
}
```

## code.java
```java
import java.util.*;
class TTLCache<K, V> {
    private final Map<K, Object[]> store = new HashMap<>();
    public synchronized V get(K k) {
        Object[] v = store.get(k);
        if (v != null && (long) v[1] > System.currentTimeMillis()) return (V) v[0];
        store.remove(k); return null;
    }
    public synchronized void set(K k, V v, long ttlMs) {
        store.put(k, new Object[]{ v, System.currentTimeMillis() + ttlMs });
    }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <chrono>
template<class K, class V>
struct TTLCache {
    struct Entry { V value; long long expires; };
    std::unordered_map<K, Entry> store;
    V* get(const K& k) {
        auto it = store.find(k);
        if (it != store.end() && it->second.expires > now()) return &it->second.value;
        if (it != store.end()) store.erase(it);
        return nullptr;
    }
    void set(const K& k, V v, long long ttlMs) { store[k] = { std::move(v), now() + ttlMs }; }
    static long long now() {
        using namespace std::chrono;
        return duration_cast<milliseconds>(steady_clock::now().time_since_epoch()).count();
    }
};
```
