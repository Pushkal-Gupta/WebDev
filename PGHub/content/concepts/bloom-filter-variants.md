---
slug: bloom-filter-variants
module: hashing
title: Bloom Filter Variants
subtitle: Counting, scalable, and cuckoo filters — trading false-positive rate for deletes and growth.
difficulty: Advanced
position: 20
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Bloom Filters — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/bloom-filters-introduction-and-python-implementation/"
    type: blog
  - title: "Probabilistic Data Structures — High Scalability"
    url: "http://highscalability.com/blog/2012/4/5/big-data-counting-how-to-count-a-billion-distinct-objects-us.html"
    type: blog
  - title: "TheAlgorithms/Python — bloom_filter.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/hashing/bloom_filter.py"
    type: repo
status: published
---

## intro
A classic Bloom filter answers "have I seen this key?" using a bit array and k hash functions, with a small tunable false-positive rate and zero false negatives. It cannot delete and cannot grow. The variants — Counting Bloom, Scalable Bloom, and Cuckoo filter — patch one of those limitations at a measurable cost in space or false-positive rate.

## whyItMatters
Bloom-family filters are the membership check in front of disk-heavy systems: RocksDB SSTables, Cassandra read paths, Chrome's safe-browsing list, CDN cache deduplication. Picking the wrong variant means either silently leaking deletes (classic Bloom), wasting RAM (Counting Bloom set too large), or paying a 2x hash-cost penalty (Cuckoo) for a workload that never deletes. Interview signal: do you know that the *delete* requirement alone forces you off the classic structure.

## intuition
Picture a long row of light switches, all off. To remember a key you flip on the k switches its k hash functions point at. To check a key later you look at its k switches: if any one is still off, the key was definitely never stored — you would have flipped it on — and if all k are on, the key is *probably* stored, but those switches may have been flipped on by other keys, which is exactly where a false positive comes from. Absence is certain, presence is only a strong hint. That asymmetry — zero false negatives, a small tunable false-positive rate — is the entire personality of the structure, and every variant just renegotiates its price.

A classic Bloom is k bit-flips per insert; any zero bit on lookup proves absence. Counting Bloom replaces each bit with a small counter so decrement-on-delete becomes possible (at 4x to 8x the memory). Scalable Bloom chains a sequence of filters with geometrically tightening false-positive rates, so the union stays under a target. Cuckoo filters store short fingerprints in two candidate buckets and evict cuckoo-style on collision — they support delete *and* often beat Bloom at low false-positive rates.

Concrete numbers make the sharing visible. Take m = 16 bits, k = 3. Insert `"cat"` and suppose its three hashes land on positions 3, 9, 14 — those bits go to 1, the other 13 stay 0. Query `"cat"` and all three read 1, so it reports present. Now query `"dog"` and suppose *its* three hashes also happen to land on 3, 9, 14: every bit is already 1, so `"dog"` reads present though it was never inserted — a false positive born entirely from bit sharing. Query `"fox"` whose hashes hit 3, 9, 7: bit 7 is still 0, so `"fox"` is reported absent with certainty. A Counting Bloom would store the number 1 at each of 3, 9, 14 instead of a bare bit, so deleting `"cat"` decrements them back toward 0 without erasing evidence another key still depends on — which is precisely the capability a bare bit array cannot offer.

## visualization
```
Classic Bloom (m=10 bits, k=3 hashes, insert "x"):
indices = h1(x)=2, h2(x)=5, h3(x)=8
bits:    [0 0 1 0 0 1 0 0 1 0]

Counting Bloom after insert "x", insert "y" (h2(y)=5):
counts:  [0 0 1 0 0 2 0 0 1 0]   -- delete "x" now decrements safely

Cuckoo filter (2 buckets per item, fingerprint f):
bucket i1 = h(x), bucket i2 = i1 XOR h(f)
[ - | f_x | - | - ]   ...   [ f_x | - | - | - ]
```

## bruteForce
Hash set of full keys: exact, supports delete, but memory grows with both key count and key size. A 100M-entry URL set in a Python set is gigabytes; a Bloom filter answering the same membership question is megabytes. The brute force also blocks the use case Bloom filters were invented for — sitting in RAM in front of slow storage so we skip 99% of disk reads cheaply.

