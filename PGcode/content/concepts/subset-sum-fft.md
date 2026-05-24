---
slug: subset-sum-fft
module: dp
title: Subset Sum Convolution
subtitle: Compute the OR-convolution of two functions on subsets via the Walsh-Hadamard transform.
difficulty: Advanced
position: 3
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "Walsh-Hadamard Transform and Subset Sum — cp-algorithms"
    url: "https://cp-algorithms.com/algebra/all-submasks.html"
    type: blog
  - title: "Sum over Subsets DP — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/sum-subsets-dynamic-programming/"
    type: blog
  - title: "KACTL — FastSubsetTransform.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/numerical/FastSubsetTransform.h"
    type: repo
status: published
---

## intro
Given functions f, g : 2^[n] → R defined on all 2^n subsets of an n-element universe, the subset-sum / OR-convolution (f * g)(S) = sum over A union B = S of f(A) * g(B). A naive computation costs O(3^n) (iterate every (A, B) pair). The Sum-over-Subsets (SOS) transform — also called the Zeta transform, a special case of the Walsh-Hadamard family — computes it in O(2^n * n).

## whyItMatters
This is the algebra behind many bitmask-DP optimizations: counting Hamiltonian paths via inclusion-exclusion, set-cover style problems, "number of ways to partition a set so each part satisfies P," and OR-convolution of generating functions over a subset lattice. The SOS transform is to subset-sum what the FFT is to integer multiplication — same idea (point-value form), different group (Z_2^n instead of cyclic shifts).

## intuition
Define F(S) = sum over T subset of S of f(T). This is the "Möbius transform" or "zeta transform" of f. Then (F * G)(S) under pointwise multiplication corresponds to f convolved with g (OR-convolution) after inversion. Forward transform is cheap because each bit can be processed independently: for each bit i, replace f[S] with f[S] + f[S xor (1<<i)] for every S having bit i set. n such passes, each touching 2^n entries → O(n * 2^n).

## visualization
n = 2, universe {0, 1}. f = [a, b, c, d] indexed by masks 00, 01, 10, 11. After bit 0: [a, a+b, c, c+d]. After bit 1: [a, a+b, a+c, a+b+c+d]. The last vector is the zeta transform F(S) = sum over T subset of S of f(T). Pointwise multiply with G(S), then run the inverse (same loop with subtraction) to recover (f * g)(S).

## bruteForce
Triple loop over A, B with S = A | B; or, for each S, sum over T subset of S of f(T) * g(S xor T) which is OR-convolution restricted to disjoint pairs. The first is O(3^n) (each element is "in A only," "in B only," or "in neither"), the second is O(sum over S of 2^|S|) = O(3^n) by the binomial identity. At n = 20 this is 3.5 billion ops — infeasible.

## optimal
SOS / Walsh forward transform: for i in 0..n-1: for mask in 0..(2^n - 1): if mask has bit i: f[mask] += f[mask xor (1<<i)]. Forward-transform both f and g. Compute h[S] = F[S] * G[S] pointwise. Inverse transform h with the same loop but subtraction: f[mask] -= f[mask xor (1<<i)]. h after inversion equals the OR-convolution (f * g)(S) = sum over A union B = S of f(A) * g(B).

Note: "OR-convolution" includes overlapping (A, B). For "disjoint subset convolution" (A union B = S and A intersect B = empty) you need the rank-stratified subset convolution — O(n^2 * 2^n) — beyond this concept's scope.

## complexity
time: O(n * 2^n) for each forward / inverse transform; O(2^n) for the pointwise multiply
space: O(2^n) for f, g, h arrays
notes: At n = 20: 20 * 1M = 20M ops per transform — milliseconds. At n = 22: 90M per transform — still fast. The exponent in 2^n is the binding constraint.

## pitfalls
- Iterating masks in the outer loop and bits in the inner — that is asymptotically the same but cache-unfriendly. Bits outer, masks inner is the conventional form.
- Forgetting to invert — pointwise multiplying the transformed arrays gives a transform; you must inverse-transform to get the answer in the original basis.
- Confusing OR-convolution with XOR-convolution (Hadamard transform) and AND-convolution (super-set zeta). Three different transforms, three different bit-update formulas.
- Integer overflow on the pointwise multiply when values are large — use long long or modular arithmetic.

