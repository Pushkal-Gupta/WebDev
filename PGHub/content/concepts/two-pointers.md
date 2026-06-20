---
slug: two-pointers
module: arrays-pointers-windows
title: Two Pointers
subtitle: Linear scans from both ends — or one fast, one slow.
difficulty: Beginner
position: 2
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "GeeksforGeeks — Two Pointers Technique"
    url: "https://www.geeksforgeeks.org/two-pointers-technique/"
    type: blog
  - title: "TheAlgorithms/Python — reference implementations"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
Two pointers is less an algorithm than a *technique*: maintain two indices that move through an array (or string, or linked list) under some discipline that lets you solve the problem in O(n) instead of O(n²). The two pointers can both move forward at different speeds (fast/slow), or move toward each other from both ends (left/right), or sweep a window (sliding window's first cousin).

## whyItMatters
- Quicksort's partition step (used in every standard library: glibc `qsort`, libc++ `std::sort`, Java's `Arrays.sort`) is two pointers walking toward each other from opposite ends.
- TCP/IP stack buffer compaction in the Linux kernel uses a slow/fast pair to move live bytes left while a fast pointer scans forward — exact analog of in-place dedup.
- Postgres heap vacuum walks pages with a "next free slot" pointer trailing a scan pointer to compact dead tuples.
- Ring buffers in Kafka producers, jemalloc free lists, and DPDK packet rings all use producer/consumer pointer pairs moving at independent speeds.
- Two-pointer technique is the single most common pattern across array and string problems: pair sums in sorted arrays, palindrome checks, in-place dedup, container with most water, three-sum, trapping rainwater. Recognize it and a huge problem class collapses from O(n^2) brute force to O(n).

## intuition
The brute-force pair-sum solution tries all O(n^2) index pairs because it has no way to skip any pair without proving it cannot be the answer. Two-pointer succeeds by introducing an order — usually a sort — that lets each comparison rule out an entire family of pairs in one step. Consider sorted `arr` with target sum: place `l` at index 0 and `r` at the last index. If `arr[l] + arr[r] < target`, then any pair using `arr[l]` and an index `<= r` is also too small (because all candidate right values are `<= arr[r]`), so the entire left position is exhausted — advance `l`. Symmetrically, if the sum is too large, retreat `r`. Each step eliminates one index permanently, so the total work is O(n) — each pointer crosses the array at most once. The fast/slow variant works on a different invariant: the slow pointer marks "the next position to write a valid element" and the fast pointer scans ahead probing inputs. Because slow never moves past fast, the algorithm uses the array as both input (read by fast) and output (written through slow), achieving in-place compaction in linear time. The deep skill is recognizing the eliminating-an-index invariant — once you see that a comparison rules out a whole prefix or suffix, two pointers is almost certainly the right tool. When the input is not sorted but a sort would not change the answer (any problem whose answer is a count, a pair, or a sum), sort first and pay O(n log n); the two-pointer sweep then dominates only the larger inputs.

## visualization
**Two-sum in sorted array** `[1, 3, 4, 6, 9]`, target 10:
- `l = 0, r = 4`: 1 + 9 = 10 ✓ return.

**Remove duplicates** `[1, 1, 2, 3, 3, 4]`:
- slow=0, fast=0..5. Each fast that differs from `arr[slow]` increments slow and writes. Final `arr[..slow+1]` = `[1, 2, 3, 4]`.

## bruteForce
For each pair (i, j), compute. O(n²). Two-pointer technique trades exhaustive pairing for one disciplined sweep using a problem-specific invariant.

## optimal
Pick the variant that matches the problem's invariant: opposite-ends for sorted-pair-sum style questions, fast/slow for in-place compaction or "is element later than slow useful?" stream tests, and sliding window (its close cousin) for "maintain a valid contiguous range." All three move at most n total pointer steps, giving O(n) time and O(1) auxiliary space. The bound is optimal because we must inspect every element to know it is not part of the answer.

```python
def two_sum_sorted(arr, target):
    l, r = 0, len(arr) - 1
    while l < r:
        s = arr[l] + arr[r]
        if s == target:
            return (l, r)
        if s < target:
            l += 1                              # arr[l] too small to pair with anything <= arr[r]
        else:
            r -= 1                              # arr[r] too large for anything >= arr[l]
    return None

def remove_duplicates(arr):
    if not arr:
        return 0
    slow = 0                                    # next write position
    for fast in range(1, len(arr)):             # scan position
        if arr[fast] != arr[slow]:
            slow += 1
            arr[slow] = arr[fast]               # compact in place
    return slow + 1
```

The opposite-ends sweep terminates because `l < r` is invariant and at least one pointer moves each iteration. The fast/slow sweep maintains `slow <= fast` and never overwrites unread input because `slow` only advances when a distinct value is found.

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
