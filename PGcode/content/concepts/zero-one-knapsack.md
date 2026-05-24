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

Two things make this work:
1. **Optimal substructure.** The best packing of items {1..i} with capacity c is built from the best packing of items {1..i-1} with either capacity c (we skipped item i) or capacity c - w[i] (we took it). The "decision boundary" is item i alone.
2. **No overlap conflict.** Because we only look back at `dp[i-1][*]`, item i can be taken at most once — that is what makes this 0/1 (not unbounded).

The 1D rolling array works because reading right-to-left across `c` guarantees the value at `dp[c - w[i]]` is still from "row i-1" when we use it. Left-to-right would already have been overwritten for the current row, causing accidental re-use of item i.

## walkthroughExample
Items (1-indexed): item1 (w=2, v=3), item2 (w=3, v=4), item3 (w=4, v=5). Capacity W=5.

Build the 2D table dp[i][c] from the recurrence. Row 0 is the empty knapsack — all zeros.

Step 1 — add item1 (w=2, v=3). For each c:
```
   c=0: cap < 2  -> skip only       -> dp[1][0] = max(0)             = 0
   c=1: cap < 2  -> skip only       -> dp[1][1] = max(0)             = 0
   c=2: take or skip                -> dp[1][2] = max(0, dp[0][0]+3) = 3
   c=3: take or skip                -> dp[1][3] = max(0, dp[0][1]+3) = 3
   c=4: take or skip                -> dp[1][4] = max(0, dp[0][2]+3) = 3
   c=5: take or skip                -> dp[1][5] = max(0, dp[0][3]+3) = 3
```

Step 2 — add item2 (w=3, v=4):
```
   c=0,1,2: cap < 3 -> dp[2][c] = dp[1][c]                          = 0,0,3
   c=3:  max(dp[1][3]=3,   dp[1][0]+4=4)  = 4
   c=4:  max(dp[1][4]=3,   dp[1][1]+4=4)  = 4
   c=5:  max(dp[1][5]=3,   dp[1][2]+4=7)  = 7    <- pick item1+item2
```

Step 3 — add item3 (w=4, v=5):
```
   c=0..3: cap < 4 -> dp[3][c] = dp[2][c]                  = 0,0,3,4
   c=4:  max(dp[2][4]=4,   dp[2][0]+5=5)  = 5
   c=5:  max(dp[2][5]=7,   dp[2][1]+5=5)  = 7    <- item1+item2 still wins
```

Final dp[3][5] = 7. Reconstruction by walking back from (i=3, c=5):
```
   (3,5):  dp[3][5]=7 == dp[2][5]=7   ->  SKIP item3,  move to (2,5)
   (2,5):  dp[2][5]=7 != dp[1][5]=3   ->  TAKE item2,  move to (1, 5-3=2)
   (1,2):  dp[1][2]=3 != dp[0][2]=0   ->  TAKE item1,  move to (0, 2-2=0)
   (0,0):  base case, stop
   chosen = { item1, item2 }   weight = 2+3 = 5,   value = 3+4 = 7
```

## visualization
Snapshot 1 — full DP table dp[i][c] for the worked example (rows = items added so far):
```
                c=0   c=1   c=2   c=3   c=4   c=5
   row 0 :       0     0     0     0     0     0
   row 1 :       0     0    [3]    3     3     3       <- after item1 (w=2,v=3)
   row 2 :       0     0     3    [4]    4    [7]      <- after item2 (w=3,v=4)
   row 3 :       0     0     3     4    [5]    7       <- after item3 (w=4,v=5)

   [x] = cell where TAKE beat SKIP this row
```

Snapshot 2 — arrows showing which cell each value depends on:
```
   dp[2][5] = 7  depends on:
                 dp[1][5] = 3     (skip)              <-- WORSE
                 dp[1][5-3] + 4 = dp[1][2] + 4 = 7    (take item2)   WINNER

      row 1:    [.., .., 3, .., .., 3]
                          \              ^
                           \             |  + v[2]=4
                            \------------|
      row 2:    [.., .., .., .., .., 7]
                                       ^
                                       answer
```

Snapshot 3 — 1D rolling array, why we iterate `c` from W down to w[i]:
```
   Before item2 (w=3, v=4):
     dp = [0, 0, 3, 3, 3, 3]
           0  1  2  3  4  5

   REVERSE iteration: c = 5, 4, 3
     c=5:  dp[5] = max(3, dp[2]+4=7)  =>  dp = [0,0,3,3,3,7]
     c=4:  dp[4] = max(3, dp[1]+4=4)  =>  dp = [0,0,3,3,4,7]
     c=3:  dp[3] = max(3, dp[0]+4=4)  =>  dp = [0,0,3,4,4,7]
   When we read dp[c-w], it has NOT yet been overwritten this round -> correct.

   FORWARD iteration (BUG, becomes unbounded knapsack):
     c=3:  dp[3] = max(3, dp[0]+4=4)  =>  dp[3] = 4
     c=4:  dp[4] = max(3, dp[1]+4=4)  =>  dp[4] = 4
     c=5:  dp[5] = max(3, dp[2]+4=7)  ... but dp[2] still 3 here, OK
     c=6 (if it existed): dp[6] = max(.., dp[3]+4=8) -> dp[3] was already
       updated this round, so item2 effectively gets TAKEN TWICE.
```

Snapshot 4 — recursion tree without memoization (exponential, 2^n leaves):
```
                       knap(3, 5)
                  take /         \ skip
                  knap(2, 1)      knap(2, 5)
                 /   \           /         \
            knap(1,1) knap(1,-2) knap(1,2)  knap(1,5)
              / \       INVALID    / \         / \
            ... ...               ... ...    ... ...

   Each node = (items remaining, capacity left).
   Many nodes repeat (e.g. knap(1,2) shows up via multiple paths) ->
   memoize and the tree collapses into the O(N*W) grid above.
```

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
