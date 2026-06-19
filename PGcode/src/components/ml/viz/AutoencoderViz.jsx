import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Shuffle, Network } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 320;
const PAD_L = 38;
const PAD_R = 38;
const PAD_T = 38;
const PAD_B = 28;

const N_IN = 8;
const N_E = 5;
const N_Z = 2;
const N_D = 5;
const N_OUT = 8;

const COL_X = [
  PAD_L,
  PAD_L + (W - PAD_L - PAD_R) * 0.25,
  PAD_L + (W - PAD_L - PAD_R) * 0.5,
  PAD_L + (W - PAD_L - PAD_R) * 0.75,
  W - PAD_R,
];

const DEFAULT_INPUTS = [0.2, 0.6, 1.0, 0.8, 0.3, -0.2, -0.5, -0.3];

// Mulberry32 deterministic PRNG.
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

function makeMatrix(rows, cols, rand) {
  const m = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      // sample in roughly [-1, 1], slightly biased toward small magnitudes
      const v = (rand() * 2 - 1) * 0.9;
      row.push(Math.round(v * 100) / 100);
    }
    m.push(row);
  }
  return m;
}

function makeBias(n, rand) {
  return Array.from({ length: n }, () => Math.round((rand() * 0.6 - 0.3) * 100) / 100);
}

const RAND = mulberry32(42);
// Encoder: input(8) -> enc(5) -> latent(2)
const W1 = makeMatrix(N_E, N_IN, RAND);
const B1 = makeBias(N_E, RAND);
const W2 = makeMatrix(N_Z, N_E, RAND);
const B2 = makeBias(N_Z, RAND);
// Decoder: latent(2) -> dec(5) -> output(8) -- shape mirrors encoder
const W3 = makeMatrix(N_D, N_Z, RAND);
const B3 = makeBias(N_D, RAND);
const W4 = makeMatrix(N_OUT, N_D, RAND);
const B4 = makeBias(N_OUT, RAND);

function tanh(v) { return Math.tanh(v); }

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function nodePos(layer, idx, n) {
  const x = COL_X[layer];
  const span = H - PAD_T - PAD_B;
  const y = n === 1 ? PAD_T + span / 2 : PAD_T + (span * idx) / (n - 1);
  return { x, y };
}

const ENC_POS = Array.from({ length: N_E }, (_, i) => nodePos(1, i, N_E));
const Z_POS = Array.from({ length: N_Z }, (_, i) => nodePos(2, i, N_Z));
const DEC_POS = Array.from({ length: N_D }, (_, i) => nodePos(3, i, N_D));

// Phase 0 idle; 1 in->enc; 2 enc shown; 3 enc->z; 4 z shown; 5 z->dec; 6 dec shown; 7 dec->out; 8 out shown.
const PHASE_DURATIONS = [0, 700, 350, 700, 350, 700, 350, 700, 0];

function edgeColor(w) {
  return w >= 0 ? 'var(--hue-sky, #5ecbff)' : 'var(--hue-pink, #ff66cc)';
}
function edgeWidth(w) {
  const a = Math.min(1, Math.abs(w));
  return 0.5 + a * 1.8;
}
function edgeOpacity(w, dim) {
  const a = Math.min(1, Math.abs(w));
  const base = 0.18 + a * 0.45;
  return dim ? base * 0.35 : base;
}

function multiply(W, x, b) {
  return b.map((bv, i) => {
    let s = bv;
    for (let j = 0; j < x.length; j++) s += W[i][j] * x[j];
    return s;
  });
}

function InputBars({ x, y, width, height, values, color, label }) {
  const n = values.length;
  const gap = 2;
  const bw = (width - gap * (n - 1)) / n;
  const mid = y + height / 2;
  const half = height / 2 - 4;
  return (
    <g>
      <line x1={x} y1={mid} x2={x + width} y2={mid} stroke="var(--border)" strokeWidth="0.6" />
      {values.map((v, i) => {
        const bx = x + i * (bw + gap);
        const clamped = Math.max(-1, Math.min(1, v));
        const bh = Math.abs(clamped) * half;
        const by = clamped >= 0 ? mid - bh : mid;
        return (
          <rect
            key={`b-${i}`}
            x={bx}
            y={by}
            width={bw}
            height={Math.max(0.5, bh)}
            fill={color}
            opacity={0.85}
            rx={1.5}
          />
        );
      })}
      {label && (
        <text
          x={x}
          y={y - 6}
          fontSize="9"
          fill="var(--text-dim)"
          fontFamily="var(--mono, monospace)"
          letterSpacing="0.14em"
        >
          {label}
        </text>
      )}
    </g>
  );
}

