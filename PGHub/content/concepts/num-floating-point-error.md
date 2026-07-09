---
slug: num-floating-point-error
module: numerical-methods
title: Floating-Point Error and Catastrophic Cancellation
subtitle: Why 0.1 + 0.2 isn't 0.3, how rounding error accumulates, and the one subtraction that can destroy every significant digit you had.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Goldberg — What Every Computer Scientist Should Know About Floating-Point Arithmetic"
    url: "https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html"
    type: article
  - title: "Numerical Recipes, 3rd ed. (Press, Teukolsky, Vetterling, Flannery)"
    url: "https://numerical.recipes/"
    type: book
  - title: "MIT OCW 18.335 — Introduction to Numerical Methods"
    url: "https://ocw.mit.edu/courses/18-335j-introduction-to-numerical-methods-spring-2019/"
    type: course
status: published
---

## intro
A computer stores real numbers in a finite number of bits, so almost every value it holds is a rounded approximation. The number \(0.1\) has no exact binary representation, which is why `0.1 + 0.2` prints `0.30000000000000004`. Most of the time this rounding is harmless — the error sits far below anything you care about. But numerical analysis is the study of the times it is *not* harmless: when tiny rounding errors accumulate, when a formula amplifies them, or when subtracting two nearly equal numbers wipes out every digit of accuracy at once. Understanding floating-point error is the difference between code that computes and code that computes *the right answer*.

## whyItMatters
Every scientific simulation, financial calculation, machine-learning training loop, and physics engine runs on floating-point arithmetic, and every one of them can be silently wrong if the numerics are naive. A rocket guidance routine, a variance computed with the textbook formula, a quadratic solver in a graphics kernel, the gradient of a loss near a saddle point — all have failed in production because someone subtracted two close numbers or summed a million small terms without a second thought. The Patriot missile failure of 1991 traced to accumulated floating-point time drift. Knowing where precision is lost, how to bound it with the condition number, and how to rewrite a formula so it stays stable is a core skill: it turns "the code ran" into "the code is trustworthy," and it is a favorite interview probe precisely because it separates people who copy formulas from people who understand them.

## intuition
Think of a floating-point number as scientific notation with a fixed budget of digits. IEEE 754 double precision keeps 53 bits of significand (mantissa), giving roughly 15–17 correct decimal digits. The gap between \(1.0\) and the next representable number is **machine epsilon**, \(\epsilon_{\text{mach}}=2^{-52}\approx 2.22\times10^{-16}\). Every arithmetic result is rounded to the nearest representable value — IEEE uses **round-to-nearest, ties-to-even**, so half-way cases go to the neighbor with an even last bit, which removes the statistical bias you'd get from always rounding up. A single rounding introduces at most a **relative** error of \(\tfrac12\epsilon_{\text{mach}}\); the value you get back is the true value times \((1+\delta)\) with \(|\delta|\le\tfrac12\epsilon_{\text{mach}}\).

That per-operation error is tiny, so why worry? Two forces amplify it. The first is **accumulation**: sum \(n\) numbers and the worst-case error grows like \(n\,\epsilon_{\text{mach}}\); sum a billion terms naively and you can lose several digits. The second, far more violent, is **catastrophic cancellation**. When you subtract two nearly equal numbers, their leading significant digits are identical and cancel to zero. The digits that survive are the low-order ones — precisely the digits already polluted by earlier rounding. The subtraction doesn't *create* new error; it *promotes* existing round-off from the noise floor into the leading position, so the **relative** error of the result explodes even though the **absolute** error barely changed. Computing \(\sqrt{x+1}-\sqrt{x}\) for large \(x\) is the textbook case: both roots agree to many digits, the difference keeps almost none.

This is where **conditioning** and **stability** must be separated. *Conditioning* is a property of the **problem**: the condition number \(\kappa\) measures how much the true answer changes when the input is perturbed — an ill-conditioned problem is sensitive no matter how you solve it. *Stability* is a property of the **algorithm**: a stable method returns the exact answer to a slightly perturbed input. We also distinguish **forward error** (how far the computed answer is from the true one) from **backward error** (how big an input perturbation would make the computed answer exactly correct). The governing rule of thumb: forward error \(\lesssim\) condition number \(\times\) backward error. A stable algorithm has small backward error; if the problem is well-conditioned, that guarantees a small forward error too. Catastrophic cancellation is what happens when a badly chosen algorithm turns a well-conditioned problem into garbage — and the fix is almost always to rewrite the formula so the subtraction never happens.

## visualization
```
Subtracting two nearly-equal 7-significant-digit numbers (decimal, round-to-nearest):

  operand         true value            stored (7 sig. digits)     digits trusted
  a = sqrt(x+1)   1.41421356237...      1.414214                    7
  b = sqrt(x)     1.41414284278...      1.414143                    7

  naive a - b :   1.414214 - 1.414143 = 0.000071
                  kept digits:  [7][1] ... only 2 significant, 5 LOST to cancellation
                  the '71' is contaminated by the rounding of a and b

  stable 1/(sqrt(x+1)+sqrt(x)) = 1 / (1.414214 + 1.414143)
                  = 1 / 2.828357 = 0.3535534   -> 7 significant digits KEPT

  significance strip (X = trusted digit, . = lost):
  naive :  X X . . . . .     (2 of 7)
  stable:  X X X X X X X     (7 of 7)
```

## bruteForce
The naive approach is to translate the math formula straight into code exactly as written on paper: compute \(\sqrt{x+1}\), compute \(\sqrt{x}\), and subtract. For the sample variance you'd use the "computational formula" \(\frac{1}{n}\sum x_i^2-\bar{x}^2\); for the quadratic roots you'd apply \((-b\pm\sqrt{b^2-4ac})/(2a)\) verbatim. Each of these is algebraically correct and each is a numerical trap: every one contains a subtraction of two quantities that become nearly equal in some regime (large \(x\), small variance, \(b^2\gg 4ac\)). The code compiles, passes a casual test with friendly inputs, then silently returns two or three correct digits — or a negative variance — on the inputs that matter. It works only because the failure is invisible until someone checks against a high-precision reference.

## optimal
The stable approach rewrites the expression so the dangerous subtraction disappears, usually by multiplying by a conjugate or reordering operations. For \(\sqrt{x+1}-\sqrt{x}\), multiply top and bottom by \(\sqrt{x+1}+\sqrt{x}\):
\[
\sqrt{x+1}-\sqrt{x}=\frac{(x+1)-x}{\sqrt{x+1}+\sqrt{x}}=\frac{1}{\sqrt{x+1}+\sqrt{x}}.
\]
Now there is no cancellation — the numerator is exactly \(1\) and the denominator is a *sum* of positive numbers, which never loses significance. For the **quadratic formula**, the subtraction \(-b+\sqrt{b^2-4ac}\) cancels when \(b>0\); the fix is to compute the root of larger magnitude first using the sign of \(b\), then get the other root from the product-of-roots identity \(x_1 x_2=c/a\):
\[
q=-\tfrac12\!\left(b+\operatorname{sign}(b)\sqrt{b^2-4ac}\right),\qquad x_1=q/a,\quad x_2=c/q.
\]
For **summation**, replace the naive loop with **Kahan compensated summation**, which carries a running correction term for the lost low-order bits and keeps the error near \(\epsilon_{\text{mach}}\) regardless of \(n\). For **variance**, use Welford's one-pass update instead of the \(\sum x_i^2-\bar{x}^2\) form. The unifying discipline: never subtract two quantities you expect to be close; if you must, find an algebraically equivalent form (conjugate, series expansion, compensated accumulation) that computes the small result *directly* rather than as a difference of two large ones. When rewriting is impossible, escalate precision (use `long double` / `float128` / arbitrary precision) only as a last resort — it hides the symptom, it doesn't cure the algorithm.

```python
import math

def machine_epsilon():
    eps = 1.0
    while 1.0 + eps / 2.0 != 1.0:
        eps /= 2.0
    return eps

print(machine_epsilon())          # 2.220446049250313e-16  == 2**-52

x = 1e10
naive  = math.sqrt(x + 1) - math.sqrt(x)          # ~4.99e-06, only ~5 good digits
stable = 1.0 / (math.sqrt(x + 1) + math.sqrt(x))  # full precision
print(naive, stable, abs(naive - stable) / stable)
```

