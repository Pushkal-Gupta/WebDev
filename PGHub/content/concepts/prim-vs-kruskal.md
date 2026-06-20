---
slug: prim-vs-kruskal
module: graphs-mst
title: Prim vs Kruskal
subtitle: When each MST algorithm wins — dense graphs favor Prim, sparse graphs favor Kruskal.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Minimum Spanning Trees"
    url: "https://algs4.cs.princeton.edu/43mst/"
    type: book
  - title: "Minimum Spanning Tree — cp-algorithms"
    url: "https://cp-algorithms.com/graph/mst_kruskal.html"
    type: blog
  - title: "TheAlgorithms/Python — kruskal.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/kruskal_mst.py"
    type: repo
status: published
---

## intro
A minimum spanning tree (MST) of a weighted connected graph is a tree that touches every vertex with the smallest possible total edge weight. Prim and Kruskal both compute it, both run in roughly O(E log V), and both rely on the cut property — yet they behave very differently in practice. Choosing wrong can mean a 10x slowdown on real-world inputs.

## whyItMatters
- **Telecom / fibre-network planning**: utilities companies and ISPs use MST algorithms to design minimum-cost backbone networks connecting cities, neighbourhoods, and data centres. Choosing Prim vs Kruskal depends on the topology (dense urban grid vs sparse rural runs).
- **Cluster analysis (single-linkage hierarchical clustering)**: equivalent to Kruskal's algorithm on the complete graph of pairwise distances — every clustering library (scipy `linkage`, sklearn `AgglomerativeClustering`) implements one of these under the hood.
- **Image segmentation (Felzenszwalb-Huttenlocher graph-based segmentation, SIGGRAPH 2004)**: builds an MST over pixel-similarity edges, then cuts at large gaps to produce regions. Used in early autonomous-driving perception stacks.
- **Approximate TSP (Christofides 1.5-approximation algorithm)**: starts by constructing an MST and uses its structure as a lower bound. Travelling-salesman heuristics in route-planning services rely on this.
- **Distributed systems (broadcast tree construction, Gossip protocols)**: nodes compute an MST over latency-weighted overlay edges to minimise total broadcast cost.
- **VLSI chip routing**: Steiner-tree variants of MST minimise wire length when laying out integrated circuits — Cadence, Synopsys EDA tools include MST kernels.
- **Interview signal**: Once one MST algorithm is named, the follow-up is almost always "which one and why?". Knowing the exact regime where each wins (Kruskal for sparse, array-based Prim for dense, heap-based Prim for medium) shows you understand asymptotics in context, not just on paper.

The cut property — every safe edge crosses some cut as a minimum-weight edge — underlies both algorithms' correctness and is the unified theoretical foundation worth naming in senior interviews.

## intuition
Both algorithms exploit the same fundamental result — the **cut property**: for any partition of the vertices into two non-empty sets, the lightest edge crossing the cut is in some MST. They differ in how they incrementally identify safe-to-add edges.

**Kruskal** thinks globally. Sort every edge by weight, then walk down the sorted list and accept each edge that connects two currently disjoint components. The union-find data structure (with path compression and union-by-rank) decides connectivity in near-O(1) amortised time per query. Kruskal's MST grows as a forest of disconnected fragments that fuse over time; the final fusion produces the tree. The dominant cost is the sort: O(E log E) = O(E log V) (since E ≤ V²). The union-find passes add O(E α(V)) where α is the inverse Ackermann function — effectively constant for any conceivable input.

**Prim** thinks locally. Start at an arbitrary vertex. Maintain a frontier of "edges from the current tree to vertices outside the tree". Repeatedly: pick the lightest frontier edge, add its non-tree endpoint to the tree, update the frontier with the new edges from that endpoint. Prim's MST grows like a slime mold from a single seed. Implementation choice: with a binary heap as the frontier, each edge is pushed and popped in O(log V), giving O(E log V) total. With an O(V²) adjacency-matrix scan (no heap), each iteration finds the lightest frontier edge in O(V) and updates the key array in O(V), giving O(V²) — strictly better when E approaches V².

