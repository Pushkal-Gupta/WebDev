---
slug: la-matrix-as-transformation
module: linear-algebra
title: A Matrix Is a Transformation
subtitle: Forget the grid of numbers — a matrix moves space, and its columns say where the basis vectors land.
difficulty: Beginner
position: 2
estimatedReadMinutes: 11
prereqs: [la-vectors-spaces]
relatedProblems: []
references:
  - title: "3Blue1Brown — Essence of Linear Algebra, Chapter 3: Linear transformations and matrices"
    url: "https://www.youtube.com/watch?v=kYB8IZa5AuE"
    type: video
  - title: "Khan Academy — Matrix transformations"
    url: "https://www.khanacademy.org/math/linear-algebra/matrix-transformations"
    type: course
status: published
---

## intro
A matrix looks like a static grid of numbers, but that is the least useful way to see it. A matrix is a **function that moves space** — it takes every vector to a new vector while keeping the grid lines straight, evenly spaced, and the origin fixed. The single most important fact, the one that turns the whole subject from arithmetic into geometry, is this: the columns of a matrix tell you exactly where the basis vectors \(\hat{\imath}\) and \(\hat{\jmath}\) end up. Read the columns and you can picture the entire transformation.

## whyItMatters
Almost every operation you care about is a linear transformation in disguise. Rotating a 3D model, projecting a shadow onto the ground, scaling an image, shearing italics out of upright text, mapping camera space to screen space — all are matrices applied to vertices. In machine learning, a dense neural-network layer is literally a matrix multiply followed by a bias and a nonlinearity; the weights *are* a transformation reshaping the feature space so the next layer can separate the data more easily. Solving systems of equations, fitting lines to data, compressing images with PCA, simulating Markov chains — each reduces to "apply this matrix" or "undo this matrix." Once you internalize that a matrix is a verb (it acts) rather than a noun (a table), matrix multiplication stops being a memorized rule and becomes the obvious answer to "what happens if I do one transformation, then another?"

## intuition
Linearity is the whole game, and it boils down to one promise: the transformation respects addition and scaling. If \(T\) is linear, then \(T(s\mathbf{v} + t\mathbf{w}) = s\,T(\mathbf{v}) + t\,T(\mathbf{w})\). Visually this is the "grid lines stay straight and evenly spaced, origin fixed" rule. That promise is astonishingly restrictive — and that is what makes matrices so cheap. Because any vector is a linear combination of basis vectors, \((x, y) = x\hat{\imath} + y\hat{\jmath}\), linearity forces \(T(x, y) = x\,T(\hat{\imath}) + y\,T(\hat{\jmath})\). So to know what \(T\) does to *every* vector in the plane, you only need to record what it does to *two* vectors. Store \(T(\hat{\imath})\) as the first column and \(T(\hat{\jmath})\) as the second column, and you have completely captured the transformation. That grid of four numbers is the matrix.

This is why the matrix-times-vector rule is what it is, not an arbitrary convention. Take \(M = \begin{bmatrix} a & b \\ c & d \end{bmatrix}\). Its first column \((a, c)\) is the landing spot of \(\hat{\imath}\); its second column \((b, d)\) is where \(\hat{\jmath}\) goes. Applying it to \((x, y)\) means "scale the new \(\hat{\imath}\) by \(x\), scale the new \(\hat{\jmath}\) by \(y\), add": \(x(a, c) + y(b, d) = (ax + by, cx + dy)\). The mysterious dot-product-of-rows recipe is just that linear combination written out.

Concrete examples lock it in. A \(90^\circ\) counterclockwise rotation sends \(\hat{\imath} = (1,0)\) to \((0, 1)\) and \(\hat{\jmath} = (0,1)\) to \((-1, 0)\), so its matrix is \(\begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix}\). A horizontal shear leaves \(\hat{\imath}\) put and slides \(\hat{\jmath}\) rightward to \((1, 1)\), giving \(\begin{bmatrix} 1 & 1 \\ 0 & 1 \end{bmatrix}\). Stretch space by 2 in \(x\) only: \(\begin{bmatrix} 2 & 0 \\ 0 & 1 \end{bmatrix}\). In each case you build the matrix by drawing where the two basis arrows land — no formula memorization required.

Now the punchline about **composition**. Apply transformation \(A\) and then \(B\); the combined effect is another matrix, and it equals the product \(BA\) (right-to-left, because \(A\) acts first). Matrix multiplication *is* function composition. This explains why multiplication is associative (chaining is) but not commutative (rotating then shearing differs from shearing then rotating — try it on a square and the results visibly disagree). The \(i,j\) entry of \(BA\) being a row-times-column sum is exactly "track where \(\hat{\jmath}\) goes under \(A\), then push that through \(B\)."

## visualization
```
   before                applied M = [ 1  1 ]        what the columns say
                                     [ 0  1 ]  (shear)

   j ^                    j' lands at (1,1)            col 1 -> where i-hat goes
   | |  square              \                          col 2 -> where j-hat goes
   | |____                   \____                     [ a b ]   i-hat -> (a,c)
   | |    |        ===>        \    \                   [ c d ]   j-hat -> (b,d)
   +-+----+--> i             +--\----\--> i
   o   i-hat stays put       o  i-hat unchanged
   grid stays straight, evenly spaced, origin pinned  => the map is LINEAR
```

## bruteForce
The naive way to apply a transformation is to **write out the algebra for each output coordinate by hand** every time: "the new x is \(ax + by\), the new y is \(cx + dy\)," recomputed from scratch per point and per transformation. It is correct but it scales horribly. If you want to rotate, then shear, then scale a thousand vertices, doing it as three separate hand-substitutions per vertex is three thousand error-prone passes, and you never notice that the three transformations could have been *fused* into one. The same brute force in higher dimensions — manually expanding a \(4 \times 4\) times a \(4\)-vector for every vertex in a mesh — is exactly the trap that motivated treating transformations as composable objects.

## optimal
The elegant move is to **precompose transformations into a single matrix, then apply that one matrix everywhere**. Because composition equals multiplication, the chain "scale after shear after rotate" is the single product \(S \cdot H \cdot R\), computed once. Then transforming any vector — or a whole batch of vectors stacked as columns of a matrix — is one matrix multiply. This is precisely how GPUs and graphics pipelines work: combine model, view, and projection into one matrix on the CPU, ship it to the GPU, and let it hit every vertex in parallel. The cost of applying an \(n \times n\) matrix to one vector is \(O(n^2)\); composing two matrices is \(O(n^3)\), but you pay that once and reuse it across millions of points.

Why this dominates the brute-force route: it separates "design the transformation" (compose matrices, done once) from "apply the transformation" (one multiply per vector), it makes the non-commutativity explicit so you order operations deliberately, and it lets you reason about and invert the whole pipeline as a single object. The matrix-multiply kernel is also the most heavily optimized routine in all of computing (BLAS, cuBLAS), so reducing your work to a multiply means free access to decades of tuning. The conceptual win is that you stop thinking in coordinates and start thinking in transformations that snap together like Lego.

```python
import numpy as np

R = np.array([[0, -1], [1, 0]])      # 90-degree rotation
H = np.array([[1, 1], [0, 1]])       # horizontal shear
M = H @ R                             # rotate FIRST, then shear (right-to-left)

square = np.array([[0, 1, 1, 0],      # the unit square's corners as columns
                   [0, 0, 1, 1]])
print(M @ square)                     # all four corners transformed in one multiply
```

## complexity
time: O(n^2) to apply an n x n matrix to a vector; O(n^3) to compose (multiply) two matrices; O(kn^2) to transform k vectors with a precomposed matrix
space: O(n^2) to store a transformation
notes: Composing once and reusing turns k transforms-of-a-chain over m vectors from O(k m n^2) into O(n^3 + m n^2). Matrix multiply is the most optimized kernel in computing (BLAS/cuBLAS), so reducing work to a multiply is almost always the right call.

## pitfalls
- Treating a matrix as a passive table of numbers instead of an action on space. The columns are landing spots of basis vectors — read them geometrically.
- Getting composition order backward. \(BA\) means "apply \(A\) first, then \(B\)" because it acts on a vector to its right: \((BA)\mathbf{v} = B(A\mathbf{v})\).
- Assuming multiplication commutes. \(AB \neq BA\) in general; rotate-then-shear visibly differs from shear-then-rotate.
- Confusing the rows and columns. Output coordinate \(i\) is row \(i\) dotted with the input; but the *geometric* reading (where basis vectors land) is by column. Mixing these flips your matrix.
- Forgetting that a transformation with linearly dependent columns squashes space into a lower dimension — it is not invertible, and information is lost (see the determinant concept).

## interviewTips
- State the headline immediately: "the columns of the matrix are where the basis vectors land." It signals you understand matrices geometrically, not just as arithmetic.
- Derive the matrix-vector rule from linearity if asked why it works — \(T(x,y) = xT(\hat{\imath}) + yT(\hat{\jmath})\) is the whole proof.
- Explain matrix multiplication as function composition; this immediately justifies associativity and the lack of commutativity without memorizing properties.

## keyTakeaways
- A matrix is a linear transformation of space; its columns record where the basis vectors \(\hat{\imath}\) and \(\hat{\jmath}\) land.
- Matrix-times-vector is just the linear combination "x times new-i plus y times new-j"; the row-by-column recipe is that written out.
- Matrix multiplication is function composition (right-to-left), which is why it is associative but not commutative — compose once, then apply everywhere.

## code.python
```python
def matmul(A, B):
    """Multiply two matrices = compose two linear transformations."""
    n, m, p = len(A), len(B), len(B[0])
    out = [[0] * p for _ in range(n)]
    for i in range(n):
        for k in range(m):
            a = A[i][k]
            for j in range(p):
                out[i][j] += a * B[k][j]
    return out

R = [[0, -1], [1, 0]]      # 90-degree rotation
H = [[1, 1], [0, 1]]       # shear
print(matmul(H, R))         # [[1, -1], [1, 0]] -- rotate then shear, one matrix
```

## code.javascript
```javascript
function matmul(A, B) {
  const n = A.length, m = B.length, p = B[0].length;
  const out = Array.from({ length: n }, () => new Array(p).fill(0));
  for (let i = 0; i < n; i++)
    for (let k = 0; k < m; k++)
      for (let j = 0; j < p; j++)
        out[i][j] += A[i][k] * B[k][j];
  return out;
}

const R = [[0, -1], [1, 0]];   // rotation
const H = [[1, 1], [0, 1]];    // shear
console.log(matmul(H, R));      // [[1, -1], [1, 0]]
```

## code.java
```java
import java.util.Arrays;

public class MatrixTransform {
    static double[][] matmul(double[][] A, double[][] B) {
        int n = A.length, m = B.length, p = B[0].length;
        double[][] out = new double[n][p];
        for (int i = 0; i < n; i++)
            for (int k = 0; k < m; k++)
                for (int j = 0; j < p; j++)
                    out[i][j] += A[i][k] * B[k][j];
        return out;
    }

    public static void main(String[] args) {
        double[][] R = {{0, -1}, {1, 0}};
        double[][] H = {{1, 1}, {0, 1}};
        System.out.println(Arrays.deepToString(matmul(H, R))); // [[1.0, -1.0], [1.0, 0.0]]
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <vector>

using Mat = std::vector<std::vector<double>>;

Mat matmul(const Mat& A, const Mat& B) {
    int n = A.size(), m = B.size(), p = B[0].size();
    Mat out(n, std::vector<double>(p, 0.0));
    for (int i = 0; i < n; ++i)
        for (int k = 0; k < m; ++k)
            for (int j = 0; j < p; ++j)
                out[i][j] += A[i][k] * B[k][j];
    return out;
}

int main() {
    Mat R = {{0, -1}, {1, 0}};
    Mat H = {{1, 1}, {0, 1}};
    Mat M = matmul(H, R);
    std::printf("[[%g, %g], [%g, %g]]\n", M[0][0], M[0][1], M[1][0], M[1][1]); // [[1, -1], [1, 0]]
    return 0;
}
```
