---
slug: message-queues
module: sd-microservices
title: Message Queues
subtitle: Decouple producers from consumers so spikes are absorbed and slow work happens off the request path.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 7
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
A message queue is a durable buffer between two systems. The producer drops a message in and moves on. A consumer reads at its own pace and processes it. The queue absorbs traffic spikes, lets producer and consumer scale independently, and lets you retry failed work without holding a user request open.

## whyItMatters
Two architectural wins. **(1) Async work**: signing up a user shouldn't wait for the welcome-email SMTP round-trip. Drop "send welcome email to X" in a queue, return 200 immediately, let a worker send the email in the background. **(2) Spike absorption**: a flash sale generates 50k orders/sec for 30 seconds. Your fulfillment system handles 5k/sec sustained. A queue buffers the 1.5M messages and your workers drain them over 5 minutes — instead of crashing.

## intuition
Picture a coffee shop. Customers (producers) place orders at the counter. The barista (consumer) makes drinks at their own pace. A whiteboard (the queue) holds the list of pending orders. If a rush hits, the whiteboard fills up — but no customer is stuck waiting at the register, and no order is lost. Add another barista (scale the consumer) and the whiteboard drains faster.

What's actually happening is decoupling in time. Without the whiteboard, the cashier would have to stand and wait while each drink is made before taking the next order — throughput collapses to the speed of the slowest barista, and a jammed espresso machine backs the line onto the sidewalk. The queue breaks that coupling: the producer's job ends the instant the message is durably written, and the consumer's job is a separate loop that pulls work whenever it has capacity. Put numbers on it. A flash sale drives 50,000 orders/sec for 30 seconds — 1.5 million orders — but your fulfillment workers sustain 5,000/sec. Inline, the 45,000/sec you can't handle become timeouts and dropped orders. With a queue, all 1.5M land safely in seconds and your workers drain the backlog over about five minutes; customers got their 200 OK immediately and the fulfillment happened slightly later. The queue converts a fatal throughput spike into a tolerable latency spike, and because the messages are durable, a worker crash mid-drain loses nothing — the unacked messages simply reappear for another worker.

## visualization
```
Producer returns immediately; workers drain at their own rate.

t0  producer -> enqueue(order-1 .. order-1500000) -> 200 OK to user  (spike absorbed)
QUEUE: [ o1, o2, o3, o4, o5, ... o1500000 ]   depth rising

Consumer A --> poll -> process o1 -> ack -> poll -> o3 ...
Consumer B --> poll -> process o2 -> ack -> poll -> o4 ...   (parallel drain)
handler(o7) throws     -> attempts<3 -> requeue -> retry later
handler(o7) throws x3   -> route to DLQ  (poison message, human inspects)
depth falls to 0 over ~5 min at 5k/sec; worker crash -> unacked msgs redelivered
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

The decision that shapes everything downstream is the delivery guarantee, because it dictates how much the consumer must defend itself. At-least-once is the pragmatic default — the broker redelivers any message the consumer did not ack, so a crash mid-processing costs a duplicate, not a loss — which means every handler must be **idempotent**: charging a card, sending an email, or decrementing inventory must produce the same end state whether it runs once or three times, usually enforced with an idempotency key checked before the side effect. Reach for a work queue when each task needs exactly one owner (send this email once), a pub/sub topic when many independent subsystems each need the same event (an "order placed" event feeding fulfillment, analytics, and notifications), and a durable log like Kafka when consumers must replay history or join streams. The failure modes to design for up front: a poison message that fails deterministically will retry forever unless you cap attempts and route to a dead-letter queue for human inspection; a consumer slower than the arrival rate grows the queue without bound, so monitor depth and alert before it overflows; and ordering holds only within a partition, so any workflow that depends on cross-key ordering needs application-level sequencing rather than a false assumption that the queue preserves global order. Treat the queue as a transport, never as a database — move processed data into a real store and let the queue stay shallow.

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
