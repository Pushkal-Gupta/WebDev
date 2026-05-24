---
slug: database-sharding
module: system-design
title: Database Sharding
subtitle: Range, hash, and directory-based partitioning for horizontal scale.
difficulty: Advanced
position: 24
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Microservices.io — Database per Service and Sharding"
    url: "https://microservices.io/patterns/data/database-per-service.html"
    type: book
  - title: "Why Most Sharding Schemes Are Bad — High Scalability"
    url: "http://highscalability.com/blog/category/sharding"
    type: blog
  - title: "donnemartin/system-design-primer — Sharding"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
Sharding splits one logical dataset across N physical databases so that no single node holds the whole working set. The choice of shard key — and the mapping from key to shard — determines whether your system scales linearly or collapses under hotspots, rebalances, and cross-shard joins.

## whyItMatters
A single Postgres instance maxes out around tens of thousands of writes per second and a few TB. Replication scales reads but not writes. Sharding is the lever that pushes write throughput and total dataset size past those limits — but it is a one-way door: queries that touched one node now touch many, transactions stop being free, and operational complexity multiplies.

## intuition
Three competing pressures shape every sharding decision: **even load distribution** (no hot shard), **query locality** (one shard answers most reads), and **rebalancing cost** (adding a shard shouldn't migrate the whole dataset). Each strategy below trades one of these against the others.

## visualization
```
range sharding (orders by order_id):
  shard 0: [          0 ..  1,000,000)
  shard 1: [  1,000,000 ..  2,000,000)
  shard 2: [  2,000,000 ..       inf )  <-- always hot: newest writes

hash sharding (orders by hash(user_id) mod 4):
  user_id 17  -> hash=...c1 -> shard 1
  user_id 42  -> hash=...3a -> shard 2     even spread, no range scans

consistent hashing (a ring of 2^32 slots, each shard owns an arc):
   shard A ----+
                \    moving from 3 shards to 4 reshuffles ~1/N keys
   shard D ---- O ---- shard B
                /     (vs. ~all keys for "mod N")
   shard C ----+

directory sharding (lookup table):
  tenant 'acme'  -> shard 7
  tenant 'globex'-> shard 2     flexible per-tenant placement; lookup is one extra hop
```

## bruteForce
Pick `shard = id mod N`. It distributes evenly while N is fixed but resharding from N to N+1 reshuffles roughly all rows, because every key's residue changes. Acceptable for caches that can be cold-restarted; disastrous for primary stores that must stay online.

## optimal
Decision tree by query pattern:
```
mostly time-series, append-mostly       -> range shard on time, route newest to a hot tier
multi-tenant SaaS, tenant = unit of work-> directory shard on tenant_id (or hash if tenants are tiny)
high-fanout reads by user               -> hash shard on user_id; co-locate per-user data
unpredictable mix                       -> consistent hash with virtual nodes (200 vnodes / shard)
```
Co-locate data that must transact together (orders + order_items by `user_id`) so 95% of writes hit one shard. For the 5% cross-shard cases, use **two-phase commit** (slow, blocking) or saga + outbox + idempotent compensations (fast, eventually consistent). For analytics, ship CDC to a column store rather than fan-out queries to OLTP shards.

## complexity
time: single-shard query O(query) — same as unsharded; cross-shard query O(query) per shard + merge O(N log N)
space: O(data / N) per shard plus replication factor
notes: Rebalancing under consistent hashing moves O(K / N) keys when adding 1 shard, vs O(K) for naive mod-N.

## pitfalls
- Choosing a shard key that correlates with traffic (e.g. shard by country with one country = 60% of users) — guarantees a hot shard.
- Adding a unique index that the shard key doesn't cover — uniqueness now requires a coordinator or a global secondary index.
- Cross-shard joins in the request path — latency = max of all shard latencies; one slow shard = slow request.
- Forgetting that auto-increment IDs aren't unique across shards — use UUIDv7, Snowflake IDs, or per-shard sequence with shard-id prefix.
- Storing per-tenant blobs without per-tenant size caps — one whale tenant fills a whole shard.

## interviewTips
- Always ask: "What's the read/write ratio? What's the unit of co-location?" — these pick the strategy.
- Mention Vitess, Citus, Spanner as productized sharding layers — don't roll your own unless you must.
- Be ready to discuss rebalancing: virtual nodes, double-hashing, and online migration with shadow writes.
- Name the cross-shard transaction problem explicitly — interviewers test whether you know it's the hard part.

## code.python
```python
import bisect, hashlib

class ConsistentHashRing:
    def __init__(self, vnodes=200):
        self.vnodes = vnodes
        self.ring = []
        self.owners = {}

    def _hash(self, key):
        return int(hashlib.md5(key.encode()).hexdigest(), 16)

    def add_shard(self, shard_id):
        for i in range(self.vnodes):
            h = self._hash(f"{shard_id}#{i}")
            bisect.insort(self.ring, h)
            self.owners[h] = shard_id

    def shard_for(self, key):
        if not self.ring:
            raise RuntimeError("empty ring")
        h = self._hash(key)
        idx = bisect.bisect_right(self.ring, h) % len(self.ring)
        return self.owners[self.ring[idx]]
```

## code.javascript
```javascript
import crypto from 'crypto';

class ConsistentHashRing {
  constructor(vnodes = 200) { this.vnodes = vnodes; this.ring = []; this.owners = new Map(); }

  _hash(key) {
    return parseInt(crypto.createHash('md5').update(key).digest('hex').slice(0, 8), 16);
  }

  addShard(shardId) {
    for (let i = 0; i < this.vnodes; i++) {
      const h = this._hash(`${shardId}#${i}`);
      this.ring.push(h);
      this.owners.set(h, shardId);
    }
    this.ring.sort((a, b) => a - b);
  }

  shardFor(key) {
    const h = this._hash(key);
    let lo = 0, hi = this.ring.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.ring[mid] <= h) lo = mid + 1; else hi = mid;
    }
    return this.owners.get(this.ring[lo % this.ring.length]);
  }
}
```

## code.java
```java
class ConsistentHashRing {
    private final int vnodes;
    private final TreeMap<Long, String> ring = new TreeMap<>();

