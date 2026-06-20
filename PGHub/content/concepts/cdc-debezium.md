---
slug: cdc-debezium
module: sd-microservices
title: Change Data Capture (Debezium)
subtitle: Stream DB row changes from the WAL into Kafka in real time — no app code; downstream consumers project, search, sync.
difficulty: Intermediate
position: 29
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Martin Kleppmann — Designing Data-Intensive Applications (Ch 11)"
    url: "https://dataintensive.net/"
    type: book
  - title: "Debezium — CDC for Postgres / MySQL / Mongo"
    url: "https://debezium.io/documentation/reference/"
    type: blog
  - title: "debezium/debezium — the Kafka Connect connectors"
    url: "https://github.com/debezium/debezium"
    type: repo
status: published
---

## intro
**Change Data Capture (CDC)** turns a database into a stream of `(operation, before, after)` events: every INSERT, UPDATE, DELETE on a tracked table becomes a Kafka message. **Debezium** is the canonical implementation — Kafka Connect connectors that read the database's transaction log (Postgres WAL / MySQL binlog / Mongo oplog) and publish change events without any application code change.

## whyItMatters
CDC powers:
- **Search index sync** — DB rows → Elasticsearch / OpenSearch via projector.
- **Cache invalidation** — DB write → publish event → invalidate Redis key.
- **Microservice decoupling** — service A owns the orders table; service B subscribes to `orders.*` changes to update its read model.
- **Data warehouse ingestion** — DB → Snowflake / BigQuery near-real-time.
- **Audit logs** — replay the WAL stream for compliance.

Without CDC, you write app code to dual-write (DB + Kafka) — fragile, see the outbox pattern. CDC moves the dual-write into a tested infrastructure layer.

## intuition
The DB already writes every change to a sequential **transaction log** for durability/recovery. CDC just tails that log:
1. Debezium worker connects as a replica (logical replication slot on Postgres, server-id on MySQL).
2. The DB streams WAL records to the worker.
3. The worker parses each record into a typed event `{op: 'c'|'u'|'d', before: {...}, after: {...}, source: {...}}`.
4. The worker publishes one Kafka message per row change, keyed by primary key.
5. Consumers process the stream — projectors, searchers, downstream DBs.

Latency: typically 10ms-1s from DB commit to Kafka. Far faster than polling.

## visualization
```
                                       Kafka topic: orders.public.orders
DB write                                ┌────────────────────────────────┐
  INSERT INTO orders (id, total)         │ {"op":"c", "after":{"id":1,...}} │
    VALUES (1, 99.00);          ───►    │ {"op":"u", "before":{...},      │
       │                                 │   "after":{"id":1, "total":89}} │
       ▼                                 │ {"op":"d", "before":{"id":1,...}}│
   ┌──────────┐                          └────────────────────────────────┘
   │   WAL    │  → Debezium  → Kafka         │
   └──────────┘                              ▼
                                       ┌──────────────┐
                                       │  Consumers   │
                                       │  - ES sync   │
                                       │  - Cache inv │
                                       │  - Microsrv  │
                                       └──────────────┘
```

## bruteForce
**Polling**: app periodically `SELECT * FROM orders WHERE updated_at > $last`. Misses deletes, has latency, hammers the DB.

**Dual-write in app code**: write DB + publish Kafka in app. Atomic? No — see outbox pattern.

**Triggers + queue table**: in-DB triggers insert into a queue table; relay tails it. Works but pollutes the schema + writes 2x per row.

CDC reads the existing WAL — zero app changes, atomic with the actual DB write.

## optimal
**Postgres setup**:
1. `wal_level = logical` in postgresql.conf (restart required).
2. Create publication: `CREATE PUBLICATION my_pub FOR TABLE orders, payments;`
3. Replication slot: `SELECT pg_create_logical_replication_slot('debezium', 'pgoutput');`
4. Deploy Debezium Postgres connector pointing at the slot.

**Event shape**:
```json
{
  "op": "u",
  "ts_ms": 1716540123456,
  "source": {"db": "shop", "table": "orders", "lsn": "0/12345"},
  "before": {"id": 7, "total": 99.00, "status": "pending"},
  "after":  {"id": 7, "total": 99.00, "status": "paid"},
  "transaction": {"id": "abc123", "total_order": 2, "data_collection_order": 1}
}
```

**Consumer pattern**:
- Key Kafka topic by primary key → consumers maintain ordering per row.
- Tombstones on delete (key + null value) so log compaction can drop old versions.
- Schema registry (Confluent / Apicurio) for Avro/JSON evolution.

**Schema evolution**: add a column → Debezium picks it up on next snapshot OR on next change. Removing columns is risky — old consumers may expect them.

## complexity
- **Latency**: 10ms-1s from commit to Kafka (depends on Kafka batching).
- **Throughput**: limited by the slowest consumer; tune Kafka partition count.
- **DB load**: minimal — just reading the WAL like any replica.
- **Replication slot disk usage**: if Debezium falls behind, WAL piles up on the primary. Monitor lag.

## pitfalls
- **Initial snapshot is expensive** for large tables — Debezium does a `SELECT *` on first start. Use `snapshot.mode = never` if you only care about new changes.
- **Replication slot fills disk**: a downed Debezium worker holds the slot, preventing WAL cleanup. Set up alerts on slot lag.
- **Schema changes via DDL**: not always captured. Use a separate schema-history topic for DDL events.
- **Reordering across tables**: per-table ordering is guaranteed; cross-table not. Use a "transaction" topic to correlate.
- **Tombstones for deletes**: consumers must handle null-value Kafka messages explicitly.

## interviewTips
- For "sync DB changes to search/cache/microservice" — CDC with Debezium.
- Mention **WAL-based vs trigger-based** — WAL is non-intrusive.
- Compare with **outbox pattern**: outbox is app-emitted events; CDC reads the WAL directly. CDC removes app complexity but adds infrastructure.
- For senior interviews, discuss **schema evolution + ordering guarantees + replication slot ops**.

## code.python
```python
# Consumer (Python with confluent-kafka)
from confluent_kafka import Consumer
import json

c = Consumer({
    'bootstrap.servers': 'kafka:9092',
    'group.id': 'order-search-sync',
    'auto.offset.reset': 'earliest',
})
c.subscribe(['orders.public.orders'])

while True:
    msg = c.poll(1.0)
    if not msg or msg.error(): continue
    if msg.value() is None:
        # tombstone (delete)
        es.delete(index='orders', id=json.loads(msg.key()))
    else:
        ev = json.loads(msg.value())
        es.index(index='orders', id=ev['after']['id'], document=ev['after'])
```

## code.javascript
```javascript
// Node + kafkajs
const { Kafka } = require('kafkajs');
const consumer = new Kafka({ brokers: ['kafka:9092'] }).consumer({ groupId: 'sync' });
await consumer.connect();
await consumer.subscribe({ topic: 'orders.public.orders' });
await consumer.run({
  eachMessage: async ({ message }) => {
    if (!message.value) return deleteFromIndex(message.key);
    const ev = JSON.parse(message.value.toString());
    await indexDocument(ev.after);
  },
});
```

## code.java
```java
// Debezium engine in embedded mode — for cases where Kafka is overkill
DebeziumEngine<ChangeEvent<String, String>> engine = DebeziumEngine
    .create(Json.class)
    .using(props)
    .notifying(record -> processEvent(record.value()))
    .build();
new Thread(engine).start();
```

## code.cpp
```cpp
// librdkafka consumer reads Debezium topics
// rd_kafka_subscribe + rd_kafka_consumer_poll loop
// parse JSON payload with nlohmann/json
```
