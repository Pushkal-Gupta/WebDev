---
slug: two-sat
module: graphs-advanced
title: 2-SAT
subtitle: Solve a boolean satisfiability problem with 2 literals per clause in linear time via implication graph + SCC.
difficulty: Advanced
position: 27
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Part VI: Graph Algorithms (walkccc notes)"
    url: "https://walkccc.me/CLRS/"
    type: book
  - title: "cp-algorithms — Graph algorithms"
    url: "https://cp-algorithms.com/graph/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — graphs/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/graphs"
    type: repo
status: published
---

## intro
**2-SAT** is the satisfiability problem restricted to boolean formulas in CNF where every clause has at most 2 literals: `(a ∨ b) ∧ (¬a ∨ c) ∧ ...`. Unlike general SAT (NP-complete), 2-SAT is solvable in **linear time** by constructing an implication graph and running Tarjan's SCC.

## whyItMatters
A surprising number of scheduling / configuration problems reduce to 2-SAT:
- **Box stacking**: place each box upright or sideways under width constraints.
- **Coloring with restrictions**: each item has one of two color choices subject to pairwise rules.
- **Job assignment**: each worker takes shift A or shift B with conflicts.
- **Light switches in a grid**: each switch flips two lamps.

When you can frame the problem as "each variable has two choices and constraints come in pairs," 2-SAT lets you decide satisfiability AND retrieve a satisfying assignment in O(V + E).

## intuition
General SAT (deciding satisfiability of an arbitrary boolean CNF formula) is NP-complete and one of the canonical hard problems of complexity theory. Restricting to 3 literals per clause is still NP-complete (3-SAT). But at exactly 2 literals per clause, the problem becomes polynomial — solvable in linear time. The reason is a clever graph translation. Every 2-literal clause `(a ∨ b)` is logically equivalent to two implications: `¬a → b` (if a is false, then b must be true) and `¬b → a` (if b is false, then a must be true). Build an implication graph on 2n nodes — one for each variable and one for each negation. For each clause, add the two edges. The formula is satisfiable iff no variable and its negation share a strongly connected component (SCC). Why? If `x` and `¬x` are in the same SCC, there is a cycle `x → ¬x → x`, which means `x → ¬x` and `¬x → x` both hold — implying `x` must equal both true and false, contradiction. Otherwise, SCCs can be topologically sorted, and a satisfying assignment is recovered by setting `x = true` iff `comp[x] > comp[¬x]` in reverse topological order (Tarjan's SCC numbers components in reverse topo order, so the inequality flips). The deep insight is that the boundary between 2-SAT (polynomial) and 3-SAT (NP-complete) is one of the sharpest complexity-theoretic dichotomies — adding even one more literal per clause loses the implication-graph structure that makes 2-SAT tractable. The algorithm runs in O(V + E) total — linear in the size of the formula — which matches what BFS or DFS on the same graph would cost. Real applications include box-stacking, two-color graph problems with pairwise constraints, and shift-assignment with conflict pairs.

## visualization
```
Formula: (a ∨ b) ∧ (¬a ∨ c) ∧ (¬b ∨ ¬c)

Implication graph (nodes: a, ¬a, b, ¬b, c, ¬c):
  ¬a → b           (from a ∨ b)
  ¬b → a           (from a ∨ b)
   a → c           (from ¬a ∨ c)
  ¬c → ¬a          (from ¬a ∨ c)
   b → ¬c          (from ¬b ∨ ¬c)
   c → ¬b          (from ¬b ∨ ¬c)

Run SCC. If no variable shares an SCC with its negation → SAT. Solution: a=T, b=T, c=T.
```

## bruteForce
Try all 2^n assignments. O(2^n · m). Fine for n ≤ 20; useless beyond.

## optimal
**Step 1 — build the implication graph** (each variable x and ¬x as separate nodes):
```
for each clause (l1, l2):
    add edge from ¬l1 → l2
    add edge from ¬l2 → l1
```

**Step 2 — compute SCCs** (Tarjan's or Kosaraju's). Each node gets a component id.

**Step 3 — check satisfiability**:
```
for each variable x:
    if comp[x] == comp[¬x]: return UNSAT
```

**Step 4 — extract assignment** (if SAT):
SCC IDs from Tarjan's algorithm are in reverse topological order. Set `x = true` iff `comp[x] > comp[¬x]`.

Encoding convention: variable `i ∈ [0, n)` has node `2i` for `x_i` and node `2i + 1` for `¬x_i`. Then "negation" is `xor 1`.

## complexity
- **Time**: O(V + E) — linear in the formula size.
- **Space**: O(V + E).
- **Variables n, clauses m**: O(n + m).

## pitfalls
- **Encoding mistakes on negation**: keep a clear node-numbering convention. Off-by-ones here lead to subtle bugs.
- **Forgetting `(x ∨ x)` is a unit clause**: equivalent to "must be true." Still encodes correctly as `¬x → x`, but verify your solver handles it.
- **Mixing 0-indexed and 1-indexed variables**: pick one and stick to it.
- **Confusing 2-SAT with general SAT**: 2-SAT is polynomial; 3-SAT and up are NP-complete. The boundary at 2 is a famous classical result.

## interviewTips
- The trigger: "each item has two choices, pairwise constraints" → consider 2-SAT.
- For senior interviews, mention the **at-most-two-literals** boundary and how it makes the implication graph well-defined.
- Mention **Tarjan's SCC** as the workhorse subroutine (separate concept page).
- For "find a satisfying assignment, not just check SAT," explain the topological-order rule — interviewers like that you know both halves.

## code.python
```python
def two_sat(n, clauses):
    # n variables, each clause is (lit1, lit2) where lit > 0 means var (lit-1) true, lit < 0 means negated.
    g = [[] for _ in range(2 * n)]
    gr = [[] for _ in range(2 * n)]
    def var(x): return 2 * (abs(x) - 1) + (0 if x > 0 else 1)
    def neg(v): return v ^ 1
    for a, b in clauses:
        u, v = var(a), var(b)
        g[neg(u)].append(v); gr[v].append(neg(u))
        g[neg(v)].append(u); gr[u].append(neg(v))
    # Kosaraju's SCC
    visited = [False] * (2 * n)
    order = []
    def dfs1(v):
        stack = [(v, iter(g[v]))]
        visited[v] = True
        while stack:
            u, it = stack[-1]
            nxt = next(it, None)
            if nxt is None: order.append(u); stack.pop()
            elif not visited[nxt]: visited[nxt] = True; stack.append((nxt, iter(g[nxt])))
    for v in range(2 * n):
        if not visited[v]: dfs1(v)
    comp = [-1] * (2 * n)
    cid = 0
    def dfs2(v, c):
        stack = [v]; comp[v] = c
        while stack:
            u = stack.pop()
            for w in gr[u]:
                if comp[w] == -1: comp[w] = c; stack.append(w)
    for v in reversed(order):
        if comp[v] == -1: dfs2(v, cid); cid += 1
    assignment = []
    for i in range(n):
        if comp[2 * i] == comp[2 * i + 1]: return None  # UNSAT
        assignment.append(comp[2 * i] > comp[2 * i + 1])
    return assignment

print(two_sat(3, [(1, 2), (-1, 3), (-2, -3)]))  # one satisfying assignment
```

## code.javascript
```javascript
// Sketch — same algorithm, iterative SCC. Production version omitted for brevity.
function twoSat(n, clauses) {
  // build implication graph + run Kosaraju → return per-variable assignment or null.
  return [];
}
```

## code.java
```java
import java.util.*;
class TwoSat {
    int n;
    List<List<Integer>> g, gr;
    int[] comp;
    public boolean[] solve(int n, int[][] clauses) {
        // build implication graph as above, run iterative Tarjan / Kosaraju, return assignment.
        return new boolean[n];
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
struct TwoSat {
    int n;
    std::vector<std::vector<int>> g, gr;
    std::vector<int> comp, order;
    std::vector<bool> visited;
    void addEdge(int u, int v) { g[u].push_back(v); gr[v].push_back(u); }
    void dfs1(int v) {
        visited[v] = true;
        for (int u : g[v]) if (!visited[u]) dfs1(u);
        order.push_back(v);
    }
    void dfs2(int v, int c) {
        comp[v] = c;
        for (int u : gr[v]) if (comp[u] == -1) dfs2(u, c);
    }
    // Caller adds implications via 2-literal clauses, then runs Kosaraju + checks comp[x] vs comp[~x].
};
```
