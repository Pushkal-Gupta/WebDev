---
slug: topological-sort-dfs
module: graphs-traversal
title: Topological Sort via DFS
subtitle: Post-order DFS finish times, reversed, give a valid topological ordering of any DAG.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Topological Sorting — cp-algorithms"
    url: "https://cp-algorithms.com/graph/topological-sort.html"
    type: blog
  - title: "Topological Sort using DFS — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/topological-sorting/"
    type: blog
  - title: "TheAlgorithms/Python — topological_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/dijkstra_algorithm.py"
    type: repo
status: published
---

## intro
A topological sort of a directed acyclic graph (DAG) is a linear ordering of its vertices such that every edge u → v appears with u before v. DFS gives a clean derivation: run DFS, push each vertex onto a stack when it finishes (post-order), then pop. The popped order is a valid topological sort.

## whyItMatters
Topological order is the substrate for any DP, scheduling, or evaluation on a DAG: build systems decide compile order, package managers resolve install order, course catalogs enforce prerequisites, dataflow graphs run nodes when inputs are ready. Once you have the order, every "process in dependency order" problem reduces to a single forward sweep — the algorithmic equivalent of free real estate.

## intuition
The algorithm exists because dependency-ordered processing is the substrate of any DAG computation: spreadsheets evaluate formulas in topological order of cell references; build systems (Make, Bazel, Buck) compile targets after their dependencies; package managers (apt, npm, cargo) install in dependency order; dataflow engines (TensorFlow, PyTorch eager-to-graph compilation) execute operations only when inputs are ready. Computing such an order naively (repeatedly scan for an in-degree-zero vertex) is O(V²); DFS gives a single-pass O(V + E) algorithm with cycle detection thrown in for free.

The decisive observation: when DFS finishes a vertex v (returns from the recursive call after visiting all descendants), every vertex reachable from v has already finished. That means in reverse finish order, every vertex appears before everything it can reach — which is exactly the topological-sort property. The proof uses the classification of DFS edges (Tarjan 1972): in a DAG, the only edges are tree, forward, and cross edges (no back edges exist by acyclicity), and all three types go from a *later*-finishing vertex to an *earlier*-finishing vertex. So reversing the finish order produces an ordering where every edge goes from earlier to later — a valid topological sort.

The three-color marking (WHITE = unvisited, GRAY = currently on DFS stack, BLACK = finished) doubles the algorithm as a cycle detector. A GRAY-to-GRAY edge is a back edge and proves a cycle exists — exactly the case where topological sort is undefined. WHITE-to-WHITE recurses; WHITE-to-BLACK and WHITE-to-GRAY visits are handled by the colour checks. This combined sort-plus-cycle-detection is what makes DFS-based topological sort preferred over Kahn's algorithm when the input is not guaranteed acyclic.

Multiple components require an outer loop: start a fresh DFS from each unvisited vertex so every component contributes to the order. The relative order between components is arbitrary — they have no edges between them, so any interleaving is valid. The algorithm naturally handles disconnected DAGs without special-casing.

The deeper principle is that DFS preorder records "arrival times" and postorder records "completion times", and many tree/graph problems are essentially about exploiting one or both of these orderings. Reverse postorder = topological sort; preorder = pre-traversal evaluation; in-order (binary trees) = sorted enumeration; postorder = bottom-up aggregation.

## visualization
DAG: 1→2, 1→3, 3→4, 2→4, 4→5. DFS from 1: enter 1, enter 2, enter 4, enter 5, finish 5, finish 4, finish 2, enter 3 (4 already done), finish 3, finish 1. Finish order: 5, 4, 2, 3, 1. Reverse: 1, 3, 2, 4, 5 — every edge points right. Compare with Kahn's BFS, which would also yield something like 1, 2, 3, 4, 5 or 1, 3, 2, 4, 5 depending on tie-breaks. Both are valid topological orders.

