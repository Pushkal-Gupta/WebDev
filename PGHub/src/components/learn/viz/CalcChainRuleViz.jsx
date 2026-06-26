import React, { useRef, useState, useCallback } from 'react';
import katex from 'katex';
import { RotateCcw, Link2 } from 'lucide-react';
import './CalcChainRuleViz.css';

// Composition: u = f(x) = sin(x) + 1.6 ;  y = g(u) = u^2.
// f'(x) = cos(x) ;  g'(u) = 2u ;  dy/dx = 2*(sin x + 1.6)*cos x.
function f(x) { return Math.sin(x) + 1.6; }
function fprime(x) { return Math.cos(x); }
function g(u) { return u * u; }
function gprime(u) { return 2 * u; }

const X_MIN = -3;
const X_MAX = 3;

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

export default function CalcChainRuleViz() {
  const [x, setX] = useState(0.8);
  const svgRef = useRef(null);

  const W = 760;
  const H = 360;

  // Three stacked number lines: x (top), u (middle), y (bottom).
  const padL = 70;
  const padR = 60;
  const trackW = W - padL - padR;
  const rowX = 70;
  const rowU = 180;
  const rowY = 290;

  // domains for each track
  const xDom = [X_MIN, X_MAX];
  const uDom = [0, 3.2];      // f range roughly 0.6..2.6
  const yDom = [0, 9];        // g of that

  const map = useCallback((v, dom) => padL + ((v - dom[0]) / (dom[1] - dom[0])) * trackW, [trackW]);
  const invX = useCallback((px) => X_MIN + ((px - padL) / trackW) * (X_MAX - X_MIN), [trackW]);

  const u = f(x);
  const y = g(u);
  const fp = fprime(x);
  const gp = gprime(u);
  const chain = gp * fp;

  // A nudge of dx in x produces these downstream nudges (scaled for display).
  const dx = 0.35;
  const du = fp * dx;
  const dy = gp * du;

  const onPointerDown = (e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); };
  const move = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let nx = invX(px);
    nx = Math.max(X_MIN + 0.05, Math.min(X_MAX - 0.05, nx));
    setX(Number(nx.toFixed(3)));
  };
  const onPointerMove = (e) => { if (e.buttons === 1) move(e); };
  const reset = () => setX(0.8);

  const tracks = [
    { ty: rowX, label: 'x', color: 'var(--accent)' },
    { ty: rowU, label: 'u = f(x)', color: 'var(--hue-violet)' },
    { ty: rowY, label: 'y = g(u)', color: 'var(--easy)' },
  ];

  const xPx = map(x, xDom);
  const uPx = map(u, uDom);
  const yPx = map(y, yDom);
  const xNudgePx = map(x + dx, xDom);
  const uNudgePx = map(u + du, uDom);
  const yNudgePx = map(y + dy, yDom);

  return (
    <div className="ccv">
      <div className="ccv-head">
        <div className="ccv-head-icon"><Link2 size={18} /></div>
        <div className="ccv-head-text">
          <h3 className="ccv-title">Rates multiply down the chain</h3>
          <p className="ccv-sub">
            Drag <span dangerouslySetInnerHTML={{ __html: km('x') }} /> on the top track. A fixed nudge is
            amplified by <span dangerouslySetInnerHTML={{ __html: km("f'(x)") }} /> into the middle track,
            then by <span dangerouslySetInnerHTML={{ __html: km("g'(u)") }} /> into the bottom — the total is the product.
          </p>
        </div>
        <button type="button" className="ccv-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="ccv-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="ccv-svg" preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
          <defs>
            <marker id="ccv-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
            </marker>
          </defs>

          <rect x={20} y={16} width={W - 40} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={10} />

          {tracks.map((t) => (
            <g key={t.label}>
              <line x1={padL} y1={t.ty} x2={padL + trackW} y2={t.ty} stroke="var(--border)" strokeWidth={1.4} />
              <text x={padL - 12} y={t.ty + 4} className="ccv-track-lbl" textAnchor="end" style={{ fill: t.color }}>{t.label}</text>
            </g>
          ))}

          {/* propagation arrows between tracks, annotated with the local rate */}
          <line x1={xPx} y1={rowX + 10} x2={uPx} y2={rowU - 10} stroke="var(--accent)" strokeWidth={1.6} markerEnd="url(#ccv-arrow)" />
          <text x={(xPx + uPx) / 2 + 10} y={(rowX + rowU) / 2} className="ccv-rate-lbl">&times; f&apos;(x) = {fp.toFixed(2)}</text>
          <line x1={uPx} y1={rowU + 10} x2={yPx} y2={rowY - 10} stroke="var(--hue-violet)" strokeWidth={1.6} markerEnd="url(#ccv-arrow)" />
          <text x={(uPx + yPx) / 2 + 10} y={(rowU + rowY) / 2} className="ccv-rate-lbl">&times; g&apos;(u) = {gp.toFixed(2)}</text>

          {/* nudge spans (faded) on each track */}
          <rect x={Math.min(xPx, xNudgePx)} y={rowX - 7} width={Math.abs(xNudgePx - xPx)} height={14} fill="rgba(var(--accent-rgb),0.22)" rx={3} />
          <rect x={Math.min(uPx, uNudgePx)} y={rowU - 7} width={Math.abs(uNudgePx - uPx)} height={14} fill="rgba(var(--hue-violet-rgb),0.22)" rx={3} />
          <rect x={Math.min(yPx, yNudgePx)} y={rowY - 7} width={Math.abs(yNudgePx - yPx)} height={14} fill="rgba(var(--hue-mint-rgb),0.28)" rx={3} />

          {/* draggable x handle */}
          <circle cx={xPx} cy={rowX} r={14} fill="rgba(var(--accent-rgb), 0.18)" />
          <circle cx={xPx} cy={rowX} r={7} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} className="ccv-handle" />
          <text x={xPx} y={rowX - 18} className="ccv-val-lbl" textAnchor="middle" style={{ fill: 'var(--accent)' }}>{x.toFixed(2)}</text>

          {/* u and y derived dots */}
          <circle cx={uPx} cy={rowU} r={6} fill="var(--hue-violet)" stroke="var(--bg)" strokeWidth={1.6} />
          <text x={uPx} y={rowU + 24} className="ccv-val-lbl" textAnchor="middle" style={{ fill: 'var(--hue-violet)' }}>{u.toFixed(2)}</text>
          <circle cx={yPx} cy={rowY} r={6} fill="var(--easy)" stroke="var(--bg)" strokeWidth={1.6} />
          <text x={yPx} y={rowY + 24} className="ccv-val-lbl" textAnchor="middle" style={{ fill: 'var(--easy)' }}>{y.toFixed(2)}</text>
        </svg>
      </div>

      <div className="ccv-stats">
        <div className="ccv-statcard">
          <span className="ccv-stat-label">inner rate</span>
          <span className="ccv-stat-val" dangerouslySetInnerHTML={{ __html: km(`f'(x) = ${fp.toFixed(3)}`) }} />
        </div>
        <div className="ccv-statcard">
          <span className="ccv-stat-label">outer rate (at u)</span>
          <span className="ccv-stat-val" dangerouslySetInnerHTML={{ __html: km(`g'(u) = ${gp.toFixed(3)}`) }} />
        </div>
        <div className="ccv-statcard ccv-accent">
          <span className="ccv-stat-label">chain rule</span>
          <span className="ccv-stat-val" dangerouslySetInnerHTML={{ __html: km(`g'(f(x))\\,f'(x) = ${chain.toFixed(3)}`) }} />
        </div>
        <div className="ccv-statcard">
          <span className="ccv-stat-label">nudge product</span>
          <span className="ccv-stat-val" dangerouslySetInnerHTML={{ __html: km(`dy/dx \\approx ${(dy / dx).toFixed(3)}`) }} />
        </div>
      </div>

      <div className="ccv-trace">
        <span className="ccv-trace-label">reading</span>
        <span className="ccv-trace-body">
          A nudge dx = {dx.toFixed(2)} in x becomes du = {du.toFixed(3)} (amplified by f&apos;(x) = {fp.toFixed(2)}),
          which becomes dy = {dy.toFixed(3)} (amplified by g&apos;(u) = {gp.toFixed(2)}). The two amplifications
          multiply: dy/dx = {fp.toFixed(2)} &times; {gp.toFixed(2)} = {chain.toFixed(3)}.
        </span>
      </div>
    </div>
  );
}
