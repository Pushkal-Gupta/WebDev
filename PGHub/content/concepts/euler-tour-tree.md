---
slug: euler-tour-tree
module: trees-advanced-queries
title: Euler Tour on Trees
subtitle: Flatten a tree into an array so subtree queries become range queries — combine with a Fenwick or segment tree.
difficulty: Advanced
position: 22
estimatedReadMinutes: 7
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
The Euler tour technique linearizes a rooted tree. DFS the tree; record the time you **enter** each node (`tin[v]`) and the time you **leave** it (`tout[v]`). The result: every subtree of node v corresponds to the contiguous index range `[tin[v], tout[v]]` in the tour. Now any subtree query is a *range* query — and you can use Fenwick trees, segment trees, or sparse tables to answer them.

## whyItMatters
Without an Euler tour, "sum of values in `v`'s subtree" is `O(size_of_subtree)` per query. With Euler tour plus a Fenwick tree, it is `O(log n)` per query *and* `O(log n)` per point update. The same trick supports "is `u` an ancestor of `v`?" in `O(1)` (check `tin[u] <= tin[v]` and `tout[u] >= tout[v]`), LCA in `O(1)` with Euler tour plus sparse-table RMQ on the depth array (Bender & Farach-Colton 2000), and many heavy-light decomposition algorithms. Competitive-programming codebases at ICPC level, judges like Codeforces and CSES, and production tree-analytics workloads (Linux process trees, version-control commit graphs, CDN cache hierarchies) all use Euler tour as the workhorse linearization technique that turns tree queries into range queries.

## intuition
DFS the tree in pre-order. Maintain a global clock. On entry to a node, stamp `tin[v]` and increment the clock. On exit from a node (after all children are visited), stamp `tout[v]`. Every node `v` now owns a half-open range `[tin[v], tout[v]]` that includes exactly the indices stamped for `v` and its descendants — by definition of DFS, you only return from `v` after visiting every descendant.

That single observation collapses every subtree query to a range query on a flat array of length `n`. Build an `order[]` array where `order[tin[v]] = v` (the linear order of pre-order visits). Point update on node `v` becomes a point update at index `tin[v]` in `order`. Subtree sum on `v` becomes a range sum `[tin[v], tout[v]]`. Subtree max, count of marked descendants, frequency of a value — all become range queries on `order` and are answered in `O(log n)` with a Fenwick tree or segment tree.

The ancestor check is the cleanest application. If `tin[u] <= tin[v] <= tout[u]`, then `v` was discovered after `u` entered and before `u` exited — which means `v` is in `u`'s subtree, i.e. `u` is an ancestor of `v`. Pure constant time after the one-time `O(n)` DFS. Pair this with a depth array and Bender-Farach-Colton's RMQ trick for `O(1)` LCA queries.

## visualization
```
Tree:           tin/tout:                  Euler indices (in-order):
       1            tin[1]=0, tout[1]=11        [0..11] = whole tree
     / | \
    2  3  4         tin[2]=1, tout[2]=4         [1..4] = subtree of 2
   /|     |\
  5 6     7 8       tin[5]=2, tout[5]=3         leaf — singleton range
                    tin[6]=5, tout[6]=6
                    tin[3]=7, tout[3]=8
                    tin[4]=9, tout[4]=11
                    tin[7]=10, tout[7]=10
                    tin[8]=12, tout[8]=13       (depends on tour variant)
```

## bruteForce
For each subtree query, BFS/DFS from v and visit every descendant. O(n) per query, O(n·q) total. Dies at n = 10^5, q = 10^5.

## optimal
One DFS in `O(n)`. Maintain `tin[v]`, `tout[v]`, and `order[]`. Use an iterative DFS with an explicit stack to handle very deep trees without hitting recursion limits. For subtree-sum queries, place a Fenwick tree over the `order` indexing and translate every node operation into the appropriate `tin`-indexed range.

```python
def euler_tour(tree, root, n):
    tin = [0] * n
    tout = [0] * n
    order = [0] * n
    clock = 0
    stack = [(root, iter(tree[root]), -1)]
    tin[root] = clock; order[clock] = root; clock += 1
    while stack:
        v, it, parent = stack[-1]
        nxt = next(it, None)
        if nxt is None:
            tout[v] = clock - 1
            stack.pop()
        elif nxt != parent:
            tin[nxt] = clock; order[clock] = nxt; clock += 1
            stack.append((nxt, iter(tree[nxt]), v))
    return tin, tout, order

class SubtreeSum:
    def __init__(self, values, tin, tout, order):
        self.tin, self.tout = tin, tout
        n = len(values)
        self.bit = [0] * (n + 1)
        for i, v in enumerate(order):
            self._update(i, values[v])
    def _update(self, i, delta):
        i += 1
        while i < len(self.bit):
            self.bit[i] += delta; i += i & -i
    def _prefix(self, i):
        s = 0; i += 1
        while i > 0:
            s += self.bit[i]; i -= i & -i
        return s
    def update(self, v, new_val, old_val):
        self._update(self.tin[v], new_val - old_val)
    def subtree_sum(self, v):
        return self._prefix(self.tout[v]) - self._prefix(self.tin[v] - 1)
```

The critical line is `subtree_sum(v) = prefix(tout[v]) - prefix(tin[v] - 1)` — the range query on the flat `order` array corresponds exactly to the subtree of `v` because Euler tour groups every descendant's index between `tin[v]` and `tout[v]`. The iterative DFS in `euler_tour` is necessary for trees deeper than Python's default recursion limit (1000). For path queries (sum from root to `v`), use a separate "open/close" Euler tour that pushes `+v` on entry and `-v` on exit; the prefix sum at `tin[v]` is then the sum of values from the root to `v`. For dynamic trees with edge insertions and deletions, switch to Euler-tour trees backed by balanced BSTs (Henzinger-King 1995), used in dynamic connectivity algorithms.

## complexity
- **Preprocessing**: O(n).
- **Point update**: O(log n) with Fenwick or segment tree.
- **Subtree query**: O(log n).
- **Ancestor check**: O(1).
- **LCA query**: O(1) with sparse-table augmentation, O(log n) with binary lifting alone.

## pitfalls
- **Variant differences**: some Euler tours record an entry on each visit (including return) yielding 2n-1 array entries. Others record only entries (n entries). Pick the variant matching the query type — subtree queries want the simpler `tin`/`tout` pair.
- **Off-by-one on `tout`**: half-open vs inclusive ranges trip people up. Be consistent.
- **Recursion stack overflow**: at n = 10^6 your default stack blows. Use iterative DFS or raise the limit.
- **Forgetting to deduplicate parent edges**: undirected adjacency lists need a "don't revisit parent" check.

## interviewTips
- The trigger: "many queries about subtrees / paths in a rooted tree" — Euler tour + Fenwick/segment tree.
- Mention the **ancestor O(1) check** as a free lunch — interviewers love that.
- For LCA on trees, compare with **binary lifting** (separate concept) — Euler-tour + RMQ gives O(1) query, binary lifting gives O(log n) with simpler code.
- Combine with **HLD (Heavy-Light Decomposition)** for very senior tree-path questions.

## code.python
```python
import sys
sys.setrecursionlimit(10**6)

def euler_tour(n, adj, root=0):
    tin = [0]*n; tout = [0]*n
    clock = [0]
    def dfs(v, p):
        tin[v] = clock[0]; clock[0] += 1
        for nb in adj[v]:
            if nb != p: dfs(nb, v)
        tout[v] = clock[0] - 1
    dfs(root, -1)
    return tin, tout

# Fenwick + Euler tour: subtree sum + point update.
class Fenwick:
    def __init__(self, n): self.n, self.b = n, [0]*(n+1)
    def update(self, i, v):
        i += 1
        while i <= self.n: self.b[i] += v; i += i & -i
    def prefix(self, i):
        s = 0; i += 1
        while i > 0: s += self.b[i]; i -= i & -i
        return s
    def range(self, l, r): return self.prefix(r) - (self.prefix(l-1) if l else 0)

# Usage: build adj, call euler_tour, init Fenwick(n), update(tin[v]), query range(tin[v], tout[v]).
```

## code.javascript
```javascript
function eulerTour(n, adj, root = 0) {
  const tin = new Int32Array(n), tout = new Int32Array(n);
  let clock = 0;
  const stack = [[root, -1, 0]];
  while (stack.length) {
    const top = stack[stack.length - 1];
    const [v, p, i] = top;
    if (i === 0) { tin[v] = clock++; }
    let pushed = false;
    while (top[2] < adj[v].length) {
      const nb = adj[v][top[2]++];
      if (nb !== p) { stack.push([nb, v, 0]); pushed = true; break; }
    }
    if (!pushed) { tout[v] = clock - 1; stack.pop(); }
  }
  return { tin, tout };
}
```

## code.java
```java
import java.util.*;
class EulerTour {
    int[] tin, tout;
    int clock = 0;
    void run(int n, List<List<Integer>> adj, int root) {
        tin = new int[n]; tout = new int[n];
        Deque<int[]> stk = new ArrayDeque<>();
        stk.push(new int[]{ root, -1, 0 });
        while (!stk.isEmpty()) {
            int[] top = stk.peek();
            int v = top[0], p = top[1];
            if (top[2] == 0) tin[v] = clock++;
            boolean pushed = false;
            while (top[2] < adj.get(v).size()) {
                int nb = adj.get(v).get(top[2]++);
                if (nb != p) { stk.push(new int[]{ nb, v, 0 }); pushed = true; break; }
            }
            if (!pushed) { tout[v] = clock - 1; stk.pop(); }
        }
    }
}
```

## code.cpp
```cpp
#include <vector>
struct EulerTour {
    std::vector<int> tin, tout;
    int clock = 0;
    void run(int n, const std::vector<std::vector<int>>& adj, int root = 0) {
        tin.assign(n, 0); tout.assign(n, 0);
        std::vector<std::tuple<int,int,int>> stk;
        stk.push_back({ root, -1, 0 });
        while (!stk.empty()) {
            auto& [v, p, i] = stk.back();
            if (i == 0) tin[v] = clock++;
            bool pushed = false;
            while (i < (int)adj[v].size()) {
                int nb = adj[v][i++];
                if (nb != p) { stk.push_back({ nb, v, 0 }); pushed = true; break; }
            }
            if (!pushed) { tout[v] = clock - 1; stk.pop_back(); }
        }
    }
};
```
