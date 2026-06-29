---
slug: calc-parametric-curves
module: calculus
title: Parametric Curves
subtitle: Let a single parameter advance and watch a point trace out a path that an ordinary function could never draw.
difficulty: Intermediate
position: 10
estimatedReadMinutes: 9
prereqs: [calc-derivative-as-slope]
relatedProblems: []
references:
  - title: "3Blue1Brown — Essence of Calculus, Chapter 9: What does area have to do with slope? (parametric & derivatives context)"
    url: "https://www.youtube.com/watch?v=FnJqaIESC2s"
    type: video
  - title: "Khan Academy — Parametric equations, polar coordinates"
    url: "https://www.khanacademy.org/math/ap-calculus-bc/bc-parametric-equations-polar"
    type: course
  - title: "Paul's Online Math Notes — Parametric Equations and Curves"
    url: "https://tutorial.math.lamar.edu/classes/calcii/parametriceqn.aspx"
    type: blog
status: published
---

## intro
A function \(y = f(x)\) ties one output to each input, so its graph can never loop back, cross itself, or stand vertical. Parametric curves drop that restriction. Instead of pinning \(y\) to \(x\), you give both coordinates their own formula in terms of a third variable: \(x = x(t)\) and \(y = y(t)\). Think of \(t\) as time. As \(t\) advances, the pair \((x(t), y(t))\) names a moving point, and the trail that point leaves behind is the curve. The same machinery that drew a static graph now drives an animation.

## whyItMatters
Almost anything that *moves* is naturally parametric. A projectile's position is \((x(t), y(t))\) with \(t\) as elapsed time; a planet's orbit, a robot arm's tip, a camera's path through a scene — all are points tracked against a parameter. Animation engines interpolate poses by sweeping \(t\) from 0 to 1. Bezier curves, the backbone of vector graphics and every font you read, are parametric polynomials. And parametric form is the only clean way to describe shapes that fail the vertical-line test: a full circle, a figure-eight, a spiral. When the path matters more than the function, you reach for parameters.

## intuition
Forget graphs for a moment and picture a pen tip. At every instant \(t\) it sits somewhere in the plane, and you have two dials that report its coordinates: one returns \(x(t)\), the other \(y(t)\). Spin the clock forward and the pen sweeps out a path. That path is the **parametric curve**; the two formulas are its **parameterization**.

The cleanest example is the unit circle. Set \(x(t) = \cos t\) and \(y(t) = \sin t\). At \(t = 0\) the point is at \((1, 0)\); at \(t = \tfrac{\pi}{2}\) it is at \((0, 1)\); at \(t = \pi\) it is at \((-1, 0)\). As \(t\) runs from \(0\) to \(2\pi\) the point walks once counterclockwise around the circle and returns home. No single function \(y = f(x)\) could do this — above each \(x\) there are two heights — but parameters handle it effortlessly.

Calculus rides along. The **velocity vector** \((x'(t), y'(t))\) points in the direction of motion and is tangent to the curve. Its length, \(\sqrt{x'(t)^2 + y'(t)^2}\), is the **speed** — how fast the pen moves along the path. For the circle, \(x'(t) = -\sin t\) and \(y'(t) = \cos t\), so the speed is \(\sqrt{\sin^2 t + \cos^2 t} = 1\): constant, as it should be for steady circular motion.

