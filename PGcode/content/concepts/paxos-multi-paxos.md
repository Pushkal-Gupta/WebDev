---
slug: paxos-multi-paxos
module: sd-consensus
title: Multi-Paxos
subtitle: Single-decree Paxos extended to a replicated log — one stable leader, one Prepare round, and a Phase-2-only steady state.
difficulty: Advanced
position: 65
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "Lamport — Paxos Made Simple (2001)"
    url: "https://lamport.azurewebsites.net/pubs/paxos-simple.pdf"
    type: paper
  - title: "Chandra, Griesemer, Redstone — Paxos Made Live: An Engineering Perspective (Google, 2007)"
    url: "https://research.google/pubs/paxos-made-live-an-engineering-perspective/"
    type: paper
  - title: "Wikipedia — Paxos (Multi-Paxos section)"
    url: "https://en.wikipedia.org/wiki/Paxos_(computer_science)"
    type: docs
status: published
---

## intro
**Multi-Paxos** is what every real system actually runs when it says it is using Paxos. Single-decree Paxos agrees on one value; production needs an ordered log of values — commands fed to a replicated state machine. Multi-Paxos runs one Paxos instance per log slot, then collapses the protocol's two phases into one by electing a stable **distinguished proposer** (leader) who already holds the highest proposal number for every future slot. Steady-state writes cost one Accept round-trip — a single network hop to a majority — matching Raft on latency while inheriting Paxos's safety proof.

## whyItMatters
Single-decree Paxos in interview slides looks elegant but it is impractical: every command pays two round-trips, dueling proposers can livelock forever, and there is no notion of an ordered log. Real replicated-storage systems — Google Chubby, Spanner, Megastore, Apache ZooKeeper's Zab, CockroachDB and etcd's Raft — all use the Multi-Paxos shape: leader-driven log replication with Phase 1 amortised across a leadership term. If you say "we use Paxos" in a system-design interview, this is the variant you mean. Knowing the leader's optimisation explains why log-based replication has the latency profile it does.

## intuition
The trick to understanding Multi-Paxos is to stop thinking of it as a new protocol and start thinking of it as **Paxos with caching**. Run single-decree Paxos for each log slot `i`. Each slot's `(proposal_number, accepted_value)` state is independent. Now notice that Phase 1 (Prepare) of slot `i` is asking acceptors: "Will you promise not to accept anything older than `n` at slot `i`?" If a single proposer holds promises at `n` for *every future slot from i onward*, it never has to send Prepare again — for any future write it just sends Accept directly.

That is the **distinguished proposer**, also called the leader. On election it sends one Prepare(n) for every slot from the next-uncommitted slot onward. Acceptors batch-promise. After that, every client write is Phase 2 only: leader picks the next slot index, sends Accept(n, value) to a majority, returns to the client. One round-trip, just like Raft.

The leader is not a coordinator in the lock-stepping sense — there is no "elect a leader" sub-protocol that has to be correct for safety. Safety holds even with dueling leaders, because each leader uses a higher proposal number than the last and Paxos's majority-intersection invariant ensures any value already chosen at any slot will be discovered and re-proposed. **Leader election only buys liveness**, not safety. A heartbeat-and-timeout failure detector is enough. The leader is a performance hack on top of a protocol that is already correct.

There are three details every implementation has to get right. **First**, on leader change the new leader must complete any slots that the old leader left half-finished — the recovery Prepare returns half-accepted values and the leader re-proposes them. **Second**, slots can be filled out of order: the leader may decide slot 7 before slot 5 if slot 5's Accept message was lost. The state machine applies slots in order, but agreement on them does not have to be ordered. **Third**, the log must be truncated. Once a prefix is durably committed and applied to a majority of state machines, those slots can be garbage-collected with a snapshot.

