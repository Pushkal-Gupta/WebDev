import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './BoruvkaMSTViz.css';

// Weighted undirected graph, 7 nodes A..G. Laid out so components cluster nicely.
// MST weight is 39 (verified equal to Kruskal/Prim on the same graph).
const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const NODES = [
  { id: 0, x: 110, y: 200 }, // A
  { id: 1, x: 250, y: 90 },  // B
  { id: 2, x: 410, y: 70 },  // C
  { id: 3, x: 230, y: 300 }, // D
  { id: 4, x: 400, y: 200 }, // E
  { id: 5, x: 410, y: 320 }, // F
  { id: 6, x: 560, y: 250 }, // G
];
const EDGES = [
  { u: 0, v: 1, w: 7 },
  { u: 0, v: 3, w: 5 },
  { u: 1, v: 2, w: 8 },
  { u: 1, v: 3, w: 9 },
  { u: 1, v: 4, w: 7 },
  { u: 2, v: 4, w: 5 },
  { u: 3, v: 4, w: 15 },
  { u: 3, v: 5, w: 6 },
  { u: 4, v: 5, w: 8 },
  { u: 4, v: 6, w: 9 },
  { u: 5, v: 6, w: 11 },
].map((e, i) => ({ ...e, id: i }));

const COMP_COLORS = [
  'var(--accent)', 'var(--hue-mint)', 'var(--hue-violet)',
  'var(--hue-pink)', 'var(--hue-sky)', 'var(--medium)', 'var(--easy)',
];

function buildFrames() {
  const n = NODES.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    let r = x;
    while (parent[r] !== r) r = parent[r];
    while (parent[x] !== r) { const nx = parent[x]; parent[x] = r; x = nx; }
    return r;
  };

  const mstEdges = [];
  let mstWeight = 0;
  let numComp = n;
  let phase = 0;
  const frames = [];

  // compOf maps every node to its component root for coloring.
  const compOf = () => NODES.map((_, i) => find(i));

  const snap = (extra) => ({
    compOf: compOf(),
    parent: [...parent],
    numComp,
    phase,
    mstEdges: [...mstEdges],
    mstWeight,
    cheapest: {},          // root -> edge id
    activeEdge: -1,
    addedThisStep: [],     // edge ids merged this frame
    note: '',
    stage: 'idle',
    ...extra,
  });

  frames.push(snap({
    stage: 'init',
    note: 'Start: every node is its own component (7 components). Borůvka repeats phases until one component remains.',
  }));

  const labelComp = (root) => {
    const members = [];
    for (let i = 0; i < n; i += 1) if (find(i) === root) members.push(NODE_LABELS[i]);
    return members.join('');
  };
  const edgeLabel = (e) => `${NODE_LABELS[e.u]}-${NODE_LABELS[e.v]} (w${e.w})`;

  while (numComp > 1) {
    phase += 1;

    // 1. Each component finds its cheapest outgoing edge.
    const cheapest = {}; // root -> edge id
    EDGES.forEach((e) => {
      const ra = find(e.u);
      const rb = find(e.v);
      if (ra === rb) return;
      if (cheapest[ra] === undefined || EDGES[cheapest[ra]].w > e.w) cheapest[ra] = e.id;
      if (cheapest[rb] === undefined || EDGES[cheapest[rb]].w > e.w) cheapest[rb] = e.id;
    });

    const roots = Object.keys(cheapest).map(Number);
    const pickStr = roots
      .map((r) => `{${labelComp(r)}} -> ${edgeLabel(EDGES[cheapest[r]])}`)
      .join(', ');
    frames.push(snap({
      stage: 'scan',
      cheapest,
      note: `Phase ${phase}: each component scans its outgoing edges and picks the cheapest. ${pickStr}.`,
    }));

    // 2. Add all chosen cheapest edges simultaneously, merging components.
    const startComp = numComp;
    const addedThisPhase = [];
    const seen = new Set();
    roots.forEach((r) => {
      const eid = cheapest[r];
      if (seen.has(eid)) return; // an edge can be cheapest for both its endpoints' components
      seen.add(eid);
      const e = EDGES[eid];
      const ra = find(e.u);
      const rb = find(e.v);
      if (ra === rb) return; // already merged earlier this phase
      parent[ra] = rb;
      mstEdges.push(eid);
      mstWeight += e.w;
      numComp -= 1;
      addedThisPhase.push(eid);
    });

    frames.push(snap({
      stage: 'merge',
      cheapest,
      addedThisStep: addedThisPhase,
      note: `Add all ${addedThisPhase.length} chosen edge(s) at once and union their components. `
        + `Components: ${startComp} -> ${numComp} (count at least halves each phase, so O(log V) phases).`,
    }));
  }

  frames.push(snap({
    stage: 'done',
    note: `Done in ${phase} phase(s). One component remains — the MST has ${mstEdges.length} edges, total weight ${mstWeight}.`,
  }));

  return { frames, mstWeight };
}

