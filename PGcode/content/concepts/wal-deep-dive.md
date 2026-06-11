---
slug: wal-deep-dive
module: sd-storage
title: WAL Deep Dive — ARIES Recovery Protocol
subtitle: LSNs, CLRs, the three-phase recovery (analysis / redo / undo), and how group commit and checkpoints make the math work.
difficulty: Advanced
position: 222
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Wikipedia — ARIES (analysis / redo / undo, CLRs, fuzzy checkpoints)"
    url: "https://en.wikipedia.org/wiki/Algorithms_for_Recovery_and_Isolation_Exploiting_Semantics"
    type: blog
  - title: "SQLite — Write-Ahead Logging (WAL file format, checkpoint, concurrency)"
    url: "https://www.sqlite.org/wal.html"
    type: book
  - title: "PostgreSQL — Page Layout (pd_lsn, page-level recovery)"
    url: "https://www.postgresql.org/docs/current/storage-page-layout.html"
    type: book
status: published
---

## intro
The `write-ahead-log` concept covers the three invariants. This page goes one floor deeper into the recovery protocol itself — ARIES. Log Sequence Numbers, Compensation Log Records, the dirty-page table, the transaction table, and the three-phase recovery (analysis, redo, undo) that lets a database come back from a crash mid-recovery and still finish correctly. This is the protocol every serious storage engine implements; understanding it is the difference between "WAL is durability" and "WAL is recovery."

## whyItMatters
ARIES is the protocol. Postgres's xlog, InnoDB's redo log + undo log, SQL Server's transaction log, DB2's log manager, RocksDB's WAL + manifest — they are all variants of the same paper (Mohan et al., 1992). The reason the protocol matters in interviews and on call: a database that survives a crash mid-COMMIT is one thing; a database that survives a crash mid-RECOVERY is another. ARIES is the only widely-deployed protocol that handles the second case correctly. Every senior interview that touches "what happens during recovery," "how does Postgres roll back a long transaction after a crash," or "why does InnoDB ship two logs instead of one" needs this answer.

