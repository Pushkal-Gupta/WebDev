---
slug: dfs-iterative
module: graphs-traversal
title: Iterative DFS via Explicit Stack
subtitle: Replace recursion with a manually managed stack to avoid stack-overflow on deep or adversarial graphs.
difficulty: Intermediate
position: 19
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Depth First Search — cp-algorithms"
    url: "https://cp-algorithms.com/graph/depth-first-search.html"
    type: blog
  - title: "Algorithms, 4th Edition — Depth First Search"
    url: "https://algs4.cs.princeton.edu/41graph/"
    type: book
  - title: "TheAlgorithms/Python — depth_first_search.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/depth_first_search.py"
    type: repo
status: published
---

## intro
Recursive DFS is short and elegant, but every recursive call consumes a frame on the runtime's call stack. On long path-like graphs (or in environments with low default stack limits, like Python's 1000 frames), the recursion will blow up before the algorithm finishes. The iterative version uses an explicit stack of vertices and produces the same traversal without touching the runtime's call stack.

## whyItMatters
Production graph code almost always uses iterative DFS. Python's default recursion limit is 1000; CPython will raise RecursionError on a 10,000-node linear chain. Java's stack is small by default (~256 KB → roughly 10,000 frames). Server-side workloads with adversarial input (a malformed JSON tree, a cyclic dependency graph submitted by a user) must not crash on deep recursion. Iterative DFS sidesteps the issue entirely.

## intuition
A recursive call equals "push the current state onto a stack, jump to a new frame, return when done." We can perform those three steps explicitly. Start with the source vertex on a stack. Repeatedly pop a vertex, mark it visited if it isn't already, and push all unvisited neighbors. The order in which neighbors are pushed determines the traversal order — pushing them in reverse adjacency order produces the same visit sequence as the recursive version that iterates neighbors left-to-right.

## visualization
Graph: 1 → {2,3}, 2 → {4,5}, 3 → {6}. Recursive DFS from 1 visits [1, 2, 4, 5, 3, 6]. Iterative version: push 1. Pop 1, visit, push 3 then 2 (reverse order). Pop 2, visit, push 5 then 4. Pop 4, visit. Pop 5, visit. Pop 3, visit, push 6. Pop 6, visit. Order: [1, 2, 4, 5, 3, 6] — identical to recursion.

## bruteForce
Recursive DFS itself is the "natural" baseline; the brute-force complaint here is that it crashes on deep inputs. A second naïve attempt is BFS — correct for connectivity but does not preserve the DFS visit order required for things like topological sort or articulation-point detection.

## optimal
Single-stack iteration:
- Push the source vertex.
- While the stack is non-empty: pop vertex v. If already visited, skip. Mark visited. Process v (the "pre-order" hook). Push each unvisited neighbor.
- Reverse the neighbor push order to mimic the natural recursive order.

For post-order DFS (needed by topological sort, Tarjan SCC), use a slightly different pattern: push (v, false) initially; on pop, if the flag is false, push (v, true) and then push (u, false) for each child; if the flag is true, process v as post-order. This emulates the recursive return-on-call-stack semantics.

## complexity
time: O(V + E) — every vertex is pushed and popped at most once; every edge is examined at most twice (once from each endpoint in an undirected graph)
space: O(V) for the visited set plus O(V) for the explicit stack in the worst case (a path graph)
notes: Iterative DFS uses the heap for the stack instead of the runtime call stack. On a 1M-node linear chain, recursive DFS will SIGSEGV in C++ and RecursionError in Python; the iterative version sails through.

## pitfalls
- Marking a vertex visited at push-time instead of pop-time — leads to incorrect cycle detection in directed graphs, where the "on-stack" state must be distinct from "visited."
- Forgetting to skip duplicate pops — a vertex pushed by multiple neighbors will appear multiple times on the stack and must be guarded.
- Pushing neighbors in forward order — gives left-to-right reversal of the expected DFS order; usually harmless but breaks tests that pin the exact visit sequence.
- Confusing pre-order DFS with post-order — topological sort needs post-order, not pre-order.

## interviewTips
- Mention Python's 1000-frame recursion limit as the canonical motivation.
- Be ready to convert between recursive and iterative on the fly — interviewers sometimes ask you to translate live.
- For post-order DFS, sketch the (vertex, processed-flag) pattern explicitly; the simple stack version cannot do post-order alone.
- Tie this back to Tarjan's SCC and articulation-point algorithms, which both require iterative DFS in production.

## code.python
```python
def dfs_iterative(graph, source):
    visited = set()
    order = []
    stack = [source]
    while stack:
        v = stack.pop()
        if v in visited:
            continue
        visited.add(v)
        order.append(v)
        for u in reversed(graph[v]):
            if u not in visited:
                stack.append(u)
    return order
```

## code.javascript
```javascript
function dfsIterative(graph, source) {
  const visited = new Set();
  const order = [];
  const stack = [source];
  while (stack.length) {
    const v = stack.pop();
    if (visited.has(v)) continue;
    visited.add(v);
    order.push(v);
    const neighbors = graph[v];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const u = neighbors[i];
      if (!visited.has(u)) stack.push(u);
    }
  }
  return order;
}
```

## code.java
```java
public List<Integer> dfsIterative(List<List<Integer>> graph, int source) {
    Set<Integer> visited = new HashSet<>();
    List<Integer> order = new ArrayList<>();
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(source);
    while (!stack.isEmpty()) {
        int v = stack.pop();
        if (!visited.add(v)) continue;
        order.add(v);
        List<Integer> neighbors = graph.get(v);
        for (int i = neighbors.size() - 1; i >= 0; i--) {
            int u = neighbors.get(i);
            if (!visited.contains(u)) stack.push(u);
        }
    }
    return order;
}
```

## code.cpp
```cpp
std::vector<int> dfsIterative(const std::vector<std::vector<int>>& graph, int source) {
    std::vector<bool> visited(graph.size(), false);
    std::vector<int> order;
    std::stack<int> stk;
    stk.push(source);
    while (!stk.empty()) {
        int v = stk.top(); stk.pop();
        if (visited[v]) continue;
        visited[v] = true;
        order.push_back(v);
        const auto& neighbors = graph[v];
        for (auto it = neighbors.rbegin(); it != neighbors.rend(); ++it) {
            if (!visited[*it]) stk.push(*it);
        }
    }
    return order;
}
```