The choice between them comes down to graph density:

- **Sparse graphs (E ≈ V, E ≪ V²)**: Kruskal usually wins. The O(E log V) sort is cache-friendly (sequential access), and union-find has tiny constants. Heap-based Prim has the same asymptotic complexity but worse constants (heap operations are pointer-chasing, cache-unfriendly).
- **Dense graphs (E ≈ V²)**: array-based Prim wins. Its O(V²) beats Kruskal's O(V² log V) by a log factor, and the array access pattern is sequential, hitting cache lines well. The heap-based Prim variant degrades to O(V² log V) on dense inputs — worse than the array version.
- **Edge-streaming inputs (external memory, distributed)**: Kruskal handles edges sequentially and doesn't need random access to the graph — natural fit for MapReduce-style processing where edges arrive in batches.
- **Online / incremental MST**: neither Prim nor Kruskal is ideal; you want link-cut trees or Frederickson's data structure, which support edge insertion/deletion in O(log V) per operation.

A third algorithm worth naming in senior interviews: **Borůvka** (1926, predates both Prim and Kruskal). Parallelises naturally — each component identifies its lightest outgoing edge independently in O(E) per phase, with O(log V) phases. Used in modern parallel MST implementations on GPUs and distributed systems.

The connectivity-check failure mode catches everyone once: running either algorithm on a disconnected graph silently returns a spanning forest, not a tree. The standard fix is to assert `|MST| == V - 1` after the algorithm finishes; if it's less, the graph was disconnected. The MST is also non-unique whenever the graph has equal-weight edges — multiple valid MSTs exist, and you must tie-break consistently (typically by edge index) when the grader cares.

## visualization
For Kruskal: sort edges by weight, walk down the list, accept if endpoints are in different components, skip otherwise. The MST appears as disconnected fragments that fuse over time. For Prim: maintain a min-heap keyed by "cheapest known edge from any tree vertex to a non-tree vertex"; pop, add the non-tree endpoint, push its outgoing edges. The MST grows like a slime mold.

