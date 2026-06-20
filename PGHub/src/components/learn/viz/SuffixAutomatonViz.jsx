import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './SuffixAutomatonViz.css';

const STRINGS = ['abab', 'abcbc', 'aabba'];

function cloneState(s) {
  return {
    len: s.len,
    link: s.link,
    next: { ...s.next },
    cloned: !!s.cloned,
  };
}

function snapshot(states, last) {
  return {
    states: states.map(cloneState),
    last,
  };
}

function buildFrames(str) {
  // Standard online SAM construction
  const states = [];
  // initial state
  states.push({ len: 0, link: -1, next: {}, cloned: false });
  let last = 0;
  const frames = [];

  frames.push({
    snap: snapshot(states, last),
    activeChar: -1,
    activeState: 0,
    highlightStates: new Set([0]),
    highlightLinks: new Set(),
    note: 'Initial state q0 (the empty word). len=0, link=−1. Reads any prefix of the empty language.',
  });

  for (let i = 0; i < str.length; i++) {
    const c = str[i];

    // Create new state cur
    const cur = states.length;
    states.push({ len: states[last].len + 1, link: -1, next: {}, cloned: false });

    frames.push({
      snap: snapshot(states, last),
      activeChar: i,
      activeState: cur,
      highlightStates: new Set([cur, last]),
      highlightLinks: new Set(),
      note: `Read '${c}'. Create new state q${cur} with len = ${states[cur].len}. last was q${last}.`,
    });

    let p = last;
    while (p !== -1 && !(c in states[p].next)) {
      states[p].next[c] = cur;
      p = states[p].link;
    }

    frames.push({
      snap: snapshot(states, last),
      activeChar: i,
      activeState: cur,
      highlightStates: new Set([cur]),
      highlightLinks: new Set(),
      note: `Walk suffix links from last (q${last}), adding '${c}'-transition → q${cur} wherever it's missing. Stopped at ${p === -1 ? 'q0 chain end' : `q${p} (already has '${c}')`}.`,
    });

    if (p === -1) {
      states[cur].link = 0;
      frames.push({
        snap: snapshot(states, last),
        activeChar: i,
        activeState: cur,
        highlightStates: new Set([cur, 0]),
        highlightLinks: new Set([`${cur}->${0}`]),
        note: `Reached the initial state's suffix chain. Set link(q${cur}) = q0.`,
      });
    } else {
      const q = states[p].next[c];
      if (states[p].len + 1 === states[q].len) {
        states[cur].link = q;
        frames.push({
          snap: snapshot(states, last),
          activeChar: i,
          activeState: cur,
          highlightStates: new Set([cur, q]),
          highlightLinks: new Set([`${cur}->${q}`]),
          note: `q${p} has '${c}'-transition to q${q} and len(q${p})+1 === len(q${q}). Set link(q${cur}) = q${q}.`,
        });
      } else {
        // Clone q
        const clone = states.length;
        states.push({
          len: states[p].len + 1,
          link: states[q].link,
          next: { ...states[q].next },
          cloned: true,
        });
        frames.push({
          snap: snapshot(states, last),
          activeChar: i,
          activeState: clone,
          highlightStates: new Set([clone, q]),
          highlightLinks: new Set(),
          note: `len(q${p})+1 ≠ len(q${q}). Clone q${q} → q${clone} with len = ${states[clone].len}, copying its transitions and suffix link.`,
        });

        // redirect suffix links: walk p back, redirect transitions from q to clone
        while (p !== -1 && states[p].next[c] === q) {
          states[p].next[c] = clone;
          p = states[p].link;
        }
        states[q].link = clone;
        states[cur].link = clone;

        frames.push({
          snap: snapshot(states, last),
          activeChar: i,
          activeState: cur,
          highlightStates: new Set([cur, q, clone]),
          highlightLinks: new Set([`${cur}->${clone}`, `${q}->${clone}`]),
          note: `Redirect '${c}'-transitions from q${q} → q${clone} up the suffix chain. Set link(q${q}) = link(q${cur}) = q${clone}.`,
        });
      }
    }

    last = cur;

    frames.push({
      snap: snapshot(states, last),
      activeChar: i,
      activeState: cur,
      highlightStates: new Set([cur]),
      highlightLinks: new Set(),
      note: `Done with character '${c}'. last = q${cur}.`,
    });
  }

  frames.push({
    snap: snapshot(states, last),
    activeChar: str.length,
    activeState: last,
    highlightStates: new Set(),
    highlightLinks: new Set(),
    note: `Suffix automaton built. ${states.length} states, ≤ 2n − 1 = ${2 * str.length - 1}. All distinct substrings recognized.`,
  });

  return frames;
}

// Layout states by len -> column, depth (parent chain) -> row
function layoutStates(states) {
  const pos = new Map();
  // group by len
  const byLen = new Map();
  states.forEach((s, idx) => {
    if (!byLen.has(s.len)) byLen.set(s.len, []);
    byLen.get(s.len).push(idx);
  });
  const lens = Array.from(byLen.keys()).sort((a, b) => a - b);
  const colW = 130;
  const rowH = 80;
  const padX = 40;
  const padY = 40;
  lens.forEach((L, colIdx) => {
    const ids = byLen.get(L);
    ids.forEach((id, rowIdx) => {
      pos.set(id, {
        x: padX + colIdx * colW,
        y: padY + rowIdx * rowH,
      });
    });
  });
  const maxRows = Math.max(...lens.map((L) => byLen.get(L).length));
  const W = padX * 2 + Math.max(lens.length - 1, 0) * colW + 60;
  const H = padY * 2 + Math.max(maxRows - 1, 0) * rowH + 60;
  return { pos, W, H };
}

export default function SuffixAutomatonViz() {
  const [stringIdx, setStringIdx] = useState(0);
  const str = STRINGS[stringIdx];
  const frames = useMemo(() => buildFrames(str), [str]);
  const totalSteps = frames.length;
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

  useEffect(() => {
    if (!isRunning) return;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const onStringChange = (e) => {
    setStringIdx(Number(e.target.value));
    setStep(0);
    setIsRunningRaw(false);
  };

  const states = current.snap.states;
  const { pos, W, H } = useMemo(() => layoutStates(states), [states]);

  // Compute edges: transitions and suffix links
  const transitions = [];
  states.forEach((s, idx) => {
    Object.entries(s.next).forEach(([ch, to]) => {
      transitions.push({ from: idx, to, ch });
    });
  });
  const suffixLinks = [];
  states.forEach((s, idx) => {
    if (s.link >= 0) {
      suffixLinks.push({ from: idx, to: s.link });
    }
  });

  // For curved edges, when from === to or for direction matching
  const edgePath = (a, b, curve = 0) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const cx = mx + nx * curve;
    const cy = my + ny * curve;
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  };

  // shorten endpoints to circle boundary
  const trim = (a, b, r) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x: b.x - (dx / len) * r,
      y: b.y - (dy / len) * r,
    };
  };

  return (
    <div className="sav">
      <div className="sav-head">
        <h3 className="sav-title">Suffix automaton — online construction in O(n)</h3>
        <p className="sav-sub">
          The smallest DFA accepting every substring. Each char adds a state and walks the suffix link chain,
          cloning when a transition would corrupt an existing endpos class.
        </p>
      </div>

      <div className="sav-controls">
        <div className="sav-field">
          <span className="sav-label">input string</span>
          <select className="sav-select" value={stringIdx} onChange={onStringChange}>
            {STRINGS.map((s, i) => (
              <option key={i} value={i}>{s}</option>
            ))}
          </select>
        </div>

        <div className="sav-buttons">
          <button
            type="button"
            className="sav-btn sav-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="sav-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="sav-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="sav-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <label className="sav-speed">
          <span className="sav-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="sav-speed-range"
          />
          <span className="sav-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="sav-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="sav-stage">
        <div className="sav-input-row">
          <span className="sav-input-label">stream</span>
          {[...str].map((ch, i) => (
            <span
              key={i}
              className={`sav-char ${i === current.activeChar ? 'sav-char-active' : i < current.activeChar ? 'sav-char-done' : ''}`}
            >
              {ch}
            </span>
          ))}
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="sav-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="sav-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-main)" />
            </marker>
            <marker id="sav-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker id="sav-arrow-link" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          {/* suffix links (curved, dashed pink) */}
          {suffixLinks.map((e, i) => {
            const a = pos.get(e.from);
            const b = pos.get(e.to);
            if (!a || !b) return null;
            const t = trim(a, b, 20);
            const onPath = current.highlightLinks.has(`${e.from}->${e.to}`);
            return (
              <path
                key={`sl-${i}`}
                d={edgePath(a, t, -22)}
                fill="none"
                stroke={onPath ? 'var(--accent)' : 'var(--hue-pink)'}
                strokeWidth={onPath ? 2.2 : 1.2}
                strokeDasharray="4 3"
                markerEnd={onPath ? 'url(#sav-arrow-on)' : 'url(#sav-arrow-link)'}
                opacity={onPath ? 1 : 0.7}
              />
            );
          })}

          {/* transitions (solid) */}
          {transitions.map((e, i) => {
            const a = pos.get(e.from);
            const b = pos.get(e.to);
            if (!a || !b) return null;
            const t = trim(a, b, 20);
            const dy = b.y - a.y;
            // curve transitions when there are multiple between same column
            const curve = Math.abs(dy) < 5 ? 0 : 0;
            return (
              <g key={`tr-${i}`}>
                <path
                  d={edgePath(a, t, curve)}
                  fill="none"
                  stroke="var(--text-main)"
                  strokeWidth={1.4}
                  markerEnd="url(#sav-arrow)"
                />
                <text
                  x={(a.x + t.x) / 2}
                  y={(a.y + t.y) / 2 - 6}
                  className="sav-edge-label"
                >
                  {e.ch}
                </text>
              </g>
            );
          })}

          {/* states */}
          {states.map((s, idx) => {
            const p = pos.get(idx);
            if (!p) return null;
            const isActive = idx === current.activeState;
            const isHighlight = current.highlightStates.has(idx);
            return (
              <g key={`st-${idx}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={20}
                  fill={
                    isActive
                      ? 'rgba(var(--accent-rgb), 0.18)'
                      : isHighlight
                      ? 'rgba(var(--hue-sky-rgb, 56, 189, 248), 0.10)'
                      : 'var(--surface)'
                  }
                  stroke={
                    isActive
                      ? 'var(--accent)'
                      : isHighlight
                      ? 'var(--hue-sky)'
                      : s.cloned
                      ? 'var(--hue-mint)'
                      : 'var(--border)'
                  }
                  strokeWidth={isActive ? 2.4 : 1.5}
                  strokeDasharray={s.cloned ? '4 3' : undefined}
                />
                <text x={p.x} y={p.y - 1} className="sav-node-id">q{idx}</text>
                <text x={p.x} y={p.y + 12} className="sav-node-meta">len={s.len}</text>
              </g>
            );
          })}
        </svg>

        <div className="sav-legend">
          <span className="sav-legend-item">
            <span className="sav-legend-swatch" style={{ background: 'var(--text-main)' }} />
            transition
          </span>
          <span className="sav-legend-item">
            <span className="sav-legend-swatch" style={{ background: 'var(--hue-pink)' }} />
            suffix link
          </span>
          <span className="sav-legend-item">
            <span className="sav-legend-swatch" style={{ background: 'var(--hue-mint)' }} />
            cloned state
          </span>
          <span className="sav-legend-item">
            <span className="sav-legend-swatch" style={{ background: 'var(--accent)' }} />
            active
          </span>
        </div>
      </div>

      <div className="sav-metrics">
        <div className="sav-metric">
          <span className="sav-metric-label">states</span>
          <span className="sav-metric-value">{states.length}</span>
        </div>
        <div className="sav-metric">
          <span className="sav-metric-label">last</span>
          <span className="sav-metric-value">q{current.snap.last}</span>
        </div>
        <div className="sav-metric">
          <span className="sav-metric-label">char read</span>
          <span className="sav-metric-value">
            {current.activeChar >= 0 && current.activeChar < str.length ? str[current.activeChar] : '—'}
          </span>
        </div>
        <div className="sav-metric">
          <span className="sav-metric-label">cloned</span>
          <span className="sav-metric-value">{states.filter((s) => s.cloned).length}</span>
        </div>
        <div className="sav-metric sav-metric-dim">
          <span className="sav-metric-label">bound</span>
          <span className="sav-metric-value sav-metric-dimval">≤ {Math.max(2 * str.length - 1, 1)}</span>
        </div>
      </div>

      <div className="sav-arith">
        <span className="sav-arith-label">trace</span>
        <span className="sav-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
