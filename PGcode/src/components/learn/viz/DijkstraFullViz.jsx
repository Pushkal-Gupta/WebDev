import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Check, MapPin, Flag } from 'lucide-react';
import './DijkstraFullViz.css';

const NODES = [
  { id: 'A', x: 90,  y: 130 },
  { id: 'B', x: 230, y: 70  },
  { id: 'C', x: 230, y: 230 },
  { id: 'D', x: 380, y: 60  },
  { id: 'E', x: 380, y: 200 },
  { id: 'F', x: 560, y: 130 },
  { id: 'G', x: 310, y: 340 },
  { id: 'H', x: 500, y: 320 },
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

class MinHeap {
  constructor() { this.a = []; }
  size() { return this.a.length; }
  peek() { return this.a[0]; }
  toArray() { return this.a.slice(); }
  push(item) {
    this.a.push(item);
    this._up(this.a.length - 1);
  }
  pop() {
    if (this.a.length === 0) return null;
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length > 0) {
      this.a[0] = last;
      this._down(0);
    }
    return top;
  }
  _less(i, j) {
    const a = this.a[i];
    const b = this.a[j];
    return a.d < b.d || (a.d === b.d && a.id < b.id);
  }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this._less(i, p)) {
        [this.a[i], this.a[p]] = [this.a[p], this.a[i]];
        i = p;
      } else break;
    }
  }
  _down(i) {
    const n = this.a.length;
    while (true) {
      const l = i * 2 + 1;
      const r = i * 2 + 2;
      let s = i;
      if (l < n && this._less(l, s)) s = l;
      if (r < n && this._less(r, s)) s = r;
      if (s !== i) {
        [this.a[i], this.a[s]] = [this.a[s], this.a[i]];
        i = s;
      } else break;
    }
  }
}

