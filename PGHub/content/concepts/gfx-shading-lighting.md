---
slug: gfx-shading-lighting
module: computer-graphics
title: Shading and Lighting — Making Surfaces Look Lit
subtitle: The rendering equation as the honest goal, and the ambient + diffuse + Blinn-Phong specular model as the fast, convincing approximation every real-time renderer ships.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Real-Time Rendering, 4th ed. — Shading Basics / Physically Based Shading"
    url: "https://www.realtimerendering.com/"
    type: book
  - title: "LearnOpenGL — Basic Lighting"
    url: "https://learnopengl.com/Lighting/Basic-Lighting"
    type: article
  - title: "LearnOpenGL — Advanced Lighting (Blinn-Phong)"
    url: "https://learnopengl.com/Advanced-Lighting/Advanced-Lighting"
    type: article
  - title: "Scratchapixel — Introduction to Shading"
    url: "https://www.scratchapixel.com/lessons/3d-basic-rendering/introduction-to-shading/shading-normals.html"
    type: article
status: published
---

## intro
A triangle with a flat, uniform color reads as a paper cutout; the same triangle darkened where it faces away from the light and brightened where it faces toward it suddenly reads as a curved, solid surface sitting in a room. Shading is the step that turns geometry into something that looks *lit*. This page builds up from the one equation that describes light exactly — the rendering equation — to the cheap, sturdy approximation that games and interactive tools actually run per pixel: an ambient term, a diffuse Lambert term, and a Blinn-Phong specular highlight. You will see why normals must be unit length, why intensities get clamped, and what the shininess exponent really controls.

## whyItMatters
Every lit pixel you have ever seen on a screen — a character in a game, a product render, a CAD model, a data visualization with subtle depth — was produced by a shading model. The difference between "flat and fake" and "solid and convincing" is almost entirely lighting, not polygon count. Because a shader runs once for every fragment, potentially millions per frame at 60 frames per second, the model has to be both cheap and stable: a single divide-by-zero or an un-normalized normal shows up as a flickering black speck or a highlight that swims across the surface. Getting the local lighting model right is foundational to real-time graphics, physically based rendering, and even offline path tracers, which all trace their lineage back to the same rendering equation. Understanding it is the price of admission to writing shaders.

## intuition
The exact statement of what light does at a surface is the **rendering equation**. The radiance leaving a point \(\mathbf{p}\) in the viewing direction \(\omega_o\) is whatever the surface emits, plus everything arriving from every direction, reweighted by how the surface reflects it:
\[L_o(\mathbf{p},\omega_o)=L_e+\int_\Omega f_r(\mathbf{p},\omega_i,\omega_o)\,L_i(\mathbf{p},\omega_i)(\mathbf{n}\cdot\omega_i)\,d\omega_i\]
Read it left to right. \(L_e\) is light the surface itself emits (only glowing things). The integral sweeps every incoming direction \(\omega_i\) over the hemisphere \(\Omega\) above the surface. For each one, \(L_i\) is the incoming light, \(f_r\) is the **BRDF** — the material's rule for how much of that light bounces toward the eye — and \((\mathbf{n}\cdot\omega_i)\) is the **cosine foreshortening**: light striking at a glancing angle spreads its energy over more area, so it counts for less. That cosine, the dot product of the surface normal with the light direction, is the single most important quantity in all of shading.

Nobody evaluates that integral in real time. The classic trick is to replace "light from every direction" with a few point lights and split the BRDF into pieces we can compute directly. **Ambient** is a constant fudge for all the bounced light we skipped: \(k_a\). **Diffuse** (Lambert) models a matte surface that scatters light equally in all directions, so it depends only on the incoming angle: \(k_d\,\max(0,\mathbf{n}\cdot\mathbf{l})\). The \(\max(0,\cdot)\) clamps the back face to black — a surface facing away cannot be lit. **Specular** models the shiny highlight. Phong compares the mirror-reflected light direction \(\mathbf{r}\) with the view direction \(\mathbf{v}\): \(k_s\,\max(0,\mathbf{r}\cdot\mathbf{v})^\alpha\). Blinn-Phong instead builds the **half-vector** \(\mathbf{h}=\frac{\mathbf{l}+\mathbf{v}}{\lVert\mathbf{l}+\mathbf{v}\rVert}\) — the direction exactly between the light and the eye — and measures how close the normal is to it: \(k_s(\mathbf{n}\cdot\mathbf{h})^\alpha\). The exponent \(\alpha\) is **shininess**: small \(\alpha\) gives a broad, soft sheen (chalk), large \(\alpha\) a tight, glossy dot (polished metal). All vectors must be unit length for these dot products to equal the cosines they stand in for.

## visualization
```
Diffuse Lambert: intensity = kd * max(0, N.L),  kd = 1.0
  angle(N,L)   N.L = cos     diffuse
  ----------   ----------    -------
    0 deg       1.000         1.000     (light straight on  -> brightest)
   30 deg       0.866         0.866
   45 deg       0.707         0.707
   60 deg       0.500         0.500
   80 deg       0.174         0.174
   90 deg       0.000         0.000     (grazing -> dark terminator)
  120 deg      -0.500         0.000     (back face, clamped to 0)

Specular falloff: spec = (N.H)^alpha  as the highlight angle grows
  N.H       a=8      a=32     a=128
  ------    ------   ------   ------
  1.00      1.000    1.000    1.000    (dead-center highlight)
  0.99      0.923    0.725    0.277
  0.95      0.663    0.194    0.0015    (a=128 already nearly gone)
  0.90      0.430    0.034    ~1e-6     (bigger alpha = tighter dot)
  0.80      0.168    0.0008   ~0        (small alpha = broad sheen)
```

## bruteForce
The most literal way to "solve" shading is to attack the rendering equation head on: Monte Carlo path tracing. At the shaded point, shoot many rays into the hemisphere, gather the light each one returns (recursively bouncing off other surfaces), weight every sample by the BRDF and the cosine term, and average. This is physically faithful — it produces soft shadows, color bleeding, and glossy interreflection for free — but it is brutally expensive: thousands of rays per pixel, each spawning more rays, and the result is still speckled with noise until the samples pile up. It is the right tool for a film frame that can bake overnight, and completely wrong for a frame that must finish in 16 milliseconds. Real-time rendering needs an approximation that captures the *look* of lighting from a couple of dot products, not an integral.

## optimal
The workhorse of real-time shading is the **local illumination model**: sum an ambient, a diffuse, and a specular term per light, per fragment, and clamp. For a single light the color is
\[c = k_a\,c_a \;+\; k_d\,\max(0,\mathbf{n}\cdot\mathbf{l})\,c_{\text{light}} \;+\; k_s\,\max(0,\mathbf{n}\cdot\mathbf{h})^{\alpha}\,c_{\text{light}}\]
with every vector normalized first. The ambient term keeps shadowed faces from crushing to pure black. The diffuse term does the heavy lifting: it is the cosine foreshortening from the rendering equation, made concrete as \(\mathbf{n}\cdot\mathbf{l}\), and it alone is enough to make a sphere look round. The specular term adds the glossy highlight that tells you the material and where the light is.

