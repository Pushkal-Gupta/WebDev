// Grudgewood — deterministic per-chunk content rules.
//
// Each chunk has an archetype that drives both its width (heightmap) and
// its trap layout (here). The archetypes:
//
//   bend     — gentle corridor with 3-4 spaced traps; the default beat.
//   clearing — wide round room; traps placed in formations (rings, lanes).
//   choke    — narrow gap; one heavy trap and a hint that it's coming.
//   gauntlet — packed corridor; 5-7 traps, fast tempo, mixed kinds.
//   fakesafe — wide and inviting; carpeted in pits with a comforting sign.
//
// All randomness is keyed by chunkIndex so a player who backtracks finds
// the exact room they just left.

import { pathOffsetAt, pathHalfWidthAt, archetypeForChunk, difficultyMultiplierFor } from './heightmap.js';

// Per-biome trap palette: weight table for which traps are allowed and how
// often they're picked. Includes the new traps (acorn, boar, vine, boulder,
// geyser, spore) where they fit thematically.
const PALETTE = {
  mosswake:  { predator: 4, whip: 3, snare: 2, mushroom: 3, stump: 1, sign: 1, acorn: 2, boar: 1, lash: 2 },
  trickster: { pit: 4, sign: 3, log: 2, mushroom: 2, snare: 2, stump: 2, spore: 2, vine: 1, mirror: 3 },
  rotbog:    { snare: 4, predator: 3, mushroom: 3, log: 2, pit: 1, vine: 3, spore: 2, geyser: 2, mirror: 2 },
  cliffside: { wind: 4, log: 3, predator: 2, whip: 2, pit: 1, boulder: 3, acorn: 2, lash: 2 },
  heart:     { embers: 4, predator: 4, log: 2, whip: 2, pit: 1, boar: 2, geyser: 3, boulder: 2, lash: 2 },
  sanctum:   { snare: 2, predator: 1, whip: 1, sign: 1, vine: 1, spore: 1, mirror: 2 },
};

// Per-chunk count caps — only used by the bend archetype; clearings,
// chokes, gauntlets, and fakesafe layouts have their own counts.
const TREES_PER_CHUNK = { min: 12, max: 18 };
const ROCKS_PER_CHUNK = { min: 2,  max: 4  };
const SHRUBS_PER_CHUNK = { min: 4, max: 8 };
const MUSHROOMS_PER_CHUNK = { min: 2, max: 4 };

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

// Build one trap entry given a kind and (x, z) — fills in opts based on
// per-kind requirements so the spawn rules don't have to know each trap's
// quirks at the call site.
function makeTrapEntry(rng, kind, x, z, px) {
  const e = { kind, x, z };
  if (kind === 'whip') {
    e.opts = { side: x < px ? 'right' : 'left' };
  } else if (kind === 'wind') {
    e.opts = { dir: x < px ? 1 : -1, force: 16 + rng() * 8 };
  } else if (kind === 'log') {
    e.opts = { dir: rng() < 0.5 ? -1 : 1, speed: 12 + rng() * 6 };
  } else if (kind === 'embers') {
    e.opts = { radius: 4 + rng() * 3, count: 3 + ((rng() * 3) | 0), period: 1.2 + rng() * 0.8 };
  } else if (kind === 'sign') {
    const side = x < px ? -1 : 1;
    const labels = ['SAFE', 'JUMP', 'EASY', 'TIP →', 'WALK', 'TRUST', 'REST HERE'];
    e.opts = { label: labels[(rng() * labels.length) | 0], face: side };
  } else if (kind === 'boar') {
    e.opts = { side: x < px ? -1 : 1 };
  } else if (kind === 'geyser') {
    e.opts = { period: 3.2 + rng() * 1.4, phase: rng() * 3.0 };
  }
  return e;
}

// Choose a side-specific trap kind (whip, predator, boar, acorn, boulder, mirror).
function pickFlankKind(rng, palette) {
  const flank = {};
  for (const k of ['whip', 'predator', 'boar', 'acorn', 'boulder', 'mirror']) {
    if (palette[k]) flank[k] = palette[k];
  }
  if (Object.keys(flank).length === 0) return pick(rng, palette);
  return pick(rng, flank);
}

// Choose a path-centerline trap (pit, snare, mushroom, log, geyser, vine, lash).
// "lash" is technically a flank-pair trap but logically lives on the path
// because both flanks belong to it; it spawns at the centerline so its
// twin trees can be auto-placed on either side.
function pickCenterKind(rng, palette) {
  const center = {};
  for (const k of ['pit', 'snare', 'mushroom', 'log', 'geyser', 'vine', 'wind', 'spore', 'embers', 'stump', 'lash']) {
    if (palette[k]) center[k] = palette[k];
  }
  if (Object.keys(center).length === 0) return pick(rng, palette);
  return pick(rng, center);
}

// ── Archetype layouts ─────────────────────────────────────────────────────

function layoutBend(rng, biome, palette, z0, length, mult = 1) {
  const traps = [];
  const count = Math.max(2, Math.round((3 + ((rng() * 3) | 0)) * mult));
  let lastZ = z0 - 6;
  for (let i = 0; i < count; i++) {
    const minStep = 7 + rng() * 3;
    const z = Math.max(lastZ + minStep, z0 + 6 + (i * (length - 12)) / count + (rng() - 0.5) * 3);
    if (z > z0 + length - 4) break;
    lastZ = z;
    const px = pathOffsetAt(z);
    const kind = pick(rng, palette);
    let x;
    if (['whip', 'predator', 'boar', 'acorn', 'boulder', 'mirror'].includes(kind)) {
      const side = rng() < 0.5 ? -1 : 1;
      x = px + side * (5 + rng() * 4);
    } else if (kind === 'wind' || kind === 'lash') {
      // Wind streaks span the path; lash is a paired-tree trap whose
      // anchor sits on the centerline.
      x = px;
    } else {
      x = px + (rng() - 0.5) * 2.0;
    }
    traps.push(makeTrapEntry(rng, kind, x, z, px));
  }
  return traps;
}

// Clearing — large round room. Three set pieces:
//   "ring of teeth"   — 5 predator/boar/acorn around the rim
//   "lanes"           — 2 parallel lines of pits/geysers
//   "centerpiece"     — single big trap in the middle (boulder), flanked threats
function layoutClearing(rng, biome, palette, z0, length) {
  const traps = [];
  const cz = z0 + length / 2;
  const px = pathOffsetAt(cz);
  const piece = ['ring', 'lanes', 'centerpiece'][(rng() * 3) | 0];

  if (piece === 'ring') {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + rng() * 0.2;
      const r = 8 + rng() * 1.5;
      const x = px + Math.sin(ang) * r;
      const z = cz + Math.cos(ang) * r;
      const kind = pickFlankKind(rng, palette);
      traps.push(makeTrapEntry(rng, kind, x, z, px));
    }
    // Plus one taunting sign in the middle.
    if (palette.sign) traps.push(makeTrapEntry(rng, 'sign', px, cz, px));
  } else if (piece === 'lanes') {
    for (let lane = 0; lane < 2; lane++) {
      const offX = (lane === 0 ? -3 : 3);
      for (let j = 0; j < 4; j++) {
        const z = z0 + 8 + (length - 16) * (j / 3);
        const kind = pickCenterKind(rng, palette);
        traps.push(makeTrapEntry(rng, kind, px + offX, z, px));
      }
    }
  } else {
    // Centerpiece — boulder if available, else log.
    const center = palette.boulder ? 'boulder' : 'log';
    traps.push(makeTrapEntry(rng, center, px, cz, px));
    // Two flanks at the entry and exit.
    for (const ez of [z0 + 6, z0 + length - 6]) {
      const kind = pickFlankKind(rng, palette);
      const side = rng() < 0.5 ? -1 : 1;
      traps.push(makeTrapEntry(rng, kind, px + side * 6, ez, px));
    }
  }
  return traps;
}

function layoutChoke(rng, biome, palette, z0, length) {
  const traps = [];
  const z = z0 + length / 2;
  const px = pathOffsetAt(z);
  // Sign on entry, nasty trap on the gap.
  if (palette.sign) traps.push(makeTrapEntry(rng, 'sign', px - 2, z - 6, px));
  const heavy = ['predator', 'boulder', 'whip', 'log'].filter((k) => palette[k]);
  const kind = heavy.length ? heavy[(rng() * heavy.length) | 0] : pickCenterKind(rng, palette);
  traps.push(makeTrapEntry(rng, kind, px, z, px));
  return traps;
}

function layoutGauntlet(rng, biome, palette, z0, length, mult = 1) {
  const traps = [];
  const count = Math.max(5, Math.round((6 + ((rng() * 2) | 0)) * mult));
  for (let i = 0; i < count; i++) {
    const z = z0 + 4 + (length - 10) * (i / (count - 1)) + (rng() - 0.5) * 2;
    const px = pathOffsetAt(z);
    // Alternate flank/center for tempo.
    const useFlank = (i + ((rng() * 2) | 0)) % 2 === 0;
    const kind = useFlank ? pickFlankKind(rng, palette) : pickCenterKind(rng, palette);
    let x;
    if (['whip', 'predator', 'boar', 'acorn', 'boulder', 'mirror'].includes(kind)) {
      const side = rng() < 0.5 ? -1 : 1;
      x = px + side * (5 + rng() * 4);
    } else if (kind === 'lash') {
      x = px;
    } else {
      x = px + (rng() - 0.5) * 2.0;
    }
    traps.push(makeTrapEntry(rng, kind, x, z, px));
  }
  return traps;
}

