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
import { sfx, frostMusic } from '../sound.js';
import Hud from './frost-fight/ui/Hud.jsx';
import BottomRail from './frost-fight/ui/BottomRail.jsx';
import { LevelIntro, LevelClearChip, WinCard } from './frost-fight/ui/Overlay.jsx';
import { useIsMobile } from '../input/useVirtualControls.jsx';
import { spawnFx, tickFx, drawFx, spawnFloater } from './frost-fight/fx.js';
// Sprite atlas — Vite resolves these to bundled URLs honoring base
// path. Loaded as Image() once on mount; the loop falls back to
// procedural drawing if any sprite hasn't decoded yet. Direct WebP
// because canvas `drawImage` doesn't reliably rasterise SVGs that
// embed raster data (Chrome / Firefox both render blank under that
// configuration when used via Image() → drawImage). WebP keeps the
// transparency, stays small, and renders correctly.
import playerSpriteUrl     from './frost-fight/sprites/player.png?url';
import player2SpriteUrl    from './frost-fight/sprites/player-2.png?url';
import strawberrySpriteUrl from './frost-fight/sprites/strawberry.png?url';
import blueberrySpriteUrl  from './frost-fight/sprites/blueberry.png?url';
import fruitSpriteUrl      from './frost-fight/sprites/fruit.png?url';
import peachSpriteUrl      from './frost-fight/sprites/peach.png?url';
import iceSpriteUrl        from './frost-fight/sprites/ice.png?url';
import exitSpriteUrl       from './frost-fight/sprites/exit.png?url';
import strawberryWindupUrl from './frost-fight/sprites/strawberry-windup.png?url';
import blueberryWindupUrl  from './frost-fight/sprites/blueberry-windup.png?url';
import orangeSpriteUrl     from './frost-fight/sprites/orange.png?url';
// Orange's source windup pose came out pumpkin-like (gritted-teeth
// face) and reads as a different character mid-animation. Drop it
// and fall back to the resting orange for the alert pose so the
// orange enemy stays consistent. Re-enable when better art ships.
// import orangeWindupUrl     from './frost-fight/sprites/orange-windup.png?url';
import cherrySpriteUrl     from './frost-fight/sprites/cherry.png?url';
import cherryWindupUrl     from './frost-fight/sprites/cherry-windup.png?url';
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
// Maps room name → expected texture filename stem (no hyphens — matches
// the user's drop convention).
const ROOM_WALL_KEY = {
  'Pantry':       'pantry',
  'Cold Room':    'coldroom',
  'The Aisle':    'aisle',
  'Walk-In':      'walkin',
  'Loading Dock': 'loadingdock',
  'Sub-Basement': 'subbasement',
};

