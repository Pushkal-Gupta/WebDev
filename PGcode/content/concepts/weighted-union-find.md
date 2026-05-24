---
slug: weighted-union-find
module: graphs
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
Standard DSU's `find(x)` returns the root of x. We extend it to ALSO return the offset of x from that root. `parent[x]` = parent node; `weight[x]` = `value(x) - value(parent[x])`. Path compression carries the offset along: when you flatten the path, sum weights along the way.

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
