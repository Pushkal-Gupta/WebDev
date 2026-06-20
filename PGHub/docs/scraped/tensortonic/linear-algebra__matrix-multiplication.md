---
source_url: https://tensortonic.com/ml-math/linear-algebra/matrix-multiplication
title: Matrix Multiplication: The Engine of Deep Learning | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

02/11

Linear Algebra

### Contents

IntroductionThe Dimension RuleThe Dot Product ViewRow and Column InterpretationsInteractive: Step-by-StepTransformation ViewKey PropertiesTranspose and ProductsSpecial MatricesBatched OperationsML ApplicationsComputational Cost

## Introduction

Every layer in a neural network, from simple feed-forward networks to GPT's attention blocks, is fundamentally matrix multiplication followed by non-linearities. Understanding matrix multiplication is essential to understanding deep learning.

Matrix multiplication is not just "multiplying numbers." It is **combining information** and **transforming space**.

### Prerequisites

Before diving in, make sure you understand [Dot Product and Norms](https://www.tensortonic.com/ml-math/linear-algebra/dot-norm). Matrix multiplication is essentially many dot products computed in parallel.

## The Dimension Rule

You cannot multiply any two matrices. Their dimensions must align in a specific way.

(m × n)×(n × p)=(m × p)

Inner dimensions must match. Result takes outer dimensions.

#### Valid ✓

(3 × 4) × (4 × 2) = (3 × 2)

#### Invalid ✗

(3 × 4) × (3 × 2) = ???

INNER DIMENSIONS DO NOT MATCH (4 ≠ 3)

#### Practical Tip

Dimension mismatch errors are one of the most common bugs in ML code. Always trace dimensions through your network architecture before implementing.

## The Dot Product View

Each element C\[i\]\[j\] in the result is the [dot product](https://www.tensortonic.com/ml-math/linear-algebra/dot-norm) of row i from A and column j from B.

Cij=∑k=1nAik⋅BkjC\_{ij} = \\sum\_{k=1}^{n} A\_{ik} \\cdot B\_{kj}Cij​=∑k=1n​Aik​⋅Bkj​

Walk along row i of A and column j of B simultaneously, multiplying and summing.

### Intuition

Think of it as asking: "How much does row i of A align with column j of B?" High alignment means a large value in C\[i\]\[j\].

## Row and Column Interpretations

There are multiple ways to think about matrix multiplication beyond the element-by-element view.

#### Column View

Each column of C is a linear combination of columns of A, with coefficients from the corresponding column of B.

C:,j=∑kBkj⋅A:,kC\_{:,j} = \\sum\_{k} B\_{kj} \\cdot A\_{:,k}C:,j​=∑k​Bkj​⋅A:,k​

#### Row View

Each row of C is a linear combination of rows of B, with coefficients from the corresponding row of A.

Ci,:=∑kAik⋅Bk,:C\_{i,:} = \\sum\_{k} A\_{ik} \\cdot B\_{k,:}Ci,:​=∑k​Aik​⋅Bk,:​

#### Outer Product View

C is the sum of outer products of columns of A with rows of B.

C=∑kA:,k⊗Bk,:C = \\sum\_{k} A\_{:,k} \\otimes B\_{k,:}C=∑k​A:,k​⊗Bk,:​

## Interactive: Step-by-Step

Step through the multiplication of a 2×3 matrix by a 3×2 matrix. Watch how each result cell is computed as a dot product.

### Matrix Multiplication

Target Cell = Row A · Col B

Step 1 / 4

A \[2×3\]

1

2

3

4

5

6

×

B \[3×2\]

7

8

9

10

11

12

=

C \[2×2\]

58

OperationRow 1·Col 1

A×B

1·7

7

+

A×B

2·9

18

+

A×B

3·11

33

=

Sum

58

Play Animation

## Transformation View

Think of a matrix as a **function** that transforms vectors. This geometric perspective is crucial for understanding deep learning.

If **x** is a point in space, **Ax** moves that point. The matrix stretches, rotates, shears, and reflects space.

(AB)x=A(Bx)(AB)\\mathbf{x} = A(B\\mathbf{x})(AB)x=A(Bx)

AB is a single transformation: apply B first, then A.

#### Rotation

Orthogonal matrices rotate vectors without changing their length.

#### Scaling

Diagonal matrices scale each axis independently.

#### Projection

Some matrices project onto lower-dimensional subspaces.

#### Shearing

Off-diagonal elements create shearing effects.

## Key Properties

### Non-Commutative

AB≠BAAB \\neq BAAB=BA

Order matters! AB and BA often have different dimensions or values. Rotating then scaling is different from scaling then rotating.

#### Associative

(AB)C=A(BC)(AB)C = A(BC)(AB)C=A(BC)

Choose multiplication order for efficiency.

#### Distributive

A(B+C)=AB+ACA(B + C) = AB + ACA(B+C)=AB+AC

## Transpose and Products

The transpose operation (swapping rows and columns) interacts with multiplication in important ways.

#### The Transpose Rule

(AB)T=BTAT(AB)^T = B^T A^T(AB)T=BTAT

Order reverses! Critical in backpropagation derivation.

#### Gram Matrix

G=ATAG = A^T AG=ATA

Always symmetric positive semi-definite. Used in style transfer.

## Special Matrices

#### Diagonal

Only diagonal elements are non-zero. Scale O(n).

#### Orthogonal

QTQ=IQ^T Q = IQTQ=I

Preserves lengths and angles (rotation/reflection).

#### Symmetric

A=ATA = A^TA=AT

Has real eigenvalues. Hessian matrices are symmetric.

#### Sparse

Most elements are zero. Efficient storage/compute.

## Batched Operations

In deep learning, we rarely multiply single matrices. We work with batches of data processed in parallel.

### Batch Matrix Multiplication

(B×M×N)⋅(B×N×P)=(B×M×P)(B \\times M \\times N) \\cdot (B \\times N \\times P) = (B \\times M \\times P)(B×M×N)⋅(B×N×P)=(B×M×P)

B independent matrix multiplications happen in parallel. This is how a batch of inputs flows through a neural network layer simultaneously.

### Batch Matrix Multiplication

B independent multiplications in parallel

Animate Batch

(4×2×3)⋅(4×3×2)=(4×2×2)

Select Batch:0123

A Batch

2×3

×

B Batch

3×2

=

C Batch

2×2

Batch 0: Detailed Computation

A\[0\]

1

2

3

4

5

6

×

B\[0\]

1

2

0

1

1

0

=

C\[0\]

4

4

10

13

#### GPU Parallelism

All 4 matrix multiplications execute **simultaneously** on GPU. This is why batch size matters for training throughput.

#### Neural Network Inference

A batch of inputs flows through each layer in parallel.`torch.bmm()` does exactly this.

## ML Applications

### Neural Network Layer

Y=activation(XW+b)Y = \\text{activation}(XW + b)Y=activation(XW+b)

The core building block of MLP, RNN, and Transformer networks.

### Attention Mechanism

Attn=softmax(QKTd)V\\text{Attn} = \\text{softmax}(\\frac{QK^T}{\\sqrt{d}})VAttn=softmax(d​QKT​)V

Self-attention is purely matrix multiplication.

### Convolution (im2col)

CNNs use **im2col** to convert convolution into matrix multiplication to leverage fast GPU GEMM kernels.

### Embedding Lookup

Mathematically equivalent to multiplying a one-hot vector with an embedding matrix.

## Computational Cost

For two n×nn \\times nn×n matrices, naive multiplication requires O(n3)O(n^3)O(n3) operations. This cubic scaling is a fundamental constraint in deep learning.

Naive

O(n3)O(n^3)O(n3)

Strassen

O(n2.81)O(n^{2.81})O(n2.81)

Theoretical

O(n2.37)O(n^{2.37})O(n2.37)

### Implication

Doubling layer width (512 to 1024) increases compute by **8x** (232^323). This is why model scaling is expensive. GPUs maximize throughput, but the O(n³) complexity remains.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept