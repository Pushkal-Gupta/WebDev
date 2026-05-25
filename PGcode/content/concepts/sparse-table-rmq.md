---
slug: sparse-table-rmq
module: arrays-range-structures
title: Sparse Table for RMQ
subtitle: O(n log n) preprocess, O(1) range-min query — for idempotent operations on immutable arrays.
difficulty: Advanced
position: 21
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Sparse Table (RMQ)"
    url: "https://cp-algorithms.com/data_structures/sparse-table.html"
    type: blog
  - title: "kth-competitive-programming/kactl — sparse table templates"
    url: "https://github.com/kth-competitive-programming/kactl"
    type: repo
status: published
---

## intro
A sparse table answers range-min queries (RMQ) — or any *idempotent* associative operation: min, max, gcd, bitwise AND/OR — on an immutable array in O(1) per query, after O(n log n) preprocessing. The trick: precompute the operation over every range whose length is a power of two; then any arbitrary range can be covered by two of these power-of-two ranges, possibly overlapping.

## whyItMatters
When the array never changes and you have many queries, a sparse table is the fastest practical option — beats segment trees (`O(log n)` per query) and Fenwick trees by a constant factor, with simpler code. It is the workhorse behind LCA (lowest common ancestor) via Euler tour plus RMQ (Bender & Farach-Colton 2000), behind several suffix-array construction algorithms (kasai's LCP array uses it), and behind offline range-min subproblems that arise in DP optimization (the Knuth-Yao monotonicity speedup). Used in competitive-programming templates, in succinct data structures (the FM-index for full-text search), and in static analytics systems where the data is loaded once and queried many times. For mutable arrays sparse table is wrong — use a segment tree — but for read-heavy immutable workloads it is untouchable.

## intuition
Define `st[k][i]` = min of `arr[i .. i + 2^k - 1]`. Build bottom-up: `st[0][i] = arr[i]`; `st[k][i] = min(st[k-1][i], st[k-1][i + 2^{k-1}])`. There are `O(n log n)` table entries and each is the merge of two predecessors, so the whole table builds in `O(n log n)` time and space.

To query an arbitrary range `[L, R]` of length `len = R - L + 1`, pick `k = floor(log2(len))`. The two precomputed intervals `[L, L + 2^k - 1]` and `[R - 2^k + 1, R]` both have length `2^k` and together cover `[L, R]` (they may overlap). Because min is *idempotent* — `min(x, x) = x` — the overlap does not double-count. The answer is `min(st[k][L], st[k][R - 2^k + 1])`.

That overlap trick is the entire reason sparse table is `O(1)` per query instead of `O(log n)`. Segment trees and Fenwick trees cannot use it because they support sum, which is *not* idempotent — adding the same element twice double-counts. So sparse table trades flexibility (no point updates, only idempotent ops like min, max, gcd, bitwise AND, bitwise OR) for raw query speed and simplicity. Combined with the Euler-tour technique and Cartesian-tree linearization, you get true `O(n)` preprocessing and `O(1)` per RMQ query — optimal for the problem.

## visualization
```
arr = [3, 1, 4, 1, 5, 9, 2, 6]
                index 0 1 2 3 4 5 6 7

st[0] (len 1): [3, 1, 4, 1, 5, 9, 2, 6]
st[1] (len 2): [1, 1, 1, 1, 5, 2, 2,  ]   # st[1][i] = min(arr[i], arr[i+1])
st[2] (len 4): [1, 1, 1, 1, 2,  ,  ,  ]   # st[2][i] = min of 4 elements
st[3] (len 8): [1,  ,  ,  ,  ,  ,  ,  ]

query(L=2, R=6): len = 5, k = 2 (2^2 = 4 <= 5)
  range A: st[2][2] = min(4,1,5,9) = 1
  range B: st[2][6 - 4 + 1] = st[2][3] = min(1,5,9,2) = 1
  answer = min(1, 1) = 1
```

## bruteForce
Linear scan per query: for each [L, R], walk from L to R and track the running minimum. O(n) per query, O(n*q) total — fine for tiny inputs, fatal for n = q = 10^5. A segment tree gives O(log n) per query at O(n) preprocessing but is more code and more cache-miss-prone than sparse table for purely-read workloads.

## optimal
Build `st[k][i]` for `k = 0 .. floor(log2(n))` and `i = 0 .. n - 2^k`. Precompute `log2[len]` for fast lookup during queries.

```python
import math

class SparseTableRMQ:
    def __init__(self, arr):
        n = len(arr)
        K = max(1, n.bit_length())
        self.log2 = [0] * (n + 1)
        for i in range(2, n + 1):
            self.log2[i] = self.log2[i // 2] + 1
        self.st = [arr[:]]
        for k in range(1, K):
            prev = self.st[k - 1]
            length = 1 << k
            half = 1 << (k - 1)
            row = []
            for i in range(n - length + 1):
                row.append(min(prev[i], prev[i + half]))
            self.st.append(row)
    def query(self, l, r):
        k = self.log2[r - l + 1]
        return min(self.st[k][l], self.st[k][r - (1 << k) + 1])
```

The critical lines are the precomputed `log2` table (avoids a `math.log2` call inside the hot path) and the overlapping-windows pair `(self.st[k][l], self.st[k][r - (1 << k) + 1])`. The two windows of length `2^k` together cover `[l, r]` with overlap, which is fine for idempotent ops. Switch to a segment tree when you need point updates or non-idempotent ops (sum, product). For RMQ specifically, the Bender-Farach-Colton paper shows that combining sparse table with Cartesian-tree linearization gives true `O(n)` preprocessing and `O(1)` query — the optimal complexity, used inside every modern LCA implementation (linear preprocessing for the LCA, constant-time queries thereafter). For very large arrays where memory matters, switch to *succinct* representations like Fischer-Heun's `2n + o(n)`-bit RMQ structure, used inside the `sdsl-lite` library.

## complexity
time: O(n log n) preprocessing, O(1) per query.
space: O(n log n) for the table — ~22 * n longs at n = 10^6, so ~170 MB; rebuild from a single base array if memory is tight.
notes: Idempotency is required — works for min, max, gcd, bitwise AND/OR. For sum or product (non-idempotent), use a prefix array (sum) or a different structure. For sum queries, a prefix-sum array gives O(1) without the log factor in space.

## pitfalls
- Trying to use sparse table for sum or XOR — they're not idempotent. XOR works iff the ranges *don't* overlap; sparse table queries deliberately overlap, so XOR breaks.
- Computing `log2[len]` with floating-point math — accumulated error gives the wrong k near powers of two. Use the precomputed integer table or `31 - __builtin_clz(len)` in C/C++.
- Forgetting the `i + 2^(k-1)` bound in the build loop — out-of-bounds read.
- Updating the underlying array after building — the table is now stale. Sparse tables are for immutable arrays only.
- Mixing inclusive and exclusive endpoints — pick `[L, R]` inclusive and stick to it; off-by-one is the #1 source of WA.

## interviewTips
- Lead with "O(n log n) preprocess, O(1) query, idempotent ops only." This signals you know the constraint.
- Be ready to contrast with segment trees: sparse table is faster per query but doesn't support updates; segment tree supports updates at O(log n) per query.
- Mention LCA-via-Euler-tour-plus-RMQ as the showcase application — it converts a tree problem to a flat-array RMQ problem, and the O(1) per query is precisely why sparse tables shine there.
- For the rare interview that asks about RMQ with O(n) preprocessing and O(1) query, mention Fischer–Heun (Cartesian-tree + ±1 RMQ) as the theoretical answer — rarely implemented in practice but a strong signal.

## code.python
```python
import math

class SparseTableMin:
    def __init__(self, arr):
        n = len(arr)
        self.n = n
        self.log = [0] * (n + 1)
        for i in range(2, n + 1):
            self.log[i] = self.log[i >> 1] + 1
        K = self.log[n] + 1 if n else 1
        self.st = [arr[:]]
        for k in range(1, K):
            prev, half = self.st[k - 1], 1 << (k - 1)
            cur = [0] * (n - (1 << k) + 1)
            for i in range(len(cur)):
                cur[i] = min(prev[i], prev[i + half])
            self.st.append(cur)

    def query(self, l, r):
        k = self.log[r - l + 1]
        return min(self.st[k][l], self.st[k][r - (1 << k) + 1])
```

## code.javascript
```javascript
class SparseTableMin {
  constructor(arr) {
    const n = arr.length;
    this.n = n;
    this.log = new Int32Array(n + 1);
    for (let i = 2; i <= n; i++) this.log[i] = this.log[i >> 1] + 1;
    const K = n ? this.log[n] + 1 : 1;
    this.st = [Int32Array.from(arr)];
    for (let k = 1; k < K; k++) {
      const prev = this.st[k - 1];
      const half = 1 << (k - 1);
      const len = n - (1 << k) + 1;
      const cur = new Int32Array(len);
      for (let i = 0; i < len; i++) cur[i] = Math.min(prev[i], prev[i + half]);
      this.st.push(cur);
    }
  }
  query(l, r) {
    const k = this.log[r - l + 1];
    return Math.min(this.st[k][l], this.st[k][r - (1 << k) + 1]);
  }
}
```

## code.java
```java
public class SparseTableMin {
    private final int[][] st;
    private final int[] log;

    public SparseTableMin(int[] arr) {
        int n = arr.length;
        log = new int[n + 1];
        for (int i = 2; i <= n; i++) log[i] = log[i >> 1] + 1;
        int K = n > 0 ? log[n] + 1 : 1;
        st = new int[K][];
        st[0] = arr.clone();
        for (int k = 1; k < K; k++) {
            int half = 1 << (k - 1);
            int len = n - (1 << k) + 1;
            st[k] = new int[len];
            for (int i = 0; i < len; i++) st[k][i] = Math.min(st[k - 1][i], st[k - 1][i + half]);
        }
    }
    public int query(int l, int r) {
        int k = log[r - l + 1];
        return Math.min(st[k][l], st[k][r - (1 << k) + 1]);
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>

class SparseTableMin {
    std::vector<std::vector<int>> st;
    std::vector<int> lg;
public:
    SparseTableMin(const std::vector<int>& arr) {
        int n = (int) arr.size();
        lg.assign(n + 1, 0);
        for (int i = 2; i <= n; i++) lg[i] = lg[i >> 1] + 1;
        int K = n > 0 ? lg[n] + 1 : 1;
        st.assign(K, {});
        st[0] = arr;
        for (int k = 1; k < K; k++) {
            int half = 1 << (k - 1);
            int len = n - (1 << k) + 1;
            st[k].resize(len);
            for (int i = 0; i < len; i++)
                st[k][i] = std::min(st[k - 1][i], st[k - 1][i + half]);
        }
    }
    int query(int l, int r) const {
        int k = lg[r - l + 1];
        return std::min(st[k][l], st[k][r - (1 << k) + 1]);
    }
};
```
