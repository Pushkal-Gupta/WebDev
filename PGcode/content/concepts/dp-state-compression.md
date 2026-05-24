---
slug: dp-state-compression
module: dp
title: DP State Compression
subtitle: Many DPs only need O(1) or O(N) of the previous row — rolling arrays + bitmasks cut memory drastically.
difficulty: Intermediate
position: 22
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
Many DPs naively use a 2D table `dp[i][j]` of size O(n·m). If the recurrence reads only `dp[i-1][·]` and `dp[i][j-1]`, you don't need the full table — just the last row (or just two rows). Rolling arrays + bitmask state compression cut memory from O(n·m) to O(m) or even O(1) — sometimes enabling solutions that wouldn't fit in RAM.

## whyItMatters
Concrete wins:
- **Knapsack (0/1)** drops from O(n·W) to O(W) using a reverse-iteration trick.
- **Edit distance** drops from O(n·m) to O(min(n, m)).
- **LCS** same.
- **Tile / cover problems** with row state ≤ 2^m → O(2^m · n) instead of O(2^m · 2^m · n).
- **Subset-sum DPs** with packed bitset representation get a constant-factor speedup of 32-64×.

Memory savings unlock problems that wouldn't fit otherwise (n = m = 10^5 → 10^10 cells is impossible; one row = 10^5 ints = 400KB is trivial).

## intuition
If `dp[i]` only depends on `dp[i-1]`, you can store TWO rows (`prev`, `cur`) and swap. If it only depends on a few cells of `dp[i-1]`, you might get by with ONE row updated in place — but watch the iteration direction.

For the **0/1 knapsack** the trick is **iterate capacity from W down to 0** when processing each item — that way `dp[w - weight]` still refers to the OLD row (item not yet considered) when you compute `dp[w]`.

Same idea, smaller variant: when only a constant number of past `dp` values are needed (e.g. Fibonacci), keep just those — O(1) memory.

## visualization
```
Naive 0/1 knapsack (2D):
       w=0  1  2  3  4  5  6  7
item0   0   0  0  0  0  0  0  0
item1   0   0  0  3  3  3  3  3       (weight=3, value=3)
item2   0   0  4  4  4  7  7  7       (weight=2, value=4)
...

1D compressed (one row):
init dp[0..W] = 0
for each item (weight, value):
    for w in W downto weight:
        dp[w] = max(dp[w], dp[w-weight] + value)

After item1: [0,0,0,3,3,3,3,3]
After item2: [0,0,4,4,4,7,7,7]
```

## bruteForce
2D `dp[i][j]` table: easy to write, easy to debug. Use this when memory permits. For n·m ≤ 10^6 ish, just allocate the full table.

## optimal
**Rolling rows (LCS-style)**:
```
def lcs_compressed(a, b):
    if len(a) < len(b): a, b = b, a
    prev = [0] * (len(b) + 1)
    cur = [0] * (len(b) + 1)
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            cur[j] = prev[j-1] + 1 if a[i-1] == b[j-1] else max(prev[j], cur[j-1])
        prev, cur = cur, prev
    return prev[-1]
```

**In-place reverse iteration (0/1 knapsack)**:
```
def knapsack(weights, values, W):
    dp = [0] * (W + 1)
    for i in range(len(weights)):
        for w in range(W, weights[i] - 1, -1):    # reverse!
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    return dp[W]
```

**Bitmask state compression** — when each row state is a bitmask over m bits and m ≤ 20:
```
dp[i][mask] = best value at row i with this column-state mask
```
`dp` is O(n · 2^m). Use for tiling problems where each row's "profile" is a bitmask.

**Two-variable rolling** for Fibonacci-shaped recurrences: keep `a, b` and shift each step → O(1).

## complexity
- **Naive 2D**: O(n·m) time + space.
- **Rolling 1D**: O(n·m) time, O(m) space. No asymptotic time loss.
- **In-place 1D (knapsack)**: O(n·W) time, O(W) space.
- **Bitset trick on boolean subset-sum DPs**: O(n·W / 64) using a bitset shift.

## pitfalls
- **Wrong iteration order**: 0/1 knapsack reversing the loop matters. Forward iteration becomes unbounded knapsack.
- **Reusing `prev` after swap**: confusing variable names lead to off-by-one. Stick to two clearly-named rows.
- **Reconstructing the actual answer**: 1D compression loses the path. If you need the chosen items, keep a backpointer array OR do a 2D DP for reconstruction step only.
- **Bitmask DPs with m > 20**: 2^20 = 10^6 states is the practical ceiling.

## interviewTips
- Always state the naive 2D first, then offer the 1D rolling optimization. Interviewers love both.
- Reverse iteration for 0/1 knapsack is a canonical interview test — know it cold.
- For "DP with 64-bit subset sum" mention **bitset compression** (e.g. C++ `std::bitset`).
- For senior interviews, mention **broadword programming** (popcount, parallel bit ops on packed states) as the next-level compression.

## code.python
```python
def edit_distance(a, b):
    if len(a) < len(b): a, b = b, a
    prev = list(range(len(b) + 1))
    cur = [0] * (len(b) + 1)
    for i in range(1, len(a) + 1):
        cur[0] = i
        for j in range(1, len(b) + 1):
            cur[j] = prev[j-1] if a[i-1] == b[j-1] else 1 + min(prev[j], cur[j-1], prev[j-1])
        prev, cur = cur, prev
    return prev[-1]

def knapsack(weights, values, W):
    dp = [0] * (W + 1)
    for i, w in enumerate(weights):
        for c in range(W, w - 1, -1):
            dp[c] = max(dp[c], dp[c - w] + values[i])
    return dp[W]

print(edit_distance("kitten", "sitting"))    # 3
print(knapsack([2, 3, 4], [3, 4, 5], 5))      # 7
```

## code.javascript
```javascript
function knapsack(weights, values, W) {
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let c = W; c >= weights[i]; c--) {
      dp[c] = Math.max(dp[c], dp[c - weights[i]] + values[i]);
    }
  }
  return dp[W];
}
```

## code.java
```java
class Knapsack {
    public int solve(int[] w, int[] v, int W) {
        int[] dp = new int[W + 1];
        for (int i = 0; i < w.length; i++)
            for (int c = W; c >= w[i]; c--)
                dp[c] = Math.max(dp[c], dp[c - w[i]] + v[i]);
        return dp[W];
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
int knapsack(const std::vector<int>& w, const std::vector<int>& v, int W) {
    std::vector<int> dp(W + 1, 0);
    for (size_t i = 0; i < w.size(); i++)
        for (int c = W; c >= w[i]; c--)
            dp[c] = std::max(dp[c], dp[c - w[i]] + v[i]);
    return dp[W];
}
```
