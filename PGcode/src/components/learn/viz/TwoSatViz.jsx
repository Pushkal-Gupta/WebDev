import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './TwoSatViz.css';

// 2-SAT via implication graph + SCC (Tarjan).
// Literal encoding: variable i (0-based) -> true literal xi = node 2i, false literal ~xi = node 2i+1.
// neg(node) = node ^ 1. Clause (a OR b) adds edges ~a -> b and ~b -> a.
// SAT iff no variable has xi and ~xi in the same SCC.
// Assignment: xi = true iff comp(xi) < comp(~xi) in Tarjan's (reverse-topological) numbering.

const NUM_VARS = 3;
// (x1 OR ~x2) (x2 OR x3) (~x1 OR ~x3) (~x1 OR x2)
const CLAUSES = [
  [0, 3],
  [2, 4],
  [1, 5],
  [1, 2],
];

function litName(node) {
  const v = (node >> 1) + 1;
  return node % 2 === 0 ? `x${v}` : `~x${v}`;
}

// Layout: true literals on the left column, their negations on the right column,
// one row per variable. Keeps each xi / ~xi pair on the same horizontal line.
function buildGraph() {
  const nodes = [];
  const colL = 150;
  const colR = 470;
  const top = 70;
  const gap = 88;
  for (let i = 0; i < NUM_VARS; i++) {
    nodes.push({ id: 2 * i, x: colL, y: top + i * gap, label: litName(2 * i) });
    nodes.push({ id: 2 * i + 1, x: colR, y: top + i * gap, label: litName(2 * i + 1) });
  }
  // Edges are added incrementally during the build phase (one clause = two edges).
  const edges = [];
  let eid = 0;
  CLAUSES.forEach(([a, b], ci) => {
    edges.push({ id: eid++, u: a ^ 1, v: b, clause: ci });
    edges.push({ id: eid++, u: b ^ 1, v: a, clause: ci });
  });
  return { nodes, edges };
}

function buildFrames(graph) {
  const { nodes, edges } = graph;
  const N = nodes.length;
  const frames = [];

  // running implication-graph state revealed clause-by-clause.
  const builtEdges = [];
  const compOf = new Array(N).fill(-1);
  const onStack = new Array(N).fill(false);
  const stack = [];

  const snap = (extra) => ({
    builtEdges: [...builtEdges],
    compOf: [...compOf],
    onStack: [...onStack],
    stack: [...stack],
    activeNodes: [],
    activeEdges: [],
    compCount: extra.compCount != null ? extra.compCount : 0,
    sat: null,
    checkVar: -1,
    assign: null,
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Formula: ${CLAUSES.map(([a, b]) => `(${litName(a)} OR ${litName(b)})`).join(' AND ')}. Build the implication graph clause by clause.`,
  }));

  // Phase 1: reveal edges per clause.
  CLAUSES.forEach(([a, b], ci) => {
    const e1 = edges.find((e) => e.clause === ci && e.u === (a ^ 1) && e.v === b);
    const e2 = edges.find((e) => e.clause === ci && e.u === (b ^ 1) && e.v === a);
    builtEdges.push(e1.id, e2.id);
    frames.push(snap({
      phase: 'build',
      activeEdges: [e1.id, e2.id],
      activeNodes: [a ^ 1, b, b ^ 1, a],
      note: `Clause (${litName(a)} OR ${litName(b)}): add ${litName(a ^ 1)} -> ${litName(b)} and ${litName(b ^ 1)} -> ${litName(a)}.`,
    }));
  });

  frames.push(snap({
    phase: 'built',
    note: `Implication graph complete: ${edges.length} directed edges. Now find strongly connected components with Tarjan's DFS.`,
  }));

  // Phase 2: Tarjan SCC over the full implication graph.
  const adj = Array.from({ length: N }, () => []);
  for (const e of edges) adj[e.u].push({ to: e.v, eid: e.id });

  const disc = new Array(N).fill(-1);
  const low = new Array(N).fill(-1);
  let timer = 0;
  let compCount = 0;

  const dfs = (u) => {
    disc[u] = low[u] = timer++;
    stack.push(u);
    onStack[u] = true;
    frames.push(snap({
      phase: 'scc',
      activeNodes: [u],
      compCount,
      note: `Discover ${litName(u)} (disc=low=${disc[u]}); push onto the DFS stack.`,
    }));
    for (const { to: v, eid } of adj[u]) {
      if (disc[v] === -1) {
        dfs(v);
        low[u] = Math.min(low[u], low[v]);
      } else if (onStack[v]) {
        low[u] = Math.min(low[u], disc[v]);
        frames.push(snap({
          phase: 'scc',
          activeNodes: [u, v],
          activeEdges: [eid],
          compCount,
          note: `Back edge ${litName(u)} -> ${litName(v)}: low[${litName(u)}] = ${low[u]}.`,
        }));
      }
    }
    if (low[u] === disc[u]) {
      const members = [];
      let w;
      do {
        w = stack.pop();
        onStack[w] = false;
        compOf[w] = compCount;
        members.push(w);
      } while (w !== u);
      compCount++;
      frames.push(snap({
        phase: 'scc',
        activeNodes: members,
        compCount,
        note: `${litName(u)} roots SCC #${compCount - 1} = {${members.map(litName).join(', ')}}.`,
      }));
    }
  };

  for (let i = 0; i < N; i++) if (disc[i] === -1) dfs(i);

  frames.push(snap({
    phase: 'colored',
    compCount,
    note: `${compCount} SCCs found. A variable is forced into a contradiction only if xi and ~xi land in the SAME component.`,
  }));

  // Phase 3: check each variable's two literals.
  let sat = true;
  for (let i = 0; i < NUM_VARS; i++) {
    const same = compOf[2 * i] === compOf[2 * i + 1];
    if (same) sat = false;
    frames.push(snap({
      phase: 'check',
      checkVar: i,
      activeNodes: [2 * i, 2 * i + 1],
      compCount,
      sat: same ? false : null,
      note: same
        ? `x${i + 1} and ~x${i + 1} share SCC #${compOf[2 * i]} -> UNSATISFIABLE: the formula forces x${i + 1} to be both true and false.`
        : `x${i + 1} in SCC #${compOf[2 * i]}, ~x${i + 1} in SCC #${compOf[2 * i + 1]} -> different components, no contradiction.`,
    }));
    if (same) break;
  }

  // Phase 4: derive the assignment (only if satisfiable).
  if (sat) {
    const assign = new Array(NUM_VARS).fill(false);
    for (let i = 0; i < NUM_VARS; i++) {
      // Tarjan numbers SCCs in reverse topological order: xi = true iff comp(xi) < comp(~xi).
      assign[i] = compOf[2 * i] < compOf[2 * i + 1];
      frames.push(snap({
        phase: 'assign',
        checkVar: i,
        activeNodes: [2 * i, 2 * i + 1],
        compCount,
        sat: true,
        assign: assign.slice(),
        note: `comp(x${i + 1})=${compOf[2 * i]} ${assign[i] ? '<' : '>'} comp(~x${i + 1})=${compOf[2 * i + 1]} -> set x${i + 1} = ${assign[i] ? 'true' : 'false'}.`,
      }));
    }
    frames.push(snap({
      phase: 'done',
      compCount,
      sat: true,
      assign: assign.slice(),
      note: `SATISFIABLE. Assignment: ${assign.map((b, i) => `x${i + 1}=${b ? 'T' : 'F'}`).join(', ')} satisfies every clause.`,
    }));
  } else {
    frames.push(snap({
      phase: 'done',
      compCount,
      sat: false,
      note: 'UNSATISFIABLE: some variable and its negation are mutually reachable, so no consistent assignment exists.',
    }));
  }

  return frames;
}

const COMP_COLORS = ['var(--accent)', 'var(--hue-mint)', 'var(--hue-violet)', 'var(--hue-pink)', 'var(--hue-sky)', 'var(--medium)'];

