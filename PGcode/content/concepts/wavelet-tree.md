---
slug: wavelet-tree
module: arrays-counting-select
title: Wavelet Tree
subtitle: k-th element in a range, range rank, and range quantile in O(log sigma) per query.
difficulty: Advanced
position: 30
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "GeeksforGeeks — Wavelet Trees Introduction"
    url: "https://www.geeksforgeeks.org/wavelet-trees-introduction/"
    type: blog
  - title: "indy256/codelibrary — wavelet tree implementations"
    url: "https://github.com/indy256/codelibrary"
    type: repo
status: published
---

## intro
A wavelet tree turns a sequence over an alphabet of size sigma into a balanced binary tree of bitvectors. Each level partitions values by one bit of their rank in the sorted alphabet. With rank/select on the bitvectors, you can answer "the k-th smallest element of A[l..r]" in O(log sigma) time using only O(n log sigma) bits of space.

## whyItMatters
Range k-th, range frequency, and range quantile queries are bread-and-butter for analytics, search ranking, and competitive programming problems that segment-trees alone cannot solve. A wavelet tree replaces a stack of persistent segment trees with one compact, cache-friendly structure that handles a much wider query menu — including "how many values in A[l..r] lie inside [x..y]?" — in logarithmic time.

## intuition
Sort the alphabet. The root bitvector marks each position with 0 if its value falls in the lower half of the alphabet, 1 if it falls in the upper half. Recurse: the left child holds the subsequence of "0" positions, the right child holds the "1" positions, each split again by the next bit. Walking the tree from root to leaf using the input range [l..r] is essentially a binary search on the alphabet, guided by rank queries that re-map the range into the chosen child.

## visualization
```
A = [3, 1, 4, 1, 5, 9, 2, 6]  alphabet = [1..9], mid = 5
root bits: [0,0,0,0,1,1,0,1]    (1 if value >= 5)
 left  child sequence: [3,1,4,1,2]
 right child sequence: [5,9,6]
recurse on each child with its own midpoint until leaves represent single values
```

## bruteForce
Copy A[l..r], sort it, return the k-th entry — O((r-l+1) log(r-l+1)) per query. Acceptable for one-off scripts; catastrophic when q and n are both 1e5 and queries arrive online.

## optimal
Build a balanced binary tree over the alphabet. At each internal node, store a bitvector of length equal to the node's subsequence with rank support precomputed. For a query "k-th smallest in A[l..r]":
```
node = root; while not leaf:
  zeros = rank0(bits, r+1) - rank0(bits, l)
  if k <= zeros: descend left, remap l,r using rank0
  else: k -= zeros; descend right, remap l,r using rank1
return node.value
```
Range-rank (how many entries in [l..r] are < x) and range-count in [x..y] follow the same descent pattern with different stop conditions.

## complexity
time: O(log sigma) per query after O(n log sigma) construction
space: O(n log sigma) bits — typically smaller than a segment tree of vectors
notes: With succinct rank/select (jacobson) the constants shrink further; in practice a simple uint32 prefix-sum every 64 bits is enough for interview-level work.

## pitfalls
- Off-by-one in rank0/rank1 — always use half-open prefixes rank(bv, i) = count in [0..i).
- Forgetting to compress the alphabet first — wavelet tree height depends on alphabet, not value magnitude.
- Mixing 0-indexed and 1-indexed k for k-th smallest queries.
- Trying to mutate the tree in place — vanilla wavelet trees are static; you want a wavelet matrix or dynamic variant for updates.

## interviewTips
- Lead with the alternative: "merge sort tree is O(log^2 n), persistent segment tree is O(log n) but heavy on memory — wavelet tree gives O(log sigma) with much smaller constants."
- Mention it powers FM-index, the data structure behind bioinformatics tools like bowtie and the Burrows-Wheeler-based bwa aligner.
- Be ready to sketch only the rank0/rank1 descent; full construction code is rarely required on a whiteboard.

