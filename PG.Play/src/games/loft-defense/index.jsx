// LOFT DEFENSE — path-based tower defense, now in REAL 3D (Three.js).
//
//  • One winding path from the top-left to the bottom-right.
//  • Ten waves of drifting balloons. Enemies scale HP + speed + count.
//  • Three tower archetypes (single-target fast, splash slow, slow-field).
//  • Tap empty ground to open the placement palette. Tap a placed tower to
//    open upgrade/sell. No grid — freeform placement with min-distance
//    constraints + "off the path" check.
//  • Touch-native. All interactions are taps.
//
// 3D CONVERSION NOTE: every gameplay number — path waypoints, enemy
// spawn/hp/speed/reward, tower range/cd/dmg/splash/slow, costs, gold,
// lives, waves, win/lose, and submitScore values — is UNCHANGED from the
// flat 2D version. The physics/AI still runs on the 2D ground plane in
// game pixels; only rendering and camera became 3D. Ground-plane mapping
// (mirrors arena): game x → world x, game y → world z, things stand up in
// +Y. Placement raycasts the pointer onto the y=0 ground plane and
// converts the hit back into game px, so placement lands identically.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { submitScore } from '../../scoreBus.js';
import { consumeAdminStartLevel } from '../../utils/admin.js';
import { sfx } from '../../sound.js';

const W = 800;
const H = 500;
const START_LIVES = 20;
const START_GOLD = 160;
const TOWER_RADIUS = 18;
const ENEMY_R = 12;
const PATH_WIDTH = 34;
const TOWER_MIN_DIST = 44;

// Hand-authored path waypoints — builds a readable S-curve.
const PATH = [
  [-10, 90],  [160, 90], [160, 220], [360, 220], [360, 100],
  [560, 100], [560, 360], [260, 360], [260, 460], [810, 460],
];

const TOWER_TYPES = {
  dart: {
    name: 'Dart', cost: 80,
    range: 120, cd: 0.55, dmg: 8, splash: 0, slow: 0,
    projSpeed: 340, color: '#00fff5', bg: '#00c8c0',
    upgrade: { cost: 120, range: 150, cd: 0.4, dmg: 14 },
  },
  splash: {
    name: 'Splash', cost: 140,
    range: 110, cd: 1.1, dmg: 6, splash: 36, slow: 0,
    projSpeed: 240, color: '#ff8a3a', bg: '#c84d1a',
    upgrade: { cost: 190, range: 130, cd: 0.9, dmg: 12, splash: 48 },
  },
  frost: {
    name: 'Frost', cost: 110,
    range: 130, cd: 1.0, dmg: 2, splash: 0, slow: 0.45, slowFor: 1.6,
    projSpeed: 280, color: '#35d6f5', bg: '#1a87aa',
    upgrade: { cost: 150, range: 150, cd: 0.8, slow: 0.65, slowFor: 2.0 },
  },
};

// Ten waves: { count, type, spacing, hpMult, speedMult }
const WAVES = [
  { count: 10, fast: false, spacing: 0.9, hp: 1.0, speed: 1.0 },
  { count: 14, fast: false, spacing: 0.8, hp: 1.2, speed: 1.0 },
  { count: 12, fast: true,  spacing: 0.6, hp: 1.0, speed: 1.45 },
  { count: 18, fast: false, spacing: 0.7, hp: 1.6, speed: 1.1 },
  { count: 20, fast: true,  spacing: 0.5, hp: 1.2, speed: 1.5 },
  { count: 18, fast: false, spacing: 0.6, hp: 2.2, speed: 1.2 },
  { count: 24, fast: true,  spacing: 0.45, hp: 1.5, speed: 1.6 },
  { count: 24, fast: false, spacing: 0.5, hp: 3.0, speed: 1.3 },
  { count: 28, fast: true,  spacing: 0.4, hp: 2.0, speed: 1.7 },
  { count: 22, fast: false, spacing: 0.45, hp: 5.0, speed: 1.4 }, // boss-ish
];

// ── path geometry helpers (UNCHANGED) ──
function pathAt(dist) {
  // dist in pixels from start; returns {x, y, done}.
  let remaining = dist;
  for (let i = 1; i < PATH.length; i++) {
    const [ax, ay] = PATH[i - 1];
    const [bx, by] = PATH[i];
    const segLen = Math.hypot(bx - ax, by - ay);
    if (remaining <= segLen) {
      const t = remaining / segLen;
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, done: false };
    }
    remaining -= segLen;
  }
  const [ex, ey] = PATH[PATH.length - 1];
  return { x: ex, y: ey, done: true };
}

// Distance from a point to the path (approx — checks every segment).
function distToPath(px, py) {
  let best = Infinity;
  for (let i = 1; i < PATH.length; i++) {
    const [ax, ay] = PATH[i - 1];
    const [bx, by] = PATH[i];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx, qy = ay + t * dy;
    const d = Math.hypot(px - qx, py - qy);
    if (d < best) best = d;
  }
  return best;
}

// ── World scale — game units (px) → world metres for the Three scene.
// The ground-plane math is untouched; this only converts logical px into
// metres at render time. 1 metre ≈ 6 game px keeps the 800×500 field at a
// readable ~133×83 m meadow.
const SCALE = 1 / 6;
const gx = (x) => x * SCALE;                 // game x → world x
const gz = (y) => y * SCALE;                 // game y → world z
const wx = (v) => v * SCALE;                 // length px → world metres

