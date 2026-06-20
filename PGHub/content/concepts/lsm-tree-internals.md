---
slug: lsm-tree-internals
module: sd-storage
title: LSM Tree Internals
subtitle: Memtable structures, SSTable layout, bloom-filter math, and the compaction tradeoffs that decide RocksDB vs Cassandra.
difficulty: Advanced
position: 220
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "RocksDB Wiki — Compaction strategies (leveled, tiered, FIFO)"
    url: "https://github.com/facebook/rocksdb/wiki/Compaction"
    type: repo
  - title: "RocksDB Wiki — MemTable (skiplist, hash variants, flush triggers)"
    url: "https://github.com/facebook/rocksdb/wiki/Memtable"
    type: repo
  - title: "Wikipedia — Bloom filter (false-positive math, bits-per-key)"
    url: "https://en.wikipedia.org/wiki/Bloom_filter"
    type: blog
status: published
---

## intro
The `lsm-tree` concept covers the three-layer mental model. This page goes one floor deeper — what actually lives inside the memtable, what an SSTable file looks like byte-by-byte, how bloom filters are tuned against false-positive rate, and why size-tiered and leveled compaction produce wildly different write/read/space amplification curves. Read this after the overview; it's the level of detail an interviewer asks about when they want to know if you've shipped one.

## whyItMatters
Picking the wrong compaction strategy is the difference between a database that survives a 10x write spike and one that grinds to a halt. Cassandra's size-tiered default eats 2x the disk during compaction and serves range scans through many overlapping SSTables. RocksDB's leveled default keeps disk usage tight and reads fast at the cost of 10-30x write amplification. Bloom-filter sizing is the same kind of decision — 10 bits per key gives ~1% false-positive rate; halving that doubles the SSTable lookups your "fast path" misses. Every senior infrastructure interview that touches Kafka, Cassandra, ScyllaDB, RocksDB, CockroachDB, or TiKV lands on these tradeoffs.

## intuition
Start with the memtable. RocksDB's default is a lock-free skiplist — O(log n) inserts, lock-free reads, ordered iteration for flush. The skiplist beats a red-black tree here because concurrent writers don't fight over rotation locks. Cassandra uses a concurrent skiplist for the same reason. There are alternates: hash-skiplist and hash-linked-list variants give O(1) point lookups when the workload is "write a key, read it back immediately," but break ordered iteration so they only work when you flush in arbitrary order.

When the memtable hits its size threshold (RocksDB default: 64 MB), it's marked immutable, a fresh memtable accepts new writes, and a background thread flushes the immutable one to disk as a Level-0 SSTable. The flush is the only sequential write the foreground sees on a healthy LSM. Everything else — compaction, bloom-filter rebuilds, index updates — runs in background threads.

An SSTable on disk is not just a sorted file. It's six regions: data blocks (sorted key-value pairs, compressed), index block (one entry per data block giving the largest key + block offset), filter block (the bloom filter), metaindex block, footer, and an optional restart-point index inside each data block for binary search within the block. Lookup walks footer → metaindex → index → filter → data block. Five reads in the worst case, four when bloom skips the data read entirely.

Compaction is the engine that keeps reads fast. Without it, every write produces a new SSTable and reads degrade to O(SSTable count). With it, SSTables are merged into larger, fewer, non-overlapping runs. The choice between strategies is the same RUM-conjecture pick: you can optimize for read, update, or memory — never all three.

## visualization
```
SSTable file layout (RocksDB BlockBasedTable):

  +------------------+
  | Data Block 0     |   <- sorted KVs, compressed (snappy/lz4)
  |  restart[0..N]   |   <- offsets for binary search inside the block
  +------------------+
  | Data Block 1     |
  +------------------+
  | ...              |
  +------------------+
  | Filter Block     |   <- bloom filter for all keys in this SSTable
  +------------------+
  | Index Block      |   <- (last_key_of_block, block_offset) per data block
  +------------------+
  | Metaindex Block  |   <- offsets of filter + index blocks
  +------------------+
  | Footer (53B)     |   <- magic + handle to metaindex + handle to index
  +------------------+

Leveled compaction (RocksDB default):

  L0:  [SST1] [SST2] [SST3] [SST4]     <- may overlap; flushed from memtable
        \____________________/
                     |  compaction picks one L0 SST + all overlapping L1
                     v
  L1:  [---a..f---] [---g..m---] [---n..z---]    <- non-overlapping, ~10x L0
  L2:  [a..b][b..d][d..f]...                     <- non-overlapping, ~10x L1
  L3:  ...

Size-tiered (Cassandra default):

  When N similar-size SSTables exist at a tier, merge them into ONE
  bigger SSTable at the next tier. Tiers overlap. Range scans must read
  every tier. Compaction takes 2x disk during the merge.
```

