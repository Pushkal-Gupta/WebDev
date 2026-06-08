import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, ArrowDown, ArrowUp, AlertTriangle, Flame } from 'lucide-react';
import './MLViz.css';

const NUM_LAYERS = 20;
const W = 560;
const H = 520;

// Vertical layout. Each layer is a horizontal band; left half shows
// forward activation magnitude, right half shows backward gradient magnitude.
const TOP_Y = 40;
const BOT_Y = 480;
const ROW_H = (BOT_Y - TOP_Y) / NUM_LAYERS;

const CENTER_X = W / 2;
const COL_GAP = 14;
const BAR_MAX = 170;            // max bar length in px (each side)
const FWD_X_RIGHT = CENTER_X - COL_GAP; // forward bars grow leftward from here
const BWD_X_LEFT = CENTER_X + COL_GAP;  // backward bars grow rightward from here

const VANISH_THRESHOLD = 1e-7;
const EXPLODE_THRESHOLD = 1e7;
const DISPLAY_FLOOR = 1e-40;
const DISPLAY_CEIL = 1e40;
const STEP_DELAY = 90;

const ACTIVATIONS = [
  { key: 'sigmoid', name: 'sigmoid' },
  { key: 'tanh', name: 'tanh' },
  { key: 'relu', name: 'ReLU' },
];

function clampDisplay(v) {
  if (!Number.isFinite(v)) return v;
  if (Math.abs(v) > DISPLAY_CEIL) return Math.sign(v) * DISPLAY_CEIL;
  if (Math.abs(v) < DISPLAY_FLOOR && v !== 0) return Math.sign(v) * DISPLAY_FLOOR;
  return v;
}

function formatMag(v) {
  if (!Number.isFinite(v)) return v > 0 ? '+Inf' : '-Inf';
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs < 1e-3 || abs >= 1e4) return v.toExponential(2);
  if (abs < 1) return v.toFixed(4);
  return v.toFixed(3);
}

// Forward activation: model a single representative neuron per layer.
// h_{l+1} = act(w * h_l). Use |w| ~ initScale as the effective weight magnitude,
// then squash with the activation. Returns magnitudes h[0..NUM_LAYERS].
function computeForward(initScale, activation) {
  const h = new Array(NUM_LAYERS + 1).fill(0);
  h[0] = 1.0; // unit input magnitude
  for (let i = 0; i < NUM_LAYERS; i++) {
    const z = initScale * h[i];
    let a;
    if (activation === 'sigmoid') {
      // sigmoid(z) saturates; with positive z grows toward 1.
      a = 1 / (1 + Math.exp(-z));
      // shift to magnitude-of-deviation around 0.5 to reflect activation magnitude
      // but we keep it as raw output for the bar chart.
    } else if (activation === 'tanh') {
      a = Math.tanh(z);
      // magnitude saturates at 1
    } else { // relu
      a = Math.max(0, z);
    }
    h[i + 1] = clampDisplay(a);
  }
  return h;
}

// Derivative of activation evaluated at the forward pre-activation.
// Used to compute per-layer gradient multiplier: local_grad = act'(z) * w.
function actDeriv(activation, z, a) {
  if (activation === 'sigmoid') {
    // sigmoid'(z) = sig(z) * (1 - sig(z)). a is sigmoid output already.
    return a * (1 - a);
  }
  if (activation === 'tanh') {
    return 1 - a * a;
  }
  // relu: 1 if z > 0 else 0
  return z > 0 ? 1 : 0;
}

// Backward gradient magnitude per layer. g[L] = 1 at output,
// g[l] = g[l+1] * |w| * |act'(z_l)|.
function computeBackward(initScale, activation, hFwd) {
  const g = new Array(NUM_LAYERS + 1).fill(0);
  g[NUM_LAYERS] = 1;
  for (let l = NUM_LAYERS - 1; l >= 0; l--) {
    const z = initScale * hFwd[l];
    const a = hFwd[l + 1];
    const d = actDeriv(activation, z, a);
    const mult = initScale * d;
    g[l] = clampDisplay(g[l + 1] * mult);
  }
  return g;
}

function gradStatus(v) {
  if (!Number.isFinite(v)) return 'explode';
  const abs = Math.abs(v);
  if (abs >= EXPLODE_THRESHOLD) return 'explode';
  if (abs <= VANISH_THRESHOLD) return 'vanish';
  return 'ok';
}

