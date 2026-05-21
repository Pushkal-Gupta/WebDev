---
slug: zero-one-knapsack
module: dp
title: 0/1 Knapsack
subtitle: Pick items with weights and values to maximize value under a weight cap.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
status: published
---

## intro
You have N items, each with a weight `w[i]` and a value `v[i]`, and a knapsack with capacity `W`. You can either take or skip each item — no fractions. Maximize total value while staying within W.

This is the prototype DP problem for the "subset selection with a constraint" family. Master it and partition equal subset sum, target sum, subset count, change-making (when items are unique), and many "can we hit exactly X" puzzles fall out as variants.

## whyItMatters
Pseudo-polynomial DP that solves a problem with exponentially many subsets — `2ⁿ` possible packings — in `O(n·W)` time. The technique generalizes to nearly every "include this or skip this, subject to a budget" optimization in combinatorial problems and competitive programming.

## intuition
For each item, decide: skip it (don't change the state) or take it (add `v[i]` value, consume `w[i]` capacity). Recurrence:

```
dp[i][c] = max(
    dp[i-1][c],                              // skip item i
    dp[i-1][c - w[i]] + v[i]   if c >= w[i]  // take item i
)
```

`dp[N][W]` is the answer. We have `N·W` subproblems, each computed in O(1) → O(N·W) total.

## visualization
Items: (w=2, v=3), (w=3, v=4), (w=4, v=5). Capacity W=5.

|        | c=0 | c=1 | c=2 | c=3 | c=4 | c=5 |
|--------|-----|-----|-----|-----|-----|-----|
| 0 items| 0   | 0   | 0   | 0   | 0   | 0   |
| +item 1| 0   | 0   | 3   | 3   | 3   | 3   |
| +item 2| 0   | 0   | 3   | 4   | 4   | **7** |
| +item 3| 0   | 0   | 3   | 4   | 5   | **7** |

Best at c=5 is 7 (items 1 + 2).

## bruteForce
Enumerate all 2ⁿ subsets, filter to those with weight ≤ W, take the max value. `O(2ⁿ)`. Useless for n > 25.

Recursive without memoization: `T(n, c) = T(n-1, c) + T(n-1, c-w[i])` — same exponential explosion. Memoize and it collapses to the DP table.

## optimal
**Tabulation**, row by row, with the recurrence above. Memory `O(N·W)`.

**1D space optimization:** since `dp[i][*]` only reads `dp[i-1][*]`, keep a single 1D array `dp[W+1]` and iterate `c` *from W down to w[i]* on each item. The reverse direction prevents re-using the same item (which would be unbounded knapsack — a different problem). Memory drops to `O(W)`.

To reconstruct *which* items were picked, you need either the full 2D table or a parallel "did I take item i at capacity c?" boolean array. The space-optimized version can't reconstruct without auxiliary tracking.

## complexity
time: O(N · W) — pseudo-polynomial in W (a 10-digit W blows up).
space: O(N · W) for full table, O(W) with the 1D optimization.
notes: When `W` is very large but item values are small, swap the roles: DP over total value instead — `dp[i][v] = min capacity to reach value v` — and check the largest `v` with `dp[N][v] ≤ W`. Picks the smaller of the two dimensions as the DP axis.

## pitfalls
- **Forward iteration in 1D** would double-count items (turns 0/1 into unbounded knapsack). Always iterate `c` from W down to `w[i]`.
- Off-by-one between `dp[N][W]` indexing and item indexing — pick a convention (`items[0..N-1]`, `dp[0..N][0..W]`) and stick to it.
- Real numbers as weights or values → can't index a 2D table by weight. Either scale to integers or switch to "DP over value, return min weight."
- Returning the *items chosen* without reconstruction logic — easy to forget in interviews when they push for the actual packing.

## interviewTips
- Always state the two-choice recurrence upfront — interviewers want to hear "for each item, take or skip" before code.
- Mention pseudo-polynomial: O(N·W) feels polynomial but is exponential in the bit-length of W.
- The 1D optimization is the standard "did you optimize?" follow-up. Memorize the reverse-iteration trick.
- Adjacent problems to recognize: subset sum, partition into equal subsets, target sum, count of subsets summing to K. All same recurrence, slightly different aggregation.

## code.python
```python
def knapsack(weights, values, W):
    n = len(weights)
    dp = [0] * (W + 1)
    for i in range(n):
        w, v = weights[i], values[i]
        for c in range(W, w - 1, -1):  # reverse → 0/1 not unbounded
            if dp[c - w] + v > dp[c]:
                dp[c] = dp[c - w] + v
    return dp[W]
```

## code.javascript
```javascript
function knapsack(weights, values, W) {
  const n = weights.length;
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < n; i++) {
    const w = weights[i], v = values[i];
    for (let c = W; c >= w; c--) {
      if (dp[c - w] + v > dp[c]) dp[c] = dp[c - w] + v;
    }
  }
  return dp[W];
}
```

## code.java
```java
public int knapsack(int[] weights, int[] values, int W) {
    int[] dp = new int[W + 1];
    for (int i = 0; i < weights.length; i++) {
        int w = weights[i], v = values[i];
        for (int c = W; c >= w; c--) {
            dp[c] = Math.max(dp[c], dp[c - w] + v);
        }
    }
    return dp[W];
}
```

## code.cpp
```cpp
int knapsack(vector<int>& weights, vector<int>& values, int W) {
    vector<int> dp(W + 1, 0);
    for (size_t i = 0; i < weights.size(); i++) {
        int w = weights[i], v = values[i];
        for (int c = W; c >= w; c--) {
            dp[c] = max(dp[c], dp[c - w] + v);
        }
    }
    return dp[W];
}
```
