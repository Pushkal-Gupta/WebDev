---
source_url: https://tensortonic.com/ml-math/calculus/backpropagation
title: Backpropagation & Gradient Descent: Complete Tutorial | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

08/08

Calculus

### Contents

IntroductionThe Setup: A Single NeuronForward PassBackward PassChain Rule in ActionGradient DescentInteractive: Learning RateLearning Rate AnalysisGD VariantsConvergence ConditionsML Applications

## Introduction

In PyTorch or TensorFlow, you call `.backward()` and gradients magically appear. But to truly understand optimization, you must be able to derive gradients by hand for simple networks.

This is the ultimate test of your understanding of the [chain rule](https://www.tensortonic.com/ml-math/calculus/chain-rule) and [partial derivatives](https://www.tensortonic.com/ml-math/calculus/partial-derivatives). We will dissect a single neuron with Sigmoid activation and MSE loss, then learn how to use those gradients for optimization.

#### What We'll Learn

**Part 1: Backpropagation**

Compute ∂L∂w\\frac{\\partial L}{\\partial w}∂w∂L​ and ∂L∂b\\frac{\\partial L}{\\partial b}∂b∂L​ by hand

**Part 2: Gradient Descent**

Use gradients to iteratively minimize loss

## The Setup: A Single Neuron

We define a computational graph with input x, weight w, bias b, and target y\_true.

#### Variables

x=2.0x = 2.0x=2.0 (Input)

w=3.0w = 3.0w=3.0 (Weight)

b=1.0b = 1.0b=1.0 (Bias)

ytrue=1.0y\_{true} = 1.0ytrue​=1.0 (Target)

#### Functions

**Linear:** z=wx+bz = wx + bz=wx+b

**Activation:** a=σ(z)=11+e−za = \\sigma(z) = \\frac{1}{1+e^{-z}}a=σ(z)=1+e−z1​

**Loss:** L=(a−y)2L = (a - y)^2L=(a−y)2

#### Computation Graph

x, w, b

→

z = wx + b

→

a = σ(z)

→

L = (a-y)²

## Forward Pass

Calculate values from input to output:

1\. Linear Combination

z=(3.0)(2.0)+1.0=7.0z = (3.0)(2.0) + 1.0 = 7.0z=(3.0)(2.0)+1.0=7.0

2\. Sigmoid Activation

a=σ(7.0)=11+e−7≈0.999089a = \\sigma(7.0) = \\frac{1}{1+e^{-7}} \\approx 0.999089a=σ(7.0)=1+e−71​≈0.999089

3\. MSE Loss

L=(0.999089−1.0)2≈8.3×10−7L = (0.999089 - 1.0)^2 \\approx 8.3 \\times 10^{-7}L=(0.999089−1.0)2≈8.3×10−7

## Backward Pass (Backpropagation)

We want ∂L∂w\\frac{\\partial L}{\\partial w}∂w∂L​ and ∂L∂b\\frac{\\partial L}{\\partial b}∂b∂L​. We can't jump directly; we must use the chain rule:

∂L∂w=∂L∂a⋅∂a∂z⋅∂z∂w\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial a} \\cdot \\frac{\\partial a}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}∂w∂L​=∂a∂L​⋅∂z∂a​⋅∂w∂z​

#### Part A: Loss w.r.t Activation

Function: L=(a−y)2L = (a - y)^2L=(a−y)2

∂L∂a=2(a−y)=2(0.999089−1.0)=−0.001822\\frac{\\partial L}{\\partial a} = 2(a - y) = 2(0.999089 - 1.0) = -0.001822∂a∂L​=2(a−y)=2(0.999089−1.0)=−0.001822

#### Part B: Activation w.r.t Linear

Sigmoid derivative: σ′(z)=σ(z)(1−σ(z))=a(1−a)\\sigma'(z) = \\sigma(z)(1-\\sigma(z)) = a(1-a)σ′(z)=σ(z)(1−σ(z))=a(1−a)

∂a∂z=0.999089(1−0.999089)≈0.000910\\frac{\\partial a}{\\partial z} = 0.999089(1-0.999089) \\approx 0.000910∂z∂a​=0.999089(1−0.999089)≈0.000910

#### Part C: Linear w.r.t Weight

Function: z=wx+bz = wx + bz=wx+b

∂z∂w=x=2.0\\frac{\\partial z}{\\partial w} = x = 2.0∂w∂z​=x=2.0

## Chain Rule in Action

Now multiply all the local gradients together:

#### Gradient for Weight (w)

∂L∂w=(−0.001822)×(0.000910)×(2.0)\\frac{\\partial L}{\\partial w} = (-0.001822) \\times (0.000910) \\times (2.0)∂w∂L​=(−0.001822)×(0.000910)×(2.0)

∂L∂w≈−3.316×10−6\\frac{\\partial L}{\\partial w} \\approx -3.316 \\times 10^{-6}∂w∂L​≈−3.316×10−6

#### Gradient for Bias (b)

Note: ∂z∂b=1\\frac{\\partial z}{\\partial b} = 1∂b∂z​=1

∂L∂b=(−0.001822)×(0.000910)×(1)\\frac{\\partial L}{\\partial b} = (-0.001822) \\times (0.000910) \\times (1)∂b∂L​=(−0.001822)×(0.000910)×(1)

∂L∂b≈−1.658×10−6\\frac{\\partial L}{\\partial b} \\approx -1.658 \\times 10^{-6}∂b∂L​≈−1.658×10−6

