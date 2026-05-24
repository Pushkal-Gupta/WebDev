---
slug: lsm-tree
module: system-design
title: LSM Tree (Log-Structured Merge)
subtitle: Write-optimized index — in-memory MemTable + immutable on-disk SSTables + background compaction. Powers LevelDB / RocksDB / Cassandra.
difficulty: Advanced
position: 21
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Persistence chapters (storage + filesystems)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "High Scalability — LSM tree primer"
    url: "http://highscalability.com/blog/category/lsm"
    type: blog
  - title: "facebook/rocksdb — production LSM implementation"
    url: "https://github.com/facebook/rocksdb"
    type: repo
status: published
---

## intro
An **LSM (Log-Structured Merge) tree** is a write-optimized storage engine. Writes hit an in-memory sorted structure (the **MemTable**); when it fills, it's flushed to disk as an immutable **SSTable** (Sorted String Table). Reads check the MemTable first, then progressively older SSTables. Background **compaction** merges and shrinks SSTables to keep reads fast and disk usage bounded. Trades read amplification for huge write throughput.

## whyItMatters
LSM is the storage layer for the modern write-heavy world:
- **LevelDB / RocksDB** (Facebook) — embedded KV engines.
- **Cassandra / ScyllaDB** — wide-column distributed databases.
- **InfluxDB** — time-series.
- **MongoDB WiredTiger** (alternative engine).
- **TiKV / CockroachDB** — distributed SQL.

Compared to a B-tree (which mutates pages in place), LSM batches writes sequentially → orders-of-magnitude faster writes on spinning + SSD disks (no random writes).

## intuition
Three layers:
1. **MemTable** — a sorted in-memory structure (skip list / red-black tree). Writes go here, O(log n).
2. **Immutable MemTable** — when MemTable hits size threshold, it's frozen; a new MemTable takes new writes; the frozen one is flushed to disk as a Level-0 SSTable.
3. **SSTables on disk** — immutable sorted runs. Organized into **levels**; higher levels are larger and older. Background compaction merges adjacent levels.

**Writes**: O(1) amortized (append to MemTable + WAL).

**Reads**: check MemTable → check immutable MemTable → check L0 SSTables → check L1 → ... → check Ln. Each level has Bloom filters to skip SSTables that definitely don't contain the key. Read cost = O(levels × log SSTable size).

## visualization
```
Write path:
  PUT(k=42, v="hello")
       │
       ▼
  ┌──────────────┐         ┌──────────────┐
  │   MemTable   │   ───▶  │   WAL (disk) │   (durability before MemTable insert)
  │ (sorted, RAM)│         └──────────────┘
  └──────────────┘
         │ MemTable fills (e.g. 64MB)
         ▼ flush
  ┌──────────────────────────────┐
  │ Level 0 SSTables (overlapping)│  ← multiple flushes pile here
  └──────────────────────────────┘
         │ compaction
         ▼
  ┌──────────────────────────────┐
  │ Level 1 SSTables (non-overlap)│  ← merged + de-duped + sorted by key range
  └──────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────┐
  │ Level N SSTables              │  ← exponentially larger; oldest data
  └──────────────────────────────┘

Read path for k=42:
  Check MemTable → miss
  Check Immutable MemTable → miss
  Check L0 (Bloom filter says maybe) → check L0_SST_3 → miss
                                       check L0_SST_2 → found! return.
  (Bloom skips L0_SST_1 entirely.)
```

## bruteForce
**B-tree** mutating pages in place: high write amplification (random I/O), great for read-heavy workloads. LSM beats it on write throughput at the cost of read amplification.

**Append-only log without compaction**: O(n) reads as the log grows. Compaction is what makes LSM viable.

## optimal
**MemTable**: skip list (RocksDB) or red-black tree. O(log n) writes + ordered iteration for flush.

**SSTable**: a sorted file of `(key, value)` pairs + a sparse index (one entry per N KB block) + a Bloom filter (~10 bits per key → ~1% false-positive rate) + metadata footer. Lookup: Bloom check → if maybe-present, binary-search the index → seek block → linear-scan.

