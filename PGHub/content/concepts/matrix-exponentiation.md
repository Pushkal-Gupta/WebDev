---
slug: matrix-exponentiation
module: math-number-theory
title: Matrix Exponentiation
subtitle: Compute the n-th term of any linear recurrence in O(k^3 log n) by raising the transition matrix to the n-th power.
difficulty: Advanced
position: 14
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Binary exponentiation (matrix power)"
    url: "https://cp-algorithms.com/algebra/binary-exp.html"
    type: blog
  - title: "kth-competitive-programming/kactl — matrix templates"
    url: "https://github.com/kth-competitive-programming/kactl"
    type: repo
status: published
---

## intro
Matrix exponentiation lets you compute the n-th term of any **linear recurrence** in O(log n) matrix multiplications. The recurrence becomes a transition matrix M; the n-th state is `M^n × initial_state`. Combined with fast power (squaring), the total cost is O(k^3 log n) where k is the state size.

## whyItMatters
The canonical example is computing `fib(10^18)` in microseconds — impossible with linear-time recursion, trivial with matrix exponentiation. The same trick handles any linear recurrence (Tribonacci, Lucas numbers, Padovan), counts paths of length exactly `n` in a graph via `A^n` on the adjacency matrix, propagates Markov-chain state distributions `n` steps in `M^n * pi_0`, and accelerates any DP recurrence with bounded state (`dp[i] = a * dp[i-1] + b * dp[i-2] + ...`) from `O(n)` to `O(k^3 log n)` where `k` is the state size. Asked frequently in competitive programming for "given a recurrence and huge `n` (up to `10^{18}`), find the `n`-th term mod `p`." Production uses include PageRank power-iteration (Brin & Page 1998), the matrix-tree theorem for spanning-tree counting, and hidden-Markov-model forward-backward computations.

## intuition
A linear recurrence is equivalent to repeated matrix multiplication. For Fibonacci `f(n) = f(n-1) + f(n-2)`:

```
| f(n)   |   | 1 1 | | f(n-1) |
| f(n-1) | = | 1 0 | | f(n-2) |
```

Apply that 2x2 transition matrix `n - 1` times to `[f(1), f(0)] = [1, 0]` and you get `[f(n), f(n-1)]`. Linear time. The breakthrough is replacing "apply `n - 1` times" with "raise the matrix to the `n - 1`th power and apply once" — and computing matrix powers in `O(log n)` via binary exponentiation just like integer powers.

