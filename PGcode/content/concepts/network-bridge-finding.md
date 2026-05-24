---
slug: network-bridge-finding
module: graphs
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
Robust networks must avoid bridges where a single failure splits the system. Beyond infrastructure, bridges are the building blocks of 2-edge-connected components: contract every bridge and what's left are the bi-edge-connected blocks of the graph. The low-link technique that finds bridges also finds articulation points and strongly connected components — once you've internalised it, three classic algorithms come for free.

## intuition
Do a DFS from any vertex, assigning each node a `disc[v]` (discovery time). For each node track `low[v]` = the smallest disc reachable from v's subtree using tree edges plus *at most one* back edge. An edge (u, v) where v is u's child is a bridge iff `low[v] > disc[u]` — meaning v's subtree has no back edge climbing to u or higher, so cutting (u, v) isolates v's subtree.

## visualization
Graph 1 -- 2 -- 3, with 2 -- 4, 4 -- 5, 5 -- 4 forming a small cycle. DFS from 1: disc[1]=1, disc[2]=2, disc[3]=3 (leaf -> low[3]=3), disc[4]=4, disc[5]=5. Back edge 5->4: low[5]=4, propagates low[4]=4. Climbing back: low[2] = min(low[3], low[4], disc[2]) = min(3, 4, 2) = 2. low[1]=1. Bridges: low[3] > disc[2] yes (3 > 2) -> edge (2, 3) is a bridge. low[4] > disc[2]? 4 > 2 yes -> edge (2, 4) is a bridge. low[2] > disc[1]? 2 > 1 yes -> edge (1, 2) is a bridge.

## bruteForce
Remove each edge one at a time and run BFS/DFS to check if the graph is still connected. O(E * (V + E)) = up to O(V * E^2). Correct but quadratic in edge count, useless beyond toy graphs. It also doesn't yield 2-edge-connected components for free.

## optimal
Single DFS, O(V + E). For each node track disc and low; on traversing a tree edge to child v, recurse, then update low[u] = min(low[u], low[v]) and check the bridge condition. For a back edge (u, w) (w is an ancestor, not the parent), update low[u] = min(low[u], disc[w]). Skip the immediate parent to avoid mistaking the tree edge for a back edge. Use a parent-edge index instead of parent-vertex if the graph has multi-edges.

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
