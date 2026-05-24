---
slug: topological-sort-dfs
module: graphs
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
When DFS finishes a vertex v, every descendant of v has already finished. That means every vertex reachable from v has finished before v. If we list vertices in reverse finish order, every vertex appears before everything it can reach — which is exactly the topological-sort property. No back edges exist in a DAG, so this ordering is consistent: the only edges left are tree, forward, and cross edges, all going from later-finishing to earlier-finishing vertices.

## visualization
DAG: 1→2, 1→3, 3→4, 2→4, 4→5. DFS from 1: enter 1, enter 2, enter 4, enter 5, finish 5, finish 4, finish 2, enter 3 (4 already done), finish 3, finish 1. Finish order: 5, 4, 2, 3, 1. Reverse: 1, 3, 2, 4, 5 — every edge points right. Compare with Kahn's BFS, which would also yield something like 1, 2, 3, 4, 5 or 1, 3, 2, 4, 5 depending on tie-breaks. Both are valid topological orders.

## bruteForce
Repeatedly scan for any vertex with in-degree 0, append it to the order, "remove" it (decrement neighbors' in-degrees), and repeat. This is essentially Kahn's algorithm but implemented naively as O(V^2) by re-scanning all in-degrees each round. With a queue it becomes the optimal O(V + E) algorithm — both DFS and Kahn share that bound, so "brute" here means the no-queue rescan version.

## optimal
Mark each vertex as `WHITE` (unvisited), `GRAY` (on current DFS path), or `BLACK` (finished). For each `WHITE` vertex, recurse DFS: turn `GRAY`, visit all out-neighbors. If a neighbor is `GRAY`, the graph has a cycle — no topological order exists. If `BLACK`, skip. After all neighbors processed, turn `BLACK` and push to the order list. Reverse the list at the end. Iterative DFS uses an explicit stack of (vertex, iterator) frames so the post-order push happens on the second pop.

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
