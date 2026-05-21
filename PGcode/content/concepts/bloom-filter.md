---
slug: bloom-filter
module: hashing
title: Bloom Filter
subtitle: Probabilistic set that says "definitely not present" or "probably present" — using a tiny fraction of a hash set's memory.
difficulty: Advanced
position: 20
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Bloom (1970) — Space/Time Trade-offs in Hash Coding with Allowable Errors"
    url: ""
status: published
---

## intro
A Bloom filter is a fixed-size bit array plus k hash functions. To **insert** an item, set k bits chosen by hashing it. To **query**, check whether all k bits are set. False positives are possible (other items might have set those bits), but false negatives are impossible — if the filter says "no," the item really isn't there.

## whyItMatters
A hash set storing 100M URLs costs gigabytes. A Bloom filter with 1% false-positive rate over the same 100M URLs needs ~120 MB. That's the entire point: use it as a cheap negative cache in front of an expensive check. If the filter says "not in the DB," skip the DB query entirely. If it says "might be there," do the real lookup. Used everywhere: Chrome's malicious-URL check, BigTable's row-existence pre-filter, Bitcoin SPV clients, Cassandra's SSTable pre-filter, Akamai's CDN cache.

## intuition
Picture k stamps on a giant grid of empty squares. For "apple," you hash it three ways and stamp three squares. For "banana," three different squares (probably). When you ask "is grape here?" — hash it three ways, check those three squares. If any one is blank, grape definitely wasn't added. If all three are stamped, *maybe* it was added... or *maybe* its three squares happen to overlap with apple's and banana's. That coincidence is the false positive.

## visualization
```
Bit array (m = 16):
[ . . . . . . . . . . . . . . . . ]

Insert "apple"   → hashes to bits 2, 7, 11
[ . . X . . . . X . . . X . . . . ]

Insert "banana"  → hashes to bits 5, 7, 14
[ . . X . . X . X . . . X . . X . ]

Query "grape"    → hashes to bits 1, 5, 9. Bit 1 is unset → DEFINITELY not present.
Query "cherry"   → hashes to bits 2, 5, 14. All set → MAYBE present (false positive risk).
```

## bruteForce
Use a hash set. O(1) lookup, no false positives — but `n * (key_size + overhead)` bytes. For 100M URLs at 80 bytes each + overhead → ~10 GB.

## optimal
**Sizing**: Given `n` insertions and target false-positive rate `p`:
- Bit array size `m = -(n · ln p) / (ln 2)^2`
- Optimal number of hash functions `k = (m / n) · ln 2`
- For p = 1%, that's m ≈ 9.6·n bits and k ≈ 7 hashes.

**Hash functions**: don't actually use k independent hashes — use two and combine: `h_i(x) = h1(x) + i·h2(x)` for i = 0..k-1. Same false-positive rate, much faster.

**Operations**:
- Insert(x): for i in 0..k-1: set bit `(h1(x) + i·h2(x)) mod m`.
- Query(x): for i in 0..k-1: if bit unset → return False. Otherwise → return True (probably).

**Cannot remove**: clearing a bit might break other items that depend on it. Variants like **Counting Bloom Filter** (each cell is a small counter, +/- 1 on insert/remove) and **Cuckoo Filter** (supports deletion + slightly better space) handle this.

## complexity
- **Insert / Query**: O(k) — fixed-time regardless of n.
- **Space**: ~1.44 · log2(1/p) bits per element. For p = 1% → ~9.6 bits/element. **For 100M elements → ~120 MB**.
- **False positive rate**: ~(1 - e^(-kn/m))^k. Tunable by sizing.
- **False negative rate**: 0. The filter never says no to something that's there.

## pitfalls
- **Underestimating n**: filter sizing is fixed. If you insert 10× the planned items, FPR explodes to near 1.
- **Bad hash functions**: collisions cluster, FPR worsens. Use MurmurHash, xxHash, FNV — not Java's default String.hashCode.
- **Removing items**: classic Bloom can't. Use Counting Bloom or Cuckoo Filter.
- **No iteration / no enumeration**: you can't dump the contents — you only have anonymous bits.
- **Confusing false positive with bug**: cherry maybe-saying-present is by design. Always do the real check after a positive.

## interviewTips
- The trigger: "membership check, huge set, can tolerate false positives, cannot tolerate false negatives." Examples: cache pre-check, blacklist, dedupe pipelines, distributed key existence.
- Calculate sizing on the spot — interviewers love when you can say "for 1% FPR I'd need ~10 bits per element."
- Mention **Counting Bloom** for deletion support and **Cuckoo Filter** as a modern alternative (similar space, supports delete, similar FPR).
- Compare with **HyperLogLog** (cardinality estimation, *count* unique items, not test membership).

