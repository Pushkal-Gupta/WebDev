import React, { useCallback, useMemo, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Triangle, MoveRight } from 'lucide-react';
import './CalcRelatedRatesViz.css';

// Ladder of fixed length L leaning on a wall: x^2 + y^2 = L^2.
// Foot pulled out at constant dx/dt; top rate dy/dt = -(x/y)(dx/dt).
const L = 5;            // ladder length (metres)
const DX_DT = 0.6;      // foot pulled away at 0.6 m/s (constant)

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

export default function CalcRelatedRatesViz() {
  const [x, setX] = useState(2.0);   // current foot distance from wall

  const W = 760;
  const H = 430;
  const padL = 70;
  const padR = 200;
  const padT = 30;
  const padB = 56;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const y = Math.sqrt(Math.max(0, L * L - x * x));
  const dyDt = y > 0.001 ? -(x / y) * DX_DT : -Infinity;

  // world (metres) -> pixels. Wall is vertical at left; floor horizontal at bottom.
  // scale so L fits in both directions.
  const scale = Math.min(plotW, plotH) / (L * 1.08);
  const originX = padL;                 // wall x position (foot of wall)
  const originY = padT + plotH;         // floor y position

  const px = useCallback((mx) => originX + mx * scale, [originX, scale]);
  const py = useCallback((my) => originY - my * scale, [originY, scale]);

  const topX = px(0);
  const topY = py(y);
  const footX = px(x);
  const footY = py(0);

  const arcPath = useMemo(() => {
    // sweep arc showing the ladder top's path along the wall as x varies
    const pts = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const xv = 0.3 + (i / steps) * (L - 0.5);
      const yv = Math.sqrt(Math.max(0, L * L - xv * xv));
      pts.push(`${i === 0 ? 'M' : 'L'} ${px(0).toFixed(2)} ${py(yv).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [px, py]);

  const fast = y > 0.001 && Math.abs(dyDt) > 1.2;
  const reset = () => setX(2.0);

  return (
    <div className="crrv">
      <div className="crrv-head">
        <div className="crrv-head-icon"><Triangle size={18} /></div>
        <div className="crrv-head-text">
          <h3 className="crrv-title">Ladder sliding down a wall</h3>
          <p className="crrv-sub">
            The foot is pulled out at a steady <span dangerouslySetInnerHTML={{ __html: km('\\tfrac{dx}{dt}=0.6\\,\\text{m/s}') }} />. Since
            <span dangerouslySetInnerHTML={{ __html: km('x^2+y^2=L^2') }} />, the top falls at <span dangerouslySetInnerHTML={{ __html: km("\\tfrac{dy}{dt}=-\\tfrac{x}{y}\\tfrac{dx}{dt}") }} /> — slide the foot and watch it plunge.
          </p>
        </div>
        <button type="button" className="crrv-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="crrv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="crrv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="crrv-ladder-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--hue-violet)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <filter id="crrv-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* wall */}
          <rect x={originX - 12} y={padT - 6} width={12} height={plotH + 6} fill="var(--hover-box)" stroke="var(--border)" />
          {/* floor */}
          <rect x={originX - 12} y={originY} width={plotW + 30} height={12} fill="var(--hover-box)" stroke="var(--border)" />

          {/* path of the top along the wall */}
          <path d={arcPath} fill="none" stroke="var(--border)" strokeWidth={1.2} strokeDasharray="4 4" />

          {/* legs of the right triangle */}
          <line x1={originX} y1={topY} x2={originX} y2={footY} stroke="var(--hue-sky)" strokeWidth={1.4} strokeDasharray="5 4" />
          <line x1={originX} y1={footY} x2={footX} y2={footY} stroke="var(--hue-mint)" strokeWidth={1.4} strokeDasharray="5 4" />

          {/* the ladder (hypotenuse) */}
          <line x1={footX} y1={footY} x2={topX} y2={topY} stroke="url(#crrv-ladder-grad)" strokeWidth={5} strokeLinecap="round" filter="url(#crrv-glow)" />

          {/* top point with down-arrow showing it falls */}
          <circle cx={topX} cy={topY} r={7} fill="var(--hue-pink)" stroke="var(--bg)" strokeWidth={2} />
          {y > 0.4 && (
            <g>
              <line x1={topX + 16} y1={topY} x2={topX + 16} y2={topY + 26} stroke="var(--hue-pink)" strokeWidth={2} />
              <path d={`M ${topX + 16} ${topY + 30} l -4 -7 l 8 0 z`} fill="var(--hue-pink)" />
            </g>
          )}

          {/* foot point with right-arrow */}
          <circle cx={footX} cy={footY} r={7} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} />
          <g>
            <line x1={footX} y1={footY + 16} x2={footX + 26} y2={footY + 16} stroke="var(--accent)" strokeWidth={2} />
            <path d={`M ${footX + 30} ${footY + 16} l -7 -4 l 0 8 z`} fill="var(--accent)" />
          </g>

          {/* labels */}
          <text x={(originX + footX) / 2} y={footY + 34} className="crrv-leg-lbl" textAnchor="middle">x = {x.toFixed(2)} m</text>
          <text x={originX - 18} y={(topY + footY) / 2} className="crrv-leg-lbl" textAnchor="end">y = {y.toFixed(2)} m</text>
          <text x={(footX + topX) / 2 + 8} y={(footY + topY) / 2 - 8} className="crrv-hyp-lbl">L = 5 m</text>

          {/* live readout panel inside the right gutter */}
          <g transform={`translate(${W - padR + 16}, ${padT + 8})`}>
            <text x={0} y={0} className="crrv-rd-title">rates right now</text>
            <text x={0} y={26} className="crrv-rd-row crrv-rd-in">dx/dt = +{DX_DT.toFixed(2)} m/s</text>
            <text x={0} y={48} className="crrv-rd-row crrv-rd-out">
              dy/dt = {Number.isFinite(dyDt) ? dyDt.toFixed(2) : '-inf'} m/s
            </text>
            <text x={0} y={78} className="crrv-rd-note">{fast ? 'top plunging — x/y is large' : 'top easing down'}</text>
          </g>
        </svg>
      </div>

      <div className="crrv-controls">
        <label className="crrv-slider">
          <span><MoveRight size={13} /> foot distance x</span>
          <input type="range" min={0.3} max={4.7} step={0.01} value={x} onChange={(e) => setX(Number(e.target.value))} />
          <span className="crrv-slider-val">{x.toFixed(2)} m</span>
        </label>
      </div>

      <div className="crrv-stats">
        <div className="crrv-statcard crrv-accent">
          <span className="crrv-stat-label">foot rate (driven)</span>
          <span className="crrv-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\tfrac{dx}{dt} = +${DX_DT.toFixed(2)}`) }} />
        </div>
        <div className="crrv-statcard crrv-pink">
          <span className="crrv-stat-label">top rate (linked)</span>
          <span className="crrv-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\tfrac{dy}{dt} = ${Number.isFinite(dyDt) ? dyDt.toFixed(3) : '-\\infty'}`) }} />
        </div>
        <div className="crrv-statcard crrv-sky">
          <span className="crrv-stat-label">height up wall</span>
          <span className="crrv-stat-val" dangerouslySetInnerHTML={{ __html: km(`y = ${y.toFixed(3)}`) }} />
        </div>
        <div className="crrv-statcard">
          <span className="crrv-stat-label">ratio x / y</span>
          <span className="crrv-stat-val" dangerouslySetInnerHTML={{ __html: km(y > 0.001 ? `${(x / y).toFixed(3)}` : '\\infty') }} />
        </div>
      </div>

      <div className="crrv-trace">
        <span className="crrv-trace-label">reading</span>
        <span className="crrv-trace-body">
          {y > 0.4
            ? `Foot at x = ${x.toFixed(2)} m, top at y = ${y.toFixed(2)} m. The chain rule gives dy/dt = -(x/y)(dx/dt) = -(${(x / y).toFixed(2)})(0.6) = ${dyDt.toFixed(3)} m/s. Same foot speed, but the top falls ${Math.abs(dyDt) > DX_DT ? 'faster' : 'slower'} than the foot moves because x/y = ${(x / y).toFixed(2)}.`
            : `The top is near the floor (y -> 0), so x/y blows up and dy/dt -> negative infinity: even a gentle pull on the foot sends the top crashing down. That is the math predicting the snap, straight from x^2 + y^2 = L^2.`}
        </span>
      </div>
    </div>
  );
}