// Map raw magnitude (possibly tiny / huge) to a bar length in pixels.
// Uses log scaling so values from 1e-30 to 1e+30 all map into [0, BAR_MAX].
function barLengthFromMag(v) {
  if (!Number.isFinite(v)) return BAR_MAX;
  const abs = Math.abs(v);
  if (abs === 0) return 1;
  // log10 mapping: 0 -> 1.0 magnitude, span = 30 decades each side
  const log = Math.log10(abs);
  // map log in [-30, +30] to [0, BAR_MAX]
  const normalized = (log + 30) / 60;
  const clamped = Math.max(0.02, Math.min(1, normalized));
  return clamped * BAR_MAX;
}

// For forward activations (which are positive and typically in [0, ~initScale^L]),
// use a slightly different scale: values close to 1 -> long bar, values near 0 -> short.
function fwdBarLength(v) {
  if (!Number.isFinite(v)) return BAR_MAX;
  const abs = Math.abs(v);
  if (abs === 0) return 1;
  // For relu the magnitude can grow unbounded; for sigmoid/tanh it's bounded.
  // Use the same log scaling for consistency.
  const log = Math.log10(abs);
  const normalized = (log + 30) / 60;
  const clamped = Math.max(0.02, Math.min(1, normalized));
  return clamped * BAR_MAX;
}

function statusColor(status, fallback) {
  if (status === 'vanish') return 'var(--warning, #ffb547)';
  if (status === 'explode') return 'var(--hard, #ff5a5f)';
  return fallback;
}

