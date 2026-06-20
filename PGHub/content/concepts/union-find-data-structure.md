---
slug: union-find-data-structure
module: graphs-union-find
title: Union-Find (Disjoint Set Union)
subtitle: Track a partition of n items under merge and query operations in near-constant amortised time using path compression and union by rank.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Union-Find"
    url: "https://algs4.cs.princeton.edu/15uf/"
    type: book
  - title: "cp-algorithms — Disjoint Set Union"
    url: "https://cp-algorithms.com/data_structures/disjoint_set_union.html"
    type: blog
  - title: "TheAlgorithms/Python — Union Find"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/disjoint_set/disjoint_set.py"
    type: repo
status: published
---

## intro
Union-find (a.k.a. **disjoint set union**, DSU) maintains a partition of `n` elements into disjoint sets and supports two operations: `find(x)` returns a canonical representative of `x`'s set, and `union(x, y)` merges the two sets containing `x` and `y`. With **path compression** during `find` and **union by rank** (or size) during `union`, both operations run in `O(alpha(n))` amortised — effectively constant, since the inverse Ackermann function is less than 5 for every practical `n`.

## whyItMatters
- It is the engine behind **Kruskal's MST algorithm**, the canonical use case in algorithms courses.
- Connectivity queries in dynamic graphs ("are these two vertices in the same component?") reduce to one `find` per endpoint.
- It is the standard offline algorithm for **percolation simulations** and **image-region labelling** (connected-component analysis).
- Tarjan's offline LCA algorithm uses DSU during a DFS to answer ancestor queries in near-linear time.
- Cycle detection in an undirected graph is one DSU pass: an edge whose endpoints already share a root closes a cycle.

## intuition
Picture each set as a rooted tree where every node points at its parent and the root points at itself. The root is the set's representative. `find(x)` walks parent pointers until it reaches a self-loop — that's the root. `union(x, y)` finds both roots and attaches one root under the other, merging the two trees into one.

Two optimisations turn the naive implementation from `O(n)` per operation into near-`O(1)`:

- **Union by rank (or size)** — when merging, attach the *shorter* (smaller-rank) tree under the *taller* one. The tall tree's depth doesn't grow; the short tree's depth grows by at most one. After many unions the trees stay shallow — `O(log n)` deep without any extra work.
- **Path compression** — during `find`, point every node on the path directly at the root. The next `find` on those nodes is `O(1)`. There are several flavours: full compression (rewrite parents in a second pass), halving (`p[x] = p[p[x]]` per step), and splitting. All give the same asymptotic.

Together, the two tricks yield Tarjan's celebrated `O(m alpha(n))` bound for `m` operations on `n` elements. The proof is intricate (potential-function amortisation), but the takeaway is simple: in practice, every operation is constant time.

## visualization
Start with 6 isolated elements, then merge and query.

```
initial parents:   0  1  2  3  4  5
indices:           0  1  2  3  4  5

union(0,1) — both rank 0, attach 1 -> 0, raise 0's rank to 1
parents:           0  0  2  3  4  5    ranks: [1,0,0,0,0,0]

union(2,3):        0  0  2  2  4  5    ranks: [1,0,1,0,0,0]
union(4,5):        0  0  2  2  4  4    ranks: [1,0,1,0,1,0]

union(0,2) — both rank 1, attach 2 -> 0, raise 0's rank to 2
parents:           0  0  0  2  4  4    ranks: [2,0,1,0,1,0]

find(3) walk: 3 -> 2 -> 0 (root)
              path compression: 3.parent = 0, 2.parent = 0 (already)
parents after: 0  0  0  0  4  4

union(3,5) — find(3)=0 (rank 2), find(5)=4 (rank 1) — attach 4 -> 0
parents:           0  0  0  0  0  4    ranks: [2,0,1,0,1,0]
                                                ^^ root rank unchanged
final tree:
                       0
                  / | | |   \
                 1  2 3 4
                          \
                           5
```

## bruteForce
Without optimisations, attaching the new tree to the wrong root yields `O(n)`-depth trees. Then `find` is linear and a sequence of `m` operations on `n` elements costs `O(mn)` — quadratic where the optimised version is essentially linear.

## optimal
Iterative `find` with path halving + `union` by rank.

```python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.size = [1] * n           # optional, useful for component sizes

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path halving
            x = self.parent[x]
        return x

    def union(self, x, y) -> bool:
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False              # already same set
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        self.size[rx] += self.size[ry]
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
        return True

    def connected(self, x, y) -> bool:
        return self.find(x) == self.find(y)
```

**Union by size** is a drop-in alternative to rank — attach the smaller component under the larger and update the size. Equivalent asymptotics; size is sometimes more useful as a side product (e.g. "which is the largest component?"). Some problem variants require **DSU rollback** (no path compression, store a stack of changes) or **weighted DSU** (offset values for each node).

## complexity
- **Time**: `O(alpha(n))` amortised per operation; effectively constant.
- **Space**: `O(n)` — parent array, rank array, optional size array.
- **Number of operations**: a sequence of `m` operations on `n` items costs `O(m alpha(n))`.
- **No support for split / delete-element** — DSU only merges; structures like link-cut trees handle the general case.

## pitfalls
- **Forgetting union by rank.** A series of `union(0,1), union(0,2), union(0,3), ...` builds a linear chain; `find` becomes `O(n)`. Fix: always compare ranks and attach the shorter under the taller.
- **Recursive `find` blowing the stack.** On large inputs the path before compression can be long. Fix: write `find` iteratively with path halving.
- **Calling `union` without checking the return value.** Many algorithms (Kruskal's, cycle detection) need to know whether a merge actually happened. Fix: return a boolean and inspect it.
- **Mutating internal state during iteration over components.** Once you call `union`, parent pointers move; cached representatives go stale. Fix: re-run `find` whenever you need the current root.

## interviewTips
- Quote the `O(alpha(n))` complexity and immediately note it is constant in practice — interviewers expect both halves.
- Mention which optimisation does what: union-by-rank bounds tree height, path compression amortises future lookups.
- Bring up rollback / weighted variants when the interviewer pushes on "what if we need to undo?" or "what if edges have offsets?"

## code.python
```python
class DSU:
    def __init__(self, n):
        self.p = list(range(n)); self.r = [0]*n; self.size = [1]*n
    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]; x = self.p[x]
        return x
    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False
        if self.r[rx] < self.r[ry]: rx, ry = ry, rx
        self.p[ry] = rx; self.size[rx] += self.size[ry]
        if self.r[rx] == self.r[ry]: self.r[rx] += 1
        return True
```

## code.javascript
```javascript
class DSU {
  constructor(n) {
    this.p = Array.from({length: n}, (_, i) => i);
    this.r = new Array(n).fill(0);
    this.size = new Array(n).fill(1);
  }
  find(x) { while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; } return x; }
  union(x, y) {
    let rx = this.find(x), ry = this.find(y);
    if (rx === ry) return false;
    if (this.r[rx] < this.r[ry]) [rx, ry] = [ry, rx];
    this.p[ry] = rx; this.size[rx] += this.size[ry];
    if (this.r[rx] === this.r[ry]) this.r[rx]++;
    return true;
  }
}
```

## code.java
```java
public class DSU {
    int[] p, r, size;
    public DSU(int n) {
        p = new int[n]; r = new int[n]; size = new int[n];
        for (int i = 0; i < n; i++) { p[i] = i; size[i] = 1; }
    }
    public int find(int x) {
        while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }
        return x;
    }
    public boolean union(int x, int y) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return false;
        if (r[rx] < r[ry]) { int t = rx; rx = ry; ry = t; }
        p[ry] = rx; size[rx] += size[ry];
        if (r[rx] == r[ry]) r[rx]++;
        return true;
    }
}
```

## code.cpp
```cpp
struct DSU {
    vector<int> p, r, sz;
    DSU(int n) : p(n), r(n, 0), sz(n, 1) { iota(p.begin(), p.end(), 0); }
    int find(int x) { while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; } return x; }
    bool unite(int x, int y) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return false;
        if (r[rx] < r[ry]) swap(rx, ry);
        p[ry] = rx; sz[rx] += sz[ry];
        if (r[rx] == r[ry]) r[rx]++;
        return true;
    }
};
```
