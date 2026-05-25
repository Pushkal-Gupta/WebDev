---
slug: dijkstra-no-negative
module: graphs-shortest-paths
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
The failure mode exists because Dijkstra's algorithm rests on a **greedy-settle invariant**: the moment a vertex u is popped from the min-priority-queue, the algorithm declares dist[u] final and never reconsiders it. That invariant is justified by a single structural argument — with non-negative edge weights, any *future* path that discovers u must traverse at least as much edge weight as the path Dijkstra already found, so the future path cannot be shorter. The proof is by induction on extraction order: the popped vertex has the smallest tentative distance among unsettled vertices, and any alternate path to it must leave the settled set through another unsettled vertex with equal-or-greater distance, plus non-negative extension cost — so the alternate path is no better.

A negative edge invalidates this argument because "extending a path can only increase its length" no longer holds. A longer-so-far path that later traverses a negative edge can undercut the value Dijkstra committed to. The concrete failure: take a graph with three vertices A, B, C and edges A→B (weight 5), A→C (weight 4), B→C (weight −3). True shortest distances from A: A=0, B=5, C=2 (via A→B→C). Dijkstra pops A (0), relaxes neighbours: dist[B]=5, dist[C]=4. Pops C next (4 is smaller than 5), locks dist[C]=4. Pops B (5), tries B→C: 5 + (−3) = 2, which is less than the supposedly-final 4 — but C is already settled. Dijkstra returns dist[C]=4. Wrong by 2.

The deeper structural reason: Dijkstra's correctness requires the edge-weight space to form a non-negative-weight metric. With non-negative weights, the partial-order extension property holds: extending a path strictly weakly increases its length. Negative weights break this property locally; in graphs that lack negative cycles globally, alternative algorithms (Bellman-Ford O(V·E), Johnson's O(V·E + V·(V+E) log V) for all-pairs) restore correctness at the cost of more work.

Crucially, "small negative weight" or "rare negative edges" do not rescue Dijkstra — a single misplaced negative edge anywhere on a relevant alternate path produces a wrong answer. The rule is **all weights must be non-negative**, not "mostly non-negative". Adding a constant to all edges to make them positive is also wrong because longer paths absorb more constant offset and the shortest path can shift. For DAGs with negative weights, topological-order DP correctly handles negatives in O(V + E); Bellman-Ford handles general graphs with negatives but no negative cycles; Johnson's reweights then runs Dijkstra V times for all-pairs.

## visualization
Three vertices: A, B, C. Edges A->B weight 1, A->C weight 4, B->C weight -3. True shortest distances from A: A=0, B=1, C = 1 + (-3) = -2. Dijkstra: push A (0). Pop A, relax: dist[B]=1, dist[C]=4. Pop B (1), relax: dist[C] = min(4, 1 + (-3)) = -2. So far so good — Dijkstra got C right. Now swap: A->B = 5, A->C = 4, B->C = -3. True: A=0, C=4, B=5, but path A->B->C = 2 < 4. Dijkstra pops A, relaxes (dist[B]=5, dist[C]=4). Pops C next (4) — locks it. Pops B (5), tries B->C = 5 + (-3) = 2 < 4 — but C is already finalised. Returns dist[C]=4. Wrong answer.

## bruteForce
Enumerate every path from source to target with DFS, sum their weights, pick the minimum. Exponential in path count. Bellman-Ford does it correctly in O(V * E) by relaxing all edges V - 1 times — slower than Dijkstra but immune to negative weights. SPFA (queue-based Bellman-Ford) is faster in practice on sparse graphs.

## optimal
**Technique: choose the right shortest-path algorithm for the weight structure — Dijkstra only on non-negative graphs; Bellman-Ford for single-source with negatives; Johnson's for all-pairs with negatives.** Each saturates its respective lower bound for the graph class it targets.

```python
# Wrong: Dijkstra on a graph with negative edges
# Right: Bellman-Ford for single-source with negatives, no negative cycles
def bellman_ford(n, edges, src):
    INF = float('inf')
    dist = [INF] * n
    dist[src] = 0
    for _ in range(n - 1):                          # V-1 relaxation passes
        for u, v, w in edges:
            if dist[u] != INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    # Negative-cycle detection: one more pass; if any update happens, cycle exists
    for u, v, w in edges:
        if dist[u] != INF and dist[u] + w < dist[v]:
            return None                             # negative cycle reachable from src
    return dist
```

```python
# All-pairs with negatives: Johnson's (reweight + V·Dijkstra)
def johnson(n, edges):
    h = [0] * (n + 1)                                # virtual super-source s' = n
    aug = edges + [(n, v, 0) for v in range(n)]
    for _ in range(n):                               # Bellman-Ford from s'
        updated = False
        for u, v, w in aug:
            if h[u] + w < h[v]:
                h[v] = h[u] + w; updated = True
        if not updated: break
    for u, v, w in aug:                              # detect negative cycle
        if h[u] + w < h[v]: return None
    # Reweight: w'(u,v) = w + h[u] - h[v], guaranteed non-negative by triangle ineq.
    reweighted = [(u, v, w + h[u] - h[v]) for u, v, w in edges]
    # Run Dijkstra from each source on reweighted graph; translate distances back
    # real_dist[s][t] = reweighted_dist[s][t] - h[s] + h[t]
    ...
```

Key lines: in Bellman-Ford, `for _ in range(n - 1)` runs V−1 relaxation passes — the invariant after pass i is "dist[v] = shortest cost reaching v via at most i edges". After V−1 passes, all simple paths are covered (longest simple path has V−1 edges). The extra V-th pass detects negative cycles: if any edge still relaxes after V−1 passes, a negative cycle exists reachable from src. In Johnson's, the virtual super-source connected to every node with weight 0 guarantees every vertex gets a finite potential h[v]; the reweighting `w'(u,v) = w(u,v) + h[u] - h[v]` is non-negative by the triangle inequality (h[v] ≤ h[u] + w(u,v) from Bellman-Ford convergence).

**Algorithm choice matrix:**

| Graph properties | Algorithm | Complexity |
|---|---|---|
| Non-negative weights, single-source | Dijkstra (binary heap) | O((V+E) log V) |
| Non-negative integer weights ≤ W | Dial's bucket queue | O(E + V·W) |
| DAG (any weights) | Topological sort + relaxation | O(V + E) |
| General weights, no negative cycle, single-source | Bellman-Ford | O(V·E) |
| General weights, no negative cycle, all-pairs | Johnson's | O(V·E + V·(V+E) log V) |
| Dense general weights, all-pairs | Floyd-Warshall | O(V³) |
| Unweighted | BFS | O(V + E) |

**Common bugs and decision questions**: always ask "can edge weights be negative?" before reaching for Dijkstra. For mixed-sign graphs without negative cycles, mention Bellman-Ford or Johnson's. For DAGs with negatives, mention topological-order DP. Never "add a constant" to make weights positive — that changes the relative cost of longer vs shorter paths. Don't confuse "no negative cycle" (BF/Johnson's OK) with "no negative edge" (Dijkstra requires the stronger condition). For currency-arbitrage detection, negative cycles are the *signal*; use BF inside Johnson's to flag them.

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
