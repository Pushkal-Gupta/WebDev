---
slug: tarjan-articulation
module: graphs-advanced
title: Tarjan's Articulation Points and Bridges
subtitle: Find cut vertices and cut edges of an undirected graph in a single DFS using discovery and low-link values.
difficulty: Advanced
position: 1
estimatedReadMinutes: 9
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
An articulation point (or cut vertex) is a node whose removal disconnects an undirected graph. A bridge (or cut edge) is an edge whose removal disconnects it. Tarjan's algorithm finds all of them in a single depth-first traversal in O(V + E) time using two arrays — `disc[]` (the time a node was first visited) and `low[]` (the earliest reachable ancestor through any back edge from the node's subtree).

## whyItMatters
Cut vertices and bridges describe the fragility of a network. Network engineers use them to find single points of failure in fiber backbones; transportation planners use them to identify roads that, if closed, sever a city; biologists use them on protein-interaction graphs to spot essential proteins; security analysts use them on dependency graphs to identify libraries whose compromise would propagate widely. Tarjan's 1973 algorithm (*Depth-First Search and Linear Graph Algorithms*) is also the gateway to biconnected components, strongly connected components (the directed cousin, Tarjan 1972), and 2-edge-connectivity — themes that recur in graph rounds at Google, Meta, Citadel, and Jane Street. The same low-link recurrence powers `git rev-list --topo-order` (for finding merge bases in the commit DAG) and the cycle-detection passes inside LLVM and GCC.

## intuition
Run DFS and stamp each node with the order it was visited (`disc[u]`). For every node, compute `low[u]` = the smallest `disc` value reachable from `u`'s subtree using tree edges going down and at most one back edge going up. The intuition is: `low[u]` tells you how far up the DFS tree you can climb from `u`'s subtree, where "up" means earlier in discovery order.

An edge `(u, v)` is a bridge exactly when `low[v] > disc[u]` — meaning `v`'s subtree has no back edge that reaches `u` or any earlier vertex, so cutting that edge isolates `v`'s subtree. The condition is strict (`>`) because if any back edge from `v`'s subtree reached `u` itself, removing the tree edge `(u, v)` would still leave `v` connected via that back edge.

A non-root vertex `u` is an articulation when it has any DFS child `v` with `low[v] >= disc[u]` — meaning `v`'s subtree cannot bypass `u`, so removing `u` severs that subtree. The condition is non-strict (`>=`) here because the subtree can still reach `u` via the back edge but only via `u`, so deleting `u` still cuts the subtree off from everyone else. The root is articulation iff it has two or more DFS children — if it had only one, removing it leaves the single subtree connected to itself.

## visualization
Take graph 1-2, 2-3, 3-1, 3-4, 4-5. DFS from 1 stamps disc = {1:0, 2:1, 3:2, 4:3, 5:4}. The back edge 3-1 lifts low[3] = low[2] = 0. From 3, child 4 has no back edge, so low[4] = disc[4] = 3 and low[5] = disc[5] = 4. Check edges: (3,4) has low[4] = 3 > disc[3] = 2 — bridge. (4,5) has low[5] = 4 > disc[4] = 3 — bridge. Vertex check: 3 has child 4 with low[4] = 3 >= disc[3] = 2 — articulation. 4 has child 5 with low[5] = 4 >= disc[4] = 3 — articulation. The triangle 1-2-3 is biconnected; the tail 3-4-5 is a chain of bridges.

## bruteForce
Remove each vertex (or edge) one at a time and run BFS/DFS on the rest to check connectivity. That is O(V * (V + E)) for vertices and O(E * (V + E)) for edges. Easy to reason about, easy to code, and fine for V <= 1000 — but a single Tarjan pass crushes it for any graph an interviewer actually cares about.

## optimal
One DFS in `O(V + E)`. Maintain a timer; on first visit set `disc[u] = low[u] = timer++`. For each neighbor `v` of `u`: if `v` is unvisited, recurse on `v` then update `low[u] = min(low[u], low[v])` and check bridge / articulation conditions on the way back. If `v` is already visited and is not the parent on the DFS path, update `low[u] = min(low[u], disc[v])`. Track the DFS parent (or, better, the edge index used to reach the node) to handle multi-edges correctly.

```python
def tarjan_cuts(graph, n):
    disc, low = [-1] * n, [-1] * n
    art, bridges = set(), []
    timer = [0]
    def dfs(u, parent_edge):
        disc[u] = low[u] = timer[0]; timer[0] += 1
        children = 0
        for (v, eid) in graph[u]:
            if disc[v] == -1:
                children += 1
                dfs(v, eid)
                low[u] = min(low[u], low[v])
                if low[v] > disc[u]:
                    bridges.append((u, v))
                if parent_edge != -1 and low[v] >= disc[u]:
                    art.add(u)
            elif eid != parent_edge:
                low[u] = min(low[u], disc[v])
        if parent_edge == -1 and children > 1:
            art.add(u)
    for s in range(n):
        if disc[s] == -1:
            dfs(s, -1)
    return art, bridges
```

The critical line is `elif eid != parent_edge` — using the edge index rather than the parent vertex makes the algorithm correct for graphs with parallel edges, where two edges connect the same pair of vertices. Without this, a parallel back edge would be mistakenly treated as the tree edge and the bridge check would silently miss a real bridge. The same `low[]` recurrence drives Tarjan's strongly-connected-components algorithm on directed graphs (with a small change: maintain an explicit stack and emit components when `low[u] == disc[u]`). For very large graphs use iterative DFS to avoid recursion-limit crashes — the algorithm is straightforward to convert because the only state per frame is the iterator over `graph[u]` and the per-vertex `(disc, low, children)` triple.

