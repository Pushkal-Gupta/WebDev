---
slug: subarray-product-less-k
module: arrays-searching
title: Subarray Product Less Than K
subtitle: Count contiguous subarrays whose product is strictly less than k in O(n) with sliding window.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sliding Window Technique — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/window-sliding-technique/"
    type: blog
  - title: "Two Pointers and Sliding Window — cp-algorithms"
    url: "https://cp-algorithms.com/data_structures/sqrt_decomposition.html"
    type: blog
  - title: "TheAlgorithms/Python — sliding_window"
    url: "https://github.com/TheAlgorithms/Python/tree/master/dynamic_programming"
    type: repo
status: published
---

## intro
Given an array of positive integers and a target `k`, count the number of contiguous subarrays whose product is strictly less than `k`. The constraint that all values are positive is the lever that makes sliding window work: extending the window can only ever increase the product, shrinking can only decrease it.

## whyItMatters
This problem is the classic "windowed counting" pattern, distinct from "windowed maximum" or "windowed substring". Every time you see a monotonic invariant (product, sum, distinct-count, vowel-count) over positive contributions, the same template fires. Master it once and the variants — sum < k, sum >= k, "shortest subarray with sum >= k" — fall out as small edits.

## intuition
Walk a right pointer through the array, maintaining the product of the current window. If the product hits `k` or higher, slide `left` forward, dividing the product, until it is back under `k`. Every time you settle the window at a new `right`, every subarray ending at `right` with start in `[left..right]` is valid — that is `right - left + 1` new subarrays to add to the count.

## visualization
Take `nums = [10, 5, 2, 6]`, `k = 100`. Walk right from 0. r=0: window `[10]`, product 10, count += 1 (total 1). r=1: `[10,5]`, product 50, count += 2 (total 3). r=2: `[10,5,2]`, product 100 — shrink left to 1, window `[5,2]`, product 10, count += 2 (total 5). r=3: `[5,2,6]`, product 60, count += 3 (total 8). Answer: 8.

## bruteForce
Two nested loops: fix the left index, expand right while the running product stays below `k`. Counting works correctly but the worst case is O(n^2) when many subarrays are valid (e.g. all 1's and a generous k). A 10^5 input runs in 10^10 operations — TLE on every judge.

## optimal
Single pass with two pointers. Maintain `product`, `left`. For each `right` multiply `product *= nums[right]`. While `product >= k` and `left <= right`, divide `product /= nums[left]` and advance `left`. The number of valid subarrays ending at `right` is exactly `right - left + 1`; add it to a running total. Edge case: if `k <= 1` there are zero valid subarrays since all elements are at least 1.

## complexity
time: O(n)
space: O(1)
notes: Each element is multiplied in once and divided out at most once — so `left` and `right` together advance at most 2n times. Floating-point alternative: maintain `sum_of_logs` and compare to `log(k)`, but integer division stays exact.

## pitfalls
- Forgetting the `k <= 1` early-exit — multiplying then dividing by `1` loops indefinitely if you guard with `product >= k` and the product starts at 1.
- Counting `right - left` instead of `right - left + 1` — off-by-one bug that silently halves the answer.
- Applying the same template to arrays with zeros or negatives — the monotonic invariant breaks and you need prefix-sum or DP instead.
- Using floating-point `product` and losing precision on long runs.

## interviewTips
- Call out the positive-numbers precondition immediately — it justifies the sliding-window choice.
- The `right - left + 1` increment is the load-bearing insight; write it on paper to confirm before you code.
- For follow-ups, mention that the same idea solves "longest subarray with product < k" by tracking max window size.

## code.python
```python
def num_subarray_product_less_than_k(nums, k):
    if k <= 1: return 0
    left, product, count = 0, 1, 0
    for right, v in enumerate(nums):
        product *= v
        while product >= k:
            product //= nums[left]
            left += 1
        count += right - left + 1
    return count
```

## code.javascript
```javascript
function numSubarrayProductLessThanK(nums, k) {
  if (k <= 1) return 0;
  let left = 0, product = 1, count = 0;
  for (let right = 0; right < nums.length; right++) {
    product *= nums[right];
    while (product >= k) { product = Math.floor(product / nums[left]); left++; }
    count += right - left + 1;
  }
  return count;
}
```

## code.java
```java
public int numSubarrayProductLessThanK(int[] nums, int k) {
    if (k <= 1) return 0;
    int left = 0, count = 0;
    long product = 1;
    for (int right = 0; right < nums.length; right++) {
        product *= nums[right];
        while (product >= k) { product /= nums[left]; left++; }
        count += right - left + 1;
    }
    return count;
}
```

## code.cpp
```cpp
int numSubarrayProductLessThanK(vector<int>& nums, int k) {
    if (k <= 1) return 0;
    int left = 0, count = 0;
    long long product = 1;
    for (int right = 0; right < (int)nums.size(); right++) {
        product *= nums[right];
        while (product >= k) { product /= nums[left]; left++; }
        count += right - left + 1;
    }
    return count;
}
```
