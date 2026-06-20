---
slug: redis-data-structures
module: hashing
title: Redis Data Structures
subtitle: Strings, lists, sets, hashes, sorted-sets, and streams — pick the right primitive and Redis behaves like a hand-tuned cache.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 3: Storage and Retrieval"
    url: "https://dataintensive.net/"
    type: book
  - title: "Martin Fowler — Polyglot Persistence"
    url: "https://martinfowler.com/bliki/PolyglotPersistence.html"
    type: blog
  - title: "redis/redis — src/t_string.c, t_list.c, t_zset.c"
    url: "https://github.com/redis/redis"
    type: repo
status: published
---

## intro
Redis is often introduced as "an in-memory key-value store," but that description hides what makes it powerful: each value is a typed data structure with its own operations and complexity guarantees. Strings, lists, sets, hashes, sorted-sets, and streams each map cleanly to a well-known interview data structure — a dynamic array, a doubly-linked list, a hash set, a hash map, a skip list keyed by score, and an append-only log. Knowing which primitive to pick is the difference between a 0.2 ms lookup and a five-second scan.

## whyItMatters
Every backend interview at scale touches caching, rate-limiting, leaderboards, session storage, or pub-sub — all of which collapse to a Redis design question. Saying "I would cache it in Redis" is not an answer; the follow-up is always "with which data structure, and what is the eviction policy?" Choosing the wrong structure (a list when you wanted a sorted set, a hash when you wanted a set) turns an `O(log n)` operation into `O(n)` and burns CPU on a single-threaded server that the whole company depends on. Twitter's timeline service, Stack Overflow's hot-question cache, Instagram's session store, Discord's presence tracker, and GitHub's job queue all sit on Redis. The 2020 Redis 6 release added client-side caching (Tracking) which made it the default L1 cache for high-RPS services everywhere.

## intuition
Treat Redis like a remote process whose memory you can program against with verbs instead of pointers. `SET key value` is a remote `dict[key] = value`. `LPUSH queue x` is `queue.appendleft(x)` over the network. `ZADD leaderboard 1500 alice` is `heap.push((1500, "alice"))` but with `O(log n)` deletes and rank queries. Picture the underlying structures — a SDS string for binary-safe text, a quicklist of listpacks for lists, a dict + listpack hybrid for hashes, a skip list paired with a hash for sorted sets, an intset or hashtable for sets — and the API memorizes itself.

The single-threaded execution model is the second mental model worth holding. Redis runs one command at a time, so multi-step operations need to be atomic by construction: use `MULTI`/`EXEC` for transactions, or write a Lua script (`EVAL`) for read-modify-write. Pipelining batches many commands into one round-trip without changing their order or atomicity. Pub/Sub, Streams, and the keyspace-notification system are all built on the same event-loop and never block individual command execution.

The third mental model is the memory pressure story. Redis is RAM-bound; when `used_memory` approaches `maxmemory` it evicts according to your `maxmemory-policy`. Get this wrong and your cache evicts the wrong keys or, worse, refuses new writes (`noeviction`). Picking `allkeys-lru` or `volatile-ttl` is the difference between a cache that helps and one that paralyzes traffic during memory crunches.

## visualization
Imagine a status page with four widgets:

1. `top:scores` — sorted-set; show top 10 via `ZREVRANGE top:scores 0 9 WITHSCORES`.
2. `user:42:profile` — hash; `HGET user:42:profile email` plucks one field without re-serializing the row.
3. `feed:42` — list; `LRANGE feed:42 0 19` returns the latest 20 timeline events.
4. `tags:trending` — set; `SUNIONSTORE` and `SINTER` materialize "tags Alice and Bob both follow" in one round trip.

Each widget hits a different primitive; all are O(log n) or better.

## bruteForce
The "everything is a string" trap: serialize a JSON blob and stuff it into a single `SET user:42 '{...}'`. To update one field, you `GET` the blob, parse it, mutate it, and `SET` it back. Every read transfers the whole object; every write is a race condition unless wrapped in `WATCH`/`MULTI`. It works for 100 users and falls apart at 100k — the cache becomes a bottleneck instead of an accelerator.

## optimal
Match the access pattern to a native type. Counters and rate limiters: `INCR` / `INCRBY` on a string with TTL. Per-field updates: `HSET` / `HINCRBY` / `HGETALL` on a hash. FIFO queues: `LPUSH` plus blocking `BRPOP` on a list (or use Streams with consumer groups for durability). Membership checks and unique-set operations (intersections, unions): `SADD` / `SISMEMBER` / `SINTER` on a set. Leaderboards, time-window indexes, or any "top-k by score" query: `ZADD` / `ZRANGEBYSCORE` / `ZRANGEBYLEX` on a sorted set. Event sourcing or fan-out logs with consumer groups: `XADD` / `XREADGROUP` / `XACK` on a stream. Bitmap analytics on user IDs: `SETBIT` / `BITCOUNT` / `BITOP` on a string.

```bash
# Sliding-window rate limit: 100 req/min per user, atomic via Lua
EVAL "local k=KEYS[1]; local n=redis.call('INCR',k);
      if n==1 then redis.call('EXPIRE',k,60) end;
      return n" 1 rate:user:42

# Top-3 of a leaderboard with one round-trip
ZADD scores 1500 alice 1450 bob 1600 carol
ZREVRANGE scores 0 2 WITHSCORES
```

