---
slug: articulation-bridges
module: graphs-advanced
title: Articulation Points and Bridges
subtitle: Tarjan's low-link DFS finds every cut vertex and cut edge in one linear pass.
difficulty: Advanced
position: 1
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "Finding Bridges in O(N + M) — cp-algorithms"
    url: "https://cp-algorithms.com/graph/bridge-searching.html"
    type: blog
  - title: "Articulation Points — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/articulation-points-or-cut-vertices-in-a-graph/"
    type: blog
  - title: "KACTL — BiconnectedComponents.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/graph/BiconnectedComponents.h"
    type: repo
status: published
---

## intro
An articulation point (cut vertex) is a vertex whose removal disconnects the graph; a bridge (cut edge) is an edge with the same property. Tarjan's algorithm computes both in one DFS by tracking each vertex's discovery time `tin[v]` and `low[v]` — the smallest discovery time reachable from v's subtree via at most one back edge.

## whyItMatters
Bridges and articulation points expose the single points of failure in any network — power grids, road networks, the internet at the AS level, social graphs at the trust level. Identifying them lets you reinforce critical links, compute 2-edge-connected and biconnected components, build block-cut trees, and reason about resilience. Tarjan's O(V + E) algorithm is the canonical answer; anything slower is a non-starter.

## intuition
DFS the graph and stamp each vertex with `tin[v]` (discovery time) and `low[v]`, initialized to `tin[v]`. As DFS returns from a child c, update `low[v] = min(low[v], low[c])`. If `low[c] > tin[v]`, no back edge from c's subtree reaches v or earlier — the edge (v, c) is a bridge. If `low[c] >= tin[v]` and v is not the root, v is an articulation point (the subtree at c cannot escape v). The root is an articulation point iff it has two or more DFS children.