    ConsistentHashRing(int vnodes) { this.vnodes = vnodes; }

    private long hash(String key) {
        try {
            byte[] d = MessageDigest.getInstance("MD5").digest(key.getBytes());
            return ((long)(d[0] & 0xff) << 24) | ((long)(d[1] & 0xff) << 16)
                 | ((long)(d[2] & 0xff) << 8)  |  (long)(d[3] & 0xff);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    void addShard(String id) {
        for (int i = 0; i < vnodes; i++) ring.put(hash(id + "#" + i), id);
    }

    String shardFor(String key) {
        long h = hash(key);
        Map.Entry<Long, String> e = ring.ceilingEntry(h);
        return (e == null ? ring.firstEntry() : e).getValue();
    }
}
```

## code.cpp
```cpp
#include <map>
#include <string>
#include <openssl/md5.h>

struct ConsistentHashRing {
    int vnodes;
    std::map<uint64_t, std::string> ring;

    ConsistentHashRing(int v = 200) : vnodes(v) {}

    uint64_t hash(const std::string& k) {
        unsigned char d[16];
        MD5(reinterpret_cast<const unsigned char*>(k.data()), k.size(), d);
        return ((uint64_t)d[0] << 24) | ((uint64_t)d[1] << 16)
             | ((uint64_t)d[2] <<  8) |  (uint64_t)d[3];
    }

    void addShard(const std::string& id) {
        for (int i = 0; i < vnodes; i++) ring[hash(id + "#" + std::to_string(i))] = id;
    }

    std::string shardFor(const std::string& key) {
        auto it = ring.lower_bound(hash(key));
        if (it == ring.end()) it = ring.begin();
        return it->second;
    }
};
```
