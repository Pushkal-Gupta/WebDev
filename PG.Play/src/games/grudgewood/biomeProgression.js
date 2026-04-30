// Grudgewood — biome schedule across the 2D maze.
//
// Biomes change with distance from the spawn cell (Euclidean cell radius).
// A small fade window blends sky/fog colours as the player crosses each
// boundary so the maze gradually shifts mood instead of snapping.

import { biomeFor } from './biomes.js';
import { cellCenter, CELL_SIZE } from './mazeGrid.js';

export const BIOME_ORDER = ['mosswake', 'trickster', 'rotbog', 'cliffside', 'heart', 'sanctum'];
export const BIOME_RADIUS = 9;       // cells per biome ring (~9 * 24m = 216m)
const FADE_RING = 1.4;               // last 1.4 cells of a ring crossfade into the next

// Returns { biome, next, blend } at a given cell coordinate.
// `radius` is the Euclidean distance from origin in cells.
export function biomeAt(cx, cz) {
  const radius = Math.sqrt(cx * cx + cz * cz);
  const idx = Math.floor(radius / BIOME_RADIUS);
  const local = radius - idx * BIOME_RADIUS;
  const biome = biomeFor(BIOME_ORDER[idx % BIOME_ORDER.length]);
  const next = biomeFor(BIOME_ORDER[(idx + 1) % BIOME_ORDER.length]);
  const inFade = local > BIOME_RADIUS - FADE_RING;
  const blend = inFade ? (local - (BIOME_RADIUS - FADE_RING)) / FADE_RING : 0;
  return { biome, next, blend, idx };
}

// Used by walls.js / spawn.js to colour a whole cell uniformly. Pick by
// the cell's centre so the cell's identity is stable.
export function biomeForCell(cx, cz) {
  return biomeAt(cx, cz).biome;
}

// World-space distance from spawn — what the HUD shows as "distance".
export function distanceFromSpawn(x, z) {
  return Math.sqrt(x * x + z * z);
}
