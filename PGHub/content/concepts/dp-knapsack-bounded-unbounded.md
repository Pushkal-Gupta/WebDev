---
slug: dp-knapsack-bounded-unbounded
module: dp-classical
title: Bounded vs Unbounded Knapsack
subtitle: When each item can be used once vs unlimited times — same problem, opposite loop direction. The detail that breaks half of all knapsack interviews.
difficulty: Intermediate
position: 72
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Dynamic Programming (knapsack family)"
    url: "https://walkccc.me/CLRS/Chap15/"
    type: book
  - title: "cp-algorithms — Knapsack problem"
    url: "https://cp-algorithms.com/dynamic_programming/knapsack.html"
    type: blog
  - title: "TheAlgorithms/Python — Knapsack"
    url: "https://github.com/TheAlgorithms/Python/tree/master/dynamic_programming"
    type: repo
status: published
---

## intro
The knapsack family asks: given items with `(weight, value)` and a capacity `W`, maximize value. Two flavors:
- **0/1 (bounded) knapsack**: each item used **at most once**.
- **Unbounded knapsack** (coin-change style): each item used **any number of times**.

Same recurrence, *different loop order*. The mistake of running the wrong direction is a top-3 interview bug.

## whyItMatters
- Air cargo loading at FedEx, UPS, and DHL solves bounded knapsack (each parcel is a unique item) to maximize revenue per flight without exceeding container weight limits.
- Vending machine and bill-denomination dispensers (NCR, Diebold) use unbounded coin-change DP at every transaction to dispense exact change minimizing coin count.
- Cloud cost-optimization tools (AWS Compute Optimizer, GCP recommender) cast EC2/GCE instance selection as bounded knapsack when reserved-instance counts are fixed and unbounded when on-demand.
- LLVM's loop unroll and register-pressure heuristics solve small bounded knapsacks every compile cycle to pick instruction-schedule slots.
- Subset sum, coin change, partition equal subset sum, target sum, rod cutting, ribbon cutting — all map directly to bounded or unbounded knapsack. Recognize the type and the answer is 5 lines of correct DP; miss the loop-direction detail and the answer is silently wrong.

## intuition
Both bounded and unbounded knapsack share the relax-with-best-option recurrence: `dp[w] = max(dp[w], dp[w - weight_i] + value_i)`. The semantic difference between "use each item at most once" and "use each item unlimited times" is encoded entirely by the direction of the inner weight loop. Iterate weights ascending and `dp[w - weight_i]` may already include item i from earlier in this same pass — reuse is allowed, which is exactly unbounded knapsack. Iterate weights descending and `dp[w - weight_i]` always reflects the previous outer iteration (the row "before item i was considered") — no reuse, which is bounded 0/1 knapsack. This is one of the cleanest "loop order encodes semantics" examples in all of DP. The same algebraic recurrence produces two distinct algorithms depending on whether the in-place 1D update reads from the just-updated value or from the previous-row value. Picture the 2D table `dp[i][w]` filled row by row: bounded 0/1 wants `dp[i][w] = max(dp[i-1][w], dp[i-1][w - weight_i] + value_i)`, which is "the previous row." Compressing to 1D requires the descending sweep so writes never destroy reads. Unbounded wants `dp[i][w] = max(dp[i-1][w], dp[i][w - weight_i] + value_i)`, which is "the current row" — compressing to 1D requires the ascending sweep so writes from this iteration are visible. The compression is what makes both fit in O(W) space; the loop direction is what preserves the semantics. The deep skill is recognizing that DP loop ordering is not a stylistic choice but a load-bearing encoding of the recurrence's data dependencies.

## visualization
```
Items: [(w=1, v=1), (w=2, v=3), (w=3, v=4)]
Capacity W = 4

Bounded (each item at most once) — inner descending:
  Init dp = [0,0,0,0,0]   indices 0..4
  After item 1 (w=1,v=1) descending:
    dp[4..1] using dp[3..0]+1 → dp=[0,1,1,1,1]
  After item 2 (w=2,v=3):
    dp[4]=max(dp[4], dp[2]+3) = max(1, 1+3) = 4
    dp[3]=max(dp[3], dp[1]+3) = max(1, 1+3) = 4
    dp[2]=max(dp[2], dp[0]+3) = 3
                  dp=[0,1,3,4,4]
  After item 3 (w=3,v=4):
    dp[4]=max(dp[4], dp[1]+4)=max(4, 5)=5; dp[3]=max(4,4)=4
                  dp=[0,1,3,4,5]
  Answer: 5.

Unbounded (each item unlimited) — inner ascending:
  Init dp = [0,0,0,0,0]
  After item 1 (w=1,v=1) ascending:
    dp[1..4] = dp[0..3]+1 → dp=[0,1,2,3,4]   (item 1 used 4 times)
  After item 2 (w=2,v=3) ascending:
    dp[2]=max(2, dp[0]+3)=3; dp[3]=max(3, dp[1]+3)=4; dp[4]=max(4, dp[2]+3)=6
                  dp=[0,1,3,4,6]
  After item 3 (w=3,v=4) ascending:
    dp[3]=max(4, dp[0]+4)=4; dp[4]=max(6, dp[1]+4)=6
                  dp=[0,1,3,4,6]
  Answer: 6.
```

## bruteForce
**Recursive: for each item include/exclude**: O(2^N). Memoize → DP.

**3-state DP `dp[i][w]`** (item index × weight): correct but O(N×W) space. Compress to 1D.

## optimal
1D DP of size `W + 1`, with inner loop direction encoding bounded vs unbounded. Both variants are O(N * W) time and O(W) space — pseudo-polynomial (scales with W, not log W). Optimal under the Exponential Time Hypothesis for the general subset-sum-style decision; greedy works only on "canonical" coin systems and fails in general.

```python
def knapsack_01(items, W):
    """Bounded: each item at most once. Inner loop DESCENDING."""
    dp = [0] * (W + 1)
    for weight, value in items:
        # Descending: dp[w - weight] reflects the previous outer iteration
        # (the "row before item i was considered"), so each item is used at most once.
        for w in range(W, weight - 1, -1):
            dp[w] = max(dp[w], dp[w - weight] + value)
    return dp[W]

def knapsack_unbounded(items, W):
    """Unbounded: each item unlimited times. Inner loop ASCENDING."""
    dp = [0] * (W + 1)
    for weight, value in items:
        # Ascending: dp[w - weight] may already include the current item from
        # earlier in this same pass, allowing reuse.
        for w in range(weight, W + 1):
            dp[w] = max(dp[w], dp[w - weight] + value)
    return dp[W]
```

The descending range `range(W, weight - 1, -1)` is what prevents item i from contributing more than once in a single outer iteration — `dp[w - weight]` always reads a value from before this iteration started. The ascending range `range(weight, W + 1)` does the opposite — `dp[w - weight]` may have just been updated to include item i, which allows that item to contribute again. For coin-change min-count (unbounded variant), use `dp[w] = min(dp[w], dp[w - coin] + 1)` with `dp[0] = 0` and `dp[1..W] = infinity`. For coin-change ways-count, use `dp[w] += dp[w - coin]` ascending with `dp[0] = 1` and crucially with the *coin loop outer* — flipping loops counts permutations instead of combinations.

## complexity
- **Time:** O(N × W).
- **Space:** O(W) compressed; O(N × W) if you need backpointers to reconstruct chosen items.
- **Pseudo-polynomial**: scales with `W`, not log(W). For huge W use meet-in-the-middle (O(2^(N/2))) or branch-and-bound.

## pitfalls
- **Wrong loop direction**: ascending for bounded → reuses items → wrong. Descending for unbounded → blocks reuse → wrong.
- **Outer loop choice in "ways"**: outer = items → combinations; outer = weights → permutations. Easy to swap by accident.
- **Forgetting `dp[0] = 0`** (and `inf` elsewhere) for "min coins" variant.
- **Negative weights** break the DP — must be non-negative.
- **Capacity W not integer**: knapsack assumes integers; if floats, scale and round (lose precision) or use branch-and-bound.

## interviewTips
- Always state aloud "bounded vs unbounded" — interviewer knows the loop-direction gotcha.
- Cite the 1D space compression as the "real" implementation; 2D is correctness scaffold.
- For senior interviews, discuss **meet-in-the-middle**, **branch-and-bound**, **FPTAS** (approximation for huge W).

## code.python
```python
def knapsack_01(items, W):
    dp = [0] * (W + 1)
    for weight, value in items:
        for w in range(W, weight - 1, -1):     # descending
            dp[w] = max(dp[w], dp[w - weight] + value)
    return dp[W]

def knapsack_unbounded(items, W):
    dp = [0] * (W + 1)
    for weight, value in items:
        for w in range(weight, W + 1):         # ascending
            dp[w] = max(dp[w], dp[w - weight] + value)
    return dp[W]
```

## code.javascript
```javascript
function knapsack01(items, W) {
  const dp = new Array(W + 1).fill(0);
  for (const [weight, value] of items) {
    for (let w = W; w >= weight; w--)
      dp[w] = Math.max(dp[w], dp[w - weight] + value);
  }
  return dp[W];
}

function knapsackUnbounded(items, W) {
  const dp = new Array(W + 1).fill(0);
  for (const [weight, value] of items) {
    for (let w = weight; w <= W; w++)
      dp[w] = Math.max(dp[w], dp[w - weight] + value);
  }
  return dp[W];
}
```

## code.java
```java
static int knapsack01(int[][] items, int W) {
    int[] dp = new int[W + 1];
    for (int[] it : items)
        for (int w = W; w >= it[0]; w--)
            dp[w] = Math.max(dp[w], dp[w - it[0]] + it[1]);
    return dp[W];
}
static int knapsackUnbounded(int[][] items, int W) {
    int[] dp = new int[W + 1];
    for (int[] it : items)
        for (int w = it[0]; w <= W; w++)
            dp[w] = Math.max(dp[w], dp[w - it[0]] + it[1]);
    return dp[W];
}
```

## code.cpp
```cpp
int knapsack01(vector<pair<int,int>>& items, int W) {
    vector<int> dp(W + 1, 0);
    for (auto [wt, val] : items)
        for (int w = W; w >= wt; w--)
            dp[w] = max(dp[w], dp[w - wt] + val);
    return dp[W];
}
int knapsackUnbounded(vector<pair<int,int>>& items, int W) {
    vector<int> dp(W + 1, 0);
    for (auto [wt, val] : items)
        for (int w = wt; w <= W; w++)
            dp[w] = max(dp[w], dp[w - wt] + val);
    return dp[W];
}
```
