import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './TarjanSccViz2.css';

const SCC_HUES = ['var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)', 'var(--hue-violet)', 'var(--medium)'];

// Directed graph with three SCCs:
//   {0,1,2} mutual cycle, {3,4} mutual cycle, {5} singleton sink.
//   Cross edges 2->3 and 4->5 link them in DAG order.
function buildGraph() {
  const nodes = [
    { id: 0, x: 130, y: 90 },
    { id: 1, x: 280, y: 60 },
    { id: 2, x: 280, y: 210 },
    { id: 3, x: 440, y: 90 },
    { id: 4, x: 440, y: 240 },
    { id: 5, x: 590, y: 160 },
  ];
  const edges = [
    [0, 1], [1, 2], [2, 0],
    [2, 3],
    [3, 4], [4, 3],
    [4, 5],
  ].map(([u, v], id) => ({ id, u, v }));
  return { nodes, edges };
}

function buildFrames(graph) {
  const { nodes, edges } = graph;
  const n = nodes.length;
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) adj[e.u].push({ to: e.v, eid: e.id });

  const index = new Array(n).fill(-1);
  const low = new Array(n).fill(-1);
  const onStack = new Array(n).fill(false);
  const sccId = new Array(n).fill(-1);
  const stack = [];
  const sccs = [];
  let counter = 0;
  let nextScc = 0;

  const frames = [];
  const snap = (extra) => ({
    index: [...index],
    low: [...low],
    onStack: [...onStack],
    sccId: [...sccId],
    stack: [...stack],
    sccs: sccs.map((s) => [...s]),
    activeNode: -1,
    activeEdge: -1,
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: 'Tarjan: DFS assigning index[v] (visit order) and low[v] (lowest index reachable via the DFS subtree + back edges through the on-stack frontier). When low[v] == index[v], pop the stack down to v — that block is one SCC.',
  }));

  function dfs(u) {
    index[u] = low[u] = counter++;
    stack.push(u);
    onStack[u] = true;
    frames.push(snap({
      phase: 'visit', activeNode: u,
      note: `Visit ${u}: index[${u}] = low[${u}] = ${index[u]}. Push ${u} (stack = [${stack.join(', ')}]).`,
    }));

    for (const { to: v, eid } of adj[u]) {
      if (index[v] === -1) {
        frames.push(snap({
          phase: 'tree', activeNode: u, activeEdge: eid,
          note: `Edge ${u}->${v}: ${v} unvisited -> recurse.`,
        }));
        dfs(v);
        low[u] = Math.min(low[u], low[v]);
        frames.push(snap({
          phase: 'low-tree', activeNode: u, activeEdge: eid,
          note: `Back at ${u}: low[${u}] = min(low[${u}], low[${v}]=${low[v]}) = ${low[u]}.`,
        }));
      } else if (onStack[v]) {
        low[u] = Math.min(low[u], index[v]);
        frames.push(snap({
          phase: 'back', activeNode: u, activeEdge: eid,
          note: `Edge ${u}->${v}: ${v} is on the stack -> low[${u}] = min(low[${u}], index[${v}]=${index[v]}) = ${low[u]}.`,
        }));
      } else {
        frames.push(snap({
          phase: 'cross', activeNode: u, activeEdge: eid,
          note: `Edge ${u}->${v}: ${v} already in a finished SCC (not on stack) -> ignore.`,
        }));
      }
    }

    if (low[u] === index[u]) {
      const comp = [];
      let w = -1;
      do {
        w = stack.pop();
        onStack[w] = false;
        sccId[w] = nextScc;
        comp.push(w);
      } while (w !== u);
      sccs.push(comp);
      frames.push(snap({
        phase: 'pop', activeNode: u,
        note: `low[${u}]=${low[u]} == index[${u}]=${index[u]}: ${u} is an SCC root. Pop until ${u} -> SCC #${nextScc} = {${comp.slice().sort((a, b) => a - b).join(', ')}}.`,
      }));
      nextScc += 1;
    }
  }

  for (let i = 0; i < n; i += 1) {
    if (index[i] === -1) dfs(i);
  }

  frames.push(snap({
    phase: 'done',
    note: `Done in O(V + E). ${sccs.length} SCCs: ${sccs.map((c) => `{${c.slice().sort((a, b) => a - b).join(', ')}}`).join(', ')}.`,
  }));

  return frames;
}

export default function TarjanSccViz2() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { frames, graph } = useMemo(() => {
    const g = buildGraph();
    return { frames: buildFrames(g), graph: g };
  }, []);

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

  const W = 940;
  const H = 360;
  const stackX = 560;
  const stackW = 110;
  const tableX = 700;
  const tableW = W - tableX - 20;
  const rowH = 34;

  const hueFor = (sid) => (sid < 0 ? null : SCC_HUES[sid % SCC_HUES.length]);
  const sccLabels = current.sccs.map((c) => `{${c.slice().sort((a, b) => a - b).join(', ')}}`);

  return (
    <div className="tsv2">
      <div className="tsv2-head">
        <h3 className="tsv2-title">Tarjan’s SCC — index, low &amp; an explicit stack</h3>
        <p className="tsv2-sub">
          One DFS pushes vertices onto a stack and tracks low-link values. When low[v] equals index[v], the
          stack is popped down to v — that group is a strongly connected component.
        </p>
      </div>

      <div className="tsv2-controls">
        <div className="tsv2-actions">
          <div className="tsv2-buttons">
            <button
              type="button"
              className="tsv2-btn tsv2-btn-primary"
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
              className="tsv2-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="tsv2-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="tsv2-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="tsv2-speed">
            <span className="tsv2-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="tsv2-speed-range"
            />
            <span className="tsv2-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="tsv2-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="tsv2-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tsv2-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="tsv2-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
            </marker>
            <marker id="tsv2-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          <rect x={16} y={16} width={stackX - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={28} y={36} className="tsv2-row-label">directed graph</text>

          {graph.edges.map((e) => {
            const a = graph.nodes[e.u];
            const b = graph.nodes[e.v];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const r = 20;
            const x1 = a.x + ux * r;
            const y1 = a.y + uy * r;
            const x2 = b.x - ux * (r + 6);
            const y2 = b.y - uy * (r + 6);
            const isActive = e.id === current.activeEdge;
            return (
              <line
                key={`e-${e.id}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isActive ? 'var(--hue-pink)' : 'var(--text-dim)'}
                strokeWidth={isActive ? 3 : 1.6}
                opacity={isActive ? 1 : 0.6}
                markerEnd={`url(#${isActive ? 'tsv2-arrow-active' : 'tsv2-arrow'})`}
              />
            );
          })}

          {graph.nodes.map((nd) => {
            const isActive = nd.id === current.activeNode;
            const sid = current.sccId[nd.id];
            const onStk = current.onStack[nd.id];
            const visited = current.index[nd.id] !== -1;
            const hue = hueFor(sid);
            const fill = isActive ? 'var(--hue-pink)'
              : sid >= 0 ? hue
              : onStk ? 'rgba(var(--accent-rgb), 0.22)'
              : visited ? 'var(--surface)'
              : 'var(--bg)';
            const stroke = isActive ? 'var(--hue-pink)'
              : sid >= 0 ? hue
              : onStk ? 'var(--accent)'
              : 'var(--border)';
            const labelFill = (isActive || sid >= 0) ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${nd.id}`}>
                <circle cx={nd.x} cy={nd.y} r={20} fill={fill} stroke={stroke} strokeWidth={isActive || onStk ? 3 : 2} />
                <text x={nd.x} y={nd.y + 4} className="tsv2-node-label" style={{ fill: labelFill }}>{nd.id}</text>
                {visited && (
                  <text x={nd.x} y={nd.y - 28} className="tsv2-node-meta">
                    {current.index[nd.id]}/{current.low[nd.id]}
                  </text>
                )}
              </g>
            );
          })}

          <text x={28} y={H - 24} className="tsv2-legend-text">node label = index/low · fills mark finished SCCs</text>

          {/* explicit stack */}
          <rect x={stackX} y={16} width={stackW} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={stackX + 12} y={36} className="tsv2-row-label">stack</text>
          {current.stack.slice().reverse().map((v, i) => {
            const cellH = 28;
            const y = 48 + i * (cellH + 4);
            const sid = current.sccId[v];
            const hue = hueFor(sid);
            return (
              <g key={`stk-${v}`}>
                <rect
                  x={stackX + 12} y={y} width={stackW - 24} height={cellH} rx={4}
                  fill={i === 0 ? 'rgba(var(--accent-rgb), 0.22)' : hue || 'var(--bg)'}
                  stroke={i === 0 ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={i === 0 ? 2 : 1}
                />
                <text x={stackX + stackW / 2} y={y + cellH / 2 + 4} className="tsv2-stack-text" style={{ fill: 'var(--text-main)' }}>
                  {v}
                </text>
              </g>
            );
          })}
          {current.stack.length === 0 && (
            <text x={stackX + stackW / 2} y={64} className="tsv2-row-meta" style={{ textAnchor: 'middle' }}>empty</text>
          )}

          {/* index / low table */}
          <rect x={tableX - 10} y={16} width={tableW + 20} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={tableX} y={36} className="tsv2-row-label">index / low</text>
          {graph.nodes.map((nd, i) => {
            const y = 48 + i * rowH;
            const active = nd.id === current.activeNode;
            const sid = current.sccId[nd.id];
            const hue = hueFor(sid);
            return (
              <g key={`row-${nd.id}`}>
                <rect
                  x={tableX} y={y} width={tableW} height={rowH - 6}
                  fill={active ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={active ? 'var(--accent)' : 'var(--border)'}
                  rx={4}
                />
                <text x={tableX + 8} y={y + (rowH - 6) / 2 + 4} className="tsv2-row-text">n{nd.id}</text>
                <text x={tableX + 40} y={y + (rowH - 6) / 2 + 4} className="tsv2-row-meta">
                  i {current.index[nd.id] < 0 ? '—' : current.index[nd.id]}
                </text>
                <text x={tableX + 74} y={y + (rowH - 6) / 2 + 4} className="tsv2-row-meta">
                  lo {current.low[nd.id] < 0 ? '—' : current.low[nd.id]}
                </text>
                {sid >= 0 && (
                  <circle cx={tableX + tableW - 12} cy={y + (rowH - 6) / 2} r={5} fill={hue} />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tsv2-metrics">
        <div className="tsv2-metric">
          <span className="tsv2-metric-label">phase</span>
          <span className="tsv2-metric-value">{current.phase}</span>
        </div>
        <div className="tsv2-metric">
          <span className="tsv2-metric-label">stack depth</span>
          <span className="tsv2-metric-value">{current.stack.length}</span>
        </div>
        <div className="tsv2-metric">
          <span className="tsv2-metric-label">SCCs found</span>
          <span className="tsv2-metric-value">{current.sccs.length}</span>
        </div>
        <div className="tsv2-metric">
          <span className="tsv2-metric-label">components</span>
          <span className="tsv2-metric-value">{sccLabels.length ? sccLabels.join(' ') : 'none yet'}</span>
        </div>
        <div className="tsv2-metric tsv2-metric-dim">
          <span className="tsv2-metric-label">graph</span>
          <span className="tsv2-metric-value tsv2-metric-dimval">{graph.nodes.length}n, {graph.edges.length}e directed</span>
        </div>
      </div>

      <div className="tsv2-arith">
        <span className="tsv2-arith-label">trace</span>
        <span className="tsv2-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
