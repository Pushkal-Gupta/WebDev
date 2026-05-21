---
slug: sharding
module: system-design
title: Sharding
subtitle: Split one giant dataset across many machines so each machine holds only a slice.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "MongoDB — sharding overview"
    url: ""
status: published
---

## intro
A single database tops out — at some point its disk, RAM, or write throughput stops scaling vertically. Sharding (a.k.a. horizontal partitioning) splits the data across N independent databases by some key, so each shard holds 1/Nth of the rows and handles 1/Nth of the traffic. Reads and writes are routed to the shard owning the relevant key.

## whyItMatters
Once your hot table crosses ~100M rows or your write rate crosses what one DB primary can sustain, you're sharding whether you want to or not. Getting the shard key right early saves a brutal mid-life migration. Sharding done well multiplies capacity linearly; done badly creates hotspots that wipe out the win.

## intuition
A library with 10 million books can't fit on one shelf. So you split: A–C on shelf 1, D–F on shelf 2, etc. (range sharding). When someone asks for "Dune," you know exactly which shelf — but if everyone wants D–F books, that shelf gets mobbed. Alternatively, hash each title and route to `hash(title) % 10` — load spreads evenly, but you can't easily scan "all books starting with D" without checking every shelf.

## visualization
```
                       hash(user_id) % 3
Client ──► [Router] ──┬──► Shard 0 (users with hash % 3 == 0)
                      ├──► Shard 1 (users with hash % 3 == 1)
                      └──► Shard 2 (users with hash % 3 == 2)
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
