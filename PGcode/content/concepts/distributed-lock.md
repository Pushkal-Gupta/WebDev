---
slug: distributed-lock
module: sd-consensus
title: Distributed Locks
subtitle: Coordinate exclusive access across N processes — Redis SETNX / Redlock / ZooKeeper / etcd. Fencing tokens prevent stale-lock bugs.
difficulty: Advanced
position: 52
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Martin Kleppmann — How to do distributed locking"
    url: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html"
    type: book
  - title: "Redis docs — Distributed locks (Redlock)"
    url: "https://redis.io/topics/distlock"
    type: blog
  - title: "etcd-io/etcd — concurrency package (Mutex/Election)"
    url: "https://github.com/etcd-io/etcd"
    type: repo
status: published
---

## intro
Multiple processes (across machines) need to coordinate access to a shared resource — only one can edit `/users/42` at a time. **Distributed locks** provide this primitive. Three popular implementations: **Redis SETNX** (simple, fast, single-node), **Redlock** (multi-Redis quorum), **ZooKeeper / etcd** (CP consensus). **Fencing tokens** are required for correctness in all variants — without them, the "lock" is advisory and stale holders can corrupt data.

## whyItMatters
Every distributed system eventually needs cross-process coordination:
- **Cron jobs** that must run on exactly one node (not N replicas).
- **Leader election** for a primary worker.
- **Sequential resource creation** (assign IDs from a shared pool).
- **Migrations** that should run once per cluster.

Done wrong → double-execution, corrupted state, lost data.

## intuition
Locks need three properties:
1. **Mutual exclusion**: at most one holder at a time.
2. **Deadlock-free**: locks auto-expire (TTL) so a crashed holder doesn't hold forever.
3. **Fault tolerance**: lock service survives node failures.

Naïve approach: `if (SET lock_key value NX EX 30): work() else: wait`. Works for single Redis. Breaks if:
- Redis itself fails over (replica didn't replicate the SET).
- Holder pauses (GC pause, paged-out process) longer than TTL — lock auto-expires, another process acquires, original holder resumes and writes — data corruption.

**Fencing token** fixes the second issue: lock returns a monotonically increasing token. Every write to the protected resource includes the token. Storage rejects writes with stale tokens.

## visualization
```
Without fencing token (Kleppmann's classic counter-example):

Client A acquires lock with TTL=30s   token = 1
Client A starts work, pauses for GC (45s)

After 30s: lock expires.
Client B acquires lock                token = 2
Client B writes data, releases.

Client A wakes up at 45s:
  "I still hold the lock — I'll write my data."
  Storage: "Sure" (no fencing) → A overwrites B's work. ❌

With fencing token:
  Same sequence.
  Client A writes with token=1.
  Storage: "I last wrote with token=2; token=1 is stale" → reject A's write. ✓
```

## bruteForce
**Database row lock** (`SELECT ... FOR UPDATE`): works, but slow + DB becomes the lock service.

**File-system flock**: only works on single host.

**No lock + idempotent writes**: best when you can make the operation idempotent. Many "distributed locks" should be replaced by idempotency keys.

## optimal
**Redis simple lock** (single instance, OK for most use cases):
```python
import redis, secrets
r = redis.Redis()

def acquire(key, ttl_seconds=30):
    token = secrets.token_hex(16)
    if r.set(key, token, nx=True, ex=ttl_seconds):
        return token
    return None

def release(key, token):
    # Lua script: only delete if value matches our token (prevents releasing someone else's lock)
    script = """
      if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
      else
        return 0
      end
    """
    return r.eval(script, 1, key, token)

# Usage with fencing:
def acquire_with_token(key, ttl=30):
    # Use Redis INCR to get a monotonic fencing token.
    token = r.incr(f'{key}:fence')
    if r.set(key, token, nx=True, ex=ttl):
        return token
    return None
```

**Redlock** (multi-Redis quorum, addresses Redis-failover risk):
- Acquire lock on majority of N Redis instances within timeout T.
- Release on all.
- Kleppmann argues Redlock is still insufficient for safety without fencing tokens.

**ZooKeeper / etcd** (CP consensus, slower but correct):
- Create an ephemeral sequential znode.
- Watch the previous znode; you have the lock when no smaller znode exists.
- On client disconnect, ephemeral node disappears → next watcher gets lock.
- Built-in fencing via zxid (transaction ID).

**Storage rejection** of stale tokens:
```sql
UPDATE resources SET value = $1, last_token = $2
WHERE id = $3 AND last_token < $2
```

## complexity
- **Redis lock**: 1 round-trip per acquire/release (~1ms).
- **Redlock**: N round-trips, take majority — slower but more fault-tolerant.
- **ZooKeeper**: ~10-50ms acquire (consensus).
- **Hold time**: must be short enough that TTL won't expire mid-work.

## pitfalls
- **No fencing tokens**: stale holders corrupt data. Kleppmann's whole article.
- **TTL too short**: GC pause / slow query → lock expires mid-work → double-execution.
- **Releasing someone else's lock**: `DEL key` after your TTL expired but someone else now holds. Always check value first (Lua script).
- **Treating Redlock as 100% safe**: it's not. Pair with fencing.
- **Holding a lock for I/O**: long lock hold = throughput killer. Lock just the critical section.
- **No lease extension**: long jobs need to extend TTL periodically.

## interviewTips
- For "coordinate work across replicas" — distributed lock OR idempotency key + dedup table (often simpler).
- Mention **fencing tokens** as essential for correctness.
- For senior interviews, discuss **Redlock vs ZooKeeper trade-offs** and why Kleppmann argues for ZK/etcd over Redlock for safety-critical use cases.

## code.python
```python
import time, secrets, redis
r = redis.Redis()

class DistLock:
    def __init__(self, key, ttl=30):
        self.key = key; self.ttl = ttl; self.token = None
    def __enter__(self):
        self.token = secrets.token_hex(16)
        deadline = time.time() + 10
        while time.time() < deadline:
            if r.set(self.key, self.token, nx=True, ex=self.ttl):
                return self
            time.sleep(0.05)
        raise TimeoutError(f'could not acquire {self.key}')
    def __exit__(self, *_):
        r.eval("""
          if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('DEL', KEYS[1])
          end
          return 0
        """, 1, self.key, self.token)

with DistLock('jobs:cron:nightly-report'):
    run_nightly_report()
```

## code.javascript
```javascript
const Redis = require('ioredis');
const redis = new Redis();
async function withLock(key, ttl, fn) {
  const token = require('crypto').randomBytes(16).toString('hex');
  const ok = await redis.set(key, token, 'NX', 'EX', ttl);
  if (!ok) throw new Error('lock not acquired');
  try { return await fn(); }
  finally {
    await redis.eval(
      `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`,
      1, key, token);
  }
}
```

## code.java
```java
// Redisson — production-grade distributed lock library
RedissonClient redisson = Redisson.create();
RLock lock = redisson.getLock("jobs:cron:nightly-report");
boolean ok = lock.tryLock(10, 30, TimeUnit.SECONDS);
if (ok) {
    try { runJob(); }
    finally { lock.unlock(); }
}
```

## code.cpp
```cpp
// hiredis + Lua script — pattern same as Python
// auto reply = redisCommand(ctx, "SET %s %s NX EX %d", key, token, ttl);
// if (reply->str && std::string(reply->str) == "OK") { /* got it */ }
```
