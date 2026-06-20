import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './DijkstraWithPathViz.css';

// Fixed weighted undirected graph: 7 nodes at hardcoded SVG coordinates.
const NODES = [
  { id: 'A', x: 90, y: 230 },
  { id: 'B', x: 250, y: 90 },
  { id: 'C', x: 250, y: 360 },
  { id: 'D', x: 440, y: 90 },
  { id: 'E', x: 440, y: 360 },
  { id: 'F', x: 620, y: 230 },
  { id: 'G', x: 440, y: 230 },
];

const EDGES = [
  { u: 'A', v: 'B', w: 4 },
  { u: 'A', v: 'C', w: 2 },
  { u: 'B', v: 'D', w: 5 },
  { u: 'B', v: 'G', w: 6 },
  { u: 'C', v: 'E', w: 7 },
  { u: 'C', v: 'G', w: 3 },
  { u: 'D', v: 'F', w: 4 },
  { u: 'D', v: 'G', w: 1 },
  { u: 'E', v: 'F', w: 5 },
  { u: 'E', v: 'G', w: 2 },
  { u: 'G', v: 'F', w: 8 },
];

const SOURCE = 'A';
const TARGET = 'F';

const NODE_POS = Object.fromEntries(NODES.map((n) => [n.id, n]));
const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const ADJ = (() => {
  const m = {};
  NODES.forEach((n) => {
    m[n.id] = [];
  });
  EDGES.forEach((e) => {
    m[e.u].push({ to: e.v, w: e.w });
    m[e.v].push({ to: e.u, w: e.w });
  });
  return m;
})();

const distStr = (d) => (d === Infinity ? '∞' : String(d));

function buildFrames() {
  const frames = [];
  const dist = {};
  const prev = {};
  const settled = new Set();
  const inFrontier = new Set();
  NODES.forEach((n) => {
    dist[n.id] = Infinity;
    prev[n.id] = null;
  });
  dist[SOURCE] = 0;
  inFrontier.add(SOURCE);

  const snap = (extra) => ({
    frontier: new Set(inFrontier),
    settled: new Set(settled),
    dist: { ...dist },
    prev: { ...prev },
    current: null,
    relaxedEdges: [],
    relaxedNodes: [],
    path: [],
    pathEdges: new Set(),
    pathCost: null,
    note: '',
    found: false,
    ...extra,
  });

  frames.push(
    snap({
      note: `Start at ${SOURCE} with dist=0; every other node is dist=∞. Frontier = {${SOURCE}}. Goal: cheapest route to ${TARGET}.`,
    }),
  );

  let reached = false;
  let safety = 0;

  while (inFrontier.size > 0 && safety < 200) {
    safety += 1;
    let bestK = null;
    let bestD = Infinity;
    for (const k of inFrontier) {
      if (dist[k] < bestD - 1e-9) {
        bestD = dist[k];
        bestK = k;
      }
    }
    inFrontier.delete(bestK);
    settled.add(bestK);

    if (bestK === TARGET) {
      const path = [];
      let p = TARGET;
      while (p !== null && p !== undefined) {
        path.push(p);
        p = prev[p];
      }
      path.reverse();
      const pathEdges = new Set();
      for (let i = 0; i + 1 < path.length; i += 1) pathEdges.add(edgeKey(path[i], path[i + 1]));
      frames.push(
        snap({
          current: bestK,
          path,
          pathEdges,
          pathCost: dist[TARGET],
          found: true,
          note: `Pop ${TARGET} dist=${dist[TARGET]} — target settled, so this is optimal. Backtrace via prev[]: ${path.join(' -> ')} (cost ${dist[TARGET]}).`,
        }),
      );
      reached = true;
      break;
    }

    const relaxedEdges = [];
    const relaxedNodes = [];
    const relaxNotes = [];
    for (const { to, w } of ADJ[bestK]) {
      if (settled.has(to)) continue;
      const cand = dist[bestK] + w;
      if (cand < dist[to]) {
        const before = distStr(dist[to]);
        prev[to] = bestK;
        dist[to] = cand;
        inFrontier.add(to);
        relaxedEdges.push(edgeKey(bestK, to));
        relaxedNodes.push(to);
        relaxNotes.push(`${to}: ${dist[bestK]}+${w}=${cand} < ${before}, prev[${to}]=${bestK}`);
      }
    }

    frames.push(
      snap({
        current: bestK,
        relaxedEdges,
        relaxedNodes,
        note: relaxNotes.length
          ? `Pop ${bestK} dist=${dist[bestK]} (smallest in frontier); relax ${relaxNotes.join('; ')}.`
          : `Pop ${bestK} dist=${dist[bestK]}; no neighbour improves (all settled or no shorter path).`,
      }),
    );
  }

  if (!reached) {
    frames.push(snap({ note: `Frontier drained without reaching ${TARGET}.` }));
  }

  return frames;
}

