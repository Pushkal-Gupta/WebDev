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
Sliding window max/min is a top-tier interview pattern (Leetcode 239, 1438, 862, and many more). Knowing the monotonic deque cuts the solution from O(n log k) heap-based to O(n) and signals serious data-structure fluency. The pattern also generalizes to "next greater element," stock-span, and rainwater-trapping variants.

## intuition
If a new value entering the window is larger than the deque's tail, every smaller predecessor inside the deque can never be the max — they will expire before this new value does. Pop them and append the new value. The deque's front is always the max of the current window, and it stays that way as long as we pop expired indices off the front when the window slides past them.

## visualization
Window size 3 on nums = [1, 3, -1, -3, 5, 3, 6, 7]. Deque holds indices. After i=2: deque = [1, 2] (values 3, -1), front = 3. i=3: push -3, deque = [1, 2, 3], front = 3. i=4: pop 3, 2, 1 because all smaller than 5; deque = [4], front = 5. i=5: push 3 (smaller than 5), deque = [4, 5], front = 5. The front always reflects max of the current window.

## bruteForce
For each window position, scan all k elements to find the max — O(n * k). For n = 10^5 and k = 10^4, that's 10^9 operations. A heap (push every new element, lazy-delete expired ones) gives O(n log k), good enough most of the time. The monotonic deque crushes both.

## optimal
Maintain a deque of indices (not values — we need to know when to expire from the front). On each step i: (1) pop from the back while nums[back] is dominated by nums[i] — they can never be the max; (2) push i; (3) pop from the front while front <= i - k — the window has slid past them; (4) once the window is fully formed (i >= k - 1), nums[deque.front()] is the answer for this window. Each index enters and leaves the deque at most once, so total work is O(n).

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
