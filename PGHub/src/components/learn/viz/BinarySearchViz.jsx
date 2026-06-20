import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, StepForward, RotateCcw, Search } from 'lucide-react';
import './BinarySearchViz.css';

// Step-through binary search visualization.
// Standalone — not yet wired into ConceptPage. Render anywhere as <BinarySearchViz />.

const DEFAULT_ARR = [3, 7, 11, 14, 18, 22, 29, 35, 42, 48, 55, 61, 68, 72, 80];
const DEFAULT_TARGET = 42;
const RUN_DELAY_MS = 600;

// SVG layout constants — kept in JS so pointer positions stay in lockstep with cells.
const CELL_W = 46;
const CELL_GAP = 6;
const CELL_H = 56;
const PAD_X = 24;
const POINTER_BAND_H = 64;   // above cells, holds lo/mid/hi markers
const INDEX_BAND_H = 22;     // below cells, holds index labels
const TARGET_BAND_H = 28;    // very top, "target = N"

function buildSteps(arr, target) {
  // Pre-compute every algorithmic frame so Step / Run / Reset all share a single source of truth.
  const steps = [];
  let lo = 0;
  let hi = arr.length - 1;
  const eliminated = new Set();

  steps.push({
    lo, hi, mid: null,
    eliminated: new Set(),
    inequality: null,
    narration: `Initialize lo = 0, hi = ${arr.length - 1}. The search window covers the entire array.`,
    phase: 'init',
    foundIndex: null,
  });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);

    steps.push({
      lo, hi, mid,
      eliminated: new Set(eliminated),
      inequality: { lhs: `arr[${mid}]`, midValue: arr[mid], op: '?', rhs: `${target}` },
      narration: `Probe mid = ⌊(${lo} + ${hi}) / 2⌋ = ${mid}. Compare arr[${mid}] = ${arr[mid]} with target ${target}.`,
      phase: 'probe',
      foundIndex: null,
    });

    if (arr[mid] === target) {
      steps.push({
        lo, hi, mid,
        eliminated: new Set(eliminated),
        inequality: { lhs: `arr[${mid}] = ${arr[mid]}`, op: '=', rhs: `${target}` },
        narration: `Match. arr[${mid}] = ${arr[mid]} equals the target. Return index ${mid}.`,
        phase: 'done-found',
        foundIndex: mid,
      });
      return steps;
    }

    if (arr[mid] < target) {
      steps.push({
        lo, hi, mid,
        eliminated: new Set(eliminated),
        inequality: { lhs: `arr[${mid}] = ${arr[mid]}`, op: '<', rhs: `${target}` },
        narration: `arr[${mid}] = ${arr[mid]} < ${target}. Every index ≤ ${mid} is too small — discard them.`,
        phase: 'compare-lt',
        foundIndex: null,
      });
      for (let k = lo; k <= mid; k++) eliminated.add(k);
      lo = mid + 1;
      steps.push({
        lo, hi, mid: null,
        eliminated: new Set(eliminated),
        inequality: null,
        narration: `Shrink: lo ← mid + 1 = ${lo}. New window is [${lo}, ${hi}] — ${Math.max(0, hi - lo + 1)} candidate${hi - lo === 0 ? '' : 's'} left.`,
        phase: 'shrink',
        foundIndex: null,
      });
    } else {
      steps.push({
        lo, hi, mid,
        eliminated: new Set(eliminated),
        inequality: { lhs: `arr[${mid}] = ${arr[mid]}`, op: '>', rhs: `${target}` },
        narration: `arr[${mid}] = ${arr[mid]} > ${target}. Every index ≥ ${mid} is too large — discard them.`,
        phase: 'compare-gt',
        foundIndex: null,
      });
      for (let k = mid; k <= hi; k++) eliminated.add(k);
      hi = mid - 1;
      steps.push({
        lo, hi, mid: null,
        eliminated: new Set(eliminated),
        inequality: null,
        narration: `Shrink: hi ← mid - 1 = ${hi}. New window is [${lo}, ${hi}] — ${Math.max(0, hi - lo + 1)} candidate${hi - lo === 0 ? '' : 's'} left.`,
        phase: 'shrink',
        foundIndex: null,
      });
    }
  }

  steps.push({
    lo, hi, mid: null,
    eliminated: new Set(eliminated),
    inequality: { lhs: `lo (${lo})`, op: '>', rhs: `hi (${hi})` },
    narration: `Window is empty: lo (${lo}) crossed hi (${hi}). Target ${target} is not present.`,
    phase: 'done-missing',
    foundIndex: null,
  });
  return steps;
}

