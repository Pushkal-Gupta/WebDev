---
slug: calc-related-rates
module: calculus
title: Related Rates
subtitle: When two quantities are tied together, their rates of change are tied together too — link them with the chain rule in time.
difficulty: Intermediate
position: 7
estimatedReadMinutes: 10
prereqs: [calc-chain-rule]
relatedProblems: []
references:
  - title: "3Blue1Brown — Essence of Calculus, Chapter 6: Implicit differentiation, what's going on here?"
    url: "https://www.youtube.com/watch?v=qb40J4N1fa4"
    type: video
  - title: "Khan Academy — Related rates"
    url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-diff-contextual-applications-new/ab-4-4/v/rates-of-change-between-radius-and-area-of-circle"
    type: course
  - title: "Paul's Online Math Notes — Related Rates"
    url: "https://tutorial.math.lamar.edu/classes/calci/relatedrates.aspx"
    type: blog
status: published
---

## intro
Some quantities are locked together by geometry: the radius of a spreading puddle and its area, the height of a sliding ladder and its distance from the wall, the depth of water in a cone and its volume. If one of them changes over time, the other must change too — and the chain rule tells you *exactly how fast*. Related-rates problems take a known rate and a fixed relationship and compute the unknown rate, all without ever solving for the quantities themselves as functions of time.

## whyItMatters
The world is full of coupled quantities changing at once, and "how fast is *this* changing given how fast *that* is changing" is a question engineers and scientists answer constantly. A radar tracks an aircraft's altitude rate from its slant-range rate; a chemical engineer relates a tank's draining flow to its falling fluid level; an epidemiologist ties an infection rate to a contact rate. The core skill — differentiate a fixed relationship with respect to time and propagate one known rate into another — is the same chain-rule move that powers backpropagation in neural networks, where the rate of change of a loss is pushed backward through layer after layer of linked variables. Related rates is the gentlest, most physical place to build that instinct: a single equation, two moving quantities, one missing rate.

## intuition
The setup is always the same shape. You have two (or more) quantities bound by an equation that holds *at every instant*, and both quantities are secretly functions of time \(t\) even though \(t\) never appears in the equation. The trick is to **differentiate both sides with respect to \(t\)**, treating each variable as a function of time so the chain rule attaches a rate to each one.

Take a circle whose radius grows: the area is \(A = \pi r^2\). This relationship is true at every moment, so differentiate both sides in time. The left side becomes \(\frac{dA}{dt}\). The right side needs the chain rule, because \(r\) depends on \(t\): \(\frac{d}{dt}(\pi r^2) = \pi \cdot 2r \cdot \frac{dr}{dt}\). Putting them together,
\[
\frac{dA}{dt} = 2\pi r\,\frac{dr}{dt}.
\]
Read that as a sentence: the area's rate of change equals the circumference \(2\pi r\) times the radius's rate of change. If the radius grows at \(\frac{dr}{dt} = 3\) units/sec and the current radius is \(r = 5\), then \(\frac{dA}{dt} = 2\pi(5)(3) = 30\pi\) — the area is expanding at \(30\pi\) square units per second *right now*. Notice the rate depends on the *current* radius: the same \(\frac{dr}{dt}\) produces a faster area growth when the circle is already big, because the growing edge is longer. The \(\frac{dr}{dt}\) factor is the chain rule's fingerprint — the "inner rate" multiplying the geometric "outer rate."

The classic ladder problem shows the same machinery with a twist of sign. A ladder of fixed length \(L\) leans against a wall; its foot is \(x\) from the wall and its top is \(y\) up the wall, so the Pythagorean relation \(x^2 + y^2 = L^2\) holds at all times. Differentiate in time: \(2x\frac{dx}{dt} + 2y\frac{dy}{dt} = 0\) (the constant \(L^2\) differentiates to zero). Solve for the unknown rate: \(\frac{dy}{dt} = -\frac{x}{y}\frac{dx}{dt}\). If the foot is pulled away from the wall (\(\frac{dx}{dt} > 0\)), the minus sign forces \(\frac{dy}{dt} < 0\) — the top slides *down*, exactly as physical intuition demands. And as \(y \to 0\) (the top nearing the floor), the factor \(x/y\) blows up: the top accelerates toward the ground faster and faster, a genuinely counterintuitive prediction the math hands you for free.

