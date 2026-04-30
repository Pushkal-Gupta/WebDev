// Grudgewood — global terrain heightmap, serpentine path, and per-chunk
// archetypes that reshape the walkable corridor.
//
// Why pure functions: every query (terrain renderer, player physics, prop
// placement, trap targeting) all answer the same world-space question. If
// any of them disagreed, the corridor would have invisible walls or leaky
// floors. Every piece of game state defers to the math here.

import { CHUNK_LENGTH } from './chunkConstants.js';

// ── Corridor width policy ──────────────────────────────────────────────────
// Different chunk archetypes feel different to walk through:
//   bend     — the default corridor; mild S-curves, room to breathe.
//   clearing — opens into a round room: traps fight in formation here.
//   choke    — narrows to a tight gap; usually one big trap.
//   gauntlet — corridor-wide, packed with traps and very little dead air.
//   fakesafe — looks like a clearing, lies about it (carpeted in pits).
//
// The pool is *biased* by chunk index so early chunks lean on bends and
// the forest gradually develops a taste for gauntlets and fakesafes the
// deeper the player goes. Tutorial chunks (0-2) are always bends.
const EARLY_POOL = ['bend', 'bend', 'bend', 'bend', 'choke', 'clearing'];
const MID_POOL   = ['bend', 'bend', 'clearing', 'choke', 'gauntlet', 'fakesafe'];
const LATE_POOL  = ['bend', 'clearing', 'gauntlet', 'gauntlet', 'choke', 'fakesafe', 'fakesafe'];

const ARCH_HALF_WIDTH = {
  bend:     7.0,
  clearing: 11.0,
  choke:    3.6,
  gauntlet: 7.0,
  fakesafe: 10.0,
};

const HARD_BARRIER = 1.2;        // extra metres outside the corridor where the wall actually starts
const FADE = 8;                  // metres over which width morphs at chunk seams

// Mulberry32 — tiny, deterministic PRNG keyed by chunk index. The same
// index always picks the same archetype, so a player who backtracks finds
// the same room they just left.
function chunkRng(index) {
  let s = (index * 9301 + 49297) >>> 0;
  s = s ^ 0xb5297a4d;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function archetypeForChunk(chunkIndex) {
  // First three chunks are guaranteed bends — the player needs a runway to
  // learn movement before the forest starts setting traps in patterns.
  if (chunkIndex <= 2) return 'bend';
  // Tier the pool by depth so difficulty rises with distance, not biome.
  // Each tier roughly maps to a multiple of 64m: <512m gentle, <1280m mixed,
  // beyond that the forest tightens up and gauntlets become the default.
  const pool = chunkIndex < 8 ? EARLY_POOL : chunkIndex < 20 ? MID_POOL : LATE_POOL;
  return pool[Math.floor(chunkRng(chunkIndex)() * pool.length)];
}

// Used by spawn.js to scale per-chunk trap counts. Returns a multiplier
// in [1, 1.6] based on depth so late-game chunks pack more pressure.
export function difficultyMultiplierFor(chunkIndex) {
  if (chunkIndex <= 2) return 0.85;            // calm tutorial
  return Math.min(1.6, 1 + (chunkIndex - 3) * 0.04);
}

// Continuous half-width at world Z. Blends between the current chunk's
// archetype and the next chunk's over the last FADE metres so the path
// breathes wider/narrower instead of clipping.
export function pathHalfWidthAt(z) {
  const idx = Math.floor(z / CHUNK_LENGTH);
  const here = ARCH_HALF_WIDTH[archetypeForChunk(idx)] || ARCH_HALF_WIDTH.bend;
  const there = ARCH_HALF_WIDTH[archetypeForChunk(idx + 1)] || ARCH_HALF_WIDTH.bend;
  const local = z - idx * CHUNK_LENGTH;
  if (local < CHUNK_LENGTH - FADE) return here;
  const t = (local - (CHUNK_LENGTH - FADE)) / FADE;
  return here + (there - here) * t;
}

// ── Path centerline ────────────────────────────────────────────────────────
// Three sins of different periods so the path never feels like a single
// sweep. Pure function of z so adjacent chunks line up exactly.
export function pathOffsetAt(z) {
  return Math.sin(z * 0.045) * 4.2 + Math.sin(z * 0.018) * 2.8 + Math.sin(z * 0.083) * 1.0;
}

// ── Terrain noise ──────────────────────────────────────────────────────────
function rawNoise(x, y) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + 37.71) * 43758.5453;
  return s - Math.floor(s);
}
function smooth(t) { return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }
function valueNoise(x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const a = rawNoise(x0, y0);
  const b = rawNoise(x0 + 1, y0);
  const c = rawNoise(x0, y0 + 1);
  const d = rawNoise(x0 + 1, y0 + 1);
  const u = smooth(fx), v = smooth(fy);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

// Ground height at world (x, z). Inside the corridor the floor is flat at
// near-zero with subtle grain; outside, hills rise gradually so the eye
// reads "the path is the safe place" without ever boxing the camera.
export function sampleHeight(x, z) {
  const px = pathOffsetAt(z);
  const dist = Math.abs(x - px);
  const halfWidth = pathHalfWidthAt(z);
  const grain = (valueNoise(x * 0.55, z * 0.55) - 0.5) * 0.18;
  if (dist < halfWidth) return -0.04 + grain * 0.4;
  const flank = dist - halfWidth - 0.5;
  const wobble = (valueNoise(x * 0.18, z * 0.18) - 0.5) * 1.4;
  const cliff = Math.min(7.5, Math.max(0, flank) * 0.7);
  return cliff + wobble + grain;
}

// Normalised distance into the cliff barrier — 0 inside the corridor, 1 at
// the wall. Player physics uses this to apply a smooth restoring force.
export function barrierPressureAt(x, z) {
  const dist = Math.abs(x - pathOffsetAt(z));
  const halfWidth = pathHalfWidthAt(z);
  if (dist <= halfWidth) return 0;
  const into = dist - halfWidth;
  return Math.min(1, into / HARD_BARRIER);
}

export function noise2D(x, z) { return valueNoise(x, z); }

export const HEIGHTMAP = { HARD_BARRIER, FADE, ARCH_HALF_WIDTH };
