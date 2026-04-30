// Cut the Rope — hand-built level data.
//
// Coordinate convention:
//   x: -5 .. +5  (left-right; 10 world units wide)
//   y:  -1 (top of frame) .. +6 (bottom)
//   The candy "falls" with +Y; the camera is positioned so +Y looks
//   like screen-down to the player.
//
// Each level declares anchors, ropes, candy spawn, stars, target,
// hazards, devices, and the world theme (palette).

const SWEET = 'sweet';
const GREEN = 'green';
const WORK  = 'work';

export const LEVELS = [
  // ── World 1 — Sweet Shop ──────────────────────────────────────────────
  {
    id: 'l1', world: 1, number: 1, theme: SWEET,
    name: 'First taste',
    hint: 'Tap the rope to cut it.',
    anchors: [{ id: 'a1', x: 0, y: -0.2 }],
    candy:   { x: 0, y: 2.6 },
    ropes:   [{ from: 'a1', length: 2.8, segments: 11 }],
    stars:   [{ x: -0.2, y: 1.7 }, { x: 0.2, y: 3.2 }, { x: 0.0, y: 4.2 }],
    target:  { x: 0, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    // "Long swing" — candy spawns at ~65° left of vertical so verlet's
    // first integrate creates a real pendulum. Stars are placed on the
    // arc (each is exactly `rope.length` from the anchor) so a single
    // swing collects all three. Cut at the right-side apex to drop the
    // candy into Mochi.
    id: 'l2', world: 1, number: 2, theme: SWEET,
    name: 'Long swing',
    hint: 'Let it swing through every star, then cut.',
    anchors: [{ id: 'a1', x: 0.0, y: -0.2 }],
    candy:   { x: -2.72, y: 1.07 },
    ropes:   [{ from: 'a1', length: 3.0, segments: 12 }],
    stars:   [{ x: 0.0, y: 2.8 }, { x: 1.5, y: 2.4 }, { x: 2.6, y: 1.3 }],
    target:  { x: 2.6, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    id: 'l3', world: 1, number: 3, theme: SWEET,
    name: 'Two ropes',
    hint: 'Two ropes, one candy. The order you cut matters.',
    anchors: [{ id: 'a1', x: -1.7, y: -0.2 }, { id: 'a2', x: 1.7, y: -0.2 }],
    candy:   { x: 0, y: 1.8 },
    ropes:   [
      { from: 'a1', length: 2.5, segments: 10 },
      { from: 'a2', length: 2.5, segments: 10 },
    ],
    stars:   [{ x: -1.8, y: 2.4 }, { x: 0, y: 3.2 }, { x: 1.8, y: 2.4 }],
    target:  { x: 0, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    id: 'l4', world: 1, number: 4, theme: SWEET,
    name: 'Pin chain',
    hint: 'A floating pin re-routes the rope to a new pivot.',
    anchors: [{ id: 'a1', x: -2.4, y: -0.2 }, { id: 'a2', x: 0.6, y: 1.0, pin: true }],
    candy:   { x: 0.6, y: 3.4 },
    ropes:   [
      { from: 'a1', length: 3.2, segments: 12, viaAnchor: 'a2' },
    ],
    stars:   [{ x: -1.8, y: 2.6 }, { x: 0.6, y: 3.6 }, { x: 2.8, y: 2.0 }],
    target:  { x: 2.6, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    // Mirror of "Long swing" — Mochi waits on the left this time.
    id: 'l11', world: 1, number: 5, theme: SWEET,
    name: 'Swing back',
    hint: 'Mochi is on the left this time.',
    anchors: [{ id: 'a1', x: 0.0, y: -0.2 }],
    candy:   { x: 2.72, y: 1.07 },
    ropes:   [{ from: 'a1', length: 3.0, segments: 12 }],
    stars:   [{ x: 0.0, y: 2.8 }, { x: -1.5, y: 2.4 }, { x: -2.6, y: 1.3 }],
    target:  { x: -2.6, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    id: 'l12', world: 1, number: 6, theme: SWEET,
    name: 'Deep drop',
    hint: 'Short rope, long fall. The stars are on the line.',
    anchors: [{ id: 'a1', x: 0, y: -0.2 }],
    candy:   { x: 0, y: 1.0 },
    ropes:   [{ from: 'a1', length: 1.2, segments: 8 }],
    stars:   [{ x: 0.0, y: 2.4 }, { x: 0.0, y: 3.4 }, { x: 0.0, y: 4.2 }],
    target:  { x: 0, y: 5.2 },
    hazards: [],
    devices: [],
  },
  {
    // Twin pendulum — both ropes start taut at the lower circle-intersection
    // (~ y = 2.21). Cut one rope, candy swings on the survivor; cut the
    // survivor at the right moment to drop into Mochi.
    id: 'l13', world: 1, number: 7, theme: SWEET,
    name: 'Twin pendulum',
    hint: 'Two ropes meet in the middle. Order matters.',
    anchors: [{ id: 'a1', x: -2.4, y: -0.2 }, { id: 'a2', x: 2.4, y: -0.2 }],
    candy:   { x: 0, y: 2.4 },
    ropes:   [
      { from: 'a1', length: 3.6, segments: 12 },
      { from: 'a2', length: 3.6, segments: 12 },
    ],
    stars:   [{ x: -1.6, y: 3.6 }, { x: 0.0, y: 4.2 }, { x: 1.6, y: 3.6 }],
    target:  { x: 0, y: 5.2 },
    hazards: [],
    devices: [],
  },
  {
    // Three anchors in a fan; ropes sized so the side ropes are slightly
    // slack and the middle hangs straight. Cut two of the three to feed
    // Mochi from any angle.
    id: 'l14', world: 1, number: 8, theme: SWEET,
    name: 'Three-way',
    hint: 'Three ropes, three stars. Pick your route.',
    anchors: [
      { id: 'a1', x: -3.2, y: -0.2 },
      { id: 'a2', x:  0.0, y: -0.2 },
      { id: 'a3', x:  3.2, y: -0.2 },
    ],
    candy:   { x: 0, y: 2.0 },
    ropes:   [
      { from: 'a1', length: 4.0, segments: 14 },
      { from: 'a2', length: 2.4, segments: 10 },
      { from: 'a3', length: 4.0, segments: 14 },
    ],
    stars:   [{ x: -2.6, y: 3.0 }, { x: 0.0, y: 3.6 }, { x: 2.6, y: 3.0 }],
    target:  { x: 0, y: 5.2 },
    hazards: [],
    devices: [],
  },

  // ── World 2 — Greenhouse ──────────────────────────────────────────────
  {
    id: 'l5', world: 2, number: 1, theme: GREEN,
    name: 'Bubble lift',
    hint: 'Tap the bubble to pop it. The candy floats up while bubbled.',
    anchors: [{ id: 'a1', x: 0, y: -0.2 }],
    candy:   { x: 0, y: 4.0 },
    ropes:   [{ from: 'a1', length: 4.0, segments: 14 }],
    stars:   [{ x: -1.4, y: 1.8 }, { x: 1.4, y: 1.8 }, { x: 0, y: 0.4 }],
    target:  { x: 0, y: 5.0 },
    hazards: [],
    devices: [{ kind: 'bubble', x: 0, y: 4.0, radius: 0.55 }],
  },
  {
    id: 'l6', world: 2, number: 2, theme: GREEN,
    name: 'Fan blast',
    hint: 'A blower pushes the candy across the gap.',
    anchors: [{ id: 'a1', x: -2.6, y: -0.2 }],
    candy:   { x: -2.6, y: 1.4 },
    ropes:   [{ from: 'a1', length: 1.6, segments: 8 }],
    stars:   [{ x: -0.8, y: 2.0 }, { x: 1.0, y: 2.4 }, { x: 2.6, y: 3.6 }],
    target:  { x: 2.6, y: 5.0 },
    hazards: [],
    devices: [{ kind: 'blower', x: -1.4, y: 3.0, dirX: 1, dirY: -0.2, force: 80, length: 4.2, radius: 0.9 }],
  },
  {
    id: 'l7', world: 2, number: 3, theme: GREEN,
    name: 'Spike row',
    hint: 'Spikes are deadly. Plan the swing arc carefully.',
    anchors: [{ id: 'a1', x: -2.0, y: -0.2 }],
    candy:   { x: -2.0, y: 1.8 },
    ropes:   [{ from: 'a1', length: 2.0, segments: 9 }],
    stars:   [{ x: -0.6, y: 2.2 }, { x: 0.8, y: 2.2 }, { x: 2.4, y: 2.6 }],
    target:  { x: 3.4, y: 5.0 },
    hazards: [{ kind: 'spike', x: 1.5, y: 4.6, w: 1.6, h: 0.4 }],
    devices: [],
  },
  {
    // Bubble lift carries candy upward past the first star; pop + swing
    // gets the rest. Rope length 4.0 lets the swing reach centre stars.
    id: 'l15', world: 2, number: 4, theme: GREEN,
    name: 'Lift then drop',
    hint: 'Bubble lifts you. Pop when you see the path.',
    anchors: [{ id: 'a1', x: -2.4, y: -0.2 }],
    candy:   { x: -2.4, y: 3.4 },
    ropes:   [{ from: 'a1', length: 4.0, segments: 14 }],
    stars:   [{ x: -2.4, y: 1.6 }, { x: 0.0, y: 2.8 }, { x: 2.0, y: 4.0 }],
    target:  { x: 2.6, y: 5.0 },
    hazards: [],
    devices: [{ kind: 'bubble', x: -2.4, y: 3.4, radius: 0.55 }],
  },
  {
    // Two staggered blowers form a wind escalator. Blower 1 catches the
    // initial drop at x ≈ -3 (range begins at -3); blower 2 picks up at
    // x ≈ 0 to push past the centre.
    id: 'l16', world: 2, number: 5, theme: GREEN,
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
    // Vertical alley between two spike banks. Stars are on the drop line,
    // so a clean cut + fall picks all three up and lands in Mochi.
    id: 'l17', world: 2, number: 6, theme: GREEN,
    name: 'Spike alley',
    hint: 'Stay narrow. Stars are on the way down.',
    anchors: [{ id: 'a1', x: 0, y: -0.2 }],
    candy:   { x: 0, y: 1.6 },
    ropes:   [{ from: 'a1', length: 1.8, segments: 9 }],
    stars:   [{ x: 0.0, y: 2.6 }, { x: 0.0, y: 3.4 }, { x: 0.0, y: 4.2 }],
    target:  { x: 0, y: 5.2 },
    hazards: [
      { kind: 'spike', x: -2.6, y: 4.6, w: 2.4, h: 0.4 },
      { kind: 'spike', x:  2.6, y: 4.6, w: 2.4, h: 0.4 },
    ],
    devices: [],
  },
  {
    id: 'l18', world: 2, number: 7, theme: GREEN,
    name: 'Greenhouse breeze',
    hint: 'A long blower, then a longer one.',
    anchors: [{ id: 'a1', x: -2.6, y: -0.2 }],
    candy:   { x: -2.6, y: 1.6 },
    ropes:   [{ from: 'a1', length: 2.0, segments: 10 }],
    stars:   [{ x: -1.0, y: 2.6 }, { x: 0.6, y: 3.4 }, { x: 2.0, y: 4.0 }],
    target:  { x: 2.8, y: 5.0 },
    hazards: [],
    devices: [
      { kind: 'blower', x: -3.0, y: 3.0, dirX: 1, dirY: 0, force: 50, length: 4.0, radius: 0.8 },
      { kind: 'blower', x:  0.5, y: 4.0, dirX: 1, dirY: 0, force: 40, length: 3.5, radius: 0.8 },
    ],
  },
  {
    // World 2 capstone — three blowers + a centre spike. The candy must
    // stay high until past the spike; the third blower nudges it down
    // toward Mochi.
    id: 'l19', world: 2, number: 8, theme: GREEN,
    name: 'Three winds',
    hint: 'Each gust hands you to the next. Mind the spike.',
    anchors: [{ id: 'a1', x: -3.0, y: -0.2 }],
    candy:   { x: -3.0, y: 1.4 },
    ropes:   [{ from: 'a1', length: 1.6, segments: 8 }],
    stars:   [{ x: -1.6, y: 2.6 }, { x: 0.4, y: 3.4 }, { x: 2.6, y: 3.6 }],
    target:  { x: 3.0, y: 5.0 },
    hazards: [{ kind: 'spike', x: 0, y: 4.6, w: 1.6, h: 0.36 }],
    devices: [
      { kind: 'blower', x: -3.0, y: 3.0, dirX: 1, dirY: -0.05, force: 55, length: 3.0, radius: 0.7 },
      { kind: 'blower', x: -0.5, y: 3.6, dirX: 1, dirY: -0.05, force: 50, length: 3.0, radius: 0.7 },
      { kind: 'blower', x:  2.0, y: 4.0, dirX: 1, dirY: 0,     force: 40, length: 2.0, radius: 0.7 },
    ],
  },

  // ── World 3 — Workshop ────────────────────────────────────────────────
  {
    id: 'l8', world: 3, number: 1, theme: WORK,
    name: 'Sliding pin',
    hint: 'The anchor slides on its track. Time the cut.',
    anchors: [{ id: 'a1', x: -2.4, y: -0.2, track: { ax: -2.4, ay: -0.2, bx: 2.4, by: -0.2, period: 3.4 } }],
    candy:   { x: -2.4, y: 2.4 },
    ropes:   [{ from: 'a1', length: 2.4, segments: 10 }],
    stars:   [{ x: -1.0, y: 3.2 }, { x: 0.0, y: 3.6 }, { x: 1.4, y: 3.2 }],
    target:  { x: 0, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    id: 'l9', world: 3, number: 2, theme: WORK,
    name: 'Cross winds',
    hint: 'Two blowers, two ropes. Order is everything.',
    anchors: [{ id: 'a1', x: -2.4, y: -0.2 }, { id: 'a2', x: 2.4, y: -0.2 }],
    candy:   { x: 0, y: 1.6 },
    ropes:   [
      { from: 'a1', length: 2.6, segments: 10 },
      { from: 'a2', length: 2.6, segments: 10 },
    ],
    stars:   [{ x: -2.4, y: 3.4 }, { x: 0.0, y: 4.0 }, { x: 2.4, y: 3.4 }],
    target:  { x: 0, y: 5.0 },
    hazards: [],
    devices: [
      { kind: 'blower', x: -3.6, y: 2.4, dirX: 1, dirY: 0, force: 50, length: 2.8, radius: 0.7 },
      { kind: 'blower', x: 3.6, y: 2.4, dirX: -1, dirY: 0, force: 50, length: 2.8, radius: 0.7 },
    ],
  },
  {
    id: 'l10', world: 3, number: 3, theme: WORK,
    name: 'The finale',
    hint: 'Everything you have learned, in one room.',
    anchors: [{ id: 'a1', x: -2.6, y: -0.2 }, { id: 'a2', x: 2.6, y: -0.2 }],
    candy:   { x: 0, y: 1.4 },
    ropes:   [
      { from: 'a1', length: 2.6, segments: 10 },
      { from: 'a2', length: 2.6, segments: 10 },
    ],
    stars:   [{ x: -2.4, y: 3.4 }, { x: 0.0, y: 0.6 }, { x: 2.4, y: 3.4 }],
    target:  { x: 0, y: 5.0 },
    hazards: [{ kind: 'spike', x: 0, y: 4.6, w: 1.6, h: 0.4 }],
    devices: [
      { kind: 'bubble', x: 0, y: 1.4, radius: 0.55 },
      { kind: 'blower', x: -3.6, y: 2.6, dirX: 1, dirY: 0, force: 38, length: 2.8, radius: 0.7 },
    ],
  },
  {
    // Sliding anchor sweeps left↔right with a 4 s period. Stars sit on
    // the swing arc; the rope is short enough that they can be picked up
    // one per traverse.
    id: 'l20', world: 3, number: 4, theme: WORK,
    name: 'Sliding star',
    hint: 'The anchor cycles. Catch each star on the way through.',
    anchors: [{ id: 'a1', x: -2.4, y: -0.2, track: { ax: -2.4, ay: -0.2, bx: 2.4, by: -0.2, period: 4.0 } }],
    candy:   { x: -2.4, y: 2.6 },
    ropes:   [{ from: 'a1', length: 2.8, segments: 11 }],
    stars:   [{ x: -1.6, y: 3.4 }, { x: 0.0, y: 3.6 }, { x: 1.6, y: 3.4 }],
    target:  { x: 2.6, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    // Two opposing tracked anchors with different periods — they go in
    // and out of sync, so the candy "wobbles" naturally.
    id: 'l21', world: 3, number: 5, theme: WORK,
    name: 'Two slides',
    hint: 'Both anchors move. Their rhythms differ.',
    anchors: [
      { id: 'a1', x: -2.4, y: -0.2, track: { ax: -2.4, ay: -0.2, bx: -0.6, by: -0.2, period: 3.6 } },
      { id: 'a2', x:  2.4, y: -0.2, track: { ax:  2.4, ay: -0.2, bx:  0.6, by: -0.2, period: 4.4 } },
    ],
    candy:   { x: 0, y: 2.0 },
    ropes:   [
      { from: 'a1', length: 3.0, segments: 12 },
      { from: 'a2', length: 3.0, segments: 12 },
    ],
    stars:   [{ x: -1.8, y: 3.2 }, { x: 0.0, y: 3.6 }, { x: 1.8, y: 3.2 }],
    target:  { x: 0, y: 5.0 },
    hazards: [],
    devices: [],
  },
  {
    // A long horizontal blower keeps the candy elevated past two spike
    // banks. Cut the rope when momentum is right, ride the wind home.
    id: 'l22', world: 3, number: 6, theme: WORK,
    name: 'Saw line',
    hint: 'The wind carries you over the saws.',
    anchors: [{ id: 'a1', x: -2.6, y: -0.2 }],
    candy:   { x: -2.6, y: 1.4 },
    ropes:   [{ from: 'a1', length: 1.8, segments: 9 }],
    stars:   [{ x: -1.0, y: 2.4 }, { x: 0.6, y: 2.4 }, { x: 2.2, y: 2.4 }],
    target:  { x: 2.8, y: 5.0 },
    hazards: [
      { kind: 'spike', x: -1.0, y: 4.4, w: 1.6, h: 0.4 },
      { kind: 'spike', x:  1.4, y: 4.4, w: 1.6, h: 0.4 },
    ],
    devices: [{ kind: 'blower', x: -3.0, y: 2.6, dirX: 1, dirY: -0.1, force: 55, length: 6.0, radius: 0.8 }],
  },
  {
    // Bubble lifts the candy STRAIGHT UP through three centre stars,
    // then a clean pop drops it down the safe lane between two spike
    // banks into Mochi.
    id: 'l23', world: 3, number: 7, theme: WORK,
    name: 'Pop or perish',
    hint: 'Pop in the safe lane between the spikes.',
    anchors: [{ id: 'a1', x: 0, y: -0.2 }],
    candy:   { x: 0, y: 3.6 },
    ropes:   [{ from: 'a1', length: 3.8, segments: 13 }],
    stars:   [{ x: 0.0, y: 2.4 }, { x: 0.0, y: 1.2 }, { x: 0.0, y: 0.0 }],
    target:  { x: 0, y: 5.2 },
    hazards: [
      { kind: 'spike', x: -2.4, y: 4.6, w: 1.4, h: 0.36 },
      { kind: 'spike', x:  2.4, y: 4.6, w: 1.4, h: 0.36 },
    ],
    devices: [{ kind: 'bubble', x: 0, y: 3.6, radius: 0.55 }],
  },
  {
    // Three blowers + spike. Each blower is just strong enough to hand
    // off to the next. Skip a star, you can still finish — but no 3★.
    id: 'l24', world: 3, number: 8, theme: WORK,
    name: 'Blower funnel',
    hint: 'Three blowers. One narrow path.',
    anchors: [{ id: 'a1', x: -3.0, y: -0.2 }],
    candy:   { x: -3.0, y: 1.4 },
    ropes:   [{ from: 'a1', length: 1.6, segments: 8 }],
    stars:   [{ x: -1.4, y: 2.6 }, { x: 0.6, y: 3.4 }, { x: 2.4, y: 4.0 }],
    target:  { x: 3.0, y: 5.0 },
    hazards: [{ kind: 'spike', x: 0, y: 4.9, w: 1.6, h: 0.32 }],
    devices: [
      { kind: 'blower', x: -3.0, y: 2.6, dirX: 1, dirY: 0, force: 60, length: 3.6, radius: 0.7 },
      { kind: 'blower', x:  0.0, y: 3.4, dirX: 1, dirY: 0, force: 50, length: 3.0, radius: 0.7 },
      { kind: 'blower', x:  2.4, y: 4.0, dirX: 1, dirY: 0, force: 36, length: 1.5, radius: 0.7 },
    ],
  },
  {
    // The grand finale — sliding anchor, twin ropes, mirror blowers,
    // flanking spikes, centre target. Everything Workshop introduced.
    id: 'l25', world: 3, number: 9, theme: WORK,
    name: 'The grand finale',
    hint: 'Slide, swing, blow, fall — patience.',
    anchors: [
      { id: 'a1', x: -2.6, y: -0.2, track: { ax: -2.6, ay: -0.2, bx: -0.6, by: -0.2, period: 4.0 } },
      { id: 'a2', x:  2.6, y: -0.2 },
    ],
    candy:   { x: 0, y: 1.6 },
    ropes:   [
      { from: 'a1', length: 3.4, segments: 13 },
      { from: 'a2', length: 3.4, segments: 13 },
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
