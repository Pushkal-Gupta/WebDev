import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { submitScore } from '../../scoreBus.js';
import { isMuted as platformIsMuted, subscribeMute } from '../../sound.js';
import { consumeAdminStartLevel } from '../../utils/admin.js';

// Swingwire — an original one-button rope-swing action platformer.
//
// 3D rewrite. The gameplay is unchanged: the entire simulation (physics,
// controls, anchors, hazards, checkpoints, scoring, sfx) is byte-for-byte
// the same as the 2D version. Only the *presentation* moved to Three.js.
//
// 2.5D mapping: the sim runs on the same (x, y) plane it always did. We
// render it on the z = 0 plane of a real perspective scene with
//   worldX → +X,  worldY → −Y  (sim y grows downward; three's +Y is up)
// and a perspective camera looking down the −Z axis. Because the physics
// never touches z, every number — gravity, rope length, AABB collisions,
// camera lead — keeps its exact 2D meaning. The depth, lighting, shadows
// and parallax towers are pure decoration layered behind the play plane.
//
// Core fantasy: you are a bolt of kinetic silhouette moving across a dark
// neon skyline. One input. Hold to fire a wire at the nearest anchor above
// you; release to let gravity take over. Your life is the momentum you
// managed to build and time.

// ──────────────────────────────────────────────────────────────────────────
// Constants — IDENTICAL to the 2D version. Do not retune; the physics and
// scoring contract depend on these exact numbers.
// ──────────────────────────────────────────────────────────────────────────
const W = 1120;
const H = 640;
const MAX_W = 1600;
const MAX_H = 900;
const STEP = 1 / 60;
const GRAVITY = 820;
const MAX_SPEED = 980;
const RESPAWN_DELAY = 0.42;
const INVULN_ON_RESPAWN = 0.22;
const P_R = 9;                         // player body radius
const WIRE_RANGE = 320;                // max attach distance
const WIRE_MIN = 32;                   // min attach distance (avoid hugging nodes)
const WIRE_ATTACH_CONE_DEG = 150;      // prefer anchors above / ahead
const CAMERA_SMOOTH = 7.5;
const CAMERA_LEAD_X = 140;
const CAMERA_LEAD_Y = 70;
const SLOWMO_TIME = 0.18;
const SLOWMO_SCALE = 0.22;

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const aabb = (ax, ay, aw, ah, bx, by, bw, bh) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
const pick = (a) => a[(Math.random() * a.length) | 0];

// ──────────────────────────────────────────────────────────────────────────
// Palette — industrial night, neon accents (shared by 3D materials + DOM HUD)
// ──────────────────────────────────────────────────────────────────────────
const PAL = {
  skyTop:    '#0a1323',
  skyMid:    '#131f32',
  skyBottom: '#0d1626',
  farBuildings:  '#13253b',
  midBuildings:  '#0a1422',
  nearBuildings: '#050a13',
  windowCool:  '#6ac7ff',
  windowWarm:  '#ffb547',
  anchorIdle:  '#3a5a88',
  anchorReady: '#ffb547',
  anchorActive:'#ff4a6a',
  wire:        '#ff4a6a',
  wireSpark:   '#ffe6c4',
  player:      '#ffe6c4',
  hazard:      '#ff2e4e',
  goal:        '#6ffcf2',
  fog:         '#0b1424',
};

