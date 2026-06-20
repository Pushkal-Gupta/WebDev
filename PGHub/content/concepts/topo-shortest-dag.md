---
slug: topo-shortest-dag
module: graphs-traversal
title: Shortest Paths on a DAG
subtitle: Relax edges in topological order for O(V+E) shortest paths — faster than Dijkstra, handles negative weights.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Acyclic Edge-Weighted Digraphs"
    url: "https://algs4.cs.princeton.edu/44sp/"
    type: book
  - title: "Shortest Paths in DAG — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/shortest-path-for-directed-acyclic-graphs/"
    type: blog
  - title: "TheAlgorithms/Python — bellman_ford.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/bellman_ford.py"
    type: repo
status: published
---

## intro
On a directed acyclic graph, shortest paths can be computed in linear time — even with negative edge weights. The trick is to relax edges in topological order: by the time you process vertex u, every shorter path into u has already been finalized. No priority queue, no log factor, no negative-cycle anxiety.

## whyItMatters
Project scheduling, critical-path method (CPM/PERT), event-time analysis, and longest-path-in-DAG problems all reduce to this template. It is also strictly better than Dijkstra whenever the graph happens to be acyclic — O(V+E) versus O((V+E) log V) — and it accepts negative weights, which Dijkstra cannot.

## intuition
The mental model is that a topological order eliminates uncertainty about predecessors before you visit a vertex. In a general graph, when Dijkstra picks a vertex to "settle," it has to *prove* nothing shorter can arrive later — that proof is exactly why Dijkstra needs a priority queue and why it cannot handle negative edges (the proof breaks). On a DAG processed in topological order, the proof is free: by the time you reach vertex `u`, every vertex that could possibly contribute a path into `u` has *already been processed*, so `dist[u]` is the final answer. There is no later vertex that can sneak in with a shorter path because there are no later vertices that point to `u`.

The *why* before the *how*: the topological order is a linearisation that respects every directed edge — for every edge `(u, v)`, `u` comes before `v` in the order. So when you walk the order left to right and relax `u`'s outgoing edges, you are effectively pushing the now-final `dist[u]` into every vertex that depends on `u`. By the time the loop reaches `v`, every predecessor has already pushed its contribution into `dist[v]`, so `dist[v]` is finalised the moment you arrive. No second visit needed, no priority queue, no overhead per relaxation other than a comparison and a possible assignment.

The key invariant: at the top of the iteration that processes vertex `u`, `dist[u]` already equals the true shortest-path distance from the source to `u`. The proof is induction on position in the topological order — the source has trivial distance 0, and every later vertex has all of its in-neighbours processed before it. Analogy: think of dominoes laid out in dependency order. Once you knock over the source domino, the chain propagates forward exactly once; you never look backward, never re-process a domino, and never have to decide which to knock next — the order has already decided. Negative weights are not a problem because the dominoes still fall in order; there is no risk of a "shorter path arriving later" because the topological order forbids it.

## visualization
```
DAG (5 vertices, weighted edges):
   0 --3-->  1
   0 --6-->  2
   1 --2-->  2
   1 --4-->  3
   1 -(-1)-> 4         (negative edge -- still fine on a DAG)
   2 --1-->  3
   2 --2-->  4
   3 --5-->  4

Step 1: topological sort.
   Kahn's order: [0, 1, 2, 3, 4]   (other valid orders exist)

Step 2: initialise distances.
   dist = [0, inf, inf, inf, inf]   source = 0

Step 3: scan the topo order left to right.

   u=0  outgoing (0,1,3), (0,2,6)
        dist[1] = min(inf, 0+3) = 3
        dist[2] = min(inf, 0+6) = 6
        dist = [0, 3, 6, inf, inf]

   u=1  outgoing (1,2,2), (1,3,4), (1,4,-1)
        dist[2] = min(6, 3+2) = 5
        dist[3] = min(inf, 3+4) = 7
        dist[4] = min(inf, 3-1) = 2
        dist = [0, 3, 5, 7, 2]

   u=2  outgoing (2,3,1), (2,4,2)
        dist[3] = min(7, 5+1) = 6
        dist[4] = min(2, 5+2) = 2
        dist = [0, 3, 5, 6, 2]

   u=3  outgoing (3,4,5)
        dist[4] = min(2, 6+5) = 2
        dist = [0, 3, 5, 6, 2]

   u=4  no outgoing edges; done.

Final shortest distances from 0:  [0, 3, 5, 6, 2]
```