// ── Procedural grass CanvasTexture (no external assets) ──
function makeGrassTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, '#6fbf2a');
  g.addColorStop(1, '#3c7a1f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  // soft mottling so the meadow doesn't read as flat
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * S, y = Math.random() * S;
    const r = 1 + Math.random() * 2.4;
    ctx.fillStyle = Math.random() > 0.5
      ? 'rgba(255,255,255,0.05)'
      : 'rgba(0,0,0,0.06)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  return tex;
}

// ── Tower rig builder — a real 3D model per type with a rotating head ──
// The head group spins around +Y to aim; the barrel points +X at angle 0,
// matching Math.atan2(dy,dx) game space (cos→x, sin→z, head.rotation.y =
// -angle). Returns { group, head, setLevel, mats }.
function makeTowerRig(type, GEO, MAT) {
  const spec = TOWER_TYPES[type];
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(spec.bg), roughness: 0.6, metalness: 0.25 });
  const accent = new THREE.Color(spec.color);
  const accentMat = new THREE.MeshStandardMaterial({
    color: accent, roughness: 0.35, metalness: 0.4,
    emissive: accent.clone().multiplyScalar(0.3),
  });
  const mats = [bodyMat, accentMat];

  // shared stone base + plinth for every tower
  const base = new THREE.Mesh(GEO.towerBase, MAT.stone);
  base.position.y = 0.18; base.castShadow = true; base.receiveShadow = true;
  group.add(base);
  const plinth = new THREE.Mesh(GEO.towerPlinth, bodyMat);
  plinth.position.y = 0.62; plinth.castShadow = true;
  group.add(plinth);

  // rotating head — built per archetype, all aim +X at angle 0
  const head = new THREE.Group();
  head.position.y = 1.05;
  group.add(head);

  if (type === 'dart') {
    // dart shooter: turret dome + slim long barrel
    const dome = new THREE.Mesh(GEO.dartDome, accentMat);
    dome.castShadow = true;
    head.add(dome);
    const barrel = new THREE.Mesh(GEO.dartBarrel, MAT.dark);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.55, 0.05, 0);
    barrel.castShadow = true;
    head.add(barrel);
  } else if (type === 'splash') {
    // mortar/cannon: fat angled tube on a stubby body
    const body = new THREE.Mesh(GEO.splashBody, accentMat);
    body.castShadow = true;
    head.add(body);
    const tube = new THREE.Mesh(GEO.splashTube, MAT.dark);
    // tilt up and point +X
    tube.rotation.z = Math.PI / 2 - 0.5;
    tube.position.set(0.38, 0.28, 0);
    tube.castShadow = true;
    head.add(tube);
  } else {
    // frost: crystalline ice emitter — faceted cone + orbiting shard
    const core = new THREE.Mesh(GEO.frostCore, accentMat);
    core.castShadow = true;
    head.add(core);
    const shard = new THREE.Mesh(GEO.frostShard, MAT.ice);
    shard.position.set(0.5, 0.1, 0);
    shard.castShadow = true;
    head.add(shard);
  }

  // upgrade pip — hidden until level 2
  const pip = new THREE.Mesh(GEO.pip, MAT.pip);
  pip.position.set(0, 1.75, 0);
  pip.visible = false;
  group.add(pip);

  return {
    group, head, mats,
    setLevel(level) { pip.visible = level > 1; },
  };
}

