// Cut the Rope — verlet-integrated rope + candy physics.
//
// The world is a 2D plane (x, y) embedded in Three.js (z = 0). The
// physics simulation is dimensionless; one world unit equals one Three
// scene unit, and gravity is in world-units / sec².
//
// Coordinate convention: +Y is DOWN (matches Cut-the-Rope's "stuff falls
// down the screen" mental model). The Three scene flips this for the
// camera so visuals stay sane.
//
// Each step:
//   1. integrate every non-pinned point  (velocity-less verlet)
//   2. apply force fields  (blowers, bubbles)
//   3. relax distance constraints       (Jakobsen, K iterations)
//   4. clamp anchor pins back to base    (in case constraints moved them)

const GRAVITY = 26;        // world units / s². Tuned to feel right at scale 6 unit tall.
const DAMP = 0.9985;
const ITERATIONS = 8;

// ── Point ──────────────────────────────────────────────────────────────
export function makePoint(x, y, opts = {}) {
  return {
    x, y,
    prevX: opts.prevX ?? x,
    prevY: opts.prevY ?? y,
    pinned: !!opts.pinned,
    pinX: opts.pinned ? x : 0,
    pinY: opts.pinned ? y : 0,
    bubbled: false,           // bubble mechanic flips gravity for this point
    forceX: 0,
    forceY: 0,
  };
}

// Hard-pin a point to a new (x, y) — used by moving anchors.
export function setPinTarget(p, x, y) {
  p.pinX = x; p.pinY = y;
  if (p.pinned) {
    p.x = x; p.y = y;
    p.prevX = x; p.prevY = y;
  }
}

// ── Constraint ─────────────────────────────────────────────────────────
export function makeConstraint(a, b, restLength) {
  return { a, b, rest: restLength, alive: true };
}

// ── World ──────────────────────────────────────────────────────────────
export function makeWorld() {
  return {
    points: [],
    constraints: [],
  };
}

export function step(world, dt) {
  // dt clamp — protect against tab-resume spikes.
  const h = Math.min(dt, 1 / 30);
  const h2 = h * h;
  const pts = world.points;

  // 1. integrate
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.pinned) {
      p.x = p.pinX; p.y = p.pinY;
      p.prevX = p.x; p.prevY = p.y;
      continue;
    }
    const vx = (p.x - p.prevX) * DAMP + p.forceX * h2;
    const vy = (p.y - p.prevY) * DAMP + p.forceY * h2;
    const gy = (p.bubbled ? -GRAVITY * 0.6 : GRAVITY) * h2;
    const nx = p.x + vx;
    const ny = p.y + vy + gy;
    p.prevX = p.x; p.prevY = p.y;
    p.x = nx; p.y = ny;
    // Reset per-step forces.
    p.forceX = 0; p.forceY = 0;
  }

  // 2. constraints (Jakobsen relaxation)
  for (let it = 0; it < ITERATIONS; it++) {
    for (let i = 0; i < world.constraints.length; i++) {
      const c = world.constraints[i];
      if (!c.alive) continue;
      const a = c.a, b = c.b;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const diff = (dist - c.rest) / dist;
      const halfX = dx * 0.5 * diff;
      const halfY = dy * 0.5 * diff;
      if (!a.pinned) { a.x += halfX; a.y += halfY; }
      if (!b.pinned) { b.x -= halfX; b.y -= halfY; }
    }
  }
}

// Cut a rope: deactivate every constraint along the path that intersects
// the cut segment (sx,sy)→(ex,ey). Returns the count cut.
export function cutAlongSegment(world, sx, sy, ex, ey) {
  let cuts = 0;
  for (const c of world.constraints) {
    if (!c.alive) continue;
    const a = c.a, b = c.b;
    if (segmentsIntersect(sx, sy, ex, ey, a.x, a.y, b.x, b.y)) {
      c.alive = false;
      cuts++;
    }
  }
  return cuts;
}

// Tap-cut: kill every constraint within `radius` of (x, y).
export function cutAtPoint(world, x, y, radius) {
  let cuts = 0;
  for (const c of world.constraints) {
    if (!c.alive) continue;
    const d = distPointToSegment(x, y, c.a.x, c.a.y, c.b.x, c.b.y);
    if (d < radius) {
      c.alive = false;
      cuts++;
    }
  }
  return cuts;
}

// ── Geometry helpers ───────────────────────────────────────────────────
export function distPointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const x = ax + t * dx, y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1x = bx - ax, d1y = by - ay;
  const d2x = dx - cx, d2y = dy - cy;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-9) return false;
  const tx = cx - ax, ty = cy - ay;
  const t = (tx * d2y - ty * d2x) / denom;
  const u = (tx * d1y - ty * d1x) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