## bruteForce
Enumerate all V^(V-2) labeled spanning trees (Cayley's formula) and pick the lightest. Useless beyond V = 6, but it clarifies what MST means: out of an astronomical search space, both Prim and Kruskal find the optimum in near-linear time thanks to the cut property.

## optimal
Match the algorithm to graph density. Kruskal for sparse / streaming; array-based Prim for dense; heap-based Prim for medium density when adjacency-list access is more natural than edge enumeration. All hit O(E log V) or better.

```python
def kruskal(n: int, edges: list[tuple[int, int, int]]) -> tuple[int, list]:
    """Kruskal's MST. edges = [(weight, u, v)]. O(E log V) via sort + union-find."""
    parent = list(range(n))
    rank = [0] * n

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]                 # path compression (one-pass halving)
            x = parent[x]
        return x

    def union(a: int, b: int) -> bool:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False                                  # already connected → would create cycle
        if rank[ra] < rank[rb]: ra, rb = rb, ra           # union by rank: attach shorter to taller
        parent[rb] = ra
        if rank[ra] == rank[rb]: rank[ra] += 1
        return True

    total, mst = 0, []
    for w, u, v in sorted(edges):                         # O(E log E) = O(E log V)
        if union(u, v):
            total += w
            mst.append((u, v, w))
            if len(mst) == n - 1:                         # MST complete; remaining edges unneeded
                break
    return total, mst

def prim_dense(n: int, adj: list[list[int]]) -> int:
    """Prim's MST for dense graphs. adj is V×V matrix; O(V²) total, no heap overhead."""
    INF = float('inf')
    in_mst = [False] * n
    key = [INF] * n                                       # key[v] = lightest edge from MST to v
    key[0] = 0
    total = 0
    for _ in range(n):
        u = -1                                            # find non-MST vertex with smallest key
        for v in range(n):
            if not in_mst[v] and (u == -1 or key[v] < key[u]):
                u = v
        if key[u] == INF:
            return -1                                     # disconnected graph
        in_mst[u] = True
        total += key[u]
        for v in range(n):                                # relax keys for neighbours
            if not in_mst[v] and adj[u][v] < key[v]:
                key[v] = adj[u][v]
    return total

def prim_sparse(n: int, adj_list: list[list[tuple[int, int]]]) -> int:
    """Prim's MST for sparse graphs via binary heap. O(E log V)."""
    import heapq
    in_mst = [False] * n
    heap: list[tuple[int, int]] = [(0, 0)]                # (weight, vertex)
    total = 0
    count = 0
    while heap and count < n:
        w, u = heapq.heappop(heap)
        if in_mst[u]:
            continue                                      # stale entry — already added
        in_mst[u] = True
        total += w
        count += 1
        for nv, nw in adj_list[u]:                        # push unvisited neighbours
            if not in_mst[nv]:
                heapq.heappush(heap, (nw, nv))
    return total if count == n else -1
```

Why optimal: the lower bound for MST on a general weighted graph is Ω(E) — every edge must be examined at least once to know its weight. Kruskal's O(E log V) and heap-based Prim's O(E log V) hit a log factor above the lower bound, and Karger-Klein-Tarjan (1995) proved a randomised O(E) algorithm exists but it's impractical. For dense graphs (E = Θ(V²)), array-based Prim's O(V²) = O(E) hits the lower bound exactly. Both Prim and Kruskal are asymptotically optimal in their target density regimes.

Implementation discipline that distinguishes good MSTs from broken ones: (1) for Kruskal's union-find, path compression *and* union-by-rank are both required to hit near-linear total cost — either alone gives O(log V) per op instead of O(α(V)); (2) for heap-based Prim, use "lazy deletion" (skip stale entries on pop) rather than trying to maintain heap invariants under key-decrease — Python's heapq doesn't support decrease-key efficiently, so lazy deletion is the standard idiom; (3) always check `|MST| == V - 1` after the algorithm to detect disconnected graphs — silent forest-return is a real bug; (4) for dense graphs, the array-based Prim's `for v in range(n)` inner loop is cache-friendly sequential memory access — the heap-based version pointer-chases and is measurably slower despite same asymptotic class; (5) for MST tie-breaking when the problem has multiple valid MSTs, use a deterministic tie-break (edge index, then endpoints in canonical order) so the output is reproducible; (6) Borůvka's algorithm parallelises naturally (each component finds its lightest outgoing edge in parallel, O(log V) phases) — mention at senior level for distributed-systems flavour.

## complexity
time: Kruskal O(E log V); Prim O(E log V) with binary heap, O(V^2) with array on dense graphs.
space: Kruskal O(V) for union-find; Prim O(V + E) for the heap and adjacency lists.
notes: For E ~ V (sparse) Kruskal usually wins because of cache-friendly edge sorting; for E ~ V^2 (dense) array-based Prim wins by avoiding heap overhead.

## pitfalls
- Reaching for Prim's heap version on a dense graph and paying log V per edge — the array version is faster.
- Forgetting that Kruskal requires union-find with path compression *and* union by rank to hit near-linear time.
- Running either algorithm on a disconnected graph and silently returning a forest — check |MST| == V - 1 before claiming success.
- Assuming MST is unique: with equal-weight edges, multiple valid MSTs exist; tie-break consistently when the test grader is picky.

## interviewTips
- Lead with the regime question: "How dense is the graph? E close to V means Kruskal; E close to V^2 means Prim with an array."
- Mention parallelism: Boruvka's algorithm (often paired with Prim/Kruskal in textbooks) parallelizes naturally — bring it up as bonus depth.
- Be ready to prove correctness via the cut property — every safe edge crosses some cut as a minimum-weight edge.

## code.python
```python
def kruskal(n, edges):
    parent = list(range(n))
    rank = [0] * n
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    def union(a, b):
        ra, rb = find(a), find(b)
        if ra == rb: return False
        if rank[ra] < rank[rb]: ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]: rank[ra] += 1
        return True
    total, mst = 0, []
    for w, u, v in sorted(edges):
        if union(u, v):
            total += w; mst.append((u, v, w))
    return total, mst

def prim_dense(n, adj):
    INF = float('inf')
    in_mst = [False] * n
    key = [INF] * n
    key[0] = 0
    total = 0
    for _ in range(n):
        u = -1
        for v in range(n):
            if not in_mst[v] and (u == -1 or key[v] < key[u]): u = v
        if key[u] == INF: return None
        in_mst[u] = True; total += key[u]
        for v in range(n):
            if not in_mst[v] and adj[u][v] < key[v]: key[v] = adj[u][v]
    return total
```

## code.javascript
```javascript
function kruskal(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => {
    let ra = find(a), rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    if (rank[ra] === rank[rb]) rank[ra]++;
    return true;
  };
  edges.sort((a, b) => a[0] - b[0]);
  let total = 0; const mst = [];
  for (const [w, u, v] of edges) if (union(u, v)) { total += w; mst.push([u, v, w]); }
  return [total, mst];
}

function primDense(n, adj) {
  const INF = Infinity;
  const inMst = new Array(n).fill(false);
  const key = new Array(n).fill(INF);
  key[0] = 0; let total = 0;
  for (let i = 0; i < n; i++) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!inMst[v] && (u === -1 || key[v] < key[u])) u = v;
    if (key[u] === INF) return null;
    inMst[u] = true; total += key[u];
    for (let v = 0; v < n; v++) if (!inMst[v] && adj[u][v] < key[v]) key[v] = adj[u][v];
  }
  return total;
}
```

## code.java
```java
import java.util.*;

public int kruskal(int n, int[][] edges) {
    int[] parent = new int[n], rank = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);
    int total = 0;
    for (int[] e : edges) {
        int ra = find(parent, e[0]), rb = find(parent, e[1]);
        if (ra == rb) continue;
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        total += e[2];
    }
    return total;
}
private int find(int[] p, int x) {
    while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }
    return x;
}

public int primDense(int n, int[][] adj) {
    final int INF = Integer.MAX_VALUE / 4;
    boolean[] inMst = new boolean[n];
    int[] key = new int[n];
    Arrays.fill(key, INF); key[0] = 0;
    int total = 0;
    for (int i = 0; i < n; i++) {
        int u = -1;
        for (int v = 0; v < n; v++) if (!inMst[v] && (u == -1 || key[v] < key[u])) u = v;
        if (key[u] == INF) return -1;
        inMst[u] = true; total += key[u];
        for (int v = 0; v < n; v++) if (!inMst[v] && adj[u][v] < key[v]) key[v] = adj[u][v];
    }
    return total;
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

struct DSU {
    vector<int> p, r;
    DSU(int n) : p(n), r(n, 0) { iota(p.begin(), p.end(), 0); }
    int find(int x) { while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; } return x; }
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (r[a] < r[b]) swap(a, b);
        p[b] = a;
        if (r[a] == r[b]) r[a]++;
        return true;
    }
};

int kruskal(int n, vector<tuple<int,int,int>>& edges) {
    sort(edges.begin(), edges.end());
    DSU d(n);
    int total = 0;
    for (auto& [w, u, v] : edges) if (d.unite(u, v)) total += w;
    return total;
}

int primDense(int n, vector<vector<int>>& adj) {
    const int INF = INT_MAX / 4;
    vector<bool> inMst(n, false);
    vector<int> key(n, INF);
    key[0] = 0;
    int total = 0;
    for (int i = 0; i < n; i++) {
        int u = -1;
        for (int v = 0; v < n; v++) if (!inMst[v] && (u == -1 || key[v] < key[u])) u = v;
        if (key[u] == INF) return -1;
        inMst[u] = true; total += key[u];
        for (int v = 0; v < n; v++) if (!inMst[v] && adj[u][v] < key[v]) key[v] = adj[u][v];
    }
    return total;
}
```
