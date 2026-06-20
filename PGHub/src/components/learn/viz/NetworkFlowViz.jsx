import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './NetworkFlowViz.css';

// Flow network laid out left (source s=0) to right (sink t=5).
function buildNetwork() {
  const nodes = [
    { id: 0, label: 's', x: 80, y: 180 },
    { id: 1, label: 'a', x: 280, y: 90 },
    { id: 2, label: 'b', x: 280, y: 270 },
    { id: 3, label: 'c', x: 480, y: 90 },
    { id: 4, label: 'd', x: 480, y: 270 },
    { id: 5, label: 't', x: 680, y: 180 },
  ];
  // directed edges with capacities (a classic max-flow = 23 instance shape).
  const edges = [
    { u: 0, v: 1, cap: 16 },
    { u: 0, v: 2, cap: 13 },
    { u: 1, v: 2, cap: 10 },
    { u: 2, v: 1, cap: 4 },
    { u: 1, v: 3, cap: 12 },
    { u: 2, v: 4, cap: 14 },
    { u: 3, v: 2, cap: 9 },
    { u: 4, v: 3, cap: 7 },
    { u: 3, v: 5, cap: 20 },
    { u: 4, v: 5, cap: 4 },
  ];
  edges.forEach((e, i) => { e.id = i; });
  return { nodes, edges, source: 0, sink: 5 };
}

// Edmonds-Karp: BFS augmenting paths on the residual graph.
// Each forward edge id gets a paired residual reverse edge.
function buildFrames(net) {
  const { nodes, edges, source, sink } = net;
  const n = nodes.length;
  // residual adjacency: each entry { to, cap, flow, rev (index in adj[to]), orig (edge id or -1), fwd }
  const adj = Array.from({ length: n }, () => []);
  const edgeRef = {}; // orig edge id -> {node, idx} so we can read flow for drawing
  for (const e of edges) {
    const fwd = { to: e.v, cap: e.cap, flow: 0, rev: adj[e.v].length, orig: e.id, fwd: true };
    const bwd = { to: e.u, cap: 0, flow: 0, rev: adj[e.u].length, orig: e.id, fwd: false };
    adj[e.u].push(fwd);
    adj[e.v].push(bwd);
    edgeRef[e.id] = { node: e.u, idx: adj[e.u].length - 1 };
  }

  const frames = [];
  let maxFlow = 0;

  // snapshot of current flow on each original edge + residual capacities
  const snap = (extra) => {
    const flowOf = {};
    const residOf = {};
    for (const e of edges) {
      const ref = edgeRef[e.id];
      const a = adj[ref.node][ref.idx];
      flowOf[e.id] = a.flow;
      residOf[e.id] = a.cap - a.flow;
    }
    return {
      flowOf,
      residOf,
      maxFlow,
      pathNodes: [],
      pathEdges: [],
      visited: [],
      bottleneck: null,
      minCutS: null,
      cutEdges: [],
      activeEdge: -1,
      phase: 'init',
      ...extra,
    };
  };

  frames.push(snap({ phase: 'init', note: 'Residual graph initialized: every forward edge carries flow 0. Repeatedly BFS from s to t for an augmenting path.' }));

  while (true) {
    // BFS over residual edges with positive residual capacity.
    const parent = new Array(n).fill(null); // {prevNode, adjIdx}
    const visited = new Array(n).fill(false);
    visited[source] = true;
    const queue = [source];
    let found = false;
    while (queue.length && !found) {
      const u = queue.shift();
      for (let i = 0; i < adj[u].length; i++) {
        const a = adj[u][i];
        if (!visited[a.to] && a.cap - a.flow > 0) {
          visited[a.to] = true;
          parent[a.to] = { prev: u, idx: i };
          if (a.to === sink) { found = true; break; }
          queue.push(a.to);
        }
      }
    }

    if (!found) {
      // No augmenting path -> min cut is the set of nodes reachable from s.
      const reachable = [];
      for (let i = 0; i < n; i++) if (visited[i]) reachable.push(i);
      const cutEdges = edges.filter((e) => visited[e.u] && !visited[e.v]).map((e) => e.id);
      frames.push(snap({
        phase: 'min-cut',
        visited: reachable,
        minCutS: reachable,
        cutEdges,
        note: `No augmenting path from s. Done. Min cut = nodes reachable from s {${reachable.map((i) => nodes[i].label).join(', ')}}; its saturated edges sum to the max flow ${maxFlow}.`,
      }));
      break;
    }

    // reconstruct path s..t
    const pathNodes = [];
    const pathAdj = []; // list of { node, idx }
    let cur = sink;
    let bottleneck = Infinity;
    while (cur !== source) {
      const p = parent[cur];
      pathAdj.push({ node: p.prev, idx: p.idx });
      const a = adj[p.prev][p.idx];
      bottleneck = Math.min(bottleneck, a.cap - a.flow);
      cur = p.prev;
    }
    pathAdj.reverse();
    pathNodes.push(source);
    for (const pa of pathAdj) pathNodes.push(adj[pa.node][pa.idx].to);

    const pathEdgeIds = pathAdj.map((pa) => adj[pa.node][pa.idx].orig);
    const pathLabel = pathNodes.map((i) => nodes[i].label).join(' -> ');
    const reachableNow = [];
    for (let i = 0; i < n; i++) if (visited[i]) reachableNow.push(i);

    frames.push(snap({
      phase: 'bfs',
      pathNodes: [...pathNodes],
      pathEdges: [...pathEdgeIds],
      visited: reachableNow,
      bottleneck,
      note: `BFS found augmenting path ${pathLabel}. Bottleneck = min residual along it = ${bottleneck}.`,
    }));

    // augment
    for (const pa of pathAdj) {
      const a = adj[pa.node][pa.idx];
      a.flow += bottleneck;
      adj[a.to][a.rev].flow -= bottleneck;
    }
    maxFlow += bottleneck;

    frames.push(snap({
      phase: 'augment',
      pathNodes: [...pathNodes],
      pathEdges: [...pathEdgeIds],
      bottleneck,
      note: `Pushed ${bottleneck} along ${pathLabel}. Residual capacities updated (reverse edges gain ${bottleneck}). Total flow = ${maxFlow}.`,
    }));
  }

  return frames;
}

export default function NetworkFlowViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { frames, net } = useMemo(() => {
    const g = buildNetwork();
    return { frames: buildFrames(g), net: g };
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

  const W = 760;
  const H = 380;

  const pathEdgeSet = new Set(current.pathEdges);
  const pathNodeSet = new Set(current.pathNodes);
  const visitedSet = new Set(current.visited);
  const cutSet = new Set(current.cutEdges);
  const minCutSet = current.minCutS ? new Set(current.minCutS) : null;

  return (
    <div className="nfv">
      <div className="nfv-head">
        <h3 className="nfv-title">Maximum flow — Edmonds-Karp (BFS augmenting paths)</h3>
        <p className="nfv-sub">
          Repeatedly BFS the residual graph from source s to sink t. Each path pushes its bottleneck capacity; when no
          path remains, the reachable set is one side of the minimum cut.
        </p>
      </div>

      <div className="nfv-controls">
        <div className="nfv-actions">
          <div className="nfv-buttons">
            <button
              type="button"
              className="nfv-btn nfv-btn-primary"
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
              className="nfv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="nfv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="nfv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="nfv-speed">
            <span className="nfv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="nfv-speed-range"
            />
            <span className="nfv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="nfv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="nfv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="nfv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="nfv-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
            <marker id="nfv-arrow-path" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
            <marker id="nfv-arrow-cut" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hard)" />
            </marker>
          </defs>

          {net.edges.map((e) => {
            const a = net.nodes[e.u];
            const b = net.nodes[e.v];
            const onPath = pathEdgeSet.has(e.id);
            const onCut = cutSet.has(e.id);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = dx / len;
            const ny = dy / len;
            // perpendicular offset so opposing edges (a<->b) don't overlap.
            const px = -ny;
            const py = nx;
            const off = 8;
            const r = 22;
            const ax = a.x + nx * r + px * off;
            const ay = a.y + ny * r + py * off;
            const bx = b.x - nx * (r + 4) + px * off;
            const by = b.y - ny * (r + 4) + py * off;
            const f = current.flowOf[e.id];
            const stroke = onCut ? 'var(--hard)' : onPath ? 'var(--hue-pink)' : f > 0 ? 'var(--accent)' : 'var(--text-dim)';
            const sw = onPath || onCut ? 3 : f > 0 ? 2.4 : 1.4;
            const marker = onCut ? 'nfv-arrow-cut' : onPath ? 'nfv-arrow-path' : 'nfv-arrow';
            const mx = (ax + bx) / 2 + px * 9;
            const my = (ay + by) / 2 + py * 9;
            return (
              <g key={`e-${e.id}`}>
                <line
                  x1={ax} y1={ay} x2={bx} y2={by}
                  stroke={stroke}
                  strokeWidth={sw}
                  opacity={onPath || onCut || f > 0 ? 1 : 0.5}
                  markerEnd={`url(#${marker})`}
                />
                <text x={mx} y={my} className="nfv-edge-label" style={{ fill: onPath ? 'var(--hue-pink)' : onCut ? 'var(--hard)' : 'var(--text-dim)' }}>
                  {f}/{e.cap}
                </text>
              </g>
            );
          })}

          {net.nodes.map((nd) => {
            const isSrc = nd.id === net.source;
            const isSink = nd.id === net.sink;
            const onPath = pathNodeSet.has(nd.id);
            const inCut = minCutSet ? minCutSet.has(nd.id) : false;
            const inVisited = visitedSet.has(nd.id);
            const fill = onPath ? 'var(--hue-pink)'
              : inCut ? 'rgba(var(--accent-rgb), 0.3)'
              : isSrc || isSink ? 'var(--accent)'
              : inVisited ? 'rgba(var(--accent-rgb), 0.18)'
              : 'var(--bg)';
            const stroke = onPath ? 'var(--hue-pink)'
              : inCut ? 'var(--accent)'
              : isSrc || isSink ? 'var(--accent)'
              : 'var(--border)';
            const labelFill = (onPath || isSrc || isSink) ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${nd.id}`}>
                <circle cx={nd.x} cy={nd.y} r={22} fill={fill} stroke={stroke} strokeWidth={onPath ? 3 : 2} />
                <text x={nd.x} y={nd.y + 5} className="nfv-node-label" style={{ fill: labelFill }}>{nd.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="nfv-metrics">
        <div className="nfv-metric">
          <span className="nfv-metric-label">flow value</span>
          <span className="nfv-metric-value">{current.maxFlow}</span>
        </div>
        <div className="nfv-metric">
          <span className="nfv-metric-label">phase</span>
          <span className="nfv-metric-value">{current.phase}</span>
        </div>
        <div className="nfv-metric">
          <span className="nfv-metric-label">bottleneck</span>
          <span className="nfv-metric-value">{current.bottleneck == null ? '—' : current.bottleneck}</span>
        </div>
        <div className="nfv-metric nfv-metric-dim">
          <span className="nfv-metric-label">aug. path</span>
          <span className="nfv-metric-value nfv-metric-dimval">
            {current.pathNodes.length ? current.pathNodes.map((i) => net.nodes[i].label).join('→') : '—'}
          </span>
        </div>
      </div>

      <div className="nfv-arith">
        <span className="nfv-arith-label">trace</span>
        <span className="nfv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
