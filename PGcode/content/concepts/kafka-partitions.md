---
slug: kafka-partitions
module: system-design
title: Kafka Partitions
subtitle: The topic-partition model — what ordering Kafka guarantees, what it doesn't, and how consumer groups rebalance.
difficulty: Advanced
position: 1
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 11: Stream Processing"
    url: "https://dataintensive.net/"
    type: book
  - title: "Kafka Documentation — Implementation and Design"
    url: "https://kafka.apache.org/documentation/"
    type: blog
  - title: "apache/kafka — core/src/main/scala/kafka/server"
    url: "https://github.com/apache/kafka"
    type: repo
status: published
---

## intro
A Kafka topic is not one log — it is a *fan* of independent append-only logs called partitions. Every message lands in exactly one partition, every partition lives on exactly one broker (the leader, with N-1 followers), and every consumer in a group owns a disjoint subset of partitions. That single design choice — sharding the log by partition — is what gives Kafka its horizontal scale, its ordering guarantees, and its rebalance pain.

## whyItMatters
The most common production bug with Kafka is "messages arrived out of order." The cause is almost always a misunderstanding of the partition model: ordering holds *within* a partition, never *across* partitions. Pick the wrong partition key and your "ordered" stream of user events scatters across 12 partitions and arrives in any order. Pick the right key (the user id) and ordering is free. System-design interviews probe this directly — "design a notification pipeline" is a partition-key question in disguise.

## intuition
Picture a topic `orders` with 6 partitions. Each partition is a file on disk that only grows at the tail; each message gets a monotonically increasing 64-bit offset. A producer with `key="user-42"` hashes the key (`murmur2 % 6`) and always writes user-42's events to partition 3. A consumer group of 3 instances takes 2 partitions each. If one instance dies, the remaining two rebalance and take 3 partitions each — that rebalance is the moment everything pauses.

## visualization
Topic `orders`, 4 partitions, 2 consumers in group `billing`:

```
Partition 0 [o0 o1 o2 o3]  -> consumer A (committed offset: 2)
Partition 1 [o0 o1 o2]      -> consumer A (committed offset: 1)
Partition 2 [o0 o1 o2 o3]  -> consumer B (committed offset: 3)
Partition 3 [o0 o1]         -> consumer B (committed offset: 1)
```

Add consumer C → group coordinator triggers rebalance → partitions redistribute (each consumer pauses, commits, then resumes from new assignments).

## bruteForce
The "one big partition" trap: a topic with `partitions=1` gives perfect total ordering but throughput is bounded by one broker's disk and one consumer thread. You cannot scale reads or writes — adding consumers to the group leaves everyone but one idle (a partition can only be owned by one consumer in a group). Production teams hit this within a week and discover the only fix (raising partition count) is irreversible without re-keying every downstream consumer.

## optimal
Choose partition count up front to be N × expected-consumer-count where N is a small integer (2–4) — it gives room to scale the consumer group without re-partitioning. Pick a partition key that matches your ordering boundary (`user_id`, `order_id`, `tenant_id`). Use idempotent producers (`enable.idempotence=true`) and a stable client `transactional.id` for exactly-once across produce-consume-produce loops. For the consumer side, prefer cooperative-sticky assignment (`partition.assignment.strategy=CooperativeStickyAssignor`) so rebalances are incremental instead of stop-the-world.

## complexity
time: Produce O(1) per message; consume O(1) per fetch (sequential disk read). Rebalance O(P) where P is total partitions in the group.
space: O(retention) per partition on disk; defaults to 7 days or `log.retention.bytes`.
notes: Throughput per partition tops out around 10 MB/s with replication; scale by adding partitions, not by hardware on one broker. ISR (in-sync replicas) shrinks under load and triggers `under-replicated-partitions` alerts.

## pitfalls
- Assuming cross-partition ordering — a single key per partition is the only guarantee.
- Setting partition count too low and not being able to add consumers later (adding partitions to an existing topic re-hashes all *new* writes but does not re-key existing data, breaking ordering for any key whose partition assignment changed).
- Long `max.poll.interval.ms` consumers (slow processing) get evicted from the group, triggering rebalance storms.
- Forgetting that `auto.offset.reset=latest` means a consumer restarted after downtime *skips* every message it missed.
- Producing without a key — Kafka round-robins, ordering is lost, and partition-level retries can reorder.

