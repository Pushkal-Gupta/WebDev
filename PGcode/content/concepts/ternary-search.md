---
slug: ternary-search
module: arrays-searching
title: Ternary Search
subtitle: Find the extremum of a unimodal function in O(log n) — narrow down by thirds instead of halves.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Ternary Search"
    url: "https://cp-algorithms.com/num_methods/ternary_search.html"
    type: blog
  - title: "TheAlgorithms/Python — searches (ternary)"
    url: "https://github.com/TheAlgorithms/Python/blob/master/searches/ternary_search.py"
    type: repo
status: published
---

## intro
**Binary search** finds a value with a monotonic predicate. **Ternary search** finds the extremum (min or max) of a **unimodal** function — one that strictly increases then strictly decreases (or vice versa). At each step, evaluate the function at two interior points dividing the range into thirds, then keep the two-thirds slice that must contain the peak. Logarithmic.

## whyItMatters
Common problems:
- **Find the angle that minimizes a physics-simulated trajectory's distance.**
- **Find the best price point** on a unimodal revenue curve.
- **Locate the optimum** of any single-variable convex / concave function.
- **Geometric problems**: closest point on a parametric curve, optimal placement.

Where binary search asks "is X true at this point?", ternary search asks "is the optimum to the left or right of this point?"

## intuition
Pick two interior points `m1 = l + (r-l)/3` and `m2 = r - (r-l)/3`. Evaluate `f(m1)` and `f(m2)`.
- If `f(m1) > f(m2)` (maximizing case), the peak can't be to the right of m2 — narrow to `[l, m2]`.
- Otherwise, narrow to `[m1, r]`.
- Repeat until `r - l` is small enough (or the integer range collapses).

Each step removes 1/3 of the range → O(log_(3/2) n) ≈ 1.7 log n iterations.

## visualization
```
f is unimodal with peak at x = 5:

f(x):  ●●●●●●●●●●●  
      ◣           ◢
      l           r           (initial: l=0, r=10)
                              
Round 1: m1 = 3, m2 = 7. f(3)=4, f(7)=4. Keep [m1, m2] → l = 3, r = 7.
Round 2: m1 = 4, m2 = 6. f(4)=8, f(6)=8. Keep [m1, m2] → l = 4, r = 6.
Round 3: m1 = 4, m2 = 5. f(4)=8, f(5)=10. f(m2) > f(m1) → l = m1 → l = 4 → still range [4, 6].
... converges to x = 5.
```

## bruteForce
Linear scan: O(n). Fine for small ranges. Wasteful when the search space is 10^9 or continuous.

## optimal
**Integer ternary search (maximize)**:
```
def ternary_search_max_int(lo, hi, f):
    while hi - lo > 2:
        m1 = lo + (hi - lo) // 3
        m2 = hi - (hi - lo) // 3
        if f(m1) < f(m2): lo = m1 + 1
        else: hi = m2 - 1
    best = lo
    for x in range(lo, hi + 1):
        if f(x) > f(best): best = x
    return best
```

**Continuous (real-valued) ternary search**:
```
def ternary_search_max_float(lo, hi, f, iterations=200):
    for _ in range(iterations):
        m1 = lo + (hi - lo) / 3
        m2 = hi - (hi - lo) / 3
        if f(m1) < f(m2): lo = m1
        else: hi = m2
    return (lo + hi) / 2
```

For continuous functions, 100-200 iterations gets you to ~1e-9 precision (range shrinks by 2/3 each iteration → log_(3/2)(1/ε) ≈ 50·log(1/ε)).

## complexity
- **Time**: O(log_(3/2) n) ≈ 1.71 log n iterations.
- **Each iteration**: 2 function evaluations.
- **Space**: O(1).
- **Versus binary search**: ternary handles a different problem (extremum vs threshold). They don't substitute.

## pitfalls
- **Not unimodal**: ternary search returns a *local* extremum that may not be the global one. Verify unimodality before applying.
- **Integer rounding traps**: when `hi - lo <= 2`, the formula collapses. Drop into linear scan for the last few values.
- **Strict vs non-strict comparison**: with plateaus (equal values at consecutive points), classic ternary search can shrink the wrong half. Use the "while hi - lo > 2" pattern + linear cleanup.
- **Floating-point precision**: 200 iterations is overkill but cheap; 50 is usually enough for double-precision results.

## interviewTips
- The trigger: "find the max / min of a unimodal function" — that's the signature.
- Walk through the "two interior points, keep two thirds" rule explicitly.
- Compare with **binary search** (monotonic predicate, not extremum) and **golden-section search** (asymptotically the same; saves one function evaluation per round by reusing previous).
- For senior interviews, mention **convex optimization** (gradient descent etc.) for higher-dimensional analogues.

## code.python
```python
def ternary_search_max(lo, hi, f):
    while hi - lo > 2:
        m1 = lo + (hi - lo) // 3
        m2 = hi - (hi - lo) // 3
        if f(m1) < f(m2): lo = m1 + 1
        else: hi = m2 - 1
    return max(range(lo, hi + 1), key=f)

# Example: maximize -(x-5)^2 over [0, 10].
print(ternary_search_max(0, 10, lambda x: -(x - 5)**2))  # 5
```

## code.javascript
```javascript
function ternaryMax(lo, hi, f) {
  while (hi - lo > 2) {
    const m1 = lo + Math.floor((hi - lo) / 3);
    const m2 = hi - Math.floor((hi - lo) / 3);
    if (f(m1) < f(m2)) lo = m1 + 1; else hi = m2 - 1;
  }
  let best = lo;
  for (let x = lo + 1; x <= hi; x++) if (f(x) > f(best)) best = x;
  return best;
}
```

## code.java
```java
class TernarySearch {
    public int maximize(int lo, int hi, java.util.function.IntUnaryOperator f) {
        while (hi - lo > 2) {
            int m1 = lo + (hi - lo) / 3;
            int m2 = hi - (hi - lo) / 3;
            if (f.applyAsInt(m1) < f.applyAsInt(m2)) lo = m1 + 1;
            else hi = m2 - 1;
        }
        int best = lo;
        for (int x = lo + 1; x <= hi; x++) if (f.applyAsInt(x) > f.applyAsInt(best)) best = x;
        return best;
    }
}
```

## code.cpp
```cpp
#include <functional>
int ternaryMax(int lo, int hi, std::function<int(int)> f) {
    while (hi - lo > 2) {
        int m1 = lo + (hi - lo) / 3;
        int m2 = hi - (hi - lo) / 3;
        if (f(m1) < f(m2)) lo = m1 + 1; else hi = m2 - 1;
    }
    int best = lo;
    for (int x = lo + 1; x <= hi; x++) if (f(x) > f(best)) best = x;
    return best;
}
```
