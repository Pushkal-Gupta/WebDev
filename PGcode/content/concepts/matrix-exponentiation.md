---
slug: matrix-exponentiation
module: math
title: Matrix Exponentiation
subtitle: Compute the n-th term of any linear recurrence in O(k^3 log n) by raising the transition matrix to the n-th power.
difficulty: Advanced
position: 14
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Knuth — The Art of Computer Programming, Vol 2 (binary exponentiation chapter)"
    url: ""
status: published
---

## intro
Matrix exponentiation lets you compute the n-th term of any **linear recurrence** in O(log n) matrix multiplications. The recurrence becomes a transition matrix M; the n-th state is `M^n × initial_state`. Combined with fast power (squaring), the total cost is O(k^3 log n) where k is the state size.

## whyItMatters
The canonical example is Fibonacci in O(log n): `fib(10^18)` is computable in microseconds. The same trick handles:
- **Any linear recurrence** (Tribonacci, Lucas, etc.).
- **Counting paths of length exactly n** in a graph — `A^n` adjacency matrix gives the count between every pair.
- **Markov chains** — `M^n` propagates a state distribution n steps.
- **DP recurrences with bounded state** — `dp[i] = a·dp[i-1] + b·dp[i-2] + ...` accelerates from O(n) to O(log n).

Asked frequently for "given a recurrence and huge n (10^18), find the n-th term mod p."

## intuition
For Fibonacci `f(n) = f(n-1) + f(n-2)`:
```
| f(n)   |   | 1 1 | | f(n-1) |
| f(n-1) | = | 1 0 | | f(n-2) |
```
That 2x2 transition matrix, applied n-1 times to `[f(1), f(0)] = [1, 0]`, gives `[f(n), f(n-1)]`. Squaring + reusing partial results computes `M^(n-1)` in O(log n) matrix multiplies.

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
**Binary exponentiation** of a matrix:
```
matpow(M, n):
    result = identity(k)
    base = M
    while n > 0:
        if n & 1: result = matmul(result, base)
        base = matmul(base, base)
        n >>= 1
    return result
```

**Modular arithmetic**: at every multiply step, reduce mod p. Keep matrix entries within `long`.

For a recurrence `a(n) = c1·a(n-1) + c2·a(n-2) + … + ck·a(n-k)`:
```
M = | c1 c2 c3 ... ck |
    | 1  0  0  ... 0  |
    | 0  1  0  ... 0  |
    ...
    | 0  0  ... 1  0  |
```
The first row encodes the recurrence; the rest are shifts.

Initial state: `[a(k-1), a(k-2), …, a(0)]^T`. After multiplying by `M^(n-k+1)`, the top entry is `a(n)`.

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