The key engineering choice is **Phong versus Blinn-Phong** for that highlight. Phong reflects the light about the normal to get \(\mathbf{r}=2(\mathbf{n}\cdot\mathbf{l})\mathbf{n}-\mathbf{l}\) and uses \((\mathbf{r}\cdot\mathbf{v})^\alpha\). Blinn-Phong skips the reflection and uses the half-vector \(\mathbf{h}=\widehat{\mathbf{l}+\mathbf{v}}\) with \((\mathbf{n}\cdot\mathbf{h})^\alpha\). Blinn-Phong wins in practice for two reasons. First, at **grazing angles** — when the eye and light are both low over the surface — the Phong reflection vector can point away from the viewer, making \(\mathbf{r}\cdot\mathbf{v}\) go negative and cutting the highlight off with a hard, unnatural edge; the half-vector \(\mathbf{n}\cdot\mathbf{h}\) stays well-behaved and produces the elongated highlight you actually see on a wet road at sunset. Second, \(\mathbf{h}\) is cheaper for many lights. Blinn-Phong highlights are a bit broader, so you roughly quadruple \(\alpha\) to match a given Phong look. One more choice: **Gouraud (per-vertex)** shading evaluates this whole model at the three triangle vertices and linearly interpolates the resulting *colors* across the face — fast, but it smears specular highlights and can miss them entirely between vertices. **Phong shading (per-fragment)** interpolates the *normals* and runs the lighting at every pixel — more work, dramatically better highlights. Modern GPUs shade per fragment by default. Finally, do the whole computation in **linear light** and convert to sRGB only at output; shading in gamma space darkens midtones and dulls the result.

## complexity
time: O(L) per fragment for L lights — each light costs a fixed handful of dot products, a `pow` for the specular exponent, and a few multiply-adds; independent of geometry resolution. A full frame is O(F·L) for F shaded fragments. Gouraud shifts the cost to O(V·L) over vertices V (usually V ≪ F) plus near-free interpolation, trading quality for speed.
space: O(1) per fragment — a shader keeps only the normal, light, view, and half vectors plus the material scalars in registers; nothing scales with scene size at the shading step.
notes: The `pow(x, alpha)` for the specular exponent is the most expensive single operation; some engines approximate it. Normalizing three vectors costs three inverse square roots per light. All of this runs massively in parallel on the GPU, so the practical limit is memory bandwidth and light count, not the arithmetic itself.

## pitfalls
- **Un-normalized normals.** After transforming a normal by a model matrix, or interpolating it across a triangle, its length is no longer 1, so \(\mathbf{n}\cdot\mathbf{l}\) no longer equals the cosine and the whole surface is mis-lit — highlights bloom or vanish. Fix: renormalize \(\mathbf{n}\), \(\mathbf{l}\), \(\mathbf{v}\), and \(\mathbf{h}\) in the fragment shader before every dot product.
- **Forgetting `max(0, ·)`.** A raw \(\mathbf{n}\cdot\mathbf{l}\) goes negative on back faces; left unclamped it either subtracts light (unphysical) or, raised to an even power in the specular term, lights a face the light cannot reach. Fix: clamp every diffuse and specular dot to \([0,1]\) before use.
- **Interpolating normals shrinks them.** Linearly blending two unit normals across a triangle produces a vector shorter than 1 (the midpoint of two unit vectors is inside the unit circle), dimming the surface middle. Fix: this is exactly why per-fragment shading *renormalizes* the interpolated normal — never trust the interpolant's length.
- **Phong breaks at grazing angles.** When \(\mathbf{r}\cdot\mathbf{v}<0\) the Phong highlight is clamped to zero, chopping off the elongated highlight you should see when light and eye are both low. Fix: switch to Blinn-Phong's \(\mathbf{n}\cdot\mathbf{h}\), which degrades gracefully; multiply \(\alpha\) by about 4 to keep the same tightness.
- **Shading in gamma space.** Doing the math on raw sRGB texture values (which are gamma-encoded) then displaying them makes lighting look flat and midtones muddy, and blends two lights incorrectly. Fix: convert textures to linear on read, do all lighting in linear space, and apply the sRGB curve once at the very end.

## interviewTips
- Be ready to write the three-term equation from memory and name each factor: ambient \(k_a\), diffuse \(k_d\max(0,\mathbf{n}\cdot\mathbf{l})\), specular \(k_s\max(0,\mathbf{n}\cdot\mathbf{h})^\alpha\) — and explain that the diffuse dot product *is* the cosine foreshortening term from the rendering equation, not an arbitrary formula.
- Contrast Phong and Blinn-Phong precisely: Phong uses the reflected light vector \(\mathbf{r}\cdot\mathbf{v}\); Blinn-Phong uses the half-vector \(\mathbf{n}\cdot\mathbf{h}\). Say *why* Blinn-Phong is preferred — it stays continuous at grazing angles where \(\mathbf{r}\cdot\mathbf{v}\) goes negative — and note the ~4× exponent rescaling to match looks.
- Explain Gouraud versus Phong shading as a where-do-you-evaluate question: per-vertex (interpolate colors, fast, misses highlights between vertices) versus per-fragment (interpolate normals then shade, slower, crisp highlights). Mention you must renormalize the interpolated normal.

## keyTakeaways
- The rendering equation is the exact goal — outgoing radiance is emitted light plus the hemisphere integral of incoming light times the BRDF times the cosine \((\mathbf{n}\cdot\omega_i)\); real-time shading is a cheap stand-in for that integral.
- The local model sums ambient + diffuse \(k_d\max(0,\mathbf{n}\cdot\mathbf{l})\) + specular; use Blinn-Phong's half-vector \(k_s(\mathbf{n}\cdot\mathbf{h})^\alpha\) because it stays stable at grazing angles where Phong's \(\mathbf{r}\cdot\mathbf{v}\) collapses.
- Correctness hinges on details: normalize every vector, clamp every dot to \([0,1]\), shade per-fragment with a renormalized interpolated normal, and do the arithmetic in linear color space.

## code.python
```python
import math

def dot(a, b):
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]

def normalize(v):
    n = math.sqrt(dot(v, v)) or 1.0
    return (v[0]/n, v[1]/n, v[2]/n)

def add(a, b):
    return (a[0]+b[0], a[1]+b[1], a[2]+b[2])

def shade(N, L, V, ka, kd, ks, alpha, use_blinn=True):
    N, L, V = normalize(N), normalize(L), normalize(V)
    ndl = max(0.0, dot(N, L))
    if use_blinn:
        H = normalize(add(L, V))
        spec = max(0.0, dot(N, H)) ** alpha
    else:
        R = tuple(2*ndl*N[i] - L[i] for i in range(3))  # reflect L about N
        spec = max(0.0, dot(R, V)) ** alpha
    intensity = ka + kd*ndl + (ks*spec if ndl > 0 else 0.0)
    return min(1.0, intensity)

if __name__ == "__main__":
    N = (0.0, 0.0, 1.0)   # surface faces the camera
    L = (0.3, 0.4, 1.0)   # light up-and-right
    V = (0.0, 0.0, 1.0)   # eye down the z axis
    print(round(shade(N, L, V, 0.10, 0.7, 0.5, 32), 4))   # 0.9361
    print(round(shade(N, L, V, 0.10, 0.7, 0.5, 32, use_blinn=False), 4))  # 0.7402
```

## code.javascript
```javascript
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const normalize = (v) => { const n = Math.hypot(...v) || 1; return v.map((c) => c/n); };
const add = (a, b) => a.map((c, i) => c + b[i]);

function shade(N, L, V, ka, kd, ks, alpha, useBlinn = true) {
  N = normalize(N); L = normalize(L); V = normalize(V);
  const ndl = Math.max(0, dot(N, L));
  let spec;
  if (useBlinn) {
    const H = normalize(add(L, V));
    spec = Math.max(0, dot(N, H)) ** alpha;
  } else {
    const R = N.map((c, i) => 2*ndl*c - L[i]);   // reflect L about N
    spec = Math.max(0, dot(R, V)) ** alpha;
  }
  const intensity = ka + kd*ndl + (ndl > 0 ? ks*spec : 0);
  return Math.min(1, intensity);
}

const N = [0, 0, 1], L = [0.3, 0.4, 1], V = [0, 0, 1];
console.log(shade(N, L, V, 0.10, 0.7, 0.5, 32).toFixed(4));                 // 0.9361
console.log(shade(N, L, V, 0.10, 0.7, 0.5, 32, false).toFixed(4));          // 0.7402

// The same math as a GLSL fragment shader (Blinn-Phong, one light):
//   vec3 N = normalize(vNormal);
//   vec3 L = normalize(lightPos - vPos);
//   vec3 Vv = normalize(camPos - vPos);
//   vec3 Hh = normalize(L + Vv);
//   float diff = max(dot(N, L), 0.0);
//   float spec = pow(max(dot(N, Hh), 0.0), shininess);
//   vec3 color = ka*ambient + kd*diff*lightColor + ks*spec*lightColor;
//   fragColor = vec4(color, 1.0);
```

## code.java
```java
public class Shading {
    static double dot(double[] a, double[] b) {
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    }
    static double[] normalize(double[] v) {
        double n = Math.sqrt(dot(v, v));
        if (n == 0) n = 1;
        return new double[]{v[0]/n, v[1]/n, v[2]/n};
    }
    static double shade(double[] N, double[] L, double[] V,
                        double ka, double kd, double ks, double alpha, boolean useBlinn) {
        N = normalize(N); L = normalize(L); V = normalize(V);
        double ndl = Math.max(0.0, dot(N, L));
        double spec;
        if (useBlinn) {
            double[] H = normalize(new double[]{L[0]+V[0], L[1]+V[1], L[2]+V[2]});
            spec = Math.pow(Math.max(0.0, dot(N, H)), alpha);
        } else {
            double[] R = { 2*ndl*N[0]-L[0], 2*ndl*N[1]-L[1], 2*ndl*N[2]-L[2] };
            spec = Math.pow(Math.max(0.0, dot(R, V)), alpha);
        }
        double intensity = ka + kd*ndl + (ndl > 0 ? ks*spec : 0.0);
        return Math.min(1.0, intensity);
    }
    public static void main(String[] args) {
        double[] N = {0, 0, 1}, L = {0.3, 0.4, 1}, V = {0, 0, 1};
        System.out.printf("%.4f%n", shade(N, L, V, 0.10, 0.7, 0.5, 32, true));   // 0.9361
        System.out.printf("%.4f%n", shade(N, L, V, 0.10, 0.7, 0.5, 32, false));  // 0.7402
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <algorithm>

struct V3 { double x, y, z; };

double dot(V3 a, V3 b) { return a.x*b.x + a.y*b.y + a.z*b.z; }

V3 normalize(V3 v) {
    double n = std::sqrt(dot(v, v));
    if (n == 0) n = 1;
    return { v.x/n, v.y/n, v.z/n };
}

double shade(V3 N, V3 L, V3 Vv, double ka, double kd, double ks,
             double alpha, bool useBlinn) {
    N = normalize(N); L = normalize(L); Vv = normalize(Vv);
    double ndl = std::max(0.0, dot(N, L));
    double spec;
    if (useBlinn) {
        V3 H = normalize({ L.x+Vv.x, L.y+Vv.y, L.z+Vv.z });
        spec = std::pow(std::max(0.0, dot(N, H)), alpha);
    } else {
        V3 R = { 2*ndl*N.x-L.x, 2*ndl*N.y-L.y, 2*ndl*N.z-L.z };  // reflect L about N
        spec = std::pow(std::max(0.0, dot(R, Vv)), alpha);
    }
    double intensity = ka + kd*ndl + (ndl > 0 ? ks*spec : 0.0);
    return std::min(1.0, intensity);
}

int main() {
    V3 N{0, 0, 1}, L{0.3, 0.4, 1}, Vv{0, 0, 1};
    std::printf("%.4f\n", shade(N, L, Vv, 0.10, 0.7, 0.5, 32, true));   // 0.9361
    std::printf("%.4f\n", shade(N, L, Vv, 0.10, 0.7, 0.5, 32, false));  // 0.7402
    return 0;
}
```
</content>
</invoke>
