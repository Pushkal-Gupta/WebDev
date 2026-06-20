import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './EulerianViz.css';

// Undirected connected graph: two triangles {0,1,2} and {2,3,4} sharing vertex 2.
// Every vertex has even degree (v2 has degree 4, the rest degree 2) -> Euler circuit.
// The first trail from v0 (0-1-2-0) gets stuck after closing the left triangle,
// forcing a splice of the sub-circuit 2-3-4-2 from vertex 2 — the heart of Hierholzer.
function buildGraph() {
  const nodes = [
    { id: 0, x: 120, y: 90 },
    { id: 1, x: 120, y: 250 },
    { id: 2, x: 320, y: 170 },
    { id: 3, x: 520, y: 90 },
    { id: 4, x: 520, y: 250 },
  ];
  const edges = [
    { u: 0, v: 1 },
    { u: 1, v: 2 },
    { u: 2, v: 0 },
    { u: 2, v: 3 },
    { u: 3, v: 4 },
    { u: 4, v: 2 },
  ];
  edges.forEach((e, i) => { e.id = i; });
  return { nodes, edges };
}

function buildFrames(graph) {
  const { nodes, edges } = graph;
  const n = nodes.length;

  const deg = new Array(n).fill(0);
  for (const e of edges) { deg[e.u] += 1; deg[e.v] += 1; }
  const odd = [];
  for (let v = 0; v < n; v += 1) if (deg[v] % 2 === 1) odd.push(v);

  let verdict;
  let startV;
  if (odd.length === 0) { verdict = 'circuit'; startV = 0; }
  else if (odd.length === 2) { verdict = 'path'; startV = odd[0]; }
  else { verdict = 'none'; startV = -1; }

  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) {
    adj[e.u].push({ to: e.v, eid: e.id });
    adj[e.v].push({ to: e.u, eid: e.id });
  }
  const used = new Array(edges.length).fill(false);
  const frames = [];

  const snap = (extra) => ({
    phase: '',
    deg: [...deg],
    odd: [...odd],
    verdict,
    startV,
    used: [...used],
    trail: [],
    circuit: [],
    activeEdge: -1,
    activeNode: -1,
    spliceIdx: -1,
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'degree',
    note: `Count the degree of every vertex (edges touching it): ${deg.map((d, i) => `v${i}=${d}`).join(', ')}.`,
  }));

  if (verdict === 'circuit') {
    frames.push(snap({
      phase: 'verdict',
      note: `0 odd-degree vertices -> all degrees even -> an Euler CIRCUIT exists. Start anywhere; we start at v${startV}.`,
    }));
  } else if (verdict === 'path') {
    frames.push(snap({
      phase: 'verdict',
      note: `Exactly 2 odd-degree vertices {${odd.join(', ')}} -> an Euler PATH exists. It must start at an odd vertex (v${startV}).`,
    }));
  } else {
    frames.push(snap({
      phase: 'verdict',
      note: `${odd.length} odd-degree vertices -> neither 0 nor 2 -> NO Eulerian path or circuit exists.`,
    }));
    return { frames, verdict, finalCircuit: [], used };
  }

  let circuit = null;

  function followTrail(start, announce) {
    const trail = [start];
    let v = start;
    frames.push(snap({
      phase: 'walk',
      trail: [...trail],
      circuit: circuit ? [...circuit] : [],
      activeNode: v,
      note: `${announce} Begin walking from v${start}, following any unused edge.`,
    }));
    for (;;) {
      const opt = adj[v].find((x) => !used[x.eid]);
      if (!opt) {
        frames.push(snap({
          phase: 'stuck',
          trail: [...trail],
          circuit: circuit ? [...circuit] : [],
          activeNode: v,
          note: `Stuck at v${v}: no unused edge leaves it. Trail so far: ${trail.join(' -> ')}.`,
        }));
        break;
      }
      used[opt.eid] = true;
      v = opt.to;
      trail.push(v);
      frames.push(snap({
        phase: 'walk',
        trail: [...trail],
        circuit: circuit ? [...circuit] : [],
        activeNode: v,
        activeEdge: opt.eid,
        note: `Cross the unused edge to v${v} and mark it used. Trail: ${trail.join(' -> ')}.`,
      }));
    }
    return trail;
  }

  const firstTrail = followTrail(startV, 'No edges used yet.');
  circuit = firstTrail;
  frames.push(snap({
    phase: 'trail',
    circuit: [...circuit],
    note: `Closed trail formed: ${circuit.join(' -> ')}. Now scan it for a vertex that still has unused edges.`,
  }));

  for (;;) {
    const idx = circuit.findIndex((v) => adj[v].some((x) => !used[x.eid]));
    if (idx === -1) break;
    frames.push(snap({
      phase: 'splice',
      circuit: [...circuit],
      spliceIdx: idx,
      activeNode: circuit[idx],
      note: `v${circuit[idx]} (position ${idx} on the trail) still has unused edges -> splice a sub-circuit in here.`,
    }));
    const sub = followTrail(circuit[idx], `Splice from v${circuit[idx]}.`);
    circuit = [...circuit.slice(0, idx), ...sub, ...circuit.slice(idx + 1)];
    frames.push(snap({
      phase: 'splice-done',
      circuit: [...circuit],
      spliceIdx: idx,
      note: `Sub-circuit spliced in. Combined trail: ${circuit.join(' -> ')}.`,
    }));
  }

  frames.push(snap({
    phase: 'done',
    circuit: [...circuit],
    note: `Done. Euler ${verdict === 'circuit' ? 'circuit' : 'path'}: ${circuit.join(' -> ')} — every one of the ${edges.length} edges used exactly once.`,
  }));

  return { frames, verdict, finalCircuit: circuit, used };
}

