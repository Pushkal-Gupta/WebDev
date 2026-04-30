// Grudgewood — maze cell grid.
//
// The world is a 2D grid of square cells. Each cell is CELL_SIZE × CELL_SIZE
// metres. The boundary between two adjacent cells is either OPEN (you can
// walk through; no wall mesh) or CLOSED (a vertical stone wall blocks you).
// Edge state is deterministic per (cell-pair, axis) so both cells agree
// without coordination.
//
// Connectivity guarantee: along the central spine (cx == 0) every
// north-edge is open, so the player can always advance in +Z from spawn.
// Side cells (cx != 0) can dead-end — that's the point. Exploration is
// optional; rooms branch off and re-merge.

export const CELL_SIZE = 24;
export const SPINE_X = 0;          // cx along which forward path is guaranteed

// Per-edge open probability for OFF-spine edges. 0.30 means most non-spine
// edges are walls, so the maze reads as a single dominant route (the
// spine) with short side detours rather than a branching labyrinth where
// the player has too many choices to track.
const OPEN_PROB = 0.30;
// Spine off-ramps: open ~60% so the player has frequent but optional
// side rooms branching east/west off the main path.
const OPEN_PROB_SPINE_RAMP = 0.60;

// Mulberry32 — deterministic per-edge PRNG seed.
function rng32(seed) {
  let s = (seed >>> 0) || 1;
  s = (s + 0x6D2B79F5) >>> 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// 3-input hash → 32-bit integer. Used to derive the edge seed.
function hash3(a, b, c) {
  return ((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) >>> 0;
}

// Edge between (cx, cz) and (cx, cz+1) — the "north edge" of cell (cx, cz).
// Spine cells force open so the forward route is never blocked.
export function northEdgeOpen(cx, cz) {
  if (cx === SPINE_X) return true;
  return rng32(hash3(1, cx, cz)) < OPEN_PROB;
}

// Edge between (cx, cz) and (cx+1, cz) — the "east edge" of cell (cx, cz).
// Spine off-ramps (cx == SPINE_X or cx == SPINE_X - 1) open at the higher
// rate so the spine has frequent side rooms; deeper edges off-spine are
// walls most of the time so the side branches naturally dead-end after
// a cell or two.
export function eastEdgeOpen(cx, cz) {
  const nearSpine = (cx === SPINE_X || cx === SPINE_X - 1);
  const r = rng32(hash3(2, cx, cz));
  return r < (nearSpine ? OPEN_PROB_SPINE_RAMP : OPEN_PROB);
}

// Cell coords of a world point.
export function cellOf(worldX, worldZ) {
  return [Math.floor(worldX / CELL_SIZE), Math.floor(worldZ / CELL_SIZE)];
}

// World-space lower-left corner of a cell.
export function cellOrigin(cx, cz) {
  return { x: cx * CELL_SIZE, z: cz * CELL_SIZE };
}

// World-space centre of a cell.
export function cellCenter(cx, cz) {
  return { x: cx * CELL_SIZE + CELL_SIZE / 2, z: cz * CELL_SIZE + CELL_SIZE / 2 };
}

// Door state for the four sides of a cell. `n` true means there's a wall
// to the north (the edge is closed); `n` false means open doorway.
export function cellWalls(cx, cz) {
  return {
    n: !northEdgeOpen(cx, cz),
    s: !northEdgeOpen(cx, cz - 1),
    e: !eastEdgeOpen(cx, cz),
    w: !eastEdgeOpen(cx - 1, cz),
  };
}

// Per-cell deterministic RNG seed. Used by spawn.js for reproducible
// trap placements and by chunkManager for any cell-scoped randomness.
export function cellSeed(cx, cz) {
  return hash3(7, cx + 65536, cz + 65536);
}