## bruteForce
Repeatedly scan for any vertex with in-degree 0, append it to the order, "remove" it (decrement neighbors' in-degrees), and repeat. This is essentially Kahn's algorithm but implemented naively as O(V^2) by re-scanning all in-degrees each round. With a queue it becomes the optimal O(V + E) algorithm — both DFS and Kahn share that bound, so "brute" here means the no-queue rescan version.

## optimal
**Technique: post-order DFS with three-colour marking + reverse for topological order, GRAY-edge check for cycle detection.** O(V + E) — optimal because any algorithm must read every edge at least once. Kahn's BFS (in-degree-zero queue) has the same asymptotic; pick by side-information needed.

```python
WHITE, GRAY, BLACK = 0, 1, 2

def topo_sort_dfs(n, adj):
    color = [WHITE] * n
    order = []
    has_cycle = [False]

    def dfs(v):
        color[v] = GRAY
        for nb in adj[v]:
            if color[nb] == GRAY:                # back edge → cycle
                has_cycle[0] = True
            elif color[nb] == WHITE:
                dfs(nb)
        color[v] = BLACK
        order.append(v)                          # post-order push

    for v in range(n):                           # iterate all components
        if color[v] == WHITE:
            dfs(v)
    if has_cycle[0]:
        return None                              # no topological order on cyclic input
    order.reverse()                              # reverse post-order = topological order
    return order
```

Key lines: `color[v] = GRAY` marks v as "currently on the DFS path"; reaching another GRAY vertex means we found a back edge and the graph has a cycle. `order.append(v)` happens *after* all descendants have finished — this is the post-order push that gives us the reverse-finish order. `order.reverse()` flips post-order into topological order. The outer loop `for v in range(n)` handles disconnected components by starting fresh DFS calls from each unvisited vertex.

For graphs with > 10⁴ vertices in Python (or any language with limited stack depth), recursion overflows; use iterative DFS with an explicit stack of `(vertex, iter(adj[vertex]))` frames so the post-order push fires when the iterator is exhausted:

```python
def topo_sort_iter(n, adj):
    color = [WHITE] * n
    order = []
    for start in range(n):
        if color[start] != WHITE: continue
        stack = [(start, iter(adj[start]))]
        color[start] = GRAY
        while stack:
            v, it = stack[-1]
            nxt = next(it, None)
            if nxt is None:
                color[v] = BLACK; order.append(v); stack.pop()
            elif color[nxt] == GRAY:
                return None                      # cycle
            elif color[nxt] == WHITE:
                color[nxt] = GRAY
                stack.append((nxt, iter(adj[nxt])))
    return list(reversed(order))
```

**Why not Kahn's algorithm?** Kahn's BFS maintains a queue of in-degree-zero vertices and emits them in dequeue order. Same O(V + E), but exposes cycles by leaving vertices unprocessed at the end (count emissions vs n). Use Kahn when you need the lexicographically smallest order (use a min-heap instead of FIFO) or when you want streaming output as vertices become ready. Use DFS when you need cycle detection in one pass (the GRAY check) or when you have to process recursive dependency analysis (e.g., LLVM whole-module analysis where post-order matters for dataflow). **Common bugs**: forgetting to reverse the order (returns reverse-topological); using a single boolean `visited` instead of three colours (cannot distinguish on-path from finished, so cycle detection fails); recursive DFS overflowing stack on long chains; forgetting the outer loop for multiple components.

## complexity
time: O(V + E)
space: O(V) for the color array and the order list, plus the DFS stack
notes: Kahn's algorithm has the same complexity but yields the lexicographically smallest order if you use a min-heap instead of a queue — DFS doesn't. Pick DFS when you also need cycle detection in one pass (the `GRAY` check). Pick Kahn when you need detection of unprocessable vertices (any vertex remaining with in-degree > 0 after the queue drains is on a cycle).

## pitfalls
- Forgetting to detect cycles — if the input is not guaranteed acyclic, returning whatever DFS produces is wrong. Use the three-color trick or count BLACK vertices and compare to n.
- Returning the order without reversing — finish order is the *reverse* topological order, not the topological order itself.
- Recursive DFS in Python on chains of 10^5 vertices — convert to iterative with an explicit stack and `(vertex, iter_index)` frames.
- Using a `visited` boolean instead of three colors — you cannot detect back edges from "currently on path" because both look identical.
- Multiple components: a single DFS from vertex 0 only covers one component. Loop over all vertices and start a fresh DFS from each unvisited one.

## interviewTips
- Open with: "I'll run DFS and emit vertices in reverse finish order; the GRAY-back-edge check doubles as cycle detection."
- Have Kahn's ready as a follow-up — interviewers often ask for both and compare trade-offs. Kahn's exposes cycles by leaving vertices unprocessed; DFS catches them via the GRAY check.
- Mention real applications: course-schedule problem, build-system DAG, evaluating a spreadsheet formula graph.

## code.python
```python
import sys
sys.setrecursionlimit(1 << 25)

WHITE, GRAY, BLACK = 0, 1, 2

def topo_sort_dfs(n, adj):
    color = [WHITE] * n
    order = []
    has_cycle = [False]

    def dfs(v):
        color[v] = GRAY
        for nb in adj[v]:
            if color[nb] == GRAY: has_cycle[0] = True
            elif color[nb] == WHITE: dfs(nb)
        color[v] = BLACK
        order.append(v)

    for v in range(n):
        if color[v] == WHITE: dfs(v)
    if has_cycle[0]: return None
    order.reverse()
    return order
```

## code.javascript
```javascript
function topoSortDfs(n, adj) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Array(n).fill(WHITE);
  const order = [];
  let cycle = false;

  function dfs(v) {
    color[v] = GRAY;
    for (const nb of adj[v]) {
      if (color[nb] === GRAY) cycle = true;
      else if (color[nb] === WHITE) dfs(nb);
    }
    color[v] = BLACK;
    order.push(v);
  }

  for (let v = 0; v < n; v++) if (color[v] === WHITE) dfs(v);
  if (cycle) return null;
  return order.reverse();
}
```

## code.java
```java
class TopoDfs {
    static final int WHITE = 0, GRAY = 1, BLACK = 2;
    int[] color;
    java.util.List<Integer> order = new java.util.ArrayList<>();
    boolean cycle = false;
    java.util.List<java.util.List<Integer>> adj;

    java.util.List<Integer> run(int n, java.util.List<java.util.List<Integer>> adj) {
        this.adj = adj;
        color = new int[n];
        for (int v = 0; v < n; v++) if (color[v] == WHITE) dfs(v);
        if (cycle) return null;
        java.util.Collections.reverse(order);
        return order;
    }

    void dfs(int v) {
        color[v] = GRAY;
        for (int nb : adj.get(v)) {
            if (color[nb] == GRAY) cycle = true;
            else if (color[nb] == WHITE) dfs(nb);
        }
        color[v] = BLACK;
        order.add(v);
    }
}
```

## code.cpp
```cpp
enum { WHITE, GRAY, BLACK };

struct TopoDfs {
    vector<int> color, order;
    bool cycle = false;
    vector<vector<int>>* adj;

    vector<int> run(int n, vector<vector<int>>& a) {
        adj = &a;
        color.assign(n, WHITE);
        for (int v = 0; v < n; v++) if (color[v] == WHITE) dfs(v);
        if (cycle) return {};
        reverse(order.begin(), order.end());
        return order;
    }

    void dfs(int v) {
        color[v] = GRAY;
        for (int nb : (*adj)[v]) {
            if (color[nb] == GRAY) cycle = true;
            else if (color[nb] == WHITE) dfs(nb);
        }
        color[v] = BLACK;
        order.push_back(v);
    }
};
```
