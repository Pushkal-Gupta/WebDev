---
slug: johnson-all-pairs
module: graphs
title: Johnson's All-Pairs Shortest Paths
subtitle: Reweight with Bellman-Ford, then run Dijkstra from every source — beats Floyd-Warshall on sparse graphs.
difficulty: Advanced
position: 1
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 25: All-Pairs Shortest Paths"
    url: "https://walkccc.me/CLRS/Chap25/25.3/"
    type: book
  - title: "Johnson's Algorithm — cp-algorithms"
    url: "https://cp-algorithms.com/graph/dijkstra_sparse.html"
    type: blog
  - title: "TheAlgorithms/Python — johnson.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/dijkstra.py"
    type: repo
status: published
---

## intro
Johnson's algorithm computes shortest paths between every pair of vertices in a graph that may contain negative edges, in O(V * E log V) time. On sparse graphs that crushes Floyd-Warshall's O(V^3). The trick is a one-time reweighting step that makes all edges non-negative, after which V independent Dijkstra runs do the heavy lifting.

## whyItMatters
Floyd-Warshall is simple and dense-graph optimal, but it always pays V^3 — wasteful when E is much smaller than V^2. Johnson's keeps Floyd's negative-edge tolerance while inheriting Dijkstra's sparse-graph speed. It is the asymptotically best APSP for sparse, negative-weight graphs and shows up in network analysis, transit planning, and any flow problem with potentials.

## intuition
Negative weights break Dijkstra because the greedy "settled" invariant assumes adding an edge cannot shorten a path. Johnson rescues Dijkstra by *re-pricing* every edge so all weights become non-negative while preserving the *relative* lengths of paths. The trick is to give each vertex a "potential" h(v) — the shortest distance from a fresh super-source — and replace weight w(u,v) with w(u,v) + h(u) - h(v).

## visualization
Add a virtual vertex s connected to every node by a zero-weight edge. Run Bellman-Ford from s; record h(v) for each vertex. Replace every original edge (u,v) with weight w'(u,v) = w(u,v) + h(u) - h(v). The triangle inequality guarantees w' is non-negative. Run Dijkstra from each source u; the true distance from u to v is d'(u,v) - h(u) + h(v).

## bruteForce
Run Bellman-Ford from every vertex. That gives O(V^2 * E) — for a sparse graph with E close to V, this is O(V^3), no better than Floyd-Warshall, and far slower in practice because each Bellman-Ford pass touches every edge V times.

## optimal
Three phases: (1) add a super-source s with zero-weight edges to all vertices and run Bellman-Ford once from s to compute h(v) — also catches negative cycles; (2) reweight every edge by w'(u,v) = w(u,v) + h(u) - h(v); (3) run Dijkstra (with a binary heap) from every original vertex on the reweighted graph, then translate distances back. Bellman-Ford is O(V*E); the V Dijkstra runs total O(V * E log V), which dominates.

## complexity
time: O(V * E log V) with a binary heap; O(V^2 log V + V * E) with a Fibonacci heap.
space: O(V + E) for the graph plus O(V) for potentials.
notes: On dense graphs (E ~ V^2) Floyd-Warshall's O(V^3) is competitive and simpler; Johnson wins when E << V^2.

## pitfalls
- Forgetting to translate distances back: the reported d'(u,v) is *reweighted* distance, not the true one.
- Skipping the super-source step on a disconnected graph: some vertices have no potential and the reweighting silently fails.
- Treating a negative cycle as a recoverable case: Bellman-Ford must abort and report it; Dijkstra cannot handle it.
- Using floating-point weights without tolerance — comparisons after reweighting drift.

## interviewTips
- Lead with the trade-off: "Floyd-Warshall is O(V^3) always; Johnson is O(V*E log V) — better on sparse graphs with negative edges."
- Be ready to explain *why* the reweighting preserves shortest paths — the h(u) and h(v) terms telescope along any path so only h(source) and h(target) survive.
- Mention Bellman-Ford's role as a negative-cycle detector — it's often the real reason to reach for Johnson's over Dijkstra alone.

## code.python
```python
import heapq

def johnson(n, edges):
    INF = float('inf')
    h = [0] * (n + 1)
    aug = edges + [(n, v, 0) for v in range(n)]
    for _ in range(n):
        updated = False
        for u, v, w in aug:
            if h[u] + w < h[v]:
                h[v] = h[u] + w
                updated = True
        if not updated:
            break
    for u, v, w in aug:
        if h[u] + w < h[v]:
            return None
    graph = [[] for _ in range(n)]
    for u, v, w in edges:
        graph[u].append((v, w + h[u] - h[v]))
    dist = [[INF] * n for _ in range(n)]
    for s in range(n):
        dist[s][s] = 0
        pq = [(0, s)]
        while pq:
            d, u = heapq.heappop(pq)
            if d > dist[s][u]:
                continue
            for v, w in graph[u]:
                nd = d + w
                if nd < dist[s][v]:
                    dist[s][v] = nd
                    heapq.heappush(pq, (nd, v))
        for v in range(n):
            if dist[s][v] < INF:
                dist[s][v] += h[v] - h[s]
    return dist
```

## code.javascript
```javascript
function johnson(n, edges) {
  const INF = Infinity;
  const h = new Array(n + 1).fill(0);
  const aug = edges.concat(Array.from({ length: n }, (_, v) => [n, v, 0]));
  for (let i = 0; i < n; i++) {
    let updated = false;
    for (const [u, v, w] of aug) {
      if (h[u] + w < h[v]) { h[v] = h[u] + w; updated = true; }
    }
    if (!updated) break;
  }
  for (const [u, v, w] of aug) if (h[u] + w < h[v]) return null;
  const graph = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) graph[u].push([v, w + h[u] - h[v]]);
  const dist = Array.from({ length: n }, () => new Array(n).fill(INF));
  for (let s = 0; s < n; s++) {
    dist[s][s] = 0;
    const pq = [[0, s]];
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      const [d, u] = pq.shift();
      if (d > dist[s][u]) continue;
      for (const [v, w] of graph[u]) {
        const nd = d + w;
        if (nd < dist[s][v]) { dist[s][v] = nd; pq.push([nd, v]); }
      }
    }
    for (let v = 0; v < n; v++) if (dist[s][v] < INF) dist[s][v] += h[v] - h[s];
  }
  return dist;
}
```

## code.java
```java
import java.util.*;

public int[][] johnson(int n, int[][] edges) {
    final int INF = Integer.MAX_VALUE / 4;
    int[] h = new int[n + 1];
    int[][] aug = new int[edges.length + n][3];
    System.arraycopy(edges, 0, aug, 0, edges.length);
    for (int v = 0; v < n; v++) aug[edges.length + v] = new int[]{n, v, 0};
    for (int i = 0; i < n; i++) {
        boolean upd = false;
        for (int[] e : aug) if (h[e[0]] + e[2] < h[e[1]]) { h[e[1]] = h[e[0]] + e[2]; upd = true; }
        if (!upd) break;
    }
    for (int[] e : aug) if (h[e[0]] + e[2] < h[e[1]]) return null;
    List<int[]>[] g = new List[n];
    for (int i = 0; i < n; i++) g[i] = new ArrayList<>();
    for (int[] e : edges) g[e[0]].add(new int[]{e[1], e[2] + h[e[0]] - h[e[1]]});
    int[][] dist = new int[n][n];
    for (int[] row : dist) Arrays.fill(row, INF);
    for (int s = 0; s < n; s++) {
        dist[s][s] = 0;
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.offer(new int[]{0, s});
        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            if (cur[0] > dist[s][cur[1]]) continue;
            for (int[] nb : g[cur[1]]) {
                int nd = cur[0] + nb[1];
                if (nd < dist[s][nb[0]]) { dist[s][nb[0]] = nd; pq.offer(new int[]{nd, nb[0]}); }
            }
        }
        for (int v = 0; v < n; v++) if (dist[s][v] < INF) dist[s][v] += h[v] - h[s];
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

vector<vector<int>> johnson(int n, vector<tuple<int,int,int>>& edges) {
    const int INF = INT_MAX / 4;
    vector<int> h(n + 1, 0);
    auto aug = edges;
    for (int v = 0; v < n; v++) aug.push_back({n, v, 0});
    for (int i = 0; i < n; i++) {
        bool upd = false;
        for (auto& [u, v, w] : aug)
            if (h[u] + w < h[v]) { h[v] = h[u] + w; upd = true; }
        if (!upd) break;
    }
    for (auto& [u, v, w] : aug)
        if (h[u] + w < h[v]) return {};
    vector<vector<pair<int,int>>> g(n);
    for (auto& [u, v, w] : edges) g[u].push_back({v, w + h[u] - h[v]});
    vector<vector<int>> dist(n, vector<int>(n, INF));
    for (int s = 0; s < n; s++) {
        dist[s][s] = 0;
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
        pq.push({0, s});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[s][u]) continue;
            for (auto& [v, w] : g[u]) {
                int nd = d + w;
                if (nd < dist[s][v]) { dist[s][v] = nd; pq.push({nd, v}); }
            }
        }
        for (int v = 0; v < n; v++) if (dist[s][v] < INF) dist[s][v] += h[v] - h[s];
    }
    return dist;
}
```
