---
slug: acid-vs-base
module: cs-db-transactions
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

Ground it in numbers. Say your service does 200k reads/sec and 5k writes/sec across three datacenters. Under an ACID/CP store like a single-region Postgres or Spanner, a write to the order ledger waits for a quorum to durably ack — perhaps 8–15 ms cross-AZ, more cross-region — but every subsequent read is guaranteed to see it. Under a BASE/AP store like Cassandra at consistency ONE, that same write returns in under a millisecond to the nearest replica and gossips outward; a read hitting a lagging replica 20–200 ms later may still return the old value. For a bank balance, that 200 ms stale window is a defect you cannot ship. For a "likes" counter or a viewer count, it is invisible to users and buys you an order of magnitude more availability and throughput. The senior move is to notice that one product surface contains both: the money ledger wants ACID, the engagement metrics fanned out from it want BASE, and you route each to the store that matches its consistency need instead of forcing one model on the whole system.

## visualization
Same logical op, two consistency models, side by side:

```
ACID (single Postgres node)              BASE (Cassandra, CL=ONE, N=3)
---------------------------------        ---------------------------------
BEGIN;                                   INSERT follows(A,B) -> replica1: OK  (t=0ms)
 UPDATE accounts SET bal=bal-100 id=1                        -> replica2: pending
 UPDATE accounts SET bal=bal+100 id=2    read replica2 @t=1ms  -> row NOT visible (stale)
COMMIT;  -- both writes durable --       gossip replicates ...        (t~5ms)
 no tx ever sees the half-state          read replica2 @t=50ms -> row visible (converged)
result: linearizable, waits on fsync     result: available always, converges eventually
```

## bruteForce
"Force every system to be ACID." Wrap every microservice call in a distributed transaction (2PC, XA). It "works" but every service-to-service call becomes a coordinated commit, latency goes up, and any participant crash blocks the rest. Throughput collapses, the system becomes brittle. The pre-NoSQL era discovered this and is why patterns like Sagas (compensating transactions) and outbox-based eventual consistency replaced 2PC for cross-service workflows.

## optimal
- Keep ACID *within* a service boundary (Postgres, MySQL InnoDB, SQL Server). Use a single transaction per use case for invariants that must hold (orders + payments, inventory decrement + reservation).
- Use BASE *across* service boundaries (Kafka outbox, eventual replication to read-replicas, CDC to a search index). Reach for the **Saga pattern** (orchestrated or choreographed) for multi-service workflows with compensating actions on failure.
- Where availability matters more than latency, pick AP stores (DynamoDB, Cassandra, Riak) and design the application for idempotent writes + last-write-wins or CRDT-style merges.
- Where correctness matters most, pick CP stores (Postgres, Spanner, CockroachDB). Spanner and CockroachDB give you ACID *across* shards using Paxos/Raft — they are the modern "have both" answer, at the price of higher write latency.

The through-line: pick the consistency model per **invariant**, not per system. Any invariant whose violation is unrecoverable — money, inventory that cannot go negative, a unique username — belongs inside one ACID transaction on one store. Any state that is derived, aggregated, or cosmetic — counts, feeds, search indexes, recommendations — tolerates BASE and should never hold up a write on the critical path. The dominant failure mode of over-choosing ACID is coupling: a 2PC or distributed lock across services means one slow or crashed participant blocks all of them, and tail latency becomes the max over every hop. The dominant failure mode of over-choosing BASE is the silent stale read — a user updates their profile, a load-balanced read hits a lagging replica, and their own change appears to vanish. Guard the first with sagas plus idempotency keys; guard the second with read-your-writes routing (pin the user to the primary or a session-consistent replica for a few seconds after they write). Spanner and CockroachDB are the "refuse to choose" answer: ACID across shards via Paxos/Raft and synchronized clocks, paying higher write latency to give you strong consistency at scale.

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
