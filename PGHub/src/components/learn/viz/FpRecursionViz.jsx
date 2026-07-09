import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layers, Play, Pause, SkipForward, RotateCcw, Gauge, CornerDownRight, CornerUpLeft } from 'lucide-react';
import './FpRecursionViz.css';

// Deterministic factorial(4) call stack: push down to the base case, then unwind.
const N = 4;
const FACT = [1, 1, 2, 6, 24]; // FACT[n] = n!

// Build the frame timeline: push 4,3,2,1,0 then return 0,1,2,3,4.
const FRAMES = [];
for (let n = N; n >= 0; n -= 1) {
  FRAMES.push({ kind: 'push', n, minN: n, base: n === 0 });
}
for (let n = 0; n <= N; n += 1) {
  FRAMES.push({ kind: 'return', n, minN: n, ret: FACT[n] });
}
const TOTAL = FRAMES.length - 1;

const W = 460;
const H = 420;
const BOX_W = 210;
const BOX_H = 46;
const ROW_H = 62;
const TOP_Y = 30;
const BOX_X = (W - BOX_W) / 2;
const depthY = (n) => TOP_Y + (N - n) * ROW_H; // fact(4) on top, fact(0) at bottom

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function FpRecursionViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  function togglePlay() {
    if (step >= TOTAL) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= TOTAL) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(TOTAL, s + 1)),
      Math.round((reduced() ? 460 : 980) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, speed]);

  const frame = FRAMES[step];

  // returns known so far: after a return frame for n, FACT[n] is resolved.
  const view = useMemo(() => {
    const returned = {};
    for (let i = 0; i <= step; i += 1) {
      const f = FRAMES[i];
      if (f.kind === 'return') returned[f.n] = f.ret;
    }
    const present = [];
    for (let n = N; n >= frame.minN; n -= 1) present.push(n);
    const depth = present.length;
    const lastReturn = frame.kind === 'return' ? frame.ret : (Object.keys(returned).length
      ? returned[Math.max(...Object.keys(returned).map(Number))] : null);
    return { returned, present, depth, lastReturn };
  }, [step, frame]);

  const statusOf = (n) => {
    if (frame.kind === 'push') {
      if (n === frame.n) return frame.base ? 'base' : 'calling';
      return 'onstack';
    }
    // return frame
    if (n === frame.n) return 'returning';
    return 'onstack';
  };

  const note = frame.kind === 'push'
    ? (frame.base
      ? `fact(0) hits the base case and returns 1 immediately — no deeper call. The stack is at its deepest: ${view.depth} frames.`
      : `call fact(${frame.n}) — it needs fact(${frame.n - 1}) first, so a new frame is pushed and we recurse deeper.`)
    : `fact(${frame.n}) returns ${frame.n} * fact(${frame.n - 1 < 0 ? '' : frame.n - 1}) = ${frame.ret}. Its frame pops; the value flows back up to the caller.`;

  return (
    <div className="fprc">
      <div className="fprc-head">
        <div className="fprc-head-icon"><Layers size={18} /></div>
        <div className="fprc-head-text">
          <h3 className="fprc-title">The recursive call stack: factorial(4)</h3>
          <p className="fprc-sub">
            Each call pushes a frame and recurses deeper until the base case; then frames pop
            one by one, each multiplying the value returned from below.
          </p>
        </div>
        <button type="button" className="fprc-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="fprc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fprc-svg" preserveAspectRatio="xMidYMid meet">
          {/* stack frames, top = fact(4), bottom = fact(0) */}
          {Array.from({ length: N + 1 }, (_, k) => N - k).map((n) => {
            const present = view.present.includes(n);
            if (!present) return null;
            const st = statusOf(n);
            const y = depthY(n);
            const resolved = view.returned[n];
            return (
              <g key={n} className={`fprc-frame is-${st}`}>
                <rect x={BOX_X} y={y} width={BOX_W} height={BOX_H} rx={9} className="fprc-frame-box" />
                <text x={BOX_X + 16} y={y + 28} className="fprc-frame-call" textAnchor="start">fact({n})</text>
                <text x={BOX_X + BOX_W - 16} y={y + 28} className="fprc-frame-ret" textAnchor="end">
                  {resolved !== undefined ? `= ${resolved}` : (n === 0 ? 'base = 1' : `${n} * fact(${n - 1})`)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="fprc-controls">
        <button type="button" className="fprc-btn" onClick={togglePlay}>
          {playing && step < TOTAL ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < TOTAL ? 'Pause' : (step >= TOTAL ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="fprc-btn" onClick={() => setStep((s) => Math.min(TOTAL, s + 1))} disabled={step >= TOTAL}>
          <SkipForward size={14} /> Step
        </button>
        <label className="fprc-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="fprc-speed-range"
          />
          <span className="fprc-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="fprc-progress">{step + 1} / {TOTAL + 1}</span>
      </div>

      <div className="fprc-readout">
        <div className="fprc-stat is-phase">
          {frame.kind === 'push' ? <CornerDownRight size={15} /> : <CornerUpLeft size={15} />}
          <span className="fprc-stat-label">phase</span>
          <span className="fprc-stat-val">{frame.kind === 'push' ? 'descending' : 'unwinding'}</span>
        </div>
        <div className="fprc-stat is-depth">
          <span className="fprc-stat-label">stack depth</span>
          <span className="fprc-stat-val">{view.depth}</span>
        </div>
        <div className="fprc-stat is-ret">
          <span className="fprc-stat-label">last return</span>
          <span className="fprc-stat-val">{view.lastReturn === null ? '—' : view.lastReturn}</span>
        </div>
      </div>

      <div className="fprc-note">
        <span className="fprc-note-label">now</span>
        <span className="fprc-note-body">{note}</span>
      </div>
    </div>
  );
}
