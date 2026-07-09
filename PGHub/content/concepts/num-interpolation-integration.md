---
slug: num-interpolation-integration
module: numerical-methods
title: Interpolation and Numerical Integration
subtitle: Fitting a curve through sampled points, why high-degree fits explode at the edges, and how Simpson's rule wins accuracy per function evaluation.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Numerical Recipes, 3rd ed. — Interpolation & Integration of Functions"
    url: "https://numerical.recipes/"
    type: book
  - title: "MIT OCW 18.330 — Introduction to Numerical Analysis (Spring 2012)"
    url: "https://ocw.mit.edu/courses/18-330-introduction-to-numerical-analysis-spring-2012/"
    type: course
  - title: "MIT OCW 18.335J — Introduction to Numerical Methods (Spring 2019)"
    url: "https://ocw.mit.edu/courses/18-335j-introduction-to-numerical-methods-spring-2019/"
    type: course
status: published
---

## intro
You have a function known only at a handful of sampled points — a sensor logged temperatures every hour, or a physics kernel is too expensive to call except at chosen inputs. Two questions follow almost immediately: what value does the function take *between* the samples, and what is the *total area* underneath it? Interpolation answers the first by threading a smooth curve through the data; numerical integration (quadrature) answers the second by summing the areas of simple shapes that approximate that curve. Both are workhorses of scientific computing, and both hide sharp traps: naive high-degree fits oscillate wildly, and a poorly chosen rule wastes precious function evaluations.

## whyItMatters
Almost every continuous quantity in engineering and science eventually gets sampled and then reconstructed or integrated. Signal processing resamples audio between measured points; computer graphics interpolate colors, normals, and animation keyframes; finance prices options by integrating payoff distributions with no closed form; physics simulations integrate forces, energies, and probability densities step after step. Machine learning integrates over latent variables and computes expectations that have no analytic answer. When the integrand is a black box you can only *evaluate*, the cost is dominated by the number of evaluations, so a rule that reaches a target accuracy in ten samples instead of a thousand is not a nicety — it is the difference between a simulation that finishes overnight and one that never does. Choosing the right interpolation nodes and the right quadrature rule is therefore a first-order performance and correctness decision, not a detail.

## intuition
Start with **interpolation**. Given \(n+1\) points \((x_0,y_0),\dots,(x_n,y_n)\) with distinct \(x_i\), there is exactly one polynomial of degree \(\le n\) that passes through all of them. The **Lagrange form** writes it explicitly as a weighted sum of basis polynomials, each equal to 1 at its own node and 0 at every other node:
\[
p(x)=\sum_{i=0}^{n} y_i \, L_i(x), \qquad L_i(x)=\prod_{j\ne i}\frac{x-x_j}{x_i-x_j}.
\]
The **Newton form** builds the same polynomial incrementally from *divided differences*, so adding a new data point costs one extra term instead of rebuilding everything — handy when data arrives online. Both describe the identical curve; they differ only in how you compute and update it.

The seductive mistake is to think "more points, higher degree, better fit." For equally spaced nodes this fails spectacularly. Interpolating the innocent-looking \(f(x)=1/(1+25x^2)\) on \([-1,1]\) with a high-degree polynomial produces enormous oscillations near the endpoints that *grow* as you add points — the **Runge phenomenon**. The interior fit improves while the edges blow up, so the maximum error diverges. The cure is not fewer points but *smarter* points: cluster them toward the ends using **Chebyshev nodes**, \(x_k=\cos(k\pi/n)\), which are dense near \(\pm 1\) exactly where equally spaced nodes are too sparse to pin the curve down. Chebyshev interpolation converges beautifully where equally spaced interpolation diverges.

Now **integration**. To approximate \(\int_a^b f\,dx\), slice \([a,b]\) into \(n\) equal strips of width \(h=(b-a)/n\) and approximate the area of each strip with a simple shape. The **trapezoid rule** caps each strip with a straight line connecting consecutive samples — the area of a trapezoid — giving the composite formula \(\int_a^b f\approx \tfrac{h}{2}(f_0+2f_1+2f_2+\dots+2f_{n-1}+f_n)\). Its error shrinks like \(O(h^2)\): halve the spacing and the error drops fourfold. **Simpson's rule** does better by fitting a *parabola* through each consecutive triple of points, capturing curvature the straight line misses: \(\int_a^b f\approx \tfrac{h}{3}(f_0+4f_1+2f_2+4f_3+\dots+4f_{n-1}+f_n)\), with alternating weights 4 and 2 on the interior points. Its error is \(O(h^4)\) — halving \(h\) cuts the error *sixteenfold* for essentially the same number of evaluations. That extra factor per refinement is why Simpson dominates the trapezoid rule in practice, and it costs nothing but a smarter weighting of samples you were already computing.

## visualization
```
integrating  I = ∫₀¹ eˣ dx = e - 1 = 1.71828182...
absolute error vs number of subintervals n  (lower is better)

   n   |  h        |  trapezoid error   |  Simpson error     | trap/Simpson
 ------+-----------+--------------------+--------------------+-------------
    2  |  0.5000   |  3.6e-02           |  5.8e-04           |     ~62x
    4  |  0.2500   |  8.9e-03           |  3.7e-05           |    ~240x
    8  |  0.1250   |  2.2e-03           |  2.3e-06           |    ~957x
   16  |  0.0625   |  5.6e-04           |  1.5e-07           |   ~3700x
   32  |  0.0313   |  1.4e-04           |  9.1e-09           |  ~15000x
 ------+-----------+--------------------+--------------------+-------------
 ratio |           |  each row /4.0     |  each row /16.0    |
        each time n doubles: trapezoid error /4 (O(h^2)),  Simpson /16 (O(h^4))
```

## bruteForce
The straightforward tools are the trapezoid rule and equally spaced polynomial interpolation, and both are perfectly usable in their comfort zone. Composite trapezoid is trivial to code, robust, and only needs the function sampled at evenly spaced points — a fine default when the integrand is smooth and you can afford enough strips, or when you only have tabulated data on a uniform grid. Likewise, low-degree interpolation through a few equally spaced nodes reconstructs gentle curves well enough. The trouble is efficiency and stability at scale: reaching high accuracy with the trapezoid rule can demand an order of magnitude more evaluations than Simpson because its error only falls as \(O(h^2)\), and pushing interpolation to high degree on equally spaced nodes triggers the Runge phenomenon, so the "obvious" fix of adding more points actively makes the fit worse near the boundaries.

## optimal
Prefer **Simpson's rule** for smooth integrands: for the same evenly spaced samples, its \(O(h^4)\) error crushes the trapezoid rule's \(O(h^2)\), so it reaches a target accuracy with far fewer function evaluations — the metric that actually matters when \(f\) is expensive. The only constraints are that Simpson needs an **even** number of subintervals \(n\) (it consumes points in triples spanning two strips) and that the integrand be reasonably smooth, since the \(h^4\) advantage comes from the fourth derivative and evaporates on kinked or discontinuous functions. When the integrand has regions of rapid change, switch to **adaptive quadrature**: recursively bisect each interval, compare a coarse estimate against the sum of two finer sub-estimates, and keep subdividing only where the discrepancy exceeds tolerance. This concentrates evaluations where curvature demands them and leaves smooth stretches cheap, achieving a target error with near-minimal work. For interpolation, abandon equally spaced nodes at high degree and use **Chebyshev nodes** \(x_k=\cos(k\pi/n)\), which cluster toward the endpoints and defeat the Runge phenomenon, delivering rapidly (often exponentially) converging fits for analytic functions. Beyond these, **Gaussian quadrature** goes further still: by choosing both the sample locations *and* their weights optimally, an \(m\)-point Gauss rule integrates polynomials up to degree \(2m-1\) exactly, wringing maximal accuracy from each of the \(m\) evaluations. The unifying discipline: spend evaluations where the function is hard, weight samples to cancel low-order error, and never let equally spaced high-degree fits lull you into a Runge blowup.

