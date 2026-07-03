import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Workflow, Play, Pause, SkipForward, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react';
import './OsDeadlockViz.css';

// Node centers for the resource-allocation graph (square layout so a cycle is visible).
const P1 = [128, 74];
const R1 = [392, 74];
const P2 = [392, 206];
const R2 = [128, 206];
const NR = 32;

function trim(a, b, r) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return [a[0] + (dx / L) * r, a[1] + (dy / L) * r];
}

// edge: { id, type: 'assign' | 'request', from, to }
const E = {
  a_r1p1: { id: 'a_r1p1', type: 'assign', from: R1, to: P1 },   // R1 held by P1
  a_r2p2: { id: 'a_r2p2', type: 'assign', from: R2, to: P2 },   // R2 held by P2
  q_p1r2: { id: 'q_p1r2', type: 'request', from: P1, to: R2 },  // P1 wants R2
  q_p2r1: { id: 'q_p2r1', type: 'request', from: P2, to: R1 },  // P2 wants R1
  q_p2r1b: { id: 'q_p2r1b', type: 'request', from: P2, to: R1 }, // P2 waits for R1 (safe)
  a_r2p1: { id: 'a_r2p1', type: 'assign', from: R2, to: P1 },   // R2 held by P1 (safe)
  a_r1p2: { id: 'a_r1p2', type: 'assign', from: R1, to: P2 },   // P2 gets R1 after release
  a_r2p2b: { id: 'a_r2p2b', type: 'assign', from: R2, to: P2 }, // P2 gets R2 after release
};

const MODES = {
  deadlock: {
    cycle: true,
    steps: [
      { edges: ['a_r1p1'], coffman: ['mutex', 'nopreempt'], note: 'P1 acquires R1 — an assignment edge R1 → P1. Mutual exclusion: R1 is held exclusively.' },
      { edges: ['a_r1p1', 'a_r2p2'], coffman: [], note: 'P2 acquires R2 — assignment edge R2 → P2. Each process now holds one resource.' },
      { edges: ['a_r1p1', 'a_r2p2', 'q_p1r2'], coffman: ['holdwait'], note: 'P1 requests R2 (held by P2) and blocks while still holding R1 — hold and wait.' },
      { edges: ['a_r1p1', 'a_r2p2', 'q_p1r2', 'q_p2r1'], cycle: true, coffman: ['circular'], note: 'P2 requests R1 (held by P1). The edges close a cycle P1 → R2 → P2 → R1 → P1 — DEADLOCK.' },
    ],
  },
  safe: {
    cycle: false,
    steps: [
      { edges: ['a_r1p1'], coffman: ['mutex', 'nopreempt'], note: 'Global lock order: every process takes R1 before R2. P1 acquires R1 first.' },
      { edges: ['a_r1p1', 'q_p2r1b'], coffman: [], note: 'P2 also wants R1 first, so it waits — but P2 holds nothing, so there is no hold-and-wait.' },
      { edges: ['a_r1p1', 'q_p2r1b', 'a_r2p1'], coffman: [], note: 'P1 acquires R2 next (still in order) and now holds everything it needs — it never waits.' },
      { edges: ['a_r1p2', 'a_r2p2b'], coffman: [], note: 'P1 finishes and releases both. P2 now acquires R1 then R2 in order. No cycle ever formed — SAFE.' },
    ],
  },
};

const COFFMAN = [
  { key: 'mutex', label: 'mutual exclusion' },
  { key: 'holdwait', label: 'hold and wait' },
  { key: 'nopreempt', label: 'no preemption' },
  { key: 'circular', label: 'circular wait' },
];

const W = 760;
const H = 240;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function OsDeadlockViz() {
  const [mode, setMode] = useState('deadlock');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const m = MODES[mode];
  const steps = m.steps;
  const total = steps.length;

  function pickMode(id) { setMode(id); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), Math.round((reduced() ? 360 : 950) / speed));
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const cur = step > 0 ? steps[step - 1] : null;
  const activeEdges = cur ? cur.edges : [];
  const cycleNow = !!(cur && cur.cycle);
  const finished = step >= total;
  const showPause = playing && step < total;

  const satisfied = useMemo(() => {
    const set = new Set();
    steps.slice(0, step).forEach((s) => s.coffman.forEach((c) => set.add(c)));
    return set;
  }, [steps, step]);

  const nodes = [
    { c: P1, kind: 'proc', label: 'P1' },
    { c: R1, kind: 'res', label: 'R1' },
    { c: P2, kind: 'proc', label: 'P2' },
    { c: R2, kind: 'res', label: 'R2' },
  ];

  return (
    <div className="osdl">
      <div className="osdl-head">
        <div className="osdl-head-icon"><Workflow size={18} /></div>
        <div className="osdl-head-text">
          <h3 className="osdl-title">Deadlock in the resource-allocation graph</h3>
          <p className="osdl-sub">
            Processes hold and request resources. When the held/requested edges close a cycle, no
            one can proceed. A global lock order breaks the cycle before it forms.
          </p>
        </div>
        <button type="button" className="osdl-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="osdl-chips">
        <button type="button" className={`osdl-chip${mode === 'deadlock' ? ' is-active' : ''}`} onClick={() => pickMode('deadlock')}>
          Cycle forms (deadlock)
        </button>
        <button type="button" className={`osdl-chip${mode === 'safe' ? ' is-active' : ''}`} onClick={() => pickMode('safe')}>
          Ordered acquisition (safe)
        </button>
      </div>

      <div className="osdl-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="osdl-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="osdl-ah-assign" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" className="osdl-ah-assign" />
            </marker>
            <marker id="osdl-ah-request" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" className="osdl-ah-request" />
            </marker>
            <marker id="osdl-ah-cycle" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" className="osdl-ah-cycle" />
            </marker>
          </defs>

          {/* edges */}
          {Object.values(E).map((edge) => {
            const on = activeEdges.includes(edge.id);
            if (!on) return null;
            const s = trim(edge.from, edge.to, NR);
            const e = trim(edge.to, edge.from, NR + 4);
            const isCycle = cycleNow;
            const cls = `osdl-edge ${edge.type === 'assign' ? 'is-assign' : 'is-request'}${isCycle ? ' is-cycle' : ''}`;
            const marker = isCycle ? 'osdl-ah-cycle' : (edge.type === 'assign' ? 'osdl-ah-assign' : 'osdl-ah-request');
            return (
              <line
                key={edge.id}
                x1={s[0]} y1={s[1]} x2={e[0]} y2={e[1]}
                className={cls}
                markerEnd={`url(#${marker})`}
              />
            );
          })}

          {/* nodes */}
          {nodes.map((n) => (
            <g key={n.label} className={`osdl-node is-${n.kind}`}>
              {n.kind === 'proc'
                ? <circle cx={n.c[0]} cy={n.c[1]} r={26} className="osdl-node-shape" />
                : <rect x={n.c[0] - 26} y={n.c[1] - 22} width={52} height={44} rx={7} className="osdl-node-shape" />}
              <text x={n.c[0]} y={n.c[1] + 5} className="osdl-node-label" textAnchor="middle">{n.label}</text>
              {n.kind === 'res' && (
                <circle cx={n.c[0] + 16} cy={n.c[1] - 12} r={2.4} className="osdl-res-dot" />
              )}
            </g>
          ))}

          {/* legend */}
          <g className="osdl-keys">
            <line x1={560} y1={30} x2={590} y2={30} className="osdl-edge is-assign" />
            <text x={596} y={34} className="osdl-key-t">held (assignment)</text>
            <line x1={560} y1={48} x2={590} y2={48} className="osdl-edge is-request" />
            <text x={596} y={52} className="osdl-key-t">wants (request)</text>
          </g>
        </svg>
      </div>

      <div className="osdl-coffman">
        {COFFMAN.map((c) => (
          <span key={c.key} className={`osdl-cond${satisfied.has(c.key) ? ' is-on' : ''}`}>
            {c.label}
          </span>
        ))}
      </div>

      <div className="osdl-controls">
        <button type="button" className="osdl-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="osdl-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="osdl-speed">
          <span className="osdl-speed-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="osdl-speed-range"
            aria-label="Playback speed"
          />
          <span className="osdl-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="osdl-progress">{step} / {total} steps</span>
      </div>

      <div className="osdl-readout">
        <div className={`osdl-verdict${finished ? (m.cycle ? ' is-bad' : ' is-good') : ''}`}>
          {finished
            ? (m.cycle
              ? <><ShieldAlert size={15} /> <span>DEADLOCK — all four Coffman conditions hold; the cycle is unbreakable without intervention</span></>
              : <><ShieldCheck size={15} /> <span>SAFE — circular wait never forms, so deadlock is impossible by construction</span></>)
            : <span className="osdl-verdict-idle">{cur ? cur.note : 'press Step or Play to build the graph'}</span>}
        </div>
      </div>
    </div>
  );
}
