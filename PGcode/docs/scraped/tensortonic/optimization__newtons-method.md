---
source_url: https://tensortonic.com/ml-math/optimization/newtons-method
title: Newton's Method: Second-Order Optimization | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

08/09

Optimization

### Contents

Beyond Gradient DescentThe AlgorithmInteractive: Root FindingInteractive: Hessian CurvatureQuadratic ConvergenceMultivariate NewtonCase Study: Logistic RegressionLimitationsML Applications

## Beyond Gradient Descent

[Gradient descent](https://www.tensortonic.com/ml-math/optimization/sgd-variants) uses only first derivatives. It knows the direction of steepest descent but not the curvature. **Newton's Method** uses second derivatives (the [Hessian](https://www.tensortonic.com/ml-math/calculus/jacobian-hessian)) to take smarter steps.

#### Gradient Descent

Uses ∇f only. Linear approximation. Takes many small steps.

#### Newton's Method

Uses ∇f and ∇²f. Quadratic approximation. Fewer but bigger steps.

### The Trade-off

Newton's Method converges faster (quadratic vs linear), but each iteration is more expensive. It shines for small-to-medium sized problems where Hessian computation is feasible.

## The Algorithm

For root-finding (solving f(x) = 0):

xn+1=xn−f(xn)f′(xn)x\_{n+1} = x\_n - \\frac{f(x\_n)}{f'(x\_n)}xn+1​=xn​−f′(xn​)f(xn​)​

Follow the tangent line to where it crosses zero.

For optimization (finding minimum of g(x)), we find roots of g'(x) = 0:

xn+1=xn−g′(xn)g′′(xn)x\_{n+1} = x\_n - \\frac{g'(x\_n)}{g''(x\_n)}xn+1​=xn​−g′′(xn​)g′(xn​)​

Step size is inversely proportional to curvature.

#### Geometric Intuition

At each point, fit a quadratic ( [Taylor approximation](https://www.tensortonic.com/ml-math/calculus/taylor-series)) to the function using the first and second derivatives. The minimum of this parabola is the next guess. For actual quadratics, Newton finds the minimum in one step!

## Interactive: Root Finding

Watch Newton's Method find √2 by solving x² - 2 = 0. Notice how quickly the error decreases.

### Newton's Method Visualization

Solving x2−2=0x^2 - 2 = 0x2−2=0 to find 2\\sqrt{2}2​. Tangent lines guide the way.

Initial Guess:

Next Step

f(x) = x² - 2√2x\_0

Current Estimate

3.0000000

Error: 1.59e+0Correct Digits: 0

| Iter | x\_n | f(x\_n) | Step |
| --- | --- | --- | --- |
| 0 | 3.0000 | 7.0000 | - |

Quadratic Convergence

Notice how the number of correct digits roughly **doubles** with every step. Gradient descent would take thousands of steps to match this precision.

## Interactive: Hessian Curvature

Explore how the [Hessian](https://www.tensortonic.com/ml-math/calculus/jacobian-hessian) (curvature) determines Newton's step size. Compare with [gradient descent](https://www.tensortonic.com/ml-math/optimization/sgd-variants) using a fixed [learning rate](https://www.tensortonic.com/ml-math/optimization/adaptive-rates).

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

## Quadratic Convergence

Newton's Method has **quadratic convergence**. Near the solution, the error squares each iteration.

∣xn+1−x∗∣≈C⋅∣xn−x∗∣2\|x\_{n+1} - x^\*\| \\approx C \\cdot \|x\_n - x^\*\|^2∣xn+1​−x∗∣≈C⋅∣xn​−x∗∣2

Each iteration roughly doubles the number of correct digits.

#### Example: Computing √2

| Iteration (n) | xn | Error | Correct Digits |
| --- | --- | --- | --- |
| 0 | 2.000000 | 0.585786 | 0 |
| 1 | 1.500000 | 0.085786 | 1 |
| 2 | 1.416667 | 0.002453 | 3 |
| 3 | 1.414216 | 0.000002 | 6 |

Compare this to [gradient descent](https://www.tensortonic.com/ml-math/optimization/sgd-variants)'s linear convergence, where each iteration reduces error by a constant factor.

## Multivariate Newton's Method

For functions of multiple variables, the [Hessian matrix](https://www.tensortonic.com/ml-math/calculus/jacobian-hessian) replaces the second derivative.

θn+1=θn−H−1∇f(θn)\\theta\_{n+1} = \\theta\_n - H^{-1} \\nabla f(\\theta\_n)θn+1​=θn​−H−1∇f(θn​)

H = Hessian matrix (second derivatives), ∇f = gradient

#### The Cost: O(n³)

Computing the Hessian is O(n²) storage and inverting it is O(n³). For neural nets with millions of parameters, this is infeasible. See quasi-Newton methods (L-BFGS) below for practical alternatives.

## Case Study: Logistic Regression

#### The Problem

Binary classification using logistic regression. Minimize [cross-entropy loss](https://www.tensortonic.com/ml-math/information-theory/cross-entropy), which is [convex](https://www.tensortonic.com/ml-math/optimization/convex-optimization). With n samples and d features, [Hessian](https://www.tensortonic.com/ml-math/calculus/jacobian-hessian) is d×d.

#### Newton vs Gradient Descent

For logistic regression, the Hessian is cheap to compute: O(nd + d³).

- **Newton:** 5-10 iterations to convergence
- **GD:** Thousands of iterations needed

#### In Practice

`sklearn.linear_model.LogisticRegression` uses Newton-like methods (L-BFGS) by default. This is why scikit-learn's logistic regression trains so fast!

### Newton vs Gradient Descent

Logistic Regression Convergence Race

Start Race

2.51.50.5\*Iterations →Loss

Newton's Method

Iterations:0

Loss:2.5000

Status:Running...

O(nd+d3)O(nd + d^3)O(nd+d3) per iteration

Gradient Descent

Iterations:0

Loss:2.5000

Status:Running...

O(nd)O(nd)O(nd) per iteration

Why Newton Wins

Newton uses curvature (Hessian) to take optimal steps. For convex problems like logistic regression, it converges in 5-10 iterations. GD needs thousands.

Newton (L-BFGS)

Gradient Descent

`sklearn.LogisticRegression` uses L-BFGS by default

## Limitations & Failure Modes

#### 1\. Computational Cost

O(n²) Hessian computation + O(n³) matrix inversion. Infeasible for deep learning's millions of parameters.

#### 2\. Singular Hessian

At [saddle points](https://www.tensortonic.com/ml-math/optimization/loss-landscapes), the Hessian may be singular or have negative [eigenvalues](https://www.tensortonic.com/ml-math/linear-algebra/eigenvalue-eigenvector). The method can fail or take steps in the wrong direction.

#### 3\. Divergence from Poor Initialization

Unlike gradient descent, Newton can diverge if starting too far from the solution. Quadratic convergence only holds _near_ the optimum.

#### 4\. [Non-Convex](https://www.tensortonic.com/ml-math/optimization/convex-optimization) Landscapes

In deep learning's non-convex [loss landscapes](https://www.tensortonic.com/ml-math/optimization/loss-landscapes), Newton can get attracted to saddle points instead of minima. [SGD](https://www.tensortonic.com/ml-math/optimization/sgd-variants) noise actually helps escape these!

## ML Applications & Variants

### L-BFGS

**Limited-memory BFGS** approximates the Hessian inverse using past gradients. O(n) storage instead of O(n²). Used in scikit-learn and scipy.optimize.

### Natural Gradient

Uses the [Fisher Information Matrix](https://www.tensortonic.com/ml-math/statistics/maximum-likelihood-estimation) (expected Hessian) instead of the true Hessian. Better for [probability distributions](https://www.tensortonic.com/ml-math/probability/distributions) and policy gradients in RL.

### Hessian-Free Optimization

Computes [Hessian](https://www.tensortonic.com/ml-math/calculus/jacobian-hessian)-vector products without forming the full Hessian. Uses conjugate gradient for the linear solve. More feasible for deep learning.

### Trust Region Methods

TRPO (Trust Region Policy Optimization) uses a quadratic approximation with curvature from the Fisher matrix. Critical for stable policy learning in RL.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept