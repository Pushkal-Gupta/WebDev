---
slug: hash-rolling-rabin-karp
module: hashing
title: Rolling Hash & Rabin-Karp
subtitle: Slide a polynomial hash across a string in O(1) per step — the engine behind Rabin-Karp substring search and many dedup pipelines.
difficulty: Intermediate
position: 41
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — String matching with finite automata"
    url: "https://walkccc.me/CLRS/Chap32/"
    type: book
  - title: "cp-algorithms — String hashing"
    url: "https://cp-algorithms.com/string/string-hashing.html"
    type: blog
  - title: "TheAlgorithms/Python — Rabin-Karp"
    url: "https://github.com/TheAlgorithms/Python/blob/master/strings/rabin_karp.py"
    type: repo
status: published
---

## intro
A **rolling hash** lets you compute the hash of every length-K window in a string in total O(N) time — each new window's hash derived from the previous one in O(1). Backbone of **Rabin-Karp** substring search, plagiarism detection (Moss), rsync's block deduplication, and competitive-programming string toolkits.

## whyItMatters
Naive substring search compares `K` characters at each of `N` positions — `O(NK)`, which is too slow for log-scanning, deduplication, and content-defined chunking on production data. Rabin-Karp (Karp and Rabin 1987) gets to `O(N + K)` average via rolling hashes: compute the pattern hash once, slide a same-length window across the text, compare hashes in `O(1)`, only do full character comparison on hash collision. The same trick underlies rsync's content-defined chunking, restic and BorgBackup's deduplication, Git's pack-file delta detection, Aho-Corasick's multi-pattern extension, and the Karp-Rabin fingerprinting algorithm used by MOSS for plagiarism detection. Bioinformatics tools (Bowtie, BWA) use rolling hashes for fast seed lookup over the human genome.

## intuition
Treat a length-`k` string as a base-`p` number modulo a large prime `m`: `H = s[0] * p^{k-1} + s[1] * p^{k-2} + ... + s[k-1] * p^0 (mod m)`. Two strings are equal iff their characters match. If the hash function is collision-resistant, two strings whose hashes differ are guaranteed unequal; two strings whose hashes match are *probably* equal — you confirm with a character-by-character compare.

The rolling part is what makes the algorithm fast. When the window slides right by one position (drop `s[i]`, add `s[i+k]`), the new hash can be computed from the old hash with two multiplications and one addition: `H_new = (H_old - s[i] * p^{k-1}) * p + s[i+k] (mod m)`. So each step costs `O(1)` instead of recomputing the whole hash in `O(k)`. Precompute `p^{k-1} mod m` once at the start and you never recompute it.

The probabilistic guarantee depends on the modulus. With a single 30-bit prime, the false-positive rate is around `1 / 10^9` per comparison; over `N = 10^6` text positions you expect roughly one collision, which you handle with a full string compare. With *double hashing* (two `(p, m)` pairs and require both to match), the collision probability drops to `1 / (m_1 * m_2)` which for two `~10^9` primes is around `10^{-18}` — practically impossible. For adversarial inputs (e.g. competitive-programming hack rounds), randomize `p` so the attacker cannot pre-compute colliding strings.

## visualization
```
Text   : a b c a b c d
Pattern: c d
k = 2, p = 31, m = some large prime

H(pattern) = ord('c')*31 + ord('d')  = const

Window 0: "ab" → H = ord('a')*31 + ord('b')
Slide:    drop 'a' from leftmost slot, shift everyone left, add 'b' ...
          H_new = (H - ord('a')*31) * 31 + ord('b')
Window 1: "bc" → H = ord('b')*31 + ord('c')
Window 2: "ca" → ...
...
Window 5: "cd" → matches H(pattern) → verify char-by-char.
```

## bruteForce
**Naive substring search**: O(NK).

**Compute each window's hash from scratch**: O(NK) again — the rolling hash specifically is what gives O(1) per shift.

**Use Python's str.find()**: typically optimized (Boyer-Moore variants) and is the right tool for one-off use; rolling hash is for the cases where you need *all* matches or *all* window hashes.

## optimal
Use double hashing with two random primes. For each window, compare both hashes; only on a double match run the full character compare. Worst case is `O(NK)` (adversarial input forces full compares); expected and amortized case is `O(N + K)` for single-pattern search.

```python
import random

MOD1, MOD2 = 10**9 + 7, 10**9 + 9
BASE1, BASE2 = random.randint(257, 10**8), random.randint(257, 10**8)

def rabin_karp(text, pattern):
    n, k = len(text), len(pattern)
    if k > n: return []
    def hashes_of(s):
        h1 = h2 = 0
        for ch in s:
            h1 = (h1 * BASE1 + ord(ch)) % MOD1
            h2 = (h2 * BASE2 + ord(ch)) % MOD2
        return h1, h2
    p1, p2 = pow(BASE1, k - 1, MOD1), pow(BASE2, k - 1, MOD2)
    tgt1, tgt2 = hashes_of(pattern)
    cur1, cur2 = hashes_of(text[:k])
    hits = []
    for i in range(n - k + 1):
        if cur1 == tgt1 and cur2 == tgt2 and text[i:i+k] == pattern:
            hits.append(i)
        if i + k < n:
            cur1 = ((cur1 - ord(text[i]) * p1) * BASE1 + ord(text[i+k])) % MOD1
            cur2 = ((cur2 - ord(text[i]) * p2) * BASE2 + ord(text[i+k])) % MOD2
    return hits
```

