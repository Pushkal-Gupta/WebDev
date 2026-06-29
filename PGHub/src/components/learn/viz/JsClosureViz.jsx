import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Lock, Play, Pause, SkipForward, RotateCcw, ArrowRight, Hash, Layers, Repeat } from 'lucide-react';
import './JsClosureViz.css';

const LINES = [
  { text: 'function makeCounter() {', indent: 0 },
  { text: 'let count = 0;', indent: 1 },
  { text: 'return function () {', indent: 1 },
  { text: 'count = count + 1;', indent: 2 },
  { text: 'return count;', indent: 2 },
  { text: '};', indent: 1 },
  { text: '}', indent: 0 },
  { text: 'const next = makeCounter();', indent: 0 },
  { text: 'next(); next(); next();', indent: 0 },
];

const L_DEF = 0;
const L_COUNT = 1;
const L_RETURN = 2;
const L_INC = 3;
const L_INNER_RET = 5;
const L_MAKE = 7;
const L_CALLS = 8;

function buildTrace() {
  const steps = [];
  steps.push({
    line: L_DEF, count: null, outer: 'idle', captured: false, calls: 0,
    note: 'makeCounter is defined — its body has not run yet, so no count exists.',
  });
  steps.push({
    line: L_MAKE, count: null, outer: 'alive', captured: false, calls: 0,
    note: 'const next = makeCounter() — the outer call frame is pushed onto the stack.',
  });
  steps.push({
    line: L_COUNT, count: 0, outer: 'alive', captured: false, calls: 0,
    note: 'let count = 0 — a fresh variable is created inside makeCounter’s environment.',
  });
  steps.push({
    line: L_RETURN, count: 0, outer: 'alive', captured: true, calls: 0,
    note: 'the inner function is created and closes over count — it captures the live variable, not a copy.',
  });
  steps.push({
    line: L_MAKE, count: 0, outer: 'returned', captured: true, calls: 0,
    note: 'makeCounter returns — its call frame pops off the stack, but count survives inside the retained closure.',
  });
  for (let i = 1; i <= 3; i += 1) {
    steps.push({
      line: L_CALLS, count: i - 1, outer: 'returned', captured: true, calls: i - 1,
      note: `next() is called — it re-enters the inner function, still pointing at the same captured count = ${i - 1}.`,
    });
    steps.push({
      line: L_INC, count: i, outer: 'returned', captured: true, calls: i,
      note: `count = count + 1 mutates the SAME captured variable: ${i - 1} → ${i}.`,
    });
    steps.push({
      line: L_INNER_RET, count: i, outer: 'returned', captured: true, calls: i,
      note: `return count yields ${i}. The value persisted between calls because the closure kept count alive.`,
    });
  }
  return steps;
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function JsClosureViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const trace = useMemo(() => buildTrace(), []);
  const total = trace.length;

  function togglePlay() {
    if (step >= total - 1) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total - 1) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total - 1, s + 1)), reduced() ? 360 : 1020);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const cur = trace[step];
  const finished = step >= total - 1;
  const showPause = playing && step < total - 1;

  const outerReturned = cur.outer === 'returned';
  const outerAlive = cur.outer === 'alive';
  const countText = cur.count === null ? '—' : String(cur.count);

  return (
    <div className="jscl">
      <div className="jscl-head">
        <div className="jscl-head-icon"><Lock size={18} /></div>
        <div className="jscl-head-text">
          <h3 className="jscl-title">A closure keeps its variable alive</h3>
          <p className="jscl-sub">
            The inner function captures <code>count</code> from its outer scope &mdash; that variable
            survives after <code>makeCounter</code> returns, and every call mutates the same one.
          </p>
        </div>
        <button type="button" className="jscl-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="jscl-stage">
        <ol className="jscl-code">
          {LINES.map((ln, i) => {
            const active = i === cur.line;
            return (
              <li
                key={i}
                className={`jscl-line jscl-indent-${ln.indent}${active ? ' is-active' : ''}`}
              >
                <span className="jscl-gutter">{i + 1}</span>
                <span className="jscl-caret">{active ? <ArrowRight size={13} /> : null}</span>
                <code className="jscl-src">{ln.text}</code>
              </li>
            );
          })}
        </ol>

        <svg
          className="jscl-svg"
          viewBox="0 0 360 250"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Closure environment diagram"
        >
          <defs>
            <linearGradient id="jscl-grad-closure" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="color-mix(in srgb, var(--hue-mint) 26%, transparent)" />
              <stop offset="100%" stopColor="color-mix(in srgb, var(--hue-mint) 8%, transparent)" />
            </linearGradient>
            <filter id="jscl-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker id="jscl-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3"
              orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--hue-sky)" />
            </marker>
          </defs>

          {/* Call stack column */}
          <text x="74" y="22" className="jscl-svg-cap" textAnchor="middle">call stack</text>
          <rect x="14" y="32" width="120" height="58" rx="9"
            className={`jscl-frame${outerAlive ? ' is-alive' : ''}${outerReturned ? ' is-gone' : ''}`} />
          <text x="74" y="56" className="jscl-svg-frame-t" textAnchor="middle">makeCounter()</text>
          <text x="74" y="74" className="jscl-svg-frame-s" textAnchor="middle">
            {outerAlive ? 'frame active' : outerReturned ? 'popped' : 'not called'}
          </text>

          <rect x="14" y="100" width="120" height="40" rx="9" className="jscl-frame is-global" />
          <text x="74" y="124" className="jscl-svg-frame-g" textAnchor="middle">global: next</text>

          {/* Closure environment bubble */}
          <text x="262" y="22" className="jscl-svg-cap" textAnchor="middle">closure environment</text>
          <rect x="176" y="32" width="172" height="92" rx="14"
            className={`jscl-closure${cur.captured ? ' is-on' : ''}`}
            fill={cur.captured ? 'url(#jscl-grad-closure)' : 'transparent'} />
          <text x="262" y="56" className="jscl-svg-closure-t" textAnchor="middle">retained scope</text>

          <g filter={cur.captured ? 'url(#jscl-glow)' : undefined}>
            <rect x="206" y="68" width="112" height="42" rx="10"
              className={`jscl-countbox${cur.captured ? ' is-live' : ''}`} />
          </g>
          <text x="262" y="86" className="jscl-svg-var" textAnchor="middle">count</text>
          <text x="262" y="104" className="jscl-svg-num" textAnchor="middle">{countText}</text>

          {/* next -> captured count arrow */}
          {cur.captured ? (
            <path
              d="M134,118 C168,118 158,90 200,89"
              className="jscl-link"
              fill="none"
              markerEnd="url(#jscl-arrow)"
            />
          ) : null}
          {cur.captured ? (
            <text x="150" y="150" className="jscl-svg-link-t" textAnchor="middle">
              next closes over count
            </text>
          ) : null}

          {/* survives note */}
          {outerReturned ? (
            <text x="262" y="146" className="jscl-svg-survive" textAnchor="middle">
              outer frame gone &mdash; count lives on
            </text>
          ) : null}
        </svg>
      </div>

      <div className="jscl-controls">
        <button type="button" className="jscl-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}
          {showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="jscl-btn"
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> Step
        </button>
        <span className="jscl-progress">{step + 1} / {total} steps</span>
      </div>

      <div className="jscl-readout">
        <div className="jscl-stat is-count">
          <Hash size={13} />
          <span className="jscl-stat-label">captured count</span>
          <span className="jscl-stat-val">{countText}</span>
        </div>
        <div className={`jscl-stat is-frame${outerReturned ? ' is-gone' : outerAlive ? ' is-alive' : ' is-idle'}`}>
          <Layers size={13} />
          <span className="jscl-stat-label">outer frame</span>
          <span className="jscl-stat-val">
            {outerReturned ? 'returned' : outerAlive ? 'alive' : 'idle'}
          </span>
        </div>
        <div className="jscl-stat is-calls">
          <Repeat size={13} />
          <span className="jscl-stat-label">times called</span>
          <span className="jscl-stat-val">{cur.calls}</span>
        </div>
      </div>

      <div className="jscl-note">
        <span className="jscl-note-label">now</span>
        <span className="jscl-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