export default function VanishingGradientViz() {
  const [initScale, setInitScale] = useState(1.0);
  const [activation, setActivation] = useState('tanh');
  const [phase, setPhase] = useState('idle'); // idle | forward | forward-done | backward | done
  const [fwdStep, setFwdStep] = useState(0);  // 0..NUM_LAYERS (layers revealed in forward direction)
  const [bwdStep, setBwdStep] = useState(0);  // 0..NUM_LAYERS (layers revealed from output downward)
  const timerRef = useRef(null);

  const hFwd = useMemo(() => computeForward(initScale, activation), [initScale, activation]);
  const gBwd = useMemo(() => computeBackward(initScale, activation, hFwd), [initScale, activation, hFwd]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => () => clearTimer(), []);

  // Reset playback whenever inputs change while idle / done.
  useEffect(() => {
    if (phase === 'idle' || phase === 'done' || phase === 'forward-done') {
      setFwdStep(0);
      setBwdStep(0);
      setPhase('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initScale, activation]);

  const handleReset = useCallback(() => {
    clearTimer();
    setPhase('idle');
    setFwdStep(0);
    setBwdStep(0);
  }, []);

  const handleRunForward = useCallback(() => {
    clearTimer();
    setPhase('forward');
    setFwdStep(0);
    setBwdStep(0);
    let s = 0;
    const tick = () => {
      s += 1;
      setFwdStep(s);
      if (s >= NUM_LAYERS) {
        setPhase('forward-done');
        return;
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, 80);
  }, []);

  const handleRunBackward = useCallback(() => {
    clearTimer();
    // ensure forward is fully shown before backward animation starts
    setFwdStep(NUM_LAYERS);
    setPhase('backward');
    setBwdStep(0);
    let s = 0;
    const tick = () => {
      s += 1;
      setBwdStep(s);
      if (s >= NUM_LAYERS) {
        setPhase('done');
        return;
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, 80);
  }, []);

  // Which forward layers have been revealed?
  const isFwdRevealed = (i) => i <= fwdStep;
  // Which backward layers have been revealed? counted from top (output side = layer NUM_LAYERS-1).
  const isBwdRevealed = (i) => i >= NUM_LAYERS - bwdStep;

  // Readouts.
  const inputGrad = gBwd[0];
  const inputGradStatus = gradStatus(inputGrad);

  // Find max layer index (from input side, 0 = closest to input) where gradient is "meaningful" (above vanish threshold and finite).
  // We report this as a "depth" — how deep can backprop still drive learning?
  let meaningfulDepth = 0;
  for (let i = 0; i < NUM_LAYERS; i++) {
    if (gradStatus(gBwd[i]) === 'ok') {
      meaningfulDepth = NUM_LAYERS - i; // count layers from input where it's still meaningful
      break;
    }
  }
  // If none meaningful at input, but some intermediate layer is fine, find the highest l where ok.
  if (meaningfulDepth === 0) {
    for (let i = NUM_LAYERS - 1; i >= 0; i--) {
      if (gradStatus(gBwd[i]) === 'ok') {
        meaningfulDepth = NUM_LAYERS - i;
        break;
      }
    }
  }

  const finalInputStatus = gradStatus(inputGrad);
  const showStatusBanner = phase === 'done';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ maxWidth: 620, aspectRatio: `${W} / ${H}` }}
        >
          <defs>
            <linearGradient id="vg-fwd" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="vg-bwd" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-mint, #7be0c0)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--hue-mint, #7be0c0)" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="vg-vanish" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--warning, #ffb547)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--warning, #ffb547)" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="vg-explode" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hard, #ff5a5f)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--hard, #ff5a5f)" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Column headings */}
          <text
            x={CENTER_X - COL_GAP - BAR_MAX / 2}
            y={22}
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            fontWeight="700"
            fill="var(--text-main)"
          >
            forward activation
          </text>
          <text
            x={CENTER_X + COL_GAP + BAR_MAX / 2}
            y={22}
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            fontWeight="700"
            fill="var(--text-main)"
          >
            backward gradient
          </text>
          <text
            x={CENTER_X - COL_GAP - BAR_MAX / 2}
            y={35}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.08em"
          >
            |h_l| log scale
          </text>
          <text
            x={CENTER_X + COL_GAP + BAR_MAX / 2}
            y={35}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.08em"
          >
            |∂L/∂h_l| log scale
          </text>

          {/* Center divider */}
          <line
            x1={CENTER_X}
            y1={TOP_Y - 4}
            x2={CENTER_X}
            y2={BOT_Y + 6}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Layers — top is OUTPUT (layer 20), bottom is INPUT (layer 1). */}
          {Array.from({ length: NUM_LAYERS }).map((_, rowIdx) => {
            // rowIdx 0 = top of SVG = output side. layerIdx counts from input.
            const layerIdx = NUM_LAYERS - 1 - rowIdx;
            const yTop = TOP_Y + rowIdx * ROW_H;
            const yCenter = yTop + ROW_H / 2;
            const barH = Math.max(4, ROW_H - 6);

            const fwdMag = hFwd[layerIdx + 1];
            const bwdMag = gBwd[layerIdx];
            const fwdLen = fwdBarLength(fwdMag);
            const bwdLen = barLengthFromMag(bwdMag);

            const fwdShown = isFwdRevealed(layerIdx + 1);
            const bwdShown = isBwdRevealed(layerIdx);

            const bwdStat = gradStatus(bwdMag);
            const fwdStat = gradStatus(fwdMag);

            const fwdFill =
              fwdStat === 'vanish' ? 'url(#vg-vanish)' :
              fwdStat === 'explode' ? 'url(#vg-explode)' :
              'url(#vg-fwd)';
            const bwdFill =
              bwdStat === 'vanish' ? 'url(#vg-vanish)' :
              bwdStat === 'explode' ? 'url(#vg-explode)' :
              'url(#vg-bwd)';

            return (
              <g key={`row-${layerIdx}`}>
                {/* row guideline */}
                <line
                  x1={CENTER_X - COL_GAP - BAR_MAX}
                  y1={yCenter}
                  x2={CENTER_X + COL_GAP + BAR_MAX}
                  y2={yCenter}
                  stroke="var(--border)"
                  strokeWidth="0.5"
                  opacity="0.35"
                />

                {/* layer label in the center divider */}
                <text
                  x={CENTER_X}
                  y={yCenter + 3}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                  fill="var(--text-dim)"
                >
                  L{layerIdx + 1}
                </text>

                {/* forward bar (grows leftward) */}
                <rect
                  x={FWD_X_RIGHT - fwdLen}
                  y={yCenter - barH / 2}
                  width={fwdLen}
                  height={barH}
                  rx="1.5"
                  fill={fwdFill}
                  opacity={fwdShown ? 1 : 0.12}
                />
                {/* forward magnitude readout */}
                {fwdShown && (
                  <text
                    x={CENTER_X - COL_GAP - BAR_MAX - 4}
                    y={yCenter + 3}
                    textAnchor="end"
                    fontSize="8"
                    fontFamily="var(--mono, monospace)"
                    fill={statusColor(fwdStat, 'var(--text-dim)')}
                  >
                    {formatMag(fwdMag)}
                  </text>
                )}

                {/* backward bar (grows rightward) */}
                <rect
                  x={BWD_X_LEFT}
                  y={yCenter - barH / 2}
                  width={bwdLen}
                  height={barH}
                  rx="1.5"
                  fill={bwdFill}
                  opacity={bwdShown ? 1 : 0.12}
                />
                {/* backward magnitude readout */}
                {bwdShown && (
                  <text
                    x={CENTER_X + COL_GAP + BAR_MAX + 4}
                    y={yCenter + 3}
                    fontSize="8"
                    fontFamily="var(--mono, monospace)"
                    fill={statusColor(bwdStat, 'var(--text-dim)')}
                  >
                    {formatMag(bwdMag)}
                  </text>
                )}

                {/* vanish / explode flag marker */}
                {bwdShown && bwdStat === 'vanish' && (
                  <circle
                    cx={CENTER_X + COL_GAP + BAR_MAX + 32}
                    cy={yCenter}
                    r="2.2"
                    fill="var(--warning, #ffb547)"
                  />
                )}
                {bwdShown && bwdStat === 'explode' && (
                  <circle
                    cx={CENTER_X + COL_GAP + BAR_MAX + 32}
                    cy={yCenter}
                    r="2.2"
                    fill="var(--hard, #ff5a5f)"
                  />
                )}
              </g>
            );
          })}

          {/* Input / output side captions */}
          <text
            x={10}
            y={TOP_Y - 8}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fontWeight="700"
            fill="var(--text-dim)"
            letterSpacing="0.1em"
          >
            OUTPUT (L20)
          </text>
          <text
            x={10}
            y={BOT_Y + 14}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fontWeight="700"
            fill="var(--text-dim)"
            letterSpacing="0.1em"
          >
            INPUT (L1)
          </text>

          {/* Phase indicator */}
          <text
            x={W - 10}
            y={TOP_Y - 8}
            textAnchor="end"
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.12em"
            fill={
              phase === 'forward' ? 'var(--accent)' :
              phase === 'backward' ? 'var(--hue-mint, #7be0c0)' :
              phase === 'done' || phase === 'forward-done' ? 'var(--text-main)' :
              'var(--text-dim)'
            }
          >
            {phase === 'forward' ? `forward ${fwdStep}/${NUM_LAYERS}` :
             phase === 'forward-done' ? 'forward complete' :
             phase === 'backward' ? `backward ${bwdStep}/${NUM_LAYERS}` :
             phase === 'done' ? 'complete' :
             'idle'}
          </text>

          {/* Threshold legend */}
          <text
            x={W - 10}
            y={BOT_Y + 14}
            textAnchor="end"
            fontSize="8"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
          >
            vanish &lt; 1e-7 · explode &gt; 1e+7
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>∂L/∂x</span>
          <span
            className="mlviz-val"
            style={{ color: statusColor(inputGradStatus, 'var(--text-main)') }}
          >
            {formatMag(inputGrad)}
          </span>
          <span className="mlviz-sub">gradient at the input layer</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-mint, #7be0c0)' }}>depth</span>
          <span className="mlviz-val">{meaningfulDepth}</span>
          <span className="mlviz-sub">layers from output with meaningful gradient</span>
        </div>

        {showStatusBanner && finalInputStatus === 'vanish' && (
          <div className="mlviz-row" style={{ color: 'var(--warning, #ffb547)' }}>
            <AlertTriangle size={13} />
            <span style={{ fontWeight: 700 }}>VANISHED</span>
            <span className="mlviz-sub" style={{ color: 'var(--warning, #ffb547)' }}>
              input-side gradient fell below 1e-7 — early layers stop learning
            </span>
          </div>
        )}
        {showStatusBanner && finalInputStatus === 'explode' && (
          <div className="mlviz-row" style={{ color: 'var(--hard, #ff5a5f)' }}>
            <Flame size={13} />
            <span style={{ fontWeight: 700 }}>EXPLODED</span>
            <span className="mlviz-sub" style={{ color: 'var(--hard, #ff5a5f)' }}>
              gradient grew past 1e+7 — weights blow up, training diverges
            </span>
          </div>
        )}

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">init scale</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={initScale}
              onChange={(e) => setInitScale(parseFloat(e.target.value))}
              disabled={phase === 'forward' || phase === 'backward'}
            />
            <span className="mlviz-slider-val">{initScale.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-toggles" role="radiogroup" aria-label="activation">
          {ACTIVATIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              role="radio"
              aria-checked={activation === a.key}
              className={`mlviz-toggle${activation === a.key ? ' is-on' : ''}`}
              onClick={() => setActivation(a.key)}
              disabled={phase === 'forward' || phase === 'backward'}
            >
              <span className="mlviz-toggle-dot" />
              <span>{a.name}</span>
            </button>
          ))}
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleRunForward}
            disabled={phase === 'forward' || phase === 'backward'}
          >
            <ArrowDown size={13} />
            <span>Run forward</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRunBackward}
            disabled={phase === 'forward' || phase === 'backward'}
          >
            <ArrowUp size={13} />
            <span>Run backward</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={phase === 'forward' || phase === 'backward'}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          sigmoid + small init &rarr; gradient vanishes through the stack. ReLU + large init &rarr; activations and
          gradients explode. tanh + scale near 1 stays alive longest — that is the classic motivation for
          Xavier / He initialization and normalization layers.
        </div>
      </div>
    </div>
  );
}
