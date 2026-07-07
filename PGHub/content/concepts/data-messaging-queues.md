---
slug: data-messaging-queues
module: data-engineering
title: Messaging and Log-Based Queues
subtitle: Decouple producers from consumers with durable messaging — queues versus pub/sub, Kafka's partitioned log, consumer groups, backpressure, and replay.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 17
prereqs: [data-etl-pipelines, data-batch-streaming]
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 11: Message brokers and log-based messaging"
    url: "https://dataintensive.net/"
    type: book
  - title: "Apache Kafka — Design and implementation (the log, partitions, replication)"
    url: "https://kafka.apache.org/documentation/#design"
    type: docs
  - title: "Apache Kafka — Consumer groups and offset management"
    url: "https://kafka.apache.org/documentation/#intro_consumers"
    type: docs
  - title: "Kafka: a Distributed Messaging System for Log Processing (Kreps et al.)"
    url: "https://notes.stephenholiday.com/Kafka.pdf"
    type: article
  - title: "Jay Kreps — The Log: What every software engineer should know about real-time data's unifying abstraction"
    url: "https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying"
    type: article
status: published
---

## intro

A message broker sits between the systems that produce data and the systems that consume it, so neither has to know about, wait for, or match the speed of the other. A producer drops an event onto the broker and moves on; consumers pick it up whenever they are ready. This decoupling is what lets an orders service emit a "purchase completed" event and have billing, email, analytics, and fraud-detection each react independently, none blocking the checkout. There are two classic shapes — the **queue** (each message goes to one worker, work is divided) and **pub/sub** (each message goes to every subscriber, work is fanned out) — and one modern design, the **log**, popularized by Kafka, that unifies both by keeping messages in a durable, replayable, append-only sequence instead of deleting them on read.

## whyItMatters

Without a broker, every service calls every other service directly and synchronously: checkout waits for the email server, which waits for the analytics database, and one slow dependency stalls the whole request or drops data when it is down. A broker turns that brittle mesh into a spine — producers and consumers scale, deploy, and fail independently, and a temporary consumer outage means messages pile up safely rather than vanish. The log design goes further: because messages are retained rather than consumed-and-deleted, you can add a brand-new consumer next year and have it replay all of history, reprocess after fixing a bug, or run a fast experimental consumer beside the production one over the same data. This is the backbone of every event-driven architecture and every streaming pipeline. Getting ordering, delivery guarantees, and backpressure right here determines whether the whole system loses data, double-processes it, or falls over under load.

## intuition

Compare the two classic patterns first. A **queue** is a shared to-do list: producers add tasks, a pool of workers each grab a task, and once a worker takes one it is gone from the list. Work is *divided* — three workers get through the list three times faster. This is the model for a job queue: resize these images, send these emails. **Pub/sub** (publish-subscribe) is a mailing list: every subscriber gets its own copy of every message. Work is *fanned out* — billing, analytics, and search each independently see every order. Traditional brokers (RabbitMQ, SQS) delete a message once it is acknowledged, so a slow or new consumer cannot get history back.

Kafka's **log** unifies both. A topic is an append-only file: producers only ever append to the end, and each message gets a monotonically increasing **offset** (its position). Consumers do not remove messages; they simply track *which offset they have read up to*. Retention is by time or size, not by consumption — the message stays until it ages out, so any consumer can rewind. To scale, a topic is split into **partitions**, each an independent ordered log; a message's key hashes to a partition, and ordering is guaranteed *within* a partition, not across the topic. A **consumer group** is how you get queue semantics: the group's consumers split the partitions among themselves so each partition is read by exactly one member — parallelism with no double-processing. Use *different* group ids and you get pub/sub: each group independently reads every message from offset zero. One design, both patterns, plus replay for free.

When a consumer cannot keep up, the log's design gives you **backpressure** the safe way: because the consumer pulls at its own pace and unread messages sit durably in the log (bounded by retention), a slow consumer just develops *lag* — its offset falls behind the log end — instead of overflowing a buffer or forcing the producer to block. You monitor lag, and if it grows you add consumers (up to the partition count) to catch up.

## visualization

```
 producers append to the END of each partition (append-only, ordered):

 topic "orders", partition 0:
   offset:  0    1    2    3    4    5    6   <- log end (new appends here)
            [m0][m1][m2][m3][m4][m5][m6]

 group "billing"  (queue semantics: splits partitions, one owner each)
     consumer-A  reads partition 0, committed offset -> 4   (lag = 2)

 group "analytics" (pub/sub: its OWN offset over the SAME messages)
     consumer-X  committed offset -> 6   (caught up, lag = 0)

 REPLAY: reset "analytics" offset back to 0 -> re-reads m0..m6
         (messages were NOT deleted on read -- retained by time/size)

 backpressure: slow group's offset falls behind -> LAG grows,
               messages wait durably in the log, producer never blocks
```

## bruteForce

The naive decoupling is a direct synchronous call — checkout invokes the email service, the analytics service, and the fraud service inline before returning to the user. It is the obvious thing and it fails in every failure mode. If any downstream is slow, the user's checkout is slow; if any is down, the request errors or you drop the event entirely; adding a fifth consumer means editing and redeploying checkout. The first improvement, a simple in-memory or delete-on-read queue, decouples timing but is still fragile: messages vanish once read, so a consumer that crashes mid-processing loses the message, a new consumer cannot see anything that happened before it started, and there is no way to reprocess history after a bug. Push-based delivery makes it worse under load — the broker shoves messages at a consumer faster than it can handle them, overflowing buffers and forcing drops or forcing the producer to block. And with a single unpartitioned queue there is no way to scale ordered processing: you either have one consumer (a bottleneck) or many consumers with no ordering guarantee at all.

## optimal

Put a durable, partitioned, log-based broker between producers and consumers, and let offsets, consumer groups, and pull-based flow do the work. Producers append events to a topic and return immediately — checkout no longer waits on billing or email. Retain messages by time or size rather than deleting on read, so the log is a replayable source of truth, not a transient pipe.

Partition the topic to scale while preserving the ordering that matters: choose a partition key (e.g. `customer_id`) so all events for one entity land in the same partition and stay strictly ordered, while different entities spread across partitions for parallelism. A **consumer group** assigns each partition to exactly one member, so throughput scales up to the partition count with no double-processing; a second group with a different id independently consumes the same stream (pub/sub fan-out). Consumers **pull** at their own pace and **commit** their processed offset, which gives at-least-once delivery — commit *after* processing so a crash re-reads rather than skips, and make the processing idempotent (upsert on a key) so the inevitable replays converge. For end-to-end exactly-once, Kafka offers idempotent producers plus transactions that atomically tie the output write to the offset commit.

**Backpressure** falls out of the pull model: a slow consumer simply accrues **lag** (log-end offset minus committed offset), and the unread messages wait durably in the log rather than overflowing anything or blocking producers. You monitor lag as the health signal and scale consumers within the group to drain it. Reliability comes from replication — each partition has a leader and follower replicas on other brokers, and a configurable number of in-sync replicas must acknowledge a write before it is considered committed, trading latency for durability. **Replay** is the payoff of retention: reset a group's offset to reprocess after a bug, spin up a fresh consumer that reads from offset zero to backfill a new datastore, or run a shadow consumer beside production over identical data. A poison message that repeatedly fails goes to a dead-letter topic after N attempts instead of blocking its partition forever. The result is a spine where producers and consumers scale and fail independently, ordering is guaranteed where it counts, load is absorbed as lag rather than loss, and history is always replayable.

## complexity

- **time:** Append and sequential read are O(1) amortized — the log is written and read sequentially, which is why disk-backed brokers hit high throughput despite not being in memory. Consumer parallelism scales linearly up to the partition count; beyond that, extra consumers in a group sit idle.
- **space:** Storage is proportional to ingest rate × retention window × replication factor. Longer retention buys more replay range at linear storage cost; more replicas buy durability at the same linear cost. Consumer state is just a committed offset per partition — negligible.
- **notes:** Ordering is per-partition, so the partition count caps ordered parallelism — pick it deliberately since repartitioning is disruptive. Lag (log-end minus committed offset) is the key operational metric: flat lag means healthy, growing lag means the consumer is falling behind and needs more members or faster processing.

## pitfalls

- **Committing the offset before processing finishes.** A crash after commit but before the work is done skips the message permanently (data loss). Fix: commit *after* successful processing for at-least-once, and make processing idempotent so the resulting replays are harmless.
- **Expecting global ordering across a topic.** Order is guaranteed only within a partition; a topic-wide order does not exist once you have more than one partition. Fix: route events that must stay ordered to the same partition via a shared key (e.g. `customer_id`).
- **Confusing at-least-once with exactly-once.** Pull + commit gives at-least-once, so retries reprocess messages. Fix: make consumers idempotent (upsert on a key), or use transactional producers that atomically bind output writes to offset commits for end-to-end exactly-once.
- **No dead-letter topic for poison messages.** A message that always fails is retried forever and blocks its whole partition behind it. Fix: after N failed attempts, route it to a dead-letter topic and keep the partition moving; inspect the DLQ separately.
- **Under-partitioning or over-partitioning.** Too few partitions caps consumer parallelism and creates a bottleneck; too many add metadata overhead and can hurt latency. Fix: size partition count to peak required parallelism with headroom, and remember consumers beyond the partition count sit idle.
- **Ignoring consumer lag until it is a crisis.** Silent, growing lag means the pipeline is falling behind and freshness is degrading unnoticed. Fix: alert on lag trend, not just absolute value; scale consumers or optimize processing before retention deletes unread messages.

## interviewTips

