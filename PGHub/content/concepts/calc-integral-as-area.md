---
slug: calc-integral-as-area
module: calculus
title: The Integral as Area
subtitle: Slice the region under a curve into rectangles, add them up, then let the slices vanish.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 9
prereqs: [calc-limits-continuity, calc-derivative-as-slope]
relatedProblems: []
references:
  - title: "3Blue1Brown — Essence of Calculus, Chapter 8: Integration and the fundamental theorem of calculus"
    url: "https://www.youtube.com/watch?v=rfG8ce4nNh0"
    type: video
  - title: "Khan Academy — Accumulations of change and Riemann sums"
    url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-integration-new"
    type: course
  - title: "Paul's Online Math Notes — The Definition of the Definite Integral"
    url: "https://tutorial.math.lamar.edu/classes/calci/defnofdefiniteintegral.aspx"
    type: blog
status: published
---

## intro
The definite integral measures accumulated quantity: the total area trapped between a curve and the horizontal axis over an interval. The idea is disarmingly direct — chop the region into thin vertical rectangles you *can* measure, sum their areas for an estimate, then shrink the rectangle width toward zero so the estimate sharpens into the exact value. That limit of a sum is the integral, and it turns out to be the exact inverse of the derivative.

## whyItMatters
Integration is how you total up something that varies continuously. Distance is the integral of speed; total charge is the integral of current; the work done by a changing force is the integral of force over distance; probability is the area under a density curve, which is why the normal distribution's bell is integrated constantly in statistics and machine learning. Expected values, the area-under-the-ROC-curve metric, the total loss summed over a continuum, the mass of a varying-density rod — all are integrals. Paired with its twin the derivative through the Fundamental Theorem of Calculus, integration completes the core of calculus: derivatives take things apart into instantaneous rates, integrals put them back together into accumulated totals. Almost any "total amount of a changing quantity" question is an integral in disguise.

## intuition
You already know how to find the area of a rectangle: width times height. The trouble with the region under a curve is that the height changes continuously, so there is no single height to multiply by. The fix is to pretend, locally, that it does not change. Slice the interval \([a, b]\) into \(n\) thin strips of width \(\Delta x = \frac{b - a}{n}\). Over each skinny strip the curve barely moves, so approximate that strip's area as a rectangle: width \(\Delta x\) times the curve's height at some sample point in the strip. Add up all \(n\) rectangle areas and you get an estimate of the total. This sum is a **Riemann sum**:
\[
S_n = \sum_{i=1}^{n} f(x_i)\,\Delta x.
\]

The estimate is rough when \(n\) is small — the flat rectangle tops overshoot where the curve dips and undershoot where it rises, leaving little triangular errors along the top edge. But here is the payoff: as you increase \(n\), the rectangles get thinner, those error triangles shrink, and the staircase of rectangle tops hugs the curve ever more tightly. The exact area is the **limit** of the Riemann sum as the strip width goes to zero:
\[
\int_a^b f(x)\,dx = \lim_{n \to \infty} \sum_{i=1}^{n} f(x_i)\,\Delta x.
\]
The integral sign \(\int\) is a stretched "S" for "sum," and \(dx\) is the infinitesimal width the \(\Delta x\) became. Once again the entire idea rides on a limit — accumulate finite pieces, then let the pieces vanish.

Concrete numbers make the convergence visible. Take \(f(x) = x^2\) on \([0, 1]\); the true area is \(\frac{1}{3} \approx 0.3333\). With 4 right-endpoint rectangles the sum is about 0.469 — a coarse overestimate. With 10 rectangles it falls to about 0.385; with 100, about 0.338; with 1000, about 0.3338. The sum is visibly marching toward \(\frac{1}{3}\) as the slices thin. Left endpoints would underestimate and approach the same limit from below; the midpoint rule, sampling each strip's center, converges far faster because its over- and under-shoots partly cancel.

