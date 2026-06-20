---
slug: random-weighted-sampling
module: math-geom-sampling
title: Weighted Random Sampling
subtitle: Sample by weight via cumulative arrays and binary search, then graduate to Walker's alias method.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Princeton"
    url: "https://algs4.cs.princeton.edu/13stacks/"
    type: book
  - title: "Weighted Random Sampling — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/random-number-generator-in-arbitrary-probability-distribution-fashion/"
    type: blog
  - title: "TheAlgorithms/Python — searches (binary search reused for CDF)"
    url: "https://github.com/TheAlgorithms/Python/tree/master/searches"
    type: repo
status: published
---

## intro
Uniform random picks every element with equal probability. Weighted sampling lets each element have its own probability — useful for loaded dice, ad rotation, recommendation candidates, importance sampling in ML, and procedural generation. The two standard techniques are cumulative-distribution + binary search (easy, O(log n) per sample) and Walker's alias method (constant time after O(n) preprocessing).

## whyItMatters
Real systems sample under skewed distributions: a recommender draws candidates with popularity-proportional probability; a load balancer picks shards by capacity; a Monte Carlo simulator draws from a discrete posterior. Getting the math wrong gives systematically biased results that look fine until they cause a revenue dip or a paper retraction.

## intuition
The mental model is a number line, not a set of buckets. Lay out all the elements end to end so each owns a contiguous interval whose length equals its weight. The total length of the line equals the sum of all weights. To sample an element with probability proportional to its weight, draw a uniform random point on this line and report which interval contains the point. That's it — uniformity over the line plus weighted-length intervals automatically produces weight-proportional element selection.

The *why* before the *how*: probability is just normalized length. If element `i` has weight `w_i` and the total weight is `W`, its interval covers a fraction `w_i / W` of the line, and a uniform draw lands in it with exactly that probability. The implementation problem is just "which interval contains a given point," which is the classic prefix-sum + binary search question. Storing the prefix sums turns the per-sample cost from O(n) linear scan into O(log n) binary search.

The key invariant: `prefix[i]` is the right endpoint of element `i`'s interval, equivalently the sum of weights `w_0 + w_1 + ... + w_i`. The prefix array is monotonic non-decreasing, which is what lets binary search find the smallest index `i` with `prefix[i] > u` (the owning interval).

Analogy: imagine a dartboard whose sectors have different angular widths. Throwing a dart uniformly at the rim is fair, but the sector you hit depends on its angular width — a sector twice as wide gets hit twice as often. The prefix array is the running total of angles around the rim, and binary search is "given the angle where the dart landed, which sector owns it." Walker's alias method is a clever physical rearrangement: chop the dartboard into `n` equal-area panels, each of which holds at most two original sectors with a known split, so a single draw becomes "pick a panel, then flip a coin."

## visualization
```
weights = [1, 3, 2, 4]       sum W = 10

Number line layout:
   [---][--------][------][------------]
    A       B         C          D
   0  1     1..4     4..6      6..10

prefix[] = [1, 4, 6, 10]      (right endpoints of each interval)

Sample procedure:  u = Uniform[0, 10)
   u =  0.5  ->  bisect_right(prefix, 0.5)  = 0  -> A
   u =  1.0  ->  bisect_right(prefix, 1.0)  = 1  -> B  (half-open intervals)
   u =  3.7  ->  bisect_right(prefix, 3.7)  = 1  -> B
   u =  4.2  ->  bisect_right(prefix, 4.2)  = 2  -> C
   u =  6.1  ->  bisect_right(prefix, 6.1)  = 3  -> D
   u =  9.9  ->  bisect_right(prefix, 9.9)  = 3  -> D

Expected frequencies over many draws:
   A : 1/10    B : 3/10    C : 2/10    D : 4/10

Walker alias preprocessing (target bucket size = W/n = 2.5):
   start:    A=1.0  B=3.0  C=2.0  D=4.0
   small=A (1.0), large=D (4.0)
      bucket 0:  prob 0.4 of A, else D;   D shrinks to 4.0 - (2.5-1.0) = 2.5
   small=C (2.0), large=B (3.0)
      bucket 1:  prob 0.8 of C, else B;   B shrinks to 3.0 - 0.5 = 2.5
   bucket 2 = D alone (already exactly 2.5),  bucket 3 = B alone

Sample:  pick uniform bucket b in {0,1,2,3}, flip coin with prob[b];
         heads -> primary[b], tails -> alias[b].   O(1) per draw.
```

## bruteForce
Build a flat array repeating each element by its (integer) weight, then pick a uniform index. Simple, O(1) per draw, but O(sum of weights) memory — wrecked the moment weights are real-valued or sum to billions.

## optimal
The optimal algorithm depends on how many samples you will draw and whether weights change over time. For the canonical case (static weights, many samples), there are two production-grade choices: cumulative-distribution + binary search and Walker's alias method.

The CDF + binary search approach precomputes a prefix-sum array in O(n) time and O(n) memory. Each sample draws a uniform real `u` in `[0, total)` and returns `bisect_right(prefix, u)` — the index of the first prefix entry strictly greater than `u`. Binary search costs O(log n) per draw. Data structures: one monotonic `prefix` array of length `n` and a uniform random number generator. Use `bisect_right` (a.k.a. `upper_bound`) so the half-open intervals `[prefix[i-1], prefix[i])` map cleanly to element `i`. Weight updates cost O(n) for a naive rebuild or O(log n) for a Fenwick (binary indexed) tree that stores partial sums and supports point updates plus prefix-sum queries.

Walker's alias method trades implementation effort for asymptotically constant sampling. Preprocessing in O(n) builds two arrays `prob[0..n-1]` and `alias[0..n-1]` such that bucket `i` contains element `i` with probability `prob[i]` and a "borrowed" element `alias[i]` otherwise. The construction uses a two-pointer trick: at each step pick one bucket whose total weight is below average (`< W/n`) and one above average; fill the underweight bucket from the overweight one, decrement the overweight bucket's residual, and continue until all buckets are exactly average. Each sample then draws a uniform integer `b` in `[0, n)` and a uniform real `r` in `[0, 1)`; return `b` if `r < prob[b]` else `alias[b]`. One integer draw, one float draw, two array lookups — strictly O(1).

Key invariants and tradeoffs. CDF is easier to implement, supports online weight updates (with a Fenwick tree), and uses one array of doubles. Alias is faster per sample but assumes a static distribution; rebuilding for new weights is O(n). For streaming inputs where you must sample as the stream arrives without knowing the total weight, switch to weighted reservoir sampling (Efraimidis–Spirakis), which is an entirely different algorithm based on independent priorities `u_i^(1/w_i)`. Always guard against negative or zero-total weights — they have no probabilistic interpretation and must be rejected explicitly at the API boundary.

## complexity
time: O(n) preprocessing, O(log n) per sample for CDF+binary search; O(n) preprocessing, O(1) per sample for alias method.
space: O(n) for either; alias method needs two arrays (prob, alias).
notes: For streaming with weights, use weighted reservoir sampling (Efraimidis-Spirakis), which is a separate algorithm.

## pitfalls
- **Linear scan instead of binary search.** A naive `for i in range(n): if u < prefix[i]: return i` is O(n) per draw, fine for n=10 and catastrophic for n=10^6. Fix: precompute `prefix` once and use `bisect_right` / `upper_bound` to get O(log n) per draw.
- **Negative or zero-sum weights.** Negative weights have no probabilistic interpretation; a zero total causes `u % 0` or division-by-zero. Fix: validate at construction (`assert all(w >= 0) and sum(w) > 0`) and throw a clear error before building the CDF.
- **Rebuilding the CDF every draw.** Recomputing prefix sums on every sample turns O(log n) per draw into O(n). Fix: build `prefix` once in the constructor and only rebuild when weights actually change; for frequent updates use a Fenwick tree.
- **`bisect_left` vs `bisect_right` boundary swap.** Picking `bisect_left` for half-open intervals `[prev, prefix[i])` shifts every sample one index left at exact boundaries, biasing the distribution. Fix: use `bisect_right` (Python) / `upper_bound` (C++) when intervals are half-open ending at `prefix[i]`.
- **Sample-with-replacement when problem demands without-replacement.** Drawing K independent weighted samples can repeat elements; tasks like "shuffle weighted" require unique results. Fix: use weighted reservoir sampling (Efraimidis–Spirakis) or repeatedly sample-and-zero-the-weight (rebuilding the CDF each time) for K << n.

## interviewTips
- Sketch both methods and state the trade-off: CDF is easier to implement and supports updates; alias is faster but harder to build.
- Mention the offline alias setup as a textbook two-pointer trick — small bucket gets fully filled by a large one.
- Bring up the streaming variant (weighted reservoir sampling) for "unbounded input" follow-ups.

## code.python
```python
import bisect, random

class WeightedSampler:
    def __init__(self, weights: list[float]):
        assert all(w >= 0 for w in weights) and sum(weights) > 0
        self.prefix = []
        total = 0.0
        for w in weights:
            total += w
            self.prefix.append(total)
        self.total = total

    def sample(self) -> int:
        u = random.random() * self.total
        return bisect.bisect_right(self.prefix, u)
```

## code.javascript
```javascript
export class WeightedSampler {
  constructor(weights) {
    this.prefix = [];
    let total = 0;
    for (const w of weights) { total += w; this.prefix.push(total); }
    this.total = total;
  }
  sample() {
    const u = Math.random() * this.total;
    let lo = 0, hi = this.prefix.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.prefix[mid] <= u) lo = mid + 1; else hi = mid;
    }
    return lo;
  }
}
```

## code.java
```java
import java.util.Random;

public class WeightedSampler {
    private final double[] prefix;
    private final double total;
    private final Random rng = new Random();

    public WeightedSampler(double[] weights) {
        prefix = new double[weights.length];
        double t = 0;
        for (int i = 0; i < weights.length; i++) { t += weights[i]; prefix[i] = t; }
        total = t;
    }
    public int sample() {
        double u = rng.nextDouble() * total;
        int lo = 0, hi = prefix.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (prefix[mid] <= u) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <random>
#include <algorithm>

class WeightedSampler {
    std::vector<double> prefix;
    double total = 0;
    std::mt19937 rng{std::random_device{}()};
public:
    explicit WeightedSampler(const std::vector<double>& weights) {
        prefix.reserve(weights.size());
        for (double w : weights) { total += w; prefix.push_back(total); }
    }
    int sample() {
        std::uniform_real_distribution<double> dist(0.0, total);
        double u = dist(rng);
        return static_cast<int>(std::upper_bound(prefix.begin(), prefix.end(), u) - prefix.begin());
    }
};
```
