import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { submitScore } from '../../scoreBus.js';
import { sfx } from '../../sound.js';

// Stickman Hook — one-button rope swinger.
//
// 3D rewrite. The gameplay is byte-for-byte the same as the original 2D
// canvas version: Verlet pendulum physics, the six hand-tuned anchor
// courses, the grab ranges, the rope reel + pump, platform landings,
// the goal/finish, bottomless-pit death + respawn, the per-level timer,
// the perfect-release bonus and the exact submitScore() call. ONLY the
// presentation moved to Three.js.
//
// 2.5D mapping — identical strategy to swingwire/index.jsx: the entire
// simulation runs in its original (x, y) space. We render it on the z = 0
// plane of a real perspective scene with
//   simX → +X,  simY → −Y   (sim y grows downward; three's +Y is up)
// and a perspective follow camera looking down −Z. Because the physics
// never touches z, every number — GRAVITY, rope length, platform AABBs,
// camera lead — keeps its exact 2D meaning. The depth, lighting, shadows,
// fog and parallax towers are pure decoration behind the play plane.

// ──────────────────────────────────────────────────────────────────────────
// Constants — IDENTICAL to the 2D version. Do not retune; the physics and
// scoring contract depend on these exact numbers.
// ──────────────────────────────────────────────────────────────────────────
const W = 700;
const H = 440;
const GRAVITY = 0.38;
const GRAB_RANGE = 240;
const GRAB_RANGE_GROUND = 310;   // forgiving first grab from a pad — no dead spots
const PLAT_TOP = 356;            // platform surface (world y)
const STAND_Y = PLAT_TOP - 26;   // pelvis height when standing
const PERFECT_SPEED = 10.5;      // px/frame at release for a "perfect"
const ROPE_REEL = 0.3;           // gentle reel-in per frame while attached

const LEVELS = [
  {
    length: 1800,
    start: [80, STAND_Y],
    anchors: [[220, 140], [440, 200], [680, 120], [920, 220], [1160, 140], [1400, 220], [1620, 160]],
    goal: 1760,
  },
  {
    length: 2400,
    start: [80, STAND_Y],
    anchors: [[220, 180], [430, 120], [620, 220], [840, 140], [1080, 200], [1300, 120], [1520, 220], [1720, 160], [1940, 240], [2180, 160]],
    goal: 2340,
  },
  {
    length: 2800,
    start: [80, STAND_Y],
    anchors: [[240, 180], [420, 260], [620, 160], [820, 240], [1020, 140], [1240, 220], [1480, 120], [1720, 220], [1960, 140], [2180, 240], [2420, 160], [2640, 200]],
    goal: 2760,
  },
  // 4 — wider gaps, taller drops
  {
    length: 3200,
    start: [80, STAND_Y],
    anchors: [[240, 160], [500, 230], [760, 120], [1020, 240], [1290, 130], [1560, 240], [1830, 120], [2090, 220], [2350, 130], [2610, 230], [2870, 140], [3080, 200]],
    goal: 3140,
  },
  // 5 — high-low ladder, every other swing is a climb
  {
    length: 3600,
    start: [80, STAND_Y],
    anchors: [[230, 160], [510, 250], [790, 110], [1070, 250], [1350, 120], [1630, 255], [1910, 110], [2190, 250], [2470, 120], [2750, 255], [3030, 130], [3310, 210], [3500, 160]],
    goal: 3540,
  },
  // 6 — long-jump finale, full-range grabs only
  {
    length: 4200,
    start: [80, STAND_Y],
    anchors: [[235, 160], [540, 235], [850, 110], [1160, 250], [1470, 120], [1780, 255], [2090, 110], [2400, 250], [2710, 120], [3020, 255], [3330, 120], [3640, 240], [3940, 150]],
    goal: 4140,
  },
];

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
// Deterministic 0..1 per integer index — keeps parallax props stable as
// the camera scrolls (no per-frame Math.random shimmer).
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hash2 = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ──────────────────────────────────────────────────────────────────────────
// Palette — dusk city, neon-warm accents. The fog colour is a light dusk so
// the scene reads bright, never near-black (wiki convention).
// ──────────────────────────────────────────────────────────────────────────
const PAL = {
  skyTop:    '#3a1a6e',
  skyMid:    '#8a44d8',
  skyBottom: '#ff8ec6',
  farTowers:  '#3a2168',
  midTowers:  '#2a1850',
  nearTowers: '#1a1030',
  platform:   '#241140',
  platformLip:'#ffd1ec',
  anchorIdle: '#5a3aa0',
  anchorReady:'#ffffff',
  anchorHook: '#ffe14f',
  rope:       '#ffe14f',
  ropeSpark:  '#fff6cc',
  body:       '#16181d',
  goal:       '#35f0c9',
  sun:        '#ffde96',
  fog:        '#5a3a86',          // light-ish dusk, not near-black
};

// ──────────────────────────────────────────────────────────────────────────
// 2.5D plane mapping. Sim (x, y) → three world (x, -y, z). Sim y grows
// downward (screen coords); three +Y is up, so we negate. Everything the
// physics computes stays in sim space; only the renderer applies this.
// ──────────────────────────────────────────────────────────────────────────
const w2x = (x) => x;
const w2y = (y) => -y;

