---
slug: calc-limits-continuity
module: calculus
title: Limits and Continuity
subtitle: What a function approaches — and why the value it lands on isn't always the value it has.
difficulty: Beginner
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "3Blue1Brown — Essence of Calculus, Chapter 7: Limits"
    url: "https://www.youtube.com/watch?v=kfF40MiS7zA"
    type: video
  - title: "Khan Academy — Limits and continuity"
    url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-limits-new"
    type: course
  - title: "Paul's Online Math Notes — The Limit"
    url: "https://tutorial.math.lamar.edu/classes/calci/thelimit.aspx"
    type: blog
status: published
---

## intro
A limit asks a single, careful question: as the input slides toward some target, where does the output head? Not "what is the output there" — where does it *head*. That distinction is the whole engine of calculus. The value a function approaches near a point can differ from the value it actually takes there, or the function may have no value there at all, and the limit still exists and tells us something exact.

## whyItMatters
Every other idea in calculus is a limit wearing a costume. The derivative is the limit of a slope as two points merge; the definite integral is the limit of a sum as the pieces shrink; an infinite series is the limit of partial sums. If limits feel shaky, every later topic inherits the wobble. Limits also formalize "arbitrarily close," which is how we reason about instantaneous speed, marginal cost, and the behavior of a model as data grows without bound. In machine learning, the same machinery underlies gradients, convergence of optimizers, and why a learning rate that is "small enough" works. Master limits once and the rest of calculus stops feeling like a bag of tricks and starts feeling like one idea applied repeatedly.

## intuition
Picture walking toward a doorway while reading the number painted above each floor tile. You never need to step on the threshold tile to know which number is coming next — the sequence 2.9, 2.99, 2.999 makes the destination obvious even if the threshold tile itself is blank or, oddly, painted 7. The limit is that destination the numbers agree on, independent of whatever happens exactly at the target.

Formally we write \(\lim_{x \to a} f(x) = L\), read "the limit of \(f\) as \(x\) approaches \(a\) is \(L\)." It means: you can force \(f(x)\) as close to \(L\) as anyone demands, just by keeping \(x\) close enough to \(a\) (but not equal to \(a\)). The challenge-and-response framing is the precise version: someone hands you a tolerance \(\varepsilon\) around \(L\); you must produce a radius \(\delta\) around \(a\) so that every \(x\) within \(\delta\) of \(a\) lands within \(\varepsilon\) of \(L\). If you can always answer the challenge, the limit exists.

A limit can exist where the function is undefined. Take \(f(x) = \frac{x^2 - 1}{x - 1}\). At \(x = 1\) the formula is \(\frac{0}{0}\), genuinely undefined. But for every other \(x\) the expression simplifies to \(x + 1\), so as \(x \to 1\) the output marches toward 2. The limit is 2 even though \(f(1)\) does not exist — there is a single missing point, a "hole," and the limit fills it in conceptually.

A limit can also *fail* to exist. It fails when the left approach and the right approach disagree (a jump), when the function blows up without bound (a vertical asymptote), or when it oscillates forever without settling (like \(\sin(1/x)\) near 0). Limits are inherently two-sided: \(\lim_{x \to a} f(x)\) exists only when \(\lim_{x \to a^-} f(x)\) and \(\lim_{x \to a^+} f(x)\) exist and are equal.

Continuity is the clean case where nothing surprising happens at the target. A function is continuous at \(a\) when three things line up: \(f(a)\) is defined, the limit exists, and the two agree — \(\lim_{x \to a} f(x) = f(a)\). Intuitively, you can draw the graph through that point without lifting your pen. Polynomials, sines, cosines, and exponentials are continuous everywhere; rational functions are continuous except where the denominator hits zero.

## visualization
```
y                       limit from the LEFT  --> 2  <-- limit from the RIGHT
|
3 -                              o   (hole at x = 1: f(1) undefined)
|                            .-'
2 - - - - - - - - - - - - - O - - - - - - - - L = 2  (both sides agree)
|                       .-'
1 -                 .-'
|              .-'
0 +----|----|----|----|----|----|---->  x
       0   0.5  0.9  1.0  1.1  1.5

x  -> 1^-:  f = 1.9, 1.99, 1.999 ........ heading to 2
x  -> 1^+:  f = 2.1, 2.01, 2.001 ........ heading to 2
both sides meet at L = 2, so the limit EXISTS even though f(1) is a hole
```

## bruteForce
The naive move is "plug in the point." For continuous functions that is exactly right and instant: \(\lim_{x \to 3}(x^2 + 1) = 10\) because the polynomial is continuous, so the limit equals the value. The brute approach breaks the moment substitution yields an indeterminate form like \(\frac{0}{0}\) or \(\frac{\infty}{\infty}\) — there, plugging in tells you nothing, and you must do real work: algebraic simplification (factor and cancel the hole), rationalizing, or numerical probing from both sides with a table of inputs creeping toward the target.

## optimal
The reliable toolkit is the **limit laws** plus a few rewrite tricks. Limits distribute over sums, products, and quotients (the quotient law as long as the bottom limit is nonzero), so you decompose a hard limit into easy pieces. When direct substitution gives \(\frac{0}{0}\), the standard repairs are: **factor and cancel** the common term that creates the hole; **rationalize** when square roots are involved (multiply by the conjugate); apply a **known special limit** such as \(\lim_{x \to 0} \frac{\sin x}{x} = 1\); or, once you have derivatives, invoke **L'Hôpital's rule** to replace the ratio of values with the ratio of slopes. For limits at infinity, divide numerator and denominator by the highest power of \(x\) and read off which terms vanish.