The critical line is the rolling-hash update: `(cur - ord(text[i]) * p1) * BASE1 + ord(text[i+k])`. Subtract the outgoing character's contribution (premultiplied by `p1 = BASE^{k-1}`), multiply by the base to shift everything left, then add the incoming character. The `% MOD` at the end keeps the values bounded. Randomizing `BASE` at program startup defeats the standard anti-hash attack where an adversary crafts inputs that collide under a publicly known base. For multi-pattern search switch to Aho-Corasick (also `O(N + K + Z)` for `Z` matches); for plagiarism detection or content-defined chunking, use the Karp-Rabin fingerprint set (winnowing) which keeps a representative subset of hashes per document.

## complexity
- **Time:** O(N + K) average, O(NK) worst case (adversarial collisions).
- **Space:** O(1).
- **Collision probability** with double hash + two ~10^9 primes: ~10^-18 per comparison — negligible.

## pitfalls
- **Negative values after subtraction in modular arithmetic**: `H - s[i]*p^(k-1)` may be negative. Add `m` before multiplying.
- **Using only one hash on adversarial input**: someone crafting collisions can degrade to O(NK). Use double hash with random primes.
- **Forgetting `mod m` on intermediate multiplications**: overflow. Use `(a * b) % m` aggressively or `__int128` in C++.
- **Choosing p ≤ alphabet size**: collisions become trivial. Use p > 256 for byte strings, p > 26 or 31 for lowercase ASCII.
- **Treating equal hashes as definitive match**: always verify char-by-char on hash hit.

## interviewTips
- For "find pattern in text" → mention KMP, Z-algorithm, Rabin-Karp. Pick KMP for deterministic single-pattern; Rabin-Karp for multiple patterns or near-dup detection.
- Cite **double-hashing** to address "what about collisions?".
- For senior interviews, discuss **rsync's rolling hash**, **Boyer-Moore** comparison, **suffix arrays/automaton** for multi-pattern.

## code.python
```python
def rabin_karp(text: str, pattern: str):
    n, k = len(text), len(pattern)
    if k > n: return []
    p, m = 131, (1 << 61) - 1
    p_pow_k = pow(p, k - 1, m)
    h_pat = 0
    for c in pattern:
        h_pat = (h_pat * p + ord(c)) % m
    h_win = 0
    for i in range(k):
        h_win = (h_win * p + ord(text[i])) % m
    matches = []
    for i in range(n - k + 1):
        if h_win == h_pat and text[i:i + k] == pattern:
            matches.append(i)
        if i + k < n:
            h_win = ((h_win - ord(text[i]) * p_pow_k) * p + ord(text[i + k])) % m
            if h_win < 0: h_win += m
    return matches
```

## code.javascript
```javascript
function rabinKarp(text, pattern) {
  const n = text.length, k = pattern.length;
  if (k > n) return [];
  const p = 131n, m = (1n << 61n) - 1n;
  let pPowK = 1n;
  for (let i = 0; i < k - 1; i++) pPowK = (pPowK * p) % m;
  let hPat = 0n, hWin = 0n;
  for (let i = 0; i < k; i++) {
    hPat = (hPat * p + BigInt(pattern.charCodeAt(i))) % m;
    hWin = (hWin * p + BigInt(text.charCodeAt(i))) % m;
  }
  const matches = [];
  for (let i = 0; i <= n - k; i++) {
    if (hWin === hPat && text.slice(i, i + k) === pattern) matches.push(i);
    if (i + k < n) {
      hWin = ((hWin - BigInt(text.charCodeAt(i)) * pPowK) * p + BigInt(text.charCodeAt(i + k))) % m;
      if (hWin < 0n) hWin += m;
    }
  }
  return matches;
}
```

## code.java
```java
static List<Integer> rabinKarp(String text, String pattern) {
    int n = text.length(), k = pattern.length();
    List<Integer> matches = new ArrayList<>();
    if (k > n) return matches;
    long p = 131, m = (1L << 61) - 1;
    long pPowK = 1;
    for (int i = 0; i < k - 1; i++) pPowK = (pPowK * p) % m;
    long hPat = 0, hWin = 0;
    for (int i = 0; i < k; i++) {
        hPat = (hPat * p + pattern.charAt(i)) % m;
        hWin = (hWin * p + text.charAt(i)) % m;
    }
    for (int i = 0; i <= n - k; i++) {
        if (hWin == hPat && text.substring(i, i + k).equals(pattern)) matches.add(i);
        if (i + k < n) {
            hWin = ((hWin - text.charAt(i) * pPowK) % m * p + text.charAt(i + k)) % m;
            if (hWin < 0) hWin += m;
        }
    }
    return matches;
}
```

## code.cpp
```cpp
vector<int> rabin_karp(const string& text, const string& pattern) {
    int n = text.size(), k = pattern.size();
    if (k > n) return {};
    const unsigned long long p = 131;
    unsigned long long p_pow_k = 1;
    for (int i = 0; i < k - 1; i++) p_pow_k *= p;
    unsigned long long h_pat = 0, h_win = 0;
    for (int i = 0; i < k; i++) {
        h_pat = h_pat * p + pattern[i];
        h_win = h_win * p + text[i];
    }
    vector<int> matches;
    for (int i = 0; i <= n - k; i++) {
        if (h_win == h_pat && text.compare(i, k, pattern) == 0) matches.push_back(i);
        if (i + k < n) h_win = (h_win - text[i] * p_pow_k) * p + text[i + k];
    }
    return matches;
}
```
