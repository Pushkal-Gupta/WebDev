import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Binary, Play, Pause, SkipForward, RotateCcw, Ruler, HardDrive } from 'lucide-react';
import './CppTypesViz.css';

const STEPS = [
  {
    code: "char c = 'A';",
    name: 'c',
    type: 'char',
    bytes: 1,
    value: "'A'",
    detail: 'code 65',
    hue: 'char',
    note: "A char claims exactly ONE byte on the shelf and stores the code 65 — narrow type, smallest box.",
  },
  {
    code: 'bool b = true;',
    name: 'b',
    type: 'bool',
    bytes: 1,
    value: 'true',
    detail: 'stored as 1',
    hue: 'bool',
    note: 'A bool is also ONE byte — it only needs true/false, so it sits in the next single cubby.',
  },
  {
    code: 'int n = 42;',
    name: 'n',
    type: 'int',
    bytes: 4,
    value: '42',
    detail: 'range +-2.1B',
    hue: 'int',
    note: 'An int claims a contiguous block of FOUR bytes — wide enough for ~2.1 billion either way.',
  },
  {
    code: 'double d = 3.14;',
    name: 'd',
    type: 'double',
    bytes: 8,
    value: '3.14',
    detail: '64-bit float',
    hue: 'double',
    note: 'A double claims EIGHT bytes — the widest box here. Compare its span to the 1-byte char.',
  },
];

const TOTAL_BYTES = STEPS.reduce((sum, s) => sum + s.bytes, 0); // 14
const OFFSETS = (() => {
  let acc = 0;
  return STEPS.map((s) => {
    const start = acc;
    acc += s.bytes;
    return start;
  });
})();

const HUE_CLASS = {
  char: 'is-char',
  bool: 'is-bool',
  int: 'is-int',
  double: 'is-double',
};

const W = 720;
const H = 300;
const STRIP_X = 40;
const STRIP_Y = 150;
const STRIP_H = 60;
const CELL = (W - STRIP_X * 2) / TOTAL_BYTES; // byte cell width

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CppTypesViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const total = STEPS.length;
  const finished = step >= total;
  const showPause = playing && step < total;

  const cur = step > 0 ? STEPS[step - 1] : null;
  const usedBytes = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < step; i += 1) acc += STEPS[i].bytes;
    return acc;
  }, [step]);

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), reduced() ? 320 : 1150);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const noteText = cur ? cur.note : 'press Step or Play to lay each typed variable into memory, one declaration at a time.';
  const codeLine = cur ? cur.code : "char c = 'A';";

  const placed = STEPS.slice(0, step);

  return (
    <div className="cpptypes">
      <div className="cpptypes-head">
        <div className="cpptypes-head-icon"><Binary size={18} /></div>
        <div className="cpptypes-head-text">
          <h3 className="cpptypes-title">Every type is a fixed-size box</h3>
          <p className="cpptypes-sub">
            In C++ each variable claims a known number of bytes on the memory shelf, decided at
            compile time. Watch a 1-byte char and an 8-byte double sit side by side.
          </p>
        </div>
        <button type="button" className="cpptypes-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="cpptypes-code">
        {STEPS.map((s, i) => (
          <span
            key={s.code}
            className={`cpptypes-code-line${i === step - 1 ? ' is-cur' : ''}${i < step - 1 ? ' is-done' : ''}`}
          >
            {s.code}
          </span>
        ))}
      </div>

      <div className="cpptypes-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cpptypes-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id="cpptypes-arrowhead"
              markerWidth="9"
              markerHeight="9"
              refX="7"
              refY="4.5"
              orient="auto"
            >
              <path d="M1,1 L8,4.5 L1,8 Z" className="cpptypes-arrowfill" />
            </marker>
            <linearGradient id="cpptypes-stripgrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" className="cpptypes-stripstop-a" />
              <stop offset="100%" className="cpptypes-stripstop-b" />
            </linearGradient>
          </defs>

          <text x={STRIP_X} y={36} className="cpptypes-axis">memory shelf — 1 cell = 1 byte</text>

          {/* empty byte-cell shelf as a backdrop */}
          {Array.from({ length: TOTAL_BYTES }, (_, i) => (
            <rect
              key={`cell-${i}`}
              x={STRIP_X + i * CELL}
              y={STRIP_Y}
              width={CELL}
              height={STRIP_H}
              className="cpptypes-cell"
            />
          ))}

          {/* byte-offset ruler under the shelf */}
          {Array.from({ length: TOTAL_BYTES + 1 }, (_, i) => (
            <text
              key={`tick-${i}`}
              x={STRIP_X + i * CELL}
              y={STRIP_Y + STRIP_H + 18}
              className="cpptypes-tick"
              textAnchor="middle"
            >
              {i}
            </text>
          ))}

          {/* placed typed boxes */}
          {placed.map((s, i) => {
            const x = STRIP_X + OFFSETS[i] * CELL;
            const w = s.bytes * CELL;
            const isNew = i === step - 1;
            return (
              <g key={`box-${s.name}`} className={`cpptypes-box ${HUE_CLASS[s.hue]}${isNew ? ' is-new' : ''}`}>
                <rect x={x + 2} y={STRIP_Y + 2} width={w - 4} height={STRIP_H - 4} rx={7} className="cpptypes-box-rect" />
                <text x={x + w / 2} y={STRIP_Y - 10} className="cpptypes-box-name" textAnchor="middle">
                  {s.name}
                </text>
                <text x={x + w / 2} y={STRIP_Y + STRIP_H / 2 - 2} className="cpptypes-box-val" textAnchor="middle">
                  {s.value}
                </text>
                <text x={x + w / 2} y={STRIP_Y + STRIP_H / 2 + 16} className="cpptypes-box-type" textAnchor="middle">
                  {s.type} · {s.bytes}B
                </text>
              </g>
            );
          })}

          {/* span bracket: 1-byte char vs 8-byte double, shown once both exist */}
          {step >= total && (
            <g className="cpptypes-span">
              <line
                x1={STRIP_X}
                y1={STRIP_Y - 40}
                x2={STRIP_X + CELL}
                y2={STRIP_Y - 40}
                className="cpptypes-span-line is-narrow"
                markerEnd="url(#cpptypes-arrowhead)"
              />
              <text x={STRIP_X + CELL + 6} y={STRIP_Y - 36} className="cpptypes-span-label is-narrow">1B char</text>
              <line
                x1={STRIP_X + OFFSETS[3] * CELL}
                y1={STRIP_Y - 40}
                x2={STRIP_X + (OFFSETS[3] + 8) * CELL}
                y2={STRIP_Y - 40}
                className="cpptypes-span-line is-wide"
                markerEnd="url(#cpptypes-arrowhead)"
              />
              <text x={STRIP_X + (OFFSETS[3] + 4) * CELL} y={STRIP_Y - 46} className="cpptypes-span-label is-wide" textAnchor="middle">
                8B double
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="cpptypes-controls">
        <button type="button" className="cpptypes-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="cpptypes-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <span className="cpptypes-progress">{step} / {total}</span>
        <code className="cpptypes-curline">{codeLine}</code>
      </div>

      <div className="cpptypes-readout">
        <div className={`cpptypes-stat ${cur ? HUE_CLASS[cur.hue] : 'is-empty'}`}>
          <span className="cpptypes-stat-key">type</span>
          <span className="cpptypes-stat-val">{cur ? cur.type : '—'}</span>
        </div>
        <div className={`cpptypes-stat ${cur ? HUE_CLASS[cur.hue] : 'is-empty'}`}>
          <Ruler size={13} className="cpptypes-stat-icon" />
          <span className="cpptypes-stat-key">size</span>
          <span className="cpptypes-stat-val">{cur ? `${cur.bytes} byte${cur.bytes === 1 ? '' : 's'}` : '—'}</span>
        </div>
        <div className={`cpptypes-stat ${cur ? HUE_CLASS[cur.hue] : 'is-empty'}`}>
          <span className="cpptypes-stat-key">value</span>
          <span className="cpptypes-stat-val">{cur ? `${cur.value} (${cur.detail})` : '—'}</span>
        </div>
        <div className="cpptypes-stat is-offset">
          <HardDrive size={13} className="cpptypes-stat-icon" />
          <span className="cpptypes-stat-key">bytes used</span>
          <span className="cpptypes-stat-val">{usedBytes} / {TOTAL_BYTES}</span>
        </div>
      </div>

      <div className="cpptypes-note">
        <span className="cpptypes-note-label">now</span>
        <span className="cpptypes-note-body">{noteText}</span>
      </div>
    </div>
  );
}
