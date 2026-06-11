import React, { useMemo, useState } from 'react';
import { ToggleLeft, ToggleRight, Type } from 'lucide-react';
import './MLViz.css';

const W = 720;
const H = 340;
const PAD_X = 28;
const ROW_H = 46;
const ROW_GAP = 8;
const ROW_TOP = 56;

const DEFAULT_INPUT = 'Café  RÉSUMÉ —   naïve  Ω';

// Step list — applied top-to-bottom when the toggle is on.
const STEP_DEFS = [
  { key: 'nfkc', label: 'NFKC normalize', desc: 'compose accents, unify width' },
  { key: 'casefold', label: 'casefold', desc: 'aggressive lowercase (ß→ss)' },
  { key: 'strip',    label: 'strip accents', desc: 'drop combining marks' },
  { key: 'collapse', label: 'collapse whitespace', desc: 'runs of ws → single space, trim' },
];

function applyNFKC(s) {
  if (typeof s.normalize === 'function') return s.normalize('NFKC');
  return s;
}

function applyCasefold(s) {
  // JS has no real casefold; toLowerCase is the closest portable equivalent
  return s.toLowerCase();
}

function applyStripAccents(s) {
  if (typeof s.normalize !== 'function') return s;
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

function applyCollapseWs(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function applyStep(key, s) {
  if (key === 'nfkc') return applyNFKC(s);
  if (key === 'casefold') return applyCasefold(s);
  if (key === 'strip') return applyStripAccents(s);
  if (key === 'collapse') return applyCollapseWs(s);
  return s;
}

function visible(s) {
  // make whitespace + control chars legible in the SVG
  return s
    .replace(/ /g, '·')
    .replace(/ /g, '␣')
    .replace(/ /g, '—')
    .replace(/\t/g, '→');
}

function diffCount(a, b) {
  // codepoint-aware length diff + replaced-char approximation
  const arrA = Array.from(a);
  const arrB = Array.from(b);
  let common = 0;
  const limit = Math.min(arrA.length, arrB.length);
  for (let i = 0; i < limit; i++) if (arrA[i] === arrB[i]) common++;
  // approx number of touched codepoints
  return Math.abs(arrA.length - arrB.length) + (limit - common);
}

export default function TokenizerNormalizationViz() {
  const [enabled, setEnabled] = useState({ nfkc: true, casefold: true, strip: true, collapse: true });
  const [input, setInput] = useState(DEFAULT_INPUT);

  const pipeline = useMemo(() => {
    const out = [{ key: 'input', label: 'input', value: input, changes: 0 }];
    let cur = input;
    for (const def of STEP_DEFS) {
      if (enabled[def.key]) {
        const next = applyStep(def.key, cur);
        out.push({ key: def.key, label: def.label, desc: def.desc, value: next, changes: diffCount(cur, next) });
        cur = next;
      } else {
        out.push({ key: def.key, label: def.label, desc: def.desc, value: cur, changes: 0, off: true });
      }
    }
    return out;
  }, [enabled, input]);

  const inputLen = Array.from(input).length;
  const outputLen = Array.from(pipeline[pipeline.length - 1].value).length;
  const totalChanges = pipeline.reduce((s, r) => s + (r.changes || 0), 0);

  const rows = pipeline.length;
  const svgH = ROW_TOP + rows * (ROW_H + ROW_GAP) + 24;

  function toggle(k) {
    setEnabled((cur) => ({ ...cur, [k]: !cur[k] }));
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${svgH}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${svgH}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* legend / column headers */}
          <text x={PAD_X} y={22} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            STAGE
          </text>
          <text x={PAD_X + 160} y={22} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            RESULT
          </text>
          <text x={W - PAD_X} y={22} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em" textAnchor="end">
            CODEPTS · CHANGES
          </text>

          <line x1={PAD_X} y1={32} x2={W - PAD_X} y2={32} stroke="var(--border)" strokeWidth="0.7" opacity="0.6" />

          {pipeline.map((row, idx) => {
            const y = ROW_TOP + idx * (ROW_H + ROW_GAP);
            const isInput = row.key === 'input';
            const isOff = row.off;
            const stripe = isInput ? 'var(--accent)' : isOff ? 'var(--border)' : 'var(--hue-mint)';
            const len = Array.from(row.value).length;
            return (
              <g key={idx}>
                <rect
                  x={PAD_X}
                  y={y}
                  width={W - PAD_X * 2}
                  height={ROW_H}
                  rx="6"
                  fill="var(--bg)"
                  stroke="var(--border)"
                  strokeWidth="1"
                  opacity={isOff ? 0.45 : 0.8}
                />
                <rect x={PAD_X} y={y} width="4" height={ROW_H} rx="2" fill={stripe} opacity={isOff ? 0.35 : 0.9} />
                <text
                  x={PAD_X + 14}
                  y={y + 19}
                  fontSize="11"
                  fill={isOff ? 'var(--text-dim)' : 'var(--text-main)'}
                  fontFamily="var(--mono)"
                  fontWeight="700"
                  letterSpacing="0.05em"
                >
                  {row.label}
                </text>
                {row.desc && (
                  <text
                    x={PAD_X + 14}
                    y={y + 34}
                    fontSize="9"
                    fill="var(--text-dim)"
                    fontFamily="var(--mono)"
                    letterSpacing="0.04em"
                  >
                    {isOff ? 'skipped' : row.desc}
                  </text>
                )}
                <text
                  x={PAD_X + 160}
                  y={y + 26}
                  fontSize="12"
                  fill={isOff ? 'var(--text-dim)' : 'var(--text-main)'}
                  fontFamily="var(--mono)"
                  style={{ whiteSpace: 'pre' }}
                >
                  {visible(row.value)}
                </text>
                <text
                  x={W - PAD_X - 4}
                  y={y + 19}
                  fontSize="10"
                  fill="var(--hue-sky)"
                  fontFamily="var(--mono)"
                  textAnchor="end"
                >
                  len={len}
                </text>
                <text
                  x={W - PAD_X - 4}
                  y={y + 33}
                  fontSize="10"
                  fill={row.changes > 0 ? 'var(--hue-pink)' : 'var(--text-dim)'}
                  fontFamily="var(--mono)"
                  textAnchor="end"
                >
                  {isInput ? '' : isOff ? 'off' : `Δ ${row.changes}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls" style={{ gap: '0.5rem' }}>
          <label className="mlviz-slider" style={{ flex: '1 1 auto' }}>
            <span className="mlviz-slider-label">
              <Type size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              input
            </span>
            <input
              type="text"
              value={input}
              maxLength={64}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: '1 1 auto',
                fontFamily: 'var(--mono)',
                fontSize: '0.85rem',
                background: 'var(--bg)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.3rem 0.55rem',
                minWidth: 0,
              }}
            />
          </label>
        </div>

        <div className="mlviz-row mlviz-toggles">
          {STEP_DEFS.map((d) => {
            const on = enabled[d.key];
            return (
              <button
                key={d.key}
                type="button"
                className={`mlviz-toggle ${on ? 'is-on' : ''}`}
                onClick={() => toggle(d.key)}
              >
                {on ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                <span>{d.label}</span>
                <span className="mlviz-toggle-dot" />
              </button>
            );
          })}
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span className="mlviz-tag">input len</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{inputLen}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span className="mlviz-tag">output len</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-mint)' }}>{outputLen}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span className="mlviz-tag">total changes</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{totalChanges}</span>
          </span>
        </div>

        <div className="mlviz-hint">
          · = space, ␣ = nbsp, — = em-space — toggle steps to watch the cascade collapse multi-script noise into a tokenizer-friendly form
        </div>
      </div>
    </div>
  );
}
