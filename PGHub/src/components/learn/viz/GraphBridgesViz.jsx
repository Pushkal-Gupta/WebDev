import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './GraphBridgesViz.css';

// Two cycles joined by a single chain so the structure is unambiguous:
//   square {0,1,2,3} (no bridge inside a cycle), bridge 0-4, bridge 4-5,
//   triangle {5,6,7}. Bridges: 0-4 and 4-5. Articulation: 0, 4, 5.
function buildGraph() {
  const nodes = [
    { id: 0, x: 150, y: 90 },
    { id: 1, x: 150, y: 250 },
    { id: 2, x: 290, y: 250 },
    { id: 3, x: 290, y: 90 },
    { id: 4, x: 420, y: 170 },
    { id: 5, x: 550, y: 170 },
    { id: 6, x: 660, y: 90 },
    { id: 7, x: 660, y: 250 },
  ];
  const rawEdges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [0, 4],
    [4, 5],
    [5, 6], [6, 7], [7, 5],
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
  const edgeKind = {}; // eid -> 'tree' | 'back'
  const bridges = [];
  const apList = [];
  let timer = 0;

  const frames = [];
  const snap = (extra) => ({
    disc: [...disc],
    low: [...low],
    isAP: [...isAP],
    bridges: [...bridges],
    apList: [...apList],
    edgeKind: { ...edgeKind },
    activeNode: -1,
    activeEdge: -1,
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: 'One DFS records disc[u] (entry time) and low[u] (earliest disc reachable from u’s subtree via one back edge). A tree edge u-v is a BRIDGE exactly when low[v] > disc[u]. Start at node 0.',
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
        children += 1;
        edgeKind[eid] = 'tree';
        frames.push(snap({
          phase: 'tree-down', activeNode: u, activeEdge: eid,
          note: `Edge ${u}-${v}: ${v} unvisited -> TREE edge. Recurse into ${v}.`,
        }));
        dfs(v, root);
        const prevLow = low[u];
        low[u] = Math.min(low[u], low[v]);
        frames.push(snap({
          phase: 'low-update', activeNode: u, activeEdge: eid,
          note: `Return to ${u}: low[${u}] = min(${prevLow}, low[${v}]=${low[v]}) = ${low[u]}.`,
        }));

        if (low[v] > disc[u]) {
          bridges.push(eid);
          frames.push(snap({
            phase: 'bridge', activeNode: u, activeEdge: eid,
            note: `low[${v}]=${low[v]} > disc[${u}]=${disc[u]}: ${v}’s subtree never climbs above ${u}, so ${u}-${v} is a BRIDGE.`,
          }));
        } else {
          frames.push(snap({
            phase: 'no-bridge', activeNode: u, activeEdge: eid,
            note: `low[${v}]=${low[v]} <= disc[${u}]=${disc[u]}: a back edge bypasses ${u}, so ${u}-${v} is NOT a bridge.`,
          }));
        }

        if (u !== root && low[v] >= disc[u] && !isAP[u]) {
          isAP[u] = true;
          apList.push(u);
          frames.push(snap({
            phase: 'ap', activeNode: u, activeEdge: eid,
            note: `low[${v}]=${low[v]} >= disc[${u}]=${disc[u]}: child ${v} cannot bypass ${u}, so ${u} is an ARTICULATION POINT.`,
          }));
        }
      } else if (v !== parent[u]) {
        if (edgeKind[eid] === undefined) edgeKind[eid] = 'back';
        const prevLow = low[u];
        low[u] = Math.min(low[u], disc[v]);
        frames.push(snap({
          phase: 'back-edge', activeNode: u, activeEdge: eid,
          note: `Edge ${u}-${v}: ${v} already visited (not parent) -> BACK edge. low[${u}] = min(${prevLow}, disc[${v}]=${disc[v]}) = ${low[u]}.`,
        }));
      }
    }

    if (u === root) {
      if (children >= 2 && !isAP[u]) {
        isAP[u] = true;
        apList.push(u);
        frames.push(snap({
          phase: 'ap-root', activeNode: u,
          note: `Root ${u} has ${children} DFS children: removing it disconnects them, so root ${u} is an ARTICULATION POINT.`,
        }));
      } else {
        frames.push(snap({
          phase: 'leave', activeNode: u,
          note: `Root ${u} has ${children} DFS child${children === 1 ? '' : 'ren'} (< 2): root is NOT an articulation point.`,
        }));
      }
    }
  }

  for (let i = 0; i < n; i += 1) {
    if (disc[i] === -1) dfs(i, i);
  }

  frames.push(snap({
    phase: 'done',
    note: `Done in one O(V + E) pass. Bridges: ${bridges.map((id) => `${edges[id].u}-${edges[id].v}`).join(', ')}. Articulation points: {${apList.slice().sort((a, b) => a - b).join(', ')}}.`,
  }));

  return frames;
}

