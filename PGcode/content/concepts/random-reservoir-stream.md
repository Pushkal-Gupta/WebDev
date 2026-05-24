---
slug: random-reservoir-stream
module: math
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
Stream sampling powers log sampling at scale (keep k random log lines per second from a fire hose), A/B test fairness audits, large-file random subset extraction without loading the file, and Spark/Flink sample operators. The naïve "read into memory and shuffle" approach is impossible when n is unbounded.

## intuition
Imagine k slots. Fill them with the first k items. For each subsequent item at position i (1-indexed, i > k), flip a biased coin: with probability k/i, the new item replaces a randomly chosen slot; otherwise discard it. After processing n items, every item — first, middle, or last — sits in the reservoir with probability k/n. The math falls out of telescoping: an item placed at step j survives every later step with probability (j/(j+1)) · ((j+1)/(j+2)) · ... · ((n-1)/n) = j/n, multiplied by k/j chance of being picked at step j gives k/n.

## visualization
k=2, stream = [A, B, C, D, E]. Reservoir starts [A, B]. i=3 (C): random in [1,3] = 2 -> replace slot 2 -> [A, C]. i=4 (D): random in [1,4] = 3 -> >2, discard. i=5 (E): random in [1,5] = 1 -> replace slot 1 -> [E, C]. Final reservoir is uniformly random over all 2-subsets of the 5 inputs.

## bruteForce
Buffer the whole stream, then run Fisher-Yates and take the first k. Works for small finite streams; impossible for terabyte logs or unbounded sources. A variant — assign each item a uniform random key and keep a heap of the k smallest keys — works in O(n log k) time and O(k) memory, but does an extra log factor of work per item.

## optimal
Algorithm R (Vitter, 1985): keep the first k items; for the i-th item (i > k), generate `j` uniform in `[1, i]`, and if `j <= k` overwrite reservoir[j-1] with the new item. This is one random number and one comparison per stream element — optimal in expected work. For extremely high throughput, Algorithm L skips ahead geometrically so most items can be discarded with no random number at all.

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
