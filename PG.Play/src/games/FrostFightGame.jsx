// FROST FIGHT — original grid-based freeze/melt maze.
//
// You are a small ice-cream. Fruit is the enemy. Rooms are grid mazes.
//
//  • Move tile-to-tile with WASD or arrows. Movement interpolates smoothly
//    but you can't change direction mid-step — commit.
//  • Space freezes the tile you're facing. If that tile already has an ice
//    block, Space melts it. Use blocks to seal corridors, trap fruits, or
//    plug gaps they're sprinting toward.
//  • Collect every fruit piece in the room. Only then does the exit glow
//    and accept you. Get touched = restart the room.
//  • Three hand-designed rooms, escalating enemy count + speed.
//
// Controls
//   Arrows or WASD — move.
//   Space or J      — freeze / melt the tile you're facing.
//   R               — restart room.
//
// Layout / presentation: top HUD chips · framed stage · bottom rail.
// All sim/AI/scoring is identical to the prior build — only the
// presentation layer was rewritten. The render scale is now driven by
// the stage rect (capped at 3.0× for crispness, 0.5× floor for mobile),
// not the legacy 1.6× clamp.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { submitScore } from '../scoreBus.js';
import { sfx } from '../sound.js';
import Hud from './frost-fight/ui/Hud.jsx';
import BottomRail from './frost-fight/ui/BottomRail.jsx';
import { LevelIntro, LevelClearChip, WinCard } from './frost-fight/ui/Overlay.jsx';
import { useIsMobile } from '../input/useVirtualControls.jsx';
import { spawnFx, tickFx, drawFx, spawnFloater } from './frost-fight/fx.js';
// Sprite atlas — Vite resolves these to bundled URLs honoring base path.
// Loaded as Image() once on mount; the loop falls back to procedural
// drawing if any sprite hasn't decoded yet (or fails entirely).
// Painted PNGs sourced from the user's art sheets (see
// scripts/frost-fight-process-art.mjs). The hand-authored SVGs in the
// same folder remain as a fallback layer — the `complete &&
// naturalWidth > 0` gate in the draw loop handles either format.
import playerSpriteUrl     from './frost-fight/sprites/player.png?url';
import strawberrySpriteUrl from './frost-fight/sprites/strawberry.png?url';
import blueberrySpriteUrl  from './frost-fight/sprites/blueberry.png?url';
import fruitSpriteUrl      from './frost-fight/sprites/fruit.png?url';
import iceSpriteUrl        from './frost-fight/sprites/ice.png?url';
import exitSpriteUrl       from './frost-fight/sprites/exit.png?url';
import strawberryWindupUrl from './frost-fight/sprites/strawberry-windup.png?url';
import blueberryWindupUrl  from './frost-fight/sprites/blueberry-windup.png?url';
import orangeSpriteUrl     from './frost-fight/sprites/orange.png?url';
import coverUrl            from './frost-fight/sprites/cover.webp?url';

// Per-room wall textures — Vite's glob-import so they're auto-discovered
// the moment the user drops a PNG into sprites/walls/. Keys are derived
// from the filename (e.g. `pantry.png` → 'pantry'). The draw loop falls
// back to a solid wall fill when a key isn't present.
const WALL_MODULES = import.meta.glob('./frost-fight/sprites/walls/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
});
const WALL_TEXTURES = {};
for (const [pathKey, url] of Object.entries(WALL_MODULES)) {
  const m = pathKey.match(/walls\/([\w-]+)\.png$/);
  if (m) WALL_TEXTURES[m[1]] = url;
}
// Maps room name → expected texture filename stem.
const ROOM_WALL_KEY = {
  'Pantry':       'pantry',
  'Cold Room':    'coldroom',
  'The Aisle':    'aisle',
  'Walk-In':      'walkin',
  'Loading Dock': 'loadingdock',
  'Sub-Basement': 'sub-basement',
};

const BEST_LS_KEY = 'pgplay-ff-best';
function readBest() {
  try {
    const raw = localStorage.getItem(BEST_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.time === 'number' && typeof parsed?.deaths === 'number') return parsed;
  } catch { /* ignore */ }
  return null;
}
function writeBest(next) {
  try { localStorage.setItem(BEST_LS_KEY, JSON.stringify(next)); }
  catch { /* ignore */ }
}

// Tile-based: tiles stay a fixed sim size (T) so the grid keeps its
// hand-tuned proportions. The canvas backing buffer is sized to the
// stage rect; the board renders centered inside that buffer at the
// max scale that fits, so the playfield owns the screen.
const T = 36;
const COLS = 22;
const ROWS = 13;
const W = COLS * T;   // 792
const H = ROWS * T;   // 468
const MOVE_TIME = 0.18;
const FREEZE_CD  = 0.12;
const RESPAWN_DELAY = 0.9;
const SCALE_FLOOR = 0.5;
const SCALE_CEIL  = 3.0;
const DPR_CAP     = 2;

/* Level language:
 *  #  wall
 *  .  floor
 *  I  pre-placed ice block
 *  p  player spawn
 *  f  fruit pickup
 *  s  strawberry enemy (slow, 1.0 s)
 *  b  blueberry enemy  (fast, 0.7 s)
 *  X  exit tile
 */
