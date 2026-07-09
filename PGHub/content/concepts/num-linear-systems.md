---
slug: num-linear-systems
module: numerical-methods
title: Solving Linear Systems Ax = b
subtitle: Why you never compute the inverse — and how pivoting, LU, and a single number called the condition number decide whether your answer is trustworthy.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Trefethen & Bau — Numerical Linear Algebra (SIAM, 1997)"
    url: "https://epubs.siam.org/doi/book/10.1137/1.9780898719574"
    type: book
  - title: "Numerical Recipes, 3rd ed."
    url: "https://numerical.recipes/"
    type: book
  - title: "MIT OCW 18.06 Linear Algebra (Gilbert Strang)"
    url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/"
    type: course
---

## intro
Almost every serious numerical computation eventually reduces to solving \(Ax=b\): a square matrix \(A\), a known right-hand side \(b\), and an unknown vector \(x\) you must recover. Circuit simulation, structural analysis, curve fitting, the linear step inside Newton's method, the pressure solve in a fluid simulator — all of them hand you a linear system and ask for \(x\). The naive schoolbook approach is Cramer's rule or forming \(A^{-1}\), and both are traps: one is astronomically slow, the other is numerically reckless. The professional answer is factorization plus back substitution, guarded by pivoting and judged by a single diagnostic number.

## whyItMatters
Linear systems are the innermost loop of scientific computing, and how you solve them decides whether a simulation finishes in seconds or hours, and whether its answer is meaningful or noise. Finite-element and finite-difference discretizations turn PDEs into enormous sparse systems; least-squares regression solves the normal equations; every iteration of Newton's method for nonlinear problems solves a linear system; Kalman filters, graph Laplacians, and interior-point optimizers all live and die on a fast, stable \(Ax=b\). Getting this wrong is expensive in two directions at once. Choose a slow method and you cannot scale past toy sizes. Ignore conditioning and pivoting and you get an answer that looks plausible but is dominated by round-off — the silent, dangerous failure mode. Understanding factorization, stability, and the condition number is what separates code that merely runs from code you can trust with a bridge, an aircraft wing, or a financial model.

## intuition
Solving \(Ax=b\) is really the geometry of intersecting hyperplanes: each row of \(A\) with its entry of \(b\) is one linear equation, one flat surface in \(n\)-dimensional space, and \(x\) is the single point where all \(n\) surfaces meet. **Gaussian elimination** finds that point by systematically simplifying the picture. You use the first equation to eliminate the first unknown from every equation below it, then the second equation to eliminate the second unknown from everything below that, and so on. When you finish, the matrix is **upper triangular**: the last equation involves only \(x_n\), so you read it off directly, substitute it up into the second-to-last equation to get \(x_{n-1}\), and continue upward. That final upward sweep is **back substitution**.

The elimination step multiplies each lower row by a factor and subtracts it, and those multipliers are exactly what **LU factorization** records. Elimination silently computes \(A=LU\), where \(L\) is lower triangular (the multipliers, with ones on the diagonal) and \(U\) is the upper-triangular result. Once you have \(L\) and \(U\), solving \(Ax=b\) becomes two cheap triangular solves: forward-solve \(Ly=b\), then back-solve \(Ux=y\). The payoff is reuse — if you must solve for ten different right-hand sides \(b\) with the same \(A\), you factor once in \(O(n^3)\) and then each solve costs only \(O(n^2)\).

There is a catch that makes naive elimination unsafe. The multiplier for a row is the entry you are eliminating divided by the **pivot** on the diagonal. If that pivot is tiny — or exactly zero — you divide by something near nothing, the multipliers explode, and round-off error gets amplified catastrophically. **Partial pivoting** fixes this: before each elimination step, swap rows so the largest-magnitude available entry in the current column sits on the diagonal. This keeps every multiplier at most one in magnitude and turns an unstable algorithm into the reliable workhorse of the field. Row swaps are bookkept as a permutation \(P\), giving the factorization \(PA=LU\). The remaining honesty check is the **condition number** \(\kappa(A)=\|A\|\,\|A^{-1}\|\): even a perfect algorithm cannot recover accuracy the problem itself has destroyed, and \(\kappa\) tells you how much.

## visualization
```
Solve Ax = b with Gaussian elimination.  Augmented matrix [A | b]:

    [  2   1  -1  |   8 ]
    [ -3  -1   2  | -11 ]
    [ -2   1   2  |  -3 ]

Step 1 - eliminate col 1 below pivot 2:  R2 += (3/2)R1,  R3 += (1)R1
    [  2    1    -1   |   8   ]
    [  0   0.5   0.5  |   1   ]
    [  0    2     1   |   5   ]

Step 2 - partial pivot: |2| > |0.5| in col 2, so swap R2 <-> R3
    [  2    1    -1   |   8   ]
    [  0    2     1   |   5   ]
    [  0   0.5   0.5  |   1   ]

Step 3 - eliminate col 2 below pivot 2:  R3 -= (0.25)R2
    [  2    1    -1   |   8   ]      upper triangular U reached
    [  0    2     1   |   5   ]
    [  0    0   0.25  | -0.25 ]

Back substitution (bottom up):
    x3 = -0.25 / 0.25            = -1
    x2 = (5 - 1*(-1)) / 2        =  3
    x1 = (8 - 1*3 - (-1)*(-1))/2 =  2      ->  x = ( 2,  3, -1)
```

## bruteForce
The textbook alternatives are **Cramer's rule** and **explicit inversion**, and both are how not to do it. Cramer's rule writes each \(x_i\) as a ratio of determinants, \(x_i=\det(A_i)/\det(A)\). Computed by cofactor expansion, a single \(n\times n\) determinant costs \(O(n!)\) operations, so solving a modest \(20\times 20\) system this way needs on the order of \(20!\approx 2.4\times 10^{18}\) multiplications — physically impossible, and numerically unstable on top of being slow. Forming \(A^{-1}\) and multiplying \(x=A^{-1}b\) is far better than Cramer but still wrong practice: it costs about three times more work than a direct solve, uses more memory, and loses accuracy, because the explicit inverse of an ill-conditioned matrix magnifies round-off. Plain Gaussian elimination *without* pivoting is the right \(O(n^3)\) idea but unsafe: a tiny or zero pivot makes it blow up.

## optimal
The professional default is **LU factorization with partial pivoting**, \(PA=LU\), computed by Gaussian elimination in \(\tfrac{2}{3}n^3\) flops. Factor once, then answer any number of right-hand sides with a forward solve \(Ly=Pb\) and a back solve \(Ux=y\), each \(O(n^2)\) — this reuse is the entire reason you keep \(L\) and \(U\) instead of throwing them away. **Never form the inverse to solve a system**: `solve(A, b)` is faster, more accurate, and uses less memory than `inv(A) @ b`. Partial pivoting is non-negotiable, because it bounds every multiplier by one and keeps error growth controlled where naive elimination would divide by a near-zero pivot and detonate.

Even a flawless solver is limited by the problem's **condition number** \(\kappa(A)=\|A\|\,\|A^{-1}\|\). It governs how much relative error in the data is amplified into the answer: the forward-error bound is \(\frac{\|\delta x\|}{\|x\|}\le \kappa(A)\,\frac{\|\delta b\|}{\|b\|}\). A rule of thumb is that you lose about \(\log_{10}\kappa(A)\) decimal digits of accuracy, so a matrix with \(\kappa\approx 10^{8}\) leaves only about 8 trustworthy digits in double precision. A small **residual** \(\|Ax-b\|\) does *not* guarantee a small error when \(\kappa\) is large — the classic trap of ill-conditioning.

When \(A\) is **large and sparse**, dense LU is wasteful because factorization fills in zeros. Then switch to **iterative methods** that only need matrix-vector products: **Jacobi** and **Gauss-Seidel** are simple stationary iterations (Gauss-Seidel reuses freshly updated components and converges faster, and both converge for diagonally dominant systems), while **conjugate gradient** is the method of choice for large symmetric positive-definite systems, converging in far fewer iterations at \(O(\text{nnz})\) cost per step. Choose direct LU for dense or repeated-solve problems, iterative for huge sparse ones — and always keep an eye on \(\kappa\).

