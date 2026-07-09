---
slug: gfx-transforms-matrices
module: computer-graphics
title: Transforms and Matrices — Placing Geometry on Screen
subtitle: How homogeneous coordinates fold translate, rotate, and scale into one matrix, and how the model-view-projection chain marches a vertex from object space onto your screen.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Real-Time Rendering, 4th ed. — Transforms (Chapter 4)"
    url: "https://www.realtimerendering.com/"
    type: book
  - title: "LearnOpenGL — Transformations"
    url: "https://learnopengl.com/Getting-started/Transformations"
    type: article
  - title: "LearnOpenGL — Coordinate Systems (the MVP chain)"
    url: "https://learnopengl.com/Getting-started/Coordinate-Systems"
    type: article
  - title: "Scratchapixel — Geometry: transforming points and vectors"
    url: "https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/geometry/how-does-matrix-work-part-1.html"
    type: article
status: published
---

## intro
Every triangle you see on a screen started life in its own little coordinate system — a teapot centered on its own origin, a character modeled around its own feet — and had to be marched into place, rotated to face the camera, and squashed by perspective before a single pixel lit up. That march is a sequence of matrix multiplies. The central trick of graphics math is that translation, rotation, scaling, shearing, and even perspective can all be written as one uniform kind of object, a matrix, provided you add one extra coordinate. This page builds that machinery from the ground up: why we need a fourth number, why the matrices are \(4\times4\), why the order you multiply them in changes the picture, and how the full model-view-projection pipeline works.

## whyItMatters
Transforms are the load-bearing wall of every renderer, game engine, CAD tool, and GPU shader on Earth. A vertex shader's entire job, boiled down, is to multiply an incoming position by a matrix. Skeletal animation is a hierarchy of transforms; a camera is a transform you invert; instancing draws a thousand copies of one mesh by handing the GPU a thousand matrices. Get the conventions wrong — column-major versus row-major, multiply order, forgetting the perspective divide — and your model appears inside-out, mirror-flipped, or collapsed to a dot, with no error message to explain why. Because these multiplies run once per vertex per frame, millions of times a second, understanding them is not optional trivia: it is the difference between geometry that lands where you meant and a screen full of garbage. Almost every "why is my object gone?" bug traces back to a transform.

