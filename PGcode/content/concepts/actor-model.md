---
slug: actor-model
module: system-design
title: Actor Model
subtitle: Each actor owns its state, processes one message at a time, and supervises its children.
difficulty: Advanced
position: 47
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Microservices.io — Saga & Messaging Patterns"
    url: "https://microservices.io/patterns/data/saga.html"
    type: book
  - title: "Martin Fowler — Event Collaboration"
    url: "https://martinfowler.com/eaaDev/EventCollaboration.html"
    type: blog
  - title: "akka/akka — JVM Actor Framework"
    url: "https://github.com/akka/akka"
    type: repo
status: published
---

## intro
The actor model treats concurrency as a swarm of independent "actors" that own private state and communicate only by passing immutable messages. Each actor reads one message from its mailbox at a time, decides what to do, optionally spawns child actors, and tells its supervisor when it crashes. Erlang built telecom switches on this idea; Akka brought it to the JVM.

## whyItMatters
Shared-memory threads force you to reason about locks, races, and partial writes — every interview that asks "what happens if two threads call this method?" is really asking "did you pick the wrong primitive?" Actors sidestep the question entirely: state is private, messages are queued, and concurrency degenerates into single-threaded code per actor. The model also makes failure local: a crashed actor restarts under its supervisor without poisoning the rest of the system.

## intuition
Picture a call center. Each agent (actor) has their own desk (state), a queue of callers waiting on hold (mailbox), and a manager (supervisor) who decides what to do when an agent quits or panics. Agents never read each other's notes; they exchange information by leaving voicemails. The call center scales by hiring more agents, not by giving every agent a shared whiteboard with a single pen.

## visualization
Mailbox queue grows: [pay, refund, cancel]. Actor pops "pay" → updates balance from 50 to 80 → emits "receipt" message to client actor. Pops "refund" → balance 80 to 60. Crash on "cancel"? Supervisor receives a Failed signal, restarts the actor with last known state, and resumes from "cancel". External observer never sees a half-updated balance.

## bruteForce
Coordinate threads with locks, condition variables, and shared maps. Works at small scale, but every new feature introduces new lock orderings and the system slowly grinds to a halt on contention. Debugging deadlocks requires reading every code path that touches the shared state — a job that doesn't fit on a whiteboard.

## optimal
Define actors as small classes with `receive(msg)` methods. Actors hold no public fields; the runtime gives each one a thread-safe mailbox and dispatches it on a thread pool when work arrives. Hierarchy matters: an actor that spawns children is responsible for their failures via a supervision strategy (`restart`, `resume`, `stop`, `escalate`). For request/response, use an "ask" pattern that wraps the reply in a future; for fire-and-forget, use "tell." Avoid blocking inside `receive`; offload IO to a dedicated dispatcher so one slow message doesn't starve the rest of the mailbox.

## complexity
time: O(1) per message dispatch
space: O(m) where m is the total queued messages across all mailboxes
notes: Throughput scales with cores until contention on the shared scheduler queue dominates. Latency is bounded by mailbox depth — slow consumers can grow mailboxes unboundedly without backpressure.

## pitfalls
- Mutable state escaping via message payloads — always send copies or immutable records.
- Blocking on a future inside `receive` — deadlocks the dispatcher.
- Unbounded mailboxes — a slow actor swallows memory until OOM. Use bounded mailboxes with backpressure or drop policies.
- Treating actors like RPC endpoints — fine-grained chatty traffic destroys throughput.
- Forgetting supervision — an unhandled exception silently kills the actor and its messages.

## interviewTips
- Compare with goroutines + channels (Go) and async/await (Node) — actors are one point in the same design space.
- Mention "let it crash" philosophy: restart is cheaper than defensive programming.
- Discuss when actors are wrong: tight numerical loops where shared-nothing serialization hurts more than locks.

## code.python
```python
import asyncio
from collections import deque

class Actor:
    def __init__(self):
        self.mailbox = asyncio.Queue()
        self.task = asyncio.create_task(self.run())

    async def run(self):
        while True:
            msg = await self.mailbox.get()
            await self.receive(msg)

    async def receive(self, msg):
        raise NotImplementedError

class Counter(Actor):
    def __init__(self):
        super().__init__()
        self.n = 0
    async def receive(self, msg):
        if msg == "inc":
            self.n += 1
        elif msg == "get":
            print(self.n)
```

## code.javascript
```javascript
class Actor {
  constructor() {
    this.mailbox = [];
    this.busy = false;
  }
  tell(msg) {
    this.mailbox.push(msg);
    if (!this.busy) this.drain();
  }
  async drain() {
    this.busy = true;
    while (this.mailbox.length) {
      await this.receive(this.mailbox.shift());
    }
    this.busy = false;
  }
}

class Counter extends Actor {
  constructor() { super(); this.n = 0; }
  async receive(msg) {
    if (msg === "inc") this.n++;
    else if (msg === "get") console.log(this.n);
  }
}
```

## code.java
```java
import java.util.concurrent.*;

abstract class Actor {
    private final BlockingQueue<Object> mailbox = new LinkedBlockingQueue<>();
    public Actor(ExecutorService pool) {
        pool.submit(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try { receive(mailbox.take()); }
                catch (Exception e) { onFailure(e); }
            }
        });
    }
    public void tell(Object msg) { mailbox.offer(msg); }
    protected abstract void receive(Object msg) throws Exception;
    protected void onFailure(Exception e) { e.printStackTrace(); }
}

class Counter extends Actor {
    int n = 0;
    Counter(ExecutorService pool) { super(pool); }
    protected void receive(Object msg) {
        if ("inc".equals(msg)) n++;
        else if ("get".equals(msg)) System.out.println(n);
    }
}
```

## code.cpp
```cpp
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>

class Actor {
    std::queue<std::function<void()>> mbox;
    std::mutex m;
    std::condition_variable cv;
    std::thread worker;
    bool running = true;
public:
    Actor() {
        worker = std::thread([this]{
            while (running) {
                std::function<void()> job;
                {
                    std::unique_lock<std::mutex> lk(m);
                    cv.wait(lk, [this]{ return !mbox.empty() || !running; });
                    if (!running) return;
                    job = std::move(mbox.front());
                    mbox.pop();
                }
                job();
            }
        });
    }
    void tell(std::function<void()> f) {
        { std::lock_guard<std::mutex> lk(m); mbox.push(std::move(f)); }
        cv.notify_one();
    }
    ~Actor() { running = false; cv.notify_one(); worker.join(); }
};
```
