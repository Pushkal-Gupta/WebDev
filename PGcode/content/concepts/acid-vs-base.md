---
slug: acid-vs-base
module: cs-core
title: ACID vs BASE
subtitle: Strict transactional guarantees vs eventual consistency — when each model wins and what trade-offs you accept.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 7: Transactions"
    url: "https://dataintensive.net/"
    type: book
  - title: "Martin Fowler — CAP and the BASE Architecture"
    url: "https://martinfowler.com/articles/microservice-trade-offs.html"
    type: blog
  - title: "donnemartin/system-design-primer — Consistency Patterns"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
ACID — Atomicity, Consistency, Isolation, Durability — describes the strict guarantees a classical RDBMS gives every transaction: either all writes commit or none do, every constraint holds at commit time, concurrent transactions appear to run one at a time, and committed data survives a crash. BASE — Basically Available, Soft state, Eventually consistent — describes the opposite design choice made by many distributed stores (DynamoDB, Cassandra, S3): always answer, accept stale reads, and converge later. The two acronyms are not a spectrum so much as opposing reactions to the CAP theorem.

## whyItMatters
Almost every system-design interview boils down to "what consistency do you need?" Choose ACID when correctness matters more than availability — banking, inventory, billing, anything where a wrong number is unrecoverable. Choose BASE when scale and availability dominate and the business tolerates short windows of staleness — social feeds, like counts, view counts, product reviews, search indexes. Mixing the two consciously (ACID for the ledger, BASE for the analytics fan-out) is the mark of a senior engineer.

## intuition
ACID is a notary public: every write is witnessed, stamped, and recorded; you wait in line, but the record is unimpeachable. BASE is a gossip network: tell anyone, they tell everyone, eventually everyone has the same story — but mid-gossip, different people quote different versions. The notary blocks if disconnected (CP); the gossip never blocks (AP). Neither is "wrong" — they answer different questions, and many real architectures use one model for the source of truth and the other for derived views.

## visualization
Bank transfer (ACID, single Postgres node):

```
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;  -- both succeed or neither does; no other tx sees the half-state
```

Social-graph follow (BASE, Cassandra):

```
INSERT INTO follows (follower, followee) VALUES ('A', 'B');  -- replica 1: ok
                                                              -- replica 2: pending
read from replica 2 a moment later -> may not see the row yet
read from replica 2 a second later -> sees it (converged)
```

## bruteForce
"Force every system to be ACID." Wrap every microservice call in a distributed transaction (2PC, XA). It "works" but every service-to-service call becomes a coordinated commit, latency goes up, and any participant crash blocks the rest. Throughput collapses, the system becomes brittle. The pre-NoSQL era discovered this and is why patterns like Sagas (compensating transactions) and outbox-based eventual consistency replaced 2PC for cross-service workflows.

## optimal
- Keep ACID *within* a service boundary (Postgres, MySQL InnoDB, SQL Server). Use a single transaction per use case for invariants that must hold (orders + payments, inventory decrement + reservation).
- Use BASE *across* service boundaries (Kafka outbox, eventual replication to read-replicas, CDC to a search index). Reach for the **Saga pattern** (orchestrated or choreographed) for multi-service workflows with compensating actions on failure.
- Where availability matters more than latency, pick AP stores (DynamoDB, Cassandra, Riak) and design the application for idempotent writes + last-write-wins or CRDT-style merges.
- Where correctness matters most, pick CP stores (Postgres, Spanner, CockroachDB). Spanner and CockroachDB give you ACID *across* shards using Paxos/Raft — they are the modern "have both" answer, at the price of higher write latency.

## complexity
time: ACID commit — disk fsync per group commit, ~100–500 µs. BASE write — local memory + async replication, ~µs. Read latency — comparable for both within one datacenter; ACID's coordination shows up under contention.
space: ACID — write-ahead log proportional to changes. BASE — version vectors / vector clocks / hinted handoff queues add per-record overhead.
notes: CAP says under a partition you can have C or A but not both. PACELC adds: even *without* a partition you trade Latency for Consistency. Spanner accepts higher latency to give you C; DynamoDB accepts staleness to give you A and low L.

