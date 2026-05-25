---
slug: graph-bridges-articulation
module: graphs-advanced
title: Bridges & Articulation Points
subtitle: Edges and vertices whose removal disconnects the graph — Tarjan's low-link adaptation finds both in O(V+E).
difficulty: Advanced
position: 63
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Articulation points and bridges"
    url: "https://walkccc.me/CLRS/Chap22/"
    type: book
  - title: "cp-algorithms — Bridges & articulation points"
    url: "https://cp-algorithms.com/graph/bridge-searching.html"
    type: blog
  - title: "TheAlgorithms/Python — Bridge finder"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/bridges.py"
    type: repo
status: published
---

## intro
- **Bridge** (cut edge): an edge whose removal disconnects the graph.
- **Articulation point** (cut vertex): a vertex whose removal disconnects the graph.

Both critical for network reliability — a bridge = single point of failure on a link; an articulation point = SPOF on a node. **Tarjan's low-link** finds both in one DFS at O(V+E).

## whyItMatters
- **Network planning**: identifying bridges → which links need redundancy (e.g., dual fiber paths).
- **Microservice graphs**: an articulation service is one whose outage partitions the system.
- **Road networks**: bridges in the literal sense — failure cascades.
- **2-edge-connectivity**: a graph with zero bridges is 2-edge-connected — survives any single link failure.
- **Biconnected components**: groups of vertices with no articulation point between them.

