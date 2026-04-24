import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

// Grudgewood — a premium single-player hostile-environment trap-survival game.
// The forest remembers.
//
// Design pillars:
//   1. The world is an antagonist, not decoration.
//   2. Every lethal surprise has a readable tell — players feel tricked, not cheated.
//   3. Death is fast, dramatic, and funny (slow-mo, camera zoom, ragdoll, epitaph).
//   4. Trap language is taught by isolation → variation → combination → weaponized trust.

// ──────────────────────────────────────────────────────────────────────────
// Engine constants
// ──────────────────────────────────────────────────────────────────────────
const W = 1120;
const H = 640;
const GROUND_Y = 540;
const STEP = 1 / 60;

const COYOTE = 0.10;
const JUMP_BUFFER = 0.12;
const INVULN_ON_RESPAWN = 0.22;
const RESPAWN_DELAY = 0.50;
const SLOWMO_TIME = 0.18;
const SLOWMO_SCALE = 0.22;
const CAMERA_SMOOTH = 6.5;
const CAMERA_LEAD = 140;
const CAMERA_ZOOM_DEATH = 1.28;

const WALK_MAX = 220;
const SPRINT_MAX = 320;
const GROUND_ACCEL = 1700;
const AIR_ACCEL = 900;
const GROUND_FRICTION = 1800;
const JUMP_V = -540;
const GRAVITY = 1650;
const MAX_FALL = 1000;
const JUMP_RELEASE_DAMP = 0.45;

const P_W = 22;
const P_H = 38;
const SLIDE_H = 22;
const SLIDE_TIME = 0.32;
const SLIDE_SPEED = 360;

// Helpers
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;
const aabb = (ax, ay, aw, ah, bx, by, bw, bh) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
const pick = (a) => a[(Math.random() * a.length) | 0];

// Biome-aware atmosphere particle factory. Normal biomes drift left-to-right
// slowly (pollen, spores); biomes with particleFall rain downward (embers).
function seedDriftParticle(biome, x, y) {
  if (biome && biome.particleFall) {
    return {
      type: 'drift',
      x, y,
      vx: -0.3 + Math.random() * 0.6,
      vy: 2.5 + Math.random() * 2.2,
      life: 3.8 + Math.random() * 2.2,
      max: 6,
      size: 1 + Math.random() * 1.4,
    };
  }
  return {
    type: 'drift',
    x, y,
    vx: -5 - Math.random() * 8,
    vy: -1 + Math.random() * 3,
    life: 5 + Math.random() * 3,
    max: 8,
    size: 1 + Math.random() * 1.2,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Biome palettes. Each biome has sky gradient, mountain tone, fog color,
// tree tones (far/mid), ground, particle tint, and accent.
// ──────────────────────────────────────────────────────────────────────────
const BIOMES = {
  mosswake: {
    id: 'mosswake',
    name: 'Mosswake',
    sky: ['#f5cb86', '#e99668', '#8c4a32'],
    mountains: '#70452f',
    fog: 'rgba(244, 168, 110, 0.18)',
    farTrees: '#2b3f23',
    midCanopy: '#1c2a17',
    canopyHighlight: '#3a5424',
    ground: '#3c4a22',
    groundDark: '#1e2810',
    grass: '#5a7630',
    grassLight: '#89a74e',
    accent: '#ffe39c',
    particleTint: 'rgba(255, 226, 160, 0.55)',
    vignette: 'rgba(40, 16, 8, 0.32)',
  },
  rotbog: {
    id: 'rotbog',
    name: 'The Rotbog',
    sky: ['#3e5654', '#2a3c3a', '#141c1a'],
    mountains: '#25312f',
    fog: 'rgba(160, 220, 200, 0.14)',
    farTrees: '#192926',
    midCanopy: '#0f1d1a',
    canopyHighlight: '#224038',
    ground: '#2b3830',
    groundDark: '#121a16',
    grass: '#3a5046',
    grassLight: '#5a7a68',
    accent: '#a4f2d4',
    particleTint: 'rgba(180, 240, 210, 0.45)',
    vignette: 'rgba(6, 26, 22, 0.5)',
  },
  heart: {
    id: 'heart',
    name: 'The Heart',
    sky: ['#7a1a1a', '#3a0606', '#150202'],
    mountains: '#1f0606',
    fog: 'rgba(240, 120, 70, 0.16)',
    farTrees: '#0a0202',
    midCanopy: '#080000',
    canopyHighlight: '#5a1010',
    ground: '#2a0a08',
    groundDark: '#0a0000',
    grass: '#4a1616',
    grassLight: '#7a2424',
    accent: '#ff8a42',
    particleTint: 'rgba(255, 150, 80, 0.62)',
    vignette: 'rgba(42, 6, 4, 0.55)',
    particleFall: true, // embers rain downward instead of drifting
  },
};

// ──────────────────────────────────────────────────────────────────────────
// Epitaphs — one line, understated, per trap family.
// ──────────────────────────────────────────────────────────────────────────
const EPITAPHS = {
  whip: [
    'A branch remembered an argument.',
    'Heard the creak. Stood still.',
    'Wrong tree. Wrong second.',
    'The oak took its shot.',
    'You gave the canopy an opening.',
    'Branches have politics.',
    'The grove kept its promise.',
    'That was not a lullaby.',
  ],
  snare: [
    'The roots were listening.',
    'Standing still was the mistake.',
    'The floor was never still.',
    'Patience, punished.',
    'Roots know what you ate last.',
    'The soil held a grudge.',
    'You hesitated. It did not.',
    'A quiet patch is a loud trap.',
  ],
  mushroom: [
    'Spores have opinions.',
    'Red cap. Red flag.',
    'Lingering is a diagnosis.',
    'The bloom was personal.',
    'A mushroom named you.',
    'Fungal committee reached quorum.',
    'You stepped on something\'s breakfast.',
    'The cap popped. So did you.',
  ],
  log: [
    'A log with errands.',
    'Downhill is a rumor.',
    'The bark let go on purpose.',
    'Weight + slope + you.',
    'A log remembered its youth.',
    'Rolling was not your invention.',
    'Momentum, delivered.',
    'The tree filed a complaint.',
  ],
  pit: [
    'You found the cellar.',
    'The forest floor wasn\'t.',
    'A short, final descent.',
    'That gap was honest.',
    'Gravity, on the clock.',
    'Ground stopped participating.',
  ],
  predator: [
    'The tree was staring the whole time.',
    'Eyes you didn\'t earn.',
    'A branch came down like an appointment.',
    'It had been watching for a while.',
    'The canopy blinked. Then moved.',
    'You stepped into its aperture.',
    'The grove had a favourite.',
    'The tree waited. You didn\'t.',
  ],
  stump: [
    'The stump was not a stump.',
    'Teeth in the wood.',
    'A mouth that learned to sit still.',
    'You sat on something with opinions.',
    'Stumps lie flat. That one did not.',
    'You mistook it for furniture.',
    'The ring was gums, not grain.',
    'It had been hungry since Tuesday.',
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// Stages — authored, scrolling worlds. Each stage teaches + varies + combines.
//
// Platform kinds:
//   'ground'   — solid floor strip
//   'ledge'    — elevated solid
//   'collapse' — creaks + drops when stood-on > delay
//
// Trap types:
//   'whip'     — tree-branch horizontal swing from a tree trunk
//   'snare'    — ground patch, arms at standing, fires up with spikes
//   'mushroom' — cap blooms cloud after delay; lethal if player inside radius
//   'log'      — detaches on proximity, rolls downhill with accel
//   'pit'      — instant-death rectangle
// ──────────────────────────────────────────────────────────────────────────
const STAGES = [
  // 1. MOSSWAKE — Sunlit Path (teach: mushroom idle + bloom as warning only)
  {
    id: 'sunlit', title: 'Sunlit Path', biome: 'mosswake',
    tip: 'A or D to walk. Space to jump. Reach the grove edge.',
    worldWidth: 1800,
    spawn: { x: 60, y: 480 },
    exit: { x: 1720, y: 460, w: 60, h: 100 },
    platforms: [
      { kind: 'ground', x: 0, y: GROUND_Y, w: 1800, h: 100 },
      { kind: 'ledge', x: 540, y: 460, w: 120, h: 14 },
    ],
    traps: [
      // Taught-safe mushroom: pops a small WARNING cloud that doesn't quite reach player's path.
      { type: 'mushroom', id: 'm1', x: 820, y: GROUND_Y - 18, cloudR: 62, delay: 0.36, cloudLife: 1.0, safeTeach: true, family: 'mushroom' },
      // First real mushroom later.
      { type: 'mushroom', id: 'm2', x: 1280, y: GROUND_Y - 18, cloudR: 96, delay: 0.32, cloudLife: 1.05, family: 'mushroom' },
    ],
    checkpoints: [],
    props: [
      { kind: 'bigTree', x: 130, scale: 1.05, tone: 0 },
      { kind: 'bigTree', x: 380, scale: 0.9, tone: 1 },
      { kind: 'fern', x: 240 },
      { kind: 'fern', x: 480 },
      { kind: 'fern', x: 720 },
      { kind: 'bigTree', x: 1020, scale: 1.15, tone: 0 },
      { kind: 'lightShaft', x: 340, alpha: 0.20 },
      { kind: 'lightShaft', x: 920, alpha: 0.25 },
      { kind: 'bigTree', x: 1400, scale: 0.95, tone: 1 },
      { kind: 'fern', x: 1560 },
      { kind: 'fern', x: 1240 },
    ],
    signs: [{ x: 1660, y: 420, text: 'MOSSWAKE', big: true }],
  },

  // 2. MOSSWAKE — Creaking Oaks (teach: branch whip)
  {
    id: 'creaking', title: 'Creaking Oaks', biome: 'mosswake',
    tip: 'Trees creak before they swing.',
    worldWidth: 2400,
    spawn: { x: 60, y: 480 },
    exit: { x: 2320, y: 460, w: 60, h: 100 },
    platforms: [
      { kind: 'ground', x: 0, y: GROUND_Y, w: 2400, h: 100 },
      { kind: 'ledge', x: 680, y: 448, w: 140, h: 14 },
      { kind: 'ledge', x: 1380, y: 440, w: 160, h: 14 },
    ],
    traps: [
      // Three whip trees — each escalates in wind-up speed.
      { type: 'whip', id: 'w1', x: 420, y: GROUND_Y, windup: 0.38, sweep: 280, dir: 1, family: 'whip' },
      { type: 'whip', id: 'w2', x: 1020, y: GROUND_Y, windup: 0.30, sweep: 310, dir: -1, family: 'whip' },
      { type: 'whip', id: 'w3', x: 1760, y: GROUND_Y, windup: 0.24, sweep: 330, dir: 1, family: 'whip' },
      // One mushroom to reinforce the earlier lesson
      { type: 'mushroom', id: 'cm1', x: 1560, y: GROUND_Y - 18, cloudR: 94, delay: 0.30, cloudLife: 1.0, family: 'mushroom' },
    ],
    checkpoints: [{ x: 1200, y: GROUND_Y - 50 }],
    props: [
      { kind: 'bigTree', x: 200, scale: 1.05, tone: 0 },
      { kind: 'fern', x: 340 },
      { kind: 'bigTree', x: 620, scale: 0.9, tone: 1 },
      { kind: 'fern', x: 860 },
      { kind: 'bigTree', x: 1220, scale: 1.1, tone: 0 },
      { kind: 'lightShaft', x: 1150, alpha: 0.24 },
      { kind: 'bigTree', x: 1680, scale: 0.95, tone: 1 },
      { kind: 'fern', x: 1900 },
      { kind: 'fern', x: 2100 },
      { kind: 'bigTree', x: 2240, scale: 1.0, tone: 0 },
    ],
    signs: [{ x: 310, y: 420, text: 'listen for creaks', small: true }],
  },

  // 3. ROTBOG — Snare Bend (teach: root snare + mushroom combo)
  {
    id: 'snarebend', title: 'Snare Bend', biome: 'rotbog',
    tip: 'Keep moving. The floor listens.',
    worldWidth: 2400,
    spawn: { x: 60, y: 480 },
    exit: { x: 2320, y: 460, w: 60, h: 100 },
    platforms: [
      { kind: 'ground', x: 0, y: GROUND_Y, w: 780, h: 100 },
      { kind: 'ground', x: 880, y: GROUND_Y, w: 1520, h: 100 },
      { kind: 'ledge', x: 1160, y: 438, w: 160, h: 14 },
    ],
    traps: [
      { type: 'pit', id: 'pit3', x: 780, y: GROUND_Y + 2, w: 100, h: 100, family: 'pit' },
      // Visible snares (discolored soil)
      { type: 'snare', id: 's1', x: 360, y: GROUND_Y - 2, w: 60, h: 10, arm: 0.30, windup: 0.20, visible: true, family: 'snare' },
      { type: 'snare', id: 's2', x: 1020, y: GROUND_Y - 2, w: 70, h: 10, arm: 0.28, windup: 0.18, visible: true, family: 'snare' },
      { type: 'snare', id: 's3', x: 1460, y: GROUND_Y - 2, w: 70, h: 10, arm: 0.25, windup: 0.16, visible: true, family: 'snare' },
      // One nearly-invisible snare (after prior teaching)
      { type: 'snare', id: 's4', x: 1900, y: GROUND_Y - 2, w: 70, h: 10, arm: 0.28, windup: 0.16, visible: false, family: 'snare' },
      // Mushrooms to force movement timing
      { type: 'mushroom', id: 'sm1', x: 1300, y: GROUND_Y - 18, cloudR: 96, delay: 0.30, cloudLife: 1.0, family: 'mushroom' },
    ],
    checkpoints: [{ x: 1100, y: GROUND_Y - 50 }],
    props: [
      { kind: 'bigTree', x: 170, scale: 0.95, tone: 0 },
      { kind: 'fern', x: 260, rot: true },
      { kind: 'fungus', x: 500 },
      { kind: 'bigTree', x: 960, scale: 1.05, tone: 1 },
      { kind: 'fungus', x: 1080 },
      { kind: 'bigTree', x: 1380, scale: 0.85, tone: 0 },
      { kind: 'fungus', x: 1620 },
      { kind: 'bigTree', x: 1820, scale: 1.0, tone: 1 },
      { kind: 'fungus', x: 2000 },
      { kind: 'bigTree', x: 2180, scale: 0.9, tone: 0 },
    ],
    signs: [{ x: 420, y: 416, text: 'discolored soil', small: true }],
  },

  // 4. ROTBOG — The Hollow (combine all 4 families + log finale)
  {
    id: 'hollow', title: 'The Hollow', biome: 'rotbog',
    tip: 'You know the rules. The forest is out of patience.',
    worldWidth: 3000,
    spawn: { x: 60, y: 480 },
    exit: { x: 2920, y: 460, w: 60, h: 100 },
    platforms: [
      { kind: 'ground', x: 0, y: GROUND_Y, w: 3000, h: 100 },
      { kind: 'ledge', x: 460, y: 448, w: 140, h: 14 },
      { kind: 'ledge', x: 1120, y: 432, w: 140, h: 14 },
      { kind: 'collapse', x: 1460, y: 438, w: 80, h: 14, delay: 0.30 },
      { kind: 'ledge', x: 1720, y: 432, w: 120, h: 14 },
      { kind: 'ledge', x: 2120, y: 448, w: 140, h: 14 },
    ],
    traps: [
      // Opening whip + mushroom
      { type: 'whip', id: 'hw1', x: 380, y: GROUND_Y, windup: 0.28, sweep: 310, dir: 1, family: 'whip' },
      { type: 'mushroom', id: 'hm1', x: 720, y: GROUND_Y - 18, cloudR: 96, delay: 0.28, cloudLife: 1.0, family: 'mushroom' },

      // Snare valley
      { type: 'snare', id: 'hs1', x: 880, y: GROUND_Y - 2, w: 60, h: 10, arm: 0.25, windup: 0.16, visible: true, family: 'snare' },
      { type: 'snare', id: 'hs2', x: 980, y: GROUND_Y - 2, w: 60, h: 10, arm: 0.22, windup: 0.14, visible: false, family: 'snare' },
      { type: 'mushroom', id: 'hm2', x: 1320, y: GROUND_Y - 18, cloudR: 100, delay: 0.24, cloudLife: 1.0, family: 'mushroom' },

      // Whip over collapse
      { type: 'whip', id: 'hw2', x: 1600, y: GROUND_Y, windup: 0.24, sweep: 340, dir: -1, family: 'whip' },

      // Log wave finale — three logs rolling downhill
      { type: 'log', id: 'hl1', x: 2900, startX: 2900, speed: 360, windup: 0.20, armX: 1900, dir: -1, family: 'log' },
      { type: 'log', id: 'hl2', x: 2980, startX: 2980, speed: 420, windup: 0.55, armX: 1900, dir: -1, family: 'log' },
      { type: 'log', id: 'hl3', x: 3060, startX: 3060, speed: 480, windup: 0.95, armX: 1900, dir: -1, family: 'log' },

      // Final whip near exit
      { type: 'whip', id: 'hw3', x: 2720, y: GROUND_Y, windup: 0.22, sweep: 320, dir: -1, family: 'whip' },
    ],
    checkpoints: [{ x: 860, y: GROUND_Y - 50 }, { x: 1800, y: GROUND_Y - 50 }],
    props: [
      { kind: 'bigTree', x: 220, scale: 1.1, tone: 0 },
      { kind: 'fungus', x: 340 },
      { kind: 'bigTree', x: 700, scale: 1.0, tone: 1 },
      { kind: 'fungus', x: 820 },
      { kind: 'bigTree', x: 1040, scale: 0.9, tone: 0 },
      { kind: 'fungus', x: 1260 },
      { kind: 'bigTree', x: 1480, scale: 1.2, tone: 1 },
      { kind: 'fungus', x: 1680 },
      { kind: 'bigTree', x: 1900, scale: 1.0, tone: 0 },
      { kind: 'fungus', x: 2120 },
      { kind: 'bigTree', x: 2380, scale: 0.9, tone: 1 },
      { kind: 'fungus', x: 2560 },
      { kind: 'bigTree', x: 2780, scale: 1.15, tone: 0 },
    ],
    signs: [{ x: 2870, y: 420, text: 'THE EDGE', big: true }],
  },

  // 5. ROTBOG — Fogmouth (teach: Predator Tree + Fake Stump)
  //
  // Teaching order:
  //   - First: a run of safe stumps so the player learns "stumps are part of the world"
  //   - Then: a single fake stump with visible teeth (the tell) placed among safe stumps
  //   - Then: a Predator Tree in isolation with generous windup
  //   - Finally: both combined with existing families
  {
    id: 'fogmouth', title: 'Fogmouth', biome: 'rotbog',
    tip: 'Some stumps smile back. Some trees stare.',
    worldWidth: 2600,
    spawn: { x: 60, y: 480 },
    exit: { x: 2520, y: 460, w: 60, h: 100 },
    platforms: [
      { kind: 'ground', x: 0, y: GROUND_Y, w: 2600, h: 100 },
      { kind: 'ledge', x: 900, y: 438, w: 140, h: 14 },
      { kind: 'ledge', x: 1780, y: 438, w: 140, h: 14 },
    ],
    traps: [
      // Isolated teaching fakestump — obvious teeth, early in stage
      { type: 'fakestump', id: 'fs1', x: 460, y: GROUND_Y, w: 44, family: 'stump' },
      // A predator tree in isolation — ample range, generous windup
      { type: 'predator', id: 'pr1', x: 1200, y: GROUND_Y, range: 280, alert: 0.40, windup: 0.34, recovery: 1.0, family: 'predator' },
      // Reinforcement: mushroom combo to keep the player moving
      { type: 'mushroom', id: 'fgm1', x: 1480, y: GROUND_Y - 18, cloudR: 96, delay: 0.30, cloudLife: 1.0, family: 'mushroom' },
      // Second fakestump, now mixed among the world
      { type: 'fakestump', id: 'fs2', x: 2020, y: GROUND_Y, w: 44, family: 'stump' },
      // Final predator gates the exit — shorter windup, tighter
      { type: 'predator', id: 'pr2', x: 2360, y: GROUND_Y, range: 240, alert: 0.30, windup: 0.28, recovery: 0.9, family: 'predator' },
    ],
    checkpoints: [{ x: 1000, y: GROUND_Y - 50 }, { x: 1900, y: GROUND_Y - 50 }],
    props: [
      { kind: 'bigTree', x: 170, scale: 0.95, tone: 0 },
      { kind: 'fungus', x: 260 },
      // Teaching row: three safe stumps. Player learns the baseline stump look.
      { kind: 'safestump', x: 340 },
      { kind: 'safestump', x: 390, w: 42 },
      { kind: 'safestump', x: 434 },
      // (fakestump at 460 sits right after the safe row — mimicry test)
      { kind: 'fungus', x: 640 },
      { kind: 'bigTree', x: 800, scale: 1.0, tone: 1 },
      { kind: 'fungus', x: 1080 },
      { kind: 'safestump', x: 1340 },
      { kind: 'bigTree', x: 1580, scale: 0.9, tone: 0 },
      { kind: 'fungus', x: 1680 },
      { kind: 'safestump', x: 1960 },
      // (fakestump at 2020 among safe neighbors)
      { kind: 'safestump', x: 2080, w: 38 },
      { kind: 'bigTree', x: 2180, scale: 1.1, tone: 1 },
      { kind: 'fungus', x: 2300 },
    ],
    signs: [
      { x: 366, y: 416, text: '- real -', small: true },
      { x: 2520, y: 420, text: 'into the heart', small: true },
    ],
  },

  // 6. THE HEART — full combo finale, all 6 families + ember rain
  {
    id: 'heart', title: 'The Heart', biome: 'heart',
    tip: 'You know every tell. The forest wants them all, at once.',
    worldWidth: 3600,
    spawn: { x: 60, y: 480 },
    exit: { x: 3520, y: 460, w: 60, h: 100 },
    platforms: [
      { kind: 'ground', x: 0, y: GROUND_Y, w: 3600, h: 100 },
      { kind: 'ledge', x: 440, y: 448, w: 120, h: 14 },
      { kind: 'ledge', x: 1060, y: 438, w: 130, h: 14 },
      { kind: 'collapse', x: 1380, y: 438, w: 90, h: 14, delay: 0.28 },
      { kind: 'ledge', x: 1640, y: 432, w: 130, h: 14 },
      { kind: 'ledge', x: 2260, y: 448, w: 140, h: 14 },
      { kind: 'collapse', x: 2540, y: 438, w: 90, h: 14, delay: 0.24 },
      { kind: 'ledge', x: 2780, y: 432, w: 120, h: 14 },
    ],
    traps: [
      // Zone 1 — approach: whip gate + fakestump trap
      { type: 'whip', id: 'hw1', x: 280, y: GROUND_Y, windup: 0.24, sweep: 320, dir: 1, family: 'whip' },
      { type: 'fakestump', id: 'hfs1', x: 620, y: GROUND_Y, w: 44, family: 'stump' },
      { type: 'mushroom', id: 'hm1', x: 760, y: GROUND_Y - 18, cloudR: 104, delay: 0.26, cloudLife: 1.05, family: 'mushroom' },

      // Zone 2 — snare gauntlet under a predator
      { type: 'snare', id: 'hs1', x: 920, y: GROUND_Y - 2, w: 60, h: 10, arm: 0.22, windup: 0.14, visible: true, family: 'snare' },
      { type: 'predator', id: 'hpr1', x: 1100, y: GROUND_Y, range: 260, alert: 0.28, windup: 0.26, recovery: 1.0, family: 'predator' },
      { type: 'snare', id: 'hs2', x: 1220, y: GROUND_Y - 2, w: 60, h: 10, arm: 0.20, windup: 0.14, visible: false, family: 'snare' },

      // Zone 3 — collapse + whip + mushroom combo
      { type: 'whip', id: 'hw2', x: 1520, y: GROUND_Y, windup: 0.22, sweep: 330, dir: -1, family: 'whip' },
      { type: 'mushroom', id: 'hm2', x: 1820, y: GROUND_Y - 18, cloudR: 104, delay: 0.24, cloudLife: 1.0, family: 'mushroom' },

      // Zone 4 — a second fakestump paired with a predator who guards it
      { type: 'fakestump', id: 'hfs2', x: 2060, y: GROUND_Y, w: 44, family: 'stump' },
      { type: 'predator', id: 'hpr2', x: 2200, y: GROUND_Y, range: 260, alert: 0.26, windup: 0.24, recovery: 0.9, family: 'predator' },

      // Zone 5 — log wave down the final slope
      { type: 'log', id: 'hl1', x: 3500, startX: 3500, speed: 380, windup: 0.18, armX: 2700, dir: -1, family: 'log' },
      { type: 'log', id: 'hl2', x: 3580, startX: 3580, speed: 460, windup: 0.48, armX: 2700, dir: -1, family: 'log' },
      { type: 'log', id: 'hl3', x: 3660, startX: 3660, speed: 540, windup: 0.88, armX: 2700, dir: -1, family: 'log' },

      // Final predator right before the exit
      { type: 'predator', id: 'hpr3', x: 3340, y: GROUND_Y, range: 240, alert: 0.22, windup: 0.22, recovery: 0.7, family: 'predator' },
    ],
    checkpoints: [
      { x: 840, y: GROUND_Y - 50 },
      { x: 1720, y: GROUND_Y - 50 },
      { x: 2680, y: GROUND_Y - 50 },
    ],
    props: [
      { kind: 'deadtree', x: 180, scale: 1.1 },
      { kind: 'safestump', x: 520 },
      { kind: 'safestump', x: 560, w: 38 },
      { kind: 'deadtree', x: 740, scale: 0.95 },
      { kind: 'deadtree', x: 1020, scale: 1.2 },
      { kind: 'safestump', x: 1340 },
      { kind: 'deadtree', x: 1460, scale: 0.9 },
      { kind: 'deadtree', x: 1880, scale: 1.1 },
      { kind: 'safestump', x: 2000 },
      { kind: 'safestump', x: 2120 },
      { kind: 'deadtree', x: 2340, scale: 0.95 },
      { kind: 'deadtree', x: 2640, scale: 1.05 },
      { kind: 'safestump', x: 2880 },
      { kind: 'deadtree', x: 3060, scale: 1.2 },
      { kind: 'deadtree', x: 3280, scale: 0.9 },
      { kind: 'deadtree', x: 3460, scale: 1.05 },
    ],
    signs: [
      { x: 3460, y: 410, text: 'OUT', big: true },
      { x: 80, y: 410, text: 'nothing is listening except everything', small: true },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Audio — oscillator-based cues. No samples.
// ──────────────────────────────────────────────────────────────────────────
function makeAudio() {
  let ctx = null;
  let muted = false;
  let masterGain = null;
  let droneNodes = null;
  let droneBiomeId = null;
  const ensure = () => {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.65;
        masterGain.connect(ctx.destination);
      } catch { muted = true; }
    }
    if (ctx?.state === 'suspended') ctx.resume();
  };

  // Procedural biome-pad: two detuned saw/sines through a lowpass with a slow
  // filter LFO. Each biome has its own harmonic + filter personality so the
  // world sounds like a different mood when the stage changes.
  const DRONE_CFG = {
    mosswake: { base: 65,  harmonic: 97,  filterBase: 440, filterSweep: 160, filterRate: 0.085, level: 0.030 },
    rotbog:   { base: 52,  harmonic: 78,  filterBase: 290, filterSweep:  90, filterRate: 0.065, level: 0.028 },
    heart:    { base: 46,  harmonic: 73,  filterBase: 360, filterSweep: 220, filterRate: 0.140, level: 0.034 },
  };
  const startDrone = (biomeId) => {
    ensure();
    if (!ctx || muted) return;
    if (droneBiomeId === biomeId && droneNodes) return;
    stopDrone();
    const cfg = DRONE_CFG[biomeId];
    if (!cfg) return;
    const t = ctx.currentTime;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = cfg.base;
    const o2 = ctx.createOscillator(); o2.type = 'sine';     o2.frequency.value = cfg.harmonic;
    const o3 = ctx.createOscillator(); o3.type = 'sine';     o3.frequency.value = cfg.base * 2.003;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cfg.filterBase;
    filter.Q.value = 3.2;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = cfg.filterRate;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = cfg.filterSweep;
    lfo.connect(lfoGain).connect(filter.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(cfg.level, t + 1.8);
    o1.connect(filter); o2.connect(filter); o3.connect(filter);
    filter.connect(g).connect(masterGain);
    o1.start(t); o2.start(t); o3.start(t); lfo.start(t);
    droneNodes = { o1, o2, o3, lfo, filter, g };
    droneBiomeId = biomeId;
  };
  const stopDrone = () => {
    if (!droneNodes || !ctx) { droneNodes = null; droneBiomeId = null; return; }
    const t = ctx.currentTime;
    const n = droneNodes;
    try {
      n.g.gain.cancelScheduledValues(t);
      n.g.gain.setValueAtTime(n.g.gain.value, t);
      n.g.gain.linearRampToValueAtTime(0, t + 0.6);
      n.o1.stop(t + 0.7); n.o2.stop(t + 0.7); n.o3.stop(t + 0.7); n.lfo.stop(t + 0.7);
    } catch {}
    droneNodes = null;
    droneBiomeId = null;
  };
  const tone = (freq, dur = 0.08, type = 'sine', gain = 0.12) => {
    ensure(); if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(masterGain);
    o.start(t); o.stop(t + dur + 0.02);
  };
  const sweep = (f1, f2, dur, type = 'sawtooth', gain = 0.1) => {
    ensure(); if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(masterGain);
    o.start(t); o.stop(t + dur + 0.02);
  };
  const noise = (dur = 0.05, gain = 0.08, lowpass = 800) => {
    ensure(); if (!ctx || muted) return;
    const t = ctx.currentTime;
    const len = Math.max(1, (ctx.sampleRate * dur) | 0);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(), g = ctx.createGain();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass;
    src.buffer = buf; g.gain.value = gain;
    src.connect(f).connect(g).connect(masterGain);
    src.start(t); src.stop(t + dur);
  };
  return {
    setMuted: (m) => {
      muted = m;
      if (m) stopDrone();
      else if (droneBiomeId) { const b = droneBiomeId; droneBiomeId = null; startDrone(b); }
    },
    startDrone, stopDrone,
    droneBiome: () => droneBiomeId,
    creak:      () => { sweep(160, 100, 0.35, 'triangle', 0.08); noise(0.1, 0.04, 600); },
    whipFire:   () => { sweep(800, 220, 0.18, 'square', 0.09); noise(0.06, 0.08, 1800); },
    snareArm:   () => sweep(320, 180, 0.25, 'sawtooth', 0.05),
    snareFire:  () => { noise(0.1, 0.1, 900); tone(110, 0.12, 'square', 0.12); },
    shroomPop:  () => { tone(280, 0.08, 'triangle', 0.1); noise(0.2, 0.06, 450); },
    shroomKill: () => { noise(0.15, 0.12, 350); tone(90, 0.18, 'sine', 0.14); },
    logRumble:  () => { sweep(80, 50, 1.8, 'sine', 0.06); noise(1.8, 0.03, 150); },
    logHit:     () => { noise(0.12, 0.14, 320); tone(70, 0.15, 'sine', 0.16); },
    jump:       () => sweep(380, 560, 0.08, 'triangle', 0.06),
    land:       () => tone(140, 0.04, 'sine', 0.07),
    slide:      () => noise(0.15, 0.06, 700),
    checkpoint: () => { tone(523, 0.15, 'triangle', 0.1); setTimeout(() => tone(659, 0.15, 'triangle', 0.1), 60); setTimeout(() => tone(784, 0.22, 'triangle', 0.1), 130); },
    death:      () => { sweep(500, 80, 0.42, 'triangle', 0.14); noise(0.14, 0.08, 500); },
    click:      () => tone(1600, 0.02, 'square', 0.05),
    finale:     () => {
      tone(523, 0.22, 'triangle', 0.1);
      setTimeout(() => tone(659, 0.22, 'triangle', 0.1), 100);
      setTimeout(() => tone(784, 0.22, 'triangle', 0.1), 200);
      setTimeout(() => tone(1047, 0.42, 'triangle', 0.12), 320);
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// State factories
// ──────────────────────────────────────────────────────────────────────────
function buildStageState(def) {
  const platforms = def.platforms.map((p) => ({ ...p, broken: false, standT: 0, _standingNow: false }));
  const traps = def.traps.map((t) => ({
    ...t,
    state: 'idle',
    windupT: 0,
    animT: 0,
    activeT: 0,
    cloudT: 0,
    hitT: 0,
    pos: t.startX != null ? t.startX : t.x,
    vx: 0,
  }));
  const checkpoints = def.checkpoints.map((c) => ({ ...c, reached: false }));
  const particles = [];
  const biome = BIOMES[def.biome];
  // seed floating atmosphere across the visible world (drift or fall per biome)
  for (let i = 0; i < 70; i++) {
    particles.push(seedDriftParticle(biome, Math.random() * def.worldWidth, 40 + Math.random() * 440));
  }
  const state = {
    def,
    biome: BIOMES[def.biome],
    platforms, traps, checkpoints,
    particles,
    wildlife: [],
    wildlifeTimer: 1.2,  // first flyover spawns ~1.2s after entering
    player: makePlayer(def.spawn),
    ragdoll: null,
    shake: 0,
    flash: 0,
    slowmo: 0,
    zoom: 1,
    cam: { x: 0, y: 0 },
    status: 'playing',
    tStatus: 0,
    epitaph: null,
    enteredAt: performance.now(),
    lastCheckpoint: null,
  };
  // Seed one immediate flyover so the world looks alive on entry
  spawnWildlifeInto(state);
  return state;
}

// ──────────────────────────────────────────────────────────────────────────
// Wildlife — silhouette flyovers, biome-specific. World-space, no collision.
// Purely atmospheric; never interacts with traps or player.
// ──────────────────────────────────────────────────────────────────────────
function spawnWildlifeInto(s) {
  const B = s.biome;
  const camX = s.cam.x || 0;
  if (B.id === 'mosswake') {
    // Flock of 2-4 birds, gentle pace
    const y = 90 + Math.random() * 180;
    const facing = Math.random() < 0.5 ? 1 : -1;
    const startX = facing > 0 ? camX - 30 : camX + W + 30;
    const speed = 130 + Math.random() * 50;
    const vx = facing * speed;
    const flock = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < flock; i++) {
      s.wildlife.push({
        type: 'bird',
        x: startX - facing * i * 24,
        y: y + (i % 2) * 14 + (Math.random() - 0.5) * 12,
        vx, vy: 0,
        facing,
        wingT: Math.random() * 6,
        life: (W + 120) / Math.abs(vx) + 1,
      });
    }
  } else if (B.id === 'rotbog') {
    // A single glowing moth, slow drift with vertical bob
    const y = 180 + Math.random() * 220;
    const facing = Math.random() < 0.5 ? 1 : -1;
    const startX = facing > 0 ? camX - 10 : camX + W + 10;
    const vx = facing * (40 + Math.random() * 22);
    s.wildlife.push({
      type: 'moth',
      x: startX, y,
      baseY: y,
      vx, vy: 0,
      facing,
      wingT: Math.random() * 6,
      life: (W + 60) / Math.abs(vx) + 1,
    });
  } else if (B.id === 'heart') {
    // Fast ember-fly streak across the upper mid-screen
    const y = 60 + Math.random() * 280;
    const facing = Math.random() < 0.5 ? 1 : -1;
    const startX = facing > 0 ? camX - 10 : camX + W + 10;
    const vx = facing * (220 + Math.random() * 140);
    const vy = -30 + Math.random() * 60;
    s.wildlife.push({
      type: 'emberfly',
      x: startX, y, vx, vy,
      facing,
      trailX: startX, trailY: y,
      life: 1.6 + Math.random() * 0.9,
    });
  }
}

function updateWildlife(s, dt) {
  for (const w of s.wildlife) {
    w.x += w.vx * dt;
    w.y += w.vy * dt;
    w.life -= dt;
    if (w.type === 'bird') {
      w.wingT = (w.wingT || 0) + dt * 14;
    } else if (w.type === 'moth') {
      w.wingT = (w.wingT || 0) + dt * 12;
      w.y = w.baseY + Math.sin(w.wingT * 0.6) * 14;
    } else if (w.type === 'emberfly') {
      // trail lags behind
      w.trailX = lerp(w.trailX, w.x, Math.min(1, dt * 18));
      w.trailY = lerp(w.trailY, w.y, Math.min(1, dt * 18));
      w.vy += 30 * dt;  // slow gravity drift
    }
  }
  s.wildlife = s.wildlife.filter((w) =>
    w.life > 0
    && w.x > s.cam.x - 200
    && w.x < s.cam.x + W + 200
  );
}

function makePlayer(spawn) {
  return {
    x: spawn.x, y: spawn.y, vx: 0, vy: 0,
    w: P_W, h: P_H,
    onGround: false, wasGround: false,
    coyote: 0, jumpBuf: 0, jumpHeld: false,
    facing: 1, invuln: INVULN_ON_RESPAWN,
    sliding: false, slideT: 0,
  };
}

function buildRagdoll(p, impulseX, impulseY) {
  // Simple 4-piece: head, torso, leftLeg, rightLeg
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const parts = [
    { // head
      x: cx - 6, y: p.y - 2, w: 12, h: 12,
      vx: impulseX * 0.6 + (Math.random() - 0.5) * 3,
      vy: impulseY * 0.8 - 2,
      rot: 0, rotV: (Math.random() - 0.5) * 10, color: '#f2d8ae', kind: 'head',
    },
    { // torso
      x: cx - 9, y: p.y + 8, w: 18, h: 18,
      vx: impulseX * 0.9 + (Math.random() - 0.5) * 2,
      vy: impulseY * 0.6 - 1,
      rot: 0, rotV: (Math.random() - 0.5) * 8, color: '#b13a3a', kind: 'torso',
    },
    { // left leg
      x: cx - 8, y: p.y + 24, w: 7, h: 14,
      vx: impulseX * 0.7 + (Math.random() - 0.5) * 3,
      vy: impulseY * 0.5,
      rot: 0, rotV: (Math.random() - 0.5) * 12, color: '#3a3a50', kind: 'leg',
    },
    { // right leg
      x: cx + 1, y: p.y + 24, w: 7, h: 14,
      vx: impulseX * 0.7 + (Math.random() - 0.5) * 3,
      vy: impulseY * 0.5,
      rot: 0, rotV: (Math.random() - 0.5) * 12, color: '#3a3a50', kind: 'leg',
    },
  ];
  return { parts, t: 0 };
}

// ──────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────
export default function GrudgewoodGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const audioRef = useRef(null);

  const runRef = useRef({
    stageIdx: 0, deaths: 0, startMs: 0,
    pauseOffset: 0, pausedAt: 0,
    paused: false, completed: false,
    elapsed: 0,
    stageDeaths: [],   // deaths attributed to the stage you died in
  });
  const optsRef = useRef({ reducedMotion: false, highContrast: false, muted: false });

  // Touch input — silhouette buttons when a touch device is detected. Merged
  // into the same keys object the game loop reads, so touch + keyboard + pad
  // all cooperate without special-case branches in the physics code.
  const touchKeysRef = useRef({
    left: false, right: false, jump: false, down: false,
    jumpPressed: false, slidePressed: false,
  });
  const [touchPressed, setTouchPressed] = useState({ left: false, right: false, jump: false, down: false });
  const [showTouch, setShowTouch] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return window.matchMedia && window.matchMedia('(pointer: coarse)').matches; } catch { return false; }
  });
  const handleTouch = (key, active) => {
    touchKeysRef.current[key] = active;
    if (active) {
      if (key === 'jump') touchKeysRef.current.jumpPressed = true;
      if (key === 'down') touchKeysRef.current.slidePressed = true;
    }
    setTouchPressed((prev) => (prev[key] === active ? prev : { ...prev, [key]: active }));
  };
  const touchBind = (key) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
      handleTouch(key, true);
    },
    onPointerUp:     (e) => { e.preventDefault(); handleTouch(key, false); },
    onPointerCancel: () => handleTouch(key, false),
    onPointerLeave:  () => handleTouch(key, false),
    onContextMenu:   (e) => e.preventDefault(),
  });
  useEffect(() => {
    // Promote to touch UI on first touchstart anywhere — covers devices where
    // matchMedia('(pointer: coarse)') returns false but touch is present.
    const onFirstTouch = () => {
      setShowTouch(true);
      window.removeEventListener('touchstart', onFirstTouch);
    };
    window.addEventListener('touchstart', onFirstTouch, { passive: true });
    return () => window.removeEventListener('touchstart', onFirstTouch);
  }, []);

  const [ui, setUi] = useState({
    stageIdx: 0,
    deaths: 0,
    elapsed: 0,
    status: 'playing',
    epitaph: null,
    paused: false,
    completed: false,
    helpOpen: false,
    muted: false,
    reducedMotion: false,
    highContrast: false,
    best: loadBest(),
    score: 0,
  });

  useEffect(() => {
    audioRef.current = makeAudio();
    enterStage(0);
    runRef.current.startMs = performance.now();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const keys = {
      kbLeft: false, kbRight: false, kbJump: false, kbSprint: false, kbDown: false,
      padLeft: false, padRight: false, padJump: false, padSprint: false, padDown: false,
      jumpPressed: false, slidePressed: false,
      left: false, right: false, jump: false, sprint: false, down: false,
    };

    const onKeyDown = (e) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.kbLeft = true; e.preventDefault(); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.kbRight = true; e.preventDefault(); }
      else if (k === ' ' || k === 'w' || k === 'W' || k === 'ArrowUp') {
        if (!keys.kbJump) keys.jumpPressed = true;
        keys.kbJump = true; e.preventDefault();
      }
      else if (k === 'Shift') keys.kbSprint = true;
      else if (k === 's' || k === 'S' || k === 'ArrowDown') {
        if (!keys.kbDown) keys.slidePressed = true;
        keys.kbDown = true;
      }
      else if (k === 'r' || k === 'R') { restartStage(); }
      else if (k === 'p' || k === 'P') { togglePause(); }
      else if (k === 'h' || k === 'H') { setUi((u) => ({ ...u, helpOpen: !u.helpOpen })); }
      else if (k === 'm' || k === 'M') { toggleMute(); }
    };
    const onKeyUp = (e) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.kbLeft = false;
      if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.kbRight = false;
      if (k === ' ' || k === 'w' || k === 'W' || k === 'ArrowUp') keys.kbJump = false;
      if (k === 'Shift') keys.kbSprint = false;
      if (k === 's' || k === 'S' || k === 'ArrowDown') keys.kbDown = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let prevPad = { jump: false, slide: false, restart: false };
    const readPad = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = pads && pads[0];
      if (!pad) {
        keys.padLeft = false; keys.padRight = false; keys.padJump = false; keys.padSprint = false; keys.padDown = false;
        prevPad.jump = false; prevPad.slide = false; prevPad.restart = false;
        return;
      }
      const lx = pad.axes[0] ?? 0;
      const ly = pad.axes[1] ?? 0;
      keys.padLeft  = (lx < -0.25) || !!pad.buttons[14]?.pressed;
      keys.padRight = (lx >  0.25) || !!pad.buttons[15]?.pressed;
      keys.padSprint = !!pad.buttons[10]?.pressed || !!pad.buttons[6]?.pressed;
      const down = (ly > 0.35) || !!pad.buttons[13]?.pressed;
      if (down && !keys.padDown) keys.slidePressed = true;
      keys.padDown = down;
      const jumpNow = !!(pad.buttons[0]?.pressed);
      if (jumpNow && !prevPad.jump) keys.jumpPressed = true;
      keys.padJump = jumpNow;
      prevPad.jump = jumpNow;
      const restartNow = !!(pad.buttons[1]?.pressed || pad.buttons[3]?.pressed);
      if (restartNow && !prevPad.restart) restartStage();
      prevPad.restart = restartNow;
    };

    let acc = 0, lastT = performance.now(), raf = 0;
    const loop = (now) => {
      const rawDt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      if (!runRef.current.paused && !runRef.current.completed) {
        readPad();
        const tk = touchKeysRef.current;
        keys.left   = keys.kbLeft   || keys.padLeft   || tk.left;
        keys.right  = keys.kbRight  || keys.padRight  || tk.right;
        keys.jump   = keys.kbJump   || keys.padJump   || tk.jump;
        keys.sprint = keys.kbSprint || keys.padSprint;
        keys.down   = keys.kbDown   || keys.padDown   || tk.down;
        if (tk.jumpPressed)  { keys.jumpPressed  = true; tk.jumpPressed  = false; }
        if (tk.slidePressed) { keys.slidePressed = true; tk.slidePressed = false; }

        const s = stateRef.current;
        const slowmoScale = s && s.slowmo > 0 ? lerp(SLOWMO_SCALE, 1, 1 - s.slowmo / SLOWMO_TIME) : 1;
        const dt = rawDt * slowmoScale;

        acc += dt;
        while (acc >= STEP) {
          update(STEP, keys);
          keys.jumpPressed = false;
          keys.slidePressed = false;
          acc -= STEP;
        }
      }
      render(ctx, rawDt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const hudTimer = setInterval(() => {
      if (runRef.current.completed) return;
      const r = runRef.current;
      if (!r.paused) r.elapsed = (performance.now() - r.startMs - r.pauseOffset) / 1000;
      setUi((u) => (u.elapsed === r.elapsed ? u : { ...u, elapsed: r.elapsed }));
    }, 120);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(hudTimer);
      audioRef.current?.stopDrone();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enterStage(idx) {
    const def = STAGES[idx];
    stateRef.current = buildStageState(def);
    runRef.current.stageIdx = idx;
    audioRef.current?.startDrone(def.biome);
    setUi((u) => ({ ...u, stageIdx: idx, status: 'playing', epitaph: null }));
  }
  function restartStage() {
    if (runRef.current.completed) return;
    const s = stateRef.current;
    const spawn = s?.lastCheckpoint || s?.def?.spawn;
    if (!spawn) return enterStage(runRef.current.stageIdx);
    // Full re-spin of stage but preserve checkpoint spawn
    const fresh = buildStageState(s.def);
    fresh.lastCheckpoint = s.lastCheckpoint;
    if (s.lastCheckpoint) {
      fresh.player.x = s.lastCheckpoint.x;
      fresh.player.y = s.lastCheckpoint.y;
      // Mark pre-checkpoint checkpoints as already reached
      fresh.checkpoints.forEach((c) => {
        if (c.x <= s.lastCheckpoint.x) c.reached = true;
      });
    }
    stateRef.current = fresh;
    setUi((u) => ({ ...u, status: 'playing', epitaph: null }));
    audioRef.current?.click();
  }
  function togglePause() {
    const r = runRef.current;
    if (r.completed) return;
    if (!r.paused) { r.paused = true; r.pausedAt = performance.now(); }
    else { r.pauseOffset += performance.now() - r.pausedAt; r.paused = false; }
    setUi((u) => ({ ...u, paused: r.paused }));
  }
  function toggleMute() {
    optsRef.current.muted = !optsRef.current.muted;
    audioRef.current?.setMuted(optsRef.current.muted);
    setUi((u) => ({ ...u, muted: optsRef.current.muted }));
  }
  function toggleReducedMotion() {
    optsRef.current.reducedMotion = !optsRef.current.reducedMotion;
    setUi((u) => ({ ...u, reducedMotion: optsRef.current.reducedMotion }));
  }
  function toggleHighContrast() {
    optsRef.current.highContrast = !optsRef.current.highContrast;
    setUi((u) => ({ ...u, highContrast: optsRef.current.highContrast }));
  }

  function kill(family, impulseX = 0, impulseY = -4) {
    const s = stateRef.current;
    if (!s || s.status !== 'playing') return;
    if (s.player.invuln > 0) return;
    s.status = 'dead';
    s.tStatus = 0;
    s.slowmo = SLOWMO_TIME;
    s.shake = optsRef.current.reducedMotion ? 4 : 16;
    s.flash = 0.16;
    s.epitaph = pick(EPITAPHS[family] || EPITAPHS.whip);
    s.ragdoll = buildRagdoll(s.player, impulseX, impulseY);
    // Blood-leaf burst
    for (let i = 0; i < 24; i++) {
      s.particles.push({
        type: 'blood',
        x: s.player.x + P_W / 2,
        y: s.player.y + P_H / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 8 - 1,
        life: 1.0 + Math.random() * 0.6, max: 1.6,
        size: 2 + Math.random() * 2,
        color: i % 3 === 0 ? '#c5432f' : i % 3 === 1 ? '#7e2018' : s.biome.canopyHighlight,
      });
    }
    audioRef.current?.death();
    const r = runRef.current;
    r.deaths += 1;
    r.stageDeaths[r.stageIdx] = (r.stageDeaths[r.stageIdx] || 0) + 1;
    // Directional camera kick on impact (decays in updateCamera)
    if (!s.cam) s.cam = { x: 0, y: 0 };
    s.cam.kickX = (impulseX || 0) * 3.2;
    s.cam.kickY = ((impulseY || 0) * 2.4) - 6;
    s.impactPt = { x: s.player.x + P_W / 2, y: s.player.y + P_H / 2 };
    setUi((u) => ({ ...u, deaths: r.deaths, status: 'dead', epitaph: s.epitaph }));
  }

  function clearStage() {
    const s = stateRef.current;
    if (!s || s.status !== 'playing') return;
    s.status = 'clear';
    s.tStatus = 0;
    audioRef.current?.checkpoint();
    setUi((u) => ({ ...u, status: 'clear' }));
  }

  function finishRun() {
    const r = runRef.current;
    r.completed = true;
    const score = Math.max(0, Math.round(1800 - r.deaths * 28 - r.elapsed * 2.5));
    submitScore('grudgewood', score, { deaths: r.deaths, time: Math.round(r.elapsed), stages: STAGES.length });
    const best = loadBest();
    const newBest = best == null || score > best ? score : best;
    if (newBest !== best) saveBest(newBest);
    setUi((u) => ({ ...u, completed: true, status: 'finished', best: newBest, score }));
    audioRef.current?.finale();
  }

  function resetRun() {
    const r = runRef.current;
    r.stageIdx = 0; r.deaths = 0;
    r.startMs = performance.now();
    r.pauseOffset = 0; r.paused = false; r.completed = false;
    r.elapsed = 0;
    r.stageDeaths = [];
    setUi((u) => ({ ...u, deaths: 0, elapsed: 0, completed: false, status: 'playing', epitaph: null, score: 0 }));
    enterStage(0);
  }

  // ── update ─────────────────────────────────────────────────────────────
  function update(dt, keys) {
    const s = stateRef.current;
    if (!s) return;
    const p = s.player;

    // Slow-mo decay runs regardless of state
    if (s.slowmo > 0) s.slowmo = Math.max(0, s.slowmo - dt);

    if (s.status === 'dead') {
      s.tStatus += dt;
      updateRagdoll(s, dt);
      updateParticles(s, dt);
      updateWildlife(s, dt);
      updateTraps(s, dt, true);  // traps keep animating dramatically
      updateCamera(s, dt, true); // camera zooms on death
      s.shake = Math.max(0, s.shake - 40 * dt);
      s.flash = Math.max(0, s.flash - 1.2 * dt);
      if (s.tStatus >= RESPAWN_DELAY) {
        // respawn at last checkpoint or stage spawn
        const respawn = s.lastCheckpoint || s.def.spawn;
        const freshPlatforms = s.def.platforms.map((pf) => ({ ...pf, broken: false, standT: 0, _standingNow: false }));
        const freshTraps = s.def.traps.map((t) => ({
          ...t,
          state: 'idle', windupT: 0, animT: 0, activeT: 0, cloudT: 0, hitT: 0,
          pos: t.startX != null ? t.startX : t.x, vx: 0,
        }));
        s.platforms = freshPlatforms;
        s.traps = freshTraps;
        s.player = makePlayer(respawn);
        s.ragdoll = null;
        s.status = 'playing';
        s.tStatus = 0;
        s.epitaph = null;
        setUi((u) => ({ ...u, status: 'playing', epitaph: null }));
      }
      return;
    }

    if (s.status === 'clear') {
      s.tStatus += dt;
      updateParticles(s, dt);
      updateWildlife(s, dt);
      updateCamera(s, dt, false);
      if (s.tStatus >= 0.55) {
        const next = runRef.current.stageIdx + 1;
        if (next >= STAGES.length) { finishRun(); return; }
        enterStage(next);
      }
      return;
    }

    // Input → movement
    const wantLeft = keys.left;
    const wantRight = keys.right;
    const sprint = keys.sprint;
    const maxV = sprint ? SPRINT_MAX : WALK_MAX;

    // Slide
    if (p.sliding) {
      p.slideT += dt;
      if (p.slideT >= SLIDE_TIME || (!p.onGround && p.slideT > 0.12)) {
        p.sliding = false; p.slideT = 0; p.h = P_H;
      }
      // During slide, horizontal is locked to slide velocity (decays)
      p.vx *= Math.pow(0.35, dt * 2.5);
      if (Math.abs(p.vx) < WALK_MAX) p.sliding = false;
    } else {
      if (wantLeft && !wantRight) { p.vx -= (p.onGround ? GROUND_ACCEL : AIR_ACCEL) * dt; p.facing = -1; }
      if (wantRight && !wantLeft) { p.vx += (p.onGround ? GROUND_ACCEL : AIR_ACCEL) * dt; p.facing = 1; }
      if (!wantLeft && !wantRight && p.onGround) {
        const sign = Math.sign(p.vx);
        p.vx -= sign * GROUND_FRICTION * dt;
        if (Math.sign(p.vx) !== sign) p.vx = 0;
      }
      p.vx = clamp(p.vx, -maxV, maxV);
    }

    // Slide start: press down while moving + on ground
    if (!p.sliding && keys.slidePressed && p.onGround && Math.abs(p.vx) > 120) {
      p.sliding = true;
      p.slideT = 0;
      p.h = SLIDE_H;
      p.y += (P_H - SLIDE_H);  // drop to account for new height
      p.vx = Math.sign(p.vx || p.facing) * SLIDE_SPEED;
      audioRef.current?.slide();
    }

    // Jump
    if (keys.jumpPressed) p.jumpBuf = JUMP_BUFFER;
    p.jumpBuf = Math.max(0, p.jumpBuf - dt);
    p.coyote = Math.max(0, p.coyote - dt);
    const canJump = (p.onGround || p.coyote > 0) && !p.sliding;
    if (p.jumpBuf > 0 && canJump) {
      p.vy = JUMP_V;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      audioRef.current?.jump();
    }
    const jumpHeldNow = keys.jump;
    if (!jumpHeldNow && p.jumpHeld && p.vy < 0) p.vy *= JUMP_RELEASE_DAMP;
    p.jumpHeld = jumpHeldNow;

    // Gravity
    p.vy += GRAVITY * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;

    // Move + collide
    p.wasGround = p.onGround;
    moveAndCollide(s, dt);

    if (!p.wasGround && p.onGround) audioRef.current?.land();
    if (p.wasGround && !p.onGround) p.coyote = COYOTE;

    // World bounds
    if (p.x < 0) { p.x = 0; p.vx = 0; }
    if (p.x + p.w > s.def.worldWidth) { p.x = s.def.worldWidth - p.w; p.vx = 0; }
    if (p.y > H + 80) { kill('pit', 0, -6); return; }

    if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);

    // Traps
    updateTraps(s, dt, false);

    // Collapsing platforms
    for (const pf of s.platforms) {
      if (pf.kind !== 'collapse' || pf.broken) continue;
      if (pf.standT > (pf.delay ?? 0.3)) {
        pf.broken = true;
        audioRef.current?.creak();
        for (let i = 0; i < 8; i++) {
          s.particles.push({
            type: 'dust', x: pf.x + Math.random() * pf.w, y: pf.y,
            vx: (Math.random() - 0.5) * 2, vy: Math.random() * -1 - 0.5,
            life: 0.6, max: 0.6, color: 'rgba(140,120,90,0.5)', size: 2,
          });
        }
      }
    }

    // Checkpoints
    for (const c of s.checkpoints) {
      if (!c.reached && Math.abs((p.x + p.w / 2) - c.x) < 24 && Math.abs((p.y + p.h / 2) - c.y) < 60) {
        c.reached = true;
        s.lastCheckpoint = { x: c.x - p.w / 2, y: c.y - p.h / 2 };
        audioRef.current?.checkpoint();
        // Brief zoom-out flourish
        s.zoom = 0.96;
        for (let i = 0; i < 12; i++) {
          s.particles.push({
            type: 'spark', x: c.x, y: c.y,
            vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 4 - 1,
            life: 0.8, max: 0.8, color: s.biome.accent, size: 2,
          });
        }
      }
    }

    // Wildlife spawn timer + update. Silhouettes keep the frame alive.
    s.wildlifeTimer = (s.wildlifeTimer ?? 0) - dt;
    if (s.wildlifeTimer <= 0) {
      spawnWildlifeInto(s);
      // Biome tempo: Mosswake spaced, Rotbog rarer, Heart frequent streaks
      const B = s.biome;
      s.wildlifeTimer = B.id === 'heart' ? 1.4 + Math.random() * 1.0
        : B.id === 'rotbog' ? 4.5 + Math.random() * 3.0
        : 3.0 + Math.random() * 2.5;
    }
    updateWildlife(s, dt);

    // Ambient drift spawn — direction depends on biome (embers fall, pollen drifts)
    if (Math.random() < 0.65) {
      const camX = s.cam.x;
      const B = s.biome;
      if (B.particleFall) {
        // Heart: embers rain from top across the camera viewport
        s.particles.push(seedDriftParticle(B, camX + Math.random() * W, -20));
      } else {
        s.particles.push(seedDriftParticle(B, camX + W + Math.random() * 80, 50 + Math.random() * 440));
      }
    }

    // Footstep dust while running on ground
    if (p.onGround && Math.abs(p.vx) > 60 && Math.random() < 0.35) {
      s.particles.push({
        type: 'dust', x: p.x + p.w / 2 - Math.sign(p.vx) * 6, y: p.y + p.h - 2,
        vx: -p.vx * 0.06 + (Math.random() - 0.5), vy: -Math.random() * 0.4,
        life: 0.28, max: 0.28, color: 'rgba(170,150,110,0.4)', size: 2,
      });
    }

    // Exit
    const ex = s.def.exit;
    if (aabb(p.x, p.y, p.w, p.h, ex.x, ex.y, ex.w, ex.h)) clearStage();

    // Decay shake/flash
    s.shake = Math.max(0, s.shake - 40 * dt);
    s.flash = Math.max(0, s.flash - 1.5 * dt);
    s.zoom = lerp(s.zoom, 1, Math.min(1, dt * 3));

    updateParticles(s, dt);
    updateCamera(s, dt, false);
  }

  function updateParticles(s, dt) {
    for (const pt of s.particles) {
      pt.x += pt.vx * (pt.type === 'drift' ? dt * 60 : 1);
      pt.y += pt.vy * (pt.type === 'drift' ? dt * 60 : 1);
      if (pt.type !== 'drift') pt.vy += 0.24;
      pt.life -= dt;
    }
    s.particles = s.particles.filter((pt) =>
      pt.life > 0
      && pt.x > s.cam.x - 200
      && pt.x < s.cam.x + W + 200
      && pt.y < H + 120
    );
  }

  function updateRagdoll(s, dt) {
    if (!s.ragdoll) return;
    s.ragdoll.t += dt;
    for (const part of s.ragdoll.parts) {
      // Record position history for motion trail (~22 Hz sampling)
      part._histTick = (part._histTick ?? 0) + dt;
      if (part._histTick >= 0.045) {
        part._histTick = 0;
        if (!part.history) part.history = [];
        part.history.push({ x: part.x, y: part.y, rot: part.rot });
        if (part.history.length > 6) part.history.shift();
      }
      part.vy += GRAVITY * dt * 0.9;
      if (part.vy > MAX_FALL) part.vy = MAX_FALL;
      part.x += part.vx * dt * 60;
      part.y += part.vy * dt * 60;
      part.rot += part.rotV * dt;
      // Bounce on ground
      if (part.y + part.h > GROUND_Y) {
        part.y = GROUND_Y - part.h;
        part.vy *= -0.35;
        part.vx *= 0.72;
        part.rotV *= 0.6;
      }
    }
  }

  function updateCamera(s, dt, dying) {
    const p = s.player;
    const targetX = p.x + p.w / 2 + p.facing * CAMERA_LEAD;
    s.cam.x = lerp(s.cam.x + W / 2, targetX, Math.min(1, dt * CAMERA_SMOOTH)) - W / 2;
    s.cam.x = clamp(s.cam.x, 0, Math.max(0, s.def.worldWidth - W));
    s.cam.y = 0;
    // Decay directional impact kick toward zero. Fast decay = snappy kick feel.
    s.cam.kickX = lerp(s.cam.kickX ?? 0, 0, Math.min(1, dt * 8));
    s.cam.kickY = lerp(s.cam.kickY ?? 0, 0, Math.min(1, dt * 8));
    if (dying) {
      s.zoom = lerp(s.zoom, CAMERA_ZOOM_DEATH, Math.min(1, dt * 5));
    } else {
      s.zoom = lerp(s.zoom, 1, Math.min(1, dt * 3));
    }
  }

  // ── collision ──────────────────────────────────────────────────────────
  function moveAndCollide(s, dt) {
    const p = s.player;
    for (const pf of s.platforms) pf._standingNow = false;

    // X axis
    p.x += p.vx * dt;
    for (const pf of s.platforms) {
      if (pf.broken && (pf.kind === 'collapse')) continue;
      if (aabb(p.x, p.y, p.w, p.h, pf.x, pf.y, pf.w, pf.h)) {
        if (p.vx > 0) p.x = pf.x - p.w;
        else if (p.vx < 0) p.x = pf.x + pf.w;
        p.vx = 0;
      }
    }
    // Y axis
    p.y += p.vy * dt;
    let landed = false;
    for (const pf of s.platforms) {
      if (pf.broken && (pf.kind === 'collapse')) continue;
      if (aabb(p.x, p.y, p.w, p.h, pf.x, pf.y, pf.w, pf.h)) {
        if (p.vy > 0) {
          p.y = pf.y - p.h;
          p.vy = 0;
          landed = true;
          pf._standingNow = true;
        } else if (p.vy < 0) {
          p.y = pf.y + pf.h;
          p.vy = 0;
        }
      }
    }
    p.onGround = landed;

    for (const pf of s.platforms) {
      if (pf._standingNow) pf.standT = (pf.standT || 0) + dt;
      else pf.standT = 0;
    }

    // End slide if we're no longer moving fast or no longer grounded for a while
    if (p.sliding && p.onGround && Math.abs(p.vx) < 140) {
      p.sliding = false; p.slideT = 0; p.h = P_H;
    }
  }

  // ── traps ──────────────────────────────────────────────────────────────
  function updateTraps(s, dt, dying) {
    const p = s.player;
    const pcx = p.x + p.w / 2;
    const pcy = p.y + p.h / 2;

    for (const t of s.traps) {
      t.animT += dt;

      // WHIP — tree branch that creaks then slams horizontally
      if (t.type === 'whip') {
        if (t.state === 'idle') {
          if (!dying && Math.abs(pcx - t.x) < 200 && pcy > GROUND_Y - 180) {
            t.state = 'windup'; t.windupT = 0;
            audioRef.current?.creak();
          }
        } else if (t.state === 'windup') {
          t.windupT += dt;
          if (t.windupT >= t.windup) {
            t.state = 'firing'; t.activeT = 0;
            audioRef.current?.whipFire();
            s.shake = Math.max(s.shake, 6);
          }
        } else if (t.state === 'firing') {
          t.activeT += dt;
          // Sweep collider: from trunk sweeping outward in direction dir over 0.18s
          const sweepDur = 0.22;
          const progress = Math.min(1, t.activeT / sweepDur);
          const reach = progress * t.sweep;
          const bx = t.dir > 0 ? t.x : t.x - reach;
          const bw = reach;
          const by = GROUND_Y - 90;
          const bh = 26;
          if (!dying && aabb(p.x, p.y, p.w, p.h, bx, by, bw, bh)) {
            const imp = t.dir * 8;
            kill(t.family, imp, -3); return;
          }
          if (t.activeT > sweepDur + 0.12) t.state = 'done';
        }
      }

      // SNARE — soil patch that arms when standing, then fires upward
      if (t.type === 'snare') {
        const over = (p.onGround
          && p.x + p.w > t.x
          && p.x < t.x + t.w
          && Math.abs(p.y + p.h - t.y) < 4);
        if (t.state === 'idle') {
          if (over) {
            t.state = 'arming'; t.armT = 0;
            audioRef.current?.snareArm();
          }
        } else if (t.state === 'arming') {
          t.armT = (t.armT || 0) + dt;
          // If player steps off during arming, reset (but keep a small memory)
          if (!over && t.armT < 0.1) {
            t.state = 'idle'; t.armT = 0;
          } else if (t.armT >= t.arm) {
            t.state = 'windup'; t.windupT = 0;
          }
        } else if (t.state === 'windup') {
          t.windupT += dt;
          if (t.windupT >= t.windup) {
            t.state = 'firing'; t.activeT = 0;
            audioRef.current?.snareFire();
            s.shake = Math.max(s.shake, 7);
          }
        } else if (t.state === 'firing') {
          t.activeT += dt;
          // Spikes up — hitbox rising
          const h = Math.min(30, t.activeT * 140);
          const bx = t.x, by = t.y - h + 2, bw = t.w, bh = h;
          if (!dying && aabb(p.x, p.y, p.w, p.h, bx, by, bw, bh)) {
            kill(t.family, 0, -5); return;
          }
          if (t.activeT > 0.9) t.state = 'done';
        }
      }

      // MUSHROOM — pressure fungus, bloom cloud
      if (t.type === 'mushroom') {
        const on = (p.onGround
          && p.x + p.w > t.x - 8
          && p.x < t.x + 24
          && Math.abs((p.y + p.h) - (GROUND_Y)) < 6);
        if (t.state === 'idle') {
          if (on) {
            t.state = 'windup'; t.windupT = 0;
            audioRef.current?.shroomPop();
          }
        } else if (t.state === 'windup') {
          t.windupT += dt;
          if (t.windupT >= t.delay) {
            t.state = 'firing'; t.cloudT = 0;
            if (!t.safeTeach) audioRef.current?.shroomKill();
          }
        } else if (t.state === 'firing') {
          t.cloudT += dt;
          // Lethal during full cloud life (skip if safeTeach)
          if (!t.safeTeach && !dying) {
            const r = t.cloudR;
            const d = Math.hypot(pcx - (t.x + 12), pcy - (GROUND_Y - 18));
            if (d < r * 0.9) { kill(t.family, (pcx - t.x) > 0 ? 4 : -4, -4); return; }
          }
          if (t.cloudT >= t.cloudLife) t.state = 'done';
        }
      }

      // LOG — detaches when player crosses armX, rolls back toward player
      if (t.type === 'log') {
        if (t.state === 'idle') {
          // armX is the player's x threshold for trigger; dir=-1 = log rolls left
          const crossed = t.dir < 0 ? pcx > t.armX : pcx < t.armX;
          if (!dying && crossed) {
            t.state = 'windup'; t.windupT = 0;
            audioRef.current?.logRumble();
          }
        } else if (t.state === 'windup') {
          t.windupT += dt;
          if (t.windupT >= t.windup) {
            t.state = 'firing';
            t.vx = (t.speed || 360) * t.dir;
          }
        } else if (t.state === 'firing') {
          // Accelerate downhill (simulate slope boost)
          t.vx += t.dir * 80 * dt;
          t.pos += t.vx * dt;
          // Collide with player
          if (!dying) {
            if (aabb(p.x, p.y, p.w, p.h, t.pos - 22, GROUND_Y - 44, 44, 44)) {
              audioRef.current?.logHit();
              kill(t.family, t.dir * 10, -5); return;
            }
          }
          // Off-world
          if (t.pos < -80 || t.pos > s.def.worldWidth + 80) t.state = 'done';
        }
      }

      // PIT — always-on lethal zone
      if (t.type === 'pit') {
        if (!dying && aabb(p.x, p.y, p.w, p.h, t.x, t.y, t.w, t.h)) {
          kill('pit', 0, -5); return;
        }
      }

      // PREDATOR — tree tracks the player in a horizontal sight cone, then slams
      // a branch straight down. Unlike Whip (horizontal), this threatens anyone
      // who dawdles in its reach.
      if (t.type === 'predator') {
        const dx = pcx - t.x;
        const inRange = Math.abs(dx) < (t.range ?? 260) && pcy > GROUND_Y - 260;
        if (t.state === 'recovering') {
          t.recoverT = (t.recoverT || 0) + dt;
          if (t.recoverT >= (t.recovery ?? 0.9)) { t.state = 'idle'; t.recoverT = 0; }
        }
        if (t.state === 'idle') {
          if (!dying && inRange) {
            t.state = 'alerted'; t.alertT = 0;
            t.facing = dx < 0 ? -1 : 1;
          }
        } else if (t.state === 'alerted') {
          t.alertT += dt;
          t.facing = dx < 0 ? -1 : 1;
          // If player escapes the cone early, de-alert
          if (!inRange && t.alertT < (t.alert ?? 0.3)) { t.state = 'idle'; t.alertT = 0; }
          else if (t.alertT >= (t.alert ?? 0.3)) {
            t.state = 'windup'; t.windupT = 0;
            t.strikeX = pcx; // lock onto current player column
            audioRef.current?.creak();
          }
        } else if (t.state === 'windup') {
          t.windupT += dt;
          if (t.windupT >= (t.windup ?? 0.30)) {
            t.state = 'firing'; t.activeT = 0;
            audioRef.current?.logHit();
            s.shake = Math.max(s.shake, 11);
          }
        } else if (t.state === 'firing') {
          t.activeT += dt;
          const slamDur = 0.16;
          const progress = Math.min(1, t.activeT / slamDur);
          const topY = GROUND_Y - 170;
          const tipY = topY + progress * 170;
          const bx = t.strikeX - 18, by = topY, bw = 36, bh = tipY - topY + 6;
          if (!dying && aabb(p.x, p.y, p.w, p.h, bx, by, bw, bh)) {
            kill(t.family, (pcx - t.strikeX) > 0 ? 7 : -7, -3); return;
          }
          if (t.activeT > slamDur + 0.35) { t.state = 'recovering'; t.recoverT = 0; }
        }
      }

      // FAKESTUMP — mimic. Looks like a low stump with a tiny ring of teeth.
      // Stepping on any part of it for one frame = chomp. Fairness: paired with
      // real stump PROPS nearby, and always has visible teeth (the tell).
      if (t.type === 'fakestump') {
        const stumpW = t.w ?? 44;
        if (t.state === 'idle' || t.state === 'priming') {
          // Priming nudge when player is very close — eyes-like shimmer
          const close = Math.abs(pcx - (t.x + stumpW / 2)) < 80;
          if (close && t.state === 'idle') { t.state = 'priming'; t.primeT = 0; }
          if (!close && t.state === 'priming' && (t.primeT || 0) < 0.08) { t.state = 'idle'; }
          if (t.state === 'priming') t.primeT = (t.primeT || 0) + dt;

          // Trigger on any overlap at ground level
          const on = (p.x + p.w > t.x && p.x < t.x + stumpW
                      && p.y + p.h >= GROUND_Y - 6 && p.y + p.h <= GROUND_Y + 4
                      && p.onGround);
          if (!dying && on) {
            t.state = 'firing'; t.activeT = 0;
            audioRef.current?.snareFire();
            s.shake = Math.max(s.shake, 12);
            for (let k = 0; k < 10; k++) {
              s.particles.push({
                type: 'spark', x: t.x + stumpW / 2, y: GROUND_Y - 8,
                vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 5 - 1,
                life: 0.6, max: 0.6, color: '#c5432f', size: 2,
              });
            }
          }
        } else if (t.state === 'firing') {
          t.activeT += dt;
          // Jaws open wide for 0.26s — any overlap at ground level = death
          if (!dying && t.activeT < 0.28) {
            const bx = t.x - 4, by = GROUND_Y - 36, bw = stumpW + 8, bh = 42;
            if (aabb(p.x, p.y, p.w, p.h, bx, by, bw, bh)) {
              kill(t.family, 0, -6); return;
            }
          }
          if (t.activeT > 0.75) t.state = 'done';
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  function render(ctx, rawDt) {
    const s = stateRef.current;
    if (!s) return;
    const r = runRef.current;
    const reduceM = optsRef.current.reducedMotion;
    const hc = optsRef.current.highContrast;
    const B = s.biome;

    const shakeX = reduceM ? 0 : (Math.random() - 0.5) * s.shake;
    const shakeY = reduceM ? 0 : (Math.random() - 0.5) * s.shake;

    // Clear
    ctx.fillStyle = B.sky[2];
    ctx.fillRect(0, 0, W, H);

    // Sky gradient
    const skyG = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyG.addColorStop(0, B.sky[0]);
    skyG.addColorStop(0.55, B.sky[1]);
    skyG.addColorStop(1, B.sky[2]);
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, W, GROUND_Y);

    // Apply zoom around screen center + shake translation
    const zoom = s.zoom;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2 + shakeX, -H / 2 + shakeY);

    const cam = s.cam.x;

    // ── Parallax layer 1: distant mountains (0.15) ─────────────────────
    ctx.fillStyle = B.mountains;
    const ml = cam * 0.15;
    ctx.beginPath();
    for (let i = -1; i < 6; i++) {
      const baseX = i * 420 - (ml % 420);
      ctx.moveTo(baseX, GROUND_Y - 40);
      ctx.lineTo(baseX + 60, GROUND_Y - 160);
      ctx.lineTo(baseX + 160, GROUND_Y - 100);
      ctx.lineTo(baseX + 230, GROUND_Y - 190);
      ctx.lineTo(baseX + 320, GROUND_Y - 130);
      ctx.lineTo(baseX + 420, GROUND_Y - 40);
    }
    ctx.closePath();
    ctx.fill();

    // Fog band
    ctx.fillStyle = B.fog;
    ctx.fillRect(0, GROUND_Y - 160, W, 160);

    // ── Parallax layer 2: far trees (0.4) ──────────────────────────────
    const fl = cam * 0.4;
    ctx.fillStyle = B.farTrees;
    for (let i = -1; i < 14; i++) {
      const baseX = i * 180 - (fl % 180);
      drawFarTreeSilhouette(ctx, baseX, GROUND_Y, 0.9 + (i % 3) * 0.1);
    }

    // Fog again (softer, closer)
    ctx.fillStyle = B.fog;
    ctx.fillRect(0, GROUND_Y - 100, W, 100);

    // ── Parallax layer 3: mid canopy (0.7) ─────────────────────────────
    const cl = cam * 0.7;
    ctx.fillStyle = B.midCanopy;
    for (let i = -1; i < 10; i++) {
      const baseX = i * 240 - (cl % 240);
      drawMidTree(ctx, baseX, GROUND_Y, B);
    }

    // ── World space (player layer) starts here ─────────────────────────
    // Directional camera kick is applied *only* to world layer so parallax
    // doesn't wobble awkwardly.
    const kx = reduceM ? 0 : (s.cam.kickX ?? 0);
    const ky = reduceM ? 0 : (s.cam.kickY ?? 0);
    ctx.save();
    ctx.translate(-cam + kx, ky);

    // Drift particles behind props
    for (const pt of s.particles) {
      if (pt.type !== 'drift') continue;
      ctx.globalAlpha = Math.min(1, pt.life / pt.max) * 0.8;
      ctx.fillStyle = B.particleTint;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // Ground
    ctx.fillStyle = B.ground;
    ctx.fillRect(0, GROUND_Y, s.def.worldWidth, H - GROUND_Y);
    // Grass line
    ctx.fillStyle = B.groundDark;
    ctx.fillRect(0, GROUND_Y, s.def.worldWidth, 3);
    // Grass tufts
    ctx.fillStyle = B.grass;
    for (let x = 0; x < s.def.worldWidth; x += 14) {
      const gy = GROUND_Y + 2 + ((x * 17) % 3);
      ctx.fillRect(x, gy, 2, 4);
      ctx.fillRect(x + 7, gy + 1, 1.5, 3);
    }

    // Wildlife silhouettes — drawn behind props so big trees can occlude them
    for (const w of s.wildlife) drawWildlife(ctx, w, B);

    // Platforms (ledges / collapse)
    for (const pf of s.platforms) {
      if (pf.kind === 'ground') continue; // already painted
      drawPlatform(ctx, pf, B);
    }

    // Traps
    for (const t of s.traps) drawTrap(ctx, t, B, hc);

    // Props — trees, ferns, light shafts, signs
    for (const prop of (s.def.props || [])) drawProp(ctx, prop, B);

    // Checkpoints
    for (const c of s.checkpoints) drawCheckpoint(ctx, c, B, hc);

    // Signs
    for (const sg of (s.def.signs || [])) drawSign(ctx, sg, B);

    // Exit portal
    drawExit(ctx, s, B);

    // Player / ragdoll
    if (s.status === 'dead' && s.ragdoll) {
      drawRagdoll(ctx, s.ragdoll);
    } else if (s.status !== 'dead') {
      drawPlayer(ctx, s.player);
    }

    // Non-drift particles (foreground)
    for (const pt of s.particles) {
      if (pt.type === 'drift') continue;
      ctx.globalAlpha = Math.min(1, pt.life / pt.max);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
    // End world space

    // Vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.72);
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, B.vignette);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
    // End zoom/shake

    // Death flash (screen space)
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(197, 67, 47, ${Math.min(0.4, s.flash)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Slow-mo desaturation veil + tightening radial vignette toward impact
    if (s.slowmo > 0 && !reduceM) {
      const t = s.slowmo / SLOWMO_TIME;
      ctx.fillStyle = `rgba(10, 8, 12, ${t * 0.18})`;
      ctx.fillRect(0, 0, W, H);
      // Focus vignette — bloom tightens as time slows. Centered on screen since
      // the camera has already framed the impact (player near centre via lookahead).
      const cx = W / 2, cy = H / 2;
      const innerR = W * (0.18 + 0.18 * (1 - t));
      const outerR = W * 0.62;
      const vg = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(1, `rgba(32, 6, 6, ${0.5 * t})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }

    // CSS-filter color grade on the canvas element itself — cheapest way to get
    // a chromatic-style bite on impact. One style write per frame, browser
    // composites for free. Cleared as slow-mo decays.
    const canvasEl = ctx.canvas;
    if (s.slowmo > 0 && !reduceM) {
      const t = s.slowmo / SLOWMO_TIME;
      const filter = `saturate(${(1 + t * 0.45).toFixed(2)}) hue-rotate(${(-t * 6).toFixed(1)}deg) contrast(${(1 + t * 0.12).toFixed(2)}) brightness(${(1 - t * 0.08).toFixed(2)})`;
      if (canvasEl.style.filter !== filter) canvasEl.style.filter = filter;
    } else if (canvasEl.style.filter) {
      canvasEl.style.filter = '';
    }

    // HUD
    drawHud(ctx, s, r);
    drawRoomTip(ctx, s);

    if (s.status === 'dead' && s.epitaph) drawEpitaph(ctx, s);
    if (s.status === 'clear') {
      const a = 0.28 * (1 - s.tStatus / 0.55);
      ctx.fillStyle = `rgba(164, 242, 212, ${a})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (r.paused && !r.completed) drawPause(ctx);
    if (r.completed) drawFinish(ctx, r);
  }

  // ── render helpers ─────────────────────────────────────────────────────
  function drawFarTreeSilhouette(ctx, x, groundY, scale) {
    const h = 180 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 24 * scale, groundY);
    ctx.lineTo(x, groundY - h);
    ctx.lineTo(x + 24 * scale, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 36 * scale, groundY);
    ctx.lineTo(x - 14 * scale, groundY - h * 0.65);
    ctx.lineTo(x + 6 * scale, groundY);
    ctx.closePath();
    ctx.fill();
  }

  function drawMidTree(ctx, x, groundY, B) {
    // Trunk
    ctx.fillStyle = '#1a1612';
    ctx.fillRect(x - 6, groundY - 160, 12, 160);
    // Canopy clumps
    ctx.fillStyle = B.midCanopy;
    ctx.beginPath();
    ctx.arc(x, groundY - 180, 52, 0, Math.PI * 2);
    ctx.arc(x - 30, groundY - 160, 40, 0, Math.PI * 2);
    ctx.arc(x + 30, groundY - 160, 40, 0, Math.PI * 2);
    ctx.fill();
    // Slight highlight
    ctx.fillStyle = B.canopyHighlight;
    ctx.beginPath();
    ctx.arc(x - 18, groundY - 196, 12, 0, Math.PI * 2);
    ctx.arc(x + 22, groundY - 168, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawProp(ctx, prop, B) {
    if (prop.kind === 'bigTree') {
      const x = prop.x;
      const gy = GROUND_Y;
      const s = prop.scale || 1;
      // Trunk with taper
      ctx.fillStyle = prop.tone === 0 ? '#1a1210' : '#100c0a';
      ctx.beginPath();
      ctx.moveTo(x - 14 * s, gy);
      ctx.lineTo(x - 9 * s, gy - 200 * s);
      ctx.lineTo(x + 9 * s, gy - 200 * s);
      ctx.lineTo(x + 14 * s, gy);
      ctx.closePath();
      ctx.fill();
      // Canopy
      ctx.fillStyle = prop.tone === 0 ? B.midCanopy : '#1f3020';
      ctx.beginPath();
      ctx.arc(x, gy - 220 * s, 64 * s, 0, Math.PI * 2);
      ctx.arc(x - 40 * s, gy - 198 * s, 44 * s, 0, Math.PI * 2);
      ctx.arc(x + 40 * s, gy - 198 * s, 44 * s, 0, Math.PI * 2);
      ctx.fill();
      // Highlight
      ctx.fillStyle = B.canopyHighlight;
      ctx.beginPath();
      ctx.arc(x - 18 * s, gy - 240 * s, 16 * s, 0, Math.PI * 2);
      ctx.arc(x + 24 * s, gy - 204 * s, 11 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.kind === 'fern') {
      const x = prop.x, gy = GROUND_Y;
      ctx.strokeStyle = B.grass;
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.quadraticCurveTo(x + i * 6, gy - 14, x + i * 10, gy - 22);
        ctx.stroke();
      }
      ctx.fillStyle = B.grassLight;
      ctx.fillRect(x - 1, gy - 2, 2, 4);
    } else if (prop.kind === 'fungus') {
      const x = prop.x, gy = GROUND_Y;
      ctx.fillStyle = '#59322e';
      ctx.fillRect(x - 2, gy - 8, 4, 8);
      ctx.fillStyle = B.id === 'mosswake' ? '#d7574a' : '#4a9d82';
      ctx.beginPath();
      ctx.ellipse(x, gy - 9, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(x - 3, gy - 11, 2, 1, 0, 0, Math.PI * 2); ctx.fill();
    } else if (prop.kind === 'lightShaft') {
      const x = prop.x;
      const a = prop.alpha || 0.2;
      const g = ctx.createLinearGradient(x, 0, x, GROUND_Y);
      g.addColorStop(0, `rgba(255, 222, 150, ${a})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 14, 0); ctx.lineTo(x + 14, 0); ctx.lineTo(x + 70, GROUND_Y); ctx.lineTo(x - 70, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    } else if (prop.kind === 'safestump') {
      // Real, harmless stump — contrasts visually with the fakestump trap.
      // Plain wood grain, NO teeth ring. Taught-safe.
      const gy = GROUND_Y;
      const w = prop.w || 40;
      const x = prop.x - w / 2;
      ctx.fillStyle = '#2a1a0e';
      ctx.fillRect(x, gy - 12, w, 12);
      ctx.fillStyle = '#3a2618';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, gy - 12, w / 2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Concentric rings — the tell of realness
      ctx.strokeStyle = '#1a0c06';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, gy - 12, w / 3, 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + w / 2, gy - 12, w / 5, 1.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Mossy touch in Rotbog / dead in Heart
      if (B.id === 'rotbog') {
        ctx.fillStyle = B.grass;
        ctx.fillRect(x + 4, gy - 14, w - 8, 2);
      } else if (B.id === 'heart') {
        ctx.fillStyle = '#3a0606';
        ctx.fillRect(x + 4, gy - 14, w - 8, 2);
      }
    } else if (prop.kind === 'deadtree') {
      // Skeletal charred tree for The Heart biome
      const x = prop.x, gy = GROUND_Y, s = prop.scale || 1;
      ctx.fillStyle = '#0a0000';
      ctx.beginPath();
      ctx.moveTo(x - 10 * s, gy);
      ctx.lineTo(x - 6 * s, gy - 180 * s);
      ctx.lineTo(x + 6 * s, gy - 180 * s);
      ctx.lineTo(x + 10 * s, gy);
      ctx.closePath();
      ctx.fill();
      // Twisted branches
      ctx.strokeStyle = '#0a0000';
      ctx.lineWidth = 3 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, gy - 150 * s);
      ctx.quadraticCurveTo(x - 40 * s, gy - 160 * s, x - 60 * s, gy - 120 * s);
      ctx.moveTo(x, gy - 160 * s);
      ctx.quadraticCurveTo(x + 50 * s, gy - 170 * s, x + 70 * s, gy - 130 * s);
      ctx.moveTo(x - 4 * s, gy - 180 * s);
      ctx.quadraticCurveTo(x - 20 * s, gy - 220 * s, x - 14 * s, gy - 240 * s);
      ctx.moveTo(x + 4 * s, gy - 180 * s);
      ctx.quadraticCurveTo(x + 24 * s, gy - 218 * s, x + 20 * s, gy - 246 * s);
      ctx.stroke();
      // Ember glow inside a crack
      ctx.fillStyle = 'rgba(255, 120, 60, 0.28)';
      ctx.fillRect(x - 2 * s, gy - 90 * s, 4 * s, 20 * s);
    }
  }

  function drawWildlife(ctx, w, B) {
    if (w.type === 'bird') {
      const flap = Math.sin(w.wingT);
      const wingOff = flap * 4;
      ctx.fillStyle = 'rgba(8, 6, 4, 0.82)';
      // Body
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, 3.5, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wings (two triangles that flap)
      ctx.beginPath();
      ctx.moveTo(w.x, w.y - 1);
      ctx.lineTo(w.x - 6 * w.facing, w.y - 4 - wingOff);
      ctx.lineTo(w.x - 2 * w.facing, w.y);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w.x, w.y - 1);
      ctx.lineTo(w.x + 6 * w.facing, w.y - 4 + wingOff * 0.3);
      ctx.lineTo(w.x + 2 * w.facing, w.y);
      ctx.closePath();
      ctx.fill();
      // Tiny beak for a bit of character
      ctx.fillStyle = 'rgba(20, 10, 4, 0.7)';
      ctx.fillRect(w.x + w.facing * 2.5, w.y - 0.5, 1.8, 1);
    } else if (w.type === 'moth') {
      const flap = Math.sin(w.wingT);
      // Soft halo
      ctx.fillStyle = 'rgba(180, 240, 210, 0.18)';
      ctx.beginPath();
      ctx.arc(w.x, w.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(220, 240, 220, 0.26)';
      ctx.beginPath();
      ctx.arc(w.x, w.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      // Body + flickering wings
      ctx.fillStyle = 'rgba(220, 232, 214, 0.85)';
      ctx.fillRect(w.x - 1, w.y - 0.5, 2, 1.5);
      const ww = 4 + flap * 1.5;
      ctx.beginPath();
      ctx.ellipse(w.x - ww * 0.6, w.y - 0.4, ww, 2.2, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w.x + ww * 0.6, w.y - 0.4, ww, 2.2, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (w.type === 'emberfly') {
      // Trail
      ctx.strokeStyle = 'rgba(255, 160, 80, 0.42)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w.trailX, w.trailY);
      ctx.lineTo(w.x, w.y);
      ctx.stroke();
      // Faint glow
      ctx.fillStyle = 'rgba(255, 150, 80, 0.30)';
      ctx.beginPath();
      ctx.arc(w.x, w.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      // Hot core
      ctx.fillStyle = 'rgba(255, 230, 170, 0.95)';
      ctx.beginPath();
      ctx.arc(w.x, w.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlatform(ctx, pf, B) {
    if (pf.kind === 'ledge') {
      // A mossy stone/log ledge
      ctx.fillStyle = '#2a2218';
      ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
      ctx.fillStyle = B.grass;
      ctx.fillRect(pf.x, pf.y, pf.w, 3);
      ctx.fillStyle = B.groundDark;
      ctx.fillRect(pf.x, pf.y + pf.h - 2, pf.w, 2);
    } else if (pf.kind === 'collapse') {
      if (pf.broken) return;
      const sag = Math.sin(pf.standT * 30) * 0.9 * Math.min(1, pf.standT / (pf.delay ?? 0.3));
      ctx.save();
      ctx.translate(0, sag);
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
      ctx.fillStyle = '#5a3f25';
      ctx.fillRect(pf.x, pf.y, pf.w, 3);
      const t = pf.standT / (pf.delay ?? 0.3);
      if (t > 0.35) {
        ctx.strokeStyle = `rgba(255, 220, 180, ${0.2 + 0.4 * t})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const cx = pf.x + 8 + i * (pf.w / 4);
          ctx.moveTo(cx, pf.y);
          ctx.lineTo(cx + 5, pf.y + pf.h);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawTrap(ctx, t, B, hc) {
    const hazardC = hc ? '#ff00ff' : '#c5432f';
    const warnC = hc ? '#ffff00' : '#ffb347';

    if (t.type === 'whip') {
      // Sentient tree trunk
      const gy = GROUND_Y;
      const tx = t.x;
      const armed = t.state === 'windup' || t.state === 'firing';
      // Trunk base
      ctx.fillStyle = '#1a1008';
      ctx.beginPath();
      ctx.moveTo(tx - 22, gy);
      ctx.lineTo(tx - 14, gy - 180);
      ctx.lineTo(tx + 14, gy - 180);
      ctx.lineTo(tx + 22, gy);
      ctx.closePath();
      ctx.fill();
      // Canopy
      ctx.fillStyle = B.midCanopy;
      ctx.beginPath();
      ctx.arc(tx, gy - 210, 70, 0, Math.PI * 2);
      ctx.arc(tx - 42, gy - 186, 48, 0, Math.PI * 2);
      ctx.arc(tx + 42, gy - 186, 48, 0, Math.PI * 2);
      ctx.fill();
      // Eyes (only when armed)
      if (armed) {
        const intensity = t.state === 'windup' ? (t.windupT / t.windup) : 1;
        ctx.fillStyle = `rgba(255, 90, 65, ${0.55 + 0.45 * intensity})`;
        ctx.beginPath();
        ctx.arc(tx - 10, gy - 170, 3.5, 0, Math.PI * 2);
        ctx.arc(tx + 10, gy - 170, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Warning stripes in front of direction
        if (t.state === 'windup') {
          ctx.strokeStyle = warnC;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 4]);
          const w = t.sweep;
          const bx = t.dir > 0 ? tx : tx - w;
          ctx.beginPath();
          ctx.moveTo(bx, gy - 80);
          ctx.lineTo(bx + w, gy - 80);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      // Branch whip itself
      if (t.state === 'firing') {
        const sweepDur = 0.22;
        const progress = Math.min(1, t.activeT / sweepDur);
        const reach = progress * t.sweep;
        const end = { x: t.dir > 0 ? tx + reach : tx - reach, y: gy - 78 };
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx, gy - 140);
        ctx.quadraticCurveTo(tx + (t.dir * reach * 0.5), gy - 120, end.x, end.y);
        ctx.stroke();
        // Ember sparks along swept arc
        ctx.fillStyle = hazardC;
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(end.x - i * t.dir * 8, end.y - 4 + Math.random() * 8, 2, 2);
        }
      }
    }

    if (t.type === 'snare') {
      const gy = t.y;
      const visible = t.visible !== false;
      const armed = t.state === 'arming' || t.state === 'windup';
      // Soil patch (darker / cracked when visible)
      ctx.fillStyle = visible ? '#1e1a0e' : B.groundDark;
      ctx.fillRect(t.x, gy - 4, t.w, 4);
      if (visible) {
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(t.x + 4, gy - 2); ctx.lineTo(t.x + t.w - 4, gy - 2);
        ctx.stroke();
      }
      if (armed) {
        const pulse = 0.5 + 0.5 * Math.sin(t.animT * 18);
        ctx.fillStyle = `rgba(255, 179, 71, ${0.3 + 0.5 * pulse})`;
        ctx.fillRect(t.x, gy - 3, t.w, 2);
      }
      if (t.state === 'firing') {
        const h = Math.min(28, t.activeT * 140);
        ctx.fillStyle = hazardC;
        const spikes = Math.max(3, Math.floor(t.w / 10));
        const step = t.w / spikes;
        for (let i = 0; i < spikes; i++) {
          const bx = t.x + i * step;
          ctx.beginPath();
          ctx.moveTo(bx, gy);
          ctx.lineTo(bx + step / 2, gy - h);
          ctx.lineTo(bx + step, gy);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    if (t.type === 'mushroom') {
      const gy = GROUND_Y;
      const x = t.x;
      const armed = t.state === 'windup';
      const firing = t.state === 'firing';
      // Stem
      ctx.fillStyle = '#f0e3c6';
      ctx.fillRect(x + 10, gy - 14, 4, 14);
      // Cap
      const pulseR = armed ? 14 + Math.sin(t.animT * 20) * 1.5 : 14;
      ctx.fillStyle = B.id === 'mosswake' ? '#c83a35' : (t.safeTeach ? '#6eaa4a' : '#ac5d3a');
      ctx.beginPath();
      ctx.ellipse(x + 12, gy - 16, pulseR, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Warning: pulse when armed
      if (armed) {
        ctx.strokeStyle = warnC;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x + 12, gy - 16, pulseR + 4, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Spots
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x + 8, gy - 18, 1.4, 0, Math.PI * 2);
      ctx.arc(x + 16, gy - 16, 1.2, 0, Math.PI * 2);
      ctx.fill();
      // Cloud
      if (firing) {
        const progress = t.cloudT / t.cloudLife;
        const r = t.cloudR * Math.min(1, t.cloudT * 3.2);
        const alpha = 0.55 * (1 - progress * progress);
        const cloudC = t.safeTeach ? `rgba(150, 220, 120, ${alpha})` : `rgba(120, 60, 180, ${alpha})`;
        ctx.fillStyle = cloudC;
        ctx.beginPath();
        ctx.arc(x + 12, gy - 18, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (t.type === 'log') {
      if (t.state === 'idle' || t.state === 'done') {
        // Visible but inert at startX
        const x = t.pos, gy = GROUND_Y;
        ctx.save();
        ctx.translate(x, gy - 22);
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(-22, -22, 44, 44);
        ctx.fillStyle = '#5a3218';
        ctx.beginPath();
        ctx.arc(-22, 0, 22, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.arc(22, 0, 22, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        const x = t.pos, gy = GROUND_Y;
        const rot = t.animT * t.vx * 0.03;
        ctx.save();
        ctx.translate(x, gy - 22);
        ctx.rotate(rot);
        // Log body
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(-22, -22, 44, 44);
        ctx.fillStyle = '#5a3218';
        ctx.beginPath();
        ctx.arc(-22, 0, 22, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.arc(22, 0, 22, 0, Math.PI * 2); ctx.fill();
        // Rings
        ctx.strokeStyle = '#200d04';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(-22, 0, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(22, 0, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        // Dust trail
        if (t.state === 'firing' && Math.random() < 0.6) {
          // Added to particles in update? Keep inline:
        }
      }
      // Warning rumble line
      if (t.state === 'windup') {
        ctx.strokeStyle = warnC;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y - 2);
        ctx.lineTo(t.pos, GROUND_Y - 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (t.type === 'pit') {
      ctx.fillStyle = '#000';
      ctx.fillRect(t.x, GROUND_Y - 2, t.w, 6);
      const grad = ctx.createLinearGradient(0, GROUND_Y - 30, 0, GROUND_Y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = grad;
      ctx.fillRect(t.x, GROUND_Y - 30, t.w, 30);
    }

    if (t.type === 'predator') {
      const gy = GROUND_Y;
      const tx = t.x;
      const alerted = t.state === 'alerted';
      const windup  = t.state === 'windup';
      const firing  = t.state === 'firing';
      // Taller, gnarlier trunk than the regular whip tree
      ctx.fillStyle = '#0c0605';
      ctx.beginPath();
      ctx.moveTo(tx - 26, gy);
      ctx.lineTo(tx - 16, gy - 210);
      ctx.lineTo(tx + 16, gy - 210);
      ctx.lineTo(tx + 26, gy);
      ctx.closePath();
      ctx.fill();
      // Exposed grain knots
      ctx.fillStyle = '#1a0a06';
      ctx.fillRect(tx - 8, gy - 120, 4, 4);
      ctx.fillRect(tx + 4, gy - 160, 3, 3);
      // Dark canopy
      ctx.fillStyle = B.midCanopy;
      ctx.beginPath();
      ctx.arc(tx, gy - 240, 80, 0, Math.PI * 2);
      ctx.arc(tx - 52, gy - 208, 54, 0, Math.PI * 2);
      ctx.arc(tx + 52, gy - 208, 54, 0, Math.PI * 2);
      ctx.fill();
      // A single glowing slit-eye. Opens wider as it arms.
      const eyeOpen = (alerted ? (t.alertT || 0) / (t.alert ?? 0.3) : 0)
                    + (windup ? 1 : 0)
                    + (firing ? 1 : 0);
      const aperture = clamp(eyeOpen, 0, 1);
      const eyeY = gy - 182;
      const eyeR = 2.4 + aperture * 4;
      ctx.fillStyle = `rgba(255, 130, 70, ${0.3 + aperture * 0.7})`;
      ctx.beginPath();
      ctx.ellipse(tx, eyeY, 18 * (0.4 + aperture * 0.7), eyeR, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pupil
      if (aperture > 0.1) {
        ctx.fillStyle = '#240a04';
        const pupilOffset = (t.facing || 0) * 6;
        ctx.beginPath();
        ctx.ellipse(tx + pupilOffset, eyeY, 4, eyeR * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Windup: vertical warning stripe at locked strike column
      if (windup) {
        ctx.strokeStyle = hc ? '#ffff00' : warnC;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(t.strikeX, gy - 170);
        ctx.lineTo(t.strikeX, gy - 4);
        ctx.stroke();
        ctx.setLineDash([]);
        // Pulsing tick marks along the column
        const p = t.windupT / (t.windup ?? 0.3);
        ctx.fillStyle = hc ? '#ffff00' : warnC;
        for (let k = 0; k < 4; k++) {
          const y = gy - 170 + k * 42;
          ctx.globalAlpha = 0.3 + p * 0.6;
          ctx.fillRect(t.strikeX - 6, y, 12, 2);
        }
        ctx.globalAlpha = 1;
      }
      // Firing: a thick branch plummeting
      if (firing) {
        const slamDur = 0.16;
        const progress = Math.min(1, t.activeT / slamDur);
        const topY = gy - 170;
        const tipY = topY + progress * 170;
        ctx.fillStyle = '#140604';
        ctx.fillRect(t.strikeX - 12, topY, 24, tipY - topY);
        // Broken tip
        ctx.fillStyle = hazardC;
        ctx.beginPath();
        ctx.moveTo(t.strikeX - 16, tipY);
        ctx.lineTo(t.strikeX, tipY + 12);
        ctx.lineTo(t.strikeX + 16, tipY);
        ctx.closePath();
        ctx.fill();
        // Dust on impact
        if (progress >= 1) {
          ctx.fillStyle = 'rgba(200, 180, 140, 0.4)';
          ctx.beginPath();
          ctx.ellipse(t.strikeX, gy + 2, 28, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (t.type === 'fakestump') {
      const gy = GROUND_Y;
      const stumpW = t.w ?? 44;
      const cx = t.x + stumpW / 2;
      if (t.state === 'idle' || t.state === 'priming') {
        // Body: looks like a safe stump with a subtle ring of teeth at the top edge
        ctx.fillStyle = '#2a1a0e';
        ctx.fillRect(t.x, gy - 12, stumpW, 12);
        ctx.fillStyle = '#3a2618';
        ctx.beginPath();
        ctx.ellipse(cx, gy - 12, stumpW / 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wood grain rings
        ctx.strokeStyle = '#1a0c06';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, gy - 12, stumpW / 3, 2.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        // THE TELL: tiny ring of teeth peeking around the top edge
        ctx.fillStyle = '#e8d6b0';
        const teethCount = Math.max(6, Math.floor(stumpW / 6));
        const step = stumpW / teethCount;
        for (let i = 0; i < teethCount; i++) {
          const tx2 = t.x + step / 2 + i * step;
          ctx.beginPath();
          ctx.moveTo(tx2 - 1.4, gy - 10);
          ctx.lineTo(tx2, gy - 13);
          ctx.lineTo(tx2 + 1.4, gy - 10);
          ctx.closePath();
          ctx.fill();
        }
        if (t.state === 'priming') {
          // A faint pink shimmer inside the mouth when player is near
          ctx.fillStyle = `rgba(240, 80, 70, ${0.2 + 0.3 * Math.sin(t.animT * 14)})`;
          ctx.beginPath();
          ctx.ellipse(cx, gy - 10, stumpW / 2.4, 1.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (t.state === 'firing') {
        const progress = Math.min(1, t.activeT / 0.28);
        const jawOpen = Math.sin(progress * Math.PI) * 22;
        // Mouth opens upward — inner cavity
        ctx.fillStyle = '#140608';
        ctx.beginPath();
        ctx.moveTo(t.x, gy);
        ctx.lineTo(t.x + 2, gy - 10 - jawOpen);
        ctx.lineTo(t.x + stumpW - 2, gy - 10 - jawOpen);
        ctx.lineTo(t.x + stumpW, gy);
        ctx.closePath();
        ctx.fill();
        // Upper teeth
        ctx.fillStyle = '#f4ddb3';
        const teeth = 8;
        for (let i = 0; i < teeth; i++) {
          const txp = t.x + 4 + i * ((stumpW - 8) / teeth);
          ctx.beginPath();
          ctx.moveTo(txp, gy - 10 - jawOpen);
          ctx.lineTo(txp + (stumpW - 8) / teeth / 2, gy - 10 - jawOpen + 10);
          ctx.lineTo(txp + (stumpW - 8) / teeth, gy - 10 - jawOpen);
          ctx.closePath();
          ctx.fill();
        }
        // Lower teeth
        for (let i = 0; i < teeth; i++) {
          const txp = t.x + 4 + i * ((stumpW - 8) / teeth);
          ctx.beginPath();
          ctx.moveTo(txp, gy - 2);
          ctx.lineTo(txp + (stumpW - 8) / teeth / 2, gy - 12);
          ctx.lineTo(txp + (stumpW - 8) / teeth, gy - 2);
          ctx.closePath();
          ctx.fill();
        }
        // Tongue flick
        if (progress > 0.3 && progress < 0.7) {
          ctx.fillStyle = '#b13a3a';
          ctx.fillRect(cx - 4, gy - 10 - jawOpen * 0.3, 8, jawOpen * 0.5);
        }
      }
      // Done state: render a closed, busted-looking stump
      if (t.state === 'done') {
        ctx.fillStyle = '#1a0c06';
        ctx.fillRect(t.x, gy - 10, stumpW, 10);
        ctx.fillStyle = '#2a1a0e';
        ctx.beginPath();
        ctx.ellipse(cx, gy - 10, stumpW / 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawCheckpoint(ctx, c, B, hc) {
    const color = c.reached ? (hc ? '#00ffff' : B.accent) : 'rgba(255,255,255,0.5)';
    ctx.fillStyle = color;
    // Stone pylon
    ctx.fillStyle = '#0f0a08';
    ctx.fillRect(c.x - 4, c.y - 4, 8, 52);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y - 24);
    ctx.lineTo(c.x + 18, c.y - 16);
    ctx.lineTo(c.x, c.y - 8);
    ctx.closePath();
    ctx.fill();
    if (c.reached) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(performance.now() / 200);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y - 10, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawSign(ctx, sg, B) {
    ctx.save();
    if (sg.big) {
      ctx.font = '700 30px "Lora", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = B.accent;
      ctx.shadowBlur = 14;
      ctx.shadowColor = B.accent;
      ctx.fillText(sg.text, sg.x, sg.y);
    } else {
      ctx.font = '600 10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,230,200,0.45)';
      ctx.fillText(sg.text, sg.x, sg.y);
    }
    ctx.restore();
  }

  function drawExit(ctx, s, B) {
    const e = s.def.exit;
    const p = s.player;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    const d = Math.hypot(p.x + p.w / 2 - cx, p.y + p.h / 2 - cy);
    const glow = clamp(1 - d / 360, 0, 1);
    // Dark doorway silhouette
    ctx.fillStyle = '#0a0605';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    // Frame
    ctx.strokeStyle = B.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3 + 0.7 * glow;
    ctx.strokeRect(e.x, e.y, e.w, e.h);
    // Lamp
    ctx.fillStyle = B.accent;
    ctx.beginPath(); ctx.arc(e.x + e.w / 2, e.y - 10, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.15 + 0.35 * glow;
    ctx.beginPath(); ctx.arc(e.x + e.w / 2, e.y - 10, 12, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawPlayer(ctx, p) {
    // Body: cream shirt, red scarf, simple silhouette
    const x = p.x, y = p.y, w = p.w, h = p.h;
    // Legs
    ctx.fillStyle = '#2a2540';
    if (p.sliding) {
      ctx.fillRect(x + 2, y + h - 8, w - 4, 8);
    } else {
      ctx.fillRect(x + 2, y + h - 14, 7, 14);
      ctx.fillRect(x + w - 9, y + h - 14, 7, 14);
    }
    // Body
    ctx.fillStyle = '#e7dcb5';
    const bodyH = p.sliding ? 10 : 16;
    ctx.fillRect(x, y + (p.sliding ? h - 20 : 10), w, bodyH);
    // Scarf
    ctx.fillStyle = '#c5432f';
    ctx.fillRect(x + 1, y + (p.sliding ? h - 20 : 10), w - 2, 3);
    // Head
    if (!p.sliding) {
      ctx.fillStyle = '#f2d8ae';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 6, 6.5, 0, Math.PI * 2);
      ctx.fill();
      // Hair
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(x + w / 2 - 6, y, 12, 4);
      // Eye
      ctx.fillStyle = '#0a0708';
      const eyeX = x + w / 2 + (p.facing > 0 ? 2 : -3);
      ctx.fillRect(eyeX, y + 4.5, 1.4, 1.6);
    } else {
      // Sliding head forward-leaning
      ctx.fillStyle = '#f2d8ae';
      ctx.beginPath();
      ctx.arc(x + (p.facing > 0 ? w - 4 : 4), y + h - 16, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Invuln flicker
    if (p.invuln > 0 && Math.floor(p.invuln * 18) % 2 === 0) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
    }
  }

  function drawRagdoll(ctx, rd) {
    // Pass 1: motion-trail ghosts (older → more transparent)
    for (const part of rd.parts) {
      const hist = part.history;
      if (!hist || !hist.length) continue;
      for (let i = 0; i < hist.length; i++) {
        const fade = (i + 1) / hist.length;
        const h = hist[i];
        ctx.save();
        ctx.globalAlpha = 0.06 + fade * 0.18;
        ctx.translate(h.x + part.w / 2, h.y + part.h / 2);
        ctx.rotate(h.rot);
        ctx.fillStyle = part.color;
        ctx.fillRect(-part.w / 2, -part.h / 2, part.w, part.h);
        ctx.restore();
      }
    }
    // Pass 2: live parts on top, at full alpha
    for (const part of rd.parts) {
      ctx.save();
      ctx.translate(part.x + part.w / 2, part.y + part.h / 2);
      ctx.rotate(part.rot);
      ctx.fillStyle = part.color;
      ctx.fillRect(-part.w / 2, -part.h / 2, part.w, part.h);
      if (part.kind === 'torso') {
        // scarf
        ctx.fillStyle = '#c5432f';
        ctx.fillRect(-part.w / 2, -part.h / 2, part.w, 4);
      }
      if (part.kind === 'head') {
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(-part.w / 2, -part.h / 2, part.w, 3);
        ctx.fillStyle = '#0a0708';
        ctx.fillRect(2, -1, 1.5, 1.5);
      }
      ctx.restore();
    }
  }

  function drawHud(ctx, s, r) {
    // Top fade
    const hudAlpha = (s.status === 'playing') ? 0.22 : 0.6;
    ctx.fillStyle = `rgba(0,0,0,${hudAlpha})`;
    ctx.fillRect(0, 0, W, 20);
    ctx.font = '600 10px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(240, 227, 198, 0.92)';
    ctx.fillText(
      `${s.biome.name.toUpperCase()}  ·  ${s.def.title}  ·  STAGE ${r.stageIdx + 1}/${STAGES.length}`,
      10, 14
    );
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(210, 196, 160, 0.8)';
    ctx.fillText(`${fmtTime(r.elapsed)}  ·  DEATHS ${r.deaths}`, W - 10, 14);
  }

  function drawRoomTip(ctx, s) {
    const age = (performance.now() - s.enteredAt) / 1000;
    if (age > 3.5) return;
    const alpha = age < 2 ? 0.9 : 0.9 * (1 - (age - 2) / 1.5);
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '600 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0e3c6';
    ctx.fillText(s.def.tip, W / 2, H - 22);
    ctx.restore();
  }

  function drawEpitaph(ctx, s) {
    const age = s.tStatus;
    const inT = clamp(age / 0.18, 0, 1);
    const outT = clamp(1 - (age - 0.3) / 0.2, 0, 1);
    const alpha = age < 0.3 ? inT : outT;
    if (alpha <= 0) return;
    const msg = s.epitaph;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'italic 16px "Lora", Georgia, serif';
    ctx.textAlign = 'center';
    const mw = Math.min(W - 80, ctx.measureText(msg).width + 60);
    const mx = (W - mw) / 2, my = H / 2 - 56;
    ctx.fillStyle = 'rgba(10, 6, 10, 0.92)';
    ctx.fillRect(mx, my, mw, 68);
    ctx.strokeStyle = 'rgba(197, 67, 47, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, 67);
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#c5432f';
    ctx.fillText('CHECK-OUT', W / 2, my + 20);
    ctx.font = 'italic 15px "Lora", Georgia, serif';
    ctx.fillStyle = '#e0d6c0';
    ctx.fillText(msg, W / 2, my + 48);
    ctx.restore();
  }

  function drawPause(ctx) {
    ctx.fillStyle = 'rgba(8, 6, 10, 0.74)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = '700 42px "Lora", Georgia, serif';
    ctx.fillStyle = '#f0e3c6';
    ctx.fillText('Paused', W / 2, H / 2 - 8);
    ctx.font = '600 12px "Courier New", monospace';
    ctx.fillStyle = '#c9b48a';
    ctx.fillText('P to resume  ·  R to restart stage  ·  H for help  ·  M to mute', W / 2, H / 2 + 22);
  }

  function drawFinish(ctx, r) {
    ctx.fillStyle = 'rgba(8, 6, 10, 0.92)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    // Title
    ctx.font = '700 52px "Lora", Georgia, serif';
    ctx.fillStyle = '#ffe39c';
    ctx.shadowBlur = 22;
    ctx.shadowColor = '#ffb74d';
    ctx.fillText('SURVIVED', W / 2, H / 2 - 170);
    ctx.shadowBlur = 0;

    // Totals line
    const score = Math.max(0, Math.round(1800 - r.deaths * 28 - r.elapsed * 2.5));
    ctx.font = '600 14px "Courier New", monospace';
    ctx.fillStyle = '#f0e3c6';
    ctx.fillText(
      `TIME ${fmtTime(r.elapsed)}   ·   DEATHS ${r.deaths}   ·   SCORE ${score}`,
      W / 2, H / 2 - 128
    );

    // Stage breakdown — two columns
    ctx.font = '600 10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(201, 180, 138, 0.7)';
    ctx.fillText('STAGE BREAKDOWN', W / 2, H / 2 - 92);

    const rowH = 22;
    const startY = H / 2 - 60;
    const leftX = W / 2 - 180;
    const rightX = W / 2 + 180;
    STAGES.forEach((stage, i) => {
      const deaths = r.stageDeaths[i] || 0;
      const y = startY + i * rowH;
      // Biome marker dot
      const B = BIOMES[stage.biome];
      ctx.fillStyle = B.accent;
      ctx.beginPath();
      ctx.arc(leftX - 14, y - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      // Stage title
      ctx.textAlign = 'left';
      ctx.font = '600 13px "Courier New", monospace';
      ctx.fillStyle = 'rgba(240, 227, 198, 0.82)';
      ctx.fillText(stage.title, leftX, y);
      // Death count (colour grade: green = clean, amber = rough, red = grim)
      ctx.textAlign = 'right';
      ctx.font = '700 14px "Courier New", monospace';
      ctx.fillStyle = deaths === 0 ? '#a4f2d4'
                    : deaths <= 3 ? '#f0e3c6'
                    : deaths <= 6 ? '#ffb347'
                    : '#ff7a5a';
      ctx.fillText(String(deaths).padStart(2, '0'), rightX, y);
    });

    // Best line (if any)
    const best = loadBest();
    if (best != null) {
      ctx.textAlign = 'center';
      ctx.font = '600 10px "Courier New", monospace';
      ctx.fillStyle = score >= best ? '#ffe39c' : 'rgba(138, 155, 165, 0.75)';
      ctx.fillText(
        score >= best ? `NEW BEST — ${score}` : `BEST ${best}`,
        W / 2, startY + STAGES.length * rowH + 12
      );
    }

    // CTA
    ctx.textAlign = 'center';
    ctx.font = '600 11px "Courier New", monospace';
    ctx.fillStyle = '#8a9ba5';
    ctx.fillText('R to run it back', W / 2, startY + STAGES.length * rowH + 48);
  }

  // Restart handler on finish
  useEffect(() => {
    const onR = (e) => {
      if (!runRef.current.completed) return;
      if (e.key === 'r' || e.key === 'R') resetRun();
    };
    window.addEventListener('keydown', onR);
    return () => window.removeEventListener('keydown', onR);
  }, []);

  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="grudgewood">
      <div className="grudgewood-bar">
        <span>Stage <b>{ui.stageIdx + 1}/{STAGES.length}</b></span>
        <span>Deaths <b>{ui.deaths}</b></span>
        <span>Time <b>{fmtTime(ui.elapsed)}</b></span>
        {ui.best != null && <span>Best <b>{ui.best}</b></span>}
        <button className="btn btn-ghost btn-sm" onClick={restartStage}>Restart stage</button>
        <button className="btn btn-ghost btn-sm" onClick={togglePause}>{ui.paused ? 'Resume' : 'Pause'}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setUi((u) => ({ ...u, helpOpen: !u.helpOpen }))}>Help</button>
        <button className="btn btn-ghost btn-sm" onClick={toggleMute}>{ui.muted ? 'Unmute' : 'Mute'}</button>
        <button className="btn btn-ghost btn-sm" onClick={toggleReducedMotion} aria-pressed={ui.reducedMotion}>
          {ui.reducedMotion ? 'Motion: low' : 'Motion: full'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={toggleHighContrast} aria-pressed={ui.highContrast}>
          {ui.highContrast ? 'Contrast: high' : 'Contrast: std'}
        </button>
      </div>
      <div className="grudgewood-stage">
        <canvas ref={canvasRef} className="grudgewood-canvas" width={W} height={H} tabIndex={0}/>
        {showTouch && !ui.completed && (
          <div className="grudgewood-touch-layer" aria-hidden="false">
            <div className="grudgewood-touch-left">
              <button
                className={`grudgewood-touch-btn ${touchPressed.left ? 'is-active' : ''}`}
                aria-label="Move left"
                {...touchBind('left')}
              >◀</button>
              <button
                className={`grudgewood-touch-btn ${touchPressed.right ? 'is-active' : ''}`}
                aria-label="Move right"
                {...touchBind('right')}
              >▶</button>
            </div>
            <div className="grudgewood-touch-right">
              <button
                className={`grudgewood-touch-btn grudgewood-touch-btn--small ${touchPressed.down ? 'is-active' : ''}`}
                aria-label="Slide"
                {...touchBind('down')}
              >↓</button>
              <button
                className={`grudgewood-touch-btn grudgewood-touch-btn--big ${touchPressed.jump ? 'is-active' : ''}`}
                aria-label="Jump"
                {...touchBind('jump')}
              >JUMP</button>
            </div>
          </div>
        )}
        {ui.helpOpen && (
          <div className="grudgewood-help">
            <div className="grudgewood-help-title">Field Notes</div>
            <div className="grudgewood-help-row"><span>Move</span><b>A / D  ·  ← →  ·  left stick</b></div>
            <div className="grudgewood-help-row"><span>Jump</span><b>Space / W / ↑  ·  A button</b></div>
            <div className="grudgewood-help-row"><span>Sprint</span><b>Shift  ·  LB</b></div>
            <div className="grudgewood-help-row"><span>Slide</span><b>S / ↓ while moving  ·  down on d-pad</b></div>
            <div className="grudgewood-help-row"><span>Restart stage</span><b>R  ·  B button</b></div>
            <div className="grudgewood-help-row"><span>Pause</span><b>P</b></div>
            <div className="grudgewood-help-row"><span>Mute</span><b>M</b></div>
            <div className="grudgewood-help-row grudgewood-help-tip">
              <span>·</span>
              <b>Every lethal trap has a tell. Creaks, pulses, tremors. The forest is fair. Not kind.</b>
            </div>
          </div>
        )}
      </div>
      <div className="grudgewood-hint">
        Reach the grove edge. 1-hit deaths. Instant respawn at checkpoint. {STAGES.length} stages across 2 biomes.
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────────────────
function fmtTime(sec) {
  if (!sec || !isFinite(sec)) sec = 0;
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const BEST_KEY = 'pgplay:grudgewood:best';
function loadBest() {
  try { const v = localStorage.getItem(BEST_KEY); return v ? parseInt(v, 10) : null; } catch { return null; }
}
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch {} }
