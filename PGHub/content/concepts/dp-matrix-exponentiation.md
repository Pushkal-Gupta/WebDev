---
slug: dp-matrix-exponentiation
module: dp-advanced
title: Matrix Exponentiation for Linear Recurrences
subtitle: Compute the n-th term of any constant-coefficient linear recurrence in O(k^3 log n).
difficulty: Advanced
position: 38
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Matrix Exponentiation — Algorithms for Competitive Programming"
    url: "https://cp-algorithms.com/linear_algebra/matrix-exponentiation.html"
    type: blog
  - title: "CLRS — Linear Algebra (walkccc.me)"
    url: "https://walkccc.me/CLRS/Chap28/28.1/"
    type: book
  - title: "kth-competitive-programming/kactl — MatrixInverse / MatrixExpo"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/numerical/MatrixInverse.h"
    type: repo
status: published
---

## intro
Any constant-coefficient linear recurrence — Fibonacci, Tribonacci, "ways to tile a 2×n board," "paths of length n in graph G" — can be rewritten as `v_{n+1} = M · v_n` for some k×k matrix M. The n-th term is then `M^n · v_0`. Computing `M^n` by **binary exponentiation on matrices** is O(k^3 log n) — orders of magnitude faster than O(n) iteration when n is 10^18.

## whyItMatters
- **Fibonacci at n = 10^18 mod p**: O(log n) instead of O(n).
- **Count walks of length L in graph G**: `(A^L)[u][v]`, where A is the adjacency matrix.
- **Tiling problems** ("how many ways to tile a 2×n strip with dominoes?"): recurrence of order 2-5, n up to 10^18.
- **Probabilistic state machines**: stationary distributions, n-step transition probabilities.
- Competitive programming: appears in roughly 1 in 20 hard problems.

## intuition
Iterating a linear recurrence `f_n = a_1 f_{n-1} + a_2 f_{n-2} + ... + a_k f_{n-k}` term by term costs O(n) — fine for n = 10^6 but hopeless for n = 10^18 (more cycles than the universe has had since the Big Bang). The matrix-exponentiation trick recognizes that the recurrence is just matrix multiplication in disguise. Stack the last k values into a column state vector `v = [f_{n}, f_{n-1}, ..., f_{n-k+1}]^T` and build a k by k companion matrix M whose top row encodes the coefficients `[a_1, a_2, ..., a_k]` and whose sub-diagonal is the identity-shift. Then `M * v_n = v_{n+1}` — one matrix multiplication advances the recurrence by one step. By associativity, `v_n = M^n * v_0`. Computing `M^n` by binary exponentiation (squaring) takes log n matrix multiplications, each O(k^3) in scalar operations, so total work is O(k^3 log n). At k = 2 (Fibonacci) and n = 10^18, that is about 60 multiplications of 2x2 matrices — instant. The deep insight is that polynomial-time recurrences hide algebraic structure that matrix algebra exposes. Any operation that is linear in some state vector (linear recurrences, graph adjacency walks, Markov chain transitions, finite-state automaton paths) can be exponentiated with this trick. Computing "number of length-n walks from u to v in graph G" is just `(A^n)[u][v]` where A is the adjacency matrix. Stationary distributions of Markov chains are eigenvectors of the transition matrix. Counting strings of length n avoiding a forbidden pattern is matrix-exponentiating the automaton's transition matrix. The square-and-multiply pattern is the same algorithmic skeleton everywhere — what changes is which matrix you raise to a power.

## visualization
```
Fibonacci:  f_{n+1} = f_n + f_{n-1}

State vector:   [ f_n     ]
                [ f_{n-1} ]

Companion M:    [ 1  1 ]   →   M · [ f_n     ]  =  [ f_n + f_{n-1} ]  =  [ f_{n+1} ]
                [ 1  0 ]            [ f_{n-1} ]      [ f_n              ]    [ f_n     ]

Therefore:   [ f_n     ]   =   M^{n-1} · [ f_1 ]   =   M^{n-1} · [ 1 ]
             [ f_{n-1} ]                  [ f_0 ]                 [ 0 ]

Binary expo:    M^13 = M^8 · M^4 · M^1     (3 multiplies, not 12)
```

## bruteForce
Iterate the recurrence: O(n · k) additions. At n = 10^18 this is impossible — even at 10^9 ops/sec it would take 30 years.

## optimal
1. **Build M** (k×k):
   - Top row = `[a_1, a_2, ..., a_k]` (the recurrence coefficients).
   - Sub-diagonal = identity shift: `M[i][i-1] = 1` for i = 1..k-1.
   - Everything else = 0.
2. **Initial vector** v_0 = `[f_{k-1}, f_{k-2}, ..., f_0]^T`.
3. **Matrix power by squaring**:
   ```
   power(M, n):
     R = I (k×k identity)
     while n:
       if n & 1: R = R · M
       M = M · M
       n >>= 1
     return R
   ```
4. **Answer**: `(M^{n} · v_0)[0]` — the top entry of the resulting vector.

Always work mod p (10^9 + 7 typical) — intermediate values overflow otherwise. In C++ use 64-bit and a single `% p` per scalar multiply-add.

**Variants**:
- **Affine recurrences** (`f_n = a · f_{n-1} + b`): augment the state with a constant 1 column. The matrix becomes (k+1)×(k+1).
- **Path counting in graphs**: skip the companion construction — M is just the adjacency matrix.

