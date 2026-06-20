---
slug: graph-2sat
module: graphs-advanced
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
The algorithm exists because general SAT (boolean satisfiability with arbitrary-length clauses) is NP-complete — the canonical hard problem since Cook 1971. But the 2-literal restriction (every clause has exactly two literals) admits a beautiful polynomial-time algorithm: Aspvall-Plass-Tarjan 1979 showed that 2-SAT collapses to strongly-connected-components on an implication graph.

The decisive observation: a clause `(a ∨ b)` is logically equivalent to the two implications `(¬a → b)` and `(¬b → a)` — "if a is false, then b must be true (to satisfy the OR), and symmetrically". Encode each variable x as two literal nodes (x and ¬x) in a directed graph of 2n nodes, then for each clause add the two implication edges. The graph has 2n nodes and 2m edges; satisfiability becomes a structural question on this implication graph.

The Krom theorem (1967, formalised in Aspvall-Plass-Tarjan 1979): a 2-SAT formula is satisfiable **iff no variable and its negation lie in the same strongly connected component** of the implication graph. Why? An SCC is a set of literals that mutually imply each other — if x and ¬x are both in the same SCC, then the formula forces both x→¬x and ¬x→x, meaning x must equal its own negation, an impossibility. Conversely, if no variable shares a component with its negation, a satisfying assignment exists and can be constructed.

The assignment construction: run Tarjan's SCC algorithm, which emits components in **reverse topological order** of the condensation DAG. For each variable x, compare the component IDs of its two literals: set x = True iff x's literal-component-ID > ¬x's literal-component-ID (in Tarjan's reverse-topological numbering, that means x appears later in the topological order of the condensation). This rule ensures that any implication x → y respects the assignment: if x is True, then y's component is after x's, so y is also True. The proof is structural — Aspvall-Plass-Tarjan show no false implications are introduced.

Many real problems reduce to 2-SAT once you spot the binary-choice structure: scheduling tasks to one of two slots without conflict, 2-colouring with constraints, layout-with-conflicts puzzles, "feasible direction assignment of edges in a graph", certain "either A or B but not both unless C" constraint problems. Recognising the reduction is half the battle; the algorithm is mechanical once the implication graph is built. MiniSat and similar SAT solvers special-case the 2-CNF fragment with this algorithm before falling back to general DPLL.

## visualization
Variables x, y, z. Clauses: (x OR y), (not x OR z), (not y OR not z). Build 6 nodes: x, not x, y, not y, z, not z. Implications: (x OR y) -> "not x -> y", "not y -> x". (not x OR z) -> "x -> z", "not z -> not x". (not y OR not z) -> "y -> not z", "z -> not y". Run SCC: components might be {not x, y, not z} and {x, not y, z}. No variable shares a component with its negation -> satisfiable. Topological order yields x = true, y = false, z = true.

## bruteForce
Enumerate all 2^n variable assignments and verify clauses. O(2^n * m). Backtracking with unit propagation (DPLL) is faster in practice but still exponential worst case. None of these exploit the 2-literal structure.

## optimal
**Technique: implication-graph construction + Tarjan/Kosaraju SCC + topological-order-based assignment.** O(n + m) — linear in variables and clauses. Optimal because any 2-SAT algorithm must inspect every clause at least once (Ω(m)) and SCC computation is the minimum work to detect the same-component obstruction.

```python
import sys
sys.setrecursionlimit(10**6)

class TwoSat:
    def __init__(self, n):
        self.n = n                                # number of variables
        self.adj = [[] for _ in range(2 * n)]     # 2n nodes: 2i = x_i, 2i+1 = NOT x_i

    def _neg(self, lit): return lit ^ 1            # flip lowest bit

    def add_clause(self, a, b):
        # Clause (a OR b) becomes (¬a → b) and (¬b → a)
        self.adj[self._neg(a)].append(b)
        self.adj[self._neg(b)].append(a)

    def solve(self):
        n2 = 2 * self.n
        comp = [-1] * n2                          # SCC ID per literal
        order = []
        visited = [False] * n2

        # Pass 1: DFS, push on finish (Kosaraju)
        def dfs1(u):
            stack = [(u, iter(self.adj[u]))]
            visited[u] = True
            while stack:
                v, it = stack[-1]
                nxt = next(it, None)
                if nxt is None: order.append(v); stack.pop()
                elif not visited[nxt]:
                    visited[nxt] = True
                    stack.append((nxt, iter(self.adj[nxt])))

        for u in range(n2):
            if not visited[u]: dfs1(u)

        # Build transpose graph
        tr = [[] for _ in range(n2)]
        for u in range(n2):
            for v in self.adj[u]: tr[v].append(u)

        # Pass 2: DFS on transpose in reverse-finish order
        c = 0
        for u in reversed(order):
            if comp[u] != -1: continue
            stack = [u]; comp[u] = c
            while stack:
                v = stack.pop()
                for nb in tr[v]:
                    if comp[nb] == -1:
                        comp[nb] = c; stack.append(nb)
            c += 1

        # Check satisfiability and extract assignment
        assignment = [False] * self.n
        for i in range(self.n):
            if comp[2*i] == comp[2*i + 1]:
                return None                       # UNSAT
            # x_i = True iff its True-literal's component is LATER in topological order
            # (Kosaraju emits in topological order of condensation, so smaller comp ID = earlier)
            assignment[i] = comp[2*i] > comp[2*i + 1]
        return assignment
```

Key lines: `_neg(lit) = lit ^ 1` is the literal-negation trick — pack `x_i` at index `2i` and `¬x_i` at `2i + 1`, so flipping the lowest bit toggles negation. `add_clause(a, b)` adds the two implication edges encoding `(a ∨ b)`. The SCC pass (Kosaraju here for clarity; Tarjan is equivalent and slightly faster) computes a component ID per literal. The satisfiability check `if comp[2*i] == comp[2*i + 1]: return None` enforces Krom's theorem — a variable in the same component as its negation makes the formula unsatisfiable.

The assignment rule `assignment[i] = comp[2*i] > comp[2*i + 1]` exploits Kosaraju's output ordering (topological order of the condensation DAG, smaller IDs come first). Setting x to True when its true-literal's component has a *larger* ID means x's true-literal appears *later* in topological order than ¬x — which respects all implications x → y in the graph (y's component is at least as late as x's).

**Why not brute force 2ⁿ?** Exponential — useless past n ≈ 25. Even DPLL-style backtracking with unit propagation is worst-case exponential. **Why not general SAT solvers (MiniSat, Z3)?** They work but bring industrial-strength machinery for a problem that has a clean linear-time algorithm; they internally detect 2-CNF and special-case it anyway. **Why not Krom's original O(n·m)?** Aspvall-Plass-Tarjan's SCC reduction is asymptotically better and conceptually cleaner. **Common bugs**: forgetting that each clause contributes TWO implication edges, not one; using `index XOR 1` for negation without sanity-checking the parity convention (variable at 2i, negation at 2i+1); reading SCC IDs in the wrong order — Tarjan emits in reverse topological order, Kosaraju in topological order, so the "set true when later" rule flips between the two; encoding unit clauses (just `x`) — use `add_clause(x, x)` so the implication `¬x → x` correctly forces x = True.

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
