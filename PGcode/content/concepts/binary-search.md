---
slug: binary-search
module: arrays-searching
title: Binary Search
subtitle: Halve the search space at every step — O(log n).
difficulty: Beginner
position: 3
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
status: published
---

## intro
Binary search finds a target in a sorted sequence in O(log n) by repeatedly halving the search space. The basic version is six lines of code; the *variants* (lower-bound, upper-bound, search-in-rotated, search on the answer) are where most interview difficulty lives.

## whyItMatters
Binary search is the most boundary-prone algorithm in interviews — off-by-one bugs are the rule, not the exception. Mastering the variants unlocks: rotated/circular array search, find-peak, search-in-2D-matrix, square root, allocate-books-to-students, capacity-to-ship-packages, and the entire "binary search on the answer" pattern that turns optimization problems into decision problems.

## intuition
Pick the middle. Compare to target. If equal, done. If target is smaller, look left; otherwise right. Repeat. After `log₂ n` halvings the range is empty (target missing) or one element (target found).

The trick is *which half*: this depends on what you're searching for. Looking for "first index where condition is true"? The condition partitions the array into a true/false prefix; binary search finds the boundary.

## visualization
Find `7` in `[1, 3, 5, 7, 9, 11]`:
- `l=0, r=5, mid=2 → arr[2]=5 < 7 → l = 3`
- `l=3, r=5, mid=4 → arr[4]=9 > 7 → r = 3`
- `l=3, r=3, mid=3 → arr[3]=7 ✓ return 3`

## bruteForce
Linear scan: O(n). Fine for n < 100; useless above. Binary search wins at any meaningful size.

## optimal
Classic:
```
l, r = 0, n - 1
while l <= r:
    mid = (l + r) / 2
    if arr[mid] == target: return mid
    if arr[mid] < target: l = mid + 1
    else: r = mid - 1
return -1
```

**Lower-bound** (first index where `arr[i] >= target`):
```
l, r = 0, n
while l < r:
    mid = (l + r) / 2
    if arr[mid] < target: l = mid + 1
    else: r = mid
return l
```

**Binary search on the answer:** when the answer is a number `x` for which `feasible(x)` is monotonic (true for `x >= threshold`, false below), binary-search over the answer range until you find the threshold. Reduces optimization to decision.

## complexity
time: O(log n).
space: O(1) iterative, O(log n) recursive.
notes: For very large `n`, prefer `mid = l + (r - l) / 2` over `(l + r) / 2` to avoid integer overflow in C/C++/Java.

## pitfalls
- `(l + r) / 2` overflows for large ints in C/C++/Java. Use `l + (r - l) / 2`.
- Mixing inclusive/exclusive bounds (`r = n` vs `r = n - 1`, `<` vs `<=` in the loop) — pick one convention and stick to it everywhere.
- Infinite loop if you forget to advance one of the bounds (e.g. `l = mid` instead of `l = mid + 1`).
- Returning `mid` instead of `l` for lower-bound — lower-bound's answer is always `l` after the loop terminates.

## interviewTips
- Always announce your convention up front: "I'll use inclusive bounds and `while l <= r`." Halves the boundary-bug discussion.
- For "first/last occurrence of target" or "search rotated array," memorize the lower-bound template. It's more flexible than the classic.
- When stuck on an optimization problem, ask: "is `feasible(x)` monotonic in x?" If yes, binary-search on the answer.

## code.python
```python
def binary_search(arr: list[int], target: int) -> int:
    l, r = 0, len(arr) - 1
    while l <= r:
        mid = l + (r - l) // 2
        if arr[mid] == target: return mid
        if arr[mid] < target: l = mid + 1
        else: r = mid - 1
    return -1

def lower_bound(arr: list[int], target: int) -> int:
    """Smallest index i with arr[i] >= target, or len(arr) if none."""
    l, r = 0, len(arr)
    while l < r:
        mid = l + (r - l) // 2
        if arr[mid] < target: l = mid + 1
        else: r = mid
    return l
```

## code.javascript
```javascript
function binarySearch(arr, target) {
  let l = 0, r = arr.length - 1;
  while (l <= r) {
    const mid = l + ((r - l) >> 1);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) l = mid + 1; else r = mid - 1;
  }
  return -1;
}
```

## code.java
```java
public int binarySearch(int[] arr, int target) {
    int l = 0, r = arr.length - 1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) l = mid + 1; else r = mid - 1;
    }
    return -1;
}
```

## code.cpp
```cpp
int binarySearch(vector<int>& arr, int target) {
    int l = 0, r = (int) arr.size() - 1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) l = mid + 1; else r = mid - 1;
    }
    return -1;
}
```
