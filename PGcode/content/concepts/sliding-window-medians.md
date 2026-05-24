---
slug: sliding-window-medians
module: arrays-searching
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
Split the k values into two halves. The lower half lives in a max-heap (the largest of the small values sits on top); the upper half lives in a min-heap (the smallest of the large values sits on top). Keep their sizes balanced — equal for even k, lower-heap one larger for odd k. The median is then either lower.top() (odd k) or the average of lower.top() and upper.top() (even k). Inserting a new element and removing the outgoing one each cost O(log k); rebalancing is amortized O(log k).

## visualization
Array [1, 3, -1, -3, 5, 3, 6, 7], k=3. Window [1,3,-1]: lower=[1,-1], upper=[3], median=1. Slide: remove 1, add -3 → lower=[-1,-3], upper=[3], median=-1. Slide: remove 3, add 5 → lower=[-1,-3], upper=[5], median=-1. Continue similarly to produce medians [1, -1, -1, 3, 5, 6].

## bruteForce
For each of the n−k+1 windows, copy its k elements into a list, sort, and take the middle. O(n k log k) time, O(k) scratch per window. Acceptable for small k; collapses under any realistic streaming load.

## optimal
Two heaps with lazy deletion:
- Insert new element into lower (max-heap), then move lower.top() to upper to keep order; if upper is now larger than lower, move upper.top() back to keep size balance.
- "Remove" the outgoing element by tagging it (e.g. in a hash-multiset of pending removals); whenever a heap's top matches a pending tag, pop it for real.
- After each slide, rebalance until size invariants hold, then read the median from the heap tops.

This costs O(log k) per slide and O(n log k) overall. The lazy-deletion trick is essential: heaps do not support O(log k) removal of arbitrary elements directly.

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
