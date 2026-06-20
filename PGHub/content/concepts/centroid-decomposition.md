---
slug: centroid-decomposition
module: trees-advanced-queries
title: Centroid Decomposition
subtitle: Recursive divide-and-conquer on trees — every path is captured at exactly one "centroid level," enabling O(n log n) path-counting problems.
difficulty: Advanced
position: 15
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
**Centroid decomposition** recursively splits a tree around its centroid (the node whose removal leaves no subtree larger than n/2). Result: a balanced "centroid tree" of depth O(log n). Any path in the original tree is captured at EXACTLY ONE centroid — the highest centroid in the centroid tree that lies on the path. This lets you solve hard path-counting / path-distance problems in **O(n log n)** instead of O(n²).

## whyItMatters
Used in:
- **Count paths with sum = k** on a weighted tree.
- **Count paths with length ≤ L**.
- **For each pair (u, v), aggregate some function f(dist(u, v))**.
- Codeforces / IOI / ICPC tree problems where naive O(n²) all-pairs is too slow.

The trick is that any path crosses exactly one "level" in the centroid tree — so summing contributions across levels covers every path exactly once.

## intuition
1. Find the centroid c of the tree.
2. Process all paths that pass through c (contribution to whatever you're counting).
3. Remove c. The tree splits into ≤ k connected components, each at most half the original size.
4. Recurse on each component.

Total work: at each level, every node belongs to one component, and there are O(log n) levels → O(n log n) total.

Finding centroid is O(n) per call: compute subtree sizes, pick the root that minimizes max-subtree-size after removal.

## visualization
```
Tree (8 nodes, edges drawn):
        1
       /|\
      2 3 4
     /|   |
    5 6   7
    |
    8

Centroid: node 1 or 2 (both balance the tree well; pick 2).
Removing 2 splits into: {5,8} (size 2), {6} (size 1), {1, 3, 4, 7} (size 4).

Level 0: centroid = 2
Level 1: centroids of each piece — let's say 5 (for {5,8}), 6 (for {6}), 1 (for {1,3,4,7}).
Level 2: centroids of further pieces.

Centroid tree: 2 root, children {5, 6, 1}. 1 has children {3, 4} (each its own subtree). Etc.

Path 8 → 7 in original tree visits: 8, 5, 2, 1, 4, 7.
In centroid tree, this path is "captured" at centroid 2 (the highest centroid that lies on the path).
```

## bruteForce
**O(n²) all-pairs path computation**: BFS from every node. Works for n ≤ 5000. Too slow for n = 10^5.

## optimal
```
def centroid_decompose(adj, processed):
    # Recursively decompose the un-processed part of the tree.
    if all_processed(): return

    root = any_unprocessed_node()
    n_nodes = compute_subtree_size(root)
    centroid = find_centroid(root, n_nodes // 2)

    # Process all paths through centroid:
    process_centroid_contribution(centroid)

    processed[centroid] = True

    # Recurse on each subtree.
    for neighbor in adj[centroid]:
        if not processed[neighbor]:
            centroid_decompose_subtree(neighbor)

def find_centroid(root, threshold):
    # Walk down toward the largest subtree until all subtrees ≤ threshold.
    while True:
        # Find child with largest subtree (ignoring already-processed).
        ...
        if max_subtree_size <= threshold: return current
        current = child_with_max_subtree
```

**Path counting example** (count paths with sum = K):
```
process_centroid(c):
    # For each subtree of c, compute distances from c to all nodes.
    # Use a hashmap counting prefix sums encountered so far.
    counter = {0: 1}    # the path "c itself"
    for subtree in subtrees_of(c):
        # Two passes: first count paths to existing counter (avoid double-count within same subtree).
        for d in distances_in_subtree:
            answer += counter.get(K - d, 0)
        for d in distances_in_subtree:
            counter[d] += 1
    # Result accumulated; paths through c are now counted exactly once.
```

## complexity
- **Build (centroid decomposition)**: O(n log n) — finding each centroid is O(subtree-size); total work across levels is O(n) per level × O(log n) levels.
- **Path query / count**: depends on the per-centroid processing function.
- **Memory**: O(n log n) if you cache distances; O(n) with careful streaming.

## pitfalls
- **Forgetting the "remove from active set" step**: re-processing already-decomposed nodes leads to infinite recursion or wrong counts.
- **Two-pass to avoid intra-subtree double-counting**: classic mistake is single-pass which counts paths within the same subtree twice.
- **Finding centroid**: O(n) per call — don't re-find from scratch every recursion. Track subtree sizes carefully.
- **Recursive stack**: depth O(log n) but each recursive frame does O(n) work — Python's recursion is fine here, but iterative is faster for n > 10^5.
- **Confusing with HLD**: HLD partitions edges into chains (linear); centroid decomp builds a balanced tree of centroids. Different shapes, different uses.

## interviewTips
- For "count paths with property X on a tree" → centroid decomposition.
- For "static path query between u and v" → HLD or LCA+binary-lifting (simpler).
- Walk through the two-pass trick to handle intra-subtree double-counting.
- For senior interviews, mention **link-cut trees** for the dynamic version.

## code.python
```python
import sys
sys.setrecursionlimit(10**6)

def centroid_decompose(adj):
    n = len(adj)
    processed = [False]*n
    size = [0]*n

    def compute_size(u, p):
        size[u] = 1
        for v in adj[u]:
            if v != p and not processed[v]:
                compute_size(v, u)
                size[u] += size[v]

    def find_centroid(u, p, tree_size):
        for v in adj[u]:
            if v != p and not processed[v] and size[v] > tree_size // 2:
                return find_centroid(v, u, tree_size)
        return u

    def decompose(u):
        compute_size(u, -1)
        c = find_centroid(u, -1, size[u])
        # process paths through c here
        processed[c] = True
        for v in adj[c]:
            if not processed[v]:
                decompose(v)

    decompose(0)
```

## code.javascript
```javascript
// Same shape. Use iterative DFS for large trees (Node.js recursion limit ~10k).
function centroidDecompose(adj) {
  const n = adj.length;
  const processed = new Uint8Array(n);
  const size = new Int32Array(n);
  // ... same algorithm
}
```

## code.java
```java
// Use int[] arrays for size + processed flags. ArrayDeque for iterative DFS.
class CentroidDecomp {
    int[] size; boolean[] processed; List<List<Integer>> adj;
    // ...
}
```

## code.cpp
```cpp
#include <vector>
class CentroidDecomp {
    std::vector<std::vector<int>>& adj;
    std::vector<int> size;
    std::vector<bool> processed;
    // ... standard implementation
};
```
