import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, ChevronRight } from 'lucide-react';
import './MLViz.css';

const W = 720;
const H = 760;

const N = 3;          // tokens
const D = 4;          // model dim
const HEADS = 2;      // attention heads
const DK = D / HEADS; // per-head dim

const TOKENS = ['the', 'cat', 'sat'];

// 7 stages in order
const STAGES = [
  { id: 'input', name: 'Input embeddings', detail: 'x ∈ R^{3×4} — three tokens, each a 4-dim vector.' },
  { id: 'qkv', name: 'Q, K, V projections', detail: 'x · W_{q,k,v} produces Q, K, V split into 2 heads of dim 2.' },
  { id: 'scores', name: 'Scores Q·Kᵀ / √dₖ', detail: 'Per-head 3×3 raw attention scores before softmax.' },
  { id: 'softmax', name: 'Softmax over keys', detail: 'Each row normalized — attention weights sum to 1.' },
  { id: 'av', name: 'Attention · V', detail: 'Weighted sum of values. Heads concatenated back to 4-dim.' },
  { id: 'resnorm1', name: 'Residual + LayerNorm', detail: 'h = LayerNorm(x + AttnOut). Skip keeps gradient flow.' },
  { id: 'ffn', name: 'Feed-forward (Linear → GELU → Linear)', detail: 'h → W₁ → GELU → W₂. Position-wise, mixes channels.' },
  { id: 'resnorm2', name: 'Residual + LayerNorm', detail: 'y = LayerNorm(h + FFN(h)). Block output, same shape as input.' },
];

const STEP_DELAY = 900;

// Seeded deterministic numbers so the viz is reproducible.
function rnd(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function matMul(A, B) {
  const r = A.length;
  const c = B[0].length;
  const k = B.length;
  const out = Array.from({ length: r }, () => Array(c).fill(0));
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      let s = 0;
      for (let p = 0; p < k; p++) s += A[i][p] * B[p][j];
      out[i][j] = s;
    }
  }
  return out;
}

function transpose(M) {
  const r = M.length;
  const c = M[0].length;
  const out = Array.from({ length: c }, () => Array(r).fill(0));
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) out[j][i] = M[i][j];
  return out;
}

function softmaxRows(M) {
  return M.map((row) => {
    const m = Math.max(...row);
    const ex = row.map((v) => Math.exp(v - m));
    const s = ex.reduce((a, b) => a + b, 0);
    return ex.map((v) => v / s);
  });
}

function layerNormRow(row) {
  const mean = row.reduce((a, b) => a + b, 0) / row.length;
  const variance = row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length;
  const std = Math.sqrt(variance + 1e-5);
  return row.map((v) => (v - mean) / std);
}

function layerNorm(M) {
  return M.map((r) => layerNormRow(r));
}

function gelu(x) {
  return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
}

function fmt(v) {
  if (v === 0) return '0.00';
  const abs = Math.abs(v);
  if (abs < 0.01) return v.toExponential(1);
  return v.toFixed(2);
}

