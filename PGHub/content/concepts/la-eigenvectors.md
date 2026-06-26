---
slug: la-eigenvectors
module: linear-algebra
title: Eigenvectors and Eigenvalues
subtitle: The special directions a transformation only stretches — never knocks off their own line.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 12
prereqs: [la-matrix-as-transformation, la-determinant]
relatedProblems: []
references:
  - title: "3Blue1Brown — Essence of Linear Algebra, Chapter 14: Eigenvectors and eigenvalues"
    url: "https://www.youtube.com/watch?v=PFDu9oVAE-g"
    type: video
  - title: "Khan Academy — Eigen-everything (eigenvalues, eigenvectors, eigenspaces)"
    url: "https://www.khanacademy.org/math/linear-algebra/alternate-bases#eigen-everything"
    type: course
status: published
---

## intro
When a matrix transforms space, most vectors get knocked off their original line — rotated, sheared, pointed somewhere new. But for almost every transformation there exist a few special directions that survive: vectors that come out pointing along the very same line they started on, merely stretched or shrunk (and possibly flipped). Those stubborn directions are the **eigenvectors**, and the factor by which each one is scaled is its **eigenvalue**. Find them and you have found the skeleton of the transformation — the axes around which everything else pivots.

## whyItMatters
Eigenvectors expose what a transformation *fundamentally does*, stripped of the coordinate system you happened to write it in. That makes them the engine behind a huge range of methods. **Principal Component Analysis** finds the eigenvectors of a data covariance matrix — the directions of greatest variance — and uses them to compress and de-noise data. Google's original **PageRank** is the dominant eigenvector of the web's link matrix: the steady-state importance every page settles into. The long-run behavior of a **Markov chain** is its stationary distribution, an eigenvector with eigenvalue \(1\). In physics, the eigenvalues of a system's matrix are its natural vibration frequencies and the quantized energy levels of quantum systems; in differential equations they decide whether a system blows up, decays, or oscillates. Diagonalizing a matrix via its eigenvectors makes repeated application (matrix powers, the heart of dynamics and recurrences) almost free. Wherever something is repeatedly transformed and you want its eventual fate, eigenvectors give the answer.

## intuition
Take the equation that defines everything: a nonzero vector \(\mathbf{v}\) is an eigenvector of matrix \(A\) if applying \(A\) only scales it,
\[
A\mathbf{v} = \lambda \mathbf{v},
\]
where the scalar \(\lambda\) (lambda) is the eigenvalue. Read it geometrically: \(A\) usually moves vectors *off* their line, but \(\mathbf{v}\) lands right back on its own line, lengthened or shortened by \(\lambda\). If \(\lambda = 2\), \(\mathbf{v}\) doubles; if \(\lambda = 0.5\), it halves; if \(\lambda = -1\), it flips to point backward but stays on the line; if \(\lambda = 1\), it is left completely fixed.

Why do such directions exist, and how do you find them? Rearrange: \(A\mathbf{v} - \lambda\mathbf{v} = \mathbf{0}\), so \((A - \lambda I)\mathbf{v} = \mathbf{0}\). We want a *nonzero* \(\mathbf{v}\) solving this, which means the transformation \(A - \lambda I\) must squash that \(\mathbf{v}\) to zero — it must collapse space, killing a dimension. From the determinant concept you know exactly when a transformation collapses space: when its determinant is zero. So the eigenvalues are precisely the \(\lambda\) values making
\[
\det(A - \lambda I) = 0.
\]
This is the **characteristic equation**. For an \(n \times n\) matrix it is a degree-\(n\) polynomial in \(\lambda\), and its roots are the eigenvalues. Once you have a \(\lambda\), plug it back in and solve \((A - \lambda I)\mathbf{v} = \mathbf{0}\) for the directions it kills — those are the eigenvectors for that eigenvalue.

