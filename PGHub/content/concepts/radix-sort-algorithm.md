---
slug: radix-sort-algorithm
module: sorting-strings
title: Radix Sort
subtitle: Sort fixed-width integers digit by digit using a stable bucket pass — O(d (n + k)) linear in n.
difficulty: Intermediate
position: 9
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Radix Sort"
    url: "https://walkccc.me/CLRS/Chap08/8.3/"
    type: book
  - title: "GeeksforGeeks — Radix Sort"
    url: "https://www.geeksforgeeks.org/radix-sort/"
    type: blog
  - title: "TheAlgorithms/Python — radix_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/sorts/radix_sort.py"
    type: repo
status: published
---

## intro
Radix sort sorts fixed-width integers by repeatedly applying a stable single-digit sort, starting from the least significant digit (LSD) and ending at the most significant. After `d` passes — where `d` is the number of digits — the array is fully sorted. Each pass is a stable counting sort over a small alphabet (10 for decimal, 256 for bytes), so each pass is `O(n + k)` and the total cost is `O(d (n + k))`. For 64-bit integers with byte-radix, `d = 8` and `k = 256`, making radix sort linear in `n` with a tiny constant.

## whyItMatters
- It is the fastest known sort for large arrays of fixed-width integers, including pixel IDs, GPU primitives, and database surrogate keys.
- It powers **terabyte-scale sorting benchmarks** (Hadoop TeraSort, GraySort) because the per-element cost is independent of `log n`.
- The **MSD** variant extends naturally to variable-length strings, used by lexicographic suffix-array builders.
- It exposes the **stability requirement** sharply — change the inner sort to an unstable one and radix sort breaks visibly.
- GPU implementations turn it into the de facto standard parallel sort because every pass is data-parallel.

## intuition
Sort numbers by their last digit, then by their second-to-last digit, then their third-to-last, and so on. Because each pass is **stable**, elements that tie on the current digit preserve the order established by earlier (less significant) digit sorts. After the final pass, the most significant digit dictates the overall order; ties on the most significant digit fall back to the next-most-significant, then the next, recursively all the way down — exactly the lexicographic comparison of digit-strings.

The reason it works is the same reason multi-key stable sorts work in general: if you stable-sort by key A, then stable-sort by key B, the result is "sorted by B, ties broken by A". Generalising to `d` keys (digits): sort by the least significant, then by the next, ..., then by the most significant; the final order is "sorted by most significant, ties broken by next, ..., ties broken by least significant" — which is the standard integer order.

The inner sort must be `O(n + k)` (counting sort) and **stable**. If you swap in quicksort you lose linearity; if you use an unstable sort you lose correctness. The radix `r` you choose trades passes for bucket size: `r = 10` gives 10 passes for an 8-digit integer; `r = 2^8 = 256` gives 4 passes for a 32-bit integer; `r = 2^16` gives 2 passes but a 65 536-bucket array, which thrashes cache. In practice byte-radix (256 buckets) is the sweet spot.

## visualization
Sort `[170, 45, 75, 90, 802, 24, 2, 66]` by decimal digits (LSD-first, three passes).

```
input:              170  45  75  90 802  24   2  66

pass 1 (digit = units): buckets 0..9
  0: 170, 90
  2: 802, 2
  4: 24
  5: 45, 75
  6: 66
after pass 1:       170  90 802   2  24  45  75  66

pass 2 (digit = tens):
  0: 802, 2
  2: 24
  4: 45
  6: 66
  7: 170, 75
  9: 90
after pass 2:       802   2  24  45  66 170  75  90

pass 3 (digit = hundreds):
  0:   2  24  45  66  75  90
  1: 170
  8: 802
after pass 3:         2  24  45  66  75  90 170 802
```

## bruteForce
Comparison sorts run in `O(n log n)`; for `n = 10^9` integers that's `~30 * 10^9` comparisons. Radix sort with `d = 4, k = 256` does `~4 * 10^9` array writes — roughly an order of magnitude fewer operations and with vastly better cache behaviour.

## optimal
LSD radix sort over byte digits.

```python
def radix_sort(a: list[int]) -> list[int]:
    if not a: return a
    R = 256                 # radix = one byte
    PASSES = 4              # for 32-bit unsigned ints
    out = a[:]
    for p in range(PASSES):
        shift = p * 8
        count = [0] * (R + 1)
        for x in out:
            count[((x >> shift) & 0xff) + 1] += 1
        for i in range(R):
            count[i + 1] += count[i]
        nxt = [0] * len(out)
        for x in out:
            d = (x >> shift) & 0xff
            nxt[count[d]] = x
            count[d] += 1
        out = nxt
    return out
```

This is **LSD** radix sort. **MSD** radix sort starts from the most significant digit and recurses on the buckets — it handles variable-length keys (strings) and stops as soon as a bucket has one element, which can outperform LSD on string data. For signed integers, flip the top bit before sorting and flip it back after, so the unsigned ordering matches the signed ordering. For floats, the bit-tricks are similar but require care with negatives.

## complexity
- **Time**: `O(d (n + k))`. With byte-radix and 64-bit ints: `d = 8, k = 256`, effectively `O(n)`.
- **Space**: `O(n + k)` — one output buffer and one count array per pass.
- **Stable**: yes — inherited from the inner counting sort, and required for correctness.
- **Inner sort**: must be stable and `O(n + k)`; counting sort is the standard choice.

## pitfalls
- **Using an unstable inner sort.** Breaks the whole multi-pass correctness argument — the array ends up in nonsense order. Fix: use stable counting sort or stable bucket sort only.
- **Picking the wrong radix.** Tiny radix means many passes; huge radix means cache thrash on the count array. Fix: byte-radix (256) is the sweet spot for most CPUs.
- **Ignoring signed-integer sign bit.** Negative numbers have the top bit set, so unsigned radix order puts them after positives. Fix: XOR the top bit before sorting and again after.
- **Allocating a fresh buffer per pass.** Repeated allocation dominates the cost. Fix: ping-pong between two pre-allocated buffers.

## interviewTips
- State the complexity carefully: `O(d (n + k))`. Then note that `d` and `k` are constants for fixed-width keys, giving effective `O(n)`.
- Mention the stability requirement and what happens if you ignore it.
- Differentiate **LSD vs MSD** — LSD is simpler for ints, MSD is the right choice for strings.

## code.python
```python
def radix_sort(a):
    R, PASSES = 256, 4
    out = list(a)
    for p in range(PASSES):
        shift = p * 8
        count = [0] * (R + 1)
        for x in out: count[((x >> shift) & 0xff) + 1] += 1
        for i in range(R): count[i + 1] += count[i]
        nxt = [0] * len(out)
        for x in out:
            d = (x >> shift) & 0xff
            nxt[count[d]] = x; count[d] += 1
        out = nxt
    return out
```

## code.javascript
```javascript
function radixSort(a) {
  const R = 256, PASSES = 4;
  let out = a.slice();
  for (let p = 0; p < PASSES; p++) {
    const shift = p * 8;
    const count = new Array(R + 1).fill(0);
    for (const x of out) count[((x >>> shift) & 0xff) + 1]++;
    for (let i = 0; i < R; i++) count[i + 1] += count[i];
    const nxt = new Array(out.length);
    for (const x of out) {
      const d = (x >>> shift) & 0xff;
      nxt[count[d]++] = x;
    }
    out = nxt;
  }
  return out;
}
```

## code.java
```java
public int[] radixSort(int[] a) {
    final int R = 256, PASSES = 4;
    int[] out = a.clone();
    for (int p = 0; p < PASSES; p++) {
        int shift = p * 8;
        int[] count = new int[R + 1];
        for (int x : out) count[((x >>> shift) & 0xff) + 1]++;
        for (int i = 0; i < R; i++) count[i + 1] += count[i];
        int[] nxt = new int[out.length];
        for (int x : out) {
            int d = (x >>> shift) & 0xff;
            nxt[count[d]++] = x;
        }
        out = nxt;
    }
    return out;
}
```

## code.cpp
```cpp
vector<uint32_t> radixSort(vector<uint32_t> a) {
    const int R = 256, PASSES = 4;
    vector<uint32_t> out = a, nxt(a.size());
    for (int p = 0; p < PASSES; p++) {
        int shift = p * 8;
        vector<int> count(R + 1, 0);
        for (uint32_t x : out) count[((x >> shift) & 0xff) + 1]++;
        for (int i = 0; i < R; i++) count[i + 1] += count[i];
        for (uint32_t x : out) {
            int d = (x >> shift) & 0xff;
            nxt[count[d]++] = x;
        }
        swap(out, nxt);
    }
    return out;
}
```
