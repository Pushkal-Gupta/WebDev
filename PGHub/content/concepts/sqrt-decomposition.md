---
slug: sqrt-decomposition
module: arrays-range-structures
title: Square Root Decomposition
subtitle: Bucket an array into √n blocks for O(√n) range queries + updates — simpler than segment tree, faster constants.
difficulty: Intermediate
position: 27
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Sqrt Decomposition"
    url: "https://cp-algorithms.com/data_structures/sqrt_decomposition.html"
    type: blog
  - title: "indy256/codelibrary — sqrt decomposition templates"
    url: "https://github.com/indy256/codelibrary"
    type: repo
status: published
---

## intro
Split an array of n elements into ⌈√n⌉ buckets of ~√n elements each, each bucket caching its own aggregate (sum, min, etc.). Both **range queries** and **point updates** take O(√n) — slower than a segment tree's O(log n) asymptotically, but with a small constant, simpler code, and a flexible framework for problems segment trees handle awkwardly.

## whyItMatters
Sqrt decomposition is the right tool when:
- You need an aggregate that's hard to express as a segment-tree merge (e.g., "k-th most frequent element in range").
- You want offline algorithms — pairs nicely with **Mo's algorithm** for processing many queries in O((n + q) √n).
- The constants of a segment tree are too high (each block holds ~√n items in a tight, cache-friendly array).
- You need code in 30 lines instead of 80.

For n = 10^5, √n ≈ 316, so each op is ~316 ops vs ~17 for log n. Order of magnitude slower per op, but often beats segment trees in real wall-clock time due to constant factor.

## intuition
Group consecutive elements into blocks of size B ≈ √n. For each block, cache the aggregate (e.g., `block_sum[i]`). To answer a range query [l, r]:
1. The "ends" of [l, r] may partially overlap one block on each side — sum those elements individually (O(B)).
2. The middle full blocks contribute their cached aggregate (O(n/B) blocks).

Total = O(B + n/B). Minimized at B = √n giving O(√n).

Picture the array as a **ruler with marks every B units**. Any interval you point at either sits between two marks (a tiny scan) or swallows whole labeled segments in its middle — and for those segments you already wrote the answer on the ruler, so you read it off instead of re-measuring. The two frayed ends are the only place you pay per-element; everything in between is a single glance per block. The reason √n is the sweet spot is a balance of two opposing costs that pull against each other: make blocks bigger and the frayed ends get longer (up to B elements each), make blocks smaller and there are more of them to glance at (up to n/B). One term grows as you shrink the other, and `B + n/B` bottoms out exactly when `B = n/B`, i.e. `B = √n`.

What's actually happening: you trade a little precomputed memory for the ability to skip over long runs of the array. Walk through `arr = [3,1,4,1,5,9,2,6,5,3]` with `B = 3`, so the block sums are `[8, 15, 13, 3]`. Ask for `sum(2, 7)`. The left end, index 2, sits inside block 0 but only index 2 is in range, so scan it directly: `arr[2] = 4`. The next stretch, indices 3..5, is exactly block 1 in full, so take the cached `15` in one read instead of adding `1+5+9`. The right end, indices 6..7, is a partial slice of block 2, so scan those two: `arr[6] + arr[7] = 2 + 6 = 8`. Total `4 + 15 + 8 = 27`, reached in roughly six touches rather than six array reads. A point update stays cheap too: change `arr[5]` and you only fix its one block sum by the delta, never rebuilding anything else.

## visualization
```
arr = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3]  (n = 10, B ≈ 3)

Blocks:
  [3, 1, 4]  → sum = 8
  [1, 5, 9]  → sum = 15
  [2, 6, 5]  → sum = 13
  [3]        → sum = 3

Query sum(2, 7):
  Block 0 partial:   arr[2]            → 4
  Block 1 full:                        → 15
  Block 2 partial:   arr[6] + arr[7]   → 8
  Total = 4 + 15 + 8 = 27.   ← In ~6 ops, not ~6 array reads (one was a single cache read).
```

## bruteForce
Loop over arr[l..r] for each query. O(n) per query. Useless beyond ~10^4 ops.

## optimal
```
def build_blocks(arr):
    n = len(arr)
    B = int(n ** 0.5) + 1
    sums = [0] * ((n // B) + 1)
    for i, x in enumerate(arr):
        sums[i // B] += x
    return arr[:], sums, B

def range_sum(l, r, arr, sums, B):
    total = 0
    bl, br = l // B, r // B
    if bl == br:
        # Same block — scan directly.
        for i in range(l, r + 1): total += arr[i]
    else:
        for i in range(l, (bl + 1) * B): total += arr[i]
        for b in range(bl + 1, br): total += sums[b]
        for i in range(br * B, r + 1): total += arr[i]
    return total

def point_update(idx, val, arr, sums, B):
    sums[idx // B] += val - arr[idx]
    arr[idx] = val
```

For aggregates that aren't easily summed (min, max), keep the same block structure but recompute the block aggregate from scratch on update — still O(B) per update.

**Why it's correct.** The key invariant is that `blocks[b]` always equals the aggregate of exactly the elements in block `b`, and every array index belongs to precisely one block. A range query then partitions `[l, r]` into three disjoint pieces — a partial prefix inside `bl`, a run of complete blocks `bl+1 .. br-1`, and a partial suffix inside `br` — that together cover `[l, r]` with no gap and no overlap. Because the pieces are disjoint and exhaustive, summing (or min/max-combining) their contributions reproduces the true range aggregate. The `bl == br` special case exists because when both endpoints fall in the same block there is no complete block between them; scanning `l..r` directly is both correct and cheaper than trying to peel prefix and suffix off the same block. Updates preserve the invariant by construction: `point_update` adjusts the owning block's cached value by exactly `val - arr[idx]` and then writes the new element, so the cache and the array never drift apart.

**The mechanism, step by step.** Compute `bl = l/B` and `br = r/B`. If they match, loop `l..r` and return. Otherwise scan `l` up to the end of block `bl`, add each full middle block's cached aggregate, then scan from the start of block `br` down to `r`. **Complexity intuition:** the two end scans touch at most `B - 1` elements apiece, and the middle loop iterates over at most `n/B` blocks, so total work is `O(B + n/B)`; substituting `B = √n` collapses both terms to `O(√n)`, and the same `O(B)` bound governs an update because at most one block is rebuilt. The **central tradeoff** against a segment tree is asymptotics for constants: `√n` grows faster than `log n`, but the flat array of block sums has near-perfect cache locality and no recursion or pointer overhead, so for `n` up to roughly `10^6` the simpler structure frequently wins on wall-clock time.

**Mo's algorithm** (offline range queries) is sqrt decomposition + clever query reordering: sort queries by (block of l, r) so adjacent queries move l, r by small amounts. Total O((n + q) √n).

## complexity
- **Query / update**: O(√n).
- **Space**: O(n) for the array + O(√n) for block sums.
- **Constant**: very small (just array indexing).
- **Vs segment tree**: segment tree is asymptotically faster (O(log n)) but has 5-10× the constant. For n ≤ 10^6 sqrt-decomp can beat seg-tree in practice.

## pitfalls
- **Block boundary off-by-one**: getting `bl == br` right vs separate prefix/middle/suffix loops is the most common bug.
- **Updating without invalidating block aggregates**: do both updates simultaneously.
- **Choosing B != √n**: for unusual workloads (read-heavy: B smaller; write-heavy: B larger). Tune empirically.
- **Confusing with segment tree**: different time bounds, different mental model. Segment trees are recursive; sqrt-decomp is a flat structure.

## interviewTips
- The trigger: "range aggregate, also support updates, n ≤ 10^5, the aggregate is hard to express as a merge."
- Compare with segment tree directly — interviewers want to see you know when to pick which.
- For senior interviews, mention **Mo's algorithm** as the offline-query extension.
- For unusual aggregates ("k-th most common in range," "median in range"), sqrt-decomp is often the right tool — segment trees struggle.

