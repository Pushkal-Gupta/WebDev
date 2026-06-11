import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import './BFSvsDFSViz.css';

// Tree-like graph (10 nodes), the same on both sides.
// Coordinates are chosen so BFS levels read as visible "rings" outward from A,
// and DFS path reads as a spine plunging into the leftmost branch first.
const NODES = [
  { id: 'A', x: 260, y: 60,  ring: 0 },
  { id: 'B', x: 130, y: 150, ring: 1 },
  { id: 'C', x: 260, y: 150, ring: 1 },
  { id: 'D', x: 390, y: 150, ring: 1 },
  { id: 'E', x: 70,  y: 260, ring: 2 },
  { id: 'F', x: 190, y: 260, ring: 2 },
  { id: 'G', x: 320, y: 260, ring: 2 },
  { id: 'H', x: 450, y: 260, ring: 2 },
  { id: 'I', x: 130, y: 360, ring: 3 },
  { id: 'J', x: 380, y: 360, ring: 3 },
];

// Tree edges only (a clean tree, 9 edges for 10 nodes). Children listed in
// alphabetical order so neighbour iteration is deterministic.
const EDGES = [
  ['A', 'B'],
  ['A', 'C'],
  ['A', 'D'],
  ['B', 'E'],
  ['B', 'F'],
  ['C', 'G'],
  ['D', 'H'],
  ['E', 'I'],
  ['G', 'J'],
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

const edgeKey = (u, v) => (u < v ? `${u}-${v}` : `${v}-${u}`);

// ---------- BFS step builder ----------
function buildBFSSteps(start) {
  const steps = [];
  const visited = new Set();
  const order = [];
  const queue = [start];
  const seen = new Set([start]);
  const tree = new Set();

  steps.push({
    kind: 'init',
    cur: null,
    container: [...queue],
    visited: [...visited],
    frontier: [...seen],
    order: [...order],
    treeEdges: [...tree],
    caption: `Enqueue ${start}. The frontier holds nodes waiting to be processed.`,
  });

  while (queue.length) {
    const node = queue.shift();
    visited.add(node);
    order.push(node);
    steps.push({
      kind: 'visit',
      cur: node,
      container: [...queue],
      visited: [...visited],
      frontier: [...seen].filter((n) => !visited.has(n)),
      order: [...order],
      treeEdges: [...tree],
      caption: `Dequeue ${node} (front of queue). Mark visited.`,
    });

    const added = [];
    for (const nb of ADJ[node]) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
        added.push(nb);
        tree.add(edgeKey(node, nb));
      }
    }
    if (added.length) {
      steps.push({
        kind: 'expand',
        cur: node,
        container: [...queue],
        visited: [...visited],
        frontier: [...seen].filter((n) => !visited.has(n)),
        order: [...order],
        treeEdges: [...tree],
        caption: `Enqueue unseen neighbours of ${node}: ${added.join(', ')}.`,
      });
    }
  }

  steps.push({
    kind: 'done',
    cur: null,
    container: [],
    visited: [...visited],
    frontier: [],
    order: [...order],
    treeEdges: [...tree],
    caption: `Queue empty. BFS visited ${visited.size} nodes in level order.`,
  });

  return steps;
}

