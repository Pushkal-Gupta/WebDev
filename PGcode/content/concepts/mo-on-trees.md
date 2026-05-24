---
slug: mo-on-trees
module: graphs
title: Mo's Algorithm on Trees
subtitle: Euler tour plus Mo's sqrt-decomposition for offline path-aggregate queries in O((N+Q) sqrt N).
difficulty: Advanced
position: 2
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "CP-Algorithms — Mo's algorithm on a tree"
    url: "https://cp-algorithms.com/graph/mo_algorithm_on_tree.html"
    type: blog
  - title: "Princeton Algorithms — Graph processing"
    url: "https://algs4.cs.princeton.edu/40graphs/"
    type: book
  - title: "TheAlgorithms/Python — euler_tour.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/depth_first_search.py"
    type: repo
status: published
---

## intro
Mo's algorithm answers a batch of range queries on an array in O((N + Q) sqrt N) by sorting queries cleverly and shifting two pointers `L` and `R` incrementally. Mo's on trees lifts the technique from arrays to tree paths via an Euler tour that flattens the tree so that every path `(u, v)` maps to a specific subrange — with one boundary case handled by the lowest common ancestor (LCA). It is the standard offline tool for "count distinct values on a path" and similar aggregate queries.

## whyItMatters
Path queries on a tree are normally tackled with heavy-light decomposition, link-cut trees, or persistent segment trees — each powerful but conceptually heavier. When queries are aggregate (counts, mode, sum of squares of frequencies) and can be processed offline, Mo's on trees is much shorter to write and competitive on speed: a few hundred lines of code answer millions of path queries.

## intuition
Imagine walking the tree pre-order. Each node is entered and later exited, so each appears twice in the walk — call these positions `in[v]` and `out[v]`. The subtree of `v` is a contiguous range `[in[v], out[v]]`. For a path `(u, v)` with `in[u] ≤ in[v]`, two cases: if `u` is an ancestor of `v`, the path corresponds to `[in[u], in[v]]`. Otherwise the path is `[out[u], in[v]]` plus the LCA. The trick: a node appears twice in the range iff it lies in a subtree that the path crosses but the path itself does not include — toggling its presence on each occurrence (XOR) elegantly removes those nodes.

## visualization
Tree: 1 is root, children 2 and 3; 2 has children 4 and 5. Euler tour positions: enter 1, enter 2, enter 4, exit 4, enter 5, exit 5, exit 2, enter 3, exit 3, exit 1. Path (4, 5): `in[4]=2, in[5]=4`; LCA is 2. Use range `[in[4], in[5]] = [2..4]` since 4 is not an ancestor of 5; that range contains 4, 4 (exit), 5 — XOR-toggling drops 4 (appears twice), leaving {5}. Path also includes 4 and the LCA 2, added manually at query time.

## bruteForce
For each query walk the path explicitly, accumulating the aggregate. Worst-case path length is O(N), Q queries → O(NQ). For N = Q = 100,000 that is 10^10 operations — far beyond a second. Heavy-light decomposition + segment tree gets to O((N + Q) log² N) but is a big implementation and requires per-query state that often does not compose for "count distinct" types.

## optimal
Build the Euler tour with enter/exit positions. Precompute LCA via binary lifting in O(N log N). For each query (u, v): pick `[l, r]` per the case above and store an aux LCA. Sort queries by `(block_of_l, r)` with block size `sqrt(2N)`. Maintain a counter array `cnt[value]` and a running answer. To "add" or "remove" a position you toggle its visited bit; if toggling makes it visited, increment `cnt[val[pos]]` and update the answer; if it makes it unvisited, decrement and update. After settling the range, separately add the LCA contribution (and remove it after answering). The toggle pattern is what makes the Euler-tour mapping correct.

## complexity
time: O((N + Q) sqrt N · cost-per-add) with cost-per-add typically O(1)
space: O(N) for the tour, O(N log N) for binary-lifting LCA tables, O(Q) for sorted queries
notes: Block size sqrt(2N) is optimal; tune empirically because hidden constants from cache effects matter more than the asymptotic in practice.

## pitfalls
- Forgetting the LCA case — answers are subtly wrong only when one endpoint is the ancestor of the other.
- Toggling the visited flag without guarding the cnt update — easy off-by-one that destroys the count-distinct invariant.
- Choosing block size by guess; sqrt(2N) is the right starting point for path queries (length 2N).
- Mixing `in` and `out` indexes when partitioning — when u is not an ancestor of v, you need `out[u]` as the left, not `in[u]`.
- Using on online queries — Mo's is fundamentally offline because it reorders inputs.

## interviewTips
- Frame it as "Mo's on arrays + an Euler-tour trick." Interviewers familiar with Mo's instantly grasp the lift.
- Explain the XOR/visited toggle clearly — it is the part candidates fumble.
- Pair with binary-lifting LCA; mention you could swap for Tarjan offline LCA if you want O(N + Q) preprocessing.
- Be ready to discuss "Mo's with updates" (sqrt by three axes) if the problem allows point updates.

## code.python
```python
import sys
from math import isqrt

def mo_on_tree(n, adj, vals, queries):
    LOG = max(1, (n).bit_length())
    tour, in_, out_, depth, up = [], [0]*n, [0]*n, [0]*n, [[0]*n for _ in range(LOG)]
    timer = 0
    stack = [(0, -1, 0)]
    while stack:
        v, p, state = stack.pop()
        if state == 0:
            in_[v] = timer; tour.append(v); timer += 1
            up[0][v] = p if p >= 0 else v
            stack.append((v, p, 1))
            for w in adj[v]:
                if w != p:
                    depth[w] = depth[v] + 1
                    stack.append((w, v, 0))
        else:
            out_[v] = timer; tour.append(v); timer += 1

    for k in range(1, LOG):
        for v in range(n):
            up[k][v] = up[k-1][up[k-1][v]]

    def lca(u, v):
        if depth[u] < depth[v]: u, v = v, u
        diff = depth[u] - depth[v]
        for k in range(LOG):
            if (diff >> k) & 1: u = up[k][u]
        if u == v: return u
        for k in range(LOG-1, -1, -1):
            if up[k][u] != up[k][v]: u, v = up[k][u], up[k][v]
        return up[0][u]

    block = max(1, isqrt(len(tour)))
    Q = []
    for i, (u, v) in enumerate(queries):
        if in_[u] > in_[v]: u, v = v, u
        w = lca(u, v)
        if w == u: Q.append((in_[u], in_[v], -1, i))
        else: Q.append((out_[u], in_[v], w, i))
    Q.sort(key=lambda q: (q[0]//block, q[1]))

    cnt, visited, distinct = {}, [False]*n, 0
    ans = [0]*len(queries)
    def toggle(pos):
        nonlocal distinct
        node = tour[pos]
        if visited[node]:
            cnt[vals[node]] -= 1
            if cnt[vals[node]] == 0: distinct -= 1
        else:
            cnt[vals[node]] = cnt.get(vals[node], 0) + 1
            if cnt[vals[node]] == 1: distinct += 1
        visited[node] = not visited[node]

    L, R = 0, -1
    for l, r, w, idx in Q:
        while R < r: R += 1; toggle(R)
        while L > l: L -= 1; toggle(L)
        while R > r: toggle(R); R -= 1
        while L < l: toggle(L); L += 1
        if w != -1: toggle(in_[w])
        ans[idx] = distinct
        if w != -1: toggle(in_[w])
    return ans
```

## code.javascript
```javascript
export function moOnTree(n, adj, vals, queries) {
  const LOG = Math.max(1, Math.ceil(Math.log2(n + 1)));
  const tour = [], inT = new Int32Array(n), outT = new Int32Array(n), depth = new Int32Array(n);
  const up = Array.from({ length: LOG }, () => new Int32Array(n));
  let timer = 0;
  const stack = [[0, -1, 0]];
  while (stack.length) {
    const [v, p, state] = stack.pop();
    if (state === 0) {
      inT[v] = timer; tour.push(v); timer++;
      up[0][v] = p < 0 ? v : p;
      stack.push([v, p, 1]);
      for (const w of adj[v]) if (w !== p) { depth[w] = depth[v] + 1; stack.push([w, v, 0]); }
    } else { outT[v] = timer; tour.push(v); timer++; }
  }
  for (let k = 1; k < LOG; k++) for (let v = 0; v < n; v++) up[k][v] = up[k-1][up[k-1][v]];

  const lca = (u, v) => {
    if (depth[u] < depth[v]) [u, v] = [v, u];
    let diff = depth[u] - depth[v];
    for (let k = 0; k < LOG; k++) if ((diff >> k) & 1) u = up[k][u];
    if (u === v) return u;
    for (let k = LOG - 1; k >= 0; k--) if (up[k][u] !== up[k][v]) { u = up[k][u]; v = up[k][v]; }
    return up[0][u];
  };

  const block = Math.max(1, Math.floor(Math.sqrt(tour.length)));
  const Q = queries.map(([u, v], i) => {
    if (inT[u] > inT[v]) [u, v] = [v, u];
    const w = lca(u, v);
    return w === u ? [inT[u], inT[v], -1, i] : [outT[u], inT[v], w, i];
  }).sort((a, b) => (a[0]/block | 0) - (b[0]/block | 0) || a[1] - b[1]);

  const cnt = new Map(), visited = new Uint8Array(n), ans = new Array(queries.length);
  let distinct = 0;
  const toggle = (pos) => {
    const node = tour[pos], val = vals[node];
    if (visited[node]) { const c = cnt.get(val) - 1; cnt.set(val, c); if (c === 0) distinct--; }
    else { const c = (cnt.get(val) || 0) + 1; cnt.set(val, c); if (c === 1) distinct++; }
    visited[node] ^= 1;
  };

  let L = 0, R = -1;
  for (const [l, r, w, idx] of Q) {
    while (R < r) toggle(++R);
    while (L > l) toggle(--L);
    while (R > r) toggle(R--);
    while (L < l) toggle(L++);
    if (w !== -1) toggle(inT[w]);
    ans[idx] = distinct;
    if (w !== -1) toggle(inT[w]);
  }
  return ans;
}
```

## code.java
```java
public class MoOnTree {
    public int[] solve(int n, List<List<Integer>> adj, int[] vals, int[][] queries) {
        int LOG = Math.max(1, 32 - Integer.numberOfLeadingZeros(n));
        int[] tour = new int[2 * n], in_ = new int[n], out_ = new int[n], depth = new int[n];
        int[][] up = new int[LOG][n];
        int[] timer = {0};
        Deque<int[]> stack = new ArrayDeque<>();
        stack.push(new int[]{0, -1, 0});
        while (!stack.isEmpty()) {
            int[] f = stack.pop(); int v = f[0], p = f[1], s = f[2];
            if (s == 0) {
                in_[v] = timer[0]; tour[timer[0]++] = v;
                up[0][v] = p < 0 ? v : p;
                stack.push(new int[]{v, p, 1});
                for (int w : adj.get(v)) if (w != p) { depth[w] = depth[v] + 1; stack.push(new int[]{w, v, 0}); }
            } else { out_[v] = timer[0]; tour[timer[0]++] = v; }
        }
        for (int k = 1; k < LOG; k++) for (int v = 0; v < n; v++) up[k][v] = up[k-1][up[k-1][v]];
        // LCA, block sort, two-pointer toggle — same shape as Python; elided for brevity here.
        return new int[queries.length];
    }
}
```

## code.cpp
```cpp
struct MoOnTree {
    int n; std::vector<std::vector<int>> adj; std::vector<int> vals;
    std::vector<int> tour, in_, out_, depth;
    std::vector<std::vector<int>> up;
    int LOG;

    void build(int root = 0) {
        LOG = std::max(1, (int)std::ceil(std::log2(n + 1)));
        in_.assign(n, 0); out_.assign(n, 0); depth.assign(n, 0);
        up.assign(LOG, std::vector<int>(n, 0));
        tour.reserve(2 * n); int timer = 0;
        std::vector<std::tuple<int,int,int>> st; st.emplace_back(root, -1, 0);
        while (!st.empty()) {
            auto [v, p, state] = st.back(); st.pop_back();
            if (state == 0) {
                in_[v] = timer; tour.push_back(v); ++timer;
                up[0][v] = p < 0 ? v : p;
                st.emplace_back(v, p, 1);
                for (int w : adj[v]) if (w != p) { depth[w] = depth[v] + 1; st.emplace_back(w, v, 0); }
            } else { out_[v] = timer; tour.push_back(v); ++timer; }
        }
        for (int k = 1; k < LOG; ++k) for (int v = 0; v < n; ++v) up[k][v] = up[k-1][up[k-1][v]];
    }

    int lca(int u, int v) const {
        if (depth[u] < depth[v]) std::swap(u, v);
        int diff = depth[u] - depth[v];
        for (int k = 0; k < LOG; ++k) if ((diff >> k) & 1) u = up[k][u];
        if (u == v) return u;
        for (int k = LOG - 1; k >= 0; --k) if (up[k][u] != up[k][v]) { u = up[k][u]; v = up[k][v]; }
        return up[0][u];
    }
};
```
