---
slug: nn-optimizers
module: neural-networks
title: Optimizers
subtitle: SGD, Momentum, RMSProp, Adam — four ways to walk the same loss surface, and why the smart ones get there faster.
difficulty: Intermediate
position: 7
estimatedReadMinutes: 15
prereqs: [nn-gradient-descent, nn-backpropagation]
relatedProblems: []
references:
  - title: "3Blue1Brown — Gradient descent, how neural networks learn (Ch. 2)"
    url: "https://www.youtube.com/watch?v=IHZwWFHWa-w"
    type: video
  - title: "Andrej Karpathy — Building makemore Part 3 (optimization, BatchNorm)"
    url: "https://www.youtube.com/watch?v=P6sfmUTpUmc"
    type: video
  - title: "distill.pub — Why Momentum Really Works"
    url: "https://distill.pub/2017/momentum/"
    type: article
  - title: "Kingma & Ba — Adam: A Method for Stochastic Optimization"
    url: "https://arxiv.org/abs/1412.6980"
    type: paper
status: published
---

## intro
Backpropagation hands you a gradient — the direction of steepest increase of the loss. An optimizer is the rule that turns that gradient into an actual change in the weights. The simplest rule, plain gradient descent, just steps a fixed fraction of the negative gradient. But the loss surfaces of real networks are not gentle bowls: they have ravines, plateaus, saddle points, and wildly different curvature along different directions. A single global step size handles none of that well. Momentum, RMSProp, and Adam are increasingly clever rules that accumulate history about past gradients — their direction and their magnitude — so the optimizer accelerates through long shallow valleys and slows down across sharp ridges. Choosing and tuning the optimizer is often the difference between a network that trains in an hour and one that never converges.

## whyItMatters
Optimizers are the gearbox of deep learning. The same network with the same data can train smoothly or diverge entirely depending on which update rule and learning rate you pick. Adam, published in 2015, became the default for a generation of models — transformers, GANs, large language models — precisely because it works reasonably well out of the box across an enormous range of problems, sparing practitioners endless learning-rate sweeps. Understanding the lineage from SGD to Adam tells you *why* each piece exists: momentum to fight ravines and noise, per-parameter scaling to handle features that update at different frequencies, bias correction to fix the cold start. It also tells you their failure modes — Adam's occasional poor generalization versus well-tuned SGD, the role of weight decay, why learning-rate warmup and schedules matter. Every modern training recipe is, at heart, a choice of optimizer plus a schedule, and getting that choice wrong wastes compute and produces worse models.

## intuition
Picture a ball rolling on the loss surface. **Plain SGD** moves the ball a fixed step downhill at every position: it has no memory, so on a long narrow valley — steep walls, gentle floor — it zig-zags across the walls instead of running down the floor, wasting most of its motion bouncing side to side. The fix is to give the ball **inertia**.

**Momentum** accumulates a velocity vector: each step adds the current gradient to a decaying running sum of past gradients. In the valley, the side-to-side components keep flipping sign and cancel out, while the down-the-floor component points the same way every step and *builds up*. The ball stops rattling against the walls and accelerates along the valley floor — like a real marble gaining speed downhill. The cost is overshoot: too much momentum and the ball sails past the minimum and has to come back.

**RMSProp** attacks a different problem: parameters with consistently large gradients should take smaller steps, and parameters with tiny gradients should take larger ones, so all dimensions make progress at a comparable rate. It keeps a running average of each parameter's *squared* gradient and divides the step by the square root of that average. A weight that has seen big gradients gets a big denominator and so a damped step; a weight that has been nearly flat gets a small denominator and so an amplified step. This per-parameter rescaling is what lets one global learning rate work across features that update at wildly different scales.

**Adam** simply combines the two: it keeps momentum's running average of the gradient (the first moment, *direction*) **and** RMSProp's running average of the squared gradient (the second moment, *scale*), then divides one by the square root of the other. So Adam moves in a smoothed, inertia-carrying direction, with each coordinate's step size adapted to its own recent volatility. It adds one more trick — **bias correction** — because both running averages start at zero and are therefore biased toward zero in the first few steps; dividing by \(1-\beta^t\) inflates the early estimates to compensate. The result is an optimizer that needs little tuning and traverses ravines, plateaus, and noisy gradients gracefully — which is why it became the field's default.

