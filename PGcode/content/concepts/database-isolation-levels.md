---
slug: database-isolation-levels
module: cs-db-transactions
title: Database Isolation Levels
subtitle: Read-uncommitted, read-committed, repeatable-read, serializable — and the anomalies (phantoms, write skew) that distinguish them.
difficulty: Advanced
position: 3
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 7: Transactions"
    url: "https://dataintensive.net/"
    type: book
  - title: "Jepsen — Postgres, MySQL, and the Reality of Isolation"
    url: "https://jepsen.io/analyses"
    type: blog
  - title: "donnemartin/system-design-primer — Transactions and Locking"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
The SQL standard defines four isolation levels — Read Uncommitted, Read Committed, Repeatable Read, Serializable — by *which anomalies they forbid*. Read Uncommitted allows dirty reads. Read Committed blocks dirty reads but allows non-repeatable reads. Repeatable Read blocks both but allows phantoms. Serializable blocks everything and presents transactions as if they ran one at a time. Each step up costs concurrency; each step down opens a class of bugs. The interview question is "what is the strictest level you can afford?"

## whyItMatters
Most production databases default to **Read Committed** (Postgres, Oracle, SQL Server) or **Repeatable Read** with MVCC (MySQL InnoDB). Neither default prevents *write skew* — the classic on-call-rotation bug where two doctors both go off-call at the same moment because each thought the other was still on. The bug is rare and devastating. Knowing the anomalies by name (dirty read, non-repeatable read, phantom, write skew, lost update) lets you reason about whether your `SELECT ... FOR UPDATE` is enough or whether you need `SERIALIZABLE`.

## intuition
A transaction is a snapshot of the database; the isolation level decides how aggressively the snapshot is enforced.

- *Read Uncommitted* = you see in-flight writes from anyone, including ones that will roll back.
- *Read Committed* = you only see writes that have committed before your statement started — but each statement gets a fresh snapshot, so two reads of the same row in one transaction can differ.
- *Repeatable Read* = you pin a snapshot at transaction start; the same row reads identically all the way through — but new rows matching a `WHERE` clause can appear (phantoms) unless the engine adds predicate locks.
- *Serializable* = the engine guarantees the result is equivalent to *some* serial order of all committed transactions.

## visualization
Write skew under Repeatable Read (Postgres MVCC default would also need SERIALIZABLE to prevent this):

```
T1: SELECT count(*) FROM doctors WHERE on_call=true AND shift='night'   -- sees 2
T2: SELECT count(*) FROM doctors WHERE on_call=true AND shift='night'   -- sees 2
T1: UPDATE doctors SET on_call=false WHERE id=1                          -- ok
T2: UPDATE doctors SET on_call=false WHERE id=2                          -- ok
T1: COMMIT
T2: COMMIT
                                                                         -- 0 on call!
```

Both transactions read a consistent snapshot, neither updated rows the other read, but the *invariant* "at least one doctor on call" is violated.

## bruteForce
Drop everything to `SERIALIZABLE` and call it done. It works for correctness but kills throughput on contended hot rows because the engine either takes more locks (2PL) or aborts more transactions for serialization failures (SSI). On a workload with thousands of concurrent writers per second, this is observable as 503s and angry pager alerts. The interview answer "always use serializable" is technically safe but operationally lazy.

## optimal
Pick per workload:

- **Most reads, few writes, no cross-row invariants:** Read Committed is fine. Use `SELECT ... FOR UPDATE` on individual rows that need exclusive access.
- **Multi-row invariants** (transfers, double-entry ledgers): Serializable (Postgres SSI is fast in the no-contention case; it only retries when an actual conflict is detected).
- **Bulk read-only reporting:** Repeatable Read with a long-lived snapshot avoids phantoms within the report.
- **Lost updates** (the read-modify-write race): always wrap in a transaction with `SELECT ... FOR UPDATE`, or use optimistic locking via a `version` column with a `CHECK` on update.
- **Phantom prevention without serializable:** predicate locks via `SELECT ... FOR UPDATE` on the range, or unique-index inserts that fail by constraint.

Always handle SQLSTATE `40001` (serialization failure) and `40P01` (deadlock) by retrying with exponential backoff.

