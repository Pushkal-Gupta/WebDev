import React, { useMemo, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import { RotateCcw, Target, Move } from 'lucide-react';
import './CalcLimitViz.css';

// f(x) = (x^2 - 1)/(x - 1) = x + 1 for x != 1; removable hole at x = 1, L = 2.
const A = 1;          // target point a
const L = 2;          // limit value
function f(x) {
  return x + 1;       // analytic continuation (the value the secants approach)
}

const X_MIN = -1;
const X_MAX = 3;
const Y_MIN = 0;
const Y_MAX = 4;

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

export default function CalcLimitViz() {
  const [x, setX] = useState(2.4);     // draggable input position
  const [eps, setEps] = useState(0.6); // epsilon band around L
  const svgRef = useRef(null);

  const W = 760;
  const H = 420;
  const padL = 54;
  const padR = 24;
  const padT = 24;
  const padB = 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const sx = useCallback((v) => padL + ((v - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const sy = useCallback((v) => padT + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotH]);
  const inv = useCallback((px) => X_MIN + ((px - padL) / plotW) * (X_MAX - X_MIN), [plotW]);

  // delta = the radius around a within which |f(x)-L| < eps. Here f(x)-L = x-1,
  // so |x-1| < eps gives delta = eps exactly.
  const delta = eps;

  const fx = f(x);
  const distToL = Math.abs(fx - L);
  const insideEps = distToL < eps + 1e-9;
  const insideDelta = Math.abs(x - A) < delta + 1e-9;

  const curvePath = useMemo(() => {
    const pts = [];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const xv = X_MIN + (i / steps) * (X_MAX - X_MIN);
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(xv).toFixed(2)} ${sy(f(xv)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [sx, sy]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    movePoint(e);
  };
  const movePoint = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let nx = inv(px);
    nx = Math.max(X_MIN + 0.05, Math.min(X_MAX - 0.05, nx));
    if (Math.abs(nx - A) < 0.04) nx = nx < A ? A - 0.04 : A + 0.04; // never sit exactly on the hole
    setX(Number(nx.toFixed(3)));
  };
  const onPointerMove = (e) => {
    if (e.buttons === 1) movePoint(e);
  };

  const reset = () => { setX(2.4); setEps(0.6); };

  const handleX = sx(x);
  const handleY = sy(fx);

  return (
    <div className="clv">
      <div className="clv-head">
        <div className="clv-head-icon"><Target size={18} /></div>
        <div className="clv-head-text">
          <h3 className="clv-title">Limit at a point</h3>
          <p className="clv-sub">
            Drag the input toward <span dangerouslySetInnerHTML={{ __html: km('x = 1') }} />. The output
            climbs toward <span dangerouslySetInnerHTML={{ __html: km('L = 2') }} /> even though the point
            itself is a hole. Tighten the green tolerance to see the &epsilon;&ndash;&delta; promise hold.
          </p>
        </div>
        <button type="button" className="clv-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="clv-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="clv-svg"
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
        >
          <defs>
            <linearGradient id="clv-curve-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-sky)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <filter id="clv-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x={padL} y={padT} width={plotW} height={plotH} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* epsilon band around L */}
          <rect x={padL} y={sy(L + eps)} width={plotW} height={sy(L - eps) - sy(L + eps)}
            fill="rgba(var(--accent-rgb), 0.10)" stroke="none" />
          <line x1={padL} y1={sy(L + eps)} x2={padL + plotW} y2={sy(L + eps)} stroke="var(--easy)" strokeWidth={1} strokeDasharray="4 4" />
          <line x1={padL} y1={sy(L - eps)} x2={padL + plotW} y2={sy(L - eps)} stroke="var(--easy)" strokeWidth={1} strokeDasharray="4 4" />

          {/* delta band around a */}
          <rect x={sx(A - delta)} y={padT} width={sx(A + delta) - sx(A - delta)} height={plotH}
            fill="rgba(var(--hue-violet-rgb), 0.08)" stroke="none" />
          <line x1={sx(A - delta)} y1={padT} x2={sx(A - delta)} y2={padT + plotH} stroke="var(--hue-violet)" strokeWidth={1} strokeDasharray="4 4" />
          <line x1={sx(A + delta)} y1={padT} x2={sx(A + delta)} y2={padT + plotH} stroke="var(--hue-violet)" strokeWidth={1} strokeDasharray="4 4" />

          {/* axes lines for L and a */}
          <line x1={padL} y1={sy(L)} x2={padL + plotW} y2={sy(L)} stroke="var(--text-dim)" strokeWidth={0.8} opacity={0.5} />
          <line x1={sx(A)} y1={padT} x2={sx(A)} y2={padT + plotH} stroke="var(--text-dim)" strokeWidth={0.8} opacity={0.5} />

          {/* the curve */}
          <path d={curvePath} fill="none" stroke="url(#clv-curve-grad)" strokeWidth={2.6} filter="url(#clv-glow)" />

          {/* the hole at (a, L) */}
          <circle cx={sx(A)} cy={sy(L)} r={6} fill="var(--bg)" stroke="var(--accent)" strokeWidth={2} />

          {/* projection lines from handle */}
          <line x1={handleX} y1={handleY} x2={handleX} y2={sy(Y_MIN)} stroke="var(--hue-sky)" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
          <line x1={handleX} y1={handleY} x2={padL} y2={handleY} stroke="var(--hue-sky)" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />

          {/* draggable handle with halo */}
          <circle cx={handleX} cy={handleY} r={16} fill="rgba(var(--accent-rgb), 0.18)" />
          <circle cx={handleX} cy={handleY} r={8} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} className="clv-handle" />

          {/* labels */}
          <text x={sx(A)} y={padT + plotH + 26} className="clv-axis-lbl" textAnchor="middle">a = 1</text>
          <text x={padL - 10} y={sy(L) + 4} className="clv-axis-lbl" textAnchor="end">L = 2</text>
          <text x={handleX} y={handleY - 22} className="clv-handle-lbl" textAnchor="middle">x = {x.toFixed(2)}</text>
        </svg>
      </div>

      <label className="clv-eps">
        <span><Move size={13} /> tolerance &epsilon;</span>
        <input type="range" min={0.1} max={1.2} step={0.05} value={eps} onChange={(e) => setEps(Number(e.target.value))} />
        <span className="clv-eps-val">{eps.toFixed(2)}</span>
      </label>

      <div className="clv-stats">
        <div className="clv-statcard">
          <span className="clv-stat-label">x &rarr; a distance</span>
          <span className="clv-stat-val" dangerouslySetInnerHTML={{ __html: km(`|x-a| = ${Math.abs(x - A).toFixed(3)}`) }} />
        </div>
        <div className="clv-statcard">
          <span className="clv-stat-label">f(x)</span>
          <span className="clv-stat-val" dangerouslySetInnerHTML={{ __html: km(`f(x) = ${fx.toFixed(3)}`) }} />
        </div>
        <div className={`clv-statcard ${insideEps ? 'clv-ok' : 'clv-warn'}`}>
          <span className="clv-stat-label">|f(x) &minus; L|</span>
          <span className="clv-stat-val" dangerouslySetInnerHTML={{ __html: km(`${distToL.toFixed(3)} ${insideEps ? '<' : '\\geq'} ${eps.toFixed(2)}`) }} />
        </div>
        <div className="clv-statcard">
          <span className="clv-stat-label">required &delta;</span>
          <span className="clv-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\delta = ${delta.toFixed(2)}`) }} />
        </div>
      </div>

      <div className="clv-trace">
        <span className="clv-trace-label">reading</span>
        <span className="clv-trace-body">
          {insideDelta
            ? `x is within delta = ${delta.toFixed(2)} of 1, so f(x) lands within epsilon = ${eps.toFixed(2)} of L = 2 — the limit promise holds here.`
            : `x is still ${Math.abs(x - A).toFixed(2)} away from 1 (outside delta), so f(x) sits ${distToL.toFixed(2)} from L. Drag closer to slip inside the green band.`}
        </span>
      </div>
    </div>
  );
}
