// Snip — hand-built level data.
//
// Coordinate convention:
//   x: -5 .. +5  (left-right; 10 world units wide)
//   y:  -1 (top of frame) .. +6 (bottom)
//   The candy "falls" with +Y; the camera is positioned so +Y looks
//   like screen-down to the player.
//
// Design principles (after reviewing real Cut-the-Rope levels):
//   1. Multi-rope cradles — candy is held by 2-4 ropes from anchors
//      arranged in clean shapes (line, fan, cross). Cutting a rope
//      creates a predictable physics outcome.
//   2. Stars sit on the candy's natural trajectory: the swing arc of
//      the surviving rope, the drop column after a clean cut, or the
//      lift column inside a bubble.
//   3. One mechanic per level — each level introduces or refines a
//      single idea.
//   4. The viaAnchor "pin chain" mechanic is intentionally NOT used:
//      in our engine cutting the first half doesn't free the candy
//      and the level reads as broken. Pin behavior is faked with a
//      regular floating anchor + a rope long enough to swing on.

const SWEET = 'sweet';
const GREEN = 'green';
const WORK  = 'work';

// ── Helper: positions on a swing arc ─────────────────────────────────
// pin (px, py), rope length L, angle α from straight-down (radians).
// Used in this file only by hand to place stars exactly on arcs.

export const LEVELS = [
  // ── World 1 — Sweet Shop ──────────────────────────────────────────────
  {
    // Single rope, vertical drop. Stars sit in a column directly below
    // the candy so a clean cut threads all three on the way to Mochi.
    id: 'l1', world: 1, number: 1, theme: SWEET,
    name: 'First taste',
    hint: 'Tap the rope to cut it.',
    anchors: [{ id: 'a1', x: 0, y: -0.2 }],
    candy:   { x: 0, y: 1.8 },
    ropes:   [{ from: 'a1', length: 2.0, segments: 9 }],
    stars:   [{ x: 0, y: 2.8 }, { x: 0, y: 3.6 }, { x: 0, y: 4.4 }],
    target:  { x: 0, y: 5.2 },
    hazards: [],
    devices: [],
  },
  {
    // Long pendulum. Candy spawns at α = -70° on a 3.0 rope, swings
    // through α = -30°, 0°, +30° (the three star positions) up to the
    // symmetric apex at α = +70°. Cut at the right apex to drop into
    // Mochi.
    id: 'l2', world: 1, number: 2, theme: SWEET,
    name: 'Long swing',
    hint: 'Let it swing through every star, then cut.',
    anchors: [{ id: 'a1', x: 0.0, y: -0.2 }],
    candy:   { x: -2.82, y: 0.83 },
    ropes:   [{ from: 'a1', length: 3.0, segments: 12 }],
    stars:   [{ x: -1.5, y: 2.4 }, { x: 0.0, y: 2.8 }, { x: 1.5, y: 2.4 }],
    target:  { x: 2.82, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    // Two-rope cradle. Stars are placed ON the LEFT swing arc at
    // α = +30°, 0°, -30° from anchor a1. So the puzzle is: cut the
    // RIGHT rope to send the candy through all three on its swing,
    // then cut the LEFT rope at the far apex (-4, 2.04) to drop into
    // Mochi.
    id: 'l3', world: 1, number: 3, theme: SWEET,
    name: 'Two ropes',
    hint: 'Cut right, swing left, cut left.',
    anchors: [{ id: 'a1', x: -2.0, y: -0.2 }, { id: 'a2', x: 2.0, y: -0.2 }],
    candy:   { x: 0, y: 2.0 },
    ropes:   [
      { from: 'a1', length: 3.1, segments: 11 },
      { from: 'a2', length: 3.1, segments: 11 },
    ],
    stars:   [{ x: -0.5, y: 2.4 }, { x: -2.0, y: 2.8 }, { x: -3.5, y: 2.4 }],
    target:  { x: -4.0, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    // Crossroads — four floating anchors form a cross around the candy
    // (top, left, right, bottom-as-pin). Inspired by real CTR 1-4.
    // Cut TOP → candy drops onto the lower anchors (slack).
    // Cut BOTTOM → candy is freed downward; left/right ropes still
    //   constrain the swing.
    // Cut both SIDE ropes → candy drops between top + bottom only.
    // Stars are placed on the post-cut trajectories.
    id: 'l4', world: 1, number: 4, theme: SWEET,
    name: 'Crossroads',
    hint: 'Four ropes, one candy. Find the order.',
    anchors: [
      { id: 'aT', x:  0.0, y: -0.2 },     // top
      { id: 'aL', x: -2.4, y:  1.6 },     // left (floats in air)
      { id: 'aR', x:  2.4, y:  1.6 },     // right
      { id: 'aB', x:  0.0, y:  3.4 },     // bottom (floats below candy)
    ],
    candy:   { x: 0, y: 1.6 },
    ropes:   [
      { from: 'aT', length: 2.0, segments: 9 },
      { from: 'aL', length: 2.6, segments: 10 },
      { from: 'aR', length: 2.6, segments: 10 },
      { from: 'aB', length: 2.0, segments: 9 },
    ],
    stars:   [{ x: -1.6, y: 3.0 }, { x: 0.0, y: 4.4 }, { x: 1.6, y: 3.0 }],
    target:  { x: 0, y: 5.2 },
    hazards: [],
    devices: [],
  },
  {
    // Wide swing. Same idea as l2 but rope is longer (3.6) so the arc
    // sweeps across the full play area. Stars are spaced on the arc.
    id: 'l5', world: 1, number: 5, theme: SWEET,
    name: 'Wide swing',
    hint: 'Bigger arc. Same trick.',
    anchors: [{ id: 'a1', x: 0.0, y: -0.2 }],
    // α = -70°: x = -3.6·sin70° = -3.38, y = -0.2 + 3.6·cos70° = 1.03
    candy:   { x: -3.38, y: 1.03 },
    ropes:   [{ from: 'a1', length: 3.6, segments: 14 }],
    // α = -30°, 0°, +30° on the L=3.6 arc
    // α=±30°: (±1.8, -0.2 + 3.12) = (±1.8, 2.92)
    // α=0:    (0, 3.4)
    stars:   [{ x: -1.8, y: 2.92 }, { x: 0.0, y: 3.4 }, { x: 1.8, y: 2.92 }],
    target:  { x: 3.38, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    // Cut and catch. Two anchors offset horizontally; the candy hangs
    // off-center from them. Cutting the RIGHT rope swings candy left
    // through the first two stars; the LEFT rope keeps swinging it past
    // the third on the back-half of the swing. Cut LEFT at the far
    // apex to drop into Mochi.
    id: 'l6', world: 1, number: 6, theme: SWEET,
    name: 'Cut and catch',
    hint: 'Cut right, ride the long swing.',
    anchors: [{ id: 'a1', x: -1.4, y: -0.2 }, { id: 'a2', x: 1.4, y: -0.2 }],
    candy:   { x: 0, y: 2.4 },
    // Distance from each anchor to candy: sqrt(1.96 + 6.76) = 2.95
    ropes:   [
      { from: 'a1', length: 3.2, segments: 12 },
      { from: 'a2', length: 3.2, segments: 12 },
    ],
    // After right is cut, candy swings on left rope around (-1.4, -0.2)
    // with radius 3.2. Settle dist 2.95 → falls a bit, then swings.
    // Stars on left arc (anchor (-1.4, -0.2), radius 3.2):
    //   α = +30°:  (-1.4 + 1.6, -0.2 + 2.77) = (0.2, 2.57)
    //   α = 0:     (-1.4, 3.0)
    //   α = -30°:  (-1.4 - 1.6, -0.2 + 2.77) = (-3.0, 2.57)
    stars:   [{ x: 0.2, y: 2.57 }, { x: -1.4, y: 3.0 }, { x: -3.0, y: 2.57 }],
    target:  { x: -3.6, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    // Three-rope fan. Anchors at top in a row, candy below. Cutting the
    // middle rope releases tension and lets the side ropes form a
    // looser cradle; cutting both side ropes drops candy straight
    // through the column to Mochi.
    id: 'l7', world: 1, number: 7, theme: SWEET,
    name: 'Three rope fan',
    hint: 'The middle rope is the lock.',
    anchors: [
      { id: 'aL', x: -2.2, y: -0.2 },
      { id: 'aC', x:  0.0, y: -0.2 },
      { id: 'aR', x:  2.2, y: -0.2 },
    ],
    candy:   { x: 0, y: 2.4 },
    // dist to aL/aR = sqrt(4.84+6.76) = 3.41; to aC = 2.6
    ropes:   [
      { from: 'aL', length: 3.6, segments: 13 },
      { from: 'aC', length: 2.8, segments: 11 },
      { from: 'aR', length: 3.6, segments: 13 },
    ],
    stars:   [{ x: 0, y: 3.2 }, { x: 0, y: 4.0 }, { x: 0, y: 4.8 }],
    target:  { x: 0, y: 5.4 },
    hazards: [],
    devices: [],
  },
  {
    // Twin pendulum: cradle settles at the lower two-circle intersection
    // (≈ 0, 2.48). Stars sit on the LEFT swing arc at α = +30°, 0°,
    // -30° from anchor a1. Cut the RIGHT rope first → candy passes
    // through all three on a single swing. Cut LEFT at the far apex
    // (-4.8, 2.48) to drop straight into Mochi.
    id: 'l8', world: 1, number: 8, theme: SWEET,
    name: 'Twin pendulum',
    hint: 'Cut right, ride the long swing, then cut left.',
    anchors: [{ id: 'a1', x: -2.4, y: -0.2 }, { id: 'a2', x: 2.4, y: -0.2 }],
    candy:   { x: 0, y: 2.4 },
    ropes:   [
      { from: 'a1', length: 3.7, segments: 13 },
      { from: 'a2', length: 3.7, segments: 13 },
    ],
    stars:   [{ x: -0.6, y: 2.92 }, { x: -2.4, y: 3.4 }, { x: -4.2, y: 2.92 }],
    target:  { x: -4.8, y: 5.0 },
    hazards: [],
    devices: [],
  },

  // ── World 2 — Greenhouse ──────────────────────────────────────────────
  {
    // Bubble lift introduces the bubble mechanic. Candy spawns inside
    // the bubble, gravity flips, candy floats up through the column of
    // stars. Player pops the bubble at the top to drop candy back down
    // into Mochi.
    // Bubble lift: rope is taut at start (length 4.0 = anchor-candy
    // distance) so the candy starts at maximum rope extension. Bubble
    // floats it up the column of stars; cut the rope (or wait until
    // pop) to drop it into Mochi.
    id: 'l9', world: 2, number: 1, theme: GREEN,
    name: 'Bubble lift',
    hint: 'Tap the bubble to pop it. The candy floats while bubbled.',
    anchors: [{ id: 'a1', x: 0, y: -0.2 }],
    candy:   { x: 0, y: 3.4 },
    ropes:   [{ from: 'a1', length: 3.6, segments: 13 }],
    stars:   [{ x: 0, y: 2.4 }, { x: 0, y: 1.2 }, { x: 0, y: 0.0 }],
    target:  { x: 0, y: 5.2 },
    hazards: [],
    devices: [{ kind: 'bubble', x: 0, y: 3.4, radius: 0.55 }],
  },
  {
    // Pop and drop: cradle setup. The candy is held by two ropes from
    // a tight pair of anchors; the bubble lifts it through stars
    // ABOVE the cradle. Pop the bubble to drop the candy back into
    // the cradle, then cut a rope to swing into Mochi.
    id: 'l10', world: 2, number: 2, theme: GREEN,
    name: 'Pop and drop',
    hint: 'Lift, pop, then cut the cradle.',
    anchors: [{ id: 'a1', x: -1.6, y: -0.2 }, { id: 'a2', x: 1.6, y: -0.2 }],
    candy:   { x: 0, y: 2.6 },
    // dist to each anchor: sqrt(2.56+7.84)=3.22. Rope 3.4 each.
    ropes:   [
      { from: 'a1', length: 3.4, segments: 12 },
      { from: 'a2', length: 3.4, segments: 12 },
    ],
    stars:   [{ x: 0, y: 1.4 }, { x: 0, y: 0.4 }, { x: 0, y: -0.6 }],
    target:  { x: 0, y: 5.2 },
    hazards: [],
    devices: [{ kind: 'bubble', x: 0, y: 2.6, radius: 0.55 }],
  },
  {
    // Wind ride: a single blower pushes the hanging candy across the
    // arena. Cut the rope, ride the gust through three stars to Mochi.
    id: 'l11', world: 2, number: 3, theme: GREEN,
    name: 'Wind ride',
    hint: 'Cut the rope and ride the gust.',
    anchors: [{ id: 'a1', x: -3.0, y: -0.2 }],
    candy:   { x: -3.0, y: 1.4 },
    ropes:   [{ from: 'a1', length: 1.6, segments: 8 }],
    // Blower from (-3.5, 2.6) blowing +x, length 6.4 covers x = -3.5..2.9.
    stars:   [{ x: -1.4, y: 2.7 }, { x: 0.4, y: 2.7 }, { x: 2.0, y: 2.7 }],
    target:  { x: 3.0, y: 5.0 },
    hazards: [],
    devices: [
      { kind: 'blower', x: -3.5, y: 2.7, dirX: 1, dirY: 0, force: 60, length: 6.4, radius: 0.7 },
    ],
  },
  {
    // Spike row introduces the spike hazard. The candy must swing
    // around the spike bank to reach Mochi.
    id: 'l12', world: 2, number: 4, theme: GREEN,
    name: 'Spike row',
    hint: 'Spikes are deadly. Plan the swing arc.',
    anchors: [{ id: 'a1', x: -2.4, y: -0.2 }],
    candy:   { x: -2.4, y: 1.6 },
    ropes:   [{ from: 'a1', length: 1.8, segments: 9 }],
    // After cut, candy free-falls. With swipe-cut at the right moment
    // it can land on the right side of the spikes.
    // Stars on the swing arc: α = +30°, +60°, +90°.
    // α=+30°: (-2.4+0.9, -0.2+1.56) = (-1.5, 1.36) — too high
    // Place stars on a lower path:
    stars:   [{ x: -1.0, y: 2.4 }, { x: 0.6, y: 2.6 }, { x: 2.4, y: 2.8 }],
    target:  { x: 3.4, y: 5.0 },
    hazards: [{ kind: 'spike', x: 1.4, y: 4.6, w: 1.6, h: 0.4 }],
    devices: [
      { kind: 'blower', x: -2.6, y: 2.6, dirX: 1, dirY: -0.05, force: 50, length: 5.6, radius: 0.7 },
    ],
  },
  {
    // Lift and over: bubble lifts the candy ABOVE a centered spike
    // bank; popping at the right horizontal position lets it drop into
    // Mochi on the far side.
    id: 'l13', world: 2, number: 5, theme: GREEN,
    name: 'Lift over',
    hint: 'Lift past the spikes. Pop in the safe lane.',
    anchors: [{ id: 'a1', x: 0, y: -0.2 }],
    candy:   { x: 0, y: 3.6 },
    ropes:   [{ from: 'a1', length: 3.8, segments: 13 }],
    stars:   [{ x: 0, y: 2.4 }, { x: 0, y: 1.2 }, { x: 0, y: 0.0 }],
    target:  { x: 0, y: 5.2 },
    hazards: [
      { kind: 'spike', x: -2.4, y: 4.6, w: 1.4, h: 0.36 },
      { kind: 'spike', x:  2.4, y: 4.6, w: 1.4, h: 0.36 },
    ],
    devices: [{ kind: 'bubble', x: 0, y: 3.6, radius: 0.55 }],
  },
  {
    // Wind tunnel: two blowers in series form a wind escalator.
    id: 'l14', world: 2, number: 6, theme: GREEN,
    name: 'Wind tunnel',
    hint: 'Two blowers in series. Cut and ride.',
    anchors: [{ id: 'a1', x: -3.0, y: -0.2 }],
    candy:   { x: -3.0, y: 1.4 },
    ropes:   [{ from: 'a1', length: 1.6, segments: 8 }],
    stars:   [{ x: -1.0, y: 2.4 }, { x: 0.6, y: 3.0 }, { x: 2.4, y: 3.8 }],
    target:  { x: 3.0, y: 5.0 },
    hazards: [],
    devices: [
      { kind: 'blower', x: -3.5, y: 2.6, dirX: 1, dirY: -0.05, force: 60, length: 4.0, radius: 0.9 },
      { kind: 'blower', x:  0.0, y: 3.6, dirX: 1, dirY: -0.05, force: 50, length: 4.0, radius: 0.9 },
    ],
  },
  {
    // Crystal rise: bubble lifts the candy along an off-centre column,
    // then a long blower carries it across to Mochi after the pop.
    id: 'l15', world: 2, number: 7, theme: GREEN,
    name: 'Crystal rise',
    hint: 'Lift first, then ride the wind.',
    anchors: [{ id: 'a1', x: -2.5, y: -0.2 }],
    candy:   { x: -2.5, y: 3.6 },
    ropes:   [{ from: 'a1', length: 4.0, segments: 14 }],
    stars:   [{ x: -2.5, y: 2.0 }, { x: -1.0, y: 1.4 }, { x: 1.4, y: 2.0 }],
    target:  { x: 3.0, y: 5.0 },
    hazards: [],
    devices: [
      { kind: 'bubble', x: -2.5, y: 3.6, radius: 0.55 },
      { kind: 'blower', x: -2.0, y: 1.8, dirX: 1, dirY: 0, force: 50, length: 5.4, radius: 0.8 },
    ],
  },
  {
    // Greenhouse finale — bubble + blower + a centred spike. Lift the
    // candy, pop above the spike, ride the wind into Mochi.
    id: 'l16', world: 2, number: 8, theme: GREEN,
    name: 'Greenhouse finale',
    hint: 'Lift, pop, drift. Mind the spike.',
    anchors: [{ id: 'a1', x: -3.0, y: -0.2 }],
    candy:   { x: -3.0, y: 3.6 },
    ropes:   [{ from: 'a1', length: 4.0, segments: 14 }],
    stars:   [{ x: -3.0, y: 2.0 }, { x: -1.0, y: 2.6 }, { x: 1.4, y: 3.6 }],
    target:  { x: 3.2, y: 5.0 },
    hazards: [{ kind: 'spike', x: -1.2, y: 4.6, w: 1.6, h: 0.36 }],
    devices: [
      { kind: 'bubble', x: -3.0, y: 3.6, radius: 0.55 },
      { kind: 'blower', x: -1.0, y: 3.6, dirX: 1, dirY: 0, force: 50, length: 4.4, radius: 0.8 },
    ],
  },

  // ── World 3 — Workshop ────────────────────────────────────────────────
  {
    // Sliding pin: anchor cycles left↔right. Candy hangs and drifts
    // with it, scrubbing through the star arc.
    id: 'l17', world: 3, number: 1, theme: WORK,
    name: 'Sliding pin',
    hint: 'The anchor slides on its track. Time the cut.',
    anchors: [{ id: 'a1', x: -2.4, y: -0.2, track: { ax: -2.4, ay: -0.2, bx: 2.4, by: -0.2, period: 3.4 } }],
    candy:   { x: -2.4, y: 2.4 },
    ropes:   [{ from: 'a1', length: 2.8, segments: 10 }],
    stars:   [{ x: -1.6, y: 3.2 }, { x: 0.0, y: 3.6 }, { x: 1.6, y: 3.2 }],
    target:  { x: 0, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    // Crossbeams: two anchors, one on a horizontal track, one fixed.
    // The cradle "wobbles" as the moving anchor cycles.
    id: 'l18', world: 3, number: 2, theme: WORK,
    name: 'Crossbeams',
    hint: 'One slides, one stays. The cradle wobbles.',
    anchors: [
      { id: 'a1', x: -2.4, y: -0.2, track: { ax: -2.4, ay: -0.2, bx: -0.6, by: -0.2, period: 3.4 } },
      { id: 'a2', x:  2.4, y: -0.2 },
    ],
    candy:   { x: 0, y: 2.4 },
    ropes:   [
      { from: 'a1', length: 3.7, segments: 13 },
      { from: 'a2', length: 3.7, segments: 13 },
    ],
    stars:   [{ x: -1.6, y: 3.2 }, { x: 0.0, y: 3.6 }, { x: 1.6, y: 3.2 }],
    target:  { x: 0, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    // Spike track: moving anchor + a centred spike. Time the cut so
    // the candy clears the spike on its drop.
    id: 'l19', world: 3, number: 3, theme: WORK,
    name: 'Spike track',
    hint: 'Time the cut. Mind the spike.',
    anchors: [{ id: 'a1', x: -2.6, y: -0.2, track: { ax: -2.6, ay: -0.2, bx: 2.6, by: -0.2, period: 3.6 } }],
    candy:   { x: -2.6, y: 2.6 },
    ropes:   [{ from: 'a1', length: 3.0, segments: 11 }],
    stars:   [{ x: -2.0, y: 3.4 }, { x: 2.0, y: 3.4 }, { x: 0.0, y: 4.2 }],
    target:  { x: 0, y: 5.4 },
    hazards: [
      { kind: 'spike', x: -2.4, y: 4.7, w: 1.6, h: 0.34 },
      { kind: 'spike', x:  2.4, y: 4.7, w: 1.6, h: 0.34 },
    ],
    devices: [],
  },
  {
    // Pin pivot: a floating "pin" anchor with a long rope creates a
    // wide swing arc. The candy starts at the side of the arc and
    // swings around the pin through three stars.
    id: 'l20', world: 3, number: 4, theme: WORK,
    name: 'Pin pivot',
    hint: 'The pin is the pivot. Build the swing.',
    anchors: [{ id: 'a1', x: 0, y: 1.2 }],     // floating pin
    // α = -70° on a 3.0 rope around (0, 1.2):
    candy:   { x: -2.82, y: 2.23 },
    ropes:   [{ from: 'a1', length: 3.0, segments: 12 }],
    // Stars on the arc at α = -30°, 0°, +30°
    // α=±30°: (±1.5, 1.2 + 2.6) = (±1.5, 3.8)
    // α=0:    (0, 4.2)
    stars:   [{ x: -1.5, y: 3.8 }, { x: 0.0, y: 4.2 }, { x: 1.5, y: 3.8 }],
    target:  { x: 2.82, y: 5.2 },
    hazards: [],
    devices: [],
  },
  {
    // Two slides — both anchors track with different periods.
    id: 'l21', world: 3, number: 5, theme: WORK,
    name: 'Two slides',
    hint: 'Both anchors move. Their rhythms differ.',
    anchors: [
      { id: 'a1', x: -2.4, y: -0.2, track: { ax: -2.4, ay: -0.2, bx: -0.6, by: -0.2, period: 3.6 } },
      { id: 'a2', x:  2.4, y: -0.2, track: { ax:  2.4, ay: -0.2, bx:  0.6, by: -0.2, period: 4.4 } },
    ],
    candy:   { x: 0, y: 2.4 },
    ropes:   [
      { from: 'a1', length: 3.7, segments: 13 },
      { from: 'a2', length: 3.7, segments: 13 },
    ],
    stars:   [{ x: -1.8, y: 3.4 }, { x: 0.0, y: 3.8 }, { x: 1.8, y: 3.4 }],
    target:  { x: 0, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    // Bubble slide — moving anchor + bubble lift. The candy rides the
    // anchor's horizontal sweep while the bubble carries it upward.
    id: 'l22', world: 3, number: 6, theme: WORK,
    name: 'Bubble slide',
    hint: 'Rhythm matters. Pop in the centre.',
    anchors: [{ id: 'a1', x: -2.4, y: -0.2, track: { ax: -2.4, ay: -0.2, bx: 2.4, by: -0.2, period: 4.0 } }],
    candy:   { x: -2.4, y: 3.6 },
    ropes:   [{ from: 'a1', length: 3.8, segments: 13 }],
    stars:   [{ x: -1.6, y: 2.4 }, { x: 0.0, y: 1.6 }, { x: 1.6, y: 2.4 }],
    target:  { x: 0, y: 5.2 },
    hazards: [],
    devices: [{ kind: 'bubble', x: -2.4, y: 3.6, radius: 0.55 }],
  },
  {
    // Wind machine — fixed anchor, one centred blower, target on the
    // far side. The candy rides a long blower into Mochi.
    id: 'l23', world: 3, number: 7, theme: WORK,
    name: 'Wind machine',
    hint: 'Cut and ride the long blow.',
    anchors: [{ id: 'a1', x: -2.6, y: -0.2 }],
    candy:   { x: -2.6, y: 1.4 },
    ropes:   [{ from: 'a1', length: 1.6, segments: 8 }],
    stars:   [{ x: -1.0, y: 2.6 }, { x: 0.6, y: 3.4 }, { x: 2.4, y: 4.0 }],
    target:  { x: 3.2, y: 5.0 },
    hazards: [{ kind: 'spike', x: 0, y: 4.9, w: 1.4, h: 0.32 }],
    devices: [
      { kind: 'blower', x: -3.0, y: 2.6, dirX: 1, dirY: 0, force: 60, length: 3.6, radius: 0.7 },
      { kind: 'blower', x:  0.0, y: 3.4, dirX: 1, dirY: 0, force: 50, length: 3.0, radius: 0.7 },
      { kind: 'blower', x:  2.4, y: 4.0, dirX: 1, dirY: 0, force: 36, length: 1.5, radius: 0.7 },
    ],
  },
  {
    // Master craft — a 4-rope cradle with two of the anchors on tracks
    // (top + bottom slide opposite directions). The cradle pulses; cut
    // an anchor at the right phase to drop into Mochi.
    id: 'l24', world: 3, number: 8, theme: WORK,
    name: 'Master craft',
    hint: 'Top and bottom slide. Time everything.',
    anchors: [
      { id: 'aT', x:  0.0, y: -0.2, track: { ax: -1.0, ay: -0.2, bx: 1.0, by: -0.2, period: 3.0 } },
      { id: 'aL', x: -2.4, y:  1.6 },
      { id: 'aR', x:  2.4, y:  1.6 },
      { id: 'aB', x:  0.0, y:  3.4, track: { ax: -1.0, ay:  3.4, bx: 1.0, by:  3.4, period: 3.0 } },
    ],
    candy:   { x: 0, y: 1.6 },
    ropes:   [
      { from: 'aT', length: 2.0, segments: 9 },
      { from: 'aL', length: 2.6, segments: 10 },
      { from: 'aR', length: 2.6, segments: 10 },
      { from: 'aB', length: 2.0, segments: 9 },
    ],
    stars:   [{ x: -1.6, y: 3.0 }, { x: 0.0, y: 4.4 }, { x: 1.6, y: 3.0 }],
    target:  { x: 0, y: 5.2 },
    hazards: [],
    devices: [],
  },
  {
    // The grand finale — symmetric two-anchor cradle, mirror blowers,
    // flanking spikes, centre target. Everything Workshop introduced.
    id: 'l25', world: 3, number: 9, theme: WORK,
    name: 'The grand finale',
    hint: 'Slide, swing, blow, fall — patience.',
    anchors: [
      { id: 'a1', x: -2.6, y: -0.2, track: { ax: -2.6, ay: -0.2, bx: -0.6, by: -0.2, period: 4.0 } },
      { id: 'a2', x:  2.6, y: -0.2 },
    ],
    candy:   { x: 0, y: 2.4 },
    ropes:   [
      { from: 'a1', length: 3.8, segments: 13 },
      { from: 'a2', length: 3.8, segments: 13 },
    ],
    stars:   [{ x: -2.0, y: 3.4 }, { x: 0.0, y: 4.0 }, { x: 2.0, y: 3.4 }],
    target:  { x: 0, y: 5.4 },
    hazards: [
      { kind: 'spike', x: -3.4, y: 4.6, w: 1.4, h: 0.36 },
      { kind: 'spike', x:  3.4, y: 4.6, w: 1.4, h: 0.36 },
    ],
    devices: [
      { kind: 'blower', x: -3.4, y: 3.0, dirX: 1, dirY: 0, force: 28, length: 2.4, radius: 0.7 },
      { kind: 'blower', x:  3.4, y: 3.0, dirX: -1, dirY: 0, force: 28, length: 2.4, radius: 0.7 },
    ],
  },
];

export const WORLDS = [
  { id: 1, theme: SWEET, name: 'Sweet Shop' },
  { id: 2, theme: GREEN, name: 'Greenhouse' },
  { id: 3, theme: WORK,  name: 'Workshop' },
];

export const PALETTE = {
  [SWEET]: {
    backdropTop: '#fff3e2', backdropBot: '#f3c79f',
    floor: '#a87649', floorEdge: '#7a4d2c',
    pin: '#9aa7b3', pinRim: '#5e6e7d',
    candy: '#ff4d6d', wrapper: '#ffe14f',
    rope: '#e8c46f',
    target: '#9ddb8d', targetBelly: '#fff7d6',
    accent: '#ffb347',
  },
  [GREEN]: {
    backdropTop: '#dff0c5', backdropBot: '#a4c184',
    floor: '#7d5b3a', floorEdge: '#4f3d22',
    pin: '#8c8a4f', pinRim: '#5d5b30',
    candy: '#9ddb6a', wrapper: '#5fa64a',
    rope: '#d4b27a',
    target: '#ee9870', targetBelly: '#fff2e6',
    accent: '#7fb88a',
  },
  [WORK]: {
    backdropTop: '#3d4855', backdropBot: '#1f2530',
    floor: '#3a322b', floorEdge: '#1a140e',
    pin: '#ce744a', pinRim: '#7a3f1c',
    candy: '#d97a2a', wrapper: '#e2b264',
    rope: '#c69052',
    target: '#c7a6e2', targetBelly: '#fdf3ff',
    accent: '#ff7b3a',
  },
};

export function levelById(id) {
  return LEVELS.find((l) => l.id === id) || null;
}
