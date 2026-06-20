import React, { useMemo, useState } from 'react';
import { RotateCcw, Play } from 'lucide-react';
import './MLViz.css';

const W = 540;
const H = 360;
const PAD_L = 48;
const PAD_R = 24;
const PAD_T = 24;
const PAD_B = 44;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const W_MIN = -2;
const W_MAX = 8;
const L_MAX = 28;

const f = (w) => (w - 3) * (w - 3);
const grad = (w) => 2 * (w - 3);

const xToPx = (w) => PAD_L + ((w - W_MIN) / (W_MAX - W_MIN)) * PLOT_W;
const yToPx = (l) => PAD_T + (1 - Math.min(l, L_MAX) / L_MAX) * PLOT_H;

const PATH = (() => {
  const N = 220;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const w = W_MIN + ((W_MAX - W_MIN) * i) / N;
    const l = f(w);
    if (l <= L_MAX) {
      pts.push(`${pts.length === 0 ? 'M' : 'L'}${xToPx(w).toFixed(2)},${yToPx(l).toFixed(2)}`);
    }
  }
  return pts.join(' ');
})();

const X_TICKS = [-2, 0, 2, 3, 4, 6, 8];
const Y_TICKS = [0, 5, 10, 15, 20, 25];

export default function ParabolaDescentViz() {
  const [w0, setW0] = useState(7);
  const [eta, setEta] = useState(0.2);
  const [steps, setSteps] = useState(0);

  const trajectory = useMemo(() => {
    const traj = [w0];
    let w = w0;
    for (let i = 0; i < steps; i++) {
      w = w - eta * grad(w);
      traj.push(w);
    }
    return traj;
  }, [w0, eta, steps]);

  const currentW = trajectory[trajectory.length - 1];
  const currentL = f(currentW);
  const currentG = grad(currentW);

  const exploding = eta >= 1.0;
  const converging = Math.abs(currentG) < 0.05;

  const tone = exploding
    ? 'var(--hard, #f87171)'
    : converging
      ? 'var(--easy, #2dd4bf)'
      : 'var(--accent)';

  const onTakeStep = () => setSteps(steps + 1);
  const onReset = () => setSteps(0);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="pdv-step" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={tone} />
            </marker>
            <linearGradient id="pdv-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {Y_TICKS.map((y) => (
            <line key={`gy${y}`} x1={PAD_L} y1={yToPx(y)} x2={W - PAD_R} y2={yToPx(y)} stroke="var(--border)" strokeWidth="0.5" opacity="0.35" />
          ))}
          {X_TICKS.map((x) => (
            <line key={`gx${x}`} x1={xToPx(x)} y1={PAD_T} x2={xToPx(x)} y2={H - PAD_B} stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
          ))}

          <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="var(--text-dim)" strokeWidth="1" />
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="var(--text-dim)" strokeWidth="1" />

          {Y_TICKS.map((y) => (
            <text key={`yt${y}`} x={PAD_L - 8} y={yToPx(y) + 4} fontSize="10.5" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="end">{y}</text>
          ))}
          {X_TICKS.map((x) => (
            <text key={`xt${x}`} x={xToPx(x)} y={H - PAD_B + 16} fontSize="10.5" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="middle">{x}</text>
          ))}

          <text x={PAD_L - 40} y={PAD_T + 12} fontSize="11" fontFamily="var(--mono)" fill="var(--text-dim)">L(w)</text>
          <text x={W - PAD_R} y={H - PAD_B + 32} fontSize="11" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="end">w</text>
          <text x={PAD_L + 6} y={PAD_T + 14} fontSize="11" fontFamily="var(--mono)" fontStyle="italic" fill="var(--accent)">L(w) = (w − 3)²</text>

          {/* fill under curve up to currentL */}
          <path d={`${PATH} L${xToPx(W_MAX)},${yToPx(0)} L${xToPx(W_MIN)},${yToPx(0)} Z`} fill="url(#pdv-fill)" />
          <path d={PATH} fill="none" stroke="var(--accent)" strokeWidth="2.2" />

          {/* minimum marker */}
          <line x1={xToPx(3)} y1={yToPx(0) - 6} x2={xToPx(3)} y2={yToPx(0) + 6} stroke="var(--easy, #2dd4bf)" strokeWidth="1.5" />
          <text x={xToPx(3)} y={yToPx(0) + 22} fontSize="10" fontFamily="var(--mono)" fill="var(--easy, #2dd4bf)" textAnchor="middle">w* = 3</text>

          {/* trajectory steps */}
          {trajectory.slice(0, -1).map((wPrev, i) => {
            const wNext = trajectory[i + 1];
            const lPrev = f(wPrev);
            const lNext = f(wNext);
            return (
              <g key={`step${i}`}>
                <line
                  x1={xToPx(wPrev)}
                  y1={yToPx(Math.min(lPrev, L_MAX))}
                  x2={xToPx(wNext)}
                  y2={yToPx(Math.min(lNext, L_MAX))}
                  stroke={tone}
                  strokeWidth="1.6"
                  opacity="0.6"
                  strokeDasharray="3 3"
                />
                <circle cx={xToPx(wPrev)} cy={yToPx(Math.min(lPrev, L_MAX))} r="3" fill={tone} opacity="0.55" />
              </g>
            );
          })}

          {/* current point */}
          <circle cx={xToPx(currentW)} cy={yToPx(Math.min(currentL, L_MAX))} r="7" fill={tone} stroke="var(--bg)" strokeWidth="2" />

          {/* gradient arrow horizontal at current w */}
          {!exploding && Math.abs(currentG) > 0.05 && (
            <line
              x1={xToPx(currentW)}
              y1={yToPx(Math.min(currentL, L_MAX)) + 18}
              x2={xToPx(currentW - eta * currentG)}
              y2={yToPx(Math.min(currentL, L_MAX)) + 18}
              stroke={tone}
              strokeWidth="2"
              markerEnd="url(#pdv-step)"
            />
          )}

          <text
            x={xToPx(currentW) + 10}
            y={Math.max(PAD_T + 14, yToPx(Math.min(currentL, L_MAX)) - 10)}
            fontSize="11.5"
            fontFamily="var(--mono)"
            fontWeight="700"
            fill={tone}
          >
            w = {currentW.toFixed(2)}, L = {currentL.toFixed(2)}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: tone }}>step {steps}</span>
          <span className="mlviz-val">
            w = {currentW.toFixed(3)}, ∇L = 2(w−3) = {currentG.toFixed(3)}
          </span>
          <span className="mlviz-sub">update: w ← w − η · ∇L = {currentW.toFixed(2)} − {eta.toFixed(2)} · {currentG.toFixed(2)}</span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: tone }}>state</span>
          <span className="mlviz-val">
            {exploding
              ? 'η ≥ 1: divergent — overshoots the minimum every step'
              : converging
                ? `converged at w* ≈ 3 (loss ≈ ${currentL.toFixed(3)})`
                : Math.abs(currentG) < 0.5
                  ? 'closing in — slope flattens near the minimum'
                  : 'descending — gradient points uphill, step goes the other way'}
          </span>
        </div>
      </div>

      <div className="mt-controls">
        <div className="mlviz-slider" style={{ flex: 1, minWidth: 180 }}>
          <span className="mlviz-slider-label">w₀</span>
          <input
            type="range"
            min="-2"
            max="8"
            step="0.1"
            value={w0}
            onChange={(e) => { setW0(parseFloat(e.target.value)); setSteps(0); }}
          />
          <span className="mlviz-slider-val">{w0.toFixed(1)}</span>
        </div>
        <div className="mlviz-slider" style={{ flex: 1, minWidth: 180 }}>
          <span className="mlviz-slider-label">η (learning rate)</span>
          <input
            type="range"
            min="0.02"
            max="1.2"
            step="0.02"
            value={eta}
            onChange={(e) => { setEta(parseFloat(e.target.value)); setSteps(0); }}
          />
          <span className="mlviz-slider-val">{eta.toFixed(2)}</span>
        </div>
        <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={onTakeStep}>
          <Play size={14} /> step
        </button>
        <button type="button" className="mlviz-btn" onClick={() => setSteps(Math.min(steps + 10, 200))}>
          ×10
        </button>
        <button type="button" className="mlviz-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
