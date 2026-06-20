import React, { useMemo, useState, useCallback } from 'react';
import { Shuffle, RotateCcw, Layers, Activity } from 'lucide-react';
import './MLViz.css';

const W = 760;
const H = 360;
const GRID_ROWS = 8;
const GRID_COLS = 12;
const N_PARAMS = GRID_ROWS * GRID_COLS;
const PANEL_PAD_X = 24;
const PANEL_GAP = 24;
const PANEL_TOP = 44;
const PANEL_W = (W - PANEL_PAD_X * 2 - PANEL_GAP) / 2;
const PANEL_H = H - PANEL_TOP - 60;
const CELL_W = PANEL_W / GRID_COLS;
const CELL_H = PANEL_H / GRID_ROWS;
const LEFT_X = PANEL_PAD_X;
const RIGHT_X = PANEL_PAD_X + PANEL_W + PANEL_GAP;

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genWeights(seed) {
  const rand = mulberry32(seed);
  const out = new Array(N_PARAMS);
  for (let i = 0; i < N_PARAMS; i++) {
    // gaussian-ish via Box-Muller
    const u1 = Math.max(1e-6, rand());
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    out[i] = z * 0.55;
  }
  return out;
}

function genMask(seed, p) {
  const rand = mulberry32(seed ^ 0x9e3779b1);
  const out = new Array(N_PARAMS);
  for (let i = 0; i < N_PARAMS; i++) out[i] = rand() < 1 - p ? 1 : 0;
  return out;
}

function weightColor(w) {
  // map weight to opacity + sky/pink polarity
  const a = Math.min(1, Math.abs(w) / 1.6);
  return { color: w >= 0 ? 'var(--hue-sky)' : 'var(--hue-pink)', alpha: 0.18 + 0.78 * a };
}

export default function DropoutMaskAblationViz() {
  const [p, setP] = useState(0.4);
  const [seed, setSeed] = useState(11);
  const [variant, setVariant] = useState('inverted'); // inverted | classic

  const weights = useMemo(() => genWeights(seed), [seed]);
  const mask = useMemo(() => genMask(seed, p), [seed, p]);

  const activeCount = useMemo(() => mask.reduce((a, b) => a + b, 0), [mask]);
  const ensembleEstimate = useMemo(() => {
    // log_2 of #possible subnetworks at this rate (binary entropy times N)
    if (p <= 0 || p >= 1) return 0;
    const H = -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
    return Math.pow(2, H * N_PARAMS);
  }, [p]);

  // Train-time weights: w_i * m_i  (classic) OR  w_i * m_i / (1-p)  (inverted)
  const trainWeights = useMemo(() => {
    const scale = variant === 'inverted' ? 1 / Math.max(1e-3, 1 - p) : 1;
    return weights.map((w, i) => mask[i] * w * scale);
  }, [weights, mask, p, variant]);

  // Inference weights:  w_i * (1-p)  (classic, all on but scaled)  OR  w_i  (inverted, no scaling)
  const inferenceWeights = useMemo(() => {
    const scale = variant === 'inverted' ? 1 : 1 - p;
    return weights.map((w) => w * scale);
  }, [weights, p, variant]);

  const handleReshuffle = useCallback(() => setSeed((s) => (s * 1664525 + 1013904223) >>> 0), []);
  const handleReset = useCallback(() => {
    setSeed(11);
    setP(0.4);
    setVariant('inverted');
  }, []);

  function renderHeatmap(originX, title, sublabel, values, mutedIfZero) {
    return (
      <g>
        <text
          x={originX}
          y={PANEL_TOP - 22}
          fontSize="10"
          fill="var(--text-dim)"
          fontFamily="var(--mono)"
          letterSpacing="0.14em"
          textAnchor="start"
        >
          {title}
        </text>
        <text
          x={originX + PANEL_W}
          y={PANEL_TOP - 22}
          fontSize="9.5"
          fill="var(--accent)"
          fontFamily="var(--mono)"
          textAnchor="end"
          fontWeight="700"
        >
          {sublabel}
        </text>
        <rect
          x={originX - 4}
          y={PANEL_TOP - 8}
          width={PANEL_W + 8}
          height={PANEL_H + 16}
          fill="var(--bg)"
          stroke="var(--border)"
          strokeWidth="1"
          rx="8"
          opacity="0.6"
        />
        {values.map((w, i) => {
          const r = Math.floor(i / GRID_COLS);
          const c = i % GRID_COLS;
          const x = originX + c * CELL_W;
          const y = PANEL_TOP + r * CELL_H;
          const dropped = mutedIfZero && mask[i] === 0;
          const { color, alpha } = weightColor(w);
          return (
            <g key={i}>
              <rect
                x={x + 1}
                y={y + 1}
                width={CELL_W - 2}
                height={CELL_H - 2}
                fill={dropped ? 'var(--surface)' : color}
                opacity={dropped ? 0.35 : alpha}
                rx="2"
              />
              {dropped && (
                <line
                  x1={x + 4}
                  y1={y + 4}
                  x2={x + CELL_W - 4}
                  y2={y + CELL_H - 4}
                  stroke="var(--text-dim)"
                  strokeWidth="1"
                  opacity="0.5"
                />
              )}
            </g>
          );
        })}
      </g>
    );
  }

  const droppedCount = N_PARAMS - activeCount;
  const sumTrain = trainWeights.reduce((a, b) => a + Math.abs(b), 0);
  const sumInfer = inferenceWeights.reduce((a, b) => a + Math.abs(b), 0);
  const ratio = sumInfer > 0 ? sumTrain / sumInfer : 0;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {renderHeatmap(
            LEFT_X,
            `TRAIN  m ⊙ w${variant === 'inverted' ? ' / (1-p)' : ''}`,
            `${activeCount}/${N_PARAMS} active`,
            trainWeights,
            true
          )}
          {renderHeatmap(
            RIGHT_X,
            `INFERENCE  ${variant === 'inverted' ? 'w' : 'w · (1-p)'}`,
            'all on',
            inferenceWeights,
            false
          )}

          <text
            x={LEFT_X}
            y={H - 28}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.08em"
          >
            {`dropped: ${droppedCount}  ·  kept: ${activeCount}`}
          </text>
          <text
            x={RIGHT_X}
            y={H - 28}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.08em"
          >
            {variant === 'inverted'
              ? 'scaling done at TRAIN → inference is identity'
              : 'scale weights by (1-p) at inference'}
          </text>
          <text
            x={W / 2}
            y={H - 10}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            E[train activation] = E[inference activation] when scaled correctly
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Layers size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              dropout rate p
            </span>
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              value={p}
              onChange={(e) => setP(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{p.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <span className="mlviz-slider-label" style={{ minWidth: 0 }}>variant</span>
          <button
            type="button"
            className={`mlviz-btn ${variant === 'inverted' ? 'mlviz-btn-primary' : ''}`}
            onClick={() => setVariant('inverted')}
          >
            <span>inverted (scale at train)</span>
          </button>
          <button
            type="button"
            className={`mlviz-btn ${variant === 'classic' ? 'mlviz-btn-primary' : ''}`}
            onClick={() => setVariant('classic')}
          >
            <span>classic (scale at inference)</span>
          </button>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <Activity size={11} style={{ verticalAlign: '-1px' }} />
            <span className="mlviz-sub">active params</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{activeCount}</span>
            <span className="mlviz-sub">/ {N_PARAMS}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">expected keep</span>
            <span className="mlviz-val">{((1 - p) * 100).toFixed(0)}%</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">ensemble size ≈ 2^(H·N)</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {ensembleEstimate >= 1e6
                ? ensembleEstimate.toExponential(2)
                : ensembleEstimate.toFixed(0)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">Σ|w| train / inference</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{ratio.toFixed(2)}</span>
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={handleReshuffle}>
            <Shuffle size={13} />
            <span>Resample mask</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            seed {seed.toString(16).slice(0, 6)}
          </span>
        </div>

        <div className="mlviz-hint">
          drag p → watch active params and ensemble explode combinatorially
        </div>
      </div>
    </div>
  );
}
