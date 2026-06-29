---
slug: calc-vector-fields
module: calculus
title: Vector Fields
subtitle: A field of arrows covering the plane — drop a particle in and watch it flow along the current.
difficulty: Advanced
position: 11
estimatedReadMinutes: 10
prereqs: [calc-parametric-curves, calc-derivative-as-slope]
relatedProblems: []
references:
  - title: "3Blue1Brown — Divergence and curl: The language of Maxwell's equations, fluid flow, and more"
    url: "https://www.youtube.com/watch?v=rB83DpBJQsE"
    type: video
  - title: "Khan Academy — Vector fields, line integrals, flux (Multivariable calculus)"
    url: "https://www.khanacademy.org/math/multivariable-calculus/integrating-multivariable-functions"
    type: course
  - title: "Paul's Online Math Notes — Vector Fields"
    url: "https://tutorial.math.lamar.edu/classes/calciii/vectorfields.aspx"
    type: blog
status: published
---

## intro
A vector field attaches a whole vector — a direction and a magnitude — to every point of space. Where an ordinary function \(f(x, y)\) hands you a single number at each point, a vector field \(\mathbf{F}(x, y) = (P(x,y),\, Q(x,y))\) hands you an arrow. Picture the wind across a weather map: at every spot there is a gust pointing some way with some strength. The field is the rule that turns each location into that gust, and the plane fills with arrows describing the flow everywhere at once.

## whyItMatters
Vector fields are the native language of anything that flows or pushes. Fluid velocity, the electric and magnetic fields of Maxwell's equations, the gravitational pull around a mass, heat flux through a material — each is literally a vector at every point of space. They run deep in machine learning too: the gradient \(\nabla f\) of a loss surface is a vector field, and **gradient descent** is nothing but a particle released into the field \(-\nabla f\), drifting downhill toward a minimum. Weather prediction, aerodynamics, electromagnetism, and optimization all reduce to reading and integrating vector fields, which is why the tools for visualizing and following them carry across every quantitative discipline.

## intuition
Start with the picture. Lay a grid over the plane, and at each grid point \((x, y)\) draw the arrow \(\mathbf{F}(x, y)\): its direction is where the field pushes and its length is how hard. That cloud of arrows *is* the field. Now drop a tiny particle at some start point and let the field carry it. At each instant the particle's velocity equals the field arrow under its feet, so its motion obeys the differential equation \(\frac{d\mathbf{r}}{dt} = \mathbf{F}(\mathbf{r})\). The smooth path it traces is a **streamline** (also called a flow line or integral curve) — a curve that is everywhere tangent to the arrows. The arrows are the instantaneous instruction; the streamline is the trajectory that instruction produces.

A worked example makes it concrete. Take \(\mathbf{F}(x, y) = (-y,\, x)\). At the point \((1, 0)\) the arrow is \((0, 1)\), pointing straight up; at \((0, 1)\) it is \((-1, 0)\), pointing left; at \((-1, 0)\) it points down. Every arrow is perpendicular to the line from the origin, so a particle dropped anywhere circles the origin forever — the streamlines are circles, and this is a pure **rotation** field. Contrast it with \(\mathbf{F}(x, y) = (x, y)\), whose arrow at every point aims directly away from the origin: particles fly outward along straight rays, a **source**.

Three summary quantities read the local behavior. A **gradient field** \(\mathbf{F} = \nabla f\) always points uphill on the surface \(f\), so \(-\nabla f\) points downhill — exactly the direction gradient descent steps. The **divergence** measures net outflow from a tiny region: positive at a source where arrows spread apart, negative at a sink where they converge. The **curl** measures local spinning: nonzero for the rotation field above, zero for a pure source. Together direction, divergence, and curl tell you how a parcel of fluid would translate, expand, and rotate as the field carries it.

## visualization
```
Integrate one streamline of F = (-y, x) by Euler steps, dt = 0.20:

  step   x        y        Fx=-y    Fy= x
  ----   ------   ------   ------   ------
   0     1.000    0.000    0.000    1.000
   1     1.000    0.200   -0.200    1.000
   2     0.960    0.400   -0.400    0.960
   3     0.880    0.592   -0.592    0.880
   4     0.762    0.768   -0.768    0.762
   5     0.608    0.920   -0.920    0.608

update rule:  x <- x + dt * Fx,   y <- y + dt * Fy
the point swings counter-clockwise — a circular streamline.
```

