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
    sunColor: '#ffc98a', sunIntensity: 1.2, sunDir: [-0.55, 0.42, 0.38],
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
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  scene.add(camera);   // camera is in the graph so the flash quad renders

  // Dev-only scene handle for the screenshot/debug harness. The slot
  // helpers land on it after they're defined below.
  const devHandle = import.meta.env.DEV ? { scene, camera, renderer } : null;
  if (devHandle) window.__es3d = devHandle;

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

  const hemi = new THREE.HemisphereLight(0xddccaa, 0x2a1a10, 0.7);
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

  // ── Shared geometries (units / turrets / fx) ──────────────────────
  const GEO = {
    // Character skeleton — pivots are baked into the translates: thigh and
    // upper-arm geometries hang from their joint origin so a single
    // rotation.x at the group reads as a hip/shoulder swing, and the
    // knee/elbow segments hang from their own sub-pivots.
    pelvis:     new THREE.BoxGeometry(0.36, 0.22, 0.26),
    chest:      new THREE.BoxGeometry(0.46, 0.44, 0.3),
    chestHeavy: new THREE.BoxGeometry(0.66, 0.52, 0.42),
    pelvisHeavy: new THREE.BoxGeometry(0.5, 0.26, 0.34),
    tabard:     new THREE.BoxGeometry(0.3, 0.5, 0.045),
    shoulderCap: new THREE.BoxGeometry(0.18, 0.09, 0.2),
    hood:       new THREE.ConeGeometry(0.2, 0.34, 6),
    club:       new THREE.CylinderGeometry(0.04, 0.07, 0.55, 6).translate(0, 0.32, 0),
    clubHead:   new THREE.SphereGeometry(0.12, 6, 5),
    spear:      new THREE.CylinderGeometry(0.025, 0.025, 1.3, 5).translate(0, 0.35, 0),
    spearTip:   new THREE.ConeGeometry(0.05, 0.18, 5).translate(0, 1.06, 0),
    towerShield: new THREE.BoxGeometry(0.5, 0.92, 0.07),
    rifleStock: new THREE.BoxGeometry(0.09, 0.13, 0.5),
    rifleBarrel: new THREE.CylinderGeometry(0.03, 0.035, 0.5, 5).rotateX(HALF_PI),
    wisp:       new THREE.ConeGeometry(0.22, 0.55, 6).rotateX(Math.PI),
    coreDisc:   new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8).rotateX(HALF_PI),
    belt:       new THREE.BoxGeometry(0.4, 0.08, 0.3),
    head:       new THREE.BoxGeometry(0.26, 0.24, 0.26),
    helm:       new THREE.BoxGeometry(0.3, 0.14, 0.3),
    visor:      new THREE.BoxGeometry(0.22, 0.05, 0.02),
    thigh:      new THREE.BoxGeometry(0.17, 0.36, 0.19).translate(0, -0.18, 0),
    calf:       new THREE.BoxGeometry(0.13, 0.34, 0.15).translate(0, -0.17, 0),
    boot:       new THREE.BoxGeometry(0.15, 0.1, 0.27).translate(0, -0.38, 0.05),
    upperArm:   new THREE.BoxGeometry(0.13, 0.3, 0.14).translate(0, -0.15, 0),
    forearm:    new THREE.BoxGeometry(0.11, 0.28, 0.12).translate(0, -0.14, 0),
    // Weapons — sized to READ at full-lane framing, not to scale.
    swordBlade: new THREE.BoxGeometry(0.055, 0.78, 0.16).translate(0, 0.5, 0),
    swordGuard: new THREE.BoxGeometry(0.2, 0.05, 0.07).translate(0, 0.1, 0),
    swordGrip:  new THREE.CylinderGeometry(0.03, 0.03, 0.18, 5),
    shield:     new THREE.BoxGeometry(0.5, 0.64, 0.07),
    shieldBoss: new THREE.CylinderGeometry(0.1, 0.12, 0.06, 8).rotateX(HALF_PI),
    bowArc:     new THREE.TorusGeometry(0.42, 0.028, 4, 10, Math.PI),
    bowString:  new THREE.BoxGeometry(0.012, 0.82, 0.012),
    arrowNock:  new THREE.CylinderGeometry(0.018, 0.018, 0.5, 4).rotateZ(HALF_PI),
    hammerHaft: new THREE.CylinderGeometry(0.04, 0.045, 1.0, 5).translate(0, 0.3, 0),
    hammerHead: new THREE.BoxGeometry(0.38, 0.24, 0.24).translate(0, 0.82, 0),
    cape:       new THREE.PlaneGeometry(0.56, 0.78),
    pole:       new THREE.CylinderGeometry(0.025, 0.025, 1.5, 5),
    flag:       new THREE.PlaneGeometry(0.5, 0.32),
    horn:       new THREE.ConeGeometry(0.05, 0.18, 5),
    pauldron:   new THREE.BoxGeometry(0.2, 0.1, 0.34),
    gear:       new THREE.CylinderGeometry(0.13, 0.13, 0.06, 8).rotateX(HALF_PI),
    antenna:    new THREE.CylinderGeometry(0.014, 0.014, 0.34, 4).translate(0, 0.17, 0),
    antennaTip: new THREE.SphereGeometry(0.045, 6, 5),
    shard:      new THREE.OctahedronGeometry(0.12, 0),
    auraRing:   new THREE.RingGeometry(0.45, 0.62, 24).rotateX(-HALF_PI),
    // Turret parts.
    tBase:      new THREE.CylinderGeometry(0.3, 0.36, 0.16, 8),
    tHousing:   new THREE.BoxGeometry(0.42, 0.3, 0.46),
    tHousingHvy: new THREE.BoxGeometry(0.56, 0.4, 0.6),
    tBarrel:    new THREE.CylinderGeometry(0.06, 0.07, 0.7, 6).rotateX(HALF_PI).translate(0, 0, 0.3),
    tBarrelHvy: new THREE.CylinderGeometry(0.1, 0.12, 0.56, 6).rotateX(HALF_PI).translate(0, 0, 0.24),
    slab:       new THREE.BoxGeometry(1.3, 0.16, 1.1),
    bracket:    new THREE.BoxGeometry(0.18, 0.5, 0.18),
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
    const baseMat = new THREE.MeshStandardMaterial({ color: t.visual?.baseColor || '#444a52', roughness: 0.9, flatShading: true });
    const barrelMat = new THREE.MeshStandardMaterial({ color: t.visual?.barrelColor || '#8a929c', roughness: 0.7, flatShading: true, metalness: 0.25 });
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
      g.add(M(new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6), baseMat, 0, 0.3, 0));
      barrelG.position.y = 0.58;
      const rail = M(new THREE.BoxGeometry(0.09, 0.07, 1.0), baseMat, 0, 0, 0.1);
      barrelG.add(rail);
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 4, 10, Math.PI), barrelMat);
      arc.rotation.x = HALF_PI;          // bow opens back along the rail
      arc.rotation.z = Math.PI;
      arc.position.z = 0.38;
      arc.castShadow = true;
      barrelG.add(arc);
      barrelG.add(M(new THREE.BoxGeometry(0.014, 0.014, 0.7), darkSteelMat, 0, 0, 0.05));
      const bolt = M(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 4).rotateX(HALF_PI), barrelMat, 0, 0.06, 0.2);
      barrelG.add(bolt);
      muzzleZ = 0.65;
    } else if (kind === 'cannon') {
      // Wheeled field cannon — spoked wheels, carriage, raised barrel.
      for (const sx of [-0.3, 0.3]) {
        const wheel = M(new THREE.CylinderGeometry(0.26, 0.26, 0.07, 10).rotateZ(HALF_PI), baseMat, sx, 0.26, 0);
        g.add(wheel);
        const hub = M(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 6).rotateZ(HALF_PI), barrelMat, sx, 0.26, 0);
        g.add(hub);
      }
      g.add(M(new THREE.BoxGeometry(0.4, 0.14, 0.7), baseMat, 0, 0.32, -0.12));
      barrelG.position.y = 0.46;
      barrelG.rotation.x = -0.12;        // slight upward elevation
      const barrel = M(new THREE.CylinderGeometry(0.085, 0.11, 0.95, 7).rotateX(HALF_PI), barrelMat, 0, 0, 0.25);
      barrelG.add(barrel);
      barrelG.add(M(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 7).rotateX(HALF_PI), baseMat, 0, 0, -0.18));
      muzzleZ = 0.78;
    } else if (kind === 'bell') {
      // Bronze mortar — fat short barrel angled high on a ring base.
      g.add(M(new THREE.CylinderGeometry(0.34, 0.4, 0.16, 9), baseMat, 0, 0.08, 0));
      g.add(M(new THREE.BoxGeometry(0.1, 0.3, 0.46), baseMat, -0.24, 0.3, 0));
      g.add(M(new THREE.BoxGeometry(0.1, 0.3, 0.46), baseMat, 0.24, 0.3, 0));
      barrelG.position.y = 0.42;
      barrelG.rotation.x = -0.7;         // mortars throw high
      const tube = M(new THREE.CylinderGeometry(0.2, 0.26, 0.55, 9).rotateX(HALF_PI), barrelMat, 0, 0, 0.16);
      barrelG.add(tube);
      const lip = M(new THREE.CylinderGeometry(0.24, 0.22, 0.08, 9).rotateX(HALF_PI), baseMat, 0, 0, 0.42);
      barrelG.add(lip);
      muzzleZ = 0.5;
    } else if (kind === 'tesla') {
      // Tesla coil — shrinking disc stack with a charged orb on top.
      const orbMat = new THREE.MeshStandardMaterial({
        color: '#0a2030', emissive: t.visual?.barrelColor || '#7be3ff',
        emissiveIntensity: 1.8, roughness: 0.4,
      });
      mats.push(orbMat);
      g.add(M(new THREE.CylinderGeometry(0.36, 0.42, 0.14, 9), baseMat, 0, 0.07, 0));
      for (let i = 0; i < 3; i++) {
        g.add(M(new THREE.CylinderGeometry(0.26 - i * 0.06, 0.3 - i * 0.06, 0.1, 9), i % 2 ? barrelMat : baseMat, 0, 0.24 + i * 0.14, 0));
      }
      barrelG.position.y = 0.78;
      const orb = M(new THREE.SphereGeometry(0.16, 8, 6), orbMat, 0, 0, 0);
      barrelG.add(orb);
      barrelG.add(M(new THREE.TorusGeometry(0.22, 0.02, 4, 12), orbMat, 0, 0, 0));
      muzzleZ = 0.25;
    } else if (kind === 'lance') {
      // Void lance — horizontal finned spike with an emissive core seam.
      const coreMat = new THREE.MeshStandardMaterial({
        color: '#1a0c30', emissive: t.visual?.barrelColor || '#c89bff',
        emissiveIntensity: 2.0, flatShading: true,
      });
      mats.push(coreMat);
      g.add(M(new THREE.OctahedronGeometry(0.26, 0), baseMat, 0, 0.3, 0));
      g.add(M(new THREE.CylinderGeometry(0.1, 0.16, 0.2, 6), baseMat, 0, 0.1, 0));
      barrelG.position.y = 0.52;
      const shaft = M(new THREE.CylinderGeometry(0.07, 0.05, 0.9, 6).rotateX(HALF_PI), barrelMat, 0, 0, 0.15);
      barrelG.add(shaft);
      const tip = M(new THREE.ConeGeometry(0.09, 0.34, 6).rotateX(HALF_PI), coreMat, 0, 0, 0.75);
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

  function buildRig(u, key) {
    const isGeneral = u.role === 'general';
    const isHeavy = u.role === 'heavy';
    const isRanged = u.role === 'ranged';
    const pal = paletteFor(getEraByIndex(u.eraIndex || 0)?.id);
    const isPlayer = u.team === 'player';

    // Colour blocking for distance legibility: body colour on chest +
    // thighs, dark calves/boots/forearms anchor the figure, bright trim
    // on helmet + weapon, and a TEAM-coloured tabard so sides read at a
    // glance even when units face each other in a scrum.
    const bodyMat = new THREE.MeshStandardMaterial({ color: u.color || '#888', roughness: 0.9, flatShading: true });
    const headMat = new THREE.MeshStandardMaterial({
      color: _colA.set(u.color || '#888').multiplyScalar(1.35), roughness: 0.9, flatShading: true,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: u.visual?.colorTrim || '#fff1d2',
      roughness: 0.6, flatShading: true, metalness: 0.35,
    });
    const teamMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? pal.banner : pal.bannerEnemy,
      roughness: 0.9, flatShading: true,
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#23252c', roughness: 0.95, flatShading: true });
    const mats = [bodyMat, headMat, trimMat, teamMat, darkMat];

    // Rig faces local +Z; the per-frame facing turn maps that to +X
    // (player) or -X (enemy).
    const g = new THREE.Group();
    const torso = new THREE.Group();
    const hipY = isHeavy || isGeneral ? 0.92 : 0.86;
    torso.position.y = hipY;
    g.add(torso);

    // Pelvis + chest + belt + team tabard. Chest sits forward-shouldered
    // so the silhouette leans into the march.
    const pelvis = new THREE.Mesh(isHeavy || isGeneral ? GEO.pelvisHeavy : GEO.pelvis, bodyMat);
    pelvis.position.y = 0.05;
    pelvis.castShadow = true;
    torso.add(pelvis);
    const chest = new THREE.Mesh(isHeavy || isGeneral ? GEO.chestHeavy : GEO.chest, bodyMat);
    const chestY = isHeavy || isGeneral ? 0.44 : 0.4;
    chest.position.set(0, chestY, 0.02);
    chest.castShadow = true;
    torso.add(chest);
    const belt = new THREE.Mesh(GEO.belt, darkMat);
    belt.position.y = 0.18;
    torso.add(belt);
    const tabard = new THREE.Mesh(GEO.tabard, teamMat);
    tabard.position.set(0, 0.18, (isHeavy || isGeneral ? 0.23 : 0.17));
    torso.add(tabard);
    // Team shoulder caps — the tabard is edge-on from the camera's side
    // view, so the team colour also rides both shoulders where it reads
    // in profile. Era pauldrons (iron) sit slightly above these.
    const capHalf = (isHeavy || isGeneral ? 0.4 : 0.3);
    for (const sx of [-capHalf, capHalf]) {
      const capM = new THREE.Mesh(GEO.shoulderCap, teamMat);
      capM.position.set(sx, (isHeavy || isGeneral ? 0.6 : 0.56), 0.02);
      torso.add(capM);
    }

    // Head group — skull plus era-specific headgear (matched to
    // assets/era-siege/unit_sprite_sheet.png). Era motifs attach here so
    // they ride head height automatically.
    const eraIdx = u.eraIndex || 0;
    const headG = new THREE.Group();
    const headBaseY = isHeavy || isGeneral ? 0.78 : 0.72;
    headG.position.set(0, headBaseY, 0.02);
    torso.add(headG);
    const head = new THREE.Mesh(GEO.head, headMat);
    head.position.y = 0.12;
    head.castShadow = true;
    headG.add(head);
    if (eraIdx === 0 || eraIdx === 4) {
      // Ember tribals and Void wraiths wear hoods, not helmets.
      const hood = new THREE.Mesh(GEO.hood, eraIdx === 4 ? teamMat : bodyMat);
      hood.position.y = 0.22;
      headG.add(hood);
      if (eraIdx === 4) {
        // Wraith face — a single emissive glow inside the hood.
        const glowMat = new THREE.MeshStandardMaterial({
          color: '#1a0c30', emissive: '#c89bff', emissiveIntensity: 2.4,
        });
        mats.push(glowMat);
        const eye = new THREE.Mesh(GEO.antennaTip, glowMat);
        eye.position.set(0, 0.12, 0.12);
        headG.add(eye);
      } else {
        const visor = new THREE.Mesh(GEO.visor, darkMat);
        visor.position.set(0, 0.1, 0.14);
        headG.add(visor);
      }
    } else {
      const helm = new THREE.Mesh(GEO.helm, trimMat);
      helm.position.y = 0.25;
      headG.add(helm);
      if (eraIdx >= 2) {
        // Foundry goggles / Storm visor — an emissive eye strip.
        const stripMat = new THREE.MeshStandardMaterial({
          color: '#101418',
          emissive: eraIdx === 3 ? '#7be3ff' : '#ffb84a',
          emissiveIntensity: 1.6,
        });
        mats.push(stripMat);
        const strip = new THREE.Mesh(GEO.visor, stripMat);
        strip.position.set(0, 0.13, 0.14);
        headG.add(strip);
      } else {
        const visor = new THREE.Mesh(GEO.visor, darkMat);
        visor.position.set(0, 0.12, 0.14);
        headG.add(visor);
      }
    }

    // Legs — hip pivot groups with knee sub-pivots so the walk reads as
    // a stride, not a pendulum.
    const hipHalf = isHeavy || isGeneral ? 0.17 : 0.13;
    function buildLeg(sx) {
      const hip = new THREE.Group();
      hip.position.set(sx, hipY, 0);
      g.add(hip);
      const thigh = new THREE.Mesh(GEO.thigh, bodyMat);
      thigh.castShadow = true;
      hip.add(thigh);
      const knee = new THREE.Group();
      knee.position.y = -0.36;
      hip.add(knee);
      const calf = new THREE.Mesh(GEO.calf, darkMat);
      knee.add(calf);
      const boot = new THREE.Mesh(GEO.boot, darkMat);
      boot.position.y = 0.04;
      knee.add(boot);
      return { hip, knee };
    }
    const L = buildLeg(-hipHalf);
    const R = buildLeg(hipHalf);

    // Void wraiths float — no legs, a tapering energy wisp under the
    // pelvis instead, and the whole figure hovers (see animateRig).
    const floats = eraIdx === 4;
    if (floats) {
      L.hip.visible = false;
      R.hip.visible = false;
      const wispMat = new THREE.MeshStandardMaterial({
        color: '#1a0c30', emissive: '#7a4ec0', emissiveIntensity: 1.2,
        transparent: true, opacity: 0.85, flatShading: true,
      });
      mats.push(wispMat);
      const wisp = new THREE.Mesh(GEO.wisp, wispMat);
      wisp.position.y = hipY - 0.36;
      g.add(wisp);
      g.userData.wisp = wisp;
    }

    // Arms — shoulder pivot + elbow sub-pivot. The weapon hand is the
    // forearm tip; props parent to the elbow group so swings carry them.
    const shoulderY = chestY + 0.16;
    const shoulderX = (isHeavy || isGeneral ? 0.4 : 0.3);
    function buildArm(sx) {
      const shoulder = new THREE.Group();
      shoulder.position.set(sx, shoulderY, 0.02);
      torso.add(shoulder);
      const upper = new THREE.Mesh(GEO.upperArm, bodyMat);
      upper.castShadow = true;
      shoulder.add(upper);
      const elbow = new THREE.Group();
      elbow.position.y = -0.3;
      shoulder.add(elbow);
      const fore = new THREE.Mesh(GEO.forearm, darkMat);
      elbow.add(fore);
      return { shoulder, elbow };
    }
    const armW = buildArm(shoulderX);        // weapon arm
    const armO = buildArm(-shoulderX);       // off-hand arm

    // Role archetype weapons — parented to the weapon elbow so windup +
    // strike carry the whole tool. Era picks the kit (reference sheet):
    // Ember swings clubs, Iron carries spear + tower shield, Foundry and
    // Storm shoulder rifles, Void channels bare energy.
    if (u.role === 'frontline') {
      const grip = new THREE.Group();
      grip.position.y = -0.3;
      armW.elbow.add(grip);
      if (eraIdx === 0) {
        // Bone club.
        const club = new THREE.Mesh(GEO.club, darkMat);
        club.castShadow = true;
        grip.add(club);
        const knob = new THREE.Mesh(GEO.clubHead, trimMat);
        knob.position.y = 0.62;
        grip.add(knob);
      } else if (eraIdx === 1) {
        // Iron spear.
        grip.add(new THREE.Mesh(GEO.spear, darkMat));
        const tip = new THREE.Mesh(GEO.spearTip, trimMat);
        tip.castShadow = true;
        grip.add(tip);
      } else {
        grip.add(new THREE.Mesh(GEO.swordGrip, darkMat));
        grip.add(new THREE.Mesh(GEO.swordGuard, trimMat));
        const sBlade = new THREE.Mesh(GEO.swordBlade, trimMat);
        sBlade.castShadow = true;
        grip.add(sBlade);
      }
      // Shield on the off-hand forearm; Iron carries the full tower
      // shield from the reference, Void carries none (energy beings).
      if (eraIdx !== 4) {
        const shield = new THREE.Mesh(eraIdx === 1 ? GEO.towerShield : GEO.shield, teamMat);
        shield.position.set(-0.1, -0.18, 0.06);
        shield.rotation.y = -0.25;
        shield.castShadow = true;
        armO.elbow.add(shield);
        const boss = new THREE.Mesh(GEO.shieldBoss, trimMat);
        boss.position.set(-0.1, -0.18, 0.12);
        boss.rotation.y = -0.25;
        armO.elbow.add(boss);
      }
    } else if (isRanged && eraIdx >= 2) {
      // Foundry / Storm / Void riflemen — two-hand rifle held forward.
      // Storm and Void muzzles glow (energy weapons).
      const rifle = new THREE.Group();
      rifle.position.set(0, -0.28, 0.08);
      armW.elbow.add(rifle);
      rifle.add(new THREE.Mesh(GEO.rifleStock, darkMat));
      const barrel = new THREE.Mesh(GEO.rifleBarrel, trimMat);
      barrel.position.z = 0.4;
      rifle.add(barrel);
      if (eraIdx >= 3) {
        const tipMat = new THREE.MeshStandardMaterial({
          color: '#0a1420', emissive: eraIdx === 3 ? '#7be3ff' : '#c89bff',
          emissiveIntensity: 2.0,
        });
        mats.push(tipMat);
        const tip = new THREE.Mesh(GEO.antennaTip, tipMat);
        tip.position.set(0, -0.28, 0.74);
        armW.elbow.add(tip);
      }
      g.userData.rifle = rifle;
    } else if (isRanged) {
      // Bow held by the OFF hand out front; weapon hand draws the nock.
      const bow = new THREE.Group();
      bow.position.y = -0.32;
      armO.elbow.add(bow);
      const arc = new THREE.Mesh(GEO.bowArc, trimMat);
      arc.rotation.y = HALF_PI;            // arc opens toward the draw hand
      bow.add(arc);
      const str = new THREE.Mesh(GEO.bowString, darkMat);
      str.position.z = -0.02;
      bow.add(str);
      const arrow = new THREE.Mesh(GEO.arrowNock, darkMat);
      arrow.rotation.y = HALF_PI;
      arrow.position.z = 0.12;
      bow.add(arrow);
      g.userData.arrow = arrow;
      const quiver = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.42, 0.13), teamMat);
      quiver.position.set(-0.16, chestY + 0.1, -0.2);
      quiver.rotation.z = 0.3;
      torso.add(quiver);
    } else if (isHeavy) {
      if (eraIdx === 2) {
        // Foundry mech golem — glowing chest core, slab shoulders, no
        // hand weapon (the fists ARE the weapon, reference sheet).
        const coreMat = new THREE.MeshStandardMaterial({
          color: '#1a0c06', emissive: '#ff7a30', emissiveIntensity: 2.2,
        });
        mats.push(coreMat);
        const core = new THREE.Mesh(GEO.coreDisc, coreMat);
        core.position.set(0, chestY, 0.23);
        torso.add(core);
        for (const sx of [-0.42, 0.42]) {
          const slab = new THREE.Mesh(GEO.pauldron, darkMat);
          slab.scale.set(1.5, 2.2, 1.3);
          slab.position.set(sx, shoulderY + 0.12, 0);
          torso.add(slab);
        }
      } else if (eraIdx === 3) {
        // Storm walker — shoulder cannon instead of a hand weapon.
        const cannon = new THREE.Mesh(GEO.rifleBarrel, trimMat);
        cannon.scale.setScalar(1.6);
        cannon.position.set(0.2, shoulderY + 0.24, 0.1);
        torso.add(cannon);
        const cMat = new THREE.MeshStandardMaterial({
          color: '#0a1420', emissive: '#7be3ff', emissiveIntensity: 2.0,
        });
        mats.push(cMat);
        const cTip = new THREE.Mesh(GEO.antennaTip, cMat);
        cTip.position.set(0.2, shoulderY + 0.24, 0.5);
        torso.add(cTip);
      } else {
        const haft = new THREE.Mesh(GEO.hammerHaft, darkMat);
        haft.position.y = -0.34;
        armW.elbow.add(haft);
        const headW = new THREE.Mesh(GEO.hammerHead, trimMat);
        headW.position.y = -0.34;
        headW.castShadow = true;
        armW.elbow.add(headW);
      }
    } else if (isGeneral) {
      const cape = new THREE.Mesh(GEO.cape, teamMat);
      cape.position.set(0, 0.3, -0.24);
      torso.add(cape);
      g.userData.cape = cape;
      // Standard in the off hand, raised blade in the weapon hand.
      const pole = new THREE.Mesh(GEO.pole, darkMat);
      pole.position.y = -0.1;
      armO.elbow.add(pole);
      const flag = new THREE.Mesh(GEO.flag, teamMat);
      flag.position.set(0, 0.52, 0.26);
      armO.elbow.add(flag);
      const grip = new THREE.Group();
      grip.position.y = -0.3;
      armW.elbow.add(grip);
      grip.add(new THREE.Mesh(GEO.swordGrip, darkMat));
      grip.add(new THREE.Mesh(GEO.swordGuard, trimMat));
      const gBlade = new THREE.Mesh(GEO.swordBlade, trimMat);
      gBlade.castShadow = true;
      grip.add(gBlade);
    }

    // Era motif — one simple add-on that brands the era at a glance.
    // Head-mounted motifs parent to headG so they ride the skull.
    if (eraIdx === 0) {              // Ember — bone horns
      for (const sx of [-0.1, 0.1]) {
        const horn = new THREE.Mesh(GEO.horn, headMat);
        horn.position.set(sx, 0.34, 0);
        horn.rotation.z = -sx * 4;
        headG.add(horn);
      }
    } else if (eraIdx === 1) {       // Iron — shoulder plates
      for (const sx of [-shoulderX, shoulderX]) {
        const p = new THREE.Mesh(GEO.pauldron, trimMat);
        p.position.set(sx, shoulderY + 0.08, 0);
        torso.add(p);
      }
    } else if (eraIdx === 2) {       // Foundry — chest gear
      const gear = new THREE.Mesh(GEO.gear, trimMat);
      gear.position.set(0, chestY, (isHeavy || isGeneral ? 0.24 : 0.18));
      torso.add(gear);
    } else if (eraIdx === 3) {       // Storm — antenna with charged tip
      const ant = new THREE.Mesh(GEO.antenna, darkMat);
      ant.position.set(0, 0.3, 0);
      headG.add(ant);
      const tipMat = new THREE.MeshStandardMaterial({
        color: '#103040', emissive: '#7be3ff', emissiveIntensity: 2.2,
      });
      mats.push(tipMat);
      const tip = new THREE.Mesh(GEO.antennaTip, tipMat);
      tip.position.set(0, 0.66, 0);
      headG.add(tip);
    } else if (eraIdx === 4) {       // Void — floating shard
      const shardMat = new THREE.MeshStandardMaterial({
        color: '#2a1448', emissive: '#c89bff', emissiveIntensity: 1.8, flatShading: true,
      });
      mats.push(shardMat);
      const shard = new THREE.Mesh(GEO.shard, shardMat);
      shard.position.set(0, 0.7, 0);
      headG.add(shard);
      g.userData.shard = shard;
    }

    // Aura ring under the feet — visible while the side's Sun Forge
    // (or equivalent) buff is up.
    const auraMat = new THREE.MeshBasicMaterial({
      color: pal.hudAccent || '#5dd6ff', transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    mats.push(auraMat);
    const aura = new THREE.Mesh(GEO.auraRing, auraMat);
    aura.position.y = 0.04;
    aura.visible = false;
    g.add(aura);

    // HP bar — two screen-facing sprites above the head. The fill
    // sprite's center.x trick keeps its left edge pinned as it shrinks.
    const hpBg = new THREE.Sprite(hpBgMat);
    hpBg.scale.set(0.96, 0.1, 1);
    hpBg.position.y = (isHeavy || isGeneral ? 2.15 : 2.0);
    hpBg.visible = false;
    g.add(hpBg);
    const hpFillMat = new THREE.SpriteMaterial({ color: '#35f0c9', depthTest: false });
    const hpFill = new THREE.Sprite(hpFillMat);
    hpFill.scale.set(0.9, 0.07, 1);
    hpFill.position.y = hpBg.position.y;
    hpFill.visible = false;
    g.add(hpFill);

    // Scale identity: general > heavy > rest; champions +25%.
    const base = isGeneral ? 1.28 : isHeavy ? 1.12 : 1.0;
    const k = UNIT_SCALE * base * (u.isChampion ? 1.25 : 1);
    g.scale.setScalar(k);

    scene.add(g);
    return {
      key, group: g, torso, hipY,
      legL: L.hip, legR: R.hip, kneeL: L.knee, kneeR: R.knee,
      arm: armW.shoulder, elbowW: armW.elbow,
      armO: armO.shoulder, elbowO: armO.elbow,
      headG, isRanged, floats,
      aura, hpBg, hpFill, hpFillMat,
      mats, fading: false, baseScale: k,
    };
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
    // Reset death fade so the next occupant spawns solid.
    if (rig.fading) {
      for (const m of rig.mats) { m.transparent = false; m.opacity = 1; m.needsUpdate = true; }
      rig.fading = false;
    }
    rig.group.rotation.set(0, 0, 0);
    rig.group.position.y = 0;
    rigPools.get(rig.key).push(rig);
  }

  const _seenIds = new Set();

  function animateRig(rig, u, wx, wz, sideAura, tSec, cbSafe) {
    const g = rig.group;
    g.position.x = wx;
    g.position.z = wz;
    g.rotation.y = u.facing > 0 ? HALF_PI : -HALF_PI;

    const phase = (u.walkPhaseMs || 0) / 130;
    const attacking = u.attackTickPhase !== 'idle';

    // Void wraiths hover instead of walking — bob the whole figure and
    // sway the wisp; no leg work.
    if (rig.floats && !u.dead) {
      g.position.y = 0.18 + Math.sin(tSec * 2.6 + wx * 0.7) * 0.07;
      rig.torso.rotation.z = Math.sin(tSec * 1.8 + wx) * 0.05;
      const wisp = g.userData.wisp;
      if (wisp) wisp.rotation.y = tSec * 2.0;
      if (!attacking) {
        rig.arm.rotation.x = -0.35;
        rig.armO.rotation.x = -0.35;
      }
    } else if (!u.dead) {
      g.position.y = 0;
    }

    // Walk cycle — hip swing with knee bend on the back-swing, arms
    // counter-swing with elbow flex, torso bobs and rolls into the
    // stride. Legs hang off the root (not the torso) so the bob reads
    // as the body riding the stride.
    if (!attacking && !u.dead && !rig.floats) {
      const s = Math.sin(phase);
      rig.legL.rotation.x = s * 0.75;
      rig.legR.rotation.x = -s * 0.75;
      // Knee bends as its leg swings back, straightens to plant.
      rig.kneeL.rotation.x = Math.max(0, -s) * 0.9;
      rig.kneeR.rotation.x = Math.max(0, s) * 0.9;
      rig.torso.position.y = rig.hipY + Math.abs(s) * 0.05;
      rig.torso.rotation.x = 0.07;
      rig.torso.rotation.z = s * 0.035;
      rig.arm.rotation.x = -s * 0.5;
      rig.elbowW.rotation.x = -0.3 - Math.max(0, s) * 0.3;
      rig.armO.rotation.x = s * 0.5;
      rig.elbowO.rotation.x = -0.3 - Math.max(0, -s) * 0.3;
      rig.headG.rotation.x = -0.05;       // chin up, eyes down-lane
    } else {
      // Combat idle — braced stance, weapon ready, shield/bow forward.
      rig.legL.rotation.x = 0.16;
      rig.legR.rotation.x = -0.16;
      rig.kneeL.rotation.x = 0.18;
      rig.kneeR.rotation.x = 0.18;
      rig.torso.position.y = rig.hipY;
      rig.torso.rotation.z = 0;
      rig.armO.rotation.x = rig.isRanged ? -1.35 : -0.5;   // bow arm level / shield up
      rig.elbowO.rotation.x = rig.isRanged ? -0.1 : -0.45;
      rig.headG.rotation.x = 0;
    }

    // Attack — role-specific poses driven by the sim's windup/recover
    // timers. Melee: overhead chop with torso coil + lunge. Ranged: draw
    // the string back at shoulder height, loose on the snap.
    if (u.attackTickPhase === 'windup') {
      const t = u.attackWindupMs ? 1 - Math.max(0, u.attackTimerMs / u.attackWindupMs) : 0;
      if (rig.isRanged) {
        rig.arm.rotation.x = -1.35;                 // draw hand level...
        rig.elbowW.rotation.x = -0.15 - t * 0.55;   // ...pulling back
        rig.torso.rotation.y = -u.facing * 0.3 * t; // archer side-stance
      } else {
        rig.arm.rotation.x = -0.4 - t * 1.7;        // wind the weapon up high
        rig.elbowW.rotation.x = -0.2 - t * 0.5;
        rig.torso.rotation.x = 0.05 + 0.12 * t;
        rig.torso.rotation.y = u.facing * 0.18 * t; // coil the shoulders
      }
    } else if (u.attackTickPhase === 'recover') {
      const t = u.attackRecoverMs ? 1 - Math.max(0, u.attackTimerMs / u.attackRecoverMs) : 0;
      const snap = Math.min(1, t * 2.4);
      if (rig.isRanged) {
        rig.arm.rotation.x = -1.35 + snap * 0.4;    // string slips forward
        rig.elbowW.rotation.x = THREE.MathUtils.lerp(-0.7, -0.15, snap);
        rig.torso.rotation.y = -u.facing * 0.3 * (1 - t);
      } else {
        rig.arm.rotation.x = THREE.MathUtils.lerp(-2.1, 0.6, snap);
        rig.elbowW.rotation.x = THREE.MathUtils.lerp(-0.7, -0.1, snap);
        rig.torso.rotation.x = 0.18 * (1 - t);
        rig.torso.rotation.y = u.facing * 0.18 * (1 - t);
        g.position.x += u.facing * 0.14 * (1 - t);  // lunge into the hit
      }
    } else {
      rig.torso.rotation.y = 0;
    }

    // Nocked arrow only shows while drawing.
    const arrow = g.userData.arrow;
    if (arrow) arrow.visible = u.attackTickPhase === 'windup';

    // Void shard idle float (local to the head group).
    const shard = g.userData.shard;
    if (shard) {
      shard.position.y = 0.7 + Math.sin(tSec * 2.2 + wx) * 0.06;
      shard.rotation.y = tSec * 1.4;
    }

    // General's cape sways with the march.
    const cape = g.userData.cape;
    if (cape) cape.rotation.x = 0.18 + Math.sin(phase * 0.5 + 1) * 0.08;

    // Death — fall forward, sink, fade.
    if (u.dead) {
      const t = Math.min(1, (u.deathAgeMs || 0) / DEATH_ANIM_MS);
      g.rotation.x = (u.facing > 0 ? 1 : -1) * 0;   // fall direction handled below
      g.rotation.z = -u.facing * t * 1.35;          // topple toward the push direction
      g.position.y = -t * 0.45;
      if (!rig.fading) {
        rig.fading = true;
        for (const m of rig.mats) { m.transparent = true; m.needsUpdate = true; }
      }
      const op = 1 - t;
      for (const m of rig.mats) m.opacity = op;
      rig.hpBg.visible = false;
      rig.hpFill.visible = false;
      rig.aura.visible = false;
      return;
    }

    // Aura ring pulse.
    rig.aura.visible = !!sideAura;
    if (sideAura) rig.aura.material.opacity = 0.3 + 0.25 * (Math.sin(tSec * 5) * 0.5 + 0.5);

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
    const PYLON_NUDGE = 4.4;
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? match.player : match.enemy;
      const isPlayer = s === 0;
      const nudge = isPlayer ? PYLON_NUDGE : -PYLON_NUDGE;
      const spotX = wx(isPlayer ? v.laneLeft - 22 : v.laneRight + 22) + nudge;
      for (let i = 0; i < BALANCE.TURRET_SLOT_COUNT; i++) {
        const py = pylons[s][i];
        const hasSpot = !!(side.turretSpots && side.turretSpots[i]);
        const slabY = (BALANCE.TURRET_ROW_Y_PX + i * 22) * SY;
        const t = side.turretSlots[i];

        // Pylon state machine. Enemy pylons only exist once a spot is
        // laid; player pylons always show (ghost = "you could build
        // here"), with the ring + holo marker fading out once a turret
        // occupies the cap.
        const h = Math.max(0.6, slabY - 0.1);
        py.group.position.set(spotX, 0, 0);
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
        // Turret stands on its pylon cap (same lane-ward nudge).
        rec.group.position.set(wx(t.x) + nudge, wy(t.y), 0);
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
    renderer.dispose();
  }

  void width; void height;
  return { render, resize, clearCache, dispose, pickPlayerSlot, screenPosForSlot };
}
