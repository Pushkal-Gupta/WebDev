---
slug: island-count-bfs
module: graphs
title: Count Islands (Grid Flood Fill)
subtitle: A 2-D grid is an implicit graph; flood-fill each unvisited land cell to count connected components.
difficulty: Beginner
position: 44
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Connected Components"
    url: "https://algs4.cs.princeton.edu/41graph/"
    type: book
  - title: "GeeksforGeeks — Find the number of islands"
    url: "https://www.geeksforgeeks.org/find-number-of-islands/"
    type: blog
  - title: "TheAlgorithms/Python — matrix/count_islands_in_matrix.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/matrix/count_islands_in_matrix.py"
    type: repo
status: published
---

## intro
Given an `m × n` grid of `'1'` (land) and `'0'` (water), count the number of islands — connected groups of land cells joined horizontally or vertically. This is the simplest "connected components on a grid" problem and the canonical entry point for flood-fill thinking. Each cell is a vertex; each pair of orthogonally adjacent land cells is an edge. Scan the grid, and whenever you hit an unvisited land cell, flood-fill its entire island (marking it visited) and increment the counter.

## whyItMatters
Flood fill underpins paint-bucket tools, region labeling in image processing, percolation simulations, biome detection in maps, and any "spreading from a seed" operation. As an interview pattern, it generalizes to "count regions where X," "largest island," "shortest distance to nearest land," and "surrounded regions" — all variants on the same BFS/DFS template. The grid-as-implicit-graph idea also extends seamlessly to mazes, knight tours, and game-state searches.

## intuition
The grid is a graph with up to 4 outgoing edges per cell (up/down/left/right). Two phases:

1. **Outer scan:** walk every cell. If it is unvisited land, start a new flood and increment the island count.
2. **Flood fill (BFS or DFS):** from the seed cell, push every connected land cell into a queue/stack; mark each as visited (either flip its value to `'0'` in-place or use a separate visited matrix).

Each cell is touched at most once across the whole algorithm — the outer loop and the floods together are O(m·n). The number of floods equals the number of islands.

A neat space optimization: mutate the grid by overwriting visited land with water. This eliminates the visited matrix and saves O(m·n) extra memory, at the cost of destroying the input. Mention both options in an interview.

## walkthroughExample
Grid (4×5):
```
   1 1 0 0 0
   1 1 0 0 1
   0 0 1 0 1
   0 0 0 1 1
```

Outer scan, row by row. Encounter cells in scan order.

```
   (0,0)='1' unvisited -> count=1, BFS flood:
       queue: [(0,0)]
       pop (0,0); mark; push neighbors (1,0),(0,1)
       pop (0,1); mark; push (1,1)
       pop (1,0); mark; push (1,1) -- already queued, skip dup
       pop (1,1); mark; no new land neighbors
       island 1 = {(0,0),(0,1),(1,0),(1,1)}

   continue scanning... cells (0,2)..(1,3) are water.
   (1,4)='1' unvisited -> count=2, BFS flood:
       (1,4) -> (2,4)
       (2,4) -> (3,4)
       (3,4) -> (3,3)
       (3,3) -> (3,4) visited
       island 2 = {(1,4),(2,4),(3,4),(3,3)}

   continue... (2,2)='1' unvisited -> count=3, BFS flood:
       (2,2) only — its 4 neighbors are water
       island 3 = {(2,2)}

   answer: 3 islands.
```

## visualization
Snapshot 1 — three islands isolated by water:
```
   1 1 . . .
   1 1 . . 1
   . . 1 . 1
   . . . 1 1
   (dots = water for readability)
```

Snapshot 2 — BFS flood from seed (0,0):
```
   frontier expansion (round, cells added):
     round 0:  {(0,0)}
     round 1:  {(1,0), (0,1)}
     round 2:  {(1,1)}
     round 3:  {}  (no more land neighbors)
```

Snapshot 3 — outer loop vs flood:
```
   outer scan visits every cell once     -> m*n
   each flood marks each visited land    -> total work across all floods = (#land cells)
   sum:  O(m*n)
```

Snapshot 4 — in-place sinking vs visited matrix:
```
   in-place:    grid[r][c] = '0' after visit  (no extra memory)
   visited[][]: boolean matrix              (input preserved)
   pick based on whether the caller can tolerate mutation.
```

## bruteForce
Treat each land cell as the root of its own search and union with neighbors using DFS that *does not* mark visited globally. You end up rediscovering the same island from many cells, paying O((m·n)²). Adding a visited set turns this into the optimal algorithm.

A Union-Find approach is also O(m·n·α(m·n)) and is required when the grid changes dynamically (LC 305 "Number of Islands II"). For a static grid, BFS/DFS is simpler and just as fast.

