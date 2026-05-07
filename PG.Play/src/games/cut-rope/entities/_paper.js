// Snip — shared "paper-craft" primitives used by every gameplay entity.
//
// Every primitive renders unlit so the gameplay layer reads as a flat
// 2D illustration regardless of the orthographic camera angle. Soft
// shading is baked into the fragment shader (gradient + soft shadow +
// highlight), which keeps low-poly facets out of the picture without
// paying the cost of dense subdivisions.
//
// The functions here return THREE.Mesh objects with their material
// already configured. Layered Z values are conventional:
//   z = -0.05  shadow       (under)
//   z =  0.00  body         (main shape)
//   z =  0.06  trim/outline above body
//   z =  0.10  face / detail
//   z =  0.14  highlight gleam (top)
// Keep entities within ±0.2 of z=0 so they sit between the backdrop
// (z = -3.5) and the FX layer (z ≈ +0.05).

import * as THREE from 'three';

const _unitGeo = new THREE.PlaneGeometry(2, 2);

// Soft-shaded round disk. The shader treats the unit-square plane as a
// circle of radius 1 in local UV space, antialiases the edge, and
// applies a subtle highlight (top-left) plus shadow gradient (bottom).
export function paperDisk(radius, color, opts = {}) {
  const {
    outline = null,    // outline color (string/hex) or null for none
    outlineWidth = 0.06,
    highlight = 0.18,  // 0 disables, 1 max bright top-left
    shade = 0.18,      // 0 disables, 1 max dark bottom
    softness = 0.02,   // edge AA width
  } = opts;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOutline: { value: new THREE.Color(outline || color) },
      uOutlineW: { value: outline ? outlineWidth : 0 },
      uHi: { value: highlight },
      uShade: { value: shade },
      uSoft: { value: softness },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      uniform vec3 uOutline;
      uniform float uOutlineW;
      uniform float uHi;
      uniform float uShade;
      uniform float uSoft;
      varying vec2 vUv;
      void main() {
        float r = length(vUv);
        if (r > 1.0) discard;
        float aa = smoothstep(1.0, 1.0 - uSoft, r);
        // Outline ring.
        float outlineMix = (uOutlineW > 0.0)
          ? smoothstep(1.0 - uOutlineW - uSoft, 1.0 - uOutlineW, r)
          : 0.0;
        // Soft top-left highlight.
        float hi = max(0.0, dot(normalize(vec2(-0.55, -0.65)), vUv));
        hi = pow(hi, 1.6) * uHi;
        // Soft bottom shadow.
        float shade = smoothstep(0.0, 1.0, vUv.y) * uShade;
        vec3 base = uColor * (1.0 - shade) + vec3(1.0) * hi * 0.85;
        vec3 col = mix(base, uOutline, outlineMix);
        gl_FragColor = vec4(col, aa);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(_unitGeo, mat);
  mesh.scale.set(radius, radius, 1);
  return mesh;
}

// Soft-shaded ellipse — same as paperDisk but with separate x/y radii.
export function paperEllipse(rx, ry, color, opts = {}) {
  const m = paperDisk(1, color, opts);
  m.scale.set(rx, ry, 1);
  return m;
}

// Plain rounded-pill (rectangle with hemispheres on each end). Used for
// rope-segment hints, mouth interior, etc.
export function paperPill(width, height, color, opts = {}) {
  const { softness = 0.04 } = opts;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSoft: { value: softness },
      uHalf: { value: new THREE.Vector2(width * 0.5, height * 0.5) },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      uniform float uSoft;
      uniform vec2 uHalf;
      varying vec2 vUv;
      // Distance from a rounded box centered at origin with half size b
      // and corner radius r.
      float sdRound(vec2 p, vec2 b, float r) {
        vec2 d = abs(p) - b + r;
        return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
      }
      void main() {
        vec2 p = vUv * uHalf;
        float r = uHalf.y * 0.95;
        float d = sdRound(p, uHalf, r);
        float aa = smoothstep(0.0, -uSoft, d);
        if (aa <= 0.001) discard;
        gl_FragColor = vec4(uColor, aa);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(_unitGeo, mat);
  mesh.scale.set(width, height, 1);
  return mesh;
}

// Soft drop shadow — fades smoothly from center to edge. For under-
// character ground shadow.
export function paperShadow(rx, ry, opacity = 0.22) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uOp: { value: opacity } },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uOp;
      varying vec2 vUv;
      void main() {
        float r = length(vUv);
        float a = smoothstep(1.0, 0.0, r) * uOp;
        gl_FragColor = vec4(0.04, 0.02, 0.0, a);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(_unitGeo, mat);
  mesh.scale.set(rx, ry, 1);
  return mesh;
}

// 5-point star with inner glow halo. Used for collectible stars.
export function paperStar(radius, color = 0xffd24a, glowColor = 0xffe98f) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uGlow:  { value: new THREE.Color(glowColor) },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      uniform vec3 uGlow;
      varying vec2 vUv;
      // Polar SDF for a 5-point star, radii r1 (outer) and r2 (inner).
      // The wedge is centered on the +y axis in local SDF space; we feed
      // it (vUv.x, -vUv.y) so the apex points screen-up under our
      // vertically-flipped ortho camera.
      float sdStar(vec2 p, float r1, float r2) {
        const float n = 5.0;
        float a = 3.14159 / n;
        float ang = atan(p.x, p.y);
        ang = mod(ang, 2.0 * a) - a;
        float d = length(p);
        vec2 q = vec2(d * sin(ang), d * cos(ang));
        vec2 e = vec2(r2 * sin(a), r2 * cos(a)) - vec2(0.0, r1);
        vec2 v = q - vec2(0.0, r1);
        float t = clamp(dot(v, e) / dot(e, e), 0.0, 1.0);
        vec2 c = vec2(0.0, r1) + e * t;
        float dist = length(q - c);
        return (q.x * e.y - q.y * e.x) > 0.0 ? -dist : dist;
      }
      void main() {
        float d = sdStar(vec2(vUv.x, -vUv.y), 0.95, 0.42);
        float aa = smoothstep(0.02, -0.02, d);
        // Inner glow — closer to center is brighter.
        float r = length(vUv);
        float glow = (1.0 - r) * 0.6;
        vec3 col = mix(uColor, uGlow, glow);
        // Tiny rim highlight on the upper edge.
        float rim = smoothstep(0.0, -0.06, d) * (1.0 - smoothstep(0.0, -0.18, d));
        col += rim * vec3(1.0, 0.95, 0.7) * 0.4;
        gl_FragColor = vec4(col, aa);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(_unitGeo, mat);
  mesh.scale.set(radius, radius, 1);
  return mesh;
}

// Helper to dispose every material attached to meshes in a group.
export function disposePaperGroup(group) {
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.material?.dispose?.();
      // Note: we share _unitGeo, so don't dispose plane geometry here.
    }
  });
}
