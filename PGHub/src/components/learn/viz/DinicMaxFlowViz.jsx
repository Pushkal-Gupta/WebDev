import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './DinicMaxFlowViz.css';

// Small flow network: S=0, A=1, B=2, C=3, D=4, T=5
const NODES = [
  { id: 0, label: 'S', x: 70, y: 200 },
  { id: 1, label: 'A', x: 260, y: 90 },
  { id: 2, label: 'B', x: 260, y: 310 },
  { id: 3, label: 'C', x: 470, y: 90 },
  { id: 4, label: 'D', x: 470, y: 310 },
  { id: 5, label: 'T', x: 660, y: 200 },
];

const EDGES = [
  { u: 0, v: 1, cap: 10 },
  { u: 0, v: 2, cap: 10 },
  { u: 1, v: 2, cap: 2 },
  { u: 1, v: 3, cap: 8 },
  { u: 2, v: 4, cap: 9 },
  { u: 3, v: 4, cap: 6 },
  { u: 3, v: 5, cap: 10 },
  { u: 4, v: 5, cap: 10 },
];

const SOURCE = 0;
const SINK = 5;

// Build adjacency with forward/reverse twins for residual graph
function buildGraph() {
  const adj = NODES.map(() => []);
  const edges = []; // {from, to, cap, flow, rev}
  for (const e of EDGES) {
    const a = { from: e.u, to: e.v, cap: e.cap, flow: 0, rev: edges.length + 1, isForward: true, origIdx: edges.length };
    const b = { from: e.v, to: e.u, cap: 0, flow: 0, rev: edges.length, isForward: false, origIdx: edges.length + 1 };
    adj[e.u].push(edges.length);
    adj[e.v].push(edges.length + 1);
    edges.push(a, b);
  }
  return { adj, edges };
}

function cloneEdges(edges) {
  return edges.map((e) => ({ ...e }));
}

function bfsLevels(graph, source, sink) {
  const level = new Array(NODES.length).fill(-1);
  level[source] = 0;
  const q = [source];
  let head = 0;
  while (head < q.length) {
    const u = q[head++];
    for (const ei of graph.adj[u]) {
      const e = graph.edges[ei];
      if (level[e.to] === -1 && e.cap - e.flow > 0) {
        level[e.to] = level[u] + 1;
        q.push(e.to);
      }
    }
  }
  return { level, reached: level[sink] !== -1 };
}

function buildFrames() {
  const graph = buildGraph();
  const frames = [];
  let totalFlow = 0;
  let phase = 0;

  frames.push({
    kind: 'init',
    edges: cloneEdges(graph.edges),
    level: NODES.map(() => -1),
    path: [],
    pathEdges: [],
    totalFlow: 0,
    phaseNum: 0,
    note: 'Initialize. All edge flows = 0. Start Dinic phases until BFS can no longer reach T.',
  });

  while (true) {
    phase++;
    const { level, reached } = bfsLevels(graph, SOURCE, SINK);
    frames.push({
      kind: 'bfs',
      edges: cloneEdges(graph.edges),
      level: [...level],
      path: [],
      pathEdges: [],
      totalFlow,
      phaseNum: phase,
      note: reached
        ? `Phase ${phase}: BFS builds level graph from S. Levels = [${level.map((l, i) => `${NODES[i].label}=${l < 0 ? '∞' : l}`).join(', ')}]. T reached at level ${level[SINK]}.`
        : `Phase ${phase}: BFS cannot reach T. No augmenting path remains — Dinic terminates.`,
    });

    if (!reached) {
      frames.push({
        kind: 'done',
        edges: cloneEdges(graph.edges),
        level: [...level],
        path: [],
        pathEdges: [],
        totalFlow,
        phaseNum: phase,
        note: `Done. Max flow = ${totalFlow}.`,
      });
      return frames;
    }

    // DFS to find blocking flow, log each augmenting path
    const iter = NODES.map(() => 0);
    const dfs = (u, pushed, pathNodes, pathEdges) => {
      if (u === SINK) return pushed;
      while (iter[u] < graph.adj[u].length) {
        const ei = graph.adj[u][iter[u]];
        const e = graph.edges[ei];
        if (e.cap - e.flow > 0 && level[e.to] === level[u] + 1) {
          pathNodes.push(e.to);
          pathEdges.push(ei);
          const got = dfs(e.to, Math.min(pushed, e.cap - e.flow), pathNodes, pathEdges);
          if (got > 0) {
            e.flow += got;
            graph.edges[e.rev].flow -= got;
            return got;
          }
          pathNodes.pop();
          pathEdges.pop();
        }
        iter[u]++;
      }
      return 0;
    };

    while (true) {
      const pathNodes = [SOURCE];
      const pathEdges = [];
      const pushed = dfs(SOURCE, Infinity, pathNodes, pathEdges);
      if (pushed === 0) break;
      totalFlow += pushed;
      frames.push({
        kind: 'augment',
        edges: cloneEdges(graph.edges),
        level: [...level],
        path: [...pathNodes],
        pathEdges: [...pathEdges],
        totalFlow,
        phaseNum: phase,
        note: `Phase ${phase}: Augmenting path ${pathNodes.map((i) => NODES[i].label).join(' → ')}. Bottleneck = ${pushed}. Push ${pushed} units; residuals update. Total flow = ${totalFlow}.`,
      });
    }

    frames.push({
      kind: 'blocking',
      edges: cloneEdges(graph.edges),
      level: [...level],
      path: [],
      pathEdges: [],
      totalFlow,
      phaseNum: phase,
      note: `Phase ${phase}: No more s-t paths in this level graph. Blocking flow found. Rebuild level graph.`,
    });
  }
}

export default function DinicMaxFlowViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return;
    runTimer.current = setTimeout(() => {
      setStep((s2) => Math.min(s2 + 1, totalSteps - 1));
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
  const H = 420;
  const R = 22;

  // Forward edges only render (reverse is implicit residual)
  const forwardIdx = current.edges.map((e, i) => ({ e, i })).filter((x) => x.e.isForward);
  const pathEdgeSet = new Set(current.pathEdges);

  return (
    <div className="dinic">
      <div className="dinic-head">
        <h3 className="dinic-title">Dinic's max-flow — BFS level graph + DFS blocking flow</h3>
        <p className="dinic-sub">
          Each phase: BFS partitions vertices by distance from S, then DFS pushes augmenting paths that only
          move down one level at a time. Repeat until S can no longer reach T.
        </p>
      </div>

      <div className="dinic-controls">
        <div className="dinic-actions">
          <div className="dinic-buttons">
            <button
              type="button"
              className="dinic-btn dinic-btn-primary"
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
              className="dinic-btn"
              onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="dinic-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="dinic-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="dinic-speed">
            <span className="dinic-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="dinic-speed-range"
            />
            <span className="dinic-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="dinic-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="dinic-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dinic-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="dinic-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--border)" />
            </marker>
            <marker id="dinic-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker id="dinic-arrow-level" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-sky)" />
            </marker>
            <marker id="dinic-arrow-flow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--easy)" />
            </marker>
            <marker id="dinic-arrow-sat" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hard)" />
            </marker>
          </defs>

          <text x={20} y={22} className="dinic-row-label">flow network — capacities / flow</text>

          {forwardIdx.map(({ e, i }) => {
            const a = NODES[e.from];
            const b = NODES[e.to];
            // Shorten line so it ends on circle edge
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / len;
            const uy = dy / len;
            const x1 = a.x + ux * R;
            const y1 = a.y + uy * R;
            const x2 = b.x - ux * (R + 4);
            const y2 = b.y - uy * (R + 4);
            const inPath = pathEdgeSet.has(i);
            const residual = e.cap - e.flow;
            const isSat = residual === 0 && e.flow > 0;
            const hasFlow = e.flow > 0;
            const inLevelGraph =
              current.level[e.from] >= 0 &&
              current.level[e.to] === current.level[e.from] + 1 &&
              e.cap - e.flow > 0;

            let cls = 'dinic-edge';
            let marker = 'url(#dinic-arrow)';
            if (inPath) {
              cls = 'dinic-edge dinic-edge-path';
              marker = 'url(#dinic-arrow-active)';
            } else if (isSat) {
              cls = 'dinic-edge dinic-edge-saturated';
              marker = 'url(#dinic-arrow-sat)';
            } else if (hasFlow) {
              cls = 'dinic-edge dinic-edge-flowed';
              marker = 'url(#dinic-arrow-flow)';
            } else if (inLevelGraph && current.kind !== 'init' && current.kind !== 'done') {
              cls = 'dinic-edge dinic-edge-level';
              marker = 'url(#dinic-arrow-level)';
            }

            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const label = `${e.flow}/${e.cap}`;
            const lblW = label.length * 7 + 8;

            return (
              <g key={`edge-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className={cls} markerEnd={marker} />
                <rect
                  x={mx - lblW / 2 + (uy * 14)}
                  y={my - 9 - (ux * 14)}
                  width={lblW}
                  height={18}
                  rx={3}
                  className="dinic-edge-label-bg"
                />
                <text
                  x={mx + (uy * 14)}
                  y={my + 4 - (ux * 14)}
                  className="dinic-edge-label"
                  textAnchor="middle"
                  fill={inPath ? 'var(--accent)' : hasFlow ? 'var(--easy)' : isSat ? 'var(--hard)' : 'var(--text-main)'}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {NODES.map((n) => {
            const isSource = n.id === SOURCE;
            const isSink = n.id === SINK;
            const onPath = current.path.includes(n.id);
            const lvl = current.level[n.id];
            const hasLevel = lvl >= 0;

            return (
              <g key={`node-${n.id}`}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={R}
                  className="dinic-node-circle"
                  fill={
                    isSource || isSink
                      ? 'rgba(var(--accent-rgb), 0.18)'
                      : onPath
                      ? 'rgba(var(--accent-rgb), 0.18)'
                      : 'var(--surface)'
                  }
                  stroke={
                    isSource || isSink || onPath ? 'var(--accent)' : 'var(--border)'
                  }
                  strokeWidth={isSource || isSink || onPath ? 2.2 : 1.4}
                />
                <text x={n.x} y={n.y + 1} className="dinic-node-label">{n.label}</text>
                {hasLevel && (
                  <g>
                    <circle cx={n.x + R - 4} cy={n.y - R + 4} r={9} className="dinic-level-chip" />
                    <text x={n.x + R - 4} y={n.y - R + 4} className="dinic-node-level">{lvl}</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dinic-metrics">
        <div className="dinic-metric">
          <span className="dinic-metric-label">phase</span>
          <span className="dinic-metric-value">{current.phaseNum}</span>
        </div>
        <div className="dinic-metric">
          <span className="dinic-metric-label">step kind</span>
          <span className="dinic-metric-value">{current.kind}</span>
        </div>
        <div className="dinic-metric">
          <span className="dinic-metric-label">total flow</span>
          <span className="dinic-metric-value">{current.totalFlow}</span>
        </div>
        <div className="dinic-metric stlz-metric-dim dinic-metric-dim">
          <span className="dinic-metric-label">path</span>
          <span className="dinic-metric-value dinic-metric-dimval">
            {current.path.length ? current.path.map((i) => NODES[i].label).join(' → ') : '—'}
          </span>
        </div>
      </div>

      <div className="dinic-arith">
        <span className="dinic-arith-label">trace</span>
        <span className="dinic-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
