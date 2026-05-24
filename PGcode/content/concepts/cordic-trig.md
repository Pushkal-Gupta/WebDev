---
slug: cordic-trig
module: math
title: CORDIC Trigonometry
subtitle: Compute sin and cos via iterative micro-rotations using only shifts, adds, and a small table.
difficulty: Advanced
position: 1
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "CORDIC Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/cordic-algorithm-for-calculating-sines-and-cosines/"
    type: blog
  - title: "Numerical Methods — cp-algorithms"
    url: "https://cp-algorithms.com/algebra/big-integer.html"
    type: blog
  - title: "TheAlgorithms/Python — sin and cos implementations"
    url: "https://github.com/TheAlgorithms/Python/blob/master/maths/sin.py"
    type: repo
status: published
---

## intro
CORDIC — COordinate Rotation DIgital Computer, invented by Jack Volder at Convair in 1959 to drive an aircraft's B-58 navigation computer without a multiplier — computes sin(θ), cos(θ), arctangents, hyperbolic functions, and even multiplication / division using only bit shifts, additions, and a tiny precomputed table of arctangents. It is the algorithm inside almost every FPGA, calculator chip, and DSP that lacks a hardware multiplier.

## whyItMatters
On hardware without a floating-point unit (microcontrollers, FPGAs, GPUs in the early days), Taylor / polynomial approximations of trig need multipliers — expensive. CORDIC needs only shifts and adds. It converges by one bit of accuracy per iteration, so 32 iterations give 32-bit precision. Interviewers ask about it under "how would you implement sin without using the math library?" and in embedded / quant contexts.

## intuition
Rotate the vector (1, 0) through θ in many tiny pre-baked rotations of magnitude atan(2^-i). Each micro-rotation by ±atan(2^-i) requires only multiplying by tan(atan(2^-i)) = 2^-i, which is just a right shift. The signs are chosen greedily to drive the remaining angle toward zero. After n iterations, the cumulative rotation matches θ to within atan(2^-n), and the resulting vector is (cos θ, sin θ) scaled by a known constant K = product of cos(atan(2^-i)) (~0.6072529350 for many iterations). Multiply once by K at the end (or pre-scale the initial vector).

## visualization
Start at (x, y) = (K, 0), z = θ (in radians). At step i: if z >= 0, rotate by +atan(2^-i): x' = x - y * 2^-i, y' = y + x * 2^-i, z -= atan(2^-i). Else rotate the other way: x' = x + y * 2^-i, y' = y - x * 2^-i, z += atan(2^-i). After ~30 iterations, x is cos θ and y is sin θ.

## bruteForce
Taylor series: sin θ = θ - θ^3/6 + θ^5/120 - ... — needs multiplications and divisions and converges slowly outside [-π/2, π/2]. Polynomial approximations (Chebyshev, minimax) are common in software libraries but still require a multiplier. CORDIC's selling point is "no multiplier needed" — strictly different design constraint.

## optimal
Pre-store the table atan_table[i] = atan(2^-i) for i in 0..n-1, and the scaling constant K. To compute sin and cos for any θ in [-π/2, π/2], initialize x = K, y = 0, z = θ. Loop i from 0 to n-1: choose d = +1 if z >= 0 else -1; x_new = x - d * y * 2^-i; y_new = y + d * x * 2^-i; z = z - d * atan_table[i]. After the loop, return (x, y) = (cos θ, sin θ). For θ outside [-π/2, π/2], reduce modulo 2π and use cos / sin identities (e.g., cos(π + φ) = -cos φ) to map into the convergence range.

## complexity
time: O(n) per evaluation where n is the iteration count (typically 16-32)
space: O(n) for the atan_table (constant for fixed precision)
notes: One bit of accuracy per iteration. n = 30 yields about 9-10 decimal digits of precision — plenty for graphics and audio.

## pitfalls
- Forgetting the K scaling — without multiplying by K (or pre-initializing x to K), the final (x, y) is the answer rotated correctly but magnitude ~1.6468, not 1.
- Using CORDIC outside [-π/2, π/2] without angle reduction — the iteration only converges inside the "sum-of-atans" range, which equals about ±1.7433 rad. Reduce arguments first.
- Storing 2^-i as a float and multiplying instead of bit-shifting an integer fixed-point — defeats the entire point on hardware without a multiplier.
- Mistaking CORDIC for a Taylor approximation — they have completely different convergence behaviours and operation counts.

