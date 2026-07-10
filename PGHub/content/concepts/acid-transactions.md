---
slug: acid-transactions
module: cs-db-transactions
title: ACID Transactions
subtitle: Atomicity, Consistency, Isolation, Durability — the four guarantees that make databases trustworthy.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Operating Systems: Three Easy Pieces"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Jepsen — Distributed-systems consistency analyses"
    url: "https://jepsen.io/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A database transaction is a group of operations that should appear to happen as a single, indivisible unit. ACID is the four-letter contract a relational DB makes about what "indivisible" means: Atomicity, Consistency, Isolation, Durability. Every senior backend interview asks about at least one of them.

## whyItMatters
Money transfer is the classic example: debit one account, credit another. If the second step fails, you can't be left with the first step committed — atomicity rules that out. Without isolation, two concurrent transfers can read each other's mid-flight state and corrupt balances. Without durability, a crash one millisecond after commit can lose the entire transaction. ACID is what lets you reason about correctness without enumerating every race condition.

## intuition
Think of ACID as the contract a bank teller silently honors every time you move money. You hand over a slip that says "take 100 from savings, add 100 to checking." You never worry that the teller will pull the 100 out, get distracted, and forget to put it back — that impossibility is atomicity. You never worry that a second customer, served at the same window a millisecond later, will glimpse your account mid-move and copy down a balance that never really existed — that is isolation. And once the teller stamps the receipt, a power cut in the branch does not un-happen your deposit — that is durability. Consistency is the rulebook underneath: the branch's books must always balance, so a transaction that would leave assets ≠ liabilities is rejected outright.

Make it concrete. An account table holds A = 500, B = 300. A transfer of 100 from A to B is two writes: A ← 400, then B ← 400. Suppose 200 concurrent transfers hit these two rows per second. Without atomicity, a crash between the two writes leaves A = 400, B = 300 — 100 currency units vanish. Without isolation, transfer X reads A = 500 while transfer Y is halfway through, both compute new balances from the same stale 500, and one update is silently lost. ACID is the set of guarantees that let you write those two UPDATE lines and reason about them as one indivisible step, ignoring the thousands of interleavings the database is actually juggling underneath.

- **Atomicity**: all-or-nothing. The DB either commits every write in the transaction or none of them.
- **Consistency**: every transaction takes the DB from one valid state to another. Foreign keys, unique constraints, check constraints are all enforced at commit.
- **Isolation**: concurrent transactions see results equivalent to *some* serial order. Different isolation levels relax this in exchange for throughput.
- **Durability**: once the DB says "committed," that data survives a power loss.

## visualization
```
Two transfers race on accounts A (500) and B (300). WAL append precedes commit:

Time ─►
T1: BEGIN  read A=500  A<-400  read B=300  B<-400  fsync(WAL)  COMMIT ✓
T2:      BEGIN  read A --(blocked on A's row lock)-- read A=400  B<-500  COMMIT ✓
WAL:  [ ..., T1:A=400, T1:B=400, COMMIT(T1), T2:..., COMMIT(T2) ]
crash AFTER  COMMIT(T1) fsync -> replay WAL -> A=400,B=400 survive  (durability)
crash BEFORE COMMIT(T1)       -> T1 absent from WAL -> A=500,B=300  (atomicity)
T2 sees A fully pre-T1 OR fully post-T1, never the half-state     (isolation)
```

## bruteForce
Just write to files directly with no transactions. Works at toy scale; corrupts data the first time you have a partial failure or concurrent writer.

## optimal
Pick an **isolation level** consciously:

- **Read uncommitted**: can read others' uncommitted changes (dirty reads). Avoid.
- **Read committed**: only sees committed data. Default in PostgreSQL, Oracle.
- **Repeatable read**: sees a consistent snapshot for the duration of the transaction. Default in MySQL InnoDB.
- **Serializable**: behaves as if all transactions ran one at a time. Strongest, slowest.

Higher levels prevent more anomalies (dirty reads, non-repeatable reads, phantom reads) but reduce concurrency. Most apps run at read-committed and add explicit locks (`SELECT ... FOR UPDATE`) on the few operations that need stronger guarantees.

