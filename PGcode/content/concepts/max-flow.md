---
slug: max-flow
module: graphs-flow-grids
title: Maximum Flow (Ford-Fulkerson / Edmonds-Karp)
subtitle: Find the maximum total flow from source to sink in a directed weighted graph by repeatedly augmenting along shortest paths.
difficulty: Advanced
position: 28
estimatedReadMinutes: 8
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
Given a directed graph with edge capacities, a **source s**, and a **sink t**, the maximum flow problem asks: what's the largest amount of "stuff" you can push from s to t while no edge exceeds its capacity? Ford-Fulkerson is the family of algorithms; **Edmonds-Karp** is the specific BFS-based instance with provable O(V·E²) time.

## whyItMatters
Max-flow is the engine behind a huge class of optimization problems via clever reductions:
- **Bipartite matching** (jobs ↔ workers, students ↔ projects) — each match is a unit flow.
- **Edge-disjoint / vertex-disjoint path counting** between two nodes.
- **Image segmentation** (foreground/background as min-cut).
- **Project scheduling**, **survey design**, **baseball elimination**, and much else.

The **max-flow / min-cut theorem** says the maximum s-t flow equals the minimum s-t edge-cut. So solving one solves both — and it's a beautiful piece of duality.

## intuition
Think of the graph as a plumbing network. Each pipe has a capacity (gallons per minute). Push as much water as possible from s to t. The bookkeeping trick is the **residual graph**: for each edge (u, v) with capacity c and current flow f, residual capacity is `c - f` forward and `f` backward (you can "cancel" flow by sending it the other way). Keep finding paths from s to t in the residual graph and saturating them. Stop when no path exists.

## visualization
```
Capacities:                              After first augment of 4 along s→a→t:

s ──5──► a ──4──► t                       s ──5/5──► a ──4/4──► t
 \                ▲                       (residual s→a = 1, a→s = 4)
  \               │
   2─► b ──3──────┘                       Find next path s→b→t, send min(2, 3) = 2:
                                          s ──2/2──► b ──2/3──► t

Total max flow = 4 + 2 = 6.
```

## bruteForce
Naive Ford-Fulkerson picks augmenting paths arbitrarily (DFS). If capacities are integers, terminates with the correct answer — but with non-integer capacities the algorithm may run forever, and with adversarial integer capacities can take O(F · E) where F is the max flow value (could be astronomical).

## optimal
**Edmonds-Karp**: pick augmenting paths via BFS (shortest path in unweighted residual graph). Provably O(V · E²) regardless of capacity values.

```
flow = 0
while BFS(s, t) finds an augmenting path:
    bottleneck = min residual capacity along the path
    for each edge (u, v) on the path:
        residual[u][v] -= bottleneck
        residual[v][u] += bottleneck         # back-edge for cancellation
    flow += bottleneck
return flow
```

**Dinic's algorithm** is the modern go-to: build a level graph via BFS, push blocking flow via DFS, repeat. Same O(V²·E) worst case, much faster in practice (O(E · sqrt(V)) on unit-capacity bipartite graphs, which makes it the standard for matching problems).

For min-cut, after computing max flow, BFS from s in the residual graph. Edges from "reachable" to "unreachable" nodes form the minimum cut.

## complexity
- **Edmonds-Karp**: O(V · E²) worst-case time. Memory O(V²) with matrix or O(V + E) with adjacency list + map for residuals.
- **Dinic's**: O(V² · E) general, O(E · sqrt(V)) for unit-capacity graphs.
- **Network simplex / push-relabel**: better in practice but heavier code.
- **Integer capacities**: always terminates; running time bound holds.

## pitfalls
- **Forgetting the back-edge with capacity 0**: must initialize the residual graph with 0-capacity reverse edges so the cancellation trick works.
- **Mutating the residual during BFS**: corrupts the parent map. Snapshot then update.
- **Multi-graph (parallel edges)**: track flow per-edge, not per-(u, v) pair. Use edge indices.
- **Vertex capacities**: split each capacitated vertex into two with a capacity-bounded edge between them.
- **Floating-point capacities**: switch to push-relabel or scale; Edmonds-Karp's termination proof assumes rational capacities.

## interviewTips
- The trigger: "match X to Y subject to constraints" → likely bipartite matching → max flow.
- Mention **max-flow min-cut duality** when interviewing for senior roles.
- For bipartite matching specifically, Hopcroft-Karp gives O(E · sqrt(V)) — better than generic max-flow.
- Walk through the residual graph carefully — it's the part most candidates fumble.

