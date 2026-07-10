---
slug: bloom-cardinality-tradeoff
module: hashing
title: Bloom Filter Cardinality Trade-off
subtitle: Tune bits-per-element (m/n) and hash-count (k) for a target false-positive rate.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Hash Tables and Filters"
    url: "https://algs4.cs.princeton.edu/34hash/"
    type: book
  - title: "Bloom Filters — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/bloom-filters-introduction-and-implementation/"
    type: blog
  - title: "TheAlgorithms/Python — bloom_filter.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/hashing/bloom_filter.py"
    type: repo
status: published
---

## intro
A Bloom filter answers "have I seen this key?" with two possible replies: *definitely not* or *probably yes*. The "probably" carries a false-positive probability that you choose at construction time by setting three numbers: the bit-array size m, the number of hash functions k, and the expected number of elements n. Pick them wrong and you either waste memory or get unusable false-positive rates.

## whyItMatters
Bloom filters are everywhere in modern systems — Cassandra and LevelDB use them to skip disk reads, web caches use them to detect uncacheable URLs, Chrome used one for malicious-URL detection. In each case the win is a 10-20x reduction in expensive lookups *if* you tune the filter to match your actual cardinality. Over-provisioned filters waste RAM at scale; under-provisioned filters degenerate to "always probably yes," which means you pay every disk read anyway.

## intuition
Think of m as the size of an empty hotel and n as the number of guests who will arrive. Each guest hashes to k rooms and flips a sign on each door. Looking up a name: hash to k rooms, check if all k signs are flipped. If too few rooms exist relative to guests (m too small), every door is flipped and lookups always say "probably yes." If too many rooms exist (m huge), you waste empty wings. The sweet spot is m/n around 10 bits per element for a 1% false-positive rate.

What's actually happening is a race between two forces. Every insert flips k bits toward 1, so the array fills up as n grows. A false positive happens only when an *unseen* key hashes to k positions that some *other* keys already flipped — the more crowded the array, the more likely that collision. So the false-positive rate is entirely governed by the *fraction of bits set*, which depends on m, k, and n together, not on any single one.

Walk a concrete micro-example with real numbers. Take m = 20 bits, k = 3, and insert two keys. Key "cat" hashes to positions {2, 9, 14}; key "dog" hashes to {5, 9, 17}. After both inserts, exactly 5 distinct bits are set (position 9 was shared), so 5/20 = 25% of the array is 1. Now query "fox," which hashes to {2, 17, 11}: bit 11 is still 0, so we return *definitely not* — correct. But query "owl" hashing to {2, 9, 5}: all three were flipped by cat and dog, so we return *probably yes* even though owl was never inserted. That is a false positive, and it arose purely because the array was crowded enough that three unrelated positions all happened to be lit.

Now scale that up. With the optimal k, roughly half the bits end up set at the design load, and the false-positive probability is approximately \((1/2)^k\). At k = 7 that is \((0.5)^7 \approx 0.008\), matching the 1% target for m/n = 10. Pick m/n too small and the "half set" becomes "nearly all set," collapsing every lookup into a yes.

## visualization
Plot false-positive rate p versus k for fixed m and n: a U-curve. Bottom of the curve at k* = (m/n) * ln 2. With m/n = 10, k* ≈ 7 and p ≈ 0.008. Drop k to 1 and p jumps to ~0.10. Push k to 20 and p climbs back up because every insert flips so many bits that the array saturates.

The table below fixes m/n = 10 bits per element and sweeps k, showing the fraction of bits set at the design load and the resulting false-positive rate. Note the U-shape: p bottoms out near k = 7, then climbs as extra hashes over-saturate the array.

```
 k  | fill fraction | approx p    | verdict
----+---------------+-------------+---------------------
  1 |     0.095     |   0.095     | too few hashes
  2 |     0.181     |   0.033     | improving
  3 |     0.259     |   0.017     | improving
  5 |     0.394     |   0.009     | near-optimal
  7 |     0.503     |   0.008     | optimal  k* = 7
 10 |     0.632     |   0.012     | over-hashed
 14 |     0.753     |   0.024     | saturating
 20 |     0.865     |   0.061     | array too full
```

