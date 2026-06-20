---
slug: kruskals-mst
module: graphs-mst
title: Kruskal's Algorithm (MST)
subtitle: Build a minimum spanning tree by greedy edge selection + union-find.
difficulty: Intermediate
position: 4
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
Kruskal's algorithm finds a **minimum spanning tree (MST)** — a subset of edges that connects every vertex with the lowest total weight. The strategy is gloriously simple: sort all edges by weight, then add them one by one, skipping any edge that would create a cycle. The "would create a cycle?" check is what makes union-find indispensable.

## whyItMatters
- **Network design**: laying minimum-cost fibre, water pipelines, electrical grids; the original 1956 Kruskal paper was motivated by AT&T circuit minimisation.
- **Single-linkage hierarchical clustering**: scikit-learn's `linkage(method='single')` is mathematically equivalent to Kruskal's stopped at a chosen edge threshold; same primitive used in scipy `sparse.csgraph.minimum_spanning_tree`.
- **TSP 2-approximation** (Christofides 1976 and the simpler MST-doubling bound) starts from the MST as the structural skeleton.
- **Image segmentation** (Felzenszwalb-Huttenlocher 2004) uses MST-based region merging; ships in OpenCV's `cv::ximgproc`.
- **Phylogenetic tree inference** in bioinformatics (PHYLIP, MEGA) builds minimum spanning forests over taxon distance matrices.
- **Maze generation** in roguelike games uses Kruskal's variant on a grid graph for perfectly connected, single-path mazes.
- Beyond utility, Kruskal's is the canonical interview vehicle for union-find practice — every senior graph interview at Google, Meta, Amazon includes some variant.

## intuition
The algorithm exists because finding the minimum-weight subset of edges that connects all vertices naively requires enumerating spanning trees — Cayley's formula gives n^(n−2) for complete graphs, hopelessly exponential. The escape route is greedy edge selection guided by the *cut property* of MSTs (Tarjan 1983 formalisation): for any partition of vertices into two non-empty sets, the cheapest edge crossing the partition belongs to some MST.

The decisive observation: process edges in non-decreasing weight order. When you consider an edge (u, v) of weight w, one of two things is true. (1) u and v are in different connected components built so far — adding the edge connects them and is safe by the cut property (it is the cheapest edge crossing the cut between u's component and the rest). (2) u and v are in the same component — adding the edge would close a cycle, violating tree-ness, so skip. After processing in order, exactly V − 1 edges are accepted (assuming the graph is connected) and together they form the MST.

The "are u and v in the same component?" check is what makes union-find indispensable. A naive BFS/DFS per edge costs O(E·(V+E)) = O(E²) in the worst case; union-find with path compression and union-by-rank reduces it to O(α(V)) amortised per query — effectively constant. Tarjan & van Leeuwen 1984 proved this is optimal in the pointer-machine model.

The greedy choice rule is monotone in weight, which is why sorting upfront makes Kruskal's correct: at each step, the cheapest still-acceptable edge is provably in some MST. The MST weight is unique even when ties exist; the specific edge set can vary across MSTs but the total cost is invariant. For weight ties, any consistent tie-break (e.g., edge index) gives a valid MST. Total cost: O(E log E) for the sort + O(E·α(V)) for union-find ops = O(E log E).

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
**Technique: Kruskal's greedy edge-sort + union-find cycle detection.** O(E log E) total — dominated by the sort; union-find operations are O(α(V)) amortised per edge, effectively constant. Optimal for the comparison model: sorting is Ω(E log E), and any MST algorithm must inspect every edge to confirm none is excluded by an unseen lighter alternative.

```python
def kruskal(n, edges):
    edges = sorted(edges, key=lambda e: e[2])    # by weight ascending
    dsu = DSU(n)                                  # union-find with path compression + rank
    total = 0
    mst = []
    for u, v, w in edges:
        if dsu.union(u, v):                       # different components: safe to add (cut property)
            total += w
            mst.append((u, v, w))
            if len(mst) == n - 1:                 # spanning tree is complete
                break
    return total, mst
```

Key lines: `edges = sorted(edges, key=lambda e: e[2])` sorts ascending by weight — the entire correctness of Kruskal's depends on processing in non-decreasing weight order. `if dsu.union(u, v)` is the cycle check: `union` returns True iff u and v were in different components, in which case adding the edge is safe (cut property) and unions them. If they were already in the same component, adding would close a cycle and we skip. `if len(mst) == n - 1: break` is the early termination — a spanning tree on n vertices has exactly n − 1 edges; once we have that many, the remaining sort is wasted work.

The DSU class uses path compression (`p[x] = p[p[x]]` during find) and union-by-rank (smaller tree hangs under larger) to achieve O(α(V)) amortised per operation. Forgetting either degrades to O(log V) per op — still fine but measurably slower on adversarial inputs (Tarjan-style worst-case graphs).

**Why not Prim?** Prim's O((V + E) log V) is faster on dense graphs (E ≈ V²) with adjacency-list + heap representation; Kruskal wins on sparse graphs and when edges arrive as a stream (no global vertex enumeration needed). **Why not Borůvka?** Borůvka is O(E log V) too, but is the right pick when edges are distributed across machines or when parallel-friendly structure matters; Kruskal's is the cleanest sequential code. **Why not enumerate spanning trees?** Cayley's formula gives n^(n−2) for complete graphs — exponential. **For directed graphs**, Kruskal does not apply — minimum arborescence requires Edmonds' algorithm (Chu-Liu/Edmonds 1965). **Common bugs**: forgetting path compression (works, but slower); using `<` instead of `≤` for weight comparison (irrelevant — tie-broken arbitrarily, MST weight is invariant); stopping at V − 1 edges before verifying connectivity — if fewer than V − 1 edges are accepted after processing all, the graph is disconnected and you have a minimum spanning *forest*.

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
