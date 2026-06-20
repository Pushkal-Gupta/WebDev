import React, { useState } from 'react';
import { RotateCcw, Cpu, Gauge } from 'lucide-react';
import './MLViz.css';

const OPTIMIZERS = [
  {
    key: 'sgd',
    label: 'SGD',
    state: 0,
    hparams: 'η',
    lr: 1e-2,
    bestFor: 'tuned schedules · vision SOTA',
    accent: 'var(--text-dim)',
    memory: 'baseline',
  },
  {
    key: 'momentum',
    label: 'SGD+momentum',
    state: 1,
    hparams: 'η, β=0.9',
    lr: 1e-2,
    bestFor: 'same as SGD, less LR pain',
    accent: 'var(--hue-sky)',
    memory: '1× extra',
  },
  {
    key: 'nesterov',
    label: 'Nesterov',
    state: 1,
    hparams: 'η, β=0.9',
    lr: 1e-2,
    bestFor: 'drop-in for momentum, free win',
    accent: 'var(--hue-mint)',
    memory: '1× extra',
  },
  {
    key: 'adagrad',
    label: 'AdaGrad',
    state: 1,
    hparams: 'η',
    lr: 1e-1,
    bestFor: 'convex + sparse + short runs',
    accent: 'var(--warning)',
    memory: '1× extra',
  },
  {
    key: 'rmsprop',
    label: 'RMSprop',
    state: 1,
    hparams: 'η, ρ=0.9',
    lr: 1e-2,
    bestFor: 'RNNs (historical default)',
    accent: 'var(--hue-violet)',
    memory: '1× extra',
  },
  {
    key: 'adam',
    label: 'Adam',
    state: 2,
    hparams: 'η, β₁=0.9, β₂=0.999',
    lr: 3e-3,
    bestFor: 'everything else, default',
    accent: 'var(--accent)',
    memory: '2× extra',
  },
  {
    key: 'adamw',
    label: 'AdamW',
    state: 2,
    hparams: 'η, β₁, β₂, λ',
    lr: 3e-3,
    bestFor: 'transformers · modern default',
    accent: 'var(--hue-pink)',
    memory: '2× extra',
  },
  {
    key: 'lion',
    label: 'Lion',
    state: 1,
    hparams: 'η (3–10× smaller), β₁, β₂',
    lr: 3e-4,
    bestFor: 'memory-bound large models',
    accent: 'var(--easy)',
    memory: '1× extra',
  },
];

const W_SVG = 760;
const H_SVG = 360;
const PAD_L = 140;
const PAD_R = 32;
const PAD_T = 32;
const PAD_B = 36;
const ROW_H = (H_SVG - PAD_T - PAD_B) / OPTIMIZERS.length;
const BAR_MAX = 2;

export default function OptimizerZooViz() {
  const [active, setActive] = useState('adamw');
  const opt = OPTIMIZERS.find((o) => o.key === active) || OPTIMIZERS[0];

  const plotW = W_SVG - PAD_L - PAD_R;
  const xAt = (s) => PAD_L + (s / BAR_MAX) * plotW;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="mlviz-svg" preserveAspectRatio="xMidYMid meet">
          <text x={W_SVG / 2} y={18} fontFamily="var(--mono)" fontSize="11" fill="var(--text-dim)" textAnchor="middle" letterSpacing="0.08em">
            EXTRA STATE PER PARAMETER &nbsp;·&nbsp; tap a row
          </text>

          {[0, 1, 2].map((s) => (
            <g key={`tick${s}`}>
              <line x1={xAt(s)} y1={PAD_T - 4} x2={xAt(s)} y2={H_SVG - PAD_B + 4} stroke="var(--border)" strokeWidth="0.6" opacity="0.4" />
              <text x={xAt(s)} y={H_SVG - PAD_B + 18} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="middle">{s}× param</text>
            </g>
          ))}

          {OPTIMIZERS.map((o, i) => {
            const y = PAD_T + i * ROW_H + ROW_H / 2;
            const barY = y - ROW_H * 0.32;
            const barH = ROW_H * 0.64;
            const isActive = o.key === active;
            return (
              <g key={o.key} onClick={() => setActive(o.key)} style={{ cursor: 'pointer' }}>
                <rect
                  x={2}
                  y={PAD_T + i * ROW_H + 2}
                  width={W_SVG - 4}
                  height={ROW_H - 4}
                  fill={isActive ? 'rgba(var(--accent-rgb), 0.07)' : 'transparent'}
                  stroke={isActive ? 'var(--accent)' : 'transparent'}
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x={PAD_L - 12}
                  y={y + 4}
                  fontFamily="var(--mono)"
                  fontSize="12"
                  fontWeight={isActive ? 700 : 500}
                  fill={isActive ? o.accent : 'var(--text-main)'}
                  textAnchor="end"
                >
                  {o.label}
                </text>
                <rect
                  x={PAD_L}
                  y={barY}
                  width={Math.max(2, xAt(o.state) - PAD_L)}
                  height={barH}
                  fill={o.accent}
                  opacity={isActive ? 0.92 : 0.55}
                  rx="3"
                />
                <text
                  x={xAt(o.state) + 8}
                  y={y + 4}
                  fontFamily="var(--mono)"
                  fontSize="11"
                  fill={isActive ? 'var(--text-main)' : 'var(--text-dim)'}
                  fontWeight={isActive ? 700 : 400}
                >
                  {o.state === 0 ? 'no buffer' : `${o.state} buffer${o.state > 1 ? 's' : ''}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: opt.accent }}>{opt.label}</span>
          <span className="mlviz-val" style={{ fontFamily: 'var(--mono)' }}>state = {opt.state} buffer{opt.state === 1 ? '' : 's'} per param</span>
          <span className="mlviz-sub">{opt.memory} memory cost beyond weights</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--text-dim)' }}>hparams</span>
          <span className="mlviz-val" style={{ fontFamily: 'var(--mono)' }}>{opt.hparams}</span>
          <span className="mlviz-sub">typical LR {opt.lr.toExponential(0).replace('+', '')}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--text-dim)' }}>best for</span>
          <span className="mlviz-val">{opt.bestFor}</span>
        </div>
      </div>

      <div className="mlviz-controls">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <Cpu size={13} /> click row to inspect
        </span>
        {OPTIMIZERS.slice(0, 4).map((o) => (
          <button key={o.key} type="button" className="mlviz-btn" onClick={() => setActive(o.key)} style={{ opacity: o.key === active ? 1 : 0.7 }}>
            {o.label}
          </button>
        ))}
        <button type="button" className="mlviz-btn" onClick={() => setActive('adamw')}>
          <RotateCcw size={14} /> Reset
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <Gauge size={13} /> Adam/AdamW carry the most state — twice the optimizer memory of SGD.
        </span>
      </div>
    </div>
  );
}
