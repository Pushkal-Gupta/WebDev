---
slug: kadanes-algorithm
module: dp
title: Kadane's Algorithm
subtitle: Maximum subarray sum in a single linear pass.
difficulty: Beginner
position: 1
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
status: published
---

## intro
Kadane's algorithm finds the contiguous subarray with the maximum sum in O(n) time and O(1) space. It's the gentlest possible introduction to dynamic programming — only one DP variable, no array, no recursion. Yet it captures the heart of DP: at every index, you make a local decision that uses the previous decision's answer.

## whyItMatters
"Max subarray sum" is the canonical warmup for DP problems and the building block for "max product subarray," "max subarray in a 2D grid (combined with prefix sums)," "max circular subarray," and many financial / signal-processing applications. Internalizing Kadane's makes every harder DP problem feel approachable, because the structure ("local choice + running best") repeats everywhere.

## intuition
At each index `i`, you face exactly one choice: extend the previous subarray, or start a fresh one at `i`. If the previous subarray's sum became negative, extending it would only drag you down — so abandon it and start fresh. Otherwise, keep extending. Track the best total seen so far alongside the running total.

## visualization
Array `[-2, 1, -3, 4, -1, 2, 1, -5, 4]`. Running max: starts at -2, becomes 1 (fresh at index 1), becomes -2 (extend), becomes 4 (fresh), 3, 5, 6, 1, 5. Best seen: -2, 1, 1, 4, 4, 5, 6, 6, 6. Answer: 6 (subarray `[4, -1, 2, 1]`).

## bruteForce
Enumerate every `(i, j)` subarray and compute its sum — O(n³) naïve, O(n²) with running sums. Useless beyond small n; mention it as the contrast.

## optimal
Walk left to right. Maintain `current = max(nums[i], current + nums[i])` and `best = max(best, current)`. That's the whole algorithm. To also return the subarray bounds, track `start` and `end` indices: `start` resets to `i` whenever `current` resets to `nums[i]`.

## complexity
time: O(n)
space: O(1)
notes: Two-variable DP — no array needed. Generalizes to 2D max-rectangle-sum by combining with column-prefix-sums, giving an O(n²·m) algorithm for an n×m grid.

## pitfalls
- All-negative arrays: a naïve `max(0, current + nums[i])` returns 0 instead of the largest (least-negative) element. Use `max(nums[i], current + nums[i])` to handle this correctly.
- Returning the *sum* vs the *subarray itself*: be ready for both follow-ups.
- Confusing with "max product subarray" — products require tracking both max and min (because negatives flip), it's a different recurrence.

## interviewTips
- Always solve the all-negative case explicitly to show you've thought about edge cases. The `max(nums[i], current + nums[i])` form is the giveaway you have.
- Mention the 2D extension (Kadane + column prefix sums = max-rectangle) — interviewers love it as a follow-up.
- The "max subarray in a circular array" follow-up is solved with two Kadane passes: standard max, and `total - min subarray` (which represents wrapping around).

## code.python
```python
def max_subarray(nums: list[int]) -> int:
    current = best = nums[0]
    for x in nums[1:]:
        current = max(x, current + x)
        best = max(best, current)
    return best
```

## code.javascript
```javascript
function maxSubArray(nums) {
  let current = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}
```

## code.java
```java
public int maxSubArray(int[] nums) {
    int current = nums[0], best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        current = Math.max(nums[i], current + nums[i]);
        best = Math.max(best, current);
    }
    return best;
}
```

## code.cpp
```cpp
int maxSubArray(vector<int>& nums) {
    int current = nums[0], best = nums[0];
    for (size_t i = 1; i < nums.size(); i++) {
        current = max(nums[i], current + nums[i]);
        best = max(best, current);
    }
    return best;
}
```
