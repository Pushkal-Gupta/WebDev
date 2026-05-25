---
slug: heavy-light-decomposition
module: trees-advanced-queries
title: Heavy-Light Decomposition
subtitle: Split a tree into O(log n) chains so path queries become a handful of range queries on a flat array.
difficulty: Advanced
position: 23
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Balanced Search Trees"
    url: "https://algs4.cs.princeton.edu/33balanced/"
    type: book
  - title: "cp-algorithms — Trees and tree algorithms"
    url: "https://cp-algorithms.com/graph/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/binary_tree/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/binary_tree"
    type: repo
status: published
---

## intro
Heavy-Light Decomposition (HLD) partitions the edges of a rooted tree into **heavy** edges (leading to the largest-subtree child) and **light** edges (everything else). The heavy edges form a small number of disjoint chains. Any root-to-leaf path crosses at most O(log n) chains — so a path query reduces to O(log n) range queries on the flat array of those chains.

## whyItMatters
Without HLD, "sum of values on the path from u to v" or "max value on the path" is O(path length) per query — O(n) worst case. With HLD + segment tree on the chain array, each query is O(log² n). For trees with n = 10^5 and q = 10^5 queries, that's the difference between 10^10 ops (impossible) and 10^7 ops (snappy).

## intuition
Pick a root. For each node, the **heavy child** is the one whose subtree has the most nodes; the edge to that child is **heavy**. All other edges are **light**. Walk from any node toward the root: you traverse heavy edges (staying in the current chain) most of the time, occasionally hopping to a new chain via a light edge. The clever part: each time you cross a light edge, the remaining subtree at least halves — so you cross at most log₂(n) light edges total.

## visualization
```
         1
       / | \
      2  3  4              size(2)=4 → heavy edge 1-2
     /|     |\             others (3, 4) → light edges
    5 6    7  8
            \
             9

Chain 1: 1 → 2 → 5  (or 2 → 6, depending on tie-break)
Chain 2: 3            (size 1)
Chain 3: 4 → 7 → 9
Chain 4: 8            (singleton)
```

## bruteForce
For each path query, walk u and v up to their LCA, accumulating values. O(depth) per query. Fine for paths short and trees shallow; useless for skewed trees.

## optimal
**Setup** (two DFS passes):

DFS 1 — compute subtree sizes and pick heavy child:
```
size[v] = 1 + sum(size[child])
heavy[v] = child with max size[]
```

DFS 2 — assign chain heads, positions in a flat array:
```
order = 0
DFS(v, head):
    pos[v] = order; order += 1
    chain_head[v] = head
    if heavy[v] exists:
        DFS(heavy[v], head)         # extend the chain
    for other child c:
        DFS(c, c)                   # new chain
```

**Build a segment tree** indexed by `pos` over the array of node values.

**Path query u → v**:
```
result = 0
while chain_head[u] != chain_head[v]:
    if depth[chain_head[u]] < depth[chain_head[v]]: swap(u, v)
    # Climb from u to the top of its chain
    result = combine(result, segtree.query(pos[chain_head[u]], pos[u]))
    u = parent[chain_head[u]]
# Now u and v are on the same chain
if depth[u] > depth[v]: swap(u, v)
result = combine(result, segtree.query(pos[u], pos[v]))
return result
```

Each loop iteration crosses a light edge — at most log n of those — so the loop runs O(log n) times, each with O(log n) segment-tree query → O(log² n) per path query.

## complexity
- **Preprocessing**: O(n).
- **Path query / update**: O(log² n).
- **Space**: O(n) for chain arrays + O(n) for the segment tree.

## pitfalls
- **Mixing edge vs node weights**: if weights are on edges, store the weight at the deeper endpoint and skip the LCA in the final query. Off-by-one mistakes here are common.
- **Forgetting to swap when chain heads differ at depths**: the algorithm assumes you always climb the deeper one's chain first.
- **Tie-breaking heavy children**: any deterministic rule works; if you tie-break inconsistently across runs, debugging is harder.
- **Recursion depth on skewed trees**: a tree of 10^5 nodes can be a 10^5-deep chain. Use iterative DFS.
- **Combining with lazy propagation**: works, but write `update` with care — every chain segment range-update follows the same path-decomposition pattern as the query.

## interviewTips
- The trigger: "path queries / updates on a tree, many queries." HLD + segment tree.
- For senior interviews, mention HLD by name; for very senior, mention **link-cut trees** for the online-updates version.
- Walk through the "light edges halve the subtree" argument — it's the elegant reason the log is there.
- Compare with **Euler tour + segment tree** (subtree queries, no path queries) and **LCA + sparse table** (just LCA in O(1)).

## code.python
```python
class HLD:
    def __init__(self, n, edges, values, root=0):
        self.n = n
        self.adj = [[] for _ in range(n)]
        for u, v in edges:
            self.adj[u].append(v); self.adj[v].append(u)
        self.parent = [0]*n; self.depth = [0]*n
        self.size = [1]*n; self.heavy = [-1]*n
        self.head = [0]*n; self.pos = [0]*n
        self._dfs1(root, -1)
        self._t = 0
        self._dfs2(root, root)
        # Map node positions to a flat array for the segment tree.
        self.flat = [0]*n
        for v in range(n): self.flat[self.pos[v]] = values[v]
        # Build your favorite segment tree on self.flat here.

    def _dfs1(self, v, p):
        self.parent[v] = p
        max_size = 0
        for nb in self.adj[v]:
            if nb == p: continue
            self.depth[nb] = self.depth[v] + 1
            self._dfs1(nb, v)
            self.size[v] += self.size[nb]
            if self.size[nb] > max_size:
                max_size = self.size[nb]
                self.heavy[v] = nb

    def _dfs2(self, v, h):
        self.head[v] = h
        self.pos[v] = self._t; self._t += 1
        if self.heavy[v] != -1: self._dfs2(self.heavy[v], h)
        for nb in self.adj[v]:
            if nb != self.parent[v] and nb != self.heavy[v]:
                self._dfs2(nb, nb)
```

## code.javascript
```javascript
// Sketch — closely follows the Python version, omitted segment tree integration.
class HLD {
  constructor(n, edges, root = 0) {
    this.n = n;
    this.adj = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) { this.adj[u].push(v); this.adj[v].push(u); }
    this.parent = new Int32Array(n).fill(-1);
    this.depth = new Int32Array(n);
    this.size = new Int32Array(n).fill(1);
    this.heavy = new Int32Array(n).fill(-1);
    this.head = new Int32Array(n);
    this.pos = new Int32Array(n);
    this._dfs1(root, -1);
    this._t = 0;
    this._dfs2(root, root);
  }
  _dfs1(v, p) {
    this.parent[v] = p;
    let maxSize = 0;
    for (const nb of this.adj[v]) {
      if (nb === p) continue;
      this.depth[nb] = this.depth[v] + 1;
      this._dfs1(nb, v);
      this.size[v] += this.size[nb];
      if (this.size[nb] > maxSize) { maxSize = this.size[nb]; this.heavy[v] = nb; }
    }
  }
  _dfs2(v, h) {
    this.head[v] = h; this.pos[v] = this._t++;
    if (this.heavy[v] !== -1) this._dfs2(this.heavy[v], h);
    for (const nb of this.adj[v])
      if (nb !== this.parent[v] && nb !== this.heavy[v]) this._dfs2(nb, nb);
  }
}
```

## code.java
```java
import java.util.*;
class HLD {
    int n, t = 0;
    int[] parent, depth, size, heavy, head, pos;
    List<List<Integer>> adj;
    HLD(int n, int[][] edges, int root) {
        this.n = n; adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (var e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        parent = new int[n]; depth = new int[n]; size = new int[n];
        heavy = new int[n]; head = new int[n]; pos = new int[n];
        Arrays.fill(heavy, -1); Arrays.fill(size, 1);
        parent[root] = -1;
        dfs1(root, -1); dfs2(root, root);
    }
    void dfs1(int v, int p) {
        parent[v] = p; int maxSize = 0;
        for (int nb : adj.get(v)) if (nb != p) {
            depth[nb] = depth[v] + 1; dfs1(nb, v);
            size[v] += size[nb];
            if (size[nb] > maxSize) { maxSize = size[nb]; heavy[v] = nb; }
        }
    }
    void dfs2(int v, int h) {
        head[v] = h; pos[v] = t++;
        if (heavy[v] != -1) dfs2(heavy[v], h);
        for (int nb : adj.get(v)) if (nb != parent[v] && nb != heavy[v]) dfs2(nb, nb);
    }
}
```

## code.cpp
```cpp
#include <vector>
struct HLD {
    int n, t = 0;
    std::vector<int> parent, depth, size, heavy, head, pos;
    std::vector<std::vector<int>> adj;
    HLD(int n, const std::vector<std::pair<int,int>>& edges, int root)
        : n(n), parent(n, -1), depth(n, 0), size(n, 1), heavy(n, -1), head(n), pos(n), adj(n) {
        for (auto [u, v] : edges) { adj[u].push_back(v); adj[v].push_back(u); }
        dfs1(root, -1); dfs2(root, root);
    }
    void dfs1(int v, int p) {
        parent[v] = p;
        int maxSize = 0;
        for (int nb : adj[v]) if (nb != p) {
            depth[nb] = depth[v] + 1; dfs1(nb, v);
            size[v] += size[nb];
            if (size[nb] > maxSize) { maxSize = size[nb]; heavy[v] = nb; }
        }
    }
    void dfs2(int v, int h) {
        head[v] = h; pos[v] = t++;
        if (heavy[v] != -1) dfs2(heavy[v], h);
        for (int nb : adj[v]) if (nb != parent[v] && nb != heavy[v]) dfs2(nb, nb);
    }
};
```
