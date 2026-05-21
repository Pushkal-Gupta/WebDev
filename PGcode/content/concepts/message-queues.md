---
slug: message-queues
module: system-design
title: Message Queues
subtitle: Decouple producers from consumers so spikes are absorbed and slow work happens off the request path.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "RabbitMQ — getting started"
    url: ""
status: published
---

## intro
A message queue is a durable buffer between two systems. The producer drops a message in and moves on. A consumer reads at its own pace and processes it. The queue absorbs traffic spikes, lets producer and consumer scale independently, and lets you retry failed work without holding a user request open.

## whyItMatters
Two architectural wins. **(1) Async work**: signing up a user shouldn't wait for the welcome-email SMTP round-trip. Drop "send welcome email to X" in a queue, return 200 immediately, let a worker send the email in the background. **(2) Spike absorption**: a flash sale generates 50k orders/sec for 30 seconds. Your fulfillment system handles 5k/sec sustained. A queue buffers the 1.5M messages and your workers drain them over 5 minutes — instead of crashing.

## intuition
Picture a coffee shop. Customers (producers) place orders at the counter. The barista (consumer) makes drinks at their own pace. A whiteboard (the queue) holds the list of pending orders. If a rush hits, the whiteboard fills up — but no customer is stuck waiting at the register, and no order is lost. Add another barista (scale the consumer) and the whiteboard drains faster.

## visualization
```
Producer ──► [ Queue: msg1, msg2, msg3, ... ] ──► Consumer A
                                              └──► Consumer B (workers in parallel)
```

## bruteForce
Do everything inline in the request handler. Every spike → timeouts. Every downstream failure → user sees an error. Coupling makes both sides brittle.

## optimal
Pick a queue type by semantics:

- **Work queue (RabbitMQ, SQS, Redis lists)**: each message goes to *one* consumer. Used for task processing.
- **Pub/sub (Kafka, Redis Pub/Sub, SNS)**: each message goes to *all* subscribed consumers. Used for fan-out events.
- **Log / event stream (Kafka, Kinesis)**: messages are durable on an append-only log; consumers track their own offsets and can replay. Used for event sourcing and analytics pipelines.

Guarantee levels — pick consciously:

- **At-most-once**: fastest, can drop messages on failure.
- **At-least-once** (default for most queues): consumer might process the same message twice → make handlers **idempotent**.
- **Exactly-once**: very expensive (transactional commits across queue + side effects). Usually faked via idempotency + dedupe.

Operational essentials:

- **Dead-letter queue (DLQ)**: after N failed attempts, route the message to a DLQ for human inspection.
- **Backpressure / max queue depth**: alert before the queue overflows.
- **Consumer groups / parallelism**: scale by adding consumers; partition keys decide which consumer gets which messages (Kafka).

## complexity
- **Latency added**: ~5–50ms (in-memory queue) to ~100ms (durable queue with replication).
- **Throughput**: Kafka can do 100k+ msgs/sec/partition; SQS standard is unbounded; RabbitMQ tops out around 50k/sec/node.
- **Storage**: a queue holding 10M messages × 1KB each = 10GB — plan for it.

## pitfalls
- **Non-idempotent consumers**: at-least-once means duplicates *will* happen. A handler that charges a card twice when it fires twice is a bug, not the queue's fault. Use idempotency keys.
- **Poison messages**: malformed payload triggers infinite retries — set a max-attempts cap with DLQ routing.
- **Ordering assumptions**: most queues guarantee order only within a partition. Cross-partition order requires application-level logic.
- **Queue as DB**: a queue is not a long-term store. Move processed data to a real DB.
- **Slow consumers**: if processing latency > arrival rate, the queue grows unboundedly. Monitor depth.

## interviewTips
- When asked "how do you send emails / notifications / process payments async?" — the answer starts with "drop a message on a queue and have a worker pool drain it."
- Always mention **idempotency** when you mention at-least-once delivery.
- Bring up the **dead-letter queue** without prompting; it shows you've operated one in production.
- Distinguish work queue vs. pub/sub vs. event log — interviewers love when you pick the right primitive.

## code.python
```python
# Minimal in-memory work queue with at-least-once delivery + retries.
from collections import deque

class WorkQueue:
    def __init__(self): self.q = deque()
    def put(self, msg): self.q.append({ "msg": msg, "attempts": 0 })
    def consume(self, handler, max_attempts=3):
        while self.q:
            item = self.q.popleft()
            item["attempts"] += 1
            try:
                handler(item["msg"])
            except Exception:
                if item["attempts"] < max_attempts: self.q.append(item)
                else: print(f"DLQ: {item}")

q = WorkQueue()
for i in range(3): q.put(f"task-{i}")
q.consume(lambda m: print("processed", m))
```

## code.javascript
```javascript
class WorkQueue {
  constructor() { this.q = []; }
  put(msg) { this.q.push({ msg, attempts: 0 }); }
  consume(handler, maxAttempts = 3) {
    while (this.q.length) {
      const item = this.q.shift();
      item.attempts++;
      try { handler(item.msg); }
      catch { if (item.attempts < maxAttempts) this.q.push(item); else console.log('DLQ', item); }
    }
  }
}
```

## code.java
```java
import java.util.*;
class WorkQueue<M> {
    static class Item<M> { M msg; int attempts; Item(M m){msg=m;attempts=0;} }
    Deque<Item<M>> q = new ArrayDeque<>();
    void put(M m) { q.add(new Item<>(m)); }
    void consume(java.util.function.Consumer<M> h, int max) {
        while (!q.isEmpty()) {
            Item<M> it = q.pollFirst(); it.attempts++;
            try { h.accept(it.msg); }
            catch (Exception e) {
                if (it.attempts < max) q.add(it); else System.out.println("DLQ " + it.msg);
            }
        }
    }
}
```

## code.cpp
```cpp
#include <deque>
#include <functional>
#include <iostream>
template<class M>
struct WorkQueue {
    struct Item { M msg; int attempts; };
    std::deque<Item> q;
    void put(M m) { q.push_back({std::move(m), 0}); }
    void consume(std::function<void(const M&)> h, int max = 3) {
        while (!q.empty()) {
            auto it = std::move(q.front()); q.pop_front();
            it.attempts++;
            try { h(it.msg); }
            catch (...) {
                if (it.attempts < max) q.push_back(std::move(it));
                else std::cout << "DLQ\n";
            }
        }
    }
};
```
