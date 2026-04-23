import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

// Nightcap — a roadside motel at 3 AM. The fixtures hate guests.
// Seven handcrafted rooms, one screen each, 1-hit deaths, ≤500ms respawn.

const W = 800;
const H = 500;
const FLOOR_Y = 460;
const STEP = 1 / 60;             // fixed physics step
const COYOTE = 0.10;             // seconds of grace after leaving ground
const JUMP_BUFFER = 0.12;        // seconds of remembered jump press
const INVULN = 0.22;             // post-respawn i-frames
const RESPAWN_DELAY = 0.45;      // ≤500ms death → control
const ROOM_CLEAR_DELAY = 0.55;   // brief savor before next room
const WALK_MAX = 200;
const GROUND_ACCEL = 1700;
const AIR_ACCEL = 900;
const GROUND_FRICTION = 1800;
const JUMP_V = -500;             // peak ≈ 78px with gravity 1600
const GRAVITY = 1600;
const MAX_FALL = 900;
const JUMP_RELEASE_DAMP = 0.45;
const P_W = 20, P_H = 28;        // player AABB

// ──────────────────────────────────────────────────────────────────────────
// Palette — warm-neon noir
// ──────────────────────────────────────────────────────────────────────────
const PAL = {
  bg1: '#0a0f1a', bg2: '#141d2e',
  wall: '#1c2539', wallEdge: '#2e3d5a',
  floor: '#0e1525', floorLine: '#2b3a58',
  neonPink: '#ff3f88', neonPinkSoft: '#ff3f8844',
  neonCyan: '#52e0ff', neonAmber: '#ffb347',
  hazard: '#ff4455', hazardSoft: '#ff445533',
  hazardGlow: '#ff445588',
  warn: '#ffb347', warnSoft: '#ffb34733',
  safe: '#7de2ad',
  cream: '#f0e3c6', skin: '#ffd1a6',
  fabric: '#e84a6b', denim: '#2c3e66',
  door: '#2a1f14', doorGlow: '#ffc46c',
  vendingBody: '#d24a4a', vendingGlass: '#162034',
  iceBody: '#b6d5e3', iceBlock: '#d9ecf5',
  dust: 'rgba(220,200,160,0.45)',
  stain: '#2a1e18',
  signInk: '#ffd46a',
};