## code.python
```python
import math, hashlib

class BloomFilter:
    def __init__(self, n, p=0.01):
        self.m = max(8, int(-(n * math.log(p)) / (math.log(2) ** 2)))
        self.k = max(1, int((self.m / n) * math.log(2)))
        self.bits = bytearray((self.m + 7) // 8)

    def _hashes(self, item):
        b = str(item).encode()
        h1 = int(hashlib.md5(b).hexdigest(), 16)
        h2 = int(hashlib.sha1(b).hexdigest(), 16)
        for i in range(self.k):
            yield (h1 + i * h2) % self.m

    def add(self, item):
        for h in self._hashes(item):
            self.bits[h // 8] |= 1 << (h % 8)

    def __contains__(self, item):
        return all(self.bits[h // 8] & (1 << (h % 8)) for h in self._hashes(item))

bf = BloomFilter(1000)
for x in ["apple", "banana", "cherry"]: bf.add(x)
print("apple" in bf)   # True
print("grape" in bf)   # False (probably)
```

## code.javascript
```javascript
const crypto = require('crypto');
class BloomFilter {
  constructor(n, p = 0.01) {
    this.m = Math.max(8, Math.ceil(-(n * Math.log(p)) / Math.log(2) ** 2));
    this.k = Math.max(1, Math.round((this.m / n) * Math.log(2)));
    this.bits = new Uint8Array(Math.ceil(this.m / 8));
  }
  _hashes(item) {
    const buf = Buffer.from(String(item));
    const h1 = parseInt(crypto.createHash('md5').update(buf).digest('hex').slice(0, 12), 16);
    const h2 = parseInt(crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12), 16);
    const out = [];
    for (let i = 0; i < this.k; i++) out.push((h1 + i * h2) % this.m);
    return out;
  }
  add(item) { for (const h of this._hashes(item)) this.bits[h >> 3] |= 1 << (h & 7); }
  has(item) { return this._hashes(item).every(h => this.bits[h >> 3] & (1 << (h & 7))); }
}
```

## code.java
```java
import java.security.MessageDigest;
import java.util.BitSet;
class BloomFilter {
    final int m, k;
    final BitSet bits;
    BloomFilter(int n, double p) {
        this.m = Math.max(8, (int) Math.ceil(-(n * Math.log(p)) / Math.pow(Math.log(2), 2)));
        this.k = Math.max(1, (int) Math.round((double) m / n * Math.log(2)));
        this.bits = new BitSet(m);
    }
    private int[] hashes(String item) throws Exception {
        byte[] md5 = MessageDigest.getInstance("MD5").digest(item.getBytes());
        byte[] sha = MessageDigest.getInstance("SHA-1").digest(item.getBytes());
        long h1 = 0, h2 = 0;
        for (int i = 0; i < 8; i++) { h1 = (h1 << 8) | (md5[i] & 0xff); h2 = (h2 << 8) | (sha[i] & 0xff); }
        int[] out = new int[k];
        for (int i = 0; i < k; i++) out[i] = (int) Math.floorMod(h1 + (long) i * h2, m);
        return out;
    }
    void add(String item) throws Exception { for (int h : hashes(item)) bits.set(h); }
    boolean contains(String item) throws Exception {
        for (int h : hashes(item)) if (!bits.get(h)) return false;
        return true;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <functional>
#include <cmath>
struct BloomFilter {
    int m, k;
    std::vector<uint8_t> bits;
    BloomFilter(int n, double p = 0.01) {
        m = std::max(8, (int) std::ceil(-(n * std::log(p)) / std::pow(std::log(2), 2)));
        k = std::max(1, (int) std::round((double) m / n * std::log(2)));
        bits.assign((m + 7) / 8, 0);
    }
    std::vector<int> hashes(const std::string& item) const {
        size_t h1 = std::hash<std::string>{}(item);
        size_t h2 = std::hash<std::string>{}("salt:" + item);
        std::vector<int> out(k);
        for (int i = 0; i < k; i++) out[i] = (int) ((h1 + (size_t)i * h2) % (size_t) m);
        return out;
    }
    void add(const std::string& item) { for (int h : hashes(item)) bits[h >> 3] |= 1 << (h & 7); }
    bool contains(const std::string& item) const {
        for (int h : hashes(item)) if (!(bits[h >> 3] & (1 << (h & 7)))) return false;
        return true;
    }
};
```
