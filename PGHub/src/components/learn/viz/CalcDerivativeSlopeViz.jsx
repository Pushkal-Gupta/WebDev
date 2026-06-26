import React, { useMemo, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import { RotateCcw, Spline, Minimize2 } from 'lucide-react';
import './CalcDerivativeSlopeViz.css';

// Curve: f(x) = 0.35 x^2 + 0.2 x + 1.2,  f'(x) = 0.7 x + 0.2.
function f(x) { return 0.35 * x * x + 0.2 * x + 1.2; }
function fprime(x) { return 0.7 * x + 0.2; }

const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = 0;
const Y_MAX = 5;

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

export default function CalcDerivativeSlopeViz() {
  const [x0, setX0] = useState(1.0);   // base point (draggable)
  const [h, setH] = useState(1.5);     // gap to the second point
  const svgRef = useRef(null);

  const W = 760;
  const H = 420;
  const padL = 50;
  const padR = 24;
  const padT = 22;
  const padB = 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const sx = useCallback((v) => padL + ((v - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const sy = useCallback((v) => padT + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotH]);
  const inv = useCallback((px) => X_MIN + ((px - padL) / plotW) * (X_MAX - X_MIN), [plotW]);

  const x1 = Math.min(X_MAX - 0.05, x0 + h);
  const secantSlope = (f(x1) - f(x0)) / (x1 - x0);
  const trueSlope = fprime(x0);
  const slopeErr = Math.abs(secantSlope - trueSlope);

  const curvePath = useMemo(() => {
    const pts = [];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const xv = X_MIN + (i / steps) * (X_MAX - X_MIN);
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(xv).toFixed(2)} ${sy(f(xv)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [sx, sy]);

  // Extend a line of given slope through (px,py) across the plot for drawing.
  const lineAcross = (px, py, slope) => {
    const xa = X_MIN, xb = X_MAX;
    const ya = py + slope * (xa - px);
    const yb = py + slope * (xb - px);
    return { x1: sx(xa), y1: sy(ya), x2: sx(xb), y2: sy(yb) };
  };
  const secLine = lineAcross(x0, f(x0), secantSlope);
  const tanLine = lineAcross(x0, f(x0), trueSlope);

  const onPointerDown = (e) => { e.currentTarget.setPointerCapture(e.pointerId); movePoint(e); };
  const movePoint = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let nx = inv(px);
    nx = Math.max(X_MIN + 0.05, Math.min(X_MAX - 0.6, nx));
    setX0(Number(nx.toFixed(3)));
  };
  const onPointerMove = (e) => { if (e.buttons === 1) movePoint(e); };

  const reset = () => { setX0(1.0); setH(1.5); };

  return (
    <div className="cdv">
      <div className="cdv-head">
        <div className="cdv-head-icon"><Spline size={18} /></div>
        <div className="cdv-head-text">
          <h3 className="cdv-title">Secant collapsing to tangent</h3>
          <p className="cdv-sub">
            Drag the base point along the curve, then shrink the gap <span dangerouslySetInnerHTML={{ __html: km('h') }} />.
            The dashed secant pivots toward the solid tangent, and the secant slope homes in on the true derivative.
          </p>
        </div>
        <button type="button" className="cdv-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="cdv-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="cdv-svg" preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
          <defs>
            <linearGradient id="cdv-curve-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-violet)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <filter id="cdv-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x={padL} y={padT} width={plotW} height={plotH} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* tangent (solid, target) */}
          <line x1={tanLine.x1} y1={tanLine.y1} x2={tanLine.x2} y2={tanLine.y2} stroke="var(--easy)" strokeWidth={2.2} />
          {/* secant (dashed, current estimate) */}
          <line x1={secLine.x1} y1={secLine.y1} x2={secLine.x2} y2={secLine.y2} stroke="var(--hue-pink)" strokeWidth={2} strokeDasharray="6 4" />

          {/* the curve */}
          <path d={curvePath} fill="none" stroke="url(#cdv-curve-grad)" strokeWidth={2.6} filter="url(#cdv-glow)" />

          {/* rise/run triangle between the two points */}
          <line x1={sx(x0)} y1={sy(f(x0))} x2={sx(x1)} y2={sy(f(x0))} stroke="var(--text-dim)" strokeWidth={1} strokeDasharray="3 3" />
          <line x1={sx(x1)} y1={sy(f(x0))} x2={sx(x1)} y2={sy(f(x1))} stroke="var(--text-dim)" strokeWidth={1} strokeDasharray="3 3" />
          <text x={(sx(x0) + sx(x1)) / 2} y={sy(f(x0)) + 15} className="cdv-tri-lbl" textAnchor="middle">run h = {(x1 - x0).toFixed(2)}</text>

          {/* second point */}
          <circle cx={sx(x1)} cy={sy(f(x1))} r={6} fill="var(--hue-pink)" stroke="var(--bg)" strokeWidth={1.6} />

          {/* draggable base point with halo */}
          <circle cx={sx(x0)} cy={sy(f(x0))} r={16} fill="rgba(var(--accent-rgb), 0.18)" />
          <circle cx={sx(x0)} cy={sy(f(x0))} r={8} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} className="cdv-handle" />
          <text x={sx(x0)} y={sy(f(x0)) - 20} className="cdv-handle-lbl" textAnchor="middle">x = {x0.toFixed(2)}</text>
        </svg>
      </div>

      <label className="cdv-h">
        <span><Minimize2 size={13} /> gap h</span>
        <input type="range" min={0.05} max={2.0} step={0.05} value={h} onChange={(e) => setH(Number(e.target.value))} />
        <span className="cdv-h-val">{h.toFixed(2)}</span>
      </label>

      <div className="cdv-stats">
        <div className="cdv-statcard cdv-pink">
          <span className="cdv-stat-label">secant slope</span>
          <span className="cdv-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\frac{f(x+h)-f(x)}{h} = ${secantSlope.toFixed(3)}`) }} />
        </div>
        <div className="cdv-statcard cdv-green">
          <span className="cdv-stat-label">true derivative</span>
          <span className="cdv-stat-val" dangerouslySetInnerHTML={{ __html: km(`f'(x) = ${trueSlope.toFixed(3)}`) }} />
        </div>
        <div className="cdv-statcard">
          <span className="cdv-stat-label">error</span>
          <span className="cdv-stat-val" dangerouslySetInnerHTML={{ __html: km(`|{\\rm err}| = ${slopeErr.toFixed(4)}`) }} />
        </div>
        <div className="cdv-statcard">
          <span className="cdv-stat-label">base point</span>
          <span className="cdv-stat-val" dangerouslySetInnerHTML={{ __html: km(`x = ${x0.toFixed(2)}`) }} />
        </div>
      </div>

      <div className="cdv-trace">
        <span className="cdv-trace-label">reading</span>
        <span className="cdv-trace-body">
          {h <= 0.15
            ? `With h = ${h.toFixed(2)} the secant nearly coincides with the tangent — secant slope ${secantSlope.toFixed(3)} vs derivative ${trueSlope.toFixed(3)}, error only ${slopeErr.toFixed(4)}.`
            : `Over a gap of h = ${h.toFixed(2)} the secant reports an average slope of ${secantSlope.toFixed(3)}; the instantaneous slope is ${trueSlope.toFixed(3)}. Shrink h to close the ${slopeErr.toFixed(3)} gap.`}
        </span>
      </div>
    </div>
  );
}
