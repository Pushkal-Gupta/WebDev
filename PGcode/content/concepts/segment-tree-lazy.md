---
slug: segment-tree-lazy
module: arrays-searching
title: Segment Tree with Lazy Propagation
subtitle: Range updates and range queries in O(log n) by deferring work until you must do it.
difficulty: Advanced
position: 30
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Segment Tree (lazy propagation)"
    url: "https://cp-algorithms.com/data_structures/segment_tree.html"
    type: blog
  - title: "indy256/codelibrary — segment tree implementations"
    url: "https://github.com/indy256/codelibrary"
    type: repo
status: published
---

## intro
A vanilla segment tree handles range queries in O(log n) but a single range update still costs O(n) because you must touch every leaf in the range. Lazy propagation fixes this: each internal node stores a "pending update" that will be applied to its subtree only when something forces a deeper visit. With this trick both range update and range query run in O(log n).

## whyItMatters
Range-update problems are everywhere: "add 5 to every element in [l, r]", "color rooms 3..8 red", "set all flights in this window to delayed", interval scheduling, paint problems, RMQ with updates. Naive solutions are quadratic and time out. A lazy segment tree is the canonical answer and the data structure interviewers reach for to separate strong systems candidates from average ones — it requires understanding both the tree recursion and the invariant that a node's stored value already reflects pending updates above it but not yet below.

## intuition
Think of the tree as a chain of command. When an order says "add 5 to interval [3, 9]," instead of marching the order down to every soldier (leaf), you hand it to the highest-ranking commander whose territory is fully contained in [3, 9]. That commander updates their own summary (so queries above stay correct), then notes "owe my subordinates +5." Only when a future query or update needs to descend below that commander do you push the pending order down by one level — never deeper than necessary. Work is deferred, but the answer at every visible level is always consistent.

## visualization
```
update(l=2, r=5, +3) on n=8:

              [1..8] sum=  +0 pending
             /             |
        [1..4]            [5..8]
        +0 pend            +0 pend
       /     \            /     \
   [1..2]  [3..4]      [5..6]  [7..8]
                  ^ fully inside [2..5]?  No, partial -> recurse.
   After descent, two nodes fully inside get +3 lazy
   and their sums updated by 3 * subtree_size.
   Queries to [1..2] or [3..4] later push lazy down one level.
```

## bruteForce
For each range update of length k, write to k leaves: O(k) per update. With q updates of average length n/2 you spend O(qn) total. On 10^5 queries against a 10^5 array that is 10^10 operations — too slow. Or, dually: keep a difference array (O(1) update) but pay O(n) for any aggregate query. Lazy propagation refuses to pick a side.

## optimal
Augment each node with `value` (the aggregate for its range, already including any updates applied above it) and `lazy` (an update owed to its children). Three primitives:
1. `apply(node, upd, len)`: combine `upd` into `node.value` (e.g. value += upd * len) and combine `upd` into `node.lazy`.
2. `push(node, leftLen, rightLen)`: if `node.lazy` is non-identity, apply it to both children and clear it.
3. `update(node, lo, hi, l, r, upd)` and `query(node, lo, hi, l, r)`: if the node's range is disjoint from [l, r] return; if fully inside, apply at this node and stop; else `push` and recurse into both children, then pull up the aggregate.

The invariants are simple and unbroken: every node's value reflects updates applied at it or above; pending lazy values are owed strictly to descendants.

## complexity
- time: O(log n) per update and per query (each level visits at most four nodes).
- space: O(n) — typically 4n for safety in iterative power-of-two layouts.
- build: O(n) by post-order construction.
- tradeoff vs Fenwick: Fenwick is smaller and faster for invertible point-update/prefix-query; lazy segment tree handles arbitrary range-update + range-query monoids (sum, min, max, assignment, gcd, even matrix products).

## pitfalls
- Mixing two update kinds (add vs assign) requires a careful merge rule: an "assign" override must clear any pending "add" on that node.
- Forgetting to multiply the pending delta by subtree length when updating sums — only correct for the "add" case.
- Not pushing before recursing into either child; you will read stale values.
- Iterative implementations are tempting but lazy is much easier recursively. Don't optimize prematurely.
- For min/max range queries, the "apply" combines via min/max with no length multiplier; the formula differs from sum. Pick the monoid first, then derive apply/push.

## interviewTips
- Trigger phrases: "range update", "color the interval", "add k to all elements in [l, r] then query sum", "paint subarray", "online range RMQ with point or range updates".
- Pitch: "I'll keep two values per node — current aggregate and pending update for children. Updates and queries both run in O(log n) because at every level we touch at most a constant number of nodes."
- If the interviewer pushes for simpler — "would a difference array work?" — explain why it doesn't for range queries (only point queries).
- Mention the monoid framing: any associative operation with a lazy "apply" rule works. This is what powers competitive-programming templates for ranges of matrices.

## code.python
```python
class LazySeg:
    def __init__(self, n):
        self.n = n
        self.t = [0] * (4 * n)
        self.lz = [0] * (4 * n)

    def _apply(self, node, value, length):
        self.t[node] += value * length
        self.lz[node] += value

    def _push(self, node, lo, hi):
        if self.lz[node]:
            mid = (lo + hi) // 2
            self._apply(2 * node, self.lz[node], mid - lo + 1)
            self._apply(2 * node + 1, self.lz[node], hi - mid)
            self.lz[node] = 0

    def update(self, l, r, v, node=1, lo=0, hi=None):
        if hi is None: hi = self.n - 1
        if r < lo or hi < l: return
        if l <= lo and hi <= r:
            self._apply(node, v, hi - lo + 1)
            return
        self._push(node, lo, hi)
        mid = (lo + hi) // 2
        self.update(l, r, v, 2 * node, lo, mid)
        self.update(l, r, v, 2 * node + 1, mid + 1, hi)
        self.t[node] = self.t[2 * node] + self.t[2 * node + 1]

    def query(self, l, r, node=1, lo=0, hi=None):
        if hi is None: hi = self.n - 1
        if r < lo or hi < l: return 0
        if l <= lo and hi <= r: return self.t[node]
        self._push(node, lo, hi)
        mid = (lo + hi) // 2
        return self.query(l, r, 2 * node, lo, mid) + self.query(l, r, 2 * node + 1, mid + 1, hi)
```

## code.javascript
```javascript
class LazySeg {
  constructor(n) {
    this.n = n;
    this.t = new Array(4 * n).fill(0);
    this.lz = new Array(4 * n).fill(0);
  }
  _apply(node, v, len) {
    this.t[node] += v * len;
    this.lz[node] += v;
  }
  _push(node, lo, hi) {
    if (this.lz[node] !== 0) {
      const mid = (lo + hi) >> 1;
      this._apply(2 * node, this.lz[node], mid - lo + 1);
      this._apply(2 * node + 1, this.lz[node], hi - mid);
      this.lz[node] = 0;
    }
  }
  update(l, r, v, node = 1, lo = 0, hi = this.n - 1) {
    if (r < lo || hi < l) return;
    if (l <= lo && hi <= r) { this._apply(node, v, hi - lo + 1); return; }
    this._push(node, lo, hi);
    const mid = (lo + hi) >> 1;
    this.update(l, r, v, 2 * node, lo, mid);
    this.update(l, r, v, 2 * node + 1, mid + 1, hi);
    this.t[node] = this.t[2 * node] + this.t[2 * node + 1];
  }
  query(l, r, node = 1, lo = 0, hi = this.n - 1) {
    if (r < lo || hi < l) return 0;
    if (l <= lo && hi <= r) return this.t[node];
    this._push(node, lo, hi);
    const mid = (lo + hi) >> 1;
    return this.query(l, r, 2 * node, lo, mid) + this.query(l, r, 2 * node + 1, mid + 1, hi);
  }
}
```

## code.java
```java
class LazySeg {
    int n;
    long[] t, lz;
    LazySeg(int n) { this.n = n; t = new long[4 * n]; lz = new long[4 * n]; }

    void apply(int node, long v, int len) {
        t[node] += v * len;
        lz[node] += v;
    }
    void push(int node, int lo, int hi) {
        if (lz[node] != 0) {
            int mid = (lo + hi) >>> 1;
            apply(2 * node, lz[node], mid - lo + 1);
            apply(2 * node + 1, lz[node], hi - mid);
            lz[node] = 0;
        }
    }
    void update(int l, int r, long v, int node, int lo, int hi) {
        if (r < lo || hi < l) return;
        if (l <= lo && hi <= r) { apply(node, v, hi - lo + 1); return; }
        push(node, lo, hi);
        int mid = (lo + hi) >>> 1;
        update(l, r, v, 2 * node, lo, mid);
        update(l, r, v, 2 * node + 1, mid + 1, hi);
        t[node] = t[2 * node] + t[2 * node + 1];
    }
    long query(int l, int r, int node, int lo, int hi) {
        if (r < lo || hi < l) return 0;
        if (l <= lo && hi <= r) return t[node];
        push(node, lo, hi);
        int mid = (lo + hi) >>> 1;
        return query(l, r, 2 * node, lo, mid) + query(l, r, 2 * node + 1, mid + 1, hi);
    }
}
```

## code.cpp
```cpp
struct LazySeg {
    int n;
    vector<long long> t, lz;
    LazySeg(int n) : n(n), t(4 * n, 0), lz(4 * n, 0) {}

    void apply(int node, long long v, int len) {
        t[node] += v * len;
        lz[node] += v;
    }
    void push(int node, int lo, int hi) {
        if (lz[node]) {
            int mid = (lo + hi) / 2;
            apply(2 * node, lz[node], mid - lo + 1);
            apply(2 * node + 1, lz[node], hi - mid);
            lz[node] = 0;
        }
    }
    void update(int l, int r, long long v, int node, int lo, int hi) {
        if (r < lo || hi < l) return;
        if (l <= lo && hi <= r) { apply(node, v, hi - lo + 1); return; }
        push(node, lo, hi);
        int mid = (lo + hi) / 2;
        update(l, r, v, 2 * node, lo, mid);
        update(l, r, v, 2 * node + 1, mid + 1, hi);
        t[node] = t[2 * node] + t[2 * node + 1];
    }
    long long query(int l, int r, int node, int lo, int hi) {
        if (r < lo || hi < l) return 0;
        if (l <= lo && hi <= r) return t[node];
        push(node, lo, hi);
        int mid = (lo + hi) / 2;
        return query(l, r, 2 * node, lo, mid) + query(l, r, 2 * node + 1, mid + 1, hi);
    }
};
```
