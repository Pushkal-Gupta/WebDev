import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './DutchNationalFlagViz.css';

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

function generateArray(seed) {
  const rnd = mulberry32(seed);
  const n = 9 + Math.floor(rnd() * 3); // 9..11
  return Array.from({ length: n }, () => Math.floor(rnd() * 3));
}

// One frame per pointer action. Tracks low/mid/high and the array snapshot.
function buildFrames(input) {
  const arr = input.slice();
  const frames = [];
  let low = 0;
  let mid = 0;
  let high = arr.length - 1;
  let swaps = 0;

  const push = (action, note) =>
    frames.push({ arr: arr.slice(), low, mid, high, action, swaps, note });

  push('start', `Three pointers: low and mid start at 0, high at ${arr.length - 1}. Everything left of low is a confirmed 0, everything right of high is a confirmed 2, and low..mid-1 is the settled 1s. The unknown region is mid..high.`);

  while (mid <= high) {
    const v = arr[mid];
    if (v === 0) {
      [arr[low], arr[mid]] = [arr[mid], arr[low]];
      if (low !== mid) swaps++;
      push('swap-low', `arr[mid]=0 → swap it down into the 0s region (low). Advance both low and mid: the value landing at mid came from low, already scanned, so it is safe to move past.`);
      low++; mid++;
    } else if (v === 2) {
      [arr[mid], arr[high]] = [arr[high], arr[mid]];
      swaps++;
      push('swap-high', `arr[mid]=2 → swap it up into the 2s region (high), then shrink high. Do NOT advance mid: the value swapped in from high is unscanned and must be examined next.`);
      high--;
    } else {
      push('keep', `arr[mid]=1 → already in its final band. Just advance mid; low stays, marking the start of the settled 1s.`);
      mid++;
    }
  }

  push('done', `Done in a single pass. low=${low}, high=${high}. The array is partitioned 0s | 1s | 2s with ${swaps} swaps and zero extra space — O(n) time, O(1) space.`);
  return frames;
}

const DEFAULT_SEED = 7;
const HUE = { 0: 'var(--hue-sky)', 1: 'var(--hue-mint)', 2: 'var(--hue-pink)' };

export default function DutchNationalFlagViz() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const input = useMemo(() => generateArray(seed), [seed]);
  const frames = useMemo(() => buildFrames(input), [input]);
  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];

  const isRunning = running && step < total - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [isRunning, step, delay, total]);

  const reset = () => { setRunning(false); setStep(0); };
  const shuffle = () => { setRunning(false); setStep(0); setSeed((s) => (s * 1664525 + 1013904223) >>> 0); };

  const W = 940;
  const H = 240;
  const n = cur.arr.length;
  const padX = 40;
  const usable = W - padX * 2;
  const gap = 10;
  const cellW = Math.min(78, (usable - gap * (n - 1)) / n);
  const cellH = 64;
  const rowY = 120;
  const startX = padX + (usable - (n * cellW + (n - 1) * gap)) / 2;
  const cellX = (i) => startX + i * (cellW + gap);

  const region = (i) => {
    if (i < cur.low) return 'zeros';
    if (i > cur.high) return 'twos';
    if (i < cur.mid) return 'ones';
    return 'unknown';
  };

  return (
    <div className="dnf">
      <div className="dnf-head">
        <h3 className="dnf-title">Dutch national flag — one-pass 3-way partition</h3>
        <p className="dnf-sub">
          Sort an array of 0s, 1s, and 2s in a single sweep with three pointers and no extra memory.
          Step through to watch low, mid, and high carve the array into three bands.
        </p>
      </div>

      <div className="dnf-controls">
        <div className="dnf-buttons">
          <button
            type="button"
            className="dnf-btn dnf-btn-primary"
            onClick={() => { if (step >= total - 1) setStep(0); setRunning((v) => !v); }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="dnf-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}>
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="dnf-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}>
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dnf-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
          <button type="button" className="dnf-btn dnf-btn-shuffle" onClick={shuffle}><Shuffle size={14} /> Shuffle</button>
        </div>
        <label className="dnf-speed">
          <span>speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="dnf-speed-range" />
          <span className="dnf-speed-val">{speed.toFixed(1)}×</span>
        </label>
        <div className="dnf-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="dnf-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dnf-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* region band labels */}
          <text x={32} y={44} className="dnf-band-label">0s | 1s | 2s · unknown region shrinks each step</text>
          <text x={W - 32} y={44} className="dnf-band-label dnf-band-right">swaps: {cur.swaps}</text>

          {cur.arr.map((v, i) => {
            const reg = region(i);
            const dim = reg === 'unknown';
            return (
              <g key={`c-${i}`}>
                <rect
                  x={cellX(i)} y={rowY} width={cellW} height={cellH} rx={8}
                  fill={dim ? 'var(--bg)' : HUE[v]}
                  stroke={dim ? 'var(--border)' : HUE[v]}
                  strokeWidth={dim ? 1.2 : 2}
                  opacity={dim ? 1 : 0.92}
                />
                <text x={cellX(i) + cellW / 2} y={rowY + cellH / 2 + 7} className="dnf-cell-val"
                  style={{ fill: dim ? 'var(--text-main)' : 'var(--bg)' }}>{v}</text>
                <text x={cellX(i) + cellW / 2} y={rowY + cellH + 18} className="dnf-cell-idx">{i}</text>
              </g>
            );
          })}

          {/* pointers */}
          {[['low', cur.low, 'var(--hue-sky)'], ['mid', cur.mid, 'var(--accent)'], ['high', cur.high, 'var(--hue-pink)']].map(([label, idx, color]) => {
            if (idx < 0 || idx >= n) return null;
            const x = cellX(idx) + cellW / 2;
            const yOff = label === 'mid' ? 96 : label === 'low' ? 78 : 78;
            return (
              <g key={label}>
                <text x={x} y={yOff} className="dnf-ptr-label" style={{ fill: color }}>{label}</text>
                <path d={`M ${x} ${rowY - 6} l -6 -10 l 12 0 z`} fill={color} />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dnf-readouts">
        <div className="dnf-metric"><span className="dnf-metric-label">low</span><span className="dnf-metric-val">{cur.low}</span></div>
        <div className="dnf-metric"><span className="dnf-metric-label">mid</span><span className="dnf-metric-val">{cur.mid}</span></div>
        <div className="dnf-metric"><span className="dnf-metric-label">high</span><span className="dnf-metric-val">{cur.high}</span></div>
        <div className="dnf-metric"><span className="dnf-metric-label">swaps</span><span className="dnf-metric-val">{cur.swaps}</span></div>
      </div>

      <div className="dnf-trace">
        <span className="dnf-trace-label">trace</span>
        <span className="dnf-trace-body">{cur.note}</span>
      </div>
    </div>
  );
}
