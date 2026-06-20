---
slug: euler-tour-flatten
module: trees-advanced-queries
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
- **Competitive programming staple** behind heavy-light decomposition, virtual trees, centroid decomposition with bookkeeping, and offline color/distance queries (Mo's algorithm on trees).
- **Database B-tree variants and Nested Set Model** (Joe Celko's "Trees and Hierarchies in SQL") encode the same `tin`/`tout` pair as `lft`/`rgt` columns so a subtree query becomes a single range scan — heavily used in CMS and ACL systems before recursive CTEs became widespread.
- **File-system snapshot diffing** (ZFS, btrfs subvolume comparison) flatten directory subtrees via DFS preorder/postorder for range-based reconciliation.
- **Game scene-graph culling and 3D bounding-volume hierarchy traversal** reduce "all descendants of node v are in frustum?" to a flat-range check on a DFS-ordered array.
- The "doubled Euler tour" variant (each node logged on entry and exit, length 2n − 1) is the foundation of the Bender-Farach-Colton 2000 O(1) LCA-via-RMQ algorithm shipped in many production graph libraries.

## intuition
The technique exists because trees are fundamentally 2D structures (depth × sibling order) and most query/update operations on subtrees require touching every descendant — Θ(subtree size) per operation. That cost is unacceptable when subtrees are large and updates are frequent. The escape route is a coordinate transform: turn the 2D tree into a 1D array such that every subtree corresponds to a contiguous interval. Once you have that, a Fenwick tree or segment tree over the flat array handles subtree updates and queries in O(log n) regardless of subtree size.

The decisive observation is that a depth-first traversal visits every descendant of v after entering v and before exiting v — that's the recursive structure of DFS. Stamp `tin[v]` at the moment DFS enters v, and `tout[v]` at the moment DFS leaves v (after all children have been fully processed). Then every descendant w of v has `tin[v] < tin[w]` and `tout[w] ≤ tout[v]`; equivalently, `tin[w] ∈ [tin[v], tout[v]]`. The contiguous slice of the timestamp axis from `tin[v]` to `tout[v]` contains exactly v and its descendants — nothing more, nothing less.

This single property is the entire idea. Store node values in a flat array indexed by `tin`: `values[tin[v]] = data[v]`. Now subtree-sum(v) is `range_sum(tin[v], tout[v])` on that flat array; subtree-add(v, δ) is `range_add(tin[v], tout[v], δ)`. Lazy segment trees handle both in O(log n). The ancestry check `is_ancestor(u, v)` reduces to `tin[u] ≤ tin[v] ≤ tout[u]` — a single comparison.

Two conventions for `tout` exist in the wild: some authors store "time just after exit" (exclusive end), others "time of last entry in subtree" (inclusive end). Pick one and never mix — most Euler-tour bugs come from inconsistent conventions across the build and the query phase.

## visualization
Tree rooted at 1 with edges 1-2, 1-3, 2-4, 2-5. DFS in order of children: enter 1 → enter 2 → enter 4 → leave 4 → enter 5 → leave 5 → leave 2 → enter 3 → leave 3 → leave 1. Timestamps: tin = {1:0, 2:1, 4:2, 5:3, 3:4}, tout = {4:2, 5:3, 2:3, 3:4, 1:4}. The slice [tin[2], tout[2]] = [1, 3] covers nodes 2, 4, 5 — exactly the subtree of 2.

## bruteForce
For every subtree query, run a fresh DFS rooted at the queried node and aggregate the answer. O(n) per query; Q queries cost O(n*Q). Updates that touch every descendant are equally bad. For n = 10^5 and Q = 10^5 this is 10^10 ops — completely impractical. The brute version also recomputes ancestry data each query that the Euler tour caches once.

**Technique: iterative DFS with timestamp stamping + Fenwick or segment tree over the flat array.** O(n) preprocessing + O(log n) per query/update. Optimal because subtree-range-update is a 1D range operation on n cells and the lower bound for any data structure supporting both range update and range query is Ω(log n) per operation (Fredman-Saks 1989 lower bound on the cell-probe model).

```python
def euler_flatten(n, adj, root=0):
    tin  = [0] * n
    tout = [0] * n
    flat = [0] * n
    timer = 0
    stack = [(root, -1, 0)]                       # (node, parent, phase) — iterative DFS
    while stack:
        v, p, state = stack.pop()
        if state == 0:                            # entry phase
            tin[v]  = timer
            flat[timer] = v
            timer += 1
            stack.append((v, p, 1))               # push exit marker for after children
            for nb in adj[v]:
                if nb != p:
                    stack.append((nb, v, 0))
        else:                                      # exit phase
            tout[v] = timer - 1

    return tin, tout, flat

def is_ancestor(u, v, tin, tout):
    return tin[u] <= tin[v] <= tout[u]            # O(1) ancestry check
```

Key lines: `stack.append((v, p, 1))` is the iterative-DFS trick for emulating the recursive entry/exit hooks — push the exit marker before pushing children so the marker pops after all children are processed. `tout[v] = timer - 1` uses the inclusive convention: `tout[v]` equals the largest timestamp among v's descendants. `is_ancestor` reduces ancestry to one comparison because the contiguous-range property guarantees descendants have `tin` strictly inside `[tin[v], tout[v]]`.

To support subtree-sum and subtree-add, layer a Fenwick or lazy segment tree over `flat`:

```python
# subtree_sum(v) = tree.range_sum(tin[v], tout[v])
# subtree_add(v, delta) = tree.range_add(tin[v], tout[v], delta)
# point_update_on_node(v, new_val) = tree.set(tin[v], new_val)
```

**Why iterative DFS?** Recursive DFS hits Python's default 1000-frame limit on trees with >10⁴ nodes; Java and C++ have similar stack-size limits. **Why not segment tree on (node-id, value)?** Direct indexing by node id doesn't give contiguous subtrees, so range queries don't map. The whole purpose of `tin`/`tout` is to *create* that contiguity. **For path queries** (not subtree queries), Euler tour alone is insufficient — escalate to heavy-light decomposition, which combines Euler-tour-like flattening with path chains. **For LCA queries**, use the doubled Euler tour (length 2n − 1) with a sparse-table RMQ for O(n log n) preprocessing and O(1) per query (Bender-Farach-Colton 2000).

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
