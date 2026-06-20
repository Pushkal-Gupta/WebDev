---
slug: bloom-vs-cuckoo
module: hashing
title: Bloom Filter vs Cuckoo Filter
subtitle: Two probabilistic membership structures — when deletes, false-positive rate, and space tip the choice.
difficulty: Advanced
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Hash tables"
    url: "https://walkccc.me/CLRS/Chap11/"
    type: book
  - title: "High Scalability — Bloom filters in big systems"
    url: "http://highscalability.com/blog/2017/12/4/probabilistic-algorithms.html"
    type: blog
  - title: "TheAlgorithms/Python — bloom_filter.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/hashing/bloom_filter.py"
    type: repo
status: published
---

## intro
Both Bloom filters and cuckoo filters answer "is this key probably in the set?" with no false negatives and a tunable false-positive rate, using far less space than a hash set. The differences matter: Bloom filters are simpler, more compact at very low fill, and impossible to delete from. Cuckoo filters support deletion, often use less space at moderate false-positive rates, and have predictable lookup cost of at most two reads.

## whyItMatters
Membership filters guard expensive operations — disk reads in LevelDB/RocksDB, network calls to check a username against a denylist, joining over a remote dataset. A 1 GB set can be summarized in 10 MB with a 1% false-positive rate. Picking the wrong filter — a Bloom filter when you need to remove churning items — forces awkward workarounds like "counting Bloom filters" that erase the original space advantage.

## intuition
A Bloom filter is a graffiti wall: each insertion sprays k random spots black. To check membership, look at those k spots; if any is white, the item was never inserted. You cannot un-spray without erasing other people's tags. A cuckoo filter is a parking lot with two assigned spaces per car; if both are taken, you evict an existing car and send it to its alternate space. To delete, you just paint over that one space — fully reversible.

## visualization
Bloom: array of 32 bits, k=3 hashes. Insert "alice": bits 4, 11, 27 set. Insert "bob": bits 7, 11, 22 set. Query "carol": hashes to 4, 7, 18 — bit 18 is 0, definitely absent. Query "dan": hashes to 4, 11, 22 — all set, but dan was never inserted; this is a false positive. Cuckoo: each cell holds a 12-bit fingerprint. Insert "alice": fingerprint 0x3a4 lands in bucket 5; alternate bucket is `5 XOR hash(0x3a4) = 19`. Delete "alice": clear that fingerprint in bucket 5 or 19. Done.

## bruteForce
Use a hash set: `O(1)` lookup, full fidelity, no false positives. Space is `O(n × key_size)` — for billions of keys this dwarfs RAM. Cheap when n is small or memory is unconstrained; the whole reason filters exist is to escape this when the answer-set fits but the keys do not.

## optimal
Bloom filter: bit array of size `m`, `k` independent hash functions. To insert, set the k bit positions. To query, return true iff all k positions are set. Optimal `k = (m/n) × ln 2`. False-positive rate `≈ (1 - e^(-kn/m))^k`. Cuckoo filter: array of buckets each holding ~4 small fingerprints. Insert hashes the key to bucket `i1`; alternate `i2 = i1 XOR hash(fingerprint)`. Place in either if there is space; otherwise evict and relocate up to 500 times. Lookup checks both buckets only — O(1) with tight constants. Cuckoo wins on space at FPR < ~3%; Bloom wins for ultra-high FPR (>10%) or write-only workloads where deletes are not needed.

## complexity
time: O(k) insert/query for Bloom (k ≈ 7 at 1% FPR); O(1) lookup, amortized O(1) insert for cuckoo (worst-case high during eviction storms)
space: ~9.6 bits/element at 1% FPR for Bloom; ~9 bits/element for cuckoo at same FPR with 4-slot buckets and 12-bit fingerprints
notes: Cuckoo filters degrade sharply near 95% load factor; size with headroom. Bloom filters never fill — they just accumulate false positives.

## pitfalls
- "Just delete a Bloom filter entry" — impossible. Use a counting Bloom filter (4× the space) or a cuckoo filter.
- Using the same hash function with different seeds and assuming independence — works for Bloom in practice, but double hashing (`h_i(x) = h1(x) + i × h2(x)`) is the correct simplification.
- Sizing the bit array tightly to current n; growth doubles the FPR or forces a full rebuild.
- Forgetting that cuckoo inserts can fail under heavy load — handle the rare insert-fail case in caller logic.
- Trusting a Bloom-filter "yes" without the authoritative check — that is what false positive means.

