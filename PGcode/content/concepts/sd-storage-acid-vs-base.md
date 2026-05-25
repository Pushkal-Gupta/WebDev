---
slug: sd-storage-acid-vs-base
module: sd-storage
title: ACID vs BASE
subtitle: Two opposite consistency philosophies — strict atomic transactions (ACID) vs eventually-consistent availability (BASE). The crucial database choice every architecture makes.
difficulty: Intermediate
position: 69
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Transactions chapter"
    url: "https://dataintensive.net/"
    type: book
  - title: "highscalability — ACID vs BASE"
    url: "http://highscalability.com/blog/2008/9/24/acid-base-cap.html"
    type: blog
  - title: "donnemartin/system-design-primer — ACID vs BASE"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
**ACID** (Atomicity, Consistency, Isolation, Durability) — the strict transactional guarantees of traditional RDBMSes (Postgres, MySQL, Oracle). **BASE** (Basically Available, Soft state, Eventually consistent) — the relaxed approach of NoSQL (DynamoDB, Cassandra, Riak). The choice fundamentally shapes application code, failure modes, and operational complexity.

## whyItMatters
- **Bank transfer**: must be ACID — debit + credit atomic; partial = lost money.
- **Social feed**: BASE — eventual consistency is fine; users tolerate seeing a like a few seconds late.
- **Inventory** at million-QPS scale: pick BASE + reconcile, or ACID + accept lower throughput.
- **Distributed transactions** (Saga pattern) emerge specifically because cross-service ACID is too expensive.
- Knowing which a system needs is the single most consequential design decision.

## intuition
**ACID** properties:
- **Atomicity**: all-or-nothing transactions. Failure rolls back everything.
- **Consistency**: post-commit, all invariants hold (FK constraints, check constraints, balances).
- **Isolation**: concurrent transactions appear serial. Implementation: 2PL, MVCC, OCC.
- **Durability**: committed data survives crash. Implementation: WAL fsync to disk.

**BASE** properties:
- **Basically Available**: respond even if some replicas are down (return stale data instead of erroring).
- **Soft state**: state can change without input due to background sync / eventual convergence.
- **Eventually consistent**: replicas converge to the same value if no new updates.

The trade is well-summarized by **CAP**: in a partition, choose either consistency (ACID) or availability (BASE).

## visualization
```
ACID transfer:
  BEGIN TX
    UPDATE accounts SET balance = balance - 100 WHERE id = A
    UPDATE accounts SET balance = balance + 100 WHERE id = B
  COMMIT (with fsync of WAL — durable)

  Crash mid-transaction? Atomicity: nothing happened. Either both updates land or neither.
  Concurrent transfer A→C at same time? Isolation: serialized, no double-spend.

BASE counter (eventually consistent):
  Replica 1: counter = 42       \
  Replica 2: counter = 42        > all in sync
  Replica 3: counter = 42       /

  Write +1 to Replica 1.
  Replica 1: counter = 43
  Replica 2: counter = 42        (read here returns stale 42)
  Replica 3: counter = 42
  ...async sync...
  All replicas: counter = 43     (eventually consistent)

Conflict resolution under BASE:
  Replica 1: counter = 43 (after my +1)
  Replica 2: counter = 43 (after your +1)
  Sync: which 43 wins? Need CRDT (counter sums) OR last-writer-wins (data loss).
```

## bruteForce
**Try to make NoSQL behave like ACID with manual locks**: usually fails — you re-implement 2PC poorly, lose the NoSQL advantages.

**Use ACID for everything**: works until you need to scale beyond one DB node — then 2PC's cost dominates.

**Use BASE for everything**: works until money is involved — then you have to bolt on Sagas, reconciliation, manual conflict resolution.

The right answer is **per-data-type**: ACID for money + identity + inventory; BASE for analytics + feeds + caches.

## optimal
**Pick per-domain**:

| Data type | ACID or BASE? | Why |
|-----------|---------------|-----|
| Money transactions | ACID | atomicity prevents partial states |
| User identity | ACID | login + auth need strong consistency |
| Inventory (low scale) | ACID | prevent double-sell |
| Inventory (high scale) | BASE + reconciliation | scale beats strict consistency |
| Social feed | BASE | eventual is fine |
| Analytics | BASE | data is statistical anyway |
| Sessions | BASE | recreate on miss |
| Audit log | ACID | must be durable + complete |

**Polyglot persistence**: one app uses multiple databases. Postgres for transactions; Cassandra for feeds; Redis for sessions.

**Saga pattern**: ACID across services without 2PC. Local ACID + compensating actions.

