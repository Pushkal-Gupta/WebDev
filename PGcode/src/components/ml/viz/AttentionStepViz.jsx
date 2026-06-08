import React, { useMemo, useState } from 'react';
import { Shuffle, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 640;
const H = 380;
const PAD_L = 24;
const PAD_R = 24;
const PAD_T = 50;
const PAD_B = 26;

const N = 3;
const D = 2;

const DEFAULT_X = [
  [1, 0],
  [0, 1],
  [1, 1],
];

const TOKEN_LABELS = ['cat', 'sat', 'mat'];

const STAGES = [
  { id: 0, label: 'Q · Kᵀ', sub: 'pairwise dot products' },
  { id: 1, label: '÷ √d', sub: 'scale by √d_k' },
  { id: 2, label: 'softmax', sub: 'row-wise normalize' },
  { id: 3, label: '× V', sub: 'weighted blend of values' },
  { id: 4, label: 'output', sub: 'context-aware token' },
];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function computePipeline(X, queryIdx) {
  const Q = X[queryIdx];
  const rawScores = X.map((k) => dot(Q, k));
  const scale = Math.sqrt(D);
  const scaled = rawScores.map((s) => s / scale);
  const maxS = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - maxS));
  const sumExp = exps.reduce((a, b) => a + b, 0);
  const weights = exps.map((e) => e / sumExp);
  const out = [0, 0];
  for (let i = 0; i < N; i++) {
    out[0] += weights[i] * X[i][0];
    out[1] += weights[i] * X[i][1];
  }
  return { rawScores, scaled, weights, out };
}

function chipColor(v, max = 3) {
  const t = Math.min(1, Math.abs(v) / max);
  const a = 0.12 + t * 0.55;
  return `rgba(var(--accent-rgb, 0,255,245), ${a})`;
}

function weightColor(w) {
  const a = 0.15 + Math.min(1, w) * 0.7;
  return `rgba(var(--accent-rgb, 0,255,245), ${a})`;
}

