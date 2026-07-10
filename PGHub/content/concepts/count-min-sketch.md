---
slug: count-min-sketch
module: hashing
title: Count-Min Sketch
subtitle: Approximate frequency counts in sublinear memory with one-sided overestimation error.
difficulty: Advanced
position: 34
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms (Sedgewick) — Hash Tables & Streaming"
    url: "https://algs4.cs.princeton.edu/34hash/"
    type: book
  - title: "Count-Min Sketch — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/count-min-sketch-in-java-with-examples/"
    type: blog
  - title: "Competitive Programming Algorithms — Sketches"
    url: "https://cp-algorithms.com/data_structures/sqrt_decomposition.html"
    type: blog
status: published
---

## intro
Count-Min Sketch (Cormode & Muthukrishnan, 2003) is the streaming-frequency cousin of the Bloom filter. It maintains d hash tables of width w; an update hashes the key into one cell per row and increments. A query returns the *minimum* of the d cells the key hashes to. The answer always overestimates — never under — and the error is bounded with high probability.

## whyItMatters
Heavy-hitter detection ("top URLs," "top spenders," "top error sources") in a high-volume stream is impossible with exact counts: you can't keep a hash map of every key. Count-min sketch compresses billions of distinct keys into a few kilobytes while keeping the heaviest hitters' counts accurate. Telco fraud detection, CDN cache analytics, ad-frequency capping, and database query optimization all use variations of this structure.

## intuition
Imagine d people independently writing tally marks in d different ledgers, each with w columns. When key x arrives, each person uses their own hash function to pick a column and adds a mark. To look up x, ask all d people for the value in x's column — the smallest is closest to the truth, because other keys could only have *added* marks (no one ever subtracts), and the min cell is the one with the fewest collisions.

Here is the reframe that makes the "take the minimum" trick click. A single hash table with collisions is a *liar that only ever exaggerates*: when two keys land in the same bucket, that bucket's count is the sum of both, so it over-reports each of them but can never under-report — nobody's marks vanish. One such table is too noisy to trust. But if you keep d independent tables, key x gets a *different* set of collision partners in each row. For x's count to be wrong in every row, x would have to be unlucky d separate times. Taking the minimum across rows keeps only x's least-polluted estimate, and the odds of high pollution in all d rows shrink geometrically.

Concrete micro-example, d=3 rows, w=5 columns, all cells start at 0. Stream: "a","a","a","b","b","b","b","b" (a appears 3 times, b appears 5). Say the hashes are h0(a)=2, h1(a)=4, h2(a)=1 and h0(b)=0, h1(b)=4, h2(b)=3. After inserting all a's and b's, row 0 col 2 = 3, row 1 col 4 = 3+5 = 8 (a and b collide here!), row 2 col 1 = 3. To estimate a we read those three cells: min(3, 8, 3) = 3 — exactly right, because the poisoned row 1 got discarded by the min. What's actually happening: collisions only ever inflate a cell, so every row is an upper bound on the truth, and the tightest upper bound (the minimum) is our answer. That is why the estimate is one-sided: it can equal or exceed the true count, never fall below it.

Grid d=3 rows x w=5 cols, all zero. Hashes: a->(col2,col4,col1), b->(col0,col4,col3).
Stream: three "a" then five "b". Bracketed [n] marks the cell an insert just touched.

```
state           col0  col1  col2  col3  col4
------------------------------------------------
initial      r0   0     0     0     0     0
             r1   0     0     0     0     0
             r2   0     0     0     0     0

+3x "a"      r0   0     0    [3]    0     0     h0(a)=2
             r1   0     0     0     0    [3]    h1(a)=4
             r2   0    [3]    0     0     0     h2(a)=1

+5x "b"      r0  [5]    0     3     0     0     h0(b)=0
             r1   0     0     0     0    [8]    h1(b)=4  <- collides with a
             r2   0     3     0    [5]    0     h2(b)=3

estimate("a") = min( r0[2], r1[4], r2[1] ) = min(3, 8, 3) = 3   (exact; row1 noise dropped)
estimate("b") = min( r0[0], r1[4], r2[3] ) = min(5, 8, 5) = 5   (exact)
```
Every read is an upper bound; the min discards the collided row and recovers the truth here.

## bruteForce
Exact frequency map: hash table from key to int. Linear memory in distinct keys. For a stream of 10^10 events over 10^8 distinct keys, that's gigabytes. Impossible on a single server; even distributed it's expensive to maintain.

## optimal
Pick width w = ⌈e / ε⌉ and depth d = ⌈ln(1/δ)⌉ where ε is the additive error fraction and δ is the failure probability. Total memory: w × d × counter_bits. For ε=0.001 and δ=0.001, that's about 2718 × 7 ≈ 19k counters — a few KB.

Operations:
- `update(x, c)`: for each row i, `table[i][h_i(x) % w] += c`.
- `estimate(x)`: return min over i of `table[i][h_i(x) % w]`.
- Heavy hitters: keep a small heap of the top-k by estimate, updated on every insert.

Variations: **Conservative update** (only increment cells whose minimum equals the queried min) shrinks bias. **Count-Mean-Min** subtracts the expected noise contribution per row to reduce overestimation.

Why the sizing works, step by step. Fix any row i. The cell key x maps to accumulates x's true count plus the counts of every *other* key that hashed to the same column. With w columns and pairwise-independent hashing, each other unit of mass lands in x's column with probability 1/w, so the expected noise added to x's cell is total_count / w. Set w = e/ε and that expected noise is ε·total_count/e. Markov's inequality then says a single row exceeds ε·total_count noise with probability at most 1/e. The **key invariant** is that every row over-reports independently, so all d rows exceed the error bound simultaneously with probability at most (1/e)^d; choosing d = ln(1/δ) drives that joint failure probability below δ. Taking the min is what turns "any one row might be noisy" into "all rows must be noisy to fail." The **central tradeoff** is memory versus accuracy and confidence: widening w tightens the per-query error ε linearly, while deepening d tightens the failure probability δ exponentially — so you buy confidence cheaply (a few extra rows) but pay linearly for precision (many extra columns). Operation cost stays O(d) hashes and O(d) cell touches for both update and query regardless of stream size, and memory is a flat w·d counters that never grows with the number of distinct keys — the property that makes it viable on unbounded streams.

## complexity
time: O(d) per update and query
space: O(w × d) counters
notes: With probability 1 - δ, estimate(x) ≤ true_count(x) + ε × total_count. The bound is tight for skewed Zipfian streams.

## pitfalls
- Using pairwise-dependent hash functions — independence (or near-independence) is essential for the error bound.
- Treating min as exact — it is one-sided overestimate; never under-counts.
- Forgetting to size for stream length, not just distinct-key count — error scales with total events.
- Picking d=1 — you get a single hash and no probabilistic correction; reverts to a noisy hash table.
- Tracking heavy hitters without a side heap — knowing "x has count 1M" is useless if you never asked.

## interviewTips
- Compare with HyperLogLog (distinct-count) and Misra-Gries (deterministic top-k) — different problems, same family.
- Cite real users: Apache Spark (`approxFreqItems`), Redis (`CMS.*` commands), Druid.
- Discuss when *not* to use it: small streams (just use a map), exact billing (use proper counters).

## code.python
```python
import math
import hashlib

class CountMin:
    def __init__(self, eps=0.001, delta=0.001):
        self.w = math.ceil(math.e / eps)
        self.d = math.ceil(math.log(1 / delta))
        self.table = [[0] * self.w for _ in range(self.d)]
    def _hash(self, x, i):
        h = hashlib.md5(f"{i}:{x}".encode()).digest()
        return int.from_bytes(h[:4], "big") % self.w
    def update(self, x, c=1):
        for i in range(self.d):
            self.table[i][self._hash(x, i)] += c
    def estimate(self, x):
        return min(self.table[i][self._hash(x, i)] for i in range(self.d))

cm = CountMin()
for word in "to be or not to be that is the question".split():
    cm.update(word)
print(cm.estimate("to"), cm.estimate("question"))
```

## code.javascript
```javascript
const crypto = require("crypto");

class CountMin {
  constructor(eps = 0.001, delta = 0.001) {
    this.w = Math.ceil(Math.E / eps);
    this.d = Math.ceil(Math.log(1 / delta));
    this.table = Array.from({ length: this.d }, () => new Array(this.w).fill(0));
  }
  _hash(x, i) {
    const h = crypto.createHash("md5").update(`${i}:${x}`).digest();
    return h.readUInt32BE(0) % this.w;
  }
  update(x, c = 1) {
    for (let i = 0; i < this.d; i++) this.table[i][this._hash(x, i)] += c;
  }
  estimate(x) {
    let best = Infinity;
    for (let i = 0; i < this.d; i++) best = Math.min(best, this.table[i][this._hash(x, i)]);
    return best;
  }
}

const cm = new CountMin();
"to be or not to be that is the question".split(" ").forEach((w) => cm.update(w));
console.log(cm.estimate("to"), cm.estimate("question"));
```

## code.java
```java
import java.security.MessageDigest;

public class CountMin {
    private final int w, d;
    private final int[][] table;

    public CountMin(double eps, double delta) {
        this.w = (int) Math.ceil(Math.E / eps);
        this.d = (int) Math.ceil(Math.log(1 / delta));
        this.table = new int[d][w];
    }

    private int hash(String x, int i) {
        try {
            byte[] h = MessageDigest.getInstance("MD5").digest((i + ":" + x).getBytes());
            int v = ((h[0] & 0xff) << 24) | ((h[1] & 0xff) << 16)
                  | ((h[2] & 0xff) << 8) | (h[3] & 0xff);
            return Math.floorMod(v, w);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    public void update(String x, int c) {
        for (int i = 0; i < d; i++) table[i][hash(x, i)] += c;
    }

    public int estimate(String x) {
        int best = Integer.MAX_VALUE;
        for (int i = 0; i < d; i++) best = Math.min(best, table[i][hash(x, i)]);
        return best;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <cmath>
#include <functional>
#include <algorithm>
#include <climits>

class CountMin {
    int w, d;
    std::vector<std::vector<int>> table;
    std::hash<std::string> hasher;
public:
    CountMin(double eps, double delta) {
        w = (int)std::ceil(std::exp(1.0) / eps);
        d = (int)std::ceil(std::log(1.0 / delta));
        table.assign(d, std::vector<int>(w, 0));
    }
    int hashAt(const std::string& x, int i) const {
        size_t h = hasher(std::to_string(i) + ":" + x);
        return (int)(h % w);
    }
    void update(const std::string& x, int c = 1) {
        for (int i = 0; i < d; i++) table[i][hashAt(x, i)] += c;
    }
    int estimate(const std::string& x) const {
        int best = INT_MAX;
        for (int i = 0; i < d; i++) best = std::min(best, table[i][hashAt(x, i)]);
        return best;
    }
};
```
