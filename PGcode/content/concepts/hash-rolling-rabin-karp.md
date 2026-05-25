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
Naive substring search: at each of N positions, compare K characters → O(NK). Rabin-Karp gets to O(N+K) average via hashing: compute the pattern's hash once, slide a same-length window across the text, compare hashes (O(1)), only do full character comparison on hash collision.

Rolling hash also enables:
- Finding longest common substring via binary search + hash comparison.
- Detecting near-duplicate documents (Moss, Karp-Rabin fingerprinting).
- rsync's content-defined chunking.

## intuition
**Polynomial hash** of string s[0..k-1]:
```
H = s[0]*p^(k-1) + s[1]*p^(k-2) + ... + s[k-1]*p^0   (mod m)
```
where `p` is a small prime (31, 53) and `m` is a large prime (~10^9 + 7) — or use modular arithmetic over 2^64 with unsigned overflow.

When the window slides right by one position (drop s[i], add s[i+k]):
```
H_new = (H_old - s[i]*p^(k-1)) * p + s[i+k]   (mod m)
```
O(1) update. Precompute `p^(k-1) mod m` once.

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
**Double-hashing**: hash with two (p, m) pairs → collision probability ~1/(m1*m2). For (10^9+7, 10^9+9), collisions essentially impossible.

**Modular arithmetic**: use `unsigned long long` overflow as a free mod-2^64 — fast, but susceptible to anti-hash attacks; choose random p in production.

**Pattern matching loop**:
1. Compute `H_pat` and `H_window` for first window.
2. Compare; on match verify char-by-char.
3. Slide window; update H_window in O(1).
4. Continue to end.

**Rabin fingerprinting** (rsync): content-defined chunking — slide a 48-byte rolling hash across the file, declare a chunk boundary whenever last N bits of hash are 0.

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
