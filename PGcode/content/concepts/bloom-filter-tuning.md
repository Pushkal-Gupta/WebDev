---
slug: bloom-filter-tuning
module: sd-storage
title: Bloom Filter Tuning
subtitle: Derive m, k, and the right variant from a memory budget, a target false-positive rate, and an honest growth forecast.
difficulty: Advanced
position: 52
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Bloom filter — Wikipedia (sizing formulas and false-positive analysis)"
    url: "https://en.wikipedia.org/wiki/Bloom_filter"
    type: article
  - title: "Bloom Filter Calculator — Thomas Hurst (interactive m / k / n / p tuner)"
    url: "https://hur.st/bloomfilter/"
    type: tool
  - title: "Bloom Filter — Brilliant.org (k = (m/n) ln 2 derivation)"
    url: "https://brilliant.org/wiki/bloom-filter/"
    type: article
  - title: "Bloom Filters Explained — systemdesign.one (engineering walkthrough)"
    url: "https://systemdesign.one/bloom-filters-explained/"
    type: blog
status: published
---

## intro
A Bloom filter is defined by three numbers — bit-array size m, hash-function count k, and expected insertion count n — but the only one a stakeholder actually cares about is the false-positive rate p they will see in production. Tuning is the job of converting business constraints (memory budget, lookup cost ratio, growth horizon) into m and k that hold p at the target through the lifetime of the filter, not just at the moment it is constructed.

## whyItMatters
A poorly tuned Bloom filter is worse than no filter. Size it too small and FPR climbs past 30 percent within months, every "probably" triggers a real disk read, and you pay both the filter cost and the full lookup cost on every query. Size it too large and a single Cassandra node carries gigabytes of bit array per SSTable, evicting the actual block cache the filter was supposed to shield. Tuning is what separates a 100x read amplification win (RocksDB, Cassandra, Bigtable) from a memory-bloated pre-check that the on-call engineer eventually rips out.

## intuition
Start from the constraint that bites first. If memory is fixed (an embedded device, a cache budget), pin m and derive the FPR you can offer: p ≈ (1 − e^(−kn/m))^k, minimized at k* = (m/n) ln 2. If FPR is fixed (a contractual SLO on extra-work), pin p and derive the cheapest m that delivers it: m = −n ln p / (ln 2)². If growth is the worry, you do not tune for today's n — you tune for the n at which you will rebuild or retire the filter, then divide the lifetime into segments each sized to stay under the budget. The third lever, k, is almost never a free knob; it is a function of m and n. The trap juniors fall into is reading "more hashes lower FPR" and cranking k without changing m, which saturates the array and pushes FPR up. The U-curve of FPR over k bottoms at k* and climbs sharply on both sides; staying at k* is the only stable choice. Tuning is a chain — pick the binding constraint first, derive the second from the formula, accept the third.

## visualization
```
Target p = 1%   →   bits per element ≈ -log2(p) / ln 2 ≈ 9.6   →   k* ≈ 7
Target p = 0.1% →   bits per element ≈ 14.4                   →   k* ≈ 10
Target p = 0.01%→   bits per element ≈ 19.2                   →   k* ≈ 13

m/n  | optimal k | p (actual)
-----+-----------+-----------
 4   |     3     |  ~14.7%
 8   |     6     |   ~2.1%
 10  |     7     |   ~0.8%   <- usual default
 14  |    10     |   ~0.08%
 20  |    14     |   ~0.0046%

FPR vs k at fixed m/n = 10 (U-curve, minimum at k = 7):
 k= 1   3   5   7   9  11  13  15
 p≈ 9.5  1.7 0.94 0.82 0.92 1.16 1.55 2.1   (%)
```

## bruteForce
The naive tune is "pick m by gut, pick k = 7 because the internet says so, hope for the best." It fails because k = 7 is only optimal at m/n ≈ 10. If you bought m/n = 4 (memory pressure) k should drop to 3; if you bought m/n = 20 (high-stakes filter) k should climb to 14. A second naive approach is to size for current n and ignore growth — FPR degrades roughly with (n_actual / n_design)², so 2x growth quadruples the false-positive rate. A third is to use a single classic Bloom for a workload that ever deletes, silently corrupting future lookups every time you forget.

## optimal
The tuning workflow is a four-step pipeline.

**Step 1 — Pick the binding constraint.** Is the SLA on false-positive rate (e.g. "≤ 1% extra disk reads"), on memory (e.g. "≤ 1.2 MB per node per filter"), or on the cost ratio of false-positive vs true-negative (the operations-research answer: minimize expected wasted work)? Pin that, derive the rest.

**Step 2 — Solve the closed form.** Given p and n, m = ⌈−n ln p / (ln 2)²⌉ ≈ −n · log2(p) · 1.44. Given m and n, k* = round((m/n) · ln 2). Never pick k independently. Use the Kirsch–Mitzenmacher trick — generate two strong hashes h1, h2, then derive g_i(x) = h1(x) + i · h2(x) — to get k indices at the cost of 2 real hash computations without changing FPR by more than a rounding error.

