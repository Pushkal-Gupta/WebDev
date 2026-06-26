---
slug: nn-gradient-descent
module: neural-networks
title: Gradient Descent — how a network actually learns
subtitle: A loss surface, the gradient that points uphill, and a learning rate that decides whether you glide to the bottom or fly off the cliff.
difficulty: Beginner
position: 3
estimatedReadMinutes: 14
prereqs: [nn-perceptron]
relatedProblems: []
references:
  - title: "3Blue1Brown — Gradient descent, how neural networks learn | Chapter 2, Deep learning"
    url: "https://www.youtube.com/watch?v=IHZwWFHWa-w"
    type: video
  - title: "Andrew Ng — Neural Networks and Deep Learning (Coursera, Course 1)"
    url: "https://www.coursera.org/learn/neural-networks-deep-learning"
    type: course
  - title: "Stanford CS231n — Optimization: stochastic gradient descent (notes)"
    url: "https://cs231n.github.io/optimization-1/"
    type: reference
status: published
---

## intro
Training a network is a search. Every weight and bias is a knob, and somewhere in that enormous space of settings is a configuration where the model's predictions are good. **Gradient descent** is the procedure that finds it: measure how wrong the model is right now with a single number called the loss, ask "which way should I nudge each weight to make that number smaller," and take a small step in exactly that direction. Repeat a few thousand times and the loss slides downhill. The "which way" question has a precise answer — the negative gradient — and the size of each step is governed by one famous knob, the learning rate, that quietly decides whether your training converges, crawls, or explodes.

## whyItMatters
Gradient descent is the engine under every neural network that has ever been trained, from a two-weight toy to a frontier language model. Backpropagation, optimizers like Adam and RMSProp, learning-rate schedules, weight decay — all of them are refinements of this one loop. If you understand the loop you can read almost any training curve and diagnose what went wrong: a loss that plateaus high means the step is too small or you're stuck in a flat region; a loss that oscillates or shoots to NaN means the step is too large. Practitioners spend more time tuning the learning rate than any other hyperparameter precisely because it is the lever that controls this descent. The mental model also transfers everywhere in machine learning: fitting a logistic regression, training an SVM with subgradients, even calibrating a physics simulation all reduce to "define a loss, follow its slope down." Master the geometry of one descent step and the rest of optimization becomes vocabulary on top of a picture you already hold.

## intuition
Imagine the loss as a landscape. The horizontal directions are the model's parameters — for a single weight it's a 2D curve, for two weights a 3D bowl, for a real network a surface in millions of dimensions you can't picture but which behaves the same way. The height at any point is how wrong the model is with those parameter values. **Training is walking downhill on that surface until you reach a valley.**

The trick is doing it blindfolded. You can't see the whole landscape — it's far too high-dimensional — but at the spot where you're standing you can feel the slope under your feet. That local slope is the **gradient**: the vector of partial derivatives \(\nabla L = (\partial L/\partial w_1, \partial L/\partial w_2, \dots)\). Each component answers "if I increase this one weight a tiny bit, does the loss go up or down, and how fast?" The full gradient points in the direction of *steepest ascent* — the way that increases the loss fastest. So to decrease the loss you walk in the **opposite** direction, \(-\nabla L\). That single fact is the whole algorithm.

How far do you step? That's the **learning rate** \(\eta\). The update is

\[
w \leftarrow w - \eta\,\nabla L.
\]

The learning rate scales the step. Too small and you inch downhill, taking thousands of steps to reach the bottom — slow but safe. Too large and you overshoot the valley, landing on the far wall higher than you started; do that repeatedly and the loss *grows* each step until it diverges to infinity. There's a sweet spot — large enough to make real progress, small enough to keep descending — and finding it is the central tuning problem of training. The gradient gives you the *direction* for free; the learning rate is the one number you have to choose, and it makes or breaks the run.

One more wrinkle: the gradient is only a *local* measurement. On a simple convex bowl it always points toward the single global minimum, so descent is guaranteed to arrive. On the bumpy, non-convex surfaces of real networks it can lead you into a *local* minimum or a long flat plateau where the slope nearly vanishes and progress stalls. That's why momentum, adaptive learning rates, and good initialization exist — they help the ball roll past small dips and flat stretches toward a genuinely low valley.

## visualization
```
Loss surface L(w), a single weight.  Ball steps downhill by  w <- w - eta * dL/dw

 L
 |  *                                       *
 |    *                                   *
 |      *        good eta                *
 |        *      O--.                   *
 |          *       '--.   O--.        *
 |            *          '--.   O--.  *
 |              *...............O....*   <- minimum (slope = 0, ball stops)
 +----------------------------------------> w

 too small:  O-O-O-O-O ............ (creeps, never arrives in time)
 too large:  O ---------> O' (overshoots, lands HIGHER on the far wall)
 diverges:   O -> O' -> O'' -> off the chart (loss climbs every step)
```

