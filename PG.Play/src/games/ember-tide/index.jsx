// EMBER & TIDE — same-keyboard co-op platformer, now in real 3D.
//
// Two characters on one keyboard, asymmetric liquids:
//  • Ember (fire) dies in WATER.  Tide (water) dies in FIRE.
//  • ACID kills both. Treat it like "fake-safe" zones.
//  • Gems come in three flavours: red (Ember only), blue (Tide only), gold
//    (either). All gems must be collected before the doors accept a touch.
//  • Each character has their own door (orange ← Ember, blue ← Tide).
//    Both must be standing on their own door at the same time to win.
//
// Controls
//   Ember  — W A D  (W = jump, A/D = move).      R restart.
//   Tide   — ↑ ← →  (↑ = jump, ←/→ = move).      Esc exit.
//
// If either character dies the whole level resets. Level progress + deaths
// carry across attempts; on final win the combined score is submitted.
//
// 3D rewrite. The simulation — tile/collision grid, both players' physics,
// element hazards and who they kill, gem rules, the two-door win, death/
// restart, score, and every sfx call — is byte-for-byte identical to the 2D
// version. Only the *presentation* moved to Three.js.
//
// 2.5D mapping: the sim still runs on its original (x, y) plane in logical
// W × H pixels @ 32px tiles. The renderer maps it onto the z = 0 plane of a
// real perspective scene with
//    worldX → +X,  worldY → −Y   (sim y grows downward; three's +Y is up)
// and a perspective side camera looking down the −Z axis. Because the physics
// never touches z, every number — gravity, AABB collision, hazard boxes, the
// door/gem overlaps — keeps its exact 2D meaning. Depth, lighting, shadows,
// fog and the parallax cave are pure decoration. The camera frames BOTH
// characters (co-op): it centres on their midpoint and zooms to keep both on
// screen.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { submitScore } from '../../scoreBus.js';
import { consumeAdminStartLevel } from '../../utils/admin.js';
import { sfx } from '../../sound.js';

const T = 32;                       // tile size
const COLS = 26;
const ROWS = 15;
const W = COLS * T;                 // 832 — native level width
const H = ROWS * T;                 // 480 — native level height
const P_W = 22, P_H = 28;
const GRAVITY = 1700;
const MOVE_MAX = 220;
const GROUND_ACCEL = 2200;
const AIR_ACCEL = 1400;
const GROUND_FRICTION = 1900;
const JUMP_V = -560;
const COYOTE = 0.12;
const BUFFER = 0.11;
const RESPAWN_DELAY = 0.6;

/* ── level language ───────────────────────────────────────────
 *   #   solid tile
 *   .   empty
 *   F   fire pool (lethal to Tide)
 *   W   water pool (lethal to Ember)
 *   A   acid (lethal to both)
 *   r   red gem  (Ember only)
 *   b   blue gem (Tide only)
 *   y   gold gem (either)
 *   X   Ember's door
 *   O   Tide's door
 *   e   Ember spawn
 *   t   Tide spawn
 * ─────────────────────────────────────────────────────────────*/
const LEVELS = [
  {
    name: 'The Vestibule',
    tip: 'Ember takes W A D. Tide takes the arrows. Don\'t wade in each other\'s puddles.',
    grid: [
      '##########################',
      '#........................#',
      '#........................#',
      '#...e..........t.........#',
      '####........########.....#',
      '#.........................',
      '#....y........r...b......#',
      '#...###......#####.......#',
      '#........................#',
      '#........................#',
      '#....FF........WW........#',
      '#....FF........WW........#',
      '####...##########....#####',
      '#.X....................O.#',
      '##########################',
    ],
  },
  {
    name: 'Split the Hall',
    tip: 'You can\'t share paths. Both of you pick up at least one coloured gem.',
    grid: [
      '##########################',
      '#....e..........t........#',
      '#####..........###########',
      '#........................#',
      '#.....WW........FF.......#',
      '#.....WW........FF.......#',
      '####..##############.#####',
      '#...r............b.......#',
      '#...##..........##.......#',
      '#........y...............#',
      '#...AA.........AA........#',
      '#...AA.........AA........#',
      '###.########.#####.#######',
      '#X...........O...........#',
      '##########################',
    ],
  },
  {
    name: 'Counterweights',
    tip: 'Final run. Chain jumps, keep your feet dry or cool — whichever applies.',
    grid: [
      '##########################',
      '#.........................',
      '#..e.................t...#',
      '####................######',
      '#........................#',
      '#........................#',
      '#..r...FF......WW...b....#',
      '#.###..##......##..####..#',
      '#........................#',
      '#.........y..............#',
      '#....AA........FF........#',
      '#....AA........FF........#',
      '####.########.#####.######',
      '#X.........O.............#',
      '##########################',
    ],
  },
];

function parseLevel(idx) {
  const g = LEVELS[idx].grid;
  const solids = [];
  const hazards = [];
  const gems = [];
  const spawns = { ember: null, tide: null };
  const doors = { ember: null, tide: null };

  for (let r = 0; r < g.length; r++) {
    const row = g[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      const x = c * T, y = r * T;
      if (ch === '#') solids.push({ x, y, w: T, h: T });
      else if (ch === 'F') hazards.push({ x, y: y + T - 14, w: T, h: 14, kind: 'fire' });
      else if (ch === 'W') hazards.push({ x, y: y + T - 14, w: T, h: 14, kind: 'water' });
      else if (ch === 'A') hazards.push({ x, y: y + T - 14, w: T, h: 14, kind: 'acid' });
      else if (ch === 'r') gems.push({ x: x + T / 2, y: y + T / 2, kind: 'red', taken: false });
      else if (ch === 'b') gems.push({ x: x + T / 2, y: y + T / 2, kind: 'blue', taken: false });
      else if (ch === 'y') gems.push({ x: x + T / 2, y: y + T / 2, kind: 'gold', taken: false });
      else if (ch === 'X') doors.ember = { x, y: y - T, w: T, h: T * 2 };
      else if (ch === 'O') doors.tide  = { x, y: y - T, w: T, h: T * 2 };
      else if (ch === 'e') spawns.ember = { x: x + (T - P_W) / 2, y: y + (T - P_H) };
      else if (ch === 't') spawns.tide  = { x: x + (T - P_W) / 2, y: y + (T - P_H) };
    }
  }
  return { solids, hazards, gems, spawns, doors, tip: LEVELS[idx].tip, name: LEVELS[idx].name };
}

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ── 2.5D plane mapping. Sim (x, y) → three world (x, -y, z). Sim y grows
 * downward (screen coords); three +Y is up, so we negate. The physics never
 * sees z; only the renderer applies this. ───────────────────────────────── */
