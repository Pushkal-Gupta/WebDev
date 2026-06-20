---
slug: prefix-sum
module: arrays-range-structures
title: Prefix Sums
subtitle: Precompute running totals once, then answer any range-sum query in O(1).
difficulty: Beginner
position: 5
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Prefix Sum Array — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/prefix-sum-array-implementation-applications-competitive-programming/"
    type: blog
  - title: "Prefix sum — Wikipedia"
    url: "https://en.wikipedia.org/wiki/Prefix_sum"
    type: article
  - title: "Range Sum Query - Immutable — LeetCode 303"
    url: "https://leetcode.com/problems/range-sum-query-immutable/"
    type: problem
status: published
---

## intro
A prefix sum is a running total: `prefix[i]` holds the sum of the first `i` elements of an array. Build that table once in a single linear pass, and the sum of any contiguous slice `arr[l..r]` collapses to a single subtraction — `prefix[r+1] - prefix[l]`. It turns a repeated O(n) scan into an O(1) lookup, and it is the seed idea behind difference arrays, 2D range sums, subarray-sum-equals-k counting, and Fenwick trees.

## whyItMatters
The moment a problem asks "sum of this subarray" more than once, a naive re-scan becomes the bottleneck: `q` queries over an array of length `n` cost O(n·q). Prefix sums knock that down to O(n) build plus O(1) per query, so `q` queries become O(n + q) total. **LeetCode 303 (Range Sum Query - Immutable)**, **304 (Range Sum Query 2D)**, **560 (Subarray Sum Equals K)**, **523 (Continuous Subarray Sum)**, and **974 (Subarray Sums Divisible by K)** are all prefix-sum problems wearing different hats. Beyond interviews, the pattern underpins histogram equalization in image processing, integral images in computer vision (Viola-Jones face detection), cumulative distribution functions in statistics, and the parallel scan primitive that GPUs use for stream compaction and radix sort.

## intuition
Think of a hiker logging their odometer at each checkpoint. The log records total distance from the trailhead at every point — not the leg-by-leg distances. To recover the distance between checkpoint 3 and checkpoint 7, you do not re-walk the trail; you subtract: odometer at 7 minus odometer at 3. The legs in between cancel cleanly because the odometer already accumulated all of them. That subtraction is the entire trick.

Make it concrete. Take `arr = [3, 1, 4, 1, 5]`. Build a prefix table padded with a leading zero so index math stays clean: `prefix = [0, 3, 4, 8, 9, 14]`. Here `prefix[k]` is the sum of the first `k` elements, so `prefix[0] = 0` (sum of nothing), `prefix[1] = 3`, `prefix[2] = 3+1 = 4`, and so on. Now ask: what is the sum of `arr[1..3]` (the `1, 4, 1`)? Answer: `prefix[4] - prefix[1] = 9 - 3 = 6`. The leading legs `arr[0]` got counted in both totals, so subtracting wipes them out and leaves exactly the slice you wanted.

Why the leading zero matters: it lets the formula `prefix[r+1] - prefix[l]` cover the case `l = 0` (a query that starts at the very front) without a special branch. Without the pad you would write `prefix[r] - prefix[l-1]` and have to guard `l == 0` separately — a classic off-by-one bug.

The deeper idea is **inversion**. Summation and subtraction are inverse operations, so a cumulative sum is invertible: any window's contribution is the difference of two cumulative values. The same shape generalizes — replace addition with XOR and you get prefix-XOR for range-XOR queries; replace it with multiplication (carefully, around zeros) and you get prefix-products; extend to two dimensions and you get the inclusion-exclusion box formula for submatrix sums. Once you see range-query-as-difference, a whole family of problems opens up.

