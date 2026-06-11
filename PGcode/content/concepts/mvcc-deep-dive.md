---
slug: mvcc-deep-dive
module: sd-storage
title: MVCC Deep Dive — Anomalies, GC, and Isolation Levels
subtitle: Snapshot isolation rules, write skew anomalies, garbage-collection mechanics, and the read-your-writes vs repeatable-read distinction.
difficulty: Advanced
position: 223
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Wikipedia — Snapshot isolation (write skew, SSI, ANSI levels)"
    url: "https://en.wikipedia.org/wiki/Snapshot_isolation"
    type: blog
  - title: "Andy Pavlo — The Part of PostgreSQL We Hate the Most (MVCC bloat, indexes)"
    url: "https://www.cs.cmu.edu/~pavlo/blog/2023/04/the-part-of-postgresql-we-hate-the-most.html"
    type: blog
  - title: "PostgreSQL Docs — Page Layout (xmin, xmax, hint bits)"
    url: "https://www.postgresql.org/docs/current/storage-page-layout.html"
    type: book
status: published
---

## intro
The `mvcc` concept covers `(xmin, xmax)` versioning and the in-place vs undo-log storage families. This page goes one floor deeper into what snapshot isolation actually guarantees, the anomalies it allows that look like bugs, the garbage-collection mechanics that decide whether a write-heavy workload stays healthy or melts into bloat, and the read-your-writes vs repeatable-read distinction that trips up nearly every engineer the first time they see it.

## whyItMatters
Snapshot isolation is the default in Postgres, Oracle, InnoDB (REPEATABLE READ), SQL Server (READ COMMITTED SNAPSHOT), CockroachDB, and Spanner. It's not serializable. It allows write skew — two transactions can each pass an invariant check on a snapshot, both commit, and produce a state where the invariant is violated. Every database designer's worst surprise is shipping a feature that "works" in single-user testing and silently corrupts the invariant under concurrent load. The flip side: garbage-collecting old versions is what keeps the system fast. Long-running transactions block GC. A 4-hour analytics query on a busy OLTP database can grow tables 5x. This page exists so you don't get paged at 3am for either reason.

## intuition
Snapshot isolation gives every transaction a private snapshot fixed at start time. Reads in T see the row versions committed at T.snapshot_start; writes by other transactions are invisible no matter how many of them commit in between. The big win: readers never block writers, writers never block readers. The big cost: write-write conflicts on the same row still serialize through a row lock, and **read-write conflicts across different rows are invisible to the snapshot**.

That last clause is where write skew lives. Imagine two doctors covering the same hospital shift. Both check "are there at least two doctors on call?" — both queries return 2 (themselves + a colleague). Both decide to leave. Both update their row to off-call. Both commit. The invariant "at least two doctors must be on call" is now violated, and snapshot isolation didn't catch it because neither transaction modified the row the other one read. SQL's serializable isolation would have caught it; snapshot isolation does not.

Garbage collection is the other half of MVCC. Every UPDATE leaves a dead version. In Postgres, VACUUM is the reaper — it scans the heap, finds tuples whose `xmax` is older than the global `xmin` horizon (the oldest still-running snapshot), and frees the slot. The horizon is the killer. A 4-hour analytics SELECT holds a snapshot open; every dead tuple created since it started cannot be collected until it finishes. In InnoDB, the undo log fills with old versions instead; the purge thread sweeps it. A long transaction in InnoDB triggers ORA-01555-style "snapshot too old" failures when the undo log gets recycled before the long read can chase it.

Read-your-writes vs repeatable-read is the distinction every backend engineer needs to know. **Read-your-writes** (READ COMMITTED in Postgres): each statement gets a fresh snapshot. A SELECT inside the same transaction will see writes committed by other transactions since the previous SELECT — and will see your own uncommitted writes. **Repeatable read** (REPEATABLE READ / SNAPSHOT): the snapshot is fixed at transaction start. The same SELECT run twice returns the same result, no matter what other transactions commit in between. Postgres's REPEATABLE READ is actually snapshot isolation; its SERIALIZABLE adds dependency tracking on top.

