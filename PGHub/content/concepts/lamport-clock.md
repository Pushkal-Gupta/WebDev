---
slug: lamport-clock
module: sd-consensus
title: Lamport Clock
subtitle: A scalar logical counter that orders events across an asynchronous distributed system without a synchronised wall clock.
difficulty: Advanced
position: 24
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Lamport — Time, Clocks, and the Ordering of Events in a Distributed System (1978)"
    url: "https://lamport.azurewebsites.net/pubs/time-clocks.pdf"
    type: paper
  - title: "Martin Kleppmann — Designing Data-Intensive Applications, Ch. 8"
    url: "https://dataintensive.net/"
    type: book
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A **Lamport clock** is a single integer counter that every process keeps locally and uses to stamp events. The rule is tiny: bump it on every local event; piggy-back it on every outgoing message; and on receive, take the max of "your local clock" and "the incoming stamp" before bumping. The resulting timestamps satisfy the **happens-before** relation — if event A causally precedes B, then `ts(A) < ts(B)`. The reverse does NOT hold: two events with `ts(A) < ts(B)` may still be concurrent.

## whyItMatters
Wall-clock time is unreliable across machines — NTP can drift, leap seconds happen, virtual machines pause. Distributed systems need a way to say "this update happened after that one" *causally*, not chronologically. Lamport clocks give you that for **one-direction comparisons**: if a leader's commit precedes a follower's read, the timestamps will reflect it. Real systems use Lamport timestamps in DynamoDB's session-token reads, in Cassandra's column timestamps (with last-write-wins), and as the seed idea behind hybrid logical clocks (HLC) in CockroachDB.

## intuition
Imagine three engineers passing notes back and forth, each tracking how many notes they have written *or received-then-written*. Engineer A writes note 1, then note 2 — her counter reads 2. She sends note 2 to B. B has only written note α, so his counter is 1. When B receives A's note 2, B sets his counter to max(1, 2) + 1 = 3, and tags his next write as 3. Now anything B writes from this point on bears a timestamp ≥ 3, which is strictly larger than A's 2 — preserving the causal "A's note 2 happened-before B's note 3" relation.

The rule comes from a simple invariant: **after any message is processed, the receiver's clock must be strictly greater than the sender's send-timestamp**. The `max(local, incoming) + 1` formula guarantees this in a single arithmetic step, no synchronisation needed.

The key subtlety: two processes can have the same timestamp without any causal relationship. If A writes note 7 in isolation while B also writes note 7 in isolation (no messages crossed), they are concurrent — Lamport gives them the same number even though one might have happened on Monday and the other on Friday. To break ties for a *total* order, pair the timestamp with a process ID: `(ts, pid)`. That's a Lamport total order, used to produce deterministic merges.

## visualization
```
Process A:  [1]----[2]----[3]----[4]
                    \
                     \ msg
                      v
Process B:  [1]----[2]<receive max(2,2)+1=3 >----[4]----[5]
                                |
                                | msg
                                v
Process C:  [1]----[2]----[3]<receive max(3,3)+1=4 >----[5]
                                  \
                                   \ msg
                                    v
Process A:                          receive max(4,4)+1=5 -> [5]
```

## bruteForce
"Use the system clock + NTP." Works until two events happen within NTP's drift window (commonly 10–100 ms), at which point cause and effect become indistinguishable. Some databases simply pick last-writer-wins by wall-clock time — silently dropping concurrent updates when clocks disagree. That's not consensus, that's data loss.

## optimal
Each process maintains a single integer `C`, initialized to 0.

- **Local event** (anything that changes process state): `C ← C + 1`. Stamp the event with the new `C`.
- **Send**: before sending message `m`, do the local-event bump, then attach `C` to `m`.
- **Receive** of message with timestamp `Cm`: `C ← max(C, Cm) + 1`. Then process the message; that's another local event but the +1 already accounts for it.

