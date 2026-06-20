---
slug: interval-scheduling
module: greedy
title: Interval Scheduling
subtitle: Sort by earliest finish time to select the maximum number of non-overlapping intervals in O(n log n).
difficulty: Intermediate
position: 25
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Greedy Algorithms"
    url: "https://algs4.cs.princeton.edu/lectures/"
    type: book
  - title: "Activity Selection Problem — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/activity-selection-problem-greedy-algo-1/"
    type: blog
  - title: "TheAlgorithms/Python — activity_selection.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/greedy_methods/optimal_merge_pattern.py"
    type: repo
status: published
---

## intro
Given a list of intervals (start, end), pick the largest subset where no two overlap. Counter-intuitively, the optimal strategy is *not* "shortest first" or "earliest start first" — it's "earliest finish first." Sort by `end`, then sweep left to right keeping every interval whose start is at least the previous chosen finish. Provably optimal, O(n log n), and the canonical example used to teach greedy exchange-argument proofs.

## whyItMatters
- **OS process scheduling**: classical non-preemptive interval scheduling appears in real-time OS literature (Liu & Layland 1973), reflected in Linux's `SCHED_DEADLINE` policy and RTOS schedulers for embedded systems.
- **Cloud workload allocation**: Kubernetes batch-job scheduling, AWS Lambda warm-pool dispatch, and Borg/Mesos use interval-scheduling-style greedy assignment for non-conflicting jobs to slots.
- **Ad-slot allocation in real-time bidding**: Google AdX, Facebook Ads use interval-scheduling variants to select the maximum number of compatible ad placements within a time window.
- **Operations research staples**: meeting-room scheduling (Outlook FindTime), classroom assignment in university timetabling, courtroom docket optimisation, freight-loading scheduling.
- **The classical paper** (Gavril 1972, Kleinberg & Tardos chapter 4.1) formalises this as the activity-selection problem with the cleanest exchange-argument proof in greedy-algorithms literature.
- **Generalises directly to** weighted interval scheduling (DP), interval partitioning (minimum rooms via min-heap), interval graph colouring (chromatic number = max clique). Recognising the pattern lets you pick the right tool instantly instead of defaulting to DP.

## intuition
The algorithm exists because the optimisation landscape — choose the largest non-overlapping subset — has a non-obvious greedy structure. Brute-force enumeration is 2ⁿ; DP works but is overkill for the unweighted version. The escape route is the earliest-finish-time rule, which turns the entire problem into a single sort-then-sweep.

The counterintuitive part: "sort by length and pick shortest first" is wrong (counterexample with two short intervals straddling a long one); "sort by start and pick earliest start first" is also wrong (a long interval starting early blocks many later ones). The unique correct greedy rule is "sort by *finish* time ascending, pick the next interval whose start is after the current finish".

The exchange-argument proof is the elegant part. Let OPT be any optimal solution and GREEDY be the greedy choice. Sort both by finish time. Claim: the i-th interval in GREEDY finishes no later than the i-th interval in OPT. Proof by induction on i. Base i=1: GREEDY picks the earliest-finishing interval globally, so its finish ≤ any other interval's finish, including OPT's first. Inductive step: assume GREEDY's first i finish no later than OPT's first i. OPT's (i+1)-th must start ≥ OPT's i-th finish ≥ GREEDY's i-th finish, so it is a valid candidate for GREEDY's (i+1)-th choice; GREEDY picks the earliest-finishing such candidate, so its finish ≤ OPT's (i+1)-th finish. By induction, GREEDY produces at least |OPT| intervals — and since |OPT| is maximum, GREEDY is optimal.

The intuitive version: picking the earliest-finishing interval leaves the most room for future picks. Any other choice either ends at the same time (tie — pick either) or later, which can only shrink the remaining feasible window. The exchange argument formalises "leaving more room is never worse".

The deeper principle is that greedy correctness for selection problems often comes from such exchange arguments — show that the greedy choice can be swapped into any optimal solution without making it worse, then iterate.

