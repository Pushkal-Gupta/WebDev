import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Variable, Play, Pause, SkipForward, RotateCcw, ArrowRight, Tag, Box } from 'lucide-react';
import './PyVariablesViz.css';

const VALUES = {
  v1: { id: 'v1', type: 'int', repr: '5', hue: 'int' },
  v2: { id: 'v2', type: 'str', repr: '"hi"', hue: 'str' },
  v3: { id: 'v3', type: 'str', repr: '"hi!"', hue: 'str' },
};

const STEPS = [
  {
    code: 'x = 5',
    bind: { x: 'v1' },
    note: 'A new int object 5 is created in memory; the name x becomes a label pinned to it.',
  },
  {
    code: 'y = x',
    bind: { x: 'v1', y: 'v1' },
    note: 'y = x copies the reference, not the value — two names now label the same int 5.',
  },
  {
    code: 'x = "hi"',
    bind: { x: 'v2', y: 'v1' },
    note: 'x is repointed to a fresh str object "hi" — its old int value is untouched, and y still labels 5.',
  },
  {
    code: 'x = x + "!"',
    bind: { x: 'v3', y: 'v1' },
    note: 'x + "!" builds a new str "hi!" — strings are immutable, so a new box is made and x repoints again.',
  },
];

const NAME_ORDER = ['x', 'y'];
const NAME_Y = { x: 118, y: 210 };
const BOX_SLOT = { v1: 56, v2: 140, v3: 224 };

const W = 720;
const H = 300;
const NAME_X = 50;
const NAME_W = 150;
const BOX_X = 470;
const BOX_W = 200;
const BOX_H = 56;

const HUE_CLASS = { int: 'is-int', str: 'is-str', bool: 'is-bool' };

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PyVariablesViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const total = STEPS.length;
  const finished = step >= total;
  const showPause = playing && step < total;

  const state = step > 0 ? STEPS[step - 1] : null;
  const bind = state ? state.bind : {};

  const createdByStep = useMemo(() => {
    const set = new Set();
    const out = [];
    STEPS.forEach((s) => {
      const ids = [];
      Object.values(s.bind).forEach((id) => {
        if (!set.has(id)) { set.add(id); ids.push(id); }
      });
      out.push(ids);
    });
    return out;
  }, []);

  const visibleBoxes = useMemo(() => {
    const ids = [];
    for (let i = 0; i < step; i += 1) ids.push(...createdByStep[i]);
    return ids;
  }, [step, createdByStep]);

  const createdThisStep = step > 0 ? createdByStep[step - 1] : [];

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), Math.round((reduced() ? 320 : 1100) / speed));
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const noteText = state ? state.note : 'press Step or Play to run the script line by line';
  const codeLine = state ? state.code : 'x = 5';

  const boxCenter = (id) => BOX_SLOT[id] + BOX_H / 2;

  return (
    <div className="pyvar">
      <div className="pyvar-head">
        <div className="pyvar-head-icon"><Variable size={18} /></div>
        <div className="pyvar-head-text">
          <h3 className="pyvar-title">A name is a label, not a box</h3>
          <p className="pyvar-sub">
            In Python a variable is a name tag pinned to a value object in memory. Assigning moves
            the tag &mdash; it never copies the value, and the same name can point to a new type later.
          </p>
        </div>
        <button type="button" className="pyvar-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="pyvar-code">
        {STEPS.map((s, i) => (
          <span
            key={s.code}
            className={`pyvar-code-line${i === step - 1 ? ' is-cur' : ''}${i < step - 1 ? ' is-done' : ''}`}
          >
            {s.code}
          </span>
        ))}
      </div>

      <div className="pyvar-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pyvar-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id="pyvar-arrowhead"
              markerWidth="9"
              markerHeight="9"
              refX="7"
              refY="4.5"
              orient="auto"
            >
              <path d="M1,1 L8,4.5 L1,8 Z" className="pyvar-arrowfill" />
            </marker>
            <linearGradient id="pyvar-trackgrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" className="pyvar-trackstop-a" />
              <stop offset="100%" className="pyvar-trackstop-b" />
            </linearGradient>
          </defs>

          <g className="pyvar-col-label">
            <Tag size={12} x={NAME_X} y={28} />
            <text x={NAME_X + 18} y={38} className="pyvar-axis">names</text>
          </g>
          <g className="pyvar-col-label">
            <Box size={12} x={BOX_X} y={28} />
            <text x={BOX_X + 18} y={38} className="pyvar-axis">memory</text>
          </g>

          {/* reference arrows: name -> current value box */}
          {NAME_ORDER.map((nm) => {
            const id = bind[nm];
            if (!id) return null;
            const y1 = NAME_Y[nm];
            const y2 = boxCenter(id);
            return (
              <path
                key={`arr-${nm}`}
                d={`M${NAME_X + NAME_W + 4},${y1} C${NAME_X + NAME_W + 90},${y1} ${BOX_X - 90},${y2} ${BOX_X - 6},${y2}`}
                className="pyvar-arrow"
                markerEnd="url(#pyvar-arrowhead)"
                fill="none"
              />
            );
          })}

          {/* name tags */}
          {NAME_ORDER.map((nm) => {
            const id = bind[nm];
            const val = id ? VALUES[id] : null;
            const live = Boolean(val);
            const hueCls = val ? HUE_CLASS[val.hue] : '';
            const y = NAME_Y[nm];
            return (
              <g key={`name-${nm}`} className={`pyvar-name ${live ? `is-live ${hueCls}` : 'is-empty'}`}>
                <rect x={NAME_X} y={y - 22} width={NAME_W} height={44} rx={10} className="pyvar-name-box" />
                <text x={NAME_X + 16} y={y + 5} className="pyvar-name-id">{nm}</text>
                <text x={NAME_X + NAME_W - 14} y={y - 2} className="pyvar-name-type" textAnchor="end">
                  {live ? val.type : '—'}
                </text>
                <text x={NAME_X + NAME_W - 14} y={y + 14} className="pyvar-name-val" textAnchor="end">
                  {live ? val.repr : 'unbound'}
                </text>
              </g>
            );
          })}

          {/* value boxes */}
          {visibleBoxes.map((id) => {
            const val = VALUES[id];
            const isNew = createdThisStep.includes(id);
            const refCount = NAME_ORDER.filter((nm) => bind[nm] === id).length;
            const y = BOX_SLOT[id];
            return (
              <g key={`box-${id}`} className={`pyvar-box ${HUE_CLASS[val.hue]}${isNew ? ' is-new' : ''}${refCount === 0 ? ' is-orphan' : ''}`}>
                <rect x={BOX_X} y={y} width={BOX_W} height={BOX_H} rx={11} className="pyvar-box-rect" />
                <text x={BOX_X + 16} y={y + 24} className="pyvar-box-val">{val.repr}</text>
                <text x={BOX_X + 16} y={y + 44} className="pyvar-box-type">{val.type}</text>
                <text x={BOX_X + BOX_W - 14} y={y + 24} className="pyvar-box-refs" textAnchor="end">
                  {refCount} ref{refCount === 1 ? '' : 's'}
                </text>
                {refCount === 0 && (
                  <text x={BOX_X + BOX_W - 14} y={y + 44} className="pyvar-box-gc" textAnchor="end">
                    no name &rarr; collectable
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="pyvar-controls">
        <button type="button" className="pyvar-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="pyvar-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="pyvar-speed">
          <span className="pyvar-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="pyvar-speed-range"
          />
          <span className="pyvar-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="pyvar-progress">{step} / {total}</span>
        <code className="pyvar-curline">{codeLine}</code>
      </div>

      <div className="pyvar-readout">
        {NAME_ORDER.map((nm) => {
          const id = bind[nm];
          const val = id ? VALUES[id] : null;
          const hueCls = val ? HUE_CLASS[val.hue] : 'is-empty';
          return (
            <div key={`stat-${nm}`} className={`pyvar-stat ${hueCls}`}>
              <span className="pyvar-stat-name">{nm}</span>
              <ArrowRight size={13} className="pyvar-stat-arrow" />
              <span className="pyvar-stat-type">{val ? val.type : 'unbound'}</span>
              <span className="pyvar-stat-val">{val ? val.repr : '—'}</span>
            </div>
          );
        })}
      </div>

      <div className="pyvar-note">
        <span className="pyvar-note-label">now</span>
        <span className="pyvar-note-body">{noteText}</span>
      </div>
    </div>
  );
}
