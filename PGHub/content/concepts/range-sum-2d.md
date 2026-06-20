---
slug: range-sum-2d
module: arrays-range-structures
title: 2D Prefix Sum for Rectangle Queries
subtitle: Precompute a 2D prefix-sum grid so any axis-aligned rectangle sum answers in O(1).
difficulty: Intermediate
position: 22
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Prefix Sum 2D — cp-algorithms"
    url: "https://cp-algorithms.com/data_structures/segment_tree.html"
    type: blog
  - title: "2D Prefix Sum Array — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/prefix-sum-2d-array/"
    type: blog
  - title: "TheAlgorithms/Python — prefix_sum.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/arrays/prefix_sum.py"
    type: repo
status: published
---

## intro
A 2D prefix-sum grid is the matrix analog of the 1D prefix-sum array. Build it once in O(rows × cols), and from then on any axis-aligned rectangle sum — defined by its top-left and bottom-right corners — can be answered in four table lookups, regardless of the rectangle's size.

## whyItMatters
- **Integral images** in computer vision: Viola and Jones' 2001 face detector evaluates millions of Haar features per frame; without summed-area tables it would be unshippable in real time. OpenCV exposes the same primitive as `cv2.integral`.
- **Heatmap and OLAP queries**: dashboards over Postgres, Druid, and ClickHouse precompute summed-area tables across (region, time) grids so analysts get instant aggregations on hundreds of millions of cells.
- **Game and physics engines** use 2D prefix sums on density grids for fluid-pressure solvers and collision broad-phase culling.
- **CNN feature engineering**: SPP-net (He et al., 2014) and Fast R-CNN rely on integral images to pool variable-sized regions in O(1) per channel.

## intuition
The technique exists because querying axis-aligned rectangles is a constant-time inclusion-exclusion problem in disguise — once you know the cumulative mass of every "north-west wedge" anchored at the origin, every rectangle can be expressed as an arithmetic combination of four such wedges. That observation is what turns an O(area) scan into four memory loads.

Define P[i][j] as the sum of every cell strictly north and west of (i, j), where row 0 and column 0 are a sentinel band of zeros so the recurrence has no border cases. Build P top-down: P[i][j] = matrix[i-1][j-1] + P[i-1][j] + P[i][j-1] − P[i-1][j-1]. The reason for the subtraction is double counting — the rectangle above and the rectangle to the left both include the upper-left rectangle, so it gets added twice and must be removed once.

For a query rectangle with inclusive corners (r1, c1) to (r2, c2), think of the big NW wedge ending at (r2+1, c2+1). Subtract the wedge above (rows < r1) and the wedge to the left (cols < c1). Both of those wedges include the small wedge in the upper-left of the query rectangle, so it was removed twice — add it back once. That gives the canonical four-term formula. The same inclusion-exclusion structure generalizes to 3D (eight terms, alternating signs) and is the combinatorial dual of higher-dimensional integration.

## visualization
For matrix [[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]], the prefix sum P at (5,5) totals 50. To query the sum of the rectangle (1,1) to (2,2), compute P[3][3] − P[1][3] − P[3][1] + P[1][1] = 17 − 4 − 8 + 3 = 8. The four corners encode an inclusion-exclusion sum.

## bruteForce
For each query, iterate over every cell in the rectangle and accumulate. O((r2 − r1)(c2 − c1)) per query, which is fine for a single small query but blows up under repeated calls on a large grid. With q queries on a 1000×1000 matrix, the worst case is q × 10^6 operations — clearly unacceptable for interactive workloads.

## optimal
**Technique: 2D summed-area table (integral image).** Preprocess once in O(R·C), then answer every rectangle sum in O(1) with four array loads. The optimal bound is information-theoretic: with Q queries arriving online, you cannot beat Θ(R·C + Q) total time, because even reading the input is Ω(R·C); the prefix table saturates that lower bound.

```python
def build(matrix):
    R, C = len(matrix), len(matrix[0])
    P = [[0] * (C + 1) for _ in range(R + 1)]
    for i in range(R):
        for j in range(C):
            P[i+1][j+1] = (matrix[i][j]
                           + P[i][j+1]      # NW wedge ending one row up
                           + P[i+1][j]      # NW wedge ending one col left
                           - P[i][j])       # intersection counted twice
    return P

def query(P, r1, c1, r2, c2):
    return (P[r2+1][c2+1]
            - P[r1][c2+1]
            - P[r2+1][c1]
            + P[r1][c1])
```

