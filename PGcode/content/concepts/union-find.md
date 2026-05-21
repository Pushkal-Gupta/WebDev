---
slug: union-find
module: graphs
title: Union-Find (Disjoint Set)
subtitle: Track connected components with near-constant time merges and queries.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
status: published
---

## intro
Union-Find (also called Disjoint Set Union, or DSU) maintains a partition of a set: every element belongs to exactly one disjoint group, and you can ask "are these two in the same group?" or merge two groups in **essentially constant time** when path compression and union-by-rank are used together. The amortized complexity is `O(α(n))` — the inverse Ackermann function — which is < 5 for any conceivable input.

## whyItMatters
Union-Find is the unsung MVP of competitive programming and graph algorithms. Kruskal's MST needs it. Connectivity queries over dynamic edges need it. Offline LCA, cycle detection in undirected graphs, Tarjan's SCC offline variant, percolation simulation, image segmentation, Kruskal's reconstruction tree, Euler tour offline path queries — all built on DSU.

## intuition
Each element points to a "parent." Elements in the same group share a path that eventually reaches the same root. To check "same group?", walk up to the root from each and compare. To merge, link one root to the other.

Two optimizations turn this from O(n) per op into O(α(n)):
- **Path compression** during `find`: as you walk to the root, point every visited node directly at the root. Subsequent queries are O(1).
- **Union by rank** (or size): when merging, attach the shallower tree under the deeper one. Prevents long chains from forming.

Together, they give `O(α(n))` amortized.

## visualization
Start: 6 elements, each its own root. parent[i] = i.

```
union(0, 1): parent = [1, 1, 2, 3, 4, 5]
union(2, 3): parent = [1, 1, 3, 3, 4, 5]
union(0, 2): find(0) → 1; find(2) → 3. Link 1 → 3. parent = [1, 3, 3, 3, 4, 5]
find(0) walks 0 → 1 → 3, then compresses: parent[0] = 3, parent[1] = 3.
```

After compression, every element directly under the root.

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
