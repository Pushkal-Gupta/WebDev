---
slug: graph-shortest-bridge
module: graphs
title: Shortest Bridge Between Two Islands
subtitle: Paint one island, then BFS outward through water until you touch the other — multi-source BFS.
difficulty: Advanced
position: 18
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Breadth-First Search — cp-algorithms"
    url: "https://cp-algorithms.com/graph/breadth-first-search.html"
    type: blog
  - title: "Shortest distance between two cells in a matrix or grid — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/shortest-distance-two-cells-matrix-grid/"
    type: blog
  - title: "TheAlgorithms/Python — breadth_first_search.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/breadth_first_search.py"
    type: repo
status: published
---

## intro
Given a grid with exactly two islands of 1s separated by 0s (water), the shortest bridge problem asks for the minimum number of 0s you must flip to 1s to connect the islands. The canonical solution is a two-phase BFS: first identify one island and mark its cells as a single super-source, then expand outward in waves until the wavefront crosses into the second island.

## whyItMatters
The technique — flood-fill plus multi-source BFS — generalizes to "rotten oranges," "01 matrix distance," "walls and gates," and "shortest path from any of k starts." Each is a tiny variant of the same skeleton. Solving shortest bridge cleanly proves you understand that BFS expands by distance, not by source — and that initial-queue contents control which cells are "distance zero."

## intuition
Phase 1: find one island (any connected component of 1s) with DFS/BFS and push every cell of it into a queue. Now imagine all those cells as a single mega-source at distance 0. Phase 2: run BFS over 0-cells, incrementing distance by 1 per layer. The first time the wavefront steps onto a 1 belonging to the other island, the current distance — minus 1 because the landing cell itself doesn't count as a flip — is the answer.

## visualization
Grid (1 = land, 0 = water):
```
1 1 0 0
0 1 0 0
0 0 0 1
0 0 1 1
```
Phase 1 floods the top-left island. Phase 2 BFS distances grow ring by ring: distance 1 touches three water cells, distance 2 more, until the wave hits (2,3) which is part of island 2. Bridge length = 2.

## bruteForce
For every 1-cell of one island, BFS through water and stop at the first 1-cell of the other island; track the minimum. That's O(island1 × n) where n is grid size — accepted on small grids but redundant: every BFS re-explores roughly the same water. The multi-source idea collapses all those independent searches into one.

## optimal
Single multi-source BFS. (1) Scan the grid linearly for the first 1-cell; from there DFS-flood every connected 1, mark them 2, and enqueue. (2) Pop layer by layer: for each cell, look at the four neighbors. If a neighbor is water, mark it 2 and enqueue with distance+1. If a neighbor is 1, you have reached the other island — return the current distance. Total work O(rows × cols).

## complexity
time: O(rows × cols)
space: O(rows × cols)
notes: Each cell is visited and marked at most once. The queue can hold the entire frontier — for a square grid, the worst-case frontier is the perimeter of the wave, bounded by rows + cols.

## pitfalls
- Returning the BFS distance at the *first 1-cell touch* instead of subtracting 1 — that cell is land, not water, so it doesn't count as a flip.
- Not marking flood-fill cells as visited before enqueuing — leads to infinite loops.
- Confusing 4-connectivity vs 8-connectivity — the canonical problem uses 4.
- Assuming "the first island found in row-major scan is island A" matters — it doesn't; symmetry makes either choice work.

## interviewTips
- Open with "I'll do flood-fill plus multi-source BFS," then describe both phases in one sentence each.
- Use a sentinel value (2) for "visited" instead of a separate set — saves memory and is idiomatic for grid problems.
- If the interviewer mentions "more than two islands, find the closest pair," generalize by flooding each island into its own color and running multi-source BFS from one of them.

## code.python
```python
from collections import deque

def shortest_bridge(grid):
    n, m = len(grid), len(grid[0])
    q = deque()
    def flood(r, c):
        stack = [(r, c)]
        while stack:
            i, j = stack.pop()
            if 0 <= i < n and 0 <= j < m and grid[i][j] == 1:
                grid[i][j] = 2
                q.append((i, j, 0))
                stack.extend([(i+1,j),(i-1,j),(i,j+1),(i,j-1)])
    found = False
    for r in range(n):
        if found:
            break
        for c in range(m):
            if grid[r][c] == 1:
                flood(r, c)
                found = True
                break
    while q:
        i, j, d = q.popleft()
        for di, dj in ((1,0),(-1,0),(0,1),(0,-1)):
            ni, nj = i + di, j + dj
            if 0 <= ni < n and 0 <= nj < m:
                if grid[ni][nj] == 1:
                    return d
                if grid[ni][nj] == 0:
                    grid[ni][nj] = 2
                    q.append((ni, nj, d + 1))
    return -1
```

