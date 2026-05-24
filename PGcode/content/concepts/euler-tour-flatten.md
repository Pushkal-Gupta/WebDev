---
slug: euler-tour-flatten
module: trees
title: Euler Tour — Flatten Tree
subtitle: DFS in-times and out-times turn each subtree into a contiguous array range.
difficulty: Advanced
position: 2
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Euler Tour of Tree — cp-algorithms"
    url: "https://cp-algorithms.com/graph/euler_path.html"
    type: blog
  - title: "Euler Tour of a Tree — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/euler-tour-tree/"
    type: blog
  - title: "KACTL — LCA.h (Euler tour skeleton)"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/graph/LCA.h"
    type: repo
status: published
---

## intro
An Euler tour of a rooted tree is the sequence of nodes visited by a DFS, with entry (tin) and exit (tout) timestamps recorded. After the tour, the subtree of any node v occupies the contiguous index range [tin[v], tout[v]] inside a flat array — converting tree problems into array problems that any Fenwick or segment tree can handle.

## whyItMatters
Flattening turns "update all nodes in this subtree" or "sum the subtree's values" into "update a range" or "query a range" on an array. Combined with a segment tree or BIT, you get O(log n) subtree updates and queries — a foundational building block behind heavy-light decomposition, virtual trees, offline color/distance queries, and the small-to-large merging trick.

## intuition
Walk the tree depth-first. Stamp tin[v] when you enter v and tout[v] when you leave (after all children). Every descendant of v is entered after v and exited before v, so its tin lies in (tin[v], tout[v]]. That means the contiguous slice of the time-ordered traversal between tin[v] and tout[v] contains exactly v and its descendants — nothing more, nothing less. You've reduced a 2D tree to a 1D array without losing information about ancestry.

## visualization
Tree rooted at 1 with edges 1-2, 1-3, 2-4, 2-5. DFS in order of children: enter 1 → enter 2 → enter 4 → leave 4 → enter 5 → leave 5 → leave 2 → enter 3 → leave 3 → leave 1. Timestamps: tin = {1:0, 2:1, 4:2, 5:3, 3:4}, tout = {4:2, 5:3, 2:3, 3:4, 1:4}. The slice [tin[2], tout[2]] = [1, 3] covers nodes 2, 4, 5 — exactly the subtree of 2.

## bruteForce
For every subtree query, run a fresh DFS rooted at the queried node and aggregate the answer. O(n) per query; Q queries cost O(n*Q). Updates that touch every descendant are equally bad. For n = 10^5 and Q = 10^5 this is 10^10 ops — completely impractical. The brute version also recomputes ancestry data each query that the Euler tour caches once.

## optimal
Run one DFS recording tin[v] (when entered) and tout[v] (after the last child returns), plus a flat array values[tin[v]] = data[v]. Build a Fenwick tree or segment tree over values. Subtree-sum(v) = range_sum(tin[v], tout[v]). Point update on node v = update(tin[v]). Subtree update (add delta to every descendant of v) = range_update on [tin[v], tout[v]] using a difference-array Fenwick or lazy segment tree. Whole pipeline: O(n) preprocess, O(log n) per operation.

## complexity
time: O(n) flatten + O(log n) per query/update via BIT/segment tree
space: O(n) for tin/tout/flat array + structure overhead
notes: Use iterative DFS for n > ~10^4 in Python/JS to avoid stack overflow. Two conventions exist for tout: some authors store "time just after exit" (exclusive end), others store "time of last entry in subtree" (inclusive end). Pick one and stay consistent — most bugs come from mixing them.

## pitfalls
- Confusing tout exclusive vs inclusive — your range query bounds break silently.
- Recursive DFS on chains of 10^5 nodes overflows the default stack — iterate or raise the recursion limit.
- Storing data at index v instead of index tin[v] — the array order must match traversal order, not node id.
- Forgetting to reset the global timer between independent test cases; the second test's ranges overlap the first.
- Trying to use the same Euler array for path queries — that needs the doubled Euler tour (each node printed on entry and exit, length 2n - 1) feeding an RMQ, not the simple tin/tout array.

## interviewTips
- Lead with the mental model: "I'll flatten the tree so each subtree becomes a contiguous range, then a Fenwick tree handles queries."
- Mention the doubled tour variant when LCA comes up — it pairs Euler tour with sparse-table RMQ for O(1) LCA.
- If asked about path queries on the tree, escalate to heavy-light decomposition; Euler tour alone handles subtrees, not arbitrary paths.

## code.python
```python
def euler_flatten(n, adj, root=0):
    tin = [0] * n
    tout = [0] * n
    flat = [0] * n
    timer = 0
    stack = [(root, -1, 0)]
    while stack:
        v, p, state = stack.pop()
        if state == 0:
            tin[v] = timer
            flat[timer] = v
            timer += 1
            stack.append((v, p, 1))
            for nb in adj[v]:
                if nb != p:
                    stack.append((nb, v, 0))
        else:
            tout[v] = timer - 1
    return tin, tout, flat

def is_ancestor(u, v, tin, tout):
    return tin[u] <= tin[v] <= tout[u]
```

## code.javascript
```javascript
function eulerFlatten(n, adj, root = 0) {
  const tin = new Array(n).fill(0);
  const tout = new Array(n).fill(0);
  const flat = new Array(n).fill(0);
  let timer = 0;
  const stack = [[root, -1, 0]];
  while (stack.length) {
    const frame = stack.pop();
    const [v, p, state] = frame;
    if (state === 0) {
      tin[v] = timer;
      flat[timer] = v;
      timer++;
      stack.push([v, p, 1]);
      for (const nb of adj[v]) if (nb !== p) stack.push([nb, v, 0]);
    } else {
      tout[v] = timer - 1;
    }
  }
  return { tin, tout, flat };
}

function isAncestor(u, v, tin, tout) {
  return tin[u] <= tin[v] && tin[v] <= tout[u];
}
```

## code.java
```java
class EulerFlatten {
    int[] tin, tout, flat;

    EulerFlatten(int n, java.util.List<java.util.List<Integer>> adj, int root) {
        tin = new int[n]; tout = new int[n]; flat = new int[n];
        int timer = 0;
        java.util.Deque<int[]> stack = new java.util.ArrayDeque<>();
        stack.push(new int[]{root, -1, 0});
        while (!stack.isEmpty()) {
            int[] cur = stack.pop();
            int v = cur[0], p = cur[1], state = cur[2];
            if (state == 0) {
                tin[v] = timer;
                flat[timer++] = v;
                stack.push(new int[]{v, p, 1});
                for (int nb : adj.get(v)) if (nb != p) stack.push(new int[]{nb, v, 0});
            } else {
                tout[v] = timer - 1;
            }
        }
    }

    boolean isAncestor(int u, int v) {
        return tin[u] <= tin[v] && tin[v] <= tout[u];
    }
}
```

## code.cpp
```cpp
struct EulerFlatten {
    vector<int> tin, tout, flat;

    EulerFlatten(int n, vector<vector<int>>& adj, int root = 0)
        : tin(n), tout(n), flat(n) {
        int timer = 0;
        vector<tuple<int,int,int>> stk = {{root, -1, 0}};
        while (!stk.empty()) {
            auto [v, p, state] = stk.back(); stk.pop_back();
            if (state == 0) {
                tin[v] = timer;
                flat[timer++] = v;
                stk.push_back({v, p, 1});
                for (int nb : adj[v]) if (nb != p) stk.push_back({nb, v, 0});
            } else {
                tout[v] = timer - 1;
            }
        }
    }

    bool isAncestor(int u, int v) const {
        return tin[u] <= tin[v] && tin[v] <= tout[u];
    }
};
```
