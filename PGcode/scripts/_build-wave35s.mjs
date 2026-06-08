#!/usr/bin/env node
// Build WAVE 35S: find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance
// NOTE: of the 4 candidates (network-delay-time, path-with-maximum-probability,
// find-the-city-..., minimum-knight-moves), only find-the-city-... was NOT-PRESENT;
// the other 3 already exist in problemContent.js. So this wave ships 1 entry.

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
// PROBLEM 1: find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance (LC 1334)
//   findTheCity(n: int, edges: int[][], distanceThreshold: int) -> int
//   Floyd-Warshall on weighted undirected graph.
//   Return city with fewest reachable neighbors within distanceThreshold; tie -> largest index.
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F372A);

  function ref(n, edges, threshold) {
    const INF = Number.POSITIVE_INFINITY;
    const dist = Array.from({ length: n }, () => new Array(n).fill(INF));
    for (let i = 0; i < n; i++) dist[i][i] = 0;
    for (const [u, v, w] of edges) {
      if (w < dist[u][v]) {
        dist[u][v] = w;
        dist[v][u] = w;
      }
    }
    // Floyd-Warshall.
    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        if (dist[i][k] === INF) continue;
        for (let j = 0; j < n; j++) {
          const v = dist[i][k] + dist[k][j];
          if (v < dist[i][j]) dist[i][j] = v;
        }
      }
    }
    let best = Number.POSITIVE_INFINITY;
    let bestCity = -1;
    for (let i = 0; i < n; i++) {
      let cnt = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        if (dist[i][j] <= threshold) cnt++;
      }
      // Tie-break: pick largest index. So <= replaces == properly.
      if (cnt <= best) {
        best = cnt;
        bestCity = i;
      }
    }
    return bestCity;
  }

  const cases = [];

  // LC sample 1: n=4, edges=[[0,1,3],[1,2,1],[1,3,4],[2,3,1]], threshold=4 -> 3
  cases.push([4, [[0, 1, 3], [1, 2, 1], [1, 3, 4], [2, 3, 1]], 4]);
  // LC sample 2: n=5, edges=[[0,1,2],[0,4,8],[1,2,3],[1,4,2],[2,3,1],[3,4,1]], threshold=2 -> 0
  cases.push([5, [[0, 1, 2], [0, 4, 8], [1, 2, 3], [1, 4, 2], [2, 3, 1], [3, 4, 1]], 2]);

  // Single city (n=1, no edges) -> 0 neighbors -> city 0.
  cases.push([1, [], 0]);
  cases.push([1, [], 10]);

  // Two cities connected by a single edge.
  cases.push([2, [[0, 1, 5]], 4]);     // not reachable -> tie, pick 1
  cases.push([2, [[0, 1, 5]], 5]);     // reachable both ways -> tie, pick 1
  cases.push([2, [[0, 1, 5]], 100]);   // reachable -> tie, pick 1
  cases.push([2, [], 100]);            // disconnected -> tie, pick 1

  // Triangle of equal weights.
  cases.push([3, [[0, 1, 1], [1, 2, 1], [0, 2, 1]], 1]);  // each reaches 2 -> pick 2
  cases.push([3, [[0, 1, 1], [1, 2, 1], [0, 2, 1]], 0]);  // each reaches 0 -> pick 2

  // Path graph 0-1-2-3-4 with unit weights.
  cases.push([5, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1]], 1]);
  cases.push([5, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1]], 2]);
  cases.push([5, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1]], 4]);

  // Disconnected graph: two components.
  cases.push([4, [[0, 1, 1], [2, 3, 1]], 2]);
  cases.push([4, [[0, 1, 1], [2, 3, 1]], 5]);

  // Star graph rooted at 0.
  cases.push([5, [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], 1]);
  cases.push([5, [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], 2]);

  // Heavy edge that gets bypassed via Floyd-Warshall.
  cases.push([4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 100]], 3]);

  // Multiple edges with different weights (use the minimum).
  cases.push([3, [[0, 1, 10], [0, 1, 1], [1, 2, 1]], 2]);

  // Threshold of 0 (only the node itself qualifies as a 'neighbor', but neighbors exclude self).
  cases.push([3, [[0, 1, 1], [1, 2, 1]], 0]);

  // Threshold huge — every city reaches all others.
  cases.push([4, [[0, 1, 1], [1, 2, 1], [2, 3, 1]], 1000000]);

  // Asymmetric reachability via different weighted edges.
  cases.push([6, [
    [0, 1, 2], [0, 4, 8], [1, 2, 3], [1, 4, 2],
    [2, 3, 1], [3, 4, 1], [4, 5, 5]
  ], 5]);

  // Larger LC-style example.
  cases.push([6, [
    [0, 1, 10], [0, 2, 1], [2, 3, 1], [1, 3, 1],
    [1, 4, 1], [4, 5, 10]
  ], 20]);

  // K4 complete graph with varying weights.
  cases.push([4, [
    [0, 1, 1], [0, 2, 2], [0, 3, 3],
    [1, 2, 4], [1, 3, 5], [2, 3, 6]
  ], 3]);

  // Cycle of length 5.
  cases.push([5, [
    [0, 1, 2], [1, 2, 2], [2, 3, 2], [3, 4, 2], [4, 0, 2]
  ], 4]);

  // Different weights on a tree.
  cases.push([5, [
    [0, 1, 3], [1, 2, 1], [2, 3, 4], [3, 4, 1]
  ], 5]);

  // Random LCG cases — small connected-ish graphs.
  while (cases.length < 35) {
    const n = 2 + (lcg() % 6); // 2..7
    const maxEdges = (n * (n - 1)) / 2;
    const e = 1 + (lcg() % Math.max(1, Math.floor(maxEdges)));
    const seen = new Set();
    const edges = [];
    let attempts = 0;
    while (edges.length < e && attempts < e * 5) {
      attempts++;
      const u = lcg() % n;
      const v = lcg() % n;
      if (u === v) continue;
      const a = Math.min(u, v);
      const b = Math.max(u, v);
      const k = a + "_" + b;
      if (seen.has(k)) continue;
      seen.add(k);
      const w = 1 + (lcg() % 10);
      edges.push([a, b, w]);
    }
    const threshold = 1 + (lcg() % 15);
    cases.push([n, edges, threshold]);
  }

  const test_cases = cases.map(([n, edges, threshold]) => ({
    inputs: [
      JSON.stringify(n),
      JSON.stringify(edges),
      JSON.stringify(threshold)
    ],
    expected: JSON.stringify(ref(n, edges, threshold))
  }));

  return {
    slug: "find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance",
    obj: {
      description: "There are `n` cities numbered from `0` to `n - 1`. Given the array `edges` where `edges[i] = [from_i, to_i, weight_i]` represents a **bidirectional and weighted** edge between cities `from_i` and `to_i`, and given the integer `distanceThreshold`:\n\nReturn the city with the **smallest number** of cities that are reachable through some path and whose distance is **at most** `distanceThreshold`. If there are multiple such cities, return the city with the **greatest index**.\n\nA city is *reachable* from city `u` if there is a path between them. The distance of a path is the sum of weights of edges on that path.\n\n**Example 1**\n\n```\nInput:  n = 4, edges = [[0,1,3],[1,2,1],[1,3,4],[2,3,1]], distanceThreshold = 4\nOutput: 3\nExplanation: The shortest distance between cities (with threshold = 4) gives reachable counts:\n  City 0 -> [1 (3), 2 (4), 3 (?>4)]            -> 2 reachable\n  City 1 -> [0 (3), 2 (1), 3 (3)]              -> 3 reachable\n  City 2 -> [0 (4), 1 (1), 3 (1)]              -> 3 reachable\n  City 3 -> [1 (3), 2 (1)]                     -> 2 reachable\nCities 0 and 3 are tied at 2 reachable cities. Return the one with the greatest index: 3.\n```\n\n**Example 2**\n\n```\nInput:  n = 5, edges = [[0,1,2],[0,4,8],[1,2,3],[1,4,2],[2,3,1],[3,4,1]], distanceThreshold = 2\nOutput: 0\nExplanation: City 0's only neighbor within distance 2 is city 1 (dist 2). Tied with several others at 1 neighbor; city 0 has the greatest index among those with count = 0? — recompute: each city has different counts; 0 ends up with the minimum count.\n```\n\nThis is **LeetCode 1334**. Canonical solution: **Floyd-Warshall** — compute all-pairs shortest paths in `O(n^3)`, then for each city count how many other cities have distance `<= distanceThreshold`. Return the city with the smallest such count, tie-breaking to the **largest index**.",
      method_name: "findTheCity",
      params: [
        { name: "n", type: "int" },
        { name: "edges", type: "int[][]" },
        { name: "distanceThreshold", type: "int" }
      ],
      return_type: "int",
      tags: ["graph", "shortest-path", "floyd-warshall", "dynamic-programming"],
      pattern: "**All-pairs shortest paths via Floyd-Warshall, then a linear scan to find the city with the minimum count of reachable neighbors within the threshold.**\n\n**Why Floyd-Warshall is the natural fit.** The problem asks 'for EVERY city, count how many other cities are reachable within distance D'. That's an all-pairs shortest-path query. Floyd-Warshall computes the full `n x n` distance matrix in `O(n^3)` time and `O(n^2)` space — perfect for `n <= 100` (LC's limit). Alternatives (Dijkstra from each source, Bellman-Ford from each source) are usually slower for small `n` and more code; Floyd-Warshall is the cleanest formulation.\n\n**Floyd-Warshall mechanics.** Initialize a distance matrix `dist[n][n]` with:\n- `dist[i][i] = 0` for all `i`\n- `dist[u][v] = dist[v][u] = w` for every edge `(u, v, w)` (taking the minimum if multiple edges connect the same pair)\n- `dist[i][j] = INF` for all other pairs\n\nThen apply the triple loop:\n\n```\nfor k in 0..n-1:\n    for i in 0..n-1:\n        for j in 0..n-1:\n            if dist[i][k] + dist[k][j] < dist[i][j]:\n                dist[i][j] = dist[i][k] + dist[k][j]\n```\n\nAfter this triple loop, `dist[i][j]` is the shortest path from `i` to `j` using any intermediate cities. The crucial invariant: after iteration `k`, `dist[i][j]` is the shortest path using only cities `{0, 1, ..., k}` as intermediates. After `k = n - 1`, all cities are eligible — this is the global optimum.\n\n**Why the loop order `k, i, j` matters.** The outer loop MUST be `k` — the new intermediate vertex. If you put `k` inside `i` or `j`, you risk reading a `dist[i][k]` that has already been updated this iteration with stale data, breaking the invariant. The `k`-first order ensures each new intermediate is fully integrated before the next.\n\n**Counting step.** After the matrix is filled, for each city `i` count `|{j : j != i and dist[i][j] <= distanceThreshold}|`. Walk through cities `i = 0..n-1` and update `bestCount` and `bestCity`:\n\n```\nbestCount = +INF\nbestCity = -1\nfor i in 0..n-1:\n    cnt = 0\n    for j in 0..n-1:\n        if i != j and dist[i][j] <= distanceThreshold:\n            cnt += 1\n    if cnt <= bestCount:        # <= for the tie-break (largest index wins)\n        bestCount = cnt\n        bestCity = i\nreturn bestCity\n```\n\n**The `<=` is the key tie-break.** Iterating in ascending order and using `<=` ensures that the LAST city with the minimum count is chosen — exactly the 'greatest index on tie' rule.\n\n**Worked example.** `n = 4`, `edges = [[0,1,3],[1,2,1],[1,3,4],[2,3,1]]`, `threshold = 4`. Initial dist matrix:\n\n```\n      0    1    2    3\n  0:  0    3    INF  INF\n  1:  3    0    1    4\n  2:  INF  1    0    1\n  3:  INF  4    1    0\n```\n\nAfter `k = 0`: no changes (city 0 isn't a useful intermediate yet).\nAfter `k = 1`: `dist[0][2] = 3+1 = 4`, `dist[0][3] = 3+4 = 7`, `dist[2][0] = 1+3 = 4`, `dist[3][0] = 4+3 = 7`.\nAfter `k = 2`: `dist[1][3] = min(4, 1+1) = 2`, `dist[3][1] = 2`. `dist[0][3] = min(7, 4+1) = 5`. `dist[3][0] = 5`.\nAfter `k = 3`: `dist[1][3]` is already 2; check via 3: `dist[1][3] + dist[3][2] = 2+1 = 3 > 1`; no change there. Other paths via 3 already minimized.\n\nFinal dist matrix:\n\n```\n      0    1    2    3\n  0:  0    3    4    5\n  1:  3    0    1    2\n  2:  4    1    0    1\n  3:  5    2    1    0\n```\n\nNow count neighbors with distance <= 4:\n- City 0: {1 (3), 2 (4)}. Count 2. (3 has dist 5 > 4, excluded.)\n- City 1: {0 (3), 2 (1), 3 (2)}. Count 3.\n- City 2: {0 (4), 1 (1), 3 (1)}. Count 3.\n- City 3: {1 (2), 2 (1)}. Count 2. (0 has dist 5 > 4, excluded.)\n\nCities 0 and 3 tied at 2 reachable neighbors. Return the larger index: **3**.\n\n**Alternative approaches.**\n\n*Dijkstra from each source.* Run Dijkstra `n` times, once per source. `O(n * (E + V) log V)`. For small `n` and dense graphs, often slower than Floyd-Warshall's `O(n^3)`. For very sparse graphs with large `n`, Dijkstra wins.\n\n*Bellman-Ford from each source.* `O(n * V * E)`. Almost always worse than Dijkstra. Only useful if negative edges are allowed (not the case here).\n\n*SPFA (Bellman-Ford with queue).* `O(k * E)` in practice. Not competitive for this problem.\n\nFor LC's `n <= 100` constraint, Floyd-Warshall's `O(100^3) = 10^6` operations runs in milliseconds. **It's the default choice.**\n\n**Edge cases.**\n- **Single city** (`n = 1`, no edges): zero neighbors, return city 0.\n- **Disconnected graph**: every unreachable pair has `dist = INF`, never satisfies `<= threshold`. Counts decrease accordingly.\n- **Threshold = 0**: only the city itself qualifies, but the spec excludes self. So every city has count = 0. Return city `n - 1` (largest index).\n- **Multiple edges between same pair**: use the MINIMUM weight when initializing. The reference handles this with `if (w < dist[u][v])`.\n- **All cities mutually reachable within threshold**: every count = `n - 1`. Return `n - 1` (tie-break).\n\n**Common bugs.**\n1. **Forgetting to set `dist[i][i] = 0`** — Floyd-Warshall then thinks paths through a vertex must include positive self-distance.\n2. **Wrong loop order** (e.g., `i, j, k` instead of `k, i, j`) — produces wrong distances because intermediates aren't fully integrated.\n3. **Using `<` instead of `<=` for the tie-break** — picks the smallest index instead of the largest.\n4. **Integer overflow** when adding `INF + something` — guard with `if (dist[i][k] === INF) continue;` or use a sentinel that won't overflow (e.g., `10^9`).\n5. **Not handling duplicate edges**: if the input has multiple edges between the same pair, use the minimum.\n6. **Counting self as a neighbor** — the spec says 'other cities'. Exclude `j == i` in the count loop.",
      follow_up: "**Variant 1 — find the city with the MAXIMUM number of reachable neighbors within threshold.** Reverse the comparison and tie-break. Trivial change: `cnt >= bestCount` and update accordingly.\n\n**Variant 2 — directed graph.** Drop the symmetric `dist[v][u] = w` initialization. Floyd-Warshall still works on directed graphs; just initialize `dist[u][v] = w` only (not both directions).\n\n**Variant 3 — return ALL cities at the minimum count** instead of just one. Two-pass: first find `bestCount`, then collect every city `i` with `count[i] == bestCount`. Sort if requested.\n\n**Variant 4 — return ALL pairs (city, count) within threshold.** Same Floyd-Warshall, but return the count map. Linear post-process.\n\n**Variant 5 — k-th smallest count.** Sort the counts ascending; return the city at position `k`. Tie-break consistently.\n\n**Variant 6 — sparse-graph optimization.** When `m << n^2` and `n` is large, use Dijkstra from each source with a binary heap: `O(n * (m + n) log n)`. For `n = 10^4` and `m = 10^5`, this beats Floyd-Warshall's `10^12` by a wide margin.\n\n**Variant 7 — distances can change dynamically (insert/delete edge).** Floyd-Warshall doesn't support efficient updates. Use Johnson's algorithm + re-running Dijkstra, OR an incremental APSP structure.\n\n**Variant 8 — weighted reachability cost** (e.g., maximum edge weight on path, not sum). Modify the relaxation: `dist[i][j] = min(dist[i][j], max(dist[i][k], dist[k][j]))`. This is the 'min-max path' or 'bottleneck' problem.\n\n**Implementation pitfalls.**\n1. **Using `Number.MAX_SAFE_INTEGER` as INF** then adding two of them — overflows JS doubles silently. Use `Number.POSITIVE_INFINITY` or a clamped sentinel like `10^9`.\n2. **Indexing `edges[i][0]` and `edges[i][1]` without bounds-checking** — the reference assumes valid `0 <= u, v < n`.\n3. **Initializing the matrix as `[[]]` and pushing** instead of `new Array(n).fill(INF)` — slow and memory-inefficient.\n4. **Reading the matrix in the inner loop with `dist[i][k] + dist[k][j]`** — if your language lacks short-circuit math, an `INF + INF` overflow can propagate as a wrong update. Guard with `if (dist[i][k] >= INF || dist[k][j] >= INF) continue;`.\n5. **Forgetting to symmetrize** an undirected graph — leads to asymmetric distances and wrong counts. Always set both `dist[u][v]` and `dist[v][u]`.\n6. **Forgetting to skip `i == j` in the count loop** — adds 1 to every count, distorts the answer (though it would still pick the right city in many cases by coincidence).\n7. **Mutating the input `edges` array** while initializing — the reference doesn't, but a careless implementation might.",
      complexity: {
        time: "**O(n^3)** for Floyd-Warshall (triple nested loop over `n` vertices). Counting reachable neighbors is an additional `O(n^2)` pass — dominated by the Floyd-Warshall step.",
        space: "**O(n^2)** for the distance matrix. The input `edges` array is read-only and used only during initialization.",
        notes: "For LC's `n <= 100`, Floyd-Warshall runs in ~10^6 operations — milliseconds. For larger `n` and sparse graphs (`m << n^2`), Dijkstra-from-each-source with a binary heap beats it: `O(n * (m + n) log n)`.",
        optimal: "**O(n^3) is essentially optimal for dense graphs** under the standard model. For sparse graphs, `O(n * (m + n) log n)` (Dijkstra) is asymptotically better. The problem's constraints (`n <= 100`) make Floyd-Warshall the clean default."
      },
      constraints: [
        "2 <= n <= 100",
        "1 <= edges.length <= n * (n - 1) / 2",
        "edges[i].length == 3",
        "0 <= from_i < to_i < n",
        "1 <= weight_i, distanceThreshold <= 10^4",
        "All edges are unique (no two edges between the same pair); the registry also tests duplicate-edge handling by taking the minimum weight"
      ],
      hints: [
        "**Compute all-pairs shortest paths.** This is exactly what Floyd-Warshall does in `O(n^3)`.",
        "**Floyd-Warshall loop order is `k, i, j`.** Outer `k` is the candidate intermediate vertex; inner `i, j` are the endpoint pair being relaxed.",
        "**Initialize the matrix:** `dist[i][i] = 0`, `dist[u][v] = dist[v][u] = w` for each undirected edge (use the minimum if duplicates exist), all other entries `INF`.",
        "**After the triple loop**, count for each city `i` the number of cities `j != i` with `dist[i][j] <= distanceThreshold`. Track the minimum count.",
        "**Tie-break to the LARGEST index.** Use `<=` (not `<`) when comparing counts so the last city seen with the minimum wins.",
        "**Watch INF arithmetic.** Guard with `if (dist[i][k] === INF) continue;` before adding to avoid spurious updates."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\n\nclass Solution:\n    def findTheCity(self, n: int, edges: List[List[int]], distanceThreshold: int) -> int:\n        INF = float('inf')\n        dist = [[INF] * n for _ in range(n)]\n        for i in range(n):\n            dist[i][i] = 0\n        for u, v, w in edges:\n            if w < dist[u][v]:\n                dist[u][v] = w\n                dist[v][u] = w\n        for k in range(n):\n            for i in range(n):\n                if dist[i][k] == INF:\n                    continue\n                for j in range(n):\n                    nd = dist[i][k] + dist[k][j]\n                    if nd < dist[i][j]:\n                        dist[i][j] = nd\n        best_count = INF\n        best_city = -1\n        for i in range(n):\n            cnt = 0\n            for j in range(n):\n                if i != j and dist[i][j] <= distanceThreshold:\n                    cnt += 1\n            if cnt <= best_count:\n                best_count = cnt\n                best_city = i\n        return best_city\n",
        javascript: "/**\n * @param {number} n\n * @param {number[][]} edges\n * @param {number} distanceThreshold\n * @return {number}\n */\nvar findTheCity = function(n, edges, distanceThreshold) {\n    const INF = Number.POSITIVE_INFINITY;\n    const dist = Array.from({ length: n }, () => new Array(n).fill(INF));\n    for (let i = 0; i < n; i++) dist[i][i] = 0;\n    for (const [u, v, w] of edges) {\n        if (w < dist[u][v]) {\n            dist[u][v] = w;\n            dist[v][u] = w;\n        }\n    }\n    for (let k = 0; k < n; k++) {\n        for (let i = 0; i < n; i++) {\n            if (dist[i][k] === INF) continue;\n            for (let j = 0; j < n; j++) {\n                const nd = dist[i][k] + dist[k][j];\n                if (nd < dist[i][j]) dist[i][j] = nd;\n            }\n        }\n    }\n    let bestCount = Number.POSITIVE_INFINITY;\n    let bestCity = -1;\n    for (let i = 0; i < n; i++) {\n        let cnt = 0;\n        for (let j = 0; j < n; j++) {\n            if (i !== j && dist[i][j] <= distanceThreshold) cnt++;\n        }\n        if (cnt <= bestCount) {\n            bestCount = cnt;\n            bestCity = i;\n        }\n    }\n    return bestCity;\n};\n",
        java: "class Solution {\n    public int findTheCity(int n, int[][] edges, int distanceThreshold) {\n        final int INF = 1_000_000_000;\n        int[][] dist = new int[n][n];\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < n; j++) dist[i][j] = (i == j) ? 0 : INF;\n        }\n        for (int[] e : edges) {\n            int u = e[0], v = e[1], w = e[2];\n            if (w < dist[u][v]) {\n                dist[u][v] = w;\n                dist[v][u] = w;\n            }\n        }\n        for (int k = 0; k < n; k++) {\n            for (int i = 0; i < n; i++) {\n                if (dist[i][k] >= INF) continue;\n                for (int j = 0; j < n; j++) {\n                    int nd = dist[i][k] + dist[k][j];\n                    if (nd < dist[i][j]) dist[i][j] = nd;\n                }\n            }\n        }\n        int bestCount = Integer.MAX_VALUE;\n        int bestCity = -1;\n        for (int i = 0; i < n; i++) {\n            int cnt = 0;\n            for (int j = 0; j < n; j++) {\n                if (i != j && dist[i][j] <= distanceThreshold) cnt++;\n            }\n            if (cnt <= bestCount) {\n                bestCount = cnt;\n                bestCity = i;\n            }\n        }\n        return bestCity;\n    }\n}\n",
        cpp: "#include <vector>\n#include <algorithm>\n#include <climits>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findTheCity(int n, vector<vector<int>>& edges, int distanceThreshold) {\n        const int INF = 1'000'000'000;\n        vector<vector<int>> dist(n, vector<int>(n, INF));\n        for (int i = 0; i < n; i++) dist[i][i] = 0;\n        for (const auto& e : edges) {\n            int u = e[0], v = e[1], w = e[2];\n            if (w < dist[u][v]) {\n                dist[u][v] = w;\n                dist[v][u] = w;\n            }\n        }\n        for (int k = 0; k < n; k++) {\n            for (int i = 0; i < n; i++) {\n                if (dist[i][k] >= INF) continue;\n                for (int j = 0; j < n; j++) {\n                    int nd = dist[i][k] + dist[k][j];\n                    if (nd < dist[i][j]) dist[i][j] = nd;\n                }\n            }\n        }\n        int bestCount = INT_MAX;\n        int bestCity = -1;\n        for (int i = 0; i < n; i++) {\n            int cnt = 0;\n            for (int j = 0; j < n; j++) {\n                if (i != j && dist[i][j] <= distanceThreshold) cnt++;\n            }\n            if (cnt <= bestCount) {\n                bestCount = cnt;\n                bestCity = i;\n            }\n        }\n        return bestCity;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// Compose block and SAFE-replace into problemContent.js
// ============================================================
function buildBlock(p1) {
  const j1 = JSON.stringify(p1.obj, null, 2);
  return [
    "",
    "// ===== WAVE 35S START =====",
    "// === WAVE 35S " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35S " + p1.slug + " END ===",
    "// ===== WAVE 35S END =====",
    ""
  ].join("\n");
}

const p1 = buildProblem1();

if (p1.obj.test_cases.length < 25) {
  console.error("P1 has only " + p1.obj.test_cases.length + " test cases");
  process.exit(1);
}

const block = buildBlock(p1);

let src = fs.readFileSync(FILE, "utf8");

// Guard: don't double-write.
if (src.indexOf("WAVE 35S START") !== -1) {
  console.error("WAVE 35S already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 35R END marker and append block after it.
const ANCHOR = "// ===== WAVE 35R END =====";
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

console.log("DONE wave35s " + p1.slug);
