---
source_url: https://tensortonic.com/ml-math/calculus/chain-rule
title: The Chain Rule: Backbone of Backpropagation | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

03/09

Calculus

### Contents

IntroductionThe Gear System IntuitionSingle Variable Chain RuleInteractive: Chain RuleComputational GraphsMultivariable Chain RuleBackpropagationVanishing GradientsML Applications

## Introduction

In calculus, we learn rules for basic derivatives: the power rule (xn→nxn−1x^n \\to nx^{n-1}xn→nxn−1), the sum rule, the product rule. But real-world functions are rarely simple. They are **compositions** of functions nested inside one another.

A neural network is not y=mx+by = mx + by=mx+b. It is y=f(g(h(k(x))))y = f(g(h(k(x))))y=f(g(h(k(x)))), where f, g, h, k are layers of weights and activation functions. If we want to train this network, we need to compute: _"How does changing a weight deep inside affect the final output?"_

#### The Chain Rule in One Sentence

To find the derivative of a composition, multiply the derivatives of each step.

## The Gear System Intuition

Imagine three interconnected gears: A drives B, B drives C.

A

drives

B

drives

C

- If Gear A turns 1 rotation, Gear B turns 2 rotations. (Rate: dB/dA = 2)
- If Gear B turns 1 rotation, Gear C turns 3 rotations. (Rate: dC/dB = 3)

Question: How much does C turn when A turns 1 rotation?

Answer: Rate(A to C) = Rate(A to B) \* Rate(B to C) = 2 \* 3 = 6

This is the chain rule: **multiply the local rates to get the global rate**.

## Single Variable Chain Rule

If y is a function of u, and u is a function of x (i.e., y=f(g(x))y = f(g(x))y=f(g(x))), then:

dydx=dydu⋅dudx\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}dxdy​=dudy​⋅dxdu​

In function notation: ddx\[f(g(x))\]=f′(g(x))⋅g′(x)\\frac{d}{dx}\[f(g(x))\] = f'(g(x)) \\cdot g'(x)dxd​\[f(g(x))\]=f′(g(x))⋅g′(x)

#### The "Onion Peeling" Method

Let y=(3x+1)2y = (3x + 1)^2y=(3x+1)2. Find dy/dx.

Step 1: Identify outer and inner

Outer: u2u^2u2. Inner: u=3x+1u = 3x + 1u=3x+1

Step 2: Differentiate outer (keep inner intact)

dydu=2u=2(3x+1)\\frac{dy}{du} = 2u = 2(3x+1)dudy​=2u=2(3x+1)

Step 3: Differentiate inner

dudx=3\\frac{du}{dx} = 3dxdu​=3

Step 4: Multiply

dydx=2(3x+1)⋅3=6(3x+1)\\frac{dy}{dx} = 2(3x+1) \\cdot 3 = 6(3x+1)dxdy​=2(3x+1)⋅3=6(3x+1)

## Interactive: Chain Rule

Watch the chain rule in action. We compute the derivative by propagating gradients backward through the computation graph.

### Chain Rule Calculator

Computing \racdydx\rac{dy}{dx}\racdydx for y=(x+2)2y=(x+2)^2y=(x+2)2.

x = 1.0

+2(·)²x1.0u3.0x+2y9.00u²

Forward PassOuter DerivativeInner DerivativeChain Rule

#### Start: Forward Pass

Compute values from input to output.

x=1.0→u=1.0+2=3.0→y=3.02=9.00x = 1.0 \\to u = 1.0+2 = 3.0 \\to y = 3.0^2 = 9.00x=1.0→u=1.0+2=3.0→y=3.02=9.00

## Computational Graphs

Modern deep learning frameworks (PyTorch, TensorFlow) represent computations as **directed acyclic graphs (DAGs)**. Each node is an operation, each edge carries data. You can learn more about this in our [Computational Graphs](https://www.tensortonic.com/ml-math/graph-theory/computational-graphs) blog.

#### Example: f(x, y, z) = (x + y) \* z

We break this into intermediate steps:

- q = x + y
- f = q \* z

x, ythenq = x+ythenf = q\*zwithz

#### Forward Pass

Compute values left-to-right. Store intermediate results at each node.

#### Backward Pass

Compute gradients right-to-left. Multiply local gradients using chain rule.

## Multivariable Chain Rule

In ML, a variable often influences the output through **multiple paths**. For example, an input feature might feed into multiple neurons.

If f depends on u and v, and both depend on x:

dfdx=∂f∂ududx+∂f∂vdvdx\\frac{df}{dx} = \\frac{\\partial f}{\\partial u}\\frac{du}{dx} + \\frac{\\partial f}{\\partial v}\\frac{dv}{dx}dxdf​=∂u∂f​dxdu​+∂v∂f​dxdv​

Sum the gradients over ALL paths from x to f.

#### The River Delta Analogy

If you dump dye into a river (x), and the river splits into two streams (u and v) before joining into a lake (f), the total dye in the lake depends on flow through **both** streams. You must add up contributions from all paths.

## Backpropagation

Backpropagation is simply the recursive application of the chain rule, starting from the loss function and moving backward to the weights. For a hands-on walkthrough, see our [Backpropagation & Gradient Descent](https://www.tensortonic.com/ml-math/calculus/backpropagation) guide.

#### Single Neuron Example

Consider: z=wx+bz = wx + bz=wx+b, a=σ(z)a = \\sigma(z)a=σ(z), L=(a−y)2L = (a - y)^2L=(a−y)2

We want ∂L∂w\\frac{\\partial L}{\\partial w}∂w∂L​ to update the weight.

1

∂L∂a=2(a−y)\\frac{\\partial L}{\\partial a} = 2(a - y)∂a∂L​=2(a−y)

2

∂a∂z=σ′(z)=a(1−a)\\frac{\\partial a}{\\partial z} = \\sigma'(z) = a(1-a)∂z∂a​=σ′(z)=a(1−a)

3

∂z∂w=x\\frac{\\partial z}{\\partial w} = x∂w∂z​=x

The Chain

∂L∂w=∂L∂a⋅∂a∂z⋅∂z∂w\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial a} \\cdot \\frac{\\partial a}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}∂w∂L​=∂a∂L​⋅∂z∂a​⋅∂w∂z​

## The Vanishing Gradient Problem

The chain rule reveals a critical vulnerability in deep networks. When we compute gradients through many layers, we multiply many terms together. This multiplication can cause gradients to shrink (vanish) or grow (explode) exponentially.

#### The Mathematics

For a network with n layers, the gradient of the loss with respect to early layer weights involves:

∂L∂w1=∂L∂an⋅∂an∂zn⋅∂zn∂an−1⋯∂a1∂z1⋅∂z1∂w1\\frac{\\partial L}{\\partial w\_1} = \\frac{\\partial L}{\\partial a\_n} \\cdot \\frac{\\partial a\_n}{\\partial z\_n} \\cdot \\frac{\\partial z\_n}{\\partial a\_{n-1}} \\cdots \\frac{\\partial a\_1}{\\partial z\_1} \\cdot \\frac{\\partial z\_1}{\\partial w\_1}∂w1​∂L​=∂an​∂L​⋅∂zn​∂an​​⋅∂an−1​∂zn​​⋯∂z1​∂a1​​⋅∂w1​∂z1​​

The terms ∂ai∂zi\\frac{\\partial a\_i}{\\partial z\_i}∂zi​∂ai​​ are the activation function derivatives. For Sigmoid, the maximum is 0.25.

#### Why Sigmoid Causes Vanishing Gradients

The Sigmoid function σ(z)=11+e−z\\sigma(z) = \\frac{1}{1+e^{-z}}σ(z)=1+e−z1​ has derivative σ′(z)=σ(z)(1−σ(z))\\sigma'(z) = \\sigma(z)(1-\\sigma(z))σ′(z)=σ(z)(1−σ(z)).

Maximum derivative occurs at z=0: σ′(0)=0.5×0.5=0.25\\sigma'(0) = 0.5 \\times 0.5 = 0.25σ′(0)=0.5×0.5=0.25

After n layers:

0.255=0.000980.2510=9.5×10−70.25^5 = 0.00098 \\quad 0.25^{10} = 9.5 \\times 10^{-7}0.255=0.000980.2510=9.5×10−7

### Gradient Flow Visualization

Simulating backward propagation. See mathematical decay/explosion.

SigmoidReLURNN

PROPAGATE

Input

L1

L2

L3

L4

L5

Loss

∇: 1.0000

#### Current Chain Calculation

Click Propagate to start

#### Sigmoid (Vanishing)

Sigmoid derivative max is 0.25 (at z=0). Gradient shrinks by 75% at every layer.

Input LayerLoss

#### Vanishing Gradients

Product of small numbers goes to 0. Early layers stop learning because they receive near-zero gradients.

Common with Sigmoid/Tanh activations.

#### Exploding Gradients

Product of numbers > 1 grows exponentially. Weights become NaN and training fails.

Common in RNNs with long sequences.

#### Solutions

ReLU Activation

Derivative is 0 or 1. No multiplication decay when active.

Residual Connections

Skip connections create gradient "highways" bypassing layers.

Batch Normalization

Normalizes activations, keeping gradients in a healthy range.

Gradient Clipping

Caps gradient magnitude to prevent explosion (used in RNNs).

## ML Applications

#### Automatic Differentiation

PyTorch and TensorFlow use reverse-mode autodiff: build the graph forward, then traverse backward multiplying gradients. This is exactly the chain rule automated. One backward pass computes gradients for all parameters.

#### Matrix Calculus

In vector/matrix operations, the chain rule becomes Jacobian-vector products. For a layer Y = XW, we get ∂L∂W=XT∂L∂Y\\frac{\\partial L}{\\partial W} = X^T \\frac{\\partial L}{\\partial Y}∂W∂L​=XT∂Y∂L​. This is the chain rule in matrix form.

#### LSTM/GRU Gates

Long Short-Term Memory networks use gating mechanisms specifically designed to create "gradient highways" that allow gradients to flow across many time steps without vanishing.

#### Gradient Checkpointing

To save memory, we can recompute forward activations during the backward pass instead of storing them all. This trades compute for memory, enabled by the modular nature of the chain rule.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept