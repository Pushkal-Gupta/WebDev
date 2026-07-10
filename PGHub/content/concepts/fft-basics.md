---
slug: fft-basics
module: math-number-theory
title: FFT — Fast Polynomial Multiplication
subtitle: Multiply two polynomials (or large integers) in O(n log n) via Fast Fourier Transform on the roots of unity.
difficulty: Advanced
position: 18
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Chapter 30 — Polynomials and the FFT (worked solutions)"
    url: "https://walkccc.me/CLRS/Chap30/30.1/"
    type: book
  - title: "cp-algorithms — Fast Fourier Transform"
    url: "https://cp-algorithms.com/algebra/fft.html"
    type: blog
  - title: "kth-competitive-programming/kactl — FFT/NTT templates"
    url: "https://github.com/kth-competitive-programming/kactl"
    type: repo
status: published
---

## intro
Polynomial multiplication of two degree-(n-1) polynomials takes O(n²) by the schoolbook method. The **Fast Fourier Transform (FFT)** drops it to **O(n log n)** by converting the problem to **point-value representation**, multiplying pointwise (O(n)), then converting back. The same trick multiplies big integers in O(n log n) — the foundation of every modern arbitrary-precision arithmetic library.

## whyItMatters
- **Big integer / cryptographic** multiplication (n digits): O(n log n) via FFT vs O(n²) schoolbook.
- **Polynomial multiplication** in scientific computing and signal processing.
- **Convolution** of two sequences: identical problem in disguise.
- **String matching with wildcards** (FFT on character indicators).
- **Frequency analysis** of any time-series signal.

For competitive programming, FFT shows up when you need "convolution of two arrays" or "multiply huge polynomials mod a prime" (NTT variant).

## intuition
Here is the reframe: a polynomial has two faces. The **coefficient face** lists `[1, 5, 6]` for `1 + 5x + 6x²`; the **point-value face** lists the polynomial's height at several x-positions, like `(x=0 → 1), (x=1 → 12), (x=2 → 35)`. Multiplying is slow in the coefficient face — every coefficient meets every other, O(n²) — but trivial in the point-value face: if you know both polynomials' heights at the *same* x, the product's height there is just the two heights multiplied, one cheap number per point. FFT is the fast currency exchange between these two faces, in and back out.

A polynomial of degree n-1 is uniquely determined by its values at n distinct points. FFT picks n special points — the n-th roots of unity in the complex plane (`e^(2πik/n)` for k = 0..n-1). At these points, polynomial evaluation can be split into even and odd parts, recurring on n/2 — divide and conquer to O(n log n).

```
A(x) = A_even(x²) + x · A_odd(x²)
```

At a primitive n-th root of unity ω, ω² is a (n/2)-th root of unity — so we recurse on a smaller problem of the same shape.

What's actually happening: the roots of unity are the only sample points that let the even/odd split reuse work. Because `(-ω)² = ω²`, evaluating at ω and at −ω both need the same `A_even(ω²)` and `A_odd(ω²)` — you compute the halves once and combine them into two answers. Concretely, to square `1 + x` (so A = [1, 1, 0, 0] padded to length 4), evaluate at the four 4th roots 1, i, −1, −i. That gives A(1)=2, A(i)=1+i, A(−1)=0, A(−i)=1−i. Squaring each height gives 4, 2i, 0, −2i, and inverse-transforming those four numbers hands back `[1, 2, 1]` — exactly `1 + 2x + x²`. No coefficient ever multiplied another directly; the multiplication happened point by point in the transformed world, then FFT carried the answer home.

## visualization
```
Multiply (1 + 2x) * (1 + 3x) = 1 + 5x + 6x²

Step 1: pad to length 4 (next power of 2 ≥ deg sum + 1)
  A = [1, 2, 0, 0]
  B = [1, 3, 0, 0]

Step 2: FFT each → point-value form
  A_hat[k] = A evaluated at ω^k for k = 0..3
  B_hat[k] = B evaluated at ω^k for k = 0..3

Step 3: pointwise multiply
  C_hat[k] = A_hat[k] * B_hat[k]

Step 4: inverse FFT C_hat → coefficient form
  C = [1, 5, 6, 0]

Result: 1 + 5x + 6x²
```

## bruteForce
Schoolbook multiplication of two polynomials: O(n²). Acceptable for n ≤ 5000. FFT wins beyond that, especially for n in the 10^5+ range.

## optimal
**Recursive FFT (Cooley-Tukey, radix-2)**:
```
def fft(a, invert=False):
    n = len(a)
    if n == 1: return a
    # Split into even and odd coefficients.
    a_even = fft(a[::2], invert)
    a_odd = fft(a[1::2], invert)
    # Twiddle factors.
    angle = (2j * math.pi / n) * (-1 if invert else 1)
    omega = 1
    w = cmath.exp(complex(0, angle))
    result = [0] * n
    for k in range(n // 2):
        result[k] = a_even[k] + omega * a_odd[k]
        result[k + n // 2] = a_even[k] - omega * a_odd[k]
        if invert:
            result[k] /= 2
            result[k + n // 2] /= 2
        omega *= w
    return result

def multiply_poly(A, B):
    n = 1
    while n < len(A) + len(B): n <<= 1
    A_hat = fft(A + [0]*(n - len(A)))
    B_hat = fft(B + [0]*(n - len(B)))
    C_hat = [a * b for a, b in zip(A_hat, B_hat)]
    return [round(c.real) for c in fft(C_hat, invert=True)]
```