## intuition
For each DFS edge from u to v (tree edge):
- **Bridge**: (u, v) is a bridge iff `low[v] > disc[u]`. Meaning: from v's subtree there's no path back to u or ancestors, so removing (u, v) disconnects v's subtree.
- **Articulation**: u is an articulation point iff:
  - u is **root of DFS tree** AND has ≥ 2 tree children, OR
  - u is **non-root** AND has a tree child v with `low[v] ≥ disc[u]` (some subtree can't bypass u to reach an ancestor).

Same low-link primitive as Tarjan's SCC, applied to undirected graphs.

## visualization
```
Graph (undirected):
     1
    / \
   2   3
   |   |
   4   5
    \ /
     6
     |
     7

DFS from 1:
  disc[1]=0, low[1]=0
  → 2: disc[2]=1, low[2]=1
    → 4: disc[4]=2, low[4]=2
      → 6: disc[6]=3, low[6]=3
        → 5: disc[5]=4, low[5]=4
          → 3 (back to disc=5): wait, depends on DFS order
        Actually let's say 6 also connects up to 5 to 3:
        → 7: disc[7]=5, low[7]=5
        back: low[6] = min(3, low[7]=5, low[5]=...) = 3
      back: low[4] = min(2, low[6]) = 2
    back: low[2] = min(1, low[4]) = 1
  back: low[1] = min(0, low[2]) = 0

Bridge checks (each tree edge):
  (1,2): low[2]=1 > disc[1]=0 → BRIDGE
  (2,4): low[4]=2 > disc[2]=1 → BRIDGE
  (4,6): low[6]=3 > disc[4]=2 → BRIDGE  (unless cycle through 5)
  (6,7): low[7]=5 > disc[6]=3 → BRIDGE

Articulation checks:
  Root (1) has 1 tree child → not articulation in this DFS.
  Non-root: u=2, tree child v=4 with low[v]=2 ≥ disc[u]=1 → 2 is articulation.
            u=4, tree child v=6 with low[v]=3 ≥ disc[u]=2 → 4 is articulation.
            u=6, tree child v=7 with low[v]=5 ≥ disc[u]=3 → 6 is articulation.
```

## bruteForce
**Remove each edge, run BFS** to check connectivity: O(E × (V+E)). Same for vertices: O(V × (V+E)).

**Re-run DFS without each candidate**: still polynomial but quadratic.

Tarjan's single-DFS approach is asymptotically optimal.

## optimal
**Tarjan's algorithm (undirected)**:
1. DFS from any vertex; assign `disc[v]`, `low[v]`.
2. For each unvisited neighbor u of v: recurse on u (tree edge), update `low[v] = min(low[v], low[u])`. Check bridge condition.
3. For each visited neighbor u of v that is NOT the parent: this is a back edge; `low[v] = min(low[v], disc[u])`.
4. After processing all children: check articulation condition.
5. Special handling for the DFS root: needs ≥ 2 tree children to be articulation.

**Handling multi-edges**: maintain edge-id (not just parent vertex) so a single duplicated edge doesn't count as parent-skip.

**Iterative version** required for large graphs to avoid Python recursion limit.

## complexity
- **Time:** O(V + E).
- **Space:** O(V) for disc / low / parent + O(V) recursion stack.

## pitfalls
- **Parent-skip confused with multi-edge.** `if u != parent` skips one edge to the parent, but a duplicated edge to the same parent is *not* a back edge — it's a second tree edge candidate. Fix: track parent-*edge-id* instead of parent-vertex, so duplicated edges count once and only the literal incoming edge is skipped.
- **Strict vs non-strict comparison swapped.** Bridge requires `low[v] > disc[u]`; articulation uses `low[v] >= disc[u]`. Swapping them yields wrong sets. Fix: write both predicates in one place with a comment naming each, and add a unit test on a triangle graph (no bridges or articulations) before shipping.
- **Root special case missed.** The non-root rule mis-flags the DFS root, which is an articulation point only when it has 2+ tree children. Fix: guard the articulation check on `parent != -1`, then add a separate check `parent == -1 && treeChildren >= 2`.
- **Applying to directed graphs.** Bridges and articulation points are undirected concepts; rerunning the same code on a directed graph produces nonsense. Fix: for directed graphs use SCC + condensation; the analogous concept is a "bridge" in the condensation tree.
- **Forgetting that bridges form a forest.** A user expecting cycles among bridges will write the wrong post-processing. Fix: contract each 2-edge-connected component to a single node; the remaining edges (bridges only) form a tree, which simplifies downstream queries.
- **Recursion overflow on long chains.** Recursive DFS blows the Python / JS stack at V > ~10^4. Fix: convert to an explicit-stack iterative DFS (with a "state" enum per stack frame to resume mid-children) or call `sys.setrecursionlimit` plus `threading.Thread(stack_size=...)` for one-shot scripts.

## interviewTips
- For "critical connections in a network" (LeetCode 1192) → bridges.
- For "find articulation points" → low-link DFS.
- Cite **2-edge-connectivity** and **2-vertex-connectivity** as the graph-theory framing.
- For senior interviews, discuss **biconnected component decomposition**, **block-cut tree**, **edge biconnectivity** in network reliability.

## code.python
```python
def find_bridges(graph):
    n = len(graph)
    disc = [-1] * n; low = [0] * n
    bridges = []; t = [0]
    def dfs(v, parent):
        disc[v] = low[v] = t[0]; t[0] += 1
        for u in graph[v]:
            if disc[u] == -1:
                dfs(u, v)
                low[v] = min(low[v], low[u])
                if low[u] > disc[v]:
                    bridges.append((v, u))
            elif u != parent:
                low[v] = min(low[v], disc[u])
    for v in range(n):
        if disc[v] == -1: dfs(v, -1)
    return bridges
```

## code.javascript
```javascript
function findBridges(graph) {
  const n = graph.length;
  const disc = Array(n).fill(-1), low = Array(n).fill(0);
  const bridges = []; let t = 0;
  function dfs(v, parent) {
    disc[v] = low[v] = t++;
    for (const u of graph[v]) {
      if (disc[u] === -1) {
        dfs(u, v);
        low[v] = Math.min(low[v], low[u]);
        if (low[u] > disc[v]) bridges.push([v, u]);
      } else if (u !== parent) {
        low[v] = Math.min(low[v], disc[u]);
      }
    }
  }
  for (let v = 0; v < n; v++) if (disc[v] === -1) dfs(v, -1);
  return bridges;
}
```

## code.java
```java
class Bridges {
    List<List<Integer>> g; int[] disc, low; int t = 0;
    List<int[]> bridges = new ArrayList<>();
    public List<int[]> find(List<List<Integer>> graph) {
        g = graph; int n = g.size();
        disc = new int[n]; low = new int[n]; Arrays.fill(disc, -1);
        for (int v = 0; v < n; v++) if (disc[v] == -1) dfs(v, -1);
        return bridges;
    }
    void dfs(int v, int parent) {
        disc[v] = low[v] = t++;
        for (int u : g.get(v)) {
            if (disc[u] == -1) {
                dfs(u, v);
                low[v] = Math.min(low[v], low[u]);
                if (low[u] > disc[v]) bridges.add(new int[]{v, u});
            } else if (u != parent) {
                low[v] = Math.min(low[v], disc[u]);
            }
        }
    }
}
```

## code.cpp
```cpp
class Bridges {
    vector<vector<int>>& g;
    vector<int> disc, low; int t = 0;
    vector<pair<int,int>> bridges;
    void dfs(int v, int parent) {
        disc[v] = low[v] = t++;
        for (int u : g[v]) {
            if (disc[u] == -1) {
                dfs(u, v);
                low[v] = min(low[v], low[u]);
                if (low[u] > disc[v]) bridges.push_back({v, u});
            } else if (u != parent) {
                low[v] = min(low[v], disc[u]);
            }
        }
    }
public:
    Bridges(vector<vector<int>>& g) : g(g), disc(g.size(), -1), low(g.size()) {}
    vector<pair<int,int>> find() {
        for (int v = 0; v < (int)g.size(); v++) if (disc[v] == -1) dfs(v, -1);
        return bridges;
    }
};
```