function PointerMarker({ index, label, kind, cellOffsetX, yBaseline }) {
  // yBaseline = top edge of the cell row. Marker sits above it.
  if (index == null || index < 0) return null;
  const cx = cellOffsetX + index * (CELL_W + CELL_GAP) + CELL_W / 2;
  const arrowTipY = yBaseline - 4;
  const arrowBaseY = yBaseline - 18;
  const textY = yBaseline - 26;
  const labelY = yBaseline - 40;
  return (
    <g
      className={`bsv-ptr bsv-ptr-${kind}`}
      style={{ transform: `translate(0px, 0px)` }}
      aria-hidden="true"
    >
      <path
        className="bsv-ptr-arrow"
        d={`M ${cx} ${arrowTipY} L ${cx - 5} ${arrowBaseY} L ${cx + 5} ${arrowBaseY} Z`}
      />
      <line
        className="bsv-ptr-arrow"
        x1={cx}
        y1={arrowBaseY}
        x2={cx}
        y2={textY}
      />
      <text className="bsv-ptr-text" x={cx} y={labelY}>{label}</text>
    </g>
  );
}

function InequalityLine({ ineq, phase }) {
  if (!ineq) {
    if (phase === 'init') return <span className="bsv-ineq is-empty">awaiting first probe…</span>;
    if (phase === 'shrink') return <span className="bsv-ineq is-empty">window updated — continue stepping</span>;
    return <span className="bsv-ineq is-empty">—</span>;
  }
  const cls = phase === 'done-found'
    ? 'bsv-ineq is-found'
    : phase === 'done-missing'
      ? 'bsv-ineq is-empty'
      : 'bsv-ineq';
  return (
    <span className={cls}>
      <span className="lhs">{ineq.lhs}</span>
      <span className="op">{ineq.op}</span>
      <span className="rhs">{ineq.rhs}</span>
      {ineq.midValue != null && ineq.op === '?' ? null : null}
    </span>
  );
}

