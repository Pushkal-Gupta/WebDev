import React, { useMemo, useState, useCallback } from 'react';
import { Eye, Shuffle, RotateCcw, Target } from 'lucide-react';
import './MLViz.css';

const W = 760;
const H = 360;
const GRID = 8;
const N_PIX = GRID * GRID;
const PAD_X = 24;
const GAP = 24;
const PANEL_TOP = 44;
const PANEL_W = (W - PAD_X * 2 - GAP) / 2;
const PANEL_H = H - PANEL_TOP - 60;
const CELL = Math.min(PANEL_W, PANEL_H) / GRID;
const LEFT_X = PAD_X + (PANEL_W - CELL * GRID) / 2;
const RIGHT_X = PAD_X + PANEL_W + GAP + (PANEL_W - CELL * GRID) / 2;

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

// Three hand-built 8x8 stylized stamps (1=foreground pixel, 0=bg) so the
// "image" is recognizable and the saliency lights up the meaningful pixels.
const STAMPS = [
  {
    label: 'digit 3',
    klass: 3,
    pixels: [
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 0, 0, 0, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 1, 0,
      0, 0, 0, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 1, 0,
      0, 1, 0, 0, 0, 0, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
    ],
  },
  {
    label: 'cat',
    klass: 7,
    pixels: [
      0, 1, 0, 0, 0, 0, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 0, 0, 0, 0, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 0, 0,
      0, 1, 0, 0, 0, 0, 1, 0,
    ],
  },
  {
    label: 'arrow',
    klass: 1,
    pixels: [
      0, 0, 0, 0, 1, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 0,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      0, 0, 0, 0, 1, 1, 1, 0,
      0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 0, 0, 0,
    ],
  },
];

const CLASS_NAMES = ['airplane', 'arrow', 'two', 'three', 'four', 'five', 'six', 'cat', 'dog', 'nine'];

function softmax(arr) {
  const m = Math.max(...arr);
  const ex = arr.map((v) => Math.exp(v - m));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / s);
}

// Toy "model": each pixel has a learned weight per class. We make weights such
// that the ground-truth stamp's foreground pixels carry the most weight toward
// its own class — giving a clean, interpretable saliency.
function buildModelWeights(stamp, seed) {
  const rand = mulberry32(seed ^ (stamp.klass * 0x9e37));
  const W = new Array(10).fill(0).map(() => new Array(N_PIX).fill(0));
  // baseline noise across all classes
  for (let c = 0; c < 10; c++) {
    for (let i = 0; i < N_PIX; i++) W[c][i] = (rand() - 0.5) * 0.18;
  }
  // boost stamp pixels toward the ground-truth class
  for (let i = 0; i < N_PIX; i++) {
    if (stamp.pixels[i]) W[stamp.klass][i] += 0.9 + 0.4 * rand();
  }
  // suppress stamp pixels in a confused-with class
  const confused = (stamp.klass + 3) % 10;
  for (let i = 0; i < N_PIX; i++) {
    if (stamp.pixels[i]) W[confused][i] -= 0.4 * rand();
  }
  return W;
}

function forwardLogits(image, W) {
  const logits = new Array(10).fill(0);
  for (let c = 0; c < 10; c++) {
    let s = 0;
    for (let i = 0; i < N_PIX; i++) s += image[i] * W[c][i];
    logits[c] = s;
  }
  return logits;
}

// Vanilla gradient of target-class logit wrt pixel = W[target] (linear model).
function vanillaSaliency(W, target) {
  return W[target].map((v) => Math.abs(v));
}

// SmoothGrad: avg |grad| over N noisy copies. Here the model is linear so noise
// only matters via the absolute-value nonlinearity. We perturb the weights to
// simulate the noisy-input averaging effect.
function smoothGradSaliency(W, target, seed) {
  const rand = mulberry32(seed ^ 0x123abc);
  const N = 25;
  const out = new Array(N_PIX).fill(0);
  for (let n = 0; n < N; n++) {
    for (let i = 0; i < N_PIX; i++) {
      const noise = (rand() - 0.5) * 0.5;
      out[i] += Math.abs(W[target][i] + noise);
    }
  }
  return out.map((v) => v / N);
}

// Grad-CAM-like: aggregate by 2x2 receptive blocks (simulating last conv map).
function gradCamSaliency(W, target) {
  const block = new Array(16).fill(0);
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const br = Math.floor(r / 2);
      const bc = Math.floor(c / 2);
      block[br * 4 + bc] += Math.abs(W[target][r * GRID + c]);
    }
  }
  // up-sample to 8x8
  const out = new Array(N_PIX).fill(0);
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      out[r * GRID + c] = block[Math.floor(r / 2) * 4 + Math.floor(c / 2)] / 4;
    }
  }
  return out;
}

function normalize(arr) {
  const max = Math.max(...arr);
  if (max <= 0) return arr.map(() => 0);
  return arr.map((v) => v / max);
}

