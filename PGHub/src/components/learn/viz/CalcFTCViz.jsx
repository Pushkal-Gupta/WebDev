import React, { useMemo, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import { RotateCcw, Sigma, MoveHorizontal } from 'lucide-react';
import './CalcFTCViz.css';

// f(t) = 0.6 + 0.9*sin(0.9 t) + 0.25 t  on [0, 4], kept positive on the window.
function f(t) { return 0.6 + 0.9 * Math.sin(0.9 * t) + 0.25 * t; }

// Accumulation A(x) = integral_0^x f(t) dt, evaluated by fine numeric sum.
function accum(x) {
  const n = 400;
  const dx = x / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += f((i + 0.5) * dx) * dx;
  return s;
}

const X_MIN = 0;
const X_MAX = 4;
const F_MIN = 0;
const F_MAX = 3.4;
const A_MIN = 0;
const A_MAX = accum(X_MAX) * 1.04;

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

export default function CalcFTCViz() {
  const [x, setX] = useState(2.0);
  const svgRef = useRef(null);

  const W = 760;
  const H = 470;
  const padL = 52;
  const padR = 24;
  const padT = 20;
  const gap = 30;
  const padB = 36;
  const plotW = W - padL - padR;
  const panelH = (H - padT - padB - gap) / 2;
  const topT = padT;
  const botT = padT + panelH + gap;

  const sx = useCallback((v) => padL + ((v - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const syF = useCallback((v) => topT + (1 - (v - F_MIN) / (F_MAX - F_MIN)) * panelH, [topT, panelH]);
  const syA = useCallback((v) => botT + (1 - (v - A_MIN) / (A_MAX - A_MIN)) * panelH, [botT, panelH]);
  const inv = useCallback((px) => X_MIN + ((px - padL) / plotW) * (X_MAX - X_MIN), [plotW]);

  const Ax = accum(x);
  const fx = f(x);

  const fCurve = useMemo(() => {
    const pts = [];
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const tv = X_MIN + (i / steps) * (X_MAX - X_MIN);
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(tv).toFixed(2)} ${syF(f(tv)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [sx, syF]);

  const aCurve = useMemo(() => {
    const pts = [];
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const tv = X_MIN + (i / steps) * (X_MAX - X_MIN);
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(tv).toFixed(2)} ${syA(accum(tv)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [sx, syA]);

  // shaded area under f up to current x
  const areaFill = useMemo(() => {
    const pts = [`M ${sx(X_MIN).toFixed(2)} ${syF(0).toFixed(2)}`];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const tv = X_MIN + (i / steps) * (x - X_MIN);
      pts.push(`L ${sx(tv).toFixed(2)} ${syF(f(tv)).toFixed(2)}`);
    }
    pts.push(`L ${sx(x).toFixed(2)} ${syF(0).toFixed(2)} Z`);
    return pts.join(' ');
  }, [sx, syF, x]);

  // tangent on A whose slope is f(x): draw a short segment around (x, A(x)).
  const tan = useMemo(() => {
    const dxv = 0.7;
    const xa = Math.max(X_MIN + 0.02, x - dxv);
    const xb = Math.min(X_MAX - 0.02, x + dxv);
    // slope in data units (A per x) is f(x); map endpoints in pixels
    return {
      x1: sx(xa), y1: syA(Ax + fx * (xa - x)),
      x2: sx(xb), y2: syA(Ax + fx * (xb - x)),
    };
  }, [sx, syA, x, Ax, fx]);

  const movePoint = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let nx = inv(px);
    nx = Math.max(X_MIN + 0.1, Math.min(X_MAX - 0.05, nx));
    setX(Number(nx.toFixed(3)));
  };
  const onPointerDown = (e) => { e.currentTarget.setPointerCapture(e.pointerId); movePoint(e); };
  const onPointerMove = (e) => { if (e.buttons === 1) movePoint(e); };

  const reset = () => setX(2.0);

  return (
    <div className="ftcv">
      <div className="ftcv-head">
        <div className="ftcv-head-icon"><Sigma size={18} /></div>
        <div className="ftcv-head-text">
          <h3 className="ftcv-title">Accumulation grows at the rate of the height</h3>
          <p className="ftcv-sub">
            Drag <span dangerouslySetInnerHTML={{ __html: km('x') }} />. The top shades the area
            <span dangerouslySetInnerHTML={{ __html: km('A(x)=\\int_0^x f(t)\\,dt') }} />; below, that area is plotted as a curve whose
            slope at <span dangerouslySetInnerHTML={{ __html: km('x') }} /> equals <span dangerouslySetInnerHTML={{ __html: km('f(x)') }} /> — the FTC.
          </p>
        </div>
        <button type="button" className="ftcv-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="ftcv-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="ftcv-svg" preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
          <defs>
            <linearGradient id="ftcv-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.42)" />
              <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.08)" />
            </linearGradient>
            <linearGradient id="ftcv-f-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-pink)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <linearGradient id="ftcv-a-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-sky)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <filter id="ftcv-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* top panel: f */}
          <rect x={padL} y={topT} width={plotW} height={panelH} fill="var(--surface)" stroke="var(--border)" rx={8} />
          <path d={areaFill} fill="url(#ftcv-area-grad)" />
          <path d={fCurve} fill="none" stroke="url(#ftcv-f-grad)" strokeWidth={2.6} filter="url(#ftcv-glow)" />
          <line x1={padL} y1={syF(0)} x2={padL + plotW} y2={syF(0)} stroke="var(--text-dim)" strokeWidth={1} />
          {/* sweep line + height marker on f */}
          <line x1={sx(x)} y1={topT} x2={sx(x)} y2={syF(0)} stroke="var(--accent)" strokeWidth={1.3} strokeDasharray="4 3" />
          <circle cx={sx(x)} cy={syF(fx)} r={5} fill="var(--hue-pink)" stroke="var(--bg)" strokeWidth={1.6} />
          <text x={padL + 6} y={topT + 16} className="ftcv-panel-lbl">f(t) — the height</text>
          <text x={sx(x)} y={syF(fx) - 9} className="ftcv-mk" textAnchor="middle">f(x) = {fx.toFixed(2)}</text>

          {/* bottom panel: A */}
          <rect x={padL} y={botT} width={plotW} height={panelH} fill="var(--surface)" stroke="var(--border)" rx={8} />
          <path d={aCurve} fill="none" stroke="url(#ftcv-a-grad)" strokeWidth={2.6} filter="url(#ftcv-glow)" />
          <line x1={padL} y1={syA(0)} x2={padL + plotW} y2={syA(0)} stroke="var(--text-dim)" strokeWidth={1} />
          {/* tangent whose slope = f(x) */}
          <line x1={tan.x1} y1={tan.y1} x2={tan.x2} y2={tan.y2} stroke="var(--easy)" strokeWidth={2.4} />
          <line x1={sx(x)} y1={botT} x2={sx(x)} y2={syA(0)} stroke="var(--accent)" strokeWidth={1.3} strokeDasharray="4 3" />
          <text x={padL + 6} y={botT + 16} className="ftcv-panel-lbl">A(x) — area so far</text>
          <text x={sx(x)} y={syA(Ax) - 11} className="ftcv-mk" textAnchor="middle">slope = f(x)</text>

          {/* draggable handle on A */}
          <circle cx={sx(x)} cy={syA(Ax)} r={15} fill="rgba(var(--accent-rgb), 0.18)" />
          <circle cx={sx(x)} cy={syA(Ax)} r={7.5} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} className="ftcv-handle" />

          <text x={sx(0)} y={H - 12} className="ftcv-axis-lbl" textAnchor="middle">0</text>
          <text x={sx(4)} y={H - 12} className="ftcv-axis-lbl" textAnchor="middle">4</text>
          <text x={sx(x)} y={H - 12} className="ftcv-axis-lbl ftcv-axis-x" textAnchor="middle">x = {x.toFixed(2)}</text>
        </svg>
      </div>

      <div className="ftcv-stats">
        <div className="ftcv-statcard ftcv-pink">
          <span className="ftcv-stat-label">curve height</span>
          <span className="ftcv-stat-val" dangerouslySetInnerHTML={{ __html: km(`f(x) = ${fx.toFixed(3)}`) }} />
        </div>
        <div className="ftcv-statcard ftcv-accent">
          <span className="ftcv-stat-label">accumulated area</span>
          <span className="ftcv-stat-val" dangerouslySetInnerHTML={{ __html: km(`A(x) = ${Ax.toFixed(3)}`) }} />
        </div>
        <div className="ftcv-statcard ftcv-green">
          <span className="ftcv-stat-label">slope of A</span>
          <span className="ftcv-stat-val" dangerouslySetInnerHTML={{ __html: km(`A'(x) = ${fx.toFixed(3)}`) }} />
        </div>
        <div className="ftcv-statcard">
          <span className="ftcv-stat-label">FTC link</span>
          <span className="ftcv-stat-val" dangerouslySetInnerHTML={{ __html: km("A'(x)=f(x)") }} />
        </div>
      </div>

      <div className="ftcv-controls">
        <label className="ftcv-slider">
          <span><MoveHorizontal size={13} /> right edge x</span>
          <input type="range" min={0.1} max={3.95} step={0.01} value={x} onChange={(e) => setX(Number(e.target.value))} />
          <span className="ftcv-slider-val">{x.toFixed(2)}</span>
        </label>
      </div>

      <div className="ftcv-trace">
        <span className="ftcv-trace-label">reading</span>
        <span className="ftcv-trace-body">
          {`At x = ${x.toFixed(2)} the curve sits at height ${fx.toFixed(3)}, and the area swept from 0 is ${Ax.toFixed(3)}. The green tangent on A(x) has slope ${fx.toFixed(3)} — identical to the height above. That equality, at every x, is the fundamental theorem: A'(x) = f(x).`}
        </span>
      </div>
    </div>
  );
}
