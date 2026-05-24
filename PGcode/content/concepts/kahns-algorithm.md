---
slug: kahns-algorithm
module: graphs
title: Kahn's Algorithm
subtitle: Topological sort by repeatedly emitting zero in-degree nodes — a BFS over dependencies.
difficulty: Intermediate
position: 14
estimatedReadMinutes: 6
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
Kahn's algorithm produces a topological ordering of a DAG by an iterative "peel the onion" process: enqueue every node with no incoming edges, emit one, decrement the in-degree of its neighbors, and repeat. When the queue empties, the emitted sequence is a valid topological order — unless some nodes were never reached, which proves the graph contains a cycle.

## whyItMatters
Topological order is the linearization that course schedulers, build systems, and task runners depend on. Make, Bazel, Airflow, and React's effect dependency analyzer all conceptually run Kahn's. The BFS framing has two practical advantages over the DFS post-order alternative: it detects cycles cleanly (any leftover non-zero-degree node is on a cycle), and it generalizes to "level-order" topo sorts useful for parallel scheduling.

## intuition
Think of a recipe with steps that depend on earlier steps. Steps with no prerequisites can start immediately — put them in a "ready" queue. Each time you finish one, mark every step that was waiting on it; if a waiting step now has zero remaining prerequisites, it joins the queue. The order in which you finish steps is a valid topological order. If you finish fewer steps than the total, some loop of mutual prerequisites is starving the queue — that's a cycle.

## visualization
```
Graph:  A -> C,  B -> C,  C -> D,  B -> D

In-degree:  A:0  B:0  C:2  D:2
Queue:      [A, B]                emit A -> dec C:1
            [B]                   emit B -> dec C:0, dec D:1; enqueue C
            [C]                   emit C -> dec D:0; enqueue D
            [D]                   emit D
Result:     [A, B, C, D]   (one valid order; [B, A, C, D] is also valid)
```
A cycle would manifest as some node — say `D` with `D -> C` added — whose in-degree never reaches zero, leaving it forever outside the queue.

## bruteForce
The "DFS post-order reverse" approach also yields a topo sort: DFS the graph, push each finished node onto a stack, then pop. It is just as correct and the same `O(V + E)` complexity, but cycle detection requires a separate gray/white/black coloring and the order is determined by DFS traversal whims, which is harder to reason about for scheduling. Kahn's is the version interviewers typically expect because the cycle check and the order emerge from the same loop.

## optimal
Compute `indeg[v]` for every vertex. Push every `v` with `indeg[v] == 0` onto a FIFO queue. While the queue is non-empty, pop `u`, append it to the result, and for each edge `(u, v)`, decrement `indeg[v]`; if it hits zero, enqueue `v`. Stop when the queue empties. If `len(result) < V`, the graph has a cycle and no topological order exists.

```
kahn(V, adj):
  indeg = [0] * V
  for u in 0..V-1: for v in adj[u]: indeg[v] += 1
  queue = [v for v in 0..V-1 if indeg[v] == 0]
  order = []
  while queue:
    u = queue.popleft()
    order.append(u)
    for v in adj[u]:
      indeg[v] -= 1
      if indeg[v] == 0: queue.append(v)
  return order if len(order) == V else CYCLE
```

## complexity
time: O(V + E)
space: O(V)
notes: Each vertex is enqueued and dequeued exactly once; each edge contributes one in-degree decrement. Swapping the FIFO queue for a min-heap gives the lexicographically smallest topological order in `O((V + E) log V)`, a common follow-up.

## pitfalls
- Forgetting to count multi-edges separately when building `indeg` — a duplicate edge means an extra decrement is required before the child is ready.
- Detecting "cycle" by checking if the queue ever became empty before emitting anything; the correct check is `emitted < V` at the end.
- Mutating the original adjacency list during decrement — preserve it and operate on a separate `indeg` array.
- Returning a partial order when a cycle exists. Interviewers want an explicit "impossible" signal (empty list, `None`, exception), not a truncated list.

## interviewTips
- State both options and pick: "BFS Kahn's gives me cycle detection for free; DFS post-order needs separate coloring."
- For lexicographically smallest order, swap the queue for a heap. For parallel scheduling, emit *all* zero-degree nodes as a level before processing them — the number of levels is the critical path length.
- Common reductions: Course Schedule, Alien Dictionary, Build System Order, Task Scheduling with Dependencies.
- Mention that the result is one of potentially many valid orderings; the algorithm picks one based on enqueue order.

## code.python
```python
from collections import deque

def kahn(n, adj):
    indeg = [0] * n
    for u in range(n):
        for v in adj[u]:
            indeg[v] += 1
    queue = deque(v for v in range(n) if indeg[v] == 0)
    order = []
    while queue:
        u = queue.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                queue.append(v)
    return order if len(order) == n else None
```

## code.javascript
```javascript
function kahn(n, adj) {
  const indeg = new Array(n).fill(0);
  for (let u = 0; u < n; u++) for (const v of adj[u]) indeg[v]++;
  const queue = [];
  for (let v = 0; v < n; v++) if (indeg[v] === 0) queue.push(v);
  const order = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    order.push(u);
    for (const v of adj[u]) {
      if (--indeg[v] === 0) queue.push(v);
    }
  }
  return order.length === n ? order : null;
}
```

## code.java
```java
public int[] kahn(int n, List<List<Integer>> adj) {
    int[] indeg = new int[n];
    for (int u = 0; u < n; u++) for (int v : adj.get(u)) indeg[v]++;
    Deque<Integer> queue = new ArrayDeque<>();
    for (int v = 0; v < n; v++) if (indeg[v] == 0) queue.add(v);
    int[] order = new int[n];
    int idx = 0;
    while (!queue.isEmpty()) {
        int u = queue.poll();
        order[idx++] = u;
        for (int v : adj.get(u)) if (--indeg[v] == 0) queue.add(v);
    }
    return idx == n ? order : null;
}
```

## code.cpp
```cpp
vector<int> kahn(int n, vector<vector<int>>& adj) {
    vector<int> indeg(n, 0);
    for (int u = 0; u < n; ++u) for (int v : adj[u]) ++indeg[v];
    queue<int> q;
    for (int v = 0; v < n; ++v) if (indeg[v] == 0) q.push(v);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);
    }
    return (int)order.size() == n ? order : vector<int>{};
}
```