The critical pattern is the Lua-wrapped rate limiter: `INCR` plus conditional `EXPIRE` would be a race in a multi-shot client, but inside `EVAL` Redis guarantees atomicity because the script runs to completion on a single thread. Configure `maxmemory-policy` to `allkeys-lru` (general cache), `volatile-ttl` (sessions with explicit TTLs), or `allkeys-lfu` (read-heavy with stable hot keys) so memory pressure evicts the right entries. For multi-key transactions across shards use `WAIT` plus client-side retry; for cross-shard consistency switch to Redis Cluster's CRC16 slot routing and design keys with hash tags (`{user:42}:profile`) so related keys land on the same node.

## complexity
time: SET/GET O(1); LPUSH/RPUSH/LPOP/RPOP O(1); LINDEX/LRANGE O(n); SADD/SREM/SISMEMBER O(1); HGET/HSET O(1); ZADD/ZREM/ZSCORE O(log n); ZRANGE O(log n + k); XADD O(1) amortized.
space: O(n) per structure, with listpack/intset compaction for small collections (under 128 entries by default).
notes: Redis is single-threaded for command execution — one `KEYS *` on a million-key DB blocks every other client. Use `SCAN`, `HSCAN`, `SSCAN`, `ZSCAN` for iteration.

## pitfalls
- Using `KEYS pattern` in production — O(n) scan that blocks the server. Always `SCAN`.
- Treating a list as a set — duplicates accumulate and `LREM` is O(n).
- Storing one giant hash with millions of fields — it stops being a listpack, becomes a dict, and `HGETALL` ships megabytes per call.
- Forgetting that `EXPIRE` is per-key, not per-field — you cannot expire a single hash field natively (until Redis 7.4's HEXPIRE).
- Pub/sub is fire-and-forget; if you need durability use streams with consumer groups instead.

## interviewTips
- When asked "how would you cache X," name the data structure first ("a hash keyed by user id") and only then the eviction policy.
- For a leaderboard question, jump straight to sorted-sets and quote `ZADD` + `ZREVRANK` — interviewers grade on vocabulary.
- Mention pipelining and Lua scripts (`EVAL`) for batched atomic ops — both are common follow-ups for "how do you reduce round trips?"
- Know one real failure mode: `KEYS *` on production, or a hot key (Bieber problem) that pins one node in a Redis Cluster shard.

## code.python
```python
import redis

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

r.set("page:views", 0)
r.incr("page:views")

r.hset("user:42", mapping={"name": "Alice", "email": "a@x.com"})
r.hincrby("user:42", "login_count", 1)
email = r.hget("user:42", "email")

r.lpush("queue:emails", "msg-1", "msg-2")
job = r.brpop("queue:emails", timeout=5)

r.zadd("leaderboard", {"alice": 1500, "bob": 1700})
top10 = r.zrevrange("leaderboard", 0, 9, withscores=True)
```

## code.javascript
```javascript
import { createClient } from "redis";

const r = createClient();
await r.connect();

await r.set("page:views", "0");
await r.incr("page:views");

await r.hSet("user:42", { name: "Alice", email: "a@x.com" });
await r.hIncrBy("user:42", "login_count", 1);

await r.lPush("queue:emails", ["msg-1", "msg-2"]);
const job = await r.brPop("queue:emails", 5);

await r.zAdd("leaderboard", [
  { score: 1500, value: "alice" },
  { score: 1700, value: "bob" },
]);
const top = await r.zRangeWithScores("leaderboard", 0, 9, { REV: true });
```

## code.java
```java
import redis.clients.jedis.Jedis;

try (Jedis j = new Jedis("localhost", 6379)) {
    j.set("page:views", "0");
    j.incr("page:views");

    j.hset("user:42", Map.of("name", "Alice", "email", "a@x.com"));
    j.hincrBy("user:42", "login_count", 1);

    j.lpush("queue:emails", "msg-1", "msg-2");
    var job = j.brpop(5, "queue:emails");

    j.zadd("leaderboard", 1500, "alice");
    j.zadd("leaderboard", 1700, "bob");
    var top = j.zrevrangeWithScores("leaderboard", 0, 9);
}
```

## code.cpp
```cpp
// Using hiredis
#include <hiredis/hiredis.h>

redisContext* c = redisConnect("127.0.0.1", 6379);

redisCommand(c, "SET page:views 0");
redisCommand(c, "INCR page:views");

redisCommand(c, "HSET user:42 name Alice email a@x.com");
redisCommand(c, "HINCRBY user:42 login_count 1");

redisCommand(c, "LPUSH queue:emails msg-1 msg-2");
redisReply* job = (redisReply*)redisCommand(c, "BRPOP queue:emails 5");

redisCommand(c, "ZADD leaderboard 1500 alice 1700 bob");
redisReply* top = (redisReply*)redisCommand(c, "ZREVRANGE leaderboard 0 9 WITHSCORES");

freeReplyObject(job); freeReplyObject(top); redisFree(c);
```
