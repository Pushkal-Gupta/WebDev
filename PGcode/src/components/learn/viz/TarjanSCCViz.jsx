import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './TarjanSCCViz.css';

// Directed graph laid out so SCCs are visually clustered:
//   {0,1,2} mutually reachable, {3,4} mutually reachable, {5} alone, {6} alone.
function buildGraph() {
  const nodes = [
    { id: 0, x: 130, y: 110 },
    { id: 1, x: 250, y: 70 },
    { id: 2, x: 250, y: 200 },
    { id: 3, x: 410, y: 110 },
    { id: 4, x: 530, y: 70 },
    { id: 5, x: 530, y: 230 },
    { id: 6, x: 380, y: 290 },
  ];
  const edges = [
    { u: 0, v: 1 },
    { u: 1, v: 2 },
    { u: 2, v: 0 }, // back edge closing SCC {0,1,2}
    { u: 1, v: 3 },
    { u: 3, v: 4 },
    { u: 4, v: 3 }, // closes SCC {3,4}
    { u: 4, v: 5 },
    { u: 2, v: 6 },
    { u: 6, v: 5 },
  ];
  edges.forEach((e, i) => { e.id = i; });
  return { nodes, edges };
}

function buildFrames(graph) {
  const { nodes, edges } = graph;
  const n = nodes.length;
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) adj[e.u].push({ to: e.v, eid: e.id });

  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(-1);
  const onStack = new Array(n).fill(false);
  const compOf = new Array(n).fill(-1);
  const stack = [];
  let timer = 0;
  let compCount = 0;
  const frames = [];

  const snap = (extra) => ({
    disc: [...disc],
    low: [...low],
    onStack: [...onStack],
    compOf: [...compOf],
    stack: [...stack],
    activeNode: -1,
    activeEdge: -1,
    poppedComp: null,
    compCount,
    ...extra,
  });

  frames.push(snap({ phase: 'init', note: 'Start: disc[] and low[] unset, stack empty. Run DFS from node 0.' }));

  function dfs(u) {
    disc[u] = low[u] = timer++;
    stack.push(u);
    onStack[u] = true;
    frames.push(snap({
      phase: 'discover', activeNode: u,
      note: `Discover ${u}: disc[${u}] = low[${u}] = ${disc[u]}. Push ${u} onto the stack.`,
    }));

    for (const { to: v, eid } of adj[u]) {
      if (disc[v] === -1) {
        frames.push(snap({
          phase: 'tree-down', activeNode: u, activeEdge: eid,
          note: `Edge ${u}->${v}: ${v} undiscovered -> tree edge. Recurse into ${v}.`,
        }));
        dfs(v);
        low[u] = Math.min(low[u], low[v]);
        frames.push(snap({
          phase: 'low-update', activeNode: u, activeEdge: eid,
          note: `Back from ${v}: low[${u}] = min(low[${u}], low[${v}]) = ${low[u]}.`,
        }));
      } else if (onStack[v]) {
        const prev = low[u];
        low[u] = Math.min(low[u], disc[v]);
        frames.push(snap({
          phase: 'back-edge', activeNode: u, activeEdge: eid,
          note: prev === low[u]
            ? `Edge ${u}->${v}: ${v} on stack -> back edge. low[${u}] unchanged = ${low[u]}.`
            : `Edge ${u}->${v}: ${v} on stack -> back edge. low[${u}] = min(${prev}, disc[${v}]=${disc[v]}) = ${low[u]}.`,
        }));
      } else {
        frames.push(snap({
          phase: 'cross', activeNode: u, activeEdge: eid,
          note: `Edge ${u}->${v}: ${v} already in a finished SCC -> ignore (cross edge).`,
        }));
      }
    }

    if (low[u] === disc[u]) {
      const members = [];
      let w;
      do {
        w = stack.pop();
        onStack[w] = false;
        compOf[w] = compCount;
        members.push(w);
      } while (w !== u);
      compCount++;
      frames.push(snap({
        phase: 'pop-scc', activeNode: u,
        poppedComp: members,
        note: `low[${u}] = disc[${u}] = ${disc[u]} -> ${u} is an SCC root. Pop until ${u}: SCC #${compCount - 1} = {${members.slice().sort((a, b) => a - b).join(', ')}}.`,
      }));
    } else {
      frames.push(snap({
        phase: 'leave', activeNode: u,
        note: `Leave ${u}: low[${u}] = ${low[u]} < disc[${u}] = ${disc[u]}, so ${u} stays on the stack (not a root yet).`,
      }));
    }
  }

  for (let i = 0; i < n; i++) if (disc[i] === -1) dfs(i);

  frames.push(snap({
    phase: 'done', note: `Done. ${compCount} strongly connected component(s) found in one DFS pass, O(V + E).`,
  }));

  return frames;
}

const COMP_COLORS = ['var(--accent)', 'var(--hue-mint)', 'var(--hue-violet)', 'var(--hue-pink)', 'var(--hue-sky)', 'var(--medium)'];

export default function TarjanSCCViz() {
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
  const tableX = 660;
  const tableW = W - tableX - 24;
  const rowH = 26;

  const compColor = (c) => (c < 0 ? null : COMP_COLORS[c % COMP_COLORS.length]);

  return (
    <div className="tsv">
      <div className="tsv-head">
        <h3 className="tsv-title">Tarjan's strongly connected components — O(V + E)</h3>
        <p className="tsv-sub">
          One DFS tracks disc[u] (entry time) and low[u] (earliest disc reachable while u is on the stack). When
          low[u] = disc[u], u roots an SCC: pop the stack down to u.
        </p>
      </div>

      <div className="tsv-controls">
        <div className="tsv-actions">
          <div className="tsv-buttons">
            <button
              type="button"
              className="tsv-btn tsv-btn-primary"
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
              className="tsv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="tsv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="tsv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="tsv-speed">
            <span className="tsv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="tsv-speed-range"
            />
            <span className="tsv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="tsv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="tsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tsv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="tsv-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
            <marker id="tsv-arrow-active" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          <rect x={20} y={20} width={tableX - 44} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={38} className="tsv-row-label">directed graph</text>

          {graph.edges.map((e) => {
            const a = graph.nodes[e.u];
            const b = graph.nodes[e.v];
            const isActive = e.id === current.activeEdge;
            // shorten the line so the arrowhead lands on the node ring, not inside it.
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const r = 20;
            const ax = a.x + (dx / len) * r;
            const ay = a.y + (dy / len) * r;
            const bx = b.x - (dx / len) * (r + 4);
            const by = b.y - (dy / len) * (r + 4);
            const stroke = isActive ? 'var(--hue-pink)' : 'var(--text-dim)';
            return (
              <line
                key={`e-${e.id}`}
                x1={ax} y1={ay} x2={bx} y2={by}
                stroke={stroke}
                strokeWidth={isActive ? 2.6 : 1.4}
                opacity={isActive ? 1 : 0.55}
                markerEnd={`url(#${isActive ? 'tsv-arrow-active' : 'tsv-arrow'})`}
              />
            );
          })}

          {graph.nodes.map((nd) => {
            const isActive = nd.id === current.activeNode;
            const inStack = current.onStack[nd.id];
            const justPopped = current.poppedComp && current.poppedComp.includes(nd.id);
            const comp = current.compOf[nd.id];
            const settledColor = compColor(comp);
            const fill = isActive ? 'var(--hue-pink)'
              : justPopped ? settledColor || 'var(--accent)'
              : settledColor ? settledColor
              : inStack ? 'rgba(var(--accent-rgb), 0.22)'
              : 'var(--bg)';
            const stroke = isActive ? 'var(--hue-pink)'
              : settledColor ? settledColor
              : inStack ? 'var(--accent)'
              : 'var(--border)';
            const labelFill = (settledColor || justPopped || isActive) ? 'var(--bg)' : 'var(--text-main)';
            const discovered = current.disc[nd.id] !== -1;
            return (
              <g key={`n-${nd.id}`}>
                <circle cx={nd.x} cy={nd.y} r={20} fill={fill} stroke={stroke} strokeWidth={isActive ? 3 : 2} />
                <text x={nd.x} y={nd.y + 4} className="tsv-node-label" style={{ fill: labelFill }}>{nd.id}</text>
                {discovered && (
                  <text x={nd.x} y={nd.y - 28} className="tsv-node-meta">
                    {current.disc[nd.id]}/{current.low[nd.id]}
                  </text>
                )}
              </g>
            );
          })}

          {/* DFS stack (bottom-left) */}
          <text x={32} y={H - 70} className="tsv-row-label">dfs stack (top -&gt; right)</text>
          {current.stack.map((sid, i) => (
            <g key={`st-${sid}`}>
              <rect x={32 + i * 40} y={H - 58} width={34} height={28} rx={5} fill="rgba(var(--accent-rgb), 0.18)" stroke="var(--accent)" strokeWidth={1.5} />
              <text x={32 + i * 40 + 17} y={H - 39} className="tsv-stack-text">{sid}</text>
            </g>
          ))}
          {current.stack.length === 0 && (
            <text x={32} y={H - 39} className="tsv-empty">empty</text>
          )}

          {/* disc / low table (right) */}
          <rect x={tableX - 12} y={20} width={tableW + 24} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={tableX} y={38} className="tsv-row-label">disc / low / scc</text>
          {graph.nodes.map((nd, i) => {
            const y = 52 + i * rowH;
            const active = nd.id === current.activeNode;
            const comp = current.compOf[nd.id];
            const c = compColor(comp);
            return (
              <g key={`row-${nd.id}`}>
                <rect
                  x={tableX} y={y} width={tableW} height={rowH - 4}
                  fill={active ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={active ? 'var(--accent)' : 'var(--border)'}
                  rx={4}
                />
                <text x={tableX + 8} y={y + (rowH - 4) / 2 + 4} className="tsv-row-text">n{nd.id}</text>
                <text x={tableX + 44} y={y + (rowH - 4) / 2 + 4} className="tsv-row-meta">
                  d {current.disc[nd.id] < 0 ? '—' : current.disc[nd.id]}
                </text>
                <text x={tableX + 96} y={y + (rowH - 4) / 2 + 4} className="tsv-row-meta">
                  low {current.low[nd.id] < 0 ? '—' : current.low[nd.id]}
                </text>
                {comp >= 0 && (
                  <g>
                    <rect x={tableX + tableW - 30} y={y + 3} width={22} height={rowH - 10} rx={4} fill={c} />
                    <text x={tableX + tableW - 19} y={y + (rowH - 4) / 2 + 4} className="tsv-scc-text">{comp}</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tsv-metrics">
        <div className="tsv-metric">
          <span className="tsv-metric-label">phase</span>
          <span className="tsv-metric-value">{current.phase}</span>
        </div>
        <div className="tsv-metric">
          <span className="tsv-metric-label">SCCs found</span>
          <span className="tsv-metric-value">{current.compCount}</span>
        </div>
        <div className="tsv-metric">
          <span className="tsv-metric-label">on stack</span>
          <span className="tsv-metric-value">[{current.stack.join(', ')}]</span>
        </div>
        <div className="tsv-metric tsv-metric-dim">
          <span className="tsv-metric-label">graph</span>
          <span className="tsv-metric-value tsv-metric-dimval">{graph.nodes.length}n, {graph.edges.length}e directed</span>
        </div>
      </div>

      <div className="tsv-arith">
        <span className="tsv-arith-label">trace</span>
        <span className="tsv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
