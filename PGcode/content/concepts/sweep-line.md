---
slug: sweep-line
module: arrays-binary-search
title: Sweep Line
subtitle: Sort events by coordinate, "sweep" a vertical line across them, maintain an active set — many geometry / interval problems in O(n log n).
difficulty: Intermediate
position: 22
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "de Berg et al. — Computational Geometry (book site, Utrecht)"
    url: "https://www.cs.uu.nl/geobook/"
    type: book
  - title: "cp-algorithms — Sweep Line (segment intersections)"
    url: "https://cp-algorithms.com/geometry/intersecting_segments.html"
    type: blog
  - title: "indy256/codelibrary — geometry / sweep templates"
    url: "https://github.com/indy256/codelibrary"
    type: repo
status: published
---

## intro
Sweep line (also "plane sweep") is a meta-algorithm: turn a 2D geometry / interval problem into a sequence of 1D events sorted by x-coordinate, then "sweep" through them while maintaining a small active data structure (set, multiset, segment tree). It turns brute O(n²) into O(n log n) for a whole family of problems.

## whyItMatters
Once you see the pattern, problems that look like nested loops collapse into linear sweeps:
- **Interval merging** / "find overlapping intervals."
- **Maximum number of overlapping intervals at any time** (a.k.a. meeting rooms II).
- **Skyline problem** (visible city skyline from rectangles).
- **Closest pair of points** in O(n log n).
- **Segment intersection counting** (Bentley-Ottmann).
- **Rectangle area union**.

If a problem involves intervals on a line or shapes in a plane and asks for an aggregate, sweep line is usually the cleanest path.

## intuition
For each input element, generate two **events**: an "open" event when the sweep line enters it and a "close" event when it exits. Sort all events by x (with a tiebreak rule). Process events in order, maintaining a small data structure of "currently active" elements. The answer is computed incrementally as events fire.

## visualization
```
Intervals: [1, 4], [2, 6], [5, 8]

Events sorted by x:
  x=1: OPEN  [1, 4]      active = {[1, 4]}                 count=1
  x=2: OPEN  [2, 6]      active = {[1, 4], [2, 6]}         count=2   ← max so far
  x=4: CLOSE [1, 4]      active = {[2, 6]}                 count=1
  x=5: OPEN  [5, 8]      active = {[2, 6], [5, 8]}         count=2
  x=6: CLOSE [2, 6]      active = {[5, 8]}                 count=1
  x=8: CLOSE [5, 8]      active = {}                       count=0

Max overlap = 2.
```

## bruteForce
For each pair `(i, j)`, check if intervals overlap. O(n²). Fine for n ≤ 2000; dies at n = 10^5.

## optimal
**Recipe**:
1. Emit events: `(x, type)` where type is OPEN or CLOSE.
2. Sort events. Tiebreak: usually OPEN before CLOSE if the boundary counts as overlapping, otherwise CLOSE before OPEN.
3. Sweep, updating the active set and aggregating.

**Maximum overlap** (meeting rooms II):
```
events = []
for (start, end) in intervals:
    events.append((start, +1))
    events.append((end, -1))
events.sort()                        # ties broken by +/- — close before open if needed
active, best = 0, 0
for x, delta in events:
    active += delta
    best = max(best, active)
return best
```

**Skyline**: store active heights in a max-heap (lazy delete); each event emits a "current max height changed" output when the top changes.

**Interval merge**: at each open, if active count was 0, start a new merged interval. At each close, if active drops to 0, close the merged interval.

**Closest pair (2D)**: sort points by x; sweep with a balanced BST keyed by y, only keeping points whose x is within the current best distance. O(n log n).

## complexity
- **Time**: O(n log n) — sort dominates.
- **Space**: O(n) for events, O(k) for active set where k is max simultaneous.
- **Constant factor**: smaller than segment trees for the same problems.

## pitfalls
- **Tiebreak rule**: closing at x = 5 vs opening at x = 5 — which fires first changes the answer for "overlap at the boundary." Be explicit.
- **Forgetting to handle CLOSE removing the right element**: use a multiset or tag-and-lazy-delete from a heap.
- **Geometry with vertical lines**: vertical edges in the skyline have zero width; handle as a special event type.
- **Floating-point coordinates**: sort stability matters when two events have equal x within epsilon. Prefer integers + scaling when possible.
- **N events, M unique x's**: events count is O(n), but the data structure operations can be O(log n) each, giving total O(n log n). Don't confuse "n intervals" with "n events" — there are 2n events.

## interviewTips
- For "intervals" or "geometric overlap" questions, lead with sweep line.
- Walk through the event list before writing code — making the events explicit clarifies the tiebreak.
- For senior interviews, mention **Bentley-Ottmann** for segment-pair intersection in O((n + k) log n).
- Compare with **interval tree / segment tree** approaches (more general, more code; sweep line wins on this pattern's elegance).

## code.python
```python
def max_overlap(intervals):
    events = []
    for s, e in intervals:
        events.append((s, +1))
        events.append((e, -1))
    events.sort(key=lambda x: (x[0], x[1]))  # close before open at the boundary
    active = best = 0
    for _, d in events:
        active += d
        best = max(best, active)
    return best

print(max_overlap([(1, 4), (2, 6), (5, 8)]))    # 2
```

## code.javascript
```javascript
function maxOverlap(intervals) {
  const events = [];
  for (const [s, e] of intervals) { events.push([s, +1]); events.push([e, -1]); }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let active = 0, best = 0;
  for (const [, d] of events) { active += d; if (active > best) best = active; }
  return best;
}
```

## code.java
```java
import java.util.*;
class SweepLine {
    public int maxOverlap(int[][] intervals) {
        int[][] events = new int[intervals.length * 2][2];
        int k = 0;
        for (int[] iv : intervals) {
            events[k++] = new int[]{ iv[0], +1 };
            events[k++] = new int[]{ iv[1], -1 };
        }
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
        int active = 0, best = 0;
        for (int[] e : events) {
            active += e[1];
            if (active > best) best = active;
        }
        return best;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
int maxOverlap(std::vector<std::pair<int,int>>& intervals) {
    std::vector<std::pair<int,int>> events;
    for (auto [s, e] : intervals) { events.push_back({s, +1}); events.push_back({e, -1}); }
    std::sort(events.begin(), events.end());
    int active = 0, best = 0;
    for (auto [_, d] : events) { active += d; best = std::max(best, active); }
    return best;
}
```
