import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './JohnsonAPSPViz.css';

// Sparse directed graph with negative edges (but no negative cycle).
// Real vertices laid out left-to-right; virtual node q is added during phase 1.
function buildGraph() {
  const nodes = [
    { id: 0, label: 'A', x: 150, y: 90 },
    { id: 1, label: 'B', x: 360, y: 70 },
    { id: 2, label: 'C', x: 360, y: 250 },
    { id: 3, label: 'D', x: 560, y: 160 },
    { id: 4, label: 'E', x: 150, y: 250 },
  ];
  // directed, weighted edges including negative weights.
  const edges = [
    { u: 0, v: 1, w: -3 },
    { u: 0, v: 2, w: 4 },
    { u: 1, v: 3, w: 2 },
    { u: 2, v: 1, w: 1 },
    { u: 2, v: 3, w: 5 },
    { u: 4, v: 0, w: 2 },
    { u: 4, v: 2, w: -1 },
    { u: 3, v: 4, w: 6 },
  ];
  edges.forEach((e, i) => { e.id = i; });
  return { nodes, edges };
}

// Bellman-Ford from virtual node q (= index n) with 0-weight edges to every vertex.
// Returns potentials h[v] = shortest distance from q to v.
function bellmanFordFromQ(n, edges) {
  const h = new Array(n).fill(0); // q -> v has weight 0, so all start at 0
  for (let iter = 0; iter < n; iter++) {
    let changed = false;
    for (const e of edges) {
      if (h[e.u] + e.w < h[e.v]) {
        h[e.v] = h[e.u] + e.w;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return h;
}

// Dijkstra on the reweighted (non-negative) graph from a single source.
function dijkstra(n, adj, src) {
  const dist = new Array(n).fill(Infinity);
  const done = new Array(n).fill(false);
  dist[src] = 0;
  for (let it = 0; it < n; it++) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
    if (u === -1) break;
    done[u] = true;
    for (const a of adj[u]) {
      if (dist[u] + a.w < dist[a.to]) dist[a.to] = dist[u] + a.w;
    }
  }
  return dist;
}

function buildFrames(graph) {
  const { nodes, edges } = graph;
  const n = nodes.length;
  const frames = [];

  const emptyMatrix = () => Array.from({ length: n }, () => new Array(n).fill(null));

  const snap = (extra) => ({
    phase: 'init',
    h: null,           // potentials h[v], or null before phase 2
    reweighted: null,  // map edge id -> reweighted weight, or null
    activeEdge: -1,
    activeNode: -1,
    dijkstraSrc: -1,
    dijkstraDist: null,
    matrix: emptyMatrix(),
    note: '',
    ...extra,
  });

  // Phase 0: intro
  frames.push(snap({
    phase: 'setup',
    note: 'Sparse directed graph with negative edges. Johnson runs Dijkstra from every vertex — but Dijkstra needs non-negative weights. We fix that with potentials.',
  }));

  // Phase 1: virtual node q with 0-weight edges to all
  frames.push(snap({
    phase: 'virtual-q',
    note: 'Step 1: add a virtual node q with a 0-weight edge to every vertex. q can reach all of them for free.',
  }));

  // Phase 2: Bellman-Ford from q -> potentials h[v]
  const h = bellmanFordFromQ(n, edges);
  frames.push(snap({
    phase: 'bellman-ford',
    h: [...h],
    note: `Step 2: run Bellman-Ford from q (handles negative edges). Potentials h[v] = shortest dist q->v: [${h.map((x) => x).join(', ')}]. These are the shifts.`,
  }));

  // Phase 3: reweight each edge, one at a time, showing it becomes >= 0
  const reweighted = {};
  for (const e of edges) {
    const wp = e.w + h[e.u] - h[e.v];
    reweighted[e.id] = wp;
    frames.push(snap({
      phase: 'reweight',
      h: [...h],
      reweighted: { ...reweighted },
      activeEdge: e.id,
      note: `Reweight ${nodes[e.u].label}->${nodes[e.v].label}: w' = w + h(u) - h(v) = ${e.w} + ${h[e.u]} - ${h[e.v]} = ${wp} (now >= 0).`,
    }));
  }
  frames.push(snap({
    phase: 'reweight-done',
    h: [...h],
    reweighted: { ...reweighted },
    note: 'All reweighted edges are non-negative. Path lengths shift by h(src) - h(dst) for ANY path, so shortest paths are preserved — Dijkstra is now safe.',
  }));

  // Build reweighted adjacency for Dijkstra.
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) adj[e.u].push({ to: e.v, w: reweighted[e.id] });

  // Phase 4 + 5: Dijkstra from each source, then un-reweight into the matrix.
  const matrix = emptyMatrix();
  for (let s = 0; s < n; s++) {
    frames.push(snap({
      phase: 'dijkstra',
      h: [...h],
      reweighted: { ...reweighted },
      dijkstraSrc: s,
      activeNode: s,
      matrix: matrix.map((r) => [...r]),
      note: `Step 4: run Dijkstra from ${nodes[s].label} on the reweighted (non-negative) graph.`,
    }));
    const dp = dijkstra(n, adj, s);
    frames.push(snap({
      phase: 'dijkstra-result',
      h: [...h],
      reweighted: { ...reweighted },
      dijkstraSrc: s,
      activeNode: s,
      dijkstraDist: [...dp],
      matrix: matrix.map((r) => [...r]),
      note: `Reweighted distances from ${nodes[s].label}: [${dp.map((d) => (d === Infinity ? '∞' : d)).join(', ')}]. These are non-negative but inflated by the potentials.`,
    }));
    // un-reweight: real d(s,v) = d'(s,v) - h(s) + h(v)
    for (let v = 0; v < n; v++) {
      matrix[s][v] = dp[v] === Infinity ? Infinity : dp[v] - h[s] + h[v];
    }
    frames.push(snap({
      phase: 'unreweight',
      h: [...h],
      reweighted: { ...reweighted },
      dijkstraSrc: s,
      activeNode: s,
      dijkstraDist: [...dp],
      matrix: matrix.map((r) => [...r]),
      note: `Step 5: un-reweight row ${nodes[s].label}: d(s,v) = d'(s,v) - h(s) + h(v). True shortest paths from ${nodes[s].label} recovered.`,
    }));
  }

  frames.push(snap({
    phase: 'done',
    h: [...h],
    reweighted: { ...reweighted },
    matrix: matrix.map((r) => [...r]),
    note: 'Done. All-pairs shortest paths computed in O(V·E + V²·log V) — far better than Floyd-Warshall O(V³) on sparse graphs, even with negative edges.',
  }));

  return frames;
}

export default function JohnsonAPSPViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const { frames, graph } = useMemo(() => {
    const g = buildGraph();
    return { frames: buildFrames(g), graph: g };
  }, []);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const { nodes, edges } = graph;
  const n = nodes.length;
  const W = 940;
  const H = 380;
  const showQ = current.phase !== 'setup';
  const qPos = { x: 60, y: 170 };

  // matrix panel geometry (right side)
  const mX = 660;
  const cellW = 48;
  const cellH = 30;
  const mY = 70;

  const fmt = (x) => (x == null ? '·' : x === Infinity ? '∞' : x);

  return (
    <div className="japsp">
      <div className="japsp-head">
        <h3 className="japsp-title">Johnson's algorithm — all-pairs shortest paths with negative edges</h3>
        <p className="japsp-sub">
          Add a virtual source q, run Bellman-Ford to get potentials h(v), reweight every edge to be
          non-negative, then run Dijkstra from each vertex and un-reweight the results.
        </p>
      </div>

      <div className="japsp-controls">
        <div className="japsp-actions">
          <div className="japsp-buttons">
            <button
              type="button"
              className="japsp-btn japsp-btn-primary"
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
              className="japsp-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="japsp-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="japsp-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="japsp-speed">
            <span className="japsp-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="japsp-speed-range"
            />
            <span className="japsp-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="japsp-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="japsp-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="japsp-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="japsp-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
            <marker id="japsp-arrow-active" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
            <marker id="japsp-arrow-q" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hue-mint)" />
            </marker>
          </defs>

          <rect x={20} y={20} width={mX - 44} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={40} className="japsp-row-label">
            {current.reweighted ? 'reweighted graph w’ = w + h(u) - h(v)' : 'directed graph (negative edges)'}
          </text>

          {/* virtual q edges */}
          {showQ && nodes.map((nd) => {
            const dx = nd.x - qPos.x;
            const dy = nd.y - qPos.y;
            const len = Math.hypot(dx, dy) || 1;
            const ax = qPos.x + (dx / len) * 20;
            const ay = qPos.y + (dy / len) * 20;
            const bx = nd.x - (dx / len) * 24;
            const by = nd.y - (dy / len) * 24;
            return (
              <line
                key={`q-${nd.id}`}
                x1={ax} y1={ay} x2={bx} y2={by}
                stroke="var(--hue-mint)"
                strokeWidth={1.2}
                strokeDasharray="4 4"
                opacity={0.5}
                markerEnd="url(#japsp-arrow-q)"
              />
            );
          })}

          {/* real edges */}
          {edges.map((e) => {
            const a = nodes[e.u];
            const b = nodes[e.v];
            const isActive = e.id === current.activeEdge;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = dx / len;
            const ny = dy / len;
            const px = -ny;
            const py = nx;
            const off = 7;
            const r = 22;
            const ax = a.x + nx * r + px * off;
            const ay = a.y + ny * r + py * off;
            const bx = b.x - nx * (r + 4) + px * off;
            const by = b.y - ny * (r + 4) + py * off;
            const wp = current.reweighted ? current.reweighted[e.id] : null;
            const showW = wp == null ? e.w : wp;
            const neg = showW < 0;
            const stroke = isActive ? 'var(--hue-pink)' : neg ? 'var(--hard)' : 'var(--text-dim)';
            const sw = isActive ? 3 : neg ? 2.2 : 1.5;
            const marker = isActive ? 'japsp-arrow-active' : 'japsp-arrow';
            const mx = (ax + bx) / 2 + px * 12;
            const my = (ay + by) / 2 + py * 12;
            const labelFill = isActive ? 'var(--hue-pink)' : neg ? 'var(--hard)' : 'var(--text-dim)';
            return (
              <g key={`e-${e.id}`}>
                <line
                  x1={ax} y1={ay} x2={bx} y2={by}
                  stroke={stroke}
                  strokeWidth={sw}
                  opacity={isActive ? 1 : 0.7}
                  markerEnd={`url(#${marker})`}
                />
                <text x={mx} y={my} className="japsp-edge-label" style={{ fill: labelFill }}>
                  {showW}
                </text>
              </g>
            );
          })}

          {/* virtual q node */}
          {showQ && (
            <g>
              <circle cx={qPos.x} cy={qPos.y} r={18} fill="var(--hue-mint)" stroke="var(--hue-mint)" strokeWidth={2} />
              <text x={qPos.x} y={qPos.y + 5} className="japsp-node-label" style={{ fill: 'var(--bg)' }}>q</text>
            </g>
          )}

          {/* real nodes */}
          {nodes.map((nd) => {
            const isSrc = nd.id === current.dijkstraSrc;
            const h = current.h ? current.h[nd.id] : null;
            const dd = current.dijkstraDist ? current.dijkstraDist[nd.id] : null;
            const fill = isSrc ? 'var(--accent)' : 'var(--bg)';
            const stroke = isSrc ? 'var(--accent)' : 'var(--border)';
            const labelFill = isSrc ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${nd.id}`}>
                <circle cx={nd.x} cy={nd.y} r={22} fill={fill} stroke={stroke} strokeWidth={isSrc ? 3 : 2} />
                <text x={nd.x} y={nd.y + 5} className="japsp-node-label" style={{ fill: labelFill }}>{nd.label}</text>
                {h != null && (
                  <text x={nd.x} y={nd.y - 30} className="japsp-node-h">h={h}</text>
                )}
                {dd != null && (
                  <text x={nd.x} y={nd.y + 40} className="japsp-node-d">
                    d&apos;={dd === Infinity ? '∞' : dd}
                  </text>
                )}
              </g>
            );
          })}

          {/* APSP distance matrix (right panel) */}
          <rect x={mX - 12} y={20} width={W - mX - 8} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={mX} y={40} className="japsp-row-label">all-pairs distance matrix</text>
          <text x={mX} y={mY - 14} className="japsp-mtx-corner">src \ dst</text>
          {nodes.map((nd, j) => (
            <text
              key={`ch-${nd.id}`}
              x={mX + cellW + j * cellW + cellW / 2}
              y={mY - 14}
              className="japsp-mtx-head"
            >
              {nd.label}
            </text>
          ))}
          {nodes.map((rs, i) => {
            const rowActive = rs.id === current.dijkstraSrc;
            return (
              <g key={`mr-${rs.id}`}>
                <text
                  x={mX + cellW / 2}
                  y={mY + i * cellH + cellH / 2 + 4}
                  className="japsp-mtx-head"
                >
                  {rs.label}
                </text>
                {nodes.map((cs, j) => {
                  const val = current.matrix[i][j];
                  const filled = val != null;
                  const isDiag = i === j;
                  const cellFill = rowActive && filled ? 'rgba(var(--accent-rgb), 0.18)'
                    : filled ? 'var(--bg)'
                    : 'transparent';
                  const cellStroke = filled ? 'var(--accent)' : 'var(--border)';
                  return (
                    <g key={`mc-${i}-${j}`}>
                      <rect
                        x={mX + cellW + j * cellW + 2}
                        y={mY + i * cellH + 2}
                        width={cellW - 4}
                        height={cellH - 4}
                        rx={4}
                        fill={cellFill}
                        stroke={cellStroke}
                        strokeWidth={filled ? 1.4 : 1}
                        opacity={filled ? 1 : 0.4}
                      />
                      <text
                        x={mX + cellW + j * cellW + cellW / 2}
                        y={mY + i * cellH + cellH / 2 + 4}
                        className={isDiag ? 'japsp-mtx-diag' : 'japsp-mtx-cell'}
                        style={{ fill: filled ? 'var(--text-main)' : 'var(--text-dim)' }}
                      >
                        {fmt(val)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* potentials strip */}
          {current.h && (
            <g>
              <text x={mX} y={mY + n * cellH + 34} className="japsp-row-label">potentials h(v)</text>
              {nodes.map((nd, j) => (
                <g key={`hp-${nd.id}`}>
                  <rect
                    x={mX + cellW + j * cellW + 2}
                    y={mY + n * cellH + 44}
                    width={cellW - 4}
                    height={cellH - 4}
                    rx={4}
                    fill="rgba(var(--accent-rgb), 0.1)"
                    stroke="var(--accent)"
                    strokeWidth={1.2}
                  />
                  <text
                    x={mX + cellW + j * cellW + cellW / 2}
                    y={mY + n * cellH + 44 + cellH / 2 + 2}
                    className="japsp-mtx-cell"
                    style={{ fill: 'var(--text-main)' }}
                  >
                    {current.h[nd.id]}
                  </text>
                </g>
              ))}
            </g>
          )}
        </svg>
      </div>

      <div className="japsp-metrics">
        <div className="japsp-metric">
          <span className="japsp-metric-label">phase</span>
          <span className="japsp-metric-value">{current.phase}</span>
        </div>
        <div className="japsp-metric">
          <span className="japsp-metric-label">potentials h</span>
          <span className="japsp-metric-value">
            {current.h ? `[${current.h.join(', ')}]` : '—'}
          </span>
        </div>
        <div className="japsp-metric">
          <span className="japsp-metric-label">Dijkstra source</span>
          <span className="japsp-metric-value">
            {current.dijkstraSrc >= 0 ? nodes[current.dijkstraSrc].label : '—'}
          </span>
        </div>
        <div className="japsp-metric japsp-metric-dim">
          <span className="japsp-metric-label">graph</span>
          <span className="japsp-metric-value japsp-metric-dimval">
            {n}v, {edges.length}e sparse, negatives
          </span>
        </div>
      </div>

      <div className="japsp-arith">
        <span className="japsp-arith-label">trace</span>
        <span className="japsp-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
