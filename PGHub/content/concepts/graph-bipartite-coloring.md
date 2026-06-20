---
slug: graph-bipartite-coloring
module: graphs-traversal
title: Bipartite Check via 2-Coloring
subtitle: BFS / DFS assigning alternating colors — graph is bipartite iff no edge connects same-colored vertices. The odd-cycle test in O(V+E).
difficulty: Beginner
position: 66
estimatedReadMinutes: 4
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Graph algorithms and coloring"
    url: "https://walkccc.me/CLRS/Chap22/"
    type: book
  - title: "cp-algorithms — Bipartiteness check"
    url: "https://cp-algorithms.com/graph/bipartite-check.html"
    type: blog
  - title: "TheAlgorithms/Python — Bipartite check"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/check_bipartite_graph_bfs.py"
    type: repo
status: published
---

## intro
A graph is **bipartite** if its vertices split into two sets U, V such that every edge connects one in U to one in V. Equivalently: the graph **has no odd-length cycles**. Equivalently: the graph is **2-colorable** — every vertex gets one of two colors and adjacent vertices have different colors. BFS or DFS that propagates alternating colors decides bipartiteness in O(V+E).

## whyItMatters
- **Job assignment**: workers on one side, jobs on the other — bipartite matching solves the "max valid assignments" problem.
- **Conflict graphs**: students on each side, courses they can't take together → bipartite scheduling.
- **Stable marriage / hospital-residents matching** — both two-sided.
- **DAG layering**, **finite-automaton states**, **typesetting**.
- Compiler-level **register allocation** uses graph coloring (general case); bipartite is the trivial sub-case.

## intuition
Pick any unvisited vertex; color it 0. Walk its neighbors with BFS; color them 1. Color their neighbors 0. Continue.

At each step, when about to color a neighbor: if it's uncolored, give it the opposite color of the current vertex. If it's already colored — check: opposite color is fine, same color is a conflict → graph is NOT bipartite.

Why no odd cycles? In a 2-coloring, traversing any edge flips the color. After an odd-length cycle, you'd be at the start vertex with the opposite color of yourself — contradiction.

## visualization
```
Graph:
   1 - 2
   |   |
   4 - 3

BFS from 1, color[1]=0:
  queue=[1]
  pop 1 (color=0): neighbors {2, 4}
    color[2]=1, push.    color[4]=1, push.
  pop 2 (color=1): neighbors {1, 3}
    1 already 0 (correct opposite). color[3]=0, push.
  pop 4 (color=1): neighbors {1, 3}
    1 already 0 (correct). 3 already 0 (correct opposite of 1). OK.
  pop 3 (color=0): neighbors {2, 4}
    both 1 (correct).
  Done. Bipartite. Partition: {1, 3} vs {2, 4}.

Non-bipartite example (triangle 1-2-3-1):
  color[1]=0
  pop 1: color[2]=1, color[3]=1
  pop 2: 1 ok. 3 already 1 — SAME color as 2. CONFLICT. Not bipartite.
  (Equivalently: the triangle is a 3-cycle, odd length.)
```

## bruteForce
**Enumerate all 2^V colorings, check each**: O(2^V × E). Pointless beyond V=20.

**Find all cycles + check parity**: cycle enumeration is exponential; O(V+E) algorithms exist but they're more complex than the direct 2-coloring.

**Try to 3-color it**: irrelevant — 2-color suffices iff bipartite.

The BFS/DFS 2-color is the simple, canonical answer.

## optimal
**BFS approach** (cleaner for explanation):
```python
from collections import deque
def is_bipartite(graph):
    n = len(graph)
    color = [-1] * n
    for start in range(n):
        if color[start] != -1: continue
        color[start] = 0
        q = deque([start])
        while q:
            u = q.popleft()
            for v in graph[u]:
                if color[v] == -1:
                    color[v] = 1 - color[u]
                    q.append(v)
                elif color[v] == color[u]:
                    return False
    return True
```

**DFS variant**:
```python
def is_bipartite_dfs(graph):
    color = [-1] * len(graph)
    def dfs(u, c):
        color[u] = c
        for v in graph[u]:
            if color[v] == -1:
                if not dfs(v, 1 - c): return False
            elif color[v] == c:
                return False
        return True
    for v in range(len(graph)):
        if color[v] == -1:
            if not dfs(v, 0): return False
    return True
```

