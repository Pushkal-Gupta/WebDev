import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Scale, RotateCcw } from 'lucide-react';
import './MLViz.css';

const CLASSES = ['cat', 'dog', 'bird', 'fish'];
const K = CLASSES.length;
const TRUE = 2; // one-hot target index (bird)
const HUE = [
  'var(--hue-sky)',
  'var(--hue-violet)',
  'var(--hue-mint)',
  'var(--hue-pink)',
];

const INIT = [0.15, 0.25, 0.45, 0.15];

const VB = 560;
const VBH = 320;
const PAD_L = 44;
const PAD_R = 18;
const PAD_T = 24;
const PAD_B = 40;
const PLOT_W = VB - PAD_L - PAD_R;
const PLOT_H = VBH - PAD_T - PAD_B;
const EPS = 1e-6;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Renormalise the probability vector to sum 1 after dragging bar `idx` to `val`.
function renorm(probs, idx, val) {
  const v = clamp(val, EPS, 1 - EPS);
  const rest = probs.reduce((a, p, i) => (i === idx ? a : a + p), 0);
  const out = probs.slice();
  if (rest <= EPS) {
    const share = (1 - v) / (K - 1);
    for (let i = 0; i < K; i++) out[i] = i === idx ? v : share;
  } else {
    const scale = (1 - v) / rest;
    for (let i = 0; i < K; i++) out[i] = i === idx ? v : probs[i] * scale;
  }
  return out;
}

function fmt(v, p = 3) {
  if (!Number.isFinite(v)) return '∞';
  return v.toFixed(p);
}

