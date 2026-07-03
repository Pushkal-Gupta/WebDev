import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GitBranch, Play, Pause, SkipForward, RotateCcw, ArrowRight, Zap } from 'lucide-react';
import './JavaPolymorphismViz.css';

const OBJECTS = [
  {
    cls: 'Dog',
    body: 'return "Woof";',
    result: 'Woof',
    hue: 'is-sky',
    note: 'ref now points at a Dog object. ref is typed Animal, but the ACTUAL object is a Dog, so Dog.speak() runs.',
  },
  {
    cls: 'Cat',
    body: 'return "Meow";',
    result: 'Meow',
    hue: 'is-violet',
    note: 'Same Animal reference, re-pointed at a Cat. The declared type never changed — the object did — so Cat.speak() runs.',
  },
  {
    cls: 'Cow',
    body: 'return "Moo";',
    result: 'Moo',
    hue: 'is-pink',
    note: 'ref points at a Cow now. One call site, three answers: the object on the other side of the window decides which override fires.',
  },
];

const W = 720;
const H = 340;
const REF_X = 60;
const REF_Y = 150;
const REF_W = 150;
const REF_H = 58;
const OBJ_X = 430;
const OBJ_W = 230;
const OBJ_H = 66;
const OBJ_GAP = 26;
const OBJ_TOP = 40;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function JavaPolymorphismViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = OBJECTS.length;
  const finished = step >= total;
  const showPause = playing && step < total;

  const cur = step > 0 ? OBJECTS[step - 1] : null;
  const targetIdx = step > 0 ? step - 1 : -1;

  const objY = useMemo(
    () => OBJECTS.map((_, i) => OBJ_TOP + i * (OBJ_H + OBJ_GAP)),
    [],
  );

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    const base = reduced() ? 500 : 1500;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), base / speed);
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const noteText = cur
    ? cur.note
    : 'Press Step or Play. An Animal reference re-points at each object; the call travels the arrow and the matching override lights up.';

  const arrowTargetY = targetIdx >= 0 ? objY[targetIdx] + OBJ_H / 2 : REF_Y + REF_H / 2;
  const refCenterY = REF_Y + REF_H / 2;

  return (
    <div className="javapoly">
      <div className="javapoly-head">
        <div className="javapoly-head-icon"><GitBranch size={18} /></div>
        <div className="javapoly-head-text">
          <h3 className="javapoly-title">The object decides, not the reference</h3>
          <p className="javapoly-sub">
            One <code>Animal ref</code> re-points at a Dog, Cat, then Cow. Each
            <code> ref.speak()</code> dispatches to the real object&apos;s override — dynamic dispatch.
          </p>
        </div>
        <button type="button" className="javapoly-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="javapoly-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="javapoly-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id="javapoly-arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto"
            >
              <path d="M1,1 L9,5 L1,9 Z" className="javapoly-arrowfill" />
            </marker>
            <linearGradient id="javapoly-callgrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" className="javapoly-callstop-a" />
              <stop offset="100%" className="javapoly-callstop-b" />
            </linearGradient>
          </defs>

          <text x={REF_X} y={REF_Y - 46} className="javapoly-label">declared type (the window)</text>
          <text x={OBJ_X} y={OBJ_TOP - 14} className="javapoly-label">actual objects on the heap</text>

          {/* base-type reference box */}
          <g className="javapoly-ref">
            <rect x={REF_X} y={REF_Y} width={REF_W} height={REF_H} rx={10} className="javapoly-ref-rect" />
            <text x={REF_X + REF_W / 2} y={REF_Y + 24} className="javapoly-ref-type" textAnchor="middle">Animal</text>
            <text x={REF_X + REF_W / 2} y={REF_Y + 44} className="javapoly-ref-name" textAnchor="middle">ref</text>
          </g>

          {/* dispatch arrow from ref to the current target */}
          {targetIdx >= 0 && (
            <g className="javapoly-call">
              <path
                d={`M ${REF_X + REF_W} ${refCenterY} C ${REF_X + REF_W + 110} ${refCenterY}, ${OBJ_X - 110} ${arrowTargetY}, ${OBJ_X - 6} ${arrowTargetY}`}
                className="javapoly-call-path"
                markerEnd="url(#javapoly-arrowhead)"
                fill="none"
                key={`call-${targetIdx}`}
              />
              <text
                x={(REF_X + REF_W + OBJ_X) / 2}
                y={(refCenterY + arrowTargetY) / 2 - 10}
                className="javapoly-call-label"
                textAnchor="middle"
              >
                ref.speak()
              </text>
            </g>
          )}

          {/* candidate subclass objects */}
          {OBJECTS.map((o, i) => {
            const active = i === targetIdx;
            return (
              <g key={o.cls} className={`javapoly-obj ${o.hue}${active ? ' is-active' : ''}`}>
                <rect x={OBJ_X} y={objY[i]} width={OBJ_W} height={OBJ_H} rx={10} className="javapoly-obj-rect" />
                <text x={OBJ_X + 14} y={objY[i] + 22} className="javapoly-obj-cls">{o.cls} : Animal</text>
                <text x={OBJ_X + 14} y={objY[i] + 44} className="javapoly-obj-sig">String speak() {'{'}</text>
                <text x={OBJ_X + 26} y={objY[i] + 60} className="javapoly-obj-body">{o.body}</text>
                {active && (
                  <g className="javapoly-obj-badge">
                    <circle cx={OBJ_X + OBJ_W - 20} cy={objY[i] + 20} r={12} className="javapoly-obj-badge-bg" />
                    <Zap x={OBJ_X + OBJ_W - 26} y={objY[i] + 14} size={12} className="javapoly-obj-badge-icon" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="javapoly-controls">
        <button type="button" className="javapoly-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="javapoly-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <span className="javapoly-progress">{step} / {total}</span>
        <label className="javapoly-speed">
          <span className="javapoly-speed-key">speed</span>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="javapoly-speed-range"
          />
          <span className="javapoly-speed-val">{speed}x</span>
        </label>
      </div>

      <div className="javapoly-readout">
        <div className={`javapoly-stat ${cur ? cur.hue : 'is-empty'}`}>
          <span className="javapoly-stat-key">actual object</span>
          <span className="javapoly-stat-val">{cur ? cur.cls : '—'}</span>
        </div>
        <div className={`javapoly-stat ${cur ? cur.hue : 'is-empty'}`}>
          <ArrowRight size={13} className="javapoly-stat-icon" />
          <span className="javapoly-stat-key">runs</span>
          <span className="javapoly-stat-val">{cur ? `${cur.cls}.speak()` : '—'}</span>
        </div>
        <div className={`javapoly-stat ${cur ? cur.hue : 'is-empty'}`}>
          <span className="javapoly-stat-key">returns</span>
          <span className="javapoly-stat-val">{cur ? `"${cur.result}"` : '—'}</span>
        </div>
        <div className="javapoly-stat is-decl">
          <span className="javapoly-stat-key">declared type</span>
          <span className="javapoly-stat-val">Animal</span>
        </div>
      </div>

      <div className="javapoly-note">
        <span className="javapoly-note-label">now</span>
        <span className="javapoly-note-body">{noteText}</span>
      </div>
    </div>
  );
}
