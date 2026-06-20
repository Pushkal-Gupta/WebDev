---
slug: multi-master-replication
module: sd-storage
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
- **AWS DynamoDB Global Tables**, **Azure Cosmos DB multi-region writes**, **CockroachDB geo-partitioned tables**, **Google Cloud Spanner**, **Riak**, and **Cassandra multi-DC** all offer multi-master semantics in production.
- **Werner Vogels's "Eventually Consistent" piece** (2008) defined the design space; **Dr. Eric Brewer's CAP theorem** and **Daniel Abadi's PACELC** frame the unavoidable trade-offs.
- **The original Dynamo paper** (DeCandia et al., 2007) and **Spanner paper** (Corbett et al., 2012) are the canonical references for the two extremes — AP-leaning vs CP-leaning multi-master.
- **Collaborative editors** (Figma, Notion, Google Docs), **multiplayer games** (Riot's chat infra), and **edge databases** (Fly.io's Postgres, Cloudflare Durable Objects) all need multi-master semantics because local-region write latency is non-negotiable for interactive UX.

## intuition
**Single-leader replication** is simple: one node accepts writes, every replica replays the leader's log. Linearizable, simple to reason about — and every write pays leader-region latency. For globally distributed products (collaborative docs, multiplayer games, edge databases), round-tripping every write to a single leader region adds 100-300 ms of unavoidable latency on every interactive action — unacceptable for UX.

**Multi-master replication** lets every replica accept writes locally, then asynchronously gossip updates to peers. Local write latency drops to microseconds (no cross-region round trip), the system survives a leader-region outage without explicit failover, and writes can keep flowing during a partial WAN partition. The catch: when two regions accept conflicting writes to the same key within milliseconds of each other (faster than gossip can propagate), the system must **detect** and **resolve** the conflict — and the resolution rule determines whether your product feels correct or quietly corrupts user data.

Picture two users in Tokyo and Frankfurt editing the same shared shopping cart. Both add an item at the same millisecond. With single-leader, one waits, one wins — fair, but slow. With multi-master, both writes succeed locally, and the system has to merge them. Merging is easy if the operations **commute** (add to a set, increment a counter — `add(A, B) == add(B, A)`). It is hard if they don't (`set price = X` vs `set price = Y` — order-dependent, one write is lost). The whole engineering challenge is choosing data structures and conflict rules that **make operations commute**, or choosing semantic boundaries where lossy LWW is acceptable.

