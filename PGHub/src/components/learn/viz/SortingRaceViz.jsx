import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, StepForward, RotateCcw, Shuffle, Trophy } from 'lucide-react';
import './SortingRaceViz.css';

// Side-by-side race of three sorts on the same input array.
// Each "step" advances every algorithm by one comparison/swap event.
// Self-contained — no external state, no imports beyond React + lucide.

const DEFAULT_N = 12;
const VAL_MIN = 1;
const VAL_MAX = 50;
const RUN_DELAY_MS = 200;

function randomArray(n = DEFAULT_N, min = VAL_MIN, max = VAL_MAX) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return out;
}

// ── Step generators ──────────────────────────────────────────
// Each yields a sequence of frames. A frame describes the array state
// after that step, plus which indices were "compared" / "swapped" / "sorted".
// The first frame is the initial state; we always end with all-sorted.

function bubbleSortFrames(input) {
  const arr = input.slice();
  const n = arr.length;
  const frames = [];
  let comparisons = 0;
  let swaps = 0;

  const push = (compared, swapped, sorted, label) => {
    frames.push({
      arr: arr.slice(),
      compared: compared ? compared.slice() : [],
      swapped: swapped ? swapped.slice() : [],
      sorted: new Set(sorted),
      comparisons,
      swaps,
      label,
    });
  };

  const sortedSet = new Set();
  push([], [], sortedSet, 'init');

  for (let i = 0; i < n - 1; i++) {
    let didSwap = false;
    for (let j = 0; j < n - i - 1; j++) {
      comparisons += 1;
      push([j, j + 1], [], sortedSet, `compare ${j},${j + 1}`);
      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
        swaps += 1;
        didSwap = true;
        push([], [j, j + 1], sortedSet, `swap ${j},${j + 1}`);
      }
    }
    sortedSet.add(n - 1 - i);
    push([], [], sortedSet, `freeze ${n - 1 - i}`);
    if (!didSwap) {
      // Early exit — freeze remainder
      for (let k = 0; k <= n - 2 - i; k++) sortedSet.add(k);
      push([], [], sortedSet, 'done-early');
      break;
    }
  }
  // Final freeze
  for (let i = 0; i < n; i++) sortedSet.add(i);
  push([], [], sortedSet, 'done');
  return { frames, comparisons, swaps };
}

function quickSortFrames(input) {
  const arr = input.slice();
  const n = arr.length;
  const frames = [];
  let comparisons = 0;
  let swaps = 0;
  const sortedSet = new Set();

  const push = (compared, swapped, label) => {
    frames.push({
      arr: arr.slice(),
      compared: compared ? compared.slice() : [],
      swapped: swapped ? swapped.slice() : [],
      sorted: new Set(sortedSet),
      comparisons,
      swaps,
      label,
    });
  };

  push([], [], 'init');

  // Iterative quicksort using stack to avoid recursion depth issues.
  // Lomuto partition with last element as pivot.
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop();
    if (lo >= hi) {
      if (lo === hi) {
        sortedSet.add(lo);
        push([], [], `freeze ${lo}`);
      }
      continue;
    }
    const pivot = arr[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      comparisons += 1;
      push([j, hi], [], `compare ${j} vs pivot@${hi}`);
      if (arr[j] <= pivot) {
        i += 1;
        if (i !== j) {
          const tmp = arr[i];
          arr[i] = arr[j];
          arr[j] = tmp;
          swaps += 1;
          push([], [i, j], `swap ${i},${j}`);
        }
      }
    }
    // place pivot
    const pIdx = i + 1;
    if (pIdx !== hi) {
      const tmp = arr[pIdx];
      arr[pIdx] = arr[hi];
      arr[hi] = tmp;
      swaps += 1;
      push([], [pIdx, hi], `swap pivot ${pIdx},${hi}`);
    }
    sortedSet.add(pIdx);
    push([], [], `freeze pivot ${pIdx}`);
    // Push right first, then left, so left is processed first (mimics in-order recursion).
    stack.push([pIdx + 1, hi]);
    stack.push([lo, pIdx - 1]);
  }
  for (let i = 0; i < n; i++) sortedSet.add(i);
  push([], [], 'done');
  return { frames, comparisons, swaps };
}

function mergeSortFrames(input) {
  const arr = input.slice();
  const n = arr.length;
  const frames = [];
  let comparisons = 0;
  let swaps = 0; // counted as "writes" — overwriting a slot during merge
  const sortedSet = new Set();

  const push = (compared, swapped, label) => {
    frames.push({
      arr: arr.slice(),
      compared: compared ? compared.slice() : [],
      swapped: swapped ? swapped.slice() : [],
      sorted: new Set(sortedSet),
      comparisons,
      swaps,
      label,
    });
  };

  push([], [], 'init');

  // Bottom-up merge sort.
  for (let width = 1; width < n; width *= 2) {
    for (let lo = 0; lo < n; lo += 2 * width) {
      const mid = Math.min(lo + width, n);
      const hi = Math.min(lo + 2 * width, n);
      if (mid >= hi) continue;
      // Merge arr[lo..mid) and arr[mid..hi) using a temp buffer.
      const left = arr.slice(lo, mid);
      const right = arr.slice(mid, hi);
      let li = 0, ri = 0, k = lo;
      while (li < left.length && ri < right.length) {
        comparisons += 1;
        push([lo + li, mid + ri], [], `compare ${lo + li} vs ${mid + ri}`);
        if (left[li] <= right[ri]) {
          arr[k] = left[li];
          swaps += 1;
          push([], [k], `write ${k}`);
          li += 1;
        } else {
          arr[k] = right[ri];
          swaps += 1;
          push([], [k], `write ${k}`);
          ri += 1;
        }
        k += 1;
      }
      while (li < left.length) {
        arr[k] = left[li];
        swaps += 1;
        push([], [k], `write ${k}`);
        li += 1;
        k += 1;
      }
      while (ri < right.length) {
        arr[k] = right[ri];
        swaps += 1;
        push([], [k], `write ${k}`);
        ri += 1;
        k += 1;
      }
      // Once a full pass at top width completes the whole array, freeze.
      if (lo === 0 && hi === n && width * 2 >= n) {
        for (let z = 0; z < n; z++) sortedSet.add(z);
        push([], [], `freeze pass w=${width}`);
      }
    }
  }
  for (let i = 0; i < n; i++) sortedSet.add(i);
  push([], [], 'done');
  return { frames, comparisons, swaps };
}

// ── Visual bar panel ─────────────────────────────────────────

const PANEL_PAD_X = 14;
const PANEL_TOP = 10;
const PANEL_BAR_AREA_H = 220;
const PANEL_LABEL_H = 22;
const BAR_GAP = 4;