## bruteForce
The crude way to minimize a loss is to **search the parameter space without using the slope** — random sampling or a grid. Pick many candidate weight vectors, evaluate the loss at each, and keep the one with the lowest value. For one or two parameters this is fine: a few thousand random points will land close to the bottom of a smooth bowl. It needs no calculus and is trivially parallel. But it is hopeless at any real scale. The number of grid points grows exponentially with the parameter count, so covering a 1,000-dimensional space to any resolution would take more samples than there are atoms in the universe. Worse, sampling gives you no *direction*: when a candidate is near the minimum you have no way to refine it, only to throw more darts. A close cousin is finite-difference descent — estimate each partial derivative by nudging one weight and re-evaluating the loss — which does give a direction but costs one full forward pass *per parameter per step*, hundreds of millions of evaluations for a real model. Both work as teaching tools and both collapse the instant the model has more than a handful of weights.

## optimal
Use **analytic gradient descent**: compute the exact gradient \(\nabla L\) with calculus (in a network, via backpropagation, which gets every partial derivative in a single backward pass for the cost of one forward pass) and step against it. The loop is

\[
w \leftarrow w - \eta\,\nabla L(w),
\]

repeated until the loss stops improving. Because the gradient delivers the steepest-descent direction directly, you never search blindly — every step is informed. For convex losses (linear/logistic regression, a single-layer model) this provably converges to the global minimum for a small enough \(\eta\); for non-convex networks it reliably finds a good local minimum in practice. Three refinements make it work at scale. **Stochastic / mini-batch gradient descent** estimates the gradient from a small random batch instead of the whole dataset, trading a noisier step for vastly cheaper iterations — and the noise even helps escape shallow minima. **Momentum** accumulates a running average of past gradients so the ball builds speed down consistent slopes and rolls through flat spots and small dips. **Adaptive methods (RMSProp, Adam)** give each parameter its own effective learning rate based on the size of its recent gradients, which removes much of the manual tuning. All three keep the same skeleton: direction from the gradient, distance from the learning rate. The learning rate remains the decisive knob — start with a modest value, watch the loss curve, and back off if it oscillates or climbs. A common upgrade is a **schedule** that starts \(\eta\) larger for fast early progress and decays it later for a precise landing in the valley.

```python
import numpy as np

# Minimize a simple quadratic loss L(w) = (w - 3)^2, whose gradient is 2(w - 3).
def loss(w):  return (w - 3.0) ** 2
def grad(w):  return 2.0 * (w - 3.0)

def gradient_descent(w0, eta, steps):
    w = w0
    for _ in range(steps):
        w = w - eta * grad(w)        # one descent step
    return w

print(round(gradient_descent(w0=-4.0, eta=0.1, steps=50), 4))   # -> 3.0 (the minimum)
print(round(loss(gradient_descent(-4.0, 0.1, 50)), 6))          # -> ~0.0
```

## complexity
time: O(S · C) to train, where S is the number of steps and C is the cost of one gradient evaluation. With backpropagation C is the same order as a forward pass — O(P) in the parameter count P per step — so a step is O(P), not O(P²). Finite-difference descent is O(P) evaluations per step, i.e. O(P²) overall, which is why analytic gradients win.
space: O(P) to hold the parameters and their gradients; mini-batch SGD adds only the batch's activations, keeping memory independent of the full dataset size.
notes: Convergence speed depends on the learning rate and the curvature (conditioning) of the loss surface, not just on P. A poorly scaled surface (very different curvature along different axes) makes plain descent zig-zag; normalization and adaptive optimizers fix this.

## pitfalls
- Setting the learning rate too high. The single most common failure: the loss oscillates, climbs, or turns into NaN as steps overshoot the minimum and bounce up the far wall. The fix is to lower \(\eta\) (try 3–10× smaller) or add a warmup/decay schedule, not to add more steps.
- Setting the learning rate too low. Training technically descends but crawls, wasting compute and often plateauing before it reaches a good loss within your step budget. The fix is to raise \(\eta\) or use an adaptive optimizer; a learning-rate range test quickly reveals the usable band.
- Forgetting to scale or normalize features and inputs. Wildly different input magnitudes warp the loss surface into a steep, narrow valley, so descent zig-zags and needs a tiny \(\eta\) to stay stable. Standardize inputs (and use batch/layer norm inside the net) so the surface is better conditioned.
- Treating a stalled loss as a true minimum. On non-convex surfaces a flat plateau or saddle point has a near-zero gradient without being a good solution. The fix is momentum or an adaptive optimizer to power through flat regions, plus better initialization so you don't start in a dead zone.
- Reusing one fixed learning rate for the whole run. A rate that's ideal early is often too large for the precise landing late in training, leaving the loss noisy. Use a decay schedule (step, cosine, or exponential) so the steps shrink as you approach the valley.

