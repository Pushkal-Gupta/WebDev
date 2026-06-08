import React, { useCallback, useMemo, useState } from 'react';
import { Shuffle, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 620;
const H = 300;
const PAD_T = 36;
const PAD_B = 30;
const PANEL_W_IN = 150;
const PANEL_W_OUT = 150;
const PANEL_GAP = 30;

const DEFAULT_SEED = 7;

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

function sampleInput(seed) {
  const rand = mulberry32(seed);
  return Array.from({ length: 5 }, () => Math.round((rand() * 1.7 + 0.15) * 100) / 100);
}

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Squash 5 inputs down to k in (1..5), then back up to 5 via a simple top-k retention model.
// At compression=0, k=5 (no compression, output equals input).
// At compression=1, k=2 (heavy compression).
function compressReconstruct(inputs, compression) {
  const c = Math.max(0, Math.min(1, compression));
  // Effective bottleneck width as a continuous value in [2, 5]
  const kEff = 5 - 3 * c;
  // Sort indices by magnitude (largest first); these are the dimensions most likely to survive.
  const idx = inputs.map((v, i) => [Math.abs(v), i]).sort((a, b) => b[0] - a[0]);

  // Weight per rank: rank 0 is fully kept, then a sigmoid-ish falloff once rank >= kEff.
  const weights = new Array(5).fill(0);
  for (let r = 0; r < 5; r++) {
    const overflow = r + 1 - kEff; // <=0 means safely under capacity
    let w;
    if (overflow <= 0) {
      w = 1;
    } else {
      // smooth dropoff with the amount of overflow
      w = Math.max(0, 1 - overflow);
    }
    weights[idx[r][1]] = w;
  }

  // Bottleneck values: top-2 (or kEff rounded up) carried; visualized as 2 bars
  const bottleneck = [];
  for (let r = 0; r < 2; r++) {
    const v = inputs[idx[r][1]] * weights[idx[r][1]];
    bottleneck.push(v);
  }

  const outputs = inputs.map((v, i) => v * weights[i]);
  return { outputs, bottleneck, weights };
}

function reconstructionLoss(inputs, outputs) {
  let s = 0;
  for (let i = 0; i < inputs.length; i++) {
    const d = inputs[i] - outputs[i];
    s += d * d;
  }
  return s;
}

function BarChart({ x, y, w, h, values, vmax, color, label, narrow }) {
  const n = values.length;
  const inner = w - 16;
  const gap = 4;
  const barW = (inner - gap * (n - 1)) / n;
  const innerH = h - 30;
  const baseY = y + h - 12;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="10"
        fill="rgba(var(--accent-rgb), 0.04)"
        stroke="var(--border)"
        strokeWidth="1"
      />
      <text
        x={x + w / 2}
        y={y + 16}
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="var(--text-dim)"
        style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}
      >
        {label}
      </text>
      {values.map((v, i) => {
        const mag = Math.abs(v);
        const barH = Math.max(2, (mag / vmax) * innerH);
        const bx = x + 8 + i * (barW + gap);
        const by = baseY - barH;
        return (
          <g key={i}>
            <rect
              x={bx}
              y={by}
              width={barW}
              height={barH}
              rx="3"
              fill={color}
              opacity={narrow ? 0.95 : 0.85}
            />
            <text
              x={bx + barW / 2}
              y={by - 4}
              textAnchor="middle"
              fontSize="9"
              fill="var(--text-dim)"
            >
              {snap(v, 2)}
            </text>
          </g>
        );
      })}
      <line
        x1={x + 8}
        x2={x + w - 8}
        y1={baseY}
        y2={baseY}
        stroke="var(--border)"
        strokeWidth="1"
      />
    </g>
  );
}