**Handling disconnected graphs**: outer loop iterates all vertices; restart BFS/DFS on each unvisited.

**Multi-component report**: instead of returning bool, return per-component bipartition + a flag.

**Finding the odd cycle** (proof of non-bipartiteness): when conflict detected, trace parent pointers from both ends to the LCA — the path forms an odd cycle.

## complexity
- **Time:** O(V + E). Each vertex visited once; each edge examined twice (undirected) or once (directed).
- **Space:** O(V) for color array + BFS queue / DFS stack.

## pitfalls
- **Missing the outer loop for disconnected graphs.** A single BFS only covers its component; isolated subgraphs go unchecked and the function wrongly returns true. Fix: loop over every vertex and restart BFS/DFS whenever you hit an uncolored node.
- **Using a boolean visited flag instead of a 3-state color.** Booleans collapse "uncolored" with "colored 0", and the algorithm can't tell apart "needs initial color" from "validated as 0". Fix: use `-1`/`0`/`1` (or an enum) so the uncolored state is distinct.
- **Treating directed edges as undirected.** For directed graphs, bipartite checks usually want to ignore direction — but if you walk only forward edges you may miss conflicts on inbound edges. Fix: build an undirected mirror of the adjacency list for the test, or visit both `outgoing` and `incoming` neighbors.
- **Forgetting to test the conflict condition on already-colored neighbors.** Skipping `color[v] != -1` cases lets bad edges slip through and you incorrectly return true. Fix: every neighbor visit must first compare colors when both endpoints are colored; only push to the queue when uncolored.
- **Stack overflow on recursive DFS for deep components.** Skewed graphs (~10⁵ vertices in a chain) blow Python/JS recursion limits. Fix: use the iterative BFS variant in production paths, or raise the recursion limit explicitly (`sys.setrecursionlimit`) only after weighing the safety cost.

## interviewTips
- For "can we partition vertices into 2 sets so every edge crosses" → 2-coloring BFS/DFS.
- Cite **odd cycle ⇔ not bipartite** as the structural equivalence.
- For senior interviews, discuss **bipartite matching** (Hungarian / Hopcroft-Karp), **multi-color generalization**, **bipartite-aware shortest paths**.

## code.python
```python
from collections import deque
def is_bipartite(graph):
    n = len(graph)
    color = [-1] * n
    for s in range(n):
        if color[s] != -1: continue
        color[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in graph[u]:
                if color[v] == -1:
                    color[v] = 1 - color[u]
                    q.append(v)
                elif color[v] == color[u]:
                    return False
    return True
```

## code.javascript
```javascript
function isBipartite(graph) {
  const color = new Array(graph.length).fill(-1);
  for (let s = 0; s < graph.length; s++) {
    if (color[s] !== -1) continue;
    color[s] = 0;
    const q = [s];
    while (q.length) {
      const u = q.shift();
      for (const v of graph[u]) {
        if (color[v] === -1) { color[v] = 1 - color[u]; q.push(v); }
        else if (color[v] === color[u]) return false;
      }
    }
  }
  return true;
}
```

## code.java
```java
public boolean isBipartite(int[][] graph) {
    int n = graph.length;
    int[] color = new int[n];
    Arrays.fill(color, -1);
    for (int s = 0; s < n; s++) {
        if (color[s] != -1) continue;
        color[s] = 0;
        Deque<Integer> q = new ArrayDeque<>();
        q.add(s);
        while (!q.isEmpty()) {
            int u = q.poll();
            for (int v : graph[u]) {
                if (color[v] == -1) { color[v] = 1 - color[u]; q.add(v); }
                else if (color[v] == color[u]) return false;
            }
        }
    }
    return true;
}
```

## code.cpp
```cpp
bool isBipartite(vector<vector<int>>& graph) {
    int n = graph.size();
    vector<int> color(n, -1);
    for (int s = 0; s < n; s++) {
        if (color[s] != -1) continue;
        color[s] = 0;
        queue<int> q; q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : graph[u]) {
                if (color[v] == -1) { color[v] = 1 - color[u]; q.push(v); }
                else if (color[v] == color[u]) return false;
            }
        }
    }
    return true;
}
```
