---
slug: heaps-median-from-stream
module: heaps
title: Median from Data Stream (Two Heaps)
subtitle: Max-heap for the lower half + min-heap for the upper half. Insert is O(log N); median is O(1) by peeking the heap tops.
difficulty: Advanced
position: 56
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick — Priority queues"
    url: "https://algs4.cs.princeton.edu/24pq/"
    type: book
  - title: "GeeksforGeeks — Median of running stream"
    url: "https://www.geeksforgeeks.org/median-of-stream-of-integers-running-integers/"
    type: blog
  - title: "TheAlgorithms/Python — Heap median"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/heap/heap.py"
    type: repo
status: published
---

## intro
A stream of integers arrives one by one. After each new value, return the **median** of all values seen so far. Sort-on-demand is O(N log N) per query — fatal at 10⁵ events. The **two-heap trick**: maintain a max-heap of the smaller half + a min-heap of the larger half. Insert is O(log N); median is O(1) — peek the appropriate heap top(s).

## whyItMatters
- Streaming-percentile foundation; same shape gives p25, p75, custom percentiles by adjusting heap sizes.
- Used in **real-time analytics dashboards** (response-time percentiles), **online ML** (running median of features), **sensor fusion**.
- A staple "design a data structure" interview problem (LeetCode 295).
- The two-heap pattern transfers to "sliding-window median," "k-th order statistic," and "weighted median."

## intuition
Split values into halves by rank:
- **Lower half** (≤ median) → max-heap (top = largest of the lower half).
- **Upper half** (> median) → min-heap (top = smallest of the upper half).

Invariants:
1. `len(lower) == len(upper)` OR `len(lower) == len(upper) + 1`.
2. Max of `lower` ≤ Min of `upper`.

Median:
- If sizes equal: average of the two heap tops.
- Else (lower is larger by 1): top of lower.

Insert: push into lower if `value ≤ lower.top()`, else push into upper. Then rebalance: if size diff > 1, pop from the bigger heap and push to the smaller.

## visualization
```
Stream: 1, 5, 3, 8, 2, 4

After 1:
  lower = [1]      upper = []
  median = 1

After 5:
  5 > lower.top=1 → push to upper
  lower = [1]      upper = [5]
  median = (1+5)/2 = 3

After 3:
  3 ≤ lower.top? 3 ≤ 1? NO → push to upper
  upper = [3, 5]; need rebalance (upper has 2, lower has 1)
  pop min from upper (3), push to lower
  lower = [3, 1] (max-heap top=3)    upper = [5]
  median = 3 (lower has 2, upper 1 → median = lower top)

After 8:
  8 > lower.top=3 → push to upper
  upper = [5, 8]
  lower = [3, 1]   upper = [5, 8]
  median = (3+5)/2 = 4

After 2:
  2 ≤ lower.top=3 → push to lower
  lower = [3, 1, 2]   upper = [5, 8]
  median = 3 (lower has 3, upper 2 → median = lower top)

After 4:
  4 ≤ lower.top=3? NO → push to upper
  upper = [4, 5, 8]; rebalance
  pop min from upper (4), push to lower
  lower = [4, 1, 2, 3]   upper = [5, 8]
  median = (4+5)/2 = 4.5
```

## bruteForce
**Sort after every insert + median by index**: O(N log N) per insert → O(N² log N) total. TLE for 10⁵.

**Maintain sorted list + binary insert**: O(N) per insert (shift). O(N²) total — still bad.

**Use a balanced BST + size tracking**: O(log N) per insert, O(log N) per query. Works; more code than two heaps.

Two-heap is the canonical interview answer.

## optimal
**Two-heap MedianFinder**:
```python
import heapq
class MedianFinder:
    def __init__(self):
        self.lower = []   # max-heap (store negatives)
        self.upper = []   # min-heap

    def add(self, num):
        if not self.lower or num <= -self.lower[0]:
            heapq.heappush(self.lower, -num)
        else:
            heapq.heappush(self.upper, num)
        # Rebalance
        if len(self.lower) > len(self.upper) + 1:
            heapq.heappush(self.upper, -heapq.heappop(self.lower))
        elif len(self.upper) > len(self.lower):
            heapq.heappush(self.lower, -heapq.heappop(self.upper))

    def median(self):
        if len(self.lower) > len(self.upper):
            return -self.lower[0]
        return (-self.lower[0] + self.upper[0]) / 2
```

**Python idiom**: Python's `heapq` is min-heap only; negate values to simulate max-heap.

**Sliding-window median variant**: harder — need to also *remove* values from heaps as the window slides. Use lazy deletion (mark as removed, skip on pop) or use a multiset.

**K-th order statistic** generalization: pre-define which two heap tops form the boundary at rank K; rebalance keeps that boundary at the requested rank.

**Decimal vs integer median**: when total count is even, median is the average. Use integer division only if the problem says so.

## complexity
- **add():** O(log N) — one push + at most one rebalance pop+push.
- **median():** O(1) — peek heap tops.
- **Space:** O(N) — all values stored.

