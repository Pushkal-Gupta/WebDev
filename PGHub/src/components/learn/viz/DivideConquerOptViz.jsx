import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './DivideConquerOptViz.css';

// Divide-and-conquer DP optimization.
// One DP row:  dp[j] = min over split k in [0, j] of ( prev[k] + cost(k+1, j) ).
// The optimal split point opt[j] is MONOTONIC non-decreasing in j, which lets
// us solve a band of columns recursively while shrinking the k-search range:
//   solve(jlo, jhi, optlo, opthi):
//     jmid = (jlo + jhi) / 2
//     scan k in [optlo, min(jmid, opthi)] -> find dp[jmid], opt[jmid]
//     solve(jlo, jmid-1, optlo, opt[jmid])     // left half, narrowed top
//     solve(jmid+1, jhi, opt[jmid], opthi)     // right half, narrowed bottom
// That recursion turns the naive O(n^2) row fill into O(n log n).

const N = 8;
// Seeded prefix sums give a convex cost satisfying the quadrangle inequality.
const PREV = [0, 3, 5, 6, 8, 11, 13, 16];
const PREFIX = [0, 2, 5, 9, 14, 20, 27, 35]; // prefix[i] = sum of first (i+1) weights
const INF = Infinity;

// cost(a, b) on the inclusive segment [a, b]; convex (squared range sum).
function cost(a, b) {
  if (a > b) return 0;
  const lo = a === 0 ? 0 : PREFIX[a - 1];
  const span = PREFIX[b] - lo;
  return span * span;
}

function buildFrames() {
  const dp = new Array(N).fill(INF);
  const opt = new Array(N).fill(-1);
  const frames = [];

  const snap = () => ({ dp: dp.slice(), opt: opt.slice() });

  frames.push({
    ...snap(),
    jmid: null,
    jlo: 0,
    jhi: N - 1,
    optlo: 0,
    opthi: N - 1,
    k: null,
    cand: null,
    best: null,
    bestK: null,
    accepted: null,
    phase: 'init',
    note:
      `One DP row over columns 0..${N - 1}. dp[j] = min over split k of prev[k] + cost(k+1, j). ` +
      `Because opt[j] only moves right as j grows, we solve the whole row by divide-and-conquer, ` +
      `starting with the full column range [0, ${N - 1}] and split range [0, ${N - 1}].`,
  });

  // Iterative D&C over a stack of (jlo, jhi, optlo, opthi) calls.
  const stack = [{ jlo: 0, jhi: N - 1, optlo: 0, opthi: N - 1 }];
  while (stack.length) {
    const { jlo, jhi, optlo, opthi } = stack.pop();
    if (jlo > jhi) continue;
    const jmid = (jlo + jhi) >> 1;
    const kHi = Math.min(jmid, opthi);

    frames.push({
      ...snap(),
      jmid,
      jlo,
      jhi,
      optlo,
      opthi,
      k: null,
      cand: null,
      best: null,
      bestK: null,
      accepted: null,
      phase: 'enter',
      note:
        `solve(cols [${jlo}, ${jhi}], split range [${optlo}, ${opthi}]). ` +
        `Pick the middle column jmid=${jmid} first and scan only k in [${optlo}, ${kHi}] — ` +
        `the bounded range, not all of 0..${jmid}.`,
    });

    let best = INF;
    let bestK = -1;
    for (let k = optlo; k <= kHi; k++) {
      const cand = PREV[k] + cost(k + 1, jmid);
      const accepted = cand < best;
      if (accepted) {
        best = cand;
        bestK = k;
      }
      frames.push({
        ...snap(),
        jmid,
        jlo,
        jhi,
        optlo,
        opthi,
        k,
        cand,
        best,
        bestK,
        accepted,
        phase: 'try',
        note:
          `Column ${jmid}: try k=${k} -> prev[${k}] + cost(${k + 1}, ${jmid}) = ` +
          `${PREV[k]} + ${cost(k + 1, jmid)} = ${cand}. ` +
          (accepted
            ? `New best ${best} at k=${k}.`
            : `Not better than ${best}; keep k=${bestK}.`),
      });
    }

    dp[jmid] = best;
    opt[jmid] = bestK;
    frames.push({
      ...snap(),
      jmid,
      jlo,
      jhi,
      optlo,
      opthi,
      k: bestK,
      cand: best,
      best,
      bestK,
      accepted: true,
      phase: 'commit',
      note:
        `Commit dp[${jmid}] = ${best}, opt[${jmid}] = ${bestK}. ` +
        `Monotonicity now bounds the halves: left cols use split range [${optlo}, ${bestK}], ` +
        `right cols use [${bestK}, ${opthi}].`,
    });

    // Push right half first so left half is processed first (LIFO).
    stack.push({ jlo: jmid + 1, jhi, optlo: bestK, opthi });
    stack.push({ jlo, jhi: jmid - 1, optlo, opthi: bestK });
  }

  frames.push({
    ...snap(),
    jmid: null,
    jlo: 0,
    jhi: N - 1,
    optlo: 0,
    opthi: N - 1,
    k: null,
    cand: null,
    best: null,
    bestK: null,
    accepted: null,
    phase: 'done',
    note:
      `Whole row filled. Each column scanned only its bounded slice of split points, so total work ` +
      `is O(n log n) instead of O(n^2). The opt[] markers stay non-decreasing left to right — that's ` +
      `the monotonicity the trick relies on.`,
  });

  return frames;
}