## code.python
```python
class WaveletTree:
    def __init__(self, arr, lo=None, hi=None):
        self.lo = min(arr) if lo is None else lo
        self.hi = max(arr) if hi is None else hi
        self.bits = [0]
        if self.lo == self.hi or not arr:
            return
        mid = (self.lo + self.hi) // 2
        left, right = [], []
        prefix = [0]
        for v in arr:
            b = 0 if v <= mid else 1
            self.bits.append(self.bits[-1] + (1 - b))
            (left if b == 0 else right).append(v)
        self.left = WaveletTree(left, self.lo, mid)
        self.right = WaveletTree(right, mid + 1, self.hi)

    def kth(self, l, r, k):
        if self.lo == self.hi:
            return self.lo
        zeros_in = self.bits[r + 1] - self.bits[l]
        if k <= zeros_in:
            nl = self.bits[l]
            nr = self.bits[r + 1] - 1
            return self.left.kth(nl, nr, k)
        nl = l - self.bits[l]
        nr = r - self.bits[r + 1]
        return self.right.kth(nl, nr, k - zeros_in)
```

## code.javascript
```javascript
class WaveletTree {
  constructor(arr, lo = null, hi = null) {
    this.lo = lo ?? Math.min(...arr);
    this.hi = hi ?? Math.max(...arr);
    this.bits = [0];
    if (this.lo === this.hi || arr.length === 0) return;
    const mid = (this.lo + this.hi) >> 1;
    const left = [], right = [];
    for (const v of arr) {
      const b = v <= mid ? 0 : 1;
      this.bits.push(this.bits[this.bits.length - 1] + (1 - b));
      (b === 0 ? left : right).push(v);
    }
    this.left = new WaveletTree(left, this.lo, mid);
    this.right = new WaveletTree(right, mid + 1, this.hi);
  }
  kth(l, r, k) {
    if (this.lo === this.hi) return this.lo;
    const zeros = this.bits[r + 1] - this.bits[l];
    if (k <= zeros) {
      return this.left.kth(this.bits[l], this.bits[r + 1] - 1, k);
    }
    return this.right.kth(l - this.bits[l], r - this.bits[r + 1], k - zeros);
  }
}
```

## code.java
```java
class WaveletTree {
    int lo, hi;
    int[] bits;
    WaveletTree left, right;
    WaveletTree(int[] a, int lo, int hi) {
        this.lo = lo; this.hi = hi;
        bits = new int[a.length + 1];
        if (lo == hi || a.length == 0) return;
        int mid = (lo + hi) >> 1;
        int[] L = new int[a.length], R = new int[a.length];
        int li = 0, ri = 0;
        for (int i = 0; i < a.length; i++) {
            int b = a[i] <= mid ? 0 : 1;
            bits[i + 1] = bits[i] + (1 - b);
            if (b == 0) L[li++] = a[i]; else R[ri++] = a[i];
        }
        left = new WaveletTree(java.util.Arrays.copyOf(L, li), lo, mid);
        right = new WaveletTree(java.util.Arrays.copyOf(R, ri), mid + 1, hi);
    }
    int kth(int l, int r, int k) {
        if (lo == hi) return lo;
        int zeros = bits[r + 1] - bits[l];
        if (k <= zeros) return left.kth(bits[l], bits[r + 1] - 1, k);
        return right.kth(l - bits[l], r - bits[r + 1], k - zeros);
    }
}
```

## code.cpp
```cpp
struct WaveletTree {
    int lo, hi;
    vector<int> bits;
    WaveletTree *L = nullptr, *R = nullptr;
    WaveletTree(vector<int> a, int lo, int hi) : lo(lo), hi(hi) {
        bits.assign(a.size() + 1, 0);
        if (lo == hi || a.empty()) return;
        int mid = (lo + hi) >> 1;
        vector<int> left, right;
        for (size_t i = 0; i < a.size(); ++i) {
            int b = a[i] <= mid ? 0 : 1;
            bits[i + 1] = bits[i] + (1 - b);
            (b == 0 ? left : right).push_back(a[i]);
        }
        L = new WaveletTree(left, lo, mid);
        R = new WaveletTree(right, mid + 1, hi);
    }
    int kth(int l, int r, int k) {
        if (lo == hi) return lo;
        int zeros = bits[r + 1] - bits[l];
        if (k <= zeros) return L->kth(bits[l], bits[r + 1] - 1, k);
        return R->kth(l - bits[l], r - bits[r + 1], k - zeros);
    }
};
```
