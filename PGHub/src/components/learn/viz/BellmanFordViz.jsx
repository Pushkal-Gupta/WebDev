import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './BellmanFordViz.css';

const NODES = [
  { id: 0, label: 'S', x: 70, y: 200 },
  { id: 1, label: 'A', x: 230, y: 90 },
  { id: 2, label: 'B', x: 230, y: 310 },
  { id: 3, label: 'C', x: 410, y: 200 },
  { id: 4, label: 'D', x: 580, y: 90 },
  { id: 5, label: 'T', x: 580, y: 310 },
];

// Standard graph (no negative cycle).
const EDGES_OK = [
  { u: 0, v: 1, w: 6 },
  { u: 0, v: 2, w: 7 },
  { u: 1, v: 2, w: 8 },
  { u: 1, v: 3, w: 5 },
  { u: 1, v: 4, w: -4 },
  { u: 2, v: 3, w: -3 },
  { u: 2, v: 5, w: 9 },
  { u: 3, v: 4, w: 7 },
  { u: 3, v: 5, w: 4 },
  { u: 4, v: 0, w: 2 },
];

// Same but flip one edge weight to introduce a negative cycle through C-B-A-C-ish
const EDGES_NEG_CYCLE = [
  { u: 0, v: 1, w: 6 },
  { u: 0, v: 2, w: 7 },
  { u: 1, v: 2, w: 8 },
  { u: 1, v: 3, w: 5 },
  { u: 1, v: 4, w: -4 },
  { u: 2, v: 3, w: -3 },
  { u: 2, v: 5, w: 9 },
  { u: 3, v: 1, w: -6 }, // creates cycle 1 -> 3 -> 1 of total weight 5 + (-6) = -1
  { u: 3, v: 5, w: 4 },
  { u: 4, v: 0, w: 2 },
];

const SOURCE = 0;

function buildFrames(edges) {
  const V = NODES.length;
  const dist = new Array(V).fill(Infinity);
  const parent = new Array(V).fill(-1);
  dist[SOURCE] = 0;
  const frames = [];
  const updatedSet = new Set();

  frames.push({
    kind: 'init',
    iter: 0,
    edgeIdx: -1,
    dist: [...dist],
    parent: [...parent],
    updated: new Set(),
    relaxedEdges: new Set(),
    negCycleEdges: new Set(),
    note: `Initialize: dist[${NODES[SOURCE].label}] = 0, all others ∞. Bellman-Ford runs V-1 = ${V - 1} iterations of relaxing all ${edges.length} edges.`,
  });

  let stoppedEarly = false;
  for (let it = 1; it <= V - 1; it++) {
    let anyRelaxed = false;
    const itUpdated = new Set();
    const itRelaxed = new Set();

    frames.push({
      kind: 'iter-start',
      iter: it,
      edgeIdx: -1,
      dist: [...dist],
      parent: [...parent],
      updated: new Set(),
      relaxedEdges: new Set(),
      negCycleEdges: new Set(),
      note: `Iteration ${it}/${V - 1}: scan every edge and try to relax dist[v] = min(dist[v], dist[u] + w).`,
    });

    for (let ei = 0; ei < edges.length; ei++) {
      const e = edges[ei];
      const canRelax = dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v];
      if (canRelax) {
        const newD = dist[e.u] + e.w;
        const oldD = dist[e.v];
        dist[e.v] = newD;
        parent[e.v] = e.u;
        anyRelaxed = true;
        itUpdated.add(e.v);
        itRelaxed.add(ei);
        frames.push({
          kind: 'relax',
          iter: it,
          edgeIdx: ei,
          dist: [...dist],
          parent: [...parent],
          updated: new Set([e.v]),
          relaxedEdges: new Set([ei]),
          negCycleEdges: new Set(),
          note: `Iter ${it} · edge ${NODES[e.u].label}→${NODES[e.v].label} (w=${e.w}): dist[${NODES[e.u].label}] + ${e.w} = ${dist[e.u] - e.w >= 0 || dist[e.u] !== Infinity ? newD : '∞'}. Was ${oldD === Infinity ? '∞' : oldD}; now ${newD}. Relax.`,
        });
      } else {
        frames.push({
          kind: 'check',
          iter: it,
          edgeIdx: ei,
          dist: [...dist],
          parent: [...parent],
          updated: new Set(),
          relaxedEdges: new Set(),
          negCycleEdges: new Set(),
          note: `Iter ${it} · edge ${NODES[e.u].label}→${NODES[e.v].label} (w=${e.w}): dist[${NODES[e.u].label}] = ${dist[e.u] === Infinity ? '∞' : dist[e.u]}, dist[${NODES[e.v].label}] = ${dist[e.v] === Infinity ? '∞' : dist[e.v]}. No improvement.`,
        });
      }
    }

    frames.push({
      kind: 'iter-end',
      iter: it,
      edgeIdx: -1,
      dist: [...dist],
      parent: [...parent],
      updated: itUpdated,
      relaxedEdges: itRelaxed,
      negCycleEdges: new Set(),
      note: anyRelaxed
        ? `End of iteration ${it}. Updated nodes: {${[...itUpdated].map((i) => NODES[i].label).join(', ')}}.`
        : `End of iteration ${it}. No edge relaxed — distances have converged; remaining iterations would be no-ops.`,
    });

    for (const u of itUpdated) updatedSet.add(u);

    if (!anyRelaxed) {
      stoppedEarly = true;
      break;
    }
  }

  // Negative-cycle detection pass: V-th iteration
  const negEdges = new Set();
  let negFound = false;
  frames.push({
    kind: 'neg-start',
    iter: V,
    edgeIdx: -1,
    dist: [...dist],
    parent: [...parent],
    updated: new Set(),
    relaxedEdges: new Set(),
    negCycleEdges: new Set(),
    note: `Detection pass: scan all edges one more time. If any still relaxes, that edge sits on a negative-weight cycle reachable from the source.`,
  });

  for (let ei = 0; ei < edges.length; ei++) {
    const e = edges[ei];
    if (dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]) {
      negEdges.add(ei);
      negFound = true;
      frames.push({
        kind: 'neg-edge',
        iter: V,
        edgeIdx: ei,
        dist: [...dist],
        parent: [...parent],
        updated: new Set([e.v]),
        relaxedEdges: new Set(),
        negCycleEdges: new Set(negEdges),
        note: `Edge ${NODES[e.u].label}→${NODES[e.v].label} (w=${e.w}) STILL relaxes after V-1 iterations: ${dist[e.u]} + ${e.w} < ${dist[e.v]}. Negative cycle detected.`,
      });
    }
  }

  frames.push({
    kind: 'done',
    iter: V,
    edgeIdx: -1,
    dist: [...dist],
    parent: [...parent],
    updated: new Set(),
    relaxedEdges: new Set(),
    negCycleEdges: new Set(negEdges),
    note: negFound
      ? `Done. Negative cycle detected — shortest paths are undefined for affected nodes.`
      : stoppedEarly
      ? `Done. Distances converged early. No negative cycle. dist = [${dist.map((d, i) => `${NODES[i].label}=${d === Infinity ? '∞' : d}`).join(', ')}].`
      : `Done. V-1 iterations complete, no relaxation in detection pass. No negative cycle. dist = [${dist.map((d, i) => `${NODES[i].label}=${d === Infinity ? '∞' : d}`).join(', ')}].`,
  });

  return frames;
}

export default function BellmanFordViz() {
  const [hasNegCycle, setHasNegCycle] = useState(false);
  const edges = hasNegCycle ? EDGES_NEG_CYCLE : EDGES_OK;

  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(edges), [edges]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(800 / speed);

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

  const toggleCycle = () => {
    setIsRunningRaw(false);
    setStep(0);
    setHasNegCycle((v) => !v);
  };

  const W = 660;
  const H = 420;
  const R = 22;

  // Detect if final frame found a neg cycle for label
  const finalNegCycle = frames[frames.length - 1].negCycleEdges.size > 0;

  return (
    <div className="bfv">
      <div className="bfv-head">
        <h3 className="bfv-title">Bellman-Ford — V-1 relaxation passes + negative-cycle detection</h3>
        <p className="bfv-sub">
          Each iteration scans every edge and tightens dist[v] when a shorter route through u appears. After
          V-1 passes, any edge that still relaxes sits on a negative-weight cycle.
        </p>
      </div>

      <div className="bfv-controls">
        <label className="bfv-toggle">
          <input type="checkbox" checked={hasNegCycle} onChange={toggleCycle} />
          inject negative cycle (C→A, w=−6)
        </label>

        <div className="bfv-actions">
          <div className="bfv-buttons">
            <button
              type="button"
              className="bfv-btn bfv-btn-primary"
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
              className="bfv-btn"
              onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="bfv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="bfv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="bfv-speed">
            <span className="bfv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bfv-speed-range"
            />
            <span className="bfv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="bfv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="bfv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bfv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="bfv-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--border)" />
            </marker>
            <marker id="bfv-arr-acc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker id="bfv-arr-easy" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--easy)" />
            </marker>
            <marker id="bfv-arr-hard" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hard)" />
            </marker>
          </defs>

          <text x={20} y={22} className="bfv-row-label">graph — weighted, directed</text>

          {edges.map((e, ei) => {
            const a = NODES[e.u];
            const b = NODES[e.v];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / len;
            const uy = dy / len;
            // Offset both endpoints by R, curve a bit if reverse pair exists
            const hasReverse = edges.some((o) => o.u === e.v && o.v === e.u);
            const offset = hasReverse ? 10 : 0;
            const px = -uy * offset;
            const py = ux * offset;
            const x1 = a.x + ux * R + px;
            const y1 = a.y + uy * R + py;
            const x2 = b.x - ux * (R + 4) + px;
            const y2 = b.y - uy * (R + 4) + py;

            const isActive = ei === current.edgeIdx;
            const wasRelaxed = current.relaxedEdges.has(ei);
            const isNeg = current.negCycleEdges.has(ei);

            let cls = 'bfv-edge';
            let marker = 'url(#bfv-arr)';
            if (isNeg) {
              cls = 'bfv-edge bfv-edge-negcycle';
              marker = 'url(#bfv-arr-hard)';
            } else if (wasRelaxed) {
              cls = 'bfv-edge bfv-edge-relaxed';
              marker = 'url(#bfv-arr-easy)';
            } else if (isActive) {
              cls = 'bfv-edge bfv-edge-active';
              marker = 'url(#bfv-arr-acc)';
            }

            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const label = `${e.w >= 0 ? '+' : ''}${e.w}`;
            const lblW = label.length * 8 + 6;
            const lblFill = isNeg
              ? 'var(--hard)'
              : wasRelaxed
              ? 'var(--easy)'
              : isActive
              ? 'var(--accent)'
              : e.w < 0
              ? 'var(--hue-pink)'
              : 'var(--text-main)';

            return (
              <g key={`edge-${ei}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className={cls} markerEnd={marker} />
                <rect
                  x={mx - lblW / 2 + (uy * 12)}
                  y={my - 9 - (ux * 12)}
                  width={lblW}
                  height={18}
                  rx={3}
                  className="bfv-edge-label-bg"
                />
                <text
                  x={mx + (uy * 12)}
                  y={my + 4 - (ux * 12)}
                  className="bfv-edge-label"
                  textAnchor="middle"
                  fill={lblFill}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {NODES.map((n) => {
            const isSource = n.id === SOURCE;
            const wasUpdated = current.updated.has(n.id);
            const d = current.dist[n.id];
            return (
              <g key={`node-${n.id}`}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={R}
                  className="bfv-node-circle"
                  fill={
                    isSource
                      ? 'rgba(var(--accent-rgb), 0.22)'
                      : wasUpdated
                      ? 'rgba(var(--accent-rgb), 0.14)'
                      : 'var(--surface)'
                  }
                  stroke={isSource || wasUpdated ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isSource || wasUpdated ? 2.2 : 1.4}
                />
                <text x={n.x} y={n.y + 1} className="bfv-node-label">{n.label}</text>
                <text x={n.x} y={n.y + R + 13} className="bfv-node-dist">
                  d={d === Infinity ? '∞' : d}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="bfv-table">
          <span className="bfv-table-title">distance table — dist[v] / parent[v]</span>
          <div className="bfv-table-grid">
            <div className="bfv-table-head">node</div>
            <div className="bfv-table-head">dist</div>
            <div className="bfv-table-head">parent</div>
            {NODES.map((n) => {
              const d = current.dist[n.id];
              const p = current.parent[n.id];
              const isUpdated = current.updated.has(n.id);
              const isTarget =
                current.edgeIdx >= 0 && edges[current.edgeIdx]?.v === n.id;
              const cellClass = `bfv-table-cell${isUpdated ? ' bfv-table-cell-updated' : ''}${isTarget ? ' bfv-table-cell-target' : ''}`;
              return (
                <React.Fragment key={`row-${n.id}`}>
                  <div className="bfv-table-cell">{n.label}</div>
                  <div className={cellClass + (d === Infinity ? ' bfv-table-cell-inf' : '')}>
                    {d === Infinity ? '∞' : d}
                  </div>
                  <div className="bfv-table-cell">
                    {p === -1 ? '—' : NODES[p].label}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bfv-metrics">
        <div className="bfv-metric">
          <span className="bfv-metric-label">iteration</span>
          <span className="bfv-metric-value">{current.iter}</span>
        </div>
        <div className="bfv-metric">
          <span className="bfv-metric-label">step kind</span>
          <span className="bfv-metric-value">{current.kind}</span>
        </div>
        <div className="bfv-metric">
          <span className="bfv-metric-label">edge index</span>
          <span className="bfv-metric-value">{current.edgeIdx < 0 ? '—' : current.edgeIdx}</span>
        </div>
        <div className="bfv-metric bfv-metric-dim">
          <span className="bfv-metric-label">neg cycle</span>
          <span className={`bfv-metric-value ${finalNegCycle ? 'bfv-metric-bad' : 'bfv-metric-dimval'}`}>
            {finalNegCycle ? 'YES' : 'no'}
          </span>
        </div>
      </div>

      <div className="bfv-arith">
        <span className="bfv-arith-label">trace</span>
        <span className="bfv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