## complexity
time: O(V + E)
space: O(V) for disc, low, parent, and the recursion stack
notes: Linear in graph size. For graphs with V > ~10^4 prefer an iterative DFS — Python and JS hit recursion limits fast; C++ usually wants `ios_base::sync_with_stdio(false)` plus an explicit stack.

## pitfalls
- Mishandling the DFS root: it is articulation iff it has two or more DFS-tree children, not by the `low[v] >= disc[u]` rule.
- Treating the edge back to the parent as a back edge — it isn't. Skip the parent once, but if there are parallel edges between u and its parent, the second copy *is* a back edge.
- Confusing the bridge condition (`low[v] > disc[u]`, strict) with the articulation condition (`low[v] >= disc[u]`, non-strict). Off-by-one here is a classic bug.
- Recursion blowup on chain graphs in Python/JS — switch to iterative DFS with an explicit stack.
- Forgetting that the graph may be disconnected: loop over all vertices and restart DFS for each unvisited root.

## interviewTips
- Walk through the visualization above before writing code — interviewers want to see you derive `low[]` from first principles, not recite it.
- Name the two conditions explicitly: "bridge when strict greater, articulation when greater-or-equal."
- Mention biconnected components as a natural extension — pushing edges onto a stack and popping on articulation points yields the BCCs in the same pass.
- If asked about directed graphs, pivot to Tarjan's SCC algorithm (same author, different invariant: low-link plus an explicit on-stack flag).

## code.python
```python
def articulation_and_bridges(n, adj):
    disc = [-1] * n
    low = [0] * n
    is_ap = [False] * n
    bridges = []
    timer = 0

    def dfs(u, parent):
        nonlocal timer
        disc[u] = low[u] = timer
        timer += 1
        children = 0
        for v in adj[u]:
            if disc[v] == -1:
                children += 1
                dfs(v, u)
                low[u] = min(low[u], low[v])
                if parent != -1 and low[v] >= disc[u]:
                    is_ap[u] = True
                if low[v] > disc[u]:
                    bridges.append((u, v))
            elif v != parent:
                low[u] = min(low[u], disc[v])
        if parent == -1 and children > 1:
            is_ap[u] = True

    for u in range(n):
        if disc[u] == -1:
            dfs(u, -1)
    return [i for i, x in enumerate(is_ap) if x], bridges
```

## code.javascript
```javascript
function articulationAndBridges(n, adj) {
  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const isAp = new Array(n).fill(false);
  const bridges = [];
  let timer = 0;

  function dfs(u, parent) {
    disc[u] = low[u] = timer++;
    let children = 0;
    for (const v of adj[u]) {
      if (disc[v] === -1) {
        children++;
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (parent !== -1 && low[v] >= disc[u]) isAp[u] = true;
        if (low[v] > disc[u]) bridges.push([u, v]);
      } else if (v !== parent) {
        low[u] = Math.min(low[u], disc[v]);
      }
    }
    if (parent === -1 && children > 1) isAp[u] = true;
  }

  for (let u = 0; u < n; u++) if (disc[u] === -1) dfs(u, -1);
  const aps = [];
  for (let i = 0; i < n; i++) if (isAp[i]) aps.push(i);
  return { aps, bridges };
}
```

## code.java
```java
class Tarjan {
    int timer = 0;
    int[] disc, low;
    boolean[] isAp;
    List<int[]> bridges = new ArrayList<>();
    List<List<Integer>> adj;

    public void run(int n, List<List<Integer>> g) {
        adj = g;
        disc = new int[n];
        low = new int[n];
        isAp = new boolean[n];
        Arrays.fill(disc, -1);
        for (int u = 0; u < n; u++) if (disc[u] == -1) dfs(u, -1);
    }

    void dfs(int u, int parent) {
        disc[u] = low[u] = timer++;
        int children = 0;
        for (int v : adj.get(u)) {
            if (disc[v] == -1) {
                children++;
                dfs(v, u);
                low[u] = Math.min(low[u], low[v]);
                if (parent != -1 && low[v] >= disc[u]) isAp[u] = true;
                if (low[v] > disc[u]) bridges.add(new int[]{u, v});
            } else if (v != parent) {
                low[u] = Math.min(low[u], disc[v]);
            }
        }
        if (parent == -1 && children > 1) isAp[u] = true;
    }
}
```

## code.cpp
```cpp
struct Tarjan {
    int timer = 0;
    vector<int> disc, low;
    vector<bool> isAp;
    vector<pair<int,int>> bridges;
    vector<vector<int>>* adj;

    void run(int n, vector<vector<int>>& g) {
        adj = &g;
        disc.assign(n, -1);
        low.assign(n, 0);
        isAp.assign(n, false);
        for (int u = 0; u < n; u++) if (disc[u] == -1) dfs(u, -1);
    }

    void dfs(int u, int parent) {
        disc[u] = low[u] = timer++;
        int children = 0;
        for (int v : (*adj)[u]) {
            if (disc[v] == -1) {
                children++;
                dfs(v, u);
                low[u] = min(low[u], low[v]);
                if (parent != -1 && low[v] >= disc[u]) isAp[u] = true;
                if (low[v] > disc[u]) bridges.push_back({u, v});
            } else if (v != parent) {
                low[u] = min(low[u], disc[v]);
            }
        }
        if (parent == -1 && children > 1) isAp[u] = true;
    }
};
```
