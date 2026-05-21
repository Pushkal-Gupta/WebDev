---
slug: segment-tree-persistent
module: arrays-searching
title: Persistent Segment Tree
subtitle: A segment tree that retains every past version — answer queries on any prior state in O(log n) without storing N copies.
difficulty: Advanced
position: 25
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Driscoll, Sarnak, Sleator, Tarjan (1986) — Making data structures persistent"
    url: ""
status: published
---

## intro
A persistent data structure remembers every version of itself. A persistent segment tree lets you do range queries on the array *as it looked at any prior update*, while still costing only O(log n) per update and per query — much cheaper than naively snapshotting the whole tree every step.

## whyItMatters
Three classic use cases:
1. **K-th smallest in a subarray** — build a persistent segment tree where version `i` adds element `arr[i]` to the multiset; the `i`-th version minus the `(j-1)`-th version is the count of values in `arr[j..i]`. Walk the difference tree to find the k-th. O((n + q) log n) total.
2. **Snapshot databases** — read-as-of-time queries for analytics or audit logs.
3. **Tree-on-tree problems** — when you need a segment tree at every node of a tree (e.g. for path queries), persistence lets you share most of the structure across children.

Without persistence these problems either don't fit in memory or require offline processing (Mo's algorithm, merge sort tree). Persistence makes them online + fast.

## intuition
A normal segment tree update walks from root to leaf touching O(log n) nodes and mutates them in place. Persistence avoids the mutation: for each node on the path, **clone** it before changing — and have the clone's unchanged child pointer still aim at the *old* subtree. Only O(log n) new nodes are allocated per update; the other n - log n nodes are shared with the previous version. Each "version" is just a new root pointer.

## visualization
```
Original tree (version 0):
            root_v0
           /        \
         A           B
        / \         / \
       C   D       E   F

Update at leaf D — clone the path root, A, D:

  root_v1 ──► clone of root, left = clone(A), right = B (shared)
  clone(A) ─► left = C (shared), right = clone(D)
  clone(D) ─► new value

Versions 0 and 1 coexist; query either by passing its root.
```

## bruteForce
Save a full snapshot of the array on every update → O(n) per update, O(n · u) memory after u updates. For n = u = 10^5 that's 10^10 ints — impossible.

## optimal
Each node holds value (sum or whatever monoid you need), and `left` + `right` child pointers. **Updates allocate new nodes along the path**:

```
update(node, l, r, idx, val):
    if l == r:
        return new Node(value = val)
    mid = (l + r) // 2
    if idx <= mid:
        new_left  = update(node.left,  l, mid,     idx, val)
        new_right = node.right
    else:
        new_left  = node.left
        new_right = update(node.right, mid + 1, r, idx, val)
    return new Node(merge(new_left.value, new_right.value), new_left, new_right)
```

Each call returns the root of the new version, sharing the half of the tree that didn't change.

**Queries** are identical to a plain segment tree — walk from a specific root, return the merged value. For "k-th smallest in arr[l..r]", walk versions `roots[r]` and `roots[l - 1]` in lockstep, comparing counts.

## complexity
- **Per update**: O(log n) time + O(log n) new nodes.
- **Per query**: O(log n).
- **Total memory after q updates**: O((n + q) · log n).
- **Build**: O(n) one-time for version 0.

## pitfalls
- **Forgetting to also share unchanged children**: clone the whole tree on every update → O(n) per update → no win.
- **In-place value mutation on a shared node**: corrupts older versions. Always allocate.
- **Holding old version pointers in long-running services**: prevents GC; memory grows forever. Have a policy (e.g., keep only last N versions).
- **Recursion depth**: at n = 10^6 stack depth is ~20. Fine in most languages; Python may need `sys.setrecursionlimit`.
- **Confusing with rope or persistent BST**: ropes are for strings; persistent BSTs use the same idea but for balanced BSTs (red-black, treap).

## interviewTips
- Recognize the trigger: "queries on the array as of step i" or "k-th smallest in a subarray online" → persistent segment tree.
- Mention **path copying** as the technique by name.
- Compare with offline alternatives (**merge sort tree**, **wavelet tree**, **Mo's algorithm**) when discussing tradeoffs.
- For senior interviews, mention **partial persistence** (only the latest version is mutable) vs **full persistence** (any version is mutable).

## code.python
```python
class PSeg:
    def __init__(self, n):
        self.n = n
        self.roots = [self._build(0, n - 1)]

    def _build(self, l, r):
        if l == r: return [0, None, None]
        mid = (l + r) // 2
        node = [0, self._build(l, mid), self._build(mid + 1, r)]
        return node

    def _update(self, node, l, r, idx, val):
        if l == r: return [node[0] + val, None, None]
        mid = (l + r) // 2
        if idx <= mid:
            new_left = self._update(node[1], l, mid, idx, val)
            new_right = node[2]
        else:
            new_left = node[1]
            new_right = self._update(node[2], mid + 1, r, idx, val)
        return [new_left[0] + new_right[0], new_left, new_right]

    def update(self, version, idx, val):
        new_root = self._update(self.roots[version], 0, self.n - 1, idx, val)
        self.roots.append(new_root)
        return len(self.roots) - 1

    def query(self, version, ql, qr, l=0, r=None, node=None):
        if r is None: r, node = self.n - 1, self.roots[version]
        if qr < l or r < ql: return 0
        if ql <= l and r <= qr: return node[0]
        mid = (l + r) // 2
        return self.query(version, ql, qr, l, mid, node[1]) + self.query(version, ql, qr, mid + 1, r, node[2])

t = PSeg(5)
v1 = t.update(0, 2, 7)
v2 = t.update(v1, 4, 3)
print(t.query(v2, 0, 4))  # 10
print(t.query(0, 0, 4))   # 0 — version 0 unchanged
```

## code.javascript
```javascript
// Sketch — full code is similar to the Python version. Node: [value, left, right].
function update(node, l, r, idx, val) {
  if (l === r) return [node[0] + val, null, null];
  const mid = (l + r) >> 1;
  if (idx <= mid) {
    const left = update(node[1], l, mid, idx, val);
    return [left[0] + node[2][0], left, node[2]];
  }
  const right = update(node[2], mid + 1, r, idx, val);
  return [node[1][0] + right[0], node[1], right];
}
```

## code.java
```java
class PSeg {
    static class Node { int val; Node left, right; Node(int v, Node l, Node r) { val = v; left = l; right = r; } }
    static Node update(Node n, int l, int r, int idx, int val) {
        if (l == r) return new Node(n.val + val, null, null);
        int mid = (l + r) >>> 1;
        if (idx <= mid) {
            Node nl = update(n.left, l, mid, idx, val);
            return new Node(nl.val + n.right.val, nl, n.right);
        }
        Node nr = update(n.right, mid + 1, r, idx, val);
        return new Node(n.left.val + nr.val, n.left, nr);
    }
}
```

## code.cpp
```cpp
struct PSegNode { int val; PSegNode *left = nullptr, *right = nullptr; };
PSegNode* update(PSegNode* n, int l, int r, int idx, int val) {
    if (l == r) return new PSegNode{ n->val + val, nullptr, nullptr };
    int mid = (l + r) >> 1;
    if (idx <= mid) {
        auto nl = update(n->left, l, mid, idx, val);
        return new PSegNode{ nl->val + n->right->val, nl, n->right };
    }
    auto nr = update(n->right, mid + 1, r, idx, val);
    return new PSegNode{ n->left->val + nr->val, n->left, nr };
}
```
