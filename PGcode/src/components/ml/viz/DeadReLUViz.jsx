import React, { useMemo, useState } from 'react';
import { RotateCcw, Skull } from 'lucide-react';
import './MLViz.css';

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const GRID_COLS = 24;
const GRID_ROWS = 12;
const N_NEURONS = GRID_COLS * GRID_ROWS;
const N_BATCH = 16;
const FAN_IN = 64;

const W_SVG = 720;
const H_SVG = 420;

export default function DeadReLUViz() {
  const [bias, setBias] = useState(0);
  const [seed, setSeed] = useState(11);

  const { neurons, deadCount } = useMemo(() => {
    const rng = mulberry32(seed);
    const sigmaW = Math.sqrt(2 / FAN_IN);
    const out = [];
    let dead = 0;
    for (let n = 0; n < N_NEURONS; n++) {
      const w = Array.from({ length: FAN_IN }, () => sigmaW * gauss(rng));
      let anyActive = false;
      let maxPreAct = -Infinity;
      for (let b = 0; b < N_BATCH; b++) {
        let z = bias;
        for (let j = 0; j < FAN_IN; j++) z += w[j] * gauss(rng);
        if (z > 0) anyActive = true;
        if (z > maxPreAct) maxPreAct = z;
      }
      if (!anyActive) dead += 1;
      out.push({ alive: anyActive, score: Math.tanh(maxPreAct) });
    }
    return { neurons: out, deadCount: dead };
  }, [bias, seed]);

  const deadPct = (deadCount / N_NEURONS) * 100;

  const gridLeft = 32;
  const gridTop = 56;
  const gridW = W_SVG - 64;
  const gridH = H_SVG - 56 - 60;
  const cellW = gridW / GRID_COLS;
  const cellH = gridH / GRID_ROWS;

  const reset = () => {
    setBias(0);
    setSeed(11);
  };

  const barX = gridLeft;
  const barY = H_SVG - 36;
  const barW = gridW;
  const barH = 14;
  const deadW = barW * (deadCount / N_NEURONS);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="mlviz-svg" preserveAspectRatio="xMidYMid meet">
          <text x={W_SVG / 2} y={20} fontFamily="var(--mono)" fontSize="11" fill="var(--text-dim)" textAnchor="middle" letterSpacing="0.08em">
            DEAD RELU NEURONS &nbsp;·&nbsp; He init, width {N_NEURONS}, batch {N_BATCH}
          </text>
          <text x={W_SVG / 2} y={36} fontFamily="var(--mono)" fontSize="10" fill="var(--text-dim)" textAnchor="middle">
            each square = one neuron · grey = dead (output 0 on every input) · coloured = active
          </text>

          {neurons.map((n, idx) => {
            const i = idx % GRID_COLS;
            const j = Math.floor(idx / GRID_COLS);
            const x = gridLeft + i * cellW + 1;
            const y = gridTop + j * cellH + 1;
            const fill = !n.alive
              ? 'var(--text-dim)'
              : `rgba(var(--accent-rgb), ${0.25 + 0.6 * Math.max(0, n.score)})`;
            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width={cellW - 2}
                height={cellH - 2}
                fill={fill}
                rx="1.5"
                opacity={n.alive ? 1 : 0.55}
              />
            );
          })}

          <rect x={barX} y={barY} width={barW} height={barH} fill="var(--surface)" stroke="var(--border)" strokeWidth="1" rx="3" />
          {deadW > 0 && (
            <rect x={barX} y={barY} width={deadW} height={barH} fill="var(--hard, var(--hue-pink))" opacity="0.78" rx="3" />
          )}
          <text x={barX} y={barY - 4} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)">
            dead fraction
          </text>
          <text x={barX + barW} y={barY - 4} fontSize="11" fontFamily="var(--mono)" fill="var(--text-main)" textAnchor="end" fontWeight="700">
            {deadCount} / {N_NEURONS} &nbsp; ({deadPct.toFixed(1)}%)
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--hard, var(--hue-pink))' }}><Skull size={13} style={{ verticalAlign: '-2px' }} /> dead</span>
          <span className="mlviz-val" style={{ fontFamily: 'var(--mono)' }}>{deadCount} / {N_NEURONS} neurons ({deadPct.toFixed(1)}%)</span>
          <span className="mlviz-sub">never fire on any of {N_BATCH} batch inputs · zero gradient forever</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>bias</span>
          <span className="mlviz-val" style={{ fontFamily: 'var(--mono)' }}>b = {bias.toFixed(2)}</span>
          <span className="mlviz-sub">
            {bias <= 0 && '~50% start dormant · some never recover'}
            {bias > 0 && bias < 0.2 && 'small positive bias rescues most neurons'}
            {bias >= 0.2 && 'almost every neuron starts on the active side of 0'}
          </span>
        </div>
      </div>

      <div className="mlviz-controls">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          ReLU bias
          <input
            type="range"
            min={-0.5}
            max={0.5}
            step={0.02}
            value={bias}
            onChange={(e) => setBias(Number(e.target.value))}
            style={{ width: 180, accentColor: 'var(--accent)' }}
          />
          <span style={{ color: 'var(--text-main)', minWidth: '4ch' }}>{bias.toFixed(2)}</span>
        </label>
        <button type="button" className="mlviz-btn" onClick={() => setSeed((s) => s + 1)}>
          new sample
        </button>
        <button type="button" className="mlviz-btn" onClick={() => setBias(0.1)}>
          bias = 0.1
        </button>
        <button type="button" className="mlviz-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
