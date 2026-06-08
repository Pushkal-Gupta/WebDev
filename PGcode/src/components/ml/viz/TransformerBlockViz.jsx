import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import './MLViz.css';

const W = 540;
const H_COLLAPSED = 540;
const H_EXPANDED = 760;

const TOKENS_DEFAULT = ['The', 'cat', 'sat', 'down'];
const D_MODEL = 8;

const STEP_DELAY = 480;

// Component identifiers — used by both the static drawing and the animation sequencer.
const COMPONENTS = {
  embed: {
    label: 'Token embeddings',
    desc: 'Each token is mapped to a d_model = 8 vector. Cells show the learned coordinates.',
    color: 'var(--text-dim)',
  },
  pe: {
    label: 'Positional encoding (+PE)',
    desc: 'Sinusoidal position vectors are added to embeddings so the block can tell token order apart.',
    color: 'var(--hue-mint, #7be0c0)',
  },
  attn: {
    label: 'Multi-head self-attention',
    desc: 'Project to Q, K, V. Score each query against every key, softmax, then take the weighted sum of values.',
    color: 'var(--accent)',
  },
  addnorm1: {
    label: 'Add and LayerNorm',
    desc: 'Residual skip from the input plus per-token normalization. Keeps gradients flowing and activations centred.',
    color: 'var(--hue-pink, #ff66cc)',
  },
  ffn: {
    label: 'Position-wise feed-forward',
    desc: 'Linear (d_model -> 4*d_model) -> ReLU -> Linear (4*d_model -> d_model). Applied to every token independently.',
    color: 'var(--hue-sky, #5ecbff)',
  },
  addnorm2: {
    label: 'Add and LayerNorm',
    desc: 'Second residual + LayerNorm. The output has the same shape as the input — blocks stack cleanly.',
    color: 'var(--hue-pink, #ff66cc)',
  },
  out: {
    label: 'Block output',
    desc: 'Contextualized token representations. Feed into the next encoder block, or to a final head.',
    color: 'var(--text-main)',
  },
};

const ANIMATION_ORDER = ['embed', 'pe', 'attn', 'addnorm1', 'ffn', 'addnorm2', 'out'];

// Deterministic-ish pseudo-random for cell colors so embeddings look stable across renders.
function seeded(token, j) {
  let h = 0;
  for (let i = 0; i < token.length; i++) {
    h = (h * 31 + token.charCodeAt(i)) | 0;
  }
  h = (h ^ (j * 2654435761)) | 0;
  const v = ((h >>> 0) % 1000) / 1000;
  return v;
}

function cellColor(token, j, mixWithPE = false) {
  const v = seeded(token, j);
  const pe = mixWithPE ? (Math.sin(j + token.length) + 1) / 2 : 0;
  const w = mixWithPE ? (v + pe) / 2 : v;
  // map [0,1] -> mix between two theme tones
  const a = 0.18 + w * 0.55;
  return `rgba(var(--accent-rgb, 0, 255, 245), ${a.toFixed(2)})`;
}

function cellColorPE(token, j) {
  const pe = (Math.sin(j * 0.6 + token.length * 0.4) + 1) / 2;
  const a = 0.18 + pe * 0.55;
  // mint for PE
  return `rgba(123, 224, 192, ${a.toFixed(2)})`;
}

// One row of embedding cells.
function EmbedRow({ token, y, mixPE, highlight }) {
  const cellW = 22;
  const cellH = 18;
  const startX = 80;
  return (
    <g opacity={highlight ? 1 : 0.85}>
      <text
        x={startX - 10}
        y={y + cellH / 2 + 4}
        textAnchor="end"
        fontSize="11"
        fontFamily="var(--serif, serif)"
        fontStyle="italic"
        fontWeight="700"
        fill="var(--text-main)"
      >
        {token || '·'}
      </text>
      {Array.from({ length: D_MODEL }).map((_, j) => (
        <rect
          key={j}
          x={startX + j * (cellW + 2)}
          y={y}
          width={cellW}
          height={cellH}
          rx={2}
          ry={2}
          fill={mixPE ? cellColorPE(token || '·', j) : cellColor(token || '·', j)}
          stroke="var(--border)"
          strokeWidth={0.6}
        />
      ))}
    </g>
  );
}

// Decorative arrow with optional active glow.
function Arrow({ x1, y1, x2, y2, active, color = 'var(--text-dim)' }) {
  const c = active ? 'var(--accent)' : color;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={c}
      strokeWidth={active ? 2 : 1.2}
      markerEnd={active ? 'url(#tb-arrow-active)' : 'url(#tb-arrow)'}
      opacity={active ? 1 : 0.7}
    />
  );
}

// Inline expanded attention internals: Q K V projections, scores, softmax, weighted sum.
function AttentionInternals({ x, y, w, lit }) {
  const colW = 56;
  const gap = 14;
  const rowH = 16;
  const heads = 3; // visual heads
  const headColors = ['var(--accent)', 'var(--hue-pink, #ff66cc)', 'var(--hue-sky, #5ecbff)'];

  const cx0 = x + 16;
  const cy = y + 30;

  return (
    <g>
      {/* container */}
      <rect
        x={x}
        y={y}
        width={w}
        height={180}
        rx={10}
        ry={10}
        fill="var(--surface)"
        stroke="var(--accent)"
        strokeWidth={1.2}
        opacity={0.95}
        strokeDasharray="3 3"
      />
      <text
        x={x + 10}
        y={y + 14}
        fontSize="10"
        fontFamily="var(--mono, monospace)"
        fill="var(--accent)"
        letterSpacing="0.14em"
      >
        EXPANDED — SCALED DOT-PRODUCT ATTENTION
      </text>

      {/* Q, K, V projections — three little stacks of cells */}
      {['Q', 'K', 'V'].map((label, i) => {
        const cx = cx0 + i * (colW + gap);
        return (
          <g key={label} opacity={lit ? 1 : 0.9}>
            <text
              x={cx + colW / 2}
              y={cy - 4}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              fontWeight="700"
              fill={headColors[i]}
            >
              {label}
            </text>
            {[0, 1, 2, 3].map((row) => (
              <rect
                key={row}
                x={cx}
                y={cy + row * (rowH + 2)}
                width={colW}
                height={rowH}
                rx={2}
                ry={2}
                fill={headColors[i]}
                opacity={0.18 + row * 0.06}
                stroke="var(--border)"
                strokeWidth={0.6}
              />
            ))}
            <text
              x={cx + colW / 2}
              y={cy + 4 * (rowH + 2) + 12}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
            >
              x·W{label}
            </text>
          </g>
        );
      })}

      {/* Q·K^T scores grid */}
      {(() => {
        const sx = cx0 + 3 * (colW + gap) + 8;
        const cellS = 14;
        return (
          <g>
            <text
              x={sx + (cellS * 4) / 2}
              y={cy - 4}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
            >
              QKᵀ/√d
            </text>
            {[0, 1, 2, 3].map((r) =>
              [0, 1, 2, 3].map((c) => {
                const s = (Math.sin((r + 1) * 1.3 + (c + 1) * 0.7) + 1) / 2;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={sx + c * (cellS + 1)}
                    y={cy + r * (cellS + 1)}
                    width={cellS}
                    height={cellS}
                    rx={1.5}
                    fill={`rgba(var(--accent-rgb, 0, 255, 245), ${(0.1 + s * 0.55).toFixed(2)})`}
                    stroke="var(--border)"
                    strokeWidth={0.5}
                  />
                );
              })
            )}
            <text
              x={sx + (cellS * 4) / 2}
              y={cy + 4 * (cellS + 1) + 12}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
            >
              scores
            </text>
          </g>
        );
      })()}

      {/* softmax arrow */}
      {(() => {
        const sx = cx0 + 3 * (colW + gap) + 8 + 4 * (14 + 1) + 8;
        return (
          <g>
            <text
              x={sx + 14}
              y={cy + 30}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--accent)"
              letterSpacing="0.12em"
            >
              softmax
            </text>
            <line
              x1={sx}
              y1={cy + 36}
              x2={sx + 28}
              y2={cy + 36}
              stroke="var(--accent)"
              strokeWidth={1.4}
              markerEnd="url(#tb-arrow-active)"
            />
            <text
              x={sx + 14}
              y={cy + 52}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
            >
              · V
            </text>
          </g>
        );
      })()}

      {/* output cells */}
      {(() => {
        const sx = cx0 + 3 * (colW + gap) + 8 + 4 * (14 + 1) + 44;
        const cellS = 14;
        return (
          <g>
            <text
              x={sx + (cellS * 2) / 2}
              y={cy - 4}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--accent)"
            >
              out
            </text>
            {[0, 1, 2, 3].map((r) => (
              <rect
                key={r}
                x={sx}
                y={cy + r * (cellS + 1)}
                width={cellS * 2 + 1}
                height={cellS}
                rx={1.5}
                fill={`rgba(var(--accent-rgb, 0, 255, 245), ${(0.2 + r * 0.12).toFixed(2)})`}
                stroke="var(--accent)"
                strokeWidth={0.7}
              />
            ))}
            <text
              x={sx + cellS}
              y={cy + 4 * (cellS + 1) + 12}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
            >
              Σ α·V
            </text>
          </g>
        );
      })()}

      {/* small head badge */}
      <g>
        {Array.from({ length: heads }).map((_, i) => (
          <rect
            key={i}
            x={x + w - 14 - i * 9}
            y={y + 8}
            width={7}
            height={7}
            rx={1.5}
            fill={headColors[i]}
            opacity={0.85}
          />
        ))}
        <text
          x={x + w - 14 - heads * 9 - 4}
          y={y + 14}
          textAnchor="end"
          fontSize="9"
          fontFamily="var(--mono, monospace)"
          fill="var(--text-dim)"
        >
          heads
        </text>
      </g>
    </g>
  );
}

