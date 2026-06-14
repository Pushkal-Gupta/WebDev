import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Check, X } from 'lucide-react';
import './KruskalMSTViz.css';

// Weighted undirected graph, 7 nodes A..G.
// MST weight is 18 (verified equal to a reference Prim MST on the same graph).
const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const NODES = [
  { id: 0, x: 120, y: 110 }, // A
  { id: 1, x: 120, y: 280 }, // B
  { id: 2, x: 270, y: 60 },  // C
  { id: 3, x: 270, y: 200 }, // D
  { id: 4, x: 430, y: 130 }, // E
  { id: 5, x: 430, y: 290 }, // F
  { id: 6, x: 580, y: 210 }, // G
];
const EDGES = [
  { u: 2, v: 3, w: 1 }, // C-D
  { u: 0, v: 3, w: 2 }, // A-D
  { u: 4, v: 5, w: 2 }, // E-F
  { u: 0, v: 1, w: 3 }, // A-B
  { u: 3, v: 4, w: 4 }, // D-E
  { u: 1, v: 4, w: 5 }, // B-E
  { u: 5, v: 6, w: 6 }, // F-G
  { u: 2, v: 0, w: 7 }, // C-A
  { u: 4, v: 6, w: 8 }, // E-G
  { u: 1, v: 2, w: 9 }, // B-C
].map((e, i) => ({ ...e, id: i }));

const COMP_COLORS = [
  'var(--accent)', 'var(--hue-mint)', 'var(--hue-violet)',
  'var(--hue-pink)', 'var(--hue-sky)', 'var(--medium)', 'var(--easy)',
];

function buildFrames() {
  const n = NODES.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  // path-compressing find that records the chain it compressed for the trace.
  const find = (x) => {
    const chain = [x];
    let r = x;
    while (parent[r] !== r) { r = parent[r]; chain.push(r); }
    const compressed = chain.filter((c) => parent[c] !== r && c !== r);
    while (parent[x] !== r) { const nx = parent[x]; parent[x] = r; x = nx; }
    return { root: r, compressed };
  };

  // sort ALL edges by weight ascending — the defining first step of Kruskal.
  const sorted = [...EDGES].sort((a, b) => (a.w - b.w) || (a.u - b.u) || (a.v - b.v));
  const sortedIds = sorted.map((e) => e.id);

  const mstEdges = [];
  const rejected = [];
  let mstWeight = 0;
  let accepted = 0;
  const frames = [];

  const compOf = () => NODES.map((_, i) => find(i).root);
  const edgeLabel = (e) => `${NODE_LABELS[e.u]}-${NODE_LABELS[e.v]} (w${e.w})`;

  const snap = (extra) => ({
    compOf: compOf(),
    parent: [...parent],
    mstEdges: [...mstEdges],
    rejected: [...rejected],
    mstWeight,
    accepted,
    sortedIds,
    pointer: -1,        // index into sortedIds of the edge under consideration
    activeEdge: -1,
    decision: null,     // 'add' | 'skip'
    compressed: [],
    note: '',
    stage: 'idle',
    ...extra,
  });

  frames.push(snap({
    stage: 'init',
    note: 'Start: every node is its own component (7 sets in the DSU forest). The MST is empty.',
  }));

  const weightsStr = sorted.map((e) => `${edgeLabel(e)}`).join(', ');
  frames.push(snap({
    stage: 'sort',
    note: `Step 1 — sort ALL ${EDGES.length} edges by weight ascending: ${weightsStr}. Kruskal then scans this list once, left to right.`,
  }));

  for (let i = 0; i < sorted.length && accepted < n - 1; i += 1) {
    const e = sorted[i];
    const fu = find(e.u);
    const fv = find(e.v);
    const sameSet = fu.root === fv.root;
    const compressed = [...fu.compressed, ...fv.compressed];

    frames.push(snap({
      stage: 'consider',
      pointer: i,
      activeEdge: e.id,
      compressed,
      note: `Consider ${edgeLabel(e)} (cheapest unscanned). find(${NODE_LABELS[e.u]})=${NODE_LABELS[fu.root]}, `
        + `find(${NODE_LABELS[e.v]})=${NODE_LABELS[fv.root]}`
        + `${compressed.length ? ` — path compression flattens {${compressed.map((c) => NODE_LABELS[c]).join(', ')}}` : ''}.`,
    }));

    if (sameSet) {
      rejected.push(e.id);
      frames.push(snap({
        stage: 'skip',
        pointer: i,
        activeEdge: e.id,
        decision: 'skip',
        note: `${edgeLabel(e)}: same component {root ${NODE_LABELS[fu.root]}} -> adding it would close a cycle. SKIP. `
          + `MST unchanged at ${mstEdges.length} edge(s), total=${mstWeight}.`,
      }));
    } else {
      parent[fu.root] = fv.root;
      mstEdges.push(e.id);
      mstWeight += e.w;
      accepted += 1;
      frames.push(snap({
        stage: 'add',
        pointer: i,
        activeEdge: e.id,
        decision: 'add',
        note: `${edgeLabel(e)}: different components -> ADD to MST and union(${NODE_LABELS[fu.root]}, ${NODE_LABELS[fv.root]}). `
          + `MST now has ${mstEdges.length}/${n - 1} edge(s), total=${mstWeight}.`,
      }));
    }
  }

  frames.push(snap({
    stage: 'done',
    note: `Done — ${mstEdges.length} = V-1 edges accepted, so the MST is complete. Total weight ${mstWeight}. `
      + `Remaining edges in the sorted list are not needed.`,
  }));

  return { frames, mstWeight };
}