```python
import numpy as np
A = np.array([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], float)
b = np.array([8, -11, -3], float)
x = np.linalg.solve(A, b)          # LU + partial pivoting under the hood
print(x)                           # [ 2.  3. -1.]
print(np.linalg.cond(A))           # condition number: how much error is amplified
```

## complexity
time: Dense LU factorization with partial pivoting is \(\tfrac{2}{3}n^3\), i.e. O(n^3); each subsequent triangular solve for a new right-hand side is O(n^2). Cramer's rule by cofactor expansion is O(n!) and unusable. Iterative methods cost O(nnz) per iteration (nnz = nonzeros), with the iteration count depending on conditioning.
space: O(n^2) to store a dense factorization (it can overwrite A in place); O(nnz) for sparse iterative methods, which never form the fill-in that direct factorization would.
notes: Factor once, solve many — the O(n^3) cost is paid a single time and amortized across all right-hand sides at O(n^2) each. Accuracy is capped by the condition number regardless of algorithm: expect to lose about log10(kappa) digits, and remember a tiny residual does not certify a tiny error when kappa is large.

## pitfalls
- Skipping partial pivoting. A tiny or zero pivot makes the multipliers explode and amplifies round-off catastrophically; always swap the largest-magnitude entry in the column onto the diagonal, giving \(PA=LU\), before eliminating.
- Ignoring ill-conditioning. When \(\kappa(A)\) is large the forward error obeys \(\frac{\|\delta x\|}{\|x\|}\le \kappa(A)\frac{\|\delta b\|}{\|b\|}\), so a tiny residual \(\|Ax-b\|\) can still hide a large error in \(x\). Check the condition number, do not trust the residual alone.
- Computing the inverse to solve a system. `inv(A) @ b` is slower, hungrier for memory, and less accurate than a direct `solve(A, b)`; forming \(A^{-1}\) is almost never the right move.
- Using Cramer's rule beyond \(3\times 3\). Its \(O(n!)\) cost is astronomical and it is numerically unstable — it is a definition, not an algorithm.
- Refactoring for every right-hand side. If \(A\) is fixed and only \(b\) changes, factor once as \(A=LU\) and reuse it; recomputing the \(O(n^3)\) factorization each time throws away the whole advantage.

## interviewTips
- Explain why you never invert: solving \(Ax=b\) directly via LU is cheaper and more accurate than forming \(A^{-1}\), and factoring once lets you answer many right-hand sides at \(O(n^2)\) apiece — say "factor once, solve many."
- Be ready to justify partial pivoting from stability: without it a tiny pivot forces division by near-zero and blows up the multipliers; with it every multiplier is \(\le 1\), which is why \(PA=LU\) is the standard.
- Bring up the condition number \(\kappa(A)=\|A\|\|A^{-1}\|\) and the digit-loss rule of thumb (\(\log_{10}\kappa\) digits lost); mention that huge sparse systems call for iterative methods (Jacobi, Gauss-Seidel, conjugate gradient) instead of dense LU.

## keyTakeaways
- Solve \(Ax=b\) by LU factorization with partial pivoting (\(PA=LU\)) at \(O(n^3)\), then reuse the factors for each new right-hand side at \(O(n^2)\) — never form the inverse, and never use Cramer's rule (\(O(n!)\)).
- Partial pivoting keeps every multiplier bounded by one and turns unstable elimination into the reliable workhorse; a tiny pivot without pivoting amplifies round-off catastrophically.
- The condition number \(\kappa(A)\) caps achievable accuracy: the forward error is bounded by \(\kappa(A)\frac{\|\delta b\|}{\|b\|}\), you lose about \(\log_{10}\kappa\) digits, and a small residual does not guarantee a small error.

