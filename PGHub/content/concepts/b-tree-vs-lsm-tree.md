---
slug: b-tree-vs-lsm-tree
module: sd-storage
title: B-Tree vs LSM Tree
subtitle: The two reigning on-disk index families — in-place update with read-locality versus append-only writes with background compaction. Choose by read/write ratio.
difficulty: Advanced
position: 34
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "PostgreSQL Documentation — B-Tree index access method"
    url: "https://www.postgresql.org/docs/current/btree.html"
    type: docs
  - title: "facebook/rocksdb — Leveled Compaction wiki"
    url: "https://github.com/facebook/rocksdb/wiki/Leveled-Compaction"
    type: docs
  - title: "Cockroach Labs — Introducing Pebble: A RocksDB-inspired key-value store"
    url: "https://www.cockroachlabs.com/blog/pebble-rocksdb-kv-store/"
    type: blog
status: published
---

## intro
B-trees and LSM-trees are the two dominant on-disk index families in production databases. A B-tree keeps a balanced, in-place tree where each node maps to a disk page; reads walk root-to-leaf, writes overwrite the target page after a write-ahead log entry. An LSM-tree buffers writes in an in-memory sorted structure (the MemTable), flushes it to immutable on-disk SSTables, and merges old SSTables in the background (compaction). B-trees optimise for point reads and small in-place updates; LSM-trees optimise for high write throughput and sequential I/O. Picking between them is a workload-driven choice, not a religious one.

## whyItMatters
Almost every modern database is one or the other. Postgres, MySQL/InnoDB, SQLite, and most NewSQL row stores use B+ trees (or close variants). LevelDB, RocksDB, Cassandra, ScyllaDB, HBase, and Apache Kafka's compacted topics use LSM trees. CockroachDB and TiDB sit on top of LSM engines (Pebble and TiKV respectively) and present SQL on top of an LSM-organised KV. The choice cascades through every operational property: write amplification, read amplification, space amplification, latency variance, compaction load, backup format. Understanding the trade-off is the difference between "we picked Postgres because it's familiar" and "we picked Postgres because our read-write ratio is 100:1 and we need stable p99 read latency on a hot working set". Get this wrong and you spend two years rewriting your storage layer.

## intuition
The reason there are two families and not one is that on-disk storage has three competing amplification metrics, and no single design minimises all three. Write amplification = bytes written to disk per byte of logical user data — B-trees pay it because a small update can dirty a whole page (typically 8KB) and the page-split path can cascade. Read amplification = pages read per logical lookup — LSM-trees pay it because a single key lookup may probe the MemTable plus several SSTable levels before finding the value. Space amplification = disk bytes per logical byte — LSM-trees pay it during compaction (multiple copies of the same key sit on disk until the compactor catches up). B-trees are write-amplification-heavy and read-amplification-light; LSM-trees are the opposite. The B-tree's design centres on a single core operation: traverse a fanout-of-~500 balanced tree, hold the target leaf page in memory, mutate in place. A 1-billion-row table sits in a tree about 4 levels deep — at most four disk seeks, often one or zero when the upper levels are cached. Writes are slow in the average case because a single insert that splits a leaf can propagate up and rewrite the parent and grandparent; in the worst case, this is what burns SSD endurance on write-heavy workloads. The LSM-tree reframes the problem as "buffer writes in RAM, never overwrite on disk, sort and merge in the background". The MemTable is typically a skip-list or red-black tree taking a few MB. When full, it's frozen and flushed as an immutable, sorted SSTable to disk — purely sequential write, fastest possible on both SSD and spinning rust. Reads consult the MemTable, then probe SSTables in newest-to-oldest order (a key may exist in multiple SSTables as updates accumulate). To bound the probe cost, every SSTable carries a Bloom filter so a non-match short-circuits without reading the file. Compaction is the background process that merges multiple SSTables into fewer, larger SSTables, dropping obsolete versions and tombstones — this is what keeps read amplification bounded. Two compaction strategies dominate: size-tiered compaction (group SSTables of similar size, merge when N accumulate at a level — used by Cassandra by default, good for write throughput but high space amplification) and leveled compaction (each level holds 10× the data of the previous, every SSTable at level L overlaps with up to 10 at level L+1 during merge — used by RocksDB and LevelDB, lower space amplification but higher write amplification). The choice between B-tree and LSM is really a choice along three axes: how often you write versus read, how much space amplification you can tolerate, and how strict your read-latency p99 must be. LSM-trees give better median write latency and worse p99 read latency (you might get a compaction stall); B-trees give predictable read latency and worse write throughput. Modern systems hedge: WiredTiger (MongoDB's default) and Pebble both support hybrid modes; Postgres has been experimenting with LSM-style hot/cold tiering for years.

## visualization
```
B-Tree (in-place update, balanced, page-oriented)
                [42 | 73]
               /    |    \
        [10|25] [50|60] [85|95]
        /  | \   /  | \   /  | \
      leaves with sorted records, each leaf = one disk page
   write: traverse to leaf, mutate page, fsync WAL
   read : traverse root->leaf, often 1-3 disk reads

LSM-Tree (append-only writes, background compaction)
   RAM:  [MemTable: sorted skip-list]
                |
                v  (flush when full)
   L0:   [SST_3] [SST_2] [SST_1]   <- newest at top, may overlap key ranges
   L1:   [SST_a ... SST_e]         <- non-overlapping, ~10x size of L0
   L2:   [SST_A ... SST_E]         <- non-overlapping, ~10x size of L1
   ...
   write: append to WAL + insert into MemTable (no disk seek)
   read : check MemTable, then each level with bloom filter gating
   compaction: merge L_k SSTables into L_{k+1}, drop tombstones + obsolete keys
```

## bruteForce
"Use a sorted array on disk." Lookups via binary search are O(log n), but every insert is O(n) — you cannot afford it past a few MB. Or "use a hash table on disk" — O(1) lookups in theory, but no range scans, terrible cache behaviour on collisions, and growing the table requires a full rehash and rewrite. Both fail at production scale; the B-tree and LSM-tree exist because the naive structures don't survive contact with persistent storage.

## optimal
Pick B-tree when: read-heavy workload (ratio > 5:1 reads:writes), small working set fits in buffer cache, predictable p99 read latency matters more than write throughput, you need range scans on the primary key, or you're using a database that only offers one option (Postgres, MySQL). Pick LSM-tree when: write-heavy workload (writes ≥ 30% of total ops), high ingest rates (logs, metrics, IoT), large datasets that don't fit in RAM, you can tolerate occasional compaction-induced p99 latency spikes, and you want best-in-class disk space efficiency via compression (LSM SSTables compress better than B-tree pages because they're sequential and bulk-written). Operational defaults: RocksDB / LevelDB / Pebble for embedded KV; Cassandra / ScyllaDB for distributed wide-column with high write rate; Postgres / MySQL for general OLTP; ClickHouse uses an LSM-shaped MergeTree for analytics. The Bloom filter in front of LSM SSTables turns read amplification from "probe every level" into "probe only levels that might contain the key" — typically reducing logical I/O by 10-100×. Compaction tuning matters: leveled compaction keeps space amplification near 1.1× but adds write amplification; size-tiered compaction keeps write amplification low but lets space balloon to 2-3× during merges. RocksDB exposes both; production tuning means watching both metrics and adjusting `level0_file_num_compaction_trigger` and `max_bytes_for_level_multiplier`. The deep answer to "B-tree or LSM" is: measure your read/write ratio, working-set size, and latency tolerance, then pick the structure whose amplification profile matches your bottleneck.

```python
# Simplified LSM skeleton: MemTable + flush + naive size-tiered compaction.
from sortedcontainers import SortedDict
import itertools

class LSM:
    MEMTABLE_LIMIT = 1024  # entries before flush

    def __init__(self) -> None:
        self.memtable = SortedDict()
        self.sstables = []           # newest first; each is a sorted list of (k, v_or_tombstone)
        self._id = itertools.count()

    def put(self, k, v):
        self.memtable[k] = v
        if len(self.memtable) >= self.MEMTABLE_LIMIT:
            self._flush()

    def delete(self, k):
        self.put(k, None)            # tombstone

    def get(self, k):
        if k in self.memtable: return self.memtable[k]
        for sst in self.sstables:    # newest -> oldest
            for kk, vv in sst:
                if kk == k: return vv
        return None

    def _flush(self):
        sst = sorted(self.memtable.items())
        self.sstables.insert(0, sst)
        self.memtable.clear()
        if len(self.sstables) >= 4:
            self._compact()

    def _compact(self):
        merged = {}
        for sst in reversed(self.sstables):     # oldest first so newer wins
            for k, v in sst:
                merged[k] = v
        compacted = [(k, v) for k, v in sorted(merged.items()) if v is not None]
        self.sstables = [compacted]
```

## complexity
- B-tree point read: O(log_f n) page fetches, f = fanout (~500). 1-billion-row table = ~4 disk reads worst case, often 1 with buffer cache.
- B-tree point write: O(log_f n) for the traversal, plus amortised page-split cost; write amplification typically 5-20× user bytes due to whole-page dirtying.
- LSM point read: O(L) levels × O(log entries-per-SST), with Bloom filter pruning typically reducing to 1-2 SSTable probes per lookup.
- LSM point write: O(log MemTable size) to insert, sequential append to WAL. Write amplification depends on compaction: 10-30× for leveled, 3-5× for size-tiered, at the cost of 2-3× space amplification.
- LSM range scan: O(L) merge iterators in lockstep; B-tree range scan is O(1) seek + sequential page reads — B-tree wins for big ranges.

## pitfalls
- **Treating "LSM = always faster writes" as universal.** LSM wins for sustained high-write workloads. For bursty writes that fit in a Postgres `shared_buffers` window followed by reads, B-tree is faster end-to-end because there's no compaction overhead. Fix: benchmark your actual workload; don't pick the structure on lore.
- **Ignoring compaction load.** A poorly tuned LSM cluster spends 30-50% of disk I/O on compaction. Production systems need monitoring on compaction queue depth and `pending_compaction_bytes`; a stuck compactor leads to read amplification growth and eventually write stalls. Fix: alarm on compaction pending bytes; tune the level multiplier and thread count.
- **Forgetting tombstone GC.** LSM deletes write tombstones; the data is only physically removed when a compaction sweeps the relevant level. A high-churn workload with sparse compaction accumulates tombstones, slowing reads (every read still scans them) and bloating disk. Cassandra has a notorious "tombstone hell" failure mode for time-series data using TTL-based deletes. Fix: use TTL-aware compaction strategies (TWCS in Cassandra) and tune `gc_grace_seconds`.
- **Mismatching the working-set size to the engine.** B-trees with a working set larger than buffer cache thrash — every read goes to disk because the upper levels can't stay cached. LSM with a working set that fits in MemTable might never flush — wasting RAM. Fix: size your buffer cache (or MemTable) to hold the hot data; instrument cache hit ratio and adjust.
- **Picking the engine without measuring p99 read latency.** LSM can spike p99 by 10× during compaction even when p50 is excellent. If your SLO is "p99 < 10ms" and you ship an LSM under heavy compaction load, the user sees the spike. Fix: shadow-traffic the LSM under production-equivalent compaction load and measure p99/p99.9 before committing.

## interviewTips
- **Lead with the three amplification metrics.** Write, read, and space amplification are the vocabulary the interviewer is testing for; framing the comparison in their terms shows real systems literacy.
- **Name production systems on each side.** "Postgres and InnoDB use B-trees, RocksDB and Cassandra use LSM, MongoDB's WiredTiger gives you both" is the headline answer; specifics signal hands-on familiarity.
- **Volunteer the Bloom-filter optimisation for LSM reads and the page-split cost for B-trees.** These are the two details that separate "I read the Kleppmann chapter" from "I've operated one in production".

## code
### python
```python
from sortedcontainers import SortedDict
import itertools

class LSMEngine:
    MEMTABLE_LIMIT = 1024
    SST_COMPACT_THRESHOLD = 4

    def __init__(self) -> None:
        self.memtable = SortedDict()
        self.sstables = []           # each: list of (k, v_or_None_for_tombstone)

    def put(self, k, v) -> None:
        self.memtable[k] = v
        if len(self.memtable) >= self.MEMTABLE_LIMIT:
            self._flush()

    def delete(self, k) -> None:
        self.put(k, None)

    def get(self, k):
        if k in self.memtable: return self.memtable[k]
        for sst in self.sstables:
            for kk, vv in sst:
                if kk == k: return vv
        return None

    def _flush(self) -> None:
        self.sstables.insert(0, sorted(self.memtable.items()))
        self.memtable = SortedDict()
        if len(self.sstables) >= self.SST_COMPACT_THRESHOLD:
            self._compact()

    def _compact(self) -> None:
        merged = {}
        for sst in reversed(self.sstables):   # oldest first; newer overwrites
            for k, v in sst:
                merged[k] = v
        compacted = sorted((k, v) for k, v in merged.items() if v is not None)
        self.sstables = [compacted]
```

### javascript
```javascript
class LSMEngine {
  static MEMTABLE_LIMIT = 1024;
  static COMPACT_THRESHOLD = 4;

  constructor() {
    this.memtable = new Map();
    this.sstables = [];   // newest first; each = sorted array of [k, v]
  }

  put(k, v) {
    this.memtable.set(k, v);
    if (this.memtable.size >= LSMEngine.MEMTABLE_LIMIT) this._flush();
  }

  delete(k) { this.put(k, null); }

  get(k) {
    if (this.memtable.has(k)) return this.memtable.get(k);
    for (const sst of this.sstables) {
      for (const [kk, vv] of sst) if (kk === k) return vv;
    }
    return undefined;
  }

  _flush() {
    const sst = [...this.memtable.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    this.sstables.unshift(sst);
    this.memtable = new Map();
    if (this.sstables.length >= LSMEngine.COMPACT_THRESHOLD) this._compact();
  }

  _compact() {
    const merged = new Map();
    for (let i = this.sstables.length - 1; i >= 0; i--) {
      for (const [k, v] of this.sstables[i]) merged.set(k, v);
    }
    const out = [...merged.entries()].filter(([, v]) => v !== null).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    this.sstables = [out];
  }
}
```

### java
```java
import java.util.*;

public class LSMEngine<K extends Comparable<K>, V> {
    private static final int MEMTABLE_LIMIT = 1024;
    private static final int COMPACT_THRESHOLD = 4;

    private TreeMap<K, V> memtable = new TreeMap<>();
    private final Deque<List<Map.Entry<K, V>>> sstables = new ArrayDeque<>();

    public void put(K k, V v) {
        memtable.put(k, v);
        if (memtable.size() >= MEMTABLE_LIMIT) flush();
    }

    public void delete(K k) { put(k, null); }

    public V get(K k) {
        if (memtable.containsKey(k)) return memtable.get(k);
        for (List<Map.Entry<K, V>> sst : sstables) {
            for (Map.Entry<K, V> e : sst) if (e.getKey().equals(k)) return e.getValue();
        }
        return null;
    }

    private void flush() {
        sstables.addFirst(new ArrayList<>(memtable.entrySet()));
        memtable = new TreeMap<>();
        if (sstables.size() >= COMPACT_THRESHOLD) compact();
    }

    private void compact() {
        TreeMap<K, V> merged = new TreeMap<>();
        Iterator<List<Map.Entry<K, V>>> it = sstables.descendingIterator();
        while (it.hasNext()) for (Map.Entry<K, V> e : it.next()) merged.put(e.getKey(), e.getValue());
        List<Map.Entry<K, V>> out = new ArrayList<>();
        for (Map.Entry<K, V> e : merged.entrySet()) if (e.getValue() != null) out.add(e);
        sstables.clear();
        sstables.addFirst(out);
    }
}
```

### cpp
```cpp
#include <map>
#include <vector>
#include <deque>
#include <optional>

template <typename K, typename V>
class LSMEngine {
    static constexpr size_t MEMTABLE_LIMIT = 1024;
    static constexpr size_t COMPACT_THRESHOLD = 4;

    std::map<K, std::optional<V>> memtable;
    std::deque<std::vector<std::pair<K, std::optional<V>>>> sstables;

    void flush() {
        std::vector<std::pair<K, std::optional<V>>> sst(memtable.begin(), memtable.end());
        sstables.push_front(std::move(sst));
        memtable.clear();
        if (sstables.size() >= COMPACT_THRESHOLD) compact();
    }

    void compact() {
        std::map<K, std::optional<V>> merged;
        for (auto it = sstables.rbegin(); it != sstables.rend(); ++it)
            for (auto& kv : *it) merged[kv.first] = kv.second;
        std::vector<std::pair<K, std::optional<V>>> out;
        for (auto& kv : merged) if (kv.second.has_value()) out.push_back(kv);
        sstables.clear();
        sstables.push_front(std::move(out));
    }

public:
    void put(const K& k, const V& v) {
        memtable[k] = v;
        if (memtable.size() >= MEMTABLE_LIMIT) flush();
    }

    void remove(const K& k) { memtable[k] = std::nullopt; if (memtable.size() >= MEMTABLE_LIMIT) flush(); }

    std::optional<V> get(const K& k) const {
        auto it = memtable.find(k);
        if (it != memtable.end()) return it->second;
        for (const auto& sst : sstables)
            for (const auto& kv : sst) if (kv.first == k) return kv.second;
        return std::nullopt;
    }
};
```
