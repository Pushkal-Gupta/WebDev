---
source_url: https://tensortonic.com/ml-math/optimization/momentum-nesterov
title: Momentum & Nesterov Accelerated Gradient | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

03/09

Optimization

### Contents

IntroductionThe SGD Problem: RavinesPhysics of MomentumClassical MomentumInteractive: SGD vs MomentumHow Momentum Kills OscillationsNesterov AccelerationNesterov's LookaheadTuning BetaInteractive: Beta TuningConvergence RatesPractical Guidance

## Introduction

Vanilla [gradient descent](https://www.tensortonic.com/ml-math/calculus/backpropagation) is memoryless. Each step, it looks at the current gradient, takes a step, and immediately forgets everything. It doesn't know if it's been heading in the same direction for 1000 iterations or if it just turned around.

This causes two major problems:

#### Oscillation

In narrow valleys (ravines), SGD bounces back and forth between steep walls, wasting computation.

#### Slow Progress

Along flat directions, gradients are tiny. SGD crawls, never building up speed.

### The Solution

**Momentum** solves both by giving the optimizer memory. **Nesterov** improves it further by adding foresight.

## The SGD Problem: Ravines

Real [loss surfaces](https://www.tensortonic.com/ml-math/optimization/loss-landscapes) aren't perfect spherical bowls. They're often **ravines**: elongated valleys where the surface curves sharply in one direction and gently in another.

#### The Ravine Scenario

Consider f(x,y)=x2+10y2f(x,y) = x^2 + 10y^2f(x,y)=x2+10y2. The y-direction has 10× steeper curvature than x.

Y-Direction (Steep Walls)

Gradient = 20y (HUGE)

SGD takes big steps, overshoots, bounces back

X-Direction (Gentle Floor)

Gradient = 2x (small)

SGD takes tiny steps, makes slow progress

#### The Result

SGD zigzags wildly across the ravine (y-direction) while creeping along the floor (x-direction). Most computation is wasted on oscillations, not progress toward the minimum.

## Physics of Momentum

The fix comes from physics. Standard [SGD](https://www.tensortonic.com/ml-math/optimization/sgd-variants) treats the optimization variable like a massless particle: apply a force (gradient), it moves instantly; remove the force, it stops instantly.

**Momentum** treats it like a heavy ball rolling down a hill. The ball has _inertia_. Once it's moving, it tends to keep moving in the same direction, even if the local slope changes.

#### Velocity vvv

The ball doesn't move based on current gradient alone; it moves based on **accumulated velocity**. The gradient is just a force that changes that velocity.

#### Friction β\\betaβ

Without friction, the ball would oscillate forever in a bowl. We need a decay factor (like air resistance) so the ball eventually stops at the bottom.

## Classical Momentum

Instead of updating weights directly with the gradient, we update a velocity vector:

Velocity Update

vt+1=βvt+η∇L(θt)v\_{t+1} = \\beta v\_t + \\eta \\nabla L(\\theta\_t)vt+1​=βvt​+η∇L(θt​)

Parameter Update

θt+1=θt−vt+1\\theta\_{t+1} = \\theta\_t - v\_{t+1}θt+1​=θt​−vt+1​

#### β\\betaβ

Momentum coefficient (typically 0.9). Controls how much "memory" we keep.

#### η\\etaη

Learning rate.

#### vtv\_tvt​

Velocity at step t. An exponential moving average of past gradients.

#### Exponential Moving Average

With β=0.9\\beta = 0.9β=0.9, the velocity roughly averages the last 1/(1−0.9)=101/(1-0.9) = 101/(1−0.9)=10 gradients. Recent gradients matter most; ancient history fades.

## Interactive: SGD vs Momentum

Watch the optimizers navigate a ravine. Notice how [SGD](https://www.tensortonic.com/ml-math/optimization/sgd-variants) oscillates wildly while momentum methods smooth out the path.

### Optimizer Race

Comparing trajectories. SGD struggles; Momentum accelerates.

Start RaceReset

Steps: 0

#### Live Performance

SGD

Loss:36.84000

Momentum

Loss:36.84000

Nesterov

Loss:36.84000

## How Momentum Kills Oscillations

In a ravine, gradients alternate: left wall → right wall → left wall. Without momentum, SGD follows each gradient blindly, bouncing forever.

#### With Momentum

When gradients point left-right-left-right, they **cancel out** in the velocity. The y-component of velocity shrinks to near zero.

Meanwhile, the x-component (along the valley floor) doesn't cancel. It accumulates! The optimizer builds up speed in the consistent direction and ignores the oscillations.

This is exactly like a car's shock absorbers: they damp out high-frequency bumps while preserving the smooth, long-term trajectory.

## Nesterov Acceleration

Classical momentum has a subtle problem: it's reactive. It computes the gradient at the current position, then applies momentum. But we're about to move due to momentum anyway. Why not look ahead first?

Lookahead Position

θ~t=θt−βvt\\tilde{\\theta}\_t = \\theta\_t - \\beta v\_tθ~t​=θt​−βvt​

Velocity Update (at lookahead)

vt+1=βvt+η∇L(θ~t)v\_{t+1} = \\beta v\_t + \\eta \\nabla L(\\tilde{\\theta}\_t)vt+1​=βvt​+η∇L(θ~t​)

Parameter Update

θt+1=θt−vt+1\\theta\_{t+1} = \\theta\_t - v\_{t+1}θt+1​=θt​−vt+1​

We compute the gradient not at θt\\theta\_tθt​, but at the "lookahead" position θ~t\\tilde{\\theta}\_tθ~t​ where momentum would take us. This gives Nesterov its predictive power.

## Nesterov's Lookahead

#### Classical Momentum

1\. Look at current gradient

2\. Update velocity

3\. Move

Reactive: responds after the fact

#### Nesterov

1\. Jump ahead (momentum)

2\. Look at gradient there

3\. Correct the jump

Proactive: anticipates the future

#### Why This Helps

If momentum is about to overshoot, the gradient at the lookahead position will point backward, "correcting" the momentum before it's too late. Nesterov catches mistakes earlier, leading to faster convergence.

## Tuning Beta

Beta (β\\betaβ) controls the momentum strength. Higher β = more memory, slower decay.

#### β = 0

No momentum. Just vanilla SGD. Forgets everything instantly.

#### β = 0.9

Standard choice. Averages ~10 past gradients. Good for most problems.

#### β = 0.99

High momentum. Averages ~100 gradients. Very smooth, can overshoot.

## Interactive: Beta Tuning

Explore how β affects velocity decay and memory. Adjust the slider to see the trade-offs.

### Momentum Coefficient (β) Tuning

See how β affects velocity decay. Higher β = more memory, slower decay.

β (Momentum Coefficient): 0.90

0 (No momentum)0.99 (Very strong)

Half-life: 6.6 steps1.00.0Time Steps →Velocity

Half-life

6.6

steps

Effective Window

10.0

gradients

After 20 steps

12.2%

remaining

#### Interpretation

**β = 0.90:** Velocity decays by 10.0% per step.

High β (0.9): Standard choice. Smooth optimization with good momentum.

## Convergence Rates

For smooth convex functions, provable convergence rates (how fast loss decreases):

SGD (no momentum)O(1/t)O(1/t)O(1/t)

MomentumO(1/t)O(1/t)O(1/t)

NesterovO(1/t2)O(1/t^2)O(1/t2)

#### Nesterov is Provably Optimal

For smooth convex functions, O(1/t2)O(1/t^2)O(1/t2) is the _best possible_ rate using only gradient information. Nesterov proved this in 1983 and showed his method achieves it. No first-order method can do better.

## Practical Guidance

#### When to Use Momentum

- Almost always. There's rarely a reason to use vanilla [SGD](https://www.tensortonic.com/ml-math/optimization/sgd-variants).
- Computer Vision: SGD + Momentum often generalizes better than [Adam](https://www.tensortonic.com/ml-math/optimization/adaptive-rates).
- If training is too noisy, try lower beta (0.5-0.8).

#### Nesterov vs Vanilla Momentum

- Nesterov is usually better or equal. Use it by default.
- In PyTorch: `optimizer = SGD(..., nesterov=True)`
- The improvement is more noticeable in convex/near-convex problems.

#### Momentum vs Adam

This is a hot debate. [Adam](https://www.tensortonic.com/ml-math/optimization/adaptive-rates) converges faster early in training, but SGD+Momentum often finds [flatter minima](https://www.tensortonic.com/ml-math/optimization/loss-landscapes) that generalize better. Many vision papers use SGD+Momentum for final results, even if they prototype with Adam.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept