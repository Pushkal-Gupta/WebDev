import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Check } from 'lucide-react';
import './DijkstraViz.css';

const NODES = [
  { id: 'A', x: 90,  y: 110 },
  { id: 'B', x: 240, y: 60  },
  { id: 'C', x: 240, y: 200 },
  { id: 'D', x: 400, y: 60  },
  { id: 'E', x: 400, y: 200 },
  { id: 'F', x: 560, y: 110 },
  { id: 'G', x: 320, y: 340 },
  { id: 'H', x: 510, y: 320 },
];

const EDGES = [
  { from: 'A', to: 'B', w: 4 },
  { from: 'A', to: 'C', w: 2 },
  { from: 'B', to: 'C', w: 5 },
  { from: 'C', to: 'B', w: 1 },
  { from: 'B', to: 'D', w: 10 },
  { from: 'C', to: 'E', w: 3 },
  { from: 'E', to: 'D', w: 4 },
  { from: 'D', to: 'F', w: 11 },
  { from: 'E', to: 'F', w: 5 },
  { from: 'C', to: 'G', w: 8 },
  { from: 'G', to: 'H', w: 2 },
  { from: 'E', to: 'H', w: 7 },
  { from: 'H', to: 'F', w: 3 },
];

const ADJ = (() => {
  const map = {};
  NODES.forEach((n) => { map[n.id] = []; });
  EDGES.forEach((e) => { map[e.from].push({ to: e.to, w: e.w }); });
  Object.values(map).forEach((list) => list.sort((a, b) => a.to.localeCompare(b.to)));
  return map;
})();

const edgeKey = (u, v) => `${u}->${v}`;

const INF = Infinity;

function distLabel(d) {
  return d === INF ? '∞' : String(d);
}

function pqSnapshot(dist, visited) {
  const items = [];
  Object.keys(dist).forEach((id) => {
    if (!visited.has(id) && dist[id] !== INF) {
      items.push({ id, d: dist[id] });
    }
  });
  items.sort((a, b) => (a.d - b.d) || a.id.localeCompare(b.id));
  return items;
}

