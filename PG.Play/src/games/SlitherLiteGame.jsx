// COIL — original arcade snake in a bounded arena.
// Touch-native: the snake's head steers toward wherever your finger (or
// mouse) is on the canvas. Also plays on keyboard (WASD / arrows).
//
//  • Bounded arena (no infinite wrap). Hitting a wall ends the run.
//  • Food orbs respawn. Eating grows the body by 3 segments.
//  • Bot snakes roam and eat; colliding with *any* body (yours or theirs)
//    ends your run. Bot deaths drop orbs.
//  • Score = length × 10. Submitted to the platform score bus on death.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

const W = 800;
const H = 500;
const SEG_SPACING = 5;           // distance between body segments
const HEAD_R_BASE = 8;
const FOOD_R = 6;
const FOOD_COUNT = 42;
const BOT_COUNT = 4;
const START_LEN = 14;
const GROW_PER_FOOD = 3;
const TURN_RATE = 4.6;           // radians/sec max
const SPEED_BASE = 140;          // px/sec at starting length
const SPEED_DECAY_PER_SEG = 0.18;// slower as you grow (min clamped)
const SPEED_MIN = 90;

const COLORS = [
  ['#00fff5', '#00c8c0'],
  ['#ff4d6d', '#c93644'],
  ['#ffe14f', '#c49e1d'],
  ['#a78bfa', '#7a59d8'],
  ['#ff8a3a', '#c9661f'],
  ['#35f0c9', '#1fa788'],
];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function makeSnake(x, y, angle, len, color) {
  const body = [];
  for (let i = 0; i < len; i++) {
    body.push({ x: x - Math.cos(angle) * i * SEG_SPACING, y: y - Math.sin(angle) * i * SEG_SPACING });
  }
  return { body, angle, grow: 0, color, alive: true, turnTarget: angle };
}

function makeFood() {
  return {
    x: rand(20, W - 20),
    y: rand(20, H - 20),
    color: pick(['#ffe14f', '#35f0c9', '#ff8a3a', '#a78bfa', '#ff4d6d']),
  };
}

