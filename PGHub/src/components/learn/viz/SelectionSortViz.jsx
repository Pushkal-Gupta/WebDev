import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './SelectionSortViz.css';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeArray(seed, size) {
  const rand = mulberry32(seed);
  const out = [];
  for (let i = 0; i < size; i++) out.push(2 + Math.floor(rand() * 96));
  return out;
}

// Pure: full ordered frame list for one selection-sort run over `input`.
function buildFrames(input) {
  const a = input.slice();
  const n = a.length;
  const frames = [];
  let comparisons = 0;
  let swaps = 0;

  const snap = (extra) => ({
    array: a.slice(),
    sortedUpTo: 0, // indices < sortedUpTo are locked
    pass: 0,
    cursor: -1,
    minIdx: -1,
    comparisons,
    swaps,
    note: '',
    swapping: null, // [i, j] when a swap is happening
    ...extra,
  });

  frames.push(snap({
    note: `Start. ${n} unsorted values. Each pass finds the minimum of the unsorted suffix and pulls it to the front.`,
  }));

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    frames.push(snap({
      sortedUpTo: i,
      pass: i,
      cursor: i,
      minIdx,
      note: `Pass ${i + 1}: assume a[${i}] = ${a[i]} is the minimum of the suffix. Now scan the rest.`,
    }));

    for (let j = i + 1; j < n; j++) {
      comparisons += 1;
      const isNewMin = a[j] < a[minIdx];
      if (isNewMin) minIdx = j;
      frames.push(snap({
        sortedUpTo: i,
        pass: i,
        cursor: j,
        minIdx,
        comparisons,
        note: isNewMin
          ? `Scanning index ${j} (value ${a[j]}) — new minimum. Running min is now a[${minIdx}] = ${a[minIdx]}.`
          : `Scanning index ${j} (value ${a[j]}) — not smaller than current min a[${minIdx}] = ${a[minIdx]}. Keep going.`,
      }));
    }

    if (minIdx !== i) {
      const before = a[i];
      const moved = a[minIdx];
      const tmp = a[i];
      a[i] = a[minIdx];
      a[minIdx] = tmp;
      swaps += 1;
      frames.push(snap({
        sortedUpTo: i,
        pass: i,
        cursor: i,
        minIdx,
        swaps,
        swapping: [i, minIdx],
        note: `Swap a[${i}] and a[${minIdx}] — value ${moved} moves to position ${i} (was ${before}). Position ${i} is now locked.`,
      }));
    } else {
      frames.push(snap({
        sortedUpTo: i,
        pass: i,
        cursor: i,
        minIdx,
        note: `Minimum already sits at index ${i} (value ${a[i]}) — no swap needed. Position ${i} locked.`,
      }));
    }
  }

  frames.push(snap({
    sortedUpTo: n,
    pass: n - 1,
    cursor: -1,
    minIdx: -1,
    note: `Sorted. ${comparisons} comparisons (always n(n-1)/2), ${swaps} swaps (the fewest of any comparison sort).`,
  }));

  return frames;
}

const RUN_DELAY_MS = 900;
const SIZES = [6, 8, 10];

export default function SelectionSortViz({ seed = 7 }) {
  const [size, setSize] = useState(8);
  const [instanceSeed, setInstanceSeed] = useState(seed);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const input = useMemo(() => makeArray(instanceSeed, size), [instanceSeed, size]);
  const frames = useMemo(() => buildFrames(input), [input]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  const maxVal = useMemo(() => Math.max(...input), [input]);

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

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const switchSize = (s) => {
    if (s === size) return;
    setIsRunning(false);
    setStep(0);
    setSize(s);
  };

  const reshuffle = () => {
    setIsRunning(false);
    setStep(0);
    setInstanceSeed((s) => (s * 1664525 + 1013904223) >>> 0);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry — bars laid out across the width, scaled to always fit.
  const W = 940;
  const H = 360;
  const padX = 40;
  const padTop = 30;
  const baseY = 280;
  const n = current.array.length;
  const gap = 14;
  const cellW = (W - padX * 2 - gap * (n - 1)) / n;
  const maxBarH = baseY - padTop;
  const barX = (i) => padX + i * (cellW + gap);
  const barH = (v) => Math.max(18, (v / maxVal) * maxBarH);

  const roleOf = (i) => {
    if (i < current.sortedUpTo) return 'locked';
    if (current.swapping && (i === current.swapping[0] || i === current.swapping[1])) return 'swap';
    if (i === current.minIdx) return 'min';
    if (i === current.cursor) return 'cursor';
    return 'idle';
  };

  return (
    <div className="ssv">
      <div className="ssv-head">
        <h3 className="ssv-title">Selection sort — find the minimum, swap it to the front</h3>
        <p className="ssv-sub">
          Each pass scans the unsorted suffix for the smallest value, then swaps it into place. The green prefix is
          locked; the violet cursor scans; the pink bar tracks the running minimum.
        </p>
      </div>

      <div className="ssv-controls">
        <div className="ssv-modes" role="group" aria-label="Array size">
          {SIZES.map((s) => (
            <button
              key={`size-${s}`}
              type="button"
              className={`ssv-mode ${size === s ? 'is-on' : ''}`}
              onClick={() => switchSize(s)}
              aria-pressed={size === s}
            >
              n = {s}
            </button>
          ))}
          <button type="button" className="ssv-mode ssv-shuffle" onClick={reshuffle}>
            <Shuffle size={13} /> randomize
          </button>
        </div>

        <label className="ssv-speed">
          <span className="ssv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ssv-speed-range"
            aria-label="Playback speed"
          />
          <span className="ssv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="ssv-spacer" aria-hidden="true" />

        <div className="ssv-buttons">
          <button
            type="button"
            className="ssv-btn ssv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="ssv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="ssv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="ssv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="ssv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="ssv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ssv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="ssv-grad-locked" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-mint)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--hue-mint)" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="ssv-grad-min" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-pink)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--hue-pink)" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="ssv-grad-cursor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-violet)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--hue-violet)" stopOpacity="0.55" />
            </linearGradient>
          </defs>

          {/* baseline */}
          <line className="ssv-baseline" x1={padX - 8} y1={baseY} x2={W - padX + 8} y2={baseY} />

          {current.array.map((v, i) => {
            const role = roleOf(i);
            const h = barH(v);
            const x = barX(i);
            const y = baseY - h;
            return (
              <g key={`bar-${i}`} className={`ssv-bargroup ssv-role-${role}`}>
                <rect
                  className={`ssv-bar ssv-bar-${role}`}
                  x={x}
                  y={y}
                  width={cellW}
                  height={h}
                  rx={5}
                />
                <text className="ssv-val" x={x + cellW / 2} y={y - 8}>{v}</text>
                <text className="ssv-idx" x={x + cellW / 2} y={baseY + 20}>{i}</text>
                {i === current.minIdx && i >= current.sortedUpTo && !current.swapping && (
                  <text className="ssv-tag ssv-tag-min" x={x + cellW / 2} y={baseY + 38}>min</text>
                )}
                {i === current.cursor && i !== current.minIdx && i >= current.sortedUpTo && !current.swapping && (
                  <text className="ssv-tag ssv-tag-cursor" x={x + cellW / 2} y={baseY + 38}>scan</text>
                )}
                {i < current.sortedUpTo && (
                  <text className="ssv-tag ssv-tag-lock" x={x + cellW / 2} y={baseY + 38}>locked</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="ssv-metrics">
        <div className="ssv-metric">
          <span className="ssv-metric-label">pass</span>
          <span className="ssv-metric-value">{current.sortedUpTo >= n ? 'done' : `${current.pass + 1} / ${n - 1}`}</span>
        </div>
        <div className="ssv-metric">
          <span className="ssv-metric-label">comparisons</span>
          <span className="ssv-metric-value is-cursor">{current.comparisons}</span>
        </div>
        <div className="ssv-metric">
          <span className="ssv-metric-label">swaps</span>
          <span className="ssv-metric-value is-lock">{current.swaps}</span>
        </div>
        <div className="ssv-metric">
          <span className="ssv-metric-label">current min</span>
          <span className="ssv-metric-value is-min">
            {current.minIdx >= 0 ? `${current.array[current.minIdx]} @ ${current.minIdx}` : '—'}
          </span>
        </div>
        <div className="ssv-metric">
          <span className="ssv-metric-label">locked prefix</span>
          <span className="ssv-metric-value">{current.sortedUpTo}</span>
        </div>
      </div>

      <div className="ssv-narration">
        <span className="ssv-narration-label">trace</span>
        <span className="ssv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
