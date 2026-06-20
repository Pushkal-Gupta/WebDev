---
slug: sparse-table-rmq-deep
module: arrays-range-structures
title: Sparse Table — Idempotency, Disjoint Mode, and Linear RMQ
subtitle: Why the overlap trick works only for idempotent ops, how to recover non-idempotent operations with disjoint sparse tables, and the Fischer-Heun route to O(n) preprocess + O(1) RMQ.
difficulty: Advanced
position: 50
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "Sparse Table — cp-algorithms (idempotent ops, RMQ variants)"
    url: "https://cp-algorithms.com/data_structures/sparse-table.html"
    type: blog
  - title: "Range Minimum Query — Wikipedia (BFC, Fischer-Heun, ±1 RMQ)"
    url: "https://en.wikipedia.org/wiki/Range_minimum_query"
    type: blog
  - title: "Bender & Farach-Colton — The LCA Problem Revisited (2000)"
    url: "https://www.ics.uci.edu/~eppstein/261/BeFa-LCA-00.pdf"
    type: paper
status: published
---

## intro
Sparse table is the textbook "O(n log n) preprocess, O(1) query" structure for static range minimum, max, gcd, and bitwise AND/OR. The standard explanation glosses two questions: *why* the overlap trick works only for idempotent operations, and *what to do when it does not*. This page tackles both. It also walks the Bender-Farach-Colton chain of reductions that pushes range-minimum query (RMQ) down to O(n) preprocessing with O(1) queries — the theoretically optimal answer.

## whyItMatters
"Static array, many range queries" is the kind of problem that hides inside half of all interview design rounds: range-min for LCA-by-Euler-tour, range-gcd for divisibility scans, range-AND for permission-mask sweeps, range-max for histogram queries. Reach for a segment tree by reflex and you pay O(log n) per query — fine for `10^5` queries, painful for `10^7`. Sparse table is O(1) per query at the same preprocessing cost, with a fraction of the code. Knowing exactly when it applies, and what the fallback for sum / xor looks like, is the difference between shipping the obvious O(log n) and the tighter solution. The linear-preprocessing RMQ is rarely implemented in practice but appears in succinct-data-structure libraries (sdsl-lite) and in any LCA implementation that needs to be tight on both preprocessing and query.

## intuition
Two questions, two short answers.

**Why does the overlap trick require idempotency?** A sparse-table query for `op` over `[l, r]` of length `len` returns `op(st[k][l], st[k][r - 2^k + 1])`, where `k = floor(log2(len))`. The two windows together cover `[l, r]` but overlap unless `len` is itself a power of two. For overlap to be harmless, the operation must satisfy `op(a, a) = a` — that is, the operation is *idempotent*. Min, max, gcd, bitwise AND, bitwise OR all satisfy this. Sum does not: `(a + a) != a`. So sparse table returns `5 + 5 = 10` instead of `5` for `sum` over an overlap of `{5}` — wrong answer.

**What if you need non-idempotent ops with O(1) query and you accept O(n log n) preprocessing?** Use a *disjoint sparse table*. The idea: split `[l, r]` at the highest bit where `l` and `r` differ. The split point `m` is uniquely determined by `l XOR r`. Precompute, for every block of length `2^k`, the suffix-aggregate ending at `m` and the prefix-aggregate starting at `m`. Then `query(l, r) = op(suffix[k][l], prefix[k][r])` — *two disjoint reads*, no overlap, works for any associative operation including sum, product, xor, matrix multiplication. Preprocessing is still O(n log n). This is the answer to "how do I do O(1) range-sum on a static array without prefix sums?" — and the canonical generalization of the sparse table.

**Why does the linear-RMQ pipeline exist?** Sparse table's space is O(n log n). For very large arrays — `n = 10^9` for genome scans, for instance — that is too much memory. Bender and Farach-Colton (2000) showed RMQ on an arbitrary array reduces to RMQ on a `±1` array (where adjacent elements differ by exactly 1) via the Cartesian-tree Euler tour, and `±1` RMQ admits an O(n) preprocessing with O(1) queries using a two-level block decomposition. Block size `(log n) / 2`; inside each block, the shape of the local `±1` pattern fits in one of only `4^{(log n)/2} = sqrt(n)` distinct tables, which fit in O(sqrt(n) log n) total bits. Across blocks, run a regular sparse table over the per-block minima — but there are only `n / log n` such blocks, so that table is O((n / log n) * log(n / log n)) = O(n) bits. Total space and preprocessing: O(n). Query: constant. This is the theoretical floor for RMQ.

