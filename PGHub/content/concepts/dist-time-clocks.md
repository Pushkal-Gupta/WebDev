---
slug: dist-time-clocks
module: distributed-systems
title: Time, Clocks, and Ordering Events
subtitle: There is no global "now" across machines — how logical and vector clocks recover the order that wall-clocks cannot.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 16
prereqs: [dist-cap-consistency]
relatedProblems: []
references:
  - title: "Leslie Lamport — Time, Clocks, and the Ordering of Events in a Distributed System (CACM 1978)"
    url: "https://lamport.azurewebsites.net/pubs/time-clocks.pdf"
    type: article
  - title: "Colin Fidge — Timestamps in Message-Passing Systems That Preserve Partial Ordering (vector clocks)"
    url: "https://fidgetimestamps.com/"
    type: article
  - title: "Designing Data-Intensive Applications — Chapter 8: The Trouble with Distributed Systems (unreliable clocks)"
    url: "https://dataintensive.net/"
    type: book
  - title: "Justin Sheehy — There Is No Now (ACM Queue)"
    url: "https://queue.acm.org/detail.cfm?id=2745385"
    type: article
  - title: "Google Spanner — TrueTime and external consistency"
    url: "https://research.google/pubs/spanner-googles-globally-distributed-database-2/"
    type: article
status: published
---

## intro

On one machine, "what happened first" is easy: there is a single clock and a single sequence of instructions. Across machines, that certainty evaporates. Each computer has its own quartz oscillator drifting at its own rate, network delays are variable and unbounded, and two events on two servers can be so close in time that no amount of timestamp comparison can honestly say which came first. Worse, physical clocks lie: NTP corrections jump them forward, leap seconds and misconfiguration push them backward, and a "later" event can carry an *earlier* timestamp. The foundational insight, from Lamport's 1978 paper, is that for most distributed problems you do not actually need physical time — you need **order**, specifically the order of events that could have influenced each other. **Logical clocks** provide exactly that: a way to timestamp events using counters and messages, so that cause always appears before effect, without any machine ever reading a wall clock.

## whyItMatters

Every distributed system eventually has to decide "which of these two updates is newer" — to resolve a write conflict, to build a consistent snapshot, to order a log, to break a tie in leader election. Reach for the wall clock and you build a bug: clock skew across even well-synchronized nodes is routinely tens of milliseconds, enough to make the *older* write win a last-write-wins comparison and silently eat the newer one. Databases have lost committed data exactly this way. Logical clocks replace "trust the wall clock" with "trust the messages," and messages are the only thing that actually carries causality between machines. Getting this right is what separates a store that correctly detects concurrent writes (and can merge them) from one that quietly drops updates and calls it consistency. It is also the conceptual root of version vectors in Dynamo-style stores, of causal consistency, of consistent snapshots, and of why Google built atomic clocks and GPS receivers into Spanner to shrink — not eliminate — clock uncertainty. Understanding happens-before is understanding what "order" can even mean when there is no shared now.

## intuition

The key idea is **happens-before**, written `a → b`, a partial order over events. It holds in exactly three cases: (1) `a` and `b` are on the same process and `a` comes first; (2) `a` is the sending of a message and `b` is its receipt; (3) transitively, if `a → c` and `c → b`. If neither `a → b` nor `b → a`, the events are **concurrent** — genuinely unordered, because no chain of local steps and messages connects them. Notice this is a *partial* order: concurrent events have no defined "first," and that is not a limitation to fix but the honest truth of a system with no global clock.

A **Lamport clock** turns this partial order into comparable integer timestamps with a strikingly simple rule set. Each process keeps a counter `L`. Before any local event, increment `L`. When sending a message, attach the current `L`. When receiving a message with timestamp `t`, set `L = max(L, t) + 1` before processing. That single `max`-then-increment on receive is the whole trick: it drags the receiver's clock past the sender's, guaranteeing the receive event gets a strictly larger timestamp than the send. The result satisfies the **clock condition**: if `a → b` then `L(a) < L(b)`. Cause always has a smaller number than effect. To get a *total* order (needed to, say, agree on a single log order), break ties on equal timestamps by process id — arbitrary but deterministic, so every node computes the same order.

Lamport clocks have one honest limitation: the implication only runs one way. `a → b` implies `L(a) < L(b)`, but `L(a) < L(b)` does **not** imply `a → b` — the smaller timestamp might just be concurrent. You cannot look at two Lamport numbers and tell "caused" from "coincidentally earlier." **Vector clocks** fix this. Each of `N` processes carries a vector of `N` counters. On a local event, a process increments its *own* slot. On send, it attaches the whole vector. On receive, it takes the element-wise `max` of its vector and the message's, then increments its own slot. Now comparison is exact: `V(a) < V(b)` in every slot means `a → b`; if each vector leads in at least one slot, the events are **concurrent** — a real conflict you can now *detect* rather than mistakenly order. Vector clocks cost O(N) space per event but buy you the ability to distinguish causality from concurrency, which is exactly what conflict detection in a replicated store requires.

