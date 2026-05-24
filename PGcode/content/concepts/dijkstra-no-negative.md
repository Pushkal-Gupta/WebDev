---
slug: dijkstra-no-negative
module: graphs
title: Why Dijkstra Fails on Negative Edges
subtitle: A counter-example walkthrough showing why the greedy assumption breaks.
difficulty: Intermediate
position: 61
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Dijkstra Algorithm — cp-algorithms"
    url: "https://cp-algorithms.com/graph/dijkstra.html"
    type: blog
  - title: "CLRS Solutions — Chapter 24: Single-Source Shortest Paths"
    url: "https://walkccc.me/CLRS/Chap24/24.3/"
    type: book
  - title: "TheAlgorithms/Python — dijkstra.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/dijkstra.py"
    type: repo
status: published
---

## intro
Dijkstra's shortest-path algorithm is one of the most widely used graph algorithms — and one of the most widely misused. Its single hard requirement is that every edge weight is non-negative. Hand it a single negative edge and the result may be wrong, even when no negative cycle exists. Understanding *why* matters more than memorising the rule, because variants like Johnson's algorithm rely on side-stepping the limitation.

## whyItMatters
Whenever you hear "shortest path," the reflex is "Dijkstra." But real graphs sometimes carry negative edges legitimately — currency exchange arbitrage, profit/loss flows, time discounts. Reaching for Dijkstra in those settings silently returns the wrong answer instead of erroring. Knowing the failure mode tells you when to switch to Bellman-Ford (O(VE), handles negatives) or Johnson's (reweight then run Dijkstra V times).

## intuition
Dijkstra is greedy: the moment it pops a vertex u from its min-heap, it declares dist[u] final. That works only when no future relaxation could discover a *shorter* path to u. With non-negative edges, any path discovered later must be at least as long as the one already known, so finality is safe. A negative edge invalidates that argument — a longer-so-far path that later traverses a negative edge can undercut the supposedly-final value.

## visualization
Three vertices: A, B, C. Edges A->B weight 1, A->C weight 4, B->C weight -3. True shortest distances from A: A=0, B=1, C = 1 + (-3) = -2. Dijkstra: push A (0). Pop A, relax: dist[B]=1, dist[C]=4. Pop B (1), relax: dist[C] = min(4, 1 + (-3)) = -2. So far so good — Dijkstra got C right. Now swap: A->B = 5, A->C = 4, B->C = -3. True: A=0, C=4, B=5, but path A->B->C = 2 < 4. Dijkstra pops A, relaxes (dist[B]=5, dist[C]=4). Pops C next (4) — locks it. Pops B (5), tries B->C = 5 + (-3) = 2 < 4 — but C is already finalised. Returns dist[C]=4. Wrong answer.

## bruteForce
Enumerate every path from source to target with DFS, sum their weights, pick the minimum. Exponential in path count. Bellman-Ford does it correctly in O(V * E) by relaxing all edges V - 1 times — slower than Dijkstra but immune to negative weights. SPFA (queue-based Bellman-Ford) is faster in practice on sparse graphs.

## optimal
If you must run something Dijkstra-shaped on a graph with negative edges (but no negative cycles), use **Johnson's algorithm**:
1. Add a virtual source s' connected to every node with weight 0.
2. Run Bellman-Ford from s' to get a height h[v] for each node.
3. Reweight each edge (u, v): w'(u, v) = w(u, v) + h[u] - h[v]. Now all w' are non-negative.
4. Run Dijkstra from each source. Translate back: real_dist = computed_dist - h[source] + h[target].

For single-source on a graph with negatives, Bellman-Ford alone in O(V * E) is the textbook answer.

## complexity
time: Dijkstra on positive weights with a binary heap is O((V + E) log V); Bellman-Ford is O(V * E); Johnson's is O(V * E + V * (V + E) log V).
space: O(V + E) for adjacency plus O(V) for the dist array.
notes: A min-heap that allows decrease-key (Fibonacci heap) brings Dijkstra to O(E + V log V), mostly theoretical.

## pitfalls
- Assuming "small negative weight, just a few of them" is fine — even a single negative edge can produce a wrong answer.
- Confusing "no negative cycle" with "no negative edge" — Dijkstra requires the stronger second condition.
- Adding a constant to all edges to make them positive: that changes the shortest path because longer paths absorb more constant.
- Using Dijkstra on a DAG with negative weights when a topological-order DP would correctly handle them.

## interviewTips
- When asked "shortest path," immediately ask "can edge weights be negative?" That single question shows you know the failure mode.
- For mixed-sign graphs without negative cycles, mention Bellman-Ford and Johnson's.
- For weighted DAGs with negative edges, mention topological sort plus relaxation in O(V + E).
- Be ready to draw the 3-node counter-example on a whiteboard — interviewers love a concrete refutation.

## code.python
```python
import heapq

def dijkstra(n, adj, source):
    dist = [float('inf')] * n
    dist[source] = 0
    heap = [(0, source)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            if w < 0:
                raise ValueError("Dijkstra requires non-negative edge weights")
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return dist

def bellman_ford(n, edges, source):
    dist = [float('inf')] * n
    dist[source] = 0
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            raise ValueError("Negative cycle reachable from source")
    return dist
```

## code.javascript
```javascript
function dijkstra(n, adj, source) {
  const dist = new Array(n).fill(Infinity);
  dist[source] = 0;
  const heap = [[0, source]];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [d, u] = heap.shift();
    if (d > dist[u]) continue;
    for (const [v, w] of adj[u]) {
      if (w < 0) throw new Error("Dijkstra requires non-negative weights");
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        heap.push([nd, v]);
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
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    heap.offer(new int[]{0, source});
    while (!heap.isEmpty()) {
        int[] cur = heap.poll();
        int d = cur[0], u = cur[1];
        if (d > dist[u]) continue;
        for (int[] e : adj[u]) {
            int v = e[0], w = e[1];
            if (w < 0) throw new IllegalArgumentException("Negative edge");
            if (d + w < dist[v]) {
                dist[v] = d + w;
                heap.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}
```

## code.cpp
```cpp
vector<long long> dijkstra(int n, vector<vector<pair<int,int>>>& adj, int source) {
    vector<long long> dist(n, LLONG_MAX);
    dist[source] = 0;
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> heap;
    heap.push({0, source});
    while (!heap.empty()) {
        auto [d, u] = heap.top(); heap.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (w < 0) throw runtime_error("Negative edge");
            if (d + w < dist[v]) {
                dist[v] = d + w;
                heap.push({dist[v], v});
            }
        }
    }
    return dist;
}
```
