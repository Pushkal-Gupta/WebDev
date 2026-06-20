---
slug: mst-boruvka
module: graphs-mst
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
The algorithm exists because the cut property of MSTs — "for any cut of the graph, the minimum-weight edge crossing it is in every MST" — can be applied not just once but to every connected component simultaneously. Kruskal and Prim apply the cut property serially (one edge at a time); Borůvka applies it in parallel across all components in each phase, doing as much work as the graph structure allows.

The decisive observation: in any phase, the cheapest edge leaving a component v is safe to add to the MST because it is the minimum-weight edge crossing the cut (v, rest-of-graph). Every component decides its move independently — no coordination needed beyond a final union step — and after one phase, every component absorbs at least one neighbour. So the component count at most halves per phase, giving O(log V) phases. Each phase scans all E edges once to find the cheapest outgoing edge per component, costing O(E + V·α(V)) with union-find. Total: O(E log V).

The parallel-friendly structure is what makes Borůvka special. Distributed implementations partition edges across workers, each worker computes per-component cheapest edges locally, then a single reduction phase combines results and performs unions. This is exactly how MST is computed at scale in Apache GraphX and Pregel-derived frameworks.

Karger-Klein-Tarjan's 1995 randomised linear-time MST algorithm builds on Borůvka by interleaving phases with random sampling: run a Borůvka phase, sample F-light edges, recursively MST a sparser graph, and merge. The expected total cost is O(V + E), the best possible bound for MST in the comparison model. Borůvka is also linear-time *without* randomisation on planar graphs (and graphs of bounded genus more generally) because each phase removes a constant fraction of edges via contraction — a result due to Cheriton-Tarjan 1976 used in computational geometry MST applications.

**Common bug**: forgetting the tie-break on edge weight causes the same edge to be picked from both endpoints, doubling its weight. Always tie-break on edge index (or by lexicographic endpoint order) to make the per-component choice deterministic.

## visualization
Six vertices, edges with weights: (1,2,1), (2,3,2), (3,4,3), (4,5,4), (5,6,5), (6,1,6), (2,5,7). Phase 1: every singleton's cheapest edge is the smallest incident — 1 picks (1,2,1), 2 picks (1,2,1), 3 picks (2,3,2), 4 picks (3,4,3), 5 picks (4,5,4), 6 picks (5,6,5). After dedup and union: {1,2,3,4,5,6} all merge into one component. MST = {1,2,3,4,5} with total weight 15. One phase, done.

## bruteForce
Run Kruskal-style: sort all E edges, then for each edge check if its endpoints are already connected and skip if so. O(E log E) — already optimal in the comparison model. The "brute" version of Borůvka itself would rescan every edge for every component every phase, costing O(E * V) — strictly worse than the standard implementation.

## optimal
**Technique: Borůvka's algorithm — parallel cut-property selection with union-find.** O(E log V) sequential, O(E log V / P) with P-way parallelism. Karger-Klein-Tarjan extends this to O(V + E) expected with random sampling — the asymptotically best MST known.

```python
def boruvka_mst(n, edges):
    dsu = DSU(n)                                  # union-find with path compression + rank
    mst_weight = 0
    components = n
    while components > 1:
        cheapest = [-1] * n                       # cheapest[root] = edge index
        for i, (u, v, w) in enumerate(edges):     # one full edge scan per phase
            ru, rv = dsu.find(u), dsu.find(v)
            if ru == rv: continue                 # intra-component edge, skip
            if cheapest[ru] == -1 or edges[cheapest[ru]][2] > w:
                cheapest[ru] = i
            if cheapest[rv] == -1 or edges[cheapest[rv]][2] > w:
                cheapest[rv] = i
        added = False
        for i in cheapest:                        # union phase
            if i == -1: continue
            u, v, w = edges[i]
            if dsu.union(u, v):                   # may have been merged earlier in this phase
                mst_weight += w
                components -= 1
                added = True
        if not added: break                       # disconnected graph; MST is a forest
    return mst_weight
```

Key lines: `cheapest = [-1] * n` is reset every phase — stale picks from prior phases would corrupt the cut-property logic. The edge scan `for i, (u, v, w) in enumerate(edges)` updates the cheapest outgoing edge for *both* endpoints' components, because either endpoint could be the deciding side. The `if dsu.union(u, v)` guard during the union phase handles the duplicate case: when two components both picked the same edge (one from each side), the second union attempt is a no-op. The `if not added: break` termination handles disconnected graphs — when no progress is made in a phase, the graph is a forest and the algorithm halts.

Total per-phase cost: O(E) edge scan + O(V·α(V)) union work. After each phase, components at most halve (every component absorbs at least one neighbour), so at most O(log V) phases. Total: O(E log V) sequential.

**Why not Kruskal?** Kruskal is O(E log E) for sorting all edges; Borůvka does no global sort. On distributed graphs where edges live on different machines, Borůvka avoids the all-to-all shuffle Kruskal requires. **Why not Prim?** Prim is O((V+E) log V) with a binary heap; competitive on dense graphs but inherently serial — extending one tree edge at a time. **Why not Karger-Klein-Tarjan?** It's the asymptotic winner but has large constants and is rarely used outside theoretical work. **Common bugs**: forgetting to tie-break on edge index causes double-counting; not resetting `cheapest` each phase corrupts subsequent rounds; stopping on `components > 1` instead of "no edge added" loops forever on disconnected graphs.

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
