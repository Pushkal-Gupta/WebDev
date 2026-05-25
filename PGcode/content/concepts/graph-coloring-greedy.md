---
slug: graph-coloring-greedy
module: graphs-advanced
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
- **Compiler register allocation**: GCC, LLVM, and HotSpot JIT model variables-overlapping-in-live-range as a graph and color it greedily (Chaitin 1982) to assign CPU registers; uncolorable nodes spill to stack.
- **Exam and university timetabling** (Cambridge, McGill scheduling systems) reduce to graph coloring where exams with shared students cannot share slots.
- **Frequency assignment** for cell towers (GSM, LTE network planning) and Wi-Fi channel allocation use coloring variants to prevent interference.
- **Sudoku** is precisely a 9-coloring problem on an 81-vertex graph with row/column/box adjacency.
- **The famous Four Color Theorem** (Appel & Haken 1976) — every planar map is 4-colorable — formalises map-coloring as a graph problem; greedy can overshoot to 6 on planar inputs because exact 4-coloring is NP-hard at production speed.
- Exact coloring is NP-hard (Karp 1972), so production schedulers ship greedy variants and accept a small over-count.

## intuition
The algorithm exists because exact graph coloring is NP-hard, but most real instances are far from worst-case and a fast approximation gives results within a constant factor of optimal almost always. Welsh-Powell (1967) is the canonical greedy: sort vertices by degree non-increasing, then assign each the smallest color not used by an already-colored neighbour. The decision to process by descending degree is what makes the algorithm competitive — colouring the most-constrained vertices first means later vertices, with fewer constraints, almost always find an existing color available.

Mental model: seating guests at numbered tables where some pairs refuse to share a table. Seat the most-connected guests first — they have the most enemies and thus the strongest constraints. For each guest, pick the lowest-numbered table where none of their enemies are already seated. Quiet guests with few enemies come last, when most tables are already in use, so they almost always slot into an existing table without forcing a new one. The intuition is identical to the "Most Constrained Variable" heuristic in constraint satisfaction and to deadline-first scheduling in operating systems.

The provable guarantee is that greedy uses at most Δ(G) + 1 colors, where Δ is the maximum degree (proof: any vertex has at most Δ colored neighbours, so among colors 1..Δ+1, at least one is free). Brooks' theorem (1941) strengthens this: for connected graphs that are neither complete nor odd cycles, χ ≤ Δ. So greedy is at worst one off optimal on those families. DSatur (Brélaz 1979) tightens the heuristic further by ordering on *saturation degree* (count of distinct colors among neighbours) instead of raw degree, and is provably optimal on bipartite graphs and cycles.

## visualization
A graph with vertices A (degree 4), B (degree 3), C (degree 3), D (degree 2), E (degree 1). Sort by degree: A, B, C, D, E. Color A with 1. B is adjacent to A → color 2. C is adjacent to A only → color 2. D is adjacent to A and B → color 3. E is adjacent to D only → color 1. Total colors used: 3. (For comparison, the chromatic number happens to be 3 here as well — but in general greedy can exceed χ.)

## bruteForce
Try every assignment of k colors to V vertices and check feasibility. O(k^V) — exponential, only feasible for V ≤ ~20. Used to compute the true chromatic number on tiny inputs (Sudoku-style 81-vertex problems are at the upper edge with heavy pruning). Brute force does double duty as a textbook example of backtracking with constraint propagation.

## optimal
**Technique: Welsh-Powell greedy with degree-descending vertex ordering.** Runs in O(V log V + V·Δ) — sort cost plus per-vertex neighbour scan. Guaranteed to use at most Δ+1 colors. "Optimal" here is in the practical sense: no polynomial algorithm can guarantee χ exactly (NP-hard), so Welsh-Powell trades a small constant-factor overshoot for polynomial runtime.

```python
def welsh_powell(graph):
    order = sorted(graph, key=lambda v: -len(graph[v]))   # most-constrained first
    color = {}
    for v in order:
        used = {color[u] for u in graph[v] if u in color}  # colors already taken
        c = 0
        while c in used:                                    # smallest unused color
            c += 1
        color[v] = c
    return color
```

Key lines: `sorted(graph, key=lambda v: -len(graph[v]))` is the entire algorithmic insight — handling high-degree vertices first means later, low-degree vertices almost never need a new color. The `used = {color[u] for u in graph[v] if u in color}` line builds the set of colors blocked by already-colored neighbours; `while c in used` finds the smallest non-blocked color via linear probing, which is O(deg(v)) per vertex.

**Why descending degree?** Random order can use Δ+1 colors even on a tree (where χ = 2). Sorted descending puts the structural choke points where they belong — early, when all colors are still in play. **Why not DSatur?** DSatur (Brélaz 1979) breaks ties by *saturation degree* (number of distinct colors among neighbours), and is provably optimal on bipartite and cycle graphs; the cost is a priority queue and per-vertex saturation tracking, an O(V² log V) algorithm. Welsh-Powell is the sweet spot for production: fast, simple, almost always within one color of DSatur on real workloads.

**For exact answers** on small instances (V ≤ 100), use branch-and-bound with DSatur as the upper-bound oracle and clique-finding as the lower bound. **For planar graphs**, the Four Color Theorem guarantees χ ≤ 4 but the Robertson-Sanders-Seymour-Thomas 1996 polynomial-time 4-coloring algorithm is too complex for production; greedy with planarity-aware ordering typically reaches 5–6 colors. **For register allocation specifically**, Chaitin's interference-graph coloring uses similar greedy logic with optimistic spilling — when greedy fails, evict the highest-degree node, color the rest, then retry.

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