## visualization
```
Intervals (start, end):
   A: [1, 4]    F: [5, 9]
   B: [3, 5]    G: [6, 10]
   C: [0, 6]    H: [8, 11]
   D: [5, 7]    I: [8, 12]
   E: [3, 9]    J: [2, 14]

Sorted by end:  A(1,4) B(3,5) C(0,6) D(5,7) F(5,9) E(3,9) G(6,10) H(8,11) I(8,12) J(2,14)
Sweep, last_end = -inf
   A: 1 >= -inf -> pick. last_end = 4
   B: 3 >= 4?  no
   C: 0 >= 4?  no
   D: 5 >= 4?  yes -> pick. last_end = 7
   F: 5 >= 7?  no
   E: 3 >= 7?  no
   G: 6 >= 7?  no
   H: 8 >= 7?  yes -> pick. last_end = 11
   I: 8 >= 11? no
   J: 2 >= 11? no
Answer: {A, D, H}, size 3.
```

## bruteForce
Enumerate all 2ⁿ subsets, check each for non-overlap, keep the largest valid one. O(2ⁿ · n). Or DP over sorted intervals: for each interval, "take or skip" with weight 1 — that runs in O(n log n) using binary search for the next compatible interval, matching greedy in time but with O(n) memory and trickier code. For the unweighted version the greedy is strictly simpler.

## optimal
**Technique: earliest-finish-time greedy (Gavril 1972 / classical activity selection).** O(n log n) — dominated by the sort; the sweep is O(n). Optimal for the unweighted problem, proven via exchange argument; no faster algorithm exists because sorting is the lower bound.

```python
def max_non_overlapping(intervals):
    if not intervals:
        return 0, []
    intervals = sorted(intervals, key=lambda x: x[1])    # sort by FINISH time
    chosen = []
    last_end = float('-inf')
    for s, e in intervals:
        if s >= last_end:                                # non-overlapping (or touching)
            chosen.append((s, e))
            last_end = e                                  # advance the cursor
    return len(chosen), chosen
```

Key lines: `sorted(intervals, key=lambda x: x[1])` is the entire algorithmic insight — sort by *end* (finish time), not start. This is the only ordering with a clean exchange-argument proof for the unweighted maximum-non-overlapping problem. `if s >= last_end` is the non-overlap check; use `>=` for closed intervals where touching endpoints don't overlap (`[1,4]` and `[4,7]` are picked together), use `>` for half-open intervals where they would. Document the convention. `last_end = e` advances the cursor; this is the entire state the greedy needs — no DP, no backtracking, no lookahead.

For the **interval partitioning** variant (minimum number of rooms to schedule all intervals without overlap), the algorithm changes: sort by *start*, maintain a min-heap of end times. For each interval, if the heap's min end ≤ current start, pop it (room becomes free); push the new interval's end. Heap size at any point = rooms needed; max heap size = minimum rooms required.

```python
def min_rooms(intervals):
    import heapq
    intervals = sorted(intervals, key=lambda x: x[0])
    heap = []
    for s, e in intervals:
        if heap and heap[0] <= s:
            heapq.heappop(heap)
        heapq.heappush(heap, e)
    return len(heap)
```

For **weighted interval scheduling** (each interval has a value; maximise total value of non-overlapping picks), the greedy is wrong. Counterexample: intervals `(0,10,value=100)`, `(0,5,value=1)`, `(5,10,value=1)` — greedy picks the two unit-value intervals; optimal is the single 100-value. Switch to DP: sort by end, `dp[i] = max(dp[i-1], value[i] + dp[p(i)])` where `p(i)` is the latest interval finishing before `i.start` (found via binary search). O(n log n).

**Why not sort by start?** Counterexample with three intervals: `(0,10)`, `(1,3)`, `(4,6)` — sort by start picks `(0,10)` first, blocking the other two; optimal is `(1,3) + (4,6)`. **Why not sort by length?** Counterexample: `(0,10)`, `(0,2)`, `(8,12)` — sort by length picks `(0,2)` and `(8,12)` (optimal) but also picks `(0,2)` and then can't extend; reverse the lengths and the heuristic fails. **Why not max-flow?** Bipartite matching reduces to max-flow at the cost of O(V·E) — vastly slower than O(n log n) greedy for unweighted intervals.

## complexity
time: O(n log n) — dominated by the sort; the sweep is O(n)
space: O(1) extra beyond the sort buffer; O(n) if you return the chosen list
notes: If intervals arrive pre-sorted by end (e.g., streaming with timestamps), the sweep alone is O(n).

