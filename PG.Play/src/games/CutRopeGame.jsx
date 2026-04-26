import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';
import { sizeCanvasFluid } from '../util/canvasDpr.js';

// Three hand-tuned levels. Rope pin position + rope length + star positions +
// Om Nom position on the floor. Each rope is an idealized pendulum starting
// at rest — cut it and gravity takes over.
const LEVELS = [
  { pin: [300, 60],  rope: 180, omnom: 520, stars: [[260, 260], [380, 220], [500, 320]] },
  { pin: [180, 80],  rope: 200, omnom: 560, stars: [[300, 200], [420, 280], [540, 360]] },
  { pin: [420, 70],  rope: 220, omnom: 200, stars: [[360, 260], [280, 340], [220, 420]] },
];

const W = 620;
const H = 440;
const FLOOR = 410;
const CANDY_R = 18;
const STAR_R = 14;
const OMNOM_W = 80;
const OMNOM_Y = FLOOR - 18;

export default function CutRopeGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const viewRef = useRef({ cssW: W, cssH: H });
  const stateRef = useRef(null);
  const [levelIdx, setLevelIdx] = useState(0);
  const [stars, setStars] = useState(0);
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'lost'

  // Init / reset level
  useEffect(() => {
    const L = LEVELS[levelIdx];
    // Candy hangs straight down from pin at rest.
    stateRef.current = {
      rope: true,
      candy: { x: L.pin[0], y: L.pin[1] + L.rope, vx: 0, vy: 0, prevX: L.pin[0], prevY: L.pin[1] + L.rope },
      angle: 0,
      angV: 0,
      stars: L.stars.map(([x, y]) => ({ x, y, taken: false })),
      caught: 0,
    };
    setStars(0);
    setStatus('playing');
  }, [levelIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    // Fluid sizer — record the css size so draw can center the fixed
    // 620×440 level inside the available canvas. Pendulum physics keeps
    // running in the original 620×440 coord space.
    const dispose = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      viewRef.current = { cssW, cssH };
    });

    const draw = () => {
      const L = LEVELS[levelIdx];
      const s = stateRef.current;
      if (!s) return;
      const { cssW, cssH } = viewRef.current;

      // Atmospheric radial backdrop — slightly lighter at center, deep
      // obsidian-purple at the edges. Reads as "shadowed room", not "flat
      // fill". Built fresh per frame because cssW/cssH change with resize.
      const bgGrad = ctx.createRadialGradient(cssW / 2, cssH / 2, 0, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.7);
      bgGrad.addColorStop(0, '#1a0d22');
      bgGrad.addColorStop(1, '#070310');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      // Center the fixed 620×440 level inside the canvas.
      const offX = (cssW - W) / 2;
      const offY = (cssH - H) / 2;
      ctx.save();
      ctx.translate(offX, offY);

      // sky
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#2a1a3a');
      grad.addColorStop(1, '#0a0612');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // floor
      ctx.fillStyle = '#1a0d22';
      ctx.fillRect(0, FLOOR, W, H - FLOOR);
      ctx.strokeStyle = '#2a1a3a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke();

      // pin
      ctx.fillStyle = '#7a5a2a';
      ctx.beginPath(); ctx.arc(L.pin[0], L.pin[1], 8, 0, Math.PI * 2); ctx.fill();

      // rope (if still attached)
      if (s.rope) {
        ctx.strokeStyle = '#b9830b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(L.pin[0], L.pin[1]);
        ctx.lineTo(s.candy.x, s.candy.y);
        ctx.stroke();
      }

      // stars
      s.stars.forEach((st) => {
        if (st.taken) return;
        drawStar(ctx, st.x, st.y, STAR_R, '#ffe14f');
      });

      // Om Nom
      drawOmNom(ctx, L.omnom, OMNOM_Y);

      // candy
      const c = s.candy;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.roundRect?.(
        -CANDY_R, -CANDY_R, CANDY_R * 2, CANDY_R * 2, 8
      );
      if (!ctx.roundRect) {
        ctx.rect(-CANDY_R, -CANDY_R, CANDY_R * 2, CANDY_R * 2);
      }
      ctx.fill();
      // wrapper tails
      ctx.beginPath();
      ctx.moveTo(-CANDY_R, 0); ctx.lineTo(-CANDY_R - 10, -7);
      ctx.lineTo(-CANDY_R - 8, 0); ctx.lineTo(-CANDY_R - 10, 7);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(CANDY_R, 0); ctx.lineTo(CANDY_R + 10, -7);
      ctx.lineTo(CANDY_R + 8, 0); ctx.lineTo(CANDY_R + 10, 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();
    };

    const step = () => {
      const L = LEVELS[levelIdx];
      const s = stateRef.current;
      if (!s) { raf = requestAnimationFrame(step); return; }
      const c = s.candy;

      if (status === 'playing') {
        if (s.rope) {
          // Pendulum: small gravity-driven swing around pin.
          const DAMP = 0.996;
          const G = 0.0014; // angular gravity coeff per length
          const dx = c.x - L.pin[0];
          const dy = c.y - L.pin[1];
          const angle = Math.atan2(dx, dy); // 0 = straight down
          s.angV += -G * Math.sin(angle);
          s.angV *= DAMP;
          s.angle = angle + s.angV;
          c.prevX = c.x; c.prevY = c.y;
          c.x = L.pin[0] + Math.sin(s.angle) * L.rope;
          c.y = L.pin[1] + Math.cos(s.angle) * L.rope;
          c.vx = c.x - c.prevX;
          c.vy = c.y - c.prevY;
        } else {
          // Free fall with horizontal momentum.
          c.vy += 0.45;
          c.vx *= 0.998;
          c.x += c.vx;
          c.y += c.vy;
        }

        // Collect stars
        s.stars.forEach((st) => {
          if (st.taken) return;
          if (Math.hypot(c.x - st.x, c.y - st.y) < CANDY_R + STAR_R - 4) {
            st.taken = true;
            s.caught += 1;
            setStars(s.caught);
          }
        });

        // Om Nom catch (only after rope cut)
        if (!s.rope && c.y + CANDY_R >= OMNOM_Y - 10) {
          const within = Math.abs(c.x - L.omnom) < OMNOM_W / 2 + CANDY_R - 6;
          if (within && c.y <= FLOOR) {
            setStatus('won');
            // Score = stars × 100 + 200 for clearing the level
            submitScore('cutrope', s.caught * 100 + 200, { level: levelIdx + 1, stars: s.caught });
          }
        }

        // Lose conditions: off-screen sides, or hit the floor without Om Nom catch
        if (!s.rope && (c.x < -40 || c.x > W + 40 || c.y > FLOOR + 20)) {
          if (status === 'playing') setStatus('lost');
        }
      }

      draw();
      raf = requestAnimationFrame(step);
    };

    let raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      dispose();
    };
  }, [levelIdx, status]);

  const rectOf = () => canvasRef.current.getBoundingClientRect();
  const cut = (clientX, clientY) => {
    const s = stateRef.current;
    if (!s || !s.rope || status !== 'playing') return;
    const r = rectOf();
    // Canvas now fills its parent (style 100%/100%). The level is rendered
    // centered inside it, so subtract the center offset so the click lands
    // in level coords.
    const offX = (r.width  - W) / 2;
    const offY = (r.height - H) / 2;
    const x = (clientX - r.left) - offX;
    const y = (clientY - r.top)  - offY;
    const L = LEVELS[levelIdx];
    // Distance from click to rope segment.
    const d = distToSegment(x, y, L.pin[0], L.pin[1], s.candy.x, s.candy.y);
    if (d < 14) {
      s.rope = false;
      // Preserve velocity from pendulum motion at cut moment
      const c = s.candy;
      c.vx = (c.x - c.prevX) * 1.1;
      c.vy = (c.y - c.prevY) * 1.1;
    }
  };

  const onMouseDown = (e) => cut(e.clientX, e.clientY);
  const onTouchStart = (e) => { const t = e.touches[0]; cut(t.clientX, t.clientY); };

  const next = () => {
    if (levelIdx < LEVELS.length - 1) setLevelIdx(levelIdx + 1);
    else setLevelIdx(0);
  };
  const retry = () => setLevelIdx(levelIdx); // retrigger effect via dep dance
  // simpler retry: re-set to same idx (force init by cycling)
  const doRetry = () => {
    const i = levelIdx;
    setLevelIdx(-1);
    setTimeout(() => setLevelIdx(i), 0);
  };

  return (
    <div className="cutrope">
      <div className="cutrope-bar">
        <span>Level <b>{levelIdx + 1}/{LEVELS.length}</b></span>
        <span>Stars <b>{stars}/3</b></span>
        <button className="btn btn-ghost btn-sm" onClick={doRetry}>Retry</button>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          className="cutrope-canvas"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}/>
      </div>
      {status !== 'playing' && (
        <div className="cutrope-bar">
          <span style={{color: status === 'won' ? 'var(--accent)' : '#ff4d6d', fontWeight: 700}}>
            {status === 'won' ? `Level cleared · ${stars}/3 stars` : 'Missed!'}
          </span>
          {status === 'won'
            ? <button className="btn btn-primary btn-sm" onClick={next}>
                {levelIdx < LEVELS.length - 1 ? 'Next level' : 'Restart'}
              </button>
            : <button className="btn btn-primary btn-sm" onClick={doRetry}>Retry</button>}
        </div>
      )}
      <div className="cutrope-hint">Tap / click the rope to cut · drop the candy into Om Nom's mouth</div>
    </div>
  );
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx, y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * 36 - 90) * Math.PI / 180;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawOmNom(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  // body
  ctx.fillStyle = '#6fbf2a';
  ctx.beginPath(); ctx.ellipse(0, 0, 38, 32, 0, 0, Math.PI * 2); ctx.fill();
  // eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-12, -10, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(12, -10, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0a0d0e';
  ctx.beginPath(); ctx.arc(-10, -8, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -8, 4, 0, Math.PI * 2); ctx.fill();
  // mouth
  ctx.fillStyle = '#0a0d0e';
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.quadraticCurveTo(0, 22, 14, 8);
  ctx.lineTo(14, 14);
  ctx.lineTo(-14, 14);
  ctx.closePath();
  ctx.fill();
  // teeth
  ctx.fillStyle = '#fff';
  ctx.fillRect(-10, 10, 4, 5);
  ctx.fillRect(-2, 10, 4, 5);
  ctx.fillRect(6, 10, 4, 5);
  ctx.restore();
}
