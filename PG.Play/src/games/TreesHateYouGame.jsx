import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

const W = 760;
const H = 380;
const GROUND = 320;
const LEVEL_LEN = 3600;
const GOAL_X = 3520;
const PLAYER_R = 12;

// Six slapstick trap kinds. Each has its own trigger range + tell.
const TRAP_KINDS = ['punch', 'cannon', 'log', 'spike', 'saw', 'arrow'];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 20 trees, evenly spaced across the level.
const TREE_COUNT = 20;
const BASE_TREES = Array.from({ length: TREE_COUNT }).map((_, i) => ({
  x: 180 + i * 170,
}));

const initTrees = (armedCount) => {
  const order = BASE_TREES.map((_, i) => i).sort(() => Math.random() - 0.5);
  const armed = new Set(order.slice(0, Math.min(armedCount, TREE_COUNT)));
  return BASE_TREES.map((t, i) => ({
    ...t,
    trap: armed.has(i) ? pick(TRAP_KINDS) : null,
    triggered: false,
    anim: 0,
    ballX: 0, ballY: 0, ballVX: 0, ballVY: 0,
    logY: 0,
    sawAngle: 0,
    sawSwing: rand(-1, 1) > 0 ? 1 : -1,
    spikeActive: false,
    spikeTimer: 0,
    arrows: [], // {x, y, vx}
    arrowTimer: 0,
  }));
};

export default function TreesHateYouGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [deaths, setDeaths] = useState(0);
  const [best, setBest] = useState(Infinity);
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'dead'
  const startTimeRef = useRef(performance.now());

  const reset = (freshDeathCount = 0) => {
    const armed = Math.min(5 + freshDeathCount, TREE_COUNT - 2);
    stateRef.current = {
      player: { x: 80, y: GROUND - PLAYER_R, vx: 0, vy: 0, onGround: true, flash: 0 },
      trees: initTrees(armed),
      camera: 0,
      shake: 0,
      particles: [],
    };
    startTimeRef.current = performance.now();
    setStatus('playing');
  };

  useEffect(() => { reset(0); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const keys = { left: false, right: false, jump: false };
    const kd = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); }
      if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') { keys.jump = true; e.preventDefault(); }
      if (e.key === 'r' || e.key === 'R') { reset(deaths); }
    };
    const ku = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
      if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.jump = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const kill = () => {
      if (status !== 'playing') return;
      const nextDeaths = deaths + 1;
      setDeaths(nextDeaths);
      setStatus('dead');
      const s = stateRef.current;
      if (s) {
        s.shake = 14;
        for (let i = 0; i < 18; i++) {
          s.particles.push({
            x: s.player.x, y: s.player.y,
            vx: rand(-3, 3), vy: rand(-6, -1),
            life: 40 + Math.random() * 20, color: i % 2 ? '#ff4d6d' : '#c91e1e',
          });
        }
      }
      setTimeout(() => reset(nextDeaths), 1000);
    };

    const win = () => {
      if (status !== 'playing') return;
      const t = (performance.now() - startTimeRef.current) / 1000;
      setBest((b) => Math.min(b, deaths));
      setStatus('won');
      // Lower deaths = higher score. Cap at ~500.
      const score = Math.max(0, Math.round(500 - deaths * 18 - t));
      submitScore('treeshate', score, { deaths, time: Math.round(t) });
    };

    const step = () => {
      const s = stateRef.current;
      if (!s) { raf = requestAnimationFrame(step); return; }

      if (status === 'playing') {
        const p = s.player;

        // Movement
        const accel = 0.45;
        const friction = 0.82;
        if (keys.left)  p.vx -= accel;
        if (keys.right) p.vx += accel;
        p.vx *= friction;
        if (Math.abs(p.vx) < 0.02) p.vx = 0;
        p.vx = Math.max(-3.8, Math.min(3.8, p.vx));

        if (keys.jump && p.onGround) { p.vy = -7.6; p.onGround = false; }

        p.vy += 0.42;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y >= GROUND - PLAYER_R) { p.y = GROUND - PLAYER_R; p.vy = 0; p.onGround = true; }
        p.x = Math.max(0, Math.min(LEVEL_LEN - 20, p.x));

        const cam = Math.max(0, Math.min(p.x - W / 2 + 100, LEVEL_LEN - W));
        s.camera = cam;

        if (p.flash > 0) p.flash--;

        // Trees
        s.trees.forEach((t) => {
          if (t.trap && !t.triggered) {
            const range = t.trap === 'arrow' ? 160 : t.trap === 'cannon' ? 110 : 75;
            if (Math.abs(p.x - t.x) < range) {
              t.triggered = true;
              t.anim = 0;
              if (t.trap === 'cannon') {
                const dir = p.x < t.x ? -1 : 1;
                t.ballX = t.x;
                t.ballY = GROUND - 130;
                t.ballVX = 4.8 * dir;
                t.ballVY = -1.4;
              }
              if (t.trap === 'log') { t.logY = -30; }
              if (t.trap === 'spike') { t.spikeActive = false; t.spikeTimer = 30; }
              if (t.trap === 'saw') { t.sawAngle = 0; }
              if (t.trap === 'arrow') { t.arrowTimer = 18; }
            }
          }

          if (t.triggered) {
            t.anim += 1 / 28;

            if (t.trap === 'punch') {
              if (t.anim > 0.2 && t.anim < 0.55) {
                if (Math.abs(p.x - t.x) < 60 && p.y > GROUND - 56) kill();
              }
            }

            if (t.trap === 'cannon') {
              t.ballX += t.ballVX;
              t.ballY += t.ballVY;
              t.ballVY += 0.2;
              if (Math.hypot(t.ballX - p.x, t.ballY - p.y) < PLAYER_R + 9) kill();
            }

            if (t.trap === 'log') {
              t.logY += 7;
              if (t.logY > 140 && Math.abs(p.x - t.x) < 36 && p.y > GROUND - 40) kill();
            }

            if (t.trap === 'spike') {
              t.spikeTimer--;
              if (t.spikeTimer <= 0 && !t.spikeActive) { t.spikeActive = true; }
              if (t.spikeActive) {
                if (Math.abs(p.x - t.x) < 30 && p.y > GROUND - 30) kill();
              }
            }

            if (t.trap === 'saw') {
              t.sawAngle += 0.08;
              const swingRange = 90;
              const sx = t.x + Math.sin(t.sawAngle) * swingRange;
              const sy = GROUND - 90;
              if (Math.hypot(sx - p.x, sy - p.y) < PLAYER_R + 18) kill();
              t.lastSawX = sx; t.lastSawY = sy;
            }

            if (t.trap === 'arrow') {
              t.arrowTimer--;
              if (t.arrowTimer <= 0) {
                const dir = p.x < t.x ? -1 : 1;
                t.arrows.push({ x: t.x, y: GROUND - 80, vx: 6.5 * dir });
                t.arrowTimer = 55;
              }
              for (let i = t.arrows.length - 1; i >= 0; i--) {
                const a = t.arrows[i];
                a.x += a.vx;
                if (Math.abs(a.x - p.x) < PLAYER_R && Math.abs(a.y - p.y) < PLAYER_R + 4) { kill(); }
                if (a.x < -20 || a.x > LEVEL_LEN + 20) t.arrows.splice(i, 1);
              }
            }
          }
        });

        if (p.x >= GOAL_X) win();
      }

      // Particles
      s.particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.25;
        pt.life--;
      });
      s.particles = s.particles.filter((pt) => pt.life > 0);

      if (s.shake > 0) s.shake--;

      // ── Render
      const cam = s.camera;
      const sx = (Math.random() - 0.5) * s.shake;
      const sy = (Math.random() - 0.5) * s.shake;
      ctx.save();
      ctx.translate(sx, sy);

      // Sky
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#5ac7f5');
      grad.addColorStop(0.6, '#a0dff4');
      grad.addColorStop(1, '#d9f2ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 380 - cam * 0.2) % (W + 400)) - 200;
        ctx.beginPath();
        ctx.ellipse(cx, 60 + (i % 3) * 20, 40, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant parallax trees
      ctx.fillStyle = 'rgba(30, 110, 50, 0.45)';
      for (let i = 0; i < 24; i++) {
        const x = ((i * 170 - cam * 0.4) % (LEVEL_LEN + 200));
        ctx.beginPath();
        ctx.moveTo(x, 300);
        ctx.lineTo(x + 28, 220);
        ctx.lineTo(x + 56, 300);
        ctx.closePath();
        ctx.fill();
      }

      // Ground
      ctx.fillStyle = '#5a7c3a';
      ctx.fillRect(-cam, GROUND, LEVEL_LEN, H - GROUND);
      ctx.fillStyle = '#3f5a24';
      for (let i = 0; i < 60; i++) {
        const gx = (i * 64) - cam;
        if (gx < -80 || gx > W + 80) continue;
        ctx.fillRect(gx, GROUND + 6, 2, 8);
        ctx.fillRect(gx + 14, GROUND + 10, 2, 6);
      }
      ctx.strokeStyle = '#2f4a1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-cam, GROUND); ctx.lineTo(LEVEL_LEN - cam, GROUND);
      ctx.stroke();

      // Trees
      s.trees.forEach((t) => {
        const tx = t.x - cam;
        if (tx < -120 || tx > W + 120) return;
        // trunk
        ctx.fillStyle = '#6b3a1a';
        ctx.fillRect(tx - 11, GROUND - 115, 22, 115);
        // canopy
        ctx.fillStyle = '#2f6a2a';
        ctx.beginPath();
        ctx.arc(tx, GROUND - 140, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tx - 28, GROUND - 120, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tx + 28, GROUND - 120, 32, 0, Math.PI * 2);
        ctx.fill();

        if (t.triggered) {
          // red eyes
          ctx.fillStyle = '#ff4d6d';
          ctx.beginPath();
          ctx.arc(tx - 9, GROUND - 88, 3.6, 0, Math.PI * 2);
          ctx.arc(tx + 9, GROUND - 88, 3.6, 0, Math.PI * 2);
          ctx.fill();
          // brow
          ctx.strokeStyle = '#0a0d0e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tx - 14, GROUND - 94); ctx.lineTo(tx - 5, GROUND - 92);
          ctx.moveTo(tx + 5, GROUND - 92);  ctx.lineTo(tx + 14, GROUND - 94);
          ctx.stroke();

          if (t.trap === 'punch' && t.anim < 0.7) {
            const dir = (t.anim < 0.5) ? 1 : -1;
            const swing = Math.sin(Math.min(1, t.anim * 2) * Math.PI) * 56;
            ctx.strokeStyle = '#8a4a1a';
            ctx.lineWidth = 9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tx, GROUND - 60);
            ctx.lineTo(tx + swing * dir, GROUND - 40);
            ctx.stroke();
            ctx.fillStyle = '#c08040';
            ctx.beginPath();
            ctx.arc(tx + swing * dir, GROUND - 40, 11, 0, Math.PI * 2);
            ctx.fill();
          }
          if (t.trap === 'cannon') {
            ctx.fillStyle = '#222';
            ctx.fillRect(tx - 14, GROUND - 140, 28, 16);
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(t.ballX - cam, t.ballY, 9, 0, Math.PI * 2);
            ctx.fill();
          }
          if (t.trap === 'log') {
            ctx.fillStyle = '#5a2a0a';
            ctx.fillRect(tx - 24, GROUND - 160 + t.logY, 48, 22);
            ctx.strokeStyle = '#3a1a05';
            ctx.lineWidth = 2;
            ctx.strokeRect(tx - 24, GROUND - 160 + t.logY, 48, 22);
            // rings on log
            ctx.strokeStyle = '#4a2005';
            ctx.beginPath();
            ctx.arc(tx - 24, GROUND - 149 + t.logY, 5, 0, Math.PI * 2);
            ctx.arc(tx + 24, GROUND - 149 + t.logY, 5, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (t.trap === 'spike') {
            if (t.spikeActive) {
              ctx.fillStyle = '#9aa0a8';
              for (let i = -2; i <= 2; i++) {
                const bx = tx + i * 10;
                ctx.beginPath();
                ctx.moveTo(bx - 5, GROUND);
                ctx.lineTo(bx, GROUND - 22);
                ctx.lineTo(bx + 5, GROUND);
                ctx.closePath();
                ctx.fill();
              }
            } else {
              // dirt mound tell
              ctx.fillStyle = '#6b4a1a';
              ctx.fillRect(tx - 14, GROUND - 3, 28, 3);
            }
          }
          if (t.trap === 'saw') {
            const sawX = t.lastSawX ?? t.x;
            const sawY = t.lastSawY ?? GROUND - 90;
            const sx = sawX - cam;
            // chain
            ctx.strokeStyle = '#2a2a2a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tx, GROUND - 170);
            ctx.lineTo(sx, sawY);
            ctx.stroke();
            // blade
            ctx.fillStyle = '#c0c0c0';
            ctx.beginPath();
            ctx.arc(sx, sawY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#9aa0a8';
            for (let k = 0; k < 10; k++) {
              const a = (k * 36 + t.sawAngle * 100) * Math.PI / 180;
              ctx.beginPath();
              ctx.moveTo(sx + Math.cos(a) * 12, sawY + Math.sin(a) * 12);
              ctx.lineTo(sx + Math.cos(a + 0.2) * 22, sawY + Math.sin(a + 0.2) * 22);
              ctx.lineTo(sx + Math.cos(a + 0.4) * 12, sawY + Math.sin(a + 0.4) * 12);
              ctx.closePath();
              ctx.fill();
            }
            ctx.fillStyle = '#2a2a2a';
            ctx.beginPath();
            ctx.arc(sx, sawY, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          if (t.trap === 'arrow') {
            // bow strap + arrows
            t.arrows.forEach((a) => {
              const ax = a.x - cam;
              ctx.strokeStyle = '#5a3a1a';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(ax - 12 * Math.sign(a.vx), a.y);
              ctx.lineTo(ax, a.y);
              ctx.stroke();
              ctx.fillStyle = '#9aa0a8';
              ctx.beginPath();
              const tip = Math.sign(a.vx);
              ctx.moveTo(ax, a.y);
              ctx.lineTo(ax - 6 * tip, a.y - 3);
              ctx.lineTo(ax - 6 * tip, a.y + 3);
              ctx.closePath();
              ctx.fill();
            });
          }
        } else if (t.trap === 'spike') {
          // subtle fresh-dirt hint for spike even when not triggered yet
          ctx.fillStyle = '#4a3210';
          ctx.fillRect(tx - 10, GROUND - 2, 20, 2);
        }
      });

      // Goal flag
      const gx = GOAL_X - cam;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND); ctx.lineTo(gx, GROUND - 90);
      ctx.stroke();
      ctx.fillStyle = '#ffe14f';
      ctx.beginPath();
      ctx.moveTo(gx, GROUND - 90);
      ctx.lineTo(gx + 34, GROUND - 78);
      ctx.lineTo(gx, GROUND - 66);
      ctx.closePath();
      ctx.fill();

      // Particles
      s.particles.forEach((pt) => {
        ctx.globalAlpha = Math.min(1, pt.life / 30);
        ctx.fillStyle = pt.color;
        ctx.fillRect((pt.x - cam) - 2, pt.y - 2, 4, 4);
        ctx.globalAlpha = 1;
      });

      // Player
      const px = s.player.x - cam;
      const py = s.player.y;
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.arc(px, py - 2, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd1a6';
      ctx.beginPath();
      ctx.arc(px, py - 22, 8, 0, Math.PI * 2);
      ctx.fill();
      // eyes (little terrified dots)
      ctx.fillStyle = '#0a0d0e';
      ctx.beginPath();
      ctx.arc(px - 2, py - 23, 1.2, 0, Math.PI * 2);
      ctx.arc(px + 3, py - 23, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Death / win flashes (screen-space)
      if (status === 'dead') {
        ctx.fillStyle = 'rgba(200, 30, 30, 0.35)';
        ctx.fillRect(0, 0, W, H);
      }
      if (status === 'won') {
        ctx.fillStyle = 'rgba(0, 255, 245, 0.18)';
        ctx.fillRect(0, 0, W, H);
      }

      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [status, deaths]);

  return (
    <div className="treeshate">
      <div className="treeshate-bar">
        <span>Deaths <b>{deaths}</b></span>
        {isFinite(best) && <span>Best <b>{best}</b></span>}
        <span>Goal <b style={{color: 'var(--accent)'}}>→ flag</b></span>
        <button className="btn btn-ghost btn-sm" onClick={() => { setDeaths(0); reset(0); }}>Start over</button>
      </div>
      <canvas ref={canvasRef} className="treeshate-canvas" width={W} height={H} tabIndex={0}/>
      {status === 'won' && (
        <div className="treeshate-bar">
          <span style={{color: 'var(--accent)', fontWeight: 700}}>
            Cleared · {deaths} death{deaths === 1 ? '' : 's'}
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => { setDeaths(0); reset(0); }}>
            Play again
          </button>
        </div>
      )}
      <div className="treeshate-hint">A/D or ←/→ to move · Space / W to jump · R to reset · trees aren't your friends</div>
    </div>
  );
}
