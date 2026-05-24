---
slug: find-peak-element
module: arrays-searching
title: Find a Peak Element
subtitle: Binary-search on the "uphill" direction to locate any local maximum in O(log n).
difficulty: Intermediate
position: 1
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Binary Search Variants"
    url: "https://walkccc.me/CLRS/Chap02/Problems/2-3/"
    type: book
  - title: "Find a Peak Element — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/find-a-peak-in-a-given-array/"
    type: blog
  - title: "TheAlgorithms/Python — binary_search.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/searches/binary_search.py"
    type: repo
status: published
---

## intro
A peak element is an index `i` such that `nums[i]` is strictly greater than both of its neighbours; out-of-bounds is treated as negative infinity, so the first and last positions only need to beat their single in-bounds neighbour. The classic problem says: "given an array where adjacent elements differ, return *any* peak's index in O(log n)." It is the cleanest example of binary-searching a non-sorted array by exploiting a local invariant.

## whyItMatters
Most candidates assume binary search needs sorted data. This problem disproves that — what you actually need is a *decidable direction*. Any time you have "slope information" (going up vs going down), or "answer is on the left vs right side" derived from a single probe, binary search applies. Recognising this generalisation unlocks problems like "find minimum in rotated sorted array," "search in mountain array," and "smallest letter greater than target."

## intuition
At index `mid`, look at `nums[mid]` vs `nums[mid+1]`. If `nums[mid] < nums[mid+1]`, the array is "going up" at `mid`, so a peak must exist somewhere to the right (the array eventually has to come down — even off the end counts). Move `lo = mid + 1`. Otherwise the array is "going down" or flat at `mid`, meaning a peak exists at `mid` or to the left. Move `hi = mid`. When `lo == hi`, that index is a peak.

## visualization
Take `nums = [1, 2, 1, 3, 5, 6, 4]`. lo=0, hi=6, mid=3, `nums[3]=3 < nums[4]=5` — going up, lo=4. mid=5, `nums[5]=6 > nums[6]=4` — going down, hi=5. mid=4, `nums[4]=5 < nums[5]=6` — going up, lo=5. lo == hi == 5 — peak at index 5 (value 6). Done in 3 probes.

## bruteForce
Linear scan: at each index check both neighbours. O(n) time, O(1) space. Easy and correct but defeats the point — interviewers ask for O(log n) precisely to test whether you spot that binary search applies to slope, not order.

## optimal
Standard half-open binary search with two indices `lo` and `hi`. At each iteration take `mid = (lo + hi) / 2`. If `nums[mid] < nums[mid+1]`, set `lo = mid + 1`; else set `hi = mid`. Loop while `lo < hi`. Return `lo`. The `mid+1` read is safe because `mid < hi` whenever the loop runs, so `mid+1 <= hi <= n-1`. There is no `lo+1`/`hi-1` skew to worry about.

## complexity
time: O(log n)
space: O(1)
notes: The invariant "a peak exists inside [lo, hi]" holds at every iteration. Because the boundaries beyond the array count as negative infinity, the array always has at least one peak — so the search always converges, never returns "not found."

## pitfalls
- Reading `nums[mid - 1]` without a bounds check — pick the direction comparison so it only ever reads `mid` and `mid + 1`.
- Using `hi = mid - 1` instead of `hi = mid` — drops the very element that might be the peak.
- Starting `hi = n` instead of `n - 1` — the comparison would read out of bounds.
- Returning `lo + 1` or `mid` when the loop ends — the answer is `lo` (== `hi`).

## interviewTips
- Spell out the invariant before coding: "A peak always exists in the active interval." That single sentence convinces the interviewer you understand *why* binary search applies here.
- Walk through a 7-element example before writing code; the slope intuition lands better visually than algebraically.
- For the follow-up "find *the* maximum peak", note that binary search no longer suffices — you must scan all candidates.

## code.python
```python
def find_peak_element(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < nums[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo
```

## code.javascript
```javascript
function findPeakElement(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] < nums[mid + 1]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
```

## code.java
```java
public int findPeakElement(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}
```

## code.cpp
```cpp
int findPeakElement(vector<int>& nums) {
    int lo = 0, hi = (int)nums.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}
```
