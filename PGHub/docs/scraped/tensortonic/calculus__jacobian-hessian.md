---
source_url: https://tensortonic.com/ml-math/calculus/jacobian-hessian
title: Jacobian & Hessian Matrices for Deep Learning | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

04/09

Calculus

### Contents

IntroductionDerivative HierarchyThe Jacobian MatrixJacobian ExampleInteractive: JacobianThe Hessian MatrixHessian ExampleInteractive: CurvatureCritical Points TestML Applications

## Introduction

In single-variable calculus, we have f'(x) (first derivative/slope) and f''(x) (second derivative/curvature). But neural networks operate on vectors with millions of dimensions.

When we generalize derivatives to vectors:

#### Jacobian (First Order)

Matrix of all first partial derivatives. Generalizes gradient to vector-valued functions.

#### Hessian (Second Order)

Matrix of all second partial derivatives. Captures curvature information.

## The Derivative Hierarchy

The type of derivative depends on the input and output dimensions:

| Input | Output | Derivative | Shape |
| --- | --- | --- | --- |
| Scalar (x) | Scalar (y) | Derivative | 1 x 1 |
| Vector (x) | Scalar (y) | Gradient | n x 1 |
| Vector (x) | Vector (y) | Jacobian | m x n |
| Vector (x) | Scalar (y) | Hessian (2nd) | n x n |

## The Jacobian Matrix

For a function f:Rn→Rm\\mathbf{f}: \\mathbb{R}^n \\to \\mathbb{R}^mf:Rn→Rm (n inputs, m outputs), the Jacobian is an m x n matrix:

J=\[∂f1∂x1∂f1∂x2⋯∂f1∂xn∂f2∂x1∂f2∂x2⋯∂f2∂xn⋮⋮⋱⋮∂fm∂x1∂fm∂x2⋯∂fm∂xn\]J = \\begin{bmatrix}
\\frac{\\partial f\_1}{\\partial x\_1} & \\frac{\\partial f\_1}{\\partial x\_2} & \\cdots & \\frac{\\partial f\_1}{\\partial x\_n} \\\
\\frac{\\partial f\_2}{\\partial x\_1} & \\frac{\\partial f\_2}{\\partial x\_2} & \\cdots & \\frac{\\partial f\_2}{\\partial x\_n} \\\
\\vdots & \\vdots & \\ddots & \\vdots \\\
\\frac{\\partial f\_m}{\\partial x\_1} & \\frac{\\partial f\_m}{\\partial x\_2} & \\cdots & \\frac{\\partial f\_m}{\\partial x\_n}
\\end{bmatrix}J=​∂x1​∂f1​​∂x1​∂f2​​⋮∂x1​∂fm​​​∂x2​∂f1​​∂x2​∂f2​​⋮∂x2​∂fm​​​⋯⋯⋱⋯​∂xn​∂f1​​∂xn​∂f2​​⋮∂xn​∂fm​​​​

Row i = how output i changes with each input. Column j = how each output changes with input j.

#### Geometric Meaning

The Jacobian represents the best linear approximation to f near a point. It tells us how a small change in input δx\\delta xδx affects the output:

f(x+δx)≈f(x)+J⋅δx\\mathbf{f}(\\mathbf{x} + \\delta\\mathbf{x}) \\approx \\mathbf{f}(\\mathbf{x}) + J \\cdot \\delta\\mathbf{x}f(x+δx)≈f(x)+J⋅δx

## Jacobian: Worked Example

Consider a function from R2→R2\\mathbb{R}^2 \\to \\mathbb{R}^2R2→R2:

f(x,y)=\[x2+yxy\]\\mathbf{f}(x, y) = \\begin{bmatrix} x^2 + y \\\ xy \\end{bmatrix}f(x,y)=\[x2+yxy​\]

Step 1: Compute all partial derivatives

∂f1∂x=2x\\frac{\\partial f\_1}{\\partial x} = 2x∂x∂f1​​=2x

∂f1∂y=1\\frac{\\partial f\_1}{\\partial y} = 1∂y∂f1​​=1

∂f2∂x=y\\frac{\\partial f\_2}{\\partial x} = y∂x∂f2​​=y

∂f2∂y=x\\frac{\\partial f\_2}{\\partial y} = x∂y∂f2​​=x

Step 2: Assemble the Jacobian

J=\[2x1yx\]J = \\begin{bmatrix} 2x & 1 \\\ y & x \\end{bmatrix}J=\[2xy​1x​\]

Step 3: Evaluate at a point (x=2, y=3)

J∣(2,3)=\[4132\]J\|\_{(2,3)} = \\begin{bmatrix} 4 & 1 \\\ 3 & 2 \\end{bmatrix}J∣(2,3)​=\[43​12​\]

## Interactive: Jacobian in Action

See how the Jacobian provides a **linear approximation** to how outputs change with inputs. Move the base point and perturbation to explore.

### Jacobian Linearization

f(x,y)=(x2+y,xy)\\mathbf{f}(x,y) = (x^2+y, xy)f(x,y)=(x2+y,xy). Drag the points to explore.

Local GridReset

#### Input Space (x, y)

Base: (1.50, 1.00)

Perturbation δ\\deltaδ: (0.50, 0.30)

#### Output Space (u, v)

Approximation Error0.2915

Jacobian J at Base

\[3.001.001.001.50\]\\begin{bmatrix} 3.00 & 1.00 \\\ 1.00 & 1.50 \\end{bmatrix}\[3.001.00​1.001.50​\]

