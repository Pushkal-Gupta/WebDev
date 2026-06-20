import React, { useMemo, useState } from 'react';
import { Layers, Activity, AlertTriangle, Minimize2, Maximize2, Check } from 'lucide-react';
import './WeightInitViz.css';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCHEMES = [
  { key: 'zeros', label: 'zeros', icon: Minimize2 },
  { key: 'large', label: 'large', icon: Maximize2 },
  { key: 'xavier', label: 'Xavier', icon: Activity },
  { key: 'he', label: 'He', icon: Check },
];

const FAN_IN = 64;

// Var_weights per scheme. Var_out = Var_in * (fan-in) * Var_weights * reluFactor.
// xavier preserves for linear/tanh (reluFactor 1); he preserves for ReLU (reluFactor 0.5).
function weightVar(scheme, fanIn, gain) {
  switch (scheme) {
    case 'zeros': return 0;
    case 'large': return (gain * 2.5) / fanIn * 4; // deliberately too big -> explodes
    case 'xavier': return (gain * gain) / fanIn;
    case 'he': return (gain * gain * 2) / fanIn;
    default: return 1 / fanIn;
  }
}

function reluFactor(scheme) {
  // 'he' is the ReLU-aware init: half the units zeroed on average.
  return scheme === 'he' ? 0.5 : 1;
}

function buildTrajectory(scheme, depth, gain) {
  const fanIn = FAN_IN;
  const vw = weightVar(scheme, fanIn, gain);
  const rf = reluFactor(scheme);
  const perLayerGain = fanIn * vw * rf;
  const variances = [1];
  for (let i = 0; i < depth; i += 1) {
    const prev = variances[variances.length - 1];
    variances.push(prev * perLayerGain);
  }
  return { variances, perLayerGain, vw };
}

function classifyFlag(variances) {
  const first = variances[0] || 1;
  const last = variances[variances.length - 1];
  const ratio = last / first;
  if (last < 1e-4 || ratio < 0.02) return { flag: 'VANISHING', cls: 'is-vanish' };
  if (last > 50 || ratio > 25) return { flag: 'EXPLODING', cls: 'is-explode' };
  return { flag: 'STABLE', cls: 'is-stable' };
}