## bruteForce
The crudest way to understand a field is to **sample it on a grid**: pick a spacing, evaluate \(\mathbf{F}\) at every node, and draw each arrow. Denser grids reveal more structure — sources, sinks, swirls — but the cost grows with the square of the resolution in 2-D and the cube in 3-D, and a fixed-length arrow at every node hides magnitude unless you scale or color it. Grid sampling shows the *instantaneous* arrows but never the *trajectories*: to see where a particle actually goes you must integrate a streamline, which sampling alone cannot give you.

## optimal
To trace where the flow takes a particle you integrate the streamline ODE \(\frac{d\mathbf{r}}{dt} = \mathbf{F}(\mathbf{r})\). The simplest integrator is **Euler's method**: step \(\mathbf{r}_{k+1} = \mathbf{r}_k + \Delta t\,\mathbf{F}(\mathbf{r}_k)\). It is one field evaluation per step but only first-order accurate, so on curved fields like rotation it systematically drifts outward — circles spiral away as error accumulates. **RK4** (fourth-order Runge–Kutta) samples the field four times per step and combines the slopes, achieving error \(O(\Delta t^4)\) versus Euler's \(O(\Delta t)\); the same circle stays a circle for thousands of steps. When the field has regions of sharp turning, **adaptive step size** shrinks \(\Delta t\) where the curvature is high and grows it where the flow is gentle, spending evaluations only where they buy accuracy.

For plotting, **normalize the arrows** to a fixed display length and encode the true magnitude as color — otherwise a few huge vectors near a singularity dominate the figure and the rest collapse to invisible specks. A special and important case is a **conservative field**, one that is the gradient of a scalar potential, \(\mathbf{F} = \nabla \phi\). For these the line integral between two points depends only on the endpoints, not the path taken: \(\int_C \mathbf{F}\cdot d\mathbf{r} = \phi(\text{end}) - \phi(\text{start})\). When you recognize a conservative field, never integrate the path numerically — just evaluate the potential at the two ends, the exact analogue of the Fundamental Theorem of Calculus for fields. The decision tree: conservative field with a known potential → evaluate \(\phi\); smooth field, trajectory needed → RK4 with adaptive steps; just visualizing direction → normalized, color-coded grid arrows.

## complexity
time: O(grid^d) to sample a field on a d-dimensional grid; O(steps) to integrate one streamline, with 1 field evaluation per Euler step or 4 per RK4 step; O(1) for a conservative line integral via the potential
space: O(1) per integrated streamline (carry the current point); O(grid^d) to store a sampled field
notes: RK4 error is O(dt^4) vs Euler's O(dt) — RK4 is far cheaper for a target accuracy despite 4 evaluations per step. Adaptive stepping concentrates work where curvature is high.

## pitfalls
- **Euler drift on curved fields.** First-order Euler spirals outward on rotation and similar curved flows because each straight step overshoots the turn. Fix: use RK4 (or shrink \(\Delta t\) drastically), and verify a closed orbit actually closes.
- **Arrow-length overflow without normalization.** Plotting raw magnitudes lets a few large vectors near a source or singularity swamp the figure. Fix: normalize every arrow to a fixed display length and put the magnitude into color.
- **Singularities where the field blows up.** Fields like \(\mathbf{F} = \mathbf{r}/\lVert\mathbf{r}\rVert^3\) diverge at the origin; an integrator that steps onto the singularity produces NaNs or infinite velocity. Fix: detect and skip points near the singularity, or cap the step.
- **Confusing the field with its streamlines.** The arrows are instantaneous velocities; the streamlines are the integrated paths. Reading a streamline's curvature as if it were an arrow, or vice versa, gives wrong trajectories. Fix: keep the two representations distinct — arrows are \(\mathbf{F}(x,y)\), streamlines are solutions of \(d\mathbf{r}/dt = \mathbf{F}\).

## interviewTips
- State the definition crisply: a vector field maps each point to a vector, \(\mathbf{F}(x,y) = (P, Q)\), and a streamline solves \(d\mathbf{r}/dt = \mathbf{F}\) — show you separate the arrows from the paths.
- When asked to integrate a trajectory, name your integrator and its order (Euler \(O(\Delta t)\), RK4 \(O(\Delta t^4)\)) and justify the choice; do not default to Euler on a curved field.
- Recognize a conservative field (\(\mathbf{F} = \nabla\phi\), equivalently curl zero on a simply-connected domain) and evaluate the potential at the endpoints instead of integrating the path — path-independence is the clean shortcut.

