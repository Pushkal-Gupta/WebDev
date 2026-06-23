import React, { useId, useMemo, useState } from 'react';
import { RotateCcw, Layers, TriangleAlert, CheckCheck } from 'lucide-react';
import './SparseTableDeepViz.css';

const ARR = [3, 1, 4, 1, 5, 9, 2, 6];

const OPS = [
  { id: 'min', label: 'min (idempotent)' },
  { id: 'sum', label: 'sum (non-idempotent)' },
];

const TABLES = [
  { id: 'standard', label: 'standard (overlap)' },
  { id: 'disjoint', label: 'disjoint (split at MSB)' },
];

function highbit(x) {
  // index of the highest set bit; x assumed > 0
  let b = -1;
  while (x > 0) {
    b += 1;
    x >>= 1;
  }
  return b;
}

function rangeAgg(l, r, op) {
  let acc = op === 'min' ? Infinity : 0;
  for (let i = l; i <= r; i += 1) {
    acc = op === 'min' ? Math.min(acc, ARR[i]) : acc + ARR[i];
  }
  return acc;
}

// ---- standard (two overlapping power-of-2 windows) -------------------------
function standardTrace(L, R, op) {
  const len = R - L + 1;
  const k = highbit(len); // 2^k <= len
  const aL = L;
  const aR = L + (1 << k) - 1;
  const bR = R;
  const bL = R - (1 << k) + 1;
  const aVal = rangeAgg(aL, aR, op);
  const bVal = rangeAgg(bL, bR, op);
  const got = op === 'min' ? Math.min(aVal, bVal) : aVal + bVal;
  const truth = rangeAgg(L, R, op);
  const overlapL = bL;
  const overlapR = aR;
  const overlaps = overlapL <= overlapR;
  const overlapIdx = [];
  if (overlaps) for (let i = overlapL; i <= overlapR; i += 1) overlapIdx.push(i);
  const correct = got === truth;
  return {
    k, aL, aR, bL, bR, aVal, bVal, got, truth,
    overlaps, overlapIdx, correct,
    winA: { l: aL, r: aR }, winB: { l: bL, r: bR },
  };
}

// ---- disjoint (split at highest differing bit) -----------------------------
function disjointTrace(L, R, op) {
  if (L === R) {
    const v = ARR[L];
    return {
      k: 0, m: L, suffix: { l: L, r: L }, prefix: { l: L, r: L },
      suffixVal: v, prefixVal: op === 'min' ? Infinity : 0,
      got: v, truth: v, correct: true, single: true,
    };
  }
  const k = highbit(L ^ R); // highest bit where L and R differ
  const m = (L >> k) << k; // block boundary; midpoint just below 2^k boundary
  const mid = m + (1 << k) - 1; // last index of the lower half block containing L
  // suffix half: [L .. mid], prefix half: [mid+1 .. R]
  const sufL = L;
  const sufR = mid;
  const preL = mid + 1;
  const preR = R;
  const suffixVal = rangeAgg(sufL, sufR, op);
  const prefixVal = rangeAgg(preL, preR, op);
  const got = op === 'min' ? Math.min(suffixVal, prefixVal) : suffixVal + prefixVal;
  const truth = rangeAgg(L, R, op);
  return {
    k, m: mid, suffix: { l: sufL, r: sufR }, prefix: { l: preL, r: preR },
    suffixVal, prefixVal, got, truth, correct: got === truth, single: false,
  };
}

export default function SparseTableDeepViz() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [op, setOp] = useState('sum');
  const [table, setTable] = useState('standard');
  const [L, setL] = useState(2);
  const [R, setR] = useState(6);

  const std = useMemo(() => standardTrace(L, R, op), [L, R, op]);
  const dis = useMemo(() => disjointTrace(L, R, op), [L, R, op]);

  const setLClamped = (v) => {
    const nv = Math.max(0, Math.min(ARR.length - 1, v));
    setL(nv);
    if (nv > R) setR(nv);
  };
  const setRClamped = (v) => {
    const nv = Math.max(0, Math.min(ARR.length - 1, v));
    setR(nv);
    if (nv < L) setL(nv);
  };

  const reset = () => {
    setOp('sum');
    setTable('standard');
    setL(2);
    setR(6);
  };

  // SVG geometry
  const W = 940;
  const cellW = 92;
  const cellGap = 8;
  const gridLeft = (W - (ARR.length * cellW + (ARR.length - 1) * cellGap)) / 2;
  const gridTop = 96;
  const cellH = 56;

  const cellX = (i) => gridLeft + i * (cellW + cellGap);
  const spanX = (l) => cellX(l) - 2;
  const spanW = (l, r) => (r - l + 1) * cellW + (r - l) * cellGap + 4;

  const isStandard = table === 'standard';

  // cell roles for tinting
  function cellRole(i) {
    if (isStandard) {
      const inA = i >= std.winA.l && i <= std.winA.r;
      const inB = i >= std.winB.l && i <= std.winB.r;
      if (inA && inB) return 'overlap';
      if (inA) return 'winA';
      if (inB) return 'winB';
      return 'idle';
    }
    if (dis.single) return i === dis.suffix.l ? 'winA' : 'idle';
    if (i >= dis.suffix.l && i <= dis.suffix.r) return 'winA';
    if (i >= dis.prefix.l && i <= dis.prefix.r) return 'winB';
    return 'idle';
  }

  const cur = isStandard ? std : dis;
  const correct = cur.correct;

  // narration
  let narration;
  if (isStandard) {
    if (std.overlaps) {
      if (op === 'min') {
        narration = `len=${R - L + 1}, k=${std.k}. The two windows [${std.winA.l}..${std.winA.r}] and [${std.winB.l}..${std.winB.r}] overlap on {${std.overlapIdx.join(', ')}}. min is idempotent — min(x,x)=x — so re-reading the overlap is free. Answer ${std.got} matches the true ${std.truth}.`;
      } else {
        narration = `len=${R - L + 1}, k=${std.k}. Windows [${std.winA.l}..${std.winA.r}] and [${std.winB.l}..${std.winB.r}] overlap on {${std.overlapIdx.join(', ')}}. sum is non-idempotent — a+a ≠ a — so that overlap is counted twice. Got ${std.got}, but the true sum is ${std.truth}: the overlap (=${rangeAgg(std.overlapIdx[0], std.overlapIdx[std.overlapIdx.length - 1], 'sum')}) was double-counted.`;
      }
    } else {
      narration = `len=${R - L + 1}, k=${std.k}. The two power-of-2 windows tile [${L}..${R}] exactly with no overlap, so even sum is correct here. Answer ${std.got} = true ${std.truth}.`;
    }
  } else if (dis.single) {
    narration = `Single element [${L}..${R}]. The disjoint table returns ARR[${L}]=${ARR[L]} directly — no split needed.`;
  } else {
    narration = `k = highbit(L⊕R) = ${dis.k}. Split [${L}..${R}] at the block boundary: suffix half [${dis.suffix.l}..${dis.suffix.r}] and prefix half [${dis.prefix.l}..${dis.prefix.r}] are DISJOINT — no index is read twice. op(${dis.suffixVal}, ${dis.prefixVal}) = ${dis.got}, exactly the true ${dis.truth}. Works for ANY associative op.`;
  }

  return (
    <div className="stdv">
      <div className="stdv-head">
        <span className="stdv-head-icon"><Layers size={18} /></span>
        <div className="stdv-head-text">
          <h3 className="stdv-title">Sparse table — idempotency and the disjoint table</h3>
          <p className="stdv-sub">
            The overlap trick needs an idempotent op. For sum it double-counts — the disjoint table
            splits the range so no index is ever read twice.
          </p>
        </div>
      </div>

      <div className="stdv-controls">
        <div className="stdv-toggle-group">
          <span className="stdv-input-label">op</span>
          <div className="stdv-toggle" role="tablist" aria-label="Operation">
            {OPS.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`stdv-tog ${op === o.id ? 'is-on' : ''}`}
                onClick={() => setOp(o.id)}
                aria-pressed={op === o.id}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="stdv-toggle-group">
          <span className="stdv-input-label">table</span>
          <div className="stdv-toggle" role="tablist" aria-label="Table mode">
            {TABLES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`stdv-tog ${table === t.id ? 'is-on' : ''}`}
                onClick={() => setTable(t.id)}
                aria-pressed={table === t.id}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <label className="stdv-slider">
          <span className="stdv-input-label">L</span>
          <input
            type="range" min={0} max={ARR.length - 1} step={1} value={L}
            onChange={(e) => setLClamped(Number(e.target.value))}
            className="stdv-range" aria-label="Range start L"
          />
          <span className="stdv-slider-val">{L}</span>
        </label>

        <label className="stdv-slider">
          <span className="stdv-input-label">R</span>
          <input
            type="range" min={0} max={ARR.length - 1} step={1} value={R}
            onChange={(e) => setRClamped(Number(e.target.value))}
            className="stdv-range" aria-label="Range end R"
          />
          <span className="stdv-slider-val">{R}</span>
        </label>

        <span className="stdv-spacer" aria-hidden="true" />

        <button type="button" className="stdv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="stdv-stage">
        <svg viewBox={`0 0 ${W} 230`} className="stdv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`${uid}-A`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-sky)" stopOpacity="0.26" />
              <stop offset="100%" stopColor="var(--hue-sky)" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id={`${uid}-B`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-pink)" stopOpacity="0.26" />
              <stop offset="100%" stopColor="var(--hue-pink)" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* range bracket */}
          <text className="stdv-range-label" x={W / 2} y={28} textAnchor="middle">
            query [{L} .. {R}]   {isStandard ? `standard · two 2^${std.k} windows` : `disjoint · split at index ${dis.m}`}
          </text>

          {/* window span bands */}
          {isStandard ? (
            <>
              <rect
                className="stdv-band stdv-band-a"
                x={spanX(std.winA.l)} y={gridTop - 26} width={spanW(std.winA.l, std.winA.r)} height={26} rx={5}
                fill={`url(#${uid}-A)`}
              />
              <text className="stdv-band-tag stdv-tag-a" x={spanX(std.winA.l) + 6} y={gridTop - 9}>
                st[{std.k}][{std.winA.l}] = {std.aVal}
              </text>
              <rect
                className="stdv-band stdv-band-b"
                x={spanX(std.winB.l)} y={gridTop + cellH + 2} width={spanW(std.winB.l, std.winB.r)} height={26} rx={5}
                fill={`url(#${uid}-B)`}
              />
              <text className="stdv-band-tag stdv-tag-b" x={spanX(std.winB.l) + 6} y={gridTop + cellH + 19}>
                st[{std.k}][{std.winB.l}] = {std.bVal}
              </text>
            </>
          ) : (
            !dis.single && (
              <>
                <rect
                  className="stdv-band stdv-band-a"
                  x={spanX(dis.suffix.l)} y={gridTop - 26} width={spanW(dis.suffix.l, dis.suffix.r)} height={26} rx={5}
                  fill={`url(#${uid}-A)`}
                />
                <text className="stdv-band-tag stdv-tag-a" x={spanX(dis.suffix.l) + 6} y={gridTop - 9}>
                  suffix [{dis.suffix.l}..{dis.suffix.r}] = {dis.suffixVal}
                </text>
                <rect
                  className="stdv-band stdv-band-b"
                  x={spanX(dis.prefix.l)} y={gridTop - 26} width={spanW(dis.prefix.l, dis.prefix.r)} height={26} rx={5}
                  fill={`url(#${uid}-B)`}
                />
                <text className="stdv-band-tag stdv-tag-b" x={spanX(dis.prefix.l) + 6} y={gridTop - 9}>
                  prefix [{dis.prefix.l}..{dis.prefix.r}] = {dis.prefixVal}
                </text>
              </>
            )
          )}

          {/* split divider for disjoint */}
          {!isStandard && !dis.single && (
            <line
              className="stdv-split"
              x1={cellX(dis.m) + cellW + cellGap / 2}
              y1={gridTop - 30}
              x2={cellX(dis.m) + cellW + cellGap / 2}
              y2={gridTop + cellH + 8}
            />
          )}

          {/* array cells */}
          {ARR.map((v, i) => {
            const role = cellRole(i);
            return (
              <g key={`c-${i}`}>
                <rect
                  className={`stdv-cell stdv-role-${role}`}
                  x={cellX(i)} y={gridTop} width={cellW} height={cellH} rx={7}
                />
                <text className="stdv-cell-val" x={cellX(i) + cellW / 2} y={gridTop + 28} textAnchor="middle">{v}</text>
                <text className="stdv-cell-idx" x={cellX(i) + cellW / 2} y={gridTop + 46} textAnchor="middle">idx {i}</text>
                {isStandard && role === 'overlap' && (
                  <text className="stdv-cell-flag" x={cellX(i) + cellW / 2} y={gridTop + cellH + 30} textAnchor="middle">
                    {op === 'sum' ? '2x' : 'shared'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className={`stdv-verdict ${correct ? 'is-ok' : 'is-warn'}`}>
        <span className="stdv-verdict-icon">
          {correct ? <CheckCheck size={18} /> : <TriangleAlert size={18} />}
        </span>
        <div className="stdv-verdict-body">
          <span className="stdv-verdict-tag">{correct ? 'CORRECT' : 'WRONG — double-count'}</span>
          <span className="stdv-verdict-text">
            {isStandard
              ? (op === 'min'
                ? 'min is idempotent: overlapping windows re-read shared cells harmlessly.'
                : (std.overlaps
                  ? `sum is non-idempotent: the overlap {${std.overlapIdx.join(', ')}} is added twice.`
                  : 'windows tile the range exactly — no overlap, so sum is correct.'))
              : 'disjoint read: suffix half and prefix half never share an index, so any associative op is exact.'}
          </span>
        </div>
      </div>

      <div className="stdv-metrics">
        {isStandard ? (
          <>
            <div className="stdv-metric">
              <span className="stdv-metric-label">k (2^k ≤ len)</span>
              <span className="stdv-metric-value">{std.k}</span>
            </div>
            <div className="stdv-metric">
              <span className="stdv-metric-label">window A</span>
              <span className="stdv-metric-value is-a">[{std.winA.l}..{std.winA.r}] = {std.aVal}</span>
            </div>
            <div className="stdv-metric">
              <span className="stdv-metric-label">window B</span>
              <span className="stdv-metric-value is-b">[{std.winB.l}..{std.winB.r}] = {std.bVal}</span>
            </div>
            <div className="stdv-metric">
              <span className="stdv-metric-label">overlap</span>
              <span className="stdv-metric-value">
                {std.overlaps ? `{${std.overlapIdx.join(', ')}}` : 'none'}
              </span>
            </div>
            <div className="stdv-metric">
              <span className="stdv-metric-label">got</span>
              <span className={`stdv-metric-value ${correct ? 'is-ok' : 'is-warn'}`}>{std.got}</span>
            </div>
            <div className="stdv-metric">
              <span className="stdv-metric-label">true answer</span>
              <span className="stdv-metric-value is-ok">{std.truth}</span>
            </div>
          </>
        ) : (
          <>
            <div className="stdv-metric">
              <span className="stdv-metric-label">k = highbit(L⊕R)</span>
              <span className="stdv-metric-value">{dis.k}</span>
            </div>
            <div className="stdv-metric">
              <span className="stdv-metric-label">split index</span>
              <span className="stdv-metric-value">{dis.m}</span>
            </div>
            <div className="stdv-metric">
              <span className="stdv-metric-label">suffix half</span>
              <span className="stdv-metric-value is-a">[{dis.suffix.l}..{dis.suffix.r}] = {dis.suffixVal}</span>
            </div>
            <div className="stdv-metric">
              <span className="stdv-metric-label">prefix half</span>
              <span className="stdv-metric-value is-b">
                {dis.single ? '—' : `[${dis.prefix.l}..${dis.prefix.r}] = ${dis.prefixVal}`}
              </span>
            </div>
            <div className="stdv-metric">
              <span className="stdv-metric-label">got</span>
              <span className="stdv-metric-value is-ok">{dis.got}</span>
            </div>
            <div className="stdv-metric">
              <span className="stdv-metric-label">true answer</span>
              <span className="stdv-metric-value is-ok">{dis.truth}</span>
            </div>
          </>
        )}
      </div>

      <div className="stdv-narration">
        <span className="stdv-narration-label">trace</span>
        <span className="stdv-narration-body">{narration}</span>
      </div>
    </div>
  );
}
