---
slug: zero-one-bfs
module: graphs-traversal
title: 0-1 BFS
subtitle: Shortest path on a graph with edge weights 0 or 1 in O(V + E) using a deque — Dijkstra without the log.
difficulty: Intermediate
position: 19
estimatedReadMinutes: 5
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
When every edge weight is **0 or 1**, you can compute single-source shortest paths in **O(V + E)** — the same speed as BFS, without the `log V` factor that Dijkstra needs. The trick: replace the priority queue with a **double-ended queue**. Push 0-edges to the front, 1-edges to the back. The deque stays sorted by distance automatically.

## whyItMatters
A surprising number of grid / graph problems have a natural 0/1 weighting:
- "Minimum cost to move from corner to corner where you can flip k portals" — toggling a portal costs 1, walking is 0.
- "Shortest path in a grid where some moves are free."
- "Min cost to reach a state in a state-space search where transitions are either free or cost a token."

Dijkstra works but is slower. BFS doesn't work because edge weights differ. 0-1 BFS is the right tool.

## intuition
BFS works in O(V + E) when all edges have equal weight because each "level" of the BFS tree corresponds to a fixed distance from the source — nodes in level k are all at distance k. Dijkstra extends this to non-negative weights at the cost of a log V factor for the priority queue. When weights are restricted to just 0 or 1, neither tool fits perfectly: BFS gives wrong answers because edges have different weights, and Dijkstra is heavier than necessary. The 0-1 BFS gets the best of both worlds by replacing the priority queue with a double-ended queue (deque) and exploiting the structural property that 0-weight edges keep you in the same "distance bucket" while 1-weight edges push you to the next bucket. The deque holds nodes sorted by distance — pop from the front to process the closest unprocessed node. When relaxing an edge of weight 0, push the destination to the *front* (it shares the same bucket as the source); when relaxing weight 1, push to the *back* (it belongs to the next bucket). This insertion discipline keeps the deque distance-sorted automatically — no comparisons, no logarithms. Each edge is examined at most twice (once when relaxed, possibly once when the node is reprocessed with a better distance), giving total O(V + E). The deep insight is that distance-sorted ordering can be maintained cheaply when the weight set is small and bounded — for weights in {0, 1} a deque suffices; for weights in {0, ..., k} a k-bucket queue gives O(V + k * E); for arbitrary non-negative weights you need the full Dijkstra heap. This is the W = 1 special case of a broader monotonic-queue family.

## visualization
```
Graph (0-edges in dashes, 1-edges in arrows):
   0 ──0── 1 ─1─► 2
            └─0──► 3

BFS from 0:
deque   visited   dist[1] dist[2] dist[3]
[0]                ∞       ∞       ∞
pop 0, push-front 1 via 0  → dist[1]=0
[1]                0       ∞       ∞
pop 1, push-back 2 via 1   → dist[2]=1
      push-front 3 via 0   → dist[3]=0
[3, 2]             0       1       0
pop 3              0       1       0
pop 2              0       1       0
```

## bruteForce
Use Dijkstra. Correct, just slower (O((V + E) log V)).

## optimal
```
from collections import deque

def bfs01(n, adj, source):
    dist = [float('inf')] * n
    dist[source] = 0
    dq = deque([source])
    while dq:
        u = dq.popleft()
        for v, w in adj[u]:
            nd = dist[u] + w
            if nd < dist[v]:
                dist[v] = nd
                if w == 0:
                    dq.appendleft(v)
                else:
                    dq.append(v)
    return dist
```

Each node may be relaxed multiple times (the same node can appear in the deque more than once), but the total work is still O(V + E) because each edge is examined at most twice and each node settles to its final distance the first time it's popped with that distance.

For a **stale-skip optimization**, when popping, check if the popped value's distance equals `dist[u]` — if not, it was added back later with a smaller distance; skip.

## complexity
- **Time**: O(V + E).
- **Space**: O(V) for distances + deque.
- **Beats Dijkstra** by a `log V` factor when all weights are 0 or 1.

## pitfalls
- **Weights not 0 or 1**: 0-1 BFS gives wrong answers. Use Dijkstra.
- **Negative edge weights**: doesn't apply — assumes non-negative.
- **Forgetting the order**: weight-0 to the FRONT, weight-1 to the BACK. Backwards = wrong answers.
- **Multi-graphs**: handle as usual; the deque trick doesn't care.

## interviewTips
- The trigger: "shortest path / minimum cost in a graph where transitions are either free or cost one unit." 0-1 BFS.
- For grid problems, this often shows up after a state-encoding step — be ready to identify it.
- Compare with **Dijkstra** (general non-negative weights), **BFS** (unweighted / uniform-weight), **Bellman-Ford** (negative weights).
- For senior interviews, mention that this is the W = 1 special case of **monotonic queue** Dijkstra (works for weights in {0..k} with a deque + k buckets).

## code.python
```python
from collections import deque

def bfs01(n, edges, source):
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    dist = [float('inf')] * n
    dist[source] = 0
    dq = deque([source])
    while dq:
        u = dq.popleft()
        for v, w in adj[u]:
            nd = dist[u] + w
            if nd < dist[v]:
                dist[v] = nd
                if w == 0: dq.appendleft(v)
                else:      dq.append(v)
    return dist

edges = [(0,1,0),(1,2,1),(1,3,0),(2,3,1)]
print(bfs01(4, edges, 0))   # [0, 0, 1, 0]
```

## code.javascript
```javascript
function bfs01(n, edges, source) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const dist = new Array(n).fill(Infinity);
  dist[source] = 0;
  const dq = [source];
  while (dq.length) {
    const u = dq.shift();
    for (const [v, w] of adj[u]) {
      const nd = dist[u] + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        if (w === 0) dq.unshift(v); else dq.push(v);
      }
    }
  }
  return dist;
}
```

## code.java
```java
import java.util.*;
class ZeroOneBFS {
    public int[] shortest(int n, int[][] edges, int source) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(new int[]{ e[1], e[2] });
        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[source] = 0;
        Deque<Integer> dq = new ArrayDeque<>();
        dq.add(source);
        while (!dq.isEmpty()) {
            int u = dq.pollFirst();
            for (int[] nb : adj[u]) {
                int nd = dist[u] + nb[1];
                if (nd < dist[nb[0]]) {
                    dist[nb[0]] = nd;
                    if (nb[1] == 0) dq.addFirst(nb[0]); else dq.addLast(nb[0]);
                }
            }
        }
        return dist;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <deque>
#include <climits>
std::vector<int> bfs01(int n, std::vector<std::tuple<int,int,int>>& edges, int source) {
    std::vector<std::vector<std::pair<int,int>>> adj(n);
    for (auto [u, v, w] : edges) adj[u].push_back({v, w});
    std::vector<int> dist(n, INT_MAX);
    dist[source] = 0;
    std::deque<int> dq{source};
    while (!dq.empty()) {
        int u = dq.front(); dq.pop_front();
        for (auto [v, w] : adj[u]) {
            int nd = dist[u] + w;
            if (nd < dist[v]) {
                dist[v] = nd;
                if (w == 0) dq.push_front(v); else dq.push_back(v);
            }
        }
    }
    return dist;
}
```
