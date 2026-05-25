---
slug: astar-search
module: graphs-shortest-paths
title: A* Search
subtitle: Best-first search guided by an admissible heuristic — optimal paths, far fewer expansions.
difficulty: Advanced
position: 40
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "A* — cp-algorithms (Shortest Paths)"
    url: "https://cp-algorithms.com/graph/dijkstra.html"
    type: blog
  - title: "A* Search Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/a-search-algorithm/"
    type: blog
  - title: "TheAlgorithms/Python — a_star.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/a_star.py"
    type: repo
status: published
---

## intro
A* is the textbook "informed" shortest-path algorithm. It generalizes Dijkstra by adding a heuristic estimate `h(n)` of the remaining cost from each frontier node to the goal. Where Dijkstra spreads out uniformly in every direction, A* preferentially expands nodes that look promising — usually orders of magnitude fewer expansions on grid and road-network problems.

## whyItMatters
Path-finding on game maps, robot navigation, route planning, and puzzle solving all reduce to "shortest path in a graph that is too large to fully explore." A* is the standard answer. The catch is the heuristic — pick the wrong one and you either lose optimality or get no speedup at all. Understanding admissibility and consistency lets you design heuristics that actually work for the domain in front of you.

## intuition
The algorithm exists because Dijkstra expands nodes in order of `g(n)` — the cost from the start — without any awareness of where the goal lies. On a graph with a million cells and a goal in the corner, Dijkstra expands every node whose distance from the start is less than the goal's distance, which is roughly half the entire graph. The expansion fans out symmetrically like a ripple on water — beautifully simple, wastefully uninformed.

The decisive observation, due to Hart, Nilsson, and Raphael 1968, is that if you have any *estimate* `h(n)` of the remaining cost from n to the goal, you can use `f(n) = g(n) + h(n)` as the priority queue key instead. `f(n)` is an estimate of the total path cost through n; nodes with smaller `f` look more promising and get expanded first. As long as `h` never *overestimates* the true remaining cost — the **admissibility** condition — A* is provably optimal: the first time it pops the goal, the path cost is the true shortest path.

The admissibility argument: at any moment when A* is about to expand a node n with f(n) = g(n) + h(n), there is some node n' on the optimal path that is currently in the open set. If h is admissible, f(n') = g(n') + h(n') ≤ g(n') + true_remaining(n') = optimal_cost. So if n is popped before the goal, then f(n) ≤ f(n') ≤ optimal_cost, meaning any path through n cannot be worse than optimal. When the goal is popped, its f-value equals g(goal) (because h(goal) = 0), and g(goal) is bounded by all the f-values popped before it, all ≤ optimal_cost. So g(goal) = optimal_cost.

A stronger condition — **consistency** (monotonicity): for every edge (n, m), `h(n) ≤ cost(n, m) + h(m)` — guarantees that no node is ever reopened after being settled, simplifying implementation. Common consistent heuristics: Manhattan distance for 4-connected grids; Chebyshev for 8-connected grids with unit cost; Euclidean for grids allowing diagonal moves with cost √2; "great-circle distance" for road networks.

The deeper principle: Dijkstra is the special case of A* with h ≡ 0 (no information). Best-first greedy search is the opposite extreme with g ≡ 0 (only the heuristic guides). A* sits in between, exactly leveraging both the actual cost-so-far and the estimated remaining cost. Production systems extend A* with bidirectional search (Dijkstra/A* from both endpoints), contraction hierarchies (precompute shortcut edges on road graphs), and IDA* (iterative deepening for memory-constrained puzzle solving).

## visualization
On a 10x10 grid with start `(0,0)`, goal `(9,9)`, and a wall down column 5, Dijkstra expands an expanding diamond of roughly 100 cells before reaching the goal. A* with the Manhattan-distance heuristic expands a narrow corridor hugging the diagonal, peeling around the wall — about 25 cells. Same optimal path length, a quarter of the work.

## bruteForce
Plain Dijkstra: priority queue keyed by `g(n)`. Pop the smallest, relax its neighbors, repeat. It is optimal and complete on graphs with non-negative weights, but it explores every node whose true distance is less than the goal's. On a million-cell map with a goal in the corner that is roughly the entire map. Correct, but wasteful when you already have a sense of which direction the goal lies.

## optimal
**Technique: best-first search ordered by `f(n) = g(n) + h(n)` with admissible heuristic — Hart-Nilsson-Raphael 1968.** Worst-case O(E log V), same as Dijkstra; in practice dramatically fewer expansions on goal-directed graphs (Manhattan grid: ~quartile of Dijkstra's exploration). Optimal among informed-search algorithms when the heuristic is admissible.

```python
import heapq

def astar(start, goal, neighbors, heuristic):
    open_heap = [(heuristic(start, goal), 0, start)]
    g_score = {start: 0}
    came_from = {}
    closed = set()                                          # only safe with consistent heuristic
    while open_heap:
        f, g, node = heapq.heappop(open_heap)
        if node == goal:
            path = [node]
            while node in came_from:
                node = came_from[node]
                path.append(node)
            return list(reversed(path)), g
        if node in closed:                                   # lazy deletion of stale entries
            continue
        closed.add(node)
        for m, w in neighbors(node):
            tentative = g + w
            if tentative < g_score.get(m, float('inf')):
                g_score[m] = tentative
                came_from[m] = node
                heapq.heappush(open_heap, (tentative + heuristic(m, goal), tentative, m))
    return None, float('inf')                                # goal unreachable
```

Key lines: `f, g, node = heapq.heappop(open_heap)` pops the node with smallest `f = g + h`. `closed.add(node)` is safe to use as "never revisit" *only* when the heuristic is consistent (Manhattan, Euclidean on appropriate grids, great-circle on road graphs); with an admissible-but-not-consistent heuristic, you must allow re-expansion (remove the `closed` check and instead skip entries where the popped `g` is worse than the stored `g_score`).

The `g_score.get(m, float('inf'))` comparison handles both first-visit and revisit cases: if m has never been seen, its current g is infinity, so any tentative cost improves. If m has been seen with worse cost, the improvement is recorded and the node is re-pushed onto the heap. Stale entries get skipped via the `closed` check (consistent case) or via the lazy `if g > g_score[node]: continue` check (admissible case).

**Choice of heuristic**:
- **4-connected grid (up/down/left/right only)**: Manhattan distance `|dx| + |dy|`. Consistent.
- **8-connected grid (with diagonal moves of cost √2)**: octile distance `(D1 - D2)·|dx-dy| + D1·max(|dx|, |dy|)` with D1 = √2, D2 = 1. Consistent.
- **Road network with great-circle distance**: Haversine formula. Consistent on planar projections.
- **Puzzle solving (8-puzzle, Rubik's cube)**: pattern databases, Manhattan distance over tile positions.
- **h ≡ 0**: collapses to Dijkstra (always optimal but no speedup).
- **Inflated h (e.g., 1.5 × Manhattan)**: weighted A*; faster but loses optimality guarantee (returns paths within the inflation factor of optimal).

**Why not Dijkstra?** Dijkstra explores everything closer than the goal in *every direction*; A* explores preferentially toward the goal. On 1M-cell maps with corner goals, A* can be 100× faster. **Why not greedy best-first (`f = h`)?** Fast but not optimal — can return paths arbitrarily worse than optimal. **Why not bidirectional A***?  Bidirectional search (Dijkstra/A* from both endpoints, meeting in the middle) can halve expansions further; production routing engines (Google Maps, OSRM) use contraction hierarchies built on top of bidirectional A*. **Common bugs**: inadmissible heuristic (terminates but returns suboptimal path silently); h(goal) ≠ 0 (breaks the termination correctness); using closed set with non-consistent heuristic (misses re-expansion); forgetting to handle the unreachable case (return None when heap empties without finding goal).

## complexity
time: O(E log V) with a binary heap, identical to Dijkstra worst case; in practice dominated by the heuristic's quality
space: O(V) for `g_score`, `came_from`, and the open set
notes: With an admissible but not consistent heuristic you may need to reopen settled nodes. With a consistent heuristic you can use a closed set and never revisit. The Manhattan heuristic is consistent on 4-connected grids; Euclidean is consistent on grids that allow diagonal moves with cost sqrt(2).

## pitfalls
- Using an inadmissible heuristic — A* will still terminate, but the path it returns may be suboptimal.
- Picking `h == 0` reduces A* to Dijkstra. Picking `h` too aggressive (overestimating) gives a greedy best-first search that is fast but wrong.
- Forgetting to check whether a popped node has a stale `g` value when entries are pushed multiple times; lazy deletion needs a skip on stale pops.
- Using Euclidean distance on a grid with 4-connected moves only — it is admissible but unnecessarily loose; Manhattan is tighter and faster to compute.

## interviewTips
- Be ready to argue admissibility on the spot for your chosen heuristic.
- Mention that Dijkstra is the `h == 0` special case of A* — interviewers like the unification.
- For grid problems, default to Manhattan for 4-connected and Chebyshev or Euclidean for 8-connected.

## code.python
```python
import heapq

def astar(start, goal, neighbors, heuristic):
    open_heap = [(heuristic(start, goal), 0, start)]
    g_score = {start: 0}
    came_from = {}
    while open_heap:
        f, g, node = heapq.heappop(open_heap)
        if node == goal:
            path = [node]
            while node in came_from:
                node = came_from[node]
                path.append(node)
            return path[::-1]
        if g > g_score.get(node, float('inf')):
            continue
        for nbr, w in neighbors(node):
            tentative = g + w
            if tentative < g_score.get(nbr, float('inf')):
                g_score[nbr] = tentative
                came_from[nbr] = node
                heapq.heappush(open_heap, (tentative + heuristic(nbr, goal), tentative, nbr))
    return None

def manhattan(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])
```

## code.javascript
```javascript
function astar(start, goal, neighbors, heuristic, key = (n) => n.join(',')) {
  const open = [[heuristic(start, goal), 0, start]];
  const g = new Map([[key(start), 0]]);
  const came = new Map();
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]);
    const [, gn, node] = open.shift();
    const nk = key(node);
    if (nk === key(goal)) {
      const path = [node];
      let k = nk;
      while (came.has(k)) { const prev = came.get(k); path.push(prev.node); k = prev.key; }
      return path.reverse();
    }
    if (gn > g.get(nk)) continue;
    for (const [nbr, w] of neighbors(node)) {
      const mk = key(nbr);
      const t = gn + w;
      if (t < (g.get(mk) ?? Infinity)) {
        g.set(mk, t);
        came.set(mk, { node, key: nk });
        open.push([t + heuristic(nbr, goal), t, nbr]);
      }
    }
  }
  return null;
}

const manhattan = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
```

## code.java
```java
import java.util.*;

public List<int[]> astar(int[] start, int[] goal,
                         java.util.function.Function<int[], List<int[][]>> neighbors,
                         java.util.function.BiFunction<int[], int[], Integer> heuristic) {
    PriorityQueue<int[]> open = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    Map<String, Integer> g = new HashMap<>();
    Map<String, int[]> came = new HashMap<>();
    String sk = start[0] + "," + start[1];
    String gk = goal[0] + "," + goal[1];
    open.offer(new int[]{heuristic.apply(start, goal), 0, start[0], start[1]});
    g.put(sk, 0);
    while (!open.isEmpty()) {
        int[] top = open.poll();
        int gn = top[1];
        int[] node = new int[]{top[2], top[3]};
        String nk = node[0] + "," + node[1];
        if (nk.equals(gk)) {
            List<int[]> path = new ArrayList<>();
            int[] cur = node;
            String k = nk;
            path.add(cur);
            while (came.containsKey(k)) {
                cur = came.get(k);
                path.add(cur);
                k = cur[0] + "," + cur[1];
            }
            Collections.reverse(path);
            return path;
        }
        if (gn > g.getOrDefault(nk, Integer.MAX_VALUE)) continue;
        for (int[][] e : neighbors.apply(node)) {
            int[] nbr = e[0];
            int w = e[1][0];
            int t = gn + w;
            String mk = nbr[0] + "," + nbr[1];
            if (t < g.getOrDefault(mk, Integer.MAX_VALUE)) {
                g.put(mk, t);
                came.put(mk, node);
                open.offer(new int[]{t + heuristic.apply(nbr, goal), t, nbr[0], nbr[1]});
            }
        }
    }
    return null;
}
```

## code.cpp
```cpp
#include <queue>
#include <unordered_map>
#include <vector>
#include <functional>
#include <limits>

using Cell = std::pair<int,int>;

std::vector<Cell> astar(Cell start, Cell goal,
                        std::function<std::vector<std::pair<Cell,int>>(Cell)> neighbors,
                        std::function<int(Cell,Cell)> heuristic) {
    auto key = [](Cell c){ return ((long long)c.first << 20) ^ c.second; };
    using Item = std::tuple<int,int,Cell>;
    std::priority_queue<Item, std::vector<Item>, std::greater<Item>> open;
    std::unordered_map<long long,int> g;
    std::unordered_map<long long,Cell> came;
    open.push({heuristic(start, goal), 0, start});
    g[key(start)] = 0;
    while (!open.empty()) {
        auto [f, gn, node] = open.top(); open.pop();
        if (node == goal) {
            std::vector<Cell> path = {node};
            while (came.count(key(node))) { node = came[key(node)]; path.push_back(node); }
            std::reverse(path.begin(), path.end());
            return path;
        }
        if (gn > g[key(node)]) continue;
        for (auto& [nbr, w] : neighbors(node)) {
            int t = gn + w;
            auto k = key(nbr);
            if (!g.count(k) || t < g[k]) {
                g[k] = t;
                came[k] = node;
                open.push({t + heuristic(nbr, goal), t, nbr});
            }
        }
    }
    return {};
}
```
