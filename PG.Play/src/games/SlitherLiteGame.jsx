// COIL — original arcade snake. Larger-than-viewport world with a smooth
// follow-camera, responsive canvas (DPR-aware), particles on eat/death,
// pulsing food orbs, and a hold-to-boost mechanic that costs length.
//
// Design notes:
//  * The world is fixed (~2800x1800) but the camera centers on the player,
//    so the playfield always feels expansive — no walls in your face.
//  * Wall hit ends the run. Touching another snake ends the run.
//  * Eating food grows you and bumps the score.
//  * Boost (Space / Shift / second touch / right-click) doubles speed and
//    burns one segment every ~0.6s. Your shed segments drop as orbs.
//  * A minimap in the top-right shows the world and every snake.
//  * Renders are DPR-aware so the canvas looks crisp on Retina.
//
// HUD lives in-canvas (top-left length/score, top-right minimap, bottom
// boost bar) so the immersive shell can stay completely empty around it.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';
import { sfx, subscribeMute, isMuted as soundIsMuted } from '../sound.js';

const WORLD_W = 2800;
const WORLD_H = 1800;
const SEG_SPACING = 5;
const HEAD_R_BASE = 9;
const FOOD_R = 6;
const FOOD_COUNT = 90;
const BOT_COUNT = 6;
const START_LEN = 16;
const GROW_PER_FOOD = 3;
const TURN_RATE = 5.0;
const SPEED_BASE = 165;
const SPEED_DECAY_PER_SEG = 0.16;
const SPEED_MIN = 105;
const BOOST_MULT = 1.85;
const BOOST_BURN = 1.6;        // segments per second while boosting
const BOOST_MIN_LEN = 12;      // can't boost below this length
const FOOD_BIG_CHANCE = 0.10;  // chance a food orb is "big" (worth more)

const COLORS = [
  ['#00fff5', '#00b3aa'],
  ['#ff4d6d', '#c93644'],
  ['#ffe14f', '#c49e1d'],
  ['#a78bfa', '#7a59d8'],
  ['#ff8a3a', '#c9661f'],
  ['#35f0c9', '#1fa788'],
  ['#7ed957', '#4f9b3a'],
];

const FOOD_PALETTE = ['#ffe14f', '#35f0c9', '#ff8a3a', '#a78bfa', '#ff4d6d', '#7fc7ff'];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function makeSnake(x, y, angle, len, color) {
  const body = [];
  for (let i = 0; i < len; i++) {
    body.push({ x: x - Math.cos(angle) * i * SEG_SPACING, y: y - Math.sin(angle) * i * SEG_SPACING });
  }
  return { body, angle, grow: 0, color, alive: true, turnTarget: angle, boost: false, boostBank: 0 };
}

function makeFood(big = null) {
  const isBig = big ?? (Math.random() < FOOD_BIG_CHANCE);
  return {
    x: rand(20, WORLD_W - 20),
    y: rand(20, WORLD_H - 20),
    color: pick(FOOD_PALETTE),
    big: isBig,
    phase: Math.random() * Math.PI * 2,
  };
}

