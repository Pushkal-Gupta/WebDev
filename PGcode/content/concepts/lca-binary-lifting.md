---
slug: lca-binary-lifting
module: trees
title: LCA via Binary Lifting
subtitle: Lowest Common Ancestor of any two nodes in O(log n) after O(n log n) preprocessing.
difficulty: Advanced
position: 20
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Bender & Farach-Colton — The LCA problem revisited"
    url: ""
status: published
---

## intro
Given a rooted tree of `n` nodes, the **Lowest Common Ancestor** of two nodes `u` and `v` is the deepest node that is an ancestor of both. Binary lifting precomputes, for each node, its `2^k`-th ancestor for every relevant `k`. After O(n log n) preprocessing, every LCA query is O(log n).

## whyItMatters
LCA underpins distance-on-tree queries (`dist(u, v) = depth(u) + depth(v) - 2·depth(lca)`), path-aggregation problems (combine sparse table on the path), tree DP, auto-completion in versioned tries, and reachability in DAGs after a tree decomposition. Once you have LCA, dozens of "given two tree nodes, compute X about the path between them" problems collapse to O(log n) each.

## intuition
To find LCA(u, v):
1. Lift the deeper of the two up to the depth of the other.
2. Now both are at the same depth. If they're equal, that's the LCA.
3. Otherwise, jump them up together by the largest power of two whose ancestors differ; repeat with smaller powers. They end up just below the LCA. Return either node's parent.

The "lift by 2^k" jumps come from a precomputed table where `up[k][v] = v`'s ancestor 2^k steps up.

## visualization
```
Depths:        depth = 0       (root)
                 /  |  \
                A   B   C       depth = 1
               / \      |
              D   E     F       depth = 2
             / \
            G   H              depth = 3

LCA(G, F): equalize depths — G is at 3, F is at 2, lift G up 1 → D (depth 2).
Both at depth 2: D vs F. Different. Lift both by 2 — both reach root. Lift both by 1 — A vs C, still different. Done — answer = their parent = root.
```

## bruteForce
For each query, walk both nodes up to the root recording ancestors, then walk one path noting which nodes appear in the other's set. O(n) per query, O(n·Q) total. Dies on n = Q = 10^5.

## optimal
**Preprocessing** (DFS from root):
```
depth[root] = 0
up[0][root] = root          # self-loop sentinel
DFS(v):
    for child c of v:
        depth[c] = depth[v] + 1
        up[0][c] = v
        DFS(c)

for k from 1 to LOG-1:
    for v from 0 to n-1:
        up[k][v] = up[k-1][ up[k-1][v] ]
```

**Query LCA(u, v)** in O(log n):
```
if depth[u] < depth[v]: swap(u, v)
diff = depth[u] - depth[v]
for k from 0 to LOG-1:
    if (diff >> k) & 1: u = up[k][u]
if u == v: return u
for k from LOG-1 down to 0:
    if up[k][u] != up[k][v]:
        u = up[k][u]
        v = up[k][v]
return up[0][u]
```

Storage `O(n log n)` ints; query `O(log n)` time.

## complexity
- **Preprocessing**: O(n log n) time and space.
- **Query**: O(log n).
- **Updates**: not supported (the tree is static). For dynamic trees use link-cut or Euler-tour + segment tree.

## pitfalls
- **Off-by-one in `up[k][v]`**: when there's no ancestor at distance 2^k, store the root or itself as a sentinel — never -1, or your code branches everywhere.
- **Equalizing depths in the wrong direction**: lift the *deeper* node, not the shallower one.
- **Stopping at the wrong moment**: after the descent loop, you're one step *below* the LCA. Return `up[0][u]`, not `u`.
- **Iterative DFS for large n** (>10^5) to avoid Python's recursion-limit traps.
- **LOG too small**: pick `LOG = ceil(log2(n)) + 1` so `up[LOG-1][·]` reaches the root.

## interviewTips
- Recognize the trigger: "find LCA / path queries on a tree, many queries." That's binary lifting (or Euler-tour + sparse table for O(1) queries).
- Walk through the algorithm in two phases — equalize depths, then descend together — interviewers find the descent step subtle.
- Mention the Euler-tour + RMQ approach as the O(1)-query alternative; binary lifting wins on code simplicity and constant factor.
- For weighted trees, store `max[k][v]` alongside `up[k][v]` to answer "max edge on path between u and v" in O(log n).

