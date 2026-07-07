import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Waves, Play, Pause, SkipForward, RotateCcw, Gauge, Clock } from 'lucide-react';
import './DataStreamWindowViz.css';

// A stream of events on an event-time axis. A watermark sweeps left to right;
// windows fire once the watermark passes their end. Toggle tumbling (disjoint)
// vs sliding (overlapping) windows. One event is late: it arrives (processing
// time) long after it happened (event time), so its window may already be
// closed. Every value is fixed -- deterministic, no randomness.

const T_MAX = 16;

// eventTime = when it happened; procTime = when we saw it (late => procTime > eventTime).
const EVENTS = [
  { id: 'e1', t: 1, proc: 1 },
  { id: 'e2', t: 3, proc: 3 },
  { id: 'e3', t: 5, proc: 5 },
  { id: 'e4', t: 7, proc: 7 },
  { id: 'e5', t: 9, proc: 9 },
  { id: 'e6', t: 2, proc: 11, late: true },
  { id: 'e7', t: 12, proc: 12 },
  { id: 'e8', t: 14, proc: 14 },
];

const WINDOWS = {
  tumbling: [[0, 4], [4, 8], [8, 12], [12, 16]],
  sliding: [[0, 4], [2, 6], [4, 8], [6, 10], [8, 12], [10, 14], [12, 16]],
};

// Watermark positions the sweep rests at (event time), one per step.
const MARKS = [0, 2, 4, 6, 8, 10, 12, 14, 16];

function buildSteps(mode) {
  const wins = WINDOWS[mode];
  return MARKS.map((wm) => {
    // A window fires once the watermark passes its end.
    const fired = wins
      .map(([s, e], i) => ({ i, s, e }))
      .filter((w) => w.e <= wm)
      .map((w) => {
        // Count on-time events whose event-time falls in [s, e).
        const count = EVENTS.filter((ev) => !ev.late && ev.t >= w.s && ev.t < w.e).length;
        return { ...w, count };
      });
    // Late events that have arrived but whose window already closed = dropped.
    const droppedLate = EVENTS.filter((ev) => {
      if (!ev.late || ev.proc > wm) return false;
      const win = wins.find(([s, e]) => ev.t >= s && ev.t < e);
      return win && win[1] <= ev.proc;
    }).length;
    let action;
    if (wm === 0) {
      action = 'The watermark sits at t=0; no window is complete yet.';
    } else if (droppedLate > 0) {
      action = 'A late event arrived after its window had already fired on the watermark — it is dropped as too-late.';
    } else if (fired.length > 0) {
      action = `Watermark at t=${wm}: every window ending at or before it has fired and emitted its count.`;
    } else {
      action = `Watermark advances to t=${wm}; windows still open keep accumulating events.`;
    }
    return { wm, fired, droppedLate, action };
  });
}

const W = 452;
const H = 292;
const PAD_L = 30;
const AX_Y = 236;
const T_UNIT = (W - PAD_L - 26) / T_MAX;
const xOf = (t) => PAD_L + t * T_UNIT;
const ROW_TOP = 34;
const ROW_H = 15;
const ROW_GAP = 5;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function DataStreamWindowViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState('tumbling');
  const timer = useRef(null);

  const steps = useMemo(() => buildSteps(mode), [mode]);
  const total = steps.length - 1;
  const safeStep = Math.min(step, total);
  const cur = steps[safeStep];
  const wins = WINDOWS[mode];
  const firedIdx = new Set(cur.fired.map((f) => f.i));
  const firedCount = cur.fired.length;
  const totalEmitted = cur.fired.reduce((s, f) => s + f.count, 0);

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }
  function toggleMode() {
    setMode((m) => (m === 'tumbling' ? 'sliding' : 'tumbling'));
    setStep(0); setPlaying(false);
  }
  function reset() { setStep(0); setPlaying(false); }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 360 : 880) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  const wmX = xOf(cur.wm);

  return (
    <div className="dsw">
      <div className="dsw-head">
        <div className="dsw-head-icon"><Waves size={18} /></div>
        <div className="dsw-head-text">
          <h3 className="dsw-title">Windowing a stream by event time</h3>
          <p className="dsw-sub">
            Events sit on the event-time axis. The watermark sweeps right and fires each window it
            passes. Switch between tumbling (disjoint) and sliding (overlapping) windows, and watch
            the late event arrive after its window has already closed.
          </p>
        </div>
        <button type="button" className="dsw-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dsw-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dsw-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="dsw-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* window bands, one row each so overlap is visible in sliding mode */}
          {wins.map(([s, e], i) => {
            const y = ROW_TOP + i * (ROW_H + ROW_GAP);
            const done = firedIdx.has(i);
            const fired = cur.fired.find((f) => f.i === i);
            return (
              <g key={`w-${i}`} className={`dsw-win${done ? ' is-fired' : ''}`}>
                <rect x={xOf(s)} y={y} width={xOf(e) - xOf(s)} height={ROW_H} rx={5} className="dsw-win-box" />
                {done ? (
                  <text x={(xOf(s) + xOf(e)) / 2} y={y + ROW_H - 3} className="dsw-win-count" textAnchor="middle">
                    {fired ? fired.count : 0}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* time axis */}
          <line x1={PAD_L} y1={AX_Y} x2={xOf(T_MAX)} y2={AX_Y} className="dsw-axis" />
          {[0, 4, 8, 12, 16].map((t) => (
            <g key={`tick-${t}`}>
              <line x1={xOf(t)} y1={AX_Y - 3} x2={xOf(t)} y2={AX_Y + 3} className="dsw-tick" />
              <text x={xOf(t)} y={AX_Y + 16} className="dsw-tick-label" textAnchor="middle">{t}</text>
            </g>
          ))}
          <text x={xOf(T_MAX)} y={AX_Y + 16} className="dsw-axis-label" textAnchor="end">event time →</text>

          {/* watermark sweep */}
          <line x1={wmX} y1={ROW_TOP - 8} x2={wmX} y2={AX_Y + 4} className="dsw-wm" />
          <text x={wmX} y={ROW_TOP - 12} className="dsw-wm-label" textAnchor="middle">watermark</text>

          {/* events on the axis */}
          {EVENTS.map((ev) => {
            const arrived = ev.proc <= cur.wm;
            const droppedNow = ev.late && arrived
              && wins.find(([s, e]) => ev.t >= s && ev.t < e)?.[1] <= ev.proc;
            return (
              <g key={ev.id} className={`dsw-ev${ev.late ? ' is-late' : ''}${arrived ? ' is-seen' : ''}${droppedNow ? ' is-dropped' : ''}`}>
                {ev.late && arrived ? (
                  <path
                    d={`M ${xOf(ev.proc)} ${AX_Y - 4} Q ${(xOf(ev.proc) + xOf(ev.t)) / 2} ${AX_Y - 30} ${xOf(ev.t)} ${AX_Y - 4}`}
                    className="dsw-late-arc"
                    fill="none"
                  />
                ) : null}
                <circle cx={xOf(ev.t)} cy={AX_Y - 4} r={5} className="dsw-ev-dot" filter={arrived ? 'url(#dsw-glow)' : undefined} />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dsw-controls">
        <button type="button" className="dsw-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="dsw-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={safeStep >= total}>
          <SkipForward size={14} /> Step
        </button>
        <button type="button" className={`dsw-btn dsw-mode${mode === 'sliding' ? ' is-sliding' : ''}`} onClick={toggleMode}>
          <Clock size={14} /> {mode === 'tumbling' ? 'Tumbling' : 'Sliding'}
        </button>
        <label className="dsw-speed">
          <Gauge size={13} />
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="dsw-speed-range" />
          <span className="dsw-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="dsw-progress">{safeStep} / {total}</span>
      </div>

      <div className="dsw-readout">
        <div className="dsw-stat is-wm">
          <span className="dsw-stat-label">watermark</span>
          <span className="dsw-stat-val">t = {cur.wm}</span>
        </div>
        <div className="dsw-stat is-fired">
          <span className="dsw-stat-label">windows fired</span>
          <span className="dsw-stat-val">{firedCount} · {totalEmitted} ev</span>
        </div>
        <div className="dsw-stat is-late">
          <span className="dsw-stat-label">dropped late</span>
          <span className="dsw-stat-val">{cur.droppedLate}</span>
        </div>
      </div>

      <div className="dsw-note">
        <span className="dsw-note-label">now</span>
        <span className="dsw-note-body">{cur.action}</span>
      </div>
    </div>
  );
}
