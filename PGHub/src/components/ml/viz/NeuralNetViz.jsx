import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import './MLViz.css';

// Vertical feedforward net: layers stack TOP -> BOTTOM (input layer at the top,
// output at the bottom). Neurons within a layer fan out as a horizontal row;
// weights connect downward. Portrait viewBox (taller than wide).
const W = 420;
const H = 460;
const PAD_L = 46;
const PAD_R = 46;
const PAD_T = 40;
const PAD_B = 36;

const N_IN = 3;
const N_HID = 4;
const N_OUT = 2;

// Row Y for each layer (input -> hidden -> output), evenly spaced down the column.
const ROW_Y = [PAD_T, H / 2, H - PAD_B];

// Hardcoded deterministic weights & biases.
// W1: hidden x input  (4 x 3)
const W1 = [
  [ 0.8, -0.5,  0.6],
  [-0.4,  0.9,  0.3],
  [ 0.7,  0.2, -0.8],
  [-0.6, -0.3,  0.5],
];
const B1 = [0.1, -0.2, 0.0, 0.15];

// W2: output x hidden  (2 x 4)
const W2 = [
  [ 0.6, -0.5,  0.7, -0.3],
  [-0.4,  0.8, -0.6,  0.5],
];
const B2 = [0.05, -0.1];

const DEFAULT_INPUTS = [0.5, -0.3, 0.8];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function relu(v) { return v > 0 ? v : 0; }

