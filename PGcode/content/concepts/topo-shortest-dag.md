---
slug: topo-shortest-dag
module: graphs
title: Shortest Paths on a DAG
subtitle: Relax edges in topological order for O(V+E) shortest paths — faster than Dijkstra, handles negative weights.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Acyclic Edge-Weighted Digraphs"
    url: "https://algs4.cs.princeton.edu/44sp/"
    type: book
  - title: "Shortest Paths in DAG — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/shortest-path-for-directed-acyclic-graphs/"
    type: blog
  - title: "TheAlgorithms/Python — bellman_ford.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/bellman_ford.py"
    type: repo
status: published
---

## intro
On a directed acyclic graph, shortest paths can be computed in linear time — even with negative edge weights. The trick is to relax edges in topological order: by the time you process vertex u, every shorter path into u has already been finalized. No priority queue, no log factor, no negative-cycle anxiety.

## whyItMatters
Project scheduling, critical-path method (CPM/PERT), event-time analysis, and longest-path-in-DAG problems all reduce to this template. It is also strictly better than Dijkstra whenever the graph happens to be acyclic — O(V+E) versus O((V+E) log V) — and it accepts negative weights, which Dijkstra cannot.

## intuition
Topological order guarantees that when you visit vertex u, you have already seen every predecessor. So d[u] is already its final shortest distance. Relaxing u's outgoing edges propagates this finality forward. Contrast with Dijkstra, which lacks this guarantee on cyclic graphs and must use a heap to always pull the smallest tentative distance — wasted work when the graph already lays out cleanly.

## visualization
Topologically sort the vertices: v0, v1, ..., v(n-1). Initialize d[source] = 0 and all other d[i] = infinity. Walk the sorted list left to right. At each vertex u with finite d[u], for each outgoing edge (u, v, w) update d[v] = min(d[v], d[u] + w). After the single pass, d[] holds shortest distances from source to every reachable vertex.

## bruteForce
Run Bellman-Ford: O(V * E). Works, but ignores the acyclic structure entirely. Or run Dijkstra with a heap: O((V + E) log V) and breaks on negative edges. Both leave the linear-time win on the table.

## optimal
Two phases: (1) topologically sort the DAG via DFS post-order or Kahn's algorithm — O(V + E); (2) walk the topological order from left to right, relaxing each outgoing edge of the current vertex — O(V + E). Total: O(V + E). To compute *longest* paths in a DAG, negate the weights and run the same algorithm — uniquely possible because the DAG has no negative cycles by definition.

## complexity
time: O(V + E) — one topological sort plus one relaxation pass.
space: O(V) for distances and the topological order, O(V + E) for the adjacency list.
notes: Unlike Dijkstra and Bellman-Ford, this is provably optimal: any algorithm must look at every edge at least once.

## pitfalls
- Running on a graph that has a cycle — silently produces wrong distances. Either verify acyclicity (Kahn's emits fewer than V vertices when a cycle exists) or use Bellman-Ford instead.
- Forgetting to initialize unreachable distances to infinity before relaxing — a sentinel like INT_MAX/4 prevents overflow when negative edges arrive.
- Processing vertices in the wrong order — reverse topological order computes shortest paths *to* a sink, not from a source. Be deliberate about direction.
- Trying to recover the path without storing parent pointers — track parent[v] = u at each successful relaxation.

## interviewTips
- Lead with the discriminator: "Is the graph acyclic? If yes, topological-order relaxation beats Dijkstra and tolerates negative weights."
- Be ready to flip the algorithm to compute longest paths — interviewers love this twist because it would be NP-hard on a general graph.
- Mention critical path method as the real-world application — project managers compute it daily without realizing they're running a DAG shortest-path algorithm.

## code.python
```python
from collections import deque

def topo_shortest(n, edges, src):
    INF = float('inf')
    adj = [[] for _ in range(n)]
    in_deg = [0] * n
    for u, v, w in edges:
        adj[u].append((v, w)); in_deg[v] += 1
    q = deque(i for i in range(n) if in_deg[i] == 0)
    order = []
    while q:
        u = q.popleft(); order.append(u)
        for v, _ in adj[u]:
            in_deg[v] -= 1
            if in_deg[v] == 0: q.append(v)
    if len(order) != n: return None
    dist = [INF] * n
    dist[src] = 0
    for u in order:
        if dist[u] == INF: continue
        for v, w in adj[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    return dist
```

## code.javascript
```javascript
function topoShortest(n, edges, src) {
  const INF = Infinity;
  const adj = Array.from({ length: n }, () => []);
  const inDeg = new Array(n).fill(0);
  for (const [u, v, w] of edges) { adj[u].push([v, w]); inDeg[v]++; }
  const queue = [];
  for (let i = 0; i < n; i++) if (inDeg[i] === 0) queue.push(i);
  const order = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++]; order.push(u);
    for (const [v] of adj[u]) if (--inDeg[v] === 0) queue.push(v);
  }
  if (order.length !== n) return null;
  const dist = new Array(n).fill(INF);
  dist[src] = 0;
  for (const u of order) {
    if (dist[u] === INF) continue;
    for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
  }
  return dist;
}
```

## code.java
```java
import java.util.*;

public int[] topoShortest(int n, int[][] edges, int src) {
    final int INF = Integer.MAX_VALUE / 4;
    List<int[]>[] adj = new List[n];
    int[] inDeg = new int[n];
    for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
    for (int[] e : edges) { adj[e[0]].add(new int[]{e[1], e[2]}); inDeg[e[1]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (inDeg[i] == 0) q.offer(i);
    int[] order = new int[n];
    int idx = 0;
    while (!q.isEmpty()) {
        int u = q.poll(); order[idx++] = u;
        for (int[] nb : adj[u]) if (--inDeg[nb[0]] == 0) q.offer(nb[0]);
    }
    if (idx != n) return null;
    int[] dist = new int[n];
    Arrays.fill(dist, INF);
    dist[src] = 0;
    for (int i = 0; i < n; i++) {
        int u = order[i];
        if (dist[u] == INF) continue;
        for (int[] nb : adj[u]) if (dist[u] + nb[1] < dist[nb[0]]) dist[nb[0]] = dist[u] + nb[1];
    }
    return dist;
}
```

## code.cpp
```cpp
#include <vector>
#include <queue>
#include <climits>
using namespace std;

vector<int> topoShortest(int n, vector<tuple<int,int,int>>& edges, int src) {
    const int INF = INT_MAX / 4;
    vector<vector<pair<int,int>>> adj(n);
    vector<int> inDeg(n, 0);
    for (auto& [u, v, w] : edges) { adj[u].push_back({v, w}); inDeg[v]++; }
    queue<int> q;
    for (int i = 0; i < n; i++) if (inDeg[i] == 0) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (auto& [v, w] : adj[u]) if (--inDeg[v] == 0) q.push(v);
    }
    if ((int)order.size() != n) return {};
    vector<int> dist(n, INF);
    dist[src] = 0;
    for (int u : order) {
        if (dist[u] == INF) continue;
        for (auto& [v, w] : adj[u]) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    }
    return dist;
}
```
