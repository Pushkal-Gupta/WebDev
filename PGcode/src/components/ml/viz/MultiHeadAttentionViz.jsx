import React, { useMemo, useState } from 'react';
import './MLViz.css';

const DEFAULT_SENTENCE = 'the quick brown fox jumps over the dog';
const N_HEADS = 8;

const HEAD_META = [
  { id: 0, name: 'Head 1', specialty: 'Previous token', detail: 'attends to the token immediately before' },
  { id: 1, name: 'Head 2', specialty: 'Next token', detail: 'attends to the token immediately after' },
  { id: 2, name: 'Head 3', specialty: 'Punctuation / period', detail: 'pulls toward sentence terminators' },
  { id: 3, name: 'Head 4', specialty: 'Subject markers', detail: 'fires on determiners like the / a' },
  { id: 4, name: 'Head 5', specialty: 'Nouns', detail: 'binds to concrete noun tokens' },
  { id: 5, name: 'Head 6', specialty: 'Verbs', detail: 'binds to action / verb tokens' },
  { id: 6, name: 'Head 7', specialty: 'Semantic match', detail: 'attends to lexically similar tokens' },
  { id: 7, name: 'Head 8', specialty: 'Uniform', detail: 'no preference, evenly spread' },
];

const DETERMINERS = new Set(['the', 'a', 'an']);
const NOUNS = new Set([
  'fox', 'dog', 'cat', 'mat', 'sky', 'tree', 'river', 'house', 'bird',
  'man', 'woman', 'boy', 'girl', 'book', 'car', 'road', 'sun', 'moon',
  'brown', 'quick',
]);
const VERBS = new Set([
  'jumps', 'jump', 'runs', 'run', 'sat', 'sit', 'fly', 'flies', 'eats', 'eat',
  'goes', 'go', 'reads', 'read', 'writes', 'write', 'walks', 'walk',
  'over', 'under',
]);
const PUNCT_RE = /[.!?;:,]/;

function isPunct(tok) {
  return PUNCT_RE.test(tok);
}

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

function softmaxRow(row) {
  const m = Math.max(...row.filter((v) => Number.isFinite(v)));
  const exps = row.map((v) => (Number.isFinite(v) ? Math.exp(v - m) : 0));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

function charSim(a, b) {
  if (!a || !b) return 0;
  const sa = new Set(a.toLowerCase());
  const sb = new Set(b.toLowerCase());
  let inter = 0;
  sa.forEach((c) => { if (sb.has(c)) inter++; });
  const uni = sa.size + sb.size - inter || 1;
  return inter / uni;
}

function buildLogits(headId, tokens, rng) {
  const n = tokens.length;
  const lower = tokens.map((t) => t.toLowerCase());
  const M = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = (rng() - 0.5) * 0.5; // baseline noise
      switch (headId) {
        case 0: // prev token
          if (j === i - 1) s += 4.0;
          else if (j === i) s += 0.3;
          else if (j < i) s += 0.2;
          break;
        case 1: // next token
          if (j === i + 1) s += 4.0;
          else if (j === i) s += 0.3;
          else if (j > i) s += 0.2;
          break;
        case 2: // punctuation / period — last token also acts as sentence end
          if (isPunct(lower[j])) s += 4.5;
          if (j === n - 1) s += 2.0;
          break;
        case 3: // subject (determiners)
          if (DETERMINERS.has(lower[j])) s += 4.2;
          break;
        case 4: // nouns
          if (NOUNS.has(lower[j])) s += 4.0;
          break;
        case 5: // verbs
          if (VERBS.has(lower[j])) s += 4.0;
          break;
        case 6: { // semantic match — char-overlap similarity, excl. self
          const sim = i === j ? 0 : charSim(lower[i], lower[j]);
          s += sim * 6.0;
          break;
        }
        case 7: // uniform — keep small noise only
          s = (rng() - 0.5) * 0.05;
          break;
        default:
          break;
      }
      M[i][j] = s;
    }
  }

  return M.map((row) => softmaxRow(row));
}

