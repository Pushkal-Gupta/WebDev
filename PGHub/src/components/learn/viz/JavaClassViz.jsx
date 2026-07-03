import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Boxes, Play, Pause, SkipForward, RotateCcw, Copy, Hash } from 'lucide-react';
import './JavaClassViz.css';

const INSTANCES = [
  {
    code: 'new BankAccount("Alice", 100)',
    name: 'Alice',
    balance: '100.0',
    hue: 'sky',
    note: 'new BankAccount("Alice", 100) stamps a fresh object from the blueprint. Its OWN name and balance are set via this.name = name; the shared static count clicks up to 1.',
  },
  {
    code: 'new BankAccount("Bob", 50)',
    name: 'Bob',
    balance: '50.0',
    hue: 'violet',
    note: 'A second stamp. Bob owns a SEPARATE name/balance box — changing Bob never touches Alice. The one static count on the class becomes 2.',
  },
  {
    code: 'new BankAccount("Cara", 75)',
    name: 'Cara',
    balance: '75.0',
    hue: 'pink',
    note: 'A third instance, its own state again. All three objects share the SINGLE static count on the class, now 3 — that counter lives on the cutter, not any cookie.',
  },
];

const HUE_CLASS = { sky: 'is-sky', violet: 'is-violet', pink: 'is-pink' };

