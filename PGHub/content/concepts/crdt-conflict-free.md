---
slug: crdt-conflict-free
module: sd-consensus
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
- **Figma's multiplayer engine, Notion's collaborative editor, Linear's offline sync, and Apple Notes** use CRDT-based sequence types (RGA, Yjs, Automerge) to merge concurrent edits without locks.
- **Riak's CRDT data types** (counters, sets, maps, registers — built on Mark Shapiro's INRIA paper, 2011) and **Redis Enterprise's Active-Active CRDB** make CRDTs first-class database primitives.
- **AWS DynamoDB Global Tables**, **Azure Cosmos DB multi-region writes**, and **CockroachDB's geo-partitioned tables** all use CRDT-like merge semantics for multi-region write availability.
- **Automerge, Yjs, and Y.js** are the open-source libraries powering most collaborative web apps; the original 2011 paper "A comprehensive study of Convergent and Commutative Replicated Data Types" by Shapiro, Preguica, Baquero, and Zawirski is the canonical reference.

## intuition
Strong consistency demands quorum reads and writes across replicas, which means cross-region round-trips (50-200 ms) on the hot path. For interactive applications — collaborative editing, offline-first mobile apps, multi-region active-active databases — that latency is unacceptable. CRDTs offer a different deal: every replica writes **locally** (zero round-trip, microsecond latency), then asynchronously gossips updates to peers; replicas converge to the same state **regardless of network order or duplicates**, with no central coordinator and no locks.

The mathematical guarantee that makes this work: **a CRDT is a data type whose merge function is commutative, associative, and idempotent**. Commutative means `merge(A, B) == merge(B, A)` — order does not matter. Associative means `merge(merge(A, B), C) == merge(A, merge(B, C))` — grouping does not matter. Idempotent means `merge(A, A) == A` — duplicates do not matter. Formally, a state-based CRDT (CvRDT) is a join-semilattice; the merge is the lattice's join (least upper bound). Once you prove your type satisfies these three laws, any two replicas that have observed the same set of updates in any order will converge to bit-identical state — no application-level conflict resolution needed.

Two flavors. **State-based (CvRDTs)** ship the entire data structure and merge with the join function — easy to deploy because retries and duplicates are absorbed by idempotence, but bandwidth scales with state size. **Operation-based (CmRDTs)** ship individual operations and require the network layer to provide **exactly-once causal broadcast** — bandwidth scales with op count (usually smaller), but the delivery guarantees are harder to build. Yjs and Automerge are op-based with sophisticated causal-broadcast layers; Riak's data types are state-based with delta compression.

The trade-off: you must encode "what should happen on conflict" into the data type **itself**, not the application. Get the type right (counter with elementwise max merge, set with add-wins / remove-wins, sequence with stable position ids), and conflict resolution is automatic. Get it wrong (last-writer-wins on a document keyed by wall clock), and two simultaneous edits silently delete one user's work.

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
The right approach is **picking the CRDT whose merge semantics match the operation**, wrapping with **Hybrid Logical Clocks (HLC)** for deterministic tie-breaking, and **garbage-collecting tombstones** via causal stability tracking. The Shapiro et al. 2011 paper "A comprehensive study of Convergent and Commutative Replicated Data Types" is the canonical catalog; Yjs and Automerge are the production reference implementations.

```
Operation                  | CRDT             | Merge function
---------------------------+------------------+----------------------------------
increment-only counter     | G-Counter        | elementwise MAX of per-node slots
inc + dec counter          | PN-Counter       | two G-Counters: value = P.sum - N.sum
single mutable value       | LWW-Register     | keep (value, HLC) with greater HLC
single mutable value       | MV-Register      | keep all concurrent (value, version) pairs
add/remove of elements     | OR-Set           | per-element: live UIDs minus tombstones
ordered sequence (text)    | RGA / Yjs / Auto | insert refs stable predecessor; del tombstones
mutable map                | OR-Map           | per-key: nested CRDT merge
```

```python
class GCounter:
    """G-Counter: increment-only; merge = elementwise max of per-node slots."""
    def __init__(self, node_id: str):
        self.node_id = node_id
        self.slots: dict[str, int] = {}
    def increment(self, n: int = 1) -> None:
        self.slots[self.node_id] = self.slots.get(self.node_id, 0) + n
    def value(self) -> int:
        return sum(self.slots.values())
    def merge(self, other: 'GCounter') -> None:
        # Commutative, associative, idempotent: max(a, b) merge has all three.
        for nid, count in other.slots.items():
            self.slots[nid] = max(self.slots.get(nid, 0), count)

class ORSet:
    """OR-Set: add-wins remove; each add carries a unique UID."""
    def __init__(self):
        self.live: dict[str, set] = {}        # element -> set of live UIDs
        self.tombstones: set = set()
    def add(self, element, uid: str) -> None:
        self.live.setdefault(element, set()).add(uid)
    def remove(self, element) -> None:
        # Tombstone every UID currently OBSERVED for this element.
        # New concurrent adds (with new UIDs) survive -> add-wins semantics.
        if element in self.live:
            self.tombstones.update(self.live[element])
    def contains(self, element) -> bool:
        return any(u not in self.tombstones for u in self.live.get(element, set()))
    def merge(self, other: 'ORSet') -> None:
        for el, uids in other.live.items():
            self.live.setdefault(el, set()).update(uids)
        self.tombstones.update(other.tombstones)
```

Why this is right: each CRDT's merge function satisfies **commutativity, associativity, and idempotence** by construction — formally a **join-semilattice** with merge = lattice join. G-Counter uses `max` per slot (idempotent because `max(x, x) = x`, commutative because `max(a, b) = max(b, a)`, associative). OR-Set's merge is set union of live UIDs and tombstones, plus the "live ⊖ tombstones" projection at read time — the UIDs make concurrent adds distinguishable, and the tombstone set is monotone (only grows), guaranteeing eventual convergence.

**Hybrid Logical Clocks (HLC)** (Kulkarni, Demirbas, 2014) replace wall-clock timestamps in LWW: HLC = (physical_time, logical_counter); ticks advance logically when events are concurrent, preserving causality without trusting NTP. This eliminates the classical LWW failure mode where a node with a 50 ms fast clock silently overwrites correct writes from a node with a correct clock. **CockroachDB, YugabyteDB, MongoDB** all use HLC; original Spanner uses TrueTime atomic clocks for an even stronger guarantee.

**Tombstone garbage collection** is the operational reality. Naive OR-Sets keep tombstones forever, growing metadata unboundedly under heavy add/remove churn. Production implementations (Riak's CRDT types, Yjs, Automerge) periodically determine **causal stability** — the point past which no in-flight operation can reference a given UID — and reclaim tombstones older than that point. This requires either a coordinator or a gossip protocol to converge on the stable frontier.

**Adjacent algorithms**:
- **Operational Transformation (OT)** — Google Docs's original approach; log operations, transform concurrent ops before applying. Lower metadata overhead than CRDTs but requires a central server for the transformation matrix.
- **Yjs and Automerge** — production text CRDTs (RGA + delta encoding) that power Linear, Notion blocks, Atlassian, and the new Apple Notes sync.
- **Riak DT and Redis Enterprise CRDB** — server-side CRDT types in databases; transactions still impossible across keys.

**Hard limits**: CRDTs preserve per-key convergence but **not cross-key invariants** ("balance >= 0", "sum of cart_items.price == cart.total"). Those need a transaction layer or a coordinating actor. Choose CRDTs when AP + local-first writes matter more than strict cross-key invariants.

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
