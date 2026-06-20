---
slug: actor-model
module: sd-microservices
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
- **Erlang/OTP** (Joe Armstrong, 1986, his PhD thesis "Making reliable distributed systems in the presence of software errors") built the actor model into a language and runtime; **Erlang powers WhatsApp's 2-billion-user chat infrastructure** and most telecom switches still running today.
- **Akka (JVM)**, **Akka.NET**, **Microsoft Orleans**, **Pony**, **Elixir/OTP** (the modern Erlang VM successor), and **Vlingo** are production actor frameworks; **Riak** and **CouchDB** are built on actor principles.
- **Carl Hewitt's 1973 paper** "A Universal Modular Actor Formalism for Artificial Intelligence" defined the model; it is one of the three classical concurrency models alongside shared-memory threads and CSP/Go channels.
- **Go goroutines + channels** and **Rust's tokio tasks** are actor-adjacent: lightweight isolated units communicating by message passing, though without supervision hierarchies. **Akka Cluster** and **Microsoft Orleans Virtual Actors** extend the model across machines for distributed actors.

## intuition
The actor model treats concurrency as a **swarm of independent actors** that own private state and communicate only by passing immutable messages. Each actor reads one message from its mailbox at a time, decides what to do (update state, send messages, spawn children), and is supervised by a parent actor that decides what to do if it crashes. Erlang built telecom switches on this idea in the 1980s; Akka brought it to the JVM in 2009; today every distributed-systems language has at least an actor-adjacent primitive (Go's goroutines + channels, Rust's tokio tasks, Pony, Elixir/OTP).

Shared-memory threads force you to reason about locks, races, partial writes, and memory barriers — every interview question that asks "what happens if two threads call this method?" is really asking "did you pick the wrong primitive?" Actors sidestep the question entirely: **state is private, messages are queued, and concurrency degenerates into single-threaded code per actor**. The runtime serializes message delivery per actor, so the code inside `receive` runs as if it were single-threaded — no locks needed, no race conditions possible within an actor.

The model makes failure local. A crashed actor's supervisor receives a Failed signal and chooses one of four strategies: **Restart** (replace the actor with a fresh instance, drop in-flight state), **Resume** (keep going with the same state), **Stop** (terminate permanently), **Escalate** (kick the decision up to the grandparent). The Erlang slogan is "let it crash" — restart is cheaper than defensive code because the supervision tree guarantees a clean fresh state. A bug in one actor cannot poison the rest of the system; the blast radius is exactly one actor (plus its mailbox of in-flight messages).

The call-center analogy: each agent (actor) has their own desk (state), a queue of callers on hold (mailbox), and a manager (supervisor) who decides what to do when an agent quits or panics. Agents never read each other's notes; they exchange information by leaving voicemails (messages). The call center scales by hiring more agents, not by giving every agent a shared whiteboard with a single pen. Distributed actor systems (Akka Cluster, Microsoft Orleans, Erlang/OTP) extend this across machines, with location transparency — the caller does not know whether the target actor lives in the same process, the same machine, or a different region.

## visualization
Mailbox queue grows: [pay, refund, cancel]. Actor pops "pay" → updates balance from 50 to 80 → emits "receipt" message to client actor. Pops "refund" → balance 80 to 60. Crash on "cancel"? Supervisor receives a Failed signal, restarts the actor with last known state, and resumes from "cancel". External observer never sees a half-updated balance.

## bruteForce
Coordinate threads with locks, condition variables, and shared maps. Works at small scale, but every new feature introduces new lock orderings and the system slowly grinds to a halt on contention. Debugging deadlocks requires reading every code path that touches the shared state — a job that doesn't fit on a whiteboard.

## optimal
The right architecture is **small focused actors with bounded mailboxes, explicit supervision hierarchies, and zero blocking inside `receive`**. Akka's documentation, Joe Armstrong's "Programming Erlang", and the OTP design principles formalize the discipline.

