---
source_url: https://tensortonic.com/ml-math/linear-algebra/eigenvalue-eigenvector
title: Eigenvalues & Eigenvectors: Matrix DNA | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

07/11

Linear Algebra

### Contents

IntroductionGeometric IntuitionInteractive: EigenvectorsFormal DefinitionFinding EigenvaluesEigendecompositionSpecial Matrix TypesPower IterationInteractive: Power MethodConnection to SVDKey PropertiesML ApplicationsNumerical Considerations

## Introduction

"Eigen" is German for "own" or "characteristic." An eigenvector is a vector that reveals the **characteristic behavior** of a [matrix transformation](https://www.tensortonic.com/ml-math/linear-algebra/matrix-multiplication).

When a matrix transforms most vectors, it rotates and scales them. But eigenvectors are special: they **only scale**. They stay on their original line through the origin. The amount an eigenvector scales by is its **eigenvalue**.

### Why This Matters

Eigenvalues and eigenvectors unlock the "natural behavior" of a matrix. They power [PCA](https://www.tensortonic.com/ml-math/linear-algebra/pca) for dimensionality reduction, Google PageRank for web search, spectral clustering for graph analysis, and stability analysis for dynamical systems.

## Geometric Intuition

Imagine applying a matrix transformation to every vector in 2D space. Most vectors will change direction. But some special vectors will only stretch or shrink, staying on their original line.

#### Regular Vector

v → Av

After transformation, the vector points in a completely different direction. It has been both rotated and scaled.

#### Eigenvector

v → λv

The vector might get longer, shorter, or flip, but it stays on the same line through the origin. Only scaling occurs.

#### The Mona Lisa Analogy

Imagine shearing the Mona Lisa (slanting it). Most arrows drawn on the painting will point in new directions. But a horizontal arrow along the center might just get longer without tilting. That horizontal direction is an **eigenvector** of the shear transformation.

## Interactive: See Eigenvectors

Try different matrices and click "Apply Transformation." Notice how eigenvectors (green/blue) stay on their dashed lines while gray vectors rotate.

### Eigenvector Visualizer

Eigenvectors scale. Others rotate.

ShearScaleSymmetric

Apply ALoop

Matrix Transformation

#### Shear

10

11

Shears space horizontally. \[1,0\] stays \[1,0\] (λ=1).

Eigenvector 1

v ≈ \[1.00, 0.00\]

Eigenvalue

λ = 1.00

Eigenvector 2

v ≈ \[1.00, 0.00\]

Eigenvalue

λ = 1.00

Notice how the colored vectors never leave their dotted span lines. They only stretch or shrink. All gray vectors are rotated off their original paths.

## Formal Definition

For a square matrix A, a non-zero vector v is an eigenvector if:

Av=λvA\\mathbf{v} = \\lambda\\mathbf{v}Av=λv

v = eigenvector (direction)

λ = eigenvalue (scale factor)

#### Reading the Equation

Left side: Transform v by matrix A.

Right side: Scale v by scalar λ.

**They must be equal** for v to be an eigenvector. The matrix does nothing but scale.

## Finding Eigenvalues

Rearranging Av = λv gives us the key equation for finding eigenvalues:

1\. Rearrange:

(A−λI)v=0(A - \\lambda I)\\mathbf{v} = \\mathbf{0}(A−λI)v=0

2\. For non-zero v, the matrix must be singular:

det⁡(A−λI)=0\\det(A - \\lambda I) = 0det(A−λI)=0

**3\. This is the Characteristic Equation.** Solve for λ to find eigenvalues.

#### Example: A = \[\[1,2\],\[5,4\]\]

det(\[\[1-λ, 2\], \[5, 4-λ\]\]) = 0

(1-λ)(4-λ) - 10 = 0

λ² \- 5λ - 6 = 0

(λ \- 6)(λ + 1) = 0

Eigenvalues: λ = 6, -1

## Eigendecomposition

If A has n linearly independent eigenvectors, we can factorize it into a powerful form:

A=QΛQ−1A = Q\\Lambda Q^{-1}A=QΛQ−1

Q

Eigenvectors as columns

Λ

Eigenvalues on diagonal

Q⁻¹

Inverse of Q

#### Why This Matters: Matrix Powers

Computing A¹⁰⁰ directly is expensive. But with eigendecomposition:

A¹⁰⁰ = Q Λ¹⁰⁰ Q⁻¹

Diagonal matrix powers are trivial: just power each diagonal element!

## Special Matrix Types

Certain matrix types have guaranteed eigenvalue properties that make them easier to work with.

#### Symmetric (A = Aᵀ)

- Eigenvalues are always **real**
- Eigenvectors are **orthogonal**
- Always diagonalizable

Covariance matrices are symmetric, so [PCA](https://www.tensortonic.com/ml-math/linear-algebra/pca) always works!

#### Positive Definite

- All eigenvalues are **positive**
- xᵀAx > 0 for all non-zero x
- Represents a "bowl" shape

Hessian is positive definite at a local minimum.

#### Orthogonal (QᵀQ = I)

- Eigenvalues have \|λ\| = 1
- Represents rotations/reflections
- Preserves [lengths and angles](https://www.tensortonic.com/ml-math/linear-algebra/dot-norm)

#### Stochastic (Markov)

- Columns sum to 1
- Has eigenvalue λ = 1
- Stationary distribution is the eigenvector for λ=1

Used in PageRank and Markov Chain Monte Carlo.

## Power Iteration

Finding eigenvalues by solving the characteristic polynomial is impractical for large matrices. Instead, we use iterative methods. The simplest is **Power Iteration**.

#### Algorithm

1. Start with a random vector v₀
2. Repeatedly multiply by A: v₍ₖ₊₁₎ = A vₖ
3. Normalize after each step to prevent overflow
4. vₖ converges to the **dominant eigenvector** (largest \|λ\|)

#### Why It Works

Any vector can be written as a sum of eigenvectors. When we multiply by A repeatedly, each component scales by its eigenvalue. The component with the largest eigenvalue grows fastest and dominates. Normalization keeps the vector from exploding.

## Interactive: Power Method

Watch power iteration converge to the dominant eigenvector. Click "Step" to multiply by A and normalize.

### Power Iteration

Watch v converge to the dominant eigenvector

Step 0 / 15

Current vTarget (λ=3)

Matrix A

Symmetric with eigenvalues 3 and 1

21

12

**Algorithm:** vk+1 = A·vk / \|\|A·vk\|\|

λ Estimate

2.3846

True: 3.0000

Alignment

83.2%

\|cos(θ)\| with true

StepAuto

**Why it works:** Each multiplication amplifies the component along the dominant eigenvector (λ=3) by 3×, while the other (λ=1) stays the same. After normalization, the dominant direction takes over.

## Connection to SVD

Eigendecomposition only works for square matrices. For rectangular matrices, we use **Singular Value Decomposition (SVD)**, which is closely related.

#### Eigendecomposition

A = Q Λ Q⁻¹

Square matrices only. Q may not be orthogonal.

#### SVD

A = U Σ Vᵀ

Any matrix. U and V are orthogonal. Σ has singular values.

#### The Connection

For matrix A, the singular values are the square roots of eigenvalues of AᵀA. The right singular vectors (V) are eigenvectors of AᵀA. The left singular vectors (U) are eigenvectors of AAᵀ.

## Key Properties

#### Trace = Sum of Eigenvalues

tr(A)=∑λi\\text{tr}(A) = \\sum \\lambda\_itr(A)=∑λi​

#### Det = Product of Eigenvalues

det⁡(A)=∏λi\\det(A) = \\prod \\lambda\_idet(A)=∏λi​

#### Zero Eigenvalue

If λ = 0, matrix is singular (non-invertible). It collapses at least one dimension.

#### Complex Eigenvalues

Rotation matrices have complex eigenvalues. No real eigenvectors exist. All vectors rotate.

#### Eigenvalues of Matrix Operations

- **A⁻¹:** Eigenvalues are 1/λ (same eigenvectors)
- **Aᵏ:** Eigenvalues are λᵏ (same eigenvectors)
- **A + cI:** Eigenvalues are λ + c (same eigenvectors)
- **AB:** Same eigenvalues as BA (but possibly different eigenvectors)

## ML Applications

### PCA (Dimensionality Reduction)

Find eigenvectors of covariance matrix. The largest eigenvalue's eigenvector points in the direction of maximum variance. Project data onto top k eigenvectors to reduce dimensions while preserving information.

See [PCA](https://www.tensortonic.com/ml-math/linear-algebra/pca) for details.

### Google PageRank

The web is a giant matrix (link graph). The dominant eigenvector (eigenvalue = 1) of the stochastic transition matrix ranks all websites by importance. Google was built on this eigenvector!

### Spectral Clustering

Use eigenvectors of the [Graph Laplacian](https://www.tensortonic.com/ml-math/graph-theory/spectral-graph) to find natural clusters in data. Works better than k-means for non-convex shapes.

### Stability Analysis

For dynamical systems dx/dt = Ax, eigenvalues determine stability. If all eigenvalues have negative real parts, the system is stable. Used in analyzing RNN gradients and neural ODE dynamics.

### Eigenfaces

Faces as vectors. Eigenvectors of face dataset covariance = "ghost faces" (eigenfaces) that combine to form any face. Used in early facial recognition systems.

## Numerical Considerations

Computing eigenvalues for large matrices is a core problem in numerical linear algebra. Modern libraries use sophisticated algorithms.

#### QR Algorithm

The workhorse of eigenvalue computation. Repeatedly factors A = QR and computes RQ. Converges to upper triangular form with eigenvalues on diagonal.

#### Lanczos/Arnoldi

For sparse matrices. Builds a small subspace and computes eigenvalues there. Only needs matrix-vector products, not full matrix storage.

#### Numerical Stability Warning

Eigenvalue computation can be ill-conditioned. Small perturbations in A can cause large changes in eigenvalues (especially for non-symmetric matrices). Always use library functions (NumPy, SciPy, LAPACK) rather than implementing from scratch.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept