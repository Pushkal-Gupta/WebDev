import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin, Play, Pause, SkipForward, RotateCcw, ArrowRight, AlertTriangle, Crosshair,
} from 'lucide-react';
import './CppPointerViz.css';

const ADDR = { x: '0x100', y: '0x200' };

// target: which value box p aims at | mode drives the highlight + arrow style
const STEPS = [
  {
    code: 'int x = 10;',
    show: { x: true, p: false, y: false },
    xVal: 10,
    yVal: 99,
    target: null,
    mode: 'create',
    note: 'A value 10 is born in a house at address 0x100. The name x labels that house.',
  },
  {
    code: 'int* p = &x;',
    show: { x: true, p: true, y: false },
    xVal: 10,
    yVal: 99,
    target: 'x',
    mode: 'address',
    note: '&x reads the address of x (0x100) and writes it onto p. p now POINTS AT x — the arrow appears.',
  },
  {
    code: '*p   // read',
    show: { x: true, p: true, y: false },
    xVal: 10,
    yVal: 99,
    target: 'x',
    mode: 'deref',
    note: '*p follows the address on p down to house 0x100 and reads the value living there: 10.',
  },
  {
    code: '*p = 20;',
    show: { x: true, p: true, y: false },
    xVal: 20,
    yVal: 99,
    target: 'x',
    mode: 'write',
    note: 'Writing *p = 20 walks the arrow to x and changes the house. x is now 20 — without naming x directly.',
  },
  {
    code: 'int y = 99;  p = &y;',
    show: { x: true, p: true, y: true },
    xVal: 20,
    yVal: 99,
    target: 'y',
    mode: 'repoint',
    note: 'A pointer can be re-aimed: p = &y erases the old address and stores y’s (0x200). The arrow swings to y.',
  },
  {
    code: '// y goes out of scope',
    show: { x: true, p: true, y: true },
    xVal: 20,
    yVal: 99,
    target: 'y',
    mode: 'dangle',
    note: 'y’s house is demolished but p still holds 0x200 — a DANGLING pointer. Following it now reads freed memory: undefined behaviour.',
  },
];

const W = 720;
const H = 320;

const P_BOX = { x: 40, y: 124, w: 168, h: 78 };
const X_BOX = { x: 484, y: 42, w: 196, h: 70 };
const Y_BOX = { x: 484, y: 196, w: 196, h: 70 };

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function targetBox(target) {
  return target === 'y' ? Y_BOX : X_BOX;
}

export default function CppPointerViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const total = STEPS.length;
  const finished = step >= total;
  const showPause = playing && step < total;

  const state = step > 0 ? STEPS[step - 1] : null;

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  const delay = Math.round((reduced() ? 400 : 1300) / speed);

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), delay);
    return () => clearTimeout(timer.current);
  }, [playing, step, total, delay]);

  const mode = state ? state.mode : 'idle';
  const target = state ? state.target : null;
  const show = state ? state.show : { x: false, p: false, y: false };
  const xVal = state ? state.xVal : 10;
  const yVal = state ? state.yVal : 99;
  const note = state ? state.note : 'Press Step or Play to follow a pointer through memory, line by line.';
  const codeLine = state ? state.code : 'int x = 10;';

  const dangling = mode === 'dangle';
  const pAddr = !show.p || !target ? '—' : (target === 'y' ? ADDR.y : ADDR.x);
  const derefVal = (() => {
    if (!show.p || !target) return '—';
    if (dangling) return '???';
    return target === 'y' ? yVal : xVal;
  })();

  // arrow geometry: from p right edge to current target box left edge
  const tb = targetBox(target);
  const ax1 = P_BOX.x + P_BOX.w + 4;
  const ay1 = P_BOX.y + P_BOX.h / 2;
  const ax2 = tb.x - 7;
  const ay2 = tb.y + tb.h / 2;
  const cmx = (ax1 + ax2) / 2;

  const arrowActive = mode === 'deref' || mode === 'write';

  return (
    <div className="cpptr">
      <div className="cpptr-head">
        <div className="cpptr-head-icon"><MapPin size={18} /></div>
        <div className="cpptr-head-text">
          <h3 className="cpptr-title">A pointer holds an address, not a value</h3>
          <p className="cpptr-sub">
            <code>&amp;x</code> reads where x lives; <code>*p</code> follows that address back to the
            value. A pointer can be re-aimed &mdash; and if its house is freed, it dangles.
          </p>
        </div>
        <button type="button" className="cpptr-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="cpptr-code">
        {STEPS.map((s, i) => (
          <span
            key={s.code}
            className={`cpptr-code-line${i === step - 1 ? ' is-cur' : ''}${i < step - 1 ? ' is-done' : ''}`}
          >
            {s.code}
          </span>
        ))}
      </div>

      <div className="cpptr-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cpptr-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="cpptr-arrowhead" markerWidth="10" markerHeight="10" refX="7" refY="4.5" orient="auto">
              <path d="M1,1 L8,4.5 L1,8 Z" className="cpptr-arrowfill" />
            </marker>
            <marker id="cpptr-arrowhead-warn" markerWidth="10" markerHeight="10" refX="7" refY="4.5" orient="auto">
              <path d="M1,1 L8,4.5 L1,8 Z" className="cpptr-arrowfill-warn" />
            </marker>
            <linearGradient id="cpptr-addrgrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" className="cpptr-grad-a" />
              <stop offset="100%" className="cpptr-grad-b" />
            </linearGradient>
          </defs>

          <text x={P_BOX.x} y={28} className="cpptr-axis">pointer</text>
          <text x={X_BOX.x} y={28} className="cpptr-axis">memory (houses)</text>

          {/* address -> value arrow */}
          {show.p && target && (
            <path
              d={`M${ax1},${ay1} C${cmx},${ay1} ${cmx},${ay2} ${ax2},${ay2}`}
              className={`cpptr-arrow${dangling ? ' is-dangle' : ''}${arrowActive ? ' is-active' : ''}`}
              markerEnd={`url(#cpptr-arrowhead${dangling ? '-warn' : ''})`}
              fill="none"
            />
          )}

          {/* pointer box p */}
          {show.p && (
            <g className={`cpptr-pbox${dangling ? ' is-dangle' : ''}`}>
              <rect x={P_BOX.x} y={P_BOX.y} width={P_BOX.w} height={P_BOX.h} rx={12} className="cpptr-pbox-rect" />
              <text x={P_BOX.x + 16} y={P_BOX.y + 26} className="cpptr-pbox-name">p</text>
              <text x={P_BOX.x + P_BOX.w - 14} y={P_BOX.y + 26} className="cpptr-pbox-tag" textAnchor="end">int*</text>
              <text x={P_BOX.x + 16} y={P_BOX.y + 56} className="cpptr-pbox-addr">{pAddr}</text>
              {dangling && (
                <g className="cpptr-pbox-warn">
                  <AlertTriangle size={13} x={P_BOX.x + P_BOX.w - 30} y={P_BOX.y + P_BOX.h - 24} />
                </g>
              )}
            </g>
          )}

          {/* value box x */}
          {show.x && (
            <g className={`cpptr-vbox is-x${mode === 'write' ? ' is-write' : ''}${(mode === 'deref' && target === 'x') ? ' is-read' : ''}`}>
              <rect x={X_BOX.x} y={X_BOX.y} width={X_BOX.w} height={X_BOX.h} rx={12} className="cpptr-vbox-rect" />
              <text x={X_BOX.x + 16} y={X_BOX.y + 28} className="cpptr-vbox-name">x</text>
              <text x={X_BOX.x + X_BOX.w - 14} y={X_BOX.y + 28} className="cpptr-vbox-addr" textAnchor="end">{ADDR.x}</text>
              <text x={X_BOX.x + 16} y={X_BOX.y + 56} className="cpptr-vbox-val">{xVal}</text>
            </g>
          )}

          {/* value box y */}
          {show.y && (
            <g className={`cpptr-vbox is-y${dangling ? ' is-freed' : ''}${(mode === 'repoint') ? ' is-read' : ''}`}>
              <rect x={Y_BOX.x} y={Y_BOX.y} width={Y_BOX.w} height={Y_BOX.h} rx={12} className="cpptr-vbox-rect" />
              <text x={Y_BOX.x + 16} y={Y_BOX.y + 28} className="cpptr-vbox-name">y</text>
              <text x={Y_BOX.x + Y_BOX.w - 14} y={Y_BOX.y + 28} className="cpptr-vbox-addr" textAnchor="end">{ADDR.y}</text>
              <text x={Y_BOX.x + 16} y={Y_BOX.y + 56} className="cpptr-vbox-val">{dangling ? 'freed' : yVal}</text>
            </g>
          )}
        </svg>
      </div>

      <div className="cpptr-controls">
        <button type="button" className="cpptr-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}
          {showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="cpptr-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="cpptr-speed">
          <span className="cpptr-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cpptr-speed-range"
          />
          <span className="cpptr-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="cpptr-progress">{step} / {total}</span>
        <code className="cpptr-curline">{codeLine}</code>
      </div>

      <div className="cpptr-readout">
        <div className="cpptr-stat is-addr">
          <span className="cpptr-stat-key">p</span>
          <ArrowRight size={13} className="cpptr-stat-arrow" />
          <span className="cpptr-stat-label">holds address</span>
          <span className="cpptr-stat-val">{pAddr}</span>
        </div>
        <div className={`cpptr-stat is-deref${dangling ? ' is-bad' : ''}`}>
          <Crosshair size={13} className="cpptr-stat-arrow" />
          <span className="cpptr-stat-key">*p</span>
          <span className="cpptr-stat-label">{dangling ? 'reads freed memory' : 'value at address'}</span>
          <span className="cpptr-stat-val">{derefVal}</span>
        </div>
        <div className="cpptr-stat is-x">
          <span className="cpptr-stat-key">x</span>
          <span className="cpptr-stat-label">house 0x100</span>
          <span className="cpptr-stat-val">{show.x ? xVal : '—'}</span>
        </div>
      </div>

      <div className={`cpptr-note${dangling ? ' is-warn' : ''}`}>
        <span className="cpptr-note-label">{dangling ? 'danger' : 'now'}</span>
        <span className="cpptr-note-body">{note}</span>
      </div>
    </div>
  );
}
