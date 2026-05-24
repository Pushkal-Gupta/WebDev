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
Every backend interview at scale touches caching, rate-limiting, leaderboards, session storage, or pub-sub — all of which collapse to a Redis design question. Saying "I'd cache it in Redis" is not an answer; the follow-up is always "with which data structure, and what's the eviction policy?" Choosing the wrong structure (a list when you wanted a sorted-set, a hash when you wanted a set) turns an O(log n) operation into an O(n) one and burns CPU on a single-threaded server that the whole company depends on.

## intuition
Treat Redis like a remote process whose memory you can program against with verbs instead of pointers. A `SET key value` is a remote `dict[key] = value`. An `LPUSH queue x` is `queue.appendleft(x)` over the network. A `ZADD leaderboard 1500 alice` is `heap.push((1500, "alice"))` but with O(log n) deletes and rank queries. Picture the underlying structures — a SDS string, a quicklist of listpacks, a dict + listpack hybrid for hashes, a skip list paired with a hash for sorted-sets — and the API memorizes itself.

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
Match the access pattern to a native type. Counters → `INCR` on a string. Per-field updates → `HSET`/`HINCRBY` on a hash. FIFO queues → `LPUSH` + `BRPOP` on a list. Membership checks → `SADD` / `SISMEMBER` on a set. Leaderboards or time-window indexes → `ZADD` / `ZRANGEBYSCORE` on a sorted-set. Event sourcing or fan-out logs with consumer groups → streams (`XADD`, `XREADGROUP`, `XACK`). Configure `maxmemory-policy` (`allkeys-lru`, `volatile-ttl`, `allkeys-lfu`) so the cache evicts the right entries when memory pressure hits.

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