function buildSteps(start) {
  const steps = [];
  const dist = {};
  const prev = {};
  NODES.forEach((n) => {
    dist[n.id] = n.id === start ? 0 : INF;
    prev[n.id] = null;
  });
  const visited = new Set();
  const treeEdges = new Set();

  steps.push({
    kind: 'init',
    cur: null,
    dist: { ...dist },
    visited: [...visited],
    pq: pqSnapshot(dist, visited),
    relaxed: [],
    treeEdges: [...treeEdges],
    caption: `Initialize: dist[${start}] = 0, all others infinity. Priority queue holds ${start}.`,
  });

  while (true) {
    let pick = null;
    let best = INF;
    NODES.forEach((n) => {
      if (!visited.has(n.id) && dist[n.id] < best) {
        best = dist[n.id];
        pick = n.id;
      }
    });
    if (pick === null) break;

    steps.push({
      kind: 'pick',
      cur: pick,
      dist: { ...dist },
      visited: [...visited],
      pq: pqSnapshot(dist, visited),
      relaxed: [],
      treeEdges: [...treeEdges],
      caption: `Extract min from priority queue: ${pick} with distance ${distLabel(dist[pick])}. Now process its outgoing edges.`,
    });

    visited.add(pick);
    const relaxedHere = [];
    for (const { to, w } of ADJ[pick]) {
      if (visited.has(to)) continue;
      const candidate = dist[pick] + w;
      if (candidate < dist[to]) {
        const old = dist[to];
        if (prev[to]) treeEdges.delete(edgeKey(prev[to], to));
        dist[to] = candidate;
        prev[to] = pick;
        treeEdges.add(edgeKey(pick, to));
        relaxedHere.push({ from: pick, to, w, old, neu: candidate });
      }
    }

    if (relaxedHere.length > 0) {
      const desc = relaxedHere
        .map((r) => `${r.to}: ${distLabel(r.old)} -> ${r.neu}`)
        .join(', ');
      steps.push({
        kind: 'relax',
        cur: pick,
        dist: { ...dist },
        visited: [...visited],
        pq: pqSnapshot(dist, visited),
        relaxed: relaxedHere.map((r) => edgeKey(r.from, r.to)),
        treeEdges: [...treeEdges],
        caption: `Relax edges out of ${pick}. Updated: ${desc}.`,
      });
    } else {
      steps.push({
        kind: 'noop',
        cur: pick,
        dist: { ...dist },
        visited: [...visited],
        pq: pqSnapshot(dist, visited),
        relaxed: [],
        treeEdges: [...treeEdges],
        caption: `No improvements from ${pick}. Mark it visited and continue.`,
      });
    }
  }

  const reached = Object.keys(dist).filter((id) => dist[id] !== INF).length;
  steps.push({
    kind: 'done',
    cur: null,
    dist: { ...dist },
    visited: [...visited],
    pq: [],
    relaxed: [],
    treeEdges: [...treeEdges],
    caption: `Priority queue empty. Dijkstra complete - shortest paths known for ${reached} of ${NODES.length} nodes from ${start}.`,
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
  const x2 = b.x - ux * (NR + 4);
  const y2 = b.y - uy * (NR + 4);
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

export default function DijkstraViz() {
  const [start, setStart] = useState('A');
  const steps = useMemo(() => buildSteps(start), [start]);
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const [prevStart, setPrevStart] = useState(start);
  if (prevStart !== start) {
    setPrevStart(start);
    setIdx(0);
    setPlaying(false);
  }

  const step = steps[idx];
  // Derive `playing` from the raw toggle + bounds so the auto-run effect never
  // needs to call setPlaying(false) when we hit the end.
  const playing = playingRaw && idx < steps.length - 1;

  const next = useCallback(() => {
    setIdx((i) => (i >= steps.length - 1 ? i : i + 1));
  }, [steps.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      next();
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  const handleReset = () => {
    setPlaying(false);
    setIdx(0);
  };

  const handleNodeClick = (id) => {
    if (id === start) return;
    setStart(id);
  };

  const nodeState = useMemo(() => {
    const map = {};
    NODES.forEach((n) => { map[n.id] = 'unreached'; });
    Object.keys(step.dist).forEach((id) => {
      if (step.dist[id] !== INF) map[id] = 'reached';
    });
    step.visited.forEach((id) => { map[id] = 'visited'; });
    if (step.cur) map[step.cur] = 'current';
    return map;
  }, [step]);

  const relaxedSet = useMemo(() => new Set(step.relaxed), [step.relaxed]);
  const treeSet = useMemo(() => new Set(step.treeEdges), [step.treeEdges]);
  const atEnd = idx >= steps.length - 1;
  const isDone = step.kind === 'done';

  return (
    <div className="dijkviz">
      <div className="dijkviz-header">
        <div className="dijkviz-title">Dijkstra's shortest path</div>
        <div className="dijkviz-start">
          <label htmlFor="dijkviz-start-select">Start</label>
          <select
            id="dijkviz-start-select"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          >
            {NODES.map((n) => (
              <option key={n.id} value={n.id}>{n.id}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="dijkviz-legend">
        <span className="dijkviz-legend-item">
          <span className="dijkviz-dot dijkviz-dot-unreached" /> unreached
        </span>
        <span className="dijkviz-legend-item">
          <span className="dijkviz-dot dijkviz-dot-reached" /> in queue
        </span>
        <span className="dijkviz-legend-item">
          <span className="dijkviz-dot dijkviz-dot-current" /> processing
        </span>
        <span className="dijkviz-legend-item">
          <span className="dijkviz-dot dijkviz-dot-visited" /> settled
        </span>
        <span className="dijkviz-legend-item">
          <span className="dijkviz-line dijkviz-line-relaxed" /> relaxed
        </span>
        <span className="dijkviz-legend-item">
          <span className="dijkviz-line dijkviz-line-tree" /> shortest-path tree
        </span>
      </div>

      <div className="dijkviz-stage">
        <svg
          className="dijkviz-svg"
          viewBox="0 0 640 420"
          role="img"
          aria-label="Dijkstra shortest path visualization"
        >
          <defs>
            <marker
              id="dijkviz-arrow-idle"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="dijkviz-arrow-idle" />
            </marker>
            <marker
              id="dijkviz-arrow-relaxed"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="dijkviz-arrow-relaxed" />
            </marker>
            <marker
              id="dijkviz-arrow-tree"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="dijkviz-arrow-tree" />
            </marker>
          </defs>

          <g className="dijkviz-edges">
            {EDGES.map((e) => {
              const a = NODES.find((n) => n.id === e.from);
              const b = NODES.find((n) => n.id === e.to);
              const geom = edgeGeometry(a, b);
              if (!geom) return null;
              const k = edgeKey(e.from, e.to);
              const isRelaxed = relaxedSet.has(k);
              const isTree = treeSet.has(k);
              const state = isRelaxed ? 'relaxed' : isTree ? (isDone ? 'tree-final' : 'tree') : 'idle';
              const marker = state === 'relaxed'
                ? 'url(#dijkviz-arrow-relaxed)'
                : (state === 'tree' || state === 'tree-final')
                  ? 'url(#dijkviz-arrow-tree)'
                  : 'url(#dijkviz-arrow-idle)';
              return (
                <g key={k} className={`dijkviz-edge-group dijkviz-edge-${state}`}>
                  <line
                    className="dijkviz-edge"
                    x1={geom.x1}
                    y1={geom.y1}
                    x2={geom.x2}
                    y2={geom.y2}
                    markerEnd={marker}
                  />
                  <g className="dijkviz-weight" transform={`translate(${geom.labelX},${geom.labelY})`}>
                    <rect x="-10" y="-9" width="20" height="18" rx="5" className="dijkviz-weight-bg" />
                    <text textAnchor="middle" dominantBaseline="central">{e.w}</text>
                  </g>
                </g>
              );
            })}
          </g>

          <g className="dijkviz-nodes">
            {NODES.map((n) => {
              const state = nodeState[n.id];
              const isStart = n.id === start;
              const d = step.dist[n.id];
              return (
                <g
                  key={n.id}
                  className={`dijkviz-node dijkviz-node-${state}`}
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
                  aria-label={`Node ${n.id}, distance ${distLabel(d)}, ${state}${isStart ? ', start' : ''}`}
                >
                  {state === 'current' && (
                    <circle className="dijkviz-node-ring" r="29" />
                  )}
                  <circle className="dijkviz-node-circle" r="22" />
                  <text className="dijkviz-node-label" textAnchor="middle" dominantBaseline="central">{n.id}</text>

                  <g className="dijkviz-dist-badge" transform="translate(0,-36)">
                    <rect x="-18" y="-11" width="36" height="20" rx="6" className="dijkviz-dist-bg" />
                    <text className="dijkviz-dist-text" textAnchor="middle" dominantBaseline="central">{distLabel(d)}</text>
                  </g>

                  {state === 'visited' && (
                    <g className="dijkviz-check" transform="translate(16,-16)">
                      <circle r="8" className="dijkviz-check-bg" />
                      <g transform="translate(-4.5,-4.5) scale(0.6)">
                        <path
                          d="M3 8 L7 12 L15 4"
                          className="dijkviz-check-path"
                          fill="none"
                        />
                      </g>
                    </g>
                  )}

                  {isStart && (
                    <text
                      className="dijkviz-start-tag"
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

      <div className="dijkviz-status">
        <div className="dijkviz-status-row">
          <span className="dijkviz-status-label">Step</span>
          <span className="dijkviz-status-value">{idx} / {steps.length - 1}</span>
        </div>
        <div className="dijkviz-status-row">
          <span className="dijkviz-status-label">Processing</span>
          <span className="dijkviz-status-value">
            {step.cur
              ? <>Node {step.cur}</>
              : <span className="dijkviz-muted">{isDone ? 'finished' : 'idle'}</span>}
          </span>
        </div>
        <div className="dijkviz-status-row">
          <span className="dijkviz-status-label">Settled</span>
          <span className="dijkviz-status-value">{step.visited.length} / {NODES.length}</span>
        </div>
      </div>

      <div className="dijkviz-pq">
        <div className="dijkviz-pq-label">Priority queue (min-distance first)</div>
        <div className="dijkviz-pq-chips">
          {step.pq.length === 0 ? (
            <span className="dijkviz-muted">empty</span>
          ) : (
            step.pq.map((item, i) => (
              <span
                key={`${item.id}-${i}`}
                className={`dijkviz-chip ${i === 0 ? 'dijkviz-chip-head' : ''}`}
              >
                <span className="dijkviz-chip-id">{item.id}</span>
                <span className="dijkviz-chip-sep">:</span>
                <span className="dijkviz-chip-d">{distLabel(item.d)}</span>
              </span>
            ))
          )}
        </div>
      </div>

      <p className="dijkviz-caption">
        {isDone && <Check size={14} className="dijkviz-caption-icon" aria-hidden="true" />}
        <span>{step.caption}</span>
      </p>

      <div className="dijkviz-controls">
        <button
          type="button"
          className="dijkviz-btn dijkviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="dijkviz-btn dijkviz-btn-primary"
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
          className="dijkviz-btn dijkviz-btn-secondary"
          onClick={next}
          disabled={atEnd}
          aria-label="Step"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>
      </div>
    </div>
  );
}