## optimal
```
ClassicBloom(m, k):
  bits = zeros(m)
  insert(x):  for i in 1..k: bits[h_i(x) mod m] = 1
  query(x):   return all(bits[h_i(x) mod m] == 1)

CountingBloom(m, k, width=4):
  counts = zeros(m, width-bit)
  insert(x): for i: counts[h_i(x)] = min(counts[h_i(x)]+1, 2^width-1)
  delete(x): for i: if counts[h_i(x)]>0: counts[h_i(x)] -= 1

ScalableBloom(target_fpr, ratio=0.5):
  filters = [BloomFilter(fpr=target_fpr * (1-ratio))]
  insert(x):
    if filters[-1].full(): filters.append(new_filter_with_tighter_fpr())
    filters[-1].insert(x)
  query(x): return any(f.query(x) for f in filters)

CuckooFilter(buckets, slots=4, fp_bits=8):
  insert(x):
    f = fingerprint(x); i1 = h(x); i2 = i1 XOR h(f)
    if buckets[i1].has_slot() or buckets[i2].has_slot(): place(f); return
    i = pick(i1,i2); for kick=1..MAX: f = swap(f, buckets[i].random_slot())
                                       i = i XOR h(f); if buckets[i].has_slot(): place; return
    rebuild_bigger()
  delete(x): remove fingerprint(x) from i1 or i2
```

These four variants are one decision tree, not four unrelated structures. Start from the requirements. **Do you ever delete?** If no, classic Bloom is strictly best — smallest memory, simplest code. If yes, classic is off the table immediately: clearing the k bits of one key silently clears bits that other keys rely on, injecting unbounded false *negatives*. That single requirement forks you to Counting Bloom (bit becomes a small counter, decrement on delete) or Cuckoo (delete a whole fingerprint from one of its two buckets). **Do you know the final key count up front?** Classic and Counting must be sized in advance, and overshooting the load pushes the false-positive rate past target; if the count is unbounded, Scalable Bloom chains fresh filters, each with a geometrically tighter target so the union bound over all layers stays under the global budget.

Sizing is mechanical: fix the target false-positive rate `f`, compute `m = -n·ln(f)/(ln 2)^2` bits, then the optimal hash count `k = (m/n)·ln 2`. The constant worth memorizing is ~1.44·log2(1/f) bits per key — about 10 bits per key buys ~1% false positives. The Kirsch-Mitzenmacher trick derives all k indices from just two base hashes as `h1 + i·h2`, so you pay for two real hashes rather than k. Cuckoo's invariant is different: a fingerprint always lives in one of two XOR-linked buckets (`i2 = i1 XOR h(fingerprint)`), so an insert that finds both full evicts a resident and re-homes it along that chain — which is what yields O(1) amortized inserts until the load nears ~95%, where eviction chains lengthen and force a rebuild.

## complexity
time: O(k) insert and query for Bloom / Counting; O(1) amortized for Cuckoo (worst case O(MAX_KICKS)).
space: Classic ~1.44 * log2(1/fpr) bits per key. Counting ~4-8x classic. Cuckoo ~(fp_bits + 3) / load_factor bits per key, typically beats Bloom below fpr=0.01.
notes: Optimal k for classic Bloom is (m/n) * ln2; pick m from target fpr first, then derive k.

## pitfalls
- Reusing one hash function with different seeds is fine; rolling two hashes h1, h2 and computing h_i = h1 + i*h2 (Kirsch-Mitzenmacher) is standard and faster than k independent hashes.
- Deleting from a classic Bloom corrupts every key that shared any of the k bits — silent, unbounded false negatives. Always switch to Counting or Cuckoo if delete is required.
- Counting-Bloom counters overflow at 2^width; a 4-bit counter saturates at 15 and never decrements again. Use 8-bit if any key may be inserted >15 times.
- Scalable Bloom's combined false-positive rate is the *sum* (union bound) of per-layer rates; budget accordingly with the geometric ratio.
- Cuckoo filter cannot grow without rebuild — choosing buckets too small forces an eviction storm at ~95% load.

## interviewTips
- Lead with the trade-off matrix: delete? grow? target fpr? — then pick a variant.
- Quote the magic constant: ~10 bits per entry gives ~1% false positive for classic Bloom.
- If asked about RocksDB or Cassandra, name "Bloom on SSTable blocks to skip disk reads" — it is the canonical real-world use.
- Be ready to draw the two-bucket eviction chain for Cuckoo; that's the visual that proves you understand it.

