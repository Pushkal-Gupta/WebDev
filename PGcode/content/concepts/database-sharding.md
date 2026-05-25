---
slug: database-sharding
module: sd-storage
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
- **Vitess** (YouTube, Slack, GitHub, Shopify) shards MySQL transparently; **Citus** (Microsoft, integrated into Azure Database for PostgreSQL) shards Postgres; **CockroachDB, Spanner, YugabyteDB, FoundationDB** are sharded-by-default distributed databases.
- **DynamoDB, Cassandra, MongoDB, ScyllaDB** all use hash or consistent-hash partitioning as the default; **Bigtable, HBase, TiKV** use range partitioning.
- **The Dynamo paper (DeCandia et al., 2007)** introduced consistent hashing with virtual nodes for production at Amazon; the same technique underlies **Riak**, **Memcached client libraries (libketama)**, and **Akka Cluster Sharding**.
- **Designing Data-Intensive Applications Chapter 6** is the canonical reference; every senior backend interview asks "how would you shard X?" because the shard-key choice is the single most consequential decision in a distributed storage design.

## intuition
Sharding partitions one logical dataset across N physical databases so that no single node holds the whole working set. The motivation is fundamental: a single Postgres or MySQL instance maxes out around tens of thousands of writes per second and a few terabytes of data; **replication scales reads but not writes** (every replica must apply every write); the only way to scale writes past one machine is to split the data so different writes go to different machines.

Three competing pressures shape every sharding decision:

