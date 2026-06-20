#!/usr/bin/env node
// Build WAVE 35N: check-if-matrix-is-x-matrix + decrease-elements-to-make-array-zigzag
// Appends two RICH_CONTENT entries to src/content/problemContent.js using SAFE replace (function form).

import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve("src/content/problemContent.js");

function makeLcg(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

// ============================================================
// PROBLEM 1: check-if-matrix-is-x-matrix (LC 2319)
//   checkXMatrix(grid: int[][]) -> bool
//   Square matrix. X-matrix iff:
//     - Every element on the two main diagonals is non-zero.
//     - Every element NOT on a diagonal is zero.
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F36DA);

  function ref(grid) {
    const n = grid.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const onDiag = (i === j) || (i + j === n - 1);
        if (onDiag) {
          if (grid[i][j] === 0) return false;
        } else {
          if (grid[i][j] !== 0) return false;
        }
      }
    }
    return true;
  }

  // Helpers to build X-matrices of arbitrary size.
  function buildValidX(n, rnd) {
    const g = [];
    for (let i = 0; i < n; i++) {
      const row = new Array(n).fill(0);
      g.push(row);
    }
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const onDiag = (i === j) || (i + j === n - 1);
        if (onDiag) {
          // Random non-zero in [1..100] OR [-100..-1].
          const mag = 1 + (rnd() % 100);
          const sign = (rnd() % 2) === 0 ? 1 : -1;
          g[i][j] = sign * mag;
        }
      }
    }
    return g;
  }

  function corruptCell(g, i, j, val) {
    g[i][j] = val;
    return g;
  }

  const cases = [];

  // LC sample 1 (valid 5x5 X-matrix).
  cases.push([[
    [2, 0, 0, 1],
    [0, 3, 1, 0],
    [0, 5, 2, 0],
    [4, 0, 0, 2]
  ]]);
  // LC sample 2 (NOT an X-matrix — non-diagonal element non-zero).
  cases.push([[
    [5, 7, 0],
    [0, 3, 1],
    [0, 5, 0]
  ]]);
  // Tiny: 1x1, single cell, on both diagonals, must be non-zero.
  cases.push([[[7]]]);
  cases.push([[[0]]]); // invalid: diagonal is zero.
  // 2x2: every cell is on a diagonal, all four must be non-zero.
  cases.push([[
    [1, 2],
    [3, 4]
  ]]); // valid
  cases.push([[
    [0, 2],
    [3, 4]
  ]]); // invalid: (0,0) is on diagonal but zero
  cases.push([[
    [1, 0],
    [3, 4]
  ]]); // invalid: (0,1) is on anti-diagonal but zero
  cases.push([[
    [1, 2],
    [0, 4]
  ]]); // invalid: (1,0) on anti-diag zero
  cases.push([[
    [1, 2],
    [3, 0]
  ]]); // invalid: (1,1) on diag zero
  // 3x3 valid (center cell is on BOTH diagonals).
  cases.push([[
    [1, 0, 2],
    [0, 5, 0],
    [3, 0, 4]
  ]]);
  // 3x3 invalid: non-diagonal non-zero.
  cases.push([[
    [1, 9, 2],
    [0, 5, 0],
    [3, 0, 4]
  ]]);
  // 3x3 invalid: diagonal zero.
  cases.push([[
    [1, 0, 2],
    [0, 0, 0],
    [3, 0, 4]
  ]]);
  // 4x4 valid.
  cases.push([[
    [1, 0, 0, 2],
    [0, 3, 4, 0],
    [0, 5, 6, 0],
    [7, 0, 0, 8]
  ]]);
  // 4x4 invalid (corner non-diagonal cell non-zero).
  cases.push([[
    [1, 0, 9, 2],
    [0, 3, 4, 0],
    [0, 5, 6, 0],
    [7, 0, 0, 8]
  ]]);
  // 5x5 valid (proper X).
  cases.push([[
    [1, 0, 0, 0, 2],
    [0, 3, 0, 4, 0],
    [0, 0, 5, 0, 0],
    [0, 6, 0, 7, 0],
    [8, 0, 0, 0, 9]
  ]]);
  // 5x5 invalid (diagonal cell zero at center).
  cases.push([[
    [1, 0, 0, 0, 2],
    [0, 3, 0, 4, 0],
    [0, 0, 0, 0, 0],
    [0, 6, 0, 7, 0],
    [8, 0, 0, 0, 9]
  ]]);
  // 5x5 invalid (off-diagonal cell at (0,2) non-zero).
  cases.push([[
    [1, 0, 9, 0, 2],
    [0, 3, 0, 4, 0],
    [0, 0, 5, 0, 0],
    [0, 6, 0, 7, 0],
    [8, 0, 0, 0, 9]
  ]]);
  // Negative diagonal values OK (non-zero only).
  cases.push([[
    [-1, 0, 0, -2],
    [0, -3, -4, 0],
    [0, -5, -6, 0],
    [-7, 0, 0, -8]
  ]]);
  // Negative off-diagonal NOT zero -> invalid.
  cases.push([[
    [1, 0, -1, 2],
    [0, 3, 4, 0],
    [0, 5, 6, 0],
    [7, 0, 0, 8]
  ]]);
  // 6x6 valid.
  cases.push([[
    [1, 0, 0, 0, 0, 2],
    [0, 3, 0, 0, 4, 0],
    [0, 0, 5, 6, 0, 0],
    [0, 0, 7, 8, 0, 0],
    [0, 9, 0, 0, 1, 0],
    [2, 0, 0, 0, 0, 3]
  ]]);
  // 6x6 invalid: anti-diagonal cell (2,3) is on the anti-diagonal in a 6x6 (i+j=n-1=5),
  // so we corrupt a real off-diagonal: (0,2)=9.
  cases.push([[
    [1, 0, 9, 0, 0, 2],
    [0, 3, 0, 0, 4, 0],
    [0, 0, 5, 6, 0, 0],
    [0, 0, 7, 8, 0, 0],
    [0, 9, 0, 0, 1, 0],
    [2, 0, 0, 0, 0, 3]
  ]]);
  // 1x1 with negative.
  cases.push([[[-3]]]);

  // Random LCG cases: mix of valid and corrupted.
  while (cases.length < 30) {
    const n = 1 + (lcg() % 6); // 1..6
    const g = buildValidX(n, lcg);
    // 50% chance to corrupt one cell.
    if ((lcg() % 2) === 0) {
      // valid as-is
      cases.push([g]);
    } else {
      // corrupt: either zero a diagonal cell OR non-zero an off-diagonal cell.
      const i = lcg() % n;
      const j = lcg() % n;
      const onDiag = (i === j) || (i + j === n - 1);
      if (onDiag) {
        corruptCell(g, i, j, 0);
      } else {
        const v = 1 + (lcg() % 100);
        corruptCell(g, i, j, v);
      }
      cases.push([g]);
    }
  }

  const test_cases = cases.map(([grid]) => ({
    inputs: [JSON.stringify(grid)],
    expected: JSON.stringify(ref(grid))
  }));

  return {
    slug: "check-if-matrix-is-x-matrix",
    obj: {
      description: "A square matrix is said to be an **X-matrix** if BOTH of the following conditions hold:\n\n1. All the elements in the diagonals of the matrix are **non-zero**.\n2. All other elements are `0`.\n\nGiven a 2D integer array `grid` of size `n x n` representing a square matrix, return `true` **if `grid` is an X-matrix**. Otherwise, return `false`.\n\nA matrix has two diagonals — the **main diagonal** (cells `(i, i)`) and the **anti-diagonal** (cells `(i, n - 1 - i)`). A cell is 'on a diagonal' if it lies on either of these. For odd `n`, the center cell `((n-1)/2, (n-1)/2)` is on BOTH diagonals.\n\n**Example 1**\n\n```\nInput:  grid = [[2,0,0,1],[0,3,1,0],[0,5,2,0],[4,0,0,2]]\nOutput: true\nExplanation: All diagonal cells (2,3,2,4,1,5,1,2 on the two diagonals) are non-zero,\nand every cell off the diagonals is 0. Hence it is an X-matrix.\n```\n\n**Example 2**\n\n```\nInput:  grid = [[5,7,0],[0,3,1],[0,5,0]]\nOutput: false\nExplanation: Cell (0,1) is not on either diagonal but its value is 7, not 0. Fails condition 2.\n```\n\nThis is **LeetCode 2319**. The canonical solution is a **single O(N^2) double-loop** that, for each `(i, j)`, checks whether the cell is on a diagonal and verifies the corresponding constraint.",
      method_name: "checkXMatrix",
      params: [
        { name: "grid", type: "int[][]" }
      ],
      return_type: "bool",
      tags: ["array", "matrix"],
      pattern: "**Brute scan with a closed-form 'is on diagonal' predicate — single O(N^2) pass, O(1) extra space.**\n\n**The diagonal predicate.** A cell `(i, j)` in an `n x n` grid lies on the main diagonal iff `i == j` and on the anti-diagonal iff `i + j == n - 1`. The combined predicate is therefore `onDiag = (i == j) || (i + j == n - 1)`. For odd `n`, the center cell satisfies BOTH conjuncts simultaneously — it is on both diagonals; this is not a bug.\n\n**Algorithm.**\n\n```\nfor i in 0..n-1:\n    for j in 0..n-1:\n        onDiag = (i == j) or (i + j == n - 1)\n        if onDiag:\n            if grid[i][j] == 0: return False\n        else:\n            if grid[i][j] != 0: return False\nreturn True\n```\n\n**Early termination.** The first violation returns immediately. Average-case runtime is therefore often well under `n^2`; worst case is full `n^2` for valid X-matrices.\n\n**Worked example.** `grid = [[2,0,0,1],[0,3,1,0],[0,5,2,0],[4,0,0,2]]`, `n = 4`.\n\nDiagonal cells (i,j) with `i == j`: (0,0)=2, (1,1)=3, (2,2)=2, (3,3)=2. All non-zero — pass.\nAnti-diagonal cells (i,j) with `i+j == 3`: (0,3)=1, (1,2)=1, (2,1)=5, (3,0)=4. All non-zero — pass.\nOff-diagonal cells: every other cell. Inspect — all are 0. Pass.\n\nReturn `true`.\n\n**Why O(N^2) is tight.** A counter-example might hide in any single cell — the adversary can place ONE corrupting value anywhere. You cannot certify an X-matrix without inspecting every cell at least once. The lower bound is `Ω(N^2)`.\n\n**Brute-force baselines.**\n- **Two separate passes** (one to check diagonals are non-zero, another to check off-diagonals are zero): same O(N^2) but slightly less cache-friendly because you visit each cell twice.\n- **List comprehension / functional one-liner**: equivalent O(N^2); no efficiency change.\n\n**Why the closed-form predicate beats explicit diagonal indexing.** You COULD iterate only over the diagonal cells (2N - 1 cells, accounting for the shared center on odd n) and verify them separately, then iterate over all N^2 cells to verify the rest. Two-loop is more code with no asymptotic gain. The single combined loop is cleaner.\n\n**Edge cases.**\n- **`n = 1`**: the single cell is on BOTH diagonals; it must be non-zero. `[[0]]` → false. `[[k]]` for k≠0 → true.\n- **`n = 2`**: every cell is on a diagonal (corners are on main, anti-diagonals respectively, but also `i+j == 1` for the off-corners). For n=2, `(0,0)` is main; `(0,1)` has i+j=1=n-1, anti; `(1,0)` same, anti; `(1,1)` main. So ALL FOUR cells are on a diagonal — all must be non-zero. `[[1,2],[3,4]]` → true; any zero → false.\n- **Odd `n`, center cell is `0`**: center is on both diagonals; it's a diagonal cell that's zero → false.\n- **All zeros**: every diagonal cell is zero → fail on first diagonal cell → false.\n- **All non-zero**: every off-diagonal cell violates → fail on first off-diagonal cell → false (unless n ≤ 2 where every cell is on a diagonal).\n\n**Why this problem is interesting.** It is a clean exercise in (a) defining a geometric predicate algebraically and (b) recognizing that a square matrix's two diagonals together cover exactly `2n - 1` cells, leaving `n^2 - 2n + 1 = (n-1)^2` off-diagonal cells. Both diagonals must be checked for non-zero; every off-diagonal cell must be checked for zero. There's no shortcut.",
      follow_up: "**Variant 1 — what is the OFFENDING cell?** Return the first `(i, j)` that violates, or `(-1, -1)` if the matrix is a valid X. Same O(N^2).\n\n**Variant 2 — count violations.** Instead of early return, walk all cells and count both 'diagonal cells that are zero' and 'off-diagonal cells that are non-zero'. Same time, slightly different return shape.\n\n**Variant 3 — RECTANGULAR (non-square) input.** The problem becomes ill-defined — what is 'the diagonal' of a 3x5 matrix? Often interpreted as the SHORTER dimension; need to specify whether the 'anti-diagonal' is `i + j == k - 1` for some chosen `k`. Clarify before coding.\n\n**Variant 4 — generalize to a `+` matrix.** A `+` matrix has the middle row and middle column non-zero, everything else zero. Predicate: `onPlus = (i == n/2) || (j == n/2)`. Same shape, different geometry.\n\n**Variant 5 — generalize to ANY diagonal (offset).** A k-shifted diagonal is `j == i + k`. You could check whether a specific shifted diagonal pattern matches by parameterizing the predicate.\n\n**Variant 6 — sparse matrix representation.** If `grid` is given as a list of `(i, j, value)` triples (a CSR-like representation), the algorithm changes: ensure every triple's `(i, j)` is on a diagonal AND its value is non-zero, then verify the count of triples equals `2n - 1` for odd n (and `2n` for even n). Constant-time per triple but you need the sparse-representation invariant.\n\n**Variant 7 — return whether the matrix is a 'GENERALIZED X' (diagonals non-zero, no constraint on off-diagonal).** Drop the second check. Same O(N^2) but only one branch.\n\n**Implementation pitfalls.**\n1. **Forgetting `i + j == n - 1` (the anti-diagonal predicate).** Using `i == j` alone misses half the X shape.\n2. **Hard-coding `n` from `grid[0].length` when `grid.length == 0`.** Guard the empty matrix; LC constraints make this impossible (n ≥ 1) but defensive code is still good.\n3. **Mistaking `i + j == n` for the anti-diagonal predicate.** Off-by-one: should be `n - 1`.\n4. **Treating the center of an odd-n matrix as 'special'.** It naturally satisfies both diagonal predicates; the `||` short-circuits correctly.\n5. **Returning `true` without checking off-diagonal cells.** A common bug: validate only the 2n-1 diagonal cells and forget the (n-1)^2 off-diagonal cells must all be 0.\n6. **Using bitwise `|` instead of logical `||`.** Works for booleans in some languages but not all; prefer `||` for clarity.\n7. **Mutating `grid` in-place** (e.g., zeroing out diagonals after checking). Don't — leave the input unchanged.",
      complexity: {
        time: "**O(N^2)** where `N` is the side length. Every cell must be inspected once in the worst case (a valid X-matrix). Early termination on a violation can make average-case faster.",
        space: "**O(1)** auxiliary — only the loop indices and the diagonal predicate. The input grid is read-only.",
        notes: "The two-diagonal predicate is `(i == j) || (i + j == n - 1)`. For odd `n`, both conjuncts hold at the center; this is harmless.",
        optimal: "**O(N^2) time and O(1) space** is tight. A counter-example may hide in any single cell, so the input must be fully inspected."
      },
      constraints: [
        "n == grid.length == grid[i].length",
        "3 <= n <= 100 (general LC constraints; this solution also handles n=1,2)",
        "0 <= grid[i][j] <= 10^5 (LC range; the predicate is sign-agnostic so negatives work too)"
      ],
      hints: [
        "**Diagonal predicate**: a cell `(i, j)` is on a diagonal iff `(i == j) || (i + j == n - 1)`.",
        "**Single O(N^2) double-loop.** Inside, branch on the predicate and check the corresponding constraint.",
        "**Diagonal cells must be non-zero; off-diagonal cells must be exactly 0.** Both conditions must hold.",
        "**Early termination on the first violation** keeps average-case fast.",
        "**Odd n has a center cell on BOTH diagonals.** The `||` predicate handles this without special-case code.",
        "**The bound `i + j == n - 1` (not `n`) for the anti-diagonal** is the most common off-by-one bug."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\n\nclass Solution:\n    def checkXMatrix(self, grid: List[List[int]]) -> bool:\n        n = len(grid)\n        for i in range(n):\n            for j in range(n):\n                on_diag = (i == j) or (i + j == n - 1)\n                if on_diag:\n                    if grid[i][j] == 0:\n                        return False\n                else:\n                    if grid[i][j] != 0:\n                        return False\n        return True\n",
        javascript: "/**\n * @param {number[][]} grid\n * @return {boolean}\n */\nvar checkXMatrix = function(grid) {\n    const n = grid.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = 0; j < n; j++) {\n            const onDiag = (i === j) || (i + j === n - 1);\n            if (onDiag) {\n                if (grid[i][j] === 0) return false;\n            } else {\n                if (grid[i][j] !== 0) return false;\n            }\n        }\n    }\n    return true;\n};\n",
        java: "class Solution {\n    public boolean checkXMatrix(int[][] grid) {\n        int n = grid.length;\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < n; j++) {\n                boolean onDiag = (i == j) || (i + j == n - 1);\n                if (onDiag) {\n                    if (grid[i][j] == 0) return false;\n                } else {\n                    if (grid[i][j] != 0) return false;\n                }\n            }\n        }\n        return true;\n    }\n}\n",
        cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool checkXMatrix(vector<vector<int>>& grid) {\n        int n = (int) grid.size();\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < n; j++) {\n                bool onDiag = (i == j) || (i + j == n - 1);\n                if (onDiag) {\n                    if (grid[i][j] == 0) return false;\n                } else {\n                    if (grid[i][j] != 0) return false;\n                }\n            }\n        }\n        return true;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: decrease-elements-to-make-array-zigzag (LC 1144)
//   movesToMakeZigzag(nums: int[]) -> int
//   Two valid 'zigzag' shapes: (A) even-indexed are LOCAL MAX, odd are LOCAL MIN,
//   OR (B) odd-indexed are LOCAL MAX, even are LOCAL MIN.
//   For each shape, compute the minimum decreases required so that every chosen-to-be-LOCAL-MIN
//   index is strictly less than each neighbour. Return min of the two totals.
//
//   Standard reference impl:
//     For shape S (S in {0, 1}), iterate i over indices with i % 2 == S.
//     left = nums[i-1] if i > 0 else +inf
//     right = nums[i+1] if i < n-1 else +inf
//     need = max(0, nums[i] - min(left, right) + 1)
//     sum need across all such i.
//   Result = min(cost_S0, cost_S1).
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F36DB);

  function ref(nums) {
    const n = nums.length;
    const INF = Number.MAX_SAFE_INTEGER;
    let best = INF;
    for (let s = 0; s < 2; s++) {
      let cost = 0;
      for (let i = 0; i < n; i++) {
        if ((i % 2) !== s) continue;
        const left = (i > 0) ? nums[i - 1] : INF;
        const right = (i < n - 1) ? nums[i + 1] : INF;
        const bound = Math.min(left, right);
        const need = Math.max(0, nums[i] - bound + 1);
        cost += need;
      }
      if (cost < best) best = cost;
    }
    return best;
  }

  const cases = [];

  // LC sample 1: [1,2,3] -> 2
  cases.push([[1, 2, 3]]);
  // LC sample 2: [9,6,1,6,2] -> 4
  cases.push([[9, 6, 1, 6, 2]]);
  // Length 1 -> 0 (already zigzag).
  cases.push([[5]]);
  cases.push([[1]]);
  cases.push([[1000]]);
  // Length 2: [a, b]
  cases.push([[1, 2]]); // already zigzag in both shapes; 0
  cases.push([[2, 1]]); // already zigzag in both shapes; 0
  cases.push([[5, 5]]); // need to drop one by 1; min is 1
  // Strictly increasing 3
  cases.push([[1, 2, 3]]);
  // Strictly decreasing 3
  cases.push([[3, 2, 1]]);
  // All equal length 3
  cases.push([[4, 4, 4]]);
  // All equal length 4
  cases.push([[5, 5, 5, 5]]);
  // All equal length 5
  cases.push([[7, 7, 7, 7, 7]]);
  // Plateau with a peak
  cases.push([[1, 4, 1, 4, 1]]); // already shape-A zigzag; cost 0
  cases.push([[4, 1, 4, 1, 4]]); // already shape-B zigzag; cost 0
  // Reverse zigzag attempts
  cases.push([[1, 1, 1, 1, 1, 1]]);
  // Large variance
  cases.push([[10, 1, 10, 1, 10]]);
  cases.push([[1, 10, 1, 10, 1]]);
  // Mixed
  cases.push([[2, 7, 10, 9, 8, 9]]);
  cases.push([[7, 4, 8, 9, 7, 7, 5]]);
  // Edge: long increasing
  cases.push([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]);
  // Edge: long decreasing
  cases.push([[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]]);
  // Some zeros and big values (LC says nums[i] >= 1 but we test nonneg).
  cases.push([[1, 1, 1, 2, 2, 2, 1, 1, 1]]);
  // Already perfect shape-A on a length 6.
  cases.push([[1, 5, 2, 6, 3, 7]]); // not zigzag — check
  // Length 6 perfect shape-A
  cases.push([[5, 1, 5, 1, 5, 1]]);
  // Length 6 perfect shape-B
  cases.push([[1, 5, 1, 5, 1, 5]]);
  // Random spike pattern
  cases.push([[2, 1, 2, 1, 2, 1, 2, 1, 2]]);

  // Random LCG cases.
  while (cases.length < 35) {
    const n = 1 + (lcg() % 10); // 1..10
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push(1 + (lcg() % 100)); // 1..100
    }
    cases.push([arr]);
  }

  const test_cases = cases.map(([arr]) => ({
    inputs: [JSON.stringify(arr)],
    expected: JSON.stringify(ref(arr))
  }));

  return {
    slug: "decrease-elements-to-make-array-zigzag",
    obj: {
      description: "Given an array `nums` of integers, a move consists of choosing any element and **decreasing it by 1**.\n\nAn array `A` is a **zigzag array** if either:\n\n- Every even-indexed element is greater than its neighbours: `A[0] > A[1] < A[2] > A[3] < A[4] > ...`, OR\n- Every odd-indexed element is greater than its neighbours: `A[0] < A[1] > A[2] < A[3] > A[4] < ...`.\n\nReturn the **minimum number of moves** required to transform `nums` into a zigzag array.\n\n**Example 1**\n\n```\nInput:  nums = [1,2,3]\nOutput: 2\nExplanation: We can decrease 2 to 0 OR decrease 3 to 1 — neither is enough on its own.\nDecrease the middle element to 0: [1,0,3] is zigzag (1 > 0 < 3). Cost: 2.\nOr decrease nums[0] and nums[2] each by 1: [0,2,2] — not zigzag. So the answer is 2.\n```\n\n**Example 2**\n\n```\nInput:  nums = [9,6,1,6,2]\nOutput: 4\n```\n\nThis is **LeetCode 1144**. The canonical solution **tries both shapes** (even-indexed positions become local MINs, OR odd-indexed positions become local MINs) and for each shape computes the **minimum total decrease** such that every targeted local-min position is **strictly less than each of its neighbours**. Return the smaller of the two totals.",
      method_name: "movesToMakeZigzag",
      params: [
        { name: "nums", type: "int[]" }
      ],
      return_type: "int",
      tags: ["array", "greedy"],
      pattern: "**Try both zigzag shapes greedily — O(N) per shape, O(N) overall, O(1) space.**\n\n**The two shapes.** A 'zigzag' alternates strictly-greater and strictly-less between neighbours. There are exactly TWO valid alternation patterns for a 1-D array:\n\n- **Shape A** ('even-greater'): even-indexed positions are LOCAL MAXIMA (`A[0] > A[1] < A[2] > A[3] < ...`).\n- **Shape B** ('odd-greater'): odd-indexed positions are LOCAL MAXIMA (`A[0] < A[1] > A[2] < A[3] > ...`).\n\nIn Shape A, the LOCAL MIN positions are the odd-indexed ones. In Shape B, the LOCAL MIN positions are the even-indexed ones.\n\n**Key insight.** Moves can only DECREASE elements. So the LOCAL MAX positions are 'free' — we never need to touch them. We only need to decrease the LOCAL MIN positions enough that each one is strictly less than BOTH of its neighbours (the local maxes that already sit there, unchanged).\n\n**For each shape, the cost is independent per local-min position.** For a position `i` chosen to be a local min:\n\n```\nleft  = nums[i - 1] if i > 0 else +inf\nright = nums[i + 1] if i < n - 1 else +inf\nbound = min(left, right)\nneed  = max(0, nums[i] - bound + 1)   # decrease nums[i] to bound - 1\ncost += need\n```\n\nThe `+ 1` is the strict-less-than enforcer: to be strictly less than `bound`, we must drop to `bound - 1` or lower. If `nums[i]` is already smaller than `bound`, `need == 0`.\n\n**Why per-position is independent (the key greedy lemma).** We only DECREASE the local-min positions; the local-max positions are untouched. The local-max positions are the NEIGHBOURS of every local min, but local-max positions are NOT neighbours of each other (they alternate with local mins). So decreasing one local-min position cannot affect the bound of another local-min position. The total cost is just the SUM of independent per-position costs.\n\n**Worked example.** `nums = [9, 6, 1, 6, 2]`. Try both shapes:\n\n*Shape A* (odd-indexed are local mins): positions 1 and 3.\n- Position 1: `nums[1] = 6`, left = 9, right = 1, bound = 1. need = max(0, 6 - 1 + 1) = 6.\n- Position 3: `nums[3] = 6`, left = 1, right = 2, bound = 1. need = max(0, 6 - 1 + 1) = 6.\n- Total Shape A cost: 12.\n\n*Shape B* (even-indexed are local mins): positions 0, 2, 4.\n- Position 0: `nums[0] = 9`, left = +inf, right = 6, bound = 6. need = max(0, 9 - 6 + 1) = 4.\n- Position 2: `nums[2] = 1`, left = 6, right = 6, bound = 6. need = max(0, 1 - 6 + 1) = 0 (already less).\n- Position 4: `nums[4] = 2`, left = 6, right = +inf, bound = 6. need = max(0, 2 - 6 + 1) = 0.\n- Total Shape B cost: 4.\n\nReturn `min(12, 4) = 4`. Matches LC.\n\n**Algorithm.**\n\n```\nfor s in [0, 1]:                # s = parity of LOCAL MIN positions\n    cost_s = 0\n    for i in range(n):\n        if i % 2 != s: continue\n        left  = nums[i-1] if i > 0     else +inf\n        right = nums[i+1] if i < n - 1 else +inf\n        bound = min(left, right)\n        need  = max(0, nums[i] - bound + 1)\n        cost_s += need\nreturn min(cost_0, cost_1)\n```\n\n**Complexity.** Two linear passes (or one combined pass with two accumulators), O(N) time, O(1) extra space.\n\n**Why the +inf sentinel works.** When position `i` is at the boundary (`i == 0` or `i == n - 1`), it has only ONE neighbour. Using `+inf` as the missing-neighbour value makes `bound = min(real_neighbour, +inf) = real_neighbour`, which is exactly the desired behaviour.\n\n**Why we don't also consider INCREASING local maxes.** The problem disallows increases — moves only DECREASE. So the only way to make a local-min position satisfy its constraints is to drop ITS value below both neighbours.\n\n**Brute-force baselines.**\n- **BFS over all 'states' of `nums` decreasing one value at a time**: combinatorial explosion, completely infeasible.\n- **DP on (index, last_kept_value)**: works but has a huge state space (last_value can be 1..1000), and it's not even needed because the greedy per-position decomposition is exact.\n- **Try all 2^k combinations of which local-mins to 'drop'**: also infeasible.\n\nThe one-shot greedy is the clean answer — and the proof of optimality is direct (per-position independence).\n\n**Edge cases.**\n- **n = 1**: already zigzag trivially. Both shapes have zero local-min positions to drop. Return 0.\n- **n = 2**: each shape has exactly one local-min position. Compute cost for both and pick min. Often the answer is `max(0, min(a, b) - max(a, b) - 1)` style — but the general formula handles it correctly.\n- **All equal values**: every local-min position needs to drop to `value - 1`, costing 1 per position. The cheaper shape is the one with fewer local-min positions, i.e., the one whose parity has fewer indices.\n- **Already zigzag**: cost is 0 for one shape; the other may have nonzero cost; min is 0.\n\n**Common bugs.**\n1. **Forgetting `+ 1` in `need`.** Without it you only enforce `<=`, not strict `<`.\n2. **Trying to compute cost on local-MAX positions** (which would require increases, not allowed). The whole point is to only decrease local-mins.\n3. **Comparing the two shapes' costs at the END but using the SAME accumulator for both** — bug! Use two separate accumulators or reset between shapes.\n4. **Off-by-one in the boundary case** — using `0` instead of `+inf` for missing neighbour makes `bound = 0` and you'd 'need' to drop to -1, which never matches.",
      follow_up: "**Variant 1 — INCREASES allowed instead of decreases.** The dual problem: instead of dropping local-mins, raise local-maxes. The per-position cost becomes `max(0, max(left, right) - nums[i] + 1)`. Same shape, opposite operation.\n\n**Variant 2 — BOTH increases and decreases allowed, cost 1 per unit either way.** Now the per-position decision is harder: for each local-min position we drop, for each local-max position we may raise. Greedy still works because positions remain independent, but you have TWO independent decisions per neighbour-pair, not one. Sum them.\n\n**Variant 3 — minimize the maximum SINGLE move instead of total moves.** Now it's a min-max problem. Binary search on the answer: 'is it possible to achieve zigzag if no single move can drop a value by more than `k`?'.\n\n**Variant 4 — restricted: can only modify CERTAIN positions.** Greedy per-position decomposition still works but skips locked positions; if a locked position fails the constraint, return -1 (impossible).\n\n**Variant 5 — strictly-greater vs non-strictly-greater (`>` vs `>=`).** Drop the `+ 1` from `need`. Same shape.\n\n**Variant 6 — make the array 'wiggle' but allow choosing the alternation pattern (which positions are mins vs maxes can be ANY subset, not just by parity).** Now it becomes a much harder combinatorial problem; greedy fails and DP is needed.\n\n**Variant 7 — multi-step zigzag**: `A[i] > A[i+1] > A[i+2] < A[i+3] < A[i+4] > ...` (e.g., 'sawtooth' with longer arms). Different geometry; per-position independence no longer holds because changing one value affects multi-step constraints.\n\n**Implementation pitfalls.**\n1. **Treating the absent boundary neighbour as `0` instead of `+inf`.** Wrong bound; over-charges decreases.\n2. **Using the same loop pointer to alternate shapes.** Run two independent loops (or one loop with two accumulators).\n3. **Forgetting `max(0, ...)`** — negative `need` would inflate the cost in the wrong direction.\n4. **Greedy on local-MAXes** instead of local-mins. Only local-mins matter because moves are decreases.\n5. **Mixing up which shape has which local-min parity.** Shape A: odd indices are mins; Shape B: even indices are mins.\n6. **Returning the cost of one shape without comparing the other.** Always take `min`.\n7. **Integer overflow** in C++/Java when N is large and per-position cost is up to ~1000 — use `long` for the accumulator to be safe (LC says nums[i] ≤ 1000, n ≤ 1000, so max cost ≈ 10^6 which fits in int, but defensive long doesn't hurt).",
      complexity: {
        time: "**O(N)** — two linear passes over the array (one per shape), each touching every index a constant number of times.",
        space: "**O(1)** auxiliary — two integer accumulators and a few index variables. The input array is read-only.",
        notes: "Per-position independence is the key insight: decreasing a local-min position never changes the bound at another local-min position, because local-min positions are never neighbours of each other.",
        optimal: "**O(N) time and O(1) space** is tight — any algorithm must read every input element at least once to know its value."
      },
      constraints: [
        "1 <= nums.length <= 1000",
        "1 <= nums[i] <= 1000",
        "Only DECREASES are allowed (each move subtracts 1 from a chosen element)."
      ],
      hints: [
        "**Try both zigzag shapes** (even-indexed local maxes OR odd-indexed local maxes). Compute the cost for each.",
        "**Only local-MIN positions need to be modified** — moves are decreases, so we never raise a local max.",
        "**Per-position cost is independent** because local-min positions are never neighbours of each other.",
        "**For position `i` chosen as local min**: bound = min(left, right); need = max(0, nums[i] - bound + 1).",
        "**Use `+inf` for missing-neighbour bounds** at the boundaries (`i == 0` or `i == n - 1`).",
        "**Return the minimum of the two shape costs.** Don't forget the strict-less-than `+ 1`."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\nimport math\n\n\nclass Solution:\n    def movesToMakeZigzag(self, nums: List[int]) -> int:\n        n = len(nums)\n        INF = math.inf\n        best = INF\n        for s in (0, 1):\n            cost = 0\n            for i in range(n):\n                if i % 2 != s:\n                    continue\n                left = nums[i - 1] if i > 0 else INF\n                right = nums[i + 1] if i < n - 1 else INF\n                bound = min(left, right)\n                need = max(0, nums[i] - bound + 1)\n                cost += need\n            if cost < best:\n                best = cost\n        return int(best)\n",
        javascript: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar movesToMakeZigzag = function(nums) {\n    const n = nums.length;\n    const INF = Number.MAX_SAFE_INTEGER;\n    let best = INF;\n    for (let s = 0; s < 2; s++) {\n        let cost = 0;\n        for (let i = 0; i < n; i++) {\n            if ((i % 2) !== s) continue;\n            const left = (i > 0) ? nums[i - 1] : INF;\n            const right = (i < n - 1) ? nums[i + 1] : INF;\n            const bound = Math.min(left, right);\n            const need = Math.max(0, nums[i] - bound + 1);\n            cost += need;\n        }\n        if (cost < best) best = cost;\n    }\n    return best;\n};\n",
        java: "class Solution {\n    public int movesToMakeZigzag(int[] nums) {\n        int n = nums.length;\n        final int INF = Integer.MAX_VALUE / 2;\n        long best = Long.MAX_VALUE;\n        for (int s = 0; s < 2; s++) {\n            long cost = 0;\n            for (int i = 0; i < n; i++) {\n                if ((i % 2) != s) continue;\n                int left = (i > 0) ? nums[i - 1] : INF;\n                int right = (i < n - 1) ? nums[i + 1] : INF;\n                int bound = Math.min(left, right);\n                int need = Math.max(0, nums[i] - bound + 1);\n                cost += need;\n            }\n            if (cost < best) best = cost;\n        }\n        return (int) best;\n    }\n}\n",
        cpp: "#include <vector>\n#include <algorithm>\n#include <climits>\nusing namespace std;\n\nclass Solution {\npublic:\n    int movesToMakeZigzag(vector<int>& nums) {\n        int n = (int) nums.size();\n        const int INF = INT_MAX / 2;\n        long long best = LLONG_MAX;\n        for (int s = 0; s < 2; s++) {\n            long long cost = 0;\n            for (int i = 0; i < n; i++) {\n                if ((i % 2) != s) continue;\n                int left = (i > 0) ? nums[i - 1] : INF;\n                int right = (i < n - 1) ? nums[i + 1] : INF;\n                int bound = min(left, right);\n                int need = max(0, nums[i] - bound + 1);\n                cost += need;\n            }\n            if (cost < best) best = cost;\n        }\n        return (int) best;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// Compose block and SAFE-replace into problemContent.js
// ============================================================
function buildBlock(p1, p2) {
  const j1 = JSON.stringify(p1.obj, null, 2);
  const j2 = JSON.stringify(p2.obj, null, 2);
  return [
    "",
    "// ===== WAVE 35N START =====",
    "// === WAVE 35N " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35N " + p1.slug + " END ===",
    "// === WAVE 35N " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35N " + p2.slug + " END ===",
    "// ===== WAVE 35N END =====",
    ""
  ].join("\n");
}

const p1 = buildProblem1();
const p2 = buildProblem2();

if (p1.obj.test_cases.length < 25) {
  console.error("P1 has only " + p1.obj.test_cases.length + " test cases");
  process.exit(1);
}
if (p2.obj.test_cases.length < 25) {
  console.error("P2 has only " + p2.obj.test_cases.length + " test cases");
  process.exit(1);
}

const block = buildBlock(p1, p2);

let src = fs.readFileSync(FILE, "utf8");

// Guard: don't double-write.
if (src.indexOf("WAVE 35N START") !== -1) {
  console.error("WAVE 35N already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 35M END marker and append block after it.
const ANCHOR = "// ===== WAVE 35M END =====";
if (src.indexOf(ANCHOR) === -1) {
  console.error("Anchor " + ANCHOR + " not found");
  process.exit(1);
}

const next = src.replace(ANCHOR, function (m) {
  return m + "\n" + block;
});

if (next === src) {
  console.error("No-op replace; aborting");
  process.exit(1);
}

fs.writeFileSync(FILE, next);

console.log("DONE wave35n " + p1.slug + " + " + p2.slug);
