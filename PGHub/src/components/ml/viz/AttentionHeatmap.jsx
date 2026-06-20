import React, { useMemo, useState } from 'react';
import './MLViz.css';

const D_K = 4;
const DEFAULT_TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat'];

/* deterministic 32-bit hash from a string (xmur3) */
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

/* mulberry32 PRNG seeded from hashed token */
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

/* derive 3 small d-dim vectors (Q, K, V) deterministically per token + role */
function deriveVec(token, role) {
  const seed = xmur3(`${role}|${token}`)();
  const rng = mulberry32(seed);
  const arr = new Array(D_K);
  for (let i = 0; i < D_K; i++) {
    // values centered at 0 in roughly [-1, 1]
    arr[i] = Math.round((rng() * 2 - 1) * 100) / 100;
  }
  return arr;
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function softmaxRow(row) {
  const m = Math.max(...row.filter((v) => Number.isFinite(v)));
  const exps = row.map((v) => (Number.isFinite(v) ? Math.exp(v - m) : 0));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

function fmt(n, p = 2) {
  if (!Number.isFinite(n)) return '-';
  return n.toFixed(p);
}

/* small colored vector cell: a row of square chips with intensity from value */
function VecRow({ vec, accent }) {
  const max = Math.max(0.001, ...vec.map((v) => Math.abs(v)));
  return (
    <div className="ah-vrow">
      {vec.map((v, i) => {
        const t = Math.abs(v) / max;
        const positive = v >= 0;
        const bg = positive
          ? `rgba(var(--accent-rgb, 0,255,245), ${0.12 + t * 0.55})`
          : `color-mix(in srgb, var(--hue-pink) ${(0.12 + t * 0.55) * 100}%, transparent)`;
        return (
          <span
            key={i}
            className="ah-chip"
            style={{ background: bg, color: accent ? 'var(--text-main)' : 'var(--text-main)' }}
            title={`${v}`}
          >
            {fmt(v, 2)}
          </span>
        );
      })}
    </div>
  );
}

export default function AttentionHeatmap() {
  const [text, setText] = useState(DEFAULT_TOKENS.join(' '));
  const [causal, setCausal] = useState(false);
  const [hover, setHover] = useState({ r: -1, c: -1 });
  const [pinned, setPinned] = useState({ r: -1, c: -1 });

  const tokens = useMemo(() => {
    const t = text.trim().split(/\s+/).filter(Boolean).slice(0, 10);
    return t.length ? t : DEFAULT_TOKENS;
  }, [text]);

  const { Q, K, V, scores, attn } = useMemo(() => {
    const Q = tokens.map((t) => deriveVec(t, 'Q'));
    const K = tokens.map((t) => deriveVec(t, 'K'));
    const V = tokens.map((t) => deriveVec(t, 'V'));
    const scale = Math.sqrt(D_K);
    const raw = Q.map((q) => K.map((k) => dot(q, k) / scale));
    const masked = raw.map((row, i) =>
      row.map((v, j) => (causal && j > i ? -Infinity : v))
    );
    const attn = masked.map((row) => softmaxRow(row));
    return { Q, K, V, scores: raw, attn };
  }, [tokens, causal]);

  const active = pinned.r >= 0 ? pinned : hover;
  const n = tokens.length;

  // svg layout for heatmap
  const CELL = 48;
  const PAD = 60;
  const W = PAD + n * CELL + 10;
  const H = PAD + n * CELL + 10;

  return (
    <div className="mlviz-wrap ah-wrap">
      <div className="ah-controls">
        <label className="ah-label">Tokens</label>
        <input
          type="text"
          className="ah-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
        <label className="ah-toggle">
          <input
            type="checkbox"
            checked={causal}
            onChange={(e) => setCausal(e.target.checked)}
          />
          <span>Causal mask</span>
        </label>
      </div>

      <div className="ah-grids">
        <div className="ah-grid-block">
          <div className="ah-grid-title">
            <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>Q</span>
            <span className="ah-grid-sub">query embeddings · d={D_K}</span>
          </div>
          <div className="ah-vec-grid">
            {tokens.map((t, i) => (
              <div className="ah-vec-line" key={`q-${i}`}>
                <span className="ah-vec-tok">{t}</span>
                <VecRow vec={Q[i]} accent />
              </div>
            ))}
          </div>
        </div>

        <div className="ah-grid-block">
          <div className="ah-grid-title">
            <span className="mlviz-tag" style={{ color: 'var(--hue-sky, #5ecbff)' }}>K</span>
            <span className="ah-grid-sub">key embeddings · d={D_K}</span>
          </div>
          <div className="ah-vec-grid">
            {tokens.map((t, i) => (
              <div className="ah-vec-line" key={`k-${i}`}>
                <span className="ah-vec-tok">{t}</span>
                <VecRow vec={K[i]} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ah-heat-block">
        <div className="ah-grid-title">
          <span className="mlviz-tag">A</span>
          <span className="ah-grid-sub">
            softmax(QKᵀ / √d) · row sums to 1
          </span>
        </div>
        <div className="ah-heat-stage">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="ah-heat-svg"
            role="img"
            aria-label="Attention heatmap"
          >
            {/* column labels (keys) */}
            {tokens.map((t, j) => (
              <text
                key={`cl-${j}`}
                x={PAD + j * CELL + CELL / 2}
                y={PAD - 14}
                textAnchor="middle"
                fontSize="11"
                fontFamily="var(--mono, monospace)"
                fill={active.c === j ? 'var(--accent)' : 'var(--text-dim)'}
                fontWeight={active.c === j ? 700 : 500}
              >
                {t}
              </text>
            ))}
            {/* column axis title */}
            <text
              x={PAD + (n * CELL) / 2}
              y={PAD - 34}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.16em"
            >
              KEYS (attended to)
            </text>

            {/* row labels (queries) */}
            {tokens.map((t, i) => (
              <text
                key={`rl-${i}`}
                x={PAD - 10}
                y={PAD + i * CELL + CELL / 2 + 4}
                textAnchor="end"
                fontSize="11"
                fontFamily="var(--mono, monospace)"
                fill={active.r === i ? 'var(--accent)' : 'var(--text-dim)'}
                fontWeight={active.r === i ? 700 : 500}
              >
                {t}
              </text>
            ))}
            {/* row axis title */}
            <text
              x={18}
              y={PAD + (n * CELL) / 2}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.16em"
              transform={`rotate(-90 18 ${PAD + (n * CELL) / 2})`}
            >
              QUERIES (asking)
            </text>

            {/* cells */}
            {attn.map((row, i) =>
              row.map((v, j) => {
                const masked = causal && j > i;
                const intensity = masked ? 0 : v;
                const bg = masked
                  ? 'rgba(0,0,0,0.06)'
                  : `rgba(var(--accent-rgb, 0,255,245), ${0.06 + intensity * 0.85})`;
                const isActiveCell = active.r === i && active.c === j;
                const isActiveRow = active.r === i;
                const isActiveCol = active.c === j;
                const textColor =
                  intensity > 0.55 ? 'var(--bg)' : 'var(--text-main)';
                return (
                  <g
                    key={`c-${i}-${j}`}
                    onMouseEnter={() => setHover({ r: i, c: j })}
                    onMouseLeave={() => setHover({ r: -1, c: -1 })}
                    onClick={() =>
                      setPinned((p) =>
                        p.r === i && p.c === j ? { r: -1, c: -1 } : { r: i, c: j }
                      )
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={PAD + j * CELL}
                      y={PAD + i * CELL}
                      width={CELL - 2}
                      height={CELL - 2}
                      rx="4"
                      fill={bg}
                      stroke={
                        isActiveCell
                          ? 'var(--accent)'
                          : isActiveRow || isActiveCol
                            ? 'rgba(var(--accent-rgb, 0,255,245), 0.5)'
                            : 'var(--border)'
                      }
                      strokeWidth={isActiveCell ? 2 : isActiveRow || isActiveCol ? 1.2 : 0.6}
                    />
                    {masked ? (
                      <line
                        x1={PAD + j * CELL + 8}
                        y1={PAD + i * CELL + 8}
                        x2={PAD + j * CELL + CELL - 10}
                        y2={PAD + i * CELL + CELL - 10}
                        stroke="var(--text-dim)"
                        strokeWidth="0.8"
                        opacity="0.5"
                      />
                    ) : (
                      <text
                        x={PAD + j * CELL + (CELL - 2) / 2}
                        y={PAD + i * CELL + (CELL - 2) / 2 + 4}
                        textAnchor="middle"
                        fontSize="11"
                        fontFamily="var(--mono, monospace)"
                        fill={textColor}
                        fontWeight={isActiveCell ? 700 : 500}
                        pointerEvents="none"
                      >
                        {fmt(v, 2)}
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </svg>
        </div>
      </div>

      <div className="mlviz-readout ah-readout">
        {active.r >= 0 && active.c >= 0 ? (
          <>
            <div className="mlviz-row">
              <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>
                {tokens[active.r]}
              </span>
              <span className="mlviz-sub">attends to</span>
              <span className="mlviz-tag" style={{ color: 'var(--hue-sky, #5ecbff)' }}>
                {tokens[active.c]}
              </span>
            </div>
            <div className="mlviz-row mlviz-row-hi">
              <span className="mlviz-sub">raw score</span>
              <span className="mlviz-val">{fmt(scores[active.r][active.c], 3)}</span>
              <span className="mlviz-sub">/ √d = {fmt(Math.sqrt(D_K), 2)}</span>
              <span className="mlviz-sub">attention</span>
              <span className="mlviz-val">{fmt(attn[active.r][active.c], 3)}</span>
            </div>
          </>
        ) : (
          <div className="mlviz-row">
            <span className="mlviz-sub">
              tokens: {n} · d_k: {D_K} · √d_k: {fmt(Math.sqrt(D_K), 2)}
              {causal ? ' · causal mask on' : ''}
            </span>
          </div>
        )}
        <div className="mlviz-hint">
          hover a cell · click to pin · vectors are deterministic per token
        </div>
      </div>
    </div>
  );
}