The binary-exponentiation trick is the same as for scalars. Write `n` in binary; `M^n` is the product of `M^{2^i}` for every set bit `i` in `n`. Each successive power-of-two matrix is the square of the previous, computed once and reused. Total work is `O(log n)` matrix multiplications, each costing `O(k^3)` for a `k x k` matrix using schoolbook multiplication (Strassen's algorithm shaves the cube but rarely pays off for small `k`).

The generalization beyond Fibonacci is straightforward. For any linear recurrence of order `k`, the transition matrix is `k x k` with the recurrence coefficients in the top row and an identity-shift in the rows below. State vectors carry the last `k` terms. The same `O(k^3 log n)` cost evaluates `f(n)` for arbitrary `n`. For counting walks in a graph, the adjacency matrix is already the transition matrix and `(A^n)[i][j]` is the number of `n`-step walks from `i` to `j`.

## visualization
```
For Fibonacci:        After M^2:               After M^4 = (M^2)^2:
M = | 1 1 |           M^2 = | 2 1 |           M^4 = | 5 3 |
    | 1 0 |                 | 1 1 |                 | 3 2 |

M^10 reached in 4 squarings (2^4=16, but with mixed-product bookkeeping for non-power-of-2 exponents).
```

## bruteForce
Compute `f(0), f(1), …, f(n)` in O(n). Fine up to n ≈ 10^7. For n = 10^18 it's intractable.

## optimal
Binary exponentiation of a matrix. Square the base on every iteration; multiply into the accumulator on every set bit of the exponent. For modular arithmetic, take `% mod` after every multiplication and addition to keep entries bounded.

```python
def matmul(A, B, mod=None):
    n, m, p = len(A), len(A[0]), len(B[0])
    C = [[0] * p for _ in range(n)]
    for i in range(n):
        for k in range(m):
            if A[i][k]:
                aik = A[i][k]
                for j in range(p):
                    C[i][j] += aik * B[k][j]
                    if mod: C[i][j] %= mod
    return C

def matpow(M, n, mod=None):
    k = len(M)
    result = [[1 if i == j else 0 for j in range(k)] for i in range(k)]
    base = [row[:] for row in M]
    while n > 0:
        if n & 1: result = matmul(result, base, mod)
        base = matmul(base, base, mod)
        n >>= 1
    return result

def fib(n, mod=10**9 + 7):
    if n == 0: return 0
    M = matpow([[1, 1], [1, 0]], n, mod)
    return M[0][1]
```

The critical pattern is `while n > 0: if n & 1: ...; base = matmul(base, base); n >>= 1` — every iteration squares the base (`M, M^2, M^4, M^8, ...`) and multiplies into the result only when the current bit of `n` is set. Total matrix multiplications: at most `2 * log2(n)`. For `k = 2` (Fibonacci) the matmul cost is constant; for `k = 100` it dominates and you switch to Strassen (`O(k^{log_2 7}) = O(k^{2.81})`) or to specialized BLAS routines on dense data. Always pass `mod` for competitive-programming problems to keep entries from blowing up. The same template handles tribonacci (3x3), counting tilings (small matrix per problem), and any "`n`-th term mod prime" question.

## complexity
- **Time**: O(k^3 log n) for one query.
- **Space**: O(k^2) for the matrix.
- **Constant**: matrix multiply is exactly k^3 ops. Strassen drops to k^2.807 but is rarely worth implementing for the small k typical in interview problems.

## pitfalls
- **Forgetting the modulus** at intermediate multiplies — overflow is silent.
- **Off-by-one on the power**: deciding between `M^n` and `M^(n-1)` depends on your initial-state index. Walk through n=1, n=2 carefully.
- **Non-linear recurrences**: matrix exponentiation only works on LINEAR recurrences. Recurrences with a `+ constant` term need an extra "constant" row in the matrix.
- **Floating-point matrices** for huge n: precision loss kills accuracy. Use integers + modular arithmetic.
- **k too large**: for k = 100, k^3 = 10^6 per multiply × log(10^18) ≈ 60 multiplies = 6 × 10^7 — borderline but fine. For k = 1000, it's untractable.

## interviewTips
- The trigger: "compute the n-th term where n ≤ 10^18 and the recurrence is linear with small state." Matrix exponentiation.
- Compare with **fast doubling** for Fibonacci specifically (uses identities, no matrix; same asymptotic, smaller constant).
- For senior interviews, mention that **adjacency matrix powers** give path-count between any two nodes in O(V^3 log n).
- For non-linear recurrences (e.g. with floors, mods), matrix expo doesn't apply — that's a different problem.

## code.python
```python
MOD = 10**9 + 7
SIZE = 2

def matmul(A, B):
    n, m, k = len(A), len(B[0]), len(B)
    C = [[0]*m for _ in range(n)]
    for i in range(n):
        for j in range(m):
            s = 0
            for x in range(k):
                s = (s + A[i][x] * B[x][j]) % MOD
            C[i][j] = s
    return C

def matpow(M, n):
    k = len(M)
    R = [[1 if i == j else 0 for j in range(k)] for i in range(k)]
    base = [row[:] for row in M]
    while n > 0:
        if n & 1: R = matmul(R, base)
        base = matmul(base, base)
        n >>= 1
    return R

def fib(n):
    if n == 0: return 0
    M = matpow([[1, 1], [1, 0]], n - 1)
    return M[0][0]

print(fib(10**12) % MOD)
```

## code.javascript
```javascript
const MOD = 1_000_000_007n;
function matmul(A, B) {
  const n = A.length, m = B[0].length, k = B.length;
  const C = Array.from({ length: n }, () => Array(m).fill(0n));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      let s = 0n;
      for (let x = 0; x < k; x++) s = (s + A[i][x] * B[x][j]) % MOD;
      C[i][j] = s;
    }
  return C;
}
function matpow(M, n) {
  const k = M.length;
  let R = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => i === j ? 1n : 0n));
  let base = M.map(row => row.slice());
  while (n > 0n) { if (n & 1n) R = matmul(R, base); base = matmul(base, base); n >>= 1n; }
  return R;
}
```

## code.java
```java
class MatrixExpo {
    static final long MOD = 1_000_000_007L;
    static long[][] matmul(long[][] A, long[][] B) {
        int n = A.length, m = B[0].length, k = B.length;
        long[][] C = new long[n][m];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < m; j++) {
                long s = 0;
                for (int x = 0; x < k; x++) s = (s + A[i][x] * B[x][j]) % MOD;
                C[i][j] = s;
            }
        return C;
    }
    static long[][] matpow(long[][] M, long n) {
        int k = M.length;
        long[][] R = new long[k][k];
        for (int i = 0; i < k; i++) R[i][i] = 1;
        long[][] base = M;
        while (n > 0) {
            if ((n & 1) == 1) R = matmul(R, base);
            base = matmul(base, base);
            n >>= 1;
        }
        return R;
    }
}
```

## code.cpp
```cpp
#include <vector>
const long long MOD = 1'000'000'007;
using Matrix = std::vector<std::vector<long long>>;
Matrix matmul(const Matrix& A, const Matrix& B) {
    int n = A.size(), m = B[0].size(), k = B.size();
    Matrix C(n, std::vector<long long>(m, 0));
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++) {
            long long s = 0;
            for (int x = 0; x < k; x++) s = (s + A[i][x] * B[x][j]) % MOD;
            C[i][j] = s;
        }
    return C;
}
Matrix matpow(Matrix M, long long n) {
    int k = M.size();
    Matrix R(k, std::vector<long long>(k, 0));
    for (int i = 0; i < k; i++) R[i][i] = 1;
    while (n > 0) { if (n & 1) R = matmul(R, M); M = matmul(M, M); n >>= 1; }
    return R;
}
```
