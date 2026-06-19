---
source_url: https://tensortonic.com/ml-math/linear-algebra/dot-norm
title: Dot Product & Vector Norms: Similarity and Distance | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

01/11

Linear Algebra

### Contents

IntroductionThe Dot ProductGeometric InterpretationProperties of Dot ProductInteractive: Dot ProductVector NormsProperties of NormsThe p-Norm FamilyInteractive: Unit BallsNormalizationML ApplicationsComputational Considerations

## Introduction

At the heart are two fundamental operations: **Dot Product** (alignment) and **Norms** (magnitude).

Every neural network prediction, recommender system suggestion, and regularization penalty uses these operations. Together, they form the foundation of how machines understand similarity, distance, and direction in high-dimensional space.

### Why These Matter

Understanding dot products and norms is crucial for modern ML architectures. [Matrix multiplication](https://www.tensortonic.com/ml-math/linear-algebra/matrix-multiplication) is just batched dot products. **Transformer attention** computes similarity via scaled dot products. Regularization techniques like Ridge and Lasso use different norms to constrain model complexity.

## The Dot Product

The dot product (also called inner product or scalar product) takes two vectors of equal length and returns a single scalar. It is the most fundamental operation in linear algebra.

a⋅b=∑i=1naibi\\mathbf{a} \\cdot \\mathbf{b} = \\sum\_{i=1}^{n} a\_i b\_ia⋅b=∑i=1n​ai​bi​

Multiply corresponding elements, then sum.

#### Algorithm

a = \[1, 3\]

b = \[4, -2\]

a · b = (1)(4) + (3)(-2) = **-2**

#### Matrix Notation

aTb\\mathbf{a}^T \\mathbf{b}aTb

Row vector × Column vector. This generalizes to specific rows and columns in larger matrices.

## Geometric Interpretation

The dot product measures **alignment** between vectors. It bridges algebra and geometry.

a⋅b=∣∣a∣∣⋅∣∣b∣∣cos⁡(θ)\\mathbf{a} \\cdot \\mathbf{b} = \|\|\\mathbf{a}\|\| \\cdot \|\|\\mathbf{b}\|\| \\cos(\\theta)a⋅b=∣∣a∣∣⋅∣∣b∣∣cos(θ)

Product of magnitudes times the cosine of the angle between them.

#### Positive

Vectors point in roughly the same direction (θ<90°\\theta < 90°θ<90°).

#### Zero

Vectors are orthogonal (perpendicular) (θ=90°\\theta = 90°θ=90°).

#### Negative

Vectors point in opposite directions (θ>90°\\theta > 90°θ>90°).

#### The Projection View

Think of it as casting a shadow of vector **a** onto **b**. The dot product tells you: "How much of a goes in the direction of b?". This "projection" concept is why dot products measure similarity.

## Properties of the Dot Product

#### Commutative

a⋅b=b⋅a\\mathbf{a} \\cdot \\mathbf{b} = \\mathbf{b} \\cdot \\mathbf{a}a⋅b=b⋅a

Order does not matter.

#### Distributive

a⋅(b+c)=a⋅b+a⋅c\\mathbf{a} \\cdot (\\mathbf{b} + \\mathbf{c}) = \\mathbf{a} \\cdot \\mathbf{b} + \\mathbf{a} \\cdot \\mathbf{c}a⋅(b+c)=a⋅b+a⋅c

Distributes over vector addition.

#### Self Dot Product

a⋅a=∣∣a∣∣2\\mathbf{a} \\cdot \\mathbf{a} = \|\|\\mathbf{a}\|\|^2a⋅a=∣∣a∣∣2

Dotting a vector with itself gives the squared norm (magnitude).

## Interactive: Dot Product

Drag the sliders to change vectors. See how the dot product relates to angle, cosine, and projection.

Dot Product

ab45°6.4a · bFUSION

LockTiltCrossSplit

\|a\|3\|b\|3θ45°

## Vector Norms

A norm measures the "size" or "magnitude" of a vector. Different norms measure size in different ways, each with unique geometric interpretations and ML applications.

#### L2 Norm (Euclidean)

∣∣x∣∣2=∑xi2\|\|\\mathbf{x}\|\|\_2 = \\sqrt{\\sum x\_i^2}∣∣x∣∣2​=∑xi2​​

Straight-line distance. Used in Ridge Regression, KNN.

#### L1 Norm (Manhattan)

∣∣x∣∣1=∑∣xi∣\|\|\\mathbf{x}\|\|\_1 = \\sum \|x\_i\|∣∣x∣∣1​=∑∣xi​∣

Sum of absolute values (taxi-cab distance). Promotes sparsity (Lasso).

#### L-infinity Norm (Max)

∣∣x∣∣∞=max⁡∣xi∣\|\|\\mathbf{x}\|\|\_\\infty = \\max \|x\_i\|∣∣x∣∣∞​=max∣xi​∣

Largest single element. Used in adversarial robustness.

## Properties of Norms

For a function to be a valid norm, it must satisfy three axioms:

- **Non-negativity:** Norm is always non-negative. Zero only if the vector is zero.
- **Absolute Homogeneity:** Scaling the vector scales the norm by the absolute scalar value.
- **Triangle Inequality:** The direct path is always shorter than any detour. ∣∣x+y∣∣≤∣∣x∣∣+∣∣y∣∣\|\|\\mathbf{x} + \\mathbf{y}\|\| \\leq \|\|\\mathbf{x}\|\| + \|\|\\mathbf{y}\|\|∣∣x+y∣∣≤∣∣x∣∣+∣∣y∣∣

## The p-Norm Family

All common norms are special cases of the generalized p-norm (where p≥1p \\geq 1p≥1).

∣∣x∣∣p=(∑i=1n∣xi∣p)1/p\|\|\\mathbf{x}\|\|\_p = \\left(\\sum\_{i=1}^{n} \|x\_i\|^p\\right)^{1/p}∣∣x∣∣p​=(∑i=1n​∣xi​∣p)1/p

p=1p = 1p=1

L1 Norm (Manhattan)

p=2p = 2p=2

L2 Norm (Euclidean)

p=3,4,…p = 3, 4, \\ldotsp=3,4,…

Higher-order norms

p→∞p \\to \\inftyp→∞

L-infinity (Max)

## Interactive: Unit Balls

The "unit ball" (vectors with norm = 1) has a different shape for each p-norm. This shape explains why [L1 regularization](https://www.tensortonic.com/ml-math/optimization/regularization) promotes sparsity (sharp corners on axes).

### Vector Norms & Unit Balls

Visualizing ∥x∥p=1\\\|x\\\|\_p = 1∥x∥p​=1 for different p-norms.

Select Norm

L1L2L∞

Vector Components

X Coordinate 3

Y Coordinate 4

L2 Norm (Euclidean)

Points with constant sum of squares form a circle. Measures straight-line distance.

Unit Ball (Norm=1)

Grid: 1 unit steps

L1

7.00

L2

5.00

L∞

4.00

## Normalization (Unit Vectors)

Normalization converts a vector to a unit vector (norm = 1) pointing in the same direction, isolating direction from magnitude.

x^=x∣∣x∣∣\\hat{\\mathbf{x}} = \\frac{\\mathbf{x}}{\|\|\\mathbf{x}\|\|}x^=∣∣x∣∣x​

Divide by the norm.

#### Applications

- **Cosine Similarity:** Normalized vectors reduce dot product to cosine similarity.
- **Batch Norm:** Normalizes layer activations to stabilize training.
- **Word Embeddings:** Often normalized so only direction (meaning) matters, not frequency.

## ML Applications

### Regularization

Penalizing the norm of weights prevents overfitting.

- **L1 (Lasso):** λ∣∣w∣∣1\\lambda \|\|\\mathbf{w}\|\|\_1λ∣∣w∣∣1​ \- creates sparse models (feature selection).
- **L2 (Ridge):** λ∣∣w∣∣22\\lambda \|\|\\mathbf{w}\|\|\_2^2λ∣∣w∣∣22​ \- distributes weight values, prevents unstable large weights.

### Attention Mechanism

Transformer attention is a scaled dot product. It calculates relevance scores between tokens.

### Distance Metrics

KNN and K-Means rely on L2 distance ∣∣x−y∣∣2\|\|\\mathbf{x} - \\mathbf{y}\|\|\_2∣∣x−y∣∣2​. Using different norms here changes the algorithm's behavior drastically.

## Computational Considerations

#### Time Complexity

Dot Product (n-dim)O(n)O(n)O(n)

Norm CalculationO(n)O(n)O(n)

#### Hardware

GPUs optimize these O(n) ops via massive parallelism (SIMD). Always use vectorized libraries (PyTorch/NumPy), never loops.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept