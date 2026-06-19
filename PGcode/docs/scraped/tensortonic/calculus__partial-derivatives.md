---
source_url: https://tensortonic.com/ml-math/calculus/partial-derivatives
title: Partial Derivatives & Gradients for Machine Learning | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

02/09

Calculus

### Contents

IntroductionFormal DefinitionNotation & ComputationGeometric IntuitionThe Gradient VectorInteractive: GradientDirectional DerivativesHigher-Order PartialsML Applications

## Introduction

In single-variable calculus, the derivative dydx\\frac{dy}{dx}dxdy​ tells us the rate of change of y with respect to x. But neural networks have **millions** of parameters. A loss function might depend on weights w1,w2,…,w1000000w\_1, w\_2, \\ldots, w\_{1000000}w1​,w2​,…,w1000000​.

We can't simply ask "what's the slope?" because the function slopes differently in every direction. Instead, we ask: _"How does the output change if I wiggle just **one** input while holding all others constant?"_

#### Why Partial Derivatives Matter

- **Gradient Descent:** The gradient is a vector of partial derivatives.
- **Backpropagation:** Computing partials for every weight in a neural network.
- **Optimization:** Finding which direction reduces loss the most.
- **Sensitivity Analysis:** Which inputs affect outputs the most?

## Formal Definition

Let f(x,y)f(x, y)f(x,y) be a function of two variables. The **partial derivative** with respect to x is:

∂f∂x=lim⁡h→0f(x+h,y)−f(x,y)h\\frac{\\partial f}{\\partial x} = \\lim\_{h \\to 0} \\frac{f(x+h, y) - f(x, y)}{h}∂x∂f​=limh→0​hf(x+h,y)−f(x,y)​

Note the ∂\\partial∂ symbol (partial) instead of d. This explicitly indicates that y is held constant.

Similarly, the partial with respect to y is:

∂f∂y=lim⁡h→0f(x,y+h)−f(x,y)h\\frac{\\partial f}{\\partial y} = \\lim\_{h \\to 0} \\frac{f(x, y+h) - f(x, y)}{h}∂y∂f​=limh→0​hf(x,y+h)−f(x,y)​

#### The Key Insight

When computing ∂f∂x\\frac{\\partial f}{\\partial x}∂x∂f​, treat y as if it were a constant number (like 5 or pi). Then differentiate with respect to x using your normal single-variable rules.

## Notation & Computation

Several notations are used for partial derivatives:

∂f∂x\\frac{\\partial f}{\\partial x}∂x∂f​

Leibniz

fxf\_xfx​

Subscript

∂xf\\partial\_x f∂x​f

Operator

DxfD\_x fDx​f

D-notation

#### Worked Example

Let f(x,y)=x2y+3y3+5f(x, y) = x^2 y + 3y^3 + 5f(x,y)=x2y+3y3+5. Find all partial derivatives.

Partial with respect to x:

Treat y as constant:

∂f∂x=2xy+0+0=2xy\\frac{\\partial f}{\\partial x} = 2xy + 0 + 0 = 2xy∂x∂f​=2xy+0+0=2xy

Partial with respect to y:

Treat x as constant:

∂f∂y=x2+9y2+0=x2+9y2\\frac{\\partial f}{\\partial y} = x^2 + 9y^2 + 0 = x^2 + 9y^2∂y∂f​=x2+9y2+0=x2+9y2

## Geometric Intuition

Consider a 3D surface z=f(x,y)z = f(x, y)z=f(x,y) representing a landscape with hills and valleys. Standing at a point (x, y), you can walk in infinitely many directions.

#### Slicing the Surface

When we compute ∂f∂x\\frac{\\partial f}{\\partial x}∂x∂f​, we "slice" the 3D surface with a vertical plane where y = constant.

This slice creates a 2D curve. The partial derivative is the slope of this curve at our point.

#### Walking East-West

∂f∂x\\frac{\\partial f}{\\partial x}∂x∂f​ tells you the slope if you walk strictly in the x-direction (East-West).

∂f∂y\\frac{\\partial f}{\\partial y}∂y∂f​ tells you the slope if you walk strictly in the y-direction (North-South).

## The Gradient Vector

The **gradient** collects all partial derivatives into a single vector. For a function f:Rn→Rf: \\mathbb{R}^n \\to \\mathbb{R}f:Rn→R:

∇f=\[∂f∂x1∂f∂x2⋮∂f∂xn\]\\nabla f = \\begin{bmatrix} \\frac{\\partial f}{\\partial x\_1} \\\ \\frac{\\partial f}{\\partial x\_2} \\\ \\vdots \\\ \\frac{\\partial f}{\\partial x\_n} \\end{bmatrix}∇f=​∂x1​∂f​∂x2​∂f​⋮∂xn​∂f​​​

The symbol ∇\\nabla∇ is called "nabla" or "del".

#### Direction of Steepest Ascent

The gradient ∇f\\nabla f∇f points in the direction where f increases fastest. If you're standing on a hill, the gradient points uphill.

#### Gradient Descent

To minimize f (like a loss function), move in the **opposite** direction: θnew=θold−α∇f\\theta\_{new} = \\theta\_{old} - \\alpha \\nabla fθnew​=θold​−α∇f

