---
slug: counting-sort-algorithm
module: sorting-strings
title: Counting Sort
subtitle: Sort integers in a known small range in O(n + k) by tallying frequencies — non-comparison, stable, the engine behind radix sort.
difficulty: Intermediate
position: 8
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Counting Sort"
    url: "https://walkccc.me/CLRS/Chap08/8.2/"
    type: book
  - title: "GeeksforGeeks — Counting Sort"
    url: "https://www.geeksforgeeks.org/counting-sort/"
    type: blog
  - title: "TheAlgorithms/Python — counting_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/sorts/counting_sort.py"
    type: repo
status: published
---

## intro
Counting sort sorts integers drawn from a range `[0, k)` in `O(n + k)` time. It builds a length-`k` array of frequencies, converts the frequencies into prefix sums (so `count[v]` becomes the index *after* the last `v`), then iterates the input from right to left, placing each element into the output array at the position dictated by `count[]`. The algorithm makes zero comparisons between elements, so the comparison-sort lower bound (`Ω(n log n)`) does not apply — when `k = O(n)`, counting sort is linear.

## whyItMatters
- When the value range is small (ages, grades, bytes), counting sort beats every comparison sort.
- It is the **stable subroutine** inside radix sort; without stability, radix sort is wrong.
- Bucket sort, histogram analysis, and Hadoop's terasort all build on the same frequency-then-cumulative idea.
- It is the textbook example of **non-comparison sorting** — used to explain why the `Ω(n log n)` bound is about comparisons, not about sorting in general.
- For DNA sequences (alphabet of 4), pixel buckets (256 values), and similar finite alphabets, counting sort is the right answer.

## intuition
If the values are integers in `[0, k)`, you don't need to compare them — you can just count how many of each value the input contains. Once you know "there are 3 zeros, 2 ones, 5 twos, ...", you also know where each value's block belongs in the sorted output: the zeros occupy indices `0..2`, the ones occupy `3..4`, the twos occupy `5..9`, and so on. The prefix-sum step turns the frequency array into exactly those boundaries.

To produce a **stable** sort (equal keys preserve input order) you must walk the input from **right to left**. Each time you place an element of value `v`, you put it at index `count[v] - 1` and then decrement `count[v]`. Because you walked rightward elements first, they land at the larger indices within their block, preserving relative order. Reverse the walk direction and stability breaks.

The same algorithm extends to negative or shifted ranges by adding an offset (`value - min`). It extends to sorting **records by an integer key** by storing pointers to the records instead of the integers themselves — this is exactly what radix sort does at each digit pass. The catch is space: if `k` is enormous compared to `n` (sorting 32-bit integers without radix), the count array dominates and the algorithm becomes impractical.

## visualization
Sort `[4, 2, 2, 8, 3, 3, 1]` with `k = 9`.

```
input:        [4, 2, 2, 8, 3, 3, 1]      n=7, k=9

count (raw frequencies):
   v:   0  1  2  3  4  5  6  7  8
   c:   0  1  2  2  1  0  0  0  1

count (prefix sums):
   v:   0  1  2  3  4  5  6  7  8
   c:   0  1  3  5  6  6  6  6  7    c[v] = first index AFTER value v

walk input right-to-left, place at count[v]-1, decrement:
   v=1 -> idx 0 ; count: 0 0 3 5 6 6 6 6 7
   v=3 -> idx 4 ; count: 0 0 3 4 6 6 6 6 7
   v=3 -> idx 3 ; count: 0 0 3 3 6 6 6 6 7
   v=8 -> idx 6 ; count: 0 0 3 3 6 6 6 6 6
   v=2 -> idx 2 ; count: 0 0 2 3 6 6 6 6 6
   v=2 -> idx 1 ; count: 0 0 1 3 6 6 6 6 6
   v=4 -> idx 5 ; count: 0 0 1 3 5 6 6 6 6

output:       [1, 2, 2, 3, 3, 4, 8]
```

## bruteForce
A comparison sort on this input takes `O(n log n)` even though the value range is tiny. With `n = 10^6` and `k = 256` (bytes), comparison sorts do `~2 * 10^7` operations while counting sort does `~2 * 10^6` — a clear win.

## optimal
Three passes: count, prefix-sum, place.

```python
def counting_sort(a: list[int], k: int) -> list[int]:
    count = [0] * k
    for x in a: count[x] += 1
    for v in range(1, k): count[v] += count[v - 1]
    out = [0] * len(a)
    for x in reversed(a):
        count[x] -= 1
        out[count[x]] = x
    return out
```

For arbitrary integer ranges, shift by `min(a)` so the values become `[0, max - min + 1)`. To sort **records** by integer key, replace the third pass with one that copies the whole record (or its index) into `out`. Memory cost is `O(n + k)`; if `k` dominates `n`, switch to bucket sort or radix sort instead.

## complexity
- **Time**: `O(n + k)` — three linear passes over `n` and one over `k`.
- **Space**: `O(n + k)` — the count array and the output array.
- **Stable**: yes, when the placement pass walks right to left.
- **Non-comparison**: bypasses the `Ω(n log n)` lower bound.

## pitfalls
- **Walking left-to-right during placement.** Destroys stability — equal keys land in reverse input order. Fix: iterate the input with `reversed(a)`.
- **Forgetting to decrement `count[v]` after placement.** All equal keys end up at the same index. Fix: decrement *before* writing, since `count[v]` is the index *after* the last `v`.
- **Sorting unbounded integers.** If `k = 2^31`, the count array is 8 GB. Fix: switch to radix sort, which is counting sort applied digit-by-digit.
- **Forgetting the offset for negative values.** Negative indices crash. Fix: shift by `-min(a)` before counting.

## interviewTips
- Lead with the `O(n + k)` claim and immediately add "when `k = O(n)`, this is linear" — interviewers want you to bound `k`.
- Explain why right-to-left iteration is needed for stability; it is the most common follow-up.
- Mention radix sort as the natural extension when `k` is too large for direct counting.

## code.python
```python
def counting_sort(a, k):
    count = [0] * k
    for x in a: count[x] += 1
    for v in range(1, k): count[v] += count[v - 1]
    out = [0] * len(a)
    for x in reversed(a):
        count[x] -= 1
        out[count[x]] = x
    return out
```

## code.javascript
```javascript
function countingSort(a, k) {
  const count = new Array(k).fill(0);
  for (const x of a) count[x]++;
  for (let v = 1; v < k; v++) count[v] += count[v - 1];
  const out = new Array(a.length);
  for (let i = a.length - 1; i >= 0; i--) {
    const x = a[i];
    out[--count[x]] = x;
  }
  return out;
}
```

## code.java
```java
public int[] countingSort(int[] a, int k) {
    int[] count = new int[k];
    for (int x : a) count[x]++;
    for (int v = 1; v < k; v++) count[v] += count[v - 1];
    int[] out = new int[a.length];
    for (int i = a.length - 1; i >= 0; i--) {
        int x = a[i];
        out[--count[x]] = x;
    }
    return out;
}
```

## code.cpp
```cpp
vector<int> countingSort(const vector<int>& a, int k) {
    vector<int> count(k, 0);
    for (int x : a) count[x]++;
    for (int v = 1; v < k; v++) count[v] += count[v - 1];
    vector<int> out(a.size());
    for (int i = (int)a.size() - 1; i >= 0; i--) {
        int x = a[i];
        out[--count[x]] = x;
    }
    return out;
}
```
