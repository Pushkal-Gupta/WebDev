import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { Split, ChevronLeft, ChevronRight, RotateCcw, Target } from 'lucide-react';
import './MeetInTheMiddleViz.css';

// Meet-in-the-middle: subset-sum in O(2^{n/2}) instead of O(2^n).
//
// Splitting n elements into two halves of n/2, we enumerate every subset sum of
// each half (2^{n/2} sums each). Sort the right half's sums; then for each left
// sum s we binary-search for (target - s) in the right list. If found, the two
// subsets union to a subset summing exactly to target.
//
// Brute force tries all 2^n subsets directly. The split trades that for
// 2 * 2^{n/2} enumeration + a sorted lookup — a square-root in the exponent.

const PRESETS = [
  { set: [3, 5, 9, 1], target: 14 },
  { set: [2, 4, 6, 8], target: 10 },
  { set: [7, 3, 1, 5], target: 11 },
  { set: [4, 4, 4, 4], target: 12 },
];

const km = (expr) => katex.renderToString(expr, { throwOnError: false });

// All subset sums of an array, with the chosen indices, as a stable list.
function subsetSums(arr, offset) {
  const out = [];
  for (let mask = 0; mask < 1 << arr.length; mask++) {
    let sum = 0;
    const picks = [];
    for (let i = 0; i < arr.length; i++) {
      if (mask & (1 << i)) {
        sum += arr[i];
        picks.push(offset + i);
      }
    }
    out.push({ sum, picks, mask });
  }
  return out;
}

const STAGES = ['split', 'left', 'right', 'search'];
const STAGE_LABEL = {
  split: 'Split into two halves',
  left: 'Enumerate left subset sums',
  right: 'Enumerate + sort right subset sums',
  search: 'Binary-search each complement',
};

export default function MeetInTheMiddleViz() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [stage, setStage] = useState(0);

  const { set, target } = PRESETS[presetIdx];

  const model = useMemo(() => {
    const half = Math.ceil(set.length / 2);
    const left = set.slice(0, half);
    const right = set.slice(half);
    const leftSums = subsetSums(left, 0);
    const rightSums = subsetSums(right, half).sort((p, q) => p.sum - q.sum);

    // find first matching pair
    let found = null;
    for (const ls of leftSums) {
      const need = target - ls.sum;
      const match = rightSums.find((rs) => rs.sum === need);
      if (match) {
        found = { ls, rs: match };
        break;
      }
    }
    const brute = 1 << set.length;
    const mitm = 2 * (1 << half);
    return { half, left, right, leftSums, rightSums, found, brute, mitm };
  }, [set, target]);

  const stageKey = STAGES[stage];

  const pick = (i) => {
    setPresetIdx(i);
    setStage(0);
  };
  const reset = () => {
    setPresetIdx(0);
    setStage(0);
  };

  // SVG geometry
  const W = 940;
  const H = 470;

  const cellW = 64;
  const cellGap = 10;
  const topY = 50;

  const leftBaseX = 60;
  const rightBaseX = W - 60 - (model.right.length * (cellW + cellGap) - cellGap);

  const sumsY = 170;
  const sumCellW = 56;
  const sumGap = 7;

  const highlightLeft = model.found ? new Set(model.found.ls.picks) : new Set();
  const highlightRight = model.found ? new Set(model.found.rs.picks) : new Set();

  const renderHalf = (label, arr, baseX, side) => (
    <g>
      <text className="mim-half-label" x={baseX} y={topY - 14}>{label}</text>
      {arr.map((v, i) => {
        const globalIdx = side === 'L' ? i : model.half + i;
        const hl = side === 'L' ? highlightLeft.has(globalIdx) : highlightRight.has(globalIdx);
        const x = baseX + i * (cellW + cellGap);
        const c = side === 'L' ? 'var(--hue-violet)' : 'var(--hue-sky)';
        return (
          <g key={`${side}-${i}`}>
            <rect
              className={`mim-cell ${stageKey === 'search' && hl ? 'is-hl' : ''}`}
              x={x}
              y={topY}
              width={cellW}
              height={52}
              rx={8}
              style={{ stroke: c }}
            />
            <rect x={x} y={topY} width={cellW} height={5} rx={2.5} fill={c} />
            <text className="mim-cell-val" x={x + cellW / 2} y={topY + 35} style={{ fill: c }}>
              {v}
            </text>
          </g>
        );
      })}
    </g>
  );

  const showLeftSums = stage >= 1;
  const showRightSums = stage >= 2;

  return (
    <div className="mim">
      <div className="mim-head">
        <h3 className="mim-title">Meet in the middle — square-rooting the exponent</h3>
        <p className="mim-sub">
          Split the set, list every subset sum of each half, sort one side, and binary-search for the
          complement of each left sum. 2^n brute force collapses to 2·2^(n/2).
        </p>
      </div>

      <div className="mim-controls">
        <div className="mim-presets">
          <span className="mim-input-label">set · target</span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              className={`mim-chip ${presetIdx === i ? 'is-active' : ''}`}
              onClick={() => pick(i)}
            >
              [{p.set.join(',')}] to {p.target}
            </button>
          ))}
        </div>
        <span className="mim-spacer" aria-hidden="true" />
        <button
          type="button"
          className="mim-btn"
          onClick={() => setStage((s) => Math.max(0, s - 1))}
          disabled={stage === 0}
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          type="button"
          className="mim-btn mim-btn-primary"
          onClick={() => setStage((s) => Math.min(STAGES.length - 1, s + 1))}
          disabled={stage === STAGES.length - 1}
        >
          Step <ChevronRight size={14} />
        </button>
        <button type="button" className="mim-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="mim-stageband">
        <Split size={14} className="mim-band-ic" />
        <span className="mim-band-step">stage {stage + 1}/4</span>
        <span className="mim-band-label">{STAGE_LABEL[stageKey]}</span>
        <span className="mim-band-target">
          <Target size={13} /> target = {target}
        </span>
      </div>

      <div className="mim-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mim-svg" preserveAspectRatio="xMidYMid meet">
          {renderHalf('left half', model.left, leftBaseX, 'L')}
          {renderHalf('right half', model.right, rightBaseX, 'R')}

          {/* divider */}
          <line className="mim-divider" x1={W / 2} y1={topY - 18} x2={W / 2} y2={H - 24} />

          {/* left subset sums */}
          {showLeftSums && (
            <g>
              <text className="mim-sums-label" x={leftBaseX} y={sumsY - 12}>
                left sums (2^{model.left.length})
              </text>
              {model.leftSums.map((s, i) => {
                const perRow = 4;
                const r = Math.floor(i / perRow);
                const c = i % perRow;
                const x = leftBaseX + c * (sumCellW + sumGap);
                const y = sumsY + r * 40;
                const isHit = model.found && stageKey === 'search' && model.found.ls.mask === s.mask;
                return (
                  <g key={`ls-${i}`}>
                    <rect
                      className={`mim-sum ${isHit ? 'is-hit' : ''}`}
                      x={x}
                      y={y}
                      width={sumCellW}
                      height={30}
                      rx={6}
                    />
                    <text className="mim-sum-val" x={x + sumCellW / 2} y={y + 20}>{s.sum}</text>
                  </g>
                );
              })}
            </g>
          )}

          {/* right subset sums (sorted) */}
          {showRightSums && (
            <g>
              <text className="mim-sums-label is-right" x={W - 60} y={sumsY - 12}>
                right sums sorted (2^{model.right.length})
              </text>
              {model.rightSums.map((s, i) => {
                const perRow = 4;
                const r = Math.floor(i / perRow);
                const c = i % perRow;
                const rowCount = Math.min(perRow, model.rightSums.length - r * perRow);
                const rowW = rowCount * (sumCellW + sumGap) - sumGap;
                const x = W - 60 - rowW + c * (sumCellW + sumGap);
                const y = sumsY + r * 40;
                const need = model.found ? target - model.found.ls.sum : null;
                const isHit = model.found && stageKey === 'search' && s.sum === need && model.found.rs.mask === s.mask;
                return (
                  <g key={`rs-${i}`}>
                    <rect
                      className={`mim-sum is-right ${isHit ? 'is-hit' : ''}`}
                      x={x}
                      y={y}
                      width={sumCellW}
                      height={30}
                      rx={6}
                    />
                    <text className="mim-sum-val" x={x + sumCellW / 2} y={y + 20}>{s.sum}</text>
                  </g>
                );
              })}
            </g>
          )}

          {/* search summary line */}
          {stageKey === 'search' && (
            <text className="mim-search-line" x={W / 2} y={H - 16}>
              {model.found
                ? `left ${model.found.ls.sum} + right ${model.found.rs.sum} = ${target} — match found`
                : `no subset sums to ${target}`}
            </text>
          )}
        </svg>
      </div>

      <div className="mim-metrics">
        <div className="mim-metric">
          <span className="mim-metric-label">brute force</span>
          <span className="mim-metric-value is-bad">2^{set.length} = {model.brute}</span>
        </div>
        <div className="mim-metric">
          <span className="mim-metric-label">meet-in-middle</span>
          <span className="mim-metric-value is-good">2·2^{model.half} = {model.mitm}</span>
        </div>
        <div className="mim-metric is-wide">
          <span className="mim-metric-label">complexity</span>
          <span
            className="mim-metric-katex"
            dangerouslySetInnerHTML={{ __html: km('O(2^{n/2} \\cdot n)') }}
          />
        </div>
        <div className="mim-metric is-wide">
          <span className="mim-metric-label">found pair</span>
          <span className="mim-metric-value">
            {model.found
              ? `{idx ${model.found.ls.picks.join(',') || '-'}} + {idx ${model.found.rs.picks.join(',') || '-'}}`
              : 'none'}
          </span>
        </div>
      </div>

      <div className="mim-narration">
        <span className="mim-narration-label">why it matters</span>
        <span className="mim-narration-body">
          Doubling n adds one element to each half, so the work only doubles instead of squaring — that
          square-root in the exponent pushes subset-sum from n≈20 (brute) up to n≈40 (meet-in-middle).
          The sorted right half turns each complement lookup into a binary search, keeping the search
          near-linear in the number of sums.
        </span>
      </div>
    </div>
  );
}
