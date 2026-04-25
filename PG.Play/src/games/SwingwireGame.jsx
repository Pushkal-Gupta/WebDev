import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';
import { isMuted as platformIsMuted, subscribeMute } from '../sound.js';

// Swingwire — an original one-button rope-swing action platformer.
//
// Core fantasy: you are a bolt of kinetic silhouette moving across a dark
// neon skyline. One input. Hold to fire a wire at the nearest anchor above
// you; release to let gravity take over. Your life is the momentum you
// managed to build and time.
//
// Pillars:
//   1. One button. Every depth comes from *when* you let go.
//   2. Momentum is the reward — late release arcs farther than early release.
//   3. Wire-to-anchor auto-aim prefers overhead targets so swinging is always
//      spatially readable; mis-targeting is never a failure mode.
//   4. Failure is instant (building impact, ground, or hazard) and so is the
//      respawn. Courses are short enough to memorize, varied enough to keep
//      teaching.

// ──────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────
const W = 1120;
const H = 640;
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
// Palette — industrial night, neon accents
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
  windowDead:  '#2a3850',
  floodCone:   'rgba(255, 181, 71, 0.08)',
  anchorIdle:  '#3a5a88',
  anchorReady: '#ffb547',
  anchorActive:'#ff4a6a',
  wire:        '#ff4a6a',
  wireSpark:   '#ffe6c4',
  player:      '#ffe6c4',
  playerTrail: 'rgba(255, 74, 106, 0.55)',
  hazard:      '#ff2e4e',
  hazardSoft:  'rgba(255, 46, 78, 0.4)',
  hazardPulse: '#ff9ab5',
  goal:        '#6ffcf2',
  rainLine:    'rgba(110, 170, 200, 0.22)',
  fogWash:     'rgba(40, 70, 110, 0.14)',
  scoreText:   '#ffe6c4',
  vignette:    'rgba(4, 6, 12, 0.6)',
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
// Course data — each course is a horizontal scroll with anchors overhead,
// buildings to avoid, and a glowing goal portal at the end.
//
// Anchors are the only attach points. Walls are solid (death on contact).
// Hazards are lethal zones (spikes, lasers). Props are visual-only.
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
// Audio — procedural cues only. Two oscillators + filtered noise.
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
// Course-state factory
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
    stars: seedStars(def.world.w),
    rainDrops: seedRain(),
    cam: { x: 0, y: 0, kickX: 0, kickY: 0 },
    status: 'playing', tStatus: 0,
    epitaph: null, deathKind: null,
    shake: 0, flash: 0, slowmo: 0, zoom: 1,
    enteredAt: performance.now(),
    trail: [],
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

function seedStars(worldW) {
  const stars = [];
  for (let i = 0; i < 140; i++) {
    stars.push({
      x: Math.random() * worldW,
      y: Math.random() * 280,
      r: Math.random() * 1.1 + 0.3,
      flicker: Math.random() * 6,
    });
  }
  return stars;
}

function seedRain() {
  const drops = [];
  for (let i = 0; i < 56; i++) {
    drops.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vy: 360 + Math.random() * 260,
      vx: -30 - Math.random() * 50,
      len: 8 + Math.random() * 12,
    });
  }
  return drops;
}

