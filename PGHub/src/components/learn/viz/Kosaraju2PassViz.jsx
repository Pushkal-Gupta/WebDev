import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './Kosaraju2PassViz.css';

// Directed graph with 3 SCCs: {0,1,2}, {3,4}, {5}.
const POS = {
  0: { x: 150, y: 90 },
  1: { x: 270, y: 60 },
  2: { x: 250, y: 180 },
  3: { x: 440, y: 100 },
  4: { x: 560, y: 90 },
  5: { x: 540, y: 220 },
};
const V = 6;
const EDGES = [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 3], [4, 5]];

const SCC_HUES = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-mint)', 'var(--hue-pink)'];

function transpose(edges) { return edges.map(([u, v]) => [v, u]); }

function buildFrames() {
  const adj = Array.from({ length: V }, () => []);
  for (const [u, v] of EDGES) adj[u].push(v);
  const tAdj = Array.from({ length: V }, () => []);
  for (const [u, v] of transpose(EDGES)) tAdj[u].push(v);

  const frames = [];
  const visited = new Array(V).fill(false);
  const stack = [];

  frames.push({
    phase: 1, visited: [], stack: [], cur: null, sccId: {}, finishedNow: null,
    note: 'Pass 1 — DFS the original graph. Push each vertex onto a stack when its DFS call finishes (post-order).',
  });

  function dfs1(u) {
    visited[u] = true;
    frames.push({ phase: 1, visited: visited.slice().map((b, i) => b ? i : -1).filter((i) => i >= 0), stack: [...stack], cur: u, sccId: {}, finishedNow: null,
      note: `Pass 1: enter ${u}. Recurse into unvisited successors before finishing it.` });
    for (const w of adj[u]) if (!visited[w]) dfs1(w);
    stack.push(u);
    frames.push({ phase: 1, visited: visited.slice().map((b, i) => b ? i : -1).filter((i) => i >= 0), stack: [...stack], cur: u, sccId: {}, finishedNow: u,
      note: `Pass 1: ${u} finishes -> push onto stack. Stack (bottom..top): [${stack.join(', ')}].` });
  }
  for (let v = 0; v < V; v++) if (!visited[v]) dfs1(v);

  frames.push({ phase: 'flip', visited: [], stack: [...stack], cur: null, sccId: {}, finishedNow: null,
    note: `Pass 1 done. Reverse every edge to form the transpose. Now pop the stack top-down; each unvisited pop starts one SCC.` });

  // Pass 2 over transpose.
  const visited2 = new Array(V).fill(false);
  const sccId = {};
  let sccCount = 0;
  const popOrder = [...stack].reverse();
  for (const root of popOrder) {
    if (visited2[root]) continue;
    const id = sccCount++;
    const comp = [];
    const dstack = [root];
    visited2[root] = true;
    frames.push({ phase: 2, visited: [], stack: [...stack], cur: root, sccId: { ...sccId }, finishedNow: null, newRoot: root, sccColor: id,
      note: `Pop ${root} (unvisited) -> start SCC #${id + 1}. DFS in the transpose collects exactly this component.` });
    while (dstack.length) {
      const u = dstack.pop();
      sccId[u] = id;
      comp.push(u);
      for (const w of tAdj[u]) if (!visited2[w]) { visited2[w] = true; dstack.push(w); }
    }
    frames.push({ phase: 2, visited: comp.slice(), stack: [...stack], cur: null, sccId: { ...sccId }, finishedNow: null, sccColor: id,
      note: `SCC #${id + 1} = {${comp.sort((a, b) => a - b).join(', ')}}. Edges leaving it in the transpose only reach already-found SCCs.` });
  }

  frames.push({ phase: 'done', visited: [], stack: [...stack], cur: null, sccId: { ...sccId }, finishedNow: null,
    note: `Found ${sccCount} SCCs in two DFS passes plus one edge-flip: O(V + E). The discovery order is the condensation's topological order.` });
  return frames;
}

const NODE_R = 20;

export default function Kosaraju2PassViz() {
  const frames = useMemo(() => buildFrames(), []);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.6);
  const timer = useRef(null);

  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];
  const delay = Math.round(1000 / speed);
  const running = playing && step < total - 1;

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [running, step, delay, total]);

  const W = 720;
  const H = 320;
  const isTranspose = cur.phase === 2 || cur.phase === 'flip' || cur.phase === 'done';
  const drawEdges = isTranspose ? transpose(EDGES) : EDGES;
  const visitedSet = new Set(cur.visited);

  const phaseLabel = cur.phase === 1 ? 'Pass 1 — DFS original'
    : cur.phase === 'flip' ? 'Transpose'
    : cur.phase === 2 ? 'Pass 2 — DFS transpose'
    : 'Complete';

  return (
    <div className="ksv">
      <div className="ksv-head">
        <h3 className="ksv-title">Kosaraju's two passes — finish-order, then DFS the transpose</h3>
        <p className="ksv-sub">
          Pass 1 records DFS finish times on a stack. Reverse every edge, then pop the stack: each
          unvisited pop seeds one strongly connected component. Two passes, linear time.
        </p>
      </div>

      <div className="ksv-controls">
        <span className="ksv-phase">{phaseLabel}</span>
        <button type="button" className="ksv-btn" onClick={() => { if (step >= total - 1) return; setPlaying((p) => !p); }} disabled={step >= total - 1}>
          {running ? <Pause size={14} /> : <Play size={14} />}{running ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="ksv-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}>
          <ChevronRight size={14} /> Step
        </button>
        <button type="button" className="ksv-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}>
          <SkipForward size={14} /> Skip
        </button>
        <button type="button" className="ksv-btn" onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw size={14} /> Reset</button>
        <label className="ksv-speed">
          <span className="ksv-speed-label">speed</span>
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="ksv-range" />
        </label>
        <div className="ksv-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="ksv-body">
        <div className="ksv-stage">
          <svg viewBox={`0 0 ${W} ${H}`} className="ksv-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="ksv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="var(--text-dim)" />
              </marker>
            </defs>
            <rect x={10} y={10} width={W - 20} height={H - 20} fill="var(--surface)" stroke="var(--border)" rx={8} />
            {drawEdges.map(([u, v], i) => {
              const a = POS[u]; const b = POS[v];
              const dx = b.x - a.x; const dy = b.y - a.y;
              const len = Math.hypot(dx, dy) || 1;
              const sx = a.x + (dx / len) * NODE_R; const sy = a.y + (dy / len) * NODE_R;
              const ex = b.x - (dx / len) * (NODE_R + 6); const ey = b.y - (dy / len) * (NODE_R + 6);
              return <line key={i} x1={sx} y1={sy} x2={ex} y2={ey} stroke="var(--border)" strokeWidth={1.8} markerEnd="url(#ksv-arrow)" />;
            })}
            {Object.keys(POS).map((k) => {
              const v = Number(k);
              const p = POS[v];
              const assigned = cur.sccId[v];
              const isCur = cur.cur === v;
              const justVisited = visitedSet.has(v) && cur.phase === 2;
              let fill = 'var(--bg)';
              let stroke = 'var(--border)';
              let label = 'var(--text-main)';
              if (assigned != null) { fill = SCC_HUES[assigned % SCC_HUES.length]; stroke = SCC_HUES[assigned % SCC_HUES.length]; label = 'var(--bg)'; }
              else if (isCur) { fill = 'var(--medium)'; stroke = 'var(--medium)'; label = 'var(--bg)'; }
              else if (justVisited) { fill = 'rgba(var(--accent-rgb),0.4)'; stroke = 'var(--accent)'; }
              else if (cur.phase === 1 && cur.visited.includes(v)) { fill = 'rgba(var(--accent-rgb),0.18)'; stroke = 'var(--accent)'; }
              return (
                <g key={v}>
                  <circle cx={p.x} cy={p.y} r={NODE_R} fill={fill} stroke={stroke} strokeWidth={isCur ? 3 : 2} />
                  <text x={p.x} y={p.y + 5} className="ksv-node-label" style={{ fill: label }}>{v}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="ksv-stack">
          <span className="ksv-stack-tag">finish stack</span>
          <div className="ksv-stack-col">
            {[...cur.stack].reverse().map((v, i) => (
              <div key={`${v}-${i}`} className={`ksv-stack-cell ${cur.cur === v && cur.phase !== 1 ? 'ksv-stack-cell-hot' : ''}`}>{v}{i === 0 ? '  (top)' : ''}</div>
            ))}
            {cur.stack.length === 0 && <div className="ksv-stack-empty">empty</div>}
          </div>
        </div>
      </div>

      <div className="ksv-note">
        <span className="ksv-note-label">trace</span>
        <span className="ksv-note-text">{cur.note}</span>
      </div>
    </div>
  );
}
