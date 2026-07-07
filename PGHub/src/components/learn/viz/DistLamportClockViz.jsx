import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './DistLamportClockViz.css';

// Three processes on vertical timelines (time flows downward). Events reveal one
// per step, each stamped with its Lamport counter. A message carries the sender's
// timestamp; on receive the counter jumps to max(local, msg) + 1. All values are
// fixed constants derived from the rules -- there is no randomness anywhere.
const LANES = [
  { proc: 0, name: 'P1', x: 70 },
  { proc: 1, name: 'P2', x: 190 },
  { proc: 2, name: 'P3', x: 310 },
];

// id, process, row (vertical order), kind, Lamport value, and (for receives) the
// source event id whose timestamp the message carried.
const EVENTS = [
  { id: 0, proc: 0, row: 0, kind: 'local', L: 1, msg: null, note: 'P1 local event: increment to L = 1.' },
  { id: 1, proc: 0, row: 1, kind: 'send', L: 2, msg: null, note: 'P1 sends m1 (a send is an event): L = 2. The message carries timestamp 2.' },
  { id: 2, proc: 1, row: 2, kind: 'recv', L: 3, from: 1, note: 'P2 receives m1: L = max(0, 2) + 1 = 3. The max drags P2 past the sender.' },
  { id: 3, proc: 2, row: 3, kind: 'local', L: 1, msg: null, note: 'P3 local event, unrelated so far: L = 1.' },
  { id: 4, proc: 1, row: 4, kind: 'send', L: 4, msg: null, note: 'P2 sends m2: L = 4. The message carries timestamp 4.' },
  { id: 5, proc: 2, row: 5, kind: 'recv', L: 5, from: 4, note: 'P3 receives m2: L = max(1, 4) + 1 = 5. Now a -> b -> c is ordered.' },
  { id: 6, proc: 0, row: 6, kind: 'local', L: 3, msg: null, note: 'P1 local event: L = 3. Concurrent with P2 events — no message chain links them.' },
];

const W = 380;
const H = 320;
const laneX = (proc) => LANES[proc].x;
const rowY = (row) => 56 + row * 34;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function DistLamportClockViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = EVENTS.length - 1;
  const safeStep = Math.min(step, total);
  const cur = EVENTS[safeStep];

  // Current Lamport counter per process = max L of that process's revealed events.
  const counters = useMemo(() => {
    const c = [0, 0, 0];
    for (let i = 0; i <= safeStep; i += 1) {
      const e = EVENTS[i];
      if (e.L > c[e.proc]) c[e.proc] = e.L;
    }
    return c;
  }, [safeStep]);

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }
  function reset() { setStep(0); setPlaying(false); }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 380 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  return (
    <div className="dlc">
      <div className="dlc-head">
        <div className="dlc-head-icon"><Clock size={18} /></div>
        <div className="dlc-head-text">
          <h3 className="dlc-title">Lamport clocks order events without a global clock</h3>
          <p className="dlc-sub">
            Time flows downward on three timelines. Each event increments a counter; a message carries
            its sender&apos;s stamp, and on receipt the counter jumps to max(local, message) + 1 — so cause
            always gets a smaller number than effect.
          </p>
        </div>
        <button type="button" className="dlc-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dlc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dlc-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="dlc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="dlc-arrow-head" />
            </marker>
            <filter id="dlc-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* process timelines */}
          {LANES.map((ln) => (
            <g key={ln.name} className="dlc-lane">
              <line x1={ln.x} y1={40} x2={ln.x} y2={H - 24} className="dlc-timeline" />
              <text x={ln.x} y={28} className="dlc-lane-name" textAnchor="middle">{ln.name}</text>
            </g>
          ))}

          {/* message arrows for revealed receive events */}
          {EVENTS.slice(0, safeStep + 1).filter((e) => e.kind === 'recv').map((e) => {
            const src = EVENTS[e.from];
            return (
              <line
                key={`m-${e.id}`}
                x1={laneX(src.proc)} y1={rowY(src.row)}
                x2={laneX(e.proc)} y2={rowY(e.row)}
                className="dlc-msg" markerEnd="url(#dlc-arrow)"
              />
            );
          })}

          {/* events */}
          {EVENTS.slice(0, safeStep + 1).map((e) => {
            const active = e.id === safeStep;
            return (
              <g key={e.id} className={`dlc-event is-${e.kind}${active ? ' is-active' : ''}`}>
                <circle cx={laneX(e.proc)} cy={rowY(e.row)} r={12} className="dlc-event-dot" filter={active ? 'url(#dlc-glow)' : undefined} />
                <text x={laneX(e.proc)} y={rowY(e.row) + 4} className="dlc-event-l" textAnchor="middle">{e.L}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dlc-controls">
        <button type="button" className="dlc-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="dlc-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={safeStep >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="dlc-speed">
          <Gauge size={13} />
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="dlc-speed-range" />
          <span className="dlc-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="dlc-progress">{safeStep} / {total}</span>
      </div>

      <div className="dlc-readout">
        <div className="dlc-stat is-p1">
          <span className="dlc-stat-label">P1 clock</span>
          <span className="dlc-stat-val">{counters[0]}</span>
        </div>
        <div className="dlc-stat is-p2">
          <span className="dlc-stat-label">P2 clock</span>
          <span className="dlc-stat-val">{counters[1]}</span>
        </div>
        <div className="dlc-stat is-p3">
          <span className="dlc-stat-label">P3 clock</span>
          <span className="dlc-stat-val">{counters[2]}</span>
        </div>
      </div>

      <div className="dlc-note">
        <span className="dlc-note-label">now</span>
        <span className="dlc-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
