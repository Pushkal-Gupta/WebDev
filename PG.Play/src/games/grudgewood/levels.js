// Grudgewood — authored level data. Each segment lists props, traps, and
// scripted decorations. Coordinates are local to the segment (z grows
// "forward"; x is the path-perpendicular axis). The segment manager places
// segments end-to-end and translates coordinates into world space.

// Trap kinds and their constructor names.
//   whip      → BranchWhip
//   snare     → RootSnare
//   mushroom  → MushroomPop
//   log       → RollingLog
//   pit       → HiddenPit
//   predator  → PredatorTree
//   stump     → FakeStump
//   embers    → EmberRain
//   wind      → WindGust
//   sign      → LyingSign
//
// Each trap entry: { kind, x, z, y?, opts? }
// Each prop entry: { kind, x, z, scale?, variant?, capColor? }

import { TERRAIN_SEG_LEN } from './terrain.js';

// A few stock decoration scatters used inside many segments.
function scatter(kind, n, opts = {}) {
  const out = [];
  const { xMin = -14, xMax = 14, zMin = 4, zMax = TERRAIN_SEG_LEN - 4, scaleMin = 0.85, scaleMax = 1.25, avoidCenter = 5 } = opts;
  for (let i = 0; i < n; i++) {
    let x, attempts = 0;
    do {
      x = xMin + Math.random() * (xMax - xMin);
      attempts++;
    } while (Math.abs(x) < avoidCenter && attempts < 6);
    const z = zMin + Math.random() * (zMax - zMin);
    const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
    const variant = (Math.random() * 3) | 0;
    out.push({ kind, x, z, scale, variant });
  }
  return out;
}

const checkpointAt = (z, x = 0) => ({ kind: 'checkpoint', x, z });

// Helper: a "thicket" — alternating trees and shrubs along the path edges.
function thicket(zStart, zEnd, density = 1) {
  const out = [];
  for (let z = zStart; z < zEnd; z += 4 / density) {
    const sideX = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 6);
    out.push({ kind: 'tree', x: sideX, z: z + Math.random() * 2, scale: 0.9 + Math.random() * 0.5, variant: (Math.random() * 3) | 0 });
    if (Math.random() < 0.7) {
      out.push({ kind: 'shrub', x: -sideX * (0.5 + Math.random() * 0.6), z: z + Math.random() * 2, scale: 0.8 + Math.random() * 0.5 });
    }
  }
  return out;
}

// ─── MOSSWAKE ──────────────────────────────────────────────────────────────
const mosswake = [
  {
    intro: 'Mosswake — Walk Home',
    biome: 'mosswake',
    props: [
      ...thicket(2, 78, 1.0),
      ...scatter('rock', 5),
      ...scatter('mushroom', 4, { capColor: '#b22' }),
    ],
    traps: [
      { kind: 'sign', x: -3, z: 8, opts: { label: 'WELCOME', face: 1 } },
      { kind: 'predator', x: -9, z: 18 },
      { kind: 'whip', x: -7, z: 16, opts: { side: 'right' } },
      { kind: 'snare', x: 1, z: 26 },
      { kind: 'mushroom', x: -1, z: 34, opts: { capColor: '#c33' } },
      { kind: 'predator', x: 9, z: 42 },
      { kind: 'log', x: 0, z: 44, opts: { dir: -1 } },
      { kind: 'sign', x: 3, z: 52, opts: { label: 'SAFE', face: -1 } },
      { kind: 'whip', x: 7, z: 56, opts: { side: 'left' } },
      { kind: 'predator', x: -10, z: 64 },
      checkpointAt(70),
    ],
  },
  {
    intro: 'Mosswake — The Bend',
    biome: 'mosswake',
    props: [
      ...thicket(2, 78, 1.2),
      ...scatter('rock', 6),
      ...scatter('stump', 3),
      ...scatter('mushroom', 5, { capColor: '#c33' }),
    ],
    traps: [
      { kind: 'snare', x: -2, z: 12 },
      { kind: 'predator', x: 8, z: 22 },
      { kind: 'stump', x: 0, z: 32 },
      { kind: 'pit', x: 0, z: 40 },
      { kind: 'predator', x: -9, z: 48 },
      { kind: 'log', x: 0, z: 50, opts: { dir: 1 } },
      { kind: 'mushroom', x: 2, z: 58 },
      { kind: 'whip', x: -7, z: 64, opts: { side: 'right' } },
      { kind: 'predator', x: 10, z: 68 },
      checkpointAt(74),
    ],
  },
];

