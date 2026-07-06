import React, { useMemo, useState } from 'react';
import { StepForward, RotateCcw } from 'lucide-react';
import './MLViz.css';

/*
 * 1D optimization: compare a gradient step (move along the tangent line by
 * -lr * f'(x)) against a Newton step (jump to the minimum of the local
 * quadratic fit, x - f'(x)/f''(x)). On a well-conditioned function the GD
 * step is reasonable; on an ill-conditioned (sharply curved) one GD must
 * crawl while Newton lands on the minimum in essentially one step because
 * f''(x) carries the curvature GD ignores.
 */

const W = 600;
const H = 360;
const PAD_L = 44;
const PAD_R = 18;
const PAD_T = 22;
const PAD_B = 36;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const X_MIN = -3.2;
const X_MAX = 3.2;

// Two parabolas f(x) = 0.5*k*(x-m)^2 + c. Well-conditioned: gentle k.
// Ill-conditioned: steep k (curvature large -> a fixed GD lr overshoots,
// so a stable lr must be tiny -> crawl). minimum at x = m for both.
const FUNCS = {
  well: { k: 0.5, m: 0.0, c: 0.4, lr: 0.55, label: 'well-conditioned (k = 0.5)' },
  ill: { k: 6.0, m: 0.0, c: 0.4, lr: 0.06, label: 'ill-conditioned (k = 6.0)' },
};

const START_X = -2.6;

function snap(v, p = 3) { const m = Math.pow(10, p); return Math.round(v * m) / m; }

function f(cfg, x) { return 0.5 * cfg.k * (x - cfg.m) ** 2 + cfg.c; }
function fp(cfg, x) { return cfg.k * (x - cfg.m); }      // first derivative
function fpp(cfg) { return cfg.k; }                       // second derivative (const)

