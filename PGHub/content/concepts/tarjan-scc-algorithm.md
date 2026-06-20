---
slug: tarjan-scc-algorithm
module: graphs-advanced
title: Tarjan's Strongly Connected Components
subtitle: Find all SCCs in a directed graph in a single DFS pass using discovery times and a lowlink stack — O(V + E).
difficulty: Advanced
position: 31
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Directed Graphs"
    url: "https://algs4.cs.princeton.edu/42digraph/"
    type: book
  - title: "cp-algorithms — Tarjan's algorithm"
    url: "https://cp-algorithms.com/graph/strongly-connected-components.html"
    type: blog
  - title: "TheAlgorithms/Python — tarjans_strongly_connected.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/tarjans_strongly_connected.py"
    type: repo
status: published
---

## intro
Tarjan's algorithm partitions the vertices of a directed graph into **strongly connected components** (SCCs) — maximal subgraphs in which every vertex can reach every other. It does so in a single depth-first traversal by tracking, for each vertex, its **discovery index** (when DFS first reached it) and its **lowlink** (the smallest discovery index reachable through tree edges plus at most one back edge). Vertices currently sitting on a stack participate in the lowlink computation; whenever a vertex's lowlink equals its own discovery index, the top of the stack down to that vertex forms one complete SCC.

## whyItMatters
- SCCs are the **condensation** of a directed graph: contract each SCC into a single node and you get a DAG, on which DP, topological sort, and reachability are easy.
- It is the standard pre-processing step for 2-SAT solvers: build the implication graph, find SCCs, infer assignment.
- Compiler optimisers use SCCs to identify mutually recursive function groups for SCC-bound inlining and inter-procedural analysis.
- Dependency analysis in build systems (cycles among packages) reports each cycle as one SCC.
- It runs in a single DFS pass — half the work of Kosaraju's two-pass alternative.

## intuition
DFS naturally produces a **tree** of edges plus three other edge classes: back edges, forward edges, and cross edges. A vertex `v` belongs to the same SCC as its ancestor `u` exactly when there is a path from `v` back to `u` using only edges within the explored subtree — that means a back edge or a cross edge that lands on a vertex still on the DFS stack.

The **lowlink** captures "the smallest discovery index reachable from `v` using one such retreat". For each tree edge `v -> w`, set `low[v] = min(low[v], low[w])` after `w`'s DFS finishes. For each back/cross edge `v -> w` where `w` is currently on the stack, set `low[v] = min(low[v], disc[w])`. If after exploring all of `v`'s neighbours `low[v] == disc[v]`, then `v` is the root of an SCC — no neighbour escaped above `v` in the DFS tree, so the subtree of stack-resident descendants from `v` downward is exactly the SCC. Pop the stack down to and including `v` to emit the component.

The stack is the key invariant. It holds every vertex whose SCC has not yet been closed. A vertex remains on the stack until its SCC is identified; only then is it removed. This makes the "is `w` on the stack?" test a constant-time membership check (a boolean per vertex), keeping the algorithm linear.

## visualization
Graph `1 -> 2, 2 -> 3, 3 -> 1, 3 -> 4, 4 -> 5, 5 -> 4`. Two SCCs expected: `{1, 2, 3}` and `{4, 5}`.

```
DFS starts at 1:                        disc/low table   on-stack
  visit 1: disc=0 low=0                 1:(0,0)          [1]
  visit 2: disc=1 low=1                 2:(1,1)          [1,2]
  visit 3: disc=2 low=2                 3:(2,2)          [1,2,3]
    edge 3->1 (on stack)  low[3]=min(2,0)=0
  visit 4: disc=3 low=3                 4:(3,3)          [1,2,3,4]
  visit 5: disc=4 low=4                 5:(4,4)          [1,2,3,4,5]
    edge 5->4 (on stack)  low[5]=min(4,3)=3
  back from 5 to 4: low[4]=min(3,3)=3
  4 closes SCC: low[4]==disc[4]=3       pop until 4      SCC = {5, 4}
  back from 4 to 3: (4 no longer on stack, ignore)
  3 closes? low[3]=0 != disc[3]=2       no
  back from 3 to 2: low[2]=min(1,0)=0
  back from 2 to 1: low[1]=min(0,0)=0
  1 closes SCC: low[1]==disc[1]=0       pop until 1      SCC = {3, 2, 1}
```

## bruteForce
Run DFS from every vertex, recording reachable sets, then pair every two vertices and check mutual reachability. That's `O(V (V + E))` for reachability times `O(V^2)` for pairing — totally impractical for non-trivial graphs.

## optimal
Single DFS with three arrays: `disc`, `low`, `on_stack`, plus a vertex stack.

```python
def tarjan_scc(graph):
    n = len(graph)
    disc = [-1] * n
    low = [0] * n
    on_stack = [False] * n
    stack = []
    sccs = []
    timer = [0]

    def dfs(u):
        disc[u] = low[u] = timer[0]; timer[0] += 1
        stack.append(u); on_stack[u] = True
        for v in graph[u]:
            if disc[v] == -1:
                dfs(v)
                low[u] = min(low[u], low[v])
            elif on_stack[v]:
                low[u] = min(low[u], disc[v])
        if low[u] == disc[u]:
            comp = []
            while True:
                w = stack.pop(); on_stack[w] = False
                comp.append(w)
                if w == u: break
            sccs.append(comp)

    for u in range(n):
        if disc[u] == -1: dfs(u)
    return sccs
```

For large graphs the recursion limit bites; use an **iterative** version with an explicit stack of `(vertex, iterator_over_neighbours)` frames. That swap is the only thing that distinguishes a 1000-line graph from a 1 000 000-line one.

