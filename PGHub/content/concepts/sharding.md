---
slug: sharding
module: sd-storage
title: Sharding
subtitle: Split one giant dataset across many machines so each machine holds only a slice.
difficulty: Intermediate
position: 3
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
A single database tops out — at some point its disk, RAM, or write throughput stops scaling vertically. Sharding (a.k.a. horizontal partitioning) splits the data across N independent databases by some key, so each shard holds 1/Nth of the rows and handles 1/Nth of the traffic. Reads and writes are routed to the shard owning the relevant key.

## whyItMatters
Once your hot table crosses ~100M rows or your write rate crosses what one DB primary can sustain, you're sharding whether you want to or not. Getting the shard key right early saves a brutal mid-life migration. Sharding done well multiplies capacity linearly; done badly creates hotspots that wipe out the win.

## intuition
A library with 10 million books can't fit on one shelf. So you split: A–C on shelf 1, D–F on shelf 2, etc. (range sharding). When someone asks for "Dune," you know exactly which shelf — but if everyone wants D–F books, that shelf gets mobbed. Alternatively, hash each title and route to `hash(title) % 10` — load spreads evenly, but you can't easily scan "all books starting with D" without checking every shelf.

What's actually happening is that you are trading a single machine's ceiling for a routing problem. One database primary might sustain, say, 20k writes/sec and hold 2 TB before its disk and buffer pool tap out. Your table is growing at 500M rows/year and write traffic is climbing past 40k/sec — no bigger box fixes that durably. Split the data across 8 shards keyed by `user_id` and each shard now holds ~250M rows and absorbs ~5k writes/sec, comfortably inside one machine's envelope, and you can add a 9th and 10th shard as traffic grows. The catch is that the shard key silently decides your access patterns forever. Shard by `user_id` and "give me everything for user 42" is one hop to one shard — fast. But "count all orders placed today across all users" now has to fan out to all 8 shards and merge, and a transaction that touches two users straddles two shards and loses single-node ACID. You are not eliminating the load; you are dividing it, and the division line is the shard key you must choose before the data lands.

## visualization
```
Routing by hash(user_id) % N, and what a resize costs:

write(user_id=1042) -> h = md5(1042) -> h % 4 = 2 -> Shard 2
read (user_id=1042) -> same formula  -> h % 4 = 2 -> Shard 2  (co-located)

key      hash%4  shard        key      hash%8  shard   (grow N: 4 -> 8)
u-1042     2     Shard 2       u-1042     6     Shard 6   MOVED
u-2001     0     Shard 0       u-2001     0     Shard 0   stays
u-3007     3     Shard 3       u-3007     7     Shard 7   MOVED
plain %N resize remaps ~3/4 of keys; consistent hashing remaps ~1/N instead.
```

## bruteForce
Keep one giant DB. Vertical scaling (bigger box, more IOPS) buys you time but has a ceiling and eventually the cost curve goes parabolic.

## optimal
Pick a **shard key** with these properties:

1. **High cardinality** — many distinct values so traffic spreads.
2. **Even distribution** — no single value gets a disproportionate share.
3. **Co-locates related queries** — if you always query "all orders for user X," shard by user_id so that user's orders all sit on one shard.

Pick a **strategy**:

- **Range-based**: shard by ranges of the key (`0–999`, `1000–1999`, ...). Easy range scans. Risk of hot ranges.
- **Hash-based**: `shard = hash(key) % N`. Even distribution. Adding a shard rehashes everything → use **consistent hashing** to limit churn.
- **Directory-based**: a lookup service maps each key → shard. Most flexible; the lookup is a new SPOF.

Cross-shard operations (joins, transactions, aggregations) get hard. Either denormalize so a query stays on one shard, or accept scatter-gather (query all shards, merge in application).

The one decision that outlives every other is the **shard key**, because changing it later means rewriting where every row lives. Reach for sharding only after cheaper levers are exhausted — read replicas for read-bound load, caching for hot reads, vertical scale for headroom — since sharding permanently complicates joins, transactions, and secondary-index queries. When you do shard, hash-based on a high-cardinality key is the safe default for even load, and consistent hashing (or jump hash) is non-negotiable so that going from N to N+1 shards remaps ~1/N of keys instead of nearly all of them. The failure mode that erases the entire win is the **hotspot**: a key like `country_code` or a celebrity `user_id` that concentrates a disproportionate share of traffic onto one shard, which then saturates while the others idle. Validate the key against real production distribution before committing, and for known heavy keys add a salt or a dedicated shard. The second failure mode is operational: N shards means N times the backups, migrations, and monitoring, and a rebalance moves terabytes over the network for hours — so favor schema designs that keep each query on a single shard, and treat cross-shard transactions as something to design out, not to coordinate with 2PC.

## complexity
- **Throughput**: ≈ N × single-shard throughput when balanced.
- **Latency**: roughly unchanged for single-key queries; multi-key fan-outs are bounded by the slowest shard.
- **Operational cost**: N times the backups, monitoring, schema migrations.

## pitfalls
- **Hotspots**: shard by `country_code` and one country swamps one shard. Always validate distribution against real-world data.
- **Resharding pain**: changing the key or shard count later is a migration nightmare. Use consistent hashing.
- **Distributed transactions**: cross-shard writes break ACID guarantees. Use sagas or design schemas so writes stay local.
- **Cross-shard joins** are expensive — denormalize aggressively or pull data via a separate query engine (e.g. read replica + warehouse).
- **Re-sharding rebalancing**: data movement during rebalance is slow and bandwidth-heavy.

## interviewTips
- **Always start by identifying the shard key.** "I'd shard by user_id because the access pattern is dominated by per-user queries" is the right opening.
- Discuss **hot keys** explicitly. Power users are the classic exception.
- Mention **consistent hashing** by name when resharding comes up.
- If asked about cross-shard joins, immediately offer either denormalization or scatter-gather as the fix.

## code.python
```python
# Hash-based shard routing.
import hashlib
def shard_for(key: str, num_shards: int) -> int:
    h = int(hashlib.md5(key.encode()).hexdigest(), 16)
    return h % num_shards

print(shard_for("user-42", 4))
print(shard_for("user-43", 4))
```

## code.javascript
```javascript
const crypto = require('crypto');
function shardFor(key, n) {
  const h = crypto.createHash('md5').update(key).digest('hex');
  return parseInt(h.slice(0, 8), 16) % n;
}
console.log(shardFor('user-42', 4));
```

## code.java
```java
import java.security.MessageDigest;
class Shard {
    static int forKey(String key, int n) throws Exception {
        byte[] d = MessageDigest.getInstance("MD5").digest(key.getBytes());
        int v = ((d[0] & 0xff) << 24) | ((d[1] & 0xff) << 16) | ((d[2] & 0xff) << 8) | (d[3] & 0xff);
        return Math.floorMod(v, n);
    }
}
```

## code.cpp
```cpp
#include <string>
#include <functional>
size_t shard_for(const std::string& key, size_t n) {
    return std::hash<std::string>{}(key) % n;
}
```
