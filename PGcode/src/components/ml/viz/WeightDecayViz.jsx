import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RefreshCw, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 520;
const H = 320;

const PAD_L = 50;
const PAD_R = 22;
const PAD_T = 30;
const PAD_B = 36;

const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const MAX_STEPS = 100;

// Stable noisy data points around the bowl f(w) = w^2 + noise.
// We surface a few representative samples to render in the surface panel.
const DATA_SAMPLES = (() => {
  let seed = 24601;
  const r = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const pts = [];
  for (let i = 0; i < 18; i++) {
    const w = -2.4 + (4.8 * i) / 17;
    const noise = (r() * 2 - 1) * 0.6;
    pts.push({ w, l: w * w + noise });
  }
  return pts;
})();

function snap(v, p = 3) {
  if (!Number.isFinite(v)) return '–';
  const m = Math.pow(10, p);
  return (Math.round(v * m) / m).toFixed(p);
}

function loss(w) {
  return w * w;
}

function gradLoss(w) {
  return 2 * w;
}

function runTraining({ steps, w0, lr, lambda }) {
  // history of weights and losses; lambda=0 means no weight decay.
  const ws = new Array(steps + 1);
  const ls = new Array(steps + 1);
  let w = w0;
  ws[0] = w;
  ls[0] = loss(w);
  for (let t = 1; t <= steps; t++) {
    const g = gradLoss(w) + lambda * w;
    w = w - lr * g;
    ws[t] = w;
    ls[t] = loss(w);
  }
  return { ws, ls };
}

// Map a "step" coordinate (0..MAX_STEPS) into the plot x-range.
function sx(step, totalSteps) {
  const denom = Math.max(1, totalSteps);
  return PAD_L + (step / denom) * PLOT_W;
}

// Map a loss value into the plot y-range with a soft clamp on the top.
function sy(lossVal, lossMax) {
  const v = Math.max(0, Math.min(lossMax, lossVal));
  return PAD_T + PLOT_H - (v / lossMax) * PLOT_H;
}

function buildPath(ls, totalSteps, lossMax, upTo) {
  let d = '';
  const cap = Math.min(upTo, ls.length - 1);
  for (let i = 0; i <= cap; i++) {
    const x = sx(i, totalSteps);
    const y = sy(ls[i], lossMax);
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

// Bowl surface coordinates for the small loss-surface panel.
const BOWL_W = 220;
const BOWL_H = 140;
const BOWL_PAD_L = 30;
const BOWL_PAD_R = 12;
const BOWL_PAD_T = 14;
const BOWL_PAD_B = 26;
const BOWL_PLOT_W = BOWL_W - BOWL_PAD_L - BOWL_PAD_R;
const BOWL_PLOT_H = BOWL_H - BOWL_PAD_T - BOWL_PAD_B;
const W_MIN = -2.6;
const W_MAX = 2.6;
const L_MAX = 7;

function bx(w) {
  return BOWL_PAD_L + ((w - W_MIN) / (W_MAX - W_MIN)) * BOWL_PLOT_W;
}
function by(l) {
  const v = Math.max(0, Math.min(L_MAX, l));
  return BOWL_PAD_T + BOWL_PLOT_H - (v / L_MAX) * BOWL_PLOT_H;
}

const BOWL_CURVE = (() => {
  const N = 80;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const w = W_MIN + ((W_MAX - W_MIN) * i) / N;
    const x = bx(w);
    const y = by(loss(w));
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
})();

const COLOR_NO = 'var(--hue-pink, #ff66cc)';
const COLOR_WD = 'var(--hue-sky, #5ecbff)';

export default function WeightDecayViz() {
  const [lambda, setLambda] = useState(0.2);
  const [lr, setLr] = useState(0.1);
  const [w0, setW0] = useState(2.2);
  const [stepShown, setStepShown] = useState(MAX_STEPS);
  const [animating, setAnimating] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  // Stop animation on unmount
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const runs = useMemo(() => {
    const noDecay = runTraining({ steps: MAX_STEPS, w0, lr, lambda: 0 });
    const withDecay = runTraining({ steps: MAX_STEPS, w0, lr, lambda });
    return { noDecay, withDecay };
  }, [w0, lr, lambda]);

  // Reset shown step whenever a parameter changes — start fresh, but auto-snap
  // to the end so static viewing still shows the final result. Tracked-dep
  // render-phase reset for state; effect handles RAF cancellation.
  const paramKey = `${w0}|${lr}|${lambda}`;
  const [lastParamKey, setLastParamKey] = useState(paramKey);
  if (paramKey !== lastParamKey) {
    setLastParamKey(paramKey);
    setAnimating(false);
    setStepShown(MAX_STEPS);
  }
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [w0, lr, lambda]);

  const lossMax = useMemo(() => {
    let m = 0;
    for (const v of runs.noDecay.ls) if (v > m) m = v;
    for (const v of runs.withDecay.ls) if (v > m) m = v;
    return Math.max(0.5, m * 1.08);
  }, [runs]);

  const animate = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(true);
    setStepShown(0);
    startRef.current = performance.now();
    const DURATION = 1800;
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / DURATION);
      const s = Math.round(t * MAX_STEPS);
      setStepShown(s);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setAnimating(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(false);
    setStepShown(0);
  }, []);

  const reroll = useCallback(() => {
    // start from a fresh w0 in [-2.4, 2.4]
    const next = (Math.random() * 4.8 - 2.4);
    setW0(Math.abs(next) < 0.4 ? (next < 0 ? -1.6 : 1.6) : next);
  }, []);

  const finalNo = runs.noDecay.ws[stepShown];
  const finalWd = runs.withDecay.ws[stepShown];
  const finalLossNo = runs.noDecay.ls[stepShown];
  const finalLossWd = runs.withDecay.ls[stepShown];

  // Tick marks for the loss plot
  const yTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      const v = (lossMax * i) / 4;
      ticks.push({ v, y: sy(v, lossMax) });
    }
    return ticks;
  }, [lossMax]);

  const xTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      const s = Math.round((MAX_STEPS * i) / 4);
      ticks.push({ s, x: sx(s, MAX_STEPS) });
    }
    return ticks;
  }, []);

  // Magnitude bars (|w_final|) — scale to the same axis so they compare directly.
  const magNo = Math.abs(finalNo);
  const magWd = Math.abs(finalWd);
  const magMax = Math.max(magNo, magWd, Math.abs(w0), 0.5);
  const BAR_PANEL_W = 220;
  const BAR_PANEL_H = 140;
  const BAR_PAD_L = 60;
  const BAR_PAD_R = 18;
  const BAR_PAD_T = 18;
  const BAR_PAD_B = 28;
  const BAR_PLOT_W = BAR_PANEL_W - BAR_PAD_L - BAR_PAD_R;
  const BAR_BAR_H = 22;
  const noBarW = (magNo / magMax) * BAR_PLOT_W;
  const wdBarW = (magWd / magMax) * BAR_PLOT_W;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: 620 }}>
          {/* Plot frame */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            fill="none"
            stroke="var(--border)"
            strokeWidth="0.6"
            opacity="0.7"
          />

          {/* Title */}
          <text
            x={PAD_L}
            y={18}
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.18em"
            fontWeight="700"
          >
            TRAINING LOSS vs STEP
          </text>
          <text
            x={W - PAD_R}
            y={18}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.1em"
            textAnchor="end"
          >
            step {stepShown} / {MAX_STEPS}
          </text>

          {/* Y grid + labels */}
          {yTicks.map((t, i) => (
            <g key={`yt${i}`}>
              <line
                x1={PAD_L}
                x2={PAD_L + PLOT_W}
                y1={t.y}
                y2={t.y}
                stroke="var(--border)"
                strokeWidth="0.4"
                opacity="0.35"
                strokeDasharray="2 3"
              />
              <text
                x={PAD_L - 6}
                y={t.y + 3}
                fontSize="8.5"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-dim)"
                textAnchor="end"
              >
                {snap(t.v, 1)}
              </text>
            </g>
          ))}

          {/* X labels */}
          {xTicks.map((t, i) => (
            <g key={`xt${i}`}>
              <line
                x1={t.x}
                x2={t.x}
                y1={PAD_T + PLOT_H}
                y2={PAD_T + PLOT_H + 3}
                stroke="var(--text-dim)"
                strokeWidth="0.6"
                opacity="0.7"
              />
              <text
                x={t.x}
                y={PAD_T + PLOT_H + 14}
                fontSize="8.5"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-dim)"
                textAnchor="middle"
              >
                {t.s}
              </text>
            </g>
          ))}

          {/* Axis titles */}
          <text
            x={PAD_L - 38}
            y={PAD_T + PLOT_H / 2}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.16em"
            transform={`rotate(-90 ${PAD_L - 38} ${PAD_T + PLOT_H / 2})`}
            textAnchor="middle"
          >
            LOSS
          </text>
          <text
            x={PAD_L + PLOT_W / 2}
            y={H - 6}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.16em"
            textAnchor="middle"
          >
            STEP
          </text>

          {/* Curves */}
          <path
            d={buildPath(runs.noDecay.ls, MAX_STEPS, lossMax, stepShown)}
            fill="none"
            stroke={COLOR_NO}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.95"
          />
          <path
            d={buildPath(runs.withDecay.ls, MAX_STEPS, lossMax, stepShown)}
            fill="none"
            stroke={COLOR_WD}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* Current-step markers */}
          {stepShown > 0 && (
            <>
              <circle
                cx={sx(stepShown, MAX_STEPS)}
                cy={sy(finalLossNo, lossMax)}
                r="3"
                fill={COLOR_NO}
                stroke="var(--bg)"
                strokeWidth="0.8"
              />
              <circle
                cx={sx(stepShown, MAX_STEPS)}
                cy={sy(finalLossWd, lossMax)}
                r="3"
                fill={COLOR_WD}
                stroke="var(--bg)"
                strokeWidth="0.8"
              />
            </>
          )}

          {/* Legend */}
          <g transform={`translate(${PAD_L + 8}, ${PAD_T + 8})`}>
            <rect
              x={0}
              y={-2}
              width={156}
              height={36}
              fill="var(--surface)"
              opacity="0.78"
              stroke="var(--border)"
              strokeWidth="0.4"
              rx="3"
            />
            <line x1="8" y1="9" x2="22" y2="9" stroke={COLOR_NO} strokeWidth="2" />
            <text
              x="28"
              y="12"
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
            >
              no weight decay
            </text>
            <line x1="8" y1="25" x2="22" y2="25" stroke={COLOR_WD} strokeWidth="2" />
            <text
              x="28"
              y="28"
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
            >
              with decay (λ={snap(lambda, 2)})
            </text>
          </g>
        </svg>
      </div>

      <div
        className="mlviz-stage"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: 'center',
          marginTop: 4,
        }}
      >
        {/* Loss surface bowl with both trajectories */}
        <svg viewBox={`0 0 ${BOWL_W} ${BOWL_H}`} className="mlviz-svg" style={{ maxWidth: 260 }}>
          <text
            x={BOWL_PAD_L}
            y={10}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.16em"
            fontWeight="700"
          >
            LOSS SURFACE f(w) = w²
          </text>

          {/* axes */}
          <line
            x1={BOWL_PAD_L}
            x2={BOWL_PAD_L + BOWL_PLOT_W}
            y1={BOWL_PAD_T + BOWL_PLOT_H}
            y2={BOWL_PAD_T + BOWL_PLOT_H}
            stroke="var(--border)"
            strokeWidth="0.6"
          />
          <line
            x1={BOWL_PAD_L}
            x2={BOWL_PAD_L}
            y1={BOWL_PAD_T}
            y2={BOWL_PAD_T + BOWL_PLOT_H}
            stroke="var(--border)"
            strokeWidth="0.6"
          />

          {/* w=0 reference */}
          <line
            x1={bx(0)}
            x2={bx(0)}
            y1={BOWL_PAD_T}
            y2={BOWL_PAD_T + BOWL_PLOT_H}
            stroke="var(--text-dim)"
            strokeWidth="0.4"
            strokeDasharray="2 3"
            opacity="0.5"
          />

          {/* noisy data scatter */}
          {DATA_SAMPLES.map((d, i) => (
            <circle
              key={`ds${i}`}
              cx={bx(d.w)}
              cy={by(d.l)}
              r="1.6"
              fill="var(--text-dim)"
              opacity="0.55"
            />
          ))}

          {/* bowl curve */}
          <path
            d={BOWL_CURVE}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.1"
            opacity="0.8"
          />

          {/* Trajectory markers — start, current for each method */}
          <circle
            cx={bx(runs.noDecay.ws[0])}
            cy={by(runs.noDecay.ls[0])}
            r="3.4"
            fill="var(--surface)"
            stroke="var(--text-main)"
            strokeWidth="0.8"
          />
          <text
            x={bx(runs.noDecay.ws[0]) + 6}
            y={by(runs.noDecay.ls[0]) - 4}
            fontSize="7.5"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
          >
            w₀
          </text>

          {/* current position dots */}
          <circle
            cx={bx(finalNo)}
            cy={by(loss(finalNo))}
            r="3.4"
            fill={COLOR_NO}
            stroke="var(--bg)"
            strokeWidth="0.8"
          />
          <circle
            cx={bx(finalWd)}
            cy={by(loss(finalWd))}
            r="3.4"
            fill={COLOR_WD}
            stroke="var(--bg)"
            strokeWidth="0.8"
          />

          {/* shrinkage arrow from no-decay → with-decay (along the w axis) */}
          {Math.abs(finalNo - finalWd) > 0.05 && (
            <g>
              <line
                x1={bx(finalNo)}
                y1={by(loss(finalNo)) + 8}
                x2={bx(finalWd)}
                y2={by(loss(finalWd)) + 8}
                stroke={COLOR_WD}
                strokeWidth="0.9"
                opacity="0.7"
                markerEnd="url(#wd-arrow)"
              />
            </g>
          )}

          <defs>
            <marker
              id="wd-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={COLOR_WD} opacity="0.8" />
            </marker>
          </defs>

          {/* x axis label */}
          <text
            x={BOWL_PAD_L + BOWL_PLOT_W / 2}
            y={BOWL_H - 4}
            fontSize="8.5"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            textAnchor="middle"
          >
            w
          </text>
        </svg>

        {/* Final |w| bar comparison */}
        <svg
          viewBox={`0 0 ${BAR_PANEL_W} ${BAR_PANEL_H}`}
          className="mlviz-svg"
          style={{ maxWidth: 260 }}
        >
          <text
            x={BAR_PAD_L - 50}
            y={10}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.16em"
            fontWeight="700"
          >
            FINAL WEIGHT MAGNITUDE
          </text>

          {/* baseline axis */}
          <line
            x1={BAR_PAD_L}
            x2={BAR_PAD_L}
            y1={BAR_PAD_T}
            y2={BAR_PANEL_H - BAR_PAD_B}
            stroke="var(--border)"
            strokeWidth="0.6"
          />

          {/* no-decay bar */}
          <g>
            <text
              x={BAR_PAD_L - 6}
              y={BAR_PAD_T + 16}
              fontSize="8.5"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
              textAnchor="end"
            >
              no λ
            </text>
            <rect
              x={BAR_PAD_L}
              y={BAR_PAD_T + 4}
              width={Math.max(0.5, noBarW)}
              height={BAR_BAR_H}
              fill={COLOR_NO}
              opacity="0.78"
              rx="2"
              style={{ transition: 'width 0.3s ease' }}
            />
            <text
              x={BAR_PAD_L + Math.max(0.5, noBarW) + 6}
              y={BAR_PAD_T + 20}
              fontSize="8.5"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
            >
              |w| = {snap(magNo, 3)}
            </text>
          </g>

          {/* with-decay bar */}
          <g>
            <text
              x={BAR_PAD_L - 6}
              y={BAR_PAD_T + 52}
              fontSize="8.5"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
              textAnchor="end"
            >
              λ={snap(lambda, 2)}
            </text>
            <rect
              x={BAR_PAD_L}
              y={BAR_PAD_T + 40}
              width={Math.max(0.5, wdBarW)}
              height={BAR_BAR_H}
              fill={COLOR_WD}
              opacity="0.78"
              rx="2"
              style={{ transition: 'width 0.3s ease' }}
            />
            <text
              x={BAR_PAD_L + Math.max(0.5, wdBarW) + 6}
              y={BAR_PAD_T + 56}
              fontSize="8.5"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
            >
              |w| = {snap(magWd, 3)}
            </text>
          </g>

          {/* shrinkage call-out */}
          <text
            x={BAR_PAD_L - 8}
            y={BAR_PANEL_H - 14}
            fontSize="8.5"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            fill="var(--text-dim)"
          >
            shrinkage:&nbsp;
            <tspan fill="var(--text-main)" fontFamily="var(--mono, monospace)">
              {magNo > 1e-6
                ? `${snap((1 - magWd / magNo) * 100, 1)}%`
                : '–'}
            </tspan>
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">λ (weight decay)</span>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={lambda}
              onChange={(e) => setLambda(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(lambda, 2)}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">α (learning rate)</span>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={lr}
              onChange={(e) => setLr(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(lr, 2)}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">w₀ (init)</span>
            <input
              type="range"
              min="-2.4"
              max="2.4"
              step="0.05"
              value={w0}
              onChange={(e) => setW0(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(w0, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: COLOR_NO }}>no λ</span>
          <span className="mlviz-val">
            loss {snap(finalLossNo, 4)}
          </span>
          <span className="mlviz-sub">
            w = {snap(finalNo, 3)} · |w| = {snap(magNo, 3)}
          </span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: COLOR_WD }}>λ={snap(lambda, 2)}</span>
          <span className="mlviz-val">
            loss {snap(finalLossWd, 4)}
          </span>
          <span className="mlviz-sub">
            w = {snap(finalWd, 3)} · |w| = {snap(magWd, 3)}
          </span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>update</span>
          <span className="mlviz-val">
            w ← w − α·(2w + λ·w)
          </span>
          <span className="mlviz-sub">
            effective shrink per step: ×{snap(1 - lr * lambda, 4)}
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={animate}
            disabled={animating}
          >
            <Play size={13} />
            <span>Run 100 steps</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={reset}
            disabled={animating}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={reroll}
            disabled={animating}
          >
            <RefreshCw size={13} />
            <span>New w₀</span>
          </button>
        </div>

        <div className="mlviz-hint">
          λ drags every weight toward zero each step · raise λ to see the shrinkage gap widen
        </div>
      </div>
    </div>
  );
}