Worked example, fully concrete. Let \(A = \begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}\). The characteristic equation is \(\det\begin{bmatrix} 2 - \lambda & 1 \\ 1 & 2 - \lambda \end{bmatrix} = (2-\lambda)^2 - 1 = 0\), giving \((2-\lambda)^2 = 1\), so \(\lambda = 3\) or \(\lambda = 1\). For \(\lambda = 3\): \((A - 3I)\mathbf{v} = \begin{bmatrix} -1 & 1 \\ 1 & -1 \end{bmatrix}\mathbf{v} = 0\) forces \(v_1 = v_2\), so the eigenvector is the diagonal direction \((1, 1)\), stretched by \(3\). For \(\lambda = 1\): \(v_1 = -v_2\), the anti-diagonal \((1, -1)\), left unscaled. So this transformation triples everything along \((1,1)\) and leaves \((1,-1)\) untouched — and now you understand the matrix's entire behavior from two arrows.

Not every transformation has real eigenvectors: a pure rotation in the plane sends *every* direction somewhere new (that is the point of rotating), so its eigenvalues are complex, encoding the rotation angle rather than a real stretch. A shear has a repeated eigenvalue with only one eigenvector direction (it is "defective"). These exceptions are features — they tell you the transformation has no real invariant axis.

The grand payoff is **diagonalization**. If an \(n \times n\) matrix has \(n\) independent eigenvectors, gather them as the columns of \(P\) and the eigenvalues on the diagonal of \(D\); then \(A = P D P^{-1}\). In the eigenvector basis the transformation is just "scale each axis by its eigenvalue" — the simplest possible action. Powers become trivial: \(A^k = P D^k P^{-1}\), and \(D^k\) is just each eigenvalue raised to \(k\). That is why eigen-decomposition turns "apply this transformation a thousand times" from a thousand matrix multiplies into raising a few numbers to the thousandth power.

## visualization
```
   A = [ 2 1 ]   most vectors rotate off their line; two directions don't.
       [ 1 2 ]

         eigenvector (1,1), lambda = 3            characteristic eqn:
              ^   stretched x3                     det(A - lambda*I) = 0
             /|                                     (2-L)^2 - 1 = 0
   . _      / |   . _    other vectors get          => L = 3  or  L = 1
      ` .   /  |  ' `     knocked OFF their line
         ` o   |.'                                  eigenvector for L=3 : (1, 1)
    <-------- o --------->  eigenvector (1,-1)      eigenvector for L=1 : (1,-1)
              |`. lambda = 1 (unchanged)
              |  ` .
   only the two eigen-lines stay on their own line; everything else swings around them.
```

## bruteForce
The textbook procedure is **root-find the characteristic polynomial, then solve a null space per root**: expand \(\det(A - \lambda I)\) into a degree-\(n\) polynomial, find its roots, and for each root solve \((A - \lambda I)\mathbf{v} = 0\). For \(2 \times 2\) and \(3 \times 3\) by hand this is exactly right and builds intuition. But as a general algorithm it is a trap. Computing the polynomial's coefficients is expensive and, far worse, *numerically catastrophic*: polynomial roots are wildly sensitive to tiny coefficient errors, so round-off in forming the characteristic polynomial can throw the eigenvalues off completely. There is also no formula for polynomial roots beyond degree four (Abel–Ruffini), so you could not get a closed form for a \(5 \times 5\) even in principle. The characteristic polynomial is the right *definition* and the wrong *computation*.

## optimal
Real eigensolvers never form the characteristic polynomial. The workhorse is the **QR algorithm**: repeatedly factor the matrix as \(A = QR\) (orthogonal times upper-triangular) and recombine as \(RQ\); this similarity iteration drives the matrix toward triangular form, whose diagonal entries are the eigenvalues, converging fast once shifts and a preliminary reduction to Hessenberg form are applied. It is stable, runs in \(O(n^3)\) overall, and is what `numpy.linalg.eig` and LAPACK call under the hood. When you only need the single largest eigenvalue and its eigenvector — PageRank, dominant-mode analysis — the **power iteration** is even simpler and beautifully intuitive: pick a random vector, repeatedly apply \(A\) and renormalize, and it converges to the dominant eigenvector because that direction's eigenvalue out-grows all the others with each multiply. The Rayleigh quotient \(\mathbf{v}^\top A \mathbf{v} / \mathbf{v}^\top \mathbf{v}\) then reads off the eigenvalue.

Why these win: QR avoids the polynomial's ill-conditioning entirely by working with orthogonal transformations that do not amplify error, and power iteration costs only one matrix-vector product per step (\(O(n^2)\), or \(O(\text{nnz})\) for sparse matrices), which is how it scales to a web-sized link matrix where forming a determinant is unthinkable. The conceptual lesson is to separate the *meaning* (eigenvalues are where \(A - \lambda I\) collapses space) from the *method* (orthogonal iteration, not root-finding). For symmetric matrices everything is even nicer — eigenvalues are real, eigenvectors orthogonal, and specialized solvers are faster and rock-solid.

```python
import numpy as np

def power_iteration(A, iters=200):
    v = np.ones(A.shape[0])
    for _ in range(iters):
        v = A @ v
        v = v / np.linalg.norm(v)            # renormalize to stay finite
    lam = v @ (A @ v)                          # Rayleigh quotient: the eigenvalue
    return lam, v

A = np.array([[2.0, 1.0], [1.0, 2.0]])
lam, v = power_iteration(A)
print(round(lam, 3), np.round(v, 3))           # ~3.0 along (1,1)/sqrt2 -> dominant eigenpair
print(np.linalg.eigvals(A))                     # [3. 1.] -- the QR solver agrees
```

## complexity
time: O(n^3) for a full eigendecomposition via the QR algorithm; O(n^2) per step of power iteration (O(nnz) for sparse A), times the number of iterations to converge
space: O(n^2) for dense factorizations; O(n) for power iteration beyond storing A
notes: Power iteration's convergence rate is governed by |lambda_2 / lambda_1| -- the closer the top two eigenvalues, the slower it converges. Never compute eigenvalues by forming and root-finding the characteristic polynomial in floating point; it is numerically unstable. Symmetric matrices get real eigenvalues, orthogonal eigenvectors, and faster dedicated solvers.

## pitfalls
- Solving \((A - \lambda I)\mathbf{v} = 0\) and accepting \(\mathbf{v} = \mathbf{0}\). The zero vector trivially satisfies it but is *never* an eigenvector by definition — you want the nonzero null-space directions.
- Expecting real eigenvectors from every matrix. Rotations have complex eigenvalues; defective matrices (some shears) have fewer eigenvectors than dimensions and cannot be diagonalized.
- Forgetting eigenvectors are directions, not fixed-length arrows. Any nonzero scalar multiple of an eigenvector is also an eigenvector — solvers return a normalized representative.
- Computing eigenvalues by forming the characteristic polynomial numerically. Its roots are hypersensitive to coefficient round-off; use a QR-based solver instead.
- Assuming power iteration always converges. It fails or stalls when the top two eigenvalues have equal magnitude (e.g. \(\lambda\) and \(-\lambda\)), and it only ever finds the *dominant* eigenvector, not the others.

## interviewTips
- State the definition as geometry first: an eigenvector is a direction the transformation only stretches, and the eigenvalue is the stretch factor — then write \(A\mathbf{v} = \lambda\mathbf{v}\).
- Derive the characteristic equation from "we need \(A - \lambda I\) to collapse space," i.e. \(\det(A - \lambda I) = 0\); connecting it to the determinant shows real understanding.
- Mention diagonalization \(A = PDP^{-1}\) as the reason eigenvectors matter computationally — it makes matrix powers \(A^k = PD^kP^{-1}\) cheap, which is the trick behind solving linear recurrences and Markov-chain steady states.

## keyTakeaways
- An eigenvector is a direction a transformation leaves on its own line; the eigenvalue is the factor it is scaled by, defined by \(A\mathbf{v} = \lambda\mathbf{v}\).
- Eigenvalues are the roots of \(\det(A - \lambda I) = 0\) (the characteristic equation) — the \(\lambda\) that make \(A - \lambda I\) collapse space.
- Compute them with QR-based solvers or power iteration, never by root-finding the characteristic polynomial; diagonalization \(A = PDP^{-1}\) makes repeated application nearly free.