## interviewTips
- Be able to state the update rule and justify the minus sign: \(w \leftarrow w - \eta\nabla L\). The gradient points toward steepest *ascent*, so descending means moving opposite to it. Interviewers want to hear "negative gradient = steepest descent," not a memorized formula.
- Explain what the learning rate trades off and how you'd diagnose a bad one from a loss curve: too high gives an oscillating or exploding loss, too low gives a slow, flat descent. Mention a learning-rate range test and a decay schedule as practical fixes.
- Know the batch/stochastic/mini-batch distinction and why SGD is the default: full-batch gradients are exact but expensive, single-sample gradients are cheap but noisy, mini-batches balance both and the noise helps escape shallow minima. Tie it back to why backprop makes the analytic gradient affordable.

## keyTakeaways
- Training is downhill walking on a loss surface: the gradient \(\nabla L\) points uphill (steepest ascent), so each step moves against it, \(w \leftarrow w - \eta\nabla L\), shrinking the loss.
- The learning rate \(\eta\) sets the step size and is the decisive knob: too small crawls, too large overshoots and diverges; there is a stable band you find by watching the loss curve, often with a decay schedule.
- The gradient is a *local* measurement — exact and cheap via backpropagation — but on non-convex networks it can stall in plateaus or local minima, which is why momentum, adaptive learning rates, and good initialization exist.

## code.python
```python
import numpy as np

# Loss L(w) = (w - 3)^2 with a clean analytic gradient dL/dw = 2(w - 3).
def loss(w):  return (w - 3.0) ** 2
def grad(w):  return 2.0 * (w - 3.0)

def gradient_descent(w0, eta=0.1, steps=50):
    w = w0
    history = [w]
    for _ in range(steps):
        w = w - eta * grad(w)          # step against the gradient
        history.append(w)
    return w, history

for eta in (0.01, 0.1, 1.01):
    w, _ = gradient_descent(-4.0, eta, 50)
    tag = "diverges" if abs(w) > 1e3 else f"w={w:.4f}, loss={loss(w):.5f}"
    print(f"eta={eta:<5} -> {tag}")
# eta=0.01  -> slow, not yet at 3
# eta=0.1   -> w=3.0000, loss=0.00000
# eta=1.01  -> diverges
```

## code.javascript
```javascript
const loss = (w) => (w - 3) ** 2;
const grad = (w) => 2 * (w - 3);

function gradientDescent(w0, eta = 0.1, steps = 50) {
  let w = w0;
  for (let i = 0; i < steps; i++) {
    w = w - eta * grad(w);            // step against the gradient
  }
  return w;
}

for (const eta of [0.01, 0.1, 1.01]) {
  const w = gradientDescent(-4, eta, 50);
  const tag = Math.abs(w) > 1e3 ? "diverges" : `w=${w.toFixed(4)}, loss=${loss(w).toFixed(5)}`;
  console.log(`eta=${eta} -> ${tag}`);
}
// eta=0.1 -> w=3.0000, loss=0.00000 ; eta=1.01 -> diverges
```

## code.java
```java
public class GradientDescent {
    static double loss(double w) { return (w - 3.0) * (w - 3.0); }
    static double grad(double w) { return 2.0 * (w - 3.0); }

    static double descend(double w0, double eta, int steps) {
        double w = w0;
        for (int i = 0; i < steps; i++) {
            w = w - eta * grad(w);    // step against the gradient
        }
        return w;
    }

    public static void main(String[] args) {
        double[] etas = {0.01, 0.1, 1.01};
        for (double eta : etas) {
            double w = descend(-4.0, eta, 50);
            String tag = Math.abs(w) > 1e3
                ? "diverges"
                : String.format("w=%.4f, loss=%.5f", w, loss(w));
            System.out.printf("eta=%s -> %s%n", eta, tag);
        }
        // eta=0.1 -> w=3.0000, loss=0.00000 ; eta=1.01 -> diverges
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>

double loss(double w) { return (w - 3.0) * (w - 3.0); }
double grad(double w) { return 2.0 * (w - 3.0); }

double descend(double w0, double eta, int steps) {
    double w = w0;
    for (int i = 0; i < steps; i++) {
        w = w - eta * grad(w);        // step against the gradient
    }
    return w;
}

int main() {
    double etas[] = {0.01, 0.1, 1.01};
    for (double eta : etas) {
        double w = descend(-4.0, eta, 50);
        if (std::fabs(w) > 1e3) printf("eta=%g -> diverges\n", eta);
        else printf("eta=%g -> w=%.4f, loss=%.5f\n", eta, w, loss(w));
    }
    // eta=0.1 -> w=3.0000, loss=0.00000 ; eta=1.01 -> diverges
    return 0;
}
```
