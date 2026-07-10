---
slug: snapshot-isolation
module: cs-db-transactions
title: Snapshot Isolation
subtitle: MVCC-based concurrency control — every transaction reads a consistent point-in-time view, with write-skew as the trap.
difficulty: Advanced
position: 42
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — snapshot isolation chapter (Kleppmann)"
    url: "https://martinkleppmann.com/2017/03/27/designing-data-intensive-applications.html"
    type: book
  - title: "Hermitage: testing the I in ACID — jepsen.io"
    url: "https://jepsen.io/analyses"
    type: blog
  - title: "facebook/rocksdb — MVCC and transactions"
    url: "https://github.com/facebook/rocksdb/wiki/Transactions"
    type: repo
status: published
---

## intro
Snapshot Isolation (SI) is a concurrency-control level in which each transaction reads from a logically consistent snapshot of the database taken at its start time. Reads never block writes and writes never block reads — a huge throughput win over Two-Phase Locking. The implementation is **Multi-Version Concurrency Control (MVCC)**: every row update creates a new version stamped with the writer's commit time, and readers see only versions committed before their snapshot.

## whyItMatters
SI is the default isolation level in Postgres ("Read Committed" and "Repeatable Read" both use MVCC), Oracle ("Serializable" is actually SI), MySQL InnoDB ("Repeatable Read"), CockroachDB, SQL Server snapshot mode, and most modern OLTP engines. It eliminates dirty reads, non-repeatable reads, and most phantom reads — but it allows a famous anomaly called **write skew** that pure serializability would forbid. Knowing where SI is and is not equivalent to serializable is interview gold for any backend or distributed-systems role.

## intuition
Think of each transaction as taking a Polaroid of the database the moment it starts. It reads from the photo regardless of what others do. When it commits, the engine checks: did anyone overwrite a row I also wrote? If yes, abort with "first-committer-wins". Reads never wait for writes because they never look at the live database — only at their personal photo. The cost is keeping multiple versions of each row until no live snapshot references the old one — vacuum/garbage-collection pressure.

What's actually happening under the photo metaphor is that the database never overwrites data in place; every UPDATE appends a new version tagged with the writing transaction's id, and a reader is handed a snapshot — really a set of transaction ids that had committed at its start — that acts as a visibility filter over those versions. A reader asking for row 42 walks its version chain and returns the newest version whose creator is in its snapshot and whose deleter is not, so two transactions that began at different instants can each read a different, internally consistent value for the same row at the same wall-clock moment, with neither blocking the other. Put numbers on the win: in a read-heavy OLTP workload at, say, 50,000 reads/sec against 2,000 writes/sec on overlapping rows, strict two-phase locking would stall readers behind every writer's lock and serialize the hot rows, while SI lets all 50,000 reads proceed against their snapshots and pays a cost only on the small fraction of writes that actually collide. The bill comes due in two places: old versions must be retained until the oldest live snapshot no longer needs them (so a single long-running reporting query can pin versions and bloat the table), and a write-write collision is resolved by aborting the later committer, which the client must catch and retry.

## visualization
Write skew: invariant "at least 1 doctor on call"; Alice and Bob both on duty.

```
version chain per row, shown as (value @ creator_txid):
  alice.on = [ true@t0 ]     bob.on = [ true@t0 ]     on_call count = 2

T1 (Alice off)        snapshot={t0}      T2 (Bob off)   snapshot={t0}
  read on_call = 2  (2 >= 1, ok)           read on_call = 2  (2 >= 1, ok)
  write alice.on=false                     write bob.on=false
  COMMIT ok (only row alice.on written)    COMMIT ok (only row bob.on written)
no row written by BOTH -> no write-write conflict -> plain SI admits both
result: on_call = 0  -- invariant broken; SSI would abort one via RW-edge cycle
```

## bruteForce
Strict Two-Phase Locking gives serializability but blocks readers behind writers and vice versa, capping throughput in read-heavy workloads. Pure pessimistic locking also has high deadlock rates. Take-a-snapshot-and-check-on-commit (SI) gives most of the benefits with non-blocking reads — and only pays the abort cost on actual conflicts. The brute-force fallback when SI is wrong is to mark every read with `SELECT ... FOR UPDATE`, which is just simulating 2PL inside an SI engine.

## optimal
**MVCC**: each row carries (xmin, xmax) — the txids that created and deleted the version. A reader with snapshot S sees row version v iff `xmin in S.committed and xmax not in S.committed`. **First-committer-wins**: on commit, the engine checks for write-write conflicts on any row this transaction modified; if a concurrent transaction committed first on the same row, abort. **Serializable Snapshot Isolation (SSI)** (Cahill 2008, used by Postgres SERIALIZABLE) adds tracking of **read-write dependencies (RW antidependencies)**: it watches for "dangerous structures" of two such edges and aborts one transaction. The cost is bookkeeping, not blocking. **Predicate locking** at SI level is needed for the doctors example — Postgres' SIREAD locks materialize ranges read so write skew can be detected.