// ---------- DFS step builder (iterative, neighbours pushed in reverse) ----------
function buildDFSSteps(start) {
  const steps = [];
  const visited = new Set();
  const order = [];
  const stack = [start];
  const tree = new Set();
  const onStack = new Set([start]);

  steps.push({
    kind: 'init',
    cur: null,
    container: [...stack],
    visited: [...visited],
    frontier: [...onStack],
    order: [...order],
    treeEdges: [...tree],
    caption: `Push ${start} onto the stack. DFS plunges down the first branch it finds.`,
  });

  while (stack.length) {
    const node = stack.pop();
    onStack.delete(node);
    if (visited.has(node)) continue;
    visited.add(node);
    order.push(node);
    steps.push({
      kind: 'visit',
      cur: node,
      container: [...stack],
      visited: [...visited],
      frontier: [...onStack],
      order: [...order],
      treeEdges: [...tree],
      caption: `Pop ${node} (top of stack). Mark visited.`,
    });

    const added = [];
    // Push in reverse so the first alphabetical neighbour pops first.
    const neighbours = [...ADJ[node]].reverse();
    for (const nb of neighbours) {
      if (!visited.has(nb) && !onStack.has(nb)) {
        stack.push(nb);
        onStack.add(nb);
        added.push(nb);
        tree.add(edgeKey(node, nb));
      }
    }
    if (added.length) {
      steps.push({
        kind: 'expand',
        cur: node,
        container: [...stack],
        visited: [...visited],
        frontier: [...onStack],
        order: [...order],
        treeEdges: [...tree],
        caption: `Push unseen neighbours of ${node}: ${added.slice().reverse().join(', ')}. Top of stack goes next.`,
      });
    }
  }

  steps.push({
    kind: 'done',
    cur: null,
    container: [],
    visited: [...visited],
    frontier: [],
    order: [...order],
    treeEdges: [...tree],
    caption: `Stack empty. DFS visited ${visited.size} nodes in depth-first order.`,
  });

  return steps;
}