**Why it's correct.** The recurrence rests on `A(x) = A_even(x²) + x·A_odd(x²)`. Feed in `x = ω^k` (the k-th n-th root of unity): its square `ω^{2k}` is an (n/2)-th root of unity, so `A_even` and `A_odd` are being evaluated on exactly the sample set their own recursive FFT returns. The butterfly `result[k] = a_even[k] + ω^k·a_odd[k]` and `result[k+n/2] = a_even[k] − ω^k·a_odd[k]` exploits `ω^{k+n/2} = −ω^k`, producing both the k-th and (k+n/2)-th outputs from a single multiply — that halving is where the log factor comes from.

**Key invariant / tradeoff.** After the forward pass, `A_hat[k] = A(ω^k)`; pointwise `C_hat[k] = A_hat[k]·B_hat[k]` equals `(A·B)(ω^k)` because evaluation is a homomorphism — the product of two evaluations is the evaluation of the product. The inverse FFT is the *same* butterfly with `ω → ω^{-1}` plus a final divide-by-n; that symmetry is the whole reason one routine handles both directions.

**Step-by-step.** Pad A and B to length n = next power of two ≥ len(A)+len(B). Forward-FFT both (O(n log n)). Multiply the two spectra elementwise (O(n)). Inverse-FFT the result (O(n log n)). Round the real parts to integers. For `[1,2]·[1,3]` this yields `[1, 5, 6]` — the coefficients of `(1+2x)(1+3x) = 1 + 5x + 6x²`.

For competitive programming, use **iterative FFT** (avoid recursion overhead) and **NTT** (Number Theoretic Transform — same idea but over Z/pZ for integer modular arithmetic without floating point error).

## complexity
- **Time**: O(n log n) — the divide-and-conquer recursion.
- **Space**: O(n) — for the output and twiddle factors.
- **Floating-point error**: real FFT can have errors of ~10^-6 per multiply for n = 10^5. For exact integer results, round to nearest integer at the end OR use NTT.
- **Constant factor**: FFT has a non-trivial constant. Schoolbook wins for n < ~64.

## pitfalls
- **n not a power of 2**: pad with zeros to the next power of 2. Forgetting this gives wrong answers.
- **Floating-point precision loss**: with n = 10^5 and integer coefficients up to 10^9, results can be off by 1+. Use NTT for exact integer convolution.
- **Forgetting to divide by n on inverse**: every textbook normalizes differently; verify on a small example.
- **Multiple primes for big-modulus problems**: combine via CRT to recover the true integer result.
- **Confusing FFT with DFT**: DFT is the mathematical concept (any size n); FFT is the O(n log n) algorithm (typically requires n = power of 2 or has special handling for arbitrary n).

## interviewTips
- The trigger: "convolution / polynomial multiplication / big-integer multiply, large n" — FFT.
- For interviews, knowing the **point-value duality** is more important than coding the FFT from scratch.
- Compare with **Karatsuba** (O(n^1.585), simpler) for moderate n, and **schoolbook** for small n.
- For senior interviews, mention **NTT** for exact integer convolution mod a prime, and **bluestein's algorithm** for non-power-of-2 sizes.

## code.python
```python
import math, cmath

def fft(a, invert=False):
    n = len(a)
    if n == 1: return a[:]
    a_even = fft(a[::2], invert)
    a_odd = fft(a[1::2], invert)
    angle = (2 * cmath.pi / n) * (-1 if invert else 1)
    w = cmath.exp(complex(0, angle))
    omega = complex(1, 0)
    result = [0j] * n
    for k in range(n // 2):
        result[k] = a_even[k] + omega * a_odd[k]
        result[k + n // 2] = a_even[k] - omega * a_odd[k]
        if invert:
            result[k] /= 2
            result[k + n // 2] /= 2
        omega *= w
    return result

def multiply(A, B):
    n = 1
    while n < len(A) + len(B): n <<= 1
    A2 = A + [0]*(n - len(A))
    B2 = B + [0]*(n - len(B))
    C = fft([a * b for a, b in zip(fft(A2), fft(B2))], invert=True)
    return [round(c.real) for c in C[:len(A) + len(B) - 1]]

print(multiply([1, 2], [1, 3]))    # [1, 5, 6]
```

## code.javascript
```javascript
// Sketch — JavaScript needs explicit complex arithmetic.
function fft(a, invert = false) {
  const n = a.length;
  if (n === 1) return a.slice();
  const aEven = fft(a.filter((_, i) => i % 2 === 0), invert);
  const aOdd  = fft(a.filter((_, i) => i % 2 === 1), invert);
  // ... twiddle multiply + combine; see Python version
  return new Array(n).fill([0, 0]);
}
```

## code.java
```java
class FFT {
    // Use Complex (Apache Commons) or a custom struct. Iterative bit-reversal version is fastest.
    public static double[] multiply(double[] A, double[] B) {
        // pad to next power of 2, fft both, pointwise multiply, inverse fft, round.
        return new double[0];
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <complex>
using cd = std::complex<double>;
void fft(std::vector<cd>& a, bool invert) {
    int n = a.size();
    if (n == 1) return;
    std::vector<cd> a0(n / 2), a1(n / 2);
    for (int i = 0; i < n / 2; i++) { a0[i] = a[2 * i]; a1[i] = a[2 * i + 1]; }
    fft(a0, invert); fft(a1, invert);
    double angle = 2 * M_PI / n * (invert ? -1 : 1);
    cd w(1), wn(cos(angle), sin(angle));
    for (int i = 0; i < n / 2; i++) {
        a[i] = a0[i] + w * a1[i];
        a[i + n / 2] = a0[i] - w * a1[i];
        if (invert) { a[i] /= 2; a[i + n / 2] /= 2; }
        w *= wn;
    }
}
```
