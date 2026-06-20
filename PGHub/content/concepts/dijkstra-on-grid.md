---
slug: dijkstra-on-grid
module: graphs-shortest-paths
title: Dijkstra on a Grid
subtitle: Shortest path on a 2D grid with weighted cells — coordinate-encoded priority queue.
difficulty: Intermediate
position: 12
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Part VI: Graph Algorithms (walkccc notes)"
    url: "https://walkccc.me/CLRS/"
    type: book
  - title: "cp-algorithms — Graph algorithms"
    url: "https://cp-algorithms.com/graph/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — graphs/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/graphs"
    type: repo
status: published
---

## intro
A surprising number of "shortest path on a maze" problems are really weighted: each cell has a cost (terrain difficulty, swim effort, time to traverse). BFS handles uniform-cost grids; the moment weights differ, you reach for Dijkstra — and you reach for it on an implicit graph defined by cell coordinates, not an adjacency list. Encoding `(row, col)` cleanly into the priority queue is the part that trips up most candidates.

## whyItMatters
Grid Dijkstra is the engine behind Path of Least Resistance, Swim in Rising Water, Minimum Effort Path, robotics navigation, terrain analysis, image segmentation (the seam-carve family), and game AI. The graph is never built explicitly — it would waste memory — so you have to think of neighbors as a function of coordinates, not as edges in a list.

## intuition
Treat each cell `(r, c)` as a node. Its neighbors are the four (or eight) adjacent cells. The "edge weight" from `(r, c)` to a neighbor is determined by the problem: the neighbor's value (Path of Least Resistance), `max(current_height, neighbor_height)` (Minimum Effort), or `max(0, neighbor.time - now)` (Swim in Rising Water). Run Dijkstra: always extract the cheapest unsettled cell, relax its four neighbors, push them back if improved. Done when the destination is popped.

## visualization
```
Grid of weights (cost to enter each cell):
  [1, 3, 1, 1, 1]
  [1, 5, 9, 9, 1]
  [1, 5, 1, 1, 1]
  [1, 1, 1, 5, 1]

dist[][] init to INF, dist[0][0] = 1, pq = [(1, 0, 0)]
pop (1,0,0) -> relax (1,0) cost 1+1=2 push, (0,1) cost 1+3=4 push
pop (2,1,0) -> relax (2,0) ... continue

Final shortest cost path (start top-left, end bottom-right):
  1 -> 1 -> 1 -> 1 -> 1 -> 1 -> 1 -> 1   total = 8
        down column 0, then across row 3
```

## bruteForce
Plain BFS treats each move as cost 1, which is wrong the moment cells have different weights — it returns the path with the fewest steps, not the lowest total cost. DFS with memoization seems tempting but fails because the cost-from-source isn't a function of `(r, c)` alone — it depends on the path, so memoization is unsound. Brute-force enumeration of all paths is exponential.

## optimal
Dijkstra with a min-heap keyed by accumulated cost. Encode coordinates as `r * cols + c` for a flat `dist` array (cache-friendly) or use a 2D array.

```
dist[r][c] = INF for all (r, c)
dist[0][0] = cost(0, 0)
pq = MinHeap of (dist, r, c)
push (cost(0,0), 0, 0)
while pq non-empty:
    d, r, c = pop()
    if (r, c) == target: return d
    if d > dist[r][c]: continue            # stale entry
    for (nr, nc) in 4-neighbors(r, c):
        if out of bounds: continue
        nd = d + edgeWeight((r,c) -> (nr,nc))   # problem-specific
        if nd < dist[nr][nc]:
            dist[nr][nc] = nd
            push (nd, nr, nc)
```

Key tricks:
- **Lazy deletion**: heaps without `decreaseKey` push duplicates and skip stale pops via the `d > dist[r][c]` guard.
- **Flat indexing**: `key = r * cols + c` avoids tuple hashing overhead in hot loops.
- **Direction array**: `dr = [-1, 1, 0, 0], dc = [0, 0, -1, 1]` keeps neighbor logic terse and bug-free.
- **Diagonals**: add four more deltas with cost `sqrt(2)` (or whatever the problem dictates) — same algorithm.

## complexity
- **Time**: `O(R * C * log(R * C))` with a binary heap — every cell is relaxed at most a constant number of times, each relaxation costs `O(log V)`.
- **Space**: `O(R * C)` for `dist` plus heap size (bounded by `O(R * C)` thanks to the stale-entry skip).
- **Speedup**: A\* with a Manhattan-distance heuristic prunes the search frontier dramatically when the destination is known — same correctness, often 5-10x faster in practice.

## pitfalls
- **Pushing all neighbors unconditionally** without the `nd < dist[nr][nc]` check — heap explodes and runtime degrades to `O((RC)^2 log)`.
- **Forgetting the stale-entry skip** (`if d > dist[r][c]: continue`) — correctness holds but every cell gets re-relaxed N times.
- **Using BFS on a weighted grid** because the cells look uniform — re-read the cost function. If all weights equal, BFS is fine; if not, Dijkstra.
- **Negative weights**: Dijkstra breaks. Grids rarely have them, but if the problem injects negatives, switch to Bellman-Ford or SPFA.
- **Including the source cost twice or not at all** — pick a convention and stick with it. Most grid problems count the start cell.
- **Tuple comparison in the heap**: Python's heap will compare `(cost, r, c)` lexicographically — if cost ties, it compares `r`, then `c`, which is fine; in Java/C++ provide an explicit comparator on the first field only.

## interviewTips
- The moment the interviewer mentions "weighted cells" or "minimum effort," lock in Dijkstra and say so.
- Sketch the algorithm in pseudocode before coding — most candidates lose points by jumping into PriorityQueue syntax.
- Always mention the lazy-deletion trick (push-don't-decrease) — it's the standard production pattern.
- For huge grids, mention **A* with Manhattan/Euclidean heuristic** as the upgrade.
- For "minimum maximum edge weight" variants, mention you'd replace `nd = d + w` with `nd = max(d, w)` — same skeleton, different relaxation function.

## code.python
```python
import heapq

def shortest_grid(cost):
    R, C = len(cost), len(cost[0])
    INF = float("inf")
    dist = [[INF] * C for _ in range(R)]
    dist[0][0] = cost[0][0]
    pq = [(cost[0][0], 0, 0)]
    while pq:
        d, r, c = heapq.heappop(pq)
        if (r, c) == (R - 1, C - 1):
            return d
        if d > dist[r][c]:
            continue
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C:
                nd = d + cost[nr][nc]
                if nd < dist[nr][nc]:
                    dist[nr][nc] = nd
                    heapq.heappush(pq, (nd, nr, nc))
    return -1
```

## code.javascript
```javascript
function shortestGrid(cost) {
  const R = cost.length, C = cost[0].length;
  const dist = Array.from({ length: R }, () => Array(C).fill(Infinity));
  dist[0][0] = cost[0][0];
  const pq = [[cost[0][0], 0, 0]];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, r, c] = pq.shift();
    if (r === R - 1 && c === C - 1) return d;
    if (d > dist[r][c]) continue;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C) {
        const nd = d + cost[nr][nc];
        if (nd < dist[nr][nc]) { dist[nr][nc] = nd; pq.push([nd, nr, nc]); }
      }
    }
  }
  return -1;
}
```

## code.java
```java
import java.util.*;
class GridDijkstra {
    public int shortestGrid(int[][] cost) {
        int R = cost.length, C = cost[0].length;
        int[][] dist = new int[R][C];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
        dist[0][0] = cost[0][0];
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.offer(new int[] { cost[0][0], 0, 0 });
        int[] dr = { -1, 1, 0, 0 }, dc = { 0, 0, -1, 1 };
        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            int d = cur[0], r = cur[1], c = cur[2];
            if (r == R - 1 && c == C - 1) return d;
            if (d > dist[r][c]) continue;
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C) {
                    int nd = d + cost[nr][nc];
                    if (nd < dist[nr][nc]) { dist[nr][nc] = nd; pq.offer(new int[] { nd, nr, nc }); }
                }
            }
        }
        return -1;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <queue>
#include <climits>
using namespace std;
int shortestGrid(vector<vector<int>>& cost) {
    int R = cost.size(), C = cost[0].size();
    vector<vector<int>> dist(R, vector<int>(C, INT_MAX));
    dist[0][0] = cost[0][0];
    priority_queue<tuple<int,int,int>, vector<tuple<int,int,int>>, greater<>> pq;
    pq.push({cost[0][0], 0, 0});
    int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!pq.empty()) {
        auto [d, r, c] = pq.top(); pq.pop();
        if (r == R - 1 && c == C - 1) return d;
        if (d > dist[r][c]) continue;
        for (int k = 0; k < 4; ++k) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr >= 0 && nr < R && nc >= 0 && nc < C) {
                int nd = d + cost[nr][nc];
                if (nd < dist[nr][nc]) { dist[nr][nc] = nd; pq.push({nd, nr, nc}); }
            }
        }
    }
    return -1;
}
```
