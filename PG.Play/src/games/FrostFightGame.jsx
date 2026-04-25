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

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';
import { sizeCanvasFluid } from '../util/canvasDpr.js';

// Tile-based: tiles stay a fixed size (T) so the grid keeps its
// hand-tuned proportions. The canvas is fluid and pads the playfield
// with a backdrop on each side.
const T = 36;
const COLS = 22;
const ROWS = 13;
const W = COLS * T;   // 792
const H = ROWS * T;   // 468
const MOVE_TIME = 0.18;
const FREEZE_CD  = 0.12;
const RESPAWN_DELAY = 0.9;

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
];

function parseLevel(idx) {
  const g = LEVELS[idx].grid;
  const walls = [];          // set of "col,row" strings
  const ice   = new Set();   // mutable
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
    }
  }
  return { walls, wallSet, ice, fruits, enemies, spawn, exit, tip: LEVELS[idx].tip, name: LEVELS[idx].name };
}

const isWall     = (level, c, r) => level.wallSet.has(`${c},${r}`);
const isIce      = (level, c, r) => level.ice.has(`${c},${r}`);
const inBounds   = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS;
const isPassable = (level, c, r) => inBounds(c, r) && !isWall(level, c, r) && !isIce(level, c, r);

const ENEMY_INTERVAL = { strawberry: 1.0, blueberry: 0.7 };

export default function FrostFightGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef  = useRef(null);
  const viewRef = useRef({ cssW: W, cssH: H });
  const submittedRef = useRef(false);
  const [levelIdx, setLevelIdx] = useState(0);
  const [deaths, setDeaths]     = useState(0);
  const [time, setTime]         = useState(0);
  const [gemsGot, setGemsGot]   = useState(0);
  const [gemsTotal, setGemsTotal] = useState(0);
  const [status, setStatus]     = useState('playing'); // playing | won

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
  };

  useEffect(() => {
    loadLevel(levelIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    // Fluid sizer — keep tile size fixed, render the W×H grid centered.
    const dispose = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      viewRef.current = { cssW, cssH };
    });

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

      // Outer backdrop — fills any padding around the centered grid
      ctx.fillStyle = '#446e85';
      ctx.fillRect(0, 0, cssW, cssH);

      // Center the fixed-size grid inside the canvas
      const offX = (cssW - W) / 2;
      const offY = (cssH - H) / 2;
      ctx.save();
      ctx.translate(offX, offY);

      // Arena background — pale blue gradient like a walk-in freezer
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#bfe6f5');
      grad.addColorStop(1, '#7ab7d0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Camera shake for hits — applied on top of the centering translate
      const sx = (Math.random() - 0.5) * shake;
      const sy = (Math.random() - 0.5) * shake;
      ctx.save();
      ctx.translate(sx, sy);

      // Tile grid — subtle
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath(); ctx.moveTo(c * T, 0); ctx.lineTo(c * T, H); ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * T); ctx.lineTo(W, r * T); ctx.stroke();
      }

      // Walls
      level.walls.forEach((w) => {
        ctx.fillStyle = '#1a2540';
        ctx.fillRect(w.col * T, w.row * T, T, T);
        ctx.strokeStyle = '#2a3860';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.col * T + 1, w.row * T + 1, T - 2, T - 2);
      });

      // Ice blocks
      level.ice.forEach((key) => {
        const [c, r] = key.split(',').map(Number);
        const x = c * T, y = r * T;
        ctx.fillStyle = '#d9ecf5';
        ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
        ctx.strokeStyle = '#7ac0e0';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, T - 4, T - 4);
        // sparkle lines
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 8); ctx.lineTo(x + 14, y + 14);
        ctx.moveTo(x + 18, y + 24); ctx.lineTo(x + 28, y + 16);
        ctx.stroke();
      });

      // Exit
      const ex = level.exit.col * T + T / 2;
      const ey = level.exit.row * T + T / 2;
      const exitActive = s.fruitsLeft === 0;
      const pulse = exitActive ? 0.6 + 0.4 * Math.sin(performance.now() / 200) : 0.3;
      ctx.fillStyle = exitActive ? `rgba(53, 240, 201, ${pulse})` : 'rgba(120,180,200,0.25)';
      ctx.beginPath();
      ctx.arc(ex, ey, T * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = exitActive ? '#35f0c9' : '#888';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ex, ey, T * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      // flag
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex, ey - 14); ctx.lineTo(ex, ey + 10);
      ctx.stroke();
      ctx.fillStyle = exitActive ? '#fff' : 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(ex, ey - 14); ctx.lineTo(ex + 12, ey - 9); ctx.lineTo(ex, ey - 4); ctx.closePath();
      ctx.fill();

      // Fruits
      level.fruits.forEach((f) => {
        if (f.taken) return;
        const fx = f.col * T + T / 2;
        const fy = f.row * T + T / 2 + Math.sin(performance.now() / 350 + f.col) * 1.5;
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
        // seeds
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(fx - 3, fy, 1, 1);
        ctx.fillRect(fx + 2, fy + 2, 1, 1);
        ctx.fillRect(fx, fy - 1, 1, 1);
      });

      // Enemies
      enemies.forEach((e) => {
        const { x, y } = entityPos(e);
        const cx = x + T / 2, cy = y + T / 2;
        if (e.kind === 'strawberry') {
          ctx.fillStyle = '#ff4d6d';
          ctx.beginPath();
          ctx.arc(cx, cy + 3, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2d7a2a';
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy - 8);
          ctx.lineTo(cx + 6, cy - 8);
          ctx.lineTo(cx, cy - 3);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#35a8ff';
          ctx.beginPath();
          ctx.arc(cx, cy + 3, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1a3a7a';
          ctx.beginPath();
          ctx.arc(cx, cy - 5, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        // angry eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 5, cy, 3, 3);
        ctx.fillRect(cx + 2, cy, 3, 3);
        ctx.fillStyle = '#0a0d0e';
        ctx.fillRect(cx - 4, cy + 1, 1, 1);
        ctx.fillRect(cx + 3, cy + 1, 1, 1);
        // brow
        ctx.strokeStyle = '#0a0d0e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 2); ctx.lineTo(cx - 2, cy - 1);
        ctx.moveTo(cx + 6, cy - 2); ctx.lineTo(cx + 2, cy - 1);
        ctx.stroke();
      });

      // Player (ice cream)
      if (!player.dead) {
        const { x, y } = entityPos(player);
        const cx = x + T / 2, cy = y + T / 2;
        // Cone
        ctx.fillStyle = '#d4a460';
        ctx.beginPath();
        ctx.moveTo(cx - 9, cy); ctx.lineTo(cx + 9, cy); ctx.lineTo(cx, cy + 14); ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy + 2); ctx.lineTo(cx + 6, cy + 2);
        ctx.moveTo(cx - 4, cy + 6); ctx.lineTo(cx + 4, cy + 6);
        ctx.stroke();
        // Scoop
        ctx.fillStyle = '#ff8ec6';
        ctx.beginPath();
        ctx.arc(cx, cy - 4, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0d0e';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Eyes — look toward dir
        const dc = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.dir] || [0, 1];
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 3 + dc[0] * 0.4, cy - 4, 3, 0, Math.PI * 2);
        ctx.arc(cx + 4 + dc[0] * 0.4, cy - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0d0e';
        ctx.beginPath();
        ctx.arc(cx - 3 + dc[0] * 1.4, cy - 4 + dc[1] * 1.4, 1.4, 0, Math.PI * 2);
        ctx.arc(cx + 4 + dc[0] * 1.4, cy - 4 + dc[1] * 1.4, 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Melted splash
        const { x, y } = entityPos(player);
        ctx.fillStyle = 'rgba(255, 77, 109, 0.55)';
        ctx.beginPath();
        ctx.ellipse(x + T / 2, y + T / 2 + 6, 13, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Freeze-ready hint — small marker on tile in front of player
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
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(tc * T + 3, tr * T + 3, T - 6, T - 6);
            ctx.setLineDash([]);
          }
        }
      }

      ctx.restore(); // pop camera shake
      ctx.restore(); // pop centering translate

      // Flash overlay covers the full canvas (not just the playfield)
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

      // Respawn tick
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
        }
      }

      // Shake + flash decay
      if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 40);
      if (s.flash > 0) s.flash -= dt * 1.8;

      // Player input (only when not moving & not dead)
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
          }
        }

        // Freeze / melt
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
          } else {
            // Refuse if any entity or fruit occupies the tile
            const occupied =
              s.enemies.some((e) => e.col === tc && e.row === tr)
              || s.level.fruits.some((f) => !f.taken && f.col === tc && f.row === tr)
              || (s.level.exit.col === tc && s.level.exit.row === tr)
              || (p.col === tc && p.row === tr);
            if (!occupied) {
              s.level.ice.add(key);
              p.freezeCd = FREEZE_CD;
            }
          }
        }
      }

      // Advance player movement
      if (p.moving) {
        p.moveT += dt / MOVE_TIME;
        if (p.moveT >= 1) { p.moveT = 0; p.moving = false; }
      }

      // Fruit pickup
      if (!p.dead && !p.moving) {
        const fruit = s.level.fruits.find((f) => !f.taken && f.col === p.col && f.row === p.row);
        if (fruit) {
          fruit.taken = true;
          s.fruitsLeft -= 1;
          setGemsGot((n) => n + 1);
        }
      }

      // Exit check
      if (!p.dead && !p.moving && s.fruitsLeft === 0
          && p.col === s.level.exit.col && p.row === s.level.exit.row) {
        if (levelIdx + 1 >= LEVELS.length) {
          setStatus('won');
          if (!submittedRef.current) {
            submittedRef.current = true;
            const score = Math.max(0, Math.round(1500 - deaths * 50 - s.elapsed * 3));
            submitScore('badicecream', score, { deaths, time: Math.round(s.elapsed), levels: LEVELS.length });
          }
        } else {
          setLevelIdx((i) => i + 1);
          return;
        }
      }

      // Enemies
      s.enemies.forEach((e) => {
        if (e.moving) {
          e.moveT += dt / (MOVE_TIME * 1.25);
          if (e.moveT >= 1) { e.moveT = 0; e.moving = false; }
          return;
        }
        e.nextDecide -= dt;
        if (e.nextDecide > 0) return;
        e.nextDecide = ENEMY_INTERVAL[e.kind];

        // Simple chase: pick axis with greater distance, if passable go there;
        // otherwise try other axis; otherwise stand.
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
        // Fallback random if no direct component picks
        let moved = false;
        for (const [mx, my] of order) {
          if (mx === 0 && my === 0) continue;
          if (tryMove(mx, my)) { moved = true; break; }
        }
        if (!moved) {
          // idle — try a random orthogonal as a nudge so they don't freeze
          const choices = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - 0.5);
          for (const [mx, my] of choices) if (tryMove(mx, my)) break;
        }
      });

      // Collision: enemy on same (or moving-through same) tile as player => death
      if (!p.dead) {
        for (const e of s.enemies) {
          if (enemyTouchesPlayer(e, p)) {
            p.dead = true;
            p.respawn = RESPAWN_DELAY;
            s.shake = 12;
            s.flash = 0.5;
            setDeaths((d) => d + 1);
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
      dispose();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx, status]);

  const restart = () => {
    submittedRef.current = false;
    setDeaths(0);
    setTime(0);
    setLevelIdx(0);
    setStatus('playing');
  };

  const s = stateRef.current;
  const levelName = s?.level?.name ?? LEVELS[levelIdx]?.name ?? '';

  return (
    <div className="frost" style={{ width: '100%', height: '100%' }}>
      <div className="frost-bar">
        <span>Room <b style={{color:'var(--accent)'}}>{Math.min(LEVELS.length, levelIdx + 1)}</b>/{LEVELS.length} · <span style={{color:'var(--text-dim)'}}>{levelName}</span></span>
        <span>Fruit <b>{gemsGot}</b>/{gemsTotal}</span>
        <span>Deaths <b>{deaths}</b></span>
        <span>Time <b>{time}s</b></span>
        <span style={{marginLeft:'auto'}}>
          {status === 'won' && <button className="btn btn-primary btn-sm" onClick={restart}>Play again</button>}
        </span>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} className="frost-canvas"/>
      </div>
      {status === 'won'
        ? <div className="frost-tip frost-tip-win">Pantry, Cold Room, Aisle — all clear · {deaths} death{deaths === 1 ? '' : 's'} · {time}s</div>
        : <div className="frost-tip">{s?.level?.tip ?? LEVELS[levelIdx].tip}</div>}
      <div className="frost-hint">
        WASD / arrows step · Space or J freeze/melt · R restart · feed yourself, not the fruit.
      </div>
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
  // Smooth tile interpolation when moving between grid cells.
  if (!e.moving) return { x: e.col * T, y: e.row * T };
  const t = e.moveT;
  const x = (e.fromCol + (e.col - e.fromCol) * t) * T;
  const y = (e.fromRow + (e.row - e.fromRow) * t) * T;
  return { x, y };
}

function enemyTouchesPlayer(e, p) {
  // Tile-level overlap on current grid or mid-interpolation swap with player.
  if (e.col === p.col && e.row === p.row) return true;
  if (e.moving && e.fromCol === p.col && e.fromRow === p.row) return true;
  if (p.moving && p.fromCol === e.col && p.fromRow === e.row) return true;
  return false;
}
