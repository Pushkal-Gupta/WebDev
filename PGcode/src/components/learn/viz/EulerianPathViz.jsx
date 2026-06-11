import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './EulerianPathViz.css';

const NODES = [
  { id: 0, label: 'A', x: 130, y: 90 },
  { id: 1, label: 'B', x: 340, y: 60 },
  { id: 2, label: 'C', x: 550, y: 90 },
  { id: 3, label: 'D', x: 130, y: 290 },
  { id: 4, label: 'E', x: 340, y: 320 },
  { id: 5, label: 'F', x: 550, y: 290 },
];

// Multigraph with Eulerian circuit (all degrees even).
// Edges:
const EDGES_CIRCUIT = [
  { u: 0, v: 1 }, // A-B
  { u: 1, v: 2 }, // B-C
  { u: 2, v: 5 }, // C-F
  { u: 5, v: 4 }, // F-E
  { u: 4, v: 3 }, // E-D
  { u: 3, v: 0 }, // D-A
  { u: 1, v: 4 }, // B-E
  { u: 1, v: 3 }, // B-D
  { u: 2, v: 4 }, // C-E
  { u: 0, v: 4 }, // A-E
];

// Eulerian-path-only (not circuit): remove one edge so exactly two vertices have odd degree.
// Removing A-E makes degrees: A=2, B=4, C=3, D=3, E=3, F=2 → 3 odd. Need exactly 2.
// Try removing B-D: A=3, B=3, C=3, D=2, E=4, F=2 → 3 odd. Hmm.
// Let's check circuit degrees: A:3(B,D,E)=3 odd. Bad — recompute circuit edges so all even.
// EDGES_CIRCUIT degrees:
// A: A-B, D-A, A-E = 3 (odd) — not circuit. Fix: add A-D copy or remove.
// Let me redesign carefully.
// We need every vertex's degree even.
// Use this set (10 edges, all even degrees):
const EDGES_CIRCUIT_FIXED = [
  { u: 0, v: 1 }, // A-B  : A=1,B=1
  { u: 1, v: 2 }, // B-C  : B=2,C=1
  { u: 2, v: 5 }, // C-F  : C=2,F=1
  { u: 5, v: 4 }, // F-E  : F=2,E=1
  { u: 4, v: 3 }, // E-D  : E=2,D=1
  { u: 3, v: 0 }, // D-A  : D=2,A=2
  { u: 1, v: 4 }, // B-E  : B=3,E=3
  { u: 0, v: 4 }, // A-E  : A=3,E=4
  { u: 1, v: 3 }, // B-D  : B=4,D=3
  { u: 0, v: 2 }, // A-C  : A=4,C=3
];
// Final degrees: A=4,B=4,C=3,D=3,E=4,F=2. C,D odd → Eulerian PATH (not circuit).
// To make true circuit, we add C-D too. Let's just include it and drop A-C:
const EDGES_CIRCUIT_FINAL = [
  { u: 0, v: 1 }, // A-B
  { u: 1, v: 2 }, // B-C
  { u: 2, v: 5 }, // C-F
  { u: 5, v: 4 }, // F-E
  { u: 4, v: 3 }, // E-D
  { u: 3, v: 0 }, // D-A
  { u: 1, v: 4 }, // B-E
  { u: 0, v: 4 }, // A-E
  { u: 1, v: 3 }, // B-D
  { u: 2, v: 3 }, // C-D
];
// Degrees: A:{B,D,E}=3 odd → not circuit. Try yet another:
const EDGES_CIRCUIT_OK = [
  { u: 0, v: 1 }, // A-B  A=1 B=1
  { u: 0, v: 3 }, // A-D  A=2 D=1
  { u: 1, v: 2 }, // B-C  B=2 C=1
  { u: 1, v: 4 }, // B-E  B=3 E=1
  { u: 2, v: 4 }, // C-E  C=2 E=2
  { u: 2, v: 5 }, // C-F  C=3 F=1
  { u: 3, v: 4 }, // D-E  D=2 E=3
  { u: 3, v: 1 }, // D-B  D=3 B=4
  { u: 4, v: 5 }, // E-F  E=4 F=2
  { u: 0, v: 4 }, // A-E  A=3 E=5
];
// A=3 odd, B=4, C=3, D=3, E=5, F=2. Not circuit.
// Algorithmic approach: any connected graph with all even degrees works. 6 vertices, all degree-even, sum even.
// Try: A-B,B-C,C-D,D-E,E-F,F-A (the 6-cycle: all deg 2) plus 4 chords that preserve parity.
// Cycle: A-B,B-C,C-D,D-E,E-F,F-A (6 edges, all deg 2).
// Add A-C (A=3,C=3), then to fix add D-F (D=3,F=3), then add A-D (A=4,D=4), then add C-F (C=4,F=4).
// Total 10 edges, degrees: A=4,B=2,C=4,D=4,E=2,F=4. All even. Good.
const EDGES_CIRCUIT_USE = [
  { u: 0, v: 1 }, // A-B
  { u: 1, v: 2 }, // B-C
  { u: 2, v: 3 }, // C-D
  { u: 3, v: 4 }, // D-E
  { u: 4, v: 5 }, // E-F
  { u: 5, v: 0 }, // F-A
  { u: 0, v: 2 }, // A-C
  { u: 3, v: 5 }, // D-F
  { u: 0, v: 3 }, // A-D
  { u: 2, v: 5 }, // C-F
];
// Eulerian path only: remove an edge so exactly two vertices become odd.
// Remove A-D (so A: 3, D: 3, all others unchanged). Now path from A to D exists. Good.
const EDGES_PATH_ONLY = EDGES_CIRCUIT_USE.filter((e) => !(e.u === 0 && e.v === 3));

function buildAdj(edges, V) {
  const adj = Array.from({ length: V }, () => []);
  edges.forEach((e, i) => {
    adj[e.u].push({ to: e.v, ei: i });
    adj[e.v].push({ to: e.u, ei: i });
  });
  return adj;
}

function findStartVertex(edges, V) {
  const deg = new Array(V).fill(0);
  edges.forEach((e) => {
    deg[e.u]++;
    deg[e.v]++;
  });
  const odds = [];
  for (let i = 0; i < V; i++) if (deg[i] % 2 === 1) odds.push(i);
  if (odds.length === 0) return { start: 0, hasCircuit: true };
  if (odds.length === 2) return { start: odds[0], hasCircuit: false };
  return { start: 0, hasCircuit: false };
}

function buildFrames(edges) {
  const V = NODES.length;
  const adj = buildAdj(edges, V);
  const E = edges.length;
  const used = new Array(E).fill(false);
  const { start, hasCircuit } = findStartVertex(edges, V);

  const frames = [];

  frames.push({
    kind: 'init',
    used: new Set(),
    trail: [],
    trailEdges: [],
    onTrailEdges: new Set(),
    splicedEdges: new Set(),
    stack: [start],
    currentNode: start,
    remaining: E,
    note: `Initialize. Start at ${NODES[start].label}. Hierholzer walks until stuck, then splices in side-trips from any vertex on the current trail that still has unused incident edges.`,
  });

  // Hierholzer iterative
  const stack = [start];
  const trail = [];
  const trailEdges = [];
  const pointer = new Array(V).fill(0);

  while (stack.length) {
    const u = stack[stack.length - 1];
    // advance pointer past used edges
    while (pointer[u] < adj[u].length && used[adj[u][pointer[u]].ei]) pointer[u]++;
    if (pointer[u] === adj[u].length) {
      // Dead end — pop into trail
      const popped = stack.pop();
      trail.push(popped);
      // Edge connecting popped to next stack top, if any, has already been marked.
      frames.push({
        kind: 'backtrack',
        used: new Set([...Array(E).keys()].filter((i) => used[i])),
        trail: [...trail],
        trailEdges: [...trailEdges],
        onTrailEdges: new Set([...Array(E).keys()].filter((i) => used[i])),
        splicedEdges: new Set(),
        stack: [...stack],
        currentNode: stack.length ? stack[stack.length - 1] : null,
        remaining: E - used.filter(Boolean).length,
        note: `${NODES[popped].label} has no unused edges. Add to trail (so far: ${trail.map((n) => NODES[n].label).reverse().join(' → ')}).`,
      });
      continue;
    }
    const { to, ei } = adj[u][pointer[u]];
    used[ei] = true;
    pointer[u]++;
    stack.push(to);
    trailEdges.push(ei);
    frames.push({
      kind: 'walk',
      used: new Set([...Array(E).keys()].filter((i) => used[i])),
      trail: [...trail],
      trailEdges: [...trailEdges],
      onTrailEdges: new Set([...Array(E).keys()].filter((i) => used[i])),
      splicedEdges: new Set(),
      stack: [...stack],
      currentNode: to,
      remaining: E - used.filter(Boolean).length,
      note: `Walk ${NODES[u].label}—${NODES[to].label}. Mark edge used. Stack top is now ${NODES[to].label}.`,
    });
  }

  // Final trail is `trail` reversed
  const finalTrail = [...trail].reverse();

  frames.push({
    kind: 'done',
    used: new Set([...Array(E).keys()].filter((i) => used[i])),
    trail: trail,
    trailEdges: trailEdges,
    onTrailEdges: new Set([...Array(E).keys()].filter((i) => used[i])),
    splicedEdges: new Set(),
    stack: [],
    currentNode: null,
    remaining: 0,
    note: hasCircuit
      ? `Done. Eulerian circuit: ${finalTrail.map((n) => NODES[n].label).join(' → ')}.`
      : `Done. Eulerian path: ${finalTrail.map((n) => NODES[n].label).join(' → ')}.`,
  });

  return { frames, hasCircuit };
}

export default function EulerianPathViz() {
  const [pathOnly, setPathOnly] = useState(false);
  const edges = pathOnly ? EDGES_PATH_ONLY : EDGES_CIRCUIT_USE;

  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { frames, hasCircuit } = useMemo(() => buildFrames(edges), [edges]);
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

  const togglePathOnly = () => {
    setIsRunningRaw(false);
    setStep(0);
    setPathOnly((v) => !v);
  };

  const W = 680;
  const H = 380;
  const R = 22;

  return (
    <div className="epv">
      <div className="epv-head">
        <h3 className="epv-title">Hierholzer — Eulerian trail by greedy walk + splice</h3>
        <p className="epv-sub">
          Walk forward consuming unused edges. When stuck, pop into the trail. The recorded trail, read backwards,
          is the Eulerian circuit (or path) — every edge appears exactly once.
        </p>
      </div>

      <div className="epv-controls">
        <label className="epv-toggle">
          <input type="checkbox" checked={pathOnly} onChange={togglePathOnly} />
          remove A–D edge → path-only graph (2 odd-degree vertices)
        </label>

        <div className="epv-actions">
          <div className="epv-buttons">
            <button
              type="button"
              className="epv-btn epv-btn-primary"
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
              className="epv-btn"
              onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="epv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="epv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="epv-speed">
            <span className="epv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="epv-speed-range"
            />
            <span className="epv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="epv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="epv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="epv-svg" preserveAspectRatio="xMidYMid meet">
          <text x={20} y={22} className="epv-row-label">
            {hasCircuit ? 'graph — Eulerian circuit (all degrees even)' : 'graph — Eulerian path (2 odd-degree vertices)'}
          </text>

          {edges.map((e, ei) => {
            const a = NODES[e.u];
            const b = NODES[e.v];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / len;
            const uy = dy / len;
            const x1 = a.x + ux * R;
            const y1 = a.y + uy * R;
            const x2 = b.x - ux * R;
            const y2 = b.y - uy * R;

            const isUsed = current.used.has(ei);
            const trailPos = current.trailEdges.indexOf(ei);
            const isLast = trailPos !== -1 && trailPos === current.trailEdges.length - 1;

            let cls = 'epv-edge';
            if (isLast) cls = 'epv-edge epv-edge-current';
            else if (isUsed) cls = 'epv-edge epv-edge-used';

            return (
              <line
                key={`edge-${ei}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={cls}
              />
            );
          })}

          {NODES.map((n) => {
            const isCurrent = current.currentNode === n.id;
            const isOnStack = current.stack.includes(n.id);
            return (
              <g key={`node-${n.id}`}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={R}
                  className="epv-node-circle"
                  fill={
                    isCurrent
                      ? 'rgba(var(--accent-rgb), 0.3)'
                      : isOnStack
                      ? 'rgba(var(--accent-rgb), 0.1)'
                      : 'var(--surface)'
                  }
                  stroke={isCurrent ? 'var(--accent)' : isOnStack ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isCurrent ? 2.6 : isOnStack ? 1.8 : 1.4}
                />
                <text x={n.x} y={n.y + 1} className="epv-node-label">{n.label}</text>
              </g>
            );
          })}
        </svg>

        <div className="epv-side">
          <div className="epv-stack-box">
            <span className="epv-stack-title">stack (walk so far)</span>
            <div className="epv-stack-row">
              {current.stack.length === 0 ? (
                <span className="epv-stack-empty">empty</span>
              ) : (
                current.stack.map((n, i) => (
                  <React.Fragment key={`s-${i}`}>
                    <span className={`epv-stack-chip${i === current.stack.length - 1 ? ' epv-stack-top' : ''}`}>
                      {NODES[n].label}
                    </span>
                    {i < current.stack.length - 1 && <span className="epv-stack-sep">→</span>}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
          <div className="epv-trail-box">
            <span className="epv-trail-title">recorded trail (read reversed = answer)</span>
            <div className="epv-trail-row">
              {current.trail.length === 0 ? (
                <span className="epv-stack-empty">empty</span>
              ) : (
                current.trail.map((n, i) => (
                  <React.Fragment key={`t-${i}`}>
                    <span className="epv-trail-chip">{NODES[n].label}</span>
                    {i < current.trail.length - 1 && <span className="epv-stack-sep">·</span>}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
          <div className="epv-legend">
            <span className="epv-legend-title">legend</span>
            <div className="epv-legend-row">
              <span className="epv-swatch epv-swatch-unused" /> unused edge
            </div>
            <div className="epv-legend-row">
              <span className="epv-swatch epv-swatch-used" /> on trail
            </div>
            <div className="epv-legend-row">
              <span className="epv-swatch epv-swatch-current" /> last walked
            </div>
          </div>
        </div>
      </div>

      <div className="epv-metrics">
        <div className="epv-metric">
          <span className="epv-metric-label">edges remaining</span>
          <span className="epv-metric-value">{current.remaining}</span>
        </div>
        <div className="epv-metric">
          <span className="epv-metric-label">trail length</span>
          <span className="epv-metric-value">{current.trail.length}</span>
        </div>
        <div className="epv-metric">
          <span className="epv-metric-label">stack size</span>
          <span className="epv-metric-value">{current.stack.length}</span>
        </div>
        <div className="epv-metric epv-metric-dim">
          <span className="epv-metric-label">graph type</span>
          <span className="epv-metric-value epv-metric-dimval">{hasCircuit ? 'circuit' : 'path'}</span>
        </div>
      </div>

      <div className="epv-arith">
        <span className="epv-arith-label">trace</span>
        <span className="epv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
