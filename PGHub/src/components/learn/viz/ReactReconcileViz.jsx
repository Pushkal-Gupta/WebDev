import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GitCompareArrows, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './ReactReconcileViz.css';

// Deterministic reconciliation walk. No randomness anywhere.
// OLD tree (left lane) vs NEW tree (right lane), each flowing top-to-bottom.
// Example: keyC is removed, keyB's value changes, keyD is added; keyA is kept.

const NODES = [
  // OLD lane
  { id: 'o-ul', lane: 'old', kind: 'root', label: 'ul', sub: 'root', x: 81, y: 46, w: 70, h: 40, final: 'matched', decidedAt: 1 },
  { id: 'o-a', lane: 'old', kind: 'leaf', label: 'A', sub: 'keyA', x: 27, y: 152, w: 54, h: 48, final: 'matched', decidedAt: 2 },
  { id: 'o-b', lane: 'old', kind: 'leaf', label: 'B', sub: 'keyB', x: 89, y: 152, w: 54, h: 48, final: 'matched', decidedAt: 3 },
  { id: 'o-c', lane: 'old', kind: 'leaf', label: 'C', sub: 'keyC', x: 151, y: 152, w: 54, h: 48, final: 'removed', decidedAt: 4 },
  // NEW lane
  { id: 'n-ul', lane: 'new', kind: 'root', label: 'ul', sub: 'root', x: 329, y: 46, w: 70, h: 40, final: 'keep', decidedAt: 1 },
  { id: 'n-a', lane: 'new', kind: 'leaf', label: 'A', sub: 'keyA', x: 275, y: 152, w: 54, h: 48, final: 'keep', decidedAt: 2 },
  { id: 'n-b', lane: 'new', kind: 'leaf', label: 'B*', sub: 'keyB', x: 337, y: 152, w: 54, h: 48, final: 'changed', decidedAt: 3 },
  { id: 'n-d', lane: 'new', kind: 'leaf', label: 'D', sub: 'keyD', x: 399, y: 152, w: 54, h: 48, final: 'added', decidedAt: 5 },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

const EDGES = [
  { from: 'o-ul', to: 'o-a' }, { from: 'o-ul', to: 'o-b' }, { from: 'o-ul', to: 'o-c' },
  { from: 'n-ul', to: 'n-a' }, { from: 'n-ul', to: 'n-b' }, { from: 'n-ul', to: 'n-d' },
];

// Each step: which nodes are being compared + the narration for the panel.
const STEPS = [
  { focus: [], text: 'Render re-runs the component and builds a fresh virtual-DOM tree for the new state.' },
  { focus: ['o-ul', 'n-ul'], text: 'Compare the roots: both are <ul>, same type -> keep the node and recurse into children.' },
  { focus: ['o-a', 'n-a'], text: 'keyA matched: value A is unchanged -> keep this <li> in place, no patch.' },
  { focus: ['o-b', 'n-b'], text: 'keyB matched: value B -> B* changed -> UPDATE patch on the existing node.' },
  { focus: ['o-c'], text: 'keyC exists in old but not in new -> REMOVE: unmount that <li>.' },
  { focus: ['n-d'], text: 'keyD is new -> ADD: mount a fresh <li> at its position.' },
  { focus: ['n-b', 'n-d', 'o-c'], text: 'Commit: apply the minimal patch set to the real DOM in one pass. Kept nodes are untouched.' },
];

const W = 480;
const H = 224;

const cx = (n) => n.x + n.w / 2;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ReactReconcileViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = STEPS.length - 1;
  const current = STEPS[Math.min(step, total)];
  const focusSet = useMemo(() => new Set(current.focus), [current]);

  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 460 : 1100) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  // A node is "revealed/decided" once the walk has passed its decidedAt step.
  const stateOf = useMemo(() => (node) => {
    if (step < node.decidedAt) return node.lane === 'new' ? 'pending' : 'idle';
    return node.final;
  }, [step]);

  // Cumulative patch counts based on decisions made so far.
  const counts = useMemo(() => {
    const c = { added: 0, changed: 0, removed: 0 };
    for (const n of NODES) {
      if (step < n.decidedAt) continue;
      if (n.final === 'added') c.added += 1;
      else if (n.final === 'changed') c.changed += 1;
      else if (n.final === 'removed') c.removed += 1;
    }
    return c;
  }, [step]);

  const patches = counts.added + counts.changed + counts.removed;

  return (
    <div className="rcv">
      <div className="rcv-head">
        <div className="rcv-head-icon"><GitCompareArrows size={18} /></div>
        <div className="rcv-head-text">
          <h3 className="rcv-title">Reconciliation: diffing two trees</h3>
          <p className="rcv-sub">
            React re-computes a virtual-DOM tree on every render, matches it against the previous
            one by key, and commits only the nodes that actually changed.
          </p>
        </div>
        <button type="button" className="rcv-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="rcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="rcv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="rcv-arrow-head" />
            </marker>
          </defs>

          <line className="rcv-divider" x1={240} y1={16} x2={240} y2={H - 8} />
          <text className="rcv-lane-label" x={116} y={26} textAnchor="middle">OLD tree</text>
          <text className="rcv-lane-label" x={364} y={26} textAnchor="middle">NEW tree</text>

          {EDGES.map((e) => {
            const f = NODE_BY_ID[e.from];
            const t = NODE_BY_ID[e.to];
            return (
              <line
                key={`${e.from}-${e.to}`}
                x1={cx(f)} y1={f.y + f.h} x2={cx(t)} y2={t.y}
                className="rcv-edge" markerEnd="url(#rcv-arrow)"
              />
            );
          })}

          {NODES.map((n) => {
            const st = stateOf(n);
            const focus = focusSet.has(n.id);
            return (
              <g key={n.id} className={`rcv-node is-${st}${focus ? ' is-focus' : ''}`}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={9} className="rcv-node-box" />
                <text x={cx(n)} y={n.kind === 'root' ? n.y + 25 : n.y + 22} className="rcv-node-label" textAnchor="middle">{n.label}</text>
                {n.kind === 'leaf' && (
                  <text x={cx(n)} y={n.y + 38} className="rcv-node-sub" textAnchor="middle">{n.sub}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rcv-controls">
        <button type="button" className="rcv-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="rcv-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="rcv-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="rcv-speed-range"
          />
          <span className="rcv-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="rcv-progress">{Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="rcv-readout">
        <div className="rcv-stat is-added">
          <span className="rcv-stat-label">added</span>
          <span className="rcv-stat-val">{counts.added}</span>
        </div>
        <div className="rcv-stat is-changed">
          <span className="rcv-stat-label">changed</span>
          <span className="rcv-stat-val">{counts.changed}</span>
        </div>
        <div className="rcv-stat is-removed">
          <span className="rcv-stat-label">removed</span>
          <span className="rcv-stat-val">{counts.removed}</span>
        </div>
        <div className="rcv-stat is-patched">
          <span className="rcv-stat-label">DOM patches</span>
          <span className="rcv-stat-val">{patches}</span>
        </div>
      </div>

      <div className="rcv-note">
        <span className="rcv-note-label">now</span>
        <span className="rcv-note-body">{current.text}</span>
      </div>
    </div>
  );
}