## complexity
time: All the stable rewrites here are O(1) per evaluation (a handful of extra flops for the conjugate or the compensated-sum correction) — identical asymptotic cost to the naive form. Kahan summation of n terms is O(n), the same as a naive loop; it just does about four flops per element instead of one.
space: O(1) extra for every technique — the conjugate reformulation needs no storage, and Kahan/Welford carry a single scalar compensation/running-moment term. No arrays are allocated to gain the precision.
notes: The win is entirely in accuracy, not speed. You trade a few extra arithmetic operations for the difference between 2 correct digits and 16. Bounds: one rounding gives relative error <= eps/2; naive summation grows like n*eps; catastrophic cancellation can make the relative error O(1) (all digits lost). Kahan keeps it near eps independent of n.

## pitfalls
- **Testing floats with `==`.** `0.1 + 0.2 == 0.3` is `false`. Compare with a tolerance: `abs(a - b) <= atol + rtol * max(abs(a), abs(b))`, mixing an absolute and a relative bound so it works near zero and at large magnitudes.
- **Subtracting nearly-equal numbers.** \(\sqrt{x+1}-\sqrt{x}\), \(1-\cos x\) for small \(x\), \(e^x-1\) for small \(x\), and \(\sum x_i^2-(\sum x_i)^2/n\) all suffer catastrophic cancellation. Use conjugates, `expm1`/`log1p`, or Welford's algorithm — the reformulation, not more precision.
- **Confusing conditioning with stability.** A stable algorithm on an ill-conditioned problem is still inaccurate; the condition number \(\kappa\) caps how good *any* algorithm can be. Blaming the code when the problem itself is sensitive wastes time — and switching languages won't help.
- **Assuming higher precision is a fix.** Going from `float` to `double` postpones the failure by ~9 digits but doesn't remove it; an unstable algorithm still loses all precision at a larger input scale. Fix the formula first.
- **Ignoring accumulation in long sums / iterations.** Adding a billion small numbers left-to-right can drift by several digits, and small-plus-huge additions drop the small term entirely (absorption). Sort by magnitude, sum in pairs, or use Kahan compensation.

## interviewTips
- When asked "what's `0.1 + 0.2`?", say `0.30000000000000004` and explain *why*: 0.1 is a non-terminating binary fraction, so it's rounded on input, and the two rounded operands don't sum to the rounded 0.3 — then mention comparing with a tolerance, never `==`.
- Be ready to spot and fix catastrophic cancellation on the whiteboard: given \(\sqrt{x+1}-\sqrt{x}\) or the quadratic formula, multiply by the conjugate / use the sign-of-\(b\) trick, and state that you moved from a *difference of large numbers* to a *direct* computation of the small result.
- Define the four terms crisply — machine epsilon (\(2^{-52}\) for doubles), condition number (problem sensitivity), backward vs forward error — and give the rule "forward error \(\lesssim \kappa \times\) backward error" to show you can reason about *why* an algorithm is or isn't trustworthy.

## keyTakeaways
- Floating-point stores ~15–17 decimal digits; each operation rounds with relative error \(\le\tfrac12\epsilon_{\text{mach}}\) where \(\epsilon_{\text{mach}}=2^{-52}\), so never test floats with `==` and never assume a printed value is exact.
- Catastrophic cancellation — subtracting two nearly-equal numbers — promotes existing round-off into the leading digits and can destroy all relative accuracy; fix it by algebraic rewriting (conjugate, `log1p`/`expm1`, Welford, Kahan), not by adding precision.
- Separate the problem's **conditioning** (\(\kappa\), unavoidable sensitivity) from the algorithm's **stability** (small backward error); forward error \(\lesssim \kappa\times\) backward error, so a stable method on a well-conditioned problem is what earns a trustworthy answer.

## code.python
```python
import math

def machine_epsilon():
    eps = 1.0
    while 1.0 + eps / 2.0 != 1.0:
        eps /= 2.0
    return eps

def diff_sqrt_naive(x):
    return math.sqrt(x + 1) - math.sqrt(x)          # catastrophic cancellation

def diff_sqrt_stable(x):
    return 1.0 / (math.sqrt(x + 1) + math.sqrt(x))  # conjugate rewrite, no subtraction

def quadratic_stable(a, b, c):
    disc = math.sqrt(b * b - 4 * a * c)
    q = -0.5 * (b + math.copysign(disc, b))         # avoid -b + sqrt(...) cancellation
    return q / a, c / q

if __name__ == "__main__":
    print(machine_epsilon())                        # 2.220446049250313e-16
    x = 1e10
    n, s = diff_sqrt_naive(x), diff_sqrt_stable(x)
    print(n, s, abs(n - s) / s)                     # naive loses ~11 digits
    print(quadratic_stable(1.0, 1e8, 1.0))          # both roots accurate
```

## code.javascript
```javascript
function machineEpsilon() {
  let eps = 1.0;
  while (1.0 + eps / 2.0 !== 1.0) eps /= 2.0;
  return eps;
}

const diffSqrtNaive  = (x) => Math.sqrt(x + 1) - Math.sqrt(x);      // cancellation
const diffSqrtStable = (x) => 1.0 / (Math.sqrt(x + 1) + Math.sqrt(x));

function quadraticStable(a, b, c) {
  const disc = Math.sqrt(b * b - 4 * a * c);
  const q = -0.5 * (b + Math.sign(b) * disc);        // sign-of-b trick
  return [q / a, c / q];
}

console.log(machineEpsilon());                       // 2.220446049250313e-16
const x = 1e10;
const n = diffSqrtNaive(x), s = diffSqrtStable(x);
console.log(n, s, Math.abs(n - s) / s);              // naive is far off
console.log(quadraticStable(1.0, 1e8, 1.0));
```

## code.java
```java
public class FloatingPoint {
    static double machineEpsilon() {
        double eps = 1.0;
        while (1.0 + eps / 2.0 != 1.0) eps /= 2.0;
        return eps;
    }
    static double diffSqrtNaive(double x)  { return Math.sqrt(x + 1) - Math.sqrt(x); }
    static double diffSqrtStable(double x) { return 1.0 / (Math.sqrt(x + 1) + Math.sqrt(x)); }

    static double[] quadraticStable(double a, double b, double c) {
        double disc = Math.sqrt(b * b - 4 * a * c);
        double q = -0.5 * (b + Math.copySign(disc, b));   // avoid -b + sqrt cancellation
        return new double[]{ q / a, c / q };
    }

    public static void main(String[] args) {
        System.out.println(machineEpsilon());             // 2.220446049250313E-16
        double x = 1e10;
        double n = diffSqrtNaive(x), s = diffSqrtStable(x);
        System.out.println(n + " " + s + " " + Math.abs(n - s) / s);
        double[] r = quadraticStable(1.0, 1e8, 1.0);
        System.out.println(r[0] + ", " + r[1]);
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>

double machine_epsilon() {
    double eps = 1.0;
    while (1.0 + eps / 2.0 != 1.0) eps /= 2.0;
    return eps;
}

double diff_sqrt_naive(double x)  { return std::sqrt(x + 1) - std::sqrt(x); }
double diff_sqrt_stable(double x) { return 1.0 / (std::sqrt(x + 1) + std::sqrt(x)); }

void quadratic_stable(double a, double b, double c, double& r1, double& r2) {
    double disc = std::sqrt(b * b - 4 * a * c);
    double q = -0.5 * (b + std::copysign(disc, b));   // sign-of-b trick
    r1 = q / a;
    r2 = c / q;
}

int main() {
    std::printf("%.17g\n", machine_epsilon());        // 2.2204460492503131e-16
    double x = 1e10;
    double n = diff_sqrt_naive(x), s = diff_sqrt_stable(x);
    std::printf("%.17g %.17g %.3e\n", n, s, std::fabs(n - s) / s);
    double r1, r2;
    quadratic_stable(1.0, 1e8, 1.0, r1, r2);
    std::printf("%.10g, %.10g\n", r1, r2);
    return 0;
}
```