export default function SlitherLiteGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [len, setLen] = useState(START_LEN);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('pd-coil-best') || 0));
  const [status, setStatus] = useState('playing'); // 'playing' | 'dead'
  const submittedRef = useRef(false);

  const reset = () => {
    const bots = Array.from({ length: BOT_COUNT }).map((_, i) => {
      const ang = rand(0, Math.PI * 2);
      return makeSnake(rand(100, W - 100), rand(100, H - 100), ang, 10 + Math.floor(Math.random() * 6), COLORS[(i + 1) % COLORS.length]);
    });
    stateRef.current = {
      me: makeSnake(W / 2, H / 2, 0, START_LEN, COLORS[0]),
      bots,
      food: Array.from({ length: FOOD_COUNT }).map(() => makeFood()),
      pointer: { x: W / 2 + 120, y: H / 2 },
      keys: {},
    };
    setLen(START_LEN);
    setScore(START_LEN * 10);
    setStatus('playing');
    submittedRef.current = false;
  };

  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const rectOf = () => canvas.getBoundingClientRect();
    const setPointerFromEvent = (clientX, clientY) => {
      const r = rectOf();
      const s = stateRef.current; if (!s) return;
      s.pointer.x = (clientX - r.left) * (W / r.width);
      s.pointer.y = (clientY - r.top) * (H / r.height);
    };
    const onMouseMove = (e) => setPointerFromEvent(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      setPointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchStart = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      setPointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });

    const kd = (e) => {
      const s = stateRef.current; if (!s) return;
      s.keys[e.key.toLowerCase()] = true;
      if (e.key === 'r' || e.key === 'R') reset();
    };
    const ku = (e) => {
      const s = stateRef.current; if (!s) return;
      s.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // --- simulation helpers
    const turnToward = (snake, targetAngle, dt) => {
      let d = targetAngle - snake.angle;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const maxTurn = TURN_RATE * dt;
      snake.angle += Math.max(-maxTurn, Math.min(maxTurn, d));
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

    const speedOf = (snake) => Math.max(SPEED_MIN, SPEED_BASE - snake.body.length * SPEED_DECAY_PER_SEG);

    const dropOrbsFrom = (snake) => {
      const s = stateRef.current;
      const drop = Math.min(40, Math.floor(snake.body.length / 2));
      for (let i = 0; i < drop; i++) {
        const seg = snake.body[Math.floor(i * snake.body.length / drop)];
        if (!seg) continue;
        s.food.push({ x: seg.x + rand(-4, 4), y: seg.y + rand(-4, 4), color: snake.color[0] });
      }
    };

    const replaceFood = (idx) => {
      const s = stateRef.current;
      s.food[idx] = makeFood();
    };

    // --- render
    const draw = () => {
      const s = stateRef.current; if (!s) return;

      // arena background
      ctx.fillStyle = '#0a1116';
      ctx.fillRect(0, 0, W, H);
      // soft grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // arena border
      ctx.strokeStyle = 'rgba(0,255,245,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, W - 8, H - 8);

      // food
      s.food.forEach((f) => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, FOOD_R, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // snakes — paint bots first, me last so my head is on top
      const drawSnake = (snake) => {
        if (snake.body.length === 0) return;
        const [c1, c2] = snake.color;
        for (let i = snake.body.length - 1; i >= 0; i--) {
          const seg = snake.body[i];
          const t = i / Math.max(1, snake.body.length - 1);
          const r = HEAD_R_BASE - t * 3.5;
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, Math.max(3, r), 0, Math.PI * 2);
          ctx.fillStyle = i === 0 ? c1 : (i % 2 ? c1 : c2);
          ctx.fill();
        }
        // eyes
        const head = snake.body[0];
        const ex = head.x + Math.cos(snake.angle) * (HEAD_R_BASE - 2);
        const ey = head.y + Math.sin(snake.angle) * (HEAD_R_BASE - 2);
        const lx = Math.cos(snake.angle + Math.PI / 2);
        const ly = Math.sin(snake.angle + Math.PI / 2);
        ctx.fillStyle = '#0a0d0e';
        ctx.beginPath(); ctx.arc(ex + lx * 3, ey + ly * 3, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex - lx * 3, ey - ly * 3, 1.8, 0, Math.PI * 2); ctx.fill();
      };
      s.bots.forEach(drawSnake);
      drawSnake(s.me);

      // HUD overlay is handled outside the canvas
    };

    // --- main loop
    const clock = { last: performance.now() };
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.035, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s) return;

      if (status === 'playing') {
        // my steering: pointer overrides keyboard if pointer moved recently
        const head = s.me.body[0];
        let desired = s.me.angle;
        const hasKB = s.keys.w || s.keys.a || s.keys.s || s.keys.d || s.keys.arrowup || s.keys.arrowleft || s.keys.arrowdown || s.keys.arrowright;
        if (hasKB) {
          let dx = 0, dy = 0;
          if (s.keys.w || s.keys.arrowup) dy -= 1;
          if (s.keys.s || s.keys.arrowdown) dy += 1;
          if (s.keys.a || s.keys.arrowleft) dx -= 1;
          if (s.keys.d || s.keys.arrowright) dx += 1;
          if (dx || dy) desired = Math.atan2(dy, dx);
        } else {
          desired = Math.atan2(s.pointer.y - head.y, s.pointer.x - head.x);
        }
        s.me.turnTarget = desired;

        // bot steering: drift toward nearest food; avoid walls
        s.bots.forEach((bot) => {
          if (!bot.alive) return;
          const bh = bot.body[0];
          let nearest = null, nearestD = Infinity;
          for (const f of s.food) {
            const d = (f.x - bh.x) ** 2 + (f.y - bh.y) ** 2;
            if (d < nearestD) { nearestD = d; nearest = f; }
          }
          let target = nearest ? Math.atan2(nearest.y - bh.y, nearest.x - bh.x) : bot.angle;
          // wall avoid
          if (bh.x < 80)       target = 0;
          if (bh.x > W - 80)   target = Math.PI;
          if (bh.y < 80)       target = Math.PI / 2;
          if (bh.y > H - 80)   target = -Math.PI / 2;
          bot.turnTarget = target;
        });

        // move all
        stepSnake(s.me, speedOf(s.me), dt);
        s.bots.forEach((b) => stepSnake(b, speedOf(b) * 0.9, dt));

        const myHead = s.me.body[0];

        // wall
        if (myHead.x < 0 || myHead.x > W || myHead.y < 0 || myHead.y > H) {
          s.me.alive = false;
        }

        // food pickup
        for (let i = 0; i < s.food.length; i++) {
          const f = s.food[i];
          const dx = myHead.x - f.x, dy = myHead.y - f.y;
          if (dx * dx + dy * dy < (HEAD_R_BASE + FOOD_R) ** 2) {
            s.me.grow += GROW_PER_FOOD;
            replaceFood(i);
          }
        }
        s.bots.forEach((bot) => {
          if (!bot.alive) return;
          const bh = bot.body[0];
          for (let i = 0; i < s.food.length; i++) {
            const f = s.food[i];
            const dx = bh.x - f.x, dy = bh.y - f.y;
            if (dx * dx + dy * dy < (HEAD_R_BASE + FOOD_R) ** 2) {
              bot.grow += GROW_PER_FOOD;
              replaceFood(i);
            }
          }
        });

        // body collisions — my head vs any body (mine from segment 12+, bots from any)
        const hit = (bx, by, r) => (myHead.x - bx) ** 2 + (myHead.y - by) ** 2 < (HEAD_R_BASE + r) ** 2;
        for (let i = 12; i < s.me.body.length; i++) {
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
        // bot vs bot (head into body) — simple culling
        for (const bot of s.bots) {
          if (!bot.alive) continue;
          const bh = bot.body[0];
          // wall death for bots too
          if (bh.x < 0 || bh.x > W || bh.y < 0 || bh.y > H) {
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
        }

        // respawn dead bots offscreen eventually
        s.bots.forEach((bot, i) => {
          if (bot.alive) return;
          if (Math.random() < dt * 0.3) {
            const ang = rand(0, Math.PI * 2);
            s.bots[i] = makeSnake(rand(100, W - 100), rand(100, H - 100), ang, 8 + Math.floor(Math.random() * 4), bot.color);
          }
        });

        // score = length * 10
        const newLen = s.me.body.length;
        if (newLen !== len) {
          setLen(newLen);
          setScore(newLen * 10);
        }

        if (!s.me.alive) {
          setStatus('dead');
          const finalScore = s.me.body.length * 10;
          if (!submittedRef.current) {
            submittedRef.current = true;
            submitScore('slither', finalScore, { length: s.me.body.length });
            if (finalScore > best) {
              setBest(finalScore);
              localStorage.setItem('pd-coil-best', String(finalScore));
            }
          }
        }
      }

      draw();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [status, len, best]);

  return (
    <div className="coil">
      <div className="coil-bar">
        <span>Length <b style={{color:'var(--accent)'}}>{len}</b></span>
        <span>Score <b>{score}</b></span>
        <span>Best <b>{best}</b></span>
        {status === 'dead' && (
          <button className="btn btn-primary btn-sm" onClick={reset}>Play again</button>
        )}
      </div>
      <canvas ref={canvasRef} className="coil-canvas" width={W} height={H} tabIndex={0}/>
      {status === 'dead' && (
        <div className="coil-death">Final coil: <b>{len}</b> · score <b style={{color:'var(--accent)'}}>{score}</b></div>
      )}
      <div className="coil-hint">Drag finger or move mouse to steer · WASD / arrows also work · don't touch anything that isn't food</div>
    </div>
  );
}
