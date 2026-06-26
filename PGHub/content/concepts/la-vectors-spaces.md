---
slug: la-vectors-spaces
module: linear-algebra
title: Vectors, Span, and Basis
subtitle: An arrow you can add and scale — and the whole space those arrows can reach.
difficulty: Beginner
position: 1
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "3Blue1Brown — Essence of Linear Algebra, Chapter 1: Vectors, what even are they?"
    url: "https://www.youtube.com/watch?v=fNk_zzaMoSs"
    type: video
  - title: "3Blue1Brown — Essence of Linear Algebra, Chapter 2: Linear combinations, span, and basis vectors"
    url: "https://www.youtube.com/watch?v=k7RM-ot2NWY"
    type: video
  - title: "Khan Academy — Vectors and spaces"
    url: "https://www.khanacademy.org/math/linear-algebra/vectors-and-spaces"
    type: course
status: published
---

## intro
A vector is the simplest object that lets you do two things at once: point somewhere and carry a size. Picture an arrow rooted at the origin — its tip lands at a coordinate like \((3, 2)\). That pair of numbers is the same object as the arrow; switching between "arrow you can see" and "list of numbers you can compute with" is the central habit of linear algebra. Everything else in the subject is built from two operations on these arrows: adding them and scaling them.

## whyItMatters
Once you can add and scale arrows, you can describe almost any quantity that has direction and magnitude, or any list of numbers that move together. A point in 3D space, an RGB color, a word embedding with 768 coordinates, the state of a physics simulation, the pixel intensities of an image flattened into a long column — all of these are vectors. Machine learning is mostly the art of pushing vectors through transformations and measuring how close two of them are. Computer graphics moves vertices, which are vectors, with matrices. Search engines compare query vectors to document vectors by angle. The reason linear algebra is the lingua franca of applied math is that "things that add and scale linearly" turns out to cover an enormous slice of the world, and the moment a problem fits that mold, the entire toolkit of spans, bases, and transformations becomes available for free.

## intuition
Hold two ideas in your head and the rest follows. First, **scaling**: multiplying a vector by a number stretches or shrinks the arrow while keeping its line. Double \((3, 2)\) and you get \((6, 4)\), an arrow twice as long pointing the same way; multiply by \(-1\) and it flips to point backward. The number you scale by is called a **scalar**, precisely because its job is to scale. Second, **addition**: to add two vectors, walk along the first, then from there walk along the second; where you end up is the sum. Tip-to-tail. Coordinate-wise this is just \((a, b) + (c, d) = (a+c, b+d)\), but the geometric picture — chaining two walks — is the one that makes later ideas obvious.

Combine the two operations and you get a **linear combination**: pick vectors \(\mathbf{v}\) and \(\mathbf{w}\), pick scalars \(s\) and \(t\), and form \(s\mathbf{v} + t\mathbf{w}\). Let \(s\) and \(t\) range over every real number and ask: which points can you reach? That reachable set is the **span** of \(\mathbf{v}\) and \(\mathbf{w}\). With two arrows that point in genuinely different directions in the plane, the span is the entire plane — any target \((x, y)\) is some unique mix of them. But if \(\mathbf{w}\) happens to lie along the same line as \(\mathbf{v}\) (it is just a scaled copy), adding it buys you nothing new: the span collapses to a single line. Those two vectors are then **linearly dependent** — one is redundant. When no vector in a set is a combination of the others, the set is **linearly independent**, and every direction it contributes is genuinely new.

A **basis** is the sweet spot: a linearly independent set whose span is the whole space. In 2D you need exactly two independent arrows; in 3D, three. The standard basis is \(\hat{\imath} = (1, 0)\) and \(\hat{\jmath} = (0, 1)\), and writing a vector as \((3, 2)\) is shorthand for \(3\hat{\imath} + 2\hat{\jmath}\) — the coordinates *are* the coefficients in that linear combination. The deep payoff is that coordinates only have meaning relative to a chosen basis. Pick a different valid basis and the same physical arrow gets different numbers. That is why "change of basis" is a recurring move: you switch to whichever set of reference arrows makes your problem simplest, do the work there, then switch back.

Worked example: can \((4, 5)\) be built from \(\mathbf{v} = (1, 1)\) and \(\mathbf{w} = (1, -1)\)? Solve \(s + t = 4\) and \(s - t = 5\); adding gives \(2s = 9\), so \(s = 4.5\), \(t = -0.5\). Yes — and uniquely, because the two arrows are independent, so they form a basis.

## visualization
```
            span of one vector = a line      span of two independent vectors = the plane

   y                                          y
   |        . t*v   (every scalar             |   . . . . . . . . .   every (x,y)
   |      .   multiple lands here)            |   . . . * . . . . .   is s*v + t*w
   |    .                                     |   . . . . . . . . .
   |  .  v                                    |   . . o-------> w . .
   | ----------------> x                      |   . . | v . . . . .
   |.                                         |   . . v . . . . . .
   +---------------------                     +---------------------> x

  dependent {v, 2v}: span stays a line     independent {v, w}: span fills the plane
```

## bruteForce
The naive way to test whether a target \(\mathbf{b}\) lies in the span of some vectors, or whether those vectors are independent, is to **guess-and-check coefficients**: try mixes of \(s\) and \(t\) until the combination lands on \(\mathbf{b}\), or eyeball whether one arrow looks parallel to another. In two dimensions with friendly numbers this almost works, but it does not scale, it gives no certificate when the answer is "no," and floating-point near-misses make "is this exactly parallel?" unreliable. The honest version is to set up the linear system \(s\mathbf{v} + t\mathbf{w} = \mathbf{b}\) and solve it by substitution, which is fine for a handful of vectors but turns into bookkeeping chaos as dimensions grow.

## optimal
The principled tool is **Gaussian elimination** (row reduction), which answers span membership, independence, and the actual coefficients in one mechanical procedure. Stack your vectors as the columns of a matrix, append the target as an extra column, and row-reduce. The system is consistent — the target is in the span — exactly when reduction never produces a row that reads \(0 = \text{nonzero}\). The vectors are independent exactly when every column has a pivot (a leading nonzero), meaning the **rank** equals the number of vectors. The rank is the single most useful number here: it is the dimension of the span, so rank \(= n\) for \(n\) vectors means independence and a basis, while a deficient rank pinpoints how many vectors are redundant.

Why this beats guessing: elimination is \(O(n^3)\) for an \(n \times n\) system but deterministic, gives the exact coefficients when they exist, and proves impossibility when they do not — no infinite search. It also degrades gracefully in high dimensions where intuition fails completely. In practice you rarely write the loops yourself; libraries expose `rank`, `solve`, and least-squares, all of which are elimination or its numerically stabler cousin, QR/SVD factorization. The conceptual takeaway is that "is \(\mathbf{b}\) reachable, and how?" and "are these directions independent?" are the *same* question asked of one matrix, and row reduction answers both at once.

```python
import numpy as np

V = np.array([[1.0, 1.0],
              [1.0, -1.0]]).T        # columns are the basis vectors v, w
b = np.array([4.0, 5.0])

coeffs = np.linalg.solve(V, b)        # solve s*v + t*w = b
rank = np.linalg.matrix_rank(V)
print(coeffs, "rank =", rank)          # [ 4.5 -0.5] rank = 2  -> independent, b in span
```

## complexity
time: O(n^3) to row-reduce / solve an n x n system; O(mn^2) for an m-row, n-column rectangular system
space: O(n^2) to hold the augmented matrix
notes: Rank, independence, and span-membership all fall out of one elimination pass. Numerically, prefer QR or SVD over raw elimination when the matrix is near-singular — the SVD's smallest singular value measures how close to dependent the columns are.

