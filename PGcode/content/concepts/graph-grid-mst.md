---
slug: graph-grid-mst
module: graphs
title: Grid MST (Minimum Spanning Edges)
subtitle: Treat a grid as a weighted graph where edges are |cell - neighbour| and find the MST.
difficulty: Advanced
position: 49
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Minimum Spanning Tree — Kruskal — CP-Algorithms"
    url: "https://cp-algorithms.com/graph/mst_kruskal.html"
    type: blog
  - title: "Kruskal's Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/kruskals-minimum-spanning-tree-algorithm-greedy-algo-2/"
    type: blog
  - title: "kactl — UnionFind.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/data-structures/UnionFind.h"
    type: repo
status: published
---

## intro
Given an n x m grid of integer heights, define an edge between every pair of 4-adjacent cells with weight equal to the absolute height difference. The Grid MST is the minimum-total-weight subset of these edges that connects all cells. It is the underlying primitive behind problems like "shortest cost to swim across heights" and "minimum effort path," and a clean exercise in adapting Kruskal's or Prim's to a graph defined implicitly by a grid.

## whyItMatters
Many image-processing and terrain-analysis pipelines need a hierarchical clustering of pixels by similarity — exactly what an MST encodes. Image segmentation by minimum-cut on an MST, watershed transforms, and "minimum effort" pathfinding (the classic LeetCode 1631) all reduce to the MST view. Once you see the grid as O(nm) nodes and O(nm) edges (each cell has at most 2 unique edges: right and down), the algorithms transfer directly.

## intuition
Kruskal sorts edges and greedily adds the lightest that does not form a cycle, using Union-Find to detect cycles in near-O(1). On a grid the trick is to enumerate edges only once per pair: visit each cell and emit edges to its right and down neighbour (not all four), giving exactly 2nm - n - m edges. After sorting, Kruskal proceeds as on a generic graph. Prim's variant: start from any cell, push 4 neighbours into a min-heap, pop the lightest that reaches an unvisited cell, repeat.

## visualization
Grid heights: [[1, 3, 4], [2, 8, 5], [6, 7, 1]]. Right/down edges (weight = |a - b|): (0,0)-(0,1)=2, (0,1)-(0,2)=1, (1,0)-(1,1)=6, (1,1)-(1,2)=3, (2,0)-(2,1)=1, (2,1)-(2,2)=6, (0,0)-(1,0)=1, (0,1)-(1,1)=5, (0,2)-(1,2)=1, (1,0)-(2,0)=4, (1,1)-(2,1)=1, (1,2)-(2,2)=4. Sorted ascending: 1,1,1,1,1,2,3,4,4,5,6,6. Add edges until 9 cells are connected (8 edges total): we pick five weight-1 edges, one weight-2, one weight-3, one weight-4 — MST total weight = 13.

## bruteForce
Generate all 2^(2nm - n - m) subsets of edges and check each for connectivity and acyclicity. Exponential and obviously absurd past 3x3. A polynomial-but-wasteful approach is to call BFS from each cell to compute pairwise costs, then run generic MST — but it forgets the grid structure that lets you generate edges in linear time.

## optimal
Kruskal on the grid: emit 2nm - n - m edges, sort by weight (counting sort works when heights fit in a small range — O(V + E)), then union-find walk picks the first nm - 1 edges that connect new components. Prim on the grid: min-heap seeded with cell (0, 0); pop the lightest edge to an unvisited cell, mark visited, push its 4 neighbours. Both are O(V * alpha(V)) for counting-sort Kruskal or O(V log V) for Prim with a heap.

## complexity
time: O(nm * alpha(nm)) for Kruskal with counting sort; O(nm log(nm)) with comparison sort or heap-based Prim
space: O(nm) for Union-Find or visited grid plus the edge list
notes: For problems that only need the MAX edge in the MST path between two cells (minimum-effort path), binary-search on the answer + BFS is often simpler and faster than building the full MST.

## pitfalls
- Counting each edge twice by emitting all 4 neighbour edges per cell — doubles edge list and inflates the sort.
- Off-by-one in the "stop after nm - 1 successful unions" loop, causing extra edges to be added and the result to no longer be a tree.
- Skipping the visited check in Prim and re-pushing already-popped nodes, blowing up the heap; the check after pop is sufficient.
- Confusing "MST weight" with "max edge in MST path between two specific cells" — they answer different questions even if both use Kruskal.
- Using regular sort on edges when heights are small ints — counting sort or radix is asymptotically faster and removes a log factor.