```python
def f(x):
    return 4.0 / (1.0 + x * x)   # integral over [0,1] is exactly pi

def simpson(fn, a, b, n):
    if n % 2:                     # Simpson requires an even count
        n += 1
    h = (b - a) / n
    total = fn(a) + fn(b)
    for i in range(1, n):
        total += (4 if i % 2 else 2) * fn(a + i * h)
    return total * h / 3.0

print(simpson(f, 0.0, 1.0, 100))   # 3.14159265... approx pi
```

## complexity
time: O(n) function evaluations for a composite trapezoid or Simpson rule over n subintervals; each sample is used once. Adaptive quadrature is O(n) in the number of nodes it chooses, but that n is far smaller for a given accuracy because refinement targets only hard regions. Lagrange interpolation is O(n^2) to evaluate at a point directly (O(n) per basis times n bases); Newton's divided differences build in O(n^2) then evaluate in O(n).
space: O(1) extra for a fixed-rule quadrature that streams samples, O(n) if you store the sampled points; O(n) for interpolation coefficients or the divided-difference table; adaptive quadrature uses O(depth) recursion stack.
notes: The headline is error order, not raw operation count -- trapezoid error is O(h^2), Simpson is O(h^4), so per doubling of n the trapezoid error falls 4x while Simpson's falls 16x, meaning Simpson reaches a tolerance with roughly the square root of the evaluations trapezoid needs. Gaussian quadrature raises the exact-degree to 2m-1 for m points.

## pitfalls
- **The Runge phenomenon.** Increasing the degree of an equally spaced polynomial interpolant does not monotonically improve it; near the endpoints the interpolant oscillates with amplitude that *grows* with degree, so the max error diverges. Use Chebyshev nodes, or switch to piecewise (spline) interpolation, instead of pushing a single high-degree polynomial.
- **Simpson's rule needs an even number of subintervals.** Feeding it an odd \(n\) breaks the 4-2-4 weighting pattern (points can no longer be grouped into panels of two strips) and silently degrades or corrupts the result. Always round \(n\) up to even, or handle the leftover strip with a separate rule.
- **Applying high-order rules to non-smooth integrands.** Simpson's \(O(h^4)\) accuracy relies on a bounded fourth derivative. On a function with a kink, jump, or singularity, Simpson can be no better than — or worse than — trapezoid. Split the domain at the singular point or use adaptive quadrature.
- **Uniform sampling that aliases the integrand.** Equally spaced samples can completely miss a narrow spike between nodes, returning a confident but wrong answer. Refine adaptively or sample densely enough to resolve the smallest feature.
- **Confusing interpolation error with integration error.** A wiggly interpolant can still integrate accurately (oscillations cancel), and a decent-looking fit can integrate poorly. Judge each task by its own error metric rather than assuming a good curve fit implies a good area.

## interviewTips
- Be ready to state the error orders cold: trapezoid is \(O(h^2)\), Simpson is \(O(h^4)\), and explain the consequence — each halving of \(h\) cuts trapezoid error 4x but Simpson error 16x, so Simpson hits a tolerance with dramatically fewer evaluations of an expensive integrand.
- If asked to "just fit a polynomial through these points," raise the Runge phenomenon unprompted and propose Chebyshev nodes or splines. Recognizing that equally spaced high-degree interpolation is a trap signals real numerical maturity.
- Mention adaptive quadrature as the production answer when the integrand varies sharply: recursively subdivide, compare coarse vs. fine estimates against a tolerance, and refine only where they disagree — spending evaluations where the function is hard.

## keyTakeaways
- Exactly one polynomial of degree \(\le n\) passes through \(n+1\) points; Lagrange and Newton forms describe the same curve, but equally spaced high-degree fits suffer the Runge phenomenon and must be replaced by Chebyshev nodes or splines.
- Composite trapezoid (\(O(h^2)\)) caps each strip with a line; Simpson's rule (\(O(h^4)\)) caps each panel with a parabola and, for the same samples, reaches a target accuracy with far fewer evaluations — the metric that matters when \(f\) is costly.
- Simpson needs an even number of subintervals and a smooth integrand; when the function varies sharply, adaptive quadrature (and, for maximal accuracy per point, Gaussian quadrature) concentrates work where curvature demands it.

