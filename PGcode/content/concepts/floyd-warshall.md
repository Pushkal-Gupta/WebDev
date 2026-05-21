---
slug: floyd-warshall
module: graphs
title: Floyd-Warshall
subtitle: All-pairs shortest paths in O(V^3) — three nested loops, handles negative edges (but not negative cycles).
difficulty: Advanced
position: 26
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Floyd (1962); Warshall (1962) — Algorithm 97"
    url: ""
status: published
---

## intro
Floyd-Warshall finds the shortest distance between **every pair of vertices** in a weighted graph in O(V^3) using dynamic programming. The single inner update is gloriously simple: try every node as an intermediate hop. The algorithm handles negative edges (Dijkstra cannot) and even detects negative cycles (a node whose self-distance becomes negative).

## whyItMatters
Dijkstra from every node is O(V·(V+E)·log V) — usually faster on sparse graphs. Floyd-Warshall is O(V^3) regardless of edge count. So Floyd-Warshall wins on **dense graphs** (E ≈ V^2) or whenever code simplicity matters more than a constant factor. It's also the canonical way to compute the transitive closure of a relation, find graph diameter, and solve "shortest path between every airport" problems.

## intuition
Build `dist[i][j]` = shortest path from `i` to `j` using only nodes `0..k` as intermediates. Start with `k = -1` (direct edges only). For each new `k`, either keep the existing best or route through `k`: `dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])`. After all k, every node has been considered as an intermediate hop and `dist[i][j]` is the true shortest path.

## visualization
```
Start (k = -1):                After k = 0:                   After k = 2 (all):
  0  1  ∞  2                     0  1  ∞  2                     0  1  4  2
  ∞  0  3  ∞                     ∞  0  3  ∞                     5  0  3  6
  ∞  ∞  0  1                     ∞  ∞  0  1                     ∞  ∞  0  1
  ∞  ∞  ∞  0                     ∞  ∞  ∞  0                     ∞  ∞  ∞  0

Each pass relaxes every (i,j) using node k as a possible intermediate.
```

## bruteForce
Run Dijkstra V times from each source — O(V·(V+E)·log V). Or run Bellman-Ford V times — O(V·V·E). Both work but are messier to code than three nested loops.

## optimal
```
init dist as the adjacency matrix:
    dist[i][j] = weight(i, j) if edge, 0 if i == j, infinity otherwise

for k from 0 to V-1:
    for i from 0 to V-1:
        for j from 0 to V-1:
            if dist[i][k] + dist[k][j] < dist[i][j]:
                dist[i][j] = dist[i][k] + dist[k][j]
                next[i][j] = next[i][k]    # to reconstruct paths
```

To **reconstruct a path** from i to j, walk through the `next` matrix until you reach j.

To **detect a negative cycle**, check if any `dist[i][i] < 0` after the algorithm — that means some node can reach itself with negative total cost.

## complexity
- **Time**: O(V^3) — three nested loops.
- **Space**: O(V^2) for the distance matrix.
- **Negative weights**: OK, as long as there's no negative cycle.
- **Negative cycle detection**: checks `dist[i][i] < 0` after the run.

## pitfalls
- **Overflow with `∞`**: using `INT_MAX` and adding to it overflows. Use `INT_MAX / 2` as sentinel or skip pairs where either dist is infinity.
- **Loop order matters**: `k` must be the outermost loop. Swapping it inside reads stale values and produces wrong answers.
- **Self-loops with positive weight**: usually you want `dist[i][i] = 0` regardless of self-loops; explicitly initialize the diagonal.
- **Memory**: O(V^2) = ~80MB for V = 10k integers. Doesn't scale to very large graphs.
- **Undirected vs directed**: for undirected graphs, fill both `dist[i][j]` and `dist[j][i]` from each edge.

## interviewTips
- For "shortest path between every pair of nodes in a small graph (V ≤ 500)," it's Floyd-Warshall.
- Mention the **k as outer loop** invariant — it's the easiest place to mess up.
- Compare with Dijkstra (single-source, no negatives) and Bellman-Ford (single-source, negatives OK).
- For senior-level, mention **transitive closure** (Warshall's original variant, boolean OR instead of min/+) and **Johnson's algorithm** (V·Dijkstra after reweighting — faster on sparse graphs).

## code.python
```python
def floyd_warshall(n, edges):
    INF = float('inf')
    dist = [[INF] * n for _ in range(n)]
    for i in range(n): dist[i][i] = 0
    for u, v, w in edges: dist[u][v] = min(dist[u][v], w)
    for k in range(n):
        for i in range(n):
            if dist[i][k] == INF: continue
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    # Negative cycle?
    has_neg = any(dist[i][i] < 0 for i in range(n))
    return dist, has_neg

edges = [(0,1,1), (0,3,2), (1,2,3), (2,3,1)]
dist, neg = floyd_warshall(4, edges)
for row in dist: print(row)
```

## code.javascript
```javascript
function floydWarshall(n, edges) {
  const INF = Infinity;
  const dist = Array.from({ length: n }, () => Array(n).fill(INF));
  for (let i = 0; i < n; i++) dist[i][i] = 0;
  for (const [u, v, w] of edges) dist[u][v] = Math.min(dist[u][v], w);
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      if (dist[i][k] !== INF)
        for (let j = 0; j < n; j++)
          if (dist[i][k] + dist[k][j] < dist[i][j])
            dist[i][j] = dist[i][k] + dist[k][j];
  const hasNeg = dist.some((row, i) => row[i] < 0);
  return { dist, hasNeg };
}
```

## code.java
```java
import java.util.*;
class FloydWarshall {
    static long[][] run(int n, int[][] edges) {
        final long INF = Long.MAX_VALUE / 4;
        long[][] dist = new long[n][n];
        for (long[] row : dist) Arrays.fill(row, INF);
        for (int i = 0; i < n; i++) dist[i][i] = 0;
        for (var e : edges) dist[e[0]][e[1]] = Math.min(dist[e[0]][e[1]], e[2]);
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++) {
                if (dist[i][k] >= INF) continue;
                for (int j = 0; j < n; j++)
                    if (dist[i][k] + dist[k][j] < dist[i][j])
                        dist[i][j] = dist[i][k] + dist[k][j];
            }
        return dist;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <climits>
std::vector<std::vector<long long>> floydWarshall(int n,
        const std::vector<std::tuple<int,int,int>>& edges) {
    const long long INF = LLONG_MAX / 4;
    std::vector<std::vector<long long>> dist(n, std::vector<long long>(n, INF));
    for (int i = 0; i < n; i++) dist[i][i] = 0;
    for (auto& [u, v, w] : edges) if (w < dist[u][v]) dist[u][v] = w;
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++) {
            if (dist[i][k] >= INF) continue;
            for (int j = 0; j < n; j++)
                if (dist[i][k] + dist[k][j] < dist[i][j])
                    dist[i][j] = dist[i][k] + dist[k][j];
        }
    return dist;
}
```