Key lines: the `+1` shift creates a sentinel row/column of zeros so the build recurrence never indexes out of bounds; that single trick removes the if-else cascade at the borders. The query line is pure inclusion-exclusion — adding the big NW wedge, subtracting the two over-counted wedges, then adding the doubly-subtracted intersection back.

**When the matrix mutates**: a static prefix table is useless because every update touches up to R·C cells of P. Switch to a 2D Fenwick (BIT) tree for O(log R · log C) per update and per query — the same primitive backing Apache Lucene's facet aggregation and many time-series stores. For very sparse updates against a mostly-static grid, a "delta map + base prefix" hybrid often wins.

## complexity
time: O(R × C) preprocessing; O(1) per query
space: O(R × C) for the prefix-sum grid
notes: For sparse updates and queries, a 2D Fenwick / BIT trades the O(1) query for O(log² ·) update and query — usually a better fit when the matrix changes. For very large but rarely queried matrices, lazy computation by row-prefix only is a middle ground.

## pitfalls
- Off-by-one errors in the query formula — pin down whether r2, c2 are inclusive or exclusive and code accordingly.
- Forgetting the extra row/column of zeros — leads to special-casing the first row and column.
- Recomputing the prefix sum on every query — defeats the entire purpose.
- Integer overflow on large grids — sums can exceed 2^31 quickly; use 64-bit integers when in doubt.

## interviewTips
- State the inclusion-exclusion formula on the board before coding — it is the heart of the algorithm.
- Mention integral images and Viola-Jones to show you know one real-world application.
- Compare against Fenwick / segment trees for mutable matrices and explain when each wins.
- If the interviewer asks "what about a non-axis-aligned rectangle?", explain that rotated rectangles need a different trick (rotating the coordinate system 45°).

## code.python
```python
class NumMatrix:
    def __init__(self, matrix):
        if not matrix or not matrix[0]:
            self.P = []
            return
        r, c = len(matrix), len(matrix[0])
        self.P = [[0] * (c + 1) for _ in range(r + 1)]
        for i in range(r):
            for j in range(c):
                self.P[i + 1][j + 1] = (
                    matrix[i][j]
                    + self.P[i][j + 1]
                    + self.P[i + 1][j]
                    - self.P[i][j]
                )

    def sum_region(self, r1, c1, r2, c2):
        return (
            self.P[r2 + 1][c2 + 1]
            - self.P[r1][c2 + 1]
            - self.P[r2 + 1][c1]
            + self.P[r1][c1]
        )
```

## code.javascript
```javascript
class NumMatrix {
  constructor(matrix) {
    if (!matrix.length || !matrix[0].length) { this.P = []; return; }
    const r = matrix.length, c = matrix[0].length;
    this.P = Array.from({ length: r + 1 }, () => new Array(c + 1).fill(0));
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        this.P[i + 1][j + 1] =
          matrix[i][j] + this.P[i][j + 1] + this.P[i + 1][j] - this.P[i][j];
      }
    }
  }
  sumRegion(r1, c1, r2, c2) {
    return (
      this.P[r2 + 1][c2 + 1] -
      this.P[r1][c2 + 1] -
      this.P[r2 + 1][c1] +
      this.P[r1][c1]
    );
  }
}
```

## code.java
```java
class NumMatrix {
    private int[][] P;
    public NumMatrix(int[][] matrix) {
        if (matrix.length == 0 || matrix[0].length == 0) { P = new int[0][0]; return; }
        int r = matrix.length, c = matrix[0].length;
        P = new int[r + 1][c + 1];
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                P[i + 1][j + 1] = matrix[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
            }
        }
    }
    public int sumRegion(int r1, int c1, int r2, int c2) {
        return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1];
    }
}
```

## code.cpp
```cpp
class NumMatrix {
    std::vector<std::vector<int>> P;
public:
    NumMatrix(std::vector<std::vector<int>>& matrix) {
        if (matrix.empty() || matrix[0].empty()) return;
        int r = matrix.size(), c = matrix[0].size();
        P.assign(r + 1, std::vector<int>(c + 1, 0));
        for (int i = 0; i < r; i++)
            for (int j = 0; j < c; j++)
                P[i + 1][j + 1] = matrix[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
    }
    int sumRegion(int r1, int c1, int r2, int c2) {
        return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1];
    }
};
```
