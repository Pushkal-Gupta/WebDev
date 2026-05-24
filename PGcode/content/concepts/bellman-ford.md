---
slug: bellman-ford
module: graphs
title: Bellman-Ford Algorithm
subtitle: Single-source shortest paths in graphs with negative weights.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms 4e: Shortest Paths"
    url: "https://algs4.cs.princeton.edu/44sp/"
    type: book
  - title: "cp-algorithms — Bellman-Ford Algorithm"
    url: "https://cp-algorithms.com/graph/bellman_ford.html"
    type: blog
  - title: "TheAlgorithms/Python — graphs"
    url: "https://github.com/TheAlgorithms/Python/tree/master/graphs"
    type: repo
status: published
---

## intro
Dijkstra's algorithm wins on speed but fails on negative-weight edges. Bellman-Ford is the slower, more general solution: it computes single-source shortest paths in any directed graph that lacks a *negative-weight cycle* reachable from the source. As a bonus, it detects when such a cycle exists, which is useful for arbitrage problems, currency conversion graphs, and constraint satisfaction.

## whyItMatters
Negative edges show up naturally in problems framed as cost-vs-reward (e.g., currency conversion, financial arbitrage, constraint graphs). Bellman-Ford handles them and detects cycles that would otherwise loop forever. It's also the conceptual ancestor of the distance-vector routing protocols (RIP), so it has both interview and systems relevance.

## intuition
Any shortest path uses at most `V - 1` edges (any longer path would repeat a vertex, which a shortest path never does in a graph without negative cycles). So if we relax every edge `V - 1` times, every shortest path has had a chance to be discovered. A `V`-th relaxation pass that *still* improves a distance proves a negative-weight cycle exists.

## visualization
Imagine waves of updates rippling outward from the source. Pass 1 finds every shortest path of length 1. Pass 2 finds every shortest path of length ≤ 2 (combining pass-1 results with one more edge). After `V - 1` passes, all true shortest paths are settled. Each pass touches every edge exactly once.

## bruteForce
Enumerate every simple path from source to target and take the minimum. Combinatorial explosion: factorial in `V`. Useless beyond tiny graphs, but worth mentioning as the contrast: Bellman-Ford is the polynomial relaxation of this idea.

## optimal
Initialize `dist[source] = 0`, all others `+∞`. Repeat `V - 1` times: for every edge `(u, v, w)`, if `dist[u] + w < dist[v]`, update `dist[v]`. After `V - 1` passes, one more relaxation that succeeds anywhere proves a reachable negative cycle. Optionally track `prev[]` to reconstruct paths.

A common optimization: stop early if a full pass makes no relaxations — the algorithm has converged. This brings practical performance closer to `O(V·E)` only in adversarial graphs.

## complexity
time: O(V · E)
space: O(V)
notes: V passes × E edge relaxations per pass = V·E. Far worse than Dijkstra's `O((V + E) log V)` with a heap, but Dijkstra cannot handle negative edges, period. For graphs with non-negative weights, prefer Dijkstra.

## pitfalls
- Confusing "negative edge" (fine) with "negative cycle reachable from source" (fatal — no shortest path exists).
- Off-by-one: relax exactly `V - 1` times, not `V`. The `V`-th pass is reserved for cycle detection.
- For path reconstruction in the presence of cycles: trace `prev[]` from the affected vertex back at most `V` steps to find a vertex *on* the cycle, then walk forward.
- Numerical: with floating-point weights, never test exact equality on relaxations — use a tolerance, otherwise oscillation can mimic a negative cycle.

## interviewTips
- Lead with the discriminator: "Bellman-Ford because Dijkstra can't handle negative weights."
- If the interviewer constrains weights to non-negative, switch to Dijkstra immediately — using Bellman-Ford when Dijkstra suffices is a red flag.
- Mention SPFA as an optimization (queue-based, average case much better, worst case identical) but don't lead with it; many interviewers want canonical Bellman-Ford first.
- For the *detect arbitrage* framing: edge weights are `-log(rate)`, and a negative cycle proves arbitrage exists.

## code.python
```python
def bellman_ford(n, edges, source):
    INF = float('inf')
    dist = [INF] * n
    dist[source] = 0
    for _ in range(n - 1):
        changed = False
        for u, v, w in edges:
            if dist[u] != INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed:
            break
    # Negative-cycle check
    for u, v, w in edges:
        if dist[u] != INF and dist[u] + w < dist[v]:
            return None  # negative cycle reachable
    return dist
```

## code.javascript
```javascript
function bellmanFord(n, edges, source) {
  const INF = Infinity;
  const dist = new Array(n).fill(INF);
  dist[source] = 0;
  for (let i = 0; i < n - 1; i++) {
    let changed = false;
    for (const [u, v, w] of edges) {
      if (dist[u] !== INF && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (const [u, v, w] of edges) {
    if (dist[u] !== INF && dist[u] + w < dist[v]) return null;
  }
  return dist;
}
```

## code.java
```java
public int[] bellmanFord(int n, int[][] edges, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;
    for (int i = 0; i < n - 1; i++) {
        boolean changed = false;
        for (int[] e : edges) {
            int u = e[0], v = e[1], w = e[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                changed = true;
            }
        }
        if (!changed) break;
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
vector<long long> bellmanFord(int n, vector<tuple<int,int,int>>& edges, int source) {
    const long long INF = LLONG_MAX;
    vector<long long> dist(n, INF);
    dist[source] = 0;
    for (int i = 0; i < n - 1; i++) {
        bool changed = false;
        for (auto& [u, v, w] : edges) {
            if (dist[u] != INF && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                changed = true;
            }
        }
        if (!changed) break;
    }
    for (auto& [u, v, w] : edges) {
        if (dist[u] != INF && dist[u] + w < dist[v]) return {};  // negative cycle
    }
    return dist;
}
```