## interviewTips
- Open with "no multiplier needed — only shifts, adds, and a small table." That captures the algorithm in one sentence.
- Mention the 1959 Volder origin and the B-58 bomber — interviewers in embedded / quant love the history.
- For "rotate this vector by an angle without a sin/cos library," CORDIC is the canonical answer (and is widely used in 3D math on FPGAs).
- Mention that CORDIC also computes atan2, sqrt, ln, exp via the "hyperbolic" and "vectoring" modes — same skeleton, different update rules.

## code.python
```python
import math

ITERS = 32
ATAN = [math.atan(2 ** -i) for i in range(ITERS)]

def _cordic_k():
    k = 1.0
    for i in range(ITERS):
        k *= 1.0 / math.sqrt(1.0 + 2 ** (-2 * i))
    return k

K = _cordic_k()

def sin_cos(theta: float):
    half_pi = math.pi / 2
    theta = (theta + math.pi) % (2 * math.pi) - math.pi
    sign = 1
    if theta > half_pi:
        theta -= math.pi; sign = -1
    elif theta < -half_pi:
        theta += math.pi; sign = -1
    x, y, z = K, 0.0, theta
    for i in range(ITERS):
        d = 1 if z >= 0 else -1
        x_new = x - d * y * (2 ** -i)
        y_new = y + d * x * (2 ** -i)
        z -= d * ATAN[i]
        x, y = x_new, y_new
    return sign * y, sign * x
```

## code.javascript
```javascript
const ITERS = 32;
const ATAN = Array.from({ length: ITERS }, (_, i) => Math.atan(Math.pow(2, -i)));
const K = (() => {
  let k = 1;
  for (let i = 0; i < ITERS; i++) k *= 1 / Math.sqrt(1 + Math.pow(2, -2 * i));
  return k;
})();

function sinCos(theta) {
  const halfPi = Math.PI / 2;
  theta = ((theta + Math.PI) % (2 * Math.PI)) - Math.PI;
  let sign = 1;
  if (theta > halfPi) { theta -= Math.PI; sign = -1; }
  else if (theta < -halfPi) { theta += Math.PI; sign = -1; }
  let x = K, y = 0, z = theta;
  for (let i = 0; i < ITERS; i++) {
    const d = z >= 0 ? 1 : -1;
    const p = Math.pow(2, -i);
    const xn = x - d * y * p;
    const yn = y + d * x * p;
    z -= d * ATAN[i];
    x = xn; y = yn;
  }
  return { sin: sign * y, cos: sign * x };
}
```

## code.java
```java
static final int ITERS = 32;
static final double[] ATAN = new double[ITERS];
static final double K;

static {
    for (int i = 0; i < ITERS; i++) ATAN[i] = Math.atan(Math.pow(2, -i));
    double k = 1;
    for (int i = 0; i < ITERS; i++) k *= 1.0 / Math.sqrt(1.0 + Math.pow(2, -2 * i));
    K = k;
}

public double[] sinCos(double theta) {
    double halfPi = Math.PI / 2;
    theta = ((theta + Math.PI) % (2 * Math.PI)) - Math.PI;
    int sign = 1;
    if (theta > halfPi) { theta -= Math.PI; sign = -1; }
    else if (theta < -halfPi) { theta += Math.PI; sign = -1; }
    double x = K, y = 0, z = theta;
    for (int i = 0; i < ITERS; i++) {
        int d = z >= 0 ? 1 : -1;
        double p = Math.pow(2, -i);
        double xn = x - d * y * p;
        double yn = y + d * x * p;
        z -= d * ATAN[i];
        x = xn; y = yn;
    }
    return new double[]{ sign * y, sign * x };
}
```

## code.cpp
```cpp
constexpr int ITERS = 32;
double ATAN[ITERS];
double K;

void cordic_init() {
    K = 1.0;
    for (int i = 0; i < ITERS; ++i) {
        ATAN[i] = atan(pow(2.0, -i));
        K *= 1.0 / sqrt(1.0 + pow(2.0, -2 * i));
    }
}

pair<double,double> sin_cos(double theta) {
    double half_pi = M_PI / 2;
    theta = fmod(theta + M_PI, 2 * M_PI) - M_PI;
    int sign = 1;
    if (theta > half_pi) { theta -= M_PI; sign = -1; }
    else if (theta < -half_pi) { theta += M_PI; sign = -1; }
    double x = K, y = 0, z = theta;
    for (int i = 0; i < ITERS; ++i) {
        int d = z >= 0 ? 1 : -1;
        double p = pow(2.0, -i);
        double xn = x - d * y * p;
        double yn = y + d * x * p;
        z -= d * ATAN[i];
        x = xn; y = yn;
    }
    return {sign * y, sign * x};
}
```
