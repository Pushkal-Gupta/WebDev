---
slug: disjoint-set-rank
module: graphs
title: Union-Find with Rank + Path Compression
subtitle: Disjoint-set union in O(α(n)) per op — inverse Ackermann, effectively constant. The workhorse for connectivity problems.
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
Union-Find (a.k.a. Disjoint Set Union, DSU) maintains a collection of disjoint sets supporting two operations: **find(x)** = identify the set containing x, **union(x, y)** = merge the sets containing x and y. With **union by rank** (always attach the shorter tree to the taller) and **path compression** (flatten the path on every find), both operations run in O(α(n)) — inverse Ackermann, ≤ 4 for any imaginable n.

## whyItMatters
DSU is the workhorse for connectivity queries:
- **Kruskal's MST** — process edges in sorted order, union endpoints, skip cycle-creating ones.
- **Cycle detection** in undirected graphs.
- **Connected components** count.
- **Network connectivity** — pairs of nodes can communicate iff they're in the same set.
- **Image segmentation** — pixels group by color/connectivity.
- **Account merging** — emails → users → which accounts share data.

Easy to code (~30 LOC), easy to extend (weighted DSU, persistent DSU, link-cut trees later).

## intuition
Each element belongs to a tree; the root identifies the set. `find(x)` walks up to the root. `union(x, y)` first finds both roots, then makes one root a child of the other.

Two optimizations turn O(log n) into effectively O(1):
1. **Union by rank**: attach the tree with smaller rank (or size) under the taller one. Keeps trees shallow.
2. **Path compression**: during `find`, point every visited node directly at the root. Next time, you're already there.

Combined, the amortized cost is O(α(n)) — provably tight (Tarjan 1979).

## visualization
```
Initial:   {1} {2} {3} {4} {5}    (5 singletons)

union(1, 2):       1 ← 2     parent = [1, 1, 3, 4, 5]
union(3, 4):       3 ← 4     parent = [1, 1, 3, 3, 5]
union(1, 3):       1 ← 3 ← 4 parent = [1, 1, 1, 3, 5]
find(4) before compression:  4 → 3 → 1  (depth 2)
find(4) after compression:   4 → 1, also 3 → 1.

union(1, 5): rank decides; attach 5 to 1.
```

## bruteForce
Each set as a list / hashset. `find` is O(n) scanning. `union` is O(n) merging. Quadratic for n ops. DSU beats this asymptotically.

## optimal
```
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n

    def find(self, x):
        # Iterative path compression.
        root = x
        while self.parent[root] != root: root = self.parent[root]
        while self.parent[x] != root:
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False
        if self.rank[rx] < self.rank[ry]: rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]: self.rank[rx] += 1
        self.components -= 1
        return True
```

**Union by size** (alternative to rank): track `size[root]` and attach smaller tree to larger. Equivalent amortized bound.

**Weighted DSU**: store an extra "delta to parent" so you can answer "is x in the same group as y with a known offset?" — used in problems like "expressions with relative values."

**Rollback DSU**: skip path compression to make `union` reversible. Useful in offline algorithms / persistent structures.

## complexity
- **Per op**: O(α(n)) amortized. For all practical n, ≤ 4.
- **Worst-case single op**: O(log n) with one of {rank, path compression}; O(α) with both.
- **Space**: O(n) for parent + rank arrays.

## pitfalls
- **Skipping path compression OR rank/size**: kills the α(n) bound; you get O(log n) per op (still good, but not the proper DSU).
- **Recursive find blowing the stack**: at n = 10^6 with poor unions, recursion can crash. Use iterative path compression.
- **Mixing 0-indexed and 1-indexed**: pick one and stick to it.
- **`union` without checking same-root first**: rare bug, but accidentally counting redundant unions skews the component counter.

## interviewTips
- DSU is the right answer for "are these elements connected?" / "count connected components" / "Kruskal's MST."
- Always mention BOTH optimizations (rank + path compression) — most candidates forget one.
- For "number of provinces / friend circles" problems, DSU is the cleanest answer.
- For senior interviews, mention **link-cut trees** (Sleator-Tarjan) for the online connectivity variant with edge deletions.

## code.python
```python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n
    def find(self, x):
        root = x
        while self.parent[root] != root: root = self.parent[root]
        while self.parent[x] != root:
            self.parent[x], x = root, self.parent[x]
        return root
    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False
        if self.rank[rx] < self.rank[ry]: rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]: self.rank[rx] += 1
        self.components -= 1
        return True

d = DSU(5)
d.union(0, 1); d.union(2, 3); d.union(1, 2)
print(d.components, d.find(3))    # 2, 0 (or whichever root won)
```

## code.javascript
```javascript
class DSU {
  constructor(n) { this.parent = [...Array(n).keys()]; this.rank = new Array(n).fill(0); this.components = n; }
  find(x) {
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root];
    while (this.parent[x] !== root) { const next = this.parent[x]; this.parent[x] = root; x = next; }
    return root;
  }
  union(x, y) {
    let rx = this.find(x), ry = this.find(y);
    if (rx === ry) return false;
    if (this.rank[rx] < this.rank[ry]) [rx, ry] = [ry, rx];
    this.parent[ry] = rx;
    if (this.rank[rx] === this.rank[ry]) this.rank[rx]++;
    this.components--;
    return true;
  }
}
```

## code.java
```java
class DSU {
    int[] parent, rank;
    int components;
    public DSU(int n) { parent = new int[n]; rank = new int[n]; components = n; for (int i = 0; i < n; i++) parent[i] = i; }
    public int find(int x) {
        int root = x;
        while (parent[root] != root) root = parent[root];
        while (parent[x] != root) { int next = parent[x]; parent[x] = root; x = next; }
        return root;
    }
    public boolean union(int x, int y) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return false;
        if (rank[rx] < rank[ry]) { int t = rx; rx = ry; ry = t; }
        parent[ry] = rx;
        if (rank[rx] == rank[ry]) rank[rx]++;
        components--; return true;
    }
}
```

## code.cpp
```cpp
#include <vector>
struct DSU {
    std::vector<int> parent, rank_;
    int components;
    DSU(int n) : parent(n), rank_(n, 0), components(n) { for (int i = 0; i < n; i++) parent[i] = i; }
    int find(int x) {
        int root = x;
        while (parent[root] != root) root = parent[root];
        while (parent[x] != root) { int next = parent[x]; parent[x] = root; x = next; }
        return root;
    }
    bool unite(int x, int y) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return false;
        if (rank_[rx] < rank_[ry]) std::swap(rx, ry);
        parent[ry] = rx;
        if (rank_[rx] == rank_[ry]) rank_[rx]++;
        components--; return true;
    }
};
```
