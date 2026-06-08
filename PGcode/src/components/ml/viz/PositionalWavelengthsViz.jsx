import React, { useMemo, useState } from 'react';
import { Waves, Hash } from 'lucide-react';
import './MLViz.css';

/*
 * Sinusoidal positional encoding visualizer.
 *
 * Stack of 8 paired sin/cos waves at geometrically-spaced wavelengths.
 * Each row = one even dimension (2i), where i = 0..7 → dims 0,2,4,...,14.
 * Angular frequency for pair i:  ω_i = 1 / 10000^(2i/d_model)
 * Sine row shown; cosine value reported in the readout (same ω, π/2 phase shift).
 *
 * Controls:
 *  - current position cursor (0..max_pos)
 *  - d_model toggle (32, 64, 128, 256, 512)
 *  - hover any wave row to spotlight its dim + period
 */

const W = 760;
const H = 460;
const PAD_L = 64;
const PAD_R = 24;
const PAD_T = 22;
const PAD_B = 60;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const N_PAIRS = 8;                    // 8 stacked waves
const MAX_POS = 50;                   // x-axis runs 0..50

const D_MODEL_OPTIONS = [32, 64, 128, 256, 512];

// Cycle of site hue tokens (with safe fallbacks) for the 8 waves.
const HUE_CYCLE = [
  { var: 'var(--hue-pink, #ff66cc)', fallback: '#ff66cc' },
  { var: 'var(--hue-violet, #b07bff)', fallback: '#b07bff' },
  { var: 'var(--accent)', fallback: '#00fff5' },
  { var: 'var(--hue-sky, #5ecbff)', fallback: '#5ecbff' },
  { var: 'var(--hue-mint, #6ee0a8)', fallback: '#6ee0a8' },
  { var: 'var(--hue-pink, #ff66cc)', fallback: '#ff66cc' },
  { var: 'var(--hue-violet, #b07bff)', fallback: '#b07bff' },
  { var: 'var(--hue-sky, #5ecbff)', fallback: '#5ecbff' },
];

function omegaFor(i, dModel) {
  // i indexes pairs (0..d/2-1); even dim index is 2i.
  return 1 / Math.pow(10000, (2 * i) / dModel);
}

function periodFor(i, dModel) {
  return (2 * Math.PI) / omegaFor(i, dModel);
}

function fmtPeriod(p) {
  if (p < 1000) return p.toFixed(1);
  if (p < 1e6) return (p / 1000).toFixed(1) + 'k';
  return (p / 1e6).toFixed(1) + 'M';
}

function fmtVal(v) {
  if (Math.abs(v) < 1e-4) return v.toExponential(2);
  return v.toFixed(3);
}

function posToPx(pos) {
  return PAD_L + (pos / MAX_POS) * PLOT_W;
}

