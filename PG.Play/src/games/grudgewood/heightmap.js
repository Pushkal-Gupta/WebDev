// Grudgewood — terrain height sampling and ground noise.
//
// In the maze-grid world, the floor inside every cell is essentially flat
// at y = 0 with a couple of centimetres of grain so it doesn't read as
// plastic. Walls are separate meshes (see walls.js) and the player's
// collision against them is handled in player.js by AABB push-out, not
// by sampling height. So this module is now just: noise + a flat floor.
//
// Difficulty progression is also keyed off cell distance (radius from
// origin), not Z, so the maze can branch in any direction.

import { cellOf } from './mazeGrid.js';

// Deterministic 2D value noise.
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

// Ground height at world (x, z). Flat with subtle noise — keeps the
// floor reading as natural without complicating physics.
export function sampleHeight(x, z) {
  const grain = (valueNoise(x * 0.55, z * 0.55) - 0.5) * 0.18;
  return -0.04 + grain;
}

export function noise2D(x, z) { return valueNoise(x, z); }

// Difficulty multiplier scales trap counts in spawn.js. Keyed by the
// player's distance into the maze (cell radius from origin) so the maze
// gets meaner the further you push, regardless of which direction.
export function difficultyForCell(cx, cz) {
  const radius = Math.sqrt(cx * cx + cz * cz);
  if (radius <= 1) return 0.7;                     // tutorial cells around spawn
  return Math.min(1.7, 1 + (radius - 1) * 0.05);
}

// Helper for spawn-rules: the cell at world (x, z).
export function cellAt(x, z) { return cellOf(x, z); }
