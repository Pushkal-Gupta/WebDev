import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Shuffle, RotateCcw, Play, Pause, SkipForward } from 'lucide-react';
import './MLViz.css';

const W = 680;
const H = 380;
const PAD_L = 64;
const PAD_R = 40;
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

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);
  return reduced;
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
  // `prog` is a continuous position across stages: 0 .. STAGES.length-1.
  const [prog, setProg] = useState(STAGES.length - 1);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const rafRef = useRef(null);
  const lastRef = useRef(null);

  const stage = Math.round(prog);
  const pipe = useMemo(() => computePipeline(X, queryIdx), [X, queryIdx]);

  // Continuous auto-advance driver.
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
      return undefined;
    }
    if (reduced) {
      // No continuous motion: snap straight to the end (one-shot, intentional).
      /* eslint-disable react-hooks/set-state-in-effect */
      setProg(STAGES.length - 1);
      setPlaying(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return undefined;
    }
    const SPEED = 0.9; // stages per second
    const tick = (now) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setProg((p) => {
        const next = p + dt * SPEED;
        if (next >= STAGES.length - 1) {
          setPlaying(false);
          return STAGES.length - 1;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [playing, reduced]);

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
    setPlaying(false);
    setX(Array.from({ length: N }, () => [
      Math.round((Math.random() * 2 - 1) * 20) / 20,
      Math.round((Math.random() * 2 - 1) * 20) / 20,
    ]));
  };

  const reset = () => {
    setPlaying(false);
    setX(DEFAULT_X.map((r) => r.slice()));
    setQueryIdx(1);
    setProg(STAGES.length - 1);
  };

  const play = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (stage >= STAGES.length - 1) setProg(0);
    setPlaying(true);
  };

  const stepFwd = () => {
    setPlaying(false);
    setProg((p) => Math.min(STAGES.length - 1, Math.round(p) + 1));
  };

  // Per-stage reveal amount in 0..1 (eased), so lanes fade/fill in as the
  // continuous head crosses them rather than hard-cutting.
  const reveal = (i) => {
    const v = prog - (i - 1);
    return easeInOut(Math.max(0, Math.min(1, v)));
  };

  const STAGE_BAND_H = 38;
  const stageY = PAD_T - 16;

  // Flow animation: a marker travels along the score connector toward the
  // softmax lane while stage 2 is being revealed.
  const flowR = reveal(2);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '840px', aspectRatio: `${W} / ${H}` }}>
          {/* Stage labels along top */}
          {STAGES.map((s, i) => {
            const r = reveal(i);
            const active = r > 0.02;
            const headHere = Math.abs(prog - i) < 0.5 && playing;
            return (
              <g key={`stage-${i}`}>
                <rect
                  x={stageX[i] - 50}
                  y={stageY - 14}
                  width={100}
                  height={STAGE_BAND_H}
                  rx={6}
                  fill={active ? `rgba(var(--accent-rgb, 0,255,245), ${0.04 + r * 0.1})` : 'var(--surface)'}
                  stroke={active ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={headHere ? 1.8 : 1}
                  opacity={0.55 + r * 0.45}
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
            const r = reveal(i + 1);
            const active = r > 0.02;
            return (
              <line
                key={`arr-${i}`}
                x1={x1}
                y1={y}
                x2={x1 + (x2 - x1) * (active ? 1 : 0.0)}
                y2={y}
                stroke={active ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={active ? 1.4 : 0.8}
                opacity={active ? 0.4 + r * 0.5 : 0.5}
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
            <radialGradient id="att-flow-dot" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Lane 1: Q · Kᵀ — show 3 dot products into raw scores */}
          {(() => {
            const cx = stageX[0];
            const top = PAD_T + 38;
            const cellH = 32;
            const r0 = reveal(0);
            return (
              <g>
                {X.map((kv, i) => {
                  const cy = top + i * cellH;
                  const v = pipe.rawScores[i];
                  const isQuery = i === queryIdx;
                  return (
                    <g key={`raw-${i}`} opacity={0.4 + r0 * 0.6}>
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
                        fill={r0 > 0.02 ? chipColor(v) : 'var(--surface)'}
                        stroke={isQuery ? 'var(--hue-mint, #6fe3a8)' : 'var(--border)'}
                        strokeWidth={isQuery ? 1.4 : 0.8}
                      />
                      <text
                        x={cx}
                        y={cy + 4}
                        fontSize="10"
                        fill={r0 > 0.02 ? 'var(--text-main)' : 'var(--text-dim)'}
                        fontFamily="var(--mono, monospace)"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {r0 > 0.02 ? snap(v, 2) : '·'}
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
            const r1 = reveal(1);
            return (
              <g opacity={0.4 + r1 * 0.6}>
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
                        fill={r1 > 0.02 ? chipColor(v) : 'var(--surface)'}
                        stroke="var(--border)"
                        strokeWidth="0.8"
                      />
                      <text
                        x={cx}
                        y={cy + 4}
                        fontSize="10"
                        fill={r1 > 0.02 ? 'var(--text-main)' : 'var(--text-dim)'}
                        fontFamily="var(--mono, monospace)"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {r1 > 0.02 ? snap(v, 2) : '·'}
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

          {/* Flowing markers: scaled scores travel toward softmax bars */}
          {flowR > 0.01 && flowR < 0.999 && !reduced && (() => {
            const top = PAD_T + 38;
            const cellH = 32;
            const x1 = stageX[1] + 32;
            const x2 = stageX[2] - 40;
            const t = flowR;
            return X.map((_, i) => {
              const cy = top + i * cellH;
              const x = x1 + (x2 - x1) * t;
              return (
                <circle
                  key={`flow-${i}`}
                  cx={x}
                  cy={cy}
                  r={6}
                  fill="url(#att-flow-dot)"
                  opacity={Math.sin(t * Math.PI)}
                />
              );
            });
          })()}

          {/* Lane 3: softmax weights as horizontal bars (bars grow with reveal) */}
          {(() => {
            const cx = stageX[2];
            const top = PAD_T + 38;
            const cellH = 32;
            const maxBarW = 80;
            const r2 = reveal(2);
            return (
              <g opacity={0.4 + r2 * 0.6}>
                {pipe.weights.map((w, i) => {
                  const cy = top + i * cellH;
                  const barW = w * maxBarW * r2;
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
                      />
                      <rect
                        x={cx - maxBarW / 2}
                        y={cy - 9}
                        width={barW}
                        height={18}
                        rx={4}
                        fill={weightColor(w)}
                        opacity={0.95}
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
                        fill={r2 > 0.02 ? 'var(--text-main)' : 'var(--text-dim)'}
                        fontFamily="var(--mono, monospace)"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {r2 > 0.02 ? snap(w, 2) : '·'}
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
            const r3 = reveal(3);
            return (
              <g>
                {X.map((v, i) => {
                  const cy = top + i * cellH;
                  const w = pipe.weights[i];
                  const opacity = 0.3 + w * 0.7 * r3 + (1 - r3) * 0.1;
                  return (
                    <g key={`v-${i}`} opacity={Math.min(1, opacity)}>
                      <rect
                        x={cx - 32}
                        y={cy - 9}
                        width={64}
                        height={18}
                        rx={4}
                        fill="var(--surface)"
                        stroke="var(--hue-pink, #ff66cc)"
                        strokeWidth={0.6 + r3 * 0.4}
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

          {/* Lane 5: output (scales up as it reveals) */}
          {(() => {
            const cx = stageX[4];
            const cy = PAD_T + 38 + (N * 32) / 2 - 16;
            const v = pipe.out;
            const r4 = reveal(4);
            const s = 0.85 + r4 * 0.15;
            return (
              <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`} opacity={0.4 + r4 * 0.6}>
                <rect
                  x={cx - 42}
                  y={cy - 18}
                  width={84}
                  height={56}
                  rx={6}
                  fill={r4 > 0.02 ? `rgba(var(--accent-rgb, 0,255,245), ${0.06 + r4 * 0.12})` : 'var(--surface)'}
                  stroke={r4 > 0.02 ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={r4 > 0.5 ? 1.4 : 0.8}
                />
                <text
                  x={cx}
                  y={cy - 4}
                  fontSize="10"
                  fill={r4 > 0.02 ? 'var(--accent)' : 'var(--text-dim)'}
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
                  fill={r4 > 0.02 ? 'var(--text-main)' : 'var(--text-dim)'}
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {r4 > 0.02 ? `(${snap(v[0], 2)}, ${snap(v[1], 2)})` : '(·, ·)'}
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
            onClick={() => { setPlaying(false); setProg(i); }}
          >
            <span className="mlviz-toggle-dot" />
            <span>{i + 1}. {s.label}</span>
          </button>
        ))}
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={play}>
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause' : (stage >= STAGES.length - 1 ? 'Replay' : 'Play')}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={stepFwd} disabled={stage >= STAGES.length - 1}>
            <SkipForward size={13} />
            <span>Step</span>
          </button>
        </div>

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
