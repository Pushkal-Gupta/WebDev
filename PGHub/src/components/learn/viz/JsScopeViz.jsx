import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Boxes, Play, Pause, SkipForward, RotateCcw, ArrowRight, Box, Variable, AlertTriangle } from 'lucide-react';
import './JsScopeViz.css';

const LINES = [
  { text: 'function demo() {', indent: 0 },
  { text: 'console.log(x); // undefined', indent: 1 },
  { text: 'var x = 1;', indent: 1 },
  { text: 'if (true) {', indent: 1 },
  { text: 'let y = 2;', indent: 2 },
  { text: 'console.log(y); // 2', indent: 2 },
  { text: '} // y leaves scope here', indent: 1 },
  { text: '}', indent: 0 },
];

const L_FN = 0;
const L_LOG_X = 1;
const L_VAR_X = 2;
const L_IF = 3;
const L_LET_Y = 4;
const L_LOG_Y = 5;
const L_BLOCK_END = 6;
const L_FN_END = 7;

// x state: 'hoisted' (declared at top, undefined) | 1
// y state: 'absent' | 'tdz' | 2 | 'gone'
function buildTrace() {
  return [
    {
      line: L_FN, scope: 'function', x: 'hoisted', y: 'absent',
      note: 'Entering demo(). Before any statement runs, var x is hoisted to the top of the function scope and initialized to undefined.',
    },
    {
      line: L_LOG_X, scope: 'function', x: 'hoisted', y: 'absent',
      note: 'console.log(x) reads the hoisted x — it exists but holds undefined, so no error is thrown.',
    },
    {
      line: L_VAR_X, scope: 'function', x: 1, y: 'absent',
      note: 'The assignment var x = 1 runs in place. x now holds 1 in the function scope.',
    },
    {
      line: L_IF, scope: 'function', x: 1, y: 'tdz',
      note: 'Entering the if-block creates a new block scope. let y is hoisted to the block top but sits in the Temporal Dead Zone — reading it now would throw a ReferenceError.',
    },
    {
      line: L_LET_Y, scope: 'block', x: 1, y: 2,
      note: 'let y = 2 declares and initializes y inside the block scope. The TDZ ends and y becomes usable.',
    },
    {
      line: L_LOG_Y, scope: 'block', x: 1, y: 2,
      note: 'console.log(y) inside the block reads y = 2. Both x (function) and y (block) are visible here.',
    },
    {
      line: L_BLOCK_END, scope: 'function', x: 1, y: 'gone',
      note: 'The block closes. y is block-scoped, so it is destroyed — referencing y after this point would throw. x survives in the function scope.',
    },
    {
      line: L_FN_END, scope: 'function', x: 1, y: 'gone',
      note: 'demo() returns. x lived for the whole function; y only ever existed inside the if-block.',
    },
  ];
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function xLabel(x) {
  if (x === 'hoisted') return 'undefined';
  return String(x);
}

function yLabel(y) {
  if (y === 'absent') return '—';
  if (y === 'tdz') return 'TDZ';
  if (y === 'gone') return 'destroyed';
  return String(y);
}

export default function JsScopeViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const trace = useMemo(() => buildTrace(), []);
  const total = trace.length;

  function togglePlay() {
    if (step >= total - 1) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total - 1) return undefined;
    const delay = Math.round((reduced() ? 360 : 1040) / speed);
    timer.current = setTimeout(() => setStep((s) => Math.min(total - 1, s + 1)), delay);
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const cur = trace[step];
  const finished = step >= total - 1;
  const showPause = playing && step < total - 1;

  const inBlock = cur.scope === 'block';
  const yActive = cur.y === 2;
  const yTdz = cur.y === 'tdz';
  const blockAlive = cur.y === 'tdz' || cur.y === 2;

  return (
    <div className="jssc">
      <div className="jssc-head">
        <div className="jssc-head-icon"><Boxes size={18} /></div>
        <div className="jssc-head-text">
          <h3 className="jssc-title">How var, let, and const are scoped</h3>
          <p className="jssc-sub">
            Each scope is a box. Watch var x hoist to the top of the function box, while let y
            lives only inside the if-block &mdash; guarded first by its Temporal Dead Zone.
          </p>
        </div>
        <button type="button" className="jssc-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="jssc-stage">
        <ol className="jssc-code">
          {LINES.map((ln, i) => {
            const active = i === cur.line;
            return (
              <li
                key={i}
                className={`jssc-line jssc-indent-${ln.indent}${active ? ' is-active' : ''}`}
              >
                <span className="jssc-gutter">{i + 1}</span>
                <span className="jssc-caret">{active ? <ArrowRight size={13} /> : null}</span>
                <code className="jssc-src">{ln.text}</code>
              </li>
            );
          })}
        </ol>

        <svg
          className="jssc-svg"
          viewBox="0 0 320 230"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Nested scope boxes showing var and let lifetimes"
        >
          <defs>
            <linearGradient id="jssc-fn-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="color-mix(in srgb, var(--hue-sky) 18%, transparent)" />
              <stop offset="100%" stopColor="color-mix(in srgb, var(--hue-sky) 6%, transparent)" />
            </linearGradient>
            <linearGradient id="jssc-block-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="color-mix(in srgb, var(--hue-violet) 20%, transparent)" />
              <stop offset="100%" stopColor="color-mix(in srgb, var(--hue-violet) 7%, transparent)" />
            </linearGradient>
            <filter id="jssc-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* function scope box */}
          <rect
            className="jssc-fnbox"
            x="14" y="14" width="292" height="202" rx="12"
            fill="url(#jssc-fn-grad)"
          />
          <text className="jssc-boxlabel jssc-fnlabel" x="26" y="32">function demo() scope</text>

          {/* x slot — pinned at function-scope top, hoisted */}
          <g className="jssc-slot" filter={cur.line <= L_VAR_X ? 'url(#jssc-glow)' : undefined}>
            <rect
              className={`jssc-var jssc-var-x${cur.x === 1 ? ' is-set' : ' is-hoisted'}`}
              x="26" y="44" width="120" height="30" rx="7"
            />
            <text className="jssc-varname" x="36" y="63">var x</text>
            <text className={`jssc-varval${cur.x === 1 ? ' is-set' : ' is-hoisted'}`} x="138" y="63" textAnchor="end">
              {xLabel(cur.x)}
            </text>
          </g>
          <text className="jssc-hint" x="26" y="90">hoisted to function top</text>

          {/* if-block scope box */}
          <g className={`jssc-blockgroup${blockAlive ? ' is-alive' : ' is-dead'}`}>
            <rect
              className="jssc-blockbox"
              x="32" y="104" width="256" height="96" rx="10"
              fill="url(#jssc-block-grad)"
            />
            <text className="jssc-boxlabel jssc-blocklabel" x="44" y="122">if (true) block scope</text>

            {/* y slot */}
            <g className="jssc-slot" filter={yActive ? 'url(#jssc-glow)' : undefined}>
              <rect
                className={`jssc-var jssc-var-y${yActive ? ' is-set' : ''}${yTdz ? ' is-tdz' : ''}`}
                x="44" y="134" width="132" height="32" rx="7"
              />
              <text className="jssc-varname" x="54" y="154">let y</text>
              <text className={`jssc-varval${yActive ? ' is-set' : ''}${yTdz ? ' is-tdz' : ''}`} x="168" y="154" textAnchor="end">
                {yTdz ? 'TDZ' : yActive ? '2' : '—'}
              </text>
            </g>

            {yTdz ? (
              <g className="jssc-tdzband">
                <rect x="44" y="172" width="232" height="18" rx="5" className="jssc-tdzrect" />
                <text className="jssc-tdztext" x="160" y="184" textAnchor="middle">
                  Temporal Dead Zone — accessing y throws
                </text>
              </g>
            ) : (
              <text className="jssc-hint jssc-blockhint" x="44" y="186">block-scoped: gone after &#125;</text>
            )}
          </g>

          {/* current-scope pointer */}
          <circle
            className="jssc-cursor"
            cx="296"
            cy={inBlock ? 150 : 59}
            r="5"
          />
        </svg>
      </div>

      <div className="jssc-controls">
        <button type="button" className="jssc-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}
          {showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="jssc-btn"
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="jssc-speed">
          <span className="jssc-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="jssc-speed-range"
          />
          <span className="jssc-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="jssc-progress">{step + 1} / {total} steps</span>
      </div>

      <div className="jssc-readout">
        <div className="jssc-stat is-scope">
          <Box size={13} />
          <span className="jssc-stat-label">scope</span>
          <span className="jssc-stat-val">{inBlock ? 'if-block' : 'function'}</span>
        </div>
        <div className={`jssc-stat is-x${cur.x === 1 ? ' is-live' : ' is-hoisted'}`}>
          <Variable size={13} />
          <span className="jssc-stat-label">var x</span>
          <span className="jssc-stat-val">{xLabel(cur.x)}</span>
        </div>
        <div className={`jssc-stat is-y${yActive ? ' is-live' : ''}${yTdz ? ' is-tdz' : ''}${cur.y === 'gone' || cur.y === 'absent' ? ' is-absent' : ''}`}>
          {yTdz ? <AlertTriangle size={13} /> : <Variable size={13} />}
          <span className="jssc-stat-label">let y</span>
          <span className="jssc-stat-val">{yLabel(cur.y)}</span>
        </div>
      </div>

      <div className="jssc-note">
        <span className="jssc-note-label">now</span>
        <span className="jssc-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
