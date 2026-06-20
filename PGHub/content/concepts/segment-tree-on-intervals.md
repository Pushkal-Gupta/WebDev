---
slug: segment-tree-on-intervals
module: arrays-range-structures
title: Segment Tree on Intervals (Interval Tree)
subtitle: Index a set of intervals so "which intervals contain point p?" or "which intervals overlap [l, r]?" run in O(log n + k).
difficulty: Advanced
position: 26
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "de Berg et al. — Computational Geometry (book site, Utrecht)"
    url: "https://www.cs.uu.nl/geobook/"
    type: book
  - title: "GeeksforGeeks — Interval Tree"
    url: "https://www.geeksforgeeks.org/interval-tree/"
    type: blog
  - title: "TheAlgorithms/Python — data structures"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures"
    type: repo
status: published
---

## intro
A **segment tree on intervals** (a.k.a. **interval tree**) is a balanced BST keyed on endpoints, augmented so that each node stores the maximum right-endpoint in its subtree. Queries like "find all intervals containing point p" or "find all intervals overlapping [l, r]" run in **O(log n + k)** where k is the number of results.

## whyItMatters
Interval queries are everywhere:
- **Calendar conflict detection** — given a new meeting, find all overlapping ones.
- **Genomic alignment** — find all gene-feature intervals overlapping a region.
- **Network firewall rules** — find all rules whose port ranges contain a given port.
- **CSS / DOM event hit-testing** — find all elements whose bounds contain a click point.

The data structure is small (just an augmented BST) but powerful. Distinct from a *segment tree* (which indexes by position and supports range aggregation) — the two are often confused.

## intuition
Build a balanced BST on the intervals, keyed by **left endpoint**. At each node, augment with `max_right` — the maximum right endpoint across the node's entire subtree. Then for a query:
- If the current node's interval overlaps the query → emit it.
- If the LEFT subtree's `max_right` ≥ query's left endpoint → recurse left.
- Recurse right whenever the current node's left endpoint < query's right endpoint.

The augmentation lets you prune entire subtrees that can't contain a matching interval.

## visualization
```
Intervals (sorted by left endpoint):
  [1, 4]   [2, 6]   [5, 8]   [7, 10]   [9, 12]

Balanced BST keyed by left endpoint:
                ([5, 8], max=12)
               /                \
       ([2, 6], max=6)    ([9, 12], max=12)
       /                     /
  ([1, 4], max=4)       ([7, 10], max=10)

Query point p=3:
  Visit root [5, 8]: 3 < 5 (not in interval). Left max=6 >= 3 → go left.
  Visit [2, 6]: 2 <= 3 <= 6 → MATCH, emit [2, 6]. Left max=4 >= 3 → go left.
  Visit [1, 4]: 1 <= 3 <= 4 → MATCH, emit [1, 4].
  Done. Two matches in O(log n + 2) time.
```

## bruteForce
Linear scan all intervals: O(n) per query. Fine for small n. Useless once you have 10^5 intervals and 10^5 queries (10^10 ops).

## optimal
**Construction**:
1. Sort intervals by left endpoint.
2. Build a balanced BST (or implement as an array if intervals are static).
3. For each node, set `max_right = max(self.right, left.max_right, right.max_right)`.

**Point query (which intervals contain p)**:
```
def find_containing(node, p, result):
    if node is None: return
    # Possible match in left subtree if its max_right >= p.
    if node.left and node.left.max_right >= p:
        find_containing(node.left, p, result)
    # Check current node.
    if node.lo <= p <= node.hi:
        result.append(node.interval)
    # If p is to the right of node.lo, recurse right.
    if node.lo <= p:
        find_containing(node.right, p, result)
```

**Range overlap query (which intervals overlap [l, r])** is the same shape but accepts intervals where `node.lo <= r` and `node.hi >= l`.

For dynamic insertion/deletion, use a **red-black tree** (Java `TreeMap`-style with augmentation). For static intervals, **build the tree once as a sorted array** for cache efficiency.

## complexity
- **Build**: O(n log n) (sort) + O(n) (tree construction).
- **Point query**: O(log n + k).
- **Range query**: O(log n + k).
- **Insert / delete**: O(log n) with a balanced BST.
- **Space**: O(n).

