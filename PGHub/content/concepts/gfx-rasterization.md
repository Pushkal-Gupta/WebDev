---
slug: gfx-rasterization
module: computer-graphics
title: Rasterization — From Triangles to Pixels
subtitle: How edge functions decide pixel coverage, barycentric weights interpolate every attribute, and the depth buffer settles which triangle a pixel belongs to.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Real-Time Rendering, 4th ed. — The Graphics Rendering Pipeline / Rasterization"
    url: "https://www.realtimerendering.com/"
    type: book
  - title: "Scratchapixel — Rasterization: a practical implementation"
    url: "https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/overview-rasterization-algorithm.html"
    type: article
  - title: "LearnOpenGL — Hello Triangle"
    url: "https://learnopengl.com/Getting-started/Hello-Triangle"
    type: article
  - title: "Scratchapixel — The barycentric coordinates"
    url: "https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/barycentric-coordinates.html"
    type: article
status: published
---

## intro
Every real-time frame you have ever seen — a game, a phone UI, a CAD viewport — was almost certainly drawn by rasterization. The idea is disarmingly simple: the world is built from triangles, so the whole rendering problem reduces to answering, for one triangle at a time, *which pixels does it cover, and what color is each of those pixels?* Rasterization turns a continuous geometric shape into a discrete grid of lit cells. This page builds the machinery that makes that work — the edge function that tests coverage, the barycentric weights that blend the triangle's corner attributes across its interior, and the depth buffer that decides which triangle wins when two of them fight over the same pixel.

## whyItMatters
Rasterization is the algorithm baked into the silicon of every GPU. When a fragment shader runs, when a UI compositor blends a button, when a mapping app draws a road, a rasterizer decided which pixels to touch. It is the reason games hit 120 frames per second where a naive ray tracer would crawl: rasterization's cost scales with the triangles you draw and the pixels they cover, and the inner coverage test is a handful of multiply-adds that hardware runs in lockstep across thousands of pixels at once. Understanding it explains z-fighting artifacts, why UVs and vertex colors bleed smoothly across a face, why coplanar geometry flickers, and why the top-left fill rule exists. It is also the cleanest place to see the deep duality between the two ways to render a scene: loop over triangles, or loop over pixels.

## intuition
Start with the core question for a single pixel center \(p\) and a triangle with vertices \(v_0, v_1, v_2\): is \(p\) inside? The trick is the **edge function**. For the directed edge from \(v_0\) to \(v_1\), define

\[
E_{01}(p) = (p_x - v_{0x})(v_{1y} - v_{0y}) - (p_y - v_{0y})(v_{1x} - v_{0x}).
\]

This is a 2D cross product: it is the signed area (times two) of the parallelogram spanned by \(p - v_0\) and \(v_1 - v_0\). Its *sign* tells you which side of the infinite line through \(v_0 v_1\) the point falls on — positive on one side, negative on the other, zero exactly on the line. Now compute the three edge functions \(E_{01}, E_{12}, E_{20}\) for the triangle's three edges taken in a consistent winding order. The **inside test** is simply: \(p\) is covered when all three have the *same sign*. If the point strays across any edge, that edge's function flips sign and the test fails.

The three edge-function values are not just a yes/no; normalized by the full triangle area \(A = E_{01}(v_2)\), they *are* the **barycentric coordinates**:

\[
\lambda_0 = \frac{E_{12}(p)}{A},\quad \lambda_1 = \frac{E_{20}(p)}{A},\quad \lambda_2 = \frac{E_{01}(p)}{A},
\]

with the identity \(\lambda_0 + \lambda_1 + \lambda_2 = 1\). Each \(\lambda_i\) is the fractional weight of vertex \(i\): at \(v_0\) you get \((1,0,0)\), at the centroid \((\tfrac13,\tfrac13,\tfrac13)\). Because they sum to one and are all non-negative exactly inside the triangle, they let you **interpolate any per-vertex attribute** — color, texture coordinate, normal — as a weighted blend \(\lambda_0 a_0 + \lambda_1 a_1 + \lambda_2 a_2\). Crucially, depth interpolates the same way:

\[
z = \lambda_0 z_0 + \lambda_1 z_1 + \lambda_2 z_2,
\]

giving each covered pixel its own depth value — the number the z-buffer compares to decide who is in front.

## visualization
```
Coverage of triangle A: v0=(1,1) v1=(9,2) v2=(4,7)  (X = pixel center inside)
  y\x  0  1  2  3  4  5  6  7  8  9 10 11
   0   .  .  .  .  .  .  .  .  .  .  .  .
   1   .  X  X  X  X  X  X  .  .  .  .  .
   2   .  .  X  X  X  X  X  X  X  .  .  .
   3   .  .  X  X  X  X  X  X  .  .  .  .
   4   .  .  .  X  X  X  X  .  .  .  .  .
   5   .  .  .  X  X  X  .  .  .  .  .  .
   6   .  .  .  .  X  .  .  .  .  .  .  .
   7   .  .  .  .  .  .  .  .  .  .  .  .

Z-buffer at 4 overlapping pixels (triangle A depth 0.30, triangle B depth 0.55):
  pixel   zA     zB    stored z   winner
  (3,3)  0.30   0.55    0.30        A     (A is nearer, smaller z)
  (4,4)  0.28   0.61    0.28        A
  (5,3)  0.34   0.22    0.22        B     (B dips in front here)
  (4,5)  0.40   0.44    0.40        A
```

## bruteForce
The most direct rasterizer loops over *every pixel on the whole screen* and, for each one, evaluates the three edge functions and applies the inside test. If the pixel passes, compute its barycentric weights, interpolate depth, compare against the depth buffer, and write color if it wins. This is correct and trivially easy to reason about, and it is how you would first implement a software rasterizer. The problem is waste: a tiny triangle covering 50 pixels still forces a full-screen sweep — two million inside tests on a 1920×1080 frame — nearly all of them rejecting immediately. The cost is proportional to screen area times triangle count, not to the pixels actually covered, so it collapses the moment a scene has thousands of small triangles.

## optimal
The production rasterizer keeps the edge-function inside test but stops touching pixels the triangle cannot possibly cover. First, compute the triangle's **bounding box**: the min/max of the three vertices' \(x\) and \(y\), clamped to the screen. Only pixels inside that box are candidates, so a 50-pixel triangle scans a 50-ish-pixel region, not the whole frame. Second, exploit that the edge function is **affine in the pixel coordinate**: \(E(x+1, y) = E(x, y) + \Delta_x\) and \(E(x, y+1) = E(x, y) + \Delta_y\), where the increments \(\Delta_x = (v_{1y}-v_{0y})\) and \(\Delta_y = -(v_{1x}-v_{0x})\) are constants for the edge. So you evaluate all three edge functions once at the box's corner, then **step them incrementally** with a single add per pixel as you march across each scanline — no multiplies in the inner loop. The same increments hand you the barycentric weights for free, since they are just the normalized edge values.

Two more refinements matter. **Early-z**: when depth writes don't depend on the shader, compare and update the z-buffer *before* running the (expensive) fragment shader, so occluded pixels are killed cheaply. **The top-left fill rule** resolves shared edges: when a pixel center lands exactly on an edge (\(E = 0\)), it is ambiguous which of the two adjacent triangles owns it. Filling it in both double-shades the seam; filling it in neither leaves a gap. The convention: a pixel on an edge counts as inside only if that edge is a *top* edge (horizontal, above the interior) or a *left* edge (going downward on the left side). Applied consistently, every boundary pixel is claimed by exactly one triangle — no cracks, no double-blend. For 3D, remember the weights must be **perspective-correct**: interpolate \(a/w\) and \(1/w\) linearly in screen space and divide, because straight screen-space interpolation of attributes warps under perspective. With bounding box + incremental edges + early-z + a correct fill rule, the rasterizer's cost tracks the pixels actually covered — exactly what makes real-time rendering real-time.

## complexity
time: For one triangle, the bounding-box rasterizer costs \(O(b)\) where \(b\) is the number of pixels in its (clamped) bounding box, with a constant-work inner loop of three incremental adds plus a depth compare per pixel. Across a frame the total is proportional to the summed covered area of all triangles, i.e. \(O(\text{overdraw} \times \text{pixels})\), not screen-area times triangle-count as in the brute-force sweep.
space: \(O(W \times H)\) for the color buffer plus an equal-sized depth (z) buffer. The per-triangle state — edge constants, increments, bounding box — is \(O(1)\).
notes: The edge function is a signed area, so its magnitude also gives twice the sub-triangle area used for barycentric weights; one computation serves both coverage and interpolation. Early-z can be defeated by shaders that discard fragments or write custom depth, forcing the shader to run before the depth test. The depth compare is a min (nearer = smaller z) under the usual convention; z-precision is non-uniform after the perspective divide, which is the root of z-fighting.

## pitfalls
- **T-junction gaps.** When one triangle's edge is split by an extra vertex on a neighbor (a T-junction), tiny rounding differences leave unfilled pixels — visible cracks along the seam. Fix: avoid T-junctions in the mesh (weld shared edges so every edge has matching endpoints on both sides), or snap vertices to a consistent sub-pixel grid.
- **Double-shaded or missing shared edges.** Ignoring the fill rule means pixels exactly on a shared edge get drawn by both triangles (double blend / z-fight sparkle) or by neither (gap). Fix: apply the **top-left rule** — treat \(E=0\) as inside only for top and left edges — so every boundary pixel belongs to exactly one triangle.
- **Z-fighting on coplanar surfaces.** Two nearly-coplanar triangles produce depth values so close that floating-point rounding flips the winner per pixel, causing flicker. Fix: add a small depth bias / polygon offset, pull the surfaces apart, use a tighter near/far range, or a higher-precision (or reversed-Z) depth buffer.
- **Screen-space interpolation instead of perspective-correct.** Interpolating UVs or colors linearly in screen space warps them under perspective (textures look "swimmy" toward the horizon). Fix: interpolate \(a/w\) and \(1/w\) across the triangle and divide per pixel to recover the true, perspective-correct attribute.

## interviewTips
- Explain the inside test as three same-sign edge functions and stress that each edge function is a **2D cross product / signed area** — so the very same numbers, normalized by the triangle area, are the barycentric weights you interpolate attributes and depth with. One computation, three jobs.
- Contrast rasterization with ray tracing as a loop inversion: **rasterization is "for each triangle, which pixels does it cover"; ray tracing is "for each pixel, which object does its ray hit."** Rasterization streams triangles and resolves occlusion with a z-buffer; ray tracing streams rays and resolves occlusion with the nearest hit — and it composes reflections/shadows more naturally.
- Be ready to name the correctness details: the **top-left fill rule** for shared edges, **perspective-correct interpolation** via \(1/w\), and **z-fighting** from finite depth precision — mentioning the fix for each shows you have shipped a rasterizer, not just read about one.

## keyTakeaways
- Coverage is three **edge functions** (signed-area cross products) sharing one sign; normalized by the triangle area they become **barycentric weights** \(\lambda_0,\lambda_1,\lambda_2\) that sum to 1 and interpolate every per-vertex attribute, depth included: \(z = \lambda_0 z_0 + \lambda_1 z_1 + \lambda_2 z_2\).
- Make it fast with a **bounding box** (only scan candidate pixels), **incremental edge stepping** (one add per pixel, edges are affine), **early-z**, and the **top-left fill rule** so shared edges are claimed exactly once.
- The **depth buffer** resolves overlap per pixel by keeping the nearest z — the mechanism behind hidden-surface removal, and the source of z-fighting when two surfaces are nearly coplanar.

## code.python
```python
def edge(ax, ay, bx, by, px, py):
    # signed area (x2) of triangle (a, b, p); sign = which side of edge a->b
    return (px - ax) * (by - ay) - (py - ay) * (bx - ax)

def rasterize(tris, W, H):
    INF = float('inf')
    color = [[None] * W for _ in range(H)]
    depth = [[INF] * W for _ in range(H)]
    for (v0, v1, v2, z, name) in tris:
        area = edge(*v0, *v1, *v2)
        if area == 0:
            continue
        x0 = max(0, min(v0[0], v1[0], v2[0]))
        x1 = min(W - 1, max(v0[0], v1[0], v2[0]))
        y0 = max(0, min(v0[1], v1[1], v2[1]))
        y1 = min(H - 1, max(v0[1], v1[1], v2[1]))
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                px, py = x + 0.5, y + 0.5
                w0 = edge(*v1, *v2, px, py)
                w1 = edge(*v2, *v0, px, py)
                w2 = edge(*v0, *v1, px, py)
                inside = (w0 >= 0 and w1 >= 0 and w2 >= 0) or \
                         (w0 <= 0 and w1 <= 0 and w2 <= 0)
                if not inside:
                    continue
                l0, l1, l2 = w0 / area, w1 / area, w2 / area
                zpix = l0 * z[0] + l1 * z[1] + l2 * z[2]
                if zpix < depth[y][x]:       # nearer wins
                    depth[y][x] = zpix
                    color[y][x] = name
    return color, depth

# triangle A (nearer, depths 0.3) overlaps triangle B (0.5) in the middle
A = ((1, 1), (9, 2), (4, 7), (0.30, 0.30, 0.30), 'A')
B = ((2, 5), (10, 4), (5, 0), (0.50, 0.50, 0.20), 'B')
col, dep = rasterize([A, B], 12, 9)
print(col[3][4])   # whichever triangle is nearest at pixel (4,3)
```

## code.javascript
```javascript
function edge(ax, ay, bx, by, px, py) {
  return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
}

function rasterize(tris, W, H) {
  const color = Array.from({ length: H }, () => Array(W).fill(null));
  const depth = Array.from({ length: H }, () => Array(W).fill(Infinity));
  for (const { v0, v1, v2, z, name } of tris) {
    const area = edge(...v0, ...v1, ...v2);
    if (area === 0) continue;
    const x0 = Math.max(0, Math.min(v0[0], v1[0], v2[0]));
    const x1 = Math.min(W - 1, Math.max(v0[0], v1[0], v2[0]));
    const y0 = Math.max(0, Math.min(v0[1], v1[1], v2[1]));
    const y1 = Math.min(H - 1, Math.max(v0[1], v1[1], v2[1]));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = edge(...v1, ...v2, px, py);
        const w1 = edge(...v2, ...v0, px, py);
        const w2 = edge(...v0, ...v1, px, py);
        const inside = (w0 >= 0 && w1 >= 0 && w2 >= 0) ||
                       (w0 <= 0 && w1 <= 0 && w2 <= 0);
        if (!inside) continue;
        const l0 = w0 / area, l1 = w1 / area, l2 = w2 / area;
        const zpix = l0 * z[0] + l1 * z[1] + l2 * z[2];
        if (zpix < depth[y][x]) { depth[y][x] = zpix; color[y][x] = name; }
      }
    }
  }
  return { color, depth };
}

const A = { v0: [1, 1], v1: [9, 2], v2: [4, 7], z: [0.30, 0.30, 0.30], name: 'A' };
const B = { v0: [2, 5], v1: [10, 4], v2: [5, 0], z: [0.50, 0.50, 0.20], name: 'B' };
const { color } = rasterize([A, B], 12, 9);
console.log(color[3][4]);
```

