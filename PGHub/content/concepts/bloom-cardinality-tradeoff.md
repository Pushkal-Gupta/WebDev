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

## visualization
Plot false-positive rate p versus k for fixed m and n: a U-curve. Bottom of the curve at k* = (m/n) * ln 2. With m/n = 10, k* ≈ 7 and p ≈ 0.008. Drop k to 1 and p jumps to ~0.10. Push k to 20 and p climbs back up because every insert flips so many bits that the array saturates.

## bruteForce
A hash set: insert keys, look up keys, zero false-positives. Brute force fails on cache-cardinality scale — a hash set of 1 billion 32-byte keys needs 32+ GB just for the keys. A Bloom filter with the same 1 billion keys at 10 bits/element fits in 1.25 GB and gives a 1% false-positive rate. For workloads where false-positives are cheap (one extra disk lookup) and memory is precious, the Bloom filter dominates.

## optimal
Pick the false-positive rate p first based on the cost ratio — what is the wasted-work cost of a false-positive versus the saved-work of a true-negative? Then compute m and k from closed-form. Optimal m = -(n * ln p) / (ln 2)^2 bits. Optimal k = (m/n) * ln 2, rounded to the nearest integer. For p = 0.01 and n = 1M, m ≈ 9.6M bits (~1.2 MB), k = 7. For p = 0.001, m ≈ 14.4M bits, k = 10. Doubling memory roughly squares the false-positive rate down.

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