## visualization

```
 three processes; time flows downward; -----> is a message.
 each event is stamped with its Lamport counter L.

  P1        P2        P3
  |         |         |
 [1]a       |         |
  |----m1-->|         |         m1 carries L=1; P2 does max(0,1)+1
  |        [2]b       |
  |         |----m2-->|         m2 carries L=2; P3 does max(0,2)+1
  |         |        [3]c
 [2]d       |         |         P1's own next local event -> L=2
  |         |         |

 happens-before recovered:  a -> b (m1),  b -> c (m2),  so a -> c
 concurrent:  d (L=2 on P1) vs b (L=2 on P2) -- equal L, NO message
              chain between them -> genuinely unordered.

 Lamport: a->b  =>  L(a)<L(b)   (one-way only; ties need a process-id rule)
 Vector : V(a)<V(b) in ALL slots => a->b; each leads somewhere => concurrent
```

## bruteForce

The obvious approach is to timestamp every event with the local wall clock and order events by comparing those timestamps. It is seductive because it needs no coordination — each node just calls `now()`. It is also wrong in ways that bite in production. Physical clocks on different machines disagree: even with NTP disciplining them, skew of tens of milliseconds is normal, and a badly synced or virtualized host can be off by seconds. So two events that truly happened in one order can carry timestamps in the opposite order, and any decision built on the comparison — which write wins, which event is newer in the log — is silently corrupted. Clocks also move *non-monotonically*: NTP can step a clock backward to correct drift, leap seconds repeat a second, and a VM migration can jump the clock; a "monotonic" assumption embedded in your ordering logic then produces duplicate or negative durations. The deepest problem is conceptual: even a *perfect* wall clock cannot tell you whether event `a` could have *influenced* event `b`, because closeness in time is not causality. Two events one microsecond apart on two continents cannot have affected each other; two events a full second apart on the same causal chain absolutely did. Physical timestamps measure the wrong thing.

## optimal

Use **logical clocks** so that ordering follows causality, not wall time, and pick the clock to match the question you are answering.

If you only need a total order that never contradicts causality — for a replicated state machine's operation log, a mutual-exclusion queue, a deterministic tie-break — a **Lamport clock** is enough and cheap: one integer per process, `increment` on local events and send, `L = max(L, t) + 1` on receive, and `(L, process_id)` as the total-order key. This guarantees cause precedes effect (`a → b ⇒ L(a) < L(b)`) and gives every node the identical order, at O(1) space and a single integer piggybacked on each message.

If you need to **detect concurrency** — the defining requirement of conflict resolution in a replicated store — use a **vector clock**. Its element-wise comparison distinguishes "`a` caused `b`" from "`a` and `b` are concurrent," so a Dynamo-style store can present concurrent writes to the application (or a CRDT) to merge, instead of blindly letting one overwrite the other. This is precisely the version-vector machinery behind causal consistency and conflict detection; the cost is O(N) counters per event, which you can bound by pruning entries for retired replicas.

When you genuinely need agreement with **physical** time — "commit T1 before T2 in real wall-clock order" for external consistency — do not trust a bare clock; bound its uncertainty and wait it out. Google's Spanner **TrueTime** exposes an *interval* `[earliest, latest]` around now, backed by GPS and atomic clocks, and commits a transaction by waiting until the interval has fully passed before releasing locks, so the uncertainty never lets two transactions' timestamps overlap incorrectly. **Hybrid Logical Clocks (HLC)** are the pragmatic middle: they track close to physical time for human-readable, roughly-real timestamps while carrying a logical component that preserves happens-before even when the physical clock misbehaves. The rule of thumb: reach for logical clocks first (they answer "what order" correctly and cheaply), reach for vector clocks when you must *see* concurrency, and only pay for tightly-bounded physical time when the requirement is genuinely about the wall clock.

## complexity

- **time:** Every clock operation — increment on a local event, `max`-then-increment on receive — is O(1) for a Lamport clock and O(N) for a vector clock (one `max` per process slot). None of these require a network round trip; the timestamp rides along on messages the system already sends.
- **space:** A Lamport clock is a single integer per process and one integer piggybacked per message. A vector clock is N integers per process and per message, where N is the number of participating processes — the price of being able to detect concurrency. Long-lived systems prune vector entries for departed nodes to keep N bounded.
- **notes:** Lamport gives a one-way guarantee (`a → b ⇒ L(a) < L(b)`, but not the converse), so it can *order* but cannot *detect concurrency*. Vector clocks give the two-way guarantee and can. Neither uses or trusts wall-clock time, which is exactly why they are correct where physical timestamps fail.

## pitfalls

- **Ordering events by wall-clock timestamp.** Clock skew across nodes routinely flips the true order, so last-write-wins by physical time can discard the newer write and clock steps can even make an older write win. Fix: order by a logical clock; if physical time is truly required, bound its uncertainty (TrueTime-style) or use HLC.
- **Reading a smaller Lamport number as "happened before."** `L(a) < L(b)` does not imply `a → b` — the events may be concurrent. Fix: never infer causality from Lamport order alone; use a vector clock when you must know whether one event actually caused another.
- **Forgetting the `max` on message receipt.** Only incrementing the local counter (skipping `L = max(L, t) + 1`) breaks the clock condition, letting a receive get a timestamp not larger than its send. Fix: always take the max of local and incoming before incrementing on receive.
- **Assuming monotonic physical clocks.** NTP corrections, leap seconds, and VM migrations move wall clocks backward, producing negative durations and duplicate timestamps. Fix: use a monotonic clock source for elapsed-time measurements and logical clocks for cross-node ordering.
- **Unbounded vector-clock growth.** In a system with churn, a vector that keeps a slot for every replica that ever existed grows without limit and bloats every message. Fix: prune entries for retired replicas and/or cap the vector to active participants.

## interviewTips

- Lead with happens-before as a *partial* order and be explicit that concurrent events have no defined "first" — that framing shows you understand why there is no global now, which is the real point of the topic.
- Recite the Lamport rules crisply (increment on local/send, `max+1` on receive, tie-break by process id for a total order) and then state the limitation out loud: it orders but cannot detect concurrency, which is exactly why vector clocks exist. Naming the limitation is what senior answers do.
- When asked "how would you resolve conflicting writes to the same key," reach for vector clocks / version vectors to *detect* concurrency, then a deterministic merge (CRDT or app logic) — and explicitly reject wall-clock last-write-wins as skew-unsafe. If pushed on real-time ordering, mention TrueTime's commit-wait and HLC as the physical-time options.

## keyTakeaways

- There is no global "now": physical clocks drift, get stepped backward, and cannot express causality, so distributed ordering must be built from the happens-before partial order, not from wall-clock timestamps.
- Lamport clocks (increment locally and on send, `max`-then-increment on receive) guarantee cause has a smaller timestamp than effect and yield a total order with a process-id tie-break — cheap, but they can only order, not detect concurrency.
- Vector clocks carry one counter per process and compare element-wise, so they distinguish causal dependence from true concurrency — the exact capability replicated stores need to detect and merge conflicting writes; the cost is O(N) space, pruned for retired nodes.

## code.python

```python
"""Lamport and vector clocks, with concurrency detection, fully deterministic.

Models three processes exchanging messages. Lamport clocks give a causality-
respecting total order; vector clocks additionally reveal whether two events are
concurrent. No wall clock, no randomness, no I/O anywhere.
"""


class LamportProcess:
    def __init__(self, pid):
        self.pid = pid
        self.L = 0

    def local(self):
        self.L += 1                      # tick before a local event
        return self.L

    def send(self):
        self.L += 1                      # a send is also an event
        return self.L                    # timestamp travels with the message

    def receive(self, t):
        self.L = max(self.L, t) + 1      # the whole trick: drag past the sender
        return self.L


class VectorProcess:
    def __init__(self, pid, n):
        self.pid = pid                   # index into the vector
        self.V = [0] * n

    def local(self):
        self.V[self.pid] += 1            # bump only our own slot
        return list(self.V)

    def send(self):
        self.V[self.pid] += 1
        return list(self.V)              # send the whole vector

    def receive(self, vec):
        self.V = [max(a, b) for a, b in zip(self.V, vec)]  # element-wise max
        self.V[self.pid] += 1
        return list(self.V)


def relation(v1, v2):
    # Compare two vector timestamps: 'before', 'after', or 'concurrent'.
    before = all(a <= b for a, b in zip(v1, v2)) and v1 != v2
    after = all(a >= b for a, b in zip(v1, v2)) and v1 != v2
    if before:
        return "v1 -> v2 (v1 happened-before v2)"
    if after:
        return "v2 -> v1 (v2 happened-before v1)"
    return "concurrent (a real conflict)"


if __name__ == "__main__":
    p1, p2, p3 = LamportProcess(1), LamportProcess(2), LamportProcess(3)
    a = p1.local()          # L=1 on P1
    m1 = p1.send()          # send from P1 (L=2)
    b = p2.receive(m1)      # P2: max(0,2)+1 = 3
    d = p1.local()          # P1's next local event, L=3
    print("lamport a,b,d:", a, b, d)     # cause a has smaller stamp than b

    n = 3
    v1, v2 = VectorProcess(0, n), VectorProcess(1, n)
    ea = v1.local()                       # [1,0,0]
    msg = v1.send()                        # [2,0,0]
    eb = v2.receive(msg)                   # [2,1,0]  -> caused by ea
    ed = v1.local()                        # [3,0,0]  -> concurrent with eb
    print("ea->eb ?", relation(ea, eb))    # before
    print("ed,eb  ?", relation(ed, eb))    # concurrent
```
