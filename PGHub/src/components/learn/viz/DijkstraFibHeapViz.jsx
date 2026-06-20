import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Scissors } from 'lucide-react';
import './DijkstraFibHeapViz.css';

const NODES = [
  { id: 'A', x: 90, y: 90 },
  { id: 'B', x: 250, y: 60 },
  { id: 'C', x: 250, y: 200 },
  { id: 'D', x: 410, y: 90 },
  { id: 'E', x: 410, y: 230 },
  { id: 'F', x: 560, y: 150 },
  { id: 'G', x: 560, y: 300 },
];

const EDGES = [
  ['A', 'B', 4],
  ['A', 'C', 2],
  ['B', 'C', 1],
  ['B', 'D', 5],
  ['C', 'D', 8],
  ['C', 'E', 10],
  ['D', 'E', 2],
  ['D', 'F', 6],
  ['E', 'F', 3],
  ['E', 'G', 7],
  ['F', 'G', 1],
];

const START = 'A';

const adj = (() => {
  const m = {};
  for (const n of NODES) m[n.id] = [];
  for (const [u, v, w] of EDGES) {
    m[u].push([v, w]);
    m[v].push([u, w]);
  }
  return m;
})();

function buildFrames() {
  const frames = [];
  const dist = {};
  const parent = {};
  const settled = new Set();
  const heap = new Set();

  let extractMin = 0;
  let decreaseKey = 0;
  let insert = 0;

  dist[START] = 0;
  heap.add(START);
  insert += 1;

  const V = NODES.length;
  const E = EDGES.length;

  const snap = (extra) => ({
    dist: { ...dist },
    settled: new Set(settled),
    heap: new Set(heap),
    current: null,
    relaxed: [],
    decreased: [],
    cut: null,
    op: 'init',
    opCost: 'O(1)',
    extractMin,
    decreaseKey,
    insert,
    note: '',
    ...extra,
  });

  frames.push(
    snap({
      op: 'insert',
      opCost: 'O(1)',
      note: `INSERT start ${START} with dist=0 into the Fibonacci heap root list (lazy: just splice it in, no consolidation). Every other vertex is dist=∞.`,
    }),
  );

  let safety = 0;
  while (heap.size > 0 && safety < 200) {
    safety += 1;

    let bestK = null;
    let bestD = Infinity;
    for (const k of heap) {
      if (dist[k] < bestD - 1e-9) {
        bestD = dist[k];
        bestK = k;
      }
    }
    heap.delete(bestK);
    settled.add(bestK);
    extractMin += 1;

    frames.push(
      snap({
        current: bestK,
        op: 'extract-min',
        opCost: 'O(log n)',
        note: `EXTRACT-MIN pops ${bestK} (dist=${dist[bestK]}) — the smallest root. The heap consolidates trees of equal degree here, paying the O(log n) amortized cost. ${bestK} is now settled.`,
      }),
    );

    const relaxed = [];
    const decreased = [];
    const relaxNotes = [];
    let lastCut = null;

    for (const [nb, w] of adj[bestK]) {
      if (settled.has(nb)) continue;
      const cand = dist[bestK] + w;
      const known = nb in dist;
      if (!known) {
        dist[nb] = cand;
        parent[nb] = bestK;
        heap.add(nb);
        insert += 1;
        relaxed.push(nb);
        relaxNotes.push(`${nb}: ∞→${cand} INSERT O(1)`);
      } else if (cand < dist[nb]) {
        const prev = dist[nb];
        dist[nb] = cand;
        parent[nb] = bestK;
        heap.add(nb);
        decreaseKey += 1;
        decreased.push(nb);
        lastCut = nb;
        relaxNotes.push(`${nb}: ${prev}→${cand} DECREASE-KEY O(1)`);
      }
    }

    if (decreased.length) {
      frames.push(
        snap({
          current: bestK,
          relaxed,
          decreased,
          cut: lastCut,
          op: 'decrease-key',
          opCost: 'O(1)',
          note: `DECREASE-KEY on ${decreased.join(', ')}: a shorter route via ${bestK}. Fibonacci heap is lazy — CUT the node from its parent into the root list and CASCADE a mark upward. O(1) amortized. A binary heap would sift-up in O(log n).`,
        }),
      );
    } else if (relaxed.length) {
      frames.push(
        snap({
          current: bestK,
          relaxed,
          op: 'insert',
          opCost: 'O(1)',
          note: `Relax neighbours of ${bestK}: ${relaxNotes.join('; ')}. First-time reach is an INSERT into the root list — O(1), no sift.`,
        }),
      );
    } else {
      frames.push(
        snap({
          current: bestK,
          op: 'extract-min',
          opCost: 'O(log n)',
          note: `${bestK} has no neighbour that improves (all settled or no shorter path). Nothing enters the heap.`,
        }),
      );
    }
  }

  const fibBound = `O(E + V log V) = O(${E} + ${V}·log ${V})`;
  const binBound = `O((E+V) log V) = O((${E}+${V})·log ${V})`;
  frames.push(
    snap({
      op: 'done',
      opCost: '—',
      note: `Heap drained — every vertex settled. Totals: ${extractMin} EXTRACT-MIN (O(log n) each) + ${decreaseKey} DECREASE-KEY + ${insert} INSERT. Fibonacci heap → ${fibBound}; binary heap → ${binBound}. The cheap DECREASE-KEY is why the Fibonacci heap wins on dense graphs.`,
    }),
  );

  return frames;
}

