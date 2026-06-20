---
slug: dijkstra-with-path
module: graphs-shortest-paths
title: Dijkstra with Path Reconstruction
subtitle: Run Dijkstra's shortest-path algorithm and recover the actual edge sequence via a parent[] array.
difficulty: Intermediate
position: 18
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Dijkstra Algorithm — cp-algorithms"
    url: "https://cp-algorithms.com/graph/dijkstra.html"
    type: blog
  - title: "Algorithms, 4th Edition — Shortest Paths"
    url: "https://algs4.cs.princeton.edu/44sp/"
    type: book
  - title: "kactl — Dijkstra"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/graph/Dijkstra.h"
    type: repo
status: published
---

## intro
Dijkstra's algorithm computes the shortest path distance from a source to every other vertex in a graph with non-negative edge weights. The vanilla version returns only the distances; reconstructing the actual path requires one extra array — parent[v] — recording which vertex was used to relax v. Walking parent[] backward from the target yields the path in reverse.

## whyItMatters
Path reconstruction is the difference between a research algorithm and a usable navigation system. Google Maps, Apple Maps, OpenStreetMap's OSRM, the routing inside Tesla's autopilot, and the OSPF/IS-IS link-state protocols that power every internet backbone all need the *sequence of moves*, not just the cost. Game-engine pathfinders (Unity's NavMesh, Unreal's `NavigationSystem`) reconstruct paths from a Dijkstra/A* parent table; supply-chain planners (Manhattan Associates, Blue Yonder) return delivery routes the same way. Adding `parent[]` is a five-line change that turns Dijkstra from a distance oracle into a turn-by-turn planner and is the basis of the A*-with-heuristic extension that powers most real navigation systems.

## intuition
Dijkstra greedily settles vertices in order of increasing distance from the source. Each time it relaxes an edge `(u, v, w)` and improves `dist[v]` to `dist[u] + w`, the best currently-known way to reach `v` ends in the edge `u -> v`. Record `parent[v] = u` every time you relax; after the algorithm finishes the parent pointers form a tree rooted at the source.

Why does this give the shortest path and not just any path? Because Dijkstra has the property that once a vertex is finalized (popped from the heap with its final distance), its `dist[v]` value never changes — so the `parent[v]` recorded at the relaxation that produced that final value is the predecessor on the optimal path. Walking parent pointers from target back to source visits the path in reverse; you reverse the list to read it forward.

The shortest-path tree (SPT) you get this way is a subset of the original graph with exactly one path per destination, so it can be stored as one parent pointer per vertex — `O(V)` total space regardless of how many destinations you query. If you only need paths from one source to many destinations, this is strictly better than the alternative of running Dijkstra separately per target. For many-to-many, use Johnson's algorithm (Bellman-Ford reweight then `V` Dijkstras) or the Floyd-Warshall all-pairs algorithm.

## visualization
Graph: A → B (w=1), A → C (w=4), B → C (w=2), B → D (w=5), C → D (w=1). Start from A. Settle A (dist=0). Relax A → B: dist[B]=1, parent[B]=A. Relax A → C: dist[C]=4, parent[C]=A. Settle B (dist=1). Relax B → C: dist[C]=3 (better than 4), parent[C]=B. Relax B → D: dist[D]=6, parent[D]=B. Settle C (dist=3). Relax C → D: dist[D]=4 (better than 6), parent[D]=C. Settle D (dist=4). Path to D: walk parent from D → C → B → A; reverse to A → B → C → D.

## bruteForce
Enumerate every simple path from source to target and pick the cheapest. Exponential in the worst case (n!). Even for medium graphs (n=15) this is hopeless. The only reason to mention it in an interview is to motivate why a smarter approach is needed.

## optimal
Standard Dijkstra with a binary min-heap and a `parent[]` array. Initialize `dist[v] = inf` for all `v != source`, `dist[source] = 0`, `parent[v] = None`. Push `(0, source)`. Pop the smallest `(d, u)`; if `d > dist[u]` skip (stale). Otherwise for each edge `(u, v, w)`: if `dist[u] + w < dist[v]`, set `dist[v] = dist[u] + w`, `parent[v] = u`, push `(dist[v], v)`. Recover the path by walking `parent` backward from target until None, then reverse.

```python
import heapq

def dijkstra(graph, source, target):
    dist = {v: float('inf') for v in graph}
    dist[source] = 0
    parent = {source: None}
    pq = [(0, source)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        if u == target: break
        for v, w in graph[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                parent[v] = u
                heapq.heappush(pq, (nd, v))
    if target not in parent: return None, float('inf')
    path = []
    cur = target
    while cur is not None:
        path.append(cur)
        cur = parent[cur]
    return list(reversed(path)), dist[target]
```

