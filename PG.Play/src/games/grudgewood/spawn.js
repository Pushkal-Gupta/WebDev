// Grudgewood — per-cell content rules for the maze.
//
// Each cell gets a trap layout based on which sides have doors. The
// shape of the room (corridor, L-corner, T-junction, open room, dead-end)
// is what the layout reacts to — the same trap kinds that worked in the
// old corridor still apply here, but the placements respect the local
// geometry. Difficulty is tied to the cell's radius from origin via
// difficultyForCell, so deeper cells pack more pressure.
//
// All randomness is deterministic from the cell's seed so a player who
// backtracks finds the same room they just left.

import { CELL_SIZE, cellOrigin, cellCenter, cellWalls, cellSeed } from './mazeGrid.js';
import { difficultyForCell } from './heightmap.js';
import { flagLevelInCell } from './flags.js';

// ── Hand-authored first level (cells (0, 1)..(0, 5)) ─────────────────────
// Following the trees-hate-you design framework — orientation, first
// betrayal, rule teaching, rule variation, relief pocket, multi-trap mix.
// World-space coordinates. Every cell along the spine in the first level
// is a vertical corridor (S+N open by spine guarantee), so traps are
// authored along the centerline at z = cellOrigin + offset.
//
// (0, 0) is spawn — handled by the sanctuary branch below; no traps.
// (0, 1) — First Betrayal: a sign labelled SAFE in front of a hidden pit.
// (0, 2) — Rule Teaching: a single Branch Whip with audible windup.
// (0, 3) — Rule Variation: a Predator Tree on the right flank.
// (0, 4) — Relief Pocket: no traps, just decor (handled by closure).
// (0, 5) — Multi-Trap: whip and predator on opposite flanks.
const SCRIPTED_CELLS = {
  // Level 1 (cells 0,1 → 0,5, ending at flag 1 at 0,6). Teaching arc.
  '0,1': () => [
    { kind: 'sign', x: 11, z: 30, opts: { label: 'SAFE', face: 1 } },
    { kind: 'pit',  x: 12, z: 39 },
  ],
  '0,2': () => [
    { kind: 'whip', x: 5, z: 60, opts: { side: 'right' } },
  ],
  '0,3': () => [
    { kind: 'predator', x: 18, z: 84 },
  ],
  '0,4': () => [],   // intentional relief
  '0,5': () => [
    { kind: 'whip',     x: 4,  z: 130, opts: { side: 'right' } },
    { kind: 'predator', x: 18, z: 138 },
  ],
  // Level 2 (cells 0,7 → 0,11, ending at flag 2 at 0,12). Introduces
  // the falling tree, erupting tree, and acorn cannon — the showy traps.
  '0,7': () => [
    // Mound the player MUST cross (centerline) — first erupting tree.
    { kind: 'erupting', x: 12, z: 174 },
  ],
  '0,8': () => [
    // Acorn cannon on the right flank — first ranged threat.
    { kind: 'acorn', x: 19, z: 200 },
  ],
  '0,9': () => [
    // Falling tree on the left flank — sweeps across the path.
    { kind: 'falling', x: 4, z: 222, opts: { side: 1 } },
    // Sign baits the player toward the felled trunk.
    { kind: 'sign',    x: 17, z: 220, opts: { label: 'KEEP RIGHT', face: -1 } },
  ],
  '0,10': () => [],  // relief
  '0,11': () => [
    // Multi-trap mix: erupting tree + acorn cannon together.
    { kind: 'erupting', x: 11, z: 270 },
    { kind: 'acorn',    x: 18, z: 276 },
    { kind: 'predator', x: 4,  z: 282 },
  ],

  // Level 3 (cells 0,13 → 0,17, ending at flag 3 at 0,18). Trickster
  // Grove biome takes over around cz=9. Theme: confidence trap +
  // mirror tree + ranged pressure. The framework's "major subversion"
  // beat — the player thinks they've learned the patterns and gets
  // schooled by the bait sign and the mirror.
  '0,13': () => [
    // Confidence trap — sign labelled EASY, then a carpet of pits.
    { kind: 'sign', x: 11, z: 318, opts: { label: 'EASY', face: 1 } },
    { kind: 'pit',  x: 9,  z: 326 },
    { kind: 'pit',  x: 13, z: 327 },
    { kind: 'pit',  x: 11, z: 332 },
  ],
  '0,14': () => [
    // Mirror tree introduction — tree mirrors the player's silhouette.
    // Sign tries to disarm the player into staying near it.
    { kind: 'mirror', x: 18, z: 350 },
    { kind: 'sign',   x: 6,  z: 348, opts: { label: 'TRUST', face: -1 } },
  ],
  '0,15': () => [
    // Acorn crossfire — two cannons on opposite flanks.
    { kind: 'acorn', x: 4,  z: 372 },
    { kind: 'acorn', x: 19, z: 378 },
  ],
  '0,16': () => [],   // relief — Trickster pretends it's done
  '0,17': () => [
    // Lash combo + erupting tree centerline, the level's climax.
    { kind: 'lash',     x: 12, z: 420 },
    { kind: 'erupting', x: 12, z: 432 },
  ],

  // Level 4 (cells 0,19 → 0,23, ending at flag 4 at 0,24). Rotbog
  // biome (cz ≥ 18). Theme: patient slowfields and moving threats.
  // Vines and geysers force the player to time movement, not just dodge.
  '0,19': () => [
    // Vine introduction — single sweeping vine on the centerline.
    { kind: 'vine', x: 12, z: 462 },
  ],
  '0,20': () => [
    // Vine cluster — two vines staggered + a snare baiting the gap.
    { kind: 'vine',  x: 8,  z: 484 },
    { kind: 'vine',  x: 16, z: 492 },
    { kind: 'snare', x: 12, z: 488 },
  ],
  '0,21': () => [
    // Geyser introduction — timed eruption + predator on flank pressures
    // the player to move while the geyser is dormant.
    { kind: 'geyser',   x: 12, z: 510, opts: { period: 3.6, phase: 0 } },
    { kind: 'predator', x: 4,  z: 516 },
  ],
  '0,22': () => [],   // relief
  '0,23': () => [
    // Climax — geyser + vine + predator orchestrated.
    { kind: 'geyser',   x: 12, z: 558, opts: { period: 3.0, phase: 0.5 } },
    { kind: 'vine',     x: 12, z: 568 },
    { kind: 'predator', x: 18, z: 564 },
  ],

  // Level 5 (cells 0,25 → 0,29, ending at flag 5 at 0,30). Cliffside
  // biome (cz ≥ 27). Theme: wind + boulders + falling trees. Heavy,
  // physical hazards. The player has learned the vocabulary; here the
  // forest just throws weight.
  '0,25': () => [
    // Wind gust pushes player off-line + log roll cleans up.
    { kind: 'wind', x: 12, z: 606, opts: { dir: -1, force: 22 } },
    { kind: 'log',  x: 12, z: 618, opts: { dir: -1, speed: 16 } },
  ],
  '0,26': () => [
    // Boulder drop introduction — visible shadow on the path.
    { kind: 'boulder', x: 12, z: 636 },
    { kind: 'sign',    x: 4,  z: 632, opts: { label: 'KEEP MOVING', face: 1 } },
  ],
  '0,27': () => [
    // Falling tree + boulder combo — both fire on the centerline.
    { kind: 'falling', x: 4,  z: 656, opts: { side: 1 } },
    { kind: 'boulder', x: 16, z: 662 },
  ],
  '0,28': () => [],   // relief
  '0,29': () => [
    // Final climax — wind, boulder, falling tree all in 24m.
    { kind: 'wind',    x: 12, z: 700, opts: { dir: 1, force: 24 } },
    { kind: 'falling', x: 19, z: 708, opts: { side: -1 } },
    { kind: 'boulder', x: 8,  z: 716 },
  ],
};

// Per-biome trap palette — same shape as the old corridor palette, with
// every trap type registered.
const PALETTE = {
  mosswake:  { predator: 4, whip: 3, snare: 2, mushroom: 2, stump: 1, sign: 1, acorn: 3, boar: 1, lash: 1, falling: 2, erupting: 2 },
  trickster: { pit: 3, sign: 3, log: 2, mushroom: 2, snare: 2, stump: 2, spore: 2, vine: 1, mirror: 3, erupting: 2 },
  rotbog:    { snare: 4, predator: 3, mushroom: 3, log: 2, pit: 1, vine: 3, spore: 2, geyser: 2, mirror: 2, erupting: 3 },
  cliffside: { wind: 4, log: 2, predator: 2, whip: 2, pit: 1, boulder: 3, acorn: 3, lash: 2, falling: 3 },
  heart:     { embers: 4, predator: 3, log: 2, whip: 2, pit: 1, boar: 2, geyser: 3, boulder: 2, lash: 2, falling: 2 },
  sanctum:   { snare: 2, predator: 1, whip: 1, sign: 1, vine: 1, spore: 1, mirror: 2, erupting: 1 },
};

// Mulberry32 RNG keyed by the cell's seed.
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

// Direction-locked traps: their strike geometry assumes the player walks
// along world-Z (the spine direction). In a horizontal corridor or corner
// cell where the player is moving E↔W, these would either swing into a
// wall or miss. We strip them from the palette in those cells so only
// direction-agnostic traps spawn there. `falling` is also Z-locked
// because the trunk topples along world-Z.
const Z_AXIS_TRAPS = new Set(['whip', 'boar', 'wind', 'log', 'falling']);

