---
slug: dijkstra-stops
module: graphs-shortest-paths
title: Dijkstra with K Stops
subtitle: Cheapest path under a hop-count budget — relax states keyed by (node, stops used).
difficulty: Advanced
position: 41
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Dijkstra's Algorithm — cp-algorithms"
    url: "https://cp-algorithms.com/graph/dijkstra.html"
    type: blog
  - title: "Cheapest Flights Within K Stops — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/cheapest-flights-within-k-stops/"
    type: blog
  - title: "TheAlgorithms/Python — dijkstra.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/dijkstra.py"
    type: repo
status: published
---

## intro
Plain Dijkstra finds the cheapest path. Sometimes a real-world constraint caps the number of intermediate hops — at most `K` layovers on a flight, at most `K` router hops, at most `K` warehouse transfers. The fix is to expand the state space: instead of "best cost to node `v`" we track "best cost to node `v` using exactly `s` stops" for every `s` from 0 to `K + 1`.

## whyItMatters
This is the canonical example of using state augmentation to make Dijkstra handle a side constraint that would otherwise break optimality. The pattern generalizes: cap on fuel, cap on toll roads, restriction on edge colors. Once you can recognize that the relevant state is `(node, resource_used)` instead of just `node`, dozens of LeetCode "shortest path with a twist" problems collapse into the same template.

## intuition
The algorithm exists because Dijkstra's greedy-settle invariant — first time a node is popped its distance is final — breaks under hop constraints. The cheapest path may exceed the hop budget; the cheapest legal path may pass through nodes whose unconstrained cheapest is shorter, yet that shorter path uses too many hops to extend further. So a node's "best cost" is no longer a single number but a *function* of the hop budget remaining or used.

The decisive observation: lift the state space from `node` to `(node, stops_used)`. Two visits to the same physical node with different hop counts are now treated as different vertices in a layered graph, each with its own best cost. The greedy-settle invariant is restored on this layered graph because `(v, s)` reached at cost c is final at that hop count — adding a positive-weight edge can only increase cost, so a later pop of `(v, s, c')` with c' > c is redundant. The heap operates on `(cost, node, stops_used)` triples and a `best[node][stops]` table prunes dominated pushes.

Mental model: build a stack of K+2 copies of the graph; edges only go from layer `s` to layer `s+1`. Dijkstra on this layered graph recovers the cheapest path subject to the hop bound by construction. Total state space is V·(K+2), heap operations are O(log(VK)), and total cost is O(E·K·log(VK)) — practical for K up to a few hundred. The same pattern generalises to any resource-bounded shortest path: fuel caps, toll budgets, edge-color restrictions, time-of-day constraints. Recognising that "the relevant state is (node, resource_used)" collapses dozens of "shortest path with a twist" prompts into one template.

Bellman-Ford with K+1 relaxation passes is the equivalent dual formulation: each pass extends the legal frontier by one hop, snapshot-based to prevent chaining within a pass. Pick Dijkstra when K is small relative to V (state space is bounded); pick Bellman-Ford when graph is dense and K is small.

## visualization
Cities `0 -> 1` cost 100, `0 -> 2` cost 500, `1 -> 2` cost 100, `K = 0` stops allowed from 0 to 2. Plain Dijkstra picks `0 -> 1 -> 2` for 200, but that uses one stop and is illegal. With state `(node, stops)` we never reach `(2, 0)` from `(1, 1)`; we only reach `(2, 1)` from it, which violates the budget. The only feasible answer is the direct edge for 500.

## bruteForce
DFS every path from source to target, prune when cost exceeds the current best or hops exceed `K`, take the minimum. Correct but exponential in the worst case on dense graphs. Acceptable up to maybe a dozen nodes; falls over fast on anything larger. Memoizing on `(node, hops_remaining)` already buys you most of the win — at which point you have rediscovered the BFS-by-cost version of the algorithm below.

## optimal
**Technique: state-augmented Dijkstra on (node, stops_used) tuples.** O(E·K·log(V·K)) time, O(V·K) space. The lifted state space restores Dijkstra's greedy-settle invariant, so we get tightness equivalent to plain Dijkstra modulo the K-factor — optimal for any algorithm that must consider a hop budget as part of the state.

```python
import heapq

def cheapest_with_k_stops(n, flights, src, dst, k):
    graph = [[] for _ in range(n)]
    for u, v, w in flights:
        graph[u].append((v, w))
    best = [[float('inf')] * (k + 2) for _ in range(n)]   # best[node][stops]
    best[src][0] = 0
    heap = [(0, src, 0)]                                   # (cost, node, stops_used)
    while heap:
        cost, node, stops = heapq.heappop(heap)
        if node == dst:
            return cost                                    # greedy: first pop of dst is optimal
        if stops == k + 1:
            continue                                       # already at hop limit
        for nbr, w in graph[node]:
            nc = cost + w
            if nc < best[nbr][stops + 1]:                  # prune dominated states
                best[nbr][stops + 1] = nc
                heapq.heappush(heap, (nc, nbr, stops + 1))
    return -1
```

Key lines: `best = [[inf] * (k+2) for _ in range(n)]` defines the lifted state space — one cost cell per (node, stops_used) pair. `if nc < best[nbr][stops + 1]` is the pruning that keeps the heap from filling with dominated states; without it, the heap grows to Θ(E·K) and operations slow down. The early return `if node == dst: return cost` works because the lifted state space restores Dijkstra's greedy invariant — the first pop of any (dst, *) is the cheapest legal path. The `stops == k + 1` guard reflects the "K stops means K+1 edges" convention.

