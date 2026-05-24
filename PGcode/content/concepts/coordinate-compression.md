---
slug: coordinate-compression
module: arrays-searching
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
The "huge coordinate space, few distinct values" pattern is everywhere: timestamps (Unix epoch), prices, geographic coordinates, sparse indices in segment-tree-based DPs. Without compression you'd need persistent / sparse segment trees or hash maps — heavier code and slower constants. With compression, the same algorithm runs on a dense [0, n) array.

## intuition
Three steps:
1. Collect every distinct coordinate value into a sorted, deduplicated list.
2. Map each original value to its index in that list (binary search).
3. Run your algorithm in the compressed space; un-map at the end if you need original values.

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
```
def compress(values):
    sorted_unique = sorted(set(values))
    rank = { v: i for i, v in enumerate(sorted_unique) }
    return [rank[v] for v in values], sorted_unique

# Usage:
# compressed, original = compress(timestamps)
# Run segment-tree / Fenwick / sweep keyed by compressed[i].
# Convert back: original_value = original[compressed_index].
```

When updates introduce new values online, this technique breaks down — use a persistent / dynamic segment tree, or batch updates and recompress periodically.

For sweep-line-with-segment-tree problems, compress the union of all x-coordinates that appear in any event before running the sweep.

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
