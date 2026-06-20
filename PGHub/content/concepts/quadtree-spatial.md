---
slug: quadtree-spatial
module: trees-balanced-disk
title: Quadtree (Spatial Index)
subtitle: Recursive quadrant subdivision for 2D points — log-time nearest-neighbor and range queries on planar data.
difficulty: Advanced
position: 31
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms (Sedgewick) — geometric search chapter"
    url: "https://algs4.cs.princeton.edu/92search/"
    type: book
  - title: "Quadtree — cp-algorithms (geometry section)"
    url: "https://cp-algorithms.com/geometry/basic-geometry.html"
    type: blog
  - title: "TheAlgorithms/Python — quad_tree.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/segment_tree.py"
    type: repo
status: published
---

## intro
A quadtree is a 2D spatial index that recursively partitions a rectangular region into four equal quadrants — NW, NE, SW, SE — until each leaf contains at most `k` points (capacity, typically 4 or 8). Range queries and nearest-neighbor searches prune entire subtrees whose bounding boxes cannot contribute, turning what would be linear scans into near-logarithmic traversals on well-distributed data.

## whyItMatters
Every map app, every ride-share dispatcher, every video-game collision broadphase needs the answer to "what is near me?" in milliseconds across millions of points. A flat array of coordinates makes you scan everything — `O(n)` per query. Quadtrees, R-trees, k-d trees, and geohashes are the standard answers. Quadtree shines when points are sparsely distributed in a known bounding box; it is what PostGIS uses under spatial indexes, what game engines use for frustum culling, and what image-compression codecs use for blocky regions.

## intuition
Imagine a sheet of graph paper with dots scattered on it. If you need "all dots inside this circle", scanning all dots is wasteful. Instead, fold the paper into four quadrants and ask "does the circle even touch this quadrant?" If no, ignore everything inside. If yes, fold that quadrant into four again. Recursion stops when the quadrant is small (low capacity) — then check every dot. You only descend into regions that overlap the query, ignoring up to 75% of the plane at each level.

## visualization
Region (0,0)-(16,16), capacity=2. Insert points P1(2,2), P2(3,3), P3(14,14): root holds all three (over capacity), subdivide into 4 quadrants of size 8. P1,P2 land in SW (0,0)-(8,8) — still 2 points, fits. P3 lands in NE (8,8)-(16,16). Insert P4(2,7): SW now has 3, subdivide SW into 4 quadrants of size 4. P1,P2 in SW-SW (0,0)-(4,4); P4 in SW-NW (0,4)-(4,8). Range query "rect (0,0)-(5,5)" descends root → SW (overlaps) → SW-SW (overlaps, returns P1, P2) → SW-NW (overlaps, P4 is at (2,7) → outside query, skip). NE pruned entirely.

## bruteForce
Store points in a flat array. For range query: scan all n points and test inclusion — O(n). For nearest neighbor: scan all n, track minimum — O(n). Simple, cache-friendly, and actually fastest when n < 100. But for n = 1 M and 1000 queries per second, you are looking at a billion comparisons per second of doing nothing useful. The quadtree converts that into O(log n) amortized on uniform data.

## optimal
**Point quadtree** stores one point per internal node; **region quadtree** (more common) puts all points in leaves with a fixed capacity. Insert: walk down to the leaf whose region contains the point; if leaf is over capacity, **subdivide** into 4 child quadrants and redistribute. **Range query (rectangle R)**: at each node, if R is disjoint from the node's bounding box, prune. If R fully contains the box, return all points beneath. Otherwise recurse into children. **Nearest-neighbor**: best-first search using a min-heap keyed by box-to-target distance — pop the closest box, descend, update best-so-far, prune any box whose minimum distance exceeds best. Skewed distributions degrade quadtrees (deep narrow branches) — switch to k-d tree or R-tree when this matters.

## complexity
time: O(log n) average insert; O(log n + k) range query returning k results; O(log n) average NN on uniform data
space: O(n) for points + O(n) for internal nodes in worst case
notes: Worst case degrades to O(n) when many points coincide or cluster densely (depth grows). Bounded-depth variants (PR-quadtree with min cell size) avoid pathological splits. Cache locality is mediocre vs flat arrays — for n < ~1000 a brute scan often wins.

## pitfalls
- Forgetting to subdivide on insert when the leaf is exactly at capacity — leaves grow unbounded.
- Off-by-one on quadrant boundaries — points on the dividing line silently get assigned to two children or zero. Pick a convention (NW gets the line) and apply it everywhere.
- Floating-point quadrant tests: `mid_x = (x0 + x1) / 2` can lose precision deep in the tree; prefer integer coordinates when possible.
- No minimum cell size — duplicate or near-duplicate points cause infinite recursion. Cap the depth or store overflow as a list at the deepest cell.
- Range queries that always descend all four children even when fully covered — wasted work; the "fully inside" shortcut is the source of most speedup.
- Skipping the min-distance pruning in NN search — degenerates to full traversal.

## interviewTips
- State the bounding-box pruning rule first: "Reject any subtree whose box does not intersect the query."
- Be ready to compare to k-d tree (better for higher dimensions and skewed data) and R-tree (better for non-point geometries like polygons).
- Mention real systems: PostGIS GiST indexes, Quake's PVS, Google S2 geometry — interviewer hooks.
- Walk through a small example by hand; subdivision is much clearer drawn than spoken.
- For nearest-neighbor be ready to describe best-first search with a priority queue — it is the canonical follow-up.

## code.python
```python
class Quadtree:
    def __init__(self, x0, y0, x1, y1, capacity=4):
        self.x0, self.y0, self.x1, self.y1 = x0, y0, x1, y1
        self.capacity = capacity
        self.points = []
        self.children = None

    def _contains(self, x, y):
        return self.x0 <= x < self.x1 and self.y0 <= y < self.y1

    def _intersects(self, rx0, ry0, rx1, ry1):
        return not (rx1 < self.x0 or rx0 > self.x1 or ry1 < self.y0 or ry0 > self.y1)

    def insert(self, x, y, data=None):
        if not self._contains(x, y): return False
        if self.children is None and len(self.points) < self.capacity:
            self.points.append((x, y, data)); return True
        if self.children is None: self._subdivide()
        for c in self.children:
            if c.insert(x, y, data): return True
        return False

    def _subdivide(self):
        mx = (self.x0 + self.x1) / 2
        my = (self.y0 + self.y1) / 2
        self.children = [
            Quadtree(self.x0, self.y0, mx, my, self.capacity),
            Quadtree(mx, self.y0, self.x1, my, self.capacity),
            Quadtree(self.x0, my, mx, self.y1, self.capacity),
            Quadtree(mx, my, self.x1, self.y1, self.capacity),
        ]
        for x, y, d in self.points:
            for c in self.children:
                if c.insert(x, y, d): break
        self.points = []

    def query_range(self, rx0, ry0, rx1, ry1, out=None):
        if out is None: out = []
        if not self._intersects(rx0, ry0, rx1, ry1): return out
        for x, y, d in self.points:
            if rx0 <= x <= rx1 and ry0 <= y <= ry1: out.append((x, y, d))
        if self.children:
            for c in self.children: c.query_range(rx0, ry0, rx1, ry1, out)
        return out

    def nearest(self, tx, ty):
        import heapq
        best = [float("inf"), None]
        heap = [(self._min_dist_sq(tx, ty), id(self), self)]
        while heap:
            d2, _, node = heapq.heappop(heap)
            if d2 > best[0]: break
            for x, y, data in node.points:
                pd = (x - tx) ** 2 + (y - ty) ** 2
                if pd < best[0]: best = [pd, (x, y, data)]
            if node.children:
                for c in node.children:
                    cd = c._min_dist_sq(tx, ty)
                    if cd <= best[0]:
                        heapq.heappush(heap, (cd, id(c), c))
        return best[1]

    def _min_dist_sq(self, tx, ty):
        dx = 0 if self.x0 <= tx <= self.x1 else min((tx - self.x0) ** 2, (tx - self.x1) ** 2)
        dy = 0 if self.y0 <= ty <= self.y1 else min((ty - self.y0) ** 2, (ty - self.y1) ** 2)
        return dx + dy
```

## code.javascript
```javascript
class Quadtree {
  constructor(x0, y0, x1, y1, capacity = 4) {
    Object.assign(this, { x0, y0, x1, y1, capacity });
    this.points = []; this.children = null;
  }
  contains(x, y) { return x >= this.x0 && x < this.x1 && y >= this.y0 && y < this.y1; }
  intersects(rx0, ry0, rx1, ry1) {
    return !(rx1 < this.x0 || rx0 > this.x1 || ry1 < this.y0 || ry0 > this.y1);
  }
  insert(x, y, data) {
    if (!this.contains(x, y)) return false;
    if (!this.children && this.points.length < this.capacity) { this.points.push({ x, y, data }); return true; }
    if (!this.children) this.subdivide();
    return this.children.some(c => c.insert(x, y, data));
  }
  subdivide() {
    const mx = (this.x0 + this.x1) / 2, my = (this.y0 + this.y1) / 2;
    this.children = [
      new Quadtree(this.x0, this.y0, mx, my, this.capacity),
      new Quadtree(mx, this.y0, this.x1, my, this.capacity),
      new Quadtree(this.x0, my, mx, this.y1, this.capacity),
      new Quadtree(mx, my, this.x1, this.y1, this.capacity),
    ];
    for (const p of this.points) for (const c of this.children) if (c.insert(p.x, p.y, p.data)) break;
    this.points = [];
  }
  queryRange(rx0, ry0, rx1, ry1, out = []) {
    if (!this.intersects(rx0, ry0, rx1, ry1)) return out;
    for (const p of this.points) if (p.x >= rx0 && p.x <= rx1 && p.y >= ry0 && p.y <= ry1) out.push(p);
    if (this.children) for (const c of this.children) c.queryRange(rx0, ry0, rx1, ry1, out);
    return out;
  }
}
```

## code.java
```java
class Quadtree {
    static class Pt { double x, y; Object data; Pt(double x, double y, Object d) { this.x=x; this.y=y; data=d; } }
    double x0, y0, x1, y1;
    int capacity;
    List<Pt> points = new ArrayList<>();
    Quadtree[] children;

    Quadtree(double x0, double y0, double x1, double y1, int cap) {
        this.x0=x0; this.y0=y0; this.x1=x1; this.y1=y1; this.capacity=cap;
    }

    boolean contains(double x, double y) { return x>=x0 && x<x1 && y>=y0 && y<y1; }
    boolean intersects(double a, double b, double c, double d) { return !(c<x0 || a>x1 || d<y0 || b>y1); }

    boolean insert(double x, double y, Object data) {
        if (!contains(x, y)) return false;
        if (children == null && points.size() < capacity) { points.add(new Pt(x, y, data)); return true; }
        if (children == null) subdivide();
        for (Quadtree c : children) if (c.insert(x, y, data)) return true;
        return false;
    }

    void subdivide() {
        double mx = (x0+x1)/2, my = (y0+y1)/2;
        children = new Quadtree[]{
            new Quadtree(x0, y0, mx, my, capacity),
            new Quadtree(mx, y0, x1, my, capacity),
            new Quadtree(x0, my, mx, y1, capacity),
            new Quadtree(mx, my, x1, y1, capacity)
        };
        for (Pt p : points) for (Quadtree c : children) if (c.insert(p.x, p.y, p.data)) break;
        points.clear();
    }

    void queryRange(double a, double b, double c, double d, List<Pt> out) {
        if (!intersects(a, b, c, d)) return;
        for (Pt p : points) if (p.x>=a && p.x<=c && p.y>=b && p.y<=d) out.add(p);
        if (children != null) for (Quadtree ch : children) ch.queryRange(a, b, c, d, out);
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <memory>

struct Point { double x, y; int data; };

class Quadtree {
public:
    Quadtree(double x0, double y0, double x1, double y1, int cap = 4)
        : x0_(x0), y0_(y0), x1_(x1), y1_(y1), capacity_(cap) {}

    bool insert(double x, double y, int data) {
        if (!contains(x, y)) return false;
        if (!children_[0] && (int)points_.size() < capacity_) {
            points_.push_back({x, y, data}); return true;
        }
        if (!children_[0]) subdivide();
        for (auto& c : children_) if (c->insert(x, y, data)) return true;
        return false;
    }

    void queryRange(double a, double b, double c, double d, std::vector<Point>& out) const {
        if (!intersects(a, b, c, d)) return;
        for (const auto& p : points_)
            if (p.x >= a && p.x <= c && p.y >= b && p.y <= d) out.push_back(p);
        if (children_[0]) for (auto& ch : children_) ch->queryRange(a, b, c, d, out);
    }

private:
    double x0_, y0_, x1_, y1_;
    int capacity_;
    std::vector<Point> points_;
    std::unique_ptr<Quadtree> children_[4]{};

    bool contains(double x, double y) const { return x >= x0_ && x < x1_ && y >= y0_ && y < y1_; }
    bool intersects(double a, double b, double c, double d) const {
        return !(c < x0_ || a > x1_ || d < y0_ || b > y1_);
    }

    void subdivide() {
        double mx = (x0_ + x1_) / 2, my = (y0_ + y1_) / 2;
        children_[0] = std::make_unique<Quadtree>(x0_, y0_, mx, my, capacity_);
        children_[1] = std::make_unique<Quadtree>(mx, y0_, x1_, my, capacity_);
        children_[2] = std::make_unique<Quadtree>(x0_, my, mx, y1_, capacity_);
        children_[3] = std::make_unique<Quadtree>(mx, my, x1_, y1_, capacity_);
        for (const auto& p : points_) for (auto& c : children_) if (c->insert(p.x, p.y, p.data)) break;
        points_.clear();
    }
};
```
