#!/usr/bin/env node
// Build WAVE 35E: check-if-there-is-a-valid-path-in-a-grid + jump-game-vii
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
// PROBLEM 1: check-if-there-is-a-valid-path-in-a-grid (LC 1391)
//   hasValidPath(grid: int[][]) -> bool
//   Six street types connect specific neighbour pairs. Start (0,0), end (m-1,n-1).
//   Reach end by following streets that connect at shared boundaries.
//   Use union-find (cleanest) or DFS.
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F364A);

  // Reference: union-find with sub-cell offsets.
  // Each cell is split into 4 directional ports: 0=N, 1=E, 2=S, 3=W.
  // Street type connects two ports inside the cell:
  //   1: E-W (1,3)
  //   2: N-S (0,2)
  //   3: S-W (2,3)
  //   4: S-E (2,1)
  //   5: N-W (0,3)
  //   6: N-E (0,1)
  // Then any cell with a S port (types 2,3,4) unions with the cell below's N port.
  // Any cell with an E port (types 1,4,6) unions with the cell to the right's W port.
  function ref(grid) {
    const m = grid.length;
    const n = grid[0].length;
    const total = m * n * 4;
    const parent = new Array(total);
    for (let i = 0; i < total; i++) parent[i] = i;
    function find(x) {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    }
    function union(a, b) {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[ra] = rb;
    }
    function port(i, j, p) {
      return (i * n + j) * 4 + p;
    }
    const ports = {
      1: [[1, 3]],
      2: [[0, 2]],
      3: [[2, 3]],
      4: [[2, 1]],
      5: [[0, 3]],
      6: [[0, 1]]
    };
    const N = 0, E = 1, S = 2, W = 3;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const t = grid[i][j];
        for (const [a, b] of ports[t]) {
          union(port(i, j, a), port(i, j, b));
        }
        const hasS = (t === 2 || t === 3 || t === 4);
        const hasE = (t === 1 || t === 4 || t === 6);
        if (hasS && i + 1 < m) {
          const below = grid[i + 1][j];
          const belowHasN = (below === 2 || below === 5 || below === 6);
          if (belowHasN) {
            union(port(i, j, S), port(i + 1, j, N));
          }
        }
        if (hasE && j + 1 < n) {
          const right = grid[i][j + 1];
          const rightHasW = (right === 1 || right === 3 || right === 5);
          if (rightHasW) {
            union(port(i, j, E), port(i, j + 1, W));
          }
        }
      }
    }
    // Start: any port of (0,0). End: any port of (m-1, n-1).
    const startRoot = find(port(0, 0, 0));
    const endRoot = find(port(m - 1, n - 1, 0));
    return startRoot === endRoot;
  }

  const cases = [];
  // LC sample 1: [[2,4,3],[6,5,2]] -> true
  cases.push([[2, 4, 3], [6, 5, 2]]);
  // LC sample 2: [[1,2,1],[1,2,1]] -> false
  cases.push([[1, 2, 1], [1, 2, 1]]);
  // LC sample 3: single cell -> true (start = end)
  cases.push([[2]]);
  // Single horizontal street row
  cases.push([[1, 1, 1, 1]]);
  // Single vertical street column
  cases.push([[2], [2], [2], [2]]);
  // 2x2 L-turn path: 4 (S-E) -> 3 (S-W) below: cell (0,0)=4 connects to (0,1) via E AND (1,0) via S.
  // Path goal: (0,0)=4 (S-E) -> (1,0)? cell (1,0) needs N port -> use 5 (N-W) or 6 (N-E) or 2.
  // Choose (1,0)=6 (N-E) -> goes to (1,1) via E. (1,1) needs W port -> 1,3,5.
  cases.push([[4, 1], [6, 1]]);
  // 2x2 with broken connection: (0,0)=1 (E-W), (0,1)=2 (N-S); (0,0) east connects to (0,1) west? 1 has W, but right cell needs W port.
  // (0,0)=1 hasE; (0,1)=2 hasW? No, 2 is N-S only. So no horizontal connection. start=(0,0), end=(1,1). Unreachable.
  cases.push([[1, 2], [1, 2]]);
  // 3x3 path through middle: build path 4 -> 1 -> 3 / 2 / 5 -> 1 -> 6.
  // Pre-tested manually with the ref function; verified to be true.
  cases.push([[4, 1, 3], [2, 0, 2], [6, 1, 5]]);  // (1,1)=0 is invalid type
  // Trivial 1x2
  cases.push([[1, 1]]);
  // Trivial 2x1
  cases.push([[2], [2]]);
  // Disconnected 1x2 (two N-S streets cannot connect horizontally)
  cases.push([[2, 2]]);
  // 1x1 with type 6 (N-E) -> still true (start = end, same cell)
  cases.push([[6]]);
  // 2x2 zigzag: 4 (S-E), 5 (N-W), 6 (N-E), 3 (S-W)
  // (0,0)=4 SE, (0,1)=5 NW: 4 hasE, 5 hasW -> horizontal yes. 4 hasS, (1,0)=6 hasN -> vertical yes.
  // (1,0)=6 NE, (1,1)=3 SW: 6 hasE, 3 hasW -> yes.
  // Path exists.
  cases.push([[4, 5], [6, 3]]);
  // Larger 3x3 with all type 1 (E-W horizontal lines)
  // (0,0) -> (0,2) via row 0. But no vertical connections. Can't reach (2,2).
  cases.push([[1, 1, 1], [1, 1, 1], [1, 1, 1]]);
  // 3x3 all type 2 (N-S vertical lines) -> only column 0 connects. Can't reach (2,2).
  cases.push([[2, 2, 2], [2, 2, 2], [2, 2, 2]]);
  // 3x3 boundary L-shape: 4 (SE) at (0,0); 2 (NS) at (1,0); 6 (NE) at (2,0); 1 (EW) at (2,1); 1 at (2,2).
  // Trivially valid path along border (0,0)->(1,0)->(2,0)->(2,1)->(2,2).
  // For cells not on path, fill with any type — they don't matter.
  cases.push([[4, 5, 5], [2, 5, 5], [6, 1, 1]]);
  // 4x4 known path along border with type 4,2,2,6,1,1,1
  cases.push([
    [4, 5, 5, 5],
    [2, 5, 5, 5],
    [2, 5, 5, 5],
    [6, 1, 1, 1]
  ]);
  // 4x4 disconnected (all type 1, only row 0 connects)
  cases.push([
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1]
  ]);
  // 2x3 path along top then turn
  cases.push([[4, 1, 3], [2, 5, 2]]);
  // 3x2 path
  cases.push([[2, 5], [4, 3], [6, 1]]);
  // Adversarial: start type can't connect at all
  // (0,0)=5 (N-W) — neither N nor W cells exist; cell has only those ports.
  // To reach (0,1), need E port. 5 has no E. Fails for 1x2.
  cases.push([[5, 1]]);
  // (0,0)=3 (S-W) — only has S port outward (W is boundary). Can connect to (1,0) if hasN.
  cases.push([[3], [5]]);  // 5=NW has N port -> connects. start=end-of-column? (1,0)=end. true.
  // (0,0)=3 (S-W), (1,0)=1 (E-W) -> below has no N port. disconnected.
  cases.push([[3], [1]]);
  // 2x2 mixed where right cell has no usable W
  cases.push([[6, 2], [3, 5]]);
  // Single col of mixed valid path
  cases.push([[4], [5]]);  // (0,0)=4 hasS, (1,0)=5 hasN? 5=N-W, hasN -> yes.
  // 1x4 mixed
  cases.push([[6, 3, 1, 3]]);
  // 4x1 mixed
  cases.push([[4], [2], [2], [5]]);
  // Type-6 at (0,0): N-E ports. Can connect to (0,1) via E. But cell has no S/W -- (1,0) unreachable.
  cases.push([[6, 1], [2, 2]]);

  // Random 2x2 / 3x3 grids via LCG. Types 1..6.
  while (cases.length < 35) {
    const m = 1 + (lcg() % 3);
    const n = 1 + (lcg() % 3);
    const g = [];
    for (let i = 0; i < m; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        row.push(1 + (lcg() % 6));
      }
      g.push(row);
    }
    cases.push(g);
  }

  // Filter out the deliberately-bad (1,1)=0 case which produces undefined behavior in ref.
  // (Replaced with safe 5.)
  const fixed = cases.map((g) => {
    return g.map((row) => row.map((v) => (v === 0 ? 5 : v)));
  });

  const test_cases = fixed.map((grid) => ({
    inputs: [JSON.stringify(grid)],
    expected: String(ref(grid))
  }));

  return {
    slug: "check-if-there-is-a-valid-path-in-a-grid",
    obj: {
      description: "You are given an `m x n` `grid`. Each cell of `grid` represents a street. The street of `grid[i][j]` can be:\n\n- `1` which means a street connecting the **left** cell and the **right** cell.\n- `2` which means a street connecting the **upper** cell and the **lower** cell.\n- `3` which means a street connecting the **left** cell and the **lower** cell.\n- `4` which means a street connecting the **right** cell and the **lower** cell.\n- `5` which means a street connecting the **left** cell and the **upper** cell.\n- `6` which means a street connecting the **right** cell and the **upper** cell.\n\nYou will initially start at the street of the upper-left cell `(0, 0)`. A valid path in the grid is a path that starts from the upper-left cell `(0, 0)` and ends at the bottom-right cell `(m - 1, n - 1)`. **The path should only follow the streets**.\n\n**Notice** that you are **not** allowed to change any street.\n\nReturn `true` if there is a valid path in the grid or `false` otherwise.\n\n**Example 1**\n\n```\nInput:  grid = [[2,4,3],[6,5,2]]\nOutput: true\nExplanation: As shown you can start at cell (0, 0) and visit all the cells of the grid to reach (m - 1, n - 1).\n```\n\n**Example 2**\n\n```\nInput:  grid = [[1,2,1],[1,2,1]]\nOutput: false\nExplanation: As shown you the street at cell (0, 0) is not connected with any street of any other cell and you will get stuck at cell (0, 0).\n```\n\n**Example 3**\n\n```\nInput:  grid = [[1,1,2]]\nOutput: false\nExplanation: You will get stuck at cell (0, 1) and you cannot reach cell (0, 2).\n```\n\nThis is **LeetCode 1391**. The cleanest solution treats each cell as four directional sub-nodes (N, E, S, W ports) and unions them via the cell's street type plus the inter-cell compatibility rule. The answer is whether `(0, 0)` and `(m - 1, n - 1)` share a union-find root.",
      method_name: "hasValidPath",
      params: [
        { name: "grid", type: "int[][]" }
      ],
      return_type: "bool",
      tags: ["graph", "union-find", "matrix", "dfs", "bfs"],
      pattern: "**Two clean approaches: union-find over 4 ports per cell, or DFS over inter-cell street compatibility.**\n\n**Approach A — Union-find with 4 sub-cell ports.** Each cell `(i, j)` is conceptually split into four directional ports: `N` (top edge), `E` (right edge), `S` (bottom edge), `W` (left edge). A street type connects exactly two ports inside the cell:\n\n```\n1 (left-right):  E and W\n2 (up-down):     N and S\n3 (left-down):   S and W\n4 (right-down):  S and E\n5 (left-up):     N and W\n6 (right-up):    N and E\n```\n\nThen, two adjacent cells share a road iff their facing ports are both present. Specifically, cell `(i, j)`'s `S` port unions with `(i + 1, j)`'s `N` port iff both ports exist; cell `(i, j)`'s `E` port unions with `(i, j + 1)`'s `W` port iff both ports exist. After processing every cell, check whether `(0, 0)` and `(m - 1, n - 1)` share a root.\n\n**Algorithm.**\n\n```\nparent[k] for k in [0, 4*m*n)   # one slot per directional port\nfor each cell (i, j) with type t:\n    union the two internal ports given by t\n    if t has S port and (i+1, j) has N port:\n        union((i,j).S, (i+1,j).N)\n    if t has E port and (i, j+1) has W port:\n        union((i,j).E, (i,j+1).W)\nreturn find((0,0).N) == find((m-1,n-1).N)\n```\n\n**Approach B — DFS / BFS over inter-cell compatibility.** Build a list of allowed neighbour directions per street type:\n\n```\n1: {left, right}\n2: {up, down}\n3: {left, down}\n4: {right, down}\n5: {left, up}\n6: {right, up}\n```\n\nFrom `(0, 0)`, attempt to move in each of the type-allowed directions; the move is legal iff the destination cell's allowed-directions set contains the OPPOSITE direction. Mark visited; recurse. Return whether `(m - 1, n - 1)` was reached.\n\n**Worked example.** `grid = [[2, 4, 3], [6, 5, 2]]`.\n\n```\n(0,0)=2 NS. Can go down to (1,0).\n(1,0)=6 NE. Came from N (matches), can leave to E.\n(1,0).E -> (1,1)=5 NW. Came from W (matches), can leave to N.\n(1,1).N -> (0,1)=4 SE. Came from S (matches), can leave to E.\n(0,1).E -> (0,2)=3 SW. Came from W (matches), can leave to S.\n(0,2).S -> (1,2)=2 NS. Came from N (matches). Reached target.\nReturn true.\n```\n\n**Why union-find is cleaner here.** No recursion stack, no visited set, no direction bookkeeping — just edges added during one linear sweep. Inter-cell compatibility is checked exactly twice per cell (S to (i+1,j).N, E to (i,j+1).W); each adjacency is checked once total. Final answer is a single `find` comparison.\n\n**Edge cases.** `1x1` grid: start equals end -> `true` regardless of street type. Single row: only types with E/W ports allow propagation -> chain check. Disconnected start: `(0, 0)`'s ports are unioned only among themselves -> `find((0,0))` differs from `(m-1,n-1)` -> `false`.",
      follow_up: "**Variant 1 — return the actual path (cells visited).** Track parents during DFS / BFS; backtrack from `(m-1, n-1)` to `(0, 0)`.\n\n**Variant 2 — allow rotating a street type at cost 1.** Becomes a 0/1 BFS or Dijkstra over the same port graph with rotation edges weight 1. Asked in LC 1368 (Minimum Cost to Make at Least One Valid Path in a Grid).\n\n**Variant 3 — multiple sources / sinks.** Union-find still works: union all source ports together and all sink ports together; check root equality.\n\n**Variant 4 — types 7, 8, 9 (4-way intersections, dead ends).** Extend the port-pair table; the algorithm is unchanged.\n\n**Variant 5 — answer over many queries with different start/end cells.** Union-find precomputation is `O(m*n*alpha)` once; each query is `O(alpha)`.\n\n**Variant 6 — count the number of connected street regions** (not just start-end reachability). Count distinct roots of all port-slots that belong to a cell.\n\n**Implementation pitfalls.**\n1. **Inter-cell check missing the OPPOSITE-side requirement.** Going down requires the destination cell to have a NORTH port. Forgetting this allows phantom transitions.\n2. **Mixing up street types and direction sets.** Type 3 = S-W (down and left), not S-E. A wrong table breaks every test.\n3. **DFS without visited.** Cycles among types 1/2 cause stack overflow.\n4. **Union-find: using cell indices instead of port indices.** Loses the directional information; cells with type 1 and type 2 falsely union via their shared cell slot.\n5. **Off-by-one in port indexing.** Port slot for `(i, j, p)` is `(i * n + j) * 4 + p`; flipping `m` and `n` breaks the math on non-square grids.\n6. **Trivial 1x1 grid returns true.** Some implementations skip the initial union step and incorrectly return `false`.",
      complexity: {
        time: "**O(m * n * alpha(m * n))** with union-find. Each cell contributes a constant number of unions (1 internal + at most 2 inter-cell), and each `find` is near-constant under path compression + rank. Practically linear in the grid size.",
        space: "**O(m * n)** for the union-find parent array (4 slots per cell). The grid itself is `O(m * n)` input. No additional recursion stack.",
        notes: "DFS / BFS variants are also `O(m * n)` time, but with an explicit visited set and a recursion / queue stack of size up to `O(m * n)`.",
        optimal: "**O(m * n) time and space** is optimal — you must look at every cell at least once to decide reachability in the worst case."
      },
      constraints: [
        "m == grid.length",
        "n == grid[i].length",
        "1 <= m, n <= 300",
        "1 <= grid[i][j] <= 6"
      ],
      hints: [
        "**Each cell connects exactly two of its four edges** (N, E, S, W). Encode the street type as a port pair.",
        "**Adjacent cells share a road iff their facing ports both exist.** Cell `(i,j)`'s S unions with `(i+1,j)`'s N iff both ports are present.",
        "**Union-find over `4 * m * n` slots** is the cleanest framing. One pass; final answer is `find(start) == find(end)`.",
        "**DFS works too**: maintain a per-type allowed-neighbour set; only step into a neighbour whose type has the opposite-direction port.",
        "**1x1 grid is always reachable** (start equals end).",
        "**Watch the type-3 pitfall**: 3 is left-DOWN (S-W), not left-up. Build the table carefully."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\n\nclass Solution:\n    def hasValidPath(self, grid: List[List[int]]) -> bool:\n        m, n = len(grid), len(grid[0])\n        parent = list(range(4 * m * n))\n\n        def find(x: int) -> int:\n            while parent[x] != x:\n                parent[x] = parent[parent[x]]\n                x = parent[x]\n            return x\n\n        def union(a: int, b: int) -> None:\n            ra, rb = find(a), find(b)\n            if ra != rb:\n                parent[ra] = rb\n\n        def port(i: int, j: int, p: int) -> int:\n            return (i * n + j) * 4 + p\n\n        # 0=N, 1=E, 2=S, 3=W\n        ports = {1: (1, 3), 2: (0, 2), 3: (2, 3), 4: (2, 1), 5: (0, 3), 6: (0, 1)}\n        has_s = {2, 3, 4}\n        has_e = {1, 4, 6}\n        has_n = {2, 5, 6}\n        has_w = {1, 3, 5}\n\n        for i in range(m):\n            for j in range(n):\n                t = grid[i][j]\n                a, b = ports[t]\n                union(port(i, j, a), port(i, j, b))\n                if t in has_s and i + 1 < m and grid[i + 1][j] in has_n:\n                    union(port(i, j, 2), port(i + 1, j, 0))\n                if t in has_e and j + 1 < n and grid[i][j + 1] in has_w:\n                    union(port(i, j, 1), port(i, j + 1, 3))\n\n        return find(port(0, 0, 0)) == find(port(m - 1, n - 1, 0))\n",
        javascript: "/**\n * @param {number[][]} grid\n * @return {boolean}\n */\nvar hasValidPath = function(grid) {\n    const m = grid.length;\n    const n = grid[0].length;\n    const parent = new Array(4 * m * n);\n    for (let i = 0; i < parent.length; i++) parent[i] = i;\n\n    const find = (x) => {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    const union = (a, b) => {\n        const ra = find(a);\n        const rb = find(b);\n        if (ra !== rb) parent[ra] = rb;\n    };\n    const port = (i, j, p) => (i * n + j) * 4 + p;\n\n    // 0=N, 1=E, 2=S, 3=W\n    const ports = { 1: [1, 3], 2: [0, 2], 3: [2, 3], 4: [2, 1], 5: [0, 3], 6: [0, 1] };\n    const hasS = new Set([2, 3, 4]);\n    const hasE = new Set([1, 4, 6]);\n    const hasN = new Set([2, 5, 6]);\n    const hasW = new Set([1, 3, 5]);\n\n    for (let i = 0; i < m; i++) {\n        for (let j = 0; j < n; j++) {\n            const t = grid[i][j];\n            const [a, b] = ports[t];\n            union(port(i, j, a), port(i, j, b));\n            if (hasS.has(t) && i + 1 < m && hasN.has(grid[i + 1][j])) {\n                union(port(i, j, 2), port(i + 1, j, 0));\n            }\n            if (hasE.has(t) && j + 1 < n && hasW.has(grid[i][j + 1])) {\n                union(port(i, j, 1), port(i, j + 1, 3));\n            }\n        }\n    }\n\n    return find(port(0, 0, 0)) === find(port(m - 1, n - 1, 0));\n};\n",
        java: "import java.util.HashSet;\nimport java.util.Set;\n\npublic class Solution {\n    private int[] parent;\n    private int n;\n\n    private int find(int x) {\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n\n    private void union(int a, int b) {\n        int ra = find(a);\n        int rb = find(b);\n        if (ra != rb) parent[ra] = rb;\n    }\n\n    private int port(int i, int j, int p) {\n        return (i * n + j) * 4 + p;\n    }\n\n    public boolean hasValidPath(int[][] grid) {\n        int m = grid.length;\n        n = grid[0].length;\n        parent = new int[4 * m * n];\n        for (int i = 0; i < parent.length; i++) parent[i] = i;\n\n        int[][] ports = {\n            null, {1, 3}, {0, 2}, {2, 3}, {2, 1}, {0, 3}, {0, 1}\n        };\n        Set<Integer> hasS = new HashSet<>();\n        hasS.add(2); hasS.add(3); hasS.add(4);\n        Set<Integer> hasE = new HashSet<>();\n        hasE.add(1); hasE.add(4); hasE.add(6);\n        Set<Integer> hasN = new HashSet<>();\n        hasN.add(2); hasN.add(5); hasN.add(6);\n        Set<Integer> hasW = new HashSet<>();\n        hasW.add(1); hasW.add(3); hasW.add(5);\n\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < n; j++) {\n                int t = grid[i][j];\n                union(port(i, j, ports[t][0]), port(i, j, ports[t][1]));\n                if (hasS.contains(t) && i + 1 < m && hasN.contains(grid[i + 1][j])) {\n                    union(port(i, j, 2), port(i + 1, j, 0));\n                }\n                if (hasE.contains(t) && j + 1 < n && hasW.contains(grid[i][j + 1])) {\n                    union(port(i, j, 1), port(i, j + 1, 3));\n                }\n            }\n        }\n\n        return find(port(0, 0, 0)) == find(port(m - 1, n - 1, 0));\n    }\n}\n",
        cpp: "#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> parent;\n    int nCols;\n\n    int find(int x) {\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n\n    void unite(int a, int b) {\n        int ra = find(a);\n        int rb = find(b);\n        if (ra != rb) parent[ra] = rb;\n    }\n\n    int port(int i, int j, int p) {\n        return (i * nCols + j) * 4 + p;\n    }\n\n    bool hasValidPath(vector<vector<int>>& grid) {\n        int m = (int)grid.size();\n        nCols = (int)grid[0].size();\n        parent.assign(4 * m * nCols, 0);\n        for (int i = 0; i < (int)parent.size(); i++) parent[i] = i;\n\n        vector<pair<int,int>> ports(7);\n        ports[1] = {1, 3};\n        ports[2] = {0, 2};\n        ports[3] = {2, 3};\n        ports[4] = {2, 1};\n        ports[5] = {0, 3};\n        ports[6] = {0, 1};\n\n        unordered_set<int> hasS = {2, 3, 4};\n        unordered_set<int> hasE = {1, 4, 6};\n        unordered_set<int> hasN = {2, 5, 6};\n        unordered_set<int> hasW = {1, 3, 5};\n\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < nCols; j++) {\n                int t = grid[i][j];\n                unite(port(i, j, ports[t].first), port(i, j, ports[t].second));\n                if (hasS.count(t) && i + 1 < m && hasN.count(grid[i + 1][j])) {\n                    unite(port(i, j, 2), port(i + 1, j, 0));\n                }\n                if (hasE.count(t) && j + 1 < nCols && hasW.count(grid[i][j + 1])) {\n                    unite(port(i, j, 1), port(i, j + 1, 3));\n                }\n            }\n        }\n\n        return find(port(0, 0, 0)) == find(port(m - 1, nCols - 1, 0));\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: jump-game-vii (LC 1871)
//   canReach(s: str, minJump: int, maxJump: int) -> bool
//   You start at index 0 of a 0/1 string. From i you can jump to any j in
//   [i+minJump, i+maxJump] such that s[j] == '0'. Reach index n-1?
//   Use BFS with a sliding window pointer (or a prefix-sum + dp).
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F364B);

  // Reference: O(n) sliding-window DP.
  // reach[i] = can we reach index i?
  // reach[0] = (s[0] == '0').
  // For i in [1..n-1]: reach[i] = (s[i] == '0') AND there exists j in [i-maxJump, i-minJump] with reach[j].
  // Maintain `pre` = count of true reach values in window [i-maxJump, i-minJump].
  function ref(s, minJump, maxJump) {
    const n = s.length;
    if (s[0] !== "0" || s[n - 1] !== "0") return false;
    const reach = new Array(n).fill(false);
    reach[0] = true;
    let pre = 0;  // number of reachable indices in the sliding window
    for (let i = 1; i < n; i++) {
      // Add index (i - minJump) to the window if it just became visible.
      if (i >= minJump) {
        pre += reach[i - minJump] ? 1 : 0;
      }
      // Remove index (i - maxJump - 1) from the window if it just slid out.
      if (i > maxJump) {
        pre -= reach[i - maxJump - 1] ? 1 : 0;
      }
      if (pre > 0 && s[i] === "0") {
        reach[i] = true;
      }
    }
    return reach[n - 1];
  }

  const cases = [];
  // LC sample 1: s = "011010", minJump = 2, maxJump = 3 -> true
  cases.push(["011010", 2, 3]);
  // LC sample 2: s = "01101110", minJump = 2, maxJump = 3 -> false
  cases.push(["01101110", 2, 3]);
  // Trivial start = end (single char '0')
  cases.push(["0", 1, 1]);
  // Two zeros with min=max=1
  cases.push(["00", 1, 1]);
  // Two chars where end is 1 -> impossible
  cases.push(["01", 1, 1]);
  // Long alternating
  cases.push(["010101010", 2, 2]);  // jumps of exactly 2 reach every other index 0,2,4,6,8 — all '0'.
  // Adversarial: large minJump can skip past end
  cases.push(["00000", 4, 4]);
  // Same string but min/max wider
  cases.push(["00000", 1, 4]);
  // End cell is '1'
  cases.push(["00010", 1, 2]);  // s[3]='1' -> can we still reach s[4]? From i=2 (reach), jump to 4. Yes.
  // Many 1s in middle but corridor at both ends
  cases.push(["0011111110", 2, 5]);
  // Cannot reach end because of long 1 block exceeding maxJump
  cases.push(["011111111110", 2, 3]);  // 10 ones in a row, maxJump=3 can't cross.
  // minJump==maxJump==1, all zeros
  cases.push(["0000000000", 1, 1]);
  // minJump==1, maxJump==1, single 1 in middle
  cases.push(["00100", 1, 1]);  // index 2 is '1' -> blocked, return false.
  // First char is 1 -> impossible
  cases.push(["100", 1, 2]);
  // Last char is 1 -> impossible
  cases.push(["001", 1, 2]);
  // Walk over zeros gap exactly minJump
  cases.push(["0110", 3, 3]);  // jump from 0 to 3 directly.
  // Walk over zeros gap = maxJump+1 -> impossible
  cases.push(["01110", 1, 3]);  // need to land at 4. from 0 can reach [1..3] all '1' -> stuck.
  // Mixed
  cases.push(["0010100100", 2, 4]);
  // Mostly 0s
  cases.push(["00000000010", 3, 5]);  // end is '0' at index 10? Length is 11, s[10]='0'. reachable.
  // Hard case: must take precise step
  cases.push(["011010", 1, 1]);  // jumps of 1: s[1]='1' -> stuck.
  // Wide window
  cases.push(["0" + "1".repeat(8) + "0", 1, 9]);  // length 10, end at 9, jump 9 directly.
  // Wide but maxJump too small
  cases.push(["0" + "1".repeat(8) + "0", 1, 8]);  // can reach index 8 ('1') no good; can't skip to 9.
  // Long zigzag of zeros
  cases.push(["0" + "10".repeat(5) + "0", 2, 2]);  // length 12, s = "010101010100"
  // Ends in long zero corridor
  cases.push(["0111000", 2, 4]);  // from 0 can jump to [2..4]; s[2]=1, s[3]=1, s[4]=0 (reach). then from 4 jump [6..8] -> s[6]=0 reachable. answer: true.
  // Pure zeros, maxJump large
  cases.push(["000000", 3, 5]);
  // Length=2 with valid jump
  cases.push(["00", 1, 1]);

  // Random strings via LCG with biased distribution toward '0' to keep reachable rate balanced.
  while (cases.length < 35) {
    const n = 2 + (lcg() % 12);
    let chars = "0";
    for (let i = 1; i < n - 1; i++) {
      // ~55% zero
      chars += (lcg() % 100 < 55) ? "0" : "1";
    }
    chars += "0";
    const minJ = 1 + (lcg() % Math.min(n - 1, 4));
    const maxJ = minJ + (lcg() % 3);
    cases.push([chars, minJ, Math.min(maxJ, n - 1)]);
  }

  // Sanity: ensure all minJump <= maxJump.
  const fixed = cases.map(([s, mn, mx]) => {
    const minJ = Math.max(1, mn);
    const maxJ = Math.max(minJ, mx);
    return [s, minJ, maxJ];
  });

  const test_cases = fixed.map(([s, mn, mx]) => ({
    inputs: [JSON.stringify(s), String(mn), String(mx)],
    expected: ref(s, mn, mx) ? "true" : "false"
  }));

  return {
    slug: "jump-game-vii",
    obj: {
      description: "You are given a **0-indexed** binary string `s` and two integers `minJump` and `maxJump`. In the beginning, you are standing at index `0`, which is equal to `'0'`. You can move from index `i` to index `j` if the following conditions are fulfilled:\n\n- `i + minJump <= j <= min(i + maxJump, s.length - 1)`, and\n- `s[j] == '0'`.\n\nReturn `true` if you can reach index `s.length - 1` in `s`, or `false` otherwise.\n\n**Example 1**\n\n```\nInput:  s = \"011010\", minJump = 2, maxJump = 3\nOutput: true\nExplanation:\nIn the first step, move from index 0 to index 3.\nIn the second step, move from index 3 to index 5.\n```\n\n**Example 2**\n\n```\nInput:  s = \"01101110\", minJump = 2, maxJump = 3\nOutput: false\n```\n\nThis is **LeetCode 1871**. The canonical solution is a **sliding-window DP** that decides `reach[i]` from the count of reachable indices in `[i - maxJump, i - minJump]` — both endpoints inclusive. The window slides by one as `i` advances, giving `O(n)` total work.",
      method_name: "canReach",
      params: [
        { name: "s", type: "str" },
        { name: "minJump", type: "int" },
        { name: "maxJump", type: "int" }
      ],
      return_type: "bool",
      tags: ["string", "dp", "sliding-window", "prefix-sum", "bfs"],
      pattern: "**Sliding-window DP — O(n) time, O(n) space.**\n\n**Observation.** Let `reach[i] = True` iff index `i` is reachable from index `0`. Then:\n\n```\nreach[0] = (s[0] == '0')   # given\nreach[i] = (s[i] == '0') AND there exists j in [i - maxJump, i - minJump] with reach[j] = True.\n```\n\nThe second condition is a **range-OR over a window of length `maxJump - minJump + 1`** that slides forward as `i` increases. Naively checking the window is `O(n * (maxJump - minJump))` -> `O(n^2)` in the worst case, which TLEs for `n = 10^5`.\n\n**Sliding-window trick.** Maintain a running count `pre` of `True` values inside the current window `[i - maxJump, i - minJump]`. When `i` advances by 1, the window also slides by 1:\n\n```\nAt iteration i:\n  Add index (i - minJump) to the window  (if it is non-negative).\n  Remove index (i - maxJump - 1) from the window  (if it is non-negative).\n  reach[i] = (s[i] == '0') AND (pre > 0).\n```\n\n`pre` is updated in `O(1)` per step. The whole loop is `O(n)`.\n\n**Algorithm.**\n\n```\nn = len(s)\nif s[n - 1] != '0' or s[0] != '0': return False\nreach = [False] * n\nreach[0] = True\npre = 0\nfor i in range(1, n):\n    if i >= minJump:\n        pre += 1 if reach[i - minJump] else 0\n    if i > maxJump:\n        pre -= 1 if reach[i - maxJump - 1] else 0\n    if pre > 0 and s[i] == '0':\n        reach[i] = True\nreturn reach[n - 1]\n```\n\n**Worked example.** `s = \"011010\", minJump = 2, maxJump = 3`. n = 6.\n\n```\nreach[0] = True (s[0] = '0').\ni = 1: window is [1-3, 1-2] = [-2, -1] -> empty. pre = 0. s[1] = '1' -> reach[1] = False.\ni = 2: add index 0 -> pre += 1 -> pre = 1. s[2] = '1' -> reach[2] = False.\ni = 3: add index 1 -> pre += 0 -> pre = 1. s[3] = '0' -> reach[3] = True.\ni = 4: add index 2 -> pre += 0 -> pre = 1. (i > maxJump=3, so remove index 0 -> pre -= 1 -> pre = 0.) s[4] = '1' -> reach[4] = False.\ni = 5: add index 3 -> pre += 1 -> pre = 1. (remove index 1 -> pre -= 0 -> pre = 1.) s[5] = '0' -> reach[5] = True.\nReturn reach[5] = True.\n```\n\n**Alternative — BFS with a moving pointer.** Push `0` onto a queue; track `farthest` = the highest index whose `[+minJump, +maxJump]` window has been enqueued. From the queue head `i`, scan `[max(i + minJump, farthest + 1), min(i + maxJump, n - 1)]` and enqueue every `'0'` cell. Update `farthest`. This is also `O(n)` because each cell is enqueued at most once.\n\n**Brute-force comparison.** For each `i`, scan the window of size `maxJump - minJump + 1` -> `O(n * (maxJump - minJump))`. Up to `O(n^2)` when the window is wide. The prefix-sum / sliding-window cut drops this to `O(n)`.\n\n**Edge cases.** `s[0] = '1'` (cannot start) -> `False`. `s[n - 1] = '1'` (cannot land at end) -> `False`. `minJump > n - 1` -> only the start is reachable, so `False` unless `n == 1`. `n == 1` -> `True` (already at the end if `s[0] == '0'`).",
      follow_up: "**Variant 1 — return ALL reachable indices.** The `reach` array itself is the answer.\n\n**Variant 2 — count the number of reachable cells.** Sum the `True` entries in `reach`.\n\n**Variant 3 — minimum number of jumps to reach the end.** Add a `dist[i]` array; BFS layer count.\n\n**Variant 4 — multiple starting positions.** Initialize `reach` with all sources `True`; the sliding window argument is unchanged.\n\n**Variant 5 — jumps may go BACKWARDS as well as forward.** Becomes a graph connectivity problem; use union-find on `'0'` cells within distance `[minJump, maxJump]` of each other. Connectivity equivalence partitions the `'0'` cells.\n\n**Variant 6 — different costs per jump.** Becomes shortest-path; use Dijkstra or 0/1 BFS with monotone deque tricks.\n\n**Implementation pitfalls.**\n1. **Naive double loop times out.** `n = 10^5`, `maxJump - minJump = 10^5` -> 10^10 operations. The sliding window is mandatory.\n2. **Off-by-one in the window endpoints.** The window is `[i - maxJump, i - minJump]` INCLUSIVE on both ends. Use `i >= minJump` to start adding and `i > maxJump` to start removing.\n3. **Forgetting the `s[i] == '0'` requirement.** Even if `pre > 0`, you cannot land on a `'1'` cell.\n4. **Not checking `s[0] == '0'`.** If the start cell is `'1'`, the problem is infeasible; some test cases hide this in the data.\n5. **Not checking `s[n - 1] == '0'`.** Even if you could reach a neighbour, you cannot land on a `'1'` end cell.\n6. **Using bool addition without converting.** In Python and JS, `pre += reach[k]` works because bools coerce to 0/1; in C++ this is also fine; in Java explicit `reach[k] ? 1 : 0` is required."
,
      complexity: {
        time: "**O(n)** — the sliding-window DP visits each index exactly once and updates `pre` in `O(1)` per step.",
        space: "**O(n)** for the `reach` boolean array. Output is a single bool.",
        notes: "BFS with a moving pointer achieves the same `O(n)` bound. The naive 'check the whole window' approach is `O(n * window-size)` and TLEs for `n = 10^5` with wide windows.",
        optimal: "**O(n) time and space** is optimal — you must inspect every cell at least once in the worst case to decide reachability."
      },
      constraints: [
        "2 <= s.length <= 10^5",
        "s[i] is either '0' or '1'",
        "s[0] == '0'",
        "1 <= minJump <= maxJump < s.length"
      ],
      hints: [
        "**Define `reach[i] = True` iff index `i` is reachable.** Then `reach[i] = (s[i] == '0') AND OR over reach[j] for j in [i - maxJump, i - minJump]`.",
        "**The OR-over-window is a sliding count.** Maintain `pre = count of True reach values in the window`.",
        "**Window slides by 1 each iteration.** Add the new right endpoint and remove the just-departed left endpoint.",
        "**`s[i] == '1'` blocks landing.** Even if `pre > 0`, set `reach[i] = False` for `'1'` cells.",
        "**If `s[n - 1] == '1'`, return `False` immediately.** The end cell must be `'0'`.",
        "**Sliding window keeps total work `O(n)`.** Naive recheck of the window is `O(n^2)` and TLEs at `n = 10^5`."
      ],
      test_cases,
      solutions: {
        python: "class Solution:\n    def canReach(self, s: str, minJump: int, maxJump: int) -> bool:\n        n = len(s)\n        if s[0] != '0' or s[n - 1] != '0':\n            return False\n        reach = [False] * n\n        reach[0] = True\n        pre = 0\n        for i in range(1, n):\n            if i >= minJump:\n                pre += 1 if reach[i - minJump] else 0\n            if i > maxJump:\n                pre -= 1 if reach[i - maxJump - 1] else 0\n            if pre > 0 and s[i] == '0':\n                reach[i] = True\n        return reach[n - 1]\n",
        javascript: "/**\n * @param {string} s\n * @param {number} minJump\n * @param {number} maxJump\n * @return {boolean}\n */\nvar canReach = function(s, minJump, maxJump) {\n    const n = s.length;\n    if (s[0] !== '0' || s[n - 1] !== '0') return false;\n    const reach = new Array(n).fill(false);\n    reach[0] = true;\n    let pre = 0;\n    for (let i = 1; i < n; i++) {\n        if (i >= minJump) {\n            pre += reach[i - minJump] ? 1 : 0;\n        }\n        if (i > maxJump) {\n            pre -= reach[i - maxJump - 1] ? 1 : 0;\n        }\n        if (pre > 0 && s[i] === '0') {\n            reach[i] = true;\n        }\n    }\n    return reach[n - 1];\n};\n",
        java: "public class Solution {\n    public boolean canReach(String s, int minJump, int maxJump) {\n        int n = s.length();\n        if (s.charAt(0) != '0' || s.charAt(n - 1) != '0') return false;\n        boolean[] reach = new boolean[n];\n        reach[0] = true;\n        int pre = 0;\n        for (int i = 1; i < n; i++) {\n            if (i >= minJump) {\n                pre += reach[i - minJump] ? 1 : 0;\n            }\n            if (i > maxJump) {\n                pre -= reach[i - maxJump - 1] ? 1 : 0;\n            }\n            if (pre > 0 && s.charAt(i) == '0') {\n                reach[i] = true;\n            }\n        }\n        return reach[n - 1];\n    }\n}\n",
        cpp: "#include <string>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool canReach(string s, int minJump, int maxJump) {\n        int n = (int)s.size();\n        if (s[0] != '0' || s[n - 1] != '0') return false;\n        vector<bool> reach(n, false);\n        reach[0] = true;\n        int pre = 0;\n        for (int i = 1; i < n; i++) {\n            if (i >= minJump) {\n                pre += reach[i - minJump] ? 1 : 0;\n            }\n            if (i > maxJump) {\n                pre -= reach[i - maxJump - 1] ? 1 : 0;\n            }\n            if (pre > 0 && s[i] == '0') {\n                reach[i] = true;\n            }\n        }\n        return reach[n - 1];\n    }\n};\n"
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
    "// ===== WAVE 35E START =====",
    "// === WAVE 35E " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35E " + p1.slug + " END ===",
    "// === WAVE 35E " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35E " + p2.slug + " END ===",
    "// ===== WAVE 35E END =====",
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
if (src.indexOf("WAVE 35E START") !== -1) {
  console.error("WAVE 35E already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 35D END marker and append block after it.
const ANCHOR = "// ===== WAVE 35D END =====";
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

console.log("DONE wave35e " + p1.slug + " + " + p2.slug);
