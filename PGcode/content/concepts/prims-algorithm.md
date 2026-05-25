---
slug: prims-algorithm
module: graphs-mst
title: Prim's Algorithm
subtitle: Grow a minimum spanning tree by repeatedly adding the cheapest edge that reaches a new vertex — O((V + E) log V) with a priority queue.
difficulty: Intermediate
position: 18
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Minimum Spanning Trees"
    url: "https://algs4.cs.princeton.edu/43mst/"
    type: book
  - title: "cp-algorithms — Prim's algorithm"
    url: "https://cp-algorithms.com/graph/mst_prim.html"
    type: blog
  - title: "TheAlgorithms/Python — prim.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/minimum_spanning_tree_prims.py"
    type: repo
status: published
---

## intro
Prim's algorithm builds a minimum spanning tree (MST) of a connected weighted undirected graph by starting from any vertex and repeatedly adding the cheapest edge that connects the in-tree set to a not-yet-in-tree vertex. A priority queue keyed on edge weight gives the next candidate in `O(log V)`; a `visited` set rejects edges that would form a cycle. After `V - 1` successful extractions every vertex is in the tree and the chosen edges form an MST.

## whyItMatters
- Network design — laying minimum-cost cable, water pipes, or roads to connect every location — reduces directly to MST.
- Cluster analysis: cut the MST's heaviest edges to produce a hierarchical clustering (single-linkage).
- Image segmentation, approximation algorithms for TSP, and circuit layout all use MST as a sub-routine.
- Prim's is the natural choice on **dense graphs** where the edge count is `O(V^2)` — its complexity stays `O(V^2)` with a plain array, beating Kruskal's `O(E log E)`.
- It is the textbook example of a greedy algorithm whose correctness rests on the **cut property**.

## intuition
The cut property says: for any partition (cut) of the vertices into two non-empty sets, the cheapest edge crossing the cut belongs to some MST. Prim's algorithm exploits this by always maintaining the cut "in-tree vs. not-in-tree" and always taking the cheapest edge across it.

Start with one vertex in the tree set `T`. The cheapest edge from `T` to the outside connects some vertex `v` to `T`. Add `v` and that edge — the cut property guarantees this edge is in *some* MST, so the partial tree we have is consistent with at least one global MST. Now `T` grows by one vertex and the cut shifts; repeat. After `V - 1` steps `T` covers everything and the accumulated edges form a complete MST.

The priority queue tracks **candidate edges crossing the current cut**. When `v` joins `T`, every edge `(v, u)` with `u` outside `T` becomes a new candidate, so push it. The queue may contain stale candidates (edges whose endpoint is already in `T`); detect and skip them at pop time — that "lazy" approach keeps the implementation simple. An **eager** Prim's keeps only the cheapest known edge to each outside vertex in the queue, using `decrease-key`, which is asymptotically faster on dense graphs but requires an indexed priority queue.

## visualization
Graph (undirected, weighted):

```
    1 ---4--- 2
    |  \      |
    1   3     5
    |    \    |
    3 ---2--- 4

edges: (1,2,4) (1,3,1) (1,4,3) (2,4,5) (3,4,2)
```

Prim's starting at vertex 1:

```
T = {1}   pq = [(1,1-3), (3,1-4), (4,1-2)]
pop (1, edge 1-3): 3 unvisited -> add. T = {1,3}  mst = [1-3 w=1]
  push edges from 3: (2, 3-4)
T = {1,3}  pq = [(2,3-4), (3,1-4), (4,1-2)]
pop (2, edge 3-4): 4 unvisited -> add. T = {1,3,4}  mst += 3-4 w=2
  push edges from 4: (5,4-2) [3-4 already done]
T = {1,3,4}  pq = [(3,1-4), (4,1-2), (5,4-2)]
pop (3, edge 1-4): 4 already in T -> skip (stale)
pop (4, edge 1-2): 2 unvisited -> add. T = {1,2,3,4}  mst += 1-2 w=4
  (queue may still contain stale entries; loop ends because T is full)

MST total = 1 + 2 + 4 = 7
edges     = {1-3, 3-4, 1-2}
```