function layoutFakeSafe(rng, biome, palette, z0, length) {
  const traps = [];
  const px0 = pathOffsetAt(z0 + 4);
  // Welcoming sign.
  if (palette.sign) traps.push({ kind: 'sign', x: px0 - 2, z: z0 + 6, opts: { label: 'REST HERE', face: -1 } });
  // Carpet of pits across the wide centre.
  const grid = 5;
  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      if (rng() < 0.45) continue;
      const z = z0 + 12 + (length - 22) * (i / (grid - 1));
      const px = pathOffsetAt(z);
      const x = px + (j - (grid - 1) / 2) * 2.5;
      traps.push({ kind: 'pit', x, z });
    }
  }
  // One predator at the back, looking smug.
  const pz = z0 + length - 6;
  const ppx = pathOffsetAt(pz);
  if (palette.predator) traps.push({ kind: 'predator', x: ppx, z: pz });
  return traps;
}

const LAYOUTS = {
  bend: layoutBend,
  clearing: layoutClearing,
  choke: layoutChoke,
  gauntlet: layoutGauntlet,
  fakesafe: layoutFakeSafe,
};

// ── Decoration: trees, shrubs, rocks, idle mushrooms ──────────────────────

function spawnDecor(rng, chunkIndex, biome, z0, length) {
  const props = [];

  // Trees on flanks — kept well clear of the corridor so the chase camera
  // is never visually blocked.
  const treeCount = rangeInt(rng, TREES_PER_CHUNK);
  for (let i = 0; i < treeCount; i++) {
    const z = z0 + rng() * length;
    const px = pathOffsetAt(z);
    const halfW = pathHalfWidthAt(z);
    const side = rng() < 0.5 ? -1 : 1;
    const x = px + side * (halfW + 2.5 + rng() * 8);
    const variant = (rng() * 3) | 0;
    const scale = 0.85 + rng() * 0.55;
    const kind = biome.id === 'cliffside' ? (rng() < 0.6 ? 'pine' : 'tree') : 'tree';
    props.push({ kind, x, z, scale, variant });
  }

  const shrubCount = rangeInt(rng, SHRUBS_PER_CHUNK);
  for (let i = 0; i < shrubCount; i++) {
    const z = z0 + rng() * length;
    const px = pathOffsetAt(z);
    const halfW = pathHalfWidthAt(z);
    const side = rng() < 0.5 ? -1 : 1;
    const x = px + side * (halfW - 0.5 + rng() * 4);
    props.push({ kind: 'shrub', x, z, scale: 0.7 + rng() * 0.5 });
  }

  const rockCount = rangeInt(rng, ROCKS_PER_CHUNK);
  for (let i = 0; i < rockCount; i++) {
    const z = z0 + rng() * length;
    const px = pathOffsetAt(z);
    const halfW = pathHalfWidthAt(z);
    const side = rng() < 0.5 ? -1 : 1;
    const x = px + side * (halfW + 2 + rng() * 9);
    props.push({ kind: 'rock', x, z, scale: 0.8 + rng() * 0.7 });
  }

  const mushroomCount = rangeInt(rng, MUSHROOMS_PER_CHUNK);
  const capColor = biome.accent.getStyle();
  for (let i = 0; i < mushroomCount; i++) {
    const z = z0 + rng() * length;
    const px = pathOffsetAt(z);
    const halfW = pathHalfWidthAt(z);
    const x = px + (rng() - 0.5) * (halfW * 1.6);
    props.push({ kind: 'mushroom', x, z, scale: 0.7 + rng() * 0.6, capColor });
  }

  return props;
}

// ── Public entry point ───────────────────────────────────────────────────

export function spawnChunkContent(chunkIndex, biome, chunkLength) {
  const rng = makeRng(chunkIndex * 9301 + 49297);
  const z0 = chunkIndex * chunkLength;
  const palette = PALETTE[biome.id] || PALETTE.mosswake;
  const archetype = archetypeForChunk(chunkIndex);

  // Tutorial chunks get a forced calm bend so first-time players have room.
  // Difficulty multiplier scales trap counts in the bend and gauntlet
  // archetypes so late-game chunks pack more pressure without changing the
  // structural vocabulary of the level.
  const mult = difficultyMultiplierFor(chunkIndex);
  const layoutFn = chunkIndex <= 0 ? layoutBend : (LAYOUTS[archetype] || layoutBend);
  const traps = layoutFn(rng, biome, palette, z0, chunkLength, mult);
  const props = spawnDecor(rng, chunkIndex, biome, z0, chunkLength);
  return { traps, props, archetype };
}
