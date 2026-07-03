import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Coffee, Play, Pause, SkipForward, RotateCcw, Box, Link2, Gauge } from 'lucide-react';
import './JavaTypesViz.css';

const STEPS = [
  {
    code: 'int n = 42;',
    slot: 'n',
    kind: 'primitive',
    type: 'int',
    held: '42',
    hue: 'int',
    note: 'A primitive: the value 42 sits DIRECTLY in the stack slot named n. No object, no arrow — the slot is the value.',
  },
  {
    code: 'double d = 3.14;',
    slot: 'd',
    kind: 'primitive',
    type: 'double',
    held: '3.14',
    hue: 'double',
    note: 'Another primitive. The 64-bit value 3.14 lives right inside the slot d — copied by value, never null.',
  },
  {
    code: 'boolean b = true;',
    slot: 'b',
    kind: 'primitive',
    type: 'boolean',
    held: 'true',
    hue: 'boolean',
    note: 'boolean is a primitive too — the slot b literally holds true. Compared with == as a value.',
  },
  {
    code: "char c = 'A';",
    slot: 'c',
    kind: 'primitive',
    type: 'char',
    held: "65 ('A')",
    hue: 'char',
    note: "A char is a primitive holding the code 65. Still a raw value in the slot, not an object.",
  },
  {
    code: 'String s = "hello";',
    slot: 's',
    kind: 'reference',
    type: 'String',
    held: 'ref',
    heapLabel: '"hello"',
    heapSub: 'String pool',
    hue: 'string',
    note: 'A reference: "hello" is a String OBJECT on the heap (in the String pool). The slot s holds only an arrow to it.',
  },
  {
    code: 'Integer x = n;',
    slot: 'x',
    kind: 'reference',
    type: 'Integer',
    held: 'ref',
    heapLabel: 'Integer { 42 }',
    heapSub: 'autoboxed',
    hue: 'boxed',
    note: 'Autoboxing: the int 42 is WRAPPED into an Integer object on the heap. The slot x holds an arrow to that box.',
  },
];

const HUE_CLASS = {
  int: 'is-int',
  double: 'is-double',
  boolean: 'is-boolean',
  char: 'is-char',
  string: 'is-string',
  boxed: 'is-boxed',
};

const W = 720;
const H = 340;
const SLOT_X = 34;
const SLOT_W = 250;
const SLOT_H = 34;
const SLOT_GAP = 8;
const SLOT_Y0 = 78;
const HEAP_X = 430;
const HEAP_W = 250;
const HEAP_H = 52;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function slotY(i) {
  return SLOT_Y0 + i * (SLOT_H + SLOT_GAP);
}

export default function JavaTypesViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = STEPS.length;
  const finished = step >= total;
  const showPause = playing && step < total;

  const cur = step > 0 ? STEPS[step - 1] : null;
  const placed = STEPS.slice(0, step);

  const heapItems = useMemo(
    () => placed.map((s, i) => ({ ...s, slotIndex: i })).filter((s) => s.kind === 'reference'),
    [placed],
  );

  const counts = useMemo(() => {
    let prim = 0;
    let ref = 0;
    for (let i = 0; i < step; i += 1) {
      if (STEPS[i].kind === 'primitive') prim += 1;
      else ref += 1;
    }
    return { prim, ref };
  }, [step]);

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    const base = reduced() ? 360 : 1250;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), base / speed);
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const noteText = cur
    ? cur.note
    : 'Press Step or Play. Primitives drop their value straight into a stack slot; references draw an arrow to a heap object.';
  const codeLine = cur ? cur.code : 'int n = 42;';

  return (
    <div className="javatypes">
      <div className="javatypes-head">
        <div className="javatypes-head-icon"><Coffee size={18} /></div>
        <div className="javatypes-head-text">
          <h3 className="javatypes-title">Primitives live in the slot; objects live on the heap</h3>
          <p className="javatypes-sub">
            A primitive stores its value directly in its stack slot. A reference stores only an
            arrow to an object on the heap. Watch autoboxing wrap an int into an Integer.
          </p>
        </div>
        <button type="button" className="javatypes-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="javatypes-code">
        {STEPS.map((s, i) => (
          <span
            key={s.code}
            className={`javatypes-code-line${i === step - 1 ? ' is-cur' : ''}${i < step - 1 ? ' is-done' : ''}`}
          >
            {s.code}
          </span>
        ))}
      </div>

      <div className="javatypes-stage">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="javatypes-svg">
          <defs>
            <marker
              id="javatypes-arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="7.5"
              refY="4.5"
              orient="auto"
            >
              <path d="M1,1 L8.5,4.5 L1,8 Z" className="javatypes-arrowfill" />
            </marker>
          </defs>

          <text x={SLOT_X} y={54} className="javatypes-region-label">STACK — slots hold the value</text>
          <text x={HEAP_X} y={54} className="javatypes-region-label">HEAP — objects live here</text>

          {/* stack column backdrop */}
          {STEPS.map((s, i) => (
            <rect
              key={`slotbg-${s.slot}`}
              x={SLOT_X}
              y={slotY(i)}
              width={SLOT_W}
              height={SLOT_H}
              rx={7}
              className="javatypes-slotbg"
            />
          ))}

          {/* arrows from reference slots to heap objects (drawn first, under the boxes) */}
          {heapItems.map((h, j) => {
            const sy = slotY(h.slotIndex) + SLOT_H / 2;
            const hy = 74 + j * (HEAP_H + 18) + HEAP_H / 2;
            return (
              <line
                key={`arrow-${h.slot}`}
                x1={SLOT_X + SLOT_W - 6}
                y1={sy}
                x2={HEAP_X - 4}
                y2={hy}
                className={`javatypes-arrow ${HUE_CLASS[h.hue]}${h.slotIndex === step - 1 ? ' is-new' : ''}`}
                markerEnd="url(#javatypes-arrowhead)"
              />
            );
          })}

          {/* placed stack slots */}
          {placed.map((s, i) => {
            const y = slotY(i);
            const isNew = i === step - 1;
            return (
              <g
                key={`slot-${s.slot}`}
                className={`javatypes-slot ${HUE_CLASS[s.hue]}${isNew ? ' is-new' : ''} is-${s.kind}`}
              >
                <rect x={SLOT_X} y={y} width={SLOT_W} height={SLOT_H} rx={7} className="javatypes-slot-rect" />
                <text x={SLOT_X + 12} y={y + SLOT_H / 2 + 4} className="javatypes-slot-name">{s.slot}</text>
                <text x={SLOT_X + 62} y={y + SLOT_H / 2 + 4} className="javatypes-slot-type">{s.type}</text>
                {s.kind === 'primitive' ? (
                  <text x={SLOT_X + SLOT_W - 12} y={y + SLOT_H / 2 + 4} textAnchor="end" className="javatypes-slot-val">
                    {s.held}
                  </text>
                ) : (
                  <g className="javatypes-slot-ref">
                    <Box x={SLOT_X + SLOT_W - 46} y={y + SLOT_H / 2 - 8} width={16} height={16} className="javatypes-reficon" />
                    <text x={SLOT_X + SLOT_W - 26} y={y + SLOT_H / 2 + 4} textAnchor="end" className="javatypes-slot-val is-ref">
                      ref
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* heap objects */}
          {heapItems.map((h, j) => {
            const y = 74 + j * (HEAP_H + 18);
            const isNew = h.slotIndex === step - 1;
            return (
              <g key={`heap-${h.slot}`} className={`javatypes-heap ${HUE_CLASS[h.hue]}${isNew ? ' is-new' : ''}`}>
                <rect x={HEAP_X} y={y} width={HEAP_W} height={HEAP_H} rx={10} className="javatypes-heap-rect" />
                <Link2 x={HEAP_X + 12} y={y + 10} width={15} height={15} className="javatypes-heap-icon" />
                <text x={HEAP_X + 36} y={y + 22} className="javatypes-heap-label">{h.heapLabel}</text>
                <text x={HEAP_X + 36} y={y + 40} className="javatypes-heap-sub">{h.heapSub}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="javatypes-controls">
        <button type="button" className="javatypes-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="javatypes-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> Step
        </button>
        <span className="javatypes-progress">{step} / {total}</span>
        <label className="javatypes-speed">
          <Gauge size={13} className="javatypes-speed-icon" />
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="javatypes-speed-range"
            aria-label="playback speed"
          />
          <span className="javatypes-speed-val">{speed}x</span>
        </label>
        <code className="javatypes-curline">{codeLine}</code>
      </div>

      <div className="javatypes-readout">
        <div className={`javatypes-stat ${cur ? HUE_CLASS[cur.hue] : 'is-empty'}`}>
          <span className="javatypes-stat-key">type</span>
          <span className="javatypes-stat-val">{cur ? cur.type : '—'}</span>
        </div>
        <div className={`javatypes-stat ${cur ? HUE_CLASS[cur.hue] : 'is-empty'}`}>
          <span className="javatypes-stat-key">stored as</span>
          <span className="javatypes-stat-val">{cur ? (cur.kind === 'primitive' ? 'value' : 'reference') : '—'}</span>
        </div>
        <div className="javatypes-stat is-prim">
          <Box size={13} className="javatypes-stat-icon" />
          <span className="javatypes-stat-key">primitives</span>
          <span className="javatypes-stat-val">{counts.prim}</span>
        </div>
        <div className="javatypes-stat is-heap">
          <Link2 size={13} className="javatypes-stat-icon" />
          <span className="javatypes-stat-key">heap objects</span>
          <span className="javatypes-stat-val">{counts.ref}</span>
        </div>
      </div>

      <div className="javatypes-note">
        <span className="javatypes-note-label">now</span>
        <span className="javatypes-note-body">{noteText}</span>
      </div>
    </div>
  );
}
