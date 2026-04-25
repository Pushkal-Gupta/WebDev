// BRICKLANDS — original side-scrolling platformer.
//
//  Three short worlds (meadow, neon ruins, sky islands), one bouncy hero.
//  Run, jump, stomp, collect — three handcrafted levels build into a finale
//  that asks for everything you've learned. Variable jump height, coyote
//  time, jump buffering. No copyrighted Nintendo assets — original geometry,
//  modern palette, abstract silhouettes.
//
//  Engine notes (all in 480x270 logical pixels @ 16px tiles):
//    - Player AABB: 12x16. Run accel ramps to 3.6 px/frame over 12 frames.
//    - Jump: vy = -5.4. Gravity 0.32 px/f^2. Hold-jump cuts gravity 60%
//      for first 12 frames. Max fall vy = 7.
//    - Coyote = 6 frames after walking off a ledge.
//    - Jump buffer = 6 frames before landing.
//    - Camera lead-ahead 80px on facing direction; lerp 0.18; vertical
//      dead zone +/-48px around player.
//    - Touch: virtual D-pad bottom-left, jump button bottom-right; only
//      rendered when 'ontouchstart' in window.
//
//  Score: coins +50, stars +500, level clear +1000, time bonus on finale.
//  100 coins = +1 life. Submit on level 3 win as 'bricklands'.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';
import { sfx } from '../sound.js';

// Logical render dimensions — every world coordinate is in these units.
const VIEW_W = 480;
const VIEW_H = 270;
const TILE   = 16;

// Player AABB (logical px)
const P_W = 12;
const P_H = 16;

// Movement tuning — units are px/frame at 60fps. dt scaling preserves
// behaviour at lower framerates.
const RUN_MAX     = 3.6;
const RUN_ACCEL   = 3.6 / 12;     // reach top speed in ~12 frames
const RUN_FRICT   = 3.6 / 12;     // decel from top in ~12 frames
const JUMP_V      = -5.4;
const GRAVITY     = 0.32;
const JUMP_HOLD_F = 12;           // frames of variable-height window
const HOLD_GRAV_K = 0.4;          // gravity scale while holding jump in window
const FALL_MAX    = 7;
const WALL_SLIDE  = 2;
const COYOTE_F    = 6;
const BUFFER_F    = 6;
const STOMP_BOUNCE = -3.6;
const CAMERA_LERP  = 0.18;
const CAMERA_LEAD  = 80;
const CAM_DEADZONE = 48;
const HURT_INVUL_F = 30;          // 0.5s @ 60fps

// Tile glyphs — see LEVELS for the maps.
//   .  empty
//   #  solid (ground/wall)
//   =  oneway (jump-through)
//   ?  mystery block (becomes -)
//   -  spent mystery (still solid)
//   ^  spike (top-facing, half-tile)
//   F  goal flag
//   P  player spawn (treated as empty)
//
// World is decoded once per level into a typed grid.
const SOLID = new Set(['#', '-']);
const ONEWAY = new Set(['=']);
const MYSTERY = new Set(['?']);
const SPIKE = new Set(['^']);

// Per-world palette. World index = level index.
const PALETTE = [
  // 1 — meadow
  {
    skyTop:    '#7fd0ff',
    skyMid:    '#ffd6e0',
    skyBottom: '#1a2240',
    far:       '#3b4f80',
    mid:       '#2a4470',
    near:      '#1c2a4a',
    ground:    '#5a8c3a',
    groundDk:  '#3c6324',
    accent:    '#f6c93a',
  },
  // 2 — neon ruins
  {
    skyTop:    '#3a1a5a',
    skyMid:    '#ff5a92',
    skyBottom: '#0e0820',
    far:       '#5a2a8a',
    mid:       '#3a1a6a',
    near:      '#241040',
    ground:    '#9a4dff',
    groundDk:  '#5a1fc4',
    accent:    '#36e0ff',
  },
  // 3 — sky islands
  {
    skyTop:    '#aef1ff',
    skyMid:    '#ffe7b0',
    skyBottom: '#27395a',
    far:       '#6f8fc0',
    mid:       '#4f6da0',
    near:      '#34527a',
    ground:    '#e8b85a',
    groundDk:  '#a8782a',
    accent:    '#ff5a92',
  },
];

// Level rows are 17 lines tall (272px world) — top row is sky.
// Row 0 is the top of the world; bottom row is solid ground.
// Width is the column count; level scrolls horizontally to that.

const L1 = [
  '..............................................................................',
  '..............................................................................',
  '..............................................................................',
  '..............................................................................',
  '..............................................................................',
  '..............................................................................',
  '...........................?......?...........................................',
  '..............................................................................',
  '...................===........===.............................................',
  '..............................................................................',
  '...........?..............................===...............................F.',
  '..............................................................................',
  '..............................................................................',
  '..P....................................................................########',
  '###############......######################........############################',
  '###############......######################........############################',
  '###############......######################........############################',
];

const L2 = [
  '....................................................................................................',
  '....................................................................................................',
  '....................................................................................................',
  '....................................................................................................',
  '...........................................................?......................................',
  '....................................................................................................',
  '..................?..............#####.........................?...................................',
  '....................................................................................................',
  '............===..........===.................===.........===..............===.....................F',
  '....................................................................................................',
  '......................................................................................###..........',
  '..P.................................................................................................',
  '....................................................................................................',
  '###################......##############......##############......##################......###########',
  '###################......##############......##############......##################......###########',
  '###################......##############......##############......##################......###########',
  '###################......##############......##############......##################......###########',
];

const L3 = [
  '........................................................................................................................',
  '........................................................................................................................',
  '........................................................................................................................',
  '........................................................................................................................',
  '..........................................................?...................................?.......................',
  '........................................................................................................................',
  '..............?......................##......................................##.......................................',
  '........................................................................................................................',
  '............===.........===.........===.........===.........===.........===.........===.........===.................F..',
  '........................................................................................................................',
  '..................................................................................###################................',
  '..P.....................................................................................................................',
  '........................................................................................................................',
  '##############.....##########.....##########.....##########.....##########.....##########.....######........############',
  '##############^^^^^##########^^^^^##########^^^^^##########^^^^^##########^^^^^##########^^^^^######^^^^^^^^############',
  '##############.....##########.....##########.....##########.....##########.....##########.....######........############',
  '##############.....##########.....##########.....##########.....##########.....##########.....######........############',
];

