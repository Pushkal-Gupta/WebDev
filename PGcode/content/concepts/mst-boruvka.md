---
slug: mst-boruvka
module: graphs
title: Borůvka's MST
subtitle: Each iteration picks the cheapest edge out of every component — parallel-friendly and halves components per round.
difficulty: Advanced
position: 1
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Minimum Spanning Tree — Borůvka's Algorithm — cp-algorithms"
    url: "https://cp-algorithms.com/graph/mst_boruvka.html"
    type: blog
  - title: "Borůvka's Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/boruvkas-algorithm-greedy-algo-9/"
    type: blog
  - title: "TheAlgorithms/Python — boruvka.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/boruvka.py"
    type: repo
status: published
---

## intro
Borůvka's algorithm builds a minimum spanning tree by repeatedly contracting the cheapest outgoing edge from every connected component simultaneously. Each phase at least halves the number of components, so the algorithm terminates in O(log V) phases and runs in O(E log V) overall — and unlike Kruskal or Prim, every component decides its move independently, making it the textbook parallel-friendly MST.

## whyItMatters
Borůvka predates both Kruskal and Prim (1926, originally for electrifying Moravia) and is the foundation of the fastest known MST algorithms — the Karger-Klein-Tarjan randomized linear-time MST is essentially Borůvka with sampling. It's also the right pick when edges are distributed across machines or when you can parallelize per-component work; on graphs with structure (planar, bounded genus) it runs in linear time without modification.

## intuition
For every component, the cheapest edge leaving it must be in some MST (cut property). So run the cut property in parallel: every component looks at all its outgoing edges, picks the cheapest, and you union the endpoints. After one phase, every component absorbs at least one neighbor, so the component count at most halves. Repeat until only one component remains — the chosen edges form the MST.

## visualization
Six vertices, edges with weights: (1,2,1), (2,3,2), (3,4,3), (4,5,4), (5,6,5), (6,1,6), (2,5,7). Phase 1: every singleton's cheapest edge is the smallest incident — 1 picks (1,2,1), 2 picks (1,2,1), 3 picks (2,3,2), 4 picks (3,4,3), 5 picks (4,5,4), 6 picks (5,6,5). After dedup and union: {1,2,3,4,5,6} all merge into one component. MST = {1,2,3,4,5} with total weight 15. One phase, done.

## bruteForce
Run Kruskal-style: sort all E edges, then for each edge check if its endpoints are already connected and skip if so. O(E log E) — already optimal in the comparison model. The "brute" version of Borůvka itself would rescan every edge for every component every phase, costing O(E * V) — strictly worse than the standard implementation.

## optimal
Maintain a union-find over V vertices. Repeat: for each component, find the cheapest edge whose endpoints lie in different components by scanning all E edges once and keeping `cheapest[root]` per component. Add each chosen edge to the MST (skip duplicates), union its endpoints. Loop until no edges are chosen in a phase (graph already a single component or disconnected). Each phase is O(E + V * α(V)); at most log V phases.

## complexity
time: O(E log V)
space: O(V) union-find + O(E) edge list
notes: For dense graphs E = Θ(V^2), Prim with a Fibonacci heap is asymptotically better. For sparse or distributed graphs Borůvka shines. On a planar graph each phase removes a constant fraction of edges via contraction, yielding O(E) total — the classic linear-time MST for planar graphs.

## pitfalls
- Forgetting to break ties on edge weight — two components can both claim the same edge from different sides, and without a consistent tie-break you double-count it. Use edge index as the tie-breaker.
- Adding the chosen edge before checking the union — a phase where two components both chose the same edge will count its weight twice.
- Stopping when components > 1 instead of when "no edge was added this phase" — the graph might be disconnected and you'd loop forever.
- Resetting `cheapest[]` only at start instead of every phase — stale picks corrupt the next iteration.

## interviewTips
- Frame it as "the parallel MST" — interviewers asking distributed-systems questions often want to hear Borůvka.
- Cite the cut property explicitly: "The cheapest edge out of any component is safe; Borůvka exploits this for all components at once."
- If pressed for the fastest MST, name Karger-Klein-Tarjan (randomized linear) — it's Borůvka phases plus random sampling.

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
        a, b = self.find(a), self.find(b)
        if a == b: return False
        if self.r[a] < self.r[b]: a, b = b, a
        self.p[b] = a
        if self.r[a] == self.r[b]: self.r[a] += 1
        return True

def boruvka_mst(n, edges):
    dsu = DSU(n)
    mst_weight = 0
    mst_edges = []
    components = n
    while components > 1:
        cheapest = [-1] * n
        for i, (u, v, w) in enumerate(edges):
            ru, rv = dsu.find(u), dsu.find(v)
            if ru == rv: continue
            if cheapest[ru] == -1 or edges[cheapest[ru]][2] > w: cheapest[ru] = i
            if cheapest[rv] == -1 or edges[cheapest[rv]][2] > w: cheapest[rv] = i
        added = False
        for i in cheapest:
            if i == -1: continue
            u, v, w = edges[i]
            if dsu.union(u, v):
                mst_weight += w
                mst_edges.append(i)
                components -= 1
                added = True
        if not added: break
    return mst_weight, mst_edges
```

## code.javascript
```javascript
class DSU {
  constructor(n) { this.p = [...Array(n).keys()]; this.r = new Array(n).fill(0); }
  find(x) { while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; } return x; }
  union(a, b) {
    a = this.find(a); b = this.find(b);
    if (a === b) return false;
    if (this.r[a] < this.r[b]) [a, b] = [b, a];
    this.p[b] = a;
    if (this.r[a] === this.r[b]) this.r[a]++;
    return true;
  }
}

function boruvkaMst(n, edges) {
  const dsu = new DSU(n);
  let mstWeight = 0, components = n;
  const mstEdges = [];
  while (components > 1) {
    const cheapest = new Array(n).fill(-1);
    for (let i = 0; i < edges.length; i++) {
      const [u, v, w] = edges[i];
      const ru = dsu.find(u), rv = dsu.find(v);
      if (ru === rv) continue;
      if (cheapest[ru] === -1 || edges[cheapest[ru]][2] > w) cheapest[ru] = i;
      if (cheapest[rv] === -1 || edges[cheapest[rv]][2] > w) cheapest[rv] = i;
    }
    let added = false;
    for (const i of cheapest) {
      if (i === -1) continue;
      const [u, v, w] = edges[i];
      if (dsu.union(u, v)) { mstWeight += w; mstEdges.push(i); components--; added = true; }
    }
    if (!added) break;
  }
  return { mstWeight, mstEdges };
}
```

## code.java
```java
class DSU {
    int[] p, r;
    DSU(int n) { p = new int[n]; r = new int[n]; for (int i = 0; i < n; i++) p[i] = i; }
    int find(int x) { while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; } return x; }
    boolean union(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (r[a] < r[b]) { int t = a; a = b; b = t; }
        p[b] = a;
        if (r[a] == r[b]) r[a]++;
        return true;
    }
}

class Boruvka {
    long mstWeight(int n, int[][] edges) {
        DSU dsu = new DSU(n);
        long total = 0;
        int components = n;
        while (components > 1) {
            int[] cheapest = new int[n];
            java.util.Arrays.fill(cheapest, -1);
            for (int i = 0; i < edges.length; i++) {
                int u = edges[i][0], v = edges[i][1], w = edges[i][2];
                int ru = dsu.find(u), rv = dsu.find(v);
                if (ru == rv) continue;
                if (cheapest[ru] == -1 || edges[cheapest[ru]][2] > w) cheapest[ru] = i;
                if (cheapest[rv] == -1 || edges[cheapest[rv]][2] > w) cheapest[rv] = i;
            }
            boolean added = false;
            for (int i : cheapest) {
                if (i == -1) continue;
                if (dsu.union(edges[i][0], edges[i][1])) { total += edges[i][2]; components--; added = true; }
            }
            if (!added) break;
        }
        return total;
    }
}
```

## code.cpp
```cpp
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

long long boruvkaMst(int n, vector<tuple<int,int,int>>& edges) {
    DSU dsu(n);
    long long total = 0;
    int components = n;
    while (components > 1) {
        vector<int> cheapest(n, -1);
        for (int i = 0; i < (int)edges.size(); i++) {
            auto [u, v, w] = edges[i];
            int ru = dsu.find(u), rv = dsu.find(v);
            if (ru == rv) continue;
            if (cheapest[ru] == -1 || get<2>(edges[cheapest[ru]]) > w) cheapest[ru] = i;
            if (cheapest[rv] == -1 || get<2>(edges[cheapest[rv]]) > w) cheapest[rv] = i;
        }
        bool added = false;
        for (int i : cheapest) {
            if (i == -1) continue;
            auto [u, v, w] = edges[i];
            if (dsu.unite(u, v)) { total += w; components--; added = true; }
        }
        if (!added) break;
    }
    return total;
}
```