## code.python
```python
from collections import defaultdict, deque

def edmonds_karp(n, edges, source, sink):
    cap = defaultdict(lambda: defaultdict(int))
    for u, v, c in edges:
        cap[u][v] += c
    flow = 0
    while True:
        parent = {source: None}
        q = deque([source])
        while q and sink not in parent:
            u = q.popleft()
            for v in cap[u]:
                if v not in parent and cap[u][v] > 0:
                    parent[v] = u
                    q.append(v)
        if sink not in parent: break
        path_flow = float('inf')
        v = sink
        while parent[v] is not None:
            path_flow = min(path_flow, cap[parent[v]][v])
            v = parent[v]
        v = sink
        while parent[v] is not None:
            u = parent[v]
            cap[u][v] -= path_flow
            cap[v][u] += path_flow
            v = u
        flow += path_flow
    return flow

edges = [(0, 1, 10), (0, 2, 5), (1, 2, 15), (1, 3, 10), (2, 3, 10)]
print(edmonds_karp(4, edges, 0, 3))   # 15
```

## code.javascript
```javascript
function edmondsKarp(n, edges, source, sink) {
  const cap = Array.from({ length: n }, () => new Map());
  for (const [u, v, c] of edges) cap[u].set(v, (cap[u].get(v) || 0) + c);
  let flow = 0;
  while (true) {
    const parent = new Array(n).fill(-1); parent[source] = source;
    const q = [source];
    while (q.length && parent[sink] === -1) {
      const u = q.shift();
      for (const [v, c] of cap[u]) if (parent[v] === -1 && c > 0) { parent[v] = u; q.push(v); }
    }
    if (parent[sink] === -1) break;
    let bottleneck = Infinity, v = sink;
    while (v !== source) { bottleneck = Math.min(bottleneck, cap[parent[v]].get(v)); v = parent[v]; }
    v = sink;
    while (v !== source) {
      const u = parent[v];
      cap[u].set(v, cap[u].get(v) - bottleneck);
      cap[v].set(u, (cap[v].get(u) || 0) + bottleneck);
      v = u;
    }
    flow += bottleneck;
  }
  return flow;
}
```

## code.java
```java
import java.util.*;
class MaxFlow {
    public int edmondsKarp(int n, int[][] edges, int source, int sink) {
        int[][] cap = new int[n][n];
        for (int[] e : edges) cap[e[0]][e[1]] += e[2];
        int flow = 0;
        while (true) {
            int[] parent = new int[n];
            Arrays.fill(parent, -1);
            parent[source] = source;
            Deque<Integer> q = new ArrayDeque<>();
            q.add(source);
            while (!q.isEmpty() && parent[sink] == -1) {
                int u = q.pollFirst();
                for (int v = 0; v < n; v++)
                    if (parent[v] == -1 && cap[u][v] > 0) { parent[v] = u; q.add(v); }
            }
            if (parent[sink] == -1) break;
            int bottleneck = Integer.MAX_VALUE;
            for (int v = sink; v != source; v = parent[v]) bottleneck = Math.min(bottleneck, cap[parent[v]][v]);
            for (int v = sink; v != source; v = parent[v]) { cap[parent[v]][v] -= bottleneck; cap[v][parent[v]] += bottleneck; }
            flow += bottleneck;
        }
        return flow;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <queue>
#include <climits>
int edmondsKarp(int n, std::vector<std::tuple<int,int,int>>& edges, int s, int t) {
    std::vector<std::vector<int>> cap(n, std::vector<int>(n, 0));
    for (auto [u, v, c] : edges) cap[u][v] += c;
    int flow = 0;
    while (true) {
        std::vector<int> parent(n, -1);
        parent[s] = s;
        std::queue<int> q; q.push(s);
        while (!q.empty() && parent[t] == -1) {
            int u = q.front(); q.pop();
            for (int v = 0; v < n; v++)
                if (parent[v] == -1 && cap[u][v] > 0) { parent[v] = u; q.push(v); }
        }
        if (parent[t] == -1) break;
        int bottleneck = INT_MAX;
        for (int v = t; v != s; v = parent[v]) bottleneck = std::min(bottleneck, cap[parent[v]][v]);
        for (int v = t; v != s; v = parent[v]) { cap[parent[v]][v] -= bottleneck; cap[v][parent[v]] += bottleneck; }
        flow += bottleneck;
    }
    return flow;
}
```