export default function KruskalMSTViz() {
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
  const H = 420;
  const panelX = 680;
  const panelW = W - panelX - 24;

  const compColor = (root) => COMP_COLORS[root % COMP_COLORS.length];

  const mstSet = useMemo(() => new Set(current.mstEdges), [current.mstEdges]);
  const rejectedSet = useMemo(() => new Set(current.rejected), [current.rejected]);
  const compressedSet = useMemo(() => new Set(current.compressed), [current.compressed]);

  const sortedEdges = useMemo(() => current.sortedIds.map((id) => EDGES.find((e) => e.id === id)), [current.sortedIds]);

  return (
    <div className="kmv">
      <div className="kmv-head">
        <h3 className="kmv-title">Kruskal&apos;s minimum spanning tree — O(E log E)</h3>
        <p className="kmv-sub">
          Sort every edge by weight, then scan cheapest-first. Each edge joins the MST only if its endpoints are in
          different DSU sets; otherwise it would close a cycle and is skipped. Stop once V-1 edges are accepted.
        </p>
      </div>

      <div className="kmv-controls">
        <div className="kmv-actions">
          <div className="kmv-buttons">
            <button
              type="button"
              className="kmv-btn kmv-btn-primary"
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
              className="kmv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="kmv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="kmv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="kmv-speed">
            <span className="kmv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="kmv-speed-range"
            />
            <span className="kmv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="kmv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="kmv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="kmv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={panelX - 44} height={H - 40} fill="var(--bg)" stroke="var(--border)" rx={6} />
          <text x={32} y={40} className="kmv-row-label">weighted undirected graph</text>

          {EDGES.map((e) => {
            const a = NODES[e.u];
            const b = NODES[e.v];
            const inMst = mstSet.has(e.id);
            const isRejected = rejectedSet.has(e.id);
            const isActive = e.id === current.activeEdge;
            const root = current.compOf[e.u];
            const stroke = isActive && current.decision === 'add' ? 'var(--easy)'
              : isActive && current.decision === 'skip' ? 'var(--hard)'
              : isActive ? 'var(--hue-pink)'
              : inMst ? compColor(root)
              : isRejected ? 'var(--hard)'
              : 'var(--text-dim)';
            const sw = isActive ? 4 : inMst ? 3.2 : 1.3;
            const op = isActive ? 1 : inMst ? 1 : isRejected ? 0.5 : 0.32;
            const dash = (isRejected && !inMst) || (isActive && current.decision === 'skip') ? '7 5' : undefined;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <g key={`e-${e.id}`}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={stroke} strokeWidth={sw} opacity={op}
                  strokeDasharray={dash}
                />
                <rect
                  x={mx - 11} y={my - 10} width={22} height={18} rx={4}
                  fill="var(--surface)"
                  stroke={isActive ? stroke : 'var(--border)'}
                  strokeWidth={1}
                  opacity={op < 0.4 ? 0.85 : 1}
                />
                <text x={mx} y={my + 3} className="kmv-weight">{e.w}</text>
              </g>
            );
          })}

          {NODES.map((nd) => {
            const root = current.compOf[nd.id];
            const c = compColor(root);
            const isFlattened = compressedSet.has(nd.id);
            return (
              <g key={`n-${nd.id}`}>
                <circle
                  cx={nd.x} cy={nd.y} r={19}
                  fill={c}
                  stroke={isFlattened ? 'var(--hue-pink)' : 'var(--bg)'}
                  strokeWidth={isFlattened ? 3 : 2.5}
                />
                <text x={nd.x} y={nd.y + 4} className="kmv-node-label">{NODE_LABELS[nd.id]}</text>
              </g>
            );
          })}

          {/* state panel: sorted-edge list + DSU parent array + MST tally */}
          <rect x={panelX - 12} y={20} width={panelW + 24} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={panelX} y={40} className="kmv-row-label">sorted edges (ascending)</text>
          {sortedEdges.map((e, i) => {
            const cols = 5;
            const cellW = panelW / cols;
            const col = i % cols;
            const rowi = Math.floor(i / cols);
            const x = panelX + col * cellW;
            const y = 50 + rowi * 26;
            const inMst = mstSet.has(e.id);
            const isRejected = rejectedSet.has(e.id);
            const isPointer = i === current.pointer;
            const fill = isPointer ? 'var(--hue-pink)'
              : inMst ? 'var(--easy)'
              : isRejected ? 'var(--hard)'
              : 'var(--bg)';
            const txtClass = (isPointer || inMst || isRejected) ? 'kmv-chip-text-on' : 'kmv-chip-text';
            return (
              <g key={`chip-${e.id}`}>
                <rect x={x} y={y} width={cellW - 6} height={20} rx={4} fill={fill} stroke="var(--border)" strokeWidth={1} />
                <text x={x + (cellW - 6) / 2} y={y + 14} className={txtClass}>
                  {NODE_LABELS[e.u]}{NODE_LABELS[e.v]}:{e.w}
                </text>
              </g>
            );
          })}

          {(() => {
            const sortedRows = Math.ceil(sortedEdges.length / 5);
            const dsuY = 50 + sortedRows * 26 + 16;
            return (
              <g>
                <line x1={panelX} y1={dsuY - 12} x2={panelX + panelW} y2={dsuY - 12} stroke="var(--border)" strokeWidth={1} />
                <text x={panelX} y={dsuY + 2} className="kmv-row-label">dsu parent[] (path-compressed)</text>
                {NODES.map((nd, i) => {
                  const cols = 7;
                  const cellW = panelW / cols;
                  const x = panelX + i * cellW;
                  const y = dsuY + 12;
                  const root = current.compOf[nd.id];
                  const c = compColor(root);
                  const p = current.parent[nd.id];
                  const flat = compressedSet.has(nd.id);
                  return (
                    <g key={`dsu-${nd.id}`}>
                      <rect x={x} y={y} width={cellW - 4} height={34} rx={4} fill="var(--bg)" stroke={flat ? 'var(--hue-pink)' : 'var(--border)'} strokeWidth={flat ? 2 : 1} />
                      <text x={x + (cellW - 4) / 2} y={y + 13} className="kmv-dsu-key">{NODE_LABELS[nd.id]}</text>
                      <rect x={x + (cellW - 4) / 2 - 8} y={y + 18} width={16} height={12} rx={3} fill={c} />
                      <text x={x + (cellW - 4) / 2} y={y + 28} className="kmv-dsu-val">{NODE_LABELS[p]}</text>
                    </g>
                  );
                })}

                <line x1={panelX} y1={dsuY + 60} x2={panelX + panelW} y2={dsuY + 60} stroke="var(--border)" strokeWidth={1} />
                <text x={panelX} y={dsuY + 80} className="kmv-row-label">MST weight</text>
                <text x={panelX} y={dsuY + 108} className="kmv-readout-big">{current.mstWeight}</text>
                <text x={panelX + 88} y={dsuY + 102} className="kmv-row-meta">
                  {current.mstEdges.length} / {NODES.length - 1} edges
                </text>
                <g transform={`translate(${panelX + panelW - 130}, ${dsuY + 72})`}>
                  <rect x={0} y={0} width={62} height={20} rx={4} fill="rgba(var(--accent-rgb), 0)" stroke="var(--easy)" strokeWidth={1.2} />
                  <Check x={6} y={4} size={12} color="var(--easy)" />
                  <text x={24} y={14} className="kmv-tally kmv-tally-ok">{current.mstEdges.length}</text>
                  <rect x={70} y={0} width={62} height={20} rx={4} fill="rgba(var(--accent-rgb), 0)" stroke="var(--hard)" strokeWidth={1.2} />
                  <X x={76} y={4} size={12} color="var(--hard)" />
                  <text x={94} y={14} className="kmv-tally kmv-tally-bad">{current.rejected.length}</text>
                </g>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="kmv-metrics">
        <div className="kmv-metric">
          <span className="kmv-metric-label">edge pointer</span>
          <span className="kmv-metric-value">
            {current.pointer < 0 ? '—' : `${current.pointer + 1} / ${EDGES.length}`}
          </span>
        </div>
        <div className="kmv-metric">
          <span className="kmv-metric-label">MST edges</span>
          <span className="kmv-metric-value">{current.mstEdges.length} / {NODES.length - 1}</span>
        </div>
        <div className="kmv-metric">
          <span className="kmv-metric-label">total weight</span>
          <span className="kmv-metric-value">{current.mstWeight}</span>
        </div>
        <div className="kmv-metric">
          <span className="kmv-metric-label">accepted / rejected</span>
          <span className="kmv-metric-value">{current.mstEdges.length} / {current.rejected.length}</span>
        </div>
        <div className="kmv-metric kmv-metric-dim">
          <span className="kmv-metric-label">graph</span>
          <span className="kmv-metric-value kmv-metric-dimval">{NODES.length}n · {EDGES.length}e weighted</span>
        </div>
      </div>

      <div className="kmv-arith">
        <span className="kmv-arith-label">trace</span>
        <span className="kmv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