## optimal
```
def numIslands(grid):
    if not grid: return 0
    m, n = len(grid), len(grid[0])
    count = 0
    for r in range(m):
        for c in range(n):
            if grid[r][c] == '1':
                count += 1
                queue = deque([(r, c)])
                grid[r][c] = '0'
                while queue:
                    x, y = queue.popleft()
                    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                        nx, ny = x+dx, y+dy
                        if 0 <= nx < m and 0 <= ny < n and grid[nx][ny] == '1':
                            grid[nx][ny] = '0'
                            queue.append((nx, ny))
    return count
```

DFS recursion works identically but risks stack overflow on huge grids (up to m·n ≈ 10⁶ in some constraints). Prefer BFS or iterative DFS in production.

## complexity
time: O(m·n) — each cell visited once by the outer loop, once by a flood.
space: O(min(m, n)) BFS queue in the worst case (a snake-shaped island); O(m·n) if you keep a visited matrix instead of mutating; O(m·n) recursion depth for naive DFS on a pathological grid.
notes: Diagonal connectivity (8 neighbors) is a one-line change. For very large grids consider streaming row-by-row with a Union-Find variant.

## pitfalls
- Forgetting to mark a cell visited *immediately* when enqueueing — it gets enqueued multiple times from different neighbors, leading to redundant work and inflated queue size.
- Treating `'1'` and `1` interchangeably. Grid values are usually characters; compare with `'1'`, not the integer.
- Bounds checks off-by-one: `0 <= nx < m` and `0 <= ny < n`, not `<=`. Easy to get wrong under time pressure.
- Mutating the input when the caller did not expect it. State the trade-off explicitly or use a `visited` set.
- Counting diagonal neighbors when the spec says orthogonal only — re-read the problem definition.

## interviewTips
- Open by saying "the grid is a graph with up to 4 edges per cell" — interviewers like the framing.
- Discuss BFS vs DFS up front. Pick BFS for safety in deep grids; DFS for compactness in small ones.
- Mention the in-place "sink the island" trick *and* the visited-matrix alternative. Demonstrating you weigh the trade-off is worth a point.
- For follow-ups: "max area of island" (return max instead of count); "number of distinct shapes" (hash a normalized representation of each island); "number of closed islands" (don't count islands touching the border).

## code.python
```python
from collections import deque

def numIslands(grid):
    if not grid: return 0
    m, n = len(grid), len(grid[0])
    count = 0
    for r in range(m):
        for c in range(n):
            if grid[r][c] == '1':
                count += 1
                queue = deque([(r, c)])
                grid[r][c] = '0'
                while queue:
                    x, y = queue.popleft()
                    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < m and 0 <= ny < n and grid[nx][ny] == '1':
                            grid[nx][ny] = '0'
                            queue.append((nx, ny))
    return count
```

## code.javascript
```javascript
function numIslands(grid) {
  if (!grid || !grid.length) return 0;
  const m = grid.length, n = grid[0].length;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  let count = 0;
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === '1') {
        count++;
        const queue = [[r, c]];
        grid[r][c] = '0';
        while (queue.length) {
          const [x, y] = queue.shift();
          for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < m && ny >= 0 && ny < n && grid[nx][ny] === '1') {
              grid[nx][ny] = '0';
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
  }
  return count;
}
```

## code.java
```java
public int numIslands(char[][] grid) {
    if (grid == null || grid.length == 0) return 0;
    int m = grid.length, n = grid[0].length, count = 0;
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    for (int r = 0; r < m; r++) {
        for (int c = 0; c < n; c++) {
            if (grid[r][c] == '1') {
                count++;
                Deque<int[]> queue = new ArrayDeque<>();
                queue.offer(new int[]{r, c});
                grid[r][c] = '0';
                while (!queue.isEmpty()) {
                    int[] p = queue.poll();
                    for (int[] d : dirs) {
                        int nx = p[0] + d[0], ny = p[1] + d[1];
                        if (nx >= 0 && nx < m && ny >= 0 && ny < n && grid[nx][ny] == '1') {
                            grid[nx][ny] = '0';
                            queue.offer(new int[]{nx, ny});
                        }
                    }
                }
            }
        }
    }
    return count;
}
```

## code.cpp
```cpp
int numIslands(vector<vector<char>>& grid) {
    if (grid.empty()) return 0;
    int m = grid.size(), n = grid[0].size(), count = 0;
    vector<pair<int,int>> dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    for (int r = 0; r < m; r++) {
        for (int c = 0; c < n; c++) {
            if (grid[r][c] == '1') {
                count++;
                queue<pair<int,int>> q;
                q.push({r, c});
                grid[r][c] = '0';
                while (!q.empty()) {
                    auto [x, y] = q.front(); q.pop();
                    for (auto [dx, dy] : dirs) {
                        int nx = x + dx, ny = y + dy;
                        if (nx >= 0 && nx < m && ny >= 0 && ny < n && grid[nx][ny] == '1') {
                            grid[nx][ny] = '0';
                            q.push({nx, ny});
                        }
                    }
                }
            }
        }
    }
    return count;
}
```
