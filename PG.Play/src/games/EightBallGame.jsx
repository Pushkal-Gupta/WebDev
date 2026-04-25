import { useEffect, useRef, useState } from 'react';
import { sizeCanvasFluid } from '../util/canvasDpr.js';
import { submitScore } from '../scoreBus.js';

// The pool table is authored at 620×360 — every pocket position, ball
// radius, and physics constant is tuned to that coord space. To stay
// fluid we keep entities/physics in those coords and uniformly scale
// the rendered table up to a comfortable max so 4K screens get a
// generously-sized rack but never a gigantic one.
const W = 620;
const H = 360;
const MAX_W = 900;
const MAX_H = 520;

export default function EightBallGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  // viewRef holds the most recent fluid fit. scale stays at 1 until the
  // sizer measures the canvas and gives us room to grow.
  const viewRef = useRef({ cssW: W, cssH: H, scale: 1, offX: 0, offY: 0 });
  const [scored, setScored] = useState(0);
  const [shots, setShots] = useState(0);
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
    // largest uniform scale that fits both axes, then cap so the table
    // never exceeds MAX_W × MAX_H (capped scale ≈ 1.45×).
    const dispose = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      const scaleW = cssW / W;
      const scaleH = cssH / H;
      const maxScale = Math.min(MAX_W / W, MAX_H / H);
      const scale = Math.max(0.5, Math.min(scaleW, scaleH, maxScale));
      const tableW = W * scale;
      const tableH = H * scale;
      const offX = (cssW - tableW) / 2;
      const offY = (cssH - tableH) / 2;
      viewRef.current = { cssW, cssH, scale, offX, offY };
    });

    const initBalls = () => {
      const balls = [{x:140,y:H/2,vx:0,vy:0,color:'#fff',num:0,cue:true,in:false}];
      const rx = W-160, ry = H/2;
      const colors = ['#ffe14f','#1b82f5','#ff4d6d','#0a0d0e','#9b4ff0','#ff8a3a','#35d6f5'];
      let i = 0;
      for (let col=0; col<3; col++) {
        for (let row=0; row<=col; row++) {
          const x = rx + col*(BALL_R*2+1);
          const y = ry - col*BALL_R + row*(BALL_R*2+1);
          balls.push({x,y,vx:0,vy:0,color:colors[i%colors.length],num:i+1,cue:false,in:false});
          i++;
        }
      }
      return balls;
    };

    let balls = initBalls();
    stateRef.current = { reset: () => { balls = initBalls(); setScored(0); setShots(0); } };

    let aim = { x: W/2, y: H/2 };
    let charging = false;
    let power = 0;
    let moving = false;

    const draw = () => {
      const { cssW, cssH, scale, offX, offY } = viewRef.current;

      // Outer backdrop fills the full canvas — felt-green padding around
      // the table so the rack feels framed by cloth, not a hard rect.
      ctx.fillStyle = '#0d3a2c';
      ctx.fillRect(0, 0, cssW, cssH);

      // Center + uniformly scale the table; everything inside this save
      // block draws in the original 620×360 coord space.
      ctx.save();
      ctx.translate(offX, offY);
      ctx.scale(scale, scale);

      ctx.fillStyle = '#12503c'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 8; ctx.strokeRect(4,4,W-8,H-8);
      pockets.forEach(([x,y]) => {
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x,y,18,0,Math.PI*2); ctx.fill();
      });
      balls.forEach(b => {
        if (b.in) return;
        ctx.beginPath(); ctx.arc(b.x,b.y,BALL_R,0,Math.PI*2);
        ctx.fillStyle = b.color; ctx.fill();
        if (b.num > 0) {
          ctx.beginPath(); ctx.arc(b.x,b.y,6,0,Math.PI*2);
          ctx.fillStyle = '#fff'; ctx.fill();
          ctx.fillStyle = '#0a0d0e'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(String(b.num), b.x, b.y+3);
        }
        ctx.beginPath(); ctx.arc(b.x-4,b.y-4,3,0,Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
      });
      const cue = balls[0];
      if (!cue.in && !moving) {
        const dx = aim.x - cue.x, dy = aim.y - cue.y;
        const d = Math.hypot(dx,dy) || 1;
        const ux = dx/d, uy = dy/d;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.setLineDash([4,4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cue.x+ux*BALL_R, cue.y+uy*BALL_R);
        ctx.lineTo(cue.x+ux*180, cue.y+uy*180); ctx.stroke();
        ctx.setLineDash([]);
        if (charging) {
          const back = 40 + power*2;
          ctx.strokeStyle = '#b9830b'; ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(cue.x-ux*back, cue.y-uy*back);
          ctx.lineTo(cue.x-ux*(back+120), cue.y-uy*(back+120));
          ctx.stroke();
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(10, H-20, 120, 10);
          ctx.fillStyle = power>80 ? '#ff4d6d' : power>50 ? '#ffe14f' : '#35f0c9';
          ctx.fillRect(10, H-20, Math.min(power,100)*1.2, 10);
        }
      }

      ctx.restore();
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
        if (b.x < BALL_R+6) { b.x = BALL_R+6; b.vx = -b.vx*0.8; }
        if (b.x > W-BALL_R-6) { b.x = W-BALL_R-6; b.vx = -b.vx*0.8; }
        if (b.y < BALL_R+6) { b.y = BALL_R+6; b.vy = -b.vy*0.8; }
        if (b.y > H-BALL_R-6) { b.y = H-BALL_R-6; b.vy = -b.vy*0.8; }
        pockets.forEach(([px,py]) => {
          if (Math.hypot(b.x-px,b.y-py) < 18) {
            b.in = true;
            if (b.cue) {
              setTimeout(() => { b.in = false; b.x = 140; b.y = H/2; b.vx = b.vy = 0; }, 400);
            } else {
              setScored(s => s+1);
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
            }
          }
        }
      }
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
      if (moving || balls[0].in) return;
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
      // Submit the session's running score on unmount. Eightball has no
      // explicit win condition — it's a practice rack — so we report the
      // tally of balls potted during the session.
      const final = submitRef.current.scored;
      if (final > 0) {
        const time = Math.round((performance.now() - submitRef.current.started) / 1000);
        submitScore('eightball', final, { time, shots: submitRef.current.shots });
      }
    };
  }, []);

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,width:'100%',height:'100%'}}>
      <div style={{display:'flex',gap:18,fontFamily:'var(--font-mono)',fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-dim)'}}>
        <span>Shots <b style={{color:'var(--text)',marginLeft:6}}>{shots}</b></span>
        <span>Potted <b style={{color:'var(--accent)',marginLeft:6}}>{scored}</b></span>
        <button onClick={() => stateRef.current?.reset()} style={{background:'var(--surface)',border:'1px solid var(--line)',color:'var(--text)',padding:'4px 12px',borderRadius:8,fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer'}}>Rack</button>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{cursor:'crosshair',touchAction:'none'}}/>
      </div>
      <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-mute)',letterSpacing:'0.1em',textTransform:'uppercase'}}>
        Aim · hold to charge · release to shoot
      </div>
    </div>
  );
}
