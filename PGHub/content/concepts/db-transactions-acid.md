---
slug: db-transactions-acid
module: databases
title: Transactions and ACID
subtitle: How a database lets many users hammer the same rows at once without corrupting them — and what breaks when isolation is too loose.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 13
prereqs: [db-relational-model]
relatedProblems: []
references:
  - title: "CMU 15-445 — Concurrency Control & Isolation (Lectures 15-16)"
    url: "https://15445.courses.cs.cmu.edu/fall2023/notes/15-concurrencycontrol.pdf"
    type: course
  - title: "PostgreSQL Documentation — Transaction Isolation"
    url: "https://www.postgresql.org/docs/current/transaction-iso.html"
    type: docs
  - title: "Berenson et al. — A Critique of ANSI SQL Isolation Levels (1995)"
    url: "https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-95-51.pdf"
    type: paper
status: published
---

## intro
A **transaction** is a group of reads and writes that the database treats as a single, indivisible unit of work: either every step takes effect, or none does. The classic example is a bank transfer — debit one account, credit another. If the system crashes after the debit but before the credit, money vanishes. A transaction guarantees that cannot happen: the two writes commit together or the whole thing rolls back as if it never started. The properties that make this guarantee precise are summarized by the acronym **ACID** — Atomicity, Consistency, Isolation, Durability — and the hardest of the four, by far, is **Isolation**: keeping concurrent transactions from corrupting each other's view of the data.

## whyItMatters
The moment more than one user touches a database at the same time — which is every real application — you have a concurrency problem. Two people buy the last concert ticket; two requests increment the same counter; an analytics job reads a table while a writer updates it. Without transactions and isolation, these interleavings silently corrupt data: counters lose increments, inventory goes negative, reports show numbers that never existed at any single instant. ACID is the contract that lets you reason about correctness *as if* your transaction ran alone, even though hundreds run concurrently. Choosing the isolation level is one of the highest-leverage and most misunderstood decisions in backend engineering: too loose and you get subtle, irreproducible data-corruption bugs that only appear under load; too strict and throughput collapses under lock contention or transactions abort with serialization errors you must retry. Understanding exactly which anomaly each level prevents is what lets you pick correctly instead of cargo-culting `SERIALIZABLE` everywhere or shipping `READ UNCOMMITTED` and praying.

## intuition
Take ACID one letter at a time. **Atomicity** is all-or-nothing: the transfer's debit and credit are one bundle, and a crash or error in the middle rolls back every change so the database never shows a half-finished state. **Consistency** means a transaction moves the database from one valid state to another — every constraint (foreign keys, uniqueness, checks) holds before and after; the transaction is not allowed to commit a state that violates the rules. **Durability** means once the database says "committed," the data survives a power loss — it has been written to a durable log on disk, so a crash one millisecond later loses nothing.

**Isolation** is the subtle one, and it is really a dial, not a switch. Concurrent transactions interleave their reads and writes, and certain interleavings produce **anomalies** — outcomes impossible if the transactions had run one-at-a-time. The three classic anomalies: a **dirty read** is reading another transaction's uncommitted change, which may then roll back, so you acted on data that never officially existed. A **non-repeatable read** is reading the same row twice in one transaction and getting different values, because another transaction committed an update in between. A **phantom read** is running the same range query twice and getting different *rows*, because another transaction inserted or deleted matching rows. A **lost update** is two transactions reading the same value, both adding to it, and both writing back — one increment silently overwrites the other.

The SQL standard defines four **isolation levels**, each forbidding more anomalies at the cost of more locking/conflict-checking: **READ UNCOMMITTED** allows dirty reads (almost never what you want); **READ COMMITTED** forbids dirty reads but still allows non-repeatable and phantom reads (the common default); **REPEATABLE READ** additionally forbids non-repeatable reads; **SERIALIZABLE** forbids all anomalies — the result is guaranteed equivalent to *some* serial order, as if no concurrency existed. The mental model: pick the loosest level whose forbidden anomalies cover the bugs your workload can actually hit, because each step up the ladder costs throughput.

