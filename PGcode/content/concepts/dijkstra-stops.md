---
slug: dijkstra-stops
module: graphs
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
Plain Dijkstra fails because a longer-but-cheaper path may be unusable under the cap, while a shorter-but-pricier one is the only feasible answer. Make hops part of the state and the contradiction disappears: `(v, s1)` and `(v, s2)` are now different vertices, each with its own best cost, and the algorithm can keep both alive in the heap simultaneously.

## visualization
Cities `0 -> 1` cost 100, `0 -> 2` cost 500, `1 -> 2` cost 100, `K = 0` stops allowed from 0 to 2. Plain Dijkstra picks `0 -> 1 -> 2` for 200, but that uses one stop and is illegal. With state `(node, stops)` we never reach `(2, 0)` from `(1, 1)`; we only reach `(2, 1)` from it, which violates the budget. The only feasible answer is the direct edge for 500.

## bruteForce
DFS every path from source to target, prune when cost exceeds the current best or hops exceed `K`, take the minimum. Correct but exponential in the worst case on dense graphs. Acceptable up to maybe a dozen nodes; falls over fast on anything larger. Memoizing on `(node, hops_remaining)` already buys you most of the win — at which point you have rediscovered the BFS-by-cost version of the algorithm below.

## optimal
Min-heap of `(cost, node, stops_used)`. Push the source as `(0, src, 0)`. Pop the smallest cost. If `node == dst`, return cost. If `stops_used > K + 1` (counting hops, where `K` stops means `K + 1` edges), skip. For each outgoing edge `(node, nbr, w)`, push `(cost + w, nbr, stops_used + 1)`. Maintain `best[node][stops]` and only push if the new cost improves it. A `(V * (K + 2))` state space keeps the algorithm sound.

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