// Inline expanded FFN: cells widen, ReLU bar, then narrow back.
function FFNDetail({ x, y, w, lit }) {
  const inN = 4;
  const midN = 10;
  const outN = 4;
  const cell = 12;
  const gap = 2;
  const rowY = y + 26;
  const inW = inN * (cell + gap);
  const midW = midN * (cell + gap);
  const outW = outN * (cell + gap);
  const inX = x + 12;
  const midX = inX + inW + 28;
  const outX = midX + midW + 28;
  return (
    <g opacity={lit ? 1 : 0.95}>
      {/* container */}
      <rect
        x={x}
        y={y}
        width={w}
        height={70}
        rx={10}
        ry={10}
        fill="var(--surface)"
        stroke="var(--hue-sky, #5ecbff)"
        strokeWidth={1.2}
        opacity={0.95}
        strokeDasharray="3 3"
      />
      <text
        x={x + 10}
        y={y + 14}
        fontSize="10"
        fontFamily="var(--mono, monospace)"
        fill="var(--hue-sky, #5ecbff)"
        letterSpacing="0.14em"
      >
        FEED-FORWARD — Linear → ReLU → Linear
      </text>

      {/* input cells (d_model) */}
      {Array.from({ length: inN }).map((_, i) => (
        <rect
          key={`i${i}`}
          x={inX + i * (cell + gap)}
          y={rowY}
          width={cell}
          height={cell * 2}
          rx={2}
          fill="rgba(94, 203, 255, 0.25)"
          stroke="var(--border)"
          strokeWidth={0.6}
        />
      ))}
      <text x={inX + inW / 2} y={rowY + cell * 2 + 12} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)">
        d
      </text>

      {/* arrow + Linear label */}
      <line x1={inX + inW + 4} y1={rowY + cell} x2={midX - 4} y2={rowY + cell} stroke="var(--hue-sky, #5ecbff)" strokeWidth={1.4} markerEnd="url(#tb-arrow-sky)" />
      <text x={(inX + inW + midX) / 2} y={rowY - 2} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--hue-sky, #5ecbff)">
        W₁ · x
      </text>

      {/* hidden cells (4*d_model — bigger band) */}
      {Array.from({ length: midN }).map((_, i) => (
        <rect
          key={`m${i}`}
          x={midX + i * (cell + gap)}
          y={rowY - 4}
          width={cell}
          height={cell * 2 + 8}
          rx={2}
          fill="rgba(94, 203, 255, 0.45)"
          stroke="var(--hue-sky, #5ecbff)"
          strokeWidth={0.6}
        />
      ))}
      <text x={midX + midW / 2} y={rowY + cell * 2 + 12} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)">
        4d (ReLU)
      </text>

      {/* arrow + Linear label */}
      <line x1={midX + midW + 4} y1={rowY + cell} x2={outX - 4} y2={rowY + cell} stroke="var(--hue-sky, #5ecbff)" strokeWidth={1.4} markerEnd="url(#tb-arrow-sky)" />
      <text x={(midX + midW + outX) / 2} y={rowY - 2} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--hue-sky, #5ecbff)">
        W₂ · h
      </text>

      {/* output cells back to d_model */}
      {Array.from({ length: outN }).map((_, i) => (
        <rect
          key={`o${i}`}
          x={outX + i * (cell + gap)}
          y={rowY}
          width={cell}
          height={cell * 2}
          rx={2}
          fill="rgba(94, 203, 255, 0.25)"
          stroke="var(--border)"
          strokeWidth={0.6}
        />
      ))}
      <text x={outX + outW / 2} y={rowY + cell * 2 + 12} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)">
        d
      </text>
    </g>
  );
}

