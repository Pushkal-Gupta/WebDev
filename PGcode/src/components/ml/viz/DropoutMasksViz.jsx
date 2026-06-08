import React, { useMemo, useState } from 'react';
import { Shuffle, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 340;
const PAD_L = 60;
const PAD_R = 24;
const PAD_T = 50;
const PAD_B = 36;

const N_UNITS = 5;
const N_BATCHES = 3;
const DEFAULT_ACTIVATIONS = [0.8, 0.4, 0.9, 0.6, 0.5];

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

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function genMasks(seed, p, nBatches = N_BATCHES, nUnits = N_UNITS) {
  const rand = mulberry32(seed);
  const masks = [];
  const keep = 1 - p;
  for (let b = 0; b < nBatches; b++) {
    const row = [];
    for (let u = 0; u < nUnits; u++) {
      // attempt to guarantee at least one drop per row when p > 0
      row.push(rand() < keep ? 1 : 0);
    }
    // ensure not all alive and not all dead for visual interest
    if (p > 0 && row.every((v) => v === 1)) {
      const idx = Math.floor(rand() * nUnits);
      row[idx] = 0;
    }
    if (p < 1 && row.every((v) => v === 0)) {
      const idx = Math.floor(rand() * nUnits);
      row[idx] = 1;
    }
    masks.push(row);
  }
  return masks;
}

export default function DropoutMasksViz() {
  const [p, setP] = useState(0.4);
  const [seed, setSeed] = useState(7);
  const [showInference, setShowInference] = useState(false);
  const [activations] = useState(DEFAULT_ACTIVATIONS);

  const masks = useMemo(() => genMasks(seed, p), [seed, p]);

  // Effective activation per cell with inverted dropout
  const cellW = (W - PAD_L - PAD_R) / N_UNITS;
  const cellH = (H - PAD_T - PAD_B) / N_BATCHES;
  const minDim = Math.min(cellW, cellH) * 0.36;

  const totalSurvivors = masks.flat().reduce((a, b) => a + b, 0);
  const totalCells = N_BATCHES * N_UNITS;
  const survivalRate = totalSurvivors / totalCells;

  const trainExpectations = useMemo(() => {
    // for each unit, average across the 3 minibatches: mean of m_i * a_i / (1-p)
    const out = [];
    for (let u = 0; u < N_UNITS; u++) {
      let sum = 0;
      for (let b = 0; b < N_BATCHES; b++) {
        const scaled = masks[b][u] * activations[u] / Math.max(0.001, 1 - p);
        sum += scaled;
      }
      out.push(sum / N_BATCHES);
    }
    return out;
  }, [masks, activations, p]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '600px' }}>
          {/* Column headers: h1..h5 */}
          {Array.from({ length: N_UNITS }, (_, u) => {
            const x = PAD_L + cellW * (u + 0.5);
            return (
              <g key={`hdr-${u}`}>
                <text
                  x={x}
                  y={PAD_T - 24}
                  fontSize="10"
                  fill="var(--text-main)"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  h{u + 1}
                </text>
                <text
                  x={x}
                  y={PAD_T - 12}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  a={snap(activations[u], 2)}
                </text>
              </g>
            );
          })}

          {/* Row labels */}
          {showInference ? (
            <g>
              <text
                x={PAD_L - 12}
                y={PAD_T + cellH * (N_BATCHES / 2) + 4}
                fontSize="10"
                fill="var(--accent)"
                fontFamily="var(--mono, monospace)"
                textAnchor="end"
                fontWeight="700"
                letterSpacing="0.1em"
              >
                INFERENCE
              </text>
              <text
                x={PAD_L - 12}
                y={PAD_T + cellH * (N_BATCHES / 2) + 18}
                fontSize="7.5"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="end"
                letterSpacing="0.06em"
              >
                no mask · no scale
              </text>
            </g>
          ) : (
            Array.from({ length: N_BATCHES }, (_, b) => {
              const y = PAD_T + cellH * (b + 0.5);
              return (
                <g key={`row-${b}`}>
                  <text
                    x={PAD_L - 12}
                    y={y - 4}
                    fontSize="9"
                    fill="var(--text-main)"
                    fontFamily="var(--mono, monospace)"
                    textAnchor="end"
                    fontWeight="700"
                    letterSpacing="0.08em"
                  >
                    batch t{b > 0 ? `+${b}` : ''}
                  </text>
                  <text
                    x={PAD_L - 12}
                    y={y + 10}
                    fontSize="7.5"
                    fill="var(--text-dim)"
                    fontFamily="var(--mono, monospace)"
                    textAnchor="end"
                  >
                    mask {b + 1}
                  </text>
                </g>
              );
            })
          )}

          {/* Grid cells */}
          {Array.from({ length: showInference ? 1 : N_BATCHES }, (_, b) =>
            Array.from({ length: N_UNITS }, (_, u) => {
              const cx = PAD_L + cellW * (u + 0.5);
              const cy = PAD_T + cellH * (b + 0.5);
              const alive = showInference ? 1 : masks[b][u];
              const a = activations[u];
              const effective = showInference
                ? a // inference: no mask
                : alive
                  ? a / Math.max(0.001, 1 - p)
                  : 0;

              const radius = minDim;
              return (
                <g key={`cell-${b}-${u}`}>
                  {/* faint cell background */}
                  <rect
                    x={cx - cellW / 2 + 2}
                    y={cy - cellH / 2 + 2}
                    width={cellW - 4}
                    height={cellH - 4}
                    rx={6}
                    fill={alive
                      ? 'rgba(var(--accent-rgb, 0,255,245), 0.05)'
                      : 'var(--surface)'}
                    stroke="var(--border)"
                    strokeWidth="0.6"
                  />
                  {alive ? (
                    <>
                      {/* Outer ring */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="rgba(var(--accent-rgb, 0,255,245), 0.18)"
                        stroke="var(--accent)"
                        strokeWidth="1.4"
                      />
                      {/* Inner filled to indicate scaled value */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius * Math.min(1, Math.abs(effective) / 2)}
                        fill="var(--accent)"
                        opacity="0.55"
                      />
                      <text
                        x={cx}
                        y={cy + 3}
                        fontSize="9.5"
                        fill="var(--text-main)"
                        fontFamily="var(--mono, monospace)"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {snap(effective, 2)}
                      </text>
                      {!showInference && (
                        <text
                          x={cx}
                          y={cy + radius + 11}
                          fontSize="7"
                          fill="var(--text-dim)"
                          fontFamily="var(--mono, monospace)"
                          textAnchor="middle"
                          letterSpacing="0.06em"
                        >
                          ×{snap(1 / (1 - p), 2)}
                        </text>
                      )}
                    </>
                  ) : (
                    <>
                      {/* dead neuron — gray X */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="var(--surface)"
                        stroke="var(--border)"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.7"
                      />
                      <line
                        x1={cx - radius * 0.6}
                        y1={cy - radius * 0.6}
                        x2={cx + radius * 0.6}
                        y2={cy + radius * 0.6}
                        stroke="var(--hard, #ef476f)"
                        strokeWidth="1.6"
                        opacity="0.7"
                      />
                      <line
                        x1={cx + radius * 0.6}
                        y1={cy - radius * 0.6}
                        x2={cx - radius * 0.6}
                        y2={cy + radius * 0.6}
                        stroke="var(--hard, #ef476f)"
                        strokeWidth="1.6"
                        opacity="0.7"
                      />
                      <text
                        x={cx}
                        y={cy + radius + 11}
                        fontSize="7"
                        fill="var(--hard, #ef476f)"
                        fontFamily="var(--mono, monospace)"
                        textAnchor="middle"
                        letterSpacing="0.06em"
                        opacity="0.85"
                      >
                        dropped
                      </text>
                    </>
                  )}
                </g>
              );
            })
          )}

          {/* Footer summary band */}
          <g>
            <line
              x1={PAD_L}
              y1={H - PAD_B + 4}
              x2={W - PAD_R}
              y2={H - PAD_B + 4}
              stroke="var(--border)"
              strokeWidth="0.6"
              strokeDasharray="2 3"
            />
            <text
              x={PAD_L}
              y={H - PAD_B + 18}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              letterSpacing="0.08em"
            >
              p_drop = {snap(p, 2)} · rescale ×{snap(1 / Math.max(0.001, 1 - p), 2)}
            </text>
            <text
              x={W - PAD_R}
              y={H - PAD_B + 18}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="end"
              letterSpacing="0.08em"
            >
              {showInference
                ? 'inference: every neuron alive, identity pass'
                : `survivors ${totalSurvivors}/${totalCells} · empirical keep ${snap(survivalRate * 100, 0)}%`}
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-toggles">
        <button
          type="button"
          className={`mlviz-toggle ${!showInference ? 'is-on' : ''}`}
          onClick={() => setShowInference(false)}
        >
          <span className="mlviz-toggle-dot" />
          <span>Training (3 masks)</span>
        </button>
        <button
          type="button"
          className={`mlviz-toggle ${showInference ? 'is-on' : ''}`}
          onClick={() => setShowInference(true)}
        >
          <span className="mlviz-toggle-dot" />
          <span>Inference (no mask)</span>
        </button>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">DROP p</span>
          <input
            type="range"
            min="0"
            max="0.9"
            step="0.05"
            value={p}
            onChange={(e) => setP(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(p, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">E[a]</span>
            <span className="mlviz-val">
              [{trainExpectations.map((v) => snap(v, 2)).join(', ')}]
            </span>
            <span className="mlviz-sub">3-batch mean of scaled activations</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">a</span>
            <span className="mlviz-val">
              [{activations.map((v) => snap(v, 2)).join(', ')}]
            </span>
            <span className="mlviz-sub">target — inverted dropout preserves this</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={() => setSeed((s) => (s * 1103515245 + 12345) & 0x7fffffff)}
          >
            <Shuffle size={13} />
            <span>Resample masks</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setSeed(7); setP(0.4); setShowInference(false); }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          {showInference
            ? 'inference — full ensemble fires, every weight is used'
            : `train — each of ${N_BATCHES} minibatches silences a different subset · survivors rescaled by 1/(1−p)`}
        </div>
      </div>
    </div>
  );
}