## bruteForce
Run Bellman-Ford: O(V * E). Works, but ignores the acyclic structure entirely. Or run Dijkstra with a heap: O((V + E) log V) and breaks on negative edges. Both leave the linear-time win on the table.

## optimal
The optimal algorithm has two phases, each running in O(V + E). Phase one builds an adjacency list and an in-degree array, then produces a topological order via Kahn's algorithm (BFS over in-degree-0 vertices) or a DFS post-order reversal. Phase two initialises a distance array `dist` of size `V` with `dist[source] = 0` and every other entry set to a sentinel value (`+infinity` or `INT_MAX/4` to avoid overflow). It then walks the topological order left to right; for each vertex `u`, if `dist[u]` is finite, it relaxes every outgoing edge `(u, v, w)` by setting `dist[v] = min(dist[v], dist[u] + w)`.

Data structures: an adjacency list of `(neighbour, weight)` pairs, an `in_deg` array (Kahn's), a FIFO queue for the topological sort, and a `dist` array. Optionally maintain a `parent` array, updated alongside every successful relaxation, to reconstruct paths by walking backwards from any target to the source. No priority queue is required — that's the entire point — and no visited array beyond the in-degree counter is needed.

Key invariants and tradeoffs. The central invariant is that `dist[u]` is final by the time the outer loop processes `u`, because every predecessor of `u` precedes `u` in the topological order and has already pushed its contribution. This is what allows a single pass over edges to suffice. Compared with Dijkstra, this algorithm is provably faster (O(V + E) vs O((V + E) log V)) on every input it accepts, and it additionally accepts negative edges that Dijkstra cannot handle. Compared with Bellman-Ford, it is asymptotically better (O(V + E) vs O(V · E)) and produces the same result without iteration. The only requirement is acyclicity; if the input might contain a cycle, verify it first — Kahn's reports a cycle as "emitted fewer than V vertices" for free, so use that as a guard. To compute the *longest* path in a DAG, run the same algorithm with the comparison flipped to `max` (or equivalently negate every edge weight and find shortest path) — uniquely tractable because DAGs cannot have negative cycles, which would otherwise make longest path NP-hard.

## complexity
time: O(V + E) — one topological sort plus one relaxation pass.
space: O(V) for distances and the topological order, O(V + E) for the adjacency list.
notes: Unlike Dijkstra and Bellman-Ford, this is provably optimal: any algorithm must look at every edge at least once.

## pitfalls
- **Cycle in the input.** The algorithm assumes acyclicity; on a cyclic graph the topological order is incomplete and distances are wrong. Fix: detect by checking Kahn's emitted-vertex count — if `len(order) != n`, fall back to Bellman-Ford or report a cycle.
- **Unreachable distances not initialised to infinity.** Leaving `dist[v] = 0` for unreached vertices makes negative-edge relaxations from them propagate fake "0" distances into the graph. Fix: initialise every non-source vertex to a sentinel like `INT_MAX / 4` (not `INT_MAX`) so addition cannot overflow.
- **Wrong direction.** Iterating the topological order in reverse computes shortest paths *to* a sink, not from a source. Fix: process the order left-to-right for source→all, right-to-left for all→sink; pick deliberately based on the problem and add a unit test that distinguishes the two.
- **No parent array for path reconstruction.** Without `parent[v] = u` on every successful relaxation, you can only report distances, not the path itself. Fix: maintain `parent` alongside `dist` and reconstruct by walking backwards from target to source.
- **Relaxing from an unreachable vertex.** Iterating outgoing edges of `u` when `dist[u] == INF` propagates infinity around the DAG (and overflows if the sentinel is `INT_MAX`). Fix: skip with `if dist[u] == INF: continue` before processing `u`'s edges.

## interviewTips
- Lead with the discriminator: "Is the graph acyclic? If yes, topological-order relaxation beats Dijkstra and tolerates negative weights."
- Be ready to flip the algorithm to compute longest paths — interviewers love this twist because it would be NP-hard on a general graph.
- Mention critical path method as the real-world application — project managers compute it daily without realizing they're running a DAG shortest-path algorithm.

## code.python
```python
from collections import deque

def topo_shortest(n, edges, src):
    INF = float('inf')
    adj = [[] for _ in range(n)]
    in_deg = [0] * n
    for u, v, w in edges:
        adj[u].append((v, w)); in_deg[v] += 1
    q = deque(i for i in range(n) if in_deg[i] == 0)
    order = []
    while q:
        u = q.popleft(); order.append(u)
        for v, _ in adj[u]:
            in_deg[v] -= 1
            if in_deg[v] == 0: q.append(v)
    if len(order) != n: return None
    dist = [INF] * n
    dist[src] = 0
    for u in order:
        if dist[u] == INF: continue
        for v, w in adj[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    return dist
```

## code.javascript
```javascript
function topoShortest(n, edges, src) {
  const INF = Infinity;
  const adj = Array.from({ length: n }, () => []);
  const inDeg = new Array(n).fill(0);
  for (const [u, v, w] of edges) { adj[u].push([v, w]); inDeg[v]++; }
  const queue = [];
  for (let i = 0; i < n; i++) if (inDeg[i] === 0) queue.push(i);
  const order = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++]; order.push(u);
    for (const [v] of adj[u]) if (--inDeg[v] === 0) queue.push(v);
  }
  if (order.length !== n) return null;
  const dist = new Array(n).fill(INF);
  dist[src] = 0;
  for (const u of order) {
    if (dist[u] === INF) continue;
    for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
  }
  return dist;
}
```

## code.java
```java
import java.util.*;

public int[] topoShortest(int n, int[][] edges, int src) {
    final int INF = Integer.MAX_VALUE / 4;
    List<int[]>[] adj = new List[n];
    int[] inDeg = new int[n];
    for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
    for (int[] e : edges) { adj[e[0]].add(new int[]{e[1], e[2]}); inDeg[e[1]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (inDeg[i] == 0) q.offer(i);
    int[] order = new int[n];
    int idx = 0;
    while (!q.isEmpty()) {
        int u = q.poll(); order[idx++] = u;
        for (int[] nb : adj[u]) if (--inDeg[nb[0]] == 0) q.offer(nb[0]);
    }
    if (idx != n) return null;
    int[] dist = new int[n];
    Arrays.fill(dist, INF);
    dist[src] = 0;
    for (int i = 0; i < n; i++) {
        int u = order[i];
        if (dist[u] == INF) continue;
        for (int[] nb : adj[u]) if (dist[u] + nb[1] < dist[nb[0]]) dist[nb[0]] = dist[u] + nb[1];
    }
    return dist;
}
```

## code.cpp
```cpp
#include <vector>
#include <queue>
#include <climits>
using namespace std;

vector<int> topoShortest(int n, vector<tuple<int,int,int>>& edges, int src) {
    const int INF = INT_MAX / 4;
    vector<vector<pair<int,int>>> adj(n);
    vector<int> inDeg(n, 0);
    for (auto& [u, v, w] : edges) { adj[u].push_back({v, w}); inDeg[v]++; }
    queue<int> q;
    for (int i = 0; i < n; i++) if (inDeg[i] == 0) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (auto& [v, w] : adj[u]) if (--inDeg[v] == 0) q.push(v);
    }
    if ((int)order.size() != n) return {};
    vector<int> dist(n, INF);
    dist[src] = 0;
    for (int u : order) {
        if (dist[u] == INF) continue;
        for (auto& [v, w] : adj[u]) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    }
    return dist;
}
```