export default function SecondOrderViz() {
  const [mode, setMode] = useState('ill');
  const [gdX, setGdX] = useState(START_X);
  const [newtonX, setNewtonX] = useState(START_X);
  const [gdIters, setGdIters] = useState(0);
  const [newtonIters, setNewtonIters] = useState(0);

  const cfg = FUNCS[mode];

  // y-range from sampling the curve over [X_MIN, X_MAX]
  const { yMin, yMax } = useMemo(() => {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 80; i++) {
      const x = X_MIN + (i / 80) * (X_MAX - X_MIN);
      const y = f(cfg, x);
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    }
    const pad = (hi - lo) * 0.08;
    return { yMin: lo - pad, yMax: hi + pad };
  }, [cfg]);

  const xToPx = (x) => PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
  const yToPx = (y) => PAD_T + (1 - (y - yMin) / (yMax - yMin)) * PLOT_H;

  const curvePath = useMemo(() => {
    const parts = [];
    for (let i = 0; i <= 120; i++) {
      const x = X_MIN + (i / 120) * (X_MAX - X_MIN);
      parts.push(`${i === 0 ? 'M' : 'L'}${xToPx(x).toFixed(2)},${yToPx(f(cfg, x)).toFixed(2)}`);
    }
    return parts.join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, yMin, yMax]);

  // tangent line at gdX (gradient direction visual)
  const gSlope = fp(cfg, gdX);
  const tanX0 = X_MIN, tanX1 = X_MAX;
  const tanY0 = f(cfg, gdX) + gSlope * (tanX0 - gdX);
  const tanY1 = f(cfg, gdX) + gSlope * (tanX1 - gdX);

  // GD next point
  const gdNext = gdX - cfg.lr * fp(cfg, gdX);

  // Newton: local quadratic fit (which equals the true parabola here),
  // its vertex is the minimum the Newton step jumps to.
  const newtonNext = newtonX - fp(cfg, newtonX) / fpp(cfg);
  const parabPath = useMemo(() => {
    // local 2nd-order Taylor around newtonX (matches f exactly for a parabola)
    const a = 0.5 * fpp(cfg);
    const b = fp(cfg, newtonX);
    const c0 = f(cfg, newtonX);
    const parts = [];
    for (let i = 0; i <= 60; i++) {
      const x = X_MIN + (i / 60) * (X_MAX - X_MIN);
      const dx = x - newtonX;
      const y = c0 + b * dx + a * dx * dx;
      parts.push(`${i === 0 ? 'M' : 'L'}${xToPx(x).toFixed(2)},${yToPx(y).toFixed(2)}`);
    }
    return parts.join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, newtonX, yMin, yMax]);

  const COLOR_GD = 'var(--hue-pink)';
  const COLOR_NEWTON = 'var(--accent)';

  const stepGd = () => { setGdX(gdNext); setGdIters((n) => n + 1); };
  const stepNewton = () => { setNewtonX(newtonNext); setNewtonIters((n) => n + 1); };
  const stepBoth = () => { stepGd(); stepNewton(); };

  const handleReset = () => {
    setGdX(START_X); setNewtonX(START_X); setGdIters(0); setNewtonIters(0);
  };
  const switchMode = (m) => {
    setMode(m); setGdX(START_X); setNewtonX(START_X); setGdIters(0); setNewtonIters(0);
  };

  const distGd = Math.abs(gdX - cfg.m);
  const distNewton = Math.abs(newtonX - cfg.m);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg so-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="so-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L7,4 L0,8 Z" fill="var(--text-dim)" />
            </marker>
          </defs>

          {/* baseline (minimum x) */}
          <line x1={xToPx(cfg.m)} y1={PAD_T} x2={xToPx(cfg.m)} y2={H - PAD_B} stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.45" />
          <text x={xToPx(cfg.m) + 4} y={PAD_T + 10} fontSize="11.5" fill="var(--accent)" fontFamily="var(--mono)">min</text>

          {/* axis */}
          <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="var(--border)" strokeWidth="1" opacity="0.6" />
          {[-3, -2, -1, 0, 1, 2, 3].map((tx) => (
            <text key={`xt${tx}`} x={xToPx(tx)} y={H - PAD_B + 14} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">{tx}</text>
          ))}
          <text x={PAD_L + PLOT_W / 2} y={H - 4} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">parameter x</text>

          {/* Newton's local parabola fit */}
          <path d={parabPath} fill="none" stroke={COLOR_NEWTON} strokeWidth="1.4" strokeDasharray="4 4" opacity="0.65" />

          {/* the loss curve */}
          <path d={curvePath} fill="none" stroke="var(--text-main)" strokeWidth="2.4" opacity="0.85" />

          {/* GD tangent line */}
          <line x1={xToPx(tanX0)} y1={yToPx(tanY0)} x2={xToPx(tanX1)} y2={yToPx(tanY1)} stroke={COLOR_GD} strokeWidth="1.3" strokeDasharray="2 3" opacity="0.7" />

          {/* GD: current point + step arrow */}
          <circle cx={xToPx(gdX)} cy={yToPx(f(cfg, gdX))} r={5.5} fill={COLOR_GD} stroke="var(--bg)" strokeWidth="1.5" />
          <line x1={xToPx(gdX)} y1={yToPx(f(cfg, gdX)) - 14} x2={xToPx(gdNext)} y2={yToPx(f(cfg, gdX)) - 14} stroke={COLOR_GD} strokeWidth="1.6" markerEnd="url(#so-arrow)" opacity="0.8" />

          {/* Newton: current point + jump target */}
          <circle cx={xToPx(newtonX)} cy={yToPx(f(cfg, newtonX))} r={5.5} fill={COLOR_NEWTON} stroke="var(--bg)" strokeWidth="1.5" />
          <circle cx={xToPx(newtonNext)} cy={yToPx(f(cfg, newtonNext))} r={4} fill="none" stroke={COLOR_NEWTON} strokeWidth="1.6" opacity="0.85" />
          <line x1={xToPx(newtonX)} y1={yToPx(f(cfg, newtonX)) - 28} x2={xToPx(newtonNext)} y2={yToPx(f(cfg, newtonNext)) - 28} stroke={COLOR_NEWTON} strokeWidth="1.6" markerEnd="url(#so-arrow)" opacity="0.85" />

          {/* legend */}
          <g transform={`translate(${PAD_L + 6}, ${PAD_T + 2})`}>
            <rect x="-4" y="-4" width="196" height="50" rx="6" fill="var(--surface)" opacity="0.86" stroke="var(--border)" />
            <g transform="translate(0,6)">
              <line x1="0" y1="3" x2="18" y2="3" stroke={COLOR_GD} strokeWidth="2" strokeDasharray="2 3" />
              <text x="24" y="6" fontSize="11.5" fill="var(--text-main)" fontFamily="var(--mono)">GD: step along tangent</text>
            </g>
            <g transform="translate(0,22)">
              <line x1="0" y1="3" x2="18" y2="3" stroke={COLOR_NEWTON} strokeWidth="2" strokeDasharray="4 4" />
              <text x="24" y="6" fontSize="11.5" fill="var(--text-main)" fontFamily="var(--mono)">Newton: jump to parabola min</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-toggles">
          <button type="button" className={`mlviz-toggle ${mode === 'well' ? 'is-on' : ''}`} onClick={() => switchMode('well')}>
            <span className="mlviz-toggle-dot" />Well-conditioned
          </button>
          <button type="button" className={`mlviz-toggle ${mode === 'ill' ? 'is-on' : ''}`} onClick={() => switchMode('ill')}>
            <span className="mlviz-toggle-dot" />Ill-conditioned
          </button>
        </div>

        <div className="mlviz-row so-stats-row">
          <div className="so-stat">
            <span className="so-stat-tag" style={{ color: COLOR_GD }}>Gradient descent</span>
            <span className="mlviz-val">x = {snap(gdX, 4)}</span>
            <span className="mlviz-sub">iters {gdIters} · |x − min| {snap(distGd, 4)}</span>
            <span className="mlviz-sub">step = −η·f′(x), η = {cfg.lr}</span>
          </div>
          <div className="so-stat">
            <span className="so-stat-tag" style={{ color: COLOR_NEWTON }}>Newton</span>
            <span className="mlviz-val">x = {snap(newtonX, 4)}</span>
            <span className="mlviz-sub">iters {newtonIters} · |x − min| {snap(distNewton, 4)}</span>
            <span className="mlviz-sub">step = −f′(x) / f″(x), f″ = {cfg.k}</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-btn-row">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={stepBoth}>
            <StepForward size={13} /><span>Step both</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={stepGd}>
            <StepForward size={13} /><span>Step GD</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={stepNewton}>
            <StepForward size={13} /><span>Step Newton</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} /><span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          GD only knows the slope, so it inches along the tangent · Newton fits the local parabola (dashed) and jumps to its vertex · on the ill-conditioned curve the curvature f″ is large, GD must crawl while Newton lands on the minimum in one step
        </div>
      </div>

      <style>{`
        .so-svg { aspect-ratio: ${W} / ${H}; max-width: 620px; }
        .so-stats-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; align-items: stretch; }
        .so-stat { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.45rem 0.6rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); min-width: 0; }
        .so-stat-tag { font-family: var(--mono); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        @media (max-width: 640px) { .so-stats-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
