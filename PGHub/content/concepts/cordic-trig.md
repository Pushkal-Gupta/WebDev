---
slug: cordic-trig
module: math-geom-sampling
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
Think of an old combination-lock dial that you can only nudge by a fixed set of click sizes — a big click, then a click half as wide, then a quarter, and so on. You cannot type the target angle directly; you can only add or subtract the next preset click. But by always clicking *toward* the target, each nudge halves the remaining error, so after enough clicks the dial sits essentially on the number you wanted. CORDIC is that dial applied to a rotating 2D vector instead of a lock.

Here is what is actually happening, in plain terms before any formula. You hold a vector and want to spin it by θ. Instead of one exact rotation (which needs sin and cos — the very things you are trying to compute), you spin it by a fixed staircase of angles atan(1), atan(1/2), atan(1/4), atan(1/8), ..., each either added or subtracted. The magic is that rotating by exactly atan(2^-i) means the tangent of that step is 2^-i, so the rotation update multiplies coordinates by 2^-i — a pure right shift on hardware, no multiplier at all. You choose each step's sign greedily to shrink a running remainder z that starts at θ and should reach 0.

Concrete micro-example, θ = 0.7854 rad (45°), tracking z. Step 0: z ≥ 0 so add atan(1) = 0.7854, remainder z → 0.0000. Step 1: z < 0? No, z = 0, so add atan(0.5) = 0.4636, overshooting to z → -0.4636. Step 2: z < 0 so subtract atan(0.25) = 0.2450, z → -0.2186. Step 3: still negative, subtract atan(0.125) = 0.1244, z → -0.0942. The remainder keeps zig-zagging tighter around 0. After n iterations the cumulative rotation matches θ to within atan(2^-n), and the vector — which started at (1, 0) — lands on (cos θ, sin θ) but stretched by a fixed gain K = product of cos(atan(2^-i)) ≈ 0.6072529350. Because K is the same for every input, you cancel it once: either multiply the final coordinates by K, or simply start the vector at (K, 0) so it comes out unit length.

Iteration trace for theta = 0.7854 rad (45 deg), start (x,y)=(K,0)=(0.60725, 0), z=theta.
Each row: pick sigma = +1 if z>=0 else -1; x -= sigma*y*2^-i; y += sigma*x_old*2^-i; z -= sigma*atan(2^-i).

```
 i | atan(2^-i) | sigma |         x |         y |         z
---+------------+-------+-----------+-----------+-----------
 0 |   0.785398 |   +1  |  0.607253 |  0.607253 |  0.000000
 1 |   0.463648 |   +1  |  0.303626 |  0.910879 | -0.463648
 2 |   0.244979 |   -1  |  0.531346 |  0.834972 | -0.218669
 3 |   0.124355 |   -1  |  0.635718 |  0.768554 | -0.094314
 4 |   0.062419 |   -1  |  0.683752 |  0.728822 | -0.031895
 5 |   0.031240 |   -1  |  0.706527 |  0.707455 | -0.000655
 6 |   0.015624 |   -1  |  0.717581 |  0.696417 |  0.014969
 ..|    ...     |  ...  |    ...    |    ...    |    ...
30 |   0.000000 |  ...  |  0.707107 |  0.707107 | ~0.000000
```
Final: x = cos(45 deg) = 0.707107, y = sin(45 deg) = 0.707107 (z driven to ~0).

## bruteForce
Taylor series: sin θ = θ - θ^3/6 + θ^5/120 - ... — needs multiplications and divisions and converges slowly outside [-π/2, π/2]. Polynomial approximations (Chebyshev, minimax) are common in software libraries but still require a multiplier. CORDIC's selling point is "no multiplier needed" — strictly different design constraint.

## optimal
Pre-store the table atan_table[i] = atan(2^-i) for i in 0..n-1, and the scaling constant K. To compute sin and cos for any θ in [-π/2, π/2], initialize x = K, y = 0, z = θ. Loop i from 0 to n-1: choose d = +1 if z >= 0 else -1; x_new = x - d * y * 2^-i; y_new = y + d * x * 2^-i; z = z - d * atan_table[i]. After the loop, return (x, y) = (cos θ, sin θ). For θ outside [-π/2, π/2], reduce modulo 2π and use cos / sin identities (e.g., cos(π + φ) = -cos φ) to map into the convergence range.

Why this is correct: each step applies a genuine 2D rotation matrix scaled by 1/cos(atan(2^-i)) — the pseudo-rotation. Because we predivide by K up front, all the per-step 1/cos gains multiply back to exactly 1, leaving a true rotation of the accumulated angle. The **key invariant** is on z: it holds the still-unrotated part of θ, and the greedy sign choice d = sign(z) guarantees |z| strictly shrinks toward 0, bounded after step i by atan(2^-(i+1)) plus the tail sum of remaining step angles. That tail is what makes the staircase reach any target inside the convergence range — the steps overlap enough that a positive step can always be "undone" by later negative ones. The **core tradeoff** is fixed work for fixed precision: you spend exactly n shift-add rounds regardless of θ, gaining one bit of accuracy per round, so runtime is fully deterministic (attractive for real-time DSP and constant-time crypto-adjacent code). Step operations are three adds and two shifts — no data-dependent branches beyond the sign test. Complexity intuition: n iterations, each O(1) shift-add work, so O(n) total; the atan table and K are computed once at init and reused across every evaluation, making per-call space O(1).

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
