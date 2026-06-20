import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './BinarySearchAnswerViz.css';

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

// Concrete framing: minimum eating speed (LeetCode "Koko"). piles + hours h.
// feasible(speed) = total hours needed <= h. Monotonic: faster speed -> fewer hours.
function generate(seed) {
  const rnd = mulberry32(seed);
  const n = 4 + Math.floor(rnd() * 2);
  const piles = Array.from({ length: n }, () => 3 + Math.floor(rnd() * 9));
  const total = piles.reduce((a, b) => a + b, 0);
  const h = total; // guarantees feasibility somewhere in [1, max]
  return { piles, h };
}

function hoursNeeded(piles, speed) {
  return piles.reduce((acc, p) => acc + Math.ceil(p / speed), 0);
}

function buildFrames({ piles, h }) {
  const frames = [];
  const hi0 = Math.max(...piles);
  let lo = 1;
  let hi = hi0;
  frames.push({
    lo, hi, mid: -1, feasible: null, answer: -1,
    note: `Don't search the array — search the answer. The eating speed lives in [1, ${hi0}]. feasible(s) = "can finish in ${h} hours at speed s" is monotonic: once a speed works, every faster speed works too. So binary-search the smallest speed that works.`,
  });
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const need = hoursNeeded(piles, mid);
    const ok = need <= h;
    frames.push({
      lo, hi, mid, feasible: ok, need, answer: -1,
      note: `Try speed ${mid}: needs ${need} hours vs budget ${h}. ${ok ? `Feasible → this speed might be the answer, but maybe slower also works. Keep it and search left: hi = ${mid}.` : `Too slow → infeasible. Discard everything ≤ ${mid}: lo = ${mid + 1}.`}`,
    });
    if (ok) hi = mid;
    else lo = mid + 1;
  }
  frames.push({
    lo, hi, mid: -1, feasible: true, answer: lo,
    note: `Converged: lo = hi = ${lo}. That's the minimum speed that finishes in ${h} hours — the first "true" on the feasibility line. O(log range) feasibility checks, each O(n).`,
  });
  return frames;
}

const DEFAULT_SEED = 9;

export default function BinarySearchAnswerViz() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const prob = useMemo(() => generate(seed), [seed]);
  const frames = useMemo(() => buildFrames(prob), [prob]);
  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];
  const hiMax = Math.max(...prob.piles);

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
  const H = 250;
  const padX = 56;
  const lineY = 150;
  const lineLeft = padX;
  const lineRight = W - padX;
  const span = hiMax - 1;
  const xOf = (v) => (span <= 0 ? (lineLeft + lineRight) / 2 : lineLeft + ((v - 1) / span) * (lineRight - lineLeft));

  return (
    <div className="bsa">
      <div className="bsa-head">
        <h3 className="bsa-title">Binary search on the answer</h3>
        <p className="bsa-sub">
          When the answer space is ordered and a yes/no test is monotonic, binary-search the answer itself.
          Here: the minimum eating speed to clear all piles within the hour budget.
        </p>
      </div>

      <div className="bsa-controls">
        <div className="bsa-buttons">
          <button type="button" className="bsa-btn bsa-btn-primary" onClick={() => { if (step >= total - 1) setStep(0); setRunning((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="bsa-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}><ChevronRight size={14} /> Step</button>
          <button type="button" className="bsa-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}><SkipForward size={14} /> Skip</button>
          <button type="button" className="bsa-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
          <button type="button" className="bsa-btn bsa-btn-shuffle" onClick={shuffle}><Shuffle size={14} /> Shuffle</button>
        </div>
        <label className="bsa-speed">
          <span>speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="bsa-speed-range" />
          <span className="bsa-speed-val">{speed.toFixed(1)}×</span>
        </label>
        <div className="bsa-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="bsa-pills">
        <span className="bsa-pill">piles: [{prob.piles.join(', ')}]</span>
        <span className="bsa-pill">hours budget h = {prob.h}</span>
      </div>

      <div className="bsa-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bsa-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* feasibility line: infeasible (left) | feasible (right) */}
          <line x1={lineLeft} y1={lineY} x2={lineRight} y2={lineY} stroke="var(--border)" strokeWidth={2} />
          {/* live search window */}
          <rect x={xOf(cur.lo)} y={lineY - 16} width={Math.max(0, xOf(cur.hi) - xOf(cur.lo))} height={32}
            fill="rgba(var(--accent-rgb), 0.12)" stroke="var(--accent)" strokeWidth={1.4} rx={6} />

          {/* candidate ticks */}
          {Array.from({ length: hiMax }, (_, k) => k + 1).map((v) => {
            const x = xOf(v);
            const inWin = v >= cur.lo && v <= cur.hi;
            const isMid = v === cur.mid;
            const isAns = v === cur.answer;
            return (
              <g key={v}>
                <line x1={x} y1={lineY - 6} x2={x} y2={lineY + 6} stroke={inWin ? 'var(--text-dim)' : 'var(--border)'} strokeWidth={1.2} />
                <circle cx={x} cy={lineY} r={isMid || isAns ? 8 : 4}
                  fill={isAns ? 'var(--accent)' : isMid ? (cur.feasible ? 'var(--easy)' : 'var(--hard)') : inWin ? 'var(--bg)' : 'var(--surface)'}
                  stroke={isAns ? 'var(--accent)' : isMid ? (cur.feasible ? 'var(--easy)' : 'var(--hard)') : 'var(--border)'} strokeWidth={1.6} />
                <text x={x} y={lineY + 24} className="bsa-tick">{v}</text>
              </g>
            );
          })}

          {/* pointers */}
          {['lo', 'hi'].map((p) => {
            const v = cur[p];
            if (v < 1 || v > hiMax) return null;
            const x = xOf(v);
            return (
              <g key={p}>
                <text x={x} y={lineY - 26} className="bsa-ptr">{p}</text>
                <path d={`M ${x} ${lineY - 12} l -5 -9 l 10 0 z`} fill="var(--accent)" />
              </g>
            );
          })}
          {cur.mid > 0 && (
            <text x={xOf(cur.mid)} y={lineY + 44} className="bsa-mid" style={{ fill: cur.feasible ? 'var(--easy)' : 'var(--hard)' }}>
              mid {cur.mid} · {cur.feasible ? 'feasible' : 'too slow'}
            </text>
          )}
          <text x={lineLeft} y={lineY - 44} className="bsa-zone bsa-zone-no">infeasible →</text>
          <text x={lineRight} y={lineY - 44} className="bsa-zone bsa-zone-yes" textAnchor="end">← feasible</text>
        </svg>
      </div>

      <div className="bsa-trace">
        <span className="bsa-trace-label">trace</span>
        <span className="bsa-trace-body">{cur.note}</span>
      </div>
    </div>
  );
}