function paletteWithoutZAxis(palette) {
  const out = {};
  for (const k of Object.keys(palette)) {
    if (!Z_AXIS_TRAPS.has(k)) out[k] = palette[k];
  }
  return out;
}

function pickFlankKind(rng, palette) {
  const flank = {};
  for (const k of ['whip', 'predator', 'boar', 'acorn', 'boulder', 'mirror']) {
    if (palette[k]) flank[k] = palette[k];
  }
  if (Object.keys(flank).length === 0) return pick(rng, palette);
  return pick(rng, flank);
}
function pickCenterKind(rng, palette) {
  const center = {};
  for (const k of ['pit', 'snare', 'mushroom', 'log', 'geyser', 'vine', 'wind', 'spore', 'embers', 'stump', 'lash']) {
    if (palette[k]) center[k] = palette[k];
  }
  if (Object.keys(center).length === 0) return pick(rng, palette);
  return pick(rng, center);
}

// Fill in trap-specific opts.
function makeTrapEntry(rng, kind, x, z) {
  const e = { kind, x, z };
  if (kind === 'whip') {
    e.opts = { side: rng() < 0.5 ? 'left' : 'right' };
  } else if (kind === 'wind') {
    e.opts = { dir: rng() < 0.5 ? -1 : 1, force: 16 + rng() * 8 };
  } else if (kind === 'log') {
    e.opts = { dir: rng() < 0.5 ? -1 : 1, speed: 12 + rng() * 6 };
  } else if (kind === 'embers') {
    e.opts = { radius: 4 + rng() * 3, count: 3 + ((rng() * 3) | 0), period: 1.2 + rng() * 0.8 };
  } else if (kind === 'sign') {
    const labels = ['SAFE', 'JUMP', 'EASY', 'TIP →', 'WALK', 'TRUST', 'REST HERE'];
    e.opts = { label: labels[(rng() * labels.length) | 0], face: rng() < 0.5 ? -1 : 1 };
  } else if (kind === 'boar') {
    e.opts = { side: rng() < 0.5 ? -1 : 1 };
  } else if (kind === 'geyser') {
    e.opts = { period: 3.2 + rng() * 1.4, phase: rng() * 3.0 };
  }
  return e;
}

// Inset from cell walls when placing traps and decor — keeps things off
// the doorway lines so the player has clean approaches.
const INSET = 3.5;

function cellInteriorBox(cx, cz) {
  const o = cellOrigin(cx, cz);
  return {
    minX: o.x + INSET,
    maxX: o.x + CELL_SIZE - INSET,
    minZ: o.z + INSET,
    maxZ: o.z + CELL_SIZE - INSET,
  };
}

// ── Layout helpers — pick trap positions based on cell shape ─────────────

// Open room (3+ exits): 3-4 traps spread in a loose ring.
function layoutOpenRoom(rng, biome, palette, cx, cz, mult) {
  const traps = [];
  const c = cellCenter(cx, cz);
  const count = Math.max(3, Math.round(4 * mult));
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + rng() * 0.4;
    const r = 5 + rng() * 3;
    const x = c.x + Math.cos(ang) * r;
    const z = c.z + Math.sin(ang) * r;
    const kind = pick(rng, palette);
    traps.push(makeTrapEntry(rng, kind, x, z));
  }
  return traps;
}

// Corridor (2 opposite exits): traps along the through-line.
function layoutCorridor(rng, biome, palette, cx, cz, axis, mult) {
  const traps = [];
  const c = cellCenter(cx, cz);
  const count = Math.max(2, Math.round(3 * mult));
  for (let i = 0; i < count; i++) {
    const t = -0.4 + (0.8 * (i + 0.5)) / count;
    const offset = (rng() - 0.5) * 4;
    let x, z;
    if (axis === 'z') { x = c.x + offset; z = c.z + t * (CELL_SIZE - INSET * 2); }
    else              { x = c.x + t * (CELL_SIZE - INSET * 2); z = c.z + offset; }
    const useFlank = i % 2 === 0;
    const kind = useFlank ? pickFlankKind(rng, palette) : pickCenterKind(rng, palette);
    traps.push(makeTrapEntry(rng, kind, x, z));
  }
  return traps;
}

// L-corner (2 adjacent exits): a heavy trap near the bend.
function layoutCorner(rng, biome, palette, cx, cz, mult) {
  const traps = [];
  const c = cellCenter(cx, cz);
  const heavy = ['predator', 'boulder', 'whip', 'log'].filter((k) => palette[k]);
  const k1 = heavy.length ? heavy[(rng() * heavy.length) | 0] : pickCenterKind(rng, palette);
  traps.push(makeTrapEntry(rng, k1, c.x + (rng() - 0.5) * 4, c.z + (rng() - 0.5) * 4));
  if (mult > 0.9) {
    const k2 = pickCenterKind(rng, palette);
    traps.push(makeTrapEntry(rng, k2, c.x + (rng() - 0.5) * 6, c.z + (rng() - 0.5) * 6));
  }
  return traps;
}

// Dead end (1 exit): a single high-impact reward trap (or a sign that
// labels the room SAFE — the joke being that there's nothing else here).
function layoutDeadEnd(rng, biome, palette, cx, cz, mult) {
  const traps = [];
  const c = cellCenter(cx, cz);
  if (palette.sign && rng() < 0.5) {
    traps.push(makeTrapEntry(rng, 'sign', c.x, c.z, 0));
  }
  const heavy = ['predator', 'boulder', 'mirror', 'lash'].filter((k) => palette[k]);
  const kind = heavy.length ? heavy[(rng() * heavy.length) | 0] : pick(rng, palette);
  traps.push(makeTrapEntry(rng, kind, c.x + (rng() - 0.5) * 3, c.z + (rng() - 0.5) * 3));
  return traps;
}

// Closed cell (0 exits): unreachable, no traps. Decor only — and even
// that's wasted, but it doesn't show up so we just skip content entirely.
function layoutClosed() { return []; }

// Decor — trees, rocks, shrubs, idle mushrooms — placed inside the cell
// box, density scaled by cell area. We keep things well off the doorway
// lines so the iso camera never has a tree clipping the player.
function spawnDecor(rng, biome, cx, cz) {
  const props = [];
  const box = cellInteriorBox(cx, cz);
  const w = box.maxX - box.minX;
  const h = box.maxZ - box.minZ;
  const c = cellCenter(cx, cz);
  const walls = cellWalls(cx, cz);

  // Trees hugging closed-edge walls so the wall reads naturally as a
  // stone retainer with foliage on top.
  for (let i = 0; i < 4; i++) {
    if (walls.n && rng() < 0.7) {
      props.push({ kind: 'tree', x: box.minX + rng() * w, z: c.z + (CELL_SIZE / 2 - 1.4 - rng() * 1.6), scale: 0.85 + rng() * 0.5, variant: (rng() * 3) | 0 });
    }
    if (walls.e && rng() < 0.7) {
      props.push({ kind: 'tree', x: c.x + (CELL_SIZE / 2 - 1.4 - rng() * 1.6), z: box.minZ + rng() * h, scale: 0.85 + rng() * 0.5, variant: (rng() * 3) | 0 });
    }
    if (walls.s && rng() < 0.7) {
      props.push({ kind: 'tree', x: box.minX + rng() * w, z: c.z - (CELL_SIZE / 2 - 1.4 - rng() * 1.6), scale: 0.85 + rng() * 0.5, variant: (rng() * 3) | 0 });
    }
    if (walls.w && rng() < 0.7) {
      props.push({ kind: 'tree', x: c.x - (CELL_SIZE / 2 - 1.4 - rng() * 1.6), z: box.minZ + rng() * h, scale: 0.85 + rng() * 0.5, variant: (rng() * 3) | 0 });
    }
  }

  // Shrubs scattered in the interior.
  const shrubCount = 3 + ((rng() * 3) | 0);
  for (let i = 0; i < shrubCount; i++) {
    const x = box.minX + rng() * w;
    const z = box.minZ + rng() * h;
    props.push({ kind: 'shrub', x, z, scale: 0.7 + rng() * 0.5 });
  }

  // Rocks.
  const rockCount = 1 + ((rng() * 2) | 0);
  for (let i = 0; i < rockCount; i++) {
    const x = box.minX + rng() * w;
    const z = box.minZ + rng() * h;
    props.push({ kind: 'rock', x, z, scale: 0.8 + rng() * 0.7 });
  }

  // Mushrooms — biome-accent capped.
  const capColor = biome.accent.getStyle();
  const mushroomCount = 1 + ((rng() * 2) | 0);
  for (let i = 0; i < mushroomCount; i++) {
    const x = box.minX + rng() * w;
    const z = box.minZ + rng() * h;
    props.push({ kind: 'mushroom', x, z, scale: 0.7 + rng() * 0.6, capColor });
  }

  return props;
}

