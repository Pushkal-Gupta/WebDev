import React, { useCallback, useMemo, useRef, useState } from 'react';
import { TrendingUp, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 340;
const LEFT = 46;
const RIGHT = 18;
const TOP = 22;
const BOT = 34;
const PLOT_W = W - LEFT - RIGHT;
const PLOT_H = H - TOP - BOT;

const X_MIN = -3.4;
const X_MAX = 3.4;
const Y_MIN = -4.2;
const Y_MAX = 4.2;
const SAMPLES = 180;

// f(x) = 0.32 x^3 - 0.9 x  — a cubic with two visible bends; analytic f'.
function f(x) {
  return 0.32 * x * x * x - 0.9 * x;
}
function df(x) {
  return 0.96 * x * x - 0.9;
}

const DEFAULT_X = 1.2;
const DEFAULT_H = 1.4;
const MIN_H = 0.02;
const MAX_H = 2.4;

function fmt(v, p = 3) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

export default function DerivativeExplorerViz({ x0 = DEFAULT_X }) {
  const initX = Math.max(X_MIN + 0.3, Math.min(X_MAX - 0.6, x0));
  const [px, setPx] = useState(initX);
  const [h, setH] = useState(DEFAULT_H);
  const svgRef = useRef(null);
  const dragRef = useRef(false);

  const sx = useCallback(
    (x) => LEFT + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W,
    []
  );
  const sy = useCallback(
    (y) => TOP + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H,
    []
  );

  const fPath = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const x = X_MIN + (i / SAMPLES) * (X_MAX - X_MIN);
      const y = Math.max(Y_MIN, Math.min(Y_MAX, f(x)));
      pts.push(`${sx(x).toFixed(2)},${sy(y).toFixed(2)}`);
    }
    return 'M' + pts.join(' L');
  }, [sx, sy]);

  const fval = f(px);
  const dval = df(px);

  // secant between (px, f(px)) and (px+h, f(px+h))
  const x2 = px + h;
  const f2 = f(x2);
  const secSlope = (f2 - fval) / h;
  const gap = Math.abs(secSlope - dval);

  // draw secant as an extended segment across the plot
  const secY = (x) => fval + secSlope * (x - px);
  // draw tangent (true derivative) similarly
  const tanY = (x) => fval + dval * (x - px);

  const pScrX = sx(px);
  const pScrY = sy(fval);
  const qScrX = sx(x2);
  const qScrY = sy(Math.max(Y_MIN, Math.min(Y_MAX, f2)));

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trans = reducedMotion ? 'none' : 'cx 0.06s linear, cy 0.06s linear';

  const updateFromClientX = useCallback((clientX) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const svgX = ratio * W;
    let xVal = X_MIN + ((svgX - LEFT) / PLOT_W) * (X_MAX - X_MIN);
    xVal = Math.max(X_MIN + 0.1, Math.min(X_MAX - 0.1, xVal));
    setPx(Math.round(xVal * 100) / 100);
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      dragRef.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updateFromClientX(e.clientX);
    },
    [updateFromClientX]
  );
  const onPointerMove = useCallback(
    (e) => {
      if (!dragRef.current) return;
      updateFromClientX(e.clientX);
    },
    [updateFromClientX]
  );
  const onPointerUp = useCallback((e) => {
    dragRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const reset = useCallback(() => {
    setPx(initX);
    setH(DEFAULT_H);
  }, [initX]);

  const xTicks = [-3, -2, -1, 0, 1, 2, 3];
  const yZero = sy(0);
  const xZero = sx(0);

  // line endpoints clamped to plot x range
  const lx1 = X_MIN;
  const lx2 = X_MAX;

  const gid = 'dev-grad-main';
  const glowId = 'dev-glow-main';

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <TrendingUp size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Derivative explorer</span>
          <span className="aev-head-sub">
            shrink h — the secant pivots into the tangent, its slope into f′(x)
          </span>
        </span>
        <span className="aev-chip">x = {fmt(px, 2)}</span>
      </div>

      <div className="aev-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--hue-sky)" />
                <stop offset="100%" stopColor="var(--hue-violet)" />
              </linearGradient>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {xTicks.map((t) => (
              <g key={`xt-${t}`}>
                <line
                  x1={sx(t)}
                  y1={TOP}
                  x2={sx(t)}
                  y2={TOP + PLOT_H}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  opacity="0.5"
                />
                <text
                  x={sx(t)}
                  y={TOP + PLOT_H + 14}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                >
                  {t}
                </text>
              </g>
            ))}

            <line x1={LEFT} y1={yZero} x2={LEFT + PLOT_W} y2={yZero} stroke="var(--border)" strokeWidth="1" />
            <line x1={xZero} y1={TOP} x2={xZero} y2={TOP + PLOT_H} stroke="var(--border)" strokeWidth="1" />

            {/* glow under f(x) */}
            <path
              d={fPath}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowId})`}
              opacity="0.5"
            />
            <path
              d={fPath}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* secant line (pink) */}
            <line
              x1={sx(lx1)}
              y1={sy(secY(lx1))}
              x2={sx(lx2)}
              y2={sy(secY(lx2))}
              stroke="var(--hue-pink)"
              strokeWidth="1.4"
              strokeDasharray="6 4"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* tangent line / true derivative (mint) */}
            <line
              x1={sx(lx1)}
              y1={sy(tanY(lx1))}
              x2={sx(lx2)}
              y2={sy(tanY(lx2))}
              stroke="var(--hue-mint)"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.95"
            />
            <text
              x={sx(lx2) - 2}
              y={sy(tanY(lx2)) - 5}
              fontSize="8.5"
              fill="var(--hue-mint)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              tangent {fmt(dval, 2)}
            </text>

            {/* rise/run helper between the two points */}
            <line
              x1={pScrX}
              y1={pScrY}
              x2={qScrX}
              y2={pScrY}
              stroke="var(--hue-pink)"
              strokeWidth="0.9"
              strokeDasharray="2 3"
              opacity="0.7"
            />
            <line
              x1={qScrX}
              y1={pScrY}
              x2={qScrX}
              y2={qScrY}
              stroke="var(--hue-pink)"
              strokeWidth="0.9"
              strokeDasharray="2 3"
              opacity="0.7"
            />

            {/* second point (x + h) */}
            <circle cx={qScrX} cy={qScrY} r="9" fill="color-mix(in srgb, var(--hue-pink) 18%, transparent)" />
            <circle cx={qScrX} cy={qScrY} r="3.4" fill="var(--hue-pink)" />

            {/* anchor point — draggable */}
            <circle cx={pScrX} cy={pScrY} r="11" fill="rgba(var(--accent-rgb), 0.16)" style={{ transition: trans }} />
            <circle
              cx={pScrX}
              cy={pScrY}
              r="6.5"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.4"
              opacity="0.7"
              style={{ transition: trans }}
            />
            <circle cx={pScrX} cy={pScrY} r="4" fill="var(--accent)" style={{ transition: trans, cursor: 'grab' }} />
          </svg>
        </div>

        <div className="mlviz-statcol aev-cards">
          <div className="mlviz-statcard mlviz-statcard-dim">
            <span className="mlviz-statcard-label">point x</span>
            <span className="mlviz-statcard-val">{fmt(px, 2)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-mint">
            <span className="mlviz-statcard-label">f′(x) true</span>
            <span className="mlviz-statcard-val">{fmt(dval)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-pink">
            <span className="mlviz-statcard-label">secant slope</span>
            <span className="mlviz-statcard-val">{fmt(secSlope)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-sky">
            <span className="mlviz-statcard-label">step h</span>
            <span className="mlviz-statcard-val">{fmt(h, 2)}</span>
          </div>
          <div className="aev-expr">|secant − f′| = {fmt(gap)}</div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">x</span>
          <input
            type="range"
            min={X_MIN + 0.1}
            max={X_MAX - 0.1}
            step="0.01"
            value={px}
            onChange={(e) => setPx(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{fmt(px, 2)}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">h</span>
          <input
            type="range"
            min={MIN_H}
            max={MAX_H}
            step="0.01"
            value={h}
            onChange={(e) => setH(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{fmt(h, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          pink = secant over a finite h · mint = the true tangent · drag h → 0 and the gap collapses
        </div>
      </div>
    </div>
  );
}
