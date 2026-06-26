---
slug: calc-optimization
module: calculus
title: Optimization with Derivatives
subtitle: The flat spots of a curve are where the maxima and minima hide — find them by setting the slope to zero.
difficulty: Intermediate
position: 6
estimatedReadMinutes: 10
prereqs: [calc-derivative-as-slope]
relatedProblems: []
references:
  - title: "3Blue1Brown — Essence of Calculus, Chapter 3: Derivative formulas through geometry"
    url: "https://www.youtube.com/watch?v=S0_qX4VJhMQ"
    type: video
  - title: "Khan Academy — Using derivatives to analyze functions (maxima, minima, concavity)"
    url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-diff-analytical-applications-new"
    type: course
  - title: "Paul's Online Math Notes — Minimum and Maximum Values"
    url: "https://tutorial.math.lamar.edu/classes/calci/minmaxvalues.aspx"
    type: blog
status: published
---

## intro
"Find the best" is the most common applied math question there is — cheapest design, fastest route, highest profit, smallest error. Calculus answers it with a single sharp observation: at a smooth peak or valley, the tangent line is horizontal, so the derivative is zero. Solve \(f'(x) = 0\), classify each solution, and you have located every interior maximum and minimum a curve can hold.

## whyItMatters
Optimization is the engine under an enormous amount of engineering and science. Minimizing a loss function is literally how every neural network learns; gradient descent walks downhill using exactly the derivative-is-zero criterion as its stopping target. Economics maximizes utility and minimizes cost; physics finds equilibria where potential energy is stationary; control systems hold setpoints by driving an error derivative to zero. The one-variable case here is the seed of the whole field: the gradient in many variables is just a vector of these derivatives, and "set the gradient to zero" generalizes "set \(f'(x)=0\)." Master the geometry of stationary points in one dimension and the high-dimensional machinery stops being mysterious — it is the same idea, stacked.

## intuition
Walk along the graph of a smooth function. Where it climbs, the tangent tilts up — \(f'(x) > 0\). Where it descends, the tangent tilts down — \(f'(x) < 0\). At the exact instant the curve stops rising and starts falling (a peak) or stops falling and starts rising (a valley), the tangent is momentarily **flat**: \(f'(x) = 0\). These flat-tangent locations are the **critical points**, and every interior maximum or minimum of a differentiable function must be one of them. That is the whole hunting strategy: maxima and minima can only live where the slope vanishes (or at the boundary of the domain, or where the derivative fails to exist).

But a zero slope alone does not tell you *which kind* of flat spot you found. There are three: a local maximum (curve arches over, like the top of a hill), a local minimum (curve cups upward, like the bottom of a bowl), and an inflection-with-flat-tangent such as \(f(x) = x^3\) at the origin, where the slope is zero yet the curve keeps rising straight through. To tell them apart you ask about **concavity** — which way the curve bends — and concavity is measured by the *second* derivative \(f''(x)\).

Think of \(f''\) as the rate at which the slope itself is changing. If \(f''(x) > 0\), the slope is increasing as you move right: the curve is concave up, cupping like a valley, so a critical point there is a **minimum**. If \(f''(x) < 0\), the slope is decreasing: the curve is concave down, arching like a hill, so a critical point there is a **maximum**. This is the **second-derivative test**. If \(f''(x) = 0\) the test is inconclusive — the bend is too gentle to read at this order — and you fall back to the **first-derivative test**: check the sign of \(f'\) just left and just right of the critical point. Slope flips \(+ \to -\) means a peak; \(- \to +\) means a valley; no flip means neither (a saddle-like inflection).

Concrete example: \(f(x) = x^3 - 3x\). Then \(f'(x) = 3x^2 - 3 = 3(x-1)(x+1)\), zero at \(x = -1\) and \(x = 1\). The second derivative is \(f''(x) = 6x\). At \(x = -1\), \(f'' = -6 < 0\) — concave down — a local **maximum** with value \(f(-1) = 2\). At \(x = 1\), \(f'' = 6 > 0\) — concave up — a local **minimum** with value \(f(1) = -2\). Two equations, fully classified. For a *global* extremum on a closed interval, you also compare these critical values against the endpoint values, because the very best point might sit at the edge rather than at a flat spot.

## visualization
```
f(x) = x^3 - 3x

 f'(x) > 0      f'(x) = 0       f'(x) < 0       f'(x) = 0     f'(x) > 0
 rising         MAX (f''<0)     falling          MIN (f''>0)   rising
    /\                                              \    /
   /  \___        * concave down                    \__/
__/       \                * concave up
          \      /
           \____/
   x=-1  (peak, y=2)               x=+1 (valley, y=-2)

set f'(x)=0  ->  x = -1, +1      classify with f''(x)=6x
```

## bruteForce
The brute-force search is **sampling**: evaluate \(f\) on a dense grid of points across the domain and report the largest and smallest values seen. It needs no calculus and handles functions you cannot differentiate, but it is both expensive and unreliable — to resolve a sharp peak you need a fine grid (many evaluations), and a peak that falls *between* two grid points is missed entirely. The accuracy of the located extremum is bounded by the grid spacing, so halving the error means doubling the work, forever. It tells you *roughly* where the best point is, never exactly.

## optimal
The exact method is **calculus-based**: differentiate, solve \(f'(x) = 0\) for the critical points, classify each with the second-derivative test (\(f''>0 \Rightarrow\) min, \(f''<0 \Rightarrow\) max, \(f''=0 \Rightarrow\) use the first-derivative sign test), then for a global extremum on \([a,b]\) compare the critical values against \(f(a)\) and \(f(b)\). When a formula exists this is exact and cheap — a couple of derivative evaluations and a sign check per candidate, no grid at all.

Why it dominates the grid search: instead of probing thousands of points hoping to straddle the peak, you go straight to the handful of locations where a peak can possibly be, then read off the curvature to know its type. The grid's error scales with spacing; the analytic answer has *zero* location error.

When \(f\) is a black box with no clean derivative, the optimal practical tool is **gradient descent** (or ascent): start somewhere, repeatedly step in the direction the slope points downhill, \(x \leftarrow x - \eta\,f'(x)\), and stop when \(f'(x) \approx 0\). This is the same stationary-point criterion used numerically — it converges toward a critical point far faster than blanket sampling, and it is exactly the algorithm that trains modern models. The learning rate \(\eta\) trades speed against the risk of overshooting; the second-derivative (curvature) information that the classification test uses is the same information that methods like Newton's use to choose smarter step sizes.

```python
def gradient_descent(fprime, x0, lr=0.1, steps=200, tol=1e-9):
    x = x0
    for _ in range(steps):
        g = fprime(x)
        if abs(g) < tol:
            break
        x -= lr * g
    return x

fprime = lambda x: 3 * x ** 2 - 3      # f(x) = x^3 - 3x  ->  min near x = 1
print(round(gradient_descent(fprime, 0.5), 6))   # ~ 1.0  (the local minimum)
```

## complexity
time: O(1) per critical point with the analytic test (a few derivative evaluations); O(k) for k iterations of gradient descent; O(g) for a grid search of g sample points
space: O(1) for the analytic test and for gradient descent (one running iterate); O(1) for grid search if you track only the running best
notes: The analytic method has zero location error when a closed-form derivative is solvable. Gradient descent's error shrinks geometrically near a well-conditioned minimum but can stall at saddle points or oscillate if the learning rate is too large. Grid search error is bounded by the grid spacing and improves only linearly with more samples.

## pitfalls
- Treating every critical point as an extremum. \(f'(x)=0\) is necessary but not sufficient — \(x^3\) at the origin has zero slope yet is neither a max nor a min. Always classify.
- Forgetting the endpoints in a *global* problem on a closed interval. The largest value can sit at a boundary where the derivative is nonzero, so compare critical values against \(f(a)\) and \(f(b)\).
- Forgetting where the derivative *fails to exist*. A corner like \(|x|\) at 0 is a genuine minimum, but \(f'(0)\) is undefined, so setting \(f'=0\) never finds it — check non-differentiable points separately.
- Misreading the second-derivative test when \(f''=0\). It is inconclusive there, not "neither"; you must fall back to the first-derivative sign test before declaring the point's type.
- Confusing local and global. A local minimum found by gradient descent may not be the global minimum; non-convex functions can have many valleys, and the algorithm only guarantees the one it lands in.

## interviewTips
- Lay out the recipe explicitly: find \(f'\), solve \(f'=0\), classify with \(f''\), and for a closed interval also test the endpoints. Interviewers want the full checklist, not just "set the derivative to zero."
- Know the sign reading cold: \(f''>0\) is concave up (a valley/minimum), \(f''<0\) is concave down (a hill/maximum). State it in geometric terms.
- For an applied "minimize cost / maximize area" word problem, write the objective, eliminate variables with the constraint to get one function of one variable, then differentiate — the setup is what's being tested.

## keyTakeaways
- Interior maxima and minima of a smooth function occur only at critical points where \(f'(x)=0\) (plus boundary points and non-differentiable points).
- Classify a critical point with the second derivative: \(f''>0\) means a local minimum (concave up), \(f''<0\) a local maximum (concave down); if \(f''=0\) use the first-derivative sign test.
- For a global extremum on a closed interval, compare critical values against the endpoints; when no formula exists, gradient descent drives \(f'\) toward zero numerically.

## code.python
```python
def classify_critical(fprime, fsecond, x):
    s = fsecond(x)
    if s > 0:   return "local min"
    if s < 0:   return "local max"
    return "inconclusive (use first-derivative test)"

fprime  = lambda x: 3 * x ** 2 - 3     # f = x^3 - 3x
fsecond = lambda x: 6 * x
for c in (-1.0, 1.0):
    print(c, classify_critical(fprime, fsecond, c))
# -1.0 local max   |   1.0 local min
```

## code.javascript
```javascript
function classifyCritical(fprime, fsecond, x) {
  const s = fsecond(x);
  if (s > 0) return "local min";
  if (s < 0) return "local max";
  return "inconclusive (use first-derivative test)";
}

const fprime = (x) => 3 * x ** 2 - 3;   // f = x^3 - 3x
const fsecond = (x) => 6 * x;
for (const c of [-1, 1]) console.log(c, classifyCritical(fprime, fsecond, c));
// -1 local max   |   1 local min
```

## code.java
```java
import java.util.function.DoubleUnaryOperator;

public class Optimize {
    static String classify(DoubleUnaryOperator fsecond, double x) {
        double s = fsecond.applyAsDouble(x);
        if (s > 0) return "local min";
        if (s < 0) return "local max";
        return "inconclusive (use first-derivative test)";
    }

    public static void main(String[] args) {
        DoubleUnaryOperator fsecond = x -> 6 * x;   // f = x^3 - 3x
        for (double c : new double[]{-1.0, 1.0})
            System.out.println(c + " " + classify(fsecond, c));
        // -1.0 local max   |   1.0 local min
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <functional>
#include <string>

std::string classify(const std::function<double(double)>& fsecond, double x) {
    double s = fsecond(x);
    if (s > 0) return "local min";
    if (s < 0) return "local max";
    return "inconclusive (use first-derivative test)";
}

int main() {
    auto fsecond = [](double x) { return 6 * x; };   // f = x^3 - 3x
    for (double c : {-1.0, 1.0})
        std::printf("%.1f %s\n", c, classify(fsecond, c).c_str());
    // -1.0 local max   |   1.0 local min
    return 0;
}
```
