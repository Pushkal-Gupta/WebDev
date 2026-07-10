---
slug: string-hashing
module: strings-matching
title: String Hashing (Rabin-Karp)
subtitle: Compare substrings in O(1) after O(n) preprocessing — polynomial rolling hash with mod p.
difficulty: Intermediate
position: 19
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Strings chapter"
    url: "https://algs4.cs.princeton.edu/50strings/"
    type: book
  - title: "cp-algorithms — String processing"
    url: "https://cp-algorithms.com/string/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — strings/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/strings"
    type: repo
status: published
---

## intro
A **polynomial rolling hash** turns a string into a number such that two equal substrings give the same number (with high probability). Build a prefix-hash array in O(n) and you can compare any two substrings in O(1). The Rabin-Karp algorithm then matches a pattern of length m in a text of length n in expected O(n + m).

## whyItMatters
Once you have O(1) substring equality, a swarm of problems become easy:
- **Find all occurrences of a pattern** — Rabin-Karp directly.
- **Longest repeated substring** — binary-search the answer length and check by hashing.
- **Group anagrams / palindromic substrings** — hash-and-bucket.
- **Substring equality across versions** — diff tools.
- **Detect content duplicates** (Bloom-filter-adjacent).

For senior interviews, hashing is the elegant alternative to suffix array / KMP / Z. Three lines of preprocessing, one line per query.

## intuition
Think of a string the way you think of a decimal number. `"347"` means 3·10² + 4·10¹ + 7·10⁰ — the digits are the same symbols everywhere, but their *position* scales them by powers of the base. A polynomial rolling hash does exactly this with letters instead of digits and a chosen base `b` instead of 10: each character contributes its code times a power of `b`, so two strings can only collapse to the same number if they agree symbol-for-symbol (until the modulus folds two genuinely different strings together, which is the rare collision we accept).

Treat the string as a polynomial in some base `b` (e.g., 31 or 53), evaluated mod a large prime p:
```
hash(s) = s[0]·b^(n-1) + s[1]·b^(n-2) + ... + s[n-1]·b^0  (mod p)
```
Build prefix hashes `H[i] = hash(s[0..i-1])`. Then
```
hash(s[l..r-1]) = (H[r] - H[l] · b^(r-l)) mod p
```
is O(1) after the prefix array and a power-of-b table are precomputed.

Work a tiny example in base 10 to *see* what the subtraction is doing. For `s = "1234"`, the prefix values are `H[2] = 12` and `H[4] = 1234`. The substring `"34"` has hash `34`, and the formula recovers it exactly: `H[4] - H[2]·10^(4-2) = 1234 - 12·100 = 34`. That is what's actually happening — `H[r]` still carries the whole prefix `s[0..l-1]` sitting in its high-order positions, and multiplying `H[l]` by `b^(r-l)` re-aligns that prefix to the *same* high-order positions so the subtraction cancels it cleanly, leaving only the digits of the window shifted down to position zero. No matter how long the window is, one multiply and one subtract expose its hash.

To reduce collision risk, **use two different (base, mod) pairs** and compare the pair — false positive probability becomes ~1/p² ≈ 10^-18 with p ≈ 10^9.

## visualization
```
s = "abcabc", b = 31, mod = 10^9 + 7

H[0] = 0
H[1] = (0 * 31 + 'a') mod p = 97
H[2] = (97 * 31 + 'b') mod p = 3105
H[3] = (3105 * 31 + 'c') mod p = ...
...

hash("abc")  = H[3] - H[0] * 31^3                (modular)
hash("bca")  = H[4] - H[1] * 31^3
hash("cab")  = H[5] - H[2] * 31^3
```

## bruteForce
Naive substring compare: O(min(|a|, |b|)) per pair. For q queries on n-length strings: O(n · q). Hashing makes each query O(1) after O(n) prep.

## optimal
```
def build_hash(s, b=31, mod=10**9 + 7):
    n = len(s)
    H = [0] * (n + 1)
    P = [1] * (n + 1)
    for i in range(n):
        H[i + 1] = (H[i] * b + ord(s[i])) % mod
        P[i + 1] = (P[i] * b) % mod
    return H, P, mod

def substring_hash(H, P, mod, l, r):
    # hash of s[l..r-1], 0-indexed
    return (H[r] - H[l] * P[r - l]) % mod

def equal(H, P, mod, l1, r1, l2, r2):
    if r1 - l1 != r2 - l2: return False
    return substring_hash(H, P, mod, l1, r1) == substring_hash(H, P, mod, l2, r2)
```

Correctness rests on one invariant: `H[i]` is the base-`b` value of the prefix `s[0..i-1]` reduced mod `p`, built by Horner's rule `H[i+1] = H[i]·b + ord(s[i])`. Because Horner multiplies the running total by `b` *before* adding each new character, every earlier character has already been shifted up by exactly the right power by the time the loop ends. Two equal substrings therefore always produce equal hashes — there are no false negatives; two unequal substrings collide only when their difference happens to be a multiple of `p`, which for random inputs is ~1/p. The `P` table caches `b^k mod p` so a query never recomputes a power.

Complexity intuition: the build loop touches each character once, giving O(n) time and two O(n) arrays of space; each query is a fixed handful of multiplies plus one subtraction, so it is O(1) regardless of the window length. That constant-time query is precisely what collapses an O(n·q) naive-comparison workload down to O(n + q) — you pay the linear preprocessing once, then answer every substring question for free.

For double hashing, run two independent (b, mod) instances and compare both. Twice the storage, near-zero collision probability.

For **rolling-window pattern match** (Rabin-Karp), maintain a window hash that you update in O(1) when sliding by one character — no prefix array needed.

## complexity
- **Build prefix hash**: O(n) time, O(n) space.
- **Substring hash query**: O(1) after build.
- **Substring equality**: O(1).
- **Collision probability** with one (b, mod) pair where mod ≈ 10^9: ~1/p per random pair ≈ 10^-9. Acceptable for most uses; double-hash to be safe.
- **Adversarial inputs**: there exist crafted strings that collide reliably with known (b, mod). For safety, randomize the base or mod at startup.

## pitfalls
- **Modular subtraction**: `(H[r] - H[l] * P[r-l]) mod p` can go negative in many languages. Add `mod` then mod again.
- **Using one (b, mod) pair against adversarial input**: an attacker can construct collisions. Randomize the base per run for hostile environments.
- **Forgetting to also compare lengths**: two strings of different lengths can collide-by-coincidence.
- **Picking small primes**: mod = 10^6 + 3 gives birthday collisions at n ~ √mod ≈ 1000. Use 10^9 + 7 or larger.
- **Mixing case / encoding**: hash of "Hello" ≠ "hello". Normalize upfront if equality should ignore case.

## interviewTips
- For "find all occurrences of pattern p in text t," lead with Rabin-Karp; mention KMP and Z as deterministic alternatives.
- For "longest repeated substring," propose binary-search + hashing — interviewers love the technique pairing.
- For double-hashing, justify the false-positive math: ~1/p² ≈ 10^-18 is effectively zero.
- For senior interviews, mention the **suffix array + LCP** alternative for the same problem space, and discuss the tradeoffs (hashing is simpler to code; suffix arrays have deterministic guarantees).

## code.python
```python
def build_hash(s, b=131, mod=(1 << 61) - 1):
    n = len(s)
    H = [0] * (n + 1)
    P = [1] * (n + 1)
    for i, c in enumerate(s):
        H[i + 1] = (H[i] * b + ord(c)) % mod
        P[i + 1] = (P[i] * b) % mod
    return H, P, mod

def get(H, P, mod, l, r):
    return (H[r] - H[l] * P[r - l]) % mod

s = "abcabcd"
H, P, mod = build_hash(s)
print(get(H, P, mod, 0, 3) == get(H, P, mod, 3, 6))   # True (both "abc")
```

## code.javascript
```javascript
const MOD = (1n << 61n) - 1n;
function buildHash(s, b = 131n) {
  const n = s.length;
  const H = new Array(n + 1).fill(0n);
  const P = new Array(n + 1).fill(1n);
  for (let i = 0; i < n; i++) {
    H[i + 1] = (H[i] * b + BigInt(s.charCodeAt(i))) % MOD;
    P[i + 1] = (P[i] * b) % MOD;
  }
  return { H, P };
}
function get({ H, P }, l, r) { return (H[r] - H[l] * P[r - l] % MOD + MOD * MOD) % MOD; }
```

## code.java
```java
class StringHash {
    static final long MOD = (1L << 61) - 1;
    long[] H, P;
    StringHash(String s, long b) {
        int n = s.length();
        H = new long[n + 1]; P = new long[n + 1];
        P[0] = 1;
        for (int i = 0; i < n; i++) {
            H[i + 1] = (mulMod(H[i], b) + s.charAt(i)) % MOD;
            P[i + 1] = mulMod(P[i], b);
        }
    }
    long get(int l, int r) {
        long v = (H[r] - mulMod(H[l], P[r - l])) % MOD;
        return v < 0 ? v + MOD : v;
    }
    static long mulMod(long a, long b) {
        return java.math.BigInteger.valueOf(a).multiply(java.math.BigInteger.valueOf(b)).mod(java.math.BigInteger.valueOf(MOD)).longValue();
    }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
const long long MOD = (1LL << 61) - 1;
struct StringHash {
    std::vector<long long> H, P;
    StringHash(const std::string& s, long long b = 131) {
        int n = s.size();
        H.assign(n + 1, 0); P.assign(n + 1, 1);
        for (int i = 0; i < n; i++) {
            H[i + 1] = ((__int128) H[i] * b + s[i]) % MOD;
            P[i + 1] = ((__int128) P[i] * b) % MOD;
        }
    }
    long long get(int l, int r) {
        long long v = (H[r] - (__int128) H[l] * P[r - l]) % MOD;
        return v < 0 ? v + MOD : v;
    }
};
```