The general recipe is mechanical once you see it: (1) write the equation linking the quantities, (2) differentiate every term with respect to \(t\), chain-ruling each variable, (3) plug in the known instantaneous values and the known rate, (4) solve for the unknown rate. The hardest part is usually step 1 — finding the right geometric relationship — not the calculus.

## visualization
```
Ladder sliding down a wall:  x^2 + y^2 = L^2  (L fixed)

 wall |
      |\
      | \   L (constant length)
    y |  \
      |   \
      |____\________ ground
         x        foot pulled out at dx/dt > 0

differentiate in t:   2x (dx/dt) + 2y (dy/dt) = 0
solve unknown rate:   dy/dt = -(x/y) (dx/dt)

x small, y large  ->  top barely moves
x large, y small  ->  top plunges (x/y blows up)
```

## bruteForce
The crude alternative is **finite differencing in time**: pick a small \(\Delta t\), advance the known quantity by its rate, recompute the dependent quantity from the relationship at both instants, and estimate the unknown rate as \(\frac{\text{new} - \text{old}}{\Delta t}\). For the circle that means computing \(A\) at \(r\) and at \(r + \frac{dr}{dt}\Delta t\) and dividing the change by \(\Delta t\). It works and needs no symbolic differentiation, but it is only an approximation: the answer carries truncation error of order \(\Delta t\), it is correct only at a single chosen instant, and it gives you no formula and no insight into how the rate depends on the configuration.

## optimal
The optimal method is **implicit differentiation in time** followed by an algebraic solve. Differentiate the governing equation once, symbolically, with respect to \(t\); the chain rule produces an exact linear relationship among the rates; substitute the instantaneous values and known rate; solve for the unknown rate in closed form. This is exact (no \(\Delta t\) error), valid for *every* instant (you get a formula, not a single number), and it reveals the structure — for the ladder you immediately see the \(x/y\) blow-up; for the circle you see the dependence on the current radius.

Why it beats finite differencing: the symbolic relation \(\frac{dA}{dt} = 2\pi r\,\frac{dr}{dt}\) is correct to full precision and tells you the rate at any \(r\) in one substitution, whereas the finite difference must be recomputed for each instant and is never exact. The only time you reach for the numerical version is when the linking relationship is a black box you cannot differentiate by hand — and even then, a central difference in time (error \(O(\Delta t^2)\)) beats the naive forward difference.

For systems with several coupled quantities, differentiating the constraints in time gives a *system* of linear equations in the rates; solving that linear system is the multivariable generalization, and it is precisely the chain-rule-through-a-graph computation that automatic differentiation performs when it propagates rates through a network of dependent variables.

```python
import math

def circle_area_rate(r, dr_dt):
    return 2 * math.pi * r * dr_dt        # dA/dt = 2*pi*r*(dr/dt)

def ladder_top_rate(x, y, dx_dt):
    return -(x / y) * dx_dt               # dy/dt = -(x/y)*(dx/dt)

print(round(circle_area_rate(5.0, 3.0), 6))   # 94.247780  (= 30*pi)
print(round(ladder_top_rate(3.0, 4.0, 2.0), 6))  # -1.5  (top slides down)
```

## complexity
time: O(1) — one symbolic differentiation done once, then a constant-time substitution and solve per query; O(v^3) only if you must solve a dense linear system of v coupled rates
space: O(1) for a single relationship; O(v^2) to store the coefficient matrix of a v-variable coupled system
notes: Implicit-in-time differentiation has no discretization error. A finite-difference-in-time fallback carries O(dt) error for a forward difference, O(dt^2) for a central difference, and must be recomputed at every instant of interest.

## pitfalls
- Plugging in the numbers *before* differentiating. If you substitute \(r = 5\) into \(A = \pi r^2\) first, you get a constant and its time derivative is zero. Differentiate symbolically, *then* substitute.
- Dropping the chain-rule rate factor. Differentiating \(r^2\) in time gives \(2r\frac{dr}{dt}\), not \(2r\); forgetting the \(\frac{dr}{dt}\) is the single most common error.
- Confusing a constant with a variable. In the ladder, \(L\) is fixed so \(\frac{dL}{dt}=0\); in other problems the "fixed" quantity might actually be moving — read the problem to decide what is constant.
- Sign and direction mistakes. A quantity that is *decreasing* has a negative rate; "the top of the ladder slides down" means \(\frac{dy}{dt} < 0\). Carry the signs through the algebra rather than patching them at the end.
- Treating the rate as configuration-independent. \(\frac{dA}{dt}\) depends on the current \(r\); the same \(\frac{dr}{dt}\) gives different area rates at different sizes. The instantaneous values must be substituted at the instant of interest.

## interviewTips
- Recite the four-step recipe: write the relationship, differentiate every term with respect to \(t\) (chain rule on each variable), substitute the instant's values and known rate, solve for the unknown rate.
- Differentiate *before* substituting numbers, and say so out loud — interviewers watch for the candidate who freezes a variable too early.
- Use a constraint (like Pythagoras or a similar-triangles ratio) to eliminate extra variables down to the two whose rates you care about, then differentiate that single equation.

## keyTakeaways
- Quantities tied by a fixed equation have rates tied by the time-derivative of that equation; the chain rule attaches a rate factor to each variable.
- Differentiate symbolically first, substitute the instantaneous values second — substituting too early collapses a variable into a constant and loses its rate.
- The resulting rate generally depends on the current configuration (the circle's area grows faster when it is already large; the ladder's top plunges as it nears the floor).

## code.python
```python
import math

def related_rate_circle(r, dr_dt):
    # A = pi r^2  ->  dA/dt = 2 pi r (dr/dt)
    return 2 * math.pi * r * dr_dt

def related_rate_ladder(x, y, dx_dt):
    # x^2 + y^2 = L^2  ->  dy/dt = -(x/y)(dx/dt)
    return -(x / y) * dx_dt

print(round(related_rate_circle(5.0, 3.0), 4))    # 94.2478  (30*pi)
print(round(related_rate_ladder(3.0, 4.0, 2.0), 4))  # -1.5
```

## code.javascript
```javascript
function relatedRateCircle(r, drDt) {
  return 2 * Math.PI * r * drDt;          // dA/dt = 2 pi r (dr/dt)
}

function relatedRateLadder(x, y, dxDt) {
  return -(x / y) * dxDt;                 // dy/dt = -(x/y)(dx/dt)
}

console.log(relatedRateCircle(5, 3).toFixed(4));     // 94.2478
console.log(relatedRateLadder(3, 4, 2).toFixed(4));  // -1.5000
```

## code.java
```java
public class RelatedRates {
    static double circle(double r, double drDt) {
        return 2 * Math.PI * r * drDt;       // dA/dt = 2 pi r (dr/dt)
    }

    static double ladder(double x, double y, double dxDt) {
        return -(x / y) * dxDt;              // dy/dt = -(x/y)(dx/dt)
    }

    public static void main(String[] args) {
        System.out.printf("%.4f%n", circle(5, 3));     // 94.2478
        System.out.printf("%.4f%n", ladder(3, 4, 2));  // -1.5000
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>

double circleRate(double r, double drDt) {
    return 2 * M_PI * r * drDt;             // dA/dt = 2 pi r (dr/dt)
}

double ladderRate(double x, double y, double dxDt) {
    return -(x / y) * dxDt;                 // dy/dt = -(x/y)(dx/dt)
}

int main() {
    std::printf("%.4f\n", circleRate(5.0, 3.0));     // 94.2478
    std::printf("%.4f\n", ladderRate(3.0, 4.0, 2.0)); // -1.5000
    return 0;
}
```
