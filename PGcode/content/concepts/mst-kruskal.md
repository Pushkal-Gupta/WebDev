---
slug: mst-kruskal
module: graphs-mst
title: Kruskal's Algorithm (MST)
subtitle: Minimum spanning tree via global edge sort plus union-find cycle detection, O(E log E).
difficulty: Intermediate
position: 17
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
Kruskal's algorithm builds a minimum spanning tree (MST) by sorting *all* edges by weight and greedily adding each edge that does not create a cycle. Cycle detection uses a disjoint-set / union-find structure, which makes the "would adding this edge close a loop?" test effectively O(alpha(V)) per query. Total runtime is dominated by the sort: O(E log E) = O(E log V) since E <= V^2.

## whyItMatters
Kruskal is the **MST algorithm of choice on sparse graphs** and on **edge-list inputs** — exactly the format competitive-programming problems and many real datasets provide. It's also the canonical introductory use of union-find. Bonus: Kruskal's natural by-product is a stream of "MST edges in increasing weight order," which directly drives single-linkage clustering — pause Kruskal after E - k edges have been added to get k clusters.

## intuition
Sort the edges from cheapest to most expensive and walk them in order. For each edge (u, v, w), ask "are u and v already in the same connected component?" If yes, skip — adding the edge would create a cycle and waste weight. If no, accept the edge and *union* the two components. After V - 1 accepted edges, you have a spanning tree, and by the *cut property* of MSTs (cheapest edge across any cut is safe), it's a minimum one.

## visualization
```
Graph: A,B,C,D,E. Edges sorted by weight:
  (A-B, 1)
  (B-C, 2)
  (C-D, 3)
  (A-C, 4)
  (B-D, 5)
  (D-E, 6)
  (C-E, 7)

DSU starts: {A}{B}{C}{D}{E}

(A-B,1):  components differ -> ACCEPT. DSU: {A,B}{C}{D}{E}
(B-C,2):  components differ -> ACCEPT. DSU: {A,B,C}{D}{E}
(C-D,3):  components differ -> ACCEPT. DSU: {A,B,C,D}{E}
(A-C,4):  same component    -> SKIP (cycle)
(B-D,5):  same component    -> SKIP (cycle)
(D-E,6):  components differ -> ACCEPT. DSU: {A,B,C,D,E}
(C-E,7):  same component    -> SKIP (we already have V-1=4 edges; could break early)

MST: {A-B(1), B-C(2), C-D(3), D-E(6)}. Total = 12.
```

## bruteForce
Without union-find, cycle detection per edge takes a DFS or BFS through the current edge set — O(V + E') where E' is edges accepted so far. Across E candidate edges that's O(V * E). For dense graphs you might as well use the V^2 Prim variant. Brute "enumerate spanning trees" is exponential (Cayley's formula gives n^(n-2) trees on K_n) and never a real answer.

## optimal
Sort edges by weight, scan with union-find, accept any edge whose endpoints are in different components. Stop after V - 1 accepts.

```
kruskal(V, edges):
    sort edges by weight ascending
    dsu = DSU(V)
    mst = []
    total = 0
    for (u, v, w) in edges:
        if dsu.find(u) != dsu.find(v):
            dsu.union(u, v)
            mst.append((u, v, w))
            total += w
            if len(mst) == V - 1: break
    return mst, total
```
Use union-by-rank (or by size) plus path compression so that DSU operations are amortized O(alpha(V)) — effectively constant for any conceivable V.

## complexity
time: O(E log E) for the sort, then O(E * alpha(V)) for DSU operations. alpha is the inverse-Ackermann function, < 5 for all practical V. Net: O(E log V).
space: O(V) for the DSU, O(E) for the edge list.
notes: Works whether the graph is connected or not — if disconnected, you get a *minimum spanning forest* with c trees for c components. Kruskal is naturally parallelizable via boruvka-style multi-edge contraction passes; Prim is harder to parallelize.

## pitfalls
- Forgetting path compression *or* union-by-rank — naive DSU can degenerate to O(E * V), turning Kruskal into O(E * V).
- Mutating the edge list in place across multiple Kruskal runs — sort it once and reuse, or pass a copy.
- Treating the input as directed — MST is undirected. If the input is directed, take each edge as a single undirected edge (or use the minimum spanning *arborescence* / Chu-Liu/Edmonds algorithm instead).
- Stopping after the first cycle-skip instead of after V - 1 accepts — early loops skip edges but more accepts may follow.
- Ignoring ties — Kruskal yields *a* MST, not *the* MST when weights tie. Sort with a tiebreaker if you need determinism.

## interviewTips
- Pair the algorithm with its data structure: "Kruskal = edge-sort + union-find. Without DSU, the cycle check dominates."
- Compare to Prim: Kruskal wins on sparse graphs and edge-list input; Prim wins on dense graphs with adjacency lists.
- Mention the cut property and the cycle property as the two correctness pillars — cheapest edge across a cut is safe to add; heaviest edge in a cycle is safe to remove.
- Real-world hooks: single-linkage clustering (stop after V - k accepts to get k clusters), bottleneck spanning tree (Kruskal naturally produces it), minimum-cost network design.

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
    edges_sorted = sorted(edges, key=lambda e: e[2])
    dsu = DSU(n)
    mst, total = [], 0
    for u, v, w in edges_sorted:
        if dsu.union(u, v):
            mst.append((u, v, w))
            total += w
            if len(mst) == n - 1: break
    return mst, total
```

## code.javascript
```javascript
class DSU {
  constructor(n) { this.p = Array.from({length: n}, (_, i) => i); this.r = new Int32Array(n); }
  find(x) { while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; } return x; }
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
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const dsu = new DSU(n);
  const mst = []; let total = 0;
  for (const [u, v, w] of sorted) {
    if (dsu.union(u, v)) {
      mst.push([u, v, w]); total += w;
      if (mst.length === n - 1) break;
    }
  }
  return { mst, total };
}
```

## code.java
```java
import java.util.*;

public class Kruskal {
    static class DSU {
        int[] p, r;
        DSU(int n) { p = new int[n]; r = new int[n]; for (int i = 0; i < n; i++) p[i] = i; }
        int find(int x) { while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; } return x; }
        boolean union(int a, int b) {
            int ra = find(a), rb = find(b);
            if (ra == rb) return false;
            if (r[ra] < r[rb]) { int t = ra; ra = rb; rb = t; }
            p[rb] = ra;
            if (r[ra] == r[rb]) r[ra]++;
            return true;
        }
    }

    public int[] mst(int n, int[][] edges) {
        int[][] sorted = edges.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[2], b[2]));
        DSU dsu = new DSU(n);
        int total = 0, count = 0;
        for (int[] e : sorted) {
            if (dsu.union(e[0], e[1])) {
                total += e[2]; count++;
                if (count == n - 1) break;
            }
        }
        return new int[]{total, count};
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
#include <tuple>
#include <numeric>

struct DSU {
    std::vector<int> p, r;
    DSU(int n) : p(n), r(n, 0) { std::iota(p.begin(), p.end(), 0); }
    int find(int x) { while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; } return x; }
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (r[ra] < r[rb]) std::swap(ra, rb);
        p[rb] = ra;
        if (r[ra] == r[rb]) r[ra]++;
        return true;
    }
};

std::pair<int, std::vector<std::tuple<int,int,int>>> kruskal(int n, std::vector<std::tuple<int,int,int>> edges) {
    std::sort(edges.begin(), edges.end(), [](auto& a, auto& b) {
        return std::get<2>(a) < std::get<2>(b);
    });
    DSU dsu(n);
    std::vector<std::tuple<int,int,int>> mst;
    int total = 0;
    for (auto& [u, v, w] : edges) {
        if (dsu.unite(u, v)) {
            mst.emplace_back(u, v, w);
            total += w;
            if ((int)mst.size() == n - 1) break;
        }
    }
    return {total, mst};
}
```
