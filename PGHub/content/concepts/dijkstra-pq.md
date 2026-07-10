---
slug: dijkstra-pq
module: graphs-shortest-paths
title: Dijkstra's with Lazy Deletion
subtitle: O((V + E) log V) shortest path from a source — using a priority queue and a "skip stale entries" trick instead of decrease-key.
difficulty: Intermediate
position: 18
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
Dijkstra's algorithm finds the shortest path from a single source to every other node in a graph with **non-negative** edge weights. The standard implementation in interview-friendly languages skips the formal "decrease-key" priority queue operation and instead **pushes a new entry each time a node's distance improves**, ignoring stale entries when they pop. This "lazy deletion" Dijkstra is what every modern competitive solver uses.

## whyItMatters
Single-source shortest paths is a workhorse:
- **Routing**: maps, network routing, package delivery.
- **Reachability with cost**: cheapest flight, fastest commute.
- **Game pathfinding** (when there's no heuristic to feed A*).

Dijkstra is the right answer whenever weights are non-negative. (For negative weights, use Bellman-Ford. For uniform weights, BFS is faster.) Knowing the lazy-deletion variant means you can implement it from scratch in 15 lines without a custom heap.

## intuition
Greedy: at each step, finalize the closest-unvisited node. Once finalized, its distance can't improve (with non-negative weights). Use a min-heap keyed by tentative distance. Pop the smallest, relax its outgoing edges, push neighbors with new tentative distances. If you pop a node whose `dist` field is already smaller than the popped entry's, skip — it's a stale entry from before a better path was found.

Physical picture: imagine flooding the graph with water from the source, where every edge is a pipe whose length equals its weight. The water reaches nodes in increasing order of distance, and the moment a node gets wet, the shortest time-of-arrival to it is fixed forever — nothing arriving later can be faster. The min-heap is just the schedule of "next wavefront to arrive." What's actually happening before any formula: because all pipes have non-negative length, the frontier can only expand outward, never fold back to improve a node already reached. That monotonic frontier is exactly why finalizing the current-closest node is safe.

Trace it on real numbers. Source 0 with edges 0->1 weight 3, 0->2 weight 4, 1->3 weight 1, 2->3 weight 2. Start `dist = [0, inf, inf, inf]`, heap `[(0,0)]`. Pop (0,0): relax to get dist[1]=3, dist[2]=4, heap `[(3,1),(4,2)]`. Pop (3,1): relax 1->3 giving dist[3]=3+1=4, heap `[(4,2),(4,3)]`. Pop (4,2): relax 2->3 gives 4+2=6, which does not beat dist[3]=4, so nothing changes, heap `[(4,3),(6,3)]`. Pop (4,3): finalize node 3. Pop (6,3): here `d=6 > dist[3]=4`, so it is stale and we skip it. Final `dist = [0, 3, 4, 4]`. Notice node 3 landed in the heap twice — the lazy-deletion trick lets the stale (6,3) sit there harmlessly until it pops and is discarded, avoiding any decrease-key surgery.

## visualization
```
Graph: source = 0
       (0) ──3── (1) ──1── (3)
        │               │
       4│              5│
        ▼               ▼
       (2) ──2─────────(3)

Step           dist[0..3]      heap (key = dist, node)
init           [0, ∞, ∞, ∞]   [(0, 0)]
pop (0, 0)     [0, 3, 4, ∞]   [(3, 1), (4, 2)]   relax 0→1 and 0→2
pop (3, 1)     [0, 3, 4, 4]   [(4, 2), (4, 3)]   relax 1→3
pop (4, 2)     [0, 3, 4, 4]   [(4, 3), (6, 3)]   relax 2→3 (would push 6, doesn't beat 4)
pop (4, 3)     done
pop (6, 3)     stale — dist[3]=4 < 6, skip

Final: [0, 3, 4, 4]
```

## bruteForce
Bellman-Ford (O(V·E)) handles non-negative weights too but is asymptotically slower. Naive Dijkstra with an array (O(V²)) is fine for dense graphs but loses to the heap version for sparse ones.

## optimal
The optimal method keeps a min-heap of `(tentative_distance, node)` pairs and a `dist` array of the best distance found so far. The correctness invariant is the crux: every time a node is popped with `d == dist[u]`, that `dist[u]` is already the true shortest distance and will never change again. This holds because weights are non-negative — any alternative path to u must pass through some node still on the frontier whose tentative distance is at least `d`, and adding more non-negative edges can only make it larger. So the first, smallest pop of a node is final; all later pops of the same node are stale and discarded by the `d > dist[u]` guard.

The central tradeoff is the lazy-deletion design itself: instead of locating and lowering an existing heap entry (a decrease-key that needs an index-tracking heap), you simply push a fresh, smaller entry and let the obsolete one linger. This trades a little extra heap space and a few redundant pops for a dramatically simpler implementation that uses any plain binary heap.

```
def dijkstra(n, edges, source):
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    dist = [float('inf')] * n
    dist[source] = 0
    pq = [(0, source)]                 # (tentative_distance, node)
    while pq:
        d, u = heappop(pq)
        if d > dist[u]: continue       # stale — a better path was already found
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heappush(pq, (nd, v))
    return dist
```

Step through the mechanism: pop the closest frontier node, skip it if stale, otherwise relax each outgoing edge and push any neighbor whose distance strictly improved. Every improvement adds one heap entry, and each edge can improve a neighbor at most once per relaxation of its source, so the heap holds at most O(E) entries over the run. The complexity intuition: there are O(E) pushes and pops, each costing O(log V) because the heap never exceeds V + E entries (and log(V+E) is O(log V) for simple graphs), plus O(V) initialization — giving the O((V + E) log V) bound. The stale-skip check is what keeps the pop count proportional to the number of pushes rather than blowing up.

**Stop-early variant**: if you only want the distance to a single target `t`, return as soon as you pop `(d, t)`.

**Path reconstruction**: maintain `parent[v] = u` whenever `dist[v]` is updated; walk parents back from target to source.

For graphs with **all-edge-weight = 1**, use BFS — same answer in O(V + E) without the log.

For graphs with **edge weights ∈ {0, 1}**, use a deque (0-1 BFS) — also O(V + E).

## complexity
- **Time**: O((V + E) log V) with a binary heap.
- **Space**: O(V + E).
- **With Fibonacci heap**: O(V log V + E) — better asymptotically but the constant is brutal; rarely used in practice.
- **Negative weights**: Dijkstra is incorrect. Use Bellman-Ford or Johnson's.

## pitfalls
- **Negative edge weights**: silently wrong. Always confirm weights are non-negative before using Dijkstra.
- **Forgetting the stale-skip check**: the algorithm still works (correctness-wise) but does redundant work — potentially O(V · E log V).
- **Multi-edges between u, v**: keep the smallest. Dedupe at graph-construction time.
- **Source unreachable from some node**: `dist[v]` stays infinity. Check for that before reporting.
- **Comparing floats for staleness**: use a strict `>` and accept that floating-point error may keep one stale entry alive once.

## interviewTips
- For "shortest path with non-negative weights," lead with Dijkstra.
- Mention **lazy-deletion** explicitly — many candidates write `decrease_key` they don't actually have.
- Compare with **BFS** (uniform), **0-1 BFS** (0/1 weights), **A*** (with heuristic), **Bellman-Ford** (negative weights).
- For senior interviews, mention **Johnson's algorithm** for all-pairs shortest path with negative weights but no negative cycles.

## code.python
```python
import heapq

def dijkstra(n, edges, source):
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    dist = [float('inf')] * n
    dist[source] = 0
    pq = [(0, source)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist

edges = [(0,1,3),(0,2,4),(1,3,1),(2,3,2)]
print(dijkstra(4, edges, 0))   # [0, 3, 4, 4]
```

## code.javascript
```javascript
// Use a binary heap library or implement a small one; here we use a sorted-on-insert array for clarity.
function dijkstra(n, edges, source) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const dist = new Array(n).fill(Infinity);
  dist[source] = 0;
  const pq = [[0, source]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);  // tiny heap stand-in
    const [d, u] = pq.shift();
    if (d > dist[u]) continue;
    for (const [v, w] of adj[u]) {
      const nd = d + w;
      if (nd < dist[v]) { dist[v] = nd; pq.push([nd, v]); }
    }
  }
  return dist;
}
```

## code.java
```java
import java.util.*;
class Dijkstra {
    public long[] shortest(int n, int[][] edges, int source) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(new int[]{ e[1], e[2] });
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[source] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        pq.add(new long[]{ 0, source });
        while (!pq.isEmpty()) {
            long[] top = pq.poll();
            long d = top[0]; int u = (int) top[1];
            if (d > dist[u]) continue;
            for (int[] nb : adj[u]) {
                long nd = d + nb[1];
                if (nd < dist[nb[0]]) { dist[nb[0]] = nd; pq.add(new long[]{ nd, nb[0] }); }
            }
        }
        return dist;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <queue>
#include <climits>
std::vector<long long> dijkstra(int n, std::vector<std::tuple<int,int,int>>& edges, int source) {
    std::vector<std::vector<std::pair<int,int>>> adj(n);
    for (auto [u, v, w] : edges) adj[u].push_back({v, w});
    std::vector<long long> dist(n, LLONG_MAX);
    dist[source] = 0;
    using P = std::pair<long long, int>;
    std::priority_queue<P, std::vector<P>, std::greater<>> pq;
    pq.push({0, source});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            long long nd = d + w;
            if (nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
        }
    }
    return dist;
}
```
