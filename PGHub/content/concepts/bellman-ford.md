---
slug: bellman-ford
module: graphs-shortest-paths
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
The mental model is a layered guarantee that grows one edge at a time. Think of `dist[v]` after pass `k` as the answer to a strictly easier question: "what is the shortest source-to-v path that uses at most `k` edges?" A real shortest path in a graph without negative cycles can never repeat a vertex, so it uses at most `V - 1` edges. That single fact is the entire correctness argument — after `V - 1` passes, every shortest path has had a chance to be assembled one edge at a time from the source outward.

Why does relaxing *every* edge per pass work? Because we don't know which edge belongs to which shortest path, so we conservatively try them all. Each successful relaxation `dist[v] = min(dist[v], dist[u] + w)` says "if there is a better way to reach v by going through u, take it." After enough passes, the optimal substructure resolves: a shortest path of `k` edges is a shortest path of `k-1` edges plus one final edge, and pass `k` discovers exactly those.

The key invariant: after pass `k`, `dist[v]` is no worse than the shortest path of length `≤ k` from source to v. Analogy: imagine ripples on a pond, but the pond can have downhill currents (negative edges). Each pass extends every ripple by one edge. If a ripple keeps getting cheaper after `V` passes, you have found water flowing in a loop — the negative cycle the algorithm reports.

## visualization
```
Graph (5 vertices): S=0
     0 ──(6)─→ 1
     0 ──(7)─→ 2
     1 ──(5)─→ 3
     1 ──(-4)→ 4
     2 ──(-3)→ 1
     2 ──(9)─→ 4
     3 ──(-2)→ 1
     4 ──(2)─→ 3

Initial:  dist = [0,  inf, inf, inf, inf]

Pass 1 (relax all 8 edges in order):
  (0,1,6):   dist = [0, 6,   inf, inf, inf]
  (0,2,7):   dist = [0, 6,   7,   inf, inf]
  (1,3,5):   dist = [0, 6,   7,   11,  inf]
  (1,4,-4):  dist = [0, 6,   7,   11,  2 ]
  (2,1,-3):  dist = [0, 4,   7,   11,  2 ]  <- 7 + (-3) = 4 beats 6
  (4,2): skip in this order; (3,1,-2): 11-2=9, no.
Pass 2: relaxations propagate the new dist[1]=4 forward.
  (1,3,5):   dist[3] = 4 + 5 = 9   -> [0, 4, 7, 9,  2]
  (1,4,-4):  dist[4] = 4 + -4 = 0  -> [0, 4, 7, 9,  0]
Pass 3: dist[4]=0 reduces dist[3] via (4,3,2) = 0+2 = 2 < 9
                                    -> [0, 4, 7, 2,  0]
Pass 4 (=V-1): no further relaxations. Algorithm converged.
Pass 5 (verification): no edge relaxes -> no negative cycle.
```

## bruteForce
Enumerate every simple path from source to target and take the minimum. Combinatorial explosion: factorial in `V`. Useless beyond tiny graphs, but worth mentioning as the contrast: Bellman-Ford is the polynomial relaxation of this idea.

## optimal
Initialize an array `dist` of length `V` with `dist[source] = 0` and every other entry set to a sentinel `+infinity`. Maintain it as the running best-known distance. Repeat `V - 1` times: iterate over every edge `(u, v, w)` and apply the relaxation rule `if dist[u] + w < dist[v] then dist[v] = dist[u] + w` (guarding against arithmetic on infinity). After the `V - 1` passes, run one extra pass purely for diagnostics: any successful relaxation now is a witness that a negative-weight cycle is reachable from the source, because no shortest path uses more than `V - 1` edges.

Data structures: a flat edge list (no adjacency map needed — every pass touches all edges uniformly), a `dist` array of size `V`, and optionally a `prev` array of size `V` for path reconstruction. The algorithm is embarrassingly cache-friendly because the edge list is a contiguous scan.

Two practical optimizations. First, an early-termination flag: if a full pass performs zero relaxations, the distances are stable and you can break — this turns favourable graphs into near-linear runs. Second, SPFA (Shortest Path Faster Algorithm) keeps a queue of vertices whose distance recently improved and only relaxes their outgoing edges; same worst case, much better average case but pathological adversarial inputs exist. The tradeoff against Dijkstra is stark: Bellman-Ford is O(V·E) vs Dijkstra's O((V + E) log V), but Bellman-Ford accepts negative weights and detects negative cycles, two superpowers Dijkstra cannot match.

## complexity
time: O(V · E)
space: O(V)
notes: V passes × E edge relaxations per pass = V·E. Far worse than Dijkstra's `O((V + E) log V)` with a heap, but Dijkstra cannot handle negative edges, period. For graphs with non-negative weights, prefer Dijkstra.

## pitfalls
- **Confusing "negative edge" with "negative cycle".** Negative edges are fine; a *negative cycle reachable from the source* means no shortest path exists. Fix: always run the V-th verification pass and return a "no answer" sentinel when any edge still relaxes.
- **Looping V times instead of V - 1.** Doing the V-th relaxation as part of the main loop conflates progress with the cycle detector and hides real negative cycles. Fix: keep the relaxation loop bounded by exactly `V - 1` iterations and reserve the V-th pass purely for cycle detection.
- **Path reconstruction inside a cycle.** Tracing `prev[]` from an "affected" vertex can spin forever inside the cycle itself. Fix: walk `prev[]` back at most `V` steps from the affected vertex to land on a vertex guaranteed to be on the cycle, then walk forward collecting nodes until you return.
- **Floating-point equality in relaxations.** With doubles, repeated `dist[u] + w` can drift by epsilon and trigger a false "still relaxing" verdict, falsely reporting a negative cycle. Fix: compare with a tolerance (`dist[u] + w + EPS < dist[v]`) when weights are floating-point, or scale to integers when feasible.
- **Integer overflow in `dist[u] + w`.** Initialising `dist` to `INT_MAX` and adding a positive weight wraps to a negative number, which then "improves" some other distance. Fix: guard the relaxation with `if (dist[u] != INF && dist[u] + w < dist[v])` and use `long`/`long long` for cumulative distance in C++/Java.

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