const VAL = (v) => (v === INF || v == null ? '·' : v);

export default function DivideConquerOptViz() {
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

  const x0 = 60;
  const colW = (W - x0 - 40) / N;
  const colX = (c) => x0 + c * colW;
  const colMid = (c) => colX(c) + colW / 2;

  // dp cell row.
  const dpTop = 70;
  const dpH = 58;
  // k-axis band (search range) sits below.
  const kTop = 240;
  const kH = 54;
  const cellPad = 4;

  const { dp, opt } = current;
  const inColRange = (c) => current.jlo != null && c >= current.jlo && c <= current.jhi;
  const inSplitRange = (k) =>
    current.optlo != null && k >= current.optlo && k <= current.opthi;

  return (
    <div className="dco">
      <div className="dco-head">
        <h3 className="dco-title">Divide &amp; conquer DP optimization</h3>
        <p className="dco-sub">
          Fill one DP row where the optimal split opt[j] only moves right. Solve the middle column
          first, then recurse into halves with the split search range already narrowed.
        </p>
      </div>

      <div className="dco-controls">
        <div className="dco-buttons">
          <button
            type="button"
            className="dco-btn dco-btn-primary"
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
            className="dco-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="dco-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dco-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <label className="dco-speed">
          <span className="dco-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dco-speed-range"
          />
          <span className="dco-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="dco-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="dco-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dco-svg" preserveAspectRatio="xMidYMid meet">
          {/* ---- dp row ---- */}
          <text x={x0} y={dpTop - 14} className="dco-panel-label">
            dp[j] — one row, columns 0..{N - 1}
          </text>
          {Array.from({ length: N }).map((_, c) => {
            const known = dp[c] !== INF;
            const isMid = c === current.jmid;
            const inRange = inColRange(c) && current.phase !== 'done' && current.phase !== 'init';
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            if (isMid && (current.phase === 'commit' || current.phase === 'done')) {
              fill = 'var(--accent)';
              stroke = 'var(--accent)';
            } else if (isMid) {
              fill = 'rgba(var(--accent-rgb), 0.30)';
              stroke = 'var(--accent)';
            } else if (inRange) {
              fill = 'rgba(var(--hue-sky-rgb, var(--accent-rgb)), 0.14)';
              stroke = 'var(--hue-sky)';
            } else if (known) {
              fill = 'rgba(var(--accent-rgb), 0.12)';
              stroke = 'rgba(var(--accent-rgb), 0.4)';
            }
            const txtFill =
              isMid && (current.phase === 'commit' || current.phase === 'done')
                ? 'var(--bg)'
                : known
                  ? 'var(--text-main)'
                  : 'var(--border)';
            return (
              <g key={`dp-${c}`}>
                <rect
                  x={colX(c) + cellPad}
                  y={dpTop}
                  width={colW - cellPad * 2}
                  height={dpH}
                  rx={6}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isMid || inRange ? 2.4 : 1}
                />
                <text x={colMid(c)} y={dpTop + 22} className="dco-colidx" style={{ fill: txtFill }}>
                  j={c}
                </text>
                <text x={colMid(c)} y={dpTop + 44} className="dco-cellval" style={{ fill: txtFill }}>
                  {VAL(dp[c])}
                </text>
                {/* opt[] split marker */}
                {opt[c] >= 0 && (
                  <text x={colMid(c)} y={dpTop + dpH + 18} className="dco-optmark">
                    opt={opt[c]}
                  </text>
                )}
              </g>
            );
          })}

          {/* column-range bracket over the dp row */}
          {current.jlo != null &&
            current.phase !== 'init' &&
            current.phase !== 'done' &&
            current.jlo <= current.jhi && (
              <g>
                <line
                  x1={colX(current.jlo) + cellPad}
                  y1={dpTop - 6}
                  x2={colX(current.jhi) + colW - cellPad}
                  y2={dpTop - 6}
                  stroke="var(--hue-sky)"
                  strokeWidth={2.5}
                />
                <text
                  x={(colX(current.jlo) + colX(current.jhi) + colW) / 2}
                  y={dpTop - 22}
                  className="dco-range-tag dco-range-cols"
                >
                  cols [{current.jlo}, {current.jhi}]
                </text>
              </g>
            )}

          {/* jmid pointer connecting dp cell to the k-axis */}
          {current.jmid != null && current.phase !== 'done' && (
            <line
              x1={colMid(current.jmid)}
              y1={dpTop + dpH + 26}
              x2={colMid(current.jmid)}
              y2={kTop - 22}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          )}

          {/* ---- k-axis (split candidates) ---- */}
          <text x={x0} y={kTop - 30} className="dco-panel-label">
            split point k — bounded search range shrinks per call
          </text>
          {Array.from({ length: N }).map((_, k) => {
            const tried = current.phase === 'try' && k === current.k;
            const isBest = current.bestK === k && current.phase !== 'init' && current.phase !== 'done';
            const banded = inSplitRange(k) && current.phase !== 'init' && current.phase !== 'done';
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            if (tried) {
              fill = 'var(--hue-pink)';
              stroke = 'var(--hue-pink)';
            } else if (isBest) {
              fill = 'rgba(var(--hue-mint-rgb, var(--accent-rgb)), 0.30)';
              stroke = 'var(--hue-mint)';
            } else if (banded) {
              fill = 'rgba(var(--accent-rgb), 0.10)';
              stroke = 'rgba(var(--accent-rgb), 0.4)';
            }
            const txtFill = tried ? 'var(--bg)' : banded || isBest ? 'var(--text-main)' : 'var(--border)';
            return (
              <g key={`k-${k}`}>
                <rect
                  x={colX(k) + cellPad}
                  y={kTop}
                  width={colW - cellPad * 2}
                  height={kH}
                  rx={6}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={tried || isBest ? 2.4 : 1}
                />
                <text x={colMid(k)} y={kTop + 20} className="dco-colidx" style={{ fill: txtFill }}>
                  k={k}
                </text>
                <text x={colMid(k)} y={kTop + 40} className="dco-kprev" style={{ fill: txtFill }}>
                  p={PREV[k]}
                </text>
              </g>
            );
          })}

          {/* bracket band over the bounded split range */}
          {current.optlo != null &&
            current.phase !== 'init' &&
            current.phase !== 'done' && (
              <g>
                <line
                  x1={colX(current.optlo) + cellPad}
                  y1={kTop + kH + 10}
                  x2={colX(current.opthi) + colW - cellPad}
                  y2={kTop + kH + 10}
                  stroke="var(--warning)"
                  strokeWidth={2.5}
                />
                <line
                  x1={colX(current.optlo) + cellPad}
                  y1={kTop + kH + 5}
                  x2={colX(current.optlo) + cellPad}
                  y2={kTop + kH + 15}
                  stroke="var(--warning)"
                  strokeWidth={2.5}
                />
                <line
                  x1={colX(current.opthi) + colW - cellPad}
                  y1={kTop + kH + 5}
                  x2={colX(current.opthi) + colW - cellPad}
                  y2={kTop + kH + 15}
                  stroke="var(--warning)"
                  strokeWidth={2.5}
                />
                <text
                  x={(colX(current.optlo) + colX(current.opthi) + colW) / 2}
                  y={kTop + kH + 32}
                  className="dco-range-tag dco-range-split"
                >
                  split range [{current.optlo}, {current.opthi}]
                </text>
              </g>
            )}

          {/* candidate arithmetic readout inside the stage */}
          {current.phase === 'try' && (
            <text x={W / 2} y={H - 16} className="dco-stage-eq">
              dp[{current.jmid}] candidate via k={current.k}: prev[{current.k}] + cost(
              {current.k + 1}, {current.jmid}) = {current.cand}
              {current.accepted ? '  ← new best' : ''}
            </text>
          )}
        </svg>
      </div>

      <div className="dco-metrics">
        <div className="dco-metric">
          <span className="dco-metric-label">solving column j</span>
          <span className="dco-metric-value">{current.jmid != null ? current.jmid : '—'}</span>
        </div>
        <div className="dco-metric">
          <span className="dco-metric-label">split range</span>
          <span className="dco-metric-value">
            {current.optlo != null && current.phase !== 'done' && current.phase !== 'init'
              ? `[${current.optlo}, ${current.opthi}]`
              : '—'}
          </span>
        </div>
        <div className="dco-metric">
          <span className="dco-metric-label">k tried</span>
          <span className="dco-metric-value">{current.phase === 'try' ? current.k : '—'}</span>
        </div>
        <div className="dco-metric">
          <span className="dco-metric-label">candidate</span>
          <span className="dco-metric-value">{current.phase === 'try' ? current.cand : '—'}</span>
        </div>
        <div className="dco-metric dco-metric-best">
          <span className="dco-metric-label">opt split</span>
          <span className="dco-metric-value">
            {current.bestK != null && current.bestK >= 0 ? current.bestK : '—'}
          </span>
        </div>
      </div>

      <div className="dco-arith">
        <span className="dco-arith-label">trace</span>
        <span className="dco-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