function fmt(n, p = 2) {
  if (!Number.isFinite(n)) return '-';
  return n.toFixed(p);
}

/* MiniHead — compact 8x8 heatmap card for a single head */
function MiniHead({ head, matrix, tokens, active, focusedToken, onClick }) {
  const n = tokens.length;
  const PAD_L = 6;
  const PAD_T = 6;
  const SIZE = 132;
  const cell = (SIZE - PAD_L - PAD_T) / n;
  return (
    <button
      type="button"
      className={`mha-card${active ? ' mha-card-on' : ''}`}
      onClick={onClick}
      aria-label={`${head.name}: ${head.specialty}`}
    >
      <div className="mha-card-head">
        <span className="mha-card-name">{head.name}</span>
        <span className="mha-card-spec">{head.specialty}</span>
      </div>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mha-card-svg"
        role="img"
        aria-hidden="true"
      >
        {matrix.map((row, i) =>
          row.map((v, j) => {
            const colHi = focusedToken === j;
            const rowHi = focusedToken === i;
            const bg = `rgba(var(--accent-rgb, 0,255,245), ${0.05 + v * 0.9})`;
            return (
              <rect
                key={`m-${i}-${j}`}
                x={PAD_L + j * cell}
                y={PAD_T + i * cell}
                width={cell - 0.5}
                height={cell - 0.5}
                rx="1.2"
                fill={bg}
                stroke={colHi || rowHi ? 'var(--accent)' : 'transparent'}
                strokeWidth={colHi || rowHi ? 0.8 : 0}
              />
            );
          })
        )}
      </svg>
    </button>
  );
}

