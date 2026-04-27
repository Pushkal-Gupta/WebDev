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
    id: 'l2', world: 1, number: 2, theme: SWEET,
    name: 'Long swing',
    hint: 'Time the cut so the swing collects all three stars.',
    anchors: [{ id: 'a1', x: -1.6, y: -0.2 }],
    candy:   { x: -1.6, y: 2.4 },
    ropes:   [{ from: 'a1', length: 2.6, segments: 11 }],
    stars:   [{ x: 0.0, y: 2.6 }, { x: 1.4, y: 2.4 }, { x: 2.6, y: 1.6 }],
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
