---
source_url: https://tensortonic.com/ml-math/linear-algebra/pca
title: Principal Component Analysis (PCA): Complete Guide | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

10/11

Linear Algebra

### Contents

IntroductionCurse of DimensionalityThe Core IntuitionInteractive: PCACovariance MatrixMathematical DerivationThe AlgorithmChoosing K ComponentsInteractive: Scree PlotReconstruction ErrorCentering & ScalingML ApplicationsPCA VariantsLimitations

## Introduction

Real-world datasets are often high-dimensional. A customer might be described by 500 features: age, income, location, browsing history, purchase frequency, click patterns, and hundreds more. Many of these features are redundant or highly correlated (annual income and tax paid, for instance).

**Principal Component Analysis (PCA)** is an unsupervised technique that transforms a large set of correlated variables into a smaller set of uncorrelated variables called **Principal Components**. These new variables are ordered: PC1 captures the most variance, PC2 captures the second most (while being orthogonal to PC1), and so on.

### What PCA Does

- **Dimensionality Reduction:** Compress 1000 features into 50 while keeping 95% of the information.
- **Decorrelation:** Transform correlated features into uncorrelated principal components.
- **Noise Filtering:** Lower PCs often capture noise; discarding them cleans the data.
- **Feature Extraction:** PCs can reveal hidden structure (clusters, patterns) not obvious in original features.

#### Prerequisites

PCA relies heavily on [eigenvalues and eigenvectors](https://www.tensortonic.com/ml-math/linear-algebra/eigenvalue-eigenvector). Make sure you understand these concepts before diving deep. The covariance matrix concept builds on [dot products](https://www.tensortonic.com/ml-math/linear-algebra/dot-norm) and [matrix multiplication](https://www.tensortonic.com/ml-math/linear-algebra/matrix-multiplication).

## The Curse of Dimensionality

Why do we need dimensionality reduction at all? The **curse of dimensionality** describes several problems that arise when working with high-dimensional data:

#### 1\. Data Becomes Sparse

In high dimensions, data points spread out. To maintain the same density, you need exponentially more samples. A dataset that feels "dense" in 2D becomes incredibly sparse in 100D.

#### 2\. Distance Metrics Break Down

In high dimensions, the difference between the nearest and farthest neighbor becomes negligible. All points appear roughly equidistant, making distance-based algorithms (KNN, clustering) unreliable.

lim⁡d→∞distmax−distmindistmin→0\\lim\_{d \\to \\infty} \\frac{\\text{dist}\_{max} - \\text{dist}\_{min}}{\\text{dist}\_{min}} \\to 0limd→∞​distmin​distmax​−distmin​​→0

#### 3\. Overfitting Risk

More features means more parameters to fit. With limited data, models memorize noise rather than learning true patterns. This is why [regularization](https://www.tensortonic.com/ml-math/linear-algebra/dot-norm) and dimensionality reduction are crucial.

#### 4\. Computational Cost

Many algorithms have complexity O(n·d²) or worse. Reducing d from 10,000 to 100 can speed up training by 10,000×.

## The Core Intuition

Imagine a 3D cloud of points shaped like a flat pancake floating diagonally in space. Looking at it from different angles gives you very different amounts of information:

#### Bad View (Edge)

Pancake looks like a line. Lost 2 dimensions of information.

#### Medium View (Diagonal)

See some structure but distorted.

#### Best View (Top-Down)

See the full pancake spread. Maximum information!

**PCA mathematically finds that "best view."** It rotates the coordinate system so that:

- PC1: The direction where data is most spread out (maximum variance). This is the "length" of the pancake.
- PC2: The direction with second-most spread, strictly **perpendicular** to PC1. This is the "width."
- PC3: Perpendicular to both, capturing remaining variance. This is the "thickness" (usually small for a pancake).

#### Variance = Information

In PCA, we equate "spread" (variance) with "information." If a variable has zero variance (everyone has the same value), it tells us nothing. We want to preserve directions where data varies the most.

## Interactive: PCA in Action

This visualization shows correlated 2D data. Click "Show PC Axes" to see how PCA identifies the directions of maximum variance. Then project the data onto just PC1 to see dimensionality reduction in action.

### PCA Live View

Finding direction of max spread.

#### View Controls

Show Principal Axes

Project onto PC1

* * *

#### Data Synthesis

New Data

Correlation0.85

Spread / Noise1.5

#### Explained Variance

PC1 (Kept)97.0%

PC2 (Discarded)3.0%

**How to use:** Adjust the **correlation** to shape the data cloud. Enable **Show Principal Axes** to see how PCA identifies the angle of maximum variance (Emerald vector). Click **Project onto PC1** to visualize dimensionality reduction: points slide down their "residual lines" (dashed) to land on the PC1 axis, minimizing the information lost.

## The Covariance Matrix

PCA is fundamentally about the [covariance matrix](https://www.tensortonic.com/ml-math/probability/covariance-matrix), which captures how variables vary together.

Covariance Definition

Cov(X,Y)=1n−1∑i=1n(xi−xˉ)(yi−yˉ)\\text{Cov}(X, Y) = \\frac{1}{n-1} \\sum\_{i=1}^{n} (x\_i - \\bar{x})(y\_i - \\bar{y})Cov(X,Y)=n−11​∑i=1n​(xi​−xˉ)(yi​−yˉ​)

#### Cov > 0

X and Y increase together

#### Cov < 0

When X increases, Y decreases

#### Cov = 0

X and Y are uncorrelated

#### The Covariance Matrix

For a dataset with d features, the covariance matrix Σ is a d×d symmetric matrix:

Σ=1n−1XTX\\Sigma = \\frac{1}{n-1} X^T XΣ=n−11​XTX

where X is the centered data matrix (each column has mean 0). Entry Σᵢⱼ is the covariance between feature i and feature j. Diagonal entries are variances.

#### Why the Covariance Matrix?

The covariance matrix encodes all pairwise relationships in your data. Its [eigenvectors](https://www.tensortonic.com/ml-math/linear-algebra/eigenvalue-eigenvector) point in the directions of maximum variance (principal components), and its eigenvalues tell us how much variance each direction captures.

### Interactive Covariance Matrix

Click any cell to see the relationship between features

Correlation Strength0.7

Covariance Matrix Σ\\SigmaΣ(4×4)

Age

Income

Spending

Savings

Age

1.00var0.210.280.35

Income

0.211.00var0.560.42

Spending

0.280.561.00var-0.21

Savings

0.350.42-0.211.00var

Positive

Negative

~Zero

Click any cell in the matrix

to explore the relationship

#### Diagonal = Variance

Σii\\Sigma\_{ii}Σii​ measures how much feature i varies

#### Off-diagonal = Covariance

Σij\\Sigma\_{ij}Σij​ measures how features i and j vary together

#### Symmetric Matrix

Σij=Σji\\Sigma\_{ij} = \\Sigma\_{ji}Σij​=Σji​ — only need upper triangle

## Mathematical Derivation

How do we mathematically find the direction of maximum variance? This is a constrained optimization problem.

#### The Optimization Problem

We want to find a unit vector w\\mathbf{w}w that maximizes the variance of the projected data:

max⁡∣∣w∣∣=1Var(Xw)=max⁡∣∣w∣∣=1wTΣw\\max\_{\|\|\\mathbf{w}\|\|=1} \\text{Var}(X\\mathbf{w}) = \\max\_{\|\|\\mathbf{w}\|\|=1} \\mathbf{w}^T \\Sigma \\mathbf{w}max∣∣w∣∣=1​Var(Xw)=max∣∣w∣∣=1​wTΣw

We constrain \|\|w\|\| = 1 to avoid trivially maximizing by scaling w infinitely.

1\. Form the Lagrangian:

L=wTΣw−λ(wTw−1)\\mathcal{L} = \\mathbf{w}^T \\Sigma \\mathbf{w} - \\lambda(\\mathbf{w}^T \\mathbf{w} - 1)L=wTΣw−λ(wTw−1)

2\. Take derivative and set to zero:

2Σw−2λw=02\\Sigma\\mathbf{w} - 2\\lambda\\mathbf{w} = 02Σw−2λw=0

**3\. This gives us the eigenvalue equation:**

Σw=λw\\Sigma \\mathbf{w} = \\lambda \\mathbf{w}Σw=λw

#### Key Insight

The optimal w is an **eigenvector** of the covariance matrix! Substituting back: w^T Σ w = λ\|\|w\|\|² = λ. The variance along direction w equals the eigenvalue λ. To maximize variance, we pick the eigenvector with the **largest eigenvalue**. This is **PC1**. For PC2, we take the eigenvector with the second-largest eigenvalue (which is automatically orthogonal for symmetric matrices).

## The PCA Algorithm

#### Step 1: Standardize

Features have different scales (salary in thousands, age in tens). Standardize so each has mean 0 and variance 1:

zij=xij−μjσjz\_{ij} = \\frac{x\_{ij} - \\mu\_j}{\\sigma\_j}zij​=σj​xij​−μj​​

Without standardization, high-variance features dominate PCs regardless of importance.

#### Step 2: Compute Covariance Matrix

Calculate the d×d covariance (or correlation) matrix:

Σ=1n−1ZTZ\\Sigma = \\frac{1}{n-1} Z^T ZΣ=n−11​ZTZ

#### Step 3: Eigendecomposition

Compute [eigenvalues and eigenvectors](https://www.tensortonic.com/ml-math/linear-algebra/eigenvalue-eigenvector). Sort by eigenvalue (largest first).

#### Step 4: Select Top k Components

Choose k principal components based on explained variance (see next section). Form projection matrix W = \[v₁ \| v₂ \| ... \| vₖ\] of shape d×k.

#### Step 5: Project Data

Transform the original data into the new k-dimensional space:

Y=ZWY = ZWY=ZW

Y is n×k: each row is a data point in the new coordinate system.

## Choosing K Components

How many principal components should we keep? We use the **explained variance ratio**:

Explained Variance Ratio of PCi=λi∑j=1dλj\\text{Explained Variance Ratio of PC}\_i = \\frac{\\lambda\_i}{\\sum\_{j=1}^{d} \\lambda\_j}Explained Variance Ratio of PCi​=∑j=1d​λj​λi​​

This tells us what fraction of total variance is captured by the i-th principal component.

#### Scree Plot

Plot eigenvalues vs. component number. Look for an "elbow" where the curve flattens. Components after the elbow add little new information.

#### Cumulative Variance

Plot cumulative explained variance vs. k. Choose k where you reach your target (e.g., 95% variance). Common thresholds: 90%, 95%, 99%.

#### Example Calculation

Suppose eigenvalues are \[4.5, 2.3, 1.1, 0.8, 0.2, 0.1\]. Total = 9.0.

PC1: 4.5/9 = 50.0%

PC2: 2.3/9 = 25.6% (cumulative: 75.6%)

PC3: 1.1/9 = 12.2% (cumulative: 87.8%)

PC4: 0.8/9 = 8.9% (cumulative: 96.7%)

Keeping 4 components captures 96.7% of variance while reducing from 6 to 4 dimensions.

## Interactive: Scree Plot

Explore how eigenvalues determine explained variance. Adjust the threshold to see how many components you need to reach different variance targets.

### Scree Plot & Variance Explained

Select target variance to see strictly needed components.

Target

90%

100%75%50%25%0%

Target: 90%

Component 1

Individual: 42.4%

Cumulative: 42.4%

Eigenvalue: 5.20

Component 2

Individual: 25.3%

Cumulative: 67.8%

Eigenvalue: 3.10

Component 3

Individual: 14.7%

Cumulative: 82.4%

Eigenvalue: 1.80

Component 4

Individual: 7.3%

Cumulative: 89.8%

Eigenvalue: 0.90

Component 5

Individual: 4.1%

Cumulative: 93.9%

Eigenvalue: 0.50

Component 6

Individual: 2.4%

Cumulative: 96.3%

Eigenvalue: 0.30

Component 7

Individual: 1.6%

Cumulative: 98.0%

Eigenvalue: 0.20

Component 8

Individual: 0.8%

Cumulative: 98.8%

Eigenvalue: 0.10

Component 9

Individual: 0.8%

Cumulative: 99.6%

Eigenvalue: 0.10

Component 10

Individual: 0.4%

Cumulative: 100.0%

Eigenvalue: 0.05

12345678910

Principal Components

Dimensions

10→5

Reduced by 5 dimensions

Explained Variance

93.9%

Information retained

Eigenvalues

Sum (trace):12.3

Kept Sum:11.5

## Reconstruction Error

After projecting to k dimensions, we can reconstruct an approximation of the original data:

X^=YWT=ZWWT\\hat{X} = Y W^T = Z W W^TX^=YWT=ZWWT

The reconstruction error measures how much information was lost:

Error=∣∣X−X^∣∣F2=∑i=k+1dλi\\text{Error} = \|\|X - \\hat{X}\|\|^2\_F = \\sum\_{i=k+1}^{d} \\lambda\_iError=∣∣X−X^∣∣F2​=∑i=k+1d​λi​

The error equals the sum of discarded eigenvalues. This is why keeping top eigenvalues minimizes reconstruction error.

## Centering & Scaling

Proper preprocessing is critical for PCA to work correctly.

#### Centering (Required)

Subtract the mean from each feature. This ensures PCA finds directions of maximum variance around the data center, not around the origin.

#### Scaling (Usually Recommended)

Divide by standard deviation. Without scaling, features with larger units dominate. Exception: if all features are in the same units (e.g., all pixels), scaling may not be needed.

#### Warning: Scale Matters!

If you have "height in cm" and "weight in kg," height will have much larger variance due to units. PCA will think height is more important. Always standardize when features have different scales.

## ML Applications

### Eigenfaces (Face Recognition)

Images are extremely high-dimensional (100×100 = 10,000 pixels). PCA on a face dataset yields "eigenfaces," which are the principal components of facial variation. Any face can be reconstructed as a weighted sum of just a few hundred eigenfaces, enabling efficient storage and recognition.

### Preprocessing for Classification

Before training classifiers on high-dimensional data, apply PCA to reduce features from thousands to hundreds. This speeds up training, reduces overfitting, and often improves accuracy by removing noise.

### Visualization (2D/3D)

To visualize clusters in 50D data, project to 2D using the top 2 PCs. While you lose information, the retained dimensions capture the most variance, often revealing cluster structure.

### Anomaly Detection

Project data to k PCs and reconstruct. Normal points reconstruct well; anomalies have high reconstruction error because they don't fit the learned patterns.

### Finance (Factor Models)

Stock returns are correlated. PCA extracts "market factors": PC1 is often the overall market (all stocks move together), PC2 might be sector rotation. Quants use these for risk modeling and portfolio optimization.

## PCA Variants

Standard PCA has limitations. Several variants address specific needs:

#### Kernel PCA

Uses kernel trick to perform PCA in a higher-dimensional feature space. Can capture nonlinear relationships. Good for data that lies on curved manifolds.

#### Incremental PCA

Processes data in batches, useful when the full dataset doesn't fit in memory. Approximates standard PCA.

#### Sparse PCA

Adds [L1 regularization](https://www.tensortonic.com/ml-math/linear-algebra/dot-norm) to produce sparse loadings (many zeros). More interpretable: each PC uses only a few original features.

#### Robust PCA

Separates data into low-rank (signal) and sparse (outliers) components. More robust to corrupted data.

#### Probabilistic PCA

Formulates PCA as a latent variable model. Allows handling missing data and provides uncertainty estimates.

## Limitations

#### Linear Only

PCA finds linear combinations. If data lies on a curved manifold (swiss roll, sphere), PCA cannot "unfold" it. Use kernel PCA, t-SNE, or UMAP for nonlinear dimensionality reduction.

#### Interpretability

PCs are mixtures: PC1 might be "0.4 × age + 0.3 × income - 0.2 × debt + ...". Explaining what PC1 "means" to stakeholders is challenging. For interpretable features, consider feature selection or Sparse PCA.

#### Variance ≠ Importance

PCA maximizes variance, not predictive power. A direction with high variance might be noise. For supervised tasks, consider PLS (Partial Least Squares) which finds directions correlated with the target.

#### Outlier Sensitivity

Outliers inflate variance in their direction, pulling PCs toward them. Preprocess data to remove or clip outliers, or use Robust PCA.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept