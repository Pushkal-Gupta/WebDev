import React, { useMemo, useState, useEffect, useRef } from 'react';
import { FlaskConical, Play, Pause, SkipForward, RotateCcw, Gauge, Check, X } from 'lucide-react';
import './TestTddCycleViz.css';

// Red-Green-Refactor loop. Deterministic; no randomness anywhere.
// The sample function evolves across iterations as each red test forces real logic.
const PHASES = [
  { key: 'red', label: 'RED', sub: 'write a failing test', cls: 'is-red', pass: false },
  { key: 'green', label: 'GREEN', sub: 'smallest code to pass', cls: 'is-green', pass: true },
  { key: 'refactor', label: 'REFACTOR', sub: 'clean up, stay green', cls: 'is-refactor', pass: true },
];

const PHASE_TEXT = {
  red: 'A new test is written for behaviour that does not exist yet. It fails — that red bar is the target.',
  green: 'Just enough code is written to turn the bar green. Cleverness can wait; the goal is only to pass.',
  refactor: 'With the tests green, the code is cleaned up — renamed, de-duplicated — safely under the net.',
};

// Each iteration adds a requirement; the function body grows to satisfy it.
const ITERATIONS = [
  {
    test: 'fizzbuzz(1) === "1"',
    lines: ['function fizzbuzz(n) {', '  return String(n);', '}'],
    tests: 1,
  },
  {
    test: 'fizzbuzz(3) === "Fizz"',
    lines: ['function fizzbuzz(n) {', '  if (n % 3 === 0) return "Fizz";', '  return String(n);', '}'],
    tests: 2,
  },
  {
    test: 'fizzbuzz(5) === "Buzz"',
    lines: [
      'function fizzbuzz(n) {',
      '  if (n % 3 === 0) return "Fizz";',
      '  if (n % 5 === 0) return "Buzz";',
      '  return String(n);',
      '}',
    ],
    tests: 3,
  },
  {
    test: 'fizzbuzz(15) === "FizzBuzz"',
    lines: [
      'function fizzbuzz(n) {',
      '  if (n % 15 === 0) return "FizzBuzz";',
      '  if (n % 3 === 0) return "Fizz";',
      '  if (n % 5 === 0) return "Buzz";',
      '  return String(n);',
      '}',
    ],
    tests: 4,
  },
];

// Flat sequence of (iteration, phase) steps the animation walks through.
const STEPS = [];
ITERATIONS.forEach((_, i) => {
  PHASES.forEach((p) => STEPS.push({ iter: i, phase: p.key }));
});
const TOTAL = STEPS.length - 1;

// Geometry
const W = 460;
const H = 300;
const CENTER = { x: 230, y: 132 };
const RADIUS = 96;
// Three nodes evenly around the circle, starting at the top.
const NODE_POS = PHASES.map((_, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
  return { x: CENTER.x + RADIUS * Math.cos(a), y: CENTER.y + RADIUS * Math.sin(a) };
});

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Point on the loop circle at angle for a given node index, pulled inward by pad.
function arcPoint(i, pad) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
  const r = RADIUS - pad;
  return { x: CENTER.x + r * Math.cos(a), y: CENTER.y + r * Math.sin(a) };
}

export default function TestTddCycleViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const cur = STEPS[Math.min(step, TOTAL)];
  const iteration = ITERATIONS[cur.iter];
  const phaseIndex = PHASES.findIndex((p) => p.key === cur.phase);
  const phase = PHASES[phaseIndex];
  const passing = phase.pass ? iteration.tests : Math.max(0, iteration.tests - 1);

  function togglePlay() {
    if (step >= TOTAL) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= TOTAL) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(TOTAL, s + 1)),
      Math.round((reduced() ? 460 : 1050) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, speed]);

  // Curved arrows connecting node i -> next node around the loop.
  const arcs = useMemo(() => PHASES.map((_, i) => {
    const from = arcPoint(i, -18);
    const to = arcPoint((i + 1) % 3, -18);
    const mx = CENTER.x + (from.x + to.x) / 2 - CENTER.x;
    const my = CENTER.y + (from.y + to.y) / 2 - CENTER.y;
    // Bow the control point outward from the centre.
    const dx = (from.x + to.x) / 2 - CENTER.x;
    const dy = (from.y + to.y) / 2 - CENTER.y;
    const len = Math.hypot(dx, dy) || 1;
    const cxp = mx + (dx / len) * 34;
    const cyp = my + (dy / len) * 34;
    return { i, from, to, cxp, cyp, hot: i === phaseIndex };
  }), [phaseIndex]);

  return (
    <div className="ttc">
      <div className="ttc-head">
        <div className="ttc-head-icon"><FlaskConical size={18} /></div>
        <div className="ttc-head-text">
          <h3 className="ttc-title">Red, green, refactor</h3>
          <p className="ttc-sub">
            Write a failing test, make it pass with the smallest change, then clean up &mdash;
            and repeat, growing the function one requirement at a time.
          </p>
        </div>
        <button type="button" className="ttc-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="ttc-body">
        <div className="ttc-stage">
          <svg viewBox={`0 0 ${W} ${H}`} className="ttc-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="ttc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 L10 5 L0 10 z" className="ttc-arrow-head" />
              </marker>
              <marker id="ttc-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 L10 5 L0 10 z" className="ttc-arrow-head-hot" />
              </marker>
            </defs>

            {arcs.map((a) => (
              <path
                key={`arc-${a.i}`}
                d={`M ${a.from.x} ${a.from.y} Q ${a.cxp} ${a.cyp} ${a.to.x} ${a.to.y}`}
                className={`ttc-arc${a.hot ? ' is-hot' : ''}`}
                markerEnd={a.hot ? 'url(#ttc-arrow-hot)' : 'url(#ttc-arrow)'}
              />
            ))}

            {PHASES.map((p, i) => {
              const pos = NODE_POS[i];
              const active = i === phaseIndex;
              return (
                <g key={p.key} className={`ttc-node ${p.cls}${active ? ' is-active' : ''}`}>
                  <circle cx={pos.x} cy={pos.y} r={34} className="ttc-node-disc" />
                  <text x={pos.x} y={pos.y - 2} className="ttc-node-label" textAnchor="middle">{p.label}</text>
                  <text x={pos.x} y={pos.y + 12} className="ttc-node-sub" textAnchor="middle">
                    {p.pass ? 'pass' : 'fail'}
                  </text>
                </g>
              );
            })}

            {/* centre status chip: RED fail / GREEN pass */}
            <g className={`ttc-chip ${phase.pass ? 'is-pass' : 'is-fail'}`}>
              <rect x={CENTER.x - 42} y={CENTER.y - 18} width={84} height={36} rx={9} className="ttc-chip-box" />
              <g transform={`translate(${CENTER.x - 30}, ${CENTER.y - 8})`} className="ttc-chip-icon">
                {phase.pass ? <Check size={16} /> : <X size={16} />}
              </g>
              <text x={CENTER.x + 8} y={CENTER.y + 5} className="ttc-chip-text" textAnchor="middle">
                {phase.pass ? 'PASS' : 'FAIL'}
              </text>
            </g>
          </svg>
        </div>

        <div className="ttc-code">
          <div className="ttc-code-head">
            <span className="ttc-code-tag">test</span>
            <span className="ttc-code-test">{iteration.test}</span>
          </div>
          <pre className="ttc-code-pre">
            {iteration.lines.map((ln, i) => (
              <span key={i} className="ttc-code-line">{ln || ' '}</span>
            ))}
          </pre>
        </div>
      </div>

      <div className="ttc-controls">
        <button type="button" className="ttc-btn" onClick={togglePlay}>
          {playing && step < TOTAL ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < TOTAL ? 'Pause' : (step >= TOTAL ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="ttc-btn" onClick={() => setStep((s) => Math.min(TOTAL, s + 1))} disabled={step >= TOTAL}>
          <SkipForward size={14} /> Step
        </button>
        <label className="ttc-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="ttc-speed-range"
          />
          <span className="ttc-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="ttc-progress">{Math.min(step, TOTAL) + 1} / {TOTAL + 1}</span>
      </div>

      <div className="ttc-readout">
        <div className={`ttc-stat is-phase ${phase.cls}`}>
          <span className="ttc-stat-label">phase</span>
          <span className="ttc-stat-val">{phase.label}</span>
        </div>
        <div className="ttc-stat is-iter">
          <span className="ttc-stat-label">iteration</span>
          <span className="ttc-stat-val">{cur.iter + 1} / {ITERATIONS.length}</span>
        </div>
        <div className="ttc-stat is-pass">
          <span className="ttc-stat-label">tests passing</span>
          <span className="ttc-stat-val">{passing} / {iteration.tests}</span>
        </div>
      </div>

      <div className="ttc-note">
        <span className="ttc-note-label">now</span>
        <span className="ttc-note-body">{PHASE_TEXT[cur.phase]}</span>
      </div>
    </div>
  );
}
