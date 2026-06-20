---
slug: graph-floyd-warshall
module: graphs-shortest-paths
title: Floyd-Warshall (All-Pairs Shortest Paths)
subtitle: O(V³) dynamic programming over all intermediate vertices. Detects negative cycles. The 6-line algorithm dense-graph routing depends on.
difficulty: Intermediate
position: 65
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — All-pairs shortest paths"
    url: "https://walkccc.me/CLRS/Chap25/"
    type: book
  - title: "cp-algorithms — Floyd-Warshall"
    url: "https://cp-algorithms.com/graph/all-pair-shortest-path-floyd-warshall.html"
    type: blog
  - title: "TheAlgorithms/Python — Floyd-Warshall"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/bellman_ford.py"
    type: repo
status: published
---

## intro
**Floyd-Warshall** computes shortest paths between *every* pair of vertices in a weighted directed graph in O(V³). Three nested loops over (intermediate, source, destination). Handles negative weights (unlike Dijkstra) and detects negative cycles. Fits in ~6 lines of code. The textbook all-pairs algorithm.

## whyItMatters
- **Dense graphs**: when E ≈ V², running V Dijkstras costs O(V²·V log V) ≈ O(V³ log V) — worse than Floyd-Warshall's O(V³).
- **Negative weights**: works where Dijkstra doesn't.
- **Negative cycle detection**: after the algorithm, if `dist[v][v] < 0` for any v, a negative cycle is reachable.
- **Transitive closure**: same shape, replace `min(+, +)` with `or(and, and)` → Warshall's algorithm for reachability matrix.
- **Network routing** in small dense topologies (intra-datacenter), **regret matching** in game theory, **graph kernels** in ML.

## intuition
Define `dp[k][i][j]` = shortest path from `i` to `j` using only vertices `0..k` as intermediates.

Transition: either the path doesn't use vertex `k` (`dp[k-1][i][j]`) or it does (`dp[k-1][i][k] + dp[k-1][k][j]`). Take the min.

Key insight: the `k` dimension can be reused in place. After all k iterations, `dp[i][j]` holds the shortest path using ANY subset of vertices as intermediates — which is the shortest path overall.

## visualization
```
Graph (directed, 4 vertices):
  0 → 1 weight 3
  0 → 3 weight 7
  1 → 0 weight 8
  1 → 2 weight 2
  2 → 0 weight 5
  2 → 3 weight 1
  3 → 2 weight 2

Init dist matrix (∞ for missing):
        0    1    2    3
    0   0    3   ∞    7
    1   8    0    2   ∞
    2   5   ∞    0    1
    3  ∞   ∞    2    0

After k=0 (allow vertex 0 as intermediate):
  dist[1][3] = min(∞, dist[1][0]+dist[0][3]) = min(∞, 8+7) = 15
  dist[2][1] = min(∞, dist[2][0]+dist[0][1]) = min(∞, 5+3) = 8
        0    1    2    3
    0   0    3   ∞    7
    1   8    0    2   15
    2   5    8    0    1
    3  ∞   ∞    2    0

After k=1: dist[0][2] = min(∞, 3+2) = 5
After k=2: dist[3][0] = min(∞, 2+5) = 7; dist[3][1] = min(∞, 2+8) = 10
After k=3: dist[1][3] = min(15, 2+1) = 3 (path 1→2→3)

Final:
        0    1    2    3
    0   0    3    5    6
    1   6    0    2    3
    2   5    8    0    1
    3   7   10    2    0
```

## bruteForce
**Run BFS / DFS from each vertex**: O(V·(V+E)). Faster for sparse graphs.

**Run Dijkstra from each vertex (V times)**: O(V·(V+E)·log V). Best for sparse non-negative graphs.

**Run Bellman-Ford from each vertex (V times)**: O(V²·E). Handles negative weights but slower than Floyd-Warshall on dense graphs.

Floyd-Warshall is the dense-graph + negative-weight answer.

