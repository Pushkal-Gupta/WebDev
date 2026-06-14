import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './IntervalDPViz.css';

// Matrix-chain multiplication interval DP.
// Matrices A1..An have dimensions p[i-1] x p[i].  dp[i][j] = minimum scalar
// multiplications to multiply the chain A_i..A_j (1-indexed, i <= j).
//   dp[i][i] = 0
//   dp[i][j] = min over split k in [i, j-1] of
//              dp[i][k] + dp[k+1][j] + p[i-1]*p[k]*p[j]
// Fill order is by increasing interval LENGTH so every sub-interval is ready.

const DIMS = [40, 20, 30, 10, 30]; // p0..p4 -> matrices A1(40x20) A2(20x30) A3(30x10) A4(10x30)
const N = DIMS.length - 1; // number of matrices

const INF = Infinity;

function emptyTable() {
  const dp = [];
  const split = [];
  for (let i = 0; i <= N + 1; i++) {
    dp.push(new Array(N + 2).fill(INF));
    split.push(new Array(N + 2).fill(-1));
  }
  return { dp, split };
}

function cloneTable(t) {
  return {
    dp: t.dp.map((r) => r.slice()),
    split: t.split.map((r) => r.slice()),
  };
}

// Build the parenthesization string for the chain i..j from the split table.
function paren(split, i, j) {
  if (i === j) return `A${i}`;
  const k = split[i][j];
  return `(${paren(split, i, k)}·${paren(split, k + 1, j)})`;
}

function buildFrames() {
  const t = emptyTable();
  const frames = [];

  // Diagonal: length-1 intervals cost 0.
  for (let i = 1; i <= N; i++) t.dp[i][i] = 0;
  frames.push({
    table: cloneTable(t),
    i: null,
    j: null,
    k: null,
    len: 1,
    cand: null,
    best: null,
    accepted: null,
    cells: [],
    phase: 'diagonal',
    note:
      `Length-1 intervals: a single matrix needs no multiplication, so dp[i][i] = 0 for all i. ` +
      `These form the diagonal and seed every larger interval.`,
  });

  // Increasing interval length.
  for (let len = 2; len <= N; len++) {
    for (let i = 1; i <= N - len + 1; i++) {
      const j = i + len - 1;
      let best = INF;
      let bestK = -1;
      for (let k = i; k < j; k++) {
        const left = t.dp[i][k];
        const right = t.dp[k + 1][j];
        const mult = DIMS[i - 1] * DIMS[k] * DIMS[j];
        const cand = left + right + mult;
        const accepted = cand < best;
        if (accepted) {
          best = cand;
          bestK = k;
        }
        frames.push({
          table: cloneTable(t),
          i,
          j,
          k,
          len,
          left,
          right,
          mult,
          cand,
          best: best === INF ? null : best,
          bestK,
          accepted,
          cells: [
            { r: i, c: k },
            { r: k + 1, c: j },
          ],
          phase: 'try',
          note:
            `dp[${i}][${j}] (length ${len}): try split k=${k} -> ` +
            `dp[${i}][${k}] + dp[${k + 1}][${j}] + p${i - 1}·p${k}·p${j} = ` +
            `${left} + ${right} + ${DIMS[i - 1]}·${DIMS[k]}·${DIMS[j]} = ${cand}. ` +
            (accepted
              ? `${best === cand && bestK === k ? 'New best' : 'Best'} so far ${best} at k=${k}.`
              : `Not better than ${best}; keep k=${bestK}.`),
        });
      }
      t.dp[i][j] = best;
      t.split[i][j] = bestK;
      frames.push({
        table: cloneTable(t),
        i,
        j,
        k: bestK,
        len,
        cand: best,
        best,
        bestK,
        accepted: true,
        cells: [{ r: i, c: j }],
        phase: 'commit',
        note:
          `Commit dp[${i}][${j}] = ${best}, best split at k=${bestK}: ` +
          `${paren(t.split, i, j)}. This cell is now ready for longer intervals.`,
      });
    }
  }

  const answer = t.dp[1][N];
  frames.push({
    table: cloneTable(t),
    i: 1,
    j: N,
    k: t.split[1][N],
    len: N,
    cand: answer,
    best: answer,
    bestK: t.split[1][N],
    accepted: null,
    cells: [{ r: 1, c: N }],
    phase: 'done',
    note:
      `Optimal cost dp[1][${N}] = ${answer} multiplications. ` +
      `Best order: ${paren(t.split, 1, N)}. Interval DP runs in O(n^3) over O(n^2) states.`,
  });

  return frames;
}

