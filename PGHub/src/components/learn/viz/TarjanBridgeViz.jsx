import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './TarjanBridgeViz.css';

const SEED = 0xBADBADB0;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGraph() {
  const nodes = [
    { id: 0, x: 120, y: 200 },
    { id: 1, x: 220, y: 100 },
    { id: 2, x: 220, y: 300 },
    { id: 3, x: 360, y: 200 },
    { id: 4, x: 500, y: 110 },
    { id: 5, x: 500, y: 290 },
    { id: 6, x: 640, y: 200 },
  ];
  const edges = [
    { u: 0, v: 1 },
    { u: 0, v: 2 },
    { u: 1, v: 2 },
    { u: 1, v: 3 },
    { u: 2, v: 3 },
    { u: 3, v: 4 },
    { u: 4, v: 5 },
    { u: 4, v: 6 },
    { u: 5, v: 6 },
  ];
  edges.forEach((e, i) => {
    e.id = i;
  });
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
  let timer = 0;
  const treeEdges = new Set();
  const backEdges = new Set();
  const bridges = new Set();
  const frames = [];

  frames.push({
    phase: 'init',
    disc: [...disc],
    low: [...low],
    treeEdges: [...treeEdges],
    backEdges: [...backEdges],
    bridges: [...bridges],
    activeNode: -1,
    activeEdge: -1,
    stackPath: [],
    note: `Start: disc[] and low[] uninitialized. Run DFS from node 0.`,
  });

  function dfs(u, parentEdgeId, path) {
    disc[u] = low[u] = timer++;
    path.push(u);
    frames.push({
      phase: 'discover',
      disc: [...disc],
      low: [...low],
      treeEdges: [...treeEdges],
      backEdges: [...backEdges],
      bridges: [...bridges],
      activeNode: u,
      activeEdge: -1,
      stackPath: [...path],
      note: `Discover ${u}: disc[${u}] = low[${u}] = ${disc[u]}.`,
    });

    for (const { to: v, eid } of adj[u]) {
      if (eid === parentEdgeId) continue;
      if (disc[v] === -1) {
        treeEdges.add(eid);
        frames.push({
          phase: 'tree-down',
          disc: [...disc],
          low: [...low],
          treeEdges: [...treeEdges],
          backEdges: [...backEdges],
          bridges: [...bridges],
          activeNode: u,
          activeEdge: eid,
          stackPath: [...path],
          note: `Edge (${u},${v}) → tree edge. Recurse into ${v}.`,
        });
        dfs(v, eid, path);
        low[u] = Math.min(low[u], low[v]);
        frames.push({
          phase: 'low-update',
          disc: [...disc],
          low: [...low],
          treeEdges: [...treeEdges],
          backEdges: [...backEdges],
          bridges: [...bridges],
          activeNode: u,
          activeEdge: eid,
          stackPath: [...path],
          note: `Back from ${v}: low[${u}] = min(low[${u}], low[${v}]) = ${low[u]}.`,
        });
        if (low[v] > disc[u]) {
          bridges.add(eid);
          frames.push({
            phase: 'bridge',
            disc: [...disc],
            low: [...low],
            treeEdges: [...treeEdges],
            backEdges: [...backEdges],
            bridges: [...bridges],
            activeNode: u,
            activeEdge: eid,
            stackPath: [...path],
            note: `low[${v}] = ${low[v]} > disc[${u}] = ${disc[u]} → edge (${u},${v}) is a BRIDGE.`,
          });
        }
      } else {
        backEdges.add(eid);
        const prev = low[u];
        low[u] = Math.min(low[u], disc[v]);
        frames.push({
          phase: 'back-edge',
          disc: [...disc],
          low: [...low],
          treeEdges: [...treeEdges],
          backEdges: [...backEdges],
          bridges: [...bridges],
          activeNode: u,
          activeEdge: eid,
          stackPath: [...path],
          note: prev === low[u]
            ? `Edge (${u},${v}) → back edge. low[${u}] unchanged = ${low[u]}.`
            : `Edge (${u},${v}) → back edge. low[${u}] = min(${prev}, disc[${v}] = ${disc[v]}) = ${low[u]}.`,
        });
      }
    }

    path.pop();
    frames.push({
      phase: 'leave',
      disc: [...disc],
      low: [...low],
      treeEdges: [...treeEdges],
      backEdges: [...backEdges],
      bridges: [...bridges],
      activeNode: u,
      activeEdge: -1,
      stackPath: [...path],
      note: `Return from ${u}. Final low[${u}] = ${low[u]}.`,
    });
  }

  for (let i = 0; i < n; i++) {
    if (disc[i] === -1) dfs(i, -1, []);
  }

  frames.push({
    phase: 'done',
    disc: [...disc],
    low: [...low],
    treeEdges: [...treeEdges],
    backEdges: [...backEdges],
    bridges: [...bridges],
    activeNode: -1,
    activeEdge: -1,
    stackPath: [],
    note: `Done. Found ${bridges.size} bridge(s) in O(V + E).`,
  });

  return frames;
}

