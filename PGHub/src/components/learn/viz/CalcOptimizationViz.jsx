import React, { useMemo, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import { RotateCcw, TrendingUp, Target } from 'lucide-react';
import './CalcOptimizationViz.css';

// f(x) = x^3 - 3x  ->  f'(x) = 3x^2 - 3,  f''(x) = 6x
// critical points x = -1 (max), x = +1 (min)
function f(x) { return x * x * x - 3 * x; }
function fp(x) { return 3 * x * x - 3; }
function fpp(x) { return 6 * x; }

const CRITS = [-1, 1];
const X_MIN = -2.1;
const X_MAX = 2.1;
const Y_MIN = -3.2;
const Y_MAX = 3.2;

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

export default function CalcOptimizationViz() {
  const [x, setX] = useState(0.4);
  const svgRef = useRef(null);

  const W = 760;
  const H = 430;
  const padL = 48;
  const padR = 24;
  const padT = 22;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const sx = useCallback((v) => padL + ((v - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const sy = useCallback((v) => padT + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotH]);
  const inv = useCallback((px) => X_MIN + ((px - padL) / plotW) * (X_MAX - X_MIN), [plotW]);

  const slope = fp(x);
  const curv = fpp(x);
  const concavity = curv > 0.001 ? 'concave up' : curv < -0.001 ? 'concave down' : 'inflection';
  const nearCrit = CRITS.find((c) => Math.abs(x - c) < 0.06);
  const isFlat = Math.abs(slope) < 0.08;

  const curvePath = useMemo(() => {
    const pts = [];
    const steps = 180;
    for (let i = 0; i <= steps; i++) {
      const xv = X_MIN + (i / steps) * (X_MAX - X_MIN);
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(xv).toFixed(2)} ${sy(f(xv)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [sx, sy]);

  const tan = useMemo(() => {
    const dxv = 0.85;
    const xa = x - dxv, xb = x + dxv;
    const m = fp(x);
    return {
      x1: sx(xa), y1: sy(f(x) + m * (xa - x)),
      x2: sx(xb), y2: sy(f(x) + m * (xb - x)),
    };
  }, [sx, sy, x]);

  const movePoint = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let nx = inv(px);
    nx = Math.max(X_MIN + 0.05, Math.min(X_MAX - 0.05, nx));
    setX(Number(nx.toFixed(3)));
  };
  const onPointerDown = (e) => { e.currentTarget.setPointerCapture(e.pointerId); movePoint(e); };
  const onPointerMove = (e) => { if (e.buttons === 1) movePoint(e); };

  const snap = (c) => setX(c);
  const reset = () => setX(0.4);

  return (
    <div className="copv">
      <div className="copv-head">
        <div className="copv-head-icon"><TrendingUp size={18} /></div>
        <div className="copv-head-text">
          <h3 className="copv-title">Hunting maxima and minima with the slope</h3>
          <p className="copv-sub">
            Drag the point along <span dangerouslySetInnerHTML={{ __html: km('f(x)=x^3-3x') }} />. The tangent flattens exactly at the
            critical points where <span dangerouslySetInnerHTML={{ __html: km("f'(x)=0") }} />; the sign of <span dangerouslySetInnerHTML={{ __html: km("f''(x)") }} /> says max or min.
          </p>
        </div>
        <button type="button" className="copv-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="copv-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="copv-svg" preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
          <defs>
            <linearGradient id="copv-curve-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-violet)" />
              <stop offset="50%" stopColor="var(--hue-sky)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <filter id="copv-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x={padL} y={padT} width={plotW} height={plotH} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* axes */}
          <line x1={padL} y1={sy(0)} x2={padL + plotW} y2={sy(0)} stroke="var(--text-dim)" strokeWidth={1} />
          <line x1={sx(0)} y1={padT} x2={sx(0)} y2={padT + plotH} stroke="var(--text-dim)" strokeWidth={1} strokeDasharray="2 4" />

          {/* critical-point markers */}
          {CRITS.map((c) => (
            <g key={c}>
              <line x1={sx(c)} y1={sy(f(c))} x2={sx(c)} y2={sy(0)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={sx(c)} cy={sy(f(c))} r={4.5}
                fill={fpp(c) > 0 ? 'var(--easy)' : 'var(--hue-pink)'} stroke="var(--bg)" strokeWidth={1.3} />
              <text x={sx(c)} y={fpp(c) > 0 ? sy(f(c)) + 18 : sy(f(c)) - 11} className="copv-crit-lbl" textAnchor="middle">
                {fpp(c) > 0 ? 'MIN' : 'MAX'}
              </text>
            </g>
          ))}

          {/* the curve */}
          <path d={curvePath} fill="none" stroke="url(#copv-curve-grad)" strokeWidth={2.6} filter="url(#copv-glow)" />

          {/* tangent at the dragged point */}
          <line x1={tan.x1} y1={tan.y1} x2={tan.x2} y2={tan.y2}
            stroke={isFlat ? 'var(--warning)' : 'var(--hue-mint)'} strokeWidth={2.4} />

          {/* draggable handle */}
          <circle cx={sx(x)} cy={sy(f(x))} r={15} fill="rgba(var(--accent-rgb), 0.18)" />
          <circle cx={sx(x)} cy={sy(f(x))} r={7.5} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} className="copv-handle" />
          <text x={sx(x)} y={sy(f(x)) - 20} className="copv-handle-lbl" textAnchor="middle">x = {x.toFixed(2)}</text>

          <text x={sx(-1)} y={padT + plotH + 24} className="copv-axis-lbl" textAnchor="middle">-1</text>
          <text x={sx(0)} y={padT + plotH + 24} className="copv-axis-lbl" textAnchor="middle">0</text>
          <text x={sx(1)} y={padT + plotH + 24} className="copv-axis-lbl" textAnchor="middle">1</text>
        </svg>
      </div>

      <div className="copv-controls">
        <label className="copv-slider">
          <span><Target size={13} /> position x</span>
          <input type="range" min={-2.05} max={2.05} step={0.01} value={x} onChange={(e) => setX(Number(e.target.value))} />
          <span className="copv-slider-val">{x.toFixed(2)}</span>
        </label>
        <div className="copv-seg">
          <button type="button" className="copv-seg-btn" onClick={() => snap(-1)}>snap to max</button>
          <button type="button" className="copv-seg-btn" onClick={() => snap(1)}>snap to min</button>
        </div>
      </div>

      <div className="copv-stats">
        <div className={`copv-statcard ${isFlat ? 'copv-warn' : 'copv-mint'}`}>
          <span className="copv-stat-label">slope (1st deriv)</span>
          <span className="copv-stat-val" dangerouslySetInnerHTML={{ __html: km(`f'(x) = ${slope.toFixed(3)}`) }} />
        </div>
        <div className={`copv-statcard ${curv > 0 ? 'copv-green' : 'copv-pink'}`}>
          <span className="copv-stat-label">curvature (2nd deriv)</span>
          <span className="copv-stat-val" dangerouslySetInnerHTML={{ __html: km(`f''(x) = ${curv.toFixed(3)}`) }} />
        </div>
        <div className="copv-statcard">
          <span className="copv-stat-label">concavity</span>
          <span className="copv-stat-val copv-text">{concavity}</span>
        </div>
        <div className="copv-statcard copv-accent">
          <span className="copv-stat-label">value</span>
          <span className="copv-stat-val" dangerouslySetInnerHTML={{ __html: km(`f(x) = ${f(x).toFixed(3)}`) }} />
        </div>
      </div>

      <div className="copv-trace">
        <span className="copv-trace-label">reading</span>
        <span className="copv-trace-body">
          {isFlat
            ? `Flat tangent: f'(x) = ${slope.toFixed(3)} ~ 0, a critical point. f''(x) = ${curv.toFixed(2)} is ${curv > 0 ? 'positive (concave up) -> local MINIMUM' : curv < 0 ? 'negative (concave down) -> local MAXIMUM' : 'zero -> test inconclusive'}.${nearCrit !== undefined ? '' : ''}`
            : `Slope f'(x) = ${slope.toFixed(3)} (${slope > 0 ? 'rising' : 'falling'}); not a critical point yet. Curve is ${concavity} since f''(x) = ${curv.toFixed(2)}. Drag toward a flat tangent to reach an extremum.`}
        </span>
      </div>
    </div>
  );
}
