import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './MinCostMaxFlowViz.css';

// Flow network laid out left (source s=0) to right (sink t=4).
// Each edge carries a capacity AND a cost per unit of flow.
function buildNetwork() {
  const nodes = [
    { id: 0, label: 's', x: 90, y: 190 },
    { id: 1, label: '1', x: 320, y: 90 },
    { id: 2, label: '2', x: 320, y: 290 },
    { id: 3, label: '3', x: 560, y: 190 },
    { id: 4, label: 't', x: 790, y: 190 },
  ];
  // directed edges: cap = capacity, cost = cost per unit flow.
  // Successive-shortest-path MCMF on this instance: max flow 5, min cost 24.
  const edges = [
    { u: 0, v: 1, cap: 3, cost: 1 },
    { u: 0, v: 2, cap: 2, cost: 2 },
    { u: 1, v: 2, cap: 2, cost: 1 },
    { u: 1, v: 3, cap: 3, cost: 3 },
    { u: 2, v: 3, cap: 2, cost: 1 },
    { u: 2, v: 4, cap: 2, cost: 4 },
    { u: 3, v: 4, cap: 4, cost: 1 },
  ];
  edges.forEach((e, i) => { e.id = i; });
  return { nodes, edges, source: 0, sink: 4 };
}

// Successive shortest augmenting paths. Residual edges carry NEGATIVE cost,
// so the shortest-cost path is found with SPFA (Bellman-Ford queue variant).
function buildFrames(net) {
  const { nodes, edges, source, sink } = net;
  const n = nodes.length;
  // residual adjacency: { to, cap, cost, flow, rev, orig (edge id or -1), fwd }
  const adj = Array.from({ length: n }, () => []);
  const edgeRef = {};
  for (const e of edges) {
    const fwd = { to: e.v, cap: e.cap, cost: e.cost, flow: 0, rev: adj[e.v].length, orig: e.id, fwd: true };
    const bwd = { to: e.u, cap: 0, cost: -e.cost, flow: 0, rev: adj[e.u].length, orig: e.id, fwd: false };
    adj[e.u].push(fwd);
    adj[e.v].push(bwd);
    edgeRef[e.id] = { node: e.u, idx: adj[e.u].length - 1 };
  }

  const frames = [];
  let totalFlow = 0;
  let totalCost = 0;

  const snap = (extra) => {
    const flowOf = {};
    for (const e of edges) {
      const ref = edgeRef[e.id];
      flowOf[e.id] = adj[ref.node][ref.idx].flow;
    }
    return {
      flowOf,
      totalFlow,
      totalCost,
      pathNodes: [],
      pathEdges: [],
      dist: new Array(n).fill(null),
      relaxNode: -1,
      bottleneck: null,
      pathCost: null,
      phase: 'init',
      ...extra,
    };
  };

  frames.push(snap({
    phase: 'init',
    note: 'Every edge starts with flow 0 and a cost per unit. Repeatedly find the cheapest (shortest-cost) augmenting path from s to t, then push its bottleneck flow.',
  }));

  let iter = 0;
  while (true) {
    iter += 1;
    // SPFA: shortest path by COST over residual edges with positive residual capacity.
    const dist = new Array(n).fill(Infinity);
    const inq = new Array(n).fill(false);
    const pv = new Array(n).fill(-1);
    const pe = new Array(n).fill(-1);
    dist[source] = 0;
    const queue = [source];
    inq[source] = true;
    while (queue.length) {
      const u = queue.shift();
      inq[u] = false;
      for (let i = 0; i < adj[u].length; i++) {
        const a = adj[u][i];
        if (a.cap - a.flow > 0 && dist[u] + a.cost < dist[a.to]) {
          dist[a.to] = dist[u] + a.cost;
          pv[a.to] = u;
          pe[a.to] = i;
          if (!inq[a.to]) { inq[a.to] = true; queue.push(a.to); }
        }
      }
    }

    if (dist[sink] === Infinity) {
      frames.push(snap({
        phase: 'done',
        dist: dist.map((d) => (d === Infinity ? null : d)),
        note: `No augmenting path remains from s. Done. Maximum flow = ${totalFlow} at minimum total cost = ${totalCost}.`,
      }));
      break;
    }

    // reconstruct cheapest path s..t and its bottleneck residual capacity.
    const pathNodes = [];
    const pathAdj = [];
    let cur = sink;
    let bottleneck = Infinity;
    while (cur !== source) {
      const u = pv[cur];
      pathAdj.push({ node: u, idx: pe[cur] });
      const a = adj[u][pe[cur]];
      bottleneck = Math.min(bottleneck, a.cap - a.flow);
      cur = u;
    }
    pathAdj.reverse();
    pathNodes.push(source);
    for (const pa of pathAdj) pathNodes.push(adj[pa.node][pa.idx].to);
    const pathEdgeIds = pathAdj.map((pa) => adj[pa.node][pa.idx].orig);
    const pathLabel = pathNodes.map((i) => nodes[i].label).join(' -> ');
    const pathCost = dist[sink];

    frames.push(snap({
      phase: 'relax',
      pathNodes: [...pathNodes],
      pathEdges: [...pathEdgeIds],
      dist: dist.map((d) => (d === Infinity ? null : d)),
      bottleneck,
      pathCost,
      note: `Iteration ${iter}: SPFA relaxes costs (dist[t] = ${pathCost}). Cheapest path ${pathLabel} at ${pathCost}/unit. Bottleneck = min residual along it = ${bottleneck}.`,
    }));

    // augment along the path; reverse residual edges absorb the flow.
    for (const pa of pathAdj) {
      const a = adj[pa.node][pa.idx];
      a.flow += bottleneck;
      adj[a.to][a.rev].flow -= bottleneck;
    }
    totalFlow += bottleneck;
    totalCost += bottleneck * pathCost;

    frames.push(snap({
      phase: 'augment',
      pathNodes: [...pathNodes],
      pathEdges: [...pathEdgeIds],
      dist: dist.map((d) => (d === Infinity ? null : d)),
      bottleneck,
      pathCost,
      note: `Push ${bottleneck} along ${pathLabel} at ${pathCost}/unit -> +${bottleneck * pathCost} cost. Reverse edges gain residual capacity (negative cost). flow = ${totalFlow}, cost = ${totalCost}.`,
    }));
  }

  return frames;
}