const VERDICT_LABEL = {
  circuit: 'Euler circuit',
  path: 'Euler path',
  none: 'none',
};

export default function EulerianViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { frames, graph } = useMemo(() => {
    const g = buildGraph();
    return { frames: buildFrames(g).frames, graph: g };
  }, []);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(950 / speed);

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
  const H = 380;
  const tableX = 660;
  const tableW = W - tableX - 24;
  const rowH = 30;

  // Set of edge keys that lie on the current trail/circuit, in traversal order.
  const trailSeq = current.circuit.length ? current.circuit : current.trail;
  const trailEdgeKeys = useMemo(() => {
    const s = new Set();
    for (let i = 0; i < trailSeq.length - 1; i += 1) {
      const a = trailSeq[i];
      const b = trailSeq[i + 1];
      s.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
    }
    return s;
  }, [trailSeq]);

  const usedCount = current.used.filter(Boolean).length;
  const spliceVertex = current.spliceIdx >= 0 && current.circuit.length
    ? current.circuit[current.spliceIdx]
    : -1;

  return (
    <div className="elv">
      <div className="elv-head">
        <h3 className="elv-title">Eulerian path / circuit — Hierholzer&apos;s algorithm</h3>
        <p className="elv-sub">
          First the parity test: all degrees even -&gt; an Euler circuit exists; exactly two odd vertices -&gt; an
          Euler path (start at an odd one). Then Hierholzer walks unused edges into a trail, and splices in
          sub-circuits wherever a vertex still has edges left — until every edge is used exactly once.
        </p>
      </div>

      <div className="elv-controls">
        <div className="elv-actions">
          <div className="elv-buttons">
            <button
              type="button"
              className="elv-btn elv-btn-primary"
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
              className="elv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="elv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="elv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="elv-speed">
            <span className="elv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="elv-speed-range"
            />
            <span className="elv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="elv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="elv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="elv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={tableX - 44} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={40} className="elv-row-label">undirected graph</text>

          {graph.edges.map((e) => {
            const a = graph.nodes[e.u];
            const b = graph.nodes[e.v];
            const key = `${Math.min(e.u, e.v)}-${Math.max(e.u, e.v)}`;
            const isUsed = current.used[e.id];
            const isActive = e.id === current.activeEdge;
            const onTrail = trailEdgeKeys.has(key);
            const stroke = isActive ? 'var(--hue-pink)'
              : onTrail ? 'var(--accent)'
              : isUsed ? 'var(--hue-mint)'
              : 'var(--text-dim)';
            const sw = isActive ? 4 : onTrail ? 3.2 : isUsed ? 2.4 : 1.4;
            const op = isActive || onTrail || isUsed ? 1 : 0.5;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <g key={`e-${e.id}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={sw} opacity={op} />
                <circle cx={mx} cy={my} r={9} fill={isUsed ? 'var(--hue-mint)' : 'var(--bg)'} stroke={stroke} strokeWidth={1.4} opacity={op} />
                <text x={mx} y={my + 3} className="elv-edge-label" style={{ fill: isUsed ? 'var(--bg)' : 'var(--text-dim)' }}>
                  e{e.id}
                </text>
              </g>
            );
          })}

          {graph.nodes.map((nd) => {
            const isActive = nd.id === current.activeNode;
            const isSplice = nd.id === spliceVertex;
            const isStart = nd.id === current.startV && current.verdict !== 'none';
            const isOdd = current.deg[nd.id] % 2 === 1;
            const fill = isActive ? 'var(--hue-pink)'
              : isSplice ? 'var(--medium)'
              : isOdd ? 'var(--surface)'
              : 'var(--bg)';
            const stroke = isActive ? 'var(--hue-pink)'
              : isSplice ? 'var(--medium)'
              : isOdd ? 'var(--hard)'
              : 'var(--accent)';
            const labelDark = isActive || isSplice;
            return (
              <g key={`n-${nd.id}`}>
                <circle cx={nd.x} cy={nd.y} r={22} fill={fill} stroke={stroke} strokeWidth={isActive || isSplice ? 3 : 2} />
                <text x={nd.x} y={nd.y + 5} className="elv-node-label" style={{ fill: labelDark ? 'var(--bg)' : 'var(--text-main)' }}>
                  {nd.id}
                </text>
                <text x={nd.x} y={nd.y - 30} className="elv-node-meta">
                  deg {current.deg[nd.id]} {isOdd ? 'odd' : 'even'}
                </text>
                {isStart && (
                  <text x={nd.x} y={nd.y + 40} className="elv-node-start">start</text>
                )}
              </g>
            );
          })}

          {/* state panel */}
          <rect x={tableX - 12} y={20} width={tableW + 24} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={tableX} y={40} className="elv-row-label">degree parity</text>
          {graph.nodes.map((nd, i) => {
            const y = 54 + i * rowH;
            const isOdd = current.deg[nd.id] % 2 === 1;
            const active = nd.id === current.activeNode;
            return (
              <g key={`row-${nd.id}`}>
                <rect
                  x={tableX} y={y} width={tableW} height={rowH - 6}
                  fill={active ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={active ? 'var(--accent)' : 'var(--border)'}
                  rx={4}
                />
                <text x={tableX + 8} y={y + (rowH - 6) / 2 + 4} className="elv-row-text">v{nd.id}</text>
                <text x={tableX + 44} y={y + (rowH - 6) / 2 + 4} className="elv-row-meta">
                  deg {current.deg[nd.id]}
                </text>
                <rect
                  x={tableX + tableW - 52} y={y + 3} width={44} height={rowH - 12} rx={4}
                  fill={isOdd ? 'var(--hard)' : 'var(--hue-mint)'}
                />
                <text x={tableX + tableW - 30} y={y + (rowH - 6) / 2 + 4} className="elv-parity-text">
                  {isOdd ? 'odd' : 'even'}
                </text>
              </g>
            );
          })}

          <line
            x1={tableX} y1={54 + graph.nodes.length * rowH + 6}
            x2={tableX + tableW} y2={54 + graph.nodes.length * rowH + 6}
            stroke="var(--border)" strokeWidth={1}
          />
          <text x={tableX} y={54 + graph.nodes.length * rowH + 28} className="elv-row-label">exists?</text>
          <text x={tableX} y={54 + graph.nodes.length * rowH + 54} className="elv-readout-big">
            {VERDICT_LABEL[current.verdict]}
          </text>
        </svg>
      </div>

      <div className="elv-metrics">
        <div className="elv-metric">
          <span className="elv-metric-label">odd-degree vertices</span>
          <span className="elv-metric-value">
            {current.odd.length === 0 ? 'none' : current.odd.map((v) => `v${v}`).join(', ')}
          </span>
        </div>
        <div className="elv-metric">
          <span className="elv-metric-label">exists?</span>
          <span className="elv-metric-value">{VERDICT_LABEL[current.verdict]}</span>
        </div>
        <div className="elv-metric">
          <span className="elv-metric-label">edges used / total</span>
          <span className="elv-metric-value">{usedCount} / {graph.edges.length}</span>
        </div>
        <div className="elv-metric elv-metric-dim">
          <span className="elv-metric-label">current trail</span>
          <span className="elv-metric-value elv-metric-dimval">
            {trailSeq.length ? trailSeq.join(' -> ') : '—'}
          </span>
        </div>
      </div>

      <div className="elv-arith">
        <span className="elv-arith-label">trace</span>
        <span className="elv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
