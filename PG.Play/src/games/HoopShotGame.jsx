// HOOP SHOT — original drag-aim-release basketball.
//
//  • Single-player, 90-second run. Touch-native: press the ball, drag back
//    to set aim + power (like a slingshot), release to shoot.
//  • Hoop slides slowly left/right. Clean swishes score 3 points; rim hits
//    score 2. Score submitted to the platform score bus on time-up.
//  • Streak bonus: consecutive makes add +1 per made shot in a row.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

const W = 720;
const H = 460;
const RUN_SECONDS = 90;
const FLOOR_Y = 410;
const BALL_R = 16;
const GRAVITY = 1200;         // px/s^2
const DRAG = 0.18;
const POWER_MAX = 1200;        // peak initial speed
const POWER_DRAW_MAX = 160;    // max draw distance

const HOOP = {
  y: 130,
  w: 64,                       // rim inner width
  backboardW: 12,
  netH: 36,
  baseX: 540,                  // starts on the right
};

// Pixel-accurate rim: two short horizontal posts at y = HOOP.y, separated by HOOP.w.

export default function HoopShotGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('pd-hoop-best') || 0));
  const [time, setTime] = useState(RUN_SECONDS);
  const [status, setStatus] = useState('playing'); // 'playing' | 'ended'
  const [shots, setShots] = useState(0);
  const [made, setMade] = useState(0);

  const reset = () => {
    stateRef.current = {
      ball: { x: 140, y: FLOOR_Y - BALL_R, vx: 0, vy: 0, flying: false, settled: true },
      draw: null,               // { startX, startY, x, y }
      hoopX: HOOP.baseX,
      hoopDir: -1,
      hoopSpeed: 60,            // px/sec, ramps with score
      particles: [],
      scoredThisShot: false,
      clock: performance.now(),
      timeLeft: RUN_SECONDS,
    };
    setScore(0); setStreak(0); setTime(RUN_SECONDS); setShots(0); setMade(0);
    setStatus('playing');
  };

  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const rectOf = () => canvas.getBoundingClientRect();
    const toLocal = (cx, cy) => {
      const r = rectOf();
      return { x: (cx - r.left) * (W / r.width), y: (cy - r.top) * (H / r.height) };
    };

    const beginDraw = (x, y) => {
      const s = stateRef.current; if (!s || status !== 'playing') return;
      // Must start near the ball
      if (!s.ball.settled) return;
      const d = Math.hypot(x - s.ball.x, y - s.ball.y);
      if (d > 48) return;
      s.draw = { startX: s.ball.x, startY: s.ball.y, x, y };
    };
    const moveDraw = (x, y) => {
      const s = stateRef.current; if (!s || !s.draw) return;
      s.draw.x = x; s.draw.y = y;
    };
    const endDraw = () => {
      const s = stateRef.current; if (!s || !s.draw) return;
      // Shoot in direction opposite the drag.
      const dx = s.draw.startX - s.draw.x;
      const dy = s.draw.startY - s.draw.y;
      const drawLen = Math.min(POWER_DRAW_MAX, Math.hypot(dx, dy));
      const power = (drawLen / POWER_DRAW_MAX) * POWER_MAX;
      const ang = Math.atan2(dy, dx);
      s.ball.vx = Math.cos(ang) * power;
      s.ball.vy = Math.sin(ang) * power;
      s.ball.flying = true;
      s.ball.settled = false;
      s.scoredThisShot = false;
      s.draw = null;
      setShots((n) => n + 1);
    };

    const onMouseDown = (e) => { const p = toLocal(e.clientX, e.clientY); beginDraw(p.x, p.y); };
    const onMouseMove = (e) => { const p = toLocal(e.clientX, e.clientY); moveDraw(p.x, p.y); };
    const onMouseUp   = ()  => endDraw();
    const onTouchStart = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      const p = toLocal(e.touches[0].clientX, e.touches[0].clientY);
      beginDraw(p.x, p.y);
    };
    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      const p = toLocal(e.touches[0].clientX, e.touches[0].clientY);
      moveDraw(p.x, p.y);
    };
    const onTouchEnd = (e) => { e.preventDefault(); endDraw(); };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });

    const draw = () => {
      const s = stateRef.current; if (!s) return;

      // backdrop
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#ff8a3a');
      grad.addColorStop(1, '#c84d1a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // crowd silhouettes
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      for (let i = 0; i < 26; i++) {
        const x = i * 30;
        const h = 40 + ((i * 13) % 20);
        ctx.beginPath();
        ctx.arc(x + 12, FLOOR_Y - h + 6, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x, FLOOR_Y - h + 10, 24, h - 10);
      }

      // court
      ctx.fillStyle = '#a85a2a';
      ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, FLOOR_Y); ctx.lineTo(W, FLOOR_Y);
      ctx.stroke();
      // key arc
      ctx.beginPath();
      ctx.arc(140, FLOOR_Y, 60, Math.PI, 2 * Math.PI);
      ctx.stroke();

      // hoop
      const hx = s.hoopX;
      // backboard
      ctx.fillStyle = '#fff';
      ctx.fillRect(hx + HOOP.w / 2 + 2, HOOP.y - 50, HOOP.backboardW, 60);
      ctx.strokeStyle = '#1a1a1a';
      ctx.strokeRect(hx + HOOP.w / 2 + 2, HOOP.y - 50, HOOP.backboardW, 60);
      // rim
      ctx.strokeStyle = '#ff4d6d';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(hx - HOOP.w / 2, HOOP.y);
      ctx.lineTo(hx + HOOP.w / 2, HOOP.y);
      ctx.stroke();
      // net
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        const topX = hx - HOOP.w / 2 + t * HOOP.w;
        const botX = hx - HOOP.w / 4 + t * HOOP.w / 2;
        ctx.beginPath();
        ctx.moveTo(topX, HOOP.y);
        ctx.lineTo(botX, HOOP.y + HOOP.netH);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(hx - HOOP.w / 4, HOOP.y + HOOP.netH);
      ctx.lineTo(hx + HOOP.w / 4, HOOP.y + HOOP.netH);
      ctx.stroke();

      // ball
      const ball = s.ball;
      ctx.fillStyle = '#ff8a3a';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2a1a0a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // seams
      ctx.beginPath();
      ctx.moveTo(ball.x - BALL_R, ball.y);
      ctx.lineTo(ball.x + BALL_R, ball.y);
      ctx.moveTo(ball.x, ball.y - BALL_R);
      ctx.lineTo(ball.x, ball.y + BALL_R);
      ctx.stroke();

      // aim line
      if (s.draw) {
        const dx = s.draw.startX - s.draw.x;
        const dy = s.draw.startY - s.draw.y;
        const drawLen = Math.min(POWER_DRAW_MAX, Math.hypot(dx, dy));
        const t = drawLen / POWER_DRAW_MAX;
        ctx.strokeStyle = `rgba(255,255,255,${0.35 + t * 0.4})`;
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x + dx, ball.y + dy);
        ctx.stroke();
        ctx.setLineDash([]);

        // power ring
        ctx.strokeStyle = t > 0.85 ? '#ff4d6d' : t > 0.5 ? '#ffe14f' : '#35f0c9';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t);
        ctx.stroke();
      }

      // particles
      s.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 30));
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.globalAlpha = 1;
      });
    };

    const clock = { last: performance.now() };
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s) return;

      if (status === 'playing') {
        // Clock
        s.timeLeft -= dt;
        if (s.timeLeft <= 0) {
          s.timeLeft = 0;
          setTime(0);
          setStatus('ended');
          // Final score submit once
          const finalScore = scoreRef.current;
          if (finalScore > best) {
            setBest(finalScore);
            localStorage.setItem('pd-hoop-best', String(finalScore));
          }
          submitScore('basket', finalScore, { made, shots });
        } else {
          setTime(Math.ceil(s.timeLeft));
        }

        // Hoop slides
        s.hoopX += s.hoopDir * s.hoopSpeed * dt;
        if (s.hoopX < 360) { s.hoopX = 360; s.hoopDir = 1; }
        if (s.hoopX > 640) { s.hoopX = 640; s.hoopDir = -1; }

        // Ball physics
        const ball = s.ball;
        if (ball.flying) {
          ball.vy += GRAVITY * dt;
          ball.vx *= (1 - DRAG * dt);
          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;

          // floor
          if (ball.y + BALL_R >= FLOOR_Y) {
            ball.y = FLOOR_Y - BALL_R;
            if (Math.abs(ball.vy) < 120) {
              ball.vy = 0; ball.vx = 0; ball.flying = false;
              // settle + reset to shooter spot after a moment
              setTimeout(() => {
                const st = stateRef.current; if (!st) return;
                st.ball.x = 140; st.ball.y = FLOOR_Y - BALL_R;
                st.ball.vx = 0; st.ball.vy = 0; st.ball.settled = true;
                st.ball.flying = false;
              }, 220);
            } else {
              ball.vy = -ball.vy * 0.55;
              ball.vx *= 0.85;
            }
          }
          // walls
          if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = -ball.vx * 0.7; }
          if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.vx = -ball.vx * 0.7; }
          // ceiling
          if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = -ball.vy * 0.7; }

          // rim collision + scoring
          const rimL = s.hoopX - HOOP.w / 2;
          const rimR = s.hoopX + HOOP.w / 2;
          const rimY = HOOP.y;
          // Net detect: ball passes through rim while moving down
          if (!s.scoredThisShot && ball.vy > 0
              && ball.y - BALL_R < rimY && ball.y + BALL_R > rimY
              && ball.x > rimL + 4 && ball.x < rimR - 4) {
            s.scoredThisShot = true;
            // Swish vs rim
            const cleanX = Math.abs(ball.x - s.hoopX) < HOOP.w / 2 - BALL_R - 2;
            const points = cleanX ? 3 : 2;
            setScore((cur) => {
              const next = cur + points + streakRef.current;
              scoreRef.current = next;
              return next;
            });
            setMade((m) => m + 1);
            setStreak((k) => {
              const next = k + 1;
              streakRef.current = next;
              return next;
            });
            // Particles
            for (let i = 0; i < 16; i++) {
              s.particles.push({ x: s.hoopX, y: rimY + HOOP.netH, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 120 - 60, life: 24 + Math.random() * 16, color: i % 2 ? '#ffe14f' : '#fff' });
            }
            // Ramp hoop speed as score grows
            s.hoopSpeed = Math.min(180, 60 + scoreRef.current * 1.2);
          } else {
            // Post bounce
            if (ball.y + BALL_R > rimY - 2 && ball.y - BALL_R < rimY + 2) {
              if (Math.abs(ball.x - rimL) < BALL_R) { ball.vx = -Math.abs(ball.vx) * 0.6; ball.x = rimL - BALL_R - 1; }
              if (Math.abs(ball.x - rimR) < BALL_R) { ball.vx =  Math.abs(ball.vx) * 0.6; ball.x = rimR + BALL_R + 1; }
            }
            // Backboard
            const bbX = s.hoopX + HOOP.w / 2 + 2;
            if (ball.y < rimY + 10 && ball.y > rimY - 55
                && ball.vx > 0 && ball.x + BALL_R > bbX && ball.x < bbX + HOOP.backboardW) {
              ball.vx = -Math.abs(ball.vx) * 0.6;
              ball.x = bbX - BALL_R - 1;
            }
          }

          // Miss = streak breaks on floor-settle. We detect by "a shot ended without scoring" —
          // simplest: if the ball settles (comes to rest) and we didn't score, reset streak.
          if (!s.ball.flying && !s.scoredThisShot && streakRef.current > 0) {
            streakRef.current = 0;
            setStreak(0);
          }
        }

        // particles
        s.particles.forEach((p) => {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.life -= 1;
        });
        s.particles = s.particles.filter((p) => p.life > 0);
      }

      draw();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Keep refs fresh so the RAF loop reads current score / streak without re-subscribing.
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { streakRef.current = streak; }, [streak]);

  return (
    <div className="hoop">
      <div className="hoop-bar">
        <span>Score <b style={{color:'var(--accent)'}}>{score}</b></span>
        <span>Streak <b>{streak}</b></span>
        <span>Made <b>{made}</b>/{shots}</span>
        <span>Best <b>{best}</b></span>
        <span style={{marginLeft:'auto'}}>Time <b>{time}s</b></span>
        {status === 'ended' && (
          <button className="btn btn-primary btn-sm" onClick={reset}>Play again</button>
        )}
      </div>
      <canvas ref={canvasRef} className="hoop-canvas" width={W} height={H}/>
      <div className="hoop-hint">Press the ball, drag back to aim, release to shoot · swishes = 3 · rim kisses = 2 · streak adds +1 per make</div>
    </div>
  );
}
