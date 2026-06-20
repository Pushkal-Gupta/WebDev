---
slug: mvcc
module: sd-storage
title: Multi-Version Concurrency Control (MVCC)
subtitle: Every transaction reads from its own snapshot; writers never block readers, readers never block writers.
difficulty: Advanced
position: 1
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "PostgreSQL Docs — Introduction to Concurrency Control (MVCC)"
    url: "https://www.postgresql.org/docs/current/mvcc-intro.html"
    type: book
  - title: "Andy Pavlo — The Part of PostgreSQL We Hate the Most"
    url: "https://www.cs.cmu.edu/~pavlo/blog/2023/04/the-part-of-postgresql-we-hate-the-most.html"
    type: blog
  - title: "PostgreSQL Wiki — Hint Bits"
    url: "https://wiki.postgresql.org/wiki/Hint_Bits"
    type: blog
status: published
---

## intro
MVCC is the trick that lets a database serve a read-heavy workload without readers and writers tripping over each other. Instead of locking a row when a transaction wants to update it, the database writes a new version of that row tagged with the transaction's id. Old versions stick around until no live transaction can still see them. Every transaction reads from a snapshot fixed at its start; concurrent writes are invisible to it.

## whyItMatters
PostgreSQL, Oracle, MySQL InnoDB, SQL Server (snapshot isolation), MongoDB WiredTiger, CockroachDB, and Spanner all use a variant of MVCC. Without it, OLTP workloads with mixed reads and writes collapse under lock contention: a long-running analytics query would freeze every writer touching the same tables. MVCC is what makes "BEGIN; SELECT giant_report; COMMIT" safe to run mid-day in production. Every senior backend interview that wanders into isolation levels, snapshot reads, phantom reads, or "why did my long transaction bloat the table" lands here. Understanding MVCC is also the only way to reason about VACUUM lag, undo-log pressure in InnoDB, and the cost of long-lived transactions.