## code.python
```python
import math
class LCA:
    def __init__(self, n, edges, root=0):
        self.n = n
        self.LOG = max(1, int(math.log2(n)) + 1)
        self.adj = [[] for _ in range(n)]
        for u, v in edges:
            self.adj[u].append(v); self.adj[v].append(u)
        self.depth = [0]*n
        self.up = [[root]*n for _ in range(self.LOG)]
        self._dfs(root, root)
        for k in range(1, self.LOG):
            for v in range(n):
                self.up[k][v] = self.up[k-1][self.up[k-1][v]]

    def _dfs(self, root, parent):
        # iterative to avoid recursion limits
        stack = [(root, parent)]
        while stack:
            v, p = stack.pop()
            self.up[0][v] = p
            for c in self.adj[v]:
                if c != p:
                    self.depth[c] = self.depth[v] + 1
                    stack.append((c, v))

    def query(self, u, v):
        if self.depth[u] < self.depth[v]: u, v = v, u
        diff = self.depth[u] - self.depth[v]
        for k in range(self.LOG):
            if (diff >> k) & 1: u = self.up[k][u]
        if u == v: return u
        for k in range(self.LOG - 1, -1, -1):
            if self.up[k][u] != self.up[k][v]:
                u = self.up[k][u]; v = self.up[k][v]
        return self.up[0][u]
```

## code.javascript
```javascript
class LCA {
  constructor(n, edges, root = 0) {
    this.n = n;
    this.LOG = Math.max(1, Math.floor(Math.log2(n)) + 1);
    this.adj = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) { this.adj[u].push(v); this.adj[v].push(u); }
    this.depth = new Int32Array(n);
    this.up = Array.from({ length: this.LOG }, () => new Int32Array(n).fill(root));
    const stack = [[root, root]];
    while (stack.length) {
      const [v, p] = stack.pop();
      this.up[0][v] = p;
      for (const c of this.adj[v]) if (c !== p) { this.depth[c] = this.depth[v] + 1; stack.push([c, v]); }
    }
    for (let k = 1; k < this.LOG; k++)
      for (let v = 0; v < n; v++)
        this.up[k][v] = this.up[k-1][this.up[k-1][v]];
  }
  query(u, v) {
    if (this.depth[u] < this.depth[v]) [u, v] = [v, u];
    let diff = this.depth[u] - this.depth[v];
    for (let k = 0; k < this.LOG; k++) if ((diff >> k) & 1) u = this.up[k][u];
    if (u === v) return u;
    for (let k = this.LOG - 1; k >= 0; k--)
      if (this.up[k][u] !== this.up[k][v]) { u = this.up[k][u]; v = this.up[k][v]; }
    return this.up[0][u];
  }
}
```

## code.java
```java
import java.util.*;
class LCA {
    int n, LOG; int[] depth; int[][] up; List<List<Integer>> adj;
    LCA(int n, int[][] edges, int root) {
        this.n = n; this.LOG = Math.max(1, (int)(Math.log(n)/Math.log(2)) + 1);
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (var e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        depth = new int[n]; up = new int[LOG][n];
        for (int[] row : up) Arrays.fill(row, root);
        Deque<int[]> stack = new ArrayDeque<>();
        stack.push(new int[]{ root, root });
        while (!stack.isEmpty()) {
            int[] cur = stack.pop(); int v = cur[0], p = cur[1];
            up[0][v] = p;
            for (int c : adj.get(v)) if (c != p) { depth[c] = depth[v] + 1; stack.push(new int[]{c, v}); }
        }
        for (int k = 1; k < LOG; k++)
            for (int v = 0; v < n; v++) up[k][v] = up[k-1][up[k-1][v]];
    }
    int query(int u, int v) {
        if (depth[u] < depth[v]) { int t = u; u = v; v = t; }
        int diff = depth[u] - depth[v];
        for (int k = 0; k < LOG; k++) if (((diff >> k) & 1) == 1) u = up[k][u];
        if (u == v) return u;
        for (int k = LOG - 1; k >= 0; k--)
            if (up[k][u] != up[k][v]) { u = up[k][u]; v = up[k][v]; }
        return up[0][u];
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <cmath>
#include <stack>
struct LCA {
    int n, LOG;
    std::vector<int> depth;
    std::vector<std::vector<int>> adj, up;
    LCA(int n, std::vector<std::pair<int,int>>& edges, int root = 0)
      : n(n), LOG(std::max(1, (int)std::log2(n) + 1)),
        depth(n, 0), adj(n), up(LOG, std::vector<int>(n, root)) {
        for (auto [u, v] : edges) { adj[u].push_back(v); adj[v].push_back(u); }
        std::stack<std::pair<int,int>> st; st.push({root, root});
        while (!st.empty()) {
            auto [v, p] = st.top(); st.pop();
            up[0][v] = p;
            for (int c : adj[v]) if (c != p) { depth[c] = depth[v] + 1; st.push({c, v}); }
        }
        for (int k = 1; k < LOG; k++)
            for (int v = 0; v < n; v++) up[k][v] = up[k-1][up[k-1][v]];
    }
    int query(int u, int v) {
        if (depth[u] < depth[v]) std::swap(u, v);
        int diff = depth[u] - depth[v];
        for (int k = 0; k < LOG; k++) if ((diff >> k) & 1) u = up[k][u];
        if (u == v) return u;
        for (int k = LOG - 1; k >= 0; k--)
            if (up[k][u] != up[k][v]) { u = up[k][u]; v = up[k][v]; }
        return up[0][u];
    }
};
```