- Explain the log as the unifying abstraction: same append-only, offset-tracked, retained sequence gives queue semantics (one consumer group splitting partitions) and pub/sub (multiple groups over the same data) plus replay for free. That framing beats listing brokers.
- Nail the ordering answer precisely: ordering is *per-partition*, keyed routing keeps a given entity ordered, and the partition count is the ceiling on ordered parallelism. Interviewers reliably probe "how do you keep a user's events in order while scaling."
- Describe backpressure as lag in a pull system, not as a blocked producer: unread messages wait durably in the log, you monitor lag, and you scale consumers to drain it. Then mention dead-letter topics for poison messages — it shows operational maturity.

## keyTakeaways

- A durable, partitioned log decouples producers from consumers and unifies both classic patterns: one consumer group splitting partitions gives queue semantics, multiple groups over the same log give pub/sub fan-out.
- Retention-by-time-or-size (not delete-on-read) plus per-consumer offsets make history replayable — reset an offset to reprocess after a bug, or start a new consumer at zero to backfill a new store.
- Pull-based consumption turns overload into bounded lag rather than loss or producer-blocking; monitor lag, scale consumers up to the partition count, commit offsets after processing, and keep consumers idempotent.

## code.sql

```sql
-- The consumer-side offset ledger, modeled as a table, plus the idempotent
-- upsert that makes at-least-once replays converge. This is the essence of how
-- a log consumer tracks progress and processes safely -- broker-agnostic SQL.

-- Per (group, topic, partition) committed offset: the consumer's bookmark.
CREATE TABLE consumer_offsets (
  group_id   TEXT,
  topic      TEXT,
  partition  INT,
  committed  BIGINT,          -- highest offset fully PROCESSED (not just read)
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, topic, partition)
);

-- Idempotent sink: processing message m converges on replay because we UPSERT
-- on the business key instead of blind-inserting. At-least-once + idempotent
-- effect = safe reprocessing.
INSERT INTO order_totals (order_id, amount, last_offset)
VALUES (:order_id, :amount, :offset)
ON CONFLICT (order_id) DO UPDATE
  SET amount = EXCLUDED.amount,
      last_offset = EXCLUDED.last_offset;

-- Commit the offset only AFTER the processing above succeeds, so a crash
-- re-reads rather than skips. Reset it lower to REPLAY from an old position.
INSERT INTO consumer_offsets (group_id, topic, partition, committed)
VALUES ('billing', 'orders', 0, :offset)
ON CONFLICT (group_id, topic, partition) DO UPDATE
  SET committed = EXCLUDED.committed, updated_at = now();

-- Consumer LAG per partition = log end offset - committed offset.
SELECT partition, :log_end_offset - committed AS lag
FROM   consumer_offsets
WHERE  group_id = 'billing' AND topic = 'orders';
```

## code.python

```python
"""A partitioned append-only log with consumer groups, offsets, and replay.

Deterministic in-memory model of the Kafka core: producers append (keyed to a
partition, strictly ordered within it), consumer groups split partitions and
track independent offsets, at-least-once delivery commits AFTER processing, and
you can reset an offset to replay. No randomness, no I/O.
"""


class PartitionedLog:
    def __init__(self, num_partitions):
        # Each partition is an independent, ordered, append-only list.
        self.partitions = [[] for _ in range(num_partitions)]

    def append(self, key, value):
        # Keyed routing: same key -> same partition -> preserved ordering.
        p = hash(key) % len(self.partitions)
        offset = len(self.partitions[p])   # position = monotonically increasing
        self.partitions[p].append((key, value))
        return p, offset

    def end_offset(self, p):
        return len(self.partitions[p])


class ConsumerGroup:
    def __init__(self, log, group_id):
        self.log = log
        self.group_id = group_id
        # Committed offset per partition: the group's bookmark (not delete-on-read).
        self.committed = {p: 0 for p in range(len(log.partitions))}

    def poll(self, process):
        # Pull at our own pace; commit AFTER processing (at-least-once).
        for p, part in enumerate(self.log.partitions):
            while self.committed[p] < len(part):
                off = self.committed[p]
                process(self.group_id, p, off, part[off])
                self.committed[p] = off + 1     # commit only on success

    def lag(self):
        # Backpressure surfaces as lag, not loss: end - committed per partition.
        return {p: self.log.end_offset(p) - self.committed[p]
                for p in self.committed}

    def replay_from(self, partition, offset):
        # Retention means we can rewind and reprocess history.
        self.committed[partition] = offset


if __name__ == "__main__":
    log = PartitionedLog(num_partitions=3)
    for i in range(6):
        log.append(key=f"cust-{i % 2}", value=f"order-{i}")

    seen = []
    billing = ConsumerGroup(log, "billing")      # queue-style: one group
    billing.poll(lambda g, p, o, m: seen.append((p, o, m[1])))
    print("processed:", len(seen), "lag:", billing.lag())

    analytics = ConsumerGroup(log, "analytics")  # pub/sub: own offsets, same data
    analytics.replay_from(0, 0)                   # independent replay
    analytics.poll(lambda g, p, o, m: None)
```
