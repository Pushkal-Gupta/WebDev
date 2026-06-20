---
slug: kahn-topological-sort
module: graphs-advanced
title: Kahn's Topological Sort
subtitle: BFS-style topological order using an in-degree queue — produces an order or proves the graph has a cycle.
difficulty: Intermediate
position: 32
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Directed Graphs"
    url: "https://algs4.cs.princeton.edu/42digraph/"
    type: book
  - title: "cp-algorithms — Topological sort"
    url: "https://cp-algorithms.com/graph/topological-sort.html"
    type: blog
  - title: "TheAlgorithms/Python — topological_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/kahns_algorithm_topo.py"
    type: repo
status: published
---

## intro
Kahn's algorithm produces a topological ordering of a directed acyclic graph by repeatedly emitting nodes with zero remaining in-degree. Start by computing every vertex's in-degree and pushing the zero-in-degree vertices into a queue. Pop one, append it to the output, decrement each neighbour's in-degree, and push any neighbour that just dropped to zero. Repeat until the queue is empty. If the output covers every vertex, you have a valid topological order; if not, the remaining vertices form one or more cycles.

## whyItMatters
- Build systems (Make, Bazel, npm) topologically sort target dependencies so each target builds after its prerequisites.
- Course-prerequisite planners, package managers, and university schedulers all reduce to this problem.
- Modern JavaScript module evaluation uses topological order to decide module initialisation sequence.
- Spreadsheet recalculation orders formula cells topologically so each cell sees up-to-date inputs.
- Kahn's BFS form is the natural fit for **counting** topological orders, finding **lexicographically smallest** orders, and **parallel scheduling** (every "wave" of zero-in-degree nodes can run concurrently).

## intuition
A node has zero in-degree exactly when no other node points to it — equivalently, no dependency remains. Such a node can be safely placed first in the order, because nothing in the remaining graph requires it. After placing it, the edges leaving it are no longer relevant; remove them by decrementing the in-degree of each neighbour. Now some neighbours might themselves have zero remaining in-degree — they have just become safe to place next.

This produces a **wavefront** of nodes that are simultaneously "free". You can pick from the wavefront in any order — FIFO, LIFO, lex-smallest — and the result is still a valid topological order. The choice of queue discipline controls *which* topological order you get, not whether one is produced.

If at any point the wavefront empties but unvisited nodes remain, every remaining node has at least one in-edge from another remaining node. That is exactly the structural definition of a cycle: a closed chain of dependencies. Kahn's algorithm therefore doubles as a **cycle detector** for free — emit fewer than `n` nodes and the leftover set contains all the cyclic nodes.

## visualization
Graph `5 -> 0, 5 -> 2, 4 -> 0, 4 -> 1, 2 -> 3, 3 -> 1`.

```
nodes:        0  1  2  3  4  5
in-degree:    2  2  1  1  0  0

queue = [4, 5]     output = []

pop 4 -> output [4]
  decrement in[0]=1, in[1]=1     queue = [5]
pop 5 -> output [4, 5]
  decrement in[0]=0, in[2]=0     queue = [0, 2]
pop 0 -> output [4, 5, 0]                queue = [2]
pop 2 -> output [4, 5, 0, 2]
  decrement in[3]=0              queue = [3]
pop 3 -> output [4, 5, 0, 2, 3]
  decrement in[1]=0              queue = [1]
pop 1 -> output [4, 5, 0, 2, 3, 1]       queue = []

emitted 6 of 6 nodes -> valid topo order.
```

If you swap the queue for a min-heap, the **lex-smallest** order pops out instead. If a cycle existed (say add edge `1 -> 4`), the emitted count would stay below 6 and the leftover set `{1, 4, ...}` would expose the cycle members.

