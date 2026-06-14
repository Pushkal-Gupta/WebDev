import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './BubbleSortViz.css';

function buildFrames(arr) {
  const a = [...arr];
  const n = a.length;
  const frames = [];
  let comparisons = 0;
  let swaps = 0;

  const snap = (extra) => ({
    arr: [...a],
    compare: null,
    swapping: false,
    sortedFrom: n,
    pass: 0,
    comparisons,
    swaps,
    ...extra,
  });

  frames.push(snap({
    phase: 'init', sortedFrom: n,
    note: `Start: ${n} unsorted bars. Each pass walks left to right, swapping any out-of-order neighbours so the largest bubbles to the right.`,
  }));

  let sortedFrom = n;
  for (let i = 0; i < n - 1; i++) {
    let swappedThisPass = false;
    for (let j = 0; j < n - 1 - i; j++) {
      comparisons++;
      const gt = a[j] > a[j + 1];
      frames.push(snap({
        phase: 'compare', compare: [j, j + 1], sortedFrom, pass: i + 1,
        note: `Pass ${i + 1}: compare a[${j}]=${a[j]} ${gt ? '>' : '<='} a[${j + 1}]=${a[j + 1]} -> ${gt ? 'out of order, swap' : 'in order, keep'}.`,
      }));
      if (gt) {
        const left = a[j];
        const right = a[j + 1];
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        swappedThisPass = true;
        frames.push(snap({
          phase: 'swap', compare: [j, j + 1], swapping: true, sortedFrom, pass: i + 1,
          note: `Swap a[${j}] and a[${j + 1}]: ${left} <-> ${right}. swaps = ${swaps}.`,
        }));
      }
    }
    sortedFrom = n - 1 - i;
    frames.push(snap({
      phase: 'settle', sortedFrom, pass: i + 1,
      note: `End of pass ${i + 1}: a[${sortedFrom}]=${a[sortedFrom]} is bubbled into its final spot. The sorted tail now holds ${n - sortedFrom} bar(s).`,
    }));
    if (!swappedThisPass) {
      sortedFrom = 0;
      frames.push(snap({
        phase: 'early-exit', sortedFrom, pass: i + 1,
        note: `No swaps in pass ${i + 1} -> the array is already sorted. Early exit, skip the remaining passes.`,
      }));
      break;
    }
  }

  frames.push(snap({
    phase: 'done', sortedFrom: 0,
    note: `Done in ${comparisons} comparisons and ${swaps} swaps. Bubble sort is O(n^2) comparisons, O(1) extra space, and stable.`,
  }));

  return frames;
}

function randomArray(size) {
  const out = [];
  for (let i = 0; i < size; i++) out.push(2 + Math.floor(Math.random() * 12));
  return out;
}

const DEFAULT_ARR = [5, 2, 9, 1, 7, 4, 8, 3];

export default function BubbleSortViz() {
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
  const padTop = 46;
  const baseY = H - 70;
  const usableW = W - padX * 2;
  const gap = 10;
  const barW = (usableW - gap * (n - 1)) / n;
  const usableH = baseY - padTop;

  const barX = (i) => padX + i * (barW + gap);
  const barH = (v) => Math.max(8, (v / maxVal) * usableH);

  const compareSet = current.compare;

  return (
    <div className="bsv">
      <div className="bsv-head">
        <h3 className="bsv-title">Bubble sort — repeated neighbour swaps, O(n^2)</h3>
        <p className="bsv-sub">
          Each pass scans left to right and swaps any pair that&apos;s out of order. The largest unsorted value
          &quot;bubbles&quot; to the right end every pass, growing a sorted tail until the whole array is ordered.
        </p>
      </div>

      <div className="bsv-controls">
        <div className="bsv-actions">
          <div className="bsv-buttons">
            <button
              type="button"
              className="bsv-btn bsv-btn-primary"
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
              className="bsv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="bsv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="bsv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
            <button type="button" className="bsv-btn" onClick={reshuffle}>
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
          <label className="bsv-speed">
            <span className="bsv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bsv-speed-range"
            />
            <span className="bsv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="bsv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="bsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bsv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={W - 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={38} className="bsv-row-label">array (bar height = value)</text>

          {/* sorted-tail shading */}
          {current.sortedFrom < n && (
            <rect
              x={barX(current.sortedFrom) - gap / 2}
              y={padTop - 6}
              width={W - padX - (barX(current.sortedFrom) - gap / 2) + 4}
              height={baseY - padTop + 12}
              fill="rgba(var(--accent-rgb), 0.08)"
              stroke="var(--easy)"
              strokeDasharray="4 4"
              strokeWidth={1.2}
              rx={6}
            />
          )}

          <line x1={padX - 6} y1={baseY} x2={W - padX + 6} y2={baseY} stroke="var(--border)" strokeWidth={1.4} />

          {current.arr.map((v, i) => {
            const h = barH(v);
            const x = barX(i);
            const y = baseY - h;
            const isCompare = compareSet && (i === compareSet[0] || i === compareSet[1]);
            const isSwap = isCompare && current.swapping;
            const isSorted = i >= current.sortedFrom;
            const fill = isSwap ? 'var(--hard)'
              : isCompare ? 'var(--hue-pink)'
              : isSorted ? 'var(--easy)'
              : 'rgba(var(--accent-rgb), 0.55)';
            const stroke = isSwap ? 'var(--hard)'
              : isCompare ? 'var(--hue-pink)'
              : isSorted ? 'var(--easy)'
              : 'var(--accent)';
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
                  strokeWidth={isCompare ? 2.4 : 1.2}
                />
                <text x={x + barW / 2} y={y - 7} className="bsv-bar-val">{v}</text>
                <text x={x + barW / 2} y={baseY + 18} className="bsv-bar-idx">{i}</text>
              </g>
            );
          })}

          {/* compare bracket */}
          {compareSet && (
            <g>
              <path
                d={`M ${barX(compareSet[0]) + barW / 2} ${baseY + 30}
                    L ${barX(compareSet[0]) + barW / 2} ${baseY + 38}
                    L ${barX(compareSet[1]) + barW / 2} ${baseY + 38}
                    L ${barX(compareSet[1]) + barW / 2} ${baseY + 30}`}
                fill="none"
                stroke={current.swapping ? 'var(--hard)' : 'var(--hue-pink)'}
                strokeWidth={1.8}
              />
              <text
                x={(barX(compareSet[0]) + barX(compareSet[1])) / 2 + barW / 2}
                y={baseY + 52}
                className="bsv-bracket-text"
                style={{ fill: current.swapping ? 'var(--hard)' : 'var(--hue-pink)' }}
              >
                {current.swapping ? 'swap' : 'compare'}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="bsv-metrics">
        <div className="bsv-metric">
          <span className="bsv-metric-label">phase</span>
          <span className="bsv-metric-value">{current.phase}</span>
        </div>
        <div className="bsv-metric">
          <span className="bsv-metric-label">pass</span>
          <span className="bsv-metric-value">{current.pass} / {Math.max(1, n - 1)}</span>
        </div>
        <div className="bsv-metric">
          <span className="bsv-metric-label">comparisons</span>
          <span className="bsv-metric-value">{current.comparisons}</span>
        </div>
        <div className="bsv-metric">
          <span className="bsv-metric-label">swaps</span>
          <span className="bsv-metric-value">{current.swaps}</span>
        </div>
        <div className="bsv-metric bsv-metric-dim">
          <span className="bsv-metric-label">sorted tail</span>
          <span className="bsv-metric-value bsv-metric-dimval">{n - current.sortedFrom} of {n}</span>
        </div>
      </div>

      <div className="bsv-arith">
        <span className="bsv-arith-label">trace</span>
        <span className="bsv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
