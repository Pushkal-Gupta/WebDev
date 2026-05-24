---
slug: saga-pattern
module: system-design
title: Saga Pattern
subtitle: Coordinate distributed transactions via a sequence of local transactions + compensating actions — no 2PC required.
difficulty: Advanced
position: 15
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
You can't have a single ACID transaction across multiple services. Two-phase commit (2PC) is brittle, blocking, and rarely used in modern microservices. The **Saga pattern** replaces it with a sequence of **local transactions** in each service, paired with **compensating actions** to undo earlier steps if a later one fails. Eventual consistency, no distributed locks.

## whyItMatters
The canonical example: book a trip = reserve flight + reserve hotel + reserve car + charge credit card. Each service owns its own database. If the car-rental service is down after you've already reserved the flight+hotel, you can't roll back via 2PC. Instead, a saga **compensates** — cancel the flight, cancel the hotel — restoring the system to a consistent state.

Used by Uber (trips), Amazon (orders), Airbnb (bookings), every fintech (transfers spanning two banks).

## intuition
A saga is a graph of steps:
1. **Forward step** = local transaction in service X.
2. **Compensating step** = local transaction in service X that undoes the forward step.

Execute forward steps in order. If step N fails, run compensating steps for N-1, N-2, ... 1 in reverse. Done — system is consistent again.

Two flavors:
- **Choreography**: each service emits an event when its step finishes; the next service listens and acts. Decentralized, decoupled, harder to debug.
- **Orchestration**: a central coordinator calls each step, decides the next, handles compensation. Centralized, easier to monitor.

## visualization
```
Choreography (events flow service → service):

  OrderCreated → InventoryService reserves → ReservationConfirmed
              → PaymentService charges → PaymentSucceeded → OrderConfirmed
                                       → PaymentFailed → release inventory (compensate)

Orchestration (central state machine):

  Orchestrator → InventoryService.reserve()        ✓
              → PaymentService.charge()           ✗ FAIL
              → InventoryService.release()         ← compensation
              → Orchestrator.cancel(orderId)
```

## bruteForce
**Two-phase commit (2PC)** across services: each service "prepares" (locks resources, votes yes/no), then the coordinator says "commit" or "abort." Atomic but: (1) blocks resources during the protocol, (2) coordinator failure leaves locked resources stranded, (3) requires every service to participate in the protocol, (4) does not scale across networks.

Distributed transactions sound nice; in practice they collapse under partial failure.

## optimal
**Design rules**:
1. **Each step has a compensating action** that semantically undoes it. Charge → refund. Reserve → release. (Compensation is NOT always literal-undo — sometimes it's a follow-on action like "send apology email + refund.")
2. **Forward steps must be idempotent** — they may retry on transient errors.
3. **Compensations must also be idempotent** — same retry guarantee.
4. **State persistence** — store the saga's current step in a durable store so restarts resume correctly.
5. **Don't compensate already-compensated steps** — make compensation safe to call twice.

**Orchestration sketch** (state machine):
```
saga = { id, state: 'PENDING', current_step: 0, ... }
while saga.state == 'PENDING':
    step = STEPS[saga.current_step]
    try:
        step.execute(saga.context)
        saga.current_step += 1
        if saga.current_step >= len(STEPS):
            saga.state = 'COMPLETED'
    except StepFailedError:
        saga.state = 'COMPENSATING'
        for i in range(saga.current_step - 1, -1, -1):
            STEPS[i].compensate(saga.context)
        saga.state = 'FAILED'
    persist(saga)
```

**Choreography**: each service subscribes to events, executes, emits its own event. No central state — every service "knows" what the saga needs from it. Harder to reason about; works best for small sagas (≤ 4 steps).

## complexity
- **Latency**: sum of step latencies (sequential). Parallelize where possible.
- **Storage**: saga state record per active saga.
- **Failure recovery**: log every state transition.
- **Visibility**: orchestration makes it easy ("show all sagas in COMPENSATING state"); choreography requires correlation IDs across event streams.

## pitfalls
- **Forgetting idempotency on compensations**: re-running a refund without idempotency = double refund.
- **Non-undoable forward steps**: sending an email can't be unsent. Either make the action reversible (cancel an unsent email by emitting a contrary event) or model it as "the email was sent — handle it gracefully."
- **Choreography for big sagas**: 10+ services emitting events → hard to debug, hard to monitor. Orchestrate.
- **Saga in the wrong layer**: if your "saga" can be a single ACID transaction inside one DB, use the transaction instead. Sagas are for cross-service work.
- **Compensation needs the same business logic as forward**: e.g. refunding a payment requires knowing the original payment id. Persist it.

## interviewTips
- For "design an order/booking/payment flow" — saga.
- Lead with the choreography-vs-orchestration choice; for ≥3 services, orchestration usually wins.
- Always mention **idempotency** when describing forward AND compensating steps.
- For senior interviews, contrast with **2PC** (rejected in modern designs) and reference **outbox pattern** as the standard way to atomically write-DB + emit-event.

## code.python
```python
class SagaStep:
    def __init__(self, name, execute, compensate):
        self.name, self.execute, self.compensate = name, execute, compensate

def run_saga(steps, ctx):
    completed = []
    for step in steps:
        try:
            step.execute(ctx)
            completed.append(step)
        except Exception:
            for s in reversed(completed):
                try: s.compensate(ctx)
                except Exception: pass  # log + alert; idempotent retry later
            raise
    return ctx

steps = [
    SagaStep('reserve_inventory', reserve_inventory, release_inventory),
    SagaStep('charge_payment',    charge_payment,    refund_payment),
    SagaStep('confirm_order',     confirm_order,     cancel_order),
]
```

## code.javascript
```javascript
async function runSaga(steps, ctx) {
  const completed = [];
  for (const step of steps) {
    try {
      await step.execute(ctx);
      completed.push(step);
    } catch (e) {
      for (const s of completed.reverse()) {
        try { await s.compensate(ctx); } catch { /* log + alert */ }
      }
      throw e;
    }
  }
  return ctx;
}
```

## code.java
```java
import java.util.*;
class Saga {
    interface Step {
        void execute(Map<String, Object> ctx) throws Exception;
        void compensate(Map<String, Object> ctx);
    }
    public Map<String, Object> run(List<Step> steps, Map<String, Object> ctx) throws Exception {
        List<Step> done = new ArrayList<>();
        for (Step s : steps) {
            try { s.execute(ctx); done.add(s); }
            catch (Exception e) {
                for (int i = done.size() - 1; i >= 0; i--) {
                    try { done.get(i).compensate(ctx); } catch (Exception ignored) {}
                }
                throw e;
            }
        }
        return ctx;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <functional>
#include <stdexcept>
struct SagaStep {
    std::function<void()> execute;
    std::function<void()> compensate;
};
void runSaga(const std::vector<SagaStep>& steps) {
    std::vector<const SagaStep*> done;
    try {
        for (const auto& s : steps) { s.execute(); done.push_back(&s); }
    } catch (...) {
        for (auto it = done.rbegin(); it != done.rend(); ++it) {
            try { (*it)->compensate(); } catch (...) { /* log */ }
        }
        throw;
    }
}
```