## visualization
```
LOST UPDATE under READ COMMITTED (counter starts at 100):
  T1: READ count -> 100 ............................. WRITE 100+1 = 101 -> COMMIT
  T2: ........... READ count -> 100 ... WRITE 100+1 = 101 -> COMMIT ...........
  result: 101.  Two increments, one survived. One update was LOST.

PREVENTED (atomic UPDATE, or SELECT ... FOR UPDATE locks the row):
  T1: UPDATE count = count+1 (locks row) -> 101 -> COMMIT
  T2: ........................ (waits) ... UPDATE count = count+1 -> 102 -> COMMIT
  result: 102.  Correct.

DIRTY READ (forbidden at READ COMMITTED and above):
  T1: UPDATE balance = 0  ......... (later) ROLLBACK
  T2: ....... READ balance -> 0  -> acts on a value that never committed.  BUG.
```

## bruteForce
The naive approach to concurrency is a single global lock: serialize everything by letting only one transaction run at a time. This is trivially correct — there are no interleavings, so no anomalies — and it is exactly how the strictest reading of `SERIALIZABLE` behaves in the worst case. But it throws away all parallelism: a thousand clients queue behind one, throughput collapses to the latency of a single transaction, and the database is idle while connections wait. The slightly-less-naive version, coarse table-level locking, still serializes any two transactions that touch the same table even when they touch *different rows*. These approaches trade correctness for throughput at a brutal exchange rate. They are the baseline the real machinery improves on: the goal is to allow as much concurrency as possible while still forbidding the specific anomalies that matter.

## optimal
Real databases get correctness *and* concurrency through finer-grained schemes. **Two-phase locking (2PL)** acquires shared (read) and exclusive (write) locks per row and holds them until commit, so conflicting transactions block only when they actually touch the same row — and it provably yields serializable schedules. **Multi-Version Concurrency Control (MVCC)**, used by Postgres and Oracle, is the modern default: each write creates a new *version* of the row, and each transaction reads from a consistent **snapshot** taken at its start, so readers never block writers and writers never block readers. Under MVCC, `READ COMMITTED` reads the latest committed version per statement; `REPEATABLE READ` / snapshot isolation reads one frozen snapshot for the whole transaction; `SERIALIZABLE` adds conflict detection (in Postgres, *Serializable Snapshot Isolation*) that aborts a transaction if its interleaving could not have occurred serially — you then retry. The engineering discipline: choose the loosest isolation level that forbids the anomalies your workload can suffer, guard read-modify-write patterns with an atomic `UPDATE ... SET x = x + 1` or `SELECT ... FOR UPDATE` rather than read-then-write in app code, and design your code to **retry** serialization failures.

```sql
-- Atomic increment: no lost update, no read-modify-write race.
UPDATE counters SET value = value + 1 WHERE id = 1;

-- Explicit transaction with a chosen isolation level.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;   -- lock the row
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- atomic + durable: both updates land, or neither does

-- Under SERIALIZABLE you must be ready to retry on a serialization failure:
-- the engine may abort one transaction with SQLSTATE 40001; re-run it.
```

## complexity
time: With row-level locking or MVCC, concurrency cost is proportional to the actual conflicts, not the number of transactions — non-conflicting transactions run fully in parallel. A naive global lock is O(transactions) serialized.
space: MVCC keeps multiple row versions until no snapshot needs them, costing extra storage and requiring background cleanup (vacuum/garbage collection). 2PL keeps a lock table proportional to held locks.
notes: Stricter isolation costs throughput via more blocking (2PL) or more aborts-and-retries (SSI). READ COMMITTED is the usual default; step up only for the specific anomaly your workload hits. The four levels are defined by which of {dirty, non-repeatable, phantom} reads they forbid.

## pitfalls
- Read-modify-write in application code. `x = SELECT value; UPDATE SET value = x + 1` is a lost-update bug under any level below SERIALIZABLE. Use `UPDATE SET value = value + 1` or `SELECT ... FOR UPDATE` so the database serializes the increment.
- Assuming the default level prevents more than it does. Most databases default to READ COMMITTED, which still permits non-repeatable and phantom reads. If you need a stable view across multiple queries, you must explicitly request REPEATABLE READ or SERIALIZABLE.
- Forgetting to retry serialization failures. SERIALIZABLE (and REPEATABLE READ on some engines) can abort a transaction with a serialization error under contention. Code that does not catch and retry SQLSTATE 40001 will surface these as random user-facing errors.
- Long-running transactions. Holding a transaction open (especially with locks, or under MVCC) blocks other writers or bloats version storage and stalls vacuum. Keep transactions short; never wait on user input or a network call inside one.
- Confusing isolation with durability or atomicity. A higher isolation level does not make commits more durable, and it does not undo a half-done transaction — atomicity (rollback) and durability (the write-ahead log) are separate guarantees from isolation.