**Step 3 — Forecast and segment for growth.** If n is expected to grow from N₀ to N_max over the filter lifetime, sizing for N_max is wasteful (FPR is far below target for the first months) and sizing for N₀ is suicidal (FPR explodes). The scalable Bloom pattern fixes this: chain filters with geometrically tightening per-filter FPR (target_p / 2 + target_p / 4 + … summing under target_p), starting a new filter at saturation. Union-bound the per-layer p when reporting the SLO.

**Step 4 — Pick the variant.** Standard Bloom for insert-only and a frozen set size. Counting Bloom (4-bit or 8-bit counters per slot, 4-8x memory) when delete is needed and the false-positive rate target is loose. Cuckoo filter (fingerprints in two-bucket cuckoo hash) when delete is needed *and* the FPR target is tight (≤ 0.5%), since cuckoo beats Bloom on space below that threshold. Blocked Bloom (each query touches one cache line, all k bits in a single 512-bit block) when query throughput matters more than the small FPR penalty from clustering — RocksDB ships this variant by default.

After deploy, monitor the realized FPR: count probe queries on known-absent keys and divide positives by total. Drift above the design target by more than 1.5x means n has outgrown the filter — rebuild bigger or add a scalable layer.

## complexity
- **Sizing**: m = −n · ln(p) / (ln 2)² bits. Equivalently, bits per element = 1.44 · log2(1/p).
- **Hash count**: k* = (m/n) · ln 2 ≈ 0.693 · (m/n). Always derive, never set independently.
- **False-positive rate**: p ≈ (1 − e^(−kn/m))^k. The "1 − e^(−kn/m)" term is the per-bit fill probability; raising it to the k-th power gives the all-k-bits-set chance for a non-member.
- **Insert / query time**: O(k) — independent of n.
- **Bits per element at common targets**: p=1% → 9.6, p=0.1% → 14.4, p=0.01% → 19.2, p=10⁻⁶ → 28.8.

## pitfalls
- **Tuning for today's n.** FPR degrades quadratically as n exceeds the design point. Budget 2–4x headroom or use a scalable Bloom — never a single static filter when growth is unbounded.
- **Cranking k without changing m.** The FPR U-curve climbs sharply past k*. Locking k at "always 7" is a footgun on any filter where m/n ≠ 10.
- **Sharing hash functions naively.** Using k seeded copies of a weak hash (Java String.hashCode with seed) violates the independence assumption — analytic FPR understates measured FPR by 2-3x. Use Murmur, xxHash, or Blake2 + Kirsch-Mitzenmacher.
- **Deleting from a classic Bloom.** Silently corrupts every key that shared a bit with the deleted one. Switch to Counting Bloom or Cuckoo filter the moment delete enters the requirement list.
- **Counter overflow in Counting Bloom.** 4-bit counters saturate at 15 and stop decrementing; pick 8-bit if any element may be inserted more than 15 times.
- **Ignoring cache locality.** A standard Bloom touches k random cache lines per query. Blocked Bloom is 4-8x faster at the cost of a ~25% FPR penalty — worth it when QPS dominates.

## interviewTips
- Memorize the bits-per-element table: p=1% → ~10, p=0.1% → ~14, p=0.01% → ~19. You can size any filter in your head from there.
- Derive both formulas live: m = −n ln p / (ln 2)² and k = (m/n) ln 2 — interviewers reward derivation over recall.
- When asked "which variant" — answer with the decision tree: delete required? cuckoo or counting. growth unbounded? scalable. throughput-critical? blocked. Otherwise classic.

## code.python
```python
import math, hashlib

def tune_bloom(n: int, p: float) -> tuple[int, int]:
    """Return (m bits, k hashes) for n elements at target false-positive rate p."""
    m = max(8, math.ceil(-n * math.log(p) / (math.log(2) ** 2)))
    k = max(1, round((m / n) * math.log(2)))
    return m, k

def estimate_fpr(m: int, k: int, n: int) -> float:
    """Predicted FPR for a filter of m bits, k hashes, n insertions."""
    return (1 - math.exp(-k * n / m)) ** k

class BloomFilter:
    def __init__(self, n: int, p: float = 0.01):
        self.m, self.k = tune_bloom(n, p)
        self.bits = bytearray((self.m + 7) // 8)

    def _indices(self, item):
        digest = hashlib.blake2b(str(item).encode(), digest_size=16).digest()
        h1 = int.from_bytes(digest[:8], "big")
        h2 = int.from_bytes(digest[8:], "big")
        for i in range(self.k):
            yield (h1 + i * h2) % self.m

    def add(self, item):
        for j in self._indices(item):
            self.bits[j >> 3] |= 1 << (j & 7)

    def __contains__(self, item):
        return all(self.bits[j >> 3] & (1 << (j & 7)) for j in self._indices(item))

# Example: 1 million items, target 1% FPR
m, k = tune_bloom(1_000_000, 0.01)
print(f"m={m} bits ({m/8/1024:.1f} KB), k={k}, predicted p={estimate_fpr(m, k, 1_000_000):.4%}")
```