export default function SlitherLiteGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [len, setLen] = useState(START_LEN);
  const [best, setBest] = useState(() => Number(localStorage.getItem('pd-coil-best') || 0));
  const [status, setStatus] = useState('intro'); // 'intro' | 'playing' | 'dead'
  const submittedRef = useRef(false);
  const mutedRef = useRef(soundIsMuted());

  // Initialize / reset world.
  const reset = (start = false) => {
    const NAMES = ['Viper', 'Asp', 'Mamba', 'Kaa', 'Naga', 'Slink', 'Hydra', 'Cobra', 'Rattler', 'Fang'];
    const bots = Array.from({ length: BOT_COUNT }).map((_, i) => {
      const ang = rand(0, Math.PI * 2);
      const s = makeSnake(rand(200, WORLD_W - 200), rand(200, WORLD_H - 200), ang, 12 + Math.floor(Math.random() * 10), COLORS[(i + 1) % COLORS.length]);
      s.name = NAMES[i % NAMES.length];
      return s;
    });
    // Default pointerScreen to canvas center so initial steering vector is
    // never NaN before the first pointer event lands.
    const cnv = canvasRef.current;
    const rect0 = cnv ? cnv.getBoundingClientRect() : { left: 0, top: 0, width: 800, height: 600 };
    const cx0 = rect0.left + rect0.width / 2;
    const cy0 = rect0.top + rect0.height / 2;
    const me = makeSnake(WORLD_W / 2, WORLD_H / 2, 0, START_LEN, COLORS[0]);
    me.name = 'You';
    stateRef.current = {
      me,
      bots,
      food: Array.from({ length: FOOD_COUNT }).map(() => makeFood()),
      pointer: { x: WORLD_W / 2 + 200, y: WORLD_H / 2 },
      keys: {},
      cam: { x: WORLD_W / 2, y: WORLD_H / 2, zoom: 1 },
      particles: [],
      pointerScreen: { x: cx0, y: cy0 },
      tAccum: 0,
      startedAt: performance.now(),
    };
    setLen(START_LEN);
    setScore(START_LEN * 10);
    setStatus(start ? 'playing' : 'intro');
    submittedRef.current = false;
  };

  useEffect(() => { reset(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Keep our local mute mirror in sync with the shell mute toggle.
  useEffect(() => {
    mutedRef.current = soundIsMuted();
    const off = subscribeMute((m) => { mutedRef.current = m; });
    return off;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    // --- Responsive sizing with devicePixelRatio so the canvas renders
    // crisp on Retina. We track *CSS pixel* dimensions in `view`.
    const view = { w: 0, h: 0, dpr: 1 };
    const sizeCanvas = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      if (view.w === w && view.h === h && view.dpr === dpr) return;
      view.w = w; view.h = h; view.dpr = dpr;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sizeCanvas();
    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(wrap);
    window.addEventListener('orientationchange', sizeCanvas);

    // --- Input wiring. Pointer steers in *world space*. Touch supports a
    // second finger as a boost trigger. Right-click also boosts on desktop.
    const screenToWorld = (cx, cy) => {
      const s = stateRef.current;
      if (!s || !s.cam || !view.w || !view.h) return { x: WORLD_W / 2, y: WORLD_H / 2 };
      const r = canvas.getBoundingClientRect();
      const sx = cx - r.left;
      const sy = cy - r.top;
      const cam = s.cam;
      return { x: sx - view.w / 2 + cam.x, y: sy - view.h / 2 + cam.y };
    };
    const setPointerFromEvent = (cx, cy) => {
      const w = screenToWorld(cx, cy);
      const s = stateRef.current; if (!s) return;
      s.pointer.x = w.x;
      s.pointer.y = w.y;
      s.pointerScreen = { x: cx, y: cy };
    };
    const onMouseMove = (e) => setPointerFromEvent(e.clientX, e.clientY);
    const onMouseDown = (e) => {
      const s = stateRef.current; if (!s) return;
      if (status === 'intro') { reset(true); return; }
      if (status === 'dead') { reset(true); return; }
      // Left-click also enables boost while held.
      s.me.boost = true;
    };
    const onMouseUp = () => {
      const s = stateRef.current; if (!s) return;
      s.me.boost = false;
    };
    const onContextMenu = (e) => e.preventDefault();
    const onTouchStart = (e) => {
      e.preventDefault();
      const s = stateRef.current; if (!s) return;
      if (status === 'intro' || status === 'dead') {
        reset(true);
        return;
      }
      if (e.touches[0]) setPointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
      // Second finger = boost.
      if (e.touches.length > 1) s.me.boost = true;
    };
    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      setPointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
      const s = stateRef.current; if (!s) return;
      s.me.boost = e.touches.length > 1;
    };
    const onTouchEnd = (e) => {
      const s = stateRef.current; if (!s) return;
      // Boost while at least 2 touches held.
      s.me.boost = e.touches.length > 1;
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchcancel', onTouchEnd);

    const kd = (e) => {
      const s = stateRef.current; if (!s) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      s.keys[k] = true;
      if (k === 'r' || k === 'R') reset(true);
      if (k === ' ' || k === 'Shift') {
        s.me.boost = true;
        // Restart from intro/death when player taps space.
        if (status === 'intro' || status === 'dead') reset(true);
      }
    };
    const ku = (e) => {
      const s = stateRef.current; if (!s) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      s.keys[k] = false;
      if (k === ' ' || k === 'Shift') s.me.boost = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // --- Simulation helpers.
    const turnToward = (snake, targetAngle, dt) => {
      let d = targetAngle - snake.angle;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const maxTurn = TURN_RATE * dt;
      snake.angle += clamp(d, -maxTurn, maxTurn);
    };

    const stepSnake = (snake, speed, dt) => {
      if (!snake.alive) return;
      turnToward(snake, snake.turnTarget, dt);
      const head = snake.body[0];
      const nx = head.x + Math.cos(snake.angle) * speed * dt;
      const ny = head.y + Math.sin(snake.angle) * speed * dt;
      snake.body.unshift({ x: nx, y: ny });
      if (snake.grow > 0) snake.grow--;
      else snake.body.pop();
    };

    const baseSpeed = (snake) => Math.max(SPEED_MIN, SPEED_BASE - snake.body.length * SPEED_DECAY_PER_SEG);

    const MAX_FOOD = FOOD_COUNT * 4;
    // Cull oldest *shed* orbs first so original spawned food stays intact
    // and respawns properly via replaceFood().
    const trimShedFood = () => {
      const s = stateRef.current;
      if (s.food.length <= MAX_FOOD) return;
      let excess = s.food.length - MAX_FOOD;
      let i = 0;
      while (excess > 0 && i < s.food.length) {
        if (s.food[i].shed) { s.food.splice(i, 1); excess--; continue; }
        i++;
      }
      if (s.food.length > MAX_FOOD) s.food.splice(0, s.food.length - MAX_FOOD);
    };

    const dropOrbsFrom = (snake, count = null) => {
      const s = stateRef.current;
      const drop = count ?? Math.min(60, Math.floor(snake.body.length / 2));
      for (let i = 0; i < drop; i++) {
        const seg = snake.body[Math.floor(i * snake.body.length / drop)];
        if (!seg) continue;
        s.food.push({
          x: seg.x + rand(-6, 6),
          y: seg.y + rand(-6, 6),
          color: snake.color[0],
          big: Math.random() < 0.18,
          phase: Math.random() * Math.PI * 2,
          shed: true,
        });
      }
      trimShedFood();
    };

    const replaceFood = (idx) => {
      const s = stateRef.current;
      const f = s.food[idx];
      if (f && f.shed) { s.food.splice(idx, 1); return -1; }
      s.food[idx] = makeFood();
      return idx;
    };

    const spawnEatBurst = (x, y, color) => {
      const s = stateRef.current;
      for (let i = 0; i < 10; i++) {
        const a = rand(0, Math.PI * 2);
        const v = rand(40, 120);
        s.particles.push({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: rand(0.25, 0.55),
          age: 0,
          color,
          r: rand(1.6, 3.2),
        });
      }
    };

    const spawnDeathBurst = (snake) => {
      const s = stateRef.current;
      const head = snake.body[0];
      const c = snake.color[0];
      for (let i = 0; i < 60; i++) {
        const a = rand(0, Math.PI * 2);
        const v = rand(80, 280);
        s.particles.push({
          x: head.x, y: head.y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: rand(0.4, 0.9),
          age: 0,
          color: c,
          r: rand(2, 4),
        });
      }
    };

    // --- Render
    const drawWorldGrid = (cam) => {
      // Soft dot grid that scrolls with the camera. Subtle, performant.
      const step = 56;
      const color = 'rgba(120, 200, 220, 0.06)';
      const x0 = -view.w / 2 + cam.x;
      const y0 = -view.h / 2 + cam.y;
      const startX = Math.floor(x0 / step) * step;
      const startY = Math.floor(y0 / step) * step;
      const cols = Math.ceil(view.w / step) + 2;
      const rows = Math.ceil(view.h / step) + 2;
      ctx.fillStyle = color;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = startX + c * step;
          const wy = startY + r * step;
          const sx = wx - cam.x + view.w / 2;
          const sy = wy - cam.y + view.h / 2;
          ctx.beginPath();
          ctx.arc(sx, sy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawWorldBounds = (cam) => {
      // Glowing rectangle around the play area in *world* space.
      const sx = -cam.x + view.w / 2;
      const sy = -cam.y + view.h / 2;
      const x = sx;
      const y = sy;
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,255,245,0.55)';
      ctx.shadowColor = 'rgba(0,255,245,0.8)';
      ctx.shadowBlur = 18;
      ctx.strokeRect(x, y, WORLD_W, WORLD_H);
      ctx.restore();
    };

    const drawFood = (cam, t) => {
      const s = stateRef.current;
      const { food } = s;
      // Cull off-screen for cheaper draws.
      const left   = cam.x - view.w / 2 - 30;
      const right  = cam.x + view.w / 2 + 30;
      const top    = cam.y - view.h / 2 - 30;
      const bottom = cam.y + view.h / 2 + 30;
      for (let i = 0; i < food.length; i++) {
        const f = food[i];
        if (f.x < left || f.x > right || f.y < top || f.y > bottom) continue;
        const sx = f.x - cam.x + view.w / 2;
        const sy = f.y - cam.y + view.h / 2;
        const r = (f.big ? FOOD_R + 3 : FOOD_R);
        const pulse = 1 + 0.18 * Math.sin(t * 4 + f.phase);
        // glow halo via radial gradient
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3.6);
        grad.addColorStop(0, f.color);
        grad.addColorStop(0.35, hexAlpha(f.color, 0.42));
        grad.addColorStop(1, hexAlpha(f.color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 3.4 * pulse, 0, Math.PI * 2);
        ctx.fill();
        // bright core
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawSnake = (snake, cam, t, isMe) => {
      if (snake.body.length === 0) return;
      const [c1, c2] = snake.color;
      // Body — draw from tail to head so head sits on top, with smooth taper.
      // We connect segments with a thicker line stroke for fluidity, then
      // overlay smaller circles for highlight & per-segment color.
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // outer glow stroke (head boost)
      if (isMe && snake.boost) {
        ctx.save();
        ctx.strokeStyle = hexAlpha(c1, 0.35);
        ctx.lineWidth = HEAD_R_BASE * 2 + 8;
        ctx.beginPath();
        for (let i = 0; i < snake.body.length; i++) {
          const seg = snake.body[i];
          const sx = seg.x - cam.x + view.w / 2;
          const sy = seg.y - cam.y + view.h / 2;
          if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.restore();
      }
      // base body stroke (taper handled by drawing in two passes for ends)
      ctx.strokeStyle = c2;
      ctx.lineWidth = HEAD_R_BASE * 2 - 1;
      ctx.beginPath();
      for (let i = 0; i < snake.body.length; i++) {
        const seg = snake.body[i];
        const sx = seg.x - cam.x + view.w / 2;
        const sy = seg.y - cam.y + view.h / 2;
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      // bright striped overlay
      ctx.lineWidth = HEAD_R_BASE - 2;
      ctx.strokeStyle = c1;
      ctx.beginPath();
      for (let i = 0; i < snake.body.length; i++) {
        const seg = snake.body[i];
        const sx = seg.x - cam.x + view.w / 2;
        const sy = seg.y - cam.y + view.h / 2;
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      // shimmering scale dots along the spine
      for (let i = 2; i < snake.body.length; i += 3) {
        const seg = snake.body[i];
        const sx = seg.x - cam.x + view.w / 2;
        const sy = seg.y - cam.y + view.h / 2;
        const a = 0.18 + 0.18 * Math.sin(t * 5 + i * 0.6);
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Head circle
      const head = snake.body[0];
      const hx = head.x - cam.x + view.w / 2;
      const hy = head.y - cam.y + view.h / 2;
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.arc(hx, hy, HEAD_R_BASE + 1, 0, Math.PI * 2);
      ctx.fill();
      // Head darker rim
      ctx.lineWidth = 1;
      ctx.strokeStyle = hexAlpha('#000', 0.25);
      ctx.beginPath();
      ctx.arc(hx, hy, HEAD_R_BASE + 1, 0, Math.PI * 2);
      ctx.stroke();
      // Eyes
      const ang = snake.angle;
      const lx = Math.cos(ang + Math.PI / 2);
      const ly = Math.sin(ang + Math.PI / 2);
      const fx = Math.cos(ang);
      const fy = Math.sin(ang);
      const eR = 2.6;
      const ePos = (sign) => ({
        x: hx + lx * sign * 4 + fx * 2,
        y: hy + ly * sign * 4 + fy * 2,
      });
      const e1 = ePos(1), e2 = ePos(-1);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(e1.x, e1.y, eR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e2.x, e2.y, eR, 0, Math.PI * 2); ctx.fill();
      // Pupils look toward steering target for personality.
      let pupAng = ang;
      if (isMe) {
        const s = stateRef.current;
        pupAng = Math.atan2(s.pointer.y - head.y, s.pointer.x - head.x);
      }
      const pdx = Math.cos(pupAng) * 1.1;
      const pdy = Math.sin(pupAng) * 1.1;
      ctx.fillStyle = '#0a0d0e';
      ctx.beginPath(); ctx.arc(e1.x + pdx, e1.y + pdy, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e2.x + pdx, e2.y + pdy, 1.4, 0, Math.PI * 2); ctx.fill();
    };

    const drawParticles = (cam, dt) => {
      const s = stateRef.current;
      const next = [];
      for (let i = 0; i < s.particles.length; i++) {
        const p = s.particles[i];
        p.age += dt;
        if (p.age >= p.life) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        const a = 1 - (p.age / p.life);
        const sx = p.x - cam.x + view.w / 2;
        const sy = p.y - cam.y + view.h / 2;
        ctx.fillStyle = hexAlpha(p.color, a);
        ctx.beginPath();
        ctx.arc(sx, sy, p.r * a + 0.4, 0, Math.PI * 2);
        ctx.fill();
        next.push(p);
      }
      s.particles = next;
    };

    const drawHud = () => {
      const s = stateRef.current;
      const lenNow = s.me.body.length;
      const scoreNow = lenNow * 10;
      const topInset = 72;
      ctx.save();

      // Top-right: Top-10 leaderboard panel.
      const allSnakes = [{ name: s.me.name || 'You', len: lenNow, color: s.me.color, alive: s.me.alive, isMe: true }]
        .concat(s.bots.filter((b) => b.alive).map((b) => ({ name: b.name || 'Snake', len: b.body.length, color: b.color, alive: true, isMe: false })))
        .sort((a, b) => b.len - a.len)
        .slice(0, 10);
      const lbW = Math.min(200, view.w * 0.26);
      const rowH = 16;
      const lbH = 28 + allSnakes.length * rowH + 8;
      const lbX = view.w - lbW - 12;
      const lbY = topInset;
      ctx.fillStyle = 'rgba(11,19,24,0.62)';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      roundRect(ctx, lbX, lbY, lbW, lbH, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#00fff5';
      ctx.font = '700 11px "Space Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText('LEADERBOARD', lbX + 12, lbY + 8);
      ctx.font = '600 10px Inter, system-ui, sans-serif';
      for (let i = 0; i < allSnakes.length; i++) {
        const row = allSnakes[i];
        const ry = lbY + 28 + i * rowH;
        if (row.isMe) {
          ctx.fillStyle = 'rgba(0,255,245,0.10)';
          roundRect(ctx, lbX + 6, ry - 1, lbW - 12, rowH, 4);
          ctx.fill();
        }
        ctx.fillStyle = row.isMe ? '#00fff5' : 'rgba(238,243,245,0.55)';
        ctx.fillText(`#${i + 1}`, lbX + 12, ry + 2);
        ctx.fillStyle = row.color[0];
        ctx.beginPath();
        ctx.arc(lbX + 36, ry + 7, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = row.isMe ? '#eef3f5' : 'rgba(238,243,245,0.85)';
        const nm = row.name.length > 10 ? row.name.slice(0, 10) : row.name;
        ctx.fillText(nm, lbX + 46, ry + 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = row.isMe ? '#00fff5' : 'rgba(238,243,245,0.7)';
        ctx.fillText(String(row.len), lbX + lbW - 12, ry + 2);
        ctx.textAlign = 'left';
      }

      // Minimap below the leaderboard.
      const miniW = Math.min(160, view.w * 0.22);
      const miniH = miniW * (WORLD_H / WORLD_W);
      const mmx = view.w - miniW - 12;
      const mmy = lbY + lbH + 10;
      ctx.fillStyle = 'rgba(11,19,24,0.6)';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, mmx - 6, mmy - 6, miniW + 12, miniH + 12, 8);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(mmx, mmy, miniW, miniH);
      const sx = miniW / WORLD_W;
      const sy = miniH / WORLD_H;
      for (const b of s.bots) {
        if (!b.alive) continue;
        const head = b.body[0];
        ctx.fillStyle = b.color[0];
        ctx.fillRect(mmx + head.x * sx - 1, mmy + head.y * sy - 1, 2, 2);
      }
      const mh = s.me.body[0];
      if (mh) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(mmx + mh.x * sx - 2, mmy + mh.y * sy - 2, 4, 4);
      }
      ctx.strokeStyle = 'rgba(0,255,245,0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        mmx + (s.cam.x - view.w / 2) * sx,
        mmy + (s.cam.y - view.h / 2) * sy,
        view.w * sx,
        view.h * sy,
      );

      // Bottom-left: length-based score panel.
      const blW = 196;
      const blH = 64;
      const blX = 12;
      const blY = view.h - blH - 44;
      ctx.fillStyle = 'rgba(11,19,24,0.62)';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      roundRect(ctx, blX, blY, blW, blH, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(238,243,245,0.55)';
      ctx.font = '600 10px "Space Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';
      ctx.fillText('YOUR LENGTH', blX + 12, blY + 8);
      ctx.fillStyle = '#00fff5';
      ctx.font = '700 28px Inter, system-ui, sans-serif';
      ctx.fillText(String(lenNow), blX + 12, blY + 22);
      ctx.fillStyle = 'rgba(238,243,245,0.55)';
      ctx.font = '600 10px "Space Mono", ui-monospace, monospace';
      ctx.fillText('SCORE', blX + 92, blY + 8);
      ctx.fillStyle = '#eef3f5';
      ctx.font = '700 18px Inter, system-ui, sans-serif';
      ctx.fillText(String(scoreNow), blX + 92, blY + 24);
      ctx.fillStyle = 'rgba(238,243,245,0.55)';
      ctx.font = '600 10px "Space Mono", ui-monospace, monospace';
      ctx.fillText('BEST', blX + 152, blY + 8);
      ctx.fillStyle = '#8a9ba5';
      ctx.font = '700 14px Inter, system-ui, sans-serif';
      ctx.fillText(String(Math.max(best, scoreNow)), blX + 152, blY + 26);

      // Boost meter (bottom center)
      const canBoost = lenNow > BOOST_MIN_LEN;
      const meterW = 160;
      const meterH = 8;
      const mx = (view.w - meterW) / 2;
      const my = view.h - 28;
      ctx.fillStyle = 'rgba(11,19,24,0.55)';
      roundRect(ctx, mx - 6, my - 6, meterW + 12, meterH + 12, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, mx, my, meterW, meterH, 4);
      ctx.fill();
      const fillW = canBoost ? meterW : meterW * (lenNow / BOOST_MIN_LEN);
      ctx.fillStyle = canBoost ? (s.me.boost ? '#ff8a3a' : '#00fff5') : 'rgba(255,255,255,0.18)';
      roundRect(ctx, mx, my, fillW, meterH, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(238,243,245,0.7)';
      ctx.font = '600 10px "Space Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(canBoost ? (s.me.boost ? 'BOOSTING' : 'BOOST  HOLD SPACE / SHIFT / 2-FINGER') : 'GROW TO UNLOCK BOOST', view.w / 2, my - 18);
      ctx.textAlign = 'start';

      ctx.restore();
    };

    const drawIntroOverlay = () => {
      ctx.save();
      ctx.fillStyle = 'rgba(11, 19, 24, 0.62)';
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 12px "Space Mono", ui-monospace, monospace';
      ctx.fillStyle = '#00fff5';
      ctx.fillText('COIL', view.w / 2, view.h / 2 - 80);
      ctx.font = '700 clamp(28px, 5vw, 44px) Lora, Georgia, serif';
      ctx.fillStyle = '#eef3f5';
      ctx.fillText('Eat. Grow. Outlast.', view.w / 2, view.h / 2 - 30);
      ctx.font = '400 14px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(238,243,245,0.7)';
      const tip = window.matchMedia('(pointer: coarse)').matches
        ? 'Tap to start · drag to steer · 2-finger hold to boost'
        : 'Click or press Space to start · move mouse to steer · hold Space / Shift to boost';
      ctx.fillText(tip, view.w / 2, view.h / 2 + 8);
      // pulsing call-out
      const pulse = 0.7 + 0.3 * Math.sin(performance.now() / 220);
      ctx.fillStyle = `rgba(0, 255, 245, ${pulse.toFixed(3)})`;
      ctx.font = '700 16px "Space Mono", ui-monospace, monospace';
      ctx.fillText('► PRESS TO PLAY', view.w / 2, view.h / 2 + 56);
      ctx.restore();
    };

    const drawDeathOverlay = () => {
      const s = stateRef.current;
      const lenNow = s.me.body.length;
      const scoreNow = lenNow * 10;
      ctx.save();
      ctx.fillStyle = 'rgba(11, 19, 24, 0.72)';
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 12px "Space Mono", ui-monospace, monospace';
      ctx.fillStyle = '#ff5a7a';
      ctx.fillText('YOU GOT EATEN', view.w / 2, view.h / 2 - 86);
      ctx.font = '700 clamp(34px, 6vw, 56px) Lora, Georgia, serif';
      ctx.fillStyle = '#eef3f5';
      ctx.fillText(String(scoreNow), view.w / 2, view.h / 2 - 28);
      ctx.font = '400 13px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(238,243,245,0.7)';
      ctx.fillText(`length ${lenNow}  ·  best ${Math.max(best, scoreNow)}`, view.w / 2, view.h / 2 + 8);
      const pulse = 0.7 + 0.3 * Math.sin(performance.now() / 220);
      ctx.fillStyle = `rgba(0, 255, 245, ${pulse.toFixed(3)})`;
      ctx.font = '700 15px "Space Mono", ui-monospace, monospace';
      ctx.fillText('► PRESS TO REPLAY', view.w / 2, view.h / 2 + 56);
      ctx.restore();
    };

    // --- Main loop
    const clock = { last: performance.now() };
    let raf = 0;
    let lastEatSfxAt = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.035, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s) return;
      s.tAccum += dt;

      // Steering & physics tick only while playing.
      if (status === 'playing') {
        const head = s.me.body[0];
        let desired = s.me.angle;
        const k = s.keys;
        const hasKB = k.w || k.a || k.s || k.d || k.arrowup || k.arrowleft || k.arrowdown || k.arrowright;
        if (hasKB) {
          let dx = 0, dy = 0;
          if (k.w || k.arrowup) dy -= 1;
          if (k.s || k.arrowdown) dy += 1;
          if (k.a || k.arrowleft) dx -= 1;
          if (k.d || k.arrowright) dx += 1;
          if (dx || dy) desired = Math.atan2(dy, dx);
        } else {
          desired = Math.atan2(s.pointer.y - head.y, s.pointer.x - head.x);
        }
        s.me.turnTarget = desired;

        // Bot steering — chase nearest food + gentle wall avoidance.
        s.bots.forEach((bot) => {
          if (!bot.alive) return;
          const bh = bot.body[0];
          let nearest = null, nearestD = Infinity;
          for (const f of s.food) {
            const d = (f.x - bh.x) ** 2 + (f.y - bh.y) ** 2;
            if (d < nearestD) { nearestD = d; nearest = f; }
          }
          let target = nearest ? Math.atan2(nearest.y - bh.y, nearest.x - bh.x) : bot.angle;
          if (bh.x < 100)             target = 0;
          if (bh.x > WORLD_W - 100)   target = Math.PI;
          if (bh.y < 100)             target = Math.PI / 2;
          if (bh.y > WORLD_H - 100)   target = -Math.PI / 2;
          bot.turnTarget = target;
        });

        // Boost: drains length over time and shed orbs.
        const meLen = s.me.body.length;
        const boosting = s.me.boost && meLen > BOOST_MIN_LEN;
        if (boosting) {
          s.me.boostBank += dt * BOOST_BURN;
          while (s.me.boostBank >= 1 && s.me.body.length > BOOST_MIN_LEN) {
            s.me.boostBank -= 1;
            // shed one tail segment as an orb so other snakes can grab it
            const tail = s.me.body[s.me.body.length - 1];
            if (tail) {
              s.food.push({
                x: tail.x + rand(-3, 3),
                y: tail.y + rand(-3, 3),
                color: s.me.color[0],
                big: false,
                phase: Math.random() * Math.PI * 2,
                shed: true,
              });
              trimShedFood();
            }
            s.me.body.pop();
          }
        }

        // Move all snakes.
        const meSpeed = baseSpeed(s.me) * (boosting ? BOOST_MULT : 1);
        stepSnake(s.me, meSpeed, dt);
        s.bots.forEach((b) => stepSnake(b, baseSpeed(b) * 0.92, dt));

        const myHead = s.me.body[0];

        // Wall hit ends the run.
        if (myHead.x < 0 || myHead.x > WORLD_W || myHead.y < 0 || myHead.y > WORLD_H) {
          s.me.alive = false;
        }

        // Food pickups (player) — iterate backwards so splice() is safe.
        for (let i = s.food.length - 1; i >= 0; i--) {
          const f = s.food[i];
          const dx = myHead.x - f.x, dy = myHead.y - f.y;
          const r = (f.big ? FOOD_R + 3 : FOOD_R);
          if (dx * dx + dy * dy < (HEAD_R_BASE + r) ** 2) {
            const bonus = f.big ? GROW_PER_FOOD * 2 : GROW_PER_FOOD;
            s.me.grow += bonus;
            spawnEatBurst(f.x, f.y, f.color);
            if (!mutedRef.current && (now - lastEatSfxAt) > 50) {
              try { sfx.click(); } catch {}
              lastEatSfxAt = now;
            }
            replaceFood(i);
          }
        }

        // Bots eat too — iterate backwards for safe splice.
        s.bots.forEach((bot) => {
          if (!bot.alive) return;
          const bh = bot.body[0];
          for (let i = s.food.length - 1; i >= 0; i--) {
            const f = s.food[i];
            const dx = bh.x - f.x, dy = bh.y - f.y;
            const r = (f.big ? FOOD_R + 3 : FOOD_R);
            if (dx * dx + dy * dy < (HEAD_R_BASE + r) ** 2) {
              bot.grow += (f.big ? GROW_PER_FOOD * 2 : GROW_PER_FOOD);
              replaceFood(i);
            }
          }
        });

        // Body collisions — mine into anyone, then bot-vs-bot.
        const hit = (bx, by, r) => (myHead.x - bx) ** 2 + (myHead.y - by) ** 2 < (HEAD_R_BASE + r) ** 2;
        for (let i = 14; i < s.me.body.length; i++) {
          const seg = s.me.body[i];
          if (hit(seg.x, seg.y, 5)) { s.me.alive = false; break; }
        }
        if (s.me.alive) {
          for (const bot of s.bots) {
            if (!bot.alive) continue;
            for (const seg of bot.body) {
              if (hit(seg.x, seg.y, 5)) { s.me.alive = false; break; }
            }
            if (!s.me.alive) break;
          }
        }
        for (const bot of s.bots) {
          if (!bot.alive) continue;
          const bh = bot.body[0];
          if (bh.x < 0 || bh.x > WORLD_W || bh.y < 0 || bh.y > WORLD_H) {
            bot.alive = false;
            dropOrbsFrom(bot);
            continue;
          }
          for (const other of s.bots) {
            if (other === bot || !other.alive) continue;
            for (const seg of other.body) {
              const dx = bh.x - seg.x, dy = bh.y - seg.y;
              if (dx * dx + dy * dy < (HEAD_R_BASE + 5) ** 2) { bot.alive = false; dropOrbsFrom(bot); break; }
            }
            if (!bot.alive) break;
          }
          // Bots can also die into the player's body.
          if (bot.alive) {
            for (const seg of s.me.body) {
              const dx = bh.x - seg.x, dy = bh.y - seg.y;
              if (dx * dx + dy * dy < (HEAD_R_BASE + 5) ** 2) { bot.alive = false; dropOrbsFrom(bot); break; }
            }
          }
        }

        // Per-bot respawn countdown — initialize on death, decrement, respawn at 0.
        s.bots.forEach((bot, i) => {
          if (bot.alive) return;
          if (bot.respawnIn == null) bot.respawnIn = rand(4, 7);
          bot.respawnIn -= dt;
          if (bot.respawnIn <= 0) {
            const ang = rand(0, Math.PI * 2);
            const fresh = makeSnake(rand(200, WORLD_W - 200), rand(200, WORLD_H - 200), ang, 10 + Math.floor(Math.random() * 6), bot.color);
            fresh.name = bot.name;
            s.bots[i] = fresh;
          }
        });

        // Update React HUD-shadow state when length changes (cheap; only on
        // change). The in-canvas HUD is the source of truth, but this keeps
        // the death overlay in sync.
        const newLen = s.me.body.length;
        if (newLen !== len) {
          setLen(newLen);
          setScore(newLen * 10);
        }

        if (!s.me.alive) {
          spawnDeathBurst(s.me);
          // Iconic slither.io payoff — turn the corpse into orbs so other
          // snakes can feast on the player's length.
          dropOrbsFrom(s.me, Math.min(80, s.me.body.length));
          if (!mutedRef.current) { try { sfx.lose(); } catch {} }
          const finalLen = s.me.body.length;
          const secondsAlive = Math.max(0, (now - s.startedAt) / 1000);
          if (!submittedRef.current) {
            submittedRef.current = true;
            submitScore('slither', finalLen, { time: secondsAlive });
            const finalScore = finalLen * 10;
            if (finalScore > best) {
              setBest(finalScore);
              localStorage.setItem('pd-coil-best', String(finalScore));
            }
          }
          setStatus('dead');
        }
      }

      // Camera follows the player smoothly. Light zoom-out as they grow.
      const myHead = s.me.body[0];
      const desiredZoom = 1; // reserved for future zoom-out by length
      if (myHead) {
        s.cam.x += (myHead.x - s.cam.x) * Math.min(1, dt * 6);
        s.cam.y += (myHead.y - s.cam.y) * Math.min(1, dt * 6);
        s.cam.zoom += (desiredZoom - s.cam.zoom) * Math.min(1, dt * 4);
      }
      // Clamp camera so we never show large empty space outside the world.
      const halfW = view.w / 2;
      const halfH = view.h / 2;
      s.cam.x = clamp(s.cam.x, halfW * 0.4, WORLD_W - halfW * 0.4);
      s.cam.y = clamp(s.cam.y, halfH * 0.4, WORLD_H - halfH * 0.4);

      // --- Draw frame.
      // Background — radial vignette toward center for depth.
      ctx.fillStyle = '#0a1116';
      ctx.fillRect(0, 0, view.w, view.h);
      drawWorldGrid(s.cam);
      drawWorldBounds(s.cam);
      drawFood(s.cam, s.tAccum);
      // bots first, me last so my head sits on top
      for (const b of s.bots) drawSnake(b, s.cam, s.tAccum, false);
      drawSnake(s.me, s.cam, s.tAccum, true);
      drawParticles(s.cam, dt);

      // Edge vignette.
      const vg = ctx.createRadialGradient(view.w / 2, view.h / 2, Math.min(view.w, view.h) * 0.4, view.w / 2, view.h / 2, Math.max(view.w, view.h) * 0.7);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, view.w, view.h);

      drawHud();

      if (status === 'intro') drawIntroOverlay();
      else if (status === 'dead') drawDeathOverlay();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('orientationchange', sizeCanvas);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // We intentionally don't depend on len/score; the loop reads from refs
    // and the React state is just for any DOM that needs to know.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, best]);

  return (
    <div ref={wrapRef} className="coil coil-fluid">
      <canvas ref={canvasRef} className="coil-canvas coil-canvas-fluid" tabIndex={0} aria-label="Coil — eat orbs and outlast the other snakes"/>
    </div>
  );
}

// --- helpers (module scope) ---

function hexAlpha(hex, a) {
  // Accept #rgb / #rrggbb. Returns rgba() string.
  if (hex.startsWith('rgb')) return hex;
  let r, g, b;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x,     y + h, rr);
  ctx.arcTo(x,     y + h, x,     y,     rr);
  ctx.arcTo(x,     y,     x + w, y,     rr);
  ctx.closePath();
}