## visualization
```
                       Multi-Paxos timeline (5 acceptors, 1 leader L)
   slot:        1        2        3        4        5
   ─────────────────────────────────────────────────────────
   t=0    Leader election: L sends Prepare(n=42) for slots 1..∞
          A1 A2 A3 A4 A5 -->  promise(42, slot1=∅, slot2=∅, ...)
   ─────────────────────────────────────────────────────────
   t=1    client: write "X"
          L --Accept(n=42, slot=1, "X")--> A1 A2 A3 A4 A5
          majority accept --> slot 1 CHOSEN = "X"          [1 RTT]
   ─────────────────────────────────────────────────────────
   t=2    client: write "Y"
          L --Accept(n=42, slot=2, "Y")--> A1 A2 A3 A4 A5
          slot 2 CHOSEN = "Y"                              [1 RTT]
   ─────────────────────────────────────────────────────────
   t=3    L crashes. Heartbeat timeout fires on A3.
          A3 becomes new leader L'. Picks n=99 > 42.
          L' --Prepare(n=99) for slots 3..∞--> majority
          promises return slot 3=(42,"Z") half-accepted.
   ─────────────────────────────────────────────────────────
   t=4    L' MUST re-propose "Z" at slot 3 (safety).
          L' --Accept(n=99, slot=3, "Z")--> slot 3 CHOSEN.
          Normal Phase-2-only mode resumes at slot 4.
```

## bruteForce
Run vanilla single-decree Paxos independently per slot. Each write pays the full two round-trips (Prepare + Accept), and any proposer can race any other, producing dueling-proposer livelock. With even a moderate write rate the cluster spends more time exchanging Prepares than choosing values. A centralised coordinator that just owns every slot avoids the duels but reintroduces a single point of failure with no recovery story when it dies. Multi-Paxos is what you get when you keep the per-slot Paxos safety proof but amortise Phase 1 across many slots via a soft, replaceable leader.

## optimal
**Roles.** Each node plays proposer + acceptor + learner. One proposer at a time is the **distinguished proposer** (leader); others are followers that forward client requests.

**Leader election.** Any election mechanism works for safety — a simple lowest-id-alive heuristic plus heartbeats is enough. The candidate picks a proposal number `n` strictly greater than any it has seen and runs **one Prepare round for every slot from the next-uncommitted-slot `i*` onward** in a single bulk message: `Prepare(n, fromSlot = i*)`. Each acceptor compares `n` to its highest promised `np[slot]`. If `n > np[slot]`, it promises and returns the highest accepted `(na[slot], va[slot])` it has, for every slot ≥ `i*` where one exists.

**Recovery.** Once promises arrive from a majority, the new leader scans the returned `(slot, na, va)` triples. For every slot where any acceptor reports a half-accepted value, the leader must immediately re-issue `Accept(n, slot, v)` using the value at the highest `na`. This guarantees that any value the old leader had managed to get a majority on (chosen or not) survives. Slots with no half-accepted values can be filled with `no-op` to flush the prefix or left empty until a real client write arrives.

**Steady-state writes.** Client sends `write(v)` to the leader. The leader picks the next unused slot `i`, sends `Accept(n, i, v)` to a majority, on receiving `f+1` accept-acks declares slot `i` chosen, replies to the client, and notifies the state machine to apply slot `i`. Followers replicate the chosen-marker so they can apply too. This costs **one RTT and one Accept message round** — exactly what Raft does, because Raft IS Multi-Paxos with the leader role hoisted into the algorithm.

**Safety.** Each slot is still its own single-decree Paxos instance — the majority-intersection invariant holds slot-by-slot. The leader is a performance optimisation; correctness never depends on leader uniqueness. Two leaders briefly coexisting just means two proposal numbers race per slot, and the higher one wins. Dueling-leader livelock is avoided by randomised election timeouts (Raft style) or by binding `n = (term, leader_id)` so a stable leader's number always beats a transient challenger.

**Snapshotting.** The log grows forever unless trimmed. Once slot `i` is applied on a majority, the state up to `i` can be snapshotted, slots `≤ i` discarded, and `i + 1` marked as the new log start. Lagging replicas catch up via snapshot transfer plus tail replay.

