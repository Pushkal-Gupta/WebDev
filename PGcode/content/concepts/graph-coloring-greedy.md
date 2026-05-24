---
slug: graph-coloring-greedy
module: graphs
title: Greedy Graph Coloring
subtitle: Welsh-Powell — order vertices by degree, assign smallest available color.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Graph Coloring"
    url: "https://algs4.cs.princeton.edu/41graph/"
    type: book
  - title: "Graph Coloring — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/graph-coloring-set-2-greedy-algorithm/"
    type: blog
  - title: "TheAlgorithms/Python — graph_coloring.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/greedy_min_vertex_cover.py"
    type: repo
status: published
---

## intro
Graph coloring assigns each vertex a color such that no two adjacent vertices share a color. The chromatic number χ(G) is the minimum such count — and computing it exactly is NP-hard. The Welsh-Powell greedy algorithm trades optimality for speed: process vertices in non-increasing degree order, assign each the smallest color not used by an already-colored neighbor. The result uses at most Δ(G) + 1 colors, where Δ is the maximum degree.

## whyItMatters
Coloring models conflict-avoidance everywhere: register allocation in compilers (variables that overlap in live-range must use different registers), exam timetabling (exams with shared students cannot share a slot), frequency assignment for cell towers, and even Sudoku (a 9-coloring of a graph with 81 vertices). Exact coloring is infeasible at scale, so production schedulers ship greedy variants and live with the small over-count.

## intuition
Imagine seating guests at a party where some pairs hate each other. Seat the most-connected (loudest) guests first — they constrain the most options. For each guest, pick the lowest-numbered table where none of their enemies are already seated. Quiet guests come last, when most tables are open, so they're easy. Degree-ordering puts the hardest decisions early when the most options are still available.

## visualization
A graph with vertices A (degree 4), B (degree 3), C (degree 3), D (degree 2), E (degree 1). Sort by degree: A, B, C, D, E. Color A with 1. B is adjacent to A → color 2. C is adjacent to A only → color 2. D is adjacent to A and B → color 3. E is adjacent to D only → color 1. Total colors used: 3. (For comparison, the chromatic number happens to be 3 here as well — but in general greedy can exceed χ.)

## bruteForce
Try every assignment of k colors to V vertices and check feasibility. O(k^V) — exponential, only feasible for V ≤ ~20. Used to compute the true chromatic number on tiny inputs (Sudoku-style 81-vertex problems are at the upper edge with heavy pruning). Brute force does double duty as a textbook example of backtracking with constraint propagation.

## optimal
Welsh-Powell: sort vertices by degree descending, walk in that order, assign each the smallest color not present in its neighbor set. For better-than-greedy bounds, use DSatur (saturation degree — break ties by counting distinct colors among neighbors), which is optimal for bipartite and cycle graphs and competitive elsewhere. For exact results, branch-and-bound on top of DSatur is the practical state of the art up to ~100 vertices.

## complexity
time: O(V^2) or O(V log V + V * Δ) — dominated by the degree sort and the per-vertex neighbor scan.
space: O(V + E) for the graph + O(V) for the color assignment.
notes: Welsh-Powell uses at most Δ + 1 colors but can be off by up to a log V factor versus optimal for adversarial inputs. For planar graphs the famous Four Color Theorem guarantees χ ≤ 4 — but the proof is not constructive at production speed; greedy can use up to 6.

## pitfalls
- Forgetting to sort by degree — random-order greedy can use Δ + 1 colors even on a tree (where 2 suffice).
- Using >= for adjacency check instead of != — colors and vertex IDs are different namespaces.
- Re-running greedy on a relabeling and being surprised the result changes — greedy is sensitive to order, that's the whole point.
- Treating greedy as exact — for register allocation, missing a color forces a spill (slow memory access) that you may not detect until profiling.

## interviewTips
- Lead with "Exact coloring is NP-hard; greedy gives a Δ + 1 bound." Sets expectations.
- Walk through Welsh-Powell on a tiny example — interviewers like the degree-ordering insight.
- Mention DSatur as the improvement and DSATUR's perfect coloring on bipartite as the cleanest test case.

## code.python
```python
def welsh_powell(graph):
    order = sorted(graph, key=lambda v: -len(graph[v]))
    color = {}
    for v in order:
        used = {color[u] for u in graph[v] if u in color}
        c = 0
        while c in used:
            c += 1
        color[v] = c
    return color
```

## code.javascript
```javascript
function welshPowell(graph) {
  const order = Object.keys(graph).sort((a, b) => graph[b].length - graph[a].length);
  const color = {};
  for (const v of order) {
    const used = new Set();
    for (const u of graph[v]) if (u in color) used.add(color[u]);
    let c = 0;
    while (used.has(c)) c++;
    color[v] = c;
  }
  return color;
}
```

## code.java
```java
import java.util.*;

public class WelshPowell {
    public Map<Integer, Integer> color(Map<Integer, List<Integer>> graph) {
        List<Integer> order = new ArrayList<>(graph.keySet());
        order.sort((a, b) -> graph.get(b).size() - graph.get(a).size());
        Map<Integer, Integer> color = new HashMap<>();
        for (int v : order) {
            Set<Integer> used = new HashSet<>();
            for (int u : graph.get(v)) if (color.containsKey(u)) used.add(color.get(u));
            int c = 0;
            while (used.contains(c)) c++;
            color.put(v, c);
        }
        return color;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
#include <unordered_set>

std::vector<int> welshPowell(const std::vector<std::vector<int>>& graph) {
    int n = graph.size();
    std::vector<int> order(n);
    for (int i = 0; i < n; i++) order[i] = i;
    std::sort(order.begin(), order.end(), [&](int a, int b) {
        return graph[a].size() > graph[b].size();
    });
    std::vector<int> color(n, -1);
    for (int v : order) {
        std::unordered_set<int> used;
        for (int u : graph[v]) if (color[u] != -1) used.insert(color[u]);
        int c = 0;
        while (used.count(c)) c++;
        color[v] = c;
    }
    return color;
}
```