// Precompute the entire forward pass once.
function computePass() {
  const r = rnd(42);
  // Token embeddings, 3×4
  const x = Array.from({ length: N }, () =>
    Array.from({ length: D }, () => +(r() * 2 - 1).toFixed(2))
  );

  // Weight matrices 4×4 — small values
  const mkW = (seed) => {
    const g = rnd(seed);
    return Array.from({ length: D }, () =>
      Array.from({ length: D }, () => +(g() * 1.4 - 0.7).toFixed(2))
    );
  };
  const Wq = mkW(7);
  const Wk = mkW(13);
  const Wv = mkW(19);

  const Q = matMul(x, Wq); // 3×4
  const K = matMul(x, Wk);
  const V = matMul(x, Wv);

  // Split heads: 3×4 -> heads[h] is 3×2
  const splitHeads = (M) => {
    const heads = [];
    for (let h = 0; h < HEADS; h++) {
      heads.push(M.map((row) => row.slice(h * DK, (h + 1) * DK)));
    }
    return heads;
  };
  const Qh = splitHeads(Q);
  const Kh = splitHeads(K);
  const Vh = splitHeads(V);

  // Per head: scores = Q · Kᵀ / sqrt(dk), softmax, then ·V
  const scale = 1 / Math.sqrt(DK);
  const scoresH = Qh.map((qh, i) => {
    const kT = transpose(Kh[i]);
    const raw = matMul(qh, kT);
    return raw.map((row) => row.map((v) => v * scale));
  });
  const attnH = scoresH.map((m) => softmaxRows(m));
  const outH = attnH.map((a, i) => matMul(a, Vh[i])); // 3×2 each

  // Concat heads -> 3×4
  const attnOut = Array.from({ length: N }, (_, i) =>
    outH.reduce((acc, h) => acc.concat(h[i]), [])
  );

  // Residual + LayerNorm 1
  const sum1 = x.map((row, i) => row.map((v, j) => v + attnOut[i][j]));
  const norm1 = layerNorm(sum1);

  // FFN: W1 4×8, W2 8×4
  const W1 = (() => {
    const g = rnd(31);
    return Array.from({ length: D }, () =>
      Array.from({ length: D * 2 }, () => +(g() * 1.2 - 0.6).toFixed(2))
    );
  })();
  const W2 = (() => {
    const g = rnd(37);
    return Array.from({ length: D * 2 }, () =>
      Array.from({ length: D }, () => +(g() * 1.2 - 0.6).toFixed(2))
    );
  })();
  const hPre = matMul(norm1, W1); // 3×8
  const hAct = hPre.map((row) => row.map((v) => gelu(v)));
  const ffnOut = matMul(hAct, W2); // 3×4

  const sum2 = norm1.map((row, i) => row.map((v, j) => v + ffnOut[i][j]));
  const norm2 = layerNorm(sum2);

  return {
    x, Wq, Wk, Wv, Q, K, V, Qh, Kh, Vh,
    scoresH, attnH, outH, attnOut,
    sum1, norm1,
    hPre, hAct, ffnOut,
    sum2, norm2,
  };
}

// Map value in [-r, r] to opacity 0..1 for heatmap.
function valToAlpha(v, r) {
  const c = Math.max(0, Math.min(1, Math.abs(v) / r));
  return 0.12 + c * 0.72;
}

// Color a cell by sign: accent for positive, pink for negative.
function cellFill(v, range) {
  const a = valToAlpha(v, range).toFixed(2);
  if (v >= 0) return `rgba(var(--accent-rgb, 0, 255, 245), ${a})`;
  return `color-mix(in srgb, var(--hue-pink) ${a * 100}%, transparent)`;
}

// Heat fill for non-negative attention weights (0..1).
function weightFill(v) {
  const a = (0.1 + Math.min(1, Math.max(0, v)) * 0.8).toFixed(2);
  return `rgba(var(--accent-rgb, 0, 255, 245), ${a})`;
}

// One row of cells with label.
function CellRow({ x, y, cells, cellW = 28, cellH = 18, label, labelColor = 'var(--text-dim)', lit = true, range = 2 }) {
  return (
    <g opacity={lit ? 1 : 0.35}>
      {label && (
        <text
          x={x - 8}
          y={y + cellH / 2 + 4}
          textAnchor="end"
          fontSize="10"
          fontFamily="var(--mono, monospace)"
          fill={labelColor}
        >
          {label}
        </text>
      )}
      {cells.map((v, i) => (
        <g key={i}>
          <rect
            x={x + i * (cellW + 2)}
            y={y}
            width={cellW}
            height={cellH}
            rx={2}
            fill={cellFill(v, range)}
            stroke="var(--border)"
            strokeWidth={0.6}
          />
          <text
            x={x + i * (cellW + 2) + cellW / 2}
            y={y + cellH / 2 + 3}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-main)"
          >
            {fmt(v)}
          </text>
        </g>
      ))}
    </g>
  );
}

function HeatGrid({ x, y, M, cellSize = 22, weights = false, label, headColor }) {
  const r = 2;
  return (
    <g>
      {label && (
        <text
          x={x + (M[0].length * cellSize) / 2}
          y={y - 6}
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--mono, monospace)"
          fill={headColor || 'var(--text-dim)'}
          letterSpacing="0.1em"
        >
          {label}
        </text>
      )}
      {M.map((row, i) =>
        row.map((v, j) => (
          <g key={`${i}-${j}`}>
            <rect
              x={x + j * cellSize}
              y={y + i * cellSize}
              width={cellSize - 1}
              height={cellSize - 1}
              rx={1.5}
              fill={weights ? weightFill(v) : cellFill(v, r)}
              stroke="var(--border)"
              strokeWidth={0.5}
            />
            <text
              x={x + j * cellSize + cellSize / 2 - 0.5}
              y={y + i * cellSize + cellSize / 2 + 3}
              textAnchor="middle"
              fontSize="8"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
            >
              {weights ? v.toFixed(2) : fmt(v)}
            </text>
          </g>
        ))
      )}
    </g>
  );
}

