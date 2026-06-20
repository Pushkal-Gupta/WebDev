---
slug: math-modular-inverse-fermat
module: math-number-theory
title: Modular Inverse (Fermat / Extended Euclid)
subtitle: Divide under a prime modulus — Fermat's little theorem (mod prime) or Extended Euclid (any coprime). The 5-line snippet behind nCr % p.
difficulty: Intermediate
position: 42
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Number-theoretic algorithms"
    url: "https://walkccc.me/CLRS/Chap31/"
    type: book
  - title: "cp-algorithms — Modular inverse"
    url: "https://cp-algorithms.com/algebra/module-inverse.html"
    type: blog
  - title: "TheAlgorithms/Python — Modular inverse"
    url: "https://github.com/TheAlgorithms/Python/blob/master/maths/mod_inverse.py"
    type: repo
status: published
---

## intro
Under integer arithmetic mod m, division is not a built-in operation. The **modular inverse** of `a` mod `m` is the unique `x` such that `a * x ≡ 1 (mod m)` — and **only exists** when `gcd(a, m) = 1`. Two computation paths: **Fermat's little theorem** (when m is prime) gives `a^(m-2) mod m` via fast exponentiation; **Extended Euclidean algorithm** works for any coprime pair. The 5-line primitive behind `nCr % p`, RSA, and elliptic curve crypto.

## whyItMatters
- **Combinatorics under modulus**: `nCr % p` = `n! * inv(r!) * inv((n-r)!)` mod p. Without inverse, `r!` in denominator is unreachable.
- **Cryptography**: RSA decryption is `c^d mod n` where `d` is the inverse of `e` mod `phi(n)`.
- **Linear algebra mod p**: matrix inversion under modular arithmetic.
- **Competitive programming**: every counting problem asking for "answer mod 1e9+7" needs this.

## intuition
**Fermat's little theorem**: for prime `p` and any `a` with `gcd(a, p) = 1`:
```
a^(p-1) ≡ 1 (mod p)
=> a * a^(p-2) ≡ 1 (mod p)
=> a^(p-2) is the inverse of a mod p.
```
Compute via fast exponentiation — O(log p).

**Extended Euclidean algorithm**: find integers `x, y` such that `a*x + m*y = gcd(a, m)`. If `gcd = 1`, then `a*x ≡ 1 (mod m)`, so `x mod m` is the inverse. Works for any coprime modulus, not just primes.

## visualization
```
Fermat for a=3 mod p=7:
  inv = 3^(7-2) mod 7 = 3^5 mod 7

  Fast exponentiation:
    3^1 = 3 mod 7
    3^2 = 9 mod 7 = 2
    3^4 = 2^2 mod 7 = 4
    3^5 = 3^4 * 3^1 = 4 * 3 mod 7 = 12 mod 7 = 5

  Check: 3 * 5 = 15 mod 7 = 1. Correct.

Extended Euclid for a=3, m=11:
  gcd(3, 11):
    11 = 3*3 + 2
     3 = 1*2 + 1
     2 = 2*1 + 0    → gcd = 1

  Back-substitution:
    1 = 3 - 1*2
      = 3 - 1*(11 - 3*3)
      = 4*3 - 1*11   → x = 4, y = -1

  inverse = 4 mod 11.
  Check: 3 * 4 = 12 mod 11 = 1. Correct.
```

## bruteForce
**Try x = 1, 2, ..., m-1 until a*x mod m == 1**: O(m). Useless for m = 10^9+7.

**Precompute factorials + inverses for entire range [0..n]**: O(n) once, O(1) per nCr lookup — the right move when you'll call nCr many times.

## optimal
**Fermat (m is prime)**:
```python
def mod_inverse_fermat(a, p):
    return pow(a, p - 2, p)      # Python's pow does fast exp natively
```

**Extended Euclid (any coprime)**:
```python
def extended_gcd(a, b):
    if b == 0: return a, 1, 0
    g, x1, y1 = extended_gcd(b, a % b)
    return g, y1, x1 - (a // b) * y1

def mod_inverse_eea(a, m):
    g, x, _ = extended_gcd(a % m, m)
    if g != 1: return None    # inverse does not exist
    return x % m
```

**Bulk precomputation** (e.g., factorials' inverses 0..N mod p):
```python
inv = [1] * (N + 1)
fact = [1] * (N + 1); inv_fact = [1] * (N + 1)
for i in range(2, N + 1):
    fact[i] = fact[i - 1] * i % p
inv_fact[N] = pow(fact[N], p - 2, p)
for i in range(N - 1, -1, -1):
    inv_fact[i] = inv_fact[i + 1] * (i + 1) % p
```

Then `nCr(n, r) = fact[n] * inv_fact[r] * inv_fact[n - r] % p`.

**Linear-time inverse table** (0..N mod p):
```python
inv[1] = 1
for i in range(2, N + 1):
    inv[i] = (p - (p // i) * inv[p % i]) % p
```
O(N) total — no per-call log factor.

## complexity
- **Fermat:** O(log p) per inverse via fast exponentiation.
- **Extended Euclid:** O(log m) per inverse.
- **Bulk inverse table:** O(N) total.
- **Precomputed factorial inverses:** O(N) once, O(1) per nCr query.

## pitfalls
- **Fermat applied to composite modulus.** `a^(m-2) mod m` is only the inverse when `m` is prime; using it on composite `m` returns garbage. Fix: detect with `isPrime(m)` or switch unconditionally to Extended Euclid; for composite-with-known-factorisation use CRT over each prime power.
- **Negative result from Extended Euclid.** The back-substituted `x` can be negative even though it's still a valid representative of the inverse. Fix: always return `((x % m) + m) % m` so the result lies in `[0, m)`.
- **No coprime check.** If `gcd(a, m) != 1`, no inverse exists; returning the EEA's `x` produces a value that fails `a*x ≡ 1`. Fix: check the returned `g`; return `None`/`-1`/throw when `g != 1` and propagate that to the caller.
- **`(a / b) % m` written as literal division.** Integer division loses the modular information entirely. Fix: rewrite every modular division as `(a * mod_inverse(b, m)) % m`; never use the `/` operator in modular arithmetic code.
- **Overflow before the mod.** In C++, `a * b` overflows `long long` when both are close to `m = 10^18`. Fix: cast intermediates to `__int128`, or use `unsigned long long` with mulmod helpers, or pick `m <= 10^9 + 7` so `(a % m) * (b % m)` stays in `long long`.
- **Missing `% p` on intermediate products.** Forgetting the mod inside a tight multiplication chain silently overflows and produces wrong answers only on large inputs. Fix: write a helper `mul_mod(a, b, m)` and call it everywhere instead of bare `a * b`.

## interviewTips
- For "compute nCr mod prime" → factorial precompute + Fermat inverse.
- Cite **Fermat for prime modulus, EEA for general** as the two-tool kit.
- For senior interviews, discuss **inverse via CRT** when m is composite, **inverse in finite fields** for crypto, **batch inverse** trick (compute prefix products + one big inverse → all individual inverses in O(N)).

## code.python
```python
def mod_inverse(a, m):
    # works for any coprime pair (Extended Euclid)
    def egcd(a, b):
        if b == 0: return a, 1, 0
        g, x1, y1 = egcd(b, a % b)
        return g, y1, x1 - (a // b) * y1
    g, x, _ = egcd(a % m, m)
    return x % m if g == 1 else None

def mod_inv_prime(a, p):
    # works only when p is prime (Fermat)
    return pow(a, p - 2, p)
```

## code.javascript
```javascript
function modPow(b, e, m) {
  b = BigInt(b); e = BigInt(e); m = BigInt(m);
  let r = 1n;
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return r;
}
function modInvPrime(a, p) { return modPow(a, p - 2n, p); }
```

## code.java
```java
static long modPow(long b, long e, long m) {
    long r = 1; b %= m;
    while (e > 0) {
        if ((e & 1) == 1) r = r * b % m;
        b = b * b % m;
        e >>= 1;
    }
    return r;
}
static long modInvPrime(long a, long p) { return modPow(a, p - 2, p); }
```

## code.cpp
```cpp
long long mod_pow(long long b, long long e, long long m) {
    long long r = 1; b %= m;
    while (e > 0) {
        if (e & 1) r = r * b % m;
        b = b * b % m;
        e >>= 1;
    }
    return r;
}
long long mod_inv_prime(long long a, long long p) { return mod_pow(a, p - 2, p); }
```