const BEST_LS_KEY = 'pgplay-ff-best';
const ROOM_BESTS_LS_KEY = 'pgplay-ff-rooms';
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
// Per-room bests: { [roomName]: { time, deaths } }. Times are integer
// seconds for the room itself (not cumulative). Used as a quiet
// pace-marker shown under the Room chip name.
function readRoomBests() {
  try {
    const raw = localStorage.getItem(ROOM_BESTS_LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}
function writeRoomBests(next) {
  try { localStorage.setItem(ROOM_BESTS_LS_KEY, JSON.stringify(next)); }
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
  'Cold Storage':{ floorTop: '#b6cee2', floorBot: '#5078a0', halo: 'rgba(120, 180, 230, 0.18)',  frame: 'rgba(120, 180, 230, 0.18)' },
  'Conveyor Maze':{ floorTop: '#c0d0e0', floorBot: '#5e7494', halo: 'rgba(150, 180, 210, 0.16)',  frame: 'rgba(150, 180, 210, 0.18)' },
  'The Vault':  { floorTop: '#9aaabe', floorBot: '#3a4e6e', halo: 'rgba(110, 150, 200, 0.18)',  frame: 'rgba(110, 150, 200, 0.20)' },
  'Frostbite':  { floorTop: '#d6e8f0', floorBot: '#5288b0', halo: 'rgba(108, 208, 240, 0.22)',  frame: 'rgba(108, 208, 240, 0.24)' },
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
    tip: 'Open floor, no walls to hide behind. Cherry is fast — plug a corridor early.',
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
      '#.s..............c...#',
      '#....................#',
      '#.....f.........f...X#',
      '######################',
    ],
  },
  {
    name: 'Sub-Basement',
    tip: 'Three chasers. An orange watches your moves — read its tells.',
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
  {
    name: 'Cold Storage',
    tip: 'Cherries can blow ice now. Mind the new wall they build for you.',
    grid: [
      '######################',
      '#p...f.....P.....f...#',
      '#.####..####..####...#',
      '#....................#',
      '#....c..s....c.......#',
      '#....######.######...#',
      '#......I.....I.......#',
      '#....######.######...#',
      '#.f................f.#',
      '#....................#',
      '#.####..####..####...#',
      '#.f...P............X.#',
      '######################',
    ],
  },
  {
    name: 'Conveyor Maze',
    tip: 'Long corridors, ice-casting oranges. Cut a path before they wall you off.',
    grid: [
      '######################',
      '#p.f....f....f....f..#',
      '#.####.####..####....#',
      '#....................#',
      '#....o....b....o.....#',
      '#....######....##....#',
      '#......f....f........#',
      '#....##....######....#',
      '#....................#',
      '#.f.............P....#',
      '#.####.####..####....#',
      '#.f.................X#',
      '######################',
    ],
  },
  {
    name: 'The Vault',
    tip: 'Two ice-casters and two chasers. The maze is your friend; use it.',
    grid: [
      '######################',
      '#p..####...P...####..#',
      '#.f..#.f.......#..f..#',
      '#....#####.######....#',
      '#.....c....b.........#',
      '#.######....######...#',
      '#.f.......I........f.#',
      '#.######....######...#',
      '#.....b....o.........#',
      '#....#####.######....#',
      '#.f.f...........f.f..#',
      '#....f.............X.#',
      '######################',
    ],
  },
  {
    name: 'Frostbite',
    tip: 'Final room. Six chasers, two of them ice-casters. Two peaches in the chaos.',
    grid: [
      '######################',
      '#p..f...c.......f....#',
      '#.####..####..####...#',
      '#......o........b....#',
      '#....................#',
      '#....######.######...#',
      '#......I..f..I.......#',
      '#....######.######...#',
      '#......P.......b.....#',
      '#.f..c......o....f...#',
      '#.####..####..####...#',
      '#.f.....P..........X.#',
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
      else if (ch === 'f') fruits.push({ col: c, row: r, kind: 'strawberry' });
      else if (ch === 'P') fruits.push({ col: c, row: r, kind: 'peach' });
      else if (ch === 's') enemies.push({ col: c, row: r, kind: 'strawberry' });
      else if (ch === 'b') enemies.push({ col: c, row: r, kind: 'blueberry' });
      else if (ch === 'o') enemies.push({ col: c, row: r, kind: 'orange' });
      else if (ch === 'c') enemies.push({ col: c, row: r, kind: 'cherry' });
    }
  }
  return { walls, wallSet, ice, fruits, enemies, spawn, exit, tip: LEVELS[idx].tip, name: LEVELS[idx].name };
}

const isWall     = (level, c, r) => level.wallSet.has(`${c},${r}`);
const isIce      = (level, c, r) => level.ice.has(`${c},${r}`);
const inBounds   = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS;
const isPassable = (level, c, r) => inBounds(c, r) && !isWall(level, c, r) && !isIce(level, c, r);

// Per-kind step interval (seconds between move decisions). Orange sits
// between strawberry and blueberry; cherry is the fastest of the four.
// Same AI for every kind — only the cadence differs.
const ENEMY_INTERVAL = {
  strawberry: 1.0,
  blueberry:  0.7,
  orange:     0.85,
  cherry:     0.6,
};

// Per-kind ice-cast probability per decision tick. Cherry and orange
// occasionally fire a single-tile ice block in front of them toward
// the player. Strawberry and blueberry never cast ice. The cooldown
// (`iceCd`) prevents an enemy from spamming casts.
const ENEMY_ICE_CHANCE = {
  strawberry: 0,
  blueberry:  0,
  orange:     0.20,   // moderate threat
  cherry:     0.28,   // slightly more aggressive
};
const ENEMY_ICE_CD = 2.4;   // seconds between casts per enemy

export default function FrostFightGame({ mode = 'solo' }) {
  // Co-op (`mode === 'coop'`) adds a second player driven by the
  // arrow keys + Enter. P1 stays on WASD + Space. The two players
  // share the room — fruit / death / exit are joint.
  const coop = mode === 'coop';
  const canvasRef = useRef(null);
  const stageRef  = useRef(null);
  const stateRef  = useRef(null);
  const viewRef = useRef({ cssW: W, cssH: H, scale: 1, offX: 0, offY: 0 });
  const submittedRef = useRef(false);
  // Cumulative trap counter for the whole run. Lives outside `stateRef`
  // because `loadLevel` replaces stateRef wholesale on every transition,
  // which would zero a per-state counter every time the player advanced
  // a room — and the 'frost-trap' achievement reads this at win-time.
  const runTrapCountRef = useRef(0);
  // Same pattern for peaches — survives the per-state reset on level
  // transition. Surfaced via submitScore meta + the WinCard.
  const runPeachesRef = useRef(0);
  const tipResolvedRef = useRef('');
  // Preloaded sprite atlas. Each entry stays null until the Image
  // decodes; the draw loop falls back to procedural shapes meanwhile.
  const spritesRef = useRef({
    player: null, player2: null,
    strawberry: null, blueberry: null, orange: null, cherry: null,
    strawberryWind: null, blueberryWind: null, orangeWind: null, cherryWind: null,
    fruit: null, peach: null, ice: null, exit: null,
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
  // Per-room bests — surfaced under the Room chip and updated when a
  // room's clear time / deaths improve.
  const [roomBests, setRoomBests] = useState(() => readRoomBests());

  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || isMobile);

  const loadLevel = (idx) => {
    const level = parseLevel(idx);
    // Co-op P2 spawn — first passable orthogonal neighbour of P1 spawn
    // that isn't a fruit / enemy / exit. Falls back to one tile right.
    const p2Spawn = (() => {
      if (!coop) return null;
      const sp = level.spawn;
      const candidates = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      for (const [dx, dy] of candidates) {
        const c = sp.col + dx, r = sp.row + dy;
        if (!inBounds(c, r)) continue;
        if (isWall(level, c, r)) continue;
        if (level.ice.has(`${c},${r}`)) continue;
        if (level.enemies.some((e) => e.col === c && e.row === r)) continue;
        if (level.fruits.some((f) => f.col === c && f.row === r)) continue;
        if (level.exit.col === c && level.exit.row === r) continue;
        return { col: c, row: r };
      }
      return { col: sp.col + 1, row: sp.row };
    })();
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
      player2: p2Spawn ? {
        col: p2Spawn.col, row: p2Spawn.row,
        moving: false, moveT: 0,
        fromCol: p2Spawn.col, fromRow: p2Spawn.row,
        dir: 'down',
        freezeCd: 0,
        dead: false, respawn: 0,
      } : null,
      // Captured spawn locations for the shared-respawn flow.
      p2Spawn,
      enemies: level.enemies.map((e) => ({
        col: e.col, row: e.row, kind: e.kind,
        moving: false, moveT: 0, fromCol: e.col, fromRow: e.row,
        nextDecide: Math.random() * 0.4 + 0.2,
        boxed: false,
        pairBurst: false,
        // Cherry / orange may cast ice. Stagger the first allowed cast
        // so enemies don't all blow simultaneously when the room loads.
        iceCd: (ENEMY_ICE_CHANCE[e.kind] ?? 0) > 0 ? Math.random() * 1.5 + 1.0 : 0,
      })),
      fruitsLeft: level.fruits.length,
      elapsed: 0,
      shake: 0,
      flash: 0,
      // Set on death; gates the death-detect block so we don't fire
      // setDeaths / sfx / spawnFx multiple times during the death anim
      // before the room restarts.
      dying: false,
      // Per-tile reveal timestamps for the animated cast wave. Sim
      // adds ice immediately; this map staggers the visual unveil.
      castReveal: new Map(),
      // Per-tile vanish timestamps for the animated melt sweep. Sim
      // removes ice immediately; this map fades out the ice in the
      // same staggered cadence as freeze places it.
      castVanish: new Map(),
      // Snapshots taken on level mount — used to compute the per-room
      // clear time + deaths when this room is finished. We start each
      // room timer from zero (`elapsed` is reset above) and capture
      // the deaths counter at room start so per-room death cost is
      // delta-only.
      roomStartElapsed: 0,
      roomStartDeaths: deaths,
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
  // on entry so each transition has a tonal cue, and starts (or re-keys)
  // the ambient bed for this room.
  useEffect(() => {
    if (!showIntro) return;
    sfx.frostIntro(levelIdx);
    frostMusic.start(levelIdx);
    const t = setTimeout(() => setShowIntro(false), reduced ? 600 : 1100);
    return () => clearTimeout(t);
  }, [showIntro, reduced, levelIdx]);

  // Stop the ambient bed when the route unmounts. Won state also stops
  // the bed (the WinCard speaks for itself).
  useEffect(() => {
    return () => frostMusic.stop();
  }, []);
  useEffect(() => {
    if (status === 'won') frostMusic.stop();
  }, [status]);

  // Sprite preload — fire once per mount, drop into spritesRef as each
  // image decodes. Errors are swallowed; the loop already falls back to
  // procedural shapes if a slot is null or hasn't completed.
  useEffect(() => {
    const sources = {
      player: playerSpriteUrl,
      player2: player2SpriteUrl,
      strawberry: strawberrySpriteUrl,
      blueberry: blueberrySpriteUrl,
      orange: orangeSpriteUrl,
      cherry: cherrySpriteUrl,
      strawberryWind: strawberryWindupUrl,
      blueberryWind: blueberryWindupUrl,
      // Orange shares its rest sprite with its alert state — see import note.
      orangeWind: orangeSpriteUrl,
      cherryWind: cherryWindupUrl,
      fruit: fruitSpriteUrl,
      peach: peachSpriteUrl,
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
        // R reloads JUST this room. We intercept in capture phase and
        // stop propagation so GameShell's "full game restart" handler
        // (which would unmount the component and reset to level 0)
        // doesn't also fire. Death-counter increment per restart use.
        e.stopImmediatePropagation();
        e.preventDefault();
        setDeaths((d) => d + 1);
        loadLevel(levelIdx);
      }
    };
    const ku = (e) => { keys[e.key.toLowerCase()] = false; keys[e.code] = false; };
    // Capture phase so we run BEFORE GameShell's window listener.
    // stopImmediatePropagation in our handler keeps the shell out of it.
    window.addEventListener('keydown', kd, { capture: true });
    window.addEventListener('keyup', ku);

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const { level, player, enemies, shake, flash } = s;
      const player2 = s.player2 ?? null;
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

      // Ice blocks. `castReveal` carries a per-tile reveal timestamp
      // for tiles placed by an animated cast — they fade in over
      // ~180 ms after their stagger delay so the cast wave reads
      // visually. Tiles without an entry render at full alpha.
      const iceImg = spritesRef.current.ice;
      const iceReady = iceImg && iceImg.complete && iceImg.naturalWidth > 0;
      const FADE_MS = 180;
      const nowMs = performance.now();
      level.ice.forEach((key) => {
        const [c, r] = key.split(',').map(Number);
        const x = c * T, y = r * T;
        let alpha = 1;
        if (s.castReveal && s.castReveal.size > 0) {
          const reveal = s.castReveal.get(key);
          if (reveal !== undefined) {
            const elapsed = nowMs - reveal;
            if (elapsed < 0) return;            // not yet visible
            if (elapsed < FADE_MS) alpha = elapsed / FADE_MS;
            else s.castReveal.delete(key);     // settled — drop entry
          }
        }
        if (alpha < 1) ctx.globalAlpha = alpha;
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
        if (alpha < 1) ctx.globalAlpha = 1;
      });

      // Vanishing-ghost ice — tiles the player just melted. Sim has
      // already removed them from `level.ice` (passable from frame 0),
      // but `castVanish` carries the wave-fade-out timestamps so the
      // visual matches the freeze-cast stagger. Ghosts auto-clean once
      // their 180 ms fade is done.
      if (s.castVanish && s.castVanish.size > 0) {
        for (const [key, vanishTs] of s.castVanish) {
          const elapsed = nowMs - vanishTs;
          if (elapsed >= FADE_MS) { s.castVanish.delete(key); continue; }
          const ghostAlpha = elapsed < 0 ? 1 : (1 - elapsed / FADE_MS);
          if (ghostAlpha <= 0) continue;
          const [c, r] = key.split(',').map(Number);
          const x = c * T, y = r * T;
          ctx.globalAlpha = ghostAlpha;
          if (iceReady) {
            ctx.drawImage(iceImg, x + 1, y + 1, T - 2, T - 2);
          } else {
            ctx.fillStyle = '#d9ecf5';
            ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
            ctx.strokeStyle = '#7ac0e0';
            ctx.lineWidth = 2 * px;
            ctx.strokeRect(x + 2, y + 2, T - 4, T - 4);
          }
          ctx.globalAlpha = 1;
        }
      }

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

      // Fruits — strawberries by default; peaches in later levels
      // (parser maps 'P' grid char to kind:'peach'). Each fruit kind
      // picks its own sprite slot.
      const fruitImg = spritesRef.current.fruit;
      const peachImg = spritesRef.current.peach;
      const fruitReady = fruitImg && fruitImg.complete && fruitImg.naturalWidth > 0;
      const peachReady = peachImg && peachImg.complete && peachImg.naturalWidth > 0;
      level.fruits.forEach((f) => {
        if (f.taken) return;
        const fx = f.col * T + T / 2;
        const fy = f.row * T + T / 2 + Math.sin(performance.now() / 350 + f.col) * 1.5;
        const isPeach = f.kind === 'peach';
        const img = isPeach ? peachImg : fruitImg;
        const ready = isPeach ? peachReady : fruitReady;
        if (ready) {
          // Peach is rendered slightly larger so the score-bonus reads
          // visually — players notice the bigger pickup.
          const sz = isPeach ? 30 : 26;
          ctx.drawImage(img, fx - sz / 2, fy - sz / 2, sz, sz);
        } else {
          // Procedural fallback colours per kind.
          ctx.fillStyle = isPeach ? '#ffb38a' : '#ff4d6d';
          ctx.beginPath();
          ctx.arc(fx, fy + 2, isPeach ? 9 : 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2d7a2a';
          ctx.beginPath();
          ctx.moveTo(fx - 4, fy - 6);
          ctx.lineTo(fx + 4, fy - 6);
          ctx.lineTo(fx, fy - 2);
          ctx.closePath();
          ctx.fill();
          if (!isPeach) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillRect(fx - 3, fy, 1, 1);
            ctx.fillRect(fx + 2, fy + 2, 1, 1);
            ctx.fillRect(fx, fy - 1, 1, 1);
          }
        }
      });

      // Enemies.
      const sprites = spritesRef.current;
      const ready = (img) => img && img.complete && img.naturalWidth > 0;
      // Map kind → resting + windup sprites, fallback to blueberry for
      // any unexpected kind so the rest of the draw stays well-defined.
      const KIND = {
        strawberry: [sprites.strawberry, sprites.strawberryWind],
        blueberry:  [sprites.blueberry,  sprites.blueberryWind],
        orange:     [sprites.orange,     sprites.orangeWind],
        cherry:     [sprites.cherry,     sprites.cherryWind],
      };
      // Wind-up pre-tell: ~220ms before an enemy commits to a step it
      // switches to a wider-eyed "alert" pose. The alt sprite doubles
      // as the in-step "walking" frame so the sequence reads rest →
      // alert (windup lead) → walk (mid-step) → rest.
      const WINDUP_LEAD = 0.22;
      enemies.forEach((e) => {
        const { x, y } = entityPos(e);
        const ecx = x + T / 2, ecy = y + T / 2;
        const isWinding =
          (!e.moving && e.nextDecide > 0 && e.nextDecide < WINDUP_LEAD)
          || e.moving;
        const [baseSprite, windSprite] = KIND[e.kind] ?? KIND.blueberry;
        const sprite = (isWinding && ready(windSprite)) ? windSprite : baseSprite;
        const isReady = ready(sprite);
        if (isReady) {
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
          } else if (e.kind === 'cherry') {
            ctx.fillStyle = '#9a1a2a';
            ctx.beginPath();
            ctx.arc(ecx - 4, ecy + 3, 8, 0, Math.PI * 2);
            ctx.arc(ecx + 4, ecy + 3, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2d7a2a';
            ctx.fillRect(ecx - 1, ecy - 10, 2, 6);
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

      // Player rendering — shared helper. Draws the sprite if loaded
      // (with a step-bob), otherwise falls back to procedural shapes
      // matching the player's accent colour. Dead state shows a small
      // splash ellipse.
      const drawPlayer = (pp, spriteSlot, scoopColor) => {
        if (!pp) return;
        if (pp.dead) {
          const { x, y } = entityPos(pp);
          ctx.fillStyle = 'rgba(255, 77, 109, 0.55)';
          ctx.beginPath();
          ctx.ellipse(x + T / 2, y + T / 2 + 6, 13, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        const { x, y } = entityPos(pp);
        const pcx = x + T / 2, pcy = y + T / 2;
        const img = spritesRef.current[spriteSlot];
        const ready = img && img.complete && img.naturalWidth > 0;
        if (ready) {
          const sz = 32;
          const bob = pp.moving ? Math.sin(pp.moveT * Math.PI) * -1.2 : 0;
          ctx.drawImage(img, pcx - sz / 2, pcy - sz / 2 + bob, sz, sz);
        } else {
          // Procedural fallback. Cone matches stock palette; scoop uses
          // the per-player accent so P2 reads as the cyan-mint scoop.
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
          ctx.fillStyle = scoopColor;
          ctx.beginPath();
          ctx.arc(pcx, pcy - 4, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0a0d0e';
          ctx.lineWidth = 1.5 * px;
          ctx.stroke();
          const dc = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[pp.dir] || [0, 1];
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
      };
      drawPlayer(player,  'player',  '#ff8ec6'); // P1 — pink scoop
      drawPlayer(player2, 'player2', '#7af5dc'); // P2 — cyan-mint scoop

      // Particles — drawn in board coordinates, on top of entities.
      drawFx(fxRef.current, ctx);

      // Cast preview cursor — symmetric. Drawn for both alive players,
      // each tinted to its own scoop colour so co-op players can tell
      // their cursor apart.
      const drawCastPreview = (pp, freezeRgb) => {
        if (!pp || pp.moving || pp.dead) return;
        const d = dirVec(pp.dir);
        const sc = pp.col + d[0], sr = pp.row + d[1];
        if (!inBounds(sc, sr) || isWall(level, sc, sr)) return;
        ctx.lineWidth = 2 * px;
        ctx.setLineDash([4, 3]);
        let c = sc, r = sr, idx = 0;
        if (isIce(level, sc, sr)) {
          while (inBounds(c, r) && isIce(level, c, r)) {
            const fade = Math.max(0.18, 0.85 - idx * 0.10);
            ctx.strokeStyle = `rgba(255, 120, 150, ${fade.toFixed(3)})`;
            ctx.strokeRect(c * T + 3, r * T + 3, T - 6, T - 6);
            c += d[0]; r += d[1];
            idx++;
          }
        } else {
          while (inBounds(c, r) && !isWall(level, c, r) && !isIce(level, c, r)) {
            const occupied =
              enemies.some((e) => e.col === c && e.row === r)
              || level.fruits.some((f) => !f.taken && f.col === c && f.row === r)
              || (level.exit.col === c && level.exit.row === r)
              || (pp.col === c && pp.row === r)
              || (player2 && pp !== player2 && !player2.dead && player2.col === c && player2.row === r)
              || (player  && pp !== player  && !player.dead  && player.col  === c && player.row  === r);
            if (occupied) break;
            const fade = Math.max(0.18, 0.85 - idx * 0.10);
            ctx.strokeStyle = `rgba(${freezeRgb}, ${fade.toFixed(3)})`;
            ctx.strokeRect(c * T + 3, r * T + 3, T - 6, T - 6);
            c += d[0]; r += d[1];
            idx++;
          }
        }
        ctx.setLineDash([]);
      };
      drawCastPreview(player,  '80, 180, 230');   // P1 cyan
      drawCastPreview(player2, '120, 240, 200');  // P2 mint

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
      const p2 = s.player2 ?? null;

      // Shake + flash decay.
      if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 40);
      if (s.flash > 0) s.flash -= dt * 1.8;

      // Particle tick (advance + decay; in-place compaction).
      if (fxRef.current.length > 0) tickFx(fxRef.current, dt);

      // Per-player tick — runs the same respawn / input / cast / move /
      // fruit pipeline for either player. Closes over `dt`, `s`, the
      // keys map, and the FX / sound helpers from the enclosing scope.
      // `kbag` is a pre-resolved {left,right,up,down,freeze} bag so the
      // input split can map WASD to P1 and arrows to P2 cleanly.
      const tickPlayer = (player, kbag, isP1) => {
        if (!player) return;
        // Respawn.
        if (player.dead) {
          player.respawn -= dt;
          if (player.respawn <= 0) {
            const sp = isP1 ? s.level.spawn : s.p2Spawn;
            player.col = sp.col; player.row = sp.row;
            player.fromCol = sp.col; player.fromRow = sp.row;
            player.moving = false; player.moveT = 0;
            player.dead = false;
            player.dir = 'down';
            player.freezeCd = 0;
            if (isP1) setTip(tipResolvedRef.current);
          }
          return;
        }
        const otherPlayer = isP1 ? p2 : p;
        const otherBlocks = (tc, tr) => {
          if (!otherPlayer || otherPlayer.dead) return false;
          if (otherPlayer.col === tc && otherPlayer.row === tr) return true;
          if (otherPlayer.moving && otherPlayer.fromCol === tc && otherPlayer.fromRow === tr) return true;
          return false;
        };
        // Input + step + cast (idle frame).
        if (!player.moving) {
          let wantDir = null;
          if (kbag.left)       wantDir = 'left';
          else if (kbag.right) wantDir = 'right';
          else if (kbag.up)    wantDir = 'up';
          else if (kbag.down)  wantDir = 'down';
          if (wantDir) {
            player.dir = wantDir;
            const dv = dirVec(wantDir);
            const tc = player.col + dv[0], tr = player.row + dv[1];
            if (isPassable(s.level, tc, tr) && !otherBlocks(tc, tr)) {
              player.moving = true;
              player.moveT = 0;
              player.fromCol = player.col; player.fromRow = player.row;
              player.col = tc; player.row = tr;
              sfx.frostStep();
            }
          }
          if (player.freezeCd > 0) player.freezeCd -= dt;
          if (kbag.freeze && player.freezeCd <= 0) {
            const dv = dirVec(player.dir);
            const sc = player.col + dv[0], sr = player.row + dv[1];
            if (!inBounds(sc, sr)) { /* edge */ }
            else if (isWall(s.level, sc, sr)) { /* wall */ }
            else if (isIce(s.level, sc, sr)) {
              // Melt sweep — mirror of freeze. Sim removes every ice
              // tile in the row immediately (collisions are correct
              // from frame 0); the visual fade-out is staggered via
              // `castVanish` so the wave rolls forward at the same
              // ~55 ms-per-tile cadence as the freeze cast.
              let cleared = 0;
              let c = sc, r = sr;
              const meltStartTs = performance.now();
              const CAST_STAGGER = reduced ? 0 : 55;
              const PARTICLE_LEAD = 30;
              while (inBounds(c, r) && isIce(s.level, c, r)) {
                const key = `${c},${r}`;
                s.level.ice.delete(key);
                s.castVanish.set(key, meltStartTs + cleared * CAST_STAGGER);
                if (!reduced) {
                  const cx = c * T + T / 2, cy = r * T + T / 2;
                  const delay = Math.max(0, cleared * CAST_STAGGER - PARTICLE_LEAD);
                  if (delay === 0) spawnFx(fxRef.current, 'melt', cx, cy);
                  else setTimeout(() => spawnFx(fxRef.current, 'melt', cx, cy), delay);
                }
                cleared++;
                c += dv[0]; r += dv[1];
              }
              if (cleared > 0) {
                sfx.frostMelt();
                player.freezeCd = FREEZE_CD;
              }
            } else {
              // Freeze sweep with staggered visual reveal.
              let placed = 0;
              let c = sc, r = sr;
              const castStartTs = performance.now();
              const CAST_STAGGER = reduced ? 0 : 55;
              const PARTICLE_LEAD = 30;
              while (inBounds(c, r) && !isWall(s.level, c, r) && !isIce(s.level, c, r)) {
                const occupied =
                  s.enemies.some((e) => e.col === c && e.row === r)
                  || s.level.fruits.some((f) => !f.taken && f.col === c && f.row === r)
                  || (s.level.exit.col === c && s.level.exit.row === r)
                  || (player.col === c && player.row === r)
                  || (otherPlayer && !otherPlayer.dead && otherPlayer.col === c && otherPlayer.row === r);
                if (occupied) break;
                const key = `${c},${r}`;
                s.level.ice.add(key);
                s.castReveal.set(key, castStartTs + placed * CAST_STAGGER);
                if (!reduced) {
                  const cx = c * T + T / 2;
                  const cy = r * T + T / 2;
                  const delay = Math.max(0, placed * CAST_STAGGER - PARTICLE_LEAD);
                  if (delay === 0) spawnFx(fxRef.current, 'freeze', cx, cy);
                  else setTimeout(() => spawnFx(fxRef.current, 'freeze', cx, cy), delay);
                }
                placed++;
                c += dv[0]; r += dv[1];
              }
              if (placed > 0) {
                sfx.frostFreeze();
                player.freezeCd = FREEZE_CD;
              }
            }
          }
        }
        // Advance step animation.
        if (player.moving) {
          player.moveT += dt / MOVE_TIME;
          if (player.moveT >= 1) { player.moveT = 0; player.moving = false; }
        }
        // Fruit pickup — settled tile only.
        if (!player.moving) {
          const fruit = s.level.fruits.find((f) => !f.taken && f.col === player.col && f.row === player.row);
          if (fruit) {
            fruit.taken = true;
            s.fruitsLeft -= 1;
            setGemsGot((n) => n + 1);
            sfx.frostFruit();
            // Peach is worth 2 score "weight" units; strawberry is 1.
            // Tracked in s.score; surfaces via submitScore meta.
            const isPeach = fruit.kind === 'peach';
            if (isPeach) runPeachesRef.current += 1;
            const fcx = fruit.col * T + T / 2;
            const fcy = fruit.row * T + T / 2;
            if (!reduced) {
              spawnFx(fxRef.current, 'fruit', fcx, fcy);
              if (s.fruitsLeft === 0) {
                spawnFloater(fxRef.current, 'EXIT LIVE', fcx, fcy - 10, '#6cd0f0', { size: 9, life: 1.2 });
              } else if (isPeach) {
                spawnFloater(fxRef.current, '+2', fcx, fcy - 10, '#ffd1be', { size: 11 });
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
      };

      // Solo: P1 accepts WASD + arrows. Co-op: P1 is WASD + Space, P2
      // is arrows + Enter (no key overlap so simultaneous input works).
      const p1Bag = coop ? {
        left:   keys['a'] || keys['keya'],
        right:  keys['d'] || keys['keyd'],
        up:     keys['w'] || keys['keyw'],
        down:   keys['s'] || keys['keys'],
        freeze: keys[' '] || keys['space'] || keys['j'] || keys['keyj'],
      } : {
        left:   keys['a'] || keys['arrowleft']  || keys['keya'],
        right:  keys['d'] || keys['arrowright'] || keys['keyd'],
        up:     keys['w'] || keys['arrowup']    || keys['keyw'],
        down:   keys['s'] || keys['arrowdown']  || keys['keys'],
        freeze: keys[' '] || keys['space'] || keys['j'] || keys['keyj'],
      };
      tickPlayer(p, p1Bag, true);
      if (coop && p2) {
        const p2Bag = {
          left:   keys['arrowleft'],
          right:  keys['arrowright'],
          up:     keys['arrowup'],
          down:   keys['arrowdown'],
          freeze: keys['enter'],
        };
        tickPlayer(p2, p2Bag, false);
      }

      // Adaptive keycap state — only tracks P1; the bottom-rail rail
      // is P1-centric. P2 plays without an adaptive cap (and that's
      // fine — co-op is a desktop scenario where the second player can
      // see the cursor preview on the canvas itself).
      {
        let next = null;
        if (!p.dead) {
          const dv = dirVec(p.dir);
          const tc = p.col + dv[0], tr = p.row + dv[1];
          if (inBounds(tc, tr)) {
            if (isIce(s.level, tc, tr)) next = 'melt';
            else if (
              !isWall(s.level, tc, tr)
              && !s.enemies.some((e) => e.col === tc && e.row === tr)
              && !s.level.fruits.some((f) => !f.taken && f.col === tc && f.row === tr)
              && !(s.level.exit.col === tc && s.level.exit.row === tr)
              && !(p.col === tc && p.row === tr)
              && !(p2 && !p2.dead && p2.col === tc && p2.row === tr)
            ) next = 'freeze';
          }
        }
        if (next !== freezeActionRef.current) {
          freezeActionRef.current = next;
          setFreezeAction(next);
        }
      }

      // Movement urgency — danger directions for P1 (the rail's
      // primary). P2 sees the cursor preview directly on the board.
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

      // Exit check. In coop, EITHER alive player on the exit tile
      // (with the other player also alive) triggers the room. The
      // "anyOnExit" combined with "bothAlive" rule keeps it satisfying
      // without forcing both players onto the same tile.
      const anyOnExit = (() => {
        if (!p.dead && !p.moving && p.col === s.level.exit.col && p.row === s.level.exit.row) return true;
        if (p2 && !p2.dead && !p2.moving && p2.col === s.level.exit.col && p2.row === s.level.exit.row) return true;
        return false;
      })();
      const bothAlive = !p.dead && (!p2 || !p2.dead);
      if (bothAlive && anyOnExit && s.fruitsLeft === 0) {
        // Per-room best — captured before either branch since both
        // paths complete the current room. Time is rounded seconds for
        // THIS room only; deaths is the delta from room start.
        const roomTime = Math.max(0, Math.round(s.elapsed - s.roomStartElapsed));
        const roomDeaths = Math.max(0, deaths - s.roomStartDeaths);
        const roomName = s.level.name;
        const prevRoomBest = roomBests[roomName];
        const beatsRoom = !prevRoomBest
          || roomTime < prevRoomBest.time
          || (roomTime === prevRoomBest.time && roomDeaths < prevRoomBest.deaths);
        if (beatsRoom) {
          const nextMap = { ...roomBests, [roomName]: { time: roomTime, deaths: roomDeaths } };
          writeRoomBests(nextMap);
          setRoomBests(nextMap);
        }

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
            // by the elapsed-time term hitting the 0 floor. Trap count
            // surfaces in meta so the achievement bus can pick it up.
            // Score: room-count base, minus death cost, minus elapsed
            // time, plus a bonus for each peach eaten across the run.
            const base = LEVELS.length * 500;
            const peachBonus = runPeachesRef.current * 80;
            const score = Math.max(
              0,
              Math.round(base + peachBonus - deaths * 50 - s.elapsed * 3),
            );
            submitScore('badicecream', score, {
              deaths, time: finalTime, levels: LEVELS.length,
              trapped: runTrapCountRef.current,
              peaches: runPeachesRef.current,
            });
          }
        } else {
          setShowClear(true);
          sfx.frostClear();
          setTimeout(() => setShowClear(false), 700);
          setLevelIdx((i) => i + 1);
          return;
        }
      }

      // Enemies. Each kind has its own decision shaping on top of the
      // shared "step toward player" baseline:
      //   strawberry — pure chase
      //   blueberry  — chaotic; ~25 % of decisions ignore the player
      //                and pick a random direction (mimics the stock
      //                BIC blueberry's flighty pacing)
      //   orange     — tangent-evade; when adjacent (Manhattan 1) it
      //                prefers a perpendicular axis so it sidesteps
      //                instead of bumping into the freeze cursor
      //   cherry     — pair-step burst; after a normal move it queues
      //                a quick second move (0.18 s) before resetting
      //                to its base interval
      s.enemies.forEach((e) => {
        if (e.moving) {
          e.moveT += dt / (MOVE_TIME * 1.25);
          if (e.moveT >= 1) { e.moveT = 0; e.moving = false; }
          return;
        }
        e.nextDecide -= dt;
        if (e.iceCd > 0) e.iceCd -= dt;
        if (e.nextDecide > 0) return;

        // Ice-cast attempt — cherry / orange occasionally fire a single
        // ice block in the direction of the nearest player. Acts as a
        // turn-skip: the enemy spends this decision on a cast instead of
        // a step. Cooldown prevents back-to-back casts. The cast tile
        // must be empty (passable, not occupied by player/fruit/exit).
        const iceChance = ENEMY_ICE_CHANCE[e.kind] || 0;
        if (iceChance > 0 && e.iceCd <= 0 && Math.random() < iceChance) {
          // Pick the direction toward the nearest player.
          const targetForCast = (() => {
            if (!p2 || p2.dead) return p;
            if (p.dead) return p2;
            const d1 = Math.abs(p.col  - e.col) + Math.abs(p.row  - e.row);
            const d2 = Math.abs(p2.col - e.col) + Math.abs(p2.row - e.row);
            return d1 <= d2 ? p : p2;
          })();
          // Direction: pick the dominant axis toward the target.
          const ddx = Math.sign(targetForCast.col - e.col);
          const ddy = Math.sign(targetForCast.row - e.row);
          const ax = Math.abs(targetForCast.col - e.col);
          const ay = Math.abs(targetForCast.row - e.row);
          const dir = ax >= ay ? [ddx, 0] : [0, ddy];
          if (dir[0] !== 0 || dir[1] !== 0) {
            const tc = e.col + dir[0], tr = e.row + dir[1];
            const free = inBounds(tc, tr)
              && !isWall(s.level, tc, tr)
              && !isIce(s.level, tc, tr)
              && !s.enemies.some((o) => o !== e && o.col === tc && o.row === tr)
              && !s.level.fruits.some((f) => !f.taken && f.col === tc && f.row === tr)
              && !(s.level.exit.col === tc && s.level.exit.row === tr)
              && !(p && !p.dead && p.col === tc && p.row === tr)
              && !(p2 && !p2.dead && p2.col === tc && p2.row === tr);
            if (free) {
              const key = `${tc},${tr}`;
              s.level.ice.add(key);
              s.castReveal.set(key, performance.now());
              if (!reduced) spawnFx(fxRef.current, 'freeze', tc * T + T / 2, tr * T + T / 2);
              sfx.frostFreeze();
              e.iceCd = ENEMY_ICE_CD;
              // Skip the move this decision tick.
              e.nextDecide = ENEMY_INTERVAL[e.kind];
              return;
            }
          }
        }

        // Cherry pair-step: after the first step in a pair, schedule a
        // quick second; on the second, reset to full interval.
        if (e.kind === 'cherry' && !e.pairBurst) {
          e.pairBurst = true;
          e.nextDecide = 0.18;
        } else {
          e.pairBurst = false;
          e.nextDecide = ENEMY_INTERVAL[e.kind];
        }

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
        // Chase target — closest alive player. In solo this is always
        // P1; in coop, distance ties resolve to P1 so the priority
        // stays deterministic.
        const target = (() => {
          if (!p2 || p2.dead) return p;
          if (p.dead) return p2;
          const d1 = Math.abs(p.col  - e.col) + Math.abs(p.row  - e.row);
          const d2 = Math.abs(p2.col - e.col) + Math.abs(p2.row - e.row);
          return d1 <= d2 ? p : p2;
        })();
        const dx = Math.sign(target.col - e.col);
        const dy = Math.sign(target.row - e.row);
        const adx = Math.abs(target.col - e.col);
        const ady = Math.abs(target.row - e.row);
        const adjacent = adx + ady === 1;
        let primaryAxis = adx >= ady ? 'x' : 'y';

        // Blueberry: 25 % of the time, flip the priority so it picks a
        // direction that's not the obvious chase. Fast and chaotic.
        if (e.kind === 'blueberry' && Math.random() < 0.25) {
          primaryAxis = primaryAxis === 'x' ? 'y' : 'x';
        }
        // Orange: when adjacent to the player, prefer the perpendicular
        // axis so it sidesteps. Falls back to the chase axis if the
        // perpendicular is blocked (handled by the order list below).
        if (e.kind === 'orange' && adjacent) {
          primaryAxis = primaryAxis === 'x' ? 'y' : 'x';
        }
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

      // Trap detection — runs once per frame after the AI pass.
      // Fires the FROZEN celebration on the rising edge (`!boxed →
      // boxed`); resets the flag if the seal breaks (player melted an
      // ice tile). Plays the freeze cue, drops a cyan particle burst
      // and a FROZEN floater. Awarded as the `frost-trap` achievement.
      for (const e of s.enemies) {
        if (e.moving) continue;
        const trapped = enemyIsBoxed(s.level, e, s.enemies);
        if (trapped && !e.boxed) {
          e.boxed = true;
          const ecx = e.col * T + T / 2;
          const ecy = e.row * T + T / 2;
          if (!reduced) {
            spawnFx(fxRef.current, 'freeze', ecx, ecy);
            spawnFloater(fxRef.current, 'FROZEN', ecx, ecy - 12, '#6cd0f0',
                         { size: 11, life: 1.2 });
          }
          sfx.frostFreeze();
          // Per-run trap counter; surfaced via the win-payload meta so
          // the achievement bus can unlock 'frost-trap'. Tracked outside
          // `s` because loadLevel replaces s on every level transition.
          runTrapCountRef.current += 1;
        } else if (!trapped && e.boxed) {
          e.boxed = false;
        }
      }

      // Collision: any alive player touched by an enemy → BOTH players
      // die together (BIC same-team forgiveness rule). Keeps co-op
      // forgiving so a single mistake doesn't punish only one player.
      const touchedPlayer = (() => {
        if (s.dying) return null;          // already triggered this room
        if (!p.dead) {
          for (const e of s.enemies) if (enemyTouchesPlayer(e, p)) return p;
        }
        if (p2 && !p2.dead) {
          for (const e of s.enemies) if (enemyTouchesPlayer(e, p2)) return p2;
        }
        return null;
      })();
      if (touchedPlayer) {
        // Death now triggers a full ROOM restart, not just a player
        // respawn. This kills the spawn-loop bug — if an enemy was
        // sitting on the spawn tile when the player respawned, the
        // player would die instantly. Reloading the room resets enemy
        // positions and ice state too.
        s.dying = true;
        // Mark both players dead with an effectively-infinite respawn
        // so the existing tickPlayer code path doesn't teleport anyone
        // back before the level reload.
        if (!p.dead) { p.dead = true; p.respawn = 999; }
        if (p2 && !p2.dead) { p2.dead = true; p2.respawn = 999; }
        s.shake = reduced ? 0 : 12;
        s.flash = reduced ? 0 : 0.5;
        setDeaths((d) => d + 1);
        setTip('Touched — restarting room.');
        sfx.frostDeath();
        frostMusic.duck(1.1);
        if (!reduced) {
          const dpos = entityPos(touchedPlayer);
          const dcx = dpos.x + T / 2, dcy = dpos.y + T / 2;
          spawnFx(fxRef.current, 'death', dcx, dcy);
          spawnFloater(fxRef.current, 'OUCH', dcx, dcy - 10, '#ff7b96', { size: 10, life: 0.9 });
        }
        // Schedule the actual room reload after the death animation /
        // shake / flash settle. Guard against double-fire if the
        // component unmounts in the meantime.
        const dyingState = s;
        setTimeout(() => {
          if (stateRef.current === dyingState) loadLevel(levelIdx);
        }, 950);
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
      window.removeEventListener('keydown', kd, { capture: true });
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx, status, reduced]);

  const restart = useCallback(() => {
    submittedRef.current = false;
    runTrapCountRef.current = 0;
    runPeachesRef.current = 0;
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
          roomBest={roomBests[levelName]}
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
          peaches={runPeachesRef.current}
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
          coop={coop}
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

// Boxed-in detection. An enemy is "trapped" when all four orthogonal
// neighbours are non-passable AND at least one of those neighbours is
// an ice block — i.e. the player's freezes contributed to the seal,
// not just walls. Used to fire a one-shot FROZEN celebration per trap.
function enemyIsBoxed(level, e, allEnemies) {
  let blocked = 0;
  let iceAdjacent = false;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dy] of dirs) {
    const tc = e.col + dx, tr = e.row + dy;
    if (!inBounds(tc, tr)) { blocked++; continue; }
    const wall = isWall(level, tc, tr);
    const ice  = isIce(level, tc, tr);
    const occ  = allEnemies.some((o) => o !== e && o.col === tc && o.row === tr);
    if (wall || ice || occ) blocked++;
    if (ice) iceAdjacent = true;
  }
  return blocked === 4 && iceAdjacent;
}
