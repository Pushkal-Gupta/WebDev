---
slug: event-bus-design
module: system-design
title: Event Bus Design
subtitle: Pub/sub layer between services — Kafka / RabbitMQ / SNS+SQS / Redpanda. Topics, ordering guarantees, fan-out, dead letters.
difficulty: Intermediate
position: 57
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Stream Processing"
    url: "https://dataintensive.net/"
    type: book
  - title: "Confluent — Apache Kafka 101"
    url: "https://developer.confluent.io/learn-kafka/"
    type: blog
  - title: "apache/kafka — distributed event streaming"
    url: "https://github.com/apache/kafka"
    type: repo
status: published
---

## intro
An **event bus** decouples producers from consumers. Producer publishes to a **topic**; one or more consumers subscribe. Bus stores events durably (Kafka) or transiently (Pub/Sub). Topics partition for parallelism; consumer groups split work; offsets track progress; dead-letter queues catch failures. Powers async microservice communication + analytics pipelines + change-data-capture + audit logs.

## whyItMatters
Synchronous service-to-service calls couple services tightly: A.create_order() → B.send_email() → C.update_inventory(). If C is down, A fails. Event bus inverts this: A emits OrderCreated; B + C subscribe independently. C down ≠ A down.

The standard async-messaging tool in production:
- **Kafka**: high-throughput log (LinkedIn, Uber, Stripe).
- **RabbitMQ / NATS**: traditional message broker.
- **AWS SNS + SQS**: managed pub/sub + queue.
- **Google Pub/Sub**: managed Kafka-equivalent.

## intuition
Producer:
```
publish("orders.placed", { orderId, userId, items, total })
```
Returns immediately. Bus persists + fans out.

Consumer:
```
subscribe("orders.placed", group="email-svc")
on message: send confirmation email
```

Key concepts:
- **Topic** = logical channel (`orders.placed`, `payments.completed`).
- **Partition** = ordered shard of topic; messages within a partition are FIFO. Different partitions are independent.
- **Consumer group** = set of consumers sharing the workload; one consumer per partition (others idle).
- **Offset** = consumer's read position in a partition; persisted so restart resumes.
- **Replication factor** = how many brokers store each partition for durability.

## visualization
```
Topic "orders.placed" with 3 partitions, replication factor 3:

         partition 0          partition 1          partition 2
        ┌──────────┐        ┌──────────┐        ┌──────────┐
        │ msg_a    │        │ msg_b    │        │ msg_c    │
broker  │ msg_d    │        │ msg_e    │        │ msg_f    │
1, 2, 3 │ msg_g    │        │ msg_h    │        │          │
        └──────────┘        └──────────┘        └──────────┘

Consumer group "email-svc" (3 instances):
  C1 → partition 0    C2 → partition 1    C3 → partition 2

Consumer group "analytics" (2 instances):
  C1 → partitions 0, 1    C2 → partition 2
  (independent group, independent offsets)

Producer key = orderId → hash(orderId) % 3 = partition_n
  → same orderId always goes to same partition → ordered per-order.
```

## bruteForce
**HTTP fan-out from producer**: producer calls each consumer's API. Tight coupling; producer must know all consumers; can't replay.

**Polling DB table**: every consumer reads "events" table. Doesn't scale; no per-consumer offset.

**ZeroMQ / direct socket**: no durability; consumer down = message lost.

A proper event bus solves all three.

## optimal
**Kafka architecture**:
- **Brokers**: N-machine cluster.
- **Topics**: created with partition count + replication factor.
- **Producer**: `key` determines partition (hash mod N); `value` is the message.
- **Consumer**: joins a group; rebalances assign partitions; commits offsets periodically.
- **Compaction**: log-compacted topics keep only the latest value per key (useful for snapshots).

**Ordering guarantee**: per-partition ordered. Across partitions, no order. Use key = entity_id to keep entity's events in order.

**Delivery semantics**:
- **At-most-once**: commit offset before processing. Fast; loses messages on crash.
- **At-least-once** (default): commit after processing. Duplicates on crash; consumers must be idempotent.
- **Exactly-once** (Kafka transactional): idempotent producer + transactional consumer + idempotent storage.

**Dead-letter queue**: messages that fail N times move to a separate topic for manual review.

**Backpressure**: Kafka's pull-based model means consumer controls rate. Slow consumer = lag in `consumer_lag` metric. Alert on it.

## complexity
- **Producer publish**: ~5ms p99 (network + broker fsync).
- **Consumer poll**: bounded by `max.poll.records` × processing time.
- **Storage**: 1× message × replication-factor + retention period.
- **Cluster sizing**: 100k msg/sec/broker typical; 1M+ with tuning.

## pitfalls
- **Hot partition**: all messages for one popular key land on one partition. Use compound keys or fan-out.
- **Consumer lag explosion**: producer faster than consumer → unbounded queue → eventual OOM. Monitor lag; scale consumers OR shed load.
- **Wrong key**: same entity's events spread across partitions → out-of-order processing → bugs.
- **Auto-commit offsets**: commits even if processing failed → message lost. Manually commit after success.
- **Schema drift**: producer adds field; old consumers crash. Use schema registry (Avro / Protobuf) with backward-compatible evolution.
- **Replication factor 1**: broker dies = data lost. Always RF ≥ 3 in production.

## interviewTips
- For "design async messaging between services" → Kafka / SNS-SQS.
- Cite **per-partition ordering** + **consumer groups** + **at-least-once + idempotent** as the three pillars.
- For senior interviews, discuss **schema registry**, **exactly-once semantics**, **multi-datacenter replication** (MirrorMaker), **tiered storage**.

## code.python
```python
from confluent_kafka import Producer, Consumer
p = Producer({'bootstrap.servers': 'kafka:9092'})
p.produce('orders.placed', key=str(order_id), value=json.dumps(payload))
p.flush()

c = Consumer({'bootstrap.servers': 'kafka:9092', 'group.id': 'email-svc',
              'auto.offset.reset': 'earliest', 'enable.auto.commit': False})
c.subscribe(['orders.placed'])
while True:
    msg = c.poll(1.0)
    if not msg or msg.error(): continue
    try:
        send_email(json.loads(msg.value()))
        c.commit(msg)            # commit AFTER success
    except Exception:
        log.exception('processing failed; will retry on next poll')
```

## code.javascript
```javascript
// KafkaJS
const { Kafka } = require('kafkajs');
const kafka = new Kafka({ brokers: ['kafka:9092'] });
const producer = kafka.producer();
await producer.connect();
await producer.send({
  topic: 'orders.placed',
  messages: [{ key: String(orderId), value: JSON.stringify(payload) }],
});

const consumer = kafka.consumer({ groupId: 'email-svc' });
await consumer.subscribe({ topic: 'orders.placed', fromBeginning: false });
await consumer.run({
  eachMessage: async ({ message }) => {
    await sendEmail(JSON.parse(message.value.toString()));
  },
});
```

## code.java
```java
// Spring Kafka
@KafkaListener(topics = "orders.placed", groupId = "email-svc")
public void onOrderPlaced(OrderPlacedEvent event) {
    emailService.sendConfirmation(event);
}
```

## code.cpp
```cpp
// librdkafka
// rd_kafka_t* producer = rd_kafka_new(RD_KAFKA_PRODUCER, conf, errstr, sizeof(errstr));
// rd_kafka_producev(producer, RD_KAFKA_V_TOPIC("orders.placed"),
//                   RD_KAFKA_V_KEY(key, key_len), RD_KAFKA_V_VALUE(value, value_len),
//                   RD_KAFKA_V_END);
```
