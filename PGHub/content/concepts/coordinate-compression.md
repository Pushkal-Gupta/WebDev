---
slug: coordinate-compression
module: arrays-counting-select
title: Coordinate Compression
subtitle: Replace large coordinate values with their rank — so an algorithm that's O(range) becomes O(n) over the n distinct values used.
difficulty: Beginner
position: 23
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "GeeksforGeeks — Coordinate Compression"
    url: "https://www.geeksforgeeks.org/coordinate-compression/"
    type: blog
  - title: "indy256/codelibrary — algorithms and data structures"
    url: "https://github.com/indy256/codelibrary"
    type: repo
status: published
---

## intro
Many algorithms allocate arrays indexed by coordinate values: segment trees by index, Fenwick trees by index, sweep-line buckets by x. If your coordinates are in [0, 10^9] but you only ever touch n = 10^5 of them, you can't allocate 10^9 ints. **Coordinate compression** replaces each distinct coordinate with its rank in the sorted set of all coordinates, shrinking the indexing range to [0, n).

## whyItMatters
- **Competitive programming**: nearly every Codeforces problem with `1 ≤ a_i ≤ 10^9` and `n ≤ 10^5` solved via Fenwick or segment tree starts with a compression pass — the same idea appears in editorial solutions for SPOJ, AtCoder, and TopCoder.
- **Sweep-line geometry**: rectangle-area union, skyline (LeetCode 218), point-in-rectangle queries all sweep over compressed x-coordinates; Bentley-Ottmann segment intersection assumes a discrete event set.
- **Database query planners**: Postgres and SQLite build **dictionary encodings** (a coordinate compression in disguise) for low-cardinality columns; ClickHouse and Parquet use the same trick to make group-by O(distinct) instead of O(rows).
- **Inversion counting**: the classic `count_inversions(arr)` for arbitrary integers needs compression + Fenwick — running `BIT[10^9]` is impossible, `BIT[n]` after compression is trivial.

## intuition
The pattern that triggers coordinate compression is "I want an array indexed by some value, but the value space is huge while the number of distinct values I actually touch is tiny." A Fenwick tree over timestamps in the year 2024 needs 2^31 buckets if indexed by Unix epoch seconds, but only `n` of those buckets are ever touched in a problem with `n` events. Allocating two billion ints to use a few hundred thousand is wasteful in space and ruinous in cache behavior.

The observation that makes it work: **most order-sensitive algorithms care about relative order, not absolute value**. Sorting, ranking, range queries on counts, prefix sums, sweep-line events — none of them need to know that x = 1,700,005,678. They need to know "this x is the third-smallest distinct x in the input." If we replace every coordinate with its rank in the sorted distinct set, the algorithm runs identically because the relative ordering is preserved. We have lost the absolute values, but we kept them in a side table for the final answer.

Three mechanical steps. First, collect every coordinate that will ever be queried or updated (offline: scan the input). Second, sort and dedupe to get the rank table. Third, replace each original coordinate with its rank via binary search or hash lookup. Now your structure indexes from 0 to (distinct - 1), which is dense, cache-friendly, and small. Convert back to original values only at the boundary, when reporting answers to the user.

## visualization
```
Original timestamps: [1700001234, 1700005678, 1700001234, 1700009999, 1700002000]

Sorted unique:       [1700001234, 1700002000, 1700005678, 1700009999]
Index by rank:        0,          1,          2,          3

Compressed indices:   [0, 2, 0, 3, 1]   (replace each original by its rank)
```

## bruteForce
Skip compression, use a hash map keyed by original value. Works correctly but loses the cache-friendly random access of a dense array. For Fenwick / segment trees specifically, the algorithm requires integer indexing — hash maps don't fit.

## optimal
The canonical offline pattern is **sort-dedupe-rank**, achieving O(n log n) preprocessing and O(1) or O(log n) lookup. Build the rank table once, then every downstream structure (Fenwick, segment tree, hash bucket) indexes into [0, n) — dense, cache-friendly, and asymptotically optimal. Knuth's *TAOCP* Vol. 3 discusses this under "rank sequences"; competitive programming libraries like `indy256/codelibrary` and `kactl` ship it as a one-liner.

