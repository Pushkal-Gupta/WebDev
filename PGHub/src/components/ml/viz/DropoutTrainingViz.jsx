import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, ToggleLeft, ToggleRight, Play } from 'lucide-react';
import './MLViz.css';

const W = 460;
const H = 320;
const PAD_L = 60;
const PAD_R = 60;
const PAD_T = 40;
const PAD_B = 40;

const N_IN = 8;
const N_OUT = 8;

// deterministic weight matrix W: N_OUT x N_IN, values in [-1, 1]
const WEIGHTS = (() => {
  const m = [];
  // pseudo-random but stable
  let seed = 1337;
  const r = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let j = 0; j < N_OUT; j++) {
    const row = [];
    for (let i = 0; i < N_IN; i++) {
      row.push((r() * 2 - 1) * 0.9);
    }
    m.push(row);
  }
  return m;
})();

// stable inputs
const INPUTS = (() => {
  let seed = 7777;
  const r = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: N_IN }, () => r() * 0.8 + 0.2);
})();

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function relu(v) { return v > 0 ? v : 0; }

function inputPos(i) {
  const x = PAD_L;
  const span = H - PAD_T - PAD_B;
  const y = PAD_T + (span * i) / (N_IN - 1);
  return { x, y };
}

function outputPos(i) {
  const x = W - PAD_R;
  const span = H - PAD_T - PAD_B;
  const y = PAD_T + (span * i) / (N_OUT - 1);
  return { x, y };
}

function generateMask(p) {
  // mask[i] = 1 means KEEP, 0 means DROP
  return Array.from({ length: N_IN }, () => (Math.random() < p ? 0 : 1));
}

function edgeColor(w) {
  return w >= 0 ? 'var(--hue-sky, #5ecbff)' : 'var(--hue-pink, #ff66cc)';
}

function edgeWidth(w) {
  return 0.5 + Math.min(1, Math.abs(w)) * 1.6;
}

