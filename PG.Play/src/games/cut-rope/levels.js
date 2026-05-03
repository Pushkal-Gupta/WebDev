// Snip — hand-built level data.
//
// Coordinate convention:
//   x: -5 .. +5  (left-right; 10 world units wide)
//   y:  -1 (top of frame) .. +6 (bottom)
//   The candy "falls" with +Y; the camera is positioned so +Y looks
//   like screen-down to the player.
//
// Design rules (after a verlet-simulator pass against the actual game
// physics):
//   1. Every level has a verified solve path (see scripts/cut-rope-
//      verify.mjs in repo root, or /tmp/cutrope-trajectory.mjs).
//   2. Stars sit on the candy's natural trajectory — not on
//      hand-calculated swing arcs that ignore chain elasticity and
//      damping.
//   3. Mochi sits where the candy actually settles after the intended
//      cut sequence; not where geometric idealism placed it.
//   4. We dropped the wind/blower mechanic for now: getting a candy to
//      ride a force-field across the arena is too sensitive to verlet
//      damping to ship without a custom integrator. Bubble lift covers
//      the same "freefall plus assist" puzzle space.
//   5. The viaAnchor "pin chain" mechanic is intentionally NOT used:
//      our engine doesn't free the candy when the first half is cut,
//      so the level reads as broken.

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
    candy:   { x: 0, y: 1.8 },
    ropes:   [{ from: 'a1', length: 2.0, segments: 9 }],
    stars:   [{ x: 0, y: 2.8 }, { x: 0, y: 3.6 }, { x: 0, y: 4.4 }],
    target:  { x: 0, y: 5.2 },
    hazards: [],
    devices: [],
  },
  {
    id: 'l2', world: 1, number: 2, theme: SWEET,
    name: 'Long swing',
    hint: 'Swing through every star, then cut at the apex.',
    anchors: [{ id: 'a1', x: 0.0, y: -0.2 }],
    candy:   { x: -2.6, y: 1.6 },
    ropes:   [{ from: 'a1', length: 3.0, segments: 12 }],
    stars:   [{ x: -1.6, y: 2.4 }, { x: 0.0, y: 2.8 }, { x: 1.6, y: 2.4 }],
    target:  { x: 2.6, y: 4.6 },
    hazards: [],
    devices: [],
  },
  {
    id: 'l3', world: 1, number: 3, theme: SWEET,
    name: 'Two ropes',
    hint: 'Cut the right rope first; the left rope swings the candy through the stars.',
    anchors: [{ id: 'a1', x: -2.0, y: -0.2 }, { id: 'a2', x: 2.0, y: -0.2 }],
    candy:   { x: 0, y: 1.8 },
    ropes:   [
      { from: 'a1', length: 3.0, segments: 11 },
      { from: 'a2', length: 3.0, segments: 11 },
    ],
    stars:   [{ x: -0.7, y: 2.6 }, { x: -1.9, y: 2.9 }, { x: -3.0, y: 2.5 }],
    target:  { x: -3.6, y: 4.6 },
    hazards: [],
    devices: [],
  },
  {
    id: 'l4', world: 1, number: 4, theme: SWEET,
    name: 'Wide swing',
    hint: 'Bigger arc. Same trick.',
    anchors: [{ id: 'a1', x: 0.0, y: -0.2 }],
    candy:   { x: -3.0, y: 1.6 },
    ropes:   [{ from: 'a1', length: 3.6, segments: 14 }],
    stars:   [{ x: -1.8, y: 3.0 }, { x: 0.0, y: 3.4 }, { x: 1.8, y: 3.0 }],
    target:  { x: 3.0, y: 4.6 },
    hazards: [],
    devices: [],
  },
  {
    id: 'l5', world: 1, number: 5, theme: SWEET,
    name: 'Twin drop',
    hint: 'Two ropes. Cut one to swing, cut the other to drop.',
    anchors: [
      { id: 'aL', x: -1.4, y: -0.2 },
      { id: 'aR', x:  1.4, y: -0.2 },
    ],
    candy:   { x: 0, y: 2.0 },
    ropes:   [
      { from: 'aL', length: 2.6, segments: 10 },
      { from: 'aR', length: 2.6, segments: 10 },
    ],
    stars:   [{ x: 0.3, y: 2.7 }, { x: 0.6, y: 3.3 }, { x: 0.9, y: 4.0 }],
    target:  { x: 1.2, y: 4.7 },
    hazards: [],
    devices: [],
  },

  // ── World 2 — Greenhouse (bubbles) ────────────────────────────────────
  {
    id: 'l6', world: 2, number: 1, theme: GREEN,
    name: 'Bubble lift',
    hint: 'Pop the bubble at the right time. Drop into Mochi.',
    anchors: [{ id: 'a1', x: 0, y: -0.2 }],
    candy:   { x: 0.3, y: 3.2 },
    ropes:   [{ from: 'a1', length: 3.6, segments: 13 }],
    stars:   [{ x: 0.0, y: 2.0 }, { x: -0.4, y: 0.6 }, { x: -0.8, y: -1.0 }],
    target:  { x: -1.0, y: 4.6 },
    hazards: [],
    devices: [{ kind: 'bubble', x: 0.3, y: 3.2, radius: 0.55 }],
  },
  {
    id: 'l7', world: 2, number: 2, theme: GREEN,
    name: 'Cradle pop',
    hint: 'The bubble lifts the cradle. Pop, then cut.',
    anchors: [{ id: 'a1', x: -1.6, y: -0.2 }, { id: 'a2', x: 1.6, y: -0.2 }],
    candy:   { x: 0.3, y: 2.4 },
    ropes:   [
      { from: 'a1', length: 3.0, segments: 12 },
      { from: 'a2', length: 3.0, segments: 12 },
    ],
    stars:   [{ x: 0.4, y: 1.4 }, { x: 0.5, y: 0.4 }, { x: 0.6, y: -0.6 }],
    target:  { x: 0, y: 4.6 },
    hazards: [],
    devices: [{ kind: 'bubble', x: 0.3, y: 2.4, radius: 0.55 }],
  },
  {
    id: 'l8', world: 2, number: 3, theme: GREEN,
    name: 'Lift over',
    hint: 'Lift past the spikes. Pop in the safe lane.',
    anchors: [{ id: 'a1', x: 0, y: -0.2 }],
    candy:   { x: 0.3, y: 3.2 },
    ropes:   [{ from: 'a1', length: 3.6, segments: 13 }],
    stars:   [{ x: 0.1, y: 2.0 }, { x: -0.4, y: 0.6 }, { x: -0.5, y: -1.0 }],
    target:  { x: -1.0, y: 4.6 },
    hazards: [
      { kind: 'spike', x: -2.4, y: 4.6, w: 1.4, h: 0.36 },
      { kind: 'spike', x:  2.4, y: 4.6, w: 1.4, h: 0.36 },
    ],
    devices: [{ kind: 'bubble', x: 0.3, y: 3.2, radius: 0.55 }],
  },

  // ── World 3 — Workshop (moving pins) ──────────────────────────────────
  {
    id: 'l9', world: 3, number: 1, theme: WORK,
    name: 'Sliding pin',
    hint: 'The anchor slides on its track. Time the cut.',
    anchors: [{ id: 'a1', x: -2.4, y: -0.2, track: { ax: -2.4, ay: -0.2, bx: 2.4, by: -0.2, period: 3.4 } }],
    candy:   { x: -2.4, y: 2.0 },
    ropes:   [{ from: 'a1', length: 2.4, segments: 10 }],
    stars:   [{ x: -1.6, y: 2.4 }, { x: 0.0, y: 2.4 }, { x: 1.6, y: 2.4 }],
    target:  { x: 0, y: 4.6 },
    hazards: [],
    devices: [],
  },
  {
    id: 'l10', world: 3, number: 2, theme: WORK,
    name: 'Pin pivot',
    hint: 'A floating pin. Build the swing.',
    anchors: [{ id: 'a1', x: 0, y: 1.2 }],
    candy:   { x: -2.6, y: 2.0 },
    ropes:   [{ from: 'a1', length: 2.8, segments: 12 }],
    stars:   [{ x: -1.4, y: 3.6 }, { x: 0.0, y: 4.0 }, { x: 1.4, y: 3.6 }],
    target:  { x: 2.6, y: 4.6 },
    hazards: [],
    devices: [],
  },
  {
    id: 'l11', world: 3, number: 3, theme: WORK,
    name: 'Spike track',
    hint: 'Time the cut. Mind the spike.',
    anchors: [{ id: 'a1', x: -2.6, y: -0.2, track: { ax: -2.6, ay: -0.2, bx: 2.6, by: -0.2, period: 3.6 } }],
    candy:   { x: -2.6, y: 2.4 },
    ropes:   [{ from: 'a1', length: 2.8, segments: 11 }],
    stars:   [{ x: -1.6, y: 2.8 }, { x: 0.0, y: 2.8 }, { x: 1.6, y: 2.8 }],
    target:  { x: 0, y: 4.7 },
    hazards: [
      { kind: 'spike', x: -3.4, y: 4.6, w: 1.4, h: 0.34 },
      { kind: 'spike', x:  3.4, y: 4.6, w: 1.4, h: 0.34 },
    ],
    devices: [],
  },
  {
    id: 'l12', world: 3, number: 4, theme: WORK,
    name: 'Two slides',
    hint: 'Both anchors slide on tracks. The cradle never sits still.',
    anchors: [
      { id: 'a1', x: -2.4, y: -0.2, track: { ax: -2.4, ay: -0.2, bx: -0.6, by: -0.2, period: 3.6 } },
      { id: 'a2', x:  2.4, y: -0.2, track: { ax:  2.4, ay: -0.2, bx:  0.6, by: -0.2, period: 4.4 } },
    ],
    candy:   { x: 0, y: 2.4 },
    ropes:   [
      { from: 'a1', length: 3.4, segments: 13 },
      { from: 'a2', length: 3.4, segments: 13 },
    ],
    stars:   [{ x: -0.8, y: 3.0 }, { x: 0.0, y: 3.4 }, { x: 0.8, y: 3.0 }],
    target:  { x: 0, y: 4.7 },
    hazards: [],
    devices: [],
  },
];

export const WORLDS = [
  { id: 1, theme: SWEET, name: 'Sweet Shop' },
  { id: 2, theme: GREEN, name: 'Greenhouse' },
  { id: 3, theme: WORK,  name: 'Workshop' },
];

export const PALETTE = {
  [SWEET]: {
    backdropTop: '#fff5e8', backdropBot: '#f6d3a8',
    floor: '#c8966c', floorEdge: '#7a4d2c',
    pin: '#d2dae2', pinRim: '#7d8a98',
    candy: '#ff4d6d', candyRim: '#7a1322', wrapper: '#ffd24a',
    rope: '#d8a64a',
    target: '#a3d995', targetBelly: '#f5fbe9', targetRim: '#3a5a30',
    accent: '#ffb347',
  },
  [GREEN]: {
    backdropTop: '#e6f1d3', backdropBot: '#a4c184',
    floor: '#9a774d', floorEdge: '#4f3d22',
    pin: '#d3d9b8', pinRim: '#6f7d4f',
    candy: '#a8df72', candyRim: '#2f4e1f', wrapper: '#5fa64a',
    rope: '#b88f4a',
    target: '#f1a280', targetBelly: '#fff2e2', targetRim: '#5b2a18',
    accent: '#7fb88a',
  },
  [WORK]: {
    backdropTop: '#3d4855', backdropBot: '#1f2530',
    floor: '#534437', floorEdge: '#1a140e',
    pin: '#e0a070', pinRim: '#7a3f1c',
    candy: '#ec8838', candyRim: '#4a1f08', wrapper: '#e2b264',
    rope: '#a96e3c',
    target: '#caa6df', targetBelly: '#f6e8ff', targetRim: '#3d2358',
    accent: '#ff7b3a',
  },
};

export function levelById(id) {
  return LEVELS.find((l) => l.id === id) || null;
}
