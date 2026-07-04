import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Layers, ShieldCheck, XCircle, Zap, AlertTriangle, ArrowUp,
  Play, Pause, SkipForward, RotateCcw,
} from 'lucide-react';
import './PyExceptionViz.css';

const CAUGHT_STEPS = [
  {
    active: -1, status: 'live', op: 'stack built',
    states: ['idle', 'idle', 'idle', 'idle'],
    note: 'main() called checkout(), which called process(), which called withdraw(). The newest frame, withdraw(), sits deepest — at the bottom of the stack.',
  },
  {
    active: 3, status: 'searching', op: 'raise WithdrawalError',
    states: ['idle', 'idle', 'idle', 'raising'],
    note: 'withdraw() gets an invalid amount and raises WithdrawalError. Normal execution halts; Python now searches up the stack for a matching except.',
  },
  {
    active: 2, status: 'searching', op: 'process(): no handler',
    states: ['idle', 'idle', 'passing', 'popped'],
    note: 'process() has no try/except, so the exception passes straight through. That frame is popped and the search moves one level up.',
  },
  {
    active: 1, status: 'caught', op: 'except WithdrawalError: match',
    states: ['idle', 'caught', 'popped', 'popped'],
    note: 'checkout() wraps the call in try / except WithdrawalError. The raised type matches the handler, so it is caught here — unwinding stops.',
  },
  {
    active: 0, status: 'caught', op: 'main() resumes',
    states: ['resumed', 'caught', 'popped', 'popped'],
    note: 'The except block runs its recovery code and execution continues normally. main() never sees the error — the program does not crash.',
  },
];

const PROPAGATE_STEPS = [
  {
    active: -1, status: 'live', op: 'stack built',
    states: ['idle', 'idle', 'idle', 'idle'],
    note: 'main() called run(), which called load_config(), which called read_value(). read_value() is the deepest, newest frame.',
  },
  {
    active: 3, status: 'searching', op: 'raise ValueError',
    states: ['idle', 'idle', 'idle', 'raising'],
    note: 'read_value() raises ValueError. The search for a handler begins, climbing the stack frame by frame.',
  },
  {
    active: 2, status: 'searching', op: 'except KeyError: no match',
    states: ['idle', 'idle', 'mismatch', 'popped'],
    note: 'load_config() does have a handler — but it catches KeyError, and this is a ValueError. The types do not match, so it is NOT caught. The search continues upward.',
  },
  {
    active: 1, status: 'searching', op: 'run(): no handler',
    states: ['idle', 'passing', 'popped', 'popped'],
    note: 'run() has no try/except. The exception passes through and that frame is popped too.',
  },
  {
    active: 0, status: 'uncaught', op: 'top reached: traceback',
    states: ['crash', 'popped', 'popped', 'popped'],
    note: 'main() has no handler either. The exception reaches the top of the stack uncaught — Python prints a traceback and the program exits.',
  },
];

const SCENARIOS = [
  {
    id: 'caught', label: 'caught', Icon: ShieldCheck,
    raised: 'WithdrawalError',
    frames: [
      { name: 'main()', handler: 'no handler' },
      { name: 'checkout()', handler: 'except WithdrawalError' },
      { name: 'process()', handler: 'no handler' },
      { name: 'withdraw()', handler: 'raises here' },
    ],
    steps: CAUGHT_STEPS,
  },
  {
    id: 'propagates', label: 'propagates', Icon: XCircle,
    raised: 'ValueError',
    frames: [
      { name: 'main()', handler: 'no handler' },
      { name: 'run()', handler: 'no handler' },
      { name: 'load_config()', handler: 'except KeyError' },
      { name: 'read_value()', handler: 'raises here' },
    ],
    steps: PROPAGATE_STEPS,
  },
];

const W = 560;
const H = 300;
const FX = 178;
const FW = 332;
const FRAME_H = 48;
const ROW = 60;
const START_Y = 44;
const ARROW_X = 138;
const LABEL_X = 160;

function frameY(i) {
  return START_Y + i * ROW;
}

const STATUS_LABEL = {
  live: 'live',
  searching: 'searching up the stack',
  caught: 'caught — recovered',
  uncaught: 'uncaught — traceback',
};

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PyExceptionViz() {
  const [scenId, setScenId] = useState('caught');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const active = useMemo(() => SCENARIOS.find((s) => s.id === scenId), [scenId]);
  const steps = active.steps;
  const total = steps.length;
  const cur = steps[Math.min(step, total - 1)];
  const finished = step >= total - 1;
  const ActiveIcon = active.Icon;

  function pickScenario(id) {
    setScenId(id);
    setStep(0);
    setPlaying(false);
  }

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total - 1) return undefined;
    timer.current = setTimeout(() => {
      setStep((s) => {
        const next = Math.min(total - 1, s + 1);
        if (next >= total - 1) setPlaying(false);
        return next;
      });
    }, Math.round((reduced() ? 560 : 1250) / speed));
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const curFrameName = cur.active >= 0 ? active.frames[cur.active].name : '—';
  const pillState = cur.active >= 0 ? cur.states[cur.active] : 'idle';
  const showPill = cur.active >= 0;
  const pillY = cur.active >= 0 ? frameY(cur.active) + FRAME_H / 2 : 0;

  return (
    <div className={`pyexc is-${scenId}`}>
      <div className="pyexc-head">
        <div className="pyexc-head-icon"><Layers size={18} /></div>
        <div className="pyexc-head-text">
          <h3 className="pyexc-title">Exception propagation — unwinding the call stack</h3>
          <p className="pyexc-sub">
            A raise climbs from the deepest frame upward until an except matches its type — or reaches the top uncaught.
          </p>
        </div>
      </div>

      <div className="pyexc-chips">
        <span className="pyexc-chips-label">scenario</span>
        {SCENARIOS.map((s) => {
          const ChipIcon = s.Icon;
          return (
            <button
              key={s.id}
              type="button"
              className={`pyexc-chip is-${s.id}${s.id === scenId ? ' is-active' : ''}`}
              onClick={() => pickScenario(s.id)}
            >
              <ChipIcon size={14} /> {s.label}
            </button>
          );
        })}
      </div>

      <div className="pyexc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pyexc-svg" preserveAspectRatio="xMidYMid meet">
          <text x={FX} y={26} className="pyexc-edge-label">top of stack</text>
          <text x={FX + FW} y={H - 8} className="pyexc-edge-label" textAnchor="end">deepest call (newest)</text>

          {/* unwind direction arrow */}
          <line x1={ARROW_X} y1={frameY(3) + 6} x2={ARROW_X} y2={frameY(0) + FRAME_H - 6}
            className="pyexc-gutter-line" />
          <polygon
            points={`${ARROW_X - 5},${frameY(0) + FRAME_H - 6} ${ARROW_X + 5},${frameY(0) + FRAME_H - 6} ${ARROW_X},${frameY(0) + FRAME_H - 14}`}
            className="pyexc-gutter-head"
          />
          <text x={LABEL_X} y={(frameY(0) + frameY(3)) / 2 + FRAME_H / 2}
            className="pyexc-gutter-label" textAnchor="middle"
            transform={`rotate(-90 ${LABEL_X} ${(frameY(0) + frameY(3)) / 2 + FRAME_H / 2})`}>
            exception unwinds
          </text>

          {/* frames */}
          {active.frames.map((f, i) => {
            const y = frameY(i);
            const st = cur.states[i];
            const isActive = i === cur.active;
            return (
              <g key={f.name} className={`pyexc-frame is-${st}${isActive ? ' is-active' : ''}`}>
                <rect x={FX} y={y} width={FW} height={FRAME_H} rx={9} className="pyexc-frame-box" />
                <text x={FX + 16} y={y + FRAME_H / 2 + 5} className="pyexc-frame-name">{f.name}</text>
                <text x={FX + FW - 16} y={y + FRAME_H / 2 + 5} className="pyexc-frame-handler" textAnchor="end">
                  {f.handler}
                </text>
              </g>
            );
          })}

          {/* exception token, aligned with the active frame */}
          {showPill && (
            <g className={`pyexc-pill is-${pillState}`}>
              <line x1={18 + 122} y1={pillY} x2={FX} y2={pillY} className="pyexc-pill-link" />
              <rect x={18} y={pillY - 15} width={122} height={30} rx={8} className="pyexc-pill-box" />
              <text x={18 + 61} y={pillY + 4} className="pyexc-pill-text" textAnchor="middle">
                {active.raised}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="pyexc-controls">
        <button type="button" className="pyexc-btn" onClick={togglePlay}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="pyexc-btn"
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> Step
        </button>
        <button
          type="button"
          className="pyexc-btn"
          onClick={() => { setStep(0); setPlaying(false); }}
        >
          <RotateCcw size={14} /> Reset
        </button>
        <label className="pyexc-speed">
          <span className="pyexc-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="pyexc-speed-range"
          />
          <span className="pyexc-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="pyexc-progress">{step + 1} / {total} steps</span>
      </div>

      <div className="pyexc-readout">
        <div className="pyexc-stat is-raised">
          <Zap size={13} />
          <span className="pyexc-stat-label">raised</span>
          <span className="pyexc-stat-val">{active.raised}</span>
        </div>
        <div className="pyexc-stat is-frame">
          <ArrowUp size={13} />
          <span className="pyexc-stat-label">at frame</span>
          <span className="pyexc-stat-val">{curFrameName}</span>
        </div>
        <div className={`pyexc-stat is-status is-${cur.status}`}>
          {cur.status === 'caught' ? <ShieldCheck size={13} />
            : cur.status === 'uncaught' ? <XCircle size={13} />
            : cur.status === 'searching' ? <AlertTriangle size={13} />
            : <Layers size={13} />}
          <span className="pyexc-stat-label">status</span>
          <span className="pyexc-stat-val">{STATUS_LABEL[cur.status]}</span>
        </div>
      </div>

      <div className="pyexc-note">
        <span className="pyexc-note-label">now</span>
        <span className="pyexc-note-body"><span className="pyexc-note-op">{cur.op}</span> — {cur.note}</span>
      </div>
    </div>
  );
}
