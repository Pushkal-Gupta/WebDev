---
slug: binary-lifting-general
module: trees
title: Binary Lifting (Sparse Ancestor Tables)
subtitle: Precompute 2^k-th ancestor of every node in O(n log n) to answer "k-th ancestor" / LCA / path-aggregates in O(log n).
difficulty: Advanced
position: 28
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
**Binary lifting** precomputes a sparse table `up[k][v]` = the 2^k-th ancestor of node v. After O(n log n) preprocessing, you can answer:
- **"k-th ancestor of v"** in O(log k) by decomposing k in binary and jumping by powers of two.
- **Lowest Common Ancestor** in O(log n) (see [[lca-binary-lifting]]).
- **Aggregates along a path** (max / min / xor) by storing the aggregate alongside each `up[k][v]`.

The same trick works on **any rooted structure** where you have a `parent` function — directed graphs, functional graphs (each node has exactly one outgoing edge), even iteration of a function.

## whyItMatters
LCA is the canonical use, but binary lifting also solves:
- **Tree path max/min/sum** in O(log n) per query.
- **k-th step in a functional graph** (e.g., "where do I land after pressing this button k times?").
- **Maze / portal puzzles** with one-step transitions.
- **Permutation-cycle navigation**: compute `perm^k(x)` in O(log k).

Whenever you have "follow this pointer k times" and k can be huge, binary lifting collapses it from O(k) to O(log k).

## intuition
Any integer k decomposes into a sum of distinct powers of 2 (its binary representation). To jump k steps from v, jump by each set bit of k: 2^k_0, 2^k_1, ... To precompute, observe that `up[k][v] = up[k-1][ up[k-1][v] ]` — the 2^k-th ancestor is the 2^(k-1)-th ancestor of the 2^(k-1)-th ancestor.

## visualization
```
Tree (rooted at 0):
        0
       /|\
      1 2 3
     /|   |\
    4 5   6 7

parent (= up[0]): [0, 0, 0, 0, 1, 1, 3, 3]
                  ↑
                  0 has self-loop as a sentinel

up[1][v] = up[0][ up[0][v] ]:
v:        0  1  2  3  4  5  6  7
up[1]:    0  0  0  0  0  0  0  0    (everyone's grandparent is root)

up[2][v]: still root.

Find 3rd ancestor of 4:
  3 = 011₂. Take 2^0 jump (up[0][4]=1), then 2^1 jump (up[1][1]=0).
  Result: 0.
```

## bruteForce
Walk up `k` steps one at a time: O(k) per query. For k = 10^18, useless. Binary lifting gives O(log k).

## optimal
**Preprocessing**:
```
LOG = ceil(log2(n))
up = [[root] * n for _ in range(LOG)]
# Base case: up[0][v] = parent[v]
for v in range(n): up[0][v] = parent[v]
# Recurrence
for k in range(1, LOG):
    for v in range(n):
        up[k][v] = up[k-1][up[k-1][v]]
```

**k-th ancestor query**:
```
def kth_ancestor(v, k):
    bit = 0
    while k > 0:
        if k & 1: v = up[bit][v]
        k >>= 1; bit += 1
    return v
```

**Path aggregate** (e.g., max value on the path from v to its k-th ancestor): store `max_up[k][v]` alongside `up[k][v]`. Update during the same recurrence. Query by combining the maxes during the jump.

## complexity
- **Preprocessing**: O(n log n) time and space.
- **k-th ancestor query**: O(log k).
- **Memory**: O(n log n) ints. For n = 10^5 and log n = 17, that's ~1.7M entries.

## pitfalls
- **Sentinel for "no ancestor"**: use the root pointing to itself (`up[0][root] = root`). Avoids null-checks at every step.
- **LOG too small**: pick `LOG = ceil(log2(n_max)) + 1`.
- **Mixing 0-indexed and 1-indexed**: pick one convention.
- **For functional graphs with cycles**: binary lifting still works but the "ancestor chain" enters a cycle. Detect cycles separately and mod the index.
- **Confusing with Euler-tour + sparse table**: that's a different LCA technique (O(1) query, O(n log n) prep, simpler theory, messier code).

## interviewTips
- The trigger: "navigate by k steps where k is huge" or "LCA / path-aggregate, many queries on a tree."
- Walk through the `up[k][v] = up[k-1][ up[k-1][v] ]` recurrence on paper.
- Compare with **Euler-tour + RMQ** (O(1) query, but only for LCA) and **HLD** (path queries on dynamic trees with point updates).
- For senior interviews, mention **functional graph** applications and **persistent binary lifting** for offline historical-state queries.

## code.python
```python
import math
def build_lift(n, parent):
    LOG = max(1, int(math.log2(n)) + 1)
    up = [[0]*n for _ in range(LOG)]
    up[0] = list(parent)
    for k in range(1, LOG):
        for v in range(n):
            up[k][v] = up[k-1][up[k-1][v]]
    return up

def kth_ancestor(up, v, k):
    bit = 0
    while k > 0:
        if k & 1: v = up[bit][v]
        k >>= 1; bit += 1
    return v

# parent[root] = root for sentinel
parent = [0, 0, 0, 0, 1, 1, 3, 3]
up = build_lift(8, parent)
print(kth_ancestor(up, 4, 1))   # 1
print(kth_ancestor(up, 4, 2))   # 0
print(kth_ancestor(up, 6, 3))   # 0
```

## code.javascript
```javascript
function buildLift(n, parent) {
  const LOG = Math.max(1, Math.floor(Math.log2(n)) + 1);
  const up = Array.from({ length: LOG }, () => new Int32Array(n));
  up[0] = Int32Array.from(parent);
  for (let k = 1; k < LOG; k++)
    for (let v = 0; v < n; v++)
      up[k][v] = up[k-1][up[k-1][v]];
  return up;
}
function kthAncestor(up, v, k) {
  let bit = 0;
  while (k > 0) {
    if (k & 1) v = up[bit][v];
    k >>>= 1; bit++;
  }
  return v;
}
```

## code.java
```java
class BinaryLifting {
    int[][] up;
    int LOG;
    public BinaryLifting(int n, int[] parent) {
        LOG = Math.max(1, (int) (Math.log(n) / Math.log(2)) + 1);
        up = new int[LOG][n];
        System.arraycopy(parent, 0, up[0], 0, n);
        for (int k = 1; k < LOG; k++)
            for (int v = 0; v < n; v++)
                up[k][v] = up[k-1][up[k-1][v]];
    }
    public int kthAncestor(int v, long k) {
        int bit = 0;
        while (k > 0) {
            if ((k & 1) == 1) v = up[bit][v];
            k >>>= 1; bit++;
        }
        return v;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <cmath>
struct BinaryLifting {
    std::vector<std::vector<int>> up;
    int LOG;
    BinaryLifting(int n, const std::vector<int>& parent) {
        LOG = std::max(1, (int) std::log2(n) + 1);
        up.assign(LOG, std::vector<int>(n));
        up[0] = parent;
        for (int k = 1; k < LOG; k++)
            for (int v = 0; v < n; v++)
                up[k][v] = up[k-1][up[k-1][v]];
    }
    int kthAncestor(int v, long long k) const {
        int bit = 0;
        while (k > 0) {
            if (k & 1) v = up[bit][v];
            k >>= 1; bit++;
        }
        return v;
    }
};
```