const W = 760;
const H = 320;
const CLASS_X = 40;
const CLASS_Y = 60;
const CLASS_W = 230;
const CLASS_H = 150;
const STATIC_Y = 250;
const INST_X0 = 320;
const INST_Y = 90;
const INST_W = 128;
const INST_H = 130;
const INST_GAP = 18;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function JavaClassViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = INSTANCES.length;
  const finished = step >= total;
  const showPause = playing && step < total;

  const cur = step > 0 ? INSTANCES[step - 1] : null;
  const placed = useMemo(() => INSTANCES.slice(0, step), [step]);

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    const base = reduced() ? 400 : 1400;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), base / speed);
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const noteText = cur
    ? cur.note
    : 'The class is the cookie-cutter — a shape with no data. Press Step or Play to stamp objects, each with its own field values, while the static count on the class ticks up.';
  const codeLine = cur ? cur.code : 'class BankAccount { String name; double balance; static int count; }';

  return (
    <div className="javaclass">
      <div className="javaclass-head">
        <div className="javaclass-head-icon"><Boxes size={18} /></div>
        <div className="javaclass-head-text">
          <h3 className="javaclass-title">One blueprint, many objects</h3>
          <p className="javaclass-sub">
            A class is the cookie-cutter; each <code>new</code> stamps an object with its own field
            values. The <code>static count</code> lives on the class and is shared by every instance.
          </p>
        </div>
        <button type="button" className="javaclass-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="javaclass-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="javaclass-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="javaclass-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M1,1 L8,4.5 L1,8 Z" className="javaclass-arrowfill" />
            </marker>
            <linearGradient id="javaclass-classgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="javaclass-classstop-a" />
              <stop offset="100%" className="javaclass-classstop-b" />
            </linearGradient>
          </defs>

          {/* class blueprint box */}
          <g className="javaclass-blueprint">
            <rect
              x={CLASS_X}
              y={CLASS_Y}
              width={CLASS_W}
              height={CLASS_H}
              rx={12}
              className="javaclass-classbox"
              fill="url(#javaclass-classgrad)"
            />
            <text x={CLASS_X + 14} y={CLASS_Y + 26} className="javaclass-classname">class BankAccount</text>
            <line x1={CLASS_X} y1={CLASS_Y + 38} x2={CLASS_X + CLASS_W} y2={CLASS_Y + 38} className="javaclass-divider" />
            <text x={CLASS_X + 14} y={CLASS_Y + 62} className="javaclass-fieldrow">name : String</text>
            <text x={CLASS_X + 14} y={CLASS_Y + 86} className="javaclass-fieldrow">balance : double</text>
            <text x={CLASS_X + 14} y={CLASS_Y + 116} className="javaclass-blueprint-tag">blueprint · no values</text>
          </g>

          {/* static counter tied to the class */}
          <g className="javaclass-static">
            <rect x={CLASS_X + 40} y={STATIC_Y} width={CLASS_W - 80} height={44} rx={9} className="javaclass-staticbox" />
            <line
              x1={CLASS_X + CLASS_W / 2}
              y1={CLASS_Y + CLASS_H}
              x2={CLASS_X + CLASS_W / 2}
              y2={STATIC_Y}
              className="javaclass-staticlink"
              markerEnd="url(#javaclass-arrow)"
            />
            <text x={CLASS_X + CLASS_W / 2} y={STATIC_Y + 18} className="javaclass-staticlabel" textAnchor="middle">
              static count
            </text>
            <text x={CLASS_X + CLASS_W / 2} y={STATIC_Y + 36} className="javaclass-staticval" textAnchor="middle">
              {step}
            </text>
          </g>

          {/* instances stamped from the blueprint */}
          {placed.map((inst, i) => {
            const x = INST_X0 + i * (INST_W + INST_GAP);
            const isNew = i === step - 1;
            return (
              <g key={inst.name} className={`javaclass-inst ${HUE_CLASS[inst.hue]}${isNew ? ' is-new' : ''}`}>
                <line
                  x1={CLASS_X + CLASS_W}
                  y1={CLASS_Y + 30}
                  x2={x}
                  y2={INST_Y + 20}
                  className="javaclass-stamplink"
                  markerEnd="url(#javaclass-arrow)"
                />
                <rect x={x} y={INST_Y} width={INST_W} height={INST_H} rx={11} className="javaclass-instbox" />
                <text x={x + INST_W / 2} y={INST_Y + 24} className="javaclass-insttitle" textAnchor="middle">object</text>
                <line x1={x + 10} y1={INST_Y + 34} x2={x + INST_W - 10} y2={INST_Y + 34} className="javaclass-divider" />
                <text x={x + 12} y={INST_Y + 58} className="javaclass-instkey">name</text>
                <text x={x + INST_W - 12} y={INST_Y + 58} className="javaclass-instval" textAnchor="end">{inst.name}</text>
                <text x={x + 12} y={INST_Y + 86} className="javaclass-instkey">balance</text>
                <text x={x + INST_W - 12} y={INST_Y + 86} className="javaclass-instval" textAnchor="end">{inst.balance}</text>
                <text x={x + INST_W / 2} y={INST_Y + 116} className="javaclass-insttag" textAnchor="middle">own copy</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="javaclass-controls">
        <button type="button" className="javaclass-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="javaclass-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="javaclass-speed">
          <span className="javaclass-speed-key">speed</span>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="javaclass-speed-range"
          />
          <span className="javaclass-speed-val">{speed}x</span>
        </label>
        <span className="javaclass-progress">{step} / {total}</span>
      </div>

      <div className="javaclass-readout">
        <div className={`javaclass-stat ${cur ? HUE_CLASS[cur.hue] : 'is-empty'}`}>
          <Copy size={13} className="javaclass-stat-icon" />
          <span className="javaclass-stat-key">this object</span>
          <span className="javaclass-stat-val">{cur ? cur.name : '—'}</span>
        </div>
        <div className={`javaclass-stat ${cur ? HUE_CLASS[cur.hue] : 'is-empty'}`}>
          <span className="javaclass-stat-key">this.balance</span>
          <span className="javaclass-stat-val">{cur ? cur.balance : '—'}</span>
        </div>
        <div className="javaclass-stat is-shared">
          <Hash size={13} className="javaclass-stat-icon" />
          <span className="javaclass-stat-key">static count</span>
          <span className="javaclass-stat-val">{step} (shared)</span>
        </div>
      </div>

      <div className="javaclass-code">
        <span className="javaclass-code-label">now</span>
        <code className="javaclass-code-line">{codeLine}</code>
      </div>

      <div className="javaclass-note">
        <span className="javaclass-note-label">what happened</span>
        <span className="javaclass-note-body">{noteText}</span>
      </div>
    </div>
  );
}
