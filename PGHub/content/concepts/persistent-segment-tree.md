---
slug: persistent-segment-tree
module: arrays-range-structures
title: Persistent Segment Tree
subtitle: Functional segment trees — every update creates a new version sharing O(log n) nodes; query any historical version in O(log n).
difficulty: Advanced
position: 32
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Persistent Segment Tree"
    url: "https://cp-algorithms.com/data_structures/segment_tree.html#preserving-the-history-of-its-values-persistent-segment-tree"
    type: blog
  - title: "indy256/codelibrary — persistent segment tree templates"
    url: "https://github.com/indy256/codelibrary"
    type: repo
status: published
---

## intro
A **persistent segment tree** is a segment tree where each update returns a NEW version of the tree (the old one remains queryable). To avoid O(n) copying, each update creates only the **O(log n) nodes along the updated path** and shares the rest with the previous version. Memory is O((n + updates) · log n); query of any historical version is O(log n).

## whyItMatters
Classic uses:
- **Range kth-smallest queries** with O(log² n) — the standard "persistent segment tree on value coordinate" technique.
- **Time-travel queries** ("what was the sum of A[2..5] after update 7?").
- **Online problems** that need to query previous states without rolling back.
- **Functional programming**: persistent data structures are first-class in Clojure, Haskell, Scala.

## intuition
Think of each version as a document that got a tiny edit. If you photocopied the entire document every time you changed one word, you would drown in paper — that is the naive "snapshot the whole tree" approach at O(n) per update. Instead, imagine keeping the original and only writing a small overlay note for the one paragraph that changed, while every other paragraph is quoted by reference from the untouched original. That overlay is exactly what a persistent segment tree does: it is **copy-on-write with structural sharing**.

A segment tree over n elements has O(n) nodes. A point update touches only the O(log n) nodes on the path from the root down to the affected leaf — nothing off that path changes value. So when you update, you *clone only those path nodes*; each clone keeps one child pointing at the freshly cloned child on the update path, and its other child pointing straight back into the previous version's untouched subtree. Total new memory per update: O(log n) nodes, not O(n).

Concrete micro-example. Start with `A = [0, 0, 0, 0]`, so version 0's tree is all zeros. Now set `A[1] = 5`. The path from root to leaf 1 is root → left-child (covers [0,1]) → its right leaf (index 1) — three nodes. We allocate three brand-new nodes: a new leaf holding 5, a new [0,1] node whose left child still points at version 0's leaf 0 and whose right child is the new leaf 5, and a new root whose right child still points at version 0's entire [2,3] subtree. Everything in [2,3] is shared, zero copies.

What's actually happening: a "version" is nothing more than a separate **root pointer**. `roots[0]` is the all-zeros tree; `roots[1]` is the new root above. Querying version k means walking the tree starting at `roots[k]` and following child pointers — you naturally traverse a mix of that version's fresh nodes and older shared nodes, and you always read the value as it was *at that version*. Old roots are never mutated, so history stays perfectly intact and any past state is one O(log n) walk away.

## visualization
```
Version 0 (initial, all zeros):
                  root0
                 /      \
              n_left    n_right
              /    \    /    \
             0     0   0     0

Update version 1: set A[1] = 5. Path: root → left → right (leaf at index 1).
Clone these 3 nodes; left their unchanged children.

Version 1:
                  root1 ─────── shares left subtree's UNCHANGED child + right_root0
                 /      \
              n_left'   n_right (same as v0)
              /    \    /    \
             0    [5]   0     0       (cloned leaf at index 1)

Memory: 3 new nodes for version 1; everything else shared.

Query "sum over [0, 1] in version 1" walks root1 → n_left' → leaves [0, 5] → returns 5.
Query "sum over [0, 1] in version 0" walks root0 → n_left → leaves [0, 0] → returns 0.
```

## bruteForce
**Snapshot the entire tree on each update**: O(n) memory per update. Useless for many updates.

**Re-build from scratch**: O(n log n) per query. Slower than persistent.

**Without time-travel**: just a plain segment tree. O(log n) update, but no historical access.

## optimal
**Node**:
```
class Node:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

**Build initial version O(n)**:
```
def build(lo, hi, arr):
    if lo == hi:
        return Node(arr[lo])
    mid = (lo + hi) // 2
    left = build(lo, mid, arr)
    right = build(mid + 1, hi, arr)
    return Node(left.val + right.val, left, right)
```

**Update — returns new root, shares old subtrees**:
```
def update(node, lo, hi, idx, val):
    if lo == hi:
        return Node(val)        # leaf — value replaced
    mid = (lo + hi) // 2
    if idx <= mid:
        new_left = update(node.left, lo, mid, idx, val)
        return Node(new_left.val + node.right.val, new_left, node.right)
    else:
        new_right = update(node.right, mid + 1, hi, idx, val)
        return Node(node.left.val + new_right.val, node.left, new_right)
```

**Query — works on any version's root**:
```
def query(node, lo, hi, l, r):
    if r < lo or hi < l: return 0
    if l <= lo and hi <= r: return node.val
    mid = (lo + hi) // 2
    return query(node.left, lo, mid, l, r) + query(node.right, mid+1, hi, l, r)
