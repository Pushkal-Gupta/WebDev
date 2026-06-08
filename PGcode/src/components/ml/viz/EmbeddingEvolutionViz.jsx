import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, ChevronRight } from 'lucide-react';
import './MLViz.css';

const W = 540;
const H = 420;

const DEFAULT_TOKENS = ['cat', 'sat', 'mat'];
const NUM_LAYERS = 4; // layers 0..3 (4 transitions including input)

// Per-token theme color (mapped through site CSS vars).
const TOKEN_COLORS = [
  { stroke: 'var(--accent)', fillRgb: 'var(--accent-rgb, 0, 255, 245)' },
  { stroke: 'var(--hue-pink, #ff66cc)', fillRgb: '255, 102, 204' },
  { stroke: 'var(--hue-sky, #5ecbff)', fillRgb: '94, 203, 255' },
];

// Deterministic pseudo-random in [0,1) from a string + nonce.
function seeded(token, salt) {
  let h = 2166136261;
  const s = `${token}|${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// Initial 2D positions for tokens (projected from imaginary higher-dim).
// Spread across the plane so we have room to drift.
function initialPositions(tokens) {
  return tokens.map((tok, i) => {
    const angle = (i / tokens.length) * Math.PI * 2 - Math.PI / 2;
    const r = 0.55 + seeded(tok, 'r') * 0.12;
    // Push points apart but inside the plot box.
    const jitterX = (seeded(tok, 'x') - 0.5) * 0.08;
    const jitterY = (seeded(tok, 'y') - 0.5) * 0.08;
    return {
      x: 0.5 + Math.cos(angle) * r * 0.5 + jitterX,
      y: 0.5 + Math.sin(angle) * r * 0.5 + jitterY,
    };
  });
}

// Attention weights per layer: row-stochastic NxN matrix.
// We deterministically derive per-layer weights from tokens + layer index.
// Layer 0 is "no attention applied yet" (identity). Layers 1..NUM_LAYERS-1 mix.
function attentionForLayer(tokens, layerIdx) {
  const n = tokens.length;
  if (layerIdx === 0) {
    // Identity at input.
    return Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    );
  }
  const M = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    let sum = 0;
    for (let j = 0; j < n; j++) {
      // Self gets a strong baseline; others vary by token-pair seed and layer.
      const self = i === j ? 1.6 - layerIdx * 0.18 : 0;
      const aff = seeded(`${tokens[i]}~${tokens[j]}`, `L${layerIdx}`);
      const v = Math.exp(self + aff * 1.6);
      row.push(v);
      sum += v;
    }
    M.push(row.map((v) => v / sum));
  }
  return M;
}

// Compute positions at every layer by applying attention-weighted averaging.
// step = (1 - alpha) * x_i + alpha * sum_j W_ij * x_j  — alpha grows mildly with depth.
function computeAllPositions(tokens) {
  const layers = [initialPositions(tokens)];
  for (let L = 1; L < NUM_LAYERS; L++) {
    const W_L = attentionForLayer(tokens, L);
    const prev = layers[L - 1];
    const alpha = 0.35 + (L - 1) * 0.08; // 0.35, 0.43, 0.51 ...
    const next = prev.map((_, i) => {
      let nx = 0;
      let ny = 0;
      for (let j = 0; j < tokens.length; j++) {
        nx += W_L[i][j] * prev[j].x;
        ny += W_L[i][j] * prev[j].y;
      }
      const mixedX = (1 - alpha) * prev[i].x + alpha * nx;
      const mixedY = (1 - alpha) * prev[i].y + alpha * ny;
      // Soft clamp to plot.
      return {
        x: Math.max(0.05, Math.min(0.95, mixedX)),
        y: Math.max(0.05, Math.min(0.95, mixedY)),
      };
    });
    layers.push(next);
  }
  return layers;
}

// ----- helpers for SVG layout -----
const PLOT = { x: 20, y: 16, w: 320, h: 320 };
const STACK = { x: 360, y: 16, w: 160, h: 320 };

function toPx(p) {
  return {
    cx: PLOT.x + p.x * PLOT.w,
    cy: PLOT.y + (1 - p.y) * PLOT.h,
  };
}

export default function EmbeddingEvolutionViz({ tokens: tokensProp }) {
  const initialText = (tokensProp || DEFAULT_TOKENS).join(' ');
  const [tokensInput, setTokensInput] = useState(initialText);
  const [layer, setLayer] = useState(0);
  const [running, setRunning] = useState(false);
  const [hoverTok, setHoverTok] = useState(null);
  const timerRef = useRef(null);

  const tokens = useMemo(() => {
    const t = tokensInput.split(/\s+/).filter(Boolean).slice(0, 3);
    while (t.length < 3) t.push(['cat', 'sat', 'mat'][t.length]);
    return t;
  }, [tokensInput]);

  const allLayers = useMemo(() => computeAllPositions(tokens), [tokens]);
  const attn = useMemo(() => attentionForLayer(tokens, layer), [tokens, layer]);

  const stepLayer = useCallback(() => {
    setLayer((L) => (L >= NUM_LAYERS - 1 ? L : L + 1));
  }, []);

  const runAll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(true);
    setLayer(0);
    let i = 0;
    const tick = () => {
      i += 1;
      setLayer(i);
      if (i >= NUM_LAYERS - 1) {
        setRunning(false);
        return;
      }
      timerRef.current = setTimeout(tick, 720);
    };
    timerRef.current = setTimeout(tick, 480);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setRunning(false);
    setLayer(0);
    setHoverTok(null);
  }, []);

  // Current (animated) positions = at `layer`.
  const currentPositions = allLayers[layer];

  // Build trail polylines: from layer 0 .. current layer for each token.
  const trails = tokens.map((_, i) => {
    const pts = [];
    for (let L = 0; L <= layer; L++) {
      const p = toPx(allLayers[L][i]);
      pts.push(`${p.cx.toFixed(1)},${p.cy.toFixed(1)}`);
    }
    return pts.join(' ');
  });

  // For hover highlight: which tokens does hoverTok attend to most?
  // The j-th entry in attn[hoverTok] is the weight from query=hoverTok to key=j.
  const hoverWeights = hoverTok != null ? attn[hoverTok] : null;
  // Max weight (excluding self) — for relative emphasis.
  const maxRowW = hoverWeights ? Math.max(...hoverWeights) : 1;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ minHeight: 0 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: 580, aspectRatio: `${W} / ${H}` }}
        >
          <defs>
            <marker id="ee-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker id="ee-arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
            </marker>
          </defs>

          {/* ---------- PLOT FRAME ---------- */}
          <rect
            x={PLOT.x}
            y={PLOT.y}
            width={PLOT.w}
            height={PLOT.h}
            rx={10}
            ry={10}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
          />
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((g) => (
            <g key={g} opacity={0.5}>
              <line
                x1={PLOT.x + g * PLOT.w}
                y1={PLOT.y}
                x2={PLOT.x + g * PLOT.w}
                y2={PLOT.y + PLOT.h}
                stroke="var(--border)"
                strokeDasharray="2 4"
                strokeWidth={0.6}
              />
              <line
                x1={PLOT.x}
                y1={PLOT.y + g * PLOT.h}
                x2={PLOT.x + PLOT.w}
                y2={PLOT.y + g * PLOT.h}
                stroke="var(--border)"
                strokeDasharray="2 4"
                strokeWidth={0.6}
              />
            </g>
          ))}
          {/* Axis labels (2D projection of higher-dim) */}
          <text
            x={PLOT.x + 8}
            y={PLOT.y + 14}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            2D PROJECTION OF d=64 EMBEDDING
          </text>
          <text
            x={PLOT.x + PLOT.w - 6}
            y={PLOT.y + PLOT.h - 6}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            textAnchor="end"
          >
            PC₁
          </text>
          <text
            x={PLOT.x + 6}
            y={PLOT.y + 26}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
          >
            PC₂
          </text>

          {/* ---------- TRAIL LINES ---------- */}
          {tokens.map((tok, i) => {
            const dimmed = hoverTok != null && hoverTok !== i;
            return (
              <polyline
                key={`trail-${i}`}
                points={trails[i]}
                fill="none"
                stroke={TOKEN_COLORS[i].stroke}
                strokeWidth={dimmed ? 1 : 1.8}
                strokeDasharray="3 3"
                opacity={dimmed ? 0.25 : 0.75}
              />
            );
          })}

          {/* ---------- GHOST DOTS for previous layers ---------- */}
          {tokens.map((tok, i) =>
            allLayers.slice(0, layer).map((pos, L) => {
              const p = toPx(pos[i]);
              const ghostOpacity = 0.15 + (L / Math.max(1, layer)) * 0.25;
              return (
                <circle
                  key={`ghost-${i}-${L}`}
                  cx={p.cx}
                  cy={p.cy}
                  r={4}
                  fill={`rgba(${TOKEN_COLORS[i].fillRgb}, ${ghostOpacity.toFixed(2)})`}
                  stroke={TOKEN_COLORS[i].stroke}
                  strokeWidth={0.6}
                  opacity={hoverTok != null && hoverTok !== i ? 0.2 : 1}
                />
              );
            })
          )}

          {/* ---------- ATTENTION-AT-HOVER LINKS (only when hovering) ---------- */}
          {hoverTok != null &&
            tokens.map((_, j) => {
              if (j === hoverTok) return null;
              const a = toPx(currentPositions[hoverTok]);
              const b = toPx(currentPositions[j]);
              const w = hoverWeights[j];
              const rel = w / Math.max(0.0001, maxRowW);
              return (
                <line
                  key={`att-${j}`}
                  x1={a.cx}
                  y1={a.cy}
                  x2={b.cx}
                  y2={b.cy}
                  stroke="var(--accent)"
                  strokeWidth={0.6 + rel * 2.4}
                  opacity={0.25 + rel * 0.55}
                  markerEnd="url(#ee-arrow)"
                />
              );
            })}

          {/* ---------- CURRENT-LAYER DOTS ---------- */}
          {tokens.map((tok, i) => {
            const p = toPx(currentPositions[i]);
            const isHover = hoverTok === i;
            const dimmed = hoverTok != null && hoverTok !== i;
            return (
              <g
                key={`dot-${i}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoverTok(i)}
                onMouseLeave={() => setHoverTok(null)}
                onClick={() => setHoverTok((h) => (h === i ? null : i))}
                opacity={dimmed ? 0.45 : 1}
              >
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={isHover ? 12 : 9}
                  fill={`rgba(${TOKEN_COLORS[i].fillRgb}, 0.18)`}
                  stroke={TOKEN_COLORS[i].stroke}
                  strokeWidth={isHover ? 2.2 : 1.6}
                />
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={3.2}
                  fill={TOKEN_COLORS[i].stroke}
                />
                <text
                  x={p.cx + 14}
                  y={p.cy + 4}
                  fontSize="12"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight={700}
                  fill="var(--text-main)"
                >
                  {tok}
                </text>
              </g>
            );
          })}

          {/* ---------- LAYER STACK (right side) ---------- */}
          <g>
            <text
              x={STACK.x + STACK.w / 2}
              y={STACK.y + 12}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.14em"
            >
              TRANSFORMER STACK
            </text>
            {Array.from({ length: NUM_LAYERS }).map((_, L) => {
              const idx = NUM_LAYERS - 1 - L; // draw top-down: layer 3 at top
              const bandY = STACK.y + 28 + L * 64;
              const isCurrent = idx === layer;
              const isPast = idx < layer;
              return (
                <g key={L}>
                  <rect
                    x={STACK.x + 8}
                    y={bandY}
                    width={STACK.w - 16}
                    height={56}
                    rx={8}
                    fill={
                      isCurrent
                        ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.14)'
                        : isPast
                          ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.05)'
                          : 'var(--surface)'
                    }
                    stroke={isCurrent ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={isCurrent ? 1.6 : 1}
                  />
                  <text
                    x={STACK.x + 18}
                    y={bandY + 18}
                    fontSize="10"
                    fontFamily="var(--mono, monospace)"
                    fill={isCurrent ? 'var(--accent)' : 'var(--text-dim)'}
                    letterSpacing="0.14em"
                  >
                    LAYER {idx}
                  </text>
                  <text
                    x={STACK.x + 18}
                    y={bandY + 36}
                    fontSize="11"
                    fontFamily="var(--serif, serif)"
                    fontStyle="italic"
                    fontWeight={700}
                    fill="var(--text-main)"
                  >
                    {idx === 0 ? 'input embeddings' : 'attention + FFN'}
                  </text>
                  <text
                    x={STACK.x + 18}
                    y={bandY + 50}
                    fontSize="9"
                    fontFamily="var(--mono, monospace)"
                    fill="var(--text-dim)"
                  >
                    {idx === 0 ? 'projected from d=64' : `α = ${(0.35 + (idx - 1) * 0.08).toFixed(2)}`}
                  </text>
                  {/* arrow between bands */}
                  {L < NUM_LAYERS - 1 && (
                    <line
                      x1={STACK.x + STACK.w / 2}
                      y1={bandY + 56}
                      x2={STACK.x + STACK.w / 2}
                      y2={bandY + 64}
                      stroke={isPast || isCurrent ? 'var(--accent)' : 'var(--text-dim)'}
                      strokeWidth={1.2}
                      markerEnd={isPast || isCurrent ? 'url(#ee-arrow)' : 'url(#ee-arrow-dim)'}
                      opacity={0.85}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Attention matrix panel for current layer */}
      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span
            className="mlviz-tag"
            style={{
              color: 'var(--text-dim)',
              fontFamily: 'var(--mono)',
              fontStyle: 'normal',
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
            }}
          >
            ATTENTION · LAYER {layer}
          </span>
          <span className="mlviz-sub">
            {layer === 0
              ? 'identity — embeddings have not been mixed yet'
              : 'rows are queries (where each token reads from)'}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `auto repeat(${tokens.length}, 1fr)`,
            gap: 4,
            fontFamily: 'var(--mono, monospace)',
            fontSize: '0.72rem',
            marginTop: '0.35rem',
          }}
        >
          {/* Header row */}
          <span />
          {tokens.map((tok, j) => (
            <span
              key={`h-${j}`}
              style={{
                color: TOKEN_COLORS[j].stroke,
                textAlign: 'center',
                fontWeight: 700,
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
              }}
            >
              {tok}
            </span>
          ))}
          {/* Body rows */}
          {tokens.map((tok, i) => (
            <React.Fragment key={`r-${i}`}>
              <span
                style={{
                  color: TOKEN_COLORS[i].stroke,
                  fontWeight: 700,
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  textAlign: 'right',
                  paddingRight: 6,
                  cursor: 'pointer',
                  opacity: hoverTok != null && hoverTok !== i ? 0.4 : 1,
                }}
                onMouseEnter={() => setHoverTok(i)}
                onMouseLeave={() => setHoverTok(null)}
              >
                {tok}
              </span>
              {tokens.map((_, j) => {
                const w = attn[i][j];
                const isHi = hoverTok === i;
                return (
                  <span
                    key={`c-${i}-${j}`}
                    style={{
                      background: `rgba(var(--accent-rgb, 0, 255, 245), ${(0.08 + w * 0.7).toFixed(2)})`,
                      border: isHi ? '1px solid var(--accent)' : '1px solid var(--border)',
                      color: 'var(--text-main)',
                      textAlign: 'center',
                      padding: '0.25rem 0',
                      borderRadius: 4,
                      opacity: hoverTok != null && hoverTok !== i ? 0.5 : 1,
                    }}
                  >
                    {w.toFixed(2)}
                  </span>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span
            className="mlviz-tag"
            style={{
              color: 'var(--text-dim)',
              fontFamily: 'var(--mono)',
              fontStyle: 'normal',
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
            }}
          >
            TOKENS
          </span>
          <input
            type="text"
            value={tokensInput}
            onChange={(e) => setTokensInput(e.target.value)}
            disabled={running}
            className="ah-input"
            style={{ minWidth: 0, flex: 1 }}
            placeholder="cat sat mat"
          />
        </div>
        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={stepLayer}
            disabled={running || layer >= NUM_LAYERS - 1}
          >
            <ChevronRight size={13} />
            <span>Step layer</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={runAll}
            disabled={running}
          >
            <Play size={13} />
            <span>Run all</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={reset}
            disabled={running}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
        <div className="mlviz-hint">
          hover a token to see what it is attending to · trails track the drift through layers
        </div>
      </div>
    </div>
  );
}
