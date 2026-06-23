import React, { useId, useMemo, useState } from 'react';
import { RotateCcw, Table2, Check, X } from 'lucide-react';
import './SparseTableRmqViz.css';

const ARR = [3, 1, 4, 1, 5, 9, 2, 6];
const N = ARR.length;
const MAXK = Math.floor(Math.log2(N)); // 3

// Build the sparse table: st[k][i] = min(arr[i .. i + 2^k - 1]).
function buildSparseTable() {
  const st = [];
  st[0] = ARR.slice();
  for (let k = 1; k <= MAXK; k += 1) {
    const span = 1 << k;
    const half = 1 << (k - 1);
    const row = [];
    for (let i = 0; i + span - 1 < N; i += 1) {
      row[i] = Math.min(st[k - 1][i], st[k - 1][i + half]);
    }
    st[k] = row;
  }
  return st;
}

const ST = buildSparseTable();

export default function SparseTableRmqViz() {
  const uid = useId();
  const skyGrad = `strv-sky-${uid}`;
  const pinkGrad = `strv-pink-${uid}`;

  const [range, setRange] = useState({ L: 1, R: 5 });
  const { L, R } = range;

  const q = useMemo(() => {
    const len = R - L + 1;
    const k = Math.floor(Math.log2(len));
    const span = 1 << k;
    const aStart = L;
    const aEnd = L + span - 1;
    const bStart = R - span + 1;
    const bEnd = R;
    const aVal = ST[k][aStart];
    const bVal = ST[k][bStart];
    const answer = Math.min(aVal, bVal);
    let brute = Infinity;
    for (let i = L; i <= R; i += 1) brute = Math.min(brute, ARR[i]);
    const overlap = [];
    for (let i = Math.max(aStart, bStart); i <= Math.min(aEnd, bEnd); i += 1) overlap.push(i);
    return { len, k, span, aStart, aEnd, bStart, bEnd, aVal, bVal, answer, brute, overlap };
  }, [L, R]);

  const setL = (v) => {
    const nl = Math.max(0, Math.min(N - 1, v));
    setRange((r) => ({ L: nl, R: Math.max(nl, r.R) }));
  };
  const setR = (v) => {
    const nr = Math.max(0, Math.min(N - 1, v));
    setRange((r) => ({ L: Math.min(nr, r.L), R: nr }));
  };
  const reset = () => setRange({ L: 1, R: 5 });

  // ---- SVG geometry ---------------------------------------------------------
  const W = 940;
  const cellW = 92;
  const cellH = 40;
  const gap = 8;
  const gridLeft = 70;
  const rowLabelW = 56;
  const baseTop = 96;
  const rowGap = 18;
  const tableTop = baseTop + cellH + 56;

  const xOf = (i) => gridLeft + i * (cellW + gap);
  const rowTop = (k) => tableTop + k * (cellH + rowGap);
  const H = rowTop(MAXK) + cellH + 30;

  const matchOk = q.answer === q.brute;

  return (
    <div className="strv">
      <div className="strv-head">
        <span className="strv-head-icon" aria-hidden="true">
          <Table2 size={18} />
        </span>
        <div className="strv-head-text">
          <h3 className="strv-title">Sparse table — range minimum in O(1)</h3>
          <p className="strv-sub">
            Drag the query range. Two power-of-2 blocks cover [L,R] with overlap — because min is
            idempotent, counting the overlap twice is free.
          </p>
        </div>
        <button type="button" className="strv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="strv-controls">
        <label className="strv-slider">
          <span className="strv-input-label strv-input-sky">L</span>
          <input
            type="range" min={0} max={N - 1} step={1} value={L}
            onChange={(e) => setL(Number(e.target.value))}
            className="strv-range strv-range-sky" aria-label="Range left index"
          />
          <span className="strv-slider-val">{L}</span>
        </label>
        <label className="strv-slider">
          <span className="strv-input-label strv-input-pink">R</span>
          <input
            type="range" min={0} max={N - 1} step={1} value={R}
            onChange={(e) => setR(Number(e.target.value))}
            className="strv-range strv-range-pink" aria-label="Range right index"
          />
          <span className="strv-slider-val">{R}</span>
        </label>
        <span className="strv-spacer" aria-hidden="true" />
        <div className="strv-formula">
          k = floor(log2({q.len})) = {q.k} &nbsp;·&nbsp; answer = min(st[{q.k}][{q.aStart}], st[{q.k}][{q.bStart}])
        </div>
      </div>

      <div className="strv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="strv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={skyGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-sky)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--hue-sky)" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id={pinkGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-pink)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--hue-pink)" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {/* --- base array --- */}
          <text className="strv-section-label" x={gridLeft} y={baseTop - 18}>
            arr[ ] — base array
          </text>

          {/* window A span (sky) */}
          <rect
            className="strv-span strv-span-sky"
            x={xOf(q.aStart) - 4}
            y={baseTop - 8}
            width={(q.aEnd - q.aStart) * (cellW + gap) + cellW + 8}
            height={cellH + 20}
            rx={9}
            fill={`url(#${skyGrad})`}
          />
          {/* window B span (pink) */}
          <rect
            className="strv-span strv-span-pink"
            x={xOf(q.bStart) - 4}
            y={baseTop - 2}
            width={(q.bEnd - q.bStart) * (cellW + gap) + cellW + 8}
            height={cellH + 20}
            rx={9}
            fill={`url(#${pinkGrad})`}
          />

          {ARR.map((v, i) => {
            const inRange = i >= L && i <= R;
            const inOverlap = q.overlap.includes(i);
            return (
              <g key={`base-${i}`}>
                <rect
                  className={`strv-cell ${inRange ? 'is-active' : ''} ${inOverlap ? 'is-overlap' : ''}`}
                  x={xOf(i)} y={baseTop} width={cellW} height={cellH} rx={7}
                />
                <text className="strv-cell-val" x={xOf(i) + cellW / 2} y={baseTop + cellH / 2 + 6}>
                  {v}
                </text>
                <text className="strv-cell-idx" x={xOf(i) + cellW / 2} y={baseTop + cellH + 17}>
                  {i}
                </text>
              </g>
            );
          })}

          {/* L / R markers */}
          <text className="strv-marker strv-marker-sky" x={xOf(L) + cellW / 2} y={baseTop - 24} textAnchor="middle">
            L={L}
          </text>
          <text className="strv-marker strv-marker-pink" x={xOf(R) + cellW / 2} y={baseTop + cellH + 36} textAnchor="middle">
            R={R}
          </text>

          {/* --- sparse table rows --- */}
          <text className="strv-section-label" x={gridLeft} y={tableTop - 20}>
            st[k][i] = min over the 2^k window starting at i
          </text>

          {ST.map((row, k) => {
            const span = 1 << k;
            const isQueryRow = k === q.k;
            return (
              <g key={`row-${k}`}>
                <text className="strv-row-label" x={gridLeft - rowLabelW + 6} y={rowTop(k) + cellH / 2 + 5}>
                  st[{k}]
                </text>
                <text className="strv-row-span" x={gridLeft - rowLabelW + 6} y={rowTop(k) + cellH / 2 + 19}>
                  w={span}
                </text>
                {row.map((val, i) => {
                  let pick = '';
                  if (isQueryRow && i === q.aStart) pick = 'is-pick-sky';
                  else if (isQueryRow && i === q.bStart) pick = 'is-pick-pink';
                  return (
                    <g key={`st-${k}-${i}`}>
                      <rect
                        className={`strv-st-cell ${isQueryRow ? 'is-row-active' : ''} ${pick}`}
                        x={xOf(i)} y={rowTop(k)} width={cellW} height={cellH} rx={6}
                      />
                      <text className="strv-st-val" x={xOf(i) + cellW / 2} y={rowTop(k) + cellH / 2 + 5}>
                        {val}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="strv-metrics">
        <div className="strv-metric">
          <span className="strv-metric-label">len = R − L + 1</span>
          <span className="strv-metric-value">{q.len}</span>
        </div>
        <div className="strv-metric">
          <span className="strv-metric-label">k = floor(log2 len)</span>
          <span className="strv-metric-value">{q.k}</span>
        </div>
        <div className="strv-metric">
          <span className="strv-metric-label">window A · sky [{q.aStart}..{q.aEnd}]</span>
          <span className="strv-metric-value is-sky">{q.aVal}</span>
        </div>
        <div className="strv-metric">
          <span className="strv-metric-label">window B · pink [{q.bStart}..{q.bEnd}]</span>
          <span className="strv-metric-value is-pink">{q.bVal}</span>
        </div>
        <div className="strv-metric">
          <span className="strv-metric-label">answer = min(A, B)</span>
          <span className="strv-metric-value is-accent">{q.answer}</span>
        </div>
        <div className="strv-metric">
          <span className="strv-metric-label">brute-force min · check</span>
          <span className={`strv-metric-value strv-check ${matchOk ? 'is-ok' : 'is-bad'}`}>
            {q.brute}
            {matchOk ? <Check size={15} /> : <X size={15} />}
          </span>
        </div>
      </div>

      <div className="strv-narration">
        <span className="strv-narration-label">trace</span>
        <span className="strv-narration-body">
          len={q.len}, k={q.k}; sky window [{q.aStart}..{q.aEnd}] and pink window [{q.bStart}..{q.bEnd}]
          {q.overlap.length
            ? ` overlap on indices {${q.overlap.join(', ')}}; min is idempotent so the overlap is free`
            : ' meet exactly with no overlap'}
          {' '}→ answer {q.answer}.
        </span>
      </div>
    </div>
  );
}
