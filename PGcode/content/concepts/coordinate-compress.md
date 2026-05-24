---
slug: coordinate-compress
module: arrays-searching
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
A Fenwick tree over `10^9` is a non-starter. A Fenwick tree over the `n` distinct values that actually appear is a few kilobytes. Coordinate compression is the bridge between "the problem is stated over arbitrary integers" and "I need an O(n log n) algorithm that runs in 64 MB." It shows up in every competitive-programming toolkit and in real systems whenever you bucket sparse keys for a histogram or rank query.

## intuition
Only the relative order of values matters to comparison-based algorithms. So sort the distinct values, give each its rank in the sorted list, and replace every occurrence of a value `v` in the input by its rank. The transformation is invertible — keep the sorted unique list and you can map ranks back to original values whenever you need to report an answer.

## visualization
Input `[100, 5000, 100, 42, 999999]`. Distinct sorted: `[42, 100, 5000, 999999]`. Rank map: `42 -> 0, 100 -> 1, 5000 -> 2, 999999 -> 3`. Compressed input: `[1, 2, 1, 0, 3]`. A Fenwick tree of size 4 now handles range-rank queries that would have needed an array of size one million on the raw values. The recipe is mechanical: sort, dedupe, binary-search the rank. Two design choices — whether to dedupe (yes, almost always) and whether to compress only the values that appear or also their neighbors (only the neighbors when you need to query gaps in sweepline area problems).

## bruteForce
Sweepline algorithms that work directly on raw values often try to allocate `O(max_value)` storage and discover at runtime that the value domain is too large. Workarounds — hash maps keyed by value, balanced BSTs, sparse segment trees — all work and are sometimes the right answer when values stream in online. But for an offline batch of queries, the constant factor of a flat compressed array beats every tree-based or hashed alternative by a factor of 5 to 20.

## optimal
Step 1: copy all values that will ever be queried into a vector `xs`. Step 2: sort `xs` and remove duplicates. Step 3: for each original value `v`, replace it with `lower_bound(xs, v) - xs.begin()`. Now every algorithm operates on indices in `[0, xs.size())`. To report an answer in original units, index back into `xs`. Total work O(n log n) for the sort plus O(log n) per lookup.

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
