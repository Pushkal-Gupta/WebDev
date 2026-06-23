import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './TarjanArticulationViz.css';

// Graph from the concept's visualization: triangle 1-2-3, then chain 3-4-5.
// 0-indexed here: triangle {0,1,2}, chain 2-3, 3-4.
function buildGraph() {
  const nodes = [
    { id: 0, x: 130, y: 90 },
    { id: 1, x: 130, y: 250 },
    { id: 2, x: 300, y: 170 },
    { id: 3, x: 470, y: 170 },
    { id: 4, x: 620, y: 170 },
  ];
  const rawEdges = [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4]];
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
  const bridges = [];
  const apList = [];
  let timer = 0;
  const frames = [];
  const snap = (extra) => ({
    disc: [...disc], low: [...low], isAP: [...isAP], bridges: [...bridges], apList: [...apList],
    activeNode: -1, activeEdge: -1, ...extra,
  });
  frames.push(snap({ phase: 'init', note: 'One DFS computes disc[u] (visit time) and low[u] (earliest disc reachable from u\'s subtree via one back edge). Start at root 0.' }));

  function dfs(u, root) {
    disc[u] = low[u] = timer; timer += 1;
    let children = 0;
    frames.push(snap({ phase: 'discover', activeNode: u, note: `Visit ${u}: disc[${u}]=low[${u}]=${disc[u]}.` }));
    for (const { to: v, eid } of adj[u]) {
      if (disc[v] === -1) {
        parent[v] = u; children += 1;
        frames.push(snap({ phase: 'tree', activeNode: u, activeEdge: eid, note: `Tree edge ${u}→${v}: recurse into ${v}.` }));
        dfs(v, root);
        const prev = low[u];
        low[u] = Math.min(low[u], low[v]);
        frames.push(snap({ phase: 'lift', activeNode: u, activeEdge: eid, note: `Back at ${u}: low[${u}] = min(${prev}, low[${v}]=${low[v]}) = ${low[u]} — how high ${u}'s subtree can climb.` }));
        if (low[v] > disc[u]) {
          bridges.push(eid);
          frames.push(snap({ phase: 'bridge', activeNode: u, activeEdge: eid, note: `low[${v}]=${low[v]} > disc[${u}]=${disc[u]}: ${v}'s subtree can't reach ${u} or earlier → edge ${u}-${v} is a BRIDGE.` }));
        }
        if (u !== root && low[v] >= disc[u] && !isAP[u]) {
          isAP[u] = true; apList.push(u);
          frames.push(snap({ phase: 'ap', activeNode: u, activeEdge: eid, note: `low[${v}]=${low[v]} ≥ disc[${u}]=${disc[u]}: child ${v} can't bypass ${u} → ${u} is an ARTICULATION POINT.` }));
        }
      } else if (v !== parent[u]) {
        const prev = low[u];
        low[u] = Math.min(low[u], disc[v]);
        frames.push(snap({ phase: 'back', activeNode: u, activeEdge: eid, note: `Back edge ${u}→${v}: low[${u}] = min(${prev}, disc[${v}]=${disc[v]}) = ${low[u]} (climb up via back edge).` }));
      }
    }
    if (u === root) {
      if (children >= 2 && !isAP[u]) {
        isAP[u] = true; apList.push(u);
        frames.push(snap({ phase: 'ap-root', activeNode: u, note: `Root ${u} has ${children} DFS children → removing it splits the tree → ARTICULATION POINT.` }));
      } else {
        frames.push(snap({ phase: 'leave', activeNode: u, note: `Root ${u} has ${children} DFS child (< 2) → NOT an articulation point.` }));
      }
    }
  }
  for (let i = 0; i < n; i += 1) if (disc[i] === -1) dfs(i, i);
  frames.push(snap({ phase: 'done', note: `O(V+E) single pass. Cut vertices: {${apList.slice().sort((a, b) => a - b).join(', ')}}. Bridges: ${bridges.map((id) => `${edges[id].u}-${edges[id].v}`).join(', ')}.` }));
  return frames;
}