#### Why So Small?

The gradients are tiny because the prediction (0.999) is very close to the target (1.0), so the loss is already nearly minimized. Also, Sigmoid at z=7 has a very small derivative (0.0009) due to saturation.

## Gradient Descent: Using the Gradients

Now that we know how to compute gradients, we need to know what to do with them. **Gradient Descent** is the optimization algorithm that uses gradients to iteratively update parameters, minimizing the loss function.

#### The Core Idea

Start somewhere. Look at the slope. Take a small step downhill. Repeat until you reach the bottom.

#### The Blindfolded Hiker Analogy

1

Feel the Ground

Use your feet to determine which direction is "downhill." (Compute gradient)

2

Take a Step

Move in the downhill direction. Step size depends on confidence. (Update parameters)

3

Repeat

Keep going until the ground feels flat (gradient near 0). You've reached a minimum.

### The Update Rule

Let J(θ)J(\\theta)J(θ) be our loss function, where θ\\thetaθ represents all model parameters:

θnew=θold−α∇J(θold)\\theta\_{new} = \\theta\_{old} - \\alpha \\nabla J(\\theta\_{old})θnew​=θold​−α∇J(θold​)

#### θ\\thetaθ

Parameters we're optimizing (weights, biases). Could be millions of values.

#### α\\alphaα

Learning rate. A hyperparameter controlling step size. Critical to get right.

#### ∇J\\nabla J∇J

Gradient vector. Points toward steepest _ascent_. Hence the minus sign.

#### Why Subtract the Gradient?

The gradient ∇J(θ)\\nabla J(\\theta)∇J(θ) points in the direction of steepest **increase**. Since we want to **minimize** loss (go downhill), we move in the **opposite** direction. If we added the gradient, we'd be doing gradient _ascent_.

## Interactive: Learning Rate Effects

Experiment with different learning rates. Watch how too small leads to slow convergence, too large leads to divergence, and just right leads to smooth optimization.

### Gradient Descent Optimization

Minimize f(x)=x2f(x) = x^2f(x)=x2. Adjust the learning rate to see convergence vs divergence.

AUTO RUNSTEPRESET

Parameter θ (x)Loss J(θ)

#### OPTIMIZING

Taking steps downhill...

Learning Rate α\\alphaα0.10

SlowOptimalExplosive

Current x4.000

Gradient ∇8.000

Loss16.0000

Next Step-0.800

Update Rule

xnew=4.00−0.1(8.00)x\_{new} = 4.00 - 0.1 (8.00)xnew​=4.00−0.1(8.00)

## Learning Rate Analysis

The learning rate α\\alphaα is the most critical hyperparameter.

#### Too Small

Training takes forever. Model might get stuck in local minima early.

Symptoms: Loss decreases very slowly over thousands of epochs.

#### Just Right

Loss decreases steadily and plateaus at minimum. Efficient convergence.

Strategy: Often use learning rate decay (start high, decrease).

#### Too Large

Loss oscillates or explodes to infinity/NaN. You overshoot the valley.

Symptoms: Loss goes up, NaN values, training crashes.

#### Learning Rate Schedules

- **Step Decay:** Reduce LR by factor every N epochs (e.g., halve every 30 epochs)
- **Exponential Decay:** αt=α0⋅e−kt\\alpha\_t = \\alpha\_0 \\cdot e^{-kt}αt​=α0​⋅e−kt
- **Cosine Annealing:** Smoothly decrease to near-zero following cosine curve
- **Warmup:** Start very small, increase, then decay. Helps with large batches.

## Gradient Descent Variants

How much data do we use to compute each gradient update?

#### Batch Gradient Descent

Use **ALL** training examples for **ONE** update.

\+ Stable, true gradient\- Slow, memory intensive

#### Stochastic Gradient Descent (SGD)

Use **ONE** random example for **ONE** update.

\+ Fast, can escape local minima via noise\- Very noisy, unstable path

#### Mini-Batch Gradient Descent (Standard)

Use a **small batch** (32, 64, 128) of examples.

\+ Best of both worlds\+ GPU-friendly (matrix ops)

This is what everyone uses in practice.

## Convergence Conditions

When does gradient descent actually find the minimum?

#### Guarantees for Convex Functions

If J(θ)J(\\theta)J(θ) is convex (bowl-shaped), gradient descent with appropriate learning rate is **guaranteed** to find the global minimum.

Convex

Linear regression, logistic regression. Single global minimum.

Non-Convex

Neural networks. Many local minima, saddle points. No guarantee.

#### The Surprising Success of Deep Learning

Despite non-convexity, deep networks train well because: (1) local minima in high dimensions are often nearly as good as global minima, (2) SGD noise helps escape bad minima, (3) over-parameterization creates many good solutions.

## ML Applications

#### Momentum

Instead of using only the current gradient, accumulate a "velocity" term: vt=βvt−1+∇Jv\_t = \\beta v\_{t-1} + \\nabla Jvt​=βvt−1​+∇J. Helps power through saddle points and noisy regions.

#### Adam Optimizer

Combines momentum with adaptive learning rates per parameter. Maintains running averages of both first and second moments of gradients. The default choice for most deep learning.

#### Gradient Clipping

When gradients explode (common in RNNs), clip them to a maximum norm. Prevents weight updates from being too large and destabilizing training.

#### Learning Rate Finder

Technique from fast.ai: gradually increase LR during one epoch, plot loss vs LR. The optimal LR is usually where loss decreases fastest, just before it explodes.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept