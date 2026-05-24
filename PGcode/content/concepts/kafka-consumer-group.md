---
slug: kafka-consumer-group
module: system-design
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
Rebalance storms are the silent killer of streaming pipelines. A pod that GC-pauses for 12 seconds gets kicked from the group, all partitions reshuffle, every consumer pauses, half-processed batches are reset to their last commit, downstream sees a latency spike, and the cycle repeats. Knowing the protocol — heartbeat thread vs poll thread, eager vs cooperative — lets you tune away 95 percent of these incidents instead of cargo-culting timeouts.

## intuition
The group coordinator (one broker, chosen by hashing `group.id` into `__consumer_offsets`) is the source of truth for who-owns-what. Members send periodic heartbeats on a background thread (`heartbeat.interval.ms`) and call `poll()` on the main thread (`max.poll.interval.ms`). Miss either deadline and you are evicted. On any membership change the coordinator runs a *rebalance*: members send a `JoinGroup` request, the leader (first to join) runs the configured assignor over partition metadata, the coordinator distributes the plan via `SyncGroup`.

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
Switch to `CooperativeStickyAssignor` (available since 2.4, default in 3.x for new groups). Set `session.timeout.ms` to 10–15 seconds, `heartbeat.interval.ms` to one-third of that, and `max.poll.interval.ms` to slightly above your worst-case batch processing time (often 5 minutes for heavy workloads). Use static membership (`group.instance.id` set to a stable per-pod value) so a 30-second pod restart does *not* trigger a rebalance — the coordinator waits for the same id to come back. Implement `ConsumerRebalanceListener` to flush in-flight work on revoke and seek to your durable checkpoint on assign.

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
