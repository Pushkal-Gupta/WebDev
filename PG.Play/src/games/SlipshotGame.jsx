// SLIPSHOT — an original movement-first score-attack FPS.
//
// 180-second run. The toy is movement: slide into a jump, chain landings,
// airdash between kills. The combo meter climbs only while you keep
// moving. Targets pop along the walls, drones drift from the ceiling,
// prowlers roam the floor from 60 s on. Bronze / Silver / Gold medals
// at fixed score thresholds, tuned for "one more run."

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { submitScore } from '../scoreBus.js';
import { isMuted, sfx } from '../sound.js';

/* ─── tuning ──────────────────────────────────────────────────── */
const RUN_SECONDS   = 180;
const PLAYER_EYE    = 1.62;
const SLIDE_EYE     = 0.95;
const RADIUS        = 0.38;
// Movement: ~10% bump on base speeds to keep the larger arena from feeling
// sluggish. Slide stays in proportional ratio so the slide → jump cadence
// reads identically to the old tuning.
const WALK_SPEED    = 7.05;
const SPRINT_SPEED  = 10.55;
const SLIDE_SPEED   = 14.75;
const SLIDE_DECAY   = 0.93;
const SLIDE_FRICTION_MIN = 5.3;
const JUMP_V        = 7.2;
const AIRDASH_V     = 10.1;
const GRAVITY       = 21;
const MAX_HP        = 100;
const HP_REGEN_DELAY = 3.0;
const HP_REGEN_RATE  = 18;

const COMBO_MIN = 1.0;
const COMBO_MAX = 3.0;
const COMBO_DECAY_DELAY = 2.0;
const COMBO_DECAY_PER_S = 0.35;
const COMBO_ADD_GROUND = 0.15;
const COMBO_ADD_AIR    = 0.28;
const COMBO_ADD_HEAD   = 0.40;

const MEDAL_BRONZE = 8000;
const MEDAL_SILVER = 18000;
const MEDAL_GOLD   = 32000;

const WEAPONS = {
  pulse: { label: 'Pulse', cd: 0.085, dmg: 22, mag: 32, reload: 1.1, spread: 0.014, tracer: 0x00fff5 },
  slug:  { label: 'Slug',  cd: 0.70,  dmg: 80, mag: 6,  reload: 1.4, spread: 0.0,   tracer: 0xffe14f },
};

/* Arena: roomy sealed hall with pillars, cover blocks, and vault ledges.
   WALLS = full-height blockers (never vaultable).
   LEDGES = short platforms the player can jump over and stand on.
   Non-player collision (enemies, shots) treats everything as a wall.
   Footprint pushed from a 44×44 inner box to 80×80 (~80% larger area)
   so combat has breathing room; the cover/platform layout below fills
   the bigger floor with sightline breaks instead of dead space. */
const WALLS = [
  // Split central cross arms — leave a centre opening so the player can
  // spawn at (0, 0) without clipping into a wall on first frame. Arms run
  // from ~3 to 12 units out on each axis.
  [  7.5,  0, 9,   3.4, 1.4],
  [ -7.5,  0, 9,   3.4, 1.4],
  [  0,  7.5, 1.4, 3.4, 9  ],
  [  0, -7.5, 1.4, 3.4, 9  ],
  // diagonal corner blocks (pushed outward with the new arena)
  [-14, -16, 3,   2.6, 3 ],
  [ 14,  16, 3,   2.6, 3 ],
  [-22,  20, 2.6, 2.6, 2.6],
  [ 22, -20, 2.6, 2.6, 2.6],
  // pillars
  [  8,  -8, 1.8, 5.4, 1.8],
  [ -8,   8, 1.8, 5.4, 1.8],
  [ 14,  -2, 1.6, 4.8, 1.6],
  [-14,   2, 1.6, 4.8, 1.6],
  // side fins (perimeter cover)
  [ 30,   0, 1.6, 3.2, 10 ],
  [-30,   0, 1.6, 3.2, 10 ],
  [  0,  30, 10,  3.2, 1.6],
  [  0, -30, 10,  3.2, 1.6],
  // 6 cuboid cover blocks, scattered to break sightlines without forming
  // corridor walls. Heights 2.0–2.8, widths 3.0–4.6.
  [ 16,  10, 4.0, 2.4, 3.4],
  [-16, -10, 4.0, 2.4, 3.4],
  [ 20, -16, 3.4, 2.0, 4.6],
  [-20,  16, 4.6, 2.0, 3.4],
  [  6,  20, 3.0, 2.8, 3.0],
  [ -6, -20, 3.0, 2.8, 3.0],
];
const LEDGES = [
  // vault ledges — slide → jump clears them; top is standable.
  [ 12,   6, 4.5, 1.1, 0.6],
  [-12,  -6, 4.5, 1.1, 0.6],
  // 3 elevated platforms (~1.2m, 4×4) hugging the perimeter so the centre
  // stays open. Mantleable via the slide → jump → airdash chain.
  [ 26,  18, 4.0, 1.2, 4.0],
  [-26, -18, 4.0, 1.2, 4.0],
  [ 22, -22, 4.0, 1.2, 4.0],
];
const ARENA_HALF = 40;
const ARENA_HEIGHT = 6.5;

/* Target/drone spawn anchors — reachable points around the arena.
   Expanded with the larger 80×80 footprint so wall-poppers populate the
   whole hall instead of clustering near centre. */
const TARGET_ANCHORS = [
  // ring near-centre
  [  0,  16, 2.0], [  0, -16, 2.0], [ 16,   0, 2.0], [-16,   0, 2.0],
  [ 12,  12, 3.0], [-12,  12, 3.0], [ 12, -12, 3.0], [-12, -12, 3.0],
  [  6,   0, 4.2], [ -6,   0, 4.2], [  0,   6, 1.4], [  0,  -6, 1.4],
  [ 18,   8, 2.6], [-18,  -8, 2.6], [  8, -18, 2.6], [ -8,  18, 2.6],
  [  4,  10, 1.0], [ -4, -10, 1.0], [ 10,  -4, 1.0], [-10,   4, 1.0],
  // outer perimeter
  [  0,  30, 2.4], [  0, -30, 2.4], [ 30,   0, 2.4], [-30,   0, 2.4],
  [ 22,  22, 3.2], [-22,  22, 3.2], [ 22, -22, 3.2], [-22, -22, 3.2],
  [ 28,  10, 1.6], [-28, -10, 1.6], [ 10,  28, 1.6], [-10, -28, 1.6],
  [ 18,  26, 4.4], [-18, -26, 4.4], [ 26, -14, 4.4], [-26,  14, 4.4],
];

/* ─── tiny helpers ────────────────────────────────────────────── */
// 2D collision used by enemies, projectiles, and shot tracers. Everything
// blocks — enemies don't vault.
const collidesCube = (x, z, r) => {
  for (const [cx, cz, sx, , sz] of WALLS) {
    const dx = Math.abs(x - cx) - sx / 2;
    const dz = Math.abs(z - cz) - sz / 2;
    if (dx < r && dz < r) return true;
  }
  for (const [cx, cz, sx, , sz] of LEDGES) {
    const dx = Math.abs(x - cx) - sx / 2;
    const dz = Math.abs(z - cz) - sz / 2;
    if (dx < r && dz < r) return true;
  }
  return Math.abs(x) > ARENA_HALF - r || Math.abs(z) > ARENA_HALF - r;
};

// Player-aware collision. Full walls always block; ledges pass-through when
// the player's feet are above the ledge top.
const collidesPlayer = (x, z, r, feetY) => {
  for (const [cx, cz, sx, , sz] of WALLS) {
    const dx = Math.abs(x - cx) - sx / 2;
    const dz = Math.abs(z - cz) - sz / 2;
    if (dx < r && dz < r) return true;
  }
  for (const [cx, cz, sx, sy, sz] of LEDGES) {
    if (feetY >= sy - 0.02) continue;
    const dx = Math.abs(x - cx) - sx / 2;
    const dz = Math.abs(z - cz) - sz / 2;
    if (dx < r && dz < r) return true;
  }
  return Math.abs(x) > ARENA_HALF - r || Math.abs(z) > ARENA_HALF - r;
};

// Returns the standable floor height at (x,z): ARENA floor is 0, but a
// ledge top counts if the player is inside its footprint.
const standHeight = (x, z, r) => {
  let h = 0;
  for (const [cx, cz, sx, sy, sz] of LEDGES) {
    const dx = Math.abs(x - cx) - sx / 2;
    const dz = Math.abs(z - cz) - sz / 2;
    if (dx < r && dz < r && sy > h) h = sy;
  }
  return h;
};