## pitfalls
- Sorting by start time or by length — both produce counterexamples in three intervals. Earliest-finish is the only ordering with a clean exchange-argument proof for the unweighted problem.
- Off-by-one on closed vs. half-open intervals: `[1,4]` and `[4,7]` touch but don't overlap if intervals are closed-open `[s, e)`; they overlap if both endpoints are inclusive. Confirm the convention.
- Using greedy for weighted interval scheduling — wrong. Counterexample: `(0,10)=100`, `(0,5)=1`, `(5,10)=1` ⇒ greedy by end picks the two 1-value intervals (total 2); optimal is the single 100-value.
- Conflating with "minimum number of rooms" (interval partitioning) — that uses a min-heap of end times, not a greedy single sweep.

## interviewTips
- Quote the rule and the proof in one sentence: "Sort by end; greedy because the earliest-finisher leaves the most room — provable by exchange argument."
- Be ready to mutate the problem live: "What if each interval has a weight?" ⇒ DP. "What's the minimum number of rooms?" ⇒ sweep-line or min-heap of end times. "What if intervals are circular?" ⇒ try each starting interval.
- Mention real systems: courtroom scheduling, CPU non-preemptive job scheduling, classroom assignment — same algorithm, different jargon.
- Volunteer the complexity decomposition: "O(n log n) sort + O(n) sweep."

## code.python
```python
def max_non_overlapping(intervals):
    if not intervals:
        return 0, []
    intervals = sorted(intervals, key=lambda x: x[1])
    chosen = []
    last_end = float('-inf')
    for s, e in intervals:
        if s >= last_end:
            chosen.append((s, e))
            last_end = e
    return len(chosen), chosen

def min_rooms(intervals):
    import heapq
    if not intervals:
        return 0
    intervals = sorted(intervals, key=lambda x: x[0])
    heap = []
    for s, e in intervals:
        if heap and heap[0] <= s:
            heapq.heappop(heap)
        heapq.heappush(heap, e)
    return len(heap)
```

## code.javascript
```javascript
function maxNonOverlapping(intervals) {
  if (!intervals.length) return { count: 0, chosen: [] };
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
  const chosen = [];
  let lastEnd = -Infinity;
  for (const [s, e] of sorted) {
    if (s >= lastEnd) {
      chosen.push([s, e]);
      lastEnd = e;
    }
  }
  return { count: chosen.length, chosen };
}

function minRooms(intervals) {
  if (!intervals.length) return 0;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const heap = [];
  const push = (x) => { heap.push(x); heap.sort((a, b) => a - b); };
  for (const [s, e] of sorted) {
    if (heap.length && heap[0] <= s) heap.shift();
    push(e);
  }
  return heap.length;
}
```

## code.java
```java
import java.util.*;

public int maxNonOverlapping(int[][] intervals) {
    if (intervals.length == 0) return 0;
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
    int count = 0;
    int lastEnd = Integer.MIN_VALUE;
    for (int[] it : intervals) {
        if (it[0] >= lastEnd) {
            count++;
            lastEnd = it[1];
        }
    }
    return count;
}

public int minRooms(int[][] intervals) {
    if (intervals.length == 0) return 0;
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int[] it : intervals) {
        if (!heap.isEmpty() && heap.peek() <= it[0]) heap.poll();
        heap.offer(it[1]);
    }
    return heap.size();
}
```

## code.cpp
```cpp
#include <bits/stdc++.h>
using namespace std;

int maxNonOverlapping(vector<pair<int,int>> intervals) {
    if (intervals.empty()) return 0;
    sort(intervals.begin(), intervals.end(),
         [](auto& a, auto& b) { return a.second < b.second; });
    int count = 0;
    int lastEnd = INT_MIN;
    for (auto& [s, e] : intervals) {
        if (s >= lastEnd) { count++; lastEnd = e; }
    }
    return count;
}

int minRooms(vector<pair<int,int>> intervals) {
    if (intervals.empty()) return 0;
    sort(intervals.begin(), intervals.end());
    priority_queue<int, vector<int>, greater<>> heap;
    for (auto& [s, e] : intervals) {
        if (!heap.empty() && heap.top() <= s) heap.pop();
        heap.push(e);
    }
    return (int)heap.size();
}
```