export default function MultiHeadAttentionViz() {
  const [text, setText] = useState(DEFAULT_SENTENCE);
  const [activeHead, setActiveHead] = useState(0);
  const [focusedToken, setFocusedToken] = useState(-1);

  const tokens = useMemo(() => {
    const t = text.trim().split(/\s+/).filter(Boolean).slice(0, 8);
    while (t.length < 8) t.push('.');
    return t.slice(0, 8);
  }, [text]);

  const heads = useMemo(() => {
    return HEAD_META.map((h) => {
      const seed = xmur3(`mha|h${h.id}|${tokens.join(' ')}`)();
      const rng = mulberry32(seed);
      const matrix = buildLogits(h.id, tokens, rng);
      return { meta: h, matrix };
    });
  }, [tokens]);

  const n = tokens.length;
  const big = heads[activeHead];

  // Large heatmap layout
  const BIG_CELL = 44;
  const BIG_PAD_L = 88;
  const BIG_PAD_T = 70;
  const BIG_W = BIG_PAD_L + n * BIG_CELL + 16;
  const BIG_H = BIG_PAD_T + n * BIG_CELL + 16;

  // Per-token attention summary across all heads (when focusedToken set)
  const perHeadFocus = useMemo(() => {
    if (focusedToken < 0) return null;
    return heads.map((h) => {
      const row = h.matrix[focusedToken];
      let bestJ = 0;
      for (let j = 1; j < row.length; j++) if (row[j] > row[bestJ]) bestJ = j;
      return { head: h.meta, bestJ, weight: row[bestJ], row };
    });
  }, [heads, focusedToken]);

  return (
    <div className="mlviz-wrap mha-wrap">
      <div className="ah-controls mha-controls">
        <label className="ah-label">Sentence</label>
        <input
          type="text"
          className="ah-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
        <button
          type="button"
          className="mlviz-btn"
          onClick={() => { setText(DEFAULT_SENTENCE); setFocusedToken(-1); setActiveHead(0); }}
        >
          Reset
        </button>
      </div>

      <div className="mha-token-row" role="tablist" aria-label="tokens">
        {tokens.map((t, i) => (
          <button
            key={`tok-${i}`}
            type="button"
            className={`mha-token${focusedToken === i ? ' mha-token-on' : ''}`}
            onClick={() => setFocusedToken((p) => (p === i ? -1 : i))}
            aria-pressed={focusedToken === i}
          >
            <span className="mha-token-idx">{i}</span>
            <span className="mha-token-txt">{t}</span>
          </button>
        ))}
      </div>

      <div className="mha-grid">
        {heads.map((h) => (
          <MiniHead
            key={`head-${h.meta.id}`}
            head={h.meta}
            matrix={h.matrix}
            tokens={tokens}
            active={activeHead === h.meta.id}
            focusedToken={focusedToken}
            onClick={() => setActiveHead(h.meta.id)}
          />
        ))}
      </div>

      <div className="mha-big-block">
        <div className="ah-grid-title mha-big-title">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>
            {big.meta.name}
          </span>
          <span className="ah-grid-sub">
            {big.meta.specialty} — {big.meta.detail}
          </span>
        </div>
        <div className="ah-heat-stage">
          <svg
            viewBox={`0 0 ${BIG_W} ${BIG_H}`}
            className="ah-heat-svg"
            role="img"
            aria-label={`${big.meta.name} attention pattern`}
          >
            {/* column labels */}
            {tokens.map((t, j) => (
              <text
                key={`bcl-${j}`}
                x={BIG_PAD_L + j * BIG_CELL + BIG_CELL / 2}
                y={BIG_PAD_T - 14}
                textAnchor="middle"
                fontSize="11"
                fontFamily="var(--mono, monospace)"
                fill={focusedToken === j ? 'var(--accent)' : 'var(--text-dim)'}
                fontWeight={focusedToken === j ? 700 : 500}
              >
                {t}
              </text>
            ))}
            <text
              x={BIG_PAD_L + (n * BIG_CELL) / 2}
              y={BIG_PAD_T - 34}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.16em"
            >
              KEYS (attended to)
            </text>

            {/* row labels */}
            {tokens.map((t, i) => (
              <text
                key={`brl-${i}`}
                x={BIG_PAD_L - 10}
                y={BIG_PAD_T + i * BIG_CELL + BIG_CELL / 2 + 4}
                textAnchor="end"
                fontSize="11"
                fontFamily="var(--mono, monospace)"
                fill={focusedToken === i ? 'var(--accent)' : 'var(--text-dim)'}
                fontWeight={focusedToken === i ? 700 : 500}
              >
                {t}
              </text>
            ))}
            <text
              x={20}
              y={BIG_PAD_T + (n * BIG_CELL) / 2}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.16em"
              transform={`rotate(-90 20 ${BIG_PAD_T + (n * BIG_CELL) / 2})`}
            >
              QUERIES (asking)
            </text>

            {big.matrix.map((row, i) =>
              row.map((v, j) => {
                const isFocusRow = focusedToken === i;
                const isFocusCol = focusedToken === j;
                const dim = focusedToken >= 0 && focusedToken !== i;
                const bg = dim
                  ? `rgba(var(--accent-rgb, 0,255,245), ${0.03 + v * 0.18})`
                  : `rgba(var(--accent-rgb, 0,255,245), ${0.06 + v * 0.85})`;
                const stroke = isFocusRow || isFocusCol
                  ? 'var(--accent)'
                  : 'var(--border)';
                const sw = isFocusRow || isFocusCol ? 1.4 : 0.5;
                const textColor = v > 0.55 && !dim ? 'var(--bg)' : 'var(--text-main)';
                return (
                  <g key={`bc-${i}-${j}`}>
                    <rect
                      x={BIG_PAD_L + j * BIG_CELL}
                      y={BIG_PAD_T + i * BIG_CELL}
                      width={BIG_CELL - 2}
                      height={BIG_CELL - 2}
                      rx="4"
                      fill={bg}
                      stroke={stroke}
                      strokeWidth={sw}
                    />
                    <text
                      x={BIG_PAD_L + j * BIG_CELL + (BIG_CELL - 2) / 2}
                      y={BIG_PAD_T + i * BIG_CELL + (BIG_CELL - 2) / 2 + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="var(--mono, monospace)"
                      fill={textColor}
                      opacity={dim ? 0.45 : 1}
                      pointerEvents="none"
                    >
                      {v >= 0.01 ? fmt(v, 2) : ''}
                    </text>
                  </g>
                );
              })
            )}
          </svg>
        </div>
      </div>

      {focusedToken >= 0 && perHeadFocus && (
        <div className="mha-focus-block">
          <div className="ah-grid-title">
            <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>
              {tokens[focusedToken]}
            </span>
            <span className="ah-grid-sub">
              top attention per head — token #{focusedToken}
            </span>
          </div>
          <div className="mha-focus-list">
            {perHeadFocus.map((row) => (
              <div className="mha-focus-row" key={`f-${row.head.id}`}>
                <span className="mha-focus-name">{row.head.name}</span>
                <span className="mha-focus-spec">{row.head.specialty}</span>
                <span className="mha-focus-arrow">attends to</span>
                <span className="mha-focus-target">{tokens[row.bestJ]}</span>
                <div className="mha-focus-bar" aria-hidden="true">
                  <span
                    className="mha-focus-bar-fill"
                    style={{ width: `${Math.round(row.weight * 100)}%` }}
                  />
                </div>
                <span className="mha-focus-w">{fmt(row.weight, 2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-sub">
            heads: {N_HEADS} · tokens: {n} · rows sum to 1 (softmax)
          </span>
        </div>
        <div className="mlviz-hint">
          click a head card to enlarge it · click a token to see who it attends to across every head
        </div>
      </div>

      <style>{MHA_CSS}</style>
    </div>
  );
}

const MHA_CSS = `
.mha-wrap { display: flex; flex-direction: column; gap: 16px; }
.mha-controls { align-items: center; }
.mha-token-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.mha-token {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-main);
  font-family: var(--mono, monospace);
  transition: background 120ms ease, border-color 120ms ease;
}
.mha-token:hover { background: var(--hover-box); }
.mha-token-on {
  border-color: var(--accent);
  background: rgba(var(--accent-rgb, 0,255,245), 0.10);
}
.mha-token-idx {
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--text-dim);
}
.mha-token-txt { font-size: 13px; font-weight: 600; }

.mha-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}
.mha-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  color: var(--text-main);
  transition: border-color 120ms ease, transform 120ms ease, background 120ms ease;
}
.mha-card:hover {
  border-color: rgba(var(--accent-rgb, 0,255,245), 0.5);
  background: var(--hover-box);
}
.mha-card-on {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgba(var(--accent-rgb, 0,255,245), 0.35);
}
.mha-card-head {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.mha-card-name {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--accent);
  font-family: var(--mono, monospace);
}
.mha-card-spec {
  font-size: 11px;
  color: var(--text-dim);
}
.mha-card-svg {
  width: 100%;
  height: auto;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.mha-big-block {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
}
.mha-big-title { margin-bottom: 10px; }

.mha-focus-block {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
}
.mha-focus-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}
.mha-focus-row {
  display: grid;
  grid-template-columns: 70px 1fr 80px 70px 1fr 50px;
  gap: 10px;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
}
.mha-focus-name {
  font-family: var(--mono, monospace);
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
}
.mha-focus-spec { font-size: 12px; color: var(--text-dim); }
.mha-focus-arrow {
  font-size: 11px;
  color: var(--text-dim);
  text-align: center;
  letter-spacing: 0.06em;
}
.mha-focus-target {
  font-family: var(--mono, monospace);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}
.mha-focus-bar {
  height: 8px;
  background: rgba(var(--accent-rgb, 0,255,245), 0.10);
  border-radius: 4px;
  overflow: hidden;
}
.mha-focus-bar-fill {
  display: block;
  height: 100%;
  background: var(--accent);
}
.mha-focus-w {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--text-main);
  text-align: right;
}
@media (max-width: 720px) {
  .mha-focus-row {
    grid-template-columns: 1fr 1fr;
    gap: 4px 10px;
  }
  .mha-focus-arrow { display: none; }
  .mha-focus-bar { grid-column: 1 / -1; }
}
`;