```python
from bisect import bisect_left

def compress(values):
    table = sorted(set(values))                 # O(n log n)
    rank  = {v: i for i, v in enumerate(table)} # O(n)
    return [rank[v] for v in values], table     # O(n)

# For queries on a value q not necessarily in `values`:
def rank_of(q, table):                          # O(log n)
    return bisect_left(table, q)
```

Why this is right: it preserves total order (so `compressed[i] < compressed[j]` iff `values[i] < values[j]`), it shrinks the index range to exactly `len(set(values))`, and it costs only one sort plus one pass. Any algorithm that depends on rank — Fenwick for inversion counting, segment-tree-on-sweep, K-th order statistic via persistent segment tree, range min/max queries — drops in unchanged.

**When this is not enough**: if new values arrive online (you cannot enumerate them upfront), use a **dynamic segment tree** (lazy-allocated nodes, O(log V) per op where V is the value range) or a **balanced BST** keyed by raw value (`std::set` order statistics tree, or `policy_tree` from `__gnu_pbds`). Persistent segment trees (Krishna Reddy, Marjit) extend this to versioned queries — used in Quora's "K-th smallest in range" interview problem and Codeforces' persistent-BIT tutorials.

**For sweep-line problems**: collect every x-coordinate that appears in any event (start or end of an interval), compress, then run the sweep over rank indices — this is exactly how the LeetCode 218 (Skyline) reference solution works, and how Bentley-Ottmann handles event scheduling. For 2D problems (rectangle union, KD-tree on integer grids), compress x and y independently.

## complexity
- **Time**: O(n log n) for sort + map build, O(log n) per lookup if you binary-search the sorted list, O(1) if you use a hash map for `rank`.
- **Space**: O(n) for the sorted_unique array + rank dict.
- **Wins**: turn a 10^9-indexed structure into a 10^5-indexed one.

## pitfalls
- **Forgetting to include query coordinates** in the compression: queries at coordinates not in any update need to be compressed too. Collect ALL relevant values upfront.
- **Off-by-one between strict-less and less-or-equal queries**: after compression, `bisect_left` vs `bisect_right` matters as much as before.
- **Range queries on un-compressed values**: convert query bounds to compressed indices via the same binary search.
- **Online additions of new values**: standard compression is offline. For online, use a balanced BST keyed by value, or a Fenwick tree over a coordinate-compressed superset prepared upfront.

## interviewTips
- The trigger: "coordinates can be up to 10^9 but n ≤ 10^5" → compress.
- Mention it BEFORE building the segment tree — interviewers want to see the preprocessing as part of the design.
- For "count inversions": compress + Fenwick is the canonical clean solution.
- For senior interviews, mention **persistent segment tree** as the dynamic alternative when values aren't known offline.

## code.python
```python
from bisect import bisect_left

def compress(values):
    sorted_unique = sorted(set(values))
    return [bisect_left(sorted_unique, v) for v in values], sorted_unique

ts = [1700001234, 1700005678, 1700001234, 1700009999, 1700002000]
compressed, original = compress(ts)
print(compressed)        # [0, 2, 0, 3, 1]
print(original[3])       # 1700009999
```

## code.javascript
```javascript
function compress(values) {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i]));
  return [values.map(v => rank.get(v)), sorted];
}
```

## code.java
```java
import java.util.*;
class Compress {
    public static Map.Entry<int[], int[]> compress(int[] values) {
        int[] sorted = Arrays.stream(values).distinct().sorted().toArray();
        Map<Integer, Integer> rank = new HashMap<>();
        for (int i = 0; i < sorted.length; i++) rank.put(sorted[i], i);
        int[] compressed = new int[values.length];
        for (int i = 0; i < values.length; i++) compressed[i] = rank.get(values[i]);
        return Map.entry(compressed, sorted);
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
std::pair<std::vector<int>, std::vector<int>> compress(std::vector<int> values) {
    std::vector<int> sorted(values);
    std::sort(sorted.begin(), sorted.end());
    sorted.erase(std::unique(sorted.begin(), sorted.end()), sorted.end());
    std::vector<int> compressed(values.size());
    for (size_t i = 0; i < values.size(); i++)
        compressed[i] = std::lower_bound(sorted.begin(), sorted.end(), values[i]) - sorted.begin();
    return { compressed, sorted };
}
```