## bruteForce
The naive LSM: flush memtables, never compact. Reads degrade to O(N) over the SSTable list; bloom filters reduce constant factors but you still touch metadata for every SSTable. Disk fills with stale versions and tombstones. Useful for write-only logs (Kafka segments before retention kicks in) but not for a KV store with reads.

## optimal
The full design has six moving parts and each has knobs.

**Memtable**: lock-free skiplist for general workloads; hash-skiplist when you know all reads are point lookups and writes are monotonically increasing. Size threshold (`write_buffer_size`) controls flush cadence. Too small → many tiny L0 SSTables → read amplification. Too large → long flushes → write stalls. Production starts at 64 MB.

**WAL coupling**: every memtable insert appends to the WAL first. On crash, replay WAL since the last flush. WAL size also triggers flush (`max_total_wal_size`) so recovery time stays bounded.

**Bloom filter math**: for `n` keys with `m` filter bits using `k` hash functions, false-positive rate is approximately `(1 - e^(-kn/m))^k`. Optimal `k = (m/n) ln 2`. With 10 bits per key, optimal `k=7`, gives ~0.82% FP rate. With 15 bits per key, ~0.046%. With 20 bits, ~0.0036%. Memory cost: 10 bits × 1 billion keys = 1.25 GB. Pay it; the cache hit rate it buys is worth more than the RAM.

**SSTable index**: sparse — one entry per data block (4-32 KB). Lookup: binary-search the index to find the right block, decompress block, binary-search restart points, linear-scan within the restart range. Total: ~3 cache misses + 1 disk read (or 0 if block is in OS page cache).

**Leveled compaction (RocksDB)**: Level i has target size `10^i × base`. Each level (except L0) holds non-overlapping SSTables. To compact: pick one SSTable from level i, find all overlapping SSTables in level i+1, merge them, write to level i+1. Write amplification: ~10 per level, ~50-70 total (5-7 levels). Read amplification: log(N) levels × O(1) bloom check. Space amplification: ~1.1x (only one level holds duplicates during compaction).

**Size-tiered compaction (Cassandra)**: when N (default 4) SSTables of similar size exist, merge them into one bigger SSTable. No level invariants. Write amplification: ~log(total_size / memtable_size) → low. Read amplification: high (range scans cross many tiers). Space amplification: ~2x during the merge (old + new files coexist).

**Tombstones**: deletes write a marker `(key, tombstone, timestamp)`. Compaction drops a tombstone only when no older SSTable could still contain a live version. The `gc_grace_seconds` window in Cassandra exists because in a distributed setup, you cannot drop a tombstone until every replica has seen it — otherwise a delete on a partitioned node would resurrect when the partition heals.

**Universal compaction (RocksDB option)**: hybrid — bounded space amplification (configurable), bounded read amplification (cap on SSTable count), lower write amplification than leveled. Good for time-series workloads where old data is rarely read.

The line for an interview: "Memtable is a skiplist; flushes produce Level-0 SSTables; compaction strategy decides the read/write/space tradeoff; bloom filters at 10 bits per key make reads fast enough to ignore most SSTables."

## complexity
Write: O(log memtable) + O(1) WAL append, amortized O(1) once batched. Background compaction adds write amplification `W` where W = 50-70 for leveled, ~log(N) for size-tiered.
Read: O(L) bloom checks + O(log B) within-block search, where L = level count (typically 5-7) and B = block size. With bloom hits at 99%+, average read is one block fetch.
Space: leveled ~1.1x, tiered ~2x during compaction, universal tunable.
Bloom: false-positive rate ≈ `(1 - e^(-kn/m))^k`; optimal k = (m/n) ln 2. Standard 10 bits/key → ~1% FP, optimal k=7.

## pitfalls
- **Bloom-filter sizing chosen by vibes.** 10 bits/key is a starting point, not gospel. If reads dominate and disk is precious, bump to 15-20 bits — every SSTable skipped saves a read amplification factor. Cassandra's default is configurable per-table via `bloom_filter_fp_chance`.
- **L0 file pileup causes write stalls.** RocksDB's `level0_slowdown_writes_trigger` (default 20) starts throttling writes when L0 grows; `level0_stop_writes_trigger` (default 36) halts them entirely. Tune `max_background_compactions` upward on multi-core boxes.
- **Compaction starvation on rotational disks.** Leveled compaction does mostly random I/O (reading from level i, writing to level i+1). On spinning disks this can saturate IOPS. Either move to SSD or switch to universal/tiered to reduce I/O volume.
- **Tombstone scan amplification.** A range scan over a key range with many deletes processes every tombstone before returning the live versions. Cassandra's `tombstone_warn_threshold` exists to catch this; the fix is shorter `gc_grace_seconds` or partition layout that isolates churn.
- **Wide-column write amplification on leveled.** A workload that updates every row every hour cascades through every level. Leveled rewrites the same data 5-7 times. Switch to size-tiered or universal if write volume dominates.