## pitfalls
- **Confusing with segment tree**: this is an *interval* tree (variable intervals). A segment tree indexes a fixed array by position. Different problems.
- **Closed vs open intervals**: decide `[l, r]` (inclusive) vs `[l, r)` (half-open) upfront. Off-by-one bugs are easy.
- **Augmentation maintenance**: every insert / delete must update `max_right` on the path back to root.
- **Skewed trees**: a plain BST degrades to O(n). Either build balanced from sorted input or use red-black.

## interviewTips
- The trigger: "given N intervals, answer queries about containment / overlap." Interval tree.
- Compare with **segment tree** (indexes positions, not intervals) and **range tree** (multi-dimensional).
- For senior interviews, mention **augmented BBST** as the technique — knowing the tree-augmentation idiom signals depth.
- For static intervals, mention that an interval-endpoint sort + sweep + Fenwick can answer many of the same queries more simply.

## code.python
```python
class Node:
    def __init__(self, lo, hi):
        self.lo, self.hi, self.max_right = lo, hi, hi
        self.left = self.right = None

def insert(root, lo, hi):
    if root is None: return Node(lo, hi)
    if lo < root.lo: root.left = insert(root.left, lo, hi)
    else: root.right = insert(root.right, lo, hi)
    root.max_right = max(root.max_right, hi)
    return root

def find_containing(node, p, out):
    if node is None: return
    if node.left and node.left.max_right >= p:
        find_containing(node.left, p, out)
    if node.lo <= p <= node.hi:
        out.append((node.lo, node.hi))
    if node.lo <= p:
        find_containing(node.right, p, out)

root = None
for lo, hi in [(1,4),(2,6),(5,8),(7,10),(9,12)]:
    root = insert(root, lo, hi)
out = []
find_containing(root, 3, out)
print(out)    # [(1, 4), (2, 6)]
```

## code.javascript
```javascript
class Node {
  constructor(lo, hi) { this.lo = lo; this.hi = hi; this.maxRight = hi; this.left = null; this.right = null; }
}
function insert(root, lo, hi) {
  if (!root) return new Node(lo, hi);
  if (lo < root.lo) root.left = insert(root.left, lo, hi);
  else root.right = insert(root.right, lo, hi);
  root.maxRight = Math.max(root.maxRight, hi);
  return root;
}
function findContaining(node, p, out = []) {
  if (!node) return out;
  if (node.left && node.left.maxRight >= p) findContaining(node.left, p, out);
  if (node.lo <= p && p <= node.hi) out.push([node.lo, node.hi]);
  if (node.lo <= p) findContaining(node.right, p, out);
  return out;
}
```

## code.java
```java
import java.util.*;
class IntervalTree {
    static class Node { int lo, hi, maxRight; Node left, right; Node(int l, int h) { lo = l; hi = h; maxRight = h; } }
    Node root;
    void insert(int lo, int hi) { root = ins(root, lo, hi); }
    Node ins(Node n, int lo, int hi) {
        if (n == null) return new Node(lo, hi);
        if (lo < n.lo) n.left = ins(n.left, lo, hi);
        else n.right = ins(n.right, lo, hi);
        n.maxRight = Math.max(n.maxRight, hi);
        return n;
    }
    void findContaining(Node n, int p, List<int[]> out) {
        if (n == null) return;
        if (n.left != null && n.left.maxRight >= p) findContaining(n.left, p, out);
        if (n.lo <= p && p <= n.hi) out.add(new int[]{ n.lo, n.hi });
        if (n.lo <= p) findContaining(n.right, p, out);
    }
}
```

## code.cpp
```cpp
struct INode { int lo, hi, maxRight; INode *left = nullptr, *right = nullptr; INode(int l, int h) : lo(l), hi(h), maxRight(h) {} };
INode* insert(INode* n, int lo, int hi) {
    if (!n) return new INode(lo, hi);
    if (lo < n->lo) n->left = insert(n->left, lo, hi);
    else n->right = insert(n->right, lo, hi);
    n->maxRight = std::max(n->maxRight, hi);
    return n;
}
void findContaining(INode* n, int p, std::vector<std::pair<int,int>>& out) {
    if (!n) return;
    if (n->left && n->left->maxRight >= p) findContaining(n->left, p, out);
    if (n->lo <= p && p <= n->hi) out.emplace_back(n->lo, n->hi);
    if (n->lo <= p) findContaining(n->right, p, out);
}
```
