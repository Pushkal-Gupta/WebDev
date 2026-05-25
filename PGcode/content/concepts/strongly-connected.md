---
slug: strongly-connected
module: graphs-advanced
title: Strongly Connected Components
subtitle: Tarjan's single-pass SCC and Kosaraju's two-pass algorithm — both find SCCs in O(V + E).
difficulty: Advanced
position: 2
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "Strongly Connected Components — Kosaraju and Tarjan — cp-algorithms"
    url: "https://cp-algorithms.com/graph/strongly-connected-components.html"
    type: blog
  - title: "Tarjan's Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/tarjan-algorithm-find-strongly-connected-components/"
    type: blog
  - title: "KACTL — SCC.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/graph/SCC.h"
    type: repo
status: published
---

## intro
A strongly connected component (SCC) of a directed graph is a maximal set of vertices in which every vertex can reach every other vertex. Tarjan's algorithm finds all SCCs in one DFS using low-link values; Kosaraju's algorithm uses two DFS passes — one on the graph, one on its transpose — and is often easier to remember. Both run in O(V + E).

## whyItMatters
SCCs are the backbone of directed-graph analysis. Condensing each SCC to a single node yields the condensation DAG, on which you can run topological sort, DP, and reachability queries cheaply. SCCs are the engine inside 2-SAT solvers (Aspvall-Plass-Tarjan 1979), implication-graph analysis, dependency-cycle detection in build systems (Bazel, Buck, Cargo, Maven), module resolvers (npm, Go modules), circuit feedback-set analysis, and the cycle-detection passes inside compilers (LLVM's `SCCIterator`, GCC's loop nesting forest). Postgres's optimizer uses an SCC pass on its expression-equivalence graph to canonicalize predicates. Whenever a problem says "directed graph that may have cycles," the first move is almost always to compute SCCs and recurse on the DAG.

## intuition
Two equivalent algorithms compute SCCs in `O(V + E)`. Kosaraju (1978) is conceptually simpler. Tarjan (1972) is more elegant and runs in one DFS pass.

Kosaraju: do a DFS on the original graph and push each vertex onto a stack as it *finishes*. Now do DFSes on the *transpose* graph (every edge reversed), popping the stack as start vertices and visiting only unvisited nodes. Each DFS tree in the transpose pass is one SCC. The intuition: in the transpose, an SCC is still strongly connected, but the SCCs themselves are organized as a DAG. Finishing-order on the original is reverse-topological on that DAG, so popping the stack gives source-first order, and each DFS in the transpose stays inside one SCC.

Tarjan: do one DFS on the original graph. Maintain a per-vertex `low[v]` value = the smallest discovery time reachable from `v`'s subtree via tree edges going down and back/cross edges *that lead to vertices currently on the DFS stack*. Push every vertex onto an explicit stack on entry. When you finish `v` and `low[v] == tin[v]`, `v` is the root of an SCC; pop the stack down to and including `v`, and emit that group as one component. The `on_stack` predicate is what restricts the `low` updates to back edges within the current SCC, ensuring the equality `low[v] == tin[v]` happens exactly at SCC roots.

## visualization
Edges: 1→2, 2→3, 3→1, 3→4, 4→5, 5→6, 6→4. Tarjan from 1: tin = {1:1, 2:2, 3:3, 4:4, 5:5, 6:6}. From 3, back edge to 1 gives low[3]=1; from 6, back edge to 4 gives low[6]=4. Pop trail: at finish of 6, low[6]=4=tin[6]? No, low[6]=4 and tin[6]=6, low<tin, so 6 is not root. After finishing 5, low[5]=4, not root. Finishing 4, low[4]=4=tin[4], root — pop {6, 5, 4} as one SCC. Finishing 3, low[3]=1, not root. Finishing 2, low[2]=1, not root. Finishing 1, low[1]=1=tin[1], root — pop {3, 2, 1} as the other SCC.

## bruteForce
For each pair (u, v), BFS from u to check reach(u, v), then BFS from v to check reach(v, u); union pairs that satisfy both. O(V * (V + E)) per starting vertex, O(V^2 * (V + E)) overall — fine for V = 100, hopeless for V = 10^5. Even smarter brute approaches (V BFSes from each vertex, intersect with V BFSes from the transpose) still cost O(V * (V + E)).

## optimal
Tarjan in one DFS. Maintain `tin[]`, `low[]`, an explicit stack of vertices currently on the DFS path, and an `on_stack[]` flag. On visiting an edge `(v, w)`: if `w` is unvisited, recurse then `low[v] = min(low[v], low[w])`; else if `on_stack[w]`, `low[v] = min(low[v], tin[w])`. After processing all children of `v`, if `low[v] == tin[v]`, pop the stack down to and including `v` and emit as one SCC.

```python
def tarjan_scc(graph, n):
    tin = [-1] * n
    low = [0] * n
    on_stack = [False] * n
    stack = []
    sccs = []
    timer = [0]
    def dfs(v):
        tin[v] = low[v] = timer[0]; timer[0] += 1
        stack.append(v); on_stack[v] = True
        for w in graph[v]:
            if tin[w] == -1:
                dfs(w)
                low[v] = min(low[v], low[w])
            elif on_stack[w]:
                low[v] = min(low[v], tin[w])
        if low[v] == tin[v]:
            comp = []
            while True:
                u = stack.pop()
                on_stack[u] = False
                comp.append(u)
                if u == v: break
            sccs.append(comp)
    for s in range(n):
        if tin[s] == -1: dfs(s)
    return sccs
```

The critical condition is `elif on_stack[w]: low[v] = min(low[v], tin[w])` — the `on_stack` test restricts back-edge updates to vertices in the *current* SCC stack, which is exactly what makes the SCC root condition `low[v] == tin[v]` hold at the right moment. For very deep graphs convert to iterative DFS with an explicit `(vertex, iterator)` stack to avoid recursion-limit crashes. Kosaraju is a fine alternative if you already have the transpose (`O(V + E)` total, two DFSes). Once you have SCCs, build the condensation DAG by mapping each vertex to its component id and merging parallel edges; the DAG is ready for topological sort, longest-path DP, and reachability via DAG-reachability indexes.

## complexity
time: O(V + E)
space: O(V) for tin/low/stack arrays plus O(V + E) for the graph (Kosaraju also needs the transpose, O(V + E))
notes: Tarjan does one DFS — cache-friendly, slightly faster in practice. Kosaraju does two DFSes plus a transpose build — more memory traffic but simpler to debug. Both are linear. For 2-SAT, the variable x_i is true iff its true-literal SCC has a higher topological order than its false-literal SCC in the condensation.

## pitfalls
- Tarjan: forgetting the on_stack check — without it you treat cross edges like back edges and merge SCCs incorrectly.
- Tarjan: updating low[v] with low[w] instead of tin[w] on the back-edge case — wrong because low[w] may reflect an SCC that has already been popped.
- Kosaraju: forgetting to reverse the order in which you process vertices in pass 2 — order matters, the stack must be drained top-down.
- Both: recursive DFS overflows on chains of 10^5 vertices in Python/JS — convert to iterative or raise the limit.
- Treating an SCC of size 1 with no self-loop as "weakly connected" — it's still an SCC, just trivial.

## interviewTips
- If the problem says "directed cycle" or "mutually reachable," your answer is SCC.
- Name both algorithms but pick Tarjan as your default — one DFS, no transpose, less code.
- Mention the condensation DAG immediately: "Once we have SCCs, contract each into a node; the resulting DAG is the substrate for topo-sort and DP."

