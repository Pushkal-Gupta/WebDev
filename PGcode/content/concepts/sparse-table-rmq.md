---
slug: sparse-table-rmq
module: arrays-searching
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
When the array never changes and you have many queries, a sparse table is the fastest practical option — beats segment trees (O(log n) per query) and Fenwick trees by a constant factor, with simpler code. It's the workhorse behind LCA (lowest common ancestor) via Euler tour + RMQ, behind several suffix-array algorithms, and behind offline range-min subproblems that arise in DP optimization. For mutable arrays, sparse table is wrong — use a segment tree — but for read-heavy immutable workloads it's untouchable.

## intuition
Define `st[k][i]` = min of arr[i ... i + 2^k - 1]. Build bottom-up: `st[0][i] = arr[i]`; `st[k][i] = min(st[k-1][i], st[k-1][i + 2^(k-1)])`. To query [L, R] of length len = R - L + 1, let k = floor(log2(len)). The two ranges [L, L + 2^k - 1] and [R - 2^k + 1, R] together cover [L, R] (they overlap). Because min is *idempotent* — min(x, x) = x — the overlap doesn't double-count. The answer is `min(st[k][L], st[k][R - 2^k + 1])`.

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
Build `st[k][i]` for k = 0 .. floor(log2(n)) and i = 0 .. n - 2^k. Precompute `log2[len]` for fast lookup during queries.

```
build(arr):
    n = len(arr)
    K = floor(log2(n)) + 1
    st = 2D array [K][n]
    for i in 0..n-1: st[0][i] = arr[i]
    for k in 1..K-1:
        for i in 0..n - 2^k:
            st[k][i] = min(st[k-1][i], st[k-1][i + 2^(k-1)])
    return st

log2 = [0] * (n + 1)
for i in 2..n: log2[i] = log2[i/2] + 1

query(L, R):
    k = log2[R - L + 1]
    return min(st[k][L], st[k][R - 2^k + 1])
```

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
