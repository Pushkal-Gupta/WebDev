---
slug: crdt-conflict-free
module: system-design
title: CRDTs — Conflict-Free Replicated Data Types
subtitle: G-counter, OR-set, LWW-register — replicas that merge without coordination.
difficulty: Advanced
position: 22
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Replication chapter"
    url: "https://microservices.io/patterns/data/eventual-consistency.html"
    type: book
  - title: "CRDTs: The Hard Parts — Martin Fowler"
    url: "https://martinfowler.com/articles/patterns-of-distributed-systems/state-watch.html"
    type: blog
  - title: "redis/redis — CRDTs in Redis Enterprise"
    url: "https://github.com/redis/redis"
    type: repo
status: published
---

## intro
A CRDT is a data structure designed so that any two replicas, having received the same set of updates in any order, converge to the same value — without locks, leader election, or two-phase commit. They power collaborative editors (Figma, Notion), offline-first apps, and multi-region databases where round-trip coordination would kill latency.

## whyItMatters
Strong consistency demands quorum reads and writes, which means cross-region round-trips on the hot path. CRDTs let you do local-first writes that always succeed and asynchronously gossip to peers. The trade-off: you must encode "what to do on conflict" into the data type itself, not the application. Get the type right and conflict resolution is automatic; get it wrong and you lose updates silently.

## intuition
Two flavors. **State-based (CvRDTs)** ship the whole state and merge with a function that is commutative, associative, and idempotent — formally, a join-semilattice. **Operation-based (CmRDTs)** ship operations and require the delivery layer to be exactly-once causal-broadcast. Both reach the same eventual state; state-based is easier to deploy because the merge tolerates retries and duplicates.

## visualization
G-counter across three nodes A, B, C. Each node owns one slot; increments only touch your own slot; the counter value is the sum.

```
       A   B   C        merge rule: take max per slot
node A [3] [1] [2]      
node B [3] [2] [2]      after merge of A and B at any node:
node C [1] [1] [2]        [3] [2] [2]  -> value = 7
```

OR-set add/remove of element x: each add tags x with a unique uid; remove records the set of uids observed at remove time. An element is "in the set" iff it has any uid that hasn't been tombstoned. Concurrent add and remove resolves as add-wins.

## bruteForce
Last-writer-wins on the whole document keyed by wall-clock timestamp. Simple, but two simultaneous edits silently delete one user's work, and clock skew makes "last" non-deterministic. Acceptable only for caches where lost updates don't matter — never for user-authored content.

## optimal
Pick the right CRDT for the operation:
```
G-counter:        increment-only;          merge = elementwise max of per-node slots
PN-counter:       inc + dec;               two G-counters, value = P.sum - N.sum
LWW-register:     single mutable value;    merge keeps the (value, hybrid-logical-clock) with greater clock
OR-set:           add/remove of elements;  each add carries a uid; remove tombstones observed uids
RGA / Yjs:        ordered sequence;        each insert references a stable predecessor id; deletes are tombstones
```
Wrap CRDTs with **hybrid logical clocks** to tie-break LWW deterministically without trusting wall clocks. Garbage-collect tombstones once causal stability proves no in-flight op can reference them.

## complexity
time: O(1) per local op for counters/registers; O(log n) for ordered-sequence inserts in Yjs/RGA via balanced trees over the operation graph
space: O(n) replicas for counters (one slot per writer); O(k) per element for OR-set (uids accumulate until GC)
notes: Merge cost is bounded by the size of the divergence window; bandwidth scales with the number of unique writers, not total ops.

## pitfalls
- Treating LWW-register as safe for collaborative text — concurrent edits delete each other's keystrokes; use a sequence CRDT instead.
- Forgetting tombstone GC — OR-sets grow forever under heavy add/remove churn.
- Trusting wall-clock timestamps for LWW across regions — clock skew loses writes; use HLCs or vector clocks.
- Mixing op-based and state-based replicas without designing a bridge — op-based requires causal-broadcast guarantees state-based does not.
- Assuming CRDTs give you transactions across multiple keys — they don't; each key converges independently.

## interviewTips
- Lead with the convergence guarantee: "any merge order, same final state, no coordination."
- Be ready to name three CRDTs and one real product that uses each (Figma multiplayer = Yjs-like, Riak = OR-sets + counters, Redis Enterprise = LWW + counters).
- Discuss the CAP angle: CRDTs choose AP and sidestep CP by changing the data model.
- Mention the cost: metadata overhead (uids, vector clocks, tombstones) and the impossibility of cross-key invariants like "balance >= 0."

## code.python
```python
class GCounter:
    def __init__(self, node_id):
        self.node_id = node_id
        self.slots = {}

    def increment(self, n=1):
        self.slots[self.node_id] = self.slots.get(self.node_id, 0) + n

    def value(self):
        return sum(self.slots.values())

    def merge(self, other):
        for nid, count in other.slots.items():
            self.slots[nid] = max(self.slots.get(nid, 0), count)


class ORSet:
    def __init__(self):
        self.live = {}
        self.tombstones = set()

    def add(self, element, uid):
        self.live.setdefault(element, set()).add(uid)

    def remove(self, element):
        if element in self.live:
            self.tombstones.update(self.live[element])

    def contains(self, element):
        uids = self.live.get(element, set())
        return any(u not in self.tombstones for u in uids)

    def merge(self, other):
        for el, uids in other.live.items():
            self.live.setdefault(el, set()).update(uids)
        self.tombstones.update(other.tombstones)
```

## code.javascript
```javascript
class GCounter {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.slots = new Map();
  }
  increment(n = 1) {
    this.slots.set(this.nodeId, (this.slots.get(this.nodeId) || 0) + n);
  }
  value() {
    let total = 0;
    for (const c of this.slots.values()) total += c;
    return total;
  }
  merge(other) {
    for (const [nid, c] of other.slots) {
      this.slots.set(nid, Math.max(this.slots.get(nid) || 0, c));
    }
  }
}

class LWWRegister {
  constructor() { this.value = null; this.clock = 0; }
  set(value, clock) {
    if (clock > this.clock) { this.value = value; this.clock = clock; }
  }
  merge(other) { this.set(other.value, other.clock); }
}
```

## code.java
```java
class GCounter {
    private final String nodeId;
    private final Map<String, Long> slots = new HashMap<>();

    public GCounter(String nodeId) { this.nodeId = nodeId; }

    public void increment(long n) {
        slots.merge(nodeId, n, Long::sum);
    }

    public long value() {
        return slots.values().stream().mapToLong(Long::longValue).sum();
    }

    public void merge(GCounter other) {
        for (var e : other.slots.entrySet()) {
            slots.merge(e.getKey(), e.getValue(), Long::max);
        }
    }
}
```

## code.cpp
```cpp
struct GCounter {
    std::string nodeId;
    std::unordered_map<std::string, long> slots;

    void increment(long n = 1) { slots[nodeId] += n; }

    long value() const {
        long total = 0;
        for (auto& [_, c] : slots) total += c;
        return total;
    }

    void merge(const GCounter& other) {
        for (auto& [nid, c] : other.slots) {
            auto it = slots.find(nid);
            slots[nid] = (it == slots.end()) ? c : std::max(it->second, c);
        }
    }
};
```