export default function BoruvkaMSTViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const { frames } = useMemo(() => buildFrames(), []);

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

  const W = 940;
  const H = 400;
  const panelX = 660;
  const panelW = W - panelX - 24;

  // Stable color per component root so colors persist as roots merge.
  const compColor = (root) => COMP_COLORS[root % COMP_COLORS.length];

  const cheapestSet = useMemo(() => new Set(Object.values(current.cheapest)), [current.cheapest]);
  const mstSet = useMemo(() => new Set(current.mstEdges), [current.mstEdges]);
  const addedSet = useMemo(() => new Set(current.addedThisStep), [current.addedThisStep]);

  return (
    <div className="bmv2">
      <div className="bmv2-head">
        <h3 className="bmv2-title">Borůvka&apos;s minimum spanning tree — O(E log V)</h3>
        <p className="bmv2-sub">
          Every phase, each component picks its single cheapest outgoing edge; all those edges are added at once and the
          components merge. The component count at least halves per phase, so only O(log V) phases are needed.
        </p>
      </div>

      <div className="bmv2-controls">
        <div className="bmv2-actions">
          <div className="bmv2-buttons">
            <button
              type="button"
              className="bmv2-btn bmv2-btn-primary"
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
              className="bmv2-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="bmv2-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="bmv2-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="bmv2-speed">
            <span className="bmv2-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bmv2-speed-range"
            />
            <span className="bmv2-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="bmv2-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="bmv2-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bmv2-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={panelX - 44} height={H - 40} fill="var(--bg)" stroke="var(--border)" rx={6} />
          <text x={32} y={40} className="bmv2-row-label">weighted undirected graph</text>

          {EDGES.map((e) => {
            const a = NODES[e.u];
            const b = NODES[e.v];
            const inMst = mstSet.has(e.id);
            const isCheapest = cheapestSet.has(e.id) && current.stage === 'scan';
            const justAdded = addedSet.has(e.id);
            const root = current.compOf[e.u];
            const stroke = justAdded ? 'var(--hue-pink)'
              : inMst ? compColor(root)
              : isCheapest ? 'var(--hue-pink)'
              : 'var(--text-dim)';
            const sw = justAdded ? 4 : inMst ? 3.2 : isCheapest ? 3 : 1.3;
            const op = inMst || isCheapest || justAdded ? 1 : 0.35;
            const dash = isCheapest && !inMst ? '7 4' : undefined;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <g key={`e-${e.id}`}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={stroke} strokeWidth={sw} opacity={op}
                  strokeDasharray={dash}
                />
                <rect x={mx - 12} y={my - 11} width={24} height={18} rx={4}
                  fill="var(--surface)" stroke={isCheapest || justAdded ? 'var(--hue-pink)' : 'var(--border)'} strokeWidth={1} opacity={op < 0.5 ? 0.8 : 1} />
                <text x={mx} y={my + 2} className="bmv2-weight">{e.w}</text>
              </g>
            );
          })}

          {NODES.map((nd) => {
            const root = current.compOf[nd.id];
            const c = compColor(root);
            return (
              <g key={`n-${nd.id}`}>
                <circle cx={nd.x} cy={nd.y} r={19} fill={c} stroke="var(--bg)" strokeWidth={2.5} />
                <text x={nd.x} y={nd.y + 4} className="bmv2-node-label">{NODE_LABELS[nd.id]}</text>
              </g>
            );
          })}

          {/* state panel: component count + DSU forest + MST tally */}
          <rect x={panelX - 12} y={20} width={panelW + 24} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={panelX} y={40} className="bmv2-row-label">phase</text>
          <text x={panelX} y={70} className="bmv2-readout-big">{current.phase}</text>

          <text x={panelX + 90} y={40} className="bmv2-row-label">components</text>
          <text x={panelX + 90} y={70} className="bmv2-readout-big">{current.numComp}</text>

          <line x1={panelX} y1={84} x2={panelX + panelW} y2={84} stroke="var(--border)" strokeWidth={1} />

          <text x={panelX} y={106} className="bmv2-row-label">union-find roots</text>
          {NODES.map((nd, i) => {
            const y = 118 + i * 22;
            const root = current.compOf[nd.id];
            const c = compColor(root);
            const isRoot = root === nd.id;
            return (
              <g key={`dsu-${nd.id}`}>
                <rect x={panelX} y={y} width={panelW} height={18} rx={4}
                  fill="var(--bg)" stroke="var(--border)" />
                <rect x={panelX + 4} y={y + 3} width={12} height={12} rx={3} fill={c} />
                <text x={panelX + 24} y={y + 13} className="bmv2-row-text">{NODE_LABELS[nd.id]}</text>
                <text x={panelX + 50} y={y + 13} className="bmv2-row-meta">
                  {isRoot ? 'root' : `-> ${NODE_LABELS[root]}`}
                </text>
              </g>
            );
          })}

          <line x1={panelX} y1={118 + NODES.length * 22 + 6} x2={panelX + panelW} y2={118 + NODES.length * 22 + 6} stroke="var(--border)" strokeWidth={1} />
          <text x={panelX} y={118 + NODES.length * 22 + 28} className="bmv2-row-label">MST weight</text>
          <text x={panelX} y={118 + NODES.length * 22 + 56} className="bmv2-readout-big">
            {current.mstWeight}
          </text>
          <text x={panelX + 96} y={118 + NODES.length * 22 + 50} className="bmv2-row-meta">
            {current.mstEdges.length} / {NODES.length - 1} edges
          </text>
        </svg>
      </div>

      <div className="bmv2-metrics">
        <div className="bmv2-metric">
          <span className="bmv2-metric-label">phase</span>
          <span className="bmv2-metric-value">{current.phase}</span>
        </div>
        <div className="bmv2-metric">
          <span className="bmv2-metric-label">components left</span>
          <span className="bmv2-metric-value">{current.numComp}</span>
        </div>
        <div className="bmv2-metric">
          <span className="bmv2-metric-label">MST edges</span>
          <span className="bmv2-metric-value">{current.mstEdges.length} / {NODES.length - 1}</span>
        </div>
        <div className="bmv2-metric">
          <span className="bmv2-metric-label">total weight</span>
          <span className="bmv2-metric-value">{current.mstWeight}</span>
        </div>
        <div className="bmv2-metric bmv2-metric-dim">
          <span className="bmv2-metric-label">graph</span>
          <span className="bmv2-metric-value bmv2-metric-dimval">{NODES.length}n · {EDGES.length}e weighted</span>
        </div>
      </div>

      <div className="bmv2-arith">
        <span className="bmv2-arith-label">trace</span>
        <span className="bmv2-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
