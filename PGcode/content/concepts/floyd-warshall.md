---
slug: floyd-warshall
module: graphs-shortest-paths
title: Floyd-Warshall
subtitle: All-pairs shortest paths in O(V^3) — three nested loops, handles negative edges (but not negative cycles).
difficulty: Advanced
position: 26
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
Floyd-Warshall finds the shortest distance between **every pair of vertices** in a weighted graph in O(V^3) using dynamic programming. The single inner update is gloriously simple: try every node as an intermediate hop. The algorithm handles negative edges (Dijkstra cannot) and even detects negative cycles (a node whose self-distance becomes negative).

## whyItMatters
- **All-pairs shortest paths on dense graphs**: Floyd-Warshall (Floyd 1962, Warshall 1962, Roy 1959 independently) is the textbook APSP for E ≈ V². Running Dijkstra V times costs O(V(V + E) log V) ≈ O(V³ log V) on dense graphs — Floyd's flat O(V³) wins with no log factor.
- **Transitive closure of a relation**: Warshall's original formulation computes reachability in O(V³); used in database query optimisers (Datalog, recursive CTEs), constraint propagation, and type-system subtyping checks.
- **Graph diameter and eccentricity**: max over all pairs of shortest distances — a single Floyd-Warshall pass yields both.
- **Routing protocols on small networks**: legacy distance-vector routing (RIP) and intra-AS routing in small ISPs use Floyd-Warshall-style relaxation for full routing tables.
- **Bioinformatics**: protein-interaction-network analysis computes pairwise distances on networks of a few thousand nodes — Floyd's simplicity (three loops) beats Dijkstra's per-source heap overhead.
- **Network simulation and queueing-theory tools** apply Floyd-Warshall when shortest paths must be precomputed once for many subsequent queries.
- The algorithm handles **negative edges** (Dijkstra cannot) and detects negative cycles (any `dist[i][i] < 0` after the run), which is why some implementations of Bellman-Ford-equivalent functionality just reach for Floyd on small graphs.

## intuition
The algorithm exists because computing shortest paths between every pair of vertices naively requires V separate single-source shortest-path runs — for negative-edge graphs, that means V Bellman-Ford runs at O(V·V·E) = O(V³E), hopelessly slow. Floyd-Warshall achieves O(V³) regardless of edge count by exploiting a clever DP recurrence over *which vertices can serve as intermediate hops*.

The decisive observation: define `dist[k][i][j]` = shortest path from i to j using only vertices `{0, 1, ..., k}` as possible intermediates. With k = −1 (no intermediates allowed), `dist[i][j]` is just the direct edge weight (or infinity). As k grows, each new vertex provides an additional routing option: either continue using the best path that ignores k (`dist[k-1][i][j]`), or route through k (`dist[k-1][i][k] + dist[k-1][k][j]`). Take the minimum. After processing all V vertices as potential intermediates, `dist[V-1][i][j]` is the true shortest distance.

The recurrence is `dist[k][i][j] = min(dist[k-1][i][j], dist[k-1][i][k] + dist[k-1][k][j])`. Crucially, only the previous k slice is needed, so the algorithm can be space-compressed to a single 2D matrix updated in place — provided the outer loop is over k, the middle over i, and the inner over j. The loop order matters: if k is not the outermost loop, the in-place updates read partially-updated values and produce wrong answers.

The algorithm is also the canonical way to compute the **transitive closure** of a relation: replace `min` with `OR` and `+` with `AND`, treat weights as booleans (edge / no edge), and the same triple-loop computes reachability. This generalisation (over any closed semiring) is why Floyd-Warshall is a textbook example of "algebraic generalisation of shortest paths".

Negative edges are fine (Dijkstra would break), but negative cycles make shortest paths undefined; the algorithm detects them by checking `dist[i][i] < 0` for any i after termination — a node that can reach itself with negative cost lies on a negative cycle.

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
**Technique: Floyd-Warshall DP with k as the outer loop, space-compressed to a single 2D matrix.** O(V³) time, O(V²) space. Optimal for the dense-graph APSP problem in the comparison model — any algorithm computing V² shortest distances must do at least Ω(V² + work to discover paths) operations, and Floyd's three-loop structure saturates this.

```python
def floyd_warshall(n, edges):
    INF = float('inf')
    dist = [[INF] * n for _ in range(n)]
    nxt  = [[None] * n for _ in range(n)]            # for path reconstruction
    for i in range(n):
        dist[i][i] = 0
    for u, v, w in edges:
        dist[u][v] = w                                # init: direct edges
        nxt[u][v] = v

    for k in range(n):                                # k MUST be outermost
        for i in range(n):
            if dist[i][k] == INF: continue            # micro-optimisation
            for j in range(n):
                via = dist[i][k] + dist[k][j]
                if via < dist[i][j]:
                    dist[i][j] = via
                    nxt[i][j] = nxt[i][k]              # path: i -> ... -> k -> ... -> j

    # Negative-cycle detection
    for i in range(n):
        if dist[i][i] < 0:
            return None                                # negative cycle exists
    return dist, nxt
```

Key lines: `for k in range(n)` is the outermost loop — this is the entire correctness condition. Swapping k inward (e.g., `for i, for j, for k`) reads partially-updated values during the in-place update and produces wrong answers. The middle and inner loops can be swapped freely (they iterate independent (i, j) pairs). `if dist[i][k] == INF: continue` is a micro-optimisation: if i cannot reach k, routing through k cannot improve any j-distance, so skip the inner loop. `nxt[i][j] = nxt[i][k]` records the next hop on the optimal i-to-j path — walking the `nxt` matrix reconstructs paths in O(path length).

The negative-cycle check at the end is essential: if any `dist[i][i] < 0`, vertex i can reach itself with negative total cost, meaning a negative cycle exists on the path from i to i, and shortest paths involving that cycle are undefined (you could go around the cycle arbitrarily many times to decrease distance). Return early or flag the cycle.

**Path reconstruction**: maintain a `nxt[i][j]` matrix during the DP. When the algorithm updates `dist[i][j]` via the route through k, the next hop on the i-to-j path is the same as the next hop on the i-to-k path — so `nxt[i][j] = nxt[i][k]`. To walk the path: `i, nxt[i][j], nxt[nxt[i][j]][j], ..., j`.

**Why not Dijkstra V times?** O(V(V + E) log V) = O(V³ log V) on dense graphs — Floyd is strictly better. On sparse graphs (E ≪ V²), Dijkstra V times wins because Dijkstra is O((V + E) log V), totalling O(V(V + E) log V) ≈ O(V² log V). **Why not Johnson's algorithm?** Johnson's reweights then runs Dijkstra V times — best for sparse graphs with negative edges, where it achieves O(V²·log V + V·E). Use Johnson when E ≪ V², Floyd when E ≈ V². **Common bugs**: k not outermost (silent wrong answers); INT_MAX overflow on `dist[i][k] + dist[k][j]` (use `INT_MAX / 2` or infinity sentinel); forgetting to initialise the diagonal to 0 (self-distance becomes infinity); not handling undirected edges by filling both `dist[i][j]` and `dist[j][i]`; memory at V = 10⁴ is ~400 MB and impractical (use Dijkstra V times instead).

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
