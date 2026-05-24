---
slug: multi-master-replication
module: system-design
title: Multi-Master Replication
subtitle: Multi-writer topologies, conflict detection, and resolution strategies.
difficulty: Advanced
position: 2
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Replication"
    url: "https://dataintensive.net/"
    type: book
  - title: "Eventual Consistency — Martin Fowler"
    url: "https://martinfowler.com/articles/patterns-of-distributed-systems/replicated-log.html"
    type: blog
  - title: "Jepsen — On the perils of multi-master"
    url: "https://jepsen.io/analyses"
    type: blog
status: published
---

## intro
Single-leader replication is simple: one node accepts writes, everyone else replicates. Multi-master replication lets *every* replica accept writes, which removes the leader bottleneck and survives leader-region outages without failover — at the cost of having to detect and resolve conflicting concurrent writes to the same key.

## whyItMatters
Globally-distributed products (collaborative docs, multiplayer games, edge databases) cannot afford to round-trip every write to one leader region. Multi-master gives every region local write latency, plus the ability to keep working when the WAN to other regions is degraded. The hard part is no longer "where does the write go" but "what does it mean when two regions wrote conflicting values 50 ms apart?" — and the answer determines whether your product feels correct or broken.

## intuition
Picture two users in Tokyo and Frankfurt editing the same shared shopping cart. Both add an item at the same millisecond. With single-leader, one wait, one wins — fair, but slow. With multi-master, both writes succeed locally and then have to be merged. Merging is easy if the operations commute (add to a set, increment a counter) and hard if they don't (set price = X vs set price = Y). The whole game is choosing data structures and conflict rules that *make* operations commute.

## visualization
Three replicas A, B, C arranged in a triangle, each with bidirectional edges. A receives `set x = 1` at t=10ms; B receives `set x = 2` at t=11ms. Both replicate. At t=50ms all three have logs containing both writes — but in different orders. A resolution rule (last-write-wins by timestamp, vector-clock dominance, or CRDT merge) chooses the final value deterministically so all three converge.

## bruteForce
Last-Write-Wins (LWW): every write carries a wall-clock timestamp; on conflict, the later timestamp wins. Trivial to implement and ships in DynamoDB, Cassandra, and many sync engines. The brute-force failure mode is clock skew — a node with a slightly fast clock silently overwrites correct writes from a node with a correct clock. Add NTP and you reduce skew but never eliminate it, so LWW silently drops writes under load.

## optimal
Two real options. (1) Conflict-free Replicated Data Types (CRDTs) — pick data structures (G-Counter, OR-Set, LWW-Element-Set, RGA for text) whose merge is associative, commutative, and idempotent, so any merge order converges. (2) Operational Transformation (OT) — log operations, transform concurrent ops against each other before applying. CRDTs win for eventual consistency without a coordinator (used by Riak, Redis CRDB, Automerge, Yjs). OT wins for tight latency with a central server (used by Google Docs historically).

## complexity
time: O(replicas) per write to replicate; O(1) amortized per merge for CRDTs.
space: O(history) for vector clocks; O(state) for CRDT metadata (often 2-3x the raw payload).
notes: CRDT metadata growth is the real cost — naive OR-Sets keep tombstones forever; production implementations need periodic garbage-collection coordination.

## pitfalls
- Assuming NTP makes LWW safe — it does not; clock skew of even 50 ms drops writes under contention.
- Picking CRDTs without thinking about garbage collection — OR-Set tombstones accumulate and break long-running instances.
- Hidden non-commutative operations: "set price" looks innocent but is order-dependent. Use "set price with version" or model as an event log.
- Forgetting cross-key invariants: CRDTs preserve per-key convergence but not "sum of cart_items.price == cart.total" — that needs a transaction layer.

## interviewTips
- Compare to single-leader: "Single-leader is simpler and gives serializability, but every write pays leader-region latency."
- Name three resolution strategies — LWW, vector-clock merge, CRDT — and one product that uses each.
- Mention the "concurrent != conflicting" distinction: two writes can be concurrent (no happens-before relation) without conflicting (different keys).

## code.python
```python
class GCounter:
    def __init__(self, node_id):
        self.node_id = node_id
        self.counts = {}

    def increment(self, n=1):
        self.counts[self.node_id] = self.counts.get(self.node_id, 0) + n

    def value(self):
        return sum(self.counts.values())

    def merge(self, other):
        for node, count in other.counts.items():
            self.counts[node] = max(self.counts.get(node, 0), count)
```

## code.javascript
```javascript
class GCounter {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.counts = new Map();
  }
  increment(n = 1) {
    this.counts.set(this.nodeId, (this.counts.get(this.nodeId) || 0) + n);
  }
  value() {
    let total = 0;
    for (const v of this.counts.values()) total += v;
    return total;
  }
  merge(other) {
    for (const [node, count] of other.counts) {
      this.counts.set(node, Math.max(this.counts.get(node) || 0, count));
    }
  }
}
```

## code.java
```java
public class GCounter {
    private final String nodeId;
    private final Map<String, Long> counts = new HashMap<>();

    public GCounter(String nodeId) { this.nodeId = nodeId; }

    public void increment(long n) {
        counts.merge(nodeId, n, Long::sum);
    }

    public long value() {
        return counts.values().stream().mapToLong(Long::longValue).sum();
    }

    public void merge(GCounter other) {
        for (var e : other.counts.entrySet()) {
            counts.merge(e.getKey(), e.getValue(), Long::max);
        }
    }
}
```

## code.cpp
```cpp
class GCounter {
    std::string nodeId;
    std::unordered_map<std::string, long> counts;
public:
    GCounter(std::string id) : nodeId(std::move(id)) {}
    void increment(long n = 1) { counts[nodeId] += n; }
    long value() const {
        long s = 0;
        for (auto& [k, v] : counts) s += v;
        return s;
    }
    void merge(const GCounter& other) {
        for (auto& [k, v] : other.counts) {
            counts[k] = std::max(counts[k], v);
        }
    }
};
```