```scala
// Akka Typed (Scala) — modern actor definition with bounded mailbox.
import akka.actor.typed._
import akka.actor.typed.scaladsl._

object AccountActor {
  sealed trait Cmd
  final case class Deposit(amount: Long) extends Cmd
  final case class GetBalance(replyTo: ActorRef[Long]) extends Cmd

  def apply(initial: Long): Behavior[Cmd] =
    Behaviors.setup { ctx =>
      var balance = initial                            // PRIVATE state
      Behaviors.receiveMessage {
        case Deposit(amount) =>
          balance += amount                            // single-threaded per actor
          Behaviors.same
        case GetBalance(replyTo) =>
          replyTo ! balance                            // fire-and-forget reply
          Behaviors.same
      }
    }
}

// Supervision: parent decides how to handle child failure.
val supervised = Behaviors
  .supervise(AccountActor(0L))
  .onFailure[Exception](SupervisorStrategy.restart.withLimit(3, 30.seconds))
```

Why this is right: **state is private** (the `balance` var is closed over inside `Behaviors.setup`, inaccessible from outside), **messages are immutable sealed traits** (no shared mutation across actor boundaries), **the runtime serializes `receive` per actor** (no locks needed inside actor code), and **supervision policy is explicit** (the parent decides whether failures should restart, resume, stop, or escalate to grandparent).

**Production disciplines**:
- **Bounded mailboxes**: `mailbox-capacity = 1000` in Akka config; without bounds, a slow consumer's mailbox grows until OOM. Pair with **drop policies** (DropTail, DropHead) or **backpressure signals** (Reactive Streams).
- **Never block inside `receive`**: blocking starves the dispatcher (typically a fork-join pool sized to CPU count). Offload IO to a separate dispatcher: `Behaviors.supervise(...).onFailure(...).withDispatcher("akka.io-dispatcher")`.
- **`ask` for request/response** (returns Future, with timeout); **`tell` for fire-and-forget** (no reply). Mixing them inside one actor is fine; blocking on `ask` inside another actor's `receive` is the most common deadlock.
- **Supervision hierarchies**: each actor that spawns children is responsible for their failures. The four strategies (Restart, Resume, Stop, Escalate) compose into "let it crash" — favor restart over defensive programming because the runtime guarantees consistent state on restart.
- **Idempotent message handlers**: at-least-once delivery (Akka's default) means duplicates can arrive; design `receive` to be safe under replay.

**Cluster and distributed actors**:
- **Akka Cluster Sharding**: actors are pinned to nodes via consistent hashing on `entityId`; rebalances move actors across nodes on failure.
- **Microsoft Orleans Virtual Actors (Grains)**: actors are activated on demand and deactivated when idle; the runtime persists state to durable storage.
- **Erlang's `gen_server` + supervision trees**: the gold standard for fault-tolerant distributed systems (90+ nines of uptime on AXD-301 ATM switch hardware).

**When actors are wrong**:
- **Tight numerical loops** (matrix multiplication, image filters): shared-nothing serialization costs more than mutex contention; use threads or SIMD instead.
- **Strongly transactional cross-actor invariants** ("user balance + bonus pool == total"): actors are eventually-consistent across mailboxes; use a database transaction or a coordinating actor.
- **Tiny services with simple state**: a stateless HTTP handler with a database is simpler; actors are overkill until you have meaningful per-entity state.

**Pitfalls**:
- **Mutable payloads** leaking into messages — always send copies or immutable records. Java's `final` fields and Scala's case classes handle this; raw POJOs do not.
- **Unbounded mailboxes** — silent OOM under load. Always bound.
- **Treating actors as fine-grained RPC endpoints** — chatty traffic destroys throughput; batch where possible.
- **Forgetting supervision** — an unhandled exception silently kills the actor and its mailbox. Always wrap in `Behaviors.supervise`.

The Erlang slogan: **"let it crash"** — restart is cheaper than defensive code, because the supervision tree guarantees a clean fresh state.

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
