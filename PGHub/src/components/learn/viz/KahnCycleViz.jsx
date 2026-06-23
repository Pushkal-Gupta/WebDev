import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './KahnCycleViz.css';

// 6-vertex graph from the lesson. Positions hand-placed (vertical-ish DAG flow).
const POS = {
  0: { x: 560, y: 250 },
  1: { x: 680, y: 130 },
  2: { x: 360, y: 160 },
  3: { x: 380, y: 270 },
  4: { x: 200, y: 90 },
  5: { x: 200, y: 230 },
};
const BASE_EDGES = [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]];
const CYCLE_EDGE = [1, 4];

function buildFrames(edges, V) {
  const adj = Array.from({ length: V }, () => []);
  const indeg = new Array(V).fill(0);
  for (const [u, v] of edges) { adj[u].push(v); indeg[v]++; }

  const frames = [];
  const inWork = indeg.slice();
  const queue = [];
  for (let v = 0; v < V; v++) if (inWork[v] === 0) queue.push(v);
  const order = [];
  const emitted = new Set();

  frames.push({
    indeg: inWork.slice(), queue: [...queue], order: [...order], cur: null, emitted: new Set(emitted), decRemain: 0,
    note: `Compute every in-degree. Seed the queue with all in-degree-0 vertices: [${queue.join(', ')}].`,
  });

  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    emitted.add(u);
    frames.push({
      indeg: inWork.slice(), queue: [...queue], order: [...order], cur: u, emitted: new Set(emitted), decRemain: 0,
      note: `Pop ${u}. No unmet prerequisites -> emit it. Now relax its outgoing edges.`,
    });
    for (const w of adj[u]) {
      inWork[w]--;
      if (inWork[w] === 0) queue.push(w);
      frames.push({
        indeg: inWork.slice(), queue: [...queue], order: [...order], cur: u, emitted: new Set(emitted), decRemain: 0, relaxTo: w,
        note: `Edge ${u} -> ${w}: in[${w}] drops to ${inWork[w]}${inWork[w] === 0 ? ` -> enqueue ${w}.` : '.'}`,
      });
    }
  }

  const remaining = [];
  for (let v = 0; v < V; v++) if (!emitted.has(v)) remaining.push(v);
  frames.push({
    indeg: inWork.slice(), queue: [], order: [...order], cur: null, emitted: new Set(emitted), decRemain: remaining.length,
    note: remaining.length === 0
      ? `Emitted all ${V} vertices. Graph was a DAG. Topological order: [${order.join(', ')}].`
      : `Queue empty but only ${order.length}/${V} emitted. Trapped set {${remaining.join(', ')}} all keep positive in-degree -> they form / feed a directed cycle. Cycle detected.`,
  });
  return frames;
}

const NODE_R = 22;

export default function KahnCycleViz() {
  const [withCycle, setWithCycle] = useState(false);
  const edges = useMemo(() => (withCycle ? [...BASE_EDGES, CYCLE_EDGE] : BASE_EDGES), [withCycle]);
  const [frames, setFrames] = useState(() => buildFrames(BASE_EDGES, 6));
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.6);
  const timer = useRef(null);

  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];
  const delay = Math.round(950 / speed);
  const running = playing && step < total - 1;

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [running, step, delay, total]);

  const toggleCycle = (on) => {
    setWithCycle(on);
    setPlaying(false);
    setFrames(buildFrames(on ? [...BASE_EDGES, CYCLE_EDGE] : BASE_EDGES, 6));
    setStep(0);
  };

  const W = 800;
  const H = 340;

  const queueSet = new Set(cur.queue);

  return (
    <div className="khv">
      <div className="khv-head">
        <h3 className="khv-title">Kahn's algorithm — peel in-degree-0 nodes, detect cycles for free</h3>
        <p className="khv-sub">
          Repeatedly emit any vertex with no incoming edges and decrement its successors. If the queue
          empties before all V vertices are emitted, the leftovers form a directed cycle.
        </p>
      </div>

      <div className="khv-controls">
        <div className="khv-toggle">
          <button type="button" className={`khv-tog ${!withCycle ? 'khv-tog-on' : ''}`} onClick={() => toggleCycle(false)}>DAG</button>
          <button type="button" className={`khv-tog ${withCycle ? 'khv-tog-on' : ''}`} onClick={() => toggleCycle(true)}>add 1&rarr;4 (cycle)</button>
        </div>
        <button type="button" className="khv-btn" onClick={() => { if (step >= total - 1) return; setPlaying((p) => !p); }} disabled={step >= total - 1}>
          {running ? <Pause size={14} /> : <Play size={14} />}{running ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="khv-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}>
          <ChevronRight size={14} /> Step
        </button>
        <button type="button" className="khv-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}>
          <SkipForward size={14} /> Skip
        </button>
        <button type="button" className="khv-btn" onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw size={14} /> Reset</button>
        <label className="khv-speed">
          <span className="khv-speed-label">speed</span>
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="khv-range" />
        </label>
        <div className="khv-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="khv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="khv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="khv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--text-dim)" />
            </marker>
            <marker id="khv-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--medium)" />
            </marker>
          </defs>
          <rect x={10} y={10} width={W - 20} height={H - 20} fill="var(--surface)" stroke="var(--border)" rx={8} />
          {edges.map(([u, v], i) => {
            const a = POS[u]; const b = POS[v];
            const dx = b.x - a.x; const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const sx = a.x + (dx / len) * NODE_R; const sy = a.y + (dy / len) * NODE_R;
            const ex = b.x - (dx / len) * (NODE_R + 6); const ey = b.y - (dy / len) * (NODE_R + 6);
            const hot = cur.cur === u && cur.relaxTo === v;
            return <line key={i} x1={sx} y1={sy} x2={ex} y2={ey} stroke={hot ? 'var(--medium)' : 'var(--border)'} strokeWidth={hot ? 3 : 1.8} markerEnd={`url(#${hot ? 'khv-arrow-hot' : 'khv-arrow'})`} />;
          })}
          {Object.keys(POS).map((k) => {
            const v = Number(k);
            const p = POS[v];
            const isCur = cur.cur === v;
            const isEmit = cur.emitted.has(v);
            const inQ = queueSet.has(v);
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            let label = 'var(--text-main)';
            if (isCur) { fill = 'var(--medium)'; stroke = 'var(--medium)'; label = 'var(--bg)'; }
            else if (isEmit) { fill = 'rgba(var(--accent-rgb), 0.5)'; stroke = 'var(--accent)'; label = 'var(--bg)'; }
            else if (inQ) { fill = 'var(--bg)'; stroke = 'var(--accent)'; }
            return (
              <g key={v}>
                <circle cx={p.x} cy={p.y} r={NODE_R} fill={fill} stroke={stroke} strokeWidth={isCur || inQ ? 3 : 2} />
                <text x={p.x} y={p.y + 5} className="khv-node-label" style={{ fill: label }}>{v}</text>
                <text x={p.x} y={p.y - NODE_R - 7} className="khv-indeg">in={cur.indeg[v]}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="khv-rows">
        <div className="khv-row"><span className="khv-row-label">queue</span><span className="khv-row-val">[{cur.queue.join(', ')}]</span></div>
        <div className="khv-row"><span className="khv-row-label">emitted order</span><span className="khv-row-val">[{cur.order.join(', ')}]</span></div>
        <div className="khv-row"><span className="khv-row-label">emitted</span><span className="khv-row-val">{cur.order.length} / 6</span></div>
      </div>

      <div className="khv-note">
        <span className="khv-note-label">trace</span>
        <span className="khv-note-text">{cur.note}</span>
      </div>
    </div>
  );
}
