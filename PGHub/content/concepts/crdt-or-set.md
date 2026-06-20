---
slug: crdt-or-set
module: sd-storage
title: Observed-Remove Set (OR-Set CRDT)
subtitle: A conflict-free set where every add carries a unique tag and remove only tombstones the tags it has actually observed.
difficulty: Advanced
position: 32
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Shapiro, Preguiça, Baquero, Zawirski — A Comprehensive Study of Convergent and Commutative Replicated Data Types (INRIA, 2011)"
    url: "https://hal.inria.fr/inria-00555588"
    type: paper
  - title: "Redis — Active-Active geo-distributed databases (CRDB)"
    url: "https://redis.io/docs/latest/operate/rs/databases/active-active/"
    type: docs
  - title: "Riak KV — Convergent Replicated Data Types"
    url: "https://docs.riak.com/riak/kv/latest/developing/data-types/"
    type: docs
status: published
---

## intro
An Observed-Remove Set (OR-Set) is a conflict-free replicated set: every replica accepts adds and removes locally, and any two replicas that have merged the same updates — in any order — converge to the same membership. The trick is tagging. Every add of element `x` produces a unique tag `(x, replicaId, counter)`. A remove of `x` only tombstones the tags it can currently see; tags added later on other replicas survive the merge, so concurrent add-vs-remove resolves as "add wins".

## whyItMatters
A plain replicated set has no good answer for concurrent `add(x)` on one replica and `remove(x)` on another. Last-write-wins by wall-clock silently drops one of them. OR-Sets are the data type that powers Redis Enterprise Active-Active databases, Riak KV's set type, Yjs and Automerge collaborative editors, and the multi-region "shopping cart" example in the original Shapiro INRIA paper — anywhere replicas need to accept writes during a partition and still converge automatically. Without a structure like this, you ship custom merge code per feature and ship bugs with it; OR-Sets give you a single primitive with a published convergence proof. Cassandra's "tombstone" model for deletions is the same idea applied to wide-column rows.

## intuition
A naive replicated set keeps just an element set `S` and ships `add(x)` / `remove(x)` operations. The failure mode is symmetric concurrent updates: replica A does `add(x)` while replica B does `remove(x)` during a partition. When they reconcile, which one wins? Last-write-wins by clock loses one. Union-of-sets makes remove a no-op. Intersection deletes legitimate adds. Nothing works because the operations were treated as opaque commands over an opaque set. The OR-Set's reframe is to attach identity to each individual add. Internally the structure is a set of `(element, tag)` pairs where each tag is a globally unique token — typically `(replicaId, monotonic counter)`. `lookup(x)` checks whether any tag for `x` is alive. `add(x)` mints a fresh tag, never reusing an old one. `remove(x)` does NOT delete `x` from the structure; it collects the set of tags currently observed for `x` and moves them to a per-element tombstone set. Now think about concurrent `add(x)` on A and `remove(x)` on B. B's remove only tombstones the tags B can see — say tag `(B, 7)`. A's concurrent add mints tag `(A, 4)`, which B has never observed. On merge, both tags arrive at both replicas; the live set is `{(A,4)}` minus the tombstoned `{(B,7)}` — `x` survives. This is the "add wins" semantics, and it falls out of the structure rather than being patched on. Symmetric `remove(x)` and `add(x)` on the SAME tag — impossible, because the add must precede on the same replica, so the tag is observed and gets tombstoned. The convergence proof rests on three properties: the merged state is the union of the two `(elements, tombstones)` pairs, this union is commutative and associative, and idempotent because seeing the same tag twice changes nothing. That's the CRDT formal definition. Garbage collection is the practical wart — tombstones accumulate forever unless you compact them when all replicas have observed the remove, usually via a vector clock or causal-stability watermark.

## visualization
```
Replica A                       Replica B
add("x")                        add("y")
  alive: {(x, A1)}                alive: {(y, B1)}
  graves: {}                      graves: {}

         <-- partition heals -->

merge: alive = {(x,A1), (y,B1)}   graves = {}

Now A does remove("x"); B concurrently does add("x"):
A: alive {(y,B1)}    graves {(x,A1)}
B: alive {(x,A1), (y,B1), (x,B2)} graves {}

merge: alive = {(y,B1), (x,B2)}  graves = {(x,A1)}
       lookup("x") -> TRUE  (B2 is alive)
```

## bruteForce
"Just use a single primary, route every write to it." Solves convergence by removing the problem — but loses multi-region write availability and adds an inter-region round trip to every mutation. Acceptable for low-write systems; ruled out when you need <50ms writes in three continents or offline-first editing on flaky connections.

