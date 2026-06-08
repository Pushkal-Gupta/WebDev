import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, StepForward, RotateCcw, Shuffle, Target } from 'lucide-react';
import './QuickSelectViz.css';

// Interactive QuickSelect (Lomuto partition, last-element pivot).
// Generates a frame stream describing every comparison, swap, and recursion
// boundary; the SVG bar chart replays them step by step.

const ARR_SIZE = 15;
const VAL_MIN = 4;
const VAL_MAX = 60;
const RUN_DELAY_MS = 320;

function randomArray(n = ARR_SIZE, min = VAL_MIN, max = VAL_MAX) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return out;
}

// ── Frame generator ─────────────────────────────────────────────
// A frame captures the array state plus annotation flags.
// Shape:
//   {
//     arr:       number[]          // current state
//     lo, hi:    int | null        // active partition window
//     pivotIdx:  int | null        // index of the pivot bar (last element of window)
//     i, j:      int | null        // Lomuto pointers
//     compared:  int[]             // bars under comparison this frame
//     swapped:   int[]             // bars that just swapped
//     settled:   Set<int>          // bars locked at their final position
//     foundIdx:  int | null        // kth bar once located
//     label:     string            // caption for the step
//   }

function quickSelectFrames(input, k) {
  const arr = input.slice();
  const n = arr.length;
  const target = k - 1; // 1-indexed k → 0-indexed slot we want filled

  const frames = [];
  const settled = new Set();

  const push = (extra) => {
    frames.push({
      arr: arr.slice(),
      lo: null,
      hi: null,
      pivotIdx: null,
      i: null,
      j: null,
      compared: [],
      swapped: [],
      settled: new Set(settled),
      foundIdx: null,
      label: '',
      ...extra,
    });
  };

  push({ label: `Goal: locate the ${ordinal(k)} smallest element (index ${target}).` });

  // Iterative QuickSelect with explicit stack so the frame log stays linear.
  const stack = [[0, n - 1]];
  let foundIdx = null;

  while (stack.length) {
    const [lo, hi] = stack.pop();

    if (lo > hi) continue;
    if (lo === hi) {
      // single-element window — it lands wherever it is
      settled.add(lo);
      push({
        lo, hi,
        pivotIdx: lo,
        label: `Window collapses to a single cell at index ${lo}. It is its own pivot.`,
      });
      if (lo === target) {
        foundIdx = lo;
        break;
      }
      continue;
    }

    const pivotVal = arr[hi];
    push({
      lo, hi,
      pivotIdx: hi,
      label: `Partitioning [lo=${lo}, hi=${hi}] with pivot=${pivotVal} (arr[${hi}]).`,
    });

    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      push({
        lo, hi,
        pivotIdx: hi,
        i, j,
        compared: [j, hi],
        label: `Compare arr[${j}]=${arr[j]} with pivot=${pivotVal}.`,
      });
      if (arr[j] <= pivotVal) {
        i += 1;
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          push({
            lo, hi,
            pivotIdx: hi,
            i, j,
            swapped: [i, j],
            label: `arr[${j}] ≤ pivot — swap into the "less" region at i=${i}.`,
          });
        } else {
          push({
            lo, hi,
            pivotIdx: hi,
            i, j,
            compared: [i],
            label: `arr[${j}] ≤ pivot — i advances to ${i} (no swap needed).`,
          });
        }
      }
    }

    const pIdx = i + 1;
    if (pIdx !== hi) {
      [arr[pIdx], arr[hi]] = [arr[hi], arr[pIdx]];
      push({
        lo, hi,
        pivotIdx: pIdx,
        i, j: hi,
        swapped: [pIdx, hi],
        label: `i swaps with pivot — pivot lands at index ${pIdx}.`,
      });
    } else {
      push({
        lo, hi,
        pivotIdx: pIdx,
        label: `Pivot already in place at index ${pIdx}.`,
      });
    }

    settled.add(pIdx);

    if (pIdx === target) {
      push({
        lo, hi,
        pivotIdx: pIdx,
        foundIdx: pIdx,
        label: `Pivot lands at index ${pIdx}; that is k-1=${target}. Found the ${ordinal(k)} smallest = ${arr[pIdx]}.`,
      });
      foundIdx = pIdx;
      break;
    } else if (pIdx < target) {
      push({
        lo, hi,
        pivotIdx: pIdx,
        label: `Pivot index ${pIdx} < k-1=${target}. Recurse right: [${pIdx + 1}, ${hi}].`,
      });
      stack.push([pIdx + 1, hi]);
    } else {
      push({
        lo, hi,
        pivotIdx: pIdx,
        label: `Pivot index ${pIdx} > k-1=${target}. Recurse left: [${lo}, ${pIdx - 1}].`,
      });
      stack.push([lo, pIdx - 1]);
    }
  }

  // Final highlight frame.
  push({
    foundIdx: foundIdx ?? target,
    label: foundIdx == null
      ? `Search exhausted. (This should not happen for a valid k.)`
      : `${ordinal(k)} smallest is arr[${foundIdx}] = ${arr[foundIdx]}.`,
  });

  return { frames, finalValue: foundIdx == null ? null : arr[foundIdx], finalIdx: foundIdx };
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── SVG bar chart ──────────────────────────────────────────────

