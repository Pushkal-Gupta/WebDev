---
slug: mst-rerooting
module: trees
title: Rerooting DP
subtitle: Compute a per-node tree DP answer for every node as the root in total O(n).
difficulty: Advanced
position: 1
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Rerooting Technique — cp-algorithms (DP on trees)"
    url: "https://cp-algorithms.com/graph/tree_dp.html"
    type: blog
  - title: "DP on Trees — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dynamic-programming-on-trees-set-2/"
    type: blog
  - title: "TheAlgorithms/Python — graph DFS utilities"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/depth_first_search.py"
    type: repo
status: published
---

## intro
Many tree problems ask for an answer "rooted at node v" — sum of distances to all other nodes, max depth, count of nodes within distance k, weighted path sum. Computing each from scratch is O(n^2). Rerooting DP gets all n answers in O(n) total: one bottom-up pass to compute the answer rooted at node 0, then one top-down pass that "moves the root" from a parent to each child by adjusting the precomputed values in O(1) per edge.

## whyItMatters
Rerooting turns "answer at every root" from a quadratic blow-up into a single linear pipeline. It is the standard tool for tree problems like sum-of-distances-in-tree, finding the centroid by minimum-max-subtree-size, computing per-node tree diameter, and anything where a global tree statistic must be reported for each candidate root.

## intuition
Think of the rooted answer at node v as f(v) = combine(v, children subtree contributions). When you re-root from a parent p to a child c, the only thing that changes is which side of the edge (p, c) belongs to whom: c's old "subtree below" becomes p's "subtree above," and p's everything-except-c becomes c's "subtree above." Knowing f(p) and the contribution of c's subtree to f(p), you can subtract and add in O(1) to get f(c).

## visualization
Path graph 1 - 2 - 3 - 4 - 5. Sum of distances rooted at 1: 0 + 1 + 2 + 3 + 4 = 10. To reroot to 2: subtree of 2 (rooted at 1) had 4 nodes contributing 1+2+3+4 = 10; the "other side" (just node 1) had 1 node. Move root → the 4 nodes get one closer (subtract 4), the 1 node gets one farther (add 1). New sum at 2 = 10 - 4 + 1 = 7. Verify: 1 + 0 + 1 + 2 + 3 = 7.

## bruteForce
Run a DFS from every node and aggregate the desired statistic. O(n) per DFS, n DFSes, O(n^2) total. Acceptable to n ~ 10^4; chokes on competitive-programming sizes of 10^5 or 10^6.

## optimal
Two passes after a single rooting at node 0. (1) `dfs1(v, parent)` computes `down[v]` = the answer for the subtree rooted at v, by combining children's `down[child]` values. (2) `dfs2(v, parent)` propagates the answer to each child c: `up[c]` (contribution from "above c," which is everything in v's view except c's subtree) is computed from `up[v]` and `down[v]` minus c's contribution. The final per-node answer is `combine(down[v], up[v])`. Each edge is visited a constant number of times → O(n).

## complexity
time: O(n) for both passes combined
space: O(n) for down[], up[], adjacency list, and recursion stack
notes: Convert the recursion to an explicit stack for n at or above 10^5 in languages with small default stacks (Python at 10^4, Java at ~10^4-10^5 depending on JVM).

## pitfalls
- Subtracting a child's contribution to compute the "minus this child" version requires the combine operation to have an inverse (sum, count). For max/min you need to keep top-2 values, not just top-1, so you can drop one and report the other.
- Off-by-one on edge counts when the metric weights nodes vs edges differently (e.g., sum of distances counts edges, count of nodes counts nodes).
- Using deep recursion in Python; rewrite as iterative DFS with an explicit stack or raise the limit.
- Passing the parent pointer wrong on undirected adjacency lists — always filter `neighbor != parent` in the recursion.

## interviewTips
- Name-drop the pattern: "This is rerooting DP — bottom-up subtree pass, top-down propagation pass, O(n) total."
- Sketch the down[] / up[] split on the whiteboard before coding; it makes the O(n) cost obvious.
- For max/min combine, mention the top-2 trick — interviewers ask this as a follow-up to test whether you understand the inverse requirement.
- Mention "this is how LeetCode 834 (sum of distances in tree) is solved" — concrete reference helps.

## code.python
```python
import sys
sys.setrecursionlimit(1 << 25)

def sum_of_distances(n: int, edges):
    g = [[] for _ in range(n)]
    for a, b in edges:
        g[a].append(b); g[b].append(a)
    size = [1] * n
    ans = [0] * n

    def dfs1(v, p):
        for u in g[v]:
            if u == p: continue
            dfs1(u, v)
            size[v] += size[u]
            ans[v] += ans[u] + size[u]
    dfs1(0, -1)

    def dfs2(v, p):
        for u in g[v]:
            if u == p: continue
            ans[u] = ans[v] - size[u] + (n - size[u])
            dfs2(u, v)
    dfs2(0, -1)
    return ans
```

## code.javascript
```javascript
function sumOfDistances(n, edges) {
  const g = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { g[a].push(b); g[b].push(a); }
  const size = new Array(n).fill(1);
  const ans = new Array(n).fill(0);

  function dfs1(v, p) {
    for (const u of g[v]) {
      if (u === p) continue;
      dfs1(u, v);
      size[v] += size[u];
      ans[v] += ans[u] + size[u];
    }
  }
  function dfs2(v, p) {
    for (const u of g[v]) {
      if (u === p) continue;
      ans[u] = ans[v] - size[u] + (n - size[u]);
      dfs2(u, v);
    }
  }
  dfs1(0, -1);
  dfs2(0, -1);
  return ans;
}
```

## code.java
```java
int[] sizeArr;
long[] ans;
java.util.List<java.util.List<Integer>> g;
int N;

void dfs1(int v, int p) {
    for (int u : g.get(v)) {
        if (u == p) continue;
        dfs1(u, v);
        sizeArr[v] += sizeArr[u];
        ans[v] += ans[u] + sizeArr[u];
    }
}

void dfs2(int v, int p) {
    for (int u : g.get(v)) {
        if (u == p) continue;
        ans[u] = ans[v] - sizeArr[u] + (N - sizeArr[u]);
        dfs2(u, v);
    }
}

public long[] sumOfDistances(int n, int[][] edges) {
    N = n;
    g = new java.util.ArrayList<>();
    for (int i = 0; i < n; i++) g.add(new java.util.ArrayList<>());
    for (int[] e : edges) { g.get(e[0]).add(e[1]); g.get(e[1]).add(e[0]); }
    sizeArr = new int[n]; java.util.Arrays.fill(sizeArr, 1);
    ans = new long[n];
    dfs1(0, -1);
    dfs2(0, -1);
    return ans;
}
```

## code.cpp
```cpp
vector<vector<int>> g;
vector<int> sz;
vector<long long> ans;
int N;

void dfs1(int v, int p) {
    for (int u : g[v]) {
        if (u == p) continue;
        dfs1(u, v);
        sz[v] += sz[u];
        ans[v] += ans[u] + sz[u];
    }
}

void dfs2(int v, int p) {
    for (int u : g[v]) {
        if (u == p) continue;
        ans[u] = ans[v] - sz[u] + (N - sz[u]);
        dfs2(u, v);
    }
}

vector<long long> sumOfDistances(int n, vector<pair<int,int>>& edges) {
    N = n;
    g.assign(n, {});
    sz.assign(n, 1);
    ans.assign(n, 0);
    for (auto [a, b] : edges) { g[a].push_back(b); g[b].push_back(a); }
    dfs1(0, -1);
    dfs2(0, -1);
    return ans;
}
```
