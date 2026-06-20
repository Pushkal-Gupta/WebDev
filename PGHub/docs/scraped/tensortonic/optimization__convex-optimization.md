---
source_url: https://tensortonic.com/ml-math/optimization/convex-optimization
title: Convex vs Non-Convex Optimization | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

01/09

Optimization

### Contents

IntroductionWhy Should You Care?Convex SetsConvex FunctionsInteractive: Convex vs Non-ConvexThe Hessian TestJensen's InequalityThe Convex WorldThe Non-Convex RealityWhy Deep Learning Works AnywayML Applications

## Introduction

Every optimization problem in machine learning boils down to this: you have a loss function (a landscape of mountains and valleys) and you want to find the lowest point. The question that determines everything is: _What does your landscape look like?_

If your landscape is a **bowl** (convex), there is exactly one lowest point, and no matter where you start rolling a ball, it will always end up at the bottom. Life is good.

If your landscape is an **egg crate** (non-convex), there are countless little dips and valleys. Your ball might roll into a shallow puddle and get stuck there, never finding the deep ocean trench that represents the true best solution.

#### The Core Distinction

Convex

Every local minimum IS the global minimum.

Non-Convex

Local minima can trap you far from the global best.

## Why Should You Care?

This distinction has massive practical implications:

#### Linear Regression, Logistic Regression, SVMs

These are convex problems. You are **guaranteed** to find the globally optimal solution. If two people train the same model with different initializations, they get the _exact same_ final model.

#### Neural Networks

These are non-convex. Two people training the same architecture on the same data will get _different_ models depending on random initialization. There are no guarantees.

