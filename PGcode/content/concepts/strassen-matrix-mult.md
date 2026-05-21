---
slug: strassen-matrix-mult
module: math
title: Strassen's Matrix Multiplication
subtitle: Multiply n×n matrices in O(n^2.807) by reducing 8 sub-multiplies to 7 via algebraic identity.
difficulty: Advanced
position: 15
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Strassen (1969) — Gaussian elimination is not optimal"
    url: ""
status: published
---

## intro
The naive matrix-multiplication algorithm is O(n^3): every entry of `C = A·B` is a dot product of n terms. In 1969 Strassen showed that 2×2 matrices can be multiplied with **7 multiplications instead of 8** — and applying that recursively to a divide-and-conquer matrix multiply drops the cost to **O(n^log_2 7) ≈ O(n^2.807)**. It was the first asymptotic improvement over O(n^3) and the foundation of the entire field of fast matrix multiplication.

## whyItMatters
Asymptotically faster than O(n^3) → meaningful at n = 1000+. Real BLAS implementations use Strassen-like recursion for big enough n with a base-case switch to the standard cubic algorithm (where cache locality wins). It's also the standard "look how mathematical insight beats brute force" example in algorithms courses.

In interviews, "can you do matrix multiplication faster than n^3?" is a senior-level signal. Even acknowledging Strassen's identity without writing the full algorithm shows depth.

## intuition
Split A and B into 2×2 blocks of size n/2:
```
A = [A11 A12]   B = [B11 B12]   C = [C11 C12] = A · B
    [A21 A22]       [B21 B22]       [C21 C22]
```
Naively, C requires 8 block multiplications (A11·B11, A11·B12, A12·B21, A12·B22, A21·B11, ...) and 4 block additions per quadrant. Strassen uses 7 products M1..M7 of cleverly-combined sums, then recovers each block of C with additions:

```
M1 = (A11 + A22)(B11 + B22)
M2 = (A21 + A22)B11
M3 = A11(B12 - B22)
M4 = A22(B21 - B11)
M5 = (A11 + A12)B22
M6 = (A21 - A11)(B11 + B12)
M7 = (A12 - A22)(B21 + B22)

C11 = M1 + M4 - M5 + M7
C12 = M3 + M5
C21 = M2 + M4
C22 = M1 - M2 + M3 + M6
```

Recurrence: `T(n) = 7·T(n/2) + O(n^2)` → master theorem → `O(n^log_2 7)`.

## visualization
```
Step 1: split A, B into 4 quadrants each (size n/2).
Step 2: compute 7 recursive multiplies M1..M7 (not 8 — that's the win).
Step 3: 18 additions/subtractions on the 4 output quadrants.

Standard:   8 multiplies + 4 adds → T(n) = 8T(n/2) + Θ(n²) → O(n³).
Strassen:   7 multiplies + 18 adds → T(n) = 7T(n/2) + Θ(n²) → O(n^2.807).
```

## bruteForce
`for i in range(n): for j in range(n): for k in range(n): C[i][j] += A[i][k] * B[k][j]`. O(n^3). Very cache-friendly with the right loop order, fast in practice up to n ~ 500.

## optimal
Strassen for the recursive structure; switch to naive at the base case (e.g., n ≤ 32 or 64) because the constant overhead of Strassen's 18 adds outweighs the savings at small sizes.

**Numerical stability**: Strassen has slightly worse numerical stability than the standard algorithm because of all the additions/subtractions on intermediate matrices. Real BLAS picks Strassen only when the loss is acceptable.

**Modern best**: theoretical record is O(n^2.371) by Williams et al. (2023). But the constants are astronomical — never used in practice.

## complexity
- **Time**: O(n^log_2 7) ≈ O(n^2.807).
- **Space**: O(n^2) — same as the output. Recursion uses O(n^2) temporary storage at each level; in-place variants exist.
- **Crossover with naive**: typically n = 64 to 256 depending on hardware; below that the naive is faster.

## pitfalls
- **Padding**: Strassen formally requires power-of-2 sizes. Pad with zeros to the next power of 2 (wastes up to 4× memory for an unfortunate size).
- **Memory allocation overhead**: naive Strassen recursion allocates many temporaries. Production implementations reuse buffers.
- **Numerical instability**: not safe for highly ill-conditioned matrices. Stick with standard algorithm in such cases.
- **Base case too large or too small**: tune empirically.

## interviewTips
- Asked "how would you multiply two huge matrices faster than n^3?" — Strassen.
- Mention that it works recursively, with a crossover to naive at small sizes.
- For "fastest known matrix multiplication" — current asymptotic record is O(n^2.371) (Williams et al. 2023), but say it's a theoretical result; production code uses Strassen or AlphaTensor-style auto-tuned algorithms.
- For senior interviews, compare with **FFT-based polynomial multiplication** (different problem, O(n log n)) and **Schönhage-Strassen** (integer multiplication, also Strassen-named).

## code.python
```python
import numpy as np

def strassen(A, B, threshold=64):
    n = len(A)
    if n <= threshold:
        return (np.array(A) @ np.array(B)).tolist()
    h = n // 2
    A11 = [row[:h] for row in A[:h]]
    A12 = [row[h:] for row in A[:h]]
    A21 = [row[:h] for row in A[h:]]
    A22 = [row[h:] for row in A[h:]]
    B11 = [row[:h] for row in B[:h]]
    B12 = [row[h:] for row in B[:h]]
    B21 = [row[:h] for row in B[h:]]
    B22 = [row[h:] for row in B[h:]]

    def add(X, Y):
        return [[X[i][j] + Y[i][j] for j in range(len(X))] for i in range(len(X))]
    def sub(X, Y):
        return [[X[i][j] - Y[i][j] for j in range(len(X))] for i in range(len(X))]

    M1 = strassen(add(A11, A22), add(B11, B22), threshold)
    M2 = strassen(add(A21, A22), B11, threshold)
    M3 = strassen(A11, sub(B12, B22), threshold)
    M4 = strassen(A22, sub(B21, B11), threshold)
    M5 = strassen(add(A11, A12), B22, threshold)
    M6 = strassen(sub(A21, A11), add(B11, B12), threshold)
    M7 = strassen(sub(A12, A22), add(B21, B22), threshold)

    C11 = add(sub(add(M1, M4), M5), M7)
    C12 = add(M3, M5)
    C21 = add(M2, M4)
    C22 = add(sub(add(M1, M3), M2), M6)

    C = [[0]*n for _ in range(n)]
    for i in range(h):
        for j in range(h):
            C[i][j] = C11[i][j]
            C[i][j + h] = C12[i][j]
            C[i + h][j] = C21[i][j]
            C[i + h][j + h] = C22[i][j]
    return C
```

## code.javascript
```javascript
// Sketch — same algorithm. In real JS code, prefer numeric libraries (TensorFlow.js, math.js).
```

## code.java
```java
// Sketch — same algorithm. Java BLAS bindings (JOML, OjAlgo) typically embed Strassen for large n.
```

## code.cpp
```cpp
// Sketch — production C++ uses Eigen, BLAS (OpenBLAS, MKL), each with hand-tuned Strassen + cubic kernels.
```