function BarPanel({ frame, maxVal, title, finished, finishedAt }) {
  const arr = frame.arr;
  const n = arr.length;
  const innerW = 100; // we'll use viewBox for crisp scaling
  // Use a fixed viewBox; the SVG element scales to its container.
  const totalGap = (n - 1) * BAR_GAP;
  const usableW = innerW - PANEL_PAD_X * 2 - totalGap;
  const barW = Math.max(1, usableW / n);

  const comparedSet = new Set(frame.compared);
  const swappedSet = new Set(frame.swapped);

  const svgH = PANEL_TOP + PANEL_BAR_AREA_H + PANEL_LABEL_H;

  return (
    <div className={`srv-panel${finished ? ' is-finished' : ''}`}>
      <div className="srv-panel-head">
        <div className="srv-panel-title">{title}</div>
        <div className="srv-panel-counters">
          <span className="srv-counter">
            <span className="srv-counter-label">cmp</span>
            <span className="srv-counter-val">{frame.comparisons}</span>
          </span>
          <span className="srv-counter">
            <span className="srv-counter-label">swp</span>
            <span className="srv-counter-val">{frame.swaps}</span>
          </span>
          <span className={`srv-status-pill${finished ? ' is-done' : ''}`}>
            {finished ? `done @ ${finishedAt}` : 'running'}
          </span>
        </div>
      </div>
      <svg
        className="srv-panel-svg"
        viewBox={`0 0 ${innerW} ${svgH}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${title} bar chart`}
      >
        {arr.map((v, i) => {
          const ratio = Math.max(0.02, v / Math.max(1, maxVal));
          const h = ratio * PANEL_BAR_AREA_H;
          const x = PANEL_PAD_X + i * (barW + BAR_GAP);
          const y = PANEL_TOP + (PANEL_BAR_AREA_H - h);
          const isSorted = frame.sorted.has(i);
          const isCompared = comparedSet.has(i);
          const isSwapped = swappedSet.has(i);
          const cls = [
            'srv-bar',
            isSorted && 'is-sorted',
            isCompared && !isSorted && 'is-compared',
            isSwapped && !isSorted && 'is-swapped',
          ].filter(Boolean).join(' ');
          return (
            <g key={i}>
              <rect
                className={cls}
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={1}
                ry={1}
              />
              {n <= 16 && (
                <text
                  className="srv-bar-val"
                  x={x + barW / 2}
                  y={PANEL_TOP + PANEL_BAR_AREA_H + 14}
                >
                  {v}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function SortingRaceViz({ size = DEFAULT_N }) {
  const [seed, setSeed] = useState(() => randomArray(size));
  const [stepIdx, setStepIdx] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const runTimer = useRef(null);

  const bubble = useMemo(() => bubbleSortFrames(seed), [seed]);
  const quick = useMemo(() => quickSortFrames(seed), [seed]);
  const merge = useMemo(() => mergeSortFrames(seed), [seed]);

  const totalSteps = Math.max(bubble.frames.length, quick.frames.length, merge.frames.length);
  const maxVal = useMemo(() => Math.max(...seed, 1), [seed]);

  // Per-panel current frame: clamp at last available frame.
  const getFrame = useCallback((run) => {
    const idx = Math.min(stepIdx, run.frames.length - 1);
    return { frame: run.frames[idx], finished: stepIdx >= run.frames.length - 1, finishedAt: run.frames.length - 1 };
  }, [stepIdx]);

  const bubbleView = getFrame(bubble);
  const quickView = getFrame(quick);
  const mergeView = getFrame(merge);

  const allFinished = bubbleView.finished && quickView.finished && mergeView.finished;

  // Winner: the algorithm that reached its last frame first (lowest finishedAt).
  const winner = useMemo(() => {
    if (!allFinished) return null;
    const candidates = [
      { name: 'Bubble Sort', at: bubble.frames.length - 1, ops: bubble.comparisons + bubble.swaps, cmp: bubble.comparisons, swp: bubble.swaps },
      { name: 'Quicksort', at: quick.frames.length - 1, ops: quick.comparisons + quick.swaps, cmp: quick.comparisons, swp: quick.swaps },
      { name: 'Merge Sort', at: merge.frames.length - 1, ops: merge.comparisons + merge.swaps, cmp: merge.comparisons, swp: merge.swaps },
    ];
    candidates.sort((a, b) => a.at - b.at);
    return candidates[0];
  }, [allFinished, bubble, quick, merge]);

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
    setSeed(randomArray(size));
  }, [stop, size]);

  const replay = useCallback(() => {
    stop();
    setStepIdx(0);
  }, [stop]);

  // Derive isRunning from the raw toggle + a bounds check so the effect never
  // has to call setIsRunning(false) when we hit the end — avoids cascading render.
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
      requestAnimationFrame(() => setIsRunning(true));
      return;
    }
    setIsRunning(true);
  };

  const isTerminal = stepIdx >= totalSteps - 1;

  return (
    <div className="srv" role="group" aria-label="Three sorting algorithms racing on the same input">
      <div className="srv-head">
        <h3 className="srv-title">Sorting Race · Bubble vs Quicksort vs Merge</h3>
        <div className="srv-step-counter">
          step <strong>{stepIdx}</strong> / {totalSteps - 1}
        </div>
      </div>

      <div className="srv-controls">
        <button
          type="button"
          className="srv-btn"
          onClick={stepOnce}
          disabled={isRunning || isTerminal}
        >
          <StepForward size={14} /> Step
        </button>
        <button
          type="button"
          className="srv-btn srv-btn-primary"
          onClick={handleRunToggle}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? 'Pause' : (isTerminal ? 'Replay' : 'Run')}
        </button>
        <button
          type="button"
          className="srv-btn"
          onClick={replay}
          disabled={stepIdx === 0}
        >
          <RotateCcw size={14} /> Restart
        </button>
        <button
          type="button"
          className="srv-btn srv-btn-danger"
          onClick={reset}
        >
          <Shuffle size={14} /> New Array
        </button>
      </div>

      <div className="srv-grid">
        <BarPanel
          title="Bubble Sort"
          frame={bubbleView.frame}
          maxVal={maxVal}
          finished={bubbleView.finished}
          finishedAt={bubbleView.finishedAt}
        />
        <BarPanel
          title="Quicksort"
          frame={quickView.frame}
          maxVal={maxVal}
          finished={quickView.finished}
          finishedAt={quickView.finishedAt}
        />
        <BarPanel
          title="Merge Sort"
          frame={mergeView.frame}
          maxVal={maxVal}
          finished={mergeView.finished}
          finishedAt={mergeView.finishedAt}
        />
      </div>

      {winner && (
        <div className="srv-winner" role="status">
          <Trophy size={16} className="srv-winner-icon" />
          <div className="srv-winner-text">
            <strong>{winner.name}</strong> finished first at step {winner.at}
            <span className="srv-winner-sub">
              {winner.cmp} comparisons · {winner.swp} swaps · {winner.ops} total ops
            </span>
          </div>
        </div>
      )}

      <div className="srv-legend" aria-hidden="true">
        <span className="srv-legend-item"><span className="srv-legend-swatch compared" /> being compared</span>
        <span className="srv-legend-item"><span className="srv-legend-swatch swapped" /> just swapped</span>
        <span className="srv-legend-item"><span className="srv-legend-swatch sorted" /> frozen / sorted</span>
        <span className="srv-legend-item"><span className="srv-legend-swatch idle" /> idle</span>
      </div>
    </div>
  );
}
