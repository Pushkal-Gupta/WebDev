---
slug: euclidean-gcd
module: math-number-theory
title: Euclid's Algorithm (GCD)
subtitle: The greatest common divisor in O(log min(a, b)).
difficulty: Beginner
position: 3
estimatedReadMinutes: 4
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Chapter 31.2 — Greatest Common Divisor (worked solutions)"
    url: "https://walkccc.me/CLRS/Chap31/31.2/"
    type: book
  - title: "cp-algorithms — Euclidean algorithm for computing the greatest common divisor"
    url: "https://cp-algorithms.com/algebra/euclid-algorithm.html"
    type: blog
  - title: "TheAlgorithms/Python — maths (GCD)"
    url: "https://github.com/TheAlgorithms/Python/tree/master/maths"
    type: repo
status: published
---

## intro
The Euclidean algorithm computes the greatest common divisor of two integers using only division (or modulo). It dates back to ~300 BCE and is still the fastest method known for arbitrary integers. Every number-theoretic algorithm — Bezout's coefficients, modular inverse, Chinese Remainder, RSA — relies on it.

## whyItMatters
GCD is the subroutine sitting under most of applied number theory. RSA key generation needs `gcd(e, phi(n)) = 1` to confirm the public exponent is invertible. Postgres's `numeric` type calls a Euclidean reduction whenever it normalizes fractions. The Chinese Remainder Theorem (used in CRT-RSA, the BLS signature aggregation in Ethereum 2.0, and the timing-safe modular arithmetic in libsodium) starts with extended Euclid. CLRS dedicates chapter 31.2 to it; Knuth TAOCP Volume 2 derives Lame's 1844 theorem that bounds it at `O(log_phi(min(a, b)))`. Every fraction reduction in `numpy.rational`, every modular inverse in elliptic-curve cryptography, every LCM computation in scheduling code routes through this single recurrence.

## intuition
The trick is one observation: any divisor of both `a` and `b` also divides `a - b`, and more usefully `a mod b`. So the set of common divisors of `(a, b)` equals the set of common divisors of `(b, a mod b)`. Their maximum element is the GCD, which means `gcd(a, b) = gcd(b, a mod b)`. The argument keeps shrinking and the recursion has to terminate, because the second argument strictly decreases on every step and is bounded below by zero.

Why is it so fast? Lame showed in 1844 that the worst case happens on consecutive Fibonacci numbers, which means the second argument falls by a factor of the golden ratio `phi approx 1.618` on every step. After `k` steps the smaller argument has shrunk by `phi^k`, so termination needs `k = O(log_phi(min(a, b)))` iterations.

Think of the mod step as repeated subtraction collapsed into one operation: `a mod b` is what you would get after subtracting `b` from `a` floor(a/b) times. Subtraction alone gives `gcd(48, 1) = gcd(47, 1) = ...`, an `O(a)` disaster. Modulo telescopes those subtractions, which is the whole reason Euclid beats trial division so badly. The same principle, written backwards as the Stern-Brocot tree, generates every rational in lowest terms exactly once. Whenever you see a fraction-reduction or modular-arithmetic step in a system, this recurrence is the engine underneath.

## visualization
gcd(48, 18):
- 48 mod 18 = 12 → gcd(18, 12)
- 18 mod 12 = 6  → gcd(12, 6)
- 12 mod 6  = 0  → return 6

Four operations for two-digit numbers; ~30 operations for 32-bit integers.

## bruteForce
Loop `d` from `min(a, b)` down to 1 and return the first `d` dividing both. O(min(a, b)) — exponentially slower than Euclid's logarithmic version. Useless for any practical input.

## optimal
The iterative two-line loop is the canonical implementation: while `b` is nonzero, set `(a, b) = (b, a mod b)`. When `b` hits zero, `a` is the GCD. This runs in `O(log min(a, b))` time and `O(1)` space, which is asymptotically optimal because any GCD algorithm must read both inputs. The recursive form is mathematically cleaner but the iterative form avoids Python's default 1000-frame recursion limit and the equivalent JVM stack overflow on adversarial inputs.

```python
def gcd(a, b):
    a, b = abs(a), abs(b)
    while b:
        a, b = b, a % b
    return a

def ext_gcd(a, b):
    if b == 0:
        return a, 1, 0
    g, x1, y1 = ext_gcd(b, a % b)
    return g, y1, x1 - (a // b) * y1
```

The critical line is `a, b = b, a % b` — it performs the substitution that collapses many subtractions into one modulo. The extended version tracks Bezout coefficients `(x, y)` such that `a*x + b*y = gcd(a, b)`, which is what you need to compute a modular inverse `a^{-1} mod m` whenever `gcd(a, m) = 1`. For arbitrary-precision integers (cryptographic key sizes around 2048 bits), the **binary GCD** algorithm (Stein 1967) replaces division with subtraction and bit shifts and runs noticeably faster on CPUs without a hardware divider; GMP and OpenSSL both ship it as the default for `mpz_gcd`.

## complexity
time: O(log min(a, b)) — by Lamé's theorem, the worst case is consecutive Fibonacci numbers.
space: O(1) iterative, O(log min(a, b)) recursive (stack depth).
notes: Each iteration shrinks the smaller argument by at least a factor of (1 + √5)/2 ≈ 1.618 — the same constant that governs Fibonacci growth.

## pitfalls
- `gcd(0, 0)` is undefined mathematically; most implementations return 0 by convention.
- Negative inputs: `a mod b` semantics vary across languages (C/C++/Java return sign-of-dividend, Python returns sign-of-divisor). Take absolute values first if mixed signs are possible.
- Overflow when computing `lcm(a, b) = a * b / gcd(a, b)` — divide first: `(a / gcd) * b`.

## interviewTips
- If asked "compute GCD," recite the recurrence first, then the one-line implementation.
- Bring up Bezout coefficients if the problem hints at modular inverse — that's the bridge to extended Euclid.
- Mention that `lcm(a, b) * gcd(a, b) = a * b` — interviewers test the identity often.

## code.python
```python
def gcd(a: int, b: int) -> int:
    a, b = abs(a), abs(b)
    while b:
        a, b = b, a % b
    return a

def ext_gcd(a, b):
    """Returns (g, x, y) such that a*x + b*y = g = gcd(a, b)."""
    if b == 0:
        return a, 1, 0
    g, x1, y1 = ext_gcd(b, a % b)
    return g, y1, x1 - (a // b) * y1
```

## code.javascript
```javascript
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}
```

## code.java
```java
public int gcd(int a, int b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b != 0) { int t = a % b; a = b; b = t; }
    return a;
}
```

## code.cpp
```cpp
int gcd(int a, int b) {
    a = abs(a); b = abs(b);
    while (b) { int t = a % b; a = b; b = t; }
    return a;
}
```
