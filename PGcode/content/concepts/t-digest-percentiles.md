---
slug: t-digest-percentiles
module: hashing
title: t-digest Percentiles
subtitle: Approximate quantiles on streaming data with tight error near the tails.
difficulty: Advanced
position: 17
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Order Statistics Trees — walkccc.me/CLRS"
    url: "https://walkccc.me/CLRS/Chap14/14.1/"
    type: book
  - title: "Streaming Algorithms for Median and Quantiles — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/find-median-of-the-stream/"
    type: blog
  - title: "TheAlgorithms/Python — running_median.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/heap/heap_generic.py"
    type: repo
status: published
---

## intro
A t-digest summarises a stream of real-valued samples into a compact set of weighted centroids so you can ask for any quantile (median, p99, p99.9) with bounded error. Unlike sketches that give uniform error across the distribution, t-digest tightens error at the tails — exactly where SLO percentiles live.

## whyItMatters
Latency SLOs are written as p99 or p99.9. Exact percentiles need every sample sorted, which is impossible on a billion-RPS stream. Ted Dunning's t-digest (2013, *Computing Extremely Accurate Quantiles Using t-Digests*) is the de-facto solution: roughly 50 KiB of state per stream, sub-millisecond merges, and relative error around 0.01% at p99 with a typical compression of 100. Elastic uses it for the `percentiles` aggregation, Apache Druid for its sketch-based percentile queries, Datadog ships it as the storage format for distribution metrics, Prometheus' Mimir and Cortex use it as a long-term store complement to native histograms, and Apache Cassandra's `nodetool tablehistograms` reports t-digest output. Reservoir sampling is too coarse for the tails; fixed-bin histograms under-resolve precisely where you need accuracy.

## intuition
A t-digest summarizes a stream as a list of centroids, each one a `(mean, weight)` pair. Centroids near the tails (close to 0% or 100%) are allowed to hold only a few samples each, so their mean is a tight estimate of the underlying quantile. Centroids in the middle (around 50%) are allowed to hold many samples, because the median is robust and even a coarse estimate is fine there. This variable-resolution trick is the key insight: spend bits where they help your SLO (the tails) and save them where they do not (the middle).

The shape that controls bin size is a scaling function `k(q)` that maps quantile `q in [0,1]` to a notional position on a number line. The function is shallow near `q = 0.5` and steep near `q = 0` or `q = 1`, so converting back gives wide bins in the middle and narrow bins in the tails. New samples are merged into the centroid whose `k` index sits closest, splitting if the merge would push it past a compression budget proportional to `1 / (q * (1 - q))`.

Two properties make t-digest production-friendly. **Mergeable**: combining two digests is just centroid concatenation followed by a re-cluster pass, so per-shard digests can be aggregated cheaply at query time. **Order-independent error**: the bounds hold regardless of input order, unlike GK summaries which need careful sequencing.

## visualization
Imagine the empirical CDF as a curve from (min, 0) to (max, 1). Sprinkle centroids along it. In the middle the centroids are spaced widely on the x-axis; near both ends they crowd together. To find p99, walk centroids accumulating weight until the cumulative weight crosses 0.99 * N, then linearly interpolate inside the straddling centroid. The denser tail-clustering keeps the interpolation interval small even when N is huge.

## bruteForce
Buffer every sample and sort to answer a quantile. O(N log N) time and O(N) memory. For a stream this is infeasible after a few million points. A naive fix is to keep two heaps for the median (the "Find Median from Data Stream" pattern), but that only gives one quantile and still uses O(N) memory.

## optimal
Use the reference C++/Java/Python implementations (`tdunning/t-digest`, `MetricsHub/t-digest`, `CamDavidsonPilon/tdigest`) with the default merging algorithm and a compression parameter `delta = 100` for most metrics. Insert is `O(log K)` amortized where `K` is the centroid count (typically a few hundred). Merge across shards is `O(K_1 + K_2)` and produces a digest that still meets the original error bound. Query is `O(log K)` by binary-searching the cumulative-weight prefix array.

```python
from tdigest import TDigest

stream = TDigest(delta=100)
for latency_ms in events():
    stream.update(latency_ms)

p50 = stream.percentile(50)
p99 = stream.percentile(99)
p999 = stream.percentile(99.9)

shard_digests = [TDigest.from_bytes(b) for b in fetch_shard_blobs()]
global_digest = TDigest()
for d in shard_digests:
    global_digest += d
```

The critical line is `global_digest += d`, the merge operator. It is the reason t-digest fits horizontally-scaled systems: every shard emits its own digest, the aggregator concatenates, and the answer is mathematically identical to a single-node digest fed the union of streams. The accuracy guarantee from Dunning's paper is: at compression `delta = 100`, error at p99 is below 1% relative; at `delta = 1000`, below 0.1%. Memory grows linearly in `delta` and is independent of the stream length — exactly the property you need for a metric that runs forever. For SLO dashboards ingesting hundreds of millions of samples per minute, set `delta = 200` and run a per-minute roll-up that merges per-shard digests into a single per-minute digest before persisting; storage stays flat while preserving the tail accuracy auditors care about.

## complexity
time: O(log d) amortised per insert, O(d) per quantile query
space: O(d) where d is the centroid count, typically 100x smaller than N
notes: With compression delta = 100, expected centroid count is ~5 * delta = 500 — under 16 KiB of state regardless of stream length. Relative error on tail quantiles is roughly 1 / delta.

## pitfalls
- Skipping the periodic compress step lets centroid count grow linearly with N, defeating the whole point.
- Using arithmetic mean for the within-centroid quantile interpolation when the underlying distribution is skewed — linear interpolation is the standard convention.
- Merging digests built with different scale functions or different delta values without re-normalising.
- Forgetting that the first and last centroid behave specially — they should never be merged with their neighbours so the absolute min and max remain exact.
- Using t-digest for very small N (< delta): just sort, the digest brings no benefit.

## interviewTips
- Frame as "the streaming analogue of computing percentiles from a sorted list, with bounded extra memory."
- Be ready to compare with the two-heap median, GK sketch, and q-digest — t-digest wins on tail accuracy and parallelism.
- Mention the scale function as the central design knob: k1(q) = (delta / 2*pi) * arcsin(2q - 1) is the canonical choice.
- Real users: Datadog, Elastic, AWS CloudWatch's percentile metrics, the JVM's HdrHistogram for absolute counts.

## code.python
```python
import bisect

class TDigest:
    def __init__(self, delta=100):
        self.delta = delta
        self.centroids = []
        self.total_weight = 0

    def _k(self, q):
        return self.delta * (q + 0.5) if q < 0.5 else self.delta * (1 - 0.5 * (1 - q))

    def add(self, x, w=1):
        self.total_weight += w
        if not self.centroids:
            self.centroids.append([x, w])
            return
        i = bisect.bisect_left(self.centroids, [x])
        cumulative = sum(c[1] for c in self.centroids[:i])
        q = cumulative / self.total_weight
        cap = 4 * self.total_weight * q * (1 - q) / self.delta
        if i < len(self.centroids) and self.centroids[i][1] + w <= cap:
            c = self.centroids[i]
            c[0] = (c[0] * c[1] + x * w) / (c[1] + w)
            c[1] += w
        else:
            self.centroids.insert(i, [x, w])

    def quantile(self, q):
        if not self.centroids:
            return float("nan")
        target = q * self.total_weight
        cumulative = 0
        for c in self.centroids:
            if cumulative + c[1] >= target:
                return c[0]
            cumulative += c[1]
        return self.centroids[-1][0]
```

## code.javascript
```javascript
class TDigest {
  constructor(delta = 100) {
    this.delta = delta;
    this.centroids = [];
    this.totalWeight = 0;
  }
  add(x, w = 1) {
    this.totalWeight += w;
    let i = 0;
    while (i < this.centroids.length && this.centroids[i].mean < x) i++;
    const cumulative = this.centroids.slice(0, i).reduce((s, c) => s + c.weight, 0);
    const q = this.totalWeight === 0 ? 0 : cumulative / this.totalWeight;
    const cap = (4 * this.totalWeight * q * (1 - q)) / this.delta;
    if (i < this.centroids.length && this.centroids[i].weight + w <= cap) {
      const c = this.centroids[i];
      c.mean = (c.mean * c.weight + x * w) / (c.weight + w);
      c.weight += w;
    } else {
      this.centroids.splice(i, 0, { mean: x, weight: w });
    }
  }
  quantile(q) {
    if (this.centroids.length === 0) return NaN;
    const target = q * this.totalWeight;
    let cumulative = 0;
    for (const c of this.centroids) {
      if (cumulative + c.weight >= target) return c.mean;
      cumulative += c.weight;
    }
    return this.centroids[this.centroids.length - 1].mean;
  }
}
```

## code.java
```java
import java.util.ArrayList;
import java.util.List;

public class TDigest {
    static class Centroid { double mean; double weight; Centroid(double m, double w){mean=m;weight=w;} }

    private final double delta;
    private final List<Centroid> centroids = new ArrayList<>();
    private double totalWeight = 0;

    public TDigest(double delta) { this.delta = delta; }

    public void add(double x, double w) {
        totalWeight += w;
        int i = 0;
        while (i < centroids.size() && centroids.get(i).mean < x) i++;
        double cumulative = 0;
        for (int k = 0; k < i; k++) cumulative += centroids.get(k).weight;
        double q = totalWeight == 0 ? 0 : cumulative / totalWeight;
        double cap = 4 * totalWeight * q * (1 - q) / delta;
        if (i < centroids.size() && centroids.get(i).weight + w <= cap) {
            Centroid c = centroids.get(i);
            c.mean = (c.mean * c.weight + x * w) / (c.weight + w);
            c.weight += w;
        } else {
            centroids.add(i, new Centroid(x, w));
        }
    }

    public double quantile(double q) {
        if (centroids.isEmpty()) return Double.NaN;
        double target = q * totalWeight;
        double cumulative = 0;
        for (Centroid c : centroids) {
            if (cumulative + c.weight >= target) return c.mean;
            cumulative += c.weight;
        }
        return centroids.get(centroids.size() - 1).mean;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <cmath>
#include <algorithm>

struct TDigest {
    double delta;
    struct Centroid { double mean, weight; };
    std::vector<Centroid> centroids;
    double totalWeight = 0;

    TDigest(double d) : delta(d) {}

    void add(double x, double w = 1) {
        totalWeight += w;
        auto it = std::lower_bound(centroids.begin(), centroids.end(), x,
            [](const Centroid& c, double v){ return c.mean < v; });
        double cumulative = 0;
        for (auto j = centroids.begin(); j != it; ++j) cumulative += j->weight;
        double q = totalWeight == 0 ? 0 : cumulative / totalWeight;
        double cap = 4 * totalWeight * q * (1 - q) / delta;
        if (it != centroids.end() && it->weight + w <= cap) {
            it->mean = (it->mean * it->weight + x * w) / (it->weight + w);
            it->weight += w;
        } else {
            centroids.insert(it, {x, w});
        }
    }

    double quantile(double q) const {
        if (centroids.empty()) return NAN;
        double target = q * totalWeight;
        double cumulative = 0;
        for (const auto& c : centroids) {
            if (cumulative + c.weight >= target) return c.mean;
            cumulative += c.weight;
        }
        return centroids.back().mean;
    }
};
```