## code.javascript
```javascript
const { createHash } = require("crypto");

function tuneBloom(n, p) {
  const m = Math.max(8, Math.ceil(-n * Math.log(p) / Math.LN2 ** 2));
  const k = Math.max(1, Math.round((m / n) * Math.LN2));
  return { m, k };
}

function estimateFpr(m, k, n) {
  return (1 - Math.exp(-k * n / m)) ** k;
}

class BloomFilter {
  constructor(n, p = 0.01) {
    const { m, k } = tuneBloom(n, p);
    this.m = m; this.k = k;
    this.bits = new Uint8Array(Math.ceil(m / 8));
  }
  *_indices(item) {
    const d = createHash("sha256").update(String(item)).digest();
    const h1 = d.readBigUInt64BE(0);
    const h2 = d.readBigUInt64BE(8);
    const mBig = BigInt(this.m);
    for (let i = 0; i < this.k; i++) yield Number((h1 + BigInt(i) * h2) % mBig);
  }
  add(item) { for (const j of this._indices(item)) this.bits[j >> 3] |= 1 << (j & 7); }
  has(item) {
    for (const j of this._indices(item)) if (!(this.bits[j >> 3] & (1 << (j & 7)))) return false;
    return true;
  }
}

const { m, k } = tuneBloom(1_000_000, 0.01);
console.log(`m=${m} bits (${(m/8/1024).toFixed(1)} KB), k=${k}, p≈${estimateFpr(m, k, 1_000_000).toFixed(4)}`);
```

## code.java
```java
import java.security.MessageDigest;
import java.nio.ByteBuffer;
import java.util.BitSet;

public class BloomTuning {
    final int m, k;
    final BitSet bits;

    public BloomTuning(int n, double p) {
        this.m = Math.max(8, (int) Math.ceil(-n * Math.log(p) / (Math.log(2) * Math.log(2))));
        this.k = Math.max(1, (int) Math.round((double) m / n * Math.log(2)));
        this.bits = new BitSet(m);
    }

    public static double estimateFpr(int m, int k, int n) {
        return Math.pow(1 - Math.exp(-(double) k * n / m), k);
    }

    int[] indices(String item) throws Exception {
        byte[] d = MessageDigest.getInstance("SHA-256").digest(item.getBytes());
        long h1 = ByteBuffer.wrap(d, 0, 8).getLong();
        long h2 = ByteBuffer.wrap(d, 8, 8).getLong();
        int[] out = new int[k];
        for (int i = 0; i < k; i++) out[i] = (int) Math.floorMod(h1 + (long) i * h2, m);
        return out;
    }

    public void add(String item) throws Exception {
        for (int j : indices(item)) bits.set(j);
    }

    public boolean contains(String item) throws Exception {
        for (int j : indices(item)) if (!bits.get(j)) return false;
        return true;
    }

    public static void main(String[] args) {
        BloomTuning bt = new BloomTuning(1_000_000, 0.01);
        System.out.printf("m=%d bits (%.1f KB), k=%d, p≈%.4f%n",
            bt.m, bt.m / 8.0 / 1024.0, bt.k, estimateFpr(bt.m, bt.k, 1_000_000));
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <cmath>
#include <functional>
#include <cstdint>
#include <utility>

inline std::pair<size_t, int> tuneBloom(size_t n, double p) {
    size_t m = std::max<size_t>(8,
        (size_t) std::ceil(-(double) n * std::log(p) / (std::log(2) * std::log(2))));
    int k = std::max(1, (int) std::round((double) m / n * std::log(2)));
    return {m, k};
}

inline double estimateFpr(size_t m, int k, size_t n) {
    return std::pow(1.0 - std::exp(-(double) k * n / m), k);
}

struct BloomFilter {
    size_t m;
    int k;
    std::vector<uint8_t> bits;

    BloomFilter(size_t n, double p = 0.01) {
        auto [mm, kk] = tuneBloom(n, p);
        m = mm; k = kk;
        bits.assign((m + 7) / 8, 0);
    }

    std::vector<size_t> indices(const std::string& item) const {
        std::hash<std::string> H;
        size_t h1 = H(item);
        size_t h2 = H(item + "#salt");
        std::vector<size_t> out(k);
        for (int i = 0; i < k; i++) out[i] = (h1 + (size_t) i * h2) % m;
        return out;
    }

    void add(const std::string& item) {
        for (auto j : indices(item)) bits[j >> 3] |= 1u << (j & 7);
    }

    bool contains(const std::string& item) const {
        for (auto j : indices(item)) if (!(bits[j >> 3] & (1u << (j & 7)))) return false;
        return true;
    }
};
```