## visualization
```
arr      :        3     1     4     1     5
index    :        0     1     2     3     4

prefix   :  0     3     4     8     9    14
index    :  0     1     2     3     4     5
            ^ pad

query sum(arr[1..3])  =  prefix[4] - prefix[1]
                      =     9      -    3
                      =     6        (== 1 + 4 + 1)

query sum(arr[0..4])  =  prefix[5] - prefix[0]
                      =    14      -    0
                      =    14        (== whole array)
```

## bruteForce
For each query `(l, r)`, loop from `l` to `r` and add the elements. Each query costs O(r - l + 1), up to O(n) in the worst case, so `q` queries cost O(n·q). It needs no extra memory and is trivially correct, which makes it a fine warm-up answer — but the instant the interviewer says "now imagine a million queries" or "the array does not change between queries," the repeated re-scan is the obvious thing to eliminate by precomputing once.

## optimal
**Precompute a prefix table, answer each query as one subtraction.** Build is O(n) time and O(n) space; each query is O(1).

```python
def build_prefix(arr):
    prefix = [0] * (len(arr) + 1)
    for i, x in enumerate(arr):
        prefix[i + 1] = prefix[i] + x   # running total, leading zero pad
    return prefix

def range_sum(prefix, l, r):
    return prefix[r + 1] - prefix[l]    # inclusive sum of arr[l..r]
```

Why this is right: `prefix[k]` is defined as the sum of `arr[0..k-1]`. The sum of `arr[l..r]` equals (sum of the first `r+1` elements) minus (sum of the first `l` elements), and every element `arr[0..l-1]` appears in both totals, so it cancels — leaving exactly `arr[l] + ... + arr[r]`. The leading zero makes `l = 0` fall out of the same formula instead of needing a branch.

**Why the alternatives lose:**
- **Re-scan per query**: O(n·q), wasteful whenever queries outnumber a constant or the array is static.
- **Segment tree / Fenwick tree**: O(log n) per query and necessary when the array is *mutable* between queries — but for an immutable array they are overkill. Prefix sum is strictly simpler and faster (O(1) vs O(log n)) when no updates occur.

**The mutable extension — difference arrays.** If instead of point queries you have many *range updates* ("add `v` to every element in `[l, r]`") followed by one final read, flip the technique: keep a difference array `diff`, do `diff[l] += v` and `diff[r+1] -= v` per update (O(1) each), then prefix-sum `diff` once at the end to materialize the final array. Prefix sum and difference array are inverses — one accumulates, the other un-accumulates.

**Two dimensions.** For submatrix sums, build a 2D prefix table where `P[i][j]` is the sum of the rectangle from the origin to `(i, j)`. A submatrix sum then uses inclusion-exclusion: `P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]` — subtract the two overhanging strips, add back the corner you double-subtracted.

**The hash-map twist (LeetCode 560).** To *count* subarrays summing to `k`, walk the running sum and, at each index, ask "how many earlier prefixes equal `running - k`?" using a hash map of prefix-frequency. That converts an O(n²) subarray scan into a single O(n) pass — the most-tested prefix-sum interview variant.

The one-line interview answer: "Precompute cumulative sums once; any range sum is the difference of two prefix values — O(n) build, O(1) per query."

## complexity
time: O(n) build, O(1) per query (so O(n + q) for q queries)
space: O(n) for the prefix table
notes: The brute-force re-scan is O(n·q). For an immutable array, prefix sum's O(n + q) is optimal — you must read every element once and answer each query in constant time. If the array is *mutable* between queries, a Fenwick tree at O(log n) per op replaces it. The 2D variant is O(m·n) build and O(1) per rectangle query.

