---
slug: calc-fourier-series
module: calculus
title: Fourier Series
subtitle: Build any repeating wave by stacking pure sine and cosine tones at whole-number multiples of one base frequency.
difficulty: Advanced
position: 9
estimatedReadMinutes: 11
prereqs: [calc-integral-as-area, calc-taylor-series]
relatedProblems: []
references:
  - title: "3Blue1Brown — But what is a Fourier series? From heat flow to drawing with circles"
    url: "https://www.youtube.com/watch?v=r6sGWTCMz2k"
    type: video
  - title: "Khan Academy — Fourier series introduction"
    url: "https://www.khanacademy.org/science/electrical-engineering/ee-signals/ee-fourier-series"
    type: course
  - title: "Better Explained — An Interactive Guide To The Fourier Transform"
    url: "https://betterexplained.com/articles/an-interactive-guide-to-the-fourier-transform/"
    type: blog
status: published
---

## intro
A Fourier series rebuilds any reasonable periodic function as a sum of plain sines and cosines whose frequencies are whole-number multiples of a single base frequency. Where a Taylor series approximates a function near one point with powers of \(x\), a Fourier series approximates it across an entire period with oscillations. The surprising claim is that a jagged square wave, a ramp, even a spiky pulse train, are all just sine waves added in the right proportions — and the proportions fall out of a single integral.

## whyItMatters
Almost every signal you touch lives more naturally as a sum of frequencies than as a list of samples. Audio compression keeps the loud frequency components and discards the quiet ones; JPEG does the same for image blocks with a cosine variant. Equalizers, noise filters, and pitch detection all operate on the frequency picture. Beyond signals, Fourier himself invented the idea to solve the heat equation: decomposing temperature into sinusoidal modes turns a hard partial differential equation into a handful of independent ordinary ones, because each sinusoid evolves on its own. The deeper payoff is the building-block mindset — represent a complicated thing in a basis where every piece behaves simply, solve per piece, then add the pieces back.

## intuition
Start with the reframe: any periodic function — one that repeats with period \(T\) — can be written as a constant plus a stack of sines and cosines at the base frequency and all its integer multiples (the **harmonics**). On \([-\pi, \pi]\) with period \(2\pi\) the recipe reads
\[
f(x) = \frac{a_0}{2} + \sum_{k=1}^{\infty} \big(a_k \cos(kx) + b_k \sin(kx)\big).
\]
The \(k=1\) term wobbles once per period (the **fundamental**); \(k=2\) wobbles twice, \(k=3\) three times, and so on. Each harmonic carries its own amplitude. Adding more harmonics is like adding finer and finer detail to a drawing — the broad shape appears first, then the sharp features.

The square wave is the cleanest example. Take a wave that sits at \(+1\) for half the period and \(-1\) for the other half. Its Fourier series uses **only the odd harmonics**, each with amplitude \(\frac{4}{\pi k}\):
\[
\text{sq}(x) = \frac{4}{\pi}\Big(\sin x + \tfrac{1}{3}\sin 3x + \tfrac{1}{5}\sin 5x + \tfrac{1}{7}\sin 7x + \cdots\Big).
\]
The first term alone, \(\frac{4}{\pi}\sin x \approx 1.27\sin x\), is a lone hump that already captures the up-down swing. Add \(\frac{1}{3}\) of the third harmonic and the hump flattens on top, edging toward a flat plateau. Add the fifth, seventh, ninth — each smaller, \(\frac{4}{3\pi}, \frac{4}{5\pi}, \frac{4}{7\pi}\) — and the plateau levels out while the sides steepen into near-vertical jumps. The partial sums sharpen the corners as you include more terms.

One stubborn artifact survives no matter how many harmonics you add: a fixed **overshoot** of about 9% right next to each jump, called the **Gibbs phenomenon**. The little spike beside the cliff edge does not shrink as \(k\) grows — it only narrows and slides toward the discontinuity. So the partial sum converges to the square wave everywhere except in an ever-thinner sliver at the jumps, where it always overshoots by roughly the same height. This is the price of approximating a discontinuous function with smooth waves.

## visualization
```
Square-wave partial sums:  sq(x) = sum over odd k of (4/(pi*k)) sin(k x)

  k       amplitude  4/(pi k)     running sum at x = pi/2 (peak)
  1       1.27324                 1.27324
  3       0.42441                 0.84883
  5       0.25465                 1.10348
  7       0.18189                 0.92159
  9       0.14147                 1.06306
 11       0.11575                 0.94731
  ...     ...                     ...
 oo       ->  0                   -> 1.00000  (target value)

peak overshoot near a jump stays ~ +9% (Gibbs), never vanishes
```

## bruteForce
The naive way to evaluate a Fourier series is to fix a number of harmonics \(N\), then for each sample point \(x\) loop over the terms and add \(\frac{4}{\pi k}\sin(kx)\) for every odd \(k\) up to \(N\). It is direct and needs nothing but a sine call per term, so reconstructing a wave at \(M\) sample points with \(N\) harmonics costs \(O(MN)\). That is fine for a demo, but it is wasteful when the underlying data is discrete: recomputing each frequency's contribution independently ignores the shared structure that a fast transform exploits, and convergence near jumps is slow thanks to Gibbs.

## optimal
Two questions hide inside "Fourier series": how do you *find* the coefficients, and how do you *compute* them fast for sampled data?

Finding the coefficients relies on **orthogonality**. Over one period, distinct sinusoids are orthogonal — \(\int_{-\pi}^{\pi}\sin(kx)\sin(mx)\,dx = 0\) whenever \(k \ne m\), and equals \(\pi\) when \(k = m\). So if you multiply \(f(x)\) by \(\sin(mx)\) and integrate over a period, every term in the series vanishes except the one matching \(m\), which leaves you exactly its amplitude. That isolation trick gives the coefficient formulas
\[
a_k = \frac{1}{\pi}\int_{-\pi}^{\pi} f(x)\cos(kx)\,dx,\qquad
b_k = \frac{1}{\pi}\int_{-\pi}^{\pi} f(x)\sin(kx)\,dx.
\]
Each coefficient is a single integral — exactly the area-under-a-curve idea from the integral lesson, applied to \(f\) times a probe wave. Symmetry shortcuts help: an **odd** function (like the square wave) has all \(a_k = 0\); an **even** function has all \(b_k = 0\). Recognizing symmetry halves the work.

For **discrete sampled data** the integrals become sums, giving the Discrete Fourier Transform. Computing all \(N\) coefficients directly is \(O(N^2)\) — each of \(N\) outputs sums over \(N\) inputs. The **Fast Fourier Transform** reorganizes that computation by recursively splitting even and odd indices, collapsing the cost to \(O(N \log N)\). On a million samples that is the difference between a trillion operations and twenty million; the FFT is what makes real-time audio and image processing possible. When you only need a coarse reconstruction, a **few harmonics suffice** — most of a smooth signal's energy lives in the low frequencies, so keeping the first handful captures the shape and truncating the rest is exactly what lossy compression does.

```python
import math

def square_coeff(k):
    return 4 / (math.pi * k) if k % 2 == 1 else 0.0  # odd harmonics only

def partial_sum(x, N):
    return sum(square_coeff(k) * math.sin(k * x) for k in range(1, N + 1))

print(round(partial_sum(math.pi / 2, 99), 4))  # ~1.0064, near the +1 plateau
```

## complexity
time: O(MN) to reconstruct M points from N harmonics; O(N^2) for a naive DFT of N samples; O(N log N) with the FFT
space: O(N) to store the harmonic coefficients; O(M) for the reconstructed samples
notes: A single coefficient is one integral, O(K) for a K-point numerical quadrature. The FFT's O(N log N) over the naive O(N^2) is the whole reason frequency-domain processing is practical at scale.