Two cautions the picture teaches. First, area below the axis counts as **negative** — the integral is *signed* area, so a curve dipping under the axis subtracts. Second, the sample point matters for the *estimate* but not the *limit*: left, right, and midpoint sums all converge to the same integral for a continuous function, they just approach it at different speeds.

The deep reward is the **Fundamental Theorem of Calculus**: integration and differentiation undo each other. If \(F\) is an antiderivative of \(f\) (that is \(F' = f\)), then \(\int_a^b f(x)\,dx = F(b) - F(a)\). This is why we rarely sum a million rectangles by hand — we find a function whose derivative is the integrand and evaluate it at the endpoints. For \(x^2\), the antiderivative is \(\frac{x^3}{3}\), so \(\int_0^1 x^2\,dx = \frac{1}{3} - 0 = \frac{1}{3}\), exactly the number the Riemann sums were chasing.

## visualization
```
y                f(x) = x^2 on [0, 1]      true area = 1/3
|
|                                    ___
|                              ___ |   |   <- right-endpoint rectangles
|                        ___ |   ||   |      overshoot the curve top
|                  ___ |   ||   ||   |
|            ___ |   ||   ||   ||   |        thinner strips -> tighter fit
|      ___ |   ||   ||   ||   ||   |
+-----|---|---|---|---|---|---|---|----> x
      0                            1

n = 4    sum ~ 0.469   (coarse, overshoots)
n = 10   sum ~ 0.385
n = 100  sum ~ 0.338
n ->inf  sum ->  1/3 = 0.3333...  = the definite integral
```

## bruteForce
The naive method is the **left or right Riemann sum**: fix a modest \(n\), evaluate \(f\) at one endpoint of each strip, multiply by the width, and add. It is trivial to code and needs only function evaluations, but it is a low-order approximation — its error shrinks only like \(O(1/n)\), so squeezing one more decimal of accuracy demands roughly ten times as many rectangles. Worse, it is biased: on a function that is increasing throughout, the right sum always overestimates and the left always underestimates, so the error never cancels, it just slowly diminishes. Fine for a quick estimate or building intuition, far too slow when you need precision.

## optimal
The optimal path splits by what you have. If you can find an **antiderivative**, the Fundamental Theorem of Calculus gives the exact answer instantly: \(\int_a^b f = F(b) - F(a)\) where \(F' = f\). No rectangles, no limit, no error — just two evaluations. This is the method of choice whenever the integrand has an elementary antiderivative, reachable through the integration techniques (power rule in reverse, substitution as the chain rule undone, integration by parts as the product rule undone).

When no closed-form antiderivative exists — and many real integrands have none — use a **higher-order numerical rule** instead of the crude Riemann sum. The **trapezoidal rule** connects sample points with straight lines instead of flat tops, cutting the error to \(O(1/n^2)\). **Simpson's rule** fits parabolas through triples of points and achieves \(O(1/n^4)\), so it reaches machine precision with a handful of evaluations where the Riemann sum would need millions. The **midpoint rule** is a cheap \(O(1/n^2)\) improvement over endpoints because its symmetric over/under errors cancel. For high dimensions, where grid rules explode combinatorially, **Monte Carlo integration** samples random points and averages — its error scales like \(1/\sqrt{N}\) independent of dimension, which is why expected values and Bayesian integrals in ML are estimated by sampling.

Why each wins: the antiderivative route is exact and O(1) when available; Simpson's rule extracts far more accuracy per evaluation than Riemann by modeling local curvature rather than assuming local flatness; Monte Carlo sidesteps the curse of dimensionality that kills grid methods. The decision tree is: closed-form antiderivative → FTC; smooth 1-D integrand, no antiderivative → Simpson; many dimensions or a probabilistic integrand → Monte Carlo.

```python
def riemann(f, a, b, n, where='mid'):
    dx = (b - a) / n
    total = 0.0
    for i in range(n):
        x = a + i * dx
        if where == 'left':  s = x
        elif where == 'right': s = x + dx
        else:                s = x + dx / 2     # midpoint: fastest of the three
        total += f(s) * dx
    return total

f = lambda x: x * x
for n in (4, 10, 100, 1000):
    print(n, round(riemann(f, 0, 1, n), 6))   # converges to 0.333333 (= 1/3)
```

## complexity
time: O(1) via the Fundamental Theorem when an antiderivative exists; O(n) for an n-rectangle numerical rule
space: O(1) for all of these (accumulate a running sum)
notes: Error per evaluation count: Riemann O(1/n), trapezoid/midpoint O(1/n^2), Simpson O(1/n^4), Monte Carlo O(1/sqrt(N)) but dimension-independent. Pick the rule by the integrand's smoothness and dimensionality.

## pitfalls
- Forgetting that area below the axis is negative. The integral is *signed* area; a symmetric curve like \(\sin\) over a full period integrates to zero, not to its total geometric area.
- Confusing the antiderivative (a function, with a "+C" family) with the definite integral (a single number, the difference \(F(b) - F(a)\)).
- Mismatching the sample point and the rule. Right-endpoint sums on an increasing function systematically overestimate; do not present that bias as the true value.
- Using too few rectangles and trusting the result. Riemann error only falls like \(1/n\); always check convergence by doubling \(n\), or switch to Simpson's rule.
- Ignoring the variable of integration. \(\int f(x)\,dx\) integrates over \(x\); a stray dependence on another variable or wrong limits silently breaks the answer.

## interviewTips
- Define the integral as the limit of a Riemann sum first, then state the Fundamental Theorem — interviewers want both the construction and the shortcut.
- When asked to integrate numerically, name your rule and its error order (trapezoid \(O(1/n^2)\), Simpson \(O(1/n^4)\)); do not default to the slow Riemann sum.
- Flag signed area explicitly if the curve crosses the axis — splitting the interval at the roots is the clean way to get total geometric area.

## keyTakeaways
- The definite integral is the limit of a Riemann sum: total signed area built from vanishing-width rectangles.
- The Fundamental Theorem of Calculus links integration to differentiation — evaluate an antiderivative at the endpoints to get the exact area.
- When no antiderivative exists, choose a numerical rule by error order and dimension: Simpson for smooth 1-D, Monte Carlo for high dimensions.

## code.python
```python
def riemann(f, a, b, n):
    dx = (b - a) / n
    return sum(f(a + (i + 0.5) * dx) * dx for i in range(n))  # midpoint rule

f = lambda x: x * x
print(round(riemann(f, 0, 1, 1000), 6))  # 0.333333  (== 1/3, the true area)
```

## code.javascript
```javascript
function riemann(f, a, b, n) {
  const dx = (b - a) / n;
  let total = 0;
  for (let i = 0; i < n; i++) total += f(a + (i + 0.5) * dx) * dx; // midpoint
  return total;
}

const f = (x) => x * x;
console.log(riemann(f, 0, 1, 1000).toFixed(6)); // 0.333333 == 1/3
```

## code.java
```java
import java.util.function.DoubleUnaryOperator;

public class Riemann {
    static double riemann(DoubleUnaryOperator f, double a, double b, int n) {
        double dx = (b - a) / n, total = 0;
        for (int i = 0; i < n; i++) total += f.applyAsDouble(a + (i + 0.5) * dx) * dx;
        return total; // midpoint rule
    }

    public static void main(String[] args) {
        DoubleUnaryOperator f = x -> x * x;
        System.out.printf("%.6f%n", riemann(f, 0, 1, 1000)); // 0.333333 == 1/3
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <functional>

double riemann(const std::function<double(double)>& f, double a, double b, int n) {
    double dx = (b - a) / n, total = 0;
    for (int i = 0; i < n; i++) total += f(a + (i + 0.5) * dx) * dx; // midpoint
    return total;
}

int main() {
    auto f = [](double x) { return x * x; };
    std::printf("%.6f\n", riemann(f, 0, 1, 1000)); // 0.333333 == 1/3
    return 0;
}
```
