import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './BipartiteMatchingViz.css';

// Bipartite graph: left set L = {L0..L3}, right set R = {R0..R3}.
// Edges chosen so the augmenting-path rematch logic actually fires:
// L2 first grabs R1; later a node needs R1 and forces L2 to be rematched.
const LEFT = [0, 1, 2, 3];
const RIGHT = [0, 1, 2, 3];
const EDGES = [
  { u: 0, v: 0 },
  { u: 0, v: 1 },
  { u: 1, v: 0 },
  { u: 1, v: 2 },
  { u: 2, v: 1 },
  { u: 2, v: 3 },
  { u: 3, v: 1 },
  { u: 3, v: 2 },
];

function buildAdj() {
  const adj = LEFT.map(() => []);
  for (const e of EDGES) adj[e.u].push(e.v);
  return adj;
}

// matchR[r] = which left node currently owns right node r (-1 = free).
function buildFrames() {
  const adj = buildAdj();
  const matchR = new Array(RIGHT.length).fill(-1);
  const frames = [];

  const matchL = () => {
    const ml = new Array(LEFT.length).fill(-1);
    for (let r = 0; r < matchR.length; r += 1) if (matchR[r] >= 0) ml[matchR[r]] = r;
    return ml;
  };
  const size = () => matchR.filter((x) => x >= 0).length;

  const snap = (extra) => ({
    matchR: [...matchR],
    matchL: matchL(),
    size: size(),
    root: -1,
    activeL: -1,
    triedEdge: null,
    pathEdges: [],
    visitedR: [],
    note: '',
    augmented: false,
    ...extra,
  });

  frames.push(snap({
    note: 'Start with an empty matching. Process each left node in turn, searching for an augmenting path.',
  }));

  // DFS that emits a frame per decision. visited guards each augment attempt.
  function tryKuhn(u, root, visited, pathEdges) {
    for (const v of adj[u]) {
      if (visited[v]) continue;
      visited[v] = true;
      const owner = matchR[v];
      if (owner === -1) {
        const newPath = [...pathEdges, { u, v }];
        frames.push(snap({
          root,
          activeL: u,
          triedEdge: { u, v },
          pathEdges: newPath,
          visitedR: visited.map((b, i) => (b ? i : -1)).filter((i) => i >= 0),
          note: `Try L${u} -> R${v}. R${v} is free -> claim it. Augmenting path found; flip it.`,
        }));
        matchR[v] = u;
        return { ok: true, path: newPath };
      }
      frames.push(snap({
        root,
        activeL: u,
        triedEdge: { u, v },
        pathEdges: [...pathEdges, { u, v }],
        visitedR: visited.map((b, i) => (b ? i : -1)).filter((i) => i >= 0),
        note: `Try L${u} -> R${v}. R${v} is taken by L${owner}; recurse to rematch L${owner} elsewhere.`,
      }));
      const res = tryKuhn(owner, root, visited, [...pathEdges, { u, v }]);
      if (res.ok) {
        matchR[v] = u;
        return { ok: true, path: res.path };
      }
    }
    frames.push(snap({
      root,
      activeL: u,
      visitedR: visited.map((b, i) => (b ? i : -1)).filter((i) => i >= 0),
      note: `L${u} has no free right node and cannot rematch any owner. Back up.`,
    }));
    return { ok: false, path: [] };
  }

  for (const u of LEFT) {
    const visited = new Array(RIGHT.length).fill(false);
    frames.push(snap({
      root: u,
      activeL: u,
      note: `Augment from L${u}: reset visited[] on the right set, then DFS its edges.`,
    }));
    const res = tryKuhn(u, u, visited, []);
    if (res.ok) {
      frames.push(snap({
        root: u,
        pathEdges: res.path,
        augmented: true,
        note: `Augmented from L${u}: matching grows to size ${size()}. Bold edges show the current matching.`,
      }));
    } else {
      frames.push(snap({
        root: u,
        note: `No augmenting path from L${u}; it stays unmatched. Matching size unchanged at ${size()}.`,
      }));
    }
  }

  frames.push(snap({
    note: `Done. Every left node processed -> maximum matching has size ${size()}.`,
  }));

  return frames;
}