Durability is usually delivered via a **write-ahead log (WAL)**: changes are appended to a log on disk before the data pages are modified. On crash, replay the log from the last checkpoint.

The core tradeoff is **isolation strength vs. concurrency**: each step up the ladder eliminates an anomaly class but serializes more work, so contention on hot rows rises and their throughput falls. Reach for serializable only where a correctness invariant spans multiple rows the application reads then writes (the classic write-skew shape); everywhere else, read-committed plus a targeted `SELECT ... FOR UPDATE` on the contended row is cheaper and just as safe. The dominant failure mode at high isolation is not wrong data but *aborts*: under serializable the engine may reject a transaction with a serialization failure, and the client must catch it and retry with backoff — code that forgets the retry loop turns a throughput problem into a user-visible error. The other failure mode is the long transaction that holds locks or pins snapshot versions for seconds, stalling every writer behind it. Keep transactions short, do no network I/O between BEGIN and COMMIT, and push slow work outside the transaction boundary.

## complexity
- **Throughput cost**: serializable can cut throughput by 5–10× vs. read committed on hot keys.
- **Latency cost**: synchronous WAL flush adds disk-write latency to every commit; group commit amortizes.
- **Storage**: WAL needs its own disk budget — ~1.5–2× of churn in flight at any moment.

## pitfalls
- **Long transactions**: holding a row lock for seconds kills concurrency. Commit fast.
- **Read-modify-write race**: `SELECT balance; balance += 100; UPDATE balance = ...` without locking or optimistic concurrency control will lose updates.
- **"Eventually consistent" mistaken for ACID**: distributed systems often relax ACID — call it out.
- **Implicit transactions**: many ORMs autocommit each statement. Be explicit about transaction boundaries for multi-statement operations.

## interviewTips
- Always be able to name and define each ACID letter on demand.
- For "transfer money" or "process order" prompts, lead with ACID and mention idempotency.
- Compare with **BASE** (Basically Available, Soft state, Eventually consistent) — the AP-side relaxation in NoSQL.
- Mention **write-ahead log** as the standard implementation of durability.

## code.python
```python
# Sketch — psycopg2/asyncpg syntax similar.
def transfer(conn, from_id, to_id, amount):
    with conn:                                  # context manager = BEGIN ... COMMIT/ROLLBACK
        with conn.cursor() as cur:
            cur.execute("UPDATE accounts SET balance = balance - %s WHERE id = %s AND balance >= %s",
                        (amount, from_id, amount))
            if cur.rowcount != 1:
                raise ValueError("insufficient funds")
            cur.execute("UPDATE accounts SET balance = balance + %s WHERE id = %s",
                        (amount, to_id))
```

## code.javascript
```javascript
// node-postgres
async function transfer(client, fromId, toId, amount) {
  await client.query('BEGIN');
  try {
    const r = await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1',
      [amount, fromId]
    );
    if (r.rowCount !== 1) throw new Error('insufficient funds');
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}
```

## code.java
```java
void transfer(Connection conn, long fromId, long toId, long amount) throws Exception {
    conn.setAutoCommit(false);
    try (PreparedStatement debit = conn.prepareStatement(
            "UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?");
         PreparedStatement credit = conn.prepareStatement(
            "UPDATE accounts SET balance = balance + ? WHERE id = ?")) {
        debit.setLong(1, amount); debit.setLong(2, fromId); debit.setLong(3, amount);
        if (debit.executeUpdate() != 1) throw new RuntimeException("insufficient funds");
        credit.setLong(1, amount); credit.setLong(2, toId);
        credit.executeUpdate();
        conn.commit();
    } catch (Exception e) {
        conn.rollback();
        throw e;
    }
}
```

## code.cpp
```cpp
// Pseudo — libpqxx
void transfer(pqxx::connection& c, long from, long to, long amount) {
    pqxx::work tx(c);
    auto r = tx.exec_params(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1",
        amount, from);
    if (r.affected_rows() != 1) throw std::runtime_error("insufficient funds");
    tx.exec_params("UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, to);
    tx.commit();
}
```