## interviewTips
- Lead with "no false negatives, tunable false positives" — it is the defining property.
- Quote the formula: ~9.6 bits per element gets you 1% FPR. Interviewers recognize the figure.
- Name a real system: Bigtable, RocksDB, and Cassandra use Bloom filters per SSTable to skip non-existent keys.
- If asked about deletes, jump straight to cuckoo or counting Bloom; do not muddle.

## code.python
```python
import math, mmh3

class BloomFilter:
    def __init__(self, n, fpr=0.01):
        self.m = max(8, int(-n * math.log(fpr) / (math.log(2) ** 2)))
        self.k = max(1, int(self.m / n * math.log(2)))
        self.bits = bytearray((self.m + 7) // 8)

    def _hashes(self, key):
        h1, h2 = mmh3.hash(key, 0), mmh3.hash(key, 1)
        for i in range(self.k):
            yield (h1 + i * h2) % self.m

    def add(self, key):
        for h in self._hashes(key):
            self.bits[h >> 3] |= 1 << (h & 7)

    def __contains__(self, key):
        return all((self.bits[h >> 3] >> (h & 7)) & 1 for h in self._hashes(key))
```

## code.javascript
```javascript
function murmur(str, seed) {
  let h = seed ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
    h ^= h >>> 13;
  }
  return h >>> 0;
}

export class BloomFilter {
  constructor(n, fpr = 0.01) {
    this.m = Math.max(8, Math.ceil(-n * Math.log(fpr) / (Math.LN2 ** 2)));
    this.k = Math.max(1, Math.round(this.m / n * Math.LN2));
    this.bits = new Uint8Array((this.m + 7) >> 3);
  }

  *_hashes(key) {
    const h1 = murmur(key, 0), h2 = murmur(key, 1);
    for (let i = 0; i < this.k; i++) yield (h1 + i * h2) % this.m;
  }

  add(key) {
    for (const h of this._hashes(key)) this.bits[h >> 3] |= 1 << (h & 7);
  }

  has(key) {
    for (const h of this._hashes(key)) if (!((this.bits[h >> 3] >> (h & 7)) & 1)) return false;
    return true;
  }
}
```

## code.java
```java
public class BloomFilter {
    private final int m, k;
    private final byte[] bits;

    public BloomFilter(int n, double fpr) {
        this.m = Math.max(8, (int) Math.ceil(-n * Math.log(fpr) / Math.pow(Math.log(2), 2)));
        this.k = Math.max(1, (int) Math.round((double) m / n * Math.log(2)));
        this.bits = new byte[(m + 7) / 8];
    }

    private int[] hashes(String key) {
        int h1 = key.hashCode(), h2 = Integer.reverseBytes(h1);
        int[] out = new int[k];
        for (int i = 0; i < k; i++) out[i] = Math.floorMod(h1 + i * h2, m);
        return out;
    }

    public void add(String key) {
        for (int h : hashes(key)) bits[h >> 3] |= (byte) (1 << (h & 7));
    }

    public boolean contains(String key) {
        for (int h : hashes(key)) if (((bits[h >> 3] >> (h & 7)) & 1) == 0) return false;
        return true;
    }
}
```

## code.cpp
```cpp
class BloomFilter {
    std::size_t m, k;
    std::vector<uint8_t> bits;
    static uint64_t hash_one(std::string_view s, uint64_t seed) {
        std::hash<std::string_view> h;
        return h(s) ^ (seed * 0x9e3779b97f4a7c15ULL);
    }
public:
    BloomFilter(std::size_t n, double fpr = 0.01) {
        m = std::max<std::size_t>(8, std::ceil(-double(n) * std::log(fpr) / std::pow(std::log(2.0), 2)));
        k = std::max<std::size_t>(1, std::round(double(m) / n * std::log(2.0)));
        bits.assign((m + 7) / 8, 0);
    }
    void add(std::string_view key) {
        auto h1 = hash_one(key, 1), h2 = hash_one(key, 2);
        for (std::size_t i = 0; i < k; i++) {
            std::size_t h = (h1 + i * h2) % m;
            bits[h >> 3] |= uint8_t(1 << (h & 7));
        }
    }
    bool contains(std::string_view key) const {
        auto h1 = hash_one(key, 1), h2 = hash_one(key, 2);
        for (std::size_t i = 0; i < k; i++) {
            std::size_t h = (h1 + i * h2) % m;
            if (!((bits[h >> 3] >> (h & 7)) & 1)) return false;
        }
        return true;
    }
};
```
