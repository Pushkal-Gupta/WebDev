---
slug: divide-conquer-optimization
module: dp-advanced
title: Divide & Conquer DP Optimization
subtitle: Reduce 1D DP from O(n·k) to O(n log n · k) when the optimal split point is monotonic across rows.
difficulty: Advanced
position: 19
estimatedReadMinutes: 7
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
Some DPs have the form `dp[i][j] = min over k of (dp[i-1][k] + cost(k, j))`. Naively, this is O(n²·k). When the **optimal split point** is **monotonic** — that is, `opt[i][j] ≤ opt[i][j+1]` — you can solve the row in O(n log n) via divide and conquer, dropping total cost to O(n log n · k).

## whyItMatters
A class of partition / segmentation DP problems collapse from O(n²·k) to O(n log n · k):
- **Optimal binary search trees** (Knuth's original).
- **Partition array into K pieces minimizing total cost.**
- **Posters / placement problems**.
- **Splitting strings into chunks** with non-linear cost.

For n = 5000, k = 100, n²·k = 2.5 × 10^9 (too slow); n log n · k = 6 × 10^6 (instant).

## intuition
Reframe it as a seating chart. Row i's answers `dp[i][0..n-1]` each choose a "best split point" k; picture those best k's as people who must sit in non-decreasing seat order — person j+1 never sits to the left of person j. That single promise (monotonicity) means once you've pinned where the *middle* person sits, everyone to their left is boxed into the seats on the left, everyone to their right into the seats on the right. You never re-search the whole row for anybody.

For fixed i, you're computing `dp[i][j]` for all j. The "optimal k" minimizing the recurrence varies with j. If we know `opt[i][j] ≤ opt[i][j+1]` (monotone), then when computing `dp[i][mid]` we can restrict the search for `opt[i][mid]` to `[opt_left, opt_right]` — and recurse left/right with appropriately-shrunk windows.

Divide and conquer with `solve(lo, hi, opt_lo, opt_hi)` that computes `dp[i][lo..hi]` knowing that all `opt[i][j]` lie in `[opt_lo, opt_hi]`. The total work telescopes to O(n log n) per row.

Concretely, take a row with n = 4 and suppose the true optima turn out to be `opt = [0, 1, 1, 3]`. Call `solve(0, 3, 0, 3)`: mid = 1, scan k over the full [0, 3], find `opt = 1`. Now the left call `solve(0, 0, 0, 1)` searches only k in [0, 1] for position 0, and the right call `solve(2, 3, 1, 3)` searches only [1, 3]. When that right call reaches position 3, its scan is capped at [1, 3] instead of the full [0, 3] — the monotone promise already ruled out every k < 1. Add up the scan lengths level by level: each level of the recursion touches at most O(n) candidate k's in total, and there are log n levels, so the row costs O(n log n) instead of the O(n²) a naive full scan per position would spend.

## visualization
```
For i = 2, computing dp[2][j] for j = 0..n-1.

solve(0, n-1, 0, n-1):
  mid = n/2
  Find opt[2][mid] by linear scan over [opt_lo=0, opt_hi=n-1].
  Say opt[2][mid] = m.
  Recurse:
    solve(0, mid-1, 0, m)       # opt[2][j<mid] is in [0, m] by monotonicity
    solve(mid+1, n-1, m, n-1)   # opt[2][j>mid] is in [m, n-1]
```

Each level processes n positions total; depth log n → O(n log n).

## bruteForce
Compute every `dp[i][j]` by iterating all k in O(n²·k) total. Correct but slow.

## optimal
```
def solve(i, lo, hi, opt_lo, opt_hi):
    if lo > hi: return
    mid = (lo + hi) // 2
    best, best_k = float('inf'), -1
    for k in range(opt_lo, min(mid, opt_hi) + 1):
        cur = dp[i-1][k] + cost(k, mid)
        if cur < best:
            best = cur
            best_k = k
    dp[i][mid] = best
    solve(i, lo, mid - 1, opt_lo, best_k)
    solve(i, mid + 1, hi, best_k, opt_hi)

for i in range(1, k_max + 1):
    solve(i, 0, n - 1, 0, n - 1)
```

The monotonicity condition `opt[i][j] ≤ opt[i][j+1]` is implied by **Knuth's inequality**: `cost(a, c) + cost(b, d) ≤ cost(a, d) + cost(b, c)` for `a ≤ b ≤ c ≤ d`. If your cost function satisfies this, D&C applies. Common cost functions: sum, weighted sum, x², |x|.

**Why it's correct.** `solve(i, lo, hi, opt_lo, opt_hi)` maintains the invariant that every optimal split for positions `lo..hi` lies inside `[opt_lo, opt_hi]`. It computes `dp[i][mid]` by an honest linear scan over that window — so `dp[i][mid]` is exactly optimal, never an approximation. It then passes `best_k` as the *upper* bound for the left half and the *lower* bound for the right half. Monotonicity (`opt[i][j] ≤ opt[i][j+1]`) guarantees those tightened windows still contain the true optima, so no correct split is ever excluded — only provably-irrelevant k values are pruned.

**The invariant and tradeoff.** You trade a wide-but-shallow search for a narrow-but-repeated one. Summed across one recursion level, the scanned windows overlap only at their endpoints, so the total scan length per level is O(n); with log n levels the row is O(n log n). The catch: this holds only when the cost function is monotone. Feed it a non-monotone cost and it silently returns wrong `dp` values — which is why you always validate Knuth's inequality (or brute-force cross-check on small inputs) before trusting the result.

**Step-by-step.** For row i, call `solve(i, i, n-1, 0, n-1)`. Compute the middle position by scanning its allowed k-window, record `best_k`, then recurse into the left sub-range with k capped at `best_k` and the right sub-range with k floored at `best_k`. The base case `lo > hi` returns immediately. After all `k_max` rows finish, `dp[k_max][n-1]` is the answer. Precompute any prefix sums the cost function needs so each `cost(k, j)` call stays O(1), otherwise the per-call cost multiplies straight through the whole bound.

## complexity
- **Time**: O(n log n) per row. With k rows: O(n · k · log n).
- **Space**: O(n · k) for the DP table; can sometimes reduce to O(n) by storing only the previous row.
- **Memoizing cost**: if cost is expensive (e.g., requires its own prefix sum), precompute outside.

## pitfalls
- **Monotonicity not guaranteed**: D&C optimization fails silently — gives wrong answers. Always verify the cost function satisfies Knuth's inequality (or empirically test against brute force on small inputs).
- **Off-by-one in the recursion bounds**: `solve(lo, mid-1, opt_lo, best_k)` (note `mid-1` and `best_k`).
- **Cost out of range**: if `cost(k, j)` is undefined for k > j, return ∞ from those entries.

## interviewTips
- The trigger: "partition into K pieces, n large, cost between segments cheap to compute, k ≤ n".
- Compare with **Knuth's optimization** (a different monotone condition, same family).
- For very senior interviews, mention **convex hull trick (Li Chao tree)** as another monotone-DP-acceleration tool.
- Walk through the monotonicity argument before coding — interviewers want to see that you verified it.

## code.python
```python
def solve_dp(n, k_max, cost):
    INF = float('inf')
    dp = [[INF] * n for _ in range(k_max + 1)]
    for j in range(n): dp[0][j] = cost(0, j)

    def solve(i, lo, hi, opt_lo, opt_hi):
        if lo > hi: return
        mid = (lo + hi) // 2
        best, best_k = INF, -1
        upper = min(mid - 1, opt_hi)
        for k in range(opt_lo, upper + 1):
            cur = dp[i - 1][k] + cost(k + 1, mid)
            if cur < best:
                best = cur; best_k = k
        dp[i][mid] = best
        solve(i, lo, mid - 1, opt_lo, best_k)
        solve(i, mid + 1, hi, best_k, opt_hi)

    for i in range(1, k_max + 1):
        solve(i, i, n - 1, 0, n - 1)
    return dp
```

## code.javascript
```javascript
// Sketch — translation of the Python version. Production code memoizes prefix sums for cost().
function solveDP(n, kMax, cost) {
  const INF = Infinity;
  const dp = Array.from({ length: kMax + 1 }, () => new Array(n).fill(INF));
  for (let j = 0; j < n; j++) dp[0][j] = cost(0, j);
  function solve(i, lo, hi, optLo, optHi) {
    if (lo > hi) return;
    const mid = (lo + hi) >> 1;
    let best = INF, bestK = -1;
    for (let k = optLo; k <= Math.min(mid - 1, optHi); k++) {
      const cur = dp[i - 1][k] + cost(k + 1, mid);
      if (cur < best) { best = cur; bestK = k; }
    }
    dp[i][mid] = best;
    solve(i, lo, mid - 1, optLo, bestK);
    solve(i, mid + 1, hi, bestK, optHi);
  }
  for (let i = 1; i <= kMax; i++) solve(i, i, n - 1, 0, n - 1);
  return dp;
}
```

## code.java
```java
class DCDP {
    long[][] dp;
    int n;
    java.util.function.IntBinaryOperator cost;
    void solve(int i, int lo, int hi, int optLo, int optHi) {
        if (lo > hi) return;
        int mid = (lo + hi) >>> 1;
        long best = Long.MAX_VALUE;
        int bestK = -1;
        int upper = Math.min(mid - 1, optHi);
        for (int k = optLo; k <= upper; k++) {
            long cur = dp[i - 1][k] + cost.applyAsInt(k + 1, mid);
            if (cur < best) { best = cur; bestK = k; }
        }
        dp[i][mid] = best;
        solve(i, lo, mid - 1, optLo, bestK);
        solve(i, mid + 1, hi, bestK, optHi);
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <climits>
#include <functional>
std::vector<std::vector<long long>> solveDP(int n, int kMax, std::function<long long(int,int)> cost) {
    const long long INF = LLONG_MAX / 4;
    std::vector<std::vector<long long>> dp(kMax + 1, std::vector<long long>(n, INF));
    for (int j = 0; j < n; j++) dp[0][j] = cost(0, j);
    auto solve = [&](auto& self, int i, int lo, int hi, int optLo, int optHi) -> void {
        if (lo > hi) return;
        int mid = (lo + hi) / 2;
        long long best = INF;
        int bestK = -1;
        int upper = std::min(mid - 1, optHi);
        for (int k = optLo; k <= upper; k++) {
            long long cur = dp[i - 1][k] + cost(k + 1, mid);
            if (cur < best) { best = cur; bestK = k; }
        }
        dp[i][mid] = best;
        self(self, i, lo, mid - 1, optLo, bestK);
        self(self, i, mid + 1, hi, bestK, optHi);
    };
    for (int i = 1; i <= kMax; i++) solve(solve, i, i, n - 1, 0, n - 1);
    return dp;
}
```