## code.python
```python
import sys
sys.setrecursionlimit(1 << 25)

def tarjan_scc(n, adj):
    tin = [-1] * n
    low = [0] * n
    on_stack = [False] * n
    stack = []
    timer = [0]
    sccs = []

    def dfs(v):
        tin[v] = low[v] = timer[0]; timer[0] += 1
        stack.append(v); on_stack[v] = True
        for w in adj[v]:
            if tin[w] == -1:
                dfs(w); low[v] = min(low[v], low[w])
            elif on_stack[w]:
                low[v] = min(low[v], tin[w])
        if low[v] == tin[v]:
            comp = []
            while True:
                w = stack.pop(); on_stack[w] = False
                comp.append(w)
                if w == v: break
            sccs.append(comp)

    for v in range(n):
        if tin[v] == -1: dfs(v)
    return sccs
```

## code.javascript
```javascript
function tarjanScc(n, adj) {
  const tin = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const onStack = new Array(n).fill(false);
  const stack = [];
  let timer = 0;
  const sccs = [];

  function dfs(v) {
    tin[v] = low[v] = timer++;
    stack.push(v); onStack[v] = true;
    for (const w of adj[v]) {
      if (tin[w] === -1) { dfs(w); low[v] = Math.min(low[v], low[w]); }
      else if (onStack[w]) low[v] = Math.min(low[v], tin[w]);
    }
    if (low[v] === tin[v]) {
      const comp = [];
      while (true) {
        const w = stack.pop(); onStack[w] = false;
        comp.push(w);
        if (w === v) break;
      }
      sccs.push(comp);
    }
  }

  for (let v = 0; v < n; v++) if (tin[v] === -1) dfs(v);
  return sccs;
}
```

## code.java
```java
class Tarjan {
    int[] tin, low;
    boolean[] onStack;
    java.util.Deque<Integer> stack = new java.util.ArrayDeque<>();
    int timer = 0;
    java.util.List<java.util.List<Integer>> sccs = new java.util.ArrayList<>();
    java.util.List<java.util.List<Integer>> adj;

    java.util.List<java.util.List<Integer>> run(int n, java.util.List<java.util.List<Integer>> adj) {
        this.adj = adj;
        tin = new int[n]; low = new int[n]; onStack = new boolean[n];
        java.util.Arrays.fill(tin, -1);
        for (int v = 0; v < n; v++) if (tin[v] == -1) dfs(v);
        return sccs;
    }

    void dfs(int v) {
        tin[v] = low[v] = timer++;
        stack.push(v); onStack[v] = true;
        for (int w : adj.get(v)) {
            if (tin[w] == -1) { dfs(w); low[v] = Math.min(low[v], low[w]); }
            else if (onStack[w]) low[v] = Math.min(low[v], tin[w]);
        }
        if (low[v] == tin[v]) {
            java.util.List<Integer> comp = new java.util.ArrayList<>();
            while (true) {
                int w = stack.pop(); onStack[w] = false;
                comp.add(w);
                if (w == v) break;
            }
            sccs.add(comp);
        }
    }
}
```

## code.cpp
```cpp
struct Tarjan {
    vector<int> tin, low;
    vector<bool> onStack;
    vector<int> stk;
    int timer = 0;
    vector<vector<int>> sccs;
    vector<vector<int>>* adj;

    vector<vector<int>> run(int n, vector<vector<int>>& a) {
        adj = &a;
        tin.assign(n, -1); low.assign(n, 0); onStack.assign(n, false);
        for (int v = 0; v < n; v++) if (tin[v] == -1) dfs(v);
        return sccs;
    }

    void dfs(int v) {
        tin[v] = low[v] = timer++;
        stk.push_back(v); onStack[v] = true;
        for (int w : (*adj)[v]) {
            if (tin[w] == -1) { dfs(w); low[v] = min(low[v], low[w]); }
            else if (onStack[w]) low[v] = min(low[v], tin[w]);
        }
        if (low[v] == tin[v]) {
            vector<int> comp;
            while (true) {
                int w = stk.back(); stk.pop_back(); onStack[w] = false;
                comp.push_back(w);
                if (w == v) break;
            }
            sccs.push_back(comp);
        }
    }
};
```
