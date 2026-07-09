import React, { useMemo, useState, useEffect, useRef } from 'react';
import { FunctionSquare, Play, Pause, SkipForward, RotateCcw, Gauge, Zap, ShieldCheck } from 'lucide-react';
import './FpPureFunctionViz.css';

// Deterministic purity demo. Every call passes the SAME input (x = 3).
// pure double(x) = x*2 -> always 6 (referentially transparent).
// impure tick(x) reads+mutates an external counter -> output drifts.
const X = 3;
const CALLS = [0, 1, 2, 3]; // four identical calls
const PURE_OUT = X * 2; // 6, constant
// impure: state starts at 0, each call increments it, out = x*2 + state.
const IMPURE = CALLS.map((_, i) => ({ state: i + 1, out: X * 2 + (i + 1) }));

const W = 470;
const H = 360;
const ROW_H = 60;
const TOP = 92;

const COLS = [
  { key: 'input', label: 'input', x: 24, w: 96 },
  { key: 'pure', label: 'pure  x*2', x: 128, w: 108 },
  { key: 'impure', label: 'impure  x*2+state', x: 244, w: 128 },
  { key: 'state', label: 'ext state', x: 380, w: 66 },
];

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function FpPureFunctionViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = CALLS.length - 1;

  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 440 : 1050) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const cur = IMPURE[step];
  const drift = cur.out - PURE_OUT;

  const rowState = useMemo(() => (i) => {
    if (i > step) return 'pending';
    if (i === step) return 'active';
    return 'done';
  }, [step]);

  return (
    <div className="fppf">
      <div className="fppf-head">
        <div className="fppf-head-icon"><FunctionSquare size={18} /></div>
        <div className="fppf-head-text">
          <h3 className="fppf-title">Pure vs impure: same input, same output?</h3>
          <p className="fppf-sub">
            Every call passes the same input <code>double(3)</code>. The pure column never
            changes; the impure one reads a mutable counter, so its result drifts each call.
          </p>
        </div>
        <button type="button" className="fppf-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="fppf-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fppf-svg" preserveAspectRatio="xMidYMid meet">
          {/* column headers */}
          {COLS.map((c) => (
            <text key={c.key} x={c.x + c.w / 2} y={40} className="fppf-colhead" textAnchor="middle">{c.label}</text>
          ))}
          <line x1={16} y1={54} x2={W - 16} y2={54} className="fppf-rule" />

          {CALLS.map((_, i) => {
            const st = rowState(i);
            const y = TOP + i * ROW_H;
            const im = IMPURE[i];
            const same = st !== 'pending';
            return (
              <g key={i} className={`fppf-row is-${st}`}>
                {/* input cell */}
                <g className="fppf-cell is-input">
                  <rect x={COLS[0].x} y={y} width={COLS[0].w} height={44} rx={9} className="fppf-cell-box" />
                  <text x={COLS[0].x + COLS[0].w / 2} y={y + 27} className="fppf-cell-val" textAnchor="middle">
                    {same ? `x = ${X}` : '—'}
                  </text>
                </g>
                {/* pure cell */}
                <g className="fppf-cell is-pure">
                  <rect x={COLS[1].x} y={y} width={COLS[1].w} height={44} rx={9} className="fppf-cell-box" />
                  <text x={COLS[1].x + COLS[1].w / 2} y={y + 27} className="fppf-cell-val" textAnchor="middle">
                    {same ? PURE_OUT : '·'}
                  </text>
                </g>
                {/* impure cell */}
                <g className="fppf-cell is-impure">
                  <rect x={COLS[2].x} y={y} width={COLS[2].w} height={44} rx={9} className="fppf-cell-box" />
                  <text x={COLS[2].x + COLS[2].w / 2} y={y + 27} className="fppf-cell-val" textAnchor="middle">
                    {same ? im.out : '·'}
                  </text>
                </g>
                {/* external state cell (the side effect) */}
                <g className="fppf-cell is-state">
                  <rect x={COLS[3].x} y={y} width={COLS[3].w} height={44} rx={9} className="fppf-cell-box" />
                  <text x={COLS[3].x + COLS[3].w / 2} y={y + 27} className="fppf-cell-val" textAnchor="middle">
                    {same ? im.state : '·'}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="fppf-controls">
        <button type="button" className="fppf-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="fppf-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="fppf-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="fppf-speed-range"
          />
          <span className="fppf-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="fppf-progress">call {step + 1} / {total + 1}</span>
      </div>

      <div className="fppf-readout">
        <div className="fppf-stat is-pure">
          <ShieldCheck size={15} />
          <span className="fppf-stat-label">pure output</span>
          <span className="fppf-stat-val">{PURE_OUT}</span>
        </div>
        <div className="fppf-stat is-impure">
          <Zap size={15} />
          <span className="fppf-stat-label">impure output</span>
          <span className="fppf-stat-val">{cur.out}</span>
        </div>
        <div className="fppf-stat is-drift">
          <span className="fppf-stat-label">drift from pure</span>
          <span className="fppf-stat-val">+{drift}</span>
        </div>
      </div>

      <div className="fppf-note">
        <span className="fppf-note-label">now</span>
        <span className="fppf-note-body">
          Call {step + 1}: <em>pure</em> returns {PURE_OUT} exactly as it did on call 1 —
          you can replace <code>double(3)</code> with <code>6</code> anywhere. The <em>impure</em>
          call returns {cur.out}: it read and bumped the external counter to {cur.state}, so the
          <span className="fppf-note-eg"> same input no longer gives the same answer</span>.
        </span>
      </div>
    </div>
  );
}
