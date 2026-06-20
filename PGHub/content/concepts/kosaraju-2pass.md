---
slug: kosaraju-2pass
module: graphs-advanced
title: Kosaraju's Two-Pass SCC
subtitle: Two DFS passes — one on the graph, one on its transpose — to find strongly connected components.
difficulty: Advanced
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Kosaraju-Sharir"
    url: "https://algs4.cs.princeton.edu/42digraph/"
    type: book
  - title: "Strongly Connected Components — cp-algorithms"
    url: "https://cp-algorithms.com/graph/strongly-connected-components.html"
    type: blog
  - title: "TheAlgorithms/Python — kosaraju.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/strongly_connected_components.py"
    type: repo
status: published
---

## intro
A strongly connected component (SCC) of a directed graph is a maximal set of vertices such that every vertex is reachable from every other. Kosaraju's algorithm finds all SCCs in linear time using two depth-first searches — one on the original graph and one on its transpose. It is simpler to remember and explain than Tarjan's algorithm, and only marginally slower in practice.

## whyItMatters
- **2-SAT solving**: Aspvall-Plass-Tarjan 1979 reduces 2-SAT to SCC computation on an implication graph; tools like MiniSat, CryptoMiniSat, and Z3 use the same reduction for the 2-CNF fragment.
- **Compiler call-graph analysis**: LLVM, GCC, and the Go compiler cluster mutually recursive functions into SCCs to schedule whole-function optimisations (inlining heuristics, register-allocation grouping).
- **Web crawling and PageRank** initialisation use SCC condensation to identify "spider traps" — sink SCCs that absorb random-walk probability.
- **Static analysis tools** (Pylint, dependency-cycle detectors in Bazel/Buck) flag cycles in module imports; the SCC condensation tells you which modules must be refactored together.
- **Social-network community detection** uses SCCs as a baseline before more sophisticated metrics (modularity, Louvain) take over.
- The two-pass Kosaraju-Sharir version is the version interviewers expect when they ask "find the SCCs" because it is easier to derive on a whiteboard than Tarjan's single-pass low-link algorithm.

## intuition
The algorithm exists because identifying SCCs naively — running BFS/DFS from every vertex to find mutual reachability — costs Θ(V·(V+E)), which is quadratic on sparse graphs. Kosaraju (and equivalently Sharir 1981) brings it down to linear by exploiting a deep structural property: the *condensation DAG* of any directed graph (collapse each SCC to one super-node) is acyclic, and the finish-time ordering of a DFS on the original graph reveals a topological order on this DAG.

The decisive observation is in two parts. First, in a DFS on the original graph, the vertex with the maximum finish time belongs to a *source* SCC of the condensation (an SCC with no incoming edges from other SCCs) — proof: a DFS started inside or outside a sink SCC cannot escape it once entered, so the last vertex to finish must be in a component that the DFS reached last in the condensation's topological order, which is a source. Second, in the *transpose* graph (every edge reversed), sources become sinks and vice versa. So running DFS on the transpose starting from the max-finish-time vertex of the original explores exactly one source SCC and cannot escape it.

This lets us peel off SCCs one at a time. Pass 1 runs DFS on the original graph and pushes each vertex onto a stack when its DFS call finishes — the stack now holds vertices in reverse-finish-time order. Pass 2 reverses every edge to form the transpose, then pops vertices off the stack; each unvisited popped vertex starts a fresh DFS in the transpose that exactly enumerates one SCC, because edges leaving that SCC in the transpose go to already-discovered SCCs (which were popped earlier as their roots have larger finish times). The condensation's topological order falls out of the algorithm as the order of SCC discovery. Total work: two DFS passes plus one edge-flip — O(V + E).

## visualization
Pass 1: DFS the original graph, push each vertex onto a stack when it finishes. Pass 2: reverse every edge to form the transpose. Pop vertices from the stack; for each unvisited vertex, DFS in the transpose — the tree it discovers is one SCC. Repeat until the stack is empty. The order of popped roots is exactly the topological order of the condensation DAG.

## bruteForce
For every pair (u, v) check reachability via two BFS/DFS runs. O(V * (V + E)) total — quadratic in V even on sparse graphs, and unable to enumerate SCCs without extra union-find bookkeeping. Useless beyond a few hundred vertices.