The critical lines are the paired updates inside the relax block — `dist[v] = nd` and `parent[v] = u` must happen together so the parent always points to the predecessor on the current-best path. The lazy-deletion pattern (`if d > dist[u]: continue`) makes a decrease-key operation unnecessary; this is the canonical implementation in C++, Java, Python, and Rust. For very large road graphs (continent-scale OpenStreetMap), production routers use *contraction hierarchies* (Geisberger et al. 2008) or *hub labeling* which precompute a hierarchy that lets queries return in microseconds rather than the milliseconds plain Dijkstra needs on a million-node graph.

## complexity
time: O((V + E) log V) with a binary heap
space: O(V) for dist and parent, O(E) total entries pushed onto the heap
notes: With a Fibonacci heap, the bound improves to O(E + V log V), but in practice the constant factors win for almost all real graphs. For dense graphs (E close to V²), the array-scan version runs in O(V²) and beats the heap version.

## pitfalls
- Using Dijkstra on graphs with negative edges — silently wrong; use Bellman-Ford instead.
- Forgetting to skip stale heap entries — still correct but slower by a constant factor.
- Reconstructing the path by walking forward from the source — parent[] only encodes the reverse chain.
- Not initializing parent[source] to a sentinel — the reconstruction loop must terminate cleanly.

## interviewTips
- State up front: "I will run Dijkstra and also maintain a parent[] array for path recovery."
- Mention the negative-edge caveat — interviewers love correctness-flag questions.
- Sketch the path-reconstruction helper as a separate function so it reads cleanly.
- For "all shortest paths between two nodes," explain that parent[] must store a list, not a single predecessor — this is a common follow-up.

## code.python
```python
import heapq

def dijkstra_with_path(graph, source, target):
    n = len(graph)
    dist = [float('inf')] * n
    parent = [-1] * n
    dist[source] = 0
    pq = [(0, source)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        if u == target:
            break
        for v, w in graph[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                parent[v] = u
                heapq.heappush(pq, (nd, v))
    if dist[target] == float('inf'):
        return float('inf'), []
    path = []
    cur = target
    while cur != -1:
        path.append(cur)
        cur = parent[cur]
    path.reverse()
    return dist[target], path
```

## code.javascript
```javascript
function dijkstraWithPath(graph, source, target) {
  const n = graph.length;
  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  dist[source] = 0;
  const pq = [[0, source]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (d > dist[u]) continue;
    if (u === target) break;
    for (const [v, w] of graph[u]) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        parent[v] = u;
        pq.push([nd, v]);
      }
    }
  }
  if (dist[target] === Infinity) return { cost: Infinity, path: [] };
  const path = [];
  let cur = target;
  while (cur !== -1) {
    path.push(cur);
    cur = parent[cur];
  }
  path.reverse();
  return { cost: dist[target], path };
}
```

## code.java
```java
public int[] dijkstraWithPath(List<int[]>[] graph, int source, int target, int[] parentOut) {
    int n = graph.length;
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    Arrays.fill(parentOut, -1);
    dist[source] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
    pq.offer(new int[] { 0, source });
    while (!pq.isEmpty()) {
        int[] top = pq.poll();
        int d = top[0], u = top[1];
        if (d > dist[u]) continue;
        if (u == target) break;
        for (int[] edge : graph[u]) {
            int v = edge[0], w = edge[1];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                parentOut[v] = u;
                pq.offer(new int[] { dist[v], v });
            }
        }
    }
    return dist;
}
```

## code.cpp
```cpp
std::pair<long long, std::vector<int>> dijkstraWithPath(
    const std::vector<std::vector<std::pair<int, int>>>& graph,
    int source, int target) {
    int n = graph.size();
    std::vector<long long> dist(n, LLONG_MAX);
    std::vector<int> parent(n, -1);
    dist[source] = 0;
    using P = std::pair<long long, int>;
    std::priority_queue<P, std::vector<P>, std::greater<P>> pq;
    pq.push({0, source});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        if (u == target) break;
        for (auto [v, w] : graph[u]) {
            long long nd = d + w;
            if (nd < dist[v]) {
                dist[v] = nd;
                parent[v] = u;
                pq.push({nd, v});
            }
        }
    }
    if (dist[target] == LLONG_MAX) return {LLONG_MAX, {}};
    std::vector<int> path;
    for (int cur = target; cur != -1; cur = parent[cur]) path.push_back(cur);
    std::reverse(path.begin(), path.end());
    return {dist[target], path};
}
```