## complexity
- **Messages per write (steady state):** `2f + 1` Accept messages out, `f + 1` acks back. One Accept round, one RTT.
- **Messages on leader change:** one bulk Prepare to all acceptors (`2f + 1` out, `f + 1` promises back), plus one Accept per half-finished slot. Bounded by the number of slots in flight at the failure moment.
- **Latency:** `1 RTT` steady state. `2-3 RTTs` during election: heartbeat-timeout + Prepare + first Accept.
- **Fault tolerance:** `2f + 1` acceptors survive `f` failures. Five nodes survive two simultaneous crashes.
- **Throughput:** bound by the leader's outbound bandwidth and disk fsync rate (acceptors must persist promises and accepts before acking).

## pitfalls
- **Forgetting to re-propose half-accepted values on leader change.** If the new leader skips a slot that the old leader had gotten a single acceptor to accept, and that single acceptor was part of the eventual majority, safety breaks. The recovery scan over Phase-1 promises MUST cover every slot from `i*` onward and re-issue Accept with the highest-na value found.
- **Reusing proposal numbers across leader restarts.** A leader that restarts and picks the same `n` it used before may overwrite its own prior promises. Encode `n = (epoch, node_id)` and persist `epoch` to disk; bump it on every recovery.
- **Acknowledging the client before the chosen state is durable on `f + 1` nodes.** A leader that returns "ok" after one acceptor responds can lose the write if that acceptor crashes before two more accept. Wait for a majority of accept-acks, not just one.
- **Letting the log grow unbounded.** Without snapshot-and-truncate, the log fills disk and new joiners take forever to replay. Snapshot at fixed slot intervals (every 10k writes) and ship snapshots to lagging followers.
- **Conflating safety with liveness in leader election.** Many implementations think their election protocol must be "correct" or safety breaks. It doesn't — two leaders is fine, just slow. Spend the engineering on randomised timeouts to reduce dueling, not on a complex leader-election sub-consensus.
- **Reading from the leader without checking it is still leader.** A partitioned-away old leader can serve stale reads. Reads must either re-confirm the lease via a fresh heartbeat round or be routed through the log (a no-op append that gets chosen confirms current leadership).

## interviewTips
- **Explain the Phase-1-amortisation insight clearly.** "Multi-Paxos is Paxos with Phase 1 cached across all future slots by a single leader" — that one sentence shows you understand both the protocol and the optimisation.
- **Compare directly to Raft.** Raft is Multi-Paxos with the leader role made central, log entries explicitly indexed, and a re-designed leader-election sub-protocol. Same safety properties, easier to implement correctly. If the interviewer asks "why not just use Raft?", the answer is usually "we should — Raft was invented because Multi-Paxos was too easy to implement wrong."
- **Know the recovery story cold.** The most common follow-up is "what happens when the leader dies mid-write?" Walk through: heartbeat timeout, new leader picks higher `n`, bulk Prepare, scans returned promises, re-proposes any half-accepted values, resumes Phase-2-only steady state. Mention the no-op-flush trick for unknown gaps.

## code
### python
```python
# Multi-Paxos acceptor — extends single-decree Paxos to per-slot state.
class MultiPaxosAcceptor:
    def __init__(self):
        self.np = -1                 # highest promised proposal number (global)
        self.accepted = {}           # slot -> (na, va)

    def on_prepare(self, n, from_slot):
        if n <= self.np:
            return ("nack", self.np)
        self.np = n
        promised = {s: (na, va) for s, (na, va) in self.accepted.items() if s >= from_slot}
        return ("promise", n, promised)

    def on_accept(self, n, slot, v):
        if n < self.np:
            return ("nack", self.np)
        self.np = n
        self.accepted[slot] = (n, v)
        return ("accepted", n, slot, v)


class Leader:
    def __init__(self, n, peers):
        self.n = n; self.peers = peers; self.next_slot = 0; self.is_leader = False

    def elect(self, from_slot):
        promises = [p.on_prepare(self.n, from_slot) for p in self.peers]
        if sum(1 for p in promises if p[0] == "promise") <= len(self.peers) // 2:
            return False
        recovery = {}
        for _, _, promised in (p for p in promises if p[0] == "promise"):
            for slot, (na, va) in promised.items():
                if slot not in recovery or na > recovery[slot][0]:
                    recovery[slot] = (na, va)
        for slot, (_, v) in recovery.items():
            self.propose(slot, v)
        self.is_leader = True
        return True

    def propose(self, slot, v):
        acks = sum(1 for p in self.peers if p.on_accept(self.n, slot, v)[0] == "accepted")
        return acks > len(self.peers) // 2
```

