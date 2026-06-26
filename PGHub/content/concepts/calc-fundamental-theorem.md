---
slug: calc-fundamental-theorem
module: calculus
title: The Fundamental Theorem of Calculus
subtitle: Accumulating area and measuring slope are the same operation run in reverse.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 11
prereqs: [calc-derivative-as-slope, calc-integral-as-area]
relatedProblems: []
references:
  - title: "3Blue1Brown — Essence of Calculus, Chapter 8: Integration and the fundamental theorem of calculus"
    url: "https://www.youtube.com/watch?v=rfG8ce4nNh0"
    type: video
  - title: "Khan Academy — The fundamental theorem of calculus"
    url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-integration-new/ab-6-4/v/fundamental-theorem-of-calculus"
    type: course
  - title: "Paul's Online Math Notes — Definition of the Definite Integral"
    url: "https://tutorial.math.lamar.edu/classes/calci/defnofdefiniteintegral.aspx"
    type: blog
status: published
---

## intro
Differentiation and integration grew up as two unrelated questions. One asks for the slope of a curve at a point; the other asks for the area trapped under a curve over an interval. The Fundamental Theorem of Calculus is the stunning result that these are two sides of one coin: building up area is exactly the inverse of measuring slope. Compute an antiderivative, evaluate it at the endpoints, subtract — and the area falls out without ever summing a single rectangle.

## whyItMatters
Before this theorem, the only honest way to find an area was to sum infinitely many shrinking rectangles — a Riemann sum taken to the limit, which is brutal for all but the simplest curves. The theorem replaces that limit with a one-line evaluation: find a function whose derivative is your integrand, plug in the endpoints, subtract. Every closed-form integral you have ever used relies on it. It is what lets physics turn acceleration into velocity into position, what lets probability turn a density into a cumulative distribution, and what lets any "total accumulated change" question collapse into "net difference of an antiderivative." It is also the conceptual glue of calculus: the reason the two halves of the subject talk to each other at all. Without it, integration would remain a numerical chore rather than a symbolic tool.

## intuition
Define an **accumulation function**: fix a left edge \(a\), and let \(A(x)\) be the signed area under \(f\) from \(a\) up to a moving right edge \(x\),
\[
A(x) = \int_a^x f(t)\,dt.
\]
As you push \(x\) to the right, \(A(x)\) grows by sweeping out more area. The whole theorem is about *how fast* it grows.

Imagine nudging the right edge from \(x\) to \(x + h\). The extra area you pick up is a thin sliver of width \(h\) sitting under the curve. If \(h\) is small, that sliver is almost a rectangle: width \(h\), height roughly \(f(x)\) (the curve barely changes across such a narrow strip). So the added area is approximately \(f(x)\cdot h\), which means
\[
\frac{A(x+h) - A(x)}{h} \approx f(x).
\]
Take the limit as \(h \to 0\) and the approximation becomes exact: \(A'(x) = f(x)\). Read that slowly — **the rate at which area accumulates is exactly the height of the curve.** Tall curve, area piles up fast; curve dips below zero, area shrinks. That is the first half of the theorem, and it is pure geometry: the derivative of "area so far" is the function itself.

The second half is the payoff for computation. Suppose \(F\) is *any* antiderivative of \(f\), so \(F'(x) = f(x)\). Then \(F\) and the accumulation function \(A\) have the same derivative everywhere, so they differ only by a constant: \(A(x) = F(x) + C\). Since \(A(a) = 0\) (zero width, zero area), the constant is \(C = -F(a)\). Plug in \(x = b\):
\[
\int_a^b f(t)\,dt = A(b) = F(b) - F(a).
\]
That is the Evaluation Theorem. The area between \(a\) and \(b\) is just the *net change* of any antiderivative across the interval. Concrete check: for \(f(x) = x^2\) on \([0,1]\), an antiderivative is \(F(x) = x^3/3\). The area is \(F(1) - F(0) = 1/3 - 0 = 1/3\) — matching the Riemann sum exactly, with no rectangles in sight.

The deep picture is symmetry. Differentiation takes a function apart into its instantaneous rates; integration glues those rates back into a total. Doing one then the other returns you to where you started (up to a constant), which is precisely what "inverse operations" means.

## visualization
```
f(t)  height of the curve = how fast area grows
 |        ____
 |      /     \         slope of A at x  ==  f(x)
 |    /        \___
 |  /              \
 +--+----+----+----+----> t
    a    x   x+h   b
       [ A(x) ]            area swept from a to x
       [ A(x) ][sliver]    sliver width h, height ~ f(x)

A(x) = area so far            A(x+h) - A(x)  ~  f(x) * h
A'(x) = f(x)                  => A grows at rate f(x)
int_a^b f = F(b) - F(a)       net change of any antiderivative
```

## bruteForce
The pre-theorem approach is the **definition of the definite integral**: chop \([a,b]\) into \(n\) strips, evaluate \(f\) at a sample point in each, sum height times width, and let \(n \to \infty\). It always works and underlies every numerical integrator, but as an exact symbolic method it is hopeless — you must evaluate a limit of an \(n\)-term sum by hand for each new integrand, and only a handful of functions (powers, via clever telescoping) yield to it. The arithmetic explodes and gives no reusable machinery.

## optimal
The optimal method is the **Evaluation Theorem**: find an antiderivative \(F\) with \(F' = f\), then compute \(F(b) - F(a)\). This converts an infinite limiting process into one subtraction. Antiderivatives are found by running differentiation rules backward — reverse power rule, \(u\)-substitution (the chain rule in reverse), integration by parts (the product rule in reverse). The reason this is legitimate, and not a lucky trick, is the first half of the theorem: because \(A'(x) = f(x)\), the accumulation function *is* an antiderivative, and all antiderivatives differ by a constant that cancels in the subtraction.

Why it beats the brute force: the rectangle limit costs \(O(n)\) work for an *approximation* that converges slowly, while the evaluation costs two function calls for an *exact* answer — whenever a closed-form antiderivative exists. When it does not (e.g. \(e^{-x^2}\), which has no elementary antiderivative), you fall back to numerical integration, but you reach for smarter rules than naive rectangles. The trapezoid rule replaces flat-topped strips with slanted tops (error \(O(h^2)\)), and Simpson's rule fits parabolas through triples of points (error \(O(h^4)\)) — both far more accurate per evaluation than a Riemann sum, and both still resting on the theorem's guarantee that the true value is \(F(b) - F(a)\).

```python
def fundamental_check(F, f, a, b, n=100000):
    # net change of an antiderivative vs. a fine Riemann sum
    exact = F(b) - F(a)
    dx = (b - a) / n
    riemann = sum(f(a + (i + 0.5) * dx) * dx for i in range(n))
    return exact, riemann

F = lambda x: x ** 3 / 3        # antiderivative of x^2
f = lambda x: x ** 2
print(fundamental_check(F, f, 0.0, 1.0))   # (0.3333..., ~0.3333...)
```

## complexity
time: O(1) for the evaluation F(b) - F(a) once an antiderivative is known; O(n) for an n-strip numerical fallback (trapezoid / Simpson) when no antiderivative exists
space: O(1) in both cases — a numerical integrator accumulates a running sum and stores nothing extra
notes: Numerical error for the trapezoid rule is O(h^2) and for Simpson's rule O(h^4), where h = (b - a)/n; the exact evaluation has no discretization error at all. Symbolic antidifferentiation can fail (non-elementary integrals), which is when the numerical path is mandatory.

## pitfalls
- Forgetting the constant of integration on an *indefinite* integral. \(\int f\,dx = F(x) + C\); only in the *definite* integral does the \(C\) cancel via \(F(b) - F(a)\).
- Swapping the limits and keeping the sign. \(\int_a^b = -\int_b^a\); evaluating top-minus-bottom in the wrong order flips the result's sign.
- Integrating across a discontinuity or singularity as if the theorem applies. The Evaluation Theorem needs \(f\) continuous (or the integral split as improper) on \([a,b]\); ignoring a blow-up like \(\int_{-1}^{1} 1/x\,dx\) gives a confidently wrong number.
- Confusing the accumulation function \(A(x)=\int_a^x f\) (a function of the upper limit) with the constant value \(\int_a^b f\). The first has a derivative \(f(x)\); the second is just a number.
- Differentiating an integral with a variable in both the integrand and the limit without the Leibniz rule. \(\frac{d}{dx}\int_a^{g(x)} f(t)\,dt = f(g(x))\,g'(x)\) — the chain rule rides along on the upper limit.

## interviewTips
- State both halves cleanly: part 1 says \(\frac{d}{dx}\int_a^x f(t)\,dt = f(x)\); part 2 says \(\int_a^b f = F(b) - F(a)\) for any antiderivative \(F\).
- If handed \(\frac{d}{dx}\int_0^{x^2} \sin t\,dt\), apply the Leibniz/chain rule: the answer is \(\sin(x^2)\cdot 2x\), not just \(\sin(x^2)\).
- When an integrand has no elementary antiderivative, say so and pivot to Simpson's rule — naming the \(O(h^4)\) accuracy signals you know why it beats the trapezoid rule.

## keyTakeaways
- The accumulation function's rate of growth equals the curve's height: \(\frac{d}{dx}\int_a^x f(t)\,dt = f(x)\). Differentiation undoes integration.
- A definite integral is the net change of any antiderivative across the interval: \(\int_a^b f = F(b) - F(a)\), turning an infinite sum into one subtraction.
- When no antiderivative exists in closed form, the theorem still defines the target value; reach for Simpson's rule (\(O(h^4)\)) to approximate it accurately.

## code.python
```python
def antiderivative_eval(F, a, b):
    return F(b) - F(a)

def simpson(f, a, b, n=1000):           # n even
    h = (b - a) / n
    total = f(a) + f(b)
    for i in range(1, n):
        total += (4 if i % 2 else 2) * f(a + i * h)
    return total * h / 3

F = lambda x: x ** 3 / 3
f = lambda x: x ** 2
print(round(antiderivative_eval(F, 0.0, 1.0), 6))  # 0.333333  (exact)
print(round(simpson(f, 0.0, 1.0), 6))              # 0.333333  (numeric)
```

## code.javascript
```javascript
function antiderivativeEval(F, a, b) {
  return F(b) - F(a);
}

function simpson(f, a, b, n = 1000) {   // n even
  const h = (b - a) / n;
  let total = f(a) + f(b);
  for (let i = 1; i < n; i++) total += (i % 2 ? 4 : 2) * f(a + i * h);
  return (total * h) / 3;
}

const F = (x) => (x ** 3) / 3;
const f = (x) => x ** 2;
console.log(antiderivativeEval(F, 0, 1).toFixed(6)); // 0.333333
console.log(simpson(f, 0, 1).toFixed(6));            // 0.333333
```

## code.java
```java
import java.util.function.DoubleUnaryOperator;

public class Ftc {
    static double antiderivativeEval(DoubleUnaryOperator F, double a, double b) {
        return F.applyAsDouble(b) - F.applyAsDouble(a);
    }

    static double simpson(DoubleUnaryOperator f, double a, double b, int n) {
        double h = (b - a) / n;
        double total = f.applyAsDouble(a) + f.applyAsDouble(b);
        for (int i = 1; i < n; i++)
            total += (i % 2 == 1 ? 4 : 2) * f.applyAsDouble(a + i * h);
        return total * h / 3;
    }

    public static void main(String[] args) {
        DoubleUnaryOperator F = x -> x * x * x / 3;
        DoubleUnaryOperator f = x -> x * x;
        System.out.printf("%.6f%n", antiderivativeEval(F, 0, 1)); // 0.333333
        System.out.printf("%.6f%n", simpson(f, 0, 1, 1000));      // 0.333333
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <functional>

double antiderivativeEval(const std::function<double(double)>& F, double a, double b) {
    return F(b) - F(a);
}

double simpson(const std::function<double(double)>& f, double a, double b, int n) {
    double h = (b - a) / n;
    double total = f(a) + f(b);
    for (int i = 1; i < n; i++) total += (i % 2 ? 4 : 2) * f(a + i * h);
    return total * h / 3;
}

int main() {
    auto F = [](double x) { return x * x * x / 3; };
    auto f = [](double x) { return x * x; };
    std::printf("%.6f\n", antiderivativeEval(F, 0.0, 1.0));  // 0.333333
    std::printf("%.6f\n", simpson(f, 0.0, 1.0, 1000));       // 0.333333
    return 0;
}
```