## intuition
A point in 2D is a pair \((x, y)\); rotating or scaling it is a clean \(2\times2\) matrix multiply, \(\mathbf{p}' = M\mathbf{p}\). But **translation** — sliding a point by \((t_x, t_y)\) — is stubbornly *not* a matrix multiply. No \(2\times2\) matrix can send \((0,0)\) anywhere but \((0,0)\), because a linear map always fixes the origin. Translation moves the origin, so it lives outside the linear world.

The fix is **homogeneous coordinates**: promote the point to \((x, y, 1)\), one dimension up, and now translation *does* become a matrix multiply. In 2D we use \(3\times3\) matrices acting on \((x,y,1)\); in 3D we use \(4\times4\) matrices acting on \((x,y,z,1)\). That trailing \(1\) is the whole point — it gives the last column of the matrix somewhere to inject the translation:
\[
T=\begin{bmatrix}1&0&t_x\\0&1&t_y\\0&0&1\end{bmatrix},\quad
R(\theta)=\begin{bmatrix}\cos\theta&-\sin\theta&0\\ \sin\theta&\cos\theta&0\\0&0&1\end{bmatrix},\quad
S=\begin{bmatrix}s_x&0&0\\0&s_y&0\\0&0&1\end{bmatrix}.
\]
Now translate, rotate, and scale are all the same kind of thing — a matrix — so you can **compose** them by multiplying. Compose \(T\), \(R\), \(S\) into a single matrix \(M = T\,R\,S\) and apply it once. But composition is matrix multiplication, and matrix multiplication does **not commute**: \(TR \neq RT\). With column vectors and the convention \(\mathbf{p}' = M\mathbf{p}\), the matrix closest to the vector acts *first*. So \(M = T\,R\,S\) means "scale, then rotate, then translate" — read **right to left**. Rotate-then-translate orbits the object around the world origin at a radius; translate-then-rotate spins it in place then slides it. Same three operations, wildly different pictures, purely because of order. Homogeneous coordinates buy you uniformity; the price is that you must respect the non-commutative order of the product.

## visualization
```
Applying M = T * R(90 deg) * S(2)  to the point p = (1, 0), column-major, p' = M p
(read the product right-to-left: SCALE first, then ROTATE, then TRANSLATE by (3,1))

 step         matrix * vector                          result (x, y, w)
 -----------  ---------------------------------------  -----------------
 p            [ 1, 0, 1 ]^T                            ( 1, 0, 1 )
 S(2) * p     [2 0 0; 0 2 0; 0 0 1] * [1;0;1]          ( 2, 0, 1 )
 R(90) * .    [0 -1 0; 1 0 0; 0 0 1] * [2;0;1]         ( 0, 2, 1 )
 T(3,1) * .   [1 0 3; 0 1 1; 0 0 1] * [0;2;1]          ( 3, 3, 1 )

 order matters:  T*R*S sends (1,0) -> (3,3)      R*T*S sends (1,0) -> (-1,5)

 MVP chain for a 3D vertex (each arrow is one 4x4 multiply, then a divide):
   local (x,y,z,1)  --Model-->  world  --View-->  camera/eye
        --Projection-->  clip (x,y,z,w)  --/w-->  NDC [-1,1]^3  --viewport-->  pixel
```

## bruteForce
The naive approach keeps translation, rotation, and scale as *separate* operations and applies them one at a time in code: rotate every vertex with a \(2\times2\) or \(3\times3\) matrix, then add a translation vector, then multiply by scale factors, looping over each transform for every vertex. It works and it is easy to reason about, but it is clumsy at scale. You cannot fold the whole sequence into a single reusable object, so a deep transform hierarchy (a hand on an arm on a body on a moving platform) forces you to re-apply the full chain per vertex per level. Mixing "multiply for rotation" with "add for translation" also blocks the GPU, whose vertex units are built to do exactly one thing fast: a matrix-times-vector multiply.

## optimal
The professional approach lifts *everything* into homogeneous coordinates so that **every** transform — including translation and perspective — is a single matrix, and then **pre-composes** the whole chain into one matrix per object. Instead of applying \(S\), then \(R\), then \(T\) to a million vertices separately (three operations each), you compute \(M = T\,R\,S\) *once* on the CPU and hand the GPU a single \(4\times4\). Every vertex then costs exactly one matrix-vector multiply, which is precisely the operation silicon is optimized for. This is why real pipelines use \(4\times4\) matrices everywhere and why the classic decomposition is TRS: build \(M = T\cdot R\cdot S\) and the object is scaled in its own frame, then oriented, then placed.

The same idea scales up to the full **model-view-projection** chain. A vertex begins in *local/object space*. The **model** matrix \(M\) places it into shared *world space*. The **view** matrix \(V\) — the inverse of the camera's world transform — rebases everything into *eye space*, where the camera sits at the origin looking down \(-z\). The **projection** matrix \(P\) maps the visible frustum into *clip space*, and crucially loads the perspective foreshortening into the \(w\) component. Because these are all matrices, you multiply once: \(M_{\text{clip}} = P\,V\,M\), send that single combined matrix to the shader, and each vertex is transformed by \(\mathbf{p}_{\text{clip}} = P V M\,\mathbf{p}_{\text{local}}\). After the shader, the GPU performs the **perspective divide** — dividing \((x,y,z,w)\) by \(w\) — to reach *normalized device coordinates* in \([-1,1]^3\), and finally the **viewport transform** stretches NDC to pixel coordinates. The lesson: keep dimensions uniform, compose on the CPU, respect right-to-left order, and let the GPU do one multiply and one divide per vertex.

## complexity
time: A single \(n\times n\) matrix-vector multiply is \(O(n^2)\); for the fixed \(4\times4\) case that is a constant 16 multiply-adds per vertex, so transforming \(V\) vertices is \(O(V)\). Composing \(k\) transforms into one matrix is \(k\) matrix-matrix multiplies at \(O(n^3)=64\) flops each — done once on the CPU, then amortized across every vertex.
space: \(O(1)\) per matrix — a \(4\times4\) is 16 floats (64 bytes). Storing the pre-composed MVP is one matrix regardless of how many transforms folded into it, versus keeping every stage separately.
notes: Pre-composition is the entire win: fold \(k\) transforms into one \(4\times4\) once, then pay a flat 16 mul-adds per vertex instead of \(k\) separate operations. The perspective divide is one division per vertex, done in fixed-function hardware after the programmable shader.

## pitfalls
- **Multiplying in the wrong order.** \(T\,R \neq R\,T\): with column vectors the rightmost matrix acts first. Writing `S * R * T` when you meant `T * R * S` orbits the object around the origin instead of spinning it in place. Fix: settle on the TRS convention (`T * R * S`, read right-to-left) and be consistent everywhere.
- **Row-major vs column-major confusion.** OpenGL/GLSL is column-major with column vectors (\(M\mathbf{p}\)); DirectX/HLSL is often row-major with row vectors (\(\mathbf{p}M\)), which *reverses* the multiply order. Fix: pick one convention, know whether your math library stores translation in the last column or last row, and transpose only at the API boundary.
- **Forgetting the perspective divide.** After projection the vertex is in clip space with \(w \neq 1\); skipping the divide by \(w\) (or doing it before clipping) collapses or distorts the scene. Fix: let clip-space \(w\) carry through, divide by it only after clipping to reach NDC.
- **Applying a normal with the model matrix.** Transforming a surface normal by \(M\) breaks perpendicularity under non-uniform scale, wrecking lighting. Fix: transform normals by the inverse-transpose \((M^{-1})^{\top}\) of the upper-left \(3\times3\), and renormalize.
- **Treating points and direction vectors alike.** A point is \((x,y,z,1)\) and should feel translation; a direction is \((x,y,z,0)\) and must not. Fix: set \(w=1\) for positions and \(w=0\) for directions so translation only affects points.

## interviewTips
- Explain *why* graphics uses \(4\times4\) matrices in one sentence: a \(3\times3\) linear map can't translate because it fixes the origin, so the homogeneous \(w\) coordinate lets the extra row/column encode translation and perspective as an ordinary multiply.
- Be able to name the MVP stages and their spaces in order — local → (model) → world → (view) → eye → (projection) → clip → (÷w) → NDC → (viewport) → screen — and say which matrix does which, and that the perspective divide is the non-matrix step.
- State crisply that transform composition is non-commutative and demonstrate with a concrete example (rotate-then-translate vs translate-then-rotate landing a point in different places); mention the inverse-transpose rule for normals as the follow-up they often probe.

## keyTakeaways
- Homogeneous coordinates — appending \(w=1\) to a point — turn translation (and perspective) into an ordinary matrix multiply, so translate/rotate/scale all become uniform \(4\times4\) matrices you can compose.
- Composition is matrix multiplication, which does not commute: \(M = T\,R\,S\) applies scale first and translation last (right-to-left), and changing the order changes the picture.
- The model-view-projection chain \(P\,V\,M\) walks a vertex from local space to clip space in one pre-composed multiply; the GPU then divides by \(w\) to reach NDC and stretches that to pixels.

## code.python
```python
import numpy as np

def translate(tx, ty, tz):
    M = np.eye(4)
    M[:3, 3] = [tx, ty, tz]
    return M

def scale(sx, sy, sz):
    return np.diag([sx, sy, sz, 1.0])

def rotate_z(deg):
    t = np.radians(deg)
    c, s = np.cos(t), np.sin(t)
    return np.array([[c, -s, 0, 0],
                     [s,  c, 0, 0],
                     [0,  0, 1, 0],
                     [0,  0, 0, 1]], dtype=float)

def apply(M, p):                       # p is (x, y, z); w = 1 for a point
    v = M @ np.array([*p, 1.0])
    return v[:3] / v[3]                # perspective divide

T, R, S = translate(3, 1, 0), rotate_z(90), scale(2, 2, 1)
p = (1.0, 0.0, 0.0)
print(apply(T @ R @ S, p))             # [3. 3. 0.]  (scale, rotate, translate)
print(apply(R @ T @ S, p))            # [-1. 5. 0.]  order matters: T*R*S != R*T*S
```

## code.javascript
```javascript
// Column-major 4x4 as a flat length-16 array (OpenGL layout).
const ident = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

function mul(a, b) {                    // returns a*b, both column-major
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++)
        out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}
const translate = (x, y, z) => { const m = ident(); m[12]=x; m[13]=y; m[14]=z; return m; };
const scale = (x, y, z) => [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
function rotateZ(deg) {
  const t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
  return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1];
}
function apply(m, [x, y, z]) {          // point has w = 1
  const w = m[3]*x + m[7]*y + m[11]*z + m[15];
  return [(m[0]*x+m[4]*y+m[8]*z+m[12])/w,
          (m[1]*x+m[5]*y+m[9]*z+m[13])/w,
          (m[2]*x+m[6]*y+m[10]*z+m[14])/w];
}
const T = translate(3,1,0), R = rotateZ(90), S = scale(2,2,1);
console.log(apply(mul(mul(T, R), S), [1,0,0]));  // [3, 3, 0]
console.log(apply(mul(mul(R, T), S), [1,0,0]));  // [-1, 5, 0]  order matters
```

## code.java
```java
public class Transforms {
    // Column-major 4x4 stored as float[16]; returns a*b.
    static float[] mul(float[] a, float[] b) {
        float[] o = new float[16];
        for (int c = 0; c < 4; c++)
            for (int r = 0; r < 4; r++)
                for (int k = 0; k < 4; k++)
                    o[c*4+r] += a[k*4+r] * b[c*4+k];
        return o;
    }
    static float[] translate(float x, float y, float z) {
        float[] m = {1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1};
        return m;
    }
    static float[] scale(float x, float y, float z) {
        return new float[]{x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1};
    }
    static float[] rotateZ(double deg) {
        double t = Math.toRadians(deg); float c=(float)Math.cos(t), s=(float)Math.sin(t);
        return new float[]{c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1};
    }
    static float[] apply(float[] m, float x, float y, float z) {
        float w = m[3]*x + m[7]*y + m[11]*z + m[15];
        return new float[]{ (m[0]*x+m[4]*y+m[8]*z+m[12])/w,
                            (m[1]*x+m[5]*y+m[9]*z+m[13])/w,
                            (m[2]*x+m[6]*y+m[10]*z+m[14])/w };
    }
    public static void main(String[] args) {
        float[] T = translate(3,1,0), R = rotateZ(90), S = scale(2,2,1);
        float[] a = apply(mul(mul(T,R),S), 1,0,0);   // (3, 3, 0)
        float[] b = apply(mul(mul(R,T),S), 1,0,0);   // (-1, 5, 0) order matters
        System.out.printf("%.1f %.1f%n", a[0], a[1]);
        System.out.printf("%.1f %.1f%n", b[0], b[1]);
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <array>

using Mat4 = std::array<float, 16>;    // column-major (OpenGL layout)

Mat4 mul(const Mat4& a, const Mat4& b) {   // returns a*b
    Mat4 o{};
    for (int c = 0; c < 4; ++c)
        for (int r = 0; r < 4; ++r)
            for (int k = 0; k < 4; ++k)
                o[c*4+r] += a[k*4+r] * b[c*4+k];
    return o;
}
Mat4 translate(float x, float y, float z) { return {1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1}; }
Mat4 scale(float x, float y, float z)     { return {x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1}; }
Mat4 rotateZ(double deg) {
    double t = deg * M_PI / 180.0; float c = std::cos(t), s = std::sin(t);
    return {c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1};
}
std::array<float,3> apply(const Mat4& m, float x, float y, float z) {
    float w = m[3]*x + m[7]*y + m[11]*z + m[15];
    return {(m[0]*x+m[4]*y+m[8]*z+m[12])/w,
            (m[1]*x+m[5]*y+m[9]*z+m[13])/w,
            (m[2]*x+m[6]*y+m[10]*z+m[14])/w};
}
int main() {
    Mat4 T = translate(3,1,0), R = rotateZ(90), S = scale(2,2,1);
    auto a = apply(mul(mul(T,R),S), 1,0,0);   // (3, 3, 0)
    auto b = apply(mul(mul(R,T),S), 1,0,0);   // (-1, 5, 0)  order matters
    std::printf("%.1f %.1f\n", a[0], a[1]);
    std::printf("%.1f %.1f\n", b[0], b[1]);
    return 0;
}
```
