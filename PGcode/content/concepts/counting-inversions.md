---
slug: counting-inversions
module: arrays-searching
title: Counting Inversions
subtitle: Count pairs (i, j) with i<j and a[i]>a[j] in O(n log n) using merge sort or a Fenwick tree.
difficulty: Intermediate
position: 24
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Problem 2-4 — Inversions (worked solutions)"
    url: "https://walkccc.me/CLRS/Chap02/Problems/2-4/"
    type: book
  - title: "GeeksforGeeks — Count inversions in an array"
    url: "https://www.geeksforgeeks.org/counting-inversions/"
    type: blog
  - title: "TheAlgorithms/Python — inversions"
    url: "https://github.com/TheAlgorithms/Python/blob/master/divide_and_conquer/inversions.py"
    type: repo
status: published
---

## intro
An **inversion** in an array is a pair `(i, j)` with `i < j` but `a[i] > a[j]` — a place where the array is "out of order." Counting all inversions is asking "how far from sorted is this array?" The brute force is O(n²); both **merge sort** and **Fenwick tree** solutions hit O(n log n).

## whyItMatters
Direct interview questions:
- "How many swaps does bubble sort make on this array?" — exactly the inversion count.
- "Reverse pairs" problems (LeetCode 493).
- **Kendall tau distance** — a rank correlation metric used in statistics.
- **Pre-conditions for binary search** — many "is this array close to sorted" pre-checks.

Once you have the inversion-counting tool, you also have the building block for "count subarrays satisfying X" using merge-sort-tree or persistent structures.

## intuition
**Merge sort approach**: while merging two sorted halves, whenever you pick from the RIGHT half before exhausting the LEFT, every remaining element in the left half is greater than the picked right element — they're all inversions. Sum across merges = total inversions.

**Fenwick (BIT) approach**: iterate the array right-to-left. For each `a[i]`, count how many elements to its right are strictly less than it — those are the inversions with `i` as the left endpoint. A Fenwick tree on values (compress first) gives this count in O(log n).

## visualization
```
Array: [2, 4, 1, 3, 5]

Inversions: (2, 1), (4, 1), (4, 3) → 3

Merge sort:
  split → [2, 4] and [1, 3, 5]
    sort halves → [2, 4] and [1, 3, 5]
  merge:
    take 1 (from right) — 2 elements remain in left ([2, 4]) → +2 inversions
    take 2 (from left)
    take 3 (from right) — 1 element remains in left (4) → +1 inversion
    take 4, take 5
  total: 3 ✓
```

## bruteForce
Two nested loops over `(i, j)`. O(n²). Fine for n ≤ 5000.

## optimal
**Merge sort variant**:
```
def merge_sort_count(arr):
    if len(arr) <= 1: return arr, 0
    mid = len(arr) // 2
    L, c1 = merge_sort_count(arr[:mid])
    R, c2 = merge_sort_count(arr[mid:])
    merged = []
    i = j = inv = 0
    while i < len(L) and j < len(R):
        if L[i] <= R[j]:
            merged.append(L[i]); i += 1
        else:
            merged.append(R[j])
            inv += len(L) - i           # every remaining L is bigger than R[j]
            j += 1
    merged += L[i:] + R[j:]
    return merged, c1 + c2 + inv
```

**Fenwick approach** (with coordinate compression):
```
sorted_unique = sorted(set(arr))
rank = { v: i + 1 for i, v in enumerate(sorted_unique) }   # 1-indexed
bit = Fenwick(len(sorted_unique))
inv = 0
for x in reversed(arr):
    inv += bit.prefix_sum(rank[x] - 1)     # how many smaller-valued have we seen
    bit.update(rank[x], +1)
return inv
```

Both are O(n log n). Pick by language ergonomics — Python's slicing makes merge sort cleaner; languages with native segment trees lean toward Fenwick.

## complexity
- **Time**: O(n log n).
- **Space**: O(n) for the auxiliary array (merge sort) or Fenwick tree.
- **Brute force**: O(n²).
- **Lower bound**: provably Ω(n log n) by reduction to sorting — you can't beat this asymptotically.