// ──────────────────────────────────────────────────────────────────────────
// Epitaphs — one-liners pool per failure mode. Short. Dry.
// ──────────────────────────────────────────────────────────────────────────
const EPITAPHS = {
  wall: [
    'Masonry won.',
    'Hard, in that order.',
    'Architecture has opinions.',
    'A wall remembered where it was.',
    'Cornered, briefly.',
  ],
  ground: [
    'Concrete, eventually.',
    'Terminal velocity.',
    'You found the floor.',
    'Gravity, as advertised.',
    'The city broke the fall.',
  ],
  hazard: [
    'Industrial exposure.',
    'Warning: accurate.',
    'A hazard earned its name.',
    'Short circuit.',
    'That was a no.',
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// Course data — IDENTICAL to the 2D version. The (x, y) layout is the
// gameplay plane; the 3D renderer maps it onto z = 0.
// ──────────────────────────────────────────────────────────────────────────
const COURSES = [
  // ── 1. NIGHT SHIFT — tutorial ──────────────────────────────────────────
  {
    id: 'nightshift',
    title: 'Night Shift',
    tip: 'Hold SPACE / click / tap to fire a wire. Release to detach.',
    world: { w: 3200, h: 900 },
    spawn: { x: 70, y: 640 },
    goal: { x: 3090, y: 420, w: 50, h: 90 },
    anchors: [
      { x: 240, y: 320 }, { x: 420, y: 260 }, { x: 600, y: 300 },
      { x: 820, y: 240 }, { x: 1020, y: 290 }, { x: 1220, y: 250 },
      { x: 1440, y: 310 }, { x: 1660, y: 250 }, { x: 1860, y: 300 },
      { x: 2080, y: 240 }, { x: 2280, y: 290 }, { x: 2500, y: 260 },
      { x: 2720, y: 320 }, { x: 2920, y: 340 }, { x: 3040, y: 380 },
    ],
    walls: [
      // Ground (full width)
      { x: 0, y: 800, w: 3200, h: 100 },
      // A couple of short chimneys / billboards to weave around
      { x: 1300, y: 640, w: 30, h: 160 },
      { x: 2120, y: 580, w: 32, h: 220 },
    ],
    hazards: [],
    props: [
      { kind: 'billboard', x: 1300, y: 640, w: 30, h: 160, text: 'SHIFT' },
      { kind: 'antenna', x: 2120, y: 580, h: 60 },
      { kind: 'moon', x: 720, y: 120, r: 48 },
    ],
    checkpoints: [{ x: 1600, y: 500 }],
  },

  // ── 2. FLUX — moving hazards, tighter gaps ─────────────────────────────
  {
    id: 'flux',
    title: 'Flux',
    tip: 'Release at the top of the arc for distance. Low arcs die.',
    world: { w: 3800, h: 900 },
    spawn: { x: 70, y: 600 },
    goal: { x: 3700, y: 360, w: 50, h: 90 },
    anchors: [
      { x: 220, y: 320 }, { x: 440, y: 230 }, { x: 660, y: 300 },
      { x: 880, y: 200 }, { x: 1120, y: 270 }, { x: 1360, y: 210 },
      { x: 1620, y: 290 }, { x: 1880, y: 210 }, { x: 2120, y: 300 },
      { x: 2400, y: 230 }, { x: 2660, y: 290 }, { x: 2920, y: 220 },
      { x: 3180, y: 300 }, { x: 3420, y: 280 }, { x: 3620, y: 340 },
    ],
    walls: [
      { x: 0, y: 800, w: 3800, h: 100 },
      { x: 1200, y: 700, w: 42, h: 100 },  // short pillar
      { x: 2320, y: 600, w: 42, h: 200 },  // taller pillar
      { x: 3020, y: 640, w: 42, h: 160 },
    ],
    hazards: [
      // Laser band: horizontal, pulses lethal in the middle of its cycle
      { type: 'laser', x: 1580, y: 500, w: 200, h: 4, cycle: 2.4, phase: 0.0 },
      { type: 'laser', x: 2780, y: 480, w: 220, h: 4, cycle: 2.2, phase: 0.7 },
      // Static spike strip on top of one pillar
      { type: 'spikes', x: 2320, y: 596, w: 42 },
    ],
    props: [
      { kind: 'billboard', x: 1200, y: 700, w: 42, h: 100, text: 'FLUX' },
      { kind: 'antenna', x: 2320, y: 600, h: 90 },
      { kind: 'antenna', x: 3020, y: 640, h: 70 },
      { kind: 'moon', x: 1500, y: 110, r: 40 },
    ],
    checkpoints: [{ x: 1300, y: 480 }, { x: 2600, y: 400 }],
  },

  // ── 3. LAST CALL — finale, rapid chain with hazard gauntlet ───────────
  {
    id: 'lastcall',
    title: 'Last Call',
    tip: 'Chain your releases. The skyline ends soon.',
    world: { w: 4400, h: 900 },
    spawn: { x: 70, y: 560 },
    goal: { x: 4310, y: 320, w: 50, h: 100 },
    anchors: [
      { x: 210, y: 300 }, { x: 400, y: 210 }, { x: 580, y: 270 },
      { x: 760, y: 200 }, { x: 940, y: 260 }, { x: 1140, y: 190 },
      { x: 1340, y: 250 }, { x: 1540, y: 210 }, { x: 1740, y: 280 },
      { x: 1960, y: 200 }, { x: 2180, y: 270 }, { x: 2380, y: 200 },
      { x: 2580, y: 270 }, { x: 2780, y: 210 }, { x: 3000, y: 280 },
      { x: 3220, y: 220 }, { x: 3440, y: 280 }, { x: 3660, y: 220 },
      { x: 3880, y: 260 }, { x: 4100, y: 280 }, { x: 4270, y: 310 },
    ],
    walls: [
      { x: 0, y: 800, w: 4400, h: 100 },
      // A gauntlet of narrow pillars
      { x: 1680, y: 560, w: 40, h: 240 },
      { x: 2240, y: 520, w: 40, h: 280 },
      { x: 2820, y: 600, w: 40, h: 200 },
      { x: 3380, y: 540, w: 40, h: 260 },
      { x: 3960, y: 620, w: 40, h: 180 },
    ],
    hazards: [
      { type: 'laser', x: 1420, y: 470, w: 240, h: 4, cycle: 1.8, phase: 0.0 },
      { type: 'laser', x: 2100, y: 430, w: 260, h: 4, cycle: 1.6, phase: 0.4 },
      { type: 'laser', x: 2880, y: 470, w: 260, h: 4, cycle: 1.4, phase: 0.2 },
      { type: 'laser', x: 3600, y: 430, w: 260, h: 4, cycle: 1.2, phase: 0.6 },
      { type: 'spikes', x: 1680, y: 556, w: 40 },
      { type: 'spikes', x: 2240, y: 516, w: 40 },
      { type: 'spikes', x: 2820, y: 596, w: 40 },
      { type: 'spikes', x: 3380, y: 536, w: 40 },
      { type: 'spikes', x: 3960, y: 616, w: 40 },
    ],
    props: [
      { kind: 'billboard', x: 1680, y: 560, w: 40, h: 140, text: 'LAST' },
      { kind: 'billboard', x: 3380, y: 540, w: 40, h: 160, text: 'CALL' },
      { kind: 'antenna', x: 2240, y: 520, h: 80 },
      { kind: 'antenna', x: 3960, y: 620, h: 60 },
      { kind: 'moon', x: 2400, y: 90, r: 54 },
    ],
    checkpoints: [{ x: 1300, y: 400 }, { x: 2600, y: 380 }, { x: 3800, y: 360 }],
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Audio — procedural cues only. UNCHANGED from the 2D version. Self-mutes
// via the platform mute bus; every cue fires at the same gameplay event.
// ──────────────────────────────────────────────────────────────────────────
function makeAudio() {
  let ctx = null;
  let muted = platformIsMuted();
  let master = null;
  let droneNodes = null;
  const ensure = () => {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.6;
        master.connect(ctx.destination);
      } catch { muted = true; }
    }
    if (ctx?.state === 'suspended') ctx.resume();
  };
  const tone = (freq, dur = 0.08, type = 'sine', gain = 0.1) => {
    ensure(); if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  };
  const sweep = (f1, f2, dur, type = 'triangle', gain = 0.1) => {
    ensure(); if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  };
  const noise = (dur = 0.06, gain = 0.08, lowpass = 900) => {
    ensure(); if (!ctx || muted) return;
    const t = ctx.currentTime;
    const len = Math.max(1, (ctx.sampleRate * dur) | 0);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(), g = ctx.createGain();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass;
    src.buffer = buf; g.gain.value = gain;
    src.connect(f).connect(g).connect(master);
    src.start(t); src.stop(t + dur);
  };
  const startDrone = () => {
    ensure(); if (!ctx || muted || droneNodes) return;
    const t = ctx.currentTime;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 58;
    const o2 = ctx.createOscillator(); o2.type = 'sine';     o2.frequency.value = 87;
    const o3 = ctx.createOscillator(); o3.type = 'sine';     o3.frequency.value = 116;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    filter.Q.value = 3;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 140;
    lfo.connect(lfoGain).connect(filter.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.026, t + 1.8);
    o1.connect(filter); o2.connect(filter); o3.connect(filter);
    filter.connect(g).connect(master);
    o1.start(t); o2.start(t); o3.start(t); lfo.start(t);
    droneNodes = { o1, o2, o3, lfo, g };
  };
  const stopDrone = () => {
    if (!droneNodes || !ctx) { droneNodes = null; return; }
    const t = ctx.currentTime;
    const n = droneNodes;
    try {
      n.g.gain.cancelScheduledValues(t);
      n.g.gain.setValueAtTime(n.g.gain.value, t);
      n.g.gain.linearRampToValueAtTime(0, t + 0.5);
      n.o1.stop(t + 0.6); n.o2.stop(t + 0.6); n.o3.stop(t + 0.6); n.lfo.stop(t + 0.6);
    } catch {}
    droneNodes = null;
  };
  // Track whether a drone is currently desired so we can re-start it after
  // an unmute. Mute pulls the gain to zero through stopDrone(); unmute
  // restarts a fresh drone.
  let droneWanted = false;
  const startDroneTracked = () => { droneWanted = true; startDrone(); };
  const muteUnsub = subscribeMute((m) => {
    muted = m;
    if (m) {
      stopDrone();
    } else if (droneWanted) {
      // unmute — bring the drone back
      startDrone();
    }
  });
  return {
    setMuted: (m) => { muted = m; if (m) stopDrone(); else if (droneWanted) startDrone(); },
    cleanup: () => { try { muteUnsub(); } catch {} stopDrone(); droneWanted = false; },
    startDrone: startDroneTracked,
    stopDrone: () => { droneWanted = false; stopDrone(); },
    attach:     () => { sweep(420, 780, 0.12, 'triangle', 0.08); },
    release:    () => { tone(1100, 0.04, 'triangle', 0.05); },
    swingHum:   () => { tone(280, 0.04, 'sine', 0.03); },
    splat:      () => { noise(0.14, 0.12, 500); sweep(220, 60, 0.3, 'sawtooth', 0.1); },
    checkpoint: () => { tone(600, 0.12, 'triangle', 0.08); setTimeout(() => tone(900, 0.16, 'triangle', 0.08), 70); },
    finish:     () => {
      tone(660, 0.16, 'triangle', 0.1);
      setTimeout(() => tone(880, 0.16, 'triangle', 0.1), 90);
      setTimeout(() => tone(1100, 0.22, 'triangle', 0.12), 180);
      setTimeout(() => tone(1320, 0.4,  'triangle', 0.12), 300);
    },
    click:      () => tone(1600, 0.02, 'square', 0.05),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Course-state factory — UNCHANGED simulation state. (The 2D-only `stars`,
// `rainDrops`, `shake`, `flash`, `zoom` fields are dropped; the 3D renderer
// expresses those as camera/material effects instead.)
// ──────────────────────────────────────────────────────────────────────────
function buildCourseState(def) {
  return {
    def,
    anchors: def.anchors.map((a) => ({ ...a, litT: 0 })),
    walls:   def.walls.map((w) => ({ ...w })),
    hazards: def.hazards.map((h) => ({ ...h, t: 0 })),
    checkpoints: def.checkpoints.map((c) => ({ ...c, reached: false })),
    lastCheckpoint: null,
    player: makePlayer(def.spawn),
    wire: null,   // { ax, ay, length } when attached
    particles: [],
    cam: { x: 0, y: 0, kickX: 0, kickY: 0 },
    status: 'playing', tStatus: 0,
    epitaph: null, deathKind: null,
    shake: 0, slowmo: 0,
    enteredAt: performance.now(),
    trail: [],
    fx: [],       // 3D render event queue (attach/release/finish bursts)
  };
}

function makePlayer(spawn) {
  return {
    x: spawn.x, y: spawn.y, vx: 0, vy: 0,
    invuln: INVULN_ON_RESPAWN,
    angle: 0,
    stopped: true,
    splat: null,  // set on death for render
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 2.5D plane mapping. Sim (x, y) → three world (x, -y, z). Sim y grows
// downward (screen coords); three +Y is up, so we negate. Everything the
// physics computes stays in sim space; only the renderer applies this.
// ──────────────────────────────────────────────────────────────────────────
const SY = -1;                  // sim-y → world-y sign flip
const w2x = (x) => x;           // world x == sim x
const w2y = (y) => y * SY;      // world y == -sim y

// ──────────────────────────────────────────────────────────────────────────
// Three.js renderer. Builds a scene once per course (rebuildLevel), then
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
  renderer.toneMappingExposure = 1.45;            // bright, per the brief
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PAL.fog, 900, 2600);

  // Perspective camera looking down −Z at the z=0 play plane. A modest FOV
  // keeps the orthographic-ish read of a side-scroller while still giving
  // real depth to the towers behind.
  const camera = new THREE.PerspectiveCamera(42, 1, 1, 8000);
  camera.position.set(0, 0, 1100);
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
        float h = clamp((normalize(vWorld).y + 0.4) * 0.8, 0.0, 1.0);
        vec3 col = mix(uBot, uMid, smoothstep(0.0, 0.5, h));
        col = mix(col, uTop, smoothstep(0.5, 1.0, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 24, 16), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  // ── Lights. Key light on the CAMERA side (+Z) per wiki gotcha #1, so the
  // player and tower faces we actually see are lit, not silhouetted.
  const key = new THREE.DirectionalLight(0xfff0d8, 1.35);
  key.position.set(-300, 500, 900);     // camera-side, upper-left
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 3000;
  key.shadow.camera.left = -1100;
  key.shadow.camera.right = 1100;
  key.shadow.camera.top = 900;
  key.shadow.camera.bottom = -900;
  key.shadow.bias = -0.0006;
  scene.add(key);
  scene.add(key.target);

  const hemi = new THREE.HemisphereLight(0x8fb6ff, 0x0a0f1a, 0.55);
  scene.add(hemi);

  const fill = new THREE.DirectionalLight(0x4a6cff, 0.4);
  fill.position.set(400, 200, 700);     // cool rim from the other camera-side
  scene.add(fill);

  // ── Level container — rebuilt per course. Holds towers, ground, anchors,
  // hazards, checkpoints, goal, props. The player rig, wire and particle
  // pool live in persistent groups so they survive course swaps.
  let levelGroup = new THREE.Group();
  scene.add(levelGroup);

  // Anchor visual records, addressable by sim anchor object identity.
  const anchorRecs = new Map();   // anchorObj -> { core, halo }
  const hazardRecs = [];          // { def, mesh|meshes, kind }
  const checkpointRecs = [];      // { def, ring, dot }
  let goalRec = null;
  let groundMesh = null;

  // ── Player rig — an orb with an accent fin/scarf, casts a shadow.
  const playerGroup = new THREE.Group();
  const orbMat = new THREE.MeshStandardMaterial({
    color: PAL.player, emissive: new THREE.Color(PAL.player),
    emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.1,
  });
  const orbMesh = new THREE.Mesh(new THREE.SphereGeometry(P_R, 24, 18), orbMat);
  orbMesh.castShadow = true;
  playerGroup.add(orbMesh);
  // Glowing core
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
  const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(P_R * 0.4, 12, 10), coreMat);
  coreMesh.position.set(-2, 2, P_R * 0.6);
  playerGroup.add(coreMesh);
  // Accent scarf/fin — a flattened cone that points opposite to motion.
  const scarfMat = new THREE.MeshStandardMaterial({
    color: PAL.hazard, emissive: new THREE.Color(PAL.hazard),
    emissiveIntensity: 0.5, roughness: 0.5,
  });
  const scarfMesh = new THREE.Mesh(new THREE.ConeGeometry(P_R * 0.7, P_R * 2.6, 10), scarfMat);
  scarfMesh.castShadow = true;
  const scarfPivot = new THREE.Group();          // rotated to face motion
  scarfMesh.position.set(0, -(P_R + P_R * 1.3), 0);
  scarfPivot.add(scarfMesh);
  playerGroup.add(scarfPivot);
  scene.add(playerGroup);

  // ── Wire — a thin emissive tube rebuilt each frame between player+anchor.
  const wireMat = new THREE.MeshBasicMaterial({ color: PAL.wire });
  const wireMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1, 6, 1), wireMat);
  wireMesh.visible = false;
  scene.add(wireMesh);

  // ── Motion trail — a pool of fading quads behind the player.
  const TRAIL_N = 18;
  const trailMat = new THREE.MeshBasicMaterial({
    color: PAL.hazard, transparent: true, opacity: 0.5, depthWrite: false,
  });
  const trailGeo = new THREE.SphereGeometry(1, 8, 6);
  const trailMesh = new THREE.InstancedMesh(trailGeo, trailMat, TRAIL_N);
  trailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  trailMesh.frustumCulled = false;
  scene.add(trailMesh);

  // ── Particle pool — instanced cubes. Drawn from the sim's particle list +
  // local fx bursts. A fixed pool, no per-frame allocation.
  const PART_N = 256;
  const partMat = new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, vertexColors: true,
  });
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
  const _up = new THREE.Vector3(0, 1, 0);
  const _c = new THREE.Color();
  const _dir = new THREE.Vector3();

  // ── Procedural window texture for towers — one shared CanvasTexture.
  function makeWindowTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#070d18';
    g.fillRect(0, 0, 64, 128);
    for (let y = 6; y < 128; y += 12) {
      for (let x = 6; x < 64; x += 12) {
        const r = ((x * 31 + y * 17) % 7);
        if (r < 3) {
          g.fillStyle = r < 1 ? PAL.windowWarm : PAL.windowCool;
          g.globalAlpha = 0.45 + (r * 0.12);
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

  // Materials created in rebuildLevel are tracked for disposal.
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
    anchorRecs.clear();
    hazardRecs.length = 0;
    checkpointRecs.length = 0;
    goalRec = null;
    groundMesh = null;
    levelGroup = new THREE.Group();
    scene.add(levelGroup);
  }

  // Build all static + lit-state geometry for a course.
  function rebuildLevel(state) {
    clearLevel();
    camPrimed = false;        // snap the camera onto the new level next frame
    const def = state.def;
    const worldW = def.world.w;
    const worldH = def.world.h;

    // ── Ground slab — long box along the lane at the world floor.
    {
      const groundTop = worldH - 100;      // matches the ground wall's y
      const geo = new THREE.BoxGeometry(worldW + 1200, 220, 700);
      const mat = new THREE.MeshStandardMaterial({
        color: PAL.nearBuildings, roughness: 0.95, metalness: 0.0,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(worldW / 2, w2y(groundTop) - 110, -40);
      m.receiveShadow = true;
      levelGroup.add(m);
      track(m);
      groundMesh = m;
      // A subtle emissive ridge line on the front face
      const ridgeGeo = new THREE.BoxGeometry(worldW + 1200, 4, 4);
      const ridgeMat = new THREE.MeshBasicMaterial({ color: 0x16314d });
      const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
      ridge.position.set(worldW / 2, w2y(groundTop), 22);
      levelGroup.add(ridge);
      track(ridge);
    }

    // ── Background tower rows — three parallax depths, procedural. These are
    // pure decoration behind the play plane (negative z), so they never
    // intersect the physics. Heights derived from a stable hash.
    const towerDefs = [
      { z: -1400, step: 360, wMin: 180, wMax: 260, hMin: 600, hMax: 1300, tint: PAL.farBuildings, lit: false },
      { z: -800,  step: 300, wMin: 150, wMax: 220, hMin: 500, hMax: 1100, tint: '#0e1c2e', lit: true },
      { z: -360,  step: 260, wMin: 120, wMax: 180, hMin: 400, hMax: 900,  tint: PAL.midBuildings, lit: true },
    ];
    const groundY = w2y(worldH - 100);
    for (const row of towerDefs) {
      const mat = new THREE.MeshStandardMaterial({
        color: row.tint, roughness: 0.9, metalness: 0.05,
        map: row.lit ? windowTex : null,
        emissive: row.lit ? new THREE.Color(0x1a2c44) : new THREE.Color(0x000000),
        emissiveMap: row.lit ? windowTex : null,
        emissiveIntensity: row.lit ? 0.8 : 0,
      });
      levelMats.push(mat);
      const count = Math.ceil((worldW + 1400) / row.step) + 2;
      const geo = new THREE.BoxGeometry(1, 1, 1);
      levelGeos.push(geo);
      const inst = new THREE.InstancedMesh(geo, mat, count);
      inst.castShadow = false;
      inst.receiveShadow = false;
      for (let i = 0; i < count; i++) {
        const bx = -400 + i * row.step;
        const seed = hash2(i * 1.3 + row.z * 0.01, row.z);
        const bw = row.wMin + seed * (row.wMax - row.wMin);
        const bh = row.hMin + hash2(row.z, i * 2.1) * (row.hMax - row.hMin);
        _p.set(bx, groundY + bh / 2, row.z);
        _q.identity();
        _s.set(bw, bh, bw * 0.8);
        _m.compose(_p, _q, _s);
        inst.setMatrixAt(i, _m);
        if (row.lit) {
          mat.map.repeat.set(1, 1);   // shared; per-tile not needed visually
        }
      }
      inst.instanceMatrix.needsUpdate = true;
      levelGroup.add(inst);
    }

    // ── Walls / pillars — solid, lethal in the sim. Render as dark slabs on
    // the play plane (z=0) so they read as foreground obstacles.
    for (const w of state.walls) {
      const isGround = w.y >= worldH - 120 && w.w >= worldW - 100;
      if (isGround) continue;     // ground handled above as a slab
      const geo = new THREE.BoxGeometry(w.w, w.h, Math.max(60, w.w * 1.4));
      const mat = new THREE.MeshStandardMaterial({
        color: '#0b1726', roughness: 0.85, metalness: 0.1,
        emissive: new THREE.Color(0x0a1828), emissiveIntensity: 0.4,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(w.x + w.w / 2, w2y(w.y + w.h / 2), 0);
      m.castShadow = true;
      m.receiveShadow = true;
      levelGroup.add(m);
      track(m);
    }

    // ── Props — billboards (emissive strip), antennae, moon disc.
    for (const pr of (def.props || [])) {
      if (pr.kind === 'billboard') {
        const geo = new THREE.PlaneGeometry(pr.w + 4, pr.h * 0.7);
        const mat = new THREE.MeshBasicMaterial({
          color: PAL.windowWarm, transparent: true, opacity: 0.55,
        });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(pr.x + pr.w / 2, w2y(pr.y + pr.h / 2), Math.max(40, pr.w));
        levelGroup.add(m);
        track(m);
      } else if (pr.kind === 'antenna') {
        const geo = new THREE.CylinderGeometry(1.4, 1.4, pr.h, 6);
        const mat = new THREE.MeshStandardMaterial({ color: '#1a2838', roughness: 0.7 });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(pr.x, w2y(pr.y) + pr.h / 2, 0);
        levelGroup.add(m);
        track(m);
        const tipGeo = new THREE.SphereGeometry(3, 8, 6);
        const tipMat = new THREE.MeshBasicMaterial({ color: PAL.hazard });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(pr.x, w2y(pr.y) + pr.h, 0);
        levelGroup.add(tip);
        track(tip);
      } else if (pr.kind === 'moon') {
        const geo = new THREE.CircleGeometry(pr.r, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0xfff0dc });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(pr.x, w2y(pr.y), -2200);
        levelGroup.add(m);
        track(m);
      }
    }

    // ── Anchors — visible 3D nodes (sphere + halo ring).
    for (const a of state.anchors) {
      const coreGeo = new THREE.SphereGeometry(5, 12, 10);
      const coreMatA = new THREE.MeshStandardMaterial({
        color: PAL.anchorIdle, emissive: new THREE.Color(PAL.anchorReady),
        emissiveIntensity: 0.6, roughness: 0.4,
      });
      const core = new THREE.Mesh(coreGeo, coreMatA);
      core.position.set(a.x, w2y(a.y), 0);
      core.castShadow = true;
      levelGroup.add(core);
      track(core);

      const haloGeo = new THREE.RingGeometry(9, 13, 20);
      const haloMat = new THREE.MeshBasicMaterial({
        color: PAL.anchorIdle, transparent: true, opacity: 0.4,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(a.x, w2y(a.y), 0);
      levelGroup.add(halo);
      track(halo);

      anchorRecs.set(a, { core, coreMat: coreMatA, halo, haloMat });
    }

    // ── Hazards — lasers (glowing bars) + spikes (tetra rows).
    for (const h of state.hazards) {
      if (h.type === 'laser') {
        const geo = new THREE.BoxGeometry(h.w, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: PAL.hazard, transparent: true, opacity: 0.3 });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(h.x + h.w / 2, w2y(h.y), 0);
        levelGroup.add(m);
        track(m);
        hazardRecs.push({ def: h, mesh: m, mat, kind: 'laser' });
      } else if (h.type === 'spikes') {
        const count = Math.max(3, Math.floor(h.w / 8));
        const step = h.w / count;
        const geo = new THREE.ConeGeometry(step * 0.45, 18, 4);
        const mat = new THREE.MeshStandardMaterial({
          color: '#cfd6df', emissive: new THREE.Color(0x223040), emissiveIntensity: 0.3,
          roughness: 0.5, metalness: 0.3,
        });
        const inst = new THREE.InstancedMesh(geo, mat, count);
        inst.castShadow = true;
        for (let i = 0; i < count; i++) {
          _p.set(h.x + i * step + step / 2, w2y(h.y) + 9, 0);
          _q.identity();
          _s.set(1, 1, 1);
          _m.compose(_p, _q, _s);
          inst.setMatrixAt(i, _m);
        }
        inst.instanceMatrix.needsUpdate = true;
        levelGroup.add(inst);
        levelGeos.push(geo); levelMats.push(mat);
        hazardRecs.push({ def: h, mesh: inst, mat, kind: 'spikes' });
      }
    }

    // ── Checkpoints — emissive torus gates.
    for (const c of state.checkpoints) {
      const geo = new THREE.TorusGeometry(24, 2.2, 8, 28);
      const mat = new THREE.MeshBasicMaterial({
        color: PAL.wireSpark, transparent: true, opacity: 0.5,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.set(c.x, w2y(c.y), 0);
      levelGroup.add(ring);
      track(ring);
      checkpointRecs.push({ def: c, ring, mat });
    }

    // ── Goal — a glowing portal frame.
    {
      const g = def.goal;
      const geo = new THREE.BoxGeometry(g.w, g.h, 14);
      const mat = new THREE.MeshStandardMaterial({
        color: PAL.goal, emissive: new THREE.Color(PAL.goal),
        emissiveIntensity: 1.1, transparent: true, opacity: 0.8,
        roughness: 0.3,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(g.x + g.w / 2, w2y(g.y + g.h / 2), 0);
      levelGroup.add(m);
      track(m);
      // Outer glow shell
      const glowGeo = new THREE.BoxGeometry(g.w + 18, g.h + 18, 4);
      const glowMat = new THREE.MeshBasicMaterial({
        color: PAL.goal, transparent: true, opacity: 0.18, depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(g.x + g.w / 2, w2y(g.y + g.h / 2), -6);
      levelGroup.add(glow);
      track(glow);
      goalRec = { mesh: m, mat, glow };
    }
  }

  // ── Resize — manual, never via sizeCanvasFluid (that grabs a 2D ctx).
  let camPrimed = false;       // snap camera onto level on first frame / rebuild
  let viewW = W, viewH = H;
  function resize(cssW, cssH) {
    viewW = Math.max(1, cssW);
    viewH = Math.max(1, cssH);
    renderer.setSize(viewW, viewH, false);
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();
  }

  // Camera distance so the sim viewport (W..MAX_W wide) frames like the 2D
  // camera did: we want ~ the same world span visible. The 2D camera showed
  // `viewW` sim-px across; match that with the perspective frustum.
  function camDistanceForSpan(spanX) {
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * Math.max(0.3, camera.aspect));
    return (spanX / 2) / Math.tan(hHalf);
  }

  // ── Per-frame render. Reads sim state; advances only render-local fx.
  function render(state, rawDt, opts) {
    if (!state) return;
    const reduceM = opts.reducedMotion;
    const p = state.player;
    const span = clamp(viewW, W, MAX_W);

    // Camera target: centre on the player using the SAME lead/clamp math the
    // sim's updateCamera already produced (state.cam.x/y is the viewport top-
    // left in sim space). Centre = cam + viewport/2.
    const centreSimX = state.cam.x + span / 2;
    const spanY = clamp(viewH, H, MAX_H);
    const centreSimY = state.cam.y + spanY / 2;
    const camZ = camDistanceForSpan(span);

    // Subtle shake from the sim's shake value (death feedback), camera-space.
    const sh = reduceM ? 0 : state.shake;
    const shx = sh ? (Math.random() - 0.5) * sh : 0;
    const shy = sh ? (Math.random() - 0.5) * sh : 0;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - 40 * rawDt);

    const tx = w2x(centreSimX) + shx;
    const ty = w2y(centreSimY) + shy;
    if (!camPrimed) {
      // First frame after a (re)build: snap the camera into the level so the
      // very first rendered frame already shows the world framed on the
      // player — important for the immediate-on-mount screenshot.
      camera.position.set(tx, ty, camZ);
      camPrimed = true;
    } else {
      // Smooth the camera position (extra polish over the already-smoothed cam).
      camera.position.x += (tx - camera.position.x) * Math.min(1, rawDt * 12);
      camera.position.y += (ty - camera.position.y) * Math.min(1, rawDt * 12);
      camera.position.z += (camZ - camera.position.z) * Math.min(1, rawDt * 6);
    }
    camera.lookAt(camera.position.x - shx, camera.position.y - shy, 0);

    // Key light tracks the player so shadows stay crisp on screen.
    key.position.set(w2x(p.x) - 300, w2y(p.y) + 500, 900);
    key.target.position.set(w2x(p.x), w2y(p.y), 0);
    key.target.updateMatrixWorld();

    // Sky follows the camera so the gradient is always behind the action.
    sky.position.set(camera.position.x, camera.position.y, 0);

    // ── Player rig.
    const alive = state.status !== 'dead';
    playerGroup.visible = alive;
    if (alive) {
      playerGroup.position.set(w2x(p.x), w2y(p.y), 0);
      // Invuln blink.
      const blink = p.invuln > 0 && (Math.floor(p.invuln * 18) % 2 === 0);
      orbMesh.visible = !blink;
      coreMesh.visible = !blink;
      scarfMesh.visible = !blink;
      // Scarf points opposite motion. Sim angle = atan2(vy, vx); in world the
      // y axis flips, so the world heading is atan2(-vy, vx).
      const heading = Math.atan2(-p.vy, p.vx || 0.0001);
      // Cone default points +Y; we want it to trail behind, i.e. point at
      // heading + 180°. Rotate scarfPivot about Z so −Y aligns with motion.
      scarfPivot.rotation.z = heading + Math.PI / 2;
      // Speed-based emissive pulse for "fast" juice.
      const spd = Math.hypot(p.vx, p.vy);
      orbMat.emissiveIntensity = 0.3 + Math.min(0.5, spd / MAX_SPEED * 0.5);
    }

    // ── Wire — orient a unit cylinder between anchor and player.
    if (state.wire && alive) {
      const ax = w2x(state.wire.ax), ay = w2y(state.wire.ay);
      const bx = w2x(p.x), by = w2y(p.y);
      _p.set(bx - ax, by - ay, 0);
      const len = _p.length() || 0.0001;
      wireMesh.visible = true;
      wireMesh.position.set((ax + bx) / 2, (ay + by) / 2, 0);
      _dir.copy(_p).normalize();
      _q.setFromUnitVectors(_up, _dir);
      wireMesh.quaternion.copy(_q);
      wireMesh.scale.set(1, len, 1);
    } else {
      wireMesh.visible = false;
    }

    // ── Anchor lit-state. litT decays here (render-local, matches 2D feel).
    for (const a of state.anchors) {
      const rec = anchorRecs.get(a);
      if (!rec) continue;
      if (a.litT > 0) a.litT = Math.max(0, a.litT - rawDt);
      const active = state.wire && state.wire.anchor === a;
      const lit = active || a.litT > 0;
      _c.set(lit ? PAL.anchorActive : PAL.anchorIdle);
      rec.coreMat.color.copy(_c);
      rec.coreMat.emissive.set(lit ? PAL.anchorActive : PAL.anchorReady);
      rec.coreMat.emissiveIntensity = lit ? 1.1 : 0.5;
      rec.haloMat.color.set(lit ? PAL.anchorActive : PAL.anchorIdle);
      rec.haloMat.opacity = lit ? 0.6 : 0.32;
      const sc = lit ? 1.3 : 1;
      rec.halo.scale.set(sc, sc, sc);
      rec.halo.rotation.z += rawDt * 0.6;
    }

    // ── Hazards — laser opacity/scale by lethal/warning; spikes static.
    for (const rec of hazardRecs) {
      if (rec.kind === 'laser') {
        const h = rec.def;
        const intensity = h.lethal ? 1 : h.warning ? 0.45 : 0.18;
        rec.mat.opacity = intensity;
        const thick = h.lethal ? 1.8 : 1;
        rec.mesh.scale.set(1, thick, thick);
      }
    }

    // ── Checkpoints — colour shift + pulse when reached.
    const tnow = performance.now();
    for (const rec of checkpointRecs) {
      const reached = rec.def.reached;
      rec.mat.color.set(reached ? PAL.goal : PAL.wireSpark);
      const pulse = 0.5 + 0.4 * Math.sin(tnow / 260);
      rec.mat.opacity = reached ? pulse * 0.9 : 0.45;
      rec.ring.rotation.z += rawDt * (reached ? 1.2 : 0.3);
    }

    // ── Goal pulse.
    if (goalRec) {
      const pulse = 0.6 + 0.4 * Math.sin(tnow / 280);
      goalRec.mat.emissiveIntensity = 0.8 + pulse * 0.6;
      goalRec.glow.material.opacity = 0.12 + pulse * 0.12;
    }

    // ── Motion trail. Reads the sim's trail list (positions over time).
    const trail = state.trail;
    for (let i = 0; i < TRAIL_N; i++) {
      const t = trail[trail.length - 1 - i];
      if (t && alive) {
        const f = (TRAIL_N - i) / TRAIL_N;
        _p.set(w2x(t.x), w2y(t.y), -1);
        _q.identity();
        const r = P_R * 0.5 * f;
        _s.set(r, r, r);
        _m.compose(_p, _q, _s);
      } else {
        _m.makeScale(0, 0, 0);
      }
      trailMesh.setMatrixAt(i, _m);
    }
    trailMesh.instanceMatrix.needsUpdate = true;

    // ── Particles. Advance render-local fx bursts, draw sim particles + fx.
    advanceFx(state, rawDt);
    let pi = 0;
    // Sim particles (death splash, attach sparks, checkpoint pops).
    for (const pt of state.particles) {
      if (pi >= PART_N) break;
      _p.set(w2x(pt.x), w2y(pt.y), 0);
      _q.identity();
      const sz = pt.size || 2;
      _s.set(sz, sz, sz);
      _m.compose(_p, _q, _s);
      partMesh.setMatrixAt(pi, _m);
      _c.set(pt.color || PAL.wireSpark);
      partMesh.setColorAt(pi, _c);
      pi++;
    }
    // Render-local fx (3D bursts on attach/release/finish).
    for (const f of state.fx) {
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
    // Park the rest off-screen.
    for (let k = pi; k < PART_N; k++) {
      _m.makeScale(0, 0, 0);
      partMesh.setMatrixAt(k, _m);
    }
    partMesh.count = PART_N;
    partMesh.instanceMatrix.needsUpdate = true;
    if (partMesh.instanceColor) partMesh.instanceColor.needsUpdate = true;

    renderer.render(scene, camera);
  }

  // Render-local fx burst pool — purely visual, fed from gameplay events
  // (see the burst() exposed below). Lives in state.fx so it survives the
  // closure but is owned/advanced here.
  function advanceFx(state, dt) {
    const fx = state.fx;
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt;
      f.vy -= 320 * dt;          // world-up gravity (negative)
      f.life -= dt;
      if (f.life <= 0) fx.splice(i, 1);
    }
  }

  function dispose() {
    clearLevel();
    scene.remove(levelGroup);
    // Persistent objects.
    [orbMesh, coreMesh, scarfMesh, wireMesh, trailMesh, partMesh, sky].forEach((o) => {
      o.geometry?.dispose?.();
    });
    [orbMat, coreMat, scarfMat, wireMat, trailMat, partMat, skyMat].forEach((m) => m.dispose?.());
    windowTex.dispose();
    renderer.dispose();
  }

  return { scene, camera, renderer, rebuildLevel, render, resize, dispose };
}

// Deterministic hash for tower placement so the skyline is stable per boot.
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ──────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────
export default function SwingwireGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const viewRef = useRef({ W, H });
  const stateRef = useRef(null);
  const audioRef = useRef(null);
  const rendererRef = useRef(null);

  const runRef = useRef({
    courseIdx: 0, deaths: 0, startMs: 0,
    pauseOffset: 0, pausedAt: 0,
    paused: false, completed: false,
    elapsed: 0,
    courseDeaths: [],
    courseTimes: [],
    courseStartMs: 0,
  });
  const optsRef = useRef({ reducedMotion: false, highContrast: false, muted: false });

  const [ui, setUi] = useState({
    courseIdx: 0, deaths: 0, elapsed: 0,
    status: 'playing', epitaph: null,
    paused: false, completed: false,
    muted: false, reducedMotion: false, highContrast: false,
    best: loadBest(), score: 0,
  });

  // Touch input is handled at the platform level by VirtualControls
  // (src/input/useVirtualControls.jsx). It dispatches synthetic Space
  // keydown/keyup events for the `hook` binding, so the keyboard handler
  // below picks them up natively. No per-game touch UI needed here.

  useEffect(() => {
    audioRef.current = makeAudio();
    const adminStart = consumeAdminStartLevel('hook');
    const startCourse = adminStart != null ? Math.max(0, Math.min(2, adminStart)) : 0;

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;

    // ── Build the WebGL renderer. WebGL can be unavailable (old GPU, blocked
    // context); fail loud in DEV but don't crash the host page.
    let renderer = null;
    try { renderer = makeRenderer3D(canvas); }
    catch (err) { renderer = null; if (import.meta.env.DEV) console.error('[swingwire] WebGL init failed', err); }
    rendererRef.current = renderer;

    if (import.meta.env.DEV && renderer) {
      window.__hook3d = { scene: renderer.scene, camera: renderer.camera, renderer: renderer.renderer };
    }

    // enterCourse needs the renderer ready so the scene mounts immediately.
    enterCourse(startCourse);
    runRef.current.startMs = performance.now();
    runRef.current.courseStartMs = performance.now();

    // ── Manual fluid sizing (NOT sizeCanvasFluid — it grabs a 2D context,
    // locking the canvas out of WebGL). ResizeObserver + orientationchange.
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const fit = () => {
      const cssW = clamp(Math.max(1, wrap.clientWidth), W, MAX_W);
      const cssH = clamp(Math.max(1, wrap.clientHeight), H, MAX_H);
      viewRef.current = { W: cssW, H: cssH };
      renderer?.resize(cssW, cssH);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const onOrient = () => fit();
    window.addEventListener('orientationchange', onOrient);

    // Inputs — rope is engaged while any of these are "down":
    //   keyboard (Space / W / Up — touch button dispatches synthetic Space),
    //   mouse-down on canvas, gamepad face button
    const inputs = { kb: false, mouse: false, pad: false };
    const isHolding = () => inputs.kb || inputs.mouse || inputs.pad;

    const onKeyDown = (e) => {
      const k = e.key;
      if (k === ' ' || k === 'w' || k === 'W' || k === 'ArrowUp') {
        e.preventDefault();
        inputs.kb = true;
      } else if (k === 'p' || k === 'P') {
        togglePause();
      } else if (k === 'm' || k === 'M') {
        toggleMute();
      }
      // R (restart) and H/? (help) are handled exclusively by GameShell.
    };
    const onKeyUp = (e) => {
      const k = e.key;
      if (k === ' ' || k === 'w' || k === 'W' || k === 'ArrowUp') inputs.kb = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onMouseDown = (e) => {
      if (e.button === 0) { inputs.mouse = true; canvas.focus(); }
    };
    const onMouseUp = (e) => { if (e.button === 0) inputs.mouse = false; };
    const onMouseLeave = () => { inputs.mouse = false; };
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);

    // Gamepad — any face button holds the wire
    let prevPad = { any: false };
    const readPad = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = pads && pads[0];
      if (!pad) { inputs.pad = false; prevPad.any = false; return; }
      const anyFace = [0,1,2,3].some((i) => pad.buttons[i]?.pressed);
      inputs.pad = anyFace;
      const restartBtn = !!pad.buttons[8]?.pressed;
      if (restartBtn && !prevPad.restart) restartCourse();
      prevPad.restart = restartBtn;
    };

    let acc = 0, lastT = performance.now(), raf = 0;
    const loop = (now) => {
      const rawDt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      if (!runRef.current.paused && !runRef.current.completed) {
        readPad();
        const s = stateRef.current;
        const slowmoScale = s && s.slowmo > 0
          ? lerp(SLOWMO_SCALE, 1, 1 - s.slowmo / SLOWMO_TIME)
          : 1;
        const dt = rawDt * slowmoScale;
        acc += dt;
        while (acc >= STEP) {
          update(STEP, isHolding());
          acc -= STEP;
        }
      }
      rendererRef.current?.render(stateRef.current, rawDt, optsRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const hudTimer = setInterval(() => {
      if (runRef.current.completed) return;
      const r = runRef.current;
      if (!r.paused) r.elapsed = (performance.now() - r.startMs - r.pauseOffset) / 1000;
      setUi((u) => (u.elapsed === r.elapsed ? u : { ...u, elapsed: r.elapsed }));
    }, 120);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(hudTimer);
      try { ro.disconnect(); } catch {}
      window.removeEventListener('orientationchange', onOrient);
      audioRef.current?.cleanup?.();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      try { rendererRef.current?.dispose(); } catch {}
      rendererRef.current = null;
      if (import.meta.env.DEV && window.__hook3d) { try { delete window.__hook3d; } catch {} }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enterCourse(idx) {
    const def = COURSES[idx];
    stateRef.current = buildCourseState(def);
    seedCamera(stateRef.current);
    rendererRef.current?.rebuildLevel(stateRef.current);
    runRef.current.courseIdx = idx;
    runRef.current.courseStartMs = performance.now();
    audioRef.current?.startDrone();
    setUi((u) => ({ ...u, courseIdx: idx, status: 'playing', epitaph: null }));
  }
  // Instantly centre the camera viewport on the player's spawn so the very
  // first rendered frame frames the player (matches the camera-clamp math in
  // updateCamera, run once with no smoothing).
  function seedCamera(s) {
    const { W: vw, H: vh } = viewRef.current;
    const p = s.player;
    s.cam.x = clamp(p.x - vw / 2, 0, Math.max(0, s.def.world.w - vw));
    s.cam.y = clamp(p.y - vh / 2, 0, Math.max(0, s.def.world.h - vh));
  }

  function restartCourse() {
    if (runRef.current.completed) return;
    const s = stateRef.current;
    if (!s) return enterCourse(runRef.current.courseIdx);
    const fresh = buildCourseState(s.def);
    fresh.lastCheckpoint = s.lastCheckpoint;
    if (s.lastCheckpoint) {
      fresh.player.x = s.lastCheckpoint.x;
      fresh.player.y = s.lastCheckpoint.y;
      fresh.checkpoints.forEach((c) => {
        if (c.x <= s.lastCheckpoint.x) c.reached = true;
      });
    }
    seedCamera(fresh);
    stateRef.current = fresh;
    rendererRef.current?.rebuildLevel(fresh);
    setUi((u) => ({ ...u, status: 'playing', epitaph: null }));
    audioRef.current?.click();
  }
  function togglePause() {
    const r = runRef.current;
    if (r.completed) return;
    if (!r.paused) { r.paused = true; r.pausedAt = performance.now(); }
    else { r.pauseOffset += performance.now() - r.pausedAt; r.paused = false; }
    setUi((u) => ({ ...u, paused: r.paused }));
  }
  function toggleMute() {
    optsRef.current.muted = !optsRef.current.muted;
    audioRef.current?.setMuted(optsRef.current.muted);
    if (!optsRef.current.muted) audioRef.current?.startDrone();
    setUi((u) => ({ ...u, muted: optsRef.current.muted }));
  }
  function toggleReducedMotion() {
    optsRef.current.reducedMotion = !optsRef.current.reducedMotion;
    setUi((u) => ({ ...u, reducedMotion: optsRef.current.reducedMotion }));
  }
  function toggleHighContrast() {
    optsRef.current.highContrast = !optsRef.current.highContrast;
    setUi((u) => ({ ...u, highContrast: optsRef.current.highContrast }));
  }

  // ── render-local 3D burst on a gameplay event (visual only). Pushed into
  // state.fx; the renderer advances + draws + retires them.
  function burst3D(simX, simY, color, n, spread, z = 0) {
    const s = stateRef.current;
    if (!s) return;
    if (optsRef.current.reducedMotion) n = Math.min(n, 4);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = spread * (0.4 + Math.random() * 0.6);
      s.fx.push({
        x: w2x(simX), y: w2y(simY), z: z + (Math.random() - 0.5) * 20,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp + 60,
        vz: (Math.random() - 0.5) * sp * 0.6,
        life: 0.4 + Math.random() * 0.4, max: 0.8,
        size: 3 + Math.random() * 3, color,
      });
      if (s.fx.length > 180) s.fx.shift();
    }
  }

  function kill(kind) {
    const s = stateRef.current;
    if (!s || s.status !== 'playing') return;
    if (s.player.invuln > 0) return;
    s.status = 'dead';
    s.tStatus = 0;
    s.slowmo = SLOWMO_TIME;
    s.shake = optsRef.current.reducedMotion ? 4 : 14;
    s.epitaph = pick(EPITAPHS[kind] || EPITAPHS.ground);
    s.deathKind = kind;
    s.wire = null;
    const p = s.player;
    p.splat = { x: p.x, y: p.y };
    // Splash particles (sim-space; rendered by the 3D particle pool).
    for (let i = 0; i < 22; i++) {
      s.particles.push({
        x: p.x, y: p.y,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 8 - 1,
        life: 0.8 + Math.random() * 0.6, max: 1.4,
        size: 2 + Math.random() * 2,
        color: i % 3 === 0 ? PAL.hazard : i % 3 === 1 ? '#802030' : PAL.wireSpark,
      });
    }
    // 3D death burst.
    burst3D(p.x, p.y, PAL.hazard, 24, 280);
    audioRef.current?.splat();
    const r = runRef.current;
    r.deaths += 1;
    r.courseDeaths[r.courseIdx] = (r.courseDeaths[r.courseIdx] || 0) + 1;
    setUi((u) => ({ ...u, deaths: r.deaths, status: 'dead', epitaph: s.epitaph }));
  }

  function clearCourse() {
    const s = stateRef.current;
    if (!s || s.status !== 'playing') return;
    s.status = 'clear';
    s.tStatus = 0;
    // Finish burst at the goal.
    const g = s.def.goal;
    burst3D(g.x + g.w / 2, g.y + g.h / 2, PAL.goal, 30, 320);
    const r = runRef.current;
    r.courseTimes[r.courseIdx] = (performance.now() - r.courseStartMs) / 1000;
    audioRef.current?.checkpoint();
    setUi((u) => ({ ...u, status: 'clear' }));
  }

  function finishRun() {
    const r = runRef.current;
    r.completed = true;
    audioRef.current?.stopDrone();
    const score = Math.max(0, Math.round(1800 - r.deaths * 28 - r.elapsed * 2.2));
    submitScore('hook', score, { deaths: r.deaths, time: Math.round(r.elapsed), courses: COURSES.length });
    const best = loadBest();
    const newBest = best == null || score > best ? score : best;
    if (newBest !== best) saveBest(newBest);
    setUi((u) => ({ ...u, completed: true, status: 'finished', best: newBest, score }));
    audioRef.current?.finish();
  }

  function resetRun() {
    const r = runRef.current;
    r.courseIdx = 0; r.deaths = 0;
    r.startMs = performance.now();
    r.courseStartMs = performance.now();
    r.pauseOffset = 0; r.paused = false; r.completed = false;
    r.elapsed = 0;
    r.courseDeaths = []; r.courseTimes = [];
    setUi((u) => ({ ...u, deaths: 0, elapsed: 0, completed: false, status: 'playing', epitaph: null, score: 0 }));
    enterCourse(0);
  }
  void resetRun;   // exposed-by-shell parity; retained for completeness

  // ── update — PHYSICS UNCHANGED from the 2D version. Only the rain-drift
  // block (a 2D-only screen effect) is removed; nothing else differs.
  function update(dt, holding) {
    const s = stateRef.current;
    if (!s) return;
    const p = s.player;

    if (s.slowmo > 0) s.slowmo = Math.max(0, s.slowmo - dt);

    if (s.status === 'dead') {
      s.tStatus += dt;
      updateParticles(s, dt);
      updateHazards(s, dt);
      updateCamera(s, dt, true);
      s.shake = Math.max(0, s.shake - 40 * dt);
      if (s.tStatus >= RESPAWN_DELAY) {
        const respawn = s.lastCheckpoint || s.def.spawn;
        const fresh = buildCourseState(s.def);
        fresh.lastCheckpoint = s.lastCheckpoint;
        fresh.checkpoints.forEach((c) => {
          if (s.lastCheckpoint && c.x <= s.lastCheckpoint.x) c.reached = true;
        });
        fresh.player.x = respawn.x;
        fresh.player.y = respawn.y;
        seedCamera(fresh);
        stateRef.current = fresh;
        rendererRef.current?.rebuildLevel(fresh);
        setUi((u) => ({ ...u, status: 'playing', epitaph: null }));
      }
      return;
    }
    if (s.status === 'clear') {
      s.tStatus += dt;
      updateParticles(s, dt);
      updateHazards(s, dt);
      updateCamera(s, dt, false);
      if (s.tStatus >= 0.6) {
        const next = runRef.current.courseIdx + 1;
        if (next >= COURSES.length) { finishRun(); return; }
        enterCourse(next);
      }
      return;
    }

    // Wire management — press/release transitions
    if (holding && !s.wire && !p.stopped) {
      tryAttach(s);
    }
    if (!holding && s.wire) {
      detach(s);
    }

    // If the player hasn't moved yet (start of course), holding attaches
    // immediately to the first overhead anchor — one-button onboarding.
    if (holding && p.stopped) {
      if (tryAttach(s)) p.stopped = false;
    }
    if (!p.stopped) {
      // Apply forces
      p.vy += GRAVITY * dt;
    }

    // Constrain to rope length if attached
    if (s.wire) {
      const dx = p.x - s.wire.ax, dy = p.y - s.wire.ay;
      const d = Math.hypot(dx, dy) || 0.0001;
      if (d > s.wire.length) {
        const nx = dx / d, ny = dy / d;
        p.x = s.wire.ax + nx * s.wire.length;
        p.y = s.wire.ay + ny * s.wire.length;
        // Remove radial velocity component (stiff pendulum)
        const vRadial = p.vx * nx + p.vy * ny;
        if (vRadial > 0) {
          p.vx -= vRadial * nx;
          p.vy -= vRadial * ny;
        }
      }
      // Swing hum on fast arcs
      if (Math.abs(p.vx) + Math.abs(p.vy) > 400 && Math.random() < 0.05) {
        audioRef.current?.swingHum();
      }
    }

    // Speed cap
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > MAX_SPEED) {
      const s2 = MAX_SPEED / speed;
      p.vx *= s2; p.vy *= s2;
    }

    // Integrate
    if (!p.stopped) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // Trail
    s.trail.push({ x: p.x, y: p.y, life: 0.4 });
    if (s.trail.length > 18) s.trail.shift();
    for (const t of s.trail) t.life -= dt;
    s.trail = s.trail.filter((t) => t.life > 0);

    // Facing angle for sprite rotation
    p.angle = Math.atan2(p.vy, p.vx);

    // World bounds: left wall = stop, right wall = stop, bottom fall = die
    if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) * 0.3; }
    if (p.x > s.def.world.w) { p.x = s.def.world.w; p.vx = -Math.abs(p.vx) * 0.3; }
    if (p.y > s.def.world.h + 40) { kill('ground'); return; }

    // Wall collisions — lethal
    for (const w of s.walls) {
      if (aabb(p.x - P_R, p.y - P_R, P_R * 2, P_R * 2, w.x, w.y, w.w, w.h)) {
        kill(w.y >= s.def.world.h - 120 ? 'ground' : 'wall');
        return;
      }
    }

    // Hazards
    updateHazards(s, dt);
    for (const h of s.hazards) {
      if (!h.lethal) continue;
      if (h.type === 'laser') {
        if (p.x > h.x && p.x < h.x + h.w && Math.abs(p.y - h.y) < 10 + P_R) { kill('hazard'); return; }
      }
      if (h.type === 'spikes') {
        if (p.x > h.x && p.x < h.x + h.w && Math.abs(p.y - (h.y - 4)) < 12) { kill('hazard'); return; }
      }
    }

    // Checkpoints
    for (const c of s.checkpoints) {
      if (!c.reached && dist(p.x, p.y, c.x, c.y) < 50) {
        c.reached = true;
        s.lastCheckpoint = { x: c.x, y: c.y };
        audioRef.current?.checkpoint();
        for (let i = 0; i < 14; i++) {
          s.particles.push({
            x: c.x, y: c.y,
            vx: (Math.random() - 0.5) * 5, vy: -Math.random() * 4 - 1,
            life: 0.8, max: 0.8,
            size: 2, color: PAL.goal,
          });
        }
      }
    }

    // Invuln decay
    if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);

    // Goal
    const g = s.def.goal;
    if (aabb(p.x - P_R, p.y - P_R, P_R * 2, P_R * 2, g.x, g.y, g.w, g.h)) {
      clearCourse();
    }

    updateParticles(s, dt);
    updateCamera(s, dt, false);
  }

  function updateParticles(s, dt) {
    for (const pt of s.particles) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.3;
      pt.life -= dt;
    }
    s.particles = s.particles.filter((pt) => pt.life > 0);
  }

  function updateHazards(s, dt) {
    for (const h of s.hazards) {
      h.t += dt;
      if (h.type === 'laser') {
        const phase = (h.t / h.cycle + h.phase) % 1;
        // Lethal roughly in the middle 30% of the cycle, with ~120ms warning before
        h.lethal = phase > 0.45 && phase < 0.75;
        h.warning = phase > 0.32 && phase < 0.45;
      } else if (h.type === 'spikes') {
        h.lethal = true;
      }
    }
  }

  function updateCamera(s, dt, dying) {
    const { W, H } = viewRef.current;
    const p = s.player;
    const aheadX = Math.sign(p.vx || 1) * CAMERA_LEAD_X;
    const aheadY = Math.sign(p.vy || 0) * CAMERA_LEAD_Y * 0.4;
    const targetCenterX = p.x + aheadX;
    const targetCenterY = p.y + aheadY;
    const targetX = clamp(targetCenterX - W / 2, 0, Math.max(0, s.def.world.w - W));
    const targetY = clamp(targetCenterY - H / 2, 0, Math.max(0, s.def.world.h - H));
    s.cam.x = lerp(s.cam.x, targetX, Math.min(1, dt * CAMERA_SMOOTH));
    s.cam.y = lerp(s.cam.y, targetY, Math.min(1, dt * CAMERA_SMOOTH));
    s.cam.kickX = lerp(s.cam.kickX ?? 0, 0, Math.min(1, dt * 8));
    s.cam.kickY = lerp(s.cam.kickY ?? 0, 0, Math.min(1, dt * 8));
  }

  // ── wire attach logic — UNCHANGED from the 2D version.
  function tryAttach(s) {
    const p = s.player;
    // Score each anchor — prefer "above and ahead of facing"
    let best = null;
    let bestScore = Infinity;
    for (const a of s.anchors) {
      const d = dist(p.x, p.y, a.x, a.y);
      if (d > WIRE_RANGE || d < WIRE_MIN) continue;
      // Preference: higher (smaller y) anchors ahead of player motion
      const dy = a.y - p.y; // negative means above
      const dx = a.x - p.x;
      // Strong preference for above-player
      let score = d;
      if (dy > 40) score += 500;      // below us: big penalty
      else if (dy < -20) score -= 40; // clearly above: reward
      // Prefer ahead of motion if moving
      const moving = Math.abs(p.vx) > 10;
      if (moving) {
        const sameSide = Math.sign(dx) === Math.sign(p.vx);
        if (sameSide) score -= 60;
      }
      // Subtle preference for closer, but not the closest-below-us
      if (score < bestScore) { bestScore = score; best = a; }
    }
    if (!best) return false;
    s.wire = { ax: best.x, ay: best.y, length: dist(p.x, p.y, best.x, best.y), anchor: best };
    best.litT = 0.35;  // brief glow on attach
    audioRef.current?.attach();
    // Tiny spark on attach (sim-space particles).
    for (let i = 0; i < 4; i++) {
      s.particles.push({
        x: best.x, y: best.y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 0.25, max: 0.25,
        size: 2, color: PAL.wireSpark,
      });
    }
    // 3D attach burst at the anchor node.
    burst3D(best.x, best.y, PAL.wireSpark, 8, 160);
    return true;
  }
  function detach(s) {
    // 3D release burst at the player.
    const p = s.player;
    burst3D(p.x, p.y, PAL.wire, 8, 200);
    s.wire = null;
    audioRef.current?.release();
  }

  // ── DOM overlays — the gameplay info that used to be drawn on the 2D
  // canvas (tip, epitaph, pause, finish) now lives as DOM, matching the
  // "keep the DOM HUD" directive. Driven entirely by the React `ui` state.
  const showTip = stateRef.current
    ? (performance.now() - stateRef.current.enteredAt) / 1000 < 3.6
    : false;

  return (
    <div className="swingwire">
      <div className="swingwire-bar">
        <span>Course <b>{ui.courseIdx + 1}/{COURSES.length}</b></span>
        <span>Deaths <b>{ui.deaths}</b></span>
        <span>Time <b>{fmtTime(ui.elapsed)}</b></span>
        {ui.best != null && <span>Best <b>{ui.best}</b></span>}
        <button className="btn btn-ghost btn-sm" onClick={toggleReducedMotion} aria-pressed={ui.reducedMotion}>
          {ui.reducedMotion ? 'Motion: low' : 'Motion: full'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={toggleHighContrast} aria-pressed={ui.highContrast}>
          {ui.highContrast ? 'Contrast: high' : 'Contrast: std'}
        </button>
      </div>
      <div
        ref={wrapRef}
        className="swingwire-stage"
        style={{ flex: '1 1 0', minHeight: 0, position: 'relative' }}>
        <canvas ref={canvasRef} className="swingwire-canvas" tabIndex={0}/>

        {/* Course tip — fades after ~3.6s; mirrors the old on-canvas tip. */}
        {showTip && !ui.paused && !ui.completed && ui.status === 'playing' && (
          <div className="swingwire-overlay swingwire-tip" aria-hidden="true">
            {COURSES[ui.courseIdx]?.tip}
          </div>
        )}

        {/* Death epitaph. */}
        {ui.status === 'dead' && ui.epitaph && (
          <div className="swingwire-overlay swingwire-epitaph" role="status">
            <span className="swingwire-epitaph-tag">OFFLINE</span>
            <span className="swingwire-epitaph-msg">{ui.epitaph}</span>
          </div>
        )}

        {/* Pause veil. */}
        {ui.paused && !ui.completed && (
          <div className="swingwire-overlay swingwire-pause">
            <div className="swingwire-pause-title">Paused</div>
            <div className="swingwire-pause-sub">
              P to resume · R to restart course · H for help · M to mute
            </div>
          </div>
        )}

        {/* Finish summary. */}
        {ui.completed && (
          <div className="swingwire-overlay swingwire-finish">
            <div className="swingwire-finish-title">CLEAR LINE</div>
            <div className="swingwire-finish-stats">
              TIME {fmtTime(ui.elapsed)} · DEATHS {ui.deaths} · SCORE {ui.score}
            </div>
            <div className="swingwire-finish-breakdown">
              {COURSES.map((course, i) => {
                const d = runRef.current.courseDeaths[i] || 0;
                const t = runRef.current.courseTimes[i];
                return (
                  <div className="swingwire-finish-row" key={course.id}>
                    <span>{course.title}</span>
                    <b>{t ? fmtTime(t) : '—'} · {String(d).padStart(2, '0')}</b>
                  </div>
                );
              })}
            </div>
            {ui.best != null && (
              <div className="swingwire-finish-best">
                {ui.score >= ui.best ? `NEW BEST — ${ui.score}` : `BEST ${ui.best}`}
              </div>
            )}
            <div className="swingwire-finish-hint">R to run it back</div>
          </div>
        )}
      </div>
      <div className="swingwire-hint">
        Hold to fire wire. Release to detach. {COURSES.length} courses, instant respawn.
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// helpers (module scope)
// ──────────────────────────────────────────────────────────────────────────
function fmtTime(sec) {
  if (!sec || !isFinite(sec)) sec = 0;
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
const BEST_KEY = 'pgplay:swingwire:best';
function loadBest() {
  try { const v = localStorage.getItem(BEST_KEY); return v ? parseInt(v, 10) : null; } catch { return null; }
}
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch {} }
