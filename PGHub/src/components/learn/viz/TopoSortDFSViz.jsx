import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './TopoSortDFSViz.css';

// A small course-prerequisite DAG. Edge u -> v means "u must come before v".
// DFS-based topo sort: when a node FINISHES (all descendants visited), push it
// onto a stack; the topological order is that finish stack reversed.
function buildGraph() {
  const nodes = [
    { id: 'A', x: 110, y: 80 },
    { id: 'B', x: 110, y: 240 },
    { id: 'C', x: 270, y: 60 },
    { id: 'D', x: 270, y: 180 },
    { id: 'E', x: 270, y: 300 },
    { id: 'F', x: 440, y: 120 },
    { id: 'G', x: 440, y: 270 },
  ];
  const edges = [
    { u: 'A', v: 'C' },
    { u: 'A', v: 'D' },
    { u: 'B', v: 'D' },
    { u: 'B', v: 'E' },
    { u: 'C', v: 'F' },
    { u: 'D', v: 'F' },
    { u: 'D', v: 'G' },
    { u: 'E', v: 'G' },
  ];
  edges.forEach((e, i) => { e.id = i; });
  return { nodes, edges };
}

const NODE_R = 21;

// state per node: 'white' (unvisited), 'gray' (on recursion path / visiting),
// 'black' (finished, pushed to stack).
function buildFrames(graph) {
  const { nodes, edges } = graph;
  const ids = nodes.map((n) => n.id);
  const adj = {};
  ids.forEach((id) => { adj[id] = []; });
  for (const e of edges) adj[e.u].push({ to: e.v, eid: e.id });
  Object.values(adj).forEach((l) => l.sort((a, b) => (a.to < b.to ? -1 : 1)));

  const color = {};
  ids.forEach((id) => { color[id] = 'white'; });
  const visiting = []; // gray recursion stack (path order)
  const finished = []; // finish-time stack (push order)
  const frames = [];

  const snap = (extra) => ({
    color: { ...color },
    visiting: [...visiting],
    finished: [...finished],
    order: [...finished].reverse(),
    activeNode: null,
    activeEdge: null,
    backEdge: null,
    pushed: null,
    done: false,
    ...extra,
  });

  frames.push(snap({
    note: 'All nodes white (unvisited). Run DFS over every node; finish stack and order start empty.',
  }));

  function dfs(u) {
    color[u] = 'gray';
    visiting.push(u);
    frames.push(snap({
      activeNode: u,
      note: `Visit ${u}: mark gray and push onto the recursion path. Explore ${u}'s out-edges.`,
    }));

    for (const { to: v, eid } of adj[u]) {
      if (color[v] === 'white') {
        frames.push(snap({
          activeNode: u, activeEdge: eid,
          note: `Edge ${u} -> ${v}: ${v} is white -> tree edge. Recurse into ${v}.`,
        }));
        dfs(v);
        frames.push(snap({
          activeNode: u, activeEdge: eid,
          note: `Back at ${u} after finishing ${v}. Continue ${u}'s remaining edges.`,
        }));
      } else if (color[v] === 'gray') {
        frames.push(snap({
          activeNode: u, activeEdge: eid, backEdge: eid,
          note: `Edge ${u} -> ${v}: ${v} is gray (still on the path) -> BACK EDGE. A back edge means a cycle: NOT a DAG, no topo order. (This demo graph has none.)`,
        }));
      } else {
        frames.push(snap({
          activeNode: u, activeEdge: eid,
          note: `Edge ${u} -> ${v}: ${v} already black (finished). Skip — its order is settled.`,
        }));
      }
    }

    color[u] = 'black';
    visiting.pop();
    finished.push(u);
    frames.push(snap({
      activeNode: u, pushed: u,
      note: `Finish ${u}: all descendants visited -> mark black, pop from path, push ${u} onto the finish stack.`,
    }));
  }

  for (const id of ids) {
    if (color[id] === 'white') {
      frames.push(snap({
        activeNode: id,
        note: `Outer loop: ${id} is still white -> start a fresh DFS from ${id}.`,
      }));
      dfs(id);
    }
  }

  const order = [...finished].reverse();
  frames.push(snap({
    done: true,
    note: `DFS complete. Reverse the finish stack -> topological order: ${order.join(' -> ')}. Every edge u->v has u before v.`,
  }));

  return frames;
}

export default function TopoSortDFSViz() {
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

  const W = 940;
  const H = 360;
  const panelX = 560;

  const nodeFill = (id) => {
    if (current.pushed === id) return 'var(--hue-mint)';
    if (id === current.activeNode) return 'var(--hue-pink)';
    const c = current.color[id];
    if (c === 'black') return 'var(--text-main)';
    if (c === 'gray') return 'rgba(var(--accent-rgb), 0.28)';
    return 'var(--bg)';
  };
  const nodeStroke = (id) => {
    if (current.pushed === id) return 'var(--hue-mint)';
    if (id === current.activeNode) return 'var(--hue-pink)';
    const c = current.color[id];
    if (c === 'black') return 'var(--text-main)';
    if (c === 'gray') return 'var(--accent)';
    return 'var(--border)';
  };
  const labelFill = (id) => {
    const c = current.color[id];
    if (current.pushed === id || id === current.activeNode || c === 'black') return 'var(--bg)';
    return 'var(--text-main)';
  };

  return (
    <div className="tdv">
      <div className="tdv-head">
        <h3 className="tdv-title">Topological sort via DFS finish times — O(V + E)</h3>
        <p className="tdv-sub">
          DFS each node; when a node finishes (all descendants explored) push it onto a stack. The
          topological order is that finish stack reversed. A gray-to-gray edge is a back edge — a cycle,
          so no order exists.
        </p>
      </div>

      <div className="tdv-controls">
        <div className="tdv-actions">
          <div className="tdv-buttons">
            <button
              type="button"
              className="tdv-btn tdv-btn-primary"
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
              className="tdv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="tdv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="tdv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="tdv-speed">
            <span className="tdv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="tdv-speed-range"
            />
            <span className="tdv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="tdv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="tdv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tdv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="tdv-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
            <marker id="tdv-arrow-active" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
            <marker id="tdv-arrow-back" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hard)" />
            </marker>
          </defs>

          <rect x={20} y={20} width={panelX - 44} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={38} className="tdv-row-label">directed acyclic graph (u -&gt; v: u before v)</text>

          {graph.edges.map((e) => {
            const a = graph.nodes.find((n) => n.id === e.u);
            const b = graph.nodes.find((n) => n.id === e.v);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ax = a.x + (dx / len) * NODE_R;
            const ay = a.y + (dy / len) * NODE_R;
            const bx = b.x - (dx / len) * (NODE_R + 4);
            const by = b.y - (dy / len) * (NODE_R + 4);
            const isBack = e.id === current.backEdge;
            const isActive = e.id === current.activeEdge && !isBack;
            const stroke = isBack ? 'var(--hard)' : isActive ? 'var(--hue-pink)' : 'var(--text-dim)';
            const marker = isBack ? 'tdv-arrow-back' : isActive ? 'tdv-arrow-active' : 'tdv-arrow';
            return (
              <line
                key={`e-${e.id}`}
                x1={ax} y1={ay} x2={bx} y2={by}
                stroke={stroke}
                strokeWidth={isBack || isActive ? 2.6 : 1.4}
                opacity={isBack || isActive ? 1 : 0.5}
                markerEnd={`url(#${marker})`}
              />
            );
          })}

          {graph.nodes.map((nd) => {
            const finPos = current.finished.indexOf(nd.id);
            return (
              <g key={`n-${nd.id}`}>
                <circle
                  cx={nd.x} cy={nd.y} r={NODE_R}
                  fill={nodeFill(nd.id)}
                  stroke={nodeStroke(nd.id)}
                  strokeWidth={nd.id === current.activeNode || current.pushed === nd.id ? 3 : 2}
                />
                <text x={nd.x} y={nd.y + 4} className="tdv-node-label" style={{ fill: labelFill(nd.id) }}>{nd.id}</text>
                {finPos >= 0 && (
                  <text x={nd.x} y={nd.y - NODE_R - 6} className="tdv-node-meta">fin {finPos + 1}</text>
                )}
              </g>
            );
          })}

          {/* recursion path (gray nodes) */}
          <text x={32} y={H - 70} className="tdv-row-label">recursion path (gray, visiting)</text>
          {current.visiting.map((vid, i) => (
            <g key={`vis-${vid}`}>
              <rect x={32 + i * 38} y={H - 58} width={32} height={28} rx={5} fill="rgba(var(--accent-rgb), 0.18)" stroke="var(--accent)" strokeWidth={1.5} />
              <text x={32 + i * 38 + 16} y={H - 39} className="tdv-stack-text">{vid}</text>
            </g>
          ))}
          {current.visiting.length === 0 && (
            <text x={32} y={H - 39} className="tdv-empty">empty</text>
          )}

          {/* finish stack (right panel) */}
          <rect x={panelX - 12} y={20} width={W - panelX - 12} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={panelX + 4} y={38} className="tdv-row-label">finish stack (push on finish; bottom -&gt; top)</text>
          {current.finished.map((fid, i) => {
            const justPushed = current.pushed === fid;
            const y = H - 56 - i * 30;
            return (
              <g key={`fin-${fid}`}>
                <rect
                  x={panelX + 4} y={y} width={W - panelX - 32} height={26} rx={5}
                  fill={justPushed ? 'var(--hue-mint)' : 'rgba(var(--accent-rgb), 0.12)'}
                  stroke={justPushed ? 'var(--hue-mint)' : 'var(--border)'}
                  strokeWidth={1.5}
                />
                <text x={panelX + 16} y={y + 18} className="tdv-fin-text" style={{ fill: justPushed ? 'var(--bg)' : 'var(--text-main)' }}>{fid}</text>
                <text x={W - 32} y={y + 18} className="tdv-fin-pos" style={{ fill: justPushed ? 'var(--bg)' : 'var(--text-dim)' }}>#{i + 1}</text>
              </g>
            );
          })}
          {current.finished.length === 0 && (
            <text x={panelX + 4} y={H - 39} className="tdv-empty">empty</text>
          )}
        </svg>
      </div>

      <div className="tdv-panels">
        <div className="tdv-panel">
          <div className="tdv-panel-label">recursion path (gray)</div>
          <div className="tdv-chips">
            {current.visiting.length === 0
              ? <span className="tdv-muted">empty</span>
              : current.visiting.map((id, i) => <span key={`p-${id}-${i}`} className="tdv-chip tdv-chip-gray">{id}</span>)}
          </div>
        </div>
        <div className="tdv-panel">
          <div className="tdv-panel-label">finish stack (push order)</div>
          <div className="tdv-chips">
            {current.finished.length === 0
              ? <span className="tdv-muted">empty</span>
              : current.finished.map((id, i) => <span key={`f-${id}-${i}`} className="tdv-chip tdv-chip-fin">{id}</span>)}
          </div>
        </div>
        <div className="tdv-panel">
          <div className="tdv-panel-label">topological order (stack reversed)</div>
          <div className="tdv-chips">
            {current.order.length === 0
              ? <span className="tdv-muted">none yet</span>
              : current.order.map((id, i) => (
                <span key={`o-${id}-${i}`} className={`tdv-chip tdv-chip-order ${current.done ? 'tdv-chip-final' : ''}`}>
                  {id}{i < current.order.length - 1 && <span className="tdv-sep">-&gt;</span>}
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="tdv-arith">
        <span className="tdv-arith-label">trace</span>
        <span className="tdv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
