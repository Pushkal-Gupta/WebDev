import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, AlertTriangle } from 'lucide-react';
import './TopoSortViz.css';

const NODES = [
  { id: 'CS101', label: 'CS101', x: 90,  y: 90  },
  { id: 'MATH',  label: 'MATH',  x: 90,  y: 240 },
  { id: 'DS',    label: 'DS',    x: 260, y: 90  },
  { id: 'ALGO',  label: 'ALGO',  x: 430, y: 90  },
  { id: 'OS',    label: 'OS',    x: 260, y: 240 },
  { id: 'DB',    label: 'DB',    x: 430, y: 240 },
  { id: 'NET',   label: 'NET',   x: 600, y: 90  },
  { id: 'CAP',   label: 'CAP',   x: 600, y: 240 },
];

const BASE_EDGES = [
  ['CS101', 'DS'],
  ['CS101', 'OS'],
  ['MATH',  'DS'],
  ['MATH',  'OS'],
  ['DS',    'ALGO'],
  ['DS',    'DB'],
  ['OS',    'DB'],
  ['OS',    'NET'],
  ['ALGO',  'NET'],
  ['ALGO',  'CAP'],
  ['DB',    'CAP'],
  ['NET',   'CAP'],
];

// Back-edge that introduces a cycle when toggled on (CAP -> DS closes a loop).
const CYCLE_EDGE = ['CAP', 'DS'];

const edgeKey = (u, v) => `${u}->${v}`;

function buildSteps(edges) {
  const steps = [];
  const indeg = {};
  NODES.forEach((n) => { indeg[n.id] = 0; });
  edges.forEach(([, v]) => { indeg[v] += 1; });

  const adj = {};
  NODES.forEach((n) => { adj[n.id] = []; });
  edges.forEach(([u, v]) => { adj[u].push(v); });
  Object.values(adj).forEach((list) => list.sort());

  const initialQueue = NODES.map((n) => n.id).filter((id) => indeg[id] === 0);

  steps.push({
    kind: 'init',
    cur: null,
    queue: [...initialQueue],
    indeg: { ...indeg },
    settled: [],
    result: [],
    flashEdges: [],
    relaxed: [],
    cycle: false,
    caption: initialQueue.length
      ? `Compute indegrees. Enqueue every node with indegree 0: ${initialQueue.join(', ')}.`
      : 'Compute indegrees. No node has indegree 0 — already a cycle.',
  });

  const queue = [...initialQueue];
  const settled = new Set();
  const result = [];
  const relaxed = new Set();

  while (queue.length) {
    const node = queue.shift();

    steps.push({
      kind: 'pop',
      cur: node,
      queue: [...queue],
      indeg: { ...indeg },
      settled: [...settled],
      result: [...result],
      flashEdges: [],
      relaxed: [...relaxed],
      cycle: false,
      caption: `Pop ${node} from the queue. Append it to the topological order.`,
    });

    settled.add(node);
    result.push(node);

    steps.push({
      kind: 'settle',
      cur: node,
      queue: [...queue],
      indeg: { ...indeg },
      settled: [...settled],
      result: [...result],
      flashEdges: [],
      relaxed: [...relaxed],
      cycle: false,
      caption: `${node} is now settled. Relax its outgoing edges next.`,
    });

    const flashes = [];
    const newlyZero = [];
    for (const nb of adj[node]) {
      indeg[nb] -= 1;
      flashes.push(edgeKey(node, nb));
      relaxed.add(edgeKey(node, nb));
      if (indeg[nb] === 0) newlyZero.push(nb);
    }

    if (flashes.length > 0) {
      steps.push({
        kind: 'relax',
        cur: node,
        queue: [...queue],
        indeg: { ...indeg },
        settled: [...settled],
        result: [...result],
        flashEdges: flashes,
        relaxed: [...relaxed],
        cycle: false,
        caption:
          adj[node].length === 1
            ? `Decrement indegree of ${adj[node][0]} (now ${indeg[adj[node][0]]}).`
            : `Decrement indegree of ${adj[node].join(', ')}.`,
      });

      if (newlyZero.length > 0) {
        newlyZero.forEach((id) => queue.push(id));
        steps.push({
          kind: 'enqueue',
          cur: node,
          queue: [...queue],
          indeg: { ...indeg },
          settled: [...settled],
          result: [...result],
          flashEdges: [],
          relaxed: [...relaxed],
          cycle: false,
          caption: `Indegree hit 0 — enqueue ${newlyZero.join(', ')}.`,
        });
      }
    } else {
      steps.push({
        kind: 'leaf',
        cur: node,
        queue: [...queue],
        indeg: { ...indeg },
        settled: [...settled],
        result: [...result],
        flashEdges: [],
        relaxed: [...relaxed],
        cycle: false,
        caption: `${node} has no outgoing edges. Continue.`,
      });
    }
  }

  if (result.length === NODES.length) {
    steps.push({
      kind: 'done',
      cur: null,
      queue: [],
      indeg: { ...indeg },
      settled: [...settled],
      result: [...result],
      flashEdges: [],
      relaxed: [...relaxed],
      cycle: false,
      caption: `Queue empty and all ${NODES.length} nodes settled — valid topological order found.`,
    });
  } else {
    const stuck = NODES.map((n) => n.id).filter((id) => !settled.has(id));
    steps.push({
      kind: 'cycle',
      cur: null,
      queue: [],
      indeg: { ...indeg },
      settled: [...settled],
      result: [...result],
      flashEdges: [],
      relaxed: [...relaxed],
      cycle: true,
      stuck,
      caption: `Queue empty but ${stuck.length} node(s) remain with indegree > 0: ${stuck.join(', ')}. Cycle detected — no valid order exists.`,
    });
  }

  return steps;
}

