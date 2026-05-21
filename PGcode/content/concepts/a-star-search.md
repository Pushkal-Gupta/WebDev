---
slug: a-star-search
module: graphs
title: A* Search
subtitle: Dijkstra with a heuristic — finds the shortest path while exploring far fewer nodes when guidance is good.
difficulty: Advanced
position: 25
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Hart, Nilsson & Raphael (1968) — A Formal Basis for the Heuristic Determination of Minimum Cost Paths"
    url: ""
status: published
---

## intro
A* (A-star) finds the shortest path from a start node to a goal in a weighted graph. It generalizes Dijkstra by adding a **heuristic** `h(n)` — an estimate of the remaining cost from `n` to the goal. With a good heuristic, A* expands dramatically fewer nodes than Dijkstra while still returning the optimal path (provided the heuristic is *admissible* — never overestimates).

## whyItMatters
A*, not Dijkstra, is what powers route planning (Google Maps, GPS), game AI pathfinding (RPGs, RTS), and puzzle solvers (15-puzzle, Rubik's cube optimal solvers). When the search space is huge — millions of road intersections, billions of puzzle states — Dijkstra's "expand uniformly outward" approach is hopeless. A*'s "expand toward the goal" approach makes it tractable.

## intuition
Dijkstra picks the next node by `g(n)` — the actual cost so far. A* picks by `f(n) = g(n) + h(n)` — actual cost + estimated remaining cost. If `h` is zero everywhere, A* degenerates to Dijkstra. If `h` is the *exact* remaining cost (the oracle), A* visits only nodes on the optimal path. Real-world heuristics sit in between: straight-line distance for road graphs, Manhattan distance for grids, Hamming distance for puzzle states.

## visualization
```
Grid pathfinding (S = start, G = goal, # = wall):
.  .  .  .  .  .  .
.  S  .  #  .  .  .
.  .  .  #  .  .  .
.  .  .  #  .  G  .
.  .  .  .  .  .  .

A* explores roughly along the S→G corridor (a wedge of cells)
Dijkstra explores a near-uniform circle outward from S
Same answer, A* visits ~5–10× fewer cells in this open layout.
```

## bruteForce
BFS for unweighted, Dijkstra for weighted. Both ignore the goal direction and expand uniformly. Correct but wasteful when you know roughly where the goal is.

## optimal
```
open  ← priority queue ordered by f
came_from ← {}
g[start] = 0
f[start] = h(start)
push(open, (f[start], start))

while open is not empty:
    current = pop(open)
    if current == goal: return reconstruct(came_from, current)
    for each neighbor n of current with edge cost w:
        tentative_g = g[current] + w
        if tentative_g < g[n]:               # found a better path to n
            came_from[n] = current
            g[n] = tentative_g
            f[n] = tentative_g + h(n)
            push(open, (f[n], n))            # decrease-key, or push again and skip stale entries
return failure
```

**Heuristic requirements**:
- **Admissible** (never overestimates): guarantees optimality.
- **Consistent / monotonic** (`h(n) ≤ cost(n, n') + h(n')`): guarantees no node is expanded twice. Implies admissible.

Common heuristics:
- Grid 4-directional: Manhattan distance `|dx| + |dy|`.
- Grid 8-directional: Chebyshev distance `max(|dx|, |dy|)`.
- Euclidean / 2D continuous: straight-line distance.
- 15-puzzle: sum of Manhattan distances of each tile from its goal.
- Rubik's cube: pattern database lookups.

## complexity
- **Time**: O(E log V) worst case (same as Dijkstra). With a perfect heuristic: O(d) where d is solution depth.
- **Space**: O(V) for `g`, `came_from`, and open set.
- **Branching factor reduction**: an admissible heuristic that's close to the true cost cuts the effective branching factor dramatically.

## pitfalls
- **Inadmissible heuristic**: returns a suboptimal path. Will run fast but find the wrong answer.
- **Inconsistent heuristic**: can re-expand the same node many times. Use the "closed set + reopen if better" variant or switch to a consistent heuristic.
- **Tie-breaking**: when multiple nodes have the same `f`, prefer higher `g` (closer to goal) — explores fewer total nodes.
- **Heavy heuristic computation**: if `h(n)` is expensive (e.g. database lookup), it can dominate runtime. Sometimes a cheaper but weaker heuristic wins overall.
- **Memory**: open set + closed set on huge grids can blow RAM. Use IDA* (iterative deepening A*) for puzzles where memory is tight.

## interviewTips
- For "find shortest path with a hint about the goal location" (grid, road network, game map), A* is the answer.
- Always state the heuristic and prove it's admissible.
- Compare with **Dijkstra** (uniform-cost, no heuristic) and **greedy best-first** (only `h`, ignores `g` — fast but not optimal).
- For senior-level, mention **IDA*** for memory-constrained, **bidirectional A*** for huge graphs (search forward from S and backward from G, meet in the middle).

## code.python
```python
import heapq

def a_star(start, goal, neighbors, h):
    open_set = [(h(start), 0, start)]
    g = {start: 0}
    came_from = {}
    while open_set:
        _, gn, n = heapq.heappop(open_set)
        if n == goal:
            path = [n]
            while n in came_from:
                n = came_from[n]; path.append(n)
            return path[::-1]
        for nb, w in neighbors(n):
            tentative = gn + w
            if tentative < g.get(nb, float('inf')):
                came_from[nb] = n
                g[nb] = tentative
                heapq.heappush(open_set, (tentative + h(nb), tentative, nb))
    return None

# Example: grid, Manhattan heuristic.
def grid_neighbors(rows, cols, walls):
    def nb(p):
        r, c = p
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr,nc) not in walls:
                yield (nr,nc), 1
    return nb

def manhattan(goal):
    return lambda p: abs(p[0]-goal[0]) + abs(p[1]-goal[1])

walls = {(1,3), (2,3), (3,3)}
path = a_star((1,1), (3,5), grid_neighbors(5, 7, walls), manhattan((3,5)))
print(path)
```

## code.javascript
```javascript
function aStar(start, goal, neighbors, h, key = JSON.stringify) {
  const open = [[h(start), 0, start]];
  const g = new Map([[key(start), 0]]);
  const came = new Map();
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]);
    const [, gn, n] = open.shift();
    if (key(n) === key(goal)) {
      const path = [n];
      let cur = key(n);
      while (came.has(cur)) { const prev = came.get(cur); path.push(prev); cur = key(prev); }
      return path.reverse();
    }
    for (const [nb, w] of neighbors(n)) {
      const t = gn + w;
      if (t < (g.get(key(nb)) ?? Infinity)) {
        came.set(key(nb), n); g.set(key(nb), t);
        open.push([t + h(nb), t, nb]);
      }
    }
  }
  return null;
}
```

## code.java
```java
import java.util.*;
class AStar {
    static <N> List<N> search(N start, N goal,
            java.util.function.Function<N, List<Map.Entry<N, Integer>>> neighbors,
            java.util.function.ToIntFunction<N> h) {
        PriorityQueue<int[]> open = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        Map<N, Integer> g = new HashMap<>(); g.put(start, 0);
        Map<N, N> came = new HashMap<>();
        Map<Integer, N> nodeByIdx = new HashMap<>();
        int idx = 0; nodeByIdx.put(idx, start);
        open.add(new int[]{ h.applyAsInt(start), 0, idx++ });
        while (!open.isEmpty()) {
            int[] e = open.poll(); N n = nodeByIdx.get(e[2]); int gn = e[1];
            if (n.equals(goal)) {
                LinkedList<N> path = new LinkedList<>(); N cur = n;
                while (cur != null) { path.addFirst(cur); cur = came.get(cur); }
                return path;
            }
            for (var nb : neighbors.apply(n)) {
                int t = gn + nb.getValue();
                if (t < g.getOrDefault(nb.getKey(), Integer.MAX_VALUE)) {
                    came.put(nb.getKey(), n); g.put(nb.getKey(), t);
                    nodeByIdx.put(idx, nb.getKey());
                    open.add(new int[]{ t + h.applyAsInt(nb.getKey()), t, idx++ });
                }
            }
        }
        return null;
    }
}
```

## code.cpp
```cpp
#include <queue>
#include <unordered_map>
#include <vector>
#include <functional>
template<class N>
std::vector<N> aStar(N start, N goal,
        std::function<std::vector<std::pair<N,int>>(const N&)> neighbors,
        std::function<int(const N&)> h) {
    using Node = std::tuple<int,int,N>;
    std::priority_queue<Node, std::vector<Node>, std::greater<>> open;
    std::unordered_map<N,int> g; g[start] = 0;
    std::unordered_map<N,N> came;
    open.push({h(start), 0, start});
    while (!open.empty()) {
        auto [_, gn, n] = open.top(); open.pop();
        if (n == goal) {
            std::vector<N> path = {n};
            while (came.count(path.back())) path.push_back(came[path.back()]);
            std::reverse(path.begin(), path.end());
            return path;
        }
        for (auto& [nb, w] : neighbors(n)) {
            int t = gn + w;
            if (!g.count(nb) || t < g[nb]) {
                came[nb] = n; g[nb] = t;
                open.push({t + h(nb), t, nb});
            }
        }
    }
    return {};
}
```