**Idempotency keys**: make BASE retries safe.

**CRDTs**: data types (counters, sets, maps) that converge correctly under concurrent updates — turns BASE into "eventually convergent" with no conflicts.

**Newer engines**: CockroachDB, Spanner, FoundationDB — distributed ACID via Paxos/Raft. Slower than BASE; faster than 2PC; correctness of ACID.

## complexity
- **ACID single-node**: 5-10k tx/sec/node typical (Postgres).
- **ACID distributed (CockroachDB)**: 1-5k tx/sec per node; latency 5-50ms per tx due to consensus.
- **BASE (DynamoDB)**: millions of ops/sec at single-digit-ms latency. No consensus per op.
- **Saga across N services**: latency = sum of step latencies; can be 100ms-seconds.

## pitfalls
- **Assuming ACID by default at distributed scale.** Devs trained on Postgres assume cross-service transactions just work. They don't. Fix: explicitly model service boundaries; reach for Saga or distributed ACID engines only when you've measured the need.
- **BASE without idempotency.** Retries duplicate side effects (double charge). Fix: idempotency keys on every state-changing API.
- **Misusing "eventually consistent" to mean "after milliseconds."** Eventual = no upper bound by definition. Fix: pick a system with bounded staleness if you need a latency SLO on replica convergence (Cosmos DB, DynamoDB with strongly-consistent reads).
- **Using last-write-wins for counters.** LWW loses concurrent updates. Fix: use CRDT counters or atomic increment operations (DynamoDB AddNumber).
- **Forgetting durability of caches.** Treating a write-through cache as durable. Cache layer is BASE; the source-of-truth must be the ACID store. Fix: write to DB first, then cache; never the other way.
- **Cross-region replication latency creates apparent ACID violations.** A user reads stale data after their own write in another region. Fix: read-your-own-writes guarantee — pin reads to the region of the last write for a session.

## interviewTips
- For "do we use SQL or NoSQL" → which guarantees does THIS data need? Money = ACID; analytics = BASE.
- Cite **CAP theorem** as the underlying constraint.
- For senior interviews, discuss **polyglot persistence**, **Saga pattern as ACID alternative**, **CRDTs**, **distributed ACID engines** (Spanner, CockroachDB), **read-your-own-writes session consistency**.

## code.python
```python
# ACID example (Postgres via psycopg2)
import psycopg2
conn = psycopg2.connect(...)
try:
    with conn.cursor() as c:
        c.execute("UPDATE accounts SET balance = balance - 100 WHERE id = %s", (src,))
        c.execute("UPDATE accounts SET balance = balance + 100 WHERE id = %s", (dst,))
    conn.commit()    # atomic: both succeed or neither
except Exception:
    conn.rollback()
    raise

# BASE example (DynamoDB)
import boto3
dynamodb = boto3.client('dynamodb')
dynamodb.put_item(
    TableName='users',
    Item={'user_id': {'S': 'alice'}, 'last_seen': {'N': str(int(time.time()))}}
)
# No transaction; "eventually consistent" read may return stale data
```

## code.javascript
```javascript
// ACID: Postgres via pg
const { Pool } = require('pg');
const pool = new Pool();
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE accounts SET balance = balance - 100 WHERE id = $1', [src]);
  await client.query('UPDATE accounts SET balance = balance + 100 WHERE id = $1', [dst]);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
}

// BASE: DynamoDB single-item put
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({});
await client.send(new PutItemCommand({
  TableName: 'users',
  Item: { user_id: { S: 'alice' }, last_seen: { N: String(Date.now()) } },
}));
```

## code.java
```java
// ACID via JDBC
try (Connection c = ds.getConnection()) {
    c.setAutoCommit(false);
    try (PreparedStatement debit = c.prepareStatement("UPDATE accounts SET balance = balance - 100 WHERE id = ?");
         PreparedStatement credit = c.prepareStatement("UPDATE accounts SET balance = balance + 100 WHERE id = ?")) {
        debit.setLong(1, src); debit.executeUpdate();
        credit.setLong(1, dst); credit.executeUpdate();
        c.commit();
    } catch (Exception e) {
        c.rollback();
        throw e;
    }
}
```

## code.cpp
```cpp
// ACID via libpqxx
pqxx::connection c("dbname=mydb");
pqxx::work tx(c);
tx.exec_params("UPDATE accounts SET balance = balance - 100 WHERE id = $1", src);
tx.exec_params("UPDATE accounts SET balance = balance + 100 WHERE id = $1", dst);
tx.commit();   // atomic
```