## interviewTips
- Recite ACID with the bank transfer: atomicity = both writes or neither, consistency = constraints hold, isolation = concurrent transactions do not corrupt each other, durability = committed survives a crash. Then say isolation is the hard one.
- Map each isolation level to the anomaly it forbids: READ UNCOMMITTED allows dirty reads, READ COMMITTED forbids them, REPEATABLE READ also forbids non-repeatable reads, SERIALIZABLE forbids phantoms too. Naming the anomaly per level is the signal of real understanding.
- For a lost-update / counter question, jump straight to "atomic UPDATE or SELECT FOR UPDATE, and choose isolation deliberately" — and mention MVCC lets readers and writers not block each other.

## keyTakeaways
- A transaction is an all-or-nothing unit; ACID = Atomicity (rollback on failure), Consistency (constraints hold), Isolation (concurrency safety), Durability (committed data survives a crash).
- Isolation is a dial: each level forbids more anomalies — dirty read, non-repeatable read, phantom read, lost update — at the cost of more blocking or more retries; pick the loosest level that covers your workload's real risks.
- Never read-modify-write in app code: use an atomic UPDATE or SELECT ... FOR UPDATE, keep transactions short, and retry serialization failures. MVCC (versioned rows + snapshots) is how modern engines give correctness without readers blocking writers.

## code.sql
```sql
-- Atomic read-modify-write: the engine serializes the increment, no lost update.
UPDATE inventory SET stock = stock - 1 WHERE sku = 'A1' AND stock > 0;

-- A money transfer as one atomic, isolated, durable unit.
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- If either UPDATE violates a CHECK (balance >= 0), the whole transaction rolls back.

-- Pessimistic lock for a read-then-decide flow (e.g. reserving the last seat):
BEGIN;
  SELECT seats_left FROM events WHERE id = 7 FOR UPDATE;  -- block other writers
  UPDATE events SET seats_left = seats_left - 1 WHERE id = 7;
COMMIT;
```

## code.python
```python
# Demonstrating a LOST UPDATE and its fix, with a parameterized client.
# (psycopg-style pseudocode; the point is the pattern, not the driver.)

# BUG: read-modify-write in Python — two concurrent runs can lose an increment.
def increment_bad(conn, counter_id):
    cur = conn.cursor()
    cur.execute("SELECT value FROM counters WHERE id = %s", (counter_id,))
    value = cur.fetchone()[0]                       # both transactions read 100
    cur.execute("UPDATE counters SET value = %s WHERE id = %s", (value + 1, counter_id))
    conn.commit()                                   # both write 101 -> one lost

# FIX: let the database do the arithmetic atomically.
def increment_good(conn, counter_id):
    cur = conn.cursor()
    cur.execute("UPDATE counters SET value = value + 1 WHERE id = %s", (counter_id,))
    conn.commit()                                   # serialized by the row lock

# FIX for serializable workloads: retry on a serialization failure (SQLSTATE 40001).
def with_retry(fn, conn, *args, attempts=3):
    for _ in range(attempts):
        try:
            return fn(conn, *args)
        except Exception as e:
            if "40001" in str(e):
                conn.rollback(); continue           # transient conflict: retry
            raise
    raise RuntimeError("too many serialization conflicts")
```

## code.java
```java
// Atomic increment + explicit isolation level via JDBC.
import java.sql.*;

public class Transfer {
    static void increment(Connection conn, int counterId) throws SQLException {
        // Let the database serialize the read-modify-write — no lost update.
        try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE counters SET value = value + 1 WHERE id = ?")) {
            ps.setInt(1, counterId);
            ps.executeUpdate();
        }
    }

    static void transfer(Connection conn, int from, int to, int cents) throws SQLException {
        conn.setAutoCommit(false);
        conn.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);
        try (PreparedStatement debit = conn.prepareStatement(
                 "UPDATE accounts SET balance = balance - ? WHERE id = ?");
             PreparedStatement credit = conn.prepareStatement(
                 "UPDATE accounts SET balance = balance + ? WHERE id = ?")) {
            debit.setInt(1, cents);  debit.setInt(2, from);  debit.executeUpdate();
            credit.setInt(1, cents); credit.setInt(2, to);   credit.executeUpdate();
            conn.commit();                         // atomic + durable
        } catch (SQLException e) {
            conn.rollback();                       // atomicity: undo everything
            throw e;
        }
    }
}
```