Correctness sketch: if `A → B` (A happens-before B), then either they are on the same process — in which case `C_B > C_A` by the local-event rule — or there is a chain of sends and receives between them, and at each step the timestamp strictly increases by at least one. The receiver's update rule ensures the chain's strictly-increasing property is preserved across processes.

The converse is the famous **non-property**: `C_A < C_B` does NOT imply `A → B`. They might be concurrent. To detect concurrency you need vector clocks (see [[vector-clock]]).

To produce a deterministic total order (useful for replicated state machines, message logs), break ties with process ID: `(C, pid)` with lexicographic comparison. Equal `C` plus different `pid` produces a stable order all replicas agree on.

## complexity
- Per event: O(1) integer increment. Per message: O(1) attach + max. Storage: O(log T) bits where T is the highest timestamp ever seen — practically a single 64-bit int forever.
- Compared with vector clocks (O(n) per stamp where n is the cluster size), Lamport is dramatically cheaper but gives strictly weaker guarantees.

## pitfalls
- **Assuming `ts(A) < ts(B)` means causal precedence.** It doesn't — they may be concurrent. Use vector clocks if you need to detect concurrency.
- **Forgetting the local-event bump before a send.** If you only update on receive, a process that does a long sequence of sends without local events ends up with timestamps that never advance — violates the happens-before guarantee.
- **Integer overflow.** A 32-bit counter overflows fast under high write rates. Use 64-bit; even at a billion events/sec it lasts centuries.
- **Naïve tie-breaking by hostname strings.** Comparing string PIDs lexicographically is fine, but mixing string PIDs (`"node-a"`) and integer PIDs (`3`) across the cluster produces silent ordering bugs. Pick one type and stick with it.
- **Not bumping the receive clock high enough.** Setting `C ← max(C, Cm)` without the `+ 1` makes the receive event itself indistinguishable from the send — breaks the invariant the moment the receiver tries to send back.

## interviewTips
- **Be explicit about what Lamport guarantees vs doesn't.** Happens-before yes; concurrency detection no. Interviewers love it when you volunteer the failure mode.
- **Be ready to compare with vector clocks.** "Cheaper but weaker" is the headline. Mention DynamoDB uses vector clocks specifically because last-write-wins on Lamport-style timestamps would lose concurrent writes.
- **Reach for hybrid logical clocks for production systems.** HLC = wall-clock time + Lamport tiebreaker. CockroachDB and YugabyteDB use it. Lamport-pure is more of a teaching device than a deployment choice.

## code
### python
```python
class LamportClock:
    def __init__(self) -> None:
        self._c = 0

    def local_event(self) -> int:
        self._c += 1
        return self._c

    def on_send(self) -> int:
        # Bump before sending; piggy-back this stamp on the outgoing message.
        return self.local_event()

    def on_receive(self, incoming: int) -> int:
        self._c = max(self._c, incoming) + 1
        return self._c
```

### javascript
```javascript
class LamportClock {
  constructor() { this.c = 0; }
  localEvent() { this.c += 1; return this.c; }
  onSend() { return this.localEvent(); }
  onReceive(incoming) { this.c = Math.max(this.c, incoming) + 1; return this.c; }
}
```

### java
```java
public class LamportClock {
    private long c = 0;
    public synchronized long localEvent() { return ++c; }
    public synchronized long onSend() { return localEvent(); }
    public synchronized long onReceive(long incoming) {
        c = Math.max(c, incoming) + 1;
        return c;
    }
}
```

### cpp
```cpp
#include <algorithm>
#include <atomic>

class LamportClock {
    std::atomic<long long> c{0};
public:
    long long local_event() { return ++c; }
    long long on_send() { return local_event(); }
    long long on_receive(long long incoming) {
        long long expected = c.load();
        long long next;
        do { next = std::max(expected, incoming) + 1; }
        while (!c.compare_exchange_weak(expected, next));
        return next;
    }
};
```