Understanding convexity explains why SVMs were dominant in the 2000s (mathematical guarantees!) and why deep learning required tricks like careful initialization, [batch normalization](https://www.tensortonic.com/ml-math/optimization/batch-normalization), and [Adam optimizer](https://www.tensortonic.com/ml-math/optimization/adaptive-rates) to work at all.

## Convex Sets

Before we can discuss convex functions, we need to understand convex sets. This is where the geometry begins.

#### Definition: Convex Set

A set CCC is **convex** if for any two points x,y∈Cx, y \\in Cx,y∈C, the entire line segment connecting them lies within CCC.

∀λ∈\[0,1\]:λx+(1−λ)y∈C\\forall \\lambda \\in \[0,1\]: \\quad \\lambda x + (1-\\lambda)y \\in C∀λ∈\[0,1\]:λx+(1−λ)y∈C

#### Convex Sets

- Circles, spheres
- Rectangles, cubes
- Triangles (filled)
- Half-spaces
- Intersections of convex sets

#### Non-Convex Sets

- Donuts (has a hole)
- Crescent moons
- Stars
- Any shape with an "indent"
- L-shapes

#### The "Rubber Band" Test

Imagine stretching a rubber band between any two points in the set. If the rubber band ever "pokes out" of the set, it's not convex. For a convex set, the rubber band always stays inside.

## Convex Functions

A function is convex if the region above its graph is a convex set. Equivalently:

#### Definition: Convex Function

A function fff is convex if the line segment between any two points on the graph lies **above or on** the graph.

f(λx+(1−λ)y)≤λf(x)+(1−λ)f(y)f(\\lambda x + (1-\\lambda)y) \\le \\lambda f(x) + (1-\\lambda)f(y)f(λx+(1−λ)y)≤λf(x)+(1−λ)f(y)

for all x, y and lambda in \[0, 1\]

#### Convex Functions

- f(x)=x2f(x) = x^2f(x)=x2 (parabola)
- f(x)=exf(x) = e^xf(x)=ex
- f(x)=∣x∣f(x) = \|x\|f(x)=∣x∣
- f(x)=xlog⁡xf(x) = x \\log xf(x)=xlogx
- Norms: ∣∣x∣∣1,∣∣x∣∣2\|\|x\|\|\_1, \|\|x\|\|\_2∣∣x∣∣1​,∣∣x∣∣2​
- Sum of convex functions

#### Non-Convex Functions

- f(x)=sin⁡(x)f(x) = \\sin(x)f(x)=sin(x)
- f(x)=x3f(x) = x^3f(x)=x3 (cubic)
- f(x)=−x2f(x) = -x^2f(x)=−x2 (concave)
- Neural network losses
- Any function with multiple local minima

#### Strictly Convex

If the inequality is **strict** (<<< instead of ≤\\le≤), the function is _strictly convex_. This means there is exactly **one** global minimum. x2x^2x2 is strictly convex; a flat line is convex but not strictly convex.

## Interactive: Convex vs Non-Convex

Watch gradient descent navigate these two landscapes. On the convex bowl, it always finds the bottom. On the non-convex surface, it can get trapped in local minima.

### Convex vs Non-Convex Landscapes

Watch how gradient descent behaves differently on these two types of functions.

Convex (Bowl)Non-Convex (Multi-well)

Run GDReset

Global Minxf(x)

**Convex:** Only one minimum exists. GD will always find it, guaranteed.

Position

0.900

f(x)

0.810

Gradient

1.800

## The Hessian Test for Convexity

For twice-differentiable functions, there's an easy test using the [Hessian matrix](https://www.tensortonic.com/ml-math/calculus/jacobian-hessian).

#### The Second Derivative Test

A twice-differentiable function f is convex if and only if its Hessian HHH is **[Positive Semi-Definite (PSD)](https://www.tensortonic.com/ml-math/linear-algebra/positive-definite)** everywhere.

H(x)⪰0∀xH(x) \\succeq 0 \\quad \\forall xH(x)⪰0∀x

**PSD means:** All [eigenvalues](https://www.tensortonic.com/ml-math/linear-algebra/eigenvalue-eigenvector) of H are non-negative. Geometrically, the function curves "upward" (or stays flat) in every direction.

#### Example: MSE Loss for Linear Regression

Loss: L(w)=∣∣Xw−y∣∣2L(w) = \|\|Xw - y\|\|^2L(w)=∣∣Xw−y∣∣2

Hessian: H=2XTXH = 2X^TXH=2XTX

Since XTXX^TXXTX is always PSD (it's a Gram matrix), MSE loss is convex. This is why linear regression always has a unique solution.

## Jensen's Inequality

This inequality is a direct consequence of convexity and appears throughout ML, especially in variational inference and the EM algorithm.

#### Jensen's Inequality

For a convex function f and a random variable X:

f(E\[X\])≤E\[f(X)\]f(E\[X\]) \\le E\[f(X)\]f(E\[X\])≤E\[f(X)\]

"The function of the mean is at most the mean of the function."

#### Worked Example

Let f(x)=x2f(x) = x^2f(x)=x2 (convex). Let X take values -2 and +2 with equal probability.

Left side: f(E\[X\])

E\[X\] = 0, so f(0) = 0

Right side: E\[f(X)\]

E\[X^2\] = (4 + 4)/2 = 4

0 <= 4\. Jensen's inequality holds.

#### Why Jensen Matters in ML

In Variational Autoencoders (VAEs), we can't compute log⁡p(x)\\log p(x)logp(x) directly. Jensen's inequality lets us construct the ELBO (Evidence Lower Bound), a tractable lower bound we can maximize instead. The entire VAE framework rests on Jensen.

## The Convex World: Where Life is Good

In convex optimization, you have mathematical guarantees that would make any theorist weep with joy:

#### Guarantee \#1: Local = Global

Any local minimum is automatically the global minimum. No need to restart with different initializations.

#### Guarantee \#2: Efficient Algorithms

Convex problems can be solved in polynomial time with proven convergence rates.

#### Guarantee \#3: Duality

Strong duality holds. The [dual problem](https://www.tensortonic.com/ml-math/optimization/lagrange-multipliers) has the same optimal value.

#### Convex ML Models

Linear Regression

MSE loss is quadratic (convex)

Logistic Regression

[Cross-entropy](https://www.tensortonic.com/ml-math/information-theory/cross-entropy) loss is convex

Support Vector Machines

Hinge loss is convex

[Ridge/Lasso](https://www.tensortonic.com/ml-math/optimization/regularization) Regression

Convex loss + convex penalty

## The Non-Convex Reality: Deep Learning's Jungle

Neural networks are non-convex. The moment you compose linear transformations with nonlinear activations (ReLU, Sigmoid, etc.), convexity is destroyed.

#### The Hazards

- **Local Minima:** Valleys that aren't the deepest. Getting stuck here means a suboptimal model.
- **[Saddle Points](https://www.tensortonic.com/ml-math/calculus/local-vs-saddle):** Points where gradient = 0, but they're not minima. Far more common than local minima in high dimensions.
- **Plateaus:** Vast flat regions where gradients are tiny. Training stalls for thousands of steps.
- **Ill-Conditioning:** Loss landscapes that are steep in some directions and flat in others, causing oscillation.

#### Why Neural Networks are Non-Convex

Consider a simple 2-layer network: f(x)=W2σ(W1x)f(x) = W\_2 \\sigma(W\_1 x)f(x)=W2​σ(W1​x)

- **Activation Curvature:** The nonlinear σ\\sigmaσ bends the function.
- **Weight Products:** W2W1W\_2 W\_1W2​W1​ creates hyperbolic valleys.
- **Symmetry:** Swapping neurons gives identical outputs (multiple minima).

### Loss Landscape

Layer InteractionNeuron Symmetry

Visualizing L(win,wout)L(w\_{in}, w\_{out})L(win​,wout​). Notice the symmetry: (w,−w)(w, -w)(w,−w) works same as (−w,w)(-w, w)(−w,w).

w\_in

w\_out

### Function Approximation

Target Data

Model Prediction

Current Loss:0.1671

Parameters:w\_in=1.00, w\_out=1.00

## Why Deep Learning Works Anyway

If non-convex optimization is so hard (NP-hard in the worst case), why do neural networks train at all? This was one of the big mysteries of the 2010s deep learning revolution.

#### Insight \#1: High Dimensionality is a Blessing

Most critical points in deep learning are [saddle points](https://www.tensortonic.com/ml-math/calculus/local-vs-saddle), not local minima. And saddle points can be escaped.

#### Insight \#2: Local Minima Are Often Good Enough

Most local minima have loss values very close to the global minimum. The "bad" local minima are rare.

#### Insight \#3: Over-Parameterization Creates Easy Paths

Solutions form connected valleys (mode connectivity), and gradient descent can easily slide along them.

#### Insight \#4: [SGD](https://www.tensortonic.com/ml-math/optimization/sgd-variants) Noise Helps

The stochastic noise from mini-batch gradients can shake the optimizer out of shallow local minima.

## Practical ML Implications

#### When to Choose Convex Models

If interpretability and guaranteed convergence matter, consider logistic regression, SVMs, or linear models.

#### Surviving Non-Convex Training

- Xavier/He initialization
- [Batch normalization](https://www.tensortonic.com/ml-math/optimization/batch-normalization)
- Skip connections (ResNets)
- [Momentum](https://www.tensortonic.com/ml-math/optimization/momentum-nesterov)

#### The Convex Relaxation Trick

"Relax" a non-convex problem into a convex one, solve that, then round back. Used in L1 relaxation of L0.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept