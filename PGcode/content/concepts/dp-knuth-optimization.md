---
slug: dp-knuth-optimization
module: dp
title: Knuth's Optimization
subtitle: When opt(i, j) is monotonic in i and j, cut O(n^3) to O(n^2) by restricting the inner search.
difficulty: Advanced
position: 21
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 14: Dynamic Programming (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap14/"
    type: book
  - title: "TopCoder — Dynamic Programming: From Novice to Advanced"
    url: "https://www.topcoder.com/thrive/articles/Dynamic%20Programming:%20From%20Novice%20to%20Advanced"
    type: blog
  - title: "TheAlgorithms/Python — dynamic_programming/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/dynamic_programming"
    type: repo
status: published
---

## intro
**Knuth's optimization** is a DP speedup for recurrences of the form
`dp[i][j] = min over k in [i, j-1] of (dp[i][k] + dp[k+1][j]) + w(i, j)`.

Naive: O(n^3) — three nested loops. If the optimal `k` (call it `opt[i][j]`) satisfies the **monotonicity condition** `opt[i][j-1] ≤ opt[i][j] ≤ opt[i+1][j]`, you can restrict the inner search to that smaller window and drop total cost to **O(n^2)**.

## whyItMatters
The O(n^3) → O(n^2) speedup turns intractable inputs into trivial ones for problems like:
- **Optimum binary search tree** (the original Knuth result).
- **Matrix chain multiplication** with extra cost structure.
- **Interval merge minimization** (e.g., minimum cost to merge n piles of stones).
- **String alignment with quadratic structure**.

For n = 1000, n^3 = 10^9 (too slow); n^2 = 10^6 (instant).

## intuition
For an interval DP that splits `[i, j]` at some k, the optimal split point usually drifts monotonically as the interval extends. If `opt[i][j-1] = a` (the best split for the shorter interval) and `opt[i+1][j] = b` (the best for a different shorter interval), then `opt[i][j]` lies somewhere in `[a, b]`. Iterate k only across that window instead of the full `[i, j)`.

Across all i, j, the total work telescopes from n^3 to n^2.

## visualization
```
For matrix-chain on n = 5 chains, naive walk:

(0, 1):  try k = 0    →  1 candidate
(0, 2):  try k = 0..1 →  2 candidates
...
(0, 4):  try k = 0..3 →  4 candidates

Total naive work = 1+2+3+4 = 10 for one length.
Naive total over all i (j fixed): n^2.

With Knuth, opt[i][j-1] ≤ opt[i][j] ≤ opt[i+1][j].
At each (i, j), opt window shrinks; total work ∑(opt[i+1][j] - opt[i][j-1]) telescopes.
Result: O(n^2) total.
```

## bruteForce
The naive O(n^3) implementation:
```
for length in 2..n:
    for i in 0..n-length:
        j = i + length
        dp[i][j] = ∞
        for k in i..j-1:
            dp[i][j] = min(dp[i][j], dp[i][k] + dp[k+1][j] + w(i, j))
```

## optimal
Knuth's optimization in O(n^2):
```
opt = [[0]*(n+1) for _ in range(n+1)]
for i in range(n):
    opt[i][i+1] = i        # base case

for length in 2..n:
    for i in 0..n-length:
        j = i + length
        dp[i][j] = ∞
        # Search only in [opt[i][j-1], opt[i+1][j]]:
        for k in range(opt[i][j-1], opt[i+1][j] + 1):
            cost = dp[i][k] + dp[k+1][j] + w(i, j)
            if cost < dp[i][j]:
                dp[i][j] = cost
                opt[i][j] = k
```

**Validity condition** (Knuth's quadrangle inequality):
- **Monotonicity**: `w(b, c) ≤ w(a, d)` for `a ≤ b ≤ c ≤ d`.
- **Quadrangle inequality**: `w(a, c) + w(b, d) ≤ w(a, d) + w(b, c)` for `a ≤ b ≤ c ≤ d`.

If both hold for the weight function `w`, the monotonicity of `opt` follows and Knuth's optimization applies.

Common `w` functions that satisfy these: sum of a prefix-sum range, `(j - i)^2`, `(j - i) · max(arr[i..j])`.

## complexity
- **Time**: O(n^2) — a sum-telescope argument.
- **Space**: O(n^2) for `dp` + `opt`.
- **Speedup over naive**: factor of n (a lot at n = 1000).

## pitfalls
- **Quadrangle inequality not satisfied**: Knuth's optimization gives wrong answers. Always verify empirically on small input.
- **Off-by-one in opt window**: range is `[opt[i][j-1], opt[i+1][j]]` inclusive. Get the bounds right.
- **Confusing with D&C optimization**: D&C optimization works on `dp[i][j] = min over k of (dp[i-1][k] + cost(k, j))`. Knuth's works on interval `dp[i][j]` with two indices both moving.
- **Trivial DP that doesn't fit**: many recurrences look similar but don't have monotone `opt`. Test before assuming.

## interviewTips
- The trigger: "interval DP with O(n^3) recurrence and you need to drop a factor of n" — Knuth.
- Mention the **quadrangle inequality** by name for validity.
- Compare with **D&C DP optimization** (separate concept), which targets a different shape.
- For senior interviews, mention SMAWK algorithm as the most general extension.

## code.python
```python
def knuth_opt_chain(n, w):
    """w(i, j) = weight when splitting interval [i, j]. n = number of items."""
    INF = float('inf')
    dp = [[0]*(n+1) for _ in range(n+1)]
    opt = [[0]*(n+1) for _ in range(n+1)]
    for i in range(n):
        opt[i][i+1] = i

    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length
            dp[i][j] = INF
            for k in range(opt[i][j-1], opt[i+1][j] + 1 if i+1 <= n else opt[i][j-1] + 1):
                cost = dp[i][k] + dp[k+1][j] + w(i, j)
                if cost < dp[i][j]:
                    dp[i][j] = cost
                    opt[i][j] = k
    return dp[0][n]
```

## code.javascript
```javascript
// Sketch — translates directly from Python. Care needed on the opt[i+1][j]
// bound when i+1 > n; clamp before indexing.
function knuthOpt(n, w) {
  const dp = Array.from({length: n+1}, () => new Array(n+1).fill(0));
  const opt = Array.from({length: n+1}, () => new Array(n+1).fill(0));
  for (let i = 0; i < n; i++) opt[i][i+1] = i;
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len <= n; i++) {
      const j = i + len;
      dp[i][j] = Infinity;
      const hi = i + 1 <= n ? opt[i+1][j] : n;
      for (let k = opt[i][j-1]; k <= hi; k++) {
        const cost = dp[i][k] + dp[k+1][j] + w(i, j);
        if (cost < dp[i][j]) { dp[i][j] = cost; opt[i][j] = k; }
      }
    }
  }
  return dp[0][n];
}
```

## code.java
```java
class KnuthOpt {
    public long solve(int n, java.util.function.IntBinaryOperator w) {
        final long INF = Long.MAX_VALUE / 4;
        long[][] dp = new long[n+1][n+1];
        int[][] opt = new int[n+1][n+1];
        for (int i = 0; i < n; i++) opt[i][i+1] = i;
        for (int len = 2; len <= n; len++) {
            for (int i = 0; i + len <= n; i++) {
                int j = i + len;
                dp[i][j] = INF;
                int hi = i + 1 <= n ? opt[i+1][j] : n;
                for (int k = opt[i][j-1]; k <= hi; k++) {
                    long cost = dp[i][k] + dp[k+1][j] + w.applyAsInt(i, j);
                    if (cost < dp[i][j]) { dp[i][j] = cost; opt[i][j] = k; }
                }
            }
        }
        return dp[0][n];
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <climits>
#include <functional>
long long knuthOpt(int n, std::function<long long(int,int)> w) {
    const long long INF = LLONG_MAX / 4;
    std::vector<std::vector<long long>> dp(n+1, std::vector<long long>(n+1, 0));
    std::vector<std::vector<int>> opt(n+1, std::vector<int>(n+1, 0));
    for (int i = 0; i < n; i++) opt[i][i+1] = i;
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len <= n; i++) {
            int j = i + len;
            dp[i][j] = INF;
            int hi = i + 1 <= n ? opt[i+1][j] : n;
            for (int k = opt[i][j-1]; k <= hi; k++) {
                long long cost = dp[i][k] + dp[k+1][j] + w(i, j);
                if (cost < dp[i][j]) { dp[i][j] = cost; opt[i][j] = k; }
            }
        }
    }
    return dp[0][n];
}
```