function buildSteps(start, dest) {
  const steps = [];
  const dist = {};
  const prev = {};
  NODES.forEach((n) => {
    dist[n.id] = n.id === start ? 0 : INF;
    prev[n.id] = null;
  });
  const settled = new Set();
  const treeEdges = new Set();
  const heap = new MinHeap();
  const inHeap = new Set();
  heap.push({ id: start, d: 0 });
  inHeap.add(start);

  steps.push({
    kind: 'init',
    current: null,
    activeEdge: null,
    dist: { ...dist },
    prev: { ...prev },
    settled: [...settled],
    heap: heap.toArray(),
    relaxed: [],
    treeEdges: [...treeEdges],
    caption: `Initialize: dist[${start}] = 0, all others infinity. Push ${start} into the min-heap. Target: ${dest}.`,
  });

  while (heap.size() > 0) {
    const top = heap.pop();
    if (settled.has(top.id) || top.d !== dist[top.id]) {
      steps.push({
        kind: 'stale',
        current: top.id,
        activeEdge: null,
        dist: { ...dist },
        prev: { ...prev },
        settled: [...settled],
        heap: heap.toArray(),
        relaxed: [],
        treeEdges: [...treeEdges],
        caption: `Pop (${top.id}, ${distLabel(top.d)}) from heap. Stale entry - already settled or distance improved. Skip.`,
      });
      continue;
    }

    steps.push({
      kind: 'pop',
      current: top.id,
      activeEdge: null,
      dist: { ...dist },
      prev: { ...prev },
      settled: [...settled],
      heap: heap.toArray(),
      relaxed: [],
      treeEdges: [...treeEdges],
      caption: `Extract-min: pop (${top.id}, ${distLabel(top.d)}) from the heap. Now scan its outgoing edges.`,
    });

    settled.add(top.id);
    const neighbors = ADJ[top.id];

    for (const { to, w } of neighbors) {
      const candidate = dist[top.id] + w;
      const improved = candidate < dist[to];
      if (improved) {
        const old = dist[to];
        if (prev[to]) treeEdges.delete(edgeKey(prev[to], to));
        dist[to] = candidate;
        prev[to] = top.id;
        treeEdges.add(edgeKey(top.id, to));
        heap.push({ id: to, d: candidate });
        inHeap.add(to);
        steps.push({
          kind: 'relax-improve',
          current: top.id,
          activeEdge: edgeKey(top.id, to),
          dist: { ...dist },
          prev: { ...prev },
          settled: [...settled],
          heap: heap.toArray(),
          relaxed: [edgeKey(top.id, to)],
          treeEdges: [...treeEdges],
          caption: `Relax edge ${top.id} -> ${to} (w=${w}). dist[${top.id}] + ${w} = ${candidate} < ${distLabel(old)}. Update dist[${to}] = ${candidate} and push into heap.`,
        });
      } else {
        steps.push({
          kind: 'relax-skip',
          current: top.id,
          activeEdge: edgeKey(top.id, to),
          dist: { ...dist },
          prev: { ...prev },
          settled: [...settled],
          heap: heap.toArray(),
          relaxed: [],
          treeEdges: [...treeEdges],
          caption: `Check ${top.id} -> ${to} (w=${w}). ${candidate} ${candidate === dist[to] ? '=' : '>='} ${distLabel(dist[to])} - no improvement. Skip.`,
        });
      }
    }

    steps.push({
      kind: 'settle',
      current: top.id,
      activeEdge: null,
      dist: { ...dist },
      prev: { ...prev },
      settled: [...settled],
      heap: heap.toArray(),
      relaxed: [],
      treeEdges: [...treeEdges],
      caption: `Mark ${top.id} settled. Final dist[${top.id}] = ${distLabel(dist[top.id])}.`,
    });

    if (top.id === dest) {
      const path = [];
      let cur = dest;
      while (cur) { path.unshift(cur); cur = prev[cur]; }
      steps.push({
        kind: 'done',
        current: null,
        activeEdge: null,
        dist: { ...dist },
        prev: { ...prev },
        settled: [...settled],
        heap: heap.toArray(),
        relaxed: [],
        treeEdges: [...treeEdges],
        finalPath: path,
        caption: `Destination ${dest} settled. Shortest distance ${start} -> ${dest} = ${distLabel(dist[dest])}. Path: ${path.join(' -> ')}.`,
      });
      return steps;
    }
  }

  const reached = Object.keys(dist).filter((id) => dist[id] !== INF).length;
  const path = [];
  if (dist[dest] !== INF) {
    let cur = dest;
    while (cur) { path.unshift(cur); cur = prev[cur]; }
  }
  steps.push({
    kind: 'done',
    current: null,
    activeEdge: null,
    dist: { ...dist },
    prev: { ...prev },
    settled: [...settled],
    heap: [],
    relaxed: [],
    treeEdges: [...treeEdges],
    finalPath: path,
    caption: path.length > 0
      ? `Heap empty. ${start} -> ${dest} = ${distLabel(dist[dest])}. Path: ${path.join(' -> ')}. Settled ${reached} of ${NODES.length}.`
      : `Heap empty. ${dest} is unreachable from ${start}. Settled ${reached} of ${NODES.length}.`,
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

// Lay out heap entries on a binary-tree grid for SVG.
function heapLayout(heapArr, width) {
  if (heapArr.length === 0) return { positions: [], rows: 0, height: 0 };
  const depth = Math.floor(Math.log2(heapArr.length)) + 1;
  const rowH = 56;
  const padTop = 28;
  const positions = heapArr.map((item, i) => {
    const level = Math.floor(Math.log2(i + 1));
    const indexInLevel = i - ((1 << level) - 1);
    const slots = 1 << level;
    const slotW = width / slots;
    const x = slotW * (indexInLevel + 0.5);
    const y = padTop + level * rowH;
    return { x, y, level, indexInLevel, item };
  });
  return { positions, rows: depth, height: padTop + (depth - 1) * rowH + 40 };
}

export default function DijkstraFullViz() {
  const [start, setStart] = useState('A');
  const [dest, setDest] = useState('F');
  const [pickMode, setPickMode] = useState('start'); // 'start' | 'dest' | 'none'
  const [speed, setSpeed] = useState(900);
  const [steps, setSteps] = useState(() => buildSteps('A', 'F'));
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setSteps(buildSteps(start, dest));
    setIdx(0);
    setPlaying(false);
  }, [start, dest]);

  const step = steps[idx];

  const next = useCallback(() => {
    setIdx((i) => {
      if (i >= steps.length - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [steps.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => { next(); }, speed);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next, speed]);

  useEffect(() => {
    if (idx >= steps.length - 1 && playing) setPlaying(false);
  }, [idx, steps.length, playing]);

  const handleReset = () => {
    setPlaying(false);
    setIdx(0);
  };

  const handleNodeClick = (id) => {
    if (pickMode === 'start') {
      if (id === dest) {
        setDest(start);
      }
      setStart(id);
      setPickMode('dest');
    } else if (pickMode === 'dest') {
      if (id === start) {
        setStart(dest);
      }
      setDest(id);
      setPickMode('none');
    } else {
      // none mode: clicking a node cycles back to picking start
      setStart(id);
      setPickMode('dest');
    }
  };

  const finalPath = step.finalPath || null;
  const finalPathEdges = useMemo(() => {
    const s = new Set();
    if (!finalPath || finalPath.length < 2) return s;
    for (let i = 0; i + 1 < finalPath.length; i++) s.add(edgeKey(finalPath[i], finalPath[i + 1]));
    return s;
  }, [finalPath]);

  const nodeState = useMemo(() => {
    const map = {};
    NODES.forEach((n) => { map[n.id] = 'unreached'; });
    Object.keys(step.dist).forEach((id) => {
      if (step.dist[id] !== INF) map[id] = 'reached';
    });
    step.settled.forEach((id) => { map[id] = 'settled'; });
    if (step.current) map[step.current] = 'current';
    return map;
  }, [step]);

  const relaxedSet = useMemo(() => new Set(step.relaxed), [step.relaxed]);
  const treeSet = useMemo(() => new Set(step.treeEdges), [step.treeEdges]);
  const atEnd = idx >= steps.length - 1;
  const isDone = step.kind === 'done';

  const heapWidth = 320;
  const heapLayoutData = useMemo(() => heapLayout(step.heap, heapWidth), [step.heap]);
  const heapPosById = useMemo(() => {
    const m = {};
    heapLayoutData.positions.forEach((p) => { m[`${p.item.id}-${p.item.d}-${p.indexInLevel}-${p.level}`] = p; });
    return m;
  }, [heapLayoutData]);

  const heapSvgHeight = Math.max(160, heapLayoutData.height || 160);

  const sortedNodes = NODES.slice().sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="dfviz">
      <div className="dfviz-header">
        <div className="dfviz-title">Dijkstra full visualizer</div>
        <div className="dfviz-pick-modes">
          <button
            type="button"
            className={`dfviz-pick-btn ${pickMode === 'start' ? 'dfviz-pick-active' : ''}`}
            onClick={() => setPickMode('start')}
          >
            <MapPin size={14} />
            <span>Set source: {start}</span>
          </button>
          <button
            type="button"
            className={`dfviz-pick-btn dfviz-pick-dest ${pickMode === 'dest' ? 'dfviz-pick-active' : ''}`}
            onClick={() => setPickMode('dest')}
          >
            <Flag size={14} />
            <span>Set target: {dest}</span>
          </button>
        </div>
      </div>

      <div className="dfviz-legend">
        <span className="dfviz-legend-item"><span className="dfviz-dot dfviz-dot-unreached" /> unreached</span>
        <span className="dfviz-legend-item"><span className="dfviz-dot dfviz-dot-reached" /> in heap</span>
        <span className="dfviz-legend-item"><span className="dfviz-dot dfviz-dot-current" /> processing</span>
        <span className="dfviz-legend-item"><span className="dfviz-dot dfviz-dot-settled" /> settled</span>
        <span className="dfviz-legend-item"><span className="dfviz-line dfviz-line-relaxed" /> relaxed</span>
        <span className="dfviz-legend-item"><span className="dfviz-line dfviz-line-tree" /> SPT</span>
        <span className="dfviz-legend-item"><span className="dfviz-line dfviz-line-path" /> final path</span>
      </div>

      <div className="dfviz-twocol">
        <div className="dfviz-stage">
          <svg
            className="dfviz-svg"
            viewBox="0 0 640 420"
            role="img"
            aria-label="Dijkstra graph"
          >
            <defs>
              <marker id="dfviz-arr-idle" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="dfviz-arr-idle" />
              </marker>
              <marker id="dfviz-arr-relaxed" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="dfviz-arr-relaxed" />
              </marker>
              <marker id="dfviz-arr-tree" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="dfviz-arr-tree" />
              </marker>
              <marker id="dfviz-arr-path" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="dfviz-arr-path" />
              </marker>
              <marker id="dfviz-arr-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="dfviz-arr-active" />
              </marker>
            </defs>

            <g className="dfviz-edges">
              {EDGES.map((e) => {
                const a = NODES.find((n) => n.id === e.from);
                const b = NODES.find((n) => n.id === e.to);
                const geom = edgeGeometry(a, b);
                if (!geom) return null;
                const k = edgeKey(e.from, e.to);
                const isActive = step.activeEdge === k;
                const isRelaxed = relaxedSet.has(k);
                const isTree = treeSet.has(k);
                const isFinalPath = finalPathEdges.has(k);
                let state = 'idle';
                if (isFinalPath && isDone) state = 'path';
                else if (isRelaxed) state = 'relaxed';
                else if (isActive) state = 'active';
                else if (isTree) state = 'tree';
                const marker = state === 'path' ? 'url(#dfviz-arr-path)'
                  : state === 'relaxed' ? 'url(#dfviz-arr-relaxed)'
                  : state === 'active' ? 'url(#dfviz-arr-active)'
                  : state === 'tree' ? 'url(#dfviz-arr-tree)'
                  : 'url(#dfviz-arr-idle)';
                return (
                  <g key={k} className={`dfviz-edge-group dfviz-edge-${state}`}>
                    <line
                      className="dfviz-edge"
                      x1={geom.x1}
                      y1={geom.y1}
                      x2={geom.x2}
                      y2={geom.y2}
                      markerEnd={marker}
                    />
                    <g className="dfviz-weight" transform={`translate(${geom.labelX},${geom.labelY})`}>
                      <rect x="-11" y="-9" width="22" height="18" rx="5" className="dfviz-weight-bg" />
                      <text textAnchor="middle" dominantBaseline="central">{e.w}</text>
                    </g>
                  </g>
                );
              })}
            </g>

            <g className="dfviz-nodes">
              {NODES.map((n) => {
                const state = nodeState[n.id];
                const isStart = n.id === start;
                const isDest = n.id === dest;
                const d = step.dist[n.id];
                return (
                  <g
                    key={n.id}
                    className={`dfviz-node dfviz-node-${state} ${isStart ? 'dfviz-node-start' : ''} ${isDest ? 'dfviz-node-dest' : ''}`}
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
                    aria-label={`Node ${n.id}, distance ${distLabel(d)}, ${state}`}
                  >
                    {state === 'current' && <circle className="dfviz-node-ring" r="29" />}
                    {isDest && <circle className="dfviz-node-target-ring" r="32" />}
                    <circle className="dfviz-node-circle" r="22" />
                    <text className="dfviz-node-label" textAnchor="middle" dominantBaseline="central">{n.id}</text>

                    <g className="dfviz-dist-badge" transform="translate(0,-36)">
                      <rect x="-19" y="-11" width="38" height="20" rx="6" className="dfviz-dist-bg" />
                      <text className="dfviz-dist-text" textAnchor="middle" dominantBaseline="central">{distLabel(d)}</text>
                    </g>

                    {state === 'settled' && (
                      <g className="dfviz-check" transform="translate(16,-16)">
                        <circle r="8" className="dfviz-check-bg" />
                        <g transform="translate(-4.5,-4.5) scale(0.6)">
                          <path d="M3 8 L7 12 L15 4" className="dfviz-check-path" fill="none" />
                        </g>
                      </g>
                    )}

                    {isStart && (
                      <text className="dfviz-role-tag" x="0" y="42" textAnchor="middle">source</text>
                    )}
                    {isDest && !isStart && (
                      <text className="dfviz-role-tag dfviz-role-tag-dest" x="0" y="42" textAnchor="middle">target</text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <div className="dfviz-heap">
          <div className="dfviz-heap-header">
            <span className="dfviz-heap-title">Min-heap</span>
            <span className="dfviz-heap-meta">size {step.heap.length}</span>
          </div>
          <svg
            className="dfviz-heap-svg"
            viewBox={`0 0 ${heapWidth} ${heapSvgHeight}`}
            role="img"
            aria-label="Heap binary tree"
          >
            <g className="dfviz-heap-edges">
              {heapLayoutData.positions.map((p, i) => {
                if (i === 0) return null;
                const parentIdx = (i - 1) >> 1;
                const pp = heapLayoutData.positions[parentIdx];
                return (
                  <line
                    key={`he-${i}`}
                    x1={pp.x}
                    y1={pp.y}
                    x2={p.x}
                    y2={p.y}
                    className="dfviz-heap-link"
                  />
                );
              })}
            </g>
            <g className="dfviz-heap-nodes">
              {heapLayoutData.positions.map((p, i) => {
                const head = i === 0;
                return (
                  <g key={`hn-${i}`} className={`dfviz-heap-node ${head ? 'dfviz-heap-head' : ''}`} transform={`translate(${p.x},${p.y})`}>
                    <rect x="-30" y="-15" width="60" height="30" rx="8" className="dfviz-heap-box" />
                    <text className="dfviz-heap-id" textAnchor="middle" dominantBaseline="central" x="-12">{p.item.id}</text>
                    <line className="dfviz-heap-divider" x1="0" y1="-12" x2="0" y2="12" />
                    <text className="dfviz-heap-d" textAnchor="middle" dominantBaseline="central" x="13">{distLabel(p.item.d)}</text>
                  </g>
                );
              })}
            </g>
            {heapLayoutData.positions.length === 0 && (
              <text x={heapWidth / 2} y={heapSvgHeight / 2} className="dfviz-heap-empty" textAnchor="middle" dominantBaseline="central">heap is empty</text>
            )}
          </svg>
          <div className="dfviz-heap-array">
            <span className="dfviz-heap-array-label">array</span>
            <div className="dfviz-heap-array-cells">
              {step.heap.length === 0 ? (
                <span className="dfviz-muted">[]</span>
              ) : step.heap.map((item, i) => (
                <span key={`ha-${i}`} className={`dfviz-heap-cell ${i === 0 ? 'dfviz-heap-cell-head' : ''}`}>
                  <span className="dfviz-heap-cell-id">{item.id}</span>
                  <span className="dfviz-heap-cell-sep">:</span>
                  <span className="dfviz-heap-cell-d">{distLabel(item.d)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="dfviz-caption">
        {isDone && <Check size={14} className="dfviz-caption-icon" aria-hidden="true" />}
        <span>{step.caption}</span>
      </p>

      <div className="dfviz-status">
        <div className="dfviz-status-row">
          <span className="dfviz-status-label">Step</span>
          <span className="dfviz-status-value">{idx} / {steps.length - 1}</span>
        </div>
        <div className="dfviz-status-row">
          <span className="dfviz-status-label">Processing</span>
          <span className="dfviz-status-value">
            {step.current ? <>Node {step.current}</> : <span className="dfviz-muted">{isDone ? 'finished' : 'idle'}</span>}
          </span>
        </div>
        <div className="dfviz-status-row">
          <span className="dfviz-status-label">Settled</span>
          <span className="dfviz-status-value">{step.settled.length} / {NODES.length}</span>
        </div>
        <div className="dfviz-status-row">
          <span className="dfviz-status-label">{start} -&gt; {dest}</span>
          <span className="dfviz-status-value">{distLabel(step.dist[dest])}</span>
        </div>
      </div>

      <div className="dfviz-distances">
        <div className="dfviz-distances-header">Distances from {start}</div>
        <div className="dfviz-distances-grid">
          {sortedNodes.map((n) => {
            const d = step.dist[n.id];
            const settled = step.settled.includes(n.id);
            const isStart = n.id === start;
            const isDest = n.id === dest;
            const inHeap = step.heap.some((h) => h.id === n.id);
            let cls = 'dfviz-dist-card';
            if (settled) cls += ' dfviz-dist-card-settled';
            else if (inHeap) cls += ' dfviz-dist-card-inheap';
            if (isStart) cls += ' dfviz-dist-card-start';
            if (isDest) cls += ' dfviz-dist-card-dest';
            return (
              <div key={n.id} className={cls}>
                <div className="dfviz-dist-card-top">
                  <span className="dfviz-dist-card-id">{n.id}</span>
                  {settled && <Check size={12} className="dfviz-dist-card-check" />}
                </div>
                <div className="dfviz-dist-card-d">{distLabel(d)}</div>
                <div className="dfviz-dist-card-tag">
                  {isStart && 'source'}
                  {isDest && !isStart && 'target'}
                  {!isStart && !isDest && (settled ? 'settled' : inHeap ? 'in heap' : (d === INF ? 'unreached' : 'pending'))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dfviz-controls">
        <button
          type="button"
          className="dfviz-btn dfviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="dfviz-btn dfviz-btn-primary"
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
          className="dfviz-btn dfviz-btn-secondary"
          onClick={next}
          disabled={atEnd}
          aria-label="Step"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>
        <div className="dfviz-speed">
          <label htmlFor="dfviz-speed-range">Speed</label>
          <input
            id="dfviz-speed-range"
            type="range"
            min="250"
            max="1800"
            step="50"
            value={1800 - (speed - 250)}
            onChange={(e) => setSpeed(1800 - (Number(e.target.value) - 250))}
          />
          <span className="dfviz-speed-value">{(1000 / speed).toFixed(2)}x</span>
        </div>
      </div>
    </div>
  );
}