## visualization
```
The same ravine-shaped loss surface, four update rules, same start point:

  SGD       zig . zag . zig . zag .  (bounces across the walls, crawls down)
            \   /\   /\   /\   /
             \ /  \ /  \ /  \ /
  Momentum   \________________>     (side bounces cancel, speed builds along floor)
              velocity v = b*v + g ;  w -= lr * v

  RMSProp    .--->.-->.->.>.        (big-gradient dims damped, flat dims amplified)
             cache s = r*s + (1-r)*g^2 ;  w -= lr * g / (sqrt(s)+eps)

  Adam       .---->.--->.-->.->      (momentum direction + per-dim scaling)
             m = b1*m + (1-b1)*g  (1st moment)
             s = b2*s + (1-b2)*g^2 (2nd moment)
             w -= lr * m_hat / (sqrt(s_hat)+eps)   with bias-corrected m_hat, s_hat
```

## bruteForce
The baseline is **vanilla stochastic gradient descent**: \(w \leftarrow w - \eta\,\nabla L\). It is memoryless — every step depends only on the current gradient — which makes it cheap (one multiply per parameter, no extra state) and easy to reason about. But it pays for that simplicity. On an ill-conditioned surface (curvature far larger in one direction than another, the typical case for deep nets) a learning rate small enough to avoid diverging along the steep direction is far too small to make progress along the shallow direction, so SGD zig-zags and crawls. It is also fully exposed to gradient noise from minibatching: each step jitters in whatever direction the current batch happens to suggest. You can patch some of this with a hand-tuned learning-rate schedule, but you are still choosing a single global step size for parameters that genuinely need different ones. Plain SGD remains a strong baseline — well-tuned SGD-with-momentum often *generalizes* better than Adam on vision tasks — but as a starting point it demands careful tuning that the adaptive methods largely automate.

