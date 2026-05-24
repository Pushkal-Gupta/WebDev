---
slug: range-update-range-query
module: arrays-searching
title: Range Update, Range Query
subtitle: Difference array for offline ranges; segment tree with lazy propagation for online.
difficulty: Advanced
position: 18
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Segment Tree (lazy propagation, range updates)"
    url: "https://cp-algorithms.com/data_structures/segment_tree.html"
    type: blog
  - title: "indy256/codelibrary — segment tree with lazy propagation"
    url: "https://github.com/indy256/codelibrary"
    type: repo
status: published
---

## intro
"Add `x` to every element from `l` to `r`. Then tell me the sum from `a` to `b`. Then add again. Then query again." Naive code is `O(n)` per update and `O(n)` per query — fine until both happen millions of times. Two structures handle this properly: a **difference array** for offline (all updates first, then all queries), and a **segment tree with lazy propagation** for fully interleaved online workloads.

## whyItMatters
Range update + range query is the workhorse pattern behind interval scheduling, painting problems, time-series aggregation, traffic counting, building skyline / sweep-line solutions, and almost any "online judge problem with 1e5 updates and 1e5 queries" prompt. Knowing both techniques — and when each is appropriate — is what separates a brute-force solution that times out from a clean `O((n + q) log n)` one.

## intuition
**Difference array**: store deltas instead of values. To add `x` over `[l, r]`, write `d[l] += x` and `d[r+1] -= x`. Prefix-sum `d` at the end and you've effectively applied every update in `O(1)` each, then `O(n)` once. Range *sum* queries layer on a second prefix-sum.

**Lazy propagation**: a segment tree node owns an interval. Instead of pushing every update down to every leaf, stash a "pending add" at the node and apply it lazily — only when a child needs to be visited. Each update touches `O(log n)` nodes (the ones whose interval is fully or partially covered), each query also `O(log n)`. Updates and queries can interleave freely.

## visualization
```
arr = [0, 0, 0, 0, 0]
updates: add 3 to [1..3], add 5 to [0..2]

Difference array:
  d = [0, 0, 0, 0, 0, 0]
  after "add 3 to [1..3]": d = [0, +3, 0, 0, -3, 0]
  after "add 5 to [0..2]": d = [+5, +3, 0, -5, -3, 0]
  prefix-sum -> arr = [5, 8, 8, 3, 0]

Segment tree with lazy (sum over interval):
  Node[0..4] sum=0, lazy=0
        / \
   [0..2]   [3..4]
    / \      / \
  ...      ...

  update(1..3, +3):
    walk down, mark lazy on covering nodes, propagate on the way to query
  query(2..4):
    push lazy down on the path, sum partial segments, return
```

## bruteForce
Apply each update by looping over `[l, r]` and adding `x` cell by cell. Answer each sum query by looping over `[a, b]`. Code is 3 lines, but with `n = 10^5` and `q = 10^5`, you've hit `10^10` ops and TLE on any judge. Acceptable only when n*q < ~10^8.

## optimal — Difference array (offline)
```
build d[0..n]:
    for each update (l, r, x):
        d[l] += x
        d[r + 1] -= x
arr[i] = prefix-sum of d up to i
```
For range *sum* queries after all updates, take a second prefix-sum `P` over `arr`; `sumQuery(a, b) = P[b + 1] - P[a]`. Update is `O(1)` each, finalize is `O(n)`, query is `O(1)`. Total `O(n + u + q)`. Works only when no query needs to see partial updates.

## optimal — Segment tree with lazy propagation (online)
Every internal node stores `sum` (the aggregated value over its interval) and `lazy` (a deferred add not yet pushed to children). On any traversal that visits a node, `push` first: apply `lazy` to both children's `sum`, propagate `lazy` to their `lazy` slot, clear the node's `lazy`.

```
update(node, [nl, nr], [l, r], x):
    if [nl, nr] disjoint from [l, r]: return
    if [nl, nr] fully inside [l, r]:
        node.sum += x * (nr - nl + 1)
        node.lazy += x
        return
    push(node)
    mid = (nl + nr) / 2
    update(left, [nl, mid], [l, r], x)
    update(right, [mid + 1, nr], [l, r], x)
    node.sum = left.sum + right.sum

query(node, [nl, nr], [l, r]):
    if disjoint: return 0
    if fully inside: return node.sum
    push(node)
    mid = (nl + nr) / 2
    return query(left, [nl, mid], [l, r]) + query(right, [mid + 1, nr], [l, r])
```