export default function PositionalWavelengthsViz() {
  const [position, setPosition] = useState(7);
  const [dModel, setDModel] = useState(128);
  const [hoverRow, setHoverRow] = useState(null);

  // Per-row vertical band height.
  const rowH = PLOT_H / N_PAIRS;
  const waveAmp = rowH * 0.36;

  // Pre-compute a polyline path per wave (sampled densely).
  const wavePaths = useMemo(() => {
    const samples = 240;
    return Array.from({ length: N_PAIRS }, (_, i) => {
      const w = omegaFor(i, dModel);
      const yMid = PAD_T + i * rowH + rowH / 2;
      let d = '';
      for (let s = 0; s <= samples; s++) {
        const pos = (s / samples) * MAX_POS;
        const v = Math.sin(pos * w);
        const x = PAD_L + (pos / MAX_POS) * PLOT_W;
        const y = yMid - v * waveAmp;
        d += (s === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
      }
      return { i, d, yMid, omega: w, period: (2 * Math.PI) / w };
    });
  }, [dModel, rowH, waveAmp]);

  // Encoded vector at current position — first 8 dims (4 pairs → 8 entries: sin,cos,sin,cos,...).
  const encoded = useMemo(() => {
    const out = [];
    for (let pair = 0; pair < 4; pair++) {
      const w = omegaFor(pair, dModel);
      out.push({ dim: 2 * pair, kind: 'sin', value: Math.sin(position * w) });
      out.push({ dim: 2 * pair + 1, kind: 'cos', value: Math.cos(position * w) });
    }
    return out;
  }, [position, dModel]);

  const cursorPx = posToPx(position);

  // Major position ticks: every 5.
  const posTicks = [];
  for (let p = 0; p <= MAX_POS; p += 5) posTicks.push(p);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          role="img"
          aria-label="Sinusoidal positional encoding wavelengths across dimensions"
        >
          <defs>
            <linearGradient id="pwv-row-fade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--surface)" stopOpacity="0.0" />
              <stop offset="40%" stopColor="var(--surface)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--surface)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Plot frame */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            rx="6"
          />

          {/* Header */}
          <text
            x={PAD_L}
            y={PAD_T - 8}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.12em"
          >
            FAST OSCILLATION ↑ low dims · SLOW ↓ high dims · period = 2π / ω
          </text>
          <text
            x={W - PAD_R}
            y={PAD_T - 8}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="end"
            letterSpacing="0.10em"
          >
            d_model = {dModel}
          </text>

          {/* Per-row backgrounds + wave + labels */}
          {wavePaths.map((wp) => {
            const yTop = PAD_T + wp.i * rowH;
            const isHover = hoverRow === wp.i;
            const stroke = HUE_CYCLE[wp.i].var;
            return (
              <g key={`row-${wp.i}`} onMouseEnter={() => setHoverRow(wp.i)} onMouseLeave={() => setHoverRow(null)}>
                {/* row separator (every row except the first) */}
                {wp.i > 0 && (
                  <line
                    x1={PAD_L}
                    y1={yTop}
                    x2={PAD_L + PLOT_W}
                    y2={yTop}
                    stroke="var(--border)"
                    strokeOpacity="0.45"
                    strokeWidth="0.5"
                    strokeDasharray="2 4"
                  />
                )}
                {/* baseline (zero axis for this wave) */}
                <line
                  x1={PAD_L}
                  y1={wp.yMid}
                  x2={PAD_L + PLOT_W}
                  y2={wp.yMid}
                  stroke="var(--border)"
                  strokeOpacity="0.35"
                  strokeWidth="0.6"
                />
                {/* hover highlight band */}
                {isHover && (
                  <rect
                    x={PAD_L}
                    y={yTop + 1}
                    width={PLOT_W}
                    height={rowH - 2}
                    fill={stroke}
                    fillOpacity="0.06"
                  />
                )}
                {/* the wave itself */}
                <path
                  d={wp.d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isHover ? 2.0 : 1.4}
                  strokeOpacity={hoverRow == null || isHover ? 0.95 : 0.45}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  pointerEvents="visibleStroke"
                />
                {/* row label: dim index */}
                <text
                  x={PAD_L - 10}
                  y={wp.yMid + 4}
                  fontSize="11"
                  fill={isHover ? stroke : 'var(--text-dim)'}
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                  fontWeight={isHover ? 700 : 500}
                >
                  dim {2 * wp.i}
                </text>
                {/* row caption: period */}
                <text
                  x={PAD_L + PLOT_W - 6}
                  y={yTop + 11}
                  fontSize="9"
                  fill={isHover ? stroke : 'var(--text-dim)'}
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                  letterSpacing="0.05em"
                  opacity={isHover ? 1 : 0.7}
                >
                  T ≈ {fmtPeriod(wp.period)}
                </text>
                {/* sample dot at current position */}
                <circle
                  cx={cursorPx}
                  cy={wp.yMid - Math.sin(position * wp.omega) * waveAmp}
                  r={isHover ? 4.2 : 3}
                  fill={stroke}
                  stroke="var(--bg)"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Position cursor on top */}
          <line
            x1={cursorPx}
            y1={PAD_T}
            x2={cursorPx}
            y2={PAD_T + PLOT_H}
            stroke="var(--accent)"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            opacity="0.85"
          />
          <rect
            x={cursorPx - 22}
            y={PAD_T - 18}
            width={44}
            height={14}
            rx={3}
            fill="var(--accent)"
            opacity="0.95"
          />
          <text
            x={cursorPx}
            y={PAD_T - 7}
            fontSize="9.5"
            fontFamily="var(--mono, monospace)"
            fontWeight="700"
            fill="var(--bg)"
            textAnchor="middle"
            letterSpacing="0.06em"
          >
            pos {position}
          </text>

          {/* x-axis ticks */}
          {posTicks.map((p) => (
            <g key={`xt-${p}`}>
              <line
                x1={posToPx(p)}
                y1={PAD_T + PLOT_H}
                x2={posToPx(p)}
                y2={PAD_T + PLOT_H + 5}
                stroke="var(--text-dim)"
                strokeWidth="0.9"
              />
              <text
                x={posToPx(p)}
                y={PAD_T + PLOT_H + 17}
                fontSize="10"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >
                {p}
              </text>
            </g>
          ))}
          <text
            x={PAD_L + PLOT_W / 2}
            y={PAD_T + PLOT_H + 34}
            fontSize="10.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="middle"
          >
            token position
          </text>

          {/* y-axis title */}
          <text
            x={18}
            y={PAD_T + PLOT_H / 2}
            fontSize="10.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="middle"
            transform={`rotate(-90, 18, ${PAD_T + PLOT_H / 2})`}
          >
            even dimension index (sin component)
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-toggles" role="tablist" aria-label="Model dimension">
          {D_MODEL_OPTIONS.map((d) => (
            <button
              type="button"
              key={`dm-${d}`}
              role="tab"
              aria-selected={dModel === d}
              className={`mlviz-toggle${dModel === d ? ' is-on' : ''}`}
              style={{ '--toggle-color': 'var(--accent)' }}
              onClick={() => setDModel(d)}
            >
              <span className="mlviz-toggle-dot" />
              <Hash size={12} />
              <span>d={d}</span>
            </button>
          ))}
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">position</span>
            <input
              type="range"
              min={0}
              max={MAX_POS}
              step="1"
              value={position}
              onChange={(e) => setPosition(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{position}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>
            <Waves size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            PE(pos)
          </span>
          <span className="mlviz-sub">first 8 dims of the {dModel}-dimensional encoding at pos {position}</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
            gap: 6,
            marginTop: '0.4rem',
            fontFamily: 'var(--mono, monospace)',
            fontSize: '0.72rem',
          }}
        >
          {encoded.map((e) => {
            const intensity = Math.abs(e.value);
            const tint = e.kind === 'sin' ? 'var(--hue-sky, #5ecbff)' : 'var(--hue-pink, #ff66cc)';
            return (
              <div
                key={`enc-${e.dim}`}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '6px 4px',
                  background: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: tint,
                    opacity: 0.05 + intensity * 0.18,
                    pointerEvents: 'none',
                  }}
                />
                <span style={{ color: 'var(--text-dim)', fontSize: '0.66rem', letterSpacing: '0.06em', position: 'relative' }}>
                  d{e.dim}·{e.kind}
                </span>
                <span style={{ color: 'var(--text-main)', fontWeight: 700, position: 'relative' }}>
                  {fmtVal(e.value)}
                </span>
              </div>
            );
          })}
        </div>

        {hoverRow !== null && (
          <div className="mlviz-row" style={{ marginTop: '0.55rem' }}>
            <span className="mlviz-tag" style={{ color: HUE_CYCLE[hoverRow].fallback }}>
              dim {2 * hoverRow}
            </span>
            <span className="mlviz-val">
              ω = 1 / 10000^({(2 * hoverRow) / dModel}) = {omegaFor(hoverRow, dModel).toExponential(3)}
            </span>
            <span className="mlviz-val">
              period ≈ {fmtPeriod(periodFor(hoverRow, dModel))} tokens
            </span>
          </div>
        )}

        <div className="mlviz-hint" style={{ marginTop: hoverRow !== null ? '0.4rem' : '0.55rem' }}>
          Reading a column top-to-bottom is the unique {dModel}-dimensional code for that position. Low dims tick fast and encode local offset; high dims crawl and encode global position. Pairs (sin, cos) at the same ω let the model recover relative offsets via the angle-sum identity.
        </div>
      </div>
    </div>
  );
}
