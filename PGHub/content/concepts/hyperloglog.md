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
Exact counts of unique users, IPs, or queries require a set whose memory grows linearly with the cardinality — billions of uniques means gigabytes of RAM. Philippe Flajolet's HyperLogLog (2007, *HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm*) replaces the set with a fixed-size array of small registers and recovers a cardinality estimate with around 1% standard error using only 12 KiB. The original paper was followed by Google's HLL++ (Heule, Nunkesser, Hall 2013), which adds bias correction and sparse representations. Redis ships `PFADD`/`PFCOUNT`, BigQuery exposes `HLL_COUNT.MERGE`, Presto/Trino expose `approx_distinct`, Apache Druid uses HLL as its default `cardinality` aggregator, and Snowflake's `APPROX_COUNT_DISTINCT` is HLL underneath.

## intuition
Two facts power the trick. First, a good hash function makes its output indistinguishable from uniform random bits. Second, in a stream of uniform random bit-strings, the maximum number of leading zeros you have seen so far is roughly `log2(n)` where `n` is the number of distinct elements. So if you have seen `k` leading zeros, you can estimate that `n` is around `2^k`.

A single counter from this trick has terrible variance — one unlucky hash with 30 leading zeros would suggest a billion uniques. HyperLogLog cures this with stochastic averaging: use the first `b` bits of each hash to pick one of `m = 2^b` buckets, and store the max-leading-zeros count *within* that bucket. The final estimate is the harmonic mean of `2^{register_i}` across all `m` registers, scaled by a bias constant `alpha_m` and `m^2`. Harmonic mean dampens outliers, the bias constant corrects for small-cardinality undercount, and the `m^2` scaling converts per-bucket estimates into a stream-wide one.

The magic is that each register only needs to hold a small integer (the count of leading zeros, max 64 for a 64-bit hash, so 6 bits is plenty). With `m = 16384` registers at 6 bits each, you get 12 KiB total for any cardinality up to billions, with standard error `1.04 / sqrt(m) ~ 0.81%`. Merging two HLLs is element-wise max across registers — perfect for distributed aggregation.

## visualization
Picture m = 16 registers, each initialized to 0. For a hashed item with prefix bits 0110 (bucket 6) and remaining bits 00010..., the leading-zero count in the suffix is 3, so register[6] = max(register[6], 3). After streaming millions of items, the register array might look like [4, 5, 3, 6, 4, 5, 3, 7, 4, 5, 4, 6, 5, 4, 5, 6]; the harmonic-mean formula maps this pattern back to an estimated cardinality.

## bruteForce
Maintain a hash set of every distinct item. For a stream of n items with u uniques, this costs O(u) memory and O(1) average insert. It is exact, but a billion-unique stream costs gigabytes. Approximate alternatives like Linear Counting use a bit array sized to the upper bound and underperform HLL for large cardinalities.

## optimal
Use a 64-bit hash function (xxHash, MurmurHash3, or Google's FarmHash). For each element, take the first `b` bits to index a register, then count the leading zeros in the remaining bits plus one. Update `register[idx]` to the running max. To estimate cardinality: compute `Z = sum(2^{-register[i]})`, then `E = alpha_m * m^2 / Z`. Apply linear-counting correction for low cardinalities (`E < 5m/2`) and a large-cardinality correction near `2^32` for 32-bit hashes (skip if using 64-bit).

```python
import hashlib

class HLL:
    def __init__(self, b=14):
        self.b, self.m = b, 1 << b
        self.registers = [0] * self.m
        self.alpha = 0.7213 / (1 + 1.079 / self.m)
    def add(self, x):
        h = int.from_bytes(hashlib.sha1(str(x).encode()).digest()[:8], 'big')
        idx = h >> (64 - self.b)
        w = (h << self.b) & ((1 << 64) - 1)
        rho = (w ^ ((1 << 64) - 1)).bit_length()  # leading zeros + 1
        if rho > self.registers[idx]:
            self.registers[idx] = rho
    def estimate(self):
        Z = sum(2 ** -r for r in self.registers)
        return self.alpha * self.m * self.m / Z
    def merge(self, other):
        self.registers = [max(a, b) for a, b in zip(self.registers, other.registers)]
```

The critical line is `if rho > self.registers[idx]` — it makes the algorithm idempotent: adding the same value twice changes nothing because `rho` does not increase. That property is also what makes HLLs mergeable: union is element-wise max, intersection is inclusion-exclusion on cardinalities, and per-shard HLLs aggregate into a global HLL with the same error bound. Google's HLL++ adds two refinements that the production engines all use: a sparse representation that stays exact below `~10^4` uniques (giving 0% error for small streams), and an empirical bias correction table that tightens the estimate near the algorithm's threshold.

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