The `push` step is the one most candidates botch — it's mandatory before recursing into a child, and it must update both the child's `sum` (by `lazy * child_size`) and the child's `lazy`.

## complexity
- **Difference array**: build `O(n + u)`, finalize `O(n)`, query `O(1)`. Memory `O(n)`. Offline only.
- **Segment tree + lazy**: build `O(n)`, update `O(log n)`, query `O(log n)`. Memory `O(4n)` for the tree, `O(4n)` for lazy. Fully online.
- **Comparison**: difference array is unbeatable when the workload separates into "phase of updates, then phase of queries." Segment tree wins when phases interleave or when updates aren't simple adds (e.g. range assign, range multiply).

## pitfalls
- **Difference array off-by-one**: `d[r + 1] -= x`, not `d[r] -= x`. Allocate `d` of length `n + 1`.
- **Forgetting to `push` lazy** before recursing — children read stale `sum` and queries return wrong answers.
- **Adding `x` to `sum` instead of `x * intervalSize`** when applying lazy — sum is over the interval, not a single cell.
- **Range assign (set) + range add**: assignment must override pending adds (clear the add, set both `lazy_assign` and the value). Using only one lazy slot here is a classic bug.
- **Integer overflow**: `x * 10^5 * 10^5` exceeds 32-bit. Use `long`/`long long`.
- **Building a segment tree of the wrong size**: round up to `4 * n` to be safe.
- **Iterative segment trees** (Fenwick-style) cannot do lazy propagation directly — Fenwick handles point update + range query, or via two BITs, range update + range sum, but not arbitrary lazy ops.

## interviewTips
- Ask first: "Are updates and queries interleaved, or batched?" — that's the fork between difference array and segment tree.
- For pure range-sum + range-add, mention that **two Fenwick trees** can also do range update + range query in `O(log n)` with much less code than a segment tree — bonus answer.
- If the operation is "range assign + range sum," reach immediately for a segment tree with both `lazy_add` and `lazy_assign` flags.
- Talk through the `push` invariant out loud: "before I descend into a child, I flush the parent's lazy into the child's sum and lazy." Interviewers love hearing that contract.
- For competitive contexts, mention **Mo's algorithm** for offline range queries when updates are absent.

## code.python
```python
class LazySegTree:
    def __init__(self, n):
        self.n = n
        self.sum = [0] * (4 * n)
        self.lazy = [0] * (4 * n)

    def _push(self, node, nl, nr):
        if self.lazy[node]:
            mid = (nl + nr) // 2
            self._apply(node * 2, nl, mid, self.lazy[node])
            self._apply(node * 2 + 1, mid + 1, nr, self.lazy[node])
            self.lazy[node] = 0

    def _apply(self, node, nl, nr, x):
        self.sum[node] += x * (nr - nl + 1)
        self.lazy[node] += x

    def update(self, l, r, x, node=1, nl=0, nr=None):
        if nr is None: nr = self.n - 1
        if r < nl or nr < l: return
        if l <= nl and nr <= r:
            self._apply(node, nl, nr, x); return
        self._push(node, nl, nr)
        mid = (nl + nr) // 2
        self.update(l, r, x, node * 2, nl, mid)
        self.update(l, r, x, node * 2 + 1, mid + 1, nr)
        self.sum[node] = self.sum[node * 2] + self.sum[node * 2 + 1]

    def query(self, l, r, node=1, nl=0, nr=None):
        if nr is None: nr = self.n - 1
        if r < nl or nr < l: return 0
        if l <= nl and nr <= r: return self.sum[node]
        self._push(node, nl, nr)
        mid = (nl + nr) // 2
        return self.query(l, r, node * 2, nl, mid) + self.query(l, r, node * 2 + 1, mid + 1, nr)
```

