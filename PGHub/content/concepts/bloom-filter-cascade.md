---
slug: bloom-filter-cascade
module: hashing
title: Bloom Filter Cascade
subtitle: Stack Bloom filters to compress a perfect membership oracle for a fixed set.
difficulty: Advanced
position: 33
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms (Sedgewick) — Hash Tables"
    url: "https://algs4.cs.princeton.edu/34hash/"
    type: book
  - title: "Bloom Filters — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/bloom-filters-introduction-and-design/"
    type: blog
  - title: "TheAlgorithms/Python — bloom_filter.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/hashing/bloom_filter.py"
    type: repo
status: published
---

## intro
A single Bloom filter answers "is x in S?" with no false negatives and a tunable false-positive rate. A *cascade* of Bloom filters answers the same question with *zero* false positives for a known set, while using much less memory than storing the set directly. Firefox uses one to ship the revoked-certificate list (CRLite); Chrome uses one for safe-browsing lookups.

## whyItMatters
The classic Bloom trade-off — fast, memory-efficient, but false positives — is unacceptable for security oracles like "is this certificate revoked?" Mozilla's CRLite (Larisch et al. 2017) uses a Bloom-filter cascade to ship the entire public Web PKI revocation set in roughly 1 MiB per browser update, replacing per-request OCSP lookups that leaked browsing history to CAs. Chrome's CRLSets and Safari's revocation list use similar ideas. Bitcoin's BIP 158 specifies a Golomb-coded set with similar guarantees; the Tor consensus uses cascades for hidden-service descriptor caching. Whenever you need a compact, exact membership oracle for a known fixed set without sending each query to a server, a Bloom cascade is the canonical answer.

## intuition
Build a Bloom filter `B0` over the positive set `R` (revoked certs). `B0` will have false positives — items in the negative set `V` (valid certs) that `B0` says are in `R`. Collect that false-positive subset and call it `V1`. Build a second Bloom filter `B1` over `V1`. By design `B1` is queried only on items that `B0` already said "yes" to. `B1` will itself have false positives, which are a subset of `R` — call it `R1`. Build `B2` over `R1`. Continue alternating: each layer corrects the mistakes of the layer above, and the corrected sets shrink geometrically until empty.

The geometry is what makes this efficient. If each layer has false-positive rate `p`, then `|V1| ≈ p * |V|`, `|R1| ≈ p * |V1|`, and so on. After about `log(|V|) / log(1/p)` layers the sets are empty and the cascade gives an exact answer. Total memory is `|R| * log2(1/p) * log(|V|/|R|)` bits per element, which by Carter-Wegman-style arguments is within a small constant of the information-theoretic lower bound.

Why alternate sides? Because each layer's input is only the items its predecessor said "yes" to. The cascade is essentially a perfect classifier built out of imperfect ones, the same idea as boosting in machine learning but with a deterministic, set-membership flavor instead of probabilistic predictions.

## visualization
R = {a, b, c, d}; V = {e, f, g, h, i, j}. B0 hashes set for R; querying V: B0 says yes on {f, h} (false positives). Build B1 over {f, h}. Query members of R against B1: yes on {b} (false positive). Build B2 over {b}. Query B2 with V1: no false positives. Stop. To check x: walk B0 → if yes, check B1 → if yes, check B2 → final yes means x is in R.

## bruteForce
Store the entire set R as a hash table or sorted blob. Cost: O(|R| × key_bits) which for millions of 64-byte certificate hashes is hundreds of megabytes. Ship-to-the-client and update-incrementally are both impractical.

## optimal
Pick layer sizes geometrically: `|B_{i+1}| ~= |B_i| * p` where `p` is each layer's false-positive rate. The common choice is `p = 0.5`, which converges in `O(log |V|)` layers and reaches the information-theoretic floor: `|R| * log2(1/p)` bits per element. Lookup is `O(L)` hash computations where `L` is layer count — typically 25 to 30 layers for realistic certificate sets of `~10^7` revocations against `~10^9` valid certificates.

```python
def build_cascade(R, V, p=0.5):
    layers = []
    positive, negative = list(R), list(V)
    while positive:
        bf = BloomFilter(len(positive), p)
        for x in positive: bf.add(x)
        layers.append(bf)
        # New "positive" set is the next layer's job: correct
        # the false positives just produced.
        positive, negative = [x for x in negative if x in bf], positive
    return layers

def contains(layers, item):
    inside = True
    for bf in layers:
        if (item in bf) != inside:
            return not inside
        inside = not inside
    return inside
```

The critical line is the alternation `positive, negative = [x for x in negative if x in bf], positive` — it swaps the roles each round so the next layer corrects only the items its predecessor wrongly accepted. The "known set" requirement matters: you cannot add elements without rebuilding. For drifting sets (CRLite refreshes every six hours), ship periodic full or delta cascades and have the client apply the delta atomically. Mozilla's open-source `filter-cascade` library (Rust) is the production reference; CRLite's binary format is documented in the Mozilla wiki for anyone implementing a client.

## complexity
time: O(L × k) per query, where L is layer count and k is hashes per layer
space: O(|R| × log(1/p)) bits total
notes: For p=0.5 and |R| = 1M, the cascade compresses to about 2 MB versus 64 MB for raw 64-byte hashes — a 30× reduction.

## pitfalls
- Treating it like a mutable Bloom filter — cascades are read-only artifacts.
- Forgetting that lookup cost grows with L — pathological inputs need many layer probes.
- Choosing p too small per layer — fewer layers but each is larger; choose p around 0.5 for size-optimal builds.
- Using non-independent hash functions across layers — false-positive rates compound badly.
- Shipping a cascade without versioning — clients with stale cascades can't recognize new revocations.

## interviewTips
- Cite CRLite (Mozilla, 2017) as the canonical real-world deployment.
- Compare with cuckoo filters (deletable, but no zero-FP variant) and xor filters (smaller still, also static).
- Mention the information-theoretic lower bound — explains why the cascade is near-optimal.

## code.python
```python
import hashlib

class BloomFilter:
    def __init__(self, n, p):
        from math import ceil, log
        self.m = max(1, ceil(-n * log(p) / (log(2) ** 2)))
        self.k = max(1, ceil(self.m / max(1, n) * log(2)))
        self.bits = bytearray((self.m + 7) // 8)
    def _hashes(self, x):
        h = hashlib.sha256(x.encode()).digest()
        for i in range(self.k):
            yield int.from_bytes(h[(i*4) % 28: (i*4) % 28 + 4], "big") % self.m
    def add(self, x):
        for i in self._hashes(x):
            self.bits[i // 8] |= 1 << (i & 7)
    def __contains__(self, x):
        return all(self.bits[i // 8] & (1 << (i & 7)) for i in self._hashes(x))

def build_cascade(R, V, p=0.5):
    layers = []
    while R:
        bf = BloomFilter(len(R), p)
        for x in R: bf.add(x)
        layers.append(bf)
        R, V = [v for v in V if v in bf], R
    return layers

def query(layers, x):
    for i, bf in enumerate(layers):
        if x not in bf:
            return i % 2 == 1
    return len(layers) % 2 == 1
```

## code.javascript
```javascript
const crypto = require("crypto");

class BloomFilter {
  constructor(n, p) {
    this.m = Math.max(1, Math.ceil((-n * Math.log(p)) / Math.log(2) ** 2));
    this.k = Math.max(1, Math.ceil((this.m / Math.max(1, n)) * Math.log(2)));
    this.bits = new Uint8Array(Math.ceil(this.m / 8));
  }
  *_hashes(x) {
    const h = crypto.createHash("sha256").update(x).digest();
    for (let i = 0; i < this.k; i++) {
      yield h.readUInt32BE((i * 4) % 28) % this.m;
    }
  }
  add(x) { for (const i of this._hashes(x)) this.bits[i >> 3] |= 1 << (i & 7); }
  has(x) { for (const i of this._hashes(x)) if (!(this.bits[i >> 3] & (1 << (i & 7)))) return false; return true; }
}

function buildCascade(R, V, p = 0.5) {
  const layers = [];
  while (R.length) {
    const bf = new BloomFilter(R.length, p);
    for (const x of R) bf.add(x);
    layers.push(bf);
    const next = V.filter((v) => bf.has(v));
    [R, V] = [next, R];
  }
  return layers;
}
```

## code.java
```java
import java.security.MessageDigest;
import java.util.*;

public class BloomCascade {
    static class BF {
        final int m, k;
        final byte[] bits;
        BF(int n, double p) {
            this.m = Math.max(1, (int) Math.ceil(-n * Math.log(p) / Math.pow(Math.log(2), 2)));
            this.k = Math.max(1, (int) Math.ceil((double) m / Math.max(1, n) * Math.log(2)));
            this.bits = new byte[(m + 7) / 8];
        }
        int[] hashes(String x) {
            try {
                byte[] h = MessageDigest.getInstance("SHA-256").digest(x.getBytes());
                int[] out = new int[k];
                for (int i = 0; i < k; i++) {
                    int off = (i * 4) % 28;
                    int v = ((h[off] & 0xff) << 24) | ((h[off+1] & 0xff) << 16)
                          | ((h[off+2] & 0xff) << 8) | (h[off+3] & 0xff);
                    out[i] = Math.floorMod(v, m);
                }
                return out;
            } catch (Exception e) { throw new RuntimeException(e); }
        }
        void add(String x) { for (int i : hashes(x)) bits[i >> 3] |= 1 << (i & 7); }
        boolean has(String x) {
            for (int i : hashes(x)) if ((bits[i >> 3] & (1 << (i & 7))) == 0) return false;
            return true;
        }
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <cmath>
#include <functional>

struct BF {
    int m, k;
    std::vector<uint8_t> bits;
    BF(int n, double p) {
        m = std::max(1, (int)std::ceil(-n * std::log(p) / std::pow(std::log(2), 2)));
        k = std::max(1, (int)std::ceil((double)m / std::max(1, n) * std::log(2)));
        bits.assign((m + 7) / 8, 0);
    }
    std::vector<int> hashes(const std::string& x) const {
        std::vector<int> out(k);
        std::hash<std::string> h;
        size_t base = h(x);
        for (int i = 0; i < k; i++) out[i] = (base + i * 0x9e3779b97f4a7c15ULL) % m;
        return out;
    }
    void add(const std::string& x) {
        for (int i : hashes(x)) bits[i >> 3] |= 1 << (i & 7);
    }
    bool has(const std::string& x) const {
        for (int i : hashes(x)) if (!(bits[i >> 3] & (1 << (i & 7)))) return false;
        return true;
    }
};
```