export default function TarjanBridgeViz() {
  const [seed] = useState(SEED);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const rand = useMemo(() => mulberry32(seed), [seed]);
  const { frames, graph } = useMemo(() => {
    void rand;
    const g = buildGraph();
    return { frames: buildFrames(g), graph: g };
  }, [rand]);

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

  const W = 900;
  const H = 380;
  const tableX = 700;
  const tableW = W - tableX - 20;
  const rowH = 26;

  return (
    <div className="tbv">
      <div className="tbv-head">
        <h3 className="tbv-title">Tarjan's bridge finder — O(V + E) DFS</h3>
        <p className="tbv-sub">
          Single DFS tracks disc[u] (entry time) and low[u] (earliest reachable ancestor). Edge (u,v) is a bridge
          iff low[v] {'>'} disc[u] — no back-edge from v's subtree reaches u or above.
        </p>
      </div>

      <div className="tbv-controls">
        <div className="tbv-actions">
          <div className="tbv-buttons">
            <button
              type="button"
              className="tbv-btn tbv-btn-primary"
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
              className="tbv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="tbv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="tbv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="tbv-speed">
            <span className="tbv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="tbv-speed-range"
            />
            <span className="tbv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="tbv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="tbv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tbv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={tableX - 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={30} y={36} className="tbv-row-label">graph</text>

          {graph.edges.map((e) => {
            const a = graph.nodes[e.u];
            const b = graph.nodes[e.v];
            const isTree = current.treeEdges.includes(e.id);
            const isBack = current.backEdges.includes(e.id);
            const isBridge = current.bridges.includes(e.id);
            const isActive = e.id === current.activeEdge;
            const stroke = isBridge ? 'var(--hard)'
              : isActive ? 'var(--hue-pink)'
              : isTree ? 'var(--accent)'
              : isBack ? 'var(--hue-violet)'
              : 'var(--text-dim)';
            const sw = isBridge ? 3.5 : isActive ? 3 : isTree || isBack ? 2 : 1.5;
            const dash = isBack ? '5 4' : '0';
            const opacity = !isTree && !isBack && !isActive && !isBridge ? 0.5 : 1;
            return (
              <g key={`e-${e.id}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} opacity={opacity} />
              </g>
            );
          })}

          {graph.nodes.map((n) => {
            const isActive = n.id === current.activeNode;
            const onPath = current.stackPath.includes(n.id);
            const discovered = current.disc[n.id] !== -1;
            const fill = isActive ? 'var(--hue-pink)' : onPath ? 'var(--accent)' : discovered ? 'var(--surface)' : 'var(--bg)';
            const stroke = isActive ? 'var(--hue-pink)' : onPath ? 'var(--accent)' : 'var(--border)';
            return (
              <g key={`n-${n.id}`}>
                <circle cx={n.x} cy={n.y} r={20} fill={fill} stroke={stroke} strokeWidth={2} />
                <text x={n.x} y={n.y + 4} className="tbv-node-label">{n.id}</text>
                {discovered && (
                  <text x={n.x} y={n.y + 38} className="tbv-node-meta">
                    {current.disc[n.id]}/{current.low[n.id]}
                  </text>
                )}
              </g>
            );
          })}

          <g>
            <rect x={30} y={H - 90} width={240} height={70} fill="var(--bg)" stroke="var(--border)" rx={4} />
            <text x={40} y={H - 72} className="tbv-legend-title">legend</text>
            <line x1={40} y1={H - 56} x2={70} y2={H - 56} stroke="var(--accent)" strokeWidth={2} />
            <text x={76} y={H - 52} className="tbv-legend-text">tree edge</text>
            <line x1={150} y1={H - 56} x2={180} y2={H - 56} stroke="var(--hue-violet)" strokeWidth={2} strokeDasharray="5 4" />
            <text x={186} y={H - 52} className="tbv-legend-text">back edge</text>
            <line x1={40} y1={H - 36} x2={70} y2={H - 36} stroke="var(--hard)" strokeWidth={3.5} />
            <text x={76} y={H - 32} className="tbv-legend-text">bridge</text>
          </g>

          <rect x={tableX - 10} y={20} width={tableW + 20} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={tableX} y={36} className="tbv-row-label">disc / low</text>

          {graph.nodes.map((n, i) => {
            const y = 52 + i * rowH;
            const active = n.id === current.activeNode;
            return (
              <g key={`row-${n.id}`}>
                <rect
                  x={tableX}
                  y={y}
                  width={tableW}
                  height={rowH - 4}
                  fill={active ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={active ? 'var(--accent)' : 'var(--border)'}
                  rx={4}
                />
                <text x={tableX + 10} y={y + (rowH - 4) / 2 + 4} className="tbv-row-text">
                  node {n.id}
                </text>
                <text x={tableX + 76} y={y + (rowH - 4) / 2 + 4} className="tbv-row-meta">
                  disc = {current.disc[n.id] < 0 ? '—' : current.disc[n.id]}
                </text>
                <text x={tableX + 154} y={y + (rowH - 4) / 2 + 4} className="tbv-row-meta">
                  low = {current.low[n.id] < 0 ? '—' : current.low[n.id]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tbv-metrics">
        <div className="tbv-metric">
          <span className="tbv-metric-label">phase</span>
          <span className="tbv-metric-value">{current.phase}</span>
        </div>
        <div className="tbv-metric">
          <span className="tbv-metric-label">bridges</span>
          <span className="tbv-metric-value">{current.bridges.length}</span>
        </div>
        <div className="tbv-metric">
          <span className="tbv-metric-label">dfs stack</span>
          <span className="tbv-metric-value">[{current.stackPath.join(', ')}]</span>
        </div>
        <div className="tbv-metric tbv-metric-dim">
          <span className="tbv-metric-label">graph</span>
          <span className="tbv-metric-value tbv-metric-dimval">{graph.nodes.length}n, {graph.edges.length}e</span>
        </div>
      </div>

      <div className="tbv-arith">
        <span className="tbv-arith-label">trace</span>
        <span className="tbv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