export default function BinarySearchViz({
  initialArray = DEFAULT_ARR,
  initialTarget = DEFAULT_TARGET,
}) {
  const [arr] = useState(initialArray); // array is fixed per spec
  const [targetInput, setTargetInput] = useState(String(initialTarget));
  const [appliedTarget, setAppliedTarget] = useState(initialTarget);
  const [stepIdx, setStepIdx] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const runTimer = useRef(null);

  const steps = useMemo(() => buildSteps(arr, appliedTarget), [arr, appliedTarget]);
  const current = steps[stepIdx] || steps[0];
  const isTerminal = current.phase === 'done-found' || current.phase === 'done-missing';
  const totalSteps = steps.length;

  // Clear any active auto-run if the underlying step set changes.
  useEffect(() => {
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (runTimer.current) {
      clearTimeout(runTimer.current);
      runTimer.current = null;
    }
    setIsRunning(false);
  }, []);

  const stepOnce = useCallback(() => {
    setStepIdx(i => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const reset = useCallback(() => {
    stop();
    setStepIdx(0);
  }, [stop]);

  // Auto-run loop: queue successive steps on a fixed delay. Derive `isRunning`
  // from the raw toggle + a bounds check so the effect never has to call
  // setIsRunning(false) when we hit the end — avoids a cascading-render.
  const isRunning = isRunningRaw && stepIdx < totalSteps - 1;
  useEffect(() => {
    if (!isRunning) return;
    runTimer.current = setTimeout(() => {
      setStepIdx(i => Math.min(i + 1, totalSteps - 1));
    }, RUN_DELAY_MS);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, totalSteps]);

  const handleRunToggle = () => {
    if (isRunning) { stop(); return; }
    if (stepIdx >= totalSteps - 1) {
      setStepIdx(0);
      // small async kick so the reset paints before stepping
      requestAnimationFrame(() => setIsRunning(true));
      return;
    }
    setIsRunning(true);
  };

  const applyTarget = () => {
    const n = Number(targetInput);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return;
    stop();
    setAppliedTarget(n);
    setStepIdx(0);
  };

  // ── SVG geometry ─────────────────────────────────
  const svgWidth = PAD_X * 2 + arr.length * CELL_W + (arr.length - 1) * CELL_GAP;
  const svgHeight = TARGET_BAND_H + POINTER_BAND_H + CELL_H + INDEX_BAND_H + 12;

  const targetBandY = 16;
  const cellRowY = TARGET_BAND_H + POINTER_BAND_H;
  const indexBandY = cellRowY + CELL_H + 14;

  // Where pointer markers anchor (top edge of the cell row).
  const pointerBaselineY = cellRowY;

  return (
    <div className="bsv" role="group" aria-label="Binary search step-through visualization">
      <div className="bsv-head">
        <h3 className="bsv-title">Binary Search · Step-Through</h3>
        <div className="bsv-step-counter">
          step <strong>{stepIdx}</strong> / {totalSteps - 1}
        </div>
      </div>

      <div className="bsv-controls">
        <label className="bsv-input-group">
          <span className="bsv-input-label">target</span>
          <input
            className="bsv-input"
            type="number"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyTarget(); }}
            aria-label="Target value to search"
          />
          <button
            type="button"
            className="bsv-btn"
            onClick={applyTarget}
            aria-label="Apply target"
          >
            <Search size={12} /> set
          </button>
        </label>

        <button
          type="button"
          className="bsv-btn"
          onClick={stepOnce}
          disabled={isRunning || isTerminal}
        >
          <StepForward size={14} /> Step
        </button>

        <button
          type="button"
          className="bsv-btn bsv-btn-primary"
          onClick={handleRunToggle}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? 'Pause' : (isTerminal ? 'Replay' : 'Run')}
        </button>

        <button
          type="button"
          className="bsv-btn bsv-btn-danger"
          onClick={reset}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="bsv-stage-wrap">
        <svg
          className="bsv-stage"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width={svgWidth}
          height={svgHeight}
          role="img"
          aria-label={`Binary search visualization stage, searching for ${appliedTarget}`}
        >
          {/* Target indicator */}
          <text className="bsv-target-line" x={PAD_X} y={targetBandY + 12}>
            target = <tspan className="k">{appliedTarget}</tspan>
            <tspan dx="14" fill="var(--text-dim)">window = [{current.lo}, {current.hi}]</tspan>
          </text>

          {/* Cells */}
          {arr.map((v, i) => {
            const x = PAD_X + i * (CELL_W + CELL_GAP);
            const isEliminated = current.eliminated.has(i);
            const isMid = current.mid === i && !isEliminated;
            const isFound = current.foundIndex === i;
            const isWindow = i >= current.lo && i <= current.hi && !isEliminated && !isMid && !isFound;

            const rectCls = [
              'bsv-cell-rect',
              isFound && 'is-found',
              !isFound && isMid && 'is-mid',
              !isFound && !isMid && isWindow && 'is-window',
              isEliminated && 'is-eliminated',
            ].filter(Boolean).join(' ');

            const txtCls = [
              'bsv-cell-value',
              isFound && 'is-found',
              !isFound && isMid && 'is-mid',
              isEliminated && 'is-eliminated',
            ].filter(Boolean).join(' ');

            return (
              <g key={i}>
                <rect
                  className={rectCls}
                  x={x}
                  y={cellRowY}
                  width={CELL_W}
                  height={CELL_H}
                  rx={6}
                  ry={6}
                />
                <text
                  className={txtCls}
                  x={x + CELL_W / 2}
                  y={cellRowY + CELL_H / 2}
                >
                  {v}
                </text>
                <text
                  className="bsv-cell-idx"
                  x={x + CELL_W / 2}
                  y={indexBandY}
                >
                  {i}
                </text>
              </g>
            );
          })}

          {/* Pointers */}
          {current.lo <= current.hi && (
            <>
              <PointerMarker
                index={current.lo}
                label="lo"
                kind="lo"
                cellOffsetX={PAD_X}
                yBaseline={pointerBaselineY}
              />
              <PointerMarker
                index={current.hi}
                label="hi"
                kind="hi"
                cellOffsetX={PAD_X}
                yBaseline={pointerBaselineY}
              />
            </>
          )}
          {current.mid != null && (
            <PointerMarker
              index={current.mid}
              label="mid"
              kind="mid"
              cellOffsetX={PAD_X}
              yBaseline={pointerBaselineY}
            />
          )}
        </svg>
      </div>

      <div className="bsv-narration">
        <div className="bsv-card">
          <span className="bsv-card-label">Comparison</span>
          <div>
            <InequalityLine ineq={current.inequality} phase={current.phase} />
          </div>
        </div>
        <div className="bsv-card">
          <span className="bsv-card-label">Step Narration</span>
          <div className="bsv-card-body">{current.narration}</div>
        </div>
      </div>

      {current.phase === 'done-found' && (
        <div className="bsv-status is-found" role="status">
          <span className="bsv-status-dot" />
          Found at index {current.foundIndex}
        </div>
      )}
      {current.phase === 'done-missing' && (
        <div className="bsv-status is-missing" role="status">
          <span className="bsv-status-dot" />
          Not found
        </div>
      )}

      <div className="bsv-legend" aria-hidden="true">
        <span className="bsv-legend-item"><span className="bsv-legend-swatch lo" /> lo pointer</span>
        <span className="bsv-legend-item"><span className="bsv-legend-swatch mid" /> mid probe</span>
        <span className="bsv-legend-item"><span className="bsv-legend-swatch hi" /> hi pointer</span>
        <span className="bsv-legend-item"><span className="bsv-legend-swatch found" /> match</span>
        <span className="bsv-legend-item"><span className="bsv-legend-swatch gone" /> discarded</span>
      </div>
    </div>
  );
}