## code.python
```python
import math, hashlib

class BloomFilter:
    def __init__(self, n, fpr=0.01):
        self.m = max(8, int(-n * math.log(fpr) / (math.log(2) ** 2)))
        self.k = max(1, int(self.m / n * math.log(2)))
        self.bits = bytearray((self.m + 7) // 8)

    def _idx(self, x, i):
        h = hashlib.blake2b(x.encode(), digest_size=16).digest()
        h1 = int.from_bytes(h[:8], "big"); h2 = int.from_bytes(h[8:], "big")
        return (h1 + i * h2) % self.m

    def add(self, x):
        for i in range(self.k):
            j = self._idx(x, i); self.bits[j >> 3] |= 1 << (j & 7)

    def __contains__(self, x):
        return all((self.bits[(j := self._idx(x, i)) >> 3] >> (j & 7)) & 1 for i in range(self.k))

class CountingBloom(BloomFilter):
    def __init__(self, n, fpr=0.01, width=4):
        super().__init__(n, fpr); self.counts = [0] * self.m; self.cap = (1 << width) - 1
    def add(self, x):
        for i in range(self.k):
            j = self._idx(x, i); self.counts[j] = min(self.counts[j] + 1, self.cap)
    def remove(self, x):
        for i in range(self.k):
            j = self._idx(x, i)
            if self.counts[j] > 0: self.counts[j] -= 1
    def __contains__(self, x):
        return all(self.counts[self._idx(x, i)] > 0 for i in range(self.k))
```

## code.javascript
```javascript
import { createHash } from "crypto";

class BloomFilter {
  constructor(n, fpr = 0.01) {
    this.m = Math.max(8, Math.ceil(-n * Math.log(fpr) / Math.LN2 ** 2));
    this.k = Math.max(1, Math.round((this.m / n) * Math.LN2));
    this.bits = new Uint8Array(Math.ceil(this.m / 8));
  }
  _idx(x, i) {
    const h = createHash("sha256").update(String(x)).digest();
    const h1 = h.readBigUInt64BE(0), h2 = h.readBigUInt64BE(8);
    return Number((h1 + BigInt(i) * h2) % BigInt(this.m));
  }
  add(x) { for (let i = 0; i < this.k; i++) { const j = this._idx(x, i); this.bits[j >> 3] |= 1 << (j & 7); } }
  has(x) { for (let i = 0; i < this.k; i++) { const j = this._idx(x, i); if (!(this.bits[j >> 3] & (1 << (j & 7)))) return false; } return true; }
}
```

## code.java
```java
import java.util.*; import java.security.*; import java.nio.*;

public class BloomFilter {
    final int m, k; final byte[] bits;
    public BloomFilter(int n, double fpr) {
        this.m = Math.max(8, (int) Math.ceil(-n * Math.log(fpr) / (Math.log(2) * Math.log(2))));
        this.k = Math.max(1, (int) Math.round((double) m / n * Math.log(2)));
        this.bits = new byte[(m + 7) / 8];
    }
    int idx(String x, int i) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(x.getBytes());
            long h1 = ByteBuffer.wrap(d, 0, 8).getLong(), h2 = ByteBuffer.wrap(d, 8, 8).getLong();
            return (int) Math.floorMod(h1 + (long) i * h2, m);
        } catch (Exception e) { throw new RuntimeException(e); }
    }
    public void add(String x) { for (int i = 0; i < k; i++) { int j = idx(x, i); bits[j >> 3] |= (byte) (1 << (j & 7)); } }
    public boolean contains(String x) {
        for (int i = 0; i < k; i++) { int j = idx(x, i); if ((bits[j >> 3] & (1 << (j & 7))) == 0) return false; }
        return true;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <cmath>
#include <functional>

struct BloomFilter {
    size_t m, k;
    std::vector<uint8_t> bits;
    BloomFilter(size_t n, double fpr = 0.01) {
        m = std::max<size_t>(8, std::ceil(-(double)n * std::log(fpr) / (std::log(2) * std::log(2))));
        k = std::max<size_t>(1, std::round((double)m / n * std::log(2)));
        bits.assign((m + 7) / 8, 0);
    }
    size_t idx(const std::string& x, size_t i) const {
        std::hash<std::string> H;
        size_t h1 = H(x), h2 = H(x + "#salt");
        return (h1 + i * h2) % m;
    }
    void add(const std::string& x) { for (size_t i = 0; i < k; i++) { auto j = idx(x, i); bits[j >> 3] |= 1u << (j & 7); } }
    bool contains(const std::string& x) const {
        for (size_t i = 0; i < k; i++) { auto j = idx(x, i); if (!(bits[j >> 3] & (1u << (j & 7)))) return false; }
        return true;
    }
};
```
