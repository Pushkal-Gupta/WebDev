---
slug: network-bridge-finding
module: graphs-advanced
title: Bridge Finding
subtitle: Identify edges whose removal disconnects the graph using Tarjan's low-link DFS.
difficulty: Advanced
position: 60
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Finding bridges in O(N+M) — cp-algorithms"
    url: "https://cp-algorithms.com/graph/bridge-searching.html"
    type: blog
  - title: "Bridge in a graph — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/bridge-in-a-graph/"
    type: blog
  - title: "KACTL — graph/BiconnectedComponents.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/graph/BiconnectedComponents.h"
    type: repo
status: published
---

## intro
A bridge (or cut-edge) is an edge whose removal increases the number of connected components in an undirected graph. Bridges identify single points of failure in road systems, internet backbones, and computer networks. Tarjan's low-link DFS finds every bridge in one pass through the graph in O(V + E) time.

## whyItMatters
- **Network reliability analysis** (ISP backbone planning, Tier-1 peering links, AWS region interconnects) treats bridges as single-points-of-failure; the same low-link DFS is the foundation of redundancy planning.
- **Tarjan's 1972 paper** "Depth-first search and linear graph algorithms" introduced the low-link technique that powers bridge-finding, articulation-point detection, and strongly-connected-components — three classical O(V+E) algorithms from one DFS pass.
- **Boost Graph Library** ships `biconnected_components` and `bridge` algorithms using exactly this method; **NetworkX**'s `bridges` and **graph-tool**'s `bridges()` are direct ports.
- **Competitive programming** problems on Codeforces, ICPC, and AtCoder consistently use bridge-finding as a building block for 2-edge-connected components, block-cut trees, and offline LCA queries on cactus graphs.

## intuition
A bridge is an edge whose removal disconnects the graph. The naive check — remove each edge and run BFS — is O(E * (V+E)) and useless beyond a few thousand edges. Tarjan's insight: a single DFS already explores every edge once, so if we can characterize "bridge" using only **discovery-time information collected during DFS**, we get O(V+E).

Build a **DFS tree** rooted anywhere. Every non-tree edge is a **back edge** going from a descendant to an ancestor (in undirected graphs, that is the only other kind). For each vertex v, define `disc[v]` = the order in which DFS visited v, and `low[v]` = the smallest `disc` value reachable from v's subtree using tree edges plus **at most one** back edge climbing out. The intuition: `low[v]` measures "how high up the tree can v's subtree escape to."

Now the key observation: for a tree edge (u, v) where v is u's child, this edge is a **bridge iff `low[v] > disc[u]`**. Why? `low[v] > disc[u]` means v's entire subtree has no back edge that climbs to u or any ancestor of u. The only way to leave v's subtree is through the tree edge (u, v) itself. Cut that edge, and v's subtree is isolated — by definition, a bridge. If `low[v] <= disc[u]`, then v's subtree has at least one back edge climbing past u, providing an alternate path; cutting (u, v) leaves the graph connected.

Computing `low` is mechanical during DFS. Initialize `low[u] = disc[u]`. For each neighbor v: if v is the parent, skip. If v is already visited (back edge), update `low[u] = min(low[u], disc[v])`. Otherwise (tree edge), recurse on v, then update `low[u] = min(low[u], low[v])` and check the bridge condition. The same `low` array also detects articulation points (`low[v] >= disc[u]`, slightly different strict inequality) and powers Tarjan's SCC algorithm — one DFS structure unlocks three classical results.

## visualization
Graph 1 -- 2 -- 3, with 2 -- 4, 4 -- 5, 5 -- 4 forming a small cycle. DFS from 1: disc[1]=1, disc[2]=2, disc[3]=3 (leaf -> low[3]=3), disc[4]=4, disc[5]=5. Back edge 5->4: low[5]=4, propagates low[4]=4. Climbing back: low[2] = min(low[3], low[4], disc[2]) = min(3, 4, 2) = 2. low[1]=1. Bridges: low[3] > disc[2] yes (3 > 2) -> edge (2, 3) is a bridge. low[4] > disc[2]? 4 > 2 yes -> edge (2, 4) is a bridge. low[2] > disc[1]? 2 > 1 yes -> edge (1, 2) is a bridge.