export default function TarjanArticulationViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

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
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), delay);
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => { setIsRunningRaw(false); setStep(0); };

  const W = 880;
  const H = 340;
  const tableX = 660;
  const rowH = 50;
  const bridgeSet = new Set(current.bridges);
  const apLabels = current.apList.slice().sort((a, b) => a - b);
  const bridgeLabels = current.bridges.map((id) => `${graph.edges[id].u}-${graph.edges[id].v}`);

  return (
    <div className="tav">
      <div className="tav-head">
        <h3 className="tav-title">Tarjan&apos;s cut vertices &amp; bridges — disc / low in one DFS</h3>
        <p className="tav-sub">
          low[u] = how high u&apos;s subtree can climb via a single back edge. Edge u-v is a bridge when low[v] &gt; disc[u]; node u is a cut vertex when a child has low[v] ≥ disc[u].
        </p>
      </div>

      <div className="tav-controls">
        <div className="tav-buttons">
          <button type="button" className="tav-btn tav-btn-primary" onClick={() => { if (step >= totalSteps - 1) setStep(0); setIsRunningRaw((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="tav-btn" onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}><ChevronRight size={14} /> Step</button>
          <button type="button" className="tav-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}><SkipForward size={14} /> Skip</button>
          <button type="button" className="tav-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
        <label className="tav-speed">
          <span className="tav-speed-label">speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="tav-speed-range" />
          <span className="tav-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="tav-stepcount">step <strong>{step + 1}</strong> / {totalSteps}</div>
      </div>

      <div className="tav-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tav-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={20} width={tableX - 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          {graph.edges.map((e) => {
            const a = graph.nodes[e.u];
            const b = graph.nodes[e.v];
            const isActive = e.id === current.activeEdge;
            const isBridge = bridgeSet.has(e.id);
            const stroke = isActive ? 'var(--hue-pink)' : isBridge ? 'var(--hard)' : 'var(--text-dim)';
            return (
              <line key={`e-${e.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={stroke} strokeWidth={isActive ? 3.4 : isBridge ? 3 : 1.6}
                strokeDasharray={isBridge ? '7 4' : undefined} opacity={isActive || isBridge ? 1 : 0.55} />
            );
          })}
          {graph.nodes.map((nd) => {
            const isActive = nd.id === current.activeNode;
            const ap = current.isAP[nd.id];
            const seen = current.disc[nd.id] !== -1;
            const fill = isActive ? 'var(--hue-pink)' : ap ? 'var(--warning)' : seen ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)';
            const stroke = isActive ? 'var(--hue-pink)' : ap ? 'var(--warning)' : seen ? 'var(--accent)' : 'var(--border)';
            const lf = (isActive || ap) ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${nd.id}`}>
                {ap && <circle cx={nd.x} cy={nd.y} r={27} fill="none" stroke="var(--warning)" strokeWidth={1.5} opacity={0.5} />}
                <circle cx={nd.x} cy={nd.y} r={21} fill={fill} stroke={stroke} strokeWidth={isActive ? 3 : 2} />
                <text x={nd.x} y={nd.y + 5} className="tav-node" style={{ fill: lf }}>{nd.id}</text>
                {seen && <text x={nd.x} y={nd.y - 30} className="tav-node-meta">{current.disc[nd.id]}/{current.low[nd.id]}</text>}
              </g>
            );
          })}
          <g>
            <circle cx={36} cy={H - 30} r={6} fill="var(--warning)" />
            <text x={48} y={H - 26} className="tav-legend">cut vertex</text>
            <line x1={150} y1={H - 30} x2={182} y2={H - 30} stroke="var(--hard)" strokeWidth={3} strokeDasharray="7 4" />
            <text x={190} y={H - 26} className="tav-legend">bridge</text>
            <text x={270} y={H - 26} className="tav-legend">label = disc/low</text>
          </g>

          <rect x={tableX - 8} y={20} width={W - tableX - 8} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={tableX + 6} y={40} className="tav-th">disc / low</text>
          {graph.nodes.map((nd, i) => {
            const y = 54 + i * rowH;
            const active = nd.id === current.activeNode;
            const ap = current.isAP[nd.id];
            return (
              <g key={`row-${nd.id}`}>
                <rect x={tableX + 6} y={y} width={W - tableX - 24} height={rowH - 8}
                  fill={active ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={active ? 'var(--accent)' : 'var(--border)'} rx={4} />
                <text x={tableX + 16} y={y + 26} className="tav-rt">n{nd.id}</text>
                <text x={tableX + 50} y={y + 26} className="tav-rm">d {current.disc[nd.id] < 0 ? '—' : current.disc[nd.id]}</text>
                <text x={tableX + 110} y={y + 26} className="tav-rm">low {current.low[nd.id] < 0 ? '—' : current.low[nd.id]}</text>
                {ap && <circle cx={W - 26} cy={y + (rowH - 8) / 2} r={5} fill="var(--warning)" />}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tav-metrics">
        <div className="tav-metric"><span className="tav-metric-label">phase</span><span className="tav-metric-value">{current.phase}</span></div>
        <div className="tav-metric"><span className="tav-metric-label">cut vertices</span><span className="tav-metric-value">{apLabels.length ? `{${apLabels.join(', ')}}` : 'none yet'}</span></div>
        <div className="tav-metric"><span className="tav-metric-label">bridges</span><span className="tav-metric-value">{bridgeLabels.length ? bridgeLabels.join(', ') : 'none yet'}</span></div>
      </div>

      <div className="tav-trace">
        <span className="tav-trace-label">trace</span>
        <span className="tav-trace-val">{current.note}</span>
      </div>
    </div>
  );
}
