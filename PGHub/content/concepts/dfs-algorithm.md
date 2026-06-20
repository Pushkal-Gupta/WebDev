---
slug: dfs-algorithm
module: graphs-traversal
title: Depth-First Search (DFS)
subtitle: Explore as deep as possible before backtracking — recursive or iterative, O(V + E), the backbone of dozens of graph algorithms.
difficulty: Beginner
position: 4
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Graphs: DFS"
    url: "https://algs4.cs.princeton.edu/41graph/"
    type: book
  - title: "cp-algorithms — Depth-first search"
    url: "https://cp-algorithms.com/graph/depth-first-search.html"
    type: blog
  - title: "TheAlgorithms/Python — dfs.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/depth_first_search.py"
    type: repo
status: published
---

## intro
Depth-first search dives down one path of a graph as far as possible, backtracks when it hits a dead end (a vertex with no unvisited neighbours), and resumes from the nearest unexplored fork. It is the natural traversal pattern for recursion: visit the current vertex, recurse on each unvisited neighbour, return. The iterative form swaps the recursion stack for an explicit LIFO stack. DFS produces a **DFS tree** whose edges classify into tree edges, back edges, forward edges, and cross edges — a classification that underpins cycle detection, topological sorting, bridges, articulation points, and SCCs.

## whyItMatters
- It is the foundation for **topological sort** (post-order on a DAG), **cycle detection** (back edges in directed graphs, any non-tree edge in undirected), **bridges and articulation points** (DFS lowlink), and **strongly connected components** (Tarjan, Kosaraju).
- It is the right traversal for **maze solving**, **backtracking puzzles** (N-Queens, sudoku), and **path enumeration**.
- It uses `O(V)` auxiliary memory in the recursive form — much less than BFS's potentially `O(V)`-wide queue on layered graphs.
- The **DFS tree** captures the structural "skeleton" of the graph, which many advanced algorithms exploit (e.g. Euler tour, biconnected components).
- It's the simplest way to enumerate every reachable vertex in `O(V + E)` when you don't need shortest paths.

## intuition
Imagine walking through a maze with a ball of string. Tie the string at the entrance, walk forward, always preferring an unexplored corridor. When you reach a dead end, follow the string back to the last junction with an untaken corridor and try again. When all corridors at every junction are explored, you've finished. That is DFS: the call stack (or explicit stack) is the string.

Each vertex has three logical states during the traversal: **white** (unvisited), **grey** (visited and on the current DFS path), **black** (fully explored — recursion has returned). In an undirected graph, every non-tree edge encountered during DFS is a **back edge** to a grey ancestor — proof of a cycle. In a directed graph, edges to grey vertices are back edges (cycles), edges to black vertices in the same DFS subtree are forward edges, and edges to black vertices in other subtrees are cross edges.

This three-colour mental model is the cleanest way to extend DFS. Cycle detection in a directed graph is "grey detection"; topological sort is "emit on transition from grey to black, reverse the list at the end"; Tarjan's SCC tracks the lowlink during the grey phase. All of them are decorations on the same DFS skeleton.

The recursive form is natural and short; the iterative form trades elegance for the ability to handle million-deep recursion without blowing the call stack. The iterative version manages an explicit stack of `(vertex, iterator_over_neighbours)` frames, advancing the iterator on each step and pushing a child frame when a new neighbour is found.

## visualization
Graph with adjacency `{0: [1, 2], 1: [3, 4], 2: [4], 3: [], 4: [5], 5: []}`. DFS from vertex 0:

```
stack: [0]   visited: {0}   discover 0
go 0->1
stack: [0,1] visited: {0,1} discover 1
go 1->3
stack: [0,1,3] visited: {0,1,3} discover 3
3 has no neighbours -> finish 3, pop
stack: [0,1] visited: {0,1,3}
1's next neighbour: 4
stack: [0,1,4] visited: {0,1,3,4} discover 4
go 4->5
stack: [0,1,4,5] visited: {0,1,3,4,5} discover 5
finish 5, pop; finish 4, pop; finish 1, pop
stack: [0]
0's next neighbour: 2
stack: [0,2] visited all; 2->4 already visited (cross/forward edge)
finish 2, finish 0
discovery order:   0 1 3 4 5 2
finish order:      3 5 4 1 2 0     (reversed -> 0,2,1,4,5,3 = a topological order)
```

## bruteForce
Without a visited set, DFS revisits the same vertices indefinitely on any graph with cycles — infinite recursion in the directed case, exponential blow-up in the undirected case. The visited check is what makes the traversal `O(V + E)` instead of `O(branching^depth)`.

## optimal
Both forms in 10 lines each.

