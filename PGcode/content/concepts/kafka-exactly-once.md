---
slug: kafka-exactly-once
module: system-design
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
Double-charging a credit card is the textbook horror story. The naive at-least-once pipeline retries on network blips and the same payment event lands twice in your ledger topic. Exactly-once eliminates that class of bug at the framework boundary instead of asking every downstream handler to dedupe by event id. Interviews about payment systems, billing, or any "must not double-process" pipeline always come back to this primitive.

## intuition
Two pieces working together. The producer side: each producer gets a `PID` from the broker plus a monotonic sequence per partition; the broker rejects duplicates within a 5-message window. That removes producer-retry duplicates. The consumer side: wrap your read-process-write in `beginTransaction / send / sendOffsetsToTransaction / commitTransaction`. The transaction coordinator writes a control record that downstream consumers (in `read_committed` mode) only surface once committed. Aborted transactions vanish.

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
Configure the producer with `enable.idempotence=true`, `acks=all`, `max.in.flight.requests.per.connection<=5`, and a stable `transactional.id` per logical processor (not per process — must survive restarts so fencing works). Call `initTransactions()` once at startup. Consumers read with `isolation.level=read_committed`. Commit consumer offsets *inside* the producer transaction via `sendOffsetsToTransaction`, never with `consumer.commitSync()`. Set the transaction timeout below the broker's `transaction.max.timeout.ms` (default 15 minutes) so zombie txns get reaped.

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