// Enemies + collectibles authored separately. Coords are in tile units
// (col, row from the top of the level). 'kind' decides behaviour.
//   crawler  — walks, turns at edges/walls
//   hopper   — sits, jumps every ~1.2s with telegraph; takes 2 stomps
//   coin     — +50 score, spinning
//   star     — +500 score, glow trail
//   platform — moving 3-tile platform, period 4s (axis 'x' or 'y', range tiles)
const SPAWNS = [
  // Level 1 — gentle intro
  [
    { kind: 'coin',    col: 16, row: 11 },
    { kind: 'coin',    col: 18, row: 11 },
    { kind: 'coin',    col: 20, row: 11 },
    { kind: 'coin',    col: 28, row: 7 },
    { kind: 'coin',    col: 36, row: 7 },
    { kind: 'crawler', col: 50, row: 12 },
    { kind: 'coin',    col: 58, row: 9 },
    { kind: 'coin',    col: 60, row: 9 },
    { kind: 'star',    col: 70, row: 7 },
  ],
  // Level 2 — climbing + 1 hopper + moving platform
  [
    { kind: 'coin',    col: 12, row: 11 },
    { kind: 'coin',    col: 14, row: 11 },
    { kind: 'crawler', col: 26, row: 12 },
    { kind: 'platform', col: 28, row: 11, axis: 'x', range: 4, period: 240 },
    { kind: 'coin',    col: 34, row: 7 },
    { kind: 'coin',    col: 36, row: 7 },
    { kind: 'hopper',  col: 50, row: 12 },
    { kind: 'platform', col: 56, row: 9, axis: 'y', range: 3, period: 240 },
    { kind: 'crawler', col: 70, row: 12 },
    { kind: 'coin',    col: 80, row: 5 },
    { kind: 'star',    col: 88, row: 4 },
    { kind: 'coin',    col: 92, row: 11 },
  ],
  // Level 3 — gauntlet
  [
    { kind: 'coin',    col: 10, row: 11 },
    { kind: 'coin',    col: 12, row: 11 },
    { kind: 'crawler', col: 18, row: 12 },
    { kind: 'platform', col: 22, row: 11, axis: 'x', range: 4, period: 200 },
    { kind: 'hopper',  col: 30, row: 12 },
    { kind: 'crawler', col: 44, row: 12 },
    { kind: 'star',    col: 50, row: 5 },
    { kind: 'platform', col: 56, row: 10, axis: 'y', range: 2, period: 180 },
    { kind: 'hopper',  col: 64, row: 12 },
    { kind: 'crawler', col: 78, row: 12 },
    { kind: 'coin',    col: 88, row: 7 },
    { kind: 'coin',    col: 90, row: 7 },
    { kind: 'coin',    col: 92, row: 7 },
    { kind: 'star',    col: 100, row: 4 },
  ],
];

const LEVELS = [L1, L2, L3];

// ----------------------------------------------------------------------
// Decode a level into a grid + spawn point + goal point.
// ----------------------------------------------------------------------
function buildLevel(idx) {
  const map = LEVELS[idx];
  const cols = map[0].length;
  const rows = map.length;
  const grid = [];
  let spawn = { x: 32, y: rows * TILE - 64 };
  let goal  = { x: cols * TILE - 32, y: rows * TILE - 48 };

  for (let r = 0; r < rows; r++) {
    const line = map[r];
    const out = new Array(cols).fill('.');
    for (let c = 0; c < cols; c++) {
      const ch = line[c];
      if (ch === 'P') { spawn = { x: c * TILE + 2, y: r * TILE }; out[c] = '.'; }
      else if (ch === 'F') { goal  = { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }; out[c] = '.'; }
      else out[c] = ch;
    }
    grid.push(out);
  }

  // Hydrate spawns into runtime entity instances.
  const entSeed = SPAWNS[idx];
  const enemies = [];
  const coins   = [];
  const stars   = [];
  const platforms = [];
  for (const e of entSeed) {
    const x = e.col * TILE;
    const y = e.row * TILE;
    if (e.kind === 'crawler') {
      enemies.push({ kind: 'crawler', x, y, w: 14, h: 12, vx: -0.6, vy: 0, alive: true });
    } else if (e.kind === 'hopper') {
      enemies.push({ kind: 'hopper', x, y, w: 12, h: 16, vx: 0, vy: 0, alive: true, hp: 2, hopT: 0, telegraph: 0 });
    } else if (e.kind === 'coin') {
      coins.push({ x: x + 4, y: y + 4, w: 8, h: 8, taken: false, t: Math.random() * Math.PI * 2 });
    } else if (e.kind === 'star') {
      stars.push({ x: x + 2, y: y + 2, w: 12, h: 12, taken: false, t: 0 });
    } else if (e.kind === 'platform') {
      platforms.push({
        baseX: x, baseY: y,
        x, y, w: 3 * TILE, h: 6,
        axis: e.axis, range: (e.range ?? 3) * TILE, period: e.period ?? 240,
        t: 0,
      });
    }
  }

  return { grid, cols, rows, spawn, goal, enemies, coins, stars, platforms };
}

// ----------------------------------------------------------------------
// Tile sampling helpers.
// ----------------------------------------------------------------------
function tileAt(level, col, row) {
  if (col < 0 || col >= level.cols || row < 0 || row >= level.rows) return '.';
  return level.grid[row][col];
}
function setTile(level, col, row, ch) {
  if (col < 0 || col >= level.cols || row < 0 || row >= level.rows) return;
  level.grid[row][col] = ch;
}

// AABB vs solid tiles in the level. Returns the cell hit (for resolution).
function probeSolid(level, x, y, w, h) {
  const c0 = Math.floor(x / TILE);
  const c1 = Math.floor((x + w - 0.001) / TILE);
  const r0 = Math.floor(y / TILE);
  const r1 = Math.floor((y + h - 0.001) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const ch = tileAt(level, c, r);
      if (SOLID.has(ch) || MYSTERY.has(ch)) {
        return { c, r, ch };
      }
    }
  }
  return null;
}

