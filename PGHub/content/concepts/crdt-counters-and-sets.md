---
slug: crdt-counters-and-sets
module: sd-consensus
title: CRDT Counters and Sets
subtitle: G-Counter, PN-Counter, OR-Set, LWW-Element-Set — the four canonical state-based CRDTs that converge without coordination.
difficulty: Advanced
position: 67
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "Shapiro, Preguiça, Baquero, Zawirski — A Comprehensive Study of Convergent and Commutative Replicated Data Types (INRIA TR 7506, 2011)"
    url: "https://hal.inria.fr/inria-00555588"
    type: paper
  - title: "Wikipedia — Conflict-free Replicated Data Type"
    url: "https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type"
    type: docs
  - title: "crdt.tech — CRDT resources, papers, and implementations"
    url: "https://crdt.tech/"
    type: docs
status: published
---

## intro
**CRDTs** — Conflict-free Replicated Data Types — are data structures whose state can diverge across replicas and still merge back to a single consistent value, without any coordination, locking, or consensus. They achieve this by structuring every operation as a join on a mathematical lattice: the merge function is commutative, associative, and idempotent, so replicas can re-order, repeat, and recombine updates in any sequence and land on the same final state. The four canonical building blocks — **G-Counter**, **PN-Counter**, **OR-Set**, **LWW-Element-Set** — cover most real workloads: incrementing metrics, signed counters, shared sets with add and remove, and tombstoned key-value entries.

## whyItMatters
Coordination is expensive. Every Raft round, every Paxos accept, every two-phase commit costs a round-trip — and over a WAN that means hundreds of milliseconds of latency for every write. CRDTs let geo-distributed systems accept writes locally on every replica, sync asynchronously, and still guarantee strong eventual consistency. Riak, Redis Enterprise's Active-Active, Cassandra's lightweight counters, Automerge, Yjs, Roshi, Soundcloud's ledger — all use CRDT counters and sets in production. Knowing the four canonical structures unlocks the design space for any system that has to serve writes from multiple regions without losing data.

## intuition
The mental model: **every CRDT operation is a point on a lattice, and merge is "join" — take the supremum of two points**. A lattice is a partial order where every two elements have a least upper bound. If every update only ever moves the state up the lattice, and merge takes the join, then no matter what order updates arrive in, every replica that has seen the same set of updates lands on exactly the same supremum. Commutative, associative, idempotent — the three properties merge needs — are automatic from this construction.

**G-Counter (Grow-only Counter).** A single integer counter shared by N replicas, supporting only increment. The clever trick: each replica owns its own slot in a vector `c[0..N-1]`. Replica `i` increments by writing `c[i] += 1`. The counter's value is `sum(c)`. To merge two G-Counters, take the elementwise maximum: `merged[i] = max(a[i], b[i])`. Element-wise max is a join because it's commutative and idempotent, and increments on the same replica are monotonic. Every G-Counter operation moves up the lattice; every merge takes the supremum.

**PN-Counter.** G-Counter only grows. To support decrement, keep two G-Counters: `P` for increments, `N` for decrements. Value is `sum(P) - sum(N)`. Merge each component independently as a G-Counter. Decrement by replica `i` is implemented as `N[i] += 1`. No coordination required, no negative-value problems.

**OR-Set (Observed-Remove Set).** Adding a value to a distributed set is easy — every add is monotonic. The hard part is remove. If replica A adds `x` while replica B concurrently removes `x`, what's the merged answer? OR-Set's solution: every add carries a **unique tag** (UUID or `(replica_id, timestamp)` pair). A remove of `x` tombstones only the tags it has *observed*. If A's add-tag arrives at B after B's remove, the new tag survives — `x` is present. This matches user expectation: a concurrent add wins over a remove because the remover did not know about the add.

**LWW-Element-Set.** Simpler than OR-Set: every add and every remove carries a wall-clock timestamp. To check membership, take the latest add-timestamp and the latest remove-timestamp; the element is present iff `add_ts > remove_ts`. Concurrent operations resolve by clock order. Works when reasonable clock sync exists; loses concurrent updates that happen to share a tick.

Each CRDT chooses a different point on the consistency-vs-storage trade. G-Counter is tiny but only grows. PN-Counter doubles state to allow decrement. OR-Set stores a tag per add — large, but never loses data. LWW-Element-Set is small but quietly drops concurrent updates within a clock tick.

## visualization
```
                 G-Counter on 3 replicas (slot vector)
   Replica A:  [3, 0, 0]   --inc--> [4, 0, 0]
   Replica B:  [3, 2, 0]   --inc--> [3, 3, 0]
   Replica C:  [3, 2, 1]

   merge(A, B): elementwise max -> [4, 3, 0]
   merge(_, C): elementwise max -> [4, 3, 1]
   final value = sum = 8
   ────────────────────────────────────────────
                 OR-Set example: concurrent add/remove
   t=0  A: add("x", tag=#a1)  set_A = { x:{#a1} }
   t=0  B: add("x", tag=#b1)  set_B = { x:{#b1} }
   t=1  A: remove("x")        tombstones #a1
        set_A = { x:{}, tombs:{#a1} }
   merge(A, B):
        x's live-tags  = ({#a1} ∪ {#b1}) − {#a1} = {#b1}
        result: x is PRESENT (B's add is unobserved by A's remove)
```

## bruteForce
The naive approach to multi-master replication: pick one replica as "primary", route all writes to it, replicate synchronously to followers. Every write pays a WAN round-trip to the primary; an offline replica cannot accept any write. The slightly less naive approach: let every replica accept writes locally, then resolve conflicts at read time with "last-writer-wins" using wall-clock timestamps. This works for single keys but quietly loses concurrent updates and breaks counters (two replicas increment by 1 each, one wins — you lose an increment). CRDTs are what you get when you redesign the data types so every concurrent operation has a mathematically-defined winner *without losing data*.

## optimal
**State-based vs operation-based.** State-based (CvRDT) CRDTs send the full replica state on sync and merge via a join function. Operation-based (CmRDT) CRDTs send each operation and require reliable broadcast to all replicas. State-based is simpler and what most production systems use; operation-based saves bandwidth when state is large. Both families guarantee strong eventual consistency: any two replicas that have received the same set of updates converge to the same state.

**G-Counter implementation.** State: vector `c[replica_id] -> integer ≥ 0`. `inc(i)`: `c[i] += 1`. `value()`: `sum(c)`. `merge(a, b)`: for each replica `i`, `out[i] = max(a.get(i, 0), b.get(i, 0))`. The lattice is the product of `N` natural-number lattices; join is element-wise max. Each replica owns its slot, so increments never conflict.

**PN-Counter implementation.** State: two G-Counters `P` and `N`. `inc(i)`: `P.inc(i)`. `dec(i)`: `N.inc(i)`. `value()`: `P.value() - N.value()`. `merge(a, b)`: `P = a.P.merge(b.P); N = a.N.merge(b.N)`. The signed count is computed lazily; both halves still grow monotonically.

**OR-Set implementation.** State: a map `elem -> set_of_tags` for live entries, plus a tombstone set of tags for removed entries. `add(x, replica_i)`: generate fresh tag `t = (i, counter_i++)`, `tags[x].add(t)`. `remove(x)`: move all current `tags[x]` into the tombstone set. `contains(x)`: `tags[x] - tombstones is non-empty`. `merge(a, b)`: union tag sets per element, union tombstone sets. Crucially, the tombstone set only contains tags both replicas have already seen, so a concurrent add (with a tag the remover has not observed) survives.

**LWW-Element-Set implementation.** State: two maps, `add_ts: elem -> timestamp` and `remove_ts: elem -> timestamp`. `add(x)`: `add_ts[x] = max(add_ts[x], now())`. `remove(x)`: same for `remove_ts`. `contains(x)`: `add_ts.get(x, -∞) > remove_ts.get(x, -∞)`. `merge(a, b)`: elementwise max of both maps. Bias is a design choice — "add wins on tie" or "remove wins on tie".

**Garbage collection.** OR-Set tombstones grow unbounded. Real implementations either (a) use causal-stability — drop tombstones once *every* replica has acked them, requiring vector clocks; or (b) accept the growth and snapshot periodically. Garbage collection in CRDTs is its own research area; Roshi (SoundCloud's ledger), Akka Distributed Data, and Automerge each ship different strategies.

**Delta-CRDTs.** Sending full state on every sync is wasteful. Delta-CRDTs (Almeida et al.) send only the change since the last sync — a small delta-join — while preserving the lattice properties. Most modern CRDT systems ship delta-state mutators by default.

## complexity
- **G-Counter:** state size `O(N)` where `N` is replica count; `inc` is `O(1)`; `value` and `merge` are `O(N)`.
- **PN-Counter:** state size `O(N)`; same op costs as G-Counter doubled by constant 2.
- **OR-Set:** state size `O(adds + removes)` tags ever issued (until GC); `add`, `remove`, `contains` are `O(1)` amortised; `merge` is `O(tag-count)`.
- **LWW-Element-Set:** state size `O(unique elements)`; all ops `O(1)`. Tradeoff: bias choice (add-wins / remove-wins) is permanent and concurrent updates within one tick are lost.
- **Latency:** all operations local — zero coordination cost. Convergence latency is `≤ anti-entropy sync interval` (seconds to minutes).
- **Message overhead:** state-based CRDTs send `O(state)` per sync; delta-CRDTs send `O(delta)`.

## pitfalls
- **Using LWW for counters.** LWW-register on a counter value loses every increment that did not happen to be the latest write. Use G-Counter or PN-Counter for any numeric aggregation — never store the count as a single register.
- **Sharing a single G-Counter slot across replicas.** The whole trick is that each replica owns its slot. If two replicas write to slot 0, the element-wise max merge discards the smaller value and you lose increments. Slot id MUST be unique per replica, typically the node-id assigned at bootstrap.
- **Forgetting tombstone growth in OR-Set.** Every remove leaves a permanent tag in the tombstone set. A workload that adds-and-removes the same element repeatedly grows tombstones without bound. Either GC via causal stability or switch to LWW if loss-on-concurrent is acceptable.
- **Trusting wall-clock timestamps in LWW.** Even with NTP, two writes within one millisecond can swap order across replicas. Use a hybrid logical clock (HLC) or vector clock as the tag to make LWW deterministic, or accept the loss.
- **Equating CRDT eventual-consistency with strong consistency.** CRDTs converge eventually; a read right after a write can return a stale value if the read goes to a replica that has not synced. For read-your-own-writes semantics, route reads to the same replica that took the write or wait for an explicit sync.
- **Merging CRDTs of different types.** A G-Counter cannot be merged with a PN-Counter; an OR-Set cannot be merged with an LWW-Element-Set. The lattice structure is type-specific. Tag every CRDT instance with its type and reject cross-type merges.

## interviewTips
- **Be precise about "strong eventual consistency".** CRDTs guarantee that any two replicas that have received the same set of updates are in the same state. They do *not* guarantee linearizability or read-your-writes. Stating this distinction shows you know the consistency model.
- **Pick the right CRDT for the question.** Increment-only metrics → G-Counter. Signed counter → PN-Counter. Concurrent add/remove with "add wins" semantics → OR-Set. Latest-update wins on a key → LWW-Element-Set or LWW-Register. Naming the structure cleanly from the workload is the actual question.
- **Mention the production users.** Riak ships all four. Redis Enterprise's Active-Active uses PN-Counter and OR-Set. Akka Distributed Data is the JVM implementation. Yjs and Automerge use OR-Set variants for collaborative editing. Concrete users earn credibility.

## code
### python
```python
# Four canonical CRDTs in pure Python — state-based form.
from collections import defaultdict
import time, uuid

class GCounter:
    def __init__(self): self.c = defaultdict(int)
    def inc(self, replica_id, by=1): self.c[replica_id] += by
    def value(self): return sum(self.c.values())
    def merge(self, other):
        out = GCounter()
        for k in set(self.c) | set(other.c):
            out.c[k] = max(self.c.get(k, 0), other.c.get(k, 0))
        return out


class PNCounter:
    def __init__(self): self.P, self.N = GCounter(), GCounter()
    def inc(self, replica_id, by=1): self.P.inc(replica_id, by)
    def dec(self, replica_id, by=1): self.N.inc(replica_id, by)
    def value(self): return self.P.value() - self.N.value()
    def merge(self, other):
        out = PNCounter()
        out.P = self.P.merge(other.P)
        out.N = self.N.merge(other.N)
        return out


class ORSet:
    def __init__(self):
        self.tags = defaultdict(set)   # elem -> {tag}
        self.tombs = set()             # {tag}
    def add(self, x):
        t = uuid.uuid4()
        self.tags[x].add(t)
        return t
    def remove(self, x):
        self.tombs |= self.tags[x]
        self.tags[x] = set()
    def contains(self, x):
        return bool(self.tags[x] - self.tombs)
    def merge(self, other):
        out = ORSet()
        for x in set(self.tags) | set(other.tags):
            out.tags[x] = self.tags.get(x, set()) | other.tags.get(x, set())
        out.tombs = self.tombs | other.tombs
        return out


class LWWElementSet:
    def __init__(self): self.adds, self.rms = {}, {}
    def add(self, x, ts=None):    self.adds[x] = max(self.adds.get(x, -1), ts or time.time_ns())
    def remove(self, x, ts=None): self.rms[x]  = max(self.rms.get(x, -1),  ts or time.time_ns())
    def contains(self, x):
        return self.adds.get(x, -1) > self.rms.get(x, -1)
    def merge(self, other):
        out = LWWElementSet()
        for k in set(self.adds) | set(other.adds): out.adds[k] = max(self.adds.get(k, -1), other.adds.get(k, -1))
        for k in set(self.rms)  | set(other.rms):  out.rms[k]  = max(self.rms.get(k, -1),  other.rms.get(k, -1))
        return out
```

### javascript
```javascript
class GCounter {
  constructor() { this.c = new Map(); }
  inc(id, by = 1) { this.c.set(id, (this.c.get(id) || 0) + by); }
  value() { return [...this.c.values()].reduce((a, b) => a + b, 0); }
  merge(o) {
    const out = new GCounter();
    for (const k of new Set([...this.c.keys(), ...o.c.keys()]))
      out.c.set(k, Math.max(this.c.get(k) || 0, o.c.get(k) || 0));
    return out;
  }
}

class PNCounter {
  constructor() { this.P = new GCounter(); this.N = new GCounter(); }
  inc(id, by = 1) { this.P.inc(id, by); }
  dec(id, by = 1) { this.N.inc(id, by); }
  value() { return this.P.value() - this.N.value(); }
  merge(o) { const out = new PNCounter(); out.P = this.P.merge(o.P); out.N = this.N.merge(o.N); return out; }
}

class ORSet {
  constructor() { this.tags = new Map(); this.tombs = new Set(); }
  add(x) { const t = crypto.randomUUID(); (this.tags.get(x) || this.tags.set(x, new Set()).get(x)).add(t); return t; }
  remove(x) { const ts = this.tags.get(x) || new Set(); for (const t of ts) this.tombs.add(t); this.tags.set(x, new Set()); }
  contains(x) { const live = [...(this.tags.get(x) || new Set())].filter(t => !this.tombs.has(t)); return live.length > 0; }
  merge(o) {
    const out = new ORSet();
    for (const k of new Set([...this.tags.keys(), ...o.tags.keys()])) {
      out.tags.set(k, new Set([...(this.tags.get(k) || []), ...(o.tags.get(k) || [])]));
    }
    out.tombs = new Set([...this.tombs, ...o.tombs]);
    return out;
  }
}
```

### java
```java
import java.util.*;

class GCounter {
    Map<String, Long> c = new HashMap<>();
    void inc(String id, long by) { c.merge(id, by, Long::sum); }
    long value() { return c.values().stream().mapToLong(Long::longValue).sum(); }
    GCounter merge(GCounter o) {
        GCounter out = new GCounter();
        Set<String> keys = new HashSet<>(c.keySet()); keys.addAll(o.c.keySet());
        for (String k : keys) out.c.put(k, Math.max(c.getOrDefault(k, 0L), o.c.getOrDefault(k, 0L)));
        return out;
    }
}

class PNCounter {
    GCounter P = new GCounter(), N = new GCounter();
    void inc(String id, long by) { P.inc(id, by); }
    void dec(String id, long by) { N.inc(id, by); }
    long value() { return P.value() - N.value(); }
    PNCounter merge(PNCounter o) {
        PNCounter out = new PNCounter();
        out.P = P.merge(o.P); out.N = N.merge(o.N); return out;
    }
}

class ORSet<T> {
    Map<T, Set<UUID>> tags = new HashMap<>();
    Set<UUID> tombs = new HashSet<>();

    UUID add(T x) {
        UUID t = UUID.randomUUID();
        tags.computeIfAbsent(x, k -> new HashSet<>()).add(t);
        return t;
    }
    void remove(T x) {
        Set<UUID> live = tags.getOrDefault(x, Set.of());
        tombs.addAll(live);
        tags.put(x, new HashSet<>());
    }
    boolean contains(T x) {
        Set<UUID> live = new HashSet<>(tags.getOrDefault(x, Set.of()));
        live.removeAll(tombs);
        return !live.isEmpty();
    }
}
```

### cpp
```cpp
#include <unordered_map>
#include <unordered_set>
#include <string>
#include <algorithm>
#include <random>

struct GCounter {
    std::unordered_map<std::string, long long> c;
    void inc(const std::string& id, long long by = 1) { c[id] += by; }
    long long value() const {
        long long s = 0;
        for (auto& [_, v] : c) s += v;
        return s;
    }
    GCounter merge(const GCounter& o) const {
        GCounter out;
        for (auto& [k, v] : c)   out.c[k] = std::max(v, o.c.count(k) ? o.c.at(k) : 0LL);
        for (auto& [k, v] : o.c) out.c[k] = std::max(out.c[k], v);
        return out;
    }
};

struct PNCounter {
    GCounter P, N;
    void inc(const std::string& id, long long by = 1) { P.inc(id, by); }
    void dec(const std::string& id, long long by = 1) { N.inc(id, by); }
    long long value() const { return P.value() - N.value(); }
    PNCounter merge(const PNCounter& o) const { return { P.merge(o.P), N.merge(o.N) }; }
};

struct ORSet {
    std::unordered_map<std::string, std::unordered_set<std::string>> tags;
    std::unordered_set<std::string> tombs;

    std::string add(const std::string& x) {
        static std::mt19937_64 rng{std::random_device{}()};
        std::string t = std::to_string(rng());
        tags[x].insert(t);
        return t;
    }
    void remove(const std::string& x) {
        for (auto& t : tags[x]) tombs.insert(t);
        tags[x].clear();
    }
    bool contains(const std::string& x) const {
        auto it = tags.find(x);
        if (it == tags.end()) return false;
        for (auto& t : it->second) if (!tombs.count(t)) return true;
        return false;
    }
};
```