export default function CrossEntropyExplorerViz({ initial = INIT }) {
  const start = useMemo(() => {
    const s = initial.length === K ? initial.slice() : INIT.slice();
    const sum = s.reduce((a, b) => a + b, 0);
    return s.map((v) => v / sum);
  }, [initial]);

  const [probs, setProbs] = useState(start);
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const pTrue = probs[TRUE];
  // CE for one-hot target collapses to -log(p_true); show per-class contributions too.
  const contrib = probs.map((p, i) => (i === TRUE ? -Math.log(Math.max(p, EPS)) : 0));
  const ce = -Math.log(Math.max(pTrue, EPS));
  const gradMag = 1 / Math.max(pTrue, EPS); // |dCE/dp_true|

  const barW = PLOT_W / K;
  const yOf = (p) => PAD_T + (1 - p) * PLOT_H;

  const updateFromClient = useCallback((clientY) => {
    const svg = svgRef.current;
    const idx = dragRef.current;
    if (!svg || idx == null) return;
    const rect = svg.getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * VBH;
    const p = clamp(1 - (y - PAD_T) / PLOT_H, EPS, 1 - EPS);
    setProbs((prev) => renorm(prev, idx, Math.round(p * 1000) / 1000));
  }, []);

  const onDown = useCallback(
    (idx) => (e) => {
      dragRef.current = idx;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updateFromClient(e.clientY);
    },
    [updateFromClient]
  );
  const onMove = useCallback(
    (e) => {
      if (dragRef.current == null) return;
      updateFromClient(e.clientY);
    },
    [updateFromClient]
  );
  const onUp = useCallback((e) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const reset = useCallback(() => setProbs(start), [start]);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trans = reduced ? 'none' : 'y 0.08s ease, height 0.08s ease';

  // CE curve overlay: -log(p) across p in [0,1], drawn in plot coords (right inset)
  const curve = useMemo(() => {
    const pts = [];
    const ceMax = 4.5;
    for (let i = 0; i <= 60; i++) {
      const p = EPS + (i / 60) * (1 - EPS);
      const l = clamp(-Math.log(p), 0, ceMax);
      const x = PAD_L + p * PLOT_W;
      const y = PAD_T + (1 - l / ceMax) * PLOT_H;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return 'M' + pts.join(' L');
  }, []);

  const ceMax = 4.5;
  const dotX = PAD_L + pTrue * PLOT_W;
  const dotY = PAD_T + (1 - clamp(ce, 0, ceMax) / ceMax) * PLOT_H;

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Scale size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Cross-entropy explorer</span>
          <span className="aev-head-sub">
            drag the bars — only the true-class probability moves the loss
          </span>
        </span>
        <span className="aev-chip">CE = {fmt(ce, 3)}</span>
      </div>

      <div className="aev-body cee-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB} ${VBH}`}
            className="aev-svg cee-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          >
            <defs>
              <filter id="cee-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
              <linearGradient id="cee-curve" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--hue-pink)" />
                <stop offset="100%" stopColor="var(--hue-mint)" />
              </linearGradient>
            </defs>

            {/* y grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((g) => (
              <g key={`g-${g}`}>
                <line
                  x1={PAD_L}
                  y1={yOf(g)}
                  x2={PAD_L + PLOT_W}
                  y2={yOf(g)}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  opacity="0.5"
                />
                <text
                  x={PAD_L - 6}
                  y={yOf(g) + 3}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="end"
                >
                  {g.toFixed(2)}
                </text>
              </g>
            ))}

            {/* the -log(p) explosion curve, mapped to the same x as p */}
            <path
              d={curve}
              fill="none"
              stroke="url(#cee-curve)"
              strokeWidth="3.5"
              filter="url(#cee-glow)"
              opacity="0.4"
            />
            <path
              d={curve}
              fill="none"
              stroke="url(#cee-curve)"
              strokeWidth="1.6"
              strokeDasharray="4 3"
              opacity="0.9"
            />
            <text
              x={PAD_L + 6}
              y={PAD_T + 12}
              fontSize="8.5"
              fill="var(--hue-pink)"
              fontFamily="var(--mono)"
            >
              −log(p) explodes as p→0
            </text>

            {/* bars */}
            {probs.map((p, i) => {
              const x = PAD_L + i * barW + barW * 0.18;
              const w = barW * 0.64;
              const y = yOf(p);
              const h = PAD_T + PLOT_H - y;
              const isTrue = i === TRUE;
              return (
                <g key={`bar-${i}`}>
                  {isTrue && (
                    <rect
                      x={PAD_L + i * barW + barW * 0.1}
                      y={PAD_T}
                      width={barW * 0.8}
                      height={PLOT_H}
                      rx="4"
                      fill="color-mix(in srgb, var(--accent) 8%, transparent)"
                      stroke="var(--accent)"
                      strokeWidth="0.6"
                      strokeDasharray="3 3"
                      opacity="0.7"
                    />
                  )}
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx="3"
                    fill={`color-mix(in srgb, ${HUE[i]} ${isTrue ? 78 : 48}%, var(--viz-card))`}
                    stroke={isTrue ? 'var(--accent)' : HUE[i]}
                    strokeWidth={isTrue ? 1.8 : 0.8}
                    style={{ transition: trans, cursor: 'ns-resize' }}
                    onPointerDown={onDown(i)}
                  />
                  {/* drag handle */}
                  <circle
                    cx={x + w / 2}
                    cy={y}
                    r="6.5"
                    fill={`color-mix(in srgb, ${HUE[i]} 22%, transparent)`}
                    style={{ transition: reduced ? 'none' : 'cy 0.08s ease' }}
                  />
                  <circle
                    cx={x + w / 2}
                    cy={y}
                    r="3.5"
                    fill={HUE[i]}
                    style={{ transition: reduced ? 'none' : 'cy 0.08s ease', cursor: 'ns-resize' }}
                    onPointerDown={onDown(i)}
                  />
                  <text
                    x={x + w / 2}
                    y={y - 10}
                    fontSize="9"
                    fill="var(--text-main)"
                    fontFamily="var(--mono)"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {p.toFixed(2)}
                  </text>
                  <text
                    x={x + w / 2}
                    y={PAD_T + PLOT_H + 14}
                    fontSize="9"
                    fill={isTrue ? 'var(--accent)' : 'var(--text-dim)'}
                    fontFamily="var(--serif)"
                    fontStyle="italic"
                    textAnchor="middle"
                  >
                    {CLASSES[i]}
                  </text>
                  {/* per-class -log(p) contribution */}
                  <text
                    x={x + w / 2}
                    y={PAD_T + PLOT_H + 26}
                    fontSize="7.5"
                    fill={contrib[i] > 0 ? 'var(--hue-pink)' : 'var(--text-dim)'}
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                  >
                    {isTrue ? `−log = ${fmt(contrib[i], 2)}` : '·0'}
                  </text>
                </g>
              );
            })}

            {/* loss dot on the curve at p_true */}
            <line
              x1={dotX}
              y1={dotY}
              x2={dotX}
              y2={PAD_T + PLOT_H}
              stroke="var(--accent)"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              opacity="0.6"
            />
            <circle cx={dotX} cy={dotY} r="9" fill="color-mix(in srgb, var(--accent) 16%, transparent)" />
            <circle cx={dotX} cy={dotY} r="4" fill="var(--accent)" />
          </svg>
        </div>

        <div className="mlviz-statcol cee-cards">
          <div className="mlviz-statcard mlviz-statcard-mint">
            <span className="mlviz-statcard-label">true-class p</span>
            <span className="mlviz-statcard-val">{fmt(pTrue, 3)}</span>
            <span className="mlviz-statcard-sub">target: {CLASSES[TRUE]}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">cross-entropy</span>
            <span className="mlviz-statcard-val">{fmt(ce, 3)}</span>
            <span className="mlviz-statcard-sub">−log(p_true)</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-pink">
            <span className="mlviz-statcard-label">gradient |∂L/∂p|</span>
            <span className="mlviz-statcard-val">{fmt(gradMag, 2)}</span>
            <span className="mlviz-statcard-sub">1 / p_true</span>
          </div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">true p</span>
          <input
            type="range"
            min={0.001}
            max={0.999}
            step={0.001}
            value={pTrue}
            onChange={(e) =>
              setProbs((prev) => renorm(prev, TRUE, parseFloat(e.target.value)))
            }
          />
          <span className="mlviz-slider-val">{fmt(pTrue, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          only the true class contributes to CE · push its probability toward 0 and the loss + gradient blow up
        </div>
      </div>
    </div>
  );
}
