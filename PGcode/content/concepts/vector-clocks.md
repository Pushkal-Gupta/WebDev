---
slug: vector-clocks
module: cs-core
title: Vector Clocks
subtitle: Track causality across distributed nodes with per-process integer counters.
difficulty: Advanced
position: 14
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Operating Systems: Three Easy Pieces"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Jepsen — Distributed-systems consistency analyses"
    url: "https://jepsen.io/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
In a distributed system the question "did event A happen before event B?" has no global clock to answer it. Wall-clock timestamps drift; logical scalars (Lamport clocks) can't distinguish concurrent events from causally related ones. Vector clocks pin down the answer with a per-node integer vector that grows whenever a node acts or receives a message.

## whyItMatters
Vector clocks are the math behind conflict detection in Dynamo, Riak, CRDTs, distributed debugging, snapshot algorithms, and causal-consistency databases. Whenever a system needs to ask "are these two updates concurrent or did one precede the other?" — without trusting wall clocks — vector clocks are the canonical tool.

## intuition
Imagine N processes, each keeping a tally board of length N. Slot `i` on process `i`'s board counts its own local events. Slot `j` on process `i`'s board is "the latest count of process `j`'s events that process `i` has heard about." Every message piggybacks the sender's full board. On receive, the recipient takes the element-wise max, then bumps its own slot. Comparing two boards then tells you everything about causality.

## visualization
```
P1: [0,0,0] -- local event --> [1,0,0] -- send msg [1,0,0] --> P2
P2: [0,0,0] -- recv max+bump --> [1,1,0]
P2: [1,1,0] -- local event ---> [1,2,0] -- send msg [1,2,0] --> P3
P3: [0,0,0] -- recv max+bump --> [1,2,1]

Compare two vectors V and U:
  V < U   iff  V[i] <= U[i] for all i  AND  V != U     (V happened-before U)
  V || U  iff  not (V <= U) and not (U <= V)            (concurrent — conflict!)
```

## bruteForce
Use wall-clock timestamps. Cheap to compute, but two events less than your clock skew apart can be wrongly ordered. NTP drift of 100ms in a multi-region system silently swaps the "winner" of two near-simultaneous writes — leading to lost updates that nobody notices until much later.

## optimal
Maintain `V[1..N]` per process. Rules:
1. On every local event on process `i`: `V[i] += 1`.
2. On send from `i`: attach a copy of `V`.
3. On receive at `j` of a message with attached `U`: `for k: V[k] = max(V[k], U[k])`, then `V[j] += 1`.

Comparison:
- `V <= U` if `V[k] <= U[k]` for every `k`.
- `V < U` if `V <= U` and `V != U` — meaning V's event causally precedes U's.
- Neither holds → events are **concurrent**, and the application must resolve (siblings, merge, ask the user).

Dynamo-style stores piggyback a vector clock on every value. On read, divergent vectors surface as conflicting siblings rather than being silently overwritten.

## complexity
- **Storage per event/message**: O(N) for N participating nodes.
- **Compare two vectors**: O(N).
- **Merge on receive**: O(N).
- **Scaling problem**: in systems with thousands of clients, naive vector clocks blow up. Mitigations: bound the vector to "actor IDs" (servers, not clients), prune dormant entries, or switch to **dotted version vectors** (Riak) or **HLCs** (CockroachDB).

## pitfalls
- **Bumping the wrong slot on receive** — always bump the *receiver*'s slot, not the sender's.
- **Forgetting to compare entry-by-entry** — `sum(V)` is not a valid ordering, that's a Lamport clock and loses concurrency information.
- **Unbounded growth**: every new client that ever wrote a key adds a slot. Use server-side actor IDs, not per-client.
- **Equal vectors mean *same event*, not "tie"** — if you see two distinct events with equal vectors, your clock plumbing is broken.
- **Wall-clock fallback "for tiebreaking"** quietly recreates the lost-update bug you adopted vector clocks to avoid.

## interviewTips
- Contrast against Lamport timestamps: Lamport gives a *total order* consistent with happens-before, vector clocks give *partial order* that detects concurrency.
- Bring up Dynamo's siblings — vector clocks are how an AP store knows it has a real conflict vs. a stale read.
- Mention size as the production problem and **dotted version vectors** or **HLC** as the fix — instant senior-engineer signal.
- Know the three rules cold: local-bump, send-attach, receive-merge-then-bump.

## code.python
```python
class VectorClock:
    def __init__(self, node_id, n):
        self.node_id, self.v = node_id, [0] * n

    def tick(self):
        self.v[self.node_id] += 1
        return list(self.v)

    def send(self):
        return self.tick()

    def receive(self, incoming):
        self.v = [max(a, b) for a, b in zip(self.v, incoming)]
        return self.tick()

    @staticmethod
    def compare(a, b):
        le = all(x <= y for x, y in zip(a, b))
        ge = all(x >= y for x, y in zip(a, b))
        if le and ge: return "equal"
        if le: return "before"
        if ge: return "after"
        return "concurrent"
```

## code.javascript
```javascript
class VectorClock {
  constructor(id, n) { this.id = id; this.v = Array(n).fill(0); }
  tick() { this.v[this.id]++; return [...this.v]; }
  send() { return this.tick(); }
  receive(incoming) {
    this.v = this.v.map((x, i) => Math.max(x, incoming[i]));
    return this.tick();
  }
  static compare(a, b) {
    const le = a.every((x, i) => x <= b[i]);
    const ge = a.every((x, i) => x >= b[i]);
    if (le && ge) return "equal";
    if (le) return "before";
    if (ge) return "after";
    return "concurrent";
  }
}
```

## code.java
```java
import java.util.Arrays;
class VectorClock {
    final int id; final int[] v;
    VectorClock(int id, int n) { this.id = id; this.v = new int[n]; }
    int[] tick() { v[id]++; return v.clone(); }
    int[] send() { return tick(); }
    int[] receive(int[] incoming) {
        for (int i = 0; i < v.length; i++) v[i] = Math.max(v[i], incoming[i]);
        return tick();
    }
    static String compare(int[] a, int[] b) {
        boolean le = true, ge = true;
        for (int i = 0; i < a.length; i++) {
            if (a[i] > b[i]) le = false;
            if (a[i] < b[i]) ge = false;
        }
        if (le && ge) return "equal";
        if (le) return "before";
        if (ge) return "after";
        return "concurrent";
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <algorithm>
struct VectorClock {
    int id; std::vector<int> v;
    VectorClock(int id, int n) : id(id), v(n, 0) {}
    std::vector<int> tick() { v[id]++; return v; }
    std::vector<int> send() { return tick(); }
    std::vector<int> receive(const std::vector<int>& in) {
        for (size_t i = 0; i < v.size(); ++i) v[i] = std::max(v[i], in[i]);
        return tick();
    }
    static std::string compare(const std::vector<int>& a, const std::vector<int>& b) {
        bool le = true, ge = true;
        for (size_t i = 0; i < a.size(); ++i) { if (a[i] > b[i]) le = false; if (a[i] < b[i]) ge = false; }
        if (le && ge) return "equal";
        if (le) return "before";
        if (ge) return "after";
        return "concurrent";
    }
};
```
