import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, ChevronRight, RotateCcw, GitBranch, Check, X } from 'lucide-react';
import './RegexEngineBuildViz.css';

const W = 880;
const H = 300;

// A small hand-built Thompson NFA for the pattern a(b|c)*  .
// states: 0 start -> reads 'a' -> 1 ; from 1 epsilon to {2(b-in),4(c-in),accept}
// 2 reads 'b' -> 3 -> epsilon back to 1 ; 4 reads 'c' -> 5 -> epsilon back to 1.
// accept state = 6.
const STATES = [
  { id: 0, x: 70, y: 150, label: 'S', kind: 'start' },
  { id: 1, x: 230, y: 150, label: '1', kind: 'fork' },
  { id: 2, x: 400, y: 80, label: '2', kind: 'mid' },
  { id: 3, x: 560, y: 80, label: '3', kind: 'mid' },
  { id: 4, x: 400, y: 220, label: '4', kind: 'mid' },
  { id: 5, x: 560, y: 220, label: '5', kind: 'mid' },
  { id: 6, x: 780, y: 150, label: 'A', kind: 'accept' },
];

// edges: {from,to,label}  label '' = epsilon
const EDGES = [
  { from: 0, to: 1, label: 'a' },
  { from: 1, to: 2, label: '' },
  { from: 1, to: 4, label: '' },
  { from: 1, to: 6, label: '' },
  { from: 2, to: 3, label: 'b' },
  { from: 3, to: 1, label: '' },
  { from: 4, to: 5, label: 'c' },
  { from: 5, to: 1, label: '' },
];

const ACCEPT = 6;

function epsilonClosure(set) {
  const stack = [...set];
  const out = new Set(set);
  while (stack.length) {
    const s = stack.pop();
    for (const e of EDGES) {
      if (e.from === s && e.label === '' && !out.has(e.to)) {
        out.add(e.to);
        stack.push(e.to);
      }
    }
  }
  return out;
}

function step(set, ch) {
  const next = new Set();
  for (const s of set) {
    for (const e of EDGES) {
      if (e.from === s && e.label === ch) next.add(e.to);
    }
  }
  return epsilonClosure(next);
}

function simulate(input) {
  const frames = [];
  let cur = epsilonClosure(new Set([0]));
  frames.push({ pos: -1, ch: null, active: cur, consumed: '' });
  for (let i = 0; i < input.length; i++) {
    cur = step(cur, input[i]);
    frames.push({ pos: i, ch: input[i], active: cur, consumed: input.slice(0, i + 1) });
  }
  return frames;
}

const PRESETS = ['abcb', 'acccb', 'a', 'abx'];

export default function RegexEngineBuildViz() {
  const [input, setInput] = useState('abcb');
  const [step_, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const frames = useMemo(() => simulate(input), [input]);
  const total = frames.length;
  const cur = frames[Math.min(step_, total - 1)];
  const isPlaying = playing && step_ < total - 1;

  useEffect(() => {
    if (!isPlaying) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), 650);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [isPlaying, step_, total]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const atEnd = step_ >= total - 1;
  const accepted = atEnd && cur.active.has(ACCEPT);

  const reset = () => { setPlaying(false); setStep(0); };
  const setPattern = (s) => { setPlaying(false); setStep(0); setInput(s); };

  const activeSet = cur.active;
  const stateById = (id) => STATES.find((s) => s.id === id);

  return (
    <div className="rgxb">
      <div className="rgxb-head">
        <span className="rgxb-head-icon"><GitBranch size={16} /></span>
        <span className="rgxb-head-text">
          <span className="rgxb-head-title">Thompson NFA simulation</span>
          <span className="rgxb-head-sub">
            pattern <code>a(b|c)*</code> — advance the input one char and watch the whole active-state set move in lockstep
          </span>
        </span>
        <span className="rgxb-chip">|active| = {activeSet.size}</span>
      </div>

      <div className="rgxb-tape">
        {input.split('').map((c, i) => (
          <span
            key={i}
            className={`rgxb-cell${i < cur.consumed.length ? ' is-done' : ''}${i === cur.pos ? ' is-cur' : ''}`}
          >
            {c}
          </span>
        ))}
        {input.length === 0 && <span className="rgxb-cell rgxb-cell-empty">ε</span>}
      </div>

      <div className="rgxb-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rgxb-svg" preserveAspectRatio="xMidYMid meet">
          {/* edges */}
          {EDGES.map((e, i) => {
            const a = stateById(e.from);
            const b = stateById(e.to);
            const isEps = e.label === '';
            // curve loops-back edges
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 + (e.from > e.to ? -36 : 0);
            const justFired = cur.ch && !isEps && e.label === cur.ch &&
              activeSet.has(e.to) && frames[step_ - 1]?.active.has(e.from);
            const cls = `rgxb-edge${isEps ? ' is-eps' : ''}${justFired ? ' is-fired' : ''}`;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len; const uy = dy / len;
            const ex = b.x - ux * 20; const ey = b.y - uy * 20;
            return (
              <g key={`e-${i}`}>
                <path
                  className={cls}
                  d={e.from > e.to
                    ? `M ${a.x} ${a.y} Q ${mx} ${my} ${ex} ${ey}`
                    : `M ${a.x + ux * 20} ${a.y + uy * 20} L ${ex} ${ey}`}
                  fill="none"
                  markerEnd={`url(#rgxb-arrow${justFired ? '-on' : ''})`}
                />
                <text className={`rgxb-edge-label${isEps ? ' is-eps' : ''}`} x={mx} y={my - 6} textAnchor="middle">
                  {isEps ? 'ε' : e.label}
                </text>
              </g>
            );
          })}

          {/* nodes */}
          {STATES.map((s) => {
            const on = activeSet.has(s.id);
            const isAccept = s.id === ACCEPT;
            const cls = [
              'rgxb-node',
              on ? 'is-active' : '',
              s.kind === 'start' ? 'is-start' : '',
              isAccept ? 'is-accept' : '',
              isAccept && on && atEnd ? 'is-win' : '',
            ].filter(Boolean).join(' ');
            return (
              <g key={`n-${s.id}`}>
                {isAccept && <circle className="rgxb-node-ring" cx={s.x} cy={s.y} r="24" />}
                <circle className={cls} cx={s.x} cy={s.y} r="19" />
                <text className="rgxb-node-label" x={s.x} y={s.y + 5} textAnchor="middle">{s.label}</text>
              </g>
            );
          })}

          <defs>
            <marker id="rgxb-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--border)" />
            </marker>
            <marker id="rgxb-arrow-on" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--accent)" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="rgxb-cards">
        <div className="rgxb-card rgxb-card-accent">
          <span className="rgxb-card-label">active states</span>
          <span className="rgxb-card-val">{'{' + [...activeSet].sort((a, b) => a - b).map((id) => stateById(id).label).join(', ') + '}'}</span>
        </div>
        <div className="rgxb-card">
          <span className="rgxb-card-label">just read</span>
          <span className="rgxb-card-val">{cur.ch ? cur.ch : 'ε (start)'}</span>
        </div>
        <div className={`rgxb-card${atEnd ? (accepted ? ' rgxb-card-win' : ' rgxb-card-fail') : ''}`}>
          <span className="rgxb-card-label">verdict</span>
          <span className="rgxb-card-val rgxb-verdict">
            {atEnd ? (accepted ? <><Check size={13} /> match</> : <><X size={13} /> no match</>) : 'running…'}
          </span>
        </div>
      </div>

      <div className="rgxb-controls">
        <div className="rgxb-presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`rgxb-preset${input === p ? ' is-on' : ''}`}
              onClick={() => setPattern(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="rgxb-spacer" />
        <button type="button" className="rgxb-btn rgxb-btn-primary" onClick={() => (atEnd ? reset() : setPlaying((v) => !v))}>
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? 'Pause' : atEnd ? 'Replay' : 'Play'}
        </button>
        <button type="button" className="rgxb-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={atEnd}>
          <ChevronRight size={14} /> Step
        </button>
        <button type="button" className="rgxb-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="rgxb-narration">
        <span className="rgxb-narration-label">step {step_ + 1} / {total}</span>
        <span className="rgxb-narration-body">
          {cur.pos < 0
            ? 'Start: ε-closure of the start state — every state reachable without consuming a character is active before reading anything.'
            : `Read '${cur.ch}': every active state with a matching edge advances, then ε-closure expands the new frontier. Tracking the whole set at once is why this stays O(m·n) — no backtracking.`}
        </span>
      </div>
    </div>
  );
}
