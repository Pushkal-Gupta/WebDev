---
slug: monotonic-deque
module: stacks-queues
title: Monotonic Deque
subtitle: Sliding window max/min in O(n) by maintaining a strictly decreasing (or increasing) deque.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Queues"
    url: "https://algs4.cs.princeton.edu/13stacks/"
    type: book
  - title: "Sliding Window Maximum — cp-algorithms"
    url: "https://cp-algorithms.com/data_structures/stack_queue_modification.html"
    type: blog
  - title: "TheAlgorithms/Python — sliding_window_maximum.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/queue/queue_by_two_stacks.py"
    type: repo
status: published
---

## intro
A monotonic deque is a double-ended queue whose contents stay strictly decreasing (for max queries) or increasing (for min queries) along its length. Coupled with a sliding window, it answers "what is the max in the current window?" in amortized O(1) per element, giving an O(n) total cost where a heap would cost O(n log k).

## whyItMatters
- **LeetCode 239 (Sliding Window Maximum)** is the canonical interview problem; the same template solves LeetCode 1438 (Longest Subarray with Bounded Diff), 862 (Shortest Subarray with Sum at Least K), 918 (Maximum Circular Subarray Sum), and ~15 other top-tier problems.
- **Linux's CPU scheduler (CFS)** and **kernel statistics** use sliding-window aggregations; **Prometheus's recording rules** and **Datadog's rolling aggregations** compute sliding max/min/mean at scale using the same technique.
- **TimescaleDB, ClickHouse, and Apache Druid** implement window functions (`MAX OVER` ranges) via monotonic-deque-style algorithms for O(n) aggregation across rolling windows of streaming data.
- **The CLRS exercises** and **Knuth's TAOCP** introduce the monotonic queue under "sliding-window minimum"; it is the natural deque extension of the monotonic-stack technique used for next-greater-element problems.

## intuition
The problem is "compute the max of every k-sized window in an n-element array." The naive nested-loop approach is O(n * k) — for n = 10^5 and k = 10^4, that is 10^9 operations, far too slow. A heap-based approach gets O(n log k) by maintaining a max-heap of window elements and lazy-deleting expired entries on each query. But there is a clever O(n) approach that uses no comparisons beyond what a single pass already needs.

The key observation: **once a value v enters the deque and a strictly larger value w arrives within the same window, v can never be the max of any future window**. Why? For v to be the max of a future window, that window must (a) still contain v (v has not yet expired) and (b) contain v as the largest element. But w is in the window too as long as w has not expired, and w expires no earlier than v (w was added later), so w shadows v completely. Therefore the moment w arrives, we can permanently discard v.

This insight motivates the structure: maintain a **deque** (double-ended queue) of indices whose **values are strictly decreasing from front to back**. When index i arrives with value `nums[i]`: pop from the **back** while the back's value is `<=` nums[i] — those values are dominated and can never be the max again. Then push i. Separately, pop from the **front** if the front's index is `<= i - k` — that index has slid out of the current window. The front of the deque is then always the maximum of the current window.

Why O(n) total: each index is pushed onto the deque at most once and popped at most once. The inner while-loop appears O(n) per outer iteration but its total work across all outer iterations is O(n) — bounded by the total number of pops, which is at most n. This is the classical amortized-analysis pattern (the same reasoning that justifies dynamic array append being O(1) amortized). For sliding-min, flip the comparator: keep the deque strictly increasing.

## visualization
Window size 3 on nums = [1, 3, -1, -3, 5, 3, 6, 7]. Deque holds indices. After i=2: deque = [1, 2] (values 3, -1), front = 3. i=3: push -3, deque = [1, 2, 3], front = 3. i=4: pop 3, 2, 1 because all smaller than 5; deque = [4], front = 5. i=5: push 3 (smaller than 5), deque = [4, 5], front = 5. The front always reflects max of the current window.

## bruteForce
For each window position, scan all k elements to find the max — O(n * k). For n = 10^5 and k = 10^4, that's 10^9 operations. A heap (push every new element, lazy-delete expired ones) gives O(n log k), good enough most of the time. The monotonic deque crushes both.

## optimal
The optimal solution is a **single-pass monotonic deque storing indices** (not values — we need indices to detect window expiry). Total time O(n) amortized; space O(k) (the deque holds at most k indices). This is asymptotically optimal: you must read every input element, so O(n) is the lower bound. The template generalizes to sliding-min (flip the comparator) and to weighted variants.

```python
from collections import deque

def sliding_max(nums: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()   # indices, values strictly decreasing front->back
    res: list[int] = []
    for i, x in enumerate(nums):
        # (1) Pop dominated values from the back.
        # Use <= for sliding max with strict decrease; use < to keep equals.
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        # (2) Push current index.
        dq.append(i)
        # (3) Pop the front if it has slid out of the window.
        if dq[0] <= i - k:
            dq.popleft()
        # (4) Record answer once the window is fully formed.
        if i >= k - 1:
            res.append(nums[dq[0]])
    return res

def sliding_min(nums: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()   # values strictly increasing front->back
    res: list[int] = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] >= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            res.append(nums[dq[0]])
    return res
```

Why this is right: the structural invariant — deque values are strictly decreasing from front to back — directly implies that the front is the maximum of the current window (every other element in the window is either expired and would have been popped from the front, or strictly smaller and would have been popped from the back when a larger value arrived). The amortized argument is tight: across the entire run, each index is pushed once and popped at most once, so the inner while-loop's total work is O(n), not O(n*k).

