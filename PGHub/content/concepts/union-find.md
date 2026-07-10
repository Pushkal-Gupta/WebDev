---
slug: union-find
module: graphs-union-find
title: Union-Find (Disjoint Set)
subtitle: Track connected components with near-constant time merges and queries.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Part VI: Graph Algorithms (walkccc notes)"
    url: "https://walkccc.me/CLRS/"
    type: book
  - title: "cp-algorithms — Graph algorithms"
    url: "https://cp-algorithms.com/graph/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — graphs/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/graphs"
    type: repo
status: published
---

## intro
Union-Find (also called Disjoint Set Union, or DSU) maintains a partition of a set: every element belongs to exactly one disjoint group, and you can ask "are these two in the same group?" or merge two groups in **essentially constant time** when path compression and union-by-rank are used together. The amortized complexity is `O(α(n))` — the inverse Ackermann function — which is < 5 for any conceivable input.

## whyItMatters
Union-Find is the unsung MVP of competitive programming and graph algorithms. Kruskal's MST needs it. Connectivity queries over dynamic edges need it. Offline LCA, cycle detection in undirected graphs, Tarjan's SCC offline variant, percolation simulation, image segmentation, Kruskal's reconstruction tree, Euler tour offline path queries — all built on DSU.

## intuition
Each element points to a "parent." Elements in the same group share a path that eventually reaches the same root. To check "same group?", walk up to the root from each and compare. To merge, link one root to the other.

Physically, picture each group as an upside-down tree of people all holding a rope that dangles down to one leader standing at the bottom — the root. To find out who leads you, you follow your rope hand-over-hand until you reach whoever holds no rope of their own; that person is the root. Two people are in the same group exactly when they arrive at the same leader. Merging two groups is just handing one leader's rope to the other leader — a single pointer change at the top, no matter how many people hang below.

The danger is that naive linking can grow tall, stringy trees where finding the root means climbing a long chain. The two optimizations are the fixes. **Path compression** during `find`: as you walk to the root, point every visited node directly at the root (or, in the halving variant, at its grandparent). Next time those nodes ask, the climb is nearly gone. **Union by rank** (or size): when merging, attach the shallower tree under the deeper one, so the taller tree's height never grows. Prevents long chains from forming in the first place.

A concrete micro-example on `n = 5`. Start `parent = [0,1,2,3,4]`, everyone their own leader. `union(0,1)` links root 0 under root 1 (or vice versa) — say `parent[0]=1`. `union(2,3)` gives `parent[2]=3`. Now `union(1,3)` links the two two-element groups: `find(1)=1`, `find(3)=3`, attach `parent[1]=3`. Ask `connected(0,2)`: `find(0)` climbs 0 -> 1 -> 3 (and compresses so `parent[0]=3`), `find(2)` climbs 2 -> 3, both land on 3, so yes. After that one query, node 0 points straight at the root, and every future `find(0)` is a single hop.

Together, path compression and union by rank give `O(α(n))` amortized.

## visualization
Start: 6 elements, each its own root. parent[i] = i.

State table tracing parent[] and rank[] after each operation (union by rank + path compression). Indices are 0..5; the survivor root is the higher-rank side:
```
   op            parent[]              rank[]            note
   ----------    ------------------    ---------------   ---------------------------
   init          [0, 1, 2, 3, 4, 5]    [0, 0, 0, 0, 0, 0]  each element its own root
   union(0, 1)   [1, 1, 2, 3, 4, 5]    [0, 1, 0, 0, 0, 0]  tie -> root 1, rank[1]=1
   union(2, 3)   [1, 1, 3, 3, 4, 5]    [0, 1, 0, 1, 0, 0]  tie -> root 3, rank[3]=1
   union(4, 5)   [1, 1, 3, 3, 5, 5]    [0, 1, 0, 1, 0, 1]  tie -> root 5, rank[5]=1
   union(0, 2)   [1, 3, 3, 3, 5, 5]    [0, 1, 0, 2, 0, 1]  equal rank -> root 3, +1
   find(0)       [3, 3, 3, 3, 5, 5]    [0, 1, 0, 2, 0, 1]  climb 0->1->3, compress
   connected(0,2)[3, 3, 3, 3, 5, 5]    [0, 1, 0, 2, 0, 1]  find(0)=3, find(2)=3 -> true
```

Notice how `find(0)` rewired `parent[0]` from 1 straight to 3: after compression, every element it touched sits directly under the root, so the next query is a single hop.

## bruteForce
Naive: linear scan to find each element's "group label," update everyone on union. O(n) per op. Useless beyond 1000 elements.

Tree with no optimizations: O(n) worst case for `find` (degenerates to a linked list under adversarial unions).

## optimal
```
parent[i] = i        // every element its own root
rank[i] = 0

find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]   // path compression (halving variant)
        x = parent[x]
    return x

union(a, b):
    ra = find(a); rb = find(b)
    if ra == rb: return False        # already same group
    # union by rank
    if rank[ra] < rank[rb]: ra, rb = rb, ra
    parent[rb] = ra
    if rank[ra] == rank[rb]: rank[ra] += 1
    return True
```

`union-by-size` (tracking subtree size instead of rank) is equivalent in performance and slightly easier to reason about. Path-compression *halving* (above) is simpler to write than full recursive compression and equally fast in practice.

**Why it is correct.** Correctness rests on one invariant: `find(x)` always returns the unique representative of `x`'s set, and two elements return the same representative if and only if some chain of unions has connected them. `find` preserves this because rewiring a node to point at its grandparent never changes which root the climb ultimately reaches — it only shortens the path. `union` preserves it because linking one root beneath another merges exactly the two sets and leaves all others untouched; the early `if ra == rb: return False` guard avoids linking a root to itself, which would create a cycle and break the "walk up to a root" premise.

**The key invariant behind the speed.** With union by rank, a root of rank `r` is the root of a subtree containing at least `2^r` nodes. Since there are only `n` nodes, no rank ever exceeds `log2(n)`, so every tree stays shallow even before compression touches it. Rank only increments when two equal-rank roots merge, which is why it climbs so slowly.

**Step-by-step.** Initialize each element as its own root with rank 0. To test membership, run `find` on both and compare roots. To merge, find both roots; if they already match, do nothing; otherwise attach the lower-rank root beneath the higher-rank one, breaking ties by bumping the survivor's rank.

**Complexity intuition.** Union by rank caps tree height at `O(log n)`; path compression then flattens the paths that `find` actually traverses, so repeated queries amortize away almost all of that height. The combined amortized cost per operation is the inverse Ackermann `O(α(n))`, which is at most 4 or 5 for any `n` that fits in the universe — effectively constant.

## complexity
time: O(α(n)) per `find` or `union`, amortized — practically constant.
space: O(n) — two parallel arrays.
notes: Without path compression, just union-by-rank, ops are O(log n). Without union-by-rank, just path compression, ops are O(log n) amortized. With both, O(α(n)).

## pitfalls
- Forgetting to compare roots (not raw values) when comparing membership: `find(a) == find(b)`, not `a == b`.
- Recursing in `find` on huge inputs causes stack overflow. Iterate.
- Mixing union-by-rank with union-by-size in the same DSU — pick one.
- Trying to support **deletion** of edges or splits — vanilla DSU is union-only. Offline algorithms get around this with time-traveling DSU (Sleator-Tarjan link-cut trees, or "DSU with rollback" for divide-and-conquer over time).
- For *weighted* DSU (where each element stores a value relative to its root, e.g., Codeforces 1217 "DSU with potentials"), don't forget to update the potential during path compression.

## interviewTips
- The minute the interviewer says "connected components" with edges arriving online: this is DSU.
- For "redundant connection" / "minimum spanning tree" / "graph valid tree" / "number of provinces": DSU.
- For "accounts merge" (LeetCode 721): DSU on email→user, then group.
- Mention `α(n) < 5` confidently; most candidates pretend it's `log n`.

## code.python
```python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n

    def find(self, x):
        # Path-compression with halving
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.rank[ra] < self.rank[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        if self.rank[ra] == self.rank[rb]:
            self.rank[ra] += 1
        self.components -= 1
        return True

    def connected(self, a, b):
        return self.find(a) == self.find(b)
```

## code.javascript
```javascript
class DSU {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.components = n;
  }
  find(x) {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a, b) {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra]++;
    this.components--;
    return true;
  }
  connected(a, b) { return this.find(a) === this.find(b); }
}
```

## code.java
```java
class DSU {
    private final int[] parent;
    private final int[] rank;
    public int components;
    public DSU(int n) {
        parent = new int[n];
        rank = new int[n];
        components = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    public int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
    public boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        components--;
        return true;
    }
    public boolean connected(int a, int b) { return find(a) == find(b); }
}
```

## code.cpp
```cpp
struct DSU {
    vector<int> parent, rnk;
    int components;
    DSU(int n) : parent(n), rnk(n, 0), components(n) {
        iota(parent.begin(), parent.end(), 0);
    }
    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (rnk[ra] < rnk[rb]) swap(ra, rb);
        parent[rb] = ra;
        if (rnk[ra] == rnk[rb]) rnk[ra]++;
        components--;
        return true;
    }
    bool connected(int a, int b) { return find(a) == find(b); }
};
```
