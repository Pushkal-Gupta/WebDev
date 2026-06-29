import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Repeat, Play, Pause, SkipForward, RotateCcw, ArrowRight, Layers, Zap, Clock, Terminal } from 'lucide-react';
import './JsEventLoopViz.css';

const LINES = [
  "console.log('A');",
  "setTimeout(() => console.log('B'), 0);",
  "Promise.resolve().then(() => console.log('C'));",
  "console.log('D');",
];

const L_A = 0;
const L_TIMEOUT = 1;
const L_PROMISE = 2;
const L_D = 3;

function buildTrace() {
  const steps = [];
  const push = (s) => steps.push(s);

  push({
    line: L_A, stack: ["main()"], micro: [], macro: [], output: [],
    pull: null,
    note: "main() begins on the call stack. The first synchronous statement is about to run.",
  });
  push({
    line: L_A, stack: ["main()", "console.log('A')"], micro: [], macro: [], output: [],
    pull: null,
    note: "console.log('A') is pushed onto the stack and runs immediately — synchronous code never waits.",
  });
  push({
    line: L_A, stack: ["main()"], micro: [], macro: [], output: ["A"],
    pull: null,
    note: "'A' is printed, and console.log pops off the stack. main() keeps going.",
  });
  push({
    line: L_TIMEOUT, stack: ["main()", "setTimeout(…)"], micro: [], macro: [], output: ["A"],
    pull: null,
    note: "setTimeout runs now, but it does NOT execute the callback — it hands the callback to the timer, queued for later.",
  });
  push({
    line: L_TIMEOUT, stack: ["main()"], micro: [], macro: ["() => log('B')"], output: ["A"],
    pull: null,
    note: "The timer (0ms) is done, so its callback joins the macrotask queue. setTimeout itself has already returned.",
  });
  push({
    line: L_PROMISE, stack: ["main()", "Promise.then(…)"], micro: [], macro: ["() => log('B')"], output: ["A"],
    pull: null,
    note: ".then registers a callback on an already-resolved promise — the callback is scheduled, not run inline.",
  });
  push({
    line: L_PROMISE, stack: ["main()"], micro: ["() => log('C')"], macro: ["() => log('B')"], output: ["A"],
    pull: null,
    note: "The promise reaction joins the MICROTASK queue. Microtasks sit in a separate, higher-priority lane.",
  });
  push({
    line: L_D, stack: ["main()", "console.log('D')"], micro: ["() => log('C')"], macro: ["() => log('B')"], output: ["A"],
    pull: null,
    note: "console.log('D') is the last synchronous statement — it runs before either queue is touched.",
  });
  push({
    line: L_D, stack: ["main()"], micro: ["() => log('C')"], macro: ["() => log('B')"], output: ["A", "D"],
    pull: null,
    note: "'D' prints. So far the output is A, D — all the synchronous code, in source order.",
  });
  push({
    line: null, stack: [], micro: ["() => log('C')"], macro: ["() => log('B')"], output: ["A", "D"],
    pull: null,
    note: "main() returns and the stack is EMPTY. Now the event loop wakes up and checks the queues.",
  });
  push({
    line: null, stack: [], micro: ["() => log('C')"], macro: ["() => log('B')"], output: ["A", "D"],
    pull: "micro",
    note: "Rule: drain ALL microtasks before any macrotask. The loop pulls the promise reaction first.",
  });
  push({
    line: null, stack: ["() => log('C')"], micro: [], macro: ["() => log('B')"], output: ["A", "D"],
    pull: "micro",
    note: "The microtask runs on the stack: it calls console.log('C').",
  });
  push({
    line: null, stack: [], micro: [], macro: ["() => log('B')"], output: ["A", "D", "C"],
    pull: "micro",
    note: "'C' prints. The microtask queue is now empty — only after that may a macrotask run.",
  });
  push({
    line: null, stack: [], micro: [], macro: ["() => log('B')"], output: ["A", "D", "C"],
    pull: "macro",
    note: "Microtasks exhausted, stack empty — the loop now pulls ONE macrotask: the setTimeout callback.",
  });
  push({
    line: null, stack: ["() => log('B')"], micro: [], macro: [], output: ["A", "D", "C"],
    pull: "macro",
    note: "The timer callback runs on the stack: it calls console.log('B').",
  });
  push({
    line: null, stack: [], micro: [], macro: [], output: ["A", "D", "C", "B"],
    pull: null,
    note: "'B' prints last. Final order: A, D, C, B — sync first, then microtask C, then macrotask B.",
  });
  return steps;
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const VB_W = 520;
const VB_H = 300;

function Column({ x, w, title, icon, items, accent, highlight }) {
  const slotH = 30;
  const gap = 6;
  const baseY = VB_H - 16;
  return (
    <g>
      <rect
        x={x} y={28} width={w} height={VB_H - 44} rx={10}
        fill="var(--bg)"
        stroke={highlight ? accent : 'var(--border)'}
        strokeWidth={highlight ? 2 : 1}
      />
      {highlight ? (
        <rect
          x={x} y={28} width={w} height={VB_H - 44} rx={10}
          fill={accent} opacity="0.08"
        />
      ) : null}
      <text x={x + w / 2} y={20} textAnchor="middle" className="jsel-col-title" fill="var(--text-dim)">
        {title}
      </text>
      <g transform={`translate(${x + 9}, 42)`} color={accent}>
        {icon}
      </g>
      {items.length === 0 ? (
        <text x={x + w / 2} y={(28 + baseY) / 2} textAnchor="middle" className="jsel-empty" fill="var(--text-dim)">
          empty
        </text>
      ) : null}
      {items.map((label, i) => {
        const y = baseY - slotH - i * (slotH + gap);
        return (
          <g key={`${label}-${i}`}>
            <rect
              x={x + 8} y={y} width={w - 16} height={slotH} rx={7}
              fill={`color-mix(in srgb, ${accent} 18%, var(--surface))`}
              stroke={accent} strokeWidth="1"
            />
            <text
              x={x + w / 2} y={y + slotH / 2 + 4}
              textAnchor="middle" className="jsel-frame-label" fill="var(--text-main)"
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default function JsEventLoopViz() {
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
    timer.current = setTimeout(() => setStep((s) => Math.min(total - 1, s + 1)), reduced() ? 360 : 1000);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const cur = trace[step];
  const finished = step >= total - 1;
  const showPause = playing && step < total - 1;

  const stackEmpty = cur.stack.length === 0;

  return (
    <div className="jsel">
      <div className="jsel-head">
        <div className="jsel-head-icon"><Repeat size={18} /></div>
        <div className="jsel-head-text">
          <h3 className="jsel-title">How the event loop orders your code</h3>
          <p className="jsel-sub">
            Synchronous code runs first on the call stack. Once it empties, the loop drains every
            microtask before pulling a single macrotask &mdash; so a promise beats a timer.
          </p>
        </div>
        <button type="button" className="jsel-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="jsel-stage">
        <ol className="jsel-code">
          {LINES.map((text, i) => {
            const active = i === cur.line;
            return (
              <li key={i} className={`jsel-line${active ? ' is-active' : ''}`}>
                <span className="jsel-gutter">{i + 1}</span>
                <span className="jsel-caret">{active ? <ArrowRight size={13} /> : null}</span>
                <code className="jsel-src">{text}</code>
              </li>
            );
          })}
        </ol>

        <svg
          className="jsel-svg"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Call stack, microtask queue and macrotask queue during event loop execution"
        >
          <Column
            x={12} w={150} title="Call Stack"
            icon={<Layers size={14} />}
            items={cur.stack}
            accent="var(--accent)"
            highlight={!stackEmpty}
          />
          <Column
            x={184} w={150} title="Microtask Queue"
            icon={<Zap size={14} />}
            items={cur.micro}
            accent="var(--hue-violet)"
            highlight={cur.pull === 'micro'}
          />
          <Column
            x={356} w={150} title="Macrotask Queue"
            icon={<Clock size={14} />}
            items={cur.macro}
            accent="var(--hue-sky)"
            highlight={cur.pull === 'macro'}
          />
          {cur.pull ? (
            <text
              x={cur.pull === 'micro' ? 259 : 431} y={290}
              textAnchor="middle" className="jsel-pull-label"
              fill={cur.pull === 'micro' ? 'var(--hue-violet)' : 'var(--hue-sky)'}
            >
              loop pulls here
            </text>
          ) : null}
        </svg>

        <div className="jsel-console">
          <span className="jsel-console-label"><Terminal size={12} /> console</span>
          <span className="jsel-console-out">
            {cur.output.length === 0
              ? <span className="jsel-console-empty">nothing printed yet</span>
              : cur.output.map((c, i) => <span key={i} className="jsel-console-token">{c}</span>)}
          </span>
        </div>
      </div>

      <div className="jsel-controls">
        <button type="button" className="jsel-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}
          {showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="jsel-btn"
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> Step
        </button>
        <span className="jsel-progress">step {step + 1} / {total}</span>
      </div>

      <div className="jsel-readout">
        <div className="jsel-stat is-stack">
          <Layers size={13} />
          <span className="jsel-stat-label">stack depth</span>
          <span className="jsel-stat-val">{cur.stack.length}</span>
        </div>
        <div className="jsel-stat is-micro">
          <Zap size={13} />
          <span className="jsel-stat-label">microtasks</span>
          <span className="jsel-stat-val">{cur.micro.length}</span>
        </div>
        <div className="jsel-stat is-macro">
          <Clock size={13} />
          <span className="jsel-stat-label">macrotasks</span>
          <span className="jsel-stat-val">{cur.macro.length}</span>
        </div>
        <div className="jsel-stat is-out">
          <Terminal size={13} />
          <span className="jsel-stat-label">output</span>
          <span className="jsel-stat-val">{cur.output.length === 0 ? '—' : cur.output.join(' ')}</span>
        </div>
      </div>

      <div className="jsel-note">
        <span className="jsel-note-label">now</span>
        <span className="jsel-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
