---
slug: random-reservoir-stream
module: math-geom-sampling
title: Reservoir Sampling for Streams
subtitle: Pick k uniformly random elements from a stream of unknown length in one pass and O(k) memory.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 5: Probabilistic Analysis"
    url: "https://walkccc.me/CLRS/Chap05/5.3/"
    type: book
  - title: "Reservoir Sampling — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/reservoir-sampling/"
    type: blog
  - title: "TheAlgorithms/Python — reservoir sampling"
    url: "https://github.com/TheAlgorithms/Python/tree/master/maths"
    type: repo
status: published
---

## intro
You are fed a stream of items one at a time. The stream's total length n is unknown — it could be a thousand or a billion. You can only see each item once and want to keep exactly k of them, chosen so that every possible k-subset of the eventual stream is equally likely. Reservoir sampling is the textbook one-pass O(k) memory solution.

## whyItMatters
- Cloudflare's Logpush and Datadog's log sampling pipelines retain k uniformly random log lines per second from billions of incoming events using reservoir sampling — bounded memory is non-negotiable at fire-hose volume.
- Apache Spark's `RDD.sample` and Flink's reservoir-sampling operator implement Vitter's Algorithm R for unbiased stream subsets in distributed pipelines.
- A/B test fairness audits at Meta and Google use reservoir sampling to pull uniformly random session traces from unbounded event streams without ever loading the full population.
- Networking: Cisco's NetFlow and IPFIX (RFC 5476) sample packet flows with reservoir-style techniques for traffic-analysis exports.
- The naive "load into memory and shuffle" approach fails for terabyte logs or unbounded sources; reservoir sampling delivers provable uniformity in one pass, O(k) memory, and O(1) work per element.

## intuition
The challenge is producing a uniform random subset from a stream whose total length n is unknown — you cannot allocate a buffer of size n, and you cannot revisit past items. The brilliance of reservoir sampling is that it commits to a k-slot reservoir and updates it in place, maintaining the invariant that at every moment, the current reservoir is a uniform random k-subset of the elements seen so far. Initially fill the reservoir with the first k items deterministically; that trivially satisfies the invariant. For each subsequent item at position i (1-indexed), draw a uniform random integer j in [1, i]. If j is in [1, k], overwrite reservoir slot j-1 with the new item; otherwise discard it. The probability the new item enters is exactly k/i, and the probability any specific old item leaves is `(k/i) * (1/k) = 1/i`. By induction, after step i every item from the prefix of length i is in the reservoir with probability k/i — uniformity preserved. The proof telescopes cleanly: an item placed at step j survives all later steps with probability `(j / (j+1)) * ((j+1) / (j+2)) * ... * ((n-1) / n) = j/n`, and multiplied by the k/j chance of being picked at step j gives k/n. So after the stream finishes, every item has equal probability k/n of being in the reservoir — uniformity over k-subsets achieved. The deep insight is that uniform sampling over an unknown-size population is possible via a constant-memory probabilistic invariant: you cannot remember the past, but you can carry forward a distribution that mathematically represents it.

## visualization
k=2, stream = [A, B, C, D, E]. Reservoir starts [A, B]. i=3 (C): random in [1,3] = 2 -> replace slot 2 -> [A, C]. i=4 (D): random in [1,4] = 3 -> >2, discard. i=5 (E): random in [1,5] = 1 -> replace slot 1 -> [E, C]. Final reservoir is uniformly random over all 2-subsets of the 5 inputs.

## bruteForce
Buffer the whole stream, then run Fisher-Yates and take the first k. Works for small finite streams; impossible for terabyte logs or unbounded sources. A variant — assign each item a uniform random key and keep a heap of the k smallest keys — works in O(n log k) time and O(k) memory, but does an extra log factor of work per item.

## optimal
Vitter's Algorithm R (1985): fill the reservoir deterministically with the first k items; for each subsequent item at position i (i > k), draw j uniformly in [1, i] and overwrite reservoir[j-1] if j <= k. One random draw and one comparison per stream element. Time is O(n) total and O(1) amortized per item; space is O(k). This is optimal in expected work because every element must be inspected at least once to know it might be sampled. For extreme throughput, Algorithm L skips ahead geometrically — most discarded items consume zero random draws — bringing per-item cost to O(k(1 + log(n/k))) expected over n elements.

```python
import random

def reservoir_sample(stream, k):
    """Vitter Algorithm R: uniform k-subset of an unknown-length stream."""
    reservoir = []
    for i, item in enumerate(stream, start=1):
        if i <= k:
            reservoir.append(item)              # fill phase: take first k deterministically
        else:
            j = random.randint(1, i)            # uniform on [1, i] inclusive
            if j <= k:
                reservoir[j - 1] = item         # accept with prob k/i, replace random slot
    return reservoir
```

The `random.randint(1, i)` line is the load-bearing detail — the range must include i so the rejection probability is exactly `1 - k/i`. The deterministic fill phase for the first k items is required; skipping it and starting the probabilistic phase immediately would underweight early items. For weighted streams, switch to the Efraimidis-Spirakis A-Res algorithm: assign each item key `u^(1/w)` with `u` uniform in (0, 1) and keep the top-k keys in a min-heap. The same uniformity proof generalizes with the weight-modified probability.

## complexity
time: O(n) total, O(1) per item (Algorithm R); Algorithm L is O(k(1 + log(n/k))) expected.
space: O(k) — only the reservoir.
notes: For weighted streams use Algorithm A-Res (Efraimidis-Spirakis): assign each item key `u^(1/w)` with `u` uniform in (0,1) and keep the top-k keys in a min-heap.

## pitfalls
- Forgetting to fill the reservoir with the first k items deterministically — the algorithm requires it.
- Off-by-one in the random range: `random in [0, i)` vs `[1, i]` — be consistent with your indexing.
- Using a low-quality PRNG seeded with wall-clock seconds — neighbouring runs sample the same items.
- Treating reservoir sampling as "without replacement from a fixed array" — it is uniform over the final stream length, but each item's inclusion is decided at its arrival time.
- Running multiple independent reservoirs without independent PRNG state — correlated samples.

## interviewTips
- Be ready to prove the uniformity by induction on stream length — interviewers love it.
- Mention Algorithm L and its geometric skip — shows you have read past the basic version.
- For weighted variants, name-drop Efraimidis-Spirakis (A-Res).

## code.python
```python
import random

def reservoir_sample(stream, k: int):
    reservoir = []
    for i, item in enumerate(stream, start=1):
        if i <= k:
            reservoir.append(item)
        else:
            j = random.randint(1, i)
            if j <= k:
                reservoir[j - 1] = item
    return reservoir
```

## code.javascript
```javascript
export function reservoirSample(stream, k) {
  const reservoir = [];
  let i = 0;
  for (const item of stream) {
    i++;
    if (i <= k) {
      reservoir.push(item);
    } else {
      const j = Math.floor(Math.random() * i) + 1;
      if (j <= k) reservoir[j - 1] = item;
    }
  }
  return reservoir;
}
```

## code.java
```java
import java.util.*;

public class Reservoir {
    private static final Random RNG = new Random();
    public static <T> List<T> sample(Iterable<T> stream, int k) {
        List<T> reservoir = new ArrayList<>(k);
        int i = 0;
        for (T item : stream) {
            i++;
            if (i <= k) {
                reservoir.add(item);
            } else {
                int j = RNG.nextInt(i) + 1;
                if (j <= k) reservoir.set(j - 1, item);
            }
        }
        return reservoir;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <random>

template <typename T>
std::vector<T> reservoirSample(const std::vector<T>& stream, int k) {
    static std::mt19937 rng(std::random_device{}());
    std::vector<T> reservoir;
    reservoir.reserve(k);
    int i = 0;
    for (const auto& item : stream) {
        ++i;
        if (static_cast<int>(reservoir.size()) < k) {
            reservoir.push_back(item);
        } else {
            std::uniform_int_distribution<int> dist(1, i);
            int j = dist(rng);
            if (j <= k) reservoir[j - 1] = item;
        }
    }
    return reservoir;
}
```
