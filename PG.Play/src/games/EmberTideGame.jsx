// EMBER & TIDE — original same-keyboard co-op platformer.
//
// Two characters on one keyboard, asymmetric liquids:
//  • Ember (orange) dies in WATER.  Tide (blue) dies in FIRE.
//  • ACID kills both. Treat it like "fake-safe" zones.
//  • Gems come in three flavours: red (Ember only), blue (Tide only), gold
//    (either). All gems must be collected before the doors accept a touch.
//  • Each character has their own door (orange ← Ember, blue ← Tide).
//    Both must be standing on their own door at the same time to win.
//
// Controls
//   Ember  — W A D  (W = jump, A/D = move).      R restart.
//   Tide   — ↑ ← →  (↑ = jump, ←/→ = move).      Esc exit.
//
// If either character dies the whole level resets. Level progress + deaths
// carry across attempts; on final win the combined score is submitted.
//
// Physics: shared AABB + gravity + coyote + jump-buffer pattern from the
// platformer family (Grudgewood / Nightcap / Trace). Each player is a
// separate instance stepped every frame.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';
import { sizeCanvasFluid } from '../util/canvasDpr.js';

const T = 32;                       // tile size
const COLS = 26;
const ROWS = 15;
const W = COLS * T;                 // 832 — native level width
const H = ROWS * T;                 // 480 — native level height
// The level always renders at W × H. The fluid sizer fills the canvas to
// its parent; the level is centered (offX, offY) and the surrounding area
// is filled with the dusk gradient so wide / tall viewports look intentional.
const P_W = 22, P_H = 28;
const GRAVITY = 1700;
const MOVE_MAX = 220;
const GROUND_ACCEL = 2200;
const AIR_ACCEL = 1400;
const GROUND_FRICTION = 1900;
const JUMP_V = -560;
const COYOTE = 0.12;
const BUFFER = 0.11;
const RESPAWN_DELAY = 0.6;

/* ── level language ───────────────────────────────────────────
 *   #   solid tile
 *   .   empty
 *   F   fire pool (lethal to Tide)
 *   W   water pool (lethal to Ember)
 *   A   acid (lethal to both)
 *   r   red gem  (Ember only)
 *   b   blue gem (Tide only)
 *   y   gold gem (either)
 *   X   Ember's door
 *   O   Tide's door
 *   e   Ember spawn
 *   t   Tide spawn
 * ─────────────────────────────────────────────────────────────*/
const LEVELS = [
  {
    name: 'The Vestibule',
    tip: 'Ember takes W A D. Tide takes the arrows. Don\'t wade in each other\'s puddles.',
    grid: [
      '##########################',
      '#........................#',
      '#........................#',
      '#...e..........t.........#',
      '####........########.....#',
      '#.........................',
      '#....y........r...b......#',
      '#...###......#####.......#',
      '#........................#',
      '#........................#',
      '#....FF........WW........#',
      '#....FF........WW........#',
      '####...##########....#####',
      '#.X....................O.#',
      '##########################',
    ],
  },
  {
    name: 'Split the Hall',
    tip: 'You can\'t share paths. Both of you pick up at least one coloured gem.',
    grid: [
      '##########################',
      '#....e..........t........#',
      '#####..........###########',
      '#........................#',
      '#.....WW........FF.......#',
      '#.....WW........FF.......#',
      '####..##############.#####',
      '#...r............b.......#',
      '#...##..........##.......#',
      '#........y...............#',
      '#...AA.........AA........#',
      '#...AA.........AA........#',
      '###.########.#####.#######',
      '#X...........O...........#',
      '##########################',
    ],
  },
  {
    name: 'Counterweights',
    tip: 'Final run. Chain jumps, keep your feet dry or cool — whichever applies.',
    grid: [
      '##########################',
      '#.........................',
      '#..e.................t...#',
      '####................######',
      '#........................#',
      '#........................#',
      '#..r...FF......WW...b....#',
      '#.###..##......##..####..#',
      '#........................#',
      '#.........y..............#',
      '#....AA........FF........#',
      '#....AA........FF........#',
      '####.########.#####.######',
      '#X.........O.............#',
      '##########################',
    ],
  },
];

