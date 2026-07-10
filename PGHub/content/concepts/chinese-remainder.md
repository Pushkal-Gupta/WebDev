---
slug: chinese-remainder
module: math-number-theory
title: Chinese Remainder Theorem
subtitle: Solve `x ≡ a_i (mod m_i)` for pairwise-coprime m_i in O(k log M) — useful for large-modulus arithmetic and number theory.
difficulty: Advanced
position: 17
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Chapter 31.5 — The Chinese Remainder Theorem (worked solutions)"
    url: "https://walkccc.me/CLRS/Chap31/31.5/"
    type: book
  - title: "cp-algorithms — Chinese Remainder Theorem"
    url: "https://cp-algorithms.com/algebra/chinese-remainder-theorem.html"
    type: blog
  - title: "kth-competitive-programming/kactl — number-theory templates"
    url: "https://github.com/kth-competitive-programming/kactl"
    type: repo
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
Think of each modulus as a clock with `m_i` hours on its face. Knowing `x mod m_i` tells you where the `i`-th clock's hand points. CRT says: if the clocks have pairwise-coprime sizes, then reading *all* the hands together pins down `x` uniquely within one full super-cycle of length `M = m_1·m_2·...·m_k` — and no shorter cycle repeats the same combined reading. Two different values below `M` can never make every clock agree at once; that is the theorem in one sentence.

Work a real micro-example with `m = (3, 5, 7)` and residues `a = (2, 3, 2)`, so `M = 105`. Brute force would scan `x = 0, 1, 2, ...` checking all three constraints, but watch the structure instead. The values satisfying `x ≡ 2 (mod 3)` are `{2, 5, 8, 11, 14, 17, 20, 23, ...}`. Those satisfying `x ≡ 3 (mod 5)` are `{3, 8, 13, 18, 23, ...}`. Those satisfying `x ≡ 2 (mod 7)` are `{2, 9, 16, 23, ...}`. The first value common to all three lists is **23**, and the next is `23 + 105 = 128` — exactly one solution per 105-wide window.

**What's actually happening** in the formula, before any symbols: for each clock `i` we build a special "indicator" number `M_i · y_i` that reads as `1` on clock `i` and `0` on every other clock. Here `M_i = M / m_i` is already divisible by all the *other* moduli (so it vanishes there), and `y_i = M_i^{-1} (mod m_i)` is the twist that rescales it to read exactly `1` on clock `i`. Multiply each indicator by its residue `a_i` and add them up: clock `i` sees only its own term and reports `a_i`, every other term contributing `0`. The sum, reduced mod `M`, is the unique `x`.

```
x = Σ_i a_i · M_i · y_i   (mod M)
```
where `M_i = M / m_i` and `y_i = M_i^{-1} (mod m_i)` (modular inverse — exists because gcd(M_i, m_i) = 1).

## visualization
Solving `x ≡ (2,3,2) mod (3,5,7)`, `M = 105`. Each row builds one indicator term `a_i · M_i · y_i` and folds it into the running sum. Verify columns show the partial `x` still hitting each residue:

```
i   m_i  a_i   M_i=M/m_i   y_i=Mi^-1 mod m_i   term = a_i*M_i*y_i   running_x (mod 105)
--  ---  ----  ---------   -----------------   -----------------   -------------------
0    -    -        -               -                    -            running_x = 0 (start)
1    3    2       35        35 mod 3 = 2 -> 2         2*35*2 = 140          140 mod 105 = 35
2    5    3       21        21 mod 5 = 1 -> 1         3*21*1 =  63          (35+63) mod 105 = 98
3    7    2       15        15 mod 7 = 1 -> 1         2*15*1 =  30          (98+30) mod 105 = 23
--  ---  ----  ---------   -----------------   -----------------   -------------------
check:  23 mod 3 = 2 ✓     23 mod 5 = 3 ✓      23 mod 7 = 2 ✓      answer x = 23
```

Each `M_i` is divisible by the other two moduli, so it contributes `0` there; the `y_i` twist makes its own term read `a_i`. The folded sum reduces to the unique `x = 23` in `[0, 105)`.

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

**Why the construction is correct.** The load-bearing invariant is that `M_i = M / m_i` is divisible by every modulus *except* `m_i`. So when you reduce the whole sum modulo any particular `m_j`, every term except the `j`-th collapses to `0`, leaving `a_j · M_j · y_j ≡ a_j · 1 ≡ a_j (mod m_j)`. The `y_j = M_j^{-1} (mod m_j)` factor is exactly what rescales `M_j`'s residue from whatever it happens to be up to `1`. That inverse is guaranteed to exist precisely because the moduli are pairwise coprime, which forces `gcd(M_j, m_j) = 1`. Uniqueness follows the same way: any two solutions differ by a multiple of every `m_i`, hence by a multiple of their product `M`, so exactly one representative lives in `[0, M)`.

**Step by step**, the loop maintains a running `x` that already satisfies the constraints processed so far, adding one indicator term per iteration. **Complexity intuition**: the dominant cost is `k` modular inverses, each an extended-Euclid run in `O(log m_i)`, giving `O(k log M)` overall — a decisive win over the `O(M)` scan once `M` has hundreds of digits.

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