export default function DijkstraFibHeapViz() {
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

  const V = NODES.length;
  const E = EDGES.length;

  const relaxedSet = useMemo(() => new Set(current.relaxed), [current.relaxed]);
  const decreasedSet = useMemo(() => new Set(current.decreased), [current.decreased]);

  const W = 940;
  const H = 400;
  const panelX = 660;
  const panelW = W - panelX - 24;

  const nodeFill = (id) => {
    if (id === START) return 'var(--easy)';
    if (id === current.current) return 'var(--hue-pink)';
    if (decreasedSet.has(id)) return 'var(--warning)';
    if (relaxedSet.has(id)) return 'var(--hue-mint)';
    if (current.settled.has(id)) return 'rgba(var(--accent-rgb), 0.20)';
    if (current.heap.has(id)) return 'rgba(var(--accent-rgb), 0.06)';
    return 'var(--bg)';
  };

  const nodeDark = (id) =>
    id === START || id === current.current || decreasedSet.has(id);

  const heapList = useMemo(
    () => [...current.heap].sort((a, b) => current.dist[a] - current.dist[b]),
    [current.heap, current.dist],
  );

  const opColor =
    current.op === 'decrease-key'
      ? 'var(--warning)'
      : current.op === 'extract-min'
        ? 'var(--hue-pink)'
        : 'var(--accent)';

  return (
    <div className="dfh">
      <div className="dfh-head">
        <h3 className="dfh-title">Dijkstra with a Fibonacci heap — cheap decrease-key wins</h3>
        <p className="dfh-sub">
          Each step pops the smallest tentative distance (EXTRACT-MIN, O(log n) amortized) then relaxes neighbours.
          A relax that shortens a known distance is a DECREASE-KEY — O(1) in a Fibonacci heap (lazy cut + cascade)
          versus O(log n) sift-up in a binary heap.
        </p>
      </div>

      <div className="dfh-controls">
        <div className="dfh-actions">
          <div className="dfh-buttons">
            <button
              type="button"
              className="dfh-btn dfh-btn-primary"
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
              className="dfh-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="dfh-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="dfh-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="dfh-speed">
            <span className="dfh-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="dfh-speed-range"
            />
            <span className="dfh-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="dfh-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="dfh-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dfh-svg" preserveAspectRatio="xMidYMid meet">
          <text x={24} y={26} className="dfh-row-label">
            weighted graph — node circle = dist-so-far, settled fills in
          </text>

          {EDGES.map(([u, v, w]) => {
            const a = NODES.find((n) => n.id === u);
            const b = NODES.find((n) => n.id === v);
            const onTree =
              (current.current === u && decreasedSet.has(v)) ||
              (current.current === u && relaxedSet.has(v)) ||
              (current.current === v && decreasedSet.has(u)) ||
              (current.current === v && relaxedSet.has(u));
            return (
              <g key={`e-${u}-${v}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={onTree ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={onTree ? 2.6 : 1.4}
                />
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 4}
                  className="dfh-edge-w"
                >
                  {w}
                </text>
              </g>
            );
          })}

          {NODES.map((n) => {
            const fill = nodeFill(n.id);
            const dark = nodeDark(n.id);
            const d = n.id in current.dist ? current.dist[n.id] : '∞';
            const isCut = current.cut === n.id;
            return (
              <g key={`n-${n.id}`}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={20}
                  fill={fill}
                  stroke={isCut ? 'var(--warning)' : n.id === current.current ? 'var(--hue-pink)' : 'var(--border)'}
                  strokeWidth={isCut || n.id === current.current ? 2.6 : 1.4}
                />
                <text
                  x={n.x}
                  y={n.y - 2}
                  className="dfh-node-id"
                  style={{ fill: dark ? 'var(--bg)' : 'var(--text-main)' }}
                >
                  {n.id}
                </text>
                <text
                  x={n.x}
                  y={n.y + 12}
                  className="dfh-node-d"
                  style={{ fill: dark ? 'var(--bg)' : 'var(--text-dim)' }}
                >
                  {d}
                </text>
              </g>
            );
          })}

          {current.cut && (
            <g>
              <Scissors x={panelX - 4} y={H - 30} size={14} color="var(--warning)" />
              <text x={panelX + 18} y={H - 18} className="dfh-cut-mark" style={{ fill: 'var(--warning)' }}>
                cut + cascade: {current.cut} spliced into root list
              </text>
            </g>
          )}

          <rect
            x={panelX - 12}
            y={42}
            width={panelW + 24}
            height={H - 70}
            fill="var(--surface)"
            stroke="var(--border)"
            rx={8}
          />
          <text x={panelX} y={64} className="dfh-row-label">
            current heap op
          </text>
          <text x={panelX} y={92} className="dfh-readout-big" style={{ fill: opColor }}>
            {current.op}
          </text>
          <text x={panelX} y={112} className="dfh-readout-cost">
            amortized {current.opCost}
          </text>

          <line x1={panelX} y1={126} x2={panelX + panelW} y2={126} stroke="var(--border)" strokeWidth={1} />
          <text x={panelX} y={148} className="dfh-row-label">
            heap root list (by dist)
          </text>
          {heapList.length === 0 ? (
            <text x={panelX} y={174} className="dfh-heap-empty">
              ∅ empty
            </text>
          ) : (
            heapList.map((id, i) => {
              const cw = 38;
              const gap = 8;
              const perRow = 5;
              const col = i % perRow;
              const row = Math.floor(i / perRow);
              const cx = panelX + col * (cw + gap);
              const cy = 158 + row * 40;
              const isMin = i === 0;
              const isDec = decreasedSet.has(id);
              return (
                <g key={`heap-${id}`}>
                  <rect
                    x={cx}
                    y={cy}
                    width={cw}
                    height={32}
                    rx={6}
                    fill={isDec ? 'rgba(var(--accent-rgb), 0.08)' : 'var(--bg)'}
                    stroke={isMin ? 'var(--hue-pink)' : isDec ? 'var(--warning)' : 'var(--border)'}
                    strokeWidth={isMin || isDec ? 2.2 : 1.2}
                  />
                  <text x={cx + cw / 2} y={cy + 13} className="dfh-heap-id">
                    {id}
                  </text>
                  <text x={cx + cw / 2} y={cy + 26} className="dfh-heap-d">
                    {current.dist[id]}
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>

      <div className="dfh-cmp">
        <div className="dfh-cmp-col is-fib">
          <span className="dfh-cmp-head">Fibonacci heap</span>
          <span className="dfh-cmp-row">
            extract-min <strong>O(log n)</strong> · ×{current.extractMin}
          </span>
          <span className="dfh-cmp-row">
            decrease-key <strong>O(1)</strong> · ×{current.decreaseKey}
          </span>
          <span className="dfh-cmp-bound">O(E + V log V)</span>
        </div>
        <div className="dfh-cmp-col is-bin">
          <span className="dfh-cmp-head">Binary heap</span>
          <span className="dfh-cmp-row">
            extract-min <strong>O(log n)</strong> · ×{current.extractMin}
          </span>
          <span className="dfh-cmp-row">
            decrease-key <strong>O(log n)</strong> · ×{current.decreaseKey}
          </span>
          <span className="dfh-cmp-bound">O((E+V) log V)</span>
        </div>
      </div>

      <div className="dfh-metrics">
        <div className="dfh-metric">
          <span className="dfh-metric-label">extract-min</span>
          <span className="dfh-metric-value">{current.extractMin}</span>
        </div>
        <div className="dfh-metric">
          <span className="dfh-metric-label">decrease-key</span>
          <span className="dfh-metric-value is-dec">{current.decreaseKey}</span>
        </div>
        <div className="dfh-metric">
          <span className="dfh-metric-label">insert</span>
          <span className="dfh-metric-value">{current.insert}</span>
        </div>
        <div className="dfh-metric">
          <span className="dfh-metric-label">V · E</span>
          <span className="dfh-metric-value">{V} · {E}</span>
        </div>
        <div className="dfh-metric">
          <span className="dfh-metric-label">settled</span>
          <span className="dfh-metric-value">{current.settled.size} / {V}</span>
        </div>
      </div>

      <div className="dfh-trace">
        <span className="dfh-trace-label">trace</span>
        <span className="dfh-trace-body">{current.note}</span>
      </div>
    </div>
  );
}