## bruteForce
A hash set: insert keys, look up keys, zero false-positives. Brute force fails on cache-cardinality scale — a hash set of 1 billion 32-byte keys needs 32+ GB just for the keys. A Bloom filter with the same 1 billion keys at 10 bits/element fits in 1.25 GB and gives a 1% false-positive rate. For workloads where false-positives are cheap (one extra disk lookup) and memory is precious, the Bloom filter dominates.

## optimal
Pick the false-positive rate p first based on the cost ratio — what is the wasted-work cost of a false-positive versus the saved-work of a true-negative? Then compute m and k from closed-form. Optimal m = -(n * ln p) / (ln 2)^2 bits. Optimal k = (m/n) * ln 2, rounded to the nearest integer. For p = 0.01 and n = 1M, m ≈ 9.6M bits (~1.2 MB), k = 7. For p = 0.001, m ≈ 14.4M bits, k = 10. Doubling memory roughly squares the false-positive rate down.

Where do these formulas come from? After inserting n keys with k hashes into m bits, the probability a given bit is still 0 is \((1 - 1/m)^{kn} \approx e^{-kn/m}\). A false positive requires all k queried bits to be 1, giving \(p \approx (1 - e^{-kn/m})^k\). Minimizing that over k yields the optimal \(k^* = (m/n)\ln 2\), and substituting back gives \(p = (1/2)^{k^*}\) — which is exactly why the closed-form m falls out of \(m = -(n\ln p)/(\ln 2)^2\). The key invariant is that at optimal k, exactly half the bits are set: this is the balance point where adding another hash helps discrimination as much as it hurts by crowding.

Operationally the sizing runs in four steps. (1) Fix p from the cost ratio. (2) Compute m from n and p. (3) Compute k and round to an integer — the U-curve is flat near the bottom, so k = 7 vs 8 barely matters. (4) Allocate the bit array and derive all k indices from two base hashes via Kirsch-Mitzenmacher, so lookups stay cheap.

The tradeoff to internalize: the marginal cost of driving p down is logarithmic in memory. Each additional bit-per-element multiplies p by roughly \(0.6185\), so going from p = 0.01 (9.6 bits) to p = 0.001 (14.4 bits) costs only ~50% more space for a 10x better rate. Memory is generous here; only n growth beyond the design point is punishing, because it pushes the fill fraction past 0.5 and p degrades quadratically.

## complexity
time: O(k) per insert and per lookup.
space: O(m) bits = O(n * log(1/p)) for the optimal sizing.
notes: All k hashes can be derived from two independent hashes h1 and h2 via the Kirsch-Mitzenmacher trick: g_i(x) = h1(x) + i * h2(x). This drops k actual hash computations to two without measurably changing the false-positive rate.

## pitfalls
- Sizing for current n but not for expected growth — once n exceeds the design point, p degrades quadratically. Plan for 2-4x headroom or use a scalable Bloom filter.
- Using the same Bloom filter for delete and re-insert — standard Bloom filters do not support deletion. Use a counting Bloom filter (k counters instead of k bits) at 4x the space cost.
- Treating false-positives as "rare" without measurement — measure actual rate in production; if your hashes are not independent the analytic formula understates p.
- Confusing the saturation point: when ~50% of bits are set, the filter is at its sweet spot, not "too full." Past 75% set, false-positive rate is past the design target.

## interviewTips
- Memorize the formula: optimal k = (m/n) * ln 2 ≈ 0.693 * (m/n).
- Be ready to size: "For 1M items at 1% false-positive, I need 1.2 MB and 7 hashes."
- Mention adjacent structures: counting Bloom (supports delete), scalable Bloom (auto-grows), cuckoo filter (supports delete + lower fp at comparable space).

