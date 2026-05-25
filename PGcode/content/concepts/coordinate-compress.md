---
slug: coordinate-compress
module: arrays-counting-select
title: Coordinate Compression
subtitle: Replace sparse large values with dense indices so sweepline and DP fit in a small array.
difficulty: Intermediate
position: 51
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Coordinate Compression — cp-algorithms"
    url: "https://cp-algorithms.com/data_structures/fenwick.html"
    type: blog
  - title: "Coordinate Compression — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/coordinate-compression/"
    type: blog
  - title: "kactl — Misc snippets"
    url: "https://github.com/kth-competitive-programming/kactl/tree/main/content/various"
    type: repo
status: published
---

## intro
Coordinate compression converts a list of values from a huge domain — say 32-bit integers or floating-point timestamps — into the dense range `[0, n)` while preserving relative order. Algorithms that need an array indexed by value (Fenwick trees, segment trees, sweepline counters, interval DPs) suddenly become feasible: an array of size n replaces an array of size 10^9.

## whyItMatters
- **Codeforces, AtCoder, and SPOJ** editorials reach for coordinate compression every time `1 <= a_i <= 10^9` and `n <= 10^5`; the `kactl`, `indy256/codelibrary`, and `Errichto` snippets all ship it as a one-liner.
- **Postgres and ClickHouse** use **dictionary encoding** (coordinate compression in disguise) on low-cardinality columns; Parquet's dictionary pages and Apache Arrow's `DictionaryArray` apply the same trick for analytic workloads.
- **Sweep-line geometry** (LeetCode 218 Skyline, Bentley-Ottmann segment intersection, rectangle-area union) compresses x-coordinates before running a segment tree over events.
- **Inversion counting** and **K-th order statistic** problems pair compression with Fenwick trees to achieve O(n log n) where naive arrays would need impossible memory.

## intuition
The pattern that triggers coordinate compression is "I want an array indexed by some value, but the value space is huge while the number of distinct values I actually touch is tiny." A Fenwick tree over Unix timestamps in 2024 would need 2^31 buckets if indexed by epoch seconds, but only `n` of those buckets are ever touched in a problem with `n` events. Allocating two billion ints to use a few hundred thousand is wasteful in space and ruinous in cache behavior.

The observation that makes compression work: **most order-sensitive algorithms care about relative order, not absolute value**. Sorting, ranking, range queries on counts, prefix sums, sweep-line events — none of them need to know that `x = 1,700,005,678`. They need to know "this `x` is the third-smallest distinct `x` in the input." If we replace every coordinate with its rank in the sorted distinct set, the algorithm runs identically because the relative ordering is preserved. We have lost the absolute values, but we kept them in a side table for the final answer.

Three mechanical steps. **First**, collect every coordinate that will ever be queried or updated (offline: scan the input once). **Second**, sort and dedupe to get the rank table — distinct values listed in ascending order. **Third**, replace each original coordinate with its rank via binary search or hash lookup. Now your structure indexes from 0 to (distinct - 1), which is dense, cache-friendly, and small. Convert back to original values only at the output boundary, when reporting answers to the user.

The transformation is invertible because we keep the sorted-unique array alongside the compressed indices. This is what separates compression from lossy hashing — every compressed index maps back to exactly one original value, so the algorithm output can always be translated to the user's coordinate system.

## visualization
Input `[100, 5000, 100, 42, 999999]`. Distinct sorted: `[42, 100, 5000, 999999]`. Rank map: `42 -> 0, 100 -> 1, 5000 -> 2, 999999 -> 3`. Compressed input: `[1, 2, 1, 0, 3]`. A Fenwick tree of size 4 now handles range-rank queries that would have needed an array of size one million on the raw values. The recipe is mechanical: sort, dedupe, binary-search the rank. Two design choices — whether to dedupe (yes, almost always) and whether to compress only the values that appear or also their neighbors (only the neighbors when you need to query gaps in sweepline area problems).

## bruteForce
Sweepline algorithms that work directly on raw values often try to allocate `O(max_value)` storage and discover at runtime that the value domain is too large. Workarounds — hash maps keyed by value, balanced BSTs, sparse segment trees — all work and are sometimes the right answer when values stream in online. But for an offline batch of queries, the constant factor of a flat compressed array beats every tree-based or hashed alternative by a factor of 5 to 20.

## optimal
The canonical pattern is **sort-dedupe-rank** in three lines, achieving O(n log n) preprocessing and O(1) or O(log n) lookup. Build the rank table once, then every downstream structure (Fenwick, segment tree, hash bucket) indexes into `[0, xs.size())` — dense, cache-friendly, and asymptotically optimal. Knuth's *TAOCP* Vol. 3 discusses this under "rank sequences"; the same algorithm underlies dictionary encoding in columnar databases.

```cpp
#include <vector>
#include <algorithm>

// Returns (compressed indices, sorted unique table).
std::pair<std::vector<int>, std::vector<int>>
compress(const std::vector<int>& values) {
    std::vector<int> xs = values;
    std::sort(xs.begin(), xs.end());                                   // O(n log n)
    xs.erase(std::unique(xs.begin(), xs.end()), xs.end());             // O(n)
    std::vector<int> compressed(values.size());
    for (size_t i = 0; i < values.size(); ++i)
        compressed[i] = std::lower_bound(xs.begin(), xs.end(), values[i])
                      - xs.begin();                                    // O(log n)
    return {compressed, xs};
}

// Query rank of an arbitrary value (may not be in `values`).
int rank_of(const std::vector<int>& xs, int q) {
    return std::lower_bound(xs.begin(), xs.end(), q) - xs.begin();     // O(log n)
}
```

