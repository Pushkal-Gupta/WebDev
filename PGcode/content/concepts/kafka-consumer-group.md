---
slug: kafka-consumer-group
module: sd-microservices
title: Kafka Consumer Groups
subtitle: Partition assignment, rebalance protocols, and how to keep your group from thrashing.
difficulty: Advanced
position: 2
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 11"
    url: "https://dataintensive.net/"
    type: book
  - title: "apache/kafka — clients/src/main/java/org/apache/kafka/clients/consumer"
    url: "https://github.com/apache/kafka"
    type: repo
  - title: "Highscalability — Kafka at scale case studies"
    url: "http://highscalability.com/"
    type: blog
status: published
---

## intro
A Kafka consumer group is the unit of horizontal scale on the read side. Members share a `group.id`, the broker assigns each member a disjoint subset of partitions, and the group as a whole reads every message exactly once (per its commit strategy). The fun part — and the source of most outages — is the *rebalance*: the choreographed handover that happens whenever a member joins, leaves, or stops responding to the coordinator's heartbeat.

## whyItMatters
- **Every streaming pipeline** at scale (Netflix's Mantis, LinkedIn's Brooklin, Confluent's Connect cluster, Pinterest's Singer) lives or dies on consumer-group rebalance behavior; rebalance storms are the textbook outage mode for streaming systems.
- **KIP-429 (Cooperative Sticky Assignor, 2019)** and **KIP-345 (Static Membership, 2018)** were specifically designed to fix the rebalance-pause problem; **KIP-848 (Next-Gen Rebalance, 3.7+)** moves coordination server-side and eliminates the JoinGroup/SyncGroup dance entirely.
- **Kafka Streams, Apache Flink with Kafka source, Spark Structured Streaming**, and **ksqlDB** all build on consumer-group semantics; their fault-tolerance models inherit the rebalance behavior of the underlying group protocol.
- **Confluent's Documentation**, **"Designing Data-Intensive Applications" Chapter 11**, and **Jay Kreps's "The Log" article** are the canonical references; every senior Kafka interview probes "heartbeat thread vs poll thread" understanding.

## intuition
A Kafka consumer group is the **unit of horizontal scale on the read side**. Members share a `group.id`; the broker assigns each member a disjoint subset of partitions; the group as a whole reads every message exactly once (per its commit strategy). The fun part — and the source of most production outages — is the **rebalance**: the choreographed handover that happens whenever a member joins, leaves, or stops responding to the coordinator's heartbeat.

The **group coordinator** is one broker (chosen by hashing `group.id` into the internal `__consumer_offsets` topic) that is the source of truth for who-owns-what. Each consumer maintains two timers: a **heartbeat thread** sending pings on `heartbeat.interval.ms` (default 3s), and a **poll thread** that must call `poll()` within `max.poll.interval.ms` (default 5min). Miss either deadline and the coordinator evicts you, triggering a rebalance.

On any membership change (member joins, leaves, evicted, or topic adds partitions), the coordinator runs a **rebalance protocol**: members send a `JoinGroup` request; the first to join becomes the group leader; the leader runs the configured **PartitionAssignor** (Range, RoundRobin, Sticky, or CooperativeSticky) over the current partition metadata; the coordinator distributes the assignment plan via `SyncGroup`.

The original 2014 **eager rebalance** protocol caused outage after outage: every membership change made every consumer revoke every partition, pause processing for hundreds of milliseconds to seconds, and reset uncommitted work. Teams worked around it by cranking `session.timeout.ms` to 30s+, which only delayed the eviction; when it eventually fired, the rebalance was worse because more uncommitted state was in flight.

**KIP-429 (Cooperative Sticky Assignor, 2019)** fixed this with an incremental protocol: only the dying member's partitions move; everyone else keeps reading their existing partitions. Rebalance happens in two passes — first announce revocations, then in a follow-up rebalance assign the freed partitions — with no global pause. **KIP-345 (Static Membership, 2018)** added `group.instance.id`: if the same id rejoins within `session.timeout.ms`, the coordinator does not rebalance at all — perfect for rolling-restart scenarios where pods come back with the same identity. **KIP-848 (3.7+)** moves coordination server-side, eliminating the JoinGroup/SyncGroup dance entirely.

## visualization
3 consumers, topic with 6 partitions, RangeAssignor → CooperativeStickyAssignor:

```
Initial assignment (Range, alphabetical by member id):
  A -> [p0, p1]
  B -> [p2, p3]
  C -> [p4, p5]

C dies. Eager protocol:
  All revoke ALL partitions -> stop-the-world pause
  A -> [p0, p1, p2]
  B -> [p3, p4, p5]

C dies. Cooperative protocol:
  Only C's partitions move -> A and B keep reading p0..p3
  A -> [p0, p1, p4]   <- gains p4 only
  B -> [p2, p3, p5]   <- gains p5 only
```

Cooperative does the rebalance in two passes: first announce revocations, then in a follow-up rebalance assign the freed partitions. No global pause.

## bruteForce
Default Kafka up to 2.3 used the eager protocol with `RangeAssignor`. Every membership change revoked every partition from every member, paused processing for hundreds of milliseconds to seconds, and reset uncommitted work. Teams worked around it by setting `session.timeout.ms` extremely high (30s+) to mask GC pauses, which only delayed the eviction; when it eventually fired the rebalance was even more painful because more uncommitted state was in flight.

## optimal
The right configuration is **CooperativeStickyAssignor + static membership + tuned timeouts + a ConsumerRebalanceListener for graceful handoff**. This is the post-KIP-429, post-KIP-345 production default that eliminates 95% of rebalance-storm incidents.

```python
from confluent_kafka import Consumer, TopicPartition

def on_assign(consumer, partitions):
    """Seek to durable checkpoint on assignment — never trust auto-commit position."""
    for p in partitions:
        p.offset = load_checkpoint(p.topic, p.partition)
    consumer.assign(partitions)

def on_revoke(consumer, partitions):
    """Flush in-flight work BEFORE the partition leaves -> no lost messages."""
    flush_in_flight()
    consumer.commit(asynchronous=False)

c = Consumer({
    "bootstrap.servers": "broker:9092",
    "group.id": "billing",
    "group.instance.id": "billing-pod-3",                    # STABLE per pod
    "partition.assignment.strategy": "cooperative-sticky",   # incremental rebalance
    "session.timeout.ms": 15000,                              # 3x heartbeat interval
    "heartbeat.interval.ms": 5000,                            # liveness probe
    "max.poll.interval.ms": 300000,                           # worst-case process time
    "enable.auto.commit": False,                              # commit explicitly
    "isolation.level": "read_committed",                      # skip aborted txns
})
c.subscribe(["orders"], on_assign=on_assign, on_revoke=on_revoke)

while True:
    msg = c.poll(1.0)
    if msg and not msg.error():
        try:
            handle(msg)
            save_checkpoint(msg.topic(), msg.partition(), msg.offset() + 1)
            c.commit(asynchronous=False)                      # commit after success
        except Exception:
            log.exception("processing failed; will retry on rebalance")
            raise
```

Why this is right: **CooperativeStickyAssignor** makes rebalances incremental — when a member dies, only its partitions move; the surviving members keep reading their existing partitions without pause. **Static membership** via `group.instance.id` means a 30-second pod restart (rolling deploy, GC pause that crossed the threshold) does NOT trigger a rebalance — the coordinator waits `session.timeout.ms` for the same id to come back. Combined, these eliminate the two most common rebalance triggers in production.

**Timeout tuning rules**:
- `heartbeat.interval.ms` = 3-5s; this is the liveness probe rate.
- `session.timeout.ms` = 3-4x heartbeat interval; the coordinator evicts you if no heartbeat arrives in this window. Higher = more tolerance for GC; lower = faster failover.
- `max.poll.interval.ms` = slightly above your worst-case batch processing time (5 min for heavy workloads). The coordinator evicts you if you do not call `poll()` within this window.
- `fetch.max.bytes` and `max.poll.records` = bound the batch size so processing fits inside `max.poll.interval.ms`.

**ConsumerRebalanceListener disciplines**:
- **`onPartitionsRevoked`**: flush in-flight work (any messages already processed but not yet committed) and commit offsets BEFORE the partitions leave. Without this, the new owner re-reads already-processed messages.
- **`onPartitionsAssigned`**: seek to your **durable checkpoint** (a position written to Postgres / S3 alongside the processed side effect), not the auto-committed offset. This handles the "committed but side effect failed" recovery case.

**Anti-patterns**:
- One partition can be owned by **only one consumer in a group at a time** — adding consumers past `partition_count` leaves the extras idle. Plan partition count upfront.
- **Mismatched assignors across rolling deploy** (half on Range, half on Cooperative) leaves the group stuck in "preparing rebalance" forever. Roll out via Range -> Sticky -> CooperativeSticky in three deploys.
- **Long processing inside `eachMessage` without bumping `max.poll.interval.ms`** -> eviction loops.
- **Committing offsets before the side effect completes** -> crash makes the message look processed when it was not. Always: process side effect, write durable checkpoint, then commit.
- **`group.instance.id` reused across two live pods** — both get fenced, group hangs. Ensure per-pod uniqueness (StatefulSet ordinal, Nomad allocation id).

For **stateful consumers** (Kafka Streams, Flink), static membership is non-optional — rebuilding local state on every rebalance costs minutes. **Kafka Streams `processing.guarantee=exactly_once_v2`** wires this and the transactional producer pattern automatically.

## complexity
time: Rebalance is O(P) protocol messages where P is partitions in the group; processing pauses are O(in-flight work) on the slowest consumer.
space: O(N) member state on the coordinator plus O(P) assignment plan.
notes: Coordinator failover triggers an automatic rebalance because members must re-discover the new coordinator. KIP-848 (next-gen rebalance, server-side) eliminates the join-sync dance entirely; rolling out in 3.7+.