// ─── TRICKSTER ─────────────────────────────────────────────────────────────
const trickster = [
  {
    intro: 'Trickster Grove — Cheerful Lies',
    biome: 'trickster',
    props: [
      ...thicket(2, 78, 0.9),
      ...scatter('mushroom', 7, { capColor: '#3aa' }),
      ...scatter('rock', 4),
    ],
    traps: [
      { kind: 'sign', x: -3, z: 6, opts: { label: 'EASY' } },
      { kind: 'pit', x: 0, z: 14 },
      { kind: 'sign', x: 3, z: 22, opts: { label: 'TIP →' } },
      { kind: 'log', x: 0, z: 30, opts: { dir: -1, speed: 16 } },
      { kind: 'snare', x: -2, z: 40 },
      { kind: 'mushroom', x: 1, z: 48 },
      { kind: 'whip', x: 7, z: 56, opts: { side: 'left' } },
      { kind: 'sign', x: 0, z: 60, opts: { label: 'JUMP' } },
      { kind: 'pit', x: 0, z: 64 },
      checkpointAt(74),
    ],
  },
  {
    intro: 'Trickster Grove — The Picnic',
    biome: 'trickster',
    props: [
      ...thicket(2, 78, 1.1),
      ...scatter('stump', 4),
      ...scatter('mushroom', 6, { capColor: '#3aa' }),
    ],
    traps: [
      { kind: 'stump', x: -3, z: 12 },
      { kind: 'stump', x: 3, z: 16 },
      { kind: 'predator', x: -8, z: 26 },
      { kind: 'log', x: 0, z: 36, opts: { dir: 1 } },
      { kind: 'log', x: 0, z: 42, opts: { dir: -1 } },
      { kind: 'snare', x: 2, z: 52 },
      { kind: 'sign', x: 0, z: 60, opts: { label: 'NEAR HOME' } },
      { kind: 'whip', x: -7, z: 64, opts: { side: 'right' } },
      checkpointAt(74),
    ],
  },
];

// ─── ROTBOG ────────────────────────────────────────────────────────────────
const rotbog = [
  {
    intro: 'The Rotbog — Sluggish',
    biome: 'rotbog',
    props: [
      ...thicket(2, 78, 0.9),
      ...scatter('mushroom', 6, { capColor: '#5b9' }),
      ...scatter('rock', 3),
      ...scatter('stump', 3),
    ],
    traps: [
      { kind: 'snare', x: -2, z: 10 },
      { kind: 'snare', x:  2, z: 16 },
      { kind: 'predator', x: 7, z: 26 },
      { kind: 'mushroom', x: -1, z: 34, opts: { capColor: '#5b9' } },
      { kind: 'predator', x: -9, z: 40 },
      { kind: 'log', x: 0, z: 44, opts: { dir: -1, speed: 11 } },
      { kind: 'pit', x: 0, z: 54 },
      { kind: 'whip', x: 7, z: 60, opts: { side: 'left' } },
      { kind: 'predator', x: 10, z: 66 },
      checkpointAt(72),
    ],
  },
  {
    intro: 'The Rotbog — Patient',
    biome: 'rotbog',
    props: [
      ...thicket(2, 78, 1.1),
      ...scatter('mushroom', 8, { capColor: '#5b9' }),
    ],
    traps: [
      { kind: 'predator', x: -8, z: 12 },
      { kind: 'predator', x:  8, z: 22 },
      { kind: 'snare', x: 0, z: 32 },
      { kind: 'mushroom', x: -2, z: 40 },
      { kind: 'mushroom', x:  2, z: 44 },
      { kind: 'predator', x: -10, z: 50 },
      { kind: 'log', x: 0, z: 52, opts: { dir: 1 } },
      { kind: 'pit', x: 0, z: 62 },
      { kind: 'predator', x: 9, z: 66 },
      checkpointAt(72),
    ],
  },
];