## code.javascript
```javascript
function shortestBridge(grid) {
  const n = grid.length, m = grid[0].length;
  const q = [];
  const flood = (r, c) => {
    const stack = [[r, c]];
    while (stack.length) {
      const [i, j] = stack.pop();
      if (i < 0 || j < 0 || i >= n || j >= m || grid[i][j] !== 1) continue;
      grid[i][j] = 2;
      q.push([i, j, 0]);
      stack.push([i+1,j],[i-1,j],[i,j+1],[i,j-1]);
    }
  };
  outer: for (let r = 0; r < n; r++) {
    for (let c = 0; c < m; c++) {
      if (grid[r][c] === 1) { flood(r, c); break outer; }
    }
  }
  while (q.length) {
    const [i, j, d] = q.shift();
    for (const [di, dj] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= n || nj >= m) continue;
      if (grid[ni][nj] === 1) return d;
      if (grid[ni][nj] === 0) {
        grid[ni][nj] = 2;
        q.push([ni, nj, d + 1]);
      }
    }
  }
  return -1;
}
```

## code.java
```java
public int shortestBridge(int[][] grid) {
    int n = grid.length, m = grid[0].length;
    Deque<int[]> q = new ArrayDeque<>();
    outer:
    for (int r = 0; r < n; r++) {
        for (int c = 0; c < m; c++) {
            if (grid[r][c] == 1) {
                flood(grid, r, c, q);
                break outer;
            }
        }
    }
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    while (!q.isEmpty()) {
        int[] cur = q.poll();
        for (int[] d : dirs) {
            int ni = cur[0] + d[0], nj = cur[1] + d[1];
            if (ni < 0 || nj < 0 || ni >= n || nj >= m) continue;
            if (grid[ni][nj] == 1) return cur[2];
            if (grid[ni][nj] == 0) {
                grid[ni][nj] = 2;
                q.add(new int[]{ni, nj, cur[2] + 1});
            }
        }
    }
    return -1;
}

private void flood(int[][] grid, int r, int c, Deque<int[]> q) {
    Deque<int[]> stack = new ArrayDeque<>();
    stack.push(new int[]{r, c});
    while (!stack.isEmpty()) {
        int[] cur = stack.pop();
        int i = cur[0], j = cur[1];
        if (i < 0 || j < 0 || i >= grid.length || j >= grid[0].length || grid[i][j] != 1) continue;
        grid[i][j] = 2;
        q.add(new int[]{i, j, 0});
        stack.push(new int[]{i+1, j});
        stack.push(new int[]{i-1, j});
        stack.push(new int[]{i, j+1});
        stack.push(new int[]{i, j-1});
    }
}
```

## code.cpp
```cpp
void flood(vector<vector<int>>& grid, int r, int c, queue<tuple<int,int,int>>& q) {
    stack<pair<int,int>> st;
    st.push({r, c});
    int n = grid.size(), m = grid[0].size();
    while (!st.empty()) {
        auto [i, j] = st.top(); st.pop();
        if (i < 0 || j < 0 || i >= n || j >= m || grid[i][j] != 1) continue;
        grid[i][j] = 2;
        q.push({i, j, 0});
        st.push({i+1, j});
        st.push({i-1, j});
        st.push({i, j+1});
        st.push({i, j-1});
    }
}

int shortestBridge(vector<vector<int>>& grid) {
    int n = grid.size(), m = grid[0].size();
    queue<tuple<int,int,int>> q;
    bool found = false;
    for (int r = 0; r < n && !found; r++) {
        for (int c = 0; c < m && !found; c++) {
            if (grid[r][c] == 1) { flood(grid, r, c, q); found = true; }
        }
    }
    int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
    while (!q.empty()) {
        auto [i, j, d] = q.front(); q.pop();
        for (auto& dd : dirs) {
            int ni = i + dd[0], nj = j + dd[1];
            if (ni < 0 || nj < 0 || ni >= n || nj >= m) continue;
            if (grid[ni][nj] == 1) return d;
            if (grid[ni][nj] == 0) {
                grid[ni][nj] = 2;
                q.push({ni, nj, d + 1});
            }
        }
    }
    return -1;
}
```