**WAL (Write-Ahead Log)**: before insert into MemTable, append the operation to a sequential log file. On crash, replay WAL since last MemTable flush to recover.

**Compaction strategies**:
- **Size-tiered** (Cassandra default): when N SSTables of similar size pile up at a level, merge them into one big SSTable at the next level.
- **Leveled** (RocksDB default): each level has a target size; non-overlapping SSTables at each level; merges keep that invariant.
- **Universal**: hybrid.

Compaction trades CPU + I/O bandwidth NOW for cheaper reads LATER. Tunable per workload.

## complexity
- **Write**: O(log MemTable) + sequential WAL append. Amortized O(1) per insert across batches.
- **Read**: O(L · log SSTable) where L = number of levels (~5-7 typical). Bloom filters cut most level-checks to O(1).
- **Compaction throughput**: ~50-200 MB/s on SSD; dominates background I/O.
- **Space amplification**: 1.5×-2× during compaction (old + new SSTables coexist temporarily).

## pitfalls
- **Read amplification**: a key not in the MemTable may need to check every level → use Bloom filters aggressively.
- **Write stalls during compaction**: if writes outpace compaction, MemTables back up → write stalls. RocksDB exposes tunables (`max_background_compactions`, `level0_slowdown_writes_trigger`).
- **Tombstones for deletes**: deletes write a tombstone marker; the actual delete happens at compaction. If compaction lags, deleted data stays around.
- **Range scans across many SSTables**: each level's SSTables must be iterated. K-way merge across L levels.
- **Bloom filter false positives**: ~1% with 10 bits/key. For 1B keys, 10M false positives → still need to check the SSTable. Tune bits-per-key per workload.

## interviewTips
- For "design a write-heavy KV store" — LSM tree.
- For "design a read-heavy index" — B-tree.
- Mention **WAL + MemTable + immutable SSTables + Bloom + compaction** as the 5 pieces.
- For senior interviews, discuss **compaction strategy tradeoffs** (size-tiered vs leveled), **read amplification** vs **write amplification** vs **space amplification** (the RUM conjecture: pick 2 of 3).

## code.python
```python
# Sketch — a minimal LSM in pure Python.
import bisect, heapq, time
class MemTable:
    def __init__(self, max_size=1000):
        self.data = []  # list of (key, value), kept sorted
        self.max_size = max_size
    def put(self, k, v):
        i = bisect.bisect_left([x[0] for x in self.data], k)
        if i < len(self.data) and self.data[i][0] == k:
            self.data[i] = (k, v)
        else:
            self.data.insert(i, (k, v))
    def get(self, k):
        i = bisect.bisect_left([x[0] for x in self.data], k)
        if i < len(self.data) and self.data[i][0] == k:
            return self.data[i][1]
        return None
    def full(self): return len(self.data) >= self.max_size

class LSM:
    def __init__(self):
        self.memtable = MemTable()
        self.sstables = []  # list of sorted (key, value) lists, newest first
    def put(self, k, v):
        self.memtable.put(k, v)
        if self.memtable.full():
            self.sstables.insert(0, list(self.memtable.data))
            self.memtable = MemTable()
    def get(self, k):
        v = self.memtable.get(k)
        if v is not None: return v
        for sst in self.sstables:
            i = bisect.bisect_left([x[0] for x in sst], k)
            if i < len(sst) and sst[i][0] == k: return sst[i][1]
        return None
```

## code.javascript
```javascript
// Same shape; use a sorted-set library or skiplist for MemTable.
// For production, see facebook/rocksdb's Node.js binding.
```

## code.java
```java
// Production: use RocksDBJNI bindings.
// import org.rocksdb.RocksDB;
// RocksDB db = RocksDB.open("path");
// db.put("key".getBytes(), "value".getBytes());
```

## code.cpp
```cpp
// Production: include rocksdb/db.h
// rocksdb::DB::Open(options, "path", &db);
// db->Put(rocksdb::WriteOptions(), "key", "value");
```
