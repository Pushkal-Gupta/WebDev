---
slug: bfs-algorithm
module: graphs-traversal
title: Breadth-First Search (BFS)
subtitle: Explore a graph layer by layer with a queue and a visited set — shortest-path-by-edges in O(V + E).
difficulty: Beginner
position: 3
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Graphs: BFS"
    url: "https://algs4.cs.princeton.edu/41graph/"
    type: book
  - title: "cp-algorithms — Breadth-first search"
    url: "https://cp-algorithms.com/graph/breadth-first-search.html"
    type: blog
  - title: "TheAlgorithms/Python — bfs.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/breadth_first_search.py"
    type: repo
status: published
---

## intro
Breadth-first search explores a graph by expanding the **closest** unvisited vertex first, measured in number of edges from the source. It uses a FIFO queue: dequeue a vertex, mark it visited, enqueue each unvisited neighbour. The result is a tree (or forest) rooted at the source where the parent of each vertex is the one that first discovered it, and the depth of each vertex equals its **shortest unweighted distance** from the source. BFS runs in `O(V + E)` and is the simplest shortest-path algorithm in the graph algorithm toolkit.

## whyItMatters
- It is the textbook **shortest-path algorithm for unweighted graphs** (and the special case `0/1`-weights via 0-1 BFS or `k`-weights via multi-source BFS).
- Web crawlers, social-graph degree counts ("six degrees of separation"), and IP packet routing all reduce to BFS.
- It is the natural building block for **bipartite checking** (alternate colours layer by layer), **connected-components** counting, and **shortest cycle** detection.
- Multi-source BFS solves "rotten oranges", "walls and gates", "nearest exit" — any problem where multiple starting points spread at uniform speed.
- It is the simplest concrete demonstration of the "queue-based level-order" pattern that recurs across game AI, simulations, and discrete-event modelling.

## intuition
Imagine dropping a stone in still water at the source vertex. The first ripple touches every direct neighbour — depth 1. The second ripple touches everyone they touch (minus the already-wet vertices) — depth 2. And so on. The queue is the wavefront: every vertex it currently holds is at the same distance from the source, ready to discover the next layer.

The **visited flag** is essential. Without it the queue would re-enqueue vertices through their other in-edges, and dense graphs would explode. With it, each vertex is processed exactly once and each edge is inspected at most twice (once from each endpoint), giving the `O(V + E)` bound.

Why FIFO specifically? Because dequeueing the *oldest* vertex first guarantees that you finish layer `k` before starting layer `k + 1`. If you used a LIFO (stack) instead, you'd dive into one path before exploring the breadth, which is depth-first search — same coverage, different distances. The shortest-path-by-edges property hinges on FIFO: when a vertex is first dequeued, its distance is fixed and minimal, because every later way of reaching it goes through a longer path (more layers).

This is also why **early-exit** works: as soon as you dequeue the target, you know its distance, and you can stop. Recording each vertex's **parent** at enqueue time lets you reconstruct the actual path by walking parent pointers backward from the target.

## visualization
Graph with adjacency `{0: [1, 2], 1: [3], 2: [3, 4], 3: [5], 4: [5], 5: []}`. BFS from vertex 0:

```
queue:      [0]                   visited: {0}        dist[0] = 0
dequeue 0 -> visit 1, 2
queue:      [1, 2]                visited: {0,1,2}    dist[1]=1, dist[2]=1
dequeue 1 -> visit 3
queue:      [2, 3]                visited: {0,1,2,3}  dist[3]=2
dequeue 2 -> 3 already visited, visit 4
queue:      [3, 4]                visited: {0,1,2,3,4} dist[4]=2
dequeue 3 -> visit 5
queue:      [4, 5]                visited: {0,..,5}   dist[5]=3
dequeue 4 -> 5 already visited
queue:      [5]
dequeue 5 -> no unvisited neighbours
queue:      []                    done.

BFS tree:           0
                   / \
                  1   2
                  |   |\
                  3   3 4   (3 first discovered via 1)
                  |     |
                  5    (5 first discovered via 3)
```

## bruteForce
For unweighted single-source shortest paths, the naive alternative is to run a DFS from the source, try every path, and take the minimum — `O(V!)` worst case. Or run Dijkstra (`O((V + E) log V)`), which is overkill when all weights are 1. BFS does the right thing in linear time.

## optimal
FIFO queue + visited array + parent array for path reconstruction.

```python
from collections import deque

def bfs(graph, src):
    n = len(graph)
    dist = [-1] * n
    parent = [-1] * n
    dist[src] = 0
    q = deque([src])
    while q:
        u = q.popleft()
        for v in graph[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                parent[v] = u
                q.append(v)
    return dist, parent

def reconstruct(parent, target):
    path = []
    while target != -1:
        path.append(target)
        target = parent[target]
    return list(reversed(path))
```

For **multi-source BFS**, enqueue every source upfront with `dist = 0`; the algorithm computes the minimum distance from *any* source to every vertex in the same `O(V + E)`. For **0-1 BFS** (edges weighted 0 or 1), swap the queue for a **deque**: push 0-weight neighbours to the front, 1-weight neighbours to the back — still `O(V + E)`, generalises the BFS distance property to two weight classes without paying Dijkstra's log factor.

## complexity
- **Time**: `O(V + E)` — each vertex dequeued once, each edge inspected once.
- **Space**: `O(V)` — queue, visited/dist array, optional parent array.
- **Shortest paths**: BFS finds shortest paths in **unweighted** graphs and graphs with uniform edge weight.
- **Bipartiteness**: BFS naturally yields a 2-colouring during traversal; conflict = odd cycle = not bipartite.

## pitfalls
- **Marking visited at dequeue instead of enqueue.** Mark when you enqueue, otherwise the same vertex can enter the queue many times through different in-edges. Fix: set `dist[v] = ...` immediately before `q.append(v)`.
- **Using a Python `list` as a queue.** `pop(0)` is O(n); the whole algorithm degrades to `O(V * (V + E))`. Fix: use `collections.deque`.
- **Forgetting to handle disconnected graphs.** Single-source BFS only reaches the source's component. Fix: loop over all vertices and restart BFS for any with `dist == -1` if you need connected components.
- **Confusing BFS distance with weighted distance.** BFS layers count edges, not weights. Fix: switch to Dijkstra (positive weights) or 0-1 BFS / Bellman-Ford for weighted graphs.

## interviewTips
- Lead with "BFS = shortest path by number of edges, runs in `O(V + E)`" — interviewers want this fact in the first sentence.
- Mention the FIFO requirement and contrast with DFS (LIFO) to demonstrate you understand *why* it works, not just how.
- Bring up **multi-source BFS** and **0-1 BFS** as natural extensions — strong signal that you've used the technique beyond textbook problems.

## code.python
```python
from collections import deque
def bfs(graph, src):
    n = len(graph)
    dist = [-1]*n; parent = [-1]*n; dist[src] = 0
    q = deque([src])
    while q:
        u = q.popleft()
        for v in graph[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                parent[v] = u
                q.append(v)
    return dist, parent
```

## code.javascript
```javascript
function bfs(graph, src) {
  const n = graph.length;
  const dist = new Array(n).fill(-1);
  const parent = new Array(n).fill(-1);
  dist[src] = 0;
  const q = [src]; let head = 0;
  while (head < q.length) {
    const u = q[head++];
    for (const v of graph[u]) {
      if (dist[v] === -1) {
        dist[v] = dist[u] + 1;
        parent[v] = u;
        q.push(v);
      }
    }
  }
  return { dist, parent };
}
```

## code.java
```java
public int[] bfs(List<List<Integer>> graph, int src) {
    int n = graph.size();
    int[] dist = new int[n]; Arrays.fill(dist, -1);
    dist[src] = 0;
    Deque<Integer> q = new ArrayDeque<>();
    q.offer(src);
    while (!q.isEmpty()) {
        int u = q.poll();
        for (int v : graph.get(u)) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.offer(v);
            }
        }
    }
    return dist;
}
```

## code.cpp
```cpp
vector<int> bfs(vector<vector<int>>& graph, int src) {
    int n = graph.size();
    vector<int> dist(n, -1);
    dist[src] = 0;
    queue<int> q; q.push(src);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : graph[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return dist;
}
```
