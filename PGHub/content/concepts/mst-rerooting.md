---
slug: mst-rerooting
module: trees-advanced-queries
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
The mental model is that re-rooting a tree from a parent `p` to one of its children `c` only changes the *perspective*, not the underlying tree. Every node in `c`'s old subtree becomes one edge closer to the new root, and every node *outside* `c`'s subtree becomes one edge farther. If you know the answer at `p` and the size and contribution of `c`'s subtree, you can compute the answer at `c` with a single arithmetic adjustment — no DFS required.

Formally, decompose the answer at a node `v` as `f(v) = combine(down[v], up[v])` where `down[v]` is the contribution from the subtree hanging below `v` (with `v` chosen as the local root) and `up[v]` is the contribution from "everything else" — the part of the tree that sits above `v` once `v` is treated as a root. A first DFS rooted at node 0 fills in every `down[v]` bottom-up. A second DFS fills in every `up[v]` top-down using the parent's already-computed `up[parent]` plus `down[parent]` *minus the child's own contribution* to avoid double-counting.

The *why* before the *how*: a naive solution recomputes the entire tree statistic from each of `n` candidate roots, paying O(n) per root for O(n²) total. Rerooting exploits the fact that any two adjacent roots share `n - 1` of the same edges, so the answers differ by only a constant-cost adjustment determined by the single edge that flipped. Once you can express that adjustment in O(1), all `n` answers become a two-pass O(n) sweep.

Key invariant: after `dfs1`, `down[v]` is the answer when the tree is rooted at v and only the subtree of v is considered. After `dfs2`, the global answer at v is `combine(down[v], up[v])`. Analogy: imagine a wall lamp that lights up rooms — re-mounting it one foot to the left adjusts only the brightness in two specific rooms (the one you left and the one you entered), not in the whole house. Rerooting tracks exactly those two deltas as the root moves along an edge.

## visualization
```
Tree (path graph, n=5):  1 -- 2 -- 3 -- 4 -- 5

Metric: sum of distances from chosen root to every other node.

Phase 1 (root = 1):
  dist sum at 1 = 0+1+2+3+4 = 10
  subtree sizes (rooted at 1):
     size[1]=5  size[2]=4  size[3]=3  size[4]=2  size[5]=1
  down[v] = sum of distances within subtree(v):
     down[5]=0  down[4]=1  down[3]=3  down[2]=6  down[1]=10

Phase 2 (reroot from 1 to 2):
  Edge (1,2). When root moves 1 -> 2:
    nodes in subtree(2) [={2,3,4,5}, 4 nodes] each get 1 closer:  -4
    nodes outside subtree(2) [={1}, 1 node] each get 1 farther:    +1
  f(2) = f(1) - size[2] + (n - size[2]) = 10 - 4 + 1 = 7
  Verify directly: 1+0+1+2+3 = 7  ok.

Phase 2 (reroot from 2 to 3):
  Edge (2,3). subtree(3) under root 2 has 3 nodes {3,4,5}.
  f(3) = f(2) - size[3] + (n - size[3]) = 7 - 3 + 2 = 6
  Verify: 2+1+0+1+2 = 6  ok.

Continuing:
  f(4) = f(3) - 2 + 3 = 7
  f(5) = f(4) - 1 + 4 = 10

Final per-node answers:  [10, 7, 6, 7, 10]   (symmetric, as expected)
```

## bruteForce
Run a DFS from every node and aggregate the desired statistic. O(n) per DFS, n DFSes, O(n^2) total. Acceptable to n ~ 10^4; chokes on competitive-programming sizes of 10^5 or 10^6.

## optimal
The optimal solution performs two DFS passes after picking an arbitrary fixed root (commonly node 0). The first pass, `dfs1(v, parent)`, computes `size[v]` and `down[v]` in post-order: visit every child `c`, recursively fill `down[c]` and `size[c]`, then combine — for sum-of-distances the combine is `down[v] += down[c] + size[c]` and `size[v] += size[c]`. After `dfs1`, every subtree-local answer is known.

The second pass, `dfs2(v, parent)`, propagates the answer outward in pre-order. For each child `c` of `v`, compute `ans[c]` from `ans[v]` using a constant-time delta: in the sum-of-distances case the formula is `ans[c] = ans[v] - size[c] + (n - size[c])` because moving the root across edge `(v, c)` brings `size[c]` nodes one step closer and pushes `n - size[c]` nodes one step farther. Then recurse into `c`. `ans[root]` is initialised from `down[root]` because for the root the "above" contribution is empty.

Data structures: an adjacency list `g` (undirected, both directions stored), arrays `size`, `down`, `ans` of length `n`, and either explicit recursion or an iterative stack. Each edge is traversed a constant number of times across both DFS passes, yielding O(n) total time and O(n) auxiliary space (the recursion stack and the three arrays).

Key invariants and tradeoffs. The combine operation must be either invertible (sum, count, XOR) or capable of dropping a single contribution cheaply (top-2 trick for max/min) — otherwise you cannot remove `c`'s contribution from `down[v]` when computing `up[c]`. For max/min metrics, store the *two* largest child contributions at each node so that removing the maximum still leaves the second-largest available. The price of rerooting is more bookkeeping than a single DFS, but the payoff is dramatic: every per-root query answers in amortised O(1) after O(n) preprocessing, exactly matching the lower bound of "every node must be touched." For Python and other languages with small default recursion limits, convert both DFS passes to iterative form with an explicit stack to handle trees of size 10⁵ or larger.

## complexity
time: O(n) for both passes combined
space: O(n) for down[], up[], adjacency list, and recursion stack
notes: Convert the recursion to an explicit stack for n at or above 10^5 in languages with small default stacks (Python at 10^4, Java at ~10^4-10^5 depending on JVM).

## pitfalls
- **Non-invertible combine for max/min.** Subtracting a child's contribution requires the combine to be invertible; for max/min you cannot recover the second-best after removing the top. Fix: track the top *two* child contributions per node so that when you drop the child that contributed the maximum, the second-largest is immediately available.
- **Off-by-one between edge-weighted and node-weighted metrics.** Sum-of-distances counts edges; count-of-nodes counts nodes; mixing them produces an answer off by exactly `1` per edge. Fix: write down on paper which quantity each `combine` accumulates, then unit-test on a 2-node graph where the two interpretations differ by 1.
- **Deep recursion in Python / JS.** Python's default recursion limit is 1000; large trees blow the stack instantly. Fix: rewrite both DFS passes iteratively with an explicit stack (`(node, parent, iter_idx)` frames), or call `sys.setrecursionlimit(1 << 25)` and run inside a `threading.Thread(stack_size=...)` for one-shot scripts.
- **Skipping the parent on undirected adjacency.** Without `if u == p: continue` the DFS bounces back along the incoming edge and recurses on the parent. Fix: always filter `u == p` at the top of each neighbour loop in both DFS passes, and pass `-1` (or `None`) as the parent of the initial call.
- **Reusing global `size`/`down`/`ans` across calls.** Calling `sumOfDistances` twice without re-initialising the arrays leaks state from the previous call. Fix: allocate fresh arrays inside the public entry point, or expose a reset helper and call it first.

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
