---
slug: segment-tree-beats
module: arrays-range-structures
title: Segment Tree Beats
subtitle: Range updates with min/max ceilings or floors — push the recursion only into nodes that actually change, O((n+q) log² n) amortized.
difficulty: Advanced
position: 30
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Segment Tree (advanced range updates)"
    url: "https://cp-algorithms.com/data_structures/segment_tree.html"
    type: blog
  - title: "kth-competitive-programming/kactl — segment tree templates"
    url: "https://github.com/kth-competitive-programming/kactl"
    type: repo
status: published
---

## intro
"Segment Tree Beats" (often called **Ji Driver Segment Tree** or just "beats") is a segment tree variant that supports **complex range updates** like "for every i in [l, r], set a[i] = min(a[i], x)" along with range sums and other aggregates. The trick: at each node track max1, max2, count_max — and propagate only when the update would actually change something. Total time is `O((n + q) log² n)` amortized.

## whyItMatters
The HJTang trick unlocks problems that would otherwise need expensive bookkeeping:
- **Range chmin / chmax** (clamp): `for i in [l, r]: a[i] = min(a[i], x)`.
- **Range floor / ceil**.
- **Range "set to nth root"**, **range "set to log"**.
- **Mixed range-add + chmin** for ad-hoc operators.

In competitive programming, beats unlocks an entire class of problems that look impossible with plain segment trees.

## intuition
Plain segment trees push lazy updates down indiscriminately. Beats refuses to push when the update is a no-op. Three cases per node for a `chmin(x)` operation:

1. **`x >= node.max1`**: update has no effect (all values are already ≤ x). Return immediately.
2. **`node.max2 < x < node.max1`**: only the maximum values change. They all become x. Update node.sum and node.max1 lazily; no recursion needed.
3. **`x <= node.max2`**: can't compute without recursing. Push and recurse on both children.

The amortizing argument: each "expensive" case 3 strictly decreases some potential, and that potential is bounded. Total work is `O((n+q) log² n)`.

## visualization
```
arr = [5, 3, 7, 2, 4]
op: chmin(4) on range [0..4]

Node summary:
  Root  max1=7, max2=5, count_max=1, sum=21
  
Case 2 doesn't apply (5 < 4 is false — wait, max2=5 is NOT < 4).
Case 3: must recurse — max2 >= x.

Left child  max1=5, max2=3, count_max=1
  Case 3: recurse
Right child max1=7, max2=4, count_max=1
  Case 2: max2=4 < 4 fails; recurse
  ...
Eventually: a[0]=4, a[1]=3, a[2]=4, a[3]=2, a[4]=4. sum = 17.
```

## bruteForce
Loop `i = l..r` and apply the operation. O(n) per query — fine for n ≤ 10^4. Dies at the standard 10^5 × 10^5.

## optimal
**Node structure** (for chmin support):
- `max1`: maximum value in subtree.
- `max2`: strict-second-maximum value in subtree (the largest value < max1). If all values are equal, max2 = -∞.
- `count_max`: how many entries equal max1.
- `sum`: subtree sum.

**Update chmin(node, l, r, x)**:
```
if range outside [l, r] or x >= node.max1: return
if l <= node.lo && node.hi <= r && node.max2 < x:
    # Only max1 values change.
    node.sum -= (node.max1 - x) * node.count_max
    node.max1 = x
    return
push_lazy(node)
chmin(node.left, ...);  chmin(node.right, ...)
recompute(node)         # max1 = max of children, count_max via tie-handling, sum = sum of children
```

**Range sum** is standard segment-tree code with the lazy push.

For **chmax** (range "set to max(a[i], x)"), maintain `min1`, `min2`, `count_min` analogously.

To support BOTH chmin and chmax simultaneously, maintain min/max state and combine lazily — code gets intricate but the asymptotic is the same.

## complexity
- **Time**: `O((n + q) log² n)` amortized. The extra log compared to plain segment tree comes from the "decreasing potential" argument.
- **Space**: `O(n)`.
- **Constant factor**: significant. For small n / q, a plain segment tree + brute-force chmin can be competitive.

## pitfalls
- **Wrong definition of max2**: it's the strict second max (different from max1). Setting it to max1 in the "all equal" case is the standard handling.
- **Forgetting count_max**: needed to update the sum correctly when max1 changes.
- **Stacking too many lazy types**: handling chmin + chmax + range-add together gets complex. Order lazy operations carefully.
- **Off-by-one in the "case 2" condition**: `node.max2 < x < node.max1` — both strict.
- **No good textbook**: most references are competitive-programming editorials. Tang's original write-up + Codeforces blog are the canonical sources.

## interviewTips
- The trigger: "range update that clamps values" — `min(a[i], x)`, `max(a[i], x)` — plus range query.
- Mention the **three-case potential argument** without prompting at senior level.
- Compare with plain segment tree (no chmin support) and Kinetic Segment Tree (more general but heavier).
- Acknowledge the implementation difficulty — production segment trees beats code is 200+ lines.

## code.python
```python
# Sketch — full implementation is 100+ lines. The key shape:
class STBeats:
    def __init__(self, arr):
        self.n = len(arr)
        # Each internal node tracks: max1, max2, count_max, sum, lazy_add
        # ...
    def chmin(self, node, lo, hi, l, r, x):
        if hi < l or r < lo or x >= self.max1[node]: return
        if l <= lo and hi <= r and self.max2[node] < x:
            # Only the max1 entries change.
            self.sum[node] -= (self.max1[node] - x) * self.count_max[node]
            self.max1[node] = x
            return
        self.push(node)
        mid = (lo + hi) // 2
        self.chmin(2*node,   lo,   mid, l, r, x)
        self.chmin(2*node+1, mid+1, hi, l, r, x)
        self.pull(node)
```

## code.javascript
```javascript
// Sketch — see Python pseudocode. Production version uses typed arrays for performance.
```

## code.java
```java
// Sketch — segment tree beats is rarely used outside competitive programming.
// Java implementations exist in Codeforces submissions; mostly 200+ lines.
```

## code.cpp
```cpp
// Sketch — most competitive C++ implementations live in a single TU at ~300 lines.
// See atcoder/library or kactl for production-grade reference.
```