## visualization
```
arr = [3, 1, 4, 1, 5, 9, 2, 6]   indices 0..7

Standard sparse table for min:
st[0]: 3  1  4  1  5  9  2  6
st[1]: 1  1  1  1  5  2  2
st[2]: 1  1  1  1  2
st[3]: 1

query(l=2, r=6): len = 5, k = 2, 2^k = 4
   window A = st[2][2] = min(4,1,5,9) = 1
   window B = st[2][6 - 4 + 1] = st[2][3] = min(1,5,9,2) = 1
   answer = min(1, 1) = 1                             (OK: min is idempotent)

If we tried this with sum: window A sum = 4+1+5+9 = 19; window B sum = 1+5+9+2 = 17.
Range [2..6] inclusive has sum = 4+1+5+9+2 = 21. But 19 + 17 = 36 = 21 + 15 (double-count of {1,5,9}).
The overlap trick fails for sum -- need a disjoint sparse table.

Disjoint sparse table for sum:
At each level k, precompute prefix-and-suffix sums around the midpoint of every 2^k-length block.
query(l, r): k = highest bit where l XOR r differs;
             return suffix[k][l] + prefix[k][r]    (two disjoint half-block reads).
```

## bruteForce
Scan `arr[l..r]` per query: O(n) per query, O(nq) total. Builds nothing; survives only at tiny scales. Segment trees give O(log n) per query at O(n) preprocessing and support updates. Fenwick trees give O(log n) for sums with even less code. None of these reach O(1) per query for the static case.

## optimal
**Standard sparse table for idempotent ops.** `O(n log n)` preprocessing, `O(1)` query. The code is short enough that constant factors dominate; use TypedArrays (JS), `int[][]` (Java), `vector<vector<int>>` (C++) for cache locality.

```python
def build(arr, op):
    n = len(arr)
    log = [0] * (n + 1)
    for i in range(2, n + 1):
        log[i] = log[i >> 1] + 1
    K = log[n] + 1
    st = [arr[:]]
    for k in range(1, K):
        half = 1 << (k - 1)
        prev = st[k - 1]
        st.append([op(prev[i], prev[i + half]) for i in range(n - (1 << k) + 1)])
    return st, log

def query(st, log, l, r, op):
    k = log[r - l + 1]
    return op(st[k][l], st[k][r - (1 << k) + 1])
```

**Disjoint sparse table for non-idempotent ops.** For each level `k`, partition the array into blocks of length `2^k`. Within each block, compute suffix-aggregates ending at the block midpoint and prefix-aggregates starting at the midpoint. A query `[l, r]`: if both endpoints lie in the same block at the finest level, fall back to a small lookup; otherwise pick the level `k = highest_bit(l XOR r) + 1`, take the suffix-aggregate `dst[k][l]` and the prefix-aggregate `dst[k][r]`, combine. The two reads cover `[l, r]` exactly with no overlap, so the operation only needs to be associative.

**Linear-RMQ via Bender-Farach-Colton.** Build the Cartesian tree of the array in O(n). Its Euler tour is a `±1` sequence of length `2n - 1`. Reduce RMQ on the original to RMQ on the Euler tour. For `±1` RMQ: divide the tour into blocks of size `b = (log n) / 2`. Inside each block, the shape is one of `2^{b-1}` patterns of `±1` steps — precompute a lookup table per shape giving the answer for every `(i, j)` inside that block, total O(sqrt(n) * b^2) = O(sqrt(n) log^2 n) = o(n) bits. Across blocks, run a regular sparse table on the per-block minima — table size `O((n / b) log(n / b)) = O(n / log n * log n) = O(n)`. Final preprocessing and space are O(n); query is O(1) for either two within-block calls (same block) or one across-block sparse-table lookup plus two within-block calls (different blocks).

**When to reach for which.**
- Static array, idempotent op (min, max, gcd, AND, OR): standard sparse table.
- Static array, non-idempotent op (sum, xor, matrix mul): disjoint sparse table — or prefix-sum array for sum specifically.
- Static array, RMQ, memory constrained: Bender-Farach-Colton linear-RMQ.
- Mutable array: segment tree (O(log n) update / query) or Fenwick (O(log n) for prefix-style queries).
- Mutable array with insertions / deletions: implicit-key treap or order-statistic segment tree.

## complexity
- **Standard sparse table**: O(n log n) preprocessing, O(n log n) space, O(1) per query, idempotent ops only.
- **Disjoint sparse table**: O(n log n) preprocessing, O(n log n) space, O(1) per query, any associative op (sum, product, xor, matrix mul).
- **Linear-RMQ (Bender-Farach-Colton)**: O(n) preprocessing, O(n) space, O(1) per query — but constant factors and code complexity make this the textbook answer rather than the production answer.
- **Memory**: a 32-bit standard table on `n = 10^6` is roughly 80 MB (`n log n * 4` bytes). Use `int32` arrays even for `int64` data when min / max only — store the *index* of the extremum and reconstruct the value with one indirection. Halves the table size.

## pitfalls
- **Using sparse table for sum or XOR** — the overlap double-counts. Symptom: answers exactly double on power-of-two-length queries, slightly wrong on others. Switch to prefix sums or a disjoint sparse table.
- **Floating-point `log2` in the query hot path** — `log2(8) - 1e-16 == 2.9999..., floor = 2` is correct, but at very large `n` precision degrades and you get the wrong `k`. Always precompute the integer log table once at preprocess time.
- **Off-by-one in the second window** — it is `st[k][r - 2^k + 1]`, not `st[k][r - 2^k]`. Off by one truncates the second window and misses one element.
- **Not stopping the build loop at `(1 << k) > n`** — produces an empty top row and dereferences off the end on small inputs. Always guard with `while (1 << k) <= n`.
- **Storing values instead of indices for RMQ** — if you ever need the *index* of the minimum, return-by-value loses information. Store indices everywhere and look up the value through `arr[idx]` at the end.
- **Treating XOR as idempotent because `a XOR a = 0`** — that is the *opposite* of idempotency. `a XOR a` returning 0 means overlap silently zeroes. Use a disjoint table or a prefix-XOR array.

## interviewTips
- Lead with the idempotency requirement when you propose sparse table — "min / max / gcd / AND / OR only, O(1) query after O(n log n) preprocess". Senior interviewers ask why exactly those ops; the overlap argument is the cleanest answer.
- Mention the disjoint sparse table as the non-idempotent fallback. Few candidates know it; flagging it signals you have implemented sparse tables outside of textbook problems.
- For LCA on trees, sketch the Euler-tour + RMQ reduction in one sentence: "Flatten the tree by Euler tour, store depth, range-min on depth gives LCA." That is the canonical sparse-table application. Mention Bender-Farach-Colton for the linear-preprocessing flavor only if the interviewer drills into RMQ specifically — otherwise it is over-engineering.

