---
slug: graph-tarjan-scc
module: graphs-advanced
title: Tarjan's Strongly Connected Components
subtitle: Single-pass DFS that finds all SCCs of a directed graph in O(V+E) — using low-link numbers + a vertex stack.
difficulty: Advanced
position: 62
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Strongly connected components"
    url: "https://walkccc.me/CLRS/Chap22/"
    type: book
  - title: "cp-algorithms — Strongly connected components"
    url: "https://cp-algorithms.com/graph/strongly-connected-components.html"
    type: blog
  - title: "TheAlgorithms/Python — Tarjan SCC"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/tarjans_scc.py"
    type: repo
status: published
---

## intro
A **strongly connected component (SCC)** of a directed graph is a maximal set of vertices where every vertex can reach every other vertex via directed edges. **Tarjan's algorithm** finds all SCCs in a single DFS pass at O(V+E). Two key tricks: **discovery time** (`disc[v]`) and **low-link** (`low[v] = min disc reachable from v's subtree`).

Slightly more elegant than Kosaraju's two-pass approach; the classic interview answer.

## whyItMatters
- **Compiler optimization**: function-call graphs — SCCs are mutually recursive cycles.
- **Static analysis**: data-flow graphs.
- **Web crawling / link graphs**: page authority within SCCs.
- **Dependency cycles**: dependency graphs of packages, microservices.
- **2-SAT**: solved by SCC on the implication graph.

Every directed-graph problem with "cycles" or "reachability classes" reduces to SCCs.

## intuition
Think of the DFS as pouring water down a tree of streets, numbering each vertex the moment you first step on it — that number is `disc[v]`. As you explore, you keep asking one question at every vertex: "from here, following one back-edge, what is the earliest-numbered street I can escape back up to?" That escape number is `low[v]`. A vertex that cannot escape any higher than its own number is trapped at the top of its cycle — it is the entry point, the **root** of a strongly connected component. Everything visited after it and still waiting on the stack fell into the same trap and forms one SCC. What's actually happening is that `disc` freezes the tree structure while `low` propagates cycle-reachability upward, and the equality `low[v] == disc[v]` is the exact signal that no descendant found a way around `v`.

Run DFS, assigning each vertex a discovery time `disc[v]`. Maintain `low[v]` = the smallest `disc` reachable from v's DFS subtree (via tree edges + at most one back-edge). Push each visited vertex onto a stack.

When we finish processing v and find `low[v] == disc[v]`, v is the **root** of an SCC. Pop the stack down to v — those popped vertices are one SCC.

The "low-link" captures: can we reach back to an ancestor? If yes → we're in a cycle (same SCC). If no → v is the SCC root.

Trace a concrete triangle `1 → 2 → 3 → 1`. Enter 1: `disc[1] = low[1] = 0`, stack `[1]`. Enter 2: `disc[2] = low[2] = 1`, stack `[1,2]`. Enter 3: `disc[3] = low[3] = 2`, stack `[1,2,3]`. From 3 the edge `3 → 1` points to a vertex still on the stack, so it is a back-edge and pulls `low[3] = min(2, disc[1]) = 0`. Finishing 3, `low[3] = 0 != disc[3] = 2`, so 3 is not a root; it propagates `low[2] = min(1, 0) = 0`, then `low[1] = min(0, 0) = 0`. Only when we return to 1 do we see `low[1] == disc[1] == 0` — the root. We pop 3, 2, 1 off the stack and emit them as the single SCC `{1, 2, 3}`. The three vertices are grouped precisely because each could reach back to street 0.

## visualization
```
Graph:
  1 → 2 → 3 → 1   (cycle {1,2,3})
  3 → 4 → 5 → 4   (cycle {4,5})

DFS from 1:
  visit 1: disc[1]=0, low[1]=0, stack=[1]
  visit 2: disc[2]=1, low[2]=1, stack=[1,2]
  visit 3: disc[3]=2, low[3]=2, stack=[1,2,3]
    explore 3→1: back edge → low[3] = min(2, disc[1]) = 0
    explore 3→4:
      visit 4: disc[4]=3, low[4]=3, stack=[1,2,3,4]
        explore 4→5:
          visit 5: disc[5]=4, low[5]=4, stack=[1,2,3,4,5]
            explore 5→4: back edge → low[5] = min(4, disc[4]) = 3
          finish 5: low[5]=3 ≠ disc[5]=4 — no SCC root.
        propagate: low[4] = min(low[4], low[5]) = 3
      finish 4: low[4]=3 == disc[4]=3 → SCC root!
        Pop stack to 4: pop 5, pop 4 → SCC = {4, 5}
    propagate: low[3] = min(low[3], low[4]) = 0  (still 0 from back-edge)
  finish 3: low[3]=0 ≠ disc[3]=2 — no root.
  propagate: low[2] = min(1, low[3]) = 0
  finish 2: low[2]=0 ≠ disc[2]=1 — no root.
  propagate: low[1] = min(0, low[2]) = 0
  finish 1: low[1]=0 == disc[1]=0 → SCC root!
    Pop stack to 1: pop 3, pop 2, pop 1 → SCC = {1, 2, 3}

Result: 2 SCCs: {1,2,3}, {4,5}.
```

## bruteForce
**For each pair (u, v), check reachability both ways**: O(V × (V+E)) per pair → O(V³).

**Kosaraju's algorithm**: 2 DFS passes — first on original graph (record finish times), second on reversed graph (process by descending finish time). O(V+E) but two passes; clearer to teach but slightly slower in practice due to the reverse.

**Path-based SCC** (Gabow's algorithm): variant of Tarjan with similar complexity; uses two stacks instead of low-link.

Tarjan is the standard interview answer.

## optimal
Tarjan performs one depth-first traversal, and every SCC is emitted the instant its root's recursion returns — no second pass, no graph reversal. **Why it's correct** rests on a precise claim about `low`: for a root `r`, `low[r] == disc[r]` holds if and only if no vertex reachable from `r`'s DFS subtree can escape via a back-edge to a vertex discovered before `r`. If some descendant could escape higher, its `low` would propagate up and force `low[r] < disc[r]`; conversely, if `low[r] == disc[r]`, the subtree is sealed and every vertex still on the stack above `r` is mutually reachable with `r` — that is the definition of a strongly connected component. **The key invariant** is the `on_stack` set: a neighbour's `disc` may only lower `low[v]` when that neighbour is still on the stack, because an off-stack neighbour already belongs to a completed SCC and offers no path back into the current one. Confusing an off-stack cross edge for a back-edge is the classic bug that corrupts later components.

**The mechanism, step by step:** on entry, stamp `disc[v] = low[v]` with the running counter, push `v`, and mark it on-stack. For each out-edge, either recurse into an undiscovered neighbour and afterward absorb its `low` (a tree edge), or, if the neighbour is on the stack, tighten `low[v]` with the neighbour's `disc` (a back-edge). After the loop, test `low[v] == disc[v]`; if true, pop the stack down to and including `v`, clearing each popped vertex's on-stack flag, and record those vertices as one SCC. **The central tradeoff** versus Kosaraju is elegance for subtlety: Tarjan is a single pass and cache-friendly, but it demands careful `low`/`disc` bookkeeping, whereas Kosaraju's two passes are easier to reason about at the cost of building the reversed graph. **Complexity intuition:** the outer loop starts a DFS from each undiscovered vertex, and inside the traversal every vertex is pushed and popped exactly once and every edge is inspected exactly once, so the total work is `O(V + E)` with `O(V)` auxiliary space for the stack and the `disc`/`low`/`on_stack` structures.

**Tarjan's iterative pseudocode**:
```
def tarjan(graph):
    disc = {}; low = {}; on_stack = set(); stack = []; sccs = []; t = [0]

    def strongconnect(v):
        disc[v] = low[v] = t[0]; t[0] += 1
        stack.append(v); on_stack.add(v)
        for u in graph[v]:
            if u not in disc:
                strongconnect(u)
                low[v] = min(low[v], low[u])
            elif u in on_stack:
                low[v] = min(low[v], disc[u])      # back edge
        if low[v] == disc[v]:
            scc = []
            while True:
                u = stack.pop(); on_stack.remove(u); scc.append(u)
                if u == v: break
            sccs.append(scc)

    for v in graph:
        if v not in disc:
            strongconnect(v)
    return sccs
```

**Key invariant**: `on_stack` distinguishes back edges (in-stack = same DFS tree, current SCC candidate) from cross edges (off-stack = already in a finished SCC).

**For very large graphs**: convert to iterative DFS (explicit stack) to avoid recursion-depth limits.

## complexity
- **Time:** O(V + E). Each vertex / edge processed once.
- **Space:** O(V) for stack + disc/low arrays.

## pitfalls
- **Cross edges treated as back edges.** Updating `low[v] = min(low[v], disc[u])` without checking `on_stack[u]` pulls disc values from an already-finished SCC, corrupting later low computations. Fix: always gate the back-edge update with `if u in on_stack`; if u has been popped, the edge is a cross edge and contributes nothing.
- **Recursion stack overflow.** A 10^5-vertex chain blows Python's default recursion limit and the JVM's native stack. Fix: convert to explicit-stack iterative DFS (push a `(node, iterator)` frame and resume each frame after a recursive return), or pre-raise `sys.setrecursionlimit` and run on a thread with a larger stack.
- **`low[u]` vs `disc[u]` in propagation.** Using `disc[u]` for tree edges (or `low[u]` for back edges) silently produces wrong SCCs. Fix: write the two propagation lines side by side — `min(low[v], low[u])` for tree edges, `min(low[v], disc[u])` for back edges — and review them as a pair every time.
- **`on_stack` not cleared on pop.** Stale `on_stack` entries cause cross edges from a *later* DFS tree to be reclassified as back edges. Fix: in the SCC-emit loop, always `on_stack.remove(w)` (or `onStack[w] = false`) inside the pop, before adding to the SCC.
- **Global discovery-time counter reused across graphs.** A static/global `t` retains its value across multiple `tarjan()` calls, producing wildly wrong `disc`. Fix: reset `t = 0` at the start of every public entry point, or wrap state in an instance/closure so each call gets fresh counters.

## interviewTips
- For "find all strongly connected components" → Tarjan.
- Cite **low-link** = "smallest discovery time reachable" — that one sentence is the algorithm.
- For senior interviews, discuss **2-SAT via SCC**, **condensation DAG** (each SCC = one node, edges between SCCs).

## code.python
```python
import sys
sys.setrecursionlimit(10**6)
def tarjan_scc(graph):
    disc, low, on_stack, stack, sccs = {}, {}, set(), [], []
    t = 0
    def go(v):
        nonlocal t
        disc[v] = low[v] = t; t += 1
        stack.append(v); on_stack.add(v)
        for u in graph.get(v, []):
            if u not in disc:
                go(u)
                low[v] = min(low[v], low[u])
            elif u in on_stack:
                low[v] = min(low[v], disc[u])
        if low[v] == disc[v]:
            scc = []
            while True:
                w = stack.pop(); on_stack.discard(w); scc.append(w)
                if w == v: break
            sccs.append(scc)
    for v in graph:
        if v not in disc:
            go(v)
    return sccs
```

## code.javascript
```javascript
function tarjanSCC(graph) {
  const disc = new Map(), low = new Map(), onStack = new Set(), stack = [], sccs = [];
  let t = 0;
  function go(v) {
    disc.set(v, t); low.set(v, t); t++;
    stack.push(v); onStack.add(v);
    for (const u of (graph[v] || [])) {
      if (!disc.has(u)) { go(u); low.set(v, Math.min(low.get(v), low.get(u))); }
      else if (onStack.has(u)) low.set(v, Math.min(low.get(v), disc.get(u)));
    }
    if (low.get(v) === disc.get(v)) {
      const scc = [];
      while (true) {
        const w = stack.pop(); onStack.delete(w); scc.push(w);
        if (w === v) break;
      }
      sccs.push(scc);
    }
  }
  for (const v of Object.keys(graph)) if (!disc.has(v)) go(v);
  return sccs;
}
```

## code.java
```java
class TarjanSCC {
    Map<Integer, List<Integer>> g;
    int[] disc, low; boolean[] onStack; Deque<Integer> stack;
    List<List<Integer>> sccs; int t;
    public List<List<Integer>> run(int n, Map<Integer, List<Integer>> g) {
        this.g = g; disc = new int[n]; low = new int[n]; onStack = new boolean[n];
        Arrays.fill(disc, -1); stack = new ArrayDeque<>(); sccs = new ArrayList<>(); t = 0;
        for (int v = 0; v < n; v++) if (disc[v] == -1) go(v);
        return sccs;
    }
    void go(int v) {
        disc[v] = low[v] = t++; stack.push(v); onStack[v] = true;
        for (int u : g.getOrDefault(v, List.of())) {
            if (disc[u] == -1) { go(u); low[v] = Math.min(low[v], low[u]); }
            else if (onStack[u]) low[v] = Math.min(low[v], disc[u]);
        }
        if (low[v] == disc[v]) {
            List<Integer> scc = new ArrayList<>();
            while (true) {
                int w = stack.pop(); onStack[w] = false; scc.add(w);
                if (w == v) break;
            }
            sccs.add(scc);
        }
    }
}
```

## code.cpp
```cpp
class Tarjan {
    vector<vector<int>>& g;
    vector<int> disc, low; vector<bool> onStack;
    stack<int> st; vector<vector<int>> sccs; int t = 0;
    void go(int v) {
        disc[v] = low[v] = t++; st.push(v); onStack[v] = true;
        for (int u : g[v]) {
            if (disc[u] == -1) { go(u); low[v] = min(low[v], low[u]); }
            else if (onStack[u]) low[v] = min(low[v], disc[u]);
        }
        if (low[v] == disc[v]) {
            vector<int> scc;
            while (true) {
                int w = st.top(); st.pop(); onStack[w] = false; scc.push_back(w);
                if (w == v) break;
            }
            sccs.push_back(scc);
        }
    }
public:
    Tarjan(vector<vector<int>>& g) : g(g), disc(g.size(), -1), low(g.size()), onStack(g.size(), false) {}
    vector<vector<int>> run() {
        for (int v = 0; v < (int)g.size(); v++) if (disc[v] == -1) go(v);
        return sccs;
    }
};
```