## keyTakeaways
- A vector field assigns an arrow to every point; a streamline is the path a particle traces by always following the local arrow, solving \(d\mathbf{r}/dt = \mathbf{F}\).
- Integrate streamlines with RK4 (error \(O(\Delta t^4)\)) rather than Euler (\(O(\Delta t)\)) on curved fields, and normalize arrows to a fixed length with color-encoded magnitude for readable plots.
- Conservative fields \(\mathbf{F} = \nabla\phi\) have path-independent line integrals — evaluate the potential at the endpoints instead of integrating; gradient descent is a particle flowing along \(-\nabla f\).

## code.python
```python
import math

def F(x, y):           # rotation field: streamlines are circles
    return (-y, x)

def streamline(x, y, dt=0.1, steps=40):
    pts = [(x, y)]
    for _ in range(steps):          # RK4 step of dr/dt = F(r)
        k1x, k1y = F(x, y)
        k2x, k2y = F(x + 0.5*dt*k1x, y + 0.5*dt*k1y)
        k3x, k3y = F(x + 0.5*dt*k2x, y + 0.5*dt*k2y)
        k4x, k4y = F(x + dt*k3x, y + dt*k3y)
        x += dt*(k1x + 2*k2x + 2*k3x + k4x)/6
        y += dt*(k1y + 2*k2y + 2*k3y + k4y)/6
        pts.append((x, y))
    return pts

path = streamline(1.0, 0.0)
for i in (0, 10, 20, 30, 40):
    x, y = path[i]
    print(f"t={i*0.1:.1f}  ({x:+.3f}, {y:+.3f})  r={math.hypot(x, y):.4f}")
# r stays ~1.0 — RK4 keeps the orbit circular
```

## code.javascript
```javascript
const F = (x, y) => [-y, x]; // rotation field

function streamline(x, y, dt = 0.1, steps = 40) {
  const pts = [[x, y]];
  for (let s = 0; s < steps; s++) {        // RK4
    const [k1x, k1y] = F(x, y);
    const [k2x, k2y] = F(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y);
    const [k3x, k3y] = F(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y);
    const [k4x, k4y] = F(x + dt * k3x, y + dt * k3y);
    x += (dt * (k1x + 2 * k2x + 2 * k3x + k4x)) / 6;
    y += (dt * (k1y + 2 * k2y + 2 * k3y + k4y)) / 6;
    pts.push([x, y]);
  }
  return pts;
}

const path = streamline(1.0, 0.0);
for (const i of [0, 10, 20, 30, 40]) {
  const [x, y] = path[i];
  console.log(`t=${(i * 0.1).toFixed(1)}  (${x.toFixed(3)}, ${y.toFixed(3)})  r=${Math.hypot(x, y).toFixed(4)}`);
}
```

## code.java
```java
public class Streamline {
    static double[] F(double x, double y) { return new double[]{-y, x}; } // rotation

    public static void main(String[] args) {
        double x = 1.0, y = 0.0, dt = 0.1;
        for (int s = 0; s <= 40; s++) {
            if (s % 10 == 0)
                System.out.printf("t=%.1f  (%+.3f, %+.3f)  r=%.4f%n",
                    s * dt, x, y, Math.hypot(x, y));
            double[] k1 = F(x, y);
            double[] k2 = F(x + 0.5 * dt * k1[0], y + 0.5 * dt * k1[1]);
            double[] k3 = F(x + 0.5 * dt * k2[0], y + 0.5 * dt * k2[1]);
            double[] k4 = F(x + dt * k3[0], y + dt * k3[1]);
            x += dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6;
            y += dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;
        }
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <array>

std::array<double, 2> F(double x, double y) { return {-y, x}; } // rotation

int main() {
    double x = 1.0, y = 0.0, dt = 0.1;
    for (int s = 0; s <= 40; s++) {
        if (s % 10 == 0)
            std::printf("t=%.1f  (%+.3f, %+.3f)  r=%.4f\n",
                s * dt, x, y, std::hypot(x, y));
        auto k1 = F(x, y);
        auto k2 = F(x + 0.5 * dt * k1[0], y + 0.5 * dt * k1[1]);
        auto k3 = F(x + 0.5 * dt * k2[0], y + 0.5 * dt * k2[1]);
        auto k4 = F(x + dt * k3[0], y + dt * k3[1]);
        x += dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6;
        y += dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;
    }
    return 0;
}
```
