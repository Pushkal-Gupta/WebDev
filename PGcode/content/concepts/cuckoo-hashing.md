---
slug: cuckoo-hashing
module: hashing
title: Cuckoo Hashing
subtitle: Two hash functions, two tables, guaranteed O(1) worst-case lookups via displace-on-collision.
difficulty: Advanced
position: 30
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 11: Hash Tables (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap11/"
    type: book
  - title: "cp-algorithms — String hashing & hash maps"
    url: "https://cp-algorithms.com/string/string-hashing.html"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/hashing/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/hashing"
    type: repo
status: published
---

## intro
Cuckoo hashing is a closed-address scheme that delivers something most hash tables cannot: O(1) worst-case lookup, not just amortized. Each key has exactly two candidate slots — one in table T1 via hash h1, one in table T2 via hash h2. A search probes both slots and stops; an insert displaces whatever sat there, evicting it to its alternative slot, recursively, like a cuckoo chick kicking the host egg out of the nest.

## whyItMatters
Routers, network switches, and JIT compiler symbol tables need predictable lookup latency — amortized bounds break real-time guarantees when a rare rehash spikes a request to milliseconds. Cuckoo hashing makes the worst case constant. It also underpins modern hardware-accelerated caches (DPDK, eBPF maps) and is the basis for the cuckoo filter, a replacement for Bloom filters that supports deletion.

## intuition
Imagine two parking lots, each spot indexed by a different hash of your license plate. When you arrive, you must occupy one of your two spots. If both are full, you park anyway in spot one, kick that car out, and force it to drive to its alternative spot. If that spot is also full, the displacement cascades. As long as the table is below ~50% load, the cascade terminates quickly. When it doesn't, you rebuild with new hash functions — rare, but possible.

## visualization
```
keys: A(h1=0,h2=3)  B(h1=1,h2=0)  C(h1=0,h2=2)

Insert A:  T1[0]=A  T2 empty
Insert B:  T1[1]=B  T2 empty
Insert C:  T1[0] occupied by A
           place C at T1[0], evict A
           A -> T2[3]
           T1: [C, B, _, _]   T2: [_, _, _, A]

Lookup B:  check T1[1] -> B. done in 2 probes max, always.
```

## bruteForce
A standard chained hash table handles collisions by linking entries in per-bucket lists. Inserts are O(1) amortized, but lookups degrade to O(k) when k keys collide, and adversarial keys can force every operation to O(n). Linear probing fares no better under heavy load: clustering means a lookup might walk dozens of slots. Both schemes give up worst-case guarantees in exchange for simpler code — fine for averages, fatal for real-time systems.

## optimal
Maintain two tables T1, T2 of size m each (total 2m slots) and two independent hash functions h1, h2. Define a max-displacement constant MAX_LOOP (typically O(log m)).

```
lookup(x):
    return T1[h1(x)] == x or T2[h2(x)] == x

insert(x):
    for i in 1..MAX_LOOP:
        if T1[h1(x)] is empty: T1[h1(x)] = x; return
        swap(x, T1[h1(x)])
        if T2[h2(x)] is empty: T2[h2(x)] = x; return
        swap(x, T2[h2(x)])
    rehash with new h1, h2 and reinsert all keys including x
```

Lookups touch exactly two slots — worst case 2 cache-line reads. Inserts are amortized O(1) when load < 0.5. Rehash cost amortizes away because it happens at most O(1/m) per insert.

## complexity
time: lookup O(1) worst-case (2 probes); delete O(1) worst-case; insert O(1) amortized, expected O(log n) per displacement chain
space: O(n) with constant factor ~2× (load factor capped at 0.5 for two-table variant; ~0.91 for four-way d-ary cuckoo)
notes: Above load factor 0.5 the failure (cycle) probability rises sharply. Production implementations use d=4 hash functions or bucketized cuckoo (b=4 slots per bucket) which pushes the safe load to ~0.95.

## pitfalls
- Picking h1 and h2 from the same family — correlated hashes cause permanent cycles. Use independent universal families.
- Loading past 50% — failure rate explodes; insert latency tail grows from microseconds to milliseconds.
- Forgetting to cap MAX_LOOP — pathological inputs can loop indefinitely; always trigger a rehash on cap.
- Ignoring the rehash cost in real-time analysis — even though it amortizes, a single rehash blocks for O(n).
- Implementing only one table with two hash functions — that's a different scheme (two-choice hashing) with weaker guarantees.

## interviewTips
- Lead with the headline: "Cuckoo hashing gives O(1) *worst-case* lookup, which chaining and linear probing can't."
- Compare to Bloom filter when the topic is set membership: cuckoo filters support deletion and have better space at high load.
- Mention the cycle-detection trick (MAX_LOOP = c·log n) and what happens on failure (rehash with new functions).
- If asked about deletes, point out cuckoo handles them trivially — unlike linear probing, no tombstones required.

## code.python
```python
import random

class CuckooHash:
    def __init__(self, size=16, max_loop=None):
        self.size = size
        self.t1 = [None] * size
        self.t2 = [None] * size
        self.max_loop = max_loop or max(8, (size).bit_length() * 4)
        self._reseed()

    def _reseed(self):
        self.a1 = random.randint(1, 1 << 30)
        self.a2 = random.randint(1, 1 << 30)

    def _h1(self, x): return (hash(x) ^ self.a1) % self.size
    def _h2(self, x): return (hash(x) ^ self.a2) % self.size

    def lookup(self, x):
        return self.t1[self._h1(x)] == x or self.t2[self._h2(x)] == x

    def insert(self, x):
        if self.lookup(x): return
        for _ in range(self.max_loop):
            i = self._h1(x)
            x, self.t1[i] = self.t1[i], x
            if x is None: return
            j = self._h2(x)
            x, self.t2[j] = self.t2[j], x
            if x is None: return
        self._rehash(x)

    def _rehash(self, leftover):
        items = [v for v in self.t1 + self.t2 if v is not None] + [leftover]
        self.size *= 2
        self.t1 = [None] * self.size
        self.t2 = [None] * self.size
        self._reseed()
        for item in items:
            self.insert(item)
```

## code.javascript
```javascript
class CuckooHash {
  constructor(size = 16) {
    this.size = size;
    this.t1 = new Array(size).fill(null);
    this.t2 = new Array(size).fill(null);
    this.maxLoop = Math.max(8, Math.ceil(Math.log2(size)) * 4);
    this.reseed();
  }
  reseed() {
    this.a1 = (Math.random() * 2 ** 30) | 0;
    this.a2 = (Math.random() * 2 ** 30) | 0;
  }
  h1(x) { return ((this.hashCode(x) ^ this.a1) >>> 0) % this.size; }
  h2(x) { return ((this.hashCode(x) ^ this.a2) >>> 0) % this.size; }
  hashCode(x) {
    const s = String(x); let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
    return h >>> 0;
  }
  lookup(x) { return this.t1[this.h1(x)] === x || this.t2[this.h2(x)] === x; }
  insert(x) {
    if (this.lookup(x)) return;
    for (let k = 0; k < this.maxLoop; k++) {
      let i = this.h1(x); [x, this.t1[i]] = [this.t1[i], x];
      if (x === null) return;
      let j = this.h2(x); [x, this.t2[j]] = [this.t2[j], x];
      if (x === null) return;
    }
    this.rehash(x);
  }
  rehash(leftover) {
    const items = [...this.t1, ...this.t2].filter(v => v !== null);
    items.push(leftover);
    this.size *= 2;
    this.t1 = new Array(this.size).fill(null);
    this.t2 = new Array(this.size).fill(null);
    this.reseed();
    for (const v of items) this.insert(v);
  }
}
```

## code.java
```java
public class CuckooHash<K> {
    private Object[] t1, t2;
    private int size, maxLoop, a1, a2;
    private final Random rng = new Random();

    public CuckooHash(int size) {
        this.size = size;
        this.t1 = new Object[size];
        this.t2 = new Object[size];
        this.maxLoop = Math.max(8, (Integer.SIZE - Integer.numberOfLeadingZeros(size)) * 4);
        reseed();
    }
    private void reseed() { a1 = rng.nextInt(); a2 = rng.nextInt(); }
    private int h1(K x) { return Math.floorMod(x.hashCode() ^ a1, size); }
    private int h2(K x) { return Math.floorMod(x.hashCode() ^ a2, size); }

    @SuppressWarnings("unchecked")
    public boolean lookup(K x) {
        return x.equals(t1[h1(x)]) || x.equals(t2[h2(x)]);
    }

    @SuppressWarnings("unchecked")
    public void insert(K x) {
        if (lookup(x)) return;
        for (int k = 0; k < maxLoop; k++) {
            int i = h1(x); K tmp = (K) t1[i]; t1[i] = x; x = tmp;
            if (x == null) return;
            int j = h2(x); tmp = (K) t2[j]; t2[j] = x; x = tmp;
            if (x == null) return;
        }
        rehash(x);
    }

    @SuppressWarnings("unchecked")
    private void rehash(K leftover) {
        List<K> items = new ArrayList<>();
        for (Object v : t1) if (v != null) items.add((K) v);
        for (Object v : t2) if (v != null) items.add((K) v);
        items.add(leftover);
        size *= 2;
        t1 = new Object[size]; t2 = new Object[size];
        reseed();
        for (K v : items) insert(v);
    }
}
```

## code.cpp
```cpp
template<typename K>
class CuckooHash {
    vector<optional<K>> t1, t2;
    size_t sz;
    int a1, a2, maxLoop;
    mt19937 rng{random_device{}()};

    void reseed() { a1 = rng(); a2 = rng(); }
    size_t h1(const K& x) const { return (hash<K>{}(x) ^ a1) % sz; }
    size_t h2(const K& x) const { return (hash<K>{}(x) ^ a2) % sz; }

public:
    CuckooHash(size_t size = 16) : t1(size), t2(size), sz(size) {
        maxLoop = max(8, (int)__lg(size) * 4);
        reseed();
    }

    bool lookup(const K& x) const {
        return (t1[h1(x)] && *t1[h1(x)] == x) || (t2[h2(x)] && *t2[h2(x)] == x);
    }

    void insert(K x) {
        if (lookup(x)) return;
        for (int k = 0; k < maxLoop; k++) {
            swap(x, *(t1[h1(x)] ? &*t1[h1(x)] : &(t1[h1(x)] = x).value()));
            if (!t1[h1(x)]) return;
            auto i = h2(x);
            if (!t2[i]) { t2[i] = x; return; }
            swap(x, *t2[i]);
        }
        rehash(x);
    }

    void rehash(K leftover) {
        vector<K> items;
        for (auto& v : t1) if (v) items.push_back(*v);
        for (auto& v : t2) if (v) items.push_back(*v);
        items.push_back(leftover);
        sz *= 2;
        t1.assign(sz, {}); t2.assign(sz, {});
        reseed();
        for (auto& v : items) insert(v);
    }
};
```