## code.python
```python
def solve(A, b):
    """Gaussian elimination with partial pivoting + back substitution for Ax = b."""
    n = len(A)
    M = [row[:] + [b[i]] for i, row in enumerate(A)]   # augmented [A | b]
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(M[r][col]))  # partial pivot
        if abs(M[pivot][col]) < 1e-12:
            raise ValueError("matrix is singular or nearly so")
        M[col], M[pivot] = M[pivot], M[col]
        for r in range(col + 1, n):
            factor = M[r][col] / M[col][col]
            for c in range(col, n + 1):
                M[r][c] -= factor * M[col][c]
    x = [0.0] * n
    for i in range(n - 1, -1, -1):                     # back substitution
        s = M[i][n] - sum(M[i][j] * x[j] for j in range(i + 1, n))
        x[i] = s / M[i][i]
    return x

A = [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]]
b = [8, -11, -3]
print(solve(A, b))   # [2.0, 3.0, -1.0]
```

## code.javascript
```javascript
function solve(A, b) {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);          // augmented [A | b]
  for (let col = 0; col < n; col++) {
    let pivot = col;                                     // partial pivot
    for (let r = col + 1; r < n; r++)
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) < 1e-12) throw new Error("singular matrix");
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {                     // back substitution
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

console.log(solve([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3])); // [2, 3, -1]
```

## code.java
```java
public class LinearSolver {
    static double[] solve(double[][] A, double[] b) {
        int n = A.length;
        double[][] M = new double[n][n + 1];              // augmented [A | b]
        for (int i = 0; i < n; i++) {
            System.arraycopy(A[i], 0, M[i], 0, n);
            M[i][n] = b[i];
        }
        for (int col = 0; col < n; col++) {
            int pivot = col;                              // partial pivot
            for (int r = col + 1; r < n; r++)
                if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
            if (Math.abs(M[pivot][col]) < 1e-12)
                throw new ArithmeticException("singular matrix");
            double[] tmp = M[col]; M[col] = M[pivot]; M[pivot] = tmp;
            for (int r = col + 1; r < n; r++) {
                double factor = M[r][col] / M[col][col];
                for (int c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
            }
        }
        double[] x = new double[n];
        for (int i = n - 1; i >= 0; i--) {                // back substitution
            double s = M[i][n];
            for (int j = i + 1; j < n; j++) s -= M[i][j] * x[j];
            x[i] = s / M[i][i];
        }
        return x;
    }

    public static void main(String[] args) {
        double[][] A = {{2, 1, -1}, {-3, -1, 2}, {-2, 1, 2}};
        double[] b = {8, -11, -3};
        double[] x = solve(A, b);
        System.out.printf("%.1f %.1f %.1f%n", x[0], x[1], x[2]); // 2.0 3.0 -1.0
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <vector>
#include <stdexcept>

std::vector<double> solve(std::vector<std::vector<double>> A, std::vector<double> b) {
    int n = A.size();
    std::vector<std::vector<double>> M(n, std::vector<double>(n + 1));
    for (int i = 0; i < n; i++) {                         // augmented [A | b]
        for (int j = 0; j < n; j++) M[i][j] = A[i][j];
        M[i][n] = b[i];
    }
    for (int col = 0; col < n; col++) {
        int pivot = col;                                  // partial pivot
        for (int r = col + 1; r < n; r++)
            if (std::fabs(M[r][col]) > std::fabs(M[pivot][col])) pivot = r;
        if (std::fabs(M[pivot][col]) < 1e-12)
            throw std::runtime_error("singular matrix");
        std::swap(M[col], M[pivot]);
        for (int r = col + 1; r < n; r++) {
            double factor = M[r][col] / M[col][col];
            for (int c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
        }
    }
    std::vector<double> x(n, 0.0);
    for (int i = n - 1; i >= 0; i--) {                    // back substitution
        double s = M[i][n];
        for (int j = i + 1; j < n; j++) s -= M[i][j] * x[j];
        x[i] = s / M[i][i];
    }
    return x;
}

int main() {
    std::vector<std::vector<double>> A = {{2, 1, -1}, {-3, -1, 2}, {-2, 1, 2}};
    std::vector<double> b = {8, -11, -3};
    std::vector<double> x = solve(A, b);
    std::printf("%.1f %.1f %.1f\n", x[0], x[1], x[2]); // 2.0 3.0 -1.0
    return 0;
}
```
