---
slug: caching
module: system-design
title: Caching
subtitle: Store the answer to expensive work close to the caller so the next caller gets it instantly.
difficulty: Beginner
position: 2
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Redis docs — caching patterns"
    url: ""
status: published
---

## intro
A cache is fast, finite storage holding the results of slow operations so you can serve them again without redoing the work. The "slow operation" might be a DB query, a fan-out call to ten microservices, a 200ms remote API, or a rendered HTML page. The "fast storage" is RAM (in-process map, Redis, Memcached) or a CDN edge node. Caching is the single biggest scale lever you have before you change architecture.

## whyItMatters
Most reads in most systems are repeats. Front-page articles, popular product pages, the same user hitting their own profile a hundred times — a cache hit avoids the DB round-trip entirely. A real hit rate of 90% turns 100k DB reads/sec into 10k, which is the difference between buying one DB shard and ten.

## intuition
A waiter who memorizes today's specials doesn't run to the kitchen for every order. Most tables order from the specials list, so the kitchen never sees those questions. When the special runs out (invalidation), the waiter updates their memory. When a table orders something exotic, the waiter does go to the kitchen — and now memorizes that too if it's likely to be ordered again. The kitchen is the database; the waiter's memory is the cache.

## visualization
```
Client ──► [Cache] ──hit──► back to client (~1ms)
              │
              ├──miss──► [Database] ──► [Cache fills] ──► back to client (~50ms)
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
