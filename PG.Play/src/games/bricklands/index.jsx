// BRICKLANDS — original side-scrolling platformer.
//
//  Three short worlds (meadow, neon ruins, sky islands), one bouncy hero.
//  Run, jump, stomp, collect — three handcrafted levels build into a finale
//  that asks for everything you've learned. Variable jump height, coyote
//  time, jump buffering. No copyrighted Nintendo assets — original geometry,
//  modern palette, abstract silhouettes.
//
//  3D rewrite. The gameplay is unchanged: the entire simulation (level/tile
//  grid, collision, player physics, enemies, collectibles, goal, lives,
//  score, sfx) is byte-for-byte the same as the 2D version. Only the
//  *presentation* moved to Three.js.
//
//  2.5D mapping: the sim runs on the same (x, y) plane it always did, in
//  logical 480x270 pixels @ 16px tiles. The renderer maps it onto the z = 0
//  plane of a real perspective scene with
//    worldX → +X,  worldY → −Y  (sim y grows downward; three's +Y is up)
//  and a perspective side camera looking down the −Z axis. Because the
//  physics never touches z, every number — gravity, AABB collisions, the
//  camera lead/deadzone clamp — keeps its exact 2D meaning. The depth,
//  lighting, shadows and parallax hills are pure decoration.
//
//  Engine notes (all in 480x270 logical pixels @ 16px tiles):
//    - Player AABB: 12x16. Run accel ramps to 3.6 px/frame over 12 frames.
//    - Jump: vy = -5.4. Gravity 0.32 px/f^2. Hold-jump cuts gravity 60%
//      for first 12 frames. Max fall vy = 7.
//    - Coyote = 6 frames after walking off a ledge.
//    - Jump buffer = 6 frames before landing.
//    - Camera lead-ahead 80px on facing direction; lerp 0.18; vertical
//      dead zone +/-48px around player.
//    - Touch: virtual D-pad bottom-left, jump button bottom-right; only
//      rendered when 'ontouchstart' in window.
//
//  Score: coins +50, stars +500, level clear +1000, time bonus on finale.
//  100 coins = +1 life. Submit on level 3 win as 'bricklands'.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { submitScore } from '../../scoreBus.js';
import { sfx } from '../../sound.js';
import { consumeAdminStartLevel } from '../../utils/admin.js';

// Logical render dimensions — every world coordinate is in these units.
const VIEW_W = 480;
const VIEW_H = 270;
const TILE   = 16;

// Player AABB (logical px)
const P_W = 12;
const P_H = 16;

// Movement tuning — units are px/frame at 60fps. dt scaling preserves
// behaviour at lower framerates.
const RUN_MAX     = 3.6;
const RUN_ACCEL   = 3.6 / 12;     // reach top speed in ~12 frames
const RUN_FRICT   = 3.6 / 12;     // decel from top in ~12 frames
const JUMP_V      = -5.4;
const GRAVITY     = 0.32;
const JUMP_HOLD_F = 12;           // frames of variable-height window
const HOLD_GRAV_K = 0.4;          // gravity scale while holding jump in window
const FALL_MAX    = 7;
const WALL_SLIDE  = 2;
const COYOTE_F    = 6;
const BUFFER_F    = 6;
const STOMP_BOUNCE = -3.6;
const CAMERA_LERP  = 0.18;
const CAMERA_LEAD  = 80;
const CAM_DEADZONE = 48;
const HURT_INVUL_F = 30;          // 0.5s @ 60fps
const SPAWN_INVUL_F = 96;         // 1.6s @ 60fps — read time at level start

// Tile glyphs — see LEVELS for the maps.
//   .  empty
//   #  solid (ground/wall)
//   =  oneway (jump-through)
//   ?  mystery block (becomes -)
//   -  spent mystery (still solid)
//   ^  spike (top-facing, half-tile)
//   F  goal flag
//   P  player spawn (treated as empty)
//
// World is decoded once per level into a typed grid.
const SOLID = new Set(['#', '-']);
const ONEWAY = new Set(['=']);
const MYSTERY = new Set(['?']);
const SPIKE = new Set(['^']);

// Per-world palette. World index = level index.
const PALETTE = [
  // 1 — meadow
  {
    skyTop:    '#7fd0ff',
    skyMid:    '#ffd6e0',
    skyBottom: '#1a2240',
    far:       '#3b4f80',
    mid:       '#2a4470',
    near:      '#1c2a4a',
    ground:    '#5a8c3a',
    groundDk:  '#3c6324',
    accent:    '#f6c93a',
  },
  // 2 — neon ruins
  {
    skyTop:    '#3a1a5a',
    skyMid:    '#ff5a92',
    skyBottom: '#0e0820',
    far:       '#5a2a8a',
    mid:       '#3a1a6a',
    near:      '#241040',
    ground:    '#9a4dff',
    groundDk:  '#5a1fc4',
    accent:    '#36e0ff',
  },
  // 3 — sky islands
  {
    skyTop:    '#aef1ff',
    skyMid:    '#ffe7b0',
    skyBottom: '#27395a',
    far:       '#6f8fc0',
    mid:       '#4f6da0',
    near:      '#34527a',
    ground:    '#e8b85a',
    groundDk:  '#a8782a',
    accent:    '#ff5a92',
  },
];

// Level rows are 17 lines tall (272px world) — top row is sky.
// Row 0 is the top of the world; bottom row is solid ground.
// Width is the column count; level scrolls horizontally to that.

const L1 = [
  '..............................................................................',
  '..............................................................................',
  '..............................................................................',
  '..............................................................................',
  '..............................................................................',
  '..............................................................................',
  '...........................?......?...........................................',
  '..............................................................................',
  '...................===........===.............................................',
  '..............................................................................',
  '...........?..............................===...............................F.',
  '..............................................................................',
  '..............................................................................',
  '..P....................................................................########',
  '###############......######################........############################',
  '###############......######################........############################',
  '###############......######################........############################',
];

const L2 = [
  '....................................................................................................',
  '....................................................................................................',
  '....................................................................................................',
  '....................................................................................................',
  '...........................................................?......................................',
  '....................................................................................................',
  '..................?..............#####.........................?...................................',
  '....................................................................................................',
  '............===..........===.................===.........===..............===.....................F',
  '....................................................................................................',
  '......................................................................................###..........',
  '..P.................................................................................................',
  '....................................................................................................',
  '###################......##############......##############......##################......###########',
  '###################......##############......##############......##################......###########',
  '###################......##############......##############......##################......###########',
  '###################......##############......##############......##################......###########',
];

const L3 = [
  '........................................................................................................................',
  '........................................................................................................................',
  '........................................................................................................................',
  '........................................................................................................................',
  '..........................................................?...................................?.......................',
  '........................................................................................................................',
  '..............?......................##......................................##.......................................',
  '........................................................................................................................',
  '............===.........===.........===.........===.........===.........===.........===.........===.................F..',
  '........................................................................................................................',
  '..................................................................................###################................',
  '..P.....................................................................................................................',
  '........................................................................................................................',
  '##############.....##########.....##########.....##########.....##########.....##########.....######........############',
  '##############^^^^^##########^^^^^##########^^^^^##########^^^^^##########^^^^^##########^^^^^######^^^^^^^^############',
  '##############.....##########.....##########.....##########.....##########.....##########.....######........############',
  '##############.....##########.....##########.....##########.....##########.....##########.....######........############',
];

// Enemies + collectibles authored separately. Coords are in tile units
// (col, row from the top of the level). 'kind' decides behaviour.
//   crawler  — walks, turns at edges/walls
//   hopper   — sits, jumps every ~1.2s with telegraph; takes 2 stomps
//   coin     — +50 score, spinning
//   star     — +500 score, glow trail
//   platform — moving 3-tile platform, period 4s (axis 'x' or 'y', range tiles)
const SPAWNS = [
  // Level 1 — gentle intro
  [
    { kind: 'coin',    col: 16, row: 11 },
    { kind: 'coin',    col: 18, row: 11 },
    { kind: 'coin',    col: 20, row: 11 },
    { kind: 'coin',    col: 28, row: 7 },
    { kind: 'coin',    col: 36, row: 7 },
    { kind: 'crawler', col: 50, row: 12 },
    { kind: 'coin',    col: 58, row: 9 },
    { kind: 'coin',    col: 60, row: 9 },
    { kind: 'star',    col: 70, row: 7 },
  ],
  // Level 2 — climbing + 1 hopper + moving platform
  [
    { kind: 'coin',    col: 12, row: 11 },
    { kind: 'coin',    col: 14, row: 11 },
    { kind: 'crawler', col: 26, row: 12 },
    { kind: 'platform', col: 28, row: 11, axis: 'x', range: 4, period: 240 },
    { kind: 'coin',    col: 34, row: 7 },
    { kind: 'coin',    col: 36, row: 7 },
    { kind: 'hopper',  col: 50, row: 12 },
    { kind: 'platform', col: 56, row: 9, axis: 'y', range: 3, period: 240 },
    { kind: 'crawler', col: 70, row: 12 },
    { kind: 'coin',    col: 80, row: 5 },
    { kind: 'star',    col: 88, row: 4 },
    { kind: 'coin',    col: 92, row: 11 },
  ],
  // Level 3 — gauntlet
  [
    { kind: 'coin',    col: 10, row: 11 },
    { kind: 'coin',    col: 12, row: 11 },
    { kind: 'crawler', col: 18, row: 12 },
    { kind: 'platform', col: 22, row: 11, axis: 'x', range: 4, period: 200 },
    { kind: 'hopper',  col: 30, row: 12 },
    { kind: 'crawler', col: 44, row: 12 },
    { kind: 'star',    col: 50, row: 5 },
    { kind: 'platform', col: 56, row: 10, axis: 'y', range: 2, period: 180 },
    { kind: 'hopper',  col: 64, row: 12 },
    { kind: 'crawler', col: 78, row: 12 },
    { kind: 'coin',    col: 88, row: 7 },
    { kind: 'coin',    col: 90, row: 7 },
    { kind: 'coin',    col: 92, row: 7 },
    { kind: 'star',    col: 100, row: 4 },
  ],
];

const LEVELS = [L1, L2, L3];

// ----------------------------------------------------------------------
// Decode a level into a grid + spawn point + goal point.
// ----------------------------------------------------------------------
function buildLevel(idx) {
  const map = LEVELS[idx];
  const cols = map[0].length;
  const rows = map.length;
  const grid = [];
  let spawn = { x: 32, y: rows * TILE - 64 };
  let goal  = { x: cols * TILE - 32, y: rows * TILE - 48 };

  for (let r = 0; r < rows; r++) {
    const line = map[r];
    const out = new Array(cols).fill('.');
    for (let c = 0; c < cols; c++) {
      const ch = line[c];
      if (ch === 'P') { spawn = { x: c * TILE + 2, y: r * TILE }; out[c] = '.'; }
      else if (ch === 'F') { goal  = { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }; out[c] = '.'; }
      else out[c] = ch;
    }
    grid.push(out);
  }

  // Hydrate spawns into runtime entity instances.
  const entSeed = SPAWNS[idx];
  const enemies = [];
  const coins   = [];
  const stars   = [];
  const platforms = [];
  for (const e of entSeed) {
    const x = e.col * TILE;
    const y = e.row * TILE;
    if (e.kind === 'crawler') {
      enemies.push({ kind: 'crawler', x, y, w: 14, h: 12, vx: -0.6, vy: 0, alive: true });
    } else if (e.kind === 'hopper') {
      enemies.push({ kind: 'hopper', x, y, w: 12, h: 16, vx: 0, vy: 0, alive: true, hp: 2, hopT: 0, telegraph: 0 });
    } else if (e.kind === 'coin') {
      coins.push({ x: x + 4, y: y + 4, w: 8, h: 8, taken: false, t: Math.random() * Math.PI * 2 });
    } else if (e.kind === 'star') {
      stars.push({ x: x + 2, y: y + 2, w: 12, h: 12, taken: false, t: 0 });
    } else if (e.kind === 'platform') {
      platforms.push({
        baseX: x, baseY: y,
        x, y, w: 3 * TILE, h: 6,
        axis: e.axis, range: (e.range ?? 3) * TILE, period: e.period ?? 240,
        t: 0,
      });
    }
  }

  return { grid, cols, rows, spawn, goal, enemies, coins, stars, platforms };
}

// ----------------------------------------------------------------------
// Tile sampling helpers.
// ----------------------------------------------------------------------
function tileAt(level, col, row) {
  if (col < 0 || col >= level.cols || row < 0 || row >= level.rows) return '.';
  return level.grid[row][col];
}
function setTile(level, col, row, ch) {
  if (col < 0 || col >= level.cols || row < 0 || row >= level.rows) return;
  level.grid[row][col] = ch;
}

// AABB vs solid tiles in the level. Returns the cell hit (for resolution).
function probeSolid(level, x, y, w, h) {
  const c0 = Math.floor(x / TILE);
  const c1 = Math.floor((x + w - 0.001) / TILE);
  const r0 = Math.floor(y / TILE);
  const r1 = Math.floor((y + h - 0.001) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const ch = tileAt(level, c, r);
      if (SOLID.has(ch) || MYSTERY.has(ch)) {
        return { c, r, ch };
      }
    }
  }
  return null;
}

// One-way platform: only collide if player's *previous bottom* was above it.
function probeOneway(level, x, y, w, h, prevBottom) {
  const c0 = Math.floor(x / TILE);
  const c1 = Math.floor((x + w - 0.001) / TILE);
  const r0 = Math.floor(y / TILE);
  const r1 = Math.floor((y + h - 0.001) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const ch = tileAt(level, c, r);
      if (ONEWAY.has(ch)) {
        const top = r * TILE;
        if (prevBottom <= top + 0.5) return { c, r, ch, top };
      }
    }
  }
  return null;
}

// Spike check (top-facing ^ — only the upper half hurts).
function probeSpike(level, x, y, w, h) {
  const c0 = Math.floor(x / TILE);
  const c1 = Math.floor((x + w - 0.001) / TILE);
  const r0 = Math.floor(y / TILE);
  const r1 = Math.floor((y + h - 0.001) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const ch = tileAt(level, c, r);
      if (SPIKE.has(ch)) {
        const top = r * TILE + 8;
        if (y + h > top) return true;
      }
    }
  }
  return false;
}

// AABB vs AABB.
function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ----------------------------------------------------------------------
// 2.5D plane mapping. Sim (x, y) → three world (x, -y, z). Sim y grows
// downward (screen coords); three +Y is up, so we negate. The physics
// never sees z; only the renderer applies this.
// ----------------------------------------------------------------------
const SY = -1;
const w2x = (x) => x;
const w2y = (y) => y * SY;