export default function TransformerBlockFullViz() {
  const data = useMemo(() => computePass(), []);
  const [stage, setStage] = useState(0); // 0..STAGES.length-1
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setRunning(false);
  }, []);

  const handleStep = useCallback(() => {
    setStage((s) => Math.min(STAGES.length - 1, s + 1));
  }, []);

  const handleRun = useCallback(() => {
    stop();
    setRunning(true);
    setStage(0);
    let s = 0;
    const tick = () => {
      s += 1;
      if (s >= STAGES.length) {
        setStage(STAGES.length - 1);
        setRunning(false);
        return;
      }
      setStage(s);
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, 350);
  }, [stop]);

  const handleReset = useCallback(() => {
    stop();
    setStage(0);
  }, [stop]);

  // Helpers — what stages have reached
  const reached = (idx) => stage >= idx;
  const current = STAGES[stage];

  // ===== Layout =====
  const left = 32;
  const colGap = 18;

  // ---- Section 1: Input embeddings (top) ----
  const inputY = 56;
  const tokenLabelW = 36;
  const cellW = 30;
  const cellH = 20;
  const inputBlockX = left + tokenLabelW;

  // ---- Section 2: QKV ----
  const qkvY = inputY + N * (cellH + 4) + 50;
  const qkvCellW = 24;
  const qkvCellH = 16;
  // Three groups: Q, K, V, each with HEADS sub-blocks of N rows × DK cols
  const headColors = ['var(--accent)', 'var(--hue-pink, #ff66cc)'];
  const qkvGroupW = HEADS * (DK * (qkvCellW + 2) + 12) + 8;

  // ---- Section 3: Scores ----
  const scoresY = qkvY + N * (qkvCellH + 4) + 56;
  const scoreCell = 26;

  // ---- Section 4: Softmax weights (same row visually next to scores) ----
  // Place softmax to the right of scores

  // ---- Section 5: Attn out ----
  const avY = scoresY + N * scoreCell + 56;

  // ---- Section 6: Residual + LN ----
  const rnY = avY + N * (cellH + 4) + 40;

  // ---- Section 7: FFN ----
  const ffnY = rnY + N * (cellH + 4) + 40;

  // ---- Section 8: Final ----
  const outY = ffnY + N * (cellH + 4) + 56;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" style={{ maxWidth: 760, aspectRatio: `${W} / ${H}` }}>
          <defs>
            <marker id="tbf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
            </marker>
            <marker id="tbf-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker id="tbf-arrow-pink" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-pink, #ff66cc)" />
            </marker>
            <marker id="tbf-arrow-sky" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-sky, #5ecbff)" />
            </marker>
            <marker id="tbf-arrow-mint" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-mint, #7be0c0)" />
            </marker>
          </defs>

          {/* Side rail label */}
          <text x={12} y={20} fontSize="10" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.14em">
            TRANSFORMER BLOCK · STEP {stage + 1}/{STAGES.length}
          </text>
          <text x={W - 12} y={20} fontSize="10" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" textAnchor="end" letterSpacing="0.14em">
            N=3 · d=4 · heads=2
          </text>

          {/* ========== 1. INPUT EMBEDDINGS ========== */}
          <g opacity={reached(0) ? 1 : 0.3}>
            <text x={left} y={inputY - 14} fontSize="11" fontFamily="var(--mono, monospace)" fill="var(--accent)" letterSpacing="0.12em">
              1 · INPUT EMBEDDINGS x ∈ R^{3 + '×' + 4}
            </text>
            {data.x.map((row, i) => (
              <g key={i}>
                <text
                  x={left + tokenLabelW - 8}
                  y={inputY + i * (cellH + 4) + cellH / 2 + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight={700}
                  fill="var(--text-main)"
                >
                  {TOKENS[i]}
                </text>
                <CellRow
                  x={inputBlockX}
                  y={inputY + i * (cellH + 4)}
                  cells={row}
                  cellW={cellW}
                  cellH={cellH}
                  range={1.5}
                />
              </g>
            ))}
            {/* Per-token circle indicators on the far right */}
            <g>
              {data.x.map((row, i) => (
                <g key={i}>
                  {row.map((v, j) => (
                    <circle
                      key={j}
                      cx={inputBlockX + D * (cellW + 2) + 14 + j * 12}
                      cy={inputY + i * (cellH + 4) + cellH / 2}
                      r={4}
                      fill={cellFill(v, 1.5)}
                      stroke="var(--border)"
                      strokeWidth={0.6}
                    />
                  ))}
                </g>
              ))}
            </g>
          </g>

          {/* Down arrow */}
          <line
            x1={left + 60}
            y1={inputY + N * (cellH + 4) + 4}
            x2={left + 60}
            y2={qkvY - 18}
            stroke={reached(1) ? 'var(--accent)' : 'var(--text-dim)'}
            strokeWidth={reached(1) ? 1.6 : 1}
            markerEnd={reached(1) ? 'url(#tbf-arrow-accent)' : 'url(#tbf-arrow)'}
            opacity={0.85}
          />
          <text
            x={left + 70}
            y={inputY + N * (cellH + 4) + 24}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill={reached(1) ? 'var(--accent)' : 'var(--text-dim)'}
          >
            · W_q / W_k / W_v
          </text>

          {/* ========== 2. QKV PROJECTIONS ========== */}
          <g opacity={reached(1) ? 1 : 0.3}>
            <text x={left} y={qkvY - 14} fontSize="11" fontFamily="var(--mono, monospace)" fill="var(--accent)" letterSpacing="0.12em">
              2 · Q, K, V — SPLIT INTO 2 HEADS (dim {DK} each)
            </text>

            {/* Render Q, K, V groups side by side. Each group: heads stacked horizontally */}
            {['Q', 'K', 'V'].map((label, gi) => {
              const groupX = left + gi * (qkvGroupW + colGap);
              const headsData = label === 'Q' ? data.Qh : label === 'K' ? data.Kh : data.Vh;
              return (
                <g key={label}>
                  <text
                    x={groupX}
                    y={qkvY - 2}
                    fontSize="11"
                    fontFamily="var(--serif, serif)"
                    fontStyle="italic"
                    fontWeight={700}
                    fill="var(--text-dim)"
                  >
                    {label}
                  </text>
                  {headsData.map((Mh, h) => {
                    const headX = groupX + 14 + h * (DK * (qkvCellW + 2) + 12);
                    return (
                      <g key={h}>
                        <text
                          x={headX + (DK * (qkvCellW + 2)) / 2}
                          y={qkvY + 2}
                          textAnchor="middle"
                          fontSize="9"
                          fontFamily="var(--mono, monospace)"
                          fill={headColors[h]}
                          letterSpacing="0.08em"
                        >
                          h{h}
                        </text>
                        {Mh.map((row, ri) => (
                          <g key={ri}>
                            {row.map((v, ci) => (
                              <g key={ci}>
                                <rect
                                  x={headX + ci * (qkvCellW + 2)}
                                  y={qkvY + 10 + ri * (qkvCellH + 3)}
                                  width={qkvCellW}
                                  height={qkvCellH}
                                  rx={2}
                                  fill={cellFill(v, 2)}
                                  stroke={headColors[h]}
                                  strokeWidth={0.6}
                                  opacity={0.95}
                                />
                                <text
                                  x={headX + ci * (qkvCellW + 2) + qkvCellW / 2}
                                  y={qkvY + 10 + ri * (qkvCellH + 3) + qkvCellH / 2 + 3}
                                  textAnchor="middle"
                                  fontSize="8"
                                  fontFamily="var(--mono, monospace)"
                                  fill="var(--text-main)"
                                >
                                  {fmt(v)}
                                </text>
                              </g>
                            ))}
                          </g>
                        ))}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>

          {/* Arrow down to scores */}
          <line
            x1={left + 60}
            y1={qkvY + N * (qkvCellH + 3) + 18}
            x2={left + 60}
            y2={scoresY - 18}
            stroke={reached(2) ? 'var(--accent)' : 'var(--text-dim)'}
            strokeWidth={reached(2) ? 1.6 : 1}
            markerEnd={reached(2) ? 'url(#tbf-arrow-accent)' : 'url(#tbf-arrow)'}
            opacity={0.85}
          />
          <text
            x={left + 70}
            y={qkvY + N * (qkvCellH + 3) + 32}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill={reached(2) ? 'var(--accent)' : 'var(--text-dim)'}
          >
            Q · Kᵀ / √dₖ
          </text>

          {/* ========== 3. SCORES + 4. SOFTMAX + 5. ATTN·V ========== */}
          {/* Per head, three grids: scores, softmax weights, then V used. */}
          {data.scoresH.map((scoresM, h) => {
            const baseX = left + h * 350;
            const headLabel = `head ${h}`;
            const wM = data.attnH[h];
            const VhM = data.Vh[h];
            return (
              <g key={h}>
                {/* Scores grid */}
                <g opacity={reached(2) ? 1 : 0.3}>
                  <text
                    x={baseX}
                    y={scoresY - 14}
                    fontSize="10"
                    fontFamily="var(--mono, monospace)"
                    fill={headColors[h]}
                    letterSpacing="0.12em"
                  >
                    3 · SCORES {headLabel}
                  </text>
                  <HeatGrid
                    x={baseX}
                    y={scoresY}
                    M={scoresM}
                    cellSize={scoreCell}
                    label="Q·Kᵀ/√dₖ"
                    headColor={headColors[h]}
                  />
                </g>

                {/* Arrow scores -> softmax */}
                <line
                  x1={baseX + N * scoreCell + 4}
                  y1={scoresY + (N * scoreCell) / 2}
                  x2={baseX + N * scoreCell + 30}
                  y2={scoresY + (N * scoreCell) / 2}
                  stroke={reached(3) ? headColors[h] : 'var(--text-dim)'}
                  strokeWidth={1.4}
                  markerEnd={reached(3) ? (h === 0 ? 'url(#tbf-arrow-accent)' : 'url(#tbf-arrow-pink)') : 'url(#tbf-arrow)'}
                />
                <text
                  x={baseX + N * scoreCell + 17}
                  y={scoresY + (N * scoreCell) / 2 - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--mono, monospace)"
                  fill={reached(3) ? headColors[h] : 'var(--text-dim)'}
                  letterSpacing="0.1em"
                >
                  softmax
                </text>

                {/* Softmax weights */}
                <g opacity={reached(3) ? 1 : 0.3}>
                  <text
                    x={baseX + N * scoreCell + 38}
                    y={scoresY - 14}
                    fontSize="10"
                    fontFamily="var(--mono, monospace)"
                    fill={headColors[h]}
                    letterSpacing="0.12em"
                  >
                    4 · ATTENTION WEIGHTS
                  </text>
                  <HeatGrid
                    x={baseX + N * scoreCell + 38}
                    y={scoresY}
                    M={wM}
                    cellSize={scoreCell}
                    weights
                    label="rows sum to 1"
                    headColor={headColors[h]}
                  />
                </g>

                {/* Arrow softmax -> attn·V */}
                <line
                  x1={baseX + 2 * (N * scoreCell + 38) - 38 + 4}
                  y1={scoresY + (N * scoreCell) / 2}
                  x2={baseX + 2 * (N * scoreCell + 38) - 38 + 30}
                  y2={scoresY + (N * scoreCell) / 2}
                  stroke={reached(4) ? headColors[h] : 'var(--text-dim)'}
                  strokeWidth={1.4}
                  markerEnd={reached(4) ? (h === 0 ? 'url(#tbf-arrow-accent)' : 'url(#tbf-arrow-pink)') : 'url(#tbf-arrow)'}
                />
                <text
                  x={baseX + 2 * (N * scoreCell + 38) - 38 + 17}
                  y={scoresY + (N * scoreCell) / 2 - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--mono, monospace)"
                  fill={reached(4) ? headColors[h] : 'var(--text-dim)'}
                  letterSpacing="0.1em"
                >
                  · V
                </text>

                {/* V grid */}
                <g opacity={reached(4) ? 1 : 0.3}>
                  <text
                    x={baseX + 2 * (N * scoreCell + 38) - 38 + 36}
                    y={scoresY - 14}
                    fontSize="10"
                    fontFamily="var(--mono, monospace)"
                    fill={headColors[h]}
                    letterSpacing="0.12em"
                  >
                    5 · V (head {h})
                  </text>
                  {VhM.map((row, ri) =>
                    row.map((v, ci) => (
                      <g key={`${ri}-${ci}`}>
                        <rect
                          x={baseX + 2 * (N * scoreCell + 38) - 38 + 36 + ci * scoreCell}
                          y={scoresY + ri * scoreCell}
                          width={scoreCell - 1}
                          height={scoreCell - 1}
                          rx={1.5}
                          fill={cellFill(v, 2)}
                          stroke="var(--border)"
                          strokeWidth={0.5}
                        />
                        <text
                          x={baseX + 2 * (N * scoreCell + 38) - 38 + 36 + ci * scoreCell + scoreCell / 2 - 0.5}
                          y={scoresY + ri * scoreCell + scoreCell / 2 + 3}
                          textAnchor="middle"
                          fontSize="8"
                          fontFamily="var(--mono, monospace)"
                          fill="var(--text-main)"
                        >
                          {fmt(v)}
                        </text>
                      </g>
                    ))
                  )}
                </g>
              </g>
            );
          })}

          {/* Down arrow to attn out */}
          <line
            x1={left + 60}
            y1={scoresY + N * scoreCell + 8}
            x2={left + 60}
            y2={avY - 18}
            stroke={reached(4) ? 'var(--accent)' : 'var(--text-dim)'}
            strokeWidth={reached(4) ? 1.6 : 1}
            markerEnd={reached(4) ? 'url(#tbf-arrow-accent)' : 'url(#tbf-arrow)'}
            opacity={0.85}
          />
          <text
            x={left + 70}
            y={scoresY + N * scoreCell + 24}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill={reached(4) ? 'var(--accent)' : 'var(--text-dim)'}
          >
            concat heads → 4-dim
          </text>

          {/* ========== Attention output (concatenated) ========== */}
          <g opacity={reached(4) ? 1 : 0.3}>
            <text x={left} y={avY - 14} fontSize="11" fontFamily="var(--mono, monospace)" fill="var(--accent)" letterSpacing="0.12em">
              5 · ATTENTION OUTPUT (heads concatenated)
            </text>
            {data.attnOut.map((row, i) => (
              <g key={i}>
                <text
                  x={left + tokenLabelW - 8}
                  y={avY + i * (cellH + 4) + cellH / 2 + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight={700}
                  fill="var(--text-main)"
                >
                  {TOKENS[i]}
                </text>
                <CellRow x={inputBlockX} y={avY + i * (cellH + 4)} cells={row} cellW={cellW} cellH={cellH} range={2.5} />
              </g>
            ))}
          </g>

          {/* Residual line from input to resnorm1 */}
          <path
            d={`M ${W - 30} ${inputY + 8}
                C ${W - 8} ${inputY + 8},
                  ${W - 8} ${rnY - 20},
                  ${W - 30} ${rnY - 20}`}
            fill="none"
            stroke={reached(5) ? 'var(--hue-pink, #ff66cc)' : 'var(--border)'}
            strokeWidth={reached(5) ? 1.6 : 1}
            strokeDasharray="4 3"
            opacity={0.85}
          />
          <text
            x={W - 16}
            y={(inputY + rnY) / 2}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill={reached(5) ? 'var(--hue-pink, #ff66cc)' : 'var(--text-dim)'}
            transform={`rotate(90 ${W - 16} ${(inputY + rnY) / 2})`}
          >
            residual x
          </text>

          {/* Arrow attn out -> resnorm */}
          <line
            x1={left + 60}
            y1={avY + N * (cellH + 4) + 6}
            x2={left + 60}
            y2={rnY - 20}
            stroke={reached(5) ? 'var(--hue-pink, #ff66cc)' : 'var(--text-dim)'}
            strokeWidth={reached(5) ? 1.6 : 1}
            markerEnd={reached(5) ? 'url(#tbf-arrow-pink)' : 'url(#tbf-arrow)'}
            opacity={0.85}
          />

          {/* ========== 6. Residual + LayerNorm 1 ========== */}
          <g opacity={reached(5) ? 1 : 0.3}>
            <text x={left} y={rnY - 14} fontSize="11" fontFamily="var(--mono, monospace)" fill="var(--hue-pink, #ff66cc)" letterSpacing="0.12em">
              6 · RESIDUAL + LAYERNORM   h = LN(x + AttnOut)
            </text>
            {data.norm1.map((row, i) => (
              <g key={i}>
                <text
                  x={left + tokenLabelW - 8}
                  y={rnY + i * (cellH + 4) + cellH / 2 + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight={700}
                  fill="var(--text-main)"
                >
                  {TOKENS[i]}
                </text>
                <CellRow x={inputBlockX} y={rnY + i * (cellH + 4)} cells={row} cellW={cellW} cellH={cellH} range={2} />
              </g>
            ))}
          </g>

          {/* Arrow rnorm -> ffn */}
          <line
            x1={left + 60}
            y1={rnY + N * (cellH + 4) + 6}
            x2={left + 60}
            y2={ffnY - 26}
            stroke={reached(6) ? 'var(--hue-sky, #5ecbff)' : 'var(--text-dim)'}
            strokeWidth={reached(6) ? 1.6 : 1}
            markerEnd={reached(6) ? 'url(#tbf-arrow-sky)' : 'url(#tbf-arrow)'}
            opacity={0.85}
          />

          {/* ========== 7. FFN ========== */}
          <g opacity={reached(6) ? 1 : 0.3}>
            <text x={left} y={ffnY - 14} fontSize="11" fontFamily="var(--mono, monospace)" fill="var(--hue-sky, #5ecbff)" letterSpacing="0.12em">
              7 · FEED-FORWARD   Linear → GELU → Linear
            </text>

            {/* Show pre-activation (8 cols), GELU, then output (4 cols) as three stacked banks */}
            {[0, 1, 2].map((rowIdx) => {
              const yRow = ffnY + rowIdx * (cellH + 4);
              const pre = data.hPre[rowIdx];
              const act = data.hAct[rowIdx];
              const out = data.ffnOut[rowIdx];
              const cellSm = 16;
              const stripStart = inputBlockX;
              const w1Block = pre.length * (cellSm + 2);
              const geluBlockX = stripStart + w1Block + 28;
              const outBlockX = geluBlockX + pre.length * (cellSm + 2) + 28;
              return (
                <g key={rowIdx}>
                  <text
                    x={left + tokenLabelW - 8}
                    y={yRow + cellH / 2 + 4}
                    textAnchor="end"
                    fontSize="11"
                    fontFamily="var(--serif, serif)"
                    fontStyle="italic"
                    fontWeight={700}
                    fill="var(--text-main)"
                  >
                    {TOKENS[rowIdx]}
                  </text>
                  {/* W1 output: 8 cells */}
                  {pre.map((v, j) => (
                    <rect
                      key={j}
                      x={stripStart + j * (cellSm + 2)}
                      y={yRow + 2}
                      width={cellSm}
                      height={cellH - 4}
                      rx={2}
                      fill={cellFill(v, 3)}
                      stroke="var(--hue-sky, #5ecbff)"
                      strokeWidth={0.5}
                      opacity={0.9}
                    />
                  ))}
                  {rowIdx === 0 && (
                    <text
                      x={stripStart + w1Block / 2}
                      y={ffnY - 2}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="var(--mono, monospace)"
                      fill="var(--text-dim)"
                    >
                      W₁·h (4d=8)
                    </text>
                  )}
                  {/* arrow */}
                  <line
                    x1={stripStart + w1Block + 4}
                    y1={yRow + cellH / 2}
                    x2={geluBlockX - 4}
                    y2={yRow + cellH / 2}
                    stroke="var(--hue-sky, #5ecbff)"
                    strokeWidth={1}
                    markerEnd="url(#tbf-arrow-sky)"
                  />
                  {rowIdx === 0 && (
                    <text
                      x={(stripStart + w1Block + geluBlockX) / 2}
                      y={ffnY - 2}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="var(--mono, monospace)"
                      fill="var(--hue-sky, #5ecbff)"
                    >
                      GELU
                    </text>
                  )}
                  {/* GELU cells */}
                  {act.map((v, j) => (
                    <rect
                      key={j}
                      x={geluBlockX + j * (cellSm + 2)}
                      y={yRow + 2}
                      width={cellSm}
                      height={cellH - 4}
                      rx={2}
                      fill={cellFill(v, 3)}
                      stroke="var(--hue-sky, #5ecbff)"
                      strokeWidth={0.6}
                    />
                  ))}
                  {/* arrow */}
                  <line
                    x1={geluBlockX + pre.length * (cellSm + 2) + 4}
                    y1={yRow + cellH / 2}
                    x2={outBlockX - 4}
                    y2={yRow + cellH / 2}
                    stroke="var(--hue-sky, #5ecbff)"
                    strokeWidth={1}
                    markerEnd="url(#tbf-arrow-sky)"
                  />
                  {rowIdx === 0 && (
                    <text
                      x={(geluBlockX + pre.length * (cellSm + 2) + outBlockX) / 2}
                      y={ffnY - 2}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="var(--mono, monospace)"
                      fill="var(--hue-sky, #5ecbff)"
                    >
                      W₂
                    </text>
                  )}
                  {/* Output 4 cells */}
                  {out.map((v, j) => (
                    <g key={j}>
                      <rect
                        x={outBlockX + j * (cellW + 2)}
                        y={yRow}
                        width={cellW}
                        height={cellH}
                        rx={2}
                        fill={cellFill(v, 2.5)}
                        stroke="var(--border)"
                        strokeWidth={0.6}
                      />
                      <text
                        x={outBlockX + j * (cellW + 2) + cellW / 2}
                        y={yRow + cellH / 2 + 3}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="var(--mono, monospace)"
                        fill="var(--text-main)"
                      >
                        {fmt(v)}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
          </g>

          {/* Residual from norm1 to resnorm2 (right side) */}
          <path
            d={`M ${W - 30} ${rnY + 8}
                C ${W - 8} ${rnY + 8},
                  ${W - 8} ${outY - 20},
                  ${W - 30} ${outY - 20}`}
            fill="none"
            stroke={reached(7) ? 'var(--hue-pink, #ff66cc)' : 'var(--border)'}
            strokeWidth={reached(7) ? 1.6 : 1}
            strokeDasharray="4 3"
            opacity={0.85}
          />
          <text
            x={W - 16}
            y={(rnY + outY) / 2}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill={reached(7) ? 'var(--hue-pink, #ff66cc)' : 'var(--text-dim)'}
            transform={`rotate(90 ${W - 16} ${(rnY + outY) / 2})`}
          >
            residual h
          </text>

          {/* arrow ffn -> resnorm2 */}
          <line
            x1={left + 60}
            y1={ffnY + N * (cellH + 4) + 6}
            x2={left + 60}
            y2={outY - 20}
            stroke={reached(7) ? 'var(--hue-pink, #ff66cc)' : 'var(--text-dim)'}
            strokeWidth={reached(7) ? 1.6 : 1}
            markerEnd={reached(7) ? 'url(#tbf-arrow-pink)' : 'url(#tbf-arrow)'}
            opacity={0.85}
          />

          {/* ========== 8. Final residual + LN ========== */}
          <g opacity={reached(7) ? 1 : 0.3}>
            <text x={left} y={outY - 14} fontSize="11" fontFamily="var(--mono, monospace)" fill="var(--hue-pink, #ff66cc)" letterSpacing="0.12em">
              8 · OUTPUT   y = LN(h + FFN(h))
            </text>
            {data.norm2.map((row, i) => (
              <g key={i}>
                <text
                  x={left + tokenLabelW - 8}
                  y={outY + i * (cellH + 4) + cellH / 2 + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight={700}
                  fill="var(--text-main)"
                >
                  {TOKENS[i]}
                </text>
                <CellRow x={inputBlockX} y={outY + i * (cellH + 4)} cells={row} cellW={cellW} cellH={cellH} range={2} />
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>
            Stage {stage + 1}/{STAGES.length}
          </span>
          <span className="mlviz-val">{current.name}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-val" style={{ fontFamily: 'inherit', fontWeight: 400, color: 'var(--text-dim)' }}>
            {current.detail}
          </span>
        </div>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleStep}
            disabled={running || stage >= STAGES.length - 1}
          >
            <ChevronRight size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleRun}
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
          step = one transformer sub-block · positive values = accent · negative = pink · weights heat-shaded
        </div>
      </div>
    </div>
  );
}