export default function AutoencoderShapeViz() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [compression, setCompression] = useState(0.6);

  const inputs = useMemo(() => sampleInput(seed), [seed]);
  const { outputs, bottleneck } = useMemo(
    () => compressReconstruct(inputs, compression),
    [inputs, compression],
  );
  const loss = useMemo(() => reconstructionLoss(inputs, outputs), [inputs, outputs]);

  const vmax = useMemo(() => {
    const peak = Math.max(
      1,
      ...inputs.map((v) => Math.abs(v)),
      ...outputs.map((v) => Math.abs(v)),
      ...bottleneck.map((v) => Math.abs(v)),
    );
    return peak * 1.05;
  }, [inputs, outputs, bottleneck]);

  const resample = useCallback(() => setSeed((s) => (s + 1) >>> 0), []);
  const reset = useCallback(() => {
    setSeed(DEFAULT_SEED);
    setCompression(0.6);
  }, []);

  // Layout the three panels
  const panelInX = 24;
  const panelInY = PAD_T;
  const panelInH = H - PAD_T - PAD_B;

  // Bottleneck panel scales narrower as compression goes up
  const bnW = 60 + (1 - compression) * (PANEL_W_IN - 60) * 0.55; // ranges from ~60 (c=1) to ~105 (c=0)
  const bnH = panelInH * (0.5 + (1 - compression) * 0.5);
  const bnX = panelInX + PANEL_W_IN + PANEL_GAP;
  const bnY = panelInY + (panelInH - bnH) / 2;

  const panelOutX = bnX + bnW + PANEL_GAP;
  const panelOutY = PAD_T;
  const panelOutH = panelInH;

  // Funnel polygon: connect input right edge -> bottleneck left edge -> bottleneck right edge -> output left edge
  const funnelTop = `
    M ${panelInX + PANEL_W_IN} ${panelInY}
    L ${bnX} ${bnY}
    L ${bnX + bnW} ${bnY}
    L ${panelOutX} ${panelOutY}
  `;
  const funnelBot = `
    M ${panelInX + PANEL_W_IN} ${panelInY + panelInH}
    L ${bnX} ${bnY + bnH}
    L ${bnX + bnW} ${bnY + bnH}
    L ${panelOutX} ${panelOutY + panelOutH}
  `;

  // Bottleneck values to render: at compression=0, mirror the inputs (5 bars equal to input).
  // Otherwise show 2-bar latent code.
  const showFullBottleneck = compression < 0.05;
  const bnValues = showFullBottleneck ? inputs : bottleneck;
  const bnLabel = showFullBottleneck ? 'z (k=5)' : `z (k=2)`;

  const lossColor =
    loss < 0.15
      ? 'var(--easy, #28c244)'
      : loss < 0.6
        ? 'var(--warning, #f4b740)'
        : 'var(--hard, #ef476f)';

  const compressionPct = Math.round(compression * 100);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '620px' }}>
          <defs>
            <linearGradient id="ae-shape-funnel" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--hue-sky, #7cc6ff)" stopOpacity="0.18" />
              <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--hue-pink, #ff8ab8)" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          {/* Funnel fill: connect top + bottom curves into one filled region */}
          <path
            d={`
              M ${panelInX + PANEL_W_IN} ${panelInY}
              L ${bnX} ${bnY}
              L ${bnX + bnW} ${bnY}
              L ${panelOutX} ${panelOutY}
              L ${panelOutX} ${panelOutY + panelOutH}
              L ${bnX + bnW} ${bnY + bnH}
              L ${bnX} ${bnY + bnH}
              L ${panelInX + PANEL_W_IN} ${panelInY + panelInH}
              Z
            `}
            fill="url(#ae-shape-funnel)"
            stroke="none"
          />
          <path d={funnelTop} fill="none" stroke="var(--accent)" strokeWidth="1.4" opacity="0.55" />
          <path d={funnelBot} fill="none" stroke="var(--accent)" strokeWidth="1.4" opacity="0.55" />

          {/* Input panel */}
          <BarChart
            x={panelInX}
            y={panelInY}
            w={PANEL_W_IN}
            h={panelInH}
            values={inputs}
            vmax={vmax}
            color="var(--hue-sky, #7cc6ff)"
            label="input x (d=5)"
          />

          {/* Bottleneck panel */}
          <BarChart
            x={bnX}
            y={bnY}
            w={bnW}
            h={bnH}
            values={bnValues}
            vmax={vmax}
            color="var(--accent)"
            label={bnLabel}
            narrow
          />

          {/* Output panel */}
          <BarChart
            x={panelOutX}
            y={panelOutY}
            w={PANEL_W_OUT}
            h={panelOutH}
            values={outputs}
            vmax={vmax}
            color="var(--hue-pink, #ff8ab8)"
            label="output x' (d=5)"
          />

          {/* Encoder / Decoder labels along the funnel */}
          <text
            x={(panelInX + PANEL_W_IN + bnX) / 2}
            y={PAD_T - 14}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-dim)"
            style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            encoder f_phi
          </text>
          <text
            x={(bnX + bnW + panelOutX) / 2}
            y={PAD_T - 14}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-dim)"
            style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            decoder g_theta
          </text>
          <text
            x={bnX + bnW / 2}
            y={H - 10}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-dim)"
            style={{ letterSpacing: '0.06em' }}
          >
            bottleneck
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider" style={{ width: '100%' }}>
          <span className="mlviz-slider-label">compression</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={compression}
            onChange={(e) => setCompression(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{compressionPct}%</span>
        </label>

        <div className="mlviz-row" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
          <span className="mlviz-tag">k</span>
          <span className="mlviz-val">{showFullBottleneck ? 5 : 2}</span>
          <span className="mlviz-sub">bottleneck width</span>
        </div>
        <div className="mlviz-row" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink, #ff8ab8)' }}>loss</span>
          <span className="mlviz-val" style={{ color: lossColor }}>{snap(loss, 3)}</span>
          <span className="mlviz-sub">||x - x'||² · lower is better</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={resample}>
            <Shuffle size={13} />
            <span>Sample new input</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          slide compression up: bottleneck narrows from 5 → 2, decoder loses signal, loss climbs
        </div>
      </div>
    </div>
  );
}