## interviewTips
- Lead with "ordering is per-partition, so the partition key *is* the schema." Interviewers love this framing.
- Know the difference between at-least-once (default), at-most-once (`enable.auto.commit=true` before processing), and exactly-once (idempotent producer + transactional consumer + read-process-write atomicity).
- Mention KRaft (the Raft-based metadata quorum) replacing ZooKeeper post-3.3 — a current-events checkbox.
- For "design a feed fan-out" or "process Twitter likes in order per tweet" — both reduce to "partition by tweet_id, scale consumers up to partition count."

## code.python
```python
from kafka import KafkaProducer, KafkaConsumer

producer = KafkaProducer(
    bootstrap_servers="broker:9092",
    enable_idempotence=True,
    acks="all",
    key_serializer=str.encode,
    value_serializer=str.encode,
)
producer.send("orders", key="user-42", value='{"item":"book","qty":1}')
producer.flush()

consumer = KafkaConsumer(
    "orders",
    bootstrap_servers="broker:9092",
    group_id="billing",
    enable_auto_commit=False,
    partition_assignment_strategy=["cooperative-sticky"],
)
for msg in consumer:
    handle(msg.value)
    consumer.commit()
```

## code.javascript
```javascript
import { Kafka } from "kafkajs";

const kafka = new Kafka({ brokers: ["broker:9092"] });
const producer = kafka.producer({ idempotent: true });
await producer.connect();
await producer.send({
  topic: "orders",
  messages: [{ key: "user-42", value: JSON.stringify({ item: "book" }) }],
});

const consumer = kafka.consumer({ groupId: "billing" });
await consumer.connect();
await consumer.subscribe({ topic: "orders", fromBeginning: false });
await consumer.run({
  eachMessage: async ({ message, partition }) => {
    await handle(message.value.toString(), partition);
  },
});
```

## code.java
```java
Properties pp = new Properties();
pp.put("bootstrap.servers", "broker:9092");
pp.put("enable.idempotence", "true");
pp.put("acks", "all");
pp.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
pp.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

try (Producer<String, String> p = new KafkaProducer<>(pp)) {
    p.send(new ProducerRecord<>("orders", "user-42", "{\"item\":\"book\"}")).get();
}

Properties cp = new Properties();
cp.put("bootstrap.servers", "broker:9092");
cp.put("group.id", "billing");
cp.put("partition.assignment.strategy",
       "org.apache.kafka.clients.consumer.CooperativeStickyAssignor");
cp.put("enable.auto.commit", "false");
cp.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
cp.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");

try (Consumer<String, String> c = new KafkaConsumer<>(cp)) {
    c.subscribe(List.of("orders"));
    while (true) {
        for (var r : c.poll(Duration.ofSeconds(1))) handle(r.value());
        c.commitSync();
    }
}
```

## code.cpp
```cpp
// librdkafka — minimal producer + consumer sketch
#include <librdkafka/rdkafkacpp.h>

std::string errstr;
RdKafka::Conf* conf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
conf->set("bootstrap.servers", "broker:9092", errstr);
conf->set("enable.idempotence", "true", errstr);

RdKafka::Producer* producer = RdKafka::Producer::create(conf, errstr);
producer->produce("orders", RdKafka::Topic::PARTITION_UA,
    RdKafka::Producer::RK_MSG_COPY,
    (void*)"{\"item\":\"book\"}", 16,
    "user-42", 7, 0, nullptr, nullptr);
producer->flush(5000);

conf->set("group.id", "billing", errstr);
conf->set("partition.assignment.strategy", "cooperative-sticky", errstr);
RdKafka::KafkaConsumer* c = RdKafka::KafkaConsumer::create(conf, errstr);
c->subscribe({"orders"});
while (true) {
    RdKafka::Message* m = c->consume(1000);
    if (m->err() == RdKafka::ERR_NO_ERROR) handle(m);
    delete m;
}
```
