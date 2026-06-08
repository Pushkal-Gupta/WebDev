import React, { useCallback, useMemo, useRef, useState } from 'react';
import './MLViz.css';

/*
 * Learning-rate schedules over training steps.
 * Pure math, no animation — overlaid curves with toggleable visibility
 * and a hover crosshair that reads the exact value of each visible curve.
 *
 * Schedules:
 *  - constant         : lr(t) = base
 *  - step             : drops by gamma every step_size
 *  - exp              : lr(t) = base * gamma^t
 *  - linear           : lr(t) = base * (1 - t/T)
 *  - cosine           : lr(t) = 0.5 * base * (1 + cos(pi * t / T))
 *  - warmup_cosine    : linear warmup to base over W steps, cosine decay after
 *  - cyclic           : triangular CLR between base_lr and max_lr
 */

const W = 720;
const H = 380;
const PAD_L = 56;
const PAD_R = 18;
const PAD_T = 24;
const PAD_B = 42;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const N_SAMPLES = 400;

const SCHEDULES = [
  { id: 'constant',      label: 'Constant',         color: 'var(--hue-sky, #5ecbff)' },
  { id: 'step',          label: 'Step decay',       color: 'var(--hue-mint, #6ee0a8)' },
  { id: 'exp',           label: 'Exponential',      color: 'var(--hue-violet, #b58cff)' },
  { id: 'linear',        label: 'Linear',           color: 'var(--hue-pink, #ff66cc)' },
  { id: 'cosine',        label: 'Cosine',           color: 'var(--warning, #f5b76b)' },
  { id: 'warmup_cosine', label: 'Warmup + cosine',  color: 'var(--accent)' },
  { id: 'cyclic',        label: 'Cyclic (tri)',     color: 'var(--easy, #58c97a)' },
];

const STEP_DECAY_FACTOR = 0.5;
const STEP_DECAY_INTERVAL_FRAC = 0.2;
const EXP_GAMMA_PER_STEP = 0.9995;
const CYCLIC_PERIOD_FRAC = 0.2;
const CYCLIC_MIN_FRAC = 0.1;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function snap(v, p = 4) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function lrAt(id, step, params) {
  const { baseLr, warmupSteps, totalSteps } = params;
  const t = clamp(step, 0, totalSteps);
  if (id === 'constant') {
    return baseLr;
  }
  if (id === 'step') {
    const interval = Math.max(1, Math.round(totalSteps * STEP_DECAY_INTERVAL_FRAC));
    const k = Math.floor(t / interval);
    return baseLr * Math.pow(STEP_DECAY_FACTOR, k);
  }
  if (id === 'exp') {
    return baseLr * Math.pow(EXP_GAMMA_PER_STEP, t);
  }
  if (id === 'linear') {
    const frac = totalSteps > 0 ? t / totalSteps : 0;
    return baseLr * Math.max(0, 1 - frac);
  }
  if (id === 'cosine') {
    const frac = totalSteps > 0 ? t / totalSteps : 0;
    return 0.5 * baseLr * (1 + Math.cos(Math.PI * Math.min(1, frac)));
  }
  if (id === 'warmup_cosine') {
    if (t < warmupSteps) {
      return warmupSteps > 0 ? baseLr * (t / warmupSteps) : baseLr;
    }
    const denom = Math.max(1, totalSteps - warmupSteps);
    const frac = clamp((t - warmupSteps) / denom, 0, 1);
    return 0.5 * baseLr * (1 + Math.cos(Math.PI * frac));
  }
  if (id === 'cyclic') {
    const period = Math.max(2, Math.round(totalSteps * CYCLIC_PERIOD_FRAC));
    const minLr = baseLr * CYCLIC_MIN_FRAC;
    const phase = (t % period) / period;
    const tri = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
    return minLr + (baseLr - minLr) * tri;
  }
  return 0;
}

function xToPx(step, totalSteps) {
  const frac = totalSteps > 0 ? step / totalSteps : 0;
  return PAD_L + frac * PLOT_W;
}

function yToPx(lr, maxLr) {
  const frac = maxLr > 0 ? lr / maxLr : 0;
  return PAD_T + (1 - frac) * PLOT_H;
}

function buildPath(id, params, yMax) {
  const { totalSteps } = params;
  const parts = [];
  for (let i = 0; i <= N_SAMPLES; i++) {
    const step = (i / N_SAMPLES) * totalSteps;
    const lr = lrAt(id, step, params);
    const x = xToPx(step, totalSteps);
    const y = yToPx(lr, yMax);
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return parts.join(' ');
}

function niceTickStep(range, target) {
  const raw = range / Math.max(1, target);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  let mult;
  if (norm < 1.5) mult = 1;
  else if (norm < 3.5) mult = 2;
  else if (norm < 7.5) mult = 5;
  else mult = 10;
  return mult * pow;
}

export default function LRScheduleViz() {
  const [baseLr, setBaseLr] = useState(0.001);
  const [warmupSteps, setWarmupSteps] = useState(500);
  const [totalSteps, setTotalSteps] = useState(10000);
  const [enabled, setEnabled] = useState({
    constant: false,
    step: true,
    exp: false,
    linear: false,
    cosine: true,
    warmup_cosine: true,
    cyclic: false,
  });
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  const params = useMemo(
    () => ({ baseLr, warmupSteps: Math.min(warmupSteps, totalSteps - 1), totalSteps }),
    [baseLr, warmupSteps, totalSteps]
  );

  const yMax = baseLr * 1.08;

  const paths = useMemo(() => {
    const out = {};
    for (const s of SCHEDULES) {
      out[s.id] = buildPath(s.id, params, yMax);
    }
    return out;
  }, [params, yMax]);

  const xTickStep = useMemo(() => niceTickStep(totalSteps, 6), [totalSteps]);
  const xTicks = useMemo(() => {
    const ticks = [];
    for (let v = 0; v <= totalSteps + 1e-6; v += xTickStep) {
      ticks.push(Math.round(v));
    }
    return ticks;
  }, [totalSteps, xTickStep]);

  const yTickStep = useMemo(() => niceTickStep(yMax, 5), [yMax]);
  const yTicks = useMemo(() => {
    const ticks = [];
    for (let v = 0; v <= yMax + 1e-12; v += yTickStep) {
      ticks.push(v);
    }
    return ticks;
  }, [yMax, yTickStep]);

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const localX = (e.clientX - rect.left) * scaleX;
    if (localX < PAD_L || localX > W - PAD_R) {
      setHover(null);
      return;
    }
    const frac = (localX - PAD_L) / PLOT_W;
    const step = clamp(frac * totalSteps, 0, totalSteps);
    setHover({ step });
  }, [totalSteps]);

  const handleMouseLeave = useCallback(() => setHover(null), []);

  const toggle = useCallback((id) => {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const hoverReadings = useMemo(() => {
    if (!hover) return null;
    return SCHEDULES.filter((s) => enabled[s.id]).map((s) => ({
      id: s.id,
      label: s.label,
      color: s.color,
      value: lrAt(s.id, hover.step, params),
    }));
  }, [hover, enabled, params]);

  const formatStep = (s) => {
    if (s >= 1000) return `${(s / 1000).toFixed(s % 1000 === 0 ? 0 : 1)}k`;
    return `${Math.round(s)}`;
  };

  const formatLr = (v) => {
    if (v === 0) return '0';
    if (v < 1e-4) return v.toExponential(2);
    return v.toPrecision(3);
  };

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg lrs-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* plot frame */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.6"
          />

          {/* y gridlines + ticks */}
          {yTicks.map((v, i) => {
            const y = yToPx(v, yMax);
            return (
              <g key={`yt${i}`}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  opacity={v === 0 ? 0.6 : 0.25}
                  strokeDasharray={v === 0 ? '' : '3 4'}
                />
                <text
                  x={PAD_L - 8}
                  y={y + 3}
                  fontSize="10"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >
                  {formatLr(v)}
                </text>
              </g>
            );
          })}

          {/* x gridlines + ticks */}
          {xTicks.map((v, i) => {
            const x = xToPx(v, totalSteps);
            return (
              <g key={`xt${i}`}>
                <line
                  x1={x}
                  y1={PAD_T}
                  x2={x}
                  y2={H - PAD_B}
                  stroke="var(--border)"
                  strokeWidth="1"
                  opacity={v === 0 ? 0.6 : 0.18}
                  strokeDasharray={v === 0 ? '' : '3 4'}
                />
                <text
                  x={x}
                  y={H - PAD_B + 14}
                  fontSize="10"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  {formatStep(v)}
                </text>
              </g>
            );
          })}

          {/* axis labels */}
          <text
            x={PAD_L + PLOT_W / 2}
            y={H - 6}
            fontSize="11"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="middle"
          >
            training step
          </text>
          <text
            x={14}
            y={PAD_T + PLOT_H / 2}
            fontSize="11"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="middle"
            transform={`rotate(-90 14 ${PAD_T + PLOT_H / 2})`}
          >
            learning rate
          </text>

          {/* warmup region marker (only meaningful while warmup_cosine is on) */}
          {enabled.warmup_cosine && warmupSteps > 0 && warmupSteps < totalSteps && (
            <g>
              <rect
                x={PAD_L}
                y={PAD_T}
                width={xToPx(warmupSteps, totalSteps) - PAD_L}
                height={PLOT_H}
                fill="var(--accent)"
                opacity="0.06"
              />
              <line
                x1={xToPx(warmupSteps, totalSteps)}
                y1={PAD_T}
                x2={xToPx(warmupSteps, totalSteps)}
                y2={H - PAD_B}
                stroke="var(--accent)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.55"
              />
              <text
                x={xToPx(warmupSteps, totalSteps) + 4}
                y={PAD_T + 12}
                fontSize="9.5"
                fill="var(--accent)"
                fontFamily="var(--mono, monospace)"
                opacity="0.85"
              >
                warmup {formatStep(warmupSteps)}
              </text>
            </g>
          )}

          {/* curves */}
          {SCHEDULES.map((s) =>
            enabled[s.id] ? (
              <path
                key={s.id}
                d={paths[s.id]}
                fill="none"
                stroke={s.color}
                strokeWidth={s.id === 'warmup_cosine' ? 2.2 : 1.8}
                strokeOpacity={0.95}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null
          )}

          {/* hover crosshair + dots + tooltip */}
          {hover && hoverReadings && hoverReadings.length > 0 && (() => {
            const hx = xToPx(hover.step, totalSteps);
            const tooltipW = 168;
            const tooltipH = 28 + hoverReadings.length * 14;
            let tx = hx + 12;
            if (tx + tooltipW > W - PAD_R) tx = hx - tooltipW - 12;
            const ty = clamp(PAD_T + 8, PAD_T, H - PAD_B - tooltipH);
            return (
              <g>
                <line
                  x1={hx}
                  y1={PAD_T}
                  x2={hx}
                  y2={H - PAD_B}
                  stroke="var(--text-dim)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity="0.55"
                />
                {hoverReadings.map((r) => {
                  const y = yToPx(r.value, yMax);
                  return (
                    <circle
                      key={`hd${r.id}`}
                      cx={hx}
                      cy={y}
                      r={3.5}
                      fill={r.color}
                      stroke="var(--bg)"
                      strokeWidth="1.5"
                    />
                  );
                })}
                <g transform={`translate(${tx}, ${ty})`}>
                  <rect
                    x="0"
                    y="0"
                    width={tooltipW}
                    height={tooltipH}
                    rx="6"
                    fill="var(--surface)"
                    stroke="var(--border)"
                    opacity="0.95"
                  />
                  <text
                    x="10"
                    y="16"
                    fontSize="10"
                    fill="var(--text-dim)"
                    fontFamily="var(--mono, monospace)"
                  >
                    step {formatStep(hover.step)}
                  </text>
                  {hoverReadings.map((r, i) => (
                    <g key={`hl${r.id}`} transform={`translate(10, ${28 + i * 14})`}>
                      <circle cx="4" cy="-3" r="3.5" fill={r.color} />
                      <text
                        x="14"
                        y="0"
                        fontSize="10"
                        fill="var(--text-main)"
                        fontFamily="var(--mono, monospace)"
                      >
                        {r.label}
                      </text>
                      <text
                        x={tooltipW - 10}
                        y="0"
                        fontSize="10"
                        fill="var(--text-main)"
                        fontFamily="var(--mono, monospace)"
                        textAnchor="end"
                      >
                        {formatLr(r.value)}
                      </text>
                    </g>
                  ))}
                </g>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="mlviz-toggles lrs-toggles">
        {SCHEDULES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`mlviz-toggle ${enabled[s.id] ? 'is-on' : ''}`}
            style={{ '--toggle-color': s.color }}
            onClick={() => toggle(s.id)}
          >
            <span className="mlviz-toggle-dot" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">base LR</span>
            <input
              type="range"
              min="0.0001"
              max="0.01"
              step="0.0001"
              value={baseLr}
              onChange={(e) => setBaseLr(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{formatLr(baseLr)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">warmup steps</span>
            <input
              type="range"
              min="0"
              max={Math.max(1, Math.floor(totalSteps * 0.5))}
              step="50"
              value={Math.min(warmupSteps, Math.floor(totalSteps * 0.5))}
              onChange={(e) => setWarmupSteps(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{formatStep(Math.min(warmupSteps, Math.floor(totalSteps * 0.5)))}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">total steps</span>
            <input
              type="range"
              min="1000"
              max="50000"
              step="500"
              value={totalSteps}
              onChange={(e) => setTotalSteps(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{formatStep(totalSteps)}</span>
          </label>
        </div>

        <div className="mlviz-hint">
          Toggle schedules to overlay them. Hover the plot to read the exact learning rate at any step. Step decay halves every {Math.round(STEP_DECAY_INTERVAL_FRAC * 100)}% of training; cyclic period is {Math.round(CYCLIC_PERIOD_FRAC * 100)}% of total steps.
        </div>
      </div>

      <style>{`
        .lrs-svg {
          aspect-ratio: ${W} / ${H};
          max-width: 100%;
          cursor: crosshair;
        }
        .lrs-toggles {
          margin-top: -1px;
        }
      `}</style>
    </div>
  );
}
