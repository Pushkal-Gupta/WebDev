---
slug: segment-tree-merge
module: arrays-range-structures
title: Segment Tree Merging
subtitle: Combine two segment trees in O(n) when their value sets are disjoint — enables small-to-large tricks on trees.
difficulty: Advanced
position: 29
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Segment Tree (merging, generalisations)"
    url: "https://cp-algorithms.com/data_structures/segment_tree.html"
    type: blog
  - title: "indy256/codelibrary — segment tree implementations"
    url: "https://github.com/indy256/codelibrary"
    type: repo
status: published
---

## intro
A **segment tree merge** combines two segment trees `A` and `B` (both indexed over the same value range) into one tree containing the union of their data. Naively this is O(n log n) per merge — too slow if you're merging thousands of subtrees on a tree. The amortized-magic insight: **if every value appears in at most ONE of the two trees**, the merge is O(distinct values), and across an entire small-to-large process the total work is **O(n log n)**.

## whyItMatters
Enables a huge class of tree problems where you want to maintain a "set of values seen in v's subtree" while traversing post-order:
- **Count distinct colors in every subtree.**
- **Find the k-th smallest in every subtree.**
- **Compute median / mode / sum / max** over every subtree.

Often the only practical alternative to HLD + segment trees for these subtree-aggregate problems.

## intuition
Each segment tree node represents an index range. To merge two trees:
1. If either is null, return the other.
2. If we're at a leaf, sum (or combine) the values.
3. Otherwise, recursively merge left and right children.

When most of one tree's nodes have null counterparts in the other, the recursion short-circuits early — only the "intersecting" parts get touched. Across all merges in a tree, the total work amortizes to O(n log n).

## visualization
```
Two segment trees over the index range [0, 7]:

Tree A:                       Tree B:
        7                             5
       / \                           / \
      3   4                         2   3
     / \                                / \
    2   1                              1   2

Merge:
              12         ← 7 + 5
             /  \
            5    7       ← 3 + 2, 4 + 3
           / \    \
          2  1    null  ← 2 + null, 1 + null
              \    / \
              null 1  2

Total work proportional to nodes touched (≤ size of smaller tree).
```

## bruteForce
For each subtree query, build a fresh map of values in that subtree. O(n²). Dies at n = 10^4.

## optimal
```
class Node:
    __slots__ = ('val', 'left', 'right')
    def __init__(self):
        self.val = 0
        self.left = self.right = None

def update(node, lo, hi, idx, delta):
    if not node: node = Node()
    if lo == hi:
        node.val += delta
        return node
    mid = (lo + hi) // 2
    if idx <= mid: node.left = update(node.left, lo, mid, idx, delta)
    else: node.right = update(node.right, mid + 1, hi, idx, delta)
    node.val = (node.left.val if node.left else 0) + (node.right.val if node.right else 0)
    return node

def merge(a, b, lo, hi):
    if not a: return b
    if not b: return a
    if lo == hi:
        a.val += b.val
        return a
    mid = (lo + hi) // 2
    a.left = merge(a.left, b.left, lo, mid)
    a.right = merge(a.right, b.right, mid + 1, hi)
    a.val = (a.left.val if a.left else 0) + (a.right.val if a.right else 0)
    return a
```

For tree problems, do a post-order DFS — at each node v, start with a tree for v's value alone, then `merge` each child's tree into it.

## complexity
- **Per merge**: O(n_intersecting_nodes) — only nodes that exist in both trees do work.
- **Across a tree-DFS process**: O(n log V) total where V is the value range — the same "each value visits O(log n) tree levels" bound that makes small-to-large fast.
- **Space**: O(distinct values × log V) — each insertion allocates O(log V) nodes.

## pitfalls
- **Forgetting null merge**: if one tree is null, return the other immediately. Otherwise you create empty subtrees and bloat memory.
- **Reusing nodes**: the standard merge MUTATES `a`. If you need `a` preserved for another query, use persistent segment trees (separate concept).
- **Total memory**: at the start of a merge-heavy DFS, every node has its own tree → O(n log V) total. Reuse memory pools / arenas in production.
- **Confusing with persistent segment tree merge**: separate technique; that one preserves both inputs.

## interviewTips
- The trigger: "for every node v in a tree, compute X over its subtree, where X needs more than DSU-on-tree can give."
- Walk through the merge recursion — it's the only place candidates trip up.
- For senior interviews, mention the amortized bound: each insertion contributes O(log V) to total merge work.
- Compare with **DSU-on-tree** (simpler but more restrictive) and **HLD + segment tree** (path queries; more general but heavier code).

## code.python
```python
class SegNode:
    __slots__ = ('val', 'left', 'right')
    def __init__(self):
        self.val, self.left, self.right = 0, None, None

def update(node, lo, hi, idx, delta):
    if not node: node = SegNode()
    if lo == hi:
        node.val += delta
        return node
    mid = (lo + hi) // 2
    if idx <= mid: node.left = update(node.left, lo, mid, idx, delta)
    else: node.right = update(node.right, mid + 1, hi, idx, delta)
    node.val = (node.left.val if node.left else 0) + (node.right.val if node.right else 0)
    return node

def merge(a, b, lo, hi):
    if not a or not b: return a or b
    if lo == hi: a.val += b.val; return a
    mid = (lo + hi) // 2
    a.left = merge(a.left, b.left, lo, mid)
    a.right = merge(a.right, b.right, mid + 1, hi)
    a.val = (a.left.val if a.left else 0) + (a.right.val if a.right else 0)
    return a

# Example: count "1" in subtree {a={3}, b={5}} → merged contains 3 and 5 each once.
```

## code.javascript
```javascript
// Sketch — translation of the Python version. JS lacks struct optimizations,
// so it's slower in practice; for production, use a flat-array implementation.
```

## code.java
```java
class SegMerge {
    static class Node { int val; Node left, right; }
    static Node merge(Node a, Node b, int lo, int hi) {
        if (a == null) return b;
        if (b == null) return a;
        if (lo == hi) { a.val += b.val; return a; }
        int mid = (lo + hi) / 2;
        a.left = merge(a.left, b.left, lo, mid);
        a.right = merge(a.right, b.right, mid + 1, hi);
        a.val = (a.left == null ? 0 : a.left.val) + (a.right == null ? 0 : a.right.val);
        return a;
    }
}
```

## code.cpp
```cpp
struct SegNode { int val = 0; SegNode *left = nullptr, *right = nullptr; };
SegNode* segMerge(SegNode* a, SegNode* b, int lo, int hi) {
    if (!a || !b) return a ? a : b;
    if (lo == hi) { a->val += b->val; return a; }
    int mid = (lo + hi) / 2;
    a->left = segMerge(a->left, b->left, lo, mid);
    a->right = segMerge(a->right, b->right, mid + 1, hi);
    a->val = (a->left ? a->left->val : 0) + (a->right ? a->right->val : 0);
    return a;
}
```