```

**Storing versions**: keep `roots[]` array. `roots[0]` = initial build; `roots[k]` = result of k-th update.

**Why this is correct.** The key invariant is that `update` never mutates any existing node — it only allocates and returns new ones — so every root already stored in `roots[]` still describes the exact tree it did when created. A node's `val` is always the sum of its two children, and this holds for the new nodes because we recompute `Node(new_left.val + node.right.val, ...)` at each step of the ascent, combining the one freshly-updated child with the still-correct sibling from the previous version. Because the sibling subtree is logically identical to before (we only *share* it, never touch it), the new parent's sum is exactly right.

**Step-by-step walk of `update(roots[0], 0, 4, 2, 100)`** on `arr = [1,2,3,4,5]`. We descend targeting index 2. At the root covering [0,4], mid = 2, so 2 ≤ mid — recurse left into [0,2]. There mid = 1, and 2 > mid — recurse right into [2,2]. That is a leaf, so we return a fresh `Node(100)`. Unwinding: the [2,2]'s parent [0,2] rebuilds as `Node(old_left([0,1]=3).val + 100, shared_left, new_leaf)` = 103, sharing the untouched [0,1] subtree. The root rebuilds as `Node(103 + old_right([3,4]=9).val, new_left, shared_right)` = 112, sharing the entire [3,4] subtree. Three new nodes; `roots[0]` still answers 15 for the full range, `roots[1]` answers 112.

**Complexity intuition.** Each update walks one root-to-leaf path of height O(log n), allocating one node per level, so O(log n) time and O(log n) new nodes. Queries are identical to a plain segment tree walk — O(log n) — because sharing is invisible to the reader: a shared child pointer behaves exactly like an owned one. The only tradeoff versus a non-persistent tree is memory (a pointer-chased node per path level, versus a flat array) and worse cache locality.

## complexity
- **Build**: O(n) time, O(n) nodes.
- **Update**: O(log n) time, O(log n) new nodes.
- **Query (any version)**: O(log n).
- **Total memory** after K updates: O((n + K) · log n).

## pitfalls
- **GC in languages without it**: C/C++ must manage allocation pools — naive `new Node` per update fragments heap. Use an arena.
- **Lazy propagation**: harder to make persistent — usually skip and use point updates.
- **Cache-unfriendly**: tree of pointers, not array-flat. Range queries are slower than non-persistent in practice.
- **Range update + range query**: requires lazy propagation; the persistent version is complex. Most online problems use point updates instead.
- **Memory exhaustion**: K updates × log n nodes; with K = 10^5 and n = 10^5, that's 10^5 · 17 = 1.7M nodes — fine but track allocator carefully.

## interviewTips
- For "range kth-smallest with no updates" → persistent segment tree on coordinate-compressed values, O(log n) per query.
- For "time-travel queries" → persistent segment tree.
- Mention **copy-on-write** + **structural sharing** as the core technique.
- For senior: discuss **persistent functional data structures** as the Clojure/Scala lineage.

## code.python
```python
class Node:
    __slots__ = ('val', 'left', 'right')
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def build(lo, hi, arr):
    if lo == hi: return Node(arr[lo])
    mid = (lo + hi) // 2
    L = build(lo, mid, arr); R = build(mid+1, hi, arr)
    return Node(L.val + R.val, L, R)

def update(node, lo, hi, idx, val):
    if lo == hi: return Node(val)
    mid = (lo + hi) // 2
    if idx <= mid:
        L = update(node.left, lo, mid, idx, val)
        return Node(L.val + node.right.val, L, node.right)
    R = update(node.right, mid+1, hi, idx, val)
    return Node(node.left.val + R.val, node.left, R)

def query(node, lo, hi, l, r):
    if r < lo or hi < l: return 0
    if l <= lo and hi <= r: return node.val
    mid = (lo + hi) // 2
    return query(node.left, lo, mid, l, r) + query(node.right, mid+1, hi, l, r)

# Usage:
arr = [1, 2, 3, 4, 5]
roots = [build(0, 4, arr)]
roots.append(update(roots[0], 0, 4, 2, 100))   # set A[2] = 100 in v1
print(query(roots[0], 0, 4, 0, 4))    # 15
print(query(roots[1], 0, 4, 0, 4))    # 112
```

## code.javascript
```javascript
class Node { constructor(val=0, left=null, right=null) { this.val=val; this.left=left; this.right=right; } }
// Same shape as Python — recurse on update, returning new node.
```

## code.java
```java
class PersistentSegTree {
    static class Node { long val; Node left, right; Node(long v, Node l, Node r){val=v;left=l;right=r;} }
    // ... same structural-sharing pattern
}
```

## code.cpp
```cpp
// For competitive programming: pre-allocate node array (4*n + K*log(n)) to avoid malloc overhead.
struct Node { long long val; Node *left, *right; };
Node pool[2'000'000]; int pool_idx = 0;
Node* alloc(long long v, Node* l, Node* r) { auto* n = &pool[pool_idx++]; n->val=v; n->left=l; n->right=r; return n; }
```
