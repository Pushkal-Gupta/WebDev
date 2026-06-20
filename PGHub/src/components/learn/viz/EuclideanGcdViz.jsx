import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './EuclideanGcdViz.css';

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

function generate(seed) {
  const rnd = mulberry32(seed);
  const a = 24 + Math.floor(rnd() * 60);
  const b = 16 + Math.floor(rnd() * 50);
  return a >= b ? [a, b] : [b, a];
}

// One frame per mod step of the subtraction-free Euclidean algorithm.
function buildFrames(a0, b0) {
  const frames = [];
  let a = a0; let b = b0;
  frames.push({ a, b, q: null, r: null, done: false,
    note: `gcd(${a0}, ${b0}). The Euclidean algorithm rests on one fact: gcd(a, b) = gcd(b, a mod b). Replacing a with a mod b shrinks the pair fast while preserving the answer.` });
  while (b !== 0) {
    const q = Math.floor(a / b);
    const r = a % b;
    frames.push({ a, b, q, r, done: false,
      note: `${a} = ${q}·${b} + ${r}. So gcd(${a}, ${b}) = gcd(${b}, ${r}). Shift the window: a ← ${b}, b ← ${r}.` });
    a = b; b = r;
  }
  frames.push({ a, b: 0, q: null, r: null, done: true, result: a,
    note: `b reached 0, so the answer is the current a = ${a}. gcd(${a0}, ${b0}) = ${a}. Each step at least halves the larger value, so it finishes in O(log min(a, b)) divisions.` });
  return frames;
}

const DEFAULT_SEED = 17;

export default function EuclideanGcdViz() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const [a0, b0] = useMemo(() => generate(seed), [seed]);
  const frames = useMemo(() => buildFrames(a0, b0), [a0, b0]);
  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];

  const isRunning = running && step < total - 1;
  const delay = Math.round(1000 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [isRunning, step, delay, total]);

  const reset = () => { setRunning(false); setStep(0); };
  const shuffle = () => { setRunning(false); setStep(0); setSeed((s) => (s * 1664525 + 1013904223) >>> 0); };

  const W = 940;
  const H = 220;
  const maxVal = a0;
  const barMaxW = W - 220;
  const barW = (v) => (maxVal <= 0 ? 0 : (v / maxVal) * barMaxW);

  return (
    <div className="egc">
      <div className="egc-head">
        <h3 className="egc-title">Euclidean algorithm — gcd by repeated remainder</h3>
        <p className="egc-sub">
          gcd(a, b) = gcd(b, a mod b). Replace the larger number with the remainder and repeat; when the
          remainder hits 0, the other number is the answer. Step through to watch the pair collapse.
        </p>
      </div>

      <div className="egc-controls">
        <div className="egc-buttons">
          <button type="button" className="egc-btn egc-btn-primary" onClick={() => { if (step >= total - 1) setStep(0); setRunning((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="egc-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}><ChevronRight size={14} /> Step</button>
          <button type="button" className="egc-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}><SkipForward size={14} /> Skip</button>
          <button type="button" className="egc-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
          <button type="button" className="egc-btn egc-btn-shuffle" onClick={shuffle}><Shuffle size={14} /> Shuffle</button>
        </div>
        <label className="egc-speed">
          <span>speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="egc-speed-range" />
          <span className="egc-speed-val">{speed.toFixed(1)}×</span>
        </label>
        <div className="egc-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="egc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="egc-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* a bar */}
          <text x={40} y={70} className="egc-label">a = {cur.a}</text>
          <rect x={150} y={52} width={Math.max(2, barW(cur.a))} height={28} rx={5} fill="var(--accent)" opacity={0.85} />

          {/* b bar */}
          <text x={40} y={132} className="egc-label">b = {cur.b}</text>
          <rect x={150} y={114} width={Math.max(2, barW(cur.b))} height={28} rx={5} fill="var(--hue-sky)" opacity={0.85} />

          {/* remainder marker overlaid on a */}
          {cur.r != null && cur.b > 0 && (
            <g>
              <rect x={150} y={52} width={Math.max(2, barW(cur.r))} height={28} rx={5}
                fill="var(--hue-pink)" opacity={0.9} />
              <text x={150 + Math.max(2, barW(cur.r)) + 8} y={71} className="egc-rem">remainder {cur.r}</text>
            </g>
          )}

          <text x={40} y={186} className="egc-eq">
            {cur.done ? `gcd = ${cur.result}` : cur.q != null ? `${cur.a} = ${cur.q}·${cur.b} + ${cur.r}` : 'press Step / Play'}
          </text>
        </svg>
      </div>

      <div className="egc-trace">
        <span className="egc-trace-label">trace</span>
        <span className="egc-trace-body">{cur.note}</span>
      </div>
    </div>
  );
}
