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
import { LevelIntro, LevelClearChip, WinCard, GameOverCard } from './frost-fight/ui/Overlay.jsx';
import { markRoomCleared, markRoomReached, markRunCleared } from './frost-fight/utils/progress.js';
import { useIsMobile } from '../input/useVirtualControls.jsx';
import { spawnFx, tickFx, drawFx, spawnFloater, spawnRing } from './frost-fight/fx.js';
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
// Phase 22 — orange-windup re-enabled with the clean angry pose
// extracted from sheet 6 (cc#12). Replaces the old gritted-teeth
// pumpkin-like source and reads consistently with the rest sprite.
import orangeWindupUrl     from './frost-fight/sprites/orange-windup.png?url';
import cherrySpriteUrl     from './frost-fight/sprites/cherry.png?url';
import cherryWindupUrl     from './frost-fight/sprites/cherry-windup.png?url';
// Themed-era bots from sheet 1 (Phase 17). Each has a rest sprite; some
// also have a dedicated angry-pose wind-up frame extracted from sheets
// 3 and 7 (Phase 22). Bots without a wind-up still reuse the rest pose.
import bananaBotUrl        from './frost-fight/sprites/banana-bot.png?url';
import grapeBotUrl         from './frost-fight/sprites/grape-bot.png?url';
import grapeWindupUrl      from './frost-fight/sprites/grape-windup.png?url';
import plumBotUrl          from './frost-fight/sprites/plum-bot.png?url';
import eggplantBotUrl      from './frost-fight/sprites/eggplant-bot.png?url';
import melonBotUrl         from './frost-fight/sprites/melon-bot.png?url';
import cherrybombBotUrl    from './frost-fight/sprites/cherrybomb-bot.png?url';
// Reserved kiwi-windup — sheet 3 cc#3. The kiwi character isn't yet
// wired as an enemy class (only as a fruit pickup). Imported so the
// asset is bundled and ready to slot in once kiwi-bot ships.
import kiwiWindupUrl       from './frost-fight/sprites/kiwi-windup.png?url';
// Themed fruit pickups (sheet 1). All count as 1 toward room clear; the
// kind change is purely visual variety per era.
import appleFruitUrl       from './frost-fight/sprites/apple-fruit.png?url';
import lemonFruitUrl       from './frost-fight/sprites/lemon-fruit.png?url';
import kiwiFruitUrl        from './frost-fight/sprites/kiwi-fruit.png?url';
import cherryFruitUrl      from './frost-fight/sprites/cherry-fruit.png?url';
import coverUrl            from './frost-fight/sprites/cover.webp?url';
// Phase 22 — animation atlases for the new themed era. Each char
// ships ~25 frames (state poses + walk/attack-charge/attack-release/
// death cycles). loadAtlas pre-decodes off the main thread; getFrame
// returns the right frame given an action + frame index. Falls back
// to the existing single-sprite path silently if the atlas isn't
// loaded yet.
import { loadAtlas, getFrame, tickAnim, setAnimAction, ATLAS_CHARS }
  from './frost-fight/atlas.js';

// Map enemy kind → atlas char key. Kinds not listed here use the
// existing single-sprite path (blueberry, plum, eggplant, melon,
// banana, cherrybomb, cherry).
const ATLAS_KEY_FOR_KIND = {
  orange:     'orange',
  strawberry: 'strawberry',
  grape:      'grape',
  kiwi:       'kiwi',
  pineapple:  'pineapple',
  lemon:      'lemon',
  peach:      'peach',
};

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
  // Era 3 — Crystal Cavern (kiwi + cherry pickups; no kiwi/cherry bots)
  'Crystal Cave':   { floorTop: '#a8e0c8', floorBot: '#3a8870', halo: 'rgba(120, 220, 180, 0.18)', frame: 'rgba(120, 220, 180, 0.20)' },
  'Crystal Tunnel': { floorTop: '#9ed4be', floorBot: '#357c66', halo: 'rgba(120, 220, 180, 0.18)', frame: 'rgba(120, 220, 180, 0.20)' },
  'Geode Hall':     { floorTop: '#bce4d2', floorBot: '#3e9078', halo: 'rgba(140, 220, 200, 0.20)', frame: 'rgba(140, 220, 200, 0.22)' },
  // Era 4 — Citrus Yard (lemon + apple pickups; no lemon/apple bots — only veggies)
  'Citrus Yard':    { floorTop: '#fae8b0', floorBot: '#a87830', halo: 'rgba(240, 200, 110, 0.18)', frame: 'rgba(240, 200, 110, 0.20)' },
  'Lemon Grove':    { floorTop: '#fce5a0', floorBot: '#b58030', halo: 'rgba(240, 200, 110, 0.18)', frame: 'rgba(240, 200, 110, 0.20)' },
  'Sour Press':     { floorTop: '#f0d890', floorBot: '#9a6c28', halo: 'rgba(240, 180, 100, 0.20)', frame: 'rgba(240, 180, 100, 0.22)' },
  // Era 5 — Vineyard (apple + cherryFruit pickups; deep purple palette)
  'Vineyard':       { floorTop: '#d0a8d8', floorBot: '#684078', halo: 'rgba(180, 140, 220, 0.18)', frame: 'rgba(180, 140, 220, 0.20)' },
  'Cellar':         { floorTop: '#bc98c8', floorBot: '#5a3868', halo: 'rgba(180, 140, 220, 0.18)', frame: 'rgba(180, 140, 220, 0.20)' },
  'Crusher':        { floorTop: '#a888b8', floorBot: '#4a2e58', halo: 'rgba(200, 150, 230, 0.20)', frame: 'rgba(200, 150, 230, 0.22)' },
  // Era 6 — Final Storm (cherry + kiwi + lemon mix; cold steel palette)
  'Frost Gate':     { floorTop: '#bcc8d8', floorBot: '#48587a', halo: 'rgba(140, 170, 220, 0.20)', frame: 'rgba(140, 170, 220, 0.22)' },
  'Storm Hall':     { floorTop: '#a4b4c8', floorBot: '#384a6a', halo: 'rgba(120, 160, 220, 0.22)', frame: 'rgba(120, 160, 220, 0.24)' },
  'Final Vortex':   { floorTop: '#dceaf2', floorBot: '#3a78b8', halo: 'rgba(108, 208, 240, 0.26)', frame: 'rgba(108, 208, 240, 0.28)' },
  // Phase 19 — Cold 16-20 (deep blue → night-storm gradient)
  'Slipstream':     { floorTop: '#cce4ec', floorBot: '#3a6488', halo: 'rgba(108, 208, 240, 0.26)', frame: 'rgba(108, 208, 240, 0.28)' },
  'Ice Wall':       { floorTop: '#bcd4dc', floorBot: '#2c5474', halo: 'rgba(108, 208, 240, 0.30)', frame: 'rgba(108, 208, 240, 0.32)' },
  'Press':          { floorTop: '#aac4d4', floorBot: '#244464', halo: 'rgba(108, 208, 240, 0.32)', frame: 'rgba(108, 208, 240, 0.34)' },
  'Apex':           { floorTop: '#9cb8c8', floorBot: '#1c3858', halo: 'rgba(108, 208, 240, 0.34)', frame: 'rgba(108, 208, 240, 0.36)' },
  'Frostpeak':      { floorTop: '#90b0c4', floorBot: '#142c48', halo: 'rgba(108, 208, 240, 0.40)', frame: 'rgba(108, 208, 240, 0.44)' },
  // Phase 19 — Orchard 16-20 (deep teal → vortex purple gradient)
  'Plum Tide':      { floorTop: '#c4d8e0', floorBot: '#3a5a78', halo: 'rgba(168, 240, 216, 0.26)', frame: 'rgba(168, 240, 216, 0.28)' },
  'Eggplant Court': { floorTop: '#b8a4c0', floorBot: '#503060', halo: 'rgba(180, 140, 220, 0.26)', frame: 'rgba(180, 140, 220, 0.28)' },
  'Grape Net':      { floorTop: '#a890b8', floorBot: '#3a2050', halo: 'rgba(190, 140, 230, 0.30)', frame: 'rgba(190, 140, 230, 0.32)' },
  'Bomb Foundry':   { floorTop: '#c8a4a8', floorBot: '#582834', halo: 'rgba(255, 138, 163, 0.30)', frame: 'rgba(255, 138, 163, 0.32)' },
  'Annihilation':   { floorTop: '#d4c0c8', floorBot: '#3a1a30', halo: 'rgba(255, 138, 163, 0.36)', frame: 'rgba(255, 138, 163, 0.40)' },
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
    tip: 'Open floor, two cherries, two blueberries. Plug a corridor or sprint through.',
    grid: [
      '######################',
      '#p...f........f...f..#',
      '#....................#',
      '#..####........####..#',
      '#.b....c.........b...#',
      '#....................#',
      '#......##....##......#',
      '#....................#',
      '#..####........####..#',
      '#.s....o.........c...#',
      '#....................#',
      '#.....f.........f...X#',
      '######################',
    ],
  },
  {
    name: 'Sub-Basement',
    tip: 'Five chasers in narrow corridors. Two oranges, an extra cherry — read every windup.',
    grid: [
      '######################',
      '#p..#......f.....#...#',
      '#...#.####....####...#',
      '#.f.#.#.c....#.....#.#',
      '#...#.#..s...#..f..#.#',
      '#...#.#######........#',
      '#......o...I.....b...#',
      '#........#######.....#',
      '#.#..f...#.....#..f..#',
      '#.#......#######....c#',
      '#.#.####.o..####.....#',
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
    tip: 'Long corridors, three ice-casting oranges + two cherries. Cut a path before they wall you in.',
    grid: [
      '######################',
      '#p.f....f....f....f..#',
      '#.####.####..####....#',
      '#......c.............#',
      '#....o....b....o.....#',
      '#....######....##....#',
      '#......f....f....c...#',
      '#....##....######....#',
      '#....................#',
      '#.f.....o.......P....#',
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
  {
    name: 'Frostlock',
    tip: 'Cold 11 — three chasers + an ice-caster. Pre-cut traps make every cast a commitment.',
    grid: [
      '######################',
      '#p..f....I......f....#',
      '#.####.####.####.....#',
      '#....b....c.....o....#',
      '#.f................f.#',
      '#....######.######...#',
      '#......I.....I.......#',
      '#....######.######...#',
      '#.f....s....f.....f..#',
      '#....................#',
      '#.####.####.####.....#',
      '#.f...........P....X.#',
      '######################',
    ],
  },
  {
    name: 'Slush Maze',
    tip: 'Cold 12 — diagonal pillars, narrow lanes. Read the cherry windups before you step.',
    grid: [
      '######################',
      '#p..#......f....#....#',
      '#...####..####..####.#',
      '#.f...........P......#',
      '#.####..####.####....#',
      '#......c....b........#',
      '#.####.####.####...f.#',
      '#......o....f........#',
      '#.####..####.####....#',
      '#......b.......c.....#',
      '#.####..####..####...#',
      '#.f.................X#',
      '######################',
    ],
  },
  {
    name: 'Ice Run',
    tip: 'Cold 13 — open arena, four chasers in a line. Plug a corridor or sprint the gap.',
    grid: [
      '######################',
      '#p..f....f....f....f.#',
      '#....................#',
      '#.b...c....o....s....#',
      '#....................#',
      '#.####.####.####.....#',
      '#......I....I........#',
      '#.####.####.####.....#',
      '#....................#',
      '#.c.....o....s.....f.#',
      '#....................#',
      '#.f....f....f.....f.X#',
      '######################',
    ],
  },
  {
    name: 'Frostfall',
    tip: 'Cold 14 — six bots, double ice trap. Save the peach for the very last sprint.',
    grid: [
      '######################',
      '#p...f....f....f.....#',
      '#.####.####.####.....#',
      '#....c....b....o.....#',
      '#.f.................f#',
      '#..####..####..####..#',
      '#....s.I.....I.b.....#',
      '#..####..####..####..#',
      '#.f...c....o.......f.#',
      '#....................#',
      '#.####.####.####.....#',
      '#.f...P............X.#',
      '######################',
    ],
  },
  {
    name: 'Glacier',
    tip: 'Cold 15 — peak Cold. Eight bots, two peaches. Treat every freeze as your last.',
    grid: [
      '######################',
      '#p..f.......P......f.#',
      '#.####.####.####.....#',
      '#.....c.s....b.s.....#',
      '#.f................f.#',
      '#.####.####.####.....#',
      '#....I.......I.......#',
      '#.####.####.####.....#',
      '#.....o.s....o.s.....#',
      '#.f................f.#',
      '#.####.####.####.....#',
      '#.f...........P....X.#',
      '######################',
    ],
  },
  {
    name: 'Slipstream',
    tip: 'Cold 16 — five bots over open floor. Bananas slip, cherries pair-step. No safe lane.',
    grid: [
      '######################',
      '#p..f..b...c....f....#',
      '#.####.####.####.....#',
      '#.....c....s....b....#',
      '#.f................f.#',
      '#..#..####..####..#..#',
      '#.....I..f...I.......#',
      '#..#..####..####..#..#',
      '#....s....c.....s....#',
      '#.f................f.#',
      '#.####.####.####.....#',
      '#.f...P.b........f..X#',
      '######################',
    ],
  },
  {
    name: 'Ice Wall',
    tip: 'Cold 17 — pre-laid ice everywhere. Two melts in a row or you\'re sealed.',
    grid: [
      '######################',
      '#p...I....f....I.....#',
      '#.####.####.####.....#',
      '#....c.s....b.s.s....#',
      '#.I................I.#',
      '#.####.######.####...#',
      '#......I..f..I.......#',
      '#.####.######.####...#',
      '#....c.s....b.s.s....#',
      '#.I................I.#',
      '#.####.####.####.....#',
      '#.f...P............X.#',
      '######################',
    ],
  },
  {
    name: 'Press',
    tip: 'Cold 18 — three orange row-casters above and below. Read the tells or get walled in.',
    grid: [
      '######################',
      '#p...o....o....o....f#',
      '#.####.####.####.....#',
      '#....b....b....b.....#',
      '#.f.................f#',
      '#..####..####..####..#',
      '#......I.....I.......#',
      '#..####..####..####..#',
      '#.f.................f#',
      '#....b....c....b.....#',
      '#.####.####.####.....#',
      '#.f...o....o....P...X#',
      '######################',
    ],
  },
  {
    name: 'Apex',
    tip: 'Cold 19 — six bots, every Cold kind in play. Save the peach for the last sprint.',
    grid: [
      '######################',
      '#p..f.c....s....b....#',
      '#.####.####.####.....#',
      '#......o....c........#',
      '#.f.................f#',
      '#..####..####..####..#',
      '#.....s.I.....I.b....#',
      '#..####..####..####..#',
      '#.f.................f#',
      '#......c....o........#',
      '#.####.####.####.....#',
      '#.f...P..s....b....X.#',
      '######################',
    ],
  },
  {
    name: 'Frostpeak',
    tip: 'Cold 20 — boss room. Twelve bots. Two peaches at the gate. No corridor is safe.',
    grid: [
      '######################',
      '#p.f.c..b..s..o..c.f.#',
      '#.####.####.####.....#',
      '#.....s....b....s....#',
      '#.f................f.#',
      '#.######.######.####.#',
      '#......I.....I.......#',
      '#.######.######.####.#',
      '#.....s....c....b....#',
      '#.f................f.#',
      '#.####.####.####.....#',
      '#.f...P..o..b..o...P.X',
      '######################',
    ],
  },
  {
    name: 'Crystal Cave',
    tip: 'Crystal Cavern era. Kiwi pickups glow cyan; blueberries chase, plums freeze rows.',
    grid: [
      '######################',
      '#p..K................#',
      '#.####..####..####...#',
      '#....b...........U...#',
      '#............K.......#',
      '#....#....b....#.....#',
      '#....######.####.....#',
      '#........K...........#',
      '#.####..####..####...#',
      '#......K....U........#',
      '#............K.....X.#',
      '#....................#',
      '######################',
    ],
  },
  {
    name: 'Crystal Tunnel',
    tip: 'Tighter corridors. Plums cast a long row of ice — keep an exit lane open.',
    grid: [
      '######################',
      '#.p..............K...#',
      '#.####..####..####...#',
      '#....................#',
      '#...K...b.......K....#',
      '#....####..####......#',
      '#....#........#...K..#',
      '#....#...U....#......#',
      '#....####..####......#',
      '#...K......b.........#',
      '#.####..####..####...#',
      '#.K.K...............X#',
      '######################',
    ],
  },
  {
    name: 'Geode Hall',
    tip: 'Open arena. Two blueberries plus a plum — round the chasers, dodge the freeze.',
    grid: [
      '######################',
      '#p........K..........#',
      '#.####..####..####...#',
      '#........b...........#',
      '#........#...........#',
      '#....K...#....K......#',
      '#........######......#',
      '#...U................#',
      '#....#......#.....b..#',
      '#....#......#........#',
      '#....#..K...#....K...#',
      '#...K...............X#',
      '######################',
    ],
  },
  {
    name: 'Citrus Yard',
    tip: 'Citrus Yard era. Lemon + apple drops; eggplants chase, grapes freeze, cherrybombs explode.',
    grid: [
      '######################',
      '#p..L.....I......A...#',
      '#.####..####..####...#',
      '#....................#',
      '#.L..#....V....#.....#',
      '#....#.........#.A...#',
      '#....######.####.....#',
      '#........L...........#',
      '#.####..####..####...#',
      '#......G.............#',
      '#............A.....X.#',
      '#....I...........I...#',
      '######################',
    ],
  },
  {
    name: 'Lemon Grove',
    tip: 'Loading-dock layout, citrus theme. Cherrybombs cast ice fast — clear them first.',
    grid: [
      '######################',
      '#p...L........A...L..#',
      '#....................#',
      '#..####........####..#',
      '#.V..............G...#',
      '#....................#',
      '#......##....##......#',
      '#....................#',
      '#..####........####..#',
      '#.Y..............V...#',
      '#....................#',
      '#.....L.........A...X#',
      '######################',
    ],
  },
  {
    name: 'Sour Press',
    tip: 'Max citrus pressure. Eggplant chases, grape and cherrybomb both cast ice rows.',
    grid: [
      '######################',
      '#p..#......L.....#...#',
      '#...#.####....####...#',
      '#.A.#.#......#.....#.#',
      '#...#.#..V...#..L..#.#',
      '#...#.#######........#',
      '#......G...I.....Y...#',
      '#........#######.....#',
      '#.#..A...#.....#..L..#',
      '#.#......#######.....#',
      '#.#.####....####.....#',
      '#.A.................X#',
      '######################',
    ],
  },
  {
    name: 'Vineyard',
    tip: 'Vineyard era. Apple and cherry pickups; melons stomp, grapes and plums freeze.',
    grid: [
      '######################',
      '#p...A.....P.....A...#',
      '#.####..####..####...#',
      '#....................#',
      '#....M..G....M.......#',
      '#....######.######...#',
      '#......I.....I.......#',
      '#....######.######...#',
      '#.A................Q.#',
      '#....................#',
      '#.####..####..####...#',
      '#.A...P............X.#',
      '######################',
    ],
  },
  {
    name: 'Cellar',
    tip: 'Long corridors, two melons stalking. Use the apples to plug the gap mid-row.',
    grid: [
      '######################',
      '#p.A....A....Q....A..#',
      '#.####.####..####....#',
      '#....................#',
      '#....M....G....M.....#',
      '#....######....##....#',
      '#......A....Q........#',
      '#....##....######....#',
      '#....................#',
      '#.A.............U....#',
      '#.####.####..####....#',
      '#.A.................X#',
      '######################',
    ],
  },
  {
    name: 'Crusher',
    tip: 'Vault remix. Two melons + grape + plum. Cherry pickups buy you a free freeze.',
    grid: [
      '######################',
      '#p..####...P...####..#',
      '#.A..#.A.......#..Q..#',
      '#....#####.######....#',
      '#.....M....G.........#',
      '#.######....######...#',
      '#.A.......I........Q.#',
      '#.######....######...#',
      '#.....G....M.........#',
      '#....#####.######....#',
      '#.A.A...........Q.A..#',
      '#....A.............X.#',
      '######################',
    ],
  },
  {
    name: 'Frost Gate',
    tip: 'Final Storm era. Cherrybombs explode, grape and melon stalk. One peach hides the line home.',
    grid: [
      '######################',
      '#p..L...Y.......K....#',
      '#.####..####..####...#',
      '#......G........M....#',
      '#....................#',
      '#....######.######...#',
      '#......I..K..I.......#',
      '#....######.######...#',
      '#......P.......U.....#',
      '#.L..G......M....Q...#',
      '#.####..####..####...#',
      '#.L.....P..........X.#',
      '######################',
    ],
  },
  {
    name: 'Storm Hall',
    tip: 'Two melons, two plums, a cherrybomb, a grape. Read the windups — every freeze is a row.',
    grid: [
      '######################',
      '#p..K...........L....#',
      '#.####..####..####...#',
      '#......Y........G....#',
      '#....M..U....M.......#',
      '#....######.######...#',
      '#......I..Q..I.......#',
      '#....######.######...#',
      '#......L.......U.....#',
      '#.K..G......M....K...#',
      '#.####..####..####...#',
      '#.K.....L..........X.#',
      '######################',
    ],
  },
  {
    name: 'Final Vortex',
    tip: 'Last room. Melon, grape, plum, cherrybomb — three fruit kinds. Don\'t panic; freeze and pivot.',
    grid: [
      '######################',
      '#p..#......L.....#...#',
      '#...#.####....####...#',
      '#.K.#.#......#.....#.#',
      '#...#.#..M...#..L..#.#',
      '#...#.#######........#',
      '#......G...I.....U...#',
      '#........#######.....#',
      '#.#..K...#.....#..Q..#',
      '#.#......#######.....#',
      '#.#.####....####.....#',
      '#.K.................X#',
      '######################',
    ],
  },
  {
    name: 'Bare Vault',
    tip: 'Orchard 13 — no fruit pickups. Only peaches. You finish on row casts and footwork alone.',
    grid: [
      '######################',
      '#p...........P.......#',
      '#.####.####.####.....#',
      '#....G..M....U..G....#',
      '#....................#',
      '#....######.######...#',
      '#......I.....I.......#',
      '#....######.######...#',
      '#....U..M....G..M....#',
      '#....................#',
      '#.####.####.####.....#',
      '#.............P.....X#',
      '######################',
    ],
  },
  {
    name: 'Teleport Hall',
    tip: 'Orchard 14 — four plums teleport every 8 s. Cherry-fruit grants free freezes; spend them.',
    grid: [
      '######################',
      '#p...Q.....U.....Q...#',
      '#.####.####.####.....#',
      '#....U....M....U.....#',
      '#.Q................Q.#',
      '#....######.######...#',
      '#......I.....I.......#',
      '#....######.######...#',
      '#....U....M....U.....#',
      '#.Q................Q.#',
      '#.####.####.####.....#',
      '#.Q...........P....X.#',
      '######################',
    ],
  },
  {
    name: 'Vortex Crown',
    tip: 'Orchard 15 — every bot kind, every fruit kind. Use the apple boost to break the line.',
    grid: [
      '######################',
      '#p..L....M.......K...#',
      '#.####.####.####.....#',
      '#....G..Y.M.U....M...#',
      '#.L................Q.#',
      '#....######.######...#',
      '#......I..A..I.......#',
      '#....######.######...#',
      '#....U..M.G.Y....G...#',
      '#.K................L.#',
      '#.####.####.####.....#',
      '#.Q...P............X.#',
      '######################',
    ],
  },
  {
    name: 'Plum Tide',
    tip: 'Orchard 16 — five plums teleporting at once. Read the TP tells or get sandwiched.',
    grid: [
      '######################',
      '#p..A....U....U....A.#',
      '#.####.####.####.....#',
      '#....U....M....U.....#',
      '#.A................A.#',
      '#....######.######...#',
      '#......I..K..I.......#',
      '#....######.######...#',
      '#....U....M....U.....#',
      '#.A................A.#',
      '#.####.####.####.....#',
      '#.A...P..U....U....X.#',
      '######################',
    ],
  },
  {
    name: 'Eggplant Court',
    tip: 'Orchard 17 — six eggplants stomp through your ice. Don\'t rely on a wall holding.',
    grid: [
      '######################',
      '#p..L....V....V....L.#',
      '#.####.####.####.....#',
      '#....V....G....V.....#',
      '#.L................L.#',
      '#....######.######...#',
      '#......I..A..I.......#',
      '#....######.######...#',
      '#....V....G....V.....#',
      '#.L................L.#',
      '#.####.####.####.....#',
      '#.L...P..V....V....X.#',
      '######################',
    ],
  },
  {
    name: 'Grape Net',
    tip: 'Orchard 18 — six grapes drop ice trails everywhere. The maze rewrites itself.',
    grid: [
      '######################',
      '#p..A....G....G....A.#',
      '#.####.####.####.....#',
      '#....G....M....G.....#',
      '#.A................Q.#',
      '#....######.######...#',
      '#......I..K..I.......#',
      '#....######.######...#',
      '#....G....M....G.....#',
      '#.A................Q.#',
      '#.####.####.####.....#',
      '#.A...P..G....G....X.#',
      '######################',
    ],
  },
  {
    name: 'Bomb Foundry',
    tip: 'Orchard 19 — six cherrybombs ticking. Watch the fuses; sprint between detonations.',
    grid: [
      '######################',
      '#p..L....Y....Y....A.#',
      '#.####.####.####.....#',
      '#....Y....M....Y.....#',
      '#.L................A.#',
      '#....######.######...#',
      '#......I..K..I.......#',
      '#....######.######...#',
      '#....Y....G....Y.....#',
      '#.L................A.#',
      '#.####.####.####.....#',
      '#.L...P..Y....Y....X.#',
      '######################',
    ],
  },
  {
    name: 'Annihilation',
    tip: 'Orchard 20 — every Orchard bot kind in one room. Twelve bots; every fruit a power-up.',
    grid: [
      '######################',
      '#p..L....Y..G..U....K#',
      '#.####.####.####.....#',
      '#....M....G....M.....#',
      '#.L................Q.#',
      '#..######..######....#',
      '#.....I..A..K..I.....#',
      '#..######..######....#',
      '#....G....M....U.....#',
      '#.K................L.#',
      '#.####.####.####.....#',
      '#.Q...P..Y..M..U..A.X#',
      '######################',
    ],
  },
  // ─── HARVEST theme (Phase 22) ──────────────────────────────────────
  // 6 rooms with the new animated bot roster. Each enemy in this set
  // is atlas-driven (walk + attack-charge + attack-release + death
  // cycles) and the bots' characters were extracted from the user's
  // char1-char7 sheets in scripts/frost-fight-char-atlas.mjs.
  // Grid letters reused: f=strawberry-fruit, P=peach-fruit, A=apple-fruit,
  // L=lemon-fruit, K=kiwi-fruit, Q=cherry-fruit power-up.
  // Bot letters added: k=kiwi-bot, n=pineapple-bot, j=lemon-bot,
  // h=peach-bot. Existing s/o/G also animate when used here.
  {
    name: 'Orchard Path',
    tip: 'Harvest 1 — meet the orchard. A peach paces, a kiwi chases.',
    grid: [
      '######################',
      '#p..f.........f.....h#',
      '#.####.....####......#',
      '#....................#',
      '#..f....k.......f....#',
      '#....................#',
      '#.####.....####......#',
      '#....................#',
      '#..f.........f.......#',
      '#....................#',
      '#.####.....####......#',
      '#......f...........fX#',
      '######################',
    ],
  },
  {
    name: 'Citrus Lane',
    tip: 'Harvest 2 — pineapple and lemon both blow ice. Read the cheek-puff.',
    grid: [
      '######################',
      '#p..A........A.....n.#',
      '#.####.####.####.....#',
      '#....................#',
      '#..A....j......A.....#',
      '#....................#',
      '#.####.####.####.....#',
      '#....................#',
      '#..n........A........#',
      '#....................#',
      '#.####.####.####.....#',
      '#......A........A...X#',
      '######################',
    ],
  },
  {
    name: 'Berry Mix',
    tip: 'Harvest 3 — strawberry and grape rush; kiwi loops the back rows.',
    grid: [
      '######################',
      '#p..f....s....f.....k#',
      '#.####....####.####..#',
      '#....G..............f#',
      '#..f.................#',
      '#.....######.........#',
      '#..f................f#',
      '#.....######.........#',
      '#..f.................#',
      '#....G..............f#',
      '#.####....####.####..#',
      '#......f.....s.....fX#',
      '######################',
    ],
  },
  {
    name: 'Sour Yard',
    tip: 'Harvest 4 — peaches everywhere, lemon casts often, pineapple hits hard.',
    grid: [
      '######################',
      '#p..P.........P....n.#',
      '#.####.####.####.....#',
      '#....h..............P#',
      '#..P.................#',
      '#.....######.........#',
      '#..P................P#',
      '#.....######.........#',
      '#..P.................#',
      '#....j..............P#',
      '#.####.####.####.....#',
      '#......P.....h.....PX#',
      '######################',
    ],
  },
  {
    name: 'Full Bloom',
    tip: 'Harvest 5 — kiwi, pineapple, lemon, grape. Watch four windups at once.',
    grid: [
      '######################',
      '#p..A....k....A.....G#',
      '#.####.####.####.....#',
      '#....n.....j........A#',
      '#..A.................#',
      '#.....######.........#',
      '#..A................A#',
      '#.....######.........#',
      '#..A.................#',
      '#....j.....n........A#',
      '#.####.####.####.....#',
      '#.G....A.....k.....AX#',
      '######################',
    ],
  },
  {
    name: 'Harvest Storm',
    tip: 'Harvest 6 — every animated bot, every fruit. Read the sheet, freeze the row.',
    grid: [
      '######################',
      '#p..f....k....A....nh#',
      '#.####.####.####.####',
      '#....j.....G........K#',
      '#.f.................A#',
      '#.####....####.####..#',
      '#..o................n#',
      '#.####....####.####..#',
      '#.A.................f#',
      '#....G.....j........h#',
      '#.####.####.####.####',
      '#.K....f.....k.....AX#',
      '######################',
    ],
  },
];

// Phase 18 — themed packs. Each theme is a slice of 15 levels into the
// LEVELS array. The lobby's theme pills pick which slice to play; per-
// theme progress (cleared rooms, hardest difficulty) lives under
// pgplay-ff-progress[theme]. Adding a new theme later is a one-entry
// push here + appending the new levels to LEVELS.
export const THEMES = {
  cold:    { id: 'cold',    label: 'Cold Aisle', startIdx: 0,  length: 20,
             tagline: 'The frozen-pantry classic. 20 rooms, easy → boss.' },
  orchard: { id: 'orchard', label: 'Orchard',    startIdx: 20, length: 20,
             tagline: 'Crystal, citrus, and final-storm bots. 20 rooms.' },
  // Phase 22 — animated era. Bots have proper walk + cast cycles
  // (extracted from the user's char1-char7 sheets). Six rooms while
  // the level set grows; theme can extend by appending to LEVELS.
  harvest: { id: 'harvest', label: 'Harvest',    startIdx: 40, length: 6,
             tagline: 'Animated orchard. Six rooms, every bot tells you what it\'s about to do.' },
};
export const THEME_ORDER = ['cold', 'orchard', 'harvest'];
const DEFAULT_THEME = 'cold';
const resolveTheme = (id) => THEMES[id] || THEMES[DEFAULT_THEME];

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
      else if (ch === 'A') fruits.push({ col: c, row: r, kind: 'apple' });
      else if (ch === 'L') fruits.push({ col: c, row: r, kind: 'lemon' });
      else if (ch === 'K') fruits.push({ col: c, row: r, kind: 'kiwi' });
      else if (ch === 'Q') fruits.push({ col: c, row: r, kind: 'cherryFruit' });
      else if (ch === 's') enemies.push({ col: c, row: r, kind: 'strawberry' });
      else if (ch === 'b') enemies.push({ col: c, row: r, kind: 'blueberry' });
      else if (ch === 'o') enemies.push({ col: c, row: r, kind: 'orange' });
      else if (ch === 'c') enemies.push({ col: c, row: r, kind: 'cherry' });
      else if (ch === 'B') enemies.push({ col: c, row: r, kind: 'banana' });
      else if (ch === 'G') enemies.push({ col: c, row: r, kind: 'grape' });
      else if (ch === 'V') enemies.push({ col: c, row: r, kind: 'eggplant' });
      else if (ch === 'M') enemies.push({ col: c, row: r, kind: 'melon' });
      else if (ch === 'U') enemies.push({ col: c, row: r, kind: 'plum' });
      else if (ch === 'Y') enemies.push({ col: c, row: r, kind: 'cherrybomb' });
      // Phase 22 — animated bot kinds for the Harvest theme. Lowercase
      // letters chosen to avoid collision with existing fruit pickups
      // ('K' = kiwi fruit, 'L' = lemon fruit, etc.).
      else if (ch === 'k') enemies.push({ col: c, row: r, kind: 'kiwi' });
      else if (ch === 'n') enemies.push({ col: c, row: r, kind: 'pineapple' });
      else if (ch === 'j') enemies.push({ col: c, row: r, kind: 'lemon' });
      else if (ch === 'h') enemies.push({ col: c, row: r, kind: 'peach' });
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
// Same AI for every kind — only the cadence differs. Themed-era bots
// (banana, grape, eggplant, melon, plum, cherrybomb) plug into the same
// chase pipeline and get their own intervals + ice-cast probabilities.
const ENEMY_INTERVAL = {
  strawberry: 1.0,
  blueberry:  0.7,
  orange:     0.85,
  cherry:     0.6,
  banana:     0.65,    // fast wobbler
  grape:      1.05,    // slow heavy
  eggplant:   1.10,    // slow heavy
  melon:      0.90,
  plum:       0.85,    // ice-caster mid-tempo
  cherrybomb: 0.75,    // fast ice-caster
  // Phase 22 — Harvest theme animated bots.
  kiwi:       0.75,    // mid-fast chaser
  pineapple:  0.95,    // slow heavy ice-caster
  lemon:      0.80,    // sour mid-tempo caster
  peach:      0.70,    // soft chaser
};

// Per-kind ice-cast probability per decision tick. Cherry and orange
// fire a row of ice toward the player (same Othello logic the player
// uses). Strawberry and blueberry never cast. Cooldown prevents spam.
// Halved from the single-tile era since a row cast is much more
// powerful — a single bot cast can wall off a corridor.
const ENEMY_ICE_CHANCE = {
  strawberry: 0,
  blueberry:  0,
  orange:     0.10,
  cherry:     0.14,
  banana:     0,
  grape:      0,
  eggplant:   0,
  melon:      0,
  plum:       0.12,
  cherrybomb: 0.16,
  // Phase 22 — Harvest bots. Kiwi/peach are pure chasers; pineapple +
  // lemon are casters whose attack-release animation makes the cast
  // visually obvious to read.
  kiwi:       0,
  pineapple:  0.13,
  lemon:      0.11,
  peach:      0,
};
const ENEMY_ICE_CD = 3.0;   // seconds between casts per enemy

// Phase 22 — difficulty redesigned. No life-pool maths. Each tier
// changes BOT BEHAVIOR (or, for Easy, the respawn rule) so the
// gameplay challenge rises smoothly without cluttering the HUD with
// life counters. Insane is the only tier that game-overs.
//
//   Easy   : in-place respawn + 3 s invincibility. No game-over.
//   Normal : full level reload on death. Bots normal. No game-over.
//   Hard   : full level reload. Bots cast more (iceMul 1.4).
//   Expert : full level reload. Bots tick faster (intervalMul 0.75)
//            AND cast more (iceMul 1.5).
//   Insane : one-shot. Bots cast brutal + tick fast.
//
// Helper fields (consumed by the loop):
//   respawnInPlace : true → death does NOT loadLevel; just clear dead
//                    flag and grant invincibility for `respawnInvuln`.
//   intervalMul    : multiplied into ENEMY_INTERVAL[kind] (lower = faster).
//   iceMul         : multiplied into ENEMY_ICE_CHANCE[kind].
//   livesFor       : retained as Infinity / 0 so the existing run-over
//                    branch still works for Insane.
export const DIFFICULTIES = {
  easy: {
    id: 'easy', label: 'Easy',
    respawnInPlace: true, respawnInvuln: 3.0,
    intervalMul: 1.05, iceMul: 0.85,
    livesFor: () => Infinity,
    blurb: 'Respawn where you fell.',
  },
  normal: {
    id: 'normal', label: 'Normal',
    respawnInPlace: false, respawnInvuln: 0,
    intervalMul: 1.0, iceMul: 1.0,
    livesFor: () => Infinity,
    blurb: 'Standard rules.',
  },
  hard: {
    id: 'hard', label: 'Hard',
    respawnInPlace: false, respawnInvuln: 0,
    intervalMul: 1.0, iceMul: 1.4,
    livesFor: () => Infinity,
    blurb: 'Bots cast more often.',
  },
  expert: {
    id: 'expert', label: 'Expert',
    respawnInPlace: false, respawnInvuln: 0,
    intervalMul: 0.75, iceMul: 1.5,
    livesFor: () => Infinity,
    blurb: 'Bots think faster.',
  },
  insane: {
    id: 'insane', label: 'Insane',
    respawnInPlace: false, respawnInvuln: 0,
    intervalMul: 0.6, iceMul: 2.0,
    livesFor: () => 0,
    blurb: 'One hit. Game over.',
  },
};
const DEFAULT_DIFFICULTY = 'normal';
const resolveDifficulty = (id) => DIFFICULTIES[id] || DIFFICULTIES[DEFAULT_DIFFICULTY];

export default function FrostFightGame({ mode = 'solo', difficulty = DEFAULT_DIFFICULTY, theme = DEFAULT_THEME, startLevel = 0 }) {
  const diff = resolveDifficulty(difficulty);
  const themeDef = resolveTheme(theme);
  // Theme-relative → absolute level index. The game still indexes
  // into the global LEVELS array; the theme just gates the slice.
  const themeStart = themeDef.startIdx;
  const themeEnd = themeDef.startIdx + themeDef.length;     // exclusive
  const themeCount = themeDef.length;
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
    banana: null, grape: null, plum: null, eggplant: null, melon: null, cherrybomb: null,
    apple: null, lemon: null, kiwi: null, cherryFruit: null,
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

  // `startLevel` is the theme-relative index from the lobby (0..14
   // within the picked theme). Clamp into the theme slice and convert
   // to an absolute LEVELS index.
  const startLevelInTheme = Math.min(Math.max(0, startLevel | 0), themeCount - 1);
  const initialLevel = themeStart + startLevelInTheme;
  const [levelIdx, setLevelIdx] = useState(initialLevel);
  const [deaths, setDeaths]     = useState(0);
  // Mirror of `deaths` so the death handler can compare against the
  // difficulty cap without depending on the React closure (the loop
  // effect doesn't re-run on every death, so the captured `deaths`
  // can be stale by the time a fatal fires).
  const deathsRef = useRef(0);
  // Phase 18: lives are now a PER-LEVEL pool. `levelDeaths` resets
  // to 0 on every level entry; when it exceeds `diff.lives` the
  // player still respawns, but a 'Level reset' overlay fires and the
  // counter resets — the run never ends from the cap. The per-level
  // counter feeds the HUD's Lives chip, while the run-wide `deaths`
  // counter still feeds scoring + leaderboards.
  const [levelDeaths, setLevelDeaths] = useState(0);
  const levelDeathsRef = useRef(0);
  const [showLevelReset, setShowLevelReset] = useState(false);
  // Phase 18 — surfaced active power-up for the HUD chip. `t` ticks
  // down each frame; setter fires only on changes to avoid every-
  // frame React renders.
  const [activePower, setActivePower] = useState(null);
  const [time, setTime]         = useState(0);
  const [gemsGot, setGemsGot]   = useState(0);
  const [gemsTotal, setGemsTotal] = useState(0);
  const [status, setStatus]     = useState('playing'); // playing | won
  const [showIntro, setShowIntro] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [tip, setTip]           = useState(LEVELS[initialLevel].tip);
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
        // Phase 18 power-ups. `power` is the active kind ('invincible'
        // | 'invisible' | 'speed' | null); `powerT` is seconds left.
        // Phase 20: cherryFruit's `freeFreeze` retired — the cooldown
        // skip read as "nothing happened" in playtests. Replaced by
        // `slowdown`, a 5 s timed effect that slows every bot.
        power: null, powerT: 0,
      },
      player2: p2Spawn ? {
        col: p2Spawn.col, row: p2Spawn.row,
        moving: false, moveT: 0,
        fromCol: p2Spawn.col, fromRow: p2Spawn.row,
        dir: 'down',
        freezeCd: 0,
        dead: false, respawn: 0,
        power: null, powerT: 0,
      } : null,
      // Captured spawn locations for the shared-respawn flow.
      p2Spawn,
      enemies: level.enemies.map((e) => ({
        col: e.col, row: e.row, kind: e.kind,
        moving: false, moveT: 0, fromCol: e.col, fromRow: e.row,
        nextDecide: Math.random() * 0.4 + 0.2,
        boxed: false,
        pairBurst: false,
        // Phase 18 per-kind trait state. Most stay null/0 unless that
        // bot's trait is firing this room — keeps the per-tick branch
        // count small.
        castPending: null,           // orange: { dir, untilTs }
        slipDir: null,               // banana: [dx, dy] queued slip
        shadowCd: e.kind === 'grape'
          ? 2.5 + Math.random() * 1.0
          : 0,                       // grape: seconds until next ice drop
        stompCd: e.kind === 'eggplant'
          ? 2.0 + Math.random() * 1.5
          : 0,                       // eggplant: seconds until next stomp
        teleportCd: e.kind === 'plum'
          ? 6.0 + Math.random() * 2.0
          : 0,                       // plum: seconds until next teleport
        teleportTellT: 0,            // plum: pre-teleport tell window
        teleportPending: false,      // plum: tell is staged
        melonTagT: 0,                // melon: cooldown on the 'IN ROW' floater
        bananaTrailT: 0,             // banana: cooldown on slip streak floater
        burstSignalT: 0,             // blueberry: cooldown on BURST floater
        stompSignalT: 0,             // eggplant: cooldown on STOMP floater
        fuseT: e.kind === 'cherrybomb'
          ? 3.0 + Math.random() * 1.0
          : 0,                       // cherrybomb: countdown to detonation
        burstSpeedT: 0,              // blueberry: seconds left of berry-sense
        // Cherry / orange may cast ice. Stagger the first allowed cast
        // so enemies don't all blow simultaneously when the room loads.
        iceCd: (ENEMY_ICE_CHANCE[e.kind] ?? 0) > 0 ? Math.random() * 1.5 + 1.0 : 0,
        // Phase 22 — atlas-driven animation. animAction = current
        // cycle name ('walk' | 'attackCharge' | 'attackRelease' |
        // 'death' | 'state:neutral' | null). animFrame ticks via
        // tickAnim each frame. atlasKey resolves once per kind so we
        // don't lookup ATLAS_KEY_FOR_KIND every render.
        animAction: 'state:neutral',
        animFrame: 0,
        animT: 0,
        atlasKey: ATLAS_KEY_FOR_KIND[e.kind] || null,
        // Pulse the attack-release animation for ~0.4 s after a cast
        // even if e.moving / e.castPending have already cleared.
        releaseT: 0,
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
    markRoomReached(levelIdx);
    // Per-level lives pool resets on level entry (Phase 18). The
    // run-wide `deaths` counter keeps incrementing for scoring.
    levelDeathsRef.current = 0;
    setLevelDeaths(0);
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

  // Phase 22 — pre-decode every animation atlas at mount. Cheap (~1.5
  // MB across all 7 chars) and worth it: the renderer's atlas-aware
  // path then pulls a frame in O(1) without first-decode jitter the
  // moment a Harvest level loads. loadAtlas is idempotent (cached) so
  // repeated calls during HMR are free.
  useEffect(() => {
    for (const charKey of ATLAS_CHARS) loadAtlas(charKey);
  }, []);
  useEffect(() => {
    if (status === 'won' || status === 'gameover') frostMusic.stop();
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
      orangeWind: orangeWindupUrl,
      cherryWind: cherryWindupUrl,
      fruit: fruitSpriteUrl,
      peach: peachSpriteUrl,
      ice: iceSpriteUrl,
      exit: exitSpriteUrl,
      // Themed-era bots (sheet 1) + windup variants from sheets 3/7
      // where available.
      banana: bananaBotUrl,
      grape: grapeBotUrl,
      grapeWind: grapeWindupUrl,
      plum: plumBotUrl,
      eggplant: eggplantBotUrl,
      melon: melonBotUrl,
      cherrybomb: cherrybombBotUrl,
      kiwiWind: kiwiWindupUrl,
      // Themed-era fruit pickups.
      apple: appleFruitUrl,
      lemon: lemonFruitUrl,
      kiwi: kiwiFruitUrl,
      cherryFruit: cherryFruitUrl,
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

      // Fruits — strawberries by default, peach + apple + lemon + kiwi
      // + cherry-pickup variants per themed era. Each fruit also gets
      // a slow pulsing cyan halo behind it so players never confuse a
      // pickup with an enemy of the same colour family (the user's
      // "no same-kind on same map" rule is enforced level-side; the
      // halo is the visual safety net).
      const FRUIT_KIND = {
        strawberry: { slot: 'fruit',       sz: 26, fbColor: '#ff4d6d', seeds: true  },
        peach:      { slot: 'peach',       sz: 30, fbColor: '#ffb38a', seeds: false },
        apple:      { slot: 'apple',       sz: 28, fbColor: '#ff5a3a', seeds: false },
        lemon:      { slot: 'lemon',       sz: 28, fbColor: '#ffe35a', seeds: false },
        kiwi:       { slot: 'kiwi',        sz: 28, fbColor: '#7ec25a', seeds: false },
        cherryFruit:{ slot: 'cherryFruit', sz: 26, fbColor: '#d72a3a', seeds: false },
      };
      const HALO_R = T * 0.42;
      level.fruits.forEach((f) => {
        if (f.taken) return;
        const fx = f.col * T + T / 2;
        const fy = f.row * T + T / 2 + Math.sin(performance.now() / 350 + f.col) * 1.5;
        const cfg = FRUIT_KIND[f.kind] || FRUIT_KIND.strawberry;
        // Pulsing halo. Slow phase per-fruit so the field doesn't
        // strobe in unison; alpha kept low so it reads as a soft cue.
        const haloA = 0.18 + 0.10 * Math.sin(performance.now() / 480 + f.col + f.row * 1.3);
        ctx.fillStyle = `rgba(108, 208, 240, ${haloA.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(fx, fy, HALO_R, 0, Math.PI * 2);
        ctx.fill();
        const img = spritesRef.current[cfg.slot];
        const ready = img && img.complete && img.naturalWidth > 0;
        if (ready) {
          ctx.drawImage(img, fx - cfg.sz / 2, fy - cfg.sz / 2, cfg.sz, cfg.sz);
        } else {
          ctx.fillStyle = cfg.fbColor;
          ctx.beginPath();
          ctx.arc(fx, fy + 2, cfg.sz / 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2d7a2a';
          ctx.beginPath();
          ctx.moveTo(fx - 4, fy - 6);
          ctx.lineTo(fx + 4, fy - 6);
          ctx.lineTo(fx, fy - 2);
          ctx.closePath();
          ctx.fill();
          if (cfg.seeds) {
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
        // Themed-era bots — grape now has a dedicated wind-up pose
        // (sheet 7 cc#28). The rest still reuse the rest sprite for
        // both states; the size-bump (sz 30 → 32) still reads as a
        // subtle pre-tell.
        banana:     [sprites.banana,     sprites.banana],
        grape:      [sprites.grape,      sprites.grapeWind || sprites.grape],
        plum:       [sprites.plum,       sprites.plum],
        eggplant:   [sprites.eggplant,   sprites.eggplant],
        melon:      [sprites.melon,      sprites.melon],
        cherrybomb: [sprites.cherrybomb, sprites.cherrybomb],
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

        // Phase 22 — atlas-driven animation path. If this kind has an
        // atlas registered AND it's loaded, walk-cycle / cast-windup /
        // cast-release frames render here. Falls back to the legacy
        // single-sprite path below if the atlas isn't ready.
        if (e.atlasKey) {
          const atlas = loadAtlas(e.atlasKey);
          if (atlas?.ready) {
            // Pick action: prefer one-shot release, then cast-windup,
            // then walk, then idle pose. Animation timer ticks during
            // the post-draw enemy update block so frames advance even
            // when the bot is between decisions.
            let action;
            if (e.releaseT > 0)               action = 'attackRelease';
            else if (e.castPending)            action = 'attackCharge';
            else if (e.fuseT && e.fuseT < 1)   action = 'attackCharge';
            else if (e.moving)                 action = 'walk';
            else if (isWinding)                action = 'attackCharge';
            else                               action = 'state:neutral';
            setAnimAction(e, action);
            const frame = getFrame(atlas, e.animAction, e.animFrame);
            if (frame && frame.complete && frame.naturalWidth > 0) {
              const bob = Math.sin(performance.now() / 280 + e.col + e.row) * 0.6;
              // Slightly larger sprite so the puff in attack-release
              // frames doesn't get clipped at sz=32.
              const sz = action === 'attackRelease' ? 36 : 32;
              ctx.drawImage(frame, ecx - sz / 2, ecy - sz / 2 + bob, sz, sz);
              return;  // skip the legacy single-sprite path
            }
          }
        }

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
        // Phase 18 — cherrybomb fuse counter. Draws the rounded-up
        // seconds remaining above the bomb in a small pink chip.
        if (e.kind === 'cherrybomb' && typeof e.fuseT === 'number' && e.fuseT > 0) {
          const fuseLabel = Math.max(0, Math.ceil(e.fuseT));
          ctx.font = `700 ${10}px "Bricolage Grotesque", "Inter", system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fillText(`${fuseLabel}`, ecx + 0.6, ecy - 14 + 0.6);
          ctx.fillStyle = e.fuseT < 1 ? '#ffd86b' : '#ff7b96';
          ctx.fillText(`${fuseLabel}`, ecx, ecy - 14);
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
        // Phase 18 — power-up aura. Golden for invincible, cyan-white
        // ghost for invisible (with reduced sprite alpha), green for
        // speed. Drawn underneath the sprite so it doesn't overpower
        // the character.
        if (pp.power) {
          const auraColor = pp.power === 'invincible' ? 'rgba(255, 216, 107,'
            : pp.power === 'invisible' ? 'rgba(160, 220, 255,'
            : 'rgba(156, 240, 142,';
          const pulse = 0.35 + 0.20 * Math.sin(performance.now() / 220);
          ctx.fillStyle = `${auraColor} ${pulse.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(pcx, pcy, T * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }
        // Invisibility renders the sprite at low alpha so the player
        // still tracks themselves but the silhouette reads as "ghost".
        const drawAlpha = pp.power === 'invisible' ? 0.42 : 1;
        if (ready) {
          const sz = 32;
          const bob = pp.moving ? Math.sin(pp.moveT * Math.PI) * -1.2 : 0;
          ctx.globalAlpha = drawAlpha;
          ctx.drawImage(img, pcx - sz / 2, pcy - sz / 2 + bob, sz, sz);
          ctx.globalAlpha = 1;
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
            // Easy difficulty marks the player with `_respawnInvuln`
            // and intentionally LEAVES the player at their death tile
            // so we don't snap back to spawn. Other tiers rely on the
            // standard back-to-spawn behavior.
            if (player._respawnInvuln && player._respawnInvuln > 0) {
              player.power = 'invincible';
              player.powerT = player._respawnInvuln;
              setActivePower({ id: 'invincible', t: player._respawnInvuln,
                               total: player._respawnInvuln, label: 'INVINCIBLE' });
              player._respawnInvuln = 0;
              // Position stays where we set it on death (in-place).
            } else {
              const sp = isP1 ? s.level.spawn : s.p2Spawn;
              player.col = sp.col; player.row = sp.row;
              player.fromCol = sp.col; player.fromRow = sp.row;
            }
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
          // Freeze/melt cast cooldown ticks raw — NEVER scale by
          // slowdown / speed / any other power. Ice destruction is a
          // core mechanic and must stay reliable regardless of
          // whichever buff is active.
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
                  // Phase 18: cyan shatter shards at every melted tile.
                  if (delay === 0) spawnFx(fxRef.current, 'iceShatter', cx, cy);
                  else setTimeout(() => spawnFx(fxRef.current, 'iceShatter', cx, cy), delay);
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
              // Phase 18: white ring from the player tile telegraphs
              // the cast in the chosen direction.
              if (!reduced) {
                spawnRing(fxRef.current, player.col * T + T / 2, player.row * T + T / 2, {
                  life: 0.32, r0: 3, r1: T * 0.55, color: '#ffffff', width: 2,
                });
              }
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
        // Advance step animation. Phase 18 speed boost halves MOVE_TIME
        // for the player carrying the apple power-up.
        if (player.moving) {
          const moveTime = player.power === 'speed' ? MOVE_TIME * 0.5 : MOVE_TIME;
          player.moveT += dt / moveTime;
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
            // Phase 18 — power-up fruits grant timed effects on top of
            // the standard pickup credit. The power label fires a
            // floater so the player reads it; the active state lives
            // on the player object and ticks down each frame.
            // Phase 20 — power-up registry. cherryFruit's free-freeze
            // is gone; cherryFruit now grants `slowdown`, a 5 s effect
            // that scales every bot's decision interval × 1.6 and
            // move time × 1.4. Reads as a clear advantage that doesn't
            // require remembering an unspent ability.
            const PWR = {
              kiwi:        { id: 'invincible', t: 2.5, label: 'INVINCIBLE', color: '#ffd86b' },
              lemon:       { id: 'invisible',  t: 3.0, label: 'INVISIBLE',  color: '#dff5ff' },
              apple:       { id: 'speed',      t: 3.0, label: 'SPEED',      color: '#9cf08e' },
              cherryFruit: { id: 'slowdown',   t: 5.0, label: 'BOTS SLOWED', color: '#ff8aa3' },
            };
            const pw = PWR[fruit.kind];
            if (pw) {
              // Stack: if a longer effect is already active, keep its
              // remaining time; otherwise overwrite with the new one.
              if (player.power !== pw.id || player.powerT < pw.t) {
                player.power = pw.id;
                player.powerT = pw.t;
              }
              setActivePower({ id: pw.id, t: pw.t, total: pw.t, label: pw.label });
            }
            const fcx = fruit.col * T + T / 2;
            const fcy = fruit.row * T + T / 2;
            if (!reduced) {
              spawnFx(fxRef.current, 'fruit', fcx, fcy);
              if (pw) {
                spawnFloater(fxRef.current, pw.label, fcx, fcy - 12, pw.color, { size: 10, life: 1.1 });
              } else if (s.fruitsLeft === 0) {
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
        // Persist per-room clear so the lobby's level-select unlocks
        // progressively. Run completion is recorded below at the
        // run-end branch.
        markRoomCleared(roomName);

        if (levelIdx + 1 >= themeEnd) {
          setStatus('won');
          sfx.win();
          markRunCleared(diff.id);
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
            // Base scales with theme room count (15) so longer themes
            // don't penalise the elapsed-time term. Trap count + peach
            // count surface in meta so the achievement bus can pick
            // them up.
            const base = themeCount * 500;
            const peachBonus = runPeachesRef.current * 80;
            const score = Math.max(
              0,
              Math.round(base + peachBonus - deaths * 50 - s.elapsed * 3),
            );
            submitScore('badicecream', score, {
              deaths, time: finalTime, levels: themeCount,
              trapped: runTrapCountRef.current,
              peaches: runPeachesRef.current,
              difficulty: diff.id,
              theme: themeDef.id,
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
      // Phase 20 — global bot slowdown when any player has the
      // cherryFruit `slowdown` power active. `slowMul > 1` makes
      // every move + decide longer.
      const anySlowdown = (p && p.power === 'slowdown') || (p2 && p2.power === 'slowdown');
      const slowMul = anySlowdown ? 1.6 : 1;
      s.enemies.forEach((e) => {
        // Phase 22 — animation timer ticks every frame regardless of
        // moving / decide state so walk/cast cycles read smoothly.
        // releaseT is a small post-cast pulse window so the visible
        // attack-release frames hold for ~0.4 s after the row of ice
        // actually places.
        if (e.atlasKey) tickAnim(e, dt);
        if (e.releaseT > 0) e.releaseT = Math.max(0, e.releaseT - dt);
        if (e.moving) {
          // Phase 18: blueberry's berry-sense burst halves move time
          // while the burst window is open. The window decays even
          // mid-step so the bot eventually returns to baseline cadence.
          const burstScale = (e.kind === 'blueberry' && e.burstSpeedT > 0) ? 0.55 : 1.25;
          const moveScale  = burstScale * slowMul;
          e.moveT += dt / (MOVE_TIME * moveScale);
          if (e.moveT >= 1) { e.moveT = 0; e.moving = false; }
          if (e.burstSpeedT > 0) e.burstSpeedT = Math.max(0, e.burstSpeedT - dt);
          return;
        }
        // Slowdown stretches the decision interval; difficulty's
        // intervalMul tightens it (Expert → 0.75 means bots think 25%
        // faster). Combine multiplicatively.
        e.nextDecide -= dt / (slowMul * diff.intervalMul);
        if (e.iceCd > 0) e.iceCd -= dt;
        // Per-kind trait timers tick down even between decisions so
        // (e.g.) a plum's teleport doesn't only fire on its decide tick.
        if (e.shadowCd > 0)    e.shadowCd    = Math.max(0, e.shadowCd - dt);
        if (e.stompCd > 0)     e.stompCd     = Math.max(0, e.stompCd - dt);
        if (e.teleportCd > 0)  e.teleportCd  = Math.max(0, e.teleportCd - dt);
        if (e.burstSpeedT > 0) e.burstSpeedT = Math.max(0, e.burstSpeedT - dt);

        // ── Phase 18 traits that fire OUTSIDE the decide gate ──
        // These run every frame so they don't have to wait for
        // ENEMY_INTERVAL[e.kind] to elapse — they're independent
        // ticks bolted onto the chase pipeline.

        // plum — teleport every ~8 s to a random distant passable tile.
        // Phase 19: 0.5 s pre-teleport tell — a "TP" floater + cyan
        // ring expanding at the bot's tile so the player reads the
        // jump before it happens.
        if (e.kind === 'plum' && e.teleportTellT > 0) {
          e.teleportTellT = Math.max(0, e.teleportTellT - dt);
        }
        if (e.kind === 'plum' && e.teleportCd <= 0 && !e.moving && !e.teleportPending) {
          // Stage the tell first; the actual jump fires on the next
          // frame after the tell window expires.
          e.teleportPending = true;
          e.teleportTellT = 0.5;
          if (!reduced) {
            spawnFloater(fxRef.current, 'TP', e.col * T + T / 2, e.row * T + T / 2 - 14, '#a8f0d8', { size: 11, life: 0.55, vy: -10 });
            spawnRing(fxRef.current, e.col * T + T / 2, e.row * T + T / 2, {
              life: 0.5, r0: 4, r1: T * 0.95, color: '#a8f0d8', width: 2.4,
            });
          }
        }
        if (e.kind === 'plum' && e.teleportPending && e.teleportTellT <= 0) {
          const candidates = [];
          for (let r = 1; r < ROWS - 1; r++) {
            for (let c = 1; c < COLS - 1; c++) {
              if (isWall(s.level, c, r)) continue;
              if (isIce(s.level, c, r)) continue;
              if (s.enemies.some((o) => o.col === c && o.row === r)) continue;
              if (s.level.fruits.some((f) => !f.taken && f.col === c && f.row === r)) continue;
              if (s.level.exit.col === c && s.level.exit.row === r) continue;
              if (p && !p.dead && p.col === c && p.row === r) continue;
              if (p2 && !p2.dead && p2.col === c && p2.row === r) continue;
              const dist = Math.abs(c - e.col) + Math.abs(r - e.row);
              if (dist >= 5) candidates.push({ c, r });
            }
          }
          if (candidates.length > 0) {
            const dst = candidates[(Math.random() * candidates.length) | 0];
            if (!reduced) {
              spawnFx(fxRef.current, 'teleport', e.col * T + T / 2, e.row * T + T / 2);
              spawnFx(fxRef.current, 'teleport', dst.c * T + T / 2, dst.r * T + T / 2);
              spawnRing(fxRef.current, dst.c * T + T / 2, dst.r * T + T / 2, {
                life: 0.45, r0: T * 0.5, r1: 4, color: '#a8f0d8', width: 2,
              });
            }
            e.col = dst.c; e.row = dst.r;
            e.fromCol = dst.c; e.fromRow = dst.r;
          }
          e.teleportCd = 7.0 + Math.random() * 2.0;
          e.teleportPending = false;
        }

        // cherrybomb — visible fuse counter ticks down each frame; on
        // detonation, melt every ice tile in the 3×3 around the bomb.
        // Resets the fuse for the next cycle.
        if (e.kind === 'cherrybomb') {
          e.fuseT = Math.max(0, e.fuseT - dt);
          if (e.fuseT <= 0) {
            let melted = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const tc = e.col + dx, tr = e.row + dy;
                if (!inBounds(tc, tr)) continue;
                const key = `${tc},${tr}`;
                if (s.level.ice.has(key)) {
                  s.level.ice.delete(key);
                  s.castVanish?.set(key, performance.now());
                  if (!reduced) spawnFx(fxRef.current, 'iceShatter', tc * T + T / 2, tr * T + T / 2);
                  melted++;
                }
              }
            }
            if (melted > 0 && !reduced) sfx.frostMelt?.();
            // Ring at the bomb's tile so the player reads the radius.
            if (!reduced) {
              spawnRing(fxRef.current, e.col * T + T / 2, e.row * T + T / 2, {
                life: 0.5, r0: T * 0.3, r1: T * 1.4, color: '#ff7b96', width: 2.4,
              });
            }
            e.fuseT = 3.0 + Math.random() * 1.5;
          }
        }

        // grape — drops a single ice tile at its current position
        // every ~3 s. Acts as a 'shadow' the player has to navigate
        // around or melt.
        if (e.kind === 'grape' && e.shadowCd <= 0 && !e.moving) {
          // Only drop if the tile becomes ice without trapping the bot
          // permanently (other neighbours must remain passable).
          const here = `${e.col},${e.row}`;
          const onTopOfPickup = s.level.fruits.some((f) => !f.taken && f.col === e.col && f.row === e.row)
            || (s.level.exit.col === e.col && s.level.exit.row === e.row);
          if (!onTopOfPickup && !s.level.ice.has(here)) {
            // We need to move FIRST, then drop the ice behind us.
            // Mark a "pendingShadow" so the post-move code emits it.
            e._wantsShadowDrop = true;
          }
          e.shadowCd = 3.0 + Math.random() * 1.5;
        }

        if (e.nextDecide > 0) return;

        // Phase 18 — blueberry "berry-sense": when the closest player
        // is within 3 tiles, kick a brief speed burst by halving the
        // step's interval. Unlike orange's windup, this acts on the
        // chase pipeline (just shorter intervals and faster moves).
        if (e.kind === 'blueberry') {
          const dst = Math.min(
            p && !p.dead ? Math.abs(p.col - e.col) + Math.abs(p.row - e.row) : 99,
            p2 && !p2.dead ? Math.abs(p2.col - e.col) + Math.abs(p2.row - e.row) : 99,
          );
          if (dst <= 3 && e.burstSpeedT <= 0) {
            e.burstSpeedT = 1.4;     // ~2 fast steps before cooldown
            if (!reduced) {
              spawnRing(fxRef.current, e.col * T + T / 2, e.row * T + T / 2, {
                life: 0.32, r0: 4, r1: T * 0.8, color: '#5fb9ff', width: 2,
              });
              spawnFloater(fxRef.current, 'BURST', e.col * T + T / 2, e.row * T + T / 2 - 14, '#5fb9ff', { size: 9, life: 0.55, vy: -8 });
            }
          }
        }

        // Phase 18 — eggplant stomps an ice tile in front of it once
        // its stompCd elapses. Removes ice + emits a wallCrack burst.
        // Skips the move this tick — the stomp IS the action.
        if (e.kind === 'eggplant' && e.stompCd <= 0) {
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          let stomped = false;
          for (const [dx, dy] of dirs) {
            const tc = e.col + dx, tr = e.row + dy;
            if (!inBounds(tc, tr)) continue;
            if (isIce(s.level, tc, tr)) {
              const key = `${tc},${tr}`;
              s.level.ice.delete(key);
              s.castVanish?.set(key, performance.now());
              if (!reduced) {
                spawnFx(fxRef.current, 'wallCrack', tc * T + T / 2, tr * T + T / 2);
                spawnFx(fxRef.current, 'iceShatter', tc * T + T / 2, tr * T + T / 2);
              }
              stomped = true;
              break;
            }
          }
          if (stomped) {
            sfx.frostMelt?.();
            if (!reduced) {
              spawnFloater(fxRef.current, 'STOMP', e.col * T + T / 2, e.row * T + T / 2 - 14, '#cbb798', { size: 9, life: 0.55, vy: -8 });
            }
            e.stompCd = 4.0 + Math.random() * 2.0;
            e.nextDecide = ENEMY_INTERVAL[e.kind];
            return;
          }
          // No adjacent ice — postpone the next stomp check briefly so
          // we don't keep iterating dirs every tick.
          e.stompCd = 1.0;
        }

        // Ice-cast attempt — cherry / orange / plum / cherrybomb may
        // fire a row of ice toward the nearest player. The roll is
        // gated by `iceCd` and the per-kind probability.
        // Phase 18 — orange has a 'thought-bubble' tell: when it rolls
        // a cast, defer the actual cast by `castPending` instead of
        // firing immediately, and show a '?' floater so the player
        // reads the windup. Melon ignores its iceCd when the player
        // is on the same row/col.
        let iceChance = (ENEMY_ICE_CHANCE[e.kind] || 0) * diff.iceMul;
        // Pending-cast resolution (orange windup): if a cast is queued,
        // ignore the roll and just fire it on this decision tick.
        const pendingFire = !!e.castPending;
        // Melon — same-row/col aggression bypasses cooldown. The
        // "IN ROW" floater fires at most every 1.6 s while the
        // condition holds so the player can read why melon suddenly
        // gets aggressive.
        if (e.kind === 'melon') {
          const onSame = (p && !p.dead && (p.col === e.col || p.row === e.row))
            || (p2 && !p2.dead && (p2.col === e.col || p2.row === e.row));
          if (onSame) {
            if (e.iceCd <= 0) iceChance = Math.max(iceChance, 0.55);
            if (e.melonTagT <= 0 && !reduced) {
              spawnFloater(fxRef.current, 'IN ROW', e.col * T + T / 2, e.row * T + T / 2 - 14, '#ffb38a', { size: 9, life: 0.7, vy: -6 });
              e.melonTagT = 1.6;
            }
          }
          if (e.melonTagT > 0) e.melonTagT = Math.max(0, e.melonTagT - dt);
        }
        // Orange — if no pending and roll succeeds, queue instead of cast.
        if (e.kind === 'orange' && !pendingFire && e.iceCd <= 0 && Math.random() < iceChance) {
          // Compute direction now and schedule the cast for the NEXT
          // decision in 0.6 s. Show a "?" floater above the bot.
          const targetForCast = (() => {
            if (!p2 || p2.dead) return p;
            if (p.dead) return p2;
            const d1 = Math.abs(p.col  - e.col) + Math.abs(p.row  - e.row);
            const d2 = Math.abs(p2.col - e.col) + Math.abs(p2.row - e.row);
            return d1 <= d2 ? p : p2;
          })();
          const ddx = Math.sign(targetForCast.col - e.col);
          const ddy = Math.sign(targetForCast.row - e.row);
          const ax = Math.abs(targetForCast.col - e.col);
          const ay = Math.abs(targetForCast.row - e.row);
          const dir = ax >= ay ? [ddx, 0] : [0, ddy];
          if (dir[0] !== 0 || dir[1] !== 0) {
            e.castPending = { dir, untilTs: performance.now() + 600 };
            if (!reduced) {
              spawnFloater(fxRef.current, '?', e.col * T + T / 2, e.row * T + T / 2 - 14, '#ffd86b', { size: 14, life: 0.65, vy: -8 });
              spawnRing(fxRef.current, e.col * T + T / 2, e.row * T + T / 2, {
                life: 0.6, r0: 4, r1: T * 0.45, color: '#ffd86b', width: 2,
              });
            }
            // Defer the action; come back in 0.6 s to fire the cast.
            e.nextDecide = 0.6;
            return;
          }
        }
        if (iceChance > 0 && (pendingFire || (e.iceCd <= 0 && Math.random() < iceChance))) {
          // Direction: prefer the queued direction from the orange
          // windup (`castPending`); otherwise pick the dominant axis
          // toward the nearest live player.
          let dir;
          if (pendingFire) {
            dir = e.castPending.dir;
            e.castPending = null;
          } else {
            const targetForCast = (() => {
              if (!p2 || p2.dead) return p;
              if (p.dead) return p2;
              const d1 = Math.abs(p.col  - e.col) + Math.abs(p.row  - e.row);
              const d2 = Math.abs(p2.col - e.col) + Math.abs(p2.row - e.row);
              return d1 <= d2 ? p : p2;
            })();
            const ddx = Math.sign(targetForCast.col - e.col);
            const ddy = Math.sign(targetForCast.row - e.row);
            const ax = Math.abs(targetForCast.col - e.col);
            const ay = Math.abs(targetForCast.row - e.row);
            dir = ax >= ay ? [ddx, 0] : [0, ddy];
          }
          if (dir[0] !== 0 || dir[1] !== 0) {
            // Row-cast — same Othello logic as the player. Walks
            // forward placing ice on every passable tile until the
            // first obstacle (wall, ice, enemy, fruit, exit, player).
            // Single SFX cue per cast, single iceCd reset.
            let placed = 0;
            let c = e.col + dir[0], r = e.row + dir[1];
            const castStartTs = performance.now();
            const CAST_STAGGER = reduced ? 0 : 55;
            const PARTICLE_LEAD = 30;
            // Phase 18: cyan ring at the bot's tile so the player can
            // read which row is about to fill with ice. Quick (0.34 s)
            // so it doesn't overlap with the next decision tick.
            if (!reduced) {
              spawnRing(fxRef.current, e.col * T + T / 2, e.row * T + T / 2, {
                life: 0.34, r0: 4, r1: T * 0.55, color: '#6cd0f0', width: 2,
              });
            }
            while (inBounds(c, r) && !isWall(s.level, c, r) && !isIce(s.level, c, r)) {
              const occupied =
                s.enemies.some((o) => o !== e && o.col === c && o.row === r)
                || s.level.fruits.some((f) => !f.taken && f.col === c && f.row === r)
                || (s.level.exit.col === c && s.level.exit.row === r)
                || (p && !p.dead && p.col === c && p.row === r)
                || (p2 && !p2.dead && p2.col === c && p2.row === r);
              if (occupied) break;
              const key = `${c},${r}`;
              s.level.ice.add(key);
              s.castReveal.set(key, castStartTs + placed * CAST_STAGGER);
              if (!reduced) {
                const cx = c * T + T / 2, cy = r * T + T / 2;
                const delay = Math.max(0, placed * CAST_STAGGER - PARTICLE_LEAD);
                if (delay === 0) spawnFx(fxRef.current, 'freeze', cx, cy);
                else setTimeout(() => spawnFx(fxRef.current, 'freeze', cx, cy), delay);
              }
              placed++;
              c += dir[0]; r += dir[1];
            }
            if (placed > 0) {
              sfx.frostFreeze();
              e.iceCd = ENEMY_ICE_CD;
              // Hold attack-release frames for ~0.4 s after the cast
              // so the puff animation reads even if the bot's next
              // action would otherwise return it to walk/idle.
              if (e.atlasKey) e.releaseT = 0.4;
              // Skip the move this decision tick — the cast IS the action.
              e.nextDecide = ENEMY_INTERVAL[e.kind];
              return;
            }
          }
        }

        // Self-unblock — if the enemy is fully boxed in by ice/walls
        // (and at least one neighbour is ice it could melt), it
        // sacrifices its turn to clear ALL adjacent ice tiles. Mirror
        // of the player's row melt but radial: tries every direction
        // and removes any ice block found one tile away. This prevents
        // permanently-trapped bots after a long player cast or a
        // cherry/orange casting itself into a corner.
        if (!e.moving) {
          const dirs4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          let stuck = true;
          for (const [dx, dy] of dirs4) {
            const tc = e.col + dx, tr = e.row + dy;
            if (!inBounds(tc, tr)) continue;
            if (isWall(s.level, tc, tr)) continue;
            if (isIce(s.level, tc, tr)) continue;
            if (s.enemies.some((o) => o !== e && o.col === tc && o.row === tr)) continue;
            stuck = false;
            break;
          }
          if (stuck) {
            // Find an ice neighbour to melt. Prefer one toward the
            // player so the unblock breaks toward the chase target.
            let cleared = 0;
            for (const [dx, dy] of dirs4) {
              const tc = e.col + dx, tr = e.row + dy;
              if (!inBounds(tc, tr)) continue;
              if (isIce(s.level, tc, tr)) {
                const key = `${tc},${tr}`;
                s.level.ice.delete(key);
                s.castVanish?.set(key, performance.now());
                if (!reduced) spawnFx(fxRef.current, 'iceShatter', tc * T + T / 2, tr * T + T / 2);
                cleared++;
                if (cleared >= 1) break;  // one melt per stuck turn
              }
            }
            if (cleared > 0) {
              sfx.frostMelt();
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
        // Chase target — closest alive *visible* player. Phase 18
        // invisibility makes that player undetectable for chase
        // purposes (they can still die if a bot stumbles into them).
        // If every player is invisible/dead, bots pick a random
        // direction and wander.
        const pVisible  = p  && !p.dead  && p.power  !== 'invisible';
        const p2Visible = p2 && !p2.dead && p2.power !== 'invisible';
        const target = (() => {
          if (!p2Visible) return pVisible ? p : null;
          if (!pVisible) return p2;
          const d1 = Math.abs(p.col  - e.col) + Math.abs(p.row  - e.row);
          const d2 = Math.abs(p2.col - e.col) + Math.abs(p2.row - e.row);
          return d1 <= d2 ? p : p2;
        })();
        if (!target) {
          // Wander: random orthogonal step.
          const choices = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - 0.5);
          for (const [mx, my] of choices) if (tryMove(mx, my)) break;
          return;
        }
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
        // Banana slip — if a slip was queued from a previous step,
        // try the queued direction first. The slip mimics the player's
        // movement carrying momentum across plain floor.
        let moved = false;
        if (e.kind === 'banana' && e.slipDir) {
          const [sdx, sdy] = e.slipDir;
          if (tryMove(sdx, sdy)) moved = true;
          e.slipDir = null;
        }
        if (!moved) {
          for (const [mx, my] of order) {
            if (mx === 0 && my === 0) continue;
            if (tryMove(mx, my)) { moved = true; break; }
          }
        }
        if (!moved) {
          const choices = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - 0.5);
          for (const [mx, my] of choices) if (tryMove(mx, my)) break;
        }
        // ── Phase 18 post-move effects ──
        // Banana — queue a slip step in the same direction at half
        // interval, but ONLY if the next tile is plain floor (no ice,
        // no wall, no occupant). Slip can be cancelled by any blocker.
        if (moved && e.kind === 'banana' && Math.random() < 0.7) {
          const sdx = e.col - e.fromCol;
          const sdy = e.row - e.fromRow;
          const nc = e.col + sdx, nr = e.row + sdy;
          if (inBounds(nc, nr)
              && !isWall(s.level, nc, nr)
              && !isIce(s.level, nc, nr)
              && !s.enemies.some((o) => o !== e && o.col === nc && o.row === nr)) {
            e.slipDir = [sdx, sdy];
            e.nextDecide = 0.16;     // overrides the cherry-or-base above
            // Phase 19: visible "SLIP" tag so the player notices the
            // banana is carrying momentum, not just stepping fast.
            if (e.bananaTrailT <= 0 && !reduced) {
              spawnFloater(fxRef.current, 'SLIP', e.col * T + T / 2, e.row * T + T / 2 - 14, '#ffe07a', { size: 9, life: 0.45, vy: -6 });
              e.bananaTrailT = 0.6;
            }
          }
        }
        if (e.bananaTrailT > 0) e.bananaTrailT = Math.max(0, e.bananaTrailT - dt);
        // Grape — drop a shadow ice tile at the just-vacated tile if
        // the trait flag was set this tick.
        if (e._wantsShadowDrop && moved) {
          const sc = e.fromCol, sr = e.fromRow;
          if (inBounds(sc, sr)
              && !isWall(s.level, sc, sr)
              && !isIce(s.level, sc, sr)
              && !s.level.fruits.some((f) => !f.taken && f.col === sc && f.row === sr)
              && !(s.level.exit.col === sc && s.level.exit.row === sr)
              && !(p && !p.dead && p.col === sc && p.row === sr)
              && !(p2 && !p2.dead && p2.col === sc && p2.row === sr)) {
            const key = `${sc},${sr}`;
            s.level.ice.add(key);
            s.castReveal.set(key, performance.now());
            if (!reduced) {
              spawnFx(fxRef.current, 'iceForm', sc * T + T / 2, sr * T + T / 2);
              // Visible "SHADOW" floater at the dropped tile so the
              // player reads which ice came from grape vs. their own
              // cast or another bot.
              spawnFloater(fxRef.current, 'SHADOW', sc * T + T / 2, sr * T + T / 2 - 12, '#b785f0', { size: 9, life: 0.65, vy: -8 });
            }
          }
          e._wantsShadowDrop = false;
        }
      });

      // Phase 18 — power-up timers tick down each frame for both
      // players. When a power expires, clear it AND clear the HUD
      // chip if the chip was showing this player's power.
      const tickPower = (pp) => {
        if (!pp) return;
        if (pp.powerT > 0) {
          pp.powerT = Math.max(0, pp.powerT - dt);
          if (pp.powerT === 0) pp.power = null;
        }
      };
      tickPower(p);
      tickPower(p2);
      // Mirror the active player's remaining-time into the HUD chip.
      // Use a 0.1 s threshold to avoid an every-frame setState churn.
      const activePp = (p && p.power) ? p : (p2 && p2.power ? p2 : null);
      const hudPower = activePower;
      if (activePp) {
        // Update the chip's `t` to the live remaining seconds. Tick
        // only when the labeled second changes.
        const labelSec = Math.ceil(activePp.powerT * 10) / 10;
        if (!hudPower || hudPower.id !== activePp.power || Math.abs(hudPower.t - labelSec) > 0.05) {
          setActivePower((prev) => prev && prev.id === activePp.power
            ? { ...prev, t: labelSec }
            : { id: activePp.power, t: labelSec, total: prev?.total ?? labelSec, label: activePp.power.toUpperCase() });
        }
      } else if (hudPower) {
        setActivePower(null);
      }

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
        // Phase 18 — invincibility: a player with `power === 'invincible'`
        // ignores enemy touches for the duration. Both players checked
        // independently so co-op pickups don't blanket the partner.
        if (!p.dead && p.power !== 'invincible') {
          for (const e of s.enemies) if (enemyTouchesPlayer(e, p)) return p;
        }
        if (p2 && !p2.dead && p2.power !== 'invincible') {
          for (const e of s.enemies) if (enemyTouchesPlayer(e, p2)) return p2;
        }
        return null;
      })();
      if (touchedPlayer) {
        // Phase 22 — Easy difficulty respawns IN PLACE with a 3 s
        // invincibility window instead of reloading the room. Other
        // tiers keep the existing full-room-restart behavior so the
        // bots reset to known positions (kills the spawn-loop bug).
        const inPlace = diff.respawnInPlace;
        s.dying = !inPlace;
        const dpos = entityPos(touchedPlayer);
        const dcx = dpos.x + T / 2, dcy = dpos.y + T / 2;
        s.shake = reduced ? 0 : 12;
        s.flash = reduced ? 0 : 0.5;
        const nextDeaths = deathsRef.current + 1;
        deathsRef.current = nextDeaths;
        setDeaths(nextDeaths);
        sfx.frostDeath();
        frostMusic.duck(1.1);
        if (!reduced) {
          spawnFx(fxRef.current, 'death', dcx, dcy);
          spawnFloater(fxRef.current, 'OUCH', dcx, dcy - 10, '#ff7b96', { size: 10, life: 0.9 });
        }
        if (inPlace) {
          // Easy: keep the player on the death tile, briefly hidden,
          // then revive with invincibility. No level reload, no game
          // over branch. We freeze the player visually for ~0.5 s so
          // the death FX has time to read.
          const survivors = [p, p2].filter(Boolean);
          for (const pp of survivors) {
            if (!pp.dead) {
              pp.dead = true;
              pp.respawn = 0.5;
              // Snap to the tile they were standing on so respawn lands
              // exactly where the death animation read.
              pp.fromCol = pp.col; pp.fromRow = pp.row;
              pp.moving = false; pp.moveT = 0;
              // Stash the invuln budget on the player so tickPlayer's
              // respawn block can apply it after the hide window.
              pp._respawnInvuln = diff.respawnInvuln;
            }
          }
          setTip(`Down — back up in ${diff.respawnInvuln.toFixed(0)} s of invincibility.`);
        } else {
          // Standard: full room reload. Both players get effectively-
          // infinite respawn timers so tickPlayer doesn't teleport
          // anyone before loadLevel runs.
          if (!p.dead) { p.dead = true; p.respawn = 999; }
          if (p2 && !p2.dead) { p2.dead = true; p2.respawn = 999; }
          const livesCap = diff.livesFor(themeCount);
          const runOver = nextDeaths > livesCap;
          const dyingState = s;
          if (runOver) {
            setTip('Out of lives — game over.');
            setTimeout(() => {
              if (stateRef.current !== dyingState) return;
              setStatus('gameover');
              frostMusic.stop();
            }, 1100);
          } else {
            setTip('Touched — restarting room.');
            setTimeout(() => {
              if (stateRef.current === dyingState) loadLevel(levelIdx);
            }, 950);
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
      window.removeEventListener('keydown', kd, { capture: true });
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx, status, reduced]);

  const restart = useCallback(() => {
    submittedRef.current = false;
    runTrapCountRef.current = 0;
    runPeachesRef.current = 0;
    deathsRef.current = 0;
    levelDeathsRef.current = 0;
    setDeaths(0);
    setLevelDeaths(0);
    setShowLevelReset(false);
    setTime(0);
    setLevelIdx(initialLevel);
    setStatus('playing');
    setBestBeaten(false);
  }, [initialLevel]);

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
          levelIdx={levelIdx - themeStart}
          levelCount={themeCount}
          levelName={levelName}
          gemsGot={gemsGot}
          gemsTotal={gemsTotal}
          deaths={deaths}
          levelDeaths={levelDeaths}
          time={time}
          roomBest={roomBests[levelName]}
          exitLive={exitLive && status === 'playing'}
          difficulty={diff}
          activePower={activePower}/>
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
          levelCount={themeCount}
          peaches={runPeachesRef.current}
          coverUrl={coverUrl}
          onPlayAgain={restart}
          onExit={onExitToLobby}/>
        <GameOverCard
          open={status === 'gameover'}
          deaths={deaths}
          time={time}
          levelIdx={levelIdx - themeStart}
          levelCount={themeCount}
          levelName={levelName}
          difficulty={diff}
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