export default function BipartiteMatchingViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1000 / speed);

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

  // Geometry: two columns of nodes + a state panel on the right.
  const W = 940;
  const H = 360;
  const LX = 150;
  const RX = 470;
  const TOP = 70;
  const GAP = 70;
  const NR = 22;
  const panelX = 620;
  const panelW = W - panelX - 24;

  const leftPos = (u) => ({ x: LX, y: TOP + u * GAP });
  const rightPos = (v) => ({ x: RX, y: TOP + v * GAP });

  // Currently matched (matchR) edge set + the live augmenting-path edge set.
  const matchSet = useMemo(() => {
    const s = new Set();
    current.matchR.forEach((u, v) => { if (u >= 0) s.add(`${u}-${v}`); });
    return s;
  }, [current.matchR]);
  const pathSet = useMemo(() => {
    const s = new Set();
    current.pathEdges.forEach((e) => s.add(`${e.u}-${e.v}`));
    return s;
  }, [current.pathEdges]);
  const visitedRSet = useMemo(() => new Set(current.visitedR), [current.visitedR]);

  const triedKey = current.triedEdge ? `${current.triedEdge.u}-${current.triedEdge.v}` : null;

  const rowH = 30;

  return (
    <div className="bmv">
      <div className="bmv-head">
        <h3 className="bmv-title">Kuhn&apos;s algorithm — maximum bipartite matching</h3>
        <p className="bmv-sub">
          For each left node, DFS its edges looking for a free right node. If a right node is taken, recurse to
          rematch its current owner elsewhere. A successful chain is an augmenting path that grows the matching by one.
        </p>
      </div>

      <div className="bmv-controls">
        <div className="bmv-actions">
          <div className="bmv-buttons">
            <button
              type="button"
              className="bmv-btn bmv-btn-primary"
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
              className="bmv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="bmv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="bmv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="bmv-speed">
            <span className="bmv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bmv-speed-range"
            />
            <span className="bmv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="bmv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="bmv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bmv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={panelX - 44} height={H - 40} fill="var(--bg)" stroke="var(--border)" rx={6} />
          <text x={LX} y={42} className="bmv-col-label" style={{ textAnchor: 'middle' }}>left set L</text>
          <text x={RX} y={42} className="bmv-col-label" style={{ textAnchor: 'middle' }}>right set R</text>

          {EDGES.map((e) => {
            const a = leftPos(e.u);
            const b = rightPos(e.v);
            const k = `${e.u}-${e.v}`;
            const matched = matchSet.has(k);
            const onPath = pathSet.has(k);
            const tried = k === triedKey;
            const stroke = onPath ? 'var(--hue-pink)'
              : matched ? 'var(--accent)'
              : tried ? 'var(--hue-pink)'
              : 'var(--text-dim)';
            const sw = matched ? 3.2 : onPath ? 3 : tried ? 2.4 : 1.2;
            const op = matched || onPath || tried ? 1 : 0.4;
            const dash = onPath && !matched ? '6 4' : undefined;
            return (
              <line
                key={`e-${k}`}
                x1={a.x + NR} y1={a.y} x2={b.x - NR} y2={b.y}
                stroke={stroke} strokeWidth={sw} opacity={op}
                strokeDasharray={dash}
              />
            );
          })}

          {LEFT.map((u) => {
            const p = leftPos(u);
            const isRoot = u === current.root;
            const isActive = u === current.activeL;
            const isMatched = current.matchL[u] >= 0;
            const fill = isActive ? 'var(--hue-pink)'
              : isRoot ? 'rgba(var(--accent-rgb), 0.22)'
              : isMatched ? 'var(--accent)'
              : 'var(--surface)';
            const stroke = isActive ? 'var(--hue-pink)'
              : isMatched ? 'var(--accent)'
              : isRoot ? 'var(--accent)'
              : 'var(--border)';
            const labelDark = isActive || isMatched;
            return (
              <g key={`l-${u}`}>
                <circle cx={p.x} cy={p.y} r={NR} fill={fill} stroke={stroke} strokeWidth={isActive ? 3 : 2} />
                <text x={p.x} y={p.y + 4} className="bmv-node-label" style={{ fill: labelDark ? 'var(--bg)' : 'var(--text-main)' }}>L{u}</text>
                {isMatched && (
                  <text x={p.x - NR - 10} y={p.y + 4} className="bmv-node-meta" style={{ textAnchor: 'end' }}>
                    -&gt;R{current.matchL[u]}
                  </text>
                )}
              </g>
            );
          })}

          {RIGHT.map((v) => {
            const p = rightPos(v);
            const owner = current.matchR[v];
            const isMatched = owner >= 0;
            const isVisited = visitedRSet.has(v);
            const fill = isMatched ? 'var(--accent)'
              : isVisited ? 'rgba(var(--accent-rgb), 0.16)'
              : 'var(--surface)';
            const stroke = isVisited ? 'var(--hue-pink)'
              : isMatched ? 'var(--accent)'
              : 'var(--border)';
            return (
              <g key={`r-${v}`}>
                <circle cx={p.x} cy={p.y} r={NR} fill={fill} stroke={stroke} strokeWidth={isVisited ? 2.6 : 2} />
                <text x={p.x} y={p.y + 4} className="bmv-node-label" style={{ fill: isMatched ? 'var(--bg)' : 'var(--text-main)' }}>R{v}</text>
                {isMatched && (
                  <text x={p.x + NR + 10} y={p.y + 4} className="bmv-node-meta" style={{ textAnchor: 'start' }}>
                    by L{owner}
                  </text>
                )}
              </g>
            );
          })}

          {/* state panel */}
          <rect x={panelX - 12} y={20} width={panelW + 24} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={panelX} y={42} className="bmv-col-label">matchR[r] = owning left node</text>
          {RIGHT.map((v) => {
            const y = 58 + v * rowH;
            const owner = current.matchR[v];
            const onPathRight = current.pathEdges.some((e) => e.v === v);
            return (
              <g key={`row-${v}`}>
                <rect
                  x={panelX} y={y} width={panelW} height={rowH - 6}
                  fill={onPathRight ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={onPathRight ? 'var(--hue-pink)' : 'var(--border)'}
                  rx={4}
                />
                <text x={panelX + 10} y={y + (rowH - 6) / 2 + 4} className="bmv-row-text">R{v}</text>
                <text x={panelX + 56} y={y + (rowH - 6) / 2 + 4} className="bmv-row-meta">
                  {owner < 0 ? 'free' : `<- L${owner}`}
                </text>
              </g>
            );
          })}

          <line x1={panelX} y1={58 + RIGHT.length * rowH + 8} x2={panelX + panelW} y2={58 + RIGHT.length * rowH + 8} stroke="var(--border)" strokeWidth={1} />
          <text x={panelX} y={58 + RIGHT.length * rowH + 32} className="bmv-col-label">matching size</text>
          <text x={panelX} y={58 + RIGHT.length * rowH + 62} className="bmv-readout-big">
            {current.size} / {Math.min(LEFT.length, RIGHT.length)}
          </text>
        </svg>
      </div>

      <div className="bmv-metrics">
        <div className="bmv-metric">
          <span className="bmv-metric-label">matching size</span>
          <span className="bmv-metric-value">{current.size}</span>
        </div>
        <div className="bmv-metric">
          <span className="bmv-metric-label">augmenting from</span>
          <span className="bmv-metric-value">{current.root < 0 ? '—' : `L${current.root}`}</span>
        </div>
        <div className="bmv-metric">
          <span className="bmv-metric-label">match[]</span>
          <span className="bmv-metric-value">[{current.matchR.map((u) => (u < 0 ? '·' : u)).join(', ')}]</span>
        </div>
        <div className="bmv-metric bmv-metric-dim">
          <span className="bmv-metric-label">graph</span>
          <span className="bmv-metric-value bmv-metric-dimval">{LEFT.length}L · {RIGHT.length}R · {EDGES.length}e</span>
        </div>
      </div>

      <div className="bmv-arith">
        <span className="bmv-arith-label">trace</span>
        <span className="bmv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