// Per-level palette tints. Each room shifts the freezer gradient + halo
// slightly so they read as distinct spaces without harming readability.
//   floorTop / floorBot — canvas linear gradient inside the playfield
//   halo                — DOM cyan halo behind the board (rgba)
//   frame               — outer board-frame drop-shadow tint
const PALETTE = {
  Pantry:        { floorTop: '#bfe6f5', floorBot: '#7ab7d0', halo: 'rgba(108, 208, 240, 0.12)', frame: 'rgba(108, 208, 240, 0.12)' },
  'Cold Room':   { floorTop: '#c9e4ee', floorBot: '#6ea6c2', halo: 'rgba(140, 200, 230, 0.13)', frame: 'rgba(140, 200, 230, 0.13)' },
  'The Aisle':   { floorTop: '#d0d8e8', floorBot: '#7790a8', halo: 'rgba(180, 200, 230, 0.14)', frame: 'rgba(170, 195, 225, 0.14)' },
  'Walk-In':     { floorTop: '#bfd6e8', floorBot: '#5e8aaa', halo: 'rgba(120, 180, 220, 0.13)', frame: 'rgba(120, 180, 220, 0.14)' },
  'Loading Dock':{ floorTop: '#cdd4dd', floorBot: '#7282a0', halo: 'rgba(170, 190, 215, 0.12)', frame: 'rgba(170, 190, 215, 0.13)' },
  'Sub-Basement':{ floorTop: '#a8b8c8', floorBot: '#3e5673', halo: 'rgba(95, 140, 200, 0.16)',  frame: 'rgba(95, 140, 200, 0.18)' },
};
const DEFAULT_PALETTE = PALETTE.Pantry;

const LEVELS = [
  {
    name: 'Pantry',
    tip: 'Freeze a tile, melt a tile. Corner the strawberry before it corners you.',
    grid: [
      '######################',
      '#p...f...............#',
      '#.####..####..####...#',
      '#....................#',
      '#....#....s....#.....#',
      '#....#.........#.....#',
      '#....######.####.....#',
      '#........f...........#',
      '#.####..####..####...#',
      '#........f...........#',
      '#............f.....X.#',
      '#....................#',
      '######################',
    ],
  },
  {
    name: 'Cold Room',
    tip: 'Two fruits, one ice cream. Plug a corridor before you grab the last piece.',
    grid: [
      '######################',
      '#.p................f.#',
      '#.####..####..####...#',
      '#....................#',
      '#...f...s.......f....#',
      '#....####..####......#',
      '#....#........#...I..#',
      '#....#...f....#......#',
      '#....####..####......#',
      '#...f......b.........#',
      '#.####..####..####...#',
      '#.f.f...............X#',
      '######################',
    ],
  },
  {
    name: 'The Aisle',
    tip: 'Three chasers. You are faster one step, but they don\'t need to think.',
    grid: [
      '######################',
      '#p........f..........#',
      '#.####..####..####...#',
      '#........s...........#',
      '#........#...........#',
      '#....f...#....f......#',
      '#........######......#',
      '#...b................#',
      '#....#......#.....s..#',
      '#....#......#........#',
      '#....#..f...#....f...#',
      '#...f...............X#',
      '######################',
    ],
  },
  {
    name: 'Walk-In',
    tip: 'Pre-cut ice cubes work for you — once. Save the melt for when it counts.',
    grid: [
      '######################',
      '#p..f.....I......f...#',
      '#.####..####..####...#',
      '#....................#',
      '#.f..#....s....#.....#',
      '#....#.........#.f...#',
      '#....######.####.....#',
      '#........f...........#',
      '#.####..####..####...#',
      '#......b.............#',
      '#............f.....X.#',
      '#....I...........I...#',
      '######################',
    ],
  },
  {
    name: 'Loading Dock',
    tip: 'Open floor, no walls to hide behind. Build your own.',
    grid: [
      '######################',
      '#p...f........f...f..#',
      '#....................#',
      '#..####........####..#',
      '#.b..............b...#',
      '#....................#',
      '#......##....##......#',
      '#....................#',
      '#..####........####..#',
      '#.s..............s...#',
      '#....................#',
      '#.....f.........f...X#',
      '######################',
    ],
  },
  {
    name: 'Sub-Basement',
    tip: 'Last room. An orange runs medium-fast — read its tells.',
    grid: [
      '######################',
      '#p..#......f.....#...#',
      '#...#.####....####...#',
      '#.f.#.#......#.....#.#',
      '#...#.#..s...#..f..#.#',
      '#...#.#######........#',
      '#......o...I.....b...#',
      '#........#######.....#',
      '#.#..f...#.....#..f..#',
      '#.#......#######.....#',
      '#.#.####....####.....#',
      '#.f.................X#',
      '######################',
    ],
  },
];

function parseLevel(idx) {
  const g = LEVELS[idx].grid;
  const walls = [];
  const ice   = new Set();
  const fruits = [];
  const enemies = [];
  let spawn = { col: 1, row: 1 };
  let exit  = { col: COLS - 2, row: ROWS - 2 };
  const wallSet = new Set();

  for (let r = 0; r < g.length; r++) {
    for (let c = 0; c < g[r].length; c++) {
      const ch = g[r][c];
      if (ch === '#') { walls.push({ col: c, row: r }); wallSet.add(`${c},${r}`); }
      else if (ch === 'I') ice.add(`${c},${r}`);
      else if (ch === 'p') spawn = { col: c, row: r };
      else if (ch === 'X') exit  = { col: c, row: r };
      else if (ch === 'f') fruits.push({ col: c, row: r });
      else if (ch === 's') enemies.push({ col: c, row: r, kind: 'strawberry' });
      else if (ch === 'b') enemies.push({ col: c, row: r, kind: 'blueberry' });
      else if (ch === 'o') enemies.push({ col: c, row: r, kind: 'orange' });
    }
  }
  return { walls, wallSet, ice, fruits, enemies, spawn, exit, tip: LEVELS[idx].tip, name: LEVELS[idx].name };
}

const isWall     = (level, c, r) => level.wallSet.has(`${c},${r}`);
const isIce      = (level, c, r) => level.ice.has(`${c},${r}`);
const inBounds   = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS;
const isPassable = (level, c, r) => inBounds(c, r) && !isWall(level, c, r) && !isIce(level, c, r);

// Per-kind step interval (seconds between move decisions). Orange sits
// between strawberry and blueberry — meaningful pacing variety without a
// new AI branch.
const ENEMY_INTERVAL = { strawberry: 1.0, blueberry: 0.7, orange: 0.85 };

