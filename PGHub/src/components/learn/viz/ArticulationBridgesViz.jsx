import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './ArticulationBridgesViz.css';

// Undirected graph with a known cut-vertex / bridge structure:
//   triangle {0,1,2}, then bridge 1-3, triangle {3,4,5}, then bridge 3-6 (leaf).
//   Articulation points: 1 and 3. Bridges: 1-3 and 3-6.
function buildGraph() {
  const nodes = [
    { id: 0, x: 110, y: 80 },
    { id: 1, x: 220, y: 160 },
    { id: 2, x: 110, y: 240 },
    { id: 3, x: 400, y: 160 },
    { id: 4, x: 510, y: 80 },
    { id: 5, x: 510, y: 240 },
    { id: 6, x: 560, y: 160 },
  ];
  const rawEdges = [
    [0, 1], [1, 2], [2, 0],
    [1, 3],
    [3, 4], [4, 5], [5, 3],
    [3, 6],
  ];
  const edges = rawEdges.map(([u, v], id) => ({ id, u, v }));
  return { nodes, edges };
}

function buildFrames(graph) {
  const { nodes, edges } = graph;
  const n = nodes.length;
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) {
    adj[e.u].push({ to: e.v, eid: e.id });
    adj[e.v].push({ to: e.u, eid: e.id });
  }

  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(-1);
  const parent = new Array(n).fill(-1);
  const isAP = new Array(n).fill(false);
  const bridges = []; // edge ids
  const apList = []; // node ids in discovery order
  let timer = 0;

  const frames = [];
  const snap = (extra) => ({
    disc: [...disc],
    low: [...low],
    isAP: [...isAP],
    bridges: [...bridges],
    apList: [...apList],
    activeNode: -1,
    activeEdge: -1,
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: 'Undirected graph. One DFS computes disc[u] (entry time) and low[u] (lowest disc reachable from u\'s subtree via a single back edge). Start DFS at node 0 (the root).',
  }));

  function dfs(u, root) {
    disc[u] = low[u] = timer++;
    let children = 0;
    frames.push(snap({
      phase: 'discover', activeNode: u,
      note: `Discover ${u}: disc[${u}] = low[${u}] = ${disc[u]}.`,
    }));

    for (const { to: v, eid } of adj[u]) {
      if (disc[v] === -1) {
        parent[v] = u;
        children++;
        frames.push(snap({
          phase: 'tree-down', activeNode: u, activeEdge: eid,
          note: `Edge ${u}-${v}: ${v} undiscovered -> tree edge. Recurse into ${v}.`,
        }));
        dfs(v, root);
        const prevLow = low[u];
        low[u] = Math.min(low[u], low[v]);
        frames.push(snap({
          phase: 'low-update', activeNode: u, activeEdge: eid,
          note: prevLow === low[u]
            ? `Back at ${u} from ${v}: low[${u}] = min(${prevLow}, low[${v}]=${low[v]}) = ${low[u]} (unchanged).`
            : `Back at ${u} from ${v}: low[${u}] = min(${prevLow}, low[${v}]=${low[v]}) = ${low[u]}.`,
        }));

        // Bridge test: low[v] > disc[u].
        if (low[v] > disc[u]) {
          bridges.push(eid);
          frames.push(snap({
            phase: 'bridge', activeNode: u, activeEdge: eid,
            note: `low[${v}]=${low[v]} > disc[${u}]=${disc[u]}: nothing in ${v}'s subtree climbs above ${u}, so edge ${u}-${v} is a BRIDGE.`,
          }));
        } else {
          frames.push(snap({
            phase: 'no-bridge', activeNode: u, activeEdge: eid,
            note: `low[${v}]=${low[v]} <= disc[${u}]=${disc[u]}: ${v}'s subtree reaches at or above ${u}, so edge ${u}-${v} is NOT a bridge.`,
          }));
        }

        // Articulation test for non-root: low[v] >= disc[u].
        if (u !== root && low[v] >= disc[u] && !isAP[u]) {
          isAP[u] = true;
          apList.push(u);
          frames.push(snap({
            phase: 'ap', activeNode: u, activeEdge: eid,
            note: `low[${v}]=${low[v]} >= disc[${u}]=${disc[u]}: child ${v} cannot bypass ${u}, so ${u} is an ARTICULATION POINT.`,
          }));
        }
      } else if (v !== parent[u]) {
        const prevLow = low[u];
        low[u] = Math.min(low[u], disc[v]);
        frames.push(snap({
          phase: 'back-edge', activeNode: u, activeEdge: eid,
          note: prevLow === low[u]
            ? `Edge ${u}-${v}: ${v} already visited and not the parent -> back edge. low[${u}] = min(${prevLow}, disc[${v}]=${disc[v]}) = ${low[u]} (unchanged).`
            : `Edge ${u}-${v}: ${v} already visited and not the parent -> back edge. low[${u}] = min(${prevLow}, disc[${v}]=${disc[v]}) = ${low[u]}.`,
        }));
      }
    }

    // Root articulation test: >= 2 DFS children.
    if (u === root) {
      if (children >= 2 && !isAP[u]) {
        isAP[u] = true;
        apList.push(u);
        frames.push(snap({
          phase: 'ap-root', activeNode: u,
          note: `Root ${u} has ${children} DFS children: removing it splits the tree, so root ${u} is an ARTICULATION POINT.`,
        }));
      } else {
        frames.push(snap({
          phase: 'leave', activeNode: u,
          note: `Root ${u} has ${children} DFS child${children === 1 ? '' : 'ren'} (< 2): root is NOT an articulation point.`,
        }));
      }
    }
  }

  for (let i = 0; i < n; i++) {
    if (disc[i] === -1) dfs(i, i);
  }

  frames.push(snap({
    phase: 'done',
    note: `Done in one DFS pass, O(V + E). Articulation points: {${apList.slice().sort((a, b) => a - b).join(', ')}}. Bridges: ${bridges.map((id) => `${edges[id].u}-${edges[id].v}`).join(', ')}.`,
  }));

  return frames;
}

export default function ArticulationBridgesViz() {
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
  const tableX = 660;
  const tableW = W - tableX - 24;
  const rowH = 38;

  const bridgeSet = new Set(current.bridges);

  const apLabels = current.apList.slice().sort((a, b) => a - b);
  const bridgeLabels = current.bridges.map((id) => `${graph.edges[id].u}-${graph.edges[id].v}`);

  return (
    <div className="abv">
      <div className="abv-head">
        <h3 className="abv-title">Articulation points &amp; bridges — Tarjan, O(V + E)</h3>
        <p className="abv-sub">
          One DFS tracks disc[u] (entry time) and low[u] (earliest entry reachable from u&apos;s subtree via a back edge).
          Edge u-v is a bridge when low[v] &gt; disc[u]; node u is a cut vertex when a child v has low[v] &gt;= disc[u]
          (or the root has &gt;= 2 DFS children).
        </p>
      </div>

      <div className="abv-controls">
        <div className="abv-actions">
          <div className="abv-buttons">
            <button
              type="button"
              className="abv-btn abv-btn-primary"
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
              className="abv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="abv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="abv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="abv-speed">
            <span className="abv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="abv-speed-range"
            />
            <span className="abv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="abv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="abv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="abv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={tableX - 44} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={40} className="abv-row-label">undirected graph</text>

          {graph.edges.map((e) => {
            const a = graph.nodes[e.u];
            const b = graph.nodes[e.v];
            const isActive = e.id === current.activeEdge;
            const isBridge = bridgeSet.has(e.id);
            const stroke = isActive ? 'var(--hue-pink)'
              : isBridge ? 'var(--hard)'
              : 'var(--text-dim)';
            return (
              <line
                key={`e-${e.id}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={stroke}
                strokeWidth={isActive ? 3.2 : isBridge ? 3 : 1.5}
                strokeDasharray={isBridge ? '7 4' : undefined}
                opacity={isActive || isBridge ? 1 : 0.5}
              />
            );
          })}

          {graph.nodes.map((nd) => {
            const isActive = nd.id === current.activeNode;
            const ap = current.isAP[nd.id];
            const discovered = current.disc[nd.id] !== -1;
            const fill = isActive ? 'var(--hue-pink)'
              : ap ? 'var(--warning)'
              : discovered ? 'rgba(var(--accent-rgb), 0.18)'
              : 'var(--bg)';
            const stroke = isActive ? 'var(--hue-pink)'
              : ap ? 'var(--warning)'
              : discovered ? 'var(--accent)'
              : 'var(--border)';
            const labelFill = (isActive || ap) ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${nd.id}`}>
                {ap && (
                  <circle cx={nd.x} cy={nd.y} r={24} fill="none" stroke="var(--warning)" strokeWidth={1.5} opacity={0.55} />
                )}
                <circle cx={nd.x} cy={nd.y} r={19} fill={fill} stroke={stroke} strokeWidth={isActive ? 3 : 2} />
                <text x={nd.x} y={nd.y + 4} className="abv-node-label" style={{ fill: labelFill }}>{nd.id}</text>
                {discovered && (
                  <text x={nd.x} y={nd.y - 27} className="abv-node-meta">
                    {current.disc[nd.id]}/{current.low[nd.id]}
                  </text>
                )}
              </g>
            );
          })}

          {/* legend */}
          <g>
            <circle cx={42} cy={H - 54} r={7} fill="var(--warning)" />
            <text x={56} y={H - 50} className="abv-legend-text">articulation point</text>
            <line x1={196} y1={H - 54} x2={228} y2={H - 54} stroke="var(--hard)" strokeWidth={3} strokeDasharray="7 4" />
            <text x={236} y={H - 50} className="abv-legend-text">bridge</text>
            <text x={32} y={H - 28} className="abv-legend-text">node label shows disc/low</text>
          </g>

          {/* disc / low table (right) */}
          <rect x={tableX - 12} y={20} width={tableW + 24} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={tableX} y={40} className="abv-row-label">disc / low</text>
          {graph.nodes.map((nd, i) => {
            const y = 54 + i * rowH;
            const active = nd.id === current.activeNode;
            const ap = current.isAP[nd.id];
            return (
              <g key={`row-${nd.id}`}>
                <rect
                  x={tableX} y={y} width={tableW} height={rowH - 6}
                  fill={active ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={active ? 'var(--accent)' : 'var(--border)'}
                  rx={4}
                />
                <text x={tableX + 8} y={y + (rowH - 6) / 2 + 4} className="abv-row-text">n{nd.id}</text>
                <text x={tableX + 40} y={y + (rowH - 6) / 2 + 4} className="abv-row-meta">
                  d {current.disc[nd.id] < 0 ? '—' : current.disc[nd.id]}
                </text>
                <text x={tableX + 84} y={y + (rowH - 6) / 2 + 4} className="abv-row-meta">
                  low {current.low[nd.id] < 0 ? '—' : current.low[nd.id]}
                </text>
                {ap && (
                  <circle cx={tableX + tableW - 14} cy={y + (rowH - 6) / 2} r={5} fill="var(--warning)" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="abv-metrics">
        <div className="abv-metric">
          <span className="abv-metric-label">phase</span>
          <span className="abv-metric-value">{current.phase}</span>
        </div>
        <div className="abv-metric">
          <span className="abv-metric-label">articulation points</span>
          <span className="abv-metric-value">{apLabels.length ? `{${apLabels.join(', ')}}` : 'none yet'}</span>
        </div>
        <div className="abv-metric">
          <span className="abv-metric-label">bridges</span>
          <span className="abv-metric-value">{bridgeLabels.length ? bridgeLabels.join(', ') : 'none yet'}</span>
        </div>
        <div className="abv-metric abv-metric-dim">
          <span className="abv-metric-label">graph</span>
          <span className="abv-metric-value abv-metric-dimval">{graph.nodes.length}n, {graph.edges.length}e undirected</span>
        </div>
      </div>

      <div className="abv-arith">
        <span className="abv-arith-label">trace</span>
        <span className="abv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