## pitfalls
- Forgetting that one partition can only ever be owned by one consumer in a group — adding consumers past `partition_count` leaves the extras idle.
- Mismatched assignors across rolling deploy — half the group on Range, half on Cooperative — leaves the group stuck "preparing rebalance" forever.
- Long processing inside `eachMessage` without bumping `max.poll.interval.ms`, leading to eviction loops.
- Committing offsets *before* the side effect completes, so a crash makes the message look processed when it wasn't.
- Using `group.instance.id` but reusing it across two live pods — both get fenced, group hangs.

## interviewTips
- Explain the two threads (heartbeat vs poll) and which timeout each one defends. This single insight separates senior candidates.
- Mention static membership for stateful consumers (Kafka Streams, Flink) where rebuilding local state on rebalance costs minutes.
- Compare to RabbitMQ's competing-consumers pattern: similar idea, but RabbitMQ has no partition concept so message ordering is lost.
- For "design a job processor with N workers" — partition the queue, use a consumer group, and you have free auto-scaling and ordering per key.

## code.python
```python
from confluent_kafka import Consumer

def on_assign(consumer, partitions):
    for p in partitions:
        p.offset = load_checkpoint(p.topic, p.partition)
    consumer.assign(partitions)

def on_revoke(consumer, partitions):
    flush_in_flight()
    consumer.commit(asynchronous=False)

c = Consumer({
    "bootstrap.servers": "broker:9092",
    "group.id": "billing",
    "group.instance.id": "billing-pod-3",
    "session.timeout.ms": 15000,
    "max.poll.interval.ms": 300000,
    "partition.assignment.strategy": "cooperative-sticky",
    "enable.auto.commit": False,
})
c.subscribe(["orders"], on_assign=on_assign, on_revoke=on_revoke)

while True:
    msg = c.poll(1.0)
    if msg and not msg.error():
        handle(msg)
        c.commit(asynchronous=False)
```

## code.javascript
```javascript
import { Kafka, PartitionAssigners } from "kafkajs";

const kafka = new Kafka({ brokers: ["broker:9092"] });
const consumer = kafka.consumer({
  groupId: "billing",
  sessionTimeout: 15000,
  heartbeatInterval: 5000,
  maxWaitTimeInMs: 1000,
  partitionAssigners: [PartitionAssigners.cooperativeSticky],
});

await consumer.connect();
await consumer.subscribe({ topic: "orders" });

consumer.on(consumer.events.GROUP_JOIN, ({ payload }) => {
  console.log("assigned", payload.memberAssignment);
});

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    await handle(message);
  },
});
```

## code.java
```java
Properties props = new Properties();
props.put("bootstrap.servers", "broker:9092");
props.put("group.id", "billing");
props.put("group.instance.id", "billing-pod-3");
props.put("partition.assignment.strategy",
          "org.apache.kafka.clients.consumer.CooperativeStickyAssignor");
props.put("session.timeout.ms", "15000");
props.put("max.poll.interval.ms", "300000");
props.put("enable.auto.commit", "false");

KafkaConsumer<String, String> c = new KafkaConsumer<>(props);
c.subscribe(List.of("orders"), new ConsumerRebalanceListener() {
    public void onPartitionsRevoked(Collection<TopicPartition> ps) {
        flushInFlight();
        c.commitSync();
    }
    public void onPartitionsAssigned(Collection<TopicPartition> ps) {
        for (var p : ps) c.seek(p, loadCheckpoint(p));
    }
});

while (true) {
    for (var r : c.poll(Duration.ofSeconds(1))) handle(r);
    c.commitSync();
}
```

## code.cpp
```cpp
#include <librdkafka/rdkafkacpp.h>

class RebalanceCb : public RdKafka::RebalanceCb {
public:
    void rebalance_cb(RdKafka::KafkaConsumer* c, RdKafka::ErrorCode err,
                      std::vector<RdKafka::TopicPartition*>& parts) override {
        if (err == RdKafka::ERR__ASSIGN_PARTITIONS) {
            for (auto* p : parts) p->set_offset(load_checkpoint(p));
            c->assign(parts);
        } else {
            flush_in_flight();
            c->commitSync();
            c->unassign();
        }
    }
};

std::string err;
RdKafka::Conf* cf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
cf->set("bootstrap.servers", "broker:9092", err);
cf->set("group.id", "billing", err);
cf->set("group.instance.id", "billing-pod-3", err);
cf->set("partition.assignment.strategy", "cooperative-sticky", err);

RebalanceCb rcb;
cf->set("rebalance_cb", &rcb, err);

RdKafka::KafkaConsumer* c = RdKafka::KafkaConsumer::create(cf, err);
c->subscribe({"orders"});
while (true) {
    auto* m = c->consume(1000);
    if (m->err() == RdKafka::ERR_NO_ERROR) handle(m);
    delete m;
}
```