True Change

Linear Approx

## The Hessian Matrix

For a scalar-valued function f:Rn→Rf: \\mathbb{R}^n \\to \\mathbb{R}f:Rn→R (like a loss function), the Hessian is the n x n matrix of second-order partial derivatives:

H=∇2f=\[∂2f∂x12∂2f∂x1∂x2⋯∂2f∂x2∂x1∂2f∂x22⋯⋮⋮⋱\]H = \\nabla^2 f = \\begin{bmatrix}
\\frac{\\partial^2 f}{\\partial x\_1^2} & \\frac{\\partial^2 f}{\\partial x\_1 \\partial x\_2} & \\cdots \\\
\\frac{\\partial^2 f}{\\partial x\_2 \\partial x\_1} & \\frac{\\partial^2 f}{\\partial x\_2^2} & \\cdots \\\
\\vdots & \\vdots & \\ddots
\\end{bmatrix}H=∇2f=​∂x12​∂2f​∂x2​∂x1​∂2f​⋮​∂x1​∂x2​∂2f​∂x22​∂2f​⋮​⋯⋯⋱​​

#### Symmetric

For continuous second partials:

∂2f∂xi∂xj=∂2f∂xj∂xi\\frac{\\partial^2 f}{\\partial x\_i \\partial x\_j} = \\frac{\\partial^2 f}{\\partial x\_j \\partial x\_i}∂xi​∂xj​∂2f​=∂xj​∂xi​∂2f​

So H=HTH = H^TH=HT

#### Curvature

The Hessian captures how the gradient itself changes. It describes the "bowl shape" of the function.

## Hessian: Worked Example

Consider a loss function f(x,y)=x2+3xy+y2f(x, y) = x^2 + 3xy + y^2f(x,y)=x2+3xy+y2:

Step 1: First partial derivatives (gradient)

∇f=\[2x+3y3x+2y\]\\nabla f = \\begin{bmatrix} 2x + 3y \\\ 3x + 2y \\end{bmatrix}∇f=\[2x+3y3x+2y​\]

Step 2: Second partial derivatives

∂2f∂x2=2\\frac{\\partial^2 f}{\\partial x^2} = 2∂x2∂2f​=2

∂2f∂x∂y=3\\frac{\\partial^2 f}{\\partial x \\partial y} = 3∂x∂y∂2f​=3

∂2f∂y∂x=3\\frac{\\partial^2 f}{\\partial y \\partial x} = 3∂y∂x∂2f​=3

∂2f∂y2=2\\frac{\\partial^2 f}{\\partial y^2} = 2∂y2∂2f​=2

Step 3: Assemble Hessian

H=\[2332\]H = \\begin{bmatrix} 2 & 3 \\\ 3 & 2 \\end{bmatrix}H=\[23​32​\]

Note: constant because f is quadratic.

## Interactive: Curvature & Critical Points

Adjust the Hessian eigenvalues to see how they determine the shape of the loss surface and classify critical points.

### Hessian Curvature & Step Size

High curvature = Steep walls = Inverse Hessian prevents overshooting.

Gradient DescentNewton's Method

Newton (Direct)GD (Fixed LR)

Flat (Low Curvature)Steep (High Curvature)

Hessian f′′(x)=2.0f''(x) = 2.0f′′(x)=2.0

#### Step Size Analysis

Newton StepΔx=−f′/f′′\\Delta x = -f'/f''Δx=−f′/f′′

Adapts to curvature. If curve is steep (high f′′f''f′′), step is scaled down.

Size: 2.00Perfect

Gradient DescentΔx=−ηf′\\Delta x = -\\eta f'Δx=−ηf′

Fixed learning rate. Ignores curvature.

Size: 0.80Too Slow

#### Key Insight

The Hessian H=∇2fH = \\nabla^2 fH=∇2f acts as a "smart scaling matrix".

In steep directions (high curvature), H−1H^{-1}H−1 shrinks the gradient to prevent overshooting. In flat directions, it expands the step to speed up.

## Critical Points: The Eigenvalue Test

At a critical point (where gradient = 0), the Hessian's eigenvalues tell us the nature of that point:

All positive

Function curves UP in all directions. **Local minimum.**

All negative

Function curves DOWN in all directions. **Local maximum.**

Mixed signs

Curves up in some directions, down in others. **Saddle point.**

#### Why This Matters

In high-dimensional neural network loss landscapes, saddle points are far more common than local minima. Understanding the Hessian helps explain why optimization can stall and why momentum-based methods help.

## ML Applications

#### Backpropagation = Jacobian-Vector Products

When computing gradients through a neural network, each layer contributes a Jacobian. The chain rule becomes: ∇xL=J1TJ2T⋯JnT∇yL\\nabla\_x L = J\_1^T J\_2^T \\cdots J\_n^T \\nabla\_y L∇x​L=J1T​J2T​⋯JnT​∇y​L.

#### Newton's Method

Second-order optimization: θnew=θ−H−1∇f\\theta\_{new} = \\theta - H^{-1} \\nabla fθnew​=θ−H−1∇f. Uses curvature to take smarter steps. O(n³) to compute.

#### Hessian-Free Optimization

Clever algorithms that use Hessian information without computing the full matrix. Conjugate gradient methods can compute Hessian-vector products efficiently.

#### Loss Landscape Analysis

Researchers study Hessian eigenvalue distributions. Sharp minima (large eigenvalues) tend to generalize worse than flat minima (small eigenvalues).

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept