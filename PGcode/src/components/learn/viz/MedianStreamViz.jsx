import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './MedianStreamViz.css';

// Two-heap running median.
// lo = MAX-heap of the lower half, hi = MIN-heap of the upper half.
// We model each heap as a plain array kept in heap order so the binary-tree
// layout can read index i / parent floor((i-1)/2) directly.

const parentIdx = (i) => Math.floor((i - 1) / 2);

// Sift the value at index i up while it violates the heap order.
// cmp(child, parent) === true means child must move above parent.
function siftUp(arr, i, cmp) {
  while (i > 0) {
    const p = parentIdx(i);
    if (cmp(arr[i], arr[p])) {
      const t = arr[i];
      arr[i] = arr[p];
      arr[p] = t;
      i = p;
    } else break;
  }
}

const maxCmp = (c, p) => c > p; // child rises if larger -> max-heap
const minCmp = (c, p) => c < p; // child rises if smaller -> min-heap

function loPeek(lo) { return lo.length ? lo[0] : null; }
function hiPeek(hi) { return hi.length ? hi[0] : null; }

// Pop the root of a heap array and restore order via sift-down.
function popRoot(arr, cmp) {
  const root = arr[0];
  const last = arr.pop();
  if (arr.length) {
    arr[0] = last;
    let i = 0;
    const n = arr.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let best = i;
      if (l < n && cmp(arr[l], arr[best])) best = l;
      if (r < n && cmp(arr[r], arr[best])) best = r;
      if (best === i) break;
      const t = arr[i];
      arr[i] = arr[best];
      arr[best] = t;
      i = best;
    }
  }
  return root;
}

function medianOf(lo, hi) {
  if (lo.length === 0 && hi.length === 0) return null;
  if (lo.length > hi.length) return loPeek(lo);
  if (hi.length > lo.length) return hiPeek(hi);
  return (loPeek(lo) + hiPeek(hi)) / 2;
}

function fmt(x) {
  if (x === null || x === undefined) return '—';
  return Number.isInteger(x) ? String(x) : x.toFixed(1);
}

// Build the full animation timeline for a stream of numbers.
function buildFrames(stream) {
  const frames = [];
  const lo = []; // max-heap, lower half
  const hi = []; // min-heap, upper half

  const snap = (extra) => ({
    lo: [...lo],
    hi: [...hi],
    incoming: null,
    target: null, // 'lo' | 'hi'
    moved: null, // 'lo->hi' | 'hi->lo'
    activeLo: null,
    activeHi: null,
    median: medianOf(lo, hi),
    processed: 0,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: 'Empty stream. lo is a MAX-heap (lower half), hi is a MIN-heap (upper half). The median sits at the top of the larger heap.',
  }));

  for (let s = 0; s < stream.length; s++) {
    const v = stream[s];
    const med = medianOf(lo, hi);

    // Choose target heap: small values go to the lower (max) heap.
    const goLo = lo.length === 0 || v <= loPeek(lo);
    if (goLo) {
      lo.push(v);
      siftUp(lo, lo.length - 1, maxCmp);
    } else {
      hi.push(v);
      siftUp(hi, hi.length - 1, minCmp);
    }

    frames.push(snap({
      incoming: v,
      target: goLo ? 'lo' : 'hi',
      activeLo: goLo ? loPeek(lo) : null,
      activeHi: goLo ? null : hiPeek(hi),
      processed: s + 1,
      note: `add ${v}: ${med === null ? 'first value' : `${v} ${goLo ? '<=' : '>'} median ${fmt(med)}`} -> ${goLo ? 'max-heap (lo)' : 'min-heap (hi)'}; sizes ${lo.length} vs ${hi.length}.`,
    }));

    // Rebalance so |lo| - |hi| <= 1.
    if (lo.length > hi.length + 1) {
      const moved = popRoot(lo, maxCmp);
      hi.push(moved);
      siftUp(hi, hi.length - 1, minCmp);
      frames.push(snap({
        incoming: v,
        moved: 'lo->hi',
        activeHi: moved,
        processed: s + 1,
        note: `sizes ${lo.length + 1} vs ${hi.length - 1} -> rebalance: move max-heap top ${moved} to min-heap; now ${lo.length} vs ${hi.length}.`,
      }));
    } else if (hi.length > lo.length + 1) {
      const moved = popRoot(hi, minCmp);
      lo.push(moved);
      siftUp(lo, lo.length - 1, maxCmp);
      frames.push(snap({
        incoming: v,
        moved: 'hi->lo',
        activeLo: moved,
        processed: s + 1,
        note: `sizes ${lo.length - 1} vs ${hi.length + 1} -> rebalance: move min-heap top ${moved} to max-heap; now ${lo.length} vs ${hi.length}.`,
      }));
    }

    const newMed = medianOf(lo, hi);
    const odd = (lo.length + hi.length) % 2 === 1;
    frames.push(snap({
      incoming: v,
      processed: s + 1,
      note: odd
        ? `count ${lo.length + hi.length} is odd -> median = top of larger heap = ${fmt(newMed)}.`
        : `count ${lo.length + hi.length} is even -> median = avg(max-top ${fmt(loPeek(lo))}, min-top ${fmt(hiPeek(hi))}) = ${fmt(newMed)}.`,
    }));
  }

  frames.push(snap({
    note: `Stream done. Processed ${stream.length} values. Each insert is O(log n), each median query is O(1).`,
  }));

  return frames;
}

// (x, y) for node index i within one heap drawn in [x0, x0+width].
function nodePos(i, total, x0, width, yTop, yStep) {
  const depth = Math.floor(Math.log2(i + 1));
  const levelStart = (1 << depth) - 1;
  const indexInLevel = i - levelStart;
  const slotsInLevel = 1 << depth;
  const x = x0 + ((indexInLevel + 0.5) / slotsInLevel) * width;
  const y = yTop + depth * yStep;
  return { x, y };
}

function randomStream(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(1 + Math.floor(Math.random() * 20));
  return out;
}

const DEFAULT_STREAM = [5, 2, 8, 1, 9, 3, 7, 6];

const W = 940;
const H = 420;
const NODE_R = 19;

function HeapTree({ heap, x0, width, label, accentVar, active }) {
  const yTop = 92;
  const maxDepth = heap.length > 0 ? Math.floor(Math.log2(heap.length)) : 0;
  const yStep = maxDepth === 0 ? 0 : (H - yTop - 70) / maxDepth;
  const pos = heap.map((_, i) => nodePos(i, heap.length, x0, width, yTop, yStep));

  return (
    <g>
      <text x={x0 + width / 2} y={42} textAnchor="middle" className="msv-heap-title" style={{ fill: accentVar }}>
        {label}
      </text>
      <text x={x0 + width / 2} y={62} textAnchor="middle" className="msv-heap-meta">
        size {heap.length}{heap.length > 0 ? ` · top ${heap[0]}` : ''}
      </text>

      {heap.length === 0 && (
        <text x={x0 + width / 2} y={yTop + 40} textAnchor="middle" className="msv-empty">empty</text>
      )}

      {heap.map((_, i) => {
        if (i === 0) return null;
        const p = pos[parentIdx(i)];
        const c = pos[i];
        return (
          <line key={`edge-${i}`} x1={p.x} y1={p.y} x2={c.x} y2={c.y} className="msv-edge" />
        );
      })}

      {heap.map((v, i) => {
        const c = pos[i];
        const isTop = i === 0;
        const isActive = active !== null && active !== undefined && v === active && isTop;
        const cls = ['msv-node', isTop ? 'msv-node-top' : '', isActive ? 'msv-node-active' : '']
          .filter(Boolean).join(' ');
        return (
          <g key={`node-${i}`} className={cls}>
            {isActive && <circle cx={c.x} cy={c.y} r={NODE_R + 6} className="msv-node-ring" style={{ stroke: accentVar }} />}
            <circle
              cx={c.x}
              cy={c.y}
              r={NODE_R}
              style={isTop ? { fill: 'rgba(var(--accent-rgb), 0.16)', stroke: accentVar, strokeWidth: 2.4 } : undefined}
            />
            <text x={c.x} y={c.y + 4} textAnchor="middle" className="msv-node-value">{v}</text>
          </g>
        );
      })}
    </g>
  );
}

