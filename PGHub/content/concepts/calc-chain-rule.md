---
slug: calc-chain-rule
module: calculus
title: The Chain Rule
subtitle: When functions are nested, their rates of change multiply — the gear-ratio of calculus.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 9
prereqs: [calc-derivative-as-slope]
relatedProblems: []
references:
  - title: "3Blue1Brown — Essence of Calculus, Chapter 4: Visualizing the chain rule and product rule"
    url: "https://www.youtube.com/watch?v=YG15m2VwSjA"
    type: video
  - title: "Khan Academy — The chain rule"
    url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-differentiation-2-new/ab-3-1a/v/chain-rule-introduction"
    type: course
  - title: "Paul's Online Math Notes — Chain Rule"
    url: "https://tutorial.math.lamar.edu/classes/calci/chainrule.aspx"
    type: blog
status: published
---

## intro
Real functions are rarely one clean operation; they are operations nested inside operations — square the sine of three times an angle, exponentiate a sum of products. The chain rule is the law for differentiating these compositions. Its message is simple and physical: when one quantity drives a second which drives a third, the overall sensitivity is the product of the link-by-link sensitivities. Rates of change multiply down the chain.

## whyItMatters
The chain rule is the single most load-bearing rule in applied calculus because real models are deep compositions. Backpropagation — the algorithm that trains every neural network — is nothing but the chain rule applied layer by layer, multiplying local derivatives from the loss back to each weight. Implicit differentiation, related-rates problems, change of variables in integration, and the gradients of any composed function all run on it. In physics, converting a rate measured against one variable into a rate against another (speed in meters-per-second to meters-per-hour, or position-vs-time into position-vs-temperature) is the chain rule. If you can only deeply learn one differentiation rule beyond the power rule, this is the one — everything modern, from optimizers to autodiff engines, is built on it.

## intuition
Think in gears. Turn gear A and it spins gear B; gear B spins gear C. If A drives B at 3 turns-per-turn, and B drives C at 2 turns-per-turn, then one turn of A produces \(3 \times 2 = 6\) turns of C. The rates multiply. That is the chain rule in one sentence: the rate of the whole composition is the product of the rates of the links.

Make it functions. Suppose \(y = g(u)\) and \(u = f(x)\), so \(y = g(f(x))\) is the composition. A nudge \(dx\) in the input produces a nudge in the inner output, \(du = f'(x)\,dx\). That \(du\) is then the input to \(g\), and it produces \(dy = g'(u)\,du\). Substitute and the inner nudge cancels in the ratio:
\[
\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx} = g'(u)\cdot f'(x) = g'\!\big(f(x)\big)\cdot f'(x).
\]
The fraction-canceling picture (\(\frac{dy}{dx} = \frac{dy}{du}\cdot\frac{du}{dx}\), the \(du\)'s "cancel") is the right intuition and a true statement about infinitesimals, even though derivatives are not literally fractions. The crucial subtlety, the one people botch, is **where** you evaluate the outer derivative: \(g'\) is evaluated at the *inner output* \(u = f(x)\), not at \(x\). The outer function never sees \(x\); it only ever sees what \(f\) handed it.

A concrete propagation example pins it down. Let \(f(x) = 3x\) and \(g(u) = u^2\), so the composition is \(g(f(x)) = (3x)^2 = 9x^2\). At \(x = 2\): the inner output is \(u = f(2) = 6\); the inner rate is \(f'(x) = 3\); the outer rate at that output is \(g'(u) = 2u = 12\). Multiply: \(\frac{dy}{dx} = 12 \times 3 = 36\). Check directly: \(\frac{d}{dx}9x^2 = 18x = 36\) at \(x = 2\). They agree, and the structure shows *why* — a tiny step in \(x\) is amplified 3× into \(u\), then that step in \(u\) is amplified 12× into \(y\), for a total amplification of 36.

The practical reading is "outer derivative times inner derivative, leaving the inside alone, then multiply by the derivative of the inside." For \(\frac{d}{dx}\sin(x^2)\): the outer is sine, whose derivative is cosine, evaluated at the untouched inside \(x^2\), giving \(\cos(x^2)\); then times the inner derivative \(2x\); result \(2x\cos(x^2)\). The rule extends to any depth — \(g(f(h(x)))\) chains three factors — which is exactly why a hundred-layer network's gradient is a hundred-factor product, and why vanishing and exploding gradients (products of many small or large factors) are a chain-rule phenomenon.

## visualization
```
   x  ----[ f ]---->  u = f(x)  ----[ g ]---->  y = g(u)
   |                  |                          |
   nudge dx           du = f'(x) dx              dy = g'(u) du
   |                  |                          |
   amplify by f'(x)   then amplify by g'(u)      total amplification:
                                                 dy/dx = g'(f(x)) * f'(x)

   example  f(x) = 3x,  g(u) = u^2,  at x = 2
   dx -----> du = 3 * dx -----> dy = 12 * du = 36 * dx
            (inner rate 3)     (outer rate 12)   (product 36)
```

## bruteForce
The naive alternative is to **expand the composition first, then differentiate**. For \((3x)^2\) you multiply it out to \(9x^2\) and apply the power rule. This works whenever the composition simplifies to something elementary, but it collapses fast: \(\sin(x^2)\), \(e^{\cos x}\), or \((x^3 + 1)^{50}\) cannot be expanded into a sum of monomials, so there is nothing to differentiate term-by-term. Even when expansion is possible — \((x^3+1)^{50}\) technically expands — doing so by hand is absurd. The brute method is a special-case shortcut, not a general tool, and it offers no insight into *why* the answer has the form it does.

## optimal
The chain rule itself is the optimal, fully general method: differentiate the outer function with the inner left intact, then multiply by the derivative of the inner. Formally, for \(y = g(f(x))\),
\[
\frac{dy}{dx} = g'\!\big(f(x)\big)\cdot f'(x),
\]
and for deeper nests you append one factor per layer: \(\frac{d}{dx}g(f(h(x))) = g'(f(h(x)))\cdot f'(h(x))\cdot h'(x)\). The procedure is mechanical and never requires expansion, so it handles transcendental and arbitrarily deep compositions uniformly.

The computational realization of this idea at scale is **automatic differentiation**, and specifically **reverse-mode autodiff (backpropagation)**. A program is a long composition of elementary operations; the chain rule says its derivative is the product of each operation's local derivative. Forward mode pushes derivatives forward through the chain as it evaluates; reverse mode does one forward pass to record every intermediate value, then sweeps backward multiplying local derivatives — which is dramatically cheaper when there are many inputs and one output (exactly the shape of a loss function over millions of weights). That asymmetry is why training neural nets uses reverse mode: one backward pass yields the gradient with respect to *every* parameter at the cost of a constant multiple of the forward pass.

Why this beats expansion: the chain rule is O(depth) factors regardless of how messy each link is, requires no algebraic simplification, and exposes the structure that makes gradient flow analyzable. The one discipline it demands is correct evaluation points — each link's derivative is taken at the value flowing into that link, which is precisely what reverse-mode autodiff caches during the forward pass.

```python
# Manual chain rule via stored intermediates (a toy backprop).
def chain(x):
    u = 3 * x          # inner f(x) = 3x
    y = u * u          # outer g(u) = u^2
    # local derivatives, each at its own evaluation point
    du_dx = 3          # f'(x)
    dy_du = 2 * u      # g'(u), evaluated at the inner output u
    return y, dy_du * du_dx   # chain rule: multiply local rates

val, grad = chain(2.0)
print(val, grad)   # 36.0  36.0  -> matches d/dx (9x^2) = 18x at x=2
```

## complexity
time: O(d) for a depth-d composition (one local derivative per layer); reverse-mode autodiff is O(cost of forward pass)
space: O(1) for a hand chain; O(number of intermediates) for reverse-mode, which caches the forward values
notes: The product-of-factors form is why deep compositions suffer vanishing gradients (many factors < 1 multiply toward 0) or exploding gradients (factors > 1 blow up) — a direct, quantitative consequence of the chain rule.

## pitfalls
- Evaluating the outer derivative at \(x\) instead of at the inner output \(f(x)\). The outer function only ever sees what the inner handed it.
- Forgetting to multiply by the inner derivative. Writing \(\cos(x^2)\) for \(\frac{d}{dx}\sin(x^2)\) and dropping the \(2x\) is the classic miss.
- Stopping one layer too early on a triple nest. Each layer of nesting contributes exactly one factor; count the layers.
- Mismatching which function is "inner" vs "outer." The outer is applied last; the inner is what sits inside its parentheses.
- Treating \(\frac{dy}{du}\cdot\frac{du}{dx}\) as literal fraction cancellation in a proof. It is the right intuition and a valid mnemonic, but the rigorous statement is the limit-based chain rule, not algebra on symbols.

## interviewTips
- Verbalize the rule as you apply it: "derivative of the outside, keep the inside, times derivative of the inside."
- For nested compositions, peel one layer at a time and write each factor; the answer is the product.
- Connect it to backprop if the role is ML-adjacent — interviewers like hearing that backpropagation is the chain rule applied layer by layer.

## keyTakeaways
- For a composition \(g(f(x))\), the derivative is \(g'(f(x))\cdot f'(x)\): rates of change multiply along the chain.
- The outer derivative is evaluated at the inner output, never at the original input — the most common source of error.
- Backpropagation is the chain rule run in reverse over a deep composition, which is why deep models can be trained at all.

## code.python
```python
def chain(x):
    u = 3 * x            # inner f
    y = u * u            # outer g
    du_dx = 3            # f'(x)
    dy_du = 2 * u        # g'(u) at the inner output
    return y, dy_du * du_dx

print(chain(2.0))        # (36.0, 36.0)  -> d/dx (9x^2) = 18x = 36
```

## code.javascript
```javascript
function chain(x) {
  const u = 3 * x;        // inner f
  const y = u * u;        // outer g
  const duDx = 3;         // f'(x)
  const dyDu = 2 * u;     // g'(u) at the inner output
  return { y, grad: dyDu * duDx };
}

console.log(chain(2.0));  // { y: 36, grad: 36 }
```

## code.java
```java
public class ChainRule {
    static double[] chain(double x) {
        double u = 3 * x;       // inner f
        double y = u * u;       // outer g
        double duDx = 3;        // f'(x)
        double dyDu = 2 * u;    // g'(u) at the inner output
        return new double[]{ y, dyDu * duDx };
    }

    public static void main(String[] args) {
        double[] r = chain(2.0);
        System.out.printf("y=%.1f grad=%.1f%n", r[0], r[1]); // y=36.0 grad=36.0
    }
}
```

## code.cpp
```cpp
#include <cstdio>

int main() {
    double x = 2.0;
    double u = 3 * x;        // inner f
    double y = u * u;        // outer g
    double duDx = 3;         // f'(x)
    double dyDu = 2 * u;     // g'(u) at the inner output
    double grad = dyDu * duDx;
    std::printf("y=%.1f grad=%.1f\n", y, grad); // y=36.0 grad=36.0
    return 0;
}
```