export default function AutoencoderViz() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [phase, setPhase] = useState(0);
  const [pulseT, setPulseT] = useState(0);
  const [showWeights, setShowWeights] = useState(false);
  const rafRef = useRef(null);
  const timeoutsRef = useRef([]);
  const phaseStartRef = useRef(0);
  const runningRef = useRef(false);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    runningRef.current = false;
    clearTimers();
  }, [clearTimers]);

  const { encAct, zAct, decAct, outAct, mse } = useMemo(() => {
    const e = multiply(W1, inputs, B1).map(tanh);
    const z = multiply(W2, e, B2).map(tanh);
    const d = multiply(W3, z, B3).map(tanh);
    const o = multiply(W4, d, B4).map(tanh);
    let err = 0;
    for (let i = 0; i < N_IN; i++) err += (inputs[i] - o[i]) ** 2;
    return { encAct: e, zAct: z, decAct: d, outAct: o, mse: err / N_IN };
  }, [inputs]);

  const [prevPhase, setPrevPhase] = useState(phase);
  const isRestingPhase = phase === 0 || phase === 2 || phase === 4 || phase === 6 || phase === 8;
  if (prevPhase !== phase) {
    setPrevPhase(phase);
    if (isRestingPhase) setPulseT(0);
  }

  useEffect(() => {
    if (isRestingPhase) return;
    phaseStartRef.current = performance.now();
    const tick = () => {
      const dt = (performance.now() - phaseStartRef.current) / PHASE_DURATIONS[phase];
      const t = Math.min(1, dt);
      setPulseT(t);
      if (t < 1 && runningRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase, isRestingPhase]);

  const runForward = useCallback(() => {
    clearTimers();
    runningRef.current = true;
    setPhase(1);
    let cum = 0;
    const next = (p) => {
      cum += PHASE_DURATIONS[p];
      return cum;
    };
    const t1 = setTimeout(() => setPhase(2), next(1));
    const t2 = setTimeout(() => setPhase(3), next(2));
    const t3 = setTimeout(() => setPhase(4), next(3));
    const t4 = setTimeout(() => setPhase(5), next(4));
    const t5 = setTimeout(() => setPhase(6), next(5));
    const t6 = setTimeout(() => setPhase(7), next(6));
    const t7 = setTimeout(() => {
      setPhase(8);
      runningRef.current = false;
    }, next(7));
    timeoutsRef.current = [t1, t2, t3, t4, t5, t6, t7];
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    runningRef.current = false;
    setPhase(0);
    setPulseT(0);
  }, [clearTimers]);

  const randomize = useCallback(() => {
    reset();
    const next = Array.from({ length: N_IN }, () => Math.round((Math.random() * 2 - 1) * 20) / 20);
    setInputs(next);
  }, [reset]);

  const handleInput = useCallback((i, v) => {
    reset();
    setInputs((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }, [reset]);

  const isRunning = phase > 0 && phase < 8;
  const showEnc = phase >= 2;
  const showZ = phase >= 4;
  const showDec = phase >= 6;
  const showOut = phase >= 8;

  const INPUT_BAR = { x: PAD_L - 18, y: PAD_T - 4, w: 90, h: H - PAD_T - PAD_B + 4 };
  const OUTPUT_BAR = { x: W - PAD_R - 72, y: PAD_T - 4, w: 90, h: H - PAD_T - PAD_B + 4 };

  // Compute positions for the input "bars" column. We'll place them as a vertical strip of bars.
  const inBarHeights = inputs;
  const outBarHeights = outAct;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '820px' }}>
          {/* Layer labels */}
          <text x={COL_X[0]} y={PAD_T - 18} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.14em">
            INPUT · 8
          </text>
          <text x={COL_X[1]} y={PAD_T - 18} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.14em">
            ENC · 5
          </text>
          <text x={COL_X[2]} y={PAD_T - 18} fontSize="9.5" fill="var(--hue-mint, #6fe3a8)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.14em" fontWeight="700">
            LATENT · 2
          </text>
          <text x={COL_X[3]} y={PAD_T - 18} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.14em">
            DEC · 5
          </text>
          <text x={COL_X[4]} y={PAD_T - 18} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.14em">
            OUT · 8
          </text>

          {/* Bottleneck halo */}
          <rect
            x={COL_X[2] - 26}
            y={PAD_T - 6}
            width={52}
            height={H - PAD_T - PAD_B + 10}
            rx={10}
            fill="none"
            stroke="var(--hue-mint, #6fe3a8)"
            strokeWidth="0.6"
            strokeDasharray="3 3"
            opacity="0.45"
          />

          {/* Input column: small bars */}
          {(() => {
            const n = N_IN;
            const stripX = COL_X[0];
            const stripTop = PAD_T;
            const stripBottom = H - PAD_B;
            const cellH = (stripBottom - stripTop) / (n - 1);
            return inBarHeights.map((v, i) => {
              const y = stripTop + i * cellH;
              const clamped = Math.max(-1, Math.min(1, v));
              const barLen = Math.abs(clamped) * 22;
              return (
                <g key={`in-${i}`}>
                  <line
                    x1={stripX - 22}
                    y1={y}
                    x2={stripX + 22}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth="0.4"
                  />
                  <rect
                    x={clamped >= 0 ? stripX : stripX - barLen}
                    y={y - 4}
                    width={barLen}
                    height={8}
                    fill="var(--accent)"
                    opacity="0.85"
                    rx="1.5"
                  />
                  <text
                    x={stripX - 28}
                    y={y + 3}
                    fontSize="8"
                    fill="var(--text-dim)"
                    fontFamily="var(--mono, monospace)"
                    textAnchor="end"
                  >
                    x{i + 1}
                  </text>
                </g>
              );
            });
          })()}

          {/* Edges: input -> encoder */}
          {ENC_POS.map((ep, ei) =>
            Array.from({ length: N_IN }, (_, ii) => {
              const stripTop = PAD_T;
              const stripBottom = H - PAD_B;
              const cellH = (stripBottom - stripTop) / (N_IN - 1);
              const iy = stripTop + ii * cellH;
              const ix = COL_X[0] + 4;
              const w = W1[ei][ii];
              const dim = phase !== 1;
              return (
                <line
                  key={`e1-${ei}-${ii}`}
                  x1={ix}
                  y1={iy}
                  x2={ep.x}
                  y2={ep.y}
                  stroke={edgeColor(w)}
                  strokeWidth={edgeWidth(w)}
                  opacity={edgeOpacity(w, dim)}
                  strokeLinecap="round"
                />
              );
            })
          )}

          {/* Edges: encoder -> latent */}
          {Z_POS.map((zp, zi) =>
            ENC_POS.map((ep, ei) => {
              const w = W2[zi][ei];
              const dim = phase !== 3;
              return (
                <line
                  key={`e2-${zi}-${ei}`}
                  x1={ep.x}
                  y1={ep.y}
                  x2={zp.x}
                  y2={zp.y}
                  stroke={edgeColor(w)}
                  strokeWidth={edgeWidth(w)}
                  opacity={edgeOpacity(w, dim)}
                  strokeLinecap="round"
                />
              );
            })
          )}

          {/* Edges: latent -> decoder */}
          {DEC_POS.map((dp, di) =>
            Z_POS.map((zp, zi) => {
              const w = W3[di][zi];
              const dim = phase !== 5;
              return (
                <line
                  key={`e3-${di}-${zi}`}
                  x1={zp.x}
                  y1={zp.y}
                  x2={dp.x}
                  y2={dp.y}
                  stroke={edgeColor(w)}
                  strokeWidth={edgeWidth(w)}
                  opacity={edgeOpacity(w, dim)}
                  strokeLinecap="round"
                />
              );
            })
          )}

          {/* Edges: decoder -> output */}
          {(() => {
            const stripTop = PAD_T;
            const stripBottom = H - PAD_B;
            const cellH = (stripBottom - stripTop) / (N_OUT - 1);
            return Array.from({ length: N_OUT }, (_, oi) => {
              const oy = stripTop + oi * cellH;
              const ox = COL_X[4] - 4;
              return DEC_POS.map((dp, di) => {
                const w = W4[oi][di];
                const dim = phase !== 7;
                return (
                  <line
                    key={`e4-${oi}-${di}`}
                    x1={dp.x}
                    y1={dp.y}
                    x2={ox}
                    y2={oy}
                    stroke={edgeColor(w)}
                    strokeWidth={edgeWidth(w)}
                    opacity={edgeOpacity(w, dim)}
                    strokeLinecap="round"
                  />
                );
              });
            });
          })()}

          {/* Edge weight labels (toggled) */}
          {showWeights && ENC_POS.map((ep, ei) =>
            Array.from({ length: N_IN }, (_, ii) => {
              const stripTop = PAD_T;
              const stripBottom = H - PAD_B;
              const cellH = (stripBottom - stripTop) / (N_IN - 1);
              const iy = stripTop + ii * cellH;
              const ix = COL_X[0] + 4;
              const mx = ix + (ep.x - ix) * 0.5;
              const my = iy + (ep.y - iy) * 0.5;
              const w = W1[ei][ii];
              return (
                <text
                  key={`wl1-${ei}-${ii}`}
                  x={mx}
                  y={my}
                  fontSize="6.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  opacity="0.7"
                >
                  {snap(w, 1)}
                </text>
              );
            })
          )}

          {/* Pulses */}
          {phase === 1 && ENC_POS.map((ep, ei) => {
            const stripTop = PAD_T;
            const stripBottom = H - PAD_B;
            const cellH = (stripBottom - stripTop) / (N_IN - 1);
            return Array.from({ length: N_IN }, (_, ii) => {
              const iy = stripTop + ii * cellH;
              const ix = COL_X[0] + 4;
              const px = ix + (ep.x - ix) * pulseT;
              const py = iy + (ep.y - iy) * pulseT;
              const w = W1[ei][ii];
              return (
                <circle key={`p1-${ei}-${ii}`} cx={px} cy={py} r={2.6} fill={edgeColor(w)} opacity={Math.min(1, Math.abs(w) + 0.3)} />
              );
            });
          })}
          {phase === 3 && Z_POS.map((zp, zi) =>
            ENC_POS.map((ep, ei) => {
              const w = W2[zi][ei];
              const px = ep.x + (zp.x - ep.x) * pulseT;
              const py = ep.y + (zp.y - ep.y) * pulseT;
              return (
                <circle key={`p2-${zi}-${ei}`} cx={px} cy={py} r={2.8} fill={edgeColor(w)} opacity={Math.min(1, Math.abs(w) + 0.3)} />
              );
            })
          )}
          {phase === 5 && DEC_POS.map((dp, di) =>
            Z_POS.map((zp, zi) => {
              const w = W3[di][zi];
              const px = zp.x + (dp.x - zp.x) * pulseT;
              const py = zp.y + (dp.y - zp.y) * pulseT;
              return (
                <circle key={`p3-${di}-${zi}`} cx={px} cy={py} r={2.8} fill={edgeColor(w)} opacity={Math.min(1, Math.abs(w) + 0.3)} />
              );
            })
          )}
          {phase === 7 && (() => {
            const stripTop = PAD_T;
            const stripBottom = H - PAD_B;
            const cellH = (stripBottom - stripTop) / (N_OUT - 1);
            return Array.from({ length: N_OUT }, (_, oi) => {
              const oy = stripTop + oi * cellH;
              const ox = COL_X[4] - 4;
              return DEC_POS.map((dp, di) => {
                const w = W4[oi][di];
                const px = dp.x + (ox - dp.x) * pulseT;
                const py = dp.y + (oy - dp.y) * pulseT;
                return (
                  <circle key={`p4-${oi}-${di}`} cx={px} cy={py} r={2.6} fill={edgeColor(w)} opacity={Math.min(1, Math.abs(w) + 0.3)} />
                );
              });
            });
          })()}

          {/* Encoder nodes */}
          {ENC_POS.map((p, i) => {
            const a = encAct[i];
            const reveal = showEnc;
            const intensity = reveal ? Math.min(1, Math.abs(a)) : 0;
            return (
              <g key={`enc-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={13}
                  fill={reveal
                    ? `color-mix(in srgb, var(--hue-sky, #5ecbff) ${15 + intensity * 55}%, var(--surface))`
                    : 'var(--surface)'}
                  stroke="var(--hue-sky, #5ecbff)"
                  strokeWidth="1.6"
                />
                {reveal ? (
                  <text x={p.x} y={p.y + 3} fontSize="8.5" fill="var(--text-main)" fontFamily="var(--mono, monospace)" textAnchor="middle" fontWeight="700">
                    {snap(a, 2)}
                  </text>
                ) : (
                  <text x={p.x} y={p.y + 3} fontSize="9" fill="var(--text-dim)" fontFamily="var(--serif, serif)" fontStyle="italic" textAnchor="middle">
                    e{i + 1}
                  </text>
                )}
              </g>
            );
          })}

          {/* Latent nodes */}
          {Z_POS.map((p, i) => {
            const a = zAct[i];
            const reveal = showZ;
            const intensity = reveal ? Math.min(1, Math.abs(a)) : 0;
            return (
              <g key={`z-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={16}
                  fill={reveal
                    ? `color-mix(in srgb, var(--hue-mint, #6fe3a8) ${20 + intensity * 60}%, var(--surface))`
                    : 'var(--surface)'}
                  stroke="var(--hue-mint, #6fe3a8)"
                  strokeWidth="2"
                />
                {reveal ? (
                  <text x={p.x} y={p.y + 3.5} fontSize="9.5" fill="var(--text-main)" fontFamily="var(--mono, monospace)" textAnchor="middle" fontWeight="700">
                    {snap(a, 2)}
                  </text>
                ) : (
                  <text x={p.x} y={p.y + 3.5} fontSize="10" fill="var(--hue-mint, #6fe3a8)" fontFamily="var(--serif, serif)" fontStyle="italic" textAnchor="middle">
                    z{i + 1}
                  </text>
                )}
              </g>
            );
          })}

          {/* Decoder nodes */}
          {DEC_POS.map((p, i) => {
            const a = decAct[i];
            const reveal = showDec;
            const intensity = reveal ? Math.min(1, Math.abs(a)) : 0;
            return (
              <g key={`dec-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={13}
                  fill={reveal
                    ? `color-mix(in srgb, var(--hue-sky, #5ecbff) ${15 + intensity * 55}%, var(--surface))`
                    : 'var(--surface)'}
                  stroke="var(--hue-sky, #5ecbff)"
                  strokeWidth="1.6"
                />
                {reveal ? (
                  <text x={p.x} y={p.y + 3} fontSize="8.5" fill="var(--text-main)" fontFamily="var(--mono, monospace)" textAnchor="middle" fontWeight="700">
                    {snap(a, 2)}
                  </text>
                ) : (
                  <text x={p.x} y={p.y + 3} fontSize="9" fill="var(--text-dim)" fontFamily="var(--serif, serif)" fontStyle="italic" textAnchor="middle">
                    d{i + 1}
                  </text>
                )}
              </g>
            );
          })}

          {/* Output column: small bars */}
          {(() => {
            const n = N_OUT;
            const stripX = COL_X[4];
            const stripTop = PAD_T;
            const stripBottom = H - PAD_B;
            const cellH = (stripBottom - stripTop) / (n - 1);
            return outBarHeights.map((v, i) => {
              const y = stripTop + i * cellH;
              const reveal = showOut;
              const clamped = Math.max(-1, Math.min(1, v));
              const barLen = reveal ? Math.abs(clamped) * 22 : 0;
              return (
                <g key={`out-${i}`}>
                  <line
                    x1={stripX - 22}
                    y1={y}
                    x2={stripX + 22}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth="0.4"
                  />
                  {reveal && (
                    <rect
                      x={clamped >= 0 ? stripX : stripX - barLen}
                      y={y - 4}
                      width={barLen}
                      height={8}
                      fill="var(--hue-pink, #ff66cc)"
                      opacity="0.85"
                      rx="1.5"
                    />
                  )}
                  <text
                    x={stripX + 28}
                    y={y + 3}
                    fontSize="8"
                    fill="var(--text-dim)"
                    fontFamily="var(--mono, monospace)"
                    textAnchor="start"
                  >
                    x'{i + 1}
                  </text>
                </g>
              );
            });
          })()}
        </svg>
      </div>

      <div className="mlviz-toggles">
        <button
          type="button"
          className={`mlviz-toggle ${showWeights ? 'is-on' : ''}`}
          onClick={() => setShowWeights((v) => !v)}
        >
          <span className="mlviz-toggle-dot" />
          <Network size={11} />
          <span>Edge weights</span>
        </button>
      </div>

      <div className="mlviz-readout">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem 0.7rem' }}>
          {inputs.map((v, i) => (
            <label className="mlviz-slider" key={`s-${i}`} style={{ minWidth: 0 }}>
              <span className="mlviz-slider-label">x{i + 1}</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={v}
                onChange={(e) => handleInput(i, parseFloat(e.target.value))}
                disabled={isRunning}
              />
              <span className="mlviz-slider-val">{snap(v, 2)}</span>
            </label>
          ))}
        </div>

        {showOut && (
          <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.45rem' }}>
            <div className="mlviz-row" style={{ gap: '0.6rem' }}>
              <span className="mlviz-tag" style={{ color: 'var(--hue-mint, #6fe3a8)' }}>z</span>
              <span className="mlviz-val">[{zAct.map((v) => snap(v, 2)).join(', ')}]</span>
              <span className="mlviz-sub">2-d code</span>
            </div>
            <ReconstructionChart inputs={inputs} outputs={outAct} />
            <div className="mlviz-row" style={{ gap: '0.6rem' }}>
              <span className="mlviz-tag">MSE</span>
              <span className="mlviz-val" style={{ color: mse < 0.15 ? 'var(--easy, #28c244)' : mse < 0.4 ? 'var(--warning, #f4b740)' : 'var(--hard, #ef476f)' }}>
                {snap(mse, 4)}
              </span>
              <span className="mlviz-sub">reconstruction loss · lower is better</span>
            </div>
          </div>
        )}

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={runForward}
            disabled={isRunning}
          >
            <Play size={13} />
            <span>Forward pass</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={randomize}
            disabled={isRunning}
          >
            <Shuffle size={13} />
            <span>Random input</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { reset(); setInputs(DEFAULT_INPUTS); }}
            disabled={isRunning}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          {phase === 0 && 'set inputs, then run forward pass · 8 → 5 → 2 → 5 → 8'}
          {phase === 1 && 'phase 1 — input · W1 + b1'}
          {phase === 2 && 'phase 2 — encoder activations (tanh)'}
          {phase === 3 && 'phase 3 — enc · W2 + b2 → latent code'}
          {phase === 4 && 'phase 4 — bottleneck z'}
          {phase === 5 && 'phase 5 — z · W3 + b3'}
          {phase === 6 && 'phase 6 — decoder activations (tanh)'}
          {phase === 7 && 'phase 7 — dec · W4 + b4 → output'}
          {phase === 8 && 'phase 8 — reconstruction x′ ready'}
        </div>
      </div>
    </div>
  );
}

function ReconstructionChart({ inputs, outputs }) {
  const W2 = 320;
  const H2 = 90;
  const PAD = 18;
  const n = inputs.length;
  const innerW = W2 - PAD * 2;
  const innerH = H2 - PAD * 2;
  const groupW = innerW / n;
  const barW = groupW * 0.35;
  const mid = PAD + innerH / 2;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.2rem' }}>
      <svg viewBox={`0 0 ${W2} ${H2}`} style={{ width: '100%', maxWidth: 360, height: 'auto' }}>
        <line x1={PAD} y1={mid} x2={W2 - PAD} y2={mid} stroke="var(--border)" strokeWidth="0.6" />
        <text x={PAD - 2} y={PAD + 4} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="end">+1</text>
        <text x={PAD - 2} y={H2 - PAD + 4} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="end">-1</text>
        {inputs.map((v, i) => {
          const cx = PAD + groupW * (i + 0.5);
          const vi = Math.max(-1, Math.min(1, v));
          const vo = Math.max(-1, Math.min(1, outputs[i]));
          const hi = (Math.abs(vi) * innerH) / 2;
          const ho = (Math.abs(vo) * innerH) / 2;
          return (
            <g key={`rc-${i}`}>
              <rect
                x={cx - barW - 1}
                y={vi >= 0 ? mid - hi : mid}
                width={barW}
                height={Math.max(0.5, hi)}
                fill="var(--accent)"
                opacity="0.7"
                rx="1"
              />
              <rect
                x={cx + 1}
                y={vo >= 0 ? mid - ho : mid}
                width={barW}
                height={Math.max(0.5, ho)}
                fill="var(--hue-pink, #ff66cc)"
                opacity="0.75"
                rx="1"
              />
              <text
                x={cx}
                y={H2 - 4}
                fontSize="7"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
        <g>
          <rect x={W2 - PAD - 86} y={PAD - 12} width={8} height={6} fill="var(--accent)" opacity="0.85" />
          <text x={W2 - PAD - 74} y={PAD - 7} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">input x</text>
          <rect x={W2 - PAD - 38} y={PAD - 12} width={8} height={6} fill="var(--hue-pink, #ff66cc)" opacity="0.85" />
          <text x={W2 - PAD - 26} y={PAD - 7} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">output x'</text>
        </g>
      </svg>
    </div>
  );
}
