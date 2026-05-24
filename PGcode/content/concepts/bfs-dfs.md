---
slug: bfs-dfs
module: trees
title: BFS & DFS
subtitle: The two foundational graph/tree traversals — every harder algorithm builds on these.
difficulty: Beginner
position: 5
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Balanced Search Trees"
    url: "https://algs4.cs.princeton.edu/33balanced/"
    type: book
  - title: "cp-algorithms — Trees and tree algorithms"
    url: "https://cp-algorithms.com/graph/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/binary_tree/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/binary_tree"
    type: repo
status: published
---

## intro
Breadth-first search (BFS) and depth-first search (DFS) are the two ways to visit every vertex of a graph or tree exactly once. They look almost identical in code — swap a queue for a stack and they swap behaviors. But they answer fundamentally different questions: BFS finds *shortest paths in an unweighted graph*; DFS naturally produces *topological orders, articulation points, and bridges*.

## whyItMatters
Almost every graph problem reduces to "do BFS or DFS, while tracking X." Connected components? DFS on each unvisited vertex. Shortest unweighted path? BFS from source. Cycle detection? DFS with three colors. Topological sort? DFS with finish-times. Bipartite check? BFS with two-coloring. Internalize the templates and most graph problems become 20-line solutions.

## intuition
- **BFS** explores layer by layer. From the source, it visits all distance-1 neighbors, then all distance-2, and so on. A FIFO queue is what enforces this layering.
- **DFS** dives as deep as possible before backtracking. It explores one branch fully, returns, explores the next. A LIFO stack (or recursion) enforces depth-first behavior.

The *only* structural difference in the code is queue (BFS) vs stack/recursion (DFS). The visited set, the neighbor expansion, the loop structure — all identical.

A useful mental model:
1. Both algorithms maintain a `frontier` (queue or stack) of vertices "discovered but not yet processed" and a `visited` set of vertices "discovered."
2. Each round: pop one vertex from the frontier, push its undiscovered neighbors, mark them visited.
3. The pop order is the only difference. FIFO -> BFS waveform; LIFO -> DFS plunge.

If you swap `queue.popleft()` for `stack.pop()` in the same loop body, BFS becomes DFS — that is literally the entire change.

## walkthroughExample
Graph (undirected):
```
            1 ----- 2
           /         \
          0           5
           \         /
            3 ----- 4
```
Adjacency: 0:[1,3], 1:[0,2], 2:[1,5], 3:[0,4], 4:[3,5], 5:[2,4]. Start vertex = 0.

**BFS trace** (queue, FIFO). Mark visited on *enqueue*:
```
   step  action              queue            visited       dist
   ----  ------------------  ---------------  ------------  ----
   0     enqueue 0           [0]              {0}           0:0
   1     pop 0, enq 1,3      [1, 3]           {0,1,3}       1:1, 3:1
   2     pop 1, enq 2        [3, 2]           {0,1,3,2}     2:2
   3     pop 3, enq 4        [2, 4]           {0,1,3,2,4}   4:2
   4     pop 2, enq 5        [4, 5]           {...,5}       5:3
   5     pop 4, (no new)     [5]              same          -
   6     pop 5, (no new)     []               same          -
   done                                                     dist done
```
Final distances from 0: `{0:0, 1:1, 3:1, 2:2, 4:2, 5:3}`. Visit order: `0, 1, 3, 2, 4, 5`.

**DFS trace** (stack, LIFO). Mark visited on *pop*:
```
   step  action              stack                visited
   ----  ------------------  -------------------  ------------------
   0     push 0              [0]                  {}
   1     pop 0, push 1,3     [1, 3]               {0}
   2     pop 3, push 0,4     [1, 0, 4]            {0, 3}
   3     pop 4, push 3,5     [1, 0, 3, 5]         {0, 3, 4}
   4     pop 5, push 2,4     [1, 0, 3, 2, 4]      {0, 3, 4, 5}
   5     pop 4 (visited)     [1, 0, 3, 2]         skip
   6     pop 2, push 1,5     [1, 0, 3, 1, 5]      {0, 3, 4, 5, 2}
   7     pop 5 (visited)     [1, 0, 3, 1]         skip
   8     pop 1, push 0,2     [1, 0, 3, 0, 2]      {0, 3, 4, 5, 2, 1}
   9     pop 2 (visited)     ...                  skip
   ...   (skips until empty)
```
Visit order: `0, 3, 4, 5, 2, 1` — depth-first one branch at a time.

Same graph, two different traversal trees:
```
   BFS tree (rooted at 0):              DFS tree (rooted at 0):
                                                            
              0                                  0
            /   \                              /
           1     3                            3
           |     |                            |
           2     4                            4
                 |                            |
                 5                            5
                                              |
                                              2
                                              |
                                              1
```

## visualization
Snapshot 1 — BFS wavefront from vertex 0 (distance shells):
```
   distance 0:                  [0]
                              /     \
   distance 1:               [1]    [3]
                              |      |
   distance 2:               [2]    [4]
                                \  /
   distance 3:                  [5]
```

Snapshot 2 — DFS depth-first dive (arrows show recursion order, dashed = back):
```
                  0
                  |
                  v
                  3 -----> 4 -----> 5 -----> 2 -----> 1
                  ^.........................../
                       backtrack chain
```

