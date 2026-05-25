---
slug: backpressure-streams
module: sd-reliability
title: Backpressure in Streams
subtitle: Let a slow consumer tell upstream "send less" before buffers explode.
difficulty: Intermediate
position: 49
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Reactive Manifesto Recap"
    url: "https://martinfowler.com/articles/lmax.html"
    type: blog
  - title: "Reactive Streams — Backpressure Explained (HighScalability)"
    url: "http://highscalability.com/blog/2015/9/14/how-do-you-design-resilient-microservices.html"
    type: blog
  - title: "akka/akka — Akka Streams (request-based backpressure)"
    url: "https://github.com/akka/akka"
    type: repo
status: published
---

## intro
Backpressure is the rule that says "the slowest stage gets to set the pace." When a downstream consumer cannot keep up, it signals upstream to pause; producers either slow down, drop, or buffer. Without backpressure, every queue is a ticking memory bomb.

## whyItMatters
- **TCP's sliding-window flow control** (RFC 9293, originally Van Jacobson 1988) is the textbook example — congestion window prevents senders from overrunning receivers; the same primitive underlies QUIC's flow control.
- **Reactive Streams specification** (Lightbend, Netflix, RedHat, Pivotal, 2015) defines the JVM standard for backpressure; **Akka Streams**, **RxJava 2/3**, **Project Reactor (Spring WebFlux)**, **Mutiny (Quarkus)** all implement it.
- **Node.js streams** (`highWaterMark`, `.pipe()`, `pipeline()`), **Go channels** (bounded buffered channels with select), **Rust's tokio mpsc channels**, and **Python's `asyncio.Queue(maxsize=N)`** are language-native backpressure primitives.
- **Kafka consumer lag** is the operational signal that triggers autoscaling in nearly every event-driven microservices deployment; **AWS SQS visibility timeout** and **Google Pub/Sub flow control** are the cloud equivalents.

## intuition
Throughput pipelines fail in one of two ways: **latency creeps up unbounded as queues grow**, or **the process gets OOM-killed**. Both come from the same root cause — the producer rate exceeds the consumer rate and nothing in the middle pushes back. The unbounded queue between them is a ticking memory bomb; even a brief traffic spike puts the system into a state from which it cannot recover without restart.

Backpressure is the rule that **the slowest stage gets to set the pace**. When a downstream consumer cannot keep up, it signals upstream to pause; producers either slow down, drop, or buffer with a hard cap. The signal can be implicit (a blocking `put()` on a bounded queue, returning when a slot frees) or explicit (a Reactive Streams `request(n)` call where the consumer declares how many items it can absorb next).

The mental model: pouring water from a hose into a bucket through a funnel. If the funnel drains slowly, the bucket overflows. Backpressure is the bucket yelling "stop pouring!" back to the hose. In code, the "yell" is a flow-control signal — `request(n)` (pull-based), `pause()`/`resume()` (Node streams), a blocking `put()` (Java BlockingQueue), or a closed channel (Go select-on-channel). The producer respects the signal and emits at most what the consumer can handle.

Four canonical strategies trade memory, latency, and loss differently:

1. **Pull / demand-based** (Reactive Streams `request(n)`): consumer asks for exactly N items; producer emits up to N then waits. Lossless, bounded memory, but requires both sides to participate in the contract. The cleanest discipline; used by Akka Streams, RxJava, Project Reactor.
2. **Window-based** (TCP, Kafka consumer): producer can have at most N unacked items in flight; ack drives forward progress. Same mathematics as TCP's congestion window.
3. **Drop-tail / drop-head** (bounded queue with overflow policy): when full, discard new (drop-tail) or oldest (drop-head). Acceptable for metrics, telemetry, video frames — anywhere lost samples are tolerable. Unacceptable for payments, orders, anything with semantic value per event.
4. **Block** (synchronous producer call): producer thread blocks until a slot frees. Simple, but a blocked producer can become its own bottleneck if many producers feed one consumer.

The deeper insight: **unbounded queues lie about capacity**. They look like "infinite buffering" until the day they don't, and that day's latency spike or OOM is invisible until it hits. Bounded queues with explicit overflow policy make the failure mode visible and choosable.

## visualization
Producer P → Buffer B (cap 4) → Consumer C. P emits at 100/s, C at 10/s. No backpressure: B fills to 4, then memory grows unbounded as we queue elsewhere. With pull-based backpressure: C calls request(2). P emits 2, waits. C finishes, calls request(2). Sustained throughput equals C's rate; memory stays at 2.

## bruteForce
Push everything into an unbounded queue and let it sort itself out. Works until traffic spikes — at which point the queue's tail latency is the difference between produced-at and consumed-at, which grows without bound. Eventually the queue is so large that even processing one item lags by minutes. Drop policies (drop-oldest, drop-newest) help, but they corrupt your data model silently.

## optimal
The right approach is **strategy-matched-to-semantics with bounded buffers, instrumented depth gauges, and queue depth as a first-class SLI**. The Reactive Streams specification, TCP's congestion-control papers, and the Node.js streams documentation define the canonical primitives.

```python
# Python asyncio: bounded queue gives "block when full" backpressure for free.
import asyncio

async def producer(queue: asyncio.Queue, n: int):
    for i in range(n):
        # put() blocks when queue is full -> producer pauses naturally.
        await queue.put(i)
    await queue.put(None)                      # sentinel

async def consumer(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        if item is None: break
        await asyncio.sleep(0.01)              # slow consumer
        queue.task_done()

async def main():
    q = asyncio.Queue(maxsize=8)               # bounded -> backpressure
    await asyncio.gather(producer(q, 1000), consumer(q))

# Reactive Streams (Java): demand-based request(n) protocol.
# class MyProcessor implements Flow.Subscriber<Item> {
#   public void onSubscribe(Flow.Subscription s) {
#     this.subscription = s;
#     s.request(10);                            // initial demand
#   }
#   public void onNext(Item it) {
#     process(it);
#     subscription.request(1);                  // ask for one more
#   }
# }
```

Pick the strategy that matches the semantics:

- **Pull / demand-based** (Reactive Streams `request(n)`, Akka Streams, RxJava, Project Reactor): the consumer explicitly asks for N items; the producer emits at most N then waits. Lossless, bounded memory, requires both sides to participate in the contract. The cleanest discipline for finite, lossless flows. Used by every reactive streams library since 2015.
- **Window-based** (TCP congestion window, Kafka consumer offset lag, gRPC flow control): producer has at most N unacked items in flight; the receiver's ack drives forward progress. Same mathematics as TCP — RFC 9293 (and Van Jacobson 1988) is the canonical reference. Used by Kafka, gRPC, QUIC.
- **Block on bounded queue** (Java BlockingQueue, Python `asyncio.Queue(maxsize=N)`, Go channels with capacity): producer blocks when the queue is full; the OS scheduler does the rest. Simple, correct, lossless. The right default for in-process producer-consumer.
- **Drop-tail / drop-head** (bounded queue with overflow policy): when full, discard new (drop-tail) or oldest (drop-head). Acceptable for **metrics, telemetry, video frames, log shipping** — anywhere lost samples are tolerable. Unacceptable for **payments, orders, anything with semantic value per event**. Always emit a metric on drop so operators see the loss.

**Production disciplines that matter**:
- **Bounded queues with explicit overflow policy** — unbounded queues "for safety" hide failure until OOM; the day they fail is the day everything fails at once. Always bound; always document the overflow policy.
- **Queue depth as an SLI** — emit `queue.depth` per stage to Prometheus; alert when sustained > 80% capacity (predicts saturation before it bites).
- **Don't mix push and pull stages** without explicit conversion — the push side wins races and overruns the pull side's buffer. Use a buffer-with-drop or buffer-with-backpressure adapter at the boundary.
- **Backpressure crosses the network boundary** — a slow consumer can choke producers via TCP's window mechanism even across an HTTP/2 stream, and a WebSocket buffer in your client matters as much as the server-side queue.
- **Don't backpressure on a CPU-bound consumer** when the real fix is parallelism or batching — bounded queues turn a CPU problem into a latency problem; scaling consumers or vectorizing work is the better answer.

