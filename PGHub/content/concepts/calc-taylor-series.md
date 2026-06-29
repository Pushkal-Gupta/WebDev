---
slug: calc-taylor-series
module: calculus
title: Taylor Series
subtitle: Rebuild any smooth function as an infinite polynomial by matching its value and every derivative at a single point.
difficulty: Advanced
position: 8
estimatedReadMinutes: 10
prereqs: [calc-derivative-as-slope, calc-chain-rule]
relatedProblems: []
references:
  - title: "3Blue1Brown — Essence of Calculus, Chapter 11: Taylor series"
    url: "https://www.youtube.com/watch?v=3d6DsjIBzJ4"
    type: video
  - title: "Khan Academy — Taylor & Maclaurin series"
    url: "https://www.khanacademy.org/math/ap-calculus-bc/bc-series-new/bc-10-11/v/maclaurin-and-taylor-series-intuition"
    type: course
  - title: "Paul's Online Math Notes — Taylor Series"
    url: "https://tutorial.math.lamar.edu/classes/calcii/taylorseries.aspx"
    type: blog
status: published
---

## intro
A Taylor series rewrites a smooth function as an infinite polynomial — a sum of powers of \((x - a)\) whose coefficients are fixed by the function's derivatives at a single anchor point \(a\). Polynomials are the friendliest functions we have: you can add, multiply, differentiate, and evaluate them with nothing but arithmetic. The Taylor series says that near \(a\), a transcendental beast like \(\sin x\), \(e^x\), or \(\ln(1+x)\) is *indistinguishable* from such a polynomial, and the more terms you keep, the wider and tighter that agreement becomes.

## whyItMatters
Computers cannot compute \(\sin\), \(\exp\), or \(\log\) directly — under the hood, math libraries evaluate truncated Taylor (or closely related) polynomials, because a CPU only knows how to add and multiply. Beyond hardware, Taylor expansion is the universal tool for *linearization*: replacing a messy function by its first one or two terms turns hard problems into tractable ones. Newton's method, gradient descent's second-order cousins, the small-angle approximation \(\sin\theta \approx \theta\) in physics, error propagation in statistics, and the entire field of perturbation theory all rest on truncated Taylor series. When an analysis says "to first order" or "to leading order," it means "keep the first Taylor terms."

## intuition
Picture standing at a single point \(a\) on a curve and trying to mimic the whole curve using only what you can measure *right there*. The cheapest mimic is a horizontal line at the same height: match the **value**, \(p_0(x) = f(a)\). It is correct at \(a\) and wrong everywhere else. Next, match the **slope** too: tilt the line so its derivative equals \(f'(a)\). Now you have the tangent line, \(p_1(x) = f(a) + f'(a)(x - a)\) — the best straight-line approximation, accurate for small steps away from \(a\). It still misses because the true curve bends, so next match the **curvature**: add a parabola term whose second derivative equals \(f''(a)\). Keep going — match the third derivative to capture how the bending itself changes, the fourth, and so on. Each new derivative you match pins down one more wiggle of the function.

The bookkeeping that makes every derivative line up is the factorial. The \(k\)-th term is
\[
\frac{f^{(k)}(a)}{k!}\,(x - a)^k,
\]
and the \(k!\) is exactly the factor that pops out when you differentiate \((x-a)^k\) that many times, so the \(k\)-th derivative of the whole polynomial at \(a\) collapses to precisely \(f^{(k)}(a)\). Stacking all the terms gives the **Taylor series** centered at \(a\); centering at \(a = 0\) is special-cased and called the **Maclaurin series**.

Concrete numbers make it vivid. Take \(e^x\) at \(x = 1\), whose true value is \(2.71828\dots\). The Maclaurin series \(e^x = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots\) gives partial sums \(1\), then \(2\), then \(2.5\), then \(2.667\), then \(2.708\), then \(2.717\) — visibly marching toward \(e\), each factorial in the denominator crushing the next term faster than the powers of \(x\) can grow. That crushing is why the series for \(e^x\), \(\sin x\), and \(\cos x\) converges for *every* \(x\). Other functions are pickier: \(\frac{1}{1-x} = 1 + x + x^2 + \cdots\) only converges for \(|x| < 1\), and \(\ln(1+x)\) only for \(-1 < x \le 1\). The set of \(x\) where the series actually equals the function is governed by the **radius of convergence** \(R\): inside \(|x - a| < R\) the polynomial is faithful, outside it diverges into nonsense.

## visualization
```
e^x at x = 1     term t_k = t_{k-1} * x / k      true value = 2.718281828...

 k   term t_k        partial sum S_k       |error|
 0   1.000000        1.000000              1.71828
 1   1.000000        2.000000              0.71828
 2   0.500000        2.500000              0.21828
 3   0.166667        2.666667              0.05161
 4   0.041667        2.708333              0.00995
 5   0.008333        2.716667              0.00161
 6   0.001389        2.718056              0.00023

each term = previous * (x / k); factorial growth shrinks |error| fast
```

## bruteForce
The direct approach is to compute each term from scratch: for the \(k\)-th term, raise \(x\) to the \(k\)-th power, compute \(k!\) by multiplying \(1 \cdot 2 \cdots k\), multiply by the \(k\)-th derivative coefficient, then add to a running sum. It works and reads exactly like the formula, but it is wasteful and fragile. Recomputing \(x^k\) and \(k!\) from zero every iteration repeats almost all of the previous iteration's multiplications, turning an \(O(n)\) job into \(O(n^2)\), and \(k!\) overflows a 64-bit integer past \(k = 20\) and a double past \(k \approx 170\) — long before the series itself misbehaves.

## optimal
The fix is to never form \(x^k\) or \(k!\) explicitly. Consecutive terms of a Taylor series differ by a simple ratio, so each term is built from the one before it. For \(e^x\),
\[
t_k = \frac{x^k}{k!} = \frac{x^{k-1}}{(k-1)!}\cdot\frac{x}{k} = t_{k-1}\cdot\frac{x}{k},
\]
so a single multiply and a single divide produce the next term — no powers, no factorials, no overflow, and the whole sum costs \(O(n)\) time and \(O(1)\) space. For \(\sin x\) the recurrence is \(t_k = -t_{k-1}\cdot \frac{x^2}{(2k)(2k+1)}\), skipping the even powers and flipping sign each step. This term recurrence is the single most important implementation idea here; reach for it every time.

Two refinements matter for accuracy. First, you can stop early: keep adding terms until \(|t_k|\) drops below your tolerance, since for a convergent series the terms shrink and the tail is bounded by roughly the first omitted term. The **remainder** after \(n\) terms is captured exactly by Lagrange's form, \(R_n = \frac{f^{(n+1)}(\xi)}{(n+1)!}(x-a)^{n+1}\) for some \(\xi\) between \(a\) and \(x\); it tells you the truncation error and confirms that, where the series converges, \(R_n \to 0\). Second, the **radius of convergence** \(R\) sets the rules of engagement: inside \(|x - a| < R\) truncation works beautifully and few terms suffice when \(x\) is close to \(a\); outside \(R\) no number of terms helps. For \(e^x\), \(\sin\), and \(\cos\), \(R = \infty\), but accuracy near a far-away \(x\) still demands many terms because the early terms grow before the factorials win. The practical move when \(x\) is far from the center is **range reduction** — exploit identities (e.g. \(e^x = e^{\lfloor x \rfloor}\cdot e^{\{x\}}\), or reduce \(\sin\) modulo \(2\pi\)) to bring the argument near zero before summing, so a short polynomial nails it.

```python
def exp_taylor(x, terms=12):
    term, total = 1.0, 1.0       # t_0 = 1, running sum starts at it
    for k in range(1, terms):
        term *= x / k            # t_k = t_{k-1} * x / k  (no x**k, no k!)
        total += term
    return total

print(round(exp_taylor(1.0), 6))   # 2.718282  (-> e)
```