The slope of the curve itself comes from a quotient of rates: \(\dfrac{dy}{dx} = \dfrac{dy/dt}{dx/dt}\), valid wherever \(x'(t) \neq 0\). Try a concrete tiny example: \(x(t) = t^2\), \(y(t) = t^3\). Then \(\frac{dy}{dx} = \frac{3t^2}{2t} = \frac{3t}{2}\), so at \(t = 1\) the curve has slope \(\tfrac{3}{2}\) — all without ever solving for \(y\) in terms of \(x\).

A subtle but important point: the *same* geometric shape can be traced by many different parameterizations. Replace \(t\) with \(2t\) and the circle is drawn twice as fast; replace \(t\) with \(-t\) and it spins clockwise. The curve as a set of points is unchanged, but the *journey* — speed, direction, starting point — differs. **Lissajous figures**, the looping patterns \(x = \sin(at)\), \(y = \sin(bt)\), make this vivid: tiny changes to the frequency ratio \(a:b\) redraw the whole shape.

## visualization
```
Unit circle  x(t) = cos t ,  y(t) = sin t   as t sweeps 0 .. 2 pi

   t        x(t)=cos t    y(t)=sin t     where the pen sits
 -------    -----------   -----------    -----------------------
 0.000        1.000         0.000        far right  (1, 0)
 0.785        0.707         0.707        upper right
 1.571        0.000         1.000        top        (0, 1)
 2.356       -0.707         0.707        upper left
 3.142       -1.000         0.000        far left   (-1, 0)
 3.927       -0.707        -0.707        lower left
 4.712        0.000        -1.000        bottom     (0, -1)
 5.498        0.707        -0.707        lower right
 6.283        1.000         0.000        back to start
```

## bruteForce
The most direct way to render any parametric curve is to **sample many values of \(t\) and plot the points**. Pick a fine step \(\Delta t\), march \(t\) from its start to its end, compute \((x(t), y(t))\) at each step, and connect consecutive points with short line segments. With enough samples the polyline is visually indistinguishable from the smooth curve. It is trivial to code and works for any formula, but a uniform \(t\)-grid wastes points on straight stretches and starves tight bends, and it tells you nothing analytic about length or tangents.

## optimal
Sampling draws the curve; calculus measures it. The exact **arc length** of a parametric curve from \(t = a\) to \(t = b\) is the integral of speed over time:
\[
L = \int_a^b \sqrt{x'(t)^2 + y'(t)^2}\,dt.
\]
This says, intuitively, "speed times time, summed over the whole journey" — each infinitesimal step contributes \(\sqrt{dx^2 + dy^2}\) of length, and factoring out \(dt\) gives the speed under the root. For the unit circle over \([0, 2\pi]\) the speed is 1, so \(L = 2\pi\): the circumference, recovered without geometry.

The **tangent direction** at any point is the unit velocity \(\frac{(x'(t), y'(t))}{\sqrt{x'(t)^2 + y'(t)^2}}\), and the curve's slope is \(\frac{dy/dt}{dx/dt}\). Where the speed is constant the parameter already advances at a steady geometric pace; where it is not, you can **reparameterize by arc length** — replace \(t\) with the distance \(s\) traveled — so that equal steps in the new parameter cover equal lengths along the curve. This is exactly what animators want when a dot should glide at uniform visual speed regardless of the original formula.

For rendering, the smart move is **adaptive sampling**: place many points where the curve bends sharply (high curvature, where \(x''\) and \(y''\) are large) and few where it runs nearly straight. A common test subdivides a segment whenever the midpoint of the true curve strays too far from the chord, recursing until the error falls under a pixel. The result matches a dense uniform grid using a fraction of the points.

Finally, when possible, **eliminate the parameter** to recover a Cartesian relation. From \(x = \cos t\), \(y = \sin t\) the identity \(x^2 + y^2 = 1\) drops out — a clean implicit equation, no \(t\) in sight. Elimination is not always possible, but when it is, it hands you an exact algebraic description of the path.

```python
import math

def arc_length(x, y, dx, dy, a, b, n=2000):
    h = (b - a) / n
    total = 0.0
    for i in range(n):              # midpoint sampling of the speed integral
        t = a + (i + 0.5) * h
        total += math.hypot(dx(t), dy(t)) * h
    return total

# unit circle: circumference should be 2*pi
L = arc_length(math.cos, math.sin,
               lambda t: -math.sin(t), lambda t: math.cos(t),
               0, 2 * math.pi)
print(round(L, 5))   # 6.28319 == 2*pi
```

## complexity
time: O(n) to sample n points along the curve or to approximate arc length with an n-step numerical integral
space: O(1) when accumulating length on the fly, O(n) if you store every sampled point for plotting
notes: Adaptive sampling lowers the effective point count for a target pixel error; arc-length reparameterization needs a one-time O(n) prefix-sum of segment lengths, then O(log n) per lookup via binary search on the cumulative table.

## pitfalls
- **Assuming equal \(t\)-steps mean equal spacing along the curve.** Only true when the speed \(\sqrt{x'^2 + y'^2}\) is constant. For most curves a uniform \(t\)-grid clusters points where the motion slows and spreads them where it speeds up. Fix: reparameterize by arc length, or sample adaptively by curvature.
- **Dividing by zero at vertical tangents.** The slope \(\frac{dy/dt}{dx/dt}\) blows up wherever \(x'(t) = 0\). At those points the tangent is vertical, not undefined behavior. Fix: detect \(x'(t) = 0\) and report a vertical tangent instead of computing the ratio.
- **Ignoring orientation and direction.** \((\cos t, \sin t)\) and \((\cos(-t), \sin(-t))\) trace the same circle in opposite directions; a physics or animation result that depends on direction will be wrong. Fix: check the sign of the velocity components, not just the point set.
- **Using the wrong range or period for a closed curve.** Sweep \(t\) too far and you retrace the curve (and double the computed arc length); sweep too little and you draw a partial arc. Fix: find the fundamental period and integrate over exactly one cycle.
- **Forgetting that one shape has many parameterizations.** Comparing two curves by their formulas alone can falsely conclude they differ. Fix: eliminate the parameter or compare the point sets, not the expressions.

## interviewTips
- State the velocity vector \((x'(t), y'(t))\) is tangent and its magnitude is speed — then derive both arc length \(\int \sqrt{x'^2 + y'^2}\,dt\) and slope \(\frac{dy/dt}{dx/dt}\) from it. Interviewers want to see the one idea behind both formulas.
- When asked for the slope, flag the \(x'(t) = 0\) case as a vertical tangent before writing the quotient — handling the edge case unprompted signals rigor.
- If asked to draw a circle or any closed curve in code, reach for the parametric form immediately rather than two half-functions \(y = \pm\sqrt{r^2 - x^2}\); it is cleaner and avoids the seam at the endpoints.

## keyTakeaways
- A parametric curve is the trail of a moving point \((x(t), y(t))\); the parameter \(t\) drives the motion and lets the path loop, cross, or stand vertical.
- The velocity \((x'(t), y'(t))\) is tangent to the curve, its length is the speed, arc length is \(\int \sqrt{x'^2 + y'^2}\,dt\), and the slope is \(\frac{dy/dt}{dx/dt}\).
- The same geometric shape has many parameterizations differing in speed, direction, and start; reparameterize by arc length for uniform spacing and sample adaptively where curvature is high.

## code.python
```python
import math

def lissajous(t, a=3, b=2):
    return math.sin(a * t), math.sin(b * t)   # x(t), y(t)

n = 8
for i in range(n + 1):                          # sample t over [0, 2*pi]
    t = 2 * math.pi * i / n
    x, y = lissajous(t)
    print(f"t={t:.3f}  x={x:+.3f}  y={y:+.3f}")

# approximate arc length of one Lissajous loop via the speed integral
def speed(t, a=3, b=2):
    return math.hypot(a * math.cos(a * t), b * math.cos(b * t))

m, h = 4000, 2 * math.pi / 4000
L = sum(speed((i + 0.5) * h) * h for i in range(m))
print("arc length ~", round(L, 4))
```

## code.javascript
```javascript
const lissajous = (t, a = 3, b = 2) => [Math.sin(a * t), Math.sin(b * t)];

const n = 8;
for (let i = 0; i <= n; i++) {                 // sample t over [0, 2*pi]
  const t = (2 * Math.PI * i) / n;
  const [x, y] = lissajous(t);
  console.log(`t=${t.toFixed(3)} x=${x.toFixed(3)} y=${y.toFixed(3)}`);
}

const speed = (t, a = 3, b = 2) =>
  Math.hypot(a * Math.cos(a * t), b * Math.cos(b * t));

const m = 4000, h = (2 * Math.PI) / m;
let L = 0;
for (let i = 0; i < m; i++) L += speed((i + 0.5) * h) * h;  // midpoint rule
console.log("arc length ~", L.toFixed(4));
```

## code.java
```java
public class Parametric {
    static double[] lissajous(double t, int a, int b) {
        return new double[] { Math.sin(a * t), Math.sin(b * t) };
    }
    static double speed(double t, int a, int b) {
        return Math.hypot(a * Math.cos(a * t), b * Math.cos(b * t));
    }
    public static void main(String[] args) {
        int n = 8;
        for (int i = 0; i <= n; i++) {                 // sample over [0, 2*pi]
            double t = 2 * Math.PI * i / n;
            double[] p = lissajous(t, 3, 2);
            System.out.printf("t=%.3f x=%+.3f y=%+.3f%n", t, p[0], p[1]);
        }
        int m = 4000;
        double h = 2 * Math.PI / m, L = 0;
        for (int i = 0; i < m; i++) L += speed((i + 0.5) * h, 3, 2) * h;
        System.out.printf("arc length ~ %.4f%n", L);
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>

int main() {
    const double PI = std::acos(-1.0);
    int a = 3, b = 2, n = 8;
    for (int i = 0; i <= n; i++) {                 // sample over [0, 2*pi]
        double t = 2 * PI * i / n;
        double x = std::sin(a * t), y = std::sin(b * t);
        std::printf("t=%.3f x=%+.3f y=%+.3f\n", t, x, y);
    }
    int m = 4000;
    double h = 2 * PI / m, L = 0;
    for (int i = 0; i < m; i++) {                   // midpoint speed integral
        double t = (i + 0.5) * h;
        L += std::hypot(a * std::cos(a * t), b * std::cos(b * t)) * h;
    }
    std::printf("arc length ~ %.4f\n", L);
    return 0;
}
```
