---
slug: gfx-raytracing
module: computer-graphics
title: Ray Tracing — Shooting Rays into a Scene
subtitle: Trace a ray P(t)=O+tD into the scene, solve for the nearest hit, then spawn shadow and reflection rays — the opposite of rasterization's project-and-fill loop.
difficulty: Advanced
position: 4
estimatedReadMinutes: 15
prereqs: []
relatedProblems: []
references:
  - title: "Peter Shirley — Ray Tracing in One Weekend"
    url: "https://raytracing.github.io/books/RayTracingInOneWeekend.html"
    type: book
  - title: "Scratchapixel — Ray-Tracing: Rendering a scene / ray-sphere intersection"
    url: "https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-sphere-intersection.html"
    type: article
  - title: "Real-Time Rendering, 4th ed. — Ray Tracing (Chapter 26)"
    url: "https://www.realtimerendering.com/"
    type: book
  - title: "Scratchapixel — Introduction to ray tracing: whitted-style"
    url: "https://www.scratchapixel.com/lessons/3d-basic-rendering/introduction-to-ray-tracing/how-does-it-work.html"
    type: article
status: published
---

## intro
Rasterization asks, for each triangle, *which pixels does it cover?* Ray tracing flips the question: for each pixel, *what does the scene look like along the line of sight through it?* You shoot a ray out of the camera, through that pixel, into the world, and find the first surface it strikes. From that hit point you can shoot more rays — toward the light to test for shadow, along the mirror direction to gather a reflection — and each of those may spawn still more. The whole image is built by tracing lines through geometry and solving small intersection equations, which is why reflections, shadows, and refraction fall out almost for free where rasterization has to fake them.

## whyItMatters
Ray tracing is the model behind every photorealistic frame you have ever seen — film visual effects, product renders, architectural walkthroughs, and, since dedicated RT cores shipped on GPUs, real-time game reflections and shadows. It matters because it computes light *transport* directly: a shadow is just a ray that failed to reach the light, a reflection is just a ray that kept going in the mirror direction, and global illumination is rays bouncing until they find a source. That single, uniform mechanism replaces the pile of specialized hacks (shadow maps, cube-map reflections, screen-space tricks) that rasterization needs. Understanding intersection math, the primary-versus-secondary-ray split, and why acceleration structures are non-negotiable is the core of modern rendering literacy — and the same ray-versus-geometry queries power collision detection, physics, and GPU picking.

## intuition
A ray is a half-line: a starting point and a direction. Written parametrically it is \(\mathbf{P}(t)=\mathbf{O}+t\mathbf{D}\), where \(\mathbf{O}\) is the ray origin (the camera for a primary ray), \(\mathbf{D}\) is the direction, and \(t\ge 0\) slides the point forward along the ray. Every intersection test is the same move: substitute \(\mathbf{P}(t)\) into a surface's equation and solve for \(t\). The smallest positive \(t\) is the nearest thing the ray sees.

For a sphere of center \(\mathbf{C}\) and radius \(r\), every surface point satisfies \(\lVert \mathbf{X}-\mathbf{C}\rVert^2=r^2\). Plug in the ray: \(\lVert \mathbf{O}+t\mathbf{D}-\mathbf{C}\rVert^2=r^2\). Let \(\mathbf{L}=\mathbf{O}-\mathbf{C}\). Expanding the dot product gives a quadratic in \(t\):
\[
at^2+bt+c=0,\quad a=\mathbf{D}\cdot\mathbf{D},\; b=2\,\mathbf{L}\cdot\mathbf{D},\; c=\mathbf{L}\cdot\mathbf{L}-r^2.
\]
The discriminant \(b^2-4ac\) tells the whole story: negative means the ray misses, zero means it grazes the surface tangentially, positive means two crossings (entry and exit) at \(t=\frac{-b\pm\sqrt{b^2-4ac}}{2a}\) — and you take the smaller positive root as the hit.

A plane with point \(\mathbf{Q}\) and normal \(\mathbf{N}\) is even simpler: \((\mathbf{P}(t)-\mathbf{Q})\cdot\mathbf{N}=0\) solves in one step to \(t=\frac{(\mathbf{Q}-\mathbf{O})\cdot\mathbf{N}}{\mathbf{D}\cdot\mathbf{N}}\), undefined only when the ray is parallel to the plane.

Once you have a hit point and its surface normal \(\mathbf{N}\), two secondary rays do the shading work. A **shadow ray** points from the hit toward the light; if it strikes any object before reaching the light, the point is in shadow. A **reflection ray** leaves along the mirror direction \(\mathbf{R}=\mathbf{D}-2(\mathbf{D}\cdot\mathbf{N})\mathbf{N}\), which flips the component of \(\mathbf{D}\) along the normal while leaving the tangential part alone. Recurse on that reflected ray and mirror surfaces reflect the world.

## visualization
```
Primary ray  P(t) = O + tD,  O=(0,0),  D=(1,0) marching along the x axis.
Scene: sphere center (6,0) r=1.5  |  floor plane y = -2

   t   |   P(t) = O + tD   | nearest surface at this t
 ------+-------------------+----------------------------------
  0.0  |   (0.00, 0.00)    |  in free space
  2.0  |   (2.00, 0.00)    |  in free space
  4.5  |   (4.50, 0.00)    |  <- enters sphere (t1 root, discriminant > 0)
  6.0  |   (6.00, 0.00)    |  inside sphere (between t1 and t2)
  7.5  |   (7.50, 0.00)    |  exits sphere (t2 root) — HIT recorded at t1=4.5

  Rasterization vs Ray tracing
  ------------------+--------------------------+--------------------------
   axis             |  rasterization           |  ray tracing
  ------------------+--------------------------+--------------------------
   per-pixel cost   |  cheap (fill covered px) |  costly (scene traversal)
   reflections      |  faked (cube/SSR hacks)  |  native (spawn ray)
   shadows          |  shadow maps (approx)    |  native (shadow ray)
   hardware fit     |  excellent (GPU raster)  |  needs BVH + RT cores
```

## bruteForce
The literal algorithm is a double loop: for every pixel, build the primary ray, then test that ray against **every** object in the scene, keeping the smallest positive \(t\). With \(P\) pixels and \(N\) objects that is \(O(P\times N)\) intersection tests for the primary rays alone — and each shadow ray and reflection bounce multiplies the count again, since it too is tested against all \(N\) objects. It needs nothing clever: a ray-sphere solve, a ray-plane solve, a running "closest hit so far." For a handful of spheres it is perfectly fine and is exactly how a teaching ray tracer starts. But it scales linearly with scene complexity, so a film scene of millions of triangles makes the naive per-ray sweep hopeless — every ray paying to look at geometry nowhere near it.

## optimal
The fix is to stop testing every ray against every object. A **bounding volume hierarchy (BVH)** wraps the scene in a tree of nested boxes: each node holds a box that encloses its children, and a ray first tests the cheap box before descending. Rays that miss a box skip its entire subtree, so a single ray query drops from \(O(N)\) to about \(O(\log N)\), turning primary-ray cost from \(O(P\times N)\) into roughly \(O(P\times \log N)\). This is what makes ray tracing tractable at scale, and it is precisely what GPU RT cores accelerate in hardware — box and triangle intersection plus BVH traversal baked into silicon. Alternatives (uniform grids, k-d trees) trade build cost against traversal cost, but a BVH is the workhorse.

Three correctness details separate a real tracer from a toy. **First, epsilon offset.** A shadow or reflection ray starting exactly on the surface will, due to floating-point error, immediately re-intersect the very surface it left — producing "shadow acne," a speckled self-shadowing. The fix is to nudge the secondary ray's origin a tiny \(\varepsilon\) along the normal (or require \(t>\varepsilon\)) so it clears the surface. **Second, a recursion depth cap.** Two mirrors facing each other would bounce a reflection ray forever; every recursive tracer carries a maximum depth (commonly 4–8) and returns a background or ambient color at the limit. **Third, choosing the right root.** The sphere quadratic gives two \(t\) values; you must take the nearest *positive* one — the smaller root if it is ahead of the origin, otherwise the larger — never just the smaller of the two, which may sit behind the camera. Get these three right and the classic Whitted-style pipeline — trace primary, shade with shadow rays, recurse on reflection/refraction rays, composite — produces sharp shadows and true mirror reflections that rasterization can only approximate. Production renderers go further with Monte-Carlo path tracing for soft shadows and global illumination, and games run **hybrid pipelines**: rasterize primary visibility for speed, then trace secondary rays only for reflections and shadows.

## complexity
time: Naive tracer is \(O(P\times N\times R)\) — \(P\) pixels, \(N\) objects, \(R\) rays per pixel (primary + shadow + reflection bounces). A BVH cuts each ray's object test to \(O(\log N)\), giving \(O(P\times R\times \log N)\). Building the BVH is a one-time \(O(N\log N)\).
space: \(O(N)\) for the scene plus \(O(N)\) for the BVH nodes; recursion uses \(O(\text{depth})\) stack, bounded by the depth cap. The framebuffer is \(O(P)\).
notes: Each additional bounce roughly multiplies ray count; the depth cap keeps \(R\) finite. Anti-aliasing multiplies \(P\) by the samples-per-pixel. Ray tracing is embarrassingly parallel across pixels, which is why it maps so well onto GPUs once a BVH exists.

## pitfalls
- **Shadow acne / self-intersection.** A secondary ray launched from the exact hit point re-hits its own surface at \(t\approx 0\) because of rounding, speckling the surface with false shadow. Fix: offset the ray origin by a small \(\varepsilon\) along the surface normal, or reject intersections with \(t<\varepsilon\).
- **Infinite reflection recursion.** Mirror-facing-mirror (or any highly reflective closed scene) makes reflection rays recurse without end. Fix: carry a depth counter and return the background/ambient color once a maximum bounce depth is reached.
- **Picking the wrong quadratic root.** Taking the smaller of the two sphere roots blindly can select a hit *behind* the camera (negative \(t\)). Fix: choose the nearest root with \(t>\varepsilon\) — try the smaller root first, fall back to the larger, and discard the hit if both are negative.
- **Floating-point on grazing rays.** When the discriminant is nearly zero (a ray skimming a sphere tangentially) or a ray is almost parallel to a plane (\(\mathbf{D}\cdot\mathbf{N}\approx 0\)), the math is numerically fragile and division blows up. Fix: guard the near-parallel plane case, treat tiny discriminants as misses, and keep a consistent \(\varepsilon\) tolerance.

## interviewTips
- Derive the ray-sphere quadratic on the spot: substitute \(\mathbf{P}(t)=\mathbf{O}+t\mathbf{D}\) into \(\lVert\mathbf{X}-\mathbf{C}\rVert^2=r^2\), expand to \(at^2+bt+c=0\), and explain that the discriminant's sign (miss / graze / two hits) decides everything. Deriving beats memorizing.
- Contrast rasterization and ray tracing crisply: rasterization projects triangles and is cheap and hardware-coherent but fakes reflections and shadows; ray tracing shoots rays per pixel and handles reflection, shadow, and global illumination natively but is costlier and needs a BVH. Mention that games use hybrid pipelines to get both.
- Name the three "gotcha" fixes — epsilon offset for shadow acne, a recursion depth cap for reflections, and nearest-positive-root selection. Volunteering the failure modes and their fixes signals you have actually written a tracer.

## keyTakeaways
- Every ray query is one move: substitute \(\mathbf{P}(t)=\mathbf{O}+t\mathbf{D}\) into a surface equation and take the nearest positive \(t\); the sphere case is a quadratic whose discriminant \(b^2-4ac\) decides miss / graze / hit.
- Secondary rays do the lighting: a **shadow ray** to the light tests occlusion, and a **reflection ray** along \(\mathbf{R}=\mathbf{D}-2(\mathbf{D}\cdot\mathbf{N})\mathbf{N}\) recurses to gather mirror color — with an \(\varepsilon\) offset and a depth cap keeping them stable.
- Ray tracing handles reflections, shadows, and global illumination natively but costs \(O(P\times\log N)\) per frame with a BVH, whereas rasterization is faster and hardware-coherent yet fakes those effects — so real engines run hybrid pipelines.

## code.python
```python
import math

def sub(a, b): return (a[0]-b[0], a[1]-b[1], a[2]-b[2])
def add(a, b): return (a[0]+b[0], a[1]+b[1], a[2]+b[2])
def scale(a, s): return (a[0]*s, a[1]*s, a[2]*s)
def dot(a, b): return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
def norm(a):
    m = math.sqrt(dot(a, a))
    return (a[0]/m, a[1]/m, a[2]/m)

EPS = 1e-4

def hit_sphere(O, D, C, r):
    L = sub(O, C)
    a = dot(D, D)
    b = 2 * dot(L, D)
    c = dot(L, L) - r * r
    disc = b * b - 4 * a * c
    if disc < 0:
        return None
    s = math.sqrt(disc)
    for t in ((-b - s) / (2 * a), (-b + s) / (2 * a)):
        if t > EPS:
            return t
    return None

def hit_plane(O, D, Q, N):
    dn = dot(D, N)
    if abs(dn) < 1e-9:
        return None
    t = dot(sub(Q, O), N) / dn
    return t if t > EPS else None

def reflect(D, N):
    return sub(D, scale(N, 2 * dot(D, N)))

def trace(O, D, scene, light, depth=0):
    best_t, best = math.inf, None
    for obj in scene:
        t = (hit_sphere(O, D, obj['c'], obj['r']) if obj['type'] == 'sphere'
             else hit_plane(O, D, obj['q'], obj['n']))
        if t is not None and t < best_t:
            best_t, best = t, obj
    if best is None:
        return 0.05  # background
    P = add(O, scale(D, best_t))
    N = (norm(sub(P, best['c'])) if best['type'] == 'sphere' else best['n'])
    to_light = norm(sub(light, P))
    # shadow ray: offset origin to avoid self-hit (shadow acne)
    origin = add(P, scale(N, EPS))
    shadowed = any(
        (hit_sphere(origin, to_light, o['c'], o['r']) if o['type'] == 'sphere'
         else hit_plane(origin, to_light, o['q'], o['n'])) is not None
        for o in scene if o is not best)
    diffuse = 0.0 if shadowed else max(0.0, dot(N, to_light))
    color = 0.1 + 0.9 * diffuse
    if best.get('mirror') and depth < 4:  # recursive reflection with depth cap
        R = norm(reflect(D, N))
        color = 0.6 * color + 0.4 * trace(origin, R, scene, light, depth + 1)
    return color

scene = [
    {'type': 'sphere', 'c': (0, 0, -5), 'r': 1.0, 'mirror': True},
    {'type': 'plane', 'q': (0, -1, 0), 'n': (0, 1, 0)},
]
light = (5, 5, 0)
O = (0, 0, 0)
D = norm((0, 0, -1))
print(round(trace(O, D, scene, light), 4))
```

## code.javascript
```javascript
const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const add = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
const scale = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const norm = (a) => { const m = Math.sqrt(dot(a, a)); return [a[0]/m, a[1]/m, a[2]/m]; };
const EPS = 1e-4;

function hitSphere(O, D, C, r) {
  const L = sub(O, C);
  const a = dot(D, D), b = 2 * dot(L, D), c = dot(L, L) - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  for (const t of [(-b - s) / (2 * a), (-b + s) / (2 * a)]) if (t > EPS) return t;
  return null;
}

function hitPlane(O, D, Q, N) {
  const dn = dot(D, N);
  if (Math.abs(dn) < 1e-9) return null;
  const t = dot(sub(Q, O), N) / dn;
  return t > EPS ? t : null;
}

const reflect = (D, N) => sub(D, scale(N, 2 * dot(D, N)));

function hit(o, O, D) {
  return o.type === 'sphere' ? hitSphere(O, D, o.c, o.r) : hitPlane(O, D, o.q, o.n);
}

function trace(O, D, scene, light, depth = 0) {
  let bestT = Infinity, best = null;
  for (const o of scene) { const t = hit(o, O, D); if (t !== null && t < bestT) { bestT = t; best = o; } }
  if (!best) return 0.05;
  const P = add(O, scale(D, bestT));
  const N = best.type === 'sphere' ? norm(sub(P, best.c)) : best.n;
  const toLight = norm(sub(light, P));
  const origin = add(P, scale(N, EPS));
  const shadowed = scene.some((o) => o !== best && hit(o, origin, toLight) !== null);
  const diffuse = shadowed ? 0 : Math.max(0, dot(N, toLight));
  let color = 0.1 + 0.9 * diffuse;
  if (best.mirror && depth < 4) {
    const R = norm(reflect(D, N));
    color = 0.6 * color + 0.4 * trace(origin, R, scene, light, depth + 1);
  }
  return color;
}

const scene = [
  { type: 'sphere', c: [0, 0, -5], r: 1, mirror: true },
  { type: 'plane', q: [0, -1, 0], n: [0, 1, 0] },
];
console.log(trace([0, 0, 0], norm([0, 0, -1]), scene, [5, 5, 0]).toFixed(4));
```

## code.java
```java
public class RayTracer {
    static double[] sub(double[] a, double[] b) { return new double[]{a[0]-b[0], a[1]-b[1], a[2]-b[2]}; }
    static double[] add(double[] a, double[] b) { return new double[]{a[0]+b[0], a[1]+b[1], a[2]+b[2]}; }
    static double[] scale(double[] a, double s) { return new double[]{a[0]*s, a[1]*s, a[2]*s}; }
    static double dot(double[] a, double[] b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
    static double[] norm(double[] a) { double m = Math.sqrt(dot(a, a)); return new double[]{a[0]/m, a[1]/m, a[2]/m}; }
    static final double EPS = 1e-4;

    static Double hitSphere(double[] O, double[] D, double[] C, double r) {
        double[] L = sub(O, C);
        double a = dot(D, D), b = 2 * dot(L, D), c = dot(L, L) - r * r;
        double disc = b * b - 4 * a * c;
        if (disc < 0) return null;
        double s = Math.sqrt(disc);
        for (double t : new double[]{(-b - s) / (2 * a), (-b + s) / (2 * a)}) if (t > EPS) return t;
        return null;
    }

    static Double hitPlane(double[] O, double[] D, double[] Q, double[] N) {
        double dn = dot(D, N);
        if (Math.abs(dn) < 1e-9) return null;
        double t = dot(sub(Q, O), N) / dn;
        return t > EPS ? t : null;
    }

    static double[] reflect(double[] D, double[] N) { return sub(D, scale(N, 2 * dot(D, N))); }

    static Double hit(Obj o, double[] O, double[] D) {
        return o.sphere ? hitSphere(O, D, o.p, o.r) : hitPlane(O, D, o.p, o.n);
    }

    static class Obj {
        boolean sphere, mirror; double[] p, n; double r;
        Obj(boolean sphere, double[] p, double[] n, double r, boolean mirror) {
            this.sphere = sphere; this.p = p; this.n = n; this.r = r; this.mirror = mirror;
        }
    }

    static double trace(double[] O, double[] D, Obj[] scene, double[] light, int depth) {
        double bestT = Double.POSITIVE_INFINITY; Obj best = null;
        for (Obj o : scene) { Double t = hit(o, O, D); if (t != null && t < bestT) { bestT = t; best = o; } }
        if (best == null) return 0.05;
        double[] P = add(O, scale(D, bestT));
        double[] N = best.sphere ? norm(sub(P, best.p)) : best.n;
        double[] toLight = norm(sub(light, P));
        double[] origin = add(P, scale(N, EPS));
        boolean shadowed = false;
        for (Obj o : scene) if (o != best && hit(o, origin, toLight) != null) { shadowed = true; break; }
        double diffuse = shadowed ? 0 : Math.max(0, dot(N, toLight));
        double color = 0.1 + 0.9 * diffuse;
        if (best.mirror && depth < 4) {
            double[] R = norm(reflect(D, N));
            color = 0.6 * color + 0.4 * trace(origin, R, scene, light, depth + 1);
        }
        return color;
    }

    public static void main(String[] args) {
        Obj[] scene = {
            new Obj(true, new double[]{0, 0, -5}, null, 1.0, true),
            new Obj(false, new double[]{0, -1, 0}, new double[]{0, 1, 0}, 0, false),
        };
        double c = trace(new double[]{0, 0, 0}, norm(new double[]{0, 0, -1}), scene, new double[]{5, 5, 0}, 0);
        System.out.printf("%.4f%n", c);
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <vector>
#include <array>
#include <optional>

using V = std::array<double, 3>;
V sub(V a, V b) { return {a[0]-b[0], a[1]-b[1], a[2]-b[2]}; }
V add(V a, V b) { return {a[0]+b[0], a[1]+b[1], a[2]+b[2]}; }
V scale(V a, double s) { return {a[0]*s, a[1]*s, a[2]*s}; }
double dot(V a, V b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
V norm(V a) { double m = std::sqrt(dot(a, a)); return {a[0]/m, a[1]/m, a[2]/m}; }
const double EPS = 1e-4;

std::optional<double> hitSphere(V O, V D, V C, double r) {
    V L = sub(O, C);
    double a = dot(D, D), b = 2 * dot(L, D), c = dot(L, L) - r * r;
    double disc = b * b - 4 * a * c;
    if (disc < 0) return std::nullopt;
    double s = std::sqrt(disc);
    for (double t : {(-b - s) / (2 * a), (-b + s) / (2 * a)}) if (t > EPS) return t;
    return std::nullopt;
}

std::optional<double> hitPlane(V O, V D, V Q, V N) {
    double dn = dot(D, N);
    if (std::fabs(dn) < 1e-9) return std::nullopt;
    double t = dot(sub(Q, O), N) / dn;
    return t > EPS ? std::optional<double>(t) : std::nullopt;
}

V reflect(V D, V N) { return sub(D, scale(N, 2 * dot(D, N))); }

struct Obj { bool sphere, mirror; V p, n; double r; };

std::optional<double> hit(const Obj& o, V O, V D) {
    return o.sphere ? hitSphere(O, D, o.p, o.r) : hitPlane(O, D, o.p, o.n);
}

double trace(V O, V D, const std::vector<Obj>& scene, V light, int depth = 0) {
    double bestT = 1e30; const Obj* best = nullptr;
    for (const auto& o : scene) { auto t = hit(o, O, D); if (t && *t < bestT) { bestT = *t; best = &o; } }
    if (!best) return 0.05;
    V P = add(O, scale(D, bestT));
    V N = best->sphere ? norm(sub(P, best->p)) : best->n;
    V toLight = norm(sub(light, P));
    V origin = add(P, scale(N, EPS));
    bool shadowed = false;
    for (const auto& o : scene) if (&o != best && hit(o, origin, toLight)) { shadowed = true; break; }
    double diffuse = shadowed ? 0.0 : std::fmax(0.0, dot(N, toLight));
    double color = 0.1 + 0.9 * diffuse;
    if (best->mirror && depth < 4) {
        V R = norm(reflect(D, N));
        color = 0.6 * color + 0.4 * trace(origin, R, scene, light, depth + 1);
    }
    return color;
}

int main() {
    std::vector<Obj> scene = {
        {true, true, {0, 0, -5}, {0, 0, 0}, 1.0},
        {false, false, {0, -1, 0}, {0, 1, 0}, 0.0},
    };
    double c = trace({0, 0, 0}, norm(V{0, 0, -1}), scene, {5, 5, 0});
    std::printf("%.4f\n", c);
    return 0;
}
```
