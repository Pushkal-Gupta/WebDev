---
slug: graph-2sat
module: graphs
title: 2-SAT
subtitle: Decide a conjunction of 2-literal clauses by building an implication graph and running SCC.
difficulty: Advanced
position: 50
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "2-SAT — CP-Algorithms"
    url: "https://cp-algorithms.com/graph/2SAT.html"
    type: blog
  - title: "2-SAT Problem and SCC — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/2-satisfiability-2-sat-problem/"
    type: blog
  - title: "kactl — 2sat.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/graph/2sat.h"
    type: repo
status: published
---

## intro
2-SAT decides whether a conjunction of "x OR y" clauses (where each literal is a variable or its negation) has a satisfying assignment, and if so produces one — all in linear time. It is the only widely studied SAT variant that is in P. Many constraint-satisfaction problems with binary choices (true/false, left/right, A/B) reduce cleanly to 2-SAT.

## whyItMatters
General SAT is NP-complete, but 2-SAT collapses to "find strongly connected components of an implication graph." That gives polynomial-time exact answers to scheduling problems (assign each task to one of two slots), graph 2-colouring under constraints, certain layout-with-conflicts puzzles, and contest classics like "feasible direction assignment of edges." Recognising a problem as 2-SAT is half the battle; the algorithm is mechanical once you see it.

## intuition
A clause (a OR b) is logically equivalent to "if not a then b" and "if not b then a." Each variable splits into two literal nodes (x and not x). Each clause adds two directed implication edges. A satisfying assignment exists iff no variable and its negation lie in the same strongly connected component (because the component forces both x and not x to be true). When satisfiable, the assignment can be read off the topological order of the condensation: set literal x to true when comp(x) > comp(not x).

## visualization
Variables x, y, z. Clauses: (x OR y), (not x OR z), (not y OR not z). Build 6 nodes: x, not x, y, not y, z, not z. Implications: (x OR y) -> "not x -> y", "not y -> x". (not x OR z) -> "x -> z", "not z -> not x". (not y OR not z) -> "y -> not z", "z -> not y". Run SCC: components might be {not x, y, not z} and {x, not y, z}. No variable shares a component with its negation -> satisfiable. Topological order yields x = true, y = false, z = true.

## bruteForce
Enumerate all 2^n variable assignments and verify clauses. O(2^n * m). Backtracking with unit propagation (DPLL) is faster in practice but still exponential worst case. None of these exploit the 2-literal structure.

## optimal
Build the implication graph: for each clause (a OR b), add edges not(a) -> b and not(b) -> a. Run Tarjan's or Kosaraju's SCC on a graph with 2n nodes and 2m edges. If any variable's two literals share a component, output UNSAT. Otherwise, in the reverse topological order of components, assign each variable so that its true literal's component appears later than its false literal's component. This produces a valid assignment in O(n + m).

## complexity
time: O(n + m) — build (O(m)) + SCC (O(n + m)) + assignment (O(n))
space: O(n + m) for the implication graph and SCC bookkeeping
notes: Both Tarjan (one DFS) and Kosaraju (two DFS) yield the same complexity; Tarjan is usually faster constant-factor but Kosaraju is simpler to remember in interviews. The assignment step exploits Tarjan's reverse-topological output naturally.

## pitfalls
- Forgetting that each clause contributes TWO implication edges, not one.
- Using a single-character "negation" index scheme without sanity-checking that index XOR 1 maps literal to its negation.
- Reading the SCC component IDs in the wrong order — Tarjan emits in reverse topological order, Kosaraju in topological order; the "set literal true when later" rule must be adjusted accordingly.
- Forgetting the special case of a unit clause "x" by itself; encode as (x OR x) so the implication x -> x is harmless.
- Mistaking "SAT" for "find ALL assignments" — 2-SAT trivially produces one assignment in linear time, but counting all satisfying assignments is hard (#P-complete).

## interviewTips
- Lead with the clause-to-implication transformation; it is the only piece an interviewer cares to see.
- Mention Krom's theorem: 2-SAT is satisfiable iff no variable is in the same SCC as its negation.
- Be ready to encode a binary-choice problem as clauses on the fly — typical interview prompt is disguised as "assign each meeting to room A or B such that no conflict happens."
- If the interviewer wants the assignment too, walk through the topological-order trick rather than guessing.

## code.python
```python
import sys
from sys import setrecursionlimit

class TwoSat:
    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(2 * n)]

    def neg(self, x): return x ^ 1

    def add_clause(self, a, sa, b, sb):
        u = 2 * a + (0 if sa else 1)
        v = 2 * b + (0 if sb else 1)
        self.adj[self.neg(u)].append(v)
        self.adj[self.neg(v)].append(u)

    def solve(self):
        setrecursionlimit(1 << 25)
        comp = [-1] * (2 * self.n); order = []
        visited = [False] * (2 * self.n)
        def dfs1(u):
            stack = [(u, 0)]
            while stack:
                node, i = stack.pop()
                if i == 0:
                    if visited[node]: continue
                    visited[node] = True
                if i < len(self.adj[node]):
                    stack.append((node, i + 1))
                    stack.append((self.adj[node][i], 0))
                else:
                    order.append(node)
        for i in range(2 * self.n):
            if not visited[i]: dfs1(i)
        radj = [[] for _ in range(2 * self.n)]
        for u in range(2 * self.n):
            for v in self.adj[u]: radj[v].append(u)
        c = 0
        for u in reversed(order):
            if comp[u] != -1: continue
            stack = [u]
            while stack:
                x = stack.pop()
                if comp[x] != -1: continue
                comp[x] = c
                for y in radj[x]:
                    if comp[y] == -1: stack.append(y)
            c += 1
        assignment = []
        for i in range(self.n):
            if comp[2 * i] == comp[2 * i + 1]: return None
            assignment.append(comp[2 * i] > comp[2 * i + 1])
        return assignment
```

## code.javascript
```javascript
class TwoSat {
  constructor(n) {
    this.n = n;
    this.adj = Array.from({ length: 2 * n }, () => []);
  }
  neg(x) { return x ^ 1; }
  addClause(a, sa, b, sb) {
    const u = 2 * a + (sa ? 0 : 1);
    const v = 2 * b + (sb ? 0 : 1);
    this.adj[this.neg(u)].push(v);
    this.adj[this.neg(v)].push(u);
  }
  solve() {
    const N = 2 * this.n;
    const order = [], visited = new Array(N).fill(false);
    const dfs1 = (start) => {
      const stack = [[start, 0]];
      while (stack.length) {
        const top = stack[stack.length - 1];
        const [u, i] = top;
        if (i === 0) { if (visited[u]) { stack.pop(); continue; } visited[u] = true; }
        if (i < this.adj[u].length) { top[1]++; stack.push([this.adj[u][i], 0]); }
        else { stack.pop(); order.push(u); }
      }
    };
    for (let i = 0; i < N; i++) if (!visited[i]) dfs1(i);
    const radj = Array.from({ length: N }, () => []);
    for (let u = 0; u < N; u++) for (const v of this.adj[u]) radj[v].push(u);
    const comp = new Int32Array(N).fill(-1);
    let c = 0;
    for (let k = order.length - 1; k >= 0; k--) {
      const u = order[k];
      if (comp[u] !== -1) continue;
      const stack = [u];
      while (stack.length) {
        const x = stack.pop();
        if (comp[x] !== -1) continue;
        comp[x] = c;
        for (const y of radj[x]) if (comp[y] === -1) stack.push(y);
      }
      c++;
    }
    const assign = [];
    for (let i = 0; i < this.n; i++) {
      if (comp[2 * i] === comp[2 * i + 1]) return null;
      assign.push(comp[2 * i] > comp[2 * i + 1]);
    }
    return assign;
  }
}
```

## code.java
```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class TwoSat {
    int n;
    List<List<Integer>> adj;

    public TwoSat(int n) {
        this.n = n;
        this.adj = new ArrayList<>();
        for (int i = 0; i < 2 * n; i++) adj.add(new ArrayList<>());
    }

    int neg(int x) { return x ^ 1; }

    public void addClause(int a, boolean sa, int b, boolean sb) {
        int u = 2 * a + (sa ? 0 : 1);
        int v = 2 * b + (sb ? 0 : 1);
        adj.get(neg(u)).add(v);
        adj.get(neg(v)).add(u);
    }

    public boolean[] solve() {
        int N = 2 * n;
        boolean[] visited = new boolean[N];
        List<Integer> order = new ArrayList<>();
        for (int i = 0; i < N; i++) if (!visited[i]) dfs1(i, visited, order);
        List<List<Integer>> radj = new ArrayList<>();
        for (int i = 0; i < N; i++) radj.add(new ArrayList<>());
        for (int u = 0; u < N; u++) for (int v : adj.get(u)) radj.get(v).add(u);
        int[] comp = new int[N]; Arrays.fill(comp, -1);
        int c = 0;
        for (int k = order.size() - 1; k >= 0; k--) {
            int u = order.get(k);
            if (comp[u] != -1) continue;
            dfs2(u, c, comp, radj);
            c++;
        }
        boolean[] assign = new boolean[n];
        for (int i = 0; i < n; i++) {
            if (comp[2 * i] == comp[2 * i + 1]) return null;
            assign[i] = comp[2 * i] > comp[2 * i + 1];
        }
        return assign;
    }

    void dfs1(int u, boolean[] visited, List<Integer> order) {
        visited[u] = true;
        for (int v : adj.get(u)) if (!visited[v]) dfs1(v, visited, order);
        order.add(u);
    }

    void dfs2(int u, int c, int[] comp, List<List<Integer>> radj) {
        comp[u] = c;
        for (int v : radj.get(u)) if (comp[v] == -1) dfs2(v, c, comp, radj);
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>

struct TwoSat {
    int n;
    std::vector<std::vector<int>> adj, radj;
    std::vector<int> comp, order;
    std::vector<bool> visited;

    TwoSat(int n_) : n(n_), adj(2 * n_), radj(2 * n_), comp(2 * n_, -1), visited(2 * n_, false) {}

    int neg(int x) { return x ^ 1; }

    void addClause(int a, bool sa, int b, bool sb) {
        int u = 2 * a + (sa ? 0 : 1);
        int v = 2 * b + (sb ? 0 : 1);
        adj[neg(u)].push_back(v);
        adj[neg(v)].push_back(u);
    }

    void dfs1(int u) {
        visited[u] = true;
        for (int v : adj[u]) if (!visited[v]) dfs1(v);
        order.push_back(u);
    }

    void dfs2(int u, int c) {
        comp[u] = c;
        for (int v : radj[u]) if (comp[v] == -1) dfs2(v, c);
    }

    std::vector<int> solve() {
        for (int i = 0; i < 2 * n; i++) if (!visited[i]) dfs1(i);
        for (int u = 0; u < 2 * n; u++) for (int v : adj[u]) radj[v].push_back(u);
        int c = 0;
        for (int k = order.size() - 1; k >= 0; k--) {
            int u = order[k];
            if (comp[u] == -1) { dfs2(u, c); c++; }
        }
        std::vector<int> assign(n);
        for (int i = 0; i < n; i++) {
            if (comp[2 * i] == comp[2 * i + 1]) return {};
            assign[i] = comp[2 * i] > comp[2 * i + 1] ? 1 : 0;
        }
        return assign;
    }
};
```
