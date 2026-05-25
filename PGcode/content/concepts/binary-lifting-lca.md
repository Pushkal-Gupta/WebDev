---
slug: binary-lifting-lca
module: trees-advanced-queries
title: Binary Lifting for LCA
subtitle: Lowest common ancestor via 2^k ancestor tables — preprocess O(n log n), query O(log n).
difficulty: Advanced
position: 1
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "Lowest Common Ancestor — Binary Lifting — cp-algorithms"
    url: "https://cp-algorithms.com/graph/lca_binary_lifting.html"
    type: blog
  - title: "Binary Lifting (Kth Ancestor) — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/kth-ancestor-node-binary-tree-set-2/"
    type: blog
  - title: "KACTL — LCA.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/graph/LCA.h"
    type: repo
status: published
---

## intro
The lowest common ancestor (LCA) of two nodes u and v in a rooted tree is the deepest node that is an ancestor of both. Binary lifting precomputes, for every node, its 2^0, 2^1, 2^2, ... ancestors, then answers any LCA query in O(log n) by jumping in powers of two.

## whyItMatters
LCA underpins distance queries on trees (dist(u, v) = depth[u] + depth[v] - 2*depth[lca]), path-sum queries with prefix arrays, auxiliary structures like virtual trees, and offline algorithms like Tarjan's. Once you have O(log n) LCA, dozens of tree problems collapse to a few lines. Binary lifting is also the cleanest answer to the "k-th ancestor" interview question, so the same table solves two classic problems at once.

## intuition
Any positive integer k can be written as a sum of distinct powers of two — its binary representation. So to climb k steps from a node, climb 2^a steps, then 2^b steps, and so on for each set bit of k. If we store the 2^j-th ancestor of every node in a table `up[j][v]`, each jump is O(1). To find the LCA, first lift the deeper node to match depths, then lift both nodes together by the largest j that does not overshoot, until they are siblings of the LCA.

## visualization
Picture a tree rooted at 1 with edges 1-2, 1-3, 2-4, 2-5, 4-6. Depths: 1:0, 2:1, 3:1, 4:2, 5:2, 6:3. Build up[0][.] = parent, up[1][.] = grandparent, up[2][.] = great-great-grandparent. To find LCA(6, 5): depth[6]=3, depth[5]=2, so lift 6 by 2^0 = 1 step → 4. Now both at depth 2. Lift both by largest power that keeps them distinct: 2^0 lifts 4 → 2 and 5 → 2, equal, so skip. They are direct children of LCA, so LCA = parent of 4 = 2.

## bruteForce
Walk both pointers up to the root one parent at a time, marking visited ancestors in a hash set; first node already in the set is the LCA. O(n) per query, O(1) preprocessing. For a single query this is fine, but Q queries on a tree of n = 10^5 nodes burn Q*n work — 10^10 ops at Q = 10^5, far too slow for typical contest limits.

## optimal
Preprocess: DFS from the root recording depth[v] and up[0][v] = parent[v]. For j from 1 to LOG: up[j][v] = up[j-1][ up[j-1][v] ]. Query LCA(u, v): if depth[u] < depth[v], swap. Let diff = depth[u] - depth[v]; for each set bit j of diff, u = up[j][u]. If u == v, return u. Otherwise for j from LOG down to 0, if up[j][u] != up[j][v], move both up by 2^j. Return up[0][u]. Preprocessing is O(n log n) time and space; each query is O(log n).

## complexity
time: O(n log n) preprocess + O(log n) per query
space: O(n log n)
notes: LOG = ceil(log2(n)) — 20 suffices for n up to ~10^6. Iterative DFS avoids recursion-depth blowups on skewed trees. For static trees, Euler-tour + sparse-table RMQ gives O(n log n) / O(1) per query but is messier to code; binary lifting is the interview-friendly default.

## pitfalls
- Off-by-one on LOG — pick LOG so 2^LOG >= n; storing one extra level is cheaper than missing one.
- Forgetting to set up[j][root] sentinel to root (or -1) — wrong jumps when overshooting from a shallow node.
- Lifting before equalizing depths — both pointers must be at the same depth before the synchronized loop.
- Returning up[0][u] when u already equals v after the equalize step — special-case this; the LCA is u itself.
- Recursing DFS on a chain of 10^5 nodes blows the default Python stack — use sys.setrecursionlimit or iterate.

## interviewTips
- Phrase it as "binary representation of the jump distance" — interviewers love seeing the bit-trick intuition stated out loud.
- Mention the depth[u] + depth[v] - 2*depth[lca] formula for distances; many follow-ups are really distance queries in disguise.
- If asked about updates (edges changing), say binary lifting is for static trees and pivot to Euler-tour + segment tree or Link/Cut trees as the dynamic alternative.

## code.python
```python
import sys
sys.setrecursionlimit(1 << 25)

class LCA:
    def __init__(self, n, adj, root=0):
        self.LOG = max(1, (n - 1).bit_length())
        self.depth = [0] * n
        self.up = [[root] * n for _ in range(self.LOG + 1)]
        self._dfs(root, root, adj)
        for j in range(1, self.LOG + 1):
            for v in range(n):
                self.up[j][v] = self.up[j - 1][self.up[j - 1][v]]

    def _dfs(self, v, p, adj):
        self.up[0][v] = p
        for nb in adj[v]:
            if nb != p:
                self.depth[nb] = self.depth[v] + 1
                self._dfs(nb, v, adj)

    def query(self, u, v):
        if self.depth[u] < self.depth[v]:
            u, v = v, u
        diff = self.depth[u] - self.depth[v]
        for j in range(self.LOG + 1):
            if (diff >> j) & 1:
                u = self.up[j][u]
        if u == v:
            return u
        for j in range(self.LOG, -1, -1):
            if self.up[j][u] != self.up[j][v]:
                u = self.up[j][u]
                v = self.up[j][v]
        return self.up[0][u]
```

## code.javascript
```javascript
class LCA {
  constructor(n, adj, root = 0) {
    this.n = n;
    this.LOG = Math.max(1, Math.ceil(Math.log2(Math.max(n, 2))));
    this.depth = new Array(n).fill(0);
    this.up = Array.from({ length: this.LOG + 1 }, () => new Array(n).fill(root));
    const stack = [[root, root]];
    while (stack.length) {
      const [v, p] = stack.pop();
      this.up[0][v] = p;
      for (const nb of adj[v]) {
        if (nb !== p) { this.depth[nb] = this.depth[v] + 1; stack.push([nb, v]); }
      }
    }
    for (let j = 1; j <= this.LOG; j++) {
      for (let v = 0; v < n; v++) this.up[j][v] = this.up[j - 1][this.up[j - 1][v]];
    }
  }
  query(u, v) {
    if (this.depth[u] < this.depth[v]) [u, v] = [v, u];
    let diff = this.depth[u] - this.depth[v];
    for (let j = 0; j <= this.LOG; j++) if ((diff >> j) & 1) u = this.up[j][u];
    if (u === v) return u;
    for (let j = this.LOG; j >= 0; j--) {
      if (this.up[j][u] !== this.up[j][v]) { u = this.up[j][u]; v = this.up[j][v]; }
    }
    return this.up[0][u];
  }
}
```

## code.java
```java
class LCA {
    int LOG;
    int[] depth;
    int[][] up;

    LCA(int n, java.util.List<java.util.List<Integer>> adj, int root) {
        LOG = Math.max(1, (int) Math.ceil(Math.log(Math.max(n, 2)) / Math.log(2)));
        depth = new int[n];
        up = new int[LOG + 1][n];
        for (int[] row : up) java.util.Arrays.fill(row, root);
        java.util.Deque<int[]> stack = new java.util.ArrayDeque<>();
        stack.push(new int[]{root, root});
        while (!stack.isEmpty()) {
            int[] cur = stack.pop();
            int v = cur[0], p = cur[1];
            up[0][v] = p;
            for (int nb : adj.get(v)) if (nb != p) { depth[nb] = depth[v] + 1; stack.push(new int[]{nb, v}); }
        }
        for (int j = 1; j <= LOG; j++)
            for (int v = 0; v < n; v++) up[j][v] = up[j - 1][up[j - 1][v]];
    }

    int query(int u, int v) {
        if (depth[u] < depth[v]) { int t = u; u = v; v = t; }
        int diff = depth[u] - depth[v];
        for (int j = 0; j <= LOG; j++) if (((diff >> j) & 1) == 1) u = up[j][u];
        if (u == v) return u;
        for (int j = LOG; j >= 0; j--) {
            if (up[j][u] != up[j][v]) { u = up[j][u]; v = up[j][v]; }
        }
        return up[0][u];
    }
}
```

## code.cpp
```cpp
struct LCA {
    int LOG;
    vector<int> depth;
    vector<vector<int>> up;

    LCA(int n, vector<vector<int>>& adj, int root = 0) {
        LOG = max(1, (int)ceil(log2(max(n, 2))));
        depth.assign(n, 0);
        up.assign(LOG + 1, vector<int>(n, root));
        vector<pair<int,int>> stk = {{root, root}};
        while (!stk.empty()) {
            auto [v, p] = stk.back(); stk.pop_back();
            up[0][v] = p;
            for (int nb : adj[v]) if (nb != p) { depth[nb] = depth[v] + 1; stk.push_back({nb, v}); }
        }
        for (int j = 1; j <= LOG; j++)
            for (int v = 0; v < n; v++) up[j][v] = up[j - 1][up[j - 1][v]];
    }

    int query(int u, int v) {
        if (depth[u] < depth[v]) swap(u, v);
        int diff = depth[u] - depth[v];
        for (int j = 0; j <= LOG; j++) if ((diff >> j) & 1) u = up[j][u];
        if (u == v) return u;
        for (int j = LOG; j >= 0; j--)
            if (up[j][u] != up[j][v]) { u = up[j][u]; v = up[j][v]; }
        return up[0][u];
    }
};
```
