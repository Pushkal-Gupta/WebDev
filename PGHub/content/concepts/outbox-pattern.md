---
slug: outbox-pattern
module: sd-microservices
title: Transactional Outbox Pattern
subtitle: Atomically write to DB + emit a message — by inserting the event into an "outbox" table in the same transaction, then publishing it asynchronously.
difficulty: Intermediate
position: 23
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Microservices.io — Pattern: Transactional outbox"
    url: "https://microservices.io/patterns/data/transactional-outbox.html"
    type: book
  - title: "Martin Fowler — Event-driven architecture"
    url: "https://martinfowler.com/articles/201701-event-driven.html"
    type: blog
  - title: "debezium/debezium — CDC connector reading the outbox"
    url: "https://github.com/debezium/debezium"
    type: repo
status: published
---

## intro
You want to update the database AND emit a Kafka/RabbitMQ event atomically. The naive approach — DB write then message send — can leave the system inconsistent: either the message goes out without the DB change, or the DB commits but the message is lost. The **transactional outbox pattern** solves this: insert the event into an `outbox` table IN THE SAME DB TRANSACTION as the business write. A separate **relay** asynchronously reads the outbox and publishes events to the message broker.

## whyItMatters
This is the standard pattern for **reliable event-driven microservices**:
- **Payment service** writes `payments` table + emits `PaymentCompleted` event.
- **Order service** writes `orders` table + emits `OrderPlaced` event.
- **CDC pipelines** (Debezium → Kafka) read the outbox as a change-data-capture source.

Without it: dual-write inconsistency. With it: at-least-once delivery + idempotency on consumers gives effectively-exactly-once semantics.

## intuition
Two writes — `business_table` + `outbox_table` — happen inside ONE DB transaction. The transaction's ACID guarantee makes them inseparable: either both succeed or neither does.

A separate process (the **relay** or **CDC**) tails the outbox table, publishes each row's event to Kafka/RabbitMQ/SQS, and marks it as `published_at = now()`.

If the relay crashes after publishing but before marking → the event is published twice on restart. Consumers must be idempotent.

## visualization
```
Single transaction:
  BEGIN
    UPDATE accounts SET balance = balance - 100 WHERE user_id = 7;
    INSERT INTO outbox (id, event_type, payload, created_at)
      VALUES (gen_uuid(), 'Withdrawal', '{"user_id":7,"amount":100}', now());
  COMMIT

Relay process (separate worker):
  SELECT * FROM outbox WHERE published_at IS NULL ORDER BY created_at LIMIT 100;
  for each row:
    publish to Kafka (topic = event_type, payload = JSON)
    UPDATE outbox SET published_at = now() WHERE id = row.id;
  (continues every 1s)

CDC alternative (Debezium):
  Reads DB binlog/WAL → emits change events directly to Kafka.
  No relay process needed; outbox table can be small (auto-pruned).
```

## bruteForce
**Dual write** (DB then message broker, separately): not atomic. If DB commits but broker call fails → event lost. If broker call succeeds but DB rollback → phantom event.

**Two-phase commit (XA) across DB + broker**: technically atomic but slow, blocking, and most modern brokers don't support XA cleanly.

**In-memory event queue**: lost on crash. Same problem as dual-write.

## optimal
**Schema** (one table, simple):
```sql
CREATE TABLE outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id TEXT NOT NULL,    -- e.g. account ID
  event_type TEXT NOT NULL,      -- e.g. 'Withdrawal'
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX idx_outbox_unpublished ON outbox (created_at) WHERE published_at IS NULL;
```

**Writer side** (in app code):
```python
with db.transaction():
    update_business_table(args)
    db.execute("INSERT INTO outbox (event_type, payload) VALUES (?, ?)",
               (event_type, json.dumps(payload)))
# tx commits → both writes durable
```

**Relay side** (separate worker, polls every 1s):
```python
def relay_loop():
    while True:
        rows = db.fetch("SELECT * FROM outbox WHERE published_at IS NULL "
                        "ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED")
        for r in rows:
            try:
                kafka.produce(r['event_type'], r['payload'])
                db.execute("UPDATE outbox SET published_at=now() WHERE id=?", (r['id'],))
            except Exception:
                continue  # retry next iteration
        time.sleep(1)
```

`FOR UPDATE SKIP LOCKED` lets multiple relay workers run in parallel without stepping on each other.

**Pruning**: a separate periodic job deletes `WHERE published_at < now() - INTERVAL '7 days'` to keep the outbox small.

## complexity
- **Per write**: +1 DB insert (small overhead).
- **Relay latency**: typically 1-5 sec (polling). For lower latency, use CDC + Kafka Connect / Debezium to stream WAL changes → milliseconds.
- **At-least-once delivery**: messages may be duplicated. Consumers MUST be idempotent.

## pitfalls
- **Forgetting to make consumers idempotent**: at-least-once delivery means duplicates. Use a `processed_event_ids` set on the consumer to dedupe.
- **Outbox table growing unbounded**: schedule pruning.
- **Long-running tx holding outbox locks**: keep transactions short to avoid blocking relay workers.
- **Schema evolution**: payload is JSONB; consumers must handle missing/new fields gracefully (additive changes only).
- **Topic-per-event-type vs single topic**: per-type gives better routing; single topic preserves ordering across event types for one aggregate.

## interviewTips
- For "how do you reliably emit events from a microservice" → outbox pattern.
- Always mention **idempotent consumers** alongside outbox.
- For senior interviews, contrast **polling outbox relay** vs **CDC (Debezium)**: latency tradeoff and ops complexity.
- Mention **inbox pattern** for the consumer side (dedupe `event_id` table on receive).

## code.python
```python
import json, time, uuid
def withdraw(db, user_id, amount):
    with db.transaction():
        db.execute("UPDATE accounts SET balance = balance - ? WHERE user_id = ?",
                   (amount, user_id))
        db.execute("INSERT INTO outbox (id, aggregate_id, event_type, payload) "
                   "VALUES (?, ?, ?, ?)",
                   (str(uuid.uuid4()), str(user_id), 'Withdrawal',
                    json.dumps({'user_id': user_id, 'amount': amount})))

def relay(db, kafka):
    while True:
        rows = db.fetch("SELECT id, event_type, payload FROM outbox "
                        "WHERE published_at IS NULL ORDER BY created_at "
                        "LIMIT 100 FOR UPDATE SKIP LOCKED")
        for r in rows:
            kafka.produce(r['event_type'], r['payload'])
            db.execute("UPDATE outbox SET published_at=now() WHERE id=?", (r['id'],))
        time.sleep(1)
```

## code.javascript
```javascript
// Node + pg
async function withdraw(client, userId, amount) {
  await client.query('BEGIN');
  try {
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE user_id = $2',
                       [amount, userId]);
    await client.query(
      `INSERT INTO outbox (aggregate_id, event_type, payload)
       VALUES ($1, $2, $3)`,
      [String(userId), 'Withdrawal', JSON.stringify({ userId, amount })],
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}
```

## code.java
```java
// Spring + JPA — both writes inside @Transactional
@Service
class WithdrawService {
    @Autowired AccountRepository accounts;
    @Autowired OutboxRepository outbox;

    @Transactional
    public void withdraw(long userId, long amount) {
        accounts.decrementBalance(userId, amount);
        outbox.save(new OutboxEvent("Withdrawal",
            "{\"userId\":" + userId + ",\"amount\":" + amount + "}"));
    }
}
```

## code.cpp
```cpp
// Pseudo — most C++ DB drivers (libpqxx, soci) support transactions.
// pqxx::work tx(conn);
// tx.exec("UPDATE accounts SET balance = balance - $1 WHERE user_id = $2", {amount, user_id});
// tx.exec("INSERT INTO outbox(event_type, payload) VALUES('Withdrawal', $1)", payload);
// tx.commit();
```
