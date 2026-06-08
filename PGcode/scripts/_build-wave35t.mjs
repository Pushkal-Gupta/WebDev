#!/usr/bin/env node
// Build WAVE 35T: shortest-cycle-in-a-graph + minimum-time-to-collect-all-apples-in-a-tree

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
// PROBLEM 1: shortest-cycle-in-a-graph (LC 2608)
//   findShortestCycle(n: int, edges: int[][]) -> int
//   Undirected graph. Find length of shortest cycle, or -1 if none.
//   Canonical: BFS from each node; while exploring, if we meet an already-visited
//   node (not the parent), the cycle length is dist[u] + dist[v] + 1.
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F373A);

  function ref(n, edges) {
    const adj = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      adj[u].push(v);
      adj[v].push(u);
    }
    let best = Number.POSITIVE_INFINITY;
    for (let src = 0; src < n; src++) {
      const dist = new Array(n).fill(-1);
      const parent = new Array(n).fill(-1);
      dist[src] = 0;
      const q = [src];
      let head = 0;
      while (head < q.length) {
        const u = q[head++];
        for (const v of adj[u]) {
          if (dist[v] === -1) {
            dist[v] = dist[u] + 1;
            parent[v] = u;
            q.push(v);
          } else if (v !== parent[u]) {
            const cycleLen = dist[u] + dist[v] + 1;
            if (cycleLen < best) best = cycleLen;
          }
        }
      }
    }
    return best === Number.POSITIVE_INFINITY ? -1 : best;
  }

  const cases = [];

  // LC sample 1: n=7, edges=[[0,1],[1,2],[2,0],[3,4],[4,5],[5,6],[6,3]] -> 3
  cases.push([7, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 6], [6, 3]]]);
  // LC sample 2: n=4, edges=[[0,1],[0,2]] -> -1
  cases.push([4, [[0, 1], [0, 2]]]);

  // Empty graph: no edges, no cycle.
  cases.push([1, []]);
  cases.push([2, []]);
  cases.push([5, []]);

  // Tree (no cycle).
  cases.push([3, [[0, 1], [1, 2]]]);
  cases.push([5, [[0, 1], [1, 2], [2, 3], [3, 4]]]);
  cases.push([6, [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]]]); // star

  // Triangle.
  cases.push([3, [[0, 1], [1, 2], [0, 2]]]);

  // Square (4-cycle).
  cases.push([4, [[0, 1], [1, 2], [2, 3], [3, 0]]]);

  // 5-cycle.
  cases.push([5, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]]);

  // 6-cycle.
  cases.push([6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]]]);

  // Two disconnected triangles -> 3.
  cases.push([6, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3]]]);

  // Triangle + path -> 3.
  cases.push([5, [[0, 1], [1, 2], [2, 0], [3, 4]]]);

  // Big cycle with a chord (creates smaller cycle).
  cases.push([6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3]]]); // chord creates 4-cycle

  // K4 complete graph -> 3.
  cases.push([4, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]]);

  // K5 -> 3.
  cases.push([5, [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [1, 3], [1, 4],
    [2, 3], [2, 4], [3, 4]
  ]]);

  // Long cycle (8-cycle).
  cases.push([8, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]]]);

  // 4-cycle plus pendant.
  cases.push([5, [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4]]]);

  // Two triangles sharing one edge -> 3.
  cases.push([4, [[0, 1], [1, 2], [2, 0], [0, 3], [3, 1]]]);

  // Petersen-like configuration (small bit).
  cases.push([6, [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
    [0, 3]
  ]]);

  // Disconnected: triangle + 4-cycle -> 3.
  cases.push([7, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 6], [6, 3]]]);

  // Disconnected: tree + 4-cycle -> 4.
  cases.push([6, [[0, 1], [1, 2], [3, 4], [4, 5], [5, 3]]]); // 3-cycle in second
  // Replace with a real 4-cycle:
  cases.push([7, [[0, 1], [1, 2], [3, 4], [4, 5], [5, 6], [6, 3]]]);

  // Cube-like 3x3 with cycles.
  cases.push([6, [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5]]]);

  // Two triangles joined by an edge -> 3.
  cases.push([6, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [2, 3]]]);

  // Bipartite (no odd cycles) -> 4.
  cases.push([6, [[0, 3], [0, 4], [1, 3], [1, 5], [2, 4], [2, 5]]]);

  // Pendant on a triangle.
  cases.push([4, [[0, 1], [1, 2], [2, 0], [2, 3]]]);

  // Longer chord-free cycle 10.
  cases.push([10, [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
    [5, 6], [6, 7], [7, 8], [8, 9], [9, 0]
  ]]);

  // Cycle 7 with chord making 4.
  cases.push([7, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [0, 3]]]);

  // Random LCG-generated graphs.
  while (cases.length < 36) {
    const n = 3 + (lcg() % 7); // 3..9
    const maxEdges = (n * (n - 1)) / 2;
    const e = 1 + (lcg() % Math.max(1, Math.floor(maxEdges)));
    const seen = new Set();
    const edges = [];
    let attempts = 0;
    while (edges.length < e && attempts < e * 6) {
      attempts++;
      const u = lcg() % n;
      const v = lcg() % n;
      if (u === v) continue;
      const a = Math.min(u, v);
      const b = Math.max(u, v);
      const k = a + "_" + b;
      if (seen.has(k)) continue;
      seen.add(k);
      edges.push([a, b]);
    }
    cases.push([n, edges]);
  }

  const test_cases = cases.map(([n, edges]) => ({
    inputs: [JSON.stringify(n), JSON.stringify(edges)],
    expected: JSON.stringify(ref(n, edges))
  }));

  return {
    slug: "shortest-cycle-in-a-graph",
    obj: {
      description: "There is a **bi-directional** graph with `n` vertices, where each vertex is labeled from `0` to `n - 1`. The edges in the graph are represented by a given 2D integer array `edges`, where `edges[i] = [u_i, v_i]` denotes an edge between vertex `u_i` and vertex `v_i`. Every vertex pair is connected by at most one edge, and no vertex has an edge to itself.\n\nReturn the **length of the shortest cycle** in the graph. If no cycle exists, return `-1`.\n\nA cycle is a path that starts and ends at the same vertex with no repeated vertices in between.\n\n**Example 1**\n\n```\nInput:  n = 7, edges = [[0,1],[1,2],[2,0],[3,4],[4,5],[5,6],[6,3]]\nOutput: 3\nExplanation: The cycle 0 -> 1 -> 2 -> 0 has length 3 — the shortest in the graph.\n```\n\n**Example 2**\n\n```\nInput:  n = 4, edges = [[0,1],[0,2]]\nOutput: -1\nExplanation: The graph is a tree (no cycle).\n```\n\nThis is **LeetCode 2608**. The canonical approach is **BFS from every vertex**; whenever BFS encounters a vertex already visited (via a non-parent edge), the cycle length is `dist[u] + dist[v] + 1`. Track the minimum across all sources.",
      method_name: "findShortestCycle",
      params: [
        { name: "n", type: "int" },
        { name: "edges", type: "int[][]" }
      ],
      return_type: "int",
      tags: ["graph", "bfs", "shortest-path", "cycle-detection"],
      pattern: "**BFS from every vertex. On encountering an already-visited non-parent vertex, the cycle length is `dist[u] + dist[v] + 1`. Take the minimum across all sources.**\n\n**Why BFS-from-every-source works.** A shortest cycle through vertex `s` is exactly the smallest sum `dist[s][u] + dist[s][v] + 1` for any edge `(u, v)` that closes a cycle in BFS from `s`. Equivalently: from `s`, BFS layer by layer; the first time two BFS-tree paths meet on a non-tree edge, we've found the shortest cycle through `s`. Running this from every `s` and taking the minimum gives the global shortest cycle.\n\n**The standard BFS template.**\n\n```\nbest = INF\nfor src in 0..n-1:\n    dist = [-1] * n\n    parent = [-1] * n\n    dist[src] = 0\n    q = deque([src])\n    while q:\n        u = q.popleft()\n        for v in adj[u]:\n            if dist[v] == -1:\n                dist[v] = dist[u] + 1\n                parent[v] = u\n                q.append(v)\n            elif v != parent[u]:\n                # found a non-tree edge — closes a cycle\n                best = min(best, dist[u] + dist[v] + 1)\nreturn -1 if best == INF else best\n```\n\n**Why the `v != parent[u]` check matters.** In an undirected graph each edge appears in both `adj[u]` and `adj[v]`. When BFS visits `u`, it iterates over its neighbors, including `parent[u]`. The `parent[u]` neighbor is already visited (dist set, since it's how we got here), so without this guard we'd 'detect' a phantom cycle of length 2 — actually the parent edge revisited. Excluding the parent fixes this.\n\n**Subtle correctness.** When BFS finds a non-tree edge `(u, v)` with `dist[v]` already assigned, the cycle is `s -> ... -> u -> v -> ... -> s`. The two BFS-tree paths from `s` to `u` and `s` to `v` are length `dist[u]` and `dist[v]`. Connect them with the `(u, v)` edge: cycle length `dist[u] + dist[v] + 1`. By the BFS invariant, both BFS-tree paths are shortest, so this is the shortest cycle through `s` containing this edge. Iterating all edges from `s`'s BFS finds the shortest cycle through `s`.\n\n**Worked example.** `n = 7`, `edges = [[0,1],[1,2],[2,0],[3,4],[4,5],[5,6],[6,3]]`.\n\nAdjacency:\n- 0: [1, 2]\n- 1: [0, 2]\n- 2: [1, 0]\n- 3: [4, 6]\n- 4: [3, 5]\n- 5: [4, 6]\n- 6: [5, 3]\n\nBFS from 0:\n- Layer 0: {0}, dist[0]=0.\n- Layer 1: visit 1 (via 0), 2 (via 0). dist[1]=1, dist[2]=1, parent[1]=0, parent[2]=0.\n- Process 1: neighbors 0 (parent), 2 (dist=1, parent[1]=0 != 2). Non-tree edge (1, 2): cycle = 1+1+1 = 3. best = 3.\n- Process 2: neighbors 1 (dist=1, parent[2]=0 != 1). Non-tree edge (2, 1): cycle = 1+1+1 = 3. best still 3.\n\nBFS from 3: same shape, finds cycle = 4 via (3,4),(4,5),(5,6),(6,3). best stays 3.\n\nReturn **3**.\n\n**Edge cases.**\n- **No edges**: BFS from each vertex finds no non-tree edges. Return -1.\n- **Tree**: All edges are BFS-tree edges. No non-tree edge. Return -1.\n- **Single vertex**: Trivially no cycle. Return -1.\n- **Multi-component**: BFS from each source explores only its component. Across all sources, every component's BFS finds the shortest cycle in that component. The minimum is the answer.\n- **Self-loops or parallel edges**: The problem states neither exists, so we don't handle them. (If you wanted to: a self-loop gives a cycle of length 1; a parallel edge gives length 2.)\n\n**Complexity.** Each BFS is `O(V + E)`. We do `n` BFS runs: total `O(V * (V + E)) = O(n * (n + m))`. For LC's constraint (`n <= 1000, m <= 1000`), about `10^6` operations — fast.",
      follow_up: "**Variant 1 — directed graph.** BFS-from-every-source still works for the shortest cycle, but the `v != parent[u]` guard isn't needed (no symmetric edges). Just look for any edge `(u, v)` with `dist[v]` already assigned; cycle length = `dist[u] - dist[v] + 1`. Caveat: 'cycle' here means directed cycle.\n\n**Variant 2 — weighted graph (positive weights), shortest weighted cycle.** Dijkstra from each vertex; on relaxation of an already-visited vertex via an edge not on the SPT, the cycle weight is `dist[u] + dist[v] + w(u,v)`. Total: `O(n * (m + n) log n)`.\n\n**Variant 3 — count of shortest cycles.** During BFS from each source, count non-tree edges that close a cycle of length equal to the best-found. Be careful not to double-count: each cycle has multiple BFS roots that find it.\n\n**Variant 4 — odd shortest cycle / even shortest cycle.** Modify the cycle-length check: only record if the cycle length is the desired parity. Useful for bipartiteness testing (odd cycle).\n\n**Variant 5 — k-th shortest cycle.** Much harder; not a BFS problem. Often reduced to enumerating short cycles via DFS or specialized algorithms (Yen's, Eppstein's).\n\n**Variant 6 — shortest cycle through a fixed vertex `v`.** Just BFS from `v` once. `O(V + E)`.\n\n**Variant 7 — shortest cycle through a fixed edge `(u, v)`.** Remove the edge, find shortest path from `u` to `v` in the remaining graph; add 1 (the edge weight) for the cycle. If no path exists, no cycle through this edge.\n\n**Implementation pitfalls.**\n1. **Forgetting `v != parent[u]`** — causes false 'cycle of length 2' detections on the parent edge.\n2. **Resetting `dist` and `parent` per BFS run** — using a stale array from a previous source produces wrong answers. Allocate fresh per BFS, OR reset only the touched entries (faster for sparse graphs).\n3. **Using `dist[u] + dist[v] + 1` when `(u, v)` IS a tree edge** — the guard `v != parent[u]` should exclude this; double-check the predicate.\n4. **Adding both `(u,v)` and `(v,u)` to adjacency** — correct (undirected), but be sure not to double the edge count by mistake during input parsing.\n5. **Returning `INF` instead of `-1`** when no cycle is found.\n6. **Edge case `n = 1`** — BFS runs once with no neighbors. Returns -1, correct.\n7. **Performance: not breaking early** — once `best == 3`, no shorter cycle is possible. Optionally break.",
      complexity: {
        time: "**O(n * (n + m))** — BFS from each vertex is `O(n + m)`, repeated `n` times. For LC's bounds (`n <= 1000, m <= 1000`), about `10^6` operations.",
        space: "**O(n + m)** for the adjacency list, plus **O(n)** per BFS for `dist` and `parent` (allocated fresh per source).",
        notes: "An optimization: once `best == 3`, break out of the outer loop — 3 is the global minimum (no shorter simple cycle exists in a simple graph). Cuts runtime when triangles are common.",
        optimal: "**O(n * (n + m))** is the standard bound for unweighted shortest-cycle. Itai-Rodeh achieves `O(n^2)` for general graphs via APSP-with-witnesses, but is rarely used in practice."
      },
      constraints: [
        "2 <= n <= 1000",
        "1 <= edges.length <= 1000",
        "edges[i].length == 2",
        "0 <= u_i, v_i < n",
        "u_i != v_i",
        "There are no repeated edges"
      ],
      hints: [
        "**Run BFS from every vertex.** The shortest cycle through `s` is found by BFS-from-`s` and checking for non-tree edges.",
        "**Track `dist[]` and `parent[]` per BFS run.** When BFS reaches a vertex `v` from `u` and `v` is already visited but `v != parent[u]`, the cycle length is `dist[u] + dist[v] + 1`.",
        "**Why the parent check?** Each undirected edge appears in both directions in the adjacency list. Without excluding the parent, you'd 'detect' a cycle of length 2 via the parent edge — wrong.",
        "**Reset `dist` and `parent` per source.** Don't reuse stale arrays from a previous BFS run.",
        "**Track the global minimum** across all BFS sources. Return `-1` if no non-tree edge is ever found.",
        "**Optimization:** once you find a cycle of length 3, you can return early — no shorter simple cycle exists."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\nfrom collections import deque\n\n\nclass Solution:\n    def findShortestCycle(self, n: int, edges: List[List[int]]) -> int:\n        adj = [[] for _ in range(n)]\n        for u, v in edges:\n            adj[u].append(v)\n            adj[v].append(u)\n        best = float('inf')\n        for src in range(n):\n            dist = [-1] * n\n            parent = [-1] * n\n            dist[src] = 0\n            q = deque([src])\n            while q:\n                u = q.popleft()\n                for v in adj[u]:\n                    if dist[v] == -1:\n                        dist[v] = dist[u] + 1\n                        parent[v] = u\n                        q.append(v)\n                    elif v != parent[u]:\n                        cycle_len = dist[u] + dist[v] + 1\n                        if cycle_len < best:\n                            best = cycle_len\n        return -1 if best == float('inf') else best\n",
        javascript: "/**\n * @param {number} n\n * @param {number[][]} edges\n * @return {number}\n */\nvar findShortestCycle = function(n, edges) {\n    const adj = Array.from({ length: n }, () => []);\n    for (const [u, v] of edges) {\n        adj[u].push(v);\n        adj[v].push(u);\n    }\n    let best = Number.POSITIVE_INFINITY;\n    for (let src = 0; src < n; src++) {\n        const dist = new Array(n).fill(-1);\n        const parent = new Array(n).fill(-1);\n        dist[src] = 0;\n        const q = [src];\n        let head = 0;\n        while (head < q.length) {\n            const u = q[head++];\n            for (const v of adj[u]) {\n                if (dist[v] === -1) {\n                    dist[v] = dist[u] + 1;\n                    parent[v] = u;\n                    q.push(v);\n                } else if (v !== parent[u]) {\n                    const cycleLen = dist[u] + dist[v] + 1;\n                    if (cycleLen < best) best = cycleLen;\n                }\n            }\n        }\n    }\n    return best === Number.POSITIVE_INFINITY ? -1 : best;\n};\n",
        java: "import java.util.*;\n\nclass Solution {\n    public int findShortestCycle(int n, int[][] edges) {\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());\n        for (int[] e : edges) {\n            adj.get(e[0]).add(e[1]);\n            adj.get(e[1]).add(e[0]);\n        }\n        int best = Integer.MAX_VALUE;\n        for (int src = 0; src < n; src++) {\n            int[] dist = new int[n];\n            int[] parent = new int[n];\n            Arrays.fill(dist, -1);\n            Arrays.fill(parent, -1);\n            dist[src] = 0;\n            ArrayDeque<Integer> q = new ArrayDeque<>();\n            q.offer(src);\n            while (!q.isEmpty()) {\n                int u = q.poll();\n                for (int v : adj.get(u)) {\n                    if (dist[v] == -1) {\n                        dist[v] = dist[u] + 1;\n                        parent[v] = u;\n                        q.offer(v);\n                    } else if (v != parent[u]) {\n                        int cycleLen = dist[u] + dist[v] + 1;\n                        if (cycleLen < best) best = cycleLen;\n                    }\n                }\n            }\n        }\n        return best == Integer.MAX_VALUE ? -1 : best;\n    }\n}\n",
        cpp: "#include <vector>\n#include <queue>\n#include <climits>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findShortestCycle(int n, vector<vector<int>>& edges) {\n        vector<vector<int>> adj(n);\n        for (const auto& e : edges) {\n            adj[e[0]].push_back(e[1]);\n            adj[e[1]].push_back(e[0]);\n        }\n        int best = INT_MAX;\n        for (int src = 0; src < n; src++) {\n            vector<int> dist(n, -1);\n            vector<int> parent(n, -1);\n            dist[src] = 0;\n            queue<int> q;\n            q.push(src);\n            while (!q.empty()) {\n                int u = q.front(); q.pop();\n                for (int v : adj[u]) {\n                    if (dist[v] == -1) {\n                        dist[v] = dist[u] + 1;\n                        parent[v] = u;\n                        q.push(v);\n                    } else if (v != parent[u]) {\n                        int cycleLen = dist[u] + dist[v] + 1;\n                        if (cycleLen < best) best = cycleLen;\n                    }\n                }\n            }\n        }\n        return best == INT_MAX ? -1 : best;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: minimum-time-to-collect-all-apples-in-a-tree (LC 1443)
//   minTime(n: int, edges: int[][], hasApple: bool[]) -> int
//   Undirected tree rooted at 0. Each edge takes 1 second to walk.
//   Return min seconds to collect all apples and return to vertex 0.
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F373B);

  function ref(n, edges, hasApple) {
    const adj = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      adj[u].push(v);
      adj[v].push(u);
    }
    // Iterative DFS from 0, post-order to accumulate child contributions.
    const parent = new Array(n).fill(-1);
    const order = [];
    const stack = [0];
    const visited = new Array(n).fill(false);
    visited[0] = true;
    while (stack.length) {
      const u = stack.pop();
      order.push(u);
      for (const v of adj[u]) {
        if (!visited[v]) {
          visited[v] = true;
          parent[v] = u;
          stack.push(v);
        }
      }
    }
    // Process in reverse (post-order).
    const contrib = new Array(n).fill(0);
    const subtreeApples = hasApple.slice();
    for (let i = order.length - 1; i >= 0; i--) {
      const u = order[i];
      for (const v of adj[u]) {
        if (v === parent[u]) continue;
        // v is a child of u.
        if (subtreeApples[v]) {
          subtreeApples[u] = true;
          contrib[u] += contrib[v] + 2;
        }
      }
    }
    return contrib[0];
  }

  const cases = [];

  // LC sample 1: n=7, edges=[[0,1],[0,2],[1,4],[1,5],[2,3],[2,6]], hasApple=[F,F,T,F,T,T,F] -> 8
  cases.push([7, [[0, 1], [0, 2], [1, 4], [1, 5], [2, 3], [2, 6]], [false, false, true, false, true, true, false]]);
  // LC sample 2: same tree, hasApple=[F,F,T,F,F,T,F] -> 6
  cases.push([7, [[0, 1], [0, 2], [1, 4], [1, 5], [2, 3], [2, 6]], [false, false, true, false, false, true, false]]);
  // LC sample 3: same tree, all false -> 0
  cases.push([7, [[0, 1], [0, 2], [1, 4], [1, 5], [2, 3], [2, 6]], [false, false, false, false, false, false, false]]);

  // Single node, no apple.
  cases.push([1, [], [false]]);
  // Single node WITH apple at root (no edges; can't even need to move).
  cases.push([1, [], [true]]);

  // Two nodes, apple at child.
  cases.push([2, [[0, 1]], [false, true]]);
  // Two nodes, apple at root only.
  cases.push([2, [[0, 1]], [true, false]]);
  // Two nodes, apples at both.
  cases.push([2, [[0, 1]], [true, true]]);
  // Two nodes, no apple.
  cases.push([2, [[0, 1]], [false, false]]);

  // Path 0-1-2-3-4, apple only at leaf 4.
  cases.push([5, [[0, 1], [1, 2], [2, 3], [3, 4]], [false, false, false, false, true]]);
  // Path, apples at multiple positions.
  cases.push([5, [[0, 1], [1, 2], [2, 3], [3, 4]], [false, true, false, true, false]]);

  // Star: 0 root, children 1..4, apple at 2 and 4.
  cases.push([5, [[0, 1], [0, 2], [0, 3], [0, 4]], [false, false, true, false, true]]);

  // Star, no apples.
  cases.push([5, [[0, 1], [0, 2], [0, 3], [0, 4]], [false, false, false, false, false]]);

  // Binary tree, apples scattered.
  cases.push([7, [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]], [false, true, false, false, false, true, false]]);
  cases.push([7, [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]], [false, false, false, true, true, true, true]]);

  // Deeper tree.
  cases.push([8, [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [5, 7]], [false, false, true, false, false, false, true, false]]);

  // All nodes have apples.
  cases.push([7, [[0, 1], [0, 2], [1, 4], [1, 5], [2, 3], [2, 6]], [true, true, true, true, true, true, true]]);

  // Only root has an apple.
  cases.push([7, [[0, 1], [0, 2], [1, 4], [1, 5], [2, 3], [2, 6]], [true, false, false, false, false, false, false]]);

  // Edges given out of order.
  cases.push([6, [[3, 4], [0, 1], [1, 2], [1, 3], [4, 5]], [false, false, true, false, false, true]]);

  // Edges where u > v in input.
  cases.push([5, [[1, 0], [2, 1], [3, 2], [4, 3]], [false, false, false, true, false]]);

  // Long path, apple at far leaf only.
  cases.push([10, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]], [false, false, false, false, false, false, false, false, false, true]]);

  // Branching with apples only on one subtree.
  cases.push([8, [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [5, 6], [5, 7]], [false, false, false, true, true, false, false, false]]);

  // Apple deep in one branch, none in the other.
  cases.push([6, [[0, 1], [0, 2], [1, 3], [3, 4], [4, 5]], [false, false, false, false, false, true]]);

  // Wide bushy tree.
  cases.push([10, [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 6], [2, 7], [3, 8], [3, 9]],
    [false, false, false, false, true, false, true, false, false, true]]);

  // Tree with chain of length 6 with apples at every other node.
  cases.push([7, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]], [false, true, false, true, false, true, false]]);

  // Tree where root is at a leaf of the natural shape.
  cases.push([6, [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]], [false, false, false, false, true, true]]);

  // Random LCG cases.
  while (cases.length < 36) {
    const n = 2 + (lcg() % 9); // 2..10
    const edges = [];
    // Random spanning tree: connect each new node to a random earlier node.
    for (let i = 1; i < n; i++) {
      const p = lcg() % i;
      edges.push([p, i]);
    }
    const hasApple = [];
    for (let i = 0; i < n; i++) {
      hasApple.push((lcg() % 2) === 1);
    }
    cases.push([n, edges, hasApple]);
  }

  const test_cases = cases.map(([n, edges, hasApple]) => ({
    inputs: [
      JSON.stringify(n),
      JSON.stringify(edges),
      JSON.stringify(hasApple)
    ],
    expected: JSON.stringify(ref(n, edges, hasApple))
  }));

  return {
    slug: "minimum-time-to-collect-all-apples-in-a-tree",
    obj: {
      description: "Given an **undirected tree** consisting of `n` vertices numbered from `0` to `n - 1`, which has some apples in its vertices. You spend **1 second** to walk over one edge of the tree. Return the **minimum time** in seconds you have to spend to collect all apples in the tree, starting at **vertex 0** and coming back to this vertex.\n\nThe edges of the undirected tree are given in the array `edges`, where `edges[i] = [a_i, b_i]` means that exists an edge connecting the vertices `a_i` and `b_i`. Additionally, there is a boolean array `hasApple`, where `hasApple[i] = true` means that vertex `i` has an apple; otherwise, it does not have any apple.\n\n**Example 1**\n\n```\nInput:  n = 7, edges = [[0,1],[0,2],[1,4],[1,5],[2,3],[2,6]],\n        hasApple = [false,false,true,false,true,true,false]\nOutput: 8\nExplanation: Visit vertex 4 (via 1) and 5 (via 1) and 2 — total 8 seconds.\n```\n\n**Example 2**\n\n```\nInput:  n = 7, edges = [[0,1],[0,2],[1,4],[1,5],[2,3],[2,6]],\n        hasApple = [false,false,true,false,false,true,false]\nOutput: 6\n```\n\n**Example 3**\n\n```\nInput:  hasApple = all false\nOutput: 0\n```\n\nThis is **LeetCode 1443**. The canonical approach is a **post-order DFS** that computes, for each subtree, whether it 'needs visiting' (contains any apple). If a child's subtree needs visiting, its edge contributes `2` seconds (down + back) to the parent's cost.",
      method_name: "minTime",
      params: [
        { name: "n", type: "int" },
        { name: "edges", type: "int[][]" },
        { name: "hasApple", type: "bool[]" }
      ],
      return_type: "int",
      tags: ["tree", "dfs", "graph", "post-order"],
      pattern: "**Root the tree at 0. Post-order DFS: a child's edge contributes 2 seconds (down + back) iff its subtree contains at least one apple.**\n\n**Why this works.** Since the structure is a tree (no cycles), the path to collect any apple is unique — there's exactly one route from root to each vertex. To collect an apple at vertex `v`, you MUST traverse the unique root-to-`v` path and return. If multiple apples share the same path prefix, that prefix is walked only once (down + back). So the total time is **2 * (number of edges in the union of root-to-apple paths)**.\n\nThe union of root-to-apple paths is exactly the set of edges `(parent(u), u)` for every `u` such that the subtree rooted at `u` contains at least one apple. (If a subtree has no apple, you never enter it; if it has an apple, you enter and must come back.)\n\n**Post-order DFS recurrence.**\n\n```\ndef dfs(u, parent):\n    total = 0\n    subtree_has_apple = hasApple[u]\n    for v in adj[u]:\n        if v == parent:\n            continue\n        child_total = dfs(v, u)\n        if subtree_has_apple_of(v):   # determined inside the dfs(v, u) call\n            total += child_total + 2   # +2 for edge (u, v) down + back\n            subtree_has_apple = True\n    return (total, subtree_has_apple)\n\nresult, _ = dfs(0, -1)\nreturn result\n```\n\nA cleaner formulation returns just the cost; the 'has-apple' bit is tracked via the cost being nonzero OR via `hasApple[v]`:\n\n```\ndef dfs(u, parent):\n    total = 0\n    for v in adj[u]:\n        if v == parent:\n            continue\n        child = dfs(v, u)\n        if child > 0 or hasApple[v]:\n            total += child + 2\n    return total\n\nreturn dfs(0, -1)\n```\n\n**Why `child > 0 or hasApple[v]` is correct.** `child` is the cost inside `v`'s subtree, NOT counting the edge from `u` to `v`. It's `> 0` iff `v`'s subtree has at least one DESCENDANT with an apple. We must also enter `v` if `v` itself has an apple. So the condition 'should we walk edge `(u, v)`?' is: 'does the subtree rooted at `v` (including `v` itself) contain any apple?'.\n\n**Iterative version (for languages with shallow recursion limits).** Convert to iterative post-order DFS:\n1. First pass: BFS/DFS to compute `parent[]` and an iteration order such that all descendants come before each node.\n2. Second pass: walk the order in reverse, computing `contrib[u]` = total cost of `u`'s subtree (excluding the edge from `u`'s parent), and updating `subtreeApples[u]`.\n\nThis avoids stack overflow on a degenerate chain tree of length 10^5.\n\n**Worked example.** `n = 7`, `edges = [[0,1],[0,2],[1,4],[1,5],[2,3],[2,6]]`, `hasApple = [F,F,T,F,T,T,F]`.\n\nTree:\n```\n        0\n       / \\\n      1   2\n     / \\ / \\\n    4  5 3  6\n```\nApples at vertices 2, 4, 5.\n\nPost-order traversal:\n- Vertex 4: leaf, hasApple=T -> subtreeApple=T, cost=0. (Contribution to parent will be 0+2=2.)\n- Vertex 5: leaf, hasApple=T -> subtreeApple=T, cost=0. (Contribution to parent: 2.)\n- Vertex 1: hasApple=F. Children 4, 5 both have apples in their subtrees. cost = 0+2+0+2 = 4. subtreeApple = T (children give it).\n- Vertex 3: leaf, hasApple=F -> subtreeApple=F, cost=0. (No contribution.)\n- Vertex 6: leaf, hasApple=F -> subtreeApple=F, cost=0. (No contribution.)\n- Vertex 2: hasApple=T. Children 3 (no apple), 6 (no apple). cost = 0 (no contributions). But subtreeApple = T (vertex 2 itself).\n- Vertex 0 (root): hasApple=F. Children 1 (apples in subtree, child cost 4 -> contributes 4+2=6), 2 (apple itself, child cost 0 -> contributes 0+2=2). Total = 6 + 2 = 8.\n\nReturn **8**.\n\n**Edge cases.**\n- **No apples at all**: every subtree has no apple -> every contribution is 0 -> total = 0. Correct.\n- **Apple at root only**: no need to traverse any edge -> total = 0. The DFS gives 0 correctly since no child subtree has an apple.\n- **Single vertex (`n = 1`)**: no edges. Return 0 regardless of `hasApple[0]`.\n- **Chain tree (degenerate)**: ensure your DFS is iterative or has enough stack depth.\n- **Edges given in arbitrary order** (e.g., `[1, 0]` instead of `[0, 1]`): build adjacency symmetrically — `adj[u].push(v); adj[v].push(u)`. The DFS roots at 0 and figures out parent-child orientation via the `parent` tracker.\n\n**Common bugs.**\n1. **Treating edges as directed** — they're undirected. Add both directions to the adjacency list.\n2. **Forgetting to skip the parent in DFS** — causes infinite recursion or revisits.\n3. **Returning the apple-bit instead of the cost** — be clear about which the recursion returns.\n4. **Off-by-one on the `+2`** — the cost for entering a subtree is exactly 2 per edge (down + back). Don't add 1 once or 4.\n5. **Including the root in the apple check** — if the root has an apple, you don't need to traverse any edge to collect it. The DFS handles this correctly because we check `child > 0 or hasApple[v]` for each CHILD `v`, not for the root itself.\n6. **Stack overflow on chain** — switch to iterative post-order.",
      follow_up: "**Variant 1 — start at vertex `s` instead of 0.** Same algorithm; root the tree at `s` via DFS/BFS.\n\n**Variant 2 — don't need to return to start.** The optimal strategy is now: walk all edges of the apple-induced subtree, then stop at the farthest leaf containing an apple. Total time = `2 * apple_edges - longest_apple_path_from_root`. Compute the longest path via DFS while finding apple subtrees.\n\n**Variant 3 — weighted edges.** Replace `+2` with `+2 * weight(u, v)`. Same recurrence.\n\n**Variant 4 — multiple apples per vertex.** Doesn't change anything; visiting once collects all apples there. Same algorithm.\n\n**Variant 5 — minimum-time to collect EXACTLY `k` apples (k < total).** Now a non-trivial optimization: pick the `k` apples whose induced Steiner subtree has minimum total edge count. Hard in general (Steiner Tree problem is NP-hard on graphs, but in trees it's tractable: DP on subtree).\n\n**Variant 6 — apples 'expire' after some time.** Becomes a routing / scheduling problem. Likely needs DP-on-tree with state = (vertex, time, set-of-collected-apples).\n\n**Variant 7 — multiple agents starting at root.** Partition the apples into groups, one per agent; minimize the maximum agent's time. This is a classic load-balancing problem on trees.\n\n**Variant 8 — return the set of edges that are walked (path reconstruction).** Modify DFS to collect edges into a result list when a child's subtree has an apple.\n\n**Implementation pitfalls.**\n1. **Recursive DFS on a chain of 10^5 nodes** — will stack-overflow in many languages. Use an explicit stack.\n2. **Allocating `adj` as `[[]] * n`** in Python — creates `n` references to the same list. Always use `[[] for _ in range(n)]`.\n3. **Reading `edges[i][0]` and `edges[i][1]` without bounds-checks** — input is well-formed per the spec.\n4. **Using BFS with naive parent tracking** instead of DFS — works but is harder to express the post-order accumulation. DFS is cleaner.\n5. **Returning 2 instead of 0 when there are no apples in any subtree** — make sure the base case (leaf with no apple) returns 0, and the parent's accumulation conditionally adds.",
      complexity: {
        time: "**O(n)** — each vertex and edge is visited exactly twice (once in the BFS for ordering, once in the post-order accumulation). Total: linear in tree size.",
        space: "**O(n)** for the adjacency list, parent array, ordering array, and contribution map. Recursive DFS uses **O(n)** stack space in the worst case (a chain).",
        notes: "The iterative version is preferable for `n` near the upper bound (10^5) to avoid stack-overflow on degenerate inputs.",
        optimal: "**O(n)** is optimal — every edge of the tree may need to be inspected to know if its subtree contains apples."
      },
      constraints: [
        "1 <= n <= 10^5",
        "edges.length == n - 1",
        "edges[i].length == 2",
        "0 <= a_i, b_i < n",
        "hasApple.length == n"
      ],
      hints: [
        "**Root the tree at vertex 0.** Build an undirected adjacency list; traversal direction emerges from the DFS.",
        "**Think in terms of edges, not vertices.** Each edge is either walked (contributes 2 seconds) or not (contributes 0). An edge `(parent, child)` is walked iff the subtree rooted at `child` contains an apple.",
        "**Post-order DFS.** For each child, recursively compute the child's subtree cost. If that cost > 0 OR `hasApple[child]` is true, add `child_cost + 2` to the parent's total.",
        "**Don't revisit the parent** in the DFS — pass the parent as a parameter and skip it in the adjacency iteration.",
        "**No apples means no edges walked** -> total = 0. Apple at root only also gives 0 — you never have to leave.",
        "**For `n` near 10^5**, use iterative DFS to avoid stack overflow on a chain-shaped tree."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\nimport sys\n\n\nclass Solution:\n    def minTime(self, n: int, edges: List[List[int]], hasApple: List[bool]) -> int:\n        sys.setrecursionlimit(200000)\n        adj = [[] for _ in range(n)]\n        for u, v in edges:\n            adj[u].append(v)\n            adj[v].append(u)\n        def dfs(u: int, parent: int) -> int:\n            total = 0\n            for v in adj[u]:\n                if v == parent:\n                    continue\n                child = dfs(v, u)\n                if child > 0 or hasApple[v]:\n                    total += child + 2\n            return total\n        return dfs(0, -1)\n",
        javascript: "/**\n * @param {number} n\n * @param {number[][]} edges\n * @param {boolean[]} hasApple\n * @return {number}\n */\nvar minTime = function(n, edges, hasApple) {\n    const adj = Array.from({ length: n }, () => []);\n    for (const [u, v] of edges) {\n        adj[u].push(v);\n        adj[v].push(u);\n    }\n    // Iterative post-order to avoid stack overflow.\n    const parent = new Array(n).fill(-1);\n    const order = [];\n    const visited = new Array(n).fill(false);\n    visited[0] = true;\n    const stack = [0];\n    while (stack.length) {\n        const u = stack.pop();\n        order.push(u);\n        for (const v of adj[u]) {\n            if (!visited[v]) {\n                visited[v] = true;\n                parent[v] = u;\n                stack.push(v);\n            }\n        }\n    }\n    const cost = new Array(n).fill(0);\n    const subtreeApple = hasApple.slice();\n    for (let i = order.length - 1; i >= 0; i--) {\n        const u = order[i];\n        for (const v of adj[u]) {\n            if (v === parent[u]) continue;\n            if (subtreeApple[v]) {\n                cost[u] += cost[v] + 2;\n                subtreeApple[u] = true;\n            }\n        }\n    }\n    return cost[0];\n};\n",
        java: "import java.util.*;\n\nclass Solution {\n    public int minTime(int n, int[][] edges, List<Boolean> hasApple) {\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());\n        for (int[] e : edges) {\n            adj.get(e[0]).add(e[1]);\n            adj.get(e[1]).add(e[0]);\n        }\n        int[] parent = new int[n];\n        Arrays.fill(parent, -1);\n        boolean[] visited = new boolean[n];\n        int[] order = new int[n];\n        int idx = 0;\n        ArrayDeque<Integer> stack = new ArrayDeque<>();\n        stack.push(0);\n        visited[0] = true;\n        while (!stack.isEmpty()) {\n            int u = stack.pop();\n            order[idx++] = u;\n            for (int v : adj.get(u)) {\n                if (!visited[v]) {\n                    visited[v] = true;\n                    parent[v] = u;\n                    stack.push(v);\n                }\n            }\n        }\n        int[] cost = new int[n];\n        boolean[] subtreeApple = new boolean[n];\n        for (int i = 0; i < n; i++) subtreeApple[i] = hasApple.get(i);\n        for (int i = idx - 1; i >= 0; i--) {\n            int u = order[i];\n            for (int v : adj.get(u)) {\n                if (v == parent[u]) continue;\n                if (subtreeApple[v]) {\n                    cost[u] += cost[v] + 2;\n                    subtreeApple[u] = true;\n                }\n            }\n        }\n        return cost[0];\n    }\n\n    // Overload to accept boolean[] when registries pass arrays directly.\n    public int minTime(int n, int[][] edges, boolean[] hasApple) {\n        List<Boolean> list = new ArrayList<>(hasApple.length);\n        for (boolean b : hasApple) list.add(b);\n        return minTime(n, edges, list);\n    }\n}\n",
        cpp: "#include <vector>\n#include <stack>\nusing namespace std;\n\nclass Solution {\npublic:\n    int minTime(int n, vector<vector<int>>& edges, vector<bool>& hasApple) {\n        vector<vector<int>> adj(n);\n        for (const auto& e : edges) {\n            adj[e[0]].push_back(e[1]);\n            adj[e[1]].push_back(e[0]);\n        }\n        vector<int> parent(n, -1);\n        vector<int> order;\n        order.reserve(n);\n        vector<bool> visited(n, false);\n        visited[0] = true;\n        stack<int> st;\n        st.push(0);\n        while (!st.empty()) {\n            int u = st.top(); st.pop();\n            order.push_back(u);\n            for (int v : adj[u]) {\n                if (!visited[v]) {\n                    visited[v] = true;\n                    parent[v] = u;\n                    st.push(v);\n                }\n            }\n        }\n        vector<int> cost(n, 0);\n        vector<bool> subtreeApple = hasApple;\n        for (int i = (int)order.size() - 1; i >= 0; i--) {\n            int u = order[i];\n            for (int v : adj[u]) {\n                if (v == parent[u]) continue;\n                if (subtreeApple[v]) {\n                    cost[u] += cost[v] + 2;\n                    subtreeApple[u] = true;\n                }\n            }\n        }\n        return cost[0];\n    }\n};\n"
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
    "// ===== WAVE 35T START =====",
    "// === WAVE 35T " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35T " + p1.slug + " END ===",
    "// === WAVE 35T " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35T " + p2.slug + " END ===",
    "// ===== WAVE 35T END =====",
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
if (src.indexOf("WAVE 35T START") !== -1) {
  console.error("WAVE 35T already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 35S END marker and append block after it.
const ANCHOR = "// ===== WAVE 35S END =====";
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

console.log("DONE wave35t " + p1.slug + " + " + p2.slug);