## pitfalls
- Confusing span with the vectors themselves. Two vectors are a finite set; their span is an infinite set (a line, plane, or all of space) of every combination.
- Calling vectors independent because they "look different." \((1, 2)\) and \((2, 4)\) point the same way — one is twice the other, so they are dependent and their span is only a line.
- Forgetting that coordinates depend on a basis. \((3, 2)\) means \(3\hat{\imath} + 2\hat{\jmath}\); under a different basis the *same* arrow has different coordinates.
- Assuming any \(n\) vectors span \(n\)-dimensional space. They do only if they are independent; \(n\) dependent vectors span a lower-dimensional subspace.
- Using exact-equality checks for parallelism in floating point. Test the rank or the smallest singular value with a tolerance instead of asking whether a determinant is *exactly* zero.

## interviewTips
- Define span as "every linear combination" and independence as "no vector is a combination of the others" — crisp definitions earn fast points.
- If asked whether vectors form a basis, say: independent AND spanning, which for \(n\) vectors in \(n\)-D collapses to a single check — is the rank \(n\) (equivalently, is the determinant nonzero)?
- Mention that rank is the dimension of the span; it ties independence, span-membership, and invertibility into one number.

## keyTakeaways
- A vector is an arrow you can add (tip-to-tail) and scale; coordinates are the coefficients of the standard basis.
- The span is the set of all linear combinations — a line, a plane, or all of space depending on how many independent directions you have.
- A basis is a linearly independent set that spans the space; rank counts the independent directions and answers span, independence, and invertibility at once.

## code.python
```python
import numpy as np

def in_span(vectors, target, tol=1e-9):
    A = np.column_stack(vectors).astype(float)
    aug = np.column_stack([A, np.asarray(target, float)])
    return np.linalg.matrix_rank(A, tol) == np.linalg.matrix_rank(aug, tol)

def independent(vectors, tol=1e-9):
    A = np.column_stack(vectors).astype(float)
    return np.linalg.matrix_rank(A, tol) == A.shape[1]

print(in_span([[1, 1], [1, -1]], [4, 5]))   # True
print(independent([[1, 2], [2, 4]]))          # False (parallel)
```

## code.javascript
```javascript
// 2x2 linear-combination solver: find s, t with s*v + t*w = b.
function solveCombination(v, w, b) {
  const det = v[0] * w[1] - v[1] * w[0];
  if (Math.abs(det) < 1e-12) return null;          // dependent -> no unique mix
  const s = (b[0] * w[1] - b[1] * w[0]) / det;
  const t = (v[0] * b[1] - v[1] * b[0]) / det;
  return [s, t];
}

console.log(solveCombination([1, 1], [1, -1], [4, 5])); // [4.5, -0.5]
console.log(solveCombination([1, 2], [2, 4], [4, 5]));  // null (parallel)
```

## code.java
```java
public class Vectors {
    // Solve s*v + t*w = b in 2D via Cramer's rule; null-ish on dependence.
    static double[] solveCombination(double[] v, double[] w, double[] b) {
        double det = v[0] * w[1] - v[1] * w[0];
        if (Math.abs(det) < 1e-12) return null;
        double s = (b[0] * w[1] - b[1] * w[0]) / det;
        double t = (v[0] * b[1] - v[1] * b[0]) / det;
        return new double[] { s, t };
    }

    public static void main(String[] args) {
        double[] r = solveCombination(new double[]{1, 1}, new double[]{1, -1}, new double[]{4, 5});
        System.out.printf("s=%.2f t=%.2f%n", r[0], r[1]); // s=4.50 t=-0.50
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <optional>
#include <array>

// Solve s*v + t*w = b in 2D; nullopt when v, w are dependent.
std::optional<std::array<double,2>> solveCombination(
        std::array<double,2> v, std::array<double,2> w, std::array<double,2> b) {
    double det = v[0]*w[1] - v[1]*w[0];
    if (std::fabs(det) < 1e-12) return std::nullopt;
    double s = (b[0]*w[1] - b[1]*w[0]) / det;
    double t = (v[0]*b[1] - v[1]*b[0]) / det;
    return std::array<double,2>{s, t};
}

int main() {
    auto r = solveCombination({1,1}, {1,-1}, {4,5});
    if (r) std::printf("s=%.2f t=%.2f\n", (*r)[0], (*r)[1]); // s=4.50 t=-0.50
    return 0;
}
```
