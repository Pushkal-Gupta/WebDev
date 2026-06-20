---
slug: lp-duality
module: math-number-theory
title: LP Duality
subtitle: Every linear program has a dual LP with mirror constraints; weak + strong duality + complementary slackness power flow/cut proofs.
difficulty: Advanced
position: 18
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e) companion site"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Linear programming + duality"
    url: "https://cp-algorithms.com/"
    type: blog
  - title: "kth-competitive-programming/kactl — LP / simplex templates"
    url: "https://github.com/kth-competitive-programming/kactl"
    type: repo
status: published
---

## intro
A **linear program (LP)** maximizes (or minimizes) a linear objective subject to linear inequality constraints over real variables. Every primal LP has a **dual LP** with mirrored constraints, and the two LPs are tied together by **weak duality** (dual objective bounds primal) + **strong duality** (their optima coincide when feasible) + **complementary slackness** (the variables of one are "tight" exactly where the constraints of the other are tight). These three facts are the proof engine behind max-flow/min-cut, LP-rounding approximations, and combinatorial optimality certificates.

## whyItMatters
LP duality is the lens for:
- **Max-flow = min-cut** — both are LPs; duality says max-flow value equals min-cut capacity.
- **Matching / vertex-cover** — König's theorem for bipartite is LP duality.
- **Game theory** — minimax theorem follows from LP duality.
- **Approximation algorithms** — primal-dual schema (Vazirani, Williamson-Shmoys).
- **Optimization correctness proofs** — "the dual gives a feasible solution of value V → primal is upper-bounded by V."

Knowing duality lets you prove an LP solution is optimal WITHOUT enumerating alternatives.

## intuition
Primal (maximization form):
```
max  cᵀx
s.t. Ax ≤ b
     x ≥ 0
```

Dual (minimization):
```
min  bᵀy
s.t. Aᵀy ≥ c
     y ≥ 0
```

Mechanical recipe — swap roles:
- One constraint per primal variable becomes one dual variable.
- One primal variable becomes one dual constraint.
- max ↔ min.
- ≤ ↔ ≥ (with y ≥ 0 sign).
- Cost vector c ↔ resource vector b.

**Weak duality**: for any feasible primal x and any feasible dual y, `cᵀx ≤ bᵀy`. Always.

**Strong duality**: if either has a finite optimum, both do, and they're equal.

**Complementary slackness**: at optimum, for each i, either `y_i = 0` or the primal's i-th constraint is tight (`(Ax)_i = b_i`). Same for each j: `x_j = 0` or dual's j-th constraint is tight.

## visualization
```
Maximize 3x + 2y                    Dual:
  s.t.  x + y ≤ 4                   Minimize 4u + 6v
        2x + y ≤ 6                    s.t.  u + 2v ≥ 3
        x, y ≥ 0                            u + v   ≥ 2
                                            u, v ≥ 0

Primal optimum:  (x, y) = (2, 2),  value = 3(2)+2(2) = 10
Dual optimum:    (u, v) = (1, 1),  value = 4(1)+6(1) = 10
                                        ✓ strong duality

Complementary slackness check:
  Primal constraint 1: 2 + 2 = 4 (tight)        → u > 0 allowed (u = 1) ✓
  Primal constraint 2: 2(2) + 2 = 6 (tight)     → v > 0 allowed (v = 1) ✓
  Primal x = 2 > 0  →  dual constraint 1 tight: 1 + 2(1) = 3 ✓
  Primal y = 2 > 0  →  dual constraint 2 tight: 1 + 1 = 2 ✓
```

## bruteForce
**Solve primal alone**: simplex / interior point gives optimum but no proof of correctness. To verify, you'd re-solve or check KKT conditions manually.

**Enumeration of vertices**: LP optimum is at a vertex of the feasible polytope. With n variables + m constraints, there are O(C(n+m, n)) vertices — exponential.

Duality gives a one-shot certificate: "here's a dual y; cᵀx̂ = bᵀŷ; both feasible; hence both optimal."

## optimal
**Build the dual** mechanically (max-form primal):
```
def primal_to_dual(c, A, b):
    """primal: max cᵀx s.t. Ax ≤ b, x ≥ 0"""
    n, m = len(c), len(b)
    # dual: min bᵀy s.t. Aᵀy ≥ c, y ≥ 0
    return {
        'objective': 'min',
        'coefficients': b,
        'constraint_matrix': transpose(A),
        'constraint_rhs': c,
        'inequality': '>=',
        'sign': 'y >= 0',
    }
```

**Solve via simplex** (sketch): start at origin, pivot along edges of the polytope, moving to vertices that strictly improve the objective. Stop when no improving pivot. Optimal vertex emerges. Polynomial in practice; exponential worst case (Klee-Minty cube).

**Use duality**: after solving primal, the simplex method produces the dual variables ("shadow prices") for free as the basic-vs-non-basic split. Print them as a correctness certificate.

**Primal-dual schema** for approximation:
1. Start with dual y = 0 and primal x = 0.
2. Increase dual variables until a primal constraint becomes tight.
3. Add the corresponding primal variable.
4. Repeat. Result: a feasible primal + feasible dual; ratio gives the approximation factor.

## complexity
- **Simplex**: polynomial average / exponential worst case.
- **Interior point** (Karmarkar, ellipsoid): polynomial worst case (O((n+m)³·L)).
- **Building the dual**: O(n·m) — just transpose.
- **Memory**: O(n·m) for the constraint matrix.

## pitfalls
- **Sign conventions**: max vs min vs sense of ≤ vs ≥ vs equality — pay attention to the recipe. Equality constraints in primal become free (unconstrained sign) dual variables.
- **Unbounded primal ↔ infeasible dual** (and vice versa). Both can be infeasible simultaneously.
- **Strong duality requires a finite optimum**. If primal is unbounded, strong duality doesn't apply.
- **Strict complementary slackness** (no "0 = 0 = 0" sloppiness) requires non-degenerate solutions.
- **Numerical stability**: simplex pivoting on near-zero values misroutes. Use scaled / fractional arithmetic for proofs.

## interviewTips
- For "prove this graph algorithm is optimal" — translate to LP, find the dual, exhibit a dual certificate.
- Mention **max-flow = min-cut** as the canonical example.
- For senior interviews, walk through **complementary slackness** with a small example.
- Mention **primal-dual schema** for designing approximation algorithms.

## code.python
```python
# Solve a small LP via scipy.optimize.linprog (uses interior-point or simplex).
from scipy.optimize import linprog
# Primal:  max 3x + 2y  s.t.  x+y ≤ 4,  2x+y ≤ 6,  x,y ≥ 0
# linprog minimizes; negate c for max.
c = [-3, -2]
A = [[1, 1], [2, 1]]
b = [4, 6]
res = linprog(c, A_ub=A, b_ub=b, bounds=[(0, None), (0, None)], method='highs')
print('primal opt:', -res.fun)              # 10
# Dual values:  res.ineqlin.marginals (negated due to min/max flip)
print('dual y:', -res.ineqlin.marginals)     # [1, 1]
```

## code.javascript
```javascript
// Pure-JS LP solver: javascript-lp-solver on npm
// const solver = require('javascript-lp-solver');
// const model = { optimize: 'profit', opType: 'max', constraints: {...}, variables: {...} };
// const result = solver.Solve(model);
// console.log(result);
```

## code.java
```java
// Apache Commons Math3 SimplexSolver
// LinearObjectiveFunction f = new LinearObjectiveFunction(new double[]{3, 2}, 0);
// Collection<LinearConstraint> cs = Arrays.asList(
//   new LinearConstraint(new double[]{1, 1}, Relationship.LEQ, 4),
//   new LinearConstraint(new double[]{2, 1}, Relationship.LEQ, 6));
// PointValuePair sol = new SimplexSolver().optimize(f, new LinearConstraintSet(cs),
//                       GoalType.MAXIMIZE, new NonNegativeConstraint(true));
```

## code.cpp
```cpp
// Use a library: lp_solve, COIN-OR, or roll your own simplex.
// Competitive-programming style: implement primal simplex on dense matrices.
// KACTL has a 50-line implementation: see kth-competitive-programming/kactl/content/numerical/Simplex.h
```