**Why not plain Dijkstra?** Plain Dijkstra commits to the cheapest distance on first settle, missing legal-but-pricier paths under the hop budget. **Why not Bellman-Ford with K+1 passes?** Equivalent asymptotic; cleaner for dense graphs with small K (no heap overhead), but Dijkstra wins on sparse graphs because the per-hop work is O((V+E)log V) rather than O(E). **Why not DFS with memoisation?** Same asymptotic O(V·E·K) but exponential stack-depth risk in Python; the iterative heap variant is the production-safe choice. **Common off-by-one**: "K stops" = K+1 edges (the source and destination don't count as stops); pick the convention and write it into the guard.

For very small K (≤ 5), Bellman-Ford is shorter and faster; for large K and sparse graphs, the layered-Dijkstra is the right tool. The same pattern handles: cap on fuel (state = (node, fuel_remaining)), cap on edge colours, restrictions on direction changes.

## complexity
time: O(E * K * log(V * K))
space: O(V * K) for the best-cost table and heap
notes: When `K >= V - 1` the hop cap is moot and this collapses to plain Dijkstra. For very small `K`, Bellman-Ford limited to `K + 1` relaxation rounds is simpler and faster — pick the algorithm that fits the cap's size.

## pitfalls
- Off-by-one on stops vs edges: `K` stops means `K + 1` edges. Pick a convention and write it into the guard.
- Forgetting that on edge-weighted graphs you cannot stop at the first time you pop the destination unless the state includes the hop count — otherwise a cheaper-but-longer-hop path might still be coming.
- Pushing every state without a `best[node][stops]` check turns the heap into garbage at scale.
- Reusing plain Dijkstra's `visited` set, which assumes states are settled once popped — false here because `(node, s1)` and `(node, s2)` are distinct states.

## interviewTips
- Articulate the state augmentation early: "I will add stops-used to the state because the cap makes plain Dijkstra unsound."
- Mention Bellman-Ford as the alternative when `K` is tiny — it is one line shorter and asymptotically competitive.
- Name a real use: airline pricing engines, network routing with TTL limits, supply-chain transfers.

## code.python
```python
import heapq

def cheapest_with_k_stops(n, flights, src, dst, k):
    graph = [[] for _ in range(n)]
    for u, v, w in flights:
        graph[u].append((v, w))
    best = [[float('inf')] * (k + 2) for _ in range(n)]
    best[src][0] = 0
    heap = [(0, src, 0)]
    while heap:
        cost, node, stops = heapq.heappop(heap)
        if node == dst:
            return cost
        if stops == k + 1:
            continue
        for nbr, w in graph[node]:
            nc = cost + w
            if nc < best[nbr][stops + 1]:
                best[nbr][stops + 1] = nc
                heapq.heappush(heap, (nc, nbr, stops + 1))
    return -1
```

## code.javascript
```javascript
function cheapestWithKStops(n, flights, src, dst, k) {
  const graph = Array.from({ length: n }, () => []);
  for (const [u, v, w] of flights) graph[u].push([v, w]);
  const best = Array.from({ length: n }, () => Array(k + 2).fill(Infinity));
  best[src][0] = 0;
  const heap = [[0, src, 0]];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [cost, node, stops] = heap.shift();
    if (node === dst) return cost;
    if (stops === k + 1) continue;
    for (const [nbr, w] of graph[node]) {
      const nc = cost + w;
      if (nc < best[nbr][stops + 1]) {
        best[nbr][stops + 1] = nc;
        heap.push([nc, nbr, stops + 1]);
      }
    }
  }
  return -1;
}
```

## code.java
```java
import java.util.*;

public int cheapestWithKStops(int n, int[][] flights, int src, int dst, int k) {
    List<int[]>[] graph = new List[n];
    for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
    for (int[] f : flights) graph[f[0]].add(new int[]{f[1], f[2]});
    int[][] best = new int[n][k + 2];
    for (int[] row : best) Arrays.fill(row, Integer.MAX_VALUE);
    best[src][0] = 0;
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    heap.offer(new int[]{0, src, 0});
    while (!heap.isEmpty()) {
        int[] cur = heap.poll();
        int cost = cur[0], node = cur[1], stops = cur[2];
        if (node == dst) return cost;
        if (stops == k + 1) continue;
        for (int[] e : graph[node]) {
            int nc = cost + e[1];
            if (nc < best[e[0]][stops + 1]) {
                best[e[0]][stops + 1] = nc;
                heap.offer(new int[]{nc, e[0], stops + 1});
            }
        }
    }
    return -1;
}
```

## code.cpp
```cpp
#include <queue>
#include <vector>
#include <limits>

int cheapestWithKStops(int n, std::vector<std::vector<int>>& flights, int src, int dst, int k) {
    std::vector<std::vector<std::pair<int,int>>> graph(n);
    for (auto& f : flights) graph[f[0]].push_back({f[1], f[2]});
    std::vector<std::vector<int>> best(n, std::vector<int>(k + 2, INT_MAX));
    best[src][0] = 0;
    using Item = std::tuple<int,int,int>;
    std::priority_queue<Item, std::vector<Item>, std::greater<Item>> heap;
    heap.push({0, src, 0});
    while (!heap.empty()) {
        auto [cost, node, stops] = heap.top(); heap.pop();
        if (node == dst) return cost;
        if (stops == k + 1) continue;
        for (auto& [nbr, w] : graph[node]) {
            int nc = cost + w;
            if (nc < best[nbr][stops + 1]) {
                best[nbr][stops + 1] = nc;
                heap.push({nc, nbr, stops + 1});
            }
        }
    }
    return -1;
}
```