export default function SaliencyMapViz() {
  const [stampIdx, setStampIdx] = useState(0);
  const [method, setMethod] = useState('vanilla');
  const [seed, setSeed] = useState(23);

  const stamp = STAMPS[stampIdx];
  const modelW = useMemo(() => buildModelWeights(stamp, seed), [stamp, seed]);
  const logits = useMemo(() => forwardLogits(stamp.pixels, modelW), [stamp, modelW]);
  const probs = useMemo(() => softmax(logits), [logits]);
  const predIdx = useMemo(() => probs.indexOf(Math.max(...probs)), [probs]);

  const saliencyRaw = useMemo(() => {
    if (method === 'smoothgrad') return smoothGradSaliency(modelW, predIdx, seed);
    if (method === 'gradcam') return gradCamSaliency(modelW, predIdx);
    return vanillaSaliency(modelW, predIdx);
  }, [method, modelW, predIdx, seed]);

  const saliency = useMemo(() => normalize(saliencyRaw), [saliencyRaw]);

  const top3 = useMemo(() => {
    const idxs = saliency.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).slice(0, 3);
    return idxs.map(({ v, i }) => ({
      v,
      i,
      r: Math.floor(i / GRID),
      c: i % GRID,
    }));
  }, [saliency]);

  const handleReseed = useCallback(() => setSeed((s) => (s * 1664525 + 1013904223) >>> 0), []);
  const handleReset = useCallback(() => {
    setStampIdx(0);
    setMethod('vanilla');
    setSeed(23);
  }, []);

  function renderPanel(originX, title, sublabel, fillFn, hilights) {
    return (
      <g>
        <text
          x={originX + (CELL * GRID) / 2}
          y={PANEL_TOP - 22}
          fontSize="10"
          fill="var(--text-dim)"
          fontFamily="var(--mono)"
          letterSpacing="0.14em"
          textAnchor="middle"
        >
          {title}
        </text>
        <text
          x={originX + (CELL * GRID) / 2}
          y={PANEL_TOP - 8}
          fontSize="9.5"
          fill="var(--accent)"
          fontFamily="var(--mono)"
          textAnchor="middle"
          fontWeight="700"
        >
          {sublabel}
        </text>
        <rect
          x={originX - 6}
          y={PANEL_TOP}
          width={CELL * GRID + 12}
          height={CELL * GRID + 12}
          fill="var(--bg)"
          stroke="var(--border)"
          strokeWidth="1"
          rx="6"
          opacity="0.6"
        />
        {Array.from({ length: N_PIX }).map((_, i) => {
          const r = Math.floor(i / GRID);
          const c = i % GRID;
          const x = originX + c * CELL;
          const y = PANEL_TOP + 6 + r * CELL;
          const fill = fillFn(i);
          return (
            <rect
              key={i}
              x={x + 1}
              y={y + 1}
              width={CELL - 2}
              height={CELL - 2}
              fill={fill.color}
              opacity={fill.alpha}
              rx="1.5"
            />
          );
        })}
        {hilights && hilights.map((h, idx) => {
          const x = originX + h.c * CELL;
          const y = PANEL_TOP + 6 + h.r * CELL;
          return (
            <rect
              key={`hl-${idx}`}
              x={x + 0.5}
              y={y + 0.5}
              width={CELL - 1}
              height={CELL - 1}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.6"
              rx="1.5"
            />
          );
        })}
      </g>
    );
  }

  const correct = predIdx === stamp.klass;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {renderPanel(
            LEFT_X,
            'INPUT  8×8',
            `gt: ${stamp.label}`,
            (i) => ({
              color: stamp.pixels[i] ? 'var(--text-main)' : 'var(--bg)',
              alpha: stamp.pixels[i] ? 0.92 : 0.18,
            }),
            null
          )}

          {renderPanel(
            RIGHT_X,
            `SALIENCY  |∂logit/∂x|  ·  ${method}`,
            `pred: ${CLASS_NAMES[predIdx]} (${(probs[predIdx] * 100).toFixed(0)}%)`,
            (i) => ({
              color: 'var(--hue-pink)',
              alpha: 0.12 + 0.85 * saliency[i],
            }),
            top3
          )}

          <text
            x={LEFT_X + (CELL * GRID) / 2}
            y={H - 28}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.08em"
          >
            class index = {stamp.klass}
          </text>
          <text
            x={RIGHT_X + (CELL * GRID) / 2}
            y={H - 28}
            fontSize="9.5"
            fill={correct ? 'var(--easy)' : 'var(--warning)'}
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.08em"
            fontWeight="700"
          >
            {correct ? 'correct prediction' : 'mis-prediction'}
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
            bright pixels = the model leaned on them most for this prediction
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <span className="mlviz-slider-label" style={{ minWidth: 0 }}>input</span>
          {STAMPS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className={`mlviz-btn ${stampIdx === i ? 'mlviz-btn-primary' : ''}`}
              onClick={() => setStampIdx(i)}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <div className="mlviz-row mlviz-controls">
          <span className="mlviz-slider-label" style={{ minWidth: 0 }}>method</span>
          {[
            { key: 'vanilla', label: 'vanilla' },
            { key: 'smoothgrad', label: 'SmoothGrad' },
            { key: 'gradcam', label: 'Grad-CAM' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              className={`mlviz-btn ${method === m.key ? 'mlviz-btn-primary' : ''}`}
              onClick={() => setMethod(m.key)}
            >
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <Eye size={11} style={{ verticalAlign: '-1px' }} />
            <span className="mlviz-sub">prediction</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{CLASS_NAMES[predIdx]}</span>
            <span className="mlviz-sub">({(probs[predIdx] * 100).toFixed(1)}%)</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <Target size={11} style={{ verticalAlign: '-1px' }} />
            <span className="mlviz-sub">top-3 salient (row,col)</span>
            {top3.map((t, idx) => (
              <span
                key={idx}
                className="mlviz-val"
                style={{ color: 'var(--accent)', marginRight: 6 }}
              >
                ({t.r},{t.c})
                <span className="mlviz-sub"> {t.v.toFixed(2)}</span>
              </span>
            ))}
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={handleReseed}>
            <Shuffle size={13} />
            <span>Re-init model</span>
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
          vanilla = raw gradient · SmoothGrad averages noise · Grad-CAM aggregates last conv map
        </div>
      </div>
    </div>
  );
}
