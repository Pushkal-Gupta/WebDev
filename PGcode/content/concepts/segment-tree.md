---
slug: segment-tree
module: trees-advanced-queries
title: Segment Tree
subtitle: Range queries and point updates in O(log n) on any associative operation.
difficulty: Advanced
position: 8
estimatedReadMinutes: 8
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
A segment tree is a binary tree where each node stores some aggregate over a contiguous range of the input array — sum, min, max, GCD, or any associative operation. Queries and point updates both run in `O(log n)`. With **lazy propagation**, range updates also become `O(log n)`, which is what makes segment trees the answer to most "support these operations on an array" interview problems.

## whyItMatters
When the interviewer says "support range queries AND modifications efficiently," a prefix-sum array dies (modifications are O(n)) and a Fenwick (BIT) tree only handles prefix-sum-style queries. Segment trees handle anything associative — range max, range GCD, range XOR, count-of-zeroes-in-range, you name it — and with lazy propagation also handle "add 5 to every element in [l, r]" without rebuilding.

## intuition
Imagine recursively splitting the array `[0, n)` into halves until each leaf is a single element. Internal nodes store the aggregate of their children's ranges. Queries and updates walk this tree, visiting at most `O(log n)` nodes.

For **lazy propagation**: when you "add 5 to every element in [l, r]," instead of touching all the leaves, mark an internal node "owe 5 to everything below me" and stop there. When a future query crosses through the node, *push down* the pending update to its children before descending. Amortizes range updates to `O(log n)`.

## visualization
Array `[1, 3, 5, 7, 9, 11]` with range-sum segment tree:

```
              [0,5]: 36
             /        \
        [0,2]: 9     [3,5]: 27
        /    \         /    \
   [0,1]:4 [2,2]:5  [3,4]:16 [5,5]:11
   /   \              /    \
[0]:1 [1]:3        [3]:7 [4]:9
```

Query `sum(1, 4)` walks: [0,5] → split into [0,2] and [3,5]. From [0,2]: query [1,2] → [1,1] returns 3 + [2,2] returns 5 = 8. From [3,5]: query [3,4] → returns 16. Total = 24.

## bruteForce
Plain array: query is `O(n)`, update is `O(1)`. Prefix sums: query is `O(1)`, update is `O(n)`. Segment tree: both `O(log n)`. The win is dominating both operations at once.