## optimal
The OR-Set ships as either an op-based CRDT (broadcast each `add(x)` / `remove(x, tagSet)` operation reliably-at-least-once to all replicas, with the remove carrying the exact set of tags it observed) or a state-based CRDT (each replica holds the full `(alive, tombstoned)` structure and ships the whole state; merge is component-wise union). State-based is simpler to reason about and tolerates message loss; op-based is bandwidth-efficient. Production systems blend the two: anti-entropy via state shipping on reconnect, op streaming during steady state. Tag generation is `(replicaId, localCounter)` — replicaId can be a UUID, localCounter just monotonically increases. The pair is unique forever without coordination. Garbage collection compacts tombstones once every replica has acknowledged a watermark — Riak runs this on a configurable interval, Redis CRDB uses vector-clock causal stability. The convergence guarantee is formally: for any sequence of operations applied to any subset of replicas, merging all replica states produces the same result regardless of merge order. This is strong eventual consistency — strictly weaker than linearizability, strictly stronger than "we lose data sometimes". The cost is memory proportional to the number of distinct adds ever performed, which the GC compacts back down once removes are causally stable.

```python
class ORSet:
    """Add-wins observed-remove set. Tags = (replicaId, counter) pairs."""
    def __init__(self, replica_id: str) -> None:
        self.replica_id = replica_id
        self._counter = 0
        self.alive = set()      # {(element, replicaId, counter)}
        self.tombstones = set() # same shape

    def _mint(self):
        self._counter += 1
        return (self.replica_id, self._counter)

    def add(self, x):
        self.alive.add((x, *self._mint()))

    def remove(self, x):
        observed = {tag for tag in self.alive if tag[0] == x}
        self.tombstones |= observed
        self.alive -= observed

    def lookup(self, x) -> bool:
        return any(tag[0] == x for tag in self.alive if tag not in self.tombstones)

    def merge(self, other: "ORSet") -> None:
        self.alive = (self.alive | other.alive) - (self.tombstones | other.tombstones)
        self.tombstones |= other.tombstones
```

## complexity
- `add`: O(1) amortized. `remove`: O(k) where k = current tags for the element. `lookup`: O(k) with the element-indexed variant; O(n) on the flat structure shown above (use a `dict[element, set[tag]]` in production).
- `merge`: O(|A| + |B|) over the two tombstone+alive sets. Memory grows with total distinct adds until GC; with causal-stability GC, memory tracks live cardinality plus an in-flight-removes buffer.
- Compared with a state-based G-Set (grow-only) which is O(1) per op but cannot remove, OR-Set's price for the remove operation is the tombstone bookkeeping.

## pitfalls
- **Reusing tags across replicas.** The convergence proof assumes globally unique tags. Two replicas minting `(replicaId, 1)` for different elements collide silently — once one replica's id is duplicated (cloning a VM image, restoring from snapshot without resetting state), data corrupts in a way that survives merge. Fix: assign a fresh UUID at first boot and persist it.
- **Forgetting to ship tombstones on merge.** A common bug in state-based implementations is unioning only the `alive` set across replicas. Without the tombstone union, removes silently revert when an old replica's state arrives later. Fix: always merge both components and re-apply the tombstone difference.
- **Letting tombstones grow forever.** Without GC, memory grows linearly with total removes ever performed. A high-churn cache loaded with OR-Set semantics will OOM after weeks. Fix: run a periodic GC pass that drops tombstones older than the causal-stability watermark (the max timestamp every replica has acknowledged).
- **Treating OR-Set semantics as "remove wins".** Concurrent add and remove of the same element resolves as add. If your product UX requires remove-wins (e.g. a block-list), use a different CRDT (2P-Set, or LWW-Set with appropriate ordering) — patching OR-Set with a "really delete" flag breaks the convergence proof.
- **Assuming OR-Set gives strong consistency.** It gives *strong eventual* consistency: replicas converge after they've seen the same ops, but a reader may observe a stale state mid-merge. Don't rely on it for invariants that need a global view (e.g. "no two users can have the same username") — use a coordination primitive (Raft, Paxos) for those.

## interviewTips
- **Lead with "add wins" as the semantics, then derive the structure.** Interviewers care that you can name the conflict resolution policy and explain why it falls out of the design rather than being patched on.
- **Compare with G-Set, 2P-Set, and LWW-Element-Set explicitly.** OR-Set is the canonical example because it's the smallest CRDT that handles concurrent remove cleanly. Mentioning the family shows breadth.
- **Volunteer the tombstone GC question.** This is the production wart, and surfacing it before the interviewer probes signals real implementation experience. Reference Redis CRDB's causal stability or Riak's reap interval as concrete answers.

