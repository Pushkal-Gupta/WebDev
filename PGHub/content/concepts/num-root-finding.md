---
slug: num-root-finding
module: numerical-methods
title: Root Finding — Bisection and Newton-Raphson
subtitle: Two ways to hunt the x where f(x)=0 — one slow and unbreakable, one fast and dangerous — and how the best solvers blend them.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Numerical Recipes, 3rd ed. — Roots of nonlinear equations"
    url: "https://numerical.recipes/"
    type: book
  - title: "MIT OpenCourseWare 18.330 — Introduction to Numerical Analysis"
    url: "https://ocw.mit.edu/courses/18-330-introduction-to-numerical-analysis-spring-2012/"
    type: course
  - title: "Burden, Faires & Burden — Numerical Analysis, 10th ed."
    url: "https://www.cengage.com/c/numerical-analysis-10e-burden-faires-burden/"
    type: book
status: published
---

## intro
Most equations that matter cannot be solved by hand. There is no algebraic formula for the root of \(\cos x - x = 0\), no clean rearrangement that isolates \(x\), and the same is true for the pricing equations in finance, the equilibrium conditions in physics, and the loss gradients in machine learning. What you do instead is *iterate*: start with a guess, use the shape of the function to produce a better guess, and repeat until the value stops moving. Root finding is the study of how to make that loop converge — fast when you can, but always. This page builds the two pillars every solver rests on: bisection, which never fails, and Newton-Raphson, which is fast but must be tamed.

## whyItMatters
Solving \(f(x)=0\) is the atom of scientific computing, and it hides inside problems that do not look like root finding at all. Optimization sets the gradient to zero and hunts that root. Implicit time-stepping in a differential-equation solver solves a nonlinear system at every step. Computing an implied volatility in options pricing inverts the Black-Scholes formula by root finding. Square roots, reciprocals, and division on early CPUs were computed by Newton iterations. Circuit simulators, power-flow analysis, and chemical-equilibrium solvers all reduce to finding where a residual vanishes. Because these loops run millions of times inside larger simulations, the difference between a method that converges in 5 steps and one that converges in 50 — or one that diverges and crashes the run — is the difference between a tractable computation and a useless one. Knowing *which* method to reach for, and how to keep the fast one safe, is core numerical literacy.

## intuition
Every root-finding method exploits one fact: a continuous function that is negative somewhere and positive somewhere else must be zero in between. That is the **Intermediate Value Theorem**, and it is the only guarantee we truly own.

**Bisection** uses nothing more. Start with a bracket \([a,b]\) where \(f(a)\) and \(f(b)\) have opposite signs — a sign change certifies a root lives inside. Evaluate the midpoint \(m=(a+b)/2\). Whichever half still shows a sign change is the half that still contains the root, so you keep it and throw the other away. The bracket halves every step. After \(n\) steps the interval width is \((b-a)/2^n\), so the error is cut in half each iteration regardless of how nasty the function is. This is **linear convergence**: the error obeys \(e_{n+1}\approx \tfrac{1}{2}\,e_n\). It is slow — roughly 3.3 iterations per decimal digit — but it is *unconditional*. As long as your starting bracket brackets a root, bisection converges. Nothing about the function's smoothness, curvature, or misbehaviour can stop it.

**Newton-Raphson** trades that safety for speed by using more information: the slope. From the current guess \(x_n\) it draws the tangent line to the curve and slides down it to where the tangent crosses the x-axis. That crossing is the next guess:
\[
x_{n+1}=x_n-\frac{f(x_n)}{f'(x_n)}.
\]
Geometrically you are pretending the function is a straight line near \(x_n\) and jumping to *that* line's root. When you are close and the function is smooth, this is astonishingly good: the number of correct digits roughly **doubles every step**. Formally, if \(r\) is the root and \(e_n = x_n - r\), then near \(r\)
\[
e_{n+1}\approx \frac{f''(r)}{2 f'(r)}\,e_n^{2}=C\,e_n^{2},
\]
which is **quadratic convergence** — the error is squared each step. An error of \(10^{-2}\) becomes \(10^{-4}\), then \(10^{-8}\), then \(10^{-16}\): four iterations from a decent start. The catch is that the tangent step trusts the local slope completely. If \(f'(x_n)\) is near zero the tangent is nearly flat and flings the next guess far away; a bad initial guess can send the iteration to the wrong root, into a cycle, or off to infinity. Newton is a sports car: unbeatable on a clean road, wrapped around a tree the moment the road turns.

## visualization
```
Newton vs bisection on f(x) = x^2 - 2,  true root r = 1.41421356...

  iter |  bisection x_n     f(x_n)      error        |  Newton x_n        error
 ------+------------------------------------------- +---------------------------------
   0   |  1.00000000     -1.00e+00    4.14e-01       |  2.00000000       5.86e-01
   1   |  1.50000000     +2.50e-01    8.58e-02       |  1.50000000       8.58e-02
   2   |  1.25000000     -4.38e-01    1.64e-01       |  1.41666667       2.45e-03
   3   |  1.37500000     -1.09e-01    3.92e-02       |  1.41421569       2.12e-06
   4   |  1.43750000     +6.64e-02    2.33e-02       |  1.41421356       1.59e-12
   5   |  1.40625000     -2.25e-02    7.96e-03       |  1.41421356       0.00e+00
 ------+------------------------------------------- +---------------------------------
        error halves each step (linear)              error squares each step (quadratic)
        ~3.3 iters per decimal digit                 digits double: 1 -> 3 -> 6 -> 12 -> 16
```

## bruteForce
Treat bisection as the robust workhorse — the method you use when you know almost nothing about the function and simply must not fail. The recipe is mechanical: confirm the endpoints bracket a root by checking \(f(a)\cdot f(b) < 0\), then repeatedly replace whichever endpoint keeps the sign change intact with the midpoint. You need only the ability to evaluate \(f\) and read the sign of the result — no derivative, no smoothness, no good initial guess, just a valid bracket. Its cost is total predictability: to reach a tolerance \(\varepsilon\) you need exactly \(\lceil \log_2((b-a)/\varepsilon)\rceil\) iterations, known in advance. That predictability is why bisection is the safety net inside every serious solver. It will never overshoot, never diverge, never cycle. The price is speed: linear convergence means it plods where Newton sprints, so on its own it is the fallback, not the finish line.

## optimal
The fast method is **Newton-Raphson**, and the engineering discipline is to keep its speed while borrowing bisection's guarantee. Raw Newton follows the tangent step \(x_{n+1}=x_n-f(x_n)/f'(x_n)\) and enjoys quadratic convergence, but it must be **safeguarded** or it will occasionally wander off. The standard fix is a *globalized* Newton: maintain a bracket \([a,b]\) known to contain the root, and at each step try the Newton point first. If the Newton step lands inside the current bracket and is making progress, accept it and keep the quadratic speed. If it lands outside the bracket, or fails to shrink the interval fast enough, *reject it and take a bisection step instead*, which is guaranteed to make progress. Either way, update the bracket using the sign of the new residual so the safety interval only ever tightens. This hybrid is exactly the idea behind production solvers.

When the derivative \(f'\) is unavailable or expensive, the **secant method** replaces the true tangent with the slope of the line through the two most recent points, \(x_{n+1}=x_n - f(x_n)\,(x_n-x_{n-1})/(f(x_n)-f(x_{n-1}))\). It needs no derivative and still converges **superlinearly** with order about \(\varphi\approx 1.618\) — slower than Newton's 2 but far faster than bisection, and cheaper per step. The gold standard combines all of these: **Brent's method** blends bisection, the secant method, and inverse quadratic interpolation, always keeping a bracket. It gets superlinear speed on well-behaved functions and gracefully degrades to guaranteed bisection convergence on hard ones, with no derivative required. Reach for Brent (`scipy.optimize.brentq`) when you have a bracket and want robustness, and for safeguarded Newton when you can supply \(f'\) and want maximum speed. The lesson: never ship raw Newton — always give it a bracket to fall back on.

```python
def safeguarded_newton(f, df, a, b, tol=1e-12, max_iter=100):
    fa, fb = f(a), f(b)
    assert fa * fb < 0, "endpoints must bracket a root"
    x = 0.5 * (a + b)
    for _ in range(max_iter):
        fx = f(x)
        if abs(fx) < tol:
            return x
        step = fx / df(x) if df(x) != 0 else float('inf')
        nx = x - step
        if not (a < nx < b):          # Newton escaped the bracket -> bisect
            nx = 0.5 * (a + b)
        if fa * f(nx) < 0:            # keep the sign-changing half
            b = nx
        else:
            a, fa = nx, f(nx)
        x = nx
    return x
```

## complexity
time: Bisection needs \(\lceil\log_2((b-a)/\varepsilon)\rceil\) iterations for tolerance \(\varepsilon\) — linear convergence, error halves each step. Newton converges quadratically near a simple root: iterations scale like \(\log_2\log_2(1/\varepsilon)\), so digits double per step (roughly 5 steps for machine precision from a good start). Secant is superlinear (order \(\approx 1.618\)). Each iteration costs one \(f\) evaluation (Newton also needs one \(f'\)).
space: O(1) — all methods keep only a constant number of scalars (the bracket or the last one-to-two iterates).
notes: Convergence order p means \(e_{n+1}\approx C\,e_n^{p}\): bisection p=1, secant p≈1.618, Newton p=2. Newton's quadratic rate holds only near a simple root; at a multiple root (where \(f'=0\) too) it degrades to linear. Always cap iterations and test both a residual tolerance and a step tolerance to terminate safely.

## pitfalls
- **Newton with a bad initial guess.** Far from the root the tangent step is unreliable — it can jump past the root, land near a different root, or diverge to infinity. Always start Newton inside a region where the function is roughly monotone and convex toward the root, or safeguard it with a bracket.
- **Derivative near zero (\(f'(x_n)\approx 0\)).** The step \(f/f'\) blows up when the tangent is nearly flat, catapulting the next iterate far away. Guard against tiny derivatives (add a floor, or fall back to bisection) instead of dividing by an almost-zero slope.
- **Cycling and overshoot.** For some functions Newton oscillates between two points forever (e.g. \(x^3-2x+2\) from \(x_0=0\)), never converging. A cycle detector, a damped step \(x_{n+1}=x_n-\lambda f/f'\) with \(\lambda<1\), or a bracket break the loop.
- **Bracket that doesn't actually bracket.** Bisection assumes \(f(a)f(b)<0\). If both endpoints share a sign (no root, or an even number of roots inside) the method converges to a bogus point. Verify the sign change before iterating, and beware roots of even multiplicity, which don't flip the sign.
- **Weak or wrong stopping test.** Stopping only on \(|x_{n+1}-x_n|\) small can halt early when the function is flat; stopping only on \(|f(x)|\) small can halt too late when it's steep. Test both, and always impose a maximum iteration count so a non-converging run can't loop forever.

## interviewTips
- Be ready to derive the Newton update from a first-order Taylor expansion: \(0=f(x_{n+1})\approx f(x_n)+f'(x_n)(x_{n+1}-x_n)\) rearranges to \(x_{n+1}=x_n-f(x_n)/f'(x_n)\). Deriving it beats reciting it.
- State the convergence orders precisely and the trade-off: bisection is linear but unconditional; Newton is quadratic but needs a good guess and a nonzero derivative; secant is superlinear (\(\approx1.618\)) without a derivative. The "right" answer in practice is a safeguarded hybrid like Brent.
- Mention a concrete failure mode and its fix — e.g. "Newton diverges when \(f'\) is near zero, so I'd fall back to a bisection step whenever the Newton point leaves the bracket." Showing you'd never ship raw Newton signals real experience.

## keyTakeaways
- Bisection halves a sign-changing bracket every step: guaranteed **linear** convergence, error \(e_{n+1}\approx\tfrac12 e_n\), needing only \(f\)'s sign — the unbreakable fallback.
- Newton follows the tangent, \(x_{n+1}=x_n-f(x_n)/f'(x_n)\), giving **quadratic** convergence \(e_{n+1}\approx C e_n^2\) (digits double per step) — but it can diverge, cycle, or blow up when the guess is poor or \(f'\approx 0\).
- Production solvers **safeguard** Newton with a bracket (secant when no derivative, Brent as the gold standard): Newton speed when it's working, guaranteed bisection progress when it isn't.

## code.python
```python
def bisection(f, a, b, tol=1e-12, max_iter=200):
    fa, fb = f(a), f(b)
    if fa * fb > 0:
        raise ValueError("f(a) and f(b) must have opposite signs")
    for _ in range(max_iter):
        m = 0.5 * (a + b)
        fm = f(m)
        if abs(fm) < tol or 0.5 * (b - a) < tol:
            return m
        if fa * fm < 0:
            b = m
        else:
            a, fa = m, fm
    return 0.5 * (a + b)

def newton(f, df, x0, tol=1e-12, max_iter=100):
    x = x0
    for _ in range(max_iter):
        fx = f(x)
        if abs(fx) < tol:
            return x
        dfx = df(x)
        if dfx == 0:
            raise ZeroDivisionError("zero derivative")
        x -= fx / dfx
    return x

f  = lambda x: x * x - 2          # root: sqrt(2)
df = lambda x: 2 * x
print(round(bisection(f, 1, 2), 10))   # 1.4142135624
print(round(newton(f, df, 2), 10))     # 1.4142135624
```

## code.javascript
```javascript
function bisection(f, a, b, tol = 1e-12, maxIter = 200) {
  let fa = f(a);
  if (fa * f(b) > 0) throw new Error("f(a) and f(b) must have opposite signs");
  for (let i = 0; i < maxIter; i++) {
    const m = 0.5 * (a + b);
    const fm = f(m);
    if (Math.abs(fm) < tol || 0.5 * (b - a) < tol) return m;
    if (fa * fm < 0) { b = m; } else { a = m; fa = fm; }
  }
  return 0.5 * (a + b);
}

function newton(f, df, x0, tol = 1e-12, maxIter = 100) {
  let x = x0;
  for (let i = 0; i < maxIter; i++) {
    const fx = f(x);
    if (Math.abs(fx) < tol) return x;
    const dfx = df(x);
    if (dfx === 0) throw new Error("zero derivative");
    x -= fx / dfx;
  }
  return x;
}

const f = (x) => x * x - 2, df = (x) => 2 * x;
console.log(bisection(f, 1, 2).toFixed(10));   // 1.4142135624
console.log(newton(f, df, 2).toFixed(10));     // 1.4142135624
```

## code.java
```java
import java.util.function.DoubleUnaryOperator;

public class RootFinding {
    static double bisection(DoubleUnaryOperator f, double a, double b, double tol, int maxIter) {
        double fa = f.applyAsDouble(a);
        if (fa * f.applyAsDouble(b) > 0) throw new IllegalArgumentException("no sign change");
        for (int i = 0; i < maxIter; i++) {
            double m = 0.5 * (a + b), fm = f.applyAsDouble(m);
            if (Math.abs(fm) < tol || 0.5 * (b - a) < tol) return m;
            if (fa * fm < 0) b = m; else { a = m; fa = fm; }
        }
        return 0.5 * (a + b);
    }
    static double newton(DoubleUnaryOperator f, DoubleUnaryOperator df, double x0, double tol, int maxIter) {
        double x = x0;
        for (int i = 0; i < maxIter; i++) {
            double fx = f.applyAsDouble(x);
            if (Math.abs(fx) < tol) return x;
            double dfx = df.applyAsDouble(x);
            if (dfx == 0) throw new ArithmeticException("zero derivative");
            x -= fx / dfx;
        }
        return x;
    }
    public static void main(String[] args) {
        DoubleUnaryOperator f = x -> x * x - 2, df = x -> 2 * x;
        System.out.printf("%.10f%n", bisection(f, 1, 2, 1e-12, 200));  // 1.4142135624
        System.out.printf("%.10f%n", newton(f, df, 2, 1e-12, 100));    // 1.4142135624
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <functional>
#include <stdexcept>

double bisection(std::function<double(double)> f, double a, double b,
                 double tol = 1e-12, int maxIter = 200) {
    double fa = f(a);
    if (fa * f(b) > 0) throw std::invalid_argument("no sign change");
    for (int i = 0; i < maxIter; i++) {
        double m = 0.5 * (a + b), fm = f(m);
        if (std::fabs(fm) < tol || 0.5 * (b - a) < tol) return m;
        if (fa * fm < 0) b = m; else { a = m; fa = fm; }
    }
    return 0.5 * (a + b);
}

double newton(std::function<double(double)> f, std::function<double(double)> df,
              double x0, double tol = 1e-12, int maxIter = 100) {
    double x = x0;
    for (int i = 0; i < maxIter; i++) {
        double fx = f(x);
        if (std::fabs(fx) < tol) return x;
        double dfx = df(x);
        if (dfx == 0) throw std::runtime_error("zero derivative");
        x -= fx / dfx;
    }
    return x;
}

int main() {
    auto f = [](double x) { return x * x - 2; };
    auto df = [](double x) { return 2 * x; };
    std::printf("%.10f\n", bisection(f, 1, 2));   // 1.4142135624
    std::printf("%.10f\n", newton(f, df, 2));     // 1.4142135624
    return 0;
}
```
