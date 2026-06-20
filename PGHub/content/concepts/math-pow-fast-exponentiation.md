---
slug: math-pow-fast-exponentiation
module: math-number-theory
title: Fast Exponentiation (pow(x,n))
subtitle: Halve the exponent, square the base — O(log n)
difficulty: Beginner
position: 41
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Introduction to Algorithms (CLRS) — Number-theoretic algorithms"
    url: "https://walkccc.me/CLRS/"
    type: book
  - title: "Binary exponentiation"
    url: "https://cp-algorithms.com/algebra/binary-exp.html"
    type: blog
  - title: "TheAlgorithms/Python — maths"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
Compute `x` raised to the `n`-th power where `n` can be any integer (positive, negative, or zero). The textbook loop runs in `O(n)` and quickly explodes for large `n`. Fast exponentiation (a.k.a. binary exponentiation, exponentiation by squaring) reduces this to `O(log n)` by halving the exponent each step.

## whyItMatters
- **RSA encryption / decryption**: every TLS handshake on the public internet performs modular exponentiation of 2048-bit numbers. A 2048-bit exponent under the naive O(n) loop would take 2^2048 multiplications — universe-lifetime infeasible. Binary exponentiation does it in 2048 squarings, well under a millisecond.
- **Diffie-Hellman key exchange**: same operation, same scale. Signal, WhatsApp, OpenSSL, BoringSSL — all rely on fast modular exponentiation per session.
- **Elliptic-curve cryptography (secp256k1 in Bitcoin, ed25519 in SSH)**: scalar multiplication on points is the same algorithm with point-addition replacing integer multiplication. Every Bitcoin transaction signature is a binary exponentiation in disguise.
- **Matrix exponentiation for linear recurrences**: computing the n-th Fibonacci number in O(log n) by raising the 2×2 transition matrix to the n-th power. Same algorithm, matrix multiplication as the operator. Powers competitive-programming problems and population-dynamics simulations.
- **Fermat's little theorem modular inverses**: `a^(p-1) ≡ 1 (mod p)` for prime p, so `a^(-1) ≡ a^(p-2) (mod p)`. Computing the inverse needs fast exponentiation. Used in coding theory, BLS signatures, zero-knowledge proofs.
- **Game physics simulation rollback (Mortal Kombat, fighting games)**: deterministic re-execution of n frames advances the integer RNG by `state = state * a^n + ...` using matrix exponentiation in O(log n) per rollback.

The asymptotic gap between O(n) and O(log n) is what makes RSA, modern cryptography, and large-state simulations practical.

## intuition
The identity that powers the entire algorithm comes from a single observation about the exponent: any positive integer n has a unique binary representation. If n is even, `x^n = (x^2)^(n/2)` — we've reduced the problem to half the exponent on a squared base, costing one multiplication. If n is odd, `x^n = x * x^(n-1) = x * (x^2)^((n-1)/2)` — same trick, plus one extra multiplication to peel off the odd bit. Each step strips one bit off n; n has ⌊log₂ n⌋ + 1 bits; total cost is O(log n) multiplications.

Read the same algorithm in binary: iterate the bits of n from least to most significant. Maintain a running product `result` and a current "squared base" `b`. For each bit, if it's 1, multiply `result` by `b`; then square `b` and shift to the next bit. The squared base after k iterations is `x^(2^k)`, so multiplying it into `result` exactly when bit k is set assembles `x^n = product over set bits k of x^(2^k)`. This is the same algorithm — squaring + conditional multiply — just expressed bit-wise rather than recursively. Both views are correct; the iterative bit-walk version is the one to write in interviews because it's O(1) space and has no stack-overflow risk on huge exponents.

For modular exponentiation (`pow(x, n) mod m`), apply `mod m` after every multiplication. The intermediate values stay bounded by `m^2`, which fits in 128 bits for 64-bit moduli — that's why production crypto code uses `__int128` or BigInteger to hold intermediate products. Skipping the per-step mod and applying it once at the end blows past arithmetic limits long before the loop finishes.

Negative exponents need only one line of preprocessing: `pow(x, -n) = pow(1/x, n)`. The trap is `n = INT_MIN` — negating it in a fixed-width signed int overflows because two's complement has one more negative value than positive (the negation of -2^31 doesn't fit in int32). The fix is to widen the type before negating: cast to `long long` first, then negate. This is the kind of corner case that gets you in onsite coding interviews — proactively naming it signals defensive thinking.

The generalisation that interviewers love to probe: replace integer multiplication with any associative operation and the same O(log n) algorithm works. Matrix multiplication → matrix exponentiation (Fibonacci in O(log n)). Group operations on elliptic curves → scalar multiplication for ECDSA. Polynomial multiplication mod some ideal → ring operations for FHE. The pattern is "associative binary op + identity element + bit-walk on the exponent". Calling out this generalisation in an interview is high signal.

The brute alternative — multiply x by itself |n| times — is O(n) and correct, but unusable for `n = 10^9` (LeetCode constraint) or `n = 2^2048` (RSA reality). The recursive `pow(x, n-1) * x` variant has the same complexity and risks stack overflow for large n. Both are textbook wrong answers in an interview the moment large exponents are on the board.

## optimal
Iterative binary exponentiation, six lines, O(log n) time, O(1) space. Handle the negative-exponent case with a single inversion step up front (cast to wider type before negating to dodge INT_MIN). Bit-walk the exponent from LSB to MSB, squaring the base and conditionally folding it into the running product.

```python
def my_pow(x: float, n: int) -> float:
    """O(log |n|) binary exponentiation. Handles negative exponents safely."""
    if n == 0:
        return 1.0                       # short-circuit; x^0 = 1 even when x = 0 by convention
    if n < 0:
        x = 1.0 / x
        n = -n                            # Python ints are arbitrary precision; no overflow risk
    result = 1.0
    base = x
    while n > 0:
        if n & 1:                         # current LSB of exponent is 1 → fold base into result
            result *= base
        base *= base                      # square the base for the next bit position
        n >>= 1                           # advance to the next exponent bit
    return result

def pow_mod(x: int, n: int, m: int) -> int:
    """Modular exponentiation — the crypto-grade variant. O(log n) multiplications mod m."""
    result = 1
    base = x % m
    while n > 0:
        if n & 1:
            result = (result * base) % m  # mod after EVERY multiplication keeps values bounded
        base = (base * base) % m
        n >>= 1
    return result

def matrix_pow(M: list[list[int]], n: int) -> list[list[int]]:
    """Matrix exponentiation for linear recurrences. O(d^3 log n) for d×d matrices."""
    d = len(M)
    result = [[1 if i == j else 0 for j in range(d)] for i in range(d)]   # identity
    base = [row[:] for row in M]
    while n > 0:
        if n & 1:
            result = matmul(result, base)
        base = matmul(base, base)
        n >>= 1
    return result
```

Why optimal: any algorithm computing `x^n` must read at least the ⌈log₂ n⌉ bits of n, so Ω(log n) is the information-theoretic lower bound on the number of operations. Binary exponentiation hits that bound with one squaring per bit and at most one extra multiplication per set bit — total at most 2·log₂ n multiplications. There is no known algorithm that improves the asymptotic class for general bases; specialised algorithms (Brauer addition chains, sliding window) shave constant factors of 10-30% for very large exponents in production crypto libraries but stay O(log n). For matrix exponentiation, the same algorithm gives O(d^3 log n) where d is the matrix dimension — exponential improvement over the O(d^2 n) naive linear recurrence.

Implementation discipline that distinguishes good solutions from bug-prone ones: (1) handle `n == 0` first — `x^0 = 1` by convention even when `x = 0`, and dropping into the loop with `n = 0` returns the initial `result = 1` correctly only by accident; (2) for `n < 0` in fixed-width-int languages (C/C++/Java), widen the exponent to `long long` before negating — `-INT_MIN` overflows because two's complement has one more negative than positive value; (3) for modular exponentiation, apply `% m` after *every* multiplication — taking the mod only at the end overflows the moment the product exceeds the type's range, often silently; (4) right-shift on signed negative integers is implementation-defined pre-C++20 — normalise to a non-negative copy first, then `>>=` on the copy; (5) floating-point `pow` accumulates rounding error from squaring; for `0.99999^100000` and similar near-1 bases, switch to `exp(n * log(x))` or use `expm1`/`log1p` for better precision; (6) the matrix-exponentiation generalisation is the senior follow-up — Fibonacci in O(log n) via raising `[[1,1],[1,0]]^n` is the canonical example to have ready.

