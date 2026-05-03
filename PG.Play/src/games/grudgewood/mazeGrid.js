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
const FLAG_INTERVAL = 6;            // mirror of flags.js FLAG_INTERVAL_CELLS
const APPROACH_ROWS = 2;            // rows before each flag where side cells force open

// The PLAYABLE CORRIDOR is the strip cx ∈ [-1, 1] — three cells wide.
// Cells outside that strip are fully walled in so the player can't
// wander into empty meadow. Inside the corridor, the spine (cx=0)
// always continues forward; the side cells (|cx|=1) sometimes open
// onto parallel paths that rejoin via east/west doorways, giving the
// player "left curve / right curve" alternatives to the same flag.
export const CORRIDOR_HALF = 1;       // |cx| ≤ this is playable
const OPEN_PROB_SIDE_NS = 0.45;       // chance side cells continue forward
const OPEN_PROB_RAMP = 0.55;          // chance spine has a side-room doorway

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

// True if cell (cx, cz) sits within the APPROACH_ROWS rows just before
// a flag — those rows force open layouts so each flag has 2-3 routes
// converging on it. Spine + at least one side path is guaranteed.
function isFlagApproach(cz) {
  if (cz <= 0) return false;
  // cz mod FLAG_INTERVAL within the last APPROACH_ROWS positions before
  // a flag (e.g. 4, 5 for FLAG_INTERVAL=6 — the rows just south of the
  // flag at cz=6, 12, ...).
  const m = cz % FLAG_INTERVAL;
  return m >= FLAG_INTERVAL - APPROACH_ROWS && m < FLAG_INTERVAL;
}

// Edge between (cx, cz) and (cx, cz+1) — the "north edge" of cell (cx, cz).
// The spine always continues; side cells inside the corridor sometimes
// continue forward; cells outside the corridor are always walled. In
// the rows just before a flag we force the side cells open so the
// approach is a 3-wide convergence.
export function northEdgeOpen(cx, cz) {
  if (cx === SPINE_X) return true;
  if (Math.abs(cx) > CORRIDOR_HALF) return false;
  if (isFlagApproach(cz)) return true;
  return rng32(hash3(1, cx, cz)) < OPEN_PROB_SIDE_NS;
}

// Edge between (cx, cz) and (cx+1, cz) — the "east edge" of cell (cx, cz).
// Open only between cells inside the corridor (so doorways rejoin paths
// to the spine). On flag-approach rows we force open the spine ↔ side
// connectors so the player can pick a side route AT the approach.
export function eastEdgeOpen(cx, cz) {
  if (cx < -CORRIDOR_HALF || cx + 1 > CORRIDOR_HALF) return false;
  if (isFlagApproach(cz)) return true;
  return rng32(hash3(2, cx, cz)) < OPEN_PROB_RAMP;
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
