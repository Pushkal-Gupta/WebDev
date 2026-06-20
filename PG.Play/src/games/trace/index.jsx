// TRACE — precision platformer, real-3D rewrite.
//
//  • Six hand-designed rooms. Each fits one logical screen (800×500).
//  • Run, jump, wall-slide, wall-jump. Coyote time (120 ms) and jump
//    buffering (110 ms) keep controls forgiving.
//  • Touch spikes or saws = instant restart of the current room.
//  • Reach the green flag = next room. After room 6 = run is done;
//    score = max(0, 2000 − seconds × 5 − deaths × 40).
//
//  3D rewrite. The gameplay is byte-for-byte the same as the 2D version:
//  ROOMS, parseRoom(), tile/spike/saw collision, the 22×30 player AABB, every
//  movement constant, kill()/respawn timing, room-advance + goal logic, the
//  score formula and submitScore('vex', …) call site, and the sfx calls.
//  Only the *presentation* moved to Three.js.
//
//  2.5D mapping: the sim runs on the same (x, y) plane it always did, in
//  logical 800×500 px @ 40px tiles. The renderer maps it onto the z = 0 plane
//  of a real perspective scene with
//    worldX → +X,  worldY → −Y  (sim y grows downward; three's +Y is up)
//  and a perspective side camera looking down −Z, framed so the whole room
//  spans the view exactly like the 2D camera did. Physics never touches z, so
//  every number keeps its 2D meaning. Depth, lighting, shadows, parallax and
//  fog are pure decoration.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { submitScore } from '../../scoreBus.js';
import { consumeAdminStartLevel } from '../../utils/admin.js';
import { sfx } from '../../sound.js';

const W = 800;
const H = 500;
const T = 40;                          // tile size
const P_W = 22, P_H = 30;              // player AABB
const G = 1750;                        // gravity px/s²
const WALK_MAX = 240;
const AIR_ACCEL = 1500;
const GROUND_ACCEL = 2200;
const GROUND_FRICTION = 1900;
const JUMP_V = -540;
const WALLJUMP_VX = 340;
const WALLJUMP_VY = -480;
const WALL_SLIDE_MAX = 120;
const COYOTE = 0.12;
const BUFFER = 0.11;
const RESPAWN_DELAY = 0.18;

// ─── Visual palette (rendering only — no gameplay meaning) ──────────────
// "Blueprint dusk" carried into 3D: deep indigo→teal void, cyan accent, warm
// danger reds. Platforms read as solid slate blocks against luminous depth.
const PAL = {
  skyTop:   '#0b1424',
  skyMid:   '#0e2436',
  skyBot:   '#123042',
  mtnFar:   '#13283c',
  mtnNear:  '#16344a',
  tileFace: '#1c2c3a',
  tileTop:  '#3a6f86',
  tileTopHi:'#6fd6e8',
  spikeHi:  '#ff5a6e',
  spikeLo:  '#5a0f16',
  sawCore:  '#cfe6ef',
  sawDark:  '#2a3742',
  accent:   '#46f0d0',
  accentDk: '#10b89e',
  player:   '#eaf6ff',
  playerDk: '#9fc7d8',
  core:     '#46f0d0',
};

// ─── 2.5D plane mapping. Sim (x,y) → three world (x, −y, z). ─────────────
const w2x = (x) => x;
const w2y = (y) => -y;

// Deterministic hash for stable parallax placement.
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Rooms: grid[row][col] — each cell is 'S' solid, '#' wall (same as S,
// kept for readability), '.' empty, 'x' spike (half tile, top-facing),
// 'G' goal flag, 'P' player spawn. Saws are authored separately per room.
const ROOMS = [
  { // 1 — Tutorial: just jump a pit.
    grid: [
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '...................G',
      '....................',
      '....................',
      '....................',
      '..P.................',
      '#####..........#####',
      'SSSSS####xx####SSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [],
    tip: 'A → left · D → right · Space → jump',
  },
  { // 2 — Low wall + spike floor.
    grid: [
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '...............G....',
      '....................',
      '..........##........',
      '..........##........',
      '..P.......##........',
      '####.....####....####',
      'SSSSxxxxxSSSSxxxxSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [],
    tip: 'Short hops clear the spikes. Don\'t over-commit.',
  },
  { // 3 — Saw blade alley.
    grid: [
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '...................G',
      '....................',
      '....................',
      '....................',
      '..P.................',
      '####################',
      'SSSSSSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [
      { x: 7 * T, y: 9 * T, r: 18 },
      { x: 12 * T, y: 9 * T, r: 18 },
    ],
    tip: 'Saws spin. Your timing is worse than you think.',
  },
  { // 4 — Wall-jump chimney.
    grid: [
      '....................',
      '#........G..........',
      '##..................',
      '##.........##.......',
      '##.........##.......',
      '##.........##.......',
      '##.........##.......',
      '##.........##.......',
      '##.........##.......',
      '##P........##.......',
      '########....########',
      'SSSSSSSSxxxxSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [],
    tip: 'Hug the wall mid-air — press jump to launch off.',
  },
  { // 5 — Multi-saw timing.
    grid: [
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '...................G',
      '............######..',
      '....................',
      '..P..###............',
      '####.###..####..####',
      'SSSSxSSSSxSSSSxxSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [
      { x: 9 * T, y: 6 * T, r: 18 },
      { x: 15 * T, y: 5 * T, r: 18 },
    ],
    tip: 'Read the saws. Wait, jump, land, repeat.',
  },
  { // 6 — Final: chimney + saws + a long jump.
    grid: [
      '....................',
      '#.................G.',
      '##................##',
      '##................##',
      '##.........##.....##',
      '##.........##.....##',
      '##.........##.....##',
      '##.........##.....##',
      '##.........##.....##',
      '##P........##.....##',
      '########......######',
      'SSSSSSSSxxxxxxSSSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [
      { x: 14 * T, y: 7 * T, r: 18 },
    ],
    tip: 'Everything you\'ve learned. One run.',
  },
];

function parseRoom(idx) {
  const room = ROOMS[idx];
  const tiles = [];
  let spawn = { x: 80, y: 300 };
  let goal = { x: 700, y: 200 };
  for (let r = 0; r < room.grid.length; r++) {
    const row = room.grid[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      const x = c * T, y = r * T;
      if (ch === 'S' || ch === '#') tiles.push({ x, y, w: T, h: T, kind: 'solid' });
      else if (ch === 'x')           tiles.push({ x, y: y + T - 14, w: T, h: 14, kind: 'spike' });
      else if (ch === 'P')           spawn = { x: x + T / 2, y: y + T / 2 };
      else if (ch === 'G')           goal  = { x: x + T / 2, y: y + T / 2 };
    }
  }
  return { tiles, saws: room.saws, spawn, goal, tip: room.tip };
}

// ─── Procedural CanvasTexture for tile faces (no external assets). ──────
function makeTileTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  // base slate
  g.fillStyle = '#16242f';
  g.fillRect(0, 0, 64, 64);
  // faint blueprint grid (echoes the 2D backdrop look on the block faces)
  g.strokeStyle = 'rgba(120,200,225,0.10)';
  g.lineWidth = 1;
  for (let i = 0; i <= 64; i += 16) {
    g.beginPath(); g.moveTo(i + 0.5, 0); g.lineTo(i + 0.5, 64); g.stroke();
    g.beginPath(); g.moveTo(0, i + 0.5); g.lineTo(64, i + 0.5); g.stroke();
  }
  // soft speckle for tooth/texture
  g.fillStyle = 'rgba(0,0,0,0.22)';
  for (let i = 0; i < 36; i++) {
    g.fillRect((i * 23) % 64, (i * 41) % 64, 2, 2);
  }
  // bottom shade
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(120,200,225,0.06)');
  grad.addColorStop(1, 'rgba(0,0,0,0.30)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── Three.js renderer. Built once; rebuildRoom() builds static geometry per
// room from the SAME tile grid the collision uses. render() reads live sim
// state each frame. dispose() tears everything down. ────────────────────
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
  scene.fog = new THREE.Fog(new THREE.Color('#0a1424'), 700, 2600);

  // Perspective side camera looking down −Z at the z=0 play plane.
  const camera = new THREE.PerspectiveCamera(42, W / H, 1, 8000);
  camera.position.set(W / 2, -H / 2, 700);
  scene.add(camera);

  // ── Sky dome — vertical gradient via shader (fog:false so it stays put).
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(PAL.skyTop) },
      uMid: { value: new THREE.Color(PAL.skyMid) },
      uBot: { value: new THREE.Color('#070d18') },
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
        float h = clamp((normalize(vWorld).y + 0.25) * 0.85, 0.0, 1.0);
        vec3 col = mix(uBot, uMid, smoothstep(0.0, 0.5, h));
        col = mix(col, uTop, smoothstep(0.5, 1.0, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 24, 16), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  // ── Lights — bright, readable. Key light on the CAMERA side (+Z).
  const key = new THREE.DirectionalLight(0xeaf6ff, 1.45);
  key.position.set(W * 0.3, -H * 0.2 + 360, 520);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 1800;
  key.shadow.camera.left = -200;
  key.shadow.camera.right = 200;
  key.shadow.camera.top = 200;
  key.shadow.camera.bottom = -200;
  key.shadow.bias = -0.0006;
  scene.add(key);
  scene.add(key.target);

  const hemi = new THREE.HemisphereLight(0x9fd4e8, 0x10202c, 1.0);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const fill = new THREE.DirectionalLight(0x46f0d0, 0.35);
  fill.position.set(-W * 0.2, -H * 0.5, 420);
  scene.add(fill);

  // ── Parallax background — distant pillars, rebuilt per room (palette is
  // constant but they sit relative to room geometry). Own group at large −z.
  let bgGroup = new THREE.Group();
  scene.add(bgGroup);

  // ── Room container — rebuilt per room from the unchanged tile grid.
  let roomGroup = new THREE.Group();
  scene.add(roomGroup);

  // Shared tile texture (persistent).
  const tileTex = makeTileTexture();

  // Per-room tracked materials/geometries for disposal.
  let roomMats = [];
  let roomGeos = [];

  // Animated records.
  let goalRec = null;          // { flag, flagMat, halo, haloMat }
  let sawRecs = [];            // { group, blade } parallel to room.saws
  let spikeRecs = [];          // { mat } for danger pulse

  // ── Player rig — a sleek 3D runner/ninja occupying the 22×30 AABB. ──
  const playerGroup = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: PAL.player, roughness: 0.45, metalness: 0.15,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: PAL.playerDk, roughness: 0.55, metalness: 0.1,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: PAL.accent, emissive: new THREE.Color(PAL.accent),
    emissiveIntensity: 0.5, roughness: 0.4,
  });
  const coreMat = new THREE.MeshBasicMaterial({ color: '#9affec' });
  // Body — a slim capsule-ish box, the bulk of the silhouette.
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 22, 8), bodyMat);
  bodyMesh.castShadow = true;
  playerGroup.add(bodyMesh);
  // Hood/head — a small angular block on top.
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 9, 9), darkMat);
  headMesh.position.set(1, P_H / 2 - 4.5, 0);
  headMesh.castShadow = true;
  playerGroup.add(headMesh);
  // Accent visor stripe.
  const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(13, 3, 9.4), accentMat);
  visorMesh.position.set(1, P_H / 2 - 8, 0);
  playerGroup.add(visorMesh);
  // Glowing core / eye.
  const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 8), coreMat);
  coreMesh.position.set(4, 2, 4.6);
  playerGroup.add(coreMesh);
  // Legs (animated).
  const legGeo = new THREE.BoxGeometry(5, 8, 5);
  const legL = new THREE.Mesh(legGeo, darkMat); legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, darkMat); legR.castShadow = true;
  legL.position.set(-3.5, -P_H / 2 + 4, 0);
  legR.position.set(3.5, -P_H / 2 + 4, 0);
  playerGroup.add(legL); playerGroup.add(legR);
  scene.add(playerGroup);

  // ── Particle pool — instanced cubes. No per-frame allocation.
  const PART_N = 140;
  const partMat = new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, vertexColors: true,
  });
  const partGeo = new THREE.BoxGeometry(2.4, 2.4, 2.4);
  const partMesh = new THREE.InstancedMesh(partGeo, partMat, PART_N);
  partMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  partMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PART_N * 3), 3);
  partMesh.frustumCulled = false;
  scene.add(partMesh);

  // Room-clear flash — a thin emissive plane the room sweep tints.
  const flashMat = new THREE.MeshBasicMaterial({
    color: '#cffaf0', transparent: true, opacity: 0, depthWrite: false,
  });
  const flashMesh = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.4, H * 1.4), flashMat);
  flashMesh.frustumCulled = false;
  scene.add(flashMesh);

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

  function clearRoom() {
    scene.remove(roomGroup);
    disposeGroup(roomGroup);
    scene.remove(bgGroup);
    disposeGroup(bgGroup);
    roomMats.forEach((m) => m.dispose?.());
    roomGeos.forEach((g) => g.dispose?.());
    roomMats = [];
    roomGeos = [];
    goalRec = null;
    sawRecs = [];
    spikeRecs = [];
    roomGroup = new THREE.Group();
    bgGroup = new THREE.Group();
    scene.add(bgGroup);
    scene.add(roomGroup);
  }

  // Build a beveled-top tile block from the SAME tile data (coords/sizes
  // never altered). top is +Y face.
  function addTileBlock(t) {
    const depth = 30;
    const geo = new THREE.BoxGeometry(t.w, t.h, depth);
    roomGeos.push(geo);
    const sideMat = new THREE.MeshStandardMaterial({
      color: PAL.tileFace, roughness: 0.9, metalness: 0.08, map: tileTex,
    });
    const topMat = new THREE.MeshStandardMaterial({
      color: PAL.tileTop, roughness: 0.55, metalness: 0.18,
      emissive: new THREE.Color(PAL.tileTopHi), emissiveIntensity: 0.12,
    });
    roomMats.push(sideMat, topMat);
    // face order: +x,-x,+y,-y,+z,-z. top is +y.
    const mats = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    const m = new THREE.Mesh(geo, mats);
    m.position.set(t.x + t.w / 2, w2y(t.y + t.h / 2), 0);
    m.castShadow = true;
    m.receiveShadow = true;
    roomGroup.add(m);
    // Bright top-edge bevel cap — a thin lit slab on the top face.
    const capGeo = new THREE.BoxGeometry(t.w, 4, depth + 1.5);
    roomGeos.push(capGeo);
    const capMat = new THREE.MeshStandardMaterial({
      color: PAL.tileTopHi, emissive: new THREE.Color(PAL.tileTopHi),
      emissiveIntensity: 0.5, roughness: 0.35,
    });
    roomMats.push(capMat);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(t.x + t.w / 2, w2y(t.y) - 2, 0);
    roomGroup.add(cap);
  }

  // Build a row of real 3D spike cones over the spike tile's footprint.
  function addSpikeTile(t) {
    const mat = new THREE.MeshStandardMaterial({
      color: PAL.spikeHi, emissive: new THREE.Color(PAL.spikeLo),
      emissiveIntensity: 0.4, roughness: 0.4, metalness: 0.35,
    });
    roomMats.push(mat);
    const teeth = Math.max(1, Math.floor(t.w / 10));
    const geo = new THREE.ConeGeometry(4.4, t.h + 2, 4);
    roomGeos.push(geo);
    const inst = new THREE.InstancedMesh(geo, mat, teeth);
    inst.castShadow = true;
    for (let i = 0; i < teeth; i++) {
      // tip points up: sim-top of tile is t.y, base sits at t.y + t.h.
      _p.set(t.x + i * 10 + 5, w2y(t.y + t.h / 2), 4);
      _q.identity(); _s.set(1, 1, 1);
      _m.compose(_p, _q, _s);
      inst.setMatrixAt(i, _m);
    }
    inst.instanceMatrix.needsUpdate = true;
    roomGroup.add(inst);
    spikeRecs.push({ mat });
    // base plate anchoring the teeth
    const plateGeo = new THREE.BoxGeometry(t.w, 4, 14);
    roomGeos.push(plateGeo);
    const plateMat = new THREE.MeshStandardMaterial({ color: '#2a1418', roughness: 0.8 });
    roomMats.push(plateMat);
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(t.x + t.w / 2, w2y(t.y + t.h), 4);
    roomGroup.add(plate);
  }

  // ── Build the entire room scene from the unchanged parsed room. ──
  function rebuildRoom(room) {
    clearRoom();

    // Parallax pillars behind the play plane — two depth bands.
    const bands = [
      { z: -1100, col: PAL.mtnFar, base: 180, amp: 160, step: 220, op: 0.85 },
      { z: -650,  col: PAL.mtnNear, base: 130, amp: 130, step: 180, op: 0.95 },
    ];
    for (const b of bands) {
      const count = Math.ceil((W + 600) / b.step) + 2;
      const geo = new THREE.ConeGeometry(b.step * 0.62, 1, 4);
      roomGeos.push(geo);
      const mat = new THREE.MeshStandardMaterial({
        color: b.col, roughness: 1, metalness: 0,
        transparent: b.op < 1, opacity: b.op, fog: true,
      });
      roomMats.push(mat);
      const inst = new THREE.InstancedMesh(geo, mat, count);
      inst.frustumCulled = false;
      for (let i = 0; i < count; i++) {
        const hx = -300 + i * b.step;
        const hh = b.base + hash2(i * 2.3, b.z) * b.amp;
        _p.set(hx, w2y(H) + hh / 2 - 20, b.z);
        _q.identity();
        _s.set(1, hh, 1);
        _m.compose(_p, _q, _s);
        inst.setMatrixAt(i, _m);
      }
      inst.instanceMatrix.needsUpdate = true;
      bgGroup.add(inst);
    }

    // Floating dust motes — faint glow points well behind the plane.
    const moteGeo = new THREE.SphereGeometry(1.4, 6, 5);
    roomGeos.push(moteGeo);
    const moteMat = new THREE.MeshBasicMaterial({
      color: '#9ad2e6', transparent: true, opacity: 0.35, fog: true,
    });
    roomMats.push(moteMat);
    const moteInst = new THREE.InstancedMesh(moteGeo, moteMat, 30);
    moteInst.frustumCulled = false;
    for (let i = 0; i < 30; i++) {
      _p.set(hash2(i, 1) * W, w2y(hash2(i, 2) * H), -180 - hash2(i, 3) * 220);
      _q.identity();
      const sc = 0.6 + hash2(i, 4) * 1.4;
      _s.set(sc, sc, sc);
      _m.compose(_p, _q, _s);
      moteInst.setMatrixAt(i, _m);
    }
    moteInst.instanceMatrix.needsUpdate = true;
    bgGroup.add(moteInst);

    // ── Tiles + spikes built straight from room.tiles (collision data). We
    // never read or change tile coords/sizes — only render them.
    for (const t of room.tiles) {
      if (t.kind === 'solid') addTileBlock(t);
      else if (t.kind === 'spike') addSpikeTile(t);
    }

    // ── Saws — real spinning 3D blade discs at their exact positions. ──
    for (const saw of room.saws) {
      const group = new THREE.Group();
      group.position.set(saw.x, w2y(saw.y), 6);
      // disc
      const discGeo = new THREE.CylinderGeometry(12, 12, 4, 20);
      roomGeos.push(discGeo);
      const discMat = new THREE.MeshStandardMaterial({
        color: PAL.sawCore, roughness: 0.3, metalness: 0.85,
      });
      roomMats.push(discMat);
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.x = Math.PI / 2;       // face the camera, lie in XY plane
      disc.castShadow = true;
      group.add(disc);
      // teeth ring — thin boxes around the rim
      const toothGeo = new THREE.BoxGeometry(2.4, 5, (saw.r + 4 - 8));
      roomGeos.push(toothGeo);
      const toothMat = new THREE.MeshStandardMaterial({
        color: '#8aa3b0', roughness: 0.35, metalness: 0.8,
      });
      roomMats.push(toothMat);
      const bladeGroup = new THREE.Group();
      for (let k = 0; k < 10; k++) {
        const a = (k * 36) * Math.PI / 180;
        const tooth = new THREE.Mesh(toothGeo, toothMat);
        const rr = 8 + (saw.r + 4 - 8) / 2;
        tooth.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0);
        tooth.rotation.z = a;
        tooth.castShadow = true;
        bladeGroup.add(tooth);
      }
      // hub
      const hubGeo = new THREE.CylinderGeometry(4, 4, 5, 12);
      roomGeos.push(hubGeo);
      const hubMat = new THREE.MeshStandardMaterial({ color: PAL.sawDark, roughness: 0.5, metalness: 0.6 });
      roomMats.push(hubMat);
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.rotation.x = Math.PI / 2;
      bladeGroup.add(hub);
      group.add(bladeGroup);
      // glow ring
      const glowGeo = new THREE.RingGeometry(saw.r, saw.r + 10, 24);
      roomGeos.push(glowGeo);
      const glowMat = new THREE.MeshBasicMaterial({
        color: '#9ad2e6', transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false,
      });
      roomMats.push(glowMat);
      const glow = new THREE.Mesh(glowGeo, glowMat);
      group.add(glow);
      roomGroup.add(group);
      sawRecs.push({ blade: bladeGroup, glowMat });
    }

    // ── Goal — a glowing 3D flag/portal beacon. ──
    {
      const g = room.goal;
      const poleGeo = new THREE.CylinderGeometry(1.6, 1.6, 60, 8);
      roomGeos.push(poleGeo);
      const poleMat = new THREE.MeshStandardMaterial({ color: '#cfd6e0', roughness: 0.4, metalness: 0.6 });
      roomMats.push(poleMat);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(g.x, w2y(g.y - 4), 0);
      pole.castShadow = true;
      roomGroup.add(pole);
      // flag — flattened triangle pointing right.
      const flagShape = new THREE.Shape();
      flagShape.moveTo(0, 0);
      flagShape.lineTo(26, -7);
      flagShape.lineTo(0, -16);
      flagShape.closePath();
      const flagGeo = new THREE.ExtrudeGeometry(flagShape, { depth: 1.5, bevelEnabled: false });
      roomGeos.push(flagGeo);
      const flagMat = new THREE.MeshStandardMaterial({
        color: PAL.accent, emissive: new THREE.Color(PAL.accent),
        emissiveIntensity: 0.5, roughness: 0.5, side: THREE.DoubleSide,
      });
      roomMats.push(flagMat);
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(g.x, w2y(g.y - 32), 0);
      flag.castShadow = true;
      roomGroup.add(flag);
      // halo glow sprite-ish billboard.
      const haloGeo = new THREE.SphereGeometry(36, 16, 12);
      roomGeos.push(haloGeo);
      const haloMat = new THREE.MeshBasicMaterial({
        color: PAL.accent, transparent: true, opacity: 0.18, depthWrite: false,
      });
      roomMats.push(haloMat);
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(g.x, w2y(g.y - 14), -4);
      roomGroup.add(halo);
      goalRec = { flag, flagMat, halo, haloMat };
    }
  }

  // ── Resize — manual, never via sizeCanvasFluid (that grabs a 2D ctx).
  let viewW = W, viewH = H;
  function resize(cssW, cssH) {
    viewW = Math.max(1, cssW);
    viewH = Math.max(1, cssH);
    renderer.setSize(viewW, viewH, false);
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();
  }

  // Camera distance so the full room width (W) spans the view, framing the
  // 800×500 room like the 2D camera did regardless of canvas aspect.
  function camDistanceForSpan() {
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * Math.max(0.3, camera.aspect));
    // fit whichever dimension is tighter so nothing clips.
    const distW = (W / 2) / Math.tan(hHalf);
    const distH = (H / 2) / Math.tan(vHalf);
    return Math.max(distW, distH) * 1.02;
  }

  let camPrimed = false;
  function primeCamera() { camPrimed = false; }

  // ── Per-frame render. Reads sim state; shake offsets are render-local. ──
  function render(state, rawDt) {
    if (!state) return;
    const { room, player, sawT } = state;
    const t = sawT;

    // Camera centred on the room; span W. Screen-shake added on top (visual).
    const camZ = camDistanceForSpan();
    const cx = W / 2, cy = w2y(H / 2);
    let shx = 0, shy = 0;
    if (state.shake > 0.01) {
      const m = state.shake * 7;
      shx = (Math.random() - 0.5) * m;
      shy = (Math.random() - 0.5) * m;
    }
    if (!camPrimed) {
      camera.position.set(cx, cy, camZ);
      camPrimed = true;
    } else {
      camera.position.x += (cx + shx - camera.position.x) * Math.min(1, rawDt * 18);
      camera.position.y += (cy + shy - camera.position.y) * Math.min(1, rawDt * 18);
      camera.position.z += (camZ - camera.position.z) * Math.min(1, rawDt * 8);
    }
    camera.lookAt(cx + shx, cy + shy, 0);

    sky.position.set(camera.position.x, camera.position.y, 0);

    // Key light tracks the player so shadows read on screen.
    key.position.set(w2x(player.x) + 80, w2y(player.y) + 360, 520);
    key.target.position.set(w2x(player.x), w2y(player.y), 0);
    key.target.updateMatrixWorld();

    // Drift the parallax + motes gently.
    bgGroup.position.x = Math.sin(t * 0.12) * 8;

    // ── Saws spin (keep the original t*6 rate + positions). ──
    for (let i = 0; i < sawRecs.length; i++) {
      const rec = sawRecs[i];
      rec.blade.rotation.z = t * 6;
      rec.glowMat.opacity = 0.18 + 0.12 * (0.5 + 0.5 * Math.sin(t * 8 + i));
    }

    // ── Spike danger pulse. ──
    const sp = 0.4 + 0.3 * (0.5 + 0.5 * Math.sin(t * 4));
    for (const rec of spikeRecs) rec.mat.emissiveIntensity = sp;

    // ── Goal beacon. ──
    if (goalRec) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      goalRec.flag.rotation.z = Math.sin(t * 4) * 0.18;
      goalRec.flagMat.emissiveIntensity = 0.4 + 0.25 * pulse;
      goalRec.haloMat.opacity = 0.14 + 0.12 * pulse;
      const hs = 1 + pulse * 0.12;
      goalRec.halo.scale.set(hs, hs, hs);
    }

    // ── Player rig — position, facing, squash/stretch, run/jump anim. ──
    playerGroup.visible = !player.dead;
    if (!player.dead) {
      const px = player.x + P_W / 2;
      const py = player.y + P_H / 2;
      playerGroup.position.set(w2x(px), w2y(py), 6);
      const facing = player.vx >= 0 ? 1 : -1;
      playerGroup.rotation.y = facing > 0 ? 0 : Math.PI;

      // Squash & stretch from velocity/state (visual only).
      let sx = 1, sy = 1;
      if (player.onGround) { sx = 1.12; sy = 0.9; }
      else if (player.vy < -60) { sx = 0.86; sy = 1.16; }
      else if (player.vy > 60) { sx = 0.94; sy = 1.08; }
      sx = 1 + (sx - 1) * 0.8;
      sy = 1 + (sy - 1) * 0.8;
      playerGroup.scale.set(sx, sy, 1);

      // Run cycle / jump pose.
      const running = player.onGround && Math.abs(player.vx) > 20;
      const stride = running ? Math.sin(t * 16) : 0;
      if (!player.onGround) {
        legL.rotation.x = -0.5; legR.rotation.x = 0.5;
      } else {
        legL.rotation.x = stride * 0.8;
        legR.rotation.x = -stride * 0.8;
      }
      // Core pulse.
      const cpulse = 0.6 + 0.4 * Math.sin(t * 6);
      coreMat.color.setRGB(0.6 + 0.4 * cpulse, 1, 0.92);
    }

    // ── Particles. ──
    let pi = 0;
    const a = state.particles.arr;
    for (let i = 0; i < a.length; i++) {
      const part = a[i];
      if (!part.live || pi >= PART_N) continue;
      const k = part.life / part.max;
      _p.set(w2x(part.x), w2y(part.y), 8);
      _q.identity();
      let sz = 1;
      if (part.kind === 'dust') { sz = part.size * (0.5 + k * 0.7); _c.set('#b4dceb'); }
      else if (part.kind === 'death') { sz = part.size * (0.4 + k); _c.set(k > 0.5 ? '#ffd0d6' : PAL.spikeHi); }
      else { sz = part.size * k + 0.6; _c.set('#ffe6a0'); } // spark
      _s.set(sz, sz, sz);
      _m.compose(_p, _q, _s);
      partMesh.setMatrixAt(pi, _m);
      _c.multiplyScalar(Math.max(0.2, k));
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

    // ── Room-clear flash. ──
    flashMesh.position.set(camera.position.x, camera.position.y, camera.position.z - 60);
    flashMat.opacity = state.clearFlash * 0.4;

    renderer.render(scene, camera);
  }

  function dispose() {
    clearRoom();
    scene.remove(roomGroup);
    scene.remove(bgGroup);
    playerGroup.traverse((o) => { o.geometry?.dispose?.(); });
    [bodyMat, darkMat, accentMat, coreMat].forEach((m) => m.dispose?.());
    sky.geometry?.dispose?.();
    skyMat.dispose();
    partGeo.dispose();
    partMat.dispose();
    flashMesh.geometry.dispose();
    flashMat.dispose();
    tileTex.dispose?.();
    renderer.dispose();
  }

  return { scene, camera, renderer, rebuildRoom, render, resize, primeCamera, dispose };
}

// ─── Pooled particle system (sim-side; visual only). ──────────────────
const MAX_PARTICLES = 120;
function makeParticlePool() {
  const arr = new Array(MAX_PARTICLES);
  for (let i = 0; i < MAX_PARTICLES; i++) {
    arr[i] = { live: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, kind: 'dust' };
  }
  return { arr, head: 0 };
}
function spawnParticle(pool, x, y, vx, vy, life, size, kind) {
  const p = pool.arr[pool.head];
  pool.head = (pool.head + 1) % MAX_PARTICLES;
  p.live = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.life = life; p.max = life; p.size = size; p.kind = kind;
}
function burst(pool, x, y, count, spread, life, size, kind) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = spread * (0.35 + Math.random() * 0.65);
    spawnParticle(pool, x, y, Math.cos(a) * sp, Math.sin(a) * sp,
      life * (0.6 + Math.random() * 0.6), size * (0.7 + Math.random() * 0.7), kind);
  }
}
function updateParticles(pool, dt) {
  const a = pool.arr;
  for (let i = 0; i < a.length; i++) {
    const p = a[i];
    if (!p.live) continue;
    p.life -= dt;
    if (p.life <= 0) { p.live = false; continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'dust') { p.vy += 220 * dt; p.vx *= 0.92; }
    else if (p.kind === 'death') { p.vy += 480 * dt; p.vx *= 0.98; }
    else if (p.kind === 'spark') { p.vy += 360 * dt; p.vx *= 0.94; }
  }
}

export default function TraceGame() {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const stateRef  = useRef(null);
  const rendererRef = useRef(null);
  const submittedRef = useRef(false);
  const [roomIdx, setRoomIdx] = useState(() => {
    const adminStart = consumeAdminStartLevel('vex');
    return adminStart != null ? Math.max(0, Math.min(ROOMS.length - 1, adminStart)) : 0;
  });
  const [deaths, setDeaths]   = useState(0);
  const [time, setTime]       = useState(0);
  const [tip, setTip]         = useState(() => ROOMS[Math.max(0, Math.min(ROOMS.length - 1, roomIdx))]?.tip || '');
  const [status, setStatus]   = useState('playing'); // playing | won

  const loadRoom = (idx) => {
    const parsed = parseRoom(idx);
    stateRef.current = {
      room: parsed,
      player: {
        x: parsed.spawn.x - P_W / 2,
        y: parsed.spawn.y - P_H / 2,
        vx: 0, vy: 0,
        onGround: false,
        coyote: 0, buffer: 0, jumpDown: false,
        wall: 0,           // -1 left wall, 0 none, 1 right wall
        respawnIn: 0,
        dead: false,
      },
      sawT: 0,
      elapsed: 0,
      // ── Visual-only juice state (read by render(); never affects physics) ──
      particles: makeParticlePool(),
      shake: 0,            // screen-shake magnitude, decays over time
      clearFlash: 1,       // room-enter shimmer, decays over time (kicks on load)
      prevOnGround: true,  // landing-edge detection
      wasDead: false,      // death-edge detection
      sawSparkT: 0,        // throttles saw rim sparks
    };
    setTip(ROOMS[idx].tip);
    rendererRef.current?.rebuildRoom(parsed);
    rendererRef.current?.primeCamera();
  };

  useEffect(() => {
    loadRoom(roomIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    // ── Build the WebGL renderer. WebGL may be unavailable; fail loud in DEV.
    let renderer = null;
    try { renderer = makeRenderer3D(canvas); }
    catch (err) { renderer = null; if (import.meta.env.DEV) console.error('[trace] WebGL init failed', err); }
    rendererRef.current = renderer;

    if (import.meta.env.DEV && renderer) {
      window.__vex3d = { scene: renderer.scene, camera: renderer.camera, renderer: renderer.renderer };
    }

    // Build the current room's scene now that the renderer exists.
    if (stateRef.current) {
      renderer?.rebuildRoom(stateRef.current.room);
      renderer?.primeCamera();
    }

    // ── Manual fluid sizing (NOT sizeCanvasFluid — it grabs a 2D context).
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
        // Restart room
        loadRoom(roomIdx);
      }
    };
    const ku = (e) => {
      keys[e.key.toLowerCase()] = false;
      keys[e.code] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // Touch overlay — pill buttons in JSX call this shim to set held flags.
    const touchKeys = { left: false, right: false, jump: false };
    wrap._setTouch = (id, v) => {
      if (id === 'left')  touchKeys.left  = v;
      if (id === 'right') touchKeys.right = v;
      if (id === 'jump')  touchKeys.jump  = v;
    };

    const solidAt = (tiles, x, y, w, h) => {
      for (const t of tiles) {
        if (t.kind !== 'solid') continue;
        if (x < t.x + t.w && x + w > t.x && y < t.y + t.h && y + h > t.y) return t;
      }
      return null;
    };
    const hazardAt = (tiles, x, y, w, h) => {
      for (const t of tiles) {
        if (t.kind !== 'spike') continue;
        if (x < t.x + t.w && x + w > t.x && y < t.y + t.h && y + h > t.y) return true;
      }
      return false;
    };
    const hitSaw = (saws, cx, cy, pw, ph, sawT) => {
      for (const s of saws) {
        const d = Math.hypot((cx + pw / 2) - s.x, (cy + ph / 2) - s.y);
        if (d < s.r + 8) return true;
      }
      return false;
    };

    const kill = () => {
      const s = stateRef.current; if (!s || s.player.dead) return;
      s.player.dead = true;
      s.player.respawnIn = RESPAWN_DELAY;
      setDeaths((d) => d + 1);
      sfx.error();
    };

    const clock = { last: performance.now() };
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current;
      if (!s || status !== 'playing') {
        if (s) rendererRef.current?.render(s, dt);
        return;
      }

      s.sawT += dt;
      s.elapsed += dt;

      const p = s.player;

      // ── Visual juice update (no gameplay effect) ──────────────────────
      updateParticles(s.particles, dt);
      if (s.shake > 0)      s.shake = Math.max(0, s.shake - dt * 3.2);
      if (s.clearFlash > 0) s.clearFlash = Math.max(0, s.clearFlash - dt * 1.6);

      // Death edge: burst of embers + a kick of screen shake.
      if (p.dead && !s.wasDead) {
        const dcx = p.x + P_W / 2, dcy = p.y + P_H / 2;
        burst(s.particles, dcx, dcy, 24, 320, 0.6, 4, 'death');
        s.shake = 1;
      }
      s.wasDead = p.dead;

      // Saw rim sparks — throttled so the pool isn't flooded.
      if (s.room.saws.length) {
        s.sawSparkT -= dt;
        if (s.sawSparkT <= 0) {
          s.sawSparkT = 0.09;
          const saw = s.room.saws[(s.sawT * 10 | 0) % s.room.saws.length];
          const ang = s.sawT * 6 + Math.random() * 0.6;
          const rr = saw.r + 4;
          const ox = Math.cos(ang) * rr, oy = Math.sin(ang) * rr;
          const tang = ang + Math.PI / 2;
          spawnParticle(s.particles, saw.x + ox, saw.y + oy,
            Math.cos(tang) * 120 + (Math.random() - 0.5) * 60,
            Math.sin(tang) * 120 + (Math.random() - 0.5) * 60,
            0.28, 1.8, 'spark');
        }
      }

      if (p.dead) {
        p.respawnIn -= dt;
        if (p.respawnIn <= 0) {
          const sp = s.room.spawn;
          p.x = sp.x - P_W / 2; p.y = sp.y - P_H / 2;
          p.vx = 0; p.vy = 0; p.dead = false; p.wall = 0;
          p.coyote = 0; p.buffer = 0;
          s.prevOnGround = true;
        }
        rendererRef.current?.render(s, dt);
        return;
      }

      // Input
      const left  = keys['a'] || keys['arrowleft']  || keys['keya']  || touchKeys.left;
      const right = keys['d'] || keys['arrowright'] || keys['keyd']  || touchKeys.right;
      const jumpDown = keys[' '] || keys['space'] || keys['w'] || keys['arrowup'] || touchKeys.jump;
      if (jumpDown && !p.jumpDown) p.buffer = BUFFER;
      p.jumpDown = jumpDown;

      // Horizontal movement
      const accel = p.onGround ? GROUND_ACCEL : AIR_ACCEL;
      if (left)  p.vx -= accel * dt;
      if (right) p.vx += accel * dt;
      if (!left && !right && p.onGround) {
        const drop = GROUND_FRICTION * dt;
        if (Math.abs(p.vx) <= drop) p.vx = 0;
        else p.vx -= Math.sign(p.vx) * drop;
      }
      p.vx = Math.max(-WALK_MAX, Math.min(WALK_MAX, p.vx));

      // Gravity / wall-slide
      p.vy += G * dt;
      if (p.wall !== 0 && p.vy > WALL_SLIDE_MAX && ((p.wall < 0 && left) || (p.wall > 0 && right))) {
        p.vy = WALL_SLIDE_MAX;
      }
      p.vy = Math.min(p.vy, 1400);

      // Jump consumption
      const canJump = p.onGround || p.coyote > 0;
      if (p.buffer > 0) {
        if (canJump) {
          p.vy = JUMP_V;
          p.onGround = false;
          p.coyote = 0;
          p.buffer = 0;
        } else if (p.wall !== 0) {
          p.vy = WALLJUMP_VY;
          p.vx = -p.wall * WALLJUMP_VX;
          p.wall = 0;
          p.buffer = 0;
        }
      }
      p.buffer -= dt;
      p.coyote -= dt;

      // Jump release dampen
      if (!jumpDown && p.vy < 0) p.vy *= 0.86;

      // Horizontal collision
      const tiles = s.room.tiles;
      const wasGround = p.onGround;
      p.x += p.vx * dt;
      let hit = solidAt(tiles, p.x, p.y, P_W, P_H);
      if (hit) {
        if (p.vx > 0) { p.x = hit.x - P_W; p.wall = 1; }
        else if (p.vx < 0) { p.x = hit.x + hit.w; p.wall = -1; }
        p.vx = 0;
      } else {
        // Check touching a wall (immediately to left or right by 1px).
        const leftHit  = solidAt(tiles, p.x - 1, p.y, P_W, P_H);
        const rightHit = solidAt(tiles, p.x + 1, p.y, P_W, P_H);
        p.wall = rightHit ? 1 : leftHit ? -1 : 0;
      }

      // Vertical collision
      const vyBefore = p.vy;   // captured for landing-dust intensity (visual)
      p.y += p.vy * dt;
      hit = solidAt(tiles, p.x, p.y, P_W, P_H);
      p.onGround = false;
      if (hit) {
        if (p.vy > 0) { p.y = hit.y - P_H; p.onGround = true; }
        else if (p.vy < 0) { p.y = hit.y + hit.h; }
        p.vy = 0;
      }
      if (wasGround && !p.onGround) p.coyote = COYOTE;

      // Landing dust (visual) — on the air→ground edge, scaled by impact.
      if (p.onGround && !s.prevOnGround && vyBefore > 160) {
        const fcx = p.x + P_W / 2, fy = p.y + P_H;
        const n = Math.min(10, 3 + (vyBefore / 160) | 0);
        for (let i = 0; i < n; i++) {
          const dir = i < n / 2 ? -1 : 1;
          spawnParticle(s.particles, fcx + dir * 4, fy,
            dir * (40 + Math.random() * 90), -(20 + Math.random() * 60),
            0.35 + Math.random() * 0.2, 2.4, 'dust');
        }
      }
      s.prevOnGround = p.onGround;

      // Off-world = death
      if (p.y > H + 80 || p.x < -80 || p.x > W + 80) kill();

      // Hazard checks
      if (hazardAt(tiles, p.x, p.y, P_W, P_H)) kill();
      if (hitSaw(s.room.saws, p.x, p.y, P_W, P_H, s.sawT)) kill();

      // Goal
      const gd = Math.hypot((p.x + P_W / 2) - s.room.goal.x, (p.y + P_H / 2) - s.room.goal.y);
      if (gd < 22) {
        if (roomIdx + 1 >= ROOMS.length) {
          sfx.win();
          setStatus('won');
          if (!submittedRef.current) {
            submittedRef.current = true;
            const score = Math.max(0, Math.round(2000 - s.elapsed * 5 - deaths * 40));
            submitScore('vex', score, { time: Math.round(s.elapsed), deaths });
          }
        } else {
          sfx.confirm();
          setRoomIdx((i) => i + 1);
          return; // effect will reload
        }
      }

      // HUD update at ~4Hz
      if ((s.sawT * 4 | 0) !== (s._lastHud | 0)) {
        s._lastHud = s.sawT * 4;
        setTime(Math.round(s.elapsed));
      }

      rendererRef.current?.render(s, dt);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('orientationchange', sizeCanvas);
      try { rendererRef.current?.dispose(); } catch {}
      rendererRef.current = null;
      try { delete wrap._setTouch; } catch {}
      if (import.meta.env.DEV && window.__vex3d) { try { delete window.__vex3d; } catch {} }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdx, status]);

  const restart = () => {
    submittedRef.current = false;
    setDeaths(0);
    setRoomIdx(0);
    setStatus('playing');
    setTime(0);
  };

  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
  const setTouch = (id, v) => {
    const w = wrapRef.current;
    if (w && w._setTouch) w._setTouch(id, v);
  };

  return (
    <div className="trace">
      <div className="trace-bar">
        <span>Room <b style={{color:'var(--accent)'}}>{Math.min(ROOMS.length, roomIdx + 1)}</b>/{ROOMS.length}</span>
        <span>Deaths <b>{deaths}</b></span>
        <span>Time <b>{time}s</b></span>
        <span style={{marginLeft:'auto'}}>
          {status === 'won' && <button className="btn btn-primary btn-sm" onClick={restart}>Play again</button>}
        </span>
      </div>
      <div ref={wrapRef} className="trace-stage">
        <canvas ref={canvasRef} className="trace-canvas"/>
        {isTouch && (
          <>
            <div style={{ position: 'absolute', bottom: 18, left: 18, display: 'flex', gap: 10, zIndex: 5 }}>
              <PillBtn label="←" onDown={() => setTouch('left', true)}  onUp={() => setTouch('left', false)} />
              <PillBtn label="→" onDown={() => setTouch('right', true)} onUp={() => setTouch('right', false)} />
            </div>
            <div style={{ position: 'absolute', bottom: 18, right: 18, zIndex: 5 }}>
              <PillBtn label="JUMP" wide onDown={() => setTouch('jump', true)} onUp={() => setTouch('jump', false)} />
            </div>
          </>
        )}
      </div>
      {status === 'won' ? (
        <div className="trace-tip" style={{color:'var(--accent)', fontWeight:700}}>
          Cleared · {deaths} death{deaths === 1 ? '' : 's'} · {time}s
        </div>
      ) : (
        <div className="trace-tip">{tip}</div>
      )}
      <div className="trace-hint">A/D move · Space jump · hug wall + jump = wall-jump · R restart room</div>
    </div>
  );
}

// Inline-styled touch pill — held-button model, identical look across the
// touch-enabled games.
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
