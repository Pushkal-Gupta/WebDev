---
slug: hyperloglog
module: hashing
title: HyperLogLog
subtitle: Estimate the cardinality of a multiset in O(1) memory with ~1% relative error.
difficulty: Advanced
position: 16
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "HyperLogLog and MinHash — CP-Algorithms"
    url: "https://cp-algorithms.com/string/string-hashing.html"
    type: blog
  - title: "Count Distinct Elements in a Stream — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/count-distinct-elements-in-a-stream/"
    type: blog
  - title: "redis/redis — hyperloglog.c"
    url: "https://github.com/redis/redis/blob/unstable/src/hyperloglog.c"
    type: repo
status: published
---

## intro
HyperLogLog (HLL) answers "how many distinct items did I see?" using a few kilobytes of memory regardless of stream size. Redis's PFCOUNT, BigQuery's APPROX_COUNT_DISTINCT, and Presto's approx_distinct are all HLLs. The trade is exactness for memory: typical implementations use 12 KiB and return within 0.81% of the true cardinality.

## whyItMatters
Exact counts of unique users, IPs, or queries require a set whose memory grows linearly with the cardinality — billions of uniques means gigabytes of RAM. HLL replaces the set with a fixed-size array of small registers and recovers a cardinality estimate by exploiting the statistics of leading-zero runs in hashed values. The same registers can be merged across shards, making HLL a natural fit for distributed aggregation.

## intuition
Hash each item to a uniform bit string. The probability that a random hash starts with k zero bits is 1/2^(k+1), so observing a hash with many leading zeros suggests you have seen many items. The single longest run is noisy, so HLL partitions the stream into m buckets by the first log2(m) bits and stores the longest zero-run per bucket. A bias-corrected harmonic mean across buckets sharpens the estimate.

## visualization
Picture m = 16 registers, each initialized to 0. For a hashed item with prefix bits 0110 (bucket 6) and remaining bits 00010..., the leading-zero count in the suffix is 3, so register[6] = max(register[6], 3). After streaming millions of items, the register array might look like [4, 5, 3, 6, 4, 5, 3, 7, 4, 5, 4, 6, 5, 4, 5, 6]; the harmonic-mean formula maps this pattern back to an estimated cardinality.

## bruteForce
Maintain a hash set of every distinct item. For a stream of n items with u uniques, this costs O(u) memory and O(1) average insert. It is exact, but a billion-unique stream costs gigabytes. Approximate alternatives like Linear Counting use a bit array sized to the upper bound and underperform HLL for large cardinalities.

## optimal
Pick m = 2^p registers (typical p = 14, so m = 16384). For each item: hash to 64 bits, take the first p bits as the bucket index j, count the leading zeros in the remaining bits plus one as rho, and update register[j] = max(register[j], rho). Estimate cardinality as alpha_m * m^2 / sum(2^(-register[j])) where alpha_m is a constant ~0.7213. Apply small-range correction (linear counting on empty registers) below 2.5m and large-range correction near 2^32. Merging two HLLs is element-wise max of registers — perfectly distributable.

## complexity
time: O(1) per insert, O(m) for estimate
space: O(m * log log u) bits where u is the maximum trackable cardinality
notes: With m = 16384 and 6-bit registers, total state is 12 KiB. Standard error is 1.04 / sqrt(m), so p = 14 gives ~0.81%. Doubling m halves the error but doubles the memory.

## pitfalls
- Using a weak hash (e.g., string hashCode) breaks the uniformity assumption and skews bucket usage; use MurmurHash3 or xxHash.
- Forgetting bias correction at low cardinalities returns wildly wrong numbers for streams of a few hundred items.
- Reusing the same register array for two semantically different streams instead of allocating one HLL per stream.
- Reporting the estimate as exact in a UI — always show "approximately" or a confidence interval.
- Merging HLLs with different p values is undefined; downsample to the smaller p before union.

## interviewTips
- Lead with the trade-off: "Set is O(u) memory; HLL is O(1) at the cost of ~1% relative error."
- Name a real-world deployment: Redis PFCOUNT, Google's PowerDrill, Facebook Presto.
- Be ready to derive why P(leading zeros >= k) = 2^(-k) — it is the only piece of probability in the answer.
- Mention that union is element-wise max, which is what makes HLL the standard distributed-cardinality primitive.