## code.python
```python
class SqrtDecomp:
    def __init__(self, arr):
        self.arr = arr[:]
        self.n = len(arr)
        self.B = max(1, int(self.n ** 0.5))
        self.blocks = [0] * ((self.n // self.B) + 1)
        for i, x in enumerate(arr): self.blocks[i // self.B] += x

    def range_sum(self, l, r):
        total = 0
        bl, br = l // self.B, r // self.B
        if bl == br:
            for i in range(l, r + 1): total += self.arr[i]
            return total
        for i in range(l, (bl + 1) * self.B): total += self.arr[i]
        for b in range(bl + 1, br): total += self.blocks[b]
        for i in range(br * self.B, r + 1): total += self.arr[i]
        return total

    def update(self, idx, val):
        self.blocks[idx // self.B] += val - self.arr[idx]
        self.arr[idx] = val

s = SqrtDecomp([3, 1, 4, 1, 5, 9, 2, 6, 5, 3])
print(s.range_sum(2, 7))   # 27
s.update(5, 0); print(s.range_sum(2, 7))    # 18
```

## code.javascript
```javascript
class SqrtDecomp {
  constructor(arr) {
    this.arr = arr.slice(); this.n = arr.length;
    this.B = Math.max(1, Math.floor(Math.sqrt(this.n)));
    this.blocks = new Array(Math.floor(this.n / this.B) + 1).fill(0);
    for (let i = 0; i < this.n; i++) this.blocks[Math.floor(i / this.B)] += arr[i];
  }
  rangeSum(l, r) {
    let total = 0;
    const bl = Math.floor(l / this.B), br = Math.floor(r / this.B);
    if (bl === br) { for (let i = l; i <= r; i++) total += this.arr[i]; return total; }
    for (let i = l; i < (bl + 1) * this.B; i++) total += this.arr[i];
    for (let b = bl + 1; b < br; b++) total += this.blocks[b];
    for (let i = br * this.B; i <= r; i++) total += this.arr[i];
    return total;
  }
  update(idx, val) {
    this.blocks[Math.floor(idx / this.B)] += val - this.arr[idx];
    this.arr[idx] = val;
  }
}
```

## code.java
```java
class SqrtDecomp {
    int[] arr; long[] blocks; int B, n;
    public SqrtDecomp(int[] a) {
        n = a.length; arr = a.clone();
        B = Math.max(1, (int) Math.sqrt(n));
        blocks = new long[n / B + 1];
        for (int i = 0; i < n; i++) blocks[i / B] += a[i];
    }
    public long rangeSum(int l, int r) {
        long total = 0;
        int bl = l / B, br = r / B;
        if (bl == br) { for (int i = l; i <= r; i++) total += arr[i]; return total; }
        for (int i = l; i < (bl + 1) * B; i++) total += arr[i];
        for (int b = bl + 1; b < br; b++) total += blocks[b];
        for (int i = br * B; i <= r; i++) total += arr[i];
        return total;
    }
    public void update(int idx, int val) {
        blocks[idx / B] += val - arr[idx];
        arr[idx] = val;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <cmath>
struct SqrtDecomp {
    std::vector<long long> arr, blocks;
    int B, n;
    SqrtDecomp(const std::vector<int>& a) : arr(a.begin(), a.end()), n(a.size()) {
        B = std::max(1, (int) std::sqrt(n));
        blocks.assign(n / B + 1, 0);
        for (int i = 0; i < n; i++) blocks[i / B] += a[i];
    }
    long long rangeSum(int l, int r) {
        long long total = 0;
        int bl = l / B, br = r / B;
        if (bl == br) { for (int i = l; i <= r; i++) total += arr[i]; return total; }
        for (int i = l; i < (bl + 1) * B; i++) total += arr[i];
        for (int b = bl + 1; b < br; b++) total += blocks[b];
        for (int i = br * B; i <= r; i++) total += arr[i];
        return total;
    }
    void update(int idx, long long val) {
        blocks[idx / B] += val - arr[idx];
        arr[idx] = val;
    }
};
```
