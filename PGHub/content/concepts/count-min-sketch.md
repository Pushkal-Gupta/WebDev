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

## visualization
d=3 rows, w=5 cols. Insert "a" → h1(a)=2, h2(a)=4, h3(a)=1 → row[0][2]+=1, row[1][4]+=1, row[2][1]+=1. Insert "b" 5 times → cells incremented by 5. Insert "a" twice more. Estimate("a") = min(row[0][2], row[1][4], row[2][1]) = min(3, 3+5_if_collision, 3) = 3. If "b" collided with "a" in row 1, that row reads 8 — we still take min = 3.

## bruteForce
Exact frequency map: hash table from key to int. Linear memory in distinct keys. For a stream of 10^10 events over 10^8 distinct keys, that's gigabytes. Impossible on a single server; even distributed it's expensive to maintain.

## optimal
Pick width w = ⌈e / ε⌉ and depth d = ⌈ln(1/δ)⌉ where ε is the additive error fraction and δ is the failure probability. Total memory: w × d × counter_bits. For ε=0.001 and δ=0.001, that's about 2718 × 7 ≈ 19k counters — a few KB.

Operations:
- `update(x, c)`: for each row i, `table[i][h_i(x) % w] += c`.
- `estimate(x)`: return min over i of `table[i][h_i(x) % w]`.
- Heavy hitters: keep a small heap of the top-k by estimate, updated on every insert.

Variations: **Conservative update** (only increment cells whose minimum equals the queried min) shrinks bias. **Count-Mean-Min** subtracts the expected noise contribution per row to reduce overestimation.

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