**Adjacent operational patterns**:
- **Kafka consumer lag-based autoscaling** (KEDA, Confluent Cloud autoscaler): scale consumer-group size when lag exceeds a threshold. The operational manifestation of backpressure at the platform level.
- **Circuit breakers** (Hystrix, Resilience4j): trip when downstream saturates; combine with bulkheads to contain blast radius.
- **Disruptor pattern** (LMAX, used in some HFT systems): a ring buffer with cursor-based coordination, lower latency than queue-based backpressure at the cost of fixed buffer size.

## complexity
time: O(1) per signal exchange
space: O(b) for buffer of size b — chosen to bound the worst-case memory cost
notes: End-to-end latency under backpressure is bounded by buffer size divided by consumer rate. Throughput equals min(producer rate, consumer rate).

## pitfalls
- Unbounded queues "for safety" — they hide failure until OOM.
- Mixing push and pull stages without explicit conversion — the push side wins and overruns the pull side's buffer.
- Backpressure on a CPU-bound consumer when the real fix is parallelism or batching.
- Forgetting downstream backpressure crosses the network boundary — the WebSocket buffer in your client matters too.
- Silent drops with no metric — operationally invisible until users complain.

## interviewTips
- Cite Reactive Streams' `request(n)` contract and TCP's congestion window as siblings.
- Discuss when dropping is correct (telemetry) vs unacceptable (payments).
- Mention Kafka consumer-lag-based autoscaling as the operational manifestation.

## code.python
```python
import asyncio

async def producer(queue: asyncio.Queue, n: int):
    for i in range(n):
        await queue.put(i)
    await queue.put(None)

async def consumer(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        if item is None: break
        await asyncio.sleep(0.01)
        queue.task_done()

async def main():
    q = asyncio.Queue(maxsize=8)
    await asyncio.gather(producer(q, 1000), consumer(q))

asyncio.run(main())
```

## code.javascript
```javascript
const { Readable, Writable, pipeline } = require("stream");

const src = Readable.from((function* () {
  for (let i = 0; i < 1000; i++) yield Buffer.from(String(i));
})());

const sink = new Writable({
  highWaterMark: 8,
  write(chunk, enc, cb) {
    setTimeout(() => cb(), 10);
  },
});

pipeline(src, sink, (err) => {
  if (err) console.error(err);
});
```

## code.java
```java
import java.util.concurrent.*;

public class BackpressureDemo {
    public static void main(String[] args) throws Exception {
        BlockingQueue<Integer> q = new ArrayBlockingQueue<>(8);
        Thread producer = new Thread(() -> {
            try {
                for (int i = 0; i < 1000; i++) q.put(i);
                q.put(-1);
            } catch (InterruptedException ignored) {}
        });
        Thread consumer = new Thread(() -> {
            try {
                while (true) {
                    int v = q.take();
                    if (v == -1) break;
                    Thread.sleep(10);
                }
            } catch (InterruptedException ignored) {}
        });
        producer.start(); consumer.start();
        producer.join(); consumer.join();
    }
}
```

## code.cpp
```cpp
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>

template <class T>
class BoundedQueue {
    std::queue<T> q;
    const size_t cap;
    std::mutex m;
    std::condition_variable notFull, notEmpty;
public:
    explicit BoundedQueue(size_t c) : cap(c) {}
    void put(T v) {
        std::unique_lock<std::mutex> lk(m);
        notFull.wait(lk, [&]{ return q.size() < cap; });
        q.push(std::move(v));
        notEmpty.notify_one();
    }
    T take() {
        std::unique_lock<std::mutex> lk(m);
        notEmpty.wait(lk, [&]{ return !q.empty(); });
        T v = std::move(q.front()); q.pop();
        notFull.notify_one();
        return v;
    }
};
```
