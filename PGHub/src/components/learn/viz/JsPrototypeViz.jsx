import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GitFork, Play, Pause, SkipForward, RotateCcw, Check, X, Search, Layers, Target } from 'lucide-react';
import './JsPrototypeViz.css';

const CODE = [
  { text: "const dog = { name: 'Rex' };", indent: 0 },
  { text: 'Object.setPrototypeOf(dog, Dog.prototype);', indent: 0 },
  { text: "dog.name;       // 'Rex'  (own property)", indent: 0 },
  { text: 'dog.speak();    // found on Dog.prototype', indent: 0 },
  { text: 'dog.toString(); // found on Object.prototype', indent: 0 },
  { text: 'dog.fly;        // undefined (not in chain)', indent: 0 },
];

const C_DECL = 0;
const C_SETPROTO = 1;
const C_NAME = 2;
const C_SPEAK = 3;
const C_TOSTRING = 4;
const C_FLY = 5;

const CHAIN = [
  { id: 'dog', label: 'dog', tag: 'object', keys: ['name'] },
  { id: 'dog-proto', label: 'Dog.prototype', tag: '[[Prototype]]', keys: ['speak', 'legs'] },
  { id: 'obj-proto', label: 'Object.prototype', tag: '[[Prototype]]', keys: ['hasOwnProperty', 'toString'] },
  { id: 'null', label: 'null', tag: 'end of chain', keys: [] },
];

const LOOKUPS = [
  { key: 'name', line: C_NAME },
  { key: 'speak', line: C_SPEAK },
  { key: 'toString', line: C_TOSTRING },
  { key: 'fly', line: C_FLY },
];

function buildTrace() {
  const steps = [];
  steps.push({
    line: C_DECL, key: null, level: -1, result: 'idle',
    note: 'dog is a plain object with one own property: name = "Rex".',
  });
  steps.push({
    line: C_SETPROTO, key: null, level: -1, result: 'idle',
    note: "dog's [[Prototype]] now points at Dog.prototype, which itself links to Object.prototype.",
  });

  for (const lk of LOOKUPS) {
    let foundAt = -1;
    for (let i = 0; i < CHAIN.length; i += 1) {
      const box = CHAIN[i];
      if (box.id === 'null') {
        if (foundAt === -1) {
          steps.push({
            line: lk.line, key: lk.key, level: i, result: 'undefined',
            note: `reached null — the chain ends with no "${lk.key}". The lookup returns undefined.`,
          });
        }
        break;
      }
      const has = box.keys.includes(lk.key);
      if (has) {
        foundAt = i;
        steps.push({
          line: lk.line, key: lk.key, level: i, result: 'found',
          note: i === 0
            ? `"${lk.key}" is an own property of dog — found immediately, no walk needed.`
            : `"${lk.key}" lives on ${box.label}. The engine stops here and returns it.`,
        });
        break;
      }
      steps.push({
        line: lk.line, key: lk.key, level: i, result: 'searching',
        note: `"${lk.key}" is not on ${box.label}. Walk down the [[Prototype]] link to the next object.`,
      });
    }
  }
  return steps;
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const BOX_W = 250;
const BOX_X = 75;
const BOX_TOP = 18;
const HUES = ['var(--hue-sky)', 'var(--hue-violet)', 'var(--hue-pink)', 'var(--text-dim)'];

function boxHeight(box) {
  return 40 + Math.max(box.keys.length, 1) * 22;
}

function layout() {
  const out = [];
  let y = BOX_TOP;
  for (const box of CHAIN) {
    const h = boxHeight(box);
    out.push({ ...box, y, h });
    y += h + 38;
  }
  return out;
}

export default function JsPrototypeViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const trace = useMemo(() => buildTrace(), []);
  const boxes = useMemo(() => layout(), []);
  const total = trace.length;
  const svgH = boxes[boxes.length - 1].y + boxes[boxes.length - 1].h + BOX_TOP;

  function togglePlay() {
    if (step >= total - 1) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total - 1) return undefined;
    const delay = Math.round((reduced() ? 360 : 1000) / speed);
    timer.current = setTimeout(() => setStep((s) => Math.min(total - 1, s + 1)), delay);
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const cur = trace[step];
  const finished = step >= total - 1;
  const showPause = playing && step < total - 1;
  const marker = boxes[cur.level];

  const resultLabel = cur.result === 'found'
    ? `found at ${CHAIN[cur.level].label}`
    : cur.result === 'undefined'
      ? 'undefined'
      : cur.result === 'searching'
        ? 'searching…'
        : '—';

  return (
    <div className="jspr">
      <div className="jspr-head">
        <div className="jspr-head-icon"><GitFork size={18} /></div>
        <div className="jspr-head-text">
          <h3 className="jspr-title">Walking the prototype chain</h3>
          <p className="jspr-sub">
            Reading a property the object doesn&rsquo;t own makes the engine climb the
            [[Prototype]] chain &mdash; box by box &mdash; until it finds the key or hits null.
          </p>
        </div>
        <button type="button" className="jspr-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="jspr-stage">
        <ol className="jspr-code">
          {CODE.map((ln, i) => {
            const active = i === cur.line;
            return (
              <li key={i} className={`jspr-line${active ? ' is-active' : ''}`}>
                <span className="jspr-gutter">{i + 1}</span>
                <code className="jspr-src">{ln.text}</code>
              </li>
            );
          })}
        </ol>

        <div className="jspr-diagram">
          <svg
            className="jspr-svg"
            viewBox={`0 0 400 ${svgH}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Prototype chain from dog down to null"
          >
            <defs>
              <marker id="jspr-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-dim)" />
              </marker>
            </defs>

            {boxes.slice(0, -1).map((box, i) => {
              const next = boxes[i + 1];
              const y1 = box.y + box.h;
              const y2 = next.y;
              const walking = cur.result !== 'idle' && cur.level > i;
              const cx = BOX_X + BOX_W / 2;
              return (
                <g key={`edge-${box.id}`}>
                  <line
                    x1={cx} y1={y1} x2={cx} y2={y2 - 2}
                    stroke={walking ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={walking ? 2.4 : 1.6}
                    markerEnd="url(#jspr-arrow)"
                  />
                  <text
                    x={cx + 9} y={(y1 + y2) / 2 + 3}
                    className="jspr-edge-label"
                    fill={walking ? 'var(--accent)' : 'var(--text-dim)'}
                  >
                    [[Prototype]]
                  </text>
                </g>
              );
            })}

            {boxes.map((box, i) => {
              const isHere = cur.level === i;
              const isNull = box.id === 'null';
              const foundHere = isHere && cur.result === 'found';
              const undefHere = isHere && cur.result === 'undefined';
              let stroke = 'var(--border)';
              if (foundHere) stroke = 'var(--easy)';
              else if (undefHere) stroke = 'var(--hard)';
              else if (isHere) stroke = 'var(--accent)';
              const hue = HUES[i];
              return (
                <g key={box.id}>
                  <rect
                    x={BOX_X} y={box.y} width={BOX_W} height={box.h} rx="10"
                    fill={isHere ? `color-mix(in srgb, ${stroke} 12%, var(--surface))` : 'var(--surface)'}
                    stroke={stroke}
                    strokeWidth={isHere ? 2.2 : 1.4}
                  />
                  <rect x={BOX_X} y={box.y} width="4" height={box.h} rx="2" fill={hue} />
                  <text x={BOX_X + 16} y={box.y + 21} className="jspr-box-label" fill="var(--text-main)">
                    {box.label}
                  </text>
                  <text x={BOX_X + BOX_W - 12} y={box.y + 21} className="jspr-box-tag" textAnchor="end" fill={hue}>
                    {box.tag}
                  </text>
                  {isNull ? (
                    <text x={BOX_X + 16} y={box.y + 45} className="jspr-box-empty" fill="var(--text-dim)">
                      no further prototype
                    </text>
                  ) : box.keys.map((k, ki) => {
                    const match = isHere && cur.key === k;
                    return (
                      <text
                        key={k}
                        x={BOX_X + 16}
                        y={box.y + 45 + ki * 22}
                        className={`jspr-box-key${match ? ' is-match' : ''}`}
                        fill={match ? 'var(--easy)' : 'var(--text-dim)'}
                      >
                        {match ? '→ ' : '• '}{k}
                      </text>
                    );
                  })}
                </g>
              );
            })}

            {marker && cur.result !== 'idle' ? (
              <g className="jspr-marker">
                <circle
                  cx={BOX_X - 18}
                  cy={marker.y + 20}
                  r="9"
                  fill={cur.result === 'found' ? 'var(--easy)' : cur.result === 'undefined' ? 'var(--hard)' : 'var(--accent)'}
                  opacity="0.18"
                />
                <circle
                  cx={BOX_X - 18}
                  cy={marker.y + 20}
                  r="4.5"
                  fill={cur.result === 'found' ? 'var(--easy)' : cur.result === 'undefined' ? 'var(--hard)' : 'var(--accent)'}
                />
              </g>
            ) : null}
          </svg>
        </div>
      </div>

      <div className="jspr-controls">
        <button type="button" className="jspr-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}
          {showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="jspr-btn"
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="jspr-speed">
          <span className="jspr-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="jspr-speed-range"
          />
          <span className="jspr-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="jspr-progress">{step + 1} / {total} steps</span>
      </div>

      <div className="jspr-readout">
        <div className="jspr-stat is-key">
          <Search size={13} />
          <span className="jspr-stat-label">looking up</span>
          <span className="jspr-stat-val">{cur.key === null ? '—' : `.${cur.key}`}</span>
        </div>
        <div className="jspr-stat is-level">
          <Layers size={13} />
          <span className="jspr-stat-label">at level</span>
          <span className="jspr-stat-val">{cur.level < 0 ? '—' : CHAIN[cur.level].label}</span>
        </div>
        <div className={`jspr-stat is-result ${cur.result}`}>
          {cur.result === 'found' ? <Check size={13} /> : cur.result === 'undefined' ? <X size={13} /> : <Target size={13} />}
          <span className="jspr-stat-label">result</span>
          <span className="jspr-stat-val">{resultLabel}</span>
        </div>
      </div>

      <div className="jspr-note">
        <span className="jspr-note-label">now</span>
        <span className="jspr-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