```python
def dfs_recursive(graph, src, visited=None, order=None):
    if visited is None: visited, order = set(), []
    visited.add(src); order.append(src)
    for v in graph[src]:
        if v not in visited:
            dfs_recursive(graph, v, visited, order)
    return order

def dfs_iterative(graph, src):
    visited = {src}; order = []
    stack = [iter(graph[src])]
    order.append(src)
    path = [src]
    while stack:
        try:
            v = next(stack[-1])
            if v not in visited:
                visited.add(v); order.append(v)
                stack.append(iter(graph[v]))
                path.append(v)
        except StopIteration:
            stack.pop(); path.pop()
    return order
```

For million-node graphs, prefer the iterative form — Python's default recursion limit is 1000 and the JVM/CLR have similar caps. The iterative version using `(vertex, iter)` tuples accurately mirrors what the recursion would do, including correctly tracking the active path for any algorithm that depends on it (lowlink, biconnected components).

## complexity
- **Time**: `O(V + E)` — each vertex is discovered/finished once, each edge inspected once.
- **Space**: `O(V)` — visited set plus stack depth. Worst-case recursion depth is `V` (a long chain), so iterate on huge graphs.
- **Output**: discovery and finish times (timestamps) suffice to derive topological order, SCCs, bridges, articulation points, and many more.

## pitfalls
- **No visited set in cyclic graphs.** Recursion spirals; the algorithm never terminates. Fix: always mark on first visit.
- **Marking visited after the recursive call.** Multiple neighbours then enter recursion before either marks the shared child, exploding work. Fix: mark *before* recursing.
- **Recursing too deep.** Default recursion limits (≈1000 in Python) crash on graphs with long chains. Fix: rewrite iteratively or `sys.setrecursionlimit(...)` for trusted inputs.
- **Confusing edge classification across graph types.** Undirected: any non-tree edge is a back edge. Directed: distinguish back / forward / cross. Fix: use the white/grey/black colouring and inspect the neighbour's colour.

## interviewTips
- Be explicit about the three colours (white/grey/black) when explaining cycle detection or SCCs — it's the cleanest framing interviewers expect.
- For graph-on-grid problems, DFS recursion is concise but the iterative version is mandatory for large boards in JavaScript/Python.
- Mention that post-order DFS on a DAG produces a reverse topological order — that's the one-line definition of "topological sort by DFS".

## code.python
```python
def dfs_iterative(graph, src):
    visited = {src}; order = [src]
    stack = [iter(graph[src])]
    while stack:
        try:
            v = next(stack[-1])
            if v not in visited:
                visited.add(v); order.append(v)
                stack.append(iter(graph[v]))
        except StopIteration:
            stack.pop()
    return order
```

## code.javascript
```javascript
function dfsIterative(graph, src) {
  const visited = new Set([src]);
  const order = [src];
  const stack = [[graph[src], 0]];
  while (stack.length) {
    const top = stack[stack.length - 1];
    const [neigh, idx] = top;
    if (idx >= neigh.length) { stack.pop(); continue; }
    top[1]++;
    const v = neigh[idx];
    if (!visited.has(v)) {
      visited.add(v); order.push(v);
      stack.push([graph[v], 0]);
    }
  }
  return order;
}
```

## code.java
```java
public List<Integer> dfsIterative(List<List<Integer>> graph, int src) {
    Set<Integer> visited = new HashSet<>();
    List<Integer> order = new ArrayList<>();
    Deque<int[]> stack = new ArrayDeque<>();   // [vertex, next-neighbour-index]
    visited.add(src); order.add(src);
    stack.push(new int[]{src, 0});
    while (!stack.isEmpty()) {
        int[] top = stack.peek();
        int u = top[0], idx = top[1];
        List<Integer> nbrs = graph.get(u);
        if (idx >= nbrs.size()) { stack.pop(); continue; }
        top[1]++;
        int v = nbrs.get(idx);
        if (!visited.contains(v)) {
            visited.add(v); order.add(v);
            stack.push(new int[]{v, 0});
        }
    }
    return order;
}
```

## code.cpp
```cpp
vector<int> dfsIterative(vector<vector<int>>& graph, int src) {
    int n = graph.size();
    vector<bool> visited(n, false);
    vector<int> order;
    stack<pair<int,int>> st;       // (vertex, next-neighbour-index)
    visited[src] = true; order.push_back(src);
    st.push({src, 0});
    while (!st.empty()) {
        auto& [u, idx] = st.top();
        if (idx >= (int)graph[u].size()) { st.pop(); continue; }
        int v = graph[u][idx++];
        if (!visited[v]) {
            visited[v] = true; order.push_back(v);
            st.push({v, 0});
        }
    }
    return order;
}
```