export default function MedianStreamViz() {
  const [stream, setStream] = useState(DEFAULT_STREAM);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(stream), [stream]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1000 / speed);

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
    setStream(randomStream(8));
  };

  const median = current.median;
  const oddCount = (current.lo.length + current.hi.length) % 2 === 1;

  const midGap = 60;
  const halfW = (W - 100 - midGap) / 2;
  const loX0 = 50;
  const hiX0 = 50 + halfW + midGap;
  const dividerX = 50 + halfW + midGap / 2;

  return (
    <div className="msv">
      <div className="msv-head">
        <h3 className="msv-title">Running median from a stream — two heaps</h3>
        <p className="msv-sub">
          A max-heap holds the lower half, a min-heap holds the upper half. Each value is pushed to the right side,
          then a rebalance keeps the sizes within one. The median reads off the tops.
        </p>
      </div>

      <div className="msv-controls">
        <div className="msv-buttons">
          <button
            type="button"
            className="msv-btn msv-btn-primary"
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
            <Shuffle size={14} /> New stream
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
          <span className="msv-speed-value">{speed.toFixed(1)}x</span>
        </label>
        <div className="msv-stepcount">step <strong>{step + 1}</strong> / {totalSteps}</div>
      </div>

      <div className="msv-stream-row">
        <span className="msv-stream-label">stream</span>
        <div className="msv-stream-cells">
          {stream.map((v, i) => (
            <div
              key={`sc-${i}`}
              className={`msv-stream-cell ${i < current.processed ? 'msv-stream-done' : ''} ${i === current.processed - 1 && current.incoming !== null ? 'msv-stream-current' : ''}`}
            >
              {v}
            </div>
          ))}
        </div>
      </div>

      <div className="msv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="msv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={14} y={14} width={W - 28} height={H - 28} fill="var(--bg)" stroke="var(--border)" rx={8} />

          <line x1={dividerX} y1={30} x2={dividerX} y2={H - 30} stroke="var(--border)" strokeWidth={1} strokeDasharray="4 5" />

          <HeapTree
            heap={current.lo}
            x0={loX0}
            width={halfW}
            label="MAX-heap (lower half)"
            accentVar="var(--hue-sky)"
            active={current.activeLo}
          />
          <HeapTree
            heap={current.hi}
            x0={hiX0}
            width={halfW}
            label="MIN-heap (upper half)"
            accentVar="var(--hue-pink)"
            active={current.activeHi}
          />

          {/* incoming chip */}
          {current.incoming !== null && (
            <g>
              <rect x={W / 2 - 70} y={H - 46} width={140} height={26} rx={13} className="msv-incoming-pill" />
              <text x={W / 2} y={H - 28} textAnchor="middle" className="msv-incoming-text">
                incoming {current.incoming}{current.target ? ` -> ${current.target}` : ''}{current.moved ? ` (move ${current.moved})` : ''}
              </text>
            </g>
          )}

          {/* median readout banner */}
          {median !== null && (
            <g>
              <rect x={W / 2 - 96} y={26} width={192} height={30} rx={8} className="msv-median-pill" />
              <text x={W / 2} y={46} textAnchor="middle" className="msv-median-text">
                median = {fmt(median)}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="msv-metrics">
        <div className="msv-metric">
          <span className="msv-metric-label">median</span>
          <span className="msv-metric-value">{fmt(median)}</span>
        </div>
        <div className="msv-metric">
          <span className="msv-metric-label">incoming</span>
          <span className="msv-metric-value">{current.incoming === null ? '—' : current.incoming}</span>
        </div>
        <div className="msv-metric">
          <span className="msv-metric-label">went to</span>
          <span className="msv-metric-value">
            {current.target === 'lo' ? 'max-heap' : current.target === 'hi' ? 'min-heap' : current.moved ? `move ${current.moved}` : '—'}
          </span>
        </div>
        <div className="msv-metric">
          <span className="msv-metric-label">max-heap size</span>
          <span className="msv-metric-value">{current.lo.length}</span>
        </div>
        <div className="msv-metric">
          <span className="msv-metric-label">min-heap size</span>
          <span className="msv-metric-value">{current.hi.length}</span>
        </div>
        <div className="msv-metric msv-metric-dim">
          <span className="msv-metric-label">count</span>
          <span className="msv-metric-value msv-metric-dimval">
            {current.lo.length + current.hi.length} ({oddCount ? 'odd' : 'even'})
          </span>
        </div>
      </div>

      <div className="msv-caption">
        <span className="msv-caption-label">trace</span>
        <span className="msv-caption-text">{current.note}</span>
      </div>
    </div>
  );
}