export default function WeightInitViz() {
  const [scheme, setScheme] = useState('xavier');
  const [depth, setDepth] = useState(10);
  const [gain, setGain] = useState(1);

  const { variances, perLayerGain, vw } = useMemo(
    () => buildTrajectory(scheme, depth, gain),
    [scheme, depth, gain],
  );

  const flagInfo = useMemo(() => classifyFlag(variances), [variances]);

  const stdTrajectory = useMemo(
    () => variances.map((v) => Math.sqrt(Math.max(v, 0))),
    [variances],
  );

  // Deterministic per-neuron sample dots (constant seed) — heights scaled by layer std.
  const sampleDots = useMemo(() => {
    const rnd = mulberry32(0x51a7c0de);
    const perLayer = 7;
    return variances.map((v) => {
      const std = Math.sqrt(Math.max(v, 0));
      return Array.from({ length: perLayer }, () => (rnd() * 2 - 1) * std);
    });
  }, [variances]);

  const W = 940;
  const H = 360;
  const plotLeft = 56;
  const plotRight = W - 24;
  const plotW = plotRight - plotLeft;
  const baselineY = 250;
  const topPad = 64;
  const cols = variances.length;
  const colStride = plotW / cols;
  const barW = Math.min(34, colStride * 0.62);

  // Visual mapping: std -> half-height of the violin, clamped so explode stays inside the viewBox.
  const maxStd = Math.max(...stdTrajectory, 1e-6);
  const maxHalf = (baselineY - topPad);
  const refStd = Math.max(maxStd, 1.2);
  const halfFor = (std) => {
    const h = (std / refStd) * maxHalf;
    return Math.max(0.5, Math.min(maxHalf, h));
  };

  const firstVar = variances[0];
  const lastVar = variances[variances.length - 1];
  const ratio = lastVar / (firstVar || 1);

  const fmt = (x) => {
    if (x === 0) return '0';
    if (x >= 1000 || x < 0.001) return x.toExponential(1);
    if (x >= 10) return x.toFixed(1);
    return x.toFixed(3);
  };

  const narration = {
    zeros: 'All weights set to zero. Every activation collapses to 0 in the first layer and stays there — no signal, no gradient. Symmetry never breaks, so every neuron learns the same thing (nothing).',
    large: 'Weights drawn too wide. Each layer multiplies variance by fan-in × Var(w) ≫ 1, so activation magnitude grows exponentially with depth — saturation, NaNs, and exploding gradients.',
    xavier: 'Xavier/Glorot sets Var(w) = 1/fan-in, so each layer multiplies variance by exactly 1. Activation spread is preserved across all layers — the right choice for tanh / linear units.',
    he: 'He init sets Var(w) = 2/fan-in to compensate for ReLU zeroing half the units. The ×fan-in growth and the ×0.5 ReLU factor cancel, keeping variance flat through a deep ReLU stack.',
  }[scheme];

  return (
    <div className="wiv">
      <div className="wiv-head">
        <h3 className="wiv-title">Weight initialization — how activation variance travels through depth</h3>
        <p className="wiv-sub">
          Each violin is one layer; its height is the activation spread (std). Watch it collapse, explode, or hold
          steady as signal flows left to right.
        </p>
      </div>

      <div className="wiv-controls">
        <div className="wiv-scheme-toggle" role="group" aria-label="Initialization scheme">
          {SCHEMES.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                type="button"
                className={`wiv-btn ${scheme === s.key ? 'is-active' : ''}`}
                onClick={() => setScheme(s.key)}
                aria-pressed={scheme === s.key}
              >
                <Icon size={14} /> {s.label}
              </button>
            );
          })}
        </div>

        <span className="wiv-spacer" aria-hidden="true" />

        <label className="wiv-slider">
          <span className="wiv-input-label">depth</span>
          <input
            type="range" min={3} max={12} step={1} value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="wiv-range" aria-label="Network depth"
          />
          <span className="wiv-slider-val">{depth}</span>
        </label>
        <label className="wiv-slider">
          <span className="wiv-input-label">gain</span>
          <input
            type="range" min={0.5} max={2} step={0.1} value={gain}
            onChange={(e) => setGain(Number(e.target.value))}
            className="wiv-range" aria-label="Init gain multiplier"
          />
          <span className="wiv-slider-val">{gain.toFixed(1)}×</span>
        </label>
      </div>

      <div className="wiv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="wiv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="wiv-row-label" x={plotLeft} y={32}>activation spread per layer (std of activations)</text>

          <line className="wiv-axis" x1={plotLeft} y1={baselineY} x2={plotRight} y2={baselineY} />
          <line
            className="wiv-ref"
            x1={plotLeft}
            y1={baselineY - halfFor(1)}
            x2={plotRight}
            y2={baselineY - halfFor(1)}
          />
          <text className="wiv-ref-label" x={plotRight} y={baselineY - halfFor(1) - 5} textAnchor="end">
            std = 1 (input)
          </text>

          {variances.map((v, i) => {
            const std = stdTrajectory[i];
            const cx = plotLeft + colStride * i + colStride / 2;
            const half = halfFor(std);
            const isInput = i === 0;
            const cls = `wiv-violin ${flagInfo.cls} ${isInput ? 'is-input' : ''}`;
            // Smooth violin path: pinched at top/bottom, widest at center.
            const w = barW;
            const top = baselineY - half;
            const bot = baselineY + half;
            const path = [
              `M ${cx} ${top}`,
              `C ${cx + w} ${top + half * 0.35}, ${cx + w} ${bot - half * 0.35}, ${cx} ${bot}`,
              `C ${cx - w} ${bot - half * 0.35}, ${cx - w} ${top + half * 0.35}, ${cx} ${top}`,
              'Z',
            ].join(' ');
            return (
              <g key={`layer-${i}`}>
                <path className={cls} d={path} />
                {sampleDots[i].map((dy, k) => (
                  <circle
                    key={`dot-${i}-${k}`}
                    className={`wiv-dot ${flagInfo.cls}`}
                    cx={cx + ((k % 2 === 0) ? -2 : 2)}
                    cy={baselineY - (dy / refStd) * maxHalf}
                    r={1.6}
                  />
                ))}
                <text className="wiv-layer-idx" x={cx} y={baselineY + 22}>
                  {isInput ? 'in' : `L${i}`}
                </text>
                <text className="wiv-layer-var" x={cx} y={baselineY + 36}>
                  {fmt(v)}
                </text>
              </g>
            );
          })}

          <text className="wiv-axis-label" x={plotLeft} y={baselineY + 56}>
            layer (signal flows →)
          </text>

          <g transform={`translate(${plotRight - 168}, ${44})`}>
            <rect className={`wiv-flag-box ${flagInfo.cls}`} x={0} y={-18} width={168} height={30} rx={8} />
            <AlertTriangle
              size={14}
              x={10}
              y={-11}
              className={`wiv-flag-icon ${flagInfo.cls}`}
            />
            <text className={`wiv-flag-text ${flagInfo.cls}`} x={84} y={2}>
              {flagInfo.flag}
            </text>
          </g>
        </svg>
      </div>

      <div className="wiv-metrics">
        <div className="wiv-metric">
          <span className="wiv-metric-label">scheme</span>
          <span className="wiv-metric-value is-hi">{scheme}</span>
        </div>
        <div className="wiv-metric">
          <span className="wiv-metric-label">Var(w)</span>
          <span className="wiv-metric-value">{fmt(vw)}</span>
        </div>
        <div className="wiv-metric">
          <span className="wiv-metric-label">per-layer gain</span>
          <span className="wiv-metric-value">{fmt(perLayerGain)}×</span>
        </div>
        <div className="wiv-metric">
          <span className="wiv-metric-label">last-layer var</span>
          <span className="wiv-metric-value">{fmt(lastVar)}</span>
        </div>
        <div className="wiv-metric">
          <span className="wiv-metric-label">var ratio (Lₙ / in)</span>
          <span className="wiv-metric-value">{fmt(ratio)}</span>
        </div>
        <div className="wiv-metric">
          <span className="wiv-metric-label">status</span>
          <span className={`wiv-metric-value ${flagInfo.cls}`}>{flagInfo.flag}</span>
        </div>
      </div>

      <div className="wiv-narration">
        <span className="wiv-narration-label"><Layers size={12} /> trace</span>
        <span className="wiv-narration-body">{narration}</span>
      </div>
    </div>
  );
}