## bruteForce
Remove each edge one at a time and run BFS/DFS to check if the graph is still connected. O(E * (V + E)) = up to O(V * E^2). Correct but quadratic in edge count, useless beyond toy graphs. It also doesn't yield 2-edge-connected components for free.

## optimal
The optimal algorithm is **Tarjan's single-DFS bridge-finding**, O(V + E) time and O(V) space (for `disc`, `low`, plus the recursion stack). The implementation is roughly 30 lines and finds every bridge in one tree traversal — the asymptotic lower bound, since any algorithm must read every edge.

```python
import sys
sys.setrecursionlimit(1 << 25)

def find_bridges(n: int, adj: list[list[int]]) -> list[tuple[int, int]]:
    disc = [0] * n
    low  = [0] * n
    visited = [False] * n
    bridges = []
    timer = [1]                                  # mutable holder for closure

    def dfs(u: int, parent_edge: int) -> None:
        visited[u] = True
        disc[u] = low[u] = timer[0]
        timer[0] += 1
        for idx, v in enumerate(adj[u]):
            # Skip the edge we arrived through (handles multi-edges by index).
            if idx == parent_edge:
                continue
            if visited[v]:
                # Back edge to an already-visited ancestor: lower `low`.
                low[u] = min(low[u], disc[v])
            else:
                # Tree edge: recurse, then propagate `low` upward.
                dfs(v, _reverse_edge_index(adj, v, u))
                low[u] = min(low[u], low[v])
                if low[v] > disc[u]:
                    # No back edge from v's subtree climbs to u or higher
                    # -> (u, v) is the only path; it is a bridge.
                    bridges.append((u, v))

    for i in range(n):
        if not visited[i]:
            dfs(i, -1)
    return bridges
```

Why this is right: the algorithm exploits the **structural invariant of DFS trees in undirected graphs** — every non-tree edge is a back edge to an ancestor (cross edges and forward edges cannot exist in undirected DFS). The `low[v]` value captures exactly "the highest ancestor reachable from v's subtree via back edges"; comparing `low[v]` to `disc[u]` answers "does v's subtree have a way around the edge (u, v)?" in O(1) per edge. The recursion visits each edge twice (once from each endpoint), so total work is O(V + E).

**Edge-case handling that matters in production**:

- **Parent-edge tracking, not parent-vertex tracking**. If the graph has multi-edges (two parallel edges between u and v), comparing `v == parent` is wrong — both parallel edges would be skipped, and you would miss back-edge updates. Track the **index of the edge** in the adjacency list and skip only that index. This is the single most common bug.
- **Recursion stack overflow on long-path graphs**. Python's default recursion limit (1000) crashes on graphs with paths > 1000 vertices. Either raise the limit (`sys.setrecursionlimit`) or rewrite as an iterative DFS using an explicit stack. For graphs > 10^6 vertices, iterative is mandatory.
- **Disconnected graphs**: loop over all vertices and start a fresh DFS from each unvisited one, so every connected component is explored.
- **Self-loops**: a self-loop (u, u) is never a bridge — handle by skipping when `v == u`.

**Adjacent algorithms that share the low-link template**:
- **Articulation points** (cut vertices): condition becomes `low[v] >= disc[u]` for non-root, plus special handling at the DFS root (root is an articulation point iff it has >= 2 children in the DFS tree).
- **Strongly Connected Components** (Tarjan's SCC): same `low` machinery on directed graphs, with a vertex stack to track current component.
- **Biconnected Components / Block-cut tree**: pair bridge-finding with edge-stack tracking to enumerate the 2-edge-connected blocks.

The `cp-algorithms` and `KACTL` references ship reusable templates for all four, built on the same DFS skeleton.

## complexity
time: O(V + E)
space: O(V) for disc/low arrays plus O(V) recursion stack — convert to iterative DFS for deep graphs.
notes: Works only on undirected graphs. For directed graphs, the analogous concept is "SCC + bridge in the condensation," which Tarjan's SCC handles separately.

## pitfalls
- Treating the parent edge as a back edge — always pass parent (or parent-edge-index) and skip it.
- Multi-edges between the same pair: if two parallel edges connect u and v, neither is a bridge. Use edge indices, not vertex pairs, to disambiguate.
- Recursion stack overflow on long path graphs in Python/Java — write iterative DFS or raise the limit.
- Confusing bridges with articulation points: an articulation point is a *vertex* whose removal disconnects the graph, with a slightly different low-link condition (`low[v] >= disc[u]`).

## interviewTips
- Write the two key updates on the board: "child case: low[u] = min(low[u], low[v]); back-edge case: low[u] = min(low[u], disc[w])."
- Spell out the bridge condition: low[v] > disc[u] — the strict inequality is what matters.
- Connect to real systems: AWS regions, ISP peering links, critical chokepoints in a microservice graph.
- Mention multi-edge handling proactively — interviewers like to ask follow-ups about it.

## code.python
```python
import sys
sys.setrecursionlimit(1 << 25)

def find_bridges(n, adj):
    disc = [0] * n
    low = [0] * n
    visited = [False] * n
    timer = [1]
    bridges = []

    def dfs(u, parent):
        visited[u] = True
        disc[u] = low[u] = timer[0]
        timer[0] += 1
        for v in adj[u]:
            if v == parent:
                continue
            if visited[v]:
                low[u] = min(low[u], disc[v])
            else:
                dfs(v, u)
                low[u] = min(low[u], low[v])
                if low[v] > disc[u]:
                    bridges.append((u, v))

    for i in range(n):
        if not visited[i]:
            dfs(i, -1)
    return bridges
```

## code.javascript
```javascript
function findBridges(n, adj) {
  const disc = new Array(n).fill(0);
  const low = new Array(n).fill(0);
  const visited = new Array(n).fill(false);
  const bridges = [];
  let timer = 1;

  const dfs = (u, parent) => {
    visited[u] = true;
    disc[u] = low[u] = timer++;
    for (const v of adj[u]) {
      if (v === parent) continue;
      if (visited[v]) {
        low[u] = Math.min(low[u], disc[v]);
      } else {
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) bridges.push([u, v]);
      }
    }
  };

  for (let i = 0; i < n; i++) if (!visited[i]) dfs(i, -1);
  return bridges;
}
```

## code.java
```java
int timer = 1;
int[] disc, low;
boolean[] visited;
List<int[]> bridges;
List<List<Integer>> adj;

void dfs(int u, int parent) {
    visited[u] = true;
    disc[u] = low[u] = timer++;
    for (int v : adj.get(u)) {
        if (v == parent) continue;
        if (visited[v]) {
            low[u] = Math.min(low[u], disc[v]);
        } else {
            dfs(v, u);
            low[u] = Math.min(low[u], low[v]);
            if (low[v] > disc[u]) bridges.add(new int[]{u, v});
        }
    }
}
```

## code.cpp
```cpp
int timer = 1;
vector<int> disc, low;
vector<bool> visited;
vector<pair<int,int>> bridges;
vector<vector<int>> adj;

void dfs(int u, int parent) {
    visited[u] = true;
    disc[u] = low[u] = timer++;
    for (int v : adj[u]) {
        if (v == parent) continue;
        if (visited[v]) {
            low[u] = min(low[u], disc[v]);
        } else {
            dfs(v, u);
            low[u] = min(low[u], low[v]);
            if (low[v] > disc[u]) bridges.push_back({u, v});
        }
    }
}
```
