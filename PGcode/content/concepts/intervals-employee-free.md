---
slug: intervals-employee-free
module: arrays-searching
title: Employee Free Time
subtitle: Find common free intervals across k employee schedules using sweepline or a k-way merge heap.
difficulty: Advanced
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Priority Queues"
    url: "https://algs4.cs.princeton.edu/24pq/"
    type: book
  - title: "Merging Intervals — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/merging-intervals/"
    type: blog
  - title: "TheAlgorithms/Python — merge_intervals.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/arrays/merge_intervals.py"
    type: repo
status: published
---

## intro
Each of k employees has a sorted, non-overlapping list of busy intervals. You want the maximal intervals during which every employee is free. The classic approach merges all busy intervals into one timeline, collapses overlaps, then takes the gaps. Two implementations win: sort-and-sweep (simple, O(N log N)) and k-way heap merge (preserves per-employee structure, O(N log k)).

## whyItMatters
Interval merging is the unifying primitive for calendar, scheduling, range-analytics, and timeline-visualization problems. The "merge then complement" pattern returns again in meeting rooms, car-pooling, range-XOR, and even some sweepline geometry tasks. Knowing both the flat sort-and-sweep and the heap-based k-way merge prepares you for the variant where streams arrive incrementally and a full sort is impossible.

## intuition
Free time for everyone is the complement of "anyone busy." Take the union of all busy intervals (across all employees); the gaps between consecutive merged intervals are the free periods. The hard parts are (a) merging in the right order and (b) skipping leading and trailing gaps that lie outside the global span.

## visualization
Schedules: A=[[1,3],[6,7]], B=[[2,4]], C=[[2,5],[9,12]]. Flatten and sort by start: [[1,3],[2,4],[2,5],[6,7],[9,12]]. Sweep: current = [1,5], next [6,7] gap [5,6], current = [6,7], next [9,12] gap [7,9], current = [9,12]. Free intervals: [[5,6],[7,9]]. Anything before 1 and after 12 is not counted — it lies outside the union.

## bruteForce
Discretize time to the minute (or whatever granularity), mark every busy minute as 1 for each employee in a giant boolean grid, then scan for runs of all-zero columns. This works for toy inputs but blows up on real calendars where intervals span months at minute resolution. The right answer ignores irrelevant resolution and operates only on endpoints.

## optimal
Sort-and-sweep: flatten all intervals into a single list, sort by start, walk left to right maintaining `[curStart, curEnd]`. When the next interval's start exceeds `curEnd`, record `[curEnd, nextStart]` as a free interval and advance. K-way heap merge: push the first interval of each employee into a min-heap keyed by start; on each pop, advance the pointer for that employee and push the next; merge into the running `[curStart, curEnd]` exactly as above. Both produce the same answer; heap is preferable when k << N.

## complexity
time: O(N log N) sort-and-sweep, O(N log k) heap merge — N is total intervals, k is employee count
space: O(N) output and merged-list buffer; heap variant uses O(k) extra
notes: When all schedules are already individually sorted, the heap variant exploits that structure to skip the global sort. For dynamic streams (employees push intervals online), only the heap variant generalizes; the sort-and-sweep needs a re-sort on each update.

## pitfalls
- Returning the gaps before the first busy interval or after the last — those are unbounded free time, not "free intervals" in the canonical problem.
- Forgetting that intervals from the same employee are already sorted and non-overlapping — re-sorting them is harmless but missing it leaves an O(N log k) optimization on the table.
- Treating touching intervals [1,3] and [3,5] as a free [3,3] — adjacent endpoints share a time point but the gap has zero width and should be skipped.
- Using floats for time when the input is integer — comparison precision bugs.

## interviewTips
- Open with "flatten, sort, sweep" — it is short to code and easy to defend; then mention the heap variant for the follow-up.
- Always clarify whether endpoints are inclusive or exclusive — different platforms differ and one off-by-one ruins the result.
- For huge k (thousands of employees) with many small intervals, the heap variant is a real win; quote O(N log k) explicitly.

## code.python
```python
import heapq

def employee_free_time(schedule):
    flat = [iv for emp in schedule for iv in emp]
    flat.sort(key=lambda iv: iv[0])
    res = []
    cur_start, cur_end = flat[0]
    for s, e in flat[1:]:
        if s > cur_end:
            res.append([cur_end, s])
            cur_start, cur_end = s, e
        else:
            cur_end = max(cur_end, e)
    return res

def employee_free_time_heap(schedule):
    heap = []
    for i, emp in enumerate(schedule):
        if emp:
            heapq.heappush(heap, (emp[0][0], emp[0][1], i, 0))
    res = []
    _, cur_end, ei, idx = heapq.heappop(heap)
    if idx + 1 < len(schedule[ei]):
        nxt = schedule[ei][idx + 1]
        heapq.heappush(heap, (nxt[0], nxt[1], ei, idx + 1))
    while heap:
        s, e, ei, idx = heapq.heappop(heap)
        if s > cur_end:
            res.append([cur_end, s])
            cur_end = e
        else:
            cur_end = max(cur_end, e)
        if idx + 1 < len(schedule[ei]):
            nxt = schedule[ei][idx + 1]
            heapq.heappush(heap, (nxt[0], nxt[1], ei, idx + 1))
    return res
```

## code.javascript
```javascript
function employeeFreeTime(schedule) {
  const flat = schedule.flat().sort((a, b) => a[0] - b[0]);
  const res = [];
  let [curStart, curEnd] = flat[0];
  for (let i = 1; i < flat.length; i++) {
    const [s, e] = flat[i];
    if (s > curEnd) {
      res.push([curEnd, s]);
      curStart = s; curEnd = e;
    } else {
      curEnd = Math.max(curEnd, e);
    }
  }
  return res;
}
```

## code.java
```java
public List<int[]> employeeFreeTime(List<List<int[]>> schedule) {
    List<int[]> flat = new ArrayList<>();
    for (List<int[]> emp : schedule) flat.addAll(emp);
    flat.sort((a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> res = new ArrayList<>();
    int curEnd = flat.get(0)[1];
    for (int i = 1; i < flat.size(); i++) {
        int s = flat.get(i)[0], e = flat.get(i)[1];
        if (s > curEnd) {
            res.add(new int[]{curEnd, s});
            curEnd = e;
        } else {
            curEnd = Math.max(curEnd, e);
        }
    }
    return res;
}
```

## code.cpp
```cpp
class Solution {
public:
    vector<vector<int>> employeeFreeTime(vector<vector<vector<int>>>& schedule) {
        vector<vector<int>> flat;
        for (auto& emp : schedule)
            for (auto& iv : emp) flat.push_back(iv);
        sort(flat.begin(), flat.end(), [](const vector<int>& a, const vector<int>& b) {
            return a[0] < b[0];
        });
        vector<vector<int>> res;
        int curEnd = flat[0][1];
        for (int i = 1; i < (int)flat.size(); i++) {
            int s = flat[i][0], e = flat[i][1];
            if (s > curEnd) {
                res.push_back({curEnd, s});
                curEnd = e;
            } else {
                curEnd = max(curEnd, e);
            }
        }
        return res;
    }
};
```
