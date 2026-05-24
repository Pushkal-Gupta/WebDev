---
slug: graph-redundant-connection
module: graphs
title: Redundant Connection
subtitle: Find the edge that turns a tree into a graph with one cycle — union-find catches it on insert.
difficulty: Intermediate
position: 19
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Disjoint Set Union — cp-algorithms"
    url: "https://cp-algorithms.com/data_structures/disjoint_set_union.html"
    type: blog
  - title: "Union-Find Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/introduction-to-disjoint-set-data-structure-or-union-find-algorithm/"
    type: blog
  - title: "KACTL — content/data-structures/UnionFind.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/data-structures/UnionFind.h"
    type: repo
status: published
---

## intro
You're given a graph built by starting with a tree on n nodes and adding exactly one extra edge — turning it into a graph with exactly one cycle. The task: find which edge to remove to recover a tree. If multiple answers exist, return the one that appears last in the input. Union-find solves it elegantly in a single pass.

## whyItMatters
This is the cleanest possible application of disjoint-set union: every tree edge merges two components, and exactly one edge connects two already-merged nodes. That edge is the redundant one. Mastering it locks in the union-find pattern for cycle detection — a primitive that powers Kruskal's MST, dynamic connectivity, and many graph-streaming problems.

## intuition
Adding an edge (u, v) to a forest is either a "merge" (u and v belong to different components — fine, the forest stays acyclic) or a "redundant connect" (u and v are already in the same component — adding this edge closes a cycle). Process edges in input order; the first edge that fails the merge test is the answer. Because the problem guarantees the input becomes a single tree plus one extra, this scan finds the unique culprit.

## visualization
Edges in order: (1,2), (1,3), (2,3). Start with components {1}, {2}, {3}.
- (1,2): merge → {1,2}, {3}. Acyclic.
- (1,3): merge → {1,2,3}. Acyclic.
- (2,3): find(2) == find(3) — already connected. This edge closes a cycle. Return (2,3).

## bruteForce
For each edge in reverse order, temporarily remove it and run DFS/BFS to check whether the rest of the graph is still connected and acyclic. If yes, return that edge. O(n × (n + m)) — acceptable for small n but wasteful, because union-find solves it in essentially O(n α(n)) with no special-casing for "last occurrence."

## optimal
Initialize DSU on n nodes (parent[i] = i). For each edge (u, v) in input order: if find(u) == find(v), return (u, v); otherwise union(u, v). Path compression on find and union by rank/size keeps each operation effectively O(α(n)) — inverse Ackermann, smaller than 5 for any practical input. The single redundant edge is found on its insertion attempt.

## complexity
time: O(n α(n))
space: O(n)
notes: α(n) is the inverse Ackermann function, effectively constant. The space is the parent + rank arrays. The scan stops as soon as the redundant edge is found, so worst case is when it's last in the list — still linear.

## pitfalls
- Forgetting path compression: legal but slow; under repeated finds it degrades to O(n) per operation.
- 0-indexed vs 1-indexed nodes — many input formats use 1..n; size the parent array as n+1 if so.
- Returning the wrong edge when multiple cycles exist: this particular problem statement guarantees exactly one extra edge, so the first failing union is *the* answer.
- Using union without rank/size — works but unbalanced trees can hurt the constant factor on large inputs.

## interviewTips
- State the union-find invariant explicitly: "Each edge either merges or closes a cycle; the closing edge is the answer."
- Mention path compression and union-by-rank by name even if you skip rank in code — interviewers note the awareness.
- If the follow-up is "edges form a directed tree with one extra edge (find redundant directed connection)," explain that you must also track in-degree and split into two sub-cases — but that's a different, harder problem.

## code.python
```python
def find_redundant_connection(edges):
    n = len(edges)
    parent = list(range(n + 1))
    rank = [0] * (n + 1)
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    def union(a, b):
        ra, rb = find(a), find(b)
        if ra == rb:
            return False
        if rank[ra] < rank[rb]:
            ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]:
            rank[ra] += 1
        return True
    for u, v in edges:
        if not union(u, v):
            return [u, v]
    return []
```

## code.javascript
```javascript
function findRedundantConnection(edges) {
  const n = edges.length;
  const parent = Array.from({ length: n + 1 }, (_, i) => i);
  const rank = new Array(n + 1).fill(0);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    let ra = find(a), rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    if (rank[ra] === rank[rb]) rank[ra]++;
    return true;
  };
  for (const [u, v] of edges) {
    if (!union(u, v)) return [u, v];
  }
  return [];
}
```

## code.java
```java
public int[] findRedundantConnection(int[][] edges) {
    int n = edges.length;
    int[] parent = new int[n + 1];
    int[] rank = new int[n + 1];
    for (int i = 0; i <= n; i++) parent[i] = i;
    for (int[] e : edges) {
        if (!union(parent, rank, e[0], e[1])) return e;
    }
    return new int[0];
}

private int find(int[] parent, int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
    }
    return x;
}

private boolean union(int[] parent, int[] rank, int a, int b) {
    int ra = find(parent, a), rb = find(parent, b);
    if (ra == rb) return false;
    if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
    parent[rb] = ra;
    if (rank[ra] == rank[rb]) rank[ra]++;
    return true;
}
```

## code.cpp
```cpp
int find(vector<int>& parent, int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
    }
    return x;
}

bool unite(vector<int>& parent, vector<int>& rnk, int a, int b) {
    int ra = find(parent, a), rb = find(parent, b);
    if (ra == rb) return false;
    if (rnk[ra] < rnk[rb]) swap(ra, rb);
    parent[rb] = ra;
    if (rnk[ra] == rnk[rb]) rnk[ra]++;
    return true;
}

vector<int> findRedundantConnection(vector<vector<int>>& edges) {
    int n = edges.size();
    vector<int> parent(n + 1), rnk(n + 1, 0);
    iota(parent.begin(), parent.end(), 0);
    for (auto& e : edges) {
        if (!unite(parent, rnk, e[0], e[1])) return e;
    }
    return {};
}
```