const VIEW_W = 100;
const VIEW_PAD_X = 3;
const BAR_AREA_TOP = 8;
const BAR_AREA_H = 56;
const BAR_GAP = 0.6;
const LABEL_ROW_H = 16;
const POINTER_ROW_H = 9;

function BarChart({ frame, maxVal }) {
  const arr = frame.arr;
  const n = arr.length;
  const totalGap = (n - 1) * BAR_GAP;
  const usableW = VIEW_W - VIEW_PAD_X * 2 - totalGap;
  const barW = usableW / n;

  const comparedSet = new Set(frame.compared || []);
  const swappedSet = new Set(frame.swapped || []);
  const settled = frame.settled || new Set();
  const inWindow = (idx) =>
    frame.lo != null && frame.hi != null && idx >= frame.lo && idx <= frame.hi;

  const totalH = BAR_AREA_TOP + BAR_AREA_H + LABEL_ROW_H + POINTER_ROW_H + 6;

  // Window backdrop spans from first bar in window to last bar in window.
  let windowRect = null;
  if (frame.lo != null && frame.hi != null) {
    const x0 = VIEW_PAD_X + frame.lo * (barW + BAR_GAP) - BAR_GAP / 2;
    const x1 = VIEW_PAD_X + frame.hi * (barW + BAR_GAP) + barW + BAR_GAP / 2;
    windowRect = {
      x: Math.max(0, x0),
      y: BAR_AREA_TOP - 2,
      width: Math.max(0, x1 - x0),
      height: BAR_AREA_H + 4,
    };
  }

  const pointerY = BAR_AREA_TOP + BAR_AREA_H + LABEL_ROW_H + 6;

  return (
    <svg
      className="qsv-svg"
      viewBox={`0 0 ${VIEW_W} ${totalH}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="QuickSelect array state"
    >
      {windowRect && (
        <rect
          className="qsv-window"
          x={windowRect.x}
          y={windowRect.y}
          width={windowRect.width}
          height={windowRect.height}
          rx={1.2}
          ry={1.2}
        />
      )}

      {arr.map((v, idx) => {
        const ratio = Math.max(0.04, v / Math.max(1, maxVal));
        const h = ratio * BAR_AREA_H;
        const x = VIEW_PAD_X + idx * (barW + BAR_GAP);
        const y = BAR_AREA_TOP + (BAR_AREA_H - h);
        const isFound = frame.foundIdx === idx;
        const isPivot = frame.pivotIdx === idx;
        const isCompared = comparedSet.has(idx);
        const isSwapped = swappedSet.has(idx);
        const isSettled = settled.has(idx);
        const isInWindow = inWindow(idx);

        const cls = [
          'qsv-bar',
          isFound && 'is-found',
          !isFound && isPivot && 'is-pivot',
          !isFound && !isPivot && isSwapped && 'is-swapped',
          !isFound && !isPivot && !isSwapped && isCompared && 'is-compared',
          !isFound && !isPivot && !isSwapped && !isCompared && isSettled && 'is-settled',
          !isFound && !isPivot && !isSwapped && !isCompared && !isSettled && !isInWindow && frame.lo != null && 'is-dim',
        ].filter(Boolean).join(' ');

        return (
          <g key={idx}>
            <rect
              className={cls}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={0.6}
              ry={0.6}
            />
            <text
              className="qsv-bar-val"
              x={x + barW / 2}
              y={y - 1.2}
            >
              {v}
            </text>
            <text
              className="qsv-bar-idx"
              x={x + barW / 2}
              y={BAR_AREA_TOP + BAR_AREA_H + 4.5}
            >
              {idx}
            </text>
          </g>
        );
      })}

      {/* i / j pointer markers */}
      {frame.i != null && frame.i >= 0 && frame.i < n && (
        <g>
          <text
            className="qsv-ptr qsv-ptr-i"
            x={VIEW_PAD_X + frame.i * (barW + BAR_GAP) + barW / 2}
            y={pointerY}
          >
            i
          </text>
        </g>
      )}
      {frame.j != null && frame.j >= 0 && frame.j < n && (
        <g>
          <text
            className="qsv-ptr qsv-ptr-j"
            x={VIEW_PAD_X + frame.j * (barW + BAR_GAP) + barW / 2}
            y={pointerY}
          >
            j
          </text>
        </g>
      )}
      {frame.pivotIdx != null && frame.pivotIdx >= 0 && frame.pivotIdx < n && (
        <g>
          <text
            className="qsv-ptr qsv-ptr-pivot"
            x={VIEW_PAD_X + frame.pivotIdx * (barW + BAR_GAP) + barW / 2}
            y={pointerY}
          >
            pivot
          </text>
        </g>
      )}
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────

export default function QuickSelectViz() {
  const [seed, setSeed] = useState(() => randomArray());
  const [k, setK] = useState(() => Math.ceil(ARR_SIZE / 2));
  const [stepIdx, setStepIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const runTimer = useRef(null);

  const { frames, finalValue, finalIdx } = useMemo(
    () => quickSelectFrames(seed, k),
    [seed, k],
  );
  const totalSteps = frames.length;
  const maxVal = useMemo(() => Math.max(...seed, 1), [seed]);

  const safeStep = Math.min(stepIdx, totalSteps - 1);
  const frame = frames[safeStep];
  const isTerminal = safeStep >= totalSteps - 1;

  useEffect(() => {
    return () => {
      if (runTimer.current) clearTimeout(runTimer.current);
      runTimer.current = null;
    };
  }, []);

  // Reset playhead whenever the input or k changes.
  useEffect(() => {
    setStepIdx(0);
    setIsRunning(false);
    if (runTimer.current) {
      clearTimeout(runTimer.current);
      runTimer.current = null;
    }
  }, [seed, k]);

  useEffect(() => {
    if (!isRunning) return;
    if (stepIdx >= totalSteps - 1) {
      setIsRunning(false);
      return;
    }
    runTimer.current = setTimeout(() => {
      setStepIdx(i => Math.min(i + 1, totalSteps - 1));
    }, RUN_DELAY_MS);
    return () => {
      if (runTimer.current) clearTimeout(runTimer.current);
      runTimer.current = null;
    };
  }, [isRunning, stepIdx, totalSteps]);

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

  const restart = useCallback(() => {
    stop();
    setStepIdx(0);
  }, [stop]);

  const newArray = useCallback(() => {
    stop();
    setSeed(randomArray());
    setStepIdx(0);
  }, [stop]);

  const handleRunToggle = useCallback(() => {
    if (isRunning) { stop(); return; }
    if (stepIdx >= totalSteps - 1) {
      setStepIdx(0);
      requestAnimationFrame(() => setIsRunning(true));
      return;
    }
    setIsRunning(true);
  }, [isRunning, stepIdx, totalSteps, stop]);

  const handleFind = useCallback(() => {
    // Jump to the moment kth is identified, then briefly pause.
    stop();
    // Find the first frame where foundIdx is set; otherwise terminal frame.
    const idx = frames.findIndex(f => f.foundIdx != null);
    setStepIdx(idx >= 0 ? idx : totalSteps - 1);
  }, [frames, totalSteps, stop]);

  return (
    <div className="qsv" role="group" aria-label="QuickSelect interactive visualization">
      <div className="qsv-head">
        <h3 className="qsv-title">QuickSelect · find the kth smallest</h3>
        <div className="qsv-step-counter">
          step <strong>{safeStep}</strong> / {totalSteps - 1}
        </div>
      </div>

      <div className="qsv-controls">
        <div className="qsv-control-group qsv-k-group">
          <label className="qsv-k-label" htmlFor="qsv-k-slider">
            k = <strong>{k}</strong>
          </label>
          <input
            id="qsv-k-slider"
            type="range"
            min={1}
            max={ARR_SIZE}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="qsv-slider"
            aria-label="k value"
          />
          <span className="qsv-k-hint">({ordinal(k)} smallest)</span>
        </div>
        <div className="qsv-control-group">
          <button
            type="button"
            className="qsv-btn"
            onClick={stepOnce}
            disabled={isRunning || isTerminal}
          >
            <StepForward size={14} /> Step
          </button>
          <button
            type="button"
            className="qsv-btn qsv-btn-primary"
            onClick={handleRunToggle}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : (isTerminal ? 'Replay' : 'Run')}
          </button>
          <button
            type="button"
            className="qsv-btn qsv-btn-accent"
            onClick={handleFind}
            disabled={isRunning}
          >
            <Target size={14} /> Find kth smallest
          </button>
          <button
            type="button"
            className="qsv-btn"
            onClick={restart}
            disabled={safeStep === 0}
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            type="button"
            className="qsv-btn qsv-btn-danger"
            onClick={newArray}
          >
            <Shuffle size={14} /> New array
          </button>
        </div>
      </div>

      <div className="qsv-canvas">
        <BarChart frame={frame} maxVal={maxVal} />
      </div>

      <div className="qsv-caption" role="status" aria-live="polite">
        {frame.label}
      </div>

      <div className="qsv-summary">
        <div className="qsv-summary-cell">
          <span className="qsv-summary-label">target index</span>
          <span className="qsv-summary-val">{k - 1}</span>
        </div>
        <div className="qsv-summary-cell">
          <span className="qsv-summary-label">window</span>
          <span className="qsv-summary-val">
            {frame.lo != null && frame.hi != null ? `[${frame.lo}, ${frame.hi}]` : '—'}
          </span>
        </div>
        <div className="qsv-summary-cell">
          <span className="qsv-summary-label">pivot</span>
          <span className="qsv-summary-val">
            {frame.pivotIdx != null ? `arr[${frame.pivotIdx}] = ${frame.arr[frame.pivotIdx]}` : '—'}
          </span>
        </div>
        <div className={`qsv-summary-cell${isTerminal && finalValue != null ? ' is-found' : ''}`}>
          <span className="qsv-summary-label">{ordinal(k)} smallest</span>
          <span className="qsv-summary-val">
            {isTerminal && finalValue != null ? `arr[${finalIdx}] = ${finalValue}` : '…'}
          </span>
        </div>
      </div>

      <div className="qsv-legend" aria-hidden="true">
        <span className="qsv-legend-item"><span className="qsv-legend-swatch in-window" /> active window</span>
        <span className="qsv-legend-item"><span className="qsv-legend-swatch pivot" /> pivot</span>
        <span className="qsv-legend-item"><span className="qsv-legend-swatch compared" /> being compared</span>
        <span className="qsv-legend-item"><span className="qsv-legend-swatch swapped" /> just swapped</span>
        <span className="qsv-legend-item"><span className="qsv-legend-swatch settled" /> pivot placed</span>
        <span className="qsv-legend-item"><span className="qsv-legend-swatch found" /> kth smallest</span>
      </div>
    </div>
  );
}
