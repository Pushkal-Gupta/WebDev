---
slug: string-rolling-hash
module: strings-matching
title: Rolling Hash
subtitle: Rabin-Karp polynomial hashing with double hashing to dodge collisions.
difficulty: Advanced
position: 45
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "String Hashing — cp-algorithms"
    url: "https://cp-algorithms.com/string/string-hashing.html"
    type: blog
  - title: "Rabin-Karp Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/rabin-karp-algorithm-for-pattern-searching/"
    type: blog
  - title: "KACTL — string/Hashing.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/strings/Hashing.h"
    type: repo
status: published
---

## intro
A rolling hash treats a string as a base-B integer modulo a large prime P. The hash of a sliding window of length L can be updated in O(1) when the window advances: subtract the leading character's contribution, multiply by B, add the trailing character. Rabin-Karp uses this trick for substring search; competitive programmers extend it to compare any two substrings in O(1) after O(n) preprocessing.

## whyItMatters
- **Rsync content-defined chunking** uses rolling hashes (originally Adler-32, now BuzHash) to split files into deduplicable blocks; the same trick powers Git's pack-file delta compression and Restic / Borg backups.
- **Plagiarism detection** (Stanford MOSS, Turnitin) hashes overlapping windows of code/text to flag near-duplicate spans across millions of documents.
- **Bioinformatics**: the original Rabin-Karp (1987) was retargeted in tools like Mash, Mash Screen, and the k-mer spectra in Kraken2 for fast genome comparison via min-hash sketches over rolling hashes.
- **Search-engine deduplication**: Google's near-duplicate document detection (Henzinger 2006, SimHash) uses rolling-hash-style shingling before locality-sensitive hashing.
- **Competitive programming**: O(1) substring equality unlocks longest common substring by binary search, repeated-substring detection, palindromic counts (Manacher alternative), and most problems where a suffix array would otherwise be needed.
- Cryptographers also use it as a teaching example for why a single small modulus is dangerous against adversarial input.

## intuition
The technique exists because direct substring comparison is Θ(L) per query — fine for one comparison but catastrophic when the same string is sliced and compared millions of times. The escape route is to represent each substring as a single integer that depends on its content in a collision-resistant way, then compare integers in O(1). Treat each character as a digit in base B (B chosen larger than the alphabet, often 131 or a randomly chosen odd prime) and the substring as a base-B number modulo a large prime P. Then h(s) = s[0]·B^(L-1) + s[1]·B^(L-2) + ... + s[L-1], all mod P.

The "rolling" part is the operational lever. Sliding the window right by one character means peeling off the leading character's contribution (subtract s[0]·B^(L-1)), shifting the remaining digits left by multiplying by B, and adding the new trailing character. That update is O(1) — three arithmetic operations regardless of L. For arbitrary substring queries (not just sliding windows), precompute prefix hashes H[i] = hash(s[0..i-1]) and powers B^k; then hash(s[l..r]) = (H[r+1] − H[l]·B^(r-l+1)) mod P, also O(1).

The deeper principle is the same one behind Karp-Rabin (1987): a polynomial-identity test. Two different strings hash to the same value only if their polynomial difference happens to be divisible by P. For random B over a large prime modulus, this collision probability is ~L/P per comparison, so with P ≈ 10⁹ and L ≈ 10⁶ the false-positive rate is one in a thousand — acceptable for a single query, intolerable for millions. Double hashing (two independent (B, P) pairs) drops the combined collision rate to ~L/(P₁·P₂) ≈ 10⁻¹⁸, effectively zero. Adversarial inputs can craft collisions against a fixed (B, P); randomising B at startup defeats this.

## visualization
Pattern "abc" with B=131, P=10^9+7. Use '$' as a sentinel for end-of-string in examples. h("abc") = 97 * 131^2 + 98 * 131 + 99 = 1,677,755 mod P. Slide to "bcd": new_hash = (1,677,755 - 97 * 131^2) * 131 + 100 mod P. No recomputation from scratch — one subtract, one multiply, one add. For substring equality, precompute prefix hashes H[i] and powers B^k; the hash of s[l..r] = H[r+1] - H[l] * B^(r-l+1) mod P.

## bruteForce
Compare characters one by one. Pattern search is O(n * m); substring equality between two ranges is O(L). Both are correct but lose to rolling hash whenever the same string is queried many times. KMP/Z avoid hashing collisions but require pattern-specific preprocessing.

## optimal
**Technique: prefix-hash precomputation with double hashing for collision resistance.** O(n) preprocessing, O(1) per substring-equality query. Optimal because no algorithm can answer an arbitrary substring-equality query faster than reading the substring length, and prefix hashes circumvent that lower bound by amortising the read across the preprocessing pass.

```python
class DoubleHash:
    def __init__(self, s):
        self.B = (131, 137)
        self.P = (10**9 + 7, 10**9 + 9)
        n = len(s)
        self.H  = [[0] * (n + 1) for _ in range(2)]
        self.pw = [[1] * (n + 1) for _ in range(2)]
        for k in range(2):
            for i, ch in enumerate(s):
                self.H[k][i + 1]  = (self.H[k][i] * self.B[k] + ord(ch)) % self.P[k]
                self.pw[k][i + 1] = self.pw[k][i] * self.B[k] % self.P[k]

    def get(self, l, r):                              # inclusive on both ends
        out = []
        for k in range(2):
            v = (self.H[k][r + 1] - self.H[k][l] * self.pw[k][r - l + 1]) % self.P[k]
            out.append(v)
        return tuple(out)                             # paired hash; equality iff both match
```

Key lines: `H[k][i + 1] = (H[k][i] * B[k] + ord(ch)) % P[k]` builds the prefix hash incrementally — each prefix extends the previous by one character, multiplying by base and adding the new digit. `pw[k][i + 1] = pw[k][i] * B[k] % P[k]` caches powers of B so the query line can compute `B^(r-l+1)` in O(1) instead of O(L). The query `(H[r+1] − H[l]·pw[r-l+1]) % P` is the polynomial-evaluation identity that recovers the substring hash from the two prefix hashes — algebraically, it's subtracting "the prefix-hash contribution before position l" from "the prefix-hash through r".

The double-hash tuple `(v0, v1)` is the collision insurance — two substrings hash equally only if their polynomial differences are divisible by both primes simultaneously, which for independent random bases happens with probability ≈ L/(P₁·P₂) ≈ 10⁻¹⁸ for n ≤ 10⁶. Single-hash variants suffice for non-adversarial inputs; double hashing is essential when an adversary controls the strings (interview judges, competitive programming).

**Why not KMP / Z-function / suffix array?** All deterministic, but solve a more constrained problem — pattern matching against a fixed pattern, or all suffixes in sorted order. Rolling hash answers *arbitrary* substring queries in O(1) after O(n) prep, which neither KMP nor Z provides. Suffix arrays match the same query power but require O(n log n) construction and trickier code. **Why not cryptographic hashes (SHA-256)?** They're 50–100× slower per character and provide guarantees you don't need; polynomial hashing is faster and "good enough" for combinatorial use.

## complexity
time: O(n + m) preprocessing, O(1) per substring-equality query, O(n + m) Rabin-Karp pattern search (amortised), O(n^2) worst case if you only verify on collision.
space: O(n) prefix hashes plus O(n) powers per modulus.
notes: Pick B coprime to P; use a random odd B to defeat adversarial inputs that hand-craft collisions for fixed constants.

## pitfalls
- Using a single small modulus like 10^9 + 7 with a public base: an adversary can construct collisions in seconds. Always randomise B at startup or use double hashing.
- Forgetting modular subtraction: `(H[r+1] - H[l] * pow) % P` can go negative — add P then mod.
- Off-by-one between "prefix hash up to index i exclusive" vs "inclusive." Pick one convention and stay with it.
- Believing the hash *proves* equality. It only suggests it. Verify with a direct compare when the cost matters (production code) or when constant-factor risk is unacceptable.

## interviewTips
- State up front: "I'll precompute prefix hashes so each substring equality is O(1)."
- Mention double hashing the moment collisions enter the discussion.
- Note that KMP / Z give worst-case O(n + m) deterministically; rolling hash gives expected O(n + m) with collision risk — pick by what the prompt values.
- For repeated-substring problems, binary search on length L; for each L, slide a length-L window collecting hashes into a set.

## code.python
```python
def rabin_karp(text, pattern, base=131, mod=10**9 + 7):
    n, m = len(text), len(pattern)
    if m > n:
        return -1
    high = pow(base, m - 1, mod)
    target = 0
    rolling = 0
    for i in range(m):
        target = (target * base + ord(pattern[i])) % mod
        rolling = (rolling * base + ord(text[i])) % mod
    for i in range(n - m + 1):
        if rolling == target and text[i:i + m] == pattern:
            return i
        if i + m < n:
            rolling = ((rolling - ord(text[i]) * high) * base + ord(text[i + m])) % mod
            rolling %= mod
    return -1

class DoubleHash:
    def __init__(self, s):
        self.B = (131, 137)
        self.P = (10**9 + 7, 10**9 + 9)
        n = len(s)
        self.H = [[0] * (n + 1) for _ in range(2)]
        self.pw = [[1] * (n + 1) for _ in range(2)]
        for k in range(2):
            for i, ch in enumerate(s):
                self.H[k][i + 1] = (self.H[k][i] * self.B[k] + ord(ch)) % self.P[k]
                self.pw[k][i + 1] = self.pw[k][i] * self.B[k] % self.P[k]

    def get(self, l, r):
        out = []
        for k in range(2):
            v = (self.H[k][r + 1] - self.H[k][l] * self.pw[k][r - l + 1]) % self.P[k]
            out.append(v)
        return tuple(out)
```

## code.javascript
```javascript
function rabinKarp(text, pattern, base = 131n, mod = 1000000007n) {
  const n = text.length, m = pattern.length;
  if (m > n) return -1;
  let high = 1n;
  for (let i = 0; i < m - 1; i++) high = (high * base) % mod;
  let target = 0n, rolling = 0n;
  for (let i = 0; i < m; i++) {
    target = (target * base + BigInt(pattern.charCodeAt(i))) % mod;
    rolling = (rolling * base + BigInt(text.charCodeAt(i))) % mod;
  }
  for (let i = 0; i <= n - m; i++) {
    if (rolling === target && text.substr(i, m) === pattern) return i;
    if (i + m < n) {
      rolling = ((rolling - BigInt(text.charCodeAt(i)) * high) * base + BigInt(text.charCodeAt(i + m))) % mod;
      if (rolling < 0n) rolling += mod;
    }
  }
  return -1;
}
```

## code.java
```java
public int rabinKarp(String text, String pattern) {
    long base = 131, mod = 1_000_000_007L;
    int n = text.length(), m = pattern.length();
    if (m > n) return -1;
    long high = 1, target = 0, rolling = 0;
    for (int i = 0; i < m - 1; i++) high = (high * base) % mod;
    for (int i = 0; i < m; i++) {
        target = (target * base + pattern.charAt(i)) % mod;
        rolling = (rolling * base + text.charAt(i)) % mod;
    }
    for (int i = 0; i <= n - m; i++) {
        if (rolling == target && text.regionMatches(i, pattern, 0, m)) return i;
        if (i + m < n) {
            rolling = ((rolling - text.charAt(i) * high) * base + text.charAt(i + m)) % mod;
            if (rolling < 0) rolling += mod;
        }
    }
    return -1;
}
```

## code.cpp
```cpp
int rabinKarp(const string& text, const string& pattern) {
    const long long base = 131, mod = 1000000007LL;
    int n = text.size(), m = pattern.size();
    if (m > n) return -1;
    long long high = 1, target = 0, rolling = 0;
    for (int i = 0; i < m - 1; i++) high = (high * base) % mod;
    for (int i = 0; i < m; i++) {
        target = (target * base + pattern[i]) % mod;
        rolling = (rolling * base + text[i]) % mod;
    }
    for (int i = 0; i <= n - m; i++) {
        if (rolling == target && text.compare(i, m, pattern) == 0) return i;
        if (i + m < n) {
            rolling = ((rolling - text[i] * high) * base + text[i + m]) % mod;
            if (rolling < 0) rolling += mod;
        }
    }
    return -1;
}
```