## code.python
```python
def f(x):
    return 4.0 / (1.0 + x * x)     # exact integral over [0,1] is pi

def trapezoid(fn, a, b, n):
    h = (b - a) / n
    total = 0.5 * (fn(a) + fn(b))
    for i in range(1, n):
        total += fn(a + i * h)
    return total * h

def simpson(fn, a, b, n):
    if n % 2:                       # Simpson requires an even n
        n += 1
    h = (b - a) / n
    total = fn(a) + fn(b)
    for i in range(1, n):
        total += (4 if i % 2 else 2) * fn(a + i * h)
    return total * h / 3.0

print(round(trapezoid(f, 0.0, 1.0, 100), 8))  # 3.14157599
print(round(simpson(f, 0.0, 1.0, 100), 10))   # 3.1415926536
```

## code.javascript
```javascript
const f = (x) => 4 / (1 + x * x);   // exact integral over [0,1] is pi

function trapezoid(fn, a, b, n) {
  const h = (b - a) / n;
  let total = 0.5 * (fn(a) + fn(b));
  for (let i = 1; i < n; i++) total += fn(a + i * h);
  return total * h;
}

function simpson(fn, a, b, n) {
  if (n % 2) n += 1;                // Simpson requires an even n
  const h = (b - a) / n;
  let total = fn(a) + fn(b);
  for (let i = 1; i < n; i++) total += (i % 2 ? 4 : 2) * fn(a + i * h);
  return (total * h) / 3;
}

console.log(trapezoid(f, 0, 1, 100).toFixed(8));  // 3.14157599
console.log(simpson(f, 0, 1, 100).toFixed(10));   // 3.1415926536
```

## code.java
```java
import java.util.function.DoubleUnaryOperator;

public class Quadrature {
    static double trapezoid(DoubleUnaryOperator fn, double a, double b, int n) {
        double h = (b - a) / n;
        double total = 0.5 * (fn.applyAsDouble(a) + fn.applyAsDouble(b));
        for (int i = 1; i < n; i++) total += fn.applyAsDouble(a + i * h);
        return total * h;
    }

    static double simpson(DoubleUnaryOperator fn, double a, double b, int n) {
        if (n % 2 == 1) n += 1;                     // Simpson requires an even n
        double h = (b - a) / n;
        double total = fn.applyAsDouble(a) + fn.applyAsDouble(b);
        for (int i = 1; i < n; i++)
            total += (i % 2 == 1 ? 4 : 2) * fn.applyAsDouble(a + i * h);
        return total * h / 3.0;
    }

    public static void main(String[] args) {
        DoubleUnaryOperator f = x -> 4.0 / (1.0 + x * x);   // integral over [0,1] = pi
        System.out.printf("%.8f%n", trapezoid(f, 0, 1, 100));  // 3.14157599
        System.out.printf("%.10f%n", simpson(f, 0, 1, 100));   // 3.1415926536
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <functional>

double trapezoid(std::function<double(double)> fn, double a, double b, int n) {
    double h = (b - a) / n;
    double total = 0.5 * (fn(a) + fn(b));
    for (int i = 1; i < n; ++i) total += fn(a + i * h);
    return total * h;
}

double simpson(std::function<double(double)> fn, double a, double b, int n) {
    if (n % 2) ++n;                                  // Simpson requires an even n
    double h = (b - a) / n;
    double total = fn(a) + fn(b);
    for (int i = 1; i < n; ++i) total += (i % 2 ? 4 : 2) * fn(a + i * h);
    return total * h / 3.0;
}

int main() {
    auto f = [](double x) { return 4.0 / (1.0 + x * x); };   // integral over [0,1] = pi
    std::printf("%.8f\n", trapezoid(f, 0, 1, 100));   // 3.14157599
    std::printf("%.10f\n", simpson(f, 0, 1, 100));    // 3.1415926536
    return 0;
}
```
