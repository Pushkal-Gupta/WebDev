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
The reframe: stop trying to keep two different systems in sync at the same instant, because you can't. A database commit and a Kafka publish share no transaction, so any moment between them is a window where one happened and the other didn't. Instead, make the *intent* to publish part of the same durable write as the business change, then let a follow-up worker turn intent into an actual message. It's the difference between mailing a letter yourself — you might drop it — and dropping it into a locked outbox that a postal worker empties on a schedule. The letter is safe the instant it's in the box.

Two writes — `business_table` + `outbox_table` — happen inside ONE DB transaction. The transaction's ACID guarantee makes them inseparable: either both succeed or neither does.

A separate process (the **relay** or **CDC**) tails the outbox table, publishes each row's event to Kafka/RabbitMQ/SQS, and marks it as `published_at = now()`.

If the relay crashes after publishing but before marking → the event is published twice on restart. Consumers must be idempotent.

Walk one withdrawal through it. A user withdraws 100: inside a single transaction the app runs `UPDATE accounts SET balance = balance - 100` AND inserts an `outbox` row for the `Withdrawal` event with `published_at = NULL`. COMMIT makes both durable together — there is no state where the balance dropped but the event row is missing. Seconds later the relay wakes, sees that unpublished row, produces it to Kafka, and stamps `published_at = now()`. Now suppose the relay dies right after Kafka accepts the message but before the UPDATE lands: on restart it sees `published_at` still NULL, republishes, and the consumer receives the withdrawal twice. That is exactly why the guarantee is *at-least-once*, not exactly-once — the outbox never loses an event, so the only remaining job is teaching consumers to ignore duplicates (dedupe on the event id).

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

**Why it's correct.** The atomicity comes entirely from the database: the business UPDATE and the outbox INSERT share one transaction, so a crash either rolls both back or commits both — there is no partial state where the balance changed but no event was recorded. The relay then converts a committed row into a broker message; if it crashes mid-flight, the row is simply still `published_at IS NULL` and gets retried. Nothing is ever silently dropped.

**Key invariant / tradeoff.** Invariant: every committed business change has exactly one matching unpublished outbox row until the relay confirms delivery. The tradeoff is duplicates over losses — the relay guarantees *at-least-once*, so a message may be produced twice (publish succeeded, the `published_at` UPDATE didn't). You accept possible duplicates and push exactness onto idempotent consumers rather than risk losing events, because a lost event is unrecoverable while a duplicate is merely filtered.

**Step-by-step.** (1) The app opens a transaction, writes the business table, inserts the outbox row, and commits. (2) The relay polls `WHERE published_at IS NULL ... FOR UPDATE SKIP LOCKED` so parallel workers claim disjoint rows. (3) For each row it publishes to the broker, then stamps `published_at = now()`. (4) A pruning job deletes long-published rows. **Complexity intuition.** Write cost is one extra INSERT (O(1)); the partial index on unpublished rows keeps the relay's poll proportional to the backlog, not the whole table; end-to-end latency is the poll interval (1–5 s), or milliseconds if you swap polling for CDC reading the WAL directly.

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