// ──────────────────────────────────────────────────────────────────────────
// Epitaphs — 1 line, understated, per trap family. Pool-per-family.
// ──────────────────────────────────────────────────────────────────────────
const EPITAPHS = {
  plate: [
    'The floor kept score.',
    'A stain with opinions.',
    'That tile waited for you.',
    'Hospitality, revoked.',
    'Room service declined.',
    'The maintenance log will be brief.',
    'Your timing was less than exact.',
    'You were not this plate\'s friend.',
  ],
  drop: [
    'The ceiling remembered gravity.',
    'Something came loose. You.',
    'From above, with disdain.',
    'A fan made its own choices.',
    'Maintenance apologizes. To the fan.',
    'Heavy is as heavy does.',
    'The roof was not impressed.',
    'Overhead, a decision was reached.',
  ],
  spike: [
    'The carpet disagreed.',
    'Spikes are patient tenants.',
    'The floorboards held a grudge.',
    'The tile popped. So did you.',
    'Hospitality is a sharp business.',
    'Check-in complete. Check-out deferred.',
    'A quiet floor makes noise at last.',
    'Your feet found the wrong punctuation.',
  ],
  vending: [
    'A can with intent.',
    'Complimentary, with force.',
    'Exact change was unkind.',
    'The snack bar extends its regrets.',
    'A soda asked a question.',
    'Vending is a contact sport.',
    'The machine insisted.',
    'Product of the month: you.',
  ],
  ice: [
    'A block of regret.',
    'On the rocks.',
    'Cold. Fast. Decisive.',
    'Someone needed ice. It wasn\'t you.',
    'Complimentary cube, minor fracture.',
    'From the freezer, with love.',
    'The ice maker does not comp.',
    'Your head met its match.',
  ],
  collapse: [
    'The floor was a lie.',
    'Not all platforms are loyal.',
    'The planks had conditions.',
    'Weight limit: briefly you.',
    'Gravity accepted your request.',
    'The joists were just tired.',
    'You found the stress test.',
    'Structural integrity declined politely.',
  ],
  bed: [
    'The bed had opinions about ceilings.',
    'Memory foam, short memory.',
    'The mattress got excited.',
    'Springs overachieve.',
    'Ejected. Complimentary.',
    'The bed called itself a trampoline.',
    'You were not meant for upward.',
    'A velocity you did not request.',
  ],
  fake: [
    'Labels are suggestions.',
    'The sign was a liar.',
    'Trust, but do not rest.',
    '"SAFE" had air quotes.',
    'The paint was not load-bearing.',
    'A tile can gaslight.',
    'Design flaw: your optimism.',
    'Reading the room, poorly.',
  ],
  pit: [
    'You found the basement.',
    'A courteous plummet.',
    'Check-out was a level below.',
    'The carpet thinned.',
    'You skipped the elevator.',
    'Out of reach, out of mind.',
    'Down was the wrong way.',
    'The floor made other plans.',
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// Rooms — handcrafted, data-driven.
// platforms: { kind:'solid'|'collapse'|'bed'|'fake', x,y,w,h }
// traps:     { type:'plate'|'drop'|'spike'|'vending'|'ice'|'pit'|'fakesign', ... }
// Every trap with lethal potential has a windup ≥ 0.22s and a visible tell.
// ──────────────────────────────────────────────────────────────────────────
const ROOMS = [
  // ── 1. LOBBY — tutorial, no lethal traps ───────────────────────────────
  {
    id: 'lobby',
    title: 'Lobby',
    tip: 'Walk right. Reach the hallway.',
    accent: PAL.neonPink,
    spawn: { x: 48, y: 428 },
    exit: { x: 738, y: 388, w: 44, h: 72 },
    platforms: [
      { kind: 'solid', x: 0,   y: FLOOR_Y, w: 800, h: 40 },
      { kind: 'solid', x: 300, y: 380, w: 110, h: 10 },
    ],
    traps: [],
    signs: [
      { x: 250, y: 256, text: 'VACANCY', big: true },
      { x: 396, y: 372, text: 'please enjoy your stay', small: true },
      { x: 720, y: 356, text: 'ROOMS →', small: true },
    ],
    props: ['lobbyDesk'],
  },

  // ── 2. HALLWAY — Pressure Plates ───────────────────────────────────────
  {
    id: 'hallway',
    title: 'Hallway 2A',
    tip: 'Mind the floor.',
    accent: PAL.neonCyan,
    spawn: { x: 40, y: 428 },
    exit: { x: 738, y: 388, w: 44, h: 72 },
    platforms: [
      { kind: 'solid', x: 0, y: FLOOR_Y, w: 800, h: 40 },
    ],
    traps: [
      // Lethal plate → ceiling drop
      { type: 'plate', id: 'p1', x: 180, y: 454, w: 64, h: 8, tell: 'stained', triggers: ['drop1'] },
      { type: 'drop',  id: 'drop1', x: 190, y: 0, w: 44, h: 18, windup: 0.32, speed: 820, family: 'drop' },

      // Safe plate — teaches that not all plates kill (rings bell)
      { type: 'plate', id: 'p2', x: 360, y: 454, w: 56, h: 8, tell: 'clean', triggers: ['bell1'] },
      { type: 'bell',  id: 'bell1', x: 388, y: 340 },

      // Lethal plate → floor spikes
      { type: 'plate', id: 'p3', x: 560, y: 454, w: 64, h: 8, tell: 'stained', triggers: ['spike1'] },
      { type: 'spike', id: 'spike1', x: 560, y: 436, w: 64, h: 24, windup: 0.28, family: 'spike' },
    ],
    signs: [
      { x: 240, y: 432, text: '- stain -', small: true, dim: true },
      { x: 388, y: 324, text: '(door bell)', small: true, dim: true },
      { x: 592, y: 432, text: '- stain -', small: true, dim: true },
    ],
  },

  // ── 3. VENDING ALCOVE — Reactive Fixtures ──────────────────────────────
  {
    id: 'vending',
    title: 'Vending Alcove',
    tip: 'It sees you.',
    accent: PAL.neonAmber,
    spawn: { x: 40, y: 428 },
    exit: { x: 738, y: 388, w: 44, h: 72 },
    platforms: [
      { kind: 'solid', x: 0, y: FLOOR_Y, w: 800, h: 40 },
    ],
    traps: [
      // Vending machine on the wall — starts humming when player enters its sight-line,
      // fires cans at a timed cadence after a short windup.
      {
        type: 'vending', id: 'v1', x: 220, y: 360, w: 52, h: 100,
        threshold: { axis: 'x', op: '>', val: 210 },
        windup: 0.42, cadence: 1.6,
        projectile: { w: 20, h: 14, speed: 340, startY: 408 }, family: 'vending',
      },
      // Ice machine drops blocks straight to the floor — player threads under it between drops.
      {
        type: 'ice', id: 'ice1', x: 396, y: 280, w: 52, h: 72,
        threshold: { axis: 'x', op: '>', val: 340 },
        windup: 0.5, cadence: 1.9, dropSpeed: 420, family: 'ice',
      },
      // Final plate → drop near exit
      { type: 'plate', id: 'vp1', x: 640, y: 454, w: 56, h: 8, tell: 'stained', triggers: ['vdrop'] },
      { type: 'drop',  id: 'vdrop', x: 648, y: 0, w: 40, h: 18, windup: 0.35, speed: 780, family: 'drop' },
    ],
    signs: [
      { x: 246, y: 352, text: 'COMPLIMENTARY', small: true, dim: true },
      { x: 422, y: 274, text: 'ICE', small: true, dim: true },
    ],
  },

  // ── 4. ICE ROOM — Collapsing Platforms + Bed ──────────────────────────
  {
    id: 'ice',
    title: 'Ice Room',
    tip: "Don't linger.",
    accent: PAL.neonCyan,
    spawn: { x: 40, y: 428 },
    exit: { x: 738, y: 388, w: 44, h: 72 },
    platforms: [
      { kind: 'solid',    x: 0,   y: FLOOR_Y, w: 190, h: 40 },
      { kind: 'solid',    x: 610, y: FLOOR_Y, w: 190, h: 40 },
      // Pit: 190..610 at y=FLOOR_Y (lethal)
      { kind: 'collapse', x: 210, y: 424, w: 70, h: 10, delay: 0.32 },
      { kind: 'collapse', x: 320, y: 398, w: 70, h: 10, delay: 0.32 },
      { kind: 'bed',      x: 420, y: 432, w: 82, h: 16, launchV: -720 },
      { kind: 'collapse', x: 540, y: 368, w: 70, h: 10, delay: 0.34 },
    ],
    traps: [
      { type: 'pit', id: 'pit4', x: 190, y: 492, w: 420, h: 10, family: 'pit' },
    ],
    signs: [
      { x: 400, y: 340, text: 'do not disturb', small: true, dim: true },
    ],
  },

  // ── 5. POOL AREA — Fake Safety ────────────────────────────────────────
  {
    id: 'pool',
    title: 'Pool Area',
    tip: 'Not every label tells the truth.',
    accent: PAL.neonCyan,
    spawn: { x: 40, y: 428 },
    exit: { x: 738, y: 388, w: 44, h: 72 },
    platforms: [
      { kind: 'solid', x: 0, y: FLOOR_Y, w: 800, h: 40 },
      { kind: 'solid', x: 260, y: 380, w: 72, h: 10 },    // real safe platform
      { kind: 'fake',  x: 430, y: 380, w: 72, h: 10, delay: 0.18 },  // fake safe platform
      { kind: 'solid', x: 600, y: 380, w: 72, h: 10 },    // real safe platform
    ],
    traps: [
      { type: 'fakesign', id: 'fs1', x: 296, y: 356, text: 'SAFE' },
      { type: 'fakesign', id: 'fs2', x: 466, y: 356, text: 'SAFE' },
      { type: 'fakesign', id: 'fs3', x: 636, y: 356, text: 'SAFE' },
      // Spikes under fake platform — windup starts when fake begins to dissolve
      { type: 'spike', id: 's5', x: 430, y: 436, w: 72, h: 24, windup: 0.16, armedBy: 'fake_430_380', family: 'fake' },
      // Surprise plate near spawn: normal-looking but fires a can (escalates tell-literacy)
      { type: 'plate', id: 'p5a', x: 140, y: 454, w: 54, h: 8, tell: 'clean', triggers: ['v5'] },
      {
        type: 'vending', id: 'v5', x: 120, y: 360, w: 48, h: 100,
        threshold: null, triggeredOnly: true,
        windup: 0.38, cadence: 999,
        projectile: { w: 20, h: 14, speed: 320, startY: 408 }, family: 'vending',
      },
    ],
    signs: [
      { x: 400, y: 260, text: 'POOL', big: true },
      { x: 148, y: 432, text: '- clean -', small: true, dim: true },
    ],
  },

  // ── 6. LAUNDRY — Chain Reactions ──────────────────────────────────────
  {
    id: 'laundry',
    title: 'Laundry',
    tip: 'Everything is connected.',
    accent: PAL.safe,
    spawn: { x: 40, y: 428 },
    exit: { x: 738, y: 388, w: 44, h: 72 },
    platforms: [
      { kind: 'solid', x: 0, y: FLOOR_Y, w: 800, h: 40 },
      { kind: 'solid', x: 210, y: 378, w: 80, h: 10 },
      { kind: 'collapse', x: 360, y: 378, w: 80, h: 10, delay: 0.26 },
      { kind: 'solid', x: 510, y: 378, w: 80, h: 10 },
    ],
    traps: [
      // Chain A: plate → drop
      { type: 'plate', id: 'l1', x: 170, y: 454, w: 50, h: 8, tell: 'stained', triggers: ['ldrop1'] },
      { type: 'drop',  id: 'ldrop1', x: 170, y: 0, w: 40, h: 16, windup: 0.3, speed: 760, family: 'drop' },

      // Chain B: plate → spike AND plate → drop (combined tell)
      { type: 'plate', id: 'l2', x: 620, y: 454, w: 60, h: 8, tell: 'stained', triggers: ['lspike', 'ldrop2'] },
      { type: 'spike', id: 'lspike', x: 620, y: 436, w: 60, h: 24, windup: 0.3, family: 'spike' },
      { type: 'drop',  id: 'ldrop2', x: 468, y: 0, w: 48, h: 16, windup: 0.6, speed: 820, family: 'drop' },

      // Mid vending forces the player into the collapse platform
      {
        type: 'vending', id: 'lv', x: 300, y: 360, w: 40, h: 100,
        threshold: { axis: 'x', op: '>', val: 260 },
        windup: 0.4, cadence: 1.8,
        projectile: { w: 18, h: 12, speed: 320, startY: 408 }, family: 'vending',
      },
    ],
    signs: [
      { x: 360, y: 360, text: 'WASH', small: true, dim: true },
    ],
  },

  // ── 7. ROOM 13 — finale, all families ─────────────────────────────────
  {
    id: 'room13',
    title: 'Room 13',
    tip: 'Final check-out.',
    accent: PAL.neonPink,
    spawn: { x: 40, y: 428 },
    exit: { x: 738, y: 388, w: 44, h: 72 },
    platforms: [
      { kind: 'solid', x: 0, y: FLOOR_Y, w: 800, h: 40 },
      { kind: 'solid', x: 190, y: 378, w: 60, h: 10 },
      { kind: 'collapse', x: 290, y: 378, w: 60, h: 10, delay: 0.28 },
      { kind: 'bed', x: 400, y: 432, w: 80, h: 16, launchV: -760 },
      { kind: 'solid', x: 540, y: 378, w: 60, h: 10 },
      { kind: 'fake', x: 640, y: 378, w: 60, h: 10, delay: 0.18 },
    ],
    traps: [
      // Zone 1 — pressure chain
      { type: 'plate', id: 'f1', x: 110, y: 454, w: 42, h: 8, tell: 'stained', triggers: ['fdrop1', 'fdrop2'] },
      { type: 'drop',  id: 'fdrop1', x: 200, y: 0, w: 42, h: 16, windup: 0.28, speed: 820, family: 'drop' },
      { type: 'drop',  id: 'fdrop2', x: 300, y: 0, w: 42, h: 16, windup: 0.55, speed: 820, family: 'drop' },

      // Zone 2 — vending
      {
        type: 'vending', id: 'fv', x: 332, y: 360, w: 40, h: 100,
        threshold: { axis: 'x', op: '>', val: 300 },
        windup: 0.34, cadence: 1.1,
        projectile: { w: 18, h: 12, speed: 400, startY: 408 }, family: 'vending',
      },

      // Zone 3 — fake safety
      { type: 'fakesign', id: 'ffs', x: 666, y: 354, text: 'SAFE' },
      { type: 'spike', id: 'fspike', x: 640, y: 436, w: 60, h: 24, windup: 0.14, armedBy: 'fake_640_378', family: 'fake' },

      // Zone 4 — finale floor combo
      { type: 'plate', id: 'f3', x: 470, y: 454, w: 40, h: 8, tell: 'clean', triggers: [] },
      { type: 'plate', id: 'f4', x: 700, y: 454, w: 38, h: 8, tell: 'stained', triggers: ['fdrop3'] },
      { type: 'drop',  id: 'fdrop3', x: 706, y: 0, w: 34, h: 16, windup: 0.25, speed: 900, family: 'drop' },
    ],
    signs: [
      { x: 400, y: 264, text: '13', big: true },
      { x: 680, y: 336, text: '(safe?)', small: true, dim: true },
    ],
  },
];

const pick = (a) => a[(Math.random() * a.length) | 0];
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const aabb = (ax, ay, aw, ah, bx, by, bw, bh) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

// ──────────────────────────────────────────────────────────────────────────
// Audio — WebAudio, no files. Each cue ~40ms. Respects `muted`.
// ──────────────────────────────────────────────────────────────────────────
function makeAudio() {
  let ctx = null;
  let muted = false;
  const ensure = () => {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { muted = true; }
    }
    if (ctx?.state === 'suspended') ctx.resume();
  };
  const tone = (freq, dur = 0.08, type = 'sine', gain = 0.12) => {
    ensure(); if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  };
  const sweep = (f1, f2, dur, type = 'sawtooth', gain = 0.1) => {
    ensure(); if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  };
  const noise = (dur = 0.05, gain = 0.08) => {
    ensure(); if (!ctx || muted) return;
    const t = ctx.currentTime;
    const len = Math.max(1, (ctx.sampleRate * dur) | 0);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; g.gain.value = gain;
    src.connect(g).connect(ctx.destination);
    src.start(t); src.stop(t + dur);
  };
  return {
    setMuted: (m) => { muted = m; },
    windup:     () => sweep(240, 420, 0.22, 'square', 0.06),
    trigger:    () => { noise(0.05, 0.1); tone(90, 0.1, 'sine', 0.16); },
    death:      () => { sweep(440, 80, 0.36, 'triangle', 0.12); noise(0.1, 0.06); },
    checkpoint: () => { tone(523, 0.14, 'triangle', 0.1); setTimeout(() => tone(659, 0.14, 'triangle', 0.1), 60); setTimeout(() => tone(784, 0.2, 'triangle', 0.1), 130); },
    click:      () => tone(1600, 0.02, 'square', 0.06),
    bell:       () => { tone(1320, 0.2, 'sine', 0.12); tone(1980, 0.25, 'sine', 0.07); },
    step:       () => noise(0.02, 0.035),
    jump:       () => sweep(380, 560, 0.08, 'triangle', 0.07),
    land:       () => tone(140, 0.04, 'sine', 0.08),
    pit:        () => sweep(200, 60, 0.5, 'sine', 0.12),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Factory: build a live room state from a ROOMS[i] definition
// ──────────────────────────────────────────────────────────────────────────
function buildRoomState(def) {
  const fakeIds = new Map();
  const platforms = def.platforms.map((p) => {
    const pf = { ...p, broken: false, standT: 0, dissolve: 0 };
    if (p.kind === 'fake') fakeIds.set(`fake_${p.x}_${p.y}`, pf);
    return pf;
  });
  const traps = def.traps.map((t) => ({
    ...t,
    state: 'idle',      // idle | armed (threshold crossed) | windup | active | done
    windupT: 0,
    cooldown: 0,
    projectiles: [],
    blocks: [],
    animT: 0,
    litUntil: 0,
  }));
  return {
    def, platforms, traps, fakeIds,
    player: {
      x: def.spawn.x, y: def.spawn.y, vx: 0, vy: 0,
      onGround: false, wasGround: false,
      coyote: 0, jumpBuf: 0, jumpHeld: false,
      facing: 1, invuln: 0, squish: 0,
    },
    particles: [],
    shake: 0,
    flash: 0,
    status: 'playing',   // 'playing' | 'dead' | 'clear'
    tStatus: 0,
    epitaph: null,
    bellT: 0,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────
export default function NightcapGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const audioRef = useRef(null);

  const [ui, setUi] = useState({
    roomIdx: 0,
    deaths: 0,
    elapsed: 0,
    status: 'playing',
    epitaph: null,
    paused: false,
    completed: false,
    helpOpen: false,
    muted: false,
    reducedMotion: false,
    highContrast: false,
    best: loadBest(),
  });

  // persistent run refs (don't want effect re-bind on every state tick)
  const runRef = useRef({
    roomIdx: 0,
    deaths: 0,
    elapsed: 0,
    startMs: 0,
    pausedAt: 0,
    pauseOffset: 0,
    paused: false,
    completed: false,
  });

  const optsRef = useRef({ reducedMotion: false, highContrast: false, muted: false });

  useEffect(() => {
    audioRef.current = makeAudio();
    enterRoom(0);
    runRef.current.startMs = performance.now();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // Keyboard and gamepad each maintain their own held-state; update reads the OR.
    const keys = {
      kbLeft: false, kbRight: false, kbJump: false,
      padLeft: false, padRight: false, padJump: false,
      jumpPressed: false,
      // Computed each frame before update:
      left: false, right: false, jump: false,
    };

    const onKeyDown = (e) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.kbLeft = true; e.preventDefault(); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.kbRight = true; e.preventDefault(); }
      else if (k === ' ' || k === 'w' || k === 'W' || k === 'ArrowUp') {
        if (!keys.kbJump) keys.jumpPressed = true;
        keys.kbJump = true; e.preventDefault();
      }
      else if (k === 'r' || k === 'R') { restartRoom(); }
      else if (k === 'p' || k === 'P') { togglePause(); }
      else if (k === 'h' || k === 'H') { setUi((u) => ({ ...u, helpOpen: !u.helpOpen })); }
      else if (k === 'm' || k === 'M') { toggleMute(); }
    };
    const onKeyUp = (e) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.kbLeft = false;
      if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.kbRight = false;
      if (k === ' ' || k === 'w' || k === 'W' || k === 'ArrowUp') keys.kbJump = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let prevPad = { jump: false, restart: false };
    const readPad = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = pads && pads[0];
      if (!pad) {
        keys.padLeft = false; keys.padRight = false; keys.padJump = false;
        prevPad.jump = false; prevPad.restart = false;
        return;
      }
      const lx = pad.axes[0] ?? 0;
      keys.padLeft  = (lx < -0.25) || !!pad.buttons[14]?.pressed;
      keys.padRight = (lx >  0.25) || !!pad.buttons[15]?.pressed;
      const jumpNow = !!(pad.buttons[0]?.pressed);
      if (jumpNow && !prevPad.jump) keys.jumpPressed = true;
      keys.padJump = jumpNow;
      prevPad.jump = jumpNow;

      const restartNow = !!(pad.buttons[1]?.pressed || pad.buttons[3]?.pressed);
      if (restartNow && !prevPad.restart) restartRoom();
      prevPad.restart = restartNow;
    };

    let acc = 0, lastT = performance.now(), raf = 0;
    const loop = (now) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      if (!runRef.current.paused && !runRef.current.completed) {
        readPad();
        keys.left  = keys.kbLeft  || keys.padLeft;
        keys.right = keys.kbRight || keys.padRight;
        keys.jump  = keys.kbJump  || keys.padJump;
        acc += dt;
        while (acc >= STEP) {
          update(STEP, keys);
          keys.jumpPressed = false;
          acc -= STEP;
        }
      }

      render(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Light 10Hz HUD tick for the run timer (avoids rendering React 60fps)
    const hudTimer = setInterval(() => {
      if (runRef.current.completed) return;
      const r = runRef.current;
      if (!r.paused) {
        r.elapsed = (performance.now() - r.startMs - r.pauseOffset) / 1000;
      }
      setUi((u) => (u.elapsed === r.elapsed ? u : { ...u, elapsed: r.elapsed }));
    }, 100);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(hudTimer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── control helpers ────────────────────────────────────────────────────
  function enterRoom(idx) {
    const def = ROOMS[idx];
    stateRef.current = buildRoomState(def);
    runRef.current.roomIdx = idx;
    setUi((u) => ({ ...u, roomIdx: idx, status: 'playing', epitaph: null }));
  }
  function restartRoom() {
    if (runRef.current.completed) return;
    enterRoom(runRef.current.roomIdx);
    audioRef.current?.click();
  }
  function togglePause() {
    const r = runRef.current;
    if (r.completed) return;
    if (!r.paused) {
      r.paused = true;
      r.pausedAt = performance.now();
    } else {
      r.pauseOffset += performance.now() - r.pausedAt;
      r.paused = false;
    }
    setUi((u) => ({ ...u, paused: r.paused }));
  }
  function toggleMute() {
    optsRef.current.muted = !optsRef.current.muted;
    audioRef.current?.setMuted(optsRef.current.muted);
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

  function kill(family) {
    const s = stateRef.current;
    if (!s || s.status !== 'playing') return;
    if (s.player.invuln > 0) return;
    const a = audioRef.current;
    s.status = 'dead';
    s.tStatus = 0;
    s.shake = optsRef.current.reducedMotion ? 4 : 14;
    s.flash = 0.12;
    s.epitaph = pick(EPITAPHS[family] || EPITAPHS.plate);
    const p = s.player;
    // death confetti
    for (let i = 0; i < 22; i++) {
      s.particles.push({
        x: p.x + P_W / 2, y: p.y + P_H / 2,
        vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 6 - 1,
        life: 0.9 + Math.random() * 0.5, max: 1.4,
        color: i % 2 ? PAL.fabric : PAL.hazard, size: 3 + Math.random() * 2,
      });
    }
    if (family === 'pit') a?.pit(); else a?.death();
    const r = runRef.current;
    r.deaths += 1;
    setUi((u) => ({ ...u, deaths: r.deaths, status: 'dead', epitaph: s.epitaph }));
  }

  function clearRoom() {
    const s = stateRef.current;
    if (!s || s.status !== 'playing') return;
    s.status = 'clear';
    s.tStatus = 0;
    audioRef.current?.checkpoint();
    setUi((u) => ({ ...u, status: 'clear' }));
  }

  function finishRun() {
    const r = runRef.current;
    r.completed = true;
    const timeSec = r.elapsed;
    const score = Math.max(0, Math.round(1200 - r.deaths * 22 - timeSec * 2));
    submitScore('nightcap', score, { deaths: r.deaths, time: Math.round(timeSec), rooms: ROOMS.length });
    const best = loadBest();
    const newBest = best == null || score > best ? score : best;
    if (newBest !== best) saveBest(newBest);
    setUi((u) => ({ ...u, completed: true, status: 'finished', best: newBest }));
    audioRef.current?.bell();
  }

  function resetRun() {
    const r = runRef.current;
    r.roomIdx = 0; r.deaths = 0;
    r.startMs = performance.now();
    r.pauseOffset = 0; r.paused = false; r.completed = false;
    r.elapsed = 0;
    setUi((u) => ({ ...u, deaths: 0, elapsed: 0, completed: false, status: 'playing', epitaph: null }));
    enterRoom(0);
  }

  // ── per-step game update ───────────────────────────────────────────────
  function update(dt, keys) {
    const s = stateRef.current;
    if (!s) return;
    const p = s.player;

    if (s.status === 'dead') {
      s.tStatus += dt;
      s.shake = Math.max(0, s.shake - 50 * dt);
      updateParticles(s, dt);
      if (s.tStatus >= RESPAWN_DELAY) {
        // fresh room state, keep deaths counter
        enterRoom(runRef.current.roomIdx);
      }
      return;
    }
    if (s.status === 'clear') {
      s.tStatus += dt;
      updateParticles(s, dt);
      if (s.tStatus >= ROOM_CLEAR_DELAY) {
        const next = runRef.current.roomIdx + 1;
        if (next >= ROOMS.length) { finishRun(); return; }
        enterRoom(next);
      }
      return;
    }

    // Movement
    const wantLeft  = keys.left;
    const wantRight = keys.right;
    if (wantLeft && !wantRight) { p.vx -= (p.onGround ? GROUND_ACCEL : AIR_ACCEL) * dt; p.facing = -1; }
    if (wantRight && !wantLeft) { p.vx += (p.onGround ? GROUND_ACCEL : AIR_ACCEL) * dt; p.facing = 1; }
    if (!wantLeft && !wantRight && p.onGround) {
      const sign = Math.sign(p.vx);
      p.vx -= sign * GROUND_FRICTION * dt;
      if (Math.sign(p.vx) !== sign) p.vx = 0;
    }
    p.vx = clamp(p.vx, -WALK_MAX, WALK_MAX);

    // Jump buffering + coyote
    if (keys.jumpPressed) p.jumpBuf = JUMP_BUFFER;
    p.jumpBuf = Math.max(0, p.jumpBuf - dt);
    p.coyote = Math.max(0, p.coyote - dt);

    const canJump = p.onGround || p.coyote > 0;
    if (p.jumpBuf > 0 && canJump) {
      p.vy = JUMP_V;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      audioRef.current?.jump();
    }

    // Variable jump
    const jumpHeldNow = keys.jump;
    if (!jumpHeldNow && p.jumpHeld && p.vy < 0) p.vy *= JUMP_RELEASE_DAMP;
    p.jumpHeld = jumpHeldNow;

    // Gravity
    p.vy += GRAVITY * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;

    // Move + collide
    p.wasGround = p.onGround;
    moveAndCollide(s, dt);

    // Land cue
    if (!p.wasGround && p.onGround) audioRef.current?.land();
    if (p.wasGround && !p.onGround) p.coyote = COYOTE;

    // Player bounds (sides)
    if (p.x < 0) { p.x = 0; p.vx = 0; }
    if (p.x + P_W > W) { p.x = W - P_W; p.vx = 0; }

    // Pit check (bottom)
    if (p.y > H + 40) {
      const hasPit = s.def.traps.some((t) => t.type === 'pit');
      kill(hasPit ? 'pit' : 'pit');
      return;
    }

    // Invuln decay
    if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);

    // Traps
    updateTraps(s, dt);

    // Fake platform dissolve — when player has stood on it delay seconds
    for (const pf of s.platforms) {
      if (pf.kind !== 'fake' || pf.broken) continue;
      if (pf.standT > (pf.delay ?? 0.15)) {
        pf.broken = true;
        // Arm any spike trap linked to this fake platform
        const key = `fake_${pf.x}_${pf.y}`;
        for (const t of s.traps) {
          if (t.armedBy === key && t.state === 'idle') {
            t.state = 'windup';
            t.windupT = 0;
            audioRef.current?.windup();
          }
        }
      }
    }

    // Collapsing platforms
    for (const pf of s.platforms) {
      if (pf.kind !== 'collapse' || pf.broken) continue;
      if (pf.standT > (pf.delay ?? 0.3)) {
        pf.broken = true;
        audioRef.current?.trigger();
        // Puff
        for (let i = 0; i < 8; i++) {
          s.particles.push({
            x: pf.x + pf.w * Math.random(), y: pf.y,
            vx: (Math.random() - 0.5) * 2, vy: Math.random() * -1 - 0.5,
            life: 0.6, max: 0.6, color: PAL.dust, size: 2,
          });
        }
      }
    }

    // Bell decay
    if (s.bellT > 0) s.bellT = Math.max(0, s.bellT - dt);

    // Exit check
    const ex = s.def.exit;
    if (aabb(p.x, p.y, P_W, P_H, ex.x, ex.y, ex.w, ex.h)) clearRoom();

    // Shake/flash decay
    s.shake = Math.max(0, s.shake - 40 * dt);
    s.flash = Math.max(0, s.flash - 1.5 * dt);

    // Particles
    updateParticles(s, dt);

    // Running dust
    if (p.onGround && Math.abs(p.vx) > 50) {
      if (Math.random() < 0.3) {
        s.particles.push({
          x: p.x + P_W / 2, y: p.y + P_H - 2,
          vx: -p.vx * 0.08 + (Math.random() - 0.5), vy: -Math.random() * 0.4,
          life: 0.3, max: 0.3, color: PAL.dust, size: 2,
        });
      }
    }
  }

  function updateParticles(s, dt) {
    for (const pt of s.particles) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.18;
      pt.life -= dt;
    }
    s.particles = s.particles.filter((pt) => pt.life > 0);
  }

  // ── collision: move X, resolve; move Y, resolve. Track stand time. ─────
  function moveAndCollide(s, dt) {
    const p = s.player;
    // Reset stand timers each frame; re-add below if we're still on them.
    for (const pf of s.platforms) pf._standingNow = false;

    // X axis
    p.x += p.vx * dt;
    for (const pf of s.platforms) {
      if (pf.broken && (pf.kind === 'collapse' || pf.kind === 'fake')) continue;
      if (pf.kind === 'bed' || pf.kind === 'fake' || pf.kind === 'collapse' || pf.kind === 'solid') {
        if (aabb(p.x, p.y, P_W, P_H, pf.x, pf.y, pf.w, pf.h)) {
          if (p.vx > 0) p.x = pf.x - P_W;
          else if (p.vx < 0) p.x = pf.x + pf.w;
          p.vx = 0;
        }
      }
    }

    // Y axis
    p.y += p.vy * dt;
    let landed = false;
    for (const pf of s.platforms) {
      if (pf.broken && (pf.kind === 'collapse' || pf.kind === 'fake')) continue;
      if (aabb(p.x, p.y, P_W, P_H, pf.x, pf.y, pf.w, pf.h)) {
        if (p.vy > 0) {
          // landing
          p.y = pf.y - P_H;
          if (pf.kind === 'bed') {
            p.vy = pf.launchV ?? -700;
            p.onGround = false;
            audioRef.current?.jump();
            // little squish
            p.squish = 0.25;
            continue;
          }
          p.vy = 0;
          landed = true;
          pf._standingNow = true;
        } else if (p.vy < 0) {
          p.y = pf.y + pf.h;
          p.vy = 0;
        }
      }
    }
    p.onGround = landed;

    // Accumulate stand timers
    for (const pf of s.platforms) {
      if (pf._standingNow) pf.standT = (pf.standT || 0) + dt;
      else pf.standT = 0;
    }
  }

  // ── trap update loop ───────────────────────────────────────────────────
  function updateTraps(s, dt) {
    const p = s.player;
    const px = p.x + P_W / 2, py = p.y + P_H / 2;

    for (const t of s.traps) {
      t.animT += dt;

      // Cool down
      if (t.cooldown > 0) t.cooldown = Math.max(0, t.cooldown - dt);

      if (t.type === 'plate') {
        // Trigger only while idle AND from landing on it (standing)
        const landed = p.onGround && aabb(p.x, p.y + P_H - 4, P_W, 4, t.x, t.y - 2, t.w, t.h + 4);
        if (t.state === 'idle' && landed) {
          t.state = 'active';
          audioRef.current?.click();
          // Fire chained triggers
          for (const id of (t.triggers || [])) {
            const other = s.traps.find((x) => x.id === id);
            if (other && other.state === 'idle') {
              if (other.type === 'bell') { s.bellT = 1.0; audioRef.current?.bell(); other.state = 'done'; }
              else if (other.type === 'drop' || other.type === 'spike' || other.type === 'vending') {
                other.state = 'windup';
                other.windupT = 0;
                audioRef.current?.windup();
              }
            }
          }
          // Tiny plate-press particles
          for (let i = 0; i < 5; i++) {
            s.particles.push({
              x: t.x + Math.random() * t.w, y: t.y,
              vx: (Math.random() - 0.5) * 1.5, vy: -Math.random() * 1.2,
              life: 0.4, max: 0.4, color: PAL.dust, size: 2,
            });
          }
        }
      }

      if (t.type === 'drop') {
        if (t.state === 'windup') {
          t.windupT += dt;
          if (t.windupT >= (t.windup ?? 0.3)) {
            t.state = 'active';
            t.dropX = t.x; t.dropY = t.y;
            // Launch at full speed so the drop actually threatens a running player;
            // without initial velocity the player outruns every drop trivially.
            t.dropV = t.speed ?? 800;
            audioRef.current?.trigger();
          }
        }
        if (t.state === 'active') {
          // Minor extra acceleration so the drop feels "heavier" late-fall.
          t.dropV = Math.min((t.dropV ?? 0) + GRAVITY * 0.25 * dt, (t.speed ?? 800) * 1.35);
          t.dropY += t.dropV * dt;
          // Player hit
          if (aabb(p.x, p.y, P_W, P_H, t.dropX, t.dropY, t.w, t.h)) {
            kill(t.family || 'drop'); return;
          }
          if (t.dropY > H + 40) t.state = 'done';
        }
      }

      if (t.type === 'spike') {
        if (t.state === 'windup') {
          t.windupT += dt;
          if (t.windupT >= (t.windup ?? 0.28)) {
            t.state = 'active';
            t.activeT = 0;
            audioRef.current?.trigger();
          }
        }
        if (t.state === 'active') {
          t.activeT = (t.activeT ?? 0) + dt;
          const spikeTop = t.y + 6;   // spikes pop up ~18px
          if (aabb(p.x, p.y, P_W, P_H, t.x, spikeTop, t.w, t.h - 6)) {
            kill(t.family || 'spike'); return;
          }
          if (t.activeT > 1.2) t.state = 'done';
        }
      }

      if (t.type === 'vending') {
        // Arm when threshold crossed (or triggeredOnly handled by windup from plate)
        if (t.state === 'idle' && t.threshold) {
          const th = t.threshold;
          const val = th.axis === 'x' ? px : py;
          const crossed = th.op === '>' ? val > th.val : val < th.val;
          if (crossed) {
            t.state = 'windup';
            t.windupT = 0;
            audioRef.current?.windup();
          }
        }
        if (t.state === 'windup') {
          t.windupT += dt;
          if (t.windupT >= (t.windup ?? 0.35)) {
            t.state = 'firing';
            t.cooldown = 0;
          }
        }
        if (t.state === 'firing') {
          if (t.cooldown <= 0) {
            // spawn projectile from the machine towards player
            const dir = (px < t.x + t.w / 2) ? -1 : 1;
            const pr = t.projectile;
            t.projectiles.push({
              x: t.x + (dir < 0 ? 0 : t.w - pr.w),
              y: pr.startY,
              vx: pr.speed * dir,
              w: pr.w, h: pr.h,
            });
            audioRef.current?.trigger();
            t.cooldown = t.cadence ?? 1.4;
          }
        }
        // advance projectiles
        for (const q of t.projectiles) {
          q.x += q.vx * dt;
          q.vy = (q.vy ?? 0) + GRAVITY * 0.25 * dt;
          q.y += q.vy * dt;
          if (aabb(p.x, p.y, P_W, P_H, q.x, q.y, q.w, q.h)) {
            kill(t.family || 'vending'); return;
          }
        }
        t.projectiles = t.projectiles.filter((q) => q.x > -60 && q.x < W + 60 && q.y < H + 60);
      }

      if (t.type === 'ice') {
        if (t.state === 'idle' && t.threshold) {
          const th = t.threshold;
          const val = th.axis === 'x' ? px : py;
          const crossed = th.op === '>' ? val > th.val : val < th.val;
          if (crossed) {
            t.state = 'windup';
            t.windupT = 0;
            audioRef.current?.windup();
          }
        }
        if (t.state === 'windup') {
          t.windupT += dt;
          if (t.windupT >= (t.windup ?? 0.5)) {
            t.state = 'firing';
            t.cooldown = 0;
          }
        }
        if (t.state === 'firing') {
          if (t.cooldown <= 0) {
            t.blocks.push({ x: t.x + t.w / 2 - 12, y: t.y + t.h, vy: 0, w: 24, h: 24 });
            audioRef.current?.trigger();
            t.cooldown = t.cadence ?? 1.9;
          }
        }
        for (const b of t.blocks) {
          b.vy = (b.vy ?? 0) + GRAVITY * 0.85 * dt;
          b.vy = Math.min(b.vy, t.dropSpeed ?? 420);
          b.y += b.vy * dt;
          if (aabb(p.x, p.y, P_W, P_H, b.x, b.y, b.w, b.h)) {
            kill(t.family || 'ice'); return;
          }
        }
        t.blocks = t.blocks.filter((b) => b.y < H + 40);
      }

      if (t.type === 'pit') {
        if (aabb(p.x, p.y, P_W, P_H, t.x, t.y, t.w, t.h)) { kill('pit'); return; }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  function render(ctx) {
    const s = stateRef.current;
    if (!s) return;
    const r = runRef.current;
    const reduceM = optsRef.current.reducedMotion;
    const hc = optsRef.current.highContrast;

    const hazardC = hc ? '#ff00ff' : PAL.hazard;
    const hazardSoftC = hc ? '#ff00ff44' : PAL.hazardSoft;

    // Shake
    const sx = reduceM ? 0 : (Math.random() - 0.5) * s.shake;
    const sy = reduceM ? 0 : (Math.random() - 0.5) * s.shake;

    // Background gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, PAL.bg2);
    g.addColorStop(1, PAL.bg1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 113) % W;
      const y = (i * 37) % 200;
      ctx.fillRect(x, y, 1 + (i % 2), 1 + (i % 2));
    }

    ctx.save();
    ctx.translate(sx, sy);

    // Wall / floor backdrop
    drawRoomShell(ctx, s);

    // Signs (background)
    for (const sg of (s.def.signs || [])) drawSign(ctx, sg, s);

    // Exit doorway
    drawExitDoor(ctx, s);

    // Lobby desk / props
    if (s.def.props?.includes('lobbyDesk')) drawLobbyDesk(ctx);

    // Platforms
    for (const pf of s.platforms) drawPlatform(ctx, pf, hc);

    // Plates
    for (const t of s.traps) if (t.type === 'plate') drawPlate(ctx, t, hc);

    // Fake signs (on platforms)
    for (const t of s.traps) if (t.type === 'fakesign') drawFakeSign(ctx, t);

    // Wall fixtures (vending, ice)
    for (const t of s.traps) {
      if (t.type === 'vending') drawVending(ctx, t, hc);
      if (t.type === 'ice') drawIceMachine(ctx, t, hc);
    }

    // Ceiling/floor active traps
    for (const t of s.traps) {
      if (t.type === 'drop') drawDrop(ctx, t, hc);
      if (t.type === 'spike') drawSpikes(ctx, t, hc);
    }

    // Pit (visual)
    for (const t of s.traps) if (t.type === 'pit') drawPit(ctx, t);

    // Projectiles
    for (const t of s.traps) {
      if (t.type === 'vending') {
        for (const q of t.projectiles) drawCan(ctx, q);
      }
      if (t.type === 'ice') {
        for (const b of t.blocks) drawIceBlock(ctx, b);
      }
    }

    // Bell flash
    if (s.bellT > 0) {
      ctx.globalAlpha = s.bellT;
      ctx.fillStyle = PAL.neonAmber;
      ctx.beginPath(); ctx.arc(388, 344, 24 + (1 - s.bellT) * 14, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Particles
    for (const pt of s.particles) {
      const a = Math.min(1, pt.life / pt.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // Player (skip during dead for the first frames for comedic absence)
    if (s.status !== 'dead') drawPlayer(ctx, s);

    ctx.restore();

    // Death flash
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255, 68, 85, ${Math.min(0.4, s.flash)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Top HUD strip
    drawTopHud(ctx, s, r);

    // Room tip overlay (fades out first 2 seconds)
    drawRoomTip(ctx, s);

    // Epitaph toast
    if (s.status === 'dead' && s.epitaph) drawEpitaph(ctx, s);

    // Room-clear flash
    if (s.status === 'clear') {
      const a = 0.3 * (1 - s.tStatus / ROOM_CLEAR_DELAY);
      ctx.fillStyle = `rgba(125, 226, 173, ${a})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Pause overlay
    if (r.paused && !r.completed) drawPause(ctx);

    // Finish overlay
    if (r.completed) drawFinish(ctx, r);
  }

  // (render helpers are defined inside component so they can read PAL/optsRef)
  function drawRoomShell(ctx, s) {
    // Back wall
    ctx.fillStyle = PAL.wall;
    ctx.fillRect(0, 0, W, FLOOR_Y);
    // Wallpaper stripes (subtle)
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let x = 0; x < W; x += 24) ctx.fillRect(x, 0, 12, FLOOR_Y);
    // Baseboard
    ctx.fillStyle = PAL.wallEdge;
    ctx.fillRect(0, FLOOR_Y - 6, W, 6);
    // Ceiling line
    ctx.strokeStyle = PAL.wallEdge;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(W, 14); ctx.stroke();
    // Accent wash
    const a = s.def.accent;
    const grad = ctx.createRadialGradient(W / 2, 100, 20, W / 2, 100, 380);
    grad.addColorStop(0, a + '22');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, FLOOR_Y);
  }

  function drawLobbyDesk(ctx) {
    ctx.fillStyle = '#432a18';
    ctx.fillRect(120, 408, 160, 52);
    ctx.fillStyle = '#2c1a0c';
    ctx.fillRect(120, 408, 160, 8);
    // Bell
    ctx.fillStyle = PAL.neonAmber;
    ctx.beginPath(); ctx.arc(200, 404, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c1a0c';
    ctx.fillRect(197, 398, 6, 4);
  }

  function drawSign(ctx, sg, s) {
    ctx.save();
    if (sg.big) {
      ctx.font = '700 36px "Lora", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = s.def.accent;
      ctx.shadowBlur = 18;
      ctx.shadowColor = s.def.accent;
      ctx.fillText(sg.text, sg.x, sg.y);
      ctx.shadowBlur = 0;
    } else {
      ctx.font = '600 10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = sg.dim ? 'rgba(240,227,198,0.35)' : PAL.signInk;
      ctx.fillText(sg.text, sg.x, sg.y);
    }
    ctx.restore();
  }

  function drawExitDoor(ctx, s) {
    const e = s.def.exit;
    // Frame glow when nearing
    const p = s.player;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    const d = Math.hypot(p.x + P_W / 2 - cx, p.y + P_H / 2 - cy);
    const glow = clamp(1 - d / 220, 0, 1);
    // Door
    ctx.fillStyle = PAL.door;
    ctx.fillRect(e.x, e.y, e.w, e.h);
    // Frame
    ctx.strokeStyle = PAL.doorGlow;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3 + 0.7 * glow;
    ctx.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2);
    ctx.globalAlpha = 1;
    // Handle
    ctx.fillStyle = PAL.neonAmber;
    ctx.beginPath(); ctx.arc(e.x + e.w - 7, e.y + e.h / 2, 2, 0, Math.PI * 2); ctx.fill();
    // EXIT sign above
    ctx.font = '600 9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.neonAmber;
    ctx.globalAlpha = 0.8;
    ctx.fillText('EXIT', e.x + e.w / 2, e.y - 6);
    ctx.globalAlpha = 1;
  }

  function drawPlatform(ctx, pf, hc) {
    if (pf.kind === 'solid') {
      // Floor
      if (pf.y >= FLOOR_Y - 4) {
        ctx.fillStyle = PAL.floor;
        ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
        ctx.strokeStyle = PAL.floorLine;
        ctx.lineWidth = 1;
        for (let x = pf.x; x < pf.x + pf.w; x += 28) {
          ctx.beginPath(); ctx.moveTo(x, pf.y + 4); ctx.lineTo(x, pf.y + pf.h - 2); ctx.stroke();
        }
      } else {
        // Raised platform
        ctx.fillStyle = '#2d3e55';
        ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
        ctx.strokeStyle = PAL.wallEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(pf.x + 0.5, pf.y + 0.5, pf.w - 1, pf.h - 1);
      }
    } else if (pf.kind === 'collapse') {
      if (pf.broken) return;
      const sag = Math.sin(pf.standT * 35) * 0.6 * Math.min(1, pf.standT / (pf.delay ?? 0.3));
      ctx.save();
      ctx.translate(0, sag);
      ctx.fillStyle = pf.standT > 0.05 ? '#5a3f25' : '#3a2b1a';
      ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
      // cracks as stand time increases
      const t = pf.standT / (pf.delay ?? 0.3);
      if (t > 0.3) {
        ctx.strokeStyle = `rgba(255,255,255,${0.15 + 0.35 * t})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const cx = pf.x + 12 + i * (pf.w / 3);
          ctx.moveTo(cx, pf.y);
          ctx.lineTo(cx + 6, pf.y + pf.h);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if (pf.kind === 'bed') {
      // Bed mattress
      ctx.fillStyle = '#f0e3c6';
      ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
      // Stripes
      ctx.fillStyle = '#e84a6b';
      ctx.fillRect(pf.x + 8, pf.y + 4, pf.w - 16, 2);
      ctx.fillRect(pf.x + 8, pf.y + 10, pf.w - 16, 2);
      // Springs hint
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = pf.x + 6; x < pf.x + pf.w - 6; x += 8) {
        ctx.moveTo(x, pf.y + pf.h);
        ctx.lineTo(x, pf.y + pf.h + 4);
      }
      ctx.stroke();
    } else if (pf.kind === 'fake') {
      if (pf.broken) return;
      const t = pf.standT / (pf.delay ?? 0.18);
      // Looks like a safe stone tile but flickers slightly when stood on
      ctx.fillStyle = '#2d3e55';
      ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
      ctx.strokeStyle = PAL.wallEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(pf.x + 0.5, pf.y + 0.5, pf.w - 1, pf.h - 1);
      if (t > 0.3) {
        ctx.fillStyle = `rgba(255, 68, 85, ${t * 0.35})`;
        ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
      }
    }
  }

  function drawPlate(ctx, t, hc) {
    const stained = t.tell === 'stained';
    // Stain halo
    if (stained) {
      ctx.fillStyle = PAL.stain;
      ctx.beginPath();
      ctx.ellipse(t.x + t.w / 2, t.y + 4, t.w / 2 + 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Plate body
    ctx.fillStyle = stained ? '#3a2a20' : '#324055';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    // Rivets
    ctx.fillStyle = '#9aa0a8';
    ctx.fillRect(t.x + 2, t.y + 2, 2, 2);
    ctx.fillRect(t.x + t.w - 4, t.y + 2, 2, 2);
    // Press highlight
    if (t.state === 'active') {
      ctx.fillStyle = hc ? '#00ffff' : PAL.neonCyan;
      ctx.fillRect(t.x, t.y + t.h - 2, t.w, 2);
    }
  }

  function drawFakeSign(ctx, t) {
    ctx.save();
    ctx.font = '700 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.safe;
    ctx.fillText(t.text, t.x, t.y);
    // Small underline
    ctx.strokeStyle = PAL.safe;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(t.x - 14, t.y + 3); ctx.lineTo(t.x + 14, t.y + 3); ctx.stroke();
    ctx.restore();
  }

  function drawVending(ctx, t, hc) {
    // Machine body
    ctx.fillStyle = PAL.vendingBody;
    ctx.fillRect(t.x, t.y, t.w, t.h);
    // Darker top
    ctx.fillStyle = '#8a2828';
    ctx.fillRect(t.x, t.y, t.w, 12);
    // "Glass"
    ctx.fillStyle = PAL.vendingGlass;
    ctx.fillRect(t.x + 4, t.y + 16, t.w - 8, t.h - 36);
    // Cans in window
    ctx.fillStyle = '#e84a6b';
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        ctx.fillRect(t.x + 7 + col * 14, t.y + 22 + row * 14, 10, 10);
      }
    }
    // Slot
    ctx.fillStyle = '#000';
    ctx.fillRect(t.x + 8, t.y + t.h - 14, t.w - 16, 6);
    // Indicator light
    const armed = t.state === 'windup';
    const firing = t.state === 'firing' && t.cooldown < 0.2;
    const col = armed
      ? (Math.floor(t.animT * 10) % 2 ? PAL.warn : '#4a2a2a')
      : firing ? PAL.hazard : '#3a6a3a';
    ctx.fillStyle = hc && (armed || firing) ? '#ff00ff' : col;
    ctx.beginPath(); ctx.arc(t.x + t.w - 7, t.y + 7, 3, 0, Math.PI * 2); ctx.fill();
  }

  function drawIceMachine(ctx, t, hc) {
    ctx.fillStyle = PAL.iceBody;
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = '#8cacb8';
    ctx.fillRect(t.x, t.y, t.w, 8);
    // Vents
    ctx.strokeStyle = '#5e7883';
    ctx.lineWidth = 1;
    for (let y = t.y + 16; y < t.y + t.h - 8; y += 4) {
      ctx.beginPath(); ctx.moveTo(t.x + 6, y); ctx.lineTo(t.x + t.w - 6, y); ctx.stroke();
    }
    // Light
    const armed = t.state === 'windup' || t.state === 'firing';
    ctx.fillStyle = hc && armed ? '#ff00ff' : armed ? PAL.warn : '#3a6a3a';
    ctx.beginPath(); ctx.arc(t.x + t.w - 7, t.y + 5, 2, 0, Math.PI * 2); ctx.fill();
  }

  function drawCan(ctx, q) {
    ctx.fillStyle = '#e84a6b';
    ctx.fillRect(q.x, q.y, q.w, q.h);
    ctx.fillStyle = '#9a2438';
    ctx.fillRect(q.x, q.y, q.w, 2);
    ctx.fillRect(q.x, q.y + q.h - 2, q.w, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(q.x + 2, q.y + 4, 2, q.h - 8);
  }

  function drawIceBlock(ctx, b) {
    ctx.fillStyle = PAL.iceBlock;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#6fa5bd';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(b.x + 4, b.y + 4); ctx.lineTo(b.x + b.w - 4, b.y + b.h - 4);
    ctx.stroke();
  }

  function drawDrop(ctx, t, hc) {
    // Mount point (ceiling bracket)
    ctx.fillStyle = '#2a3550';
    ctx.fillRect(t.x - 4, 0, t.w + 8, 8);
    if (t.state === 'idle' || t.state === 'done') {
      ctx.fillStyle = '#4a5a78';
      ctx.fillRect(t.x, 4, t.w, 8);
      return;
    }
    if (t.state === 'windup') {
      // Wobble preview
      const p = t.windupT / (t.windup ?? 0.3);
      const wob = Math.sin(t.animT * 60) * 2 * p;
      ctx.fillStyle = hc ? '#ff00ff' : PAL.warn;
      ctx.globalAlpha = 0.4 + p * 0.6;
      ctx.fillRect(t.x + wob, 4, t.w, 10);
      ctx.globalAlpha = 1;
      // Warning stripes below
      ctx.strokeStyle = hc ? '#ff00ff' : PAL.warnSoft;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(t.x, 16); ctx.lineTo(t.x + t.w, 16); ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    if (t.state === 'active') {
      // The dropped object — dark blade with red band
      ctx.fillStyle = hc ? '#ff00ff' : '#1a1f2a';
      ctx.fillRect(t.dropX, t.dropY, t.w, t.h);
      ctx.fillStyle = hc ? '#00ffff' : PAL.hazard;
      ctx.fillRect(t.dropX, t.dropY + t.h - 4, t.w, 4);
    }
  }

  function drawSpikes(ctx, t, hc) {
    if (t.state === 'idle') {
      // Flat cover
      ctx.fillStyle = '#2a1e18';
      ctx.fillRect(t.x, t.y + t.h - 4, t.w, 4);
      return;
    }
    if (t.state === 'done') return;
    if (t.state === 'windup') {
      // Pre-pop warning — rumble + red tint
      const p = t.windupT / (t.windup ?? 0.28);
      ctx.fillStyle = `rgba(255, 68, 85, ${0.2 + p * 0.4})`;
      ctx.fillRect(t.x, t.y + t.h - 6, t.w, 6);
      // Stripe telegraph
      ctx.strokeStyle = hc ? '#ff00ff' : PAL.warn;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(t.x, t.y + t.h - 1); ctx.lineTo(t.x + t.w, t.y + t.h - 1); ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    // Active — spikes out
    ctx.fillStyle = hc ? '#ff00ff' : '#b7bec6';
    const count = Math.max(3, Math.floor(t.w / 10));
    const step = t.w / count;
    for (let i = 0; i < count; i++) {
      const bx = t.x + i * step;
      ctx.beginPath();
      ctx.moveTo(bx, t.y + t.h);
      ctx.lineTo(bx + step / 2, t.y + 2);
      ctx.lineTo(bx + step, t.y + t.h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = hc ? '#ff00ff88' : '#7e8b95';
    ctx.fillRect(t.x, t.y + t.h - 2, t.w, 2);
  }

  function drawPit(ctx, t) {
    ctx.fillStyle = '#000';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    const grad = ctx.createLinearGradient(0, t.y - 30, 0, t.y);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(t.x, t.y - 30, t.w, 30);
  }

  function drawPlayer(ctx, s) {
    const p = s.player;
    const blink = p.invuln > 0 && (Math.floor(p.invuln * 20) % 2 === 0);
    if (blink) return;
    const x = p.x, y = p.y;
    const sq = p.squish > 0 ? p.squish : 0;
    const h = P_H * (1 - sq * 0.25);
    const w = P_W * (1 + sq * 0.2);
    const dx = (P_W - w) / 2;
    const dy = P_H - h;

    // Legs
    ctx.fillStyle = PAL.denim;
    ctx.fillRect(x + dx + 2, y + dy + 18, 6, 10);
    ctx.fillRect(x + dx + w - 8, y + dy + 18, 6, 10);
    // Body (coat)
    ctx.fillStyle = PAL.fabric;
    ctx.fillRect(x + dx, y + dy + 10, w, 12);
    // Head
    ctx.fillStyle = PAL.skin;
    ctx.beginPath(); ctx.arc(x + P_W / 2, y + dy + 6, 7, 0, Math.PI * 2); ctx.fill();
    // Hair
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x + P_W / 2 - 7, y + dy, 14, 4);
    // Eye
    ctx.fillStyle = '#0a0d0e';
    const eyeX = x + P_W / 2 + (p.facing > 0 ? 2 : -3);
    ctx.fillRect(eyeX, y + dy + 5, 1.5, 1.5);
    // Tiny luggage (props)
    ctx.fillStyle = '#2a1a0a';
    if (p.facing > 0) ctx.fillRect(x + dx - 3, y + dy + 14, 4, 6);
    else ctx.fillRect(x + dx + w - 1, y + dy + 14, 4, 6);
    p.squish = Math.max(0, p.squish - 0.02);
  }

  function drawTopHud(ctx, s, r) {
    ctx.fillStyle = 'rgba(10,15,26,0.82)';
    ctx.fillRect(0, 0, W, 14);
    ctx.font = '600 10px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f0e3c6';
    ctx.fillText(`ROOM ${r.roomIdx + 1}/${ROOMS.length}  ·  ${s.def.title.toUpperCase()}`, 8, 10);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#c9b48a';
    ctx.fillText(`DEATHS ${r.deaths}  ·  ${fmtTime(r.elapsed)}`, W - 8, 10);
  }

  function drawRoomTip(ctx, s) {
    const age = (performance.now() - (s._enteredAt || (s._enteredAt = performance.now()))) / 1000;
    const fade = age < 1.5 ? 1 : age < 2.5 ? 1 - (age - 1.5) : 0;
    if (fade <= 0) return;
    ctx.globalAlpha = fade * 0.9;
    ctx.font = '600 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0e3c6';
    ctx.fillText(s.def.tip, W / 2, H - 18);
    ctx.globalAlpha = 1;
  }

  function drawEpitaph(ctx, s) {
    const age = s.tStatus;
    const inT = clamp(age / 0.2, 0, 1);
    const outT = clamp(1 - (age - 0.25) / 0.2, 0, 1);
    const alpha = age < 0.25 ? inT : outT;
    if (alpha <= 0) return;
    const msg = s.epitaph;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '600 14px "Lora", Georgia, serif';
    ctx.textAlign = 'center';
    const mw = ctx.measureText(msg).width + 40;
    const mx = (W - mw) / 2, my = H / 2 - 36;
    // Box
    ctx.fillStyle = 'rgba(10, 6, 18, 0.88)';
    ctx.fillRect(mx, my, mw, 54);
    ctx.strokeStyle = 'rgba(255, 77, 109, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, 53);
    // Label
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#ff4d6d';
    ctx.fillText('CHECK-OUT', W / 2, my + 18);
    // Body
    ctx.font = 'italic 13px "Lora", Georgia, serif';
    ctx.fillStyle = '#d0d6e0';
    ctx.fillText(msg, W / 2, my + 40);
    ctx.restore();
  }

  function drawPause(ctx) {
    ctx.fillStyle = 'rgba(10, 15, 26, 0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = '700 34px "Lora", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0e3c6';
    ctx.fillText('Paused', W / 2, H / 2 - 6);
    ctx.font = '600 11px "Courier New", monospace';
    ctx.fillStyle = '#c9b48a';
    ctx.fillText('P to resume  ·  R to restart room  ·  H for help', W / 2, H / 2 + 20);
  }

  function drawFinish(ctx, r) {
    ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = '700 40px "Lora", Georgia, serif';
    ctx.fillStyle = PAL.neonPink;
    ctx.fillText('CHECKOUT', W / 2, H / 2 - 50);
    ctx.font = '600 14px "Courier New", monospace';
    ctx.fillStyle = '#f0e3c6';
    ctx.fillText(`Time  ${fmtTime(r.elapsed)}`, W / 2, H / 2 - 12);
    ctx.fillText(`Deaths  ${r.deaths}`, W / 2, H / 2 + 10);
    ctx.font = '600 10px "Courier New", monospace';
    ctx.fillStyle = '#8a9ba5';
    ctx.fillText('press R for another round', W / 2, H / 2 + 48);
  }

  // Restart handler when completed
  useEffect(() => {
    const onR = (e) => {
      if (!runRef.current.completed) return;
      if (e.key === 'r' || e.key === 'R') resetRun();
    };
    window.addEventListener('keydown', onR);
    return () => window.removeEventListener('keydown', onR);
  }, []);

  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="nightcap">
      <div className="nightcap-bar">
        <span>Room <b>{ui.roomIdx + 1}/{ROOMS.length}</b></span>
        <span>Deaths <b>{ui.deaths}</b></span>
        <span>Time <b>{fmtTime(ui.elapsed)}</b></span>
        {ui.best != null && <span>Best <b>{ui.best}</b></span>}
        <button className="btn btn-ghost btn-sm" onClick={restartRoom}>Restart room</button>
        <button className="btn btn-ghost btn-sm" onClick={togglePause}>{ui.paused ? 'Resume' : 'Pause'}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setUi((u) => ({ ...u, helpOpen: !u.helpOpen }))}>Help</button>
        <button className="btn btn-ghost btn-sm" onClick={toggleMute}>{ui.muted ? 'Unmute' : 'Mute'}</button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={toggleReducedMotion}
          aria-pressed={ui.reducedMotion}
        >
          {ui.reducedMotion ? 'Motion: low' : 'Motion: full'}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={toggleHighContrast}
          aria-pressed={ui.highContrast}
        >
          {ui.highContrast ? 'Contrast: high' : 'Contrast: std'}
        </button>
      </div>
      <div className="nightcap-stage">
        <canvas ref={canvasRef} className="nightcap-canvas" width={W} height={H} tabIndex={0}/>
        {ui.helpOpen && (
          <div className="nightcap-help">
            <div className="nightcap-help-title">Check-in notes</div>
            <div className="nightcap-help-row">
              <span>Move</span><b>A / D  or  ← →  or  left stick</b>
            </div>
            <div className="nightcap-help-row">
              <span>Jump</span><b>Space / W / ↑  or  A button (hold for more air)</b>
            </div>
            <div className="nightcap-help-row">
              <span>Restart room</span><b>R  or  B button</b>
            </div>
            <div className="nightcap-help-row">
              <span>Pause</span><b>P</b>
            </div>
            <div className="nightcap-help-row">
              <span>Mute</span><b>M</b>
            </div>
            <div className="nightcap-help-row nightcap-help-tip">
              <span>·</span>
              <b>Every lethal trap warns you first. Watch the stains, listen for the hum.</b>
            </div>
          </div>
        )}
      </div>
      <div className="nightcap-hint">
        Reach the exit. 1-hit deaths. Instant respawn. Every trap has a tell. 7 rooms.
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// helpers (module-scope so useEffect hooks stay stable)
// ──────────────────────────────────────────────────────────────────────────
function fmtTime(sec) {
  if (!sec || !isFinite(sec)) sec = 0;
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const BEST_KEY = 'pgplay:nightcap:best';
function loadBest() {
  try { const v = localStorage.getItem(BEST_KEY); return v ? parseInt(v, 10) : null; } catch { return null; }
}
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch {} }
