---
slug: convex-hull
module: math-geom-sampling
title: Convex Hull (Graham scan)
subtitle: Find the smallest convex polygon enclosing a set of 2D points in O(n log n).
difficulty: Advanced
position: 13
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "de Berg, Cheong, van Kreveld, Overmars — Computational Geometry (book site, Utrecht)"
    url: "https://www.cs.uu.nl/geobook/"
    type: book
  - title: "cp-algorithms — Convex Hull (Graham scan, monotone chain)"
    url: "https://cp-algorithms.com/geometry/convex-hull.html"
    type: blog
  - title: "TheAlgorithms/Python — convex_hull"
    url: "https://github.com/TheAlgorithms/Python/blob/master/divide_and_conquer/convex_hull.py"
    type: repo
status: published
---

## intro
The convex hull of a set of 2D points is the smallest convex polygon containing all of them — imagine wrapping a rubber band around a scattering of pins. The Graham scan computes it in O(n log n) by sorting and a single linear stack-based walk. The Andrew monotone-chain variant is what most competitive coders memorize because it's even simpler to write.

## whyItMatters
Geometry shows up in CAD (SolidWorks, Fusion 360 collision queries), GIS (PostGIS's `ST_ConvexHull`), computer graphics (frustum culling, shadow volumes), robotics path planning (configuration-space obstacles), machine learning (one-class SVM boundaries, dataset envelopes), and surprisingly often in competitive programming as a subroutine for rotating-calipers diameter, minimum bounding rectangles, and Andrew's monotone-chain warm-ups. Once you have the hull you can answer point-in-polygon in `O(log n)`, compute the diameter of a point set in `O(n)` after the hull, and outline a region from noisy samples. The same primitive underlies Quickhull (the QHull library shipping inside SciPy, MATLAB, and R) and is the prerequisite step for Delaunay triangulation and Voronoi diagrams via the lifting map.

## intuition
A convex hull is the smallest convex polygon enclosing a set of points — imagine stretching a rubber band around all of them and letting it snap tight. The points it touches are the hull vertices; the rest are interior or on the edges. Two observations make computing it fast.

First, the lowest-leftmost point is always on the hull (it cannot be inside any convex polygon that contains it). Use it as a pivot. Sort the remaining points by polar angle around the pivot — points seen first are at the right, points seen last sweep around to the left. Now walk the sorted list maintaining a stack of "hull-so-far" candidates. Each new point should turn *counter-clockwise* relative to the previous two; if it turns clockwise or is collinear, the previous candidate cannot be on the hull (a later point bypasses it) and you pop it. After one pass the stack is the upper-or-lower portion of the hull in order.

Andrew's monotone-chain variant skips the polar sort by sorting on `(x, y)` and building the upper and lower hulls in two passes — easier to memorize and numerically more stable because it avoids `atan2`. The cross-product test `cross(a, b, c) = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)` returns positive for a counter-clockwise turn, negative for clockwise, zero for collinear; it is the entire geometric heart of the algorithm.

## visualization
```
Points:                       After sort by angle:        Stack walk:

  *           *                   *  *                    push 0,1
        *                        *                        push 2
   *                                                      push 3 -- right turn? pop 2
      *  *                                                push 4
                                                          ...
Lowest pivot at bottom-left.                              final stack = hull
```

## bruteForce
For every triple of points, check if every other point lies on the same side of the line they form. O(n^4). Works for n ≤ 30; explodes anywhere meaningful.

## optimal
Andrew's monotone chain is the cleanest implementation to memorize: sort once by `(x, y)`, sweep left-to-right building the lower hull, sweep right-to-left building the upper hull, concatenate.

```python
def convex_hull(points):
    pts = sorted(set(map(tuple, points)))
    if len(pts) <= 2: return pts
    def cross(o, a, b):
        return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]
```

The critical line is `cross(lower[-2], lower[-1], p) <= 0` — using `<=` removes collinear points from the hull, using `<` keeps them (you almost always want `<=`). The total cost is `O(n log n)` dominated by the sort; the sweeps are amortized `O(n)` because every point is pushed and popped at most once across both passes. For arbitrarily large inputs Chan's algorithm (1996) reaches `O(n log h)` where `h` is the output hull size — useful when the hull is a tiny fraction of the input (e.g. millions of points clustered in a small region). For 3D hulls or for the streaming case, switch to Quickhull (the QHull library used by SciPy's `scipy.spatial.ConvexHull`) which generalizes the same divide-and-conquer flavor.

## complexity
- **Time**: O(n log n) — dominated by the sort. The two passes are O(n) amortized (each point is pushed/popped at most once).
- **Space**: O(n).
- **Worst case**: all points on the hull (e.g., points already on a circle). Still O(n log n).

## pitfalls
- **Integer overflow in cross product**: at coordinates ±10^9 the product is ±10^18, fits in int64. Use int64 / `long long`.
- **Strict vs non-strict turn**: `<= 0` removes collinear points; `< 0` keeps them. Choose per problem statement.
- **Duplicate points**: dedupe before sorting or they break the strict-turn invariant.
- **Single point or two-point input**: handle separately or the upper/lower indices go negative.
- **Floating-point coordinates**: avoid where possible. If forced, use a tolerance in the cross-product comparison.

## interviewTips
- The trigger: "given 2D points, find the outline / enclosing polygon" — convex hull.
- Walk through the cross-product sign before writing code — it's the heart of the algorithm.
- Mention **Andrew's monotone chain** by name; it's cleaner than the original Graham scan.
- For senior interviews, mention **rotating calipers** (find hull diameter in O(n)) and **Quickhull** (divide-and-conquer alternative).

## code.python
```python
def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def convex_hull(points):
    pts = sorted(set(map(tuple, points)))
    if len(pts) <= 1: return pts
    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0: lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0: upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]

print(convex_hull([(0,0),(1,1),(2,2),(2,0),(0,2),(1,0)]))
```

## code.javascript
```javascript
function cross(o, a, b) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}
function convexHull(points) {
  const pts = [...new Set(points.map(p => p.join(',')))].map(s => s.split(',').map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length <= 1) return pts;
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
```

## code.java
```java
import java.util.*;
class ConvexHull {
    static long cross(int[] o, int[] a, int[] b) {
        return (long)(a[0] - o[0]) * (b[1] - o[1]) - (long)(a[1] - o[1]) * (b[0] - o[0]);
    }
    static int[][] hull(int[][] points) {
        Arrays.sort(points, (a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
        int n = points.length, k = 0;
        if (n <= 1) return points;
        int[][] h = new int[2 * n][];
        for (int i = 0; i < n; i++) {
            while (k >= 2 && cross(h[k - 2], h[k - 1], points[i]) <= 0) k--;
            h[k++] = points[i];
        }
        for (int i = n - 2, t = k + 1; i >= 0; i--) {
            while (k >= t && cross(h[k - 2], h[k - 1], points[i]) <= 0) k--;
            h[k++] = points[i];
        }
        return Arrays.copyOfRange(h, 0, k - 1);
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
std::vector<P> convexHull(std::vector<P> pts) {
    std::sort(pts.begin(), pts.end());
    int n = pts.size(), k = 0;
    if (n <= 1) return pts;
    std::vector<P> h(2 * n);
    for (int i = 0; i < n; i++) {
        while (k >= 2 && cross(h[k - 2], h[k - 1], pts[i]) <= 0) k--;
        h[k++] = pts[i];
    }
    for (int i = n - 2, t = k + 1; i >= 0; i--) {
        while (k >= t && cross(h[k - 2], h[k - 1], pts[i]) <= 0) k--;
        h[k++] = pts[i];
    }
    h.resize(k - 1);
    return h;
}
```