export default function GraphBridgesViz() {
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
  const tableX = 730;
  const tableW = W - tableX - 20;
  const rowH = 36;

  const bridgeSet = new Set(current.bridges);
  const apLabels = current.apList.slice().sort((a, b) => a - b);
  const bridgeLabels = current.bridges.map((id) => `${graph.edges[id].u}-${graph.edges[id].v}`);

  return (
    <div className="gbv">
      <div className="gbv-head">
        <h3 className="gbv-title">Bridges &amp; articulation points via disc/low</h3>
        <p className="gbv-sub">
          A single DFS classifies every edge tree/back and tracks disc/low. A tree edge u-v is a bridge when
          low[v] &gt; disc[u]; a vertex is a cut point when some child cannot reach above it.
        </p>
      </div>

      <div className="gbv-controls">
        <div className="gbv-actions">
          <div className="gbv-buttons">
            <button
              type="button"
              className="gbv-btn gbv-btn-primary"
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
              className="gbv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="gbv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="gbv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="gbv-speed">
            <span className="gbv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="gbv-speed-range"
            />
            <span className="gbv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="gbv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="gbv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gbv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={tableX - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={28} y={36} className="gbv-row-label">undirected graph</text>

          {graph.edges.map((e) => {
            const a = graph.nodes[e.u];
            const b = graph.nodes[e.v];
            const isActive = e.id === current.activeEdge;
            const isBridge = bridgeSet.has(e.id);
            const kind = current.edgeKind[e.id];
            const stroke = isActive ? 'var(--hue-pink)'
              : isBridge ? 'var(--hard)'
              : kind === 'tree' ? 'var(--accent)'
              : kind === 'back' ? 'var(--hue-sky)'
              : 'var(--text-dim)';
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <g key={`e-${e.id}`}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={stroke}
                  strokeWidth={isActive ? 3.4 : isBridge ? 3 : kind ? 2 : 1.4}
                  strokeDasharray={isBridge ? '7 4' : kind === 'back' ? '3 3' : undefined}
                  opacity={isActive || isBridge || kind ? 1 : 0.5}
                />
                {kind && (
                  <text x={mx} y={my - 4} className="gbv-edge-tag">{kind === 'back' ? 'back' : 'tree'}</text>
                )}
              </g>
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
                <text x={nd.x} y={nd.y + 4} className="gbv-node-label" style={{ fill: labelFill }}>{nd.id}</text>
                {discovered && (
                  <text x={nd.x} y={nd.y - 27} className="gbv-node-meta">
                    {current.disc[nd.id]}/{current.low[nd.id]}
                  </text>
                )}
              </g>
            );
          })}

          <g>
            <line x1={40} y1={H - 50} x2={72} y2={H - 50} stroke="var(--accent)" strokeWidth={2} />
            <text x={80} y={H - 46} className="gbv-legend-text">tree</text>
            <line x1={132} y1={H - 50} x2={164} y2={H - 50} stroke="var(--hue-sky)" strokeWidth={2} strokeDasharray="3 3" />
            <text x={172} y={H - 46} className="gbv-legend-text">back</text>
            <line x1={224} y1={H - 50} x2={256} y2={H - 50} stroke="var(--hard)" strokeWidth={3} strokeDasharray="7 4" />
            <text x={264} y={H - 46} className="gbv-legend-text">bridge</text>
            <circle cx={344} cy={H - 50} r={7} fill="var(--warning)" />
            <text x={356} y={H - 46} className="gbv-legend-text">articulation pt</text>
          </g>

          <rect x={tableX - 10} y={16} width={tableW + 20} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={tableX} y={36} className="gbv-row-label">disc / low</text>
          {graph.nodes.map((nd, i) => {
            const y = 48 + i * rowH;
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
                <text x={tableX + 8} y={y + (rowH - 6) / 2 + 4} className="gbv-row-text">n{nd.id}</text>
                <text x={tableX + 40} y={y + (rowH - 6) / 2 + 4} className="gbv-row-meta">
                  d {current.disc[nd.id] < 0 ? '—' : current.disc[nd.id]}
                </text>
                <text x={tableX + 80} y={y + (rowH - 6) / 2 + 4} className="gbv-row-meta">
                  low {current.low[nd.id] < 0 ? '—' : current.low[nd.id]}
                </text>
                {ap && (
                  <circle cx={tableX + tableW - 12} cy={y + (rowH - 6) / 2} r={5} fill="var(--warning)" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="gbv-metrics">
        <div className="gbv-metric">
          <span className="gbv-metric-label">phase</span>
          <span className="gbv-metric-value">{current.phase}</span>
        </div>
        <div className="gbv-metric">
          <span className="gbv-metric-label">bridges</span>
          <span className="gbv-metric-value">{bridgeLabels.length ? bridgeLabels.join(', ') : 'none yet'}</span>
        </div>
        <div className="gbv-metric">
          <span className="gbv-metric-label">articulation points</span>
          <span className="gbv-metric-value">{apLabels.length ? `{${apLabels.join(', ')}}` : 'none yet'}</span>
        </div>
        <div className="gbv-metric gbv-metric-dim">
          <span className="gbv-metric-label">graph</span>
          <span className="gbv-metric-value gbv-metric-dimval">{graph.nodes.length}n, {graph.edges.length}e</span>
        </div>
      </div>

      <div className="gbv-arith">
        <span className="gbv-arith-label">trace</span>
        <span className="gbv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
