---
slug: tarjan-scc
module: graphs
title: Tarjan's Strongly Connected Components
subtitle: Find every SCC of a directed graph in a single DFS, O(V + E).
difficulty: Advanced
position: 30
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Tarjan, R. — Depth-First Search and Linear Graph Algorithms (1972)"
    url: ""
status: published
---

## intro
A strongly connected component (SCC) of a directed graph is a maximal set of vertices where every pair is mutually reachable. Tarjan's algorithm computes all SCCs in a single depth-first traversal in O(V + E), using a stack and two timestamps per vertex (`disc` and `low`). It's the algorithm to reach for when you need to condense a directed graph into its DAG of components.

## whyItMatters
SCC condensation unlocks a whole class of problems: 2-SAT solvers, deadlock detection in resource-dependency graphs, web-link analysis, compiler dead-code analysis (mutually recursive functions form an SCC), and "minimum edges to add for the graph to become strongly connected." Once you have SCCs, the condensation is a DAG you can topologically sort and run DP on. Kosaraju's two-pass algorithm is simpler to derive but Tarjan's single-pass version is faster in practice and signals graph fluency in interviews.

## intuition
DFS traversal assigns each vertex a discovery time. A vertex's `low` value is the smallest discovery time reachable from its subtree via tree edges plus at most one back edge or cross edge to a vertex still on the DFS stack. When you finish a vertex u and find `low[u] == disc[u]`, u is the "root" of an SCC — everything pushed onto the stack on or after entering u, and still on the stack now, forms one SCC. Pop until you pop u, and those vertices are the component.

## visualization
```
graph: 1->2, 2->3, 3->1, 3->4, 4->5, 5->6, 6->4

DFS starts at 1.
disc/low:
 1: disc=1 low=1
 2: disc=2 low=2
 3: disc=3 low=3
   back edge 3->1: low[3]=min(3,1)=1
   tree edge 3->4: recurse...
     4: disc=4 low=4
     5: disc=5 low=5
     6: disc=6 low=6
       back edge 6->4: low[6]=min(6,4)=4
     low[5]=4, low[4]=4   -> low[4]==disc[4] -> SCC {4,5,6}
   low[3]=min(low[3], low[4])= 1
 low[2]=1, low[1]=1 -> low[1]==disc[1] -> SCC {1,2,3}
```

## bruteForce
For each vertex v, run a forward DFS to find everything v reaches, then a reverse DFS to find what reaches v; intersect them. Repeat for every vertex, deduplicating. O(V * (V + E)) — quadratic and unworkable for graphs with 10^5 vertices. Even Kosaraju's two-pass is O(V + E) but requires an explicit reverse graph; Tarjan avoids that allocation.

## optimal
Run iterative or recursive DFS. Maintain:
- `disc[v]`: discovery timestamp (0 = unvisited).
- `low[v]`: lowest disc reachable from v's subtree via at most one back/cross edge to a stack-resident vertex.
- An explicit stack of vertices currently in the active DFS path-plus-pending-SCC, and `onStack[v]` flag.

On visiting v: set `disc[v] = low[v] = ++timer`, push v, mark `onStack[v]`. For each edge (v, w):
- If `disc[w] == 0`: recurse; afterwards `low[v] = min(low[v], low[w])`.
- Else if `onStack[w]`: `low[v] = min(low[v], disc[w])`.
- Else: ignore (cross/forward edge to finished SCC).

After processing v, if `low[v] == disc[v]`, pop the stack until you pop v; the popped vertices form one SCC. For deep graphs convert recursion to an explicit-stack iterative DFS to avoid stack overflow.

## complexity
- time: O(V + E) — each vertex and edge is processed a constant number of times.
- space: O(V) for `disc`, `low`, the SCC stack, and (in iterative form) the DFS stack.
- tradeoff vs Kosaraju: Tarjan is one pass and avoids building the transpose; Kosaraju is two passes but conceptually simpler. Both are linear.

## pitfalls
- Using `low[v] = min(low[v], low[w])` when w is on the stack but not a tree edge child — the textbook rule is `min(low[v], disc[w])` for back/cross edges. Using `low[w]` here breaks correctness on certain graphs.
- Forgetting the `onStack` check; cross edges to already-completed SCCs would incorrectly reduce `low[v]`.
- Recursion depth: a graph that is a long chain blows Python's default recursion limit. Either `sys.setrecursionlimit` or convert to iterative.
- Mixing zero-based and one-based vertex labels — use one consistently and initialize arrays to size n+1 if labels start at 1.
- Confusing SCC with biconnected components — those use the same low-link skeleton but a different pop rule (and apply to undirected graphs).

## interviewTips
- Trigger phrases: "find cycles in a directed graph", "group mutually reachable vertices", "2-SAT", "condense a graph to a DAG", "minimum vertices to remove to break all cycles".
- Lead with: "I'll run Tarjan's single-pass SCC in O(V + E). I track discovery and low-link for each vertex; when low equals disc, I pop an SCC off my auxiliary stack."
- Be ready to follow up with the condensation: after SCCs, build the quotient DAG (one node per SCC, edge for each cross-SCC original edge) and run topological DP.
- For very deep graphs mention iterative DFS conversion — interviewers reward you for noting recursion-depth concerns unprompted.

## code.python
```python
import sys
sys.setrecursionlimit(1 << 25)

def tarjan_scc(graph):
    n = len(graph)
    disc = [0] * n
    low = [0] * n
    on_stack = [False] * n
    stack = []
    sccs = []
    timer = [0]

    def dfs(u):
        timer[0] += 1
        disc[u] = low[u] = timer[0]
        stack.append(u)
        on_stack[u] = True
        for v in graph[u]:
            if disc[v] == 0:
                dfs(v)
                low[u] = min(low[u], low[v])
            elif on_stack[v]:
                low[u] = min(low[u], disc[v])
        if low[u] == disc[u]:
            comp = []
            while True:
                w = stack.pop()
                on_stack[w] = False
                comp.append(w)
                if w == u: break
            sccs.append(comp)

    for u in range(n):
        if disc[u] == 0:
            dfs(u)
    return sccs
```

## code.javascript
```javascript
function tarjanSCC(graph) {
  const n = graph.length;
  const disc = new Int32Array(n);
  const low = new Int32Array(n);
  const onStack = new Uint8Array(n);
  const stack = [];
  const sccs = [];
  let timer = 0;

  function dfs(u) {
    disc[u] = low[u] = ++timer;
    stack.push(u);
    onStack[u] = 1;
    for (const v of graph[u]) {
      if (disc[v] === 0) {
        dfs(v);
        if (low[v] < low[u]) low[u] = low[v];
      } else if (onStack[v] && disc[v] < low[u]) {
        low[u] = disc[v];
      }
    }
    if (low[u] === disc[u]) {
      const comp = [];
      let w;
      do {
        w = stack.pop();
        onStack[w] = 0;
        comp.push(w);
      } while (w !== u);
      sccs.push(comp);
    }
  }

  for (let u = 0; u < n; u++) if (disc[u] === 0) dfs(u);
  return sccs;
}
```

## code.java
```java
public List<List<Integer>> tarjanSCC(List<List<Integer>> graph) {
    int n = graph.size();
    int[] disc = new int[n], low = new int[n];
    boolean[] onStack = new boolean[n];
    Deque<Integer> stack = new ArrayDeque<>();
    List<List<Integer>> sccs = new ArrayList<>();
    int[] timer = {0};
    for (int u = 0; u < n; u++) if (disc[u] == 0) dfs(u, graph, disc, low, onStack, stack, sccs, timer);
    return sccs;
}

private void dfs(int u, List<List<Integer>> g, int[] disc, int[] low,
                 boolean[] onStack, Deque<Integer> stack, List<List<Integer>> sccs, int[] timer) {
    disc[u] = low[u] = ++timer[0];
    stack.push(u);
    onStack[u] = true;
    for (int v : g.get(u)) {
        if (disc[v] == 0) {
            dfs(v, g, disc, low, onStack, stack, sccs, timer);
            low[u] = Math.min(low[u], low[v]);
        } else if (onStack[v]) {
            low[u] = Math.min(low[u], disc[v]);
        }
    }
    if (low[u] == disc[u]) {
        List<Integer> comp = new ArrayList<>();
        int w;
        do { w = stack.pop(); onStack[w] = false; comp.add(w); } while (w != u);
        sccs.add(comp);
    }
}
```

## code.cpp
```cpp
class TarjanSCC {
    vector<vector<int>>& g;
    vector<int> disc, low;
    vector<bool> onStack;
    vector<int> stk;
    int timer = 0;
public:
    vector<vector<int>> sccs;
    TarjanSCC(vector<vector<int>>& g) : g(g), disc(g.size(), 0), low(g.size(), 0), onStack(g.size(), false) {}

    void dfs(int u) {
        disc[u] = low[u] = ++timer;
        stk.push_back(u);
        onStack[u] = true;
        for (int v : g[u]) {
            if (disc[v] == 0) {
                dfs(v);
                low[u] = min(low[u], low[v]);
            } else if (onStack[v]) {
                low[u] = min(low[u], disc[v]);
            }
        }
        if (low[u] == disc[u]) {
            vector<int> comp;
            int w;
            do {
                w = stk.back(); stk.pop_back();
                onStack[w] = false;
                comp.push_back(w);
            } while (w != u);
            sccs.push_back(move(comp));
        }
    }

    void run() {
        for (int u = 0; u < (int)g.size(); u++) if (disc[u] == 0) dfs(u);
    }
};
```
