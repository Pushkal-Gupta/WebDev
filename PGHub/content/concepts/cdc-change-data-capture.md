---
slug: cdc-change-data-capture
module: sd-microservices
title: Change Data Capture
subtitle: Stream every insert, update, and delete out of your database in near real time without dual-writes.
difficulty: Advanced
position: 1
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Architecture & enterprise patterns"
    url: "https://martinfowler.com/tags/application%20architecture.html"
    type: book
  - title: "High Scalability — All-time greatest hits"
    url: "http://highscalability.com/all-time-favorites/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
Change Data Capture (CDC) is the discipline of turning a database's write-ahead log into a stream of structured change events that downstream systems can consume. Instead of polling tables or sprinkling application code with dual-writes to Kafka, CDC tails the log Postgres, MySQL, or SQL Server already writes for crash recovery, decodes each transaction, and emits a row-level `{before, after, op}` record per change. Debezium plus Kafka is the canonical open-source stack; AWS DMS, Fivetran, and Materialize wrap the same primitives.

## whyItMatters
Once you have more than one consumer of "what changed in the orders table," dual-writes from the app start failing in subtle ways — partial writes, ordering inversions, lost events on crash. CDC solves that by making the database the single source of truth for change events. It powers cache invalidation, search index sync (Postgres -> Elasticsearch), data-warehouse loading (Postgres -> Snowflake), event-driven microservices (the Outbox pattern), audit trails, GDPR deletion propagation, and the read side of CQRS. Every senior system-design loop touches it.

## intuition
Your database already writes every change to a durable log before acknowledging the commit — that is what crash recovery replays. CDC says: open a replication slot, read the same log, decode the binary records back into row tuples using the table schema, and forward each transaction's row changes to a broker in commit order. Because you read what was actually committed, you get exactly-once-into-the-broker delivery and the same ordering the database saw. No application code changes, no dual-writes, no consistency window.

What's actually happening is that you are reusing a log the database was already forced to write for durability, so CDC adds almost nothing to the write path. Contrast it with the naive alternative — the "dual write," where the application writes to Postgres and then publishes to Kafka itself. Those are two independent operations with no shared transaction: if the process crashes between them, or the Kafka write times out after the Postgres commit already landed, the two systems permanently disagree, and there is no clean way to reconcile after the fact. CDC removes that failure mode by construction, because the event *is* the committed WAL record — if the write is durable, the event exists; if the write rolled back, no record was ever written to tail. Put numbers on the scale it unlocks: one orders table generating 20,000 row changes/sec can feed a search-index sync, a cache invalidator, a Snowflake loader, and three event-driven microservices from a single replication slot, each consumer tracking its own log offset and replaying from any point. End-to-end latency is typically sub-second under normal load — seconds, not microseconds — because the log is tailed, decoded, and shipped through a broker. That budget is the whole tradeoff: CDC buys you decoupling and correctness, not real-time.

## visualization
One committed UPDATE fans out to many consumers from a single WAL slot:

```
app: UPDATE orders SET status='shipped' WHERE id=42     (commit, txid 4711)
WAL: [ ... txid=4711  UPDATE orders pk=42  status: pending->shipped  lsn=0/16B3780 ]
        |  Debezium tails the slot, pgoutput decodes the record
        v
Kafka topic db.public.orders:
  { "op":"u", "before":{"id":42,"status":"pending"},
    "after":{"id":42,"status":"shipped"}, "source":{"lsn":"0/16B3780","txid":4711} }
   |-> search-indexer   consumer -> reindex order 42     (t+0.2s)
   +-> snowflake-loader consumer -> merge order 42       (t+5m, own offset)
```

## bruteForce
Poll a `updated_at` column every minute and ship rows whose timestamp changed. Easy to write — and broken in five different ways. It misses deletes (the row is gone, you cannot SELECT it). It misses intermediate states (a row updated twice in a minute appears once). It cannot guarantee transaction boundaries (you see half a multi-row transaction). It puts read load on the primary. And clock skew between app servers makes `updated_at` non-monotonic. Polling is fine for nightly batch; it is unfit for any real CDC need.

## optimal
Run a log-based connector (Debezium or equivalent) against a replication slot. On Postgres: `CREATE PUBLICATION dbz_pub FOR ALL TABLES;`, set `wal_level = logical`, set `REPLICA IDENTITY FULL` on tables where you need the full `before` image, and create the connector pointing at the `pgoutput` plugin. Debezium does a consistent snapshot of existing rows (so consumers see history), then streams new changes from the LSN where the snapshot finished. Use the Outbox pattern when you want to publish business events instead of raw row diffs: write to an `outbox` table in the same transaction as the business change; the CDC stream becomes your event bus.

The reasoning to lead with: CDC works because it makes the database's own durability log the single source of truth for change events, so there is exactly one ordering and exactly one commit decision, and every consumer derives from it independently. Reach for it the moment more than one downstream cares about "what changed" — one consumer is a dual-write you can maybe get away with, two is where dual-writes start silently diverging. The operational failure modes are specific and worth designing for up front. A replication slot pins WAL on disk until the consumer acknowledges the LSN, so a stopped or slow consumer accumulates WAL indefinitely and can fill the disk and take the primary down — alert on `pg_replication_slots` lag as a first-class metric, not an afterthought. The initial snapshot is O(N) rows across all tables and is usually the slowest single operation, hours on a TB-scale database, so plan parallel or skip-snapshot backfill. Delivery is exactly-once into the broker but at-least-once out to consumers, so consumers must be idempotent — upsert keyed by primary key plus LSN, never blind insert. And DDL is not part of the logical stream on Postgres, so schema changes need a separate signal (Debezium's schema-change topics, or Avro plus a Schema Registry) or consumers will deserialize against a stale schema.

