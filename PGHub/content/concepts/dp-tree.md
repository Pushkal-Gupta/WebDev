---
slug: dp-tree
module: dp-classical
title: Tree DP
subtitle: Subtree-based recurrences for problems like largest independent set and longest path.
difficulty: Advanced
position: 35
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 15: Dynamic Programming"
    url: "https://walkccc.me/CLRS/Chap15/15.1/"
    type: book
  - title: "Tree DP — cp-algorithms"
    url: "https://cp-algorithms.com/graph/tree_painting.html"
    type: blog
  - title: "KACTL — graph/Centroid.h and tree utilities"
    url: "https://github.com/kth-competitive-programming/kactl/tree/main/content/graph"
    type: repo
status: published
---

## intro
Tree DP is dynamic programming where states are indexed by nodes of a rooted tree, and each node's answer is a deterministic function of its children's answers. Because a tree has no cycles, a single post-order DFS resolves dependencies in topological order — every child finishes before its parent begins.

## whyItMatters
- LLVM's instruction selector uses tree DP (BURG-style tree pattern matching) to pick optimal machine instructions for expression trees during code generation.
- Linux kernel cgroup hierarchies and Kubernetes resource quota trees aggregate child quotas into parents using subtree DP recurrences.
- Bayesian network inference (used in Stan, PyMC, and Pearl's original tree-belief-propagation algorithm) is tree DP on the junction tree.
- Decision-tree pruning in scikit-learn and XGBoost uses subtree DP to decide which internal nodes to collapse based on aggregate loss.
- Tree diameter, largest independent set, vertex cover, tree knapsack — every "max/min/count over a rooted tree" question collapses to a few lines once you spot the recurrence, and rerooting DP extends the technique to "answer at every node in O(n) total."

## intuition
A tree has a property that arrays and graphs do not: pick any root and the remaining structure decomposes into disjoint subtrees that share no nodes. Disjointness is the magic — it means any quantity defined on a subtree can be combined with a sibling's quantity by simple aggregation (sum, max, knapsack merge) without double counting. The cycle-free structure also guarantees a topological order: post-order DFS visits every child before its parent, so the recurrence `dp[u] = f(dp[c1], dp[c2], ...)` is always evaluated after its inputs are ready. Compare this to general DP on graphs, where cycles force you to either compute fixed points iteratively or break cycles with SCC decomposition. With trees you get a single DFS and you are done. The state design follows a recipe: identify what choice each node makes, add a small extra dimension to record that choice, and aggregate children accordingly. For independent set, the choice is "include u or not," so `dp[u][0]` and `dp[u][1]` track both possibilities. For tree knapsack, the extra dimension records "how much capacity is used in u's subtree." For tree diameter, the extra information is "what is the deepest path going down from u," combined with sibling depths at each node to update a global best. The deep insight is that tree DP is just regular DP where the dependency DAG happens to be a tree — which makes the recurrence both easier to write and faster to evaluate than the general case.

## optimal
One post-order DFS, O(n) time for plain aggregations. Visit each child, recursively compute its dp value, then merge into the parent. For tree-knapsack variants the merge cost is O(size_u * size_v), but a "small-to-large" argument bounds the total merge work at O(n * k) for k-dimensional states (or O(n^2) in the worst case). For "answer the question rooted at every node," a rerooting DP does a second DFS that re-pushes the parent's contribution down, keeping total work at O(n).

```python
import sys
sys.setrecursionlimit(1 << 25)                  # default 1000 overflows on 10^5 chains

def largest_independent_set(n, adj):
    dp = [[0, 0] for _ in range(n)]             # dp[u][0]=skip u, dp[u][1]=pick u
    def dfs(u, parent):
        dp[u][1] = 1                            # picking u contributes 1
        for v in adj[u]:
            if v == parent:                     # tree-as-undirected guard
                continue
            dfs(v, u)
            dp[u][0] += max(dp[v][0], dp[v][1]) # if u is skipped, child is free
            dp[u][1] += dp[v][0]                # if u is picked, child must be skipped
    dfs(0, -1)
    return max(dp[0])
```

The two-dimensional state is the canonical pattern — extend it with more entries for more decisions. The `parent` argument is the trick that lets you treat the tree as undirected without infinite recursion. Convert to iterative DFS when n exceeds 10^5 to avoid stack overflow even with raised recursion limits.

## visualization
Take the largest independent set (no two chosen nodes share an edge). For each u track dp[u][0] = best when u is not picked, dp[u][1] = best when u is picked. Leaves: dp[u][0]=0, dp[u][1]=1. Internal u: dp[u][1] = 1 + sum of dp[c][0] over children, dp[u][0] = sum of max(dp[c][0], dp[c][1]). Walk a 5-node star with root r and leaves a,b,c,d: leaves give (0,1); root picks 1+0+0+0+0=1 or skips and takes 1+1+1+1=4 — answer 4.

## bruteForce
Try every subset of nodes, check independence, keep the largest. 2^n subsets times O(n) per validity check is O(n * 2^n) — fine up to n around 20, useless beyond. For longest path you might run BFS from every node (O(n^2)). Both ignore the fact that subtree answers are reusable.

## complexity
time: O(n) for plain aggregations; O(n^2) or O(n * k) for knapsack-on-tree variants
space: O(n) for the dp table plus O(h) recursion stack — convert to iterative DFS for skewed trees with n up to 10^5.
notes: Rerooting adds a second O(n) pass for "answer if each node were root."

## pitfalls
- Recursing with Python's default 1000-stack limit on a 10^5 chain — set sys.setrecursionlimit or write an iterative DFS.
- Forgetting that the merge order matters when both dimensions store "best including" and "best excluding" — propagate both up.
- Treating the tree as undirected and re-visiting the parent — pass parent as a DFS argument and skip it.
- Confusing diameter (longest path between any two nodes) with depth (longest root-to-leaf) — diameter at u = top two depths of u's children + 2.

## interviewTips
- Always state the recurrence in plain English before coding: "best for subtree of u when u is taken vs not."
- Mention that a single post-order DFS suffices because of the tree's acyclic structure.
- If asked for "answer over all roots," bring up rerooting and the O(n) cost.
- Practice three canonical problems: tree diameter, largest independent set, and tree knapsack — they cover 80 percent of variants.

## code.python
```python
import sys
sys.setrecursionlimit(1 << 25)

def largest_independent_set(n, adj):
    dp = [[0, 0] for _ in range(n)]
    def dfs(u, parent):
        dp[u][1] = 1
        for v in adj[u]:
            if v == parent:
                continue
            dfs(v, u)
            dp[u][0] += max(dp[v][0], dp[v][1])
            dp[u][1] += dp[v][0]
    dfs(0, -1)
    return max(dp[0])

def tree_diameter(n, adj):
    best = [0]
    def dfs(u, parent):
        top1 = top2 = 0
        for v in adj[u]:
            if v == parent:
                continue
            d = dfs(v, u) + 1
            if d > top1:
                top2, top1 = top1, d
            elif d > top2:
                top2 = d
        best[0] = max(best[0], top1 + top2)
        return top1
    dfs(0, -1)
    return best[0]
```

## code.javascript
```javascript
function largestIndependentSet(n, adj) {
  const dp = Array.from({ length: n }, () => [0, 0]);
  const dfs = (u, parent) => {
    dp[u][1] = 1;
    for (const v of adj[u]) {
      if (v === parent) continue;
      dfs(v, u);
      dp[u][0] += Math.max(dp[v][0], dp[v][1]);
      dp[u][1] += dp[v][0];
    }
  };
  dfs(0, -1);
  return Math.max(dp[0][0], dp[0][1]);
}

function treeDiameter(n, adj) {
  let best = 0;
  const dfs = (u, parent) => {
    let top1 = 0, top2 = 0;
    for (const v of adj[u]) {
      if (v === parent) continue;
      const d = dfs(v, u) + 1;
      if (d > top1) { top2 = top1; top1 = d; }
      else if (d > top2) { top2 = d; }
    }
    best = Math.max(best, top1 + top2);
    return top1;
  };
  dfs(0, -1);
  return best;
}
```

## code.java
```java
int[][] dp;
List<List<Integer>> adj;
int diameterBest;

void dfsLIS(int u, int parent) {
    dp[u][1] = 1;
    for (int v : adj.get(u)) {
        if (v == parent) continue;
        dfsLIS(v, u);
        dp[u][0] += Math.max(dp[v][0], dp[v][1]);
        dp[u][1] += dp[v][0];
    }
}

int dfsDiameter(int u, int parent) {
    int top1 = 0, top2 = 0;
    for (int v : adj.get(u)) {
        if (v == parent) continue;
        int d = dfsDiameter(v, u) + 1;
        if (d > top1) { top2 = top1; top1 = d; }
        else if (d > top2) { top2 = d; }
    }
    diameterBest = Math.max(diameterBest, top1 + top2);
    return top1;
}
```

## code.cpp
```cpp
vector<vector<int>> adj;
vector<array<int,2>> dp;
int diameterBest = 0;

void dfsLIS(int u, int parent) {
    dp[u][1] = 1;
    for (int v : adj[u]) {
        if (v == parent) continue;
        dfsLIS(v, u);
        dp[u][0] += max(dp[v][0], dp[v][1]);
        dp[u][1] += dp[v][0];
    }
}

int dfsDiameter(int u, int parent) {
    int top1 = 0, top2 = 0;
    for (int v : adj[u]) {
        if (v == parent) continue;
        int d = dfsDiameter(v, u) + 1;
        if (d > top1) { top2 = top1; top1 = d; }
        else if (d > top2) top2 = d;
    }
    diameterBest = max(diameterBest, top1 + top2);
    return top1;
}
```
