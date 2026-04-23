import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

const W = 700;
const H = 440;
const GROUND = 400;
const GRAVITY = 0.38;
const GRAB_RANGE = 240;

const LEVELS = [
  {
    length: 1800,
    start: [80, 260],
    anchors: [[220, 140], [440, 200], [680, 120], [920, 220], [1160, 140], [1400, 220], [1620, 160]],
    goal: 1760,
  },
  {
    length: 2400,
    start: [80, 280],
    anchors: [[220, 180], [430, 120], [620, 220], [840, 140], [1080, 200], [1300, 120], [1520, 220], [1720, 160], [1940, 240], [2180, 160]],
    goal: 2340,
  },
  {
    length: 2800,
    start: [80, 260],
    anchors: [[240, 180], [420, 260], [620, 160], [820, 240], [1020, 140], [1240, 220], [1480, 120], [1720, 220], [1960, 140], [2180, 240], [2420, 160], [2640, 200]],
    goal: 2760,
  },
];

export default function StickmanHookGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [levelIdx, setLevelIdx] = useState(0);
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'lost'

  const resetLevel = (idx) => {
    const L = LEVELS[idx];
    stateRef.current = {
      x: L.start[0], y: L.start[1],
      px: L.start[0], py: L.start[1], // previous (for verlet)
      attached: null,                  // anchor index
      ropeLen: 0,
      grabHeld: false,
      camera: 0,
    };
    setStatus('playing');
  };

  useEffect(() => { resetLevel(levelIdx); }, [levelIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const s = stateRef.current;
      const L = LEVELS[levelIdx];
      if (!s) return;

      // camera follows player
      const cam = Math.max(0, Math.min(s.x - W / 2 + 80, L.length - W));
      s.camera = cam;

      // sky (gradient handled by CSS background, paint transparent here)
      ctx.clearRect(0, 0, W, H);

      // clouds (parallax)
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 420 - cam * 0.3) % (L.length + 400));
        ctx.beginPath();
        ctx.ellipse(cx, 70 + (i % 3) * 20, 36, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ground (world-space)
      ctx.fillStyle = '#3a5a2a';
      ctx.fillRect(-cam, GROUND, L.length, H - GROUND);
      ctx.strokeStyle = '#1f3b14';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-cam, GROUND); ctx.lineTo(L.length - cam, GROUND);
      ctx.stroke();

      // anchors
      L.anchors.forEach(([ax, ay], i) => {
        const x = ax - cam;
        if (x < -20 || x > W + 20) return;
        // outer glow
        ctx.beginPath();
        ctx.arc(x, ay, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fill();
        // ring
        ctx.beginPath();
        ctx.arc(x, ay, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        // core
        ctx.beginPath();
        ctx.arc(x, ay, 5, 0, Math.PI * 2);
        ctx.fillStyle = s.attached === i ? '#ffe14f' : '#9b4ff0';
        ctx.fill();
      });

      // goal flag
      const gx = L.goal - cam;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND); ctx.lineTo(gx, GROUND - 80);
      ctx.stroke();
      ctx.fillStyle = '#35f0c9';
      ctx.beginPath();
      ctx.moveTo(gx, GROUND - 80);
      ctx.lineTo(gx + 28, GROUND - 70);
      ctx.lineTo(gx, GROUND - 60);
      ctx.closePath();
      ctx.fill();

      // rope
      if (s.attached !== null) {
        const [ax, ay] = L.anchors[s.attached];
        ctx.strokeStyle = '#ffe14f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax - cam, ay);
        ctx.lineTo(s.x - cam, s.y);
        ctx.stroke();
      }

      // stickman
      const px = s.x - cam, py = s.y;
      ctx.strokeStyle = '#0a0d0e';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      // body
      ctx.beginPath();
      ctx.moveTo(px, py - 6);
      ctx.lineTo(px, py + 18);
      ctx.stroke();
      // head
      ctx.beginPath();
      ctx.arc(px, py - 14, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0d0e';
      ctx.fill();
      // arms (if attached, up toward anchor)
      if (s.attached !== null) {
        const [ax, ay] = L.anchors[s.attached];
        const dx = (ax - cam) - px, dy = ay - py;
        const d = Math.hypot(dx, dy) || 1;
        const ux = dx / d, uy = dy / d;
        ctx.beginPath();
        ctx.moveTo(px - 6, py);
        ctx.lineTo(px + ux * 14, py + uy * 14);
        ctx.moveTo(px + 6, py);
        ctx.lineTo(px + ux * 14, py + uy * 14);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(px - 10, py + 2);
        ctx.lineTo(px + 10, py + 2);
        ctx.stroke();
      }
      // legs
      ctx.beginPath();
      ctx.moveTo(px, py + 18);
      ctx.lineTo(px - 8, py + 30);
      ctx.moveTo(px, py + 18);
      ctx.lineTo(px + 8, py + 30);
      ctx.stroke();
    };

    const tryAttach = (s) => {
      const L = LEVELS[levelIdx];
      if (!s.grabHeld || s.attached !== null) return;
      let best = -1, bestD = GRAB_RANGE;
      L.anchors.forEach(([ax, ay], i) => {
        const d = Math.hypot(ax - s.x, ay - s.y);
        if (d < bestD) { best = i; bestD = d; }
      });
      if (best >= 0) {
        s.attached = best;
        s.ropeLen = bestD;
      }
    };

    const step = () => {
      const s = stateRef.current;
      const L = LEVELS[levelIdx];
      if (!s) { raf = requestAnimationFrame(step); return; }

      if (status === 'playing') {
        tryAttach(s);

        // Verlet integration
        let vx = s.x - s.px;
        let vy = s.y - s.py;
        vx *= 0.999;
        vy *= 0.999;

        s.px = s.x; s.py = s.y;
        s.x += vx;
        s.y += vy + GRAVITY;

        // Rope constraint
        if (s.attached !== null) {
          const [ax, ay] = L.anchors[s.attached];
          const dx = s.x - ax, dy = s.y - ay;
          const d = Math.hypot(dx, dy);
          if (d > s.ropeLen) {
            const ratio = s.ropeLen / d;
            s.x = ax + dx * ratio;
            s.y = ay + dy * ratio;
          }
        }

        // Win
        if (s.x >= L.goal) {
          setStatus('won');
          // Bigger score for later levels
          submitScore('hook', (levelIdx + 1) * 100, { level: levelIdx + 1 });
        }

        // Die conditions
        if (s.y + 30 >= GROUND) { setStatus('lost'); }
        if (s.x < -30 || s.y > H + 80) { setStatus('lost'); }
      }

      draw();
      raf = requestAnimationFrame(step);
    };

    let raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [levelIdx, status]);

  const onDown = () => { const s = stateRef.current; if (s) s.grabHeld = true; };
  const onUp   = () => { const s = stateRef.current; if (s) { s.grabHeld = false; s.attached = null; } };

  useEffect(() => {
    const kd = (e) => { if (e.code === 'Space') { e.preventDefault(); onDown(); } };
    const ku = (e) => { if (e.code === 'Space') { e.preventDefault(); onUp(); } };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  const next = () => {
    if (levelIdx < LEVELS.length - 1) setLevelIdx(levelIdx + 1);
    else setLevelIdx(0);
  };
  const doRetry = () => {
    const i = levelIdx;
    setLevelIdx(-1);
    setTimeout(() => setLevelIdx(i), 0);
  };

  return (
    <div className="hook">
      <div className="hook-bar">
        <span>Level <b>{levelIdx + 1}/{LEVELS.length}</b></span>
        <button className="btn btn-ghost btn-sm" onClick={doRetry}>Retry</button>
      </div>
      <canvas
        ref={canvasRef}
        className="hook-canvas"
        width={W}
        height={H}
        onMouseDown={onDown}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={(e) => { e.preventDefault(); onDown(); }}
        onTouchEnd={(e) => { e.preventDefault(); onUp(); }}/>
      {status !== 'playing' && (
        <div className="hook-bar">
          <span style={{color: status === 'won' ? 'var(--accent)' : '#ff4d6d', fontWeight: 700}}>
            {status === 'won' ? 'Level cleared' : 'Wiped out'}
          </span>
          {status === 'won'
            ? <button className="btn btn-primary btn-sm" onClick={next}>
                {levelIdx < LEVELS.length - 1 ? 'Next level' : 'Restart'}
              </button>
            : <button className="btn btn-primary btn-sm" onClick={doRetry}>Retry</button>}
        </div>
      )}
      <div className="hook-hint">Hold Space / mouse / touch to grab the nearest anchor · release to fling</div>
    </div>
  );
}
