// Three.js renderer for Era Siege — the '3d' art pack.
//
// Mirrors the Canvas2D renderer's full draw inventory in a low-poly,
// flat-shaded, vertex-colored scene (same quality bar as Grudgewood):
//
//   sky dome (era gradient + sun disc)  ·  cloud blobs  ·  hill ridges
//   ground lane + grass shoulders        ·  rock/tuft/debris scatter
//   ambient era motes                    ·  bases with damage states
//   turret slabs + procedural turrets    ·  special telegraphs
//   procedural unit rigs (pooled)        ·  projectiles + trails
//   additive particle points             ·  explosions + impact rings
//   damage / loot numbers (sprites)      ·  era flash quad
//   screen shake (camera jitter)         ·  per-era cinematic lighting
//
// The sim is never touched: this module only READS MatchState. Sim x/y
// (logical px) map to world meters via SX (horizontal) and SY (height
// above ground). The ground plane sits at world y = 0 and the lane runs
// along world X; the camera sits south of the lane (+Z) so the player
// base lands on screen-left, matching the 2D composition.

import * as THREE from 'three';
import { getEraByIndex, paletteFor } from '../content/eras.js';
import { BALANCE } from '../content/balance.js';

// World scale — sim px → meters. The sim's view is in CANVAS pixels (the
// fluid-sized element, not a fixed logical size), so a constant scale
// would make the world grow with the viewport. Instead the lane is
// normalized to a fixed world width and SX derived from the live view
// every frame (see render()). SY keeps the 2:1 ratio so sim "height
// above ground" values land at believable torso/rack heights.
const LANE_WORLD_W = 50;            // meters, lane end to lane end
let SX = 1 / 14;
let SY = 1 / 28;

// Stylized unit scale. A true-1.8 m figure is an ant on a 43 m lane —
// the same readability problem the 2D renderer solves with
// UNIT_RENDER_SCALE. Rigs are modeled ~1.8 m and scaled up here.
const UNIT_SCALE = 2.9;
const TURRET_SCALE = 2.1;

const SIM_DT = 1 / 60;
const DEATH_ANIM_MS = 380;
const HALF_PI = Math.PI / 2;

// Reusable temps — the render path allocates nothing per frame.
const _v3a = new THREE.Vector3();
const _v3b = new THREE.Vector3();
const _colA = new THREE.Color();
const _quat = new THREE.Quaternion();
const _UP_Y = new THREE.Vector3(0, 1, 0);

// ── Per-era cinematic looks ────────────────────────────────────────────
// Sky/sun/fog/ground are hand-tuned per era for the "cinematic" brief
// (Ember: warm dusk, Iron: cold daylight, Foundry: smoky orange,
// Storm: dark teal storm, Void: purple night). Banner / flash / mote
// accents derive from content/palette.js via paletteFor so the 3D look
// stays anchored to the same era identity as the 2D art.
const ERA_LOOKS = [
  { // Ember Tribe — warm dusk
    skyTop: '#26314f', skyMid: '#a85838', skyBot: '#e8945a',
    sunColor: '#ffc98a', sunIntensity: 1.5, sunDir: [-0.55, 0.42, 0.38],
    hemiSky: '#8a7490', hemiGround: '#3a2418', fillColor: '#7488b8',
    fog: '#41304a', fogDensity: 0.0052,
    groundTint: '#d8b890', hillNear: '#5a4458', hillFar: '#454060',
    cloudTint: '#caa088',
    mote: { color: '#ff8a3a', count: 44, mode: 'rise', speed: 1.4 },
  },
  { // Iron Dominion — cold daylight
    skyTop: '#48688c', skyMid: '#8aa2b8', skyBot: '#c2ccd4',
    sunColor: '#fff2dc', sunIntensity: 1.3, sunDir: [0.45, 0.72, 0.34],
    hemiSky: '#aebfd0', hemiGround: '#43505c', fillColor: '#90a8c8',
    fog: '#74889a', fogDensity: 0.0042,
    groundTint: '#b8bcb4', hillNear: '#46525e', hillFar: '#5e6c7c',
    cloudTint: '#e8ecf0',
    mote: { color: '#cdc8c0', count: 36, mode: 'drift', speed: 1.0 },
  },
  { // Sun Foundry — smoky orange
    skyTop: '#3a2c28', skyMid: '#a85a26', skyBot: '#ff9a40',
    sunColor: '#ffb86a', sunIntensity: 1.05, sunDir: [0.5, 0.34, 0.42],
    hemiSky: '#aa7850', hemiGround: '#33231a', fillColor: '#9078a0',
    fog: '#5e3e26', fogDensity: 0.0068,
    groundTint: '#caa078', hillNear: '#503828', hillFar: '#6a4830',
    cloudTint: '#a87850',
    mote: { color: '#ffcb6b', count: 52, mode: 'rise', speed: 2.2 },
  },
  { // Storm Republic — dark teal storm
    skyTop: '#142e3a', skyMid: '#22505e', skyBot: '#3e7480',
    sunColor: '#bfe8f0', sunIntensity: 0.85, sunDir: [-0.3, 0.8, 0.4],
    hemiSky: '#5e8a98', hemiGround: '#1c2c34', fillColor: '#6090a8',
    fog: '#1e3a44', fogDensity: 0.0072,
    groundTint: '#88a4a0', hillNear: '#243e48', hillFar: '#30525c',
    cloudTint: '#3e5a66',
    mote: { color: '#7be3ff', count: 60, mode: 'fall', speed: 4.2 },
  },
  { // Void Ascendancy — purple night
    skyTop: '#120826', skyMid: '#341458', skyBot: '#5a2a86',
    sunColor: '#cf9fff', sunIntensity: 0.75, sunDir: [0.4, 0.55, 0.45],
    hemiSky: '#5a3e84', hemiGround: '#180c2e', fillColor: '#6048a0',
    fog: '#241040', fogDensity: 0.0078,
    groundTint: '#9a86c0', hillNear: '#2c1850', hillFar: '#3c2468',
    cloudTint: '#503a78',
    mote: { color: '#c89bff', count: 36, mode: 'orbit', speed: 0.8 },
  },
];

// HP-bar colors — same thresholds + cb-safe variants as the 2D hpColor.
function hpBarColor(out, r, cbSafe) {
  if (cbSafe) out.set(r > 0.5 ? '#7be3ff' : r > 0.25 ? '#ffcb6b' : '#ff5fb3');
  else        out.set(r > 0.5 ? '#35f0c9' : r > 0.25 ? '#ffe14f' : '#ff4d6d');
  return out;
}

// Deterministic hash noise for vertex jitter / scatter placement so the
// battlefield looks the same on every boot.
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function makeRenderer3D({ canvas }) {
  // ── Renderer / scene / camera ─────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  scene.add(camera);   // camera is in the graph so the flash quad renders

  // Dev-only scene handle for the screenshot/debug harness. The slot
  // helpers land on it after they're defined below.
  const devHandle = import.meta.env.DEV ? { scene, camera, renderer } : null;
  if (devHandle) window.__es3d = devHandle;

  // Units are articulated procedural character rigs (see buildRig) — a
  // pelvis/torso/head spine with hinged legs and arms, per-era headgear,
  // a role/era weapon, and a team-coloured tabard. No baked sprite art.

  // Camera rig — direction is fixed (south of the lane, elevated);
  // distance is recomputed from aspect + lane width so the battlefield
  // fills the frame at any canvas size.
  // Lower, closer angle — the lane should dominate the frame, with the
  // hills and sky as a backdrop band rather than half the screen.
  const camDir = new THREE.Vector3(0, 0.27, 0.96).normalize();
  const camTarget = new THREE.Vector3(0, 2.6, 0);
  let camDist = 30;
  let laneHalfWorld = 25;     // refreshed from match.view every frame

  function frameCamera() {
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * Math.max(0.5, camera.aspect));
    // Frame the lane plus the fortresses (they sit ~50 sim-px beyond the
    // lane ends — about 3.6m — plus their own half-width).
    camDist = Math.max(16, (laneHalfWorld + 5.5) / Math.tan(hHalf));
  }

  // ── Sky dome ──────────────────────────────────────────────────────
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(ERA_LOOKS[0].skyTop) },
      uMid: { value: new THREE.Color(ERA_LOOKS[0].skyMid) },
      uBot: { value: new THREE.Color(ERA_LOOKS[0].skyBot) },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color(ERA_LOOKS[0].sunColor) },
    },
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vWorld;
      uniform vec3 uTop, uMid, uBot, uSunColor;
      uniform vec3 uSunDir;
      void main() {
        vec3 dir = normalize(vWorld);
        float h = clamp((dir.y + 0.22) * 0.85, 0.0, 1.0);
        vec3 col = mix(uBot, uMid, smoothstep(0.0, 0.45, h));
        col = mix(col, uTop, smoothstep(0.45, 1.0, h));
        float s = max(dot(dir, uSunDir), 0.0);
        col += uSunColor * (pow(s, 900.0) * 1.7 + pow(s, 28.0) * 0.35 + pow(s, 4.0) * 0.10);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(360, 24, 16), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  // ── Lights — sun + hemisphere + cool fill (Grudgewood values) ─────
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 220;
  sun.shadow.camera.left = -34;
  sun.shadow.camera.right = 34;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  scene.add(sun.target);

  const hemi = new THREE.HemisphereLight(0xddccaa, 0x2a1a10, 0.9);
  scene.add(hemi);

  const fill = new THREE.DirectionalLight(0xa8bcd8, 0.7);
  fill.position.set(-40, 26, 34);
  scene.add(fill);

  // Mirrored fill from the east so the inner faces of BOTH fortresses
  // (which face each other along the lane) always have a light source —
  // a single fill leaves one fortress's lane-facing side pitch black.
  const fill2 = new THREE.DirectionalLight(0xa8bcd8, 0.55);
  fill2.position.set(40, 26, 34);
  scene.add(fill2);

  scene.fog = new THREE.FogExp2(ERA_LOOKS[0].fog, ERA_LOOKS[0].fogDensity);

  // ── Ground — dirt battle road + grass shoulders ───────────────────
  // Vertex colors carry the dirt/grass split + brightness noise in
  // near-neutral tones; the material color applies the era tint as a
  // multiplier so era changes recolor the whole field in one lerp.
  const groundMat = new THREE.MeshStandardMaterial({
    color: ERA_LOOKS[0].groundTint,
    roughness: 0.96,
    flatShading: true,
    vertexColors: true,
  });
  {
    const geo = new THREE.PlaneGeometry(200, 90, 100, 44);
    geo.rotateX(-HALF_PI);
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    // Smooth layered noise for colour — pure per-vertex hash reads as a
    // checkerboard under flat shading, so brightness has to drift over
    // several faces instead of flipping every face.
    const drift = (x, z) => (
      Math.sin(x * 0.18 + z * 0.11) * 0.5 +
      Math.sin(x * 0.07 - z * 0.23 + 1.7) * 0.3 +
      Math.sin(x * 0.31 + z * 0.41 + 4.1) * 0.2
    ) * 0.5 + 0.5;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      // Flat in the battle lane, gentle bumps on the shoulders.
      const laneK = THREE.MathUtils.smoothstep(Math.abs(z), 2.4, 7.0);
      pos.setY(i, (hash2(x * 0.6, z * 0.6) - 0.5) * (0.06 + laneK * 0.55));
      // Dirt strip blends into grass over |z| 1.8..3.2.
      const dirtK = 1 - THREE.MathUtils.smoothstep(Math.abs(z), 1.8, 3.2);
      const n = 0.88 + drift(x, z) * 0.18 + (hash2(x * 1.7, z * 1.7) - 0.5) * 0.06;
      const wheelRut = Math.abs(Math.abs(z) - 0.9) < 0.28 ? 0.86 : 1;
      const r = THREE.MathUtils.lerp(0.46, 0.96, dirtK) * n * wheelRut;
      const g = THREE.MathUtils.lerp(0.68, 0.84, dirtK) * n * wheelRut;
      const b = THREE.MathUtils.lerp(0.34, 0.66, dirtK) * n * wheelRut;
      cols[i * 3] = r; cols[i * 3 + 1] = g; cols[i * 3 + 2] = b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);
  }

  // ── Background hill ridges — two jittered terrain bands ───────────
  const hillNearMat = new THREE.MeshStandardMaterial({
    color: ERA_LOOKS[0].hillNear, roughness: 1, flatShading: true, vertexColors: true,
  });
  const hillFarMat = new THREE.MeshStandardMaterial({
    color: ERA_LOOKS[0].hillFar, roughness: 1, flatShading: true, vertexColors: true,
  });
  function makeRidge(mat, zCenter, depth, peak, seed) {
    const geo = new THREE.PlaneGeometry(320, depth, 56, 7);
    geo.rotateX(-HALF_PI);
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      // Peaks rise toward the band's far edge so the ridge reads as a
      // wall of hills from the camera's low angle.
      const back = THREE.MathUtils.smoothstep(-z, -depth / 2 + 2, depth / 2);
      const h = (hash2(x * 0.11 + seed, z * 0.13) * 0.7 + hash2(x * 0.31 + seed, z * 0.07) * 0.3);
      pos.setY(i, back * peak * (0.35 + h * 0.65));
      const n = 0.8 + hash2(x * 0.9 + seed, z * 0.9) * 0.35;
      cols[i * 3] = n; cols[i * 3 + 1] = n; cols[i * 3 + 2] = n;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.position.z = zCenter;
    m.position.y = -0.4;
    scene.add(m);
  }
  makeRidge(hillNearMat, -32, 26, 7, 3.7);
  makeRidge(hillFarMat, -62, 36, 16, 9.1);

  // ── Cloud blobs — flattened icosahedra drifting along X ───────────
  // Soft and translucent — at 0.8 opacity with strong facets the blobs
  // read as floating rocks, not clouds.
  const cloudMat = new THREE.MeshLambertMaterial({
    color: ERA_LOOKS[0].cloudTint, transparent: true, opacity: 0.45,
    flatShading: true, depthWrite: false,
  });
  const CLOUD_CT = 10;
  const clouds = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), cloudMat, CLOUD_CT);
  const cloudSeeds = [];
  {
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < CLOUD_CT; i++) {
      const sx = 4 + hash2(i, 1) * 6;
      const seed = {
        x: (hash2(i, 2) - 0.5) * 200,
        y: 20 + hash2(i, 3) * 14,
        z: -34 - hash2(i, 4) * 50,
        sx, sy: sx * (0.25 + hash2(i, 5) * 0.15), sz: sx * 0.7,
        speed: 0.5 + hash2(i, 6) * 0.8,
      };
      cloudSeeds.push(seed);
      m4.makeScale(seed.sx, seed.sy, seed.sz);
      m4.setPosition(seed.x, seed.y, seed.z);
      clouds.setMatrixAt(i, m4);
    }
  }
  clouds.frustumCulled = false;
  scene.add(clouds);
  const _cloudM4 = new THREE.Matrix4();

  // ── Scatter — rocks, grass tufts, lane debris (instanced) ─────────
  const scatterMats = [];
  function scatter(geo, baseColor, count, place) {
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true });
    scatterMats.push(mat);
    const inst = new THREE.InstancedMesh(geo, mat, count);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      place(i, p, s);
      q.setFromAxisAngle(_UP_Y, hash2(i, 77) * Math.PI * 2);
      m4.compose(p, q, s);
      inst.setMatrixAt(i, m4);
      const v = 0.7 + hash2(i, 91) * 0.5;
      c.set(baseColor).multiplyScalar(v);
      inst.setColorAt(i, c);
    }
    inst.castShadow = true;
    inst.receiveShadow = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    scene.add(inst);
    return inst;
  }
  // Rocks on the shoulders (both sides of the lane).
  scatter(new THREE.DodecahedronGeometry(0.5, 0), '#8d8678', 46, (i, p, s) => {
    const side = i % 2 ? 1 : -1;
    p.set((hash2(i, 11) - 0.5) * 170, 0.06, side * (3.4 + hash2(i, 12) * 14));
    const k = 0.3 + hash2(i, 13) * 0.9;
    s.set(k, k * (0.6 + hash2(i, 14) * 0.5), k);
  });
  // Grass tufts — slim cones clustered on the grass band.
  scatter(new THREE.ConeGeometry(0.1, 0.42, 5), '#7a9858', 110, (i, p, s) => {
    const side = i % 2 ? 1 : -1;
    p.set((hash2(i, 21) - 0.5) * 180, 0.18, side * (2.8 + hash2(i, 22) * 13));
    const k = 0.7 + hash2(i, 23) * 0.9;
    s.set(k, k, k);
  });
  // Battle debris — small charred blocks scattered on the road itself.
  scatter(new THREE.BoxGeometry(0.3, 0.14, 0.22), '#5c5046', 26, (i, p, s) => {
    p.set((hash2(i, 31) - 0.5) * 70, 0.06, (hash2(i, 32) - 0.5) * 3.4);
    const k = 0.5 + hash2(i, 33) * 1.1;
    s.set(k, k, k);
  });

  // ── Geometry helpers — smoother forms with IDENTICAL bounding boxes ──
  // capH(total, radius): a vertical capsule whose overall height equals
  // `total` (length = total - 2*radius), centred on the origin — a drop-in
  // for a Box of the same height so baked joint pivots stay aligned.
  function capH(total, radius) {
    const r = Math.min(radius, total / 2 - 1e-3);
    return new THREE.CapsuleGeometry(r, total - 2 * r, 4, 12);
  }
  // roundedBox(w, h, d, r): a beveled box that keeps the exact (w,h,d)
  // bounding extents and stays centred at the origin, so it can replace a
  // BoxGeometry of the same dims without shifting any anchor. Built core-only
  // (no addons) by extruding a rounded rectangle and clamping depth to d.
  function roundedBox(w, h, d, r) {
    // bevel grows the outline OUTWARD by bevelSize and the depth by
    // 2*bevelThickness, so build the base profile inset by `bevel` on every
    // axis; the bevel then expands it back to exactly (w,h,d).
    const bevel = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
    const iw = w - 2 * bevel, ih = h - 2 * bevel;   // inner profile extents
    const cr = Math.min(bevel, iw / 2 - 1e-3, ih / 2 - 1e-3);
    const hw = iw / 2, hh = ih / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hw + cr, -hh);
    shape.lineTo(hw - cr, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
    shape.lineTo(hw, hh - cr);
    shape.quadraticCurveTo(hw, hh, hw - cr, hh);
    shape.lineTo(-hw + cr, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
    shape.lineTo(-hw, -hh + cr);
    shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d - 2 * bevel, bevelEnabled: true,
      bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, steps: 1,
    });
    geo.translate(0, 0, -(d / 2) + bevel);     // extrude grows +Z from 0; re-centre
    geo.computeVertexNormals();
    return geo;
  }

  // ── Shared geometries (units / turrets / fx) ──────────────────────
  const GEO = {
    // Character skeleton — pivots are baked into the translates: thigh and
    // upper-arm geometries hang from their joint origin so a single
    // rotation.x at the group reads as a hip/shoulder swing, and the
    // knee/elbow segments hang from their own sub-pivots.
    // Torso/pelvis use rounded (beveled) boxes so the body reads sculpted
    // rather than slab-sided. roundedBox() preserves the exact bounding box
    // and (for un-translated parts) stays centred at the origin, so every
    // anchor placement below is unchanged.
    // Hips narrower than the shoulders (heroic taper). Pelvis is a small
    // wedge, NOT a slab — the lower body is mostly leg. The chest is a tall
    // ribcage that rises from the waist up to the shoulder line so the torso
    // reads as one solid mass (no gap below the arms).
    pelvis:     roundedBox(0.32, 0.2, 0.24, 0.06),
    chest:      roundedBox(0.5, 0.62, 0.3, 0.1),
    // Defined waist segment that tapers the torso between chest and hips.
    waist:      roundedBox(0.36, 0.2, 0.26, 0.07),
    waistHeavy: roundedBox(0.48, 0.22, 0.34, 0.08),
    chestHeavy: roundedBox(0.68, 0.68, 0.42, 0.11),
    pelvisHeavy: roundedBox(0.44, 0.22, 0.32, 0.07),
    // Small hip cloth — a narrow loincloth that hangs from the waist over
    // the front of the hips only. Replaces the old chest-to-thigh slab.
    loincloth:  roundedBox(0.26, 0.3, 0.06, 0.02).translate(0, -0.13, 0),
    loinclothHeavy: roundedBox(0.36, 0.34, 0.07, 0.025).translate(0, -0.15, 0),
    tabard:     new THREE.BoxGeometry(0.26, 0.34, 0.045),
    shoulderCap: roundedBox(0.2, 0.1, 0.22, 0.04),
    hood:       new THREE.ConeGeometry(0.2, 0.34, 12),
    club:       new THREE.CylinderGeometry(0.04, 0.07, 0.55, 12).translate(0, 0.32, 0),
    clubHead:   new THREE.SphereGeometry(0.12, 16, 12),
    spear:      new THREE.CylinderGeometry(0.025, 0.025, 1.3, 12).translate(0, 0.35, 0),
    spearTip:   new THREE.ConeGeometry(0.05, 0.18, 12).translate(0, 1.06, 0),
    towerShield: roundedBox(0.5, 0.92, 0.07, 0.04),
    rifleStock: roundedBox(0.09, 0.13, 0.5, 0.035),
    rifleBarrel: new THREE.CylinderGeometry(0.03, 0.035, 0.5, 12).rotateX(HALF_PI),
    wisp:       new THREE.ConeGeometry(0.22, 0.55, 12).rotateX(Math.PI),
    coreDisc:   new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16).rotateX(HALF_PI),
    belt:       roundedBox(0.38, 0.09, 0.28, 0.03),
    // Head/helm keep a characterful beveled-box read (rounded, not faceted).
    head:       roundedBox(0.3, 0.3, 0.3, 0.07),
    helm:       roundedBox(0.34, 0.16, 0.34, 0.06),
    helmRidge:  roundedBox(0.05, 0.16, 0.3, 0.02),
    visor:      new THREE.BoxGeometry(0.22, 0.05, 0.02),
    // Limbs — capsules of the SAME bounding height as the boxes they
    // replace, then translated by the SAME pivot offset so the joint
    // animation stays aligned. capH(total, radius) gives a capsule whose
    // overall height equals `total`.
    thigh:      capH(0.4, 0.1).translate(0, -0.2, 0),
    calf:       capH(0.38, 0.078).translate(0, -0.19, 0),
    boot:       roundedBox(0.16, 0.11, 0.28, 0.04).translate(0, -0.4, 0.05),
    // Arms read as muscled and clearly visible alongside the torso.
    upperArm:   capH(0.34, 0.082).translate(0, -0.17, 0),
    forearm:    capH(0.32, 0.07).translate(0, -0.16, 0),
    // Weapons — sized to READ at full-lane framing, not to scale.
    swordBlade: roundedBox(0.055, 0.78, 0.16, 0.025).translate(0, 0.5, 0),
    swordGuard: roundedBox(0.2, 0.05, 0.07, 0.022).translate(0, 0.1, 0),
    swordGrip:  new THREE.CylinderGeometry(0.03, 0.03, 0.18, 12),
    swordPommel: new THREE.SphereGeometry(0.038, 12, 8).translate(0, -0.09, 0),
    shield:     roundedBox(0.5, 0.64, 0.07, 0.05),
    shieldBoss: new THREE.CylinderGeometry(0.1, 0.12, 0.06, 16).rotateX(HALF_PI),
    bowArc:     new THREE.TorusGeometry(0.42, 0.028, 8, 24, Math.PI),
    bowString:  new THREE.BoxGeometry(0.012, 0.82, 0.012),
    arrowNock:  new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8).rotateZ(HALF_PI),
    hammerHaft: new THREE.CylinderGeometry(0.04, 0.045, 1.0, 12).translate(0, 0.3, 0),
    hammerHead: roundedBox(0.38, 0.24, 0.24, 0.05).translate(0, 0.82, 0),
    cape:       new THREE.PlaneGeometry(0.56, 0.78),
    pole:       new THREE.CylinderGeometry(0.025, 0.025, 1.5, 12),
    flag:       new THREE.PlaneGeometry(0.5, 0.32),
    horn:       new THREE.ConeGeometry(0.05, 0.18, 12),
    pauldron:   roundedBox(0.2, 0.1, 0.34, 0.04),
    gear:       new THREE.CylinderGeometry(0.13, 0.13, 0.06, 16).rotateX(HALF_PI),
    antenna:    new THREE.CylinderGeometry(0.014, 0.014, 0.34, 8).translate(0, 0.17, 0),
    antennaTip: new THREE.SphereGeometry(0.045, 16, 12),
    shard:      new THREE.OctahedronGeometry(0.12, 0),
    auraRing:   new THREE.RingGeometry(0.45, 0.62, 24).rotateX(-HALF_PI),
    // Soft round blob shadow planted under each rig (cheaper + softer than
    // a real cast shadow at the lane's on-screen scale).
    unitShadow: new THREE.CircleGeometry(0.5, 24).rotateX(-HALF_PI),
    // Extra rig parts for the new articulated characters.
    neck:        new THREE.CylinderGeometry(0.07, 0.08, 0.1, 10),
    hair:        new THREE.SphereGeometry(0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
    feather:     new THREE.ConeGeometry(0.035, 0.34, 6).translate(0, 0.17, 0),
    tricorn:     new THREE.ConeGeometry(0.26, 0.12, 3),
    tricornCrown: roundedBox(0.24, 0.18, 0.24, 0.05),
    voidShard:   new THREE.OctahedronGeometry(0.09, 0),
    pistol:      roundedBox(0.07, 0.1, 0.26, 0.025).translate(0, 0, 0.08),
    saberBlade:  roundedBox(0.05, 0.62, 0.08, 0.02).translate(0, 0.4, 0),
    gunBody:     roundedBox(0.11, 0.16, 0.62, 0.04).translate(0, 0, 0.16),
    gunBarrel:   new THREE.CylinderGeometry(0.05, 0.055, 0.5, 12).rotateX(HALF_PI).translate(0, 0, 0.5),
    gunMag:      roundedBox(0.08, 0.2, 0.1, 0.02).translate(0, -0.13, 0.04),
    musketStock: roundedBox(0.07, 0.12, 0.9, 0.03).translate(0, 0, 0.2),
    musketBarrel: new THREE.CylinderGeometry(0.03, 0.035, 0.7, 12).rotateX(HALF_PI).translate(0, 0, 0.62),
    voidStaff:   new THREE.CylinderGeometry(0.03, 0.035, 1.1, 10).translate(0, 0.3, 0),
    voidBlade:   roundedBox(0.04, 0.7, 0.12, 0.02).translate(0, 0.45, 0),
    robeSkirt:   new THREE.ConeGeometry(0.32, 0.7, 12, 1, true).rotateX(Math.PI),
    coatSkirt:   new THREE.CylinderGeometry(0.26, 0.34, 0.56, 12, 1, true),
    // Turret parts.
    tBase:      new THREE.CylinderGeometry(0.3, 0.36, 0.16, 16),
    tHousing:   roundedBox(0.42, 0.3, 0.46, 0.06),
    tHousingHvy: roundedBox(0.56, 0.4, 0.6, 0.08),
    tBarrel:    new THREE.CylinderGeometry(0.06, 0.07, 0.7, 12).rotateX(HALF_PI).translate(0, 0, 0.3),
    tBarrelHvy: new THREE.CylinderGeometry(0.1, 0.12, 0.56, 12).rotateX(HALF_PI).translate(0, 0, 0.24),
    slab:       new THREE.BoxGeometry(1.3, 0.16, 1.1),
    bracket:    roundedBox(0.18, 0.5, 0.18, 0.04),
    // FX.
    projHead:   new THREE.SphereGeometry(0.09, 6, 5),
    projTrail:  new THREE.PlaneGeometry(0.085, 1).translate(0, -0.5, 0),
    ring:       new THREE.RingGeometry(0.82, 1, 40).rotateX(-HALF_PI),
    boom:       new THREE.IcosahedronGeometry(1, 0),
    circle:     new THREE.CircleGeometry(1, 40).rotateX(-HALF_PI),
    band:       new THREE.PlaneGeometry(1, 1).rotateX(-HALF_PI),
    muzzle:     new THREE.PlaneGeometry(0.5, 0.5),
  };

  // ── Bases — low-poly fortress towers ──────────────────────────────
  // Each base owns cloned materials so damage charring and the per-side
  // banner color never leak across to the other fortress.
  function makeFortress(isPlayer) {
    const g = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: '#9a9082', roughness: 0.95, flatShading: true });
    const stoneDark = new THREE.MeshStandardMaterial({ color: '#6e665e', roughness: 0.98, flatShading: true });
    const cloth = new THREE.MeshStandardMaterial({ color: '#ffd05a', roughness: 0.9, side: THREE.DoubleSide });
    const glow = new THREE.MeshStandardMaterial({
      color: '#332b1e', emissive: '#ffc868', emissiveIntensity: 1.4, roughness: 0.8,
    });

    const keep = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.6, 3.4), stone);
    keep.position.y = 2.3;
    keep.castShadow = true; keep.receiveShadow = true;
    g.add(keep);
    // Upper keep — narrower second storey.
    const upper = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.6, 2.5), stone);
    upper.position.y = 5.4;
    upper.castShadow = true;
    g.add(upper);
    // Battlements around the upper rim.
    for (let k = 0; k < 4; k++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), stoneDark);
      c.position.set((k % 2 ? 1 : -1) * 1.05, 6.4, (k < 2 ? 1 : -1) * 1.05);
      c.castShadow = true;
      g.add(c);
    }
    // Corner towers on the lane-facing edge.
    for (const dz of [-1.5, 1.5]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 5.4, 7), stoneDark);
      t.position.set(0, 2.7, dz);
      t.castShadow = true;
      g.add(t);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.9, 7), stone);
      cap.position.set(0, 5.8, dz);
      cap.castShadow = true;
      g.add(cap);
    }
    // Gate — dark arch slab on the lane-facing side.
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.1, 1.3), stoneDark);
    gate.position.set((isPlayer ? 1 : -1) * 1.72, 1.05, 0);
    g.add(gate);
    // Banner cloth hung above the gate.
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.0), cloth);
    banner.position.set((isPlayer ? 1 : -1) * 1.78, 3.4, 0);
    banner.rotation.y = (isPlayer ? 1 : -1) * HALF_PI;
    g.add(banner);
    // Glowing accent windows.
    for (const [wy, wz] of [[3.2, -0.9], [4.0, 0.7], [5.5, 0]]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.26), glow);
      w.position.set((isPlayer ? 1 : -1) * 1.73, wy, wz);
      g.add(w);
    }
    // Flag on a pole at the top.
    const pole = new THREE.Mesh(GEO.pole, stoneDark);
    pole.position.y = 7.0;
    g.add(pole);
    const flagM = new THREE.Mesh(GEO.flag, cloth);
    flagM.position.set((isPlayer ? 1 : -1) * 0.27, 7.55, 0);
    g.add(flagM);

    // Presence boost — the fortress anchors its end of the frame.
    g.scale.setScalar(1.55);
    scene.add(g);
    // baseStone snapshots the pristine colors so charring can multiply
    // from the source values each frame without drifting.
    return { group: g, stone, stoneDark, cloth, glow, flag: flagM, isPlayer, baseStone: stone.color.clone(), baseStoneDark: stoneDark.color.clone() };
  }
  const playerBase = makeFortress(true);
  const enemyBase = makeFortress(false);

  // ── Turret slabs (spots) + turret records ─────────────────────────
  const slabMat = new THREE.MeshStandardMaterial({ color: '#6b675f', roughness: 0.96, flatShading: true });
  const muzzleMat = new THREE.MeshBasicMaterial({
    color: '#ffe9a0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide,
  });
  // Each slot is a real stone pylon beside the fortress so turrets have
  // an obvious physical home in the world. Player-side empty slots show
  // a ghost outline + pulsing ground ring + floating holo diamond — the
  // "build here" affordance lives on the battlefield, not only in the
  // side panel. Invisible hit cylinders make the pylons clickable.
  const ghostMat = new THREE.MeshBasicMaterial({
    color: '#7be3ff', transparent: true, opacity: 0.26,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#7be3ff', transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const holoMat = new THREE.MeshBasicMaterial({
    color: '#aef0ff', transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const pipOnMat = new THREE.MeshBasicMaterial({ color: '#ffd05a' });
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const pylonColGeo = new THREE.BoxGeometry(0.66, 1, 0.66);
  const pylonCapGeo = new THREE.BoxGeometry(1.05, 0.16, 1.05);
  const pylonRingGeo = new THREE.RingGeometry(0.7, 0.95, 24).rotateX(-HALF_PI);
  const pylonHoloGeo = new THREE.OctahedronGeometry(0.22, 0);
  const pipGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
  const pylonHitGeo = new THREE.CylinderGeometry(1.0, 1.0, 1, 8);

  const pylons = [];       // [sideIdx][slot] → pylon record
  for (let s = 0; s < 2; s++) {
    pylons.push([]);
    for (let i = 0; i < BALANCE.TURRET_SLOT_COUNT; i++) {
      const g = new THREE.Group();
      const column = new THREE.Mesh(pylonColGeo, slabMat);
      column.castShadow = true;
      column.receiveShadow = true;
      g.add(column);
      const cap = new THREE.Mesh(pylonCapGeo, slabMat);
      cap.castShadow = true;
      g.add(cap);
      const ring = new THREE.Mesh(pylonRingGeo, ringMat.clone());
      ring.position.y = 0.04;
      g.add(ring);
      const holo = new THREE.Mesh(pylonHoloGeo, holoMat);
      g.add(holo);
      const pips = [];
      for (let p = 0; p < 6; p++) {
        const pip = new THREE.Mesh(pipGeo, pipOnMat);
        pip.visible = false;
        g.add(pip);
        pips.push(pip);
      }
      const hit = new THREE.Mesh(pylonHitGeo, hitMat);
      hit.userData.slotIndex = i;
      g.add(hit);
      g.visible = false;
      scene.add(g);
      pylons[s].push({ group: g, column, cap, ring, holo, pips, hit });
    }
  }

  // Picking + projection — exposed so index.jsx can make the canvas
  // clickable (open build/manage for the clicked slot) and anchor DOM
  // popovers next to the pylon they belong to.
  const _ray = new THREE.Raycaster();
  const _ndc = new THREE.Vector2();
  function pickPlayerSlot(cssX, cssY) {
    const rect = renderer.domElement.getBoundingClientRect();
    _ndc.set(((cssX - rect.left) / rect.width) * 2 - 1, -((cssY - rect.top) / rect.height) * 2 + 1);
    _ray.setFromCamera(_ndc, camera);
    const hits = _ray.intersectObjects(pylons[0].map((p) => p.hit), false);
    return hits.length ? hits[0].object.userData.slotIndex : null;
  }
  const _proj = new THREE.Vector3();
  function screenPosForSlot(slotIndex) {
    const p = pylons[0][slotIndex];
    if (!p) return null;
    p.cap.getWorldPosition(_proj);
    _proj.project(camera);
    const rect = renderer.domElement.getBoundingClientRect();
    return {
      x: rect.left + (_proj.x + 1) / 2 * rect.width,
      y: rect.top + (1 - _proj.y) / 2 * rect.height,
    };
  }
  if (devHandle) Object.assign(devHandle, { pickPlayerSlot, screenPosForSlot });
  // Active turret meshes — rebuilt when the slot's turret id changes.
  // Each turret's `visual.kind` selects a reference-matched silhouette
  // (see assets/era-siege/turret_spirits.png): crossbow = wooden ballista,
  // cannon = wheeled field gun, bell = fat bronze mortar, tesla = coil
  // stack with charged orb, lance = finned void spike.
  const turretRecs = [[null, null, null], [null, null, null]];
  // Shared dark steel for strings/cables — never disposed per-turret.
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: '#22242a', roughness: 0.9, flatShading: true });
  function buildTurret(t) {
    const g = new THREE.Group();
    const heavy = t.tier === 'heavy';
    const light = t.tier === 'light';
    const kind = t.visual?.kind || 'cannon';
    // Turret base reads as forged/cast metal; barrel as polished steel.
    const baseMat = new THREE.MeshStandardMaterial({ color: t.visual?.baseColor || '#444a52', roughness: 0.6, metalness: 0.55 });
    const barrelMat = new THREE.MeshStandardMaterial({ color: t.visual?.barrelColor || '#8a929c', roughness: 0.4, metalness: 0.82 });
    const mats = [baseMat, barrelMat];
    const M = (geo, mat, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      return m;
    };

    // The recoiling part lives in barrelG; recoil slides it back along
    // local +Z (the rig's fire direction before the facing turn).
    const barrelG = new THREE.Group();
    let muzzleZ = 0.7;

    if (kind === 'crossbow') {
      // Wooden ballista — post, bow arc, bolt rail.
      g.add(M(new THREE.BoxGeometry(0.5, 0.12, 0.5), baseMat, 0, 0.06, 0));
      g.add(M(new THREE.CylinderGeometry(0.06, 0.08, 0.5, 12), baseMat, 0, 0.3, 0));
      barrelG.position.y = 0.58;
      const rail = M(new THREE.BoxGeometry(0.09, 0.07, 1.0), baseMat, 0, 0, 0.1);
      barrelG.add(rail);
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 20, Math.PI), barrelMat);
      arc.rotation.x = HALF_PI;          // bow opens back along the rail
      arc.rotation.z = Math.PI;
      arc.position.z = 0.38;
      arc.castShadow = true;
      barrelG.add(arc);
      barrelG.add(M(new THREE.BoxGeometry(0.014, 0.014, 0.7), darkSteelMat, 0, 0, 0.05));
      const bolt = M(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8).rotateX(HALF_PI), barrelMat, 0, 0.06, 0.2);
      barrelG.add(bolt);
      muzzleZ = 0.65;
    } else if (kind === 'cannon') {
      // Wheeled field cannon — spoked wheels, carriage, raised barrel.
      for (const sx of [-0.3, 0.3]) {
        const wheel = M(new THREE.CylinderGeometry(0.26, 0.26, 0.07, 18).rotateZ(HALF_PI), baseMat, sx, 0.26, 0);
        g.add(wheel);
        const hub = M(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 12).rotateZ(HALF_PI), barrelMat, sx, 0.26, 0);
        g.add(hub);
      }
      g.add(M(new THREE.BoxGeometry(0.4, 0.14, 0.7), baseMat, 0, 0.32, -0.12));
      // Riveted reinforcing band across the carriage.
      for (const rz of [-0.36, -0.12, 0.12]) {
        for (const rx of [-0.16, 0.16]) {
          g.add(M(new THREE.SphereGeometry(0.022, 8, 6), barrelMat, rx, 0.4, rz));
        }
      }
      barrelG.position.y = 0.46;
      barrelG.rotation.x = -0.12;        // slight upward elevation
      const barrel = M(new THREE.CylinderGeometry(0.085, 0.11, 0.95, 14).rotateX(HALF_PI), barrelMat, 0, 0, 0.25);
      barrelG.add(barrel);
      barrelG.add(M(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 14).rotateX(HALF_PI), baseMat, 0, 0, -0.18));
      muzzleZ = 0.78;
    } else if (kind === 'bell') {
      // Bronze mortar — fat short barrel angled high on a ring base.
      g.add(M(new THREE.CylinderGeometry(0.34, 0.4, 0.16, 18), baseMat, 0, 0.08, 0));
      g.add(M(new THREE.BoxGeometry(0.1, 0.3, 0.46), baseMat, -0.24, 0.3, 0));
      g.add(M(new THREE.BoxGeometry(0.1, 0.3, 0.46), baseMat, 0.24, 0.3, 0));
      barrelG.position.y = 0.42;
      barrelG.rotation.x = -0.7;         // mortars throw high
      const tube = M(new THREE.CylinderGeometry(0.2, 0.26, 0.55, 18).rotateX(HALF_PI), barrelMat, 0, 0, 0.16);
      barrelG.add(tube);
      const lip = M(new THREE.CylinderGeometry(0.24, 0.22, 0.08, 18).rotateX(HALF_PI), baseMat, 0, 0, 0.42);
      barrelG.add(lip);
      muzzleZ = 0.5;
    } else if (kind === 'tesla') {
      // Tesla coil — shrinking disc stack with a charged orb on top.
      const orbMat = new THREE.MeshStandardMaterial({
        color: '#0a2030', emissive: t.visual?.barrelColor || '#7be3ff',
        emissiveIntensity: 1.8, roughness: 0.4,
      });
      mats.push(orbMat);
      g.add(M(new THREE.CylinderGeometry(0.36, 0.42, 0.14, 18), baseMat, 0, 0.07, 0));
      for (let i = 0; i < 3; i++) {
        g.add(M(new THREE.CylinderGeometry(0.26 - i * 0.06, 0.3 - i * 0.06, 0.1, 18), i % 2 ? barrelMat : baseMat, 0, 0.24 + i * 0.14, 0));
      }
      barrelG.position.y = 0.78;
      const orb = M(new THREE.SphereGeometry(0.16, 18, 12), orbMat, 0, 0, 0);
      barrelG.add(orb);
      barrelG.add(M(new THREE.TorusGeometry(0.22, 0.02, 8, 24), orbMat, 0, 0, 0));
      muzzleZ = 0.25;
    } else if (kind === 'lance') {
      // Void lance — horizontal finned spike with an emissive core seam.
      const coreMat = new THREE.MeshStandardMaterial({
        color: '#1a0c30', emissive: t.visual?.barrelColor || '#c89bff',
        emissiveIntensity: 2.0, flatShading: true,
      });
      mats.push(coreMat);
      g.add(M(new THREE.OctahedronGeometry(0.26, 0), baseMat, 0, 0.3, 0));
      g.add(M(new THREE.CylinderGeometry(0.1, 0.16, 0.2, 12), baseMat, 0, 0.1, 0));
      barrelG.position.y = 0.52;
      const shaft = M(new THREE.CylinderGeometry(0.07, 0.05, 0.9, 12).rotateX(HALF_PI), barrelMat, 0, 0, 0.15);
      barrelG.add(shaft);
      const tip = M(new THREE.ConeGeometry(0.09, 0.34, 12).rotateX(HALF_PI), coreMat, 0, 0, 0.75);
      barrelG.add(tip);
      for (const a of [0.8, -0.8]) {
        const fin = M(new THREE.BoxGeometry(0.04, 0.22, 0.3), coreMat, 0, 0, -0.2);
        fin.rotation.z = a;
        barrelG.add(fin);
      }
      muzzleZ = 0.95;
    }

    // Tier read: light is slighter, heavy is beefier.
    const tierK = light ? 0.82 : heavy ? 1.18 : 1;
    g.scale.setScalar(TURRET_SCALE * tierK);

    const muzzle = new THREE.Mesh(GEO.muzzle, muzzleMat.clone());
    muzzle.position.set(0, 0, muzzleZ);
    barrelG.add(muzzle);
    g.add(barrelG);
    scene.add(g);
    return { group: g, barrelG, muzzle, mats };
  }
  function disposeTurret(rec) {
    scene.remove(rec.group);
    // Per-kind turrets create their own geometries — walk and free them
    // (GEO.muzzle is shared; guard it).
    rec.group.traverse((o) => {
      if (o.isMesh && o.geometry !== GEO.muzzle) o.geometry.dispose?.();
    });
    for (const m of rec.mats) m.dispose();
    rec.muzzle.material.dispose();
  }

  // ── Unit rigs — pooled procedural figures ─────────────────────────
  // Rigs are cached by team|era|role|champion and recycled as units
  // churn. Each rig clones a small set of materials so death fade and
  // per-unit colors never bleed across the pool.
  const rigPools = new Map();    // variantKey → rig[]
  const rigsById = new Map();    // unit id → rig
  const hpBgMat = new THREE.SpriteMaterial({ color: '#0a0d12', depthTest: false });

  // A blob-shadow material is shared across all rigs (cloned per rig only
  // so the death fade can drop its opacity independently).
  const blobShadowMat = new THREE.MeshBasicMaterial({
    color: '#000', transparent: true, opacity: 0.34, depthWrite: false,
  });

  // ── Per-era / per-role design table ───────────────────────────────
  // Colours + material recipe matched to the 2D unit art (read off the
  // PNGs in public/games/era-siege/unit). Each era contributes a skin /
  // primary armour / secondary trim / metal accent palette; the rig
  // builder mixes these with the team banner colour for the tabard.
  //   era0 Ember Tribe   — bare dark skin, tan loincloth, red warpaint
  //   era1 Iron Dominion — steel plate knight, dark undersuit, red cape
  //   era2 Sun Foundry   — bronze/brass mech-armour, gold sheen
  //   era3 Storm Republic— navy tactical armour, teal glass visor
  //   era4 Void Ascended — purple crystal wraith, magenta glow, no skin
  const ERA_DESIGN = [
    { skin: '#9a5a36', cloth: '#7c5a36', trim: '#caa070', metal: '#8a7a55',
      paint: '#b53024', skinMetal: 0.0, skinRough: 0.85,
      clothMetal: 0.0, clothRough: 0.95, metalMetal: 0.1, metalRough: 0.7 },
    { skin: '#c8a888', cloth: '#3a3e46', trim: '#9aa4b0', metal: '#c2ccd6',
      paint: '#9a2630', skinMetal: 0.0, skinRough: 0.7,
      clothMetal: 0.1, clothRough: 0.8, metalMetal: 0.78, metalRough: 0.32 },
    { skin: '#b58a52', cloth: '#7a5a28', trim: '#caa24a', metal: '#d8a850',
      paint: '#7a4a18', skinMetal: 0.2, skinRough: 0.6,
      clothMetal: 0.45, clothRough: 0.55, metalMetal: 0.85, metalRough: 0.3 },
    { skin: '#cdbfae', cloth: '#1e2c42', trim: '#3a5670', metal: '#aeb8c4',
      paint: '#5be3ff', skinMetal: 0.1, skinRough: 0.6,
      clothMetal: 0.2, clothRough: 0.7, metalMetal: 0.7, metalRough: 0.4 },
    { skin: '#7a3aa0', cloth: '#3a1060', trim: '#7a2eb0', metal: '#9a4ad0',
      paint: '#d070ff', skinMetal: 0.3, skinRough: 0.5,
      clothMetal: 0.4, clothRough: 0.5, metalMetal: 0.6, metalRough: 0.4 },
  ];

  // Standing rig height (origin at feet). Tuned to the old sprite size so
  // lane framing / spacing read the same as before.
  const RIG_H = UNIT_SCALE * 1.05;

  // Skin material doubles as the void wraith's emissive crystal shell.
  function makeStd(color, metalness, roughness, emissive, emInt) {
    return new THREE.MeshStandardMaterial({
      color, metalness, roughness, flatShading: false,
      emissive: emissive || '#000', emissiveIntensity: emInt || 0,
    });
  }

  // Add a mesh to a parent at a local position, casting shadow.
  function part(parent, geo, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  function buildRig(u, key) {
    const role = u.role;
    const isGeneral = role === 'general';
    const isHeavy = role === 'heavy';
    const isRanged = role === 'ranged';
    const eraIdx = Math.max(0, Math.min(4, u.eraIndex || 0));
    const D = ERA_DESIGN[eraIdx];
    const pal = paletteFor(getEraByIndex(eraIdx)?.id);
    const floats = eraIdx === 4;

    // ── Cloned materials (so hurt-flash / death-fade never leak in the
    //    pool). All rig materials live in `mats` for fade + dispose. ──
    const emInt = floats ? 0.9 : 0;
    const skinMat  = makeStd(D.skin,  D.skinMetal,  D.skinRough,  floats ? D.skin : null, emInt);
    const clothMat = makeStd(D.cloth, D.clothMetal, D.clothRough);
    const trimMat  = makeStd(D.trim,  D.metalMetal * 0.6, D.metalRough);
    const metalMat = makeStd(D.metal, D.metalMetal, D.metalRough, floats ? D.metal : null, floats ? 0.5 : 0);
    // Team tabard — banner colour for the side, matte cloth.
    const bannerHex = u.team === 'player' ? (pal.banner || '#cf5a3a') : (pal.bannerEnemy || '#3a6acf');
    const tabardMat = makeStd(bannerHex, 0, 0.9);
    // Weapon accent (glow on energy weapons, dark steel otherwise).
    const accentHex = pal.hudAccent || D.paint;
    const woodMat   = makeStd('#5a3c22', 0, 0.85);
    const steelMat  = makeStd('#cdd4dc', 0.85, 0.3);
    const glowMat   = new THREE.MeshStandardMaterial({
      color: '#1a0c30', emissive: accentHex, emissiveIntensity: 1.8, roughness: 0.4,
    });
    const mats = [skinMat, clothMat, trimMat, metalMat, tabardMat, woodMat, steelMat, glowMat];
    // Snapshot pristine colours for the hurt-flash restore.
    const baseColors = mats.map((m) => m.color.clone());

    const g = new THREE.Group();

    // Sizing. champion scales the whole rig; heavy/general read bigger.
    const roleK = isGeneral ? 1.18 : isHeavy ? 1.14 : 1.0;
    const champK = u.isChampion ? 1.3 : 1;
    const root = new THREE.Group();          // the articulated figure
    root.scale.setScalar(RIG_H * roleK * champK * 0.5);
    g.add(root);

    // Heights are in "rig units". HIP_Y is ROOT-local (the torso group sits
    // there ~0.96). SHO_Y and the chest/waist/head offsets below are
    // TORSO-local — they add to the torso origin. The shoulders are pulled
    // DOWN to sit on top of the chest mesh: the old rig floated them ~0.5
    // above the chest (root ~2.38), leaving a hollow gap under the arms and a
    // tiny head riding high. Now shoulders land at the chest top (root ~1.78)
    // so the torso reads as one solid tapered mass with a proportional head.
    const HIP_Y = 0.92, beefy = isHeavy || isGeneral;
    const SHO_Y = 0.8;            // torso-local → root ~1.76

    // ── Pelvis + tapered torso spine ──
    // pelvis (small) → waist (taper) → chest (broad). Era1 skin shows the
    // bare torso; armoured eras plate the chest.
    const pelvisGeo = beefy ? GEO.pelvisHeavy : GEO.pelvis;
    const chestGeo  = beefy ? GEO.chestHeavy : GEO.chest;
    const waistGeo  = beefy ? GEO.waistHeavy : GEO.waist;
    // Bare-chested eras (tribal) show skin on torso; armoured eras use metal.
    const torsoMat = eraIdx === 0 ? skinMat : metalMat;
    const pelvis = part(root, pelvisGeo, eraIdx === 0 ? skinMat : clothMat, 0, HIP_Y, 0);
    // Torso group bobs/leans as one.
    const torso = new THREE.Group();
    torso.position.set(0, HIP_Y + 0.04, 0);
    root.add(torso);
    // Waist sits just above the hips and tapers in; the tall chest rises
    // from the waist up to the shoulder line so the torso is one solid mass.
    part(torso, waistGeo, eraIdx === 0 ? skinMat : clothMat, 0, 0.1, 0);
    const chest = part(torso, chestGeo, torsoMat, 0, 0.54, 0);
    part(torso, GEO.belt, trimMat, 0, -0.02, 0);

    // Small hip cloth hanging from the waist (front of the hips only) — the
    // loincloth, deliberately narrow so it never dominates the silhouette.
    if (!floats) {
      const loinGeo = beefy ? GEO.loinclothHeavy : GEO.loincloth;
      const loin = part(torso, loinGeo, clothMat, 0, 0.0, beefy ? 0.16 : 0.12);
      void loin;
    }

    // Tabard / cape hanging from the chest (banner colour). Void uses a
    // tattered robe skirt instead of a cape. Tabard is a slim banner strip
    // down the chest, not a body-covering slab.
    if (floats) {
      const robe = part(torso, GEO.robeSkirt, clothMat, 0, -0.16, 0);
      robe.material = clothMat;
    } else if (eraIdx !== 0) {
      // Tribal warriors are bare-chested (no tabard); armoured eras wear it.
      const tab = part(torso, GEO.tabard, tabardMat, 0, 0.34, beefy ? 0.22 : 0.16);
      void tab;
      if (beefy || isGeneral) {
        // Cape down the back (knights / generals / foundry).
        const cape = part(torso, GEO.cape, tabardMat, 0, 0.05, -0.2);
        cape.material = isGeneral || eraIdx === 1 ? makeStd(D.paint, 0, 0.9) : tabardMat;
        if (cape.material !== tabardMat) mats.push(cape.material), baseColors.push(cape.material.color.clone());
        cape.rotation.x = 0.18;
        g.userData.cape = cape;
      }
    }

    // Era4 long coat skirt (captain/trooper longcoat read).
    if (eraIdx === 3) part(torso, GEO.coatSkirt, clothMat, 0, -0.18, 0);

    // ── Neck + head + headgear ──
    const headG = new THREE.Group();
    headG.position.set(0, SHO_Y + 0.18, 0);
    torso.add(headG);
    part(headG, GEO.neck, skinMat, 0, -0.1, 0);
    const head = part(headG, GEO.head, skinMat, 0, 0.06, 0);
    void head;
    addHeadgear(headG, eraIdx, role, { skinMat, clothMat, trimMat, metalMat, glowMat, steelMat, paint: D.paint }, mats, baseColors);

    // ── Legs — hip group (swings) → calf sub-group (knee) → boot ──
    function makeLeg(side) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.13, HIP_Y - 0.02, 0);
      root.add(hip);
      part(hip, GEO.thigh, floats ? clothMat : skinMatLeg());
      const knee = new THREE.Group();
      knee.position.set(0, -0.36, 0);
      hip.add(knee);
      part(knee, GEO.calf, floats ? clothMat : skinMatLeg());
      if (!floats) part(knee, GEO.boot, eraIdx >= 1 ? metalMat : skinMat);
      return { hip, knee };
    }
    // Era1 bare legs use skin; armoured eras wrap the calf in cloth/metal.
    function skinMatLeg() { return eraIdx === 0 ? skinMat : (eraIdx === 3 ? clothMat : metalMat); }
    const legL = makeLeg(-1);
    const legR = makeLeg(1);

    // ── Arms — shoulder group (swings) → forearm sub-group (elbow) ──
    // Shoulder X sits just outside the chest half-width so the arms hang
    // clearly alongside the torso (wider for the broad beefy chest).
    const shoX = beefy ? 0.4 : 0.32;
    function makeArm(side) {
      const sho = new THREE.Group();
      sho.position.set(side * shoX, SHO_Y, 0);
      torso.add(sho);
      // Pauldron / shoulder cap on armoured eras.
      if (eraIdx >= 1) part(sho, GEO.shoulderCap, metalMat, side * 0.04, 0.02, 0);
      part(sho, GEO.upperArm, eraIdx === 0 ? skinMat : (eraIdx === 3 ? clothMat : metalMat));
      const elbow = new THREE.Group();
      elbow.position.set(0, -0.3, 0);
      sho.add(elbow);
      part(elbow, GEO.forearm, eraIdx === 0 ? skinMat : (eraIdx === 3 ? clothMat : metalMat));
      // A hand anchor at the wrist for the weapon.
      const hand = new THREE.Group();
      hand.position.set(0, -0.28, 0);
      elbow.add(hand);
      return { sho, elbow, hand };
    }
    const armL = makeArm(-1);
    const armR = makeArm(1);

    // ── Weapon + shield, built into the hands per role/era ──
    const weaponMats = { skinMat, clothMat, trimMat, metalMat, woodMat, steelMat, glowMat, tabardMat, paint: D.paint };
    const wpn = addWeapon(armR.hand, armL.hand, eraIdx, role, weaponMats, mats, baseColors);

    // ── Ground blob shadow + aura ring + HP bar (unchanged contract) ──
    const shadowMat = blobShadowMat.clone();
    const shadow = new THREE.Mesh(GEO.unitShadow, shadowMat);
    shadow.scale.setScalar(0.5 * roleK * champK + 0.35);
    shadow.position.y = 0.03;
    g.add(shadow);

    const auraMat = new THREE.MeshBasicMaterial({
      color: pal.hudAccent || '#5dd6ff', transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const aura = new THREE.Mesh(GEO.auraRing, auraMat);
    aura.position.y = 0.04;
    aura.scale.setScalar(champK);
    aura.visible = false;
    g.add(aura);

    const topY = RIG_H * roleK * champK + 0.25;
    const hpBg = new THREE.Sprite(hpBgMat);
    hpBg.scale.set(0.96, 0.1, 1);
    hpBg.position.y = topY;
    hpBg.visible = false;
    g.add(hpBg);
    const hpFillMat = new THREE.SpriteMaterial({ color: '#35f0c9', depthTest: false });
    const hpFill = new THREE.Sprite(hpFillMat);
    hpFill.scale.set(0.9, 0.07, 1);
    hpFill.position.y = topY;
    hpFill.visible = false;
    g.add(hpFill);

    // Opacity-faded on death: every rig material + shadow + aura.
    const fadeMats = mats.concat([shadowMat, auraMat]);

    scene.add(g);
    return {
      key, group: g, root, torso,
      legL, legR, armL, armR, wpn,
      mats, baseColors, fadeMats,
      skinMat, shadow, shadowMat, aura, hpBg, hpFill, hpFillMat,
      isRanged, isHeavy, isGeneral, floats, champK,
      fading: false, hurtUntil: 0, lastHp: null,
    };
  }

  // ── Headgear builder ──────────────────────────────────────────────
  // era0 tribal hair + warpaint (none/hair), era1 knight helm + visor,
  // era2 heavy foundry helm + horns, era3 tactical helmet + glass visor,
  // era4 void hood + crystal crown. General eras get a crest/plume.
  function addHeadgear(headG, eraIdx, role, M, mats, baseColors) {
    const isGeneral = role === 'general';
    if (eraIdx === 0) {
      // Tribal: matted hair cap + leather brow headband + (general) feathers.
      part(headG, GEO.hair, makeStd('#2a1c12', 0, 0.95), 0, 0.14, 0);
      const hairM = headG.children[headG.children.length - 1].material;
      mats.push(hairM); baseColors.push(hairM.color.clone());
      // Leather headband across the brow (matches the sprite's tied band).
      const band = part(headG, GEO.helmRidge, makeStd('#6a4326', 0, 0.9), 0, 0.05, 0.0);
      band.scale.set(6.4, 0.55, 1.06);          // thin wide band wrapping the head
      mats.push(band.material); baseColors.push(band.material.color.clone());
      if (isGeneral) {
        for (let i = 0; i < 5; i++) {
          const f = part(headG, GEO.feather, M.clothMat, (i - 2) * 0.07, 0.18, -0.14);
          f.rotation.x = -0.5; f.rotation.z = (i - 2) * 0.12;
        }
      }
    } else if (eraIdx === 1) {
      // Knight helm + brow ridge + dark eye visor.
      part(headG, GEO.helm, M.metalMat, 0, 0.16, 0);
      part(headG, GEO.helmRidge, M.metalMat, 0, 0.2, 0);
      part(headG, GEO.visor, makeStd('#15171c', 0.3, 0.5), 0, 0.05, 0.14);
      const vM = headG.children[headG.children.length - 1].material;
      mats.push(vM); baseColors.push(vM.color.clone());
      if (isGeneral) { const c = part(headG, GEO.feather, makeStd(M.paint, 0, 0.9), 0, 0.26, -0.04); c.rotation.x = -0.2; mats.push(c.material); baseColors.push(c.material.color.clone()); }
    } else if (eraIdx === 2) {
      // Foundry: heavy domed bronze helm with side horns/pipes.
      part(headG, GEO.helm, M.metalMat, 0, 0.17, 0);
      part(headG, GEO.head, M.metalMat, 0, 0.06, 0);   // full face mask
      for (const s of [-1, 1]) { const h = part(headG, GEO.horn, M.trimMat, s * 0.13, 0.24, 0); h.rotation.z = s * 0.5; }
      part(headG, GEO.visor, M.glowMat, 0, 0.05, 0.14);
    } else if (eraIdx === 3) {
      // Storm trooper: rounded tactical helmet + wide glowing glass visor.
      part(headG, GEO.helm, makeStd('#1a2740', 0.4, 0.5), 0, 0.16, 0);
      const hM = headG.children[headG.children.length - 1].material;
      mats.push(hM); baseColors.push(hM.color.clone());
      part(headG, GEO.head, makeStd('#1a2740', 0.4, 0.5), 0, 0.06, 0);
      const h2 = headG.children[headG.children.length - 1].material; mats.push(h2); baseColors.push(h2.color.clone());
      part(headG, GEO.visor, M.glowMat, 0, 0.06, 0.14);
      if (isGeneral) addTricorn(headG, M, mats, baseColors);
    } else {
      // Void: pointed hood, glowing crystal shards crowning the head.
      const hood = part(headG, GEO.hood, M.clothMat, 0, 0.18, -0.02);
      hood.rotation.x = -0.1;
      for (let i = 0; i < 4; i++) {
        const s = part(headG, GEO.voidShard, M.glowMat, (i - 1.5) * 0.07, 0.22, 0);
        s.rotation.set(0.4, i, 0.3);
      }
      // Glowing eye slit.
      part(headG, GEO.visor, M.glowMat, 0, 0.04, 0.12);
    }
  }
  function addTricorn(headG, M, mats, baseColors) {
    const crownMat = makeStd('#15203a', 0.3, 0.6);
    part(headG, GEO.tricornCrown, crownMat, 0, 0.18, 0);
    const brim = part(headG, GEO.tricorn, crownMat, 0, 0.14, 0);
    brim.rotation.y = Math.PI / 2;
    const f = part(headG, GEO.feather, makeStd(M.glowMat.emissive.getHexString(), 0, 0.8), -0.1, 0.24, -0.06);
    f.rotation.z = 0.5;
    mats.push(crownMat, f.material); baseColors.push(crownMat.color.clone(), f.material.color.clone());
  }

  // ── Weapon builder ────────────────────────────────────────────────
  // Returns { rightSwing, mainHand, isMelee } so animateRig knows whether
  // to play a melee swing (club/spear/sword/saber) or a ranged draw
  // (bow / gun aim). The weapon lives in the right hand; shields / off-hand
  // gear go in the left.
  function addWeapon(rHand, lHand, eraIdx, role, M, mats, baseColors) {
    const isHeavy = role === 'heavy';
    const isRanged = role === 'ranged';
    const isGeneral = role === 'general';
    let isMelee = true;
    if (eraIdx === 0) {
      // Ember Tribe — wooden club + torch (frontline/heavy), bow (ranged).
      if (isRanged) {
        const bow = part(lHand, GEO.bowArc, M.woodMat, 0, 0, 0);
        bow.rotation.z = HALF_PI;
        part(lHand, GEO.bowString, M.steelMat, 0, 0, 0);
        part(rHand, GEO.arrowNock, M.woodMat, 0, 0, 0);
        isMelee = false;
      } else if (isHeavy) {
        part(rHand, GEO.hammerHaft, M.woodMat, 0, 0, 0);
        part(rHand, GEO.clubHead, makeFireMat(M), 0, 1.0, 0);
        const fm = rHand.children[rHand.children.length - 1].material; mats.push(fm); baseColors.push(fm.color.clone());
      } else {
        part(rHand, GEO.club, M.woodMat, 0, 0, 0);
        part(rHand, GEO.clubHead, makeFireMat(M), 0, 0.6, 0);
        const fm = rHand.children[rHand.children.length - 1].material; mats.push(fm); baseColors.push(fm.color.clone());
      }
    } else if (eraIdx === 1) {
      // Iron Dominion — spear + tower shield (frontline), war-hammer
      // (heavy), bow (ranged), great-sword (general).
      if (isRanged) {
        const bow = part(lHand, GEO.bowArc, M.steelMat, 0, 0, 0);
        bow.rotation.z = HALF_PI;
        part(lHand, GEO.bowString, M.steelMat, 0, 0, 0);
        part(rHand, GEO.arrowNock, M.steelMat, 0, 0, 0);
        isMelee = false;
      } else if (isHeavy) {
        part(rHand, GEO.hammerHaft, M.steelMat, 0, 0, 0);
        part(rHand, GEO.hammerHead, M.metalMat, 0, 0, 0);
      } else if (isGeneral) {
        part(rHand, GEO.swordGrip, M.steelMat, 0, 0, 0);
        part(rHand, GEO.swordGuard, M.metalMat, 0, 0, 0);
        part(rHand, GEO.swordBlade, M.steelMat, 0, 0, 0);
        part(rHand, GEO.swordPommel, M.metalMat, 0, 0, 0);
      } else {
        part(rHand, GEO.spear, M.steelMat, 0, 0, 0);
        part(rHand, GEO.spearTip, M.metalMat, 0, 0, 0);
        const sh = part(lHand, GEO.towerShield, M.metalMat, 0, -0.1, 0.08);
        sh.rotation.y = HALF_PI;
        part(lHand, GEO.shieldBoss, M.trimMat, 0, -0.1, 0.12);
      }
    } else if (eraIdx === 2) {
      // Sun Foundry — heavy gun / cannon arm for all; general adds pistol.
      const gunBody = M.metalMat;
      part(rHand, GEO.gunBody, gunBody, 0, 0, 0);
      part(rHand, GEO.gunBarrel, M.steelMat, 0, 0, 0);
      part(rHand, GEO.gunMag, M.trimMat, 0, 0, 0);
      part(lHand, GEO.swordGrip, gunBody, 0, 0, 0);       // fore-grip
      isMelee = false;
    } else if (eraIdx === 3) {
      // Storm Republic — tactical rifle for trooper/heavy/ranged; the
      // captain (general) carries a pistol + a glowing energy saber.
      if (isGeneral) {
        part(rHand, GEO.swordGrip, M.steelMat, 0, 0, 0);
        part(rHand, GEO.saberBlade, M.glowMat, 0, 0, 0);
        const sm = rHand.children[rHand.children.length - 1].material; mats.push(sm); baseColors.push(sm.color.clone());
        part(lHand, GEO.pistol, M.metalMat, 0, 0, 0);
        isMelee = false;
      } else {
        part(rHand, GEO.gunBody, makeStd('#2a3550', 0.5, 0.4), 0, 0, 0);
        const gm = rHand.children[rHand.children.length - 1].material; mats.push(gm); baseColors.push(gm.color.clone());
        part(rHand, GEO.gunBarrel, M.steelMat, 0, 0, 0);
        part(rHand, GEO.gunMag, M.glowMat, 0, 0, 0);
        part(lHand, GEO.swordGrip, M.steelMat, 0, 0, 0);  // fore-grip
        isMelee = false;
      }
    } else {
      // Void Ascendancy — staff/scythe of pure energy. Ranged channels an
      // orb; general wields a long void-blade.
      if (isGeneral || isRanged) {
        part(rHand, GEO.voidStaff, M.clothMat, 0, 0, 0);
        part(rHand, GEO.voidBlade, M.glowMat, 0, 0.4, 0);
        isMelee = isGeneral;
      } else {
        part(rHand, GEO.voidStaff, M.clothMat, 0, 0, 0);
        part(rHand, GEO.shard, M.glowMat, 0, 0.7, 0);
      }
    }
    return { isMelee };
  }
  function makeFireMat(M) {
    return new THREE.MeshStandardMaterial({
      color: '#ff7a26', emissive: '#ff5a14', emissiveIntensity: 1.6, roughness: 0.6,
    });
  }

  function acquireRig(u) {
    const key = `${u.team}|${u.eraIndex || 0}|${u.role}|${u.isChampion ? 1 : 0}`;
    let pool = rigPools.get(key);
    if (!pool) { pool = []; rigPools.set(key, pool); }
    const rig = pool.pop() || buildRig(u, key);
    rig.group.visible = true;
    return rig;
  }

  function releaseRig(rig) {
    rig.group.visible = false;
    // Reset death fade so the next occupant spawns solid. Rig materials
    // are opaque by default — only restore the alpha-blended shadow/aura
    // opacity and clear the transparent flag the fade set on the rest.
    if (rig.fading) {
      for (const m of rig.fadeMats) { m.opacity = 1; m.transparent = false; }
      rig.shadowMat.opacity = 0.34; rig.shadowMat.transparent = true;
      rig.aura.material.opacity = 0.5; rig.aura.material.transparent = true;
      rig.fading = false;
    }
    // Restore pristine colours (hurt-flash tint) + neutral pose.
    for (let i = 0; i < rig.mats.length; i++) rig.mats[i].color.copy(rig.baseColors[i]);
    rig.hurtUntil = 0;
    rig.lastHp = null;
    rig.group.rotation.set(0, 0, 0);
    rig.group.position.y = 0;
    rig.root.position.y = 0;
    rig.root.rotation.y = 0;
    rigPools.get(rig.key).push(rig);
  }

  const _seenIds = new Set();

  function animateRig(rig, u, wx, wz, sideAura, tSec, cbSafe) {
    const g = rig.group;
    g.position.x = wx;
    g.position.z = wz;

    // Face the advance direction. The figure models facing +X; turn the
    // root 180° on facing < 0 so the two armies march into each other.
    rig.root.rotation.y = u.facing < 0 ? Math.PI : 0;

    const torso = rig.torso;
    const { legL, legR, armL, armR } = rig;

    // ── WALK CYCLE ──
    // Driven by the sim's walkPhaseMs, which advances only while the unit
    // is actually moving (sim/unit.js increments it in the move branch).
    // phase → radians; legs swing in opposition, arms counter-swing, with
    // a torso bob + a slight forward lean into the facing direction.
    const moving = !u.dead && u.attackTickPhase === 'idle';
    const phase = (u.walkPhaseMs || 0) * 0.012;   // ms → rad
    const swing = moving ? 1 : 0.12;              // near-still idle sway
    const s = Math.sin(phase) * swing;
    const c = Math.cos(phase) * swing;

    // Hips swing fore/aft; knees bend on the back-swing so the calf lifts.
    legL.hip.rotation.x = s * 0.85;
    legR.hip.rotation.x = -s * 0.85;
    legL.knee.rotation.x = Math.max(0, -s) * 1.1;
    legR.knee.rotation.x = Math.max(0, s) * 1.1;
    // Arms counter-swing (right arm with left leg). Ranged/gun poses hold
    // the weapon arm forward instead of swinging it.
    const armSwing = rig.isRanged ? 0.25 : 0.7;
    armL.sho.rotation.x = -s * armSwing;
    armR.sho.rotation.x = (rig.wpn.isMelee ? s : -0.9) * armSwing - (rig.wpn.isMelee ? 0 : 0.5);
    armL.elbow.rotation.x = -0.2 + Math.max(0, c) * 0.3;
    armR.elbow.rotation.x = rig.wpn.isMelee ? -0.2 - Math.max(0, -c) * 0.3 : -0.9;

    // Torso bob + forward lean while advancing.
    const bob = Math.abs(Math.sin(phase)) * (moving ? 0.05 : 0.01);
    torso.position.y = (0.92 + 0.06) + bob;
    torso.rotation.x = moving ? 0.12 : 0.04;
    torso.rotation.z = c * 0.05;

    // Vertical: a half-stride bob lifts the whole figure slightly; void
    // wraiths hover with a slow float instead (no marching feet).
    let rootY = moving ? bob * 0.5 : 0;
    if (rig.floats) rootY = 0.28 + Math.sin(tSec * 2.4 + wx * 0.6) * 0.08;
    rig.root.position.y = rootY;

    // ── ATTACK ── melee swing (arm overhead → strike) or ranged draw,
    // driven by the sim's windup/recover timers, with a body lunge.
    let lunge = 0;
    if (u.attackTickPhase === 'windup') {
      const t = u.attackWindupMs ? 1 - Math.max(0, u.attackTimerMs / u.attackWindupMs) : 0;
      lunge = -u.facing * 0.18 * t;              // coil back
      if (rig.wpn.isMelee) {
        armR.sho.rotation.x = -1.6 * t;          // raise weapon up + back
        armR.elbow.rotation.x = -0.4 * t;
        torso.rotation.x = 0.12 - 0.25 * t;      // lean back
      } else {
        armR.sho.rotation.x = -1.3 - 0.1 * t;    // steady the aim
        torso.rotation.x = 0.1;
      }
    } else if (u.attackTickPhase === 'recover') {
      const t = u.attackRecoverMs ? 1 - Math.max(0, u.attackTimerMs / u.attackRecoverMs) : 0;
      lunge = u.facing * 0.34 * (1 - t);         // lunge into the hit
      if (rig.wpn.isMelee) {
        const strike = Math.min(1, t * 2.4);     // fast down-swing, slow settle
        armR.sho.rotation.x = THREE.MathUtils.lerp(-1.6, 1.0, strike);
        armR.elbow.rotation.x = -0.2 - 0.4 * (1 - strike);
        torso.rotation.x = THREE.MathUtils.lerp(-0.13, 0.22, strike);
      } else {
        const k = 1 - Math.min(1, t * 3);        // recoil kick on the gun arm
        armR.sho.rotation.x = -1.3 + k * 0.4;
        torso.rotation.x = 0.1 + k * 0.08;
      }
    }
    g.position.x = wx + lunge;

    // ── HURT FLASH ── derive a hit from an HP drop between frames; flash
    // every rig material toward white briefly.
    if (rig.lastHp == null) rig.lastHp = u.hp;
    if (!u.dead && u.hp < rig.lastHp - 0.001) rig.hurtUntil = tSec + 0.12;
    rig.lastHp = u.hp;
    if (!u.dead && tSec < rig.hurtUntil) {
      const f = (rig.hurtUntil - tSec) / 0.12;   // 1 → 0
      for (let i = 0; i < rig.mats.length; i++) {
        rig.mats[i].color.copy(rig.baseColors[i]).lerp(_colA.set('#ffffff'), 0.75 * f);
      }
    } else if (rig.hurtUntil) {
      for (let i = 0; i < rig.mats.length; i++) rig.mats[i].color.copy(rig.baseColors[i]);
      rig.hurtUntil = 0;
    }

    // ── DEATH ── topple toward the push direction, sink, fade out.
    if (u.dead) {
      const t = Math.min(1, (u.deathAgeMs || 0) / DEATH_ANIM_MS);
      g.rotation.z = -u.facing * t * 1.4;
      g.position.y = -t * 0.5;
      if (!rig.fading) {
        rig.fading = true;
        for (const m of rig.fadeMats) m.transparent = true;
      }
      const op = 1 - t;
      for (const m of rig.fadeMats) m.opacity = op * (m === rig.shadowMat ? 0.34 : 1);
      rig.hpBg.visible = false;
      rig.hpFill.visible = false;
      rig.aura.visible = false;
      return;
    }
    g.rotation.z = 0;

    // Aura ring pulse (champion glow or active side buff).
    const wantAura = !!sideAura || u.isChampion;
    rig.aura.visible = wantAura;
    if (wantAura) rig.aura.material.opacity = 0.3 + 0.25 * (Math.sin(tSec * 5) * 0.5 + 0.5);

    // HP bar — only when damaged.
    const hpR = u.hp / u.maxHp;
    const damaged = hpR < 0.999;
    rig.hpBg.visible = damaged;
    rig.hpFill.visible = damaged;
    if (damaged) {
      const r = Math.max(0.02, hpR);
      rig.hpFill.scale.x = 0.9 * r;
      rig.hpFill.center.set(0.5 / r, 0.5);
      rig.hpBg.center.set(0.5, 0.5);
      hpBarColor(rig.hpFillMat.color, hpR, cbSafe);
    }
  }

  // ── Projectiles — sequential pool of head + trail pairs ───────────
  const PROJ_POOL = 96;
  const projPool = [];
  for (let i = 0; i < PROJ_POOL; i++) {
    const headMat = new THREE.MeshBasicMaterial({ color: '#fff' });
    const head = new THREE.Mesh(GEO.projHead, headMat);
    const trailMat = new THREE.MeshBasicMaterial({
      color: '#fff', transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const trail = new THREE.Mesh(GEO.projTrail, trailMat);
    head.visible = false;
    trail.visible = false;
    scene.add(head);
    scene.add(trail);
    projPool.push({ head, trail, headMat, trailMat });
  }

  // ── Particles — one additive Points pool driven by sim state ──────
  const PT_CAP = 160;
  const ptGeo = new THREE.BufferGeometry();
  const ptPos = new Float32Array(PT_CAP * 3);
  const ptCol = new Float32Array(PT_CAP * 3);
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
  ptGeo.setAttribute('color', new THREE.BufferAttribute(ptCol, 3));
  const ptMat = new THREE.PointsMaterial({
    size: 0.16, sizeAttenuation: true, vertexColors: true,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const points = new THREE.Points(ptGeo, ptMat);
  points.frustumCulled = false;
  scene.add(points);
  // Hex-string → rgb cache so particle color parsing never reallocates.
  const colorCache = new Map();
  function cachedColor(str) {
    let c = colorCache.get(str);
    if (!c) { c = new THREE.Color(str); colorCache.set(str, c); }
    return c;
  }

  // ── Ambient era motes — Grudgewood-style additive point field ─────
  const MOTE_CAP = 64;
  const moteGeo = new THREE.BufferGeometry();
  const motePos = new Float32Array(MOTE_CAP * 3);
  const moteSeed = new Float32Array(MOTE_CAP * 2);
  for (let i = 0; i < MOTE_CAP; i++) {
    motePos[i * 3] = (Math.random() - 0.5) * 56;
    motePos[i * 3 + 1] = Math.random() * 9 + 0.4;
    motePos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    moteSeed[i * 2] = Math.random() * Math.PI * 2;
    moteSeed[i * 2 + 1] = 0.5 + Math.random() * 0.8;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const moteMat = new THREE.PointsMaterial({
    color: ERA_LOOKS[0].mote.color, size: 0.14, sizeAttenuation: true,
    transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  scene.add(motes);

  function tickMotes(dt, cfg, tSec) {
    const arr = moteGeo.attributes.position.array;
    const n = Math.min(cfg.count, MOTE_CAP);
    moteGeo.setDrawRange(0, n);
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      const ph = moteSeed[i * 2];
      const sp = moteSeed[i * 2 + 1] * cfg.speed;
      if (cfg.mode === 'rise') {
        arr[j + 1] += dt * sp;
        arr[j] += Math.sin(tSec * 1.4 + ph) * dt * 0.5;
        if (arr[j + 1] > 9.5) arr[j + 1] = 0.2;
      } else if (cfg.mode === 'fall') {
        arr[j + 1] -= dt * sp;
        arr[j] -= dt * sp * 0.3;
        if (arr[j + 1] < 0.1) { arr[j + 1] = 9.5; arr[j] = (Math.random() - 0.5) * 56; }
      } else if (cfg.mode === 'drift') {
        arr[j] += dt * sp;
        arr[j + 1] += Math.sin(tSec * 0.8 + ph) * dt * 0.25;
        if (arr[j] > 30) arr[j] = -30;
      } else {     // orbit
        arr[j] += Math.cos(tSec * 0.6 + ph) * dt * 0.9;
        arr[j + 1] += Math.sin(tSec * 0.5 + ph) * dt * 0.45;
        if (arr[j + 1] < 0.2) arr[j + 1] = 0.2;
        if (arr[j + 1] > 9.5) arr[j + 1] = 9.5;
      }
    }
    moteGeo.attributes.position.needsUpdate = true;
  }

  // ── Impact rings ──────────────────────────────────────────────────
  const RING_POOL = 6;
  const ringPool = [];
  for (let i = 0; i < RING_POOL; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: '#fff', transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(GEO.ring, mat);
    m.position.y = 0.07;
    m.visible = false;
    scene.add(m);
    ringPool.push({ mesh: m, mat });
  }

  // ── Explosions — expanding emissive icosahedra + one light flash ──
  const BOOM_POOL = 12;
  const boomPool = [];
  for (let i = 0; i < BOOM_POOL; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: '#ffb45a', transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const m = new THREE.Mesh(GEO.boom, mat);
    m.visible = false;
    scene.add(m);
    boomPool.push({ mesh: m, mat });
  }
  const boomLight = new THREE.PointLight('#ffc070', 0, 22, 1.8);
  boomLight.visible = false;
  scene.add(boomLight);

  // ── Special telegraphs — pulsing ground decals per side ───────────
  function makeTelegraph(color) {
    const circleMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const circle = new THREE.Mesh(GEO.circle, circleMat);
    circle.position.y = 0.05;
    circle.visible = false;
    scene.add(circle);
    const bandMat = circleMat.clone();
    const band = new THREE.Mesh(GEO.band, bandMat);
    band.position.y = 0.05;
    band.visible = false;
    scene.add(band);
    return { circle, circleMat, band, bandMat };
  }
  const teleP = makeTelegraph('#7be3ff');
  const teleE = makeTelegraph('#ff486b');

  // ── Damage / loot numbers — pooled canvas-texture sprites ─────────
  const NUM_POOL = 40;
  const numPool = [];
  for (let i = 0; i < NUM_POOL; i++) {
    const cv = document.createElement('canvas');
    cv.width = 192; cv.height = 80;
    const cx = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(2.0, 0.84, 1);
    sp.visible = false;
    scene.add(sp);
    numPool.push({ sprite: sp, mat, tex, cv, cx, lastLabel: '' });
  }
  function paintNumber(slot, label, color, sizePx) {
    const { cx, cv, tex } = slot;
    cx.clearRect(0, 0, cv.width, cv.height);
    cx.font = `bold ${sizePx}px "JetBrains Mono", monospace`;
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.shadowColor = 'rgba(0,0,0,0.85)';
    cx.shadowBlur = 8;
    cx.fillStyle = color;
    cx.fillText(label, cv.width / 2, cv.height / 2);
    tex.needsUpdate = true;
    slot.lastLabel = label + color;
  }

  // ── Era flash — camera-space quad + light pulse ───────────────────
  const flashMat = new THREE.MeshBasicMaterial({
    color: '#fff', transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false,
  });
  const flashQuad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flashMat);
  flashQuad.position.z = -1;
  flashQuad.renderOrder = 999;
  flashQuad.frustumCulled = false;
  camera.add(flashQuad);
  function fitFlashQuad() {
    const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.0;
    flashQuad.scale.set(h * camera.aspect * 1.1, h * 1.1, 1);
  }

  // ── Era look lerp state ───────────────────────────────────────────
  // All era-driven colors live in `cur` and chase `target` every frame
  // so an evolve sweeps the whole battlefield over ~1.2 s.
  function lookColors(idx) {
    const L = ERA_LOOKS[Math.max(0, Math.min(4, idx))];
    return L;
  }
  const cur = {
    skyTop: new THREE.Color(ERA_LOOKS[0].skyTop),
    skyMid: new THREE.Color(ERA_LOOKS[0].skyMid),
    skyBot: new THREE.Color(ERA_LOOKS[0].skyBot),
    sunColor: new THREE.Color(ERA_LOOKS[0].sunColor),
    sunDir: new THREE.Vector3().fromArray(ERA_LOOKS[0].sunDir).normalize(),
    sunIntensity: ERA_LOOKS[0].sunIntensity,
    hemiSky: new THREE.Color(ERA_LOOKS[0].hemiSky),
    hemiGround: new THREE.Color(ERA_LOOKS[0].hemiGround),
    fillColor: new THREE.Color(ERA_LOOKS[0].fillColor),
    fog: new THREE.Color(ERA_LOOKS[0].fog),
    fogDensity: ERA_LOOKS[0].fogDensity,
    groundTint: new THREE.Color(ERA_LOOKS[0].groundTint),
    hillNear: new THREE.Color(ERA_LOOKS[0].hillNear),
    hillFar: new THREE.Color(ERA_LOOKS[0].hillFar),
    cloudTint: new THREE.Color(ERA_LOOKS[0].cloudTint),
    moteColor: new THREE.Color(ERA_LOOKS[0].mote.color),
  };
  const _tgtSunDir = new THREE.Vector3();
  let lastEraIdx = -1;

  function lerpLook(idx, dt) {
    const L = lookColors(idx);
    const k = Math.min(1, dt * 2.2);
    cur.skyTop.lerp(_colA.set(L.skyTop), k);
    cur.skyMid.lerp(_colA.set(L.skyMid), k);
    cur.skyBot.lerp(_colA.set(L.skyBot), k);
    cur.sunColor.lerp(_colA.set(L.sunColor), k);
    _tgtSunDir.fromArray(L.sunDir).normalize();
    cur.sunDir.lerp(_tgtSunDir, k).normalize();
    cur.sunIntensity += (L.sunIntensity - cur.sunIntensity) * k;
    cur.hemiSky.lerp(_colA.set(L.hemiSky), k);
    cur.hemiGround.lerp(_colA.set(L.hemiGround), k);
    cur.fillColor.lerp(_colA.set(L.fillColor), k);
    cur.fog.lerp(_colA.set(L.fog), k);
    cur.fogDensity += (L.fogDensity - cur.fogDensity) * k;
    cur.groundTint.lerp(_colA.set(L.groundTint), k);
    cur.hillNear.lerp(_colA.set(L.hillNear), k);
    cur.hillFar.lerp(_colA.set(L.hillFar), k);
    cur.cloudTint.lerp(_colA.set(L.cloudTint), k);
    cur.moteColor.lerp(_colA.set(L.mote.color), k);

    // Push into the scene objects.
    skyMat.uniforms.uTop.value.copy(cur.skyTop);
    skyMat.uniforms.uMid.value.copy(cur.skyMid);
    skyMat.uniforms.uBot.value.copy(cur.skyBot);
    skyMat.uniforms.uSunColor.value.copy(cur.sunColor);
    skyMat.uniforms.uSunDir.value.copy(cur.sunDir);
    sun.color.copy(cur.sunColor);
    sun.position.copy(cur.sunDir).multiplyScalar(70);
    hemi.color.copy(cur.hemiSky);
    hemi.groundColor.copy(cur.hemiGround);
    fill.color.copy(cur.fillColor);
    scene.fog.color.copy(cur.fog);
    scene.fog.density = cur.fogDensity;
    groundMat.color.copy(cur.groundTint);
    hillNearMat.color.copy(cur.hillNear);
    hillFarMat.color.copy(cur.hillFar);
    cloudMat.color.copy(cur.cloudTint);
    moteMat.color.copy(cur.moteColor);
    for (const m of scatterMats) m.color.copy(cur.groundTint);
  }

  // Banner / accent tint for both bases tracks each side's own era.
  function tintBase(rec, side) {
    const pal = paletteFor(getEraByIndex(side.eraIndex)?.id);
    const want = rec.isPlayer ? pal.banner : pal.bannerEnemy;
    rec.cloth.color.lerp(_colA.set(want), 0.08);
    rec.glow.emissive.lerp(_colA.set(pal.hudAccent || want), 0.08);
  }

  // Damage states — tilt + char as the fortress crumbles, white-hot
  // window pulse on baseFlashMs.
  function updateBase(rec, side, wx, tSec) {
    const g = rec.group;
    g.position.x = wx;
    const hpR = Math.max(0, side.base.hp / side.base.maxHp);
    const wreck = hpR < 0.25 ? 2 : hpR < 0.5 ? 1 : 0;
    const tiltDir = rec.isPlayer ? -1 : 1;     // lean away from the lane
    g.rotation.z = tiltDir * (wreck === 2 ? 0.085 : wreck === 1 ? 0.035 : 0);
    const char = wreck === 2 ? 0.5 : wreck === 1 ? 0.75 : 1;
    rec.stone.color.copy(rec.baseStone).multiplyScalar(char);
    rec.stoneDark.color.copy(rec.baseStoneDark).multiplyScalar(char);
    const flashR = Math.max(0, Math.min(1, (side.baseFlashMs || 0) / 160));
    rec.glow.emissiveIntensity = 1.4 + flashR * 7;
    // Banner sway.
    rec.flag.rotation.x = Math.sin(tSec * 2.4 + (rec.isPlayer ? 0 : 2)) * 0.18;
  }

  // ── Frame state ───────────────────────────────────────────────────
  let width = 1, height = 1;
  let lastLaneHalf = -1;
  let timeAcc = 0;       // local clock fallback when frameDt is 0 (paused)

  function resize(w, h) {
    width = w; height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    frameCamera();
    fitFlashQuad();
  }

  function clearCache() { /* parity with the 2D renderer API */ }

  // ── Render ────────────────────────────────────────────────────────
  function render(match, frameDt) {
    if (!match) return;
    const dt = Math.max(0, Math.min(0.05, frameDt || 0));
    timeAcc += dt;
    const tSec = match.timeSec || timeAcc;
    const v = match.view;
    const alpha = Math.max(0, Math.min(1, (match._acc || 0) / SIM_DT));

    // Sim → world mapping for this frame. The lane is normalized to a
    // fixed world width regardless of canvas pixel size, so the scene
    // composition is identical on every screen.
    const laneCx = (v.laneLeft + v.laneRight) / 2;
    const groundY = v.groundY;
    const lanePx = Math.max(1, v.laneRight - v.laneLeft);
    SX = LANE_WORLD_W / lanePx;
    SY = SX * 0.5;
    laneHalfWorld = (lanePx / 2 + 62) * SX;
    if (Math.abs(laneHalfWorld - lastLaneHalf) > 0.01) {
      lastLaneHalf = laneHalfWorld;
      frameCamera();
    }
    const wx = (x) => (x - laneCx) * SX;
    const wy = (y) => (groundY - y) * SY;

    // Era look chase (player era drives the global atmosphere).
    const eraIdx = match.player.eraIndex | 0;
    if (lastEraIdx === -1) {
      lastEraIdx = eraIdx;
      lerpLook(eraIdx, 10);    // snap on first frame
    } else {
      lastEraIdx = eraIdx;
      lerpLook(eraIdx, dt || 0.016);
    }
    const look = lookColors(eraIdx);
    const pal = paletteFor(getEraByIndex(eraIdx)?.id);

    // Camera — idle drift + screen shake.
    const driftX = Math.sin(tSec * 0.21) * 0.5;
    const driftY = Math.sin(tSec * 0.16 + 1.7) * 0.22;
    camTarget.set(driftX * 0.4, 2.2 + driftY * 0.3, 0);
    camera.position.copy(camDir).multiplyScalar(camDist).add(camTarget);
    camera.position.x += driftX;
    camera.position.y += driftY;
    const shakeOk = !match.reduceMotion && match.effects.shakeMs > 0;
    if (shakeOk) {
      const mag = (match.effects.shakeMag || 0) * 0.035;
      camera.position.x += (Math.random() - 0.5) * mag;
      camera.position.y += (Math.random() - 0.5) * mag * 0.6;
    }
    camera.lookAt(camTarget);

    // Clouds drift.
    for (let i = 0; i < CLOUD_CT; i++) {
      const s = cloudSeeds[i];
      s.x += s.speed * dt;
      if (s.x > 110) s.x = -110;
      _cloudM4.makeScale(s.sx, s.sy, s.sz);
      _cloudM4.setPosition(s.x, s.y, s.z);
      clouds.setMatrixAt(i, _cloudM4);
    }
    clouds.instanceMatrix.needsUpdate = true;

    // Ambient motes.
    tickMotes(dt, look.mote, tSec);

    // Bases.
    updateBase(playerBase, match.player, wx(v.laneLeft - 50), tSec);
    updateBase(enemyBase, match.enemy, wx(v.laneRight + 50), tSec);
    tintBase(playerBase, match.player);
    tintBase(enemyBase, match.enemy);

    // Turret pylons + turrets. Sim x-positions put turrets practically
    // inside the fortress footprint (fine in 2D where the base is a flat
    // backdrop, wrong in 3D where it has real width) — the whole row is
    // nudged lane-ward so pylons stand clear of the keep.
    const slotPulse = (Math.sin(tSec * 4) + 1) / 2;
    const N_SLOTS = BALANCE.TURRET_SLOT_COUNT;
    // Keep roof terrace: keep is 4.6 tall, fortress group scaled 1.55 → ~7.1.
    const TERRACE_Y = 7.15;
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? match.player : match.enemy;
      const isPlayer = s === 0;
      // Fortress world x (matches updateBase) + the lane-facing roof LEDGE,
      // clear of the central upper storey, so turrets stand ON the terrace.
      const fortX = wx(isPlayer ? v.laneLeft - 50 : v.laneRight + 50);
      const edgeX = fortX + (isPlayer ? 1 : -1) * 2.2;
      for (let i = 0; i < N_SLOTS; i++) {
        const py = pylons[s][i];
        const hasSpot = !!(side.turretSpots && side.turretSpots[i]);
        // Spread the slots across the roof along z (lane-perpendicular).
        const zHalf = 1.25;
        const slotZ = N_SLOTS > 1 ? (-zHalf + i * ((2 * zHalf) / (N_SLOTS - 1))) : 0;
        const t = side.turretSlots[i];

        // Pylon state machine. Enemy pylons only exist once a spot is
        // laid; player pylons always show (ghost = "you could build
        // here"), with the ring + holo marker fading out once a turret
        // occupies the cap.
        const h = 0.5;  // short plinth standing on the roof terrace
        py.group.position.set(edgeX, TERRACE_Y, slotZ);
        py.column.scale.y = h;
        py.column.position.y = h / 2;
        py.cap.position.y = h + 0.08;
        py.hit.scale.y = h + 1.6;
        py.hit.position.y = (h + 1.6) / 2;
        if (!isPlayer) {
          py.group.visible = hasSpot;
          py.ring.visible = false;
          py.holo.visible = false;
          py.column.material = slabMat;
          py.cap.material = slabMat;
        } else {
          py.group.visible = true;
          const ghost = !hasSpot;
          py.column.material = ghost ? ghostMat : slabMat;
          py.cap.material = ghost ? ghostMat : slabMat;
          py.column.castShadow = !ghost;
          py.cap.castShadow = !ghost;
          const needsAttention = !t;        // empty or spot-only → invite a click
          py.ring.visible = needsAttention;
          py.holo.visible = needsAttention;
          if (needsAttention) {
            py.ring.material.opacity = 0.25 + slotPulse * 0.45;
            py.ring.scale.setScalar(1 + slotPulse * 0.12);
            py.holo.position.y = h + 0.7 + Math.sin(tSec * 2.4 + i) * 0.1;
            py.holo.rotation.y = tSec * 1.6;
          }
        }
        // Upgrade pips — total stat levels shown as a row of studs on
        // the pylon cap's lane-facing edge.
        const levels = t && !t.spotOnly
          ? (t.rangeLevel || 0) + (t.damageLevel || 0) + (t.rateLevel || 0)
          : 0;
        for (let p = 0; p < py.pips.length; p++) {
          const on = p < levels;
          py.pips[p].visible = on;
          if (on) {
            py.pips[p].position.set(
              (p - Math.min(levels, 6) / 2 + 0.5) * 0.14,
              h + 0.22,
              (isPlayer ? 1 : -1) * 0.56,
            );
          }
        }

        let rec = turretRecs[s][i];
        if (!t) {
          if (rec) rec.group.visible = false;
          continue;
        }
        const key = `${t.turretId}|${t.eraIndex}`;
        if (!rec || rec.key !== key) {
          if (rec) disposeTurret(rec);
          rec = buildTurret(t);
          rec.key = key;
          turretRecs[s][i] = rec;
        }
        rec.group.visible = true;
        // Turret stands on its pylon cap, up on the fortress roof terrace.
        rec.group.position.set(edgeX, TERRACE_Y + h + 0.1, slotZ);
        rec.group.rotation.y = t.facing > 0 ? HALF_PI : -HALF_PI;
        // Recoil + muzzle flash off the cooldown reset (same trigger
        // window the 2D renderer uses: cdR > 0.85 just fired).
        const cdR = t.cooldownMaxMs ? t.cooldownMs / t.cooldownMaxMs : 0;
        const recoil = cdR > 0.85 ? (cdR - 0.85) / 0.15 : 0;
        rec.barrelG.position.z = -recoil * 0.16;
        const muzzleA = cdR > 0.92 ? (cdR - 0.92) / 0.08 : 0;
        rec.muzzle.material.opacity = muzzleA * 0.95;
        rec.muzzle.scale.setScalar(0.7 + muzzleA * 0.8);
        rec.muzzle.lookAt(camera.position);
      }
    }

    // Special telegraphs.
    const pulse = (Math.sin(tSec * 12) + 1) / 2;
    for (const [tele, side] of [[teleP, match.player], [teleE, match.enemy]]) {
      const sa = side.specialActive;
      tele.circle.visible = false;
      tele.band.visible = false;
      if (!sa) continue;
      if (sa.impactX != null) {
        tele.circle.visible = true;
        tele.circle.position.x = wx(sa.impactX);
        const r = (80 + pulse * 14) * SX;
        tele.circle.scale.set(r, 1, r);
        tele.circleMat.opacity = 0.18 + pulse * 0.2;
      } else {
        tele.band.visible = true;
        tele.band.position.x = 0;
        tele.band.scale.set((v.laneRight - v.laneLeft) * SX, 1, 1.4 + pulse * 0.8);
        tele.bandMat.opacity = 0.16 + pulse * 0.18;
      }
    }

    // Units — id-mapped pooled rigs.
    _seenIds.clear();
    const playerAura = match.player.auraLeftMs > 0;
    const enemyAura = match.enemy.auraLeftMs > 0;
    const cbSafe = !!match.cbSafe;
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? match.player : match.enemy;
      const sideAura = s === 0 ? playerAura : enemyAura;
      for (const u of side.units) {
        _seenIds.add(u.id);
        let rig = rigsById.get(u.id);
        const key = `${u.team}|${u.eraIndex || 0}|${u.role}|${u.isChampion ? 1 : 0}`;
        if (rig && rig.key !== key) { releaseRig(rig); rigsById.delete(u.id); rig = null; }
        if (!rig) { rig = acquireRig(u); rigsById.set(u.id, rig); }
        const ix = (u.px != null) ? u.px + (u.x - u.px) * alpha : u.x;
        animateRig(rig, u, wx(ix), (u.laneStagger || 0) * 0.5, sideAura, tSec, cbSafe);
      }
    }
    for (const [id, rig] of rigsById) {
      if (!_seenIds.has(id)) { releaseRig(rig); rigsById.delete(id); }
    }

    // Projectiles — sequential pool, oriented along velocity.
    let pi = 0;
    for (const p of match.pools.projectile.live) {
      if (!p.alive || pi >= PROJ_POOL) continue;
      const slot = projPool[pi++];
      const px = (p.px != null) ? p.px + (p.x - p.px) * alpha : p.x;
      const py = (p.py != null) ? p.py + (p.y - p.py) * alpha : p.y;
      const X = wx(px), Y = Math.max(0.1, wy(py));
      slot.head.visible = true;
      slot.head.position.set(X, Y, 0);
      slot.headMat.color.copy(cachedColor(p.color || '#fff'));
      const orb = p.kind === 'orb';
      slot.head.scale.setScalar(orb ? 1.9 : 1);
      // Trail — a thin plane stretched back along the velocity vector.
      _v3a.set(p.vx * SX, -p.vy * SY, 0);
      const spd = _v3a.length();
      if (spd > 0.001) {
        _v3a.multiplyScalar(1 / spd);
        slot.trail.visible = true;
        slot.trail.position.set(X, Y, 0);
        _quat.setFromUnitVectors(_UP_Y, _v3a);
        slot.trail.quaternion.copy(_quat);
        slot.trail.scale.set(orb ? 1.8 : 1, orb ? 1.1 : 0.85, 1);
        slot.trailMat.color.copy(cachedColor(p.colorTrail || p.color || '#fff'));
      } else {
        slot.trail.visible = false;
      }
    }
    for (let i = pi; i < PROJ_POOL; i++) {
      if (!projPool[i].head.visible) break;
      projPool[i].head.visible = false;
      projPool[i].trail.visible = false;
    }

    // Particles.
    let pc = 0;
    for (const p of match.pools.particle.live) {
      if (!p.alive || pc >= PT_CAP) continue;
      const j = pc * 3;
      ptPos[j] = wx(p.x);
      ptPos[j + 1] = Math.max(0.05, wy(p.y));
      ptPos[j + 2] = 0.2;
      const c = cachedColor(p.color || '#fff');
      const a = Math.max(0, p.lifeMs / p.maxLifeMs);
      ptCol[j] = c.r * a; ptCol[j + 1] = c.g * a; ptCol[j + 2] = c.b * a;
      pc++;
    }
    ptGeo.setDrawRange(0, pc);
    if (pc > 0) {
      ptGeo.attributes.position.needsUpdate = true;
      ptGeo.attributes.color.needsUpdate = true;
    }

    // Impact rings.
    const rings = match.effects.rings || [];
    for (let i = 0; i < RING_POOL; i++) {
      const slot = ringPool[i];
      const r = rings[i];
      if (!r) { slot.mesh.visible = false; continue; }
      const t = r.ageMs / r.lifeMs;
      const expand = r.kind === 'point' ? 1 + t * 0.3 : 1;
      const rad = Math.max(0.4, r.radius * SX * expand);
      slot.mesh.visible = true;
      slot.mesh.position.x = wx(r.x);
      if (r.kind === 'lane' || r.kind === 'aura') slot.mesh.scale.set(rad, 1, Math.min(rad, 2.2));
      else slot.mesh.scale.set(rad, 1, rad);
      slot.mat.color.copy(cachedColor(r.color || '#fff'));
      slot.mat.opacity = Math.max(0, (1 - t) * 0.65);
    }

    // Explosions.
    const booms = match.effects.explosions || [];
    let youngest = null;
    for (let i = 0; i < BOOM_POOL; i++) {
      const slot = boomPool[i];
      const e = booms[i];
      if (!e) { slot.mesh.visible = false; continue; }
      const t = Math.min(1, e.ageMs / e.lifeMs);
      slot.mesh.visible = true;
      slot.mesh.position.set(wx(e.x), Math.max(0.4, wy(e.y)), 0.2);
      const k = (e.size || 64) * SY * 0.55 * (0.35 + t * 0.95);
      slot.mesh.scale.setScalar(k);
      slot.mesh.rotation.y = t * 2.5;
      slot.mat.opacity = Math.max(0, 1 - t) * 0.9;
      if (!youngest || e.ageMs < youngest.ageMs) youngest = e;
    }
    if (youngest && youngest.ageMs < 240) {
      boomLight.visible = true;
      boomLight.position.set(wx(youngest.x), Math.max(0.8, wy(youngest.y)) + 0.5, 1.5);
      boomLight.intensity = (1 - youngest.ageMs / 240) * 60;
    } else {
      boomLight.visible = false;
    }

    // Damage / loot numbers.
    let ni = 0;
    for (const d of match.pools.damageNum.live) {
      if (!d.alive || ni >= NUM_POOL) continue;
      const slot = numPool[ni++];
      const t = d.ageMs / d.lifeMs;
      const ageS = d.ageMs / 1000;
      const yOff = (d.vy || -28) * ageS - 24 * ageS * ageS;
      const xOff = (d.vx || 0) * ageS;
      let label, color, size = 34;
      if (d.kind === 'gold')       { label = `+${d.value}g`;  color = '#ffe14f'; }
      else if (d.kind === 'xp')    { label = `+${d.value}xp`; color = '#7be3ff'; size = 28; }
      else                         { label = String(d.value); color = d.team === 'player' ? '#ffe14f' : '#ff8aa3'; }
      if (slot.lastLabel !== label + color) paintNumber(slot, label, color, size);
      slot.sprite.visible = true;
      slot.sprite.position.set(wx(d.x + xOff), Math.max(0.4, wy(d.y + yOff)), 0.6);
      slot.mat.opacity = Math.max(0, 1 - t * t);
    }
    for (let i = ni; i < NUM_POOL; i++) {
      if (!numPool[i].sprite.visible) break;
      numPool[i].sprite.visible = false;
    }

    // Era flash — fullscreen quad + sun pulse (suppressed under
    // reduceMotion, matching the 2D renderer's contract).
    let flashA = 0;
    if (match.effects.flashMs > 0 && !match.reduceMotion) {
      flashA = Math.max(0, Math.min(0.6, (match.effects.flashMs / 600) * (match.effects.flashAlpha || 0.4)));
    }
    flashMat.opacity = flashA;
    flashQuad.visible = flashA > 0.002;
    if (flashQuad.visible) flashMat.color.copy(cachedColor(pal.flash || '#fff'));
    sun.intensity = cur.sunIntensity * (1 + flashA * 1.6);

    renderer.render(scene, camera);
  }

  // ── Dispose ───────────────────────────────────────────────────────
  function dispose() {
    for (const slot of numPool) { slot.tex.dispose(); slot.mat.dispose(); }
    for (const recs of turretRecs) for (const r of recs) if (r) disposeTurret(r);
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
        else o.material.dispose?.();
      }
    });
    for (const g of Object.values(GEO)) g.dispose?.();
    // Shared blob-shadow template (never added to the scene, so the
    // traverse above never reaches it). All per-rig materials ARE in the
    // graph (added via part()/the rig group) and are freed by the
    // traverse, including the cloned skin/cloth/metal/weapon materials.
    blobShadowMat.dispose();
    renderer.dispose();
  }

  void width; void height;
  return { render, resize, clearCache, dispose, pickPlayerSlot, screenPosForSlot };
}
