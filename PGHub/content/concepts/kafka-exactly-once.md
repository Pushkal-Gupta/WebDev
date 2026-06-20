---
slug: kafka-exactly-once
module: sd-microservices
title: Kafka Exactly-Once Semantics
subtitle: Idempotent producer plus transactional consumer makes end-to-end exactly-once finally tractable.
difficulty: Advanced
position: 1
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 11: Stream Processing"
    url: "https://dataintensive.net/"
    type: book
  - title: "apache/kafka — clients/src/main/java/org/apache/kafka/clients/producer/internals"
    url: "https://github.com/apache/kafka"
    type: repo
  - title: "Jepsen — Kafka analyses"
    url: "https://jepsen.io/"
    type: blog
status: published
---

## intro
Exactly-once delivery is the white whale of distributed messaging. For years the canonical wisdom was "you cannot have it — pick at-least-once and make your consumer idempotent." Kafka 0.11 changed the calculation: the broker grew a producer id, a sequence number per partition, and a transaction coordinator. Stitched together you get end-to-end exactly-once across a read-process-write loop: read N messages, compute something, write M messages, commit consumer offsets — all or nothing.

## whyItMatters
- **Payment pipelines** (Stripe-style ledgers, PayPal's transaction logs, internal accounting at every fintech) must never double-process — KIP-98 (Exactly Once) was largely motivated by this class of system.
- **Confluent's Kafka Streams** ships `processing.guarantee=exactly_once_v2` as the default for new applications; **Apache Flink with the Kafka connector** and **Spark Structured Streaming** integrate with Kafka transactions for end-to-end EOS.
- **Outbox pattern implementations** (Debezium CDC -> Kafka -> downstream service) rely on Kafka EOS to avoid republishing already-emitted events when the publisher restarts mid-batch.
- **Jepsen's Kafka analyses** (Kyle Kingsbury, 2017 and 2018) validated the EOS guarantees under failure injection; the original KIP-98 design doc and KIP-447 (per-instance fencing, 2019) are the canonical references.

## intuition
Exactly-once delivery in distributed messaging was considered the white whale for years. The pragmatic advice was always "you cannot have it, pick at-least-once and make your consumer idempotent." The reason: a network round-trip from producer to broker can fail in three ways — the message never arrived (safe to retry), the message arrived but the ack was lost (retry creates a duplicate), or the broker crashed mid-write. Without coordination, the producer cannot tell case 1 from case 2, so retries inevitably create duplicates.

Kafka 0.11 (2017, KIP-98) solved this with two coordinated mechanisms. **First**, every producer gets a permanent **Producer ID (PID)** from the broker plus a **monotonic sequence number per partition**; the broker rejects any incoming write whose `(PID, partition, seq)` it has already accepted. This eliminates producer-retry duplicates within a window of 5 in-flight requests. **Second**, a **Transaction Coordinator** writes commit/abort markers to the partition logs; downstream consumers configured with `isolation.level=read_committed` skip uncommitted records and aborted transactions entirely. Combining the two — wrap your read-process-write in `beginTransaction / produce / sendOffsetsToTransaction / commitTransaction` — gives true end-to-end exactly-once across multi-partition output plus the consumer offset commit.

The third trick is **zombie fencing**. A `transactional.id` is a stable identifier (per logical processor, not per process). When a new instance calls `initTransactions()`, it bumps the producer epoch; any older zombie producer with the same `transactional.id` gets rejected by the broker on its next produce. This prevents a stalled GC-paused worker from writing duplicate records after a replacement has already taken over — the same protocol fencing that distributed locks need.

## visualization
A read-process-write loop with a transaction boundary:

```
Consumer (read_committed)
  poll topic A -> [m0, m1, m2]

  beginTransaction()
    process(m0) -> produce topic B (PID=42, seq=0)
    process(m1) -> produce topic B (PID=42, seq=1)
    process(m2) -> produce topic B (PID=42, seq=2)
    sendOffsetsToTransaction({A: 3}, group)
  commitTransaction()

  -> coordinator writes COMMIT marker on B and __consumer_offsets
  -> downstream sees m0', m1', m2' atomically, or none of them
```

If the worker crashes between `produce` and `commitTransaction`, the next process with the same `transactional.id` calls `initTransactions()` which fences the old PID and aborts the pending transaction.

## bruteForce
Application-level dedup: every consumer keeps a Redis set of `event_id` it has already processed and skips repeats. This works but every consumer must implement it, the dedup set is unbounded (or you pick a TTL and risk missing late duplicates), and it does not cover the producer side — your service can still publish the same event twice if its own retry logic fires. You also lose atomicity across multiple output topics in a single transaction.

## optimal
The right configuration combines **idempotent producer, transactional grouping, and read-committed consumer** with a stable `transactional.id` per logical processor. The Kafka design doc (KIP-98), Confluent's transactional-messaging blog series, and Apache Kafka 3.x default settings codify the production pattern.

```python
from confluent_kafka import Producer, Consumer, TopicPartition

p = Producer({
    "bootstrap.servers": "broker:9092",
    "enable.idempotence": True,                  # dedupe via (PID, partition, seq)
    "acks": "all",                                # wait for all in-sync replicas
    "max.in.flight.requests.per.connection": 5,   # bound dedupe window
    "transactional.id": "payment-enricher-1",    # STABLE per processor (not per process)
})
p.init_transactions()                             # fences any zombie producer

c = Consumer({
    "bootstrap.servers": "broker:9092",
    "group.id": "enricher",
    "isolation.level": "read_committed",          # skip aborted/uncommitted txns
    "enable.auto.commit": False,
})
c.subscribe(["payments-raw"])

while True:
    msgs = c.consume(num_messages=500, timeout=1.0)
    if not msgs: continue
    p.begin_transaction()
    try:
        for m in msgs:
            p.produce("payments-enriched", enrich(m.value()))
        # CRITICAL: commit consumer offsets INSIDE the producer transaction.
        # Never use consumer.commitSync() with transactional producers.
        offsets = [TopicPartition(m.topic(), m.partition(), m.offset() + 1) for m in msgs]
        p.send_offsets_to_transaction(offsets, c.consumer_group_metadata())
        p.commit_transaction()
    except Exception:
        p.abort_transaction()
        raise
```

Why this is right: the three coordinated mechanisms close the three holes that break naive at-least-once. **Idempotent producer** (`enable.idempotence=true` + `acks=all`) eliminates producer-retry duplicates within a 5-in-flight window. **Transactions** (`begin/commit_transaction`) make multi-partition writes atomic — downstream consumers in `read_committed` mode see all output records or none. **`sendOffsetsToTransaction`** makes the consumer offset commit part of the producer transaction — if the transaction aborts, the offsets do not advance, and the next poll re-reads the same input records (which the idempotent producer will dedupe). Take any of the three away and exactly-once degrades to at-least-once.

**Zombie fencing**: `init_transactions()` bumps the producer epoch for the given `transactional.id`. Any older producer with the same id (e.g., a GC-paused worker that a replacement has taken over from) gets rejected by the broker on its next produce. This is why `transactional.id` must be **stable per logical processor**, not per process — a random UUID per restart means fencing never happens and zombies linger.

**For Kafka Streams**: set `processing.guarantee=exactly_once_v2` and the runtime wires all of this automatically. This is the recommended path for stream applications; KIP-447 (2019) made the per-partition producer overhead linear in active producers rather than partitions.

**Hard limits**: exactly-once is **within Kafka**. If you write to Postgres after consuming, you need the **outbox pattern** (write the side effect to a DB table in the same transaction as the business state, then a CDC connector publishes to Kafka) or **2PC** (Kafka 3.5+ supports XA via the transactional API) to extend the guarantee. Set transaction timeout below `transaction.max.timeout.ms` (default 15 min) so zombie txns get reaped. Do not mix transactional and non-transactional writes from the same producer.

## complexity
time: One extra round-trip per transaction (begin + commit markers). Throughput drops about 3 percent versus at-least-once when batches are reasonably sized (>=100 records per txn).
space: O(open transactions) per coordinator broker; coordinator state stored in `__transaction_state` compacted topic.
notes: Transaction coordinators are partitioned by `transactional.id` hash. Hotspotting one id starves the others.

## pitfalls
- Reusing the same `transactional.id` across two live processes — the older one gets fenced and silently stops producing.
- Picking `transactional.id` per process restart (e.g. random UUID) — fencing never happens, zombies linger, exactly-once degrades to at-least-once.
- Forgetting `read_committed` on the consumer — it then reads uncommitted records too, defeating the whole point.
- Mixing transactional and non-transactional writes from the same producer instance.
- Long transactions (minutes) starve `read_committed` consumers because the LSO (last stable offset) stalls.

## interviewTips
- State the three-part definition: dedup on produce (idempotent PID), atomic multi-partition write (transactions), and atomic offset commit (`sendOffsetsToTransaction`). Missing any one degrades to at-least-once.
- Compare to Kafka Streams' `processing.guarantee=exactly_once_v2` — it wires all of this automatically and is the recommended path for stream apps.
- Acknowledge the boundary: exactly-once is *within Kafka*. If you write to Postgres after consuming, you need the outbox pattern or 2PC to extend the guarantee.
- Bring up KIP-447 (exactly-once v2) which made the per-partition producer overhead linear in active producers, not partitions — current-events checkbox.

## code.python
```python
from confluent_kafka import Producer, Consumer, TopicPartition

p = Producer({
    "bootstrap.servers": "broker:9092",
    "enable.idempotence": True,
    "acks": "all",
    "transactional.id": "payment-enricher-1",
})
p.init_transactions()

c = Consumer({
    "bootstrap.servers": "broker:9092",
    "group.id": "enricher",
    "isolation.level": "read_committed",
    "enable.auto.commit": False,
})
c.subscribe(["payments-raw"])

while True:
    msgs = c.consume(num_messages=500, timeout=1.0)
    if not msgs:
        continue
    p.begin_transaction()
    for m in msgs:
        p.produce("payments-enriched", enrich(m.value()))
    offsets = [TopicPartition(m.topic(), m.partition(), m.offset() + 1) for m in msgs]
    p.send_offsets_to_transaction(offsets, c.consumer_group_metadata())
    p.commit_transaction()
```

## code.javascript
```javascript
import { Kafka } from "kafkajs";

const kafka = new Kafka({ brokers: ["broker:9092"] });
const producer = kafka.producer({
  idempotent: true,
  transactionalId: "payment-enricher-1",
  maxInFlightRequests: 5,
});
await producer.connect();

const consumer = kafka.consumer({ groupId: "enricher", isolationLevel: 1 });
await consumer.connect();
await consumer.subscribe({ topic: "payments-raw" });

await consumer.run({
  eachBatchAutoResolve: false,
  eachBatch: async ({ batch, resolveOffset }) => {
    const txn = await producer.transaction();
    for (const m of batch.messages) {
      await txn.send({ topic: "payments-enriched", messages: [{ value: enrich(m.value) }] });
      resolveOffset(m.offset);
    }
    await txn.sendOffsets({
      consumerGroupId: "enricher",
      topics: [{ topic: batch.topic, partitions: [{ partition: batch.partition, offset: batch.lastOffset() + "" }] }],
    });
    await txn.commit();
  },
});
```

## code.java
```java
Properties pp = new Properties();
pp.put("bootstrap.servers", "broker:9092");
pp.put("enable.idempotence", "true");
pp.put("transactional.id", "payment-enricher-1");
pp.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
pp.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

KafkaProducer<String, String> producer = new KafkaProducer<>(pp);
producer.initTransactions();

Properties cp = new Properties();
cp.put("bootstrap.servers", "broker:9092");
cp.put("group.id", "enricher");
cp.put("isolation.level", "read_committed");
cp.put("enable.auto.commit", "false");

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(cp);
consumer.subscribe(List.of("payments-raw"));

while (true) {
    var records = consumer.poll(Duration.ofSeconds(1));
    if (records.isEmpty()) continue;
    producer.beginTransaction();
    Map<TopicPartition, OffsetAndMetadata> offsets = new HashMap<>();
    for (var r : records) {
        producer.send(new ProducerRecord<>("payments-enriched", r.key(), enrich(r.value())));
        offsets.put(new TopicPartition(r.topic(), r.partition()),
                    new OffsetAndMetadata(r.offset() + 1));
    }
    producer.sendOffsetsToTransaction(offsets, consumer.groupMetadata());
    producer.commitTransaction();
}
```

## code.cpp
```cpp
// librdkafka transactional producer
#include <librdkafka/rdkafkacpp.h>

std::string err;
RdKafka::Conf* pc = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
pc->set("bootstrap.servers", "broker:9092", err);
pc->set("enable.idempotence", "true", err);
pc->set("transactional.id", "payment-enricher-1", err);

RdKafka::Producer* producer = RdKafka::Producer::create(pc, err);
producer->init_transactions(5000);

RdKafka::Conf* cc = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
cc->set("bootstrap.servers", "broker:9092", err);
cc->set("group.id", "enricher", err);
cc->set("isolation.level", "read_committed", err);
RdKafka::KafkaConsumer* consumer = RdKafka::KafkaConsumer::create(cc, err);
consumer->subscribe({"payments-raw"});

while (true) {
    producer->begin_transaction();
    auto* m = consumer->consume(1000);
    if (m->err() == RdKafka::ERR_NO_ERROR) {
        producer->produce("payments-enriched", RdKafka::Topic::PARTITION_UA,
            RdKafka::Producer::RK_MSG_COPY, (void*)m->payload(), m->len(),
            nullptr, 0, 0, nullptr, nullptr);
        producer->send_offsets_to_transaction(
            {RdKafka::TopicPartition::create(m->topic_name(), m->partition(), m->offset() + 1)},
            consumer->groupMetadata(), 5000);
        producer->commit_transaction(10000);
    }
    delete m;
}
```