1. **Even load distribution** — no hot shard. The shard key's distribution determines load; if it correlates with traffic (sharding by country with one country = 60% of users) you get a hot shard that defeats the whole point.
2. **Query locality** — one shard answers most reads. A query that fans out to all shards has latency equal to the **slowest** shard, and you have re-built the original single-node bottleneck plus network overhead.
3. **Rebalancing cost** — adding a shard should not migrate the whole dataset. Naive `shard = id mod N` reshuffles roughly all rows when N changes (because every key's residue changes); consistent hashing reshuffles only ~1/N keys.

The four canonical strategies trade these pressures differently:

- **Range sharding** (orders by order_id, time-series by timestamp): great query locality for range scans (`WHERE date BETWEEN ...`), terrible distribution because the newest range is always hot (writes pile on one shard). Used by HBase, BigTable, and time-series stores.
- **Hash sharding** (orders by `hash(user_id) mod N`): excellent distribution (random spread), perfect locality for single-key lookups, but range scans must fan out to all shards. Used by Cassandra, DynamoDB, and most key-value stores.
- **Consistent hashing** (a ring of 2^32 slots, each shard owns an arc, virtual nodes for smoothing): like hash sharding but resharding moves only K/N keys instead of all of them. Used by Dynamo, Riak, Cassandra (with vnodes), Memcached clients.
- **Directory sharding** (lookup table mapping tenant -> shard): maximally flexible per-tenant placement (whale tenants get dedicated shards), at the cost of one extra hop per query and a coordination service that must stay highly available. Used by Vitess, YouTube's storage layer, and most multi-tenant SaaS at scale.

The choice is one-way: queries that touched one node now touch many, transactions stop being free, and operational complexity multiplies. Reach for sharding only when vertical scaling, read replicas, caching, and archiving cold data have all been exhausted.

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
The right approach is **a workload-driven strategy choice plus consistent hashing with virtual nodes for rebalance-friendliness**, paired with co-located transactional data, async cross-shard reconciliation, and a productized sharding layer (Vitess, Citus, Spanner) instead of hand-rolled routing.

```python
import bisect, hashlib

class ConsistentHashRing:
    def __init__(self, vnodes_per_shard: int = 200):
        self.vnodes = vnodes_per_shard
        self.ring: list[int] = []                   # sorted hash positions
        self.owners: dict[int, str] = {}

    def _hash(self, key: str) -> int:
        # SHA256 / MD5 are uniform enough for distribution; MurmurHash is faster.
        return int(hashlib.sha256(key.encode()).hexdigest(), 16)

    def add_shard(self, shard_id: str) -> None:
        # Virtual nodes (200/shard) smooth distribution and shrink the
        # variance in per-shard load to within ~5% of uniform.
        for i in range(self.vnodes):
            h = self._hash(f"{shard_id}#{i}")
            bisect.insort(self.ring, h)
            self.owners[h] = shard_id

    def shard_for(self, key: str) -> str:
        h = self._hash(key)
        idx = bisect.bisect_right(self.ring, h) % len(self.ring)
        return self.owners[self.ring[idx]]

# Workload-driven strategy selection:
def pick_strategy(workload):
    if workload.time_series_append_mostly:
        return "range shard on time; route newest writes to a hot tier"
    if workload.multi_tenant and workload.whale_tenants_exist:
        return "directory shard on tenant_id; give whales dedicated shards"
    if workload.high_fanout_per_user:
        return "hash shard on user_id; co-locate per-user data"
    return "consistent hash with 200 vnodes/shard"
```

Why this is right: **consistent hashing with virtual nodes** is the production default because it scales linearly with adding shards (only K/N keys move when adding 1 of N shards), virtual nodes (200-256 per physical shard) smooth load variance to within ~5% of uniform, and the ring data structure is O(log N) per lookup. Used by **Dynamo, Riak, Cassandra, Memcached clients (libketama), Akka cluster sharding**.

**Co-location is the discipline that makes sharding survive contact with production**:

- Group data that must transact together (orders + order_items + payments) under a single shard key (`user_id`), so 95% of writes hit one shard and use ordinary local transactions.
- For the 5% cross-shard cases, use **saga + outbox + idempotent compensations** (eventually consistent, no blocking) or **two-phase commit** (consistent, blocking, slow). Saga is the modern default; 2PC is reserved for cases where partial failure is unacceptable and latency budget allows.
- For analytics that need to scan all shards, **ship CDC to a column store** (Snowflake, ClickHouse, BigQuery) rather than fan-out queries to OLTP shards.

**Strategy by workload pattern**:
- **Time-series, append-mostly** (events, metrics, logs): range shard on time, route newest writes to a hot tier with more replicas; archive cold partitions to S3 (TimescaleDB hypertables, BigTable's time-based tablets).
- **Multi-tenant SaaS** (tenants are units of work): directory shard on `tenant_id`. Give whale tenants dedicated shards; pack many small tenants into shared shards via hash. Vitess and Citus support this natively.
- **High-fanout per-user** (social feeds, gaming): hash shard on `user_id`. Co-locate posts, likes, follows under the same key.
- **Unpredictable mix**: consistent hash with virtual nodes, plus a directory layer for over-large keys.

**Production reality checklist** (anti-patterns that bite):
- **Shard key correlated with traffic**: sharding by country with one country = 60% of users guarantees a hot shard. Always validate the distribution before committing.
- **Auto-increment IDs are not unique across shards**: use **UUIDv7, Snowflake IDs, or ULID** (sortable + globally unique) instead of `BIGSERIAL`.
- **Cross-shard joins in the request path**: latency = max of all shard latencies. Denormalize, cache, or pre-compute via CDC.
- **Unique indexes that the shard key does not cover**: uniqueness now requires a coordinator or a global secondary index. Either include the unique column in the shard key, or accept eventual consistency on uniqueness.
- **Whale tenants without size caps**: one customer fills a whole shard. Enforce per-tenant size limits at the application layer or pre-emptively split.

**Productized sharding layers** — prefer over hand-rolled routing:
- **Vitess** (YouTube, Slack, GitHub): MySQL-compatible, transparent sharding, supports online resharding with shadow writes.
- **Citus** (now part of Postgres via Microsoft): turns Postgres into a distributed database with hash-based sharding.
- **CockroachDB, Spanner, YugabyteDB**: built-in distributed-by-default, range sharding with automatic rebalancing.
- **MongoDB, DynamoDB, Cassandra**: NoSQL stores with native partitioning baked in.

Online resharding with **shadow writes** (write to both old and new shard during migration, then cut over reads) is the only safe way to add shards to a production system; the Vitess `vreplication` and Citus `citus_split_shard` workflows formalize this.

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