## pitfalls
- **Strict vs non-strict inversion**: `a[i] > a[j]` (strict) vs `a[i] >= a[j]` (non-strict). Decide per problem.
- **Forgetting coordinate compression for Fenwick**: at values up to 10^9 you can't allocate a Fenwick that large.
- **Overflow**: inversion count is up to `n·(n-1)/2`. For n = 10^5 that's ~5·10^9 — needs 64-bit integer.
- **Mutating original array during merge sort**: use a copy if the caller needs the original.

## interviewTips
- For "how many swaps does X-sort need," "reverse pairs," "almost sorted check" → inversion count.
- Both algorithms are interview-standard; the **merge sort version is usually expected** as the canonical answer.
- For senior interviews, mention **reverse pairs with weight** (e.g., `a[i] > 2·a[j]`) — same template, slightly different inner check during merge.
- Connect with **bubble sort step count** as the intuitive identity.

## code.python
```python
def count_inversions(arr):
    def merge(left, right):
        merged = []; i = j = inv = 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]: merged.append(left[i]); i += 1
            else:
                merged.append(right[j])
                inv += len(left) - i
                j += 1
        merged += left[i:] + right[j:]
        return merged, inv

    def sort_count(a):
        if len(a) <= 1: return a, 0
        mid = len(a) // 2
        l, c1 = sort_count(a[:mid])
        r, c2 = sort_count(a[mid:])
        merged, c3 = merge(l, r)
        return merged, c1 + c2 + c3

    _, inv = sort_count(arr)
    return inv

print(count_inversions([2, 4, 1, 3, 5]))   # 3
```

## code.javascript
```javascript
function countInversions(arr) {
  function merge(left, right) {
    const out = []; let i = 0, j = 0, inv = 0;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) out.push(left[i++]);
      else { out.push(right[j++]); inv += left.length - i; }
    }
    return [out.concat(left.slice(i)).concat(right.slice(j)), inv];
  }
  function sortCount(a) {
    if (a.length <= 1) return [a, 0];
    const mid = a.length >> 1;
    const [l, c1] = sortCount(a.slice(0, mid));
    const [r, c2] = sortCount(a.slice(mid));
    const [m, c3] = merge(l, r);
    return [m, c1 + c2 + c3];
  }
  return sortCount(arr)[1];
}
```

## code.java
```java
class Inversions {
    long total;
    public long count(int[] a) {
        total = 0;
        int[] buf = new int[a.length];
        sort(a, 0, a.length - 1, buf);
        return total;
    }
    void sort(int[] a, int l, int r, int[] buf) {
        if (l >= r) return;
        int m = (l + r) >>> 1;
        sort(a, l, m, buf); sort(a, m + 1, r, buf);
        int i = l, j = m + 1, k = l;
        while (i <= m && j <= r) {
            if (a[i] <= a[j]) buf[k++] = a[i++];
            else { buf[k++] = a[j++]; total += m - i + 1; }
        }
        while (i <= m) buf[k++] = a[i++];
        while (j <= r) buf[k++] = a[j++];
        for (int x = l; x <= r; x++) a[x] = buf[x];
    }
}
```

## code.cpp
```cpp
#include <vector>
long long countInversions(std::vector<int>& a) {
    long long total = 0;
    std::vector<int> buf(a.size());
    auto sort = [&](auto& self, int l, int r) -> void {
        if (l >= r) return;
        int m = (l + r) / 2;
        self(self, l, m); self(self, m + 1, r);
        int i = l, j = m + 1, k = l;
        while (i <= m && j <= r) {
            if (a[i] <= a[j]) buf[k++] = a[i++];
            else { buf[k++] = a[j++]; total += m - i + 1; }
        }
        while (i <= m) buf[k++] = a[i++];
        while (j <= r) buf[k++] = a[j++];
        for (int x = l; x <= r; x++) a[x] = buf[x];
    };
    sort(sort, 0, a.size() - 1);
    return total;
}
```