export default function DropoutTrainingViz() {
  const [p, setP] = useState(0.5);
  const [mode, setMode] = useState('training'); // 'training' | 'inference'
  const [mask, setMask] = useState(() => generateMask(0.5));
  const [pulseT, setPulseT] = useState(0);
  const [running, setRunning] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  // Re-sample mask when p changes or user clicks button
  const resampleMask = useCallback(() => {
    setMask(generateMask(p));
  }, [p]);

  useEffect(() => {
    setMask(generateMask(p));
  }, [p]);

  const triggerPulse = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRunning(true);
    startRef.current = performance.now();
    const PULSE_MS = 1200;
    const tick = (now) => {
      const t = (now - startRef.current) / PULSE_MS;
      if (t >= 1) {
        setPulseT(1);
        setRunning(false);
        rafRef.current = null;
        return;
      }
      setPulseT(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // auto-pulse when mask or mode changes
  useEffect(() => {
    triggerPulse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, mode]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // active mask depends on mode
  // - training: random mask
  // - inference: all-ones
  const effectiveMask = useMemo(() => {
    if (mode === 'inference') return Array(N_IN).fill(1);
    return mask;
  }, [mode, mask]);

  const keepProb = 1 - p;
  // rescaling: training divides by (1-p), inference uses raw
  const scale = mode === 'training' && keepProb > 0 ? 1 / keepProb : 1;

  // inputs after dropout + rescale
  const droppedInputs = useMemo(() => {
    return INPUTS.map((x, i) => x * effectiveMask[i] * (mode === 'training' ? scale : 1));
  }, [effectiveMask, mode, scale]);

  // outputs = relu(W @ droppedInputs)
  const outputs = useMemo(() => {
    return WEIGHTS.map((row) => {
      let s = 0;
      for (let i = 0; i < N_IN; i++) s += row[i] * droppedInputs[i];
      return relu(s);
    });
  }, [droppedInputs]);

  // For comparison: full inputs (no drop) outputs
  const fullOutputs = useMemo(() => {
    return WEIGHTS.map((row) => {
      let s = 0;
      for (let i = 0; i < N_IN; i++) s += row[i] * INPUTS[i];
      return relu(s);
    });
  }, []);

  const droppedCount = useMemo(() => effectiveMask.filter((m) => m === 0).length, [effectiveMask]);
  const keptCount = N_IN - droppedCount;
  // effective number of active weights = kept inputs * outputs
  const totalWeights = N_IN * N_OUT;
  const activeWeights = keptCount * N_OUT;

  // expected output magnitude
  // E[||y||] for training vs inference, computed across outputs
  const trainMagnitude = useMemo(() => {
    return Math.sqrt(outputs.reduce((a, v) => a + v * v, 0) / N_OUT);
  }, [outputs]);
  const inferMagnitude = useMemo(() => {
    return Math.sqrt(fullOutputs.reduce((a, v) => a + v * v, 0) / N_OUT);
  }, [fullOutputs]);

  // Build edges
  const edges = useMemo(() => {
    const out = [];
    for (let j = 0; j < N_OUT; j++) {
      for (let i = 0; i < N_IN; i++) {
        const w = WEIGHTS[j][i];
        const a = inputPos(i);
        const b = outputPos(j);
        const active = effectiveMask[i] === 1;
        out.push({ key: `e${j}-${i}`, a, b, w, active, i, j });
      }
    }
    return out;
  }, [effectiveMask]);

  // Pulse position along each active edge
  const pulseEdges = running ? edges.filter((e) => e.active) : [];

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '820px' }}>
          <defs>
            <filter id="dropout-node-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
            <filter id="dropout-pulse-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="1.8" />
            </filter>
          </defs>
          {/* phase label top-left */}
          <text
            x={10}
            y={18}
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            fill={mode === 'training' ? 'var(--hue-pink, #ff66cc)' : 'var(--hue-sky, #5ecbff)'}
            letterSpacing="0.18em"
            fontWeight="700"
          >
            {mode === 'training' ? 'TRAINING' : 'INFERENCE'}
          </text>
          <text
            x={W - 10}
            y={18}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.1em"
            textAnchor="end"
          >
            {mode === 'training'
              ? `mask drop p=${snap(p, 2)}  ·  scale ×${snap(scale, 2)}`
              : 'all neurons active  ·  scale ×1.00'}
          </text>

          {/* column labels */}
          <text
            x={PAD_L}
            y={PAD_T - 18}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
            textAnchor="middle"
          >
            INPUT
          </text>
          <text
            x={W - PAD_R}
            y={PAD_T - 18}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
            textAnchor="middle"
          >
            OUTPUT
          </text>

          {/* edges */}
          <g>
            {edges.map((e) => (
              <line
                key={e.key}
                x1={e.a.x}
                y1={e.a.y}
                x2={e.b.x}
                y2={e.b.y}
                stroke={edgeColor(e.w)}
                strokeWidth={edgeWidth(e.w)}
                opacity={e.active ? 0.42 : 0.06}
                style={{ transition: 'opacity 0.35s ease' }}
              />
            ))}
          </g>

          {/* pulses */}
          {pulseEdges.map((e) => {
            const t = pulseT;
            const px = e.a.x + (e.b.x - e.a.x) * t;
            const py = e.a.y + (e.b.y - e.a.y) * t;
            return (
              <g key={`p${e.key}`}>
                <circle
                  cx={px}
                  cy={py}
                  r={4}
                  fill={edgeColor(e.w)}
                  filter="url(#dropout-pulse-glow)"
                  opacity={0.7}
                />
                <circle
                  cx={px}
                  cy={py}
                  r={2.4}
                  fill={edgeColor(e.w)}
                  opacity={0.9}
                />
              </g>
            );
          })}

          {/* input neurons */}
          {INPUTS.map((v, i) => {
            const pos = inputPos(i);
            const kept = effectiveMask[i] === 1;
            const radius = 9;
            const scaledV = v * (kept ? (mode === 'training' ? scale : 1) : 0);
            return (
              <g key={`in${i}`}>
                {kept && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 2}
                    fill="var(--accent)"
                    filter="url(#dropout-node-glow)"
                    opacity={0.4}
                    style={{ transition: 'opacity 0.35s ease' }}
                  />
                )}
                {kept && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 4}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="0.6"
                    opacity={0.35}
                  />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={kept ? 'var(--accent)' : 'var(--border)'}
                  opacity={kept ? 0.82 : 0.25}
                  stroke={kept ? 'var(--accent)' : 'var(--text-dim)'}
                  strokeWidth="0.8"
                  style={{ transition: 'all 0.35s ease' }}
                />
                {!kept && (
                  <g>
                    <line
                      x1={pos.x - 6}
                      y1={pos.y - 6}
                      x2={pos.x + 6}
                      y2={pos.y + 6}
                      stroke="var(--text-dim)"
                      strokeWidth="1.4"
                      opacity={0.55}
                    />
                    <line
                      x1={pos.x + 6}
                      y1={pos.y - 6}
                      x2={pos.x - 6}
                      y2={pos.y + 6}
                      stroke="var(--text-dim)"
                      strokeWidth="1.4"
                      opacity={0.55}
                    />
                  </g>
                )}
                <text
                  x={pos.x - radius - 6}
                  y={pos.y + 3}
                  fontSize="8.5"
                  fontFamily="var(--mono, monospace)"
                  fill={kept ? 'var(--text-main)' : 'var(--text-dim)'}
                  textAnchor="end"
                  opacity={kept ? 1 : 0.45}
                >
                  {snap(scaledV, 2)}
                </text>
              </g>
            );
          })}

          {/* output neurons */}
          {outputs.map((v, i) => {
            const pos = outputPos(i);
            const radius = 9;
            const active = v > 0;
            return (
              <g key={`out${i}`}>
                {active && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 2}
                    fill="var(--hue-sky, #5ecbff)"
                    filter="url(#dropout-node-glow)"
                    opacity={0.38}
                    style={{ transition: 'opacity 0.35s ease' }}
                  />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={active ? 'var(--hue-sky, #5ecbff)' : 'var(--surface)'}
                  opacity={active ? 0.78 : 0.6}
                  stroke="var(--hue-sky, #5ecbff)"
                  strokeWidth="0.8"
                  style={{ transition: 'all 0.35s ease' }}
                />
                <text
                  x={pos.x + radius + 6}
                  y={pos.y + 3}
                  fontSize="8.5"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-main)"
                  textAnchor="start"
                >
                  {snap(v, 2)}
                </text>
              </g>
            );
          })}

          {/* bottom caption */}
          <text
            x={10}
            y={H - 8}
            fontSize="9"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            fill="var(--text-dim)"
          >
            {mode === 'training'
              ? 'kept inputs are scaled by 1 / (1 − p); dropped inputs contribute 0.'
              : 'all inputs flow through full weight matrix at unit scale.'}
          </text>
        </svg>
      </div>

      <div className="mlviz-toggles" role="tablist" aria-label="Mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'training'}
          className={`mlviz-toggle${mode === 'training' ? ' is-on' : ''}`}
          style={{ '--toggle-color': 'var(--hue-pink, #ff66cc)' }}
          onClick={() => setMode('training')}
        >
          <span className="mlviz-toggle-dot" />
          <span>Training</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'inference'}
          className={`mlviz-toggle${mode === 'inference' ? ' is-on' : ''}`}
          style={{ '--toggle-color': 'var(--hue-sky, #5ecbff)' }}
          onClick={() => setMode('inference')}
        >
          <span className="mlviz-toggle-dot" />
          <span>Inference</span>
        </button>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">dropout p</span>
            <input
              type="range"
              min="0"
              max="0.7"
              step="0.05"
              value={p}
              onChange={(e) => setP(parseFloat(e.target.value))}
              disabled={mode === 'inference'}
            />
            <span className="mlviz-slider-val">{snap(p, 2)}</span>
          </label>
        </div>

        <div className="mlviz-statcol">
          <div className="mlviz-statrow">
            <div className="mlviz-statcard mlviz-statcard-pink">
              <span className="mlviz-statcard-label">dropped / {N_IN}</span>
              <span className="mlviz-statcard-val">{droppedCount}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-sky">
              <span className="mlviz-statcard-label">active weights</span>
              <span className="mlviz-statcard-val">{activeWeights}/{totalWeights}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-accent">
              <span className="mlviz-statcard-label">scale</span>
              <span className="mlviz-statcard-val">×{snap(scale, 3)}</span>
            </div>
          </div>
          <div className="mlviz-statrow">
            <div className="mlviz-statcard mlviz-statcard-pink">
              <span className="mlviz-statcard-label">‖y‖ training</span>
              <span className="mlviz-statcard-val">{snap(trainMagnitude, 3)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-sky">
              <span className="mlviz-statcard-label">‖y‖ inference</span>
              <span className="mlviz-statcard-val">{snap(inferMagnitude, 3)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-dim">
              <span className="mlviz-statcard-label">ratio (→ 1.0)</span>
              <span className="mlviz-statcard-val">{snap(trainMagnitude / Math.max(1e-6, inferMagnitude), 2)}</span>
            </div>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={resampleMask}
            disabled={mode === 'inference'}
          >
            <RefreshCw size={13} />
            <span>Re-sample mask</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setMode((m) => (m === 'training' ? 'inference' : 'training'))}
          >
            {mode === 'training' ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
            <span>Toggle mode</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={triggerPulse}
            disabled={running}
          >
            <Play size={13} />
            <span>Pulse</span>
          </button>
        </div>

        <div className="mlviz-hint">
          drag p · re-sample to draw a new mask · toggle to compare training vs inference
        </div>
      </div>
    </div>
  );
}
