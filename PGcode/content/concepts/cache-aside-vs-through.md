---
slug: cache-aside-vs-through
module: system-design
title: Cache Patterns — Aside, Through, Behind
subtitle: Read-through, write-through, write-behind, cache-aside — which one your storage path actually needs.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Patterns of Enterprise Application Architecture"
    url: "https://martinfowler.com/"
    type: blog
  - title: "AWS Builders' Library — Caching challenges and strategies"
    url: "https://aws.amazon.com/builders-library/"
    type: blog
  - title: "redis/redis — README and topics/keyspace-notifications"
    url: "https://github.com/redis/redis"
    type: repo
status: published
---

## intro
Every cache topology reduces to one question: who is responsible for keeping the cache and the system of record in sync — the application, the cache library, or a background worker? The four canonical answers (cache-aside, read-through, write-through, write-behind) trade off staleness, latency, durability, and operational complexity in different directions. Picking the wrong one for your workload is the most common reason production caches end up serving stale or incorrect data.

## whyItMatters
"Cache invalidation" is a punchline because most teams reach for cache-aside, write to the database, forget to invalidate the cache, and then spend a quarter chasing stale-read tickets. Knowing which pattern matches read-heavy vs write-heavy traffic, eventually-consistent vs strongly-consistent reads, and synchronous vs async tolerance is a system-design interview staple. It also dictates whether you reach for Redis, a CDN, or something like Cloudflare KV.

## intuition
Read-side patterns: cache-aside makes the *application* check the cache, fall back to the DB on miss, then populate. Read-through makes the *cache library* do that work — your code only ever calls the cache. Write-side patterns: write-through writes to both cache and DB in the same synchronous call (consistent but slower). Write-behind buffers writes in the cache and flushes asynchronously to the DB (fast but durability is now the cache's problem).

## visualization
Four flows side by side for the same `getUser(42)` and `updateUser(42)`:

```
CACHE-ASIDE (read):                READ-THROUGH:
  app -> cache.get -> MISS           app -> cache.get
  app -> db.read                       cache.miss -> db.read -> populate -> return
  app -> cache.set(ttl)
  return                               (cache library handles the miss)

WRITE-THROUGH (write):              WRITE-BEHIND (write):
  app -> cache.set                    app -> cache.set     (acked immediately)
  app -> db.write                     cache -> buffer -> async flush -> db
  both succeed or rollback             (db is eventually consistent)
```

## bruteForce
Database-only with no cache: every read hits Postgres, query latency is bound by your slowest index lookup or hot-row contention, and traffic spikes turn into connection-pool exhaustion. Works fine until you cross roughly 1k qps on a single read-heavy endpoint. Adding a cache without thinking about the pattern usually means cache-aside with no invalidation logic — which is worse than no cache because stale data is sticky.

## optimal
- **Cache-aside** when reads dominate, staleness on the order of TTL is acceptable, and writes are infrequent (user profiles, product catalogs). Pair with explicit `cache.del(key)` after every write to bound staleness.
- **Read-through** when you want the cache to be transparent (Caffeine, Guava LoadingCache, Redis with a sidecar like Cachelot). Simplifies application code; you give up the ability to skip the cache for some reads.
- **Write-through** when reads must always see the latest write and you can pay the extra hop on every write (financial balances, inventory counts where overselling is unacceptable).
- **Write-behind** for write-heavy workloads where the DB cannot keep up and you can tolerate a small window of data loss on cache failure (analytics counters, view counts, IoT telemetry). Always pair with durable write-ahead log if loss is intolerable.

For cache-aside specifically, prefer write-then-invalidate over write-then-update (updating the cache races with concurrent readers and can resurrect stale data). The "double-delete" pattern (delete before write, delete again after a short delay) defends against the read-after-write race.

## complexity
time: Cache hit O(1) network round-trip; cache miss adds the DB read latency. Write-behind drops the user-visible write to O(1) at the cost of background flush throughput.
space: O(working set) in cache memory; eviction policy (LRU, LFU, TTL) determines hit rate when working set exceeds memory.
notes: Hit rate is the dominant cost factor — moving from 90 to 99 percent hit rate cuts DB load by 10x even though the absolute hit rate change looks small.

## pitfalls
- Forgetting to invalidate on the write path — cache holds the pre-update value until TTL expires.
- Setting a long TTL on cache-aside to "improve hit rate" — increases the staleness window proportionally.
- Write-behind with no durable log: cache crash loses every unflushed write.
- Thundering herd on cold miss: 10k concurrent requests for the same expired key all hit the DB. Fix with `request-coalescing` (single-flight) or a probabilistic early refresh.
- Treating Redis as a database in write-behind mode without enabling AOF persistence and replication.

## interviewTips
- Lead with "what is the read/write ratio and what is your staleness budget?" Cache pattern follows from the answer.
- Mention the cache stampede / dogpile problem and either `request-coalescing` or `XFetch` (probabilistic early expiry) as defenses.
- Distinguish cache-aside (app-managed) from read-through (library-managed) — interviewers often use the terms sloppily; demonstrating you know the difference scores points.
- For the "design Twitter feed cache" question, the answer is usually cache-aside with explicit fan-out invalidation when a celebrity tweets — show you can reason about invalidation cost, not just hit rate.

## code.python
```python
import redis, json

r = redis.Redis()

def get_user(uid):
    key = f"user:{uid}"
    cached = r.get(key)
    if cached:
        return json.loads(cached)
    user = db.query("SELECT * FROM users WHERE id = %s", uid)
    r.setex(key, 300, json.dumps(user))
    return user

def update_user(uid, patch):
    key = f"user:{uid}"
    r.delete(key)
    db.execute("UPDATE users SET ... WHERE id = %s", uid)
    r.delete(key, ex=500)
```

## code.javascript
```javascript
import Redis from "ioredis";
const cache = new Redis();
const TTL = 300;

async function getUser(id) {
  const key = `user:${id}`;
  const hit = await cache.get(key);
  if (hit) return JSON.parse(hit);
  const user = await db.users.findOne({ id });
  await cache.setex(key, TTL, JSON.stringify(user));
  return user;
}

async function updateUser(id, patch) {
  const key = `user:${id}`;
  await cache.del(key);
  await db.users.update({ id }, patch);
  setTimeout(() => cache.del(key), 500);
}
```

## code.java
```java
LoadingCache<Long, User> users = Caffeine.newBuilder()
    .maximumSize(100_000)
    .expireAfterWrite(Duration.ofMinutes(5))
    .build(id -> db.findUser(id));

User get(long id) { return users.get(id); }

void update(long id, UserPatch patch) {
    users.invalidate(id);
    db.update(id, patch);
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <chrono>
#include <mutex>

struct CacheEntry { User value; std::chrono::steady_clock::time_point expiry; };
std::unordered_map<long, CacheEntry> cache;
std::mutex m;

User get_user(long id) {
    {
        std::lock_guard lk(m);
        auto it = cache.find(id);
        if (it != cache.end() && it->second.expiry > std::chrono::steady_clock::now())
            return it->second.value;
    }
    User u = db_lookup(id);
    {
        std::lock_guard lk(m);
        cache[id] = {u, std::chrono::steady_clock::now() + std::chrono::minutes(5)};
    }
    return u;
}

void update_user(long id, const UserPatch& patch) {
    { std::lock_guard lk(m); cache.erase(id); }
    db_update(id, patch);
}
```