## code.python
```python
import numpy as np

def power_iteration(A, iters=500, tol=1e-12):
    v = np.ones(A.shape[0]) / np.sqrt(A.shape[0])
    lam = 0.0
    for _ in range(iters):
        w = A @ v
        v_next = w / np.linalg.norm(w)
        lam = v_next @ (A @ v_next)            # Rayleigh quotient
        if np.linalg.norm(v_next - v) < tol:
            break
        v = v_next
    return lam, v

A = np.array([[2.0, 1.0], [1.0, 2.0]])
print(power_iteration(A))                       # ~3.0 dominant eigenvalue, eigvec ~ (1,1)
```

## code.javascript
```javascript
// Power iteration for the dominant eigenpair of a square matrix.
function matVec(A, v) { return A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0)); }
function norm(v) { return Math.sqrt(v.reduce((s, x) => s + x * x, 0)); }

function powerIteration(A, iters = 500) {
  let v = A.map(() => 1 / Math.sqrt(A.length));
  let lam = 0;
  for (let k = 0; k < iters; k++) {
    const w = matVec(A, v);
    const n = norm(w);
    v = w.map((x) => x / n);
    const Av = matVec(A, v);
    lam = v.reduce((s, x, i) => s + x * Av[i], 0);  // Rayleigh quotient
  }
  return { lambda: lam, vector: v };
}

console.log(powerIteration([[2, 1], [1, 2]])); // lambda ~ 3, vector ~ (0.707, 0.707)
```

## code.java
```java
import java.util.Arrays;

public class Eigen {
    static double[] matVec(double[][] A, double[] v) {
        double[] r = new double[A.length];
        for (int i = 0; i < A.length; i++)
            for (int j = 0; j < v.length; j++) r[i] += A[i][j] * v[j];
        return r;
    }
    static double norm(double[] v) {
        double s = 0; for (double x : v) s += x * x; return Math.sqrt(s);
    }

    static double powerIteration(double[][] A, int iters) {
        int n = A.length;
        double[] v = new double[n];
        Arrays.fill(v, 1.0 / Math.sqrt(n));
        double lam = 0;
        for (int k = 0; k < iters; k++) {
            double[] w = matVec(A, v);
            double nrm = norm(w);
            for (int i = 0; i < n; i++) v[i] = w[i] / nrm;
            double[] Av = matVec(A, v);
            lam = 0; for (int i = 0; i < n; i++) lam += v[i] * Av[i];
        }
        return lam;
    }

    public static void main(String[] args) {
        double[][] A = {{2, 1}, {1, 2}};
        System.out.printf("%.3f%n", powerIteration(A, 500)); // 3.000
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <vector>

using Vec = std::vector<double>;
using Mat = std::vector<std::vector<double>>;

Vec matVec(const Mat& A, const Vec& v) {
    Vec r(A.size(), 0.0);
    for (size_t i = 0; i < A.size(); ++i)
        for (size_t j = 0; j < v.size(); ++j) r[i] += A[i][j] * v[j];
    return r;
}
double norm(const Vec& v) { double s = 0; for (double x : v) s += x * x; return std::sqrt(s); }

double powerIteration(const Mat& A, int iters) {
    int n = A.size();
    Vec v(n, 1.0 / std::sqrt((double)n));
    double lam = 0;
    for (int k = 0; k < iters; ++k) {
        Vec w = matVec(A, v);
        double nrm = norm(w);
        for (int i = 0; i < n; ++i) v[i] = w[i] / nrm;
        Vec Av = matVec(A, v);
        lam = 0; for (int i = 0; i < n; ++i) lam += v[i] * Av[i];
    }
    return lam;
}

int main() {
    Mat A = {{2, 1}, {1, 2}};
    std::printf("%.3f\n", powerIteration(A, 500)); // 3.000
    return 0;
}
```