## pitfalls
- **Forgetting to negate** for max-heap in Python: silent O(log N) operations but wrong order.
- **Rebalance check off-by-one**: `len(lower) > len(upper) + 1` is the trigger; `> len(upper)` is too strict (rebalances when sizes equal).
- **Integer overflow in median average** (C++/Java): `(a + b) / 2` overflows; use `a + (b - a) / 2` or cast to long.
- **Pushing to wrong heap** when value equals median: `num <= -lower[0]` is the correct check; `<` strictly would lose stability on ties.
- **Returning float for an integer-only median**: problem spec may differ. Confirm.
- **Sliding-window median with naive remove**: O(N) removal kills the trick. Use lazy-deletion + heap-top cleanup loop.

## interviewTips
- For "compute median of a stream" → two heaps.
- Cite **invariants** explicitly: lower top ≤ upper top; size difference ≤ 1.
- For senior interviews, discuss **sliding-window median** (lazy deletion), **percentile-from-stream** generalization, **t-digest** as the approximate alternative for very large N.

## code.python
```python
import heapq
class MedianFinder:
    def __init__(self):
        self.lo = []   # max-heap (negated)
        self.hi = []   # min-heap

    def addNum(self, num):
        if not self.lo or num <= -self.lo[0]:
            heapq.heappush(self.lo, -num)
        else:
            heapq.heappush(self.hi, num)
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def findMedian(self):
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2.0
```

## code.javascript
```javascript
class MaxHeap {
  constructor() { this.h = []; }
  push(x) { this.h.push(x); this._up(this.h.length - 1); }
  pop() { const t = this.h[0]; const last = this.h.pop(); if (this.h.length) { this.h[0] = last; this._down(0); } return t; }
  peek() { return this.h[0]; }
  size() { return this.h.length; }
  _up(i) { while (i > 0) { const p = (i - 1) >> 1; if (this.h[p] >= this.h[i]) break; [this.h[p], this.h[i]] = [this.h[i], this.h[p]]; i = p; } }
  _down(i) { while (true) { const l=2*i+1, r=2*i+2; let s=i; if (l<this.h.length && this.h[l]>this.h[s]) s=l; if (r<this.h.length && this.h[r]>this.h[s]) s=r; if (s===i) break; [this.h[s],this.h[i]]=[this.h[i],this.h[s]]; i=s; } }
}
class MinHeap extends MaxHeap {
  _up(i) { while (i > 0) { const p = (i - 1) >> 1; if (this.h[p] <= this.h[i]) break; [this.h[p], this.h[i]] = [this.h[i], this.h[p]]; i = p; } }
  _down(i) { while (true) { const l=2*i+1, r=2*i+2; let s=i; if (l<this.h.length && this.h[l]<this.h[s]) s=l; if (r<this.h.length && this.h[r]<this.h[s]) s=r; if (s===i) break; [this.h[s],this.h[i]]=[this.h[i],this.h[s]]; i=s; } }
}

class MedianFinder {
  constructor() { this.lo = new MaxHeap(); this.hi = new MinHeap(); }
  addNum(n) {
    if (!this.lo.size() || n <= this.lo.peek()) this.lo.push(n);
    else this.hi.push(n);
    if (this.lo.size() > this.hi.size() + 1) this.hi.push(this.lo.pop());
    else if (this.hi.size() > this.lo.size()) this.lo.push(this.hi.pop());
  }
  findMedian() {
    if (this.lo.size() > this.hi.size()) return this.lo.peek();
    return (this.lo.peek() + this.hi.peek()) / 2;
  }
}
```

## code.java
```java
class MedianFinder {
    PriorityQueue<Integer> lo = new PriorityQueue<>(Comparator.reverseOrder());
    PriorityQueue<Integer> hi = new PriorityQueue<>();
    public void addNum(int num) {
        if (lo.isEmpty() || num <= lo.peek()) lo.offer(num);
        else hi.offer(num);
        if (lo.size() > hi.size() + 1) hi.offer(lo.poll());
        else if (hi.size() > lo.size()) lo.offer(hi.poll());
    }
    public double findMedian() {
        if (lo.size() > hi.size()) return lo.peek();
        return (lo.peek() + hi.peek()) / 2.0;
    }
}
```

## code.cpp
```cpp
class MedianFinder {
    priority_queue<int> lo;                                          // max-heap
    priority_queue<int, vector<int>, greater<int>> hi;               // min-heap
public:
    void addNum(int num) {
        if (lo.empty() || num <= lo.top()) lo.push(num);
        else hi.push(num);
        if (lo.size() > hi.size() + 1) { hi.push(lo.top()); lo.pop(); }
        else if (hi.size() > lo.size()) { lo.push(hi.top()); hi.pop(); }
    }
    double findMedian() {
        if (lo.size() > hi.size()) return lo.top();
        return (lo.top() + hi.top()) / 2.0;
    }
};
```