## interviewTips
- For "design a write-heavy KV store" — lead with "LSM, memtable + WAL + SSTables + leveled compaction, bloom filters at 10 bits per key."
- When the interviewer asks "what's the read amplification?" — answer "log L levels × O(1) bloom check; ~99% of bloom checks skip the SSTable, so average read is one block fetch."
- For senior-level depth: name the RUM conjecture and pick two of (Read amp, Update amp, Memory amp) — leveled picks Read+Memory, tiered picks Update+Read, universal is the tunable middle.

## code.python
```python
# Minimal LSM with bloom filter + leveled compaction sketch.
import bisect, hashlib, struct
from dataclasses import dataclass, field

class Bloom:
    def __init__(self, n_keys, bits_per_key=10):
        self.m = n_keys * bits_per_key
        self.k = max(1, int(0.7 * bits_per_key))   # ~ (m/n) ln 2
        self.bits = bytearray((self.m + 7) // 8)
    def _h(self, key, seed):
        h = hashlib.blake2b(key + struct.pack('I', seed), digest_size=8).digest()
        return int.from_bytes(h, 'little') % self.m
    def add(self, key):
        for i in range(self.k):
            p = self._h(key, i); self.bits[p >> 3] |= (1 << (p & 7))
    def maybe_contains(self, key):
        for i in range(self.k):
            p = self._h(key, i)
            if not (self.bits[p >> 3] & (1 << (p & 7))): return False
        return True

@dataclass
class SSTable:
    data: list                  # sorted [(key, value)]
    bloom: Bloom
    level: int = 0
    def get(self, k):
        if not self.bloom.maybe_contains(k.encode()): return None  # fast skip
        i = bisect.bisect_left([x[0] for x in self.data], k)
        if i < len(self.data) and self.data[i][0] == k: return self.data[i][1]
        return None

class LSM:
    def __init__(self, memtable_max=1024, level_mult=10):
        self.memtable = {}
        self.memtable_max = memtable_max
        self.levels = [[] for _ in range(7)]
        self.level_mult = level_mult
    def put(self, k, v):
        self.memtable[k] = v
        if len(self.memtable) >= self.memtable_max: self._flush()
    def get(self, k):
        if k in self.memtable: return self.memtable[k]
        for level in self.levels:
            for sst in level:
                v = sst.get(k)
                if v is not None: return v
        return None
    def _flush(self):
        data = sorted(self.memtable.items())
        bloom = Bloom(len(data), 10)
        for kk, _ in data: bloom.add(kk.encode())
        self.levels[0].append(SSTable(data=data, bloom=bloom, level=0))
        self.memtable = {}
        self._maybe_compact()
    def _maybe_compact(self):
        for i, level in enumerate(self.levels[:-1]):
            target = self.memtable_max * (self.level_mult ** i)
            if sum(len(s.data) for s in level) > target:
                merged = sorted({k: v for s in level for k, v in s.data}.items())
                bloom = Bloom(len(merged), 10)
                for kk, _ in merged: bloom.add(kk.encode())
                self.levels[i+1].append(SSTable(data=merged, bloom=bloom, level=i+1))
                self.levels[i] = []
```

## code.javascript
```javascript
// Sketch — see facebook/rocksdb's Node bindings for production.
class Bloom {
  constructor(n, bitsPerKey = 10) {
    this.m = n * bitsPerKey;
    this.k = Math.max(1, Math.round(0.7 * bitsPerKey));
    this.bits = new Uint8Array(Math.ceil(this.m / 8));
  }
  _h(key, seed) {
    let h = 2166136261 ^ seed;
    for (const c of key) { h = Math.imul(h ^ c.charCodeAt(0), 16777619); }
    return (h >>> 0) % this.m;
  }
  add(k) { for (let i = 0; i < this.k; i++) { const p = this._h(k, i); this.bits[p >> 3] |= 1 << (p & 7); } }
  maybeContains(k) {
    for (let i = 0; i < this.k; i++) {
      const p = this._h(k, i);
      if (!(this.bits[p >> 3] & (1 << (p & 7)))) return false;
    }
    return true;
  }
}
```

## code.java
```java
// Production: use org.rocksdb:rocksdbjni with leveled compaction options.
// Options opts = new Options().setCreateIfMissing(true)
//   .setCompactionStyle(CompactionStyle.LEVEL)
//   .setLevel0SlowdownWritesTrigger(20)
//   .setMaxBackgroundCompactions(4);
// RocksDB db = RocksDB.open(opts, "/data/lsm");
```

## code.cpp
```cpp
// Production: include <rocksdb/db.h>, configure BlockBasedTableOptions with
// filter_policy = NewBloomFilterPolicy(10, false) for 10 bits/key.
// rocksdb::DB* db; rocksdb::Options opts;
// opts.compaction_style = rocksdb::kCompactionStyleLevel;
// opts.level0_slowdown_writes_trigger = 20;
// rocksdb::DB::Open(opts, "/data/lsm", &db);
```
