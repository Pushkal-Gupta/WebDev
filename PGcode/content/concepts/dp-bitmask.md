---
slug: dp-bitmask
module: dp-advanced
title: Bitmask DP
subtitle: Encode a subset of up to 20 elements as an integer; iterate over all 2^n states.
difficulty: Advanced
position: 1
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Bitmask Dynamic Programming — cp-algorithms"
    url: "https://cp-algorithms.com/dynamic_programming/profile-dynamics.html"
    type: blog
  - title: "Travelling Salesman Problem using Dynamic Programming — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/travelling-salesman-problem-using-dynamic-programming/"
    type: blog
  - title: "KACTL — DP utilities"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/various/BumpAllocator.h"
    type: repo
status: published
---

## intro
Bitmask DP encodes a subset of a small universe (n at most 20 or so) as the bits of a single integer. The state is typically `dp[mask]` or `dp[mask][i]`, where `mask` records which elements have been used and `i` records the last decision. With 2^n masks and an inner loop of size n, you get O(2^n * n) or O(2^n * n^2), tractable up to n = 20.

## whyItMatters
- Held-Karp bitmask DP is the fastest known exact TSP solver — used by Concorde, OR-Tools, and the Uber routing pipeline as the final-mile optimizer on small clusters of stops.
- Apache Calcite and DuckDB query optimizers run bitmask DP to compute optimal join orders on small joins (the DPsize and DPccp algorithms), trading 2^n exploration for an optimal plan instead of greedy heuristics.
- Quantum-circuit synthesis tools (Qiskit, Cirq) use bitmask DP to find optimal gate orderings on small qubit sets where the synthesis problem is NP-hard but n is small.
- Computational biology — multiple sequence alignment with up to ~15 sequences uses bitmask DP over the visited-set of alignment columns.
- The canonical answer to "NP-hard on tiny inputs" — when n is at most 20, bitmask DP outruns every other exact technique by a wide margin.

## intuition
Many problems share a recurring structure: a fixed universe of n items, a decision at each step that consumes or visits exactly one item, and an objective that depends only on which items remain and which item was just chosen — not on the order earlier choices were made. The naive solver enumerates all n! orderings, which is hopeless for n > 12. The breakthrough is recognizing that the "ordering" carries far less information than it appears to. Most cost functions are order-independent given the visited set; they only need to know "which items are done" and possibly "what was the last choice." The visited set is what the bitmask records: bit i of mask is 1 iff item i has been processed. With n at most 20, the mask fits in a single integer and there are 2^n possible visited sets — vastly less than n!. The DP state becomes `dp[mask][last]` or just `dp[mask]`, depending on whether the transition depends on the last item. Transitions correspond to "add one more item to the visited set": from `dp[mask][i]`, you can move to `dp[mask | (1 << j)][j]` for any j not yet in mask. Iterating masks in increasing integer order ensures every subproblem is solved before it is read, because `mask | (1 << j) > mask`. The deep idea is that bitmask DP trades an n!-factor symmetry (permutations) for a 2^n-factor enumeration (subsets), which is dramatically better whenever the objective is permutation-invariant given the set. The Held-Karp algorithm for TSP is the canonical demonstration: O(n^2 * 2^n) beats O(n!) for every n above about 7.

## visualization
n = 4 cities. Mask = 1011 means cities 0, 1, 3 have been visited. dp[1011][3] = shortest tour visiting exactly {0,1,3} ending at city 3. Transition: dp[1011][3] = min over j in {0,1} of dp[1011 ^ (1 << 3)][j] + dist[j][3]. Final answer: min over last city j of dp[1111][j] + dist[j][0].

## bruteForce
Enumerate every permutation of the n elements and score it: n! work. At n = 12 that is already 479 million; at n = 15 it is 1.3 trillion. Acceptable only for n at most 10 or 11 in a contest.

## optimal
Held-Karp style DP for TSP. Define `dp[mask][i]` as the minimum cost of a sequence whose visited-set is `mask` and whose last element is i. Base case: `dp[(1<<0)][0] = 0` (start at city 0). Transition: for each mask, each i in mask, each j not in mask, `dp[mask | (1<<j)][j] = min(dp[mask | (1<<j)][j], dp[mask][i] + dist[i][j])`. Iterate masks in ascending integer order so that all predecessor states are filled first (this works because `mask | (1<<j) > mask`). Final answer: `min over i of dp[full][i] + dist[i][0]`. Time is O(2^n * n^2) and space is O(2^n * n) — optimal for general-cost TSP, since the Exponential Time Hypothesis rules out anything substantially faster.

```python
def tsp(dist):
    n = len(dist)
    INF = float("inf")
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0                                          # start at city 0
    for mask in range(1, 1 << n):
        if not (mask & 1):                                # require city 0 in mask
            continue
        for i in range(n):
            if not ((mask >> i) & 1) or dp[mask][i] == INF:
                continue
            for j in range(n):
                if (mask >> j) & 1:                       # skip already-visited
                    continue
                nm = mask | (1 << j)
                cand = dp[mask][i] + dist[i][j]
                if cand < dp[nm][j]:
                    dp[nm][j] = cand                      # relax to successor state
    full = (1 << n) - 1
    return min(dp[full][i] + dist[i][0] for i in range(1, n))
```

The ascending mask iteration is the load-bearing invariant — it guarantees that `dp[mask][i]` is final before any transition out of it fires. For assignment-style problems where the transition depends only on the visited set (not the last element), drop the second dimension and shave a factor of n in both time and memory. Submask iteration via `s = (s - 1) & mask` enumerates the 3^n total (mask, submask) pairs in time proportional to their count.

## complexity
time: O(2^n * n^2) for TSP-style transitions; O(2^n * n) for assignment-style
space: O(2^n * n) typical; O(2^n) when the last-element dimension is unneeded
notes: n = 20 means 20 * 4 = ~84M states * 20 transitions = 1.6B ops — borderline. Drop the `i` dimension when possible (e.g., assign-job-to-worker uses dp[mask] = best assignment cost for that subset).

## pitfalls
- Iterating masks in random order — subproblems must be solved before they are queried; ascending integer order works because mask | (1<<j) > mask.
- Forgetting `__builtin_popcount(mask) == people_assigned` invariants in assignment DPs — leads to mixing layers.
- Storing dp[mask][i] in 64-bit when 32-bit suffices, doubling memory for no reason at n = 20.
- Off-by-one in submask iteration: `for (int sub = mask; sub; sub = (sub - 1) & mask)` enumerates non-empty submasks; include the empty mask separately if needed.

## interviewTips
- Say the magic words: "n is small (at most 20), so 2^n fits — bitmask DP."
- Pre-compute `cost[i][j]` outside the DP loop; recomputing inside multiplies the constant by 10.
- For assignment problems, drop the last-element dimension — `dp[mask]` alone suffices and saves a factor of n in both time and memory.
- Mention the Held-Karp connection for TSP — interviewers love the historical hook.

## code.python
```python
import math

def tsp(dist):
    n = len(dist)
    INF = math.inf
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0
    for mask in range(1, 1 << n):
        if not (mask & 1):
            continue
        for i in range(n):
            if not (mask >> i) & 1 or dp[mask][i] == INF:
                continue
            for j in range(n):
                if (mask >> j) & 1:
                    continue
                nm = mask | (1 << j)
                cand = dp[mask][i] + dist[i][j]
                if cand < dp[nm][j]:
                    dp[nm][j] = cand
    full = (1 << n) - 1
    return min(dp[full][i] + dist[i][0] for i in range(1, n))
```

## code.javascript
```javascript
function tsp(dist) {
  const n = dist.length;
  const INF = Infinity;
  const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(INF));
  dp[1][0] = 0;
  for (let mask = 1; mask < (1 << n); mask++) {
    if (!(mask & 1)) continue;
    for (let i = 0; i < n; i++) {
      if (!((mask >> i) & 1) || dp[mask][i] === INF) continue;
      for (let j = 0; j < n; j++) {
        if ((mask >> j) & 1) continue;
        const nm = mask | (1 << j);
        const cand = dp[mask][i] + dist[i][j];
        if (cand < dp[nm][j]) dp[nm][j] = cand;
      }
    }
  }
  const full = (1 << n) - 1;
  let best = INF;
  for (let i = 1; i < n; i++) best = Math.min(best, dp[full][i] + dist[i][0]);
  return best;
}
```

## code.java
```java
public int tsp(int[][] dist) {
    int n = dist.length;
    int INF = Integer.MAX_VALUE / 2;
    int[][] dp = new int[1 << n][n];
    for (int[] row : dp) java.util.Arrays.fill(row, INF);
    dp[1][0] = 0;
    for (int mask = 1; mask < (1 << n); mask++) {
        if ((mask & 1) == 0) continue;
        for (int i = 0; i < n; i++) {
            if (((mask >> i) & 1) == 0 || dp[mask][i] >= INF) continue;
            for (int j = 0; j < n; j++) {
                if (((mask >> j) & 1) == 1) continue;
                int nm = mask | (1 << j);
                int cand = dp[mask][i] + dist[i][j];
                if (cand < dp[nm][j]) dp[nm][j] = cand;
            }
        }
    }
    int full = (1 << n) - 1, best = INF;
    for (int i = 1; i < n; i++) best = Math.min(best, dp[full][i] + dist[i][0]);
    return best;
}
```

## code.cpp
```cpp
int tsp(vector<vector<int>>& dist) {
    int n = dist.size();
    const int INF = 1e9;
    vector<vector<int>> dp(1 << n, vector<int>(n, INF));
    dp[1][0] = 0;
    for (int mask = 1; mask < (1 << n); ++mask) {
        if (!(mask & 1)) continue;
        for (int i = 0; i < n; ++i) {
            if (!((mask >> i) & 1) || dp[mask][i] >= INF) continue;
            for (int j = 0; j < n; ++j) {
                if ((mask >> j) & 1) continue;
                int nm = mask | (1 << j);
                int cand = dp[mask][i] + dist[i][j];
                if (cand < dp[nm][j]) dp[nm][j] = cand;
            }
        }
    }
    int full = (1 << n) - 1, best = INF;
    for (int i = 1; i < n; ++i) best = min(best, dp[full][i] + dist[i][0]);
    return best;
}
```