The tradeoff to state plainly: SI buys non-blocking reads and non-blocking writes by giving up true serializability, and the gap between the two is exactly **write skew** — two transactions each read an overlapping set, each write a *different* row, so no write-write conflict fires, yet together they violate an invariant that spanned the rows they read (the doctors-on-call example). Reach for plain SI when your invariants are per-row (a balance cannot go negative is enforced by the single row's version check) and reach for Serializable Snapshot Isolation when invariants span rows the transactions read but do not both write. SSI (Cahill 2008, Postgres SERIALIZABLE) closes the gap by tracking read-write antidependency edges and aborting one transaction when it detects the "dangerous structure" of two such edges forming a cycle — it costs bookkeeping proportional to read-set size, not blocking, but can run out of memory under huge analytic reads. The operational failure modes are the ones to design around: long-running transactions pin old versions and defeat vacuum, so bound transaction lifetime; and any transaction can abort at commit with a serialization failure, so every write path needs a retry-with-backoff loop — an ORM that swallows that exception turns a safe abort into silent data loss.

## complexity
time: O(1) per read (lookup live version chain); commit check is O(rows_written) per transaction
space: O(active_versions) = proportional to the longest-running transaction's snapshot
notes: Long-running read transactions are the enemy — they pin versions forever and bloat the table. Vacuum/garbage collection reclaims versions whose xmax is older than any active snapshot. SSI adds memory proportional to read sets, can run out under huge analytic queries.

## pitfalls
- Believing SI = SERIALIZABLE. It is not. Write skew is real and costs money in financial systems if invariants depend on aggregates.
- Long-running transactions hold snapshots forever — vacuum cannot reclaim, table bloats, queries slow down.
- Phantom reads under MVCC: predicate "WHERE status='open'" between two reads can change as commits happen *if* you re-evaluate; within one snapshot it is stable.
- Using `SELECT FOR UPDATE` everywhere "to be safe" — defeats the entire point of MVCC and reintroduces blocking.
- Confusing Oracle's "SERIALIZABLE" (which is really SI) with ANSI SERIALIZABLE — Oracle still permits write skew.
- Forgetting to handle the abort: under SI, commit can fail with serialization_failure; client must retry. ORMs that swallow this become silent data loss.

## interviewTips
- Lead with the read/write rule: "Reads never block writes, writes never block reads, conflicts are detected at commit."
- Be ready to construct the doctors-on-call example on demand — it is the canonical write-skew story.
- Distinguish SI from SSI. SSI catches write skew by tracking RW dependencies; pure SI does not.
- Mention vacuum/garbage collection as the operational cost — interviewers love operational depth.
- Compare to 2PL: SI wins on read throughput, 2PL wins on guaranteed serializability without aborts.

## code.python
```python
from collections import defaultdict
from itertools import count

class Version:
    __slots__ = ("value", "xmin", "xmax")
    def __init__(self, value, xmin):
        self.value, self.xmin, self.xmax = value, xmin, None

class MVCC:
    def __init__(self):
        self.versions = defaultdict(list)
        self.next_id = count(1)
        self.commit_log = {}

    def begin(self):
        tx = next(self.next_id)
        return Transaction(self, tx, set(self.commit_log))

    def commit(self, tx, writes, read_set):
        for key in writes:
            for v in self.versions[key]:
                if v.xmin not in tx.snapshot and v.xmin != tx.id:
                    raise RuntimeError("write-write conflict")
        for key, val in writes.items():
            for v in self.versions[key]:
                if v.xmax is None: v.xmax = tx.id
            self.versions[key].append(Version(val, tx.id))
        self.commit_log[tx.id] = True

class Transaction:
    def __init__(self, mvcc, tx_id, snapshot):
        self.mvcc, self.id, self.snapshot = mvcc, tx_id, snapshot
        self.writes, self.reads = {}, set()

    def get(self, key):
        self.reads.add(key)
        if key in self.writes: return self.writes[key]
        for v in reversed(self.mvcc.versions[key]):
            if v.xmin in self.snapshot or v.xmin == self.id:
                if v.xmax is None or v.xmax not in self.snapshot:
                    return v.value
        return None

    def set(self, key, value):
        self.writes[key] = value

    def commit(self):
        self.mvcc.commit(self, self.writes, self.reads)
```

## code.javascript
```javascript
class MVCC {
  constructor() { this.versions = new Map(); this.nextId = 1; this.committed = new Set(); }
  begin() { return new Tx(this, this.nextId++, new Set(this.committed)); }
  commit(tx) {
    for (const key of Object.keys(tx.writes)) {
      const list = this.versions.get(key) || [];
      for (const v of list) {
        if (!tx.snapshot.has(v.xmin) && v.xmin !== tx.id) {
          throw new Error('write-write conflict');
        }
      }
    }
    for (const [key, val] of Object.entries(tx.writes)) {
      const list = this.versions.get(key) || [];
      for (const v of list) if (v.xmax == null) v.xmax = tx.id;
      list.push({ value: val, xmin: tx.id, xmax: null });
      this.versions.set(key, list);
    }
    this.committed.add(tx.id);
  }
}

class Tx {
  constructor(mvcc, id, snapshot) { this.mvcc = mvcc; this.id = id; this.snapshot = snapshot; this.writes = {}; }
  get(key) {
    if (key in this.writes) return this.writes[key];
    const list = this.mvcc.versions.get(key) || [];
    for (let i = list.length - 1; i >= 0; i--) {
      const v = list[i];
      if (this.snapshot.has(v.xmin) || v.xmin === this.id) {
        if (v.xmax == null || !this.snapshot.has(v.xmax)) return v.value;
      }
    }
    return null;
  }
  set(key, val) { this.writes[key] = val; }
  commit() { this.mvcc.commit(this); }
}
```

## code.java
```java
class MVCC {
    static class Version {
        Object value; long xmin; Long xmax;
        Version(Object v, long x) { value = v; xmin = x; xmax = null; }
    }
    Map<String, List<Version>> versions = new HashMap<>();
    Set<Long> committed = new HashSet<>();
    long nextId = 1;

    Tx begin() { return new Tx(this, nextId++, new HashSet<>(committed)); }

    void commit(Tx tx) {
        for (String key : tx.writes.keySet()) {
            for (Version v : versions.getOrDefault(key, List.of())) {
                if (!tx.snapshot.contains(v.xmin) && v.xmin != tx.id)
                    throw new RuntimeException("write-write conflict");
            }
        }
        for (var e : tx.writes.entrySet()) {
            var list = versions.computeIfAbsent(e.getKey(), k -> new ArrayList<>());
            for (Version v : list) if (v.xmax == null) v.xmax = tx.id;
            list.add(new Version(e.getValue(), tx.id));
        }
        committed.add(tx.id);
    }
}

class Tx {
    MVCC mvcc; long id; Set<Long> snapshot;
    Map<String, Object> writes = new HashMap<>();
    Tx(MVCC m, long id, Set<Long> s) { mvcc = m; this.id = id; snapshot = s; }

    Object get(String key) {
        if (writes.containsKey(key)) return writes.get(key);
        var list = mvcc.versions.getOrDefault(key, List.of());
        for (int i = list.size() - 1; i >= 0; i--) {
            var v = list.get(i);
            if (snapshot.contains(v.xmin) || v.xmin == id) {
                if (v.xmax == null || !snapshot.contains(v.xmax)) return v.value;
            }
        }
        return null;
    }
    void set(String key, Object value) { writes.put(key, value); }
    void commit() { mvcc.commit(this); }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <string>
#include <optional>
#include <stdexcept>

struct Version {
    std::string value;
    uint64_t xmin;
    std::optional<uint64_t> xmax;
};

class MVCC {
public:
    std::unordered_map<std::string, std::vector<Version>> versions;
    std::unordered_set<uint64_t> committed;
    uint64_t nextId = 1;
};

class Tx {
public:
    Tx(MVCC& m, uint64_t id, std::unordered_set<uint64_t> snap)
        : mvcc(m), id(id), snapshot(std::move(snap)) {}

    std::optional<std::string> get(const std::string& key) {
        auto it = writes.find(key);
        if (it != writes.end()) return it->second;
        auto vit = mvcc.versions.find(key);
        if (vit == mvcc.versions.end()) return std::nullopt;
        for (auto it = vit->second.rbegin(); it != vit->second.rend(); ++it) {
            bool visibleBegin = snapshot.count(it->xmin) || it->xmin == id;
            bool visibleEnd = !it->xmax.has_value() || !snapshot.count(*it->xmax);
            if (visibleBegin && visibleEnd) return it->value;
        }
        return std::nullopt;
    }

    void set(const std::string& key, std::string value) { writes[key] = std::move(value); }

    void commit() {
        for (auto& [k, _] : writes) {
            for (auto& v : mvcc.versions[k]) {
                if (!snapshot.count(v.xmin) && v.xmin != id)
                    throw std::runtime_error("write-write conflict");
            }
        }
        for (auto& [k, val] : writes) {
            for (auto& v : mvcc.versions[k]) if (!v.xmax) v.xmax = id;
            mvcc.versions[k].push_back({val, id, std::nullopt});
        }
        mvcc.committed.insert(id);
    }

private:
    MVCC& mvcc;
    uint64_t id;
    std::unordered_set<uint64_t> snapshot;
    std::unordered_map<std::string, std::string> writes;
};
```
