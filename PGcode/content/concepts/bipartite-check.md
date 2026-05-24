---
slug: bipartite-check
module: graphs
title: Bipartite Graph Check
subtitle: 2-color the graph via BFS or DFS — if every edge crosses colors, the graph is bipartite.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Check whether a graph is Bipartite or Not — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/bipartite-graph/"
    type: blog
  - title: "Graph coloring — cp-algorithms"
    url: "https://cp-algorithms.com/graph/bridge-searching.html"
    type: blog
  - title: "TheAlgorithms/Python — bipartite_graph.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/check_bipatrite.py"
    type: repo
status: published
---

## intro
A graph is bipartite if its vertices can be split into two sets so every edge has one endpoint in each set — equivalently, the graph is 2-colorable. The standard check runs a BFS or DFS from each unvisited vertex, coloring layer by layer; if any edge connects same-colored endpoints, the graph is not bipartite.

## whyItMatters
Bipartite testing is the gateway to a whole family of problems: maximum bipartite matching (Hopcroft-Karp, Hungarian algorithm), 2-SAT via implication graphs, scheduling that needs two-shift assignments, and detecting odd cycles. A graph is bipartite if and only if it has no odd-length cycle — the same algorithm that 2-colors also proves the negative by surfacing the offending edge.

## intuition
Start BFS from any vertex, color it 0. Color every neighbor 1, every neighbor's neighbor 0, and so on — alternating with each layer. If two adjacent vertices ever end up the same color, then walking from one through their BFS parents to their lowest common ancestor and back produces an odd cycle, so 2-coloring is impossible. If no conflict appears across all components, the coloring witnesses bipartiteness.

## visualization
Graph with edges 1-2, 2-3, 3-4, 4-1, 1-5. Start BFS at 1, color 0. Layer 1 neighbors: 2 → color 1, 5 → color 1. Layer 2: 2's neighbor 3 → color 0, 4 hasn't been seen yet but 1's neighbor list also yields 4 — actually 4 is a neighbor of 1, so 4 → color 1 in layer 1. Layer 2: 3's neighbor 4 — but 4 is color 1 and 3 is color 0, so edge (3, 4) is fine. Every edge crosses colors. Bipartite. Now add edge 2-4: 2 is color 1, 4 is color 1 — same color, conflict, not bipartite (odd cycle 1-2-4-1 of length 3).

## bruteForce
Try every 2-coloring of the n vertices and check whether each edge has endpoints of different colors. 2^n colorings, each checked in O(E). Exponential. Even with smart pruning, the asymptotic doesn't beat the linear BFS approach, so this is purely an exercise in why you reach for traversal.

## optimal
Allocate color[v] = -1 (uncolored) for all v. For each uncolored vertex s, push it into a BFS queue and set color[s] = 0. Pop u, scan neighbors v: if color[v] == -1, set color[v] = 1 - color[u] and enqueue; if color[v] == color[u], return false. If every component completes without conflict, return true. The coloring itself doubles as the bipartition.

## complexity
time: O(V + E)
space: O(V) for the color array and the BFS queue
notes: Works on undirected graphs. For directed graphs, "bipartite" usually means the underlying undirected graph is bipartite — run the same check after dropping direction. Disconnected graphs need an outer loop over starting vertices; coloring within one component does not propagate to the next.

## pitfalls
- Returning early after the first component succeeds — you must check every component before declaring the whole graph bipartite.
- Reading "bipartite" as "has two parts of equal size" — bipartite only means 2-colorable; the parts can be wildly different sizes.
- Using DFS recursion on graphs with 10^5+ vertices in Python — overflow the call stack, prefer iterative BFS or DFS.
- Forgetting self-loops: a self-loop (v, v) makes the graph non-bipartite trivially since v cannot differ from itself; many test sets sneak this in.
- Mixing color "0" (unvisited sentinel) and color "0" (one of two colors) — use a separate `visited` array or set the sentinel to -1.

## interviewTips
- State the equivalence up front: "Bipartite iff no odd cycle iff 2-colorable; I'll 2-color with BFS."
- If asked to "find" the conflict, return the edge that triggered the mismatch — interviewers often want a witness, not just a boolean.
- Mention applications: stable matching, job-to-machine scheduling, and the fact that bipartite matching has polynomial-time max-flow solutions while general matching needs Edmonds' blossom algorithm.

## code.python
```python
from collections import deque

def is_bipartite(n, adj):
    color = [-1] * n
    for s in range(n):
        if color[s] != -1: continue
        color[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if color[v] == -1:
                    color[v] = 1 - color[u]
                    q.append(v)
                elif color[v] == color[u]:
                    return False, color
    return True, color
```

## code.javascript
```javascript
function isBipartite(n, adj) {
  const color = new Array(n).fill(-1);
  for (let s = 0; s < n; s++) {
    if (color[s] !== -1) continue;
    color[s] = 0;
    const q = [s];
    let head = 0;
    while (head < q.length) {
      const u = q[head++];
      for (const v of adj[u]) {
        if (color[v] === -1) { color[v] = 1 - color[u]; q.push(v); }
        else if (color[v] === color[u]) return { ok: false, color };
      }
    }
  }
  return { ok: true, color };
}
```

## code.java
```java
class Bipartite {
    boolean isBipartite(int n, java.util.List<java.util.List<Integer>> adj) {
        int[] color = new int[n];
        java.util.Arrays.fill(color, -1);
        for (int s = 0; s < n; s++) {
            if (color[s] != -1) continue;
            color[s] = 0;
            java.util.Deque<Integer> q = new java.util.ArrayDeque<>();
            q.offer(s);
            while (!q.isEmpty()) {
                int u = q.poll();
                for (int v : adj.get(u)) {
                    if (color[v] == -1) { color[v] = 1 - color[u]; q.offer(v); }
                    else if (color[v] == color[u]) return false;
                }
            }
        }
        return true;
    }
}
```

## code.cpp
```cpp
bool isBipartite(int n, vector<vector<int>>& adj) {
    vector<int> color(n, -1);
    for (int s = 0; s < n; s++) {
        if (color[s] != -1) continue;
        color[s] = 0;
        queue<int> q;
        q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) {
                if (color[v] == -1) { color[v] = 1 - color[u]; q.push(v); }
                else if (color[v] == color[u]) return false;
            }
        }
    }
    return true;
}
```
