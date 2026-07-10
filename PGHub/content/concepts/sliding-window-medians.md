---
slug: sliding-window-medians
module: arrays-pointers-windows
title: Sliding Window Median
subtitle: Maintain the median of every length-k window in O(n log k) using two balanced heaps with lazy deletion.
difficulty: Advanced
position: 21
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Sliding Window Median — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/sliding-window-median/"
    type: blog
  - title: "Competitive Programming Algorithms — Heap"
    url: "https://cp-algorithms.com/data_structures/disjoint_set_union.html"
    type: blog
  - title: "kactl — Order Statistic Tree"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/data-structures/OrderStatisticTree.h"
    type: repo
status: published
---

## intro
Given an array of size n and a window size k, report the median of the values currently inside each window as the window slides from left to right. The trick is to keep the windowed elements partitioned between a max-heap of the lower half and a min-heap of the upper half, so that the median is always one heap-top read away.

## whyItMatters
Streaming statistics — median latency, p50 of a rolling traffic window, online anomaly detection — all reduce to "what is the median of the last k values?" The two-heap technique extends naturally to any rank-based query (k-th smallest in a window) and is the standard answer when an order-statistic tree feels like overkill. It is also a great showcase for lazy deletion, a pattern that returns in many streaming algorithms.

## intuition
Picture the k values in the window laid out sorted on a number line, then cut the line in half. Everything to the left of the cut is the "small" half, everything to the right is the "big" half, and the median sits right at the cut. The two heaps are just a way to keep that cut in place without ever fully sorting: the lower half lives in a max-heap (the largest of the small values sits on top, right at the cut); the upper half lives in a min-heap (the smallest of the large values sits on top, right at the cut). The two heap tops are the two values that hug the cut from either side, which is exactly what the median is made of. Keep their sizes balanced — equal for even k, lower-heap one larger for odd k. The median is then either lower.top() (odd k) or the average of lower.top() and upper.top() (even k).

What's actually happening as the window slides: one value walks in on the right and one value walks out on the left, and the cut nudges by at most one slot, so you only ever need to move a single element across the divide to restore balance. Concrete micro-example with [1, 3, -1] and k=3, sorted view [-1, 1, 3]: the cut lands after `1`, so lower = {1, -1} (max-heap top 1), upper = {3} (min-heap top 3); k is odd and lower is the bigger heap, so median = lower.top() = 1. Slide off the `1`, slide in `-3`: sorted view becomes [-3, -1, 3], cut moves to after `-1`, lower = {-1, -3} (top -1), upper = {3}, median = -1. Only the removed and inserted elements plus one possible rebalance move touched a heap. Inserting a new element and removing the outgoing one each cost O(log k); rebalancing is amortized O(log k).

## visualization
Array [1, 3, -1, -3, 5, 3, 6, 7], k=3. Window [1,3,-1]: lower=[1,-1], upper=[3], median=1. Slide: remove 1, add -3 → lower=[-1,-3], upper=[3], median=-1. Slide: remove 3, add 5 → lower=[-1,-3], upper=[5], median=-1. Continue similarly to produce medians [1, -1, -1, 3, 5, 6].

Full trace. `lower` is the max-heap (lower half, its top is the largest small value); `upper` is the min-heap (upper half, its top is the smallest large value). For k=3 the invariant keeps size(lower)=2, size(upper)=1, so the median is always lower.top().

```text
step  window        sorted view   lower (max-heap) top  upper (min) top  sizes  median
 1    [ 1, 3,-1]    [-1, 1, 3]    {-1, 1}        1      {3}         3    2/1     1
 2    [ 3,-1,-3]    [-3,-1, 3]    {-3,-1}       -1      {3}         3    2/1    -1
 3    [-1,-3, 5]    [-3,-1, 5]    {-3,-1}       -1      {5}         5    2/1    -1
 4    [-3, 5, 3]    [-3, 3, 5]    {-3, 3}        3      {5}         5    2/1     3
 5    [ 5, 3, 6]    [ 3, 5, 6]    { 3, 5}        5      {6}         6    2/1     5
 6    [ 3, 6, 7]    [ 3, 6, 7]    { 3, 6}        6      {7}         7    2/1     6
medians = [1, -1, -1, 3, 5, 6]
```

Each slide inserts one value, tags one departing value for lazy deletion, and moves at most one element across the cut to restore the 2/1 size split before the median is read.

## bruteForce
For each of the n−k+1 windows, copy its k elements into a list, sort, and take the middle. O(n k log k) time, O(k) scratch per window. Acceptable for small k; collapses under any realistic streaming load.

## optimal
Two heaps with lazy deletion:
- Insert new element into lower (max-heap), then move lower.top() to upper to keep order; if upper is now larger than lower, move upper.top() back to keep size balance.
- "Remove" the outgoing element by tagging it (e.g. in a hash-multiset of pending removals); whenever a heap's top matches a pending tag, pop it for real.
- After each slide, rebalance until size invariants hold, then read the median from the heap tops.

The two invariants that must hold every time you read the median are the ordering invariant — every value in lower is `<=` every value in upper — and the size invariant — `0 <= size(lower) - size(upper) <= 1`. Together they force lower.top() and upper.top() to be the two middle elements of the window, so the median read is O(1) and correct. The insert step preserves ordering by pushing into lower then shuffling its max across to upper; the rebalance step restores the size invariant by moving at most one element back. Both invariants are re-established after every slide before any median is reported.

The subtlety is deletion. A binary heap can only cheaply remove its top, not an arbitrary buried element, and the value leaving the window is almost never on top. Lazy deletion sidesteps this: mark the outgoing value as "owed" in a count map and leave it physically in the heap; the value only actually gets popped once it bubbles to a top and is recognized as stale. To keep the size logic honest you decrement the logical size of whichever heap the outgoing value belonged to at tag time, then prune stale tops before trusting any `top()`. Because each element is pushed once, tagged once, and eventually popped once, the amortized cost stays O(log k) per slide. This costs O(log k) per slide and O(n log k) overall. The lazy-deletion trick is essential: heaps do not support O(log k) removal of arbitrary elements directly.