## visualization
```
pow(2, 10)
n=10 (even)  base=2  result=1   -> base=4    n=5
n=5  (odd)   base=4  result=1*4 -> base=16   n=2
n=2  (even)  base=16 result=4   -> base=256  n=1
n=1  (odd)   base=256 result=4*256 -> result=1024
n=0          stop
answer = 1024 = 2^10
```

## bruteForce
Multiply `x` by itself `|n|` times. `O(n)` time. Correct but unusable for `n = 1_000_000_000`. Recursive `pow(x, n) = x * pow(x, n - 1)` has the same complexity and risks stack overflow.

## optimal
Iterative binary exponentiation:
1. If `n < 0`, set `x = 1 / x` and `n = -n` (cast to a wider integer first to avoid overflow on the minimum value).
2. `result = 1`.
3. While `n > 0`: if `n & 1` then `result *= x`; then `x *= x`; `n >>= 1`.
4. Return `result`.
Each multiplication uses the latest squared base; total cost is `O(log n)`.

## complexity
- **Time:** O(log n)
- **Space:** O(1) iterative; O(log n) recursive.

## pitfalls
- **`n = INT_MIN` negation overflow.** In C/C++/Java, `-INT_MIN` overflows `int` because two's complement has one more negative than positive value. Fix: promote the exponent to `long`/`long long` *before* the unary minus — `long exp = n; exp = -exp;`.
- **Right shift on negatives.** Pre-C++20 right-shift on negative ints is implementation-defined; Java's `>>` is arithmetic and preserves the sign bit, so `>>=` on a negative number never reaches zero. Fix: normalise to a non-negative `exp` at the top, then use `>>=` exclusively on the non-negative copy.
- **Floating-point drift.** Squaring a number near 1 many times accumulates rounding error, so `0.99999^100000` will differ from a closed-form Taylor expansion. Fix: document the precision contract; for stricter results use `expm1`/`log1p` or compute in higher precision (`long double`, BigDecimal).
- **Mod taken only at the end in modular variant.** A 60-bit product before a single final mod blows past `2^63`. Fix: apply `result = (result * base) % MOD` and `base = (base * base) % MOD` after *every* multiplication so values stay bounded.
- **Skipping the `n == 0` shortcut.** Some implementations enter the loop with `n == 0` and return `1` correctly only by accident — but a negative-zero exponent fallthrough is a common test failure. Fix: handle `n == 0` first (`return 1`), then check the sign, then run the loop.

## interviewTips
- Verbally separate the three cases — positive, zero, negative — before writing code.
- Mention the `INT_MIN` corner case proactively; it shows defensive thinking.
- If the interviewer adds "mod `p`", smoothly transition to modular exponentiation.

## code.python
```python
def my_pow(x: float, n: int) -> float:
    if n < 0:
        x = 1 / x
        n = -n
    result = 1.0
    base = x
    while n > 0:
        if n & 1:
            result *= base
        base *= base
        n >>= 1
    return result
```

## code.javascript
```javascript
function myPow(x, n) {
  let exp = n;
  let base = x;
  if (exp < 0) { base = 1 / base; exp = -exp; }
  let result = 1;
  while (exp > 0) {
    if (exp & 1) result *= base;
    base *= base;
    exp = Math.floor(exp / 2);
  }
  return result;
}
```

## code.java
```java
class Solution {
    public double myPow(double x, int n) {
        long exp = n;
        if (exp < 0) { x = 1 / x; exp = -exp; }
        double result = 1.0;
        double base = x;
        while (exp > 0) {
            if ((exp & 1) == 1) result *= base;
            base *= base;
            exp >>= 1;
        }
        return result;
    }
}
```

## code.cpp
```cpp
class Solution {
public:
    double myPow(double x, int n) {
        long long exp = n;
        if (exp < 0) { x = 1.0 / x; exp = -exp; }
        double result = 1.0;
        double base = x;
        while (exp > 0) {
            if (exp & 1) result *= base;
            base *= base;
            exp >>= 1;
        }
        return result;
    }
};
```