## code
### python
```python
class ORSet:
    def __init__(self, replica_id: str) -> None:
        self.replica_id = replica_id
        self._counter = 0
        self.alive = set()
        self.tombstones = set()

    def _mint(self) -> tuple:
        self._counter += 1
        return (self.replica_id, self._counter)

    def add(self, x) -> None:
        self.alive.add((x, *self._mint()))

    def remove(self, x) -> None:
        observed = {tag for tag in self.alive if tag[0] == x}
        self.tombstones |= observed
        self.alive -= observed

    def lookup(self, x) -> bool:
        live = self.alive - self.tombstones
        return any(tag[0] == x for tag in live)

    def merge(self, other: "ORSet") -> None:
        tombs = self.tombstones | other.tombstones
        self.alive = (self.alive | other.alive) - tombs
        self.tombstones = tombs
```

### javascript
```javascript
class ORSet {
  constructor(replicaId) {
    this.replicaId = replicaId;
    this.counter = 0;
    this.alive = new Set();      // serialized "elem|replica|counter" keys
    this.tombstones = new Set();
  }
  _mint() { this.counter += 1; return `${this.replicaId}|${this.counter}`; }
  _key(elem, tag) { return `${elem}|${tag}`; }

  add(x) { this.alive.add(this._key(x, this._mint())); }

  remove(x) {
    const prefix = `${x}|`;
    for (const k of this.alive) {
      if (k.startsWith(prefix)) { this.tombstones.add(k); this.alive.delete(k); }
    }
  }

  lookup(x) {
    const prefix = `${x}|`;
    for (const k of this.alive) if (k.startsWith(prefix) && !this.tombstones.has(k)) return true;
    return false;
  }

  merge(other) {
    for (const k of other.tombstones) this.tombstones.add(k);
    for (const k of other.alive) if (!this.tombstones.has(k)) this.alive.add(k);
    for (const k of this.tombstones) this.alive.delete(k);
  }
}
```

### java
```java
import java.util.*;

public class ORSet<T> {
    private final String replicaId;
    private long counter = 0;
    private final Set<String> alive = new HashSet<>();
    private final Set<String> tombstones = new HashSet<>();

    public ORSet(String replicaId) { this.replicaId = replicaId; }

    private String mint() { return replicaId + ":" + (++counter); }
    private String key(T x, String tag) { return x.toString() + "|" + tag; }

    public void add(T x) { alive.add(key(x, mint())); }

    public void remove(T x) {
        String prefix = x.toString() + "|";
        Iterator<String> it = alive.iterator();
        while (it.hasNext()) {
            String k = it.next();
            if (k.startsWith(prefix)) { tombstones.add(k); it.remove(); }
        }
    }

    public boolean lookup(T x) {
        String prefix = x.toString() + "|";
        for (String k : alive) if (k.startsWith(prefix) && !tombstones.contains(k)) return true;
        return false;
    }

    public void merge(ORSet<T> other) {
        tombstones.addAll(other.tombstones);
        for (String k : other.alive) if (!tombstones.contains(k)) alive.add(k);
        alive.removeAll(tombstones);
    }
}
```

### cpp
```cpp
#include <string>
#include <unordered_set>

class ORSet {
    std::string replicaId;
    long long counter = 0;
    std::unordered_set<std::string> alive_;
    std::unordered_set<std::string> tombstones_;

    std::string mint() { return replicaId + ":" + std::to_string(++counter); }
    std::string key(const std::string& x, const std::string& tag) { return x + "|" + tag; }

public:
    explicit ORSet(std::string id) : replicaId(std::move(id)) {}

    void add(const std::string& x) { alive_.insert(key(x, mint())); }

    void remove(const std::string& x) {
        std::string prefix = x + "|";
        for (auto it = alive_.begin(); it != alive_.end(); ) {
            if (it->rfind(prefix, 0) == 0) { tombstones_.insert(*it); it = alive_.erase(it); }
            else ++it;
        }
    }

    bool lookup(const std::string& x) const {
        std::string prefix = x + "|";
        for (const auto& k : alive_)
            if (k.rfind(prefix, 0) == 0 && !tombstones_.count(k)) return true;
        return false;
    }

    void merge(const ORSet& other) {
        for (const auto& k : other.tombstones_) tombstones_.insert(k);
        for (const auto& k : other.alive_) if (!tombstones_.count(k)) alive_.insert(k);
        for (const auto& k : tombstones_) alive_.erase(k);
    }
};
```
