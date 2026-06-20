// Snip — ambient atmosphere layer. A small, fixed pool of soft glowing
// motes (dust / bokeh) that drift slowly through the scene behind the
// gameplay plane, giving the warm backdrop a sense of depth and life
// instead of reading as a flat printed page.
//
// This layer is PURELY decorative: it never touches physics, never
// reads or writes gameplay state, and is ticked from the same per-frame
// loop the rest of the scene uses. The pool is allocated once at level
// load and recycled in place — no per-frame allocation, bounded count.
//
// Z placement: motes ride between the backdrop (z = -3.5) and the
// per-world decor (z = -2.5), so they sit clearly behind every
// gameplay entity (z ≈ 0) and never occlude the candy, rope, or Mochi.

import * as THREE from 'three';

const Z_NEAR = -2.6;   // closest motes (a touch in front of decor-adjacent)
const Z_FAR  = -3.3;   // farthest motes (just ahead of the backdrop)
const COUNT  = 18;     // fixed pool size — generous but cheap

// World bounds the motes wander within. The frustum is ~7.6 tall and
// the camera sits at y = 2, so the visible band is roughly y ∈ [-1.8, 5.8].
// We pad generously and respawn at the bottom once a mote drifts off top.
const SPAN_X = 9.0;
const TOP_Y  = -2.6;   // "up" is -Y in this world; motes rise toward -Y
const BOT_Y  =  6.4;

const _unitGeo = new THREE.PlaneGeometry(2, 2);
const _vertex = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv * 2.0 - 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Soft radial mote with a faint inner core — reads as out-of-focus bokeh.
const _fragment = /* glsl */`
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float r = length(vUv);
    if (r > 1.0) discard;
    float body = smoothstep(1.0, 0.18, r);
    float core = smoothstep(0.55, 0.0, r) * 0.5;
    float a = (body + core) * uOpacity;
    if (a <= 0.001) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

function rand(a, b) { return a + Math.random() * (b - a); }

export function makeAmbient(palette) {
  const group = new THREE.Group();
  group.renderOrder = -1;   // draw before gameplay; depthWrite off keeps order honest

  // Tint the motes off the world's backdrop highlight so they feel
  // native to each theme (warm cream in Sweet Shop, soft green in the
  // Greenhouse, ember orange in the Workshop). Fall back to a neutral
  // warm white if a palette omits the hint.
  const tint = new THREE.Color(palette?.backdropTop || '#fff3e2');
  // Lift the tint toward white a little so the motes glow rather than
  // blend invisibly into a pale backdrop.
  tint.lerp(new THREE.Color('#ffffff'), 0.35);

  const motes = [];
  for (let i = 0; i < COUNT; i++) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: tint.clone() },
        uOpacity: { value: 0 },
      },
      vertexShader: _vertex,
      fragmentShader: _fragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(_unitGeo, mat);
    mesh.frustumCulled = false;
    group.add(mesh);

    const m = {
      mesh, mat,
      x: 0, y: 0, z: 0, r: 0,
      rise: 0, swayAmp: 0, swayFreq: 0, phase: 0,
      baseOp: 0, twinkleFreq: 0, t: 0,
    };
    seed(m, true);
    motes.push(m);
  }

  function seed(m, initial) {
    m.x = rand(-SPAN_X * 0.5, SPAN_X * 0.5);
    // On first seed, scatter across the whole band; on recycle, start at
    // the bottom so motes appear to drift up continuously.
    m.y = initial ? rand(TOP_Y, BOT_Y) : rand(BOT_Y - 0.4, BOT_Y + 1.2);
    m.z = rand(Z_FAR, Z_NEAR);
    // Farther motes are bigger + dimmer + slower (depth cue).
    const depth = (m.z - Z_FAR) / (Z_NEAR - Z_FAR);   // 0 far .. 1 near
    m.r = rand(0.10, 0.20) + (1 - depth) * 0.18;
    m.rise = rand(0.18, 0.42) * (0.6 + depth * 0.7);  // world units / sec, upward (-Y)
    m.swayAmp = rand(0.10, 0.45);
    m.swayFreq = rand(0.25, 0.7);
    m.phase = rand(0, Math.PI * 2);
    m.baseOp = rand(0.10, 0.30) * (0.6 + depth * 0.6);
    m.twinkleFreq = rand(0.4, 1.1);
    m.t = rand(0, Math.PI * 2);
    m.mat.uniforms.uColor.value.copy(tint);
    m.mesh.scale.set(m.r, m.r, 1);
    m.mesh.position.set(m.x, m.y, m.z);
  }

  function update(dt) {
    // Guard against the first huge dt (tab refocus) producing a jump.
    const d = Math.min(dt || 0.016, 0.05);
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.t += d;
      m.y -= m.rise * d;                                  // drift upward (-Y)
      const sway = Math.sin(m.t * m.swayFreq + m.phase) * m.swayAmp;
      m.mesh.position.x = m.x + sway;
      m.mesh.position.y = m.y;
      // Gentle twinkle on opacity, with soft fade at the band edges so
      // motes don't pop in/out at the top and bottom.
      const edgeTop = Math.min(1, Math.max(0, (m.y - TOP_Y) / 0.8));
      const edgeBot = Math.min(1, Math.max(0, (BOT_Y - m.y) / 0.8));
      const twinkle = 0.7 + 0.3 * Math.sin(m.t * m.twinkleFreq);
      m.mat.uniforms.uOpacity.value = m.baseOp * twinkle * edgeTop * edgeBot;
      // Recycle once it drifts past the top of the band.
      if (m.y < TOP_Y - 0.8) seed(m, false);
    }
  }

  function dispose() {
    for (const m of motes) m.mat.dispose();
  }

  return { mesh: group, update, dispose };
}
