import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Circle, Sigma } from 'lucide-react';
import './DmSetOpsViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

const U = [1, 2, 3, 4, 5, 6, 7, 8];
const A = [1, 2, 3, 4];
const B = [3, 4, 5, 6];

// Deterministic element placement, one chip per set-membership region.
const ELEMENTS = [
  { v: 1, x: 170, y: 150, region: 'onlyA' },
  { v: 2, x: 170, y: 216, region: 'onlyA' },
  { v: 3, x: 320, y: 150, region: 'inter' },
  { v: 4, x: 320, y: 216, region: 'inter' },
  { v: 5, x: 475, y: 150, region: 'onlyB' },
  { v: 6, x: 475, y: 216, region: 'onlyB' },
  { v: 7, x: 72, y: 74, region: 'outside' },
  { v: 8, x: 568, y: 300, region: 'outside' },
];

const OPS = [
  {
    key: 'union', label: 'Union', sym: 'A \\cup B',
    regions: ['onlyA', 'inter', 'onlyB'],
    result: (a, b) => [...new Set([...a, ...b])],
  },
  {
    key: 'intersection', label: 'Intersection', sym: 'A \\cap B',
    regions: ['inter'],
    result: (a, b) => a.filter((x) => b.includes(x)),
  },
  {
    key: 'difference', label: 'Difference', sym: 'A \\setminus B',
    regions: ['onlyA'],
    result: (a, b) => a.filter((x) => !b.includes(x)),
  },
  {
    key: 'symdiff', label: 'Symmetric Diff', sym: 'A \\triangle B',
    regions: ['onlyA', 'onlyB'],
    result: (a, b) => [...a.filter((x) => !b.includes(x)), ...b.filter((x) => !a.includes(x))],
  },
  {
    key: 'complement', label: 'Complement', sym: 'A^{c}',
    regions: ['onlyB', 'outside'],
    result: (a) => U.filter((x) => !a.includes(x)),
  },
];

const CA = { cx: 250, cy: 185, r: 132 };
const CB = { cx: 390, cy: 185, r: 132 };
const UNIV = { x: 18, y: 22, w: 604, h: 322 };

export default function DmSetOpsViz() {
  const [opKey, setOpKey] = useState('union');
  const op = OPS.find((o) => o.key === opKey);

  const reset = () => setOpKey('union');

  const result = useMemo(() => {
    const raw = op.result(A, B);
    return [...new Set(raw)].sort((m, n) => m - n);
  }, [op]);

  const resultSet = useMemo(() => new Set(result), [result]);
  const activeRegions = useMemo(() => new Set(op.regions), [op]);

  const nA = A.length;
  const nB = B.length;
  const nInter = A.filter((x) => B.includes(x)).length;
  const nUnion = nA + nB - nInter;

  const ieTex = `|A \\cup B| = |A| + |B| - |A \\cap B| = ${nA} + ${nB} - ${nInter} = ${nUnion}`;
  const resultTex = result.length
    ? `\\{${result.join(',\\,')}\\}`
    : '\\varnothing';
  const cardTex = `|${op.sym}| = ${result.length}`;

  const reg = (name) => (activeRegions.has(name) ? 'dmso-reg dmso-active' : 'dmso-reg');

  return (
    <div className="dmso">
      <div className="dmso-head">
        <div className="dmso-head-icon"><Sigma size={18} /></div>
        <div className="dmso-head-text">
          <h3 className="dmso-title">Set operations on a Venn diagram</h3>
          <p className="dmso-sub">
            Two sets{' '}
            <span dangerouslySetInnerHTML={{ __html: km('A=\\{1,2,3,4\\}') }} /> and{' '}
            <span dangerouslySetInnerHTML={{ __html: km('B=\\{3,4,5,6\\}') }} /> inside the universe{' '}
            <span dangerouslySetInnerHTML={{ __html: km('U=\\{1,\\dots,8\\}') }} />. Pick an operation to
            shade the region it selects; the result set and its cardinality update live.
          </p>
        </div>
        <button type="button" className="dmso-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dmso-ops">
        {OPS.map((o) => (
          <button
            key={o.key}
            type="button"
            className={o.key === opKey ? 'dmso-chip dmso-chip-on' : 'dmso-chip'}
            onClick={() => setOpKey(o.key)}
          >
            <Circle size={11} />
            <span>{o.label}</span>
            <span className="dmso-chip-sym" dangerouslySetInnerHTML={{ __html: km(o.sym) }} />
          </button>
        ))}
      </div>

      <div className="dmso-stage">
        <svg viewBox="0 0 640 372" className="dmso-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="dmso-clip-a"><circle cx={CA.cx} cy={CA.cy} r={CA.r} /></clipPath>
            <mask id="dmso-mask-not-b">
              <rect x={UNIV.x} y={UNIV.y} width={UNIV.w} height={UNIV.h} fill="white" />
              <circle cx={CB.cx} cy={CB.cy} r={CB.r} fill="black" />
            </mask>
            <mask id="dmso-mask-not-a">
              <rect x={UNIV.x} y={UNIV.y} width={UNIV.w} height={UNIV.h} fill="white" />
              <circle cx={CA.cx} cy={CA.cy} r={CA.r} fill="black" />
            </mask>
            <mask id="dmso-mask-outside">
              <rect x={UNIV.x} y={UNIV.y} width={UNIV.w} height={UNIV.h} fill="white" />
              <circle cx={CA.cx} cy={CA.cy} r={CA.r} fill="black" />
              <circle cx={CB.cx} cy={CB.cy} r={CB.r} fill="black" />
            </mask>
          </defs>

          <rect
            x={UNIV.x} y={UNIV.y} width={UNIV.w} height={UNIV.h} rx="12"
            className="dmso-univ"
          />

          {/* Shaded regions (opacity toggled by active class) */}
          <circle cx={CA.cx} cy={CA.cy} r={CA.r} className={`${reg('onlyA')} dmso-r-onlyA`} mask="url(#dmso-mask-not-b)" />
          <circle cx={CB.cx} cy={CB.cy} r={CB.r} className={`${reg('onlyB')} dmso-r-onlyB`} mask="url(#dmso-mask-not-a)" />
          <circle cx={CB.cx} cy={CB.cy} r={CB.r} className={`${reg('inter')} dmso-r-inter`} clipPath="url(#dmso-clip-a)" />
          <rect x={UNIV.x} y={UNIV.y} width={UNIV.w} height={UNIV.h} rx="12" className={`${reg('outside')} dmso-r-outside`} mask="url(#dmso-mask-outside)" />

          {/* Circle outlines */}
          <circle cx={CA.cx} cy={CA.cy} r={CA.r} className="dmso-outline" />
          <circle cx={CB.cx} cy={CB.cy} r={CB.r} className="dmso-outline" />

          <text x={CA.cx - 92} y={CA.cy - 96} className="dmso-set-label">A</text>
          <text x={CB.cx + 92} y={CB.cy - 96} className="dmso-set-label">B</text>
          <text x={UNIV.x + 16} y={UNIV.y + 26} className="dmso-univ-label">U</text>

          {/* Element chips */}
          {ELEMENTS.map((el) => {
            const hit = resultSet.has(el.v);
            return (
              <g key={el.v} className={hit ? 'dmso-el dmso-el-hit' : 'dmso-el'}>
                <circle cx={el.x} cy={el.y} r="17" className="dmso-el-bg" />
                <text x={el.x} y={el.y} className="dmso-el-txt">{el.v}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dmso-readouts">
        <div className="dmso-card dmso-card-hero">
          <span className="dmso-card-label">result of{' '}
            <span dangerouslySetInnerHTML={{ __html: km(op.sym) }} />
          </span>
          <span className="dmso-card-val" dangerouslySetInnerHTML={{ __html: km(resultTex) }} />
          <span className="dmso-card-sub" dangerouslySetInnerHTML={{ __html: km(cardTex) }} />
        </div>
        <div className="dmso-card">
          <span className="dmso-card-label">inclusion&ndash;exclusion identity</span>
          <span className="dmso-card-val dmso-ie" dangerouslySetInnerHTML={{ __html: km(ieTex, true) }} />
        </div>
      </div>

      <div className="dmso-legend">
        <span className="dmso-leg"><i className="dmso-sw dmso-r-onlyA" /> A only (A&#92;B)</span>
        <span className="dmso-leg"><i className="dmso-sw dmso-r-inter" /> overlap (A&cap;B)</span>
        <span className="dmso-leg"><i className="dmso-sw dmso-r-onlyB" /> B only (B&#92;A)</span>
        <span className="dmso-leg"><i className="dmso-sw dmso-r-outside" /> outside both</span>
      </div>
    </div>
  );
}
