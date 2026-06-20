---
slug: sd-storage-write-amplification
module: sd-storage
title: Write Amplification (LSM vs B-Tree)
subtitle: How much disk-write does one logical-write cause? The hidden metric that defines storage-engine economics.
difficulty: Advanced
position: 68
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Storage engines chapter"
    url: "https://dataintensive.net/"
    type: book
  - title: "RocksDB wiki — Write amplification"
    url: "https://github.com/facebook/rocksdb/wiki/Leveled-Compaction"
    type: blog
  - title: "facebook/rocksdb — LSM-tree implementation"
    url: "https://github.com/facebook/rocksdb"
    type: repo
status: published
---

## intro
**Write amplification (WA)** = total bytes written to disk ÷ bytes the application asked to write. WA = 1 means perfect. **LSM-trees** (RocksDB, Cassandra) can have WA = 10–30 due to compaction. **B-trees** (Postgres, MySQL InnoDB) have WA = 2–4 from WAL + page rewrites. Critical for SSD wear, cost, and throughput at scale.

## whyItMatters
- **SSD wear** — flash cells have limited write cycles. WA = 20 means 20× faster wear.
- **Cloud cost** — many cloud storage tiers charge per write IOPS. WA = 30 = 30× the bill.
- **Throughput ceiling** — disk write bandwidth is fixed; WA = 10 caps your effective write rate at bandwidth/10.
- **Backup / replication bandwidth** — if WA is high, change-data-capture and replication traffic explodes too.

## intuition
**B-tree** writes:
- Each row update writes the row's page (4-16 KB) once, even if the row is small.
- Plus a WAL entry (~100 bytes per change).
- WA = (page size + WAL) / row size. For small rows, WA can be 100× — but coalesced by buffer pool: dirty pages flushed once per checkpoint.

**LSM-tree** writes:
- Logical write goes to **memtable** (in RAM) + WAL.
- When memtable fills, flushes as a level-0 SSTable.
- Compaction merges level-N SSTables into level-(N+1) SSTables. Each rewrite the data K times (one per level).
- WA = number of compaction passes × size per pass.

**Trade**: LSM-trees give better **write throughput** at the cost of higher **WA + read amplification**. B-trees give lower WA but worse random-write throughput.

## visualization
```
B-tree:
  app writes 100B row → WAL append (100B) + page rewrite (8KB) on next flush
  WA = (100 + 8000) / 100 = 81  (worst case; coalesces 80 rows into one page → WA ~ 1.1)

LSM-tree (leveled compaction, 6 levels, fanout 10):
  app writes 100B row → WAL + memtable insert
  Memtable flushes to level-0 (write #1)
  Level-0 compacts into level-1 (write #2)
  ... level-1 → level-2 ... → level-5 (write #6)
  WA per row = ~6× the row size (per-level multiplier).
  Actual WA in production: 10–30 due to overlapping compactions, rewrites, tombstones.

Read amplification trade-off:
  B-tree read = 1-3 page reads (root → leaf)
  LSM-tree read = up to N levels × bloom filter check + 1 SSTable read per level
                = 6+ disk reads worst case
```

## bruteForce
**Don't measure WA**: classic failure. Production system "feels slow on writes," cloud bill spikes, no one knows why.

**Avoid LSM trees entirely**: lose the write-throughput advantage for write-heavy workloads (time-series, log aggregation, ad analytics).

**Brute-force avoid compaction**: SSTables pile up; reads slow exponentially; eventually OOM.

## optimal
**Pick the right engine**:
- **Read-heavy, low write**: B-tree (Postgres, MySQL InnoDB). Low WA, fast point reads.
- **Write-heavy, sequential-ish**: LSM-tree (RocksDB, Cassandra). High write throughput, high WA.
- **Append-only**: log-structured storage with no compaction (Kafka). WA = 1.
- **Time-series**: specialized LSM tuning (compression, time-window-based compaction).