## code.python
```python
class SparseTable:
    """O(n log n) preprocess, O(1) query, idempotent ops only (min/max/gcd/AND/OR)."""

    def __init__(self, arr, op=min):
        self.op = op
        n = len(arr)
        self.n = n
        self.log = [0] * (n + 1)
        for i in range(2, n + 1):
            self.log[i] = self.log[i >> 1] + 1
        K = self.log[n] + 1 if n else 1
        self.st = [list(arr)]
        for k in range(1, K):
            half = 1 << (k - 1)
            length = 1 << k
            prev = self.st[k - 1]
            row = [op(prev[i], prev[i + half]) for i in range(n - length + 1)]
            self.st.append(row)

    def query(self, l, r):
        k = self.log[r - l + 1]
        return self.op(self.st[k][l], self.st[k][r - (1 << k) + 1])


class DisjointSparseTable:
    """O(n log n) preprocess, O(1) query, any associative op (works for sum, xor, matrix mul)."""

    def __init__(self, arr, op):
        self.op = op
        self.arr = list(arr)
        n = len(arr)
        self.n = n
        self.log = [0] * (n + 1)
        for i in range(2, n + 1):
            self.log[i] = self.log[i >> 1] + 1
        K = max(1, self.log[n] + 1) if n else 1
        # rows[k][i] = aggregate from i toward the block midpoint at level k
        self.rows = [list(arr)]
        for k in range(1, K):
            block = 1 << k
            half = block >> 1
            row = list(arr)
            for left in range(0, n, block):
                mid = min(left + half, n)
                # suffix aggregates ending at mid - 1
                for i in range(mid - 2, left - 1, -1):
                    row[i] = op(row[i], row[i + 1])
                # prefix aggregates starting at mid
                for i in range(mid + 1, min(left + block, n)):
                    row[i] = op(row[i - 1], row[i])
            self.rows.append(row)

    def query(self, l, r):
        if l == r:
            return self.arr[l]
        k = self.log[l ^ r] + 1
        return self.op(self.rows[k][l], self.rows[k][r])


if __name__ == "__main__":
    arr = [3, 1, 4, 1, 5, 9, 2, 6]
    st_min = SparseTable(arr, min)
    assert st_min.query(2, 6) == 1
    assert st_min.query(4, 7) == 2

    dst_sum = DisjointSparseTable(arr, lambda a, b: a + b)
    assert dst_sum.query(2, 6) == 4 + 1 + 5 + 9 + 2  # 21
    assert dst_sum.query(0, 7) == sum(arr)
```

## code.javascript
```javascript
class SparseTable {
  constructor(arr, op = Math.min) {
    this.op = op;
    const n = arr.length;
    this.n = n;
    this.log = new Int32Array(n + 1);
    for (let i = 2; i <= n; i++) this.log[i] = this.log[i >> 1] + 1;
    const K = n ? this.log[n] + 1 : 1;
    this.st = [Array.from(arr)];
    for (let k = 1; k < K; k++) {
      const half = 1 << (k - 1);
      const len = n - (1 << k) + 1;
      const prev = this.st[k - 1];
      const row = new Array(len);
      for (let i = 0; i < len; i++) row[i] = op(prev[i], prev[i + half]);
      this.st.push(row);
    }
  }
  query(l, r) {
    const k = this.log[r - l + 1];
    return this.op(this.st[k][l], this.st[k][r - (1 << k) + 1]);
  }
}

class DisjointSparseTable {
  constructor(arr, op) {
    this.op = op;
    this.arr = Array.from(arr);
    const n = arr.length;
    this.n = n;
    this.log = new Int32Array(n + 1);
    for (let i = 2; i <= n; i++) this.log[i] = this.log[i >> 1] + 1;
    const K = n ? this.log[n] + 1 : 1;
    this.rows = [Array.from(arr)];
    for (let k = 1; k < K; k++) {
      const block = 1 << k, half = block >> 1;
      const row = Array.from(arr);
      for (let left = 0; left < n; left += block) {
        const mid = Math.min(left + half, n);
        for (let i = mid - 2; i >= left; i--) row[i] = op(row[i], row[i + 1]);
        const right = Math.min(left + block, n);
        for (let i = mid + 1; i < right; i++) row[i] = op(row[i - 1], row[i]);
      }
      this.rows.push(row);
    }
  }
  query(l, r) {
    if (l === r) return this.arr[l];
    const k = this.log[l ^ r] + 1;
    return this.op(this.rows[k][l], this.rows[k][r]);
  }
}

const arr = [3, 1, 4, 1, 5, 9, 2, 6];
const stMin = new SparseTable(arr, Math.min);
console.log(stMin.query(2, 6)); // 1
const dstSum = new DisjointSparseTable(arr, (a, b) => a + b);
console.log(dstSum.query(2, 6)); // 21
```

## code.java
```java
import java.util.function.IntBinaryOperator;

class SparseTable {
    final int[][] st;
    final int[] log;
    final IntBinaryOperator op;

    SparseTable(int[] arr, IntBinaryOperator op) {
        this.op = op;
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
            for (int i = 0; i < len; i++) st[k][i] = op.applyAsInt(st[k - 1][i], st[k - 1][i + half]);
        }
    }
    int query(int l, int r) {
        int k = log[r - l + 1];
        return op.applyAsInt(st[k][l], st[k][r - (1 << k) + 1]);
    }
}

class DisjointSparseTable {
    final int[][] rows;
    final int[] log;
    final int[] arr;
    final IntBinaryOperator op;

    DisjointSparseTable(int[] a, IntBinaryOperator op) {
        this.op = op;
        this.arr = a.clone();
        int n = a.length;
        log = new int[n + 1];
        for (int i = 2; i <= n; i++) log[i] = log[i >> 1] + 1;
        int K = n > 0 ? log[n] + 1 : 1;
        rows = new int[K][n];
        rows[0] = a.clone();
        for (int k = 1; k < K; k++) {
            int block = 1 << k, half = block >> 1;
            int[] row = a.clone();
            for (int left = 0; left < n; left += block) {
                int mid = Math.min(left + half, n);
                for (int i = mid - 2; i >= left; i--) row[i] = op.applyAsInt(row[i], row[i + 1]);
                int right = Math.min(left + block, n);
                for (int i = mid + 1; i < right; i++) row[i] = op.applyAsInt(row[i - 1], row[i]);
            }
            rows[k] = row;
        }
    }
    int query(int l, int r) {
        if (l == r) return arr[l];
        int k = log[l ^ r] + 1;
        return op.applyAsInt(rows[k][l], rows[k][r]);
    }
}
```

## code.cpp
```cpp
#include <bits/stdc++.h>
using namespace std;

template <class T, class Op>
struct SparseTable {
    vector<vector<T>> st;
    vector<int> lg;
    Op op;
    SparseTable(const vector<T>& a, Op op_) : op(op_) {
        int n = (int)a.size();
        lg.assign(n + 1, 0);
        for (int i = 2; i <= n; i++) lg[i] = lg[i >> 1] + 1;
        int K = n > 0 ? lg[n] + 1 : 1;
        st.assign(K, {});
        st[0] = a;
        for (int k = 1; k < K; k++) {
            int half = 1 << (k - 1);
            int len = n - (1 << k) + 1;
            st[k].resize(len);
            for (int i = 0; i < len; i++) st[k][i] = op(st[k - 1][i], st[k - 1][i + half]);
        }
    }
    T query(int l, int r) const {
        int k = lg[r - l + 1];
        return op(st[k][l], st[k][r - (1 << k) + 1]);
    }
};

template <class T, class Op>
struct DisjointSparseTable {
    vector<vector<T>> rows;
    vector<T> arr;
    vector<int> lg;
    Op op;
    DisjointSparseTable(const vector<T>& a, Op op_) : arr(a), op(op_) {
        int n = (int)a.size();
        lg.assign(n + 1, 0);
        for (int i = 2; i <= n; i++) lg[i] = lg[i >> 1] + 1;
        int K = n > 0 ? lg[n] + 1 : 1;
        rows.assign(K, vector<T>(n));
        rows[0] = a;
        for (int k = 1; k < K; k++) {
            int block = 1 << k, half = block >> 1;
            vector<T> row = a;
            for (int left = 0; left < n; left += block) {
                int mid = min(left + half, n);
                for (int i = mid - 2; i >= left; i--) row[i] = op(row[i], row[i + 1]);
                int right = min(left + block, n);
                for (int i = mid + 1; i < right; i++) row[i] = op(row[i - 1], row[i]);
            }
            rows[k] = row;
        }
    }
    T query(int l, int r) const {
        if (l == r) return arr[l];
        int k = lg[l ^ r] + 1;
        return op(rows[k][l], rows[k][r]);
    }
};

int main() {
    vector<int> a = {3, 1, 4, 1, 5, 9, 2, 6};
    SparseTable st(a, [](int x, int y){ return min(x, y); });
    cout << st.query(2, 6) << '\n';                 // 1
    DisjointSparseTable dst(a, [](int x, int y){ return x + y; });
    cout << dst.query(2, 6) << '\n';                // 21
}
```