## pitfalls
- **Off-by-one on the boundaries.** With the leading-zero pad the formula is `prefix[r+1] - prefix[l]`; without the pad it is `prefix[r] - prefix[l-1]`, which crashes or misreads when `l = 0`. Pick one convention and write it down before coding.
- **Integer overflow.** Cumulative sums grow much larger than individual elements; sums over `10^5` ints near the 32-bit limit overflow `int`. Use `long`/`int64` for the prefix array in Java and C++.
- **Confusing inclusive vs exclusive `r`.** Decide whether the query range includes `r` and keep it consistent. An inclusive `[l, r]` query needs `prefix[r+1]`; an exclusive `[l, r)` query needs `prefix[r]`.
- **Mutating the array after building.** A prefix table is only valid for the snapshot it was built from. If the underlying array changes, the table is stale — reach for a Fenwick/segment tree instead of rebuilding on every update.
- **Forgetting the `+ P[r1][c1]` term in 2D.** The top-left corner gets subtracted twice by the two strip terms, so inclusion-exclusion must add it back once.

## interviewTips
- Lead with the trade-off: "If the array is static, prefix sum gives O(1) queries after O(n) build; if it mutates between queries, I'd switch to a Fenwick tree for O(log n) updates."
- Always use the leading-zero pad and state why — it removes the `l == 0` special case and the off-by-one that interviewers probe for.
- Know the three canonical extensions cold: difference array (range update), 2D prefix (submatrix sum), and prefix-sum-plus-hashmap (count subarrays equal to `k`, LeetCode 560) — one of them is almost always the real question.

## code.python
```python
def build_prefix(arr):
    prefix = [0] * (len(arr) + 1)
    for i, x in enumerate(arr):
        prefix[i + 1] = prefix[i] + x
    return prefix

def range_sum(prefix, l, r):
    return prefix[r + 1] - prefix[l]

def subarray_sum_count(arr, k):
    from collections import defaultdict
    seen = defaultdict(int)
    seen[0] = 1
    running = count = 0
    for x in arr:
        running += x
        count += seen[running - k]
        seen[running] += 1
    return count
```

## code.javascript
```javascript
function buildPrefix(arr) {
  const prefix = new Array(arr.length + 1).fill(0);
  for (let i = 0; i < arr.length; i++) prefix[i + 1] = prefix[i] + arr[i];
  return prefix;
}

function rangeSum(prefix, l, r) {
  return prefix[r + 1] - prefix[l];
}

function subarraySumCount(arr, k) {
  const seen = new Map([[0, 1]]);
  let running = 0, count = 0;
  for (const x of arr) {
    running += x;
    count += seen.get(running - k) || 0;
    seen.set(running, (seen.get(running) || 0) + 1);
  }
  return count;
}
```

## code.java
```java
public long[] buildPrefix(int[] arr) {
    long[] prefix = new long[arr.length + 1];
    for (int i = 0; i < arr.length; i++) prefix[i + 1] = prefix[i] + arr[i];
    return prefix;
}

public long rangeSum(long[] prefix, int l, int r) {
    return prefix[r + 1] - prefix[l];
}

public int subarraySumCount(int[] arr, int k) {
    java.util.Map<Long, Integer> seen = new java.util.HashMap<>();
    seen.put(0L, 1);
    long running = 0;
    int count = 0;
    for (int x : arr) {
        running += x;
        count += seen.getOrDefault(running - k, 0);
        seen.merge(running, 1, Integer::sum);
    }
    return count;
}
```

## code.cpp
```cpp
#include <vector>
#include <unordered_map>
using namespace std;

vector<long long> buildPrefix(const vector<int>& arr) {
    vector<long long> prefix(arr.size() + 1, 0);
    for (size_t i = 0; i < arr.size(); i++) prefix[i + 1] = prefix[i] + arr[i];
    return prefix;
}

long long rangeSum(const vector<long long>& prefix, int l, int r) {
    return prefix[r + 1] - prefix[l];
}

int subarraySumCount(const vector<int>& arr, int k) {
    unordered_map<long long, int> seen;
    seen[0] = 1;
    long long running = 0;
    int count = 0;
    for (int x : arr) {
        running += x;
        auto it = seen.find(running - k);
        if (it != seen.end()) count += it->second;
        seen[running]++;
    }
    return count;
}
```
