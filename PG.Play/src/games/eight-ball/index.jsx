import { useEffect, useRef, useState } from 'react';
import { sizeCanvasFluid } from '../../util/canvasDpr.js';
import { submitScore } from '../../scoreBus.js';
import { sfx } from '../../sound.js';

// The pool table is authored at 620×360 — every pocket position, ball
// radius, and physics constant is tuned to that coord space. To stay
// fluid we keep entities/physics in those coords and uniformly scale
// the rendered table up to a comfortable max so 4K screens get a
// generously-sized rack but never a gigantic one.
const W = 620;
const H = 360;
// Wood rail band drawn OUTSIDE the play rect. The fluid fit reserves
// FRAME px on every side so the frame never clips at small sizes.
const FRAME = 26;
const MAX_W = 900;
const MAX_H = 520;

// Standard ball palette by number; stripes (9-15) reuse the solid hue
// of (num - 8) on a white body, exactly like a real set.
const BALL_COLORS = {
  1: '#f2b53a', 2: '#2456d4', 3: '#e23b3b', 4: '#7a3cc6',
  5: '#ef7f1a', 6: '#1f9d55', 7: '#8e2f3c', 8: '#15171c',
};
// 15-ball triangle read column by column (apex first). The 8 sits in
// the heart of the rack; solids and stripes alternate around it.
const RACK_NUMS = [1, 9, 4, 2, 8, 10, 11, 3, 14, 6, 7, 13, 5, 15, 12];

const colorOf = (num) => (num === 0 ? '#f4f1e8' : BALL_COLORS[num > 8 ? num - 8 : num]);
const tint = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export default function EightBallGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  // viewRef holds the most recent fluid fit. scale stays at 1 until the
  // sizer measures the canvas and gives us room to grow.
  const viewRef = useRef({ cssW: W, cssH: H, scale: 1, offX: 0, offY: 0 });
  const [scored, setScored] = useState(0);
  const [shots, setShots] = useState(0);
  // 'win' | 'lose' | null — drives the end-of-rack card. Win = the 8
  // dropped last; lose = the 8 dropped while object balls remained.
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const stateRef = useRef(null);
  const submitRef = useRef({ scored: 0, shots: 0, started: 0 });
  submitRef.current.scored = scored;
  submitRef.current.shots = shots;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    const BALL_R = 14;
    const pockets = [[30,30],[W/2,20],[W-30,30],[30,H-30],[W/2,H-20],[W-30,H-30]];

    // Recompute scale + center offset on every fluid fit. We pick the
    // largest uniform scale that fits both axes (including the wood
    // frame), then cap so the table never exceeds MAX_W × MAX_H.
    const dispose = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      const scaleW = cssW / (W + FRAME * 2);
      const scaleH = cssH / (H + FRAME * 2);
      const maxScale = Math.min(MAX_W / W, MAX_H / H);
      const scale = Math.max(0.5, Math.min(scaleW, scaleH, maxScale));
      const tableW = W * scale;
      const tableH = H * scale;
      const offX = (cssW - tableW) / 2;
      const offY = (cssH - tableH) / 2;
      viewRef.current = { cssW, cssH, scale, offX, offY };
    });

    const initBalls = () => {
      const balls = [{x:140,y:H/2,vx:0,vy:0,num:0,cue:true,in:false}];
      const rx = 432, ry = H/2;
      let i = 0;
      for (let col=0; col<5; col++) {
        for (let row=0; row<=col; row++) {
          const x = rx + col*(BALL_R*2+1);
          const y = ry - col*BALL_R + row*(BALL_R*2+1);
          balls.push({x,y,vx:0,vy:0,num:RACK_NUMS[i],cue:false,in:false});
          i++;
        }
      }
      return balls;
    };

    let balls = initBalls();
    let fx = [];        // transient effects: sparks, dust, pocket drops
    let potted = [];    // ball numbers in pot order, drawn on the rail tray
    let over = false;   // 8-ball resolved — input locked until re-rack
    stateRef.current = {
      reset: () => {
        balls = initBalls(); fx = []; potted = []; over = false;
        setScored(0); setShots(0); setResult(null); setRolling(false);
      },
    };

    let aim = { x: W/2, y: H/2 };
    let charging = false;
    let power = 0;
    let moving = false;
    let wasRolling = false;
    // Audio throttles — a break shot produces dozens of contacts in a
    // few frames; without a floor the clacks smear into white noise.
    let lastClack = 0;
    let lastRail = 0;

    // Single ball painter shared by table balls, pocket-drop shrink
    // animation, and the rail tray miniatures.
    const drawBall = (x, y, r, num) => {
      const color = colorOf(num);
      const stripe = num > 8;
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.clip();
      ctx.fillStyle = stripe || num === 0 ? '#f4f1e8' : color;
      ctx.fillRect(x-r, y-r, r*2, r*2);
      if (stripe) {
        ctx.fillStyle = color;
        ctx.fillRect(x-r, y-r*0.55, r*2, r*1.1);
      }
      // Radial shading: bright key-light highlight up-left, body color
      // through the middle, occluded rim at the bottom-right.
      const g = ctx.createRadialGradient(x-r*0.4, y-r*0.45, r*0.1, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.85)');
      g.addColorStop(0.28, 'rgba(255,255,255,0.16)');
      g.addColorStop(0.72, 'rgba(0,0,0,0.05)');
      g.addColorStop(1, 'rgba(0,0,0,0.40)');
      ctx.fillStyle = g;
      ctx.fillRect(x-r, y-r, r*2, r*2);
      if (num > 0 && r > 4) {
        ctx.beginPath(); ctx.arc(x, y, r*0.46, 0, Math.PI*2);
        ctx.fillStyle = '#f6f3ea'; ctx.fill();
        ctx.fillStyle = '#15171c';
        ctx.font = `bold ${Math.max(5, r*0.58)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(num), x, y + r*0.05);
      }
      ctx.restore();
    };

    // Ghost-ball solve: sweep the cue ball along (ux,uy) and find the
    // first object ball whose center comes within 2R of the line.
    const findGhost = (cue, ux, uy) => {
      let best = null;
      const R2 = (BALL_R*2) * (BALL_R*2);
      balls.forEach(b => {
        if (b.cue || b.in) return;
        const rx = b.x - cue.x, ry = b.y - cue.y;
        const proj = rx*ux + ry*uy;
        if (proj <= 0) return;
        const perp2 = rx*rx + ry*ry - proj*proj;
        if (perp2 > R2) return;
        const t = proj - Math.sqrt(R2 - perp2);
        if (t > 0 && (!best || t < best.t)) best = { t, b };
      });
      return best;
    };

    // Distance from the cue ball to the first cushion along (ux,uy) —
    // the aim line's fallback reach when no object ball is in the way.
    const railDist = (cue, ux, uy) => {
      let t = 700;
      if (ux >  1e-6) t = Math.min(t, (W-BALL_R-6 - cue.x) / ux);
      if (ux < -1e-6) t = Math.min(t, (BALL_R+6 - cue.x) / ux);
      if (uy >  1e-6) t = Math.min(t, (H-BALL_R-6 - cue.y) / uy);
      if (uy < -1e-6) t = Math.min(t, (BALL_R+6 - cue.y) / uy);
      return Math.max(0, t);
    };

    const draw = () => {
      const { cssW, cssH, scale, offX, offY } = viewRef.current;

      // Room vignette — slightly lighter near the table center, deeper
      // green at the canvas edges. Reads as "table under a hanging
      // billiard light" instead of a flat field.
      const bgGrad = ctx.createRadialGradient(cssW / 2, cssH / 2, 0, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.7);
      bgGrad.addColorStop(0, '#11463a');
      bgGrad.addColorStop(1, '#06251c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      // Center + uniformly scale the table; everything inside this save
      // block draws in the original 620×360 coord space.
      ctx.save();
      ctx.translate(offX, offY);
      ctx.scale(scale, scale);

      // ── Table: drop shadow + wood rail frame ───────────────────
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = '#34200f';
      ctx.beginPath(); ctx.roundRect(-FRAME, -FRAME, W+FRAME*2, H+FRAME*2, 16); ctx.fill();
      ctx.restore();
      const wood = ctx.createLinearGradient(0, -FRAME, 0, H+FRAME);
      wood.addColorStop(0, '#7c5329');
      wood.addColorStop(0.5, '#5a3a20');
      wood.addColorStop(1, '#3a2412');
      ctx.fillStyle = wood;
      ctx.beginPath(); ctx.roundRect(-FRAME, -FRAME, W+FRAME*2, H+FRAME*2, 16); ctx.fill();
      // Inner bevel where the wood meets the cushion.
      ctx.strokeStyle = 'rgba(255,215,160,0.22)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-2, -2, W+4, H+4);

      // Diamond sight markers — mother-of-pearl inlays on the rail
      // centerline, three per half-rail like a real table.
      ctx.fillStyle = '#e9e0c8';
      const diamond = (x, y) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI/4);
        ctx.fillRect(-2.4, -2.4, 4.8, 4.8);
        ctx.restore();
      };
      [1,2,3,5,6,7].forEach(i => { diamond(W*i/8, -FRAME/2); diamond(W*i/8, H+FRAME/2); });
      [1,2,3].forEach(i => { diamond(-FRAME/2, H*i/4); diamond(W+FRAME/2, H*i/4); });

      // ── Felt: directional sheen + light pool ────────────────────
      const felt = ctx.createLinearGradient(0, 0, W, H);
      felt.addColorStop(0, '#1b6049');
      felt.addColorStop(1, '#0f4534');
      ctx.fillStyle = felt; ctx.fillRect(0, 0, W, H);
      const pool = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, W*0.62);
      pool.addColorStop(0, 'rgba(255,255,240,0.07)');
      pool.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H);

      // Cushion strips along the play boundary, with a thin lit lip.
      ctx.fillStyle = '#0d3b2c';
      ctx.fillRect(0, 0, W, 6); ctx.fillRect(0, H-6, W, 6);
      ctx.fillRect(0, 0, 6, H); ctx.fillRect(W-6, 0, 6, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 1;
      ctx.strokeRect(6.5, 6.5, W-13, H-13);

      // ── Pockets: felt shadow, leather jaw, depth hole ───────────
      pockets.forEach(([x,y]) => {
        const sh = ctx.createRadialGradient(x, y, 6, x, y, 34);
        sh.addColorStop(0, 'rgba(0,0,0,0.55)');
        sh.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sh; ctx.fillRect(x-34, y-34, 68, 68);
        ctx.fillStyle = '#1c1107';
        ctx.beginPath(); ctx.arc(x, y, 21, 0, Math.PI*2); ctx.fill();
        const hole = ctx.createRadialGradient(x-3, y-3, 2, x, y, 18);
        hole.addColorStop(0, '#181009');
        hole.addColorStop(1, '#000');
        ctx.fillStyle = hole;
        ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(160,110,60,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 21, 0, Math.PI*2); ctx.stroke();
      });

      // ── Pocketed-ball tray on the bottom rail ───────────────────
      if (potted.length) {
        ctx.fillStyle = 'rgba(0,0,0,0.30)';
        ctx.beginPath();
        ctx.roundRect(34, H + FRAME/2 - 9, potted.length*17 + 22, 18, 9);
        ctx.fill();
        potted.forEach((num, i) => drawBall(46 + i*17, H + FRAME/2, 7, num));
      }

      // ── Balls: motion streak, contact shadow, shaded sphere ─────
      balls.forEach(b => {
        if (b.in) return;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 2.2) {
          const k = Math.min(1, (sp - 2.2) / 8);
          ctx.strokeStyle = tint(colorOf(b.num), 0.14 + 0.18*k);
          ctx.lineWidth = BALL_R * 1.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(b.x - b.vx*(2 + k*3), b.y - b.vy*(2 + k*3));
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.beginPath();
        ctx.ellipse(b.x + 3, b.y + 5, BALL_R*0.95, BALL_R*0.6, 0, 0, Math.PI*2);
        ctx.fill();
        drawBall(b.x, b.y, BALL_R, b.num);
      });

      // ── Transient effects ───────────────────────────────────────
      fx.forEach(f => {
        const k = f.t / f.max;
        if (f.type === 'drop') {
          const r = BALL_R * (1 - k);
          if (r > 0.5) drawBall(f.x, f.y, r, f.num);
        } else if (f.type === 'rim') {
          ctx.strokeStyle = `rgba(255,238,200,${0.65*(1-k)})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(f.x, f.y, 18 + k*9, 0, Math.PI*2); ctx.stroke();
        } else if (f.type === 'spark') {
          ctx.strokeStyle = `rgba(255,235,170,${0.75*(1-k)})`;
          ctx.lineWidth = 1.2;
          f.dirs.forEach(d => {
            ctx.beginPath();
            ctx.moveTo(f.x + d.dx*k*5, f.y + d.dy*k*5);
            ctx.lineTo(f.x + d.dx*(k*11 + 3), f.y + d.dy*(k*11 + 3));
            ctx.stroke();
          });
        } else if (f.type === 'dust') {
          f.puffs.forEach(p => {
            ctx.fillStyle = `rgba(205,225,205,${0.32*(1-k)})`;
            ctx.beginPath();
            ctx.arc(f.x + p.dx*k*11, f.y + p.dy*k*11, 1.4 + k*2.2, 0, Math.PI*2);
            ctx.fill();
          });
        } else if (f.type === 'flash') {
          ctx.strokeStyle = `rgba(255,255,255,${0.8*(1-k)})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(f.x, f.y, BALL_R + k*14, 0, Math.PI*2); ctx.stroke();
        }
      });

      // ── Aim preview + cue stick + power meter ───────────────────
      const cue = balls[0];
      if (!cue.in && !moving && !over) {
        const dxA = aim.x - cue.x, dyA = aim.y - cue.y;
        const d = Math.hypot(dxA, dyA) || 1;
        const ux = dxA/d, uy = dyA/d;

        const hit = findGhost(cue, ux, uy);
        const reach = hit ? hit.t : railDist(cue, ux, uy);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.setLineDash([5,5]); ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cue.x + ux*BALL_R, cue.y + uy*BALL_R);
        ctx.lineTo(cue.x + ux*reach, cue.y + uy*reach);
        ctx.stroke();
        ctx.setLineDash([]);

        if (hit) {
          // Ghost ball at the contact point, plus the object ball's
          // projected departure line (impact normal) and a faint cue
          // deflection tangent.
          const gx = cue.x + ux*hit.t, gy = cue.y + uy*hit.t;
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(gx, gy, BALL_R, 0, Math.PI*2); ctx.stroke();
          const nx = (hit.b.x - gx) / (BALL_R*2), ny = (hit.b.y - gy) / (BALL_R*2);
          ctx.strokeStyle = tint(colorOf(hit.b.num), 0.85);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(hit.b.x + nx*BALL_R, hit.b.y + ny*BALL_R);
          ctx.lineTo(hit.b.x + nx*(BALL_R + 46), hit.b.y + ny*(BALL_R + 46));
          ctx.stroke();
          const dot = ux*nx + uy*ny;
          const tx = ux - nx*dot, ty = uy - ny*dot;
          const tl = Math.hypot(tx, ty);
          if (tl > 0.08) {
            ctx.strokeStyle = 'rgba(255,255,255,0.30)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + (tx/tl)*30, gy + (ty/tl)*30);
            ctx.stroke();
          }
        }

        // Wooden cue stick behind the ball, pulling back with power.
        const pull = charging ? 10 + power*0.55 : 6;
        const gap = BALL_R + 4 + pull;
        const len = 210;
        ctx.save();
        ctx.translate(cue.x, cue.y);
        ctx.rotate(Math.atan2(uy, ux));
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.moveTo(-gap, 4); ctx.lineTo(-gap-len, 7);
        ctx.lineTo(-gap-len, 10); ctx.lineTo(-gap, 6);
        ctx.closePath(); ctx.fill();
        const shaft = ctx.createLinearGradient(-gap-9, 0, -gap-len, 0);
        shaft.addColorStop(0, '#e8d3ae');
        shaft.addColorStop(0.55, '#a9743c');
        shaft.addColorStop(1, '#4a2a14');
        ctx.fillStyle = shaft;
        ctx.beginPath();
        ctx.moveTo(-gap-9, -2.2); ctx.lineTo(-gap-len, -4.6);
        ctx.lineTo(-gap-len, 4.6); ctx.lineTo(-gap-9, 2.2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#efe9da';
        ctx.fillRect(-gap-9, -2.2, 5.5, 4.4);   // ferrule
        ctx.fillStyle = '#4d8fd1';
        ctx.fillRect(-gap-3.5, -2.0, 3.5, 4.0); // chalked tip
        ctx.restore();

        if (charging) {
          const bx = 14, by = H - 24, bw = 130, bh = 9;
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          ctx.beginPath(); ctx.roundRect(bx-2, by-2, bw+4, bh+4, 5); ctx.fill();
          const pg = ctx.createLinearGradient(bx, 0, bx+bw, 0);
          pg.addColorStop(0, '#35f0c9');
          pg.addColorStop(0.55, '#ffe14f');
          pg.addColorStop(1, '#ff4d6d');
          ctx.fillStyle = pg;
          ctx.beginPath(); ctx.roundRect(bx, by, bw * Math.min(power,100)/100, bh, 4); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(bx-2, by-2, bw+4, bh+4, 5); ctx.stroke();
        }
      }

      ctx.restore();
    };

    // Rail contact: thunk + a puff of chalk dust kicked off the cushion.
    const railHit = (s, x, y) => {
      if (s < 0.6) return;
      const now = performance.now();
      if (now - lastRail > 70) { lastRail = now; sfx.poolRail(Math.min(1, s/8)); }
      if (s > 1.6) {
        const puffs = [];
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          puffs.push({ dx: Math.cos(a), dy: Math.sin(a) });
        }
        fx.push({ type:'dust', x, y, puffs, t:0, max:16 });
      }
    };

    const step = () => {
      moving = false;
      balls.forEach(b => {
        if (b.in) return;
        b.x += b.vx; b.y += b.vy;
        b.vx *= 0.985; b.vy *= 0.985;
        if (Math.abs(b.vx) < 0.03) b.vx = 0;
        if (Math.abs(b.vy) < 0.03) b.vy = 0;
        if (b.vx || b.vy) moving = true;
        if (b.x < BALL_R+6) { const s = Math.abs(b.vx); b.x = BALL_R+6; b.vx = -b.vx*0.8; railHit(s, 6, b.y); }
        if (b.x > W-BALL_R-6) { const s = Math.abs(b.vx); b.x = W-BALL_R-6; b.vx = -b.vx*0.8; railHit(s, W-6, b.y); }
        if (b.y < BALL_R+6) { const s = Math.abs(b.vy); b.y = BALL_R+6; b.vy = -b.vy*0.8; railHit(s, b.x, 6); }
        if (b.y > H-BALL_R-6) { const s = Math.abs(b.vy); b.y = H-BALL_R-6; b.vy = -b.vy*0.8; railHit(s, b.x, H-6); }
        pockets.forEach(([px,py]) => {
          if (b.in || Math.hypot(b.x-px,b.y-py) >= 18) return;
          b.in = true;
          fx.push({ type:'drop', x:px, y:py, num:b.num, t:0, max:22 });
          fx.push({ type:'rim', x:px, y:py, t:0, max:18 });
          sfx.poolPocket();
          if (b.cue) {
            setTimeout(() => { b.in = false; b.x = 140; b.y = H/2; b.vx = b.vy = 0; }, 450);
          } else {
            potted.push(b.num);
            setScored(s => s+1);
            if (b.num === 8) {
              // The rack resolves the moment the 8 drops: clean win if
              // every other object ball already went down, loss if not.
              const left = balls.filter(o => !o.cue && !o.in && o.num !== 8).length;
              over = true;
              const win = left === 0;
              setResult(win ? 'win' : 'lose');
              setTimeout(() => (win ? sfx.win() : sfx.lose()), 320);
            }
          }
        });
      });
      for (let i=0; i<balls.length; i++) {
        for (let j=i+1; j<balls.length; j++) {
          const a = balls[i], b = balls[j];
          if (a.in || b.in) continue;
          const dx = b.x-a.x, dy = b.y-a.y;
          const d = Math.hypot(dx,dy);
          if (d < BALL_R*2 && d > 0) {
            const nx = dx/d, ny = dy/d;
            const overlap = BALL_R*2 - d;
            a.x -= nx*overlap/2; a.y -= ny*overlap/2;
            b.x += nx*overlap/2; b.y += ny*overlap/2;
            const dvx = b.vx-a.vx, dvy = b.vy-a.vy;
            const dot = dvx*nx + dvy*ny;
            if (dot < 0) {
              a.vx += dot*nx; a.vy += dot*ny;
              b.vx -= dot*nx; b.vy -= dot*ny;
              const imp = -dot;
              const now = performance.now();
              if (imp > 0.4 && now - lastClack > 50) {
                lastClack = now;
                sfx.poolClack(Math.min(1, imp/10));
              }
              if (imp > 2.2) {
                const dirs = [];
                for (let k = 0; k < 4; k++) {
                  const ang = Math.random() * Math.PI * 2;
                  dirs.push({ dx: Math.cos(ang), dy: Math.sin(ang) });
                }
                fx.push({ type:'spark', x:(a.x+b.x)/2, y:(a.y+b.y)/2, dirs, t:0, max:14 });
              }
            }
          }
        }
      }
      fx = fx.filter(f => { f.t++; return f.t < f.max; });
      // Only ping React on actual transitions — `moving` flips every frame.
      if (moving !== wasRolling) { wasRolling = moving; setRolling(moving); }
      draw();
      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);

    const rectOf = () => canvas.getBoundingClientRect();
    const updateAim = (clientX, clientY) => {
      // Canvas style is 100%/100%; the table is centered + scaled inside.
      // Reverse the scale + offset so aim lands in original 620×360 coords.
      const r = rectOf();
      const { scale, offX, offY } = viewRef.current;
      aim.x = ((clientX - r.left) - offX) / scale;
      aim.y = ((clientY - r.top)  - offY) / scale;
    };
    let powerTimer = null;
    const startCharge = () => {
      if (moving || balls[0].in || over) return;
      charging = true; power = 0;
      powerTimer = setInterval(() => { power = Math.min(power+3, 100); }, 16);
    };
    const releaseShot = () => {
      if (!charging) return;
      clearInterval(powerTimer);
      const cue = balls[0];
      const dx = aim.x - cue.x, dy = aim.y - cue.y;
      const d = Math.hypot(dx,dy) || 1;
      cue.vx = (dx/d) * power * 0.14;
      cue.vy = (dy/d) * power * 0.14;
      fx.push({ type:'flash', x:cue.x, y:cue.y, t:0, max:12 });
      sfx.poolStrike(power / 100);
      setShots(s => s+1);
      charging = false; power = 0;
    };

    // Pointer events unify mouse + touch + pen. Aim follows the pointer
    // on hover AND during drag; charge begins on pointerdown; shot fires
    // on pointerup. `setPointerCapture` keeps events flowing if the
    // finger wanders off the canvas edge mid-charge.
    const onPointerMove = (e) => updateAim(e.clientX, e.clientY);
    const onPointerDown = (e) => {
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      updateAim(e.clientX, e.clientY);
      startCharge();
    };
    const onPointerUp = (e) => {
      releaseShot();
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    submitRef.current.started = performance.now();

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(powerTimer);
      dispose();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      // Submit the session's running score on unmount — the tally of
      // balls potted, with shot count for the accuracy breakdown.
      const final = submitRef.current.scored;
      if (final > 0) {
        const time = Math.round((performance.now() - submitRef.current.started) / 1000);
        submitScore('eightball', final, { time, shots: submitRef.current.shots });
      }
    };
  }, []);

  const accuracy = shots > 0 ? Math.round((scored / shots) * 100) : 0;

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,width:'100%',height:'100%'}}>
      <div style={{display:'flex',alignItems:'center',gap:18,fontFamily:'var(--font-mono)',fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-dim)'}}>
        <span style={{display:'flex',alignItems:'center',gap:7}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:rolling?'#ffe14f':'#35f0c9',boxShadow:rolling?'0 0 6px #ffe14f':'0 0 6px #35f0c9'}}/>
          <b style={{color:'var(--text)'}}>{rolling ? 'Rolling' : 'Your shot'}</b>
        </span>
        <span>Shots <b style={{color:'var(--text)',marginLeft:6}}>{shots}</b></span>
        <span>Potted <b style={{color:'var(--accent)',marginLeft:6}}>{scored}</b></span>
        <button onClick={() => stateRef.current?.reset()} style={{background:'var(--surface)',border:'1px solid var(--line)',color:'var(--text)',padding:'4px 12px',borderRadius:8,fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer'}}>Rack</button>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{cursor:'crosshair',touchAction:'none'}}/>
        {result && (
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(4,14,11,0.55)'}}>
            <div style={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:14,padding:'24px 34px',textAlign:'center',fontFamily:'var(--font-mono)',minWidth:230,boxShadow:'0 18px 50px rgba(0,0,0,0.5)'}}>
              <div style={{fontSize:14,letterSpacing:'0.14em',textTransform:'uppercase',color:result==='win'?'var(--accent)':'#ff4d6d',marginBottom:14}}>
                {result === 'win' ? 'Rack cleared' : 'Eight ball down early'}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:18}}>
                <span>Shots <b style={{color:'var(--text)',marginLeft:6}}>{shots}</b></span>
                <span>Potted <b style={{color:'var(--text)',marginLeft:6}}>{scored}</b></span>
                <span>Accuracy <b style={{color:'var(--accent)',marginLeft:6}}>{accuracy}%</b></span>
              </div>
              <button onClick={() => stateRef.current?.reset()} style={{background:'var(--accent)',border:'none',color:'#06251c',padding:'8px 22px',borderRadius:9,fontFamily:'var(--font-mono)',fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700,cursor:'pointer'}}>Rack again</button>
            </div>
          </div>
        )}
      </div>
      <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-mute)',letterSpacing:'0.1em',textTransform:'uppercase'}}>
        Aim · hold to charge · release to shoot · sink the 8 last
      </div>
    </div>
  );
}
