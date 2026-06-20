import React, { useState, useMemo, useCallback } from 'react';
import { RotateCcw, ArrowRight, ArrowLeft as ArrowL } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 230;
const PAD_L = 28;
const PAD_R = 28;
const TRACK_Y = 100;
const TRACK_H = 22;
const TICK_TOP = TRACK_Y - 8;
const TICK_BOT = TRACK_Y + TRACK_H + 8;

const FEATURES = [
  { key: 'income', label: 'Income', value: 0.15 },
  { key: 'credit', label: 'Credit Score', value: 0.10 },
  { key: 'debt', label: 'Debt', value: -0.05 },
  { key: 'ltv', label: 'Loan-to-Value', value: -0.08 },
  { key: 'years', label: 'Employment Years', value: 0.30 },
];

const BASELINE = 0.30;

// Plot domain: clip to [0, 1] (probability scale). Use a slight headroom on the edges.
const X_MIN = 0;
const X_MAX = 1;

function xToPx(v) {
  const t = (v - X_MIN) / (X_MAX - X_MIN);
  return PAD_L + t * (W - PAD_L - PAD_R);
}

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function fmtSigned(v) {
  if (v === 0) return '0.00';
  return (v > 0 ? '+' : '') + snap(v, 2).toFixed(2);
}

export default function SHAPValuesViz() {
  const [active, setActive] = useState(() =>
    FEATURES.reduce((acc, f) => { acc[f.key] = true; return acc; }, {})
  );

  const handleToggle = useCallback((key) => {
    setActive((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleReset = useCallback(() => {
    setActive(FEATURES.reduce((acc, f) => { acc[f.key] = true; return acc; }, {}));
  }, []);

  // Walk through features in order; each contributes ONLY if active. The walking
  // x-position determines where its arrow starts and ends, so the force plot
  // reads left-to-right as a cumulative sum.
  const steps = useMemo(() => {
    let cursor = BASELINE;
    const arr = [];
    for (const f of FEATURES) {
      const on = !!active[f.key];
      const delta = on ? f.value : 0;
      const start = cursor;
      const end = cursor + delta;
      arr.push({ ...f, on, start, end, delta });
      cursor = end;
    }
    return { rows: arr, prediction: cursor };
  }, [active]);

  const prediction = steps.prediction;
  const includedSum = prediction - BASELINE;
  const baselinePx = xToPx(BASELINE);
  const predictionPx = xToPx(Math.max(X_MIN, Math.min(X_MAX, prediction)));

  // X ticks: a clean 0..1 scale at 0.25 increments.
  const xTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="shap-track" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--surface)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--bg)" stopOpacity="1" />
            </linearGradient>
            <marker
              id="shap-arrow-pos"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--easy)" />
            </marker>
            <marker
              id="shap-arrow-neg"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hard)" />
            </marker>
          </defs>

          {/* Track background */}
          <rect
            x={PAD_L}
            y={TRACK_Y}
            width={W - PAD_L - PAD_R}
            height={TRACK_H}
            rx="6"
            fill="url(#shap-track)"
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* X ticks */}
          {xTicks.map((t) => {
            const px = xToPx(t);
            return (
              <g key={`xt${t}`}>
                <line
                  x1={px}
                  y1={TICK_BOT - 4}
                  x2={px}
                  y2={TICK_BOT + 2}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={px}
                  y={TICK_BOT + 14}
                  fontSize="9.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  {t.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Baseline marker — E[f(x)] */}
          <g>
            <line
              x1={baselinePx}
              y1={TICK_TOP - 18}
              x2={baselinePx}
              y2={TRACK_Y + TRACK_H + 4}
              stroke="var(--text-dim)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.85"
            />
            <text
              x={baselinePx}
              y={TICK_TOP - 22}
              fontSize="10.5"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              fontWeight="600"
            >
              E[f(x)] = {snap(BASELINE, 2).toFixed(2)}
            </text>
          </g>

          {/* Prediction marker — f(x) */}
          <g>
            <line
              x1={predictionPx}
              y1={TICK_TOP - 18}
              x2={predictionPx}
              y2={TRACK_Y + TRACK_H + 4}
              stroke="var(--accent)"
              strokeWidth="1.6"
            />
            <text
              x={predictionPx}
              y={TICK_TOP - 22}
              fontSize="10.5"
              fill="var(--accent)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              fontWeight="700"
            >
              f(x) = {snap(prediction, 2).toFixed(2)}
            </text>
          </g>

          {/* Contribution arrows, stacked above the track in feature order. */}
          {steps.rows.map((row, idx) => {
            const yLane = TRACK_Y - 30 - idx * 6;
            const x1 = xToPx(row.start);
            const x2 = xToPx(row.end);
            const positive = row.delta > 0;
            const color = positive ? 'var(--easy)' : 'var(--hard)';
            const visible = row.on && row.delta !== 0;
            return (
              <g
                key={row.key}
                className={`shap-arrow ${visible ? 'is-visible' : 'is-hidden'}`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(4px)',
                  transition: 'opacity 280ms ease, transform 280ms ease',
                  transformOrigin: `${x1}px ${yLane}px`,
                }}
              >
                <line
                  x1={x1}
                  y1={yLane}
                  x2={x2}
                  y2={yLane}
                  stroke={color}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  markerEnd={positive ? 'url(#shap-arrow-pos)' : 'url(#shap-arrow-neg)'}
                />
                {/* Tick from contribution line down to track */}
                <line
                  x1={x2}
                  y1={yLane + 3}
                  x2={x2}
                  y2={TRACK_Y - 1}
                  stroke={color}
                  strokeWidth="0.9"
                  strokeDasharray="2 2"
                  opacity="0.6"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={yLane - 5}
                  fontSize="9.5"
                  fill={color}
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {row.label} {fmtSigned(row.delta)}
                </text>
              </g>
            );
          })}

          {/* Track endpoints labels */}
          <text
            x={PAD_L}
            y={TRACK_Y + TRACK_H + 32}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="start"
          >
            lower probability
          </text>
          <text
            x={W - PAD_R}
            y={TRACK_Y + TRACK_H + 32}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            higher probability
          </text>
        </svg>

        <style>{`
          @media (prefers-reduced-motion: reduce) {
            .shap-arrow {
              transition: none !important;
              transform: none !important;
            }
          }
        `}</style>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>prediction</span>
          <span className="mlviz-val">f(x) = {snap(prediction, 2).toFixed(2)}</span>
          <span className="mlviz-sub">
            baseline {snap(BASELINE, 2).toFixed(2)} + Σ contributions {fmtSigned(includedSum)}
          </span>
        </div>

        <div className="mlviz-toggles" aria-label="Toggle features">
          {FEATURES.map((f) => {
            const on = !!active[f.key];
            const positive = f.value > 0;
            const color = positive ? 'var(--easy)' : 'var(--hard)';
            const Icon = positive ? ArrowRight : ArrowL;
            return (
              <button
                key={f.key}
                type="button"
                className={`mlviz-toggle ${on ? 'is-on' : ''}`}
                style={{ '--toggle-color': color }}
                onClick={() => handleToggle(f.key)}
                aria-pressed={on}
              >
                <span className="mlviz-toggle-dot" />
                <Icon size={11} />
                <span>{f.label}</span>
                <span className="mlviz-sub" style={{ marginLeft: '0.15rem' }}>
                  {fmtSigned(f.value)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          SHAP decomposes f(x) into baseline E[f(x)] plus a contribution per feature.
          Green arrows push the prediction right (higher probability), red push left.
          Toggle a feature to zero its contribution and watch f(x) move.
        </div>
      </div>
    </div>
  );
}
