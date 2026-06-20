---
slug: kafka-partitions
module: sd-microservices
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
A Kafka topic is not one log — it is a **fan of independent append-only logs called partitions**. Every message lands in exactly one partition; every partition lives on exactly one broker (the leader, with N-1 in-sync follower replicas for redundancy); every consumer in a group owns a disjoint subset of partitions. That single design choice — sharding the log by partition — is what gives Kafka horizontal scale, ordering guarantees, and rebalance pain in one package.

Picture a topic `orders` with 6 partitions. Each partition is a file (segment files on disk) that only grows at the tail; each message gets a monotonically increasing 64-bit **offset** within its partition. A producer with `key="user-42"` hashes the key (default `murmur2 % partition_count`) and always writes user-42's events to partition 3. A consumer group of 3 instances takes 2 partitions each. If one instance dies, the remaining two rebalance and take 3 partitions each — that rebalance is the moment everything pauses.

The critical guarantee, and the source of every "messages arrived out of order" production bug: **ordering holds within a partition, never across partitions**. Pick the wrong partition key and your "ordered" stream of user events scatters across 12 partitions and arrives in any order. Pick the right key (the user_id) and per-user ordering is free. The partition key **is the schema** for ordering boundaries — `user_id` for per-user ordering (notifications, activity feeds), `order_id` for per-order state transitions, `tenant_id` for multi-tenant isolation. Never use random keys or `None` unless you genuinely do not care about order.

The other half of the story is **partition count**. A partition can be owned by only one consumer in a group at a time, so consumer-group throughput is bounded by `min(producer_rate, sum(consumer_rate per partition))` and scales with partition count. Pick partition count upfront (typical: 2-4x expected consumer count) because **adding partitions later breaks ordering for existing keys** (re-hashing redistributes them across the new partition set). Decisions made on day 0 echo for years.

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
The right production discipline is **partition-count chosen for headroom, partition-key chosen to match the ordering boundary, idempotent producers with stable `transactional.id`, and cooperative-sticky consumer assignment**. The Kafka official documentation, Jay Kreps's "The Log" article, and Confluent's "How to Pick the Right Number of Partitions" all converge on these defaults.

```python
# Producer: idempotent + transactional for exactly-once across topics.
from confluent_kafka import Producer, Consumer, TopicPartition

producer = Producer({
    "bootstrap.servers": "broker:9092",
    "enable.idempotence": True,            # dedupe at broker via (PID, partition, seq)
    "acks": "all",                          # wait for all in-sync replicas
    "max.in.flight.requests.per.connection": 5,
    "transactional.id": "billing-enricher-1",   # stable per logical processor
    "compression.type": "lz4",              # 3-5x payload reduction
    "linger.ms": 10,                        # batch for throughput
})
producer.init_transactions()

# Partition key = ordering boundary. Per-key ordering is guaranteed within a partition.
producer.produce("orders", key=b"user-42", value=encode(event))

# Consumer: cooperative-sticky for incremental rebalances.
consumer = Consumer({
    "bootstrap.servers": "broker:9092",
    "group.id": "billing",
    "isolation.level": "read_committed",            # skip aborted/uncommitted txns
    "enable.auto.commit": False,
    "partition.assignment.strategy": "cooperative-sticky",
    "max.poll.interval.ms": 300_000,                # tune to processing time
    "session.timeout.ms": 45_000,
})
consumer.subscribe(["orders"])
```

Why this is right: **partition count = N x expected-consumer-count** (where N is 2-4) gives room to scale the consumer group without re-partitioning. A partition can be owned by only one consumer in a group at a time, so adding consumers beyond partition count leaves them idle. Adding partitions to an existing topic is irreversible without re-keying — every downstream consumer must handle the new hash distribution. **Pick partition count up front; over-provision rather than under-provision**.

**Partition-key selection is the schema**:
- `user_id` for per-user ordering (notifications, activity feeds).
- `order_id` for per-order ordering (status transitions: created -> paid -> shipped).
- `tenant_id` for multi-tenant isolation.
- **Never use random keys or `None`** unless you genuinely do not care about order — round-robin distribution loses ordering and retries can reorder.

**Exactly-once requires three coordinated pieces** (see KIP-98, KIP-447):
1. `enable.idempotence=true` + `acks=all`: broker dedupes producer retries via (PID, partition, seq).
2. `transactional.id` (stable per processor, not per process) + `init_transactions()`: fences zombie producers, enables atomic multi-partition writes.
3. `sendOffsetsToTransaction()` instead of `commitSync()`: consumer offset commit becomes part of the producer transaction.

Consumers must read with `isolation.level=read_committed` to skip aborted transactions. Confluent's Streams `processing.guarantee=exactly_once_v2` wires all of this automatically.

**Cooperative Sticky Assignor** (KIP-429, default in Kafka 2.4+): partition assignments survive rebalances when possible, and rebalances become incremental rather than stop-the-world. Without it, every consumer in the group pauses on every rebalance — catastrophic during a rolling deploy.

**Operational realities**:
- **Hot partitions**: monitor per-partition throughput; if one key dominates, sub-partition by adding a salt (`{user_id}#{shard}` where shard = `event_id % 4`) — at the cost of relaxing per-user total ordering to per-(user, shard) ordering.
- **Under-replicated partitions**: an ISR shrink alert means a follower is falling behind; usually disk-throughput pressure on a broker.
- **Long-poll consumers**: `max.poll.interval.ms` must exceed worst-case processing time, or the broker evicts the consumer mid-batch, triggering rebalance storms.
- **Producer compression**: `lz4` and `zstd` give 3-5x payload reduction at modest CPU cost; almost always a net win on network-constrained clusters.

**Modern primitives**: **KRaft** (KIP-500, replaces ZooKeeper since Kafka 3.3) — Raft-based metadata quorum, simpler ops, faster failover. **Tiered storage** (KIP-405) — pushes cold partition segments to S3, removing local-disk capacity from sizing decisions. Worth mentioning in any senior-level interview as a current-events checkbox.

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
