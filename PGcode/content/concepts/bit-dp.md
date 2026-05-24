---
slug: bit-dp
module: dp
title: Bitmask DP
subtitle: Encode a subset of up to ~20 elements as a bitmask, then DP over bitmasks for problems with exponential state space made tractable.
difficulty: Advanced
position: 17
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
When a DP state needs to track "which subset of n elements have I used so far?", you can represent the subset as an **n-bit bitmask** and index into a `2^n`-sized DP table. The technique is **bitmask DP** (also "DP over subsets"). For n ≤ ~20, the 2^n states fit in memory and let you solve problems that look hopeless under pure recursion.

## whyItMatters
Powers a family of classic problems that are NP-hard in general but **pseudo-polynomial when n is small**:
- **Traveling Salesman Problem** (Held-Karp): O(n² · 2^n) instead of O(n!).
- **Assignment problem** (workers → jobs): O(n · 2^n).
- **Hamiltonian paths in a small graph**.
- **Subset sum / subset product** with constraints.
- **Tile / cover problems** on small grids.

For n = 20, 2^20 = ~10^6 states. Times O(n) per state = 2 × 10^7 ops — fits comfortably in a one-second budget.

## intuition
Each bit position represents one element. Bit i set ↔ element i is in the current set. State `dp[mask]` (or `dp[mask][i]`) answers "best result starting from this subset (with last-visited element i)." Transitions iterate over which element to add or remove next, each O(n).

Common bit operations:
- `mask & (1 << i)` — is element i in the set?
- `mask | (1 << i)` — add element i.
- `mask ^ (1 << i)` — toggle element i.
- `mask & (mask - 1)` — drop lowest set bit (for iterating set elements).
- `bin(mask).count('1')` / `__builtin_popcount(mask)` — set size.

## visualization
```
TSP, n=4 cities. State = (visited mask, current city).
Total states: 2^4 · 4 = 64. From dp[0001][0] = 0 (start at city 0):
  → dp[0011][1] = dist(0, 1) when we go to city 1
  → dp[0101][2] = dist(0, 2) when we go to city 2
  → dp[1001][3] = dist(0, 3) when we go to city 3
Build up dp[mask][i] for all masks including bit 0, gradually adding cities.
Answer = min(dp[1111][i] + dist(i, 0)) over all i.
```

## bruteForce
Enumerate all permutations / combinations. O(n!) — fine for n ≤ 8, dies at n = 12. Bitmask DP collapses overlapping subproblems and gets you to n ≈ 20.

## optimal
**Held-Karp (TSP)**:
```
dp[1][0] = 0                            # start at city 0
for mask in range(1, 1 << n):
    if not (mask & 1): continue         # must include city 0
    for i in range(n):
        if not (mask & (1 << i)): continue
        prev_mask = mask ^ (1 << i)
        if prev_mask == 0: continue
        for j in range(n):
            if not (prev_mask & (1 << j)): continue
            dp[mask][i] = min(dp[mask][i], dp[prev_mask][j] + dist[j][i])
return min(dp[(1 << n) - 1][i] + dist[i][0] for i in range(1, n))
```

**Subset iteration** (iterate all subsets of a mask, in O(3^n) total):
```
sub = mask
while sub > 0:
    # process subset `sub` of `mask`
    sub = (sub - 1) & mask
```
This pattern shows up in problems like "partition the set into two subsets minimizing some cost."

**Popcount tricks**: precompute popcount for all masks if you need set size often: `popcount[mask] = popcount[mask >> 1] + (mask & 1)`.

## complexity
- **Time**: O(2^n · n) for most bitmask DPs; O(3^n) when iterating sub-subsets.
- **Space**: O(2^n · n) for the table; O(2^n) for problems that need only a mask, not (mask, position).
- **Practical n cap**: 20 with float DP (8MB), 22 with int8 DP. Beyond that, you need branch-and-bound or randomization.

## pitfalls
- **Mask not including starting element**: many problems implicitly fix one element. Forgetting to OR it into the initial mask gives wrong base case.
- **Iteration order**: outer loop on `mask` ascending guarantees you read smaller-popcount masks first. Sometimes you want descending — depends on transition.
- **Off-by-one with `(1 << n)` vs `(1 << n) - 1`**: full mask is the latter.
- **64-bit masks**: for n ≥ 32 in languages without 64-bit `int`, use `long long` / `BigInt`.
- **Confusing bitmask DP with bit-DP** (digit DP) — different technique.

## interviewTips
- The trigger: "n ≤ 20, need to track which subset I've used" — bitmask DP.
- Mention **Held-Karp** by name for TSP-style problems — interviewers appreciate the historical hook.
- Walk through the bit operations on paper before coding; off-by-one bit errors are common under time pressure.
- For senior interviews, mention **profile DP** (a 2D bitmask variant for tile / cover problems on n × m grids where one dimension is tiny).

## code.python
```python
def tsp(dist):
    n = len(dist)
    INF = float('inf')
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0
    for mask in range(1, 1 << n):
        if not (mask & 1): continue
        for i in range(n):
            if not (mask & (1 << i)) or dp[mask][i] == INF: continue
            for j in range(n):
                if mask & (1 << j): continue
                nm = mask | (1 << j)
                if dp[mask][i] + dist[i][j] < dp[nm][j]:
                    dp[nm][j] = dp[mask][i] + dist[i][j]
    full = (1 << n) - 1
    return min(dp[full][i] + dist[i][0] for i in range(1, n))

dist = [[0, 10, 15, 20], [10, 0, 35, 25], [15, 35, 0, 30], [20, 25, 30, 0]]
print(tsp(dist))     # 80
```

## code.javascript
```javascript
function tsp(dist) {
  const n = dist.length;
  const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(Infinity));
  dp[1][0] = 0;
  for (let mask = 1; mask < (1 << n); mask++) {
    if (!(mask & 1)) continue;
    for (let i = 0; i < n; i++) {
      if (!(mask & (1 << i)) || dp[mask][i] === Infinity) continue;
      for (let j = 0; j < n; j++) {
        if (mask & (1 << j)) continue;
        const nm = mask | (1 << j);
        if (dp[mask][i] + dist[i][j] < dp[nm][j]) dp[nm][j] = dp[mask][i] + dist[i][j];
      }
    }
  }
  const full = (1 << n) - 1;
  let best = Infinity;
  for (let i = 1; i < n; i++) best = Math.min(best, dp[full][i] + dist[i][0]);
  return best;
}
```

## code.java
```java
class TSP {
    public int tsp(int[][] dist) {
        int n = dist.length;
        final int INF = Integer.MAX_VALUE / 2;
        int[][] dp = new int[1 << n][n];
        for (int[] row : dp) java.util.Arrays.fill(row, INF);
        dp[1][0] = 0;
        for (int mask = 1; mask < (1 << n); mask++) {
            if ((mask & 1) == 0) continue;
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) == 0 || dp[mask][i] == INF) continue;
                for (int j = 0; j < n; j++) {
                    if ((mask & (1 << j)) != 0) continue;
                    int nm = mask | (1 << j);
                    int c = dp[mask][i] + dist[i][j];
                    if (c < dp[nm][j]) dp[nm][j] = c;
                }
            }
        }
        int best = INF;
        for (int i = 1; i < n; i++) best = Math.min(best, dp[(1 << n) - 1][i] + dist[i][0]);
        return best;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <climits>
int tsp(const std::vector<std::vector<int>>& dist) {
    int n = dist.size();
    const int INF = INT_MAX / 2;
    std::vector<std::vector<int>> dp(1 << n, std::vector<int>(n, INF));
    dp[1][0] = 0;
    for (int mask = 1; mask < (1 << n); mask++) {
        if (!(mask & 1)) continue;
        for (int i = 0; i < n; i++) {
            if (!(mask & (1 << i)) || dp[mask][i] == INF) continue;
            for (int j = 0; j < n; j++) {
                if (mask & (1 << j)) continue;
                int nm = mask | (1 << j);
                int c = dp[mask][i] + dist[i][j];
                if (c < dp[nm][j]) dp[nm][j] = c;
            }
        }
    }
    int best = INF;
    for (int i = 1; i < n; i++) best = std::min(best, dp[(1 << n) - 1][i] + dist[i][0]);
    return best;
}
```
