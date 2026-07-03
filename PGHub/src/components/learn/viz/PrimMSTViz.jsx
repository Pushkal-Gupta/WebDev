import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Check } from 'lucide-react';
import './PrimMSTViz.css';

const NODES = [
  { id: 0, x: 110, y: 110 },
  { id: 1, x: 260, y: 60  },
  { id: 2, x: 260, y: 220 },
  { id: 3, x: 420, y: 60  },
  { id: 4, x: 420, y: 220 },
  { id: 5, x: 570, y: 110 },
  { id: 6, x: 360, y: 340 },
];

const EDGES = [
  { a: 0, b: 1, w: 4 },
  { a: 0, b: 2, w: 3 },
  { a: 1, b: 2, w: 2 },
  { a: 1, b: 3, w: 7 },
  { a: 2, b: 3, w: 5 },
  { a: 2, b: 4, w: 6 },
  { a: 3, b: 4, w: 4 },
  { a: 3, b: 5, w: 3 },
  { a: 4, b: 5, w: 8 },
  { a: 2, b: 6, w: 9 },
  { a: 4, b: 6, w: 2 },
  { a: 5, b: 6, w: 11 },
];

const ADJ = (() => {
  const map = {};
  NODES.forEach((n) => { map[n.id] = []; });
  EDGES.forEach((e, i) => {
    map[e.a].push({ to: e.b, w: e.w, idx: i });
    map[e.b].push({ to: e.a, w: e.w, idx: i });
  });
  return map;
})();

const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

function fringeSnapshot(fringe) {
  return [...fringe]
    .sort((x, y) => (x.w - y.w) || (x.to - y.to))
    .map((e) => ({ from: e.from, to: e.to, w: e.w, key: edgeKey(e.from, e.to) }));
}

function buildSteps(start) {
  const steps = [];
  const visited = new Set();
  const mst = new Set();
  let totalWeight = 0;

  visited.add(start);

  // Seed the fringe with edges out of start.
  let fringe = [];
  ADJ[start].forEach(({ to, w }) => {
    fringe.push({ from: start, to, w });
  });

  steps.push({
    kind: 'init',
    cur: null,
    picked: null,
    visited: [...visited],
    fringe: fringeSnapshot(fringe),
    mst: [...mst],
    weight: totalWeight,
    caption: `Start from node ${start}. Add all edges from ${start} to the fringe (priority queue). The fringe holds candidate edges crossing from visited to unvisited.`,
  });

  while (visited.size < NODES.length) {
    // Remove stale fringe entries (both endpoints visited).
    fringe = fringe.filter((e) => !(visited.has(e.from) && visited.has(e.to)));
    if (fringe.length === 0) break;

    // Pick min-weight crossing edge.
    let best = null;
    let bestI = -1;
    fringe.forEach((e, i) => {
      const crosses = visited.has(e.from) !== visited.has(e.to);
      if (!crosses) return;
      if (best === null || e.w < best.w || (e.w === best.w && e.to < best.to)) {
        best = e;
        bestI = i;
      }
    });
    if (!best) break;

    const newNode = visited.has(best.from) ? best.to : best.from;
    const anchor = visited.has(best.from) ? best.from : best.to;

    steps.push({
      kind: 'pick',
      cur: newNode,
      picked: { from: anchor, to: newNode, w: best.w, key: edgeKey(best.from, best.to) },
      visited: [...visited],
      fringe: fringeSnapshot(fringe),
      mst: [...mst],
      weight: totalWeight,
      caption: `Pick the lightest fringe edge: ${anchor}-${newNode} (weight ${best.w}). It connects the visited set to a new node.`,
    });

    visited.add(newNode);
    mst.add(edgeKey(best.from, best.to));
    totalWeight += best.w;
    fringe.splice(bestI, 1);

    // Add new fringe edges from newNode.
    const added = [];
    ADJ[newNode].forEach(({ to, w }) => {
      if (visited.has(to)) return;
      fringe.push({ from: newNode, to, w });
      added.push({ to, w });
    });
    // Drop stale entries now that newNode is visited.
    fringe = fringe.filter((e) => !(visited.has(e.from) && visited.has(e.to)));

    const addedDesc = added.length === 0
      ? 'no new fringe edges (all neighbors already visited)'
      : added.map((x) => `${newNode}-${x.to}(${x.w})`).join(', ');

    steps.push({
      kind: 'add',
      cur: newNode,
      picked: null,
      visited: [...visited],
      fringe: fringeSnapshot(fringe),
      mst: [...mst],
      weight: totalWeight,
      caption: `Add node ${newNode} to visited. Include ${anchor}-${newNode} in the MST (total weight now ${totalWeight}). Fringe update: ${addedDesc}.`,
    });
  }

  steps.push({
    kind: 'done',
    cur: null,
    picked: null,
    visited: [...visited],
    fringe: [],
    mst: [...mst],
    weight: totalWeight,
    caption: `All ${NODES.length} nodes visited. Minimum spanning tree complete with ${mst.size} edges and total weight ${totalWeight}.`,
  });

  return steps;
}

function edgeGeometry(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return null;
  const ux = dx / len;
  const uy = dy / len;
  const NR = 22;
  const x1 = a.x + ux * NR;
  const y1 = a.y + uy * NR;
  const x2 = b.x - ux * NR;
  const y2 = b.y - uy * NR;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const nx = -uy;
  const ny = ux;
  const offset = 12;
  return {
    x1, y1, x2, y2,
    labelX: mx + nx * offset,
    labelY: my + ny * offset,
  };
}

export default function PrimMSTViz() {
  const [start, setStart] = useState(0);
  const [steps, setSteps] = useState(() => buildSteps(0));
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  // Reset state when start changes (prev-state-during-render pattern).
  const [prevStart, setPrevStart] = useState(start);
  if (prevStart !== start) {
    setPrevStart(start);
    setSteps(buildSteps(start));
    setIdx(0);
    setPlaying(false);
  }

  const step = steps[idx];
  const playing = playingRaw && idx < steps.length - 1;

  const next = useCallback(() => {
    setIdx((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    timerRef.current = setTimeout(() => {
      next();
    }, Math.round(1100 / speed));
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playing, idx, speed, next]);

  const handleReset = () => {
    setPlaying(false);
    setIdx(0);
  };

  const handleNodeClick = (id) => {
    if (id === start) return;
    setStart(id);
  };

  const visitedSet = useMemo(() => new Set(step.visited), [step.visited]);
  const mstSet = useMemo(() => new Set(step.mst), [step.mst]);
  const fringeKeys = useMemo(() => {
    const s = new Set();
    step.fringe.forEach((e) => s.add(e.key));
    return s;
  }, [step.fringe]);
  const pickedKey = step.picked ? step.picked.key : null;

  const nodeState = useMemo(() => {
    const map = {};
    NODES.forEach((n) => {
      map[n.id] = visitedSet.has(n.id) ? 'visited' : 'unvisited';
    });
    if (step.cur && visitedSet.has(step.cur)) {
      map[step.cur] = 'current';
    }
    if (step.picked) {
      map[step.picked.to] = 'incoming';
    }
    return map;
  }, [visitedSet, step]);

  const atEnd = idx >= steps.length - 1;
  const isDone = step.kind === 'done';

  return (
    <div className="primviz">
      <div className="primviz-header">
        <div className="primviz-title">Prim's minimum spanning tree</div>
        <div className="primviz-start">
          <label htmlFor="primviz-start-select">Start</label>
          <select
            id="primviz-start-select"
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
          >
            {NODES.map((n) => (
              <option key={n.id} value={n.id}>{n.id}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="primviz-legend">
        <span className="primviz-legend-item">
          <span className="primviz-dot primviz-dot-unvisited" /> unvisited
        </span>
        <span className="primviz-legend-item">
          <span className="primviz-dot primviz-dot-visited" /> visited
        </span>
        <span className="primviz-legend-item">
          <span className="primviz-dot primviz-dot-current" /> just added
        </span>
        <span className="primviz-legend-item">
          <span className="primviz-line primviz-line-fringe" /> fringe edge
        </span>
        <span className="primviz-legend-item">
          <span className="primviz-line primviz-line-picked" /> picked
        </span>
        <span className="primviz-legend-item">
          <span className="primviz-line primviz-line-mst" /> MST edge
        </span>
      </div>

      <div className="primviz-stage">
        <svg
          className="primviz-svg"
          viewBox="0 0 680 420"
          role="img"
          aria-label="Prim's minimum spanning tree visualization"
        >
          <g className="primviz-edges">
            {EDGES.map((e) => {
              const a = NODES.find((n) => n.id === e.a);
              const b = NODES.find((n) => n.id === e.b);
              const geom = edgeGeometry(a, b);
              if (!geom) return null;
              const k = edgeKey(e.a, e.b);
              const isMst = mstSet.has(k);
              const isPicked = pickedKey === k;
              const isFringe = fringeKeys.has(k);
              const state = isPicked
                ? 'picked'
                : isMst
                  ? (isDone ? 'mst-final' : 'mst')
                  : isFringe
                    ? 'fringe'
                    : 'idle';
              return (
                <g key={k} className={`primviz-edge-group primviz-edge-${state}`}>
                  <line
                    className="primviz-edge"
                    x1={geom.x1}
                    y1={geom.y1}
                    x2={geom.x2}
                    y2={geom.y2}
                  />
                  <g className="primviz-weight" transform={`translate(${geom.labelX},${geom.labelY})`}>
                    <rect x="-11" y="-9" width="22" height="18" rx="5" className="primviz-weight-bg" />
                    <text textAnchor="middle" dominantBaseline="central">{e.w}</text>
                  </g>
                </g>
              );
            })}
          </g>

          <g className="primviz-nodes">
            {NODES.map((n) => {
              const state = nodeState[n.id];
              const isStart = n.id === start;
              return (
                <g
                  key={n.id}
                  className={`primviz-node primviz-node-${state}`}
                  transform={`translate(${n.x},${n.y})`}
                  onClick={() => handleNodeClick(n.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNodeClick(n.id);
                    }
                  }}
                  aria-label={`Node ${n.id}, ${state}${isStart ? ', start' : ''}`}
                >
                  {state === 'current' && (
                    <circle className="primviz-node-ring" r="29" />
                  )}
                  <circle className="primviz-node-circle" r="22" />
                  <text className="primviz-node-label" textAnchor="middle" dominantBaseline="central">{n.id}</text>

                  {state === 'visited' && (
                    <g className="primviz-check" transform="translate(16,-16)">
                      <circle r="8" className="primviz-check-bg" />
                      <g transform="translate(-4.5,-4.5) scale(0.6)">
                        <path
                          d="M3 8 L7 12 L15 4"
                          className="primviz-check-path"
                          fill="none"
                        />
                      </g>
                    </g>
                  )}

                  {isStart && (
                    <text
                      className="primviz-start-tag"
                      x="0"
                      y="40"
                      textAnchor="middle"
                    >
                      start
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="primviz-status">
        <div className="primviz-status-row">
          <span className="primviz-status-label">Step</span>
          <span className="primviz-status-value">{idx} / {steps.length - 1}</span>
        </div>
        <div className="primviz-status-row">
          <span className="primviz-status-label">Visited</span>
          <span className="primviz-status-value">{step.visited.length} / {NODES.length}</span>
        </div>
        <div className="primviz-status-row">
          <span className="primviz-status-label">MST edges</span>
          <span className="primviz-status-value">{step.mst.length} / {NODES.length - 1}</span>
        </div>
        <div className="primviz-status-row primviz-status-row-accent">
          <span className="primviz-status-label">Total weight</span>
          <span className="primviz-status-value">{step.weight}</span>
        </div>
      </div>

      <div className="primviz-pq">
        <div className="primviz-pq-label">Fringe (min-weight first)</div>
        <div className="primviz-pq-chips">
          {step.fringe.length === 0 ? (
            <span className="primviz-muted">empty</span>
          ) : (
            step.fringe.map((item, i) => (
              <span
                key={`${item.key}-${i}`}
                className={`primviz-chip ${i === 0 ? 'primviz-chip-head' : ''}`}
              >
                <span className="primviz-chip-edge">{item.from}-{item.to}</span>
                <span className="primviz-chip-sep">:</span>
                <span className="primviz-chip-w">{item.w}</span>
              </span>
            ))
          )}
        </div>
      </div>

      <p className="primviz-caption">
        {isDone && <Check size={14} className="primviz-caption-icon" aria-hidden="true" />}
        <span>{step.caption}</span>
      </p>

      <div className="primviz-controls">
        <button
          type="button"
          className="primviz-btn primviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="primviz-btn primviz-btn-primary"
          onClick={() => {
            if (atEnd) {
              setIdx(0);
              setPlaying(true);
              return;
            }
            setPlaying((p) => !p);
          }}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="primviz-btn primviz-btn-secondary"
          onClick={next}
          disabled={atEnd}
          aria-label="Step"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>
        <label className="primviz-speed">
          <span className="primviz-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="primviz-speed-range"
            aria-label="Playback speed"
          />
          <span className="primviz-speed-value">{speed.toFixed(1)}×</span>
        </label>
      </div>
    </div>
  );
}
