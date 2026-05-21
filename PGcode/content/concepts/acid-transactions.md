---
slug: acid-transactions
module: cs-core
title: ACID Transactions
subtitle: Atomicity, Consistency, Isolation, Durability — the four guarantees that make databases trustworthy.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Gray & Reuter — Transaction Processing"
    url: ""
status: published
---

## intro
A database transaction is a group of operations that should appear to happen as a single, indivisible unit. ACID is the four-letter contract a relational DB makes about what "indivisible" means: Atomicity, Consistency, Isolation, Durability. Every senior backend interview asks about at least one of them.

## whyItMatters
Money transfer is the classic example: debit one account, credit another. If the second step fails, you can't be left with the first step committed — atomicity rules that out. Without isolation, two concurrent transfers can read each other's mid-flight state and corrupt balances. Without durability, a crash one millisecond after commit can lose the entire transaction. ACID is what lets you reason about correctness without enumerating every race condition.

## intuition
- **Atomicity**: all-or-nothing. The DB either commits every write in the transaction or none of them.
- **Consistency**: every transaction takes the DB from one valid state to another. Foreign keys, unique constraints, check constraints are all enforced at commit.
- **Isolation**: concurrent transactions see results equivalent to *some* serial order. Different isolation levels relax this in exchange for throughput.
- **Durability**: once the DB says "committed," that data survives a power loss.

## visualization
```
Time ─►
T1:  BEGIN  debit(A,100)  credit(B,100)  COMMIT  ✓
T2:               BEGIN  read(A)  ...  COMMIT  (sees A pre-T1 OR post-T1, never half)
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
