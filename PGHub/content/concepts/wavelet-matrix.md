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

A wavelet matrix is essentially "rank operations on log σ stacked bitvectors". Each rank is O(1) with succinct support (additional o(n) bits).

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
