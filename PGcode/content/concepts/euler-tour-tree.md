---
slug: euler-tour-tree
module: trees
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
Without Euler tour, "sum of values in v's subtree" is O(size_of_subtree) per query. With Euler tour + Fenwick tree, it's O(log n) per query AND O(log n) per point update. Same trick supports "is u an ancestor of v?" in O(1) (check `tin[u] ≤ tin[v]` and `tout[u] ≥ tout[v]`), LCA in O(1) (with Euler-tour + sparse table on depth), and many path-decomposition algorithms.

## intuition
DFS in pre-order. Increment a global clock on enter and on leave. Every node `v` owns a half-open range `[tin[v], tout[v]]` that includes every descendant. Want to update v's value? Point update at index `tin[v]`. Want subtree sum? Range sum `[tin[v], tout[v]]`.

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
**Build (one DFS, O(n))**:
```
clock = 0
tin = [0]*n
tout = [0]*n
order = [0]*n            # array indexed by tin to enable range access
stack = [(root, 0)]      # iterative to avoid recursion limits
while stack:
    v, i = stack.pop()
    if i == 0:
        tin[v] = clock
        order[clock] = v
        clock += 1
        for child in children[v]:
            stack.append((child, 0))
    tout[v] = clock - 1  # last index assigned to v's descendants
```

**Point update for node v** with new value `x`:
```
fenwick.update(tin[v], x)
```

**Subtree-sum query** at node v:
```
fenwick.range_sum(tin[v], tout[v])
```

**Ancestor check** `u is ancestor of v` (O(1)):
```
return tin[u] <= tin[v] and tout[u] >= tout[v]
```

For **path queries** (sum on path u → v), use LCA + add/subtract: sum(root→u) + sum(root→v) - 2·sum(root→lca). With Euler-tour + sparse table on depth, LCA is O(1) after O(n log n) preprocessing.

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
