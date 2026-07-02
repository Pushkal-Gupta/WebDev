import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';
import './DFSViz.css';

// Hardcoded graph — same shape as BFSViz: 7 nodes, undirected.
// Positions placed by hand on a 520x360 viewBox for a balanced layout.
const NODES = [
  { id: 'A', x: 80,  y: 60  },
  { id: 'B', x: 220, y: 50  },
  { id: 'C', x: 360, y: 90  },
  { id: 'D', x: 460, y: 200 },
  { id: 'E', x: 340, y: 290 },
  { id: 'F', x: 180, y: 280 },
  { id: 'G', x: 60,  y: 200 },
];

const EDGES = [
  ['A', 'B'],
  ['A', 'G'],
  ['B', 'C'],
  ['B', 'F'],
  ['C', 'D'],
  ['C', 'E'],
  ['D', 'E'],
  ['E', 'F'],
  ['F', 'G'],
];

// Build adjacency list. Neighbour order matters for DFS — keep insertion order.
function buildAdj() {
  const adj = Object.fromEntries(NODES.map(n => [n.id, []]));
  for (const [a, b] of EDGES) {
    adj[a].push(b);
    adj[b].push(a);
  }
  return adj;
}

// Run the full iterative DFS upfront and capture every step as a frame.
// Each frame records: visited set, stack contents, current node, discovery edges so far,
// the edge under inspection (if any), and a caption.
function computeFrames(start) {
  const adj = buildAdj();
  const visited = new Set();
  const stack = [start];
  const discovery = new Set(); // canonical "min|max" edge keys
  const frames = [];

  const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  const push = (current, inspectingEdge, caption) => {
    frames.push({
      visited: new Set(visited),
      stack: [...stack],
      current,
      discovery: new Set(discovery),
      inspectingEdge,
      caption,
    });
  };

  push(start, null, `Push start node ${start} onto stack`);

  while (stack.length) {
    const u = stack.pop();
    push(u, null, `Pop ${u} from stack`);
    if (visited.has(u)) {
      push(u, null, `${u} already visited — skip`);
      continue;
    }
    visited.add(u);
    push(u, null, `Mark ${u} as visited`);

    // Push unvisited neighbours in reverse so the leftmost is processed first.
    const neighbours = [...adj[u]].reverse();
    for (const v of neighbours) {
      const ek = edgeKey(u, v);
      push(u, ek, `Inspect edge ${u} — ${v}`);
      if (visited.has(v)) {
        push(u, ek, `${v} already visited — ignore`);
        continue;
      }
      if (stack.includes(v)) {
        // Already queued; refresh it to top so deepest-first ordering holds.
        const idx = stack.indexOf(v);
        stack.splice(idx, 1);
      }
      stack.push(v);
      discovery.add(ek);
      push(u, ek, `Push ${v} onto stack (discovery edge ${u} — ${v})`);
    }
  }

  push(null, null, 'Stack empty — DFS complete');
  return frames;
}

export default function DFSViz() {
  const [start, setStart] = useState('A');
  const [step, setStep] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const frames = useMemo(() => computeFrames(start), [start]);
  const safeStep = Math.min(step, frames.length - 1);
  const frame = frames[safeStep];
  // Derive `playing` from the raw toggle + bounds so the auto-run effect never
  // needs to call setPlaying(false) when we hit the end.
  const playing = playingRaw && safeStep < frames.length - 1;

  // Reset cursor whenever the start node (and therefore frames) changes.
  const [prevStart, setPrevStart] = useState(start);
  if (prevStart !== start) {
    setPrevStart(start);
    setStep(0);
    setPlaying(false);
  }

  // Auto-advance loop. Stops at the final frame.
  useEffect(() => {
    if (!playing) return;
    timer.current = setTimeout(() => setStep(s => s + 1), Math.round(700 / speed));
    return () => clearTimeout(timer.current);
  }, [playing, frames.length, safeStep, speed]);

  const handleStep = () => {
    setPlaying(false);
    setStep(s => Math.min(s + 1, frames.length - 1));
  };
  const handleReset = () => {
    setPlaying(false);
    setStep(0);
  };
  const togglePlay = () => {
    if (safeStep >= frames.length - 1) setStep(0);
    setPlaying(p => !p);
  };

  const stateFor = (id) => {
    if (frame.current === id) return 'current';
    if (frame.visited.has(id)) return 'visited';
    if (frame.stack.includes(id)) return 'stack';
    return 'unvisited';
  };

  const edgeStateFor = (a, b) => {
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (frame.inspectingEdge === k) return 'inspecting';
    if (frame.discovery.has(k)) return 'tree';
    return 'idle';
  };

  return (
    <div className="dfsviz">
      <div className="dfsviz-header">
        <div className="dfsviz-title">
          <span className="dfsviz-title-main">Depth-first search</span>
          <span className="dfsviz-title-sub">iterative, explicit stack</span>
        </div>
        <div className="dfsviz-start">
          <label htmlFor="dfsviz-start-select">Start node</label>
          <select
            id="dfsviz-start-select"
            className="dfsviz-select"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          >
            {NODES.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
          </select>
        </div>
      </div>

      <div className="dfsviz-canvas">
        <svg className="dfsviz-svg" viewBox="0 0 520 360" role="img" aria-label="DFS graph">
          <defs>
            <marker id="dfsviz-arrow-tree" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6">
              <path d="M0,0 L10,5 L0,10 z" className="dfsviz-arrow-tree" />
            </marker>
          </defs>

          {EDGES.map(([a, b]) => {
            const na = NODES.find(n => n.id === a);
            const nb = NODES.find(n => n.id === b);
            const s = edgeStateFor(a, b);
            return (
              <line
                key={`${a}-${b}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                className={`dfsviz-edge dfsviz-edge-${s}`}
              />
            );
          })}

          {NODES.map(n => {
            const s = stateFor(n.id);
            return (
              <g key={n.id} className={`dfsviz-node dfsviz-node-${s}`}>
                {s === 'current' && (
                  <circle cx={n.x} cy={n.y} r={26} className="dfsviz-node-ring" />
                )}
                <circle cx={n.x} cy={n.y} r={20} className="dfsviz-node-disc" />
                <text x={n.x} y={n.y} dy=".34em" textAnchor="middle" className="dfsviz-node-label">
                  {n.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dfsviz-caption">{frame.caption}</div>

      <div className="dfsviz-stack-row">
        <div className="dfsviz-stack-label">
          <span className="dfsviz-stack-label-main">Stack</span>
          <span className="dfsviz-stack-label-sub">top &rarr; right</span>
        </div>
        <div className="dfsviz-stack-chips">
          {frame.stack.length === 0
            ? <div className="dfsviz-stack-empty">empty</div>
            : frame.stack.map((id, i) => (
              <div
                key={`${id}-${i}`}
                className={`dfsviz-chip ${i === frame.stack.length - 1 ? 'dfsviz-chip-top' : ''}`}
              >
                {id}
              </div>
            ))}
        </div>
      </div>

      <div className="dfsviz-meters">
        <div className="dfsviz-meter">
          <div className="dfsviz-meter-key">Step</div>
          <div className="dfsviz-meter-val">{safeStep + 1} / {frames.length}</div>
        </div>
        <div className="dfsviz-meter">
          <div className="dfsviz-meter-key">Current</div>
          <div className="dfsviz-meter-val">{frame.current ?? '—'}</div>
        </div>
        <div className="dfsviz-meter">
          <div className="dfsviz-meter-key">Visited</div>
          <div className="dfsviz-meter-val">{frame.visited.size} / {NODES.length}</div>
        </div>
        <div className="dfsviz-meter">
          <div className="dfsviz-meter-key">Tree edges</div>
          <div className="dfsviz-meter-val">{frame.discovery.size}</div>
        </div>
      </div>

      <div className="dfsviz-controls">
        <button type="button" className="dfsviz-btn dfsviz-btn-primary" onClick={togglePlay}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : safeStep >= frames.length - 1 ? 'Replay' : 'Run'}
        </button>
        <button
          type="button"
          className="dfsviz-btn"
          onClick={handleStep}
          disabled={safeStep >= frames.length - 1}
        >
          <StepForward size={14} />
          Step
        </button>
        <button type="button" className="dfsviz-btn" onClick={handleReset}>
          <RotateCcw size={14} />
          Reset
        </button>
        <label className="dfsviz-speed">
          <span className="dfsviz-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dfsviz-speed-range"
            aria-label="Playback speed"
          />
          <span className="dfsviz-speed-value">{speed.toFixed(1)}×</span>
        </label>
      </div>

      <div className="dfsviz-legend">
        <span className="dfsviz-legend-item"><span className="dfsviz-swatch dfsviz-swatch-unvisited" />unvisited</span>
        <span className="dfsviz-legend-item"><span className="dfsviz-swatch dfsviz-swatch-stack" />on stack</span>
        <span className="dfsviz-legend-item"><span className="dfsviz-swatch dfsviz-swatch-current" />current</span>
        <span className="dfsviz-legend-item"><span className="dfsviz-swatch dfsviz-swatch-visited" />visited</span>
        <span className="dfsviz-legend-item"><span className="dfsviz-swatch-line dfsviz-swatch-tree" />discovery edge</span>
      </div>
    </div>
  );
}