## interviewTips
- Mention the analogy to FFT: "FFT is to polynomial multiplication as SOS / Walsh-Hadamard is to subset convolution."
- Say the headline complexity up front: O(n * 2^n) vs. brute O(3^n). For n = 20 that is the difference between 20M and 3.5B ops.
- Be ready to distinguish AND vs OR vs XOR convolutions — interviewers test this when they want to probe depth.
- Mention real applications: counting subsets satisfying a property, inclusion-exclusion speed-ups, the Bjorklund O(2^n) Hamiltonian-path count.

## code.python
```python
def sos_forward(f):
    n = (len(f) - 1).bit_length()
    for i in range(n):
        bit = 1 << i
        for mask in range(len(f)):
            if mask & bit:
                f[mask] += f[mask ^ bit]
    return f

def sos_inverse(f):
    n = (len(f) - 1).bit_length()
    for i in range(n):
        bit = 1 << i
        for mask in range(len(f)):
            if mask & bit:
                f[mask] -= f[mask ^ bit]
    return f

def or_convolve(f, g):
    F = sos_forward(f[:])
    G = sos_forward(g[:])
    H = [a * b for a, b in zip(F, G)]
    return sos_inverse(H)
```

## code.javascript
```javascript
function sosForward(f) {
  const n = Math.log2(f.length) | 0;
  for (let i = 0; i < n; i++) {
    const bit = 1 << i;
    for (let mask = 0; mask < f.length; mask++) {
      if (mask & bit) f[mask] += f[mask ^ bit];
    }
  }
  return f;
}

function sosInverse(f) {
  const n = Math.log2(f.length) | 0;
  for (let i = 0; i < n; i++) {
    const bit = 1 << i;
    for (let mask = 0; mask < f.length; mask++) {
      if (mask & bit) f[mask] -= f[mask ^ bit];
    }
  }
  return f;
}

function orConvolve(f, g) {
  const F = sosForward(f.slice());
  const G = sosForward(g.slice());
  const H = F.map((v, i) => v * G[i]);
  return sosInverse(H);
}
```

## code.java
```java
public long[] sosForward(long[] f) {
    int n = Integer.numberOfTrailingZeros(f.length);
    for (int i = 0; i < n; i++) {
        int bit = 1 << i;
        for (int mask = 0; mask < f.length; mask++) {
            if ((mask & bit) != 0) f[mask] += f[mask ^ bit];
        }
    }
    return f;
}

public long[] sosInverse(long[] f) {
    int n = Integer.numberOfTrailingZeros(f.length);
    for (int i = 0; i < n; i++) {
        int bit = 1 << i;
        for (int mask = 0; mask < f.length; mask++) {
            if ((mask & bit) != 0) f[mask] -= f[mask ^ bit];
        }
    }
    return f;
}

public long[] orConvolve(long[] f, long[] g) {
    long[] F = sosForward(f.clone());
    long[] G = sosForward(g.clone());
    long[] H = new long[F.length];
    for (int i = 0; i < F.length; i++) H[i] = F[i] * G[i];
    return sosInverse(H);
}
```

## code.cpp
```cpp
void sos_forward(vector<long long>& f) {
    int n = __builtin_ctz(f.size());
    for (int i = 0; i < n; ++i) {
        int bit = 1 << i;
        for (int mask = 0; mask < (int)f.size(); ++mask) {
            if (mask & bit) f[mask] += f[mask ^ bit];
        }
    }
}

void sos_inverse(vector<long long>& f) {
    int n = __builtin_ctz(f.size());
    for (int i = 0; i < n; ++i) {
        int bit = 1 << i;
        for (int mask = 0; mask < (int)f.size(); ++mask) {
            if (mask & bit) f[mask] -= f[mask ^ bit];
        }
    }
}

vector<long long> or_convolve(vector<long long> f, vector<long long> g) {
    sos_forward(f); sos_forward(g);
    vector<long long> h(f.size());
    for (size_t i = 0; i < f.size(); ++i) h[i] = f[i] * g[i];
    sos_inverse(h);
    return h;
}
```
