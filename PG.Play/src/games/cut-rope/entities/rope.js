// Cut the Rope — rope entity. A verlet chain registered into the world
// plus a flat ribbon mesh that's updated in-place from the alive chain.
//
// Performance note: the previous version disposed and reallocated a
// TubeGeometry every frame (per rope). That allocation thrashed the
// scene graph and starved the physics step on slower machines, which
// is the root cause of the "swing animation breaks half the time"
// feedback. The new path:
//   - allocates a ribbon BufferGeometry once at construction (fixed
//     vertex count for MAX_NODES nodes);
//   - writes positions in place per frame using the cached chain;
//   - re-walks the chain only when the world signals a cut.
// The ribbon lies in the XY plane; under the engine's orthographic
// camera it reads identically to the old tube but at a fraction of
// the cost.

import * as THREE from 'three';
import { makePoint, makeConstraint } from '../physics.js';

const MAX_NODES = 32;          // anchor + segments + candy
const ROPE_RADIUS = 0.085;     // visible thickness — tuned against the candy footprint.

export function makeRope(palette, def, anchorPoint, candyPoint, world) {
  // `segments` is the number of *interior* points; the constraint chain
  // has segments + 1 actual links (anchor → p0 → ... → pN → candy). Use
  // the link count to compute segLen so the rope's rest length matches
  // `def.length` exactly. The previous implementation under-counted by
  // one, leaving every rope intrinsically compressed at level start —
  // which made the candy hang below its true taut position and broke
  // the math behind hand-placed star arcs.
  const interior = def.segments || 12;
  const linkCount = interior + 1;
  const segLen = def.length / linkCount;
  const points = [];
  for (let i = 0; i < interior; i++) {
    const t = (i + 1) / linkCount;
    const x = anchorPoint.x + (candyPoint.x - anchorPoint.x) * t;
    const y = anchorPoint.y + (candyPoint.y - anchorPoint.y) * t;
    const p = makePoint(x, y);
    points.push(p);
    world.points.push(p);
  }
  const allPts = [anchorPoint, ...points, candyPoint];
  const ownConstraints = [];
  for (let i = 0; i < allPts.length - 1; i++) {
    const c = makeConstraint(allPts[i], allPts[i + 1], segLen);
    world.constraints.push(c);
    ownConstraints.push(c);
  }

  // Pre-allocated ribbon geometry: 2 vertices per node (left / right of
  // local perpendicular), MAX_NODES nodes, 6 indices per quad. We also
  // bake a static UV channel — uv.x is 0 on the left edge, 1 on the
  // right — so the shader can shade the cross-section like a tube
  // (darker at the edges, brighter at the center).
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(MAX_NODES * 2 * 3);
  const uvs = new Float32Array(MAX_NODES * 2 * 2);
  const indices = new Uint16Array((MAX_NODES - 1) * 6);
  for (let i = 0; i < MAX_NODES; i++) {
    uvs[i * 4 + 0] = 0; uvs[i * 4 + 1] = i / (MAX_NODES - 1); // left
    uvs[i * 4 + 2] = 1; uvs[i * 4 + 3] = i / (MAX_NODES - 1); // right
  }
  for (let i = 0; i < MAX_NODES - 1; i++) {
    const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
    indices[i * 6 + 0] = a; indices[i * 6 + 1] = b; indices[i * 6 + 2] = c;
    indices[i * 6 + 3] = b; indices[i * 6 + 4] = d; indices[i * 6 + 5] = c;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.setDrawRange(0, 0);
  // Manual bounding sphere keeps frustum culling sane while we update
  // positions in place. Computed once, big enough for any swing.
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 12);

  // Custom shader gives the ribbon an organic twisted-fibre look: a
  // tube cross-section (darker at edges, thin specular highlight) plus
  // a sinusoidal twist band that runs along the rope's length so it
  // reads as braided cord, not glossy plastic. The twist is keyed off
  // the v coordinate (which we baked along the chain length), so it
  // stays locked to the rope as it swings.
  const ropeColor = new THREE.Color(palette.rope);
  const ropeDark = ropeColor.clone().multiplyScalar(0.62);
  const ropeMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: ropeColor },
      uDark: { value: ropeDark },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      uniform vec3 uDark;
      varying vec2 vUv;
      void main() {
        float edge = abs(vUv.x - 0.5) * 2.0;
        float shade = 1.0 - 0.50 * pow(edge, 1.4);
        // Twisted-fibre band: a sin pattern along v, cross-section
        // mapped via uv.x so the dark stripe shifts diagonally and
        // reads as helical winding.
        float twist = sin((vUv.y * 60.0 + vUv.x * 3.4));
        float fibre = smoothstep(-0.1, 0.55, twist) * 0.45;
        vec3 base = mix(uDark, uColor, 0.55 + fibre * 0.6);
        // Thin specular along the upper edge of the cross-section.
        float hi = smoothstep(0.06, 0.0, abs(vUv.x - 0.42));
        vec3 col = base * shade + vec3(1.0, 0.95, 0.82) * hi * 0.30;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, ropeMat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;

  // Cached alive chain. Reset to null on cut; re-walked once the next
  // frame and reused thereafter (point references stay valid; only
  // their x/y coords change).
  let cachedChain = null;
  let lastAliveSignature = -1;

  function rebuild() {
    // Cheap signature check — count alive constraints in our rope. If
    // it has changed since the last walk, the topology has changed.
    let aliveCount = 0;
    for (let i = 0; i < ownConstraints.length; i++) {
      if (ownConstraints[i].alive) aliveCount++;
    }
    if (aliveCount !== lastAliveSignature) {
      cachedChain = walkAliveChain(ownConstraints, anchorPoint, candyPoint);
      lastAliveSignature = aliveCount;
    }
    const chain = cachedChain;
    if (!chain || chain.length < 2) {
      geo.setDrawRange(0, 0);
      return;
    }
    const n = Math.min(chain.length, MAX_NODES);
    const arr = positions;
    for (let i = 0; i < n; i++) {
      const p = chain[i];
      let dx, dy;
      if (i === 0) {
        dx = chain[1].x - p.x; dy = chain[1].y - p.y;
      } else if (i === n - 1) {
        dx = p.x - chain[i - 1].x; dy = p.y - chain[i - 1].y;
      } else {
        dx = chain[i + 1].x - chain[i - 1].x;
        dy = chain[i + 1].y - chain[i - 1].y;
      }
      const m = Math.hypot(dx, dy) || 1;
      const px = -dy / m * ROPE_RADIUS;
      const py =  dx / m * ROPE_RADIUS;
      const off = i * 6;
      arr[off + 0] = p.x + px; arr[off + 1] = p.y + py; arr[off + 2] = 0;
      arr[off + 3] = p.x - px; arr[off + 4] = p.y - py; arr[off + 5] = 0;
    }
    geo.attributes.position.needsUpdate = true;
    geo.setDrawRange(0, (n - 1) * 6);
  }

  return {
    points,
    rebuild,
    constraints: ownConstraints,
    get mesh() { return mesh; },
    dispose() {
      geo.dispose();
      ropeMat.dispose();
    },
  };
}

// Walk the alive chain across only this rope's constraints. Local
// adjacency means we don't pay world-wide N² scans like the old code.
function walkAliveChain(constraints, start, end) {
  const adj = new Map();
  for (let i = 0; i < constraints.length; i++) {
    const c = constraints[i];
    if (!c.alive) continue;
    if (!adj.has(c.a)) adj.set(c.a, []);
    if (!adj.has(c.b)) adj.set(c.b, []);
    adj.get(c.a).push(c.b);
    adj.get(c.b).push(c.a);
  }
  const out = [start];
  const visited = new Set([start]);
  let cur = start;
  while (true) {
    const neighbours = adj.get(cur);
    if (!neighbours) break;
    let nxt = null;
    for (let i = 0; i < neighbours.length; i++) {
      if (!visited.has(neighbours[i])) { nxt = neighbours[i]; break; }
    }
    if (!nxt) break;
    visited.add(nxt);
    out.push(nxt);
    cur = nxt;
    if (cur === end) break;
  }
  return out;
}
