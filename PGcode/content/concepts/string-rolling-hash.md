---
slug: string-rolling-hash
module: sorting-strings
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
Substring equality in O(1) unlocks a swarm of problems: longest common substring via binary search, repeated-substring detection, palindromic-substring counts, and many suffix-array alternatives. Rolling hash is also the cleanest way to detect duplicates in a sliding window of fixed length — useful in plagiarism detection, Rsync's content-defined chunking, and competitive substring queries.

## intuition
Treat each character as a digit in base B (B larger than the alphabet, often 131 or a random odd prime). Then h(s) = s[0] * B^(L-1) + s[1] * B^(L-2) + ... + s[L-1], all mod P. To slide the window right by one, you peel off the top "digit," shift left by multiplying by B, and append the new "digit." It's the same trick as updating the polynomial value at a new shift in O(1).

## visualization
Pattern "abc" with B=131, P=10^9+7. Use '$' as a sentinel for end-of-string in examples. h("abc") = 97 * 131^2 + 98 * 131 + 99 = 1,677,755 mod P. Slide to "bcd": new_hash = (1,677,755 - 97 * 131^2) * 131 + 100 mod P. No recomputation from scratch — one subtract, one multiply, one add. For substring equality, precompute prefix hashes H[i] and powers B^k; the hash of s[l..r] = H[r+1] - H[l] * B^(r-l+1) mod P.

## bruteForce
Compare characters one by one. Pattern search is O(n * m); substring equality between two ranges is O(L). Both are correct but lose to rolling hash whenever the same string is queried many times. KMP/Z avoid hashing collisions but require pattern-specific preprocessing.

## optimal
Precompute prefix hashes and powers in O(n). Each "is s[l..r] == s[l'..r']" query becomes one subtract, one multiply, one compare in O(1). To reduce false positives from collisions, use **double hashing**: two independent (B1, P1) and (B2, P2) pairs and treat substrings equal only when both hashes agree. With P near 10^18 combined, collision probability is essentially negligible for n up to 10^6.

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
