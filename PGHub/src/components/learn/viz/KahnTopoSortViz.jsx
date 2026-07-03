import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, GitMerge } from 'lucide-react';
import './KahnTopoSortViz.css';

// A small course-prerequisite DAG. Edge u -> v means "u must come before v".
const NODES = [
  { id: 'A', x: 90, y: 90 },
  { id: 'B', x: 90, y: 230 },
  { id: 'C', x: 250, y: 60 },
  { id: 'D', x: 250, y: 200 },
  { id: 'E', x: 250, y: 330 },
  { id: 'F', x: 420, y: 120 },
  { id: 'G', x: 420, y: 280 },
  { id: 'H', x: 580, y: 200 },
];

const EDGES = [
  ['A', 'C'],
  ['A', 'D'],
  ['B', 'D'],
  ['B', 'E'],
  ['C', 'F'],
  ['D', 'F'],
  ['D', 'G'],
  ['E', 'G'],
  ['F', 'H'],
  ['G', 'H'],
];

const NODE_R = 22;

const OUT = (() => {
  const map = {};
  NODES.forEach((n) => { map[n.id] = []; });
  EDGES.forEach(([u, v]) => { map[u].push(v); });
  Object.values(map).forEach((l) => l.sort());
  return map;
})();

const edgeKey = (u, v) => `${u}-${v}`;

// Build the full step list for Kahn's algorithm. Each step captures the
// in-degree map, the ready queue (in-degree 0, not yet emitted), the emitted
// topo order, and which edge/node is highlighted this step.
function buildSteps() {
  const steps = [];
  const indeg = {};
  NODES.forEach((n) => { indeg[n.id] = 0; });
  EDGES.forEach(([, v]) => { indeg[v] += 1; });

  const order = [];
  const queue = NODES.filter((n) => indeg[n.id] === 0).map((n) => n.id).sort();

  const snap = (extra) => ({
    indeg: { ...indeg },
    queue: [...queue],
    order: [...order],
    cur: null,
    activeEdge: null,
    droppedNode: null,
    ...extra,
  });

  steps.push(snap({
    caption: `Count in-degrees, then seed the queue with every node whose in-degree is 0: ${queue.join(', ')}.`,
  }));

  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    steps.push(snap({
      cur: node,
      caption: `Pop ${node} from the queue (in-degree 0) and append it to the topological order.`,
    }));

    for (const nb of OUT[node]) {
      indeg[nb] -= 1;
      const becameReady = indeg[nb] === 0;
      if (becameReady) queue.push(nb);
      steps.push(snap({
        cur: node,
        activeEdge: edgeKey(node, nb),
        droppedNode: nb,
        caption: becameReady
          ? `Remove edge ${node}→${nb}: ${nb}'s in-degree drops to 0, so ${nb} joins the queue.`
          : `Remove edge ${node}→${nb}: ${nb}'s in-degree drops to ${indeg[nb]} (still has prerequisites).`,
      }));
    }
  }

  steps.push(snap({
    caption: order.length === NODES.length
      ? `Queue empty and all ${NODES.length} nodes emitted — a valid topological order exists.`
      : `Queue empty but only ${order.length}/${NODES.length} emitted — the remaining nodes form a cycle.`,
  }));

  return steps;
}