#### Magnitude = Steepness

The magnitude ∣∣∇f∣∣\|\|\\nabla f\|\|∣∣∇f∣∣ tells you how steep the slope is. Large gradient = steep terrain = big updates.

## Interactive: The Gradient

For the function f(x,y)=x2+y2f(x, y) = x^2 + y^2f(x,y)=x2+y2, the gradient is:

∇f=\[∂f∂x∂f∂y\]=\[2x2y\]\\nabla f = \\begin{bmatrix} \\frac{\\partial f}{\\partial x} \\\ \\frac{\\partial f}{\\partial y} \\end{bmatrix} = \\begin{bmatrix} 2x \\\ 2y \\end{bmatrix}∇f=\[∂x∂f​∂y∂f​​\]=\[2x2y​\]

Drag the point to see how the gradient always points toward steepest ascent (away from the minimum at the origin).

### Interactive Gradient

f(x, y) = x² + y²

∇f=⟨2x,2y⟩\\nabla f = \\langle 2x, 2y \\rangle∇f=⟨2x,2y⟩

min

Click & Drag anywhere

#### Partials = Components

∂f∂x=2x\\frac{\\partial f}{\\partial x} = 2x∂x∂f​=2xHorizontal Slope

2.00

∂f∂y=2y\\frac{\\partial f}{\\partial y} = 2y∂y∂f​=2yVertical Slope

2.00

#### Gradient Construction

∇f=⟨2.00,2.00⟩\\nabla f = \\langle 2.00, 2.00 \\rangle∇f=⟨2.00,2.00⟩

The gradient vector is literally just the list of partial derivatives.

Magnitude (Steepness): 2.83

Direction: 45°

Notice how the gradient always points perpendicular to the contour lines?

## Directional Derivatives

Partial derivatives tell us the slope along coordinate axes. But what if we want to know the slope in an arbitrary direction?

#### Directional Derivative

The rate of change of f in direction of unit vector u\\mathbf{u}u is:

Duf=∇f⋅u=∣∣∇f∣∣cos⁡(θ)D\_{\\mathbf{u}}f = \\nabla f \\cdot \\mathbf{u} = \|\|\\nabla f\|\| \\cos(\\theta)Du​f=∇f⋅u=∣∣∇f∣∣cos(θ)

where θ\\thetaθ is the angle between the gradient and direction u.

Maximum

When u = direction of gradient, cos(0) = 1. Maximum increase.

Minimum

When u = opposite of gradient, cos(180) = -1. Maximum decrease.

Zero

When u perpendicular to gradient, cos(90) = 0. Level curve (contour).

#### Gradient is Perpendicular to Level Curves

The gradient is always perpendicular to level curves (contours where f is constant). This is because moving along a level curve means zero change in f, which requires cos(theta) = 0.

## Higher-Order Partial Derivatives

We can take partial derivatives of partial derivatives. These second-order partials are crucial for optimization (You can read more about it in the [Hessian matrix](https://www.tensortonic.com/ml-math/calculus/jacobian-hessian)).

#### Second-Order Partials

Pure second partial

∂2f∂x2=∂∂x(∂f∂x)\\frac{\\partial^2 f}{\\partial x^2} = \\frac{\\partial}{\\partial x}\\left(\\frac{\\partial f}{\\partial x}\\right)∂x2∂2f​=∂x∂​(∂x∂f​)

Mixed partial

∂2f∂x∂y=∂∂x(∂f∂y)\\frac{\\partial^2 f}{\\partial x \\partial y} = \\frac{\\partial}{\\partial x}\\left(\\frac{\\partial f}{\\partial y}\\right)∂x∂y∂2f​=∂x∂​(∂y∂f​)

#### Clairaut's Theorem (Symmetry of Mixed Partials)

If the mixed partials are continuous, then the order of differentiation doesn't matter:

∂2f∂x∂y=∂2f∂y∂x\\frac{\\partial^2 f}{\\partial x \\partial y} = \\frac{\\partial^2 f}{\\partial y \\partial x}∂x∂y∂2f​=∂y∂x∂2f​

This is why the Hessian matrix is symmetric for most functions we encounter.

## ML Applications

#### Backpropagation

When training a neural network, we need ∂L∂wi\\frac{\\partial L}{\\partial w\_i}∂wi​∂L​ for every weight w\_i. The chain rule lets us compute these efficiently by propagating gradients backward through the network.

#### Automatic Differentiation

PyTorch and TensorFlow build computation graphs and use the chain rule to compute all partial derivatives automatically. When you call `loss.backward()`, it computes the gradient of loss with respect to all parameters.

#### Feature Importance (Saliency Maps)

For a trained model, ∂output∂inputi\\frac{\\partial \\text{output}}{\\partial \\text{input}\_i}∂inputi​∂output​ tells us how sensitive the output is to each input feature. This creates "saliency maps" showing which pixels matter most for image classification.

#### Regularization via Gradients

Some regularization techniques penalize large gradients. For example, spectral normalization in GANs constrains the Lipschitz constant (maximum gradient magnitude) of the discriminator.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept