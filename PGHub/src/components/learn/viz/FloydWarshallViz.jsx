import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './FloydWarshallViz.css';

const INF = Infinity;

// Small weighted directed graph with a negative edge (no negative cycle).
function buildGraph() {
  const nodes = [
    { id: 0, label: '0', x: 130, y: 80 },
    { id: 1, label: '1', x: 360, y: 70 },
    { id: 2, label: '2', x: 470, y: 250 },
    { id: 3, label: '3', x: 200, y: 270 },
  ];
  const edges = [
    { u: 0, v: 1, w: 3 },
    { u: 0, v: 3, w: 7 },
    { u: 1, v: 2, w: 1 },
    { u: 1, v: 3, w: -2 },
    { u: 2, v: 0, w: 4 },
    { u: 3, v: 2, w: 2 },
  ];
  edges.forEach((e, i) => { e.id = i; });
  return { nodes, edges };
}

function cloneMatrix(m) {
  return m.map((r) => [...r]);
}

function buildFrames(graph) {
  const { nodes, edges } = graph;
  const n = nodes.length;
  const frames = [];

  // dist[i][j]: 0 on diagonal, edge weight if edge exists, else INF.
  const dist = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : INF)),
  );
  for (const e of edges) {
    if (e.w < dist[e.u][e.v]) dist[e.u][e.v] = e.w;
  }

  const snap = (extra) => ({
    k: -1,
    i: -1,
    j: -1,
    via: -1,        // intermediate vertex k when comparing
    matrix: cloneMatrix(dist),
    improved: false,
    improvements: 0,
    oldVal: null,
    newVal: null,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: 'Start: dist[i][j] = edge weight if an edge exists, 0 on the diagonal, infinity otherwise. No waypoints allowed yet.',
  }));

  for (let k = 0; k < n; k++) {
    let phaseImps = 0;
    frames.push(snap({
      k,
      via: k,
      note: `Phase k=${k}: now paths may route THROUGH vertex ${nodes[k].label}. For every pair (i,j) we test dist[i][${k}] + dist[${k}][j] against dist[i][j].`,
    }));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const through = dist[i][k] + dist[k][j];
        const old = dist[i][j];
        const better = through < old;
        if (better) {
          dist[i][j] = through;
          phaseImps += 1;
        }
        const fmtSum = (dist[i][k] === INF || dist[k][j] === INF)
          ? '∞'
          : `${dist[i][k]}+${dist[k][j]}=${through}`;
        const fmtOld = old === INF ? '∞' : old;
        const fmtNew = dist[i][j] === INF ? '∞' : dist[i][j];
        frames.push(snap({
          k,
          i,
          j,
          via: k,
          matrix: cloneMatrix(dist),
          improved: better,
          improvements: phaseImps,
          oldVal: old,
          newVal: dist[i][j],
          note: better
            ? `k=${k}: dist[${i}][${j}] = min(${fmtOld}, dist[${i}][${k}]+dist[${k}][${j}] = ${fmtSum}) = ${fmtNew} → improved.`
            : `k=${k}: dist[${i}][${j}] = min(${fmtOld}, dist[${i}][${k}]+dist[${k}][${j}] = ${fmtSum}) stays ${fmtNew}.`,
        }));
      }
    }
    frames.push(snap({
      k,
      via: k,
      improvements: phaseImps,
      note: `Phase k=${k} done: ${phaseImps} cell${phaseImps === 1 ? '' : 's'} improved by allowing vertex ${nodes[k].label} as a waypoint.`,
    }));
  }

  frames.push(snap({
    note: 'Done. After allowing every vertex as a waypoint, dist[i][j] holds the shortest path from i to j. O(V³) time, O(V²) space.',
  }));

  return { frames, final: cloneMatrix(dist) };
}

export default function FloydWarshallViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const { frames, graph } = useMemo(() => {
    const g = buildGraph();
    return { ...buildFrames(g), graph: g };
  }, []);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const { nodes, edges } = graph;
  const W = 940;
  const H = 380;

  // matrix panel geometry (right side)
  const mX = 640;
  const cellW = 54;
  const cellH = 40;
  const mY = 86;

  const fmt = (x) => (x == null ? '·' : x === INF ? '∞' : x);

  return (
    <div className="fwv">
      <div className="fwv-head">
        <h3 className="fwv-title">Floyd&ndash;Warshall &mdash; all-pairs shortest paths by intermediate vertex</h3>
        <p className="fwv-sub">
          The outer loop picks a waypoint k; the inner double loop relaxes every pair (i,j) with the rule
          dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]). Watch the matrix improve, one k-phase at a time.
        </p>
      </div>

      <div className="fwv-controls">
        <div className="fwv-actions">
          <div className="fwv-buttons">
            <button
              type="button"
              className="fwv-btn fwv-btn-primary"
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
              className="fwv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="fwv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="fwv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="fwv-speed">
            <span className="fwv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="fwv-speed-range"
            />
            <span className="fwv-speed-value">{speed.toFixed(1)}&times;</span>
          </label>
          <div className="fwv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="fwv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fwv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="fwv-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
            <marker id="fwv-arrow-active" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          <rect x={20} y={20} width={mX - 44} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={40} className="fwv-row-label">directed graph (negative edge allowed)</text>

          {/* edges */}
          {edges.map((e) => {
            const a = nodes[e.u];
            const b = nodes[e.v];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = dx / len;
            const ny = dy / len;
            const px = -ny;
            const py = nx;
            const off = 8;
            const r = 24;
            const ax = a.x + nx * r + px * off;
            const ay = a.y + ny * r + py * off;
            const bx = b.x - nx * (r + 4) + px * off;
            const by = b.y - ny * (r + 4) + py * off;
            const neg = e.w < 0;
            // highlight the two legs of the current relaxation: i->k and k->j
            const onPath =
              (e.u === current.i && e.v === current.via) ||
              (e.u === current.via && e.v === current.j);
            const stroke = onPath ? 'var(--hue-pink)' : neg ? 'var(--hard)' : 'var(--text-dim)';
            const sw = onPath ? 3 : neg ? 2.2 : 1.5;
            const marker = onPath ? 'fwv-arrow-active' : 'fwv-arrow';
            const lx = (ax + bx) / 2 + px * 13;
            const ly = (ay + by) / 2 + py * 13;
            const labelFill = onPath ? 'var(--hue-pink)' : neg ? 'var(--hard)' : 'var(--text-dim)';
            return (
              <g key={`e-${e.id}`}>
                <line
                  x1={ax} y1={ay} x2={bx} y2={by}
                  stroke={stroke}
                  strokeWidth={sw}
                  opacity={onPath ? 1 : 0.7}
                  markerEnd={`url(#${marker})`}
                />
                <text x={lx} y={ly} className="fwv-edge-label" style={{ fill: labelFill }}>
                  {e.w}
                </text>
              </g>
            );
          })}

          {/* nodes */}
          {nodes.map((nd) => {
            const isK = nd.id === current.via;
            const isI = nd.id === current.i;
            const isJ = nd.id === current.j;
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            let labelFill = 'var(--text-main)';
            if (isK) {
              fill = 'var(--accent)';
              stroke = 'var(--accent)';
              labelFill = 'var(--bg)';
            } else if (isI || isJ) {
              fill = 'rgba(var(--accent-rgb), 0.16)';
              stroke = 'var(--hue-pink)';
              labelFill = 'var(--text-main)';
            }
            return (
              <g key={`n-${nd.id}`}>
                <circle cx={nd.x} cy={nd.y} r={24} fill={fill} stroke={stroke} strokeWidth={isK ? 3 : 2} />
                <text x={nd.x} y={nd.y + 5} className="fwv-node-label" style={{ fill: labelFill }}>{nd.label}</text>
                {isK && current.i < 0 && (
                  <text x={nd.x} y={nd.y - 34} className="fwv-node-tag">waypoint k</text>
                )}
                {isI && <text x={nd.x} y={nd.y - 34} className="fwv-node-tag">i</text>}
                {isJ && nd.id !== current.i && <text x={nd.x} y={nd.y + 42} className="fwv-node-tag">j</text>}
              </g>
            );
          })}

          {/* distance matrix (right panel) */}
          <rect x={mX - 14} y={20} width={W - mX - 6} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={mX} y={40} className="fwv-row-label">dist matrix</text>
          {current.k >= 0 && (
            <text x={mX} y={58} className="fwv-row-sub">
              k = {current.k}{current.improvements > 0 ? ` · +${current.improvements} this phase` : ''}
            </text>
          )}
          <text x={mX} y={mY - 12} className="fwv-mtx-corner">i \ j</text>
          {nodes.map((nd, j) => {
            const colActive = j === current.j;
            const colK = nd.id === current.via && current.i >= 0;
            return (
              <text
                key={`ch-${nd.id}`}
                x={mX + cellW + j * cellW + cellW / 2}
                y={mY - 12}
                className="fwv-mtx-head"
                style={{ fill: colK ? 'var(--accent)' : colActive ? 'var(--hue-pink)' : 'var(--text-dim)' }}
              >
                {nd.label}
              </text>
            );
          })}
          {nodes.map((rs, i) => {
            const rowK = rs.id === current.via && current.i >= 0;
            const rowActive = i === current.i;
            return (
              <g key={`mr-${rs.id}`}>
                <text
                  x={mX + cellW / 2}
                  y={mY + i * cellH + cellH / 2 + 4}
                  className="fwv-mtx-head"
                  style={{ fill: rowK ? 'var(--accent)' : rowActive ? 'var(--hue-pink)' : 'var(--text-dim)' }}
                >
                  {rs.label}
                </text>
                {nodes.map((cs, j) => {
                  const val = current.matrix[i][j];
                  const isDiag = i === j;
                  const isTarget = i === current.i && j === current.j;
                  // the two source cells: dist[i][k] and dist[k][j]
                  const isLegA = current.i >= 0 && i === current.i && j === current.via;
                  const isLegB = current.i >= 0 && i === current.via && j === current.j;
                  let cellFill = 'var(--bg)';
                  let cellStroke = 'var(--border)';
                  let sw = 1;
                  if (isTarget) {
                    cellFill = current.improved
                      ? 'rgba(var(--accent-rgb), 0.28)'
                      : 'rgba(var(--accent-rgb), 0.1)';
                    cellStroke = current.improved ? 'var(--easy)' : 'var(--hue-pink)';
                    sw = 2.2;
                  } else if (isLegA || isLegB) {
                    cellFill = 'rgba(var(--accent-rgb), 0.12)';
                    cellStroke = 'var(--accent)';
                    sw = 1.8;
                  }
                  const valFill = val === INF ? 'var(--text-dim)' : 'var(--text-main)';
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
                        strokeWidth={sw}
                      />
                      <text
                        x={mX + cellW + j * cellW + cellW / 2}
                        y={mY + i * cellH + cellH / 2 + 4}
                        className={isDiag ? 'fwv-mtx-diag' : 'fwv-mtx-cell'}
                        style={{ fill: isDiag ? 'var(--text-dim)' : valFill }}
                      >
                        {fmt(val)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="fwv-metrics">
        <div className="fwv-metric">
          <span className="fwv-metric-label">waypoint k</span>
          <span className="fwv-metric-value">{current.via >= 0 ? nodes[current.via].label : '—'}</span>
        </div>
        <div className="fwv-metric">
          <span className="fwv-metric-label">pair (i, j)</span>
          <span className="fwv-metric-value">
            {current.i >= 0 ? `(${current.i}, ${current.j})` : '—'}
          </span>
        </div>
        <div className="fwv-metric">
          <span className="fwv-metric-label">old &rarr; new</span>
          <span className="fwv-metric-value" style={{ color: current.improved ? 'var(--easy)' : 'var(--accent)' }}>
            {current.oldVal == null
              ? '—'
              : `${current.oldVal === INF ? '∞' : current.oldVal} → ${current.newVal === INF ? '∞' : current.newVal}`}
          </span>
        </div>
        <div className="fwv-metric fwv-metric-dim">
          <span className="fwv-metric-label">improvements (phase)</span>
          <span className="fwv-metric-value fwv-metric-dimval">{current.improvements}</span>
        </div>
      </div>

      <div className="fwv-arith">
        <span className="fwv-arith-label">trace</span>
        <span className="fwv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
