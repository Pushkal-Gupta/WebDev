---
slug: sparse-table
module: arrays-searching
title: Sparse Table
subtitle: Answer immutable range queries (min, max, gcd) in O(1) after O(n log n) preprocessing.
difficulty: Advanced
position: 20
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Bender & Farach-Colton — The LCA problem revisited"
    url: ""
status: published
---

## intro
You have an array of `n` numbers and many queries asking for the min (or max, or gcd) over `[l, r]`. If the array never changes, you can answer each query in **O(1)** after a one-time `O(n log n)` preprocessing using a sparse table — a 2D structure that stores the answer for every power-of-two-length window.

## whyItMatters
Sparse table is the gold standard for **static range queries on idempotent operations** — operations where querying overlapping halves gives the same answer as querying disjoint halves (min, max, gcd, bitwise AND/OR). For mutable arrays you'd use a segment tree (O(log n) per query/update); when the array is read-only, sparse table is strictly faster per query and simpler to code.

## intuition
For each position `i` and each power-of-two length `2^k`, precompute the answer over `arr[i..i+2^k-1]`. To answer `[l, r]`:
1. Let `k = floor(log2(r - l + 1))` — the largest power of two that fits.
2. Take the min (or whatever idempotent op) of the precomputed window starting at `l` and the one ending at `r`. They overlap, but for idempotent ops that's fine: `min(min(A), min(A)) = min(A)`.

That overlap trick is what makes the query O(1).

## visualization
```
arr = [5, 2, 4, 1, 7, 3, 9, 8]   (n = 8)

table[k][i] = min over arr[i .. i + 2^k - 1]
k=0:  5  2  4  1  7  3  9  8
k=1:  2  2  1  1  3  3  8
k=2:  1  1  1  1  3
k=3:  1

Query [1, 6] → length 6, k = floor(log2(6)) = 2 → 2^k = 4
  → min( table[2][1], table[2][6-4+1] ) = min(table[2][1], table[2][3]) = min(1, 1) = 1
```

## bruteForce
Scan `arr[l..r]` for every query → O(n) per query, O(n·Q) total. Fine for small inputs, dies on Q = 10^5 with n = 10^5.

## optimal
Preprocessing:
```
log2 = precompute floor(log2(i)) for i = 1..n
table[0][i] = arr[i]
for k from 1 while 2^k <= n:
    for i from 0 while i + 2^k - 1 < n:
        table[k][i] = min(table[k-1][i], table[k-1][i + 2^(k-1)])
```
Total cost `O(n log n)` time and space.

Query `[l, r]`:
```
k = log2[r - l + 1]
return min(table[k][l], table[k][r - 2^k + 1])
```
O(1) after the precompute.

Works for any **idempotent associative** operation: min, max, gcd, lcm (with overflow care), bitwise AND/OR. Does **not** work for sum, xor, product — for those you need a prefix array or segment tree.

## complexity
- **Preprocessing**: O(n log n) time and space.
- **Query**: O(1).
- **Update**: not supported. If the array changes, rebuild from scratch or switch to a segment tree.

## pitfalls
- **Trying to use it for sum/xor**: those aren't idempotent. The overlap doublecounts. Use prefix arrays instead.
- **Off-by-one in the second window**: it's `table[k][r - 2^k + 1]`, not `r - 2^k`.
- **Forgetting to precompute log table**: calling `Math.log2` inside the query loop is slow.
- **Bounds**: when `2^k > n`, stop building. Indices go negative if you don't.
- **Memory**: `O(n log n)` ints for n = 10^6 is ~20M entries — about 80MB. Plan for it.

## interviewTips
- Recognize the trigger: "static array, many range min/max/gcd queries." That's a sparse table.
- Compare with **segment tree** explicitly: "sparse table is O(1) query but doesn't support updates; segment tree is O(log n) for both."
- Mention the **idempotency** requirement — interviewers love precision on what makes the trick work.
- For LCA on trees, the **Euler tour + sparse table** combo gives O(1) LCA after O(n log n) preprocessing — that's the classic application.

## code.python
```python
import math
class SparseTableMin:
    def __init__(self, arr):
        n = len(arr)
        K = max(1, int(math.log2(n)) + 1) if n else 1
        self.log = [0] * (n + 1)
        for i in range(2, n + 1): self.log[i] = self.log[i // 2] + 1
        self.t = [[0]*n for _ in range(K)]
        self.t[0] = arr[:]
        k = 1
        while (1 << k) <= n:
            i = 0
            while i + (1 << k) <= n:
                self.t[k][i] = min(self.t[k-1][i], self.t[k-1][i + (1 << (k-1))])
                i += 1
            k += 1
    def query(self, l, r):
        k = self.log[r - l + 1]
        return min(self.t[k][l], self.t[k][r - (1 << k) + 1])

st = SparseTableMin([5, 2, 4, 1, 7, 3, 9, 8])
print(st.query(1, 6))  # 1
```

## code.javascript
```javascript
class SparseTableMin {
  constructor(arr) {
    const n = arr.length;
    const K = Math.max(1, Math.floor(Math.log2(n)) + 1);
    this.log = new Int32Array(n + 1);
    for (let i = 2; i <= n; i++) this.log[i] = this.log[i >> 1] + 1;
    this.t = Array.from({ length: K }, () => new Int32Array(n));
    for (let i = 0; i < n; i++) this.t[0][i] = arr[i];
    for (let k = 1; (1 << k) <= n; k++) {
      for (let i = 0; i + (1 << k) <= n; i++) {
        this.t[k][i] = Math.min(this.t[k-1][i], this.t[k-1][i + (1 << (k-1))]);
      }
    }
  }
  query(l, r) {
    const k = this.log[r - l + 1];
    return Math.min(this.t[k][l], this.t[k][r - (1 << k) + 1]);
  }
}
```

## code.java
```java
class SparseTableMin {
    int[] log;
    int[][] t;
    SparseTableMin(int[] a) {
        int n = a.length, K = Math.max(1, (int)(Math.log(n) / Math.log(2)) + 1);
        log = new int[n + 1];
        for (int i = 2; i <= n; i++) log[i] = log[i / 2] + 1;
        t = new int[K][n];
        for (int i = 0; i < n; i++) t[0][i] = a[i];
        for (int k = 1; (1 << k) <= n; k++)
            for (int i = 0; i + (1 << k) <= n; i++)
                t[k][i] = Math.min(t[k-1][i], t[k-1][i + (1 << (k-1))]);
    }
    int query(int l, int r) {
        int k = log[r - l + 1];
        return Math.min(t[k][l], t[k][r - (1 << k) + 1]);
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <cmath>
#include <algorithm>
struct SparseTableMin {
    std::vector<int> log;
    std::vector<std::vector<int>> t;
    SparseTableMin(const std::vector<int>& a) {
        int n = a.size(), K = std::max(1, (int)std::log2(n) + 1);
        log.assign(n + 1, 0);
        for (int i = 2; i <= n; i++) log[i] = log[i / 2] + 1;
        t.assign(K, std::vector<int>(n));
        for (int i = 0; i < n; i++) t[0][i] = a[i];
        for (int k = 1; (1 << k) <= n; k++)
            for (int i = 0; i + (1 << k) <= n; i++)
                t[k][i] = std::min(t[k-1][i], t[k-1][i + (1 << (k-1))]);
    }
    int query(int l, int r) {
        int k = log[r - l + 1];
        return std::min(t[k][l], t[k][r - (1 << k) + 1]);
    }
};
```
