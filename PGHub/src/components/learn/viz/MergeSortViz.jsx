import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './MergeSortViz.css';

function buildFrames(arr) {
  const a = [...arr];
  const n = a.length;
  const frames = [];
  let comparisons = 0;
  let merges = 0;

  const snap = (extra) => ({
    arr: [...a],
    level: 0,
    lo: null,
    mid: null,
    hi: null,
    leftPtr: null,
    rightPtr: null,
    writePtr: null,
    placed: [],
    phase: 'init',
    comparisons,
    merges,
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Start: ${n} unsorted bars. Merge sort splits the array down to single elements, then merges sorted runs back together.`,
  }));

  function sort(lo, hi, level) {
    if (hi - lo <= 1) {
      if (hi - lo === 1) {
        frames.push(snap({
          phase: 'divide', lo, mid: lo, hi, level,
          note: `Divide: range [${lo}..${hi - 1}] is a single element a[${lo}]=${a[lo]} — already sorted, the base case.`,
        }));
      }
      return;
    }
    const mid = lo + Math.floor((hi - lo) / 2);
    frames.push(snap({
      phase: 'divide', lo, mid, hi, level,
      note: `Divide at level ${level}: split [${lo}..${hi - 1}] into left [${lo}..${mid - 1}] and right [${mid}..${hi - 1}].`,
    }));

    sort(lo, mid, level + 1);
    sort(mid, hi, level + 1);

    const left = a.slice(lo, mid);
    const right = a.slice(mid, hi);
    const leftLabel = `[${left.join(',')}]`;
    const rightLabel = `[${right.join(',')}]`;
    frames.push(snap({
      phase: 'merge-start', lo, mid, hi, level,
      leftPtr: lo, rightPtr: mid, writePtr: lo, placed: [],
      note: `Merge ${leftLabel} and ${rightLabel}: two pointers walk each run, picking the smaller into the output.`,
    }));

    let i = 0;
    let j = 0;
    let w = lo;
    const placed = [];
    const merged = [];
    while (i < left.length && j < right.length) {
      comparisons++;
      const lv = left[i];
      const rv = right[j];
      const takeLeft = lv <= rv;
      frames.push(snap({
        phase: 'compare', lo, mid, hi, level,
        leftPtr: lo + i, rightPtr: mid + j, writePtr: w, placed: [...placed],
        note: `Compare ${lv} vs ${rv}: ${lv} ${takeLeft ? '<=' : '>'} ${rv} -> take ${takeLeft ? lv + ' (left)' : rv + ' (right)'}.`,
      }));
      if (takeLeft) {
        merged.push(lv);
        i++;
      } else {
        merged.push(rv);
        j++;
      }
      placed.push(w);
      a.splice(lo, merged.length, ...merged);
      frames.push(snap({
        phase: 'place', lo, mid, hi, level,
        leftPtr: lo + i, rightPtr: mid + j, writePtr: w, placed: [...placed],
        note: `Place ${merged[merged.length - 1]} at index ${w}. Output so far: [${merged.join(',')}].`,
      }));
      w++;
    }
    while (i < left.length) {
      merged.push(left[i]);
      placed.push(w);
      i++;
      a.splice(lo, merged.length, ...merged);
      frames.push(snap({
        phase: 'place', lo, mid, hi, level,
        leftPtr: lo + i, rightPtr: mid + j, writePtr: w, placed: [...placed],
        note: `Right run is exhausted — copy remaining left value ${merged[merged.length - 1]} to index ${w}.`,
      }));
      w++;
    }
    while (j < right.length) {
      merged.push(right[j]);
      placed.push(w);
      j++;
      a.splice(lo, merged.length, ...merged);
      frames.push(snap({
        phase: 'place', lo, mid, hi, level,
        leftPtr: lo + i, rightPtr: mid + j, writePtr: w, placed: [...placed],
        note: `Left run is exhausted — copy remaining right value ${merged[merged.length - 1]} to index ${w}.`,
      }));
      w++;
    }
    merges++;
    frames.push(snap({
      phase: 'merged', lo, mid, hi, level,
      placed: Array.from({ length: hi - lo }, (_, k) => lo + k),
      note: `Merged: range [${lo}..${hi - 1}] is now sorted as [${merged.join(',')}]. merges = ${merges}.`,
    }));
  }

  sort(0, n, 0);

  frames.push(snap({
    phase: 'done',
    placed: Array.from({ length: n }, (_, k) => k),
    note: `Done in ${comparisons} comparisons and ${merges} merges. Merge sort is O(n log n) time, O(n) extra space, and stable.`,
  }));

  return frames;
}

function randomArray(size) {
  const out = [];
  for (let i = 0; i < size; i++) out.push(2 + Math.floor(Math.random() * 12));
  return out;
}

const DEFAULT_ARR = [5, 2, 9, 1, 7, 4, 8, 3];

export default function MergeSortViz() {
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
    if (!isRunning) return;
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
  const H = 360;
  const n = current.arr.length;
  const maxVal = Math.max(...current.arr, 1);
  const padX = 40;
  const padTop = 64;
  const baseY = H - 78;
  const usableW = W - padX * 2;
  const gap = 10;
  const barW = (usableW - gap * (n - 1)) / n;
  const usableH = baseY - padTop;

  const barX = (i) => padX + i * (barW + gap);
  const barH = (v) => Math.max(8, (v / maxVal) * usableH);

  const inMerge = current.phase === 'compare' || current.phase === 'place'
    || current.phase === 'merge-start' || current.phase === 'merged';
  const leftActive = current.lo != null && current.mid != null && current.hi != null;
  const placedSet = new Set(current.placed || []);

  const boundLabel = leftActive
    ? `left [${current.lo}..${current.mid - 1}]  right [${current.mid}..${current.hi - 1}]`
    : '—';

  return (
    <div className="msv">
      <div className="msv-head">
        <h3 className="msv-title">Merge sort — divide to single elements, merge sorted runs, O(n log n)</h3>
        <p className="msv-sub">
          Split the array in half until every piece is one element, then merge pairs of sorted runs: two pointers
          walk each run and copy the smaller value into the output until both runs are drained.
        </p>
      </div>

      <div className="msv-controls">
        <div className="msv-actions">
          <div className="msv-buttons">
            <button
              type="button"
              className="msv-btn msv-btn-primary"
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
              className="msv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="msv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="msv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
            <button type="button" className="msv-btn" onClick={reshuffle}>
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
          <label className="msv-speed">
            <span className="msv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="msv-speed-range"
            />
            <span className="msv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="msv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="msv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="msv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={W - 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={38} className="msv-row-label">array (bar height = value)</text>

          {/* sub-array span shading: left + right runs being merged */}
          {leftActive && (
            <>
              <rect
                x={barX(current.lo) - gap / 2}
                y={padTop - 10}
                width={(current.mid > current.lo ? barX(current.mid - 1) + barW : barX(current.lo) + barW) - (barX(current.lo) - gap / 2)}
                height={baseY - padTop + 14}
                fill="rgba(var(--accent-rgb), 0.06)"
                stroke="var(--hue-sky)"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                rx={6}
              />
              {current.hi > current.mid && (
                <rect
                  x={barX(current.mid) - gap / 2}
                  y={padTop - 10}
                  width={(barX(current.hi - 1) + barW) - (barX(current.mid) - gap / 2)}
                  height={baseY - padTop + 14}
                  fill="rgba(var(--accent-rgb), 0.06)"
                  stroke="var(--hue-violet)"
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                  rx={6}
                />
              )}
              <text x={barX(current.lo)} y={padTop - 16} className="msv-span-label" style={{ fill: 'var(--hue-sky)' }}>left</text>
              {current.hi > current.mid && (
                <text x={barX(current.mid)} y={padTop - 16} className="msv-span-label" style={{ fill: 'var(--hue-violet)' }}>right</text>
              )}
            </>
          )}

          <line x1={padX - 6} y1={baseY} x2={W - padX + 6} y2={baseY} stroke="var(--border)" strokeWidth={1.4} />

          {current.arr.map((v, i) => {
            const h = barH(v);
            const x = barX(i);
            const y = baseY - h;
            const inLeft = leftActive && i >= current.lo && i < current.mid;
            const inRight = leftActive && i >= current.mid && i < current.hi;
            const isLeftPtr = inMerge && i === current.leftPtr && current.leftPtr < current.mid;
            const isRightPtr = inMerge && i === current.rightPtr && current.rightPtr < current.hi;
            const isWrite = inMerge && i === current.writePtr;
            const isPlaced = placedSet.has(i);
            const isDone = current.phase === 'done';

            let fill = 'rgba(var(--accent-rgb), 0.5)';
            if (isDone || (current.phase === 'merged' && isPlaced)) fill = 'var(--easy)';
            else if (isPlaced) fill = 'rgba(var(--easy-rgb, var(--accent-rgb)), 0.55)';
            else if (isLeftPtr) fill = 'var(--hue-sky)';
            else if (isRightPtr) fill = 'var(--hue-violet)';
            else if (inLeft) fill = 'rgba(var(--accent-rgb), 0.32)';
            else if (inRight) fill = 'rgba(var(--accent-rgb), 0.32)';

            let stroke = 'var(--accent)';
            if (isDone || current.phase === 'merged') stroke = 'var(--easy)';
            else if (isLeftPtr) stroke = 'var(--hue-sky)';
            else if (isRightPtr) stroke = 'var(--hue-violet)';
            else if (isWrite) stroke = 'var(--hue-pink)';

            const emphasized = isLeftPtr || isRightPtr || isWrite;
            return (
              <g key={`bar-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={4}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={emphasized ? 2.4 : 1.2}
                />
                <text x={x + barW / 2} y={y - 7} className="msv-bar-val">{v}</text>
                <text x={x + barW / 2} y={baseY + 18} className="msv-bar-idx">{i}</text>
                {isWrite && (
                  <text x={x + barW / 2} y={baseY + 34} className="msv-ptr-tag" style={{ fill: 'var(--hue-pink)' }}>write</text>
                )}
                {isLeftPtr && !isWrite && (
                  <text x={x + barW / 2} y={baseY + 34} className="msv-ptr-tag" style={{ fill: 'var(--hue-sky)' }}>i</text>
                )}
                {isRightPtr && !isWrite && (
                  <text x={x + barW / 2} y={baseY + 34} className="msv-ptr-tag" style={{ fill: 'var(--hue-violet)' }}>j</text>
                )}
              </g>
            );
          })}

          {/* divide split marker */}
          {current.phase === 'divide' && current.mid != null && current.mid > current.lo && current.mid < current.hi && (
            <line
              x1={barX(current.mid) - gap / 2}
              y1={padTop - 10}
              x2={barX(current.mid) - gap / 2}
              y2={baseY + 6}
              stroke="var(--hue-pink)"
              strokeWidth={2}
              strokeDasharray="5 4"
            />
          )}
        </svg>
      </div>

      <div className="msv-metrics">
        <div className="msv-metric">
          <span className="msv-metric-label">phase</span>
          <span className="msv-metric-value">{current.phase}</span>
        </div>
        <div className="msv-metric">
          <span className="msv-metric-label">level</span>
          <span className="msv-metric-value">{leftActive ? current.level : '—'}</span>
        </div>
        <div className="msv-metric">
          <span className="msv-metric-label">comparisons</span>
          <span className="msv-metric-value">{current.comparisons}</span>
        </div>
        <div className="msv-metric">
          <span className="msv-metric-label">merges</span>
          <span className="msv-metric-value">{current.merges}</span>
        </div>
        <div className="msv-metric msv-metric-dim">
          <span className="msv-metric-label">sub-array bounds</span>
          <span className="msv-metric-value msv-metric-dimval">{boundLabel}</span>
        </div>
      </div>

      <div className="msv-arith">
        <span className="msv-arith-label">trace</span>
        <span className="msv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