## complexity
time: Read Committed — minimal locking, highest throughput. Repeatable Read — slightly more contention. Serializable (SSI) — adds a per-transaction conflict-detection structure; retries on conflict. Serializable (2PL) — taken locks held until commit; deadlocks possible.
space: MVCC keeps old row versions until no live snapshot needs them; long-running Repeatable Read transactions bloat the heap (the famous Postgres `VACUUM` problem).
notes: ANSI SQL's level names are aspirational. What "Repeatable Read" *does* differs between engines: MySQL InnoDB's RR includes gap-locks (prevents phantoms in many cases); Postgres RR is snapshot isolation (allows write skew, does not prevent phantoms in the strict ANSI sense).

## pitfalls
- Trusting `READ COMMITTED` to prevent lost updates. It does not — wrap in a transaction with explicit row locks.
- Believing `REPEATABLE READ` = serializable. It is not — write skew is allowed.
- Long-running transactions on Postgres holding back `VACUUM` and bloating tables to 10× their size.
- Catching `40001` and giving up instead of retrying — serialization failures are expected with SSI; the contract is "retry the transaction."
- Mixing isolation levels across services in a saga and assuming the union is consistent. Each step is independent; you need application-level idempotency.

## interviewTips
- Memorize the table: Dirty Read, Non-repeatable Read, Phantom Read, Write Skew × isolation level. Quote it from memory.
- Know that Postgres's default is **Read Committed**, MySQL InnoDB's is **Repeatable Read** with gap-locks, SQL Server defaults to **Read Committed** but has an opt-in *snapshot* mode.
- Drop the phrase "Serializable Snapshot Isolation (SSI)" — Postgres's optimistic implementation that avoids most lock contention.
- For "lost update," show optimistic locking via a `version` column — a clean, retry-friendly pattern.
- When asked about phantoms, demonstrate the bank-balance / on-call-rotation example. Interviewers grade on knowing *write skew* by name.

## code.python
```python
# Postgres SERIALIZABLE with retry on 40001
import psycopg, time, random
from psycopg.errors import SerializationFailure

def transfer(conn, src, dst, amount):
    for attempt in range(5):
        try:
            with conn.transaction():
                conn.execute("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE")
                conn.execute(
                    "UPDATE accounts SET balance = balance - %s WHERE id=%s",
                    (amount, src),
                )
                conn.execute(
                    "UPDATE accounts SET balance = balance + %s WHERE id=%s",
                    (amount, dst),
                )
            return
        except SerializationFailure:
            time.sleep(0.01 * (2 ** attempt) + random.random() * 0.01)
    raise RuntimeError("transfer failed after retries")
```

## code.javascript
```javascript
// Optimistic locking via version column — prevents lost updates at READ COMMITTED.
async function updateProfile(pg, userId, patch) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { rows } = await pg.query(
      "SELECT name, version FROM users WHERE id = $1", [userId]
    );
    if (!rows.length) throw new Error("not found");
    const cur = rows[0];
    const next = { ...cur, ...patch };

    const res = await pg.query(
      "UPDATE users SET name = $1, version = version + 1 " +
      "WHERE id = $2 AND version = $3",
      [next.name, userId, cur.version]
    );
    if (res.rowCount === 1) return next;
    // someone else updated; retry
  }
  throw new Error("update failed after retries");
}
```

## code.java
```java
// MySQL InnoDB: SELECT ... FOR UPDATE inside a tx prevents lost updates.
public void incrementCounter(Connection c, long id) throws SQLException {
    c.setAutoCommit(false);
    c.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);
    try (var ps = c.prepareStatement(
        "SELECT value FROM counters WHERE id = ? FOR UPDATE"
    )) {
        ps.setLong(1, id);
        try (var rs = ps.executeQuery()) {
            rs.next();
            long v = rs.getLong(1);
            try (var up = c.prepareStatement(
                "UPDATE counters SET value = ? WHERE id = ?"
            )) {
                up.setLong(1, v + 1);
                up.setLong(2, id);
                up.executeUpdate();
            }
        }
    }
    c.commit();
}
```

## code.cpp
```cpp
// libpqxx: retry loop for SSI serialization failures.
#include <pqxx/pqxx>

bool transfer_once(pqxx::connection& c, int from, int to, int amt) {
    try {
        pqxx::work tx(c);
        tx.exec("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
        tx.exec_params(
            "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
            amt, from);
        tx.exec_params(
            "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
            amt, to);
        tx.commit();
        return true;
    } catch (const pqxx::serialization_failure&) {
        return false;
    }
}

void transfer(pqxx::connection& c, int from, int to, int amt) {
    for (int i = 0; i < 5; ++i) if (transfer_once(c, from, to, amt)) return;
    throw std::runtime_error("retries exhausted");
}
```
