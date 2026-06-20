import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './QuickSortViz.css';

function buildFrames(arr) {
  const a = [...arr];
  const n = a.length;
  const frames = [];
  let comparisons = 0;
  let swaps = 0;
  const sorted = new Array(n).fill(false);

  const snap = (extra) => ({
    arr: [...a],
    sorted: [...sorted],
    lo: null,
    hi: null,
    pivot: null,
    i: null,
    j: null,
    compare: null,
    swap: null,
    stack: [],
    comparisons,
    swaps,
    ...extra,
  });

  if (n === 0) {
    frames.push(snap({ phase: 'done', note: 'Empty array — already sorted.' }));
    return frames;
  }

  frames.push(snap({
    phase: 'init',
    note: `Start: ${n} unsorted bars. Quicksort (Lomuto) picks the last element of a sub-range as pivot, partitions smaller values to its left, then recurses into the two halves.`,
  }));

  // Iterative quicksort so we can snapshot the call stack as a recursion view.
  const callStack = [[0, n - 1]];
  const pending = []; // ranges queued (for the recursion readout)

  const stackView = () => callStack.map(([l, h]) => `[${l}..${h}]`);

  while (callStack.length) {
    const [lo, hi] = callStack.pop();
    if (lo >= hi) {
      if (lo === hi) {
        sorted[lo] = true;
        frames.push(snap({
          phase: 'leaf', lo, hi, stack: stackView(),
          note: `Sub-range [${lo}..${hi}] has one element a[${lo}]=${a[lo]} — already in place. Mark it sorted.`,
        }));
      }
      continue;
    }

    const pivot = hi;
    const pivotVal = a[pivot];
    frames.push(snap({
      phase: 'partition-start', lo, hi, pivot, i: lo - 1, j: lo, stack: stackView(),
      note: `Partition sub-range [${lo}..${hi}]. pivot = a[${pivot}] = ${pivotVal}. i (boundary of "smaller" region) starts left of lo; j scans from ${lo}.`,
    }));

    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      comparisons++;
      const less = a[j] < pivotVal;
      frames.push(snap({
        phase: 'compare', lo, hi, pivot, i, j, compare: [j, pivot], stack: stackView(),
        note: `pivot=${pivotVal}; a[${j}]=${a[j]} ${less ? '<' : '>='} ${pivotVal} -> ${less ? 'belongs in the smaller region, advance i and swap it in.' : 'leave it on the right, j moves on.'}`,
      }));
      if (less) {
        i++;
        if (i !== j) {
          const left = a[i];
          const right = a[j];
          [a[i], a[j]] = [a[j], a[i]];
          swaps++;
          frames.push(snap({
            phase: 'swap', lo, hi, pivot, i, j, swap: [i, j], stack: stackView(),
            note: `Swap a[${i}] and a[${j}]: ${left} <-> ${right}. The smaller region now ends at i=${i}. swaps = ${swaps}.`,
          }));
        } else {
          frames.push(snap({
            phase: 'advance', lo, hi, pivot, i, j, stack: stackView(),
            note: `a[${j}]=${a[j]} already sits at the smaller-region boundary (i=j=${i}); just extend i, no swap needed.`,
          }));
        }
      }
    }

    // place pivot at i+1
    const p = i + 1;
    if (p !== hi) {
      const left = a[p];
      const right = a[hi];
      [a[p], a[hi]] = [a[hi], a[p]];
      swaps++;
      frames.push(snap({
        phase: 'place-pivot', lo, hi, pivot: p, i, j: hi, swap: [p, hi], stack: stackView(),
        note: `Scan done. Drop the pivot into the gap: swap a[${p}] and a[${hi}] (${left} <-> ${right}). Pivot ${pivotVal} now sits at index ${p}.`,
      }));
    } else {
      frames.push(snap({
        phase: 'place-pivot', lo, hi, pivot: p, i, j: hi, stack: stackView(),
        note: `Scan done. Pivot ${pivotVal} is already at index ${p} — no swap needed.`,
      }));
    }
    sorted[p] = true;
    frames.push(snap({
      phase: 'pivot-fixed', lo, hi, pivot: p, stack: stackView(),
      note: `Pivot ${pivotVal} is in its FINAL sorted position at index ${p}. Everything left of it is smaller, everything right is >= it. Recurse into [${lo}..${p - 1}] and [${p + 1}..${hi}].`,
    }));

    // push right then left so left is processed first (LIFO)
    if (p + 1 <= hi) callStack.push([p + 1, hi]);
    if (lo <= p - 1) callStack.push([lo, p - 1]);
    pending.push([lo, p - 1], [p + 1, hi]);
  }

  for (let k = 0; k < n; k++) sorted[k] = true;
  frames.push(snap({
    phase: 'done',
    note: `Done in ${comparisons} comparisons and ${swaps} swaps. Quicksort averages O(n log n); worst case O(n^2) when partitions are maximally unbalanced.`,
  }));

  return frames;
}

function randomArray(size) {
  const out = [];
  for (let i = 0; i < size; i++) out.push(2 + Math.floor(Math.random() * 12));
  return out;
}

const DEFAULT_ARR = [7, 2, 9, 4, 3, 8, 1, 6];

export default function QuickSortViz() {
  const [data, setData] = useState(DEFAULT_ARR);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(data), [data]);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

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

  const reshuffle = () => {
    setIsRunningRaw(false);
    setStep(0);
    setData(randomArray(data.length));
  };

  const W = 940;
  const H = 380;
  const n = current.arr.length;
  const maxVal = Math.max(...current.arr, 1);
  const padX = 40;
  const padTop = 50;
  const baseY = H - 96;
  const usableW = W - padX * 2;
  const gap = 10;
  const barW = n > 0 ? (usableW - gap * (n - 1)) / n : usableW;
  const usableH = baseY - padTop;

  const barX = (i) => padX + i * (barW + gap);
  const barH = (v) => Math.max(8, (v / maxVal) * usableH);

  const inRange = (i) => current.lo != null && current.hi != null && i >= current.lo && i <= current.hi;
  const compareSet = current.compare;
  const swapSet = current.swap;

  const rangeBounds = current.lo != null && current.hi != null
    ? `[${current.lo}..${current.hi}]`
    : '—';

  return (
    <div className="qsv">
      <div className="qsv-head">
        <h3 className="qsv-title">Quicksort — Lomuto partition, average O(n log n)</h3>
        <p className="qsv-sub">
          Pick the last element of a sub-range as pivot. A pointer j scans the range; every value smaller than the
          pivot is swapped into a growing left region bounded by i. Finally the pivot drops into the gap at its
          final sorted index, and each half recurses.
        </p>
      </div>

      <div className="qsv-controls">
        <div className="qsv-actions">
          <div className="qsv-buttons">
            <button
              type="button"
              className="qsv-btn qsv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="qsv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="qsv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="qsv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
            <button type="button" className="qsv-btn" onClick={reshuffle}>
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
          <label className="qsv-speed">
            <span className="qsv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="qsv-speed-range"
            />
            <span className="qsv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="qsv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="qsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="qsv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={W - 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={40} className="qsv-row-label">array (bar height = value)</text>

          {/* active sub-range shading */}
          {current.lo != null && current.hi != null && (
            <rect
              x={barX(current.lo) - gap / 2}
              y={padTop - 8}
              width={(barX(current.hi) + barW) - (barX(current.lo) - gap / 2) + gap / 2}
              height={baseY - padTop + 16}
              fill="rgba(var(--accent-rgb), 0.07)"
              stroke="var(--hue-sky)"
              strokeDasharray="4 4"
              strokeWidth={1.2}
              rx={6}
            />
          )}

          <line x1={padX - 6} y1={baseY} x2={W - padX + 6} y2={baseY} stroke="var(--border)" strokeWidth={1.4} />

          {current.arr.map((v, idx) => {
            const h = barH(v);
            const x = barX(idx);
            const y = baseY - h;
            const isPivot = idx === current.pivot;
            const isCompare = compareSet && idx === compareSet[0];
            const isSwap = swapSet && (idx === swapSet[0] || idx === swapSet[1]);
            const isSortedBar = current.sorted[idx];
            const dimmed = current.lo != null && current.hi != null && !inRange(idx) && !isSortedBar;
            let fill = 'rgba(var(--accent-rgb), 0.55)';
            let stroke = 'var(--accent)';
            if (isSortedBar) { fill = 'var(--easy)'; stroke = 'var(--easy)'; }
            else if (isPivot) { fill = 'var(--hard)'; stroke = 'var(--hard)'; }
            else if (isSwap) { fill = 'var(--warning)'; stroke = 'var(--warning)'; }
            else if (isCompare) { fill = 'var(--hue-pink)'; stroke = 'var(--hue-pink)'; }
            else if (dimmed) { fill = 'rgba(var(--accent-rgb), 0.18)'; stroke = 'var(--border)'; }
            return (
              <g key={`bar-${idx}`} opacity={dimmed ? 0.7 : 1}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={4}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={(isPivot || isCompare || isSwap) ? 2.4 : 1.2}
                />
                <text x={x + barW / 2} y={y - 7} className="qsv-bar-val">{v}</text>
                <text x={x + barW / 2} y={baseY + 18} className="qsv-bar-idx">{idx}</text>
              </g>
            );
          })}

          {/* i / j pointers */}
          {current.i != null && current.i >= current.lo && current.i <= current.hi && (
            <g>
              <path
                d={`M ${barX(current.i) + barW / 2} ${baseY + 30}
                    l -5 8 l 10 0 z`}
                fill="var(--hue-mint)"
              />
              <text x={barX(current.i) + barW / 2} y={baseY + 52} className="qsv-ptr-label" style={{ fill: 'var(--hue-mint)' }}>i</text>
            </g>
          )}
          {current.j != null && current.j >= 0 && current.j < n && (
            <g>
              <path
                d={`M ${barX(current.j) + barW / 2} ${baseY + 60}
                    l -5 8 l 10 0 z`}
                fill="var(--hue-pink)"
              />
              <text x={barX(current.j) + barW / 2} y={baseY + 82} className="qsv-ptr-label" style={{ fill: 'var(--hue-pink)' }}>j</text>
            </g>
          )}
        </svg>
      </div>

      <div className="qsv-metrics">
        <div className="qsv-metric">
          <span className="qsv-metric-label">phase</span>
          <span className="qsv-metric-value">{current.phase}</span>
        </div>
        <div className="qsv-metric">
          <span className="qsv-metric-label">pivot</span>
          <span className="qsv-metric-value">
            {current.pivot != null && current.arr[current.pivot] != null
              ? `${current.arr[current.pivot]} @${current.pivot}`
              : '—'}
          </span>
        </div>
        <div className="qsv-metric">
          <span className="qsv-metric-label">sub-range</span>
          <span className="qsv-metric-value">{rangeBounds}</span>
        </div>
        <div className="qsv-metric">
          <span className="qsv-metric-label">comparisons</span>
          <span className="qsv-metric-value">{current.comparisons}</span>
        </div>
        <div className="qsv-metric">
          <span className="qsv-metric-label">swaps</span>
          <span className="qsv-metric-value">{current.swaps}</span>
        </div>
        <div className="qsv-metric qsv-metric-dim">
          <span className="qsv-metric-label">sorted</span>
          <span className="qsv-metric-value qsv-metric-dimval">
            {current.sorted.filter(Boolean).length} of {n}
          </span>
        </div>
      </div>

      <div className="qsv-recursion">
        <span className="qsv-recursion-label">call stack (pending sub-ranges)</span>
        <div className="qsv-recursion-row">
          {current.stack && current.stack.length > 0 ? (
            current.stack.map((s, k) => (
              <span key={`st-${k}`} className={`qsv-frame${k === current.stack.length - 1 ? ' qsv-frame-top' : ''}`}>
                {s}
              </span>
            ))
          ) : (
            <span className="qsv-frame-empty">empty — no work left</span>
          )}
        </div>
      </div>

      <div className="qsv-arith">
        <span className="qsv-arith-label">trace</span>
        <span className="qsv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
