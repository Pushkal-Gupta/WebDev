---
slug: kruskals-mst
module: graphs
title: Kruskal's Algorithm (MST)
subtitle: Build a minimum spanning tree by greedy edge selection + union-find.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
status: published
---

## intro
Kruskal's algorithm finds a **minimum spanning tree (MST)** — a subset of edges that connects every vertex with the lowest total weight. The strategy is gloriously simple: sort all edges by weight, then add them one by one, skipping any edge that would create a cycle. The "would create a cycle?" check is what makes union-find indispensable.

## whyItMatters
MSTs underpin network design (laying cable to connect cities with minimum wire), clustering (single-linkage hierarchical clustering is literally Kruskal's), and approximation algorithms (e.g., the 2-approximation for TSP starts from the MST). Beyond utility, Kruskal's is the standard interview vehicle for **union-find** practice.

## intuition
**Cut property:** for any partition of vertices into two sets, the cheapest edge crossing the partition belongs to some MST. Kruskal's exploits this greedily: the cheapest available edge that doesn't close a cycle is always safe to add. Total MST has exactly `V - 1` edges.

The cycle check needs a union-find / disjoint-set structure: `find(u) == find(v)` means u and v are already in the same component → adding this edge would close a cycle. Otherwise, `union(u, v)` and accept the edge.

## visualization
Vertices A, B, C, D with edges:
- A-B (1), B-C (2), C-D (3), A-C (4), A-D (5), B-D (6)

Sorted by weight: A-B, B-C, C-D, A-C, A-D, B-D.
- A-B (1): A and B in different sets → add. Union.
- B-C (2): different sets → add.
- C-D (3): different sets → add. Now 3 edges = V-1 = 3. Done.

MST weight = 6, edges {A-B, B-C, C-D}.

## bruteForce
Enumerate every spanning tree (combinatorial explosion: Cayley's formula gives n^(n-2) for complete graphs) and pick the minimum. Useless beyond n=6 or so.

A naive cycle check (BFS from u after every candidate edge) gives `O(E²)`. With union-find both `find` and `union` are near-constant (inverse Ackermann), giving `O(E log E)` dominated by the sort.

## optimal
1. **Sort** all edges by weight.
2. Initialize union-find with each vertex in its own set.
3. For each edge `(u, v, w)` in order:
   - If `find(u) != find(v)`: include the edge in the MST and `union(u, v)`.
   - Else: skip (would form a cycle).
4. Stop when `V - 1` edges accepted or all edges exhausted.

If fewer than `V - 1` edges were accepted, the graph isn't connected — there's no spanning tree; you've found a minimum spanning *forest*.

## complexity
time: O(E log E) = O(E log V), dominated by sorting; union-find ops are amortized near-constant via path compression + union-by-rank.
space: O(V + E).
notes: Prim's algorithm is the other classic MST — faster on dense graphs with adjacency-list + heap, `O(E + V log V)`. Kruskal's is preferred for sparse graphs or when edges arrive as a stream.

## pitfalls
- Forgetting path compression on `find()` — without it, union-find degrades to O(log n) per op, still fine but slower.
- Forgetting union-by-rank (or union-by-size) — same penalty.
- Trying to use Kruskal's on a directed graph for "minimum arborescence" — that's a different problem (Edmonds' algorithm).
- Stopping too early — you might accept duplicate-weight edges in an order that's suboptimal for *MST uniqueness*. The MST weight is unique; the edge set isn't.

## interviewTips
- The two-line pitch: "Sort edges by weight; add each if it doesn't close a cycle. Use union-find for the cycle check."
- Mention that **the MST cost is unique** but the MST itself isn't when weights tie.
- For "second-best MST" or "min bottleneck spanning tree," Kruskal's is the launchpad.
- Application name-drop: single-linkage hierarchical clustering, network design, and most textbook approximations for traveling salesman start from an MST.

## code.python
```python
class DSU:
    def __init__(self, n):
        self.p = list(range(n))
        self.r = [0] * n
    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]
            x = self.p[x]
        return x
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb: return False
        if self.r[ra] < self.r[rb]: ra, rb = rb, ra
        self.p[rb] = ra
        if self.r[ra] == self.r[rb]: self.r[ra] += 1
        return True

def kruskal(n, edges):
    """edges: list of (u, v, w). Returns (total_weight, mst_edges)."""
    edges = sorted(edges, key=lambda e: e[2])
    dsu = DSU(n)
    total = 0
    mst = []
    for u, v, w in edges:
        if dsu.union(u, v):
            total += w
            mst.append((u, v, w))
            if len(mst) == n - 1:
                break
    return total, mst
```

## code.javascript
```javascript
class DSU {
  constructor(n) {
    this.p = Array.from({ length: n }, (_, i) => i);
    this.r = new Array(n).fill(0);
  }
  find(x) {
    while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; }
    return x;
  }
  union(a, b) {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.r[ra] < this.r[rb]) [ra, rb] = [rb, ra];
    this.p[rb] = ra;
    if (this.r[ra] === this.r[rb]) this.r[ra]++;
    return true;
  }
}

function kruskal(n, edges) {
  edges.sort((a, b) => a[2] - b[2]);
  const dsu = new DSU(n);
  let total = 0;
  const mst = [];
  for (const [u, v, w] of edges) {
    if (dsu.union(u, v)) {
      total += w;
      mst.push([u, v, w]);
      if (mst.length === n - 1) break;
    }
  }
  return { total, mst };
}
```

## code.java
```java
class DSU {
    int[] p, r;
    DSU(int n) { p = new int[n]; r = new int[n]; for (int i = 0; i < n; i++) p[i] = i; }
    int find(int x) {
        while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }
        return x;
    }
    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (r[ra] < r[rb]) { int t = ra; ra = rb; rb = t; }
        p[rb] = ra;
        if (r[ra] == r[rb]) r[ra]++;
        return true;
    }
}

public int kruskal(int n, int[][] edges) {
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);
    DSU dsu = new DSU(n);
    int total = 0, count = 0;
    for (int[] e : edges) {
        if (dsu.union(e[0], e[1])) {
            total += e[2];
            if (++count == n - 1) break;
        }
    }
    return count == n - 1 ? total : -1; // -1 = graph is not connected
}
```

## code.cpp
```cpp
struct DSU {
    vector<int> p, r;
    DSU(int n) : p(n), r(n, 0) { iota(p.begin(), p.end(), 0); }
    int find(int x) {
        while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }
        return x;
    }
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (r[ra] < r[rb]) swap(ra, rb);
        p[rb] = ra;
        if (r[ra] == r[rb]) r[ra]++;
        return true;
    }
};

long long kruskal(int n, vector<tuple<int,int,int>>& edges) {
    sort(edges.begin(), edges.end(),
         [](auto& a, auto& b){ return get<2>(a) < get<2>(b); });
    DSU dsu(n);
    long long total = 0; int count = 0;
    for (auto& [u, v, w] : edges) {
        if (dsu.unite(u, v)) {
            total += w;
            if (++count == n - 1) break;
        }
    }
    return count == n - 1 ? total : -1;
}
```