// ── Public entry ─────────────────────────────────────────────────────────

export function spawnCellContent(cx, cz, biome) {
  const rng = makeRng(cellSeed(cx, cz));
  const palette = PALETTE[biome.id] || PALETTE.mosswake;
  const walls = cellWalls(cx, cz);
  const openCount = (walls.n ? 0 : 1) + (walls.s ? 0 : 1) + (walls.e ? 0 : 1) + (walls.w ? 0 : 1);
  const mult = difficultyForCell(cx, cz);
  const flagLevel = flagLevelInCell(cx, cz);

  // Hand-authored cells skip the procedural layouts entirely. We still
  // run the decor pass below so trees/shrubs/rocks stay deterministic
  // around the scripted traps.
  const scriptedKey = `${cx},${cz}`;
  if (SCRIPTED_CELLS[scriptedKey]) {
    const traps = SCRIPTED_CELLS[scriptedKey]();
    const props = openCount > 0 ? spawnDecor(rng, biome, cx, cz) : [];
    return { traps, props };
  }
  // Flag cells are sanctuaries: the flag itself sits at the cell centre,
  // the cell needs to be visibly safe so the player can read "this is the
  // checkpoint", and any trap clutter would distract from that read.
  // Spawn cell (level 0) is also forced calm so the player has a moment
  // to learn the controls before the forest starts attacking.
  const isSanctuaryCell = flagLevel !== null || (cx === 0 && cz === 0);

  let traps = [];
  if (isSanctuaryCell) {
    traps = [];
  } else if (openCount === 0) {
    traps = layoutClosed();
  } else if (openCount === 1) {
    // Dead-end: the player approaches and retreats along one axis. The
    // strike direction can't be guaranteed to match, so use only
    // direction-agnostic traps here.
    traps = layoutDeadEnd(rng, biome, paletteWithoutZAxis(palette), cx, cz, mult);
  } else if (openCount === 2) {
    const opposite = (!walls.n && !walls.s) || (!walls.e && !walls.w);
    if (opposite) {
      const axis = (!walls.n && !walls.s) ? 'z' : 'x';
      // Vertical corridor → traps that strike along world-X work great.
      // Horizontal corridor → strip them so traps don't fire into walls.
      const useP = axis === 'z' ? palette : paletteWithoutZAxis(palette);
      traps = layoutCorridor(rng, biome, useP, cx, cz, axis, mult);
    } else {
      // Corner cell: player turns through it; any direction-locked trap
      // would commit before reading the player's actual heading.
      traps = layoutCorner(rng, biome, paletteWithoutZAxis(palette), cx, cz, mult);
    }
  } else {
    // Open room (3+ exits): players come from any direction. Z-locked
    // traps only land if the player happens to be running through Z, so
    // err safe and use the direction-agnostic palette.
    traps = layoutOpenRoom(rng, biome, paletteWithoutZAxis(palette), cx, cz, mult);
  }

  // Sanctuary cells get sparser decor so the flag stands out. Closed
  // (unreachable) cells get no content at all.
  let props = [];
  if (openCount > 0) {
    props = spawnDecor(rng, biome, cx, cz);
    if (isSanctuaryCell) props = props.filter((p) => p.kind === 'shrub' || p.kind === 'rock').slice(0, 3);
  }
  return { traps, props };
}