## visualization
```
Snapshot isolation timeline:

  T1 BEGIN  (snapshot = {xid_horizon: 100, committed: {<100}})
  T1 SELECT balance FROM acct WHERE id=1 -> 500
                                          T2 BEGIN
                                          T2 UPDATE acct SET balance=300 WHERE id=1
                                          T2 COMMIT (xid 110)
  T1 SELECT balance FROM acct WHERE id=1 -> 500   <- still uses T1's snapshot
  T1 COMMIT

Write skew (the anomaly snapshot isolation allows):

  Invariant: SUM(on_call) for shift S >= 2 doctors

  Initial: A.on_call=1, B.on_call=1   (2 on call, invariant holds)

  T1 (Alice): BEGIN; SELECT count(*) WHERE on_call=1 AND shift=S -> 2;
              if count >= 2: UPDATE acct SET on_call=0 WHERE id=A;
  T2 (Bob):   BEGIN; SELECT count(*) WHERE on_call=1 AND shift=S -> 2;
              if count >= 2: UPDATE acct SET on_call=0 WHERE id=B;
  T1 COMMIT;  T2 COMMIT;

  Result: A.on_call=0, B.on_call=0   (0 on call, invariant violated!)
  Neither T1 nor T2 wrote a row the other read; snapshot isolation
  saw no conflict. Only SERIALIZABLE (Postgres SSI) catches this.

VACUUM horizon:

  T_long started at xid=100, still running.
  Global xmin horizon = 100.
  Dead tuple with xmax=105 cannot be reclaimed
  (T_long might still need to see it).
  Even if every other transaction has committed and moved on,
  vacuum waits on T_long.
```

## bruteForce
Strict two-phase locking with shared (read) + exclusive (write) locks. Correct, fully serializable, no anomalies. Catastrophic under mixed read/write workloads: a long-running report blocks every writer on the rows it touches; deadlocks proliferate; snapshot reads are impossible. This is why every modern OLTP database moved to MVCC despite the GC complexity.

## optimal
Snapshot isolation as the default, with seven moving parts.

**Snapshot construction.** A snapshot is `{xmin, xmax, in-progress xid list}`. Tuple t is visible to snapshot S iff `t.xmin < S.xmax AND t.xmin NOT IN S.in_progress AND t.xmin committed AND (t.xmax is NULL OR t.xmax > S.xmax OR t.xmax IN S.in_progress OR t.xmax aborted)`. Postgres caches the committed/aborted answer in two "hint bits" on the tuple header so subsequent visibility checks don't re-read `pg_clog`.

**Version storage.** In-place (Postgres) writes the new version into the heap and stamps `xmax` on the old; secondary indexes point to the new tuple's tid (HOT optimization skips this when no indexed column changed). Undo-log (InnoDB, Oracle) modifies the row in place and writes the old image into the rollback segment; reads from older snapshots walk the undo chain. Postgres wins on read latency, InnoDB wins on heap compactness, both lose under long transactions.

