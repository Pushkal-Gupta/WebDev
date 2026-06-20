// FACEPLANT — original physics-hazard ride. 3D REWRITE.
//
// You ride a bike across a hand-authored track of hills, bumps, and spikes.
// Head touches the ground = faceplant (crash). Reach the flag to win.
//
// This is the Three.js rewrite. The SIMULATION is byte-for-byte the same as
// the 2D version: every physics constant, the terrain height profile, the
// rider pose math, the ragdoll verlet solver, the controls, the scoring and
// every sfx call fire at exactly the same gameplay moment. Only the
// *presentation* moved from a flat 2D canvas to a real 3D scene.
//
//  2.5D mapping. The sim runs on the same (x, y) plane it always did. We
//  render it on the z = 0 plane of a perspective scene with
//      worldX → +X,  worldY → −Y   (sim y grows downward; three's +Y is up)
//  and a side-on perspective follow camera looking down −Z. Because the
//  physics never touches z, every number keeps its exact 2D meaning. The
//  extruded ground ribbon, the bike/rider models, lighting, shadows and the
//  parallax hills/clouds/sun are pure decoration layered on/behind the plane.
//
//  • Rigid-body chassis with position + rotation + angular velocity.
//  • The rider is articulated (posed from the lean input) while riding; on
//    crash it becomes a verlet ragdoll that tumbles separately from the bike.
//  • Controls:
//      → accelerate          ← brake
//      W / ↑  lean back      S / ↓  lean forward
//      Space reset           R restart
//  • Terrain = array of points interpolated linearly. Spikes are zones.
//  • Score = 1000 + remainingSeconds × 10 + air bonuses on win; 0 on crash.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { submitScore } from '../../scoreBus.js';
import { sfx, ensureCtx, subscribeMute } from '../../sound.js';

// Native level dimensions. The 3D camera frames roughly this sim span; the
// stage fills the shell and the camera distance adapts to its aspect.
const VIEW_W = 900;
const VIEW_H = 420;

// Courses: each is a polyline of (x, y) ground points (larger y = lower)
// plus spike zones. UNCHANGED height data — the 3D ribbon is generated from
// exactly these points via groundAt().
const mkPts = (list) => list.map(([x, y]) => ({ x, y }));

const COURSES = [
  {
    name: 'Meadow Run',
    seconds: 30,
    terrain: mkPts([
      [0, 300], [200, 300], [280, 260], [360, 300], [500, 320], [600, 280],
      [760, 320], [900, 300], [1100, 340], [1280, 270], [1440, 320],
      [1600, 320], [1700, 280], [1780, 320], [1960, 320], [2160, 300],
      [2340, 340], [2500, 310], [2700, 310],
    ]),
    spikes: [
      { x0: 940,  x1: 1060 },
      { x0: 1820, x1: 1920 },
      { x0: 2240, x1: 2320 },
    ],
  },
  {
    name: 'Canyon Pass',
    seconds: 45,
    terrain: mkPts([
      [0, 300], [160, 300], [240, 255], [320, 310], [460, 330], [580, 265],
      [720, 330], [880, 295], [1110, 350], [1280, 330], [1400, 270],
      [1480, 265], [1560, 330], [1720, 298], [1950, 350], [2120, 320],
      [2260, 250], [2420, 340], [2560, 330], [2640, 288], [2870, 340],
      [3010, 320], [3140, 310], [3300, 310],
    ]),
    spikes: [
      { x0: 920,  x1: 1058 },
      { x0: 1760, x1: 1898 },
      { x0: 2680, x1: 2818 },
    ],
  },
  {
    name: 'Spine Breaker',
    seconds: 60,
    terrain: mkPts([
      [0, 300], [140, 300], [220, 252], [300, 310], [420, 330], [520, 256],
      [640, 330], [780, 292], [1025, 352], [1180, 330], [1280, 246],
      [1340, 242], [1440, 330], [1560, 298], [1810, 352], [1980, 330],
      [2100, 262], [2180, 330], [2300, 292], [2530, 345], [2680, 320],
      [2820, 242], [2990, 348], [3120, 312], [3380, 350], [3520, 330],
      [3660, 300], [3900, 300],
    ]),
    spikes: [
      { x0: 820,  x1: 968 },
      { x0: 1600, x1: 1744 },
      { x0: 2340, x1: 2466 },
      { x0: 3160, x1: 3308 },
    ],
  },
];

// Physics tuning — IDENTICAL. Do not retune; the contract depends on these.
const GRAVITY = 1500;
const THROTTLE_ACCEL = 560;
const BRAKE_ACCEL = 520;
const MAX_SPEED = 540;
const MIN_SPEED = -240;
const LINEAR_DAMP = 0.996;
const LEAN_TORQUE = 7.0;
const ANG_DAMP = 0.985;
const CHASSIS_W = 60;
const CHASSIS_H = 22;
const HEAD_R = 8;
const WHEEL_R = 10;
const BOUNCE = 0.22;           // vertical bounce on ground contact
const PX_PER_M = 10;           // HUD distance scale
const BEST_KEY = 'pg-faceplant-best';

// ── terrain helpers ── (UNCHANGED — physics + ribbon both read these)
function groundAt(terrain, x) {
  if (x <= terrain[0].x) return terrain[0].y;
  if (x >= terrain[terrain.length - 1].x) return terrain[terrain.length - 1].y;
  for (let i = 1; i < terrain.length; i++) {
    const a = terrain[i - 1], b = terrain[i];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * t;
    }
  }
  return terrain[0].y;
}
function slopeAt(terrain, x) {
  // Forward-difference slope approximation.
  const e = 2;
  return (groundAt(terrain, x + e) - groundAt(terrain, x - e)) / (2 * e);
}
const inSpikeZone = (spikes, x) => spikes.some((s) => x >= s.x0 && x <= s.x1);

// Best-distance persistence — meters reached per course index.
function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {}; }
  catch { return {}; }
}
function saveBest(courseIdx, meters) {
  try {
    const all = loadBest();
    if ((all[courseIdx] || 0) >= meters) return all[courseIdx];
    all[courseIdx] = meters;
    localStorage.setItem(BEST_KEY, JSON.stringify(all));
    return meters;
  } catch { return meters; }
}

// ── rider pose (bike-local coords) ── (UNCHANGED)
// Shared by the renderer and the head-collision check so leaning forward
// genuinely moves your head toward the dirt. lean ∈ [-1 back .. +1 fwd].
function riderPose(lean, pedal) {
  const hip = { x: -7, y: -CHASSIS_H / 2 - 4 };
  const aT = 0.5 + lean * 0.45;                       // torso tilt from vertical
  const chest = { x: hip.x + Math.sin(aT) * 17, y: hip.y - Math.cos(aT) * 17 };
  const head  = { x: chest.x + Math.sin(aT - 0.12) * 10, y: chest.y - Math.cos(aT - 0.12) * 10 };
  const hand  = { x: 21, y: -CHASSIS_H / 2 - 6 };
  const elbow = { x: (chest.x + hand.x) / 2, y: (chest.y + hand.y) / 2 + 4.5 };
  const crank = { x: 2, y: 7 };
  const footF = { x: crank.x + Math.cos(pedal) * 7, y: crank.y + Math.sin(pedal) * 7 };
  const footB = { x: crank.x - Math.cos(pedal) * 7, y: crank.y - Math.sin(pedal) * 7 };
  const kneeF = { x: (hip.x + footF.x) / 2 + 4, y: (hip.y + footF.y) / 2 - 4 };
  const kneeB = { x: (hip.x + footB.x) / 2 + 4, y: (hip.y + footB.y) / 2 - 4 };
  return { hip, chest, head, hand, elbow, crank, footF, footB, kneeF, kneeB };
}

// ── ragdoll (verlet points + stick constraints) ── (UNCHANGED)
function makeRagdoll(bike, lean) {
  const pose = riderPose(lean, 0);
  const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
  const toWorld = (p) => ({
    x: bike.x + p.x * cos - p.y * sin,
    y: bike.y + p.x * sin + p.y * cos,
  });
  const mk = (local, fling) => {
    const w = toWorld(local);
    return {
      x: w.x, y: w.y,
      px: w.x - (bike.vx / 60 + (Math.random() - 0.5) * 4),
      py: w.y - (bike.vy / 60 - fling - Math.random() * 2.5),
      r: 3,
    };
  };
  const pts = {
    head:  mk(pose.head, 4),  chest: mk(pose.chest, 3), hip: mk(pose.hip, 2),
    elbow: mk(pose.elbow, 2), hand:  mk(pose.hand, 1),
    kneeF: mk(pose.kneeF, 1), footF: mk(pose.footF, 0),
    kneeB: mk(pose.kneeB, 1), footB: mk(pose.footB, 0),
  };
  pts.head.r = 6;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const stick = (a, b) => ({ a: pts[a], b: pts[b], len: dist(pts[a], pts[b]) });
  return {
    pts,
    sticks: [
      stick('head', 'chest'), stick('chest', 'hip'),
      stick('chest', 'elbow'), stick('elbow', 'hand'),
      stick('hip', 'kneeF'), stick('kneeF', 'footF'),
      stick('hip', 'kneeB'), stick('kneeB', 'footB'),
    ],
  };
}
function tickRagdoll(rd, terrain, dt) {
  const gy2 = GRAVITY * dt * dt;
  for (const k in rd.pts) {
    const p = rd.pts[k];
    const nx = p.x + (p.x - p.px) * 0.985;
    const ny = p.y + (p.y - p.py) * 0.985 + gy2;
    p.px = p.x; p.py = p.y; p.x = nx; p.y = ny;
    const g = groundAt(terrain, p.x) - p.r;
    if (p.y > g) {
      // Bounce + ground friction.
      p.py = p.y + (p.y - p.py) * 0.45;
      p.px = p.x - (p.x - p.px) * 0.55;
      p.y = g;
    }
  }
  for (let it = 0; it < 3; it++) {
    rd.sticks.forEach(({ a, b, len }) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const off = (d - len) / d / 2;
      a.x += dx * off; a.y += dy * off;
      b.x -= dx * off; b.y -= dy * off;
    });
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 2.5D plane mapping. Sim (x, y) → three world (x, -y, z). Sim y grows
// downward (screen coords); three +Y is up, so we negate.
// ──────────────────────────────────────────────────────────────────────────
const SY = -1;
const w2x = (x) => x;
const w2y = (y) => y * SY;

// Palette (shared by 3D materials + DOM HUD reuse where useful).
const PAL = {
  sky:    '#9fdcff',
  grass:  '#5cae45',
  grassTop: '#8edb66',
  dirt:   '#8a5a33',
  dirtDeep: '#5e3d22',
  frame:  '#ff4d6d',
  jersey: '#23365e',
  skin:   '#ffd1a6',
  helmet: '#f4f6f8',
  tire:   '#14181c',
  rim:    '#aab2bc',
  spike:  '#c9cfd8',
  dust:   '#c4a173',
};

// Deterministic hash for parallax hill placement (stable per boot).
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ──────────────────────────────────────────────────────────────────────────
// Three.js renderer. Built once on mount, rebuilt per course (rebuildLevel).
// render() reads the live sim state each frame. dispose() tears it all down.
// ──────────────────────────────────────────────────────────────────────────
function makeRenderer3D(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;            // bright meadow, per brief
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAL.sky);
  scene.fog = new THREE.Fog(0xcfeeff, 1400, 4200);

  // Side-on perspective follow camera looking down −Z at the z=0 play plane.
  const camera = new THREE.PerspectiveCamera(38, 1, 1, 12000);
  camera.position.set(0, 0, 900);
  scene.add(camera);

  // ── Lights — bright, cheerful, NOT dark. Key on the camera side (+Z).
  const hemi = new THREE.HemisphereLight(0xdff2ff, 0x6b8f5a, 1.0);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xfff4d8, 1.45);
  key.position.set(-260, 520, 760);    // camera-side, upper-left
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 2600;
  key.shadow.camera.left = -700;
  key.shadow.camera.right = 700;
  key.shadow.camera.top = 600;
  key.shadow.camera.bottom = -600;
  key.shadow.bias = -0.0006;
  scene.add(key);
  scene.add(key.target);

  // ── Sun disc + soft glow billboard, parked far behind.
  const sunGroup = new THREE.Group();
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false });
  const sunMesh = new THREE.Mesh(new THREE.CircleGeometry(120, 32), sunMat);
  sunGroup.add(sunMesh);
  const sunGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffeeaa, transparent: true, opacity: 0.4, fog: false, depthWrite: false,
  });
  const sunGlow = new THREE.Mesh(new THREE.CircleGeometry(300, 32), sunGlowMat);
  sunGlow.position.z = -2;
  sunGroup.add(sunGlow);
  sunGroup.position.set(0, 0, -3600);
  scene.add(sunGroup);

  // ── Clouds — billboard puffs that drift + parallax with the camera.
  const cloudGroup = new THREE.Group();
  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.9, fog: false, depthWrite: false,
  });
  const cloudGeo = new THREE.SphereGeometry(70, 10, 8);
  const CLOUD_N = 10;
  const clouds = [];
  for (let i = 0; i < CLOUD_N; i++) {
    const m = new THREE.Mesh(cloudGeo, cloudMat);
    const h = hash2(i * 1.7, 3.3);
    m.scale.set(1.6 + h * 1.4, 0.8 + h * 0.5, 1);
    clouds.push({ mesh: m, h, ox: hash2(i, 9.1), oy: hash2(i, 4.2) });
    cloudGroup.add(m);
  }
  scene.add(cloudGroup);

  // ── Parallax hill rows — three depths, procedural, behind the play plane.
  const hillGroup = new THREE.Group();
  scene.add(hillGroup);
  const hillRows = [];
  const hillRowDefs = [
    { z: -1700, color: 0x6e9e82, hMin: 320, hMax: 620, step: 520, par: 0.18 },
    { z: -1050, color: 0x4f8a5a, hMin: 280, hMax: 540, step: 440, par: 0.35 },
    { z: -560,  color: 0x3a6c44, hMin: 220, hMax: 460, step: 380, par: 0.55 },
  ];
  for (const row of hillRowDefs) {
    const mat = new THREE.MeshStandardMaterial({ color: row.color, roughness: 1, metalness: 0 });
    const geo = new THREE.CircleGeometry(1, 24, 0, Math.PI);    // dome
    const count = 22;
    const inst = new THREE.InstancedMesh(geo, mat, count);
    inst.frustumCulled = false;
    const baseY = w2y(VIEW_H + 40);     // sit on the bottom of the play band
    const _mm = new THREE.Matrix4(), _pp = new THREE.Vector3(), _qq = new THREE.Quaternion(), _ss = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const s = hash2(i * 2.1, row.z * 0.01);
      const hgt = row.hMin + s * (row.hMax - row.hMin);
      _pp.set(0, baseY, row.z);    // x set live in render for scrolling
      _qq.identity();
      _ss.set(row.step * (0.6 + s * 0.5), hgt, 1);
      _mm.compose(_pp, _qq, _ss);
      inst.setMatrixAt(i, _mm);
    }
    inst.instanceMatrix.needsUpdate = true;
    hillGroup.add(inst);
    hillRows.push({ inst, ...row, count, baseY });
  }
  const _hm = new THREE.Matrix4(), _hp = new THREE.Vector3(), _hq = new THREE.Quaternion(), _hs = new THREE.Vector3();

  // ── Level container (terrain ribbon, spikes, flag) — rebuilt per course.
  let levelGroup = new THREE.Group();
  scene.add(levelGroup);
  let levelGeos = [];
  let levelMats = [];
  let goalGroup = null;
  let courseEndX = 0;

  // ── Persistent bike + rider rig (survives course swaps).
  const RIDE_DEPTH = 14;        // how thick the bike/rider read in z
  const bikeGroup = new THREE.Group();   // chassis transform (pos + rotate)
  scene.add(bikeGroup);

  // Materials for the rig (tracked separately for disposal).
  const rigMats = [];
  const rigGeos = [];
  const mkMat = (opts) => { const m = new THREE.MeshStandardMaterial(opts); rigMats.push(m); return m; };
  const mkBasic = (opts) => { const m = new THREE.MeshBasicMaterial(opts); rigMats.push(m); return m; };
  const mkGeo = (g) => { rigGeos.push(g); return g; };

  const frameMat  = mkMat({ color: PAL.frame, roughness: 0.4, metalness: 0.3 });
  const engineMat = mkMat({ color: 0x1d242c, roughness: 0.6, metalness: 0.4 });
  const tireMat   = mkMat({ color: PAL.tire, roughness: 0.85, metalness: 0.1 });
  const rimMat    = mkMat({ color: PAL.rim, roughness: 0.4, metalness: 0.6 });
  const spokeMat  = mkBasic({ color: 0xd7e0e9 });
  const jerseyMat = mkMat({ color: PAL.jersey, roughness: 0.7 });
  const limbMat   = mkMat({ color: 0x1a2540, roughness: 0.7 });
  const skinMat   = mkMat({ color: PAL.skin, roughness: 0.7 });
  const helmetMat = mkMat({ color: PAL.helmet, roughness: 0.5 });
  const flameMat  = mkBasic({ color: 0xff8a3a, transparent: true, opacity: 0.9, fog: false });

  // Helper: build a wheel group (tire torus + rim + spokes + hub). Spin live.
  function buildWheel() {
    const g = new THREE.Group();
    const tire = new THREE.Mesh(mkGeo(new THREE.TorusGeometry(WHEEL_R, 2.2, 8, 20)), tireMat);
    g.add(tire);
    const rim = new THREE.Mesh(mkGeo(new THREE.TorusGeometry(WHEEL_R - 3.2, 0.8, 6, 20)), rimMat);
    g.add(rim);
    const spokeGeo = mkGeo(new THREE.CylinderGeometry(0.5, 0.5, (WHEEL_R - 3.2) * 2, 4));
    for (let i = 0; i < 5; i++) {
      const sp = new THREE.Mesh(spokeGeo, spokeMat);
      sp.rotation.z = i * (Math.PI / 5);
      g.add(sp);
    }
    const hub = new THREE.Mesh(mkGeo(new THREE.SphereGeometry(2.2, 8, 6)), engineMat);
    g.add(hub);
    g.castShadow = true;
    g.traverse((o) => { o.castShadow = true; });
    return g;
  }

  // Helper: a capsule-ish limb segment as a thin box (cheap, reads fine).
  function buildBox(w, h, d, mat) {
    const m = new THREE.Mesh(mkGeo(new THREE.BoxGeometry(w, h, d)), mat);
    m.castShadow = true;
    return m;
  }

  // Bike frame as a flat group in bike-local coords. We approximate the 2D
  // line frame with thin boxes oriented between joints. Built once.
  const frameAssembly = new THREE.Group();
  bikeGroup.add(frameAssembly);
  // engine block
  const engineBlock = buildBox(20, 10, RIDE_DEPTH, engineMat);
  engineBlock.position.set(-2, 1, 0);   // bike-local (note: sim-y down → flip later)
  frameAssembly.add(engineBlock);
  // frame tubes — each is a thin box we orient between two local points.
  // Points are in BIKE-LOCAL SIM coords (y down). We convert to world-y by
  // negating when placing into the group (group itself uses three coords).
  const tubeDefs = [
    [{ x: -CHASSIS_W / 2 + 6, y: CHASSIS_H / 2 + 8 }, { x: -7, y: -CHASSIS_H / 2 - 2 }], // seat stay
    [{ x: -CHASSIS_W / 2 + 6, y: CHASSIS_H / 2 + 8 }, { x: 2, y: 7 }],                   // chain stay
    [{ x: 2, y: 7 }, { x: -7, y: -CHASSIS_H / 2 - 2 }],                                  // seat tube
    [{ x: 2, y: 7 }, { x: 19, y: -CHASSIS_H / 2 - 3 }],                                  // down tube
    [{ x: -7, y: -CHASSIS_H / 2 - 2 }, { x: 19, y: -CHASSIS_H / 2 - 3 }],                // top tube
    [{ x: 19, y: -CHASSIS_H / 2 - 3 }, { x: CHASSIS_W / 2 - 6, y: CHASSIS_H / 2 + 8 }],  // fork
  ];
  const tubeGeo = mkGeo(new THREE.BoxGeometry(1, 1, 3.2));
  for (const [a, b] of tubeDefs) {
    const ax = a.x, ay = -a.y, bx = b.x, by = -b.y;   // flip to world-y
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 0.001;
    const tube = new THREE.Mesh(tubeGeo, frameMat);
    tube.scale.set(len, 3.2, 1);
    tube.position.set((ax + bx) / 2, (ay + by) / 2, 0);
    tube.rotation.z = Math.atan2(dy, dx);
    tube.castShadow = true;
    frameAssembly.add(tube);
  }
  // seat + handlebar nubs
  const seat = buildBox(14, 4, RIDE_DEPTH * 0.6, engineMat);
  seat.position.set(-5, CHASSIS_H / 2 + 1, 0);
  frameAssembly.add(seat);
  const bar = buildBox(5, 4, 3, engineMat);
  bar.position.set(21, CHASSIS_H / 2 + 5, 0);
  frameAssembly.add(bar);
  // exhaust flame (toggled by throttle)
  const flame = new THREE.Mesh(mkGeo(new THREE.ConeGeometry(3.5, 16, 6)), flameMat);
  flame.rotation.z = Math.PI / 2;       // point -x
  flame.position.set(-CHASSIS_W / 2 - 6, -2, 0);
  flame.visible = false;
  frameAssembly.add(flame);

  // Wheels — children of the bike group, positioned at the axles. Bike-local
  // axle y (sim down) → world y negated.
  const wheelR = buildWheel();
  const wheelF = buildWheel();
  wheelR.position.set(-CHASSIS_W / 2 + 6, -(CHASSIS_H / 2 + 8), 0);
  wheelF.position.set(CHASSIS_W / 2 - 6, -(CHASSIS_H / 2 + 8), 0);
  bikeGroup.add(wheelR);
  bikeGroup.add(wheelF);

  // ── Rider rig. We build a fixed set of segment meshes and re-place them
  // each frame from riderPose() (riding) or the ragdoll points (crash). All
  // children of riderGroup. For riding, riderGroup rides under the bike
  // transform; for ragdoll the segments are placed in WORLD coords and
  // riderGroup is reset to identity.
  const riderGroup = new THREE.Group();
  bikeGroup.add(riderGroup);
  // segments: legBack, torso, legFront, arm, head. Each a box we orient.
  const seg = {
    legBack: buildBox(1, 4, RIDE_DEPTH * 0.4, limbMat),
    torso:   buildBox(1, 5.5, RIDE_DEPTH * 0.55, jerseyMat),
    legFront:buildBox(1, 4, RIDE_DEPTH * 0.4, limbMat),
    armUp:   buildBox(1, 3.6, RIDE_DEPTH * 0.35, limbMat),
    armLo:   buildBox(1, 3.6, RIDE_DEPTH * 0.35, limbMat),
    legBackLo: buildBox(1, 4, RIDE_DEPTH * 0.4, limbMat),
    legFrontLo:buildBox(1, 4, RIDE_DEPTH * 0.4, limbMat),
  };
  for (const k in seg) riderGroup.add(seg[k]);
  const headMesh = new THREE.Mesh(mkGeo(new THREE.SphereGeometry(HEAD_R - 1, 14, 12)), skinMat);
  headMesh.castShadow = true;
  riderGroup.add(headMesh);
  const helmetMesh = new THREE.Mesh(
    mkGeo(new THREE.SphereGeometry(HEAD_R, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6)),
    helmetMat,
  );
  helmetMesh.castShadow = true;
  riderGroup.add(helmetMesh);

  // Orient a segment box between two world-local points (in three coords).
  function placeSeg(mesh, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 0.001;
    mesh.position.set((ax + bx) / 2, (ay + by) / 2, 0);
    mesh.scale.y = len;
    mesh.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;  // box default up=+y
  }

  // ── Loose wheels (crash) — two extra wheel groups parked off until used.
  const looseWheelMeshes = [buildWheel(), buildWheel()];
  for (const m of looseWheelMeshes) { m.visible = false; scene.add(m); }
  // Wrecked frame reuses frameAssembly via the bikeGroup transform (crashBike).

  // ── Particle pool — instanced cubes (dust, sparks, confetti, debris).
  const PART_N = 320;
  const partMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, vertexColors: true, fog: false });
  const partGeo = new THREE.BoxGeometry(1, 1, 1);
  const partMesh = new THREE.InstancedMesh(partGeo, partMat, PART_N);
  partMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  partMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PART_N * 3), 3);
  partMesh.frustumCulled = false;
  scene.add(partMesh);

  // Reusable temps — no allocation in render().
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3();
  const _p = new THREE.Vector3();
  const _c = new THREE.Color();

  function clearLevel() {
    scene.remove(levelGroup);
    levelGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
        else o.material.dispose?.();
      }
    });
    levelGeos = [];
    levelMats = [];
    goalGroup = null;
    levelGroup = new THREE.Group();
    scene.add(levelGroup);
  }

  // Build the extruded ground ribbon + spikes + flag for a course. The
  // ribbon's TOP edge is generated from the SAME height profile the physics
  // reads (groundAt), sampled densely for smoothness — the height DATA is
  // never changed, only finely interpolated for the mesh.
  function rebuildLevel(state) {
    clearLevel();
    camPrimed = false;
    const course = state.course;
    const terrain = course.terrain;
    courseEndX = state.courseEnd;

    const RIBBON_DEPTH = 220;       // z thickness of the ground slab
    const GRASS_BAND = 11;          // matches the 2D grass strip thickness
    const FLOOR_Y = w2y(VIEW_H + 400);   // deep bottom of the dirt body

    // Sample x densely across the whole course (does NOT alter data; uses
    // groundAt exactly as physics does).
    const minX = terrain[0].x;
    const maxX = terrain[terrain.length - 1].x;
    const STEP_X = 12;
    const xs = [];
    for (let x = minX; x < maxX; x += STEP_X) xs.push(x);
    xs.push(maxX);
    const N = xs.length;

    // ── Grass top strip — a ribbon following the surface, extruded in z.
    // Two rows of vertices (front z, back z) along the top; triangulated.
    {
      const topZ = RIDE_DEPTH + 8;
      const backZ = -RIBBON_DEPTH;
      const verts = [];
      const norms = [];
      // top surface: front edge + back edge per sample
      for (let i = 0; i < N; i++) {
        const x = xs[i];
        const y = w2y(groundAt(terrain, x));
        // front
        verts.push(x, y, topZ);
        // back
        verts.push(x, y, backZ);
      }
      const idx = [];
      for (let i = 0; i < N - 1; i++) {
        const a = i * 2, b = i * 2 + 1, cI = (i + 1) * 2, d = (i + 1) * 2 + 1;
        idx.push(a, b, cI, b, d, cI);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      void norms;
      const mat = new THREE.MeshStandardMaterial({ color: PAL.grass, roughness: 0.95, metalness: 0 });
      const m = new THREE.Mesh(geo, mat);
      m.receiveShadow = true;
      levelGroup.add(m);
      levelGeos.push(geo); levelMats.push(mat);

      // sunny top highlight line strip just above the surface
      const hlVerts = [];
      for (let i = 0; i < N; i++) {
        const x = xs[i];
        const y = w2y(groundAt(terrain, x));
        hlVerts.push(x, y + 1.5, topZ + 0.5);
        hlVerts.push(x, y + 1.5, topZ - 2);
      }
      const hlIdx = [];
      for (let i = 0; i < N - 1; i++) {
        const a = i * 2, b = i * 2 + 1, cI = (i + 1) * 2, d = (i + 1) * 2 + 1;
        hlIdx.push(a, b, cI, b, d, cI);
      }
      const hlGeo = new THREE.BufferGeometry();
      hlGeo.setAttribute('position', new THREE.Float32BufferAttribute(hlVerts, 3));
      hlGeo.setIndex(hlIdx);
      const hlMat = new THREE.MeshBasicMaterial({ color: PAL.grassTop });
      const hl = new THREE.Mesh(hlGeo, hlMat);
      levelGroup.add(hl);
      levelGeos.push(hlGeo); levelMats.push(hlMat);
    }

    // ── Dirt front face — a vertical wall from (surface + grass band) down to
    // the floor, on the front z plane so we read the dirt side.
    {
      const frontZ = RIDE_DEPTH + 8;
      const verts = [];
      for (let i = 0; i < N; i++) {
        const x = xs[i];
        const y = w2y(groundAt(terrain, x) + GRASS_BAND);
        verts.push(x, y, frontZ);       // top (just under grass band)
        verts.push(x, FLOOR_Y, frontZ); // bottom
      }
      const idx = [];
      for (let i = 0; i < N - 1; i++) {
        const a = i * 2, b = i * 2 + 1, cI = (i + 1) * 2, d = (i + 1) * 2 + 1;
        idx.push(a, b, cI, b, d, cI);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({ color: PAL.dirt, roughness: 1, metalness: 0 });
      const m = new THREE.Mesh(geo, mat);
      m.receiveShadow = true;
      levelGroup.add(m);
      levelGeos.push(geo); levelMats.push(mat);

      // grass band: thin colored strip on the front face between surface and
      // dirt top, so the green lip reads in 3D.
      const bVerts = [];
      for (let i = 0; i < N; i++) {
        const x = xs[i];
        const y0 = w2y(groundAt(terrain, x));
        const y1 = w2y(groundAt(terrain, x) + GRASS_BAND);
        bVerts.push(x, y0, frontZ + 0.4);
        bVerts.push(x, y1, frontZ + 0.4);
      }
      const bIdx = [];
      for (let i = 0; i < N - 1; i++) {
        const a = i * 2, b = i * 2 + 1, cI = (i + 1) * 2, d = (i + 1) * 2 + 1;
        bIdx.push(a, b, cI, b, d, cI);
      }
      const bGeo = new THREE.BufferGeometry();
      bGeo.setAttribute('position', new THREE.Float32BufferAttribute(bVerts, 3));
      bGeo.setIndex(bIdx);
      const bMat = new THREE.MeshStandardMaterial({ color: PAL.grass, roughness: 0.95 });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      levelGroup.add(bMesh);
      levelGeos.push(bGeo); levelMats.push(bMat);
    }

    // ── Spikes — steel cones standing on the surface inside each zone.
    for (const { x0, x1 } of course.spikes) {
      const positions = [];
      for (let x = x0; x <= x1; x += 14) positions.push(x);
      const count = positions.length;
      if (count === 0) continue;
      const geo = new THREE.ConeGeometry(6, 22, 4);
      const mat = new THREE.MeshStandardMaterial({
        color: PAL.spike, emissive: new THREE.Color(0x202830), emissiveIntensity: 0.25,
        roughness: 0.4, metalness: 0.5,
      });
      const inst = new THREE.InstancedMesh(geo, mat, count);
      inst.castShadow = true;
      for (let i = 0; i < count; i++) {
        const x = positions[i];
        const y = w2y(groundAt(terrain, x));
        _p.set(x, y + 11, RIDE_DEPTH + 6);
        _q.identity();
        _s.set(1, 1, 1);
        _m.compose(_p, _q, _s);
        inst.setMatrixAt(i, _m);
      }
      inst.instanceMatrix.needsUpdate = true;
      levelGroup.add(inst);
      levelGeos.push(geo); levelMats.push(mat);

      // red warning band — a flat emissive strip just above the surface.
      const wGeo = new THREE.PlaneGeometry(x1 - x0 + 16, 9);
      const wMat = new THREE.MeshBasicMaterial({ color: 0xc91e1e, transparent: true, opacity: 0.85 });
      const wMesh = new THREE.Mesh(wGeo, wMat);
      const cx = (x0 + x1) / 2;
      wMesh.position.set(cx, w2y(groundAt(terrain, cx)) - 5, RIDE_DEPTH + 7);
      levelGroup.add(wMesh);
      levelGeos.push(wGeo); levelMats.push(wMat);
    }

    // ── Goal flag — pole + checkered cloth (waves in render).
    {
      goalGroup = new THREE.Group();
      const gx = state.goalX;
      const gy = w2y(groundAt(terrain, gx));
      const poleGeo = new THREE.CylinderGeometry(1.6, 1.6, 100, 6);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xe8edf2, roughness: 0.5, metalness: 0.4 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(gx, gy + 50, RIDE_DEPTH + 4);
      pole.castShadow = true;
      goalGroup.add(pole);
      levelGeos.push(poleGeo); levelMats.push(poleMat);
      // checkered flag tiles
      const FW = 40, FH = 24, COLS = 4, ROWS = 2;
      const lightMat = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.6, side: THREE.DoubleSide });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.6, side: THREE.DoubleSide });
      levelMats.push(lightMat, darkMat);
      const tileGeo = new THREE.PlaneGeometry(FW / COLS, FH / ROWS);
      levelGeos.push(tileGeo);
      const flagCloth = new THREE.Group();
      for (let r = 0; r < ROWS; r++) {
        for (let cI = 0; cI < COLS; cI++) {
          const tile = new THREE.Mesh(tileGeo, (r + cI) % 2 === 0 ? lightMat : darkMat);
          tile.position.set(
            (cI + 0.5) * (FW / COLS),
            (r + 0.5) * (FH / ROWS) * -1,
            0,
          );
          tile.userData.col = cI;
          flagCloth.add(tile);
        }
      }
      flagCloth.position.set(gx, gy + 100 - FH / 2 - 0, RIDE_DEPTH + 4);
      goalGroup.add(flagCloth);
      goalGroup.userData.cloth = flagCloth;
      levelGroup.add(goalGroup);
    }
  }

  // ── Resize — manual (never sizeCanvasFluid; that grabs a 2D ctx).
  let camPrimed = false;
  let viewW = VIEW_W, viewH = VIEW_H;
  function resize(cssW, cssH) {
    viewW = Math.max(1, cssW);
    viewH = Math.max(1, cssH);
    renderer.setSize(viewW, viewH, false);
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();
  }

  // Camera distance so a chosen sim-x span frames like the 2D side camera.
  function camDistanceForSpan(spanX) {
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * Math.max(0.3, camera.aspect));
    return (spanX / 2) / Math.tan(hHalf);
  }

  // Pose the riding rider from riderPose() (bike-local). Boxes oriented
  // between joints, head/helmet placed at the head joint. All in bike-local
  // three coords (sim-y negated).
  function poseRider(lean, pedal, dip) {
    const p = riderPose(lean, pedal);
    // convert a local sim point to local three coords (y down→up, minus dip)
    const L = (pt) => ({ x: pt.x, y: -(pt.y + dip) });
    const hip = L(p.hip), chest = L(p.chest), head = L(p.head);
    const hand = L(p.hand), elbow = L(p.elbow);
    const kneeF = L(p.kneeF), footF = L(p.footF);
    const kneeB = L(p.kneeB), footB = L(p.footB);
    placeSeg(seg.legBack, hip.x, hip.y, kneeB.x, kneeB.y);
    placeSeg(seg.legBackLo, kneeB.x, kneeB.y, footB.x, footB.y);
    placeSeg(seg.torso, hip.x, hip.y, chest.x, chest.y);
    placeSeg(seg.legFront, hip.x, hip.y, kneeF.x, kneeF.y);
    placeSeg(seg.legFrontLo, kneeF.x, kneeF.y, footF.x, footF.y);
    placeSeg(seg.armUp, chest.x, chest.y, elbow.x, elbow.y);
    placeSeg(seg.armLo, elbow.x, elbow.y, hand.x, hand.y);
    headMesh.position.set(head.x, head.y, 0);
    helmetMesh.position.set(head.x, head.y + 1, 0);
    helmetMesh.rotation.z = -lean * 0.3;
  }

  // Pose the rider segments from ragdoll points (WORLD sim coords → three).
  function poseRagdoll(rd) {
    const pts = rd.pts;
    const T = (k) => ({ x: w2x(pts[k].x), y: w2y(pts[k].y) });
    const hip = T('hip'), chest = T('chest'), head = T('head');
    const hand = T('hand'), elbow = T('elbow');
    const kneeF = T('kneeF'), footF = T('footF');
    const kneeB = T('kneeB'), footB = T('footB');
    placeSeg(seg.legBack, hip.x, hip.y, kneeB.x, kneeB.y);
    placeSeg(seg.legBackLo, kneeB.x, kneeB.y, footB.x, footB.y);
    placeSeg(seg.torso, hip.x, hip.y, chest.x, chest.y);
    placeSeg(seg.legFront, hip.x, hip.y, kneeF.x, kneeF.y);
    placeSeg(seg.legFrontLo, kneeF.x, kneeF.y, footF.x, footF.y);
    placeSeg(seg.armUp, chest.x, chest.y, elbow.x, elbow.y);
    placeSeg(seg.armLo, elbow.x, elbow.y, hand.x, hand.y);
    headMesh.position.set(head.x, head.y, 0);
    helmetMesh.position.set(head.x, head.y, 0);
  }

  // ── Per-frame render. Reads sim state; advances no physics.
  function render(state, rawDt) {
    if (!state) return;
    const { bike, camX, particles, course } = state;
    const terrain = course.terrain;

    // Frame the same sim-x span the 2D camera showed (VIEW_W), centered on
    // the camera's sim viewport. camX is the sim-space viewport left edge.
    const span = VIEW_W;
    const centreSimX = camX + span / 2;
    const centreSimY = VIEW_H / 2;   // keep the play band vertically centered
    const camZ = camDistanceForSpan(span);
    const tx = w2x(centreSimX);
    const ty = w2y(centreSimY);

    if (!camPrimed) {
      camera.position.set(tx, ty, camZ);
      camPrimed = true;
    } else {
      camera.position.x += (tx - camera.position.x) * Math.min(1, rawDt * 12);
      camera.position.y += (ty - camera.position.y) * Math.min(1, rawDt * 10);
      camera.position.z += (camZ - camera.position.z) * Math.min(1, rawDt * 6);
    }
    camera.lookAt(camera.position.x, camera.position.y, 0);

    // Key light tracks the rider so shadows stay crisp on screen.
    key.position.set(w2x(bike.x) - 260, w2y(bike.y) + 520, 760);
    key.target.position.set(w2x(bike.x), w2y(bike.y), 0);
    key.target.updateMatrixWorld();

    // Sun + glow park up-right of the camera, far back.
    sunGroup.position.set(camera.position.x + span * 0.42, camera.position.y + 180, -3600);

    // Clouds drift + parallax behind the action.
    for (let i = 0; i < CLOUD_N; i++) {
      const c = clouds[i];
      const driftX = (state.t * (8 + c.h * 10) + c.ox * 2400) % 2600;
      const cx = camera.position.x * 0.85 - 1300 + driftX;
      const cy = camera.position.y + 120 + c.oy * 260;
      c.mesh.position.set(cx, cy, -1400);
    }

    // Parallax hills — scroll their instance x by camera with per-row factor.
    for (const row of hillRows) {
      const baseShift = camera.position.x * (1 - row.par);
      for (let i = 0; i < row.count; i++) {
        const sX = hash2(i * 2.1, row.z * 0.01);
        const hgt = row.hMin + sX * (row.hMax - row.hMin);
        const w = row.step * (0.6 + sX * 0.5);
        // tile across a wide span, wrapped relative to the shifted base
        const span2 = row.count * row.step;
        let x = ((i * row.step - baseShift) % span2 + span2) % span2 + baseShift - span2 / 2;
        // re-anchor near camera
        x = camera.position.x + (((i * row.step - camera.position.x * row.par) % span2 + span2) % span2) - span2 / 2;
        _hp.set(x, row.baseY, row.z);
        _hq.identity();
        _hs.set(w, hgt, 1);
        _hm.compose(_hp, _hq, _hs);
        row.inst.setMatrixAt(i, _hm);
      }
      row.inst.instanceMatrix.needsUpdate = true;
    }

    // ── Goal flag wave.
    if (goalGroup) {
      const cloth = goalGroup.userData.cloth;
      if (cloth) {
        for (const tile of cloth.children) {
          const col = tile.userData.col;
          tile.position.z = Math.sin(state.t * 7 - col * 1.15) * 2.6 * ((col + 1) / 4);
        }
      }
    }

    // ── Bike + rider (riding) or wreckage (crashed).
    if (!state.crashBike) {
      bikeGroup.visible = true;
      riderGroup.visible = true;
      const dip = state.susp * 4.5;
      bikeGroup.position.set(w2x(bike.x), w2y(bike.y), 0);
      bikeGroup.rotation.z = -bike.angle;   // sim angle is in y-down space; flip
      // frame dip (suspension)
      frameAssembly.position.y = -dip;
      flame.visible = !!state.throttle;
      if (state.throttle) flame.scale.x = 0.8 + Math.random() * 0.6;
      // wheels spin (sim wheelSpin is y-down; flip sign for visual match)
      wheelR.rotation.z = -state.wheelSpin;
      wheelF.rotation.z = -state.wheelSpin;
      const squash = 1 - state.susp * 0.22;
      wheelR.scale.y = squash;
      wheelF.scale.y = squash;
      wheelR.position.y = -(CHASSIS_H / 2 + 8 + dip);
      wheelF.position.y = -(CHASSIS_H / 2 + 8 + dip);
      // rider
      riderGroup.position.set(0, 0, 0);
      riderGroup.rotation.z = 0;
      poseRider(state.lean, state.pedal, dip);
      // hide loose wheels
      looseWheelMeshes[0].visible = false;
      looseWheelMeshes[1].visible = false;
    } else {
      // wrecked frame tumbling on its own — drive bikeGroup from crashBike,
      // hide the (still-attached) wheels and rider, show loose wheels.
      const cb = state.crashBike;
      bikeGroup.visible = true;
      bikeGroup.position.set(w2x(cb.x), w2y(cb.y), 0);
      bikeGroup.rotation.z = -cb.angle;
      frameAssembly.position.y = 0;
      flame.visible = false;
      wheelR.visible = false;
      wheelF.visible = false;
      // loose wheels
      (state.looseWheels || []).forEach((w, i) => {
        const m = looseWheelMeshes[i];
        if (!m) return;
        m.visible = true;
        m.position.set(w2x(w.x), w2y(w.y), 2);
        m.rotation.z = -w.spin;
      });
      // ragdoll rider — segments placed in world coords; riderGroup neutral.
      if (state.ragdoll) {
        riderGroup.visible = true;
        // detach rider from bike transform by countering it: place segments
        // in world coords but riderGroup is a child of bikeGroup, so we move
        // it to scene root once.
        if (riderGroup.parent !== scene) {
          scene.add(riderGroup);   // reparent to world
        }
        riderGroup.position.set(0, 0, 0);
        riderGroup.rotation.z = 0;
        poseRagdoll(state.ragdoll);
      }
    }

    // ── Particles — dust/sparks/confetti/debris from the sim list.
    let pi = 0;
    for (const pt of particles) {
      if (pi >= PART_N) break;
      const a = Math.max(0, Math.min(1, pt.life / pt.max));
      _p.set(w2x(pt.x), w2y(pt.y), RIDE_DEPTH + 2);
      _q.identity();
      let sz;
      if (pt.type === 'dust') {
        sz = (pt.r || 3) * (1 + (1 - a) * 1.2);
        _c.set(PAL.dust);
      } else {
        sz = 3;
        _c.set(pt.color || '#ffe14f');
      }
      _s.set(sz, sz, sz);
      _m.compose(_p, _q, _s);
      partMesh.setMatrixAt(pi, _m);
      partMesh.setColorAt(pi, _c);
      pi++;
    }
    for (let k = pi; k < PART_N; k++) {
      _m.makeScale(0, 0, 0);
      partMesh.setMatrixAt(k, _m);
    }
    partMesh.count = PART_N;
    partMesh.instanceMatrix.needsUpdate = true;
    if (partMesh.instanceColor) partMesh.instanceColor.needsUpdate = true;

    renderer.render(scene, camera);
  }

  // Called by the host on reset/course-select to put the rider rig back under
  // the bike transform (undo the crash reparent).
  function resetRig() {
    if (riderGroup.parent !== bikeGroup) bikeGroup.add(riderGroup);
    riderGroup.position.set(0, 0, 0);
    riderGroup.rotation.z = 0;
    wheelR.visible = true;
    wheelF.visible = true;
    looseWheelMeshes[0].visible = false;
    looseWheelMeshes[1].visible = false;
  }

  function dispose() {
    clearLevel();
    scene.remove(levelGroup);
    // rig + persistent geometry/materials
    rigGeos.forEach((g) => g.dispose?.());
    rigMats.forEach((m) => m.dispose?.());
    hillRows.forEach((r) => { r.inst.geometry.dispose?.(); r.inst.material.dispose?.(); });
    cloudGeo.dispose(); cloudMat.dispose();
    sunMesh.geometry.dispose(); sunMat.dispose();
    sunGlow.geometry.dispose(); sunGlowMat.dispose();
    partGeo.dispose(); partMat.dispose();
    renderer.dispose();
  }

  return { scene, camera, renderer, rebuildLevel, render, resize, resetRig, dispose };
}

export default function FaceplantGame() {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const viewRef   = useRef({ cssW: VIEW_W, cssH: VIEW_H });
  const stateRef  = useRef(null);
  const rendererRef = useRef(null);
  const submittedRef = useRef(false);
  const courseIdxRef = useRef(0);
  const [courseIdx, setCourseIdx] = useState(0);
  const [time, setTime]       = useState(0);
  const [speed, setSpeed]     = useState(0);
  const [best, setBest]       = useState(() => loadBest()[0] || 0);
  const [status, setStatus]   = useState('ready'); // ready | playing | won | crashed
  const [reason, setReason]   = useState(null);     // 'spike' | 'head' | 'pit'

  const reset = () => {
    const course = COURSES[courseIdxRef.current];
    const startY = groundAt(course.terrain, 80);
    stateRef.current = {
      course,
      courseEnd: course.terrain[course.terrain.length - 1].x,
      goalX: course.terrain[course.terrain.length - 1].x - 40,
      bike: {
        x: 80, y: startY - 20,
        vx: 0, vy: 0,
        angle: 0, va: 0,
        onGround: true,
      },
      elapsed: 0,
      camX: 0,
      t: 0,                 // ambient clock (flag wave, clouds)
      lean: 0,              // eased lean input, -1 back .. +1 fwd
      wheelSpin: 0,
      pedal: 0,
      susp: 0,              // suspension squash 0..1
      airTime: 0,
      whooshed: false,
      bonus: 0,
      maxX: 80,
      throttle: false,
      slowMo: 0,            // seconds of 0.3x remaining (real time)
      stampT: -1,           // FACEPLANT stamp age, -1 = hidden
      ragdoll: null,
      crashBike: null,
      looseWheels: null,
      particles: [],
      floaters: [],
    };
    setTime(0);
    setSpeed(0);
    setBest(loadBest()[courseIdxRef.current] || 0);
    setStatus('ready');
    setReason(null);
    submittedRef.current = false;
    // Rebuild the 3D level + reset the rig so the new course renders at once.
    const r = rendererRef.current;
    if (r) { r.resetRig(); r.rebuildLevel(stateRef.current); }
  };

  const selectCourse = (i) => {
    courseIdxRef.current = i;
    setCourseIdx(i);
    reset();
  };

  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    // ── Build the WebGL renderer. Fail loud in DEV, never crash the host.
    let renderer = null;
    try { renderer = makeRenderer3D(canvas); }
    catch (err) { renderer = null; if (import.meta.env.DEV) console.error('[faceplant] WebGL init failed', err); }
    rendererRef.current = renderer;

    if (import.meta.env.DEV && renderer) {
      window.__happywheels3d = { scene: renderer.scene, camera: renderer.camera, renderer: renderer.renderer };
    }

    // Build the level for the already-reset state so it renders immediately.
    if (renderer && stateRef.current) { renderer.resetRig(); renderer.rebuildLevel(stateRef.current); }

    // ── Manual fluid sizing (NOT sizeCanvasFluid — it grabs a 2D context).
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const fit = () => {
      const cssW = Math.max(1, wrap.clientWidth);
      const cssH = Math.max(1, wrap.clientHeight);
      viewRef.current = { cssW, cssH };
      renderer?.resize(cssW, cssH);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const onOrient = () => fit();
    window.addEventListener('orientationchange', onOrient);

    const keys = {};
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      keys[e.code] = true;
      if (k === 'r') reset();
      if (status === 'ready' && (k === ' ' || k === 'arrowright' || k === 'd')) setStatus('playing');
    };
    const ku = (e) => { keys[e.key.toLowerCase()] = false; keys[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // Touch overlay flags — held-button model.
    const touchKeys = { throttle: false, brake: false, leanBack: false, leanFwd: false };
    wrap._setTouch = (id, v) => {
      if (id in touchKeys) touchKeys[id] = v;
      if (id === 'throttle' && v && status === 'ready') setStatus('playing');
    };

    // ── engine roll loop — pitch and gain track speed; quieter in air ──
    let roll = null;
    const stopRoll = () => {
      if (!roll) return;
      const r = roll; roll = null;
      try {
        const c = r.ctx;
        r.gain.gain.setTargetAtTime(0, c.currentTime, 0.05);
        r.osc.stop(c.currentTime + 0.3);
        r.sub.stop(c.currentTime + 0.3);
      } catch { /* ignore */ }
    };
    if (status === 'playing') {
      const c = ensureCtx();
      if (c) {
        try {
          const osc = c.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 52;
          const sub = c.createOscillator(); sub.type = 'triangle'; sub.frequency.value = 26;
          const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300; lp.Q.value = 0.8;
          const gain = c.createGain(); gain.gain.value = 0;
          osc.connect(lp); sub.connect(lp); lp.connect(gain); gain.connect(c.destination);
          osc.start(); sub.start();
          roll = { ctx: c, osc, sub, lp, gain };
        } catch { roll = null; }
      }
    }
    const unsubMute = subscribeMute((isMute) => { if (isMute) stopRoll(); });
    const updateRoll = (vx, grounded) => {
      if (!roll) return;
      const c = roll.ctx;
      const sp = Math.min(1, Math.abs(vx) / MAX_SPEED);
      const f = 50 + sp * 135;
      roll.osc.frequency.setTargetAtTime(f, c.currentTime, 0.06);
      roll.sub.frequency.setTargetAtTime(f * 0.5, c.currentTime, 0.06);
      roll.lp.frequency.setTargetAtTime(240 + sp * 900, c.currentTime, 0.08);
      const target = sp < 0.02 ? 0 : (grounded ? 0.028 + sp * 0.045 : 0.010 + sp * 0.018);
      roll.gain.gain.setTargetAtTime(target, c.currentTime, 0.08);
    };

    const spawnDust = (s, x, y, count, power) => {
      for (let i = 0; i < count; i++) {
        s.particles.push({
          type: 'dust',
          x: x + (Math.random() - 0.5) * 14,
          y: y - Math.random() * 4,
          vx: (Math.random() - 0.5) * 90 * power,
          vy: -30 - Math.random() * 70 * power,
          r: 2.5 + Math.random() * 3.5 * power,
          life: 0.5 + Math.random() * 0.4,
          max: 0.9,
        });
      }
    };

    let raf = 0;
    let last = performance.now();

    const step = () => {
      raf = requestAnimationFrame(step);
      const now = performance.now();
      const rawDt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const s = stateRef.current; if (!s) return;
      const { bike, course } = s;
      const terrain = course.terrain;

      // Slow-mo beat — the timer burns in real time, the sim runs at 0.3x.
      let dt = rawDt;
      if (s.slowMo > 0) { s.slowMo -= rawDt; dt = rawDt * 0.3; }
      if (s.stampT >= 0) s.stampT += rawDt;
      s.t += dt;

      if (status === 'playing') {
        s.elapsed += dt;
        if ((s.elapsed | 0) !== (s._hud | 0)) {
          s._hud = s.elapsed | 0;
          setTime(Math.round(s.elapsed));
        }

        // Controls
        const throttle = keys['d'] || keys['arrowright'] || keys['keyd'] || touchKeys.throttle;
        const brake    = keys['a'] || keys['arrowleft']  || keys['keya'] || touchKeys.brake;
        const leanBack = keys['w'] || keys['arrowup']    || keys['keyw'] || touchKeys.leanBack;
        const leanFwd  = keys['s'] || keys['arrowdown']  || keys['keys'] || touchKeys.leanFwd;
        s.throttle = !!throttle;

        if (throttle) bike.vx += THROTTLE_ACCEL * dt;
        if (brake)    bike.vx -= BRAKE_ACCEL   * dt;
        if (leanBack) bike.va -= LEAN_TORQUE   * dt;
        if (leanFwd)  bike.va += LEAN_TORQUE   * dt;

        // Eased rider lean for the articulated pose.
        const leanTarget = leanBack ? -1 : (leanFwd ? 1 : 0);
        s.lean += (leanTarget - s.lean) * Math.min(1, dt * 10);

        // Integrate
        bike.vy += GRAVITY * dt;
        bike.vx = Math.max(MIN_SPEED, Math.min(MAX_SPEED, bike.vx * LINEAR_DAMP));
        bike.va *= ANG_DAMP;
        bike.x  += bike.vx * dt;
        bike.y  += bike.vy * dt;
        bike.angle += bike.va * dt;
        s.maxX = Math.max(s.maxX, bike.x);

        // Wheel + pedal spin tracks ground speed.
        s.wheelSpin += (bike.vx / WHEEL_R) * dt;
        s.pedal += (bike.vx / 30) * dt;

        // Camera follows
        s.camX = Math.max(0, Math.min(s.courseEnd - VIEW_W, bike.x - VIEW_W * 0.32));

        // Ground collision: sample 3 bottom points of the chassis rotated by angle.
        const samples = [-CHASSIS_W / 2 + 6, 0, CHASSIS_W / 2 - 6];
        let grounded = false;
        const impactVy = bike.vy;
        for (const localX of samples) {
          const lx = localX;
          const ly = CHASSIS_H / 2 + 10;     // wheel bottom
          const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
          const wx = bike.x + lx * cos - ly * sin;
          const wy = bike.y + lx * sin + ly * cos;
          const gy = groundAt(terrain, wx);
          if (wy > gy) {
            const dyPush = wy - gy;
            bike.y -= dyPush;
            if (bike.vy > 0) bike.vy = -bike.vy * BOUNCE;
            const slope = slopeAt(terrain, wx);
            const target = Math.atan(slope);
            const dAng = target - bike.angle;
            bike.angle += dAng * 0.12;
            bike.va *= 0.9;
            grounded = true;
          }
        }

        // Landing: suspension squash + dust + thud scaled by impact.
        if (grounded && !bike.onGround) {
          const impact = Math.max(0, impactVy);
          if (impact > 160) {
            const power = Math.min(1, impact / 700);
            s.susp = Math.min(1, 0.3 + power);
            spawnDust(s, bike.x, groundAt(terrain, bike.x), Math.round(4 + power * 12), 0.5 + power);
            sfx.faceLand(power);
          }
          if (s.airTime > 1) {
            s.bonus += 200;
            s.floaters.push({
              x: bike.x, y: bike.y - 60, text: 'BIG AIR +200',
              life: 1.2, max: 1.2, color: '#ffe14f', size: 18,
            });
            sfx.faceBigAir();
          }
          s.airTime = 0;
          s.whooshed = false;
        }
        if (!grounded) {
          s.airTime += dt;
          if (s.airTime > 0.45 && !s.whooshed) { s.whooshed = true; sfx.faceAir(); }
        }
        bike.onGround = grounded;
        s.susp += (0 - s.susp) * Math.min(1, dt * 7);

        // Wheelie sparks — rear wheel scraping while leaning back at speed.
        if (grounded && leanBack && bike.vx > 280 && bike.angle < -0.12) {
          const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
          const rx = bike.x + (-CHASSIS_W / 2 + 6) * cos - (CHASSIS_H / 2 + 10) * sin;
          const ry = bike.y + (-CHASSIS_W / 2 + 6) * sin + (CHASSIS_H / 2 + 10) * cos;
          for (let i = 0; i < 2; i++) {
            s.particles.push({
              type: 'spark',
              x: rx, y: ry,
              vx: -bike.vx * 0.3 - Math.random() * 80,
              vy: -40 - Math.random() * 110,
              life: 0.25 + Math.random() * 0.2,
              max: 0.45,
              color: i % 2 ? '#ffe14f' : '#ffb347',
            });
          }
        }
        // Rolling dust kicked up behind the rear wheel at speed.
        if (grounded && Math.abs(bike.vx) > 220 && Math.random() < 0.35) {
          spawnDust(s, bike.x - CHASSIS_W / 2, groundAt(terrain, bike.x - CHASSIS_W / 2), 1, 0.4);
        }

        // Head contact = crash. Head position follows the lean pose.
        {
          const pose = riderPose(s.lean, s.pedal);
          const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
          const hx = bike.x + pose.head.x * cos - pose.head.y * sin;
          const hy = bike.y + pose.head.x * sin + pose.head.y * cos;
          if (hy + HEAD_R > groundAt(terrain, hx) && hx > 20) {
            crash('head');
            return;
          }
        }

        // Spike contact at any sampled chassis edge.
        if (inSpikeZone(course.spikes, bike.x)) {
          const gy = groundAt(terrain, bike.x);
          if (bike.y + CHASSIS_H / 2 + 10 > gy - 14) {
            crash('spike');
            return;
          }
        }

        // Falling off?
        if (bike.y > VIEW_H + 60) {
          crash('pit');
          return;
        }

        // Reached the goal
        if (bike.x >= s.goalX) {
          setStatus('won');
          sfx.faceWin();
          setBest(saveBest(courseIdxRef.current, Math.round(s.maxX / PX_PER_M)));
          // confetti burst at the flag
          const fy = groundAt(terrain, s.goalX) - 90;
          for (let i = 0; i < 36; i++) {
            s.particles.push({
              type: 'spark',
              x: s.goalX, y: fy,
              vx: (Math.random() - 0.5) * 320,
              vy: -60 - Math.random() * 260,
              life: 0.8 + Math.random() * 0.8,
              max: 1.6,
              color: ['#ffe14f', '#35f0c9', '#ff4d6d', '#f4f6f8'][i % 4],
            });
          }
          if (!submittedRef.current) {
            submittedRef.current = true;
            const score = Math.max(0, Math.round(1000 + Math.max(0, course.seconds - s.elapsed) * 10 + s.bonus));
            submitScore('happywheels', score, { time: Math.round(s.elapsed), course: courseIdxRef.current });
          }
        }

        setSpeed(Math.round(bike.vx));
        updateRoll(bike.vx, grounded);
      }

      // Crash aftermath: ragdoll, wrecked frame, loose wheels keep simulating.
      if (s.ragdoll) tickRagdoll(s.ragdoll, terrain, dt);
      if (s.crashBike) {
        const cb = s.crashBike;
        cb.vy += GRAVITY * dt;
        cb.x += cb.vx * dt;
        cb.y += cb.vy * dt;
        cb.angle += cb.va * dt;
        const gy = groundAt(terrain, cb.x) - (CHASSIS_H / 2 + 6);
        if (cb.y > gy) {
          cb.y = gy;
          if (cb.vy > 0) cb.vy = -cb.vy * 0.4;
          cb.vx *= 0.92;
          cb.va *= 0.85;
        }
        // ease the camera after the wreck so the tumble stays framed
        const target = Math.max(0, Math.min(s.courseEnd - VIEW_W, cb.x - VIEW_W * 0.4));
        s.camX += (target - s.camX) * Math.min(1, dt * 3);
      }
      (s.looseWheels || []).forEach((w) => {
        w.vy += GRAVITY * dt;
        w.x += w.vx * dt;
        w.y += w.vy * dt;
        w.spin += (w.vx / w.r) * dt;
        const gy = groundAt(terrain, w.x) - w.r;
        if (w.y > gy) {
          w.y = gy;
          if (w.vy > 0) w.vy = -w.vy * 0.45;
          w.vx *= 0.96;
        }
      });

      // Particles tick
      s.particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.type === 'dust' ? 60 : 500) * dt;
        if (p.type === 'dust') { p.vx *= 0.96; p.vy *= 0.96; }
        p.life -= dt;
      });
      s.particles = s.particles.filter((p) => p.life > 0);
      s.floaters.forEach((f) => { f.y -= 28 * dt; f.life -= dt; });
      s.floaters = s.floaters.filter((f) => f.life > 0);

      rendererRef.current?.render(s, rawDt);
    };

    const crash = (why) => {
      if (status !== 'playing') return;
      setStatus('crashed');
      setReason(why);
      const s = stateRef.current;
      const { bike } = s;
      stopRoll();
      sfx.faceCrash();
      setBest(saveBest(courseIdxRef.current, Math.round(s.maxX / PX_PER_M)));

      // Rider ragdolls free of the bike; wheels fly off; frame tumbles.
      s.ragdoll = makeRagdoll(bike, s.lean);
      s.crashBike = {
        x: bike.x, y: bike.y,
        vx: bike.vx * 0.45, vy: Math.min(bike.vy, 0) - 120,
        angle: bike.angle,
        va: (Math.random() - 0.5) * 10 + Math.sign(bike.vx || 1) * 7,
      };
      const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
      s.looseWheels = [-CHASSIS_W / 2 + 6, CHASSIS_W / 2 - 6].map((lx, i) => ({
        x: bike.x + lx * cos - (CHASSIS_H / 2 + 8) * sin,
        y: bike.y + lx * sin + (CHASSIS_H / 2 + 8) * cos,
        vx: bike.vx * (0.5 + Math.random() * 0.5) + (i === 0 ? -90 : 130),
        vy: -160 - Math.random() * 160,
        spin: bike.vx / WHEEL_R,
        r: WHEEL_R,
      }));

      // Dust cloud + debris burst at the wreck (crash poof).
      const gy = groundAt(s.course.terrain, bike.x);
      for (let i = 0; i < 18; i++) {
        s.particles.push({
          type: 'dust',
          x: bike.x + (Math.random() - 0.5) * 36,
          y: gy - Math.random() * 10,
          vx: (Math.random() - 0.5) * 200,
          vy: -40 - Math.random() * 130,
          r: 4 + Math.random() * 6,
          life: 0.7 + Math.random() * 0.6,
          max: 1.3,
        });
      }
      for (let i = 0; i < 16; i++) {
        s.particles.push({
          type: 'spark',
          x: bike.x, y: bike.y - CHASSIS_H,
          vx: (Math.random() - 0.5) * 360,
          vy: -120 - Math.random() * 160,
          life: 0.5 + Math.random() * 0.4,
          max: 0.9,
          color: i % 2 ? '#ff4d6d' : '#c91e1e',
        });
      }

      // Slow-mo beat + stamp.
      s.slowMo = 0.4;
      s.stampT = 0;

      if (!submittedRef.current) {
        submittedRef.current = true;
        submitScore('happywheels', 0, {
          crash: why,
          time: Math.round(s.elapsed),
          dist: Math.round(s.maxX / PX_PER_M),
          course: courseIdxRef.current,
        });
      }
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      try { ro.disconnect(); } catch { /* ignore */ }
      window.removeEventListener('orientationchange', onOrient);
      stopRoll();
      unsubMute();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      try { rendererRef.current?.dispose(); } catch { /* ignore */ }
      rendererRef.current = null;
      if (import.meta.env.DEV && window.__happywheels3d) { try { delete window.__happywheels3d; } catch { /* ignore */ } }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const bike = stateRef.current?.bike;
  const distM = bike ? Math.round(Math.min(bike.x, stateRef.current.courseEnd) / PX_PER_M) : 0;

  const reasonLabel = {
    spike: 'Spikes. Always the spikes.',
    head:  'Head, meet dirt.',
    pit:   'Off the edge of the world.',
  }[reason];

  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
  const setTouch = (id, v) => {
    const w = wrapRef.current;
    if (w && w._setTouch) w._setTouch(id, v);
  };

  return (
    <div className="face">
      <div className="face-bar">
        <span>Time <b>{time}s</b></span>
        <span>Distance <b>{distM}m</b></span>
        <span>Best <b>{best}m</b></span>
        <span>Speed <b>{speed}</b></span>
        <span style={{ display: 'inline-flex', gap: 6, marginLeft: 'var(--s-3, 12px)' }}>
          {COURSES.map((c, i) => (
            <button
              key={c.name}
              className={`btn btn-sm ${i === courseIdx ? 'btn-primary' : ''}`}
              onClick={() => selectCourse(i)}
              title={c.name}
            >
              {i + 1}
            </button>
          ))}
        </span>
        <span style={{marginLeft:'auto'}}>
          {status === 'ready' && <span style={{color:'var(--accent)'}}>Press → or Space to start</span>}
          {(status === 'crashed' || status === 'won') && <button className="btn btn-primary btn-sm" onClick={reset}>Restart</button>}
        </span>
      </div>
      <div ref={wrapRef} className="face-stage">
        <canvas ref={canvasRef} className="face-canvas"/>
        {isTouch && (
          <>
            {/* Brake / throttle pair — bottom-left */}
            <div style={{ position: 'absolute', bottom: 18, left: 18, display: 'flex', gap: 10, zIndex: 5 }}>
              <PillBtn label="BRAKE" wide onDown={() => setTouch('brake', true)}    onUp={() => setTouch('brake', false)} />
              <PillBtn label="GO"    wide onDown={() => setTouch('throttle', true)} onUp={() => setTouch('throttle', false)} />
            </div>
            {/* Lean stack — bottom-right, lean-back on top */}
            <div style={{ position: 'absolute', bottom: 18, right: 18, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 5 }}>
              <PillBtn label="LEAN UP" wide onDown={() => setTouch('leanBack', true)} onUp={() => setTouch('leanBack', false)} />
              <PillBtn label="LEAN DN" wide onDown={() => setTouch('leanFwd', true)}  onUp={() => setTouch('leanFwd', false)} />
            </div>
          </>
        )}
        {/* FACEPLANT stamp — DOM overlay over the wreck. */}
        {status === 'crashed' && (
          <div className="face-stamp">FACEPLANT</div>
        )}
      </div>
      {status === 'won' && (
        <div className="face-result" style={{color:'var(--accent)'}}>
          {COURSES[courseIdx].name} cleared · {time}s · bones intact
          {courseIdx < COURSES.length - 1 && (
            <button
              className="btn btn-primary btn-sm"
              style={{ marginLeft: 10 }}
              onClick={() => selectCourse(courseIdx + 1)}
            >
              Next course
            </button>
          )}
        </div>
      )}
      {status === 'crashed' && reason && (
        <div className="face-result" style={{color:'#ff4d6d'}}>{reasonLabel} · {distM}m</div>
      )}
      <div className="face-hint">→ throttle · ← brake · W/↑ lean back · S/↓ lean forward · R restart</div>
    </div>
  );
}

// Inline-styled touch pill — held-button model.
function PillBtn({ label, wide, onDown, onUp }) {
  const base = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: wide ? 96 : 56,
    height: 56,
    borderRadius: 28,
    background: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#fff',
    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
    fontSize: wide ? 11 : 18,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    userSelect: 'none',
    touchAction: 'none',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    pointerEvents: 'auto',
    cursor: 'pointer',
  };
  return (
    <button
      style={base}
      onPointerDown={(e) => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} onDown?.(); }}
      onPointerUp={(e) => { e.preventDefault(); onUp?.(); }}
      onPointerCancel={(e) => { e.preventDefault(); onUp?.(); }}
      onPointerLeave={(e) => { if (e.buttons === 0) onUp?.(); }}
      aria-label={label}
    >
      {label}
    </button>
  );
}
