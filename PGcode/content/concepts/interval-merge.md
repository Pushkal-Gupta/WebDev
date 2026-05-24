---
slug: interval-merge
module: arrays-searching
title: Merge Overlapping Intervals
subtitle: Sort by start, then sweep once — the canonical interval-merge template.
difficulty: Intermediate
position: 50
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Merge Overlapping Intervals — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/merging-intervals/"
    type: blog
  - title: "Princeton Algorithms — Sorting Applications"
    url: "https://algs4.cs.princeton.edu/25applications/"
    type: book
  - title: "TheAlgorithms/Python — merge_intervals.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/arrays/merge_intervals.py"
    type: repo
status: published
---

## intro
Given a list of closed intervals like `[(1, 4), (2, 5), (7, 9)]`, merging coalesces every set of overlapping or touching intervals into the smallest set whose union is identical. Sort by start, walk once, and either extend the last merged interval or open a new one. The same template underpins calendar-conflict checks, timeline rendering, lock-range coalescing, and most sweep-line problems.

## whyItMatters
Interval data is everywhere — bookings, log time windows, genome ranges, allocator-free lists. A naive O(n^2) all-pairs overlap check works for a few dozen intervals and explodes past that. Sorting by start collapses the work to O(n log n), and the merge logic itself is six lines. Once you internalize "sort by start, then check against the last result," dozens of follow-up problems (insert interval, free-slot finder, meeting-rooms count) become near-mechanical.

## intuition
After sorting by start, any interval that overlaps the current "in-progress" merged interval must overlap by its left endpoint. If the next interval's start is `<=` the current merged end, extend the end to the larger of the two. Otherwise the gap is real — emit the merged interval and open a new one with the next interval as its seed.

## visualization
Input `[(1, 3), (2, 6), (8, 10), (15, 18)]`. After sort by start (already sorted): start a buffer at `(1, 3)`. Next is `(2, 6)`: `2 <= 3`, so extend to `(1, 6)`. Next is `(8, 10)`: `8 > 6`, gap is real, emit `(1, 6)` and seed buffer with `(8, 10)`. Next is `(15, 18)`: `15 > 10`, emit `(8, 10)` and seed `(15, 18)`. End: emit `(15, 18)`. Result `[(1, 6), (8, 10), (15, 18)]`.

## bruteForce
Compare every pair of intervals and union the overlapping ones with a union-find or repeated linear sweeps. Correct but O(n^2) in the comparison count plus the union-find overhead, and the implementation is fiddly because removing intervals mid-iteration requires care. Acceptable for n less than a few hundred; never the answer in an interview that mentions large input.

## optimal
Sort the intervals by start in O(n log n). Initialize the result list with the first interval. For each subsequent interval `[s, e]`, peek at the last interval `[ls, le]` in the result. If `s <= le`, replace its end with `max(le, e)` — the merge. Otherwise push `[s, e]` as a fresh interval. Total work after the sort is O(n). Decide once at the top whether "touching" intervals like `[1, 2]` and `[2, 3]` merge by using `s <= le` (yes) or `s < le` (no).

## complexity
time: O(n log n) dominated by the sort
space: O(n) for the output list, O(1) auxiliary if you merge in place
notes: When the intervals arrive in sorted order — for example from a database query with `ORDER BY start` — the algorithm is a single O(n) pass. When intervals stream in unsorted, a balanced BST keyed by start lets you maintain the merge under insertions in O(log n) each.

## pitfalls
- Sorting by end instead of by start — produces wrong merges on inputs like `[(1, 10), (2, 3), (4, 5)]`.
- Off-by-one on the inclusivity of endpoints: decide once whether `[1, 2]` and `[2, 3]` merge, write it into the comparison, and document it.
- Mutating the input list while iterating — produces silent bugs in languages that do not snapshot iterators.
- Forgetting to flush the buffer at the end — the final interval never gets emitted.

## interviewTips
- The first thing out of your mouth should be "sort by start." Interviewers test whether you reach for the canonical move.
- Be explicit about the closed-vs-open endpoint convention. Most interview problems are closed; calendar problems sometimes are not.
- Mention follow-ups: insert into a sorted list, count meeting rooms, free-time intersection across users.

## code.python
```python
def merge_intervals(intervals):
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    out = [list(intervals[0])]
    for s, e in intervals[1:]:
        if s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out
```

## code.javascript
```javascript
function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const out = [intervals[0].slice()];
  for (let i = 1; i < intervals.length; i++) {
    const [s, e] = intervals[i];
    const last = out[out.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}
```

## code.java
```java
import java.util.*;

public int[][] mergeIntervals(int[][] intervals) {
    if (intervals.length == 0) return new int[0][];
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    List<int[]> out = new ArrayList<>();
    out.add(intervals[0].clone());
    for (int i = 1; i < intervals.length; i++) {
        int[] last = out.get(out.size() - 1);
        if (intervals[i][0] <= last[1]) {
            last[1] = Math.max(last[1], intervals[i][1]);
        } else {
            out.add(intervals[i].clone());
        }
    }
    return out.toArray(new int[0][]);
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>

std::vector<std::vector<int>> mergeIntervals(std::vector<std::vector<int>> intervals) {
    if (intervals.empty()) return {};
    std::sort(intervals.begin(), intervals.end(),
              [](const auto& a, const auto& b){ return a[0] < b[0]; });
    std::vector<std::vector<int>> out;
    out.push_back(intervals[0]);
    for (size_t i = 1; i < intervals.size(); ++i) {
        auto& last = out.back();
        if (intervals[i][0] <= last[1]) {
            last[1] = std::max(last[1], intervals[i][1]);
        } else {
            out.push_back(intervals[i]);
        }
    }
    return out;
}
```
