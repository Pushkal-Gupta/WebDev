---
slug: two-pointers
module: arrays-searching
title: Two Pointers
subtitle: Linear scans from both ends — or one fast, one slow.
difficulty: Beginner
position: 2
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
status: published
---

## intro
Two pointers is less an algorithm than a *technique*: maintain two indices that move through an array (or string, or linked list) under some discipline that lets you solve the problem in O(n) instead of O(n²). The two pointers can both move forward at different speeds (fast/slow), or move toward each other from both ends (left/right), or sweep a window (sliding window's first cousin).

## whyItMatters
Two-pointer thinking is the single most common pattern across array/string problems: pair sums in sorted arrays, palindrome checks, removing duplicates in place, partitioning, container with most water, three-sum, trapping rainwater. Recognize it once and a huge problem class collapses from O(n²) brute force to O(n).

## intuition
- **Opposite ends (`left`/`right`):** when the input is sorted (or you can sort it). Each comparison either rules out the left end or the right end, never both — so you advance one pointer per step. Total steps = n.
- **Fast/slow:** when you need to compare a value at position `i` with one at position `j > i`, and `j` only ever increases. The slow pointer marks "the next position to write" or "the start of the current candidate window"; the fast pointer scans ahead.

## visualization
**Two-sum in sorted array** `[1, 3, 4, 6, 9]`, target 10:
- `l = 0, r = 4`: 1 + 9 = 10 ✓ return.

**Remove duplicates** `[1, 1, 2, 3, 3, 4]`:
- slow=0, fast=0..5. Each fast that differs from `arr[slow]` increments slow and writes. Final `arr[..slow+1]` = `[1, 2, 3, 4]`.

## bruteForce
For each pair (i, j), compute. O(n²). Two-pointer technique trades exhaustive pairing for one disciplined sweep using a problem-specific invariant.

## optimal
Pick the variant that matches the problem:
- Sorted input + pair condition → opposite ends. `if sum < target: l++; else if sum > target: r--; else: hit`.
- Need to compare value at index with something later in stream → fast/slow.
- Window of "valid" elements that grows and shrinks → sliding window (covered separately).

## complexity
time: O(n) for both flavors — each pointer moves at most n times.
space: O(1).
notes: For opposite-ends, sorting first costs O(n log n) if the input isn't already sorted; the two-pointer sweep itself is O(n) and dominates only if sorted input is given for free.

## pitfalls
- Forgetting to advance the correct pointer in opposite-ends — usually obvious from the comparison but easy to miscode at 2am.
- Off-by-one on the termination condition: `while l < r` vs `while l <= r` — depends on whether the same index can be both ends.
- For "remove duplicates in place," not returning the new length (interviewers care).
- Confusing two-pointer with sliding window — sliding window has a "valid window invariant" that grows from both sides; two-pointer doesn't necessarily preserve any window.

## interviewTips
- Always check: "is the input sorted? Can I sort it?" Two-pointer + sorted is one of the highest-leverage combos.
- When stuck on an O(n²) problem, ask: "what invariant lets me skip ahead?" That invariant is usually what makes two-pointer work.
- Mention that **three-sum** is two-pointer wrapped in an outer loop — recognizing this saves you from a wrong O(n³) detour.

## code.python
```python
def two_sum_sorted(arr: list[int], target: int) -> tuple[int, int] | None:
    l, r = 0, len(arr) - 1
    while l < r:
        s = arr[l] + arr[r]
        if s == target: return (l, r)
        if s < target: l += 1
        else: r -= 1
    return None

def remove_duplicates(arr: list[int]) -> int:
    if not arr: return 0
    slow = 0
    for fast in range(1, len(arr)):
        if arr[fast] != arr[slow]:
            slow += 1
            arr[slow] = arr[fast]
    return slow + 1
```

## code.javascript
```javascript
function twoSumSorted(arr, target) {
  let l = 0, r = arr.length - 1;
  while (l < r) {
    const s = arr[l] + arr[r];
    if (s === target) return [l, r];
    if (s < target) l++; else r--;
  }
  return null;
}
```

## code.java
```java
public int[] twoSumSorted(int[] arr, int target) {
    int l = 0, r = arr.length - 1;
    while (l < r) {
        int s = arr[l] + arr[r];
        if (s == target) return new int[]{l, r};
        if (s < target) l++; else r--;
    }
    return new int[]{-1, -1};
}
```

## code.cpp
```cpp
pair<int,int> twoSumSorted(vector<int>& arr, int target) {
    int l = 0, r = (int) arr.size() - 1;
    while (l < r) {
        int s = arr[l] + arr[r];
        if (s == target) return {l, r};
        if (s < target) l++; else r--;
    }
    return {-1, -1};
}
```
