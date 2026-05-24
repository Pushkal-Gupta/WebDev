---
slug: fenwick-bit
module: arrays-searching
title: Fenwick Tree (BIT)
subtitle: Binary Indexed Tree for prefix sums with O(log n) point update and range query.
difficulty: Intermediate
position: 33
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Fenwick Tree — cp-algorithms"
    url: "https://cp-algorithms.com/data_structures/fenwick.html"
    type: blog
  - title: "Binary Indexed Tree or Fenwick Tree — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/binary-indexed-tree-or-fenwick-tree-2/"
    type: blog
  - title: "TheAlgorithms/Python — fenwick_tree.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/fenwick_tree.py"
    type: repo
status: published
---

## intro
A Fenwick tree, also called a Binary Indexed Tree (BIT), is a compact structure built on top of an array that supports two operations in O(log n): increment any element by a delta and query the prefix sum up to any index. It uses one extra array of the same length and a small bit-trick — `i & -i` — to decide which index to jump to next. It is the answer when you want segment-tree power but with smaller code, less memory, and a tighter constant.

## whyItMatters
Many problems ask "after each update, what is sum / count / inversions in this range?" — order-statistic queries, counting smaller elements to the right, merge-sort-style inversion counting, 2D point-add / rectangle-sum on a coordinate grid. A plain prefix-sum array is O(1) query but O(n) update. A naive recompute is the reverse. Fenwick balances them at O(log n) for both, with code so short you can write it in an interview without bugs.

## intuition
Think of every index i in 1..n as covering a range of size `i & -i` ending at i. So `bit[12]` (= 0b1100) covers indices 9..12; `bit[8]` covers 1..8; `bit[10]` covers 9..10. To get a prefix sum at i, jump backwards: i → i - (i & -i) → ..., accumulating. To update index i, jump forwards: i → i + (i & -i) → ..., adding the delta to every node whose range covers i. The trick `i & -i` isolates the lowest set bit, and each jump turns one bit off (or on), so at most O(log n) jumps happen.

## visualization
```
Indices 1..8 with i & -i (the range size):
i:      1  2  3  4  5  6  7  8
i&-i:   1  2  1  4  1  2  1  8
covers: [1][1-2][3][1-4][5][5-6][7][1-8]

prefix_sum(7):  7 -> 6 -> 4 -> 0  ->  bit[7] + bit[6] + bit[4]
update(5, +x):  5 -> 6 -> 8 -> end ->  bit[5] += x; bit[6] += x; bit[8] += x;
```

## bruteForce
Keep the array as-is. Update is O(1) (`a[i] += delta`), but prefix sum scans `a[1..i]` for O(n). Alternatively keep a prefix-sum array: query is O(1), but every update must rebuild the suffix, again O(n). For one of update or query, one of the two is fast; for both fast, you need a tree.

## optimal
Maintain `bit[1..n]` (1-indexed). `update(i, delta)`: while i <= n, `bit[i] += delta; i += i & -i`. `prefix(i)`: while i > 0, `s += bit[i]; i -= i & -i`. `range_sum(l, r) = prefix(r) - prefix(l-1)`. Build in O(n log n) via repeated update, or O(n) by initialising `bit[i] = a[i]` then `bit[i + (i & -i)] += bit[i]` for i in 1..n with i+(i&-i) <= n.

```
update(i, delta):
    while i <= n:
        bit[i] += delta
        i += i & -i

prefix(i):
    s = 0
    while i > 0:
        s += bit[i]
        i -= i & -i
    return s
```

## complexity
time: O(log n) per update and per prefix query; O(n) to build with the linear method.
space: O(n) auxiliary.
notes: Constant factor is tiny — a few additions and bit-ops per level. 2D Fenwick handles point-add / rectangle-sum in O(log n * log m). Range update + point query is a one-line variant using a difference array on top of a BIT.

## pitfalls
- Off-by-one: BITs are conventionally 1-indexed. Mixing 0-indexed with `i & -i` breaks the math because `0 & 0 = 0`, the loop never advances.
- Signed-int overflow: with `long` updates and `int` BIT, partial sums overflow silently. Use 64-bit when in doubt.
- Range-update + range-query needs two BITs and is the most common BIT variant interviewers test as a follow-up.
- For "count of values <= x" on a dynamic set, you need to compress coordinates first if values are large.
- Confusing prefix(i) with the value at i: `a[i] = prefix(i) - prefix(i-1)`, not `bit[i]`.

## interviewTips
- Mention the `i & -i` trick by name — interviewers grade on whether you can justify why each loop runs log n times (one bit flips per step).
- For "count inversions in O(n log n) without merge-sort", reach for a BIT over compressed indices.
- Compare with segment trees: BIT is shorter and faster for sum / xor / min-over-prefix, but only segment trees handle arbitrary range updates with lazy propagation.
- 2D BIT is a great follow-up signal: it shows you understand `update / prefix` as independent loops over two dimensions.

## code.python
```python
class BIT:
    def __init__(self, n):
        self.n = n; self.bit = [0] * (n + 1)

    def update(self, i, delta):
        while i <= self.n:
            self.bit[i] += delta
            i += i & -i

    def prefix(self, i):
        s = 0
        while i > 0:
            s += self.bit[i]
            i -= i & -i
        return s

    def range_sum(self, l, r):
        return self.prefix(r) - self.prefix(l - 1)
```

## code.javascript
```javascript
class BIT {
  constructor(n) { this.n = n; this.bit = new Array(n + 1).fill(0); }
  update(i, delta) {
    for (; i <= this.n; i += i & -i) this.bit[i] += delta;
  }
  prefix(i) {
    let s = 0;
    for (; i > 0; i -= i & -i) s += this.bit[i];
    return s;
  }
  rangeSum(l, r) { return this.prefix(r) - this.prefix(l - 1); }
}
```

## code.java
```java
class BIT {
    int n;
    long[] bit;
    BIT(int n) { this.n = n; this.bit = new long[n + 1]; }

    void update(int i, long delta) {
        for (; i <= n; i += i & -i) bit[i] += delta;
    }
    long prefix(int i) {
        long s = 0;
        for (; i > 0; i -= i & -i) s += bit[i];
        return s;
    }
    long rangeSum(int l, int r) { return prefix(r) - prefix(l - 1); }
}
```

## code.cpp
```cpp
#include <vector>
struct BIT {
    int n;
    std::vector<long long> bit;
    BIT(int n_) : n(n_), bit(n_ + 1, 0) {}

    void update(int i, long long delta) {
        for (; i <= n; i += i & -i) bit[i] += delta;
    }
    long long prefix(int i) const {
        long long s = 0;
        for (; i > 0; i -= i & -i) s += bit[i];
        return s;
    }
    long long range_sum(int l, int r) const { return prefix(r) - prefix(l - 1); }
};
```
