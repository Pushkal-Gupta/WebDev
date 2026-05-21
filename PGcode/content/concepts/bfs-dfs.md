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

## visualization
Grid:
```
0 - 1 - 2
|       |
3 - 4 - 5
```
**BFS from 0:** visit 0, then {1, 3}, then {2, 4}, then {5}. Yields levels = distances.
**DFS from 0:** visit 0, 1, 2, 5, 4, 3 (one possible order). Goes deep first.

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
