---
slug: wavelet-matrix
module: arrays-counting-select
title: Wavelet Matrix
subtitle: O(log σ) range queries — kth smallest, range count, quantile — on a static integer array with σ distinct values.
difficulty: Advanced
position: 31
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "GeeksforGeeks — Wavelet Tree"
    url: "https://www.geeksforgeeks.org/wavelet-trees-introduction/"
    type: blog
  - title: "kth-competitive-programming/kactl — wavelet tree templates"
    url: "https://github.com/kth-competitive-programming/kactl"
    type: repo
status: published
---

## intro
A **wavelet matrix** is a succinct data structure that answers complex range queries on a static integer sequence in **O(log σ)** time, where σ is the alphabet size (or value range). It supports: range-kth-smallest, count of value `v` in `[l, r]`, count of values in `[lo, hi]` in `[l, r]`, range quantile, range mode, etc.

## whyItMatters
For static (no updates) sequences with rich range queries, wavelet matrix beats segment-tree-of-sorted-lists / merge-sort-tree in both time and space:
- **Quantile / median in a range**: O(log σ) vs O(log² n) with merge-sort tree.
- **Count occurrences of a specific value in a range**: O(log σ) vs O(log n) per layer.
- **Range mode / top-k frequent in range**: variants exist.
- **Geometric range queries** (rank-of-point in subrectangle): wavelet trees over 2D layouts.

Used in succinct text indexing (FM-index), database column-store optimizations, computational geometry.

## intuition
Build a sequence of **bitvectors** (one per bit level). At each level, the bit `b` partitions current elements into "0-bits" (left) and "1-bits" (right) — reordering the sequence stably so 0s come before 1s. To answer a query for value `v` and range `[l, r]`, walk bits from MSB to LSB: at each level, follow the partition (left or right) based on the bit of `v`, mapping `[l, r]` accordingly via rank operations on the bitvector.

Think of it geometrically as a **radix sort caught mid-flight and frozen at every stage**. A full binary radix sort on the high-to-low bits would eventually land every element in sorted order; the wavelet matrix keeps a photograph of the array after each single-bit pass and stores just the bit that decided each move. Nothing else is stored — no values, only the partition decisions. Because the reorder is *stable*, an element's relative order among its equal-bit peers is preserved across levels, and that is precisely what lets a range `[l, r]` be tracked downward: the count of 0-bits inside `[l, r]` tells you both how many elements go left and exactly where they land in the next level's array.

What is actually happening is a top-down walk of an implicit binary trie of values, where each node's membership is answered by a rank query instead of a pointer chase. Consider `A = [3,1,4,1,5,9,2,6]` with 4 bits. At the MSB level only `9` has bit 3 set, so its bit row is `0 0 0 0 0 1 0 0`; the stable reorder sends the seven zero-elements to the front and `9` to the back. To find the 4th smallest over the whole array, count the zeros in the range: there are 7, and since `k = 4 <= 7` the answer carries a 0 bit here and we descend into the zero-block. Repeating for bits 2, 1, 0 accumulates the answer's bits one at a time and shrinks `[l, r]` at every step, reconstructing the value `3` after four rank-guided hops. Each rank is O(1) with succinct support (additional o(n) bits), so the whole query is O(log σ). A wavelet matrix is essentially "rank operations on log σ stacked bitvectors".

## visualization
```
A = [3, 1, 4, 1, 5, 9, 2, 6]  (8 elements, max value 9 → 4 bits)

Level 3 (bit 3, MSB):
  bits:    0 0 0 0 0 1 0 0     (only 9 has bit 3 set)
  left:   [3, 1, 4, 1, 5, 2, 6]   (7 elements, bit3 = 0)
  right:  [9]                     (1 element)

Level 2 (bit 2):
  for left [3,1,4,1,5,2,6]:
    bits:  0 0 1 0 1 0 1     (4,5,6 have bit2 set)
    left:  [3,1,1,2]
    right: [4,5,6]
  for right [9]:
    bits:  0
    left:  [9]
    right: []

... continue for bits 1, 0.

Range-kth-smallest(l=0, r=7, k=4):
  bit3:  count of 0s in A[0..7] = 7. k=4 ≤ 7 → go left.
  bit2:  count of 0s in left[0..7] = 4. k=4 ≤ 4 → go left.
  bit1:  count of 0s in leftleft[0..4] = 2. k=4 > 2 → go right; k=4-2=2.
  bit0:  count of 0s in leftleftright[0..2] = 0. k=2 > 0 → go right; k=2.
  Result bits: 0011 → value 3.  ✓ (A sorted = [1,1,2,3,4,5,6,9]; 4th smallest = 3)
```

## bruteForce
**Per-query sort + index**: O(n log n) per query. Useless for many queries.

**Merge-sort tree**: O(log² n) per query. Standard for "count smaller than v in range". Wavelet matrix beats it.

## optimal
Construction in O(n log σ):
```
def build(arr, max_bits):
    layers = []
    cur = list(arr)
    for b in range(max_bits - 1, -1, -1):
        bits = [(x >> b) & 1 for x in cur]
        zeros = [x for x in cur if not ((x >> b) & 1)]
        ones  = [x for x in cur if  ((x >> b) & 1)]
        layers.append(bits)
        cur = zeros + ones    # stable reorder
    return layers
```