Three resolution strategies dominate:
1. **Last-Write-Wins (LWW)** by wall-clock or Hybrid Logical Clock timestamp — trivial, lossy, default for many sync engines.
2. **Vector clocks** to detect concurrent writes, then surface conflicts to application code for manual merge (Riak's classic mode).
3. **CRDTs** (Conflict-free Replicated Data Types) — data structures with associative, commutative, idempotent merge functions that converge automatically regardless of order or duplicates.

The **"concurrent != conflicting"** distinction matters: two writes can be concurrent (no happens-before relation per Lamport 1978) without conflicting (different keys, commutative operations on the same key). Only the conflict cases need resolution; concurrent commutative writes converge automatically.

## visualization
Three replicas A, B, C arranged in a triangle, each with bidirectional edges. A receives `set x = 1` at t=10ms; B receives `set x = 2` at t=11ms. Both replicate. At t=50ms all three have logs containing both writes — but in different orders. A resolution rule (last-write-wins by timestamp, vector-clock dominance, or CRDT merge) chooses the final value deterministically so all three converge.

## bruteForce
Last-Write-Wins (LWW): every write carries a wall-clock timestamp; on conflict, the later timestamp wins. Trivial to implement and ships in DynamoDB, Cassandra, and many sync engines. The brute-force failure mode is clock skew — a node with a slightly fast clock silently overwrites correct writes from a node with a correct clock. Add NTP and you reduce skew but never eliminate it, so LWW silently drops writes under load.

## optimal
Two real options for production multi-master systems: **CRDTs** for eventually-consistent fully-decentralized convergence, and **Operational Transformation (OT)** for centrally-coordinated tight-latency collaboration. Pair either with **Hybrid Logical Clocks (HLC)** for causality preservation, **garbage collection** of tombstones once causal stability is reached, and an **explicit consistency boundary** beyond which you accept the limitations.

```python
# CRDT: G-Counter with elementwise-max merge.
class GCounter:
    """Increment-only counter; per-node slots; merge = max per slot."""
    def __init__(self, node_id: str):
        self.node_id = node_id
        self.counts: dict[str, int] = {}

    def increment(self, n: int = 1) -> None:
        self.counts[self.node_id] = self.counts.get(self.node_id, 0) + n

    def value(self) -> int:
        return sum(self.counts.values())

    def merge(self, other: 'GCounter') -> None:
        # max is commutative, associative, idempotent -> any merge order converges.
        for node, count in other.counts.items():
            self.counts[node] = max(self.counts.get(node, 0), count)

# Architectural pattern: every region runs its own DB master + bidirectional replication.
#   Region US: writes go local first, async replicate to EU + AP.
#   Region EU: writes go local first, async replicate to US + AP.
#   Region AP: writes go local first, async replicate to US + EU.
#   Conflict resolution: per-key via the CRDT's merge function.
#   Cross-key invariants: NOT preserved; use a coordinating saga or accept the limit.
```

Why this is right: CRDTs (Shapiro et al. 2011) guarantee **strong eventual consistency** — any two replicas that have observed the same set of operations in any order will converge to bit-identical state, with no coordinator and no locks. Each CRDT class targets a specific operation pattern: **G-Counter / PN-Counter** for counters; **LWW-Register** for single mutable values (with HLC for deterministic tie-breaking); **OR-Set** for add/remove of elements (add-wins semantics); **RGA / Yjs / Automerge** for ordered sequences (collaborative text). Match the CRDT to the operation, and the merge function does the work.

**Production multi-master systems and what they pick**:
- **DynamoDB Global Tables**: LWW with vector-clock-like region tracking; tunable per-key.
- **Azure Cosmos DB multi-region writes**: choice of five consistency levels (strong, bounded-staleness, session, consistent-prefix, eventual); multi-master uses LWW with conflict-resolution policy.
- **Riak**: pure AP, full CRDT support (counter, set, map, register), client-pluggable resolver for non-CRDT values.
- **Cassandra multi-DC**: LWW per cell; no built-in CRDTs (until 4.x's accord transactions).
- **CockroachDB / YugabyteDB**: Spanner-style CP-leaning with HLC; technically multi-master but with global serializable transactions, not eventual consistency.
- **Yjs / Automerge** (in-browser, for collaborative editors): full RGA-based sequence CRDTs; powers Linear, Notion, Figma chat.

**Operational Transformation (OT)** was Google Docs's historical approach: log operations, transform concurrent ops against each other before applying. Lower metadata overhead per op than CRDTs but requires a **central coordinator** (the OT server) to compute the transformation matrix — making it less suitable for fully decentralized scenarios. Google Docs has been migrating to CRDTs since ~2020.

**Hard limits to acknowledge**:
- **Cross-key invariants** ("balance >= 0", "sum of cart_items.price == cart.total") are NOT preserved by CRDTs — each key converges independently. Use a coordinating actor, a saga, or accept the limit at the data model layer.
- **NTP-based LWW silently drops writes** under clock skew of even 50 ms; always pair with HLC or vector clocks. Spanner's TrueTime is the gold standard but requires special hardware.
- **CRDT metadata grows** without GC — OR-Set tombstones accumulate; production systems need causal-stability tracking to reclaim them.
- **Assuming "eventually consistent" means "consistent in a few seconds"** — under load and partition, convergence delay can be minutes. Bound expectations.

**Adjacent patterns**: **Saga** for multi-service workflows with compensating actions; **Outbox** for atomic write-to-DB-plus-publish-to-Kafka; **CDC** (Debezium) for replicating to multi-region read replicas or column stores.

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
