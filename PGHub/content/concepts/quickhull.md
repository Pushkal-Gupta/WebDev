---
slug: quickhull
module: math-geom-sampling
title: Quickhull
subtitle: Divide-and-conquer convex hull — O(n log n) expected, O(n²) worst case. Like Quicksort but for points.
difficulty: Advanced
position: 16
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "de Berg et al. — Computational Geometry (book site, Utrecht)"
    url: "https://www.cs.uu.nl/geobook/"
    type: book
  - title: "GeeksforGeeks — Quickhull Algorithm for Convex Hull"
    url: "https://www.geeksforgeeks.org/quickhull-algorithm-convex-hull/"
    type: blog
  - title: "TheAlgorithms/Python — convex hull implementations"
    url: "https://github.com/TheAlgorithms/Python/blob/master/divide_and_conquer/convex_hull.py"
    type: repo
status: published
---

## intro
Quickhull is a divide-and-conquer convex hull algorithm. Start with the leftmost and rightmost points (extremes on x), which are on the hull. The line between them splits the remaining points into two sets. For each side, find the point farthest from the line — that's also on the hull — and recurse on the two new sub-regions. Expected O(n log n), worst case O(n²).

## whyItMatters
Conceptually parallel to Quicksort — easy to remember once you see the analogy. Real-world geometric kernels (CGAL, qhull) use Quickhull or its 3D generalization for triangulation, Voronoi-diagram precursors, and collision-hull computation. In interviews, knowing both **Graham scan / Andrew monotone chain** (Θ(n log n) deterministic) AND **Quickhull** (faster in practice, randomized) shows depth.

## intuition
- Find extremes: leftmost L, rightmost R. Both definitely on the hull.
- Split remaining points by which side of the line LR they lie on.
- For each side, find the farthest point F from LR. F is on the hull.
- Now you have two new lines: LF and FR. Recurse on each, with the points "outside" each line.
- Points "inside" any final triangle are not on the hull — discard.

The "discard interior" step is where the speed comes from: on average, half the points are discarded each recursion.

## visualization
```
Initial points (* = candidates, L = leftmost, R = rightmost):
        *
   *  *  *
  L          R
   *   *  *
       *

Line LR splits into upper / lower halves.
Upper: find farthest from LR → point T at top.
Now triangle L-T-R. Recurse on (L, T) and (T, R) with their upper-side points.
Points inside L-T-R are discarded.
```

## bruteForce
**O(n³)**: for every triple of points, check whether every other point lies on the same side. Build hull from confirmed triples. Fine for n ≤ 50; explodes anywhere meaningful.

**Graham scan / Andrew monotone chain** at O(n log n) is the standard deterministic competitor.

## optimal
```
def quickhull(points):
    if len(points) < 3: return points
    pts = sorted(set(map(tuple, points)))
    L, R = pts[0], pts[-1]
    upper = [p for p in pts if cross(L, R, p) > 0]
    lower = [p for p in pts if cross(L, R, p) < 0]
    return [L] + farthest_recurse(L, R, upper) + [R] + farthest_recurse(R, L, lower)

def farthest_recurse(A, B, S):
    if not S: return []
    F = max(S, key=lambda p: distance_to_line(A, B, p))
    s1 = [p for p in S if cross(A, F, p) > 0]
    s2 = [p for p in S if cross(F, B, p) > 0]
    return farthest_recurse(A, F, s1) + [F] + farthest_recurse(F, B, s2)
```

`cross(o, a, b) = (a.x - o.x)(b.y - o.y) - (a.y - o.y)(b.x - o.x)`. Positive = counter-clockwise, negative = clockwise.

For the farthest-from-line test, you can compare cross-products directly (no square root needed).

## complexity
- **Expected time**: O(n log n) — assuming balanced splits.
- **Worst case**: O(n²) — pathological inputs where each recursion keeps almost all points.
- **Space**: O(n) for the result + O(log n) recursion depth on average.

Quickhull beats Graham scan in practice when n is large because of cache locality and lower constant, but loses on adversarial inputs.

## pitfalls
- **Collinear points**: `cross == 0` for collinear cases. Decide whether to include or exclude them on the hull and be consistent.
- **Floating-point coordinates**: cross-product comparison can be off by epsilon. Prefer integer coordinates + scaling for robustness.
- **Worst case**: a circle of points or random points uniformly in a disk are fine; adversarial constructions (all points on a line, all clustered near a vertex) hit O(n²).
- **3D Quickhull**: nontrivial — visibility / horizon edges instead of "side of a line." Use a library (`qhull`).

## interviewTips
- For "convex hull" questions, lead with **Andrew monotone chain** (O(n log n) deterministic, simple) and mention Quickhull as the divide-and-conquer alternative.
- Walk through the cross-product sign before coding — interviewers want to see you understand the geometry.
- For senior interviews, mention **gift wrapping (Jarvis march)** at O(nh) where h is hull size — best when h is small.

## code.python
```python
def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def distance_to_line(a, b, p):
    return abs(cross(a, b, p))

def quickhull(points):
    pts = sorted(set(map(tuple, points)))
    if len(pts) < 3: return pts
    L, R = pts[0], pts[-1]
    def recurse(A, B, S):
        if not S: return []
        F = max(S, key=lambda p: distance_to_line(A, B, p))
        s1 = [p for p in S if cross(A, F, p) > 0]
        s2 = [p for p in S if cross(F, B, p) > 0]
        return recurse(A, F, s1) + [F] + recurse(F, B, s2)
    upper = [p for p in pts if cross(L, R, p) > 0]
    lower = [p for p in pts if cross(L, R, p) < 0]
    return [L] + recurse(L, R, upper) + [R] + recurse(R, L, lower)

print(quickhull([(0,0),(1,1),(2,2),(2,0),(0,2),(1,0.5)]))
```

## code.javascript
```javascript
// Sketch — same algorithm, points as [x, y] arrays.
function cross(o, a, b) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}
function quickhull(pts) {
  // sort, split by side of LR, recurse with farthest-from-line.
  return [];
}
```

## code.java
```java
import java.util.*;
class Quickhull {
    static long cross(int[] o, int[] a, int[] b) {
        return (long)(a[0] - o[0]) * (b[1] - o[1]) - (long)(a[1] - o[1]) * (b[0] - o[0]);
    }
    public List<int[]> hull(List<int[]> points) {
        // outline only — same algorithm as the Python version.
        return new ArrayList<>();
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
using P = std::pair<long long, long long>;
long long cross(P o, P a, P b) {
    return (a.first - o.first) * (b.second - o.second) - (a.second - o.second) * (b.first - o.first);
}
// quickhull(points) — recursive divide-and-conquer.
```