// ---------- One panel (BFS or DFS) ----------
function TraversalPanel({ kind, step, start }) {
  const isBFS = kind === 'bfs';
  const containerLabel = isBFS ? 'Queue (front → back)' : 'Stack (bottom → top)';

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

  // BFS ring overlay: shows the current "wave" being explored.
  const activeRing = useMemo(() => {
    if (!isBFS) return null;
    if (!step.visited.length && !step.cur) return 0;
    const visitedNodes = NODES.filter((n) => step.visited.includes(n.id));
    if (!visitedNodes.length) return 0;
    return Math.max(...visitedNodes.map((n) => n.ring));
  }, [isBFS, step]);

  const container = step.container;

  return (
    <div className={`bvd-panel bvd-panel-${kind}`}>
      <div className="bvd-panel-head">
        <div className="bvd-panel-title">
          <span className={`bvd-tag bvd-tag-${kind}`}>{isBFS ? 'BFS' : 'DFS'}</span>
          <span className="bvd-panel-sub">{isBFS ? 'Queue · level-by-level' : 'Stack · dive-first'}</span>
        </div>
        <div className="bvd-panel-meta">
          <span className="bvd-meta-label">start</span>
          <span className="bvd-meta-value">{start}</span>
        </div>
      </div>

      <div className="bvd-stage">
        <svg
          className="bvd-svg"
          viewBox="0 0 520 420"
          role="img"
          aria-label={isBFS ? 'BFS traversal frame' : 'DFS traversal frame'}
        >
          {isBFS && (
            <g className="bvd-rings">
              {[1, 2, 3].map((r) => (
                <ellipse
                  key={r}
                  cx={260}
                  cy={60}
                  rx={140 + (r - 1) * 70}
                  ry={90 + (r - 1) * 70}
                  className={`bvd-ring ${activeRing >= r ? 'bvd-ring-active' : ''}`}
                />
              ))}
            </g>
          )}
          {!isBFS && step.cur && (
            <g className="bvd-spine">
              {(() => {
                const path = [];
                let cur = step.cur;
                while (cur) {
                  path.push(cur);
                  const parentEdge = [...step.treeEdges].find((k) => {
                    const [a, b] = k.split('-');
                    return (a === cur || b === cur);
                  });
                  if (!parentEdge) break;
                  // Walk only edges that go toward an already-visited ancestor.
                  // Approximate by picking the visited neighbour with the smallest order index.
                  const nb = parentEdge.split('-').find((x) => x !== cur);
                  if (!nb) break;
                  if (path.includes(nb)) break;
                  if (!step.visited.includes(nb)) break;
                  if (step.order.indexOf(nb) >= step.order.indexOf(cur)) break;
                  path.push(nb);
                  cur = nb;
                  if (path.length > NODES.length) break;
                }
                if (path.length < 2) return null;
                const points = path
                  .map((id) => NODES.find((n) => n.id === id))
                  .map((n) => `${n.x},${n.y}`)
                  .join(' ');
                return <polyline className="bvd-spine-line" points={points} />;
              })()}
            </g>
          )}

          <g className="bvd-edges">
            {EDGES.map(([u, v]) => {
              const a = NODES.find((n) => n.id === u);
              const b = NODES.find((n) => n.id === v);
              const k = edgeKey(u, v);
              const state = edgeState[k];
              return (
                <line
                  key={k}
                  className={`bvd-edge bvd-edge-${state}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                />
              );
            })}
          </g>

          <g className="bvd-nodes">
            {NODES.map((n) => {
              const state = nodeState[n.id];
              const orderIdx = step.order.indexOf(n.id);
              const isStart = n.id === start;
              return (
                <g
                  key={n.id}
                  className={`bvd-node bvd-node-${state}`}
                  transform={`translate(${n.x},${n.y})`}
                >
                  {state === 'current' && (
                    <circle className="bvd-node-ring" r="26" />
                  )}
                  {state === 'frontier' && (
                    <circle className="bvd-node-pulse" r="24" />
                  )}
                  <circle className="bvd-node-circle" r="20" />
                  <text
                    className="bvd-node-label"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {n.id}
                  </text>
                  {orderIdx >= 0 && (
                    <text
                      className="bvd-node-order"
                      x="18"
                      y="-15"
                      textAnchor="middle"
                    >
                      {orderIdx + 1}
                    </text>
                  )}
                  {isStart && (
                    <text
                      className="bvd-start-tag"
                      x="0"
                      y="36"
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

      <div className="bvd-row">
        <div className="bvd-row-label">{containerLabel}</div>
        <div className="bvd-chips">
          {container.length === 0 ? (
            <span className="bvd-muted">empty</span>
          ) : (
            container.map((id, i) => {
              const isHead = isBFS ? i === 0 : i === container.length - 1;
              return (
                <span
                  key={`${id}-${i}`}
                  className={`bvd-chip bvd-chip-${kind} ${isHead ? 'bvd-chip-head' : ''}`}
                >
                  {id}
                </span>
              );
            })
          )}
        </div>
      </div>

      <div className="bvd-row">
        <div className="bvd-row-label">Visited set</div>
        <div className="bvd-chips">
          {step.visited.length === 0 ? (
            <span className="bvd-muted">empty</span>
          ) : (
            step.visited.map((id) => (
              <span key={id} className="bvd-chip bvd-chip-visited">{id}</span>
            ))
          )}
        </div>
      </div>

      <p className="bvd-caption">{step.caption}</p>
    </div>
  );
}

// ---------- Main side-by-side component ----------
export default function BFSvsDFSViz() {
  const [start, setStart] = useState('A');
  const bfsSteps = useMemo(() => buildBFSSteps(start), [start]);
  const dfsSteps = useMemo(() => buildDFSSteps(start), [start]);
  const [bfsIdx, setBfsIdx] = useState(0);
  const [dfsIdx, setDfsIdx] = useState(0);
  const [racingRaw, setRacing] = useState(false);
  const timerRef = useRef(null);

  const [prevStart, setPrevStart] = useState(start);
  if (prevStart !== start) {
    setPrevStart(start);
    setBfsIdx(0);
    setDfsIdx(0);
    setRacing(false);
  }

  const bfsStep = bfsSteps[bfsIdx];
  const dfsStep = dfsSteps[dfsIdx];
  const bfsAtEnd = bfsIdx >= bfsSteps.length - 1;
  const dfsAtEnd = dfsIdx >= dfsSteps.length - 1;
  const bothAtEnd = bfsAtEnd && dfsAtEnd;
  // Derive racing so the timer effect never has to call setRacing(false) on completion.
  const racing = racingRaw && !bothAtEnd;

  const stepBoth = useCallback(() => {
    setBfsIdx((i) => (i < bfsSteps.length - 1 ? i + 1 : i));
    setDfsIdx((i) => (i < dfsSteps.length - 1 ? i + 1 : i));
  }, [bfsSteps.length, dfsSteps.length]);

  useEffect(() => {
    if (!racing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setBfsIdx((i) => (i < bfsSteps.length - 1 ? i + 1 : i));
      setDfsIdx((i) => (i < dfsSteps.length - 1 ? i + 1 : i));
    }, 750);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [racing, bfsSteps.length, dfsSteps.length]);

  const handleReset = () => {
    setRacing(false);
    setBfsIdx(0);
    setDfsIdx(0);
  };

  const handleRaceToggle = () => {
    if (bothAtEnd) {
      setBfsIdx(0);
      setDfsIdx(0);
      setRacing(true);
      return;
    }
    setRacing((r) => !r);
  };

  return (
    <div className="bvd">
      <div className="bvd-header">
        <div className="bvd-title">BFS vs DFS · same graph, same source</div>
        <div className="bvd-start-picker">
          <label htmlFor="bvd-start-select">Start node</label>
          <select
            id="bvd-start-select"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          >
            {NODES.map((n) => (
              <option key={n.id} value={n.id}>{n.id}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bvd-legend">
        <span className="bvd-legend-item">
          <span className="bvd-dot bvd-dot-unvisited" /> unvisited
        </span>
        <span className="bvd-legend-item">
          <span className="bvd-dot bvd-dot-frontier" /> in queue / on stack
        </span>
        <span className="bvd-legend-item">
          <span className="bvd-dot bvd-dot-current" /> processing
        </span>
        <span className="bvd-legend-item">
          <span className="bvd-dot bvd-dot-visited" /> visited
        </span>
        <span className="bvd-legend-item">
          <span className="bvd-dot bvd-dot-tree" /> discovery edge
        </span>
      </div>

      <div className="bvd-grid">
        <TraversalPanel kind="bfs" step={bfsStep} start={start} />
        <TraversalPanel kind="dfs" step={dfsStep} start={start} />
      </div>

      <div className="bvd-progress">
        <div className="bvd-progress-cell">
          <span className="bvd-progress-label">BFS step</span>
          <span className="bvd-progress-value">{bfsIdx} / {bfsSteps.length - 1}</span>
        </div>
        <div className="bvd-progress-cell">
          <span className="bvd-progress-label">DFS step</span>
          <span className="bvd-progress-value">{dfsIdx} / {dfsSteps.length - 1}</span>
        </div>
      </div>

      <div className="bvd-controls">
        <button
          type="button"
          className="bvd-btn bvd-btn-secondary"
          onClick={handleReset}
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="bvd-btn bvd-btn-secondary"
          onClick={stepBoth}
          disabled={bothAtEnd}
        >
          <SkipForward size={16} />
          <span>Step both</span>
        </button>
        <button
          type="button"
          className="bvd-btn bvd-btn-primary"
          onClick={handleRaceToggle}
        >
          {racing ? <Pause size={16} /> : <Play size={16} />}
          <span>{racing ? 'Pause race' : bothAtEnd ? 'Replay race' : 'Race'}</span>
        </button>
      </div>

      {bothAtEnd && (
        <div className="bvd-summary">
          <div className="bvd-summary-card bvd-summary-bfs">
            <div className="bvd-summary-head">
              <span className="bvd-tag bvd-tag-bfs">BFS</span>
              <span className="bvd-summary-label">traversal order</span>
            </div>
            <ol className="bvd-summary-list">
              {bfsStep.order.map((id, i) => (
                <li key={`bfs-${id}-${i}`}>
                  <span className="bvd-summary-idx">{i + 1}</span>
                  <span className="bvd-summary-id">{id}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="bvd-summary-card bvd-summary-dfs">
            <div className="bvd-summary-head">
              <span className="bvd-tag bvd-tag-dfs">DFS</span>
              <span className="bvd-summary-label">traversal order</span>
            </div>
            <ol className="bvd-summary-list">
              {dfsStep.order.map((id, i) => (
                <li key={`dfs-${id}-${i}`}>
                  <span className="bvd-summary-idx">{i + 1}</span>
                  <span className="bvd-summary-id">{id}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