// ──────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────
export default function SwingwireGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const audioRef = useRef(null);

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
    enterCourse(0);
    runRef.current.startMs = performance.now();
    runRef.current.courseStartMs = performance.now();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

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
        // Mirror GameShell's pause so the game loop actually freezes (the
        // shell's overlay otherwise sits on top of a still-running game).
        togglePause();
      } else if (k === 'm' || k === 'M') {
        // GameShell's mute uses src/sound.js; our WebAudio is separate.
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
      render(ctx, rawDt);
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
      audioRef.current?.cleanup?.();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enterCourse(idx) {
    const def = COURSES[idx];
    stateRef.current = buildCourseState(def);
    runRef.current.courseIdx = idx;
    runRef.current.courseStartMs = performance.now();
    audioRef.current?.startDrone();
    setUi((u) => ({ ...u, courseIdx: idx, status: 'playing', epitaph: null }));
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
    stateRef.current = fresh;
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

  function kill(kind) {
    const s = stateRef.current;
    if (!s || s.status !== 'playing') return;
    if (s.player.invuln > 0) return;
    s.status = 'dead';
    s.tStatus = 0;
    s.slowmo = SLOWMO_TIME;
    s.shake = optsRef.current.reducedMotion ? 4 : 14;
    s.flash = 0.2;
    s.epitaph = pick(EPITAPHS[kind] || EPITAPHS.ground);
    s.deathKind = kind;
    s.wire = null;
    const p = s.player;
    p.splat = { x: p.x, y: p.y };
    // Splash particles
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

  // ── update ─────────────────────────────────────────────────────────────
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
      s.flash = Math.max(0, s.flash - 1.4 * dt);
      if (s.tStatus >= RESPAWN_DELAY) {
        const respawn = s.lastCheckpoint || s.def.spawn;
        const fresh = buildCourseState(s.def);
        fresh.lastCheckpoint = s.lastCheckpoint;
        fresh.checkpoints.forEach((c) => {
          if (s.lastCheckpoint && c.x <= s.lastCheckpoint.x) c.reached = true;
        });
        fresh.player.x = respawn.x;
        fresh.player.y = respawn.y;
        stateRef.current = fresh;
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

    // Rain drift
    for (const r of s.rainDrops) {
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      if (r.y > H + 20) {
        r.y = -20;
        r.x = Math.random() * W;
      }
      if (r.x < -20) r.x = W + 20;
    }
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
    s.zoom = lerp(s.zoom, dying ? 1.24 : 1, Math.min(1, dt * (dying ? 5 : 3)));
  }

  // ── wire attach logic ──────────────────────────────────────────────────
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
    // Tiny spark on attach
    for (let i = 0; i < 4; i++) {
      s.particles.push({
        x: best.x, y: best.y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 0.25, max: 0.25,
        size: 2, color: PAL.wireSpark,
      });
    }
    return true;
  }
  function detach(s) {
    s.wire = null;
    audioRef.current?.release();
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  function render(ctx, rawDt) {
    const s = stateRef.current;
    if (!s) return;
    const r = runRef.current;
    const reduceM = optsRef.current.reducedMotion;
    const hc = optsRef.current.highContrast;
    const zoom = s.zoom;
    const shakeX = reduceM ? 0 : (Math.random() - 0.5) * s.shake;
    const shakeY = reduceM ? 0 : (Math.random() - 0.5) * s.shake;

    // Clear to sky
    const skyG = ctx.createLinearGradient(0, 0, 0, H);
    skyG.addColorStop(0, PAL.skyTop);
    skyG.addColorStop(0.7, PAL.skyMid);
    skyG.addColorStop(1, PAL.skyBottom);
    ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, H);

    // Zoom + shake
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2 + shakeX, -H / 2 + shakeY);

    const camX = s.cam.x, camY = s.cam.y;

    // ── Stars (parallax 0.1) ──────────────────────────────────────────
    for (const st of s.stars) {
      const x = ((st.x - camX * 0.1) % (s.def.world.w * 0.5));
      const y = st.y - camY * 0.05;
      const flick = 0.7 + 0.3 * Math.sin(performance.now() / 500 + st.flicker);
      ctx.fillStyle = `rgba(255, 220, 190, ${0.5 * flick})`;
      ctx.beginPath();
      ctx.arc(x < 0 ? x + s.def.world.w * 0.5 : x, y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fog wash above horizon
    ctx.fillStyle = PAL.fogWash;
    ctx.fillRect(0, 240, W, 220);

    // ── Far buildings (parallax 0.28) ─────────────────────────────────
    drawFarBuildings(ctx, camX, camY);

    // ── Mid buildings (parallax 0.6) ──────────────────────────────────
    drawMidBuildings(ctx, camX, camY);

    // ── World layer (parallax 1.0) ────────────────────────────────────
    const kx = reduceM ? 0 : (s.cam.kickX || 0);
    const ky = reduceM ? 0 : (s.cam.kickY || 0);
    ctx.save();
    ctx.translate(-camX + kx, -camY + ky);

    // Near buildings + walls
    for (const w of s.walls) drawWall(ctx, w, s.def.world);

    // Props
    for (const pr of (s.def.props || [])) drawProp(ctx, pr);

    // Anchors
    for (const a of s.anchors) drawAnchor(ctx, a, s.wire && s.wire.anchor === a);

    // Hazards
    for (const h of s.hazards) drawHazard(ctx, h, hc);

    // Checkpoints
    for (const c of s.checkpoints) drawCheckpoint(ctx, c);

    // Goal
    drawGoal(ctx, s.def.goal);

    // Wire
    if (s.wire) drawWire(ctx, s.player, s.wire);

    // Player trail
    drawTrail(ctx, s.trail);

    // Player / splat
    if (s.status !== 'dead') drawPlayer(ctx, s.player);
    else if (s.player.splat) drawSplat(ctx, s.player);

    // Particles
    for (const pt of s.particles) {
      ctx.globalAlpha = Math.min(1, pt.life / pt.max);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
    // End world

    // Rain (screen-space so it always feels present)
    ctx.strokeStyle = PAL.rainLine;
    ctx.lineWidth = 1;
    for (const rdp of s.rainDrops) {
      ctx.beginPath();
      ctx.moveTo(rdp.x, rdp.y);
      ctx.lineTo(rdp.x + rdp.vx * 0.03, rdp.y + rdp.len);
      ctx.stroke();
    }

    // Vignette
    const vg = ctx.createRadialGradient(W/2, H/2, W*0.35, W/2, H/2, W*0.72);
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, PAL.vignette);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
    // End zoom/shake

    // Slow-mo veil + radial focus
    if (s.slowmo > 0 && !reduceM) {
      const t = s.slowmo / SLOWMO_TIME;
      ctx.fillStyle = `rgba(8, 6, 14, ${t * 0.22})`;
      ctx.fillRect(0, 0, W, H);
      const cx = W/2, cy = H/2;
      const vg2 = ctx.createRadialGradient(cx, cy, W*(0.15 + 0.2*(1-t)), cx, cy, W*0.62);
      vg2.addColorStop(0, 'transparent');
      vg2.addColorStop(1, `rgba(90, 10, 30, ${0.5 * t})`);
      ctx.fillStyle = vg2;
      ctx.fillRect(0, 0, W, H);
      // CSS filter color grade
      const filter = `saturate(${(1 + t * 0.38).toFixed(2)}) hue-rotate(${(-t * 6).toFixed(1)}deg) brightness(${(1 - t * 0.1).toFixed(2)})`;
      if (ctx.canvas.style.filter !== filter) ctx.canvas.style.filter = filter;
    } else if (ctx.canvas.style.filter) {
      ctx.canvas.style.filter = '';
    }

    // Death flash
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255, 46, 78, ${Math.min(0.42, s.flash)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // HUD + overlays
    drawHud(ctx, s, r);
    drawTip(ctx, s);
    if (s.status === 'dead' && s.epitaph) drawEpitaph(ctx, s);
    if (s.status === 'clear') {
      const a = 0.26 * (1 - s.tStatus / 0.6);
      ctx.fillStyle = `rgba(111, 252, 242, ${a})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (r.paused && !r.completed) drawPause(ctx);
    if (r.completed) drawFinish(ctx, r);

    // ── helpers that need world state via closure ──────────────────────
    function drawFarBuildings(ctx, cx, cy) {
      ctx.fillStyle = PAL.farBuildings;
      const paraX = cx * 0.28;
      const paraY = cy * 0.1;
      const base = H - 80 + paraY;
      for (let i = -2; i < 20; i++) {
        const bx = i * 150 - (paraX % 150);
        const h = 120 + ((i * 31) % 160);
        ctx.fillRect(bx, base - h, 120, h);
        // windows
        ctx.fillStyle = (i % 4 === 1) ? PAL.windowWarm : PAL.windowCool;
        for (let y = 0; y < h - 20; y += 22) {
          for (let x = 8; x < 112; x += 16) {
            if (((i * 31 + y + x) % 5) < 3) {
              ctx.globalAlpha = 0.18;
              ctx.fillRect(bx + x, base - h + 10 + y, 3, 4);
            }
          }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = PAL.farBuildings;
      }
    }
    function drawMidBuildings(ctx, cx, cy) {
      ctx.fillStyle = PAL.midBuildings;
      const paraX = cx * 0.6;
      const paraY = cy * 0.35;
      const base = H - 30 + paraY;
      for (let i = -2; i < 20; i++) {
        const bx = i * 220 - (paraX % 220);
        const h = 200 + ((i * 47) % 220);
        ctx.fillRect(bx, base - h, 170, h);
        // windows (sharper)
        for (let y = 0; y < h - 30; y += 26) {
          for (let x = 10; x < 160; x += 20) {
            const seed = (i * 47 + y + x) % 7;
            if (seed < 4) {
              ctx.fillStyle = seed < 2 ? PAL.windowWarm : PAL.windowCool;
              ctx.globalAlpha = 0.38;
              ctx.fillRect(bx + x, base - h + 14 + y, 5, 6);
            }
          }
        }
        ctx.globalAlpha = 1;
        // Rooftop trim
        ctx.fillStyle = PAL.nearBuildings;
        ctx.fillRect(bx, base - h, 170, 3);
        ctx.fillStyle = PAL.midBuildings;
      }
    }

    function drawWall(ctx, w, world) {
      // Ground or pillar — render with a front stripe and subtle grain
      const isGround = w.y >= world.h - 120 && w.w >= world.w - 100;
      ctx.fillStyle = PAL.nearBuildings;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = isGround ? '#0a1220' : '#122132';
      ctx.fillRect(w.x, w.y, w.w, 3);
      if (!isGround) {
        ctx.fillStyle = '#040810';
        ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);
      }
    }

    function drawProp(ctx, pr) {
      if (pr.kind === 'billboard') {
        // Text stripe on pillar
        ctx.fillStyle = PAL.windowWarm;
        ctx.globalAlpha = 0.55;
        const strips = 3;
        for (let i = 0; i < strips; i++) {
          ctx.fillRect(pr.x + 2, pr.y + 12 + i * 24, pr.w - 4, 5);
        }
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.fillStyle = PAL.windowWarm;
        ctx.font = '700 10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.translate(pr.x + pr.w / 2, pr.y + pr.h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(pr.text, 0, 3);
        ctx.restore();
      } else if (pr.kind === 'antenna') {
        ctx.strokeStyle = '#0e1522';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pr.x, pr.y);
        ctx.lineTo(pr.x, pr.y - pr.h);
        ctx.stroke();
        ctx.fillStyle = PAL.hazard;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y - pr.h, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (pr.kind === 'moon') {
        ctx.fillStyle = 'rgba(255, 240, 220, 0.85)';
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(40, 60, 90, 0.25)';
        ctx.beginPath();
        ctx.arc(pr.x - pr.r * 0.3, pr.y - pr.r * 0.2, pr.r * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawAnchor(ctx, a, active) {
      // Idle anchor: dim node + rim; active anchor: bright + pulse
      const pulse = (a.litT || 0) > 0 ? 1 : 0;
      if (a.litT > 0) a.litT = Math.max(0, a.litT - rawDt);
      // Outer halo
      ctx.fillStyle = active ? 'rgba(255, 74, 106, 0.35)' : 'rgba(80, 120, 160, 0.15)';
      ctx.beginPath();
      ctx.arc(a.x, a.y, 12 + pulse * 4, 0, Math.PI * 2);
      ctx.fill();
      // Mount pin
      ctx.strokeStyle = '#1a2838';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x, a.y + 6);
      ctx.stroke();
      // Body
      ctx.fillStyle = active ? PAL.anchorActive : PAL.anchorIdle;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
      ctx.fill();
      // Hot center
      ctx.fillStyle = active ? PAL.wireSpark : PAL.anchorReady;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawHazard(ctx, h, hc) {
      if (h.type === 'laser') {
        const cx = h.x + h.w / 2;
        const intensity = h.lethal ? 1 : h.warning ? 0.35 : 0.15;
        ctx.strokeStyle = hc ? `rgba(0,255,255,${intensity})` : `rgba(255, 46, 78, ${intensity})`;
        ctx.lineWidth = h.lethal ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(h.x, h.y);
        ctx.lineTo(h.x + h.w, h.y);
        ctx.stroke();
        if (h.lethal) {
          ctx.strokeStyle = 'rgba(255, 154, 181, 0.5)';
          ctx.lineWidth = 6;
          ctx.stroke();
        }
        // Emitters at ends
        ctx.fillStyle = '#2a1818';
        ctx.fillRect(h.x - 4, h.y - 4, 4, 8);
        ctx.fillRect(h.x + h.w, h.y - 4, 4, 8);
        // warning marker
        if (h.warning || h.lethal) {
          ctx.fillStyle = h.lethal ? PAL.hazard : PAL.anchorReady;
          ctx.beginPath();
          ctx.arc(h.x - 2, h.y, 2, 0, Math.PI * 2);
          ctx.arc(h.x + h.w + 2, h.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (h.type === 'spikes') {
        ctx.fillStyle = hc ? '#ff00ff' : '#cfd6df';
        const count = Math.max(3, Math.floor(h.w / 8));
        const step = h.w / count;
        for (let i = 0; i < count; i++) {
          const bx = h.x + i * step;
          ctx.beginPath();
          ctx.moveTo(bx, h.y);
          ctx.lineTo(bx + step / 2, h.y - 14);
          ctx.lineTo(bx + step, h.y);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = '#2a1818';
        ctx.fillRect(h.x, h.y - 3, h.w, 3);
      }
    }

    function drawCheckpoint(ctx, c) {
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 260);
      ctx.strokeStyle = c.reached ? PAL.goal : 'rgba(255, 230, 196, 0.4)';
      ctx.lineWidth = 2;
      ctx.globalAlpha = c.reached ? pulse * 0.9 : 0.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = c.reached ? PAL.goal : '#555';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawGoal(ctx, g) {
      // Neon portal: vertical bars + glow
      const cx = g.x + g.w / 2;
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 280);
      ctx.strokeStyle = `rgba(111, 252, 242, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = `rgba(111, 252, 242, ${0.25 * pulse})`;
      ctx.lineWidth = 10;
      ctx.strokeRect(g.x, g.y, g.w, g.h);
      ctx.font = '700 10px "Courier New", monospace';
      ctx.fillStyle = 'rgba(111, 252, 242, 0.85)';
      ctx.textAlign = 'center';
      ctx.fillText('OUT', cx, g.y - 10);
    }

    function drawWire(ctx, p, wire) {
      // Main wire with glow
      ctx.strokeStyle = 'rgba(255, 74, 106, 0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(wire.ax, wire.ay);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.strokeStyle = PAL.wire;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(wire.ax, wire.ay);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      // Sparks at player end
      ctx.fillStyle = PAL.wireSpark;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawTrail(ctx, trail) {
      if (trail.length < 2) return;
      for (let i = 1; i < trail.length; i++) {
        const alpha = i / trail.length * 0.5;
        ctx.strokeStyle = `rgba(255, 74, 106, ${alpha})`;
        ctx.lineWidth = (i / trail.length) * 2.6;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
    }

    function drawPlayer(ctx, p) {
      const blink = p.invuln > 0 && (Math.floor(p.invuln * 18) % 2 === 0);
      if (blink) return;
      // Body
      ctx.fillStyle = PAL.player;
      ctx.beginPath();
      ctx.arc(p.x, p.y, P_R, 0, Math.PI * 2);
      ctx.fill();
      // Scarf/streak (trails behind motion)
      const angle = Math.atan2(p.vy, p.vx || 0.01);
      ctx.strokeStyle = PAL.hazard;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x - Math.cos(angle) * P_R, p.y - Math.sin(angle) * P_R);
      ctx.lineTo(p.x - Math.cos(angle) * (P_R + 12), p.y - Math.sin(angle) * (P_R + 12));
      ctx.stroke();
      // Core highlight
      ctx.fillStyle = 'rgba(255, 220, 170, 0.85)';
      ctx.beginPath();
      ctx.arc(p.x - 1.5, p.y - 1.8, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawSplat(ctx, p) {
      const s2 = p.splat;
      const r = 14;
      ctx.fillStyle = 'rgba(255, 46, 78, 0.35)';
      ctx.beginPath();
      ctx.ellipse(s2.x, s2.y, r * 1.2, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(128, 32, 48, 0.7)';
      ctx.beginPath();
      ctx.ellipse(s2.x, s2.y, r * 0.7, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawHud(ctx, s, r) {
      const alpha = s.status === 'playing' ? 0.22 : 0.55;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(0, 0, W, 20);
      ctx.font = '600 10px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 230, 196, 0.92)';
      ctx.fillText(`${s.def.title.toUpperCase()}  ·  COURSE ${r.courseIdx + 1}/${COURSES.length}`, 10, 14);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(210, 196, 160, 0.8)';
      ctx.fillText(`${fmtTime(r.elapsed)}  ·  DEATHS ${r.deaths}`, W - 10, 14);
    }

    function drawTip(ctx, s) {
      const age = (performance.now() - s.enteredAt) / 1000;
      if (age > 3.6) return;
      const alpha = age < 2 ? 0.9 : 0.9 * (1 - (age - 2) / 1.6);
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '600 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe6c4';
      ctx.fillText(s.def.tip, W / 2, H - 22);
      ctx.restore();
    }

    function drawEpitaph(ctx, s) {
      const age = s.tStatus;
      const inT = clamp(age / 0.16, 0, 1);
      const outT = clamp(1 - (age - 0.25) / 0.18, 0, 1);
      const alpha = age < 0.25 ? inT : outT;
      if (alpha <= 0) return;
      const msg = s.epitaph;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'italic 15px "Lora", Georgia, serif';
      ctx.textAlign = 'center';
      const mw = Math.min(W - 80, ctx.measureText(msg).width + 60);
      const mx = (W - mw) / 2, my = H / 2 - 56;
      ctx.fillStyle = 'rgba(10, 6, 10, 0.9)';
      ctx.fillRect(mx, my, mw, 64);
      ctx.strokeStyle = 'rgba(255, 46, 78, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, 63);
      ctx.font = '700 10px "Courier New", monospace';
      ctx.fillStyle = '#ff2e4e';
      ctx.fillText('OFFLINE', W / 2, my + 20);
      ctx.font = 'italic 14px "Lora", Georgia, serif';
      ctx.fillStyle = '#e0d6c0';
      ctx.fillText(msg, W / 2, my + 46);
      ctx.restore();
    }

    function drawPause(ctx) {
      ctx.fillStyle = 'rgba(8, 6, 14, 0.72)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.font = '700 42px "Lora", Georgia, serif';
      ctx.fillStyle = '#ffe6c4';
      ctx.fillText('Paused', W / 2, H / 2 - 8);
      ctx.font = '600 12px "Courier New", monospace';
      ctx.fillStyle = '#c9b48a';
      ctx.fillText('P to resume  ·  R to restart course  ·  H for help  ·  M to mute', W / 2, H / 2 + 22);
    }

    function drawFinish(ctx, r) {
      ctx.fillStyle = 'rgba(8, 6, 14, 0.93)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.font = '700 52px "Lora", Georgia, serif';
      ctx.fillStyle = '#6ffcf2';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#6ffcf2';
      ctx.fillText('CLEAR LINE', W / 2, H / 2 - 160);
      ctx.shadowBlur = 0;
      const score = Math.max(0, Math.round(1800 - r.deaths * 28 - r.elapsed * 2.2));
      ctx.font = '600 14px "Courier New", monospace';
      ctx.fillStyle = '#ffe6c4';
      ctx.fillText(
        `TIME ${fmtTime(r.elapsed)}   ·   DEATHS ${r.deaths}   ·   SCORE ${score}`,
        W / 2, H / 2 - 118
      );
      ctx.font = '600 10px "Courier New", monospace';
      ctx.fillStyle = 'rgba(201, 180, 138, 0.7)';
      ctx.fillText('COURSE BREAKDOWN', W / 2, H / 2 - 82);
      const rowH = 24;
      const startY = H / 2 - 48;
      const leftX = W / 2 - 180;
      const rightX = W / 2 + 180;
      COURSES.forEach((course, i) => {
        const d = r.courseDeaths[i] || 0;
        const t = r.courseTimes[i];
        const y = startY + i * rowH;
        ctx.textAlign = 'left';
        ctx.font = '600 13px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255, 230, 196, 0.82)';
        ctx.fillText(course.title, leftX, y);
        ctx.textAlign = 'right';
        ctx.font = '700 14px "Courier New", monospace';
        ctx.fillStyle = d === 0 ? PAL.goal
                      : d <= 3 ? '#ffe6c4'
                      : d <= 6 ? PAL.anchorReady
                      : PAL.hazard;
        ctx.fillText(
          `${t ? fmtTime(t) : '—    '}    ${String(d).padStart(2, '0')}`,
          rightX, y
        );
      });
      const best = loadBest();
      ctx.textAlign = 'center';
      if (best != null) {
        ctx.font = '600 10px "Courier New", monospace';
        ctx.fillStyle = score >= best ? '#ffe6c4' : 'rgba(138, 155, 165, 0.75)';
        ctx.fillText(
          score >= best ? `NEW BEST — ${score}` : `BEST ${best}`,
          W / 2, startY + COURSES.length * rowH + 8
        );
      }
      ctx.font = '600 11px "Courier New", monospace';
      ctx.fillStyle = '#8a9ba5';
      ctx.fillText('R to run it back', W / 2, startY + COURSES.length * rowH + 44);
    }
  }

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
      <div className="swingwire-stage">
        <canvas ref={canvasRef} className="swingwire-canvas" width={W} height={H} tabIndex={0}/>
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
