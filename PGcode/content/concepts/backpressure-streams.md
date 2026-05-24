---
slug: backpressure-streams
module: system-design
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
Throughput pipelines fail in one of two ways: latency creeps up as queues grow, or the process gets OOM-killed. Both come from the same root cause — producer rate exceeds consumer rate and nothing in the middle pushes back. TCP solved this in the 1980s with sliding-window flow control. Reactive Streams (used by Akka Streams, RxJava, Project Reactor) bring the same discipline to in-process and cross-service async pipelines.

## intuition
Imagine pouring water from a hose into a bucket through a funnel. If the funnel drains slowly, the bucket overflows. Backpressure is the bucket yelling "stop pouring!" back to the hose. In code, the "yell" is usually a `request(n)` signal: the consumer says how many items it can absorb, and the producer emits no more than that.

## visualization
Producer P → Buffer B (cap 4) → Consumer C. P emits at 100/s, C at 10/s. No backpressure: B fills to 4, then memory grows unbounded as we queue elsewhere. With pull-based backpressure: C calls request(2). P emits 2, waits. C finishes, calls request(2). Sustained throughput equals C's rate; memory stays at 2.

## bruteForce
Push everything into an unbounded queue and let it sort itself out. Works until traffic spikes — at which point the queue's tail latency is the difference between produced-at and consumed-at, which grows without bound. Eventually the queue is so large that even processing one item lags by minutes. Drop policies (drop-oldest, drop-newest) help, but they corrupt your data model silently.

## optimal
Pick a backpressure strategy that matches the semantics:
- **Pull / demand-based** (Reactive Streams `request(n)`): consumer asks for exactly what it can handle. Best for finite, lossless flows.
- **Window-based**: producer can have at most N unacked items in flight (TCP, Kafka consumer lag).
- **Drop-tail / drop-head**: bounded queue, discard on overflow. Acceptable for metrics, telemetry, video frames.
- **Block**: synchronous producer call that returns when slot frees. Simple, but a blocked producer can become its own bottleneck.

Compose pipelines explicitly: bounded buffers between stages, instrumented depth gauges, alerts on sustained near-full. Treat queue depth as a first-class SLI.

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