## interviewTips
- Frame the implicit graph clearly: "nm nodes, ~2nm edges, weights = |a - b|."
- Pre-empt the "minimum effort path" follow-up: it is the max edge in the MST path between source and target, solvable by Kruskal + LCA or by Prim with early-exit.
- Mention image-segmentation as a real use; interviewers love a domain anchor.
- Be ready to swap Kruskal for Prim if asked to do it in-place without precomputing the full edge list.

## code.python
```python
def grid_mst(grid):
    n, m = len(grid), len(grid[0])
    edges = []
    for r in range(n):
        for c in range(m):
            if r + 1 < n: edges.append((abs(grid[r][c] - grid[r + 1][c]), r * m + c, (r + 1) * m + c))
            if c + 1 < m: edges.append((abs(grid[r][c] - grid[r][c + 1]), r * m + c, r * m + c + 1))
    edges.sort()
    parent = list(range(n * m))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    total = 0; taken = 0
    for w, a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            total += w; taken += 1
            if taken == n * m - 1: break
    return total
```

## code.javascript
```javascript
function gridMst(grid) {
  const n = grid.length, m = grid[0].length;
  const edges = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < m; c++) {
      if (r + 1 < n) edges.push([Math.abs(grid[r][c] - grid[r + 1][c]), r * m + c, (r + 1) * m + c]);
      if (c + 1 < m) edges.push([Math.abs(grid[r][c] - grid[r][c + 1]), r * m + c, r * m + c + 1]);
    }
  }
  edges.sort((a, b) => a[0] - b[0]);
  const parent = new Int32Array(n * m).map((_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  let total = 0, taken = 0;
  for (const [w, a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) { parent[ra] = rb; total += w; taken++; if (taken === n * m - 1) break; }
  }
  return total;
}
```

## code.java
```java
import java.util.Arrays;

public class GridMst {
    int[] parent;

    public int gridMst(int[][] grid) {
        int n = grid.length, m = grid[0].length;
        int[][] edges = new int[2 * n * m][3];
        int e = 0;
        for (int r = 0; r < n; r++)
            for (int c = 0; c < m; c++) {
                if (r + 1 < n) edges[e++] = new int[]{Math.abs(grid[r][c] - grid[r + 1][c]), r * m + c, (r + 1) * m + c};
                if (c + 1 < m) edges[e++] = new int[]{Math.abs(grid[r][c] - grid[r][c + 1]), r * m + c, r * m + c + 1};
            }
        edges = Arrays.copyOf(edges, e);
        Arrays.sort(edges, (a, b) -> a[0] - b[0]);
        parent = new int[n * m];
        for (int i = 0; i < parent.length; i++) parent[i] = i;
        int total = 0, taken = 0;
        for (int[] edge : edges) {
            int ra = find(edge[1]), rb = find(edge[2]);
            if (ra != rb) { parent[ra] = rb; total += edge[0]; if (++taken == n * m - 1) break; }
        }
        return total;
    }

    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <cmath>
#include <algorithm>

struct DSU {
    std::vector<int> p;
    DSU(int n) : p(n) { for (int i = 0; i < n; i++) p[i] = i; }
    int find(int x) { while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; } return x; }
};

int gridMst(std::vector<std::vector<int>>& grid) {
    int n = grid.size(), m = grid[0].size();
    std::vector<std::tuple<int,int,int>> edges;
    for (int r = 0; r < n; r++)
        for (int c = 0; c < m; c++) {
            if (r + 1 < n) edges.emplace_back(std::abs(grid[r][c] - grid[r + 1][c]), r * m + c, (r + 1) * m + c);
            if (c + 1 < m) edges.emplace_back(std::abs(grid[r][c] - grid[r][c + 1]), r * m + c, r * m + c + 1);
        }
    std::sort(edges.begin(), edges.end());
    DSU dsu(n * m);
    int total = 0, taken = 0;
    for (auto& [w, a, b] : edges) {
        int ra = dsu.find(a), rb = dsu.find(b);
        if (ra != rb) { dsu.p[ra] = rb; total += w; if (++taken == n * m - 1) break; }
    }
    return total;
}
```