## optimal
The practical default is **Adam**, which fuses momentum and per-parameter scaling. Maintain two running averages per parameter, initialized to zero — the first moment \(m\) (mean of gradients) and the second moment \(v\) (mean of squared gradients):
\[
m_t = \beta_1 m_{t-1} + (1-\beta_1)\,g_t,\qquad
v_t = \beta_2 v_{t-1} + (1-\beta_2)\,g_t^2.
\]
Because both start at zero they are biased low early on, so correct them, then take the scaled step:
\[
\hat m_t = \frac{m_t}{1-\beta_1^{\,t}},\quad
\hat v_t = \frac{v_t}{1-\beta_2^{\,t}},\qquad
w_t = w_{t-1} - \eta\,\frac{\hat m_t}{\sqrt{\hat v_t}+\varepsilon}.
\]
The standard hyperparameters \(\beta_1=0.9\), \(\beta_2=0.999\), \(\varepsilon=10^{-8}\) work across a huge range of problems, which is the whole point — Adam is robust to its own settings. Read the update as: \(\hat m_t\) is the smoothed direction (momentum), \(\sqrt{\hat v_t}\) is the per-coordinate recent magnitude (RMSProp's adaptive scale), and dividing one by the other gives each parameter a step normalized by its own volatility. Momentum and RMSProp are the special cases — drop the second moment and you have momentum, drop the first and you have RMSProp. In modern training you almost always pair Adam (or its decoupled-weight-decay variant **AdamW**) with a learning-rate schedule: a short warmup followed by cosine or linear decay. The extra cost over SGD is two state buffers the size of the parameters — cheap, and worth it for the tuning it saves.

```python
import numpy as np

# One Adam step over a parameter vector w given gradient g, carrying state (m, v, t).
def adam_step(w, g, m, v, t, lr=1e-3, b1=0.9, b2=0.999, eps=1e-8):
    t += 1
    m = b1 * m + (1 - b1) * g            # 1st moment: smoothed direction
    v = b2 * v + (1 - b2) * (g * g)      # 2nd moment: smoothed squared magnitude
    m_hat = m / (1 - b1 ** t)            # bias correction (both start at zero)
    v_hat = v / (1 - b2 ** t)
    w = w - lr * m_hat / (np.sqrt(v_hat) + eps)
    return w, m, v, t

# Minimize f(w) = w0^2 + 100*w1^2 (an ill-conditioned bowl).
w = np.array([5.0, 5.0]); m = np.zeros(2); v = np.zeros(2); t = 0
for _ in range(200):
    g = np.array([2 * w[0], 200 * w[1]])
    w, m, v, t = adam_step(w, g, m, v, t, lr=0.1)
print(np.round(w, 4))   # both coordinates driven near zero despite 100x curvature gap
```

## complexity
time: O(P) per step, where P is the number of parameters — every rule (SGD, Momentum, RMSProp, Adam) is a constant number of elementwise operations per parameter. The dominant cost of a training step is the forward/backward pass, not the optimizer update.
space: O(1) extra for SGD; O(P) for Momentum (one velocity buffer); O(P) for RMSProp (one squared-gradient cache); O(2P) for Adam (first and second moment buffers). For billion-parameter models this optimizer state is a real memory cost and motivates sharded/8-bit optimizers.
notes: All four share the same asymptotic per-step cost; they differ in convergence *speed* (steps to reach a target loss) and robustness, not in big-O. Bias correction in Adam is O(1) extra arithmetic per parameter.

## pitfalls
- Reusing the same learning rate when switching optimizers. SGD often needs a rate around \(10^{-1}\), while Adam typically wants \(10^{-3}\); plugging an SGD-scale rate into Adam diverges, and an Adam-scale rate into SGD barely moves. The fix: retune the learning rate whenever you change the optimizer, and use a schedule with warmup.
- Forgetting bias correction. Skipping the \(1-\beta^t\) terms makes Adam take tiny, timid steps for the first dozens of iterations because \(m\) and \(v\) are still near their zero initialization. The fix: always apply bias correction, or use a framework implementation that does.
- Too much momentum. A momentum coefficient near 1 (say 0.99) gives the ball so much inertia it sails far past the minimum and oscillates for a long time before settling. The fix: keep \(\beta_1\) around 0.9 and lower it if you see persistent overshoot.
- Confusing L2 regularization with weight decay under Adam. Adding an L2 penalty to the loss interacts badly with Adam's per-parameter scaling, so the intended decay is unevenly applied. The fix: use AdamW, which decouples weight decay from the adaptive step, instead of folding L2 into the gradient.
- Assuming Adam always wins. Adam converges fast but can generalize worse than well-tuned SGD-with-momentum on some vision benchmarks. The fix: treat the optimizer as a hyperparameter — try tuned SGD+momentum as a baseline, not just Adam's defaults.

## interviewTips
- Build the lineage live: start with SGD's zig-zag failure in a ravine, add momentum to cancel the oscillation, add RMSProp's per-parameter squared-gradient scaling, then state that Adam is exactly their combination plus bias correction. Showing the *why* of each piece beats reciting the update equation.
- Be ready to explain bias correction concretely: both moment estimates start at zero, so early on they underestimate the true moments by roughly the factor \(1-\beta^t\); dividing by that factor undoes the bias and is largest in the first few steps.
- Mention the memory cost — Adam stores two extra buffers the size of the parameters — and connect it to AdamW versus L2 and to why huge models use sharded or 8-bit optimizer states. It signals you understand training at scale, not just the textbook formula.

## keyTakeaways
- An optimizer turns the gradient from backprop into a weight update; plain SGD uses a single global step size and zig-zags on ill-conditioned (ravine-shaped) surfaces.
- Momentum accumulates a velocity to cancel side-to-side oscillation and accelerate along consistent directions; RMSProp divides by a running root-mean-square of each parameter's gradient to give every dimension a comparable effective step.
- Adam combines momentum (first moment) with RMSProp (second moment) and adds bias correction for the zero-initialized averages; with \(\beta_1{=}0.9,\beta_2{=}0.999\) it is robust enough to be the field's default, though tuned SGD+momentum can still generalize better.

## code.python
```python
import numpy as np

# Compare four optimizers minimizing an ill-conditioned bowl f(w)=w0^2 + 100*w1^2.
def grad(w):
    return np.array([2 * w[0], 200 * w[1]])

def run(rule, steps=300, lr=0.01):
    w = np.array([5.0, 5.0])
    v = np.zeros(2); s = np.zeros(2); m = np.zeros(2); t = 0
    for _ in range(steps):
        g = grad(w); t += 1
        if rule == 'sgd':
            w = w - lr * g
        elif rule == 'momentum':
            v = 0.9 * v + g
            w = w - lr * v
        elif rule == 'rmsprop':
            s = 0.9 * s + 0.1 * g * g
            w = w - lr * g / (np.sqrt(s) + 1e-8)
        elif rule == 'adam':
            m = 0.9 * m + 0.1 * g
            s = 0.999 * s + 0.001 * g * g
            mh = m / (1 - 0.9 ** t); sh = s / (1 - 0.999 ** t)
            w = w - lr * mh / (np.sqrt(sh) + 1e-8)
    return float(w[0] ** 2 + 100 * w[1] ** 2)

for r in ['sgd', 'momentum', 'rmsprop', 'adam']:
    print(f"{r:9s} final loss = {run(r):.6f}")
```

## code.javascript
```javascript
// Compare four optimizers on f(w) = w0^2 + 100*w1^2 (ill-conditioned bowl).
const grad = w => [2 * w[0], 200 * w[1]];

function run(rule, steps = 300, lr = 0.01) {
  let w = [5.0, 5.0];
  let v = [0, 0], s = [0, 0], m = [0, 0], t = 0;
  for (let i = 0; i < steps; i++) {
    const g = grad(w); t += 1;
    for (let k = 0; k < 2; k++) {
      if (rule === 'sgd') {
        w[k] -= lr * g[k];
      } else if (rule === 'momentum') {
        v[k] = 0.9 * v[k] + g[k];
        w[k] -= lr * v[k];
      } else if (rule === 'rmsprop') {
        s[k] = 0.9 * s[k] + 0.1 * g[k] * g[k];
        w[k] -= lr * g[k] / (Math.sqrt(s[k]) + 1e-8);
      } else if (rule === 'adam') {
        m[k] = 0.9 * m[k] + 0.1 * g[k];
        s[k] = 0.999 * s[k] + 0.001 * g[k] * g[k];
        const mh = m[k] / (1 - 0.9 ** t), sh = s[k] / (1 - 0.999 ** t);
        w[k] -= lr * mh / (Math.sqrt(sh) + 1e-8);
      }
    }
  }
  return w[0] ** 2 + 100 * w[1] ** 2;
}

for (const r of ['sgd', 'momentum', 'rmsprop', 'adam']) {
  console.log(`${r.padEnd(9)} final loss = ${run(r).toFixed(6)}`);
}
```

## code.java
```java
public class Optimizers {
    static double[] grad(double[] w) { return new double[]{2 * w[0], 200 * w[1]}; }

    static double run(String rule, int steps, double lr) {
        double[] w = {5.0, 5.0};
        double[] v = {0, 0}, s = {0, 0}, m = {0, 0};
        int t = 0;
        for (int i = 0; i < steps; i++) {
            double[] g = grad(w); t++;
            for (int k = 0; k < 2; k++) {
                if (rule.equals("sgd")) {
                    w[k] -= lr * g[k];
                } else if (rule.equals("momentum")) {
                    v[k] = 0.9 * v[k] + g[k];
                    w[k] -= lr * v[k];
                } else if (rule.equals("rmsprop")) {
                    s[k] = 0.9 * s[k] + 0.1 * g[k] * g[k];
                    w[k] -= lr * g[k] / (Math.sqrt(s[k]) + 1e-8);
                } else {
                    m[k] = 0.9 * m[k] + 0.1 * g[k];
                    s[k] = 0.999 * s[k] + 0.001 * g[k] * g[k];
                    double mh = m[k] / (1 - Math.pow(0.9, t));
                    double sh = s[k] / (1 - Math.pow(0.999, t));
                    w[k] -= lr * mh / (Math.sqrt(sh) + 1e-8);
                }
            }
        }
        return w[0] * w[0] + 100 * w[1] * w[1];
    }

    public static void main(String[] args) {
        for (String r : new String[]{"sgd", "momentum", "rmsprop", "adam"})
            System.out.printf("%-9s final loss = %.6f%n", r, run(r, 300, 0.01));
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <string>

void grad(const double* w, double* g) { g[0] = 2 * w[0]; g[1] = 200 * w[1]; }

double run(const std::string& rule, int steps, double lr) {
    double w[2] = {5.0, 5.0};
    double v[2] = {0, 0}, s[2] = {0, 0}, m[2] = {0, 0};
    int t = 0;
    for (int i = 0; i < steps; i++) {
        double g[2]; grad(w, g); t++;
        for (int k = 0; k < 2; k++) {
            if (rule == "sgd") {
                w[k] -= lr * g[k];
            } else if (rule == "momentum") {
                v[k] = 0.9 * v[k] + g[k];
                w[k] -= lr * v[k];
            } else if (rule == "rmsprop") {
                s[k] = 0.9 * s[k] + 0.1 * g[k] * g[k];
                w[k] -= lr * g[k] / (std::sqrt(s[k]) + 1e-8);
            } else {
                m[k] = 0.9 * m[k] + 0.1 * g[k];
                s[k] = 0.999 * s[k] + 0.001 * g[k] * g[k];
                double mh = m[k] / (1 - std::pow(0.9, t));
                double sh = s[k] / (1 - std::pow(0.999, t));
                w[k] -= lr * mh / (std::sqrt(sh) + 1e-8);
            }
        }
    }
    return w[0] * w[0] + 100 * w[1] * w[1];
}

int main() {
    const char* rules[] = {"sgd", "momentum", "rmsprop", "adam"};
    for (const char* r : rules)
        std::printf("%-9s final loss = %.6f\n", r, run(r, 300, 0.01));
    return 0;
}
```
