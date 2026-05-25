---
slug: binary-lifting-general
module: trees-advanced-queries
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
The technique exists because querying "k-th ancestor of v" naïvely costs O(k) per query — walk up the parent pointer k times. For trees with depth 10⁵ or functional graphs where k can be 10¹⁸, that is unacceptable. Binary lifting (Bender-Farach-Colton 2000 in the LCA context; the idea is older as "doubling" in functional-graph navigation) collapses queries to O(log k) by precomputing pointer jumps at every power-of-two distance.

The decisive observation: any positive integer k decomposes uniquely into a sum of distinct powers of 2 (its binary representation). To jump k steps from v, jump by each set bit of k: if k = 13 = 1101₂, jump by 8, then 4, then 1. If we precompute the result of "jump 2^j steps" for every j and every starting node, each query becomes O(number of set bits in k) = O(log k) jumps.

The precomputation uses self-application: `up[k][v]` = the 2^k-th ancestor of v = `up[k-1][ up[k-1][v] ]`. To jump 2^k steps from v, first jump 2^(k-1) steps to some intermediate node u, then jump another 2^(k-1) steps from u. So each layer doubles the reach of the previous; with K = ⌈log₂ n⌉ layers, the table covers any depth up to n. Total preprocessing: O(n · log n).

The same trick generalises beyond ancestor lookup to **any associative aggregate along the path**. Store `up[k][v]` paired with the aggregate over the 2^k edges traversed — max edge weight, min edge weight, XOR of values, sum. When jumping, combine the per-step aggregates. This gives O(log n) per query for tree-path max / min / XOR / sum problems, no segment tree needed.

The deeper principle is that any monoid (associative binary operation with identity) supports binary lifting. Functional graphs (each node has exactly one outgoing edge, like permutations or hash-collision chains) admit `f^k(x)` in O(log k) — useful for cycle detection in linked lists with random-access offsets, Pollard's rho factorisation, and FSM simulation under huge step counts. Permutation powers in group theory (`perm^k(x)` for game-of-life-like simulations) and "press this button k times, where do I land?" puzzles all collapse to the same template.

LCA via binary lifting uses a slight extension: lift the deeper node to the depth of the shallower one (k = depth difference), then lift both simultaneously by decreasing powers of 2 while they remain distinct. Total O(log n) per LCA query after O(n log n) preprocessing — the workhorse for tree path queries in competitive programming.

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
**Technique: doubling table over the parent function — `up[k][v] = 2^k-th ancestor` precomputed via `up[k][v] = up[k-1][up[k-1][v]]`.** O(n log n) preprocessing, O(log k) per query. Optimal: the precomputation is information-theoretically tight because the table encodes one bit of "where do I land?" per (node, power) pair, and the binary decomposition of k means no query can answer in fewer than ⌈log₂ k⌉ jumps without additional structure.

```python
LOG = (n).bit_length()                    # ceil(log2(n))
up = [[root] * n for _ in range(LOG)]
for v in range(n):
    up[0][v] = parent[v]                   # base: 2^0 = 1-step ancestor

for k in range(1, LOG):
    for v in range(n):
        up[k][v] = up[k-1][ up[k-1][v] ]   # doubling: 2^k = 2^(k-1) + 2^(k-1)

def kth_ancestor(v, k):
    bit = 0
    while k > 0:
        if k & 1:
            v = up[bit][v]                  # jump 2^bit steps when this bit set
        k >>= 1
        bit += 1
    return v
```

Key lines: `up[k][v] = up[k-1][ up[k-1][v] ]` is the entire algorithmic content — the 2^k-th ancestor is the 2^(k-1)-th ancestor of the 2^(k-1)-th ancestor. This recurrence builds each layer from the previous in O(n) per layer, giving O(n log n) total. The query loop walks the bits of k from LSB to MSB: when a bit is set, jump by that power of 2; when cleared, skip. With at most log₂ k iterations, the query is O(log k) in the worst case.

The sentinel `up[0][root] = root` (root's parent is itself) avoids null checks at every jump — overshooting just stays at the root. This is the cleanest way to handle "k larger than depth" without per-step bounds checks.

**Path aggregates** (max / min / XOR / sum along the 2^k path): store the aggregate alongside `up[k][v]`. During precomputation, combine the two halves: `agg[k][v] = combine(agg[k-1][v], agg[k-1][up[k-1][v]])`. During query, fold the partial aggregates as you jump:

```python
def path_max(v, k):
    result = -float('inf')
    bit = 0
    while k > 0:
        if k & 1:
            result = max(result, max_up[bit][v])
            v = up[bit][v]
        k >>= 1
        bit += 1
    return result
```

**LCA via binary lifting** (Bender-Farach-Colton 2000): first lift the deeper node to the shallower's depth using `kth_ancestor`, then simultaneously lift both by decreasing powers of 2 while they remain distinct. The final common ancestor at one step above is the LCA. O(log n) per query.

**Why not naive O(k) walk?** For k = 10⁵ in a deep tree with 10⁵ queries, that's 10¹⁰ ops; binary lifting gives 10⁵ × 17 = 1.7·10⁶ ops. **Why not Euler tour + sparse table RMQ?** Equivalent O(1)-LCA bound with different constants; sparse-table needs O(n log n) memory same as binary lifting but has slightly worse cache behaviour. **Why not Tarjan's offline LCA?** O(n + q·α(n)) — best when all queries are known upfront; binary lifting wins for online queries. **Memory at n = 10⁵, LOG = 17**: 1.7M entries × 4 bytes ≈ 7 MB, very comfortable. **Common bugs**: forgetting the root self-loop sentinel (null-pointer crashes); using `k >>= 1` without incrementing `bit` in lockstep; off-by-one in LCA (lift to *one above* the LCA, not the LCA itself); building the table with the inner loop over k instead of outer over k (each layer needs the previous one fully built).

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