Why this is right: it preserves total order (so `compressed[i] < compressed[j]` iff `values[i] < values[j]`), it shrinks the index range to exactly `set(values).size()`, and it costs only one sort plus one pass. Any algorithm that depends on rank — Fenwick for inversion counting, segment-tree-on-sweep, K-th order statistic via persistent segment tree, range min/max queries — drops in unchanged.

**Critical preprocessing rule**: include **every value that will ever be queried**, not just the values present in updates. If you later ask "how many values are less than X?" and X never appeared in updates, X's rank must still be well-defined. Collect all update-values AND all query-values upfront, then compress the union.

**When this is not enough**: if new values arrive online (you cannot enumerate them upfront), use a **dynamic segment tree** (lazy-allocated nodes, O(log V) per op where V is the value range), a **balanced BST keyed by raw value** (`std::set` with order statistics via `__gnu_pbds::tree`), or a **persistent segment tree** for versioned queries. cp-algorithms and PEGWiki document these alternatives.

**For sweep-line problems**: collect every x-coordinate that appears in any event (start or end of an interval), compress, then run the sweep over rank indices — exactly how the LeetCode 218 Skyline reference solution works and how Bentley-Ottmann handles event scheduling. For 2D rectangle-union problems, compress x and y independently and run a 2D segment tree over the compressed grid.

## complexity
time: O(n log n) to build the rank map, O(log n) per query
space: O(n) for the sorted unique vector and the rank map (or just the vector if you binary-search at query time)
notes: When values are integers and the domain is bounded, radix sort or bucket counting cuts the build to O(n). When queries arrive online with new values, switch to a balanced BST or order-statistics tree to maintain ranks incrementally in O(log n).

## pitfalls
- Forgetting to include query values in the set of values being compressed. If you later ask "how many values are less than X?" and X never appeared in the input, your rank map will not contain it.
- Deduping after assigning ranks instead of before — produces non-contiguous indices and wastes the savings.
- Off-by-one on `lower_bound` vs `upper_bound`: pick `lower_bound` for "rank of v" and document it.
- Storing the sentinel as the null character in any serialization layer — never use the null byte; Postgres and many transports reject it. Use `'$'` or `'#'`.

## interviewTips
- Reach for compression any time the problem states the value range as `10^9` or larger and the algorithm wants an array indexed by value.
- Pair with Fenwick trees for the most common interview combo: range-sum or rank-query over an unbounded domain.
- Mention sweepline area problems by name — they are the canonical motivating use case beyond competitive programming.

## code.python
```python
from bisect import bisect_left

def coordinate_compress(values):
    xs = sorted(set(values))
    rank = {v: i for i, v in enumerate(xs)}
    compressed = [rank[v] for v in values]
    return compressed, xs

def rank_of(xs, v):
    i = bisect_left(xs, v)
    return i if i < len(xs) and xs[i] == v else -1
```

## code.javascript
```javascript
function coordinateCompress(values) {
  const xs = [...new Set(values)].sort((a, b) => a - b);
  const rank = new Map(xs.map((v, i) => [v, i]));
  const compressed = values.map((v) => rank.get(v));
  return { compressed, xs };
}

function rankOf(xs, v) {
  let lo = 0, hi = xs.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] < v) lo = mid + 1; else hi = mid;
  }
  return lo < xs.length && xs[lo] === v ? lo : -1;
}
```

## code.java
```java
import java.util.*;

public int[] coordinateCompress(int[] values) {
    TreeSet<Integer> set = new TreeSet<>();
    for (int v : values) set.add(v);
    Map<Integer, Integer> rank = new HashMap<>();
    int idx = 0;
    for (int v : set) rank.put(v, idx++);
    int[] compressed = new int[values.length];
    for (int i = 0; i < values.length; i++) compressed[i] = rank.get(values[i]);
    return compressed;
}

public int rankOf(int[] xs, int v) {
    int lo = 0, hi = xs.length;
    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        if (xs[mid] < v) lo = mid + 1; else hi = mid;
    }
    return lo < xs.length && xs[lo] == v ? lo : -1;
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>

std::pair<std::vector<int>, std::vector<int>> coordinateCompress(const std::vector<int>& values) {
    std::vector<int> xs(values.begin(), values.end());
    std::sort(xs.begin(), xs.end());
    xs.erase(std::unique(xs.begin(), xs.end()), xs.end());
    std::vector<int> compressed;
    compressed.reserve(values.size());
    for (int v : values) {
        compressed.push_back(std::lower_bound(xs.begin(), xs.end(), v) - xs.begin());
    }
    return {compressed, xs};
}

int rankOf(const std::vector<int>& xs, int v) {
    auto it = std::lower_bound(xs.begin(), xs.end(), v);
    if (it == xs.end() || *it != v) return -1;
    return it - xs.begin();
}
```
