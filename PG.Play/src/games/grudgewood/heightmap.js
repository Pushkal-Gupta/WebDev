// Grudgewood — global terrain heightmap and serpentine path.
//
// The world is one continuous spectrum: the player walks +Z forever.
// Both the path's lateral offset and the surrounding hills are pure
// functions of world coordinates, so adjacent chunks line up seamlessly
// without seams or per-segment seeds.

const PATH_HALF_WIDTH = 4.5;   // walkable corridor half-width
const FLANK_FADE = 1.6;        // how quickly hills rise outside the corridor
const CLIFF_MAX = 9.0;         // tallest natural hill height
const SHOULDER_OFFSET = 5.0;   // distance from path centerline to flank base

// Deterministic 2D value noise. Result is in [0,1).
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

// Path centerline in X as a function of world Z. Continuous and smooth
// across all Z, with frequency content that keeps the corridor visually
// interesting without ever doubling back.
export function pathOffsetAt(z) {
  return Math.sin(z * 0.045) * 4.2 + Math.sin(z * 0.018) * 2.8 + Math.sin(z * 0.083) * 1.0;
}

// Ground height at world (x, z). The path itself is a flat trench at y=0;
// terrain rises into rolling hills outside the trench, with the flank
// height softened by noise so the corridor never feels boxy.
export function sampleHeight(x, z) {
  const px = pathOffsetAt(z);
  const dist = Math.abs(x - px);
  const wobble = (valueNoise(x * 0.18, z * 0.18) - 0.5) * 1.6;
  const grain = (valueNoise(x * 0.55, z * 0.55) - 0.5) * 0.3;
  if (dist < PATH_HALF_WIDTH) return -0.05 + grain * 0.4;
  const flank = dist - SHOULDER_OFFSET;
  const cliff = Math.min(CLIFF_MAX, Math.max(0, flank) * 0.7);
  return cliff + wobble + grain;
}

// Convenience for code that wants the same noise field for biome blending
// or parallax decoration.
export function noise2D(x, z) { return valueNoise(x, z); }

export const HEIGHTMAP = { PATH_HALF_WIDTH, FLANK_FADE, CLIFF_MAX, SHOULDER_OFFSET };