export default function TransformerBlockViz() {
  const [tokens, setTokens] = useState(TOKENS_DEFAULT.join(' '));
  const [expanded, setExpanded] = useState(false);
  const [lit, setLit] = useState(new Set());
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setRunning(false);
    setLit(new Set());
  }, []);

  const handleAnimate = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(true);
    setLit(new Set());
    let i = 0;
    const tick = () => {
      setLit((prev) => {
        const next = new Set(prev);
        next.add(ANIMATION_ORDER[i]);
        return next;
      });
      i += 1;
      if (i >= ANIMATION_ORDER.length) {
        setRunning(false);
        return;
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, 60);
  }, []);

  const isLit = (id) => lit.has(id);
  const isSel = (id) => selected === id;
  const showActive = (id) => isLit(id) || isSel(id);

  const tokenList = tokens
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  while (tokenList.length < 4) tokenList.push('·');

  const H = expanded ? H_EXPANDED : H_COLLAPSED;

  // y coordinates for the stack (bottom -> top) — adjusted when expanded
  const embedY = H - 70;          // bottom row
  const peY = embedY - 56;        // +PE label
  const attnY = peY - 60;         // attention box top
  const attnH = expanded ? 200 : 60;
  const addNorm1Y = attnY - attnH - 30;
  const ffnY = addNorm1Y - 50;
  const ffnH = expanded ? 90 : 50;
  const addNorm2Y = ffnY - ffnH - 30;
  const outY = addNorm2Y - 50;

  const stripX = 64;
  const stripW = W - 128;
  const centerX = W / 2;

  const desc = selected ? COMPONENTS[selected]?.desc : null;
  const descTitle = selected ? COMPONENTS[selected]?.label : null;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" style={{ maxWidth: 560, aspectRatio: `${W} / ${H}` }}>
          <defs>
            <marker id="tb-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
            </marker>
            <marker id="tb-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker id="tb-arrow-sky" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-sky, #5ecbff)" />
            </marker>
          </defs>

          {/* Side rail labels */}
          <text x={12} y={24} fontSize="10" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.14em">
            ENCODER BLOCK
          </text>
          <text x={W - 12} y={24} fontSize="10" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" textAnchor="end" letterSpacing="0.14em">
            d_model = {D_MODEL}
          </text>

          {/* ===== OUTPUT (top) ===== */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setSelected(selected === 'out' ? null : 'out')}
            opacity={showActive('out') ? 1 : 0.9}
          >
            <rect
              x={stripX}
              y={outY}
              width={stripW}
              height={32}
              rx={6}
              fill={showActive('out') ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.12)' : 'var(--surface)'}
              stroke={showActive('out') ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={isSel('out') ? 2 : 1}
            />
            <text x={centerX} y={outY + 20} textAnchor="middle" fontSize="11" fontFamily="var(--mono, monospace)" fill="var(--text-main)" letterSpacing="0.1em">
              OUTPUT  ·  same shape as input
            </text>
          </g>
          <Arrow x1={centerX} y1={addNorm2Y} x2={centerX} y2={outY} active={showActive('out')} />

          {/* ===== Add + LayerNorm 2 ===== */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setSelected(selected === 'addnorm2' ? null : 'addnorm2')}
            opacity={showActive('addnorm2') ? 1 : 0.9}
          >
            <rect
              x={stripX}
              y={addNorm2Y - 30}
              width={stripW}
              height={30}
              rx={6}
              fill={showActive('addnorm2') ? 'rgba(255, 102, 204, 0.14)' : 'var(--surface)'}
              stroke={showActive('addnorm2') ? 'var(--hue-pink, #ff66cc)' : 'var(--border)'}
              strokeWidth={isSel('addnorm2') ? 2 : 1}
            />
            <text x={centerX} y={addNorm2Y - 11} textAnchor="middle" fontSize="11" fontFamily="var(--mono, monospace)" fill="var(--text-main)">
              Add &amp; LayerNorm
            </text>
            <circle cx={stripX + 18} cy={addNorm2Y - 15} r={6} fill="none" stroke="var(--hue-pink, #ff66cc)" strokeWidth={1.2} />
            <text x={stripX + 18} y={addNorm2Y - 12} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--hue-pink, #ff66cc)">+</text>
          </g>

          {/* residual arc: from addnorm1 around ffn into addnorm2 */}
          <path
            d={`M ${stripX + 8} ${addNorm1Y - 6} C ${stripX - 22} ${addNorm1Y - 6}, ${stripX - 22} ${addNorm2Y - 24}, ${stripX + 8} ${addNorm2Y - 24}`}
            fill="none"
            stroke={showActive('addnorm2') ? 'var(--hue-pink, #ff66cc)' : 'var(--border)'}
            strokeWidth={showActive('addnorm2') ? 1.6 : 1}
            strokeDasharray="4 3"
            opacity={0.85}
          />
          <text
            x={stripX - 30}
            y={(addNorm1Y + addNorm2Y) / 2}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--hue-pink, #ff66cc)"
            opacity={0.85}
          >
            residual
          </text>

          <Arrow x1={centerX} y1={ffnY} x2={centerX} y2={addNorm2Y - 30} active={showActive('addnorm2')} />

          {/* ===== Feed-forward ===== */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setSelected(selected === 'ffn' ? null : 'ffn')}
          >
            {expanded ? (
              <FFNDetail x={stripX} y={ffnY - ffnH} w={stripW} lit={showActive('ffn')} />
            ) : (
              <>
                <rect
                  x={stripX}
                  y={ffnY - ffnH}
                  width={stripW}
                  height={ffnH}
                  rx={10}
                  fill={showActive('ffn') ? 'rgba(94, 203, 255, 0.14)' : 'var(--surface)'}
                  stroke={showActive('ffn') ? 'var(--hue-sky, #5ecbff)' : 'var(--border)'}
                  strokeWidth={isSel('ffn') ? 2 : 1.2}
                />
                <text x={centerX} y={ffnY - ffnH / 2 - 3} textAnchor="middle" fontSize="12" fontFamily="var(--serif, serif)" fontStyle="italic" fontWeight={700} fill="var(--text-main)">
                  Feed-forward
                </text>
                <text x={centerX} y={ffnY - ffnH / 2 + 12} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--hue-sky, #5ecbff)" letterSpacing="0.1em">
                  Linear → ReLU → Linear
                </text>
              </>
            )}
          </g>

          <Arrow x1={centerX} y1={addNorm1Y} x2={centerX} y2={ffnY - ffnH} active={showActive('ffn')} />

          {/* ===== Add + LayerNorm 1 ===== */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setSelected(selected === 'addnorm1' ? null : 'addnorm1')}
            opacity={showActive('addnorm1') ? 1 : 0.9}
          >
            <rect
              x={stripX}
              y={addNorm1Y - 30}
              width={stripW}
              height={30}
              rx={6}
              fill={showActive('addnorm1') ? 'rgba(255, 102, 204, 0.14)' : 'var(--surface)'}
              stroke={showActive('addnorm1') ? 'var(--hue-pink, #ff66cc)' : 'var(--border)'}
              strokeWidth={isSel('addnorm1') ? 2 : 1}
            />
            <text x={centerX} y={addNorm1Y - 11} textAnchor="middle" fontSize="11" fontFamily="var(--mono, monospace)" fill="var(--text-main)">
              Add &amp; LayerNorm
            </text>
            <circle cx={stripX + 18} cy={addNorm1Y - 15} r={6} fill="none" stroke="var(--hue-pink, #ff66cc)" strokeWidth={1.2} />
            <text x={stripX + 18} y={addNorm1Y - 12} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--hue-pink, #ff66cc)">+</text>
          </g>

          {/* residual arc: from after-PE around attention into addnorm1 */}
          <path
            d={`M ${stripX + 8} ${peY + 20} C ${stripX - 22} ${peY + 20}, ${stripX - 22} ${addNorm1Y - 24}, ${stripX + 8} ${addNorm1Y - 24}`}
            fill="none"
            stroke={showActive('addnorm1') ? 'var(--hue-pink, #ff66cc)' : 'var(--border)'}
            strokeWidth={showActive('addnorm1') ? 1.6 : 1}
            strokeDasharray="4 3"
            opacity={0.85}
          />
          <text
            x={stripX - 30}
            y={(peY + addNorm1Y) / 2}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--hue-pink, #ff66cc)"
            opacity={0.85}
          >
            residual
          </text>

          <Arrow x1={centerX} y1={attnY} x2={centerX} y2={addNorm1Y - 30} active={showActive('addnorm1')} />

          {/* ===== Multi-head attention ===== */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setSelected(selected === 'attn' ? null : 'attn')}
          >
            {expanded ? (
              <AttentionInternals x={stripX} y={attnY - attnH} w={stripW} lit={showActive('attn')} />
            ) : (
              <>
                <rect
                  x={stripX}
                  y={attnY - attnH}
                  width={stripW}
                  height={attnH}
                  rx={10}
                  fill={showActive('attn') ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.14)' : 'var(--surface)'}
                  stroke={showActive('attn') ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isSel('attn') ? 2 : 1.2}
                />
                <text x={centerX} y={attnY - attnH / 2 - 3} textAnchor="middle" fontSize="12" fontFamily="var(--serif, serif)" fontStyle="italic" fontWeight={700} fill="var(--text-main)">
                  Multi-head self-attention
                </text>
                <text x={centerX} y={attnY - attnH / 2 + 12} textAnchor="middle" fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--accent)" letterSpacing="0.1em">
                  Q · Kᵀ → softmax → · V
                </text>
              </>
            )}
          </g>

          <Arrow x1={centerX} y1={peY + 16} x2={centerX} y2={attnY - attnH} active={showActive('attn')} />

          {/* ===== +PE label row ===== */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setSelected(selected === 'pe' ? null : 'pe')}
            opacity={showActive('pe') ? 1 : 0.95}
          >
            <rect
              x={stripX + stripW / 2 - 70}
              y={peY}
              width={140}
              height={22}
              rx={11}
              fill={showActive('pe') ? 'rgba(123, 224, 192, 0.18)' : 'var(--surface)'}
              stroke={showActive('pe') ? 'var(--hue-mint, #7be0c0)' : 'var(--border)'}
              strokeWidth={isSel('pe') ? 2 : 1}
            />
            <text x={centerX} y={peY + 15} textAnchor="middle" fontSize="10" fontFamily="var(--mono, monospace)" fill="var(--hue-mint, #7be0c0)" letterSpacing="0.1em">
              + positional encoding
            </text>
            {/* side hint arrow */}
            <line x1={stripX + stripW / 2 + 76} y1={peY + 11} x2={stripX + stripW / 2 + 100} y2={peY + 11} stroke="var(--hue-mint, #7be0c0)" strokeWidth={1.2} markerEnd="url(#tb-arrow)" opacity={0.7} />
            <text x={stripX + stripW / 2 + 104} y={peY + 14} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)">
              sin/cos by pos
            </text>
          </g>

          <Arrow x1={centerX} y1={embedY - 4} x2={centerX} y2={peY} active={showActive('pe')} />

          {/* ===== Embedding row (bottom) ===== */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setSelected(selected === 'embed' ? null : 'embed')}
          >
            <rect
              x={stripX}
              y={embedY - 12}
              width={stripW}
              height={56}
              rx={8}
              fill={showActive('embed') ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.08)' : 'transparent'}
              stroke={isSel('embed') ? 'var(--accent)' : 'transparent'}
              strokeWidth={isSel('embed') ? 1.5 : 0}
              strokeDasharray="3 3"
            />
            {tokenList.map((tok, i) => (
              <EmbedRow
                key={`${tok}-${i}`}
                token={tok}
                y={embedY - 4 + i * 10}
                mixPE={isLit('pe')}
                highlight={showActive('embed') || showActive('pe')}
              />
            ))}
            <text
              x={W - stripX + 6}
              y={embedY + 6}
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              textAnchor="end"
            >
              N=4 × d=8
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-toggles" style={{ borderTop: '1px solid var(--border)' }}>
        {ANIMATION_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={`mlviz-toggle ${selected === id ? 'is-on' : ''}`}
            style={{ '--toggle-color': COMPONENTS[id].color }}
            onClick={() => setSelected(selected === id ? null : id)}
          >
            <span className="mlviz-toggle-dot" />
            <span>{COMPONENTS[id].label}</span>
          </button>
        ))}
      </div>

      {desc && (
        <div className="mlviz-readout">
          <div className="mlviz-row">
            <span className="mlviz-tag" style={{ color: COMPONENTS[selected].color, minWidth: 0 }}>
              {descTitle}
            </span>
          </div>
          <div className="mlviz-row">
            <span className="mlviz-val" style={{ fontFamily: 'inherit', fontWeight: 400, color: 'var(--text-dim)' }}>
              {desc}
            </span>
          </div>
        </div>
      )}

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontStyle: 'normal', fontSize: '0.72rem', letterSpacing: '0.12em' }}>
            TOKENS
          </span>
          <input
            type="text"
            value={tokens}
            onChange={(e) => setTokens(e.target.value)}
            disabled={running}
            className="ah-input"
            style={{ minWidth: 0, flex: 1 }}
            placeholder="The cat sat down"
          />
        </div>
        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleAnimate}
            disabled={running}
          >
            <Play size={13} />
            <span>Animate</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setExpanded((e) => !e)}
            disabled={running}
          >
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{expanded ? 'Collapse' : 'Expand'}</span>
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
        <div className="mlviz-hint">click any sub-block for a description · expand to see Q/K/V and the FFN expansion</div>
      </div>
    </div>
  );
}
