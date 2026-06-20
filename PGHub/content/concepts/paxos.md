---
slug: paxos
module: sd-consensus
title: Paxos
subtitle: The original asynchronous-network consensus algorithm — survives any minority failure with two phases of majority voting.
difficulty: Advanced
position: 26
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Lamport — The Part-Time Parliament (1998)"
    url: "https://lamport.azurewebsites.net/pubs/lamport-paxos.pdf"
    type: paper
  - title: "Lamport — Paxos Made Simple (2001)"
    url: "https://lamport.azurewebsites.net/pubs/paxos-simple.pdf"
    type: paper
  - title: "Chandra, Griesemer, Redstone — Paxos Made Live (Google, 2007)"
    url: "https://research.google/pubs/pub33002/"
    type: paper
status: published
---

## intro
**Paxos** is the original asynchronous-network consensus algorithm: it lets a group of `2f + 1` nodes agree on a single value even when up to `f` are crashed or arbitrarily slow, and even when messages are lost, duplicated, or reordered. The protocol runs in two phases — **Prepare** and **Accept** — each gated by a majority vote. Once a majority has accepted a value at some proposal number, that value is permanent: every future learned value must be the same. Paxos guarantees **safety** (never two different values chosen) absolutely, and **liveness** (eventually some value is chosen) under reasonable timing assumptions.

## whyItMatters
Almost every replicated storage system you've ever read about is a flavour of Paxos: Chubby and Spanner inside Google, ZooKeeper's Zab (a Paxos variant), CockroachDB's Raft (a redesign of Paxos for understandability), Apache BookKeeper, Microsoft's Service Fabric. Anywhere you see "consensus" or "distributed log", Paxos is the foundation. Knowing Paxos is the canonical interview filter for "I understand distributed systems beyond surface-level."

## intuition
Imagine three senators (`acceptors`) and several aides (`proposers`) who can each suggest a bill. The hall has no clocks, aides can disappear mid-message, and yet only one bill must ever become law. Paxos solves this with two rounds of voting:

**Phase 1 — Prepare.** An aide picks a sequence number `n` (higher than any number she's ever seen) and asks a majority of senators: "Will you accept proposals with number greater than or equal to `n`?" Each senator who agrees promises never to accept any older proposal, and reports back the highest-numbered proposal she has already accepted, if any.

**Phase 2 — Accept.** If the aide hears back from a majority, she picks the value: if any senator already accepted a proposal, the aide MUST use the value from the highest-numbered such proposal (to preserve any choice already in progress). Otherwise she's free to pick her own value. She then sends `(n, value)` to a majority and asks them to accept. If a majority accepts, the value is **chosen**.

The key invariant: any two majorities of `2f + 1` acceptors **must intersect** in at least one node (`f + 1 + f + 1 = 2f + 2 > 2f + 1`). So if value `v` was chosen at proposal `n`, any future Prepare with `n' > n` is guaranteed to hear about `v` from at least one acceptor in the intersection — and the protocol forces the new proposer to re-use `v`. Once chosen, always chosen.

The famous failure mode: **dueling proposers**. Aide A starts Phase 1 with n=5; Aide B starts Phase 1 with n=6 before A finishes Phase 2; A retries with n=7; B retries with n=8; nothing ever gets chosen. This is why production Paxos uses a leader election (Multi-Paxos) so that only one proposer is active at a time. Raft makes this leader-centric structure explicit; Paxos hides it.

## visualization
```
Acceptor A1     A2     A3              proposer P1                proposer P2
  |             |       |                 |                          |
  |             |       |   Prepare(n=5)  |                          |
  |<------------+-------+-----------------|                          |
  |  promise    |       |                 |                          |
  |  (none)     |       |                 |                          |
  |-->[promise n=5, no prior]------------>|                          |
  |             |       |                 |                          |
  |             |<------+--Prepare(n=5)---|                          |
  |             |       |                 |                          |
  |             |-->[promise n=5, no prior]                          |
  |             |       |                 |                          |
  |             |       |                 |   Accept(5, "X")         |
  |<------------+-------+-----------------|                          |
  |  accept     |       |                 |                          |
  |-->[accepted 5, "X"]----------------->| chosen if majority accept |
  |             |       |                 |                          |
  |             |<------+--Prepare(n=7)-----------------------------|
  |             |  --> [promise 7, prior=(5,"X")]                    |
  |             |       |                                            |
  |             |       |   P2 MUST propose "X" at n=7 -- safety.    |
```

## bruteForce
"Have one designated coordinator pick values, broadcast them, done." Works until the coordinator dies — then the cluster either silently halts (the system is unavailable) or two would-be-coordinators emerge simultaneously and accept conflicting values (split-brain). Paxos's two-phase voting is exactly what prevents both failure modes without a clock or a perfect leader oracle.

## optimal
**Roles** (a single node can play all three): `proposer` (suggests values), `acceptor` (votes), `learner` (records the final choice). For consensus on a single value:

**Phase 1 (Prepare):**
1. Proposer picks proposal number `n` strictly greater than any it has used.
2. Proposer sends `Prepare(n)` to a majority of acceptors.
3. Each acceptor compares `n` to its highest-promised number `np`:
   - If `n > np`: promise to ignore all proposals numbered less than `n`. Reply with the highest-accepted `(na, va)` pair, if any.
   - Otherwise: reject (or send nothing).

**Phase 2 (Accept):**
1. Proposer waits for promises from a majority. If any promise contained an `(na, va)`, proposer takes the value `va` from the highest `na`. Otherwise it picks its own value `v`.
2. Proposer sends `Accept(n, v)` to a majority.
3. Each acceptor compares `n` to its highest-promised `np`:
   - If `n ≥ np`: accept. Record `(n, v)` as its highest-accepted pair. Notify learners.
   - Otherwise: reject.

A value is **chosen** when a majority of acceptors have accepted it at the same proposal number. Learners detect this from the accept notifications.

**Why it's safe**: Suppose value `v` was chosen at `n`. Any future proposal `n' > n` requires Prepare promises from some majority M'. M' and the majority M that chose `v` intersect in ≥1 acceptor, who will report `(n, v)` (or a later `(n'', v)` with `n'' ≥ n` and `v'' = v`, by induction). The proposer at `n'` is forced to re-propose `v`. So once chosen, every later "successful" round uses the same value.

**Multi-Paxos**: replicate the above for a *sequence* of slots (a log). To avoid running Phase 1 every slot, elect a stable leader that holds the highest proposal number long-term; followers automatically funnel writes to the leader; Phase 1 happens only when leadership changes. This is the layer Raft makes explicit.

## complexity
- **Messages per consensus**: 4 message-delays in the happy path (Prepare round-trip + Accept round-trip), 2 message delays in Multi-Paxos steady state (just the Accept round-trip).
- **Failure model**: tolerates `f` failures with `2f + 1` acceptors. Three nodes survive one failure; five survive two; etc.
- **Throughput**: bounded by the leader's outbound bandwidth in Multi-Paxos. Scales like Raft.
- **Latency**: at minimum `1 RTT` per decision in steady state; up to `~3 RTTs` during leader change.

## pitfalls
- **Dueling proposers.** Without a stable leader, two proposers can ratchet proposal numbers forever and never choose. Production: elect a single proposer (Multi-Paxos), back off proposal numbers on Prepare failure.
- **Forgetting that promises must persist across crashes.** An acceptor's `np` and `(na, va)` MUST be on durable storage before replying. A crashed-and-restarted acceptor that forgets its promise can violate safety by accepting an older proposal it previously promised to ignore.
- **Using small proposal numbers.** Two proposers must never pick the same `n`. Encode `(round, proposer_id)` lex-ordered so distinct proposers cannot collide. A bare integer + reuse-across-restarts is a famous bug.
- **Learners assuming a single accept message means chosen.** A value is chosen when a majority accepts, not when any one does. Wait for `f + 1` accept notifications before treating the value as final.
- **Reading without a quorum.** A read from a single acceptor can see an accepted-but-not-yet-chosen value, or miss a recent decision. Reads must round-trip a majority too (or go through the leader after a no-op heartbeat that confirms leadership).

## interviewTips
- **Be explicit about safety vs liveness.** Safety always; liveness only under partial-synchrony assumptions. The FLP impossibility result says no purely-asynchronous algorithm can be both. Mention it.
- **Explain the majority-intersection trick.** That's the single insight that makes Paxos work. "Any two majorities of `2f+1` overlap by ≥1." If you internalise that, you derive the rest of the protocol.
- **Compare with Raft.** Raft = Multi-Paxos with the leader role made central + a re-designed log-replication protocol for clarity. CockroachDB, etcd, Consul all use Raft because it's easier to implement correctly. Paxos is the more general/older formulation.

## code
### python
```python
# Single-decree Paxos acceptor (simplified). One state machine per acceptor.
# np = highest promised proposal number; (na, va) = highest accepted pair.

class Acceptor:
    def __init__(self) -> None:
        self.np = -1     # highest promised
        self.na = -1     # highest accepted number
        self.va = None   # highest accepted value

    def on_prepare(self, n: int):
        if n > self.np:
            self.np = n
            return ("promise", n, self.na, self.va)
        return ("nack", self.np)

    def on_accept(self, n: int, v):
        if n >= self.np:
            self.np = n
            self.na = n
            self.va = v
            return ("accepted", n, v)
        return ("nack", self.np)
```

### javascript
```javascript
class Acceptor {
  constructor() { this.np = -1; this.na = -1; this.va = null; }
  onPrepare(n) {
    if (n > this.np) { this.np = n; return ['promise', n, this.na, this.va]; }
    return ['nack', this.np];
  }
  onAccept(n, v) {
    if (n >= this.np) { this.np = n; this.na = n; this.va = v; return ['accepted', n, v]; }
    return ['nack', this.np];
  }
}
```

### java
```java
public class Acceptor {
    private long np = -1;
    private long na = -1;
    private Object va = null;

    public synchronized Object[] onPrepare(long n) {
        if (n > np) { np = n; return new Object[]{"promise", n, na, va}; }
        return new Object[]{"nack", np};
    }

    public synchronized Object[] onAccept(long n, Object v) {
        if (n >= np) { np = n; na = n; va = v; return new Object[]{"accepted", n, v}; }
        return new Object[]{"nack", np};
    }
}
```

### cpp
```cpp
#include <variant>
#include <string>
#include <mutex>

struct Acceptor {
    long long np = -1, na = -1;
    std::string va;
    std::mutex mu;

    struct Promise { long long n, na; std::string va; };
    struct Nack    { long long np; };
    struct Accepted{ long long n; std::string v; };

    std::variant<Promise, Nack> on_prepare(long long n) {
        std::lock_guard g(mu);
        if (n > np) { np = n; return Promise{n, na, va}; }
        return Nack{np};
    }

    std::variant<Accepted, Nack> on_accept(long long n, std::string v) {
        std::lock_guard g(mu);
        if (n >= np) { np = n; na = n; va = v; return Accepted{n, v}; }
        return Nack{np};
    }
};
```
