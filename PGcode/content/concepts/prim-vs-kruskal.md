---
slug: prim-vs-kruskal
module: graphs
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
MST appears in network design, clustering, image segmentation, and approximate TSP. The "which MST algorithm" question is a near-guaranteed follow-up after asking either by name. Knowing the exact regime where each wins shows you understand asymptotics in context, not just on paper — interviewers value that fluency.

## intuition
Prim grows a single tree outward from a starting vertex, repeatedly adding the lightest edge that touches the tree but stays inside the cut. Kruskal sorts every edge globally and adds the lightest that does not create a cycle, gluing forests together. Prim is a local "next cheapest neighbor" loop; Kruskal is a global "next cheapest edge anywhere" loop with a union-find to police cycles.

## visualization
For Kruskal: sort edges by weight, walk down the list, accept if endpoints are in different components, skip otherwise. The MST appears as disconnected fragments that fuse over time. For Prim: maintain a min-heap keyed by "cheapest known edge from any tree vertex to a non-tree vertex"; pop, add the non-tree endpoint, push its outgoing edges. The MST grows like a slime mold.

## bruteForce
Enumerate all V^(V-2) labeled spanning trees (Cayley's formula) and pick the lightest. Useless beyond V = 6, but it clarifies what MST means: out of an astronomical search space, both Prim and Kruskal find the optimum in near-linear time thanks to the cut property.

## optimal
Kruskal: sort E edges in O(E log E), then O(E * alpha(V)) for the union-find passes — total O(E log V) since log E = O(log V). Best when E is small or already sorted (streaming edges, external memory). Prim with a binary heap: O(E log V). Prim with a Fibonacci heap or O(V^2) adjacency matrix: O(V^2) — strictly better than O(E log V) when E approaches V^2 (dense graphs).

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