**Reduce LSM WA**:
- **Tiered compaction** instead of leveled — fewer rewrites at cost of more disk space.
- **Universal compaction** (Cassandra default) — opportunistic merging.
- **Larger levels** (fanout 12-15 instead of 10) reduce total levels at cost of read amp.
- **Compression** (Snappy, ZSTD) reduces bytes written.
- **Smaller memtables** flush more often but compact less per flush — sometimes a wash.

**Reduce B-tree WA**:
- **Larger checkpoint interval** coalesces more updates per page flush.
- **Smaller pages** (rare; default 8K is usually optimal).
- **Index-only writes** (no row rewrites) for append-only datasets.

**Measure WA in production**:
- RocksDB: `LSM-tree compaction-stats`, `Compaction Read/Write Bytes`.
- InnoDB: `innodb_buffer_pool_writes` ÷ logical writes.
- Cloud: provider-specific IOPS metrics.

## complexity
- **B-tree WA**: 1.1× to 5× typical, can spike to 20× under random small writes.
- **LSM-tree WA**: 10× to 30× typical for leveled compaction.
- **Read amp**: LSM-tree 3-10× worse than B-tree on point reads (mitigated by bloom filters).

## pitfalls
- **Not measuring WA at all.** Teams discover the issue only when SSDs fail or cloud bills spike. Fix: emit per-engine WA metric to your monitoring; alert if WA > 2× the engine's expected baseline.
- **Treating LSM-tree as drop-in replacement for B-tree.** Read latency and tail latency change materially — applications expecting B-tree-like point-read latency hit p99 cliffs. Fix: load-test the actual workload; tune bloom filters and block cache; budget for 5-10× higher read amp.
- **Compaction too aggressive.** Default compaction can saturate disk during peak write hours. Fix: rate-limit compaction (`rate_limiter_bytes_per_sec`); compact off-peak; consider tiered compaction for spiky workloads.
- **Compaction too lazy.** Letting SSTables accumulate inflates read amp until OOM. Fix: monitor SSTable count per level; alert if Level-0 has >4 files (RocksDB default trigger).
- **Ignoring delete cost.** Deletes in LSM-tree create tombstones that must traverse all levels — high write amp. Fix: use TTL-based expiry where possible; configure aggressive tombstone removal during compaction.
- **WAL on the same disk as data.** WAL writes serialize with data writes, halving throughput. Fix: separate WAL disk OR use NVMe with deep queues.

## interviewTips
- For "why is your write throughput slow" → check write amplification.
- Cite **DDIA chapter on storage engines** (Kleppmann) as the authoritative reference.
- For senior interviews, discuss **compaction tuning trade-offs** (leveled vs tiered vs universal), **TTL-based partitioning** for time-series, **separate WAL volume**, **Z-order curves** for spatial data.

## code.python
```python
# Example: measure RocksDB write amp programmatically
import rocksdb
opts = rocksdb.Options(create_if_missing=True)
db = rocksdb.DB('/tmp/db', opts)

# After workload, query stats
stats = db.get_property(b'rocksdb.stats')
# Parse "Sum:" line; "Compaction Read/Write Bytes" gives total compaction IO
# WA = (logical_bytes_written + compaction_write_bytes) / logical_bytes_written
```

## code.javascript
```javascript
// Conceptual sketch — most languages access RocksDB via FFI or sidecar
// Node.js: use rocksdb npm package
const { Level } = require('level');
const db = new Level('/tmp/db');
// LevelDB compaction stats not directly exposed; use rocksdb's getProperty
```

## code.java
```java
// RocksDB JNI
import org.rocksdb.*;
RocksDB.loadLibrary();
try (Options opts = new Options().setCreateIfMissing(true);
     RocksDB db = RocksDB.open(opts, "/tmp/db")) {
    String stats = db.getProperty("rocksdb.compaction-stats");
    // Parse stats; compute WA = total_writes / logical_writes
}
```

## code.cpp
```cpp
// RocksDB native
#include "rocksdb/db.h"
rocksdb::DB* db;
rocksdb::Options options;
options.create_if_missing = true;
rocksdb::DB::Open(options, "/tmp/db", &db);

std::string stats;
db->GetProperty("rocksdb.compaction-stats", &stats);
// Parse stats; compute WA from compaction read/write byte totals.
```
