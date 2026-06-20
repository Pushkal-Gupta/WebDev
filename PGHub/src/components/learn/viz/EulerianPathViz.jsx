import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './EulerianPathViz.css';

// Two preset undirected graphs.
//   'path'    : exactly two odd-degree vertices -> Eulerian PATH (not circuit).
//   'circuit' : every vertex even degree         -> Eulerian CIRCUIT.
const GRAPHS = {
  path: {
    label: 'Two odd vertices (path)',
    nodes: [
      { id: 0, x: 130, y: 90 },
      { id: 1, x: 320, y: 90 },
      { id: 2, x: 320, y: 250 },
      { id: 3, x: 130, y: 250 },
      { id: 4, x: 470, y: 170 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [4, 2]],
  },
  circuit: {
    label: 'All even (circuit)',
    nodes: [
      { id: 0, x: 130, y: 90 },
      { id: 1, x: 320, y: 90 },
      { id: 2, x: 320, y: 250 },
      { id: 3, x: 130, y: 250 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]],
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
  const deg = new Array(n).fill(0);
  for (const e of edges) { deg[e.u] += 1; deg[e.v] += 1; }
  const oddNodes = nodes.filter((nd) => deg[nd.id] % 2 === 1).map((nd) => nd.id);
  const oddCount = oddNodes.length;

  const frames = [];
  const usedSet = new Set();
  let pathSeq = [];

  const snap = (extra) => ({
    deg: [...deg],
    used: [...usedSet],
    pathSeq: [...pathSeq],
    activeNode: -1,
    activeEdge: -1,
    feasible: oddCount === 0 || oddCount === 2,
    kind: oddCount === 0 ? 'circuit' : oddCount === 2 ? 'path' : 'none',
    oddCount,
    oddNodes: [...oddNodes],
    ...extra,
  });

  frames.push(snap({
    phase: 'degrees',
    note: `Count each vertex’s degree. Odd-degree vertices: ${oddCount ? `{${oddNodes.join(', ')}}` : 'none'}. An Eulerian trail exists iff the odd count is 0 (circuit) or 2 (path).`,
  }));

  if (oddCount !== 0 && oddCount !== 2) {
    frames.push(snap({
      phase: 'verdict',
      note: `Odd count = ${oddCount}, which is neither 0 nor 2 -> NO Eulerian trail.`,
    }));
    return frames;
  }

  // Hierholzer: start at an odd vertex for a path, else any vertex (lowest id).
  const start = oddCount === 2 ? Math.min(...oddNodes) : nodes[0].id;
  frames.push(snap({
    phase: 'verdict',
    note: oddCount === 2
      ? `Exactly 2 odd vertices -> Eulerian PATH exists. It must start (and end) at an odd vertex; begin at ${start}.`
      : `0 odd vertices -> Eulerian CIRCUIT exists. Begin anywhere; start at ${start}.`,
  }));

  // Adjacency with consumable edges.
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) {
    adj[e.u].push({ to: e.v, eid: e.id });
    adj[e.v].push({ to: e.u, eid: e.id });
  }
  const ptr = new Array(n).fill(0);
  const stack = [start];
  const route = [];

  pathSeq = [start];
  frames.push(snap({
    phase: 'walk', activeNode: start, pathSeq: [start],
    note: `Push start ${start}. Hierholzer: always walk an unused edge from the top vertex; when stuck, pop into the final route.`,
  }));

  while (stack.length) {
    const u = stack[stack.length - 1];
    while (ptr[u] < adj[u].length && usedSet.has(adj[u][ptr[u]].eid)) ptr[u] += 1;
    if (ptr[u] === adj[u].length) {
      route.push(u);
      stack.pop();
      frames.push(snap({
        phase: 'backtrack', activeNode: u, pathSeq: stack.slice(),
        note: `${u} has no unused edges left -> pop ${u} onto the route. Route so far (reversed): [${route.slice().reverse().join(' → ')}].`,
      }));
    } else {
      const { to: v, eid } = adj[u][ptr[u]];
      usedSet.add(eid);
      ptr[u] += 1;
      stack.push(v);
      pathSeq = stack.slice();
      frames.push(snap({
        phase: 'walk', activeNode: v, activeEdge: eid, pathSeq: stack.slice(),
        note: `Walk edge ${u}-${v} (consume it). ${usedSet.size}/${edges.length} edges used. Move to ${v}.`,
      }));
    }
  }

  const euler = route.slice().reverse();
  frames.push(snap({
    phase: 'done', pathSeq: euler,
    note: `Every edge consumed exactly once. Euler ${oddCount === 0 ? 'circuit' : 'path'}: ${euler.join(' → ')}.`,
  }));

  return frames;
}

const PRESETS = [
  { key: 'path', label: GRAPHS.path.label },
  { key: 'circuit', label: GRAPHS.circuit.label },
];

export default function EulerianPathViz() {
  const [graphKey, setGraphKey] = useState('path');
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
  const tableX = 600;
  const tableW = W - tableX - 20;
  const rowH = 34;

  const usedSet = new Set(current.used);
  const oddSet = new Set(current.oddNodes);
  const seqStr = current.pathSeq.length ? current.pathSeq.join(' → ') : '—';

  return (
    <div className="epv">
      <div className="epv-head">
        <h3 className="epv-title">Eulerian path / circuit — degrees then Hierholzer</h3>
        <p className="epv-sub">
          Count odd-degree vertices: 0 means a circuit, 2 means a path, anything else means no trail.
          Then Hierholzer’s walk consumes every edge exactly once.
        </p>
      </div>

      <div className="epv-controls">
        <div className="epv-actions">
          <div className="epv-buttons">
            <button
              type="button"
              className="epv-btn epv-btn-primary"
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
              className="epv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="epv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="epv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="epv-speed">
            <span className="epv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="epv-speed-range"
            />
            <span className="epv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="epv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
        <div className="epv-graphs">
          <span className="epv-graphs-label">graph</span>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`epv-chip${graphKey === p.key ? ' epv-chip-active' : ''}`}
              onClick={() => pickGraph(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="epv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="epv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={tableX - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={28} y={36} className="epv-row-label">undirected graph</text>

          {graph.edges.map((e) => {
            const a = graph.nodes[e.u];
            const b = graph.nodes[e.v];
            const isActive = e.id === current.activeEdge;
            const isUsed = usedSet.has(e.id);
            const stroke = isActive ? 'var(--hue-pink)'
              : isUsed ? 'var(--accent)'
              : 'var(--text-dim)';
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <g key={`e-${e.id}`}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={stroke}
                  strokeWidth={isActive ? 3.6 : isUsed ? 2.6 : 1.5}
                  opacity={isActive || isUsed ? 1 : 0.5}
                />
                {isUsed && (
                  <text x={mx} y={my - 4} className="epv-edge-tag" style={{ fill: 'var(--accent)' }}>✓</text>
                )}
              </g>
            );
          })}

          {graph.nodes.map((nd) => {
            const isActive = nd.id === current.activeNode;
            const odd = oddSet.has(nd.id);
            const fill = isActive ? 'var(--hue-pink)'
              : odd ? 'var(--warning)'
              : 'rgba(var(--accent-rgb), 0.14)';
            const stroke = isActive ? 'var(--hue-pink)'
              : odd ? 'var(--warning)'
              : 'var(--accent)';
            const labelFill = (isActive || odd) ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${nd.id}`}>
                <circle cx={nd.x} cy={nd.y} r={19} fill={fill} stroke={stroke} strokeWidth={isActive ? 3 : 2} />
                <text x={nd.x} y={nd.y + 4} className="epv-node-label" style={{ fill: labelFill }}>{nd.id}</text>
                <text x={nd.x} y={nd.y - 27} className="epv-node-meta">deg {current.deg[nd.id]}</text>
              </g>
            );
          })}

          <g>
            <circle cx={40} cy={H - 50} r={7} fill="var(--warning)" />
            <text x={52} y={H - 46} className="epv-legend-text">odd degree</text>
            <line x1={150} y1={H - 50} x2={182} y2={H - 50} stroke="var(--accent)" strokeWidth={2.6} />
            <text x={190} y={H - 46} className="epv-legend-text">edge used</text>
          </g>

          <rect x={tableX - 10} y={16} width={tableW + 20} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={tableX} y={36} className="epv-row-label">degrees</text>
          {graph.nodes.map((nd, i) => {
            const y = 48 + i * rowH;
            const active = nd.id === current.activeNode;
            const odd = oddSet.has(nd.id);
            return (
              <g key={`row-${nd.id}`}>
                <rect
                  x={tableX} y={y} width={tableW} height={rowH - 6}
                  fill={active ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={active ? 'var(--accent)' : 'var(--border)'}
                  rx={4}
                />
                <text x={tableX + 8} y={y + (rowH - 6) / 2 + 4} className="epv-row-text">n{nd.id}</text>
                <text x={tableX + 44} y={y + (rowH - 6) / 2 + 4} className="epv-row-meta">
                  deg {current.deg[nd.id]} {current.deg[nd.id] % 2 ? '(odd)' : '(even)'}
                </text>
                {odd && (
                  <circle cx={tableX + tableW - 12} cy={y + (rowH - 6) / 2} r={5} fill="var(--warning)" />
                )}
              </g>
            );
          })}
          <text x={tableX} y={48 + graph.nodes.length * rowH + 18} className="epv-row-label">euler sequence</text>
          <text x={tableX + tableW / 2} y={48 + graph.nodes.length * rowH + 42} className="epv-seq">{seqStr}</text>
        </svg>
      </div>

      <div className="epv-metrics">
        <div className="epv-metric">
          <span className="epv-metric-label">phase</span>
          <span className="epv-metric-value">{current.phase}</span>
        </div>
        <div className="epv-metric">
          <span className="epv-metric-label">odd-degree count</span>
          <span className="epv-metric-value">{current.oddCount}</span>
        </div>
        <div className="epv-metric">
          <span className="epv-metric-label">verdict</span>
          <span className="epv-metric-value">
            {current.kind === 'circuit' ? 'circuit' : current.kind === 'path' ? 'path' : 'none'}
          </span>
        </div>
        <div className="epv-metric">
          <span className="epv-metric-label">edges used</span>
          <span className="epv-metric-value">{current.used.length}/{graph.edges.length}</span>
        </div>
        <div className="epv-metric epv-metric-dim">
          <span className="epv-metric-label">sequence</span>
          <span className="epv-metric-value epv-metric-dimval">{seqStr}</span>
        </div>
      </div>

      <div className="epv-arith">
        <span className="epv-arith-label">trace</span>
        <span className="epv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
