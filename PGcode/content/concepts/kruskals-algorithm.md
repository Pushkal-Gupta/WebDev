---
slug: kruskals-algorithm
module: graphs-mst
title: Kruskal's Algorithm
subtitle: Build a minimum spanning tree by sorting edges and accepting each one that does not form a cycle — O(E log E) with union-find.
difficulty: Intermediate
position: 19
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Minimum Spanning Trees"
    url: "https://algs4.cs.princeton.edu/43mst/"
    type: book
  - title: "cp-algorithms — Kruskal's algorithm"
    url: "https://cp-algorithms.com/graph/mst_kruskal.html"
    type: blog
  - title: "TheAlgorithms/Python — kruskal.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/minimum_spanning_tree_kruskal.py"
    type: repo
status: published
---

## intro
Kruskal's algorithm builds a minimum spanning tree by sorting all edges in ascending order of weight and adding them one by one, skipping any edge whose endpoints are already connected through previously chosen edges. A **union-find** (disjoint-set) data structure makes the connectivity test essentially `O(1)` per query. After exactly `V - 1` successful additions the tree is complete; if you exhaust the edges first, the graph was disconnected. The algorithm is the textbook embodiment of a greedy strategy proved correct by the **cycle property**.

## whyItMatters
- It is the natural algorithm when the input is already an edge list — no need to build adjacency structures.
- It dominates on **sparse graphs**, where `E = O(V)` and sorting cost `O(E log E)` is small.
- It computes the **minimum bottleneck spanning tree** as a side product (the MST always minimises the maximum edge).
- Hierarchical clustering by single-linkage stops Kruskal's after `V - k` merges to produce `k` clusters — the entire `k`-means alternative for "natural" cluster boundaries.
- It is the engine behind **Boruvka's** and many distributed MST algorithms, which generalise the "add cheapest non-cycling edges" pattern.

## intuition
The **cycle property** says: in any cycle of a weighted graph, the **heaviest** edge cannot appear in any MST — replacing it with any other edge of the cycle yields a strictly cheaper spanning structure. Equivalently, among all edges that could form a cycle, the lightest is safe to add. Kruskal's processes edges from lightest to heaviest, so the moment a candidate edge would close a cycle, every other edge in that cycle has already been added and is at most as heavy. Therefore the rejected edge is *the heaviest in its cycle* and must not be in the MST.

Each accepted edge merges two previously disconnected components into one. Tracking which vertices currently sit in which component is exactly the job of a **union-find** structure. `find(u)` returns the representative of `u`'s component; if `find(u) == find(v)`, the edge `(u, v)` would close a cycle and must be skipped; otherwise call `union(u, v)` and add the edge to the MST.

The proof of optimality is the inductive companion of Prim's cut-property proof. Both algorithms are correct for the same reason — they only add edges that the MST theorem (Robert Tarjan's "blue rule" and "red rule") permits. The difference is bookkeeping: Prim's tracks a growing tree, Kruskal's tracks a growing forest that eventually merges into a tree.

## visualization
Graph with 5 vertices:

```
edges (sorted by weight):
   (2, 3, w=1)
   (0, 3, w=2)
   (0, 1, w=3)
   (1, 2, w=4)
   (3, 4, w=5)
   (1, 4, w=6)
```

Process in order:

```
DSU parents: 0->0, 1->1, 2->2, 3->3, 4->4    components = {0}{1}{2}{3}{4}
edge 2-3 w=1: find(2)=2, find(3)=3 -> union -> add. comps = {0}{1}{2,3}{4}
edge 0-3 w=2: find(0)=0, find(3)=2 -> union -> add. comps = {0,2,3}{1}{4}
edge 0-1 w=3: find(0)=0', find(1)=1 -> union -> add. comps = {0,1,2,3}{4}
edge 1-2 w=4: find(1)=0', find(2)=0' -> same -> skip (cycle)
edge 3-4 w=5: find(3)=0', find(4)=4 -> union -> add. comps = {0,1,2,3,4}
done -- 4 edges added (= V - 1)

MST edges: (2,3) (0,3) (0,1) (3,4)   total weight = 1+2+3+5 = 11
```

## bruteForce
Enumerate every subset of edges of size `V - 1`, check connectivity, take the cheapest tree. With `E` edges and binomial blow-up that is `O(C(E, V-1))` — exponential. Even Prim's `O(V^2)` array version dominates this for any non-trivial input.

## optimal
Sort + union-find.

```python
class DSU:
    def __init__(self, n):
        self.p = list(range(n))
        self.r = [0] * n
    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]   # path compression (halving)
            x = self.p[x]
        return x
    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False
        if self.r[rx] < self.r[ry]: rx, ry = ry, rx
        self.p[ry] = rx
        if self.r[rx] == self.r[ry]: self.r[rx] += 1
        return True

def kruskal_mst(n, edges):
    edges.sort(key=lambda e: e[2])      # (u, v, w)
    dsu = DSU(n)
    mst_weight = 0
    mst_edges = []
    for u, v, w in edges:
        if dsu.union(u, v):
            mst_weight += w
            mst_edges.append((u, v, w))
            if len(mst_edges) == n - 1: break
    return mst_weight, mst_edges
```

Early-exit at `n - 1` edges saves work on dense graphs. On a **disconnected** graph the loop ends with `len(mst_edges) < n - 1` — that is the minimum spanning *forest*, often what callers actually want.

## complexity
- **Time**: `O(E log E)` dominated by sorting; the union-find loop is `O(E alpha(V))`, effectively linear.
- **Space**: `O(V + E)` — the DSU and the sorted edge list.
- **Output**: exactly `V - 1` edges if connected; fewer means MSF (minimum spanning forest).
- **Stable** under edge-weight ties: any tie-breaking yields a valid MST.

## pitfalls
- **Forgetting path compression or union by rank.** Without these, `find` is `O(V)` worst case and Kruskal's slows to `O(EV)`. Fix: always implement both DSU optimisations.
- **Sorting in place when the caller needs the edges intact.** `edges.sort()` mutates. Fix: copy the edge list or sort indices.
- **Treating duplicate edges as distinct.** Multi-edges between the same pair waste comparisons; only the cheapest matters. Fix: dedupe with a `min` per `(u, v)` pair before sorting.
- **Assuming the graph is connected.** On disconnected input you produce a forest, not a tree. Fix: report success by `len(mst_edges) == n - 1`, not by "loop finished".

## interviewTips
- Lead with the cycle property to justify correctness — interviewers love seeing the lemma.
- Mention the early-exit at `V - 1` edges; small optimisation, big "you thought about it" signal.
- Pair the discussion with **union-find** path compression + union by rank; that combo is the standard interview follow-up.

## code.python
```python
class DSU:
    def __init__(self, n):
        self.p = list(range(n)); self.r = [0]*n
    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]; x = self.p[x]
        return x
    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False
        if self.r[rx] < self.r[ry]: rx, ry = ry, rx
        self.p[ry] = rx
        if self.r[rx] == self.r[ry]: self.r[rx] += 1
        return True

def kruskal_mst(n, edges):
    edges = sorted(edges, key=lambda e: e[2])
    dsu = DSU(n); w_total = 0; chosen = []
    for u, v, w in edges:
        if dsu.union(u, v):
            chosen.append((u, v, w)); w_total += w
            if len(chosen) == n - 1: break
    return w_total, chosen
```

## code.javascript
```javascript
class DSU {
  constructor(n) { this.p = Array.from({length: n}, (_, i) => i); this.r = new Array(n).fill(0); }
  find(x) { while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; } return x; }
  union(x, y) {
    let rx = this.find(x), ry = this.find(y);
    if (rx === ry) return false;
    if (this.r[rx] < this.r[ry]) [rx, ry] = [ry, rx];
    this.p[ry] = rx;
    if (this.r[rx] === this.r[ry]) this.r[rx]++;
    return true;
  }
}
function kruskalMST(n, edges) {
  edges = edges.slice().sort((a, b) => a[2] - b[2]);
  const dsu = new DSU(n); let total = 0; const chosen = [];
  for (const [u, v, w] of edges) {
    if (dsu.union(u, v)) {
      chosen.push([u, v, w]); total += w;
      if (chosen.length === n - 1) break;
    }
  }
  return { weight: total, edges: chosen };
}
```

## code.java
```java
class DSU {
    int[] p, r;
    DSU(int n) { p = new int[n]; r = new int[n]; for (int i = 0; i < n; i++) p[i] = i; }
    int find(int x) { while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; } return x; }
    boolean union(int x, int y) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return false;
        if (r[rx] < r[ry]) { int t = rx; rx = ry; ry = t; }
        p[ry] = rx; if (r[rx] == r[ry]) r[rx]++;
        return true;
    }
}
public int kruskalMST(int n, int[][] edges) {
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);
    DSU dsu = new DSU(n); int total = 0, count = 0;
    for (int[] e : edges) {
        if (dsu.union(e[0], e[1])) { total += e[2]; if (++count == n - 1) break; }
    }
    return total;
}
```

## code.cpp
```cpp
struct DSU {
    vector<int> p, r;
    DSU(int n) : p(n), r(n, 0) { iota(p.begin(), p.end(), 0); }
    int find(int x) { while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; } return x; }
    bool unite(int x, int y) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return false;
        if (r[rx] < r[ry]) swap(rx, ry);
        p[ry] = rx; if (r[rx] == r[ry]) r[rx]++;
        return true;
    }
};
int kruskalMST(int n, vector<tuple<int,int,int>> edges) {
    sort(edges.begin(), edges.end(),
         [](auto& a, auto& b){ return get<2>(a) < get<2>(b); });
    DSU dsu(n); int total = 0, count = 0;
    for (auto& [u, v, w] : edges) {
        if (dsu.unite(u, v)) { total += w; if (++count == n - 1) break; }
    }
    return total;
}
```