**Kth smallest in [l, r]** in O(log σ):
```
def kth(layers, l, r, k):
    val = 0
    for b in range(len(layers)):
        bits = layers[b]
        zero_count_in_range = sum(1 for i in range(l, r) if bits[i] == 0)
        if k <= zero_count_in_range:
            # answer is in the 0-group; map [l, r] to 0-positions
            l, r = rank_zero(bits, l), rank_zero(bits, r)
        else:
            val |= 1 << (len(layers) - 1 - b)
            k -= zero_count_in_range
            # answer is in the 1-group; map via rank_one
            total_zeros = bits.count(0)
            l = total_zeros + rank_one(bits, l)
            r = total_zeros + rank_one(bits, r)
    return val
```

For production: use a **succinct rank/select bitvector** (~o(n) extra bits, O(1) queries) instead of recomputing counts.

**Why it's correct.** The controlling invariant is that after each level's stable partition, the sub-range `[l, r)` of the current array always contains *exactly* the elements of the original query range whose value bits seen so far match the path we have taken. Descending into the zero-block preserves membership because a stable partition keeps zero-bit elements in their original relative order, so `rank_zero(l)` and `rank_zero(r)` map the endpoints to their new positions without ever mixing in an out-of-range element. The one-block map is the mirror image: all zeros of the level come first (there are `total_zeros` of them), then the ones in stable order, so a one-bit element lands at `total_zeros + rank_one(position)`. Because these two maps partition the level exactly and lose nothing, the count of zeros inside the mapped range is the count of query-range elements whose next bit is 0 — which is exactly the number of candidates smaller (at this bit) than any one-bit value. That count is what the kth-smallest walk compares `k` against.

**The mechanism, step by step.** Start with `[l, r)` over the top bitvector and `k` unchanged. At each level compute `z`, the number of zeros in `[l, r)`. If `k <= z`, the kth element has a 0 in this bit: append 0 to the answer and remap `[l, r)` into the zero-block. Otherwise it has a 1: OR the bit into `val`, subtract `z` from `k` (we skip past all the smaller zero-block elements), and remap into the one-block. After processing all `log σ` levels, `val` holds the reconstructed value.

**The central tradeoff** is immutability for speed: the structure is built once and answers every range statistic in a single top-down pass, but a single insertion or value change would force re-partitioning cascading levels, so updates are effectively unsupported. **Complexity intuition:** the bound holds because the walk visits each of the `log σ` levels exactly once and does O(1) work per level (two rank calls plus a compare) when backed by a succinct rank index, giving O(log σ) per query independent of the range width `r - l`.

## complexity
- **Build**: O(n log σ) time, O(n log σ) space.
- **Range-kth-smallest**: O(log σ) per query.
- **Range count of value v**: O(log σ).
- **Range count in [lo, hi]**: O(log σ).
- **Quantile, percentile**: O(log σ).

## pitfalls
- **Wavelet TREE vs wavelet MATRIX**: tree has hierarchy of segments per node; matrix flattens to log σ bitvectors. Matrix has slightly worse constants per query but much simpler implementation and better cache behavior.
- **Static only**: no updates. For dynamic, use Fenwick-of-sorted-lists or persistent segment trees.
- **Alphabet size matters**: if σ = 10^9, you need 30 levels. If σ is small but compressible (rank values to 0..n-1), use coordinate compression.
- **Off-by-one in [l, r) vs [l, r]**: pick one convention and stick to it. Document it.

## interviewTips
- For "many range-statistic queries on a static array" — wavelet matrix or persistent segment tree.
- Mention **O(log σ)** as the headline complexity.
- Compare with merge-sort tree (O(log² n)) and persistent segment tree (O(log n) but more complex).
- For senior interviews, mention **FM-index** as the suffix-array compression that uses wavelet trees under the hood.

## code.python
```python
class WaveletMatrix:
    def __init__(self, arr, max_bits=None):
        if max_bits is None:
            max_bits = max(1, max(arr).bit_length())
        self.max_bits = max_bits
        self.layers = []     # bits per level
        self.zeros = []      # count of zeros per level
        cur = list(arr)
        for b in range(max_bits - 1, -1, -1):
            bits = [(x >> b) & 1 for x in cur]
            self.layers.append(bits)
            self.zeros.append(bits.count(0))
            cur = [x for x in cur if not ((x >> b) & 1)] + [x for x in cur if ((x >> b) & 1)]

    def kth(self, l, r, k):
        val = 0
        for bi, bits in enumerate(self.layers):
            zr = sum(1 for i in range(l, r) if bits[i] == 0)
            if k <= zr:
                # rank0 mapping
                l = sum(1 for i in range(0, l) if bits[i] == 0)
                r = l + zr
            else:
                val |= 1 << (self.max_bits - 1 - bi)
                k -= zr
                z = self.zeros[bi]
                l = z + sum(1 for i in range(0, l) if bits[i] == 1)
                r = l + (r - l - zr)
        return val

A = [3, 1, 4, 1, 5, 9, 2, 6]
wm = WaveletMatrix(A)
print(wm.kth(0, 8, 4))   # 3 (4th smallest)
```

## code.javascript
```javascript
// Same shape — build layered bitvectors, walk MSB→LSB on queries.
// Use Uint8Array for bits and precomputed prefix counts for O(1) rank.
```

## code.java
```java
// JVM implementation usually wraps a long[] bitvector per level.
// Apache Commons Lang3 has BitVector helpers; or roll your own using long ops.
```

## code.cpp
```cpp
// Standard competitive-programming version: vector<vector<int>> bits, vector<int> zeros.
// For production-grade, use sdsl-lite's wavelet_tree<> for succinct bitvectors.
```