## complexity
time: O(n log k)
space: O(k)
notes: An order-statistic tree (or a `SortedList` in Python's sortedcontainers) trades constants and gives the same asymptote with simpler code. The two-heap version wins when you must implement everything from scratch in an interview.

## pitfalls
- Forgetting to lazily evict stale heap tops — leads to wrong medians.
- Off-by-one in the balance invariant — pin the rule down: lower may exceed upper by at most one element.
- Integer overflow on even-k median: `(a + b) / 2` overflows for large 32-bit values; use `a / 2 + b / 2 + (a % 2 + b % 2) / 2` or 64-bit arithmetic.
- Comparing floats with == in tests — round to a fixed precision.

## interviewTips
- Mention the SortedList / multiset alternative up front and explain why the heap version is more interview-friendly.
- Define the invariants explicitly: size balance and "max(lower) ≤ min(upper)."
- Demo the algorithm on a small array (k=3, n=8) before you start coding — interviewers love the visualization.
- For a follow-up "k-th element instead of median," explain that the same two-heap split generalizes.

## code.python
```python
import heapq
from collections import defaultdict

def median_sliding_window(nums, k):
    lower, upper = [], []
    delayed = defaultdict(int)
    res = []

    def prune(heap):
        while heap and delayed[heap[0] if heap is upper else -heap[0]] > 0:
            v = heap[0] if heap is upper else -heap[0]
            delayed[v] -= 1
            heapq.heappop(heap)

    def rebalance():
        if len(lower) > len(upper) + 1:
            heapq.heappush(upper, -heapq.heappop(lower))
            prune(lower)
        elif len(upper) > len(lower):
            heapq.heappush(lower, -heapq.heappop(upper))
            prune(upper)

    for i, x in enumerate(nums):
        if not lower or x <= -lower[0]:
            heapq.heappush(lower, -x)
        else:
            heapq.heappush(upper, x)
        if i >= k:
            out = nums[i - k]
            delayed[out] += 1
            if out <= -lower[0]:
                prune(lower)
            else:
                prune(upper)
        rebalance()
        if i >= k - 1:
            if k % 2:
                res.append(float(-lower[0]))
            else:
                res.append((-lower[0] + upper[0]) / 2)
    return res
```

## code.javascript
```javascript
class Heap {
  constructor(cmp) { this.h = []; this.cmp = cmp; }
  size() { return this.h.length; }
  top() { return this.h[0]; }
  push(v) { this.h.push(v); this.up(this.h.length - 1); }
  pop() { const t = this.h[0]; const l = this.h.pop(); if (this.h.length) { this.h[0] = l; this.down(0); } return t; }
  up(i) { while (i > 0) { const p = (i - 1) >> 1; if (this.cmp(this.h[i], this.h[p]) < 0) { [this.h[i], this.h[p]] = [this.h[p], this.h[i]]; i = p; } else break; } }
  down(i) { const n = this.h.length; for (;;) { let l = 2*i+1, r = 2*i+2, b = i; if (l < n && this.cmp(this.h[l], this.h[b]) < 0) b = l; if (r < n && this.cmp(this.h[r], this.h[b]) < 0) b = r; if (b === i) break; [this.h[i], this.h[b]] = [this.h[b], this.h[i]]; i = b; } }
}

function medianSlidingWindow(nums, k) {
  const lower = new Heap((a, b) => b - a);
  const upper = new Heap((a, b) => a - b);
  const delayed = new Map();
  const res = [];

  const prune = (heap, isUpper) => {
    while (heap.size()) {
      const v = heap.top();
      if ((delayed.get(v) || 0) > 0) {
        delayed.set(v, delayed.get(v) - 1);
        heap.pop();
      } else break;
    }
  };

  const rebalance = () => {
    if (lower.size() > upper.size() + 1) upper.push(lower.pop());
    else if (upper.size() > lower.size()) lower.push(upper.pop());
  };

  for (let i = 0; i < nums.length; i++) {
    const x = nums[i];
    if (lower.size() === 0 || x <= lower.top()) lower.push(x);
    else upper.push(x);
    if (i >= k) {
      const out = nums[i - k];
      delayed.set(out, (delayed.get(out) || 0) + 1);
      if (out <= lower.top()) prune(lower, false);
      else prune(upper, true);
    }
    rebalance();
    prune(lower, false);
    prune(upper, true);
    if (i >= k - 1) {
      if (k % 2) res.push(lower.top());
      else res.push((lower.top() + upper.top()) / 2);
    }
  }
  return res;
}
```

## code.java
```java
public double[] medianSlidingWindow(int[] nums, int k) {
    TreeMap<Integer, Integer> lower = new TreeMap<>(Comparator.reverseOrder());
    TreeMap<Integer, Integer> upper = new TreeMap<>();
    int lowerSize = 0, upperSize = 0;
    int n = nums.length;
    double[] res = new double[n - k + 1];

    for (int i = 0; i < n; i++) {
        int x = nums[i];
        if (lowerSize == 0 || x <= lower.firstKey()) {
            lower.merge(x, 1, Integer::sum); lowerSize++;
        } else {
            upper.merge(x, 1, Integer::sum); upperSize++;
        }
        if (i >= k) {
            int out = nums[i - k];
            if (lower.containsKey(out)) {
                if (lower.get(out) == 1) lower.remove(out); else lower.put(out, lower.get(out) - 1);
                lowerSize--;
            } else {
                if (upper.get(out) == 1) upper.remove(out); else upper.put(out, upper.get(out) - 1);
                upperSize--;
            }
        }
        while (lowerSize > upperSize + 1) {
            int v = lower.firstKey();
            if (lower.get(v) == 1) lower.remove(v); else lower.put(v, lower.get(v) - 1);
            upper.merge(v, 1, Integer::sum);
            lowerSize--; upperSize++;
        }
        while (upperSize > lowerSize) {
            int v = upper.firstKey();
            if (upper.get(v) == 1) upper.remove(v); else upper.put(v, upper.get(v) - 1);
            lower.merge(v, 1, Integer::sum);
            upperSize--; lowerSize++;
        }
        if (i >= k - 1) {
            if (k % 2 == 1) res[i - k + 1] = lower.firstKey();
            else res[i - k + 1] = ((double) lower.firstKey() + upper.firstKey()) / 2.0;
        }
    }
    return res;
}
```

## code.cpp
```cpp
std::vector<double> medianSlidingWindow(std::vector<int>& nums, int k) {
    std::multiset<int> lower, upper;
    std::vector<double> res;
    auto rebalance = [&]() {
        while (lower.size() > upper.size() + 1) {
            upper.insert(*lower.rbegin());
            lower.erase(std::prev(lower.end()));
        }
        while (upper.size() > lower.size()) {
            lower.insert(*upper.begin());
            upper.erase(upper.begin());
        }
    };
    for (int i = 0; i < (int) nums.size(); i++) {
        if (lower.empty() || nums[i] <= *lower.rbegin()) lower.insert(nums[i]);
        else upper.insert(nums[i]);
        if (i >= k) {
            int out = nums[i - k];
            auto it = lower.find(out);
            if (it != lower.end()) lower.erase(it);
            else upper.erase(upper.find(out));
        }
        rebalance();
        if (i >= k - 1) {
            if (k % 2) res.push_back(*lower.rbegin());
            else res.push_back(((double) *lower.rbegin() + *upper.begin()) / 2.0);
        }
    }
    return res;
}
```