function softmax(vs) {
  const m = Math.max(...vs);
  const ex = vs.map((v) => Math.exp(v - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
}

function nodePos(layer, idx, n) {
  const y = ROW_Y[layer];
  const span = W - PAD_L - PAD_R;
  const x = n === 1 ? PAD_L + span / 2 : PAD_L + (span * idx) / (n - 1);
  return { x, y };
}

const IN_POS = Array.from({ length: N_IN }, (_, i) => nodePos(0, i, N_IN));
const HID_POS = Array.from({ length: N_HID }, (_, i) => nodePos(1, i, N_HID));
const OUT_POS = Array.from({ length: N_OUT }, (_, i) => nodePos(2, i, N_OUT));

// Phases of the forward pass animation.
// 0 = idle (nothing computed yet)
// 1 = input -> hidden edges pulsing
// 2 = hidden activations visible (post-ReLU)
// 3 = hidden -> output edges pulsing
// 4 = output softmax visible
const PHASE_DURATIONS = [0, 900, 600, 900, 0];

function edgeColor(w) {
  // positive => accent (sky); negative => pink
  if (w >= 0) return 'var(--hue-sky, #5ecbff)';
  return 'var(--hue-pink, #ff66cc)';
}

function edgeWidth(w) {
  const a = Math.min(1, Math.abs(w));
  return 0.6 + a * 2.2;
}

function edgeOpacity(w, dim) {
  const a = Math.min(1, Math.abs(w));
  const base = 0.25 + a * 0.55;
  return dim ? base * 0.35 : base;
}

export default function NeuralNetViz() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [phase, setPhase] = useState(0);
  const [pulseT, setPulseT] = useState(0);
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

  const { hiddenAct, outputLogits, outputProbs } = useMemo(() => {
    const hPre = B1.map((b, i) =>
      b + W1[i][0] * inputs[0] + W1[i][1] * inputs[1] + W1[i][2] * inputs[2]
    );
    const hAct = hPre.map(relu);
    const oLog = B2.map((b, i) =>
      b + W2[i][0] * hAct[0] + W2[i][1] * hAct[1] + W2[i][2] * hAct[2] + W2[i][3] * hAct[3]
    );
    const oProb = softmax(oLog);
    return { hiddenPre: hPre, hiddenAct: hAct, outputLogits: oLog, outputProbs: oProb };
  }, [inputs]);

  // Animate pulse traversal during phases 1 & 3. Reset pulseT at render-phase
  // when leaving an animating phase to avoid setState-in-effect cascade.
  const isAnimatingPhase = phase === 1 || phase === 3;
  const [lastPhase, setLastPhase] = useState(phase);
  if (phase !== lastPhase) {
    setLastPhase(phase);
    if (!isAnimatingPhase) setPulseT(0);
  }
  useEffect(() => {
    if (!isAnimatingPhase) return;
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
  }, [phase, isAnimatingPhase]);

  const runForward = useCallback(() => {
    clearTimers();
    runningRef.current = true;
    setPhase(1);
    const t1 = setTimeout(() => setPhase(2), PHASE_DURATIONS[1]);
    const t2 = setTimeout(() => setPhase(3), PHASE_DURATIONS[1] + PHASE_DURATIONS[2]);
    const t3 = setTimeout(() => {
      setPhase(4);
      runningRef.current = false;
    }, PHASE_DURATIONS[1] + PHASE_DURATIONS[2] + PHASE_DURATIONS[3]);
    timeoutsRef.current = [t1, t2, t3];
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    runningRef.current = false;
    setPhase(0);
    setPulseT(0);
  }, [clearTimers]);

  const handleInput = useCallback((i, v) => {
    reset();
    setInputs((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }, [reset]);

  const isRunning = phase > 0 && phase < 4;
  const showHidden = phase >= 2;
  const showOutput = phase >= 4;

  // Node fill intensity for hidden layer (post-ReLU normalized) and outputs (softmax probabilities).
  const maxHid = Math.max(0.001, ...hiddenAct);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-portrait" style={{ '--mlviz-portrait-ar': `${W} / ${H}` }}>
          <defs>
            <radialGradient id="nn-pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
              <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <filter id="nn-nodeglow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3.4" />
            </filter>
            <filter id="nn-edgeglow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
          </defs>

          {/* layer labels — one per row, sitting in the left gutter of each layer */}
          <text x={PAD_L - 24} y={ROW_Y[0] - 22} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="start" letterSpacing="0.14em">
            INPUT
          </text>
          <text x={PAD_L - 24} y={ROW_Y[1] - 30} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="start" letterSpacing="0.14em">
            HIDDEN · ReLU
          </text>
          <text x={PAD_L - 24} y={ROW_Y[2] + 36} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="start" letterSpacing="0.14em">
            OUTPUT · softmax
          </text>

          {/* Input -> hidden edges */}
          {HID_POS.map((hp, hi) =>
            IN_POS.map((ip, ii) => {
              const w = W1[hi][ii];
              const dim = phase >= 2 && phase !== 1;
              const active = phase === 1;
              return (
                <g key={`e1-${hi}-${ii}`}>
                  {active && (
                    <line
                      x1={ip.x}
                      y1={ip.y}
                      x2={hp.x}
                      y2={hp.y}
                      stroke={edgeColor(w)}
                      strokeWidth={edgeWidth(w) + 1.6}
                      opacity={edgeOpacity(w, false) * 0.6}
                      strokeLinecap="round"
                      filter="url(#nn-edgeglow)"
                    />
                  )}
                  <line
                    x1={ip.x}
                    y1={ip.y}
                    x2={hp.x}
                    y2={hp.y}
                    stroke={edgeColor(w)}
                    strokeWidth={edgeWidth(w)}
                    opacity={edgeOpacity(w, dim)}
                    strokeLinecap="round"
                  />
                </g>
              );
            })
          )}

          {/* Hidden -> output edges */}
          {OUT_POS.map((op, oi) =>
            HID_POS.map((hp, hi) => {
              const w = W2[oi][hi];
              const dim = phase < 3 || phase === 4 ? phase < 3 : false;
              const active = phase === 3;
              return (
                <g key={`e2-${oi}-${hi}`}>
                  {active && (
                    <line
                      x1={hp.x}
                      y1={hp.y}
                      x2={op.x}
                      y2={op.y}
                      stroke={edgeColor(w)}
                      strokeWidth={edgeWidth(w) + 1.6}
                      opacity={edgeOpacity(w, false) * 0.6}
                      strokeLinecap="round"
                      filter="url(#nn-edgeglow)"
                    />
                  )}
                  <line
                    x1={hp.x}
                    y1={hp.y}
                    x2={op.x}
                    y2={op.y}
                    stroke={edgeColor(w)}
                    strokeWidth={edgeWidth(w)}
                    opacity={edgeOpacity(w, dim)}
                    strokeLinecap="round"
                  />
                </g>
              );
            })
          )}

          {/* Edge weight labels */}
          {HID_POS.map((hp, hi) =>
            IN_POS.map((ip, ii) => {
              const w = W1[hi][ii];
              const mx = ip.x + (hp.x - ip.x) * 0.42;
              const my = ip.y + (hp.y - ip.y) * 0.42;
              return (
                <text
                  key={`w1-${hi}-${ii}`}
                  x={mx}
                  y={my}
                  fontSize="7.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  opacity={phase === 0 || phase === 1 ? 0.85 : 0.35}
                >
                  {snap(w, 1)}
                </text>
              );
            })
          )}
          {OUT_POS.map((op, oi) =>
            HID_POS.map((hp, hi) => {
              const w = W2[oi][hi];
              const mx = hp.x + (op.x - hp.x) * 0.55;
              const my = hp.y + (op.y - hp.y) * 0.55;
              return (
                <text
                  key={`w2-${oi}-${hi}`}
                  x={mx}
                  y={my}
                  fontSize="7.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  opacity={phase === 3 ? 0.85 : 0.3}
                >
                  {snap(w, 1)}
                </text>
              );
            })
          )}

          {/* Pulses along input->hidden edges during phase 1 */}
          {phase === 1 && HID_POS.map((hp, hi) =>
            IN_POS.map((ip, ii) => {
              const px = ip.x + (hp.x - ip.x) * pulseT;
              const py = ip.y + (hp.y - ip.y) * pulseT;
              const w = W1[hi][ii];
              return (
                <g key={`p1-${hi}-${ii}`}>
                  <circle
                    cx={px}
                    cy={py}
                    r={6}
                    fill={edgeColor(w)}
                    opacity={Math.min(1, Math.abs(w) + 0.3) * 0.5}
                    filter="url(#nn-edgeglow)"
                  />
                  <circle
                    cx={px}
                    cy={py}
                    r={3.4}
                    fill={edgeColor(w)}
                    opacity={Math.min(1, Math.abs(w) + 0.3)}
                  />
                </g>
              );
            })
          )}

          {/* Pulses along hidden->output edges during phase 3 */}
          {phase === 3 && OUT_POS.map((op, oi) =>
            HID_POS.map((hp, hi) => {
              const px = hp.x + (op.x - hp.x) * pulseT;
              const py = hp.y + (op.y - hp.y) * pulseT;
              const w = W2[oi][hi];
              // dim contributions from dead ReLU units
              const liveScale = hiddenAct[hi] > 0 ? 1 : 0.25;
              return (
                <g key={`p3-${oi}-${hi}`}>
                  <circle
                    cx={px}
                    cy={py}
                    r={6}
                    fill={edgeColor(w)}
                    opacity={Math.min(1, (Math.abs(w) + 0.3) * liveScale) * 0.5}
                    filter="url(#nn-edgeglow)"
                  />
                  <circle
                    cx={px}
                    cy={py}
                    r={3.4}
                    fill={edgeColor(w)}
                    opacity={Math.min(1, (Math.abs(w) + 0.3) * liveScale)}
                  />
                </g>
              );
            })
          )}

          {/* Input nodes */}
          {IN_POS.map((p, i) => (
            <g key={`in-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={16}
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth="1.8"
              />
              <text
                x={p.x}
                y={p.y + 4}
                fontSize="11"
                fill="var(--accent)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
                fontWeight="700"
              >
                {snap(inputs[i], 2)}
              </text>
              <text
                x={p.x}
                y={p.y - 22}
                fontSize="10"
                fill="var(--text-dim)"
                fontFamily="var(--serif, serif)"
                fontStyle="italic"
                textAnchor="middle"
              >
                x{i + 1}
              </text>
            </g>
          ))}

          {/* Hidden nodes */}
          {HID_POS.map((p, i) => {
            const act = hiddenAct[i];
            const reveal = showHidden;
            const intensity = reveal ? Math.min(1, act / maxHid) : 0;
            const dead = reveal && act === 0;
            return (
              <g key={`hid-${i}`}>
                {reveal && !dead && intensity > 0 && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={18}
                    fill="var(--hue-sky, #5ecbff)"
                    opacity={0.18 + intensity * 0.4}
                    filter="url(#nn-nodeglow)"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={18}
                  fill={
                    reveal
                      ? (dead
                        ? 'var(--surface)'
                        : `color-mix(in srgb, var(--hue-sky, #5ecbff) ${20 + intensity * 50}%, var(--surface))`)
                      : 'var(--surface)'
                  }
                  stroke={dead ? 'var(--text-dim)' : 'var(--hue-sky, #5ecbff)'}
                  strokeWidth="1.8"
                  opacity={dead ? 0.65 : 1}
                />
                {reveal && (
                  <text
                    x={p.x}
                    y={p.y + 4}
                    fontSize="10.5"
                    fill={dead ? 'var(--text-dim)' : 'var(--text-main)'}
                    fontFamily="var(--mono, monospace)"
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {snap(act, 2)}
                  </text>
                )}
                {!reveal && (
                  <text
                    x={p.x}
                    y={p.y + 4}
                    fontSize="10"
                    fill="var(--text-dim)"
                    fontFamily="var(--serif, serif)"
                    fontStyle="italic"
                    textAnchor="middle"
                  >
                    h{i + 1}
                  </text>
                )}
              </g>
            );
          })}

          {/* Output nodes */}
          {OUT_POS.map((p, i) => {
            const prob = outputProbs[i];
            const reveal = showOutput;
            const color = i === 0 ? 'var(--hue-sky, #5ecbff)' : 'var(--hue-pink, #ff66cc)';
            return (
              <g key={`out-${i}`}>
                {reveal && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={18}
                    fill={color}
                    opacity={0.15 + prob * 0.5}
                    filter="url(#nn-nodeglow)"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={18}
                  fill={
                    reveal
                      ? `color-mix(in srgb, ${color} ${20 + prob * 60}%, var(--surface))`
                      : 'var(--surface)'
                  }
                  stroke={color}
                  strokeWidth="1.8"
                />
                {reveal ? (
                  <text
                    x={p.x}
                    y={p.y + 4}
                    fontSize="10.5"
                    fill="var(--text-main)"
                    fontFamily="var(--mono, monospace)"
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {snap(prob, 2)}
                  </text>
                ) : (
                  <text
                    x={p.x}
                    y={p.y + 4}
                    fontSize="10"
                    fill="var(--text-dim)"
                    fontFamily="var(--serif, serif)"
                    fontStyle="italic"
                    textAnchor="middle"
                  >
                    y{i + 1}
                  </text>
                )}
                <text
                  x={p.x}
                  y={p.y + 32}
                  fontSize="10"
                  fill={color}
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {i === 0 ? 'A' : 'B'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        {[0, 1, 2].map((i) => (
          <div className="mlviz-row mlviz-controls" key={`in-ctl-${i}`}>
            <label className="mlviz-slider">
              <span className="mlviz-slider-label">x{i + 1}</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={inputs[i]}
                onChange={(e) => handleInput(i, parseFloat(e.target.value))}
                disabled={isRunning}
              />
              <span className="mlviz-slider-val">{snap(inputs[i], 2)}</span>
            </label>
          </div>
        ))}

        {showOutput && (
          <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="mlviz-tag" style={{ color: 'var(--hue-sky, #5ecbff)', minWidth: '2.4rem' }}>A</span>
              <div style={{
                flex: 1,
                height: '10px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '999px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${outputProbs[0] * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, color-mix(in srgb, var(--hue-sky) 55%, var(--accent)), var(--hue-sky))',
                  transition: 'width 240ms ease',
                }} />
              </div>
              <span className="mlviz-val" style={{ minWidth: '3.2rem', textAlign: 'right' }}>{snap(outputProbs[0] * 100, 1)}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="mlviz-tag" style={{ color: 'var(--hue-pink, #ff66cc)', minWidth: '2.4rem' }}>B</span>
              <div style={{
                flex: 1,
                height: '10px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '999px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${outputProbs[1] * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, color-mix(in srgb, var(--hue-pink) 55%, var(--hue-violet)), var(--hue-pink))',
                  transition: 'width 240ms ease',
                }} />
              </div>
              <span className="mlviz-val" style={{ minWidth: '3.2rem', textAlign: 'right' }}>{snap(outputProbs[1] * 100, 1)}%</span>
            </div>
            <div className="mlviz-row" style={{ gap: '0.5rem', paddingTop: '0.2rem' }}>
              <span className="mlviz-sub">logits = [{snap(outputLogits[0], 2)}, {snap(outputLogits[1], 2)}]</span>
              <span className="mlviz-sub">predicts {outputProbs[0] >= outputProbs[1] ? 'A' : 'B'}</span>
            </div>
          </div>
        )}

        {showHidden && !showOutput && (
          <div className="mlviz-row mlviz-row-hi">
            <span className="mlviz-tag" style={{ color: 'var(--hue-sky, #5ecbff)' }}>h</span>
            <span className="mlviz-val">
              [{hiddenAct.map((v) => snap(v, 2)).join(', ')}]
            </span>
            <span className="mlviz-sub">post-ReLU</span>
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
            onClick={reset}
            disabled={phase === 0}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          {phase === 0 && 'set inputs, then run forward pass'}
          {phase === 1 && 'phase 1 — input · W1 + b1'}
          {phase === 2 && 'phase 2 — ReLU activations'}
          {phase === 3 && 'phase 3 — hidden · W2 + b2'}
          {phase === 4 && 'phase 4 — softmax probabilities'}
        </div>
      </div>
    </div>
  );
}