## bruteForce
DFS-based topological sort (Tarjan's other algorithm) does the same job in `O(V + E)` but using post-order on a recursive DFS. It is equally good asymptotically — Kahn's wins when you also need cycle reporting, parallel-wave scheduling, or lex-smallest order.

## optimal
In-degree array + FIFO queue.

```python
from collections import deque

def kahn_topo(n, edges):
    graph = [[] for _ in range(n)]
    in_deg = [0] * n
    for u, v in edges:
        graph[u].append(v)
        in_deg[v] += 1
    q = deque(u for u in range(n) if in_deg[u] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            in_deg[v] -= 1
            if in_deg[v] == 0:
                q.append(v)
    if len(order) != n:
        return None        # cycle detected
    return order
```

To produce the lex-smallest order, swap `deque` for a min-heap and `popleft` for `heappop`; cost becomes `O((V + E) log V)`. To detect *which* nodes are in cycles, return the set of vertices with `in_deg[v] > 0` after the main loop — every such vertex lies on at least one cycle. To run waves in parallel, drain the queue in batches: each batch is one wavefront and its members have no dependency between them, so they can be processed concurrently.

## complexity
- **Time**: `O(V + E)` — each vertex enqueued/dequeued once, each edge inspected once.
- **Space**: `O(V + E)` for the graph adjacency, `O(V)` for the queue and in-degree array.
- **Doubles as cycle detector**: if the output size is less than `V`, a cycle exists in the leftover vertices.

## pitfalls
- **Not decrementing in-degree.** Without the decrement, no second-wave node ever becomes free and only the initial roots are emitted. Fix: `in_deg[v] -= 1` after popping `u` for every outgoing edge `u -> v`.
- **Pushing duplicates into the queue.** A node should enter the queue exactly once, the moment its in-degree hits zero. Fix: only push when `in_deg[v] == 0` *after* the decrement.
- **Mutating the original in-degree array on a graph you still need.** If you rerun the algorithm, the array is now zeroed out. Fix: copy `in_deg` if the caller needs it intact.
- **Treating empty output as success.** An empty graph has empty output, but so does a graph that is entirely one big cycle. Fix: compare `len(order)` against `n`.

## interviewTips
- Mention cycle detection as a free side-effect — that's the question the interviewer usually wants to push you toward.
- Bring up the priority-queue variant for "lex-smallest topological order" before the interviewer does.
- Connect it to scheduling: every wavefront is one parallel batch — useful for distributed build systems.

## code.python
```python
from collections import deque
def kahn_topo(n, edges):
    g = [[] for _ in range(n)]; ind = [0]*n
    for u, v in edges: g[u].append(v); ind[v] += 1
    q = deque(u for u in range(n) if ind[u] == 0)
    order = []
    while q:
        u = q.popleft(); order.append(u)
        for v in g[u]:
            ind[v] -= 1
            if ind[v] == 0: q.append(v)
    return order if len(order) == n else None
```

## code.javascript
```javascript
function kahnTopo(n, edges) {
  const g = Array.from({ length: n }, () => []);
  const ind = new Array(n).fill(0);
  for (const [u, v] of edges) { g[u].push(v); ind[v]++; }
  const q = []; for (let u = 0; u < n; u++) if (ind[u] === 0) q.push(u);
  const order = [];
  while (q.length) {
    const u = q.shift(); order.push(u);
    for (const v of g[u]) { if (--ind[v] === 0) q.push(v); }
  }
  return order.length === n ? order : null;
}
```

## code.java
```java
public List<Integer> kahnTopo(int n, int[][] edges) {
    List<List<Integer>> g = new ArrayList<>();
    for (int i = 0; i < n; i++) g.add(new ArrayList<>());
    int[] ind = new int[n];
    for (int[] e : edges) { g.get(e[0]).add(e[1]); ind[e[1]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int u = 0; u < n; u++) if (ind[u] == 0) q.offer(u);
    List<Integer> order = new ArrayList<>();
    while (!q.isEmpty()) {
        int u = q.poll(); order.add(u);
        for (int v : g.get(u)) if (--ind[v] == 0) q.offer(v);
    }
    return order.size() == n ? order : null;
}
```

## code.cpp
```cpp
vector<int> kahnTopo(int n, vector<pair<int,int>>& edges) {
    vector<vector<int>> g(n); vector<int> ind(n, 0);
    for (auto& [u, v] : edges) { g[u].push_back(v); ind[v]++; }
    queue<int> q;
    for (int u = 0; u < n; u++) if (ind[u] == 0) q.push(u);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : g[u]) if (--ind[v] == 0) q.push(v);
    }
    return (int)order.size() == n ? order : vector<int>{};
}
```