## complexity
time: O(n) for n terms using the term recurrence (one multiply + one add per term); the naive recompute-from-scratch version is O(n^2)
space: O(1) — keep only the running term and the running sum
notes: Convergence speed depends on |x - a| relative to the radius R: terms shrink fastest when x is near the center. Range reduction brings x close to a so few terms reach machine precision. The Lagrange remainder R_n bounds the truncation error.

## pitfalls
- **Using the series outside its radius of convergence.** \(\frac{1}{1-x}\) or \(\ln(1+x)\) past \(|x| = 1\) gives diverging garbage no matter how many terms you add. Fix: check that \(|x - a| < R\); if not, re-center the expansion or use an identity to bring \(x\) inside.
- **Computing \(k!\) or \(x^k\) directly and overflowing.** \(k!\) blows past a 64-bit integer at \(k = 21\) and a double around \(k = 171\). Fix: use the term recurrence \(t_k = t_{k-1}\cdot \frac{x}{k}\) so neither quantity is ever formed explicitly.
- **Trusting a fixed term count far from the center.** Five terms nail \(e^{0.1}\) but are hopeless for \(e^{10}\). Fix: loop until \(|t_k| < \) tolerance, or apply range reduction so \(x\) sits near the center before summing.
- **Confusing Taylor with Maclaurin.** A Maclaurin series is just the special case centered at \(a = 0\); using the \(a = 0\) coefficients while pretending you expanded about some other \(a\) silently corrupts every term. Fix: be explicit about the center and use \((x - a)^k\), not \(x^k\), unless \(a = 0\).

## interviewTips
- State the formula and the role of \(k!\): the \(\frac{1}{k!}\) is exactly what makes the polynomial's \(k\)-th derivative at \(a\) equal \(f^{(k)}(a)\) — derive it if asked rather than reciting it.
- Always implement with the term recurrence \(t_k = t_{k-1}\cdot\frac{x}{k}\) (or the \(\sin\) variant) and call out that it avoids both the \(O(n^2)\) cost and factorial overflow of the naive version.
- Mention radius of convergence and range reduction unprompted — knowing *when* the approximation is valid and how to make a far-away argument tractable separates a memorized formula from real understanding.

## keyTakeaways
- A Taylor series reconstructs a smooth function as \(\sum \frac{f^{(k)}(a)}{k!}(x-a)^k\) by matching value, slope, curvature, and every higher derivative at one point.
- Evaluate it with the term recurrence \(t_k = t_{k-1}\cdot\frac{x}{k}\) for \(O(n)\) time, \(O(1)\) space, and no factorial overflow.
- The radius of convergence and the Lagrange remainder say where and how well the truncated polynomial works; range-reduce a far argument before summing.

## code.python
```python
def exp_taylor(x, terms=20):
    term, total = 1.0, 1.0          # t_0 = 1
    for k in range(1, terms):
        term *= x / k               # t_k = t_{k-1} * x / k
        total += term
    return total

print(round(exp_taylor(1.0), 6))    # 2.718282  (-> e)
```

## code.javascript
```javascript
function expTaylor(x, terms = 20) {
  let term = 1.0, total = 1.0;      // t_0 = 1
  for (let k = 1; k < terms; k++) {
    term *= x / k;                  // t_k = t_{k-1} * x / k
    total += term;
  }
  return total;
}

console.log(expTaylor(1.0).toFixed(6)); // 2.718282  (-> e)
```

## code.java
```java
public class ExpTaylor {
    static double expTaylor(double x, int terms) {
        double term = 1.0, total = 1.0;       // t_0 = 1
        for (int k = 1; k < terms; k++) {
            term *= x / k;                    // t_k = t_{k-1} * x / k
            total += term;
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.printf("%.6f%n", expTaylor(1.0, 20)); // 2.718282 -> e
    }
}
```

## code.cpp
```cpp
#include <cstdio>

double exp_taylor(double x, int terms) {
    double term = 1.0, total = 1.0;           // t_0 = 1
    for (int k = 1; k < terms; ++k) {
        term *= x / k;                        // t_k = t_{k-1} * x / k
        total += term;
    }
    return total;
}

int main() {
    std::printf("%.6f\n", exp_taylor(1.0, 20)); // 2.718282 -> e
    return 0;
}
```