export default function TopoSortViz() {
  const [cyclic, setCyclic] = useState(false);
  const edges = useMemo(
    () => (cyclic ? [...BASE_EDGES, CYCLE_EDGE] : BASE_EDGES),
    [cyclic],
  );
  const steps = useMemo(() => buildSteps(edges), [edges]);
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const [prevSteps, setPrevSteps] = useState(steps);
  if (prevSteps !== steps) {
    setPrevSteps(steps);
    setIdx(0);
    setPlaying(false);
  }

  const step = steps[idx];

  // Derive `playing` so we don't have to call setPlaying(false) from inside the
  // interval effect when we hit the last step — avoids cascading-render lint.
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
    }, 950);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  const handleReset = () => {
    setPlaying(false);
    setIdx(0);
  };

  const atEnd = idx >= steps.length - 1;

  const nodeState = useMemo(() => {
    const map = {};
    NODES.forEach((n) => { map[n.id] = 'idle'; });
    step.queue.forEach((n) => { map[n] = 'queued'; });
    step.settled.forEach((n) => { map[n] = 'settled'; });
    if (step.cur) map[step.cur] = 'current';
    if (step.kind === 'cycle' && step.stuck) {
      step.stuck.forEach((n) => { map[n] = 'stuck'; });
    }
    return map;
  }, [step]);

  const edgeState = useMemo(() => {
    const map = {};
    edges.forEach(([u, v]) => { map[edgeKey(u, v)] = 'idle'; });
    step.relaxed.forEach((k) => { if (map[k] !== undefined) map[k] = 'relaxed'; });
    step.flashEdges.forEach((k) => { if (map[k] !== undefined) map[k] = 'flash'; });
    return map;
  }, [edges, step]);

  const findNode = (id) => NODES.find((n) => n.id === id);

  // Pre-compute clipped endpoints so the arrow tip sits at the node edge, not center.
  const NODE_R = 26;

  const getEdgeGeom = (u, v) => {
    const a = findNode(u);
    const b = findNode(v);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    return {
      x1: a.x + ux * NODE_R,
      y1: a.y + uy * NODE_R,
      x2: b.x - ux * NODE_R,
      y2: b.y - uy * NODE_R,
    };
  };

  const showCycleBanner = step.cycle;

  return (
    <div className="tsviz">
      <div className="tsviz-header">
        <div className="tsviz-title">Topological sort · Kahn&apos;s BFS</div>
        <label className="tsviz-toggle">
          <input
            type="checkbox"
            checked={cyclic}
            onChange={(e) => setCyclic(e.target.checked)}
          />
          <span className="tsviz-toggle-track" aria-hidden="true">
            <span className="tsviz-toggle-thumb" />
          </span>
          <span className="tsviz-toggle-label">Show as cyclic</span>
        </label>
      </div>

      <div className="tsviz-legend">
        <span className="tsviz-legend-item">
          <span className="tsviz-dot tsviz-dot-idle" /> waiting
        </span>
        <span className="tsviz-legend-item">
          <span className="tsviz-dot tsviz-dot-queued" /> in queue
        </span>
        <span className="tsviz-legend-item">
          <span className="tsviz-dot tsviz-dot-current" /> processing
        </span>
        <span className="tsviz-legend-item">
          <span className="tsviz-dot tsviz-dot-settled" /> settled
        </span>
      </div>

      {showCycleBanner && (
        <div className="tsviz-banner" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Cycle detected — no valid order</span>
        </div>
      )}

      <div className="tsviz-stage">
        <svg
          className="tsviz-svg"
          viewBox="0 0 700 340"
          role="img"
          aria-label="Topological sort visualization on a directed acyclic graph"
        >
          <defs>
            <marker
              id="tsviz-arrow-idle"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="tsviz-arrowhead-idle" />
            </marker>
            <marker
              id="tsviz-arrow-relaxed"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="tsviz-arrowhead-relaxed" />
            </marker>
            <marker
              id="tsviz-arrow-flash"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="tsviz-arrowhead-flash" />
            </marker>
          </defs>

          <g className="tsviz-edges">
            {edges.map(([u, v]) => {
              const k = edgeKey(u, v);
              const state = edgeState[k] || 'idle';
              const geom = getEdgeGeom(u, v);
              const marker =
                state === 'flash'
                  ? 'url(#tsviz-arrow-flash)'
                  : state === 'relaxed'
                  ? 'url(#tsviz-arrow-relaxed)'
                  : 'url(#tsviz-arrow-idle)';
              return (
                <line
                  key={k}
                  className={`tsviz-edge tsviz-edge-${state}`}
                  x1={geom.x1}
                  y1={geom.y1}
                  x2={geom.x2}
                  y2={geom.y2}
                  markerEnd={marker}
                />
              );
            })}
          </g>

          <g className="tsviz-nodes">
            {NODES.map((n) => {
              const state = nodeState[n.id];
              const indegVal = step.indeg[n.id];
              return (
                <g
                  key={n.id}
                  className={`tsviz-node tsviz-node-${state}`}
                  transform={`translate(${n.x},${n.y})`}
                >
                  {state === 'current' && (
                    <circle className="tsviz-node-ring" r="32" />
                  )}
                  {state === 'queued' && (
                    <circle className="tsviz-node-pulse" r="30" />
                  )}
                  <circle className="tsviz-node-circle" r={NODE_R} />
                  <text
                    className="tsviz-node-label"
                    textAnchor="middle"
                    dominantBaseline="central"
                    y="-3"
                  >
                    {n.label}
                  </text>
                  <text
                    className="tsviz-node-indeg"
                    textAnchor="middle"
                    dominantBaseline="central"
                    y="10"
                  >
                    in:{indegVal}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="tsviz-status">
        <div className="tsviz-status-row">
          <span className="tsviz-status-label">Step</span>
          <span className="tsviz-status-value">{idx} / {steps.length - 1}</span>
        </div>
        <div className="tsviz-status-row">
          <span className="tsviz-status-label">Processing</span>
          <span className="tsviz-status-value">
            {step.cur ? step.cur : <span className="tsviz-muted">—</span>}
          </span>
        </div>
      </div>

      <div className="tsviz-queue">
        <div className="tsviz-queue-label">Queue (front to back)</div>
        <div className="tsviz-queue-chips">
          {step.queue.length === 0 ? (
            <span className="tsviz-muted">empty</span>
          ) : (
            step.queue.map((id, i) => (
              <span
                key={`q-${id}-${i}`}
                className={`tsviz-chip tsviz-chip-queue ${i === 0 ? 'tsviz-chip-head' : ''}`}
              >
                {id}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="tsviz-result">
        <div className="tsviz-result-label">Topological order</div>
        <div className="tsviz-result-chips">
          {step.result.length === 0 ? (
            <span className="tsviz-muted">empty</span>
          ) : (
            step.result.map((id, i) => (
              <span key={`r-${id}-${i}`} className="tsviz-chip tsviz-chip-result">
                <span className="tsviz-chip-index">{i + 1}</span>
                {id}
              </span>
            ))
          )}
        </div>
      </div>

      <p className="tsviz-caption">{step.caption}</p>

      <div className="tsviz-controls">
        <button
          type="button"
          className="tsviz-btn tsviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="tsviz-btn tsviz-btn-primary"
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
          className="tsviz-btn tsviz-btn-secondary"
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