function parseLevel(idx) {
  const g = LEVELS[idx].grid;
  const solids = [];
  const hazards = [];
  const gems = [];
  const spawns = { ember: null, tide: null };
  const doors = { ember: null, tide: null };

  for (let r = 0; r < g.length; r++) {
    const row = g[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      const x = c * T, y = r * T;
      if (ch === '#') solids.push({ x, y, w: T, h: T });
      else if (ch === 'F') hazards.push({ x, y: y + T - 14, w: T, h: 14, kind: 'fire' });
      else if (ch === 'W') hazards.push({ x, y: y + T - 14, w: T, h: 14, kind: 'water' });
      else if (ch === 'A') hazards.push({ x, y: y + T - 14, w: T, h: 14, kind: 'acid' });
      else if (ch === 'r') gems.push({ x: x + T / 2, y: y + T / 2, kind: 'red', taken: false });
      else if (ch === 'b') gems.push({ x: x + T / 2, y: y + T / 2, kind: 'blue', taken: false });
      else if (ch === 'y') gems.push({ x: x + T / 2, y: y + T / 2, kind: 'gold', taken: false });
      else if (ch === 'X') doors.ember = { x, y: y - T, w: T, h: T * 2 };
      else if (ch === 'O') doors.tide  = { x, y: y - T, w: T, h: T * 2 };
      else if (ch === 'e') spawns.ember = { x: x + (T - P_W) / 2, y: y + (T - P_H) };
      else if (ch === 't') spawns.tide  = { x: x + (T - P_W) / 2, y: y + (T - P_H) };
    }
  }
  return { solids, hazards, gems, spawns, doors, tip: LEVELS[idx].tip, name: LEVELS[idx].name };
}

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export default function EmberTideGame() {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const viewRef   = useRef({ cssW: W, cssH: H, offX: 0, offY: 0 });
  const stateRef  = useRef(null);
  const submittedRef = useRef(false);
  const [levelIdx, setLevelIdx] = useState(0);
  const [deaths,   setDeaths]   = useState(0);
  const [time,     setTime]     = useState(0);
  const [gemsGot,  setGemsGot]  = useState(0);
  const [gemsTotal,setGemsTotal]= useState(0);
  const [status,   setStatus]   = useState('playing');   // playing | won
  const [pop, setPop]           = useState(null);        // transient toast

  const loadLevel = (idx, keepDeaths = true) => {
    const parsed = parseLevel(idx);
    stateRef.current = {
      level: parsed,
      ember: buildPlayer(parsed.spawns.ember, 'ember'),
      tide:  buildPlayer(parsed.spawns.tide,  'tide'),
      elapsed: 0,
      shake: 0,
    };
    setGemsGot(0);
    setGemsTotal(parsed.gems.length);
    if (!keepDeaths) setDeaths(0);
    setStatus('playing');
  };

  useEffect(() => {
    loadLevel(levelIdx, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    // Fluid sizer: canvas buffer follows the parent box. The level itself
    // stays at native W × H; the draw routine reads viewRef to know the
    // current canvas dims + the centering offset.
    const dispose = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      viewRef.current = {
        cssW,
        cssH,
        offX: Math.floor((cssW - W) / 2),
        offY: Math.floor((cssH - H) / 2),
      };
    });

    const keys = {};
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      keys[e.code] = true;
      if (k === 'r') {
        setPop({ text: 'Restart', at: performance.now() });
        setDeaths((d) => d + 1);
        loadLevel(levelIdx);
      }
    };
    const ku = (e) => {
      keys[e.key.toLowerCase()] = false;
      keys[e.code] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const clock = { last: performance.now() };
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s || status !== 'playing') return;

      s.elapsed += dt;
      if ((s.elapsed * 2 | 0) !== (s._hud | 0)) {
        s._hud = s.elapsed * 2;
        setTime(Math.round(s.elapsed));
      }

      const emberCtl = {
        left: keys['a']     || keys['keya'],
        right: keys['d']    || keys['keyd'],
        jump: keys['w']     || keys['keyw'],
      };
      const tideCtl = {
        left: keys['arrowleft'],
        right: keys['arrowright'],
        jump: keys['arrowup'],
      };

      stepPlayer(s, dt, s.ember, emberCtl);
      stepPlayer(s, dt, s.tide,  tideCtl);

      // Hazard checks
      const emberHit = hazardKilling(s.level.hazards, s.ember, 'ember');
      const tideHit  = hazardKilling(s.level.hazards, s.tide,  'tide');
      if (emberHit) kill(s, 'ember');
      if (tideHit)  kill(s, 'tide');

      // Gem pickup
      let gained = 0;
      for (const g of s.level.gems) {
        if (g.taken) continue;
        const boxG = { x: g.x - 10, y: g.y - 10, w: 20, h: 20 };
        if (overlap({ x: s.ember.x, y: s.ember.y, w: P_W, h: P_H }, boxG)) {
          if (g.kind === 'red' || g.kind === 'gold') { g.taken = true; gained++; }
        } else if (overlap({ x: s.tide.x, y: s.tide.y, w: P_W, h: P_H }, boxG)) {
          if (g.kind === 'blue' || g.kind === 'gold') { g.taken = true; gained++; }
        }
      }
      if (gained) {
        setGemsGot((n) => n + gained);
      }

      // Doors — both must stand on their own door, all gems collected
      const remaining = s.level.gems.some((g) => !g.taken);
      if (!remaining && s.level.doors.ember && s.level.doors.tide) {
        const eb = { x: s.ember.x, y: s.ember.y, w: P_W, h: P_H };
        const tb = { x: s.tide.x,  y: s.tide.y,  w: P_W, h: P_H };
        if (overlap(eb, s.level.doors.ember) && overlap(tb, s.level.doors.tide)) {
          // Clear level
          setPop({ text: `${s.level.name} — cleared`, at: performance.now() });
          if (levelIdx + 1 >= LEVELS.length) {
            setStatus('won');
            if (!submittedRef.current) {
              submittedRef.current = true;
              const score = Math.max(0, Math.round(2000 - deaths * 50 - s.elapsed * 3));
              submitScore('fbwg', score, { deaths, time: Math.round(s.elapsed), levels: LEVELS.length });
            }
          } else {
            setLevelIdx((i) => i + 1);
            return;
          }
        }
      }

      draw(ctx, s, gemsGot, gemsTotal, viewRef.current);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      dispose();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx, status, deaths, gemsGot, gemsTotal]);

  const restart = () => {
    submittedRef.current = false;
    setLevelIdx(0);
    setDeaths(0);
    setTime(0);
  };

  const s = stateRef.current;
  const levelName = s?.level?.name ?? LEVELS[levelIdx]?.name ?? '';
  const popAge = pop ? (performance.now() - pop.at) / 1000 : 99;

  return (
    <div className="ember">
      <div className="ember-bar">
        <span>Chamber <b style={{color:'var(--accent)'}}>{Math.min(LEVELS.length, levelIdx + 1)}</b>/{LEVELS.length} · <span style={{color:'var(--text-dim)'}}>{levelName}</span></span>
        <span>Gems <b>{gemsGot}</b>/{gemsTotal}</span>
        <span>Deaths <b>{deaths}</b></span>
        <span>Time <b>{time}s</b></span>
        <span style={{marginLeft:'auto'}}>
          {status === 'won' && <button className="btn btn-primary btn-sm" onClick={restart}>Play again</button>}
        </span>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} className="ember-canvas"/>
      </div>
      {status === 'won'
        ? <div className="ember-tip ember-tip-win">All chambers cleared · {deaths} death{deaths === 1 ? '' : 's'} · {time}s</div>
        : <div className="ember-tip">{s?.level?.tip ?? LEVELS[levelIdx].tip}</div>}
      {popAge < 1.6 && pop && <div className="ember-pop">{pop.text}</div>}
      <div className="ember-hint">
        Ember: <b>W A D</b> · Tide: <b>↑ ← →</b> · R restart chamber · both doors, together, with every gem.
      </div>
    </div>
  );
}

/* ── player plumbing ────────────────────────────────────────── */

function buildPlayer(spawn, who) {
  return {
    x: spawn ? spawn.x : 40,
    y: spawn ? spawn.y : 40,
    spawn: { ...(spawn || { x: 40, y: 40 }) },
    vx: 0, vy: 0,
    onGround: false,
    coyote: 0,
    buffer: 0,
    jumpDown: false,
    dead: false,
    respawnIn: 0,
    facing: 1,
    who,
  };
}

function stepPlayer(s, dt, p, ctl) {
  if (p.dead) {
    p.respawnIn -= dt;
    if (p.respawnIn <= 0) {
      p.x = p.spawn.x; p.y = p.spawn.y;
      p.vx = 0; p.vy = 0;
      p.dead = false; p.buffer = 0; p.coyote = 0;
    }
    return;
  }

  // buffered jump press
  if (ctl.jump && !p.jumpDown) p.buffer = BUFFER;
  p.jumpDown = !!ctl.jump;
  if (p.buffer > 0) p.buffer -= dt;
  if (p.coyote > 0) p.coyote -= dt;

  // horizontal accel / friction
  const accel = p.onGround ? GROUND_ACCEL : AIR_ACCEL;
  if (ctl.left)  { p.vx -= accel * dt; p.facing = -1; }
  if (ctl.right) { p.vx += accel * dt; p.facing = 1; }
  if (!ctl.left && !ctl.right && p.onGround) {
    const drop = GROUND_FRICTION * dt;
    if (Math.abs(p.vx) <= drop) p.vx = 0;
    else p.vx -= Math.sign(p.vx) * drop;
  }
  p.vx = Math.max(-MOVE_MAX, Math.min(MOVE_MAX, p.vx));

  // gravity
  p.vy += GRAVITY * dt;
  p.vy = Math.min(p.vy, 1400);

  // consume buffered jump if allowed
  const canJump = p.onGround || p.coyote > 0;
  if (p.buffer > 0 && canJump) {
    p.vy = JUMP_V;
    p.onGround = false;
    p.coyote = 0;
    p.buffer = 0;
  }
  // short-hop: release jump early shortens arc
  if (!ctl.jump && p.vy < 0) p.vy *= 0.86;

  // horizontal collision
  p.x += p.vx * dt;
  for (const t of s.level.solids) {
    if (overlap({ x: p.x, y: p.y, w: P_W, h: P_H }, t)) {
      if (p.vx > 0) p.x = t.x - P_W;
      else if (p.vx < 0) p.x = t.x + t.w;
      p.vx = 0;
    }
  }
  // clamp to world horizontally
  if (p.x < 0) { p.x = 0; p.vx = 0; }
  if (p.x + P_W > W) { p.x = W - P_W; p.vx = 0; }

  // vertical collision
  const wasGround = p.onGround;
  p.y += p.vy * dt;
  p.onGround = false;
  for (const t of s.level.solids) {
    if (overlap({ x: p.x, y: p.y, w: P_W, h: P_H }, t)) {
      if (p.vy > 0) { p.y = t.y - P_H; p.onGround = true; }
      else if (p.vy < 0) { p.y = t.y + t.h; }
      p.vy = 0;
    }
  }
  if (wasGround && !p.onGround && p.vy >= 0) p.coyote = COYOTE;

  // fell off the world
  if (p.y > H + 80) {
    p.dead = true;
    p.respawnIn = RESPAWN_DELAY;
  }
}

