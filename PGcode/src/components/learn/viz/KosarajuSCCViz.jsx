import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './KosarajuSCCViz.css';

const NODES = [
  { id: 0, label: 'A', x: 100, y: 80 },
  { id: 1, label: 'B', x: 260, y: 80 },
  { id: 2, label: 'C', x: 420, y: 80 },
  { id: 3, label: 'D', x: 580, y: 80 },
  { id: 4, label: 'E', x: 100, y: 260 },
  { id: 5, label: 'F', x: 320, y: 260 },
  { id: 6, label: 'G', x: 540, y: 260 },
];

// Designed so SCCs = {A,B,E}, {C,F}, {D}, {G}? Let's tune to give 3 nontrivial SCCs.
// SCC plan: {A,B,E}, {C,D,G}, {F}
const EDGES = [
  { u: 0, v: 1 },  // A->B
  { u: 1, v: 4 },  // B->E
  { u: 4, v: 0 },  // E->A  (closes ABE)
  { u: 1, v: 2 },  // B->C  (cross)
  { u: 2, v: 3 },  // C->D
  { u: 3, v: 6 },  // D->G
  { u: 6, v: 2 },  // G->C  (closes CDG)
  { u: 2, v: 5 },  // C->F  (cross)
  { u: 5, v: 6 },  // F->G  (cross — F is its own SCC)
  { u: 3, v: 5 },  // D->F  (cross)
];

function buildFrames() {
  const V = NODES.length;
  const adj = Array.from({ length: V }, () => []);
  const adjT = Array.from({ length: V }, () => []);
  EDGES.forEach((e, i) => {
    adj[e.u].push({ to: e.v, ei: i });
    adjT[e.v].push({ to: e.u, ei: i });
  });

  const frames = [];

  // Phase 1: DFS on G, record finish order
  const visited1 = new Array(V).fill(false);
  const finishStack = [];

  frames.push({
    kind: 'init',
    phase: 'phase 1 · DFS on G',
    visited: new Set(),
    finishStack: [],
    sccColors: {},
    sccs: [],
    currentNode: null,
    activeEdge: -1,
    transposed: false,
    sccCount: 0,
    note: `Phase 1: DFS over the original graph, pushing each vertex onto the finish stack the moment its recursion completes. The stack ends up sorted by reverse finish time.`,
  });

  const dfs1 = (u) => {
    visited1[u] = true;
    frames.push({
      kind: 'dfs1-visit',
      phase: 'phase 1 · DFS on G',
      visited: new Set([...Array(V).keys()].filter((i) => visited1[i])),
      finishStack: [...finishStack],
      sccColors: {},
      sccs: [],
      currentNode: u,
      activeEdge: -1,
      transposed: false,
      sccCount: 0,
      note: `Enter ${NODES[u].label}. Mark visited and recurse into outgoing edges.`,
    });

    for (const { to, ei } of adj[u]) {
      if (!visited1[to]) {
        frames.push({
          kind: 'dfs1-edge',
          phase: 'phase 1 · DFS on G',
          visited: new Set([...Array(V).keys()].filter((i) => visited1[i])),
          finishStack: [...finishStack],
          sccColors: {},
          sccs: [],
          currentNode: u,
          activeEdge: ei,
          transposed: false,
          sccCount: 0,
          note: `Follow edge ${NODES[u].label}→${NODES[to].label}.`,
        });
        dfs1(to);
      }
    }

    finishStack.push(u);
    frames.push({
      kind: 'dfs1-finish',
      phase: 'phase 1 · DFS on G',
      visited: new Set([...Array(V).keys()].filter((i) => visited1[i])),
      finishStack: [...finishStack],
      sccColors: {},
      sccs: [],
      currentNode: u,
      activeEdge: -1,
      transposed: false,
      sccCount: 0,
      note: `Finish ${NODES[u].label}. Push onto stack. Stack now: [${finishStack.map((i) => NODES[i].label).join(', ')}].`,
    });
  };

  for (let i = 0; i < V; i++) {
    if (!visited1[i]) dfs1(i);
  }

  // Transition: transpose
  frames.push({
    kind: 'transpose',
    phase: 'phase 2 · transpose G',
    visited: new Set(),
    finishStack: [...finishStack],
    sccColors: {},
    sccs: [],
    currentNode: null,
    activeEdge: -1,
    transposed: true,
    sccCount: 0,
    note: `Phase 2: flip every edge. The transposed graph has identical SCCs, but cross-SCC edges now point the wrong way — so DFS from a stack-top vertex cannot leave its SCC.`,
  });

  // Phase 3: DFS on transpose in reverse-finish order
  const visited2 = new Array(V).fill(false);
  const sccOfNode = new Array(V).fill(-1);
  const sccs = [];
  let sccIdx = 0;

  const dfs2 = (u, group) => {
    visited2[u] = true;
    sccOfNode[u] = sccIdx;
    group.push(u);
    frames.push({
      kind: 'dfs2-visit',
      phase: `phase 3 · SCC #${sccIdx + 1}`,
      visited: new Set([...Array(V).keys()].filter((i) => visited2[i])),
      finishStack: [...finishStack],
      sccColors: { ...sccOfNode.reduce((acc, s, n) => (s >= 0 ? { ...acc, [n]: s } : acc), {}) },
      sccs: sccs.map((g) => [...g]),
      currentNode: u,
      activeEdge: -1,
      transposed: true,
      sccCount: sccs.length,
      note: `Reverse-DFS visits ${NODES[u].label} — add to SCC #${sccIdx + 1}.`,
    });
    for (const { to, ei } of adjT[u]) {
      if (!visited2[to]) {
        frames.push({
          kind: 'dfs2-edge',
          phase: `phase 3 · SCC #${sccIdx + 1}`,
          visited: new Set([...Array(V).keys()].filter((i) => visited2[i])),
          finishStack: [...finishStack],
          sccColors: { ...sccOfNode.reduce((acc, s, n) => (s >= 0 ? { ...acc, [n]: s } : acc), {}) },
          sccs: sccs.map((g) => [...g]),
          currentNode: u,
          activeEdge: ei,
          transposed: true,
          sccCount: sccs.length,
          note: `Walk reverse edge ${NODES[u].label}←${NODES[to].label}.`,
        });
        dfs2(to, group);
      }
    }
  };

  while (finishStack.length) {
    const u = finishStack.pop();
    if (visited2[u]) continue;
    const group = [];
    frames.push({
      kind: 'pop',
      phase: `phase 3 · SCC #${sccIdx + 1}`,
      visited: new Set([...Array(V).keys()].filter((i) => visited2[i])),
      finishStack: [...finishStack],
      sccColors: { ...sccOfNode.reduce((acc, s, n) => (s >= 0 ? { ...acc, [n]: s } : acc), {}) },
      sccs: sccs.map((g) => [...g]),
      currentNode: u,
      activeEdge: -1,
      transposed: true,
      sccCount: sccs.length,
      note: `Pop ${NODES[u].label} from stack. Start a fresh SCC by reverse-DFS.`,
    });
    dfs2(u, group);
    sccs.push(group);
    frames.push({
      kind: 'scc-close',
      phase: `phase 3 · SCC #${sccIdx + 1}`,
      visited: new Set([...Array(V).keys()].filter((i) => visited2[i])),
      finishStack: [...finishStack],
      sccColors: { ...sccOfNode.reduce((acc, s, n) => (s >= 0 ? { ...acc, [n]: s } : acc), {}) },
      sccs: sccs.map((g) => [...g]),
      currentNode: null,
      activeEdge: -1,
      transposed: true,
      sccCount: sccs.length,
      note: `SCC #${sccIdx + 1} closed: {${group.map((n) => NODES[n].label).join(', ')}}.`,
    });
    sccIdx++;
  }

  frames.push({
    kind: 'done',
    phase: 'done',
    visited: new Set([...Array(V).keys()].filter((i) => visited2[i])),
    finishStack: [],
    sccColors: { ...sccOfNode.reduce((acc, s, n) => (s >= 0 ? { ...acc, [n]: s } : acc), {}) },
    sccs: sccs.map((g) => [...g]),
    currentNode: null,
    activeEdge: -1,
    transposed: true,
    sccCount: sccs.length,
    note: `Done. Found ${sccs.length} strongly-connected component${sccs.length === 1 ? '' : 's'}: ${sccs.map((g, i) => `#${i + 1}={${g.map((n) => NODES[n].label).join(',')}}`).join('  ')}.`,
  });

  return frames;
}

const SCC_PALETTE = [
  'var(--hue-violet)',
  'var(--hue-sky)',
  'var(--hue-mint)',
  'var(--hue-pink)',
  'var(--easy)',
  'var(--warning)',
  'var(--hard)',
];

export default function KosarajuSCCViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
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

  const W = 680;
  const H = 360;
  const R = 22;

  return (
    <div className="ksv">
      <div className="ksv-head">
        <h3 className="ksv-title">Kosaraju — DFS · transpose · reverse-order DFS</h3>
        <p className="ksv-sub">
          Phase 1 finishes vertices in topological-ish order on G. Phase 2 transposes the graph. Phase 3 DFS in
          reverse finish order — every tree harvests exactly one strongly-connected component.
        </p>
      </div>

      <div className="ksv-controls">
        <div className="ksv-actions">
          <div className="ksv-buttons">
            <button
              type="button"
              className="ksv-btn ksv-btn-primary"
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
              className="ksv-btn"
              onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="ksv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="ksv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="ksv-speed">
            <span className="ksv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="ksv-speed-range"
            />
            <span className="ksv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="ksv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="ksv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ksv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="ksv-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--border)" />
            </marker>
            <marker id="ksv-arr-acc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker id="ksv-arr-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" />
            </marker>
          </defs>

          <text x={20} y={22} className="ksv-row-label">
            {current.transposed ? 'transposed graph G^T (edges flipped)' : 'graph G — directed'}
          </text>

          {EDGES.map((e, ei) => {
            const a = NODES[e.u];
            const b = NODES[e.v];
            // If transposed, flip direction visually
            const from = current.transposed ? b : a;
            const to = current.transposed ? a : b;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / len;
            const uy = dy / len;
            const hasReverse = EDGES.some((o, oi) => oi !== ei && o.u === e.v && o.v === e.u);
            const offset = hasReverse ? 8 : 0;
            const px = -uy * offset;
            const py = ux * offset;
            const x1 = from.x + ux * R + px;
            const y1 = from.y + uy * R + py;
            const x2 = to.x - ux * (R + 4) + px;
            const y2 = to.y - uy * (R + 4) + py;

            const isActive = ei === current.activeEdge;
            // Both endpoints in same SCC?
            const su = current.sccColors[e.u];
            const sv = current.sccColors[e.v];
            const inSameScc = su !== undefined && su === sv;

            let cls = 'ksv-edge';
            let marker = 'url(#ksv-arr)';
            if (isActive) {
              cls = 'ksv-edge ksv-edge-active';
              marker = 'url(#ksv-arr-acc)';
            } else if (inSameScc) {
              cls = 'ksv-edge ksv-edge-scc';
              marker = 'url(#ksv-arr-dim)';
            }

            return (
              <line
                key={`edge-${ei}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={cls}
                markerEnd={marker}
              />
            );
          })}

          {NODES.map((n) => {
            const isCurrent = current.currentNode === n.id;
            const isVisited = current.visited.has(n.id);
            const sccId = current.sccColors[n.id];
            const sccColor = sccId !== undefined ? SCC_PALETTE[sccId % SCC_PALETTE.length] : null;

            return (
              <g key={`node-${n.id}`}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={R}
                  className="ksv-node-circle"
                  fill={
                    sccColor
                      ? `color-mix(in srgb, ${sccColor} 22%, var(--surface))`
                      : isCurrent
                      ? 'rgba(var(--accent-rgb), 0.28)'
                      : isVisited
                      ? 'rgba(var(--accent-rgb), 0.1)'
                      : 'var(--surface)'
                  }
                  stroke={sccColor || (isCurrent ? 'var(--accent)' : isVisited ? 'var(--accent)' : 'var(--border)')}
                  strokeWidth={sccColor || isCurrent ? 2.5 : 1.4}
                />
                <text x={n.x} y={n.y + 1} className="ksv-node-label">{n.label}</text>
              </g>
            );
          })}
        </svg>

        <div className="ksv-side">
          <div className="ksv-stack">
            <span className="ksv-stack-title">finish stack — top = last finished</span>
            <div className="ksv-stack-body">
              {current.finishStack.length === 0 ? (
                <div className="ksv-stack-empty">empty</div>
              ) : (
                [...current.finishStack].reverse().map((nid, i) => (
                  <div
                    key={`stk-${i}`}
                    className={`ksv-stack-cell${i === 0 ? ' ksv-stack-top' : ''}`}
                  >
                    {NODES[nid].label}
                    {i === 0 && <span className="ksv-stack-top-tag">top</span>}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="ksv-sccs">
            <span className="ksv-sccs-title">SCCs found · {current.sccCount}</span>
            <div className="ksv-sccs-body">
              {current.sccs.length === 0 ? (
                <div className="ksv-sccs-empty">none yet</div>
              ) : (
                current.sccs.map((group, i) => (
                  <div
                    key={`scc-${i}`}
                    className="ksv-scc-row"
                    style={{ borderLeftColor: SCC_PALETTE[i % SCC_PALETTE.length] }}
                  >
                    <span className="ksv-scc-idx">#{i + 1}</span>
                    <span className="ksv-scc-members">
                      {group.map((nid) => NODES[nid].label).join(', ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="ksv-metrics">
        <div className="ksv-metric">
          <span className="ksv-metric-label">phase</span>
          <span className="ksv-metric-value">{current.phase}</span>
        </div>
        <div className="ksv-metric">
          <span className="ksv-metric-label">step kind</span>
          <span className="ksv-metric-value">{current.kind}</span>
        </div>
        <div className="ksv-metric">
          <span className="ksv-metric-label">SCCs found</span>
          <span className="ksv-metric-value">{current.sccCount}</span>
        </div>
        <div className="ksv-metric ksv-metric-dim">
          <span className="ksv-metric-label">stack size</span>
          <span className="ksv-metric-value ksv-metric-dimval">{current.finishStack.length}</span>
        </div>
      </div>

      <div className="ksv-arith">
        <span className="ksv-arith-label">trace</span>
        <span className="ksv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