## optimal
**Storage:** use an array of size `4n` (safe upper bound for any n, accounting for the fact that the tree isn't always a perfect binary tree). Node `i` has children `2i` and `2i+1`; root is at index 1.

**Build:** recursive, `O(n)`. Each leaf gets a value, each internal node combines its children.

**Point update:** walk to the leaf, update, then propagate combined values back up. `O(log n)`.

**Range query:** recursive on `[ql, qr]`. If current node's range is disjoint → identity; if fully covered → return its stored value; else recurse into both children and combine. `O(log n)` because at most `O(log n)` "partial" nodes are touched at each level.

**Range update with lazy:** add a `lazy[]` array same shape as the tree. On update, mark internal nodes "all leaves below owe X" and stop. On query/descent, *push down* — apply lazy to current node's stored value, propagate lazy to children, clear it. `O(log n)`.

## complexity
time: O(n) build, O(log n) per query, O(log n) per point or range update.
space: O(n) (4n in practice).
notes: For competitive use cases with multi-dimensional updates (2D segment trees), space and time multiply; usually `O(n²)` build and `O(log² n)` per op. Fenwick trees are simpler and faster by a constant factor for prefix-sum-style problems — pick BIT when sufficient.

## pitfalls
- Forgetting the `4n` size for the segment-tree array. `2n` is unsafe.
- Off-by-one on the half-open vs closed-range conventions. Pick one (`[l, r)` is the cleaner academic choice; `[l, r]` is more common in interviews).
- Updating internal nodes' stored values *without* clearing or propagating lazy first → arithmetic errors that cascade.
- For range-max / range-min with lazy "set" operations, distinguish "add" vs "assign" — they don't compose the same way.
- Forgetting to push down lazy before *both* descent paths in a query/update.

## interviewTips
- The simplest segment-tree question is "range sum with point updates." Solve it in 30 lines and move on.
- For "count inversions" or "k-th smallest element with insertions," consider a segment tree indexed by value (also called a Fenwick of presence).
- If the problem is *only* prefix-sum-style, mention Fenwick (BIT) — it's smaller and faster. Use segment trees when you need a non-prefix range or when lazy propagation matters.
- For range *assignment* + range query, lazy propagation is mandatory; don't try to fake it with point updates.

## code.python
```python
class SegTree:
    """Range sum, point update."""
    def __init__(self, arr):
        n = len(arr)
        self.n = n
        self.tree = [0] * (4 * max(1, n))
        if n: self._build(arr, 1, 0, n - 1)

    def _build(self, arr, node, l, r):
        if l == r:
            self.tree[node] = arr[l]
            return
        m = (l + r) // 2
        self._build(arr, 2 * node,     l,     m)
        self._build(arr, 2 * node + 1, m + 1, r)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def update(self, idx, value):
        self._upd(1, 0, self.n - 1, idx, value)

    def _upd(self, node, l, r, idx, value):
        if l == r:
            self.tree[node] = value
            return
        m = (l + r) // 2
        if idx <= m: self._upd(2 * node,     l,     m, idx, value)
        else:        self._upd(2 * node + 1, m + 1, r, idx, value)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query(self, ql, qr):
        return self._qry(1, 0, self.n - 1, ql, qr)

    def _qry(self, node, l, r, ql, qr):
        if qr < l or r < ql: return 0
        if ql <= l and r <= qr: return self.tree[node]
        m = (l + r) // 2
        return self._qry(2 * node, l, m, ql, qr) + self._qry(2 * node + 1, m + 1, r, ql, qr)
```

## code.javascript
```javascript
class SegTree {
  constructor(arr) {
    this.n = arr.length;
    this.tree = new Array(4 * Math.max(1, this.n)).fill(0);
    if (this.n) this._build(arr, 1, 0, this.n - 1);
  }
  _build(arr, node, l, r) {
    if (l === r) { this.tree[node] = arr[l]; return; }
    const m = (l + r) >> 1;
    this._build(arr, 2 * node, l, m);
    this._build(arr, 2 * node + 1, m + 1, r);
    this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1];
  }
  update(idx, value) { this._upd(1, 0, this.n - 1, idx, value); }
  _upd(node, l, r, idx, value) {
    if (l === r) { this.tree[node] = value; return; }
    const m = (l + r) >> 1;
    if (idx <= m) this._upd(2 * node, l, m, idx, value);
    else this._upd(2 * node + 1, m + 1, r, idx, value);
    this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1];
  }
  query(ql, qr) { return this._qry(1, 0, this.n - 1, ql, qr); }
  _qry(node, l, r, ql, qr) {
    if (qr < l || r < ql) return 0;
    if (ql <= l && r <= qr) return this.tree[node];
    const m = (l + r) >> 1;
    return this._qry(2 * node, l, m, ql, qr) + this._qry(2 * node + 1, m + 1, r, ql, qr);
  }
}
```

## code.java
```java
class SegTree {
    private final int n;
    private final long[] tree;
    public SegTree(int[] arr) {
        n = arr.length;
        tree = new long[4 * Math.max(1, n)];
        if (n > 0) build(arr, 1, 0, n - 1);
    }
    private void build(int[] a, int node, int l, int r) {
        if (l == r) { tree[node] = a[l]; return; }
        int m = (l + r) >>> 1;
        build(a, 2 * node, l, m);
        build(a, 2 * node + 1, m + 1, r);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
    public void update(int idx, int value) { upd(1, 0, n - 1, idx, value); }
    private void upd(int node, int l, int r, int idx, int v) {
        if (l == r) { tree[node] = v; return; }
        int m = (l + r) >>> 1;
        if (idx <= m) upd(2 * node, l, m, idx, v);
        else          upd(2 * node + 1, m + 1, r, idx, v);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
    public long query(int ql, int qr) { return qry(1, 0, n - 1, ql, qr); }
    private long qry(int node, int l, int r, int ql, int qr) {
        if (qr < l || r < ql) return 0;
        if (ql <= l && r <= qr) return tree[node];
        int m = (l + r) >>> 1;
        return qry(2 * node, l, m, ql, qr) + qry(2 * node + 1, m + 1, r, ql, qr);
    }
}
```

## code.cpp
```cpp
struct SegTree {
    int n;
    vector<long long> tree;
    SegTree(vector<int>& a) : n(a.size()), tree(4 * max(1, (int) a.size()), 0) {
        if (n) build(a, 1, 0, n - 1);
    }
    void build(vector<int>& a, int node, int l, int r) {
        if (l == r) { tree[node] = a[l]; return; }
        int m = (l + r) >> 1;
        build(a, 2 * node, l, m);
        build(a, 2 * node + 1, m + 1, r);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
    void update(int idx, int v) { upd(1, 0, n - 1, idx, v); }
    void upd(int node, int l, int r, int idx, int v) {
        if (l == r) { tree[node] = v; return; }
        int m = (l + r) >> 1;
        if (idx <= m) upd(2 * node, l, m, idx, v);
        else          upd(2 * node + 1, m + 1, r, idx, v);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
    long long query(int ql, int qr) { return qry(1, 0, n - 1, ql, qr); }
    long long qry(int node, int l, int r, int ql, int qr) {
        if (qr < l || r < ql) return 0;
        if (ql <= l && r <= qr) return tree[node];
        int m = (l + r) >> 1;
        return qry(2 * node, l, m, ql, qr) + qry(2 * node + 1, m + 1, r, ql, qr);
    }
};
```
