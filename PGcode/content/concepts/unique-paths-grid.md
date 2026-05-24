---
slug: unique-paths-grid
module: dp
title: Unique Paths in a Grid with Obstacles
subtitle: Count grid paths from top-left to bottom-right when some cells are blocked — classic 2D DP.
difficulty: Beginner
position: 3
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 15: Dynamic Programming"
    url: "https://walkccc.me/CLRS/Chap15/15.4/"
    type: book
  - title: "Unique paths in a grid with obstacles — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/unique-paths-in-a-grid-with-obstacles/"
    type: blog
  - title: "TheAlgorithms/Python — minimum_cost_path.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/minimum_cost_path.py"
    type: repo
status: published
---

## intro
Given an `m x n` grid where each cell is either open (0) or blocked (1), count distinct paths from the top-left to the bottom-right moving only right or down. The obstacle-free version has a closed-form binomial coefficient, but obstacles force a real DP because some cells become unreachable.

## whyItMatters
This is the gateway problem to 2D DP. Path-counting on grids underpins lattice problems, image-segmentation cost flows, and combinatorics on Young tableaux. Knowing both the binomial closed form *and* the DP recurrence shows interviewers you can switch tools based on the problem's structure.

## intuition
A cell is reached only from above or from the left. So the number of paths to `(i, j)` equals paths to `(i-1, j)` plus paths to `(i, j-1)` — unless `(i, j)` is blocked, in which case it contributes 0. The first row and column are 1s up to the first obstacle and 0s afterward, because there is exactly one way to walk along an edge but a block in the way kills every cell after it.

## visualization
For the grid `[[0,0,0],[0,1,0],[0,0,0]]` the DP fills as: row0 = `[1,1,1]`, row1 = `[1,0,1]` (the center is blocked, right cell = left+above = 0+1), row2 = `[1,1,2]`. Answer = 2 — and you can literally see them: down-down-right-right and right-right-down-down both avoid the middle.

## bruteForce
Recursive backtracking from `(0,0)` to `(m-1,n-1)`, branching into right and down. Without memoization this is exponential because the same sub-grids are explored many times. Adding memoization recovers the optimal O(m·n) — at which point you are just writing the DP top-down instead of bottom-up.

## optimal
Allocate `dp[m][n]`, set `dp[0][0] = 1 - obstacle[0][0]`, then fill row by row using `dp[i][j] = obstacle[i][j] ? 0 : (above + left)`. Space can be collapsed to a single row of size n, updated in place left-to-right: `dp[j] += dp[j-1]` (treating `dp[j]` as "above" and `dp[j-1]` as "left"). O(m·n) time, O(n) space.

## complexity
time: O(m·n)
space: O(n) with the 1D rolling array; O(m·n) for the readable 2D version.
notes: Each cell is visited once and does O(1) work. The path count can grow combinatorially fast — for large grids use 64-bit integers or modular arithmetic if the prompt asks for the count mod p.

## pitfalls
- Forgetting that a blocked start or end cell yields 0 — always guard the corners explicitly.
- Off-by-one when collapsing to 1D: the very first column of each row needs the obstacle check before the `+=`.
- Using `int` in C++/Java when the answer can overflow on 100x100 unblocked grids.
- Treating obstacles as walkable because you only checked the destination cell.

## interviewTips
- Mention the closed-form binomial answer for the obstacle-free case — it shows breadth.
- Volunteer the 1D space optimization unprompted; it's the most common follow-up.
- For a "diagonal moves allowed" variant, the recurrence just gains a third term `dp[i-1][j-1]`; flag this readiness.

## code.python
```python
def unique_paths_with_obstacles(grid):
    m, n = len(grid), len(grid[0])
    if grid[0][0] == 1 or grid[m-1][n-1] == 1:
        return 0
    dp = [0] * n
    dp[0] = 1
    for i in range(m):
        for j in range(n):
            if grid[i][j] == 1:
                dp[j] = 0
            elif j > 0:
                dp[j] += dp[j-1]
    return dp[n-1]
```

## code.javascript
```javascript
function uniquePathsWithObstacles(grid) {
  const m = grid.length, n = grid[0].length;
  if (grid[0][0] === 1 || grid[m-1][n-1] === 1) return 0;
  const dp = new Array(n).fill(0);
  dp[0] = 1;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === 1) dp[j] = 0;
      else if (j > 0) dp[j] += dp[j-1];
    }
  }
  return dp[n-1];
}
```

## code.java
```java
public int uniquePathsWithObstacles(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    if (grid[0][0] == 1 || grid[m-1][n-1] == 1) return 0;
    int[] dp = new int[n];
    dp[0] = 1;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 1) dp[j] = 0;
            else if (j > 0) dp[j] += dp[j-1];
        }
    }
    return dp[n-1];
}
```

## code.cpp
```cpp
int uniquePathsWithObstacles(vector<vector<int>>& grid) {
    int m = grid.size(), n = grid[0].size();
    if (grid[0][0] == 1 || grid[m-1][n-1] == 1) return 0;
    vector<long long> dp(n, 0);
    dp[0] = 1;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 1) dp[j] = 0;
            else if (j > 0) dp[j] += dp[j-1];
        }
    }
    return (int)dp[n-1];
}
```