export default function AttentionStepViz() {
  const [X, setX] = useState(DEFAULT_X.map((r) => r.slice()));
  const [queryIdx, setQueryIdx] = useState(1);
  const [stage, setStage] = useState(4);

  const pipe = useMemo(() => computePipeline(X, queryIdx), [X, queryIdx]);

  const stageX = useMemo(() => {
    const innerW = W - PAD_L - PAD_R;
    return STAGES.map((_, i) => PAD_L + (innerW * (i + 0.5)) / STAGES.length);
  }, []);

  const handleCell = (tokIdx, dim, v) => {
    setX((prev) => {
      const next = prev.map((r) => r.slice());
      next[tokIdx][dim] = Math.max(-2, Math.min(2, v));
      return next;
    });
  };

  const randomize = () => {
    setX(Array.from({ length: N }, () => [
      Math.round((Math.random() * 2 - 1) * 20) / 20,
      Math.round((Math.random() * 2 - 1) * 20) / 20,
    ]));
  };

  const reset = () => {
    setX(DEFAULT_X.map((r) => r.slice()));
    setQueryIdx(1);
    setStage(4);
  };

  const showRaw = stage >= 0;
  const showScaled = stage >= 1;
  const showSoftmax = stage >= 2;
  const showValueMix = stage >= 3;
  const showOutput = stage >= 4;

  const STAGE_BAND_H = 38;
  const stageY = PAD_T - 16;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '640px' }}>
          {/* Stage labels along top */}
          {STAGES.map((s, i) => {
            const active = stage >= i;
            return (
              <g key={`stage-${i}`}>
                <rect
                  x={stageX[i] - 50}
                  y={stageY - 14}
                  width={100}
                  height={STAGE_BAND_H}
                  rx={6}
                  fill={active ? 'rgba(var(--accent-rgb, 0,255,245), 0.10)' : 'var(--surface)'}
                  stroke={active ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth="1"
                  opacity={active ? 1 : 0.55}
                />
                <text
                  x={stageX[i]}
                  y={stageY}
                  fontSize="10.5"
                  fill={active ? 'var(--accent)' : 'var(--text-dim)'}
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="700"
                  letterSpacing="0.08em"
                >
                  {s.label}
                </text>
                <text
                  x={stageX[i]}
                  y={stageY + 12}
                  fontSize="7.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  letterSpacing="0.06em"
                >
                  {s.sub}
                </text>
              </g>
            );
          })}

          {/* Connector arrows between stages */}
          {STAGES.slice(0, -1).map((_, i) => {
            const x1 = stageX[i] + 50;
            const x2 = stageX[i + 1] - 50;
            const y = stageY + 5;
            const active = stage > i;
            return (
              <line
                key={`arr-${i}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={active ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={active ? 1.4 : 0.8}
                opacity={active ? 0.9 : 0.5}
                markerEnd={`url(#att-arrow-${active ? 'on' : 'off'})`}
              />
            );
          })}
          <defs>
            <marker id="att-arrow-on" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker id="att-arrow-off" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--border)" />
            </marker>
          </defs>

          {/* Lane 1: Q · Kᵀ — show 3 dot products into raw scores */}
          {(() => {
            const cx = stageX[0];
            const top = PAD_T + 38;
            const cellH = 32;
            return (
              <g>
                {X.map((kv, i) => {
                  const cy = top + i * cellH;
                  const v = pipe.rawScores[i];
                  const isQuery = i === queryIdx;
                  return (
                    <g key={`raw-${i}`}>
                      <text
                        x={cx - 44}
                        y={cy + 4}
                        fontSize="9"
                        fill="var(--text-dim)"
                        fontFamily="var(--mono, monospace)"
                        textAnchor="end"
                      >
                        q·k{i + 1}
                      </text>
                      <rect
                        x={cx - 32}
                        y={cy - 9}
                        width={64}
                        height={18}
                        rx={4}
                        fill={showRaw ? chipColor(v) : 'var(--surface)'}
                        stroke={isQuery ? 'var(--hue-mint, #6fe3a8)' : 'var(--border)'}
                        strokeWidth={isQuery ? 1.4 : 0.8}
                        opacity={showRaw ? 1 : 0.4}
                      />
                      <text
                        x={cx}
                        y={cy + 4}
                        fontSize="10"
                        fill={showRaw ? 'var(--text-main)' : 'var(--text-dim)'}
                        fontFamily="var(--mono, monospace)"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {showRaw ? snap(v, 2) : '·'}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* Lane 2: scaled */}
          {(() => {
            const cx = stageX[1];
            const top = PAD_T + 38;
            const cellH = 32;
            return (
              <g>
                {X.map((_, i) => {
                  const cy = top + i * cellH;
                  const v = pipe.scaled[i];
                  return (
                    <g key={`sc-${i}`}>
                      <rect
                        x={cx - 32}
                        y={cy - 9}
                        width={64}
                        height={18}
                        rx={4}
                        fill={showScaled ? chipColor(v) : 'var(--surface)'}
                        stroke="var(--border)"
                        strokeWidth="0.8"
                        opacity={showScaled ? 1 : 0.4}
                      />
                      <text
                        x={cx}
                        y={cy + 4}
                        fontSize="10"
                        fill={showScaled ? 'var(--text-main)' : 'var(--text-dim)'}
                        fontFamily="var(--mono, monospace)"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {showScaled ? snap(v, 2) : '·'}
                      </text>
                    </g>
                  );
                })}
                <text
                  x={cx}
                  y={top + N * cellH + 6}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  √{D} ≈ {snap(Math.sqrt(D), 3)}
                </text>
              </g>
            );
          })()}

          {/* Lane 3: softmax weights as horizontal bars */}
          {(() => {
            const cx = stageX[2];
            const top = PAD_T + 38;
            const cellH = 32;
            const maxBarW = 80;
            return (
              <g>
                {pipe.weights.map((w, i) => {
                  const cy = top + i * cellH;
                  const barW = showSoftmax ? w * maxBarW : 0;
                  return (
                    <g key={`sm-${i}`}>
                      <rect
                        x={cx - maxBarW / 2}
                        y={cy - 9}
                        width={maxBarW}
                        height={18}
                        rx={4}
                        fill="var(--surface)"
                        stroke="var(--border)"
                        strokeWidth="0.6"
                        opacity={showSoftmax ? 1 : 0.4}
                      />
                      <rect
                        x={cx - maxBarW / 2}
                        y={cy - 9}
                        width={barW}
                        height={18}
                        rx={4}
                        fill={weightColor(w)}
                        opacity={showSoftmax ? 0.95 : 0}
                      />
                      <text
                        x={cx - maxBarW / 2 - 6}
                        y={cy + 4}
                        fontSize="8.5"
                        fill="var(--text-dim)"
                        fontFamily="var(--mono, monospace)"
                        textAnchor="end"
                      >
                        w{i + 1}
                      </text>
                      <text
                        x={cx}
                        y={cy + 4}
                        fontSize="9.5"
                        fill={showSoftmax ? 'var(--text-main)' : 'var(--text-dim)'}
                        fontFamily="var(--mono, monospace)"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {showSoftmax ? snap(w, 2) : '·'}
                      </text>
                    </g>
                  );
                })}
                <text
                  x={cx}
                  y={top + N * cellH + 6}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  Σ = 1
                </text>
              </g>
            );
          })()}

          {/* Lane 4: × V — show value vectors as 2-component bars */}
          {(() => {
            const cx = stageX[3];
            const top = PAD_T + 38;
            const cellH = 32;
            return (
              <g>
                {X.map((v, i) => {
                  const cy = top + i * cellH;
                  const w = pipe.weights[i];
                  const opacity = showValueMix ? 0.3 + w * 0.7 : 0.4;
                  return (
                    <g key={`v-${i}`} opacity={opacity}>
                      <rect
                        x={cx - 32}
                        y={cy - 9}
                        width={64}
                        height={18}
                        rx={4}
                        fill="var(--surface)"
                        stroke="var(--hue-pink, #ff66cc)"
                        strokeWidth={showValueMix ? 1 : 0.6}
                      />
                      {/* mini 2-D component bars */}
                      <g>
                        {v.map((c, ci) => {
                          const clamped = Math.max(-1, Math.min(1, c));
                          const bw = Math.abs(clamped) * 12;
                          const bx0 = cx - 26 + ci * 30;
                          return (
                            <g key={`vb-${i}-${ci}`}>
                              <line
                                x1={bx0}
                                y1={cy}
                                x2={bx0 + 24}
                                y2={cy}
                                stroke="var(--border)"
                                strokeWidth="0.4"
                              />
                              <rect
                                x={clamped >= 0 ? bx0 + 12 : bx0 + 12 - bw}
                                y={cy - 4}
                                width={bw}
                                height={8}
                                fill="var(--hue-pink, #ff66cc)"
                                opacity="0.85"
                                rx="1"
                              />
                            </g>
                          );
                        })}
                      </g>
                      <text
                        x={cx - 38}
                        y={cy + 4}
                        fontSize="8.5"
                        fill="var(--text-dim)"
                        fontFamily="var(--mono, monospace)"
                        textAnchor="end"
                      >
                        v{i + 1}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* Lane 5: output */}
          {(() => {
            const cx = stageX[4];
            const cy = PAD_T + 38 + (N * 32) / 2 - 16;
            const v = pipe.out;
            return (
              <g>
                <rect
                  x={cx - 42}
                  y={cy - 18}
                  width={84}
                  height={56}
                  rx={6}
                  fill={showOutput ? 'rgba(var(--accent-rgb, 0,255,245), 0.15)' : 'var(--surface)'}
                  stroke={showOutput ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={showOutput ? 1.4 : 0.8}
                />
                <text
                  x={cx}
                  y={cy - 4}
                  fontSize="10"
                  fill={showOutput ? 'var(--accent)' : 'var(--text-dim)'}
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="700"
                  letterSpacing="0.06em"
                >
                  z{queryIdx + 1}
                </text>
                <text
                  x={cx}
                  y={cy + 10}
                  fontSize="10.5"
                  fill={showOutput ? 'var(--text-main)' : 'var(--text-dim)'}
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {showOutput ? `(${snap(v[0], 2)}, ${snap(v[1], 2)})` : '(·, ·)'}
                </text>
                <text
                  x={cx}
                  y={cy + 26}
                  fontSize="7.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  letterSpacing="0.06em"
                >
                  context-aware
                </text>
              </g>
            );
          })()}

          {/* Tokens row at bottom */}
          {(() => {
            const baseY = H - PAD_B - 6;
            const cols = N;
            const startX = stageX[0] - 40;
            const endX = stageX[3] + 40;
            const span = endX - startX;
            const cellW = span / cols;
            return (
              <g>
                <text
                  x={startX - 6}
                  y={baseY - 18}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                  letterSpacing="0.12em"
                >
                  TOKENS
                </text>
                {X.map((row, i) => {
                  const x = startX + cellW * (i + 0.5);
                  const isQuery = i === queryIdx;
                  return (
                    <g key={`tok-${i}`}>
                      <rect
                        x={x - 36}
                        y={baseY - 22}
                        width={72}
                        height={28}
                        rx={5}
                        fill={isQuery ? 'rgba(var(--accent-rgb, 0,255,245), 0.10)' : 'var(--surface)'}
                        stroke={isQuery ? 'var(--hue-mint, #6fe3a8)' : 'var(--border)'}
                        strokeWidth={isQuery ? 1.4 : 0.8}
                      />
                      <text
                        x={x}
                        y={baseY - 10}
                        fontSize="10"
                        fill={isQuery ? 'var(--hue-mint, #6fe3a8)' : 'var(--text-main)'}
                        fontFamily="var(--serif, serif)"
                        fontStyle="italic"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {TOKEN_LABELS[i] || `t${i + 1}`}
                      </text>
                      <text
                        x={x}
                        y={baseY + 2}
                        fontSize="8.5"
                        fill="var(--text-dim)"
                        fontFamily="var(--mono, monospace)"
                        textAnchor="middle"
                      >
                        ({snap(row[0], 2)}, {snap(row[1], 2)})
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="mlviz-toggles">
        {STAGES.map((s, i) => (
          <button
            key={`btn-${i}`}
            type="button"
            className={`mlviz-toggle ${stage >= i ? 'is-on' : ''}`}
            onClick={() => setStage(i)}
          >
            <span className="mlviz-toggle-dot" />
            <span>{i + 1}. {s.label}</span>
          </button>
        ))}
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-slider-label">QUERY TOKEN</span>
          {TOKEN_LABELS.map((t, i) => (
            <button
              key={`q-${i}`}
              type="button"
              className={`mlviz-btn ${queryIdx === i ? 'mlviz-btn-primary' : ''}`}
              onClick={() => setQueryIdx(i)}
              style={{ padding: '0.28rem 0.6rem' }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">w</span>
            <span className="mlviz-val">[{pipe.weights.map((v) => snap(v, 2)).join(', ')}]</span>
            <span className="mlviz-sub">attention weights · sum to 1</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">z</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)' }}>
              ({snap(pipe.out[0], 2)}, {snap(pipe.out[1], 2)})
            </span>
            <span className="mlviz-sub">output for {TOKEN_LABELS[queryIdx]}</span>
          </div>
        </div>

        <div className="mlviz-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.3rem' }}>
          <span className="mlviz-slider-label">EDIT TOKEN EMBEDDINGS</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
            {X.map((row, i) => (
              <div
                key={`edit-${i}`}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.45rem',
                  background: 'var(--bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--mono, monospace)',
                  letterSpacing: '0.08em',
                }}>
                  {TOKEN_LABELS[i] || `t${i + 1}`}
                </span>
                {row.map((c, ci) => (
                  <label key={`edit-${i}-${ci}`} className="mlviz-slider" style={{ minWidth: 0 }}>
                    <span className="mlviz-slider-label">x{ci + 1}</span>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={c}
                      onChange={(e) => handleCell(i, ci, parseFloat(e.target.value))}
                    />
                    <span className="mlviz-slider-val">{snap(c, 2)}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={randomize}>
            <Shuffle size={13} />
            <span>Random embeddings</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          step {stage + 1} of {STAGES.length} · {STAGES[stage].label} — {STAGES[stage].sub}
        </div>
      </div>
    </div>
  );
}