### javascript
```javascript
class MultiPaxosAcceptor {
  constructor() { this.np = -1; this.accepted = new Map(); }
  onPrepare(n, fromSlot) {
    if (n <= this.np) return ['nack', this.np];
    this.np = n;
    const promised = {};
    for (const [s, pair] of this.accepted) if (s >= fromSlot) promised[s] = pair;
    return ['promise', n, promised];
  }
  onAccept(n, slot, v) {
    if (n < this.np) return ['nack', this.np];
    this.np = n;
    this.accepted.set(slot, [n, v]);
    return ['accepted', n, slot, v];
  }
}

class Leader {
  constructor(n, peers) { this.n = n; this.peers = peers; this.nextSlot = 0; }
  elect(fromSlot) {
    const promises = this.peers.map(p => p.onPrepare(this.n, fromSlot));
    if (promises.filter(p => p[0] === 'promise').length <= this.peers.length / 2) return false;
    const recovery = new Map();
    for (const [, , promised] of promises.filter(p => p[0] === 'promise')) {
      for (const [slot, [na, va]] of Object.entries(promised)) {
        const cur = recovery.get(slot);
        if (!cur || na > cur[0]) recovery.set(slot, [na, va]);
      }
    }
    for (const [slot, [, v]] of recovery) this.propose(Number(slot), v);
    return true;
  }
  propose(slot, v) {
    const acks = this.peers.filter(p => p.onAccept(this.n, slot, v)[0] === 'accepted').length;
    return acks > this.peers.length / 2;
  }
}
```

### java
```java
import java.util.*;

class MultiPaxosAcceptor {
    long np = -1;
    Map<Long, long[]> accepted = new HashMap<>(); // slot -> [na, va-as-long]

    public synchronized Object[] onPrepare(long n, long fromSlot) {
        if (n <= np) return new Object[]{"nack", np};
        np = n;
        Map<Long, long[]> promised = new HashMap<>();
        for (var e : accepted.entrySet())
            if (e.getKey() >= fromSlot) promised.put(e.getKey(), e.getValue());
        return new Object[]{"promise", n, promised};
    }

    public synchronized Object[] onAccept(long n, long slot, long v) {
        if (n < np) return new Object[]{"nack", np};
        np = n;
        accepted.put(slot, new long[]{n, v});
        return new Object[]{"accepted", n, slot, v};
    }
}

class Leader {
    long n; List<MultiPaxosAcceptor> peers;
    Leader(long n, List<MultiPaxosAcceptor> peers) { this.n = n; this.peers = peers; }

    boolean propose(long slot, long v) {
        long acks = peers.stream()
            .map(p -> p.onAccept(n, slot, v))
            .filter(r -> "accepted".equals(r[0]))
            .count();
        return acks > peers.size() / 2;
    }
}
```

### cpp
```cpp
#include <unordered_map>
#include <vector>
#include <variant>
#include <mutex>

struct MultiPaxosAcceptor {
    long long np = -1;
    std::unordered_map<long long, std::pair<long long, long long>> accepted;
    std::mutex mu;

    struct Promise { long long n; std::unordered_map<long long, std::pair<long long, long long>> promised; };
    struct Nack    { long long np; };
    struct Accepted{ long long n, slot, v; };

    std::variant<Promise, Nack> on_prepare(long long n, long long from_slot) {
        std::lock_guard g(mu);
        if (n <= np) return Nack{np};
        np = n;
        decltype(accepted) promised;
        for (auto& [s, pair] : accepted) if (s >= from_slot) promised[s] = pair;
        return Promise{n, promised};
    }

    std::variant<Accepted, Nack> on_accept(long long n, long long slot, long long v) {
        std::lock_guard g(mu);
        if (n < np) return Nack{np};
        np = n;
        accepted[slot] = {n, v};
        return Accepted{n, slot, v};
    }
};
```