// ─── CLIFFSIDE ─────────────────────────────────────────────────────────────
const cliffside = [
  {
    intro: 'Cliffside Pines — Wind',
    biome: 'cliffside',
    props: [
      ...thicket(2, 78, 0.7),
      ...scatter('pine', 8),
      ...scatter('rock', 5),
    ],
    traps: [
      { kind: 'wind', x: 0, z: 12, opts: { dir: 1, force: 18 } },
      { kind: 'log', x: 0, z: 22, opts: { dir: -1 } },
      { kind: 'wind', x: 0, z: 32, opts: { dir: -1, force: 18 } },
      { kind: 'whip', x: 8, z: 42, opts: { side: 'left' } },
      { kind: 'snare', x: 0, z: 52 },
      { kind: 'wind', x: 0, z: 60, opts: { dir: 1, force: 22 } },
      { kind: 'pit', x: 0, z: 66 },
      checkpointAt(74),
    ],
  },
  {
    intro: 'Cliffside Pines — Above the Drop',
    biome: 'cliffside',
    props: [
      ...thicket(2, 78, 0.6),
      ...scatter('pine', 10),
    ],
    traps: [
      { kind: 'wind', x: 0, z: 10, opts: { dir: 1, force: 24 } },
      { kind: 'predator', x: -8, z: 20 },
      { kind: 'wind', x: 0, z: 30, opts: { dir: -1, force: 22 } },
      { kind: 'log', x: 0, z: 40, opts: { dir: 1 } },
      { kind: 'whip', x: -7, z: 50, opts: { side: 'right' } },
      { kind: 'wind', x: 0, z: 58, opts: { dir: 1, force: 26 } },
      { kind: 'pit', x: 0, z: 66 },
      checkpointAt(72),
    ],
  },
];

// ─── HEART ─────────────────────────────────────────────────────────────────
const heart = [
  {
    intro: 'The Heart — Embers',
    biome: 'heart',
    props: [
      ...thicket(2, 78, 1.0),
      ...scatter('rock', 6),
      ...scatter('mushroom', 4, { capColor: '#ff5a1a' }),
    ],
    traps: [
      { kind: 'embers', x: 0, z: 16, opts: { radius: 5, count: 3, period: 1.6 } },
      { kind: 'predator', x: -9, z: 22 },
      { kind: 'predator', x: 7, z: 30 },
      { kind: 'embers', x: 0, z: 40, opts: { radius: 6, count: 4, period: 1.4 } },
      { kind: 'predator', x: 10, z: 48 },
      { kind: 'log', x: 0, z: 50, opts: { dir: -1, speed: 16 } },
      { kind: 'whip', x: -7, z: 58, opts: { side: 'right' } },
      { kind: 'pit', x: 0, z: 64 },
      checkpointAt(72),
    ],
  },
  {
    intro: 'The Heart — Final Pyre',
    biome: 'heart',
    props: [
      ...thicket(2, 78, 1.0),
      ...scatter('rock', 8),
    ],
    traps: [
      { kind: 'embers', x: 0, z: 14, opts: { radius: 6, count: 4, period: 1.2 } },
      { kind: 'predator', x: -8, z: 22 },
      { kind: 'predator', x:  8, z: 32 },
      { kind: 'embers', x: 0, z: 42, opts: { radius: 7, count: 5, period: 1.0 } },
      { kind: 'predator', x: -10, z: 48 },
      { kind: 'log', x: 0, z: 52, opts: { dir: -1, speed: 18 } },
      { kind: 'snare', x: 0, z: 60 },
      { kind: 'predator', x: 9, z: 64 },
      checkpointAt(72),
    ],
  },
];

// ─── SANCTUM ───────────────────────────────────────────────────────────────
const sanctum = [
  {
    intro: 'Axe Sanctum',
    biome: 'sanctum',
    props: [
      ...thicket(2, 78, 0.6),
      ...scatter('rock', 6),
    ],
    traps: [
      { kind: 'snare', x: 0, z: 14 },
      { kind: 'predator', x: 7, z: 24 },
      { kind: 'whip', x: -7, z: 34, opts: { side: 'right' } },
      { kind: 'pit', x: 0, z: 46 },
      { kind: 'log', x: 0, z: 56, opts: { dir: 1 } },
      // The reward — a glowing axe altar.
      { kind: 'altar', x: 0, z: 70 },
      checkpointAt(74),
    ],
  },
];

// Order matters — biome progression follows array order.
export const SEGMENTS = [
  ...mosswake,
  ...trickster,
  ...rotbog,
  ...cliffside,
  ...heart,
  ...sanctum,
];

export const BIOME_OF = (idx) => (SEGMENTS[idx]?.biome || 'mosswake');

export const SEGMENTS_BY_BIOME = SEGMENTS.reduce((acc, s, i) => {
  if (!acc[s.biome]) acc[s.biome] = [];
  acc[s.biome].push(i);
  return acc;
}, {});

// Secret hat anchor markers — picked up by the segment manager. Placed off
// the obvious path to reward exploration. Each is a small invisible volume.
export const SECRETS = [
  { id: 'bucket',  segmentIndex: 0, x: -14, z: 22, hat: 'bucket' },
  { id: 'picnic',  segmentIndex: 3, x: 12,  z: 50, hat: 'picnic' },
  { id: 'antlers', segmentIndex: 7, x: -13, z: 30, hat: 'antlers' },
];
