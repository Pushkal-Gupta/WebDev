---
slug: mst-prim
module: graphs
title: Prim's Algorithm (MST)
subtitle: Minimum spanning tree by growing a single connected frontier with a priority queue, O(E log V).
difficulty: Intermediate
position: 16
estimatedReadMinutes: 7
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
A minimum spanning tree (MST) of a weighted undirected graph is a subset of edges that connects every vertex with the smallest possible total edge weight — equivalent to a tree on V vertices with V-1 edges. Prim's algorithm builds the MST by starting at any vertex and repeatedly attaching the cheapest edge that grows the tree by one new vertex. With a binary-heap priority queue it runs in O(E log V); with a Fibonacci heap, O(E + V log V).

## whyItMatters
MST appears in network design (laying cable, water mains, road networks), clustering (single-linkage agglomerative clustering is literally MST), and as a sub-routine in approximation algorithms (Christofides for TSP). Prim and Kruskal both compute MSTs but with different strengths: Prim is faster on **dense** graphs and works naturally when the graph is given as an adjacency list; Kruskal is faster on **sparse** graphs and works naturally when edges arrive as a list. Knowing which to reach for is a senior-level signal.

## intuition
Start with any vertex in the tree, and every other vertex outside. The "frontier" is the set of edges with one endpoint inside the tree and one outside. The cheapest frontier edge cannot be wrong to include — because any spanning tree must cross the cut between in-tree and out-of-tree vertices at least once, and replacing a cut edge with the lighter cheapest one cannot increase total weight (the *cut property* of MSTs). Repeat V-1 times: add the cheapest frontier edge, move its outer endpoint into the tree, update the frontier.

## visualization
```
Graph (5 vertices, weighted edges):
  A --1-- B
  A --4-- C
  B --2-- C
  B --5-- D
  C --3-- D
  D --6-- E
  C --7-- E

Start at A. in-tree = {A}, frontier = {(A-B,1), (A-C,4)}
Step 1: pop (A-B,1). Add B. in-tree = {A,B}.
        frontier += (B-C,2), (B-D,5). frontier now {(B-C,2),(A-C,4),(B-D,5)}.
Step 2: pop (B-C,2). Add C. in-tree = {A,B,C}.
        skip (A-C,4) - both endpoints in tree. frontier += (C-D,3),(C-E,7).
Step 3: pop (C-D,3). Add D. frontier += (D-E,6). skip (B-D,5) later.
Step 4: pop (D-E,6). Add E. Done.

MST edges: A-B(1), B-C(2), C-D(3), D-E(6). Total weight = 12.
```

## bruteForce
Naive Prim without a heap: each iteration scans every frontier candidate to find the minimum — O(V) per step, V-1 steps, so O(V^2) total. Acceptable for dense graphs (V^2 ≈ E anyway), terrible for sparse ones. Brute-force "try every spanning tree" is exponential — Cayley's formula gives n^(n-2) spanning trees of K_n, so this is never the answer.

## optimal
Maintain a min-heap of frontier edges (or, equivalently, of "best known edge weight to reach each unvisited vertex"). Pop the cheapest, ignore if its target is already in the tree, else add the edge and push its target's outgoing edges.

```
prim(graph, start):
    inTree = boolean array, all False
    heap = min-heap of (weight, u, v)
    push (0, -1, start)
    mst_edges = []
    total = 0
    while heap not empty and len(mst_edges) < V - 1:
        (w, parent, v) = heap.pop_min()
        if inTree[v]: continue
        inTree[v] = True
        if parent != -1:
            mst_edges.append((parent, v, w))
            total += w
        for (v, u, weight) in graph.adj[v]:
            if not inTree[u]:
                heap.push((weight, v, u))
    return mst_edges, total
```
Heap can contain stale entries (vertices added after the entry was pushed); the `if inTree[v]: continue` check handles them. This keeps the algorithm O(E log E) = O(E log V) since E <= V^2 means log E = O(log V).

## complexity
time: O(E log V) with a binary heap; O(E + V log V) with a Fibonacci heap (theoretical, rarely worth the constant).
space: O(V + E) for the adjacency list + heap.
notes: Works only on connected graphs — if the graph has c components, you get a spanning forest with c trees if you restart Prim from each unvisited vertex. Prim does not need union-find (unlike Kruskal); a simple "visited" boolean is enough.

## pitfalls
- Adding an edge whose target is already in the tree — silently inflates the MST or duplicates edges. Always check `inTree[v]` before processing the popped entry.
- Using a max-heap by mistake — flip the sign or use a `(-weight, ...)` tuple if your language's PQ is max by default.
- Pushing only the cheapest known edge per vertex without lazy deletion — needs decrease-key, which most heap libraries don't expose. The "lazy" variant (push every edge, skip stale entries on pop) is simpler and only a constant factor slower.
- Confusing MST with shortest-path tree from a source — they're different. MST minimizes total weight; SPT minimizes per-vertex distance from a root.
- Counting edges from the wrong direction in an undirected graph — push both directions when building the adjacency list, or iterate edges directly.

