import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, ArrowLeft, AlertTriangle, Flame } from 'lucide-react';
import './MLViz.css';

const W = 520;
const H = 360;

const VANISH_THRESHOLD = 1e-8;
const EXPLODE_THRESHOLD = 1e8;
const DISPLAY_FLOOR = 1e-30;
const DISPLAY_CEIL = 1e30;
const STEP_DELAY = 320;

const PLAIN_X = 110;
const RESID_X = 380;
const TOP_Y = 50;
const BOTTOM_Y = 318;
const BLOCK_W = 90;
const SKIP_OFFSET = 56;

function formatGrad(v) {
  if (!Number.isFinite(v)) return v > 0 ? '+Inf' : '-Inf';
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs < 1e-3 || abs >= 1e4) return v.toExponential(2);
  return v.toFixed(4);
}

function clampDisplay(v) {
  if (!Number.isFinite(v)) return v;
  if (Math.abs(v) > DISPLAY_CEIL) return Math.sign(v) * DISPLAY_CEIL;
  if (Math.abs(v) < DISPLAY_FLOOR && v !== 0) return Math.sign(v) * DISPLAY_FLOOR;
  return v;
}

function computeGradients(numLayers, mult) {
  const plain = new Array(numLayers + 1).fill(0);
  const resid = new Array(numLayers + 1).fill(0);
  plain[numLayers] = 1;
  resid[numLayers] = 1;
  for (let i = numLayers - 1; i >= 0; i--) {
    plain[i] = clampDisplay(plain[i + 1] * mult);
    // Residual: gradient = upstream * (1 + f'(x)) where f'(x) ~ mult
    // Identity path keeps the "1" alive; transform path scales by mult.
    // Sum keeps gradient near 1 instead of multiplying.
    resid[i] = clampDisplay(resid[i + 1] * (1 + mult) / 2);
    // Average the identity (1) and transform branch (mult). Stays near 1.
  }
  return { plain, resid };
}

function layerCenters(numLayers) {
  const span = BOTTOM_Y - TOP_Y;
  const positions = [];
  for (let i = 0; i < numLayers; i++) {
    const t = numLayers === 1 ? 0.5 : i / (numLayers - 1);
    positions.push(TOP_Y + t * span);
  }
  return positions;
}

function gradStatus(v) {
  if (!Number.isFinite(v)) return 'explode';
  const abs = Math.abs(v);
  if (abs >= EXPLODE_THRESHOLD) return 'explode';
  if (abs <= VANISH_THRESHOLD) return 'vanish';
  return 'ok';
}

