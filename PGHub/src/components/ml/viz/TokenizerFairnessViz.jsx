import React, { useMemo, useState, useCallback } from 'react';
import { Scale, RotateCcw, Languages } from 'lucide-react';
import './MLViz.css';

const W = 760;
const H = 380;
const PAD_L = 110;
const PAD_R = 24;
const PAD_T = 44;
const PAD_B = 56;
const CHART_W = W - PAD_L - PAD_R;
const CHART_H = H - PAD_T - PAD_B;

// Six pre-computed inputs, each a roughly-equivalent semantic sentence rendered
// in its script. bytes / tokens / chars per BPE category are calibrated to
// match published GPT-style tokenizer behavior (English ~ 1 token / 4 bytes,
// non-Latin scripts pay a 3-5x penalty, code is dense per-byte).
const INPUTS = [
  {
    label: 'English',
    sample: 'The quick brown fox jumps over the lazy dog.',
    chars: 44,
    bytes: 44,
    // distribution: { word, subword, byte-fallback }
    breakdown: { word: 9, subword: 2, fallback: 0 },
    color: 'var(--hue-sky)',
  },
  {
    label: 'Chinese',
    sample: '一只敏捷的棕色狐狸跳过了懒狗。',
    chars: 15,
    bytes: 45,
    breakdown: { word: 4, subword: 9, fallback: 18 },
    color: 'var(--hue-pink)',
  },
  {
    label: 'Devanagari',
    sample: 'तेज़ भूरी लोमड़ी आलसी कुत्ते के ऊपर से कूदती है।',
    chars: 46,
    bytes: 124,
    breakdown: { word: 1, subword: 8, fallback: 26 },
    color: 'var(--hue-violet)',
  },
  {
    label: 'Arabic',
    sample: 'الثعلب البني السريع يقفز فوق الكلب الكسول.',
    chars: 42,
    bytes: 76,
    breakdown: { word: 2, subword: 9, fallback: 14 },
    color: 'var(--hue-mint)',
  },
  {
    label: 'Code',
    sample: 'for (let i = 0; i < n; i++) { sum += arr[i]; }',
    chars: 46,
    bytes: 46,
    breakdown: { word: 11, subword: 6, fallback: 0 },
    color: 'var(--easy)',
  },
  {
    label: 'Math',
    sample: '∑_{i=1}^{n} x_i² · √π ≈ ∞ ∇f(θ)',
    chars: 32,
    bytes: 64,
    breakdown: { word: 0, subword: 3, fallback: 22 },
    color: 'var(--warning)',
  },
];

function totalTokens(b) {
  return b.word + b.subword + b.fallback;
}

export default function TokenizerFairnessViz() {
  const [hoverIdx, setHoverIdx] = useState(null);
  const [normalize, setNormalize] = useState('absolute'); // absolute | perChar

  const rows = useMemo(
    () =>
      INPUTS.map((row) => {
        const t = totalTokens(row.breakdown);
        const perChar = t / row.chars;
        const perByte = t / row.bytes;
        return { ...row, totalTokens: t, perChar, perByte };
      }),
    []
  );

  const maxAbs = useMemo(() => Math.max(...rows.map((r) => r.totalTokens)), [rows]);
  const maxPerChar = useMemo(() => Math.max(...rows.map((r) => r.perChar)), [rows]);
  const denom = normalize === 'perChar' ? maxPerChar : maxAbs;

  const sortedByTotal = useMemo(
    () => rows.slice().sort((a, b) => b.totalTokens - a.totalTokens),
    [rows]
  );
  const worst = sortedByTotal[0];
  const best = sortedByTotal[sortedByTotal.length - 1];
  const ratio = best.totalTokens > 0 ? worst.totalTokens / best.totalTokens : 0;

  const handleReset = useCallback(() => {
    setHoverIdx(null);
    setNormalize('absolute');
  }, []);

  const rowH = CHART_H / rows.length;
  const barH = rowH * 0.62;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text
            x={PAD_L}
            y={PAD_T - 22}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            BPE TOKENIZER  ·  STACKED BY  word · subword · byte-fallback
          </text>
          <text
            x={W - PAD_R}
            y={PAD_T - 22}
            fontSize="9.5"
            fill="var(--accent)"
            fontFamily="var(--mono)"
            textAnchor="end"
            fontWeight="700"
          >
            {normalize === 'perChar' ? 'normalized per char' : 'absolute tokens'}
          </text>

          {/* axis line */}
          <line
            x1={PAD_L}
            y1={PAD_T + CHART_H + 2}
            x2={W - PAD_R}
            y2={PAD_T + CHART_H + 2}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {rows.map((row, i) => {
            const y = PAD_T + i * rowH + (rowH - barH) / 2;
            const totalValue = normalize === 'perChar' ? row.perChar : row.totalTokens;
            const totalWidth = (totalValue / denom) * CHART_W * 0.95;

            const wordShare = row.breakdown.word / row.totalTokens;
            const subShare = row.breakdown.subword / row.totalTokens;
            const fbShare = row.breakdown.fallback / row.totalTokens;

            const wordW = totalWidth * wordShare;
            const subW = totalWidth * subShare;
            const fbW = totalWidth * fbShare;
            const isHover = hoverIdx === i;

            return (
              <g
                key={row.label}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* row background */}
                <rect
                  x={PAD_L - 6}
                  y={y - 4}
                  width={CHART_W + 12}
                  height={barH + 8}
                  fill={isHover ? 'var(--surface)' : 'transparent'}
                  opacity={isHover ? 0.55 : 0}
                  rx="4"
                />

                <text
                  x={PAD_L - 12}
                  y={y + barH / 2 + 3}
                  fontSize="10.5"
                  fill={isHover ? 'var(--accent)' : 'var(--text-main)'}
                  fontFamily="var(--mono)"
                  textAnchor="end"
                  fontWeight={isHover ? 700 : 500}
                >
                  {row.label}
                </text>

                {/* word segment */}
                <rect
                  x={PAD_L}
                  y={y}
                  width={Math.max(0, wordW)}
                  height={barH}
                  fill={row.color}
                  opacity={0.92}
                  rx="2"
                />
                {/* subword segment */}
                <rect
                  x={PAD_L + wordW}
                  y={y}
                  width={Math.max(0, subW)}
                  height={barH}
                  fill={row.color}
                  opacity={0.55}
                />
                {/* byte-fallback segment */}
                <rect
                  x={PAD_L + wordW + subW}
                  y={y}
                  width={Math.max(0, fbW)}
                  height={barH}
                  fill={row.color}
                  opacity={0.28}
                />

                {/* count tag */}
                <text
                  x={PAD_L + totalWidth + 8}
                  y={y + barH / 2 + 3}
                  fontSize="10"
                  fill="var(--text-main)"
                  fontFamily="var(--mono)"
                  textAnchor="start"
                  fontWeight="700"
                >
                  {normalize === 'perChar' ? row.perChar.toFixed(2) : row.totalTokens}
                </text>
                <text
                  x={PAD_L + totalWidth + 8}
                  y={y + barH / 2 + 15}
                  fontSize="8.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="start"
                >
                  {normalize === 'perChar'
                    ? `${row.totalTokens} toks / ${row.chars} ch`
                    : `${(row.totalTokens / row.chars).toFixed(2)} t/ch`}
                </text>
              </g>
            );
          })}

          {/* legend */}
          <g transform={`translate(${PAD_L} ${H - 30})`}>
            <rect width="10" height="10" fill="var(--text-main)" opacity="0.92" rx="1.5" />
            <text x="14" y="9" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)">word</text>
            <rect x="60" width="10" height="10" fill="var(--text-main)" opacity="0.55" rx="1.5" />
            <text x="74" y="9" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)">subword</text>
            <rect x="140" width="10" height="10" fill="var(--text-main)" opacity="0.28" rx="1.5" />
            <text x="154" y="9" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)">byte-fallback</text>
          </g>

          <text
            x={W - PAD_R}
            y={H - 22}
            fontSize="9"
            fill="var(--warning)"
            fontFamily="var(--mono)"
            textAnchor="end"
            fontWeight="700"
            letterSpacing="0.08em"
          >
            worst / best = {ratio.toFixed(2)}×
          </text>
          <text
            x={W - PAD_R}
            y={H - 10}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="end"
            letterSpacing="0.08em"
          >
            same meaning, very different token bills
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <span className="mlviz-slider-label" style={{ minWidth: 0 }}>view</span>
          <button
            type="button"
            className={`mlviz-btn ${normalize === 'absolute' ? 'mlviz-btn-primary' : ''}`}
            onClick={() => setNormalize('absolute')}
          >
            <span>absolute tokens</span>
          </button>
          <button
            type="button"
            className={`mlviz-btn ${normalize === 'perChar' ? 'mlviz-btn-primary' : ''}`}
            onClick={() => setNormalize('perChar')}
          >
            <span>tokens / char</span>
          </button>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <Scale size={11} style={{ verticalAlign: '-1px' }} />
            <span className="mlviz-sub">most tokenized</span>
            <span className="mlviz-val" style={{ color: 'var(--warning)' }}>{worst.label}</span>
            <span className="mlviz-sub">({worst.totalTokens} toks)</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">least tokenized</span>
            <span className="mlviz-val" style={{ color: 'var(--easy)' }}>{best.label}</span>
            <span className="mlviz-sub">({best.totalTokens} toks)</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">fairness ratio</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {ratio.toFixed(2)}×
            </span>
          </span>
        </div>

        {hoverIdx !== null && (
          <div className="mlviz-row" style={{ paddingTop: '0.2rem' }}>
            <span className="mlviz-sub" style={{ minWidth: 90 }}>
              <Languages size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              {rows[hoverIdx].label}
            </span>
            <span
              className="mlviz-val"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '0.78rem',
                color: 'var(--text-main)',
                wordBreak: 'break-word',
                maxWidth: '100%',
              }}
            >
              {rows[hoverIdx].sample}
            </span>
          </div>
        )}

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            hover a row to read the source
          </span>
        </div>

        <div className="mlviz-hint">
          BPE was trained on English-heavy data → non-Latin scripts pay a tax in tokens
        </div>
      </div>
    </div>
  );
}
