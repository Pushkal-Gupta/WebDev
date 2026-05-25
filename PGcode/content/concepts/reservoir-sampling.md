---
slug: reservoir-sampling
module: math-geom-sampling
title: Reservoir Sampling
subtitle: Pick k uniformly random items from a stream of unknown length in O(n) time and O(k) space.
difficulty: Advanced
position: 12
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Knuth — The Art of Computer Programming, Vol 2 (TAOCP companion site)"
    url: "https://www-cs-faculty.stanford.edu/~knuth/taocp.html"
    type: book
  - title: "GeeksforGeeks — Reservoir Sampling"
    url: "https://www.geeksforgeeks.org/reservoir-sampling/"
    type: blog
  - title: "TheAlgorithms/Python — other algorithms"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
You receive items one at a time. You don't know how many will come. When the stream ends, you must hand back a uniformly random sample of k items. Reservoir sampling solves this in one pass — keep a "reservoir" of the first k items, then for each subsequent item probabilistically swap it in.

## whyItMatters
Picking random items is trivial when the data fits in memory. The interesting cases are streams, distributed logs, and infinite generators where you cannot store everything. Reservoir sampling is how Twitter computes random samples of tweets for ML training, how monitoring systems sample a fraction of traces, and how SQL `TABLESAMPLE` works under the hood.

## intuition
For k = 1 ("pick one random item from a stream"):
- Store the first item.
- For item i (1-indexed, i ≥ 2), replace the stored item with probability 1/i.
- At the end, every item has probability 1/n of being the survivor.

For general k:
- Keep the first k items as the reservoir.
- For item i (1-indexed, i > k), pick a uniform random index in [1, i]. If the index is ≤ k, replace `reservoir[index-1]` with the new item.
- Each item ends up in the reservoir with probability k/n.

The intuition: the new item has a k/i chance of being chosen, and each existing item survives previous "evictions" with the right cumulative probability so the total balances out to k/n.

## visualization
```
k = 3, stream = [A, B, C, D, E, F]

i=1..3:  reservoir = [A, B, C]
i=4:     pick rand(1..4); say 2 → replace[1] → [A, D, C]
i=5:     pick rand(1..5); say 4 (> 3) → no change → [A, D, C]
i=6:     pick rand(1..6); say 1 → replace[0] → [F, D, C]
```

## bruteForce
Store everything, then `random.sample(all, k)`. O(n) space. Fine for in-memory; impossible for streams or huge logs.

## optimal
**Algorithm R (Vitter 1985)** — the canonical version:

```
reservoir ← empty array of size k
for i, item in enumerate(stream, start=1):
    if i <= k:
        reservoir[i-1] = item
    else:
        j = random integer in [1, i]
        if j <= k:
            reservoir[j-1] = item
return reservoir
```

**Algorithm L** — faster variant that skips ahead via geometric distribution. Each iteration computes the index of the next replacement directly, avoiding O(n - k) calls to the RNG. Useful when k ≪ n.

**Weighted reservoir sampling (A-Res / A-ExpJ)**: when each item has a weight `w_i` and you want to pick proportional to weight. Use exponentially distributed keys: `key_i = u_i^(1/w_i)` and keep the top-k by key. The reservoir is replaced whenever a new item's key exceeds the minimum key in the reservoir.

## complexity
- **Time**: O(n) for Algorithm R; O(k(1 + log(n/k))) for Algorithm L.
- **Space**: O(k) — only the reservoir.
- **Randomness**: O(n) calls to RNG for R; O(k log(n/k)) for L.
- **Distribution**: every item appears in the final reservoir with probability k/n.

## pitfalls
- **Off-by-one in random range**: `randint(1, i)` (inclusive) vs `randint(0, i)` (exclusive) — get this wrong and the distribution is biased.
- **Confusing with simple random sampling**: random.sample needs the full input; reservoir works on streams without knowing n.
- **Stream of unknown size + early termination**: if you stop early, the sample isn't uniform over the *full* stream — it's uniform over what you've seen so far.
- **Distributed reservoir**: each shard does its own reservoir, then merge. Naive merge by concatenation is biased; weight by shard sample size and re-sample.
- **Bad RNG**: weak `Math.random()` repeats patterns. For security-sensitive sampling, use a cryptographic RNG.

## interviewTips
- Recognize the trigger: "pick k random items from a stream" or "the data doesn't fit in memory."
- Walk through the k=1 case first — it's the cleanest proof of why the probabilities work out.
- Always state the invariant: "after processing i items, each of the first i items is in the reservoir with probability k/i."
- For senior-level, mention **weighted reservoir sampling** and **distributed reservoir merging**.

## code.python
```python
import random

def reservoir_sample(stream, k):
    reservoir = []
    for i, item in enumerate(stream, start=1):
        if i <= k:
            reservoir.append(item)
        else:
            j = random.randint(1, i)         # 1..i inclusive
            if j <= k:
                reservoir[j - 1] = item
    return reservoir

# Demo: sample 3 from a stream of 1000.
sample = reservoir_sample(range(1000), 3)
print(sample)
```

## code.javascript
```javascript
function reservoirSample(stream, k) {
  const reservoir = [];
  let i = 0;
  for (const item of stream) {
    i++;
    if (i <= k) reservoir.push(item);
    else {
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
class Reservoir {
    static <T> List<T> sample(Iterable<T> stream, int k) {
        List<T> r = new ArrayList<>(k);
        Random rng = new Random();
        int i = 0;
        for (T item : stream) {
            i++;
            if (i <= k) r.add(item);
            else {
                int j = rng.nextInt(i) + 1; // 1..i
                if (j <= k) r.set(j - 1, item);
            }
        }
        return r;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <random>
template<class It>
auto reservoirSample(It begin, It end, int k) {
    using T = typename std::iterator_traits<It>::value_type;
    std::vector<T> r;
    std::mt19937 rng(std::random_device{}());
    int i = 0;
    for (auto it = begin; it != end; ++it) {
        i++;
        if (i <= k) r.push_back(*it);
        else {
            std::uniform_int_distribution<int> d(1, i);
            int j = d(rng);
            if (j <= k) r[j - 1] = *it;
        }
    }
    return r;
}
```