export default function ResidualGradientViz() {
  const [numLayers, setNumLayers] = useState(10);
  const [mult, setMult] = useState(0.7);
  // step: how many backward steps have been taken (0 = top of network only — output gradient = 1)
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const { plain, resid } = useMemo(() => computeGradients(numLayers, mult), [numLayers, mult]);
  const ys = useMemo(() => layerCenters(numLayers), [numLayers]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => () => clearTimer(), []);

  // Reset step whenever layout / mult change while idle. Tracked-dep render-
  // phase reset (avoids setState-in-effect cascade).
  const layoutKey = `${numLayers}|${mult}`;
  const [lastLayoutKey, setLastLayoutKey] = useState(layoutKey);
  if (layoutKey !== lastLayoutKey) {
    setLastLayoutKey(layoutKey);
    if (!running) setStep(0);
  }

  const handleReset = useCallback(() => {
    clearTimer();
    setRunning(false);
    setStep(0);
  }, []);

  const handleStep = useCallback(() => {
    clearTimer();
    setStep((s) => Math.min(s + 1, numLayers));
  }, [numLayers]);

  const handleRunAll = useCallback(() => {
    clearTimer();
    setRunning(true);
    setStep(0);
    let s = 0;
    const tick = () => {
      s += 1;
      setStep(s);
      if (s >= numLayers) {
        setRunning(false);
        return;
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, 80);
  }, [numLayers]);

  // For a given layer index i (0 = bottom / closest to input, numLayers-1 = top / closest to output),
  // "visited" means gradient has flowed backward into it.
  // Backward starts from output (above the top block) at step 0 and walks downward.
  // After step k, layers numLayers-1 .. numLayers-k are visited (their *input* gradient is known).
  const visitedCount = step;
  const isLayerVisited = (i) => i >= numLayers - visitedCount;

  // The "input gradient" of layer i is the value flowing OUT of the bottom of that block (== plain[i]).
  // The output gradient (top of block) is plain[i+1].
  const inputPlain = plain[0];
  const inputResid = resid[0];

  const finalPlainStatus = gradStatus(inputPlain);

  // Build per-block colors / state
  const plainBlockColor = (i) => {
    if (!isLayerVisited(i)) return 'var(--surface)';
    const g = plain[i];
    const st = gradStatus(g);
    if (st === 'vanish') return 'var(--warning, #ffb547)';
    if (st === 'explode') return 'var(--hard, #ff5a5f)';
    return 'var(--accent)';
  };

  const residBlockColor = (i) => {
    if (!isLayerVisited(i)) return 'var(--surface)';
    return 'var(--hue-mint, #7be0c0)';
  };

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '820px', aspectRatio: `${W} / ${H}` }}>
          <defs>
            <marker id="rg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-mint, #7be0c0)" />
            </marker>
            <marker id="rg-arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
            </marker>
          </defs>

          {/* Column titles */}
          <text x={PLAIN_X} y={22} textAnchor="middle" fontSize="12" fontFamily="var(--serif, serif)" fontStyle="italic" fontWeight="700" fill="var(--text-main)">
            Plain Network
          </text>
          <text x={PLAIN_X} y={36} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.1em">
            grad ×= {mult.toFixed(2)} per layer
          </text>
          <text x={RESID_X} y={22} textAnchor="middle" fontSize="12" fontFamily="var(--serif, serif)" fontStyle="italic" fontWeight="700" fill="var(--text-main)">
            Residual Network
          </text>
          <text x={RESID_X} y={36} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.1em">
            grad ×= (1 + {mult.toFixed(2)})/2
          </text>

          {/* Output gradient label (top) */}
          <text x={PLAIN_X} y={TOP_Y - 14} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)">
            ∂L/∂out = 1
          </text>
          <text x={RESID_X} y={TOP_Y - 14} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)">
            ∂L/∂out = 1
          </text>

          {/* PLAIN network blocks */}
          {ys.map((y, idx) => {
            // Render top-down: idx 0 = top layer (closest to output) ... but our indexing has layer 0 = input.
            // ys index 0 should map to layer (numLayers-1) at top. Let's reverse:
            const layerIdx = numLayers - 1 - idx;
            const visited = isLayerVisited(layerIdx);
            const g = plain[layerIdx];
            const color = plainBlockColor(layerIdx);
            const yCenter = y;
            return (
              <g key={`p-${layerIdx}`}>
                {/* connector down to next */}
                {idx < numLayers - 1 && (
                  <line
                    x1={PLAIN_X}
                    y1={yCenter + 12}
                    x2={PLAIN_X}
                    y2={ys[idx + 1] - 12}
                    stroke={visited && isLayerVisited(layerIdx - 1) ? 'var(--hue-mint, #7be0c0)' : 'var(--border)'}
                    strokeWidth={visited && isLayerVisited(layerIdx - 1) ? 2 : 1.2}
                    markerEnd={visited && isLayerVisited(layerIdx - 1) ? 'url(#rg-arrow)' : 'url(#rg-arrow-dim)'}
                    opacity={visited && isLayerVisited(layerIdx - 1) ? 1 : 0.55}
                  />
                )}
                {/* block */}
                <rect
                  x={PLAIN_X - BLOCK_W / 2}
                  y={yCenter - 10}
                  width={BLOCK_W}
                  height={20}
                  rx={4}
                  ry={4}
                  fill={color}
                  stroke={visited ? color : 'var(--border)'}
                  strokeWidth={visited ? 1.6 : 1.2}
                  opacity={visited ? 0.95 : 0.7}
                />
                <text
                  x={PLAIN_X - BLOCK_W / 2 + 6}
                  y={yCenter + 4}
                  fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                  fill={visited ? 'var(--bg)' : 'var(--text-dim)'}
                >
                  L{layerIdx + 1}
                </text>
                {visited && (
                  <text
                    x={PLAIN_X + BLOCK_W / 2 - 6}
                    y={yCenter + 4}
                    textAnchor="end"
                    fontSize="9"
                    fontFamily="var(--mono, monospace)"
                    fontWeight="700"
                    fill="var(--bg)"
                  >
                    {formatGrad(g)}
                  </text>
                )}
              </g>
            );
          })}

          {/* RESIDUAL network blocks + skip arcs */}
          {ys.map((y, idx) => {
            const layerIdx = numLayers - 1 - idx;
            const visited = isLayerVisited(layerIdx);
            const g = resid[layerIdx];
            const yCenter = y;
            const blockColor = residBlockColor(layerIdx);
            return (
              <g key={`r-${layerIdx}`}>
                {/* main connector down */}
                {idx < numLayers - 1 && (
                  <line
                    x1={RESID_X}
                    y1={yCenter + 12}
                    x2={RESID_X}
                    y2={ys[idx + 1] - 12}
                    stroke={visited && isLayerVisited(layerIdx - 1) ? 'var(--hue-mint, #7be0c0)' : 'var(--border)'}
                    strokeWidth={visited && isLayerVisited(layerIdx - 1) ? 2 : 1.2}
                    markerEnd={visited && isLayerVisited(layerIdx - 1) ? 'url(#rg-arrow)' : 'url(#rg-arrow-dim)'}
                    opacity={visited && isLayerVisited(layerIdx - 1) ? 1 : 0.55}
                  />
                )}
                {/* skip connection (an arc that bypasses this block) */}
                {idx < numLayers - 1 && (() => {
                  const yStart = yCenter - 8;
                  const yEnd = ys[idx + 1] + 8;
                  const skipActive = visited && isLayerVisited(layerIdx - 1);
                  const xMid = RESID_X + SKIP_OFFSET;
                  const d = `M ${RESID_X + BLOCK_W / 2} ${yStart} C ${xMid} ${yStart}, ${xMid} ${yEnd}, ${RESID_X + BLOCK_W / 2} ${yEnd}`;
                  return (
                    <g>
                      <path
                        d={d}
                        fill="none"
                        stroke={skipActive ? 'var(--hue-sky, #5ecbff)' : 'var(--border)'}
                        strokeWidth={skipActive ? 1.8 : 1}
                        strokeDasharray={skipActive ? '0' : '3 3'}
                        opacity={skipActive ? 0.95 : 0.55}
                      />
                      {skipActive && idx === 0 && (
                        <text
                          x={xMid + 4}
                          y={(yStart + yEnd) / 2}
                          fontSize="8"
                          fontFamily="var(--mono, monospace)"
                          fill="var(--hue-sky, #5ecbff)"
                          fontWeight="700"
                        >
                          skip
                        </text>
                      )}
                    </g>
                  );
                })()}
                {/* block */}
                <rect
                  x={RESID_X - BLOCK_W / 2}
                  y={yCenter - 10}
                  width={BLOCK_W}
                  height={20}
                  rx={4}
                  ry={4}
                  fill={blockColor}
                  stroke={visited ? blockColor : 'var(--border)'}
                  strokeWidth={visited ? 1.6 : 1.2}
                  opacity={visited ? 0.95 : 0.7}
                />
                <text
                  x={RESID_X - BLOCK_W / 2 + 6}
                  y={yCenter + 4}
                  fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                  fill={visited ? 'var(--bg)' : 'var(--text-dim)'}
                >
                  L{layerIdx + 1}
                </text>
                {visited && (
                  <text
                    x={RESID_X + BLOCK_W / 2 - 6}
                    y={yCenter + 4}
                    textAnchor="end"
                    fontSize="9"
                    fontFamily="var(--mono, monospace)"
                    fontWeight="700"
                    fill="var(--bg)"
                  >
                    {formatGrad(g)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Input gradient labels (bottom) */}
          <text
            x={PLAIN_X}
            y={BOTTOM_Y + 26}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            fontWeight="700"
            fill={
              step >= numLayers
                ? (finalPlainStatus === 'vanish' ? 'var(--warning, #ffb547)'
                  : finalPlainStatus === 'explode' ? 'var(--hard, #ff5a5f)'
                  : 'var(--accent)')
                : 'var(--text-dim)'
            }
          >
            input grad = {step >= numLayers ? formatGrad(inputPlain) : '—'}
          </text>
          <text
            x={RESID_X}
            y={BOTTOM_Y + 26}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            fontWeight="700"
            fill={step >= numLayers ? 'var(--hue-mint, #7be0c0)' : 'var(--text-dim)'}
          >
            input grad = {step >= numLayers ? formatGrad(inputResid) : '—'}
          </text>

          {/* Phase indicator */}
          <text
            x={W - 10}
            y={18}
            textAnchor="end"
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.12em"
            fill={running ? 'var(--hue-mint, #7be0c0)' : 'var(--text-dim)'}
          >
            step {step}/{numLayers}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>plain</span>
          <span className="mlviz-val">{formatGrad(inputPlain)}</span>
          <span className="mlviz-sub">∂L/∂x after {numLayers} layers</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-mint, #7be0c0)' }}>resid</span>
          <span className="mlviz-val">{formatGrad(inputResid)}</span>
          <span className="mlviz-sub">identity path keeps gradient alive</span>
        </div>

        {step >= numLayers && finalPlainStatus === 'vanish' && (
          <div className="mlviz-row" style={{ color: 'var(--warning, #ffb547)' }}>
            <AlertTriangle size={13} />
            <span style={{ fontWeight: 700 }}>VANISHING</span>
            <span className="mlviz-sub" style={{ color: 'var(--warning, #ffb547)' }}>
              plain gradient fell below 1e-8 — input layers stop learning
            </span>
          </div>
        )}
        {step >= numLayers && finalPlainStatus === 'explode' && (
          <div className="mlviz-row" style={{ color: 'var(--hard, #ff5a5f)' }}>
            <Flame size={13} />
            <span style={{ fontWeight: 700 }}>EXPLODING</span>
            <span className="mlviz-sub" style={{ color: 'var(--hard, #ff5a5f)' }}>
              plain gradient exceeded 1e8 — weights blow up
            </span>
          </div>
        )}

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">layers</span>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={numLayers}
              onChange={(e) => setNumLayers(parseInt(e.target.value, 10))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{numLayers}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">×/layer</span>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={mult}
              onChange={(e) => setMult(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{mult.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running || step >= numLayers}
          >
            <ArrowLeft size={13} />
            <span>Step backward</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRunAll}
            disabled={running}
          >
            <Play size={13} />
            <span>Run all</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={running}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          drop the multiplier below 1 to watch the plain network vanish — push above 1 to make it explode.
          the residual column hugs 1 either way because the skip path passes the gradient through unchanged.
        </div>
      </div>
    </div>
  );
}