## intuition
The WAL invariant — log before data — only buys you raw durability. Recovery still has to do something useful with the log on restart. Naïve recovery would replay the entire log from the beginning of time. ARIES makes that practical with two mechanisms: **per-page LSNs** so redo is idempotent (replay only records the page hasn't seen), and **checkpoints** so the recovery starting point is bounded.

Every log record has a monotonically increasing Log Sequence Number (LSN). Every data page has a `page_lsn` in its header, updated whenever a log record's effect is applied to that page. During redo, ARIES skips a log record if `record.lsn <= page.page_lsn` — the page already saw it. This makes redo safe to repeat: crashing during recovery and restarting just re-runs the same redo, and the LSN check filters duplicates.

Transactions that were in-flight at crash time have already written some redo records (their effects were durable in the log) but lack a COMMIT record. ARIES doesn't just skip them — it actively undoes them. For each in-flight transaction, walk the log backward through its records, and for each one, write a **Compensation Log Record** describing the reverse operation, then apply it. CLRs are themselves logged, so a crash mid-undo restarts cleanly — when ARIES sees a CLR during analysis, it knows the prior original record has already been undone, and undo can skip ahead.

Group commit and fsync trade-offs sit on top of all this. A single fsync on NVMe is ~100µs; on rotational disk, ~10ms. If every COMMIT fsyncs alone, you cap throughput at the inverse of fsync latency — a few hundred TPS on disk, ~10k on NVMe. Group commit batches many transactions' COMMIT records into one fsync, paying a small latency tax (the batch wait) for a large throughput win. Postgres's `commit_delay` and InnoDB's `innodb_flush_log_at_trx_commit` are the knobs.

Checkpoint cadence bounds recovery time. A **fuzzy checkpoint** (ARIES style) writes a marker into the log that includes the current dirty-page table and active-transaction table — no need to pause writes or flush all dirty pages. Recovery starts analysis at the most recent checkpoint marker.

## visualization
```
WAL with LSN-stamped records:

  LSN  TxID  Type    Page  Before  After   PrevLSN
  ----------------------------------------------------
  100  T1    BEGIN   -     -       -       -
  101  T1    UPDATE  P5    "A"     "B"     100
  102  T2    BEGIN   -     -       -       -
  103  T1    UPDATE  P9    "X"     "Y"     101
  104  T2    UPDATE  P5    "B"     "C"     102
  105  -     CHKPT   {dirty=P5,P9} {active=T1,T2}
  106  T1    COMMIT  -     -       -       103
  107  T2    UPDATE  P7    "M"     "N"     104
  ----- CRASH -----

Page LSNs on disk at crash (pages partially flushed):
  P5.page_lsn = 104  (T2's write was flushed)
  P9.page_lsn = 0    (never flushed; still holds "X")
  P7.page_lsn = 0    (T2's last write never flushed)

Recovery:
  ANALYSIS (scan log from LSN 105 forward):
    dirty pages: {P5, P9, P7}
    active txns at crash: {T1 (COMMITTED at 106), T2 (in-flight)}

  REDO (scan log forward, apply if record.lsn > page.page_lsn):
    LSN 101 on P5: page.lsn=104 > 101  -> skip
    LSN 103 on P9: page.lsn=0   < 103  -> apply, P9="Y", page.lsn=103
    LSN 104 on P5: page.lsn=104 = 104  -> skip
    LSN 107 on P7: page.lsn=0   < 107  -> apply, P7="N", page.lsn=107

  UNDO (T2 is in-flight; walk backward through T2's records):
    LSN 107: revert P7 "N"->"M". Write CLR (LSN 200, undonext=104).
    LSN 104: revert P5 "C"->"B". Write CLR (LSN 201, undonext=102).
    LSN 102: BEGIN -> done. Write CLR-ABORT marker.
```

## bruteForce
Naïve recovery: replay every log record from the start of time, applying every change to every page, then for each in-flight transaction walk back and reverse its changes by direct page edits (no CLRs). Two bugs: (1) replaying records already absorbed corrupts pages (no LSN check), and (2) a crash mid-undo loses progress — restart re-does the same undo work, and if the undo is non-idempotent, the database ends up wrong. ARIES fixes both with page-LSN and CLRs.

## optimal
ARIES is eight mechanisms in a trench coat.

**Log Sequence Number (LSN).** Monotonically increasing 64-bit id per log record. Used as the durability cursor (everything ≤ flushed_lsn is on disk), the page version marker (page_lsn), and the recovery skip filter.

**Per-page page_lsn.** Stamped on every page when a log record is applied. During redo, skip the record if `record.lsn ≤ page.page_lsn`. This makes redo idempotent — recovery can restart any number of times. Postgres's `pd_lsn` (in the page header) is exactly this.

**PrevLSN chain.** Every log record carries `prev_lsn` = the previous LSN of the same transaction. Undo walks this chain backward without scanning the whole log.

**Dirty Page Table (DPT).** Maps page → recoveryLSN (the LSN at which the page first became dirty). Maintained in memory during normal operation; written into checkpoint records. Recovery's redo starts at `min(recoveryLSN over all dirty pages)` — no point replaying records that only touched already-flushed pages.

**Active Transaction Table (ATT).** Maps txid → lastLSN, status. Maintained in memory; written into checkpoint records. Recovery's analysis pass rebuilds the ATT from the log starting at the checkpoint and decides which transactions need undo.

**Fuzzy checkpoint.** Periodically, write a checkpoint record into the log containing the current DPT and ATT. No need to stop writes or flush all dirty pages. Modern Postgres calls this a "restartpoint" during recovery; the same idea.

**Compensation Log Record (CLR).** During undo, before reversing a record's effect, write a CLR describing the reverse operation. CLRs include an `undoNext` pointer — the LSN to undo next, skipping any record already covered by a CLR. If a crash happens mid-undo, recovery sees the CLRs and knows not to re-undo.

**Three-phase recovery.** Analysis scans forward from the most recent checkpoint, rebuilding DPT and ATT, finding the redo start LSN and the set of transactions to undo. Redo scans forward from the redo start LSN, applying records whose LSN > page.page_lsn (one disk read per page in the worst case, fewer with caching). Undo walks the ATT, reversing in-flight transactions via CLRs.

**Group commit + fsync.** A COMMIT record must be on stable storage before the transaction is acknowledged. Group commit waits ~commit_delay microseconds (or until the WAL buffer fills) and fsyncs many COMMIT records at once. Postgres exposes `synchronous_commit` (per-transaction durability) and `commit_delay` / `commit_siblings`. InnoDB's `innodb_flush_log_at_trx_commit` has three values: 1 = fsync every commit (safe), 2 = write to OS buffer every commit, fsync once per second (loses ~1s on power loss), 0 = fsync once per second only (highest throughput, riskiest).

The interview line: "ARIES is three phases on top of LSN-stamped log records — analysis rebuilds the dirty-page and active-transaction tables, redo replays records whose LSN exceeds the page's LSN, undo reverses in-flight transactions via CLRs. Page LSNs and CLRs make recovery idempotent, so a crash mid-recovery is safe."

## complexity
Normal write: O(1) WAL append + O(1) page modify in buffer pool + amortized 1 fsync per group-commit batch.
Recovery time: O(log records since last checkpoint) for analysis + O(dirty pages × records-per-page) for redo + O(in-flight records) for undo. Checkpoint cadence is the knob — frequent checkpoints shrink recovery time, expand normal-operation I/O.
Throughput ceiling: bounded by sequential write bandwidth + fsync rate. Group commit raises the ceiling by amortizing fsync over a batch. Modern NVMe + battery-backed cache makes fsync ~100µs, shifting the bottleneck to log-record serialization.

## pitfalls
- **Fsync lying.** Storage devices and filesystems have historically lied about fsync completion to win benchmarks. The Postgres + ext4 bug of 2018 is the canonical example. Test your stack with `pg_test_fsync` or `diskchecker.pl`; cheap consumer SSDs without power-loss protection cannot do honest fsync.
- **Checkpoint storms.** A checkpoint that flushes thousands of dirty pages at once saturates I/O and starves writes. Postgres exposes `checkpoint_completion_target` (default 0.9 — spread the flush across 90% of the interval). InnoDB has adaptive flushing. Tune for steady-state I/O, not bursty.
- **Long-running transactions block WAL truncation.** WAL files older than the oldest active transaction's first LSN cannot be truncated. A long transaction holds the WAL open and disk fills. Monitor `pg_stat_activity.backend_xmin` and `pg_replication_slots.restart_lsn`.
- **Missing CLRs during undo.** A homegrown WAL that does undo without CLRs is correct only if recovery never crashes mid-undo. The first time recovery does crash mid-undo (and it will), the database ends up in an inconsistent state.
- **`synchronous_commit = off` semantics.** Faster but loses up to `wal_writer_delay` (default 200ms) of committed transactions on power loss. Per-transaction overridable. Read the docs carefully before flipping it for "performance."

## interviewTips
- Open with the three phases: "Analysis rebuilds in-memory state, redo replays records the page hasn't seen, undo reverses in-flight transactions via CLRs."
- Explain why CLRs exist before the interviewer asks: "Undo has to be safe to restart. CLRs log the reverse operation so a crash mid-undo doesn't re-run completed work."
- For senior depth: name page_lsn, the dirty-page table, fuzzy checkpoints, and group commit. Mention that ARIES is the protocol behind Postgres, InnoDB, SQL Server, DB2.

## code.python
```python
# Minimal ARIES sketch with LSN, page_lsn, CLRs, three-phase recovery.
import os
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class LogRec:
    lsn: int
    txid: Optional[int]
    kind: str                # 'BEGIN','UPDATE','COMMIT','ABORT','CLR','CHKPT'
    page_id: Optional[int] = None
    before: Optional[str] = None
    after: Optional[str] = None
    prev_lsn: Optional[int] = None
    undo_next: Optional[int] = None  # for CLRs

@dataclass
class Page:
    page_id: int
    val: str = ""
    page_lsn: int = 0

class WAL:
    def __init__(self):
        self.records = []
        self.next_lsn = 1
    def append(self, **kw):
        rec = LogRec(lsn=self.next_lsn, **kw); self.next_lsn += 1
        self.records.append(rec); return rec
    def fsync(self): pass  # flush os.fsync in real systems

class DB:
    def __init__(self):
        self.wal = WAL()
        self.pages: dict[int, Page] = {}
        self.att: dict[int, int] = {}    # active txn -> last_lsn
        self.dpt: dict[int, int] = {}    # dirty page_id -> recovery_lsn
        self.committed: set[int] = set()

    def update(self, txid, page_id, new_val):
        page = self.pages.setdefault(page_id, Page(page_id))
        before = page.val
        rec = self.wal.append(txid=txid, kind='UPDATE', page_id=page_id,
                              before=before, after=new_val,
                              prev_lsn=self.att.get(txid))
        page.val = new_val; page.page_lsn = rec.lsn
        self.att[txid] = rec.lsn
        self.dpt.setdefault(page_id, rec.lsn)

    def commit(self, txid):
        rec = self.wal.append(txid=txid, kind='COMMIT', prev_lsn=self.att.get(txid))
        self.wal.fsync()
        self.committed.add(txid); self.att.pop(txid, None)

    # --- Recovery (analysis -> redo -> undo) ---
    def recover(self, checkpoint_lsn=0):
        # ANALYSIS: rebuild ATT + DPT from log
        att, dpt = {}, {}
        for r in self.wal.records:
            if r.lsn < checkpoint_lsn: continue
            if r.kind == 'BEGIN': att[r.txid] = r.lsn
            elif r.kind == 'COMMIT' or r.kind == 'ABORT': att.pop(r.txid, None)
            elif r.kind == 'UPDATE':
                att[r.txid] = r.lsn
                dpt.setdefault(r.page_id, r.lsn)

        # REDO: replay records whose lsn > page.page_lsn
        for r in self.wal.records:
            if r.kind != 'UPDATE' or r.lsn < checkpoint_lsn: continue
            page = self.pages.setdefault(r.page_id, Page(r.page_id))
            if r.lsn > page.page_lsn:
                page.val = r.after; page.page_lsn = r.lsn

        # UNDO: in-flight txns -> walk prev_lsn chain, write CLR per step
        for txid, last_lsn in list(att.items()):
            cur = last_lsn
            while cur is not None:
                r = next(rr for rr in self.wal.records if rr.lsn == cur)
                if r.kind == 'UPDATE':
                    page = self.pages[r.page_id]; page.val = r.before
                    self.wal.append(txid=txid, kind='CLR', page_id=r.page_id,
                                    after=r.before, undo_next=r.prev_lsn)
                cur = r.prev_lsn
            self.wal.append(txid=txid, kind='ABORT')
```

## code.javascript
```javascript
// Same shape — append-only log, per-page LSN, CLRs in undo.
class DB {
  constructor() {
    this.log = []; this.nextLsn = 1;
    this.pages = new Map(); this.att = new Map(); this.dpt = new Map();
    this.committed = new Set();
  }
  _append(rec) { rec.lsn = this.nextLsn++; this.log.push(rec); return rec; }
  update(txid, pageId, val) {
    const page = this.pages.get(pageId) || { val: '', pageLsn: 0 };
    const rec = this._append({ txid, kind: 'UPDATE', pageId,
                               before: page.val, after: val,
                               prevLsn: this.att.get(txid) || null });
    page.val = val; page.pageLsn = rec.lsn;
    this.pages.set(pageId, page); this.att.set(txid, rec.lsn);
    if (!this.dpt.has(pageId)) this.dpt.set(pageId, rec.lsn);
  }
  commit(txid) {
    this._append({ txid, kind: 'COMMIT', prevLsn: this.att.get(txid) });
    /* fsync */ this.committed.add(txid); this.att.delete(txid);
  }
}
```

## code.java
```java
// Sketch — per-page LSN + log record list + recovery walk.
// class LogRec { long lsn; long txid; String kind; long pageId;
//                String before, after; Long prevLsn, undoNext; }
// class Page { long id; String val = ""; long pageLsn = 0; }
// class DB {
//   List<LogRec> log = new ArrayList<>(); long nextLsn = 1;
//   Map<Long, Page> pages = new HashMap<>();
//   Map<Long, Long> att = new HashMap<>(); Map<Long, Long> dpt = new HashMap<>();
//   void update(long txid, long pageId, String val) { ... }
//   void recover(long checkpointLsn) { /* analysis -> redo -> undo */ }
// }
```

## code.cpp
```cpp
// Sketch — vector<LogRec>, unordered_map<page_id, Page>.
// struct LogRec { uint64_t lsn; uint64_t txid; std::string kind;
//                 uint64_t page_id; std::string before, after;
//                 std::optional<uint64_t> prev_lsn, undo_next; };
// struct Page { uint64_t id; std::string val; uint64_t page_lsn = 0; };
// class DB {
//   std::vector<LogRec> log; uint64_t next_lsn = 1;
//   std::unordered_map<uint64_t, Page> pages;
//   std::unordered_map<uint64_t, uint64_t> att, dpt;
//   void update(uint64_t txid, uint64_t page_id, std::string val);
//   void recover(uint64_t checkpoint_lsn);
// };
```