const SY = -1;
const w2x = (x) => x;
const w2y = (y) => y * SY;

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* ── element palette (shared by renderer) ──────────────────────────────── */
const POOL = {
  fire:  { base: '#5a160b', emissive: '#ff4d2a', glow: '#ff7a32', light: 0xff5a2a },
  water: { base: '#072a52', emissive: '#1f86ff', glow: '#5ab8ff', light: 0x3aa0ff },
  acid:  { base: '#26340c', emissive: '#9bdc1f', glow: '#c8ff4a', light: 0x9bdc1f },
};

/* ──────────────────────────────────────────────────────────────────────
 * Three.js renderer. Built once on mount. rebuildLevel() builds the static
 * geometry per level from the SAME grid the collision uses; render() reads
 * live sim state each frame; dispose() tears everything down.
 * ────────────────────────────────────────────────────────────────────── */
function makeRenderer3D(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#160a22', 600, 1700);

  // Perspective side camera looking down −Z at the z=0 play plane.
  const camera = new THREE.PerspectiveCamera(40, W / H, 1, 6000);
  camera.position.set(W / 2, -H / 2, 900);
  scene.add(camera);

  // ── Sky dome — dusk/cave vertical gradient (fog:false so it stays put).
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTop: { value: new THREE.Color('#2a1538') },
      uMid: { value: new THREE.Color('#1b0e2a') },
      uBot: { value: new THREE.Color('#070310') },
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
        vec3 col = mix(uBot, uMid, smoothstep(0.0, 0.5, h));
        col = mix(col, uTop, smoothstep(0.5, 1.0, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 24, 16), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  // ── Lights — bright, readable. Key on the CAMERA side (+Z) so the faces
  // we see are lit, not silhouetted.
  const key = new THREE.DirectionalLight(0xffe9cf, 1.5);
  key.position.set(W / 2 - 220, 360, 520);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 1800;
  key.shadow.camera.left = -700;
  key.shadow.camera.right = 700;
  key.shadow.camera.top = 520;
  key.shadow.camera.bottom = -520;
  key.shadow.bias = -0.0006;
  scene.add(key);
  scene.add(key.target);

  const hemi = new THREE.HemisphereLight(0xbfd2ff, 0x402a4a, 1.0);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const fill = new THREE.DirectionalLight(0xb09cff, 0.4);
  fill.position.set(W / 2 + 240, 180, 460);
  scene.add(fill);

  // Two pool lights repositioned each level to the nearest fire/water pools
  // for extra coloured bounce. Persistent objects (cheaper than per-pool).
  const poolLightA = new THREE.PointLight(POOL.fire.light, 0, 240, 2);
  const poolLightB = new THREE.PointLight(POOL.water.light, 0, 240, 2);
  scene.add(poolLightA, poolLightB);

  // ── Parallax background — pillars + far cave wall, rebuilt per level. Lives
  // in its own group at large −z.
  let bgGroup = new THREE.Group();
  scene.add(bgGroup);

  // ── Level container — tile blocks, pools, doors, gems. Rebuilt per level
  // from the unchanged grid. Player rigs live in persistent objects below.
  let levelGroup = new THREE.Group();
  scene.add(levelGroup);

  // Per-level tracked materials/geometries for disposal.
  let levelMats = [];
  let levelGeos = [];

  // Records the render loop animates.
  const gemRecs = [];     // { group, mat, gem }
  const poolRecs = [];    // { mat, haz, t0 }
  const doorRecs = [];    // { group, ringMat, who }

  // ── Character rig builder. A clear element-elemental silhouette: rounded
  // body, head, two arms, two legs, big eyes, a colour-tipped crest. Returns
  // an object of refs the render loop animates.
  function buildChar(coreCol, glowCol, accentCol) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: coreCol, emissive: new THREE.Color(glowCol),
      emissiveIntensity: 0.45, roughness: 0.4, metalness: 0.1,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: accentCol, emissive: new THREE.Color(accentCol),
      emissiveIntensity: 0.85, roughness: 0.35, metalness: 0.1,
    });
    const limbMat = new THREE.MeshStandardMaterial({
      color: coreCol, emissive: new THREE.Color(glowCol),
      emissiveIntensity: 0.3, roughness: 0.5,
    });
    const eyeWhite = new THREE.MeshStandardMaterial({ color: '#f4f8ff', roughness: 0.3 });
    const pupil = new THREE.MeshBasicMaterial({ color: '#0a0d16' });

    // Sim AABB is P_W × P_H (22×28). Build the rig in that footprint, centred
    // on the AABB centre so the group sits at the player's centre.
    const halfH = P_H / 2;
    // torso — rounded capsule-ish box
    const bodyGeo = new THREE.CapsuleGeometry(P_W / 2 - 1.5, P_H - 18, 4, 10);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, -2, 0);
    body.castShadow = true;
    group.add(body);
    // head
    const headGeo = new THREE.SphereGeometry(7.5, 18, 14);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, halfH - 6, 1);
    head.castShadow = true;
    group.add(head);
    // crest / flame-tip or water-fin on top of the head
    const crestGeo = new THREE.ConeGeometry(4, 11, 8);
    const crest = new THREE.Mesh(crestGeo, accentMat);
    crest.position.set(0, halfH + 4, 1);
    group.add(crest);
    const crestGeo2 = new THREE.ConeGeometry(2.4, 7, 8);
    const crestL = new THREE.Mesh(crestGeo2, accentMat);
    crestL.position.set(-4.5, halfH + 1, 1); crestL.rotation.z = 0.4;
    const crestR = new THREE.Mesh(crestGeo2, accentMat);
    crestR.position.set(4.5, halfH + 1, 1); crestR.rotation.z = -0.4;
    group.add(crestL, crestR);
    // eyes (forward, +z)
    const eyeGeo = new THREE.SphereGeometry(2.4, 12, 10);
    const eyeL = new THREE.Mesh(eyeGeo, eyeWhite);
    const eyeR = new THREE.Mesh(eyeGeo, eyeWhite);
    eyeL.position.set(-2.8, halfH - 6, 6.2);
    eyeR.position.set(2.8, halfH - 6, 6.2);
    group.add(eyeL, eyeR);
    const pupGeo = new THREE.SphereGeometry(1.1, 8, 8);
    const pupL = new THREE.Mesh(pupGeo, pupil);
    const pupR = new THREE.Mesh(pupGeo, pupil);
    pupL.position.set(-2.8, halfH - 6, 8.2);
    pupR.position.set(2.8, halfH - 6, 8.2);
    group.add(pupL, pupR);
    // arms
    const armGeo = new THREE.CapsuleGeometry(2.2, 7, 3, 6);
    const armL = new THREE.Mesh(armGeo, limbMat); armL.castShadow = true;
    const armR = new THREE.Mesh(armGeo, limbMat); armR.castShadow = true;
    armL.position.set(-(P_W / 2 + 0.5), 0, 0);
    armR.position.set(P_W / 2 + 0.5, 0, 0);
    group.add(armL, armR);
    // legs
    const legGeo = new THREE.CapsuleGeometry(2.6, 6, 3, 6);
    const legL = new THREE.Mesh(legGeo, limbMat); legL.castShadow = true;
    const legR = new THREE.Mesh(legGeo, limbMat); legR.castShadow = true;
    legL.position.set(-4.5, -halfH + 4, 0);
    legR.position.set(4.5, -halfH + 4, 0);
    group.add(legL, legR);
    // soft aura disc behind for the elemental glow
    const auraMat = new THREE.MeshBasicMaterial({
      color: glowCol, transparent: true, opacity: 0.18, depthWrite: false,
    });
    const aura = new THREE.Mesh(new THREE.SphereGeometry(P_H * 0.7, 14, 10), auraMat);
    aura.position.set(0, -1, -4);
    aura.scale.set(0.75, 1, 0.4);
    group.add(aura);

    scene.add(group);
    return {
      group, body, head, eyeL, eyeR, pupL, pupR, armL, armR, legL, legR, crest, crestL, crestR,
      mats: [bodyMat, accentMat, limbMat, eyeWhite, pupil, auraMat],
      geos: [bodyGeo, headGeo, crestGeo, crestGeo2, eyeGeo, pupGeo, armGeo, legGeo, aura.geometry],
      bodyMat, auraMat,
    };
  }

  const emberRig = buildChar('#ff6a2a', '#ff9a3a', '#ffd45a');
  const tideRig  = buildChar('#35c7ff', '#79e0ff', '#cdfaff');

  // ── Particle pool — instanced cubes. No per-frame allocation. Driven by a
  // render-local list fed by the loop's juice() events.
  const PART_N = 260;
  const partMat = new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, vertexColors: true,
  });
  const partGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
  const partMesh = new THREE.InstancedMesh(partGeo, partMat, PART_N);
  partMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  partMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PART_N * 3), 3);
  partMesh.frustumCulled = false;
  scene.add(partMesh);
  const particles = [];     // { x, y, vx, vy, life, max, col:[r,g,b] }

  // Reusable temps — no allocation in render().
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3();
  const _p = new THREE.Vector3();
  const _c = new THREE.Color();

  function disposeGroup(group) {
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material && o.material !== partMat) {
        if (Array.isArray(o.material)) o.material.forEach((mm) => mm.dispose?.());
        else o.material.dispose?.();
      }
    });
  }

  function clearLevel() {
    scene.remove(levelGroup); disposeGroup(levelGroup);
    scene.remove(bgGroup);    disposeGroup(bgGroup);
    levelMats.forEach((m) => m.dispose?.());
    levelGeos.forEach((g) => g.dispose?.());
    levelMats = []; levelGeos = [];
    gemRecs.length = 0; poolRecs.length = 0; doorRecs.length = 0;
    levelGroup = new THREE.Group();
    bgGroup = new THREE.Group();
    scene.add(bgGroup); scene.add(levelGroup);
  }

  // Beveled-top extruded tile block at sim cell (col,row).
  function addBlock(group, col, row, topMat, sideMat) {
    const geo = new THREE.BoxGeometry(T, T, 30);
    levelGeos.push(geo);
    // box face order: +x,-x,+y,-y,+z,-z. top is +y.
    const mats = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    const m = new THREE.Mesh(geo, mats);
    m.position.set(col * T + T / 2, w2y(row * T + T / 2), 0);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  function rebuildLevel(level) {
    clearLevel();
    camPrimed = false;

    // ── Parallax cave backdrop. Far wall + stalagmite pillar bands.
    const bands = [
      { z: -1100, col: '#1c0f2c', base: 200, amp: 120, step: 150, op: 1 },
      { z: -720,  col: '#28163c', base: 150, amp: 90,  step: 120, op: 0.96 },
      { z: -420,  col: '#341c4e', base: 120, amp: 70,  step: 96,  op: 0.92 },
    ];
    const floorY = w2y(H);
    for (const b of bands) {
      const count = Math.ceil((W + 1000) / b.step) + 3;
      const geo = new THREE.ConeGeometry(b.step * 0.75, 1, 6);
      levelGeos.push(geo);
      const mat = new THREE.MeshStandardMaterial({
        color: b.col, roughness: 1, metalness: 0,
        transparent: b.op < 1, opacity: b.op, fog: true,
      });
      levelMats.push(mat);
      const inst = new THREE.InstancedMesh(geo, mat, count);
      inst.frustumCulled = false;
      for (let i = 0; i < count; i++) {
        const hx = -500 + i * b.step;
        const hh = b.base + hash2(i * 2.3, b.z) * b.amp;
        _p.set(hx, floorY + hh / 2 - 30, b.z);
        _q.identity(); _s.set(1, hh, 1);
        _m.compose(_p, _q, _s);
        inst.setMatrixAt(i, _m);
      }
      inst.instanceMatrix.needsUpdate = true;
      bgGroup.add(inst);
    }
    // Far backing wall so the gradient never shows a hard seam behind pillars.
    {
      const geo = new THREE.PlaneGeometry(W * 3, H * 3);
      levelGeos.push(geo);
      const mat = new THREE.MeshBasicMaterial({ color: '#130a1f', fog: true });
      levelMats.push(mat);
      const wall = new THREE.Mesh(geo, mat);
      wall.position.set(W / 2, -H / 2, -1300);
      bgGroup.add(wall);
    }

    // ── Solid tiles, straight from the collision grid. Stone block: warm-lit
    // top, darker sides.
    const topMat = new THREE.MeshStandardMaterial({ color: '#4a2f5f', roughness: 0.9, metalness: 0.05 });
    const sideMat = new THREE.MeshStandardMaterial({ color: '#2b1a3a', roughness: 0.95, metalness: 0.04 });
    levelMats.push(topMat, sideMat);
    for (const t of level.solids) {
      const col = t.x / T, row = t.y / T;
      // Grass-style "exposed top" if the cell above is not solid.
      const aboveSolid = level.solids.some((o) => o.x === t.x && o.y === t.y - T);
      addBlock(levelGroup, col, row, aboveSolid ? sideMat : topMat, sideMat);
    }

    // ── Element pools — emissive 3D slabs sitting in the bottom of their tile,
    // exactly over the sim hazard box (x, y, w, h).
    for (const h of level.hazards) {
      const pal = POOL[h.kind];
      const geo = new THREE.BoxGeometry(h.w, h.h + 8, 26);
      levelGeos.push(geo);
      const mat = new THREE.MeshStandardMaterial({
        color: pal.base, emissive: new THREE.Color(pal.emissive),
        emissiveIntensity: 0.9, roughness: 0.35, metalness: 0.15,
      });
      levelMats.push(mat);
      const m = new THREE.Mesh(geo, mat);
      // slab sits flush with the tile floor; centre over the hazard box.
      m.position.set(h.x + h.w / 2, w2y(h.y + h.h / 2) - 2, 0);
      m.receiveShadow = true;
      levelGroup.add(m);
      poolRecs.push({ mat, haz: h, phase: hash2(h.x, h.y) * 6.28 });
    }

    // ── Doors — lit 3D portals. Frame + glowing inner panel + arch ring.
    const buildDoor = (d, who, frameCol, glowCol) => {
      if (!d) return;
      const group = new THREE.Group();
      const frameMat = new THREE.MeshStandardMaterial({ color: '#1a0f24', roughness: 0.7, metalness: 0.2 });
      levelMats.push(frameMat);
      const frameGeo = new THREE.BoxGeometry(d.w + 6, d.h + 6, 12);
      levelGeos.push(frameGeo);
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(d.x + d.w / 2, w2y(d.y + d.h / 2), -6);
      frame.castShadow = true; frame.receiveShadow = true;
      group.add(frame);
      // glowing inner portal
      const panelMat = new THREE.MeshStandardMaterial({
        color: frameCol, emissive: new THREE.Color(glowCol),
        emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.1,
        transparent: true, opacity: 0.92,
      });
      levelMats.push(panelMat);
      const panelGeo = new THREE.PlaneGeometry(d.w - 4, d.h - 6);
      levelGeos.push(panelGeo);
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(d.x + d.w / 2, w2y(d.y + d.h / 2), 1);
      group.add(panel);
      // arch keystone gem
      const ringMat = new THREE.MeshStandardMaterial({
        color: glowCol, emissive: new THREE.Color(glowCol),
        emissiveIntensity: 1.0, roughness: 0.3, metalness: 0.3,
      });
      levelMats.push(ringMat);
      const ringGeo = new THREE.OctahedronGeometry(5, 0);
      levelGeos.push(ringGeo);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(d.x + d.w / 2, w2y(d.y) + 4, 4);
      group.add(ring);
      levelGroup.add(group);
      doorRecs.push({ group, panelMat, ringMat, ring, who });
    };
    buildDoor(level.doors.ember, 'ember', '#3a1808', '#ff8a3a');
    buildDoor(level.doors.tide,  'tide',  '#062338', '#35c7ff');

    // ── Gems — spinning 3D crystals, colour-coded.
    const gemGeo = new THREE.OctahedronGeometry(8, 0);
    levelGeos.push(gemGeo);
    for (const g of level.gems) {
      const col = g.kind === 'red' ? '#ff4d6d' : g.kind === 'blue' ? '#35c7ff' : '#ffe14f';
      const mat = new THREE.MeshStandardMaterial({
        color: col, emissive: new THREE.Color(col), emissiveIntensity: 0.7,
        roughness: 0.2, metalness: 0.5, flatShading: true,
      });
      levelMats.push(mat);
      const group = new THREE.Group();
      const body = new THREE.Mesh(gemGeo, mat);
      body.castShadow = true;
      group.add(body);
      const glowMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.25, depthWrite: false });
      levelMats.push(glowMat);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(13, 12, 10), glowMat);
      group.add(glow);
      group.position.set(g.x, w2y(g.y), 0);
      levelGroup.add(group);
      gemRecs.push({ group, body, mat, glowMat, gem: g, phase: hash2(g.x, g.y) * 6.28 });
    }

    // Position the two coloured pool lights at the first fire / water pool.
    const firstFire = level.hazards.find((h) => h.kind === 'fire');
    const firstWater = level.hazards.find((h) => h.kind === 'water');
    if (firstFire) { poolLightA.position.set(firstFire.x + firstFire.w / 2, w2y(firstFire.y) + 20, 60); poolLightA.intensity = 0.9; }
    else poolLightA.intensity = 0;
    if (firstWater) { poolLightB.position.set(firstWater.x + firstWater.w / 2, w2y(firstWater.y) + 20, 60); poolLightB.intensity = 0.9; }
    else poolLightB.intensity = 0;
  }

  // ── Juice — visual-only effects requested by the loop on sim events.
  function spawnParticles(x, y, n, spread, col, speed, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      particles.push({
        x, y,
        vx: Math.cos(a) * speed * (0.4 + Math.random()),
        vy: -Math.abs(Math.sin(a)) * speed * (0.5 + Math.random()) - 30,
        life, max: life, col, grav: spread,
      });
      if (particles.length > PART_N) particles.shift();
    }
  }
  function juice(kind, info) {
    if (kind === 'gem') {
      const col = info.kind === 'red' ? [1, 0.3, 0.43] : info.kind === 'blue' ? [0.21, 0.78, 1] : [1, 0.88, 0.31];
      spawnParticles(info.x, info.y, 16, 1, col, 130, 0.6);
    } else if (kind === 'death') {
      // fire-in-water → steam (white-blue); water-in-fire → fizzle/spark.
      const col = info.who === 'ember' ? [0.55, 0.78, 1] : [1, 0.55, 0.25];
      spawnParticles(info.x, info.y, 24, 1, col, 150, 0.7);
    } else if (kind === 'land') {
      spawnParticles(info.x, info.y, 6, 1, [0.7, 0.65, 0.78], 70, 0.35);
    } else if (kind === 'win') {
      spawnParticles(info.x, info.y, 40, 1, [1, 0.85, 0.4], 200, 1.0);
    }
  }

  // ── Resize — manual (never via sizeCanvasFluid; that grabs a 2D ctx).
  let camPrimed = false;
  function resize(cssW, cssH) {
    const w = Math.max(1, cssW), h = Math.max(1, cssH);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // Camera distance so a given sim-px horizontal span fits across.
  function camDistanceForSpan(spanX) {
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * Math.max(0.4, camera.aspect));
    return (spanX / 2) / Math.tan(hHalf);
  }

  // Animate one character rig from sim state.
  function animChar(rig, p, t) {
    if (p.dead) { rig.group.visible = false; return; }
    rig.group.visible = true;
    rig.group.position.set(w2x(p.x + P_W / 2), w2y(p.y + P_H / 2), 0);
    rig.group.rotation.y = p.facing > 0 ? 0 : Math.PI;
    const running = p.onGround && Math.abs(p.vx) > 30;
    const stride = running ? Math.sin(t * 14) : 0;
    if (!p.onGround) {
      rig.legL.rotation.x = -0.5; rig.legR.rotation.x = 0.5;
      rig.armL.rotation.x = -0.7; rig.armR.rotation.x = -0.7;
    } else {
      rig.legL.rotation.x = stride * 0.8;
      rig.legR.rotation.x = -stride * 0.8;
      rig.armL.rotation.x = -stride * 0.7;
      rig.armR.rotation.x = stride * 0.7;
    }
    // crest flicker + glow breathe
    const flick = 0.4 + 0.2 * Math.sin(t * 9 + p.x);
    rig.crest.scale.y = 1 + flick * 0.3;
    rig.bodyMat.emissiveIntensity = 0.4 + flick * 0.2;
    rig.auraMat.opacity = 0.14 + 0.08 * (0.5 + 0.5 * Math.sin(t * 4));
  }

  function render(state, rawDt) {
    if (!state) return;
    const { ember, tide, level } = state;
    const t = performance.now() / 1000;

    // ── Camera frames BOTH characters (co-op). Centre on their midpoint and
    // pick a span that keeps both on screen with margin, clamped to the level.
    const ax = ember.x + P_W / 2, ay = ember.y + P_H / 2;
    const bx = tide.x + P_W / 2,  by = tide.y + P_H / 2;
    let cx = (ax + bx) / 2;
    let cy = (ay + by) / 2;
    // Required horizontal span: distance between players + padding, with a
    // floor (don't over-zoom) and a ceiling (don't show beyond the level).
    const spreadX = Math.abs(ax - bx);
    const spreadY = Math.abs(ay - by);
    let span = Math.max(spreadX + 320, (spreadY + 240) * camera.aspect, W * 0.62);
    span = Math.min(span, W + 140);
    // Clamp the centre so the framed window stays inside the playfield.
    const halfSpan = span / 2;
    const halfSpanY = halfSpan / camera.aspect;
    cx = Math.max(halfSpan - 70, Math.min(W - halfSpan + 70, cx));
    cy = Math.max(halfSpanY - 50, Math.min(H - halfSpanY + 50, cy));

    const camZ = camDistanceForSpan(span);
    const tx = w2x(cx), ty = w2y(cy);
    if (!camPrimed) {
      camera.position.set(tx, ty, camZ);
      camPrimed = true;
    } else {
      const k = Math.min(1, rawDt * 6);
      camera.position.x += (tx - camera.position.x) * k;
      camera.position.y += (ty - camera.position.y) * k;
      camera.position.z += (camZ - camera.position.z) * Math.min(1, rawDt * 4);
    }
    camera.lookAt(camera.position.x, camera.position.y, 0);
    sky.position.set(camera.position.x, camera.position.y, 0);

    // Key light tracks the midpoint so shadows stay crisp on screen.
    key.position.set(cx - 220, 360, 520);
    key.target.position.set(cx, w2y(cy), 0);
    key.target.updateMatrixWorld();

    // ── Pools — emissive shimmer.
    for (const rec of poolRecs) {
      rec.mat.emissiveIntensity = 0.75 + 0.3 * Math.sin(t * 3 + rec.phase);
    }
    // occasional pool ember/bubble particles
    if (poolRecs.length && Math.random() < 0.5) {
      const rec = poolRecs[(Math.random() * poolRecs.length) | 0];
      const h = rec.haz;
      const pal = POOL[h.kind];
      _c.set(pal.glow);
      particles.push({
        x: h.x + Math.random() * h.w, y: h.y,
        vx: (Math.random() - 0.5) * 12, vy: -20 - Math.random() * 30,
        life: 0.7, max: 0.7, col: [_c.r, _c.g, _c.b], grav: 0.3,
      });
      if (particles.length > PART_N) particles.shift();
    }

    // ── Gems — spin, bob, hide taken.
    for (const rec of gemRecs) {
      if (rec.gem.taken) { rec.group.visible = false; continue; }
      rec.group.visible = true;
      rec.body.rotation.y = t * 2 + rec.phase;
      rec.body.rotation.x = 0.3;
      rec.group.position.y = w2y(rec.gem.y) + Math.sin(t * 2 + rec.phase) * 3;
      rec.glowMat.opacity = 0.2 + 0.12 * (0.5 + 0.5 * Math.sin(t * 4 + rec.phase));
    }

    // ── Doors — keystone spin + glow breathe; brighten when all gems gone.
    const allGems = !level.gems.some((g) => !g.taken);
    for (const rec of doorRecs) {
      rec.ring.rotation.y = t * 1.5;
      const base = allGems ? 1.1 : 0.5;
      rec.ringMat.emissiveIntensity = base + 0.3 * Math.sin(t * 4);
      rec.panelMat.emissiveIntensity = (allGems ? 1.0 : 0.55) + 0.2 * Math.sin(t * 3);
    }

    // ── Characters.
    animChar(emberRig, ember, t);
    animChar(tideRig,  tide, t);

    // ── Particles.
    let pi = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
      const part = particles[i];
      part.life -= rawDt;
      if (part.life <= 0) { particles.splice(i, 1); continue; }
      part.x += part.vx * rawDt;
      part.y += part.vy * rawDt;
      part.vy += 220 * (part.grav ?? 1) * rawDt;
    }
    for (let i = 0; i < particles.length && pi < PART_N; i++) {
      const part = particles[i];
      const a = Math.max(0, part.life / part.max);
      _p.set(w2x(part.x), w2y(part.y), 4);
      _q.identity();
      const sz = 0.5 + a * 1.2;
      _s.set(sz, sz, sz);
      _m.compose(_p, _q, _s);
      partMesh.setMatrixAt(pi, _m);
      _c.setRGB(part.col[0], part.col[1], part.col[2]);
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

    // Shake → tiny exposure punch (visual only; shake also nudges the camera).
    if (state.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * state.shake * 0.6;
      camera.position.y += (Math.random() - 0.5) * state.shake * 0.6;
    }

    renderer.render(scene, camera);
  }

  function dispose() {
    clearLevel();
    scene.remove(levelGroup); scene.remove(bgGroup);
    [emberRig, tideRig].forEach((rig) => {
      scene.remove(rig.group);
      rig.mats.forEach((m) => m.dispose?.());
      rig.geos.forEach((g) => g.dispose?.());
    });
    sky.geometry.dispose();
    skyMat.dispose();
    partGeo.dispose();
    partMat.dispose();
    renderer.dispose();
  }

  return { scene, camera, renderer, rebuildLevel, render, resize, dispose, juice };
}

/* ──────────────────────────────────────────────────────────────────────
 * Component
 * ────────────────────────────────────────────────────────────────────── */
export default function EmberTideGame() {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const stateRef  = useRef(null);
  const rendererRef = useRef(null);
  const submittedRef = useRef(false);
  const [levelIdx, setLevelIdx] = useState(() => {
    const adminStart = consumeAdminStartLevel('fbwg');
    return adminStart != null ? Math.max(0, Math.min(2, adminStart)) : 0;
  });
  const [deaths,   setDeaths]   = useState(0);
  const [time,     setTime]     = useState(0);
  const [gemsGot,  setGemsGot]  = useState(0);
  const [gemsTotal,setGemsTotal]= useState(0);
  const [status,   setStatus]   = useState('playing');   // playing | won
  const [pop, setPop]           = useState(null);        // transient toast

  const loadLevel = (idx, keepDeaths = true) => {
    const parsed = parseLevel(idx);
    stateRef.current = {
      level: parsed,
      levelIdx: idx,
      ember: buildPlayer(parsed.spawns.ember, 'ember'),
      tide:  buildPlayer(parsed.spawns.tide,  'tide'),
      elapsed: 0,
      shake: 0,
    };
    rendererRef.current?.rebuildLevel(parsed);
    setGemsGot(0);
    setGemsTotal(parsed.gems.length);
    if (!keepDeaths) setDeaths(0);
    setStatus('playing');
  };

  useEffect(() => {
    loadLevel(levelIdx, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    // ── WebGL renderer (manual fluid sizing — NOT sizeCanvasFluid).
    let renderer = null;
    try { renderer = makeRenderer3D(canvas); }
    catch (err) { renderer = null; if (import.meta.env.DEV) console.error('[ember-tide] WebGL init failed', err); }
    rendererRef.current = renderer;
    if (renderer && stateRef.current) renderer.rebuildLevel(stateRef.current.level);

    if (import.meta.env.DEV && renderer) {
      window.__fbwg3d = { scene: renderer.scene, camera: renderer.camera, renderer: renderer.renderer };
    }

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const sizeCanvas = () => {
      const cssW = Math.max(320, Math.floor(wrap.clientWidth));
      const cssH = Math.max(180, Math.floor(wrap.clientHeight));
      renderer?.resize(cssW, cssH);
    };
    sizeCanvas();
    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(wrap);
    window.addEventListener('orientationchange', sizeCanvas);

    const keys = {};
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      keys[e.code] = true;
      if (k === 'r') {
        setPop({ text: 'Restart', at: performance.now() });
        setDeaths((d) => d + 1);
        loadLevel(levelIdx);
      }
    };
    const ku = (e) => {
      keys[e.key.toLowerCase()] = false;
      keys[e.code] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const clock = { last: performance.now() };
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s) return;
      if (status !== 'playing') {
        rendererRef.current?.render(s, dt);
        return;
      }

      s.elapsed += dt;
      if ((s.elapsed * 2 | 0) !== (s._hud | 0)) {
        s._hud = s.elapsed * 2;
        setTime(Math.round(s.elapsed));
      }

      const emberCtl = {
        left: keys['a']     || keys['keya'],
        right: keys['d']    || keys['keyd'],
        jump: keys['w']     || keys['keyw'],
      };
      const tideCtl = {
        left: keys['arrowleft'],
        right: keys['arrowright'],
        jump: keys['arrowup'],
      };

      const emberWasGround = s.ember.onGround;
      const tideWasGround = s.tide.onGround;
      stepPlayer(s, dt, s.ember, emberCtl);
      stepPlayer(s, dt, s.tide,  tideCtl);
      // landing dust (visual only)
      if (!emberWasGround && s.ember.onGround && !s.ember.dead) {
        rendererRef.current?.juice('land', { x: s.ember.x + P_W / 2, y: s.ember.y + P_H });
      }
      if (!tideWasGround && s.tide.onGround && !s.tide.dead) {
        rendererRef.current?.juice('land', { x: s.tide.x + P_W / 2, y: s.tide.y + P_H });
      }

      // Hazard checks
      const emberHit = hazardKilling(s.level.hazards, s.ember, 'ember');
      const tideHit  = hazardKilling(s.level.hazards, s.tide,  'tide');
      if (emberHit) {
        kill(s, 'ember');
        rendererRef.current?.juice('death', { x: s.ember.x + P_W / 2, y: s.ember.y + P_H / 2, who: 'ember' });
      }
      if (tideHit) {
        kill(s, 'tide');
        rendererRef.current?.juice('death', { x: s.tide.x + P_W / 2, y: s.tide.y + P_H / 2, who: 'tide' });
      }

      // Gem pickup
      let gained = 0;
      for (const g of s.level.gems) {
        if (g.taken) continue;
        const boxG = { x: g.x - 10, y: g.y - 10, w: 20, h: 20 };
        if (overlap({ x: s.ember.x, y: s.ember.y, w: P_W, h: P_H }, boxG)) {
          if (g.kind === 'red' || g.kind === 'gold') { g.taken = true; gained++; rendererRef.current?.juice('gem', g); }
        } else if (overlap({ x: s.tide.x, y: s.tide.y, w: P_W, h: P_H }, boxG)) {
          if (g.kind === 'blue' || g.kind === 'gold') { g.taken = true; gained++; rendererRef.current?.juice('gem', g); }
        }
      }
      if (gained) {
        setGemsGot((n) => n + gained);
      }

      // Doors — both must stand on their own door, all gems collected
      const remaining = s.level.gems.some((g) => !g.taken);
      if (!remaining && s.level.doors.ember && s.level.doors.tide) {
        const eb = { x: s.ember.x, y: s.ember.y, w: P_W, h: P_H };
        const tb = { x: s.tide.x,  y: s.tide.y,  w: P_W, h: P_H };
        if (overlap(eb, s.level.doors.ember) && overlap(tb, s.level.doors.tide)) {
          // Clear level
          setPop({ text: `${s.level.name} — cleared`, at: performance.now() });
          rendererRef.current?.juice('win', { x: s.ember.x + P_W / 2, y: s.ember.y + P_H / 2 });
          rendererRef.current?.juice('win', { x: s.tide.x + P_W / 2, y: s.tide.y + P_H / 2 });
          if (levelIdx + 1 >= LEVELS.length) {
            sfx.win();
            setStatus('won');
            if (!submittedRef.current) {
              submittedRef.current = true;
              const score = Math.max(0, Math.round(2000 - deaths * 50 - s.elapsed * 3));
              submitScore('fbwg', score, { deaths, time: Math.round(s.elapsed), levels: LEVELS.length });
            }
          } else {
            sfx.confirm();
            setLevelIdx((i) => i + 1);
            return;
          }
        }
      }

      s.shake = Math.max(0, s.shake - 0.4);
      rendererRef.current?.render(s, dt);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('orientationchange', sizeCanvas);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      try { rendererRef.current?.dispose(); } catch { /* ignore */ }
      rendererRef.current = null;
      if (import.meta.env.DEV && window.__fbwg3d) { try { delete window.__fbwg3d; } catch { /* ignore */ } }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx, status, deaths, gemsGot, gemsTotal]);

  const restart = () => {
    submittedRef.current = false;
    setLevelIdx(0);
    setDeaths(0);
    setTime(0);
  };

  const s = stateRef.current;
  const levelName = s?.level?.name ?? LEVELS[levelIdx]?.name ?? '';
  const popAge = pop ? (performance.now() - pop.at) / 1000 : 99;

  return (
    <div className="ember">
      <div className="ember-bar">
        <span>Chamber <b style={{color:'var(--accent)'}}>{Math.min(LEVELS.length, levelIdx + 1)}</b>/{LEVELS.length} · <span style={{color:'var(--text-dim)'}}>{levelName}</span></span>
        <span>Gems <b>{gemsGot}</b>/{gemsTotal}</span>
        <span>Deaths <b>{deaths}</b></span>
        <span>Time <b>{time}s</b></span>
        <span style={{marginLeft:'auto'}}>
          {status === 'won' && <button className="btn btn-primary btn-sm" onClick={restart}>Play again</button>}
        </span>
      </div>
      <div ref={wrapRef} className="ember-stage">
        <canvas ref={canvasRef} className="ember-canvas"/>
      </div>
      {status === 'won'
        ? <div className="ember-tip ember-tip-win">All chambers cleared · {deaths} death{deaths === 1 ? '' : 's'} · {time}s</div>
        : <div className="ember-tip">{s?.level?.tip ?? LEVELS[levelIdx].tip}</div>}
      {popAge < 1.6 && pop && <div className="ember-pop">{pop.text}</div>}
      <div className="ember-hint">
        Ember: <b>W A D</b> · Tide: <b>↑ ← →</b> · R restart chamber · both doors, together, with every gem.
      </div>
    </div>
  );
}

/* ── player plumbing ────────────────────────────────────────── */

function buildPlayer(spawn, who) {
  return {
    x: spawn ? spawn.x : 40,
    y: spawn ? spawn.y : 40,
    spawn: { ...(spawn || { x: 40, y: 40 }) },
    vx: 0, vy: 0,
    onGround: false,
    coyote: 0,
    buffer: 0,
    jumpDown: false,
    dead: false,
    respawnIn: 0,
    facing: 1,
    who,
  };
}

function stepPlayer(s, dt, p, ctl) {
  if (p.dead) {
    p.respawnIn -= dt;
    if (p.respawnIn <= 0) {
      p.x = p.spawn.x; p.y = p.spawn.y;
      p.vx = 0; p.vy = 0;
      p.dead = false; p.buffer = 0; p.coyote = 0;
    }
    return;
  }

  // buffered jump press
  if (ctl.jump && !p.jumpDown) p.buffer = BUFFER;
  p.jumpDown = !!ctl.jump;
  if (p.buffer > 0) p.buffer -= dt;
  if (p.coyote > 0) p.coyote -= dt;

  // horizontal accel / friction
  const accel = p.onGround ? GROUND_ACCEL : AIR_ACCEL;
  if (ctl.left)  { p.vx -= accel * dt; p.facing = -1; }
  if (ctl.right) { p.vx += accel * dt; p.facing = 1; }
  if (!ctl.left && !ctl.right && p.onGround) {
    const drop = GROUND_FRICTION * dt;
    if (Math.abs(p.vx) <= drop) p.vx = 0;
    else p.vx -= Math.sign(p.vx) * drop;
  }
  p.vx = Math.max(-MOVE_MAX, Math.min(MOVE_MAX, p.vx));

  // gravity
  p.vy += GRAVITY * dt;
  p.vy = Math.min(p.vy, 1400);

  // consume buffered jump if allowed
  const canJump = p.onGround || p.coyote > 0;
  if (p.buffer > 0 && canJump) {
    p.vy = JUMP_V;
    p.onGround = false;
    p.coyote = 0;
    p.buffer = 0;
  }
  // short-hop: release jump early shortens arc
  if (!ctl.jump && p.vy < 0) p.vy *= 0.86;

  // horizontal collision
  p.x += p.vx * dt;
  for (const t of s.level.solids) {
    if (overlap({ x: p.x, y: p.y, w: P_W, h: P_H }, t)) {
      if (p.vx > 0) p.x = t.x - P_W;
      else if (p.vx < 0) p.x = t.x + t.w;
      p.vx = 0;
    }
  }
  // clamp to world horizontally
  if (p.x < 0) { p.x = 0; p.vx = 0; }
  if (p.x + P_W > W) { p.x = W - P_W; p.vx = 0; }

  // vertical collision
  const wasGround = p.onGround;
  p.y += p.vy * dt;
  p.onGround = false;
  for (const t of s.level.solids) {
    if (overlap({ x: p.x, y: p.y, w: P_W, h: P_H }, t)) {
      if (p.vy > 0) { p.y = t.y - P_H; p.onGround = true; }
      else if (p.vy < 0) { p.y = t.y + t.h; }
      p.vy = 0;
    }
  }
  if (wasGround && !p.onGround && p.vy >= 0) p.coyote = COYOTE;

  // fell off the world
  if (p.y > H + 80) {
    p.dead = true;
    p.respawnIn = RESPAWN_DELAY;
  }
}

function hazardKilling(hazards, p, who) {
  if (p.dead) return false;
  const box = { x: p.x, y: p.y + 4, w: P_W, h: P_H - 4 };
  for (const h of hazards) {
    if (!overlap(box, h)) continue;
    if (h.kind === 'acid') return true;
    if (h.kind === 'fire' && who === 'tide')  return true;
    if (h.kind === 'water' && who === 'ember') return true;
  }
  return false;
}

function kill(s, who) {
  const p = s[who];
  if (p.dead) return;
  p.dead = true;
  p.respawnIn = RESPAWN_DELAY;
  s.shake = 10;
}