## pitfalls
- Expecting the Gibbs overshoot to vanish with more harmonics. It does not — the ~9% spike beside each jump only narrows and shifts toward the discontinuity. Fix: smooth the truncation with a window (Lanczos / Fejér averaging) instead of a hard cutoff if the overshoot matters.
- Aliasing from undersampling. If you sample a signal below twice its highest frequency (the Nyquist rate), high frequencies masquerade as low ones and the coefficients are wrong. Fix: low-pass filter before sampling, or sample faster.
- Missing the even/odd symmetry simplification. Computing all \(a_k\) for an odd function wastes half the integrals on guaranteed zeros. Fix: check symmetry first — odd kills cosines, even kills sines.
- Confusing period with frequency. Harmonic \(k\) has frequency proportional to \(k\) but the *base* period is fixed; doubling the period halves the fundamental frequency, it does not change \(k\). Fix: write the series in terms of \(\frac{2\pi k}{T}\) explicitly and keep \(T\) separate from \(k\).
- Forgetting the \(\frac{a_0}{2}\) DC term. A wave that does not average to zero needs its constant offset, or the reconstruction is shifted vertically.

## interviewTips
- Lead with orthogonality: it is *why* the coefficient integrals work, and stating it shows you understand the mechanism, not just the formula.
- Quote the FFT's \(O(N \log N)\) versus the naive DFT's \(O(N^2)\), and name the divide-and-conquer split on even/odd indices as the reason.
- Mention Gibbs and Nyquist proactively when discussing reconstruction — they are the two artifacts an interviewer probes for, and naming them first signals real familiarity.

## keyTakeaways
- Any periodic function decomposes into a constant plus sines and cosines at integer-multiple frequencies; the square wave is the odd harmonics with amplitude \(\frac{4}{\pi k}\).
- Each coefficient is one integral, isolated by the orthogonality of distinct sinusoids over a period; symmetry zeroes out half of them.
- The FFT computes the discrete spectrum in \(O(N \log N)\) instead of \(O(N^2)\), and the Gibbs overshoot near jumps never disappears.

## code.python
```python
import math

def square_partial_sum(x, N):
    # sum over odd k up to N of (4 / (pi*k)) * sin(k*x)
    total = 0.0
    for k in range(1, N + 1, 2):
        total += (4 / (math.pi * k)) * math.sin(k * x)
    return total

x = math.pi / 2          # peak of the plateau; target value is +1
print(round(square_partial_sum(x, 49), 6))  # ~1.012988 (Gibbs overshoot)
```

## code.javascript
```javascript
function squarePartialSum(x, N) {
  let total = 0;
  for (let k = 1; k <= N; k += 2) total += (4 / (Math.PI * k)) * Math.sin(k * x);
  return total; // sum over odd k of (4/(pi k)) sin(k x)
}

const x = Math.PI / 2;                 // target plateau value is +1
console.log(squarePartialSum(x, 49).toFixed(6)); // ~1.012988
```

## code.java
```java
public class FourierSquare {
    static double squarePartialSum(double x, int N) {
        double total = 0;
        for (int k = 1; k <= N; k += 2) total += (4 / (Math.PI * k)) * Math.sin(k * x);
        return total; // sum over odd k of (4/(pi k)) sin(k x)
    }

    public static void main(String[] args) {
        double x = Math.PI / 2;        // target plateau value is +1
        System.out.printf("%.6f%n", squarePartialSum(x, 49)); // ~1.012988
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>

double square_partial_sum(double x, int N) {
    double total = 0;
    for (int k = 1; k <= N; k += 2) total += (4.0 / (M_PI * k)) * std::sin(k * x);
    return total; // sum over odd k of (4/(pi k)) sin(k x)
}

int main() {
    double x = M_PI / 2;               // target plateau value is +1
    std::printf("%.6f\n", square_partial_sum(x, 49)); // ~1.012988
    return 0;
}
```
