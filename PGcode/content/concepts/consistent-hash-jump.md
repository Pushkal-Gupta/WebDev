---
slug: consistent-hash-jump
module: system-design
title: Jump Consistent Hash
subtitle: O(1) memory, perfectly balanced shard assignment without a ring or virtual nodes.
difficulty: Advanced
position: 52
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Microservices.io — Sharding & Partitioning"
    url: "https://microservices.io/patterns/data/database-per-service.html"
    type: book
  - title: "Consistent Hashing — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/system-design/consistent-hashing/"
    type: blog
  - title: "donnemartin/system-design-primer — Consistent Hashing"
    url: "https://github.com/donnemartin/system-design-primer#under-the-hood"
    type: repo
status: published
---

## intro
Classic consistent hashing keeps a sorted ring of virtual-node tokens and binary-searches it on every key. Jump consistent hash (Lamping & Veach, 2014) computes the destination bucket in a tight numerical loop with no memory whatsoever — for N buckets and a 64-bit key, it returns the bucket in O(log N) arithmetic ops with perfect balance and minimal disruption on resize.

## whyItMatters
At fleet scale, "build a ring, scatter virtual nodes, binary-search" is hundreds of bytes per shard and a sorted-map lookup per key. Jump hash is a 12-line loop with two state variables. When you have a uniform 64-bit key and a known bucket count, it's faster, simpler, and uses zero memory. Google's Spanner, the Cassandra-style Snitch, and many proxy layers use it under the hood.

## intuition
Imagine you have one bucket. The key obviously goes there. Add a second bucket; with probability 1/2 the key jumps to the new bucket, else stays. Add a third; with probability 1/3 it jumps to bucket 2, else stays. The trick: with a deterministic pseudo-random sequence derived from the key, you can skip ahead — directly computing the *last* bucket where the key would have moved — without iterating every step. That's the "jump" in jump hash.

## visualization
key = 7, buckets = 1 → b=0. Add bucket → maybe jump (random < 1/2). Add bucket → maybe jump (random < 1/3). With the algorithm's jump formula, the loop visits only O(log N) candidate bucket counts instead of N. For N=10000 buckets, that's ~14 iterations regardless of key.

## bruteForce
Classic ring: hash each physical node K times (virtual nodes), sort the tokens, on lookup hash the key and binary-search the next token. Memory: O(N × K). Resize cost: rebuild the ring or splice in K new tokens and remap the keys that now fall between them. Works, but you pay ring memory and a binary search per key forever.

## optimal
Jump hash takes a 64-bit key and a bucket count `num_buckets`, returns a bucket index in [0, num_buckets). The loop maintains a candidate `b` and a probability `j`, advancing only when the random draw says "jump." The crucial property: the same key always lands on the same bucket for the same count, and increasing the count from N to N+1 reassigns exactly the keys that newly fall on bucket N — perfect minimal disruption.

Limits: jump hash assumes buckets are numbered 0..N-1 contiguously. If you want named nodes or weighted buckets, you wrap it (compose with rendezvous hashing for arbitrary node sets). Removing a non-trailing bucket is not free — you have to reshard the keys it owned.

## complexity
time: O(log N) per lookup
space: O(1)
notes: Average operations per call: about 14 for N=10000, 24 for N=1,000,000. Compare with O(log(N·K)) binary search and O(N·K) memory for ring hashing.

## pitfalls
- Keys not uniformly distributed — wrap them with a strong hash (xxhash, murmur) before passing in.
- Wanting to remove an interior bucket — jump hash only supports trailing removals cheaply.
- Mapping bucket indexes directly to mutable server identity — when servers come and go, indirect via a manifest.
- Re-deriving the key stream from a weak RNG — the algorithm relies on the specific LCG constants for balance.
- Using float arithmetic — the canonical implementation uses 64-bit integer multiplications to avoid drift.

## interviewTips
- Cite the Lamping & Veach paper as "Google's jump hash" — interviewers recognize it.
- Compare against rendezvous (highest-random-weight) hashing for cases with named/weighted buckets.
- Note "constant memory" as the real win for proxies and embedded sharders.

## code.python
```python
def jump_consistent_hash(key: int, num_buckets: int) -> int:
    b, j = -1, 0
    while j < num_buckets:
        b = j
        key = (key * 2862933555777941757 + 1) & 0xFFFFFFFFFFFFFFFF
        j = int((b + 1) * (1 << 31) / ((key >> 33) + 1))
    return b

for k in range(5):
    print(k, jump_consistent_hash(k, 10))
```

## code.javascript
```javascript
function jumpConsistentHash(key, numBuckets) {
  let b = -1n, j = 0n;
  let k = BigInt(key);
  const n = BigInt(numBuckets);
  while (j < n) {
    b = j;
    k = (k * 2862933555777941757n + 1n) & 0xFFFFFFFFFFFFFFFFn;
    j = ((b + 1n) * (1n << 31n)) / ((k >> 33n) + 1n);
  }
  return Number(b);
}

for (let k = 0; k < 5; k++) console.log(k, jumpConsistentHash(k, 10));
```

## code.java
```java
public class JumpHash {
    public static int jump(long key, int numBuckets) {
        long b = -1, j = 0;
        while (j < numBuckets) {
            b = j;
            key = key * 2862933555777941757L + 1;
            j = (long) ((b + 1) * ((double) (1L << 31) / ((key >>> 33) + 1)));
        }
        return (int) b;
    }
    public static void main(String[] args) {
        for (long k = 0; k < 5; k++) System.out.println(k + " -> " + jump(k, 10));
    }
}
```

## code.cpp
```cpp
#include <cstdint>
#include <cstdio>

int32_t jump_hash(uint64_t key, int32_t num_buckets) {
    int64_t b = -1, j = 0;
    while (j < num_buckets) {
        b = j;
        key = key * 2862933555777941757ULL + 1;
        j = (int64_t)((b + 1) * (double)(1LL << 31) / ((key >> 33) + 1));
    }
    return (int32_t)b;
}

int main() {
    for (uint64_t k = 0; k < 5; ++k) printf("%llu -> %d\n", (unsigned long long)k, jump_hash(k, 10));
}
```