## complexity
- **Time**: O(k^3 log n) — log n matrix multiplies, each O(k^3).
- **Space**: O(k^2).
- **Practical k**: k up to ~200 is fine; beyond that, Berlekamp-Massey + Kitamasu drops it to O(k^2 log n).

## pitfalls
- **Off-by-one on exponent**: most write-ups exponentiate to `n - 1`, not n; double-check against small cases (f_0, f_1, f_2).
- **Wrong companion form**: the recurrence row goes on *top*, sub-diagonal shifts down. Transposed versions also work but you must flip the initial vector accordingly.
- **Integer overflow**: 32-bit ints overflow on the second multiplication mod 10^9+7. Use 64-bit accumulators and one `% p` per inner add.
- **Forgetting mod inside multiplication**, then a single `% p` at the end — overflows long before that.
- **Affine recurrences without the augmented row** of "constant 1" — give the wrong answer.
- **Cache thrash on big k**: standard ijk loop is fine; reorder to ikj for cache-friendly inner.

## interviewTips
- Trigger phrases: "Fibonacci mod p where n ≤ 10^18," "ways to tile 2×n," "paths of length L in a graph," "linear recurrence."
- Begin with the standard O(n) DP, then say: "Since k is tiny and n is huge, I'd lift it to matrix exponentiation."
- Show the 2×2 Fibonacci matrix as the canonical example — it's the fastest way to convince an interviewer you've done this before.
- For senior loops, mention **Berlekamp-Massey + Cayley-Hamilton** for O(k^2 log n) on large k. Also mention that **eigenvalue decomposition** gives a closed form when M is diagonalizable.
- Always state the mod and the overflow plan.

## code.python
```python
MOD = 10**9 + 7

def matmul(A, B):
    k = len(A)
    C = [[0] * k for _ in range(k)]
    for i in range(k):
        for l in range(k):
            if A[i][l] == 0: continue
            a = A[i][l]
            for j in range(k):
                C[i][j] = (C[i][j] + a * B[l][j]) % MOD
    return C

def matpow(M, n):
    k = len(M)
    R = [[1 if i == j else 0 for j in range(k)] for i in range(k)]
    while n:
        if n & 1: R = matmul(R, M)
        M = matmul(M, M)
        n >>= 1
    return R

def fib(n):
    if n == 0: return 0
    M = [[1, 1], [1, 0]]
    R = matpow(M, n - 1)
    return R[0][0]

print(fib(10**18))   # finishes in milliseconds
```

## code.javascript
```javascript
const MOD = 1_000_000_007n;
function matmul(A, B) {
  const k = A.length;
  const C = Array.from({ length: k }, () => new Array(k).fill(0n));
  for (let i = 0; i < k; i++)
    for (let l = 0; l < k; l++) {
      const a = A[i][l];
      if (a === 0n) continue;
      for (let j = 0; j < k; j++) C[i][j] = (C[i][j] + a * B[l][j]) % MOD;
    }
  return C;
}
function matpow(M, n) {
  const k = M.length;
  let R = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => i === j ? 1n : 0n));
  let base = M;
  while (n > 0n) {
    if (n & 1n) R = matmul(R, base);
    base = matmul(base, base);
    n >>= 1n;
  }
  return R;
}
function fib(n) {
  if (n === 0n) return 0n;
  return matpow([[1n, 1n], [1n, 0n]], n - 1n)[0][0];
}
```

## code.java
```java
class MatrixExpo {
    static final long MOD = 1_000_000_007L;
    static long[][] mul(long[][] A, long[][] B) {
        int k = A.length;
        long[][] C = new long[k][k];
        for (int i = 0; i < k; i++)
            for (int l = 0; l < k; l++) {
                if (A[i][l] == 0) continue;
                long a = A[i][l];
                for (int j = 0; j < k; j++) C[i][j] = (C[i][j] + a * B[l][j]) % MOD;
            }
        return C;
    }
    static long[][] pow(long[][] M, long n) {
        int k = M.length;
        long[][] R = new long[k][k];
        for (int i = 0; i < k; i++) R[i][i] = 1;
        while (n > 0) {
            if ((n & 1) == 1) R = mul(R, M);
            M = mul(M, M);
            n >>= 1;
        }
        return R;
    }
    static long fib(long n) {
        if (n == 0) return 0;
        return pow(new long[][]{{1, 1}, {1, 0}}, n - 1)[0][0];
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <cstdint>
using Mat = std::vector<std::vector<int64_t>>;
const int64_t MOD = 1'000'000'007;

Mat mul(const Mat& A, const Mat& B) {
    int k = (int) A.size();
    Mat C(k, std::vector<int64_t>(k, 0));
    for (int i = 0; i < k; i++)
        for (int l = 0; l < k; l++) {
            if (!A[i][l]) continue;
            int64_t a = A[i][l];
            for (int j = 0; j < k; j++) C[i][j] = (C[i][j] + a * B[l][j]) % MOD;
        }
    return C;
}
Mat matpow(Mat M, int64_t n) {
    int k = (int) M.size();
    Mat R(k, std::vector<int64_t>(k, 0));
    for (int i = 0; i < k; i++) R[i][i] = 1;
    while (n) {
        if (n & 1) R = mul(R, M);
        M = mul(M, M);
        n >>= 1;
    }
    return R;
}
int64_t fib(int64_t n) {
    if (n == 0) return 0;
    return matpow({{1, 1}, {1, 0}}, n - 1)[0][0];
}
```