const NODE_R = 22;

export default function DijkstraWithPathViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

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
  const H = 470;
  const GW = 700;
  const panelX = GW + 24;
  const panelW = W - panelX - 16;

  const relaxedEdgeSet = useMemo(() => new Set(current.relaxedEdges), [current.relaxedEdges]);
  const relaxedNodeSet = useMemo(() => new Set(current.relaxedNodes), [current.relaxedNodes]);

  const nodeFill = (id) => {
    if (current.path.includes(id)) return 'var(--accent)';
    if (id === current.current) return 'var(--hue-pink)';
    if (id === SOURCE) return 'var(--easy)';
    if (id === TARGET) return 'var(--hard)';
    if (relaxedNodeSet.has(id)) return 'var(--hue-mint)';
    if (current.frontier.has(id)) return 'rgba(var(--accent-rgb), 0.20)';
    if (current.settled.has(id)) return 'rgba(var(--accent-rgb), 0.08)';
    return 'var(--surface)';
  };

  const nodeLabelDark = (id) =>
    current.path.includes(id) || id === current.current || id === SOURCE || id === TARGET;

  const edgeStroke = (k) => {
    if (current.pathEdges.has(k)) return 'var(--accent)';
    if (relaxedEdgeSet.has(k)) return 'var(--hue-mint)';
    return 'var(--border)';
  };
  const edgeWidth = (k) => {
    if (current.pathEdges.has(k)) return 4;
    if (relaxedEdgeSet.has(k)) return 3;
    return 1.5;
  };

  const cur = current.current;
  const curD = cur ? distStr(current.dist[cur]) : null;
  const pathText = current.path.length ? current.path.join(' -> ') : '—';

  return (
    <div className="dpv">
      <div className="dpv-head">
        <h3 className="dpv-title">Dijkstra with path reconstruction — shortest route on a weighted graph</h3>
        <p className="dpv-sub">
          Each step pops the unsettled node with the smallest dist, relaxes its edges
          (dist[v] = min(dist[v], dist[u]+w)), and records prev[v]=u on every improvement. When {TARGET} is settled,
          prev[] is walked back to {SOURCE} to rebuild the path.
        </p>
      </div>

      <div className="dpv-controls">
        <div className="dpv-actions">
          <div className="dpv-buttons">
            <button
              type="button"
              className="dpv-btn dpv-btn-primary"
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
              className="dpv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="dpv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="dpv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="dpv-speed">
            <span className="dpv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="dpv-speed-range"
            />
            <span className="dpv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="dpv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="dpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dpv-svg" preserveAspectRatio="xMidYMid meet">
          <text x={24} y={24} className="dpv-row-label">
            weighted graph — number on a node = dist so far
          </text>

          {EDGES.map((e) => {
            const k = edgeKey(e.u, e.v);
            const a = NODE_POS[e.u];
            const b = NODE_POS[e.v];
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <g key={`edge-${k}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={edgeStroke(k)}
                  strokeWidth={edgeWidth(k)}
                />
                <rect x={mx - 11} y={my - 10} width={22} height={18} rx={4} fill="var(--bg)" stroke="var(--border)" strokeWidth={1} />
                <text x={mx} y={my + 3} className="dpv-edge-w">
                  {e.w}
                </text>
              </g>
            );
          })}

          {NODES.map((n) => {
            const fill = nodeFill(n.id);
            const dark = nodeLabelDark(n.id);
            const d = distStr(current.dist[n.id]);
            const isCur = n.id === current.current;
            return (
              <g key={`node-${n.id}`}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={NODE_R}
                  fill={fill}
                  stroke={isCur ? 'var(--hue-pink)' : 'var(--border)'}
                  strokeWidth={isCur ? 2.6 : 1.4}
                />
                <text
                  x={n.x}
                  y={n.y - 3}
                  className="dpv-node-id"
                  style={{ fill: dark ? 'var(--bg)' : 'var(--text-main)' }}
                >
                  {n.id}
                </text>
                <text
                  x={n.x}
                  y={n.y + 12}
                  className="dpv-node-d"
                  style={{ fill: dark ? 'var(--bg)' : 'var(--text-dim)' }}
                >
                  {d}
                </text>
              </g>
            );
          })}

          {/* legend / live readout panel */}
          <rect x={panelX - 12} y={12} width={panelW + 24} height={H - 28} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={panelX} y={32} className="dpv-row-label">
            legend
          </text>
          {[
            { fill: 'var(--easy)', label: `source (${SOURCE})` },
            { fill: 'var(--hard)', label: `target (${TARGET})` },
            { fill: 'var(--hue-pink)', label: 'current pop' },
            { fill: 'var(--hue-mint)', label: 'just relaxed' },
            { fill: 'rgba(var(--accent-rgb), 0.20)', label: 'frontier (PQ)' },
            { fill: 'rgba(var(--accent-rgb), 0.08)', label: 'settled' },
            { fill: 'var(--accent)', label: 'shortest path' },
          ].map((row, i) => {
            const ly = 48 + i * 24;
            return (
              <g key={`lg-${row.label}`}>
                <rect x={panelX} y={ly} width={16} height={16} rx={4} fill={row.fill} stroke="var(--border)" strokeWidth={1} />
                <text x={panelX + 24} y={ly + 12} className="dpv-legend-text">
                  {row.label}
                </text>
              </g>
            );
          })}

          <line x1={panelX} y1={228} x2={panelX + panelW} y2={228} stroke="var(--border)" strokeWidth={1} />
          <text x={panelX} y={250} className="dpv-row-label">
            dist[] array
          </text>
          {NODES.map((n, i) => (
            <text key={`dr-${n.id}`} x={panelX} y={272 + i * 19} className="dpv-dist-row">
              {n.id} = {distStr(current.dist[n.id])}
              {current.prev[n.id] ? `  (prev ${current.prev[n.id]})` : ''}
            </text>
          ))}

          <text x={panelX} y={272 + NODES.length * 19 + 14} className="dpv-row-label">
            path · cost
          </text>
          <text x={panelX} y={272 + NODES.length * 19 + 36} className="dpv-readout-big">
            {pathText}
          </text>
        </svg>
      </div>

      <div className="dpv-metrics">
        <div className="dpv-metric">
          <span className="dpv-metric-label">frontier</span>
          <span className="dpv-metric-value">{current.frontier.size}</span>
        </div>
        <div className="dpv-metric">
          <span className="dpv-metric-label">settled</span>
          <span className="dpv-metric-value">{current.settled.size}</span>
        </div>
        <div className="dpv-metric">
          <span className="dpv-metric-label">popped</span>
          <span className="dpv-metric-value">{cur ? `${cur} d=${curD}` : '—'}</span>
        </div>
        <div className="dpv-metric">
          <span className="dpv-metric-label">path cost</span>
          <span className="dpv-metric-value">{current.pathCost != null ? current.pathCost : '—'}</span>
        </div>
      </div>

      <div className="dpv-arith">
        <span className="dpv-arith-label">trace</span>
        <span className="dpv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