## pitfalls
- Believing BASE means "no consistency." It means *eventual* consistency — given enough time and no further writes, replicas converge.
- Using 2PC across microservices because it sounds principled. It introduces a coordinator SPOF and blocking-on-failure; Sagas are almost always the better answer.
- Letting a NoSQL "ACID per item" guarantee (DynamoDB, Mongo single-doc) fool you into thinking the whole system is ACID. Multi-key invariants need an extra layer.
- Reading from a replica and writing to the primary without a read-your-writes guard — users see their own update "disappear" until replication catches up.
- Conflating Isolation levels (read-committed vs serializable) with consistency models (linearizable vs eventual). They live on different axes.

## interviewTips
- Name the guarantee, not the technology: "I need linearizable reads for the order id" beats "I'd use Postgres."
- For "design WhatsApp," mention message *causal* consistency (sender's order preserved per chat) — between ACID and pure eventual.
- Quote Brewer / CAP correctly: under a network partition, choose between C and A. Without a partition, no trade-off applies *from CAP* — but PACELC adds latency.
- Drop "Saga + outbox + idempotency keys" as the canonical pattern for cross-service workflows.
- Spanner / CockroachDB / FoundationDB are the modern "ACID at scale" answer — externally consistent via TrueTime or HLCs.

## code.python
```python
# ACID transaction in Postgres via psycopg
import psycopg

with psycopg.connect("dbname=bank") as conn:
    with conn.transaction():                          # SERIALIZABLE on this conn
        conn.execute(
            "UPDATE accounts SET balance = balance - %s WHERE id = %s",
            (100, 1),
        )
        conn.execute(
            "UPDATE accounts SET balance = balance + %s WHERE id = %s",
            (100, 2),
        )
        # COMMIT on context exit; ROLLBACK on any exception
```

## code.javascript
```javascript
// BASE write to DynamoDB with idempotency key
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});

async function recordView(userId, postId, idempotencyKey) {
  await ddb.send(new PutItemCommand({
    TableName: "post_views",
    Item: {
      pk: { S: `post#${postId}` },
      sk: { S: `view#${idempotencyKey}` },     // dedup on retry
      user: { S: userId },
      at: { N: String(Date.now()) },
    },
    ConditionExpression: "attribute_not_exists(sk)", // first writer wins
  }));
}
// Eventual: aggregate view-count materialized later by a stream consumer.
```

## code.java
```java
// Saga step with idempotent compensation
public class TransferSaga {
    void run(String from, String to, BigDecimal amount, String idemKey) {
        try {
            payments.debit(from, amount, idemKey);          // step 1
            payments.credit(to,  amount, idemKey);          // step 2
            ledger.append(from, to, amount, idemKey);       // step 3
        } catch (Exception e) {
            payments.refund(to,  amount, idemKey + ":r2");  // compensate 2
            payments.refund(from, amount, idemKey + ":r1"); // compensate 1
            throw e;
        }
    }
}
```

## code.cpp
```cpp
// libpqxx: serializable transaction with retry on 40001 (could not serialize access)
#include <pqxx/pqxx>

void transfer(pqxx::connection& c, int from, int to, int amount) {
    for (int attempt = 0; attempt < 5; ++attempt) {
        try {
            pqxx::work tx(c, "transfer");
            tx.exec_params("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
            tx.exec_params("UPDATE accounts SET balance = balance - $1 WHERE id = $2",
                           amount, from);
            tx.exec_params("UPDATE accounts SET balance = balance + $1 WHERE id = $2",
                           amount, to);
            tx.commit();
            return;
        } catch (const pqxx::serialization_failure&) {
            continue;  // retry: another tx invalidated our snapshot
        }
    }
    throw std::runtime_error("transfer failed after retries");
}
```
