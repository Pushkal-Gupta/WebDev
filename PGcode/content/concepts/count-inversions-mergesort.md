---
slug: count-inversions-mergesort
module: arrays-searching
title: Count Inversions via Merge Sort
subtitle: Piggy-back on the merge step to count out-of-order pairs in O(n log n).
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Counting Inversions"
    url: "https://walkccc.me/CLRS/Chap02/Problems/2-4/"
    type: book
  - title: "Count Inversions in Array — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/counting-inversions/"
    type: blog
  - title: "TheAlgorithms/Python — inversions.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/divide_and_conquer/inversions.py"
    type: repo
status: published
---

## intro
An inversion in an array is a pair of indices `(i, j)` with `i < j` and `nums[i] > nums[j]` — a pair that is out of order relative to sorted order. Counting inversions measures how far an array is from sorted: a sorted array has 0, a strictly descending one has n*(n-1)/2. The signature interview answer reuses merge sort: every time the merge step takes an element from the right half before exhausting the left, the entire remaining left half is in inversion with that element.

## whyItMatters
Inversion count powers ranking comparisons (Kendall tau distance), recommender-systems similarity scoring, and bubble-sort lower bounds. The trick — folding extra accounting into an existing O(n log n) algorithm — generalises to "count smaller after self" (Leetcode 315), "reverse pairs" (Leetcode 493), and any nested-pair counting problem where divide-and-conquer plus a sorted helper is the answer.

## intuition
Split the array in half, recursively count inversions inside each half, then merge. When merging, if you ever pull an element `nums[j]` from the right that is smaller than the current `nums[i]` on the left, then `nums[i], nums[i+1], ..., nums[mid]` are all larger than `nums[j]` (because the left half is already sorted at this point) — that's `mid - i + 1` inversions added in one shot.

## visualization
Take `[2, 4, 1, 3, 5]`. Split into `[2, 4]` and `[1, 3, 5]`. Left has 0 inversions, right has 0. Merge: `j=0` (1) beats `i=0` (2) — adds `2 - 0 + 1 = 2` inversions because both `2` and `4` are bigger. Continue: `i=0` (2) beats `j=1` (3); `i=1` (4) loses to nothing further; output `[1, 2, 3, 4, 5]` with total inversions 2. Verifies: `(2,1)` and `(4,1)` are the only out-of-order pairs.

## bruteForce
Two nested loops over `i < j` count any pair where `nums[i] > nums[j]`. O(n^2) time, O(1) space — fine up to n ≈ 2000, useless for the standard 10^5 constraint. Worth writing as the oracle for your test harness even when you submit the merge-sort version.

## optimal
Modify merge sort: every recursive call returns the inversion count for its slice. At merge time, when `right[j] < left[i]`, add `len(left) - i` to the running count and pop from the right half; otherwise pop from the left as usual. Total work is the merge-sort total work — O(n log n) — with an O(1) bookkeeping cost per merge step.

## complexity
time: O(n log n)
space: O(n) for the auxiliary buffer used during merge
notes: The inversion count can be as large as n*(n-1)/2 ≈ 5 * 10^9 for n = 10^5 — use a 64-bit accumulator in C++/Java to avoid overflow.

## pitfalls
- Counting `len(left) - i + 1` instead of `len(left) - i` — off-by-one that overshoots by exactly n at every merge.
- Forgetting that the count must accumulate across all recursive levels, not just the top.
- Using 32-bit ints in C++/Java for the count — overflow on adversarial inputs.
- Modifying `nums` in place but then expecting the caller to see the original order — wrap in a copy if order matters elsewhere.

## interviewTips
- Mention the brute-force oracle out loud: "I'll write the n^2 version too, just to test the n log n version against it."
- Drive the merge-with-counting on a 5-element example before writing code — the `len(left) - i` adder is the moment to slow down and explain.
- For the follow-up "count smaller after self," explain that the same template works with indices tracked alongside values.

## code.python
```python
def count_inversions(nums):
    def merge_count(arr):
        if len(arr) <= 1:
            return arr, 0
        mid = len(arr) // 2
        left, l_inv = merge_count(arr[:mid])
        right, r_inv = merge_count(arr[mid:])
        merged, split = [], 0
        i = j = 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i]); i += 1
            else:
                merged.append(right[j]); j += 1
                split += len(left) - i
        merged += left[i:]; merged += right[j:]
        return merged, l_inv + r_inv + split
    _, total = merge_count(nums)
    return total
```

## code.javascript
```javascript
function countInversions(nums) {
  function mergeCount(arr) {
    if (arr.length <= 1) return [arr, 0];
    const mid = arr.length >> 1;
    const [left, li] = mergeCount(arr.slice(0, mid));
    const [right, ri] = mergeCount(arr.slice(mid));
    const merged = [];
    let i = 0, j = 0, split = 0;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) merged.push(left[i++]);
      else { merged.push(right[j++]); split += left.length - i; }
    }
    while (i < left.length) merged.push(left[i++]);
    while (j < right.length) merged.push(right[j++]);
    return [merged, li + ri + split];
  }
  return mergeCount(nums)[1];
}
```

## code.java
```java
public long countInversions(int[] nums) {
    int[] buf = new int[nums.length];
    return mergeCount(nums, buf, 0, nums.length - 1);
}

long mergeCount(int[] a, int[] buf, int lo, int hi) {
    if (lo >= hi) return 0;
    int mid = (lo + hi) >>> 1;
    long inv = mergeCount(a, buf, lo, mid) + mergeCount(a, buf, mid + 1, hi);
    int i = lo, j = mid + 1, k = lo;
    while (i <= mid && j <= hi) {
        if (a[i] <= a[j]) buf[k++] = a[i++];
        else { buf[k++] = a[j++]; inv += mid - i + 1; }
    }
    while (i <= mid) buf[k++] = a[i++];
    while (j <= hi) buf[k++] = a[j++];
    System.arraycopy(buf, lo, a, lo, hi - lo + 1);
    return inv;
}
```

## code.cpp
```cpp
long long mergeCount(vector<int>& a, vector<int>& buf, int lo, int hi) {
    if (lo >= hi) return 0;
    int mid = (lo + hi) / 2;
    long long inv = mergeCount(a, buf, lo, mid) + mergeCount(a, buf, mid + 1, hi);
    int i = lo, j = mid + 1, k = lo;
    while (i <= mid && j <= hi) {
        if (a[i] <= a[j]) buf[k++] = a[i++];
        else { buf[k++] = a[j++]; inv += mid - i + 1; }
    }
    while (i <= mid) buf[k++] = a[i++];
    while (j <= hi) buf[k++] = a[j++];
    for (int t = lo; t <= hi; t++) a[t] = buf[t];
    return inv;
}

long long countInversions(vector<int> nums) {
    vector<int> buf(nums.size());
    return mergeCount(nums, buf, 0, (int)nums.size() - 1);
}
```
