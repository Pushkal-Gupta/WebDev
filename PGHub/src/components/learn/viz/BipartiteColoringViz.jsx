import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './BipartiteColoringViz.css';

// Two presets.
//   'yes' : even cycle 0-1-2-3-0 plus a pendant -> 2-colorable.
//   'no'  : the same plus chord 0-2 makes an odd cycle 0-1-2 -> not bipartite.
const GRAPHS = {
  yes: {
    label: 'Bipartite (even cycle)',
    nodes: [
      { id: 0, x: 150, y: 90 },
      { id: 1, x: 340, y: 90 },
      { id: 2, x: 340, y: 250 },
      { id: 3, x: 150, y: 250 },
      { id: 4, x: 470, y: 170 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4]],
  },
  no: {
    label: 'Odd cycle (not bipartite)',
    nodes: [
      { id: 0, x: 150, y: 90 },
      { id: 1, x: 340, y: 90 },
      { id: 2, x: 340, y: 250 },
      { id: 3, x: 150, y: 250 },
      { id: 4, x: 470, y: 170 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [0, 2]],
  },
};

function buildGraph(key) {
  const g = GRAPHS[key];
  const edges = g.edges.map(([u, v], id) => ({ id, u, v }));
  return { label: g.label, nodes: g.nodes, edges };
}

function buildFrames(graph) {
  const { nodes, edges } = graph;
  const n = nodes.length;
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) {
    adj[e.u].push({ to: e.v, eid: e.id });
    adj[e.v].push({ to: e.u, eid: e.id });
  }

  const color = new Array(n).fill(-1);
  let conflictEdge = -1;
  const frames = [];

  const snap = (extra) => ({
    color: [...color],
    conflictEdge,
    activeNode: -1,
    activeEdge: -1,
    queue: [],
    bipartite: true,
    done: false,
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: 'BFS from node 0. Color it 0; every neighbour must take the opposite color. If BFS ever finds an edge joining two equal-colored nodes, an odd cycle exists and the graph is NOT bipartite.',
  }));

  const start = 0;
  color[start] = 0;
  const queue = [start];
  frames.push(snap({
    phase: 'seed', activeNode: start, queue: [...queue],
    note: `Color start ${start} with color A and enqueue it.`,
  }));

  let head = 0;
  while (head < queue.length) {
    const u = queue[head];
    head += 1;
    frames.push(snap({
      phase: 'dequeue', activeNode: u, queue: queue.slice(head),
      note: `Dequeue ${u} (color ${color[u] === 0 ? 'A' : 'B'}). Visit its neighbours.`,
    }));

    for (const { to: v, eid } of adj[u]) {
      if (color[v] === -1) {
        color[v] = color[u] ^ 1;
        queue.push(v);
        frames.push(snap({
          phase: 'color', activeNode: u, activeEdge: eid, queue: queue.slice(head),
          note: `Neighbour ${v} uncolored -> give it the opposite color ${color[v] === 0 ? 'A' : 'B'} and enqueue it.`,
        }));
      } else if (color[v] === color[u]) {
        conflictEdge = eid;
        frames.push(snap({
          phase: 'conflict', activeNode: u, activeEdge: eid, queue: queue.slice(head),
          bipartite: false, done: true,
          note: `Edge ${u}-${v}: both already color ${color[u] === 0 ? 'A' : 'B'} -> CONFLICT. An odd cycle exists, so the graph is NOT bipartite.`,
        }));
        frames.push(snap({
          phase: 'done', bipartite: false, done: true, conflictEdge: eid,
          note: `Stop. Conflict edge ${edges[eid].u}-${edges[eid].v} proves an odd cycle -> not 2-colorable.`,
        }));
        return frames;
      } else {
        frames.push(snap({
          phase: 'ok', activeNode: u, activeEdge: eid, queue: queue.slice(head),
          note: `Edge ${u}-${v}: ${v} already has the opposite color ${color[v] === 0 ? 'A' : 'B'} -> consistent, no conflict.`,
        }));
      }
    }
  }

  const setA = color.map((c, i) => (c === 0 ? i : -1)).filter((i) => i >= 0);
  const setB = color.map((c, i) => (c === 1 ? i : -1)).filter((i) => i >= 0);
  frames.push(snap({
    phase: 'done', bipartite: true, done: true,
    note: `No conflicts. The graph IS bipartite. Set A = {${setA.join(', ')}}, set B = {${setB.join(', ')}}.`,
  }));

  return frames;
}

const PRESETS = [
  { key: 'yes', label: GRAPHS.yes.label },
  { key: 'no', label: GRAPHS.no.label },
];

export default function BipartiteColoringViz() {
  const [graphKey, setGraphKey] = useState('yes');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { frames, graph } = useMemo(() => {
    const g = buildGraph(graphKey);
    return { frames: buildFrames(g), graph: g };
  }, [graphKey]);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
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

  const pickGraph = (key) => {
    setGraphKey(key);
    setIsRunningRaw(false);
    setStep(0);
  };

  const W = 940;
  const H = 360;
  const panelX = 560;
  const panelW = W - panelX - 20;

  const COLOR_A = 'var(--hue-sky)';
  const COLOR_B = 'var(--hue-pink)';
  const colorFill = (c) => (c < 0 ? 'var(--surface)' : c === 0 ? COLOR_A : COLOR_B);

  const setA = current.color.map((c, i) => (c === 0 ? i : -1)).filter((i) => i >= 0);
  const setB = current.color.map((c, i) => (c === 1 ? i : -1)).filter((i) => i >= 0);
  const conflictLabel = current.conflictEdge >= 0
    ? `${graph.edges[current.conflictEdge].u}-${graph.edges[current.conflictEdge].v}`
    : '—';

  return (
    <div className="bcv">
      <div className="bcv-head">
        <h3 className="bcv-title">Bipartite check — 2-coloring by BFS</h3>
        <p className="bcv-sub">
          BFS gives each node the opposite color of its parent. The graph is bipartite unless an edge ever joins
          two same-colored nodes — that edge closes an odd cycle. Toggle the graph to see both outcomes.
        </p>
      </div>

      <div className="bcv-controls">
        <div className="bcv-actions">
          <div className="bcv-buttons">
            <button
              type="button"
              className="bcv-btn bcv-btn-primary"
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
              className="bcv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="bcv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="bcv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="bcv-speed">
            <span className="bcv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bcv-speed-range"
            />
            <span className="bcv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="bcv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
        <div className="bcv-graphs">
          <span className="bcv-graphs-label">graph</span>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`bcv-chip${graphKey === p.key ? ' bcv-chip-active' : ''}`}
              onClick={() => pickGraph(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bcv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={panelX - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={28} y={36} className="bcv-row-label">undirected graph</text>

          {graph.edges.map((e) => {
            const a = graph.nodes[e.u];
            const b = graph.nodes[e.v];
            const isActive = e.id === current.activeEdge;
            const isConflict = e.id === current.conflictEdge;
            const stroke = isConflict ? 'var(--hard)'
              : isActive ? 'var(--accent)'
              : 'var(--text-dim)';
            return (
              <line
                key={`e-${e.id}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={stroke}
                strokeWidth={isConflict ? 3.6 : isActive ? 3 : 1.5}
                strokeDasharray={isConflict ? '7 4' : undefined}
                opacity={isConflict || isActive ? 1 : 0.5}
              />
            );
          })}

          {graph.nodes.map((nd) => {
            const c = current.color[nd.id];
            const isActive = nd.id === current.activeNode;
            const fill = colorFill(c);
            const stroke = isActive ? 'var(--accent)'
              : c >= 0 ? fill
              : 'var(--border)';
            const labelFill = c >= 0 ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${nd.id}`}>
                <circle cx={nd.x} cy={nd.y} r={20} fill={fill} stroke={stroke} strokeWidth={isActive ? 4 : 2} />
                <text x={nd.x} y={nd.y + 4} className="bcv-node-label" style={{ fill: labelFill }}>{nd.id}</text>
                {c >= 0 && (
                  <text x={nd.x} y={nd.y - 28} className="bcv-node-meta">{c === 0 ? 'A' : 'B'}</text>
                )}
              </g>
            );
          })}

          <g>
            <circle cx={40} cy={H - 50} r={7} fill={COLOR_A} />
            <text x={52} y={H - 46} className="bcv-legend-text">set A</text>
            <circle cx={120} cy={H - 50} r={7} fill={COLOR_B} />
            <text x={132} y={H - 46} className="bcv-legend-text">set B</text>
            <line x1={200} y1={H - 50} x2={232} y2={H - 50} stroke="var(--hard)" strokeWidth={3} strokeDasharray="7 4" />
            <text x={240} y={H - 46} className="bcv-legend-text">conflict edge</text>
          </g>

          {/* color-set panel */}
          <rect x={panelX - 10} y={16} width={panelW + 20} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={panelX} y={36} className="bcv-row-label">color sets</text>

          <rect x={panelX} y={48} width={panelW} height={70} rx={6} fill="rgba(var(--accent-rgb), 0.08)" stroke={COLOR_A} />
          <text x={panelX + 10} y={68} className="bcv-row-text">set A</text>
          {setA.length ? setA.map((id, i) => (
            <g key={`a-${id}`}>
              <circle cx={panelX + 28 + i * 40} cy={96} r={14} fill={COLOR_A} />
              <text x={panelX + 28 + i * 40} y={101} className="bcv-set-val" style={{ fill: 'var(--bg)' }}>{id}</text>
            </g>
          )) : <text x={panelX + 10} y={100} className="bcv-row-text" style={{ fill: 'var(--text-dim)' }}>empty</text>}

          <rect x={panelX} y={130} width={panelW} height={70} rx={6} fill="rgba(var(--accent-rgb), 0.08)" stroke={COLOR_B} />
          <text x={panelX + 10} y={150} className="bcv-row-text">set B</text>
          {setB.length ? setB.map((id, i) => (
            <g key={`b-${id}`}>
              <circle cx={panelX + 28 + i * 40} cy={178} r={14} fill={COLOR_B} />
              <text x={panelX + 28 + i * 40} y={183} className="bcv-set-val" style={{ fill: 'var(--bg)' }}>{id}</text>
            </g>
          )) : <text x={panelX + 10} y={182} className="bcv-row-text" style={{ fill: 'var(--text-dim)' }}>empty</text>}

          <text x={panelX} y={232} className="bcv-row-label">queue</text>
          {current.queue.length ? current.queue.map((id, i) => (
            <g key={`q-${id}-${i}`}>
              <rect x={panelX + i * 34} y={242} width={28} height={26} rx={4} fill="var(--bg)" stroke="var(--border)" />
              <text x={panelX + i * 34 + 14} y={259} className="bcv-set-val" style={{ fill: 'var(--text-main)', fontSize: 12 }}>{id}</text>
            </g>
          )) : <text x={panelX} y={260} className="bcv-row-text" style={{ fill: 'var(--text-dim)' }}>empty</text>}

          <line x1={panelX} y1={288} x2={panelX + panelW} y2={288} stroke="var(--border)" strokeWidth={1} />
          <text x={panelX} y={310} className="bcv-row-label">verdict</text>
          <text
            x={panelX} y={332} className="bcv-set-val"
            style={{ textAnchor: 'start', fill: current.done ? (current.bipartite ? 'var(--easy)' : 'var(--hard)') : 'var(--text-dim)' }}
          >
            {current.done ? (current.bipartite ? 'BIPARTITE' : 'NOT BIPARTITE') : 'in progress…'}
          </text>
        </svg>
      </div>

      <div className="bcv-metrics">
        <div className="bcv-metric">
          <span className="bcv-metric-label">phase</span>
          <span className="bcv-metric-value">{current.phase}</span>
        </div>
        <div className="bcv-metric">
          <span className="bcv-metric-label">set A</span>
          <span className="bcv-metric-value">{setA.length ? `{${setA.join(', ')}}` : '∅'}</span>
        </div>
        <div className="bcv-metric">
          <span className="bcv-metric-label">set B</span>
          <span className="bcv-metric-value">{setB.length ? `{${setB.join(', ')}}` : '∅'}</span>
        </div>
        <div className="bcv-metric">
          <span className="bcv-metric-label">conflict edge</span>
          <span className="bcv-metric-value">{conflictLabel}</span>
        </div>
        <div className="bcv-metric bcv-metric-dim">
          <span className="bcv-metric-label">verdict</span>
          <span className="bcv-metric-value bcv-metric-dimval">
            {current.done ? (current.bipartite ? 'bipartite' : 'not bipartite') : '—'}
          </span>
        </div>
      </div>

      <div className="bcv-arith">
        <span className="bcv-arith-label">trace</span>
        <span className="bcv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
