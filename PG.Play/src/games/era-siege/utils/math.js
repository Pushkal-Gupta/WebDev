// Shared scalar helpers. Keep this file dependency-free — every other
// era-siege module imports from here.

export const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
export const lerp  = (a, b, t)   => a + (b - a) * t;
export const sign  = (n) => n > 0 ? 1 : n < 0 ? -1 : 0;

export const distSq = (ax, ay, bx, by) => {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
};

export const inRange = (ax, ay, bx, by, r) => distSq(ax, ay, bx, by) <= r * r;

// Smooth-step ease for HUD transitions where we want a curve, not a ramp.
export const smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