## code.java
```java
public class Rasterizer {
    static double edge(double ax, double ay, double bx, double by, double px, double py) {
        return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
    }

    // tri = {v0x,v0y, v1x,v1y, v2x,v2y, z0,z1,z2}; returns per-pixel winner index (-1 = empty)
    static int[][] rasterize(double[][] tris, int W, int H) {
        int[][] color = new int[H][W];
        double[][] depth = new double[H][W];
        for (int[] row : color) java.util.Arrays.fill(row, -1);
        for (double[] row : depth) java.util.Arrays.fill(row, Double.POSITIVE_INFINITY);
        for (int t = 0; t < tris.length; t++) {
            double[] v = tris[t];
            double area = edge(v[0], v[1], v[2], v[3], v[4], v[5]);
            if (area == 0) continue;
            int x0 = (int) Math.max(0, Math.min(v[0], Math.min(v[2], v[4])));
            int x1 = (int) Math.min(W - 1, Math.max(v[0], Math.max(v[2], v[4])));
            int y0 = (int) Math.max(0, Math.min(v[1], Math.min(v[3], v[5])));
            int y1 = (int) Math.min(H - 1, Math.max(v[1], Math.max(v[3], v[5])));
            for (int y = y0; y <= y1; y++) {
                for (int x = x0; x <= x1; x++) {
                    double px = x + 0.5, py = y + 0.5;
                    double w0 = edge(v[2], v[3], v[4], v[5], px, py);
                    double w1 = edge(v[4], v[5], v[0], v[1], px, py);
                    double w2 = edge(v[0], v[1], v[2], v[3], px, py);
                    boolean inside = (w0 >= 0 && w1 >= 0 && w2 >= 0)
                                  || (w0 <= 0 && w1 <= 0 && w2 <= 0);
                    if (!inside) continue;
                    double zpix = (w0 / area) * v[6] + (w1 / area) * v[7] + (w2 / area) * v[8];
                    if (zpix < depth[y][x]) { depth[y][x] = zpix; color[y][x] = t; }
                }
            }
        }
        return color;
    }

    public static void main(String[] args) {
        double[][] tris = {
            {1, 1, 9, 2, 4, 7, 0.30, 0.30, 0.30},   // A (nearer)
            {2, 5, 10, 4, 5, 0, 0.50, 0.50, 0.20},   // B
        };
        int[][] color = rasterize(tris, 12, 9);
        System.out.println(color[3][4]);
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <vector>
#include <array>
#include <limits>
#include <algorithm>

double edge(double ax, double ay, double bx, double by, double px, double py) {
    return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
}

// tri = {v0x,v0y, v1x,v1y, v2x,v2y, z0,z1,z2}; winner index per pixel (-1 = empty)
std::vector<std::vector<int>> rasterize(const std::vector<std::array<double,9>>& tris,
                                        int W, int H) {
    std::vector<std::vector<int>> color(H, std::vector<int>(W, -1));
    std::vector<std::vector<double>> depth(H,
        std::vector<double>(W, std::numeric_limits<double>::infinity()));
    for (int t = 0; t < (int)tris.size(); ++t) {
        const auto& v = tris[t];
        double area = edge(v[0], v[1], v[2], v[3], v[4], v[5]);
        if (area == 0) continue;
        int x0 = std::max(0.0, std::min({v[0], v[2], v[4]}));
        int x1 = std::min((double)W - 1, std::max({v[0], v[2], v[4]}));
        int y0 = std::max(0.0, std::min({v[1], v[3], v[5]}));
        int y1 = std::min((double)H - 1, std::max({v[1], v[3], v[5]}));
        for (int y = y0; y <= y1; ++y) {
            for (int x = x0; x <= x1; ++x) {
                double px = x + 0.5, py = y + 0.5;
                double w0 = edge(v[2], v[3], v[4], v[5], px, py);
                double w1 = edge(v[4], v[5], v[0], v[1], px, py);
                double w2 = edge(v[0], v[1], v[2], v[3], px, py);
                bool inside = (w0 >= 0 && w1 >= 0 && w2 >= 0)
                           || (w0 <= 0 && w1 <= 0 && w2 <= 0);
                if (!inside) continue;
                double zpix = (w0 / area) * v[6] + (w1 / area) * v[7] + (w2 / area) * v[8];
                if (zpix < depth[y][x]) { depth[y][x] = zpix; color[y][x] = t; }
            }
        }
    }
    return color;
}

int main() {
    std::vector<std::array<double,9>> tris = {
        {1, 1, 9, 2, 4, 7, 0.30, 0.30, 0.30},   // A (nearer)
        {2, 5, 10, 4, 5, 0, 0.50, 0.50, 0.20},   // B
    };
    auto color = rasterize(tris, 12, 9);
    std::printf("%d\n", color[3][4]);
    return 0;
}
```
