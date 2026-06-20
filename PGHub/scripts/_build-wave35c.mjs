#!/usr/bin/env node
// Build WAVE 35C: count-servers-that-communicate + minimum-time-to-make-rope-colorful
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
// PROBLEM 1: count-servers-that-communicate (LC 1267)
//   countServers(grid: int[][]) -> int
//   Count servers sharing a row or column with at least one other server.
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F362A);

  function ref(grid) {
    const m = grid.length;
    if (m === 0) return 0;
    const n = grid[0].length;
    const rowCount = new Array(m).fill(0);
    const colCount = new Array(n).fill(0);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (grid[i][j] === 1) {
          rowCount[i]++;
          colCount[j]++;
        }
      }
    }
    let total = 0;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (grid[i][j] === 1 && (rowCount[i] > 1 || colCount[j] > 1)) {
          total++;
        }
      }
    }
    return total;
  }

  const cases = [];
  // LC sample 1: [[1,0],[0,1]] -> 0 (each isolated)
  cases.push([[1, 0], [0, 1]]);
  // LC sample 2: [[1,0],[1,1]] -> 3 (all communicate)
  cases.push([[1, 0], [1, 1]]);
  // LC sample 3: classic 4x4 -> 4
  cases.push([
    [1, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ]);
  // All zeros
  cases.push([[0, 0], [0, 0]]);
  // Single server
  cases.push([[1]]);
  // Single empty cell
  cases.push([[0]]);
  // Single row of three communicating servers
  cases.push([[1, 1, 1]]);
  // Single column of three
  cases.push([[1], [1], [1]]);
  // Two isolated servers diagonally placed
  cases.push([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  // Row pair plus isolated
  cases.push([[1, 1, 0], [0, 0, 0], [0, 0, 1]]);
  // Column pair plus isolated
  cases.push([[1, 0, 0], [1, 0, 0], [0, 0, 1]]);
  // All ones 2x2
  cases.push([[1, 1], [1, 1]]);
  // All ones 3x3
  cases.push([[1, 1, 1], [1, 1, 1], [1, 1, 1]]);
  // Diagonal only on 4x4 -> all isolated
  cases.push([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ]);
  // Same row pair (only)
  cases.push([[1, 1]]);
  // Same col pair (only)
  cases.push([[1], [1]]);
  // 4x4 with cluster + isolated
  cases.push([
    [1, 1, 0, 0],
    [1, 0, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 0, 0]
  ]);
  // L shape
  cases.push([
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 1]
  ]);
  // Tall single column with all ones
  cases.push([[1], [1], [1], [1], [1]]);
  // Wide single row with all ones
  cases.push([[1, 1, 1, 1, 1]]);
  // Sparse 5x5 with two clusters
  cases.push([
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 1]
  ]);
  // Cross pattern
  cases.push([
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
  ]);
  // 6x6 all empty
  cases.push([
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0]
  ]);
  // 1x1 zero
  cases.push([[0]]);
  // 2x1 single server
  cases.push([[1], [0]]);
  // 1x2 single server
  cases.push([[1, 0]]);
  // Mixed 3x4
  cases.push([
    [1, 0, 0, 1],
    [0, 1, 0, 0],
    [1, 0, 1, 0]
  ]);
  // 4x3 cluster top, isolated bottom
  cases.push([
    [1, 1, 0],
    [1, 0, 0],
    [0, 0, 0],
    [0, 0, 1]
  ]);

  // Random grids via LCG.
  while (cases.length < 35) {
    const m = 1 + (lcg() % 6);
    const n = 1 + (lcg() % 6);
    const g = [];
    for (let i = 0; i < m; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        row.push((lcg() % 3 === 0) ? 1 : 0);
      }
      g.push(row);
    }
    cases.push(g);
  }

  const test_cases = cases.map((grid) => ({
    inputs: [JSON.stringify(grid)],
    expected: String(ref(grid))
  }));

  return {
    slug: "count-servers-that-communicate",
    obj: {
      description: "You are given a map of a server center, represented as an `m * n` integer matrix `grid`, where `1` means that on that cell there is a server and `0` means that it is no server. **Two servers are said to communicate** if they are on the same row or on the same column.\n\nReturn the **number of servers that communicate with any other server**.\n\n**Example 1**\n\n```\nInput:  grid = [[1,0],[0,1]]\nOutput: 0\nExplanation: No servers can communicate with others.\n```\n\n**Example 2**\n\n```\nInput:  grid = [[1,0],[1,1]]\nOutput: 3\nExplanation: All three servers can communicate with at least one other server.\n```\n\n**Example 3**\n\n```\nInput:  grid = [[1,1,0,0],[0,0,1,0],[0,0,1,0],[0,0,0,1]]\nOutput: 4\nExplanation: The two servers in the first row communicate with each other. The two servers in the third column communicate with each other. The server at right bottom corner cannot communicate with any other server.\n```\n\nThis is **LeetCode 1267**. The canonical solution uses **two count arrays** — one for rows, one for columns — and then re-walks the grid to tally cells whose row OR column has more than one server.",
      method_name: "countServers",
      params: [
        { name: "grid", type: "int[][]" }
      ],
      return_type: "int",
      tags: ["array", "matrix", "counting", "union-find"],
      pattern: "**Two-pass row/column counting — the cleanest O(m*n) solution.**\n\n**Observation.** A server at `(i, j)` communicates with at least one other server iff there is another `1` in row `i` OR another `1` in column `j`. Equivalently: `rowCount[i] > 1 OR colCount[j] > 1`. The row and column counts are enough — we never need to know WHICH other server, just THAT one exists.\n\n**Algorithm.**\n\n```\nrowCount[i] = number of 1s in row i\ncolCount[j] = number of 1s in column j\n\nfor each cell (i, j):\n    if grid[i][j] == 1 and (rowCount[i] > 1 or colCount[j] > 1):\n        total += 1\nreturn total\n```\n\n**First pass** walks the grid once and increments `rowCount[i]` and `colCount[j]` for every `1`. **Second pass** walks the grid again and tallies servers whose row or column has more than one server. Total work: `2 * m * n` cell visits.\n\n**Why the OR is correct.** If `rowCount[i] >= 2`, there is at least one other server in row `i` — communication established. Same logic for `colCount[j] >= 2`. The OR captures both directions. AND would be wrong (would require the server to communicate via BOTH row and column).\n\n**Worked example.** `grid = [[1,1,0,0],[0,0,1,0],[0,0,1,0],[0,0,0,1]]`.\n\n```\nrowCount = [2, 1, 1, 1]\ncolCount = [1, 1, 2, 1]\n\ncell (0,0) = 1: rowCount[0]=2 > 1 -> count it.\ncell (0,1) = 1: rowCount[0]=2 > 1 -> count it.\ncell (1,2) = 1: colCount[2]=2 > 1 -> count it.\ncell (2,2) = 1: colCount[2]=2 > 1 -> count it.\ncell (3,3) = 1: rowCount[3]=1, colCount[3]=1 -> isolated, skip.\ntotal = 4.\n```\n\n**Alternative: union-find.** Treat each server as a node; union all servers in the same row, then all in the same column. Count servers whose connected-component size is `>= 2`. Correct but unnecessarily heavy — the two-pass count is strictly simpler and asymptotically equivalent.\n\n**Brute-force comparison.** For each server, scan its entire row and column for another server — `O(m * n * (m + n))`. The two-pass solution drops the inner scan by precomputing the counts. Constant-factor saving in code length, asymptotic saving when both `m` and `n` are large.\n\n**Edge cases.** Empty grid: return 0. All zeros: return 0. Single server alone: return 0 (no one to talk to). All ones in a row of length 1: row has only 1 server -> isolated -> return 0.",
      follow_up: "**Variant 1 — return the LIST of communicating servers instead of the count.** Same algorithm; in the second pass, collect `(i, j)` instead of incrementing `total`.\n\n**Variant 2 — count CONNECTED COMPONENTS of servers (transitive reachability).** Two servers in different rows can transitively communicate through a third. Union-find or BFS/DFS is the right tool — the row/col count trick no longer suffices.\n\n**Variant 3 — minimum servers to remove to disconnect the network.** Reduces to a min-cut problem on the bipartite (row, col) graph.\n\n**Variant 4 — weighted servers (each communication has a cost).** Build the bipartite graph row-vs-col and run a min-cost flow.\n\n**Variant 5 — streaming variant.** Servers arrive one at a time; report current communicating count after each insertion. Maintain `rowCount` and `colCount` incrementally and a running total — each insertion is `O(1)` amortized.\n\n**Variant 6 — sparse grid (lots of zeros).** Iterate only over `(i, j)` cells with `1` (store them in a list) and use a hash map for the row/col counts. `O(K)` where `K` is the number of servers.\n\n**Implementation pitfalls.**\n1. **Using AND instead of OR.** A server communicates if its row OR column has another — not both. AND would severely undercount.\n2. **Counting EACH PAIR instead of EACH SERVER.** The problem asks for the number of communicating servers, not the number of communicating pairs.\n3. **Forgetting `grid[i][j] == 1` in the second pass.** A `0` cell is not a server and must not be counted, even if `rowCount[i] > 1`.\n4. **One-pass attempt.** It is tempting to count on the fly during the first scan, but at that moment you do not yet know the row or column totals — the second pass is necessary unless you maintain a separate 'pending' list.\n5. **Off-by-one in row/col sizes.** Initialize `rowCount` to length `m` and `colCount` to length `n` — flipping these causes index-out-of-range on non-square grids.\n6. **Integer overflow.** Even though `m, n <= 250` (LC bound) keeps the count tiny, generic code should still use `int` (or `long` for very large grids).",
      complexity: {
        time: "**O(m * n)** — two passes over the grid. Each pass touches every cell once. With `m, n <= 250` this is at most `62,500` operations — trivial.",
        space: "**O(m + n)** for the `rowCount` and `colCount` arrays. The input grid itself is `O(m * n)` but is not counted as auxiliary space. Output is one integer — `O(1)`.",
        notes: "Union-find achieves the same asymptotic bound `O(m * n * alpha)` but uses `O(m * n)` auxiliary space. The two-pass solution is strictly better for this problem and equally easy to write.",
        optimal: "**O(m * n) time and O(m + n) space** is optimal — every cell must be read at least once, and you need at least one counter per row and one per column."
      },
      constraints: [
        "m == grid.length",
        "n == grid[i].length",
        "1 <= m <= 250",
        "1 <= n <= 250",
        "grid[i][j] is either 0 or 1"
      ],
      hints: [
        "**A server communicates iff its row has >1 server OR its column has >1 server.** Counting per row and per column is enough.",
        "**Precompute `rowCount[i]` and `colCount[j]`** in a single sweep over the grid.",
        "**Second sweep tallies servers whose row OR column count exceeds 1.** Use OR, not AND.",
        "**A server alone in its row AND column is isolated** — do not count it.",
        "**Empty grid -> 0.** All zeros -> 0. Single server -> 0.",
        "**Union-find works but is overkill** — the two-pass count is `O(m*n)` and shorter."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\n\nclass Solution:\n    def countServers(self, grid: List[List[int]]) -> int:\n        m = len(grid)\n        if m == 0:\n            return 0\n        n = len(grid[0])\n        row_count = [0] * m\n        col_count = [0] * n\n        for i in range(m):\n            for j in range(n):\n                if grid[i][j] == 1:\n                    row_count[i] += 1\n                    col_count[j] += 1\n        total = 0\n        for i in range(m):\n            for j in range(n):\n                if grid[i][j] == 1 and (row_count[i] > 1 or col_count[j] > 1):\n                    total += 1\n        return total\n",
        javascript: "/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar countServers = function(grid) {\n    const m = grid.length;\n    if (m === 0) return 0;\n    const n = grid[0].length;\n    const rowCount = new Array(m).fill(0);\n    const colCount = new Array(n).fill(0);\n    for (let i = 0; i < m; i++) {\n        for (let j = 0; j < n; j++) {\n            if (grid[i][j] === 1) {\n                rowCount[i]++;\n                colCount[j]++;\n            }\n        }\n    }\n    let total = 0;\n    for (let i = 0; i < m; i++) {\n        for (let j = 0; j < n; j++) {\n            if (grid[i][j] === 1 && (rowCount[i] > 1 || colCount[j] > 1)) {\n                total++;\n            }\n        }\n    }\n    return total;\n};\n",
        java: "public class Solution {\n    public int countServers(int[][] grid) {\n        int m = grid.length;\n        if (m == 0) return 0;\n        int n = grid[0].length;\n        int[] rowCount = new int[m];\n        int[] colCount = new int[n];\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < n; j++) {\n                if (grid[i][j] == 1) {\n                    rowCount[i]++;\n                    colCount[j]++;\n                }\n            }\n        }\n        int total = 0;\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < n; j++) {\n                if (grid[i][j] == 1 && (rowCount[i] > 1 || colCount[j] > 1)) {\n                    total++;\n                }\n            }\n        }\n        return total;\n    }\n}\n",
        cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int countServers(vector<vector<int>>& grid) {\n        int m = (int)grid.size();\n        if (m == 0) return 0;\n        int n = (int)grid[0].size();\n        vector<int> rowCount(m, 0);\n        vector<int> colCount(n, 0);\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < n; j++) {\n                if (grid[i][j] == 1) {\n                    rowCount[i]++;\n                    colCount[j]++;\n                }\n            }\n        }\n        int total = 0;\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < n; j++) {\n                if (grid[i][j] == 1 && (rowCount[i] > 1 || colCount[j] > 1)) {\n                    total++;\n                }\n            }\n        }\n        return total;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: minimum-time-to-make-rope-colorful (LC 1578)
//   minCost(colors: str, neededTime: int[]) -> int
//   For each run of consecutive equal colors, sum every cost and subtract the max.
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F362B);

  function ref(colors, neededTime) {
    const n = colors.length;
    let total = 0;
    let i = 0;
    while (i < n) {
      let j = i;
      let runSum = 0;
      let runMax = 0;
      while (j < n && colors[j] === colors[i]) {
        runSum += neededTime[j];
        if (neededTime[j] > runMax) runMax = neededTime[j];
        j++;
      }
      total += runSum - runMax;
      i = j;
    }
    return total;
  }

  function randString(len) {
    const alphabet = "abcde";
    let s = "";
    for (let i = 0; i < len; i++) {
      s += alphabet[lcg() % alphabet.length];
    }
    return s;
  }

  function randTimes(len, maxVal) {
    const arr = [];
    for (let i = 0; i < len; i++) {
      arr.push(1 + (lcg() % maxVal));
    }
    return arr;
  }

  const cases = [];
  // LC sample 1: "abaac", [1,2,3,4,5] -> 3
  cases.push(["abaac", [1, 2, 3, 4, 5]]);
  // LC sample 2: "abc", [1,2,3] -> 0 (no duplicates)
  cases.push(["abc", [1, 2, 3]]);
  // LC sample 3: "aabaa", [1,2,3,4,1] -> 2
  cases.push(["aabaa", [1, 2, 3, 4, 1]]);
  // Single character
  cases.push(["a", [5]]);
  // Two same characters
  cases.push(["aa", [3, 7]]);  // min(3,7)=3
  // Two different characters
  cases.push(["ab", [3, 7]]);
  // All same five characters -> remove all but max
  cases.push(["aaaaa", [1, 2, 3, 4, 5]]);
  // All same five with equal weights -> remove n-1 of them
  cases.push(["aaaaa", [5, 5, 5, 5, 5]]);
  // Long alternating -> 0 cost
  cases.push(["abababab", [1, 2, 3, 4, 5, 6, 7, 8]]);
  // Run of three at the end
  cases.push(["abccc", [1, 2, 5, 3, 9]]);  // remove 5+3 (max 9)
  // Two separate runs
  cases.push(["aabb", [1, 4, 2, 5]]);  // 1 + 2
  // Three runs of length 2
  cases.push(["aabbcc", [3, 1, 5, 2, 4, 6]]);
  // Pattern with all max values at the front
  cases.push(["aaabbb", [9, 1, 1, 9, 1, 1]]);
  // Sample 'bbbaaa'
  cases.push(["bbbaaa", [4, 5, 3, 7, 2, 1]]);
  // Long run of same char with high cost in middle
  cases.push(["aaaaaaa", [1, 1, 1, 9, 1, 1, 1]]);
  // Two-char repeated 'ababaaab'
  cases.push(["ababaaab", [1, 2, 3, 4, 5, 6, 7, 8]]);
  // 'aabbaa' -- two runs of a separated by run of b
  cases.push(["aabbaa", [2, 3, 4, 5, 6, 7]]);
  // 'zzzz' all same
  cases.push(["zzzz", [10, 20, 30, 40]]);
  // 'aab' tail single
  cases.push(["aab", [3, 6, 9]]);
  // 'baa' head single
  cases.push(["baa", [9, 3, 6]]);
  // Equal pair at start
  cases.push(["aac", [4, 4, 1]]);
  // Equal pair at end
  cases.push(["bca", [1, 4, 4]]);  // no dup
  // Tricky tie: same character runs with equal max
  cases.push(["aaab", [3, 3, 3, 5]]);
  // Large costs but single chars only
  cases.push(["abcdef", [10, 10, 10, 10, 10, 10]]);
  // Run separated by single different chars
  cases.push(["aabaa", [1, 1, 1, 1, 1]]);
  // Adversarial all-equal cost everywhere
  cases.push(["aaabbbccc", [2, 2, 2, 2, 2, 2, 2, 2, 2]]);
  // Hi cost spread
  cases.push(["ababab", [100, 100, 100, 100, 100, 100]]);

  // Random strings via LCG.
  while (cases.length < 35) {
    const len = 1 + (lcg() % 15);
    const s = randString(len);
    const t = randTimes(len, 50);
    cases.push([s, t]);
  }

  const test_cases = cases.map(([colors, times]) => ({
    inputs: [JSON.stringify(colors), JSON.stringify(times)],
    expected: String(ref(colors, times))
  }));

  return {
    slug: "minimum-time-to-make-rope-colorful",
    obj: {
      description: "Alice has `n` balloons arranged on a rope. You are given a **0-indexed** string `colors` where `colors[i]` is the color of the `i`-th balloon.\n\nAlice wants the rope to be **colorful**. She does not want **two consecutive balloons to be of the same color**, so she asks Bob for help. Bob can remove some balloons from the rope to make it colorful. You are given a **0-indexed** integer array `neededTime` where `neededTime[i]` is the time (in seconds) that Bob needs to remove the `i`-th balloon from the rope.\n\nReturn the **minimum time** Bob needs to make the rope colorful.\n\n**Example 1**\n\n```\nInput:  colors = \"abaac\", neededTime = [1,2,3,4,5]\nOutput: 3\nExplanation: Remove the second 'a' at index 3 (time 4)? No - that leaves 'a' at 2 next to 'c' at 4 ... actually the run \"aa\" at indices 2..3 has times 3 and 4; remove the smaller (3) to keep cost minimal -> total 3.\n```\n\n**Example 2**\n\n```\nInput:  colors = \"abc\", neededTime = [1,2,3]\nOutput: 0\nExplanation: No two consecutive balloons share a color.\n```\n\n**Example 3**\n\n```\nInput:  colors = \"aabaa\", neededTime = [1,2,3,4,1]\nOutput: 2\nExplanation: Run \"aa\" at indices 0..1: remove time 1, keep time 2.\n              Run \"aa\" at indices 3..4: remove time 1, keep time 4.\n              Total = 1 + 1 = 2.\n```\n\nThis is **LeetCode 1578**. The canonical solution: for each **maximal run** of consecutive equal colors, you must keep exactly one balloon (the cheapest to keep, i.e. the most expensive to remove) and remove the rest. Per run, contribution = `sum(times) - max(times)`.",
      method_name: "minCost",
      params: [
        { name: "colors", type: "str" },
        { name: "neededTime", type: "int[]" }
      ],
      return_type: "int",
      tags: ["array", "string", "greedy", "two-pointers"],
      pattern: "**Per-run greedy: within each maximal run of identical colors, keep the costliest balloon and remove the rest.**\n\n**Why greedy works.** The final rope must have no two consecutive equal balloons. Inside a run of `k` identical-color balloons, no two of them may remain adjacent. Since they were originally consecutive AND identical, **at most one of them can survive** in the final rope (any two survivors are still identical and still adjacent — contradiction). To minimize removal cost, choose to keep the one with the **largest** `neededTime` (most expensive to remove, so removing it would waste the most). Remove all others; total cost for this run = `sum(times) - max(times)`.\n\n**Algorithm.**\n\n```\ntotal = 0\ni = 0\nn = len(colors)\nwhile i < n:\n    j = i\n    run_sum = 0\n    run_max = 0\n    while j < n and colors[j] == colors[i]:\n        run_sum += neededTime[j]\n        run_max = max(run_max, neededTime[j])\n        j += 1\n    total += run_sum - run_max\n    i = j\nreturn total\n```\n\n**One-pass equivalent.** Scan left to right with a running `prevMax` (the max `neededTime` seen so far in the current run). When you encounter a new index `i` such that `colors[i] == colors[i - 1]`, one of the two must go; pay `min(neededTime[i], prevMax)` and bump `prevMax = max(prevMax, neededTime[i])`. When the color changes, reset `prevMax = neededTime[i]`. This is just the per-run reasoning expressed inline.\n\n**Worked example.** `colors = \"abaac\", neededTime = [1, 2, 3, 4, 5]`.\n\n```\nRun 'a' at [0..0]: sum=1, max=1 -> contributes 0.\nRun 'b' at [1..1]: sum=2, max=2 -> contributes 0.\nRun 'a' at [2..3]: sum=3+4=7, max=4 -> contributes 3.\nRun 'c' at [4..4]: sum=5, max=5 -> contributes 0.\nTotal = 0 + 0 + 3 + 0 = 3.\n```\n\n**Why `sum - max` is provably optimal per run.** Among `k` items where you must drop `k - 1`, the cheapest dropping plan keeps the most expensive item: every other choice drops at least one item with cost greater than the one kept, increasing total cost. Mathematically: `sum(times) - keep(one)` is minimized by maximizing `keep(one) = max(times)`.\n\n**Brute-force comparison.** Enumerate every subset of removals (`2^n` subsets), reject those that still have a same-color adjacency, take the minimum cost — `O(2^n * n)`. Useless above `n = 25`. The greedy runs in `O(n)`.\n\n**Edge cases.** `colors` of length 1: total = 0 (nothing to remove). All distinct: total = 0. All same: total = `sum - max`. Empty `colors`: total = 0 (by convention).",
      follow_up: "**Variant 1 — at most `k` consecutive of the same color allowed.** Inside a run of `k+1` or more identical colors, you must remove the cheapest `len - k` balloons. Replace `sum - max` with `sum - (sum of top k)`. Use a partial sort or a small max-heap.\n\n**Variant 2 — return the indices of the balloons to remove.** Track each run's argmax index and remove all others. Output set of indices.\n\n**Variant 3 — different cost model: remove the i-th balloon costs `c[i]` AND splits the rope.** Once removed, the two neighbours become adjacent. The greedy still works because the rule (no two adjacent equal) is local — splitting cannot CREATE a new same-color adjacency between two different colors.\n\n**Variant 4 — add balloons instead of removing.** Insert a cheap 'spacer' balloon (color `*` cost `c[*]`) between same-color runs. This is a different optimization: insert `len(run) - 1` spacers and pay accordingly.\n\n**Variant 5 — minimize the number of removed balloons (instead of total cost).** Per run of `k`: remove `k - 1`. Total removals = `sum(k - 1)` = `n - (number of runs)`.\n\n**Variant 6 — ropes with weighted same-color penalties (no removal needed).** Different problem entirely; solved by DP over the rope.\n\n**Implementation pitfalls.**\n1. **Keeping the cheapest (min) instead of the costliest (max).** Maximizes total removal cost — exactly wrong.\n2. **Treating each adjacent pair independently.** A run of 3 has two adjacent pairs `(0,1)` and `(1,2)`; processing them independently can mistakenly remove the middle one and leave two adjacent same-color survivors.\n3. **Forgetting to reset `prevMax` when the color changes** in the inline one-pass form. Carries the max across run boundaries; wrong totals on multi-run inputs.\n4. **Including the run's surviving balloon's cost.** Per-run cost is `sum - max`, not `sum`. The survivor's `neededTime` is NOT paid.\n5. **Integer overflow on long ropes.** `n <= 10^5` and `neededTime[i] <= 10^4` -> max total cost is `~10^9`. Use `int` in C++/Java (32-bit) is fine; for Python int is unlimited; for JavaScript Number is fine.\n6. **Off-by-one in the inner while.** Use `colors[j] == colors[i]` (anchor to the run's first index) to avoid the j-vs-j-1 pitfall on the first iteration.",
      complexity: {
        time: "**O(n)** where `n = len(colors)`. Each index is visited exactly once by the outer + inner pointer pair; the inner `while` advances `j`, and the outer loop resumes from `j`. Total work is linear.",
        space: "**O(1)** auxiliary — only a handful of integer accumulators (`total`, `runSum`, `runMax`, `i`, `j`). Output is one integer.",
        notes: "The one-pass form with `prevMax` (tracked across only adjacent-same-color comparisons) uses the same `O(n)` time and `O(1)` space — slightly shorter code but conceptually identical.",
        optimal: "**O(n) time and O(1) space** is optimal — every balloon's cost must be inspected at least once."
      },
      constraints: [
        "n == colors.length == neededTime.length",
        "1 <= n <= 10^5",
        "1 <= neededTime[i] <= 10^4",
        "colors contains only lowercase English letters"
      ],
      hints: [
        "**Inside a run of identical colors, at most one balloon can survive.** All survivors must be different from their neighbours, but same-color neighbours can never both survive.",
        "**To minimize removal cost, keep the balloon with the LARGEST `neededTime` in each run.** Removing it would waste the most cost.",
        "**Per-run cost = `sum(times) - max(times)`.** Across all runs, sum these contributions.",
        "**Identify maximal runs with two pointers.** Outer `i` jumps to the next color; inner `j` walks while `colors[j] == colors[i]`.",
        "**Total time is `O(n)` because each index is visited once.** The two-pointer pattern guarantees this.",
        "**Edge case: a run of length 1 contributes 0.** `sum - max = neededTime[i] - neededTime[i] = 0`."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\n\nclass Solution:\n    def minCost(self, colors: str, neededTime: List[int]) -> int:\n        n = len(colors)\n        total = 0\n        i = 0\n        while i < n:\n            j = i\n            run_sum = 0\n            run_max = 0\n            while j < n and colors[j] == colors[i]:\n                run_sum += neededTime[j]\n                if neededTime[j] > run_max:\n                    run_max = neededTime[j]\n                j += 1\n            total += run_sum - run_max\n            i = j\n        return total\n",
        javascript: "/**\n * @param {string} colors\n * @param {number[]} neededTime\n * @return {number}\n */\nvar minCost = function(colors, neededTime) {\n    const n = colors.length;\n    let total = 0;\n    let i = 0;\n    while (i < n) {\n        let j = i;\n        let runSum = 0;\n        let runMax = 0;\n        while (j < n && colors[j] === colors[i]) {\n            runSum += neededTime[j];\n            if (neededTime[j] > runMax) runMax = neededTime[j];\n            j++;\n        }\n        total += runSum - runMax;\n        i = j;\n    }\n    return total;\n};\n",
        java: "public class Solution {\n    public int minCost(String colors, int[] neededTime) {\n        int n = colors.length();\n        int total = 0;\n        int i = 0;\n        while (i < n) {\n            int j = i;\n            int runSum = 0;\n            int runMax = 0;\n            while (j < n && colors.charAt(j) == colors.charAt(i)) {\n                runSum += neededTime[j];\n                if (neededTime[j] > runMax) runMax = neededTime[j];\n                j++;\n            }\n            total += runSum - runMax;\n            i = j;\n        }\n        return total;\n    }\n}\n",
        cpp: "#include <string>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int minCost(string colors, vector<int>& neededTime) {\n        int n = (int)colors.size();\n        int total = 0;\n        int i = 0;\n        while (i < n) {\n            int j = i;\n            int runSum = 0;\n            int runMax = 0;\n            while (j < n && colors[j] == colors[i]) {\n                runSum += neededTime[j];\n                if (neededTime[j] > runMax) runMax = neededTime[j];\n                j++;\n            }\n            total += runSum - runMax;\n            i = j;\n        }\n        return total;\n    }\n};\n"
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
    "// ===== WAVE 35C START =====",
    "// === WAVE 35C " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35C " + p1.slug + " END ===",
    "// === WAVE 35C " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35C " + p2.slug + " END ===",
    "// ===== WAVE 35C END =====",
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
if (src.indexOf("WAVE 35C START") !== -1) {
  console.error("WAVE 35C already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 35B END marker and append block after it.
const ANCHOR = "// ===== WAVE 35B END =====";
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

console.log("DONE wave35c " + p1.slug + " + " + p2.slug);