## optimal
**Six-line core**:
```python
def floyd_warshall(n, dist):
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    return dist
```

**Negative-cycle detection**: after the loop, if any `dist[v][v] < 0`, vertex `v` lies on a negative cycle (because going around the cycle made the "self-distance" negative).

**Path reconstruction**: maintain a parent matrix `next_hop[i][j]` updated whenever we relax via k:
```python
if dist[i][k] + dist[k][j] < dist[i][j]:
    dist[i][j] = dist[i][k] + dist[k][j]
    next_hop[i][j] = next_hop[i][k]
```
Reconstruct: walk `i → next_hop[i][j] → next_hop[next_hop[i][j]][j] → ... → j`.

**Transitive closure variant** (Warshall, 1962):
```python
for k in range(n):
    for i in range(n):
        for j in range(n):
            reach[i][j] = reach[i][j] or (reach[i][k] and reach[k][j])
```

**Cache-friendly loop order**: outer-k is mandatory (it's the DP dimension). Inner i, j order doesn't affect correctness; row-major access is faster than column-major.

## complexity
- **Time:** O(V³). For V = 500 → 1.25×10⁸ ops, ~1s in C++.
- **Space:** O(V²). For V = 10⁴ → 100MB+ — at the edge of viability.
- **Negative-cycle detection:** O(V) extra after the main loop.

## pitfalls
- **Wrong loop order**: k must be the outermost loop. Putting i or j outside breaks the DP recurrence. Common bug.
- **Initialization missing self-loops as 0**: `dist[i][i]` must start at 0, not ∞.
- **Overflow when adding ∞ + finite**: in C++, use `INT_MAX / 2` so additions don't overflow. In Python, `float('inf')` is safe.
- **Treating directed as undirected**: forgetting to set `dist[v][u] = dist[u][v]` for undirected input.
- **No negative-cycle handling**: distances pass through negative cycles can go to -∞; cap or detect.
- **Modifying the matrix you read from**: O(V²) extra space for "previous round" matrix is unnecessary — the in-place version is provably correct.

## interviewTips
- For "all-pairs shortest paths in a small graph" → Floyd-Warshall.
- Cite **V ≤ 400-500** as the rule of thumb; beyond that, V Dijkstras may beat it.
- For senior interviews, discuss **transitive closure**, **Johnson's algorithm** (V Dijkstras with re-weighting → O(V²log V + VE)), **APSP via min-plus matrix multiplication**, **distance oracles** for very large graphs.

## code.python
```python
def floyd_warshall(dist):
    n = len(dist)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    # Negative-cycle detection
    for v in range(n):
        if dist[v][v] < 0: return None
    return dist
```

## code.javascript
```javascript
function floydWarshall(dist) {
  const n = dist.length;
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (dist[i][k] + dist[k][j] < dist[i][j])
          dist[i][j] = dist[i][k] + dist[k][j];
  for (let v = 0; v < n; v++) if (dist[v][v] < 0) return null;
  return dist;
}
```

## code.java
```java
public int[][] floydWarshall(int[][] dist) {
    int n = dist.length;
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (dist[i][k] != Integer.MAX_VALUE && dist[k][j] != Integer.MAX_VALUE
                    && dist[i][k] + dist[k][j] < dist[i][j])
                    dist[i][j] = dist[i][k] + dist[k][j];
    for (int v = 0; v < n; v++) if (dist[v][v] < 0) return null;
    return dist;
}
```

## code.cpp
```cpp
vector<vector<int>> floydWarshall(vector<vector<int>>& dist) {
    int n = dist.size();
    const int INF = INT_MAX / 2;
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (dist[i][k] < INF && dist[k][j] < INF
                    && dist[i][k] + dist[k][j] < dist[i][j])
                    dist[i][j] = dist[i][k] + dist[k][j];
    for (int v = 0; v < n; v++) if (dist[v][v] < 0) return {};
    return dist;
}
```