export default function MinCostMaxFlowViz() {
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
  const delay = Math.round(1000 / speed);

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

  const W = 880;
  const H = 380;

  const pathEdgeSet = new Set(current.pathEdges);
  const pathNodeSet = new Set(current.pathNodes);

  return (
    <div className="mcmf">
      <div className="mcmf-head">
        <h3 className="mcmf-title">Min-cost max-flow — successive shortest augmenting paths</h3>
        <p className="mcmf-sub">
          Each edge has a capacity and a cost per unit. Repeatedly take the cheapest s-to-t path (SPFA / Bellman-Ford,
          since residual edges carry negative cost), push its bottleneck, and update residuals — until no path remains.
        </p>
      </div>

      <div className="mcmf-controls">
        <div className="mcmf-actions">
          <div className="mcmf-buttons">
            <button
              type="button"
              className="mcmf-btn mcmf-btn-primary"
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
              className="mcmf-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="mcmf-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="mcmf-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="mcmf-speed">
            <span className="mcmf-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="mcmf-speed-range"
            />
            <span className="mcmf-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="mcmf-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="mcmf-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mcmf-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mcmf-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
            <marker id="mcmf-arrow-flow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--accent)" />
            </marker>
            <marker id="mcmf-arrow-path" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          {net.edges.map((e) => {
            const a = net.nodes[e.u];
            const b = net.nodes[e.v];
            const onPath = pathEdgeSet.has(e.id);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = dx / len;
            const ny = dy / len;
            const px = -ny;
            const py = nx;
            const off = 9;
            const r = 24;
            const ax = a.x + nx * r + px * off;
            const ay = a.y + ny * r + py * off;
            const bx = b.x - nx * (r + 4) + px * off;
            const by = b.y - ny * (r + 4) + py * off;
            const f = current.flowOf[e.id];
            const stroke = onPath ? 'var(--hue-pink)' : f > 0 ? 'var(--accent)' : 'var(--text-dim)';
            const sw = onPath ? 3.2 : f > 0 ? 2.4 : 1.4;
            const marker = onPath ? 'mcmf-arrow-path' : f > 0 ? 'mcmf-arrow-flow' : 'mcmf-arrow';
            const mx = (ax + bx) / 2 + px * 11;
            const my = (ay + by) / 2 + py * 11;
            const labelFill = onPath ? 'var(--hue-pink)' : f > 0 ? 'var(--accent)' : 'var(--text-dim)';
            return (
              <g key={`e-${e.id}`}>
                <line
                  x1={ax} y1={ay} x2={bx} y2={by}
                  stroke={stroke}
                  strokeWidth={sw}
                  opacity={onPath || f > 0 ? 1 : 0.55}
                  markerEnd={`url(#${marker})`}
                />
                <text x={mx} y={my} className="mcmf-edge-label" style={{ fill: labelFill }}>
                  {f}/{e.cap} @ {e.cost}
                </text>
              </g>
            );
          })}

          {net.nodes.map((nd) => {
            const isSrc = nd.id === net.source;
            const isSink = nd.id === net.sink;
            const onPath = pathNodeSet.has(nd.id);
            const d = current.dist[nd.id];
            const fill = onPath ? 'var(--hue-pink)'
              : isSrc || isSink ? 'var(--accent)'
              : 'var(--bg)';
            const stroke = onPath ? 'var(--hue-pink)'
              : isSrc || isSink ? 'var(--accent)'
              : 'var(--border)';
            const labelFill = (onPath || isSrc || isSink) ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${nd.id}`}>
                <circle cx={nd.x} cy={nd.y} r={24} fill={fill} stroke={stroke} strokeWidth={onPath ? 3 : 2} />
                <text x={nd.x} y={nd.y + 5} className="mcmf-node-label" style={{ fill: labelFill }}>{nd.label}</text>
                {d != null && (
                  <text x={nd.x} y={nd.y - 32} className="mcmf-node-dist">dist {d}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mcmf-metrics">
        <div className="mcmf-metric">
          <span className="mcmf-metric-label">total flow</span>
          <span className="mcmf-metric-value">{current.totalFlow}</span>
        </div>
        <div className="mcmf-metric">
          <span className="mcmf-metric-label">total cost</span>
          <span className="mcmf-metric-value">{current.totalCost}</span>
        </div>
        <div className="mcmf-metric">
          <span className="mcmf-metric-label">path cost / unit</span>
          <span className="mcmf-metric-value">{current.pathCost == null ? '—' : current.pathCost}</span>
        </div>
        <div className="mcmf-metric">
          <span className="mcmf-metric-label">bottleneck</span>
          <span className="mcmf-metric-value">{current.bottleneck == null ? '—' : current.bottleneck}</span>
        </div>
        <div className="mcmf-metric mcmf-metric-dim">
          <span className="mcmf-metric-label">aug. path</span>
          <span className="mcmf-metric-value mcmf-metric-dimval">
            {current.pathNodes.length ? current.pathNodes.map((i) => net.nodes[i].label).join('→') : '—'}
          </span>
        </div>
      </div>

      <div className="mcmf-arith">
        <span className="mcmf-arith-label">trace</span>
        <span className="mcmf-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
