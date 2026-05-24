---
slug: random-weighted-sampling
module: math
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
Imagine a number line of length equal to the total weight. Each element owns a segment whose length equals its weight. Draw a uniform random point on the line and report which segment it landed in. The cumulative-sum array stores the right endpoint of each segment; binary search finds the owner. The alias method is a clever rearrangement that lets every draw be a single coin flip and an array lookup.

## visualization
Weights [1, 3, 2, 4] sum to 10. Cumulative [1, 4, 6, 10]. Draw u uniform in [0, 10). u=0.5 -> index 0 (A). u=3.7 -> index 1 (B). u=6.1 -> index 3 (D). Probabilities come out exactly 1/10, 3/10, 2/10, 4/10 over many draws. For alias: pair the smallest (1) with part of the largest (4), making bucket 0 split 1.0 : 1.5; repeat to fill all n buckets so each has total mass 2.5, then a single uniform [0, n) draw plus a coin flip selects.

## bruteForce
Build a flat array repeating each element by its (integer) weight, then pick a uniform index. Simple, O(1) per draw, but O(sum of weights) memory — wrecked the moment weights are real-valued or sum to billions.

## optimal
Cumulative + binary search: precompute the prefix sums in O(n), draw `u` uniform in `[0, total)`, return `lower_bound(prefix, u)`. O(log n) per draw, O(n) memory, and weights can be updated in O(n) for the prefix rebuild (or O(log n) with a Fenwick tree for online updates). For static distributions and very high sample volume, Walker's alias method gives O(1) per draw after O(n) setup.

## complexity
time: O(n) preprocessing, O(log n) per sample for CDF+binary search; O(n) preprocessing, O(1) per sample for alias method.
space: O(n) for either; alias method needs two arrays (prob, alias).
notes: For streaming with weights, use weighted reservoir sampling (Efraimidis-Spirakis), which is a separate algorithm.

## pitfalls
- Using `random() * total` and then a linear scan — O(n) per draw, fine for tiny n, terrible for large n.
- Allowing negative or zero-sum weights silently — guard against them before building the CDF.
- Rebuilding the cumulative array on every draw — that defeats the purpose.
- Forgetting that `bisect_right` and `bisect_left` differ at exact boundaries; the right choice is `bisect_right` for half-open segments `[lo, hi)`.
- Sampling with replacement when the problem requires without replacement (use weighted reservoir or repeated sampling with weight zeroing).

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
