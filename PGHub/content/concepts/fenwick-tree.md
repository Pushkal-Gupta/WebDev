---
slug: fenwick-tree
module: arrays-range-structures
title: Fenwick Tree
subtitle: Binary Indexed Tree — prefix sums with point updates in O(log n), 20 lines of code.
difficulty: Advanced
position: 30
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Fenwick Tree"
    url: "https://cp-algorithms.com/data_structures/fenwick.html"
    type: blog
  - title: "indy256/codelibrary — Fenwick tree implementations"
    url: "https://github.com/indy256/codelibrary"
    type: repo
status: published
---

## intro
A Fenwick tree (Binary Indexed Tree, BIT) supports two operations on an array of n values in O(log n) each: update a single element, and query the prefix sum from index 1 to i. It uses the same memory as the array itself, no recursion, no pointers — just one neat trick with the lowest set bit of an index.

## whyItMatters
Whenever you need running totals that change — leaderboards updated on every score, inversion counts during merge sort, range-frequency histograms, cumulative event counters — a plain prefix array forces O(n) per update. A segment tree solves it in O(log n) but with 4n memory and a recursive build. The Fenwick tree gets the same O(log n) per op with n memory and a five-line update loop, which is why it is the go-to weapon for online prefix-sum problems and a frequent interview surprise: a senior candidate who reaches for it immediately signals comfort with non-trivial data structures.

## intuition
Index i is responsible for a block whose length equals the lowest set bit of i. Index 12 (binary 1100) covers a block of size 4: positions 9..12. Index 8 (1000) covers a block of size 8: positions 1..8. To get prefix sum up to i, repeatedly subtract the lowest set bit, accumulating block sums along the way. To update position i, add the lowest set bit to walk up to every ancestor whose block contains i. The math turns a tree traversal into bit arithmetic.

## visualization
```
index :  1  2  3  4  5  6  7  8
binary: 01 10 11 100 101 110 111 1000
covers: 1  1-2 3 1-4  5  5-6 7  1-8

query(7) = tree[7] + tree[6] + tree[4]    (7 -> 6 -> 4 -> 0)
update(5,+x): tree[5]+=x; tree[6]+=x; tree[8]+=x   (5 -> 6 -> 8 -> >n)

lowbit(i) = i & -i      // isolate the lowest set bit
```

## bruteForce
Store the raw array. Update is O(1); prefix sum is O(n) by linear scan. Or store a running prefix-sum array: prefix sum becomes O(1) but every update forces O(n) to rewrite the suffix. Either choice is O(n) per operation in the worst direction. With 10^5 queries on a 10^5 array that is 10^10 work — far past time limit.

## optimal
The Fenwick tree balances both costs to O(log n). Two operations, both walking through at most log2(n) indices:
1. update(i, delta): while i <= n, tree[i] += delta; i += i & -i.
2. query(i) (prefix sum 1..i): sum = 0; while i > 0, sum += tree[i]; i -= i & -i; return sum.

Range sum [l..r] = query(r) - query(l-1). To support range updates with point queries, store deltas in a Fenwick over the difference array; for range update + range query, run two BITs (the "two-BIT trick"). Build in O(n) by adding each value once and propagating to the immediate parent (i + lowbit(i)).

## complexity
- time: update O(log n), query O(log n), build O(n).
- space: O(n) — exactly one extra array of length n+1 (1-indexed).
- tradeoff vs segment tree: smaller constant factor, simpler code, no lazy propagation, can only handle invertible operations (sum, xor) — not min/max without extra tricks.

## pitfalls
- Off-by-one: BIT is naturally 1-indexed. Always allocate size n+1 and translate user indices.
- Using min/max as the aggregation — Fenwick relies on being able to subtract block contributions. Use a segment tree for non-invertible monoids.
- Overflow when accumulating sums of large values — use 64-bit integers.
- Calling update with delta = 0 inside a loop is harmless but wastes time; gate it.
- Forgetting that `query(l-1)` needs l >= 1; otherwise return 0.