## optimal
**Technique: Kosaraju-Sharir two-pass DFS using finish-time stack and graph transposition.** Optimal at O(V + E) — any SCC algorithm must inspect every edge at least once, since an unread edge could merge two components and change every SCC assignment. Tarjan 1972 hits the same bound in a single pass with low-link values; Kosaraju trades one extra pass for cleaner derivation under interview pressure.

```python
def kosaraju(n, adj):
    visited = [False] * n
    order = []

    def dfs(start):                         # iterative DFS, pushes onto `order` at finish
        stack = [(start, iter(adj[start]))]
        visited[start] = True
        while stack:
            node, it = stack[-1]
            nxt = next(it, None)
            if nxt is None:
                order.append(node)          # finish time = position in `order`
                stack.pop()
            elif not visited[nxt]:
                visited[nxt] = True
                stack.append((nxt, iter(adj[nxt])))

    for i in range(n):                      # pass 1: original graph
        if not visited[i]: dfs(i)

    transpose = [[] for _ in range(n)]      # pass 2 prep: reverse every edge
    for u in range(n):
        for v in adj[u]: transpose[v].append(u)

    sccs = []
    visited = [False] * n
    while order:
        u = order.pop()                     # pop in reverse-finish-time order
        if visited[u]: continue
        comp, stk = [], [u]
        visited[u] = True
        while stk:
            x = stk.pop(); comp.append(x)
            for y in transpose[x]:
                if not visited[y]: visited[y] = True; stk.append(y)
        sccs.append(comp)
    return sccs
```

Key lines: `order.append(node)` runs at the moment DFS finishes processing a node — this is the finish-time push that produces the reverse-topological order on the condensation DAG. `transpose[v].append(u)` flips every edge so that source SCCs in the original become sink SCCs in the transpose. The inner `while stk` in the second pass is a contained DFS — it cannot escape its SCC because the only edges leaving in the transpose go to SCCs already discovered (which means their vertices are already visited).

The iterative DFS (using an explicit stack of `(node, iter(adj[node]))`) is essential for Python and Java because graphs with 10⁵+ vertices easily overflow recursive call stacks. **Why not Tarjan?** Tarjan's algorithm achieves the same bound in one pass using low-link values, and is preferred in production libraries (NetworkX `strongly_connected_components` ships both). Kosaraju is preferred in interviews because the correctness argument (max-finish-time vertex is in a source SCC) is easier to explain than Tarjan's stack-based low-link bookkeeping. **Why not Gabow?** Gabow 2000 uses two stacks but is rarely seen outside competitive programming. The SCC discovery order from Kosaraju's second pass is exactly the condensation's topological order — a useful side effect for 2-SAT solution extraction.

## complexity
time: O(V + E) for both passes plus transposition.
space: O(V + E) for the transpose graph, O(V) for the finish-time stack.
notes: Tarjan's algorithm achieves the same bound in a single pass but is harder to explain under interview pressure. Kosaraju trades clarity for one extra graph traversal.

## pitfalls
- Forgetting to actually transpose the graph between passes — running DFS twice on the same graph gives nonsense.
- Using a recursive DFS on graphs with > 10^5 vertices and hitting the stack overflow — switch to an iterative stack-based DFS.
- Reusing the same visited array across passes — must reset between pass 1 and pass 2.
- Reading the finish-order stack in the wrong direction — vertices must come out in *reverse* finish-time order.

## interviewTips
- Open with the high-level structure: "Two DFS passes — first to order vertices by finish time, second on the transposed graph in that order."
- Be ready to compare with Tarjan: "Tarjan is one pass with low-link values; Kosaraju is two passes but cleaner to derive."
- Mention 2-SAT as a follow-up application — knowing it tells the interviewer you understand SCC's place in the broader algorithmic landscape.

## code.python
```python
def kosaraju(n, adj):
    visited = [False] * n
    order = []
    def dfs(u):
        stack = [(u, iter(adj[u]))]
        visited[u] = True
        while stack:
            node, it = stack[-1]
            nxt = next(it, None)
            if nxt is None:
                order.append(node); stack.pop()
            elif not visited[nxt]:
                visited[nxt] = True
                stack.append((nxt, iter(adj[nxt])))
    for i in range(n):
        if not visited[i]: dfs(i)
    transpose = [[] for _ in range(n)]
    for u in range(n):
        for v in adj[u]: transpose[v].append(u)
    sccs = []
    visited = [False] * n
    while order:
        u = order.pop()
        if visited[u]: continue
        comp, stk = [], [u]
        visited[u] = True
        while stk:
            x = stk.pop(); comp.append(x)
            for y in transpose[x]:
                if not visited[y]: visited[y] = True; stk.append(y)
        sccs.append(comp)
    return sccs
```

## code.javascript
```javascript
function kosaraju(n, adj) {
  const visited = new Array(n).fill(false);
  const order = [];
  function dfs(start) {
    const stack = [[start, 0]];
    visited[start] = true;
    while (stack.length) {
      const top = stack[stack.length - 1];
      const [node, i] = top;
      if (i < adj[node].length) {
        top[1]++;
        const nxt = adj[node][i];
        if (!visited[nxt]) { visited[nxt] = true; stack.push([nxt, 0]); }
      } else { order.push(node); stack.pop(); }
    }
  }
  for (let i = 0; i < n; i++) if (!visited[i]) dfs(i);
  const transpose = Array.from({ length: n }, () => []);
  for (let u = 0; u < n; u++) for (const v of adj[u]) transpose[v].push(u);
  const sccs = [];
  visited.fill(false);
  while (order.length) {
    const u = order.pop();
    if (visited[u]) continue;
    const comp = [], stk = [u];
    visited[u] = true;
    while (stk.length) {
      const x = stk.pop(); comp.push(x);
      for (const y of transpose[x]) if (!visited[y]) { visited[y] = true; stk.push(y); }
    }
    sccs.push(comp);
  }
  return sccs;
}
```

## code.java
```java
import java.util.*;

public List<List<Integer>> kosaraju(int n, List<List<Integer>> adj) {
    boolean[] visited = new boolean[n];
    Deque<Integer> order = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (!visited[i]) dfs1(i, adj, visited, order);
    List<List<Integer>> transpose = new ArrayList<>();
    for (int i = 0; i < n; i++) transpose.add(new ArrayList<>());
    for (int u = 0; u < n; u++) for (int v : adj.get(u)) transpose.get(v).add(u);
    Arrays.fill(visited, false);
    List<List<Integer>> sccs = new ArrayList<>();
    while (!order.isEmpty()) {
        int u = order.pop();
        if (visited[u]) continue;
        List<Integer> comp = new ArrayList<>();
        Deque<Integer> stk = new ArrayDeque<>();
        stk.push(u); visited[u] = true;
        while (!stk.isEmpty()) {
            int x = stk.pop(); comp.add(x);
            for (int y : transpose.get(x)) if (!visited[y]) { visited[y] = true; stk.push(y); }
        }
        sccs.add(comp);
    }
    return sccs;
}
private void dfs1(int u, List<List<Integer>> adj, boolean[] visited, Deque<Integer> order) {
    Deque<int[]> stack = new ArrayDeque<>();
    stack.push(new int[]{u, 0}); visited[u] = true;
    while (!stack.isEmpty()) {
        int[] top = stack.peek();
        if (top[1] < adj.get(top[0]).size()) {
            int nxt = adj.get(top[0]).get(top[1]++);
            if (!visited[nxt]) { visited[nxt] = true; stack.push(new int[]{nxt, 0}); }
        } else { order.push(top[0]); stack.pop(); }
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <stack>
using namespace std;

vector<vector<int>> kosaraju(int n, vector<vector<int>>& adj) {
    vector<bool> visited(n, false);
    vector<int> order;
    for (int s = 0; s < n; s++) {
        if (visited[s]) continue;
        stack<pair<int,int>> stk;
        stk.push({s, 0}); visited[s] = true;
        while (!stk.empty()) {
            auto& [u, i] = stk.top();
            if (i < (int)adj[u].size()) {
                int v = adj[u][i++];
                if (!visited[v]) { visited[v] = true; stk.push({v, 0}); }
            } else { order.push_back(u); stk.pop(); }
        }
    }
    vector<vector<int>> transpose(n);
    for (int u = 0; u < n; u++) for (int v : adj[u]) transpose[v].push_back(u);
    fill(visited.begin(), visited.end(), false);
    vector<vector<int>> sccs;
    for (int i = order.size() - 1; i >= 0; i--) {
        int u = order[i];
        if (visited[u]) continue;
        vector<int> comp; stack<int> s; s.push(u); visited[u] = true;
        while (!s.empty()) {
            int x = s.top(); s.pop(); comp.push_back(x);
            for (int y : transpose[x]) if (!visited[y]) { visited[y] = true; s.push(y); }
        }
        sccs.push_back(comp);
    }
    return sccs;
}
```