// One-way platform: only collide if player's *previous bottom* was above it.
function probeOneway(level, x, y, w, h, prevBottom) {
  const c0 = Math.floor(x / TILE);
  const c1 = Math.floor((x + w - 0.001) / TILE);
  const r0 = Math.floor(y / TILE);
  const r1 = Math.floor((y + h - 0.001) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const ch = tileAt(level, c, r);
      if (ONEWAY.has(ch)) {
        const top = r * TILE;
        if (prevBottom <= top + 0.5) return { c, r, ch, top };
      }
    }
  }
  return null;
}

// Spike check (top-facing ^ — only the upper half hurts).
function probeSpike(level, x, y, w, h) {
  const c0 = Math.floor(x / TILE);
  const c1 = Math.floor((x + w - 0.001) / TILE);
  const r0 = Math.floor(y / TILE);
  const r1 = Math.floor((y + h - 0.001) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const ch = tileAt(level, c, r);
      if (SPIKE.has(ch)) {
        const top = r * TILE + 8;
        if (y + h > top) return true;
      }
    }
  }
  return false;
}

// AABB vs AABB.
function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
export default function BricklandsGame() {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const stateRef  = useRef(null);
  const submittedRef = useRef(false);

  // HUD state — updated at ~10Hz from the loop.
  const [hud, setHud] = useState({
    level: 1, lives: 3, score: 0, coins: 0, stars: 0, time: 0, deaths: 0, status: 'playing',
  });

  // Construct everything once. Effects below own the loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Detect touch — virtual controls ride alongside, dispatch to keys map.
    const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

    // Backing buffer scaling. We render into VIEW_W x VIEW_H logical px,
    // then the canvas CSS layer stretches that buffer to fill the frame.
    // This keeps the world coords clean while looking sharp on Retina.
    let viewScale = 1;
    const sizeCanvas = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const cssW = Math.max(320, Math.floor(rect.width));
      const cssH = Math.max(180, Math.floor(rect.height));
      // Scale buffer to viewport while keeping the logical render at 480x270.
      const scaleX = cssW / VIEW_W;
      const scaleY = cssH / VIEW_H;
      viewScale = Math.max(1, Math.min(scaleX, scaleY));
      canvas.width  = Math.round(VIEW_W * viewScale * dpr);
      canvas.height = Math.round(VIEW_H * viewScale * dpr);
      canvas.style.width  = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(viewScale * dpr, 0, 0, viewScale * dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    sizeCanvas();
    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(wrap);
    window.addEventListener('orientationchange', sizeCanvas);

    // ---- Input ----
    const keys = {};
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      keys[e.code] = true;
    };
    const ku = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = false;
      keys[e.code] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // Touch overlay controls — synthesize key state directly.
    const touchKeys = { left: false, right: false, jump: false };

    // ---- Build first level ----
    function newGame(levelIdx, carryover) {
      const lvl = buildLevel(levelIdx);
      const cam = { x: 0, y: 0, targetX: 0, targetY: 0 };
      const st = {
        levelIdx,
        level: lvl,
        cam,
        player: {
          x: lvl.spawn.x, y: lvl.spawn.y,
          vx: 0, vy: 0,
          facing: 1,
          onGround: false,
          coyote: 0,
          buffer: 0,
          jumpHeld: false,
          jumpHeldFrames: 0,
          jumpKeyEdge: false,
          invul: 0,
          dead: false,
          deadT: 0,
        },
        lives: carryover?.lives ?? 3,
        score: carryover?.score ?? 0,
        coins: carryover?.coins ?? 0,
        stars: carryover?.stars ?? 0,
        deaths: carryover?.deaths ?? 0,
        elapsed: carryover?.elapsed ?? 0,
        status: 'playing',
        particles: [],
        cleared: false,
        clearT: 0,
        levelStartT: carryover?.elapsed ?? 0,
        screenFade: 0,
      };
      // Center cam on spawn.
      cam.x = lvl.spawn.x - VIEW_W / 2;
      cam.y = lvl.spawn.y - VIEW_H / 2;
      cam.targetX = cam.x;
      cam.targetY = cam.y;
      return st;
    }
    stateRef.current = newGame(0);

    function pushHud() {
      const s = stateRef.current; if (!s) return;
      setHud({
        level: s.levelIdx + 1,
        lives: s.lives,
        score: s.score,
        coins: s.coins,
        stars: s.stars,
        time: Math.round(s.elapsed),
        deaths: s.deaths,
        status: s.status,
      });
    }
    pushHud();

    // ---- Particles ----
    function emit(s, x, y, kind, count = 6) {
      for (let i = 0; i < count; i++) {
        s.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 1.6 - 0.4,
          life: 24 + Math.random() * 12,
          kind,
        });
      }
    }

    // ---- Player damage ----
    function hurt(s) {
      const p = s.player;
      if (p.invul > 0 || p.dead) return;
      s.lives -= 1;
      sfx.lose && sfx.lose();
      if (s.lives <= 0) {
        p.dead = true; p.deadT = 0;
        s.deaths += 1;
        return;
      }
      p.invul = HURT_INVUL_F;
      p.vy = -3.5;
    }

    function killAndRespawn(s) {
      const p = s.player;
      sfx.lose && sfx.lose();
      s.lives -= 1;
      s.deaths += 1;
      if (s.lives <= 0) {
        p.dead = true; p.deadT = 0;
        return;
      }
      p.x = s.level.spawn.x; p.y = s.level.spawn.y;
      p.vx = 0; p.vy = 0;
      p.invul = HURT_INVUL_F;
    }

    // ---- Update step (60fps target, dt-corrected for slower frames) ----
    function step(dtScale) {
      const s = stateRef.current; if (!s) return;
      if (s.status !== 'playing') return;
      const p = s.player;
      const lvl = s.level;

      s.elapsed += dtScale / 60;

      if (p.dead) {
        p.deadT += dtScale / 60;
        s.screenFade = Math.min(1, p.deadT / 0.4);
        if (p.deadT > 1.2) {
          // Game over — submit partial run if any.
          if (!submittedRef.current && s.score > 0) {
            submittedRef.current = true;
            submitScore('bricklands', s.score, {
              time: Math.round(s.elapsed),
              coins: s.coins,
              deaths: s.deaths,
            });
          }
          s.status = 'gameover';
        }
        return;
      }

      if (s.cleared) {
        s.clearT += dtScale / 60;
        s.screenFade = Math.min(1, s.clearT / 0.6);
        if (s.clearT > 1.0) {
          // Advance level or finish run.
          if (s.levelIdx + 1 >= LEVELS.length) {
            s.status = 'won';
            // Final score: existing + level-clear bonus + time bonus.
            const timeBonus = Math.max(0, 5000 - Math.round(s.elapsed * 10));
            s.score += 1000 + timeBonus;
            if (!submittedRef.current) {
              submittedRef.current = true;
              submitScore('bricklands', s.score, {
                time: Math.round(s.elapsed),
                coins: s.coins,
                deaths: s.deaths,
              });
            }
          } else {
            stateRef.current = newGame(s.levelIdx + 1, {
              lives: s.lives,
              score: s.score + 1000,
              coins: s.coins,
              stars: s.stars,
              deaths: s.deaths,
              elapsed: s.elapsed,
            });
          }
        }
        return;
      }

      // ---- Input read ----
      const left  = !!(keys['a'] || keys['arrowleft']  || keys['keya'] || touchKeys.left);
      const right = !!(keys['d'] || keys['arrowright'] || keys['keyd'] || touchKeys.right);
      const jumpDown = !!(keys[' '] || keys['space'] || keys['w'] || keys['arrowup'] || keys['keyw'] || touchKeys.jump);

      // Edge detection so jump only triggers once per press, but holding
      // still counts for variable-height window.
      if (jumpDown && !p.jumpHeld) {
        p.buffer = BUFFER_F;
        p.jumpKeyEdge = true;
      } else {
        p.jumpKeyEdge = false;
      }
      p.jumpHeld = jumpDown;

      // ---- Horizontal accel ----
      if (left)       { p.vx -= RUN_ACCEL * dtScale; p.facing = -1; }
      else if (right) { p.vx += RUN_ACCEL * dtScale; p.facing = 1; }
      else if (p.onGround) {
        const drop = RUN_FRICT * dtScale;
        if (Math.abs(p.vx) <= drop) p.vx = 0;
        else p.vx -= Math.sign(p.vx) * drop;
      }
      p.vx = Math.max(-RUN_MAX, Math.min(RUN_MAX, p.vx));

      // ---- Gravity (variable jump height) ----
      const inJumpHold = p.jumpHeld && p.jumpHeldFrames < JUMP_HOLD_F && p.vy < 0;
      const grav = GRAVITY * (inJumpHold ? HOLD_GRAV_K : 1);
      p.vy += grav * dtScale;
      if (p.vy > FALL_MAX) p.vy = FALL_MAX;
      if (!p.onGround) p.jumpHeldFrames += dtScale;

      // ---- Wall slide (basic): pressing into a wall mid-air clamps fall ----
      if (!p.onGround && p.vy > WALL_SLIDE) {
        const sideC = Math.floor(((p.facing > 0 ? p.x + P_W + 1 : p.x - 1)) / TILE);
        const rowMid = Math.floor((p.y + P_H / 2) / TILE);
        const t = tileAt(lvl, sideC, rowMid);
        if (SOLID.has(t) || MYSTERY.has(t)) {
          if ((p.facing > 0 && right) || (p.facing < 0 && left)) {
            p.vy = WALL_SLIDE;
          }
        }
      }

      // ---- Buffered jump consumption ----
      if (p.buffer > 0) {
        if (p.onGround || p.coyote > 0) {
          p.vy = JUMP_V;
          p.onGround = false;
          p.coyote = 0;
          p.buffer = 0;
          p.jumpHeldFrames = 0;
          sfx.click && sfx.click();
        }
      }
      p.buffer -= dtScale;
      p.coyote -= dtScale;

      // ---- Move horizontally + collide solids ----
      const prevBottom = p.y + P_H;
      p.x += p.vx * dtScale;
      let hit = probeSolid(lvl, p.x, p.y, P_W, P_H);
      if (hit) {
        if (p.vx > 0) p.x = hit.c * TILE - P_W - 0.001;
        else if (p.vx < 0) p.x = (hit.c + 1) * TILE + 0.001;
        p.vx = 0;
      }

      // ---- Move vertically + collide solids + oneways ----
      const wasGround = p.onGround;
      p.y += p.vy * dtScale;
      hit = probeSolid(lvl, p.x, p.y, P_W, P_H);
      p.onGround = false;
      if (hit) {
        if (p.vy > 0) {
          p.y = hit.r * TILE - P_H - 0.001;
          p.onGround = true;
          if (p.vy > 2) emit(s, p.x + P_W / 2, p.y + P_H, 'dust', 3);
        } else if (p.vy < 0) {
          p.y = (hit.r + 1) * TILE + 0.001;
          // Mystery block bump from below.
          if (MYSTERY.has(hit.ch)) {
            setTile(lvl, hit.c, hit.r, '-');
            // Spawn a coin above the block.
            lvl.coins.push({
              x: hit.c * TILE + 4, y: (hit.r - 1) * TILE + 4,
              w: 8, h: 8, taken: false, t: 0, fly: 18,
            });
            sfx.confirm && sfx.confirm();
            emit(s, hit.c * TILE + 8, hit.r * TILE, 'spark', 5);
          }
        }
        p.vy = 0;
      }
      // Oneway platforms (only when descending, and prev bottom above top).
      if (!hit && p.vy >= 0) {
        const o = probeOneway(lvl, p.x, p.y, P_W, P_H, prevBottom);
        if (o) {
          p.y = o.top - P_H - 0.001;
          p.vy = 0;
          p.onGround = true;
        }
      }
      if (wasGround && !p.onGround) p.coyote = COYOTE_F;
      if (p.onGround) p.jumpHeldFrames = JUMP_HOLD_F + 1; // disable hold in air after landing

      // ---- Moving platforms (carry the player when standing on top) ----
      for (const pf of lvl.platforms) {
        pf.t += dtScale;
        const phase = (pf.t / pf.period) * Math.PI * 2;
        const off = Math.sin(phase) * pf.range;
        const px = pf.axis === 'x' ? pf.baseX + off : pf.baseX;
        const py = pf.axis === 'y' ? pf.baseY + off : pf.baseY;
        const dx = px - pf.x;
        const dy = py - pf.y;
        pf.x = px; pf.y = py;
        // Player-on-platform AABB test (player feet on platform top).
        const onTop = (
          p.x + P_W > pf.x && p.x < pf.x + pf.w &&
          Math.abs((p.y + P_H) - pf.y) < 4 && p.vy >= 0
        );
        if (onTop) {
          p.x += dx;
          p.y = pf.y - P_H;
          p.onGround = true;
        } else {
          // Solid-side collision.
          const playerBox = { x: p.x, y: p.y, w: P_W, h: P_H };
          if (aabb(playerBox, pf)) {
            // Resolve from above only — keep behaviour simple.
            if (p.vy > 0 && (p.y + P_H - p.vy) <= pf.y + 1) {
              p.y = pf.y - P_H;
              p.vy = 0;
              p.onGround = true;
            }
          }
        }
      }

      // ---- Spike damage ----
      if (probeSpike(lvl, p.x, p.y, P_W, P_H)) {
        hurt(s);
      }

      // ---- Off-screen death ----
      if (p.y > lvl.rows * TILE + 40) {
        p.y = -100; // off-screen marker
        killAndRespawn(s);
      }

      // ---- Goal flag ----
      if (Math.hypot((p.x + P_W / 2) - lvl.goal.x, (p.y + P_H / 2) - lvl.goal.y) < 18) {
        s.cleared = true;
        s.clearT = 0;
        sfx.win && sfx.win();
        s.score += 200; // touch-flag bonus
      }

      // ---- Coins ----
      const playerBox = { x: p.x, y: p.y, w: P_W, h: P_H };
      for (const coin of lvl.coins) {
        if (coin.taken) continue;
        coin.t += dtScale * 0.12;
        if (coin.fly !== undefined) {
          coin.y -= 0.6 * dtScale;
          coin.fly -= dtScale;
          if (coin.fly <= 0) coin.fly = undefined;
        }
        if (aabb(playerBox, coin)) {
          coin.taken = true;
          s.coins += 1;
          s.score += 50;
          sfx.confirm && sfx.confirm();
          emit(s, coin.x + 4, coin.y + 4, 'spark', 4);
          if (s.coins >= 100) { s.coins -= 100; s.lives += 1; }
        }
      }
      // ---- Stars ----
      for (const star of lvl.stars) {
        if (star.taken) continue;
        star.t += dtScale * 0.08;
        if (aabb(playerBox, star)) {
          star.taken = true;
          s.score += 500;
          sfx.win && sfx.win();
          emit(s, star.x + 6, star.y + 6, 'star', 12);
        }
      }

      // ---- Enemies ----
      for (const e of lvl.enemies) {
        if (!e.alive) continue;

        if (e.kind === 'crawler') {
          // Apply gravity if airborne.
          e.vy += GRAVITY * dtScale;
          if (e.vy > FALL_MAX) e.vy = FALL_MAX;
          // Horizontal move + collide.
          e.x += e.vx * dtScale;
          let h = probeSolid(lvl, e.x, e.y, e.w, e.h);
          if (h) {
            if (e.vx > 0) e.x = h.c * TILE - e.w - 0.001;
            else if (e.vx < 0) e.x = (h.c + 1) * TILE + 0.001;
            e.vx = -e.vx;
          }
          // Vertical move + collide.
          e.y += e.vy * dtScale;
          h = probeSolid(lvl, e.x, e.y, e.w, e.h);
          let onG = false;
          if (h) {
            if (e.vy > 0) { e.y = h.r * TILE - e.h - 0.001; e.vy = 0; onG = true; }
            else if (e.vy < 0) { e.y = (h.r + 1) * TILE + 0.001; e.vy = 0; }
          }
          // Edge turn — if no ground ahead, reverse.
          if (onG) {
            const aheadX = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
            const groundC = Math.floor(aheadX / TILE);
            const groundR = Math.floor((e.y + e.h + 1) / TILE);
            const t = tileAt(lvl, groundC, groundR);
            if (!SOLID.has(t) && !MYSTERY.has(t)) e.vx = -e.vx;
          }
        } else if (e.kind === 'hopper') {
          // Sit-and-jump on a clock.
          e.vy += GRAVITY * dtScale;
          if (e.vy > FALL_MAX) e.vy = FALL_MAX;
          e.hopT += dtScale;
          if (e.hopT > 60 && e.hopT < 72) {
            e.telegraph = 1; // squash window
          } else {
            e.telegraph = 0;
          }
          if (e.hopT > 72) {
            // Hop toward player.
            e.vy = -4.4;
            e.vx = (p.x > e.x) ? 0.8 : -0.8;
            e.hopT = 0;
          }
          e.x += e.vx * dtScale;
          let h = probeSolid(lvl, e.x, e.y, e.w, e.h);
          if (h) {
            if (e.vx > 0) e.x = h.c * TILE - e.w - 0.001;
            else if (e.vx < 0) e.x = (h.c + 1) * TILE + 0.001;
            e.vx = 0;
          }
          e.y += e.vy * dtScale;
          h = probeSolid(lvl, e.x, e.y, e.w, e.h);
          if (h) {
            if (e.vy > 0) { e.y = h.r * TILE - e.h - 0.001; e.vy = 0; e.vx = 0; }
            else if (e.vy < 0) { e.y = (h.r + 1) * TILE + 0.001; e.vy = 0; }
          }
        }

        // Collide with player.
        const ebox = { x: e.x, y: e.y, w: e.w, h: e.h };
        if (aabb(playerBox, ebox)) {
          // Stomp = player descending and feet near enemy top.
          const stomp = p.vy > 0 && (p.y + P_H - p.vy * dtScale) <= e.y + 4;
          if (stomp) {
            if (e.kind === 'crawler') {
              e.alive = false;
              s.score += 100;
              p.vy = STOMP_BOUNCE;
              sfx.shot && sfx.shot();
              emit(s, e.x + e.w / 2, e.y + e.h, 'debris', 8);
            } else if (e.kind === 'hopper') {
              e.hp -= 1;
              p.vy = STOMP_BOUNCE;
              sfx.shot && sfx.shot();
              emit(s, e.x + e.w / 2, e.y + e.h / 2, 'debris', 6);
              if (e.hp <= 0) { e.alive = false; s.score += 250; }
            }
          } else {
            hurt(s);
          }
        }
      }

      if (p.invul > 0) p.invul -= dtScale;

      // ---- Camera ----
      const targetX = p.x + P_W / 2 + p.facing * CAMERA_LEAD - VIEW_W / 2;
      const playerCenterY = p.y + P_H / 2;
      const camCenterY = s.cam.y + VIEW_H / 2;
      let targetY = s.cam.y;
      if (playerCenterY < camCenterY - CAM_DEADZONE) {
        targetY = playerCenterY + CAM_DEADZONE - VIEW_H / 2;
      } else if (playerCenterY > camCenterY + CAM_DEADZONE) {
        targetY = playerCenterY - CAM_DEADZONE - VIEW_H / 2;
      }
      const maxX = lvl.cols * TILE - VIEW_W;
      const maxY = lvl.rows * TILE - VIEW_H;
      s.cam.targetX = Math.max(0, Math.min(maxX, targetX));
      s.cam.targetY = Math.max(0, Math.min(maxY, targetY));
      s.cam.x += (s.cam.targetX - s.cam.x) * CAMERA_LERP * dtScale;
      s.cam.y += (s.cam.targetY - s.cam.y) * CAMERA_LERP * dtScale;

      // ---- Particles ----
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const part = s.particles[i];
        part.x += part.vx * dtScale;
        part.y += part.vy * dtScale;
        part.vy += GRAVITY * 0.4 * dtScale;
        part.life -= dtScale;
        if (part.life <= 0) s.particles.splice(i, 1);
      }
    }

    // ---- Render ----
    function draw() {
      const s = stateRef.current; if (!s) return;
      const lvl = s.level;
      const pal = PALETTE[s.levelIdx];
      const cam = s.cam;

      // ---- Background gradient (sky) ----
      const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.55, pal.skyMid);
      grad.addColorStop(1, pal.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      // ---- Far parallax (mountains) ----
      ctx.save();
      ctx.translate(-cam.x * 0.3, -cam.y * 0.2);
      ctx.fillStyle = pal.far;
      ctx.globalAlpha = 0.55;
      for (let i = 0; i < 12; i++) {
        const x = i * 80;
        const h = 60 + (i * 17) % 50;
        ctx.beginPath();
        ctx.moveTo(x, VIEW_H - 60);
        ctx.lineTo(x + 40, VIEW_H - 60 - h);
        ctx.lineTo(x + 80, VIEW_H - 60);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // ---- Mid parallax ----
      ctx.save();
      ctx.translate(-cam.x * 0.5, -cam.y * 0.3);
      ctx.fillStyle = pal.mid;
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < 16; i++) {
        const x = i * 60;
        const h = 40 + (i * 23) % 36;
        ctx.beginPath();
        ctx.moveTo(x, VIEW_H - 40);
        ctx.lineTo(x + 30, VIEW_H - 40 - h);
        ctx.lineTo(x + 60, VIEW_H - 40);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // ---- Near parallax (props) ----
      ctx.save();
      ctx.translate(-cam.x * 0.7, -cam.y * 0.5);
      for (let i = 0; i < 14; i++) {
        const x = i * 70 + 20;
        const yBase = VIEW_H - 30;
        // Tree-like prop
        ctx.fillStyle = pal.near;
        ctx.fillRect(x, yBase - 14, 4, 14);
        ctx.beginPath();
        ctx.arc(x + 2, yBase - 18, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ---- Tilemap ----
      ctx.save();
      ctx.translate(-cam.x, -cam.y);
      const c0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
      const c1 = Math.min(lvl.cols - 1, Math.floor((cam.x + VIEW_W) / TILE) + 1);
      const r0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
      const r1 = Math.min(lvl.rows - 1, Math.floor((cam.y + VIEW_H) / TILE) + 1);
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const ch = lvl.grid[r][c];
          const x = c * TILE, y = r * TILE;
          if (ch === '#') {
            // Solid block — gradient.
            ctx.fillStyle = pal.ground;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = pal.groundDk;
            ctx.fillRect(x, y + TILE - 4, TILE, 4);
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillRect(x, y, TILE, 2);
          } else if (ch === '=') {
            // Oneway — slim slab.
            ctx.fillStyle = pal.accent;
            ctx.fillRect(x, y, TILE, 4);
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(x, y + 4, TILE, 2);
          } else if (ch === '?') {
            // Mystery block.
            ctx.fillStyle = pal.accent;
            ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', x + TILE / 2, y + TILE / 2 + 1);
          } else if (ch === '-') {
            // Spent mystery.
            ctx.fillStyle = pal.groundDk;
            ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(x + 1, y + TILE - 3, TILE - 2, 2);
          } else if (ch === '^') {
            // Spike — saw-tooth row.
            ctx.fillStyle = '#cc2244';
            ctx.beginPath();
            const yTop = y + 8;
            ctx.moveTo(x, y + TILE);
            for (let i = 0; i < 4; i++) {
              ctx.lineTo(x + i * 4 + 2, yTop);
              ctx.lineTo(x + i * 4 + 4, y + TILE);
            }
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // ---- Goal flag ----
      const g = lvl.goal;
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y + 24);
      ctx.lineTo(g.x, g.y - 36);
      ctx.stroke();
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y - 36);
      ctx.lineTo(g.x + 18, g.y - 28);
      ctx.lineTo(g.x, g.y - 20);
      ctx.closePath();
      ctx.fill();

      // ---- Moving platforms ----
      for (const pf of lvl.platforms) {
        ctx.fillStyle = pal.accent;
        ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(pf.x, pf.y + pf.h - 2, pf.w, 2);
      }

      // ---- Coins ----
      for (const coin of lvl.coins) {
        if (coin.taken) continue;
        const cx = coin.x + 4;
        const cy = coin.y + 4;
        const sq = Math.abs(Math.cos(coin.t));
        const w = Math.max(2, 8 * sq);
        ctx.fillStyle = '#f6c93a';
        ctx.fillRect(cx - w / 2, cy - 4, w, 8);
        ctx.fillStyle = '#fff7c0';
        ctx.fillRect(cx - w / 4, cy - 3, Math.max(1, w / 4), 2);
      }

      // ---- Stars ----
      for (const star of lvl.stars) {
        if (star.taken) continue;
        const sx = star.x + 6;
        const sy = star.y + 6 + Math.sin(star.t) * 1.4;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(star.t);
        ctx.fillStyle = '#fff5a0';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const r1 = 6, r2 = 2.6;
          ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          const a2 = a + Math.PI / 5;
          ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
        }
        ctx.closePath();
        ctx.fill();
        // Glow
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ---- Enemies ----
      for (const e of lvl.enemies) {
        if (!e.alive) continue;
        if (e.kind === 'crawler') {
          // Squat wide silhouette.
          ctx.fillStyle = '#3a2a40';
          ctx.fillRect(e.x, e.y + 2, e.w, e.h - 2);
          ctx.fillStyle = '#5a3e60';
          ctx.fillRect(e.x + 1, e.y + 4, e.w - 2, 3);
          // Eyes
          ctx.fillStyle = '#fff';
          const eyeOffset = e.vx > 0 ? 1 : -1;
          ctx.fillRect(e.x + e.w / 2 - 3 + eyeOffset, e.y + 4, 2, 2);
          ctx.fillRect(e.x + e.w / 2 + 1 + eyeOffset, e.y + 4, 2, 2);
        } else if (e.kind === 'hopper') {
          // Tall narrow silhouette.
          ctx.fillStyle = e.telegraph ? '#ff4060' : '#a02050';
          ctx.fillRect(e.x, e.y + 4, e.w, e.h - 4);
          ctx.fillStyle = '#1a0820';
          ctx.fillRect(e.x + 2, e.y, e.w - 4, 6);
          ctx.fillStyle = '#fff';
          ctx.fillRect(e.x + 3, e.y + 2, 1.5, 1.5);
          ctx.fillRect(e.x + e.w - 4.5, e.y + 2, 1.5, 1.5);
          if (e.telegraph) {
            ctx.fillStyle = 'rgba(255,80,120,0.4)';
            ctx.fillRect(e.x - 2, e.y - 2, e.w + 4, e.h + 4);
          }
        }
      }

      // ---- Particles ----
      for (const part of s.particles) {
        const a = Math.max(0, part.life / 30);
        if (part.kind === 'spark') {
          ctx.fillStyle = `rgba(255,224,128,${a})`;
          ctx.fillRect(part.x - 1, part.y - 1, 2, 2);
        } else if (part.kind === 'debris') {
          ctx.fillStyle = `rgba(180,80,120,${a})`;
          ctx.fillRect(part.x - 1, part.y - 1, 2, 2);
        } else if (part.kind === 'star') {
          ctx.fillStyle = `rgba(255,240,160,${a})`;
          ctx.fillRect(part.x - 1, part.y - 1, 2, 2);
        } else { // dust
          ctx.fillStyle = `rgba(220,220,200,${a * 0.6})`;
          ctx.fillRect(part.x - 1, part.y, 2, 1);
        }
      }

      // ---- Player ----
      const p = s.player;
      const flash = p.invul > 0 && (Math.floor(p.invul / 4) % 2 === 0);
      if (!flash) {
        const px = p.x;
        const py = p.y;
        // Body block
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(px, py + 5, P_W, P_H - 7);
        // Magenta accent stripe
        ctx.fillStyle = '#ff3a8a';
        ctx.fillRect(px, py + 9, P_W, 3);
        // Head circle
        ctx.fillStyle = '#fff1d4';
        ctx.beginPath();
        ctx.arc(px + P_W / 2, py + 4, 4, 0, Math.PI * 2);
        ctx.fill();
        // Eye (facing-aware)
        ctx.fillStyle = '#222';
        ctx.fillRect(px + P_W / 2 + (p.facing > 0 ? 1 : -2), py + 3, 1.5, 1.5);
        // Legs
        const stride = (p.onGround && Math.abs(p.vx) > 0.4)
          ? Math.sin(s.elapsed * 18) * 1.5 : 0;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(px + 1, py + P_H - 3, 3, 3);
        ctx.fillRect(px + P_W - 4, py + P_H - 3, 3, 3);
        if (!p.onGround) {
          // Slight tilt
          ctx.fillStyle = 'rgba(255,58,138,0.4)';
          ctx.fillRect(px + (p.facing > 0 ? -2 : P_W), py + 8, 2, 4);
        }
        // Stride foot offset
        if (stride !== 0) {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(px + 1 + stride, py + P_H - 3, 3, 3);
        }
      }

      ctx.restore();

      // ---- Fade overlay (death/clear) ----
      if (s.screenFade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${s.screenFade * 0.6})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    }

    // ---- Main loop with dt-scaled fixed update ----
    let raf = 0;
    const clock = { last: performance.now(), acc: 0 };
    const FIXED = 1 / 60;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - clock.last) / 1000);
      clock.last = now;
      clock.acc += dt;
      let steps = 0;
      while (clock.acc > FIXED && steps < 5) {
        step(1.0); // 1 frame at 60fps
        clock.acc -= FIXED;
        steps += 1;
      }
      draw();

      // HUD push at ~10Hz.
      const s = stateRef.current;
      if (s) {
        s._hudT = (s._hudT ?? 0) + dt;
        if (s._hudT > 0.1) { s._hudT = 0; pushHud(); }
      }
    };
    raf = requestAnimationFrame(loop);

    // ---- Touch overlay handlers (rendered as DOM; here we just bind pointer
    //      events to set the touchKeys flags). The DOM lives below in JSX.
    const wrapEl = wrap;
    const touchHandler = (id, value) => () => {
      if (id === 'left')  touchKeys.left  = value;
      if (id === 'right') touchKeys.right = value;
      if (id === 'jump')  touchKeys.jump  = value;
    };
    // Expose to outer scope via dataset markers — see JSX touch buttons.
    wrapEl._setTouch = (id, v) => {
      if (id === 'left')  touchKeys.left  = v;
      if (id === 'right') touchKeys.right = v;
      if (id === 'jump')  touchKeys.jump  = v;
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('orientationchange', sizeCanvas);
    };
  }, []);

  // Restart handler: rebuild state from scratch.
  const restart = () => {
    submittedRef.current = false;
    // Easiest: force a fresh component remount by toggling a key isn't
    // available here, so instead reach into stateRef and rebuild.
    const wrap = wrapRef.current;
    if (!wrap) return;
    // The effect's `newGame` is captured — easiest path is a full remount
    // via a key change, but to keep this self-contained we re-init state
    // via a custom event the loop ignores. Simplest: reload the level.
    // We re-build level 0 directly.
    const lvl = buildLevel(0);
    stateRef.current = {
      ...stateRef.current,
      levelIdx: 0,
      level: lvl,
      cam: { x: lvl.spawn.x - VIEW_W / 2, y: lvl.spawn.y - VIEW_H / 2,
             targetX: lvl.spawn.x - VIEW_W / 2, targetY: lvl.spawn.y - VIEW_H / 2 },
      player: {
        x: lvl.spawn.x, y: lvl.spawn.y,
        vx: 0, vy: 0, facing: 1, onGround: false,
        coyote: 0, buffer: 0, jumpHeld: false, jumpHeldFrames: 0, jumpKeyEdge: false,
        invul: 0, dead: false, deadT: 0,
      },
      lives: 3, score: 0, coins: 0, stars: 0, deaths: 0,
      elapsed: 0, status: 'playing',
      particles: [], cleared: false, clearT: 0, screenFade: 0,
    };
    setHud({ level: 1, lives: 3, score: 0, coins: 0, stars: 0, time: 0, deaths: 0, status: 'playing' });
  };

  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

  // Touch handlers route through the wrap element's _setTouch shim
  // (installed by the loop effect).
  const setTouchKey = (id, v) => {
    const w = wrapRef.current;
    if (w && w._setTouch) w._setTouch(id, v);
  };

  return (
    <div ref={wrapRef} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#0a1020',
      overflow: 'hidden',
      userSelect: 'none',
      touchAction: 'none',
    }}>
      <canvas ref={canvasRef} style={{
        width: '100%',
        height: '100%',
        display: 'block',
        imageRendering: 'pixelated',
      }}/>

      {/* HUD — overlayed in CSS px */}
      <div style={{
        position: 'absolute', top: 8, left: 8, right: 8,
        display: 'flex', justifyContent: 'space-between',
        pointerEvents: 'none',
        color: '#fff', fontFamily: 'ui-monospace, monospace',
        textShadow: '0 1px 2px rgba(0,0,0,0.7)',
        fontSize: 13, lineHeight: 1.2,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>{'♥'.repeat(Math.max(0, hud.lives))}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {String(hud.score).padStart(6, '0')}
          </span>
          <span style={{ color: '#f6c93a' }}>{'◆'} {hud.coins}</span>
          <span style={{ color: '#cfd6e0' }}>L{hud.level}/3</span>
        </div>
        <div style={{ fontVariantNumeric: 'tabular-nums' }}>
          {String(Math.floor(hud.time / 60)).padStart(2, '0')}:
          {String(hud.time % 60).padStart(2, '0')}
        </div>
      </div>

      {/* Status overlays */}
      {hud.status === 'won' && (
        <div style={overlayStyle}>
          <div style={overlayPanel}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Run cleared</div>
            <div style={{ marginTop: 8, color: '#cfd6e0' }}>
              Score {hud.score} &middot; {hud.coins} coins &middot; {hud.deaths} deaths
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={restart}>
              Play again
            </button>
          </div>
        </div>
      )}
      {hud.status === 'gameover' && (
        <div style={overlayStyle}>
          <div style={overlayPanel}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Game over</div>
            <div style={{ marginTop: 8, color: '#cfd6e0' }}>
              Score {hud.score} &middot; reached level {hud.level}
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={restart}>
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Touch controls — only rendered on touch devices */}
      {isTouch && (
        <>
          <div style={{
            position: 'absolute', bottom: 18, left: 18,
            display: 'flex', gap: 10,
          }}>
            <TouchBtn label="←" onDown={() => setTouchKey('left', true)} onUp={() => setTouchKey('left', false)} />
            <TouchBtn label="→" onDown={() => setTouchKey('right', true)} onUp={() => setTouchKey('right', false)} />
          </div>
          <div style={{
            position: 'absolute', bottom: 18, right: 18,
          }}>
            <TouchBtn label="JUMP" big onDown={() => setTouchKey('jump', true)} onUp={() => setTouchKey('jump', false)} />
          </div>
        </>
      )}
    </div>
  );
}

const overlayStyle = {
  position: 'absolute', inset: 0, display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.55)',
  color: '#fff', textAlign: 'center',
  pointerEvents: 'auto',
};
const overlayPanel = {
  background: 'rgba(15,20,40,0.88)', padding: '20px 28px',
  borderRadius: 12, border: '1px solid rgba(255,255,255,0.18)',
  minWidth: 240,
};

function TouchBtn({ label, big, onDown, onUp }) {
  const sz = big ? 72 : 56;
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} onDown?.(); }}
      onPointerUp={(e) => { e.preventDefault(); onUp?.(); }}
      onPointerCancel={(e) => { e.preventDefault(); onUp?.(); }}
      onPointerLeave={(e) => { if (e.buttons === 0) onUp?.(); }}
      style={{
        width: sz, height: sz, borderRadius: 999,
        background: 'rgba(255,255,255,0.16)',
        border: '1px solid rgba(255,255,255,0.35)',
        color: '#fff', fontWeight: 700, fontSize: big ? 16 : 22,
        backdropFilter: 'blur(6px)',
        userSelect: 'none', touchAction: 'none',
      }}
      aria-label={label}
    >
      {label}
    </button>
  );
}