## complexity
- **Time**: `O(V + E)` — each vertex pushed/popped once, each edge inspected once.
- **Space**: `O(V)` — three arrays plus the DFS stack.
- **Output**: a partition of vertices into SCCs, naturally in **reverse topological order** of the condensation DAG — useful for downstream DP.

## pitfalls
- **Using `disc[v]` instead of `low[v]` when updating from a tree edge.** That breaks the recursion — descendants stop influencing the ancestor's lowlink correctly. Fix: tree edge updates use `low[v]`; back/cross edge updates use `disc[v]`.
- **Forgetting the `on_stack` check on back/cross edges.** A cross edge to a vertex in a *finished* SCC must not lower the current lowlink. Fix: only update from `v` when `on_stack[v]` is true.
- **Recursion overflow on dense graphs.** Default Python recursion is 1000, far less than typical graph sizes. Fix: `sys.setrecursionlimit(...)` or rewrite iteratively.
- **Confusing Tarjan SCC with Tarjan articulation/bridges.** Different algorithms, similar names. Fix: SCC works on directed graphs; bridges/articulation work on undirected.

## interviewTips
- Lead with the lowlink definition — "smallest discovery index reachable through tree edges plus one back/cross edge to an on-stack vertex".
- Mention that the SCCs are emitted in reverse topological order of the condensation, which lets you run DAG DP on top for free.
- Contrast with **Kosaraju's** two-pass algorithm: Tarjan does it in one DFS but requires the on-stack bookkeeping; Kosaraju is conceptually simpler but does twice the I/O on the edge list.

## code.python
```python
def tarjan_scc(graph):
    n = len(graph)
    disc = [-1]*n; low = [0]*n; on = [False]*n
    stack = []; sccs = []; t = [0]
    def dfs(u):
        disc[u] = low[u] = t[0]; t[0] += 1
        stack.append(u); on[u] = True
        for v in graph[u]:
            if disc[v] == -1:
                dfs(v); low[u] = min(low[u], low[v])
            elif on[v]:
                low[u] = min(low[u], disc[v])
        if low[u] == disc[u]:
            comp = []
            while True:
                w = stack.pop(); on[w] = False; comp.append(w)
                if w == u: break
            sccs.append(comp)
    for u in range(n):
        if disc[u] == -1: dfs(u)
    return sccs
```

## code.javascript
```javascript
function tarjanSCC(graph) {
  const n = graph.length;
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0);
  const onStack = new Array(n).fill(false);
  const stack = []; const sccs = []; let t = 0;
  const dfs = (u) => {
    disc[u] = low[u] = t++;
    stack.push(u); onStack[u] = true;
    for (const v of graph[u]) {
      if (disc[v] === -1) { dfs(v); low[u] = Math.min(low[u], low[v]); }
      else if (onStack[v]) low[u] = Math.min(low[u], disc[v]);
    }
    if (low[u] === disc[u]) {
      const comp = [];
      while (true) {
        const w = stack.pop(); onStack[w] = false; comp.push(w);
        if (w === u) break;
      }
      sccs.push(comp);
    }
  };
  for (let u = 0; u < n; u++) if (disc[u] === -1) dfs(u);
  return sccs;
}
```

## code.java
```java
class TarjanSCC {
    int n, t = 0;
    int[] disc, low; boolean[] onStack;
    Deque<Integer> stack = new ArrayDeque<>();
    List<List<Integer>> sccs = new ArrayList<>();
    List<List<Integer>> graph;
    void dfs(int u) {
        disc[u] = low[u] = t++;
        stack.push(u); onStack[u] = true;
        for (int v : graph.get(u)) {
            if (disc[v] == -1) { dfs(v); low[u] = Math.min(low[u], low[v]); }
            else if (onStack[v]) low[u] = Math.min(low[u], disc[v]);
        }
        if (low[u] == disc[u]) {
            List<Integer> comp = new ArrayList<>();
            while (true) {
                int w = stack.pop(); onStack[w] = false; comp.add(w);
                if (w == u) break;
            }
            sccs.add(comp);
        }
    }
    List<List<Integer>> run(List<List<Integer>> g) {
        graph = g; n = g.size();
        disc = new int[n]; low = new int[n]; onStack = new boolean[n];
        Arrays.fill(disc, -1);
        for (int u = 0; u < n; u++) if (disc[u] == -1) dfs(u);
        return sccs;
    }
}
```

## code.cpp
```cpp
struct TarjanSCC {
    int n, t = 0;
    vector<vector<int>> g;
    vector<int> disc, low;
    vector<bool> onStack;
    stack<int> st;
    vector<vector<int>> sccs;
    void dfs(int u) {
        disc[u] = low[u] = t++;
        st.push(u); onStack[u] = true;
        for (int v : g[u]) {
            if (disc[v] == -1) { dfs(v); low[u] = min(low[u], low[v]); }
            else if (onStack[v]) low[u] = min(low[u], disc[v]);
        }
        if (low[u] == disc[u]) {
            vector<int> comp;
            while (true) {
                int w = st.top(); st.pop(); onStack[w] = false; comp.push_back(w);
                if (w == u) break;
            }
            sccs.push_back(comp);
        }
    }
    vector<vector<int>> run(vector<vector<int>>& graph) {
        g = graph; n = g.size();
        disc.assign(n, -1); low.assign(n, 0); onStack.assign(n, false);
        for (int u = 0; u < n; u++) if (disc[u] == -1) dfs(u);
        return sccs;
    }
};
```
