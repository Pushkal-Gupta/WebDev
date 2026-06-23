import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Regex, Play, Pause, StepForward, RotateCcw, CircleDot, Type } from 'lucide-react';
import './RegexEngineViz.css';

// How a regex engine matches via an NFA built Thompson-style.
//
// A regex compiles to a non-deterministic finite automaton: states (circles)
// connected by edges labelled either with a literal character, "." (any), or
// "ε" (a free move taken without consuming input). To match a string, the
// engine does NOT backtrack one path at a time — it tracks a SET of active
// states at once. Each input character advances every active state in
// parallel, then ε-closure pulls in everything reachable for free. If the
// accept state is in the active set when the input runs out, the string
// matches. Because the active set can hold at most |states| entries, the
// whole run is O(states × input) — no exponential blowup, no catastrophic
// backtracking the way a naive recursive matcher suffers.

// Each preset is a hand-compiled NFA (deterministic layout, no Math.random).
// nodes: { id, x, y, accept? }. edges: { from, to, label } where label === 'ε'
// is a free move and label === '.' matches any single character.
const PRESETS = [
  {
    id: 'star',
    pattern: 'a(b|c)*d',
    desc: 'an a, then any run of b or c, then a d',
    start: 0,
    nodes: [
      { id: 0, x: 60, y: 150 },
      { id: 1, x: 175, y: 150 },
      { id: 2, x: 300, y: 70 },
      { id: 3, x: 300, y: 230 },
      { id: 4, x: 430, y: 150 },
      { id: 5, x: 560, y: 150, accept: true },
    ],
    edges: [
      { from: 0, to: 1, label: 'a' },
      { from: 1, to: 2, label: 'ε' },
      { from: 1, to: 3, label: 'ε' },
      { from: 1, to: 4, label: 'ε' },
      { from: 2, to: 1, label: 'b' },
      { from: 3, to: 1, label: 'c' },
      { from: 4, to: 5, label: 'd' },
    ],
    inputs: ['abccbd', 'ad', 'abx', 'acd'],
  },
  {
    id: 'plus',
    pattern: 'ab+c',
    desc: 'an a, one or more b, then a c',
    start: 0,
    nodes: [
      { id: 0, x: 70, y: 150 },
      { id: 1, x: 210, y: 150 },
      { id: 2, x: 350, y: 150 },
      { id: 3, x: 490, y: 150, accept: true },
    ],
    edges: [
      { from: 0, to: 1, label: 'a' },
      { from: 1, to: 2, label: 'b' },
      { from: 2, to: 2, label: 'b' },
      { from: 2, to: 3, label: 'c' },
    ],
    inputs: ['abbbc', 'abc', 'ac', 'abbz'],
  },
  {
    id: 'dot',
    pattern: 'a.c',
    desc: 'an a, any single character, then a c',
    start: 0,
    nodes: [
      { id: 0, x: 90, y: 150 },
      { id: 1, x: 250, y: 150 },
      { id: 2, x: 410, y: 150 },
      { id: 3, x: 560, y: 150, accept: true },
    ],
    edges: [
      { from: 0, to: 1, label: 'a' },
      { from: 1, to: 2, label: '.' },
      { from: 2, to: 3, label: 'c' },
    ],
    inputs: ['axc', 'abc', 'aXc', 'ac'],
  },
];

// ε-closure: every state reachable from `states` through ε edges only.
function epsilonClosure(states, edges) {
  const out = new Set(states);
  const stack = [...states];
  while (stack.length) {
    const s = stack.pop();
    for (const e of edges) {
      if (e.from === s && e.label === 'ε' && !out.has(e.to)) {
        out.add(e.to);
        stack.push(e.to);
      }
    }
  }
  return out;
}

// Advance an active set on one input char, then take the ε-closure.
function stepNFA(active, ch, edges) {
  const moved = new Set();
  for (const e of edges) {
    if (e.label === 'ε') continue;
    if (active.has(e.from) && (e.label === '.' || e.label === ch)) {
      moved.add(e.to);
    }
  }
  return epsilonClosure(moved, edges);
}

// Precompute the active-set trace for every position 0..len so stepping is
// just an index lookup — fully deterministic.
function buildTrace(preset, input) {
  const trace = [epsilonClosure([preset.start], preset.edges)];
  let active = trace[0];
  for (const ch of input) {
    active = stepNFA(active, ch, preset.edges);
    trace.push(active);
  }
  return trace;
}

export default function RegexEngineViz() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [input, setInput] = useState(PRESETS[0].inputs[0]);
  const [pos, setPos] = useState(0); // 0 = before first char; len = consumed all
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const preset = PRESETS[presetIdx];

  const trace = useMemo(() => buildTrace(preset, input), [preset, input]);
  const active = trace[Math.min(pos, trace.length - 1)];

  const acceptIds = useMemo(
    () => new Set(preset.nodes.filter((n) => n.accept).map((n) => n.id)),
    [preset]
  );

  const consumedAll = pos >= input.length;
  const matched = consumedAll && [...active].some((s) => acceptIds.has(s));
  const dead = active.size === 0;

  // edges that fire on the next char (for highlighting the live transitions)
  const nextChar = pos < input.length ? input[pos] : null;
  const firingEdges = useMemo(() => {
    if (nextChar == null) return new Set();
    const fired = new Set();
    preset.edges.forEach((e, i) => {
      if (e.label === 'ε') return;
      if (active.has(e.from) && (e.label === '.' || e.label === nextChar)) {
        fired.add(i);
      }
    });
    return fired;
  }, [active, nextChar, preset]);

  const reset = () => {
    setPlaying(false);
    setPos(0);
  };

  const stepFwd = () => {
    setPos((p) => Math.min(p + 1, input.length));
  };

  const pickPreset = (i) => {
    setPlaying(false);
    setPresetIdx(i);
    setInput(PRESETS[i].inputs[0]);
    setPos(0);
  };

  const pickInput = (s) => {
    setPlaying(false);
    setInput(s);
    setPos(0);
  };

  // auto-play stepper, honoring reduced motion
  useEffect(() => {
    if (!playing || pos >= input.length) return undefined;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current = setTimeout(() => {
      setPos((p) => {
        const np = Math.min(p + 1, input.length);
        if (np >= input.length) setPlaying(false);
        return np;
      });
    }, reduce ? 750 : 700);
    return () => clearTimeout(timer.current);
  }, [playing, pos, input.length]);

  // SVG geometry
  const W = 640;
  const H = 300;
  const R = 24;

  const nodeById = (id) => preset.nodes.find((n) => n.id === id);

  // group parallel edges between the same pair so labels don't overlap
  const edgeGeo = useMemo(() => {
    const counts = {};
    return preset.edges.map((e, i) => {
      const key = `${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}`;
      counts[key] = (counts[key] || 0) + 1;
      return { ...e, i, rank: counts[key] - 1 };
    });
  }, [preset]);

  return (
    <div className="rgx">
      <div className="rgx-head">
        <h3 className="rgx-title">Regex engine — NFA simulation, many states at once</h3>
        <p className="rgx-sub">
          A pattern compiles to a state machine. The matcher tracks the whole set of reachable states in parallel —
          step the input and watch the active set expand and contract instead of backtracking down one path.
        </p>
      </div>

      <div className="rgx-controls">
        <div className="rgx-group">
          <span className="rgx-input-label">pattern</span>
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`rgx-chip ${i === presetIdx ? 'is-active' : ''}`}
              onClick={() => pickPreset(i)}
            >
              <Regex size={12} /> {p.pattern}
            </button>
          ))}
        </div>

        <div className="rgx-group">
          <span className="rgx-input-label">input</span>
          {preset.inputs.map((s) => (
            <button
              key={s}
              type="button"
              className={`rgx-chip is-mono ${s === input ? 'is-active' : ''}`}
              onClick={() => pickInput(s)}
            >
              <Type size={12} /> {s}
            </button>
          ))}
        </div>

        <span className="rgx-spacer" aria-hidden="true" />

        <button type="button" className="rgx-btn" onClick={stepFwd} disabled={consumedAll}>
          <StepForward size={14} /> Step
        </button>
        <button
          type="button"
          className={`rgx-btn ${playing ? 'rgx-btn-primary' : ''}`}
          onClick={() => setPlaying((v) => !v)}
          disabled={consumedAll}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="rgx-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="rgx-tape">
        {input.split('').map((ch, i) => {
          const state = i < pos ? 'done' : i === pos ? 'cur' : 'todo';
          return (
            <span key={`${ch}-${i}`} className={`rgx-cell is-${state}`}>
              {ch}
            </span>
          );
        })}
        <span className={`rgx-cell rgx-eof ${consumedAll ? 'is-cur' : ''}`}>$</span>
      </div>

      <div className="rgx-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rgx-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id="rgx-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="rgx-arrow-head" />
            </marker>
            <marker
              id="rgx-arrow-hot"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="rgx-arrow-head-hot" />
            </marker>
          </defs>

          {/* start arrow into the start state */}
          {(() => {
            const s = nodeById(preset.start);
            return (
              <g>
                <line
                  className="rgx-edge rgx-start-edge"
                  x1={s.x - 52}
                  y1={s.y}
                  x2={s.x - R - 4}
                  y2={s.y}
                  markerEnd="url(#rgx-arrow)"
                />
                <text className="rgx-start-label" x={s.x - 54} y={s.y - 8}>
                  start
                </text>
              </g>
            );
          })()}

          {/* edges */}
          {edgeGeo.map((e) => {
            const a = nodeById(e.from);
            const b = nodeById(e.to);
            const hot = firingEdges.has(e.i) || (e.label === 'ε' && active.has(e.from) && active.has(e.to));
            const cls = `rgx-edge ${e.label === 'ε' ? 'is-eps' : ''} ${hot ? 'is-hot' : ''}`;
            const marker = hot ? 'url(#rgx-arrow-hot)' : 'url(#rgx-arrow)';

            // self loop
            if (e.from === e.to) {
              const cx = a.x;
              const cy = a.y - R;
              const d = `M ${cx - 12} ${cy} C ${cx - 30} ${cy - 46}, ${cx + 30} ${cy - 46}, ${cx + 12} ${cy}`;
              return (
                <g key={e.i}>
                  <path className={cls} d={d} fill="none" markerEnd={marker} />
                  <text className={`rgx-edge-label ${hot ? 'is-hot' : ''}`} x={cx} y={cy - 40}>
                    {e.label}
                  </text>
                </g>
              );
            }

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            // perpendicular offset for parallel / return edges
            const curve = e.rank * 36 + (e.from > e.to ? 30 : 0);
            const px = -uy * curve;
            const py = ux * curve;
            const x1 = a.x + ux * (R + 3);
            const y1 = a.y + uy * (R + 3);
            const x2 = b.x - ux * (R + 6);
            const y2 = b.y - uy * (R + 6);
            const mx = (x1 + x2) / 2 + px;
            const my = (y1 + y2) / 2 + py;
            const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
            const lx = (x1 + x2) / 2 + px * 1.18;
            const ly = (y1 + y2) / 2 + py * 1.18;
            return (
              <g key={e.i}>
                <path className={cls} d={d} fill="none" markerEnd={marker} />
                <text className={`rgx-edge-label ${e.label === 'ε' ? 'is-eps' : ''} ${hot ? 'is-hot' : ''}`} x={lx} y={ly}>
                  {e.label}
                </text>
              </g>
            );
          })}

          {/* nodes */}
          {preset.nodes.map((n) => {
            const isActive = active.has(n.id);
            const isAcc = !!n.accept;
            return (
              <g key={n.id}>
                {isAcc && (
                  <circle
                    className={`rgx-node-ring ${isActive ? 'is-active' : ''}`}
                    cx={n.x}
                    cy={n.y}
                    r={R + 5}
                  />
                )}
                <circle
                  className={`rgx-node ${isActive ? 'is-active' : ''} ${isAcc ? 'is-accept' : ''}`}
                  cx={n.x}
                  cy={n.y}
                  r={R}
                />
                <text className={`rgx-node-label ${isActive ? 'is-active' : ''}`} x={n.x} y={n.y + 5}>
                  q{n.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rgx-metrics">
        <div className="rgx-metric">
          <span className="rgx-metric-label">position</span>
          <span className="rgx-metric-value">
            {pos} / {input.length}
          </span>
        </div>
        <div className="rgx-metric">
          <span className="rgx-metric-label">next char</span>
          <span className="rgx-metric-value is-sky">{nextChar == null ? '— (end)' : `'${nextChar}'`}</span>
        </div>
        <div className="rgx-metric">
          <span className="rgx-metric-label">active states</span>
          <span className="rgx-metric-value is-violet">
            {active.size ? [...active].sort((a, b) => a - b).map((s) => `q${s}`).join(' ') : '∅ (dead)'}
          </span>
        </div>
        <div className="rgx-metric">
          <span className="rgx-metric-label">verdict</span>
          <span
            className={`rgx-metric-value ${
              !consumedAll ? 'is-pending' : matched ? 'is-match' : 'is-nomatch'
            }`}
          >
            {!consumedAll ? 'running…' : matched ? 'MATCH' : dead ? 'no match (dead)' : 'no match'}
          </span>
        </div>
      </div>

      <div className="rgx-legend">
        <span className="rgx-leg">
          <CircleDot size={13} className="rgx-leg-ic is-active" /> active state
        </span>
        <span className="rgx-leg">
          <span className="rgx-leg-swatch is-accept" /> accept (double ring)
        </span>
        <span className="rgx-leg">
          <span className="rgx-leg-line is-eps" /> ε free move
        </span>
        <span className="rgx-leg">
          <span className="rgx-leg-line is-hot" /> firing this step
        </span>
      </div>

      <div className="rgx-narration">
        <span className="rgx-narration-label">why it matters</span>
        <span className="rgx-narration-body">
          A naive matcher tries one path, hits a dead end, and backtracks — and for patterns like{' '}
          <code className="rgx-code">(a+)+$</code> against a long non-match it can explode into exponential time.
          The NFA simulation never backtracks: it keeps every reachable state alive at once, so each input character
          does at most |states| work. Run is O(states × input) — linear in the text, no catastrophic blowup. That set
          of {active.size} active state{active.size === 1 ? '' : 's'} is the whole trick.
        </span>
      </div>
    </div>
  );
}