## code.python
```python
import hashlib

class HyperLogLog:
    def __init__(self, p=14):
        self.p = p
        self.m = 1 << p
        self.registers = [0] * self.m
        self.alpha = 0.7213 / (1 + 1.079 / self.m)

    def _hash(self, item):
        h = hashlib.sha1(str(item).encode()).digest()
        return int.from_bytes(h[:8], "big")

    def add(self, item):
        x = self._hash(item)
        j = x >> (64 - self.p)
        w = (x << self.p) & ((1 << 64) - 1) | (1 << (self.p - 1))
        rho = 64 - w.bit_length() + 1
        if rho > self.registers[j]:
            self.registers[j] = rho

    def count(self):
        z = sum(2.0 ** -r for r in self.registers)
        e = self.alpha * self.m * self.m / z
        if e <= 2.5 * self.m:
            v = self.registers.count(0)
            if v:
                e = self.m * (self.m / v).bit_length()
        return int(e)
```

## code.javascript
```javascript
function fnv1a64(str) {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < str.length; i++) {
    h ^= BigInt(str.charCodeAt(i));
    h = (h * prime) & 0xffffffffffffffffn;
  }
  return h;
}

class HyperLogLog {
  constructor(p = 14) {
    this.p = p;
    this.m = 1 << p;
    this.registers = new Uint8Array(this.m);
    this.alpha = 0.7213 / (1 + 1.079 / this.m);
  }
  add(item) {
    const x = fnv1a64(String(item));
    const j = Number(x >> BigInt(64 - this.p));
    const w = (x << BigInt(this.p)) & 0xffffffffffffffffn;
    let rho = 1;
    let mask = 1n << 63n;
    while ((w & mask) === 0n && rho <= 64 - this.p) { rho++; mask >>= 1n; }
    if (rho > this.registers[j]) this.registers[j] = rho;
  }
  count() {
    let z = 0;
    for (const r of this.registers) z += Math.pow(2, -r);
    let e = (this.alpha * this.m * this.m) / z;
    if (e <= 2.5 * this.m) {
      const v = this.registers.filter((r) => r === 0).length;
      if (v) e = this.m * Math.log(this.m / v);
    }
    return Math.round(e);
  }
}
```

## code.java
```java
public class HyperLogLog {
    private final int p, m;
    private final byte[] registers;
    private final double alpha;

    public HyperLogLog(int p) {
        this.p = p;
        this.m = 1 << p;
        this.registers = new byte[m];
        this.alpha = 0.7213 / (1 + 1.079 / m);
    }

    public void add(Object item) {
        long x = mix64(item.hashCode());
        int j = (int) (x >>> (64 - p));
        long w = (x << p) | (1L << (p - 1));
        int rho = Long.numberOfLeadingZeros(w) + 1;
        if (rho > registers[j]) registers[j] = (byte) rho;
    }

    public long count() {
        double z = 0;
        for (byte r : registers) z += Math.pow(2, -r);
        double e = alpha * m * m / z;
        if (e <= 2.5 * m) {
            int v = 0;
            for (byte r : registers) if (r == 0) v++;
            if (v != 0) e = m * Math.log((double) m / v);
        }
        return Math.round(e);
    }

    private long mix64(long z) {
        z = (z ^ (z >>> 33)) * 0xff51afd7ed558ccdL;
        z = (z ^ (z >>> 33)) * 0xc4ceb9fe1a85ec53L;
        return z ^ (z >>> 33);
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <cmath>
#include <cstdint>
#include <string>

struct HyperLogLog {
    int p, m;
    std::vector<uint8_t> registers;
    double alpha;

    HyperLogLog(int p_ = 14) : p(p_), m(1 << p_), registers(1 << p_, 0) {
        alpha = 0.7213 / (1.0 + 1.079 / m);
    }

    uint64_t mix(uint64_t x) const {
        x ^= x >> 33; x *= 0xff51afd7ed558ccdULL;
        x ^= x >> 33; x *= 0xc4ceb9fe1a85ec53ULL;
        x ^= x >> 33; return x;
    }

    void add(uint64_t key) {
        uint64_t x = mix(key);
        int j = x >> (64 - p);
        uint64_t w = (x << p) | (1ULL << (p - 1));
        int rho = __builtin_clzll(w) + 1;
        if (rho > registers[j]) registers[j] = rho;
    }

    long long count() const {
        double z = 0;
        for (auto r : registers) z += std::pow(2.0, -r);
        double e = alpha * m * m / z;
        if (e <= 2.5 * m) {
            int v = 0;
            for (auto r : registers) if (r == 0) v++;
            if (v) e = m * std::log((double) m / v);
        }
        return (long long) (e + 0.5);
    }
};
```