// ──────────────────────────────────────────────────────────────────────────
// Three.js renderer. Builds the scene once per level (rebuildLevel), then
// render() each frame reads the live sim state. No allocation in the hot
// path beyond the pooled particles. dispose() tears everything down.
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
  renderer.toneMappingExposure = 1.45;          // bright, per the brief
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PAL.fog, 1200, 3200);   // light dusk, pushed out

  // Perspective camera looking down −Z at the z=0 play plane. A modest FOV
  // keeps the side-scroller read while giving real depth to the towers.
  const camera = new THREE.PerspectiveCamera(42, W / H, 1, 9000);
  camera.position.set(0, 0, 900);
  scene.add(camera);

  // ── Sky dome — vertical gradient via shader, fog:false so it stays put.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(PAL.skyTop) },
      uMid: { value: new THREE.Color(PAL.skyMid) },
      uBot: { value: new THREE.Color(PAL.skyBottom) },
    },
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      void main() {
        vWorld = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vWorld;
      uniform vec3 uTop, uMid, uBot;
      void main() {
        float h = clamp((normalize(vWorld).y + 0.35) * 0.85, 0.0, 1.0);
        vec3 col = mix(uBot, uMid, smoothstep(0.0, 0.55, h));
        col = mix(col, uTop, smoothstep(0.55, 1.0, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(5500, 24, 16), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  // ── Sun disc — low on the horizon, warm. Sits far behind, follows camera x.
  const sunMat = new THREE.MeshBasicMaterial({ color: PAL.sun, fog: false });
  const sunMesh = new THREE.Mesh(new THREE.CircleGeometry(120, 40), sunMat);
  sunMesh.position.set(0, -180, -3200);
  scene.add(sunMesh);
  const sunGlowMat = new THREE.MeshBasicMaterial({
    color: PAL.sun, transparent: true, opacity: 0.22, fog: false, depthWrite: false,
  });
  const sunGlow = new THREE.Mesh(new THREE.CircleGeometry(230, 40), sunGlowMat);
  sunGlow.position.set(0, -180, -3210);
  scene.add(sunGlow);

  // ── Lights. Key light on the CAMERA side (+Z) per wiki gotcha #1, so the
  // stickman and tower faces we see are lit, not silhouetted.
  const key = new THREE.DirectionalLight(0xfff0d8, 1.75);
  key.position.set(-280, 460, 820);     // camera-side, upper-left
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

  const hemi = new THREE.HemisphereLight(0xc9a8ff, 0x2a1840, 1.0);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const fill = new THREE.DirectionalLight(0xff9ed0, 0.45);
  fill.position.set(360, 180, 640);     // warm rim from the other camera-side
  scene.add(fill);

  // ── Level container — rebuilt per level. Holds towers, ground, platforms,
  // anchors, goal. The player rig, rope and particle pool live in persistent
  // objects so they survive level swaps.
  let levelGroup = new THREE.Group();
  scene.add(levelGroup);

  const anchorRecs = [];     // { core, coreMat, halo, haloMat, sx, sy }
  let goalRec = null;

  // ── Procedural window texture for towers — one shared CanvasTexture.
  function makeWindowTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#1a0e34';
    g.fillRect(0, 0, 64, 128);
    for (let y = 6; y < 128; y += 12) {
      for (let x = 6; x < 64; x += 12) {
        const r = (x * 31 + y * 17) % 7;
        if (r < 3) {
          g.fillStyle = r < 1 ? '#ffd182' : '#ff9ed0';
          g.globalAlpha = 0.45 + r * 0.14;
          g.fillRect(x, y, 5, 7);
        }
      }
    }
    g.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const windowTex = makeWindowTexture();

  // ── Player rig — an articulated humanoid. Bones are simple boxes/spheres
  // parented to pivots; render() poses them from sim velocity + attach state,
  // mirroring the 2D stickman's lean/reach/tuck/trail behaviour. Casts shadow.
  const playerGroup = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: PAL.body, roughness: 0.55, metalness: 0.1,
    emissive: new THREE.Color('#241830'), emissiveIntensity: 0.4,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: '#22242c', roughness: 0.5, metalness: 0.1,
    emissive: new THREE.Color('#2a1c3a'), emissiveIntensity: 0.4,
  });
  // Torso — leans via torsoPivot about the pelvis (origin).
  const torsoPivot = new THREE.Group();
  playerGroup.add(torsoPivot);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(4.2, 13, 6, 10), bodyMat);
  torso.position.set(0, -8.5, 0);   // capsule centre below shoulder, above pelvis
  torso.castShadow = true;
  torsoPivot.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(8.2, 18, 14), skinMat);
  head.position.set(0, -22, 0);
  head.castShadow = true;
  torsoPivot.add(head);
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const eye = new THREE.Mesh(new THREE.SphereGeometry(1.7, 8, 6), eyeMat);
  eye.position.set(3.4, -23.2, 6.5);
  torsoPivot.add(eye);

  // Limbs — a pivot at the joint, a box extending downward (−Y) so a Z
  // rotation swings the limb. Two arms (from shoulder) + two legs (from pelvis).
  function makeLimb(parent, jointX, jointY, len, thick) {
    const pivot = new THREE.Group();
    pivot.position.set(jointX, jointY, 0);
    parent.add(pivot);
    const geo = new THREE.CapsuleGeometry(thick, len, 4, 8);
    const m = new THREE.Mesh(geo, bodyMat);
    m.position.set(0, -len / 2 - thick, 0);
    m.castShadow = true;
    pivot.add(m);
    return pivot;
  }
  const SHOULDER_Y = -16;
  const armL = makeLimb(torsoPivot, -3.5, SHOULDER_Y, 15, 1.9);
  const armR = makeLimb(torsoPivot,  3.5, SHOULDER_Y, 15, 1.9);
  const legL = makeLimb(playerGroup, -3, 0, 18, 2.1);
  const legR = makeLimb(playerGroup,  3, 0, 18, 2.1);
  playerGroup.scale.set(1, 1, 1);
  scene.add(playerGroup);

  // ── Rope — a tube rebuilt each frame between player hand and the live
  // anchor, following a sagging quadratic so it reads like the 2D rope.
  const ropeMat = new THREE.MeshBasicMaterial({ color: PAL.rope });
  const ROPE_SEG = 14;
  let ropeCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
  );
  let ropeGeo = new THREE.TubeGeometry(ropeCurve, ROPE_SEG, 1.5, 6, false);
  const ropeMesh = new THREE.Mesh(ropeGeo, ropeMat);
  ropeMesh.frustumCulled = false;
  ropeMesh.visible = false;
  scene.add(ropeMesh);

  // ── Motion trail — pool of fading spheres behind the player.
  const TRAIL_N = 16;
  const trailMat = new THREE.MeshBasicMaterial({
    color: PAL.ropeSpark, transparent: true, opacity: 0.35, depthWrite: false,
  });
  const trailGeo = new THREE.SphereGeometry(1, 8, 6);
  const trailMesh = new THREE.InstancedMesh(trailGeo, trailMat, TRAIL_N);
  trailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  trailMesh.frustumCulled = false;
  scene.add(trailMesh);

  // ── Particle pool — instanced cubes for attach/release/land/finish bursts.
  const PART_N = 220;
  const partMat = new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, vertexColors: true,
  });
  const partGeo = new THREE.BoxGeometry(1, 1, 1);
  const partMesh = new THREE.InstancedMesh(partGeo, partMat, PART_N);
  partMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  partMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PART_N * 3), 3);
  partMesh.frustumCulled = false;
  scene.add(partMesh);

  // Render-local fx pool (visual only, fed from gameplay events).
  const fx = [];

  // Reusable temps — no allocation in render().
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3();
  const _p = new THREE.Vector3();
  const _c = new THREE.Color();

  // Materials/geometries created in rebuildLevel are tracked for disposal.
  let levelMats = [];
  let levelGeos = [];
  const track = (obj) => {
    if (obj.geometry) levelGeos.push(obj.geometry);
    if (obj.material) levelMats.push(obj.material);
    return obj;
  };

  function clearLevel() {
    scene.remove(levelGroup);
    levelGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
        else o.material.dispose?.();
      }
    });
    levelMats = [];
    levelGeos = [];
    anchorRecs.length = 0;
    goalRec = null;
    fx.length = 0;
    levelGroup = new THREE.Group();
    scene.add(levelGroup);
  }

  // Build all static + lit-state geometry for a level.
  function rebuildLevel(L) {
    clearLevel();
    camPrimed = false;       // snap the camera onto the new level next frame
    const worldW = L.length;

    // ── Ground / void slab — long box below the play plane at the platform
    // floor, so a fall reads as plunging past the rooftops into shadow.
    {
      const geo = new THREE.BoxGeometry(worldW + 1400, 320, 620);
      const mat = new THREE.MeshStandardMaterial({
        color: PAL.nearTowers, roughness: 0.95, metalness: 0.0,
      });
      const m = new THREE.Mesh(geo, mat);
      // Top of the slab sits well below the play plane so platforms float.
      m.position.set(worldW / 2, w2y(H + 200), -60);
      m.receiveShadow = true;
      levelGroup.add(m);
      track(m);
    }

    // ── Background tower rows — three parallax depths, procedural. Pure
    // decoration behind the play plane (negative z); never touch the physics.
    const towerDefs = [
      { z: -1500, step: 360, wMin: 160, wMax: 250, hMin: 520, hMax: 1200, tint: PAL.farTowers, lit: false },
      { z: -820,  step: 300, wMin: 140, wMax: 210, hMin: 440, hMax: 1000, tint: PAL.midTowers, lit: true },
      { z: -360,  step: 240, wMin: 110, wMax: 170, hMin: 360, hMax: 820,  tint: PAL.nearTowers, lit: true },
    ];
    const baseY = w2y(PLAT_TOP + 40);   // towers rise from just below the lane
    for (const row of towerDefs) {
      const mat = new THREE.MeshStandardMaterial({
        color: row.tint, roughness: 0.9, metalness: 0.05,
        map: row.lit ? windowTex : null,
        emissive: row.lit ? new THREE.Color('#3a2160') : new THREE.Color('#000000'),
        emissiveMap: row.lit ? windowTex : null,
        emissiveIntensity: row.lit ? 0.85 : 0,
      });
      levelMats.push(mat);
      const count = Math.ceil((worldW + 1600) / row.step) + 2;
      const geo = new THREE.BoxGeometry(1, 1, 1);
      levelGeos.push(geo);
      const inst = new THREE.InstancedMesh(geo, mat, count);
      inst.castShadow = false;
      inst.receiveShadow = false;
      for (let i = 0; i < count; i++) {
        const bx = -600 + i * row.step;
        const seed = hash2(i * 1.3 + row.z * 0.01, row.z);
        const bw = row.wMin + seed * (row.wMax - row.wMin);
        const bh = row.hMin + hash2(row.z, i * 2.1) * (row.hMax - row.hMin);
        _p.set(bx, baseY - bh / 2, row.z);    // baseY is the rooftop line; grow down
        _q.identity();
        _s.set(bw, bh, bw * 0.8);
        _m.compose(_p, _q, _s);
        inst.setMatrixAt(i, _m);
      }
      inst.instanceMatrix.needsUpdate = true;
      levelGroup.add(inst);
    }

    // ── Platforms — start pad + goal pad. Solid slabs on the play plane.
    const plats = [
      { x: L.start[0] - 70, w: 150, y: PLAT_TOP },
      { x: L.goal - 90, w: 190, y: PLAT_TOP },
    ];
    for (const pl of plats) {
      const geo = new THREE.BoxGeometry(pl.w, 70, 90);
      const mat = new THREE.MeshStandardMaterial({
        color: PAL.platform, roughness: 0.85, metalness: 0.08,
        emissive: new THREE.Color('#1a0e30'), emissiveIntensity: 0.4,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(pl.x + pl.w / 2, w2y(pl.y + 35), 0);
      m.castShadow = true;
      m.receiveShadow = true;
      levelGroup.add(m);
      track(m);
      // Bright lip on the top front edge.
      const lipGeo = new THREE.BoxGeometry(pl.w, 4, 92);
      const lipMat = new THREE.MeshBasicMaterial({ color: PAL.platformLip });
      const lip = new THREE.Mesh(lipGeo, lipMat);
      lip.position.set(pl.x + pl.w / 2, w2y(pl.y), 1);
      levelGroup.add(lip);
      track(lip);
    }

    // ── Anchors — visible 3D nodes (sphere stud + halo ring).
    for (const [ax, ay] of L.anchors) {
      const coreGeo = new THREE.SphereGeometry(7, 16, 12);
      const coreMat = new THREE.MeshStandardMaterial({
        color: '#ffffff', emissive: new THREE.Color(PAL.anchorIdle),
        emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.2,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(ax, w2y(ay), 0);
      core.castShadow = true;
      levelGroup.add(core);
      track(core);

      const haloGeo = new THREE.RingGeometry(11, 15, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: PAL.anchorIdle, transparent: true, opacity: 0.35,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(ax, w2y(ay), 0.5);
      levelGroup.add(halo);
      track(halo);

      anchorRecs.push({ core, coreMat, halo, haloMat, sx: ax, sy: ay });
    }

    // ── Goal — glowing flag pole + pennant on the far platform.
    {
      const poleGeo = new THREE.CylinderGeometry(2, 2, 84, 8);
      const poleMat = new THREE.MeshStandardMaterial({
        color: '#ffffff', emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.5,
        roughness: 0.4,
      });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(L.goal, w2y(PLAT_TOP - 42), 2);
      pole.castShadow = true;
      levelGroup.add(pole);
      track(pole);

      const flagGeo = new THREE.PlaneGeometry(34, 22);
      const flagMat = new THREE.MeshStandardMaterial({
        color: PAL.goal, emissive: new THREE.Color(PAL.goal), emissiveIntensity: 0.9,
        side: THREE.DoubleSide, roughness: 0.4,
      });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(L.goal + 17, w2y(PLAT_TOP - 69), 2);
      levelGroup.add(flag);
      track(flag);

      // Goal beacon glow.
      const glowGeo = new THREE.SphereGeometry(46, 16, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: PAL.goal, transparent: true, opacity: 0.12, depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(L.goal, w2y(PLAT_TOP - 50), 0);
      levelGroup.add(glow);
      track(glow);

      goalRec = { flag, flagMat, glow, glowMat };
    }
  }

  // ── Resize — manual, never via sizeCanvasFluid (that grabs a 2D ctx).
  let camPrimed = false;
  let viewW = W, viewH = H;
  function resize(cssW, cssH) {
    viewW = Math.max(1, cssW);
    viewH = Math.max(1, cssH);
    renderer.setSize(viewW, viewH, false);
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();
  }

  // Camera distance so a span of `spanX` sim-px is visible across the frame —
  // matches the 2D camera's horizontal field.
  function camDistanceForSpan(spanX) {
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * Math.max(0.3, camera.aspect));
    return (spanX / 2) / Math.tan(hHalf);
  }

  // Push a render-local burst (visual only) into the fx pool.
  function burst(simX, simY, color, n, spread) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = spread * (0.4 + Math.random() * 0.6);
      fx.push({
        x: w2x(simX), y: w2y(simY), z: (Math.random() - 0.5) * 24,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp + 50,
        vz: (Math.random() - 0.5) * sp * 0.6,
        life: 0.4 + Math.random() * 0.4, max: 0.8,
        size: 3 + Math.random() * 3, color,
      });
      if (fx.length > 160) fx.shift();
    }
  }

  // Pose one limb pivot to a target rotation (radians, about Z). 0 = straight
  // down. The 2D figure thinks in screen space (y down); a positive sim angle
  // rotates clockwise on screen, which is a negative Z rotation in world.
  function poseLimb(pivot, angle, bend) {
    pivot.rotation.z = -angle;
    // (single-segment limbs; `bend` reserved for future knee/elbow split)
    void bend;
  }

  // ── Per-frame render. Reads sim state; advances only render-local fx.
  function render(s, rawDt) {
    if (!s) return;
    const L = s.L;
    // Match the 2D camera span: it always showed W sim-px wide, with a speed
    // zoom-out (s.zoom < 1 widens the view). Reproduce via the frustum span.
    const baseSpan = W / s.zoom;

    // Camera target: centre on the player using the SAME lead/clamp math the
    // sim's camera already produced. In 2D, s.camX is the viewport left edge.
    const centreSimX = s.camX + W / 2;
    const centreSimY = H / 2;          // the 2D camera never panned vertically
    const camZ = camDistanceForSpan(baseSpan);

    const tx = w2x(centreSimX);
    const ty = w2y(centreSimY);
    if (!camPrimed) {
      camera.position.set(tx, ty, camZ);
      camPrimed = true;
    } else {
      camera.position.x += (tx - camera.position.x) * Math.min(1, rawDt * 14);
      camera.position.y += (ty - camera.position.y) * Math.min(1, rawDt * 14);
      camera.position.z += (camZ - camera.position.z) * Math.min(1, rawDt * 8);
    }
    camera.lookAt(camera.position.x, camera.position.y, 0);

    // Key light + shadow frustum track the player so shadows stay crisp.
    key.position.set(w2x(s.x) - 280, w2y(s.y) + 460, 820);
    key.target.position.set(w2x(s.x), w2y(s.y), 0);
    key.target.updateMatrixWorld();

    // Sky + sun follow the camera horizontally so they sit always behind.
    sky.position.set(camera.position.x, camera.position.y, 0);
    sunMesh.position.x = camera.position.x + 180;
    sunGlow.position.x = camera.position.x + 180;

    // ── Player rig pose. Mirrors the 2D stickman's lean / reach / tuck /
    // trail logic, expressed as bone rotations.
    const vx = s.x - s.px, vy = s.y - s.py;
    const speed = Math.hypot(vx, vy);
    const alive = !s.dead || s.deathT < 0.5;
    playerGroup.visible = alive;
    if (alive) {
      playerGroup.position.set(w2x(s.x), w2y(s.y), 0);

      // Torso lean: toward the anchor when attached, into velocity airborne.
      let leanAngle = 0;
      if (s.attached !== null) {
        const [ax, ay] = L.anchors[s.attached];
        // Sim-space direction to anchor; the torso should lean that way.
        leanAngle = Math.atan2(ax - s.x, -(ay - s.y)) * 0.55;
      } else if (!s.onGround) {
        leanAngle = clamp(vx * 0.05, -0.9, 0.9);
      }
      torsoPivot.rotation.z = -leanAngle;

      // Facing — eye + slight body twist by velocity sign.
      const face = vx >= 0 ? 1 : -1;
      eye.position.x = face * 3.4;
      playerGroup.rotation.y = face >= 0 ? 0 : Math.PI;

      // Arms.
      if (s.attached !== null) {
        // Reach toward the anchor: arms point up the rope.
        const [ax, ay] = L.anchors[s.attached];
        const reach = Math.atan2(ax - s.x, -(ay - s.y));
        // Convert to limb angle relative to torso (which is already leaned).
        const a = reach + leanAngle;
        poseLimb(armL, a + 0.18 - Math.PI, 0);
        poseLimb(armR, a - 0.18 - Math.PI, 0);
      } else if (!s.onGround && speed > 10) {
        // Tuck — arms hug forward toward the knees.
        const f = vx >= 0 ? 0.9 : -0.9;
        poseLimb(armL, f - 0.2, 0);
        poseLimb(armR, f + 0.2, 0);
      } else if (!s.onGround && vy > 2.5) {
        // Flail — arms thrown up, wobbling.
        const wob = Math.sin(s.tick * 0.45) * 0.4;
        poseLimb(armL, Math.PI - 0.6 + wob, 0);
        poseLimb(armR, -(Math.PI) + 0.6 - wob, 0);
      } else {
        // Idle / glide — relaxed at the sides.
        const sway = Math.sin(s.tick * 0.08) * 0.12;
        poseLimb(armL, 0.38 + sway, 0);
        poseLimb(armR, -0.38 - sway, 0);
      }

      // Legs.
      if (s.onGround && s.attached === null) {
        const bob = Math.sin(s.tick * 0.08) * 0.06;
        poseLimb(legL, 0.16 + bob, 0);
        poseLimb(legR, -0.16 - bob, 0);
      } else if (!s.onGround && speed > 10 && s.attached === null) {
        // Tuck — knees pulled up forward.
        const f = vx >= 0 ? 1.0 : -1.0;
        poseLimb(legL, f - 0.15, 0);
        poseLimb(legR, f + 0.15, 0);
      } else {
        // Trail opposite velocity, with a scissor phase.
        const sp = Math.max(speed, 0.001);
        // Trail direction in sim space, blended toward straight-down for slow.
        let tx2 = -vx / sp, ty2 = -vy / sp;
        const blend = clamp(speed / 8, 0, 0.8);
        tx2 = tx2 * blend; ty2 = ty2 * blend + (1 - blend);
        const trailAng = Math.atan2(tx2, ty2);   // 0 = straight down
        const phase = Math.sin(s.tick * 0.3) * (s.attached !== null ? 0.22 : 0.12);
        poseLimb(legL, trailAng + 0.18 + phase, 0);
        poseLimb(legR, trailAng - 0.18 - phase, 0);
      }

      // Death tumble — spin as the figure falls away.
      if (s.dead) {
        playerGroup.rotation.z = s.deathT * 8;
      } else {
        playerGroup.rotation.z = 0;
      }

      // Subtle speed glow on the body.
      bodyMat.emissiveIntensity = 0.4 + Math.min(0.5, speed / 14 * 0.5);
    }

    // ── Rope — a sagging tube from the active anchor to the player's hands.
    if (s.attached !== null && alive && !s.dead) {
      const [ax, ay] = L.anchors[s.attached];
      const x0 = w2x(ax), y0 = w2y(ay);
      const x1 = w2x(s.x), y1 = w2y(s.y - 14);   // hands a touch above pelvis
      const d = Math.hypot(s.x - ax, s.y - ay) || 1;
      const slack = Math.max(0, s.ropeLen - d);
      let sag = 3 + slack * 0.55 + (1 - clamp(d / (s.ropeLen || 1), 0, 1)) * 8;
      if (s.attachT > 0) sag += Math.sin(s.attachT * 26) * 7 * s.attachT;
      // Sag pulls the control point DOWN in screen space → down in world (−Y).
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2 - sag;
      ropeCurve.v0.set(x0, y0, 0);
      ropeCurve.v1.set(mx, my, 2);
      ropeCurve.v2.set(x1, y1, 0);
      ropeMesh.geometry.dispose();
      ropeMesh.geometry = new THREE.TubeGeometry(ropeCurve, ROPE_SEG, 1.6, 6, false);
      ropeMesh.visible = true;
    } else {
      ropeMesh.visible = false;
    }

    // ── Anchors — nearest grabbable glow + hooked highlight. Compute the
    // same nearest-anchor affordance the 2D version drew.
    let nearest = -1;
    if (s.attached === null && !s.dead) {
      let bd = s.onGround ? GRAB_RANGE_GROUND : GRAB_RANGE;
      L.anchors.forEach(([ax, ay], i) => {
        const dd = Math.hypot(ax - s.x, ay - s.y);
        if (dd < bd) { bd = dd; nearest = i; }
      });
    }
    const tnow = performance.now();
    for (let i = 0; i < anchorRecs.length; i++) {
      const rec = anchorRecs[i];
      const inRange = Math.hypot(rec.sx - s.x, rec.sy - s.y) < GRAB_RANGE;
      const isNear = i === nearest;
      const isHooked = s.attached === i;
      const hot = isHooked || isNear;
      _c.set(isHooked ? PAL.anchorHook : hot ? PAL.anchorReady : PAL.anchorIdle);
      rec.coreMat.emissive.copy(_c);
      rec.coreMat.emissiveIntensity = isHooked ? 1.3 : hot ? 1.0 : inRange ? 0.7 : 0.45;
      rec.haloMat.color.set(isHooked ? PAL.anchorHook : hot ? PAL.anchorReady : PAL.anchorIdle);
      rec.haloMat.opacity = hot ? 0.6 : inRange ? 0.32 : 0.18;
      const pulse = hot ? 1.0 + 0.18 * Math.sin(tnow / 130) : 1.0;
      rec.halo.scale.set(pulse, pulse, pulse);
      rec.halo.rotation.z += rawDt * (hot ? 1.2 : 0.3);
    }

    // ── Goal pulse.
    if (goalRec) {
      const pulse = 0.6 + 0.4 * Math.sin(tnow / 260);
      goalRec.flagMat.emissiveIntensity = 0.7 + pulse * 0.5;
      goalRec.glowMat.opacity = 0.08 + pulse * 0.1;
      goalRec.flag.rotation.y = Math.sin(tnow / 200) * 0.25;
    }

    // ── Motion trail. Reads the sim's trail list.
    const trail = s.trail;
    for (let i = 0; i < TRAIL_N; i++) {
      const t = trail[trail.length - 1 - i];
      if (t && alive && !s.dead) {
        const f = (TRAIL_N - i) / TRAIL_N;
        _p.set(w2x(t.x), w2y(t.y), -2);
        _q.identity();
        const r = 5 * f;
        _s.set(r, r, r);
        _m.compose(_p, _q, _s);
      } else {
        _m.makeScale(0, 0, 0);
      }
      trailMesh.setMatrixAt(i, _m);
    }
    trailMesh.instanceMatrix.needsUpdate = true;

    // ── Particles — advance + draw render-local fx, plus the sim's dust.
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.x += f.vx * rawDt; f.y += f.vy * rawDt; f.z += f.vz * rawDt;
      f.vy -= 300 * rawDt;
      f.life -= rawDt;
      if (f.life <= 0) fx.splice(i, 1);
    }
    let pi = 0;
    // Sim dust (landing puffs), mapped to world space.
    for (const d of s.dust) {
      if (pi >= PART_N) break;
      _p.set(w2x(d.x), w2y(d.y), 0);
      _q.identity();
      const sz = d.size * (0.6 + d.life * 0.8);
      _s.set(sz, sz, sz);
      _m.compose(_p, _q, _s);
      partMesh.setMatrixAt(pi, _m);
      _c.set('#ffe6f5');
      partMesh.setColorAt(pi, _c);
      pi++;
    }
    // Render-local fx bursts.
    for (const f of fx) {
      if (pi >= PART_N) break;
      _p.set(f.x, f.y, f.z);
      _q.identity();
      const sz = f.size * (f.life / f.max);
      _s.set(sz, sz, sz);
      _m.compose(_p, _q, _s);
      partMesh.setMatrixAt(pi, _m);
      _c.set(f.color);
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

  function dispose() {
    clearLevel();
    scene.remove(levelGroup);
    // Persistent objects.
    playerGroup.traverse((o) => { o.geometry?.dispose?.(); });
    [bodyMat, skinMat, eyeMat].forEach((m) => m.dispose?.());
    [ropeMesh, trailMesh, partMesh, sky, sunMesh, sunGlow].forEach((o) => o.geometry?.dispose?.());
    [ropeMat, trailMat, partMat, skyMat, sunMat, sunGlowMat].forEach((m) => m.dispose?.());
    windowTex.dispose();
    renderer.dispose();
  }

  return { scene, camera, renderer, rebuildLevel, render, resize, dispose, burst };
}

// ──────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────
export default function StickmanHookGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef(null);
  const rendererRef = useRef(null);
  const statusRef = useRef('playing');
  const levelIdxRef = useRef(0);
  const deathsRef = useRef(0);
  const [levelIdx, setLevelIdx] = useState(0);
  const [status, setStatus] = useState('playing'); // 'playing' | 'won'
  const [finalTime, setFinalTime] = useState(null);

  const resetLevel = (idx) => {
    const L = LEVELS[idx];
    if (!L) return;
    stateRef.current = {
      L,
      x: L.start[0], y: L.start[1],
      px: L.start[0], py: L.start[1], // previous (for verlet)
      attached: null,                  // anchor index
      ropeLen: 0,
      grabHeld: false,
      camX: 0,
      zoom: 1,
      t0: performance.now(),
      elapsed: 0,
      onGround: true,
      attachT: 0,                      // elastic give right after attach
      flick: null,                     // rope snap-back after release
      trail: [],
      dust: [],
      perfects: 0,
      dead: false,
      deathT: 0,
      fadeIn: 0,
      tick: 0,
      plats: [
        { x: L.start[0] - 70, w: 150, y: PLAT_TOP },
        { x: L.goal - 90, w: 190, y: PLAT_TOP },
      ],
    };
    statusRef.current = 'playing';
    rendererRef.current?.rebuildLevel(L);
    setStatus('playing');
    setFinalTime(null);
  };

  // Keep refs in sync so the persistent RAF loop reads live values.
  useEffect(() => { levelIdxRef.current = levelIdx; }, [levelIdx]);
  useEffect(() => { statusRef.current = status; }, [status]);

  // Rebuild the sim state + 3D level when the level index changes.
  useEffect(() => {
    if (levelIdx < 0) return;
    if (rendererRef.current) resetLevel(levelIdx);
  }, [levelIdx]);

  // ── Boot the renderer + the single persistent simulation/render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;

    let renderer = null;
    try { renderer = makeRenderer3D(canvas); }
    catch (err) { renderer = null; if (import.meta.env.DEV) console.error('[stickman-hook] WebGL init failed', err); }
    rendererRef.current = renderer;

    if (import.meta.env.DEV && renderer) {
      window.__stickman3d = { scene: renderer.scene, camera: renderer.camera, renderer: renderer.renderer };
    }

    // Build the first level now that the renderer exists.
    resetLevel(levelIdxRef.current);

    // ── Manual fluid sizing (NOT sizeCanvasFluid — that grabs a 2D context,
    // locking the canvas out of WebGL). ResizeObserver + orientationchange.
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const fit = () => {
      const cssW = Math.max(1, wrap.clientWidth || W);
      const cssH = Math.max(1, wrap.clientHeight || H);
      renderer?.resize(cssW, cssH);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const onOrient = () => fit();
    window.addEventListener('orientationchange', onOrient);

    // ── Simulation helpers — UNCHANGED from the 2D version. ────────────────
    const tryAttach = (s) => {
      if (!s.grabHeld || s.attached !== null || s.dead) return;
      let best = -1, bestD = s.onGround ? GRAB_RANGE_GROUND : GRAB_RANGE;
      s.L.anchors.forEach(([ax, ay], i) => {
        const d = Math.hypot(ax - s.x, ay - s.y);
        if (d < bestD) { best = i; bestD = d; }
      });
      if (best >= 0) {
        s.attached = best;
        s.ropeLen = bestD;
        s.ropeMin = Math.max(80, bestD * 0.55);
        s.attachT = 1;
        s.flick = null;
        sfx.open();
        const [ax, ay] = s.L.anchors[best];
        rendererRef.current?.burst(ax, ay, PAL.ropeSpark, 8, 160);
      }
    };

    const spawnDust = (s, x, y, n, spread) => {
      for (let i = 0; i < n; i++) {
        s.dust.push({
          x: x + (Math.random() - 0.5) * spread,
          y: y + Math.random() * 3,
          vx: (Math.random() - 0.5) * 2.4,
          vy: -Math.random() * 1.6 - 0.3,
          size: 2 + Math.random() * 3,
          life: 1,
        });
      }
    };

    const step = () => {
      const s = stateRef.current;
      if (!s) { raf = requestAnimationFrame(step); return; }
      s.tick++;

      const playing = statusRef.current === 'playing';
      const levelIdxNow = levelIdxRef.current;

      if (playing && !s.dead) {
        tryAttach(s);

        // Verlet integration
        let vx = s.x - s.px;
        let vy = s.y - s.py;
        vx *= 0.999;
        vy *= 0.999;

        s.px = s.x; s.py = s.y;
        s.x += vx;
        s.y += vy + GRAVITY;

        // Rope constraint — soft right after attach (elastic give), then
        // stiff. Slow reel-in + tangential pump keep momentum fed.
        if (s.attached !== null) {
          const [ax, ay] = s.L.anchors[s.attached];
          s.ropeLen = Math.max(s.ropeMin || 80, s.ropeLen - ROPE_REEL);
          const sp = Math.hypot(vx, vy);
          if (sp > 0.5 && sp < 14) {
            s.px -= (vx / sp) * 0.06;
            s.py -= (vy / sp) * 0.06;
          }
          const dx = s.x - ax, dy = s.y - ay;
          const d = Math.hypot(dx, dy);
          if (d > s.ropeLen) {
            const stiff = s.attachT > 0 ? 0.55 : 1;
            const corr = ((d - s.ropeLen) / d) * stiff;
            s.x -= dx * corr;
            s.y -= dy * corr;
          }
        }
        if (s.attachT > 0) s.attachT = Math.max(0, s.attachT - 0.07);

        // Platforms — land on top surfaces only
        const feetPrev = s.py + 26;
        const feet = s.y + 26;
        let grounded = false;
        if (s.attached === null && feet >= feetPrev) {
          for (const p of s.plats) {
            if (s.x >= p.x && s.x <= p.x + p.w && feetPrev <= p.y + 6 && feet >= p.y) {
              const impact = s.y - s.py;
              s.y = p.y - 26;
              s.py = s.y;
              s.px = s.x - (s.x - s.px) * 0.86; // ground friction
              if (!s.onGround && impact > 1.4) {
                spawnDust(s, s.x, p.y, Math.min(14, 4 + impact * 2), 18);
                sfx.stomp();
              }
              grounded = true;
              break;
            }
          }
        }
        s.onGround = grounded;

        // timer
        s.elapsed = (performance.now() - s.t0) / 1000;

        // Win
        if (s.x >= s.L.goal) {
          const time = s.elapsed;
          setStatus('won');
          statusRef.current = 'won';
          setFinalTime(time);
          sfx.win();
          rendererRef.current?.burst(s.L.goal, PLAT_TOP - 50, PAL.goal, 30, 320);
          submitScore('stickman-hook', (levelIdxNow + 1) * 100 + s.perfects * 10, {
            level: levelIdxNow + 1,
            time: Math.round(time * 10) / 10,
            perfects: s.perfects,
          });
        }

        // Death — off the bottom or behind the left edge
        if (s.y > H + 70 || s.x < -40) {
          s.dead = true;
          s.deathT = 0;
          s.attached = null;
          deathsRef.current += 1;
          sfx.lose();
          rendererRef.current?.burst(s.x, clamp(s.y, 0, H), PAL.rope, 16, 220);
        }
      } else if (s.dead) {
        // quick fade, respawn at the start pad
        s.deathT += 1 / 30;
        if (s.deathT >= 0.55) {
          const [sx, sy] = s.L.start;
          s.x = sx; s.y = sy; s.px = sx; s.py = sy;
          s.attached = null;
          s.onGround = true;
          s.dead = false;
          s.fadeIn = 1;
          s.trail.length = 0;
          s.flick = null;
        }
      }
      if (s.fadeIn > 0) s.fadeIn = Math.max(0, s.fadeIn - 0.07);

      // ── camera: lead + speed zoom-out (UNCHANGED math) ──────────────────
      const vx2 = s.x - s.px, vy2 = s.y - s.py;
      const speed = Math.hypot(vx2, vy2);
      const lead = clamp(vx2 * 9, -110, 150);
      const target = clamp(s.x - W / 2 + 60 + lead, 0, s.L.length - W);
      s.camX += (target - s.camX) * 0.10;
      const zTarget = clamp(1 - Math.max(0, speed - 5) * 0.013, 0.86, 1);
      s.zoom += (zTarget - s.zoom) * 0.08;

      // ── effects updates ────────────────────────────────────────────────
      if (speed > 3.5 && !s.dead) {
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 16) s.trail.shift();
      } else if (s.trail.length) {
        s.trail.shift();
      }

      for (const d of s.dust) {
        d.x += d.vx; d.y += d.vy; d.vy += 0.06; d.life -= 0.04;
      }
      s.dust = s.dust.filter((d) => d.life > 0);

      if (s.flick) {
        s.flick.t -= 0.07;
        if (s.flick.t <= 0) s.flick = null;
      }

      // Render the 3D frame from the live sim state.
      rendererRef.current?.render(s, 1 / 60);
      raf = requestAnimationFrame(step);
    };

    let raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      try { ro.disconnect(); } catch {}
      window.removeEventListener('orientationchange', onOrient);
      try { rendererRef.current?.dispose(); } catch {}
      rendererRef.current = null;
      if (import.meta.env.DEV && window.__stickman3d) {
        try { delete window.__stickman3d; } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Controls — UNCHANGED semantics. ──────────────────────────────────────
  const onDown = () => { const s = stateRef.current; if (s) s.grabHeld = true; };
  const onUp = () => {
    const s = stateRef.current;
    if (!s) return;
    s.grabHeld = false;
    if (s.attached !== null) {
      const [ax, ay] = s.L.anchors[s.attached];
      const vx = s.x - s.px, vy = s.y - s.py;
      const speed = Math.hypot(vx, vy);
      s.flick = { ax, ay, px: s.x, py: s.y, t: 1 };
      if (speed > PERFECT_SPEED && vy < -1.5) {
        // released near the top of a fast arc — reward it
        s.perfects += 1;
        sfx.star();
        rendererRef.current?.burst(s.x, s.y, PAL.anchorHook, 14, 240);
      } else {
        sfx.bounce();
        rendererRef.current?.burst(s.x, s.y, PAL.rope, 8, 180);
      }
      s.attached = null;
    }
  };

  useEffect(() => {
    const kd = (e) => { if (e.code === 'Space') { e.preventDefault(); onDown(); } };
    const ku = (e) => { if (e.code === 'Space') { e.preventDefault(); onUp(); } };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  const next = () => {
    if (levelIdx < LEVELS.length - 1) setLevelIdx(levelIdx + 1);
    else setLevelIdx(0);
  };
  const doRetry = () => {
    const i = levelIdx;
    setLevelIdx(-1);
    setTimeout(() => setLevelIdx(i), 0);
  };

  return (
    <div className="hook">
      <div className="hook-bar">
        <span>Level <b>{levelIdx + 1}/{LEVELS.length}</b></span>
        <button className="btn btn-ghost btn-sm" onClick={doRetry}>Retry</button>
      </div>
      <div
        ref={wrapRef}
        className="hook-stage"
        style={{ position: 'relative', width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }}>
        <canvas
          ref={canvasRef}
          className="hook-canvas"
          onMouseDown={onDown}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={(e) => { e.preventDefault(); onDown(); }}
          onTouchEnd={(e) => { e.preventDefault(); onUp(); }}/>
      </div>
      {status === 'won' && (
        <div className="hook-bar">
          <span style={{color: 'var(--accent)', fontWeight: 700}}>
            Level cleared{finalTime != null ? ` in ${finalTime.toFixed(1)}s` : ''}
          </span>
          <button className="btn btn-primary btn-sm" onClick={next}>
            {levelIdx < LEVELS.length - 1 ? 'Next level' : 'Restart'}
          </button>
        </div>
      )}
      <div className="hook-hint">Hold Space / mouse / touch to grab the nearest anchor · release at the top of the arc</div>
    </div>
  );
}
