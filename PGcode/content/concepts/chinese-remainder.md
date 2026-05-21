---
slug: chinese-remainder
module: math
title: Chinese Remainder Theorem
subtitle: Solve `x ≡ a_i (mod m_i)` for pairwise-coprime m_i in O(k log M) — useful for large-modulus arithmetic and number theory.
difficulty: Advanced
position: 17
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Knuth — TAOCP Vol 2; also CLRS Chapter 31"
    url: ""
status: published
---

## intro
The **Chinese Remainder Theorem (CRT)** says: given `k` pairwise-coprime moduli `m_1, m_2, ..., m_k` and residues `a_1, a_2, ..., a_k`, there exists a **unique** integer `x` (mod `M = m_1·m_2·...·m_k`) such that `x ≡ a_i (mod m_i)` for every i. CRT also gives an explicit formula to compute that x.

## whyItMatters
Direct uses:
- **Reconstructing a large integer** from its residues modulo small primes — the building block of fast polynomial multiplication over big rings, RSA signatures, lattice-based cryptography.
- **Counting problems** where the answer is a product whose factors are known mod different primes.
- **Number-theory programming problems** where you need to compute `(huge expression) mod (composite m)` — split m into prime-power factors, solve each, combine via CRT.
- **Calendar-style puzzles**: "find a year that's a leap year mod 4, divisible by 7, ..." — classic CRT.

For competitive programming, CRT often shows up in disguise. Recognizing the pattern saves an O(M) brute force.

## intuition
The system `x ≡ a_i (mod m_i)` defines a single arithmetic progression in `[0, M)`. CRT proves the AP has exactly one member there and gives a constructive formula:

```
x = Σ_i a_i · M_i · y_i   (mod M)
```
where `M_i = M / m_i` and `y_i = M_i^(-1) (mod m_i)` (modular inverse — exists because gcd(M_i, m_i) = 1).

## visualization
```
m_1=3, a_1=2  → x ∈ {2, 5, 8, 11, 14, 17, 20, 23, ...}
m_2=5, a_2=3  → x ∈ {3, 8, 13, 18, 23, ...}
m_3=7, a_3=2  → x ∈ {2, 9, 16, 23, ...}

Intersection: 23.  M = 3·5·7 = 105.  Unique answer in [0, 105): 23.
```

## bruteForce
Iterate x = 0, 1, 2, ..., check all k constraints. O(M·k). Dies once M is huge (in cryptographic uses M is hundreds of digits long).

## optimal
**Standard CRT** (pairwise coprime moduli):
```
def crt(residues, moduli):
    M = 1
    for m in moduli: M *= m
    x = 0
    for a, m in zip(residues, moduli):
        Mi = M // m
        y = mod_inverse(Mi, m)            # extended Euclidean algorithm
        x = (x + a * Mi * y) % M
    return x, M
```

**Generalized CRT** (non-coprime moduli): solve pairs incrementally. For each new `(a_i, m_i)`:
- Combine current `(x, M)` with `(a_i, m_i)`.
- A solution exists iff `(a_i - x) mod gcd(M, m_i) == 0`.
- If yes, new modulus is `lcm(M, m_i)`; new residue is computed via extended Euclidean.

**Extended Euclidean** returns `(gcd, s, t)` such that `gcd = s·a + t·b`. Modular inverse comes out as `s mod m`.

## complexity
- **Time**: O(k log M) — each modular inverse is O(log m_i).
- **Space**: O(1) extra beyond the inputs and the product M.
- **Big integers**: M can grow huge fast. Languages without arbitrary-precision (C++) need explicit big-int math.

## pitfalls
- **Non-coprime moduli**: standard formula breaks. Use the incremental-pair variant or check that `gcd(m_i, m_j) = 1` for all i, j.
- **Modular inverse doesn't exist**: only when `gcd(M_i, m_i) > 1` — won't happen if moduli are pairwise coprime.
- **Negative residues**: normalize each `a_i` to `[0, m_i)` first.
- **Overflow**: in 64-bit languages, `M_i · y_i · a_i` can overflow. Use `__int128`, BigInteger, or `mulmod`.

## interviewTips
- The trigger: "given several modular constraints, find x" — CRT.
- For competitive programming, mention CRT when seeing `(answer mod 10^9+7)` problems that decompose into prime-power factors.
- Walk through the construction for k = 2 — interviewers want to see the explicit formula, not just the theorem statement.
- For senior interviews, mention **garner's algorithm** as an alternative incremental CRT (avoids the big multiplication).

## code.python
```python
def ext_gcd(a, b):
    if b == 0: return a, 1, 0
    g, x1, y1 = ext_gcd(b, a % b)
    return g, y1, x1 - (a // b) * y1

def mod_inverse(a, m):
    g, x, _ = ext_gcd(a % m, m)
    if g != 1: raise ValueError("no inverse")
    return x % m

def crt(residues, moduli):
    M = 1
    for m in moduli: M *= m
    x = 0
    for a, m in zip(residues, moduli):
        Mi = M // m
        x = (x + a * Mi * mod_inverse(Mi, m)) % M
    return x, M

print(crt([2, 3, 2], [3, 5, 7]))    # (23, 105)
```

## code.javascript
```javascript
function extGcd(a, b) {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = extGcd(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}
function modInv(a, m) { const [, x] = extGcd(((a % m) + m) % m, m); return ((x % m) + m) % m; }
function crt(residues, moduli) {
  let M = 1n;
  for (const m of moduli) M *= m;
  let x = 0n;
  for (let i = 0; i < residues.length; i++) {
    const a = residues[i], m = moduli[i];
    const Mi = M / m;
    x = (x + a * Mi * modInv(Mi, m)) % M;
  }
  return { x, M };
}
```

## code.java
```java
import java.math.BigInteger;
class CRT {
    public BigInteger[] crt(BigInteger[] residues, BigInteger[] moduli) {
        BigInteger M = BigInteger.ONE;
        for (BigInteger m : moduli) M = M.multiply(m);
        BigInteger x = BigInteger.ZERO;
        for (int i = 0; i < residues.length; i++) {
            BigInteger m = moduli[i];
            BigInteger Mi = M.divide(m);
            x = x.add(residues[i].multiply(Mi).multiply(Mi.modInverse(m))).mod(M);
        }
        return new BigInteger[]{ x, M };
    }
}
```

## code.cpp
```cpp
#include <vector>
// Use __int128 for the intermediate products in 64-bit programs.
long long extGcd(long long a, long long b, long long& x, long long& y) {
    if (!b) { x = 1; y = 0; return a; }
    long long x1, y1;
    long long g = extGcd(b, a % b, x1, y1);
    x = y1; y = x1 - (a / b) * y1; return g;
}
long long modInv(long long a, long long m) {
    long long x, y; extGcd(((a % m) + m) % m, m, x, y); return ((x % m) + m) % m;
}
std::pair<long long, long long> crt(const std::vector<long long>& r, const std::vector<long long>& m) {
    long long M = 1; for (long long mi : m) M *= mi;
    long long x = 0;
    for (size_t i = 0; i < r.size(); i++) {
        long long Mi = M / m[i];
        x = (x + (__int128) r[i] * Mi % M * modInv(Mi, m[i]) % M) % M;
    }
    return { x, M };
}
```