function hazardKilling(hazards, p, who) {
  if (p.dead) return false;
  const box = { x: p.x, y: p.y + 4, w: P_W, h: P_H - 4 };
  for (const h of hazards) {
    if (!overlap(box, h)) continue;
    if (h.kind === 'acid') return true;
    if (h.kind === 'fire' && who === 'tide')  return true;
    if (h.kind === 'water' && who === 'ember') return true;
  }
  return false;
}

function kill(s, who) {
  const p = s[who];
  if (p.dead) return;
  p.dead = true;
  p.respawnIn = RESPAWN_DELAY;
  s.shake = 10;
}

/* ── render ─────────────────────────────────────────────────── */

function draw(ctx, s, gemsGot, gemsTotal, view) {
  const { level } = s;
  const { cssW, cssH, offX, offY } = view;

  // Full-canvas dusk gradient — runs the whole height so the side / top
  // margins on a fluid viewport blend with the level instead of leaving
  // a hard backdrop seam.
  const grad = ctx.createLinearGradient(0, 0, 0, cssH);
  grad.addColorStop(0, '#20112a');
  grad.addColorStop(1, '#0a0614');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cssW, cssH);

  // Translate + clip so all level-coord drawing happens inside the centered
  // W × H playfield. The HUD pickup indicator is drawn after restore so it
  // tracks the level's right edge regardless of viewport size.
  ctx.save();
  ctx.beginPath();
  ctx.rect(offX, offY, W, H);
  ctx.clip();
  ctx.translate(offX, offY);

  // Level-local backdrop (slightly darker so the playfield reads as its
  // own panel inside the dusk wash).
  const inner = ctx.createLinearGradient(0, 0, 0, H);
  inner.addColorStop(0, '#1c0d24');
  inner.addColorStop(1, '#070310');
  ctx.fillStyle = inner;
  ctx.fillRect(0, 0, W, H);

  // background gridlines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * T, 0); ctx.lineTo(c * T, H); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * T); ctx.lineTo(W, r * T); ctx.stroke();
  }

  // shake offset for feedback
  const sx = (Math.random() - 0.5) * s.shake;
  const sy = (Math.random() - 0.5) * s.shake;
  s.shake = Math.max(0, s.shake - 0.4);
  ctx.save();
  ctx.translate(sx, sy);

  // solids
  ctx.fillStyle = '#2b1a3a';
  level.solids.forEach((t) => ctx.fillRect(t.x, t.y, t.w, t.h));
  ctx.strokeStyle = '#452b5a';
  level.solids.forEach((t) => ctx.strokeRect(t.x + 0.5, t.y + 0.5, t.w - 1, t.h - 1));

  // hazards
  level.hazards.forEach((h) => {
    const time = performance.now() / 350;
    if (h.kind === 'fire') {
      ctx.fillStyle = '#912416';
      ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.fillStyle = '#ff4d2a';
      for (let i = 0; i < h.w; i += 6) {
        const y = h.y + (Math.sin(time + (h.x + i) * 0.08) * 2) + 2;
        ctx.fillRect(h.x + i, y, 3, 5);
      }
    } else if (h.kind === 'water') {
      ctx.fillStyle = '#0a3a70';
      ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.fillStyle = '#35a8ff';
      for (let i = 0; i < h.w; i += 8) {
        const y = h.y + (Math.sin(time * 0.8 + (h.x + i) * 0.12) * 2) + 2;
        ctx.fillRect(h.x + i, y, 4, 2);
      }
    } else if (h.kind === 'acid') {
      ctx.fillStyle = '#3a4d12';
      ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.fillStyle = '#b8ff3a';
      for (let i = 0; i < h.w; i += 8) {
        const y = h.y + (Math.cos(time * 1.2 + (h.x + i) * 0.14) * 1.5) + 2;
        ctx.fillRect(h.x + i, y, 3, 2);
      }
    }
  });

  // doors
  const drawDoor = (d, color) => {
    if (!d) return;
    ctx.fillStyle = '#0a0614';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(d.x + 2, d.y + 2, d.w - 4, d.h - 4);
    // ring
    ctx.beginPath();
    ctx.arc(d.x + d.w / 2, d.y + 8, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  drawDoor(level.doors.ember, '#ff8a3a');
  drawDoor(level.doors.tide,  '#35c7ff');

  // gems
  level.gems.forEach((g) => {
    if (g.taken) return;
    const t = performance.now() / 500;
    const bob = Math.sin(t + g.x * 0.12) * 2;
    const color = g.kind === 'red' ? '#ff4d6d' : g.kind === 'blue' ? '#35c7ff' : '#ffe14f';
    ctx.save();
    ctx.translate(g.x, g.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = color;
    ctx.fillRect(-6, -6, 12, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-4, -6, 2, 4);
    ctx.restore();
  });

  // players
  drawPlayer(ctx, s.ember, '#ff6a2a', '#ffb36a');
  drawPlayer(ctx, s.tide,  '#35c7ff', '#9be3ff');

  ctx.restore();

  // HUD pickup indicator — rendered inside the level translation so it
  // tracks the playfield's top-right corner regardless of viewport size.
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(W - 130, 10, 118, 24);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.strokeRect(W - 130.5, 10.5, 117, 23);
  ctx.fillStyle = '#ffe14f';
  ctx.font = 'bold 13px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`GEMS  ${gemsGot}/${gemsTotal}`, W - 71, 27);

  // Close the centered-level translation/clip.
  ctx.restore();
}

function drawPlayer(ctx, p, main, glow) {
  if (p.dead) {
    // ember = red cross, tide = blue cross — quick cue
    ctx.strokeStyle = main;
    ctx.lineWidth = 3;
    const cx = p.x + P_W / 2, cy = p.y + P_H / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy + 6);
    ctx.moveTo(cx + 6, cy - 6); ctx.lineTo(cx - 6, cy + 6);
    ctx.stroke();
    return;
  }
  // body
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.28;
  ctx.fillRect(p.x - 3, p.y - 3, P_W + 6, P_H + 6);
  ctx.globalAlpha = 1;
  ctx.fillStyle = main;
  ctx.fillRect(p.x, p.y, P_W, P_H);
  // eyes (track facing)
  ctx.fillStyle = '#0a0d0e';
  const ex = p.x + (p.facing > 0 ? P_W - 8 : 4);
  ctx.fillRect(ex, p.y + 8, 3, 4);
  ctx.fillRect(ex - (p.facing > 0 ? 7 : -7), p.y + 8, 3, 4);
  // feet puffs when moving fast
  if (Math.abs(p.vx) > 40 && p.onGround) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(p.x - 2, p.y + P_H - 2, P_W + 4, 2);
  }
}
