import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import './BFSViz.css';

const NODES = [
  { id: 'A', x: 120, y: 80 },
  { id: 'B', x: 280, y: 60 },
  { id: 'C', x: 440, y: 90 },
  { id: 'D', x: 100, y: 220 },
  { id: 'E', x: 260, y: 200 },
  { id: 'F', x: 440, y: 230 },
  { id: 'G', x: 200, y: 340 },
  { id: 'H', x: 400, y: 350 },
];

const EDGES = [
  ['A', 'B'],
  ['A', 'D'],
  ['B', 'C'],
  ['B', 'E'],
  ['C', 'F'],
  ['D', 'E'],
  ['D', 'G'],
  ['E', 'F'],
  ['E', 'G'],
  ['F', 'H'],
  ['G', 'H'],
];

const ADJ = (() => {
  const map = {};
  NODES.forEach((n) => { map[n.id] = []; });
  EDGES.forEach(([u, v]) => {
    map[u].push(v);
    map[v].push(u);
  });
  Object.values(map).forEach((list) => list.sort());
  return map;
})();

function buildSteps(start) {
  const steps = [];
  const visited = new Set();
  const queue = [start];
  const seen = new Set([start]);
  const tree = new Set();

  steps.push({
    kind: 'init',
    cur: null,
    queue: [...queue],
    visited: [...visited],
    frontier: [...seen],
    treeEdges: [...tree],
    caption: `Initialize: push ${start} into the queue. It enters the frontier.`,
  });

  while (queue.length) {
    const node = queue.shift();
    visited.add(node);
    steps.push({
      kind: 'visit',
      cur: node,
      queue: [...queue],
      visited: [...visited],
      frontier: [...seen].filter((n) => !visited.has(n)),
      treeEdges: [...tree],
      caption: `Pop ${node} from the queue. Mark it visited.`,
    });

    const newlyAdded = [];
    for (const nb of ADJ[node]) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
        newlyAdded.push(nb);
        const key = node < nb ? `${node}-${nb}` : `${nb}-${node}`;
        tree.add(key);
      }
    }

    if (newlyAdded.length > 0) {
      steps.push({
        kind: 'expand',
        cur: node,
        queue: [...queue],
        visited: [...visited],
        frontier: [...seen].filter((n) => !visited.has(n)),
        treeEdges: [...tree],
        caption: `Add unvisited neighbours of ${node} to the queue: ${newlyAdded.join(', ')}.`,
      });
    } else {
      steps.push({
        kind: 'noop',
        cur: node,
        queue: [...queue],
        visited: [...visited],
        frontier: [...seen].filter((n) => !visited.has(n)),
        treeEdges: [...tree],
        caption: `${node} has no unvisited neighbours. Move on.`,
      });
    }
  }

  steps.push({
    kind: 'done',
    cur: null,
    queue: [],
    visited: [...visited],
    frontier: [],
    treeEdges: [...tree],
    caption: `Queue empty. BFS complete — visited ${visited.size} of ${NODES.length} nodes.`,
  });

  return steps;
}

const edgeKey = (u, v) => (u < v ? `${u}-${v}` : `${v}-${u}`);

export default function BFSViz() {
  const [start, setStart] = useState('A');
  const steps = useMemo(() => buildSteps(start), [start]);
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
    }, 900);
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
    NODES.forEach((n) => { map[n.id] = 'unvisited'; });
    step.frontier.forEach((n) => { map[n] = 'frontier'; });
    step.visited.forEach((n) => { map[n] = 'visited'; });
    if (step.cur) map[step.cur] = 'current';
    return map;
  }, [step]);

  const edgeState = useMemo(() => {
    const map = {};
    EDGES.forEach(([u, v]) => { map[edgeKey(u, v)] = 'idle'; });
    step.treeEdges.forEach((k) => { map[k] = 'tree'; });
    return map;
  }, [step]);

  const atEnd = idx >= steps.length - 1;

  return (
    <div className="bfsviz">
      <div className="bfsviz-header">
        <div className="bfsviz-title">BFS on a graph</div>
        <div className="bfsviz-start">
          <label htmlFor="bfsviz-start-select">Start</label>
          <select
            id="bfsviz-start-select"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          >
            {NODES.map((n) => (
              <option key={n.id} value={n.id}>{n.id}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bfsviz-legend">
        <span className="bfsviz-legend-item">
          <span className="bfsviz-dot bfsviz-dot-unvisited" /> unvisited
        </span>
        <span className="bfsviz-legend-item">
          <span className="bfsviz-dot bfsviz-dot-frontier" /> in queue
        </span>
        <span className="bfsviz-legend-item">
          <span className="bfsviz-dot bfsviz-dot-current" /> processing
        </span>
        <span className="bfsviz-legend-item">
          <span className="bfsviz-dot bfsviz-dot-visited" /> visited
        </span>
      </div>

      <div className="bfsviz-stage">
        <svg
          className="bfsviz-svg"
          viewBox="0 0 560 420"
          role="img"
          aria-label="Breadth-first search graph visualization"
        >
          <g className="bfsviz-edges">
            {EDGES.map(([u, v]) => {
              const a = NODES.find((n) => n.id === u);
              const b = NODES.find((n) => n.id === v);
              const k = edgeKey(u, v);
              const state = edgeState[k];
              return (
                <line
                  key={k}
                  className={`bfsviz-edge bfsviz-edge-${state}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                />
              );
            })}
          </g>
          <g className="bfsviz-nodes">
            {NODES.map((n) => {
              const state = nodeState[n.id];
              const isStart = n.id === start;
              return (
                <g
                  key={n.id}
                  className={`bfsviz-node bfsviz-node-${state}`}
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
                    <circle className="bfsviz-node-ring" r="28" />
                  )}
                  {state === 'frontier' && (
                    <circle className="bfsviz-node-pulse" r="26" />
                  )}
                  <circle className="bfsviz-node-circle" r="22" />
                  <text textAnchor="middle" dominantBaseline="central">{n.id}</text>
                  {isStart && (
                    <text
                      className="bfsviz-start-tag"
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

      <div className="bfsviz-status">
        <div className="bfsviz-status-row">
          <span className="bfsviz-status-label">Step</span>
          <span className="bfsviz-status-value">{idx} / {steps.length - 1}</span>
        </div>
        <div className="bfsviz-status-row">
          <span className="bfsviz-status-label">Processing</span>
          <span className="bfsviz-status-value">
            {step.cur ? step.cur : <span className="bfsviz-muted">—</span>}
          </span>
        </div>
      </div>

      <div className="bfsviz-queue">
        <div className="bfsviz-queue-label">Queue (front → back)</div>
        <div className="bfsviz-queue-chips">
          {step.queue.length === 0 ? (
            <span className="bfsviz-muted">empty</span>
          ) : (
            step.queue.map((id, i) => (
              <span
                key={`${id}-${i}`}
                className={`bfsviz-chip ${i === 0 ? 'bfsviz-chip-head' : ''}`}
              >
                {id}
              </span>
            ))
          )}
        </div>
      </div>

      <p className="bfsviz-caption">{step.caption}</p>

      <div className="bfsviz-controls">
        <button
          type="button"
          className="bfsviz-btn bfsviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="bfsviz-btn bfsviz-btn-primary"
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
          className="bfsviz-btn bfsviz-btn-secondary"
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
