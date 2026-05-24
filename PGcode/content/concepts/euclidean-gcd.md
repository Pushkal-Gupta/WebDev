---
slug: euclidean-gcd
module: math
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
GCD is the most common subroutine in competitive programming and cryptography. Reducing fractions, computing LCM (`lcm(a, b) = a * b / gcd(a, b)`), modular inverses (`a⁻¹ mod m` only exists if `gcd(a, m) = 1`), and the entire chain of public-key cryptography all start here. Internalizing how Euclid's works also unlocks the *extended* version, which gives Bezout coefficients in the same complexity.

## intuition
If `d` divides both `a` and `b`, it divides `a - b` (and therefore `a mod b`). So `gcd(a, b) = gcd(b, a mod b)`. Each step shrinks the second argument at least *halve*; after `O(log min(a, b))` steps, the second argument hits 0 and the first is the answer.

## visualization
gcd(48, 18):
- 48 mod 18 = 12 → gcd(18, 12)
- 18 mod 12 = 6  → gcd(12, 6)
- 12 mod 6  = 0  → return 6

Four operations for two-digit numbers; ~30 operations for 32-bit integers.

## bruteForce
Loop `d` from `min(a, b)` down to 1 and return the first `d` dividing both. O(min(a, b)) — exponentially slower than Euclid's logarithmic version. Useless for any practical input.

## optimal
Recursive: `gcd(a, b) = b == 0 ? a : gcd(b, a mod b)`. Iterative: while `b != 0`, do `(a, b) = (b, a mod b)`. Extended Euclidean tracks coefficients `(x, y)` such that `a*x + b*y = gcd(a, b)` — required for modular inverse.

For very large integers (cryptography), the **binary GCD** variant uses only subtraction and bit shifts (no division) and is faster on hardware that lacks fast division.

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
