---
slug: dijkstras-algorithm
module: graphs
title: Dijkstra's Algorithm
subtitle: Single-source shortest paths in a graph with non-negative weights.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
status: published
---

## intro
Dijkstra's algorithm finds the shortest path from a single source to every other reachable vertex in a graph with **non-negative edge weights**. It's the canonical answer to "shortest path with weights" — used by every routing protocol that doesn't need to handle hostile/negative edges, including Google Maps, OSPF, and IP routing.

## whyItMatters
Most real-world shortest-path problems live here: distances on a road network, latency between hops, money cost. The only common case Dijkstra cannot handle is *negative edges* — for that, you escalate to Bellman-Ford (slower, more general). When the interviewer adds "edges have positive weights," Dijkstra is the answer almost every time.

## intuition
Maintain a tentative distance to every vertex (`∞` for unvisited). Repeatedly pick the unvisited vertex with the smallest tentative distance, mark it finalized, and relax all its outgoing edges. Because weights are non-negative, once a vertex is finalized you can never find a shorter path later — the wavefront of finalized vertices only expands outward.

A min-heap (priority queue) keyed by tentative distance gives `O((V + E) log V)`. Without it, you scan all V each round → `O(V²)`, which is actually faster for dense graphs.

## visualization
Cities A→B (5), A→C (1), C→B (1), B→D (3), C→D (10).
- Init: dist = {A:0, B:∞, C:∞, D:∞}. PQ: [(0, A)].
- Pop A. Relax: B=5, C=1. PQ: [(1, C), (5, B)].
- Pop C. Relax: B = min(5, 1+1) = 2; D = 11. PQ: [(2, B), (5, B-stale), (11, D)].
- Pop B (the fresh entry at 2). Relax: D = min(11, 2+3) = 5. PQ: [(5, D), (11, D-stale)].
- Pop D at 5. Done.

The "stale entry" pattern is normal — you check whether the popped distance still matches `dist[v]`; if not, skip.

## bruteForce
BFS works for unweighted graphs (treat every edge as cost 1) but gives wrong answers when edges vary. Enumerating paths is exponential. Without a priority queue, repeated relaxation (Bellman-Ford) handles negative edges but costs `O(V·E)` — much worse for the common case.

## optimal
With a binary min-heap:
1. `dist[source] = 0`, push `(0, source)` onto the heap.
2. While the heap is nonempty: pop `(d, u)`. If `d > dist[u]`, skip (stale). Otherwise for each neighbor `v` with edge weight `w`: if `dist[u] + w < dist[v]`, update `dist[v]` and push `(dist[v], v)`.
3. After the loop, `dist[]` holds shortest distances; trace `prev[]` for paths.

Variants: Fibonacci heap gives `O(E + V log V)` — theoretically better, rarely faster in practice. A* is Dijkstra with a heuristic that guides toward a target.

## complexity
time: O((V + E) log V)
space: O(V)
notes: With a Fibonacci heap, `O(E + V log V)`. With an array (no heap) and dense graphs, `O(V²)` can win — it avoids the per-edge `log V` overhead.

## pitfalls
- **Negative edges → wrong answer.** Dijkstra assumes finalized-once-popped, which fails when later relaxation could yield a shorter path via a negative cycle or edge.
- **Stale heap entries** — don't decrease-key; just push duplicates and skip on pop if `d > dist[u]`. Cleaner code, same complexity.
- **Floating-point distances** — accumulating errors can desynchronize comparisons. Use `>` with a small epsilon or stick to integers.
- Off-by-one on the prev[] reconstruction — `prev[source]` should be null/undefined, not source.

## interviewTips
- Lead with the precondition: "Dijkstra needs non-negative weights." If the interviewer has negative weights, pivot to Bellman-Ford.
- For "shortest path on a grid with cell-cost," treat each cell as a vertex with 4 neighbors and use Dijkstra. Brute-force DP often works too but Dijkstra generalizes better.
- Mention A* if the interviewer hints at a known target — adds a heuristic for faster convergence.

## code.python
```python
import heapq

def dijkstra(n, adj, source):
    INF = float('inf')
    dist = [INF] * n
    dist[source] = 0
    heap = [(0, source)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return dist
```

## code.javascript
```javascript
function dijkstra(n, adj, source) {
  const dist = new Array(n).fill(Infinity);
  dist[source] = 0;
  // Simple binary heap with [d, u] pairs
  const heap = [[0, source]];
  const less = (a, b) => a[0] < b[0];
  const swap = (i, j) => { const t = heap[i]; heap[i] = heap[j]; heap[j] = t; };
  while (heap.length) {
    swap(0, heap.length - 1);
    const top = heap.pop();
    // sift down
    let i = 0;
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let m = i;
      if (l < heap.length && less(heap[l], heap[m])) m = l;
      if (r < heap.length && less(heap[r], heap[m])) m = r;
      if (m === i) break;
      swap(i, m); i = m;
    }
    const [d, u] = top;
    if (d > dist[u]) continue;
    for (const [v, w] of adj[u]) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        // sift up
        heap.push([nd, v]);
        let j = heap.length - 1;
        while (j > 0) {
          const p = (j - 1) >> 1;
          if (less(heap[j], heap[p])) { swap(j, p); j = p; } else break;
        }
      }
    }
  }
  return dist;
}
```

## code.java
```java
public int[] dijkstra(int n, List<int[]>[] adj, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, source});
    while (!pq.isEmpty()) {
        int[] top = pq.poll();
        int d = top[0], u = top[1];
        if (d > dist[u]) continue;
        for (int[] edge : adj[u]) {
            int v = edge[0], w = edge[1];
            int nd = d + w;
            if (nd < dist[v]) {
                dist[v] = nd;
                pq.offer(new int[]{nd, v});
            }
        }
    }
    return dist;
}
```

## code.cpp
```cpp
vector<long long> dijkstra(int n, vector<vector<pair<int,int>>>& adj, int source) {
    const long long INF = LLONG_MAX;
    vector<long long> dist(n, INF);
    dist[source] = 0;
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    pq.push({0, source});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            long long nd = d + w;
            if (nd < dist[v]) {
                dist[v] = nd;
                pq.push({nd, v});
            }
        }
    }
    return dist;
}
```