## intuition
The cleanest mental model: every row in the table is really a chain of versions, each stamped with `(xmin, xmax)` — the transaction id that inserted it and the transaction id that deleted or superseded it. When transaction T starts, the database records a snapshot: T's own id, the highest committed id, and the set of in-flight transactions. A row version is visible to T if `xmin` is committed and ≤ T's snapshot AND (`xmax` is null, in-flight, or > T's snapshot). Updates do not overwrite — they insert a new tuple and stamp the old one's `xmax`. Deletes do not remove — they only stamp `xmax`.

The consequence is that reads need zero locks. T's snapshot is a constant; it walks the version chain and picks the one version that was committed at snapshot time. Two writers updating the same row still serialize through a row-level lock — MVCC does not magic away write-write conflicts — but a writer never blocks a reader, and a reader never blocks a writer. This is "snapshot isolation."

The cost is bloat. Every UPDATE leaves a dead tuple behind. In PostgreSQL, autovacuum reclaims those tuples once no live snapshot can still see them; in InnoDB, the old version lives in the undo log instead of in the main table, and purge threads clean it. Long-running transactions are the silent killer: a 4-hour analytics query holds open a snapshot that pins every dead tuple created since it began. The table grows; the indexes bloat; queries slow down; the next vacuum has more work. The mental model "writers never block readers" is true, but "readers can pin gigabytes of dead tuples" is also true.

Compare to lock-based isolation (older SQL Server, DB2, single-version stores). A SELECT takes shared locks on rows it reads; an UPDATE takes exclusive locks. Mixed workloads deadlock or stall. Snapshot reads are impossible without a versioning layer. MVCC trades storage and a background reclaim job for the right to never block a reader — a trade nearly every modern OLTP database has decided is worth it.

## visualization
```
Table row id=42, version chain (newest leftmost in storage):

      v3:  xmin=T200 (committed)   xmax=NULL          val="C"
      v2:  xmin=T180 (committed)   xmax=T200 (commit) val="B"
      v1:  xmin=T100 (committed)   xmax=T180 (commit) val="A"

  Snapshot of T150 (started after T100 committed,
  before T180 and T200 committed):
      v1 visible    (xmin<=150 committed, xmax>150) -> reads "A"
      v2 invisible  (xmin=T180 not committed at T150 start)
      v3 invisible  (xmin=T200 not committed at T150 start)

  Snapshot of T210 (started after T200 committed):
      v3 visible    -> reads "C"

  Until T150 finishes, v1 cannot be reclaimed even though
  the live row is v3 — VACUUM must wait.
```

## bruteForce
Two-phase locking with shared (read) and exclusive (write) locks. Every SELECT takes shared locks; every UPDATE upgrades to exclusive. Correct but catastrophic under mixed workloads: a long-running report blocks every writer on the rows it touches, deadlocks proliferate, and you cannot offer "snapshot read" semantics at all. This is what SQL Server's default isolation was before snapshot isolation arrived; it is why most production teams ran read-uncommitted as a "fix."

## optimal
MVCC with per-tuple `(xmin, xmax)` and per-transaction snapshots is the consensus design. Two storage families implement it:

**In-place new versions (PostgreSQL).** UPDATE inserts a new heap tuple and stamps `xmax` on the old one. Every secondary index points to the new tuple's tid (the HOT optimization skips this when no indexed column changed). VACUUM scans the heap, finds tuples whose `xmax` is older than the global `xmin` horizon (the oldest still-running snapshot), and frees their slots. Pros: reads are fast (the visible version is in the heap, no extra hop). Cons: bloat is visible — pg_stat_user_tables shows `n_dead_tup`; tables can balloon if autovacuum can't keep up; every UPDATE writes to every index unless HOT applies.

**Undo-log versions (InnoDB, Oracle).** UPDATE modifies the row in place and writes the old image to a rollback segment. Reads from older snapshots walk a pointer chain back through the undo log to reconstruct the prior version. Purge threads later free undo entries that no snapshot can see. Pros: the "current" row stays in the main heap; indexes stay narrow. Cons: reads from old snapshots get slower with each version they have to chase; very long transactions blow up the undo tablespace (ORA-01555 "snapshot too old" is the famous failure mode).

**Snapshot construction.** A snapshot is `{xmin, xmax, in-progress xid list}`. Visibility check for a tuple t: `t.xmin < snapshot.xmax AND t.xmin NOT IN in-progress AND t.xmin committed AND (t.xmax is NULL OR t.xmax > snapshot.xmax OR t.xmax IN in-progress OR t.xmax aborted)`. PostgreSQL caches the committed/aborted answer in two "hint bits" on the tuple header so subsequent visibility checks do not re-read pg_clog.

**Isolation levels on top of MVCC.** READ COMMITTED uses a fresh snapshot per statement. REPEATABLE READ / SNAPSHOT uses one snapshot per transaction. SERIALIZABLE adds either S2PL (Oracle) or Serializable Snapshot Isolation (PostgreSQL's SSI, which tracks read-write dependency cycles and aborts one of the transactions that would create a non-serializable schedule).

**Write conflicts still serialize.** Two transactions updating the same row both take the row's tuple lock; the second waits, then either succeeds (READ COMMITTED — re-reads the latest version) or aborts with a serialization failure (REPEATABLE READ / SERIALIZABLE).

The interview line: "MVCC gives every transaction a private snapshot, so readers never block writers and writers never block readers. Old versions are kept in-place (Postgres) or in the undo log (InnoDB) and reclaimed by VACUUM or purge once no live snapshot can see them. Long transactions are the failure mode — they pin dead tuples and bloat storage."

## complexity
time: O(version-chain-length) per read in the undo-log family; O(1) per read in the in-place family.
space: O(rows * average_versions_alive) on top of the base table, where average_versions_alive is bounded by the duration of the longest live snapshot times the update rate.
notes: VACUUM / purge runs in O(table-scan) but can be incremental and run concurrently with foreground traffic. Visibility checks are O(1) per tuple given the snapshot and hint bits.

## pitfalls
- **Long-running transactions are the silent killer.** They pin every dead tuple created since they started. A 6-hour analytics SELECT on a busy OLTP database can grow tables 3-5x. Fix: kill or split long queries; monitor `pg_stat_activity.xact_start`; set `idle_in_transaction_session_timeout`.
- **"Snapshot too old" (ORA-01555).** InnoDB / Oracle equivalent: the undo log got recycled before the long read could reach back to its snapshot's version. Fix: size undo, kill or shorten the query.
- **VACUUM is mandatory, not optional.** PostgreSQL's `autovacuum_naptime` and per-table thresholds need tuning on high-churn tables. Disabling autovacuum on "small" tables, then letting them grow, has caused multiple production outages.
- **MVCC does not prevent write-write conflicts.** Snapshot isolation allows the classic "lost update" and "write skew" anomalies. If you need true serializability, use SERIALIZABLE — but accept the abort-and-retry cost.
- **Index bloat is separate from table bloat.** Every non-HOT update writes to every index. A wide table with 12 indexes and a hot-row update workload bloats indexes faster than the heap. Schedule REINDEX or use `pg_repack`.

## interviewTips
- State the snapshot model in one line: "Every transaction reads from a snapshot fixed at its start; updates create new versions; old versions are reclaimed by VACUUM or purge once no live snapshot can see them."
- Be explicit about the cost: "Readers never block writers, but long-running readers pin dead tuples and force the system to keep them around — that's the bloat trade-off."
- Know the contrast with lock-based isolation: "Two-phase locking has readers blocking writers. MVCC trades extra storage for never blocking — almost every modern OLTP DB has chosen MVCC."

## code.python
```python
class Tuple:
    __slots__ = ("val", "xmin", "xmax")
    def __init__(self, val, xmin, xmax=None):
        self.val, self.xmin, self.xmax = val, xmin, xmax

class MVCCTable:
    def __init__(self):
        self.rows = {}                 # row_id -> list[Tuple] (newest last)
        self.committed = set()         # committed xids
        self.next_xid = 1

    def begin(self):
        xid = self.next_xid; self.next_xid += 1
        snapshot = (xid, set(self.committed))   # frozen view of "what's visible"
        return xid, snapshot

    def visible(self, t, snapshot):
        xid, committed = snapshot
        if t.xmin not in committed: return False
        if t.xmax is None: return True
        return t.xmax not in committed         # if xmax committed before snapshot -> superseded

    def read(self, row_id, snapshot):
        for t in reversed(self.rows.get(row_id, [])):
            if self.visible(t, snapshot):
                return t.val
        return None

    def update(self, row_id, new_val, xid):
        chain = self.rows.setdefault(row_id, [])
        if chain and chain[-1].xmax is None:
            chain[-1].xmax = xid               # mark superseded
        chain.append(Tuple(new_val, xid))

    def commit(self, xid):
        self.committed.add(xid)
```

## code.javascript
```javascript
class MVCCTable {
  constructor() {
    this.rows = new Map();           // rowId -> array of {val, xmin, xmax}
    this.committed = new Set();
    this.nextXid = 1;
  }
  begin() {
    const xid = this.nextXid++;
    const snapshot = { xid, committed: new Set(this.committed) };
    return { xid, snapshot };
  }
  visible(t, snap) {
    if (!snap.committed.has(t.xmin)) return false;
    if (t.xmax == null) return true;
    return !snap.committed.has(t.xmax);
  }
  read(rowId, snap) {
    const chain = this.rows.get(rowId) || [];
    for (let i = chain.length - 1; i >= 0; i--) {
      if (this.visible(chain[i], snap)) return chain[i].val;
    }
    return null;
  }
  update(rowId, val, xid) {
    const chain = this.rows.get(rowId) || [];
    if (chain.length && chain[chain.length - 1].xmax == null) {
      chain[chain.length - 1].xmax = xid;
    }
    chain.push({ val, xmin: xid, xmax: null });
    this.rows.set(rowId, chain);
  }
  commit(xid) { this.committed.add(xid); }
}
```

## code.java
```java
import java.util.*;

class MVCCTable {
    static class Tup { Object val; long xmin; Long xmax;
        Tup(Object v, long x) { val = v; xmin = x; } }
    static class Snap { long xid; Set<Long> committed;
        Snap(long x, Set<Long> c) { xid = x; committed = c; } }

    Map<Long, List<Tup>> rows = new HashMap<>();
    Set<Long> committed = new HashSet<>();
    long nextXid = 1;

    public long begin(Snap[] out) {
        long xid = nextXid++;
        out[0] = new Snap(xid, new HashSet<>(committed));
        return xid;
    }
    boolean visible(Tup t, Snap s) {
        if (!s.committed.contains(t.xmin)) return false;
        if (t.xmax == null) return true;
        return !s.committed.contains(t.xmax);
    }
    public Object read(long rowId, Snap s) {
        List<Tup> chain = rows.getOrDefault(rowId, Collections.emptyList());
        for (int i = chain.size() - 1; i >= 0; i--)
            if (visible(chain.get(i), s)) return chain.get(i).val;
        return null;
    }
    public void update(long rowId, Object val, long xid) {
        List<Tup> chain = rows.computeIfAbsent(rowId, k -> new ArrayList<>());
        if (!chain.isEmpty() && chain.get(chain.size() - 1).xmax == null)
            chain.get(chain.size() - 1).xmax = xid;
        chain.add(new Tup(val, xid));
    }
    public void commit(long xid) { committed.add(xid); }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <optional>
#include <string>

struct Tup { std::string val; long xmin; std::optional<long> xmax; };
struct Snap { long xid; std::unordered_set<long> committed; };

class MVCCTable {
    std::unordered_map<long, std::vector<Tup>> rows;
    std::unordered_set<long> committed;
    long next_xid = 1;
public:
    long begin(Snap& out) {
        long xid = next_xid++;
        out = {xid, committed};
        return xid;
    }
    bool visible(const Tup& t, const Snap& s) const {
        if (!s.committed.count(t.xmin)) return false;
        if (!t.xmax.has_value()) return true;
        return !s.committed.count(*t.xmax);
    }
    std::optional<std::string> read(long row_id, const Snap& s) const {
        auto it = rows.find(row_id);
        if (it == rows.end()) return std::nullopt;
        for (auto rit = it->second.rbegin(); rit != it->second.rend(); ++rit)
            if (visible(*rit, s)) return rit->val;
        return std::nullopt;
    }
    void update(long row_id, std::string val, long xid) {
        auto& chain = rows[row_id];
        if (!chain.empty() && !chain.back().xmax.has_value())
            chain.back().xmax = xid;
        chain.push_back({std::move(val), xid, std::nullopt});
    }
    void commit(long xid) { committed.insert(xid); }
};
```
