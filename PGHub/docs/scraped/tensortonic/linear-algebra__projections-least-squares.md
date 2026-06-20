---
source_url: https://tensortonic.com/ml-math/linear-algebra/projections-least-squares
title: Projections & Least Squares Regression | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

05/11

Linear Algebra

### Contents

The Geometry of FittingVector ProjectionInteractive: Fitting LinesColumn Space ViewNormal EquationsCase Study: Bulb RegressionQR SolutionML Applications

## The Geometry of Fitting

Most real world systems are **overdetermined**: we have more equations than unknowns. The system Ax=bAx = bAx=b has no exact solution. The data is too noisy, the model is too simple, or both.

**Least Squares** asks: "If we cannot hit bbb exactly, what is the closest we can get?" The answer is the projection of bbb onto the column space of AAA.

### The Core Insight

Linear regression, polynomial fitting, and even deep learning (in parts) all reduce to projections. The error is minimized when it is perpendicular to the subspace of possible outputs.

## Vector Projection

Before matrices, let us project a single vector aaa onto another vector bbb.

projb(a)=a⋅bb⋅bb=a⋅b∣∣b∣∣2b\\text{proj}\_b(a) = \\frac{a \\cdot b}{b \\cdot b} b = \\frac{a \\cdot b}{\|\|b\|\|^2} bprojb​(a)=b⋅ba⋅b​b=∣∣b∣∣2a⋅b​b

The scalar a⋅bb⋅b\\frac{a \\cdot b}{b \\cdot b}b⋅ba⋅b​ tells us how far along bbb the projection lands.

### Vector Projection

Visualizing proj\_b(a) and the orthogonal error vector.

ab

#### Target Vector (a)

XY

#### Base Vector (b)

XY

Scalar Projection0.73

\|\|a\|\|

5.00

\|\|proj\|\|

3.73

\|\|error\|\|

3.33

#### The Projection

The component of aaa that lies along bbb. This is what we keep.

#### The Error

e=a−projb(a)e = a - \\text{proj}\_b(a)e=a−projb​(a). The residual, always perpendicular to bbb.

## Interactive: Fitting Lines

In coordinate space, "perpendicular error" translates to minimizing the sum of vertical distance squared. Drag the points to see how the optimal line shifts to keep the residuals orthogonal to the feature space.

### Data Space

e ⊥ Column Space

Squares

#### Optimal Line

y^=0.56x+1.39\\hat{y} = 0.56x + 1.39y^​=0.56x+1.39

#### Orthogonality Check

The error vector eee must be orthogonal to the feature space (Column Space of X).

e · 1 (Bias)

0.0000

e · x (Feature)

0.0000

#### Total Squared Error

4.41

Visualize this as the total area of all the squares in the plot. Least Squares finds the minimum possible area.

## Column Space View

For a matrix AAA, the column space C(A)C(A)C(A) is the set of all possible outputs AxAxAx. If bbb is not in C(A)C(A)C(A), we project it.

1. The target bbb lives in Rm\\mathbb{R}^mRm (m data points).
2. The column space C(A)C(A)C(A) is a subspace of Rm\\mathbb{R}^mRm (spanned by n features).
3. We find the point b^∈C(A)\\hat{b} \\in C(A)b^∈C(A) closest to bbb.
4. The error e=b−b^e = b - \\hat{b}e=b−b^ is perpendicular to C(A)C(A)C(A).

### Key Geometric Fact

The shortest distance from a point to a subspace is measured along the perpendicular. This is why ATe=0A^T e = 0ATe=0 (the error is [orthogonal](https://www.tensortonic.com/ml-math/linear-algebra/orthogonality) to every column of AAA).

## The Normal Equations

From the perpendicularity condition AT(b−Ax)=0A^T(b - Ax) = 0AT(b−Ax)=0, we simplify to find the best weights x^\\hat{x}x^:

ATAx^=ATbA^T A \\hat{x} = A^T bATAx^=ATb

Solution: x^=(ATA)−1ATb\\hat{x} = (A^T A)^{-1} A^T bx^=(ATA)−1ATb

### When Does This Work?

The inverse (ATA)−1(A^T A)^{-1}(ATA)−1 exists only when AAA has **full column rank**, i.e., all columns are linearly independent. If features are collinear (one is a linear combination of others), ATAA^T AATA is singular and cannot be inverted. This is exactly why **ridge regression** adds λI\\lambda IλI to the diagonal: the matrix ATA+λIA^T A + \\lambda IATA+λI is always invertible for λ>0\\lambda > 0λ>0, regardless of rank.

### The Pseudoinverse

The matrix A+=(ATA)−1ATA^+ = (A^T A)^{-1} A^TA+=(ATA)−1AT is called the **Moore Penrose Pseudoinverse**. It gives the least squares solution even when AAA is not square.

## Case Study: Bulb Lifespan Prediction

#### The Problem

You have 100 bulbs with features (voltage, temperature) and lifespan measurements. You want to fit a linear model: Lifespan = w₁×Voltage + w₂×Temperature + w₀.

#### The Setup

Design matrix AAA is 100×3 (100 samples, 3 features including bias). Target bbb is 100×1. We solve for www (3×1).

w^=(ATA)−1ATb\\hat{w} = (A^T A)^{-1} A^T bw^=(ATA)−1ATb

#### The Geometric View

The column space of AAA is a 3D subspace in 100D space. The vector bbb (lifespans) is projected onto this subspace. The residuals e=b−Aw^e = b - A\\hat{w}e=b−Aw^ are the prediction errors, perpendicular to all features.

## QR Decomposition Solution

Directly computing (ATA)−1(A^T A)^{-1}(ATA)−1 is numerically unstable. In practice, we use [QR decomposition](https://www.tensortonic.com/ml-math/linear-algebra/orthogonality#qr-decomposition).

1. Decompose A=QRA = QRA=QR where QQQ is orthogonal, RRR is upper triangular.
2. Substitute: (QR)T(QR)x^=(QR)Tb(QR)^T(QR)\\hat{x} = (QR)^T b(QR)T(QR)x^=(QR)Tb
3. Simplify: RTQTQRx^=RTQTbR^T Q^T Q R \\hat{x} = R^T Q^T bRTQTQRx^=RTQTb
4. Since QTQ=IQ^T Q = IQTQ=I: RTRx^=RTQTbR^T R \\hat{x} = R^T Q^T bRTRx^=RTQTb
5. Result: Rx^=QTbR \\hat{x} = Q^T bRx^=QTb (solve by back substitution)

**Numerical Advantage:** QR avoids squaring the condition number of AAA. This is how `numpy.linalg.lstsq` works internally.

## ML Applications

### Linear Regression

The closed form solution w=(XTX)−1XTyw = (X^TX)^{-1}X^Tyw=(XTX)−1XTy is exactly the normal equations. Gradient descent converges to the same point.

### Ridge Regression

Add regularization: w=(XTX+λI)−1XTyw = (X^TX + \\lambda I)^{-1}X^Tyw=(XTX+λI)−1XTy. When XTXX^TXXTX is singular (features are collinear), OLS breaks. Adding λI\\lambda IλI shifts all eigenvalues away from zero, guaranteeing [invertibility](https://www.tensortonic.com/ml-math/linear-algebra/determinants-inverses) while also shrinking coefficients toward zero.

### PCA via SVD

[PCA](https://www.tensortonic.com/ml-math/linear-algebra/pca) finds the subspace that best approximates the data (least reconstruction error). This is a projection problem solved via SVD.

### Kernel Methods

Kernel Ridge Regression projects data into a high dimensional feature space and applies least squares there (via the kernel trick).

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept