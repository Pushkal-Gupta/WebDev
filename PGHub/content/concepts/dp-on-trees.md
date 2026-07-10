---
slug: dp-on-trees
module: trees-advanced-queries
title: DP on Trees
subtitle: Compute per-subtree aggregates in O(n) via a single post-order DFS — the workhorse for tree problems with optimal-substructure.
difficulty: Intermediate
position: 14
estimatedReadMinutes: 6
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
"DP on trees" means running dynamic programming with the tree's children as subproblems. A post-order DFS visits children before parents, so by the time you process a node, all its subtrees are solved. Most subtree-aggregate questions ("max independent set," "subtree sum," "longest path") fit in this pattern in O(n).

## whyItMatters
Tree DP is interview-frequent:
- **Largest independent set** in a tree (no two chosen nodes share an edge).
- **Tree diameter** (longest path between any two nodes).
- **Sum / max / count of paths** with various constraints.
- **Tree rerooting**: compute an answer for every possible root in O(n) total.

If you can phrase a problem as "for each node v, compute f(v) using f(children)," DP on trees is the right tool.

## intuition
Pick a root. For each leaf, the base case is trivial. For each internal node, combine the answers from its children. A post-order DFS naturally orders the recursion correctly.

Think of the tree as a nested set of sealed boxes: each subtree is a box, and a parent box contains its children boxes plus one loose item (the node itself). What's actually happening is that DFS opens the smallest boxes first, writes a short summary sticker on each one — "the best answer achievable using only what's inside me" — and passes those stickers up. A parent never re-inspects the contents of a child; it only reads the sticker. That is the whole reason the work is linear: each box is summarized exactly once, so the total effort equals the number of boxes, which is n.

Walk a concrete micro-example for largest independent set. Take a path 0-1-2 (0 is root, 1 its child, 2 the grandchild). Leaf 2 returns `(take=1, skip=0)`. Node 1 combines its only child: `take = 1 + skip(2) = 1`, `skip = max(take(2), skip(2)) = 1`. Node 0 combines child 1: `take = 1 + skip(1) = 1 + 1 = 2`, `skip = max(take(1), skip(1)) = max(1, 1) = 1`. The answer is `max(2, 1) = 2` — pick nodes 0 and 2, skipping the middle. Notice each node used only the two-number summary from its child, never re-descended. That is optimal substructure made physical.

For **tree rerooting**, you do TWO DFS passes: the first computes the subtree answer rooted at the conventional root; the second propagates the "rest of the tree" contribution down to each child, allowing answers for every node in O(n) total. The second pass reuses the parent's already-finished answer minus the current child's contribution, so no subtree is recomputed from scratch.

## visualization
```
Largest independent set in a tree (no two chosen nodes share an edge):

dp[v][0] = max IS in subtree of v when v is NOT chosen
dp[v][1] = max IS in subtree of v when v IS chosen

Recurrence (post-order):
  dp[v][0] = sum over children c of max(dp[c][0], dp[c][1])
  dp[v][1] = 1 + sum over children c of dp[c][0]

answer = max(dp[root][0], dp[root][1])
```

## bruteForce
For "max IS in tree," try all 2^n subsets — O(2^n · n). Useless beyond n = 25. Tree DP gives O(n).

## optimal
The optimal method is a single post-order DFS that returns a small fixed-size summary per node. Correctness rests on one invariant: when `dfs(v)` returns, the values it hands back describe the best answer achievable within v's subtree, and — critically — they were computed using only the completed answers of v's children. Because the recurrence for v depends on nothing outside v's subtree, the choices made lower down never need revisiting once summarized. That is the optimal-substructure property that DP requires, and the post-order visit order is exactly what guarantees every child summary is ready before the parent reads it.

The central tradeoff is state size versus generality. A richer per-node state (take/skip, two longest paths, a full capacity vector for knapsack-on-tree) captures more constraints but costs more memory and per-node work; the discipline is to keep the state just large enough that a parent can reconstruct its own answer from children summaries alone. If the parent would need to know internal structure of a child beyond its summary, the state is too thin.

**Subtree DP**:
```
def dfs(v, parent):
    take = 1
    skip = 0
    for child in adj[v]:
        if child == parent: continue
        c_take, c_skip = dfs(child, v)
        take += c_skip
        skip += max(c_take, c_skip)
    return take, skip

dfs(root, -1)
```

Step through the mechanism: `take` starts at 1 (v itself is chosen) and each child contributes its `skip` value, because choosing v forbids choosing an adjacent child. `skip` starts at 0 (v not chosen) and each child contributes `max(take, skip)` — with v free, each child independently picks its own better option. The two accumulations run in lockstep over the child loop, so the node finishes in time proportional to its number of children. Summed over the tree, that is one unit of work per edge, which is why the bound is O(n): each of the n-1 edges is traversed exactly once downward and once on return, and each node's summary is O(1) to assemble.

**Tree rerooting**:
1. DFS 1 (post-order): compute `down[v]` = the answer if v's subtree were the entire tree.
2. DFS 2 (pre-order from root): for each node v, compute `up[v]` = the contribution from outside v's subtree. Combine `down[v] + up[v]` for the full answer rooted at v.

```
# Diameter via tree DP
best_path = [0]
def dfs(v, parent):
    d1 = d2 = 0
    for c in adj[v]:
        if c == parent: continue
        d = dfs(c, v) + 1
        if d > d1: d2 = d1; d1 = d
        elif d > d2: d2 = d
    best_path[0] = max(best_path[0], d1 + d2)
    return d1
dfs(root, -1)
return best_path[0]
```

The diameter is the maximum sum of the two longest "going-down" paths at any single node.

## complexity
- **Time**: O(n) — each edge visited once during DFS.
- **Space**: O(n) for the recursion + DP arrays.
- **Tree rerooting**: O(n) total (two DFS passes).

## pitfalls
- **Forgetting to skip the parent**: in undirected adjacency lists, you'll otherwise revisit. Pass parent explicitly.
- **Recursion depth**: a tree of 10^6 nodes can be a linear chain. Iterate DFS for safety in production.
- **Heavy/light child distinction**: not the same as DSU-on-tree (that's a different optimization). DP-on-trees doesn't need it.
- **Tree rerooting bookkeeping**: easy to mix up "down" vs "up." Walk through n = 4 carefully on paper.

## interviewTips
- The trigger: "compute X for every subtree" or "find the longest path / largest selection in a tree."
- Walk through the **post-order DFS** before writing code — interviewers want to see you understand the recursion direction.
- For senior interviews, mention **rerooting** and **DSU-on-tree** as the next steps when "for every root v, compute X" or "for every node v, aggregate over subtree."
- Compare with **knapsack-on-tree** (tree DP with a capacity dimension), which boosts the state but stays linear in the tree structure.

## code.python
```python
import sys
sys.setrecursionlimit(10**6)

def diameter(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v); adj[v].append(u)
    best = [0]
    def dfs(v, parent):
        d1 = d2 = 0
        for c in adj[v]:
            if c == parent: continue
            d = dfs(c, v) + 1
            if d > d1: d2 = d1; d1 = d
            elif d > d2: d2 = d
        best[0] = max(best[0], d1 + d2)
        return d1
    dfs(0, -1)
    return best[0]

edges = [(0,1),(0,2),(1,3),(1,4),(2,5)]
print(diameter(6, edges))   # 4 (path 3 -> 1 -> 0 -> 2 -> 5)
```

## code.javascript
```javascript
function diameter(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  let best = 0;
  function dfs(v, parent) {
    let d1 = 0, d2 = 0;
    for (const c of adj[v]) if (c !== parent) {
      const d = dfs(c, v) + 1;
      if (d > d1) { d2 = d1; d1 = d; } else if (d > d2) d2 = d;
    }
    best = Math.max(best, d1 + d2);
    return d1;
  }
  dfs(0, -1);
  return best;
}
```

## code.java
```java
import java.util.*;
class TreeDiameter {
    List<List<Integer>> adj;
    int best;
    public int diameter(int n, int[][] edges) {
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        best = 0;
        dfs(0, -1);
        return best;
    }
    int dfs(int v, int parent) {
        int d1 = 0, d2 = 0;
        for (int c : adj.get(v)) if (c != parent) {
            int d = dfs(c, v) + 1;
            if (d > d1) { d2 = d1; d1 = d; } else if (d > d2) d2 = d;
        }
        best = Math.max(best, d1 + d2);
        return d1;
    }
}
```

## code.cpp
```cpp
#include <vector>
int treeDiameter(int n, std::vector<std::pair<int,int>>& edges) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : edges) { adj[u].push_back(v); adj[v].push_back(u); }
    int best = 0;
    std::function<int(int,int)> dfs = [&](int v, int parent) {
        int d1 = 0, d2 = 0;
        for (int c : adj[v]) if (c != parent) {
            int d = dfs(c, v) + 1;
            if (d > d1) { d2 = d1; d1 = d; } else if (d > d2) d2 = d;
        }
        best = std::max(best, d1 + d2);
        return d1;
    };
    dfs(0, -1);
    return best;
}
```
