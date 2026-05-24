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
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton — Binary Search"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Binary Search"
    url: "https://cp-algorithms.com/num_methods/binary_search.html"
    type: blog
  - title: "TheAlgorithms/Python — searches"
    url: "https://github.com/TheAlgorithms/Python/tree/master/searches"
    type: repo
status: published
---

## intro
Binary search finds a target in a sorted sequence in O(log n) by repeatedly halving the search space. The basic version is six lines of code; the *variants* (lower-bound, upper-bound, search-in-rotated, search on the answer) are where most interview difficulty lives.

## whyItMatters
Binary search is the most boundary-prone algorithm in interviews — off-by-one bugs are the rule, not the exception. Mastering the variants unlocks: rotated/circular array search, find-peak, search-in-2D-matrix, square root, allocate-books-to-students, capacity-to-ship-packages, and the entire "binary search on the answer" pattern that turns optimization problems into decision problems.

## intuition
Pick the middle. Compare to target. If equal, done. If target is smaller, look left; otherwise right. Repeat. After `log₂ n` halvings the range is empty (target missing) or one element (target found).

The trick is *which half*: this depends on what you're searching for. Looking for "first index where condition is true"? The condition partitions the array into a true/false prefix; binary search finds the boundary.

Concretely, think of the search range `[l..r]` as a closed interval that shrinks. At each step you:
1. Compute `mid = l + (r - l) / 2` (avoids overflow vs `(l + r) / 2`).
2. Compare `arr[mid]` to `target`.
3. Discard the half that *cannot* contain `target` (because the array is sorted).
4. Stop when `l > r` (empty) or when you land exactly on `target`.

After step `k`, the remaining range has size `n / 2^k`. It hits 1 when `k ≈ log₂ n` — that is your worst case.

## walkthroughExample
Find `target = 23` inside `arr = [3, 7, 11, 15, 19, 23, 27, 31, 35, 39]` (length 10, indices 0..9).

Step 0 — initial bounds:
```
idx   0   1   2   3   4   5   6   7   8   9
val   3   7  11  15  19  23  27  31  35  39
      ^                                       ^
      l=0                                     r=9
              mid = 0 + (9-0)/2 = 4   arr[4] = 19
              19 < 23  ->  search RIGHT half, l = mid + 1 = 5
```

Step 1 — l=5, r=9:
```
idx   0   1   2   3   4   5   6   7   8   9
val   .   .   .   .   .  23  27  31  35  39
                          ^                ^
                          l=5              r=9
              mid = 5 + (9-5)/2 = 7   arr[7] = 31
              31 > 23  ->  search LEFT half, r = mid - 1 = 6
```

Step 2 — l=5, r=6:
```
idx   0   1   2   3   4   5   6   7   8   9
val   .   .   .   .   .  23  27   .   .   .
                          ^   ^
                          l=5 r=6
              mid = 5 + (6-5)/2 = 5   arr[5] = 23
              23 == 23  ->  return 5
```

Iterations used: 3. log2(10) ≈ 3.32, so this matches the bound.

## visualization
Snapshot 1 — three pivots on the same 10-element array (target = 23):
```
              l                   m                   r
              v                   v                   v
   [ 3,  7, 11, 15, 19, 23, 27, 31, 35, 39]      arr[m]=19 < 23  =>  l = m+1
    0   1   2   3   4   5   6   7   8   9

                                  l           m       r
                                  v           v       v
   [ .,  .,  .,  .,  ., 23, 27, 31, 35, 39]      arr[m]=31 > 23  =>  r = m-1
                                  5   6   7   8   9

                                  l   m   r
                                  v   v   v
   [ .,  .,  .,  .,  ., 23, 27,  .,  .,  .]      arr[m]=23 == 23  =>  return 5
                                  5   6
```

Snapshot 2 — the search space halves on each step. log2(10) ≈ 3.32:
```
   step 0:  range size = 10   |==========|
   step 1:  range size =  5        |=====|
   step 2:  range size =  2             |=|
   step 3:  range size =  1              x   (found / would terminate)
```

Snapshot 3 — lower-bound (first index with `arr[i] >= 20`):
```
   arr  =  [ 3,  7, 11, 15, 19, 23, 27, 31, 35, 39]
   pred =  [ F,  F,  F,  F,  F,  T,  T,  T,  T,  T]
                                   ^
                                   answer = 5  (first 'T')

   loop invariant:  arr[0..l-1] all FALSE,  arr[r..n-1] all TRUE
   converges when   l == r,  which is the boundary index.
```

Decision tree on the same array — every leaf is reachable in <= 4 comparisons:
```
                       mid=4 (19)
                  < 23 /        \ > 23
                  mid=7 (31)     (unused)
              < 23 /     \ > 23
              mid=5 (23)  mid=8/9 zone
              == found
```

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
