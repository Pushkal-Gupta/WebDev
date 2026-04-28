// Grudgewood — deterministic spawn rules for chunk content.
//
// Given a chunkIndex and biome, emits a list of prop and trap entries with
// world-space (x, z) coordinates. The same chunkIndex always produces the
// same content so re-loading a chunk you've backed off from looks identical.

import { pathOffsetAt } from './heightmap.js';

// Per-biome trap palette: which traps are allowed and their relative weights.
// Mosswake favors the signature predator/whip combo; cliffside is windy and
// rolling-log heavy; heart rains embers and predators; sanctum is calm.
const PALETTE = {
  mosswake:  { predator: 4, whip: 3, snare: 2, mushroom: 3, stump: 1, sign: 1 },
  trickster: { pit: 4, sign: 3, log: 2, mushroom: 2, snare: 2, stump: 2 },
  rotbog:    { snare: 4, predator: 3, mushroom: 3, log: 2, pit: 1 },
  cliffside: { wind: 5, log: 3, predator: 2, whip: 2, pit: 1 },
  heart:     { embers: 5, predator: 4, log: 3, whip: 2, pit: 1 },
  sanctum:   { snare: 2, predator: 1, whip: 1, sign: 1 },
};

// Per-chunk count caps: floors and headroom for variety.
const TRAPS_PER_CHUNK = { min: 4, max: 7 };
const TREES_PER_CHUNK = { min: 14, max: 22 };
const ROCKS_PER_CHUNK = { min: 2,  max: 5  };
const SHRUBS_PER_CHUNK = { min: 5, max: 10 };
const MUSHROOMS_PER_CHUNK = { min: 2, max: 5 };

// Tiny mulberry32 PRNG so each chunk index has a stable random sequence.
function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, weights) {
  let total = 0;
  for (const k of Object.keys(weights)) total += weights[k];
  let r = rng() * total;
  for (const k of Object.keys(weights)) {
    r -= weights[k];
    if (r <= 0) return k;
  }
  return Object.keys(weights)[0];
}

function rangeInt(rng, { min, max }) {
  return min + Math.floor(rng() * (max - min + 1));
}

// Returns { traps:[{kind,x,z,opts}], props:[{kind,x,z,scale,variant,capColor}] }
export function spawnChunkContent(chunkIndex, biome, chunkLength) {
  const rng = makeRng(chunkIndex * 9301 + 49297);
  const z0 = chunkIndex * chunkLength;
  const z1 = z0 + chunkLength;
  const palette = PALETTE[biome.id] || PALETTE.mosswake;

  const traps = [];
  const props = [];

  // --- Traps: cluster along the path corridor with a minimum spacing so
  // they don't overlap in a single readable beat.
  const trapCount = rangeInt(rng, TRAPS_PER_CHUNK);
  let lastZ = z0 - 8;
  for (let i = 0; i < trapCount; i++) {
    const minStep = 6 + rng() * 4;
    const z = Math.max(lastZ + minStep, z0 + 4 + (i * (chunkLength - 8)) / trapCount + (rng() - 0.5) * 4);
    if (z > z1 - 4) break;
    lastZ = z;
    const px = pathOffsetAt(z);
    const kind = pick(rng, palette);
    const entry = { kind, z };

    // Per-kind placement: traps that snake across the path sit on the
    // corridor; ambush traps lurk to one side so the player has a chance
    // to read them.
    if (kind === 'whip' || kind === 'predator') {
      const side = rng() < 0.5 ? -1 : 1;
      entry.x = px + side * (5 + rng() * 4);
      if (kind === 'whip') entry.opts = { side: side > 0 ? 'left' : 'right' };
    } else if (kind === 'wind') {
      entry.x = px;
      entry.opts = { dir: rng() < 0.5 ? -1 : 1, force: 16 + rng() * 10 };
    } else if (kind === 'log') {
      entry.x = px;
      entry.opts = { dir: rng() < 0.5 ? -1 : 1, speed: 12 + rng() * 6 };
    } else if (kind === 'embers') {
      entry.x = px;
      entry.opts = { radius: 4 + rng() * 3, count: 3 + ((rng() * 3) | 0), period: 1.2 + rng() * 0.8 };
    } else if (kind === 'sign') {
      const side = rng() < 0.5 ? -1 : 1;
      entry.x = px + side * 2.6;
      const labels = ['SAFE', 'JUMP', 'EASY', 'TIP →', 'WALK', 'TRUST'];
      entry.opts = { label: labels[(rng() * labels.length) | 0], face: side };
    } else {
      // pit / snare / mushroom / stump — sit on the path
      entry.x = px + (rng() - 0.5) * 2.2;
    }

    traps.push(entry);
  }

  // --- Trees: dense thicket on both flanks, never on the path itself.
  const treeCount = rangeInt(rng, TREES_PER_CHUNK);
  for (let i = 0; i < treeCount; i++) {
    const z = z0 + rng() * chunkLength;
    const px = pathOffsetAt(z);
    const side = rng() < 0.5 ? -1 : 1;
    const x = px + side * (7 + rng() * 9);
    const variant = (rng() * 3) | 0;
    const scale = 0.85 + rng() * 0.55;
    const kind = biome.id === 'cliffside' ? (rng() < 0.6 ? 'pine' : 'tree') : 'tree';
    props.push({ kind, x, z, scale, variant });
  }

  // --- Shrubs: dot the corridor edges so it doesn't look bare.
  const shrubCount = rangeInt(rng, SHRUBS_PER_CHUNK);
  for (let i = 0; i < shrubCount; i++) {
    const z = z0 + rng() * chunkLength;
    const px = pathOffsetAt(z);
    const side = rng() < 0.5 ? -1 : 1;
    const x = px + side * (5 + rng() * 6);
    props.push({ kind: 'shrub', x, z, scale: 0.7 + rng() * 0.5 });
  }

  // --- Rocks: scattered, can sit further into the hills.
  const rockCount = rangeInt(rng, ROCKS_PER_CHUNK);
  for (let i = 0; i < rockCount; i++) {
    const z = z0 + rng() * chunkLength;
    const px = pathOffsetAt(z);
    const side = rng() < 0.5 ? -1 : 1;
    const x = px + side * (7 + rng() * 11);
    props.push({ kind: 'rock', x, z, scale: 0.8 + rng() * 0.7 });
  }

  // --- Mushrooms: visual seasoning. Color follows biome accent so the
  // palette stays cohesive.
  const mushroomCount = rangeInt(rng, MUSHROOMS_PER_CHUNK);
  const capColor = biome.accent.getStyle();
  for (let i = 0; i < mushroomCount; i++) {
    const z = z0 + rng() * chunkLength;
    const px = pathOffsetAt(z);
    const x = px + (rng() - 0.5) * 14;
    props.push({ kind: 'mushroom', x, z, scale: 0.7 + rng() * 0.6, capColor });
  }

  return { traps, props };
}