## code.javascript
```javascript
class LazySegTree {
  constructor(n) { this.n = n; this.sum = new Array(4 * n).fill(0); this.lazy = new Array(4 * n).fill(0); }
  _apply(node, nl, nr, x) { this.sum[node] += x * (nr - nl + 1); this.lazy[node] += x; }
  _push(node, nl, nr) {
    if (this.lazy[node]) {
      const mid = (nl + nr) >> 1;
      this._apply(node * 2, nl, mid, this.lazy[node]);
      this._apply(node * 2 + 1, mid + 1, nr, this.lazy[node]);
      this.lazy[node] = 0;
    }
  }
  update(l, r, x, node = 1, nl = 0, nr = this.n - 1) {
    if (r < nl || nr < l) return;
    if (l <= nl && nr <= r) { this._apply(node, nl, nr, x); return; }
    this._push(node, nl, nr);
    const mid = (nl + nr) >> 1;
    this.update(l, r, x, node * 2, nl, mid);
    this.update(l, r, x, node * 2 + 1, mid + 1, nr);
    this.sum[node] = this.sum[node * 2] + this.sum[node * 2 + 1];
  }
  query(l, r, node = 1, nl = 0, nr = this.n - 1) {
    if (r < nl || nr < l) return 0;
    if (l <= nl && nr <= r) return this.sum[node];
    this._push(node, nl, nr);
    const mid = (nl + nr) >> 1;
    return this.query(l, r, node * 2, nl, mid) + this.query(l, r, node * 2 + 1, mid + 1, nr);
  }
}
```

## code.java
```java
class LazySegTree {
    int n; long[] sum, lazy;
    LazySegTree(int n) { this.n = n; sum = new long[4 * n]; lazy = new long[4 * n]; }
    void apply(int node, int nl, int nr, long x) { sum[node] += x * (nr - nl + 1); lazy[node] += x; }
    void push(int node, int nl, int nr) {
        if (lazy[node] != 0) {
            int mid = (nl + nr) >>> 1;
            apply(node * 2, nl, mid, lazy[node]);
            apply(node * 2 + 1, mid + 1, nr, lazy[node]);
            lazy[node] = 0;
        }
    }
    void update(int l, int r, long x, int node, int nl, int nr) {
        if (r < nl || nr < l) return;
        if (l <= nl && nr <= r) { apply(node, nl, nr, x); return; }
        push(node, nl, nr);
        int mid = (nl + nr) >>> 1;
        update(l, r, x, node * 2, nl, mid);
        update(l, r, x, node * 2 + 1, mid + 1, nr);
        sum[node] = sum[node * 2] + sum[node * 2 + 1];
    }
    long query(int l, int r, int node, int nl, int nr) {
        if (r < nl || nr < l) return 0;
        if (l <= nl && nr <= r) return sum[node];
        push(node, nl, nr);
        int mid = (nl + nr) >>> 1;
        return query(l, r, node * 2, nl, mid) + query(l, r, node * 2 + 1, mid + 1, nr);
    }
    void update(int l, int r, long x) { update(l, r, x, 1, 0, n - 1); }
    long query(int l, int r) { return query(l, r, 1, 0, n - 1); }
}
```

## code.cpp
```cpp
#include <vector>
using namespace std;
struct LazySegTree {
    int n;
    vector<long long> sum, lazy;
    LazySegTree(int n) : n(n), sum(4 * n, 0), lazy(4 * n, 0) {}
    void apply(int node, int nl, int nr, long long x) {
        sum[node] += x * (nr - nl + 1);
        lazy[node] += x;
    }
    void push(int node, int nl, int nr) {
        if (lazy[node]) {
            int mid = (nl + nr) >> 1;
            apply(node * 2, nl, mid, lazy[node]);
            apply(node * 2 + 1, mid + 1, nr, lazy[node]);
            lazy[node] = 0;
        }
    }
    void update(int l, int r, long long x, int node, int nl, int nr) {
        if (r < nl || nr < l) return;
        if (l <= nl && nr <= r) { apply(node, nl, nr, x); return; }
        push(node, nl, nr);
        int mid = (nl + nr) >> 1;
        update(l, r, x, node * 2, nl, mid);
        update(l, r, x, node * 2 + 1, mid + 1, nr);
        sum[node] = sum[node * 2] + sum[node * 2 + 1];
    }
    long long query(int l, int r, int node, int nl, int nr) {
        if (r < nl || nr < l) return 0;
        if (l <= nl && nr <= r) return sum[node];
        push(node, nl, nr);
        int mid = (nl + nr) >> 1;
        return query(l, r, node * 2, nl, mid) + query(l, r, node * 2 + 1, mid + 1, nr);
    }
    void update(int l, int r, long long x) { update(l, r, x, 1, 0, n - 1); }
    long long query(int l, int r) { return query(l, r, 1, 0, n - 1); }
};
```
