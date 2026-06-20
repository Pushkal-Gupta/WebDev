---
source_url: https://tensortonic.com/ml-math/calculus/taylor-series
title: Taylor Series Approximation in Machine Learning | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

05/09

Calculus

### Contents

IntroductionThe Core IdeaThe Taylor FormulaInteractive: ApproximationOrders of ApproximationMultivariate TaylorConnection to OptimizationML Applications

## Introduction

Computers are surprisingly limited. At the hardware level, they can only add, subtract, multiply, and divide. So how does your calculator compute sin⁡(1.5)\\sin(1.5)sin(1.5) or e2.5e^{2.5}e2.5?

It **cheats**. It replaces these complex transcendental functions with really long **polynomials**. Polynomials are just addition and multiplication, which computers understand.

#### Why This Matters for ML

- **Gradient Descent:** First-order Taylor approx (linear) justifies the update rule.
- **Newton's Method:** Second-order Taylor approx (quadratic) enables smarter steps.
- **XGBoost:** Uses Taylor expansion of loss for efficient tree construction.
- **Understanding Optimization:** Taylor series explains why optimization algorithms work.

## The Core Idea

Imagine forging a signature. To make your forgery match the original at a specific point, you need to match several properties:

0

Position

Your approximation passes through the same point. f(a) = P(a)

1

Velocity (Slope)

The curve is going in the same direction. f'(a) = P'(a)

2

Acceleration (Curvature)

The curve bends at the same rate. f''(a) = P''(a)

Match enough derivatives at point a, and your polynomial becomes indistinguishable from the original function near that point.

## The Taylor Formula

The Taylor series of f(x) centered at point a is:

f(x)=f(a)+f′(a)(x−a)+f′′(a)2!(x−a)2+f′′′(a)3!(x−a)3+⋯f(x) = f(a) + f'(a)(x-a) + \\frac{f''(a)}{2!}(x-a)^2 + \\frac{f'''(a)}{3!}(x-a)^3 + \\cdotsf(x)=f(a)+f′(a)(x−a)+2!f′′(a)​(x−a)2+3!f′′′(a)​(x−a)3+⋯

General form: f(x)=∑n=0∞f(n)(a)n!(x−a)nf(x) = \\sum\_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^nf(x)=∑n=0∞​n!f(n)(a)​(x−a)n

#### Maclaurin Series

When a = 0, we call it a Maclaurin series. Common examples you should know:

ex=1+x+x22!+x33!+⋯e^x = 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + \\cdotsex=1+x+2!x2​+3!x3​+⋯

sin⁡x=x−x33!+x55!−⋯\\sin x = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\cdotssinx=x−3!x3​+5!x5​−⋯

#### Convergence

The series converges to f(x) within a "radius of convergence." Further from a, more terms are needed for accuracy.

## Interactive: Taylor Approximation

Watch how higher-order Taylor polynomials approximate sin(x) better and better near the center point.

### Taylor Approximation

Approximating sin⁡(x)\\sin(x)sin(x) with polynomials. Move the center a.

Error AreaAUTO PLAYReset

axy-2π-ππ2π

#### Configuration

Order (n)1

ConstantLinearQuadraticHigh Order

Center (a)0.00

#### Polynomial Terms

f(x)≈∑k=01f(k)(a)k!(x−a)kf(x) \\approx \\sum\_{k=0}^{1} \\frac{f^{(k)}(a)}{k!}(x-a)^kf(x)≈∑k=01​k!f(k)(a)​(x−a)k

k=00.00/ 0 • (x-a)^0

k=11.00/ 1 • (x-a)^1

Notice how the green curve "hugs" the blue curve closer as Order increases.

## Orders of Approximation

In optimization, we typically use only the first few terms:

#### First-Order (Linear)

f(x)≈f(a)+f′(a)(x−a)f(x) \\approx f(a) + f'(a)(x-a)f(x)≈f(a)+f′(a)(x−a)

Approximates f as a **straight line** (tangent). This is what [gradient descent](https://www.tensortonic.com/ml-math/calculus/backpropagation) "sees."

#### Second-Order (Quadratic)

f(x)≈f(a)+f′(a)(x−a)+f′′(a)2(x−a)2f(x) \\approx f(a) + f'(a)(x-a) + \\frac{f''(a)}{2}(x-a)^2f(x)≈f(a)+f′(a)(x−a)+2f′′(a)​(x−a)2

Approximates f as a **parabola**. Includes curvature via [Hessian](https://www.tensortonic.com/ml-math/calculus/jacobian-hessian).

## Multivariate Taylor Series

Neural networks have vector inputs. The multivariate second-order Taylor expansion is:

f(x)≈f(a)+∇f(a)T(x−a)+12(x−a)TH(a)(x−a)f(\\mathbf{x}) \\approx f(\\mathbf{a}) + \\nabla f(\\mathbf{a})^T(\\mathbf{x}-\\mathbf{a}) + \\frac{1}{2}(\\mathbf{x}-\\mathbf{a})^T H(\\mathbf{a})(\\mathbf{x}-\\mathbf{a})f(x)≈f(a)+∇f(a)T(x−a)+21​(x−a)TH(a)(x−a)

Constant term

f(a): current value

Linear term

gradient: direction of change

Quadratic term

Hessian: curvature info

## Connection to Optimization

#### Why Gradient Descent Works

Near our current point theta, the loss looks like a plane: L(θ+ϵ)≈L(θ)+ϵT∇LL(\\theta + \\epsilon) \\approx L(\\theta) + \\epsilon^T \\nabla LL(θ+ϵ)≈L(θ)+ϵT∇L

To minimize, we want ϵT∇L\\epsilon^T \\nabla LϵT∇L as negative as possible. This means pointing epsilon opposite to the gradient.

#### Newton's Method

Uses the quadratic approximation. If f is approximately a parabola, we can jump directly to its minimum:

θnew=θold−H−1∇f\\theta\_{new} = \\theta\_{old} - H^{-1} \\nabla fθnew​=θold​−H−1∇f

Much faster convergence than GD, but computing H⁻¹ is O(n³).

## ML Applications

#### XGBoost's Second-Order Objective

XGBoost approximates the loss using second-order Taylor expansion: L≈∑\[gift+12hift2\]L \\approx \\sum\[g\_i f\_t + \\frac{1}{2}h\_i f\_t^2\]L≈∑\[gi​ft​+21​hi​ft2​\] where g is gradient and h is Hessian.

#### Natural Gradient

Uses Fisher information matrix (related to Hessian) to take steps in the "natural" parameter space. More efficient for probabilistic models.

#### BFGS / L-BFGS

Quasi-Newton methods that approximate the Hessian from gradient history. Get second-order benefits without computing full Hessian.

#### Activation Function Approximations

GELU can be approximated using Taylor series for efficient computation: GELU(x)≈0.5x(1+tanh⁡\[...\])\\text{GELU}(x) \\approx 0.5x(1 + \\tanh\[...\])GELU(x)≈0.5x(1+tanh\[...\])

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept