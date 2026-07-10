---
slug: weighted-union-find
module: graphs-union-find
title: Weighted Union-Find
subtitle: Track "relative offset" between elements while merging — answer "is x at offset d from y in their component?"
difficulty: Advanced
position: 7
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Part VI: Graph Algorithms (walkccc notes)"
    url: "https://walkccc.me/CLRS/"
    type: book
  - title: "cp-algorithms — Graph algorithms"
    url: "https://cp-algorithms.com/graph/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — graphs/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/graphs"
    type: repo
status: published
---

## intro
A normal union-find tells you "are x and y in the same component?". A **weighted union-find** also tracks each element's offset (or "rank," "weight") relative to its component's root. You can ask "what's the difference between x and y, given they're in the same component?" — useful for expression-equality problems, currency conversions, etc.

## whyItMatters
Comes up directly when:
- **Equations like x - y = c** are given as input; ask "are these consistent? what's z - w?"
- **Currency conversion graphs**: nodes are currencies, edges are exchange rates. After several rates are added, ask any conversion in O(α(n)).
- **Reasoning about offsets** in interval-merge problems.
- **Detecting bipartite-ness** in undirected graphs (offsets in Z/2Z).

The extra state is one integer per node; the asymptotic is the same O(α(n)) as plain DSU.

## intuition
Picture each component as a hanging mobile: the root floats at some unknown "height," and every other node hangs a fixed vertical distance below it. You never learn the absolute height of anyone — but because every node's distance to the root is pinned down, the distance between ANY two nodes in the same mobile is just the difference of their two drops. That is the whole idea: absolute values are unknowable, but relative offsets compose.

Standard DSU's `find(x)` returns the root of x. We extend it to ALSO track the offset of x from that root. `parent[x]` = parent node; `weight[x]` = `value(x) - value(parent[x])`, the drop from x to its immediate parent. To get x's total offset from the root, you sum the drops along the path. Path compression carries that offset along: when you flatten the path so every node points straight at the root, each `weight[x]` is rewritten to the full accumulated sum, so future `find`s are O(1) and still correct.

Concrete micro-example. Say the real (secret) values are `value(a)=10`, `value(b)=7`, `value(c)=5`. We are never told these — only relationships. Call `union(a, b, 3)` meaning `a - b = 3`: a becomes root, b hangs 3 below it, so `weight[b] = -3` (since `value(b) - value(a) = -3`). Now `union(b, c, 2)` meaning `b - c = 2`: b's root is a, c is its own root, so we hang c under a with `weight[c] = weight[b] - weight[c_old] - 2 = -3 - 0 - 2 = -5`. Ask `diff(a, c)`: both share root a, answer is `weight[a] - weight[c] = 0 - (-5) = 5`, exactly `10 - 5`. The secret absolute values dropped out; only the offsets mattered.

For `union(x, y, diff)` ("set value(x) - value(y) = diff"):
1. Find roots rx, ry. If same, check consistency (`weight[x] - weight[y] == diff`).
2. Otherwise, link `ry = rx` with offset `weight[x] - weight[y] - diff`.

## visualization
```
We want: x - y = 3, y - z = 2, x - z = ?

Start: each node is its own root, weight = 0.

union(x, y, 3):
  rx = x, ry = y. Link y under x with weight = 0 - 0 - 3 = -3.
  Now value(y) - value(x) = -3 ↔ value(x) - value(y) = 3. ✓

union(y, z, 2):
  ry = x (since y's root is x), rz = z. Link z under x.
  weight[y] = -3, weight[z] = 0. weight(z) becomes -3 - 0 - 2 = -5.
  So value(z) - value(x) = -5 ↔ value(x) - value(z) = 5.

find(x).weight - find(z).weight = 0 - (-5) = 5. → x - z = 5. ✓
```

## bruteForce
Store equations as edges; BFS/DFS to answer each query. O(V + E) per query. Useless for many queries.

## optimal
The invariant that makes everything work: **for every non-root node, `weight[x]` always equals `value(x) - value(parent[x])`, and the sum of weights along the path from x to its root equals `value(x) - value(root)`.** Keep that true through both operations and correctness is automatic.

Why the union formula is right. When linking `ry` under `rx`, we want the sum from y up to the new root rx to encode `value(y) - value(rx)`. We already know `weight[x] = value(x) - value(rx)` and `weight[y] = value(y) - value(ry)` after the two `find`s compress their paths. The caller asserts `value(x) - value(y) = diff`. Solving for the single edge we are adding, `weight[ry] = value(ry) - value(rx) = weight[x] - weight[y] - diff`. That is exactly line 97. If instead `rx == ry`, no edge is added; we only verify the already-implied relationship `weight[x] - weight[y] == diff`, which is the consistency check that catches contradictory input.

Why `find` stays correct under compression. Walking up, we collect the path `[x, ..., last-before-root]`, then replay it from the top down. Processing a node whose parent has ALREADY been re-pointed to the root, `weight[node] += weight[parent]` telescopes the two drops into one total drop to the root before we set `parent[node] = root`. Doing it top-down (reversed path) is essential — each node folds in its parent's already-finalized offset.

Step-by-step on `diff(0, 2)` after `union(0,1,3)`, `union(1,2,2)`: `find(0)=0`, `find(2)` compresses 2 straight to root 0 with `weight[2] = -5`, roots match, return `weight[0] - weight[2] = 0 - (-5) = 5`. Complexity intuition: every `find` touches only the nodes on one root-path, and compression plus union-by-rank keeps those paths near-flat, so the amortized cost is the inverse-Ackermann `O(α(n))` — under 5 for any input that fits in memory.

```
class WeightedDSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.weight = [0] * n     # weight[x] = value(x) - value(parent[x])
        self.rank = [0] * n

    def find(self, x):
        # Iterative find with path compression and weight accumulation.
        root = x
        path = []
        while self.parent[root] != root:
            path.append(root)
            root = self.parent[root]
        # Now flatten and accumulate.
        for node in reversed(path):
            par = self.parent[node]
            self.weight[node] += self.weight[par]
            self.parent[node] = root
        return root

    def value_of(self, x):
        self.find(x)
        return self.weight[x]   # value(x) - value(root)

    def union(self, x, y, diff):
        """Set value(x) - value(y) = diff."""
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return self.weight[x] - self.weight[y] == diff
        # Link ry under rx with weight set so the equation holds.
        self.parent[ry] = rx
        self.weight[ry] = self.weight[x] - self.weight[y] - diff
        return True

    def diff(self, x, y):
        """If x and y are in the same component, return value(x) - value(y); else None."""
        if self.find(x) != self.find(y): return None
        return self.weight[x] - self.weight[y]
```

For **bipartiteness** in an undirected graph, set diff = 1 for each edge and work in Z/2Z. Inconsistency on union = graph is NOT bipartite.

## complexity
- **Time**: O(α(n)) per union / find — effectively O(1).
- **Space**: O(n) for parent + weight + rank.
- **Code length**: ~40 LOC. Manageable but tricky to get right.

## pitfalls
- **Path compression weight accumulation**: easy to forget the recursive add. Walk through n = 5 by hand.
- **Iterative vs recursive find**: recursion is cleaner but stack-unfriendly for n = 10^6.
- **Equality check on same root**: when union(x, y, d) is called and they're already in the same component, you must verify the existing relationship matches d. Mixing this up gives wrong answers on consistency-check problems.
- **Integer overflow**: weights can accumulate; use int64 for safety.

## interviewTips
- The trigger: "given relative equations between items, determine consistency / specific values."
- Walk through find()'s path compression carrying weights — interviewers want to see this is tricky.
- Mention the **bipartiteness** application (diff in Z/2Z) — a classic problem reduces to weighted DSU.
- Compare with **plain union-find** (no offsets, just connectivity) and **link-cut trees** (dynamic with edge deletion).

## code.python
```python
class WeightedDSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.weight = [0]*n
    def find(self, x):
        path = []
        while self.parent[x] != x:
            path.append(x); x = self.parent[x]
        for node in reversed(path):
            self.weight[node] += self.weight[self.parent[node]]
            self.parent[node] = x
        return x
    def union(self, x, y, diff):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return self.weight[x] - self.weight[y] == diff
        self.parent[ry] = rx
        self.weight[ry] = self.weight[x] - self.weight[y] - diff
        return True
    def diff(self, x, y):
        if self.find(x) != self.find(y): return None
        return self.weight[x] - self.weight[y]

dsu = WeightedDSU(5)
dsu.union(0, 1, 3)   # x0 - x1 = 3
dsu.union(1, 2, 2)   # x1 - x2 = 2
print(dsu.diff(0, 2))   # 5
```

## code.javascript
```javascript
class WeightedDSU {
  constructor(n) { this.parent = [...Array(n).keys()]; this.weight = new Array(n).fill(0); }
  find(x) {
    const path = [];
    while (this.parent[x] !== x) { path.push(x); x = this.parent[x]; }
    for (let i = path.length - 1; i >= 0; i--) {
      const node = path[i];
      this.weight[node] += this.weight[this.parent[node]];
      this.parent[node] = x;
    }
    return x;
  }
  union(x, y, diff) {
    const rx = this.find(x), ry = this.find(y);
    if (rx === ry) return this.weight[x] - this.weight[y] === diff;
    this.parent[ry] = rx;
    this.weight[ry] = this.weight[x] - this.weight[y] - diff;
    return true;
  }
  diff(x, y) {
    if (this.find(x) !== this.find(y)) return null;
    return this.weight[x] - this.weight[y];
  }
}
```

## code.java
```java
class WeightedDSU {
    int[] parent;
    long[] weight;
    public WeightedDSU(int n) {
        parent = new int[n]; weight = new long[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    public int find(int x) {
        java.util.Deque<Integer> path = new java.util.ArrayDeque<>();
        while (parent[x] != x) { path.push(x); x = parent[x]; }
        while (!path.isEmpty()) {
            int node = path.pop();
            weight[node] += weight[parent[node]];
            parent[node] = x;
        }
        return x;
    }
    public boolean union(int x, int y, long diff) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return weight[x] - weight[y] == diff;
        parent[ry] = rx;
        weight[ry] = weight[x] - weight[y] - diff;
        return true;
    }
}
```

## code.cpp
```cpp
#include <vector>
struct WeightedDSU {
    std::vector<int> parent;
    std::vector<long long> weight;
    WeightedDSU(int n) : parent(n), weight(n, 0) {
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int x) {
        std::vector<int> path;
        while (parent[x] != x) { path.push_back(x); x = parent[x]; }
        for (auto it = path.rbegin(); it != path.rend(); ++it) {
            weight[*it] += weight[parent[*it]];
            parent[*it] = x;
        }
        return x;
    }
    bool unite(int x, int y, long long diff) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return weight[x] - weight[y] == diff;
        parent[ry] = rx;
        weight[ry] = weight[x] - weight[y] - diff;
        return true;
    }
};
```