## complexity
time: Throughput is bounded by WAL write rate (typically tens to hundreds of MB/s on modern Postgres). End-to-end latency is sub-second under normal load.
space: One replication slot per connector. The slot pins WAL on disk until the consumer acks the LSN — an idle or stuck consumer can fill the disk and take down the database. Monitor `pg_replication_slots.confirmed_flush_lsn` lag.
notes: Initial snapshot is O(N) rows across all tables, often the slowest single operation. Plan for hours on a TB-scale database; some teams use parallel snapshotting or skip-snapshot mode and backfill separately.

## pitfalls
- A stopped CDC consumer accumulates WAL forever and fills the disk. Always alert on replication slot lag.
- `REPLICA IDENTITY DEFAULT` only logs the primary key in `before`. If your consumer needs full diffs, set `REPLICA IDENTITY FULL` (write amplification) or rely on the `after` image plus a state store.
- Schema changes (DDL) are not part of the logical stream on Postgres. You need a separate signal — Debezium emits schema-change topics; otherwise consumers will deserialize stale schemas.
- Exactly-once at the broker, at-least-once at the consumer. Make consumers idempotent (upserts keyed by primary key + LSN).
- Soft deletes versus hard deletes: a `DELETE` emits one event with `op=d` and `after=null`; if your domain uses soft deletes, that is an `UPDATE` and you must filter on `deleted_at`.
- Cross-table transactions arrive as separate Kafka messages, possibly on different partitions. Order within a single key is preserved; cross-table atomicity is not. Design consumers accordingly or use a Kafka transaction boundary.

## interviewTips
- Lead with the dual-write problem: "If the app writes to Postgres and then to Kafka, what happens if the second write fails?" CDC is the answer.
- Mention the Outbox pattern by name — it is the bridge between "raw row CDC" and "business event publishing" and signals you have built this in production.
- Be ready to discuss snapshot strategy, schema evolution (Avro + Schema Registry), and back-pressure when the consumer is slower than the producer.
- Know the latency budget: CDC gets you seconds, not microseconds. If the design needs sub-millisecond, you want an in-process event bus, not CDC.

## code.python
```python
import psycopg2
import psycopg2.extras

conn = psycopg2.connect(
    "host=db user=replicator password=*** dbname=app",
    connection_factory=psycopg2.extras.LogicalReplicationConnection,
)
cur = conn.cursor()
cur.create_replication_slot("py_slot", output_plugin="pgoutput")
cur.start_replication(
    slot_name="py_slot",
    options={"proto_version": "1", "publication_names": "dbz_pub"},
    decode=True,
)

def consume(msg):
    print(msg.payload)
    msg.cursor.send_feedback(flush_lsn=msg.data_start)

cur.consume_stream(consume)
```

## code.javascript
```javascript
import { Kafka } from "kafkajs";

const kafka = new Kafka({ brokers: ["kafka:9092"] });
const consumer = kafka.consumer({ groupId: "search-indexer" });

await consumer.connect();
await consumer.subscribe({ topic: "db.public.orders", fromBeginning: true });

await consumer.run({
  eachMessage: async ({ message }) => {
    const evt = JSON.parse(message.value.toString());
    const { op, after, before } = evt.payload;
    if (op === "c" || op === "u") await searchIndex.upsert(after);
    else if (op === "d") await searchIndex.remove(before.id);
  },
});
```

## code.java
```java
public class OrderCdcConsumer {
    public static void main(String[] args) {
        Properties p = new Properties();
        p.put("bootstrap.servers", "kafka:9092");
        p.put("group.id", "search-indexer");
        p.put("key.deserializer", StringDeserializer.class.getName());
        p.put("value.deserializer", StringDeserializer.class.getName());

        try (KafkaConsumer<String, String> c = new KafkaConsumer<>(p)) {
            c.subscribe(List.of("db.public.orders"));
            while (true) {
                ConsumerRecords<String, String> recs = c.poll(Duration.ofSeconds(1));
                for (ConsumerRecord<String, String> r : recs) {
                    JsonNode payload = mapper.readTree(r.value()).get("payload");
                    String op = payload.get("op").asText();
                    if (op.equals("c") || op.equals("u")) {
                        SearchIndex.upsert(payload.get("after"));
                    } else if (op.equals("d")) {
                        SearchIndex.remove(payload.get("before").get("id").asLong());
                    }
                }
                c.commitSync();
            }
        }
    }
}
```

## code.cpp
```cpp
#include <pqxx/pqxx>
#include <iostream>

int main() {
    pqxx::connection c{"host=db user=replicator dbname=app replication=database"};
    pqxx::nontransaction tx{c};

    tx.exec("CREATE_REPLICATION_SLOT cpp_slot LOGICAL pgoutput");
    auto stream = tx.exec(
        "START_REPLICATION SLOT cpp_slot LOGICAL 0/0 "
        "(proto_version '1', publication_names 'dbz_pub')"
    );

    for (auto row : stream) {
        std::cout << "lsn=" << row[0].c_str() << " payload=" << row[3].c_str() << "\n";
    }
}
```