## code.python
```python
import math
from bitarray import bitarray
import hashlib

class BloomFilter:
    def __init__(self, n, p):
        self.m = max(1, int(-(n * math.log(p)) / (math.log(2) ** 2)))
        self.k = max(1, int((self.m / n) * math.log(2)))
        self.bits = bitarray(self.m)
        self.bits.setall(False)

    def _hashes(self, key):
        b = key.encode() if isinstance(key, str) else key
        h1 = int(hashlib.md5(b).hexdigest(), 16)
        h2 = int(hashlib.sha1(b).hexdigest(), 16)
        for i in range(self.k):
            yield (h1 + i * h2) % self.m

    def add(self, key):
        for idx in self._hashes(key):
            self.bits[idx] = True

    def __contains__(self, key):
        return all(self.bits[idx] for idx in self._hashes(key))
```

## code.javascript
```javascript
class BloomFilter {
  constructor(n, p) {
    this.m = Math.max(1, Math.ceil(-(n * Math.log(p)) / Math.log(2) ** 2));
    this.k = Math.max(1, Math.round((this.m / n) * Math.log(2)));
    this.bits = new Uint8Array(Math.ceil(this.m / 8));
  }
  *hashes(key) {
    let h1 = 2166136261, h2 = 0;
    for (const ch of key) {
      h1 = Math.imul(h1 ^ ch.charCodeAt(0), 16777619) >>> 0;
      h2 = (h2 * 31 + ch.charCodeAt(0)) >>> 0;
    }
    for (let i = 0; i < this.k; i++) yield (h1 + i * h2) % this.m;
  }
  add(key) {
    for (const idx of this.hashes(key)) this.bits[idx >> 3] |= 1 << (idx & 7);
  }
  has(key) {
    for (const idx of this.hashes(key)) {
      if (!(this.bits[idx >> 3] & (1 << (idx & 7)))) return false;
    }
    return true;
  }
}
```

## code.java
```java
public class BloomFilter {
    private final int m, k;
    private final java.util.BitSet bits;

    public BloomFilter(int n, double p) {
        this.m = Math.max(1, (int) Math.ceil(-(n * Math.log(p)) / (Math.log(2) * Math.log(2))));
        this.k = Math.max(1, (int) Math.round((double) m / n * Math.log(2)));
        this.bits = new java.util.BitSet(m);
    }

    private int[] hashes(String key) {
        int h1 = key.hashCode();
        int h2 = Integer.reverse(h1) ^ 0x5bd1e995;
        int[] out = new int[k];
        for (int i = 0; i < k; i++) out[i] = Math.floorMod(h1 + i * h2, m);
        return out;
    }

    public void add(String key) {
        for (int idx : hashes(key)) bits.set(idx);
    }

    public boolean contains(String key) {
        for (int idx : hashes(key)) if (!bits.get(idx)) return false;
        return true;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <cmath>
#include <functional>
#include <string>

class BloomFilter {
    size_t m;
    int k;
    std::vector<bool> bits;
public:
    BloomFilter(size_t n, double p) {
        m = std::max<size_t>(1, std::ceil(-(double)n * std::log(p) / (std::log(2) * std::log(2))));
        k = std::max(1, (int)std::round((double)m / n * std::log(2)));
        bits.assign(m, false);
    }
    void add(const std::string& key) {
        size_t h1 = std::hash<std::string>{}(key);
        size_t h2 = std::hash<std::string>{}(key + "salt");
        for (int i = 0; i < k; i++) bits[(h1 + i * h2) % m] = true;
    }
    bool contains(const std::string& key) const {
        size_t h1 = std::hash<std::string>{}(key);
        size_t h2 = std::hash<std::string>{}(key + "salt");
        for (int i = 0; i < k; i++) if (!bits[(h1 + i * h2) % m]) return false;
        return true;
    }
};
```