## interviewTips
- Trigger phrases: "online prefix sum", "count inversions", "rank queries", "k-th smallest with updates", "running median (combined with a balanced tree or two BITs)".
- Open with the complexity pitch: "Prefix array is O(1)/O(n); segment tree is O(log n)/O(log n) with 4n memory; Fenwick gives me O(log n)/O(log n) with n memory and ten lines of code."
- Coordinate-compress when values are large but few distinct: map them to [1..k] and run BIT over k. Comes up constantly in inversion-count and offline range problems.
- Mention the two-BIT trick for range update + range query as a follow-up — it is the difference between mid and senior signal.

## code.python
```python
class Fenwick:
    def __init__(self, n):
        self.n = n
        self.t = [0] * (n + 1)

    def update(self, i, delta):
        while i <= self.n:
            self.t[i] += delta
            i += i & -i

    def query(self, i):
        s = 0
        while i > 0:
            s += self.t[i]
            i -= i & -i
        return s

    def range_sum(self, l, r):
        return self.query(r) - self.query(l - 1)

def count_inversions(arr):
    vals = sorted(set(arr))
    rank = {v: i + 1 for i, v in enumerate(vals)}
    bit = Fenwick(len(vals))
    inv = 0
    for x in reversed(arr):
        inv += bit.query(rank[x] - 1)
        bit.update(rank[x], 1)
    return inv
```

## code.javascript
```javascript
class Fenwick {
  constructor(n) {
    this.n = n;
    this.t = new Array(n + 1).fill(0);
  }
  update(i, delta) {
    for (; i <= this.n; i += i & -i) this.t[i] += delta;
  }
  query(i) {
    let s = 0;
    for (; i > 0; i -= i & -i) s += this.t[i];
    return s;
  }
  rangeSum(l, r) {
    return this.query(r) - this.query(l - 1);
  }
}

function countInversions(arr) {
  const sorted = [...new Set(arr)].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i + 1]));
  const bit = new Fenwick(sorted.length);
  let inv = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    inv += bit.query(rank.get(arr[i]) - 1);
    bit.update(rank.get(arr[i]), 1);
  }
  return inv;
}
```

## code.java
```java
class Fenwick {
    int n;
    long[] t;
    Fenwick(int n) { this.n = n; this.t = new long[n + 1]; }

    void update(int i, long delta) {
        for (; i <= n; i += i & -i) t[i] += delta;
    }
    long query(int i) {
        long s = 0;
        for (; i > 0; i -= i & -i) s += t[i];
        return s;
    }
    long rangeSum(int l, int r) { return query(r) - query(l - 1); }
}

public long countInversions(int[] arr) {
    int[] sorted = Arrays.stream(arr).distinct().sorted().toArray();
    Map<Integer, Integer> rank = new HashMap<>();
    for (int i = 0; i < sorted.length; i++) rank.put(sorted[i], i + 1);
    Fenwick bit = new Fenwick(sorted.length);
    long inv = 0;
    for (int i = arr.length - 1; i >= 0; i--) {
        int r = rank.get(arr[i]);
        inv += bit.query(r - 1);
        bit.update(r, 1);
    }
    return inv;
}
```

## code.cpp
```cpp
struct Fenwick {
    int n;
    vector<long long> t;
    Fenwick(int n) : n(n), t(n + 1, 0) {}

    void update(int i, long long delta) {
        for (; i <= n; i += i & -i) t[i] += delta;
    }
    long long query(int i) {
        long long s = 0;
        for (; i > 0; i -= i & -i) s += t[i];
        return s;
    }
    long long rangeSum(int l, int r) { return query(r) - query(l - 1); }
};

long long countInversions(vector<int>& arr) {
    vector<int> sorted(arr.begin(), arr.end());
    sort(sorted.begin(), sorted.end());
    sorted.erase(unique(sorted.begin(), sorted.end()), sorted.end());
    Fenwick bit(sorted.size());
    long long inv = 0;
    for (int i = arr.size() - 1; i >= 0; i--) {
        int r = lower_bound(sorted.begin(), sorted.end(), arr[i]) - sorted.begin() + 1;
        inv += bit.query(r - 1);
        bit.update(r, 1);
    }
    return inv;
}
```
