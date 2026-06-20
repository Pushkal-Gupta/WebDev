import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './HopcroftKarpViz.css';

const LEFT = [
  { id: 'L0', label: 'L0', x: 110, y: 70 },
  { id: 'L1', label: 'L1', x: 110, y: 150 },
  { id: 'L2', label: 'L2', x: 110, y: 230 },
  { id: 'L3', label: 'L3', x: 110, y: 310 },
  { id: 'L4', label: 'L4', x: 110, y: 390 },
];

const RIGHT = [
  { id: 'R0', label: 'R0', x: 530, y: 70 },
  { id: 'R1', label: 'R1', x: 530, y: 150 },
  { id: 'R2', label: 'R2', x: 530, y: 230 },
  { id: 'R3', label: 'R3', x: 530, y: 310 },
  { id: 'R4', label: 'R4', x: 530, y: 390 },
];

const EDGES = [
  { u: 'L0', v: 'R0' },
  { u: 'L0', v: 'R1' },
  { u: 'L1', v: 'R0' },
  { u: 'L1', v: 'R2' },
  { u: 'L2', v: 'R1' },
  { u: 'L2', v: 'R3' },
  { u: 'L3', v: 'R2' },
  { u: 'L3', v: 'R4' },
  { u: 'L4', v: 'R3' },
];

const INF = 1e9;

function buildFrames() {
  const adj = {};
  LEFT.forEach((l) => { adj[l.id] = []; });
  EDGES.forEach((e) => { adj[e.u].push(e.v); });

  // pairL: left -> matched right or null
  // pairR: right -> matched left or null
  const pairL = {};
  const pairR = {};
  LEFT.forEach((l) => { pairL[l.id] = null; });
  RIGHT.forEach((r) => { pairR[r.id] = null; });

  const frames = [];
  const edgeKey = (u, v) => `${u}-${v}`;
  const edgeIndex = {};
  EDGES.forEach((e, i) => { edgeIndex[edgeKey(e.u, e.v)] = i; });

  const matchedEdges = () => {
    const s = new Set();
    LEFT.forEach((l) => {
      if (pairL[l.id]) s.add(edgeIndex[edgeKey(l.id, pairL[l.id])]);
    });
    return s;
  };

  frames.push({
    kind: 'init',
    phase: 'init',
    levels: {},
    pairL: { ...pairL },
    pairR: { ...pairR },
    matchedEdges: new Set(),
    pathEdges: new Set(),
    currentNode: null,
    matchingSize: 0,
    note: `Initialize: no edges matched. Run alternating phases — BFS to compute levels from free left vertices, then DFS to find vertex-disjoint augmenting paths.`,
  });

  let phaseNum = 0;
  const maxPhases = 6;

  while (phaseNum < maxPhases) {
    phaseNum++;
    // BFS phase
    const dist = {};
    LEFT.forEach((l) => {
      dist[l.id] = pairL[l.id] === null ? 0 : INF;
    });
    let found = false;
    const queue = LEFT.filter((l) => pairL[l.id] === null).map((l) => l.id);

    while (queue.length) {
      const u = queue.shift();
      for (const v of adj[u]) {
        const pair = pairR[v];
        if (pair === null) {
          found = true;
        } else if (dist[pair] === INF) {
          dist[pair] = dist[u] + 1;
          queue.push(pair);
        }
      }
    }

    frames.push({
      kind: 'bfs',
      phase: `phase ${phaseNum} · BFS`,
      levels: { ...dist },
      pairL: { ...pairL },
      pairR: { ...pairR },
      matchedEdges: matchedEdges(),
      pathEdges: new Set(),
      currentNode: null,
      matchingSize: Object.values(pairL).filter(Boolean).length,
      note: found
        ? `Phase ${phaseNum} BFS: layered graph built. Free right vertex reachable — augmenting paths exist.`
        : `Phase ${phaseNum} BFS: no free right vertex reachable. Matching is maximum.`,
    });

    if (!found) break;

    // DFS phase — find vertex-disjoint augmenting paths
    const usedR = new Set();
    const tryDFS = (u, path) => {
      for (const v of adj[u]) {
        if (usedR.has(v)) continue;
        const pair = pairR[v];
        const okLevel = pair === null || dist[pair] === dist[u] + 1;
        if (!okLevel) continue;
        usedR.add(v);
        if (pair === null) {
          path.push([u, v]);
          return true;
        }
        path.push([u, v]);
        if (tryDFS(pair, path)) return true;
        path.pop();
      }
      dist[u] = INF;
      return false;
    };

    for (const l of LEFT) {
      if (pairL[l.id] !== null) continue;
      const path = [];
      const ok = tryDFS(l.id, path);
      if (ok) {
        // Show path BEFORE flipping
        const pSet = new Set(path.map(([u, v]) => edgeIndex[edgeKey(u, v)]));
        frames.push({
          kind: 'dfs-path',
          phase: `phase ${phaseNum} · DFS`,
          levels: { ...dist },
          pairL: { ...pairL },
          pairR: { ...pairR },
          matchedEdges: matchedEdges(),
          pathEdges: pSet,
          currentNode: l.id,
          matchingSize: Object.values(pairL).filter(Boolean).length,
          note: `DFS from free ${l.label}: augmenting path ${path.map(([u, v]) => `${u}→${v}`).join(' → ')}. Flip every edge along this path.`,
        });

        // Apply augmentation
        for (const [u, v] of path) {
          pairL[u] = v;
          pairR[v] = u;
        }

        frames.push({
          kind: 'augment',
          phase: `phase ${phaseNum} · augment`,
          levels: { ...dist },
          pairL: { ...pairL },
          pairR: { ...pairR },
          matchedEdges: matchedEdges(),
          pathEdges: pSet,
          currentNode: l.id,
          matchingSize: Object.values(pairL).filter(Boolean).length,
          note: `Augment: path flipped. Matching size = ${Object.values(pairL).filter(Boolean).length}.`,
        });
      } else {
        frames.push({
          kind: 'dfs-fail',
          phase: `phase ${phaseNum} · DFS`,
          levels: { ...dist },
          pairL: { ...pairL },
          pairR: { ...pairR },
          matchedEdges: matchedEdges(),
          pathEdges: new Set(),
          currentNode: l.id,
          matchingSize: Object.values(pairL).filter(Boolean).length,
          note: `DFS from ${l.label}: no augmenting path with vertex-disjoint right side. Skip.`,
        });
      }
    }
  }

  const finalSize = Object.values(pairL).filter(Boolean).length;
  frames.push({
    kind: 'done',
    phase: 'done',
    levels: {},
    pairL: { ...pairL },
    pairR: { ...pairR },
    matchedEdges: matchedEdges(),
    pathEdges: new Set(),
    currentNode: null,
    matchingSize: finalSize,
    note: `Done. Maximum matching size = ${finalSize}. Pairs: ${LEFT.filter((l) => pairL[l.id]).map((l) => `${l.label}-${pairL[l.id]}`).join(', ') || 'none'}.`,
  });

  return frames;
}

export default function HopcroftKarpViz() {
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

  const W = 640;
  const H = 460;
  const R = 22;

  const nodeById = (id) => LEFT.find((l) => l.id === id) || RIGHT.find((r) => r.id === id);

  return (
    <div className="hkv">
      <div className="hkv-head">
        <h3 className="hkv-title">Hopcroft-Karp — BFS layers + multi-path DFS augmentation</h3>
        <p className="hkv-sub">
          BFS partitions left vertices into levels from unmatched roots. DFS pushes vertex-disjoint augmenting paths
          along strictly-increasing levels. Each phase grows the matching by ≥1.
        </p>
      </div>

      <div className="hkv-controls">
        <div className="hkv-actions">
          <div className="hkv-buttons">
            <button
              type="button"
              className="hkv-btn hkv-btn-primary"
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
              className="hkv-btn"
              onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="hkv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="hkv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="hkv-speed">
            <span className="hkv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="hkv-speed-range"
            />
            <span className="hkv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="hkv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="hkv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="hkv-svg" preserveAspectRatio="xMidYMid meet">
          <text x={110} y={28} className="hkv-side-label" textAnchor="middle">LEFT</text>
          <text x={530} y={28} className="hkv-side-label" textAnchor="middle">RIGHT</text>

          {EDGES.map((e, ei) => {
            const a = nodeById(e.u);
            const b = nodeById(e.v);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / len;
            const uy = dy / len;
            const x1 = a.x + ux * R;
            const y1 = a.y + uy * R;
            const x2 = b.x - ux * R;
            const y2 = b.y - uy * R;

            const isMatched = current.matchedEdges.has(ei);
            const isOnPath = current.pathEdges.has(ei);

            let cls = 'hkv-edge';
            if (isOnPath) cls = 'hkv-edge hkv-edge-path';
            else if (isMatched) cls = 'hkv-edge hkv-edge-matched';

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

          {LEFT.map((n) => {
            const isFree = current.pairL[n.id] === null;
            const isCurrent = current.currentNode === n.id;
            const level = current.levels[n.id];
            const hasLevel = level !== undefined && level !== INF;
            return (
              <g key={`left-${n.id}`}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={R}
                  className="hkv-node-circle"
                  fill={
                    isCurrent
                      ? 'rgba(var(--accent-rgb), 0.28)'
                      : isFree
                      ? 'rgba(var(--accent-rgb), 0.12)'
                      : 'var(--surface)'
                  }
                  stroke={isCurrent ? 'var(--accent)' : isFree ? 'var(--hue-sky)' : 'var(--border)'}
                  strokeWidth={isCurrent ? 2.4 : 1.5}
                />
                <text x={n.x} y={n.y + 1} className="hkv-node-label">{n.label}</text>
                {hasLevel && (
                  <g>
                    <rect
                      x={n.x - 38}
                      y={n.y - 10}
                      width={18}
                      height={18}
                      rx={3}
                      className="hkv-level-chip-bg"
                    />
                    <text x={n.x - 29} y={n.y + 3} className="hkv-level-chip" textAnchor="middle">
                      {level}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {RIGHT.map((n) => {
            const isFree = current.pairR[n.id] === null;
            return (
              <g key={`right-${n.id}`}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={R}
                  className="hkv-node-circle"
                  fill={isFree ? 'rgba(var(--hue-mint-rgb, 0,128,128), 0.1)' : 'var(--surface)'}
                  stroke={isFree ? 'var(--hue-mint)' : 'var(--border)'}
                  strokeWidth={1.5}
                />
                <text x={n.x} y={n.y + 1} className="hkv-node-label">{n.label}</text>
              </g>
            );
          })}
        </svg>

        <div className="hkv-side">
          <div className="hkv-pairs">
            <span className="hkv-pairs-title">current matching</span>
            <div className="hkv-pairs-grid">
              {LEFT.map((l) => (
                <div key={`pair-${l.id}`} className={`hkv-pair${current.pairL[l.id] ? ' hkv-pair-active' : ''}`}>
                  <span className="hkv-pair-l">{l.label}</span>
                  <span className="hkv-pair-arrow">{current.pairL[l.id] ? '↔' : '·'}</span>
                  <span className="hkv-pair-r">{current.pairL[l.id] || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hkv-legend">
            <span className="hkv-legend-title">legend</span>
            <div className="hkv-legend-row">
              <span className="hkv-swatch hkv-swatch-matched" /> matched edge
            </div>
            <div className="hkv-legend-row">
              <span className="hkv-swatch hkv-swatch-path" /> on augmenting path
            </div>
            <div className="hkv-legend-row">
              <span className="hkv-swatch hkv-swatch-free" /> free vertex
            </div>
          </div>
        </div>
      </div>

      <div className="hkv-metrics">
        <div className="hkv-metric">
          <span className="hkv-metric-label">phase</span>
          <span className="hkv-metric-value">{current.phase}</span>
        </div>
        <div className="hkv-metric">
          <span className="hkv-metric-label">step kind</span>
          <span className="hkv-metric-value">{current.kind}</span>
        </div>
        <div className="hkv-metric">
          <span className="hkv-metric-label">matching size</span>
          <span className="hkv-metric-value">{current.matchingSize}</span>
        </div>
        <div className="hkv-metric hkv-metric-dim">
          <span className="hkv-metric-label">max possible</span>
          <span className="hkv-metric-value hkv-metric-dimval">{Math.min(LEFT.length, RIGHT.length)}</span>
        </div>
      </div>

      <div className="hkv-arith">
        <span className="hkv-arith-label">trace</span>
        <span className="hkv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