// Deterministic hash for stable parallax placement.
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ----------------------------------------------------------------------
// Procedural CanvasTextures (no external assets). Built once, shared.
// ----------------------------------------------------------------------
function makeBrickTexture(faceCol, mortarCol) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = mortarCol;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = faceCol;
  const bw = 30, bh = 14, gap = 2;
  for (let row = 0, y = 0; y < 64; row++, y += bh + gap) {
    const off = (row % 2) * ((bw + gap) / 2);
    for (let x = -bw; x < 64 + bw; x += bw + gap) {
      g.fillRect(x + off, y, bw, bh);
    }
  }
  // subtle top highlight per brick
  g.fillStyle = 'rgba(255,255,255,0.10)';
  for (let row = 0, y = 0; y < 64; row++, y += bh + gap) {
    const off = (row % 2) * ((bw + gap) / 2);
    for (let x = -bw; x < 64 + bw; x += bw + gap) {
      g.fillRect(x + off, y, bw, 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeGrassTexture(grassCol, soilCol) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = soilCol;
  g.fillRect(0, 0, 64, 32);
  g.fillStyle = grassCol;
  g.fillRect(0, 0, 64, 12);
  // grass tufts
  for (let x = 0; x < 64; x += 4) {
    const h = 10 + ((x * 7) % 6);
    g.fillRect(x + 1, 12, 2, -((h - 10)) - 2);
    g.fillRect(x + 1, 10, 2, 4);
  }
  // soil speckle
  g.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 40; i++) {
    g.fillRect((i * 23) % 64, 14 + ((i * 13) % 16), 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ----------------------------------------------------------------------
// Three.js renderer. Built once; rebuildLevel() builds static geometry per
// level from the SAME tile grid the collision uses. render() reads the live
// sim state each frame. dispose() tears everything down.
// ----------------------------------------------------------------------
function makeRenderer3D(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;            // bright, cheerful
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  // Perspective side camera looking down −Z at the z=0 play plane.
  const camera = new THREE.PerspectiveCamera(42, VIEW_W / VIEW_H, 1, 6000);
  camera.position.set(0, 0, 420);
  scene.add(camera);

  // ── Sky dome — vertical gradient via shader (fog:false so it stays put).
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color('#7fd0ff') },
      uMid: { value: new THREE.Color('#ffd6e0') },
      uBot: { value: new THREE.Color('#1a2240') },
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

  // ── Lights — bright, cheerful. Key light on the CAMERA side (+Z) so the
  // faces we see are lit, not silhouetted.
  const key = new THREE.DirectionalLight(0xfff3da, 1.55);
  key.position.set(-120, 260, 360);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 1400;
  key.shadow.camera.left = -360;
  key.shadow.camera.right = 360;
  key.shadow.camera.top = 320;
  key.shadow.camera.bottom = -320;
  key.shadow.bias = -0.0006;
  scene.add(key);
  scene.add(key.target);

  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x4a5a3a, 1.0);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const fill = new THREE.DirectionalLight(0xa9c8ff, 0.45);
  fill.position.set(160, 120, 320);
  scene.add(fill);

  // ── Parallax background — clouds + hill bands, rebuilt per level so the
  // palette matches. Lives in its own group at large −z.
  let bgGroup = new THREE.Group();
  scene.add(bgGroup);

  // ── Level container — rebuilt per level. Holds the tile blocks, goal,
  // built from the unchanged grid. Player/enemies/coins/stars/particles
  // live in persistent pools that survive level swaps.
  let levelGroup = new THREE.Group();
  scene.add(levelGroup);

  // Persistent shared textures.
  const brickTexCache = new Map();
  const grassTexCache = new Map();
  function brickTex(face, mortar) {
    const k = face + mortar;
    if (!brickTexCache.has(k)) brickTexCache.set(k, makeBrickTexture(face, mortar));
    return brickTexCache.get(k);
  }
  function grassTex(grass, soil) {
    const k = grass + soil;
    if (!grassTexCache.has(k)) grassTexCache.set(k, makeGrassTexture(grass, soil));
    return grassTexCache.get(k);
  }

  // Per-level tracked materials/geometries for disposal.
  let levelMats = [];
  let levelGeos = [];

  // Records that the render loop animates.
  let goalRec = null;          // { pole, flagMat }
  const coinRecs = [];         // { mesh } indexed parallel to lvl.coins
  const starRecs = [];         // { group, glowMat }
  const enemyRecs = [];        // { group, bodyMat, eyeL?, eyeR?, kind }
  const platformRecs = [];     // { mesh }
  let mysteryRecs = [];        // { mesh, col, row } so we can swap spent blocks

  // ── Player rig — a little 3D character: body, head, two arms, two legs.
  const playerGroup = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: '#fff1d4', roughness: 0.6, metalness: 0.0 });
  const cloth = new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.7, metalness: 0.05 });
  const accent = new THREE.MeshStandardMaterial({
    color: '#ff3a8a', emissive: new THREE.Color('#ff3a8a'),
    emissiveIntensity: 0.35, roughness: 0.5,
  });
  const limbMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.7 });
  // body
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(P_W, P_H - 7, 7), cloth);
  bodyMesh.position.set(0, -(5 + (P_H - 7) / 2 - P_H / 2), 0);
  bodyMesh.castShadow = true;
  playerGroup.add(bodyMesh);
  // accent stripe
  const stripeMesh = new THREE.Mesh(new THREE.BoxGeometry(P_W, 3, 7.4), accent);
  stripeMesh.position.set(0, -(9 + 1.5 - P_H / 2), 0);
  playerGroup.add(stripeMesh);
  // head
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(4, 18, 14), skin);
  headMesh.position.set(0, P_H / 2 - 4, 1);
  headMesh.castShadow = true;
  playerGroup.add(headMesh);
  // eye (faces forward, nudged by facing)
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#222' });
  const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), eyeMat);
  eyeMesh.position.set(1.4, P_H / 2 - 4, 4.2);
  playerGroup.add(eyeMesh);
  // legs (animated)
  const legGeo = new THREE.BoxGeometry(3, 5, 4);
  const legL = new THREE.Mesh(legGeo, limbMat); legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, limbMat); legR.castShadow = true;
  legL.position.set(-3, -P_H / 2 + 2.5, 0);
  legR.position.set(3, -P_H / 2 + 2.5, 0);
  playerGroup.add(legL); playerGroup.add(legR);
  // arms (animated)
  const armGeo = new THREE.BoxGeometry(2.5, 6, 3);
  const armL = new THREE.Mesh(armGeo, cloth); armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, cloth); armR.castShadow = true;
  armL.position.set(-(P_W / 2 + 0.5), 0, 0);
  armR.position.set(P_W / 2 + 0.5, 0, 0);
  playerGroup.add(armL); playerGroup.add(armR);
  scene.add(playerGroup);

  // ── Particle pool — instanced cubes. No per-frame allocation.
  const PART_N = 220;
  const partMat = new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, vertexColors: true,
  });
  const partGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
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
    scene.remove(levelGroup);
    disposeGroup(levelGroup);
    scene.remove(bgGroup);
    disposeGroup(bgGroup);
    // playerGroup children swap their materials? No — those are persistent.
    // Enemy/coin/star groups are children of levelGroup, so disposed above.
    levelMats.forEach((m) => m.dispose?.());
    levelGeos.forEach((g) => g.dispose?.());
    levelMats = [];
    levelGeos = [];
    goalRec = null;
    coinRecs.length = 0;
    starRecs.length = 0;
    enemyRecs.length = 0;
    platformRecs.length = 0;
    mysteryRecs = [];
    levelGroup = new THREE.Group();
    bgGroup = new THREE.Group();
    scene.add(bgGroup);
    scene.add(levelGroup);
  }

  // Build a beveled-top tile block at the given tile (col,row), using one of
  // the shared/level materials. Returns the mesh (already added to group).
  function addBlock(group, col, row, depth, topMat, sideMat, z = 0) {
    const geo = new THREE.BoxGeometry(TILE, TILE, depth);
    levelGeos.push(geo);
    // box face order: +x,-x,+y,-y,+z,-z. top is +y.
    const mats = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    const m = new THREE.Mesh(geo, mats);
    m.position.set(col * TILE + TILE / 2, w2y(row * TILE + TILE / 2), z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // ── Build the entire level scene from the unchanged tile grid + entities.
  function rebuildLevel(state) {
    clearLevel();
    camPrimed = false;
    const lvl = state.level;
    const pal = PALETTE[state.levelIdx];

    // Sky gradient swap.
    skyMat.uniforms.uTop.value.set(pal.skyTop);
    skyMat.uniforms.uMid.value.set(pal.skyMid);
    skyMat.uniforms.uBot.value.set(pal.skyBottom);

    const worldW = lvl.cols * TILE;
    const worldH = lvl.rows * TILE;
    const floorY = w2y(worldH);

    // ── Parallax hill bands (far/mid/near) + clouds, palette-tinted.
    const bands = [
      { z: -900, col: pal.far, base: 70, amp: 60, step: 90, op: 0.9 },
      { z: -560, col: pal.mid, base: 95, amp: 70, step: 76, op: 0.95 },
      { z: -300, col: pal.near, base: 120, amp: 50, step: 64, op: 1 },
    ];
    for (const b of bands) {
      const count = Math.ceil((worldW + 800) / b.step) + 2;
      const geo = new THREE.ConeGeometry(b.step * 0.9, 1, 6);
      levelGeos.push(geo);
      const mat = new THREE.MeshStandardMaterial({
        color: b.col, roughness: 1, metalness: 0,
        transparent: b.op < 1, opacity: b.op,
      });
      levelMats.push(mat);
      const inst = new THREE.InstancedMesh(geo, mat, count);
      inst.frustumCulled = false;
      for (let i = 0; i < count; i++) {
        const hx = -400 + i * b.step;
        const hh = b.base + hash2(i * 2.3, b.z) * b.amp;
        _p.set(hx, floorY - 110 + hh / 2, b.z);
        _q.identity();
        _s.set(1, hh, 1);
        _m.compose(_p, _q, _s);
        inst.setMatrixAt(i, _m);
      }
      inst.instanceMatrix.needsUpdate = true;
      bgGroup.add(inst);
    }
    // Clouds — soft white discs drifting (animated in render via group offset).
    const cloudGeo = new THREE.SphereGeometry(1, 12, 8);
    levelGeos.push(cloudGeo);
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    levelMats.push(cloudMat);
    const cloudCount = Math.ceil(worldW / 240) + 4;
    const cloudInst = new THREE.InstancedMesh(cloudGeo, cloudMat, cloudCount * 3);
    cloudInst.frustumCulled = false;
    let ci = 0;
    for (let i = 0; i < cloudCount; i++) {
      const cx = -200 + i * 240 + hash2(i, 7) * 120;
      const cy = floorY - 40 - hash2(i, 13) * 160;
      for (let p = 0; p < 3; p++) {
        const r = 22 + hash2(i * 3 + p, 4) * 16;
        _p.set(cx + (p - 1) * r * 0.9, cy + (p === 1 ? r * 0.4 : 0), -680);
        _q.identity();
        _s.set(r, r * 0.7, r);
        _m.compose(_p, _q, _s);
        cloudInst.setMatrixAt(ci++, _m);
      }
    }
    cloudInst.count = ci;
    cloudInst.instanceMatrix.needsUpdate = true;
    bgGroup.add(cloudInst);

    // ── Tile blocks built straight from lvl.grid (the collision grid). We
    // never read or change tile coords here — only render them.
    const topGround = new THREE.MeshStandardMaterial({
      color: '#ffffff', roughness: 0.95, metalness: 0,
      map: grassTex(pal.ground, pal.groundDk),
    });
    const sideGround = new THREE.MeshStandardMaterial({
      color: '#ffffff', roughness: 0.95, metalness: 0,
      map: brickTex(pal.groundDk, '#00000033'),
    });
    const spentMat = new THREE.MeshStandardMaterial({
      color: pal.groundDk, roughness: 0.9, metalness: 0.05,
    });
    levelMats.push(topGround, sideGround, spentMat);

    for (let r = 0; r < lvl.rows; r++) {
      for (let c = 0; c < lvl.cols; c++) {
        const ch = lvl.grid[r][c];
        if (ch === '#') {
          // Grass-topped only if no solid directly above; else all-brick.
          const above = (r > 0) ? lvl.grid[r - 1][c] : '.';
          const exposedTop = !(SOLID.has(above) || MYSTERY.has(above));
          addBlock(levelGroup, c, r, 22, exposedTop ? topGround : sideGround, sideGround);
        } else if (ch === '-') {
          addBlock(levelGroup, c, r, 20, spentMat, spentMat);
        } else if (ch === '?') {
          const mat = new THREE.MeshStandardMaterial({
            color: pal.accent, emissive: new THREE.Color(pal.accent),
            emissiveIntensity: 0.45, roughness: 0.4, metalness: 0.2,
          });
          levelMats.push(mat);
          const m = addBlock(levelGroup, c, r, 20, mat, mat);
          mysteryRecs.push({ mesh: m, col: c, row: r, mat });
        } else if (ch === '=') {
          // Oneway — slim slab, sits at the top of the tile.
          const geo = new THREE.BoxGeometry(TILE, 4, 16);
          levelGeos.push(geo);
          const mat = new THREE.MeshStandardMaterial({
            color: pal.accent, emissive: new THREE.Color(pal.accent),
            emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.3,
          });
          levelMats.push(mat);
          const m = new THREE.Mesh(geo, mat);
          m.position.set(c * TILE + TILE / 2, w2y(r * TILE + 2), 0);
          m.castShadow = true;
          m.receiveShadow = true;
          levelGroup.add(m);
        } else if (ch === '^') {
          // Spikes — a row of cones on the bottom half of the tile.
          const geo = new THREE.ConeGeometry(1.6, 8, 4);
          levelGeos.push(geo);
          const mat = new THREE.MeshStandardMaterial({
            color: '#cc2244', emissive: new THREE.Color('#7a0e22'),
            emissiveIntensity: 0.35, roughness: 0.5, metalness: 0.3,
          });
          levelMats.push(mat);
          const inst = new THREE.InstancedMesh(geo, mat, 4);
          inst.castShadow = true;
          for (let i = 0; i < 4; i++) {
            _p.set(c * TILE + i * 4 + 2, w2y(r * TILE + TILE - 4), 0);
            _q.identity(); _s.set(1, 1, 1);
            _m.compose(_p, _q, _s);
            inst.setMatrixAt(i, _m);
          }
          inst.instanceMatrix.needsUpdate = true;
          levelGroup.add(inst);
        }
      }
    }

    // ── Goal flag — pole + triangular flag.
    {
      const g = lvl.goal;
      const poleGeo = new THREE.CylinderGeometry(1.2, 1.2, 60, 8);
      levelGeos.push(poleGeo);
      const poleMat = new THREE.MeshStandardMaterial({ color: '#cfd6e0', roughness: 0.5, metalness: 0.4 });
      levelMats.push(poleMat);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(g.x, w2y(g.y - 6), 0);
      pole.castShadow = true;
      levelGroup.add(pole);
      // flag (a flattened triangle)
      const flagShape = new THREE.Shape();
      flagShape.moveTo(0, 0);
      flagShape.lineTo(18, 8);
      flagShape.lineTo(0, 16);
      flagShape.closePath();
      const flagGeo = new THREE.ExtrudeGeometry(flagShape, { depth: 1.5, bevelEnabled: false });
      levelGeos.push(flagGeo);
      const flagMat = new THREE.MeshStandardMaterial({
        color: pal.accent, emissive: new THREE.Color(pal.accent),
        emissiveIntensity: 0.4, roughness: 0.5, side: THREE.DoubleSide,
      });
      levelMats.push(flagMat);
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(g.x, w2y(g.y - 36) - 16, 0);
      flag.castShadow = true;
      levelGroup.add(flag);
      goalRec = { flag, flagMat };
    }

    // ── Moving platforms.
    for (const pf of lvl.platforms) {
      const geo = new THREE.BoxGeometry(pf.w, pf.h + 6, 16);
      levelGeos.push(geo);
      const mat = new THREE.MeshStandardMaterial({
        color: pal.accent, emissive: new THREE.Color(pal.accent),
        emissiveIntensity: 0.4, roughness: 0.4, metalness: 0.3,
      });
      levelMats.push(mat);
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      levelGroup.add(m);
      platformRecs.push({ mesh: m, pf });
    }

    // ── Coins — spinning 3D discs.
    const coinGeo = new THREE.CylinderGeometry(4, 4, 1.4, 16);
    levelGeos.push(coinGeo);
    const coinMat = new THREE.MeshStandardMaterial({
      color: '#f6c93a', emissive: new THREE.Color('#f6c93a'),
      emissiveIntensity: 0.45, roughness: 0.3, metalness: 0.6,
    });
    levelMats.push(coinMat);
    for (let i = 0; i < lvl.coins.length; i++) {
      const m = new THREE.Mesh(coinGeo, coinMat);
      m.castShadow = true;
      m.rotation.x = Math.PI / 2;       // face the camera, spin about world Y later
      levelGroup.add(m);
      coinRecs[i] = { mesh: m };
    }

    // ── Stars — 3D extruded stars with a glow shell.
    const starShape = new THREE.Shape();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const a2 = a + Math.PI / 5;
      const r1 = 6, r2 = 2.6;
      if (i === 0) starShape.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      else starShape.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      starShape.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
    }
    starShape.closePath();
    const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 2.4, bevelEnabled: true, bevelSize: 0.6, bevelThickness: 0.6, bevelSegments: 1 });
    starGeo.center();
    levelGeos.push(starGeo);
    const starMat = new THREE.MeshStandardMaterial({
      color: '#fff5a0', emissive: new THREE.Color('#ffe87a'),
      emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.4,
    });
    levelMats.push(starMat);
    const glowGeo = new THREE.SphereGeometry(9, 14, 10);
    levelGeos.push(glowGeo);
    for (let i = 0; i < lvl.stars.length; i++) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(starGeo, starMat);
      body.castShadow = true;
      group.add(body);
      const glowMat = new THREE.MeshBasicMaterial({
        color: pal.accent, transparent: true, opacity: 0.35, depthWrite: false,
      });
      levelMats.push(glowMat);
      const glow = new THREE.Mesh(glowGeo, glowMat);
      group.add(glow);
      levelGroup.add(group);
      starRecs[i] = { group, body, glowMat };
    }

    // ── Enemies — 3D creatures.
    for (let i = 0; i < lvl.enemies.length; i++) {
      const e = lvl.enemies[i];
      const group = new THREE.Group();
      if (e.kind === 'crawler') {
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#5a3e60', roughness: 0.6, metalness: 0.1 });
        levelMats.push(bodyMat);
        const body = new THREE.Mesh(new THREE.BoxGeometry(e.w, e.h, e.w), bodyMat);
        body.castShadow = true;
        group.add(body);
        const shellMat = new THREE.MeshStandardMaterial({ color: '#3a2a40', roughness: 0.5 });
        levelMats.push(shellMat);
        const shell = new THREE.Mesh(new THREE.SphereGeometry(e.w * 0.55, 12, 8), shellMat);
        shell.scale.set(1, 0.6, 1);
        shell.position.set(0, e.h * 0.35, 0);
        shell.castShadow = true;
        group.add(shell);
        const eyeM = new THREE.MeshBasicMaterial({ color: '#fff' });
        levelMats.push(eyeM);
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6), eyeM);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6), eyeM);
        eyeL.position.set(-2.4, e.h * 0.2, e.w * 0.5);
        eyeR.position.set(2.4, e.h * 0.2, e.w * 0.5);
        group.add(eyeL); group.add(eyeR);
        levelGroup.add(group);
        enemyRecs[i] = { group, kind: 'crawler' };
      } else if (e.kind === 'hopper') {
        const bodyMat = new THREE.MeshStandardMaterial({
          color: '#a02050', emissive: new THREE.Color('#3a0820'),
          emissiveIntensity: 0.2, roughness: 0.55,
        });
        levelMats.push(bodyMat);
        const body = new THREE.Mesh(new THREE.BoxGeometry(e.w, e.h - 2, e.w), bodyMat);
        body.castShadow = true;
        group.add(body);
        const capMat = new THREE.MeshStandardMaterial({ color: '#1a0820', roughness: 0.6 });
        levelMats.push(capMat);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(e.w * 0.55, 12, 8), capMat);
        cap.scale.set(1, 0.7, 1);
        cap.position.set(0, e.h * 0.45, 0);
        cap.castShadow = true;
        group.add(cap);
        const eyeM = new THREE.MeshBasicMaterial({ color: '#fff' });
        levelMats.push(eyeM);
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), eyeM);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), eyeM);
        eyeL.position.set(-2.2, e.h * 0.42, e.w * 0.5);
        eyeR.position.set(2.2, e.h * 0.42, e.w * 0.5);
        group.add(eyeL); group.add(eyeR);
        levelGroup.add(group);
        enemyRecs[i] = { group, kind: 'hopper', bodyMat };
      }
    }
  }

  // ── Resize — manual, never via sizeCanvasFluid (that grabs a 2D ctx).
  let camPrimed = false;
  let viewW = VIEW_W, viewH = VIEW_H;
  function resize(cssW, cssH) {
    viewW = Math.max(1, cssW);
    viewH = Math.max(1, cssH);
    renderer.setSize(viewW, viewH, false);
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();
  }

  // Camera distance so VIEW_W sim-px span across, matching the 2D camera's
  // horizontal field of view.
  function camDistanceForSpan(spanX) {
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * Math.max(0.3, camera.aspect));
    return (spanX / 2) / Math.tan(hHalf);
  }

  // ── Per-frame render. Reads sim state; never mutates it (except litT-like
  // render-local decay, of which there is none here).
  function render(state, rawDt) {
    if (!state) return;
    const lvl = state.level;
    const p = state.player;
    const cam = state.cam;
    const t = performance.now() / 1000;

    // Camera: the sim's cam.x/cam.y is the viewport top-left in sim space.
    // Centre on it; match the horizontal span to VIEW_W (2D viewport).
    const centreSimX = cam.x + VIEW_W / 2;
    const centreSimY = cam.y + VIEW_H / 2;
    const camZ = camDistanceForSpan(VIEW_W);
    const tx = w2x(centreSimX);
    const ty = w2y(centreSimY);
    if (!camPrimed) {
      camera.position.set(tx, ty, camZ);
      camPrimed = true;
    } else {
      camera.position.x += (tx - camera.position.x) * Math.min(1, rawDt * 14);
      camera.position.y += (ty - camera.position.y) * Math.min(1, rawDt * 14);
      camera.position.z += (camZ - camera.position.z) * Math.min(1, rawDt * 6);
    }
    camera.lookAt(camera.position.x, camera.position.y, 0);

    // Key light follows the player so shadows stay crisp on screen.
    key.position.set(w2x(p.x) - 120, w2y(p.y) + 260, 360);
    key.target.position.set(w2x(p.x), w2y(p.y), 0);
    key.target.updateMatrixWorld();

    // Sky + background follow the camera (parallax via fractional follow).
    sky.position.set(camera.position.x, camera.position.y, 0);

    // ── Mystery blocks — swap to "spent" look when the sim flips them to '-'.
    for (const rec of mysteryRecs) {
      if (rec.spent) continue;
      if (lvl.grid[rec.row][rec.col] === '-') {
        rec.spent = true;
        const dim = PALETTE[state.levelIdx].groundDk;
        rec.mat.color.set(dim);
        rec.mat.emissive.set('#000000');
        rec.mat.emissiveIntensity = 0;
      } else {
        // gentle pulse while live
        rec.mat.emissiveIntensity = 0.4 + 0.15 * Math.sin(t * 3 + rec.col);
      }
    }

    // ── Moving platforms.
    for (const rec of platformRecs) {
      const pf = rec.pf;
      rec.mesh.position.set(pf.x + pf.w / 2, w2y(pf.y + pf.h / 2), 0);
    }

    // ── Goal flag wave.
    if (goalRec) {
      goalRec.flag.rotation.y = Math.sin(t * 3) * 0.35;
      goalRec.flagMat.emissiveIntensity = 0.35 + 0.2 * (0.5 + 0.5 * Math.sin(t * 2));
    }

    // ── Coins — spin + bob, hide taken.
    for (let i = 0; i < coinRecs.length; i++) {
      const coin = lvl.coins[i];
      const rec = coinRecs[i];
      if (!rec) continue;
      if (!coin || coin.taken) { rec.mesh.visible = false; continue; }
      rec.mesh.visible = true;
      const cx = coin.x + 4;
      const cy = coin.y + 4;
      rec.mesh.position.set(cx, w2y(cy) + Math.sin(t * 3 + i) * 1.4, 0);
      // spin about world Y: keep the disc upright then rotate
      rec.mesh.rotation.z = t * 4 + i;
    }
    // Late-spawned coins (mystery-block coins) have no rec — none expected
    // beyond the authored set in practice, but guard the count.

    // ── Stars — spin + bob + pulse glow.
    for (let i = 0; i < starRecs.length; i++) {
      const star = lvl.stars[i];
      const rec = starRecs[i];
      if (!rec) continue;
      if (!star || star.taken) { rec.group.visible = false; continue; }
      rec.group.visible = true;
      const sx = star.x + 6;
      const sy = star.y + 6 + Math.sin(star.t) * 1.4;
      rec.group.position.set(sx, w2y(sy), 0);
      rec.body.rotation.z = star.t;
      const pulse = 0.3 + 0.15 * (0.5 + 0.5 * Math.sin(t * 5 + i));
      rec.glowMat.opacity = pulse;
    }

    // ── Enemies — position + facing + animation, hide dead.
    for (let i = 0; i < enemyRecs.length; i++) {
      const e = lvl.enemies[i];
      const rec = enemyRecs[i];
      if (!rec) continue;
      if (!e || !e.alive) { rec.group.visible = false; continue; }
      rec.group.visible = true;
      rec.group.position.set(e.x + e.w / 2, w2y(e.y + e.h / 2), 0);
      if (rec.kind === 'crawler') {
        rec.group.rotation.y = e.vx > 0 ? 0.25 : -0.25;
        rec.group.rotation.z = Math.sin(t * 8) * 0.06;   // waddle
      } else if (rec.kind === 'hopper') {
        rec.group.rotation.y = e.vx > 0 ? 0.2 : -0.2;
        // squash on telegraph
        const sq = e.telegraph ? 1.25 : 1;
        rec.group.scale.set(sq, 2 - sq, sq);
        if (rec.bodyMat) {
          rec.bodyMat.emissive.set(e.telegraph ? '#ff4060' : '#3a0820');
          rec.bodyMat.emissiveIntensity = e.telegraph ? 0.6 : 0.2;
        }
      }
    }

    // ── Player rig — position, facing, run/jump animation.
    const blink = p.invul > 0 && (Math.floor(p.invul / 4) % 2 === 0);
    playerGroup.visible = !blink && !(p.dead && p.y < -50);
    playerGroup.position.set(w2x(p.x + P_W / 2), w2y(p.y + P_H / 2), 0);
    playerGroup.rotation.y = p.facing > 0 ? 0 : Math.PI;
    eyeMesh.position.x = 1.4;   // facing handled by group flip
    // run cycle / jump pose
    const running = p.onGround && Math.abs(p.vx) > 0.4;
    const stride = running ? Math.sin(state.elapsed * 18) : 0;
    if (!p.onGround) {
      // jump pose — legs tucked, arms up a touch
      legL.rotation.x = -0.5; legR.rotation.x = 0.5;
      armL.rotation.x = -0.6; armR.rotation.x = -0.6;
    } else {
      legL.rotation.x = stride * 0.8;
      legR.rotation.x = -stride * 0.8;
      armL.rotation.x = -stride * 0.7;
      armR.rotation.x = stride * 0.7;
    }

    // ── Particles. Read the sim's particle list (death/coin/stomp/star/dust).
    let pi = 0;
    for (const part of state.particles) {
      if (pi >= PART_N) break;
      const a = Math.max(0, part.life / 30);
      _p.set(w2x(part.x), w2y(part.y), 2);
      _q.identity();
      const sz = 1 + a * 1.4;
      _s.set(sz, sz, sz);
      _m.compose(_p, _q, _s);
      partMesh.setMatrixAt(pi, _m);
      if (part.kind === 'spark') _c.set('#ffe080');
      else if (part.kind === 'debris') _c.set('#b45078');
      else if (part.kind === 'star') _c.set('#fff0a0');
      else _c.set('#dcdcc8');   // dust
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

    // ── Death/clear screen fade via tone exposure dip (subtle, visual only).
    renderer.toneMappingExposure = 1.45 * (1 - state.screenFade * 0.5);

    renderer.render(scene, camera);
  }

  function dispose() {
    clearLevel();
    scene.remove(levelGroup);
    scene.remove(bgGroup);
    // Persistent objects.
    playerGroup.traverse((o) => { o.geometry?.dispose?.(); });
    [skin, cloth, accent, limbMat, eyeMat].forEach((m) => m.dispose?.());
    [sky].forEach((o) => o.geometry?.dispose?.());
    skyMat.dispose();
    partGeo.dispose();
    partMat.dispose();
    brickTexCache.forEach((tx) => tx.dispose?.());
    grassTexCache.forEach((tx) => tx.dispose?.());
    renderer.dispose();
  }

  return { scene, camera, renderer, rebuildLevel, render, resize, dispose };
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
export default function BricklandsGame() {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const stateRef  = useRef(null);
  const rendererRef = useRef(null);
  const submittedRef = useRef(false);

  // HUD state — updated at ~10Hz from the loop.
  const [hud, setHud] = useState({
    level: 1, lives: 3, score: 0, coins: 0, stars: 0, time: 0, deaths: 0, status: 'playing',
  });

  // Construct everything once. Effects below own the loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    // Detect touch — virtual controls ride alongside, dispatch to keys map.
    const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

    // ── Build the WebGL renderer. WebGL can be unavailable (old GPU, blocked
    // context); fail loud in DEV but don't crash the host page.
    let renderer = null;
    try { renderer = makeRenderer3D(canvas); }
    catch (err) { renderer = null; if (import.meta.env.DEV) console.error('[bricklands] WebGL init failed', err); }
    rendererRef.current = renderer;

    if (import.meta.env.DEV && renderer) {
      window.__bricklands3d = { scene: renderer.scene, camera: renderer.camera, renderer: renderer.renderer };
    }

    // ── Manual fluid sizing (NOT sizeCanvasFluid — it grabs a 2D context,
    // locking the canvas out of WebGL). ResizeObserver + orientationchange.
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

    // ---- Input ----
    const keys = {};
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      keys[e.code] = true;
    };
    const ku = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = false;
      keys[e.code] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // Touch overlay controls — synthesize key state directly.
    const touchKeys = { left: false, right: false, jump: false };

    // ---- Build first level ----
    function newGame(levelIdx, carryover) {
      const lvl = buildLevel(levelIdx);
      const cam = { x: 0, y: 0, targetX: 0, targetY: 0 };
      const st = {
        levelIdx,
        level: lvl,
        cam,
        player: {
          x: lvl.spawn.x, y: lvl.spawn.y,
          vx: 0, vy: 0,
          facing: 1,
          onGround: false,
          coyote: 0,
          buffer: 0,
          jumpHeld: false,
          jumpHeldFrames: 0,
          jumpKeyEdge: false,
          // Spawn-safety: 96 frames @ 60fps ≈ 1.6s. Identical to the
          // post-hurt window, so the existing flash render + the hurt()
          // short-circuit cover both cases.
          invul: SPAWN_INVUL_F,
          dead: false,
          deadT: 0,
        },
        lives: carryover?.lives ?? 3,
        score: carryover?.score ?? 0,
        coins: carryover?.coins ?? 0,
        stars: carryover?.stars ?? 0,
        deaths: carryover?.deaths ?? 0,
        elapsed: carryover?.elapsed ?? 0,
        status: 'playing',
        particles: [],
        cleared: false,
        clearT: 0,
        levelStartT: carryover?.elapsed ?? 0,
        screenFade: 0,
      };
      // Center cam on spawn.
      cam.x = lvl.spawn.x - VIEW_W / 2;
      cam.y = lvl.spawn.y - VIEW_H / 2;
      cam.targetX = cam.x;
      cam.targetY = cam.y;
      return st;
    }
    {
      const adminStart = consumeAdminStartLevel('bricklands');
      const startIdx = adminStart != null ? Math.max(0, Math.min(2, adminStart)) : 0;
      stateRef.current = newGame(startIdx);
      rendererRef.current?.rebuildLevel(stateRef.current);
    }

    function pushHud() {
      const s = stateRef.current; if (!s) return;
      setHud({
        level: s.levelIdx + 1,
        lives: s.lives,
        score: s.score,
        coins: s.coins,
        stars: s.stars,
        time: Math.round(s.elapsed),
        deaths: s.deaths,
        status: s.status,
      });
    }
    pushHud();

    // ---- Particles ----
    function emit(s, x, y, kind, count = 6) {
      for (let i = 0; i < count; i++) {
        s.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 1.6 - 0.4,
          life: 24 + Math.random() * 12,
          kind,
        });
      }
    }

    // ---- Player damage ----
    function hurt(s) {
      const p = s.player;
      if (p.invul > 0 || p.dead) return;
      s.lives -= 1;
      sfx.lose && sfx.lose();
      if (s.lives <= 0) {
        p.dead = true; p.deadT = 0;
        s.deaths += 1;
        return;
      }
      p.invul = HURT_INVUL_F;
      p.vy = -3.5;
    }

    function killAndRespawn(s) {
      const p = s.player;
      sfx.lose && sfx.lose();
      s.lives -= 1;
      s.deaths += 1;
      if (s.lives <= 0) {
        p.dead = true; p.deadT = 0;
        return;
      }
      p.x = s.level.spawn.x; p.y = s.level.spawn.y;
      p.vx = 0; p.vy = 0;
      p.invul = HURT_INVUL_F;
    }

    // ---- Update step (60fps target, dt-corrected for slower frames) ----
    function step(dtScale) {
      const s = stateRef.current; if (!s) return;
      if (s.status !== 'playing') return;
      const p = s.player;
      const lvl = s.level;

      s.elapsed += dtScale / 60;

      if (p.dead) {
        p.deadT += dtScale / 60;
        s.screenFade = Math.min(1, p.deadT / 0.4);
        if (p.deadT > 1.2) {
          // Game over — submit partial run if any.
          if (!submittedRef.current && s.score > 0) {
            submittedRef.current = true;
            submitScore('bricklands', s.score, {
              time: Math.round(s.elapsed),
              coins: s.coins,
              deaths: s.deaths,
            });
          }
          s.status = 'gameover';
        }
        return;
      }

      if (s.cleared) {
        s.clearT += dtScale / 60;
        s.screenFade = Math.min(1, s.clearT / 0.6);
        if (s.clearT > 1.0) {
          // Advance level or finish run.
          if (s.levelIdx + 1 >= LEVELS.length) {
            s.status = 'won';
            // Final score: existing + level-clear bonus + time bonus.
            const timeBonus = Math.max(0, 5000 - Math.round(s.elapsed * 10));
            s.score += 1000 + timeBonus;
            if (!submittedRef.current) {
              submittedRef.current = true;
              submitScore('bricklands', s.score, {
                time: Math.round(s.elapsed),
                coins: s.coins,
                deaths: s.deaths,
              });
            }
          } else {
            stateRef.current = newGame(s.levelIdx + 1, {
              lives: s.lives,
              score: s.score + 1000,
              coins: s.coins,
              stars: s.stars,
              deaths: s.deaths,
              elapsed: s.elapsed,
            });
            rendererRef.current?.rebuildLevel(stateRef.current);
          }
        }
        return;
      }

      // ---- Input read ----
      const left  = !!(keys['a'] || keys['arrowleft']  || keys['keya'] || touchKeys.left);
      const right = !!(keys['d'] || keys['arrowright'] || keys['keyd'] || touchKeys.right);
      const jumpDown = !!(keys[' '] || keys['space'] || keys['w'] || keys['arrowup'] || keys['keyw'] || touchKeys.jump);

      // Edge detection so jump only triggers once per press, but holding
      // still counts for variable-height window.
      if (jumpDown && !p.jumpHeld) {
        p.buffer = BUFFER_F;
        p.jumpKeyEdge = true;
      } else {
        p.jumpKeyEdge = false;
      }
      p.jumpHeld = jumpDown;

      // ---- Horizontal accel ----
      if (left)       { p.vx -= RUN_ACCEL * dtScale; p.facing = -1; }
      else if (right) { p.vx += RUN_ACCEL * dtScale; p.facing = 1; }
      else if (p.onGround) {
        const drop = RUN_FRICT * dtScale;
        if (Math.abs(p.vx) <= drop) p.vx = 0;
        else p.vx -= Math.sign(p.vx) * drop;
      }
      p.vx = Math.max(-RUN_MAX, Math.min(RUN_MAX, p.vx));

      // ---- Gravity (variable jump height) ----
      const inJumpHold = p.jumpHeld && p.jumpHeldFrames < JUMP_HOLD_F && p.vy < 0;
      const grav = GRAVITY * (inJumpHold ? HOLD_GRAV_K : 1);
      p.vy += grav * dtScale;
      if (p.vy > FALL_MAX) p.vy = FALL_MAX;
      if (!p.onGround) p.jumpHeldFrames += dtScale;

      // ---- Wall slide (basic): pressing into a wall mid-air clamps fall ----
      if (!p.onGround && p.vy > WALL_SLIDE) {
        const sideC = Math.floor(((p.facing > 0 ? p.x + P_W + 1 : p.x - 1)) / TILE);
        const rowMid = Math.floor((p.y + P_H / 2) / TILE);
        const tt = tileAt(lvl, sideC, rowMid);
        if (SOLID.has(tt) || MYSTERY.has(tt)) {
          if ((p.facing > 0 && right) || (p.facing < 0 && left)) {
            p.vy = WALL_SLIDE;
          }
        }
      }

      // ---- Buffered jump consumption ----
      if (p.buffer > 0) {
        if (p.onGround || p.coyote > 0) {
          p.vy = JUMP_V;
          p.onGround = false;
          p.coyote = 0;
          p.buffer = 0;
          p.jumpHeldFrames = 0;
          sfx.click && sfx.click();
        }
      }
      p.buffer -= dtScale;
      p.coyote -= dtScale;

      // ---- Move horizontally + collide solids ----
      const prevBottom = p.y + P_H;
      p.x += p.vx * dtScale;
      let hit = probeSolid(lvl, p.x, p.y, P_W, P_H);
      if (hit) {
        if (p.vx > 0) p.x = hit.c * TILE - P_W - 0.001;
        else if (p.vx < 0) p.x = (hit.c + 1) * TILE + 0.001;
        p.vx = 0;
      }

      // ---- Move vertically + collide solids + oneways ----
      const wasGround = p.onGround;
      p.y += p.vy * dtScale;
      hit = probeSolid(lvl, p.x, p.y, P_W, P_H);
      p.onGround = false;
      if (hit) {
        if (p.vy > 0) {
          p.y = hit.r * TILE - P_H - 0.001;
          p.onGround = true;
          if (p.vy > 2) emit(s, p.x + P_W / 2, p.y + P_H, 'dust', 3);
        } else if (p.vy < 0) {
          p.y = (hit.r + 1) * TILE + 0.001;
          // Mystery block bump from below.
          if (MYSTERY.has(hit.ch)) {
            setTile(lvl, hit.c, hit.r, '-');
            // Spawn a coin above the block.
            lvl.coins.push({
              x: hit.c * TILE + 4, y: (hit.r - 1) * TILE + 4,
              w: 8, h: 8, taken: false, t: 0, fly: 18,
            });
            sfx.coin && sfx.coin();
            emit(s, hit.c * TILE + 8, hit.r * TILE, 'spark', 5);
          }
        }
        p.vy = 0;
      }
      // Oneway platforms (only when descending, and prev bottom above top).
      if (!hit && p.vy >= 0) {
        const o = probeOneway(lvl, p.x, p.y, P_W, P_H, prevBottom);
        if (o) {
          p.y = o.top - P_H - 0.001;
          p.vy = 0;
          p.onGround = true;
        }
      }
      if (wasGround && !p.onGround) p.coyote = COYOTE_F;
      if (p.onGround) p.jumpHeldFrames = JUMP_HOLD_F + 1; // disable hold in air after landing

      // ---- Moving platforms (carry the player when standing on top) ----
      for (const pf of lvl.platforms) {
        pf.t += dtScale;
        const phase = (pf.t / pf.period) * Math.PI * 2;
        const off = Math.sin(phase) * pf.range;
        const px = pf.axis === 'x' ? pf.baseX + off : pf.baseX;
        const py = pf.axis === 'y' ? pf.baseY + off : pf.baseY;
        const dx = px - pf.x;
        const dy = py - pf.y;
        pf.x = px; pf.y = py;
        // Player-on-platform AABB test (player feet on platform top).
        const onTop = (
          p.x + P_W > pf.x && p.x < pf.x + pf.w &&
          Math.abs((p.y + P_H) - pf.y) < 4 && p.vy >= 0
        );
        if (onTop) {
          p.x += dx;
          p.y = pf.y - P_H;
          p.onGround = true;
        } else {
          // Solid-side collision.
          const playerBox = { x: p.x, y: p.y, w: P_W, h: P_H };
          if (aabb(playerBox, pf)) {
            // Resolve from above only — keep behaviour simple.
            if (p.vy > 0 && (p.y + P_H - p.vy) <= pf.y + 1) {
              p.y = pf.y - P_H;
              p.vy = 0;
              p.onGround = true;
            }
          }
        }
      }

      // ---- Spike damage ----
      if (probeSpike(lvl, p.x, p.y, P_W, P_H)) {
        hurt(s);
      }

      // ---- Off-screen death ----
      if (p.y > lvl.rows * TILE + 40) {
        p.y = -100; // off-screen marker
        killAndRespawn(s);
      }

      // ---- Goal flag ----
      if (Math.hypot((p.x + P_W / 2) - lvl.goal.x, (p.y + P_H / 2) - lvl.goal.y) < 18) {
        s.cleared = true;
        s.clearT = 0;
        sfx.win && sfx.win();
        s.score += 200; // touch-flag bonus
      }

      // ---- Coins ----
      const playerBox = { x: p.x, y: p.y, w: P_W, h: P_H };
      for (const coin of lvl.coins) {
        if (coin.taken) continue;
        coin.t += dtScale * 0.12;
        if (coin.fly !== undefined) {
          coin.y -= 0.6 * dtScale;
          coin.fly -= dtScale;
          if (coin.fly <= 0) coin.fly = undefined;
        }
        if (aabb(playerBox, coin)) {
          coin.taken = true;
          s.coins += 1;
          s.score += 50;
          sfx.coin && sfx.coin();
          emit(s, coin.x + 4, coin.y + 4, 'spark', 4);
          if (s.coins >= 100) { s.coins -= 100; s.lives += 1; }
        }
      }
      // ---- Stars ----
      for (const star of lvl.stars) {
        if (star.taken) continue;
        star.t += dtScale * 0.08;
        if (aabb(playerBox, star)) {
          star.taken = true;
          s.score += 500;
          sfx.star && sfx.star();
          emit(s, star.x + 6, star.y + 6, 'star', 12);
        }
      }

      // ---- Enemies ----
      for (const e of lvl.enemies) {
        if (!e.alive) continue;

        if (e.kind === 'crawler') {
          // Apply gravity if airborne.
          e.vy += GRAVITY * dtScale;
          if (e.vy > FALL_MAX) e.vy = FALL_MAX;
          // Horizontal move + collide.
          e.x += e.vx * dtScale;
          let h = probeSolid(lvl, e.x, e.y, e.w, e.h);
          if (h) {
            if (e.vx > 0) e.x = h.c * TILE - e.w - 0.001;
            else if (e.vx < 0) e.x = (h.c + 1) * TILE + 0.001;
            e.vx = -e.vx;
          }
          // Vertical move + collide.
          e.y += e.vy * dtScale;
          h = probeSolid(lvl, e.x, e.y, e.w, e.h);
          let onG = false;
          if (h) {
            if (e.vy > 0) { e.y = h.r * TILE - e.h - 0.001; e.vy = 0; onG = true; }
            else if (e.vy < 0) { e.y = (h.r + 1) * TILE + 0.001; e.vy = 0; }
          }
          // Edge turn — if no ground ahead, reverse.
          if (onG) {
            const aheadX = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
            const groundC = Math.floor(aheadX / TILE);
            const groundR = Math.floor((e.y + e.h + 1) / TILE);
            const tt = tileAt(lvl, groundC, groundR);
            if (!SOLID.has(tt) && !MYSTERY.has(tt)) e.vx = -e.vx;
          }
        } else if (e.kind === 'hopper') {
          // Sit-and-jump on a clock.
          e.vy += GRAVITY * dtScale;
          if (e.vy > FALL_MAX) e.vy = FALL_MAX;
          e.hopT += dtScale;
          if (e.hopT > 60 && e.hopT < 72) {
            e.telegraph = 1; // squash window
          } else {
            e.telegraph = 0;
          }
          if (e.hopT > 72) {
            // Hop toward player.
            e.vy = -4.4;
            e.vx = (p.x > e.x) ? 0.8 : -0.8;
            e.hopT = 0;
          }
          e.x += e.vx * dtScale;
          let h = probeSolid(lvl, e.x, e.y, e.w, e.h);
          if (h) {
            if (e.vx > 0) e.x = h.c * TILE - e.w - 0.001;
            else if (e.vx < 0) e.x = (h.c + 1) * TILE + 0.001;
            e.vx = 0;
          }
          e.y += e.vy * dtScale;
          h = probeSolid(lvl, e.x, e.y, e.w, e.h);
          if (h) {
            if (e.vy > 0) { e.y = h.r * TILE - e.h - 0.001; e.vy = 0; e.vx = 0; }
            else if (e.vy < 0) { e.y = (h.r + 1) * TILE + 0.001; e.vy = 0; }
          }
        }

        // Collide with player.
        const ebox = { x: e.x, y: e.y, w: e.w, h: e.h };
        if (aabb(playerBox, ebox)) {
          // Stomp = player descending and feet near enemy top.
          const stomp = p.vy > 0 && (p.y + P_H - p.vy * dtScale) <= e.y + 4;
          if (stomp) {
            if (e.kind === 'crawler') {
              e.alive = false;
              s.score += 100;
              p.vy = STOMP_BOUNCE;
              sfx.stomp && sfx.stomp();
              emit(s, e.x + e.w / 2, e.y + e.h, 'debris', 8);
            } else if (e.kind === 'hopper') {
              e.hp -= 1;
              p.vy = STOMP_BOUNCE;
              sfx.stomp && sfx.stomp();
              emit(s, e.x + e.w / 2, e.y + e.h / 2, 'debris', 6);
              if (e.hp <= 0) { e.alive = false; s.score += 250; }
            }
          } else {
            hurt(s);
          }
        }
      }

      if (p.invul > 0) p.invul -= dtScale;

      // ---- Camera ----
      const targetX = p.x + P_W / 2 + p.facing * CAMERA_LEAD - VIEW_W / 2;
      const playerCenterY = p.y + P_H / 2;
      const camCenterY = s.cam.y + VIEW_H / 2;
      let targetY = s.cam.y;
      if (playerCenterY < camCenterY - CAM_DEADZONE) {
        targetY = playerCenterY + CAM_DEADZONE - VIEW_H / 2;
      } else if (playerCenterY > camCenterY + CAM_DEADZONE) {
        targetY = playerCenterY - CAM_DEADZONE - VIEW_H / 2;
      }
      const maxX = lvl.cols * TILE - VIEW_W;
      const maxY = lvl.rows * TILE - VIEW_H;
      s.cam.targetX = Math.max(0, Math.min(maxX, targetX));
      s.cam.targetY = Math.max(0, Math.min(maxY, targetY));
      s.cam.x += (s.cam.targetX - s.cam.x) * CAMERA_LERP * dtScale;
      s.cam.y += (s.cam.targetY - s.cam.y) * CAMERA_LERP * dtScale;

      // ---- Particles ----
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const part = s.particles[i];
        part.x += part.vx * dtScale;
        part.y += part.vy * dtScale;
        part.vy += GRAVITY * 0.4 * dtScale;
        part.life -= dtScale;
        if (part.life <= 0) s.particles.splice(i, 1);
      }
    }

    // ---- Main loop with dt-scaled fixed update ----
    let raf = 0;
    const clock = { last: performance.now(), acc: 0 };
    const FIXED = 1 / 60;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - clock.last) / 1000);
      clock.last = now;
      clock.acc += dt;
      let steps = 0;
      while (clock.acc > FIXED && steps < 5) {
        step(1.0); // 1 frame at 60fps
        clock.acc -= FIXED;
        steps += 1;
      }
      rendererRef.current?.render(stateRef.current, dt);

      // HUD push at ~10Hz.
      const s = stateRef.current;
      if (s) {
        s._hudT = (s._hudT ?? 0) + dt;
        if (s._hudT > 0.1) { s._hudT = 0; pushHud(); }
      }
    };
    raf = requestAnimationFrame(loop);

    // ---- Touch overlay handlers — set the touchKeys flags. The DOM lives
    //      below in JSX and routes through wrap._setTouch.
    const wrapEl = wrap;
    wrapEl._setTouch = (id, v) => {
      if (id === 'left')  touchKeys.left  = v;
      if (id === 'right') touchKeys.right = v;
      if (id === 'jump')  touchKeys.jump  = v;
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('orientationchange', sizeCanvas);
      try { rendererRef.current?.dispose(); } catch {}
      rendererRef.current = null;
      try { delete wrapEl._setTouch; } catch {}
      if (import.meta.env.DEV && window.__bricklands3d) { try { delete window.__bricklands3d; } catch {} }
    };
  }, []);

  // Restart handler: rebuild state from scratch.
  const restart = () => {
    submittedRef.current = false;
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Re-build level 0 directly and re-mount the 3D scene for it.
    const lvl = buildLevel(0);
    stateRef.current = {
      ...stateRef.current,
      levelIdx: 0,
      level: lvl,
      cam: { x: lvl.spawn.x - VIEW_W / 2, y: lvl.spawn.y - VIEW_H / 2,
             targetX: lvl.spawn.x - VIEW_W / 2, targetY: lvl.spawn.y - VIEW_H / 2 },
      player: {
        x: lvl.spawn.x, y: lvl.spawn.y,
        vx: 0, vy: 0, facing: 1, onGround: false,
        coyote: 0, buffer: 0, jumpHeld: false, jumpHeldFrames: 0, jumpKeyEdge: false,
        // Spawn-safety on restart too (≈1.6s read window).
        invul: SPAWN_INVUL_F, dead: false, deadT: 0,
      },
      lives: 3, score: 0, coins: 0, stars: 0, deaths: 0,
      elapsed: 0, status: 'playing',
      particles: [], cleared: false, clearT: 0, screenFade: 0,
    };
    rendererRef.current?.rebuildLevel(stateRef.current);
    setHud({ level: 1, lives: 3, score: 0, coins: 0, stars: 0, time: 0, deaths: 0, status: 'playing' });
  };

  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

  // Touch handlers route through the wrap element's _setTouch shim
  // (installed by the loop effect).
  const setTouchKey = (id, v) => {
    const w = wrapRef.current;
    if (w && w._setTouch) w._setTouch(id, v);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div ref={wrapRef} style={{
        position: 'relative',
        flex: '1 1 0',
        minHeight: 0,
        width: '100%',
        maxWidth: 'none',
        margin: '0 auto',
        background: '#0a1020',
        borderRadius: 12,
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none',
      }}>
        <canvas ref={canvasRef} style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}/>

        {/* HUD — overlayed in CSS px */}
        <div style={{
          position: 'absolute', top: 8, left: 8, right: 8,
          display: 'flex', justifyContent: 'space-between',
          pointerEvents: 'none',
          color: '#fff', fontFamily: 'ui-monospace, monospace',
          textShadow: '0 1px 2px rgba(0,0,0,0.7)',
          fontSize: 13, lineHeight: 1.2,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>{'♥'.repeat(Math.max(0, hud.lives))}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {String(hud.score).padStart(6, '0')}
            </span>
            <span style={{ color: '#f6c93a' }}>{'◆'} {hud.coins}</span>
            <span style={{ color: '#cfd6e0' }}>L{hud.level}/3</span>
          </div>
          <div style={{ fontVariantNumeric: 'tabular-nums' }}>
            {String(Math.floor(hud.time / 60)).padStart(2, '0')}:
            {String(hud.time % 60).padStart(2, '0')}
          </div>
        </div>

        {/* Status overlays */}
        {hud.status === 'won' && (
          <div style={overlayStyle}>
            <div style={overlayPanel}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Run cleared</div>
              <div style={{ marginTop: 8, color: '#cfd6e0' }}>
                Score {hud.score} &middot; {hud.coins} coins &middot; {hud.deaths} deaths
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={restart}>
                Play again
              </button>
            </div>
          </div>
        )}
        {hud.status === 'gameover' && (
          <div style={overlayStyle}>
            <div style={overlayPanel}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Game over</div>
              <div style={{ marginTop: 8, color: '#cfd6e0' }}>
                Score {hud.score} &middot; reached level {hud.level}
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={restart}>
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Touch controls — only rendered on touch devices */}
        {isTouch && (
          <>
            <div style={{
              position: 'absolute', bottom: 18, left: 18,
              display: 'flex', gap: 10,
            }}>
              <TouchBtn label="←" onDown={() => setTouchKey('left', true)} onUp={() => setTouchKey('left', false)} />
              <TouchBtn label="→" onDown={() => setTouchKey('right', true)} onUp={() => setTouchKey('right', false)} />
            </div>
            <div style={{
              position: 'absolute', bottom: 18, right: 18,
            }}>
              <TouchBtn label="JUMP" big onDown={() => setTouchKey('jump', true)} onUp={() => setTouchKey('jump', false)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'absolute', inset: 0, display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.55)',
  color: '#fff', textAlign: 'center',
  pointerEvents: 'auto',
};
const overlayPanel = {
  background: 'rgba(15,20,40,0.88)', padding: '20px 28px',
  borderRadius: 12, border: '1px solid rgba(255,255,255,0.18)',
  minWidth: 240,
};

function TouchBtn({ label, big, onDown, onUp }) {
  const sz = big ? 72 : 56;
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} onDown?.(); }}
      onPointerUp={(e) => { e.preventDefault(); onUp?.(); }}
      onPointerCancel={(e) => { e.preventDefault(); onUp?.(); }}
      onPointerLeave={(e) => { if (e.buttons === 0) onUp?.(); }}
      style={{
        width: sz, height: sz, borderRadius: 999,
        background: 'rgba(255,255,255,0.16)',
        border: '1px solid rgba(255,255,255,0.35)',
        color: '#fff', fontWeight: 700, fontSize: big ? 16 : 22,
        backdropFilter: 'blur(6px)',
        userSelect: 'none', touchAction: 'none',
      }}
      aria-label={label}
    >
      {label}
    </button>
  );
}