## bruteForce
Enumerate all `V^{V-2}` labelled spanning trees (Cayley's formula) and pick the cheapest. Even for `V = 10` this is `10^8`; for `V = 20` it overflows. Useless beyond toy graphs.

## optimal
Lazy Prim's with a binary heap.

```python
import heapq
def prim_mst(n, adj):
    # adj[u] = list of (weight, v)
    in_tree = [False] * n
    pq = [(0, 0, -1)]      # (weight, vertex, parent)
    mst_weight = 0
    mst_edges = []
    while pq and len(mst_edges) < n - 1:
        w, u, p = heapq.heappop(pq)
        if in_tree[u]: continue
        in_tree[u] = True
        mst_weight += w
        if p != -1: mst_edges.append((p, u, w))
        for nw, v in adj[u]:
            if not in_tree[v]:
                heapq.heappush(pq, (nw, v, u))
    return mst_weight, mst_edges
```

For a **dense graph** (`E ≈ V^2`), an `O(V^2)` array-based Prim (scan all unvisited vertices for the minimum each pass) is faster than the `O(E log V)` heap version because the heap's constants dominate. For a **sparse graph**, the heap version wins. Use Kruskal's algorithm instead when the graph is so sparse that maintaining an adjacency list is overkill or when you already have a sorted edge list.

## complexity
- **Time**: `O((V + E) log V)` with a binary-heap priority queue; `O(V^2)` with an array; `O(E + V log V)` with a Fibonacci heap.
- **Space**: `O(V + E)` for the adjacency list, `O(E)` for the queue (lazy variant).
- **Correctness**: relies on the cut property of MSTs — every step is provably part of some optimal MST.

## pitfalls
- **Skipping the visited check at pop time.** The lazy variant pushes the same vertex multiple times; without the `if in_tree[u]: continue` guard you add a cycle and over-count weight. Fix: check `in_tree[u]` immediately after popping.
- **Using a directed adjacency list.** MST is defined on undirected graphs; if you only add `adj[u].append(v)` and not `adj[v].append(u)`, Prim's misses edges. Fix: push both directions when building the adjacency list.
- **Picking the wrong PQ key.** The heap must be keyed on edge weight, not on vertex id. Fix: tuples `(weight, vertex, parent)` — Python's heap sorts on the first element.
- **Counting MST size by edges, not vertices.** A tree on `V` vertices has exactly `V - 1` edges; loop until you have that many or the queue empties (disconnected graph). Fix: use `len(mst_edges) == n - 1` as the success condition.

## interviewTips
- State the cut property when explaining correctness — interviewers want to see the underlying lemma, not just code.
- Compare Prim's vs Kruskal's by graph density: Prim's on dense (`O(V^2)` array), Kruskal's on sparse with a fast union-find.
- Mention the lazy-vs-eager distinction; eager Prim's with decrease-key is the optimal choice in textbooks but rarely the fastest in practice on real data.

## code.python
```python
import heapq
def prim_mst(n, adj):
    in_tree = [False]*n
    pq = [(0, 0, -1)]; mst_w = 0; mst_e = []
    while pq and len(mst_e) < n - 1:
        w, u, p = heapq.heappop(pq)
        if in_tree[u]: continue
        in_tree[u] = True; mst_w += w
        if p != -1: mst_e.append((p, u, w))
        for nw, v in adj[u]:
            if not in_tree[v]:
                heapq.heappush(pq, (nw, v, u))
    return mst_w, mst_e
```

## code.javascript
```javascript
function primMST(n, adj) {
  // adj[u] = [[weight, v], ...]
  const inTree = new Array(n).fill(false);
  const pq = [[0, 0, -1]];        // (weight, u, parent) — naive heap
  const less = (a, b) => a[0] < b[0];
  const swap = (i, j) => { [pq[i], pq[j]] = [pq[j], pq[i]]; };
  const push = (x) => { pq.push(x); let i = pq.length - 1;
    while (i && less(pq[i], pq[(i-1)>>1])) { swap(i, (i-1)>>1); i = (i-1)>>1; } };
  const pop = () => { const top = pq[0], last = pq.pop();
    if (pq.length) { pq[0] = last; let i = 0;
      while (true) { let l = 2*i+1, r = 2*i+2, m = i;
        if (l < pq.length && less(pq[l], pq[m])) m = l;
        if (r < pq.length && less(pq[r], pq[m])) m = r;
        if (m === i) break; swap(i, m); i = m; } }
    return top; };
  let mstW = 0; const mstE = [];
  while (pq.length && mstE.length < n - 1) {
    const [w, u, p] = pop();
    if (inTree[u]) continue;
    inTree[u] = true; mstW += w;
    if (p !== -1) mstE.push([p, u, w]);
    for (const [nw, v] of adj[u]) if (!inTree[v]) push([nw, v, u]);
  }
  return { weight: mstW, edges: mstE };
}
```

## code.java
```java
public int primMST(int n, List<int[]>[] adj) {
    boolean[] inTree = new boolean[n];
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, 0});
    int mstWeight = 0, added = 0;
    while (!pq.isEmpty() && added < n) {
        int[] cur = pq.poll();
        int w = cur[0], u = cur[1];
        if (inTree[u]) continue;
        inTree[u] = true; mstWeight += w; added++;
        for (int[] e : adj[u]) {
            int nw = e[0], v = e[1];
            if (!inTree[v]) pq.offer(new int[]{nw, v});
        }
    }
    return mstWeight;
}
```

## code.cpp
```cpp
int primMST(int n, vector<vector<pair<int,int>>>& adj) {
    vector<bool> inTree(n, false);
    priority_queue<tuple<int,int>, vector<tuple<int,int>>, greater<>> pq;
    pq.emplace(0, 0);
    int mstW = 0, added = 0;
    while (!pq.empty() && added < n) {
        auto [w, u] = pq.top(); pq.pop();
        if (inTree[u]) continue;
        inTree[u] = true; mstW += w; added++;
        for (auto [nw, v] : adj[u])
            if (!inTree[v]) pq.emplace(nw, v);
    }
    return mstW;
}
```