export default function KahnTopoSortViz() {
  const steps = useMemo(() => buildSteps(), []);
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  const step = steps[idx];
  const playing = playingRaw && idx < steps.length - 1;
  const atEnd = idx >= steps.length - 1;
  const delay = Math.round(950 / speed);

  const next = useCallback(() => {
    setIdx((i) => (i >= steps.length - 1 ? i : i + 1));
  }, [steps.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(next, delay);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, next, delay]);

  const handleReset = () => { setPlaying(false); setIdx(0); };

  const orderSet = useMemo(() => new Set(step.order), [step.order]);
  const queueSet = useMemo(() => new Set(step.queue), [step.queue]);

  const nodeState = (id) => {
    if (step.cur === id) return 'current';
    if (orderSet.has(id)) return 'emitted';
    if (queueSet.has(id)) return 'ready';
    return 'pending';
  };

  return (
    <div className="ktsviz">
      <div className="ktsviz-header">
        <div className="ktsviz-title">
          <GitMerge size={16} />
          <span>Kahn&apos;s topological sort</span>
        </div>
        <div className="ktsviz-step">step {idx} / {steps.length - 1}</div>
      </div>

      <div className="ktsviz-legend">
        <span className="ktsviz-legend-item">
          <span className="ktsviz-dot ktsviz-dot-pending" /> waiting (in-degree &gt; 0)
        </span>
        <span className="ktsviz-legend-item">
          <span className="ktsviz-dot ktsviz-dot-ready" /> in queue (in-degree 0)
        </span>
        <span className="ktsviz-legend-item">
          <span className="ktsviz-dot ktsviz-dot-current" /> emitting now
        </span>
        <span className="ktsviz-legend-item">
          <span className="ktsviz-dot ktsviz-dot-emitted" /> in topo order
        </span>
      </div>

      <div className="ktsviz-stage">
        <svg
          className="ktsviz-svg"
          viewBox="0 0 670 400"
          role="img"
          aria-label="Kahn's topological sort on a directed acyclic graph"
        >
          <defs>
            <marker
              id="ktsviz-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="ktsviz-arrow-head" />
            </marker>
            <marker
              id="ktsviz-arrow-active"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="ktsviz-arrow-head-active" />
            </marker>
          </defs>

          <g className="ktsviz-edges">
            {EDGES.map(([u, v]) => {
              const a = NODES.find((n) => n.id === u);
              const b = NODES.find((n) => n.id === v);
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.hypot(dx, dy) || 1;
              const ux = dx / len;
              const uy = dy / len;
              const x1 = a.x + ux * NODE_R;
              const y1 = a.y + uy * NODE_R;
              const x2 = b.x - ux * (NODE_R + 4);
              const y2 = b.y - uy * (NODE_R + 4);
              const k = edgeKey(u, v);
              const active = step.activeEdge === k;
              const consumed = orderSet.has(u);
              const cls = active ? 'active' : consumed ? 'consumed' : 'idle';
              return (
                <line
                  key={k}
                  className={`ktsviz-edge ktsviz-edge-${cls}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  markerEnd={active ? 'url(#ktsviz-arrow-active)' : 'url(#ktsviz-arrow)'}
                />
              );
            })}
          </g>

          <g className="ktsviz-nodes">
            {NODES.map((n) => {
              const state = nodeState(n.id);
              const dropped = step.droppedNode === n.id;
              const orderPos = step.order.indexOf(n.id);
              return (
                <g
                  key={n.id}
                  className={`ktsviz-node ktsviz-node-${state}`}
                  transform={`translate(${n.x},${n.y})`}
                  aria-label={`Node ${n.id}, in-degree ${step.indeg[n.id]}, ${state}`}
                >
                  {state === 'current' && <circle className="ktsviz-node-ring" r={NODE_R + 6} />}
                  {dropped && <circle className="ktsviz-node-pulse" r={NODE_R + 4} />}
                  <circle className="ktsviz-node-circle" r={NODE_R} />
                  <text className="ktsviz-node-label" textAnchor="middle" dominantBaseline="central">{n.id}</text>
                  <g className="ktsviz-badge" transform={`translate(${NODE_R - 4},${-NODE_R + 4})`}>
                    <circle className="ktsviz-badge-bg" r="11" />
                    <text className="ktsviz-badge-text" textAnchor="middle" dominantBaseline="central">
                      {step.indeg[n.id]}
                    </text>
                  </g>
                  {orderPos >= 0 && (
                    <text className="ktsviz-order-tag" x="0" y={NODE_R + 14} textAnchor="middle">
                      #{orderPos + 1}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="ktsviz-panels">
        <div className="ktsviz-panel">
          <div className="ktsviz-panel-label">Ready queue (in-degree 0)</div>
          <div className="ktsviz-chips">
            {step.queue.length === 0 ? (
              <span className="ktsviz-muted">empty</span>
            ) : (
              step.queue.map((id, i) => (
                <span key={`${id}-${i}`} className={`ktsviz-chip ${i === 0 ? 'ktsviz-chip-head' : ''}`}>
                  {id}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="ktsviz-panel">
          <div className="ktsviz-panel-label">Topological order</div>
          <div className="ktsviz-chips">
            {step.order.length === 0 ? (
              <span className="ktsviz-muted">none yet</span>
            ) : (
              step.order.map((id, i) => (
                <span key={`${id}-${i}`} className="ktsviz-chip ktsviz-chip-order">
                  {id}
                  {i < step.order.length - 1 && <span className="ktsviz-arrow-sep">{'→'}</span>}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="ktsviz-indeg">
        <div className="ktsviz-panel-label">In-degree map</div>
        <div className="ktsviz-indeg-row">
          {NODES.map((n) => {
            const zero = step.indeg[n.id] === 0 && !orderSet.has(n.id);
            const done = orderSet.has(n.id);
            return (
              <div key={n.id} className={`ktsviz-indeg-cell ${zero ? 'is-zero' : ''} ${done ? 'is-done' : ''}`}>
                <span className="ktsviz-indeg-key">{n.id}</span>
                <span className="ktsviz-indeg-val">{step.indeg[n.id]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="ktsviz-caption">{step.caption}</p>

      <div className="ktsviz-controls">
        <button type="button" className="ktsviz-btn ktsviz-btn-secondary" onClick={handleReset} aria-label="Reset">
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="ktsviz-btn ktsviz-btn-primary"
          onClick={() => {
            if (atEnd) { setIdx(0); setPlaying(true); return; }
            setPlaying((p) => !p);
          }}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button type="button" className="ktsviz-btn ktsviz-btn-secondary" onClick={next} disabled={atEnd} aria-label="Step">
          <SkipForward size={16} />
          <span>Step</span>
        </button>
        <label className="ktsviz-speed">
          <span className="ktsviz-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ktsviz-speed-range"
          />
          <span className="ktsviz-speed-value">{speed.toFixed(1)}×</span>
        </label>
      </div>
    </div>
  );
}