/* Tiny deterministic PRNG (mulberry32) — daily seed drives the director */
const mulberry32 = (seed) => () => {
  let t = (seed = (seed + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const dailySeed = () => Math.floor(Date.now() / 86400000);

const lerp = (a, b, t) => a + (b - a) * t;

/* ─── component ───────────────────────────────────────────────── */
export default function SlipshotGame() {
  const mountRef = useRef(null);
  const startRunRef = useRef(() => {});

  // Single HUD state object; batched update at ~10 Hz to avoid 60-fps rerenders.
  const [hud, setHud] = useState({
    status: 'ready',   // 'ready' | 'playing' | 'ended'
    timeLeft: RUN_SECONDS,
    score: 0,
    combo: 1.0,
    hp: MAX_HP,
    weapon: 'pulse',
    ammo: WEAPONS.pulse.mag,
    reloading: false,
    kills: 0,
    hsCount: 0,
    shotsFired: 0,
    shotsHit: 0,
    comboMax: 1.0,
    dashReady: true,
    medal: null,
    pb: 0,
    newPb: false,
    locked: false,
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ── renderer / scene ─────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a1014);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Fog pushed back to match the bigger arena — far walls fade rather than
    // pop into view at the new 80-unit footprint.
    scene.fog = new THREE.Fog(0x0a1014, 32, 96);
    // FOV nudged 100 → 105 so the wider room reads in a single glance.
    const camera = new THREE.PerspectiveCamera(105, mount.clientWidth / mount.clientHeight, 0.1, 240);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.95);
    key.position.set(10, 22, 5);
    scene.add(key);

    /* ── floor + grid + walls ─────────────────────────────────── */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA_HALF * 2, ARENA_HALF * 2),
      new THREE.MeshStandardMaterial({ color: 0x111a22, roughness: 0.92 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Base structural grid — 1 cell per unit, kept dim. Divisions scale with
    // ARENA_HALF so cell density stays identical no matter the room size.
    const grid = new THREE.GridHelper(ARENA_HALF * 2, ARENA_HALF * 2, 0x1d2a34, 0x101a21);
    grid.position.y = 0.01;
    scene.add(grid);

    // Faint magenta grid — one line every 4 units. Two layers gives the floor
    // a clear sense of scale without overwhelming the dim base grid.
    const accentGrid = new THREE.GridHelper(ARENA_HALF * 2, Math.round(ARENA_HALF / 2), 0x4a1530, 0x3a1028);
    accentGrid.position.y = 0.012;
    accentGrid.material.transparent = true;
    accentGrid.material.opacity = 0.32;
    scene.add(accentGrid);

    const wallMat   = new THREE.MeshStandardMaterial({ color: 0xe8ece8, roughness: 0.8 });
    const trimMat   = new THREE.MeshStandardMaterial({ color: 0x00fff5, emissive: 0x004843, emissiveIntensity: 0.6, roughness: 0.35 });
    // Slightly lighter dark-magenta for the cover/platform tops — readable
    // against the wall-bone wallMat without breaking the palette.
    const coverMat  = new THREE.MeshStandardMaterial({ color: 0x6a2a48, emissive: 0x2a0a18, emissiveIntensity: 0.35, roughness: 0.7 });
    // Magenta wall-strip accent — same emissive trick used by holo-targets.
    const accentStripMat = new THREE.MeshStandardMaterial({
      color: 0xff3a8a, emissive: 0xff1a6a, emissiveIntensity: 1.4, roughness: 0.3,
    });

    // Outer arena walls — taller now to match the increased ceiling height.
    [[0, ARENA_HALF, ARENA_HALF * 2, ARENA_HEIGHT, 0.6], [0, -ARENA_HALF, ARENA_HALF * 2, ARENA_HEIGHT, 0.6],
     [ARENA_HALF, 0, 0.6, ARENA_HEIGHT, ARENA_HALF * 2], [-ARENA_HALF, 0, 0.6, ARENA_HEIGHT, ARENA_HALF * 2]].forEach(([cx, cz, sx, sy, sz]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
      m.position.set(cx, sy / 2, cz);
      scene.add(m);
    });

    // Cover indices: the last 6 entries of WALLS are scattered cover blocks
    // (heights ≤ 3). Rendering them with `coverMat` so they pop visually as
    // crouchable blocks rather than full structural walls.
    const COVER_THRESHOLD = 3.0;
    [...WALLS, ...LEDGES].forEach(([cx, cz, sx, sy, sz]) => {
      const useCoverMat = sy <= COVER_THRESHOLD && sx >= 2.5 && sz >= 2.5;
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), useCoverMat ? coverMat : wallMat);
      m.position.set(cx, sy / 2, cz);
      scene.add(m);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.06, sz), trimMat);
      trim.position.set(cx, sy + 0.03, cz);
      scene.add(trim);
    });

    // 6 thin glowing magenta strips on the perimeter walls. Decorative only —
    // give the bigger room landmarks the eye can lock onto when sweeping.
    const STRIP_W = 0.18, STRIP_H = 3.6, STRIP_D = 0.05;
    const stripPositions = [
      [-14, ARENA_HALF - 0.34, 0],  [ 14, ARENA_HALF - 0.34, 0],
      [-14, -(ARENA_HALF - 0.34), Math.PI], [ 14, -(ARENA_HALF - 0.34), Math.PI],
      [ ARENA_HALF - 0.34, 12, Math.PI / 2], [ ARENA_HALF - 0.34, -12, Math.PI / 2],
      [-(ARENA_HALF - 0.34), 12, -Math.PI / 2], [-(ARENA_HALF - 0.34), -12, -Math.PI / 2],
    ];
    stripPositions.forEach(([cx, cz, ry]) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(STRIP_W, STRIP_H, STRIP_D), accentStripMat);
      strip.position.set(cx, STRIP_H / 2 + 0.4, cz);
      strip.rotation.y = ry;
      scene.add(strip);
    });

    /* ── ambient drifting motes (decorative depth cue) ────────── */
    // 30 small additive billboards drifting on independent sine waves. Pure
    // visual — no collision, no gameplay impact. Held in a single shared
    // material so adding/removing the system stays cheap.
    const MOTE_COUNT = 30;
    const moteMat = new THREE.MeshBasicMaterial({
      color: 0xff6db0, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const moteGeo = new THREE.SphereGeometry(0.07, 5, 4);
    const motes = [];
    for (let i = 0; i < MOTE_COUNT; i++) {
      const m = new THREE.Mesh(moteGeo, moteMat);
      const x = (Math.random() - 0.5) * (ARENA_HALF * 2 - 6);
      const z = (Math.random() - 0.5) * (ARENA_HALF * 2 - 6);
      const y = 0.6 + Math.random() * (ARENA_HEIGHT - 1.4);
      m.position.set(x, y, z);
      scene.add(m);
      motes.push({
        mesh: m,
        baseY: y,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.6,
        driftX: (Math.random() - 0.5) * 0.4,
        driftZ: (Math.random() - 0.5) * 0.4,
      });
    }

    /* ── gun model in camera ──────────────────────────────────── */
    const gun = new THREE.Group();
    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.14, 0.48),
      new THREE.MeshStandardMaterial({ color: 0x2a3540, emissive: 0x0a1018, emissiveIntensity: 0.6, roughness: 0.55 })
    );
    gun.add(gunBody);
    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.58),
      new THREE.MeshStandardMaterial({ color: 0x3c4a58, emissive: 0x0f161d, emissiveIntensity: 0.5, roughness: 0.4 })
    );
    barrel.position.z = -0.5;
    gun.add(barrel);
    const gunAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.02, 0.48),
      new THREE.MeshStandardMaterial({ color: 0x00fff5, emissive: 0x00c8c0, emissiveIntensity: 1.1 })
    );
    gunAccent.position.y = 0.08;
    gun.add(gunAccent);
    // Weapon tip — a small cyan sight nub for visual read at the end of the barrel
    const sightNub = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.05, 0.035),
      new THREE.MeshStandardMaterial({ color: 0x00fff5, emissive: 0x00c8c0, emissiveIntensity: 1.4 })
    );
    sightNub.position.set(0, 0.065, -0.68);
    gun.add(sightNub);
    // Muzzle flash — dim by default, flicker on fire
    const muzzleMat = new THREE.MeshBasicMaterial({ color: 0xfff5e0, transparent: true, opacity: 0 });
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), muzzleMat);
    muzzle.position.set(0, 0, -0.82);
    gun.add(muzzle);
    gun.position.set(0.22, -0.2, -0.36);
    // Render the gun after the scene so it never clips into walls.
    gun.renderOrder = 10;
    gun.traverse((o) => { if (o.material) { o.material.depthTest = false; o.material.depthWrite = false; } });
    camera.add(gun);

    // Camera-attached fill light — keeps the viewmodel readable even when the
    // player spins away from the key light.
    const camFill = new THREE.PointLight(0xdde8ff, 0.55, 4, 2);
    camFill.position.set(0.1, 0.15, -0.1);
    camera.add(camFill);
    scene.add(camera);

    /* ── procedural audio (tiny synth, no samples) ────────────── */
    let audio = null;
    const ensureAudio = () => {
      if (audio) return audio;
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      audio = new A();
      return audio;
    };
    const beep = (freq, dur, type, gain, freqEnd) => {
      // Honor the platform mute toggle (Settings drawer + GameShell pause).
      // isMuted reads localStorage on each call — cheap, always fresh.
      if (isMuted()) return;
      const ac = ensureAudio();
      if (!ac) return;
      if (ac.state === 'suspended') ac.resume();
      const t0 = ac.currentTime;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0002, t0 + dur);
      osc.connect(g).connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    };
    const sfxFirePulse = () => beep(820, 0.06, 'square', 0.035, 360);
    const sfxFireSlug  = () => { beep(180, 0.14, 'sawtooth', 0.09, 60); beep(640, 0.08, 'triangle', 0.04, 220); };
    const sfxKill      = () => { beep(1300, 0.09, 'triangle', 0.07, 700); setTimeout(() => beep(1900, 0.06, 'triangle', 0.05, 1400), 45); };
    const sfxHeadshot  = () => { beep(1800, 0.07, 'triangle', 0.09, 900); setTimeout(() => beep(2600, 0.06, 'triangle', 0.06, 1800), 40); };
    const sfxHurt      = () => beep(120, 0.2, 'sine', 0.14, 45);

    let muzzleLife = 0;

    // Tracks every setTimeout we hand out for DOM/popup work so the unmount
    // cleanup can flush them — otherwise a 700ms popup callback will fire
    // after the mount has been torn down and leak its DOM node.
    const pendingTimeouts = new Set();
    const trackTimeout = (fn, ms) => {
      const id = setTimeout(() => {
        pendingTimeouts.delete(id);
        fn();
      }, ms);
      pendingTimeouts.add(id);
      return id;
    };

    /* ── player state ─────────────────────────────────────────── */
    const player = {
      // Spawn at the centre of the bigger arena (slightly forward so the
      // player faces the central cross on first frame).
      pos: new THREE.Vector3(0, PLAYER_EYE, 0),
      vel: new THREE.Vector3(),
      yaw: Math.PI, pitch: 0,
      onGround: true, sliding: false, slideTimer: 0,
      eye: PLAYER_EYE,
      hp: MAX_HP, lastHurt: 999,
      weapon: 'pulse',
      ammo: { pulse: WEAPONS.pulse.mag, slug: WEAPONS.slug.mag },
      fireCd: 0, reloadIn: 0,
      dashReady: true,
      // Bunny-hop chain. `landTime` is the wall-clock (gameTime) of the most
      // recent landing; jumping within BHOP_WINDOW preserves horizontal speed.
      // After BHOP_MAX_CHAIN consecutive hops, friction returns to normal.
      landTime: -999, bhopChain: 0,
    };

    /* ── enemies + targets registries ─────────────────────────── */
    // Each entity: { kind, alive, mesh, head?, hp, maxHp, pos, ... kind-specific ...}
    const entities = [];

    const spawnTarget = (pos) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.55, 0.55),
        new THREE.MeshStandardMaterial({ color: 0x00fff5, emissive: 0x00c8c0, emissiveIntensity: 1.1, roughness: 0.35 })
      );
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, 0.18),
        new THREE.MeshStandardMaterial({ color: 0xff6680, emissive: 0xff3a5a, emissiveIntensity: 1.3 })
      );
      group.add(body);
      group.add(core);
      group.position.copy(pos);
      scene.add(group);
      entities.push({
        kind: 'target', alive: true, mesh: group, body,
        hp: 1, maxHp: 1, pos: pos.clone(),
        bob: Math.random() * Math.PI * 2, spawnT: clock.getElapsedTime(),
      });
    };

    const spawnDrone = (pos) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.42, 0),
        new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0xbb2340, emissiveIntensity: 0.9, flatShading: true, roughness: 0.45 })
      );
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.04, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0x00fff5, emissive: 0x00c8c0, emissiveIntensity: 0.7 })
      );
      ring.rotation.x = Math.PI / 2;
      group.add(body);
      group.add(ring);
      group.position.copy(pos);
      scene.add(group);
      entities.push({
        kind: 'drone', alive: true, mesh: group, body,
        hp: 30, maxHp: 30, pos: pos.clone(), vel: new THREE.Vector3(),
        fireCd: 2.0 + Math.random() * 1.5, wobble: Math.random() * Math.PI * 2,
        wobblePhase: Math.random() * Math.PI * 2, retreatT: 0,
      });
    };

    const spawnProwler = (pos) => {
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.4, 1.1, 4, 10),
        new THREE.MeshStandardMaterial({ color: 0x2a3340, roughness: 0.55 })
      );
      body.position.copy(pos);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0x992030, emissiveIntensity: 0.8 })
      );
      head.position.set(pos.x, pos.y + 0.85, pos.z);
      scene.add(body);
      scene.add(head);
      entities.push({
        kind: 'prowler', alive: true, mesh: body, head,
        hp: 60, maxHp: 60, pos: pos.clone(), name: pickProwlerName(),
        fireCd: 1.4 + Math.random() * 0.8,
        strafe: Math.random() > 0.5 ? 1 : -1, strafeTick: 0,
      });
    };

    // Cosmetic name pool for killfeed entries.
    const PROWLER_NAMES = ['Rook', 'Vex', 'Halo', 'Echo', 'Knox', 'Ash', 'Wren', 'Dax', 'Nyx', 'Orix'];
    const pickProwlerName = () => PROWLER_NAMES[Math.floor(Math.random() * PROWLER_NAMES.length)];

    /* ── enemy projectiles (simple) ───────────────────────────── */
    const enemyShots = [];
    const enemyShotGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const enemyShotMat = new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0xcc2040, emissiveIntensity: 1.2 });
    const fireEnemyShot = (fromPos, toward) => {
      const mesh = new THREE.Mesh(enemyShotGeo, enemyShotMat);
      mesh.position.copy(fromPos);
      scene.add(mesh);
      const dir = toward.clone().sub(fromPos).normalize();
      enemyShots.push({ mesh, vel: dir.multiplyScalar(32), life: 2.2 });
    };

    /* ── tracer lines for hitscan visual feedback ─────────────── */
    const tracers = [];
    const tracerGeo = new THREE.BufferGeometry();
    tracerGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const makeTracer = (from, to, colorHex) => {
      const geom = new THREE.BufferGeometry();
      const arr = new Float32Array([from.x, from.y, from.z, to.x, to.y, to.z]);
      geom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
      const line = new THREE.Line(geom, mat);
      scene.add(line);
      tracers.push({ line, mat, life: 0.12 });
    };

    /* ── small hit-particle pool (pooled to avoid GC) ─────────── */
    const particles = [];
    const particleGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const spawnBurst = (pos, color, count = 8) => {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(particleGeo, mat);
        m.position.copy(pos);
        const dir = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 1.2,
          (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(2 + Math.random() * 3);
        scene.add(m);
        particles.push({ mesh: m, vel: dir, life: 0.5, mat });
      }
    };

    /* ── input ────────────────────────────────────────────────── */
    const keys = {};
    let firing = false;

    const onKeyDown = (e) => {
      if (hudRef.current.status === 'ended' && e.code === 'KeyR') {
        startRun();
        return;
      }
      keys[e.code] = true;
      if (e.code === 'Digit1') switchWeapon('pulse');
      if (e.code === 'Digit2') switchWeapon('slug');
      if (e.code === 'KeyQ')   switchWeapon(player.weapon === 'pulse' ? 'slug' : 'pulse');
      if (e.code === 'KeyR')   triggerReload();
      // Airdash: single press of Shift while airborne
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !player.onGround && player.dashReady) {
        doAirdash();
      }
    };
    const onKeyUp = (e) => { keys[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const switchWeapon = (w) => {
      if (w === player.weapon) return;
      player.weapon = w;
      player.fireCd = 0.12;
    };

    const triggerReload = () => {
      const w = WEAPONS[player.weapon];
      if (player.reloadIn > 0) return;
      if (player.ammo[player.weapon] >= w.mag) return;
      player.reloadIn = w.reload;
      // Mechanical click-click-clack on reload start. Honors mute via sfx.
      try { sfx?.reload?.(); } catch {}
    };

    const doAirdash = () => {
      const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
      const right   = new THREE.Vector3( Math.cos(player.yaw), 0, -Math.sin(player.yaw));
      const wish = new THREE.Vector3();
      if (keys.KeyW) wish.add(forward);
      if (keys.KeyS) wish.sub(forward);
      if (keys.KeyD) wish.add(right);
      if (keys.KeyA) wish.sub(right);
      if (wish.lengthSq() < 0.01) wish.copy(forward);
      wish.normalize();
      player.vel.x = wish.x * AIRDASH_V;
      player.vel.z = wish.z * AIRDASH_V;
      player.vel.y = Math.max(player.vel.y, 1.2);
      player.dashReady = false;
    };

    const onClick = () => {
      const st = hudRef.current.status;
      if (st === 'ready' || st === 'ended') {
        startRun();
      }
      if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock?.();
      }
    };
    renderer.domElement.addEventListener('click', onClick);

    const onLock = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      setHudField('locked', locked);
      // Dropping lock should cancel any held-fire so unpausing doesn't
      // immediately unload a clip.
      if (!locked) firing = false;
    };
    document.addEventListener('pointerlockchange', onLock);

    const onMouseMove = (e) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      player.yaw -= e.movementX * 0.0022;
      player.pitch -= e.movementY * 0.0022;
      player.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, player.pitch));
    };
    document.addEventListener('mousemove', onMouseMove);

    const onMouseDown = () => { if (document.pointerLockElement === renderer.domElement) firing = true; };
    const onMouseUp = () => { firing = false; };
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    /* ── mutable hud ref for fast reads inside loop ───────────── */
    const hudRef = { current: {
      status: 'ready', timeLeft: RUN_SECONDS, score: 0, combo: 1.0,
      comboMax: 1.0, kills: 0, hsCount: 0, shotsFired: 0, shotsHit: 0,
      lastKillT: -999,
      runStart: 0,
    }};
    const setHudField = (k, v) => setHud((h) => ({ ...h, [k]: v }));

    /* ── run lifecycle ────────────────────────────────────────── */
    const clock = new THREE.Clock();

    // Juice accumulators + game clock. gameTime only advances while the run
    // is active (status = playing AND pointer locked), so Esc-to-unlock
    // effectively pauses the round.
    let shakeAmt = 0;
    let bobPhase = 0;
    let gameTime = 0;

    const startRun = () => {
      // Clear existing entities
      for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];
        if (e.mesh) scene.remove(e.mesh);
        if (e.head) scene.remove(e.head);
      }
      entities.length = 0;
      for (let i = enemyShots.length - 1; i >= 0; i--) scene.remove(enemyShots[i].mesh);
      enemyShots.length = 0;

      // Reset player at arena centre.
      player.pos.set(0, PLAYER_EYE, 0);
      player.vel.set(0, 0, 0);
      player.yaw = Math.PI; player.pitch = 0;
      player.hp = MAX_HP; player.lastHurt = 999;
      player.ammo.pulse = WEAPONS.pulse.mag;
      player.ammo.slug  = WEAPONS.slug.mag;
      player.fireCd = 0; player.reloadIn = 0;
      player.dashReady = true; player.weapon = 'pulse';

      hudRef.current = {
        status: 'playing', timeLeft: RUN_SECONDS, score: 0, combo: 1.0,
        comboMax: 1.0, kills: 0, hsCount: 0, shotsFired: 0, shotsHit: 0,
        lastKillT: -999, runStart: gameTime,
      };

      // Seat the director
      director.reset();
      // Seed a few starter targets immediately
      for (let i = 0; i < 3; i++) director.forceSpawnTarget();

      setHud((h) => ({
        ...h, status: 'playing', timeLeft: RUN_SECONDS, score: 0, combo: 1.0,
        hp: MAX_HP, weapon: 'pulse', ammo: WEAPONS.pulse.mag, reloading: false,
        kills: 0, hsCount: 0, shotsFired: 0, shotsHit: 0, comboMax: 1.0,
        dashReady: true, medal: null, newPb: false,
      }));

      if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock?.();
      }
    };

    const endRun = () => {
      const hr = hudRef.current;
      hr.status = 'ended';
      const accuracy = hr.shotsFired === 0 ? 0 : hr.shotsHit / hr.shotsFired;
      const medal = hr.score >= MEDAL_GOLD ? 'gold'
                  : hr.score >= MEDAL_SILVER ? 'silver'
                  : hr.score >= MEDAL_BRONZE ? 'bronze' : null;
      const elapsed = Math.min(RUN_SECONDS, Math.max(0, gameTime - hr.runStart));
      submitScore('slipshot', hr.score, {
        mode: 'score_attack',
        time: Math.round(elapsed),
        kills: hr.kills,
        accuracy: Math.round(accuracy * 100),
        headshots: hr.hsCount,
        combo_max: Math.round(hr.comboMax * 100) / 100,
        medal: medal || 'none',
        seed: dailySeed(),
      });
      // Read PB from localStorage for instant display (App writes async)
      let pbPrev = 0;
      try { pbPrev = Number(localStorage.getItem('pgplay-best-slipshot')) || 0; } catch {}
      const newPb = hr.score > pbPrev;
      if (newPb) { try { localStorage.setItem('pgplay-best-slipshot', String(hr.score)); } catch {} }
      setHud((h) => ({
        ...h,
        status: 'ended',
        score: hr.score,
        kills: hr.kills,
        hsCount: hr.hsCount,
        comboMax: Math.round(hr.comboMax * 100) / 100,
        shotsFired: hr.shotsFired,
        shotsHit: hr.shotsHit,
        medal,
        pb: Math.max(pbPrev, hr.score),
        newPb,
      }));
      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock?.();
      }
    };

    /* ── spawn director (seeded) ──────────────────────────────── */
    const director = (() => {
      const rng = mulberry32(dailySeed() ^ 0x51ab1);
      let tTarget = 0, tDrone = 0, tProwler = 0;
      const pick = (arr) => arr[Math.floor(rng() * arr.length)];

      // Spawn-spacing audit: prevents pile-on at any single anchor. Returns
      // true when the candidate point is too close to either the player
      // (12u) or any live entity (8u). 12-attempt loop in each picker; if
      // every attempt fails, the picker falls back to the last candidate
      // (random) so the run never stalls.
      const ENTITY_SPACING = 8;
      const PLAYER_SPACING = 12;
      const tooClose = (x, z, py) => {
        const pdx = x - player.pos.x;
        const pdz = z - player.pos.z;
        if (pdx * pdx + pdz * pdz < PLAYER_SPACING * PLAYER_SPACING) return true;
        for (const e of entities) {
          if (!e.alive) continue;
          const ep = e.mesh ? e.mesh.position : e.pos;
          const dx = ep.x - x;
          const dy = (ep.y || py) - py;
          const dz = ep.z - z;
          if (dx * dx + dy * dy + dz * dz < ENTITY_SPACING * ENTITY_SPACING) return true;
        }
        return false;
      };

      const pickAnchor = () => {
        let last = null;
        for (let i = 0; i < 12; i++) {
          const a = pick(TARGET_ANCHORS);
          last = a;
          if (!tooClose(a[0], a[1], a[2])) return new THREE.Vector3(a[0], a[2], a[1]);
        }
        const a = last || pick(TARGET_ANCHORS);
        return new THREE.Vector3(a[0], a[2], a[1]);
      };
      const dronePoint = () => {
        let lx = 0, lz = 10, ly = 4;
        for (let i = 0; i < 12; i++) {
          const x = (rng() - 0.5) * (ARENA_HALF - 4) * 2;
          const z = (rng() - 0.5) * (ARENA_HALF - 4) * 2;
          const y = 3.8 + rng() * 1.6;
          lx = x; lz = z; ly = y;
          if (collidesCube(x, z, 0.8)) continue;
          if (tooClose(x, z, y)) continue;
          return new THREE.Vector3(x, y, z);
        }
        return new THREE.Vector3(lx, ly, lz);
      };
      const prowlerPoint = () => {
        let lx = 12, lz = 12;
        for (let i = 0; i < 12; i++) {
          const x = (rng() - 0.5) * (ARENA_HALF - 3) * 2;
          const z = (rng() - 0.5) * (ARENA_HALF - 3) * 2;
          lx = x; lz = z;
          if (collidesCube(x, z, 0.5)) continue;
          if (tooClose(x, z, 1.0)) continue;
          return new THREE.Vector3(x, 1.0, z);
        }
        return new THREE.Vector3(lx, 1.0, lz);
      };
      const countOf = (kind) => entities.reduce((n, e) => n + (e.kind === kind ? 1 : 0), 0);

      const phaseFor = (elapsed) => elapsed < 60 ? 0 : elapsed < 120 ? 1 : 2;

      const step = (dt, elapsed) => {
        const phase = phaseFor(elapsed);

        // Targets — intervals tightened ~25% (1.5→1.2, 1.1→0.88, 0.85→0.68)
        // to keep wall-popping density alive across the bigger floor. Caps
        // bumped a notch for the same reason.
        const tInt = phase === 0 ? 1.2 : phase === 1 ? 0.88 : 0.68;
        const tCap = phase === 0 ? 10 : phase === 1 ? 12 : 14;
        tTarget -= dt;
        while (tTarget <= 0 && countOf('target') < tCap) {
          spawnTarget(pickAnchor());
          tTarget += tInt;
        }
        if (tTarget < -0.1) tTarget = 0;

        // Drones — caps bumped by 1–2 across phases so the ceiling layer
        // stays present in the larger overhead volume.
        const dStart = 18;
        if (elapsed > dStart) {
          const dInt = phase === 0 ? 5.5 : phase === 1 ? 3.6 : 2.4;
          const dCap = phase === 0 ? 3 : phase === 1 ? 5 : 6;
          tDrone -= dt;
          while (tDrone <= 0 && countOf('drone') < dCap) {
            spawnDrone(dronePoint());
            tDrone += dInt;
          }
          if (tDrone < -0.1) tDrone = 0;
        }

        // Prowlers — start moved 60s → 50s. The bigger floor gives them more
        // room to threaten, so they need to show up sooner to apply pressure.
        const pStart = 50;
        if (elapsed > pStart) {
          const pInt = phase === 1 ? 10 : 6.5;
          const pCap = phase === 1 ? 2 : 3;
          tProwler -= dt;
          while (tProwler <= 0 && countOf('prowler') < pCap) {
            spawnProwler(prowlerPoint());
            tProwler += pInt;
          }
          if (tProwler < -0.1) tProwler = 0;
        }
      };

      const reset = () => { tTarget = 0.3; tDrone = 0; tProwler = 0; };
      const forceSpawnTarget = () => spawnTarget(pickAnchor());

      return { step, reset, forceSpawnTarget };
    })();

    /* ── fire / hitscan ───────────────────────────────────────── */
    const raycaster = new THREE.Raycaster();
    const shotOrigin = new THREE.Vector3();
    const shotDir = new THREE.Vector3();

    const tryFire = () => {
      const w = WEAPONS[player.weapon];
      if (player.fireCd > 0 || hudRef.current.status !== 'playing') return;
      if (player.reloadIn > 0) return;
      if (player.ammo[player.weapon] <= 0) { triggerReload(); return; }
      player.fireCd = w.cd;
      player.ammo[player.weapon]--;
      hudRef.current.shotsFired++;

      // Juice: fire sound + muzzle flash
      muzzleLife = 0.06;
      muzzle.material.opacity = 1;
      muzzle.scale.setScalar(1 + Math.random() * 0.4);
      if (player.weapon === 'pulse') sfxFirePulse(); else sfxFireSlug();

      // Direction with weapon spread
      camera.getWorldPosition(shotOrigin);
      shotDir.set(0, 0, -1).applyQuaternion(camera.quaternion);
      if (w.spread > 0) {
        const moving = Math.hypot(player.vel.x, player.vel.z) > 1.0;
        const s = moving ? w.spread * 0.6 : w.spread;
        shotDir.x += (Math.random() - 0.5) * s;
        shotDir.y += (Math.random() - 0.5) * s;
        shotDir.normalize();
      }

      raycaster.set(shotOrigin, shotDir);
      raycaster.far = 80;

      // Gather candidate meshes (bodies + heads). Skip dead entities so a
      // stale corpse on the same frame can't double-register a headshot — the
      // raycaster will happily intersect a mesh that hasn't been GC'd yet.
      const cands = [];
      for (const e of entities) {
        if (!e.alive) continue;
        if (e.body) cands.push(e.body); else if (e.mesh) cands.push(e.mesh);
        if (e.head) cands.push(e.head);
      }
      const hits = raycaster.intersectObjects(cands, false);

      // Also test wall/floor to terminate tracer
      const envHit = new THREE.Vector3();
      const envDist = terminateOnEnv(shotOrigin, shotDir, envHit);

      const hitEntity = hits.find((h) => {
        // Find the entity this mesh belongs to
        for (const e of entities) {
          if (!e.alive) continue;
          if (e.body === h.object || e.mesh === h.object || e.head === h.object) {
            h._entity = e;
            h._isHead = e.head === h.object;
            return true;
          }
        }
        return false;
      });

      let end = envHit;
      if (hitEntity && hitEntity.distance < envDist) {
        end = hitEntity.point.clone();
        hudRef.current.shotsHit++;
        // Hit-marker feedback: deeper thunk on head, tight tick on body.
        if (hitEntity._isHead) sfxHitThunk(); else sfxHitTick();
        applyHit(hitEntity._entity, hitEntity._isHead, w);
      }
      makeTracer(shotOrigin.clone().add(shotDir.clone().multiplyScalar(0.8)), end, w.tracer);
    };

    const terminateOnEnv = (origin, dir, out) => {
      // Ray-test against an upper ceiling plane + walls: cheap analytical.
      // Simple: step the ray outward and test collidesCube. Step is tight
      // (0.08) so tracers don't tunnel through thin trim or stop short of
      // walls; iteration count scales with `max / step` automatically.
      const step = 0.08;
      const max = 120;
      for (let d = step; d < max; d += step) {
        const x = origin.x + dir.x * d;
        const y = origin.y + dir.y * d;
        const z = origin.z + dir.z * d;
        // Vertical bounds match the new arena ceiling (ARENA_HEIGHT) so
        // tracers correctly terminate at the top instead of running past it.
        if (y < 0.01 || y > ARENA_HEIGHT || collidesCube(x, z, 0.05)) {
          out.set(x, y, z);
          return d;
        }
      }
      out.set(origin.x + dir.x * max, origin.y + dir.y * max, origin.z + dir.z * max);
      return max;
    };

    const applyHit = (e, isHead, w) => {
      const airborne = !player.onGround;
      let dmg = w.dmg;
      if (isHead) dmg = Math.round(dmg * (player.weapon === 'slug' ? 2.5 : 1.5));
      e.hp -= dmg;

      // Visual punch: tiny scale pop
      if (e.body) {
        e.body.scale.setScalar(1.25);
        trackTimeout(() => { if (e.body) e.body.scale.setScalar(1); }, 60);
      }

      // Reticle feedback — killing blow is handled by killEntity, otherwise
      // flash the hit state briefly.
      if (e.hp > 0) flashReticle(isHead ? 'head' : 'hit');

      if (e.hp <= 0) {
        killEntity(e, isHead, airborne);
      }
    };

    const killEntity = (e, isHead, airborne) => {
      // Mark dead immediately. Subsequent shots in the same frame skip this
      // entity in the candidate list, so a kill can't be double-counted as a
      // headshot via a stale head mesh.
      e.alive = false;
      const hr = hudRef.current;
      const base = e.kind === 'target' ? 60 : e.kind === 'drone' ? 180 : 360;
      const comboMult = hr.combo;
      const headMult = isHead ? 1.5 : 1.0;
      const gained = Math.round(base * comboMult * headMult);
      hr.score += gained;
      if (isHead) sfxHeadshot(); else sfxKill();
      flashReticle(isHead ? 'head' : 'kill');
      if (isHead) punchHeadshot();
      hr.kills++;
      if (isHead) hr.hsCount++;

      // Combo gain
      let add = airborne ? COMBO_ADD_AIR : COMBO_ADD_GROUND;
      if (isHead) add = Math.max(add, COMBO_ADD_HEAD);
      hr.combo = Math.min(COMBO_MAX, hr.combo + add);
      if (hr.combo > hr.comboMax) hr.comboMax = hr.combo;
      hr.lastKillT = gameTime;

      // Floating score popup (DOM)
      showScorePopup(gained, isHead);
      // Killfeed entry — uses the player's current weapon icon.
      pushKillfeed(e, player.weapon, isHead);

      // Airdash refund on kill while airborne
      if (airborne) player.dashReady = true;

      // Burst + remove. Removing the meshes here means the same-frame
      // raycaster candidate list (which already filtered on alive) stays
      // consistent for any follow-up shots.
      const p = e.mesh ? e.mesh.position : e.pos;
      spawnBurst(p.clone(), e.kind === 'target' ? 0x00fff5 : 0xff4d6d, e.kind === 'target' ? 8 : 14);
      if (e.mesh) scene.remove(e.mesh);
      if (e.head) scene.remove(e.head);
      const idx = entities.indexOf(e);
      if (idx >= 0) entities.splice(idx, 1);
    };

    /* ── floating score popups (DOM layer) ────────────────────── */
    const popupLayer = document.createElement('div');
    popupLayer.className = 'slipshot-popups';
    mount.appendChild(popupLayer);
    const showScorePopup = (n, head) => {
      const el = document.createElement('div');
      el.className = 'slipshot-popup' + (head ? ' is-head' : '');
      // Headshots show as gold with a 1.5x multiplier suffix.
      el.textContent = head ? `+${n} 1.5×` : `+${n}`;
      popupLayer.appendChild(el);
      trackTimeout(() => el.remove(), 700);
    };

    /* ── killfeed (top-right rolling list) ────────────────────── */
    const killfeed = document.createElement('div');
    killfeed.className = 'slipshot-killfeed';
    mount.appendChild(killfeed);
    const KILLFEED_MAX = 4;
    const pushKillfeed = (entity, weaponKey, isHead) => {
      const row = document.createElement('div');
      row.className = 'slipshot-kf-row';
      const wIcon = weaponKey === 'slug' ? 'SLG' : 'PLS';
      const name = entity.name
        || (entity.kind === 'target' ? 'Target'
          : entity.kind === 'drone' ? 'Drone' : 'Prowler');
      row.innerHTML =
        `<span class="slipshot-kf-weap">${wIcon}</span>` +
        (isHead ? '<span class="slipshot-kf-head">HS</span>' : '') +
        `<span class="slipshot-kf-name">${name}</span>`;
      killfeed.prepend(row);
      while (killfeed.childElementCount > KILLFEED_MAX) {
        killfeed.lastElementChild?.remove();
      }
      // Auto-fade after 3s; the row may already be gone if it scrolled off.
      trackTimeout(() => row.classList.add('is-fading'), 3000);
      trackTimeout(() => row.remove(), 3400);
    };

    /* ── reticle + headshot punch layers (DOM, not React) ─────── */
    const reticle = document.createElement('div');
    reticle.className = 'slipshot-reticle';
    mount.appendChild(reticle);
    let reticleFlashTimer = 0;
    const flashReticle = (kind) => {
      // kind: 'hit' | 'kill' | 'head'
      // Replaces the brittle `void el.offsetWidth` reflow trick — that
      // pattern races with rapid fire (two hits in the same frame can collapse
      // into a single animation). Instead, drop all flash classes, hand the
      // browser one rAF to commit the cleared state, then re-apply. This is
      // the pulse on every confirmed hit; rapid fire produces visible ticks.
      reticle.classList.remove('is-hit', 'is-kill', 'is-head');
      reticle.style.transform = 'translate(-50%, -50%) scale(1)';
      reticle.style.opacity = '1';
      requestAnimationFrame(() => {
        reticle.style.transform = '';
        reticle.style.opacity = '';
        reticle.classList.add(kind === 'head' ? 'is-head' : kind === 'kill' ? 'is-kill' : 'is-hit');
      });
      clearTimeout(reticleFlashTimer);
      reticleFlashTimer = trackTimeout(() => {
        reticle.classList.remove('is-hit', 'is-kill', 'is-head');
      }, kind === 'head' ? 260 : kind === 'kill' ? 220 : 140);
    };
    const punchHeadshot = () => {
      const el = document.createElement('div');
      el.className = 'slipshot-punch';
      mount.appendChild(el);
      trackTimeout(() => el.remove(), 180);
    };

    // Hit-marker synth ticks. Body = high tick, head = deeper thunk.
    const sfxHitTick  = () => beep(1500, 0.04, 'square',   0.05, 1100);
    const sfxHitThunk = () => beep(420,  0.08, 'triangle', 0.07, 240);

    /* ── loop ─────────────────────────────────────────────────── */
    let raf = 0;
    let hudTick = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, clock.getDelta());
      const hr = hudRef.current;

      const isPlaying = hr.status === 'playing';
      const isLocked = document.pointerLockElement === renderer.domElement;
      const isActive = isPlaying && isLocked;
      // gdt = gameplay delta. Zero while paused (pointer unlocked or between
      // runs), so every ticker below freezes in lockstep.
      const gdt = isActive ? dt : 0;
      gameTime += gdt;

      // Weapon cd / reload (frozen during pause)
      if (player.reloadIn > 0) {
        player.reloadIn -= gdt;
        if (player.reloadIn <= 0) {
          player.ammo[player.weapon] = WEAPONS[player.weapon].mag;
        }
      }
      player.fireCd -= gdt;

      // HP regen after grace period
      player.lastHurt += gdt;
      if (isActive && player.lastHurt > HP_REGEN_DELAY && player.hp > 0 && player.hp < MAX_HP) {
        player.hp = Math.min(MAX_HP, player.hp + HP_REGEN_RATE * gdt);
      }

      /* ── movement ─────────────────────────────────────────── */
      if (isPlaying && player.hp > 0 && document.pointerLockElement === renderer.domElement) {
        const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
        const right   = new THREE.Vector3( Math.cos(player.yaw), 0, -Math.sin(player.yaw));

        const wish = new THREE.Vector3();
        if (keys.KeyW) wish.add(forward);
        if (keys.KeyS) wish.sub(forward);
        if (keys.KeyD) wish.add(right);
        if (keys.KeyA) wish.sub(right);
        const wishLen = wish.length();
        if (wishLen > 0) wish.normalize();

        // Slide trigger: Shift on ground while moving (airborne Shift is airdash instead)
        const shiftHeld = keys.ShiftLeft || keys.ShiftRight;
        const slideTrigger = keys.ControlLeft || keys.ControlRight || keys.KeyC || (shiftHeld && player.onGround);

        if (!player.sliding && slideTrigger && player.onGround && wishLen > 0.1) {
          player.sliding = true;
          player.slideTimer = 0;
          const boost = Math.max(SPRINT_SPEED, SLIDE_SPEED);
          player.vel.x = wish.x * boost;
          player.vel.z = wish.z * boost;
        }
        if (player.sliding && !slideTrigger) player.sliding = false;

        if (player.sliding) {
          const steer = 6 * dt;
          player.vel.x += wish.x * steer;
          player.vel.z += wish.z * steer;
          const s = Math.hypot(player.vel.x, player.vel.z);
          if (s > SLIDE_FRICTION_MIN) {
            const decay = Math.pow(SLIDE_DECAY, dt * 60);
            player.vel.x *= decay;
            player.vel.z *= decay;
          }
          player.slideTimer += dt;
          if (player.slideTimer > 1.4 && Math.hypot(player.vel.x, player.vel.z) < SPRINT_SPEED) player.sliding = false;
        } else {
          const maxSpd = shiftHeld && player.onGround ? SPRINT_SPEED : WALK_SPEED;
          if (player.onGround) {
            const friction = 10 * dt;
            const cur = Math.hypot(player.vel.x, player.vel.z);
            if (cur > 0.01) {
              const drop = Math.max(0, cur - maxSpd) * friction + friction * 0.6;
              const k = Math.max(0, cur - drop) / cur;
              player.vel.x *= k;
              player.vel.z *= k;
            }
          }
          const accel = player.onGround ? 55 : 22;
          if (wishLen > 0) {
            const desired = maxSpd;
            const curWish = player.vel.x * wish.x + player.vel.z * wish.z;
            const add = Math.min(accel * dt, Math.max(0, desired - curWish));
            player.vel.x += wish.x * add;
            player.vel.z += wish.z * add;
          }
        }

        if (keys.Space && player.onGround) {
          player.vel.y = JUMP_V;
          player.onGround = false;
          // Bunny-hop: a Space press within 80ms of landing keeps ~92% of
          // horizontal speed and bypasses the upcoming ground-friction tick.
          // After 5 chained hops, the chain resets so friction returns to
          // normal — krunker-feel without infinite acceleration.
          const sinceLand = gameTime - player.landTime;
          if (sinceLand <= 0.08 && player.bhopChain < 5) {
            player.vel.x *= 0.92;
            player.vel.z *= 0.92;
            player.bhopChain++;
          } else {
            player.bhopChain = 0;
          }
        }
        player.vel.y -= GRAVITY * dt;

        const feetY = player.pos.y - player.eye;
        const nx = player.pos.x + player.vel.x * dt;
        const nz = player.pos.z + player.vel.z * dt;
        if (!collidesPlayer(nx, player.pos.z, RADIUS, feetY)) player.pos.x = nx;
        else player.vel.x *= -0.15;
        if (!collidesPlayer(player.pos.x, nz, RADIUS, feetY)) player.pos.z = nz;
        else player.vel.z *= -0.15;

        player.pos.y += player.vel.y * dt;
        const targetEye = player.sliding ? SLIDE_EYE : PLAYER_EYE;
        player.eye += (targetEye - player.eye) * Math.min(1, dt * 14);
        // Floor height is 0 on the arena, or the top of a ledge you're
        // standing within.
        const floorY = standHeight(player.pos.x, player.pos.z, RADIUS);
        const minY = floorY + player.eye;
        if (player.pos.y <= minY) {
          const impactSpd = Math.abs(player.vel.y);
          player.pos.y = minY;
          player.vel.y = 0;
          if (!player.onGround) {
            player.onGround = true;
            player.dashReady = true;
            player.landTime = gameTime;
            if (impactSpd > 3.5) shakeAmt = Math.min(0.45, shakeAmt + Math.min(0.25, impactSpd * 0.025));
          }
        } else if (player.onGround && player.pos.y > minY + 0.08) {
          // Stepped off a ledge — re-enter airborne state.
          player.onGround = false;
        }

        if (firing) tryFire();
      }

      // Camera follows player
      camera.position.copy(player.pos);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = player.yaw;
      camera.rotation.x = player.pitch;

      // Camera bob — subtle run rhythm on ground, flat while airborne or sliding
      const speedH = Math.hypot(player.vel.x, player.vel.z);
      if (player.onGround && !player.sliding && speedH > 0.8) {
        bobPhase += speedH * 2.6 * dt;
        const amp = Math.min(0.045, speedH * 0.0045);
        camera.position.y += Math.sin(bobPhase) * amp;
        camera.position.x += Math.cos(bobPhase * 0.5) * amp * 0.4;
      }

      // Shake: damage + landing — random jitter, quick decay
      if (shakeAmt > 0.002) {
        camera.position.x += (Math.random() - 0.5) * shakeAmt * 0.12;
        camera.position.y += (Math.random() - 0.5) * shakeAmt * 0.12;
        camera.rotation.z = (Math.random() - 0.5) * shakeAmt * 0.03;
        shakeAmt = Math.max(0, shakeAmt - dt * 2.4);
      } else {
        camera.rotation.z = 0;
      }

      /* ── director ─────────────────────────────────────────── */
      if (isActive) {
        const runElapsed = gameTime - hr.runStart;
        director.step(gdt, runElapsed);

        // Timer
        const timeLeft = Math.max(0, RUN_SECONDS - runElapsed);
        if (timeLeft <= 0) {
          endRun();
        }

        // Combo decay
        if (gameTime - hr.lastKillT > COMBO_DECAY_DELAY && hr.combo > COMBO_MIN) {
          hr.combo = Math.max(COMBO_MIN, hr.combo - COMBO_DECAY_PER_S * gdt);
        }
      }

      /* ── entity behavior ──────────────────────────────────── */
      for (const e of entities) {
        if (e.kind === 'target') {
          e.bob += gdt * 2;
          e.mesh.position.y = e.pos.y + Math.sin(e.bob) * 0.14;
          e.mesh.rotation.y += gdt * 1.1;
        } else if (e.kind === 'drone') {
          e.wobble += gdt;
          const toP = player.pos.clone().sub(e.mesh.position);
          const d = toP.length();
          if (d > 0.1) toP.multiplyScalar(1 / d);
          // Evasion arc — sin-driven lateral offset perpendicular to the
          // approach vector so drones weave instead of drifting in a
          // straight line. Pure scalar math, no raycasts.
          const EVADE_AMP = 1.6;
          const lateral = Math.sin(gameTime * 1.4 + e.wobblePhase) * EVADE_AMP;
          // Perpendicular in XZ plane: rotate (toP.x, toP.z) by 90°
          const perpX = -toP.z;
          const perpZ = toP.x;
          // Retreat-when-close: back-step at half speed for 0.6s when the
          // player gets inside 16 units, so the drone can't be melted at
          // point-blank. Countdown ticks down per-frame.
          if (e.retreatT <= 0 && d < 16) e.retreatT = 0.6;
          if (e.retreatT > 0) e.retreatT -= gdt;
          const advanceSign = e.retreatT > 0 ? -0.5 : 1;
          e.mesh.position.x += (toP.x * 1.8 * advanceSign + perpX * lateral) * gdt;
          e.mesh.position.z += (toP.z * 1.8 * advanceSign + perpZ * lateral) * gdt;
          // Hover slightly higher (4.4 base) to use the new ceiling height.
          e.mesh.position.y = 4.4 + Math.sin(e.wobble * 1.3) * 0.4;
          e.mesh.rotation.y += gdt * 0.8;
          e.pos.copy(e.mesh.position);
          e.fireCd -= gdt;
          if (e.fireCd <= 0 && d < 24 && isActive) {
            e.fireCd = 2.4 + Math.random() * 0.8;
            fireEnemyShot(e.mesh.position.clone(), player.pos.clone());
          }
        } else if (e.kind === 'prowler') {
          const dx = player.pos.x - e.pos.x;
          const dz = player.pos.z - e.pos.z;
          const d = Math.hypot(dx, dz);
          const ang = Math.atan2(dz, dx);
          const move = d > 9 ? 3.0 : d < 4 ? -1.8 : 0;
          const nx = e.pos.x + Math.cos(ang) * move * gdt;
          const nz = e.pos.z + Math.sin(ang) * move * gdt;
          if (!collidesCube(nx, e.pos.z, 0.5)) e.pos.x = nx;
          if (!collidesCube(e.pos.x, nz, 0.5)) e.pos.z = nz;
          e.strafeTick += gdt;
          if (e.strafeTick > 1.3) { e.strafeTick = 0; e.strafe = Math.random() > 0.5 ? 1 : -1; }
          const sx = e.pos.x + Math.cos(ang + Math.PI / 2) * 2.2 * gdt * e.strafe;
          const sz = e.pos.z + Math.sin(ang + Math.PI / 2) * 2.2 * gdt * e.strafe;
          if (!collidesCube(sx, e.pos.z, 0.5)) e.pos.x = sx;
          if (!collidesCube(e.pos.x, sz, 0.5)) e.pos.z = sz;
          e.mesh.position.set(e.pos.x, 1.0, e.pos.z);
          e.mesh.rotation.y = -ang + Math.PI / 2;
          if (e.head) e.head.position.set(e.pos.x, 1.85, e.pos.z);
          e.fireCd -= gdt;
          if (e.fireCd <= 0 && d < 26 && isActive) {
            e.fireCd = 1.6 + Math.random() * 0.6;
            const from = new THREE.Vector3(e.pos.x, 1.4, e.pos.z);
            const to = player.pos.clone();
            fireEnemyShot(from, to);
          }
        }
      }

      /* ── enemy shots ──────────────────────────────────────── */
      for (let i = enemyShots.length - 1; i >= 0; i--) {
        const s = enemyShots[i];
        s.mesh.position.addScaledVector(s.vel, gdt);
        s.life -= gdt;
        const hitWall = collidesCube(s.mesh.position.x, s.mesh.position.z, 0.1) || s.mesh.position.y < 0.05;
        const dp = s.mesh.position.clone().sub(player.pos);
        dp.y += 0.4;
        const hitP = dp.lengthSq() < 0.9 * 0.9;
        if (s.life <= 0 || hitWall || hitP) {
          if (hitP && player.hp > 0) {
            player.hp = Math.max(0, player.hp - 10);
            player.lastHurt = 0;
            sfxHurt();
            shakeAmt = Math.min(0.6, shakeAmt + 0.4);
            setHud((h) => ({ ...h, hurtAt: Date.now() }));
            if (player.hp <= 0) endRun();
          }
          scene.remove(s.mesh);
          enemyShots.splice(i, 1);
        }
      }

      /* ── muzzle flash decay ──────────────────────────────── */
      if (muzzleLife > 0) {
        muzzleLife -= dt;
        // Clamp to [0,1]; on a long frame muzzleLife/0.06 can exceed 1 and
        // make the sphere overshoot fully opaque, producing a pop.
        muzzle.material.opacity = Math.min(1, Math.max(0, muzzleLife / 0.06));
      }

      /* ── tracer fade ──────────────────────────────────────── */
      for (let i = tracers.length - 1; i >= 0; i--) {
        const t = tracers[i];
        t.life -= dt;
        t.mat.opacity = Math.max(0, t.life / 0.12);
        if (t.life <= 0) {
          scene.remove(t.line);
          t.line.geometry.dispose();
          t.mat.dispose();
          tracers.splice(i, 1);
        }
      }

      /* ── particle bursts ─────────────────────────────────── */
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.vel.y -= 8 * dt;
        p.mat.opacity = Math.max(0, p.life / 0.5);
        if (p.life <= 0) {
          scene.remove(p.mesh);
          particles.splice(i, 1);
        }
      }

      /* ── ambient motes — drift on independent sine waves ─── */
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.phase += dt * m.speed;
        m.mesh.position.y = m.baseY + Math.sin(m.phase) * 0.35;
        m.mesh.position.x += m.driftX * dt;
        m.mesh.position.z += m.driftZ * dt;
        // Wrap softly within the arena so motes never escape into walls.
        const lim = ARENA_HALF - 2;
        if (m.mesh.position.x >  lim) m.mesh.position.x = -lim;
        if (m.mesh.position.x < -lim) m.mesh.position.x =  lim;
        if (m.mesh.position.z >  lim) m.mesh.position.z = -lim;
        if (m.mesh.position.z < -lim) m.mesh.position.z =  lim;
      }

      renderer.render(scene, camera);

      /* ── HUD batch (10 Hz) ─────────────────────────────────── */
      hudTick += dt;
      if (hudTick > 0.1) {
        hudTick = 0;
        const runElapsed = gameTime - hr.runStart;
        setHud((h) => {
          if (h.status === 'ended') return h;
          return {
            ...h,
            status: hr.status,
            timeLeft: hr.status === 'playing' ? Math.max(0, RUN_SECONDS - runElapsed) : h.timeLeft,
            score: hr.score,
            combo: Math.round(hr.combo * 100) / 100,
            hp: Math.round(player.hp),
            weapon: player.weapon,
            ammo: player.ammo[player.weapon],
            reloading: player.reloadIn > 0,
            kills: hr.kills,
            hsCount: hr.hsCount,
            dashReady: player.dashReady,
          };
        });
      }
    };
    loop();

    // Expose startRun to JSX (end-screen button / ready-screen button)
    startRunRef.current = startRun;

    /* ── cleanup ──────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerlockchange', onLock);
      document.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock?.();
      clearTimeout(reticleFlashTimer);
      // Flush every popup / killfeed / scale-pop / punch timeout so callbacks
      // don't fire against a torn-down mount and leak DOM nodes (or throw).
      for (const id of pendingTimeouts) clearTimeout(id);
      pendingTimeouts.clear();
      renderer.dispose();
      tracerGeo.dispose();
      particleGeo.dispose();
      enemyShotGeo.dispose();
      moteGeo.dispose();
      moteMat.dispose();
      if (audio && audio.state !== 'closed') audio.close?.();
      mount.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, '0')}`;
  };

  const tier = hud.combo >= 2.5 ? 3 : hud.combo >= 1.7 ? 2 : 1;

  return (
    <div className="slipshot">
      <div className="slipshot-mount" ref={mountRef}>
        {/* Damage vignette — re-keyed on each hurt so the animation restarts */}
        {hud.hurtAt && <div key={hud.hurtAt} className="slipshot-damage"/>}
        {/* Top-center HUD cluster */}
        {hud.status !== 'ready' && (
          <div className="slipshot-hud-top">
            <div className="slipshot-timer">{fmt(hud.timeLeft)}</div>
            <div className={`slipshot-combo tier-${tier}`}>
              <span className="slipshot-combo-x">×</span>
              <span className="slipshot-combo-v">{hud.combo.toFixed(2)}</span>
            </div>
            <div className="slipshot-score">{hud.score.toLocaleString()}</div>
          </div>
        )}

        {/* Bottom-left: weapon / ammo / hp */}
        {hud.status !== 'ready' && (
          <div className="slipshot-hud-bl">
            <div className="slipshot-weapon">
              <span className={hud.weapon === 'pulse' ? 'is-active' : ''}>1 · Pulse</span>
              <span className={hud.weapon === 'slug' ? 'is-active' : ''}>2 · Slug</span>
            </div>
            <div className="slipshot-ammo">
              {hud.reloading ? <span className="slipshot-reloading">reloading…</span> :
                <><b>{hud.ammo}</b> / {WEAPONS[hud.weapon].mag}</>}
            </div>
            <div className="slipshot-hp">
              <div className="slipshot-hp-bar" style={{ width: `${hud.hp}%` }}/>
              <span>{hud.hp}</span>
            </div>
          </div>
        )}

        {/* Bottom-right: dash LED */}
        {hud.status !== 'ready' && (
          <div className="slipshot-hud-br">
            <div className={`slipshot-dash ${hud.dashReady ? 'is-ready' : ''}`}>
              <span className="slipshot-dash-dot"/> DASH
            </div>
          </div>
        )}

        {/* Ready overlay */}
        {hud.status === 'ready' && (
          <div className="slipshot-overlay">
            <div className="slipshot-eyebrow">Pulse Range · Sector 7</div>
            <div className="slipshot-title">Click to start a run</div>
            <div className="slipshot-sub">
              <b>WASD</b> move · <b>Mouse</b> aim · <b>Shift</b> slide (ground) / airdash (air)
              · <b>Space</b> jump · <b>LMB</b> fire · <b>1 / 2 / Q</b> swap · <b>R</b> reload
            </div>
            <div className="slipshot-sub" style={{ marginTop: 8, opacity: 0.85 }}>
              180 seconds. Chain <b>slide → jump → airdash</b> to keep the combo climbing.
            </div>
          </div>
        )}

        {/* End overlay */}
        {hud.status === 'ended' && (
          <div className="slipshot-overlay slipshot-end">
            <div className="slipshot-eyebrow">Run complete</div>
            {hud.medal && (
              <div className={`slipshot-medal medal-${hud.medal}`}>{hud.medal}</div>
            )}
            {!hud.medal && <div className="slipshot-medal medal-none">keep going</div>}
            <div className="slipshot-final-score">
              {hud.score.toLocaleString()}
              {hud.newPb && <span className="slipshot-pb-chip">NEW PB</span>}
            </div>
            <div className="slipshot-breakdown">
              <div><b>{hud.kills}</b> kills</div>
              <div><b>{hud.hsCount}</b> headshots</div>
              <div><b>×{hud.comboMax.toFixed(2)}</b> peak combo</div>
              <div>
                <b>{hud.shotsFired === 0 ? 0 : Math.round((hud.shotsHit / hud.shotsFired) * 100)}%</b> accuracy
              </div>
            </div>
            <div className="slipshot-end-thresholds">
              <span className={hud.score >= MEDAL_BRONZE ? 'hit' : ''}>Bronze {MEDAL_BRONZE.toLocaleString()}</span>
              <span className={hud.score >= MEDAL_SILVER ? 'hit' : ''}>Silver {MEDAL_SILVER.toLocaleString()}</span>
              <span className={hud.score >= MEDAL_GOLD ? 'hit' : ''}>Gold {MEDAL_GOLD.toLocaleString()}</span>
            </div>
            <button
              type="button"
              className="slipshot-btn"
              onClick={() => startRunRef.current?.()}
            >
              Run again
            </button>
            <div className="slipshot-sub" style={{ marginTop: 4, opacity: 0.7 }}>
              or press <b>R</b> · click the arena to re-lock aim
            </div>
          </div>
        )}

        {/* Pointer-lock lost nudge */}
        {hud.status === 'playing' && !hud.locked && (
          <div className="slipshot-overlay slipshot-paused">
            <div className="slipshot-title">Click to resume</div>
          </div>
        )}
      </div>

      {/* Bottom hint (platform harmony) */}
      <div className="slipshot-hint">
        Slide → Jump preserves speed · Airdash in the air · Kills in the air refund the dash · Bronze {MEDAL_BRONZE.toLocaleString()} · Silver {MEDAL_SILVER.toLocaleString()} · Gold {MEDAL_GOLD.toLocaleString()}
      </div>
    </div>
  );
}