## visualization
Graph: 1-2, 2-3, 3-1, 3-4, 4-5, 5-6, 6-4. DFS from 1: tin = {1:1, 2:2, 3:3, 4:4, 5:5, 6:6}. Back edges: 3-1 (3's neighbor 1 with smaller tin) and 6-4. low values bubble up: low[6] = min(tin[6], tin[4]) = 4; low[5] = min(tin[5], low[6]) = 4; low[4] = min(tin[4], low[5]) = 4. For child 4 of 3: low[4]=4 > tin[3]=3, so edge (3,4) is a bridge. For child 3 of 2: low[3] = min(tin[3], tin[1]) = 1, not > tin[2], no bridge. Articulation points: 3 (low[4] >= tin[3] and 3 is non-root) and 4 (low[5] >= tin[4]).

## bruteForce
Try removing each vertex one at a time and run BFS/DFS to see if the remaining graph is connected; same for each edge. O(V * (V + E)) for vertices, O(E * (V + E)) for edges. On a graph with V = 10^4 and E = 10^5, that's 10^9 ops — too slow. The brute approach also misses the elegance of low-link: you'd recompute most of the same DFS state V times.

## optimal
Run a single DFS storing tin[v] and low[v]. Maintain parent[v] to ignore the edge back to the parent. When visiting an edge to an unvisited child c, recurse, then update low[v] = min(low[v], low[c]) and check bridge/articulation conditions. When visiting an already-discovered neighbor u that is not the parent, update low[v] = min(low[v], tin[u]) — this is the back edge case. For the root, count DFS children explicitly; root is an articulation point only if it has 2+ DFS children. Handle parallel edges by tracking the edge id instead of the neighbor.

## complexity
time: O(V + E)
space: O(V) for tin/low/parent arrays plus the DFS stack
notes: For graphs with multi-edges, compare against the edge id you used to reach v, not the parent vertex — otherwise a parallel edge is wrongly ignored as the "edge back to the parent" and you miss a bridge. Iterative DFS is essential for V > ~10^4 in Python; the recursive version stack-overflows on chains.

## pitfalls
- Comparing back-edge target to `low[u]` instead of `tin[u]` — using low here gives wrong answers when the back edge target itself participates in a later cycle.
- Forgetting to special-case the root for articulation points: by the >= rule alone, every DFS root would qualify, which is wrong.
- Treating an undirected edge as if it had only one direction — both endpoints' adjacency lists must contain the edge, and the algorithm must skip exactly the edge it used to arrive.
- Using vertex parent instead of edge index to skip the reverse direction — fatal on multigraphs with parallel edges.
- Mutating low[] in the wrong order — update from child to parent (post-order), not before the recursion returns.

## interviewTips
- Say "Tarjan's low-link DFS" by name — interviewers like to hear the named algorithm.
- Distinguish bridges (edge removal) from articulation points (vertex removal); they have different conditions: `low[c] > tin[v]` versus `low[c] >= tin[v]`.
- If asked about online updates (edges added or removed over time), pivot to link-cut trees or Euler-tour trees — Tarjan is a one-shot offline algorithm.

## code.python
```python
import sys
sys.setrecursionlimit(1 << 25)

def find_bridges_and_articulation(n, adj):
    tin = [-1] * n
    low = [0] * n
    is_ap = [False] * n
    bridges = []
    timer = [0]

    def dfs(v, parent_edge):
        tin[v] = low[v] = timer[0]; timer[0] += 1
        children = 0
        for nb, eid in adj[v]:
            if eid == parent_edge: continue
            if tin[nb] != -1:
                low[v] = min(low[v], tin[nb])
            else:
                dfs(nb, eid)
                low[v] = min(low[v], low[nb])
                if low[nb] > tin[v]: bridges.append((v, nb))
                if low[nb] >= tin[v] and parent_edge != -1: is_ap[v] = True
                children += 1
        if parent_edge == -1 and children > 1: is_ap[v] = True

    for v in range(n):
        if tin[v] == -1: dfs(v, -1)
    return bridges, [v for v, x in enumerate(is_ap) if x]
```

## code.javascript
```javascript
function findBridgesAndArticulation(n, adj) {
  const tin = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const isAp = new Array(n).fill(false);
  const bridges = [];
  let timer = 0;

  function dfs(v, parentEdge) {
    tin[v] = low[v] = timer++;
    let children = 0;
    for (const [nb, eid] of adj[v]) {
      if (eid === parentEdge) continue;
      if (tin[nb] !== -1) {
        low[v] = Math.min(low[v], tin[nb]);
      } else {
        dfs(nb, eid);
        low[v] = Math.min(low[v], low[nb]);
        if (low[nb] > tin[v]) bridges.push([v, nb]);
        if (low[nb] >= tin[v] && parentEdge !== -1) isAp[v] = true;
        children++;
      }
    }
    if (parentEdge === -1 && children > 1) isAp[v] = true;
  }

  for (let v = 0; v < n; v++) if (tin[v] === -1) dfs(v, -1);
  const aps = [];
  for (let v = 0; v < n; v++) if (isAp[v]) aps.push(v);
  return { bridges, aps };
}
```

## code.java
```java
class CutFinder {
    int[] tin, low;
    boolean[] isAp;
    java.util.List<int[]> bridges = new java.util.ArrayList<>();
    int timer = 0;
    java.util.List<java.util.List<int[]>> adj;

    void run(int n, java.util.List<java.util.List<int[]>> adj) {
        this.adj = adj;
        tin = new int[n]; low = new int[n]; isAp = new boolean[n];
        java.util.Arrays.fill(tin, -1);
        for (int v = 0; v < n; v++) if (tin[v] == -1) dfs(v, -1);
    }

    void dfs(int v, int parentEdge) {
        tin[v] = low[v] = timer++;
        int children = 0;
        for (int[] e : adj.get(v)) {
            int nb = e[0], eid = e[1];
            if (eid == parentEdge) continue;
            if (tin[nb] != -1) low[v] = Math.min(low[v], tin[nb]);
            else {
                dfs(nb, eid);
                low[v] = Math.min(low[v], low[nb]);
                if (low[nb] > tin[v]) bridges.add(new int[]{v, nb});
                if (low[nb] >= tin[v] && parentEdge != -1) isAp[v] = true;
                children++;
            }
        }
        if (parentEdge == -1 && children > 1) isAp[v] = true;
    }
}
```

## code.cpp
```cpp
struct CutFinder {
    vector<int> tin, low;
    vector<bool> isAp;
    vector<pair<int,int>> bridges;
    int timer = 0;
    vector<vector<pair<int,int>>>* adj;

    void run(int n, vector<vector<pair<int,int>>>& a) {
        adj = &a;
        tin.assign(n, -1); low.assign(n, 0); isAp.assign(n, false);
        for (int v = 0; v < n; v++) if (tin[v] == -1) dfs(v, -1);
    }

    void dfs(int v, int parentEdge) {
        tin[v] = low[v] = timer++;
        int children = 0;
        for (auto [nb, eid] : (*adj)[v]) {
            if (eid == parentEdge) continue;
            if (tin[nb] != -1) low[v] = min(low[v], tin[nb]);
            else {
                dfs(nb, eid);
                low[v] = min(low[v], low[nb]);
                if (low[nb] > tin[v]) bridges.push_back({v, nb});
                if (low[nb] >= tin[v] && parentEdge != -1) isAp[v] = true;
                children++;
            }
        }
        if (parentEdge == -1 && children > 1) isAp[v] = true;
    }
};
```