export default function FrostFightGame() {
  const canvasRef = useRef(null);
  const stageRef  = useRef(null);
  const stateRef  = useRef(null);
  const viewRef = useRef({ cssW: W, cssH: H, scale: 1, offX: 0, offY: 0 });
  const submittedRef = useRef(false);
  const tipResolvedRef = useRef('');
  // Preloaded sprite atlas. Each entry stays null until the Image
  // decodes; the draw loop falls back to procedural shapes meanwhile.
  const spritesRef = useRef({
    player: null,
    strawberry: null, blueberry: null, orange: null,
    strawberryWind: null, blueberryWind: null,
    fruit: null, ice: null, exit: null,
  });
  // Particle FX queue. Items: { kind, cx, cy, t (life 0..1, decreasing) }.
  // The loop pushes on event triggers, draws + decays each frame.
  const fxRef = useRef([]);
  // Active room wall pattern. Created lazily once the level texture image
  // decodes; null while no texture is registered for the current room.
  const wallPatternRef = useRef(null);

  const [levelIdx, setLevelIdx] = useState(0);
  const [deaths, setDeaths]     = useState(0);
  const [time, setTime]         = useState(0);
  const [gemsGot, setGemsGot]   = useState(0);
  const [gemsTotal, setGemsTotal] = useState(0);
  const [status, setStatus]     = useState('playing'); // playing | won
  const [showIntro, setShowIntro] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [tip, setTip]           = useState(LEVELS[0].tip);
  // Adaptive keycap: 'freeze' / 'melt' / null based on the tile in front
  // of the player. Updated only when the action would actually change.
  const [freezeAction, setFreezeAction] = useState(null);
  const freezeActionRef = useRef(null);
  // Movement urgency: which directions hold an adjacent enemy (within
  // one tile of the player). Bitmask packed into a string key for cheap
  // change detection. Empty string when nothing is dangerous.
  const [dangerDirs, setDangerDirs] = useState('');
  const dangerDirsRef = useRef('');
  // Best run (read once on mount; written when we beat it on a win).
  const [best, setBest] = useState(() => readBest());
  const [bestBeaten, setBestBeaten] = useState(false);

  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || isMobile);

  const loadLevel = (idx) => {
    const level = parseLevel(idx);
    stateRef.current = {
      level,
      player: {
        col: level.spawn.col, row: level.spawn.row,
        moving: false, moveT: 0,
        fromCol: level.spawn.col, fromRow: level.spawn.row,
        dir: 'down',
        freezeCd: 0,
        dead: false, respawn: 0,
      },
      enemies: level.enemies.map((e) => ({
        col: e.col, row: e.row, kind: e.kind,
        moving: false, moveT: 0, fromCol: e.col, fromRow: e.row,
        nextDecide: Math.random() * 0.4 + 0.2,
      })),
      fruitsLeft: level.fruits.length,
      elapsed: 0,
      shake: 0,
      flash: 0,
    };
    setGemsTotal(level.fruits.length);
    setGemsGot(0);
    setStatus('playing');
    setTip(level.tip);
    tipResolvedRef.current = level.tip;
    setShowIntro(true);
    setFreezeAction(null);
    freezeActionRef.current = null;
    // Drop any in-flight particles from the previous room.
    fxRef.current.length = 0;

    // Push the palette to CSS so the halo/frame tint matches the canvas.
    const stage = stageRef.current;
    if (stage) {
      const p = PALETTE[level.name] ?? DEFAULT_PALETTE;
      stage.style.setProperty('--ff-room-halo', p.halo);
      stage.style.setProperty('--ff-room-frame', p.frame);
    }

    // Wall texture preload. Falls back silently if the user hasn't
    // dropped a tile in for this room — `wallPatternRef` stays null and
    // the draw loop uses the solid #1a2540 fill.
    wallPatternRef.current = null;
    const wallKey = ROOM_WALL_KEY[level.name];
    const wallUrl = wallKey ? WALL_TEXTURES[wallKey] : null;
    if (wallUrl && canvasRef.current) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        const ctx2d = canvasRef.current?.getContext('2d');
        if (!ctx2d) return;
        const pat = ctx2d.createPattern(img, 'repeat');
        wallPatternRef.current = pat;
      };
      img.src = wallUrl;
    }
  };

  useEffect(() => {
    loadLevel(levelIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx]);

  // Auto-dismiss the level intro after a beat. Fires the per-room sting
  // on entry so each transition has a tonal cue.
  useEffect(() => {
    if (!showIntro) return;
    sfx.frostIntro(levelIdx);
    const t = setTimeout(() => setShowIntro(false), reduced ? 600 : 1100);
    return () => clearTimeout(t);
  }, [showIntro, reduced, levelIdx]);

  // Sprite preload — fire once per mount, drop into spritesRef as each
  // image decodes. Errors are swallowed; the loop already falls back to
  // procedural shapes if a slot is null or hasn't completed.
  useEffect(() => {
    const sources = {
      player: playerSpriteUrl,
      strawberry: strawberrySpriteUrl,
      blueberry: blueberrySpriteUrl,
      orange: orangeSpriteUrl,
      strawberryWind: strawberryWindupUrl,
      blueberryWind: blueberryWindupUrl,
      fruit: fruitSpriteUrl,
      ice: iceSpriteUrl,
      exit: exitSpriteUrl,
    };
    const created = [];
    for (const [key, src] of Object.entries(sources)) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { spritesRef.current[key] = img; };
      img.onerror = () => { /* leave null → procedural fallback */ };
      img.src = src;
      created.push(img);
    }
    return () => {
      // Best-effort cancel: clearing src interrupts pending decodes
      // on most engines. We don't unset spritesRef so a remount with
      // the same URL hits the HTTP cache instantly.
      for (const img of created) img.onload = img.onerror = null;
    };
  }, []);

  // Stage sizing — measure the stage element, fit the board with no
  // upper-1.6 cap. Drives canvas backing buffer + render transform.
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext('2d');

    const fit = () => {
      const cssW = Math.max(1, stage.clientWidth);
      const cssH = Math.max(1, stage.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width  = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width  = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const scaleW = cssW / W;
      const scaleH = cssH / H;
      const raw = Math.min(scaleW, scaleH);
      const scale = Math.max(SCALE_FLOOR, Math.min(SCALE_CEIL, raw));
      const dispW = W * scale;
      const dispH = H * scale;
      const offX = Math.round((cssW - dispW) / 2);
      const offY = Math.round((cssH - dispH) / 2);
      viewRef.current = { cssW, cssH, scale, offX, offY, dispW, dispH };

      // Expose board dims to CSS so the frame matches exactly.
      stage.style.setProperty('--ff-board-w', dispW + 'px');
      stage.style.setProperty('--ff-board-h', dispH + 'px');
    };
    fit();

    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    const onOrient = () => fit();
    const onFs     = () => requestAnimationFrame(fit);
    window.addEventListener('orientationchange', onOrient);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      try { ro.disconnect(); } catch { /* ignore */ }
      window.removeEventListener('orientationchange', onOrient);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, []);

  // Game loop — input + sim + draw. Keyboard handlers also receive the
  // synthetic events dispatched by the shell's VirtualControls on touch.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const keys = {};
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true; keys[e.code] = true;
      if (k === 'r') {
        setDeaths((d) => d + 1);
        loadLevel(levelIdx);
      }
    };
    const ku = (e) => { keys[e.key.toLowerCase()] = false; keys[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const { level, player, enemies, shake, flash } = s;
      const { cssW, cssH } = viewRef.current;

      // Clear the full backing buffer with a transparent wipe — the
      // stage backdrop comes from CSS, the canvas only paints the
      // playfield + frost halo around it.
      ctx.clearRect(0, 0, cssW, cssH);

      // Soft frost halo bleeding past the board, sells the icy mood
      // without leaning on the canvas to draw the whole stage.
      const { dispW, dispH, offX, offY } = viewRef.current;
      const cx = offX + dispW / 2;
      const cy = offY + dispH / 2;
      const palette = PALETTE[level.name] ?? DEFAULT_PALETTE;
      const halo = ctx.createRadialGradient(cx, cy, Math.min(dispW, dispH) * 0.35, cx, cy, Math.max(dispW, dispH) * 0.95);
      halo.addColorStop(0, palette.halo);
      halo.addColorStop(1, 'rgba(108, 208, 240, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, cssW, cssH);

      // Centered + uniform-scaled playfield.
      const { scale } = viewRef.current;
      // Keep stroke widths stable in screen-pixels regardless of board
      // scale — at 3.0× the old `lineWidth: 1` would render as 3 px.
      const px = 1 / Math.max(0.0001, scale);
      ctx.save();
      ctx.translate(offX, offY);
      ctx.scale(scale, scale);

      // Arena background — pale blue gradient, palette tinted per room.
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, palette.floorTop);
      grad.addColorStop(1, palette.floorBot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Camera shake for hits — applied on top of the centering translate.
      const sx = (Math.random() - 0.5) * shake;
      const sy = (Math.random() - 0.5) * shake;
      ctx.save();
      ctx.translate(sx, sy);

      // Tile grid — subtle. Stroke kept at 1 screen-pixel via px factor
      // so the lines stay airy at 4K and don't blur at 0.5×.
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = px;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath(); ctx.moveTo(c * T, 0); ctx.lineTo(c * T, H); ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * T); ctx.lineTo(W, r * T); ctx.stroke();
      }

      // Walls. Use a CanvasPattern when the room has a registered texture;
      // overlay a thin dark veil so the texture stays cool-toned and the
      // grid still reads. Fall back to solid navy when no texture is
      // present.
      const wallPat = wallPatternRef.current;
      level.walls.forEach((w) => {
        const wx = w.col * T, wy = w.row * T;
        if (wallPat) {
          ctx.fillStyle = wallPat;
          ctx.fillRect(wx, wy, T, T);
          ctx.fillStyle = 'rgba(8, 16, 28, 0.30)';
          ctx.fillRect(wx, wy, T, T);
        } else {
          ctx.fillStyle = '#1a2540';
          ctx.fillRect(wx, wy, T, T);
        }
        ctx.strokeStyle = 'rgba(42, 56, 96, 0.75)';
        ctx.lineWidth = 2 * px;
        ctx.strokeRect(wx + 1, wy + 1, T - 2, T - 2);
      });

      // Ice blocks.
      const iceImg = spritesRef.current.ice;
      const iceReady = iceImg && iceImg.complete && iceImg.naturalWidth > 0;
      level.ice.forEach((key) => {
        const [c, r] = key.split(',').map(Number);
        const x = c * T, y = r * T;
        if (iceReady) {
          ctx.drawImage(iceImg, x + 1, y + 1, T - 2, T - 2);
        } else {
          ctx.fillStyle = '#d9ecf5';
          ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
          ctx.strokeStyle = '#7ac0e0';
          ctx.lineWidth = 2 * px;
          ctx.strokeRect(x + 2, y + 2, T - 4, T - 4);
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = px;
          ctx.beginPath();
          ctx.moveTo(x + 6, y + 8); ctx.lineTo(x + 14, y + 14);
          ctx.moveTo(x + 18, y + 24); ctx.lineTo(x + 28, y + 16);
          ctx.stroke();
        }
      });

      // Exit. The cyan halo + flag combo: halo pulses when active, flag
      // sprite sits on top.
      const ex = level.exit.col * T + T / 2;
      const ey = level.exit.row * T + T / 2;
      const exitActive = s.fruitsLeft === 0;
      const pulse = exitActive ? 0.6 + 0.4 * Math.sin(performance.now() / 200) : 0.25;
      ctx.fillStyle = exitActive ? `rgba(53, 240, 201, ${pulse})` : 'rgba(120,180,200,0.18)';
      ctx.beginPath();
      ctx.arc(ex, ey + 4, T * 0.42, 0, Math.PI * 2);
      ctx.fill();
      const exitImg = spritesRef.current.exit;
      const exitReady = exitImg && exitImg.complete && exitImg.naturalWidth > 0;
      if (exitReady) {
        const sz = 28;
        ctx.save();
        if (!exitActive) ctx.globalAlpha = 0.55;
        ctx.drawImage(exitImg, ex - sz / 2, ey - sz / 2 - 2, sz, sz);
        ctx.restore();
      } else {
        ctx.strokeStyle = exitActive ? '#35f0c9' : '#888';
        ctx.lineWidth = 3 * px;
        ctx.beginPath();
        ctx.arc(ex, ey, T * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 * px;
        ctx.beginPath();
        ctx.moveTo(ex, ey - 14); ctx.lineTo(ex, ey + 10);
        ctx.stroke();
        ctx.fillStyle = exitActive ? '#fff' : 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(ex, ey - 14); ctx.lineTo(ex + 12, ey - 9); ctx.lineTo(ex, ey - 4); ctx.closePath();
        ctx.fill();
      }

      // Fruits.
      const fruitImg = spritesRef.current.fruit;
      const fruitReady = fruitImg && fruitImg.complete && fruitImg.naturalWidth > 0;
      level.fruits.forEach((f) => {
        if (f.taken) return;
        const fx = f.col * T + T / 2;
        const fy = f.row * T + T / 2 + Math.sin(performance.now() / 350 + f.col) * 1.5;
        if (fruitReady) {
          const sz = 26;
          ctx.drawImage(fruitImg, fx - sz / 2, fy - sz / 2, sz, sz);
        } else {
          ctx.fillStyle = '#ff4d6d';
          ctx.beginPath();
          ctx.arc(fx, fy + 2, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2d7a2a';
          ctx.beginPath();
          ctx.moveTo(fx - 4, fy - 6);
          ctx.lineTo(fx + 4, fy - 6);
          ctx.lineTo(fx, fy - 2);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillRect(fx - 3, fy, 1, 1);
          ctx.fillRect(fx + 2, fy + 2, 1, 1);
          ctx.fillRect(fx, fy - 1, 1, 1);
        }
      });

      // Enemies.
      const strawImg = spritesRef.current.strawberry;
      const blueImg  = spritesRef.current.blueberry;
      const orangeImg = spritesRef.current.orange;
      const strawWindImg = spritesRef.current.strawberryWind;
      const blueWindImg  = spritesRef.current.blueberryWind;
      const strawReady  = strawImg  && strawImg.complete  && strawImg.naturalWidth > 0;
      const blueReady   = blueImg   && blueImg.complete   && blueImg.naturalWidth > 0;
      const orangeReady = orangeImg && orangeImg.complete && orangeImg.naturalWidth > 0;
      // Wind-up pre-tell: ~220ms before an enemy commits to a step it
      // switches to a wider-eyed "alert" pose. Reads as scanning, gives
      // the player a tiny tell on top of the global ENEMY_INTERVAL. The
      // same alt sprite doubles as the in-step "walking" frame so the
      // sequence reads rest → alert (windup lead) → walk (mid-step) →
      // rest. Orange has no alt sprite yet so it just stays resting.
      const WINDUP_LEAD = 0.22;
      enemies.forEach((e) => {
        const { x, y } = entityPos(e);
        const ecx = x + T / 2, ecy = y + T / 2;
        const isWinding =
          (!e.moving && e.nextDecide > 0 && e.nextDecide < WINDUP_LEAD)
          || e.moving;
        const baseSprite =
          e.kind === 'strawberry' ? strawImg
          : e.kind === 'orange'   ? orangeImg
          : blueImg;
        const windSprite =
          e.kind === 'strawberry' ? strawWindImg
          : e.kind === 'orange'   ? null
          : blueWindImg;
        const windReady = windSprite && windSprite.complete && windSprite.naturalWidth > 0;
        const sprite = (isWinding && windReady) ? windSprite : baseSprite;
        const ready =
          e.kind === 'strawberry' ? strawReady
          : e.kind === 'orange'   ? orangeReady
          : blueReady;
        if (ready) {
          // Subtle bob so enemies don't feel pasted onto the grid.
          const bob = Math.sin(performance.now() / 280 + e.col + e.row) * 0.6;
          // Slight squash on the wind-up frame for extra punch.
          const sz = isWinding ? 32 : 30;
          ctx.drawImage(sprite, ecx - sz / 2, ecy - sz / 2 + bob, sz, sz);
        } else {
          // Procedural fallback (kept identical to the original look).
          if (e.kind === 'strawberry') {
            ctx.fillStyle = '#ff4d6d';
            ctx.beginPath();
            ctx.arc(ecx, ecy + 3, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2d7a2a';
            ctx.beginPath();
            ctx.moveTo(ecx - 6, ecy - 8);
            ctx.lineTo(ecx + 6, ecy - 8);
            ctx.lineTo(ecx, ecy - 3);
            ctx.closePath();
            ctx.fill();
          } else if (e.kind === 'orange') {
            ctx.fillStyle = '#ff8a3a';
            ctx.beginPath();
            ctx.arc(ecx, ecy + 3, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1f5c1c';
            ctx.fillRect(ecx - 1, ecy - 10, 2, 4);
          } else {
            ctx.fillStyle = '#35a8ff';
            ctx.beginPath();
            ctx.arc(ecx, ecy + 3, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1a3a7a';
            ctx.beginPath();
            ctx.arc(ecx, ecy - 5, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#fff';
          ctx.fillRect(ecx - 5, ecy, 3, 3);
          ctx.fillRect(ecx + 2, ecy, 3, 3);
          ctx.fillStyle = '#0a0d0e';
          ctx.fillRect(ecx - 4, ecy + 1, 1, 1);
          ctx.fillRect(ecx + 3, ecy + 1, 1, 1);
          ctx.strokeStyle = '#0a0d0e';
          ctx.lineWidth = 1.2 * px;
          ctx.beginPath();
          ctx.moveTo(ecx - 6, ecy - 2); ctx.lineTo(ecx - 2, ecy - 1);
          ctx.moveTo(ecx + 6, ecy - 2); ctx.lineTo(ecx + 2, ecy - 1);
          ctx.stroke();
        }
      });

      // Player (ice cream).
      if (!player.dead) {
        const { x, y } = entityPos(player);
        const pcx = x + T / 2, pcy = y + T / 2;
        const playerImg = spritesRef.current.player;
        const playerReady = playerImg && playerImg.complete && playerImg.naturalWidth > 0;
        if (playerReady) {
          const sz = 32;
          // Tiny step bob so the character feels alive while moving.
          const bob = player.moving ? Math.sin(player.moveT * Math.PI) * -1.2 : 0;
          ctx.drawImage(playerImg, pcx - sz / 2, pcy - sz / 2 + bob, sz, sz);
        } else {
          ctx.fillStyle = '#d4a460';
          ctx.beginPath();
          ctx.moveTo(pcx - 9, pcy); ctx.lineTo(pcx + 9, pcy); ctx.lineTo(pcx, pcy + 14); ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#8b5a2b';
          ctx.lineWidth = px;
          ctx.beginPath();
          ctx.moveTo(pcx - 6, pcy + 2); ctx.lineTo(pcx + 6, pcy + 2);
          ctx.moveTo(pcx - 4, pcy + 6); ctx.lineTo(pcx + 4, pcy + 6);
          ctx.stroke();
          ctx.fillStyle = '#ff8ec6';
          ctx.beginPath();
          ctx.arc(pcx, pcy - 4, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0a0d0e';
          ctx.lineWidth = 1.5 * px;
          ctx.stroke();
          const dc = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.dir] || [0, 1];
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(pcx - 3 + dc[0] * 0.4, pcy - 4, 3, 0, Math.PI * 2);
          ctx.arc(pcx + 4 + dc[0] * 0.4, pcy - 4, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0a0d0e';
          ctx.beginPath();
          ctx.arc(pcx - 3 + dc[0] * 1.4, pcy - 4 + dc[1] * 1.4, 1.4, 0, Math.PI * 2);
          ctx.arc(pcx + 4 + dc[0] * 1.4, pcy - 4 + dc[1] * 1.4, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const { x, y } = entityPos(player);
        ctx.fillStyle = 'rgba(255, 77, 109, 0.55)';
        ctx.beginPath();
        ctx.ellipse(x + T / 2, y + T / 2 + 6, 13, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Particles — drawn in board coordinates, on top of entities.
      drawFx(fxRef.current, ctx);

      // Freeze-ready hint — small marker on tile in front of player.
      if (!player.moving && !player.dead) {
        const d = dirVec(player.dir);
        const tc = player.col + d[0];
        const tr = player.row + d[1];
        if (inBounds(tc, tr)) {
          const canIce  = !isWall(level, tc, tr) && !isIce(level, tc, tr)
                        && !enemies.some((e) => e.col === tc && e.row === tr)
                        && !level.fruits.some((f) => !f.taken && f.col === tc && f.row === tr)
                        && !(level.exit.col === tc && level.exit.row === tr)
                        && !(player.col === tc && player.row === tr);
          const canMelt = isIce(level, tc, tr);
          if (canIce || canMelt) {
            ctx.strokeStyle = canMelt ? 'rgba(255, 77, 109, 0.75)' : 'rgba(80, 180, 230, 0.85)';
            ctx.lineWidth = 2 * px;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(tc * T + 3, tr * T + 3, T - 6, T - 6);
            ctx.setLineDash([]);
          }
        }
      }

      ctx.restore(); // pop camera shake
      ctx.restore(); // pop centering translate

      // Flash overlay covers the full canvas (not just the playfield).
      if (flash > 0) {
        ctx.fillStyle = `rgba(255, 77, 109, ${Math.min(0.5, flash)})`;
        ctx.fillRect(0, 0, cssW, cssH);
      }
    };

    const clock = { last: performance.now() };
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s || status !== 'playing') return;

      const p = s.player;

      // Respawn tick.
      if (p.dead) {
        p.respawn -= dt;
        if (p.respawn <= 0) {
          const sp = s.level.spawn;
          p.col = sp.col; p.row = sp.row;
          p.fromCol = sp.col; p.fromRow = sp.row;
          p.moving = false; p.moveT = 0;
          p.dead = false;
          p.dir = 'down';
          p.freezeCd = 0;
          // Restore tip post-respawn.
          setTip(tipResolvedRef.current);
        }
      }

      // Shake + flash decay.
      if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 40);
      if (s.flash > 0) s.flash -= dt * 1.8;

      // Particle tick (advance + decay; in-place compaction).
      if (fxRef.current.length > 0) tickFx(fxRef.current, dt);

      // Player input (only when not moving & not dead).
      if (!p.dead && !p.moving) {
        const left  = keys['a'] || keys['arrowleft']  || keys['keya'];
        const right = keys['d'] || keys['arrowright'] || keys['keyd'];
        const up    = keys['w'] || keys['arrowup']    || keys['keyw'];
        const down  = keys['s'] || keys['arrowdown']  || keys['keys'];
        const freeze = keys[' '] || keys['space'] || keys['j'] || keys['keyj'];

        let wantDir = null;
        if (left)       wantDir = 'left';
        else if (right) wantDir = 'right';
        else if (up)    wantDir = 'up';
        else if (down)  wantDir = 'down';

        if (wantDir) {
          p.dir = wantDir;
          const d = dirVec(wantDir);
          const tc = p.col + d[0], tr = p.row + d[1];
          if (isPassable(s.level, tc, tr)) {
            p.moving = true;
            p.moveT = 0;
            p.fromCol = p.col; p.fromRow = p.row;
            p.col = tc; p.row = tr;
            sfx.frostStep();
          }
        }

        // Freeze / melt.
        if (p.freezeCd > 0) p.freezeCd -= dt;
        if (freeze && p.freezeCd <= 0) {
          const d = dirVec(p.dir);
          const tc = p.col + d[0], tr = p.row + d[1];
          const key = `${tc},${tr}`;
          if (!inBounds(tc, tr)) { /* ignore */ }
          else if (isWall(s.level, tc, tr)) { /* can't freeze a wall */ }
          else if (isIce(s.level, tc, tr)) {
            s.level.ice.delete(key);
            p.freezeCd = FREEZE_CD;
            sfx.frostMelt();
            if (!reduced) spawnFx(fxRef.current, 'melt', tc * T + T / 2, tr * T + T / 2);
          } else {
            const occupied =
              s.enemies.some((e) => e.col === tc && e.row === tr)
              || s.level.fruits.some((f) => !f.taken && f.col === tc && f.row === tr)
              || (s.level.exit.col === tc && s.level.exit.row === tr)
              || (p.col === tc && p.row === tr);
            if (!occupied) {
              s.level.ice.add(key);
              p.freezeCd = FREEZE_CD;
              sfx.frostFreeze();
              if (!reduced) spawnFx(fxRef.current, 'freeze', tc * T + T / 2, tr * T + T / 2);
            }
          }
        }
      }

      // Adaptive keycap state — derive from the tile in front of the
      // player. setState only on transitions to avoid per-frame churn.
      {
        let next = null;
        if (!p.dead) {
          const d = dirVec(p.dir);
          const tc = p.col + d[0], tr = p.row + d[1];
          if (inBounds(tc, tr)) {
            if (isIce(s.level, tc, tr)) next = 'melt';
            else if (
              !isWall(s.level, tc, tr)
              && !s.enemies.some((e) => e.col === tc && e.row === tr)
              && !s.level.fruits.some((f) => !f.taken && f.col === tc && f.row === tr)
              && !(s.level.exit.col === tc && s.level.exit.row === tr)
              && !(p.col === tc && p.row === tr)
            ) next = 'freeze';
          }
        }
        if (next !== freezeActionRef.current) {
          freezeActionRef.current = next;
          setFreezeAction(next);
        }
      }

      // Movement urgency — direction-pack a string of adjacent-enemy
      // directions so the bottom-rail caps can flag the danger axis.
      // An enemy mid-step counts at both its from and to tiles.
      {
        let mask = '';
        if (!p.dead) {
          const dirs = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
          for (const [name, dx, dy] of dirs) {
            const tc = p.col + dx, tr = p.row + dy;
            const here = (e) =>
              (e.col === tc && e.row === tr)
              || (e.moving && e.fromCol === tc && e.fromRow === tr);
            if (s.enemies.some(here)) mask += name[0];
          }
        }
        if (mask !== dangerDirsRef.current) {
          dangerDirsRef.current = mask;
          setDangerDirs(mask);
        }
      }

      // Advance player movement.
      if (p.moving) {
        p.moveT += dt / MOVE_TIME;
        if (p.moveT >= 1) { p.moveT = 0; p.moving = false; }
      }

      // Fruit pickup.
      if (!p.dead && !p.moving) {
        const fruit = s.level.fruits.find((f) => !f.taken && f.col === p.col && f.row === p.row);
        if (fruit) {
          fruit.taken = true;
          s.fruitsLeft -= 1;
          setGemsGot((n) => n + 1);
          sfx.frostFruit();
          const fcx = fruit.col * T + T / 2;
          const fcy = fruit.row * T + T / 2;
          if (!reduced) {
            spawnFx(fxRef.current, 'fruit', fcx, fcy);
            if (s.fruitsLeft === 0) {
              spawnFloater(fxRef.current, 'EXIT LIVE', fcx, fcy - 10, '#6cd0f0', { size: 9, life: 1.2 });
            } else {
              spawnFloater(fxRef.current, '+1', fcx, fcy - 10, '#ffd1de');
            }
          }
          if (s.fruitsLeft === 0) {
            const t = 'All clear — head for the flag.';
            tipResolvedRef.current = t;
            setTip(t);
          }
        }
      }

      // Exit check.
      if (!p.dead && !p.moving && s.fruitsLeft === 0
          && p.col === s.level.exit.col && p.row === s.level.exit.row) {
        if (levelIdx + 1 >= LEVELS.length) {
          setStatus('won');
          sfx.win();
          // Best-time persistence — track per-run total time + deaths.
          const finalTime = Math.round(s.elapsed);
          const prev = readBest();
          const beats = !prev || finalTime < prev.time
            || (finalTime === prev.time && deaths < prev.deaths);
          if (beats) {
            const next = { time: finalTime, deaths };
            writeBest(next);
            setBest(next);
            setBestBeaten(true);
          }
          if (!submittedRef.current) {
            submittedRef.current = true;
            // Base scales with room count so longer runs aren't penalised
            // by the elapsed-time term hitting the 0 floor.
            const base = LEVELS.length * 500;
            const score = Math.max(0, Math.round(base - deaths * 50 - s.elapsed * 3));
            submitScore('badicecream', score, { deaths, time: finalTime, levels: LEVELS.length });
          }
        } else {
          setShowClear(true);
          sfx.frostClear();
          setTimeout(() => setShowClear(false), 700);
          setLevelIdx((i) => i + 1);
          return;
        }
      }

      // Enemies.
      s.enemies.forEach((e) => {
        if (e.moving) {
          e.moveT += dt / (MOVE_TIME * 1.25);
          if (e.moveT >= 1) { e.moveT = 0; e.moving = false; }
          return;
        }
        e.nextDecide -= dt;
        if (e.nextDecide > 0) return;
        e.nextDecide = ENEMY_INTERVAL[e.kind];

        const tryMove = (dx, dy) => {
          const tc = e.col + dx, tr = e.row + dy;
          if (!inBounds(tc, tr)) return false;
          if (isWall(s.level, tc, tr)) return false;
          if (isIce(s.level, tc, tr)) return false;
          if (s.enemies.some((o) => o !== e && o.col === tc && o.row === tr)) return false;
          e.fromCol = e.col; e.fromRow = e.row;
          e.col = tc; e.row = tr;
          e.moving = true; e.moveT = 0;
          return true;
        };
        const dx = Math.sign(s.player.col - e.col);
        const dy = Math.sign(s.player.row - e.row);
        const primaryAxis = Math.abs(s.player.col - e.col) >= Math.abs(s.player.row - e.row) ? 'x' : 'y';
        const order = primaryAxis === 'x'
          ? [[dx, 0], [0, dy], [-dx, 0], [0, -dy]]
          : [[0, dy], [dx, 0], [0, -dy], [-dx, 0]];
        let moved = false;
        for (const [mx, my] of order) {
          if (mx === 0 && my === 0) continue;
          if (tryMove(mx, my)) { moved = true; break; }
        }
        if (!moved) {
          const choices = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - 0.5);
          for (const [mx, my] of choices) if (tryMove(mx, my)) break;
        }
      });

      // Collision: enemy on same (or moving-through same) tile as player => death.
      if (!p.dead) {
        for (const e of s.enemies) {
          if (enemyTouchesPlayer(e, p)) {
            p.dead = true;
            p.respawn = RESPAWN_DELAY;
            s.shake = reduced ? 0 : 12;
            s.flash = reduced ? 0 : 0.5;
            setDeaths((d) => d + 1);
            setTip('Touched — respawning.');
            sfx.frostDeath();
            if (!reduced) {
              const dpos = entityPos(p);
              const dcx = dpos.x + T / 2, dcy = dpos.y + T / 2;
              spawnFx(fxRef.current, 'death', dcx, dcy);
              spawnFloater(fxRef.current, 'OUCH', dcx, dcy - 10, '#ff7b96', { size: 10, life: 0.9 });
            }
            break;
          }
        }
      }

      s.elapsed += dt;
      if ((s.elapsed * 2 | 0) !== (s._hud | 0)) {
        s._hud = s.elapsed * 2;
        setTime(Math.round(s.elapsed));
      }

      draw();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx, status, reduced]);

  const restart = useCallback(() => {
    submittedRef.current = false;
    setDeaths(0);
    setTime(0);
    setLevelIdx(0);
    setStatus('playing');
    setBestBeaten(false);
  }, []);

  const onExitToLobby = useCallback(() => {
    // Defer to the shell's Back button (rendered by GameShell) rather than
    // duplicating its onExit plumbing into this component.
    const btn = document.querySelector('.game-shell-floating button[aria-label="Back to lobby"]');
    if (btn instanceof HTMLElement) btn.click();
  }, []);

  const s = stateRef.current;
  const levelName = s?.level?.name ?? LEVELS[levelIdx]?.name ?? '';
  const levelTip  = s?.level?.tip  ?? LEVELS[levelIdx]?.tip  ?? '';
  const exitLive  = (s?.fruitsLeft ?? 1) === 0;

  return (
    <div className="ff-root" data-state={status}>
      <header className="ff-hud">
        <Hud
          levelIdx={levelIdx}
          levelCount={LEVELS.length}
          levelName={levelName}
          gemsGot={gemsGot}
          gemsTotal={gemsTotal}
          deaths={deaths}
          time={time}
          exitLive={exitLive && status === 'playing'}/>
      </header>

      <main className="ff-stage" ref={stageRef}>
        <div className="ff-stage-bg" aria-hidden="true"/>
        <div className="ff-stage-halo" aria-hidden="true"/>
        <div className="ff-snow" aria-hidden="true"/>
        <div className="ff-board-frame" data-clear={showClear ? '1' : '0'}>
          <canvas ref={canvasRef} className="ff-board"/>
        </div>

        <LevelIntro
          open={showIntro && status === 'playing'}
          levelIdx={levelIdx}
          levelName={levelName}
          levelTip={levelTip}/>
        <LevelClearChip open={showClear} levelName={levelName}/>
        <WinCard
          open={status === 'won'}
          deaths={deaths}
          time={time}
          best={best}
          bestBeaten={bestBeaten}
          levelCount={LEVELS.length}
          coverUrl={coverUrl}
          onPlayAgain={restart}
          onExit={onExitToLobby}/>
      </main>

      <footer className="ff-rail">
        <BottomRail
          tip={tip}
          status={status}
          isTouch={isTouch}
          freezeAction={freezeAction}
          dangerDirs={dangerDirs}
          onPlayAgain={restart}/>
      </footer>
    </div>
  );
}

/* ── helpers ───────────────────────────────────────────────── */

function dirVec(dir) {
  switch (dir) {
    case 'left':  return [-1, 0];
    case 'right': return [1, 0];
    case 'up':    return [0, -1];
    case 'down':  return [0, 1];
    default:      return [0, 1];
  }
}

function entityPos(e) {
  if (!e.moving) return { x: e.col * T, y: e.row * T };
  const t = e.moveT;
  const x = (e.fromCol + (e.col - e.fromCol) * t) * T;
  const y = (e.fromRow + (e.row - e.fromRow) * t) * T;
  return { x, y };
}

function enemyTouchesPlayer(e, p) {
  if (e.col === p.col && e.row === p.row) return true;
  if (e.moving && e.fromCol === p.col && e.fromRow === p.row) return true;
  if (p.moving && p.fromCol === e.col && p.fromRow === e.row) return true;
  return false;
}
