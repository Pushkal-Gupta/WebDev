---
slug: bellman-ford-detection
module: graphs-shortest-paths
title: Bellman-Ford Negative Cycle Detection
subtitle: Use a final relaxation pass to prove a graph has no negative-weight cycle reachable from the source.
difficulty: Advanced
position: 18
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms 4e: Shortest Paths"
    url: "https://algs4.cs.princeton.edu/44sp/"
    type: book
  - title: "cp-algorithms — Bellman-Ford Algorithm"
    url: "https://cp-algorithms.com/graph/bellman_ford.html"
    type: blog
  - title: "TheAlgorithms/Python — graphs (Bellman-Ford with negative-cycle detection)"
    url: "https://github.com/TheAlgorithms/Python/tree/master/graphs"
    type: repo
status: published
---

## intro
Bellman-Ford computes single-source shortest paths even when edges carry negative weights, something Dijkstra cannot do. Its quieter superpower is that, after the standard `V - 1` relaxation rounds, one more pass tells you whether a negative cycle is reachable from the source. If any edge still relaxes, the graph has no valid shortest-path solution at all — the distance can be driven to negative infinity by looping forever.

## whyItMatters
Negative cycles destroy the very notion of a shortest path; any algorithm that returns "an answer" in their presence is silently wrong. Arbitrage detection in currency exchange graphs, profitable cycles in trading networks, and feasibility checks in difference constraint systems all reduce to "is there a negative cycle?" Bellman-Ford answers this in O(V * E) with no extra data structures beyond a distance array.

## intuition
Shortest simple paths use at most `V - 1` edges. After `V - 1` full relaxation rounds, every legitimate shortest distance has settled. If a `V`-th round still finds an edge `(u, v, w)` where `dist[u] + w < dist[v]`, that edge must lie on a cycle that keeps shrinking the distance — a negative cycle. The proof is contrapositive: if no negative cycle exists, all shortest paths are simple, all simple paths have at most `V - 1` edges, and `V - 1` rounds suffice. Any further improvement is evidence of an infinite descent.

## visualization
```
Edges:  A --(1)--> B,  B --(-3)--> C,  C --(1)--> A,  A --(4)--> D
Source: A  (V = 4, so V - 1 = 3 rounds)

Round 1: dist = [A:0, B:1, C:-2, D:4]
Round 2: dist = [A:-1, B:0, C:-3, D:3]
Round 3: dist = [A:-2, B:-1, C:-4, D:2]
Round 4 (detection): A->B relaxes again (-1 + 1 = 0 < -1). Cycle found.
```
The cycle A -> B -> C -> A has total weight `-1`, so every loop shaves another unit off every reachable distance.

## bruteForce
Enumerate every simple cycle (DFS with a recursion stack) and sum its edge weights. Correct, but the count of simple cycles can be exponential — `O(V!)` in dense graphs — so it dies on anything beyond a toy. Worse, you must do it per connected component and remember to ignore self-loops with non-negative weight. Almost never the right answer in an interview.

## optimal
Run standard Bellman-Ford: initialize `dist[source] = 0`, all others to infinity, then repeat `V - 1` times: for each edge `(u, v, w)`, if `dist[u] + w < dist[v]`, set `dist[v] = dist[u] + w`. After the loop, do one extra pass over all edges. If any edge still relaxes, return "negative cycle detected." To recover *which* nodes lie on or are reachable from such a cycle, mark every relaxed `v` and BFS forward from those marks.

```
relax_all_edges(dist, edges):
  for (u, v, w) in edges:
    if dist[u] + w < dist[v]:
      dist[v] = dist[u] + w
      parent[v] = u

bellman_ford(V, edges, src):
  dist = [INF] * V; dist[src] = 0
  repeat V - 1 times: relax_all_edges(dist, edges)
  for (u, v, w) in edges:
    if dist[u] != INF and dist[u] + w < dist[v]:
      return NEGATIVE_CYCLE
  return dist
```

## complexity
time: O(V * E)
space: O(V)
notes: Detection adds a single `O(E)` pass on top of the main loop, so it does not change the asymptotic bound. SPFA (queue-based Bellman-Ford) is often faster in practice and detects cycles when any vertex is relaxed more than `V` times, but its worst case remains `O(V * E)`.

## pitfalls
- Skipping the `dist[u] != INF` guard during detection — `INF + w` wraps in fixed-width integers and produces false positives.
- Running only `V - 1` rounds and concluding "no cycle" without the extra pass. The extra pass is the entire detection step.
- Reporting any negative cycle in the graph when the prompt asks about cycles *reachable from the source*. An unreachable cycle does not invalidate the source's shortest paths.
- Using floating-point edge weights without an epsilon — accumulated error can fake a relaxation.

## interviewTips
- Name the bound: "V - 1 relaxations cover all simple paths; a V-th relaxation proves a cycle."
- Connect it to arbitrage: log-transform exchange rates so multiplication becomes addition, then negative-cycle detection finds profit loops.
- Mention SPFA as a practical speedup and state its detection rule (vertex relaxed > V times).
- If asked to *recover* the cycle, walk `parent` pointers from a relaxed vertex `V` steps back (to land inside the cycle), then follow until you return.

## code.python
```python
def bellman_ford_detect(n, edges, src):
    INF = float('inf')
    dist = [INF] * n
    dist[src] = 0
    for _ in range(n - 1):
        updated = False
        for u, v, w in edges:
            if dist[u] != INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                updated = True
        if not updated:
            break
    for u, v, w in edges:
        if dist[u] != INF and dist[u] + w < dist[v]:
            return None
    return dist
```

## code.javascript
```javascript
function bellmanFordDetect(n, edges, src) {
  const INF = Infinity;
  const dist = new Array(n).fill(INF);
  dist[src] = 0;
  for (let i = 0; i < n - 1; i++) {
    let updated = false;
    for (const [u, v, w] of edges) {
      if (dist[u] !== INF && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        updated = true;
      }
    }
    if (!updated) break;
  }
  for (const [u, v, w] of edges) {
    if (dist[u] !== INF && dist[u] + w < dist[v]) return null;
  }
  return dist;
}
```

## code.java
```java
public int[] bellmanFordDetect(int n, int[][] edges, int src) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    for (int i = 0; i < n - 1; i++) {
        boolean updated = false;
        for (int[] e : edges) {
            int u = e[0], v = e[1], w = e[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                updated = true;
            }
        }
        if (!updated) break;
    }
    for (int[] e : edges) {
        int u = e[0], v = e[1], w = e[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) return null;
    }
    return dist;
}
```

## code.cpp
```cpp
vector<long long> bellmanFordDetect(int n, vector<array<int,3>>& edges, int src) {
    const long long INF = LLONG_MAX;
    vector<long long> dist(n, INF);
    dist[src] = 0;
    for (int i = 0; i < n - 1; ++i) {
        bool updated = false;
        for (auto& e : edges) {
            int u = e[0], v = e[1], w = e[2];
            if (dist[u] != INF && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                updated = true;
            }
        }
        if (!updated) break;
    }
    for (auto& e : edges) {
        int u = e[0], v = e[1], w = e[2];
        if (dist[u] != INF && dist[u] + w < dist[v]) return {};
    }
    return dist;
}
```