Snapshot 3 — BFS vs DFS on the SAME graph, frame by frame after each pop:
```
   round 0:   BFS visited = {0}              DFS visited = {0}
   round 1:   BFS visited = {0,1,3}          DFS visited = {0,3}
   round 2:   BFS visited = {0,1,3,2}        DFS visited = {0,3,4}
   round 3:   BFS visited = {0,1,3,2,4}      DFS visited = {0,3,4,5}
   round 4:   BFS visited = {0,1,3,2,4,5}    DFS visited = {0,3,4,5,2}
   round 5:   done                           DFS visited = {0,3,4,5,2,1}
```

Snapshot 4 — when graphs disconnect, both algorithms need an outer loop:
```
   components:    {A,B,C}        {D,E}        {F}

   for v in all_vertices:
       if v not in visited:
           bfs_or_dfs(v)           <- starts a new traversal per component
```

## bruteForce
Visit every (source, target) pair to answer reachability: O(V² × E). BFS/DFS answers it for a single source in O(V + E) — orders of magnitude faster.

## optimal
**BFS template:**
```
queue = [source]
visited = {source}
while queue:
    u = queue.popleft()
    for v in neighbors(u):
        if v not in visited:
            visited.add(v); queue.append(v)
```

**DFS template (recursive):**
```
def dfs(u):
    visited.add(u)
    for v in neighbors(u):
        if v not in visited: dfs(v)
dfs(source)
```

**DFS iterative (use when recursion depth could blow the stack):**
```
stack = [source]
while stack:
    u = stack.pop()
    if u in visited: continue
    visited.add(u)
    for v in neighbors(u): stack.append(v)
```

For shortest paths in an *unweighted* graph, BFS — never DFS — gives correct distances.

## complexity
time: O(V + E) for both — each vertex enqueued/visited once, each edge examined once.
space: O(V) for the visited set; queue/stack can hold up to V vertices in the worst case.
notes: For weighted graphs with non-negative weights, BFS no longer gives shortest paths — use Dijkstra's. For weighted graphs with negative edges, use Bellman-Ford.

## pitfalls
- Forgetting to mark a vertex visited *when enqueued* (BFS) — leads to the same vertex being processed multiple times.
- Using DFS for shortest paths in unweighted graphs — DFS doesn't visit by distance, so it returns *some* path, not necessarily the shortest.
- Stack overflow in recursive DFS on deep graphs — switch to iterative for graphs with > ~10,000 vertices in tight stack budgets.
- Forgetting to handle disconnected graphs: wrap the traversal in a loop over all vertices, calling BFS/DFS on each unvisited one.

## interviewTips
- The first question for any graph problem: "BFS or DFS, and why?" Shortest-path-in-unweighted → BFS. Topo-sort / cycle detection / connected components → DFS. Most other things → either works.
- Always state the visited set up front. Forgetting to track visited is the most common bug.
- For grid problems, treat each cell as a vertex with up-to-4 neighbors. The graph is implicit; you don't need an adjacency list.

## code.python
```python
from collections import deque

def bfs(graph: dict, source) -> dict:
    """Returns distance from source to every reachable vertex."""
    dist = {source: 0}
    queue = deque([source])
    while queue:
        u = queue.popleft()
        for v in graph.get(u, []):
            if v not in dist:
                dist[v] = dist[u] + 1
                queue.append(v)
    return dist

def dfs(graph: dict, source) -> set:
    """Returns set of vertices reachable from source."""
    visited, stack = set(), [source]
    while stack:
        u = stack.pop()
        if u in visited: continue
        visited.add(u)
        for v in graph.get(u, []):
            if v not in visited: stack.append(v)
    return visited
```

## code.javascript
```javascript
function bfs(graph, source) {
  const dist = new Map([[source, 0]]);
  const queue = [source];
  while (queue.length) {
    const u = queue.shift();
    for (const v of (graph[u] || [])) {
      if (!dist.has(v)) { dist.set(v, dist.get(u) + 1); queue.push(v); }
    }
  }
  return dist;
}

function dfs(graph, source) {
  const visited = new Set();
  const stack = [source];
  while (stack.length) {
    const u = stack.pop();
    if (visited.has(u)) continue;
    visited.add(u);
    for (const v of (graph[u] || [])) if (!visited.has(v)) stack.push(v);
  }
  return visited;
}
```

## code.java
```java
public Map<Integer,Integer> bfs(Map<Integer,List<Integer>> graph, int source) {
    Map<Integer,Integer> dist = new HashMap<>();
    dist.put(source, 0);
    Deque<Integer> queue = new ArrayDeque<>();
    queue.offer(source);
    while (!queue.isEmpty()) {
        int u = queue.poll();
        for (int v : graph.getOrDefault(u, Collections.emptyList())) {
            if (!dist.containsKey(v)) {
                dist.put(v, dist.get(u) + 1);
                queue.offer(v);
            }
        }
    }
    return dist;
}
```

## code.cpp
```cpp
unordered_map<int,int> bfs(unordered_map<int, vector<int>>& graph, int source) {
    unordered_map<int,int> dist;
    dist[source] = 0;
    queue<int> q;
    q.push(source);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : graph[u]) {
            if (dist.find(v) == dist.end()) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return dist;
}
```
