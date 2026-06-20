---
slug: cas-vs-paxos
module: sd-consensus
title: CAS vs Paxos
subtitle: Single-register compare-and-swap as the consensus baseline, then Paxos as the quorum-based extension across N replicas.
difficulty: Advanced
position: 4
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 9: Consistency and Consensus"
    url: "https://dataintensive.net/"
    type: book
  - title: "Jepsen — Distributed Systems Safety Analysis"
    url: "https://jepsen.io/"
    type: blog
  - title: "donnemartin/system-design-primer — Consistency Patterns"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
Consensus is the problem of getting N machines to agree on one value despite asynchronous networks and crashes. The simplest consensus primitive lives on a single CPU: compare-and-swap (CAS), a hardware instruction that atomically writes a new value only if the current value matches the expected one. Paxos generalizes that idea across machines, using quorums of acceptors instead of a cache line, with a two-phase protocol that survives any minority crash. The two are best understood together: Paxos *is* CAS replayed over a network with majorities standing in for the bus.

## whyItMatters
Every distributed system you respect — Spanner, etcd, Consul, Cassandra LWT, ZooKeeper, Kafka KRaft — runs a flavor of Paxos or Raft underneath. Interview questions about "how do you elect a leader," "how do you avoid split-brain," or "how does a config store stay consistent" all bottom out in consensus. Knowing the CAS analogy demystifies it: the same `expected → witnessed → committed` pattern that protects a single integer also protects a global config across a datacenter.

## intuition
Single-CPU CAS: a thread reads `x = 5`, computes `x' = 6`, and asks the CPU "set x to 6 *only if* it is still 5." The CPU's cache-coherence hardware locks the line, compares, swaps, returns true; any concurrent writer either succeeds first or is told to retry. Paxos plays the same game with messages: a proposer picks a unique ballot number, asks a *majority* of acceptors "promise me you'll ignore anything older than n," reads back the highest value any of them has already accepted, then asks the same majority to accept *that* value at ballot n. Two majorities must intersect, so at most one value wins per slot.

## visualization
CAS as a one-slot register:

```
T1: read(x)=5 ; CAS(x, 5, 6) -> true   (x is now 6)
T2: read(x)=5 ; CAS(x, 5, 7) -> false  (must retry: read x=6, CAS(x, 6, 7) -> true)
```

Paxos Phase 1 + Phase 2 across 5 acceptors:

```
Proposer P1:  PREPARE(n=10) ----> A1 A2 A3 A4 A5
              <- PROMISE(10, prev=(n=7, v="A"))  (from A1 A2 A3 = majority)
              ACCEPT(n=10, v="A") --> A1 A2 A3
              <- ACCEPTED(10, "A") ------------- (chosen)
```

Because any future proposer must also see a majority, it will witness the (10, "A") accepted record and re-propose "A".

## bruteForce
"Just use a single primary." Pick one node as leader, everyone writes to it, the leader replicates. Works until the leader crashes — now who decides the new leader? Without consensus, you risk two nodes both believing they are leader (split-brain) and accepting conflicting writes. A naïve heartbeat-based failover *is* the bug Jepsen reports keep finding. Production systems use Paxos/Raft specifically to elect that "single primary" safely.

## optimal
Use a Paxos/Raft library or service rather than rolling your own — etcd, ZooKeeper, Consul, or embedded Raft (e.g. `hashicorp/raft`) for new systems. Reserve manual CAS for *single-key* coordination: Redis `SET key val NX` plus a fencing token, DynamoDB conditional updates, Postgres `UPDATE ... WHERE version = ?` optimistic locking. For *multi-key* invariants across replicas (config, leader election, group membership), reach for consensus. Multi-Paxos / Raft batch the prepare phase across many slots via a stable leader, dropping per-decision latency to a single round trip after the leader is established.

## complexity
time: CAS — one CPU cycle (lock-prefix), with potential retry loop O(contention). Paxos — 2 RTTs per decision (1 RTT with a stable leader in Multi-Paxos / Raft); requires a majority (`⌊N/2⌋ + 1`) of acceptors reachable.
space: CAS — one word. Paxos — O(slots × replicas) on each acceptor's persistent log; trimmed via snapshots.
notes: Paxos guarantees safety (at most one value chosen per slot) under any asynchrony, but liveness only under partial synchrony — without timing assumptions, dueling proposers can starve each other (FLP impossibility).

## pitfalls
- **CAS without a fence**: a stale leader holding an expired Redis lock writes after a new leader took over — use a monotonically increasing fencing token.
- **ABA**: between read and CAS, value goes 5 → 6 → 5 and CAS succeeds spuriously. Tag with a version counter (`std::atomic<std::pair<int,int>>`).
- **Dueling proposers in basic Paxos** — each preempts the other and no one finishes. Multi-Paxos / Raft fix this by electing a stable leader.
- **Quorum loss after a split** — if 3 of 5 acceptors are partitioned away, the remaining 2 cannot make progress. By design — but ops teams reinvent this every time they "fix" it with a manual force-recovery.
- **Treating Paxos like an RPC** — it is a state-machine replication protocol; clients submit commands, the cluster applies them in agreed-upon order.

## interviewTips
- Open with "consensus = distributed CAS, where the cache line is a quorum." Interviewers nod and move on.
- Know that **Raft** is Paxos repackaged for understandability — same safety, friendlier mental model (leader election + log replication explicit).
- Cite the FLP impossibility result: deterministic consensus is impossible under pure asynchrony with even one crash failure — practical systems sidestep it with timeouts.
- For "how do you avoid split-brain?" say "majority quorum + fencing tokens" — both halves of the answer matter.

## code.python
```python
# CAS-style optimistic locking against Postgres
def transfer(db, account_id, delta):
    while True:
        row = db.execute(
            "SELECT balance, version FROM accounts WHERE id=%s", (account_id,)
        ).fetchone()
        new_balance = row["balance"] + delta
        affected = db.execute(
            "UPDATE accounts SET balance=%s, version=version+1 "
            "WHERE id=%s AND version=%s",
            (new_balance, account_id, row["version"]),
        ).rowcount
        if affected == 1:
            return new_balance
        # else: someone else updated; retry.
```

## code.javascript
```javascript
// Distributed CAS via Redis SET NX + fencing token
async function acquireLock(redis, key, ttlMs) {
  const token = await redis.incr("fence:" + key);  // monotonic fencing
  const ok = await redis.set("lock:" + key, String(token), "NX", "PX", ttlMs);
  return ok ? token : null;
}

async function releaseLock(redis, key, token) {
  const lua = `
    if redis.call("GET", KEYS[1]) == ARGV[1]
    then return redis.call("DEL", KEYS[1]) else return 0 end`;
  await redis.eval(lua, 1, "lock:" + key, String(token));
}
```

## code.java
```java
// Hardware CAS on a single JVM
import java.util.concurrent.atomic.AtomicReference;

class CasCounter {
    private final AtomicReference<Long> value = new AtomicReference<>(0L);

    long increment() {
        while (true) {
            long current = value.get();
            long next = current + 1;
            if (value.compareAndSet(current, next)) return next;
            // contention -> retry
        }
    }
}
```

## code.cpp
```cpp
// Lock-free stack push using CAS — single-node analogue of a Paxos accept.
#include <atomic>

struct Node { int v; Node* next; };
std::atomic<Node*> top{nullptr};

void push(int v) {
    Node* n = new Node{v, nullptr};
    Node* old;
    do {
        old = top.load(std::memory_order_relaxed);
        n->next = old;
    } while (!top.compare_exchange_weak(
        old, n, std::memory_order_release, std::memory_order_relaxed));
}
```
