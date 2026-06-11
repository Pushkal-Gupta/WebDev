---
slug: vector-clock
module: sd-consensus
title: Vector Clock
subtitle: A per-process vector of counters that detects concurrent updates — used by Dynamo, Riak, and any system that needs to merge conflicting writes.
difficulty: Advanced
position: 25
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Fidge — Timestamps in Message-Passing Systems That Preserve the Partial Ordering (1988)"
    url: "https://www.cs.helsinki.fi/u/jakangas/Teaching/RTS/papers/Fidge.pdf"
    type: paper
  - title: "DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store (SOSP 2007)"
    url: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"
    type: paper
  - title: "Martin Kleppmann — Designing Data-Intensive Applications, Ch. 5"
    url: "https://dataintensive.net/"
    type: book
status: published
---

## intro
A **vector clock** generalises a [[lamport-clock]] from a single counter to one counter per process. With N processes, every event is stamped with an N-dimensional vector `V` where `V[i]` is "the highest event count process i has observed (directly or transitively)". The cost is O(N) per stamp, but the payoff is enormous: you can now detect when two events are **concurrent** — that is, neither happened-before the other — which Lamport clocks cannot.

## whyItMatters
Distributed databases that allow multiple replicas to accept writes (Dynamo, Riak, Cassandra in some modes, CRDTs in general) must reconcile concurrent updates. Last-write-wins by wall clock silently drops data. Vector clocks make conflict detection *explicit*: the read returns multiple "siblings" and the application or a merge function decides how to combine them. Riak's bucket types, DynamoDB's sync-protocol metadata, and the version vectors in Git's distributed sync all derive from this idea.

## intuition
Picture three replicas A, B, C, each tracking a 3-entry vector. Process A's vector `[3, 1, 0]` reads as: "I have produced 3 events of my own; I have observed at least 1 event from B; I have observed 0 events from C." When A sends a message, B receives it and **merges**: for each index, B takes max(its own, A's). Then B bumps its own index. So if B had `[2, 4, 0]` and receives A's `[3, 1, 0]`, B becomes `[max(2,3), max(4,1)+1, max(0,0)] = [3, 5, 0]`.

Two vectors `V` and `W` are ordered as follows:
- **V → W** (V happens-before W) iff `V[i] ≤ W[i]` for all i AND `V[j] < W[j]` for at least one j.
- **V = W** iff they're identical componentwise.
- **V || W** (concurrent) iff neither V → W nor W → V — there exists some i with `V[i] < W[i]` AND some j with `V[j] > W[j]`.

That last condition is the magic. Concurrent events live in a 2D "neither-side-of" zone. With Lamport timestamps that's impossible to express — every pair of distinct integers has one strictly greater. Vector clocks reveal the *real* partial-order structure of the distributed history.

In practice, Dynamo's reads can return multiple versions tagged with conflicting vector clocks. The client gets all the conflicting values and chooses (or the database applies a CRDT merge). When the merged result is written back, it carries a vector clock that is the componentwise max of all merged inputs plus one bump on the writer's own index — strictly dominating all conflicting versions, so future reads see the resolved value.

## visualization
```
Initial:   A=[0,0,0]   B=[0,0,0]   C=[0,0,0]

A writes:  A=[1,0,0]
A → B:                 B=[max(0,1),max(0,0)+1,max(0,0)] = [1,1,0]
B writes:              B=[1,2,0]
C writes (concurrent): C=[0,0,1]
B → C:                              C=[max(0,1),max(0,2),max(1,0)+1] = [1,2,2]

Now compare A=[1,0,0] and C=[1,2,2]:
  A[0]=1 ≤ C[0]=1, A[1]=0 ≤ C[1]=2, A[2]=0 ≤ C[2]=2, and one strict (j=1).
  So A → C: causal.

Compare A=[1,0,0] and a hypothetical D=[0,1,0]:
  A[0]=1 > D[0]=0, but A[1]=0 < D[1]=1. Concurrent.
```

## bruteForce
"Use Lamport timestamps and order everything totally." Works for replicated state machines that serialise all writes through a leader, but breaks under multi-leader replication: you cannot tell whether two writes are causally related or independent, so you cannot tell whether to merge them or pick one. The result is data loss.

## optimal
Each of N processes maintains a vector `V` of length N, all entries initialized to 0.

- **Local event** on process `i`: `V[i] ← V[i] + 1`.
- **Send** from process `i`: do the local-event bump, then attach a copy of `V` to the message.
- **Receive** by process `i` of vector `Vm`: for each k, `V[k] ← max(V[k], Vm[k])`; then `V[i] ← V[i] + 1`.

Compare `V` and `W`:
```
V ≤ W   iff   for all i, V[i] ≤ W[i]
V < W   iff   V ≤ W and there exists i with V[i] < W[i]
V || W  iff   not V ≤ W and not W ≤ V
```

The partial-order theorem: `event_a → event_b` if and only if `V_a < V_b`. This is the property Lamport clocks lack. The cost is O(N) per stamp, comparison, and merge — fine for small clusters, painful for systems with thousands of clients per shard.

Real systems prune vectors aggressively. Riak uses "actor" identifiers (often client IDs) rather than per-replica IDs, and times out entries that haven't appeared in messages for a long window. The trade-off: shorter vectors mean potential false-concurrency (treating causally-related events as concurrent), which Riak mitigates with a write-conflict policy.

## complexity
- Per local event: O(1).
- Per send/receive: O(N) for the vector copy + max.
- Comparison: O(N). For very large N, version vectors with sparse representations (only non-zero entries) cut this to O(active processes).
- Storage per stored object: O(N) extra bytes — a 1KB value with 1000 active actors carries 8KB of vector clock metadata. Production systems aggressively prune.

## pitfalls
- **Letting N grow unboundedly.** Every new actor adds a dimension. Without pruning, the vector eventually dominates the value's storage cost. Production: timeout-and-prune entries that haven't been bumped recently.
- **Hashing actor IDs into a fixed-size vector.** Tempting (constant-size vectors!) but collisions create false ordering — two unrelated actors look like the same actor and their vectors merge incorrectly. Never collapse the dimension this way.
- **Confusing `||` (concurrent) with `=` (equal).** Different bugs. Concurrent vectors mean "neither dominates the other" — different histories, need merging. Equal vectors mean "identical observation" — usually a duplicate delivery, drop.
- **Not bumping the local index on receive.** Same trap as Lamport: a receive is a local event. Without the bump, sequences of receives followed by sends produce stale vectors that fail the partial-order test.
- **Garbage collection bugs around tombstones.** Deletes need vector clocks too — otherwise a delete and a concurrent write race silently and the resolved state can resurrect the deleted entry. Dynamo's "tombstones with vector clocks that GC after a quorum quorum-sees-it" rule is the canonical fix.

## interviewTips
- **Lead with the property Lamport lacks: concurrency detection.** That's the whole reason vector clocks exist.
- **Quote a real system.** Dynamo, Riak, and CockroachDB's HLC-with-causal-tokens all use this. Bonus points for mentioning Riak's "siblings" model — the read returns multiple values when vector clocks are concurrent.
- **Mention pruning.** Interviewers know vectors grow without bound; show that you do too. "Actor ID + timeout" is the production answer.

## code
### python
```python
class VectorClock:
    def __init__(self, n: int, pid: int) -> None:
        self.v = [0] * n
        self.pid = pid

    def local_event(self) -> list[int]:
        self.v[self.pid] += 1
        return list(self.v)

    def on_send(self) -> list[int]:
        return self.local_event()

    def on_receive(self, incoming: list[int]) -> list[int]:
        for k in range(len(self.v)):
            self.v[k] = max(self.v[k], incoming[k])
        self.v[self.pid] += 1
        return list(self.v)

def compare(a: list[int], b: list[int]) -> str:
    le = all(x <= y for x, y in zip(a, b))
    ge = all(x >= y for x, y in zip(a, b))
    if le and ge: return "equal"
    if le: return "a_before_b"
    if ge: return "b_before_a"
    return "concurrent"
```

### javascript
```javascript
class VectorClock {
  constructor(n, pid) { this.v = Array(n).fill(0); this.pid = pid; }
  localEvent() { this.v[this.pid]++; return [...this.v]; }
  onSend() { return this.localEvent(); }
  onReceive(incoming) {
    for (let k = 0; k < this.v.length; k++) this.v[k] = Math.max(this.v[k], incoming[k]);
    this.v[this.pid]++;
    return [...this.v];
  }
}
function compare(a, b) {
  const le = a.every((x, i) => x <= b[i]);
  const ge = a.every((x, i) => x >= b[i]);
  if (le && ge) return 'equal';
  if (le) return 'a_before_b';
  if (ge) return 'b_before_a';
  return 'concurrent';
}
```

### java
```java
import java.util.Arrays;

public class VectorClock {
    private final long[] v;
    private final int pid;
    public VectorClock(int n, int pid) { this.v = new long[n]; this.pid = pid; }
    public synchronized long[] localEvent() { v[pid]++; return v.clone(); }
    public synchronized long[] onSend() { return localEvent(); }
    public synchronized long[] onReceive(long[] incoming) {
        for (int k = 0; k < v.length; k++) v[k] = Math.max(v[k], incoming[k]);
        v[pid]++;
        return v.clone();
    }
    public static String compare(long[] a, long[] b) {
        boolean le = true, ge = true;
        for (int i = 0; i < a.length; i++) { if (a[i] > b[i]) le = false; if (a[i] < b[i]) ge = false; }
        if (le && ge) return "equal";
        if (le) return "a_before_b";
        if (ge) return "b_before_a";
        return "concurrent";
    }
}
```

### cpp
```cpp
#include <vector>
#include <algorithm>

class VectorClock {
    std::vector<long long> v;
    int pid;
public:
    VectorClock(int n, int p) : v(n, 0), pid(p) {}
    std::vector<long long> local_event() { v[pid]++; return v; }
    std::vector<long long> on_send() { return local_event(); }
    std::vector<long long> on_receive(const std::vector<long long>& incoming) {
        for (size_t k = 0; k < v.size(); k++) v[k] = std::max(v[k], incoming[k]);
        v[pid]++;
        return v;
    }
};

enum class Rel { Equal, ABeforeB, BBeforeA, Concurrent };
Rel compare(const std::vector<long long>& a, const std::vector<long long>& b) {
    bool le = true, ge = true;
    for (size_t i = 0; i < a.size(); i++) {
        if (a[i] > b[i]) le = false;
        if (a[i] < b[i]) ge = false;
    }
    if (le && ge) return Rel::Equal;
    if (le) return Rel::ABeforeB;
    if (ge) return Rel::BBeforeA;
    return Rel::Concurrent;
}
```