const VAL = (v) => (v === INF || v == null ? '·' : v);

export default function IntervalDPViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
  const totalSteps = frames.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(950 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  // ---- geometry ----
  const W = 940;
  const H = 470;

  // Matrix chain occupies a strip across the top.
  const chainTop = 44;
  const chainH = 64;
  const chainGap = 8;
  const chainX0 = 24;
  const chainW = (W - 2 * chainX0 - (N - 1) * chainGap) / N;

  // dp triangular table sits below, on the left.
  const tblTop = chainTop + chainH + 56;
  const tblX = 86;
  const cellSize = Math.min(58, (W * 0.5 - tblX) / N, (H - tblTop - 24) / N);
  const cellPad = 3;

  const colX = (c) => tblX + (c - 1) * cellSize;
  const rowY = (r) => tblTop + (r - 1) * cellSize;

  const dp = current.table.dp;
  const split = current.table.split;

  // Active-cell lookup sets for highlighting.
  const subCells = new Set(
    current.phase === 'try' ? (current.cells || []).map((c) => `${c.r}-${c.c}`) : [],
  );
  const targetCell =
    current.i != null && current.j != null ? `${current.i}-${current.j}` : null;

  // Final parenthesization (available once the table is filled enough).
  const finalParen =
    current.phase === 'done' || (current.phase === 'commit' && split[1][N] !== -1)
      ? paren(split, 1, N)
      : null;

  return (
    <div className="idv">
      <div className="idv-head">
        <h3 className="idv-title">Interval DP — matrix-chain multiplication</h3>
        <p className="idv-sub">
          dp[i][j] is the fewest scalar multiplications to multiply matrices Ai..Aj. Fill by growing
          interval length; for each interval try every split k and keep the cheapest.
        </p>
      </div>

      <div className="idv-controls">
        <div className="idv-buttons">
          <button
            type="button"
            className="idv-btn idv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((v) => !v);
            }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="idv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="idv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="idv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <label className="idv-speed">
          <span className="idv-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="idv-speed-range"
          />
          <span className="idv-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="idv-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="idv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="idv-svg" preserveAspectRatio="xMidYMid meet">
          {/* ---- matrix chain strip ---- */}
          <text x={chainX0} y={chainTop - 12} className="idv-panel-label">
            matrix chain — dims p0..p{N}
          </text>
          {Array.from({ length: N }).map((_, idx) => {
            const m = idx + 1;
            const rows = DIMS[m - 1];
            const cols = DIMS[m];
            const x = chainX0 + idx * (chainW + chainGap);
            const involved =
              current.phase !== 'diagonal' &&
              current.i != null &&
              m >= current.i &&
              m <= current.j;
            const onSplitBoundary =
              current.phase === 'try' && current.k != null && (m === current.k || m === current.k + 1);
            let fill = 'var(--surface)';
            let stroke = 'var(--border)';
            if (onSplitBoundary) {
              fill = 'var(--hue-sky)';
              stroke = 'var(--hue-sky)';
            } else if (involved) {
              fill = 'rgba(var(--accent-rgb), 0.18)';
              stroke = 'var(--accent)';
            }
            const txtFill = onSplitBoundary ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`mat-${m}`}>
                <rect
                  x={x}
                  y={chainTop}
                  width={chainW}
                  height={chainH}
                  rx={6}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={onSplitBoundary || involved ? 2 : 1}
                />
                <text x={x + chainW / 2} y={chainTop + 24} className="idv-mat-name" style={{ fill: txtFill }}>
                  A{m}
                </text>
                <text x={x + chainW / 2} y={chainTop + 44} className="idv-mat-dim" style={{ fill: txtFill }}>
                  {rows}×{cols}
                </text>
              </g>
            );
          })}
          {/* split bar between the two sub-chains being combined */}
          {current.phase === 'try' && current.k != null && (() => {
            const idx = current.k; // boundary after matrix k (1-indexed) -> between idx-1 and idx
            const x = chainX0 + idx * (chainW + chainGap) - chainGap / 2;
            return (
              <g>
                <line
                  x1={x}
                  y1={chainTop - 4}
                  x2={x}
                  y2={chainTop + chainH + 4}
                  stroke="var(--hue-pink)"
                  strokeWidth={2.5}
                  strokeDasharray="4 3"
                />
                <text x={x} y={chainTop + chainH + 18} className="idv-split-tag">
                  split k={current.k}
                </text>
              </g>
            );
          })()}

          {/* ---- dp triangular table ---- */}
          <text x={tblX} y={tblTop - 30} className="idv-panel-label">
            dp[i][j] — rows i, cols j (upper triangle)
          </text>
          {/* column headers (j) */}
          {Array.from({ length: N }).map((_, idx) => {
            const j = idx + 1;
            return (
              <text key={`colh-${j}`} x={colX(j) + cellSize / 2} y={tblTop - 10} className="idv-axh">
                j={j}
              </text>
            );
          })}
          {/* row headers (i) */}
          {Array.from({ length: N }).map((_, idx) => {
            const i = idx + 1;
            return (
              <text key={`rowh-${i}`} x={tblX - 12} y={rowY(i) + cellSize / 2 + 4} className="idv-axh idv-axh-row">
                i={i}
              </text>
            );
          })}

          {Array.from({ length: N }).map((_, ri) => {
            const i = ri + 1;
            return Array.from({ length: N }).map((__, ci) => {
              const j = ci + 1;
              if (j < i) return null; // lower triangle unused
              const val = dp[i][j];
              const known = val !== INF;
              const key = `${i}-${j}`;
              const isTarget = key === targetCell && current.phase !== 'done';
              const isSub = subCells.has(key);
              const isDiag = i === j;
              let fill = 'var(--bg)';
              let stroke = 'var(--border)';
              if (isTarget && current.phase === 'commit') {
                fill = 'var(--accent)';
                stroke = 'var(--accent)';
              } else if (isTarget) {
                fill = 'rgba(var(--accent-rgb), 0.30)';
                stroke = 'var(--accent)';
              } else if (isSub) {
                fill = 'var(--hue-sky)';
                stroke = 'var(--hue-sky)';
              } else if (isDiag && known) {
                fill = 'rgba(var(--hue-mint-rgb, var(--accent-rgb)), 0.16)';
                stroke = 'var(--hue-mint)';
              } else if (known) {
                fill = 'rgba(var(--accent-rgb), 0.12)';
                stroke = 'rgba(var(--accent-rgb), 0.4)';
              }
              const txtFill =
                (isTarget && current.phase === 'commit') || isSub ? 'var(--bg)' : known ? 'var(--text-main)' : 'var(--border)';
              return (
                <g key={`cell-${key}`}>
                  <rect
                    x={colX(j) + cellPad}
                    y={rowY(i) + cellPad}
                    width={cellSize - cellPad * 2}
                    height={cellSize - cellPad * 2}
                    rx={5}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isTarget || isSub ? 2.4 : 1}
                  />
                  <text
                    x={colX(j) + cellSize / 2}
                    y={rowY(i) + cellSize / 2 + 4}
                    className="idv-cellval"
                    style={{ fill: txtFill }}
                  >
                    {VAL(val)}
                  </text>
                </g>
              );
            });
          })}
        </svg>
      </div>

      <div className="idv-metrics">
        <div className="idv-metric">
          <span className="idv-metric-label">interval [i, j]</span>
          <span className="idv-metric-value">
            {current.i != null ? `[${current.i}, ${current.j}]` : '—'}
          </span>
        </div>
        <div className="idv-metric">
          <span className="idv-metric-label">length</span>
          <span className="idv-metric-value">{current.len}</span>
        </div>
        <div className="idv-metric">
          <span className="idv-metric-label">split k tried</span>
          <span className="idv-metric-value">
            {current.phase === 'try' ? current.k : '—'}
          </span>
        </div>
        <div className="idv-metric">
          <span className="idv-metric-label">candidate cost</span>
          <span className="idv-metric-value">
            {current.phase === 'try' ? current.cand : '—'}
          </span>
        </div>
        <div className="idv-metric idv-metric-best">
          <span className="idv-metric-label">best so far</span>
          <span className="idv-metric-value">{current.best == null ? '—' : current.best}</span>
        </div>
      </div>

      {finalParen && (
        <div className="idv-paren">
          <span className="idv-paren-label">optimal parenthesization</span>
          <span className="idv-paren-value">{finalParen}</span>
        </div>
      )}

      <div className="idv-arith">
        <span className="idv-arith-label">trace</span>
        <span className="idv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