## interviewTips
- Distinguish Prim vs Kruskal early: "Prim is grow-from-one-seed with a heap; Kruskal is sort-edges-globally with union-find. Prim wins on dense, Kruskal on sparse."
- State the cut-property justification: "The cheapest edge crossing any cut is in some MST" — this is the proof Prim's greedy choice is safe.
- Mention real-world: network cabling (cheapest cable layout), clustering (cut the k-1 largest MST edges to get k clusters — *single-linkage clustering*).
- Be ready for: "what if edge weights have ties?" — MST isn't unique, but every Prim run yields a valid MST. Lexicographic tie-breaking gives determinism.

## code.python
```python
import heapq

def prim(adj, start=0):
    n = len(adj)
    in_tree = [False] * n
    heap = [(0, -1, start)]
    mst, total = [], 0
    while heap and len(mst) < n - 1:
        w, parent, v = heapq.heappop(heap)
        if in_tree[v]: continue
        in_tree[v] = True
        if parent != -1:
            mst.append((parent, v, w))
            total += w
        for u, weight in adj[v]:
            if not in_tree[u]:
                heapq.heappush(heap, (weight, v, u))
    if any(not x for x in in_tree):
        return None, None  # graph not connected
    return mst, total
```

## code.javascript
```javascript
class MinHeap {
  constructor() { this.h = []; }
  push(x) { this.h.push(x); this._up(this.h.length - 1); }
  pop() { const top = this.h[0], last = this.h.pop(); if (this.h.length) { this.h[0] = last; this._down(0); } return top; }
  get size() { return this.h.length; }
  _up(i) { while (i > 0) { const p = (i - 1) >> 1; if (this.h[p][0] <= this.h[i][0]) break; [this.h[p], this.h[i]] = [this.h[i], this.h[p]]; i = p; } }
  _down(i) { const n = this.h.length; while (true) { let l = i * 2 + 1, r = l + 1, s = i; if (l < n && this.h[l][0] < this.h[s][0]) s = l; if (r < n && this.h[r][0] < this.h[s][0]) s = r; if (s === i) break; [this.h[s], this.h[i]] = [this.h[i], this.h[s]]; i = s; } }
}

function prim(adj, start = 0) {
  const n = adj.length, inTree = new Array(n).fill(false);
  const heap = new MinHeap();
  heap.push([0, -1, start]);
  const mst = []; let total = 0;
  while (heap.size && mst.length < n - 1) {
    const [w, parent, v] = heap.pop();
    if (inTree[v]) continue;
    inTree[v] = true;
    if (parent !== -1) { mst.push([parent, v, w]); total += w; }
    for (const [u, weight] of adj[v]) if (!inTree[u]) heap.push([weight, v, u]);
  }
  if (inTree.some(x => !x)) return null;
  return { mst, total };
}
```

## code.java
```java
import java.util.*;

public class Prim {
    public int[] mst(List<int[]>[] adj, int start) {
        int n = adj.length;
        boolean[] inTree = new boolean[n];
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        pq.offer(new int[]{0, -1, start});
        int total = 0, edges = 0;
        while (!pq.isEmpty() && edges < n - 1) {
            int[] top = pq.poll();
            int w = top[0], v = top[2];
            if (inTree[v]) continue;
            inTree[v] = true;
            if (top[1] != -1) { total += w; edges++; }
            for (int[] e : adj[v]) {
                int u = e[0], weight = e[1];
                if (!inTree[u]) pq.offer(new int[]{weight, v, u});
            }
        }
        for (boolean x : inTree) if (!x) return null;
        return new int[]{total, edges};
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <queue>
#include <utility>

struct Edge { int to; int w; };

std::pair<int, std::vector<std::tuple<int,int,int>>> prim(const std::vector<std::vector<Edge>>& adj, int start = 0) {
    int n = (int) adj.size();
    std::vector<bool> inTree(n, false);
    using T = std::tuple<int,int,int>;   // (weight, parent, vertex)
    std::priority_queue<T, std::vector<T>, std::greater<T>> pq;
    pq.emplace(0, -1, start);
    int total = 0;
    std::vector<std::tuple<int,int,int>> mst;
    while (!pq.empty() && (int)mst.size() < n - 1) {
        auto [w, parent, v] = pq.top(); pq.pop();
        if (inTree[v]) continue;
        inTree[v] = true;
        if (parent != -1) { mst.emplace_back(parent, v, w); total += w; }
        for (auto& e : adj[v]) if (!inTree[e.to]) pq.emplace(e.w, v, e.to);
    }
    for (bool x : inTree) if (!x) return {-1, {}};
    return {total, mst};
}
```