**Garbage collection.** Postgres autovacuum tracks the global `xmin` horizon (oldest live transaction's xid) and reclaims any dead tuple with `xmax < horizon`. Autovacuum is per-table, threshold-triggered (`autovacuum_vacuum_threshold` + `autovacuum_vacuum_scale_factor`). InnoDB's purge thread sweeps the undo log; `innodb_purge_threads` and `innodb_purge_batch_size` control throughput. CockroachDB uses `kv.gc.ttl_seconds` as a wall-clock TTL on tombstones.

**Isolation level mapping.** Postgres READ COMMITTED takes a fresh snapshot per statement (read-your-writes within the transaction; non-repeatable reads across statements are allowed). REPEATABLE READ is snapshot isolation — one snapshot per transaction, fixed at first read. SERIALIZABLE adds Serializable Snapshot Isolation (SSI) which tracks read-write dependencies between concurrent transactions and aborts one of the participants in a dangerous cycle. InnoDB REPEATABLE READ is also snapshot isolation but with a quirk: locking reads (`SELECT ... FOR UPDATE`, `INSERT INTO ... SELECT`) take next-key locks and behave more like READ COMMITTED for those rows.

**Write skew prevention.** Snapshot isolation allows write skew. Fixes: (1) SELECT FOR UPDATE on rows you check, which takes a shared/exclusive lock and forces the second transaction to wait, (2) Postgres SERIALIZABLE isolation (SSI), which tracks rw-dependencies and aborts cycles, (3) application-level invariant enforcement via a single canonical row (e.g., a counter row that everyone updates — turns write skew into a write-write conflict).

**Read-your-writes inside a transaction.** Always works under any snapshot isolation flavor — your own writes are visible to your subsequent reads, even though they have your `xid` and other snapshots haven't seen them yet. The visibility check has a fast path: if `t.xmin == my_xid`, the tuple is visible to me.

**Long-transaction monitoring.** The single best operational metric for an MVCC database is "age of the oldest running transaction." Postgres: `SELECT pid, xact_start, query FROM pg_stat_activity WHERE state = 'active' ORDER BY xact_start ASC LIMIT 10;`. Set `idle_in_transaction_session_timeout` to a hard limit; nothing good happens past a few minutes.

The interview line: "Snapshot isolation gives readers never-block-writers and writers never-block-readers, at the cost of write-skew anomalies and bloat from long transactions. Fix anomalies with SELECT FOR UPDATE or SERIALIZABLE; fix bloat by killing long transactions and tuning autovacuum."

## complexity
Read: O(1) per visible-version check (with hint bits). O(version-chain-length) for undo-log storage if the snapshot is old.
Write: O(1) for the new tuple + O(indexes) for index updates (HOT optimization avoids index updates when no indexed column changed).
GC: O(table size) per vacuum scan, throttled by `vacuum_cost_limit` / `vacuum_cost_delay`. Amortized O(dead tuples produced) over time.
Storage: O(rows × average_versions_live) overhead, where average_versions_live ≈ longest_live_snapshot_duration × update_rate.

## pitfalls
- **Write skew in disguise.** Code patterns like `if SELECT count >= N: UPDATE ...` look correct in single-user testing and silently break under concurrent load. Either lock the rows you check with FOR UPDATE, or move to SERIALIZABLE and accept the abort-retry cost, or restructure to a single canonical row.
- **Idle-in-transaction sessions.** A client that BEGINs, runs one query, then goes to lunch holds the snapshot open for the entire lunch. Set `idle_in_transaction_session_timeout = '5min'` in Postgres or equivalent.
- **Autovacuum starvation on big tables.** Default `autovacuum_vacuum_scale_factor = 0.2` means vacuum runs when 20% of the table is dead. On a 1 TB table, that's 200 GB of dead tuples before vacuum kicks in. Override per-table with a much smaller scale_factor + larger nap rate.
- **Index bloat is separate from table bloat.** Non-HOT updates write to every index. A wide table with 12 indexes under hot-row churn bloats indexes much faster than the heap. Schedule REINDEX CONCURRENTLY or use `pg_repack`.
- **Phantom reads under REPEATABLE READ.** Standard SQL's REPEATABLE READ allows phantoms; snapshot isolation does not. Postgres REPEATABLE READ = snapshot isolation = no phantoms. InnoDB REPEATABLE READ = snapshot isolation + next-key locks = no phantoms for locking reads. Know which one your DB does before relying on it.
- **Read-your-writes confusion in connection pools.** A web request that writes via one connection and then reads via another (from the pool) may not see its own write if the pool routes the read to a read replica. Solution: route reads-after-writes within a single transaction or session, or use causal-consistency tokens.

## interviewTips
- Lead with the snapshot rule: "Every transaction reads from a snapshot fixed at start; writes from other transactions after that point are invisible."
- When asked about write skew: "Snapshot isolation allows it because rw-dependencies aren't tracked. SELECT FOR UPDATE on the rows you check, or use SERIALIZABLE isolation."
- For senior depth: name the GC horizon, the difference between in-place (Postgres) and undo-log (InnoDB), and Postgres's SSI for serializability without 2PL.

## code.python
```python
# MVCC with snapshot isolation, write-skew detection, and a GC horizon.
from dataclasses import dataclass
from typing import Optional

@dataclass
class Version:
    val: str
    xmin: int
    xmax: Optional[int] = None

class Snapshot:
    def __init__(self, my_xid, committed, in_progress):
        self.my_xid = my_xid
        self.committed = frozenset(committed)
        self.in_progress = frozenset(in_progress)

    def visible(self, v: Version) -> bool:
        if v.xmin == self.my_xid: return True          # read-your-writes
        if v.xmin not in self.committed: return False
        if v.xmax is None: return True
        if v.xmax == self.my_xid: return False         # you deleted it
        return v.xmax not in self.committed

class MVCC:
    def __init__(self):
        self.rows: dict[int, list[Version]] = {}
        self.committed: set[int] = set()
        self.in_progress: set[int] = set()
        self.next_xid = 1
        self.gc_horizon = 0    # oldest active xid; nothing below this is needed

    def begin(self) -> Snapshot:
        xid = self.next_xid; self.next_xid += 1
        self.in_progress.add(xid)
        if self.gc_horizon == 0: self.gc_horizon = xid
        return Snapshot(xid, self.committed, self.in_progress)

    def read(self, snap: Snapshot, row_id: int) -> Optional[str]:
        for v in reversed(self.rows.get(row_id, [])):
            if snap.visible(v): return v.val
        return None

    def write(self, snap: Snapshot, row_id: int, new_val: str):
        chain = self.rows.setdefault(row_id, [])
        # write-write conflict detection
        if chain and chain[-1].xmax is None:
            head = chain[-1]
            if head.xmin in self.committed and head.xmin >= snap.my_xid:
                raise RuntimeError("serialization failure: write-write conflict")
            head.xmax = snap.my_xid
        chain.append(Version(new_val, snap.my_xid))

    def commit(self, snap: Snapshot):
        self.committed.add(snap.my_xid)
        self.in_progress.discard(snap.my_xid)
        self._advance_horizon()

    def _advance_horizon(self):
        self.gc_horizon = min(self.in_progress) if self.in_progress else self.next_xid

    def vacuum(self):
        for row_id, chain in list(self.rows.items()):
            self.rows[row_id] = [v for v in chain
                                 if v.xmax is None or v.xmax >= self.gc_horizon]
```

## code.javascript
```javascript
class MVCC {
  constructor() {
    this.rows = new Map();
    this.committed = new Set();
    this.inProgress = new Set();
    this.nextXid = 1;
    this.gcHorizon = 0;
  }
  begin() {
    const xid = this.nextXid++;
    this.inProgress.add(xid);
    if (this.gcHorizon === 0) this.gcHorizon = xid;
    return { myXid: xid,
             committed: new Set(this.committed),
             inProgress: new Set(this.inProgress) };
  }
  _visible(v, s) {
    if (v.xmin === s.myXid) return true;
    if (!s.committed.has(v.xmin)) return false;
    if (v.xmax == null) return true;
    if (v.xmax === s.myXid) return false;
    return !s.committed.has(v.xmax);
  }
  read(s, rowId) {
    const c = this.rows.get(rowId) || [];
    for (let i = c.length - 1; i >= 0; i--) if (this._visible(c[i], s)) return c[i].val;
    return null;
  }
  write(s, rowId, val) {
    const c = this.rows.get(rowId) || [];
    if (c.length && c[c.length - 1].xmax == null) {
      const head = c[c.length - 1];
      if (this.committed.has(head.xmin) && head.xmin >= s.myXid) {
        throw new Error("serialization failure");
      }
      head.xmax = s.myXid;
    }
    c.push({ val, xmin: s.myXid, xmax: null });
    this.rows.set(rowId, c);
  }
  commit(s) {
    this.committed.add(s.myXid);
    this.inProgress.delete(s.myXid);
    this.gcHorizon = this.inProgress.size ? Math.min(...this.inProgress) : this.nextXid;
  }
}
```

## code.java
```java
// Sketch — same shape; Snapshot carries my_xid + committed + inProgress.
// class Version { String val; long xmin; Long xmax; }
// class Snapshot { long myXid; Set<Long> committed, inProgress; }
// class MVCC {
//   Map<Long, List<Version>> rows = new HashMap<>();
//   Set<Long> committed = new HashSet<>(), inProgress = new HashSet<>();
//   long nextXid = 1, gcHorizon = 0;
//   Snapshot begin() { ... }
//   String read(Snapshot s, long rowId) { ... }
//   void write(Snapshot s, long rowId, String val) {
//     // throw on write-write conflict (head.xmin committed > s.myXid)
//   }
//   void commit(Snapshot s) { ... }
//   void vacuum() { /* drop versions with xmax < gcHorizon */ }
// }
```

## code.cpp
```cpp
// Sketch — std::unordered_map<row_id, std::vector<Version>>.
// struct Version { std::string val; uint64_t xmin; std::optional<uint64_t> xmax; };
// struct Snapshot { uint64_t my_xid;
//                   std::unordered_set<uint64_t> committed, in_progress; };
// class MVCC {
//   std::unordered_map<uint64_t, std::vector<Version>> rows;
//   std::unordered_set<uint64_t> committed, in_progress;
//   uint64_t next_xid = 1, gc_horizon = 0;
// public:
//   Snapshot begin();
//   std::optional<std::string> read(const Snapshot& s, uint64_t row_id) const;
//   void write(const Snapshot& s, uint64_t row_id, std::string val);  // throws on conflict
//   void commit(const Snapshot& s);
//   void vacuum();
// };
```