export default function TwoSatViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { frames, graph } = useMemo(() => {
    const g = buildGraph();
    return { frames: buildFrames(g), graph: g };
  }, []);

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

  const W = 940;
  const H = 360;
  const panelX = 620;
  const panelW = W - panelX - 20;

  const compColor = (c) => (c < 0 ? null : COMP_COLORS[c % COMP_COLORS.length]);
  const builtSet = new Set(current.builtEdges);
  const activeEdgeSet = new Set(current.activeEdges);
  const activeNodeSet = new Set(current.activeNodes);

  return (
    <div className="twv">
      <div className="twv-head">
        <h3 className="twv-title">2-SAT — implication graph + strongly connected components</h3>
        <p className="twv-sub">
          Each clause (a OR b) becomes two implications: ~a -&gt; b and ~b -&gt; a. The formula is satisfiable iff
          no variable and its negation land in the same SCC.
        </p>
      </div>

      <div className="twv-controls">
        <div className="twv-actions">
          <div className="twv-buttons">
            <button
              type="button"
              className="twv-btn twv-btn-primary"
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
              className="twv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="twv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="twv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="twv-speed">
            <span className="twv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="twv-speed-range"
            />
            <span className="twv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="twv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="twv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="twv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="twv-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
            <marker id="twv-arrow-active" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          <rect x={20} y={20} width={panelX - 44} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={40} className="twv-row-label">implication graph</text>

          {graph.edges.map((e) => {
            if (!builtSet.has(e.id)) return null;
            const a = graph.nodes.find((nd) => nd.id === e.u);
            const b = graph.nodes.find((nd) => nd.id === e.v);
            const isActive = activeEdgeSet.has(e.id);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const r = 24;
            // curve self/parallel edges slightly so reverse pairs don't overlap.
            const nx = -dy / len;
            const ny = dx / len;
            const bend = 16;
            const mx = (a.x + b.x) / 2 + nx * bend;
            const my = (a.y + b.y) / 2 + ny * bend;
            const ax = a.x + (dx / len) * r;
            const ay = a.y + (dy / len) * r;
            const bx = b.x - (dx / len) * (r + 4);
            const by = b.y - (dy / len) * (r + 4);
            const stroke = isActive ? 'var(--hue-pink)' : 'var(--text-dim)';
            return (
              <path
                key={`e-${e.id}`}
                d={`M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`}
                fill="none"
                stroke={stroke}
                strokeWidth={isActive ? 2.6 : 1.4}
                opacity={isActive ? 1 : 0.5}
                markerEnd={`url(#${isActive ? 'twv-arrow-active' : 'twv-arrow'})`}
              />
            );
          })}

          {graph.nodes.map((nd) => {
            const isActive = activeNodeSet.has(nd.id);
            const inStack = current.onStack[nd.id];
            const comp = current.compOf[nd.id];
            const settled = compColor(comp);
            const fill = isActive ? 'var(--hue-pink)'
              : settled ? settled
              : inStack ? 'rgba(var(--accent-rgb), 0.22)'
              : 'var(--bg)';
            const stroke = isActive ? 'var(--hue-pink)'
              : settled ? settled
              : inStack ? 'var(--accent)'
              : 'var(--border)';
            const labelFill = (settled || isActive) ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${nd.id}`}>
                <circle cx={nd.x} cy={nd.y} r={24} fill={fill} stroke={stroke} strokeWidth={isActive ? 3 : 2} />
                <text x={nd.x} y={nd.y + 5} className="twv-node-label" style={{ fill: labelFill }}>{nd.label}</text>
                {comp >= 0 && (
                  <text x={nd.x} y={nd.y - 32} className="twv-node-meta" style={{ fill: settled }}>scc {comp}</text>
                )}
              </g>
            );
          })}

          {/* DFS stack along the bottom */}
          <text x={32} y={H - 58} className="twv-row-label">dfs stack (top -&gt; right)</text>
          {current.stack.map((sid, i) => (
            <g key={`st-${sid}`}>
              <rect x={32 + i * 58} y={H - 46} width={52} height={26} rx={5} fill="rgba(var(--accent-rgb), 0.18)" stroke="var(--accent)" strokeWidth={1.5} />
              <text x={32 + i * 58 + 26} y={H - 28} className="twv-stack-text">{litName(sid)}</text>
            </g>
          ))}
          {current.stack.length === 0 && (
            <text x={32} y={H - 28} className="twv-empty">empty</text>
          )}

          {/* variable verdict panel (right) */}
          <rect x={panelX - 8} y={20} width={panelW + 16} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={panelX + 4} y={40} className="twv-row-label">per-variable check</text>
          {Array.from({ length: NUM_VARS }, (_, i) => {
            const y = 56 + i * 52;
            const cT = current.compOf[2 * i];
            const cF = current.compOf[2 * i + 1];
            const checking = current.checkVar === i;
            const conflict = cT >= 0 && cF >= 0 && cT === cF;
            const assigned = current.assign ? current.assign[i] : null;
            return (
              <g key={`v-${i}`}>
                <rect
                  x={panelX + 4} y={y} width={panelW} height={44}
                  fill={checking ? 'rgba(var(--accent-rgb), 0.16)' : 'var(--bg)'}
                  stroke={conflict ? 'var(--hard)' : checking ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={checking || conflict ? 2 : 1}
                  rx={5}
                />
                <text x={panelX + 14} y={y + 18} className="twv-var-name">x{i + 1}</text>
                <text x={panelX + 14} y={y + 35} className="twv-var-meta">
                  scc(x{i + 1})={cT < 0 ? '—' : cT} · scc(~x{i + 1})={cF < 0 ? '—' : cF}
                </text>
                {assigned != null && (
                  <text
                    x={panelX + panelW - 12} y={y + 27}
                    className="twv-var-assign"
                    style={{ fill: assigned ? 'var(--easy)' : 'var(--medium)' }}
                  >
                    {assigned ? 'TRUE' : 'FALSE'}
                  </text>
                )}
                {assigned == null && conflict && (
                  <text x={panelX + panelW - 12} y={y + 27} className="twv-var-assign" style={{ fill: 'var(--hard)' }}>
                    SAME
                  </text>
                )}
              </g>
            );
          })}
          {current.sat != null && (
            <g>
              <rect
                x={panelX + 4} y={56 + NUM_VARS * 52 + 8} width={panelW} height={36}
                fill={current.sat ? 'rgba(var(--accent-rgb), 0.16)' : 'var(--surface)'}
                stroke={current.sat ? 'var(--easy)' : 'var(--hard)'}
                strokeWidth={2}
                rx={5}
              />
              <text
                x={panelX + 4 + panelW / 2} y={56 + NUM_VARS * 52 + 31}
                className="twv-verdict"
                style={{ fill: current.sat ? 'var(--easy)' : 'var(--hard)' }}
              >
                {current.sat ? 'SATISFIABLE' : 'UNSATISFIABLE'}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="twv-metrics">
        <div className="twv-metric">
          <span className="twv-metric-label">phase</span>
          <span className="twv-metric-value">{current.phase}</span>
        </div>
        <div className="twv-metric">
          <span className="twv-metric-label">SCCs</span>
          <span className="twv-metric-value">{current.compCount}</span>
        </div>
        <div className="twv-metric">
          <span className="twv-metric-label">satisfiable?</span>
          <span
            className="twv-metric-value"
            style={{ color: current.sat == null ? 'var(--text-dim)' : current.sat ? 'var(--easy)' : 'var(--hard)' }}
          >
            {current.sat == null ? '—' : current.sat ? 'yes' : 'no'}
          </span>
        </div>
        <div className="twv-metric twv-metric-dim">
          <span className="twv-metric-label">assignment</span>
          <span className="twv-metric-value twv-metric-dimval">
            {current.assign
              ? current.assign.map((b, i) => `x${i + 1}=${b ? 'T' : 'F'}`).join('  ')
              : '—'}
          </span>
        </div>
      </div>

      <div className="twv-arith">
        <span className="twv-arith-label">trace</span>
        <span className="twv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