The decisive idea behind all of this is the \(\varepsilon\)–\(\delta\) definition, which turns "approaches" into something you can prove. To establish \(\lim_{x \to a} f(x) = L\), you treat \(\varepsilon > 0\) as an adversary's demand and construct a \(\delta > 0\) — typically by working the inequality \(|f(x) - L| < \varepsilon\) backward into a bound on \(|x - a|\). The **squeeze theorem** is the other workhorse: if \(g(x) \le f(x) \le h(x)\) near \(a\) and both \(g\) and \(h\) approach the same \(L\), then \(f\) is trapped and must approach \(L\) too — this is how \(\lim_{x\to 0} x^2 \sin(1/x) = 0\) gets pinned down despite the wild oscillation. Numerically, the optimal sanity check is a two-sided table: evaluate at \(a \pm 0.1, a \pm 0.01, a \pm 0.001\) and confirm both columns converge to the same number before trusting any algebraic answer.

```python
def numeric_limit(f, a, side='both', steps=6):
    # Probe f from both sides of a with a shrinking offset.
    rows = []
    h = 0.1
    for _ in range(steps):
        left = f(a - h) if side in ('both', 'left') else None
        right = f(a + h) if side in ('both', 'right') else None
        rows.append((h, left, right))
        h /= 10
    return rows

f = lambda x: (x*x - 1) / (x - 1)   # hole at x = 1, true limit is 2
for h, L, R in numeric_limit(f, 1.0):
    print(f"h={h:<8} left={L:.6f} right={R:.6f}")
```

The numeric probe converges to 2.0 from both columns, confirming the limit without ever evaluating at the undefined point.

## complexity
time: O(1) for direct substitution on continuous functions; O(k) for a k-row numeric probe
space: O(1)
notes: Symbolic limit evaluation cost depends on the algebra (factoring, conjugates, L'Hôpital iterations), not on input size. Numeric probing is exact only in the limit; floating-point cancellation near the hole eventually corrupts the table, so stop before h gets so small that f(a±h) loses precision.

## pitfalls
- Assuming the limit equals the function value. They coincide only when the function is continuous there; a removable hole or a jump breaks the equality.
- Forgetting limits are two-sided. A jump discontinuity has perfectly good one-sided limits that disagree, so the two-sided limit does not exist.
- Treating \(\frac{0}{0}\) as 0 or as 1. It is indeterminate — it signals "do more work," not a final answer.
- Trusting a numeric table blindly. Floating-point round-off near the target can make the probe diverge or flatten to a wrong value once h is tiny; the algebra is the source of truth.
- Confusing "approaches infinity" with "the limit equals infinity, so it exists." A limit that grows without bound does not exist as a finite number; saying it "is" infinity is shorthand for "fails to converge."

## interviewTips
- Always check direct substitution first; if it gives a clean number on a continuous function, you are done in one line.
- When you hit \(\frac{0}{0}\), say out loud "indeterminate" and name your repair — factor, rationalize, special limit, or L'Hôpital — before computing.
- For a "does the limit exist" question, evaluate both one-sided limits explicitly and state whether they agree.

## keyTakeaways
- A limit is the value a function approaches, which can differ from or exist without the value the function takes.
- The two-sided limit exists only when both one-sided limits exist and match; continuity additionally requires the limit to equal the function value.
- Indeterminate forms are prompts to simplify; \(\varepsilon\)–\(\delta\) and the squeeze theorem are the rigorous tools when algebra alone won't settle it.

## code.python
```python
def numeric_limit(f, a, h=1e-5):
    left = f(a - h)
    right = f(a + h)
    return (left + right) / 2, abs(right - left)

f = lambda x: (x*x - 1) / (x - 1)   # hole at x = 1
estimate, gap = numeric_limit(f, 1.0)
print(f"limit ~ {estimate:.6f}  (two-sided gap {gap:.2e})")  # ~ 2.0
```

## code.javascript
```javascript
function numericLimit(f, a, h = 1e-5) {
  const left = f(a - h);
  const right = f(a + h);
  return { estimate: (left + right) / 2, gap: Math.abs(right - left) };
}

const f = (x) => (x * x - 1) / (x - 1); // hole at x = 1
const { estimate, gap } = numericLimit(f, 1.0);
console.log(`limit ~ ${estimate.toFixed(6)}  (gap ${gap.toExponential(2)})`); // ~ 2.0
```

## code.java
```java
import java.util.function.DoubleUnaryOperator;

public class NumericLimit {
    static double[] limit(DoubleUnaryOperator f, double a, double h) {
        double left = f.applyAsDouble(a - h);
        double right = f.applyAsDouble(a + h);
        return new double[]{ (left + right) / 2, Math.abs(right - left) };
    }

    public static void main(String[] args) {
        DoubleUnaryOperator f = x -> (x * x - 1) / (x - 1); // hole at x = 1
        double[] r = limit(f, 1.0, 1e-5);
        System.out.printf("limit ~ %.6f  (gap %.2e)%n", r[0], r[1]); // ~ 2.0
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <functional>

int main() {
    auto f = [](double x) { return (x * x - 1) / (x - 1); }; // hole at x = 1
    double a = 1.0, h = 1e-5;
    double left = f(a - h), right = f(a + h);
    double estimate = (left + right) / 2;
    double gap = std::fabs(right - left);
    std::printf("limit ~ %.6f  (gap %.2e)\n", estimate, gap); // ~ 2.0
    return 0;
}
```
