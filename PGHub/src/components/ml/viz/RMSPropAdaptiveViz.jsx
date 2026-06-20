import React, { useMemo, useState } from 'react';
import { RotateCcw, Play, Pause, StepForward } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 380;
const PAD = 44;
const PLOT_W = 320;
const BAR_X0 = PAD + PLOT_W + 40;
const BAR_W = W - BAR_X0 - PAD;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// anisotropic bowl: L = 0.5*(ax x^2 + ay y^2), ax >> ay
const AX = 9.0; // steep axis
const AY = 0.3; // shallow axis

function grad(x, y) {
  return [AX * x, AY * y];
}

function runGD(steps) {
  // one global lr; must be small enough for the steep axis -> crawls on shallow
  const eta = 0.18;
  let x = 2.6;
  let y = 2.6;
  const path = [[x, y]];
  for (let t = 0; t < steps; t++) {
    const [gx, gy] = grad(x, y);
    x -= eta * gx;
    y -= eta * gy;
    path.push([x, y]);
  }
  return path;
}

function runRMS(steps) {
  const eta = 0.5;
  const rho = 0.9;
  const eps = 1e-6;
  let x = 2.6;
  let y = 2.6;
  let vx = 0;
  let vy = 0;
  const path = [[x, y]];
  const vhist = [[0, 0]];
  for (let t = 0; t < steps; t++) {
    const [gx, gy] = grad(x, y);
    vx = rho * vx + (1 - rho) * gx * gx;
    vy = rho * vy + (1 - rho) * gy * gy;
    x -= (eta / (Math.sqrt(vx) + eps)) * gx;
    y -= (eta / (Math.sqrt(vy) + eps)) * gy;
    path.push([x, y]);
    vhist.push([vx, vy]);
  }
  return { path, vhist };
}

const STEPS = 60;

export default function RMSPropAdaptiveViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const gdPath = useMemo(() => runGD(STEPS), []);
  const rms = useMemo(() => runRMS(STEPS), []);

  React.useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= STEPS) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 90);
    return () => clearInterval(id);
  }, [playing]);

  const XMIN = -2.9;
  const XMAX = 2.9;
  const YMIN = -2.9;
  const YMAX = 2.9;
  const top = PAD;
  const plotH = H - PAD - 60;

  const sx = (wx) => PAD + ((wx - XMIN) / (XMAX - XMIN)) * PLOT_W;
  const sy = (wy) => top + plotH - ((wy - YMIN) / (YMAX - YMIN)) * plotH;

  const gdPts = gdPath.slice(0, step + 1);
  const rmsPts = rms.path.slice(0, step + 1);
  const gdD = gdPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p[0])} ${sy(p[1])}`).join(' ');
  const rmsD = rmsPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p[0])} ${sy(p[1])}`).join(' ');

  const gdCur = gdPath[step];
  const rmsCur = rms.path[step];
  const v = rms.vhist[step];
  const vmax = Math.max(...rms.vhist.map((vh) => Math.max(vh[0], vh[1])), 1e-3);

  // elliptical contours of the bowl
  const contours = [0.6, 1.3, 2.2];

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '840px' }}>
          <text x={PAD} y={top - 16} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            STEEP × · SHALLOW y  ·  vanilla GD vs RMSprop
          </text>
          {/* frame */}
          <rect x={PAD} y={top} width={PLOT_W} height={plotH} fill="none" stroke="var(--border)" strokeWidth="0.8" rx="3" />
          {/* contour ellipses: x^2/(c/ax)... use scale by sqrt(2c/a) */}
          {contours.map((c) => {
            const rxw = Math.sqrt((2 * c) / AX);
            const ryw = Math.sqrt((2 * c) / AY);
            return (
              <ellipse
                key={`c-${c}`}
                cx={sx(0)}
                cy={sy(0)}
                rx={(rxw / (XMAX - XMIN)) * PLOT_W}
                ry={(ryw / (YMAX - YMIN)) * plotH}
                fill="none"
                stroke="var(--hue-violet)"
                strokeWidth="0.6"
                opacity="0.4"
              />
            );
          })}
          {/* minimum */}
          <circle cx={sx(0)} cy={sy(0)} r="3" fill="var(--hue-mint, var(--accent))" />
          {/* GD path */}
          <path d={gdD} fill="none" stroke="var(--hue-pink)" strokeWidth="1.5" opacity="0.85" />
          <circle cx={sx(gdCur[0])} cy={sy(gdCur[1])} r="3.5" fill="var(--hue-pink)" />
          {/* RMS path */}
          <path d={rmsD} fill="none" stroke="var(--accent)" strokeWidth="1.6" opacity="0.9" />
          <circle cx={sx(rmsCur[0])} cy={sy(rmsCur[1])} r="3.5" fill="var(--accent)" />

          {/* legend */}
          <g fontFamily="var(--mono)" fontSize="7.5">
            <rect x={PAD + 6} y={top + 6} width="9" height="3" fill="var(--hue-pink)" />
            <text x={PAD + 19} y={top + 9} fill="var(--text-dim)">GD (zig-zag)</text>
            <rect x={PAD + 6} y={top + 18} width="9" height="3" fill="var(--accent)" />
            <text x={PAD + 19} y={top + 21} fill="var(--text-dim)">RMSprop</text>
          </g>

          {/* second-moment bars */}
          <text x={BAR_X0} y={top - 16} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            v = running E[g²]
          </text>
          {[['x', v[0]], ['y', v[1]]].map(([lab, val], i) => {
            const bx = BAR_X0 + i * (BAR_W / 2);
            const bw = BAR_W / 2 - 14;
            const bh = (val / vmax) * (plotH - 24);
            const by = top + plotH - bh;
            return (
              <g key={`v-${lab}`}>
                <rect x={bx} y={top} width={bw} height={plotH} fill="none" stroke="var(--border)" strokeWidth="0.5" rx="2" />
                <rect x={bx} y={by} width={bw} height={Math.max(1, bh)} fill={i === 0 ? 'var(--hue-pink)' : 'var(--accent)'} opacity="0.7" rx="2" />
                <text x={bx + bw / 2} y={top + plotH + 12} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                  v_{lab}
                </text>
                <text x={bx + bw / 2} y={by - 4} fontSize="7" fill="var(--text-main)" fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
                  {snap(val, 2)}
                </text>
              </g>
            );
          })}
          <text x={BAR_X0} y={top + plotH + 28} fontSize="6.5" fill="var(--text-dim)" fontFamily="var(--mono)">
            step ÷ √v: big v → small step
          </text>

          <line x1={PAD} y1={H - 16} x2={W - PAD} y2={H - 16} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 3" />
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">step</span>
          <input type="range" min="0" max={STEPS} step="1" value={step} onChange={(e) => setStep(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{step}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">GD</span>
            <span className="mlviz-val">pos = ({snap(gdCur[0], 2)}, {snap(gdCur[1], 2)}) · ‖·‖ = {snap(Math.hypot(gdCur[0], gdCur[1]), 3)}</span>
            <span className="mlviz-sub">one global lr — bounces on the steep axis, crawls on the shallow one</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">RMS</span>
            <span className="mlviz-val">pos = ({snap(rmsCur[0], 2)}, {snap(rmsCur[1], 2)}) · ‖·‖ = {snap(Math.hypot(rmsCur[0], rmsCur[1]), 3)}</span>
            <span className="mlviz-sub">per-coord lr: η/√v_x small, η/√v_y large — straight to the bottom</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">v ratio</span>
            <span className="mlviz-val">v_x / v_y = {snap(v[1] > 1e-9 ? v[0] / v[1] : 0, 1)}</span>
            <span className="mlviz-sub">steep axis accrues far more squared gradient — gets the smaller step</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => setStep((s) => Math.min(STEPS, s + 1))}>
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => { setStep(0); setPlaying(false); }}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          RMSprop divides each coordinate's step by the square root of its own running mean-squared gradient ·
          the steep axis self-throttles, the flat axis speeds up, and the zig-zag collapses
        </div>
      </div>
    </div>
  );
}