**Correctness of comparator choice**: using `<=` when popping the back means "strictly decreasing" — duplicate values are not retained, and the latest occurrence wins ties (best because it expires latest). Using `<` means "non-increasing" — ties are kept, useful for some min-window variants where you need every candidate. Re-read the problem to know which the prompt wants.

**Production variants and adjacent algorithms**:

- **Two-stack queue (LeetCode 232)**: a less-known O(1)-amortized queue built from two stacks, used internally by some monotonic-queue libraries.
- **Sparse table**: O(n log n) preprocessing + O(1) range min/max query — but does not handle dynamic windows. Use when k is huge and queries are sparse.
- **Segment tree with lazy propagation**: O(log n) per update and query; overkill for fixed-window sliding but necessary for arbitrary range queries with updates.
- **Sliding-window sum / mean**: trivially O(n) with a running total — no monotonic structure needed. Only max/min/argmax/argmin require the deque.
- **Sliding-window median**: needs two heaps (max-heap + min-heap with lazy deletion) for O(log k) per element, or an order-statistics tree for O(log k); cannot be done in O(1) per element because medians are not "monotonic."

The pattern's true reach: **next-greater-element**, **stock-span**, **largest-rectangle-in-histogram**, and **trapping-rain-water** are all monotonic-stack variants of the same family; **shortest subarray with sum >= K** (LeetCode 862) combines a monotonic deque with prefix sums. Master the template once and the entire family follows.

## complexity
time: O(n) amortized — each index is pushed and popped at most once.
space: O(k) for the deque — it can hold at most k indices at any moment.
notes: Switching from a max query to a min query flips the monotonic invariant: keep the deque strictly increasing instead of strictly decreasing.

## pitfalls
- Storing values instead of indices — without indices you cannot tell when to expire the front.
- Using `<=` instead of `<` when popping the back — fine for max queries with distinct values, but matters when ties exist and you need a specific tie-breaking rule.
- Forgetting to record an answer until the window is fully formed (i >= k - 1) — off-by-one is easy here.
- Confusing deque with stack: deque needs O(1) push/pop on *both* ends; arrays or linked lists masquerading as deques without that guarantee silently degrade to O(n).

## interviewTips
- Open with the asymptotic improvement: "Brute force is O(n*k), heap is O(n log k), monotonic deque is O(n)."
- Be ready to articulate the invariant in one sentence: "The deque holds indices whose values are strictly decreasing from front to back."
- Mention next-greater-element as a sibling pattern — same monotonic invariant, different sliding semantics.

## code.python
```python
from collections import deque

def sliding_max(nums, k):
    dq = deque()
    res = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            res.append(nums[dq[0]])
    return res

def sliding_min(nums, k):
    dq = deque()
    res = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] >= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            res.append(nums[dq[0]])
    return res
```

## code.javascript
```javascript
function slidingMax(nums, k) {
  const dq = [];
  const res = [];
  for (let i = 0; i < nums.length; i++) {
    while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
    dq.push(i);
    if (dq[0] <= i - k) dq.shift();
    if (i >= k - 1) res.push(nums[dq[0]]);
  }
  return res;
}

function slidingMin(nums, k) {
  const dq = [];
  const res = [];
  for (let i = 0; i < nums.length; i++) {
    while (dq.length && nums[dq[dq.length - 1]] >= nums[i]) dq.pop();
    dq.push(i);
    if (dq[0] <= i - k) dq.shift();
    if (i >= k - 1) res.push(nums[dq[0]]);
  }
  return res;
}
```

## code.java
```java
import java.util.*;

public int[] slidingMax(int[] nums, int k) {
    Deque<Integer> dq = new ArrayDeque<>();
    int n = nums.length;
    int[] res = new int[n - k + 1];
    for (int i = 0; i < n; i++) {
        while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
        dq.offerLast(i);
        if (dq.peekFirst() <= i - k) dq.pollFirst();
        if (i >= k - 1) res[i - k + 1] = nums[dq.peekFirst()];
    }
    return res;
}

public int[] slidingMin(int[] nums, int k) {
    Deque<Integer> dq = new ArrayDeque<>();
    int n = nums.length;
    int[] res = new int[n - k + 1];
    for (int i = 0; i < n; i++) {
        while (!dq.isEmpty() && nums[dq.peekLast()] >= nums[i]) dq.pollLast();
        dq.offerLast(i);
        if (dq.peekFirst() <= i - k) dq.pollFirst();
        if (i >= k - 1) res[i - k + 1] = nums[dq.peekFirst()];
    }
    return res;
}
```

## code.cpp
```cpp
#include <vector>
#include <deque>
using namespace std;

vector<int> slidingMax(vector<int>& nums, int k) {
    deque<int> dq;
    vector<int> res;
    for (int i = 0; i < (int)nums.size(); i++) {
        while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();
        dq.push_back(i);
        if (dq.front() <= i - k) dq.pop_front();
        if (i >= k - 1) res.push_back(nums[dq.front()]);
    }
    return res;
}

vector<int> slidingMin(vector<int>& nums, int k) {
    deque<int> dq;
    vector<int> res;
    for (int i = 0; i < (int)nums.size(); i++) {
        while (!dq.empty() && nums[dq.back()] >= nums[i]) dq.pop_back();
        dq.push_back(i);
        if (dq.front() <= i - k) dq.pop_front();
        if (i >= k - 1) res.push_back(nums[dq.front()]);
    }
    return res;
}
```
