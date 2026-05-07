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
//
// The world tracks a `topologyDirty` flag — flipped when any constraint
// transitions to !alive — so consumers (rope walk, tether check) can
// cache their walks instead of rescanning every frame.

const GRAVITY = 26;        // world units / s². Tuned to feel right at scale 6 unit tall.
const DAMP = 0.9985;       // per-substep velocity retention. Tuned so a single swing
                            // cycle reaches its symmetric apex with a small loss —
                            // higher values feel rubbery, lower values kill the swing
                            // before it gets through every star.
const ITERATIONS = 18;     // more constraint iterations = stiffer chain, less visible
                            // stretching during fast swings + heavy moving anchors.
                            // 18 propagates the constraint signal end-to-end on a
                            // 12-segment rope plus headroom; below ~14 the rope reads
                            // as visibly elastic, which is the "rubbery" feel.
const FIXED_DT = 1 / 120;  // physics substep — independent of frame rate.
const MAX_SUBSTEPS = 4;    // protects against tab-resume spikes.

// ── Point ──────────────────────────────────────────────────────────────
export function makePoint(x, y, opts = {}) {
  return {
    x, y,
    prevX: opts.prevX ?? x,
    prevY: opts.prevY ?? y,
    pinned: !!opts.pinned,
    pinX: opts.pinned ? x : 0,
    pinY: opts.pinned ? y : 0,
    pinPrevX: opts.pinned ? x : 0,   // last frame's pin pos — used to drag the chain.
    pinPrevY: opts.pinned ? y : 0,
    bubbled: false,
    forceX: 0,
    forceY: 0,
  };
}

// Soft-pin a point to a new (x, y) — used by moving anchors. Unlike the
// previous version this preserves the pin's "previous frame" position so
// the verlet chain feels the anchor's motion as a constraint impulse on
// the next step. The pin itself still snaps; only its derivative is
// preserved.
export function setPinTarget(p, x, y) {
  if (p.pinned) {
    p.pinPrevX = p.pinX;
    p.pinPrevY = p.pinY;
    p.pinX = x;
    p.pinY = y;
    p.x = x;
    p.y = y;
    // prevX/prevY left at the previous pin position so the chain "feels"
    // the anchor moving (constraint relaxation drags neighbours along).
    p.prevX = p.pinPrevX;
    p.prevY = p.pinPrevY;
  } else {
    p.pinX = x; p.pinY = y;
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
    topologyDirty: true,    // true once at start so consumers warm caches.
    accumulator: 0,         // substep accumulator owned by the world.
  };
}

// Per-substep integration. Don't call directly — use stepWorld(world, dt).
function stepFixed(world) {
  const h = FIXED_DT;
  const h2 = h * h;
  const pts = world.points;

  // 1. integrate
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.pinned) {
      p.x = p.pinX; p.y = p.pinY;
      // prevX/prevY left untouched here so a moving anchor's previous
      // frame trail can still influence the chain through Jakobsen.
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

// Frame-rate-independent step. Drains the accumulator into 1/120 substeps
// so swing physics is identical at 30, 60, 90, 144 fps.
export function step(world, dt) {
  // Clamp accumulator to avoid death-spiral after a tab resume.
  const safeDt = Math.min(dt, FIXED_DT * MAX_SUBSTEPS);
  world.accumulator += safeDt;
  let i = 0;
  while (world.accumulator >= FIXED_DT && i < MAX_SUBSTEPS) {
    stepFixed(world);
    world.accumulator -= FIXED_DT;
    i++;
  }
  // If we overran the substep budget, drop the leftover accumulator
  // rather than carrying it forward — keeps wall-clock honest.
  if (i === MAX_SUBSTEPS) world.accumulator = 0;
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
  if (cuts > 0) world.topologyDirty = true;
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
  if (cuts > 0) world.topologyDirty = true;
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
