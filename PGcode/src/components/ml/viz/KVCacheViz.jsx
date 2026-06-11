import React, { useMemo, useState, useCallback } from 'react';
import { StepForward, RotateCcw, Play } from 'lucide-react';
import './MLViz.css';

/* KVCacheViz
   MANIM-style walkthrough of the transformer KV-cache during autoregressive decoding.
   - Left column: token sequence (one chip per generated token).
   - Middle column: K-cache and V-cache matrices, each row = one token's vector.
   - Right column: current Q attending to all cached K's, with softmax attention weights.
   - Slider controls target sequence length (1..12).
   - "Step" generates the next token; new K/V are computed once and pushed onto the cache.
   - Memory readout makes the O(N) cache vs O(N^2) recompute tradeoff explicit. */

const VOCAB = [
  'The', 'fox', 'jumps', 'over', 'a', 'lazy',
  'dog', 'while', 'the', 'sun', 'sets', 'low',
  'and', 'wind', 'hums', 'soft',
];

const D_MODEL = 6;            // size of K / V / Q row vectors (display-only)
const MAX_LEN = 12;           // matches the spec
const CELL = 30;              // matrix cell size
const ROW_GAP = 4;            // gap between rows
const TOKEN_W = 130;
const TOKEN_H = 36;
const CACHE_W = D_MODEL * CELL + 80;     // K and V panel inner width
const ATTN_W = 230;
const SVG_W = TOKEN_W + 28 + CACHE_W * 2 + 28 + ATTN_W + 24;
const SVG_H = 60 + MAX_LEN * (TOKEN_H + 8) + 40;

/* deterministic 32-bit hash from a string */
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deriveVec(token, role, idx) {
  const seed = xmur3(`${role}|${idx}|${token}`)();
  const rng = mulberry32(seed);
  const out = new Array(D_MODEL);
  for (let i = 0; i < D_MODEL; i++) {
    out[i] = Math.round((rng() * 2 - 1) * 100) / 100;
  }
  return out;
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function softmaxRow(row) {
  const m = Math.max(...row);
  const ex = row.map((v) => Math.exp(v - m));
  const z = ex.reduce((p, c) => p + c, 0) || 1;
  return ex.map((e) => e / z);
}

function fmt(n, p = 2) {
  if (!Number.isFinite(n)) return '-';
  return n.toFixed(p);
}

/* one matrix row of d-dim vector chips */
function VecChips({ vec, x, y, dim = false }) {
  const max = Math.max(0.001, ...vec.map((v) => Math.abs(v)));
  return (
    <g transform={`translate(${x}, ${y})`} opacity={dim ? 0.55 : 1}>
      {vec.map((v, i) => {
        const t = Math.abs(v) / max;
        const positive = v >= 0;
        const bg = positive
          ? `rgba(var(--accent-rgb, 0,255,245), ${0.12 + t * 0.55})`
          : `rgba(255, 102, 204, ${0.12 + t * 0.55})`;
        return (
          <g key={i} transform={`translate(${i * CELL}, 0)`}>
            <rect
              width={CELL - 2}
              height={CELL - 2}
              rx="3"
              fill={bg}
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x={(CELL - 2) / 2}
              y={(CELL - 2) / 2 + 3.5}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
            >
              {fmt(v, 1)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default function KVCacheViz() {
  // target length the user wants to drive toward
  const [target, setTarget] = useState(6);
  // tokens actually generated so far (step count)
  const [step, setStep] = useState(1);

  const generated = useMemo(() => {
    const out = [];
    for (let i = 0; i < step; i++) {
      out.push(VOCAB[i % VOCAB.length]);
    }
    return out;
  }, [step]);

  // K / V / Q tables sized to current step
  const { K, V, Qcurr, attnW, attnRaw } = useMemo(() => {
    const K = generated.map((t, i) => deriveVec(t, 'K', i));
    const V = generated.map((t, i) => deriveVec(t, 'V', i));
    // Q for the latest token (the only Q we need during cached decoding)
    const lastIdx = generated.length - 1;
    if (lastIdx < 0) {
      return { K, V, Qcurr: null, attnW: [], attnRaw: [] };
    }
    const Qcurr = deriveVec(generated[lastIdx], 'Q', lastIdx);
    const scale = Math.sqrt(D_MODEL);
    const raw = K.map((k) => dot(Qcurr, k) / scale);
    const w = softmaxRow(raw);
    return { K, V, Qcurr, attnW: w, attnRaw: raw };
  }, [generated]);

  const handleStep = useCallback(() => {
    setStep((s) => Math.min(target, s + 1));
  }, [target]);

  const handleReset = useCallback(() => setStep(1), []);

  const handleRunAll = useCallback(() => setStep(target), [target]);

  const handleTarget = useCallback((nextTarget) => {
    setTarget(nextTarget);
    if (step > nextTarget) setStep(nextTarget);
  }, [step]);

  // memory accounting: each cache row is d_model floats. We use a fictional but
  // representative per-float cost so the numbers feel honest.
  const PER_FLOAT_BYTES = 2;  // half precision in modern stacks
  const N = generated.length;
  const cachedBytes = N * D_MODEL * 2 * PER_FLOAT_BYTES; // K + V
  // without cache, each step recomputes all K and V from scratch — total work
  // grows as 1 + 2 + ... + N = N(N+1)/2 vector computations.
  const recomputeWork = (N * (N + 1)) / 2 * D_MODEL * 2;
  const cachedWork = N * D_MODEL * 2; // each token's K, V computed once

  // layout origins
  const tokX = 16;
  const tokY = 56;
  const kX = tokX + TOKEN_W + 28;
  const vX = kX + CACHE_W;
  const aX = vX + CACHE_W + 28;
  const aY = tokY;

  const rowH = TOKEN_H + 8;

  // attention weight color
  const wColor = (w) => `rgba(var(--accent-rgb, 0,255,245), ${0.1 + w * 0.85})`;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.7rem 0.6rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${SVG_W} / ${SVG_H}` }}
          role="img"
          aria-label="KV-cache during autoregressive decoding"
        >
          <defs>
            <linearGradient id="kvc-stage" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <marker
              id="kvc-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--accent)" opacity="0.7" />
            </marker>
          </defs>

          <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="url(#kvc-stage)" />

          {/* Column headers */}
          <text
            x={tokX + TOKEN_W / 2}
            y={32}
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.18em"
          >
            TOKENS
          </text>
          <text
            x={kX + CACHE_W / 2 - 14}
            y={32}
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.18em"
          >
            K-CACHE
          </text>
          <text
            x={vX + CACHE_W / 2 - 14}
            y={32}
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.18em"
          >
            V-CACHE
          </text>
          <text
            x={aX + ATTN_W / 2}
            y={32}
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.18em"
          >
            Q · ATTENTION
          </text>

          {/* Subheader: d_model */}
          <text
            x={kX + CACHE_W / 2 - 14}
            y={46}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            opacity="0.7"
          >
            d_model = {D_MODEL}
          </text>
          <text
            x={vX + CACHE_W / 2 - 14}
            y={46}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            opacity="0.7"
          >
            d_model = {D_MODEL}
          </text>

          {/* Ghost rows for slots up to MAX_LEN to show capacity */}
          {Array.from({ length: target }).map((_, i) => {
            if (i < N) return null;
            const y = tokY + i * rowH;
            return (
              <g key={`ghost-${i}`} opacity="0.35">
                <rect
                  x={tokX}
                  y={y}
                  width={TOKEN_W}
                  height={TOKEN_H}
                  rx="6"
                  fill="transparent"
                  stroke="var(--border)"
                  strokeWidth="0.7"
                  strokeDasharray="3 4"
                />
                <text
                  x={tokX + TOKEN_W / 2}
                  y={y + TOKEN_H / 2 + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)"
                  opacity="0.6"
                >
                  t = {i}
                </text>
                <rect
                  x={kX}
                  y={y}
                  width={D_MODEL * CELL}
                  height={TOKEN_H}
                  rx="4"
                  fill="transparent"
                  stroke="var(--border)"
                  strokeWidth="0.7"
                  strokeDasharray="3 4"
                />
                <rect
                  x={vX}
                  y={y}
                  width={D_MODEL * CELL}
                  height={TOKEN_H}
                  rx="4"
                  fill="transparent"
                  stroke="var(--border)"
                  strokeWidth="0.7"
                  strokeDasharray="3 4"
                />
              </g>
            );
          })}

          {/* Rendered rows */}
          {generated.map((tok, i) => {
            const y = tokY + i * rowH;
            const isCurrent = i === N - 1;
            const tokFill = isCurrent
              ? 'rgba(var(--accent-rgb, 0,255,245), 0.18)'
              : 'rgba(var(--accent-rgb, 0,255,245), 0.06)';
            const tokStroke = isCurrent ? 'var(--accent)' : 'var(--border)';
            return (
              <g key={`row-${i}`}>
                {/* Token chip */}
                <rect
                  x={tokX}
                  y={y}
                  width={TOKEN_W}
                  height={TOKEN_H}
                  rx="8"
                  fill={tokFill}
                  stroke={tokStroke}
                  strokeWidth={isCurrent ? 1.4 : 0.8}
                />
                <text
                  x={tokX + 10}
                  y={y + TOKEN_H / 2 + 4}
                  fontSize="13"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fill={isCurrent ? 'var(--accent)' : 'var(--text-main)'}
                  fontWeight={isCurrent ? 700 : 500}
                >
                  {tok}
                </text>
                <text
                  x={tokX + TOKEN_W - 10}
                  y={y + TOKEN_H / 2 + 4}
                  textAnchor="end"
                  fontSize="9.5"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)"
                >
                  t = {i}
                </text>

                {/* K row */}
                <rect
                  x={kX - 4}
                  y={y - 2}
                  width={D_MODEL * CELL + 8}
                  height={TOKEN_H + 4}
                  rx="6"
                  fill="transparent"
                  stroke={isCurrent ? 'var(--accent)' : 'transparent'}
                  strokeWidth={isCurrent ? 1 : 0}
                  opacity={isCurrent ? 0.7 : 0}
                />
                <VecChips vec={K[i]} x={kX} y={y + 3} />

                {/* V row */}
                <rect
                  x={vX - 4}
                  y={y - 2}
                  width={D_MODEL * CELL + 8}
                  height={TOKEN_H + 4}
                  rx="6"
                  fill="transparent"
                  stroke={isCurrent ? 'var(--accent)' : 'transparent'}
                  strokeWidth={isCurrent ? 1 : 0}
                  opacity={isCurrent ? 0.7 : 0}
                />
                <VecChips vec={V[i]} x={vX} y={y + 3} />

                {/* Cached badge for non-current rows */}
                {!isCurrent && (
                  <text
                    x={vX + D_MODEL * CELL + 8}
                    y={y + TOKEN_H / 2 + 4}
                    fontSize="8.5"
                    fontFamily="var(--mono, monospace)"
                    fill="var(--text-dim)"
                    letterSpacing="0.14em"
                    opacity="0.8"
                  >
                    CACHED
                  </text>
                )}
                {isCurrent && (
                  <text
                    x={vX + D_MODEL * CELL + 8}
                    y={y + TOKEN_H / 2 + 4}
                    fontSize="8.5"
                    fontFamily="var(--mono, monospace)"
                    fill="var(--accent)"
                    letterSpacing="0.14em"
                  >
                    NEW
                  </text>
                )}
              </g>
            );
          })}

          {/* Attention column on the right.
              Show one row per cached K, with weight bar + numeric value.
              Highlights how the current Q reads from EVERY cached K. */}
          {N > 0 && Qcurr && (
            <g>
              {/* Q vector display at the top of the attention column */}
              <rect
                x={aX}
                y={aY - 4}
                width={ATTN_W}
                height={TOKEN_H + 4}
                rx="6"
                fill="rgba(var(--accent-rgb, 0,255,245), 0.05)"
                stroke="var(--accent)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={aX + 8}
                y={aY + 14}
                fontSize="9"
                fontFamily="var(--mono, monospace)"
                fill="var(--accent)"
                letterSpacing="0.14em"
              >
                Q (t = {N - 1})
              </text>
              <g transform={`translate(${aX + 8}, ${aY + 18})`}>
                {Qcurr.map((v, i) => {
                  const max = Math.max(0.001, ...Qcurr.map((q) => Math.abs(q)));
                  const t = Math.abs(v) / max;
                  const positive = v >= 0;
                  const bg = positive
                    ? `rgba(var(--accent-rgb, 0,255,245), ${0.16 + t * 0.55})`
                    : `rgba(255, 102, 204, ${0.16 + t * 0.55})`;
                  return (
                    <g key={i} transform={`translate(${i * 22}, 0)`}>
                      <rect
                        width="20"
                        height="14"
                        rx="2"
                        fill={bg}
                        stroke="var(--border)"
                        strokeWidth="0.5"
                      />
                      <text
                        x="10"
                        y="10"
                        textAnchor="middle"
                        fontSize="7"
                        fontFamily="var(--mono, monospace)"
                        fill="var(--text-main)"
                      >
                        {fmt(v, 1)}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Section header for attention */}
              <text
                x={aX}
                y={aY + TOKEN_H + 24}
                fontSize="9"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-dim)"
                letterSpacing="0.14em"
              >
                softmax(Q · Kᵀ / √d)
              </text>

              {/* Per-cached-token attention weight bar */}
              {generated.map((tok, i) => {
                const baseY = aY + TOKEN_H + 36 + i * 22;
                const w = attnW[i];
                const barW = Math.max(2, w * (ATTN_W - 80));
                return (
                  <g key={`a-${i}`}>
                    <text
                      x={aX}
                      y={baseY + 11}
                      fontSize="9"
                      fontFamily="var(--mono, monospace)"
                      fill="var(--text-dim)"
                    >
                      t={i}
                    </text>
                    <rect
                      x={aX + 26}
                      y={baseY}
                      width={ATTN_W - 80}
                      height="14"
                      rx="3"
                      fill="rgba(120,120,120,0.06)"
                      stroke="var(--border)"
                      strokeWidth="0.4"
                    />
                    <rect
                      x={aX + 26}
                      y={baseY}
                      width={barW}
                      height="14"
                      rx="3"
                      fill={wColor(w)}
                    />
                    <text
                      x={aX + ATTN_W - 6}
                      y={baseY + 11}
                      textAnchor="end"
                      fontSize="9"
                      fontFamily="var(--mono, monospace)"
                      fill={w > 0.4 ? 'var(--accent)' : 'var(--text-main)'}
                    >
                      {fmt(w, 3)}
                    </text>
                  </g>
                );
              })}

              {/* Arrows from each K row over to attention column.
                  Drawn faint so they don't overwhelm. */}
              {generated.map((_, i) => {
                const yFrom = tokY + i * rowH + TOKEN_H / 2;
                const yTo = aY + TOKEN_H + 36 + i * 22 + 7;
                if (i >= attnW.length) return null;
                const opacity = 0.15 + attnW[i] * 0.55;
                return (
                  <path
                    key={`arr-${i}`}
                    d={`M ${kX + D_MODEL * CELL + 4} ${yFrom} C ${aX - 20} ${yFrom}, ${aX - 20} ${yTo}, ${aX - 4} ${yTo}`}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="0.8"
                    opacity={opacity}
                  />
                );
              })}
            </g>
          )}

          {/* Footer caption inside SVG */}
          <text
            x={SVG_W / 2}
            y={SVG_H - 8}
            textAnchor="middle"
            fontSize="9.5"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            fill="var(--text-dim)"
          >
            each new token computes its K, V once and appends — Q reads from the whole cache.
          </text>
        </svg>
      </div>

      {/* Controls */}
      <div className="mt-controls">
        <div className="mlviz-slider">
          <span className="mlviz-slider-label">target length</span>
          <input
            type="range"
            min="1"
            max={MAX_LEN}
            step="1"
            value={target}
            onChange={(e) => handleTarget(Number(e.target.value))}
          />
          <span className="mlviz-slider-val">{target}</span>
        </div>
        <div className="mlviz-btn-row" style={{ display: 'flex' }}>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleStep}
            disabled={step >= target}
          >
            <StepForward size={13} aria-hidden />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleRunAll}
            disabled={step >= target}
          >
            <Play size={13} aria-hidden />
            <span>Run to {target}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={step <= 1}
          >
            <RotateCcw size={13} aria-hidden />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Readout: memory + work comparison */}
      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>cache</span>
          <span className="mlviz-sub">tokens stored</span>
          <span className="mlviz-val">{N}</span>
          <span className="mlviz-sub">memory</span>
          <span className="mlviz-val">{cachedBytes} B</span>
          <span className="mlviz-sub">
            (2 · N · d_model · {PER_FLOAT_BYTES} B)
          </span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--hue-mint, #6ee7b7)' }}>with cache</span>
          <span className="mlviz-sub">work</span>
          <span className="mlviz-val">O(N) = {cachedWork} mul-acc</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--warning, #f5a524)' }}>no cache</span>
          <span className="mlviz-sub">work</span>
          <span className="mlviz-val">O(N²) = {recomputeWork} mul-acc</span>
          <span className="mlviz-sub">
            savings ×{N > 0 ? fmt(recomputeWork / Math.max(1, cachedWork), 1) : '—'}
          </span>
        </div>
        {Qcurr && (
          <div className="mlviz-row">
            <span className="mlviz-sub">top-attended cached token:</span>
            <span className="mlviz-val">
              {(() => {
                let bi = 0;
                for (let i = 1; i < attnW.length; i++) if (attnW[i] > attnW[bi]) bi = i;
                return `t=${bi} (${generated[bi]}) · w=${fmt(attnW[bi], 3)}`;
              })()}
            </span>
            <span className="mlviz-sub">raw score</span>
            <span className="mlviz-val">
              {(() => {
                let bi = 0;
                for (let i = 1; i < attnW.length; i++) if (attnW[i] > attnW[bi]) bi = i;
                return fmt(attnRaw[bi], 2);
              })()}
            </span>
          </div>
        )}
        <div className="mlviz-hint">
          drag the slider to set target length · step to generate one token at a time
        </div>
      </div>
    </div>
  );
}