export default function LoftDefenseGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef(null);
  const [hud, setHud] = useState({
    lives: START_LIVES,
    gold: START_GOLD,
    wave: 0,
    status: 'pre',   // 'pre' | 'spawning' | 'wave' | 'won' | 'lost'
    selected: null,  // tower type for placement
    hoverTower: null, // id of placed tower with open menu
  });

  // Admin override is consumed once on initial mount; later resets
  // (game over → retry) start at wave 0 like normal play.
  const adminStartWave = useRef(consumeAdminStartLevel('bloons'));

  const reset = () => {
    const startIdx = (() => {
      const v = adminStartWave.current;
      adminStartWave.current = null;
      if (v == null) return 0;
      return Math.max(0, Math.min(9, v));
    })();
    // Per-wave gold scaling matches the inline reward (`30 + waveIdx * 6`),
    // so jumping in past wave 0 also gets the accumulated gold the player
    // would have earned.
    let gold = START_GOLD;
    for (let i = 0; i < startIdx; i++) gold += 30 + i * 6;
    stateRef.current = {
      towers: [],
      enemies: [],
      bullets: [],
      particles: [],
      spawnQueue: [],
      spawnTimer: 0,
      waveIdx: startIdx,
      waveActive: false,
      pointer: { x: -1, y: -1 },
      hoverTowerId: null,
      selectedType: null,
      gold,
      lives: START_LIVES,
      elapsed: 0,
    };
    setHud({ lives: START_LIVES, gold, wave: startIdx, status: 'pre', selected: null, hoverTower: null });
  };

  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    // ── Three.js renderer / scene / camera ──
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch {
      return; // no WebGL — bail cleanly, HUD still works
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;          // bright, cheerful daylight
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#aee3ff');  // sunny sky
    scene.fog = new THREE.Fog('#cdeeff', wx(W) * 1.2, wx(W) * 2.6);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 1000);
    scene.add(camera);

    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // ── Lighting — bright sunny meadow, NOT dark ──
    // Key light on the CAMERA side (toward +Z) so faces toward the camera
    // are lit, not silhouetted.
    const sun = new THREE.DirectionalLight(0xfff4dc, 1.55);
    sun.position.set(gx(W * 0.55) - wx(W) * 0.25, wx(H) * 1.5, gz(H * 0.5) + wx(H) * 1.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = wx(W) * 3.0;
    const sh = wx(W) * 0.7;
    sun.shadow.camera.left = -sh;
    sun.shadow.camera.right = sh;
    sun.shadow.camera.top = sh;
    sun.shadow.camera.bottom = -sh;
    sun.shadow.bias = -0.0004;
    sun.target.position.set(gx(W / 2), 0, gz(H / 2));
    scene.add(sun);
    scene.add(sun.target);

    const hemi = new THREE.HemisphereLight(0xddf2ff, 0x4a7a28, 1.0);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xbcd8ff, 0.7);
    scene.add(ambient);

    // ── Shared geometry / materials (created once, disposed on unmount) ──
    const grassTex = makeGrassTexture();
    const GEO = {
      // tower shared
      towerBase: new THREE.CylinderGeometry(wx(TOWER_RADIUS + 4), wx(TOWER_RADIUS + 7), 0.36, 18),
      towerPlinth: new THREE.CylinderGeometry(wx(TOWER_RADIUS - 2), wx(TOWER_RADIUS), 0.55, 16),
      // dart
      dartDome: new THREE.SphereGeometry(wx(TOWER_RADIUS - 4), 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      dartBarrel: new THREE.CylinderGeometry(0.12, 0.1, 1.0, 10),
      // splash
      splashBody: new THREE.BoxGeometry(wx(TOWER_RADIUS), 0.5, wx(TOWER_RADIUS)),
      splashTube: new THREE.CylinderGeometry(0.34, 0.3, 0.95, 12),
      // frost
      frostCore: new THREE.ConeGeometry(wx(TOWER_RADIUS - 5), 0.9, 6),
      frostShard: new THREE.OctahedronGeometry(0.28, 0),
      // upgrade pip
      pip: new THREE.OctahedronGeometry(0.18, 0),
      // enemy balloon + string
      balloon: new THREE.SphereGeometry(wx(ENEMY_R), 18, 14),
      knot: new THREE.ConeGeometry(wx(ENEMY_R) * 0.28, wx(ENEMY_R) * 0.5, 8),
      string: new THREE.CylinderGeometry(0.02, 0.02, wx(14), 4),
      // projectile
      bullet: new THREE.SphereGeometry(wx(4), 8, 6),
      // particle
      spark: new THREE.BoxGeometry(0.22, 0.22, 0.22),
      // placement ghost ring
      ghostRing: new THREE.RingGeometry(0.9, 1.0, 36),
    };
    const MAT = {
      stone: new THREE.MeshStandardMaterial({ color: 0x8a9099, roughness: 0.9, metalness: 0.05 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x1a2024, roughness: 0.55, metalness: 0.4 }),
      ice: new THREE.MeshStandardMaterial({ color: 0xd6f4ff, roughness: 0.15, metalness: 0.2, emissive: 0x2a6f8a, emissiveIntensity: 0.4 }),
      pip: new THREE.MeshStandardMaterial({ color: 0xffe14f, roughness: 0.4, metalness: 0.3, emissive: 0x6a5a00, emissiveIntensity: 0.5 }),
      string: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 }),
    };

    // ── Grass field ──
    const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.95, metalness: 0.0 });
    // generous skirt beyond the playfield so the meadow reads to the horizon
    const field = new THREE.Mesh(new THREE.PlaneGeometry(wx(W) * 2.4, wx(H) * 2.6), grassMat);
    field.rotation.x = -Math.PI / 2;
    field.position.set(gx(W / 2), -0.02, gz(H / 2));
    field.receiveShadow = true;
    scene.add(field);

    // ── 3D paved path along the SAME waypoints (sunken into the grass) ──
    // Build a flat ribbon mesh by extruding a quad per segment. The path
    // sits slightly below grass (y ≈ -0.06) so it reads as a sunken track.
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xc6a86a, roughness: 0.95, metalness: 0.02, side: THREE.DoubleSide });
    const pathEdgeMat = new THREE.MeshStandardMaterial({ color: 0x6f5128, roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide });
    const pathGroup = new THREE.Group();
    scene.add(pathGroup);
    {
      const halfW = wx(PATH_WIDTH) / 2;
      const positions = [];
      const edgePositions = [];
      for (let i = 1; i < PATH.length; i++) {
        const ax = gx(PATH[i - 1][0]), az = gz(PATH[i - 1][1]);
        const bx = gx(PATH[i][0]),     bz = gz(PATH[i][1]);
        const dx = bx - ax, dz = bz - az;
        const len = Math.hypot(dx, dz) || 1e-6;
        const nx = -dz / len, nz = dx / len; // unit normal in XZ plane
        // extend segment ends a touch so corners overlap cleanly
        const ex = (dx / len) * halfW, ez = (dz / len) * halfW;
        const a0x = ax - ex, a0z = az - ez;
        const b0x = bx + ex, b0z = bz + ez;
        const pushQuad = (arr, hw, y) => {
          const p1 = [a0x + nx * hw, y, a0z + nz * hw];
          const p2 = [a0x - nx * hw, y, a0z - nz * hw];
          const p3 = [b0x - nx * hw, y, b0z - nz * hw];
          const p4 = [b0x + nx * hw, y, b0z + nz * hw];
          arr.push(...p1, ...p2, ...p3,  ...p1, ...p3, ...p4);
        };
        pushQuad(edgePositions, halfW + wx(4), 0.02); // darker border, just above grass
        pushQuad(positions,     halfW,         0.06); // paved top, sits on the grass
      }
      const mkMesh = (arr, mat) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, mat);
        m.receiveShadow = true;
        return m;
      };
      pathGroup.add(mkMesh(edgePositions, pathEdgeMat));
      pathGroup.add(mkMesh(positions, pathMat));
    }

    // ── Enemy (balloon) pool ──
    // Max simultaneous enemies is bounded by the largest wave count (28),
    // but with spacing only a handful are ever live; pool generously at 48.
    const ENEMY_POOL = 48;
    const enemyMatNormal = new THREE.MeshStandardMaterial({ color: 0x35f0c9, roughness: 0.25, metalness: 0.05, emissive: 0x0a3a2e, emissiveIntensity: 0.25 });
    const enemyMatFast = new THREE.MeshStandardMaterial({ color: 0xff4d6d, roughness: 0.25, metalness: 0.05, emissive: 0x4a0a1a, emissiveIntensity: 0.25 });
    const slowRingMat = new THREE.MeshBasicMaterial({ color: 0x35d6f5, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const enemyPool = [];
    for (let i = 0; i < ENEMY_POOL; i++) {
      const grp = new THREE.Group();
      const balloon = new THREE.Mesh(GEO.balloon, enemyMatNormal);
      balloon.scale.set(1, 1.18, 1);  // slight egg shape, matches 2D ellipse
      balloon.castShadow = true;
      grp.add(balloon);
      const knot = new THREE.Mesh(GEO.knot, MAT.string);
      knot.position.y = -wx(ENEMY_R) * 1.18;
      knot.rotation.x = Math.PI;
      grp.add(knot);
      const str = new THREE.Mesh(GEO.string, MAT.string);
      str.position.y = -wx(ENEMY_R) * 1.18 - wx(7);
      grp.add(str);
      const slowRing = new THREE.Mesh(GEO.ghostRing, slowRingMat);
      slowRing.rotation.x = -Math.PI / 2;
      slowRing.scale.setScalar(wx(ENEMY_R + 5));
      slowRing.visible = false;
      grp.add(slowRing);
      grp.visible = false;
      scene.add(grp);
      enemyPool.push({ grp, balloon, slowRing });
    }

    // ── Projectile pool ──
    const BULLET_POOL = 64;
    const bulletPool = [];
    for (let i = 0; i < BULLET_POOL; i++) {
      const m = new THREE.Mesh(GEO.bullet, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      m.visible = false;
      scene.add(m);
      bulletPool.push(m);
    }

    // ── Particle / spark pool (hit + pop + placement + wave-clear) ──
    const SPARK_POOL = 96;
    const sparks = [];
    for (let i = 0; i < SPARK_POOL; i++) {
      const m = new THREE.Mesh(GEO.spark, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }));
      m.visible = false;
      scene.add(m);
      sparks.push({ mesh: m, life: 0, max: 1, vx: 0, vy: 0, vz: 0 });
    }
    // worldX/Y/Z spawn. count particles, color, spread of velocity.
    const spawnBurst = (worldX, worldY, worldZ, color, count, spread) => {
      let made = 0;
      for (let i = 0; i < sparks.length && made < count; i++) {
        const s = sparks[i];
        if (s.life > 0) continue;
        s.mesh.position.set(worldX, worldY, worldZ);
        s.mesh.material.color.set(color);
        s.mesh.material.opacity = 1;
        s.mesh.visible = true;
        const a = Math.random() * Math.PI * 2;
        s.vx = Math.cos(a) * spread * (0.5 + Math.random());
        s.vz = Math.sin(a) * spread * (0.5 + Math.random());
        s.vy = 0.3 + Math.random() * spread;
        s.max = 18 + Math.random() * 14;
        s.life = s.max;
        made++;
      }
    };

    // ── Muzzle-flash point light (pooled, brief) ──
    const muzzleLight = new THREE.PointLight(0xfff0c0, 0, wx(120));
    scene.add(muzzleLight);
    let muzzleTtl = 0;

    // ── Tower rigs are created on demand, keyed by tower id ──
    const towerRigs = new Map(); // id → rig

    // ── Placement ghost (a translucent disc + range ring on the ground) ──
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0x00fff5, transparent: true, opacity: 0.5 });
    const ghost = new THREE.Mesh(new THREE.CylinderGeometry(wx(TOWER_RADIUS), wx(TOWER_RADIUS), 0.3, 18), ghostMat);
    ghost.visible = false;
    scene.add(ghost);
    const ghostRangeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const ghostRange = new THREE.Mesh(GEO.ghostRing, ghostRangeMat);
    ghostRange.rotation.x = -Math.PI / 2;
    ghostRange.position.y = 0.02;
    ghostRange.visible = false;
    scene.add(ghostRange);

    // ── Range ring for a selected (menu-open) tower ──
    const selRangeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const selRange = new THREE.Mesh(GEO.ghostRing, selRangeMat);
    selRange.rotation.x = -Math.PI / 2;
    selRange.position.y = 0.03;
    selRange.visible = false;
    scene.add(selRange);

    // ── Camera framing: angled 3/4 top-down over the WHOLE field, fixed ──
    const camTargetX = gx(W / 2), camTargetZ = gz(H / 2);
    let camOffX = 0, camOffY = 0, camOffZ = 0;
    const frameCamera = () => {
      const span = Math.max(wx(W), wx(H));
      const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
      const hHalf = Math.atan(Math.tan(vHalf) * Math.max(0.6, camera.aspect));
      const dist = Math.max(28, (span * 0.62) / Math.tan(Math.min(vHalf, hHalf)));
      camOffX = 0;
      camOffY = dist * 0.95;
      camOffZ = dist * 0.5; // pulled toward +Z (camera side, same as sun)
    };

    const resize = () => {
      const cssW = Math.max(1, wrap.clientWidth);
      const cssH = Math.max(1, wrap.clientHeight);
      renderer.setSize(cssW, cssH, false);
      camera.aspect = cssW / cssH;
      camera.updateProjectionMatrix();
      frameCamera();
      camera.position.set(camTargetX + camOffX, camOffY, camTargetZ + camOffZ);
      camera.lookAt(camTargetX, 0, camTargetZ);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const onOrient = () => resize();
    window.addEventListener('orientationchange', onOrient);

    // DEV scene handle for the screenshot / debug harness.
    if (import.meta.env.DEV) window.__bloons3d = { scene, camera, renderer };

    // ── Pointer → ground-plane (game coords) raycast ──
    // Aim/placement math stays in game space. Raycast the pointer onto the
    // y=0 ground plane, convert the world hit back to game x/y so the
    // placement rules (distToPath, min-dist, bounds, cost) are unchanged.
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitV = new THREE.Vector3();
    const pointerToGame = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(groundPlane, hitV)) return null;
      return { x: hitV.x / SCALE, y: hitV.z / SCALE };
    };

    // ── Tap handling (IDENTICAL gameplay semantics to the 2D version) ──
    const onTap = (x, y) => {
      const s = stateRef.current; if (!s) return;
      if (hud.status === 'won' || hud.status === 'lost') return;

      // If a tower is tapped, open its menu.
      for (const t of s.towers) {
        if (Math.hypot(x - t.x, y - t.y) <= TOWER_RADIUS + 2) {
          s.hoverTowerId = s.hoverTowerId === t.id ? null : t.id;
          s.selectedType = null;
          setHud((h) => ({ ...h, hoverTower: s.hoverTowerId, selected: null }));
          return;
        }
      }

      // If a type is selected, try to place.
      if (s.selectedType) {
        if (distToPath(x, y) < PATH_WIDTH / 2 + 6) return; // on the path
        for (const t of s.towers) if (Math.hypot(x - t.x, y - t.y) < TOWER_MIN_DIST) return; // too close
        if (x < 20 || y < 20 || x > W - 20 || y > H - 20) return; // off field
        const spec = TOWER_TYPES[s.selectedType];
        if (s.gold < spec.cost) return;
        s.gold -= spec.cost;
        const id = Math.random().toString(36).slice(2, 9);
        s.towers.push({
          id, x, y, type: s.selectedType,
          level: 1,
          cd: 0,
          angle: 0,
        });
        sfx.click();
        // juice: placement poof
        spawnBurst(gx(x), 0.4, gz(y), spec.color, 12, 1.0);
        s.selectedType = null;
        setHud((h) => ({ ...h, gold: s.gold, selected: null }));
        return;
      }

      // Empty tap elsewhere clears selection/menu.
      if (s.hoverTowerId || s.selectedType) {
        s.hoverTowerId = null; s.selectedType = null;
        setHud((h) => ({ ...h, hoverTower: null, selected: null }));
      }
    };

    const onMouseDown = (e) => { const p = pointerToGame(e.clientX, e.clientY); if (p) onTap(p.x, p.y); };
    const onMouseMove = (e) => {
      const s = stateRef.current; if (!s) return;
      const p = pointerToGame(e.clientX, e.clientY);
      if (p) { s.pointer.x = p.x; s.pointer.y = p.y; }
    };
    const onTouchStart = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      const p = pointerToGame(e.touches[0].clientX, e.touches[0].clientY);
      const s = stateRef.current; if (s && p) { s.pointer.x = p.x; s.pointer.y = p.y; }
      if (p) onTap(p.x, p.y);
    };
    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      const p = pointerToGame(e.touches[0].clientX, e.touches[0].clientY);
      const s = stateRef.current; if (s && p) { s.pointer.x = p.x; s.pointer.y = p.y; }
    };
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });

    // ── Spawn / wave / bullet / hit / fire logic (ALL UNCHANGED) ──
    const spawnFromQueue = (s, dt) => {
      if (s.spawnQueue.length === 0) return;
      s.spawnTimer -= dt;
      if (s.spawnTimer > 0) return;
      const next = s.spawnQueue.shift();
      const baseHp = 10;
      s.enemies.push({
        x: PATH[0][0], y: PATH[0][1],
        dist: 0,
        speed: 60 * next.speed,
        hp: baseHp * next.hp,
        maxHp: baseHp * next.hp,
        reward: Math.max(2, Math.round(2 * next.hp)),
        slowT: 0,
        slowMult: 1,
        fast: next.fast,
        bob: Math.random() * Math.PI * 2,
      });
      s.spawnTimer = next.spacing;
    };

    const stepBullet = (s, b, dt) => {
      if (!b.target || b.target.hp <= 0) {
        // look for a new target in the path direction
        const rng = b.range || 200;
        let best = null, bestD = rng;
        for (const e of s.enemies) {
          const d = Math.hypot(e.x - b.x, e.y - b.y);
          if (d < bestD) { best = e; bestD = d; }
        }
        b.target = best;
      }
      if (!b.target) { b.life -= dt; return; }
      const dx = b.target.x - b.x;
      const dy = b.target.y - b.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const step = b.speed * dt;
      if (d <= step) {
        // hit
        applyHit(s, b, b.target);
        b.hit = true;
        return;
      }
      b.x += (dx / d) * step;
      b.y += (dy / d) * step;
      b.life -= dt;
    };

    const applyHit = (s, b, enemy) => {
      const dmg = b.dmg;
      const hit = (e) => {
        e.hp -= dmg;
        if (b.slow) { e.slowT = b.slowFor; e.slowMult = 1 - b.slow; }
      };
      if (b.splash > 0) {
        for (const e of s.enemies) {
          if (Math.hypot(e.x - enemy.x, e.y - enemy.y) <= b.splash) hit(e);
        }
      } else {
        hit(enemy);
      }
      // Impact sparkle (3D burst)
      spawnBurst(gx(enemy.x), wx(ENEMY_R) + 0.4, gz(enemy.y), b.color, 6, b.splash > 0 ? 1.0 : 0.6);
    };

    const fireTower = (s, t) => {
      const spec = TOWER_TYPES[t.type];
      const range = t.level > 1 ? spec.upgrade.range : spec.range;
      const cd    = t.level > 1 ? spec.upgrade.cd    : spec.cd;
      const dmg   = t.level > 1 ? spec.upgrade.dmg ?? spec.dmg : spec.dmg;
      const slow  = (t.level > 1 ? spec.upgrade.slow ?? spec.slow : spec.slow) || 0;
      const slowFor = (t.level > 1 ? spec.upgrade.slowFor ?? spec.slowFor : spec.slowFor) || 0;
      const splash = (t.level > 1 ? spec.upgrade.splash ?? spec.splash : spec.splash) || 0;

      // Target: furthest-along enemy in range.
      let target = null, bestDist = -1;
      for (const e of s.enemies) {
        const d = Math.hypot(e.x - t.x, e.y - t.y);
        if (d > range) continue;
        if (e.dist > bestDist) { bestDist = e.dist; target = e; }
      }
      if (!target) return;
      // aim toward target
      t.angle = Math.atan2(target.y - t.y, target.x - t.x);
      t.cd = cd;
      const bx = t.x + Math.cos(t.angle) * (TOWER_RADIUS + 6);
      const by = t.y + Math.sin(t.angle) * (TOWER_RADIUS + 6);
      s.bullets.push({
        x: bx, y: by,
        target, dmg, slow, slowFor, splash,
        color: spec.color,
        speed: spec.projSpeed, range: range + 30,
        life: 2.0,
        hit: false,
      });
      // juice: muzzle flash at the tower's barrel tip
      muzzleLight.position.set(gx(bx), 1.1, gz(by));
      muzzleLight.color.set(spec.color);
      muzzleLight.intensity = 5;
      muzzleTtl = 5;
      spawnBurst(gx(bx), 1.1, gz(by), spec.color, 3, 0.4);
    };

    // ── 3D render (reads game state, writes mesh transforms) ──
    const tmpColor = new THREE.Color();
    const render = () => {
      const s = stateRef.current; if (!s) return;
      const now = performance.now() / 1000;

      // Enemies → balloon pool. (Slot index = order in s.enemies.)
      for (let i = 0; i < enemyPool.length; i++) {
        const slot = enemyPool[i];
        const e = s.enemies[i];
        if (e) {
          slot.grp.visible = true;
          const bob = Math.sin(now * 2.4 + (e.bob || 0)) * wx(2);
          slot.grp.position.set(gx(e.x), wx(ENEMY_R) * 1.18 + wx(20) + bob, gz(e.y));
          // slight lean in the travel direction for life
          slot.grp.rotation.z = Math.sin(now * 2 + (e.bob || 0)) * 0.08;
          slot.balloon.material = e.fast ? enemyMatFast : enemyMatNormal;
          slot.slowRing.visible = e.slowT > 0;
        } else {
          slot.grp.visible = false;
        }
      }

      // Towers → rigs (create on demand, aim head, prune removed).
      const liveIds = new Set();
      for (const t of s.towers) {
        liveIds.add(t.id);
        let rig = towerRigs.get(t.id);
        if (!rig) {
          rig = makeTowerRig(t.type, GEO, MAT);
          rig.group.position.set(gx(t.x), 0, gz(t.y));
          scene.add(rig.group);
          towerRigs.set(t.id, rig);
        }
        rig.setLevel(t.level);
        rig.head.rotation.y = -t.angle; // game angle (x/z) → world Y spin
      }
      // prune towers that were sold
      for (const [id, rig] of towerRigs) {
        if (!liveIds.has(id)) {
          scene.remove(rig.group);
          rig.mats.forEach((m) => m.dispose());
          towerRigs.delete(id);
        }
      }

      // Bullets → pool
      for (let i = 0; i < bulletPool.length; i++) {
        const m = bulletPool[i];
        const b = s.bullets[i];
        if (b && !b.hit) {
          m.visible = true;
          m.material.color.set(b.color);
          m.position.set(gx(b.x), 1.0, gz(b.y));
          m.scale.setScalar(b.splash ? 1.4 : 1.0);
        } else {
          m.visible = false;
        }
      }

      // Sparks
      for (const sp of sparks) {
        if (sp.life <= 0) continue;
        sp.life -= 1;
        sp.mesh.position.x += wx(sp.vx);
        sp.mesh.position.y += wx(sp.vy);
        sp.mesh.position.z += wx(sp.vz);
        sp.vy -= 0.06; // gravity
        sp.mesh.material.opacity = Math.max(0, sp.life / sp.max);
        if (sp.life <= 0 || sp.mesh.position.y < 0.03) { sp.mesh.visible = false; sp.life = 0; }
      }

      // Muzzle light decay
      if (muzzleTtl > 0) { muzzleTtl -= 1; muzzleLight.intensity *= 0.6; }
      else muzzleLight.intensity = 0;

      // Placement ghost
      if (s.selectedType && s.pointer.x > 0) {
        const spec = TOWER_TYPES[s.selectedType];
        const onPath = distToPath(s.pointer.x, s.pointer.y) < PATH_WIDTH / 2 + 6;
        const tooClose = s.towers.some((t) => Math.hypot(s.pointer.x - t.x, s.pointer.y - t.y) < TOWER_MIN_DIST);
        const offField = s.pointer.x < 20 || s.pointer.y < 20 || s.pointer.x > W - 20 || s.pointer.y > H - 20;
        const ok = !onPath && !tooClose && !offField && s.gold >= spec.cost;
        ghost.visible = true;
        ghost.position.set(gx(s.pointer.x), 0.2, gz(s.pointer.y));
        ghostMat.color.set(ok ? spec.color : '#ff4d6d');
        ghostRange.visible = true;
        ghostRange.position.set(gx(s.pointer.x), 0.02, gz(s.pointer.y));
        ghostRange.scale.setScalar(wx(spec.range));
        ghostRangeMat.color.set(ok ? '#ffffff' : '#ff4d6d');
      } else {
        ghost.visible = false;
        ghostRange.visible = false;
      }

      // Range ring on the menu-open tower
      if (s.hoverTowerId) {
        const t = s.towers.find((x) => x.id === s.hoverTowerId);
        if (t) {
          const spec = TOWER_TYPES[t.type];
          const range = t.level > 1 ? spec.upgrade.range : spec.range;
          selRange.visible = true;
          selRange.position.set(gx(t.x), 0.03, gz(t.y));
          selRange.scale.setScalar(wx(range));
          selRangeMat.color.copy(tmpColor.set(spec.color));
        } else selRange.visible = false;
      } else selRange.visible = false;

      renderer.render(scene, camera);
    };

    // ── Main loop (GAME LOGIC UNCHANGED from the 2D original) ──
    const clock = { last: performance.now() };
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s) return;

      if (hud.status !== 'won' && hud.status !== 'lost') {
        // Spawn enemies if wave is active
        if (s.waveActive) spawnFromQueue(s, dt);

        // Move enemies along path
        for (const e of s.enemies) {
          const mult = e.slowT > 0 ? e.slowMult : 1;
          e.dist += e.speed * mult * dt;
          const p = pathAt(e.dist);
          e.x = p.x; e.y = p.y;
          if (p.done) {
            s.lives -= 1;
            setHud((h) => ({ ...h, lives: Math.max(0, s.lives) }));
            e.hp = -1;
            e.leaked = true;
            if (s.lives <= 0) {
              setHud((h) => ({ ...h, status: 'lost' }));
              if (!s._submitted) {
                s._submitted = true;
                sfx.lose();
                submitScore('bloons', s.waveIdx * 100, { wave: s.waveIdx + 1, lives: 0 });
              }
            }
          }
          if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowMult = 1; }
        }
        // rewards + cleanup
        for (const e of s.enemies) {
          if (e.hp <= 0 && e.reward > 0) {
            if (!e.leaked) {
              sfx.shot();
              // juice: pop burst on enemy death
              spawnBurst(gx(e.x), wx(ENEMY_R) + wx(20), gz(e.y), e.fast ? '#ff4d6d' : '#35f0c9', 14, 1.3);
            }
            s.gold += e.reward;
            e.reward = 0;
            setHud((h) => ({ ...h, gold: s.gold }));
          }
        }
        s.enemies = s.enemies.filter((e) => e.hp > 0);

        // Towers fire
        for (const t of s.towers) {
          t.cd -= dt;
          if (t.cd <= 0) fireTower(s, t);
        }
        // Bullets
        s.bullets.forEach((b) => stepBullet(s, b, dt));
        s.bullets = s.bullets.filter((b) => b.life > 0 && !b.hit);

        // Wave transition
        if (s.waveActive && s.spawnQueue.length === 0 && s.enemies.length === 0) {
          s.waveActive = false;
          s.waveIdx += 1;
          if (s.waveIdx >= WAVES.length) {
            setHud((h) => ({ ...h, status: 'won' }));
            if (!s._submitted) {
              s._submitted = true;
              submitScore('bloons', 1000 + s.lives * 50, { wave: WAVES.length, lives: s.lives });
            }
          } else {
            // bonus gold between waves
            sfx.confirm();
            // juice: wave-clear sparkle over the field centre
            spawnBurst(gx(W / 2), wx(40), gz(H / 2), '#ffe14f', 24, 1.6);
            s.gold += 30 + s.waveIdx * 6;
            setHud((h) => ({ ...h, gold: s.gold, status: 'pre' }));
          }
        }
      }

      render();
    };
    raf = requestAnimationFrame(loop);

    // ── Dispose: RAF, listeners, RO, and every Three resource ──
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('orientationchange', onOrient);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);

      // shared geometry
      for (const g of Object.values(GEO)) g.dispose();
      // shared materials
      for (const m of Object.values(MAT)) m.dispose();
      grassTex.dispose();
      grassMat.dispose();
      field.geometry.dispose();
      // path
      pathMat.dispose();
      pathEdgeMat.dispose();
      pathGroup.children.forEach((m) => m.geometry.dispose());
      // enemies (shared geo; per-type materials below)
      enemyMatNormal.dispose();
      enemyMatFast.dispose();
      slowRingMat.dispose();
      // bullets (per-instance materials)
      bulletPool.forEach((m) => m.material.dispose());
      // sparks (per-instance materials)
      sparks.forEach((sp) => sp.mesh.material.dispose());
      // tower rigs still on screen
      for (const [, rig] of towerRigs) rig.mats.forEach((m) => m.dispose());
      towerRigs.clear();
      // ghosts + rings
      ghost.geometry.dispose();
      ghostMat.dispose();
      ghostRangeMat.dispose();
      selRangeMat.dispose();

      renderer.dispose();
      if (import.meta.env.DEV && window.__bloons3d?.renderer === renderer) {
        delete window.__bloons3d;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hud.status]);

  // ── Tower shop / wave controls (DOM UI, unchanged behaviour) ──
  const startWaveUI = () => {
    const s = stateRef.current; if (!s) return;
    if (hud.status === 'pre' && s.waveIdx < WAVES.length) {
      const w = WAVES[s.waveIdx];
      s.spawnQueue = Array.from({ length: w.count }).map(() => ({
        fast: w.fast, speed: w.speed, hp: w.hp,
        spacing: w.spacing * (0.85 + Math.random() * 0.3),
      }));
      s.spawnTimer = 0;
      s.waveActive = true;
      setHud((h) => ({ ...h, wave: s.waveIdx + 1, status: 'spawning' }));
    }
  };

  const selectType = (type) => {
    const s = stateRef.current; if (!s) return;
    if (hud.status === 'won' || hud.status === 'lost') return;
    s.selectedType = s.selectedType === type ? null : type;
    s.hoverTowerId = null;
    setHud((h) => ({ ...h, selected: s.selectedType, hoverTower: null }));
  };

  const upgradeSelected = () => {
    const s = stateRef.current; if (!s) return;
    const t = s.towers.find((x) => x.id === s.hoverTowerId);
    if (!t || t.level >= 2) return;
    const cost = TOWER_TYPES[t.type].upgrade.cost;
    if (s.gold < cost) return;
    s.gold -= cost;
    t.level = 2;
    setHud((h) => ({ ...h, gold: s.gold }));
  };
  const sellSelected = () => {
    const s = stateRef.current; if (!s) return;
    const idx = s.towers.findIndex((x) => x.id === s.hoverTowerId);
    if (idx < 0) return;
    const t = s.towers[idx];
    const refund = Math.round(TOWER_TYPES[t.type].cost * 0.6 + (t.level > 1 ? TOWER_TYPES[t.type].upgrade.cost * 0.5 : 0));
    s.gold += refund;
    s.towers.splice(idx, 1);
    s.hoverTowerId = null;
    setHud((h) => ({ ...h, gold: s.gold, hoverTower: null }));
  };

  const selectedTower = stateRef.current?.towers.find((t) => t.id === hud.hoverTower) || null;

  const towerBtn = (type) => {
    const spec = TOWER_TYPES[type];
    const disabled = hud.gold < spec.cost || hud.status === 'won' || hud.status === 'lost';
    return (
      <button
        key={type}
        className={'loft-btn' + (hud.selected === type ? ' is-active' : '') + (disabled ? ' is-disabled' : '')}
        onClick={() => selectType(type)}
        aria-label={`${spec.name} tower`}>
        <div className="loft-btn-name" style={{color: spec.color}}>{spec.name}</div>
        <div className="loft-btn-cost">{spec.cost}g</div>
      </button>
    );
  };

  return (
    <div className="loft">
      <div className="loft-bar">
        <span>Lives <b style={{color: hud.lives < 5 ? '#ff4d6d' : 'var(--text)'}}>{hud.lives}</b></span>
        <span>Gold <b style={{color:'var(--accent)'}}>{hud.gold}</b></span>
        <span>Wave <b>{hud.wave}/{WAVES.length}</b></span>
        <span style={{marginLeft:'auto'}}>
          {hud.status === 'pre' && <button className="btn btn-primary btn-sm" onClick={startWaveUI}>Start wave {Math.min(WAVES.length, (stateRef.current?.waveIdx ?? 0) + 1)}</button>}
          {(hud.status === 'won' || hud.status === 'lost') && <button className="btn btn-primary btn-sm" onClick={reset}>Play again</button>}
        </span>
      </div>
      <div ref={wrapRef} className="loft-stage">
        <canvas ref={canvasRef} className="loft-canvas"/>
      </div>
      <div className="loft-towers">
        {towerBtn('dart')}
        {towerBtn('splash')}
        {towerBtn('frost')}
        {selectedTower && (
          <div className="loft-tower-menu">
            <div className="loft-tower-name" style={{color: TOWER_TYPES[selectedTower.type].color}}>
              {TOWER_TYPES[selectedTower.type].name} · L{selectedTower.level}
            </div>
            <div className="loft-tower-actions">
              {selectedTower.level < 2 && (
                <button className="btn btn-ghost btn-sm" onClick={upgradeSelected}
                  disabled={hud.gold < TOWER_TYPES[selectedTower.type].upgrade.cost}>
                  Upgrade · {TOWER_TYPES[selectedTower.type].upgrade.cost}g
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={sellSelected}>Sell</button>
            </div>
          </div>
        )}
      </div>
      {hud.status === 'won' && (
        <div className="loft-result" style={{color:'var(--accent)'}}>
          <b>All waves cleared</b> · {hud.lives} lives left
        </div>
      )}
      {hud.status === 'lost' && (
        <div className="loft-result" style={{color:'#ff4d6d'}}>
          <b>Overrun</b> on wave {hud.wave}
        </div>
      )}
      <div className="loft-hint">Tap a tower type, then tap the grass to place · tap a placed tower to upgrade or sell</div>
    </div>
  );
}
