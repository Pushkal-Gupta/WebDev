import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, Minus } from 'lucide-react';
import './DpRecursionVsIterationViz.css';

const MIN_N = 5;
const MAX_N = 8;

// --- Top-down: build the full binary recursion tree for fib(n), then walk it
// in pre-order (the order the memoized recursion would actually visit nodes),
// marking a node as a CACHE HIT (pruned, no children) once fib(k) is already known.
function buildTree(n) {
  let id = 0;
  // depth-based slot layout: assign an x-slot per node so siblings never overlap.
  const make = (k, depth) => ({ id: id++, k, depth, children: [] });
  const root = make(n, 0);
  const build = (node) => {
    if (node.k >= 2) {
      const a = make(node.k - 1, node.depth + 1);
      const b = make(node.k - 2, node.depth + 1);
      node.children = [a, b];
      build(a);
      build(b);
    }
  };
  build(root);
  return root;
}

// Layout: assign x by an in-order leaf counter so the tree fits a fixed width.
function layoutTree(root) {
  let leafX = 0;
  const place = (node) => {
    if (node.children.length === 0) {
      node.x = leafX;
      leafX += 1;
      return node.x;
    }
    const xs = node.children.map(place);
    node.x = (Math.min(...xs) + Math.max(...xs)) / 2;
    return node.x;
  };
  place(root);
  const maxDepth = (function depth(node) {
    if (node.children.length === 0) return node.depth;
    return Math.max(...node.children.map(depth));
  })(root);
  return { leaves: leafX, maxDepth };
}

function buildTopDownFrames(n) {
  const root = buildTree(n);
  const { leaves, maxDepth } = layoutTree(root);
  const frames = [];
  const memo = {};
  let calls = 0;
  let hits = 0;
  let result = null;

  // Track which node ids are "revealed" (visited) and which are cache-hit/pruned.
  const revealed = new Set([root.id]);
  const cacheHit = new Set();
  const resolved = {}; // nodeId -> fib value (shown inside node once known)

  const snap = (extra) => ({
    mode: 'top-down',
    n,
    tree: root,
    leaves,
    maxDepth,
    revealed: new Set(revealed),
    cacheHit: new Set(cacheHit),
    resolved: { ...resolved },
    calls,
    hits,
    cells: 0,
    table: [],
    tableFilled: 0,
    result,
    focusId: null,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `Top-down memoized recursion for fib(${n}). Each call either recurses into fib(k-1)+fib(k-2), or returns instantly from the cache. Step to expand the call tree.`,
  }));

  // Pre-order DFS in the exact order a memoized recursion fires.
  const visit = (node) => {
    revealed.add(node.id);
    calls += 1;
    if (node.k <= 1) {
      resolved[node.id] = node.k;
      memo[node.k] = node.k;
      frames.push(snap({
        focusId: node.id,
        note: `Call fib(${node.k}) — base case, returns ${node.k} immediately. Calls so far: ${calls}.`,
      }));
      return node.k;
    }
    if (memo[node.k] !== undefined) {
      cacheHit.add(node.id);
      // prune children: they are never visited
      const prune = (m) => { for (const c of m.children) { c.pruned = true; prune(c); } };
      prune(node);
      resolved[node.id] = memo[node.k];
      hits += 1;
      frames.push(snap({
        focusId: node.id,
        note: `Call fib(${node.k}) — CACHE HIT. Value ${memo[node.k]} is already memoized, so the whole subtree below is pruned (never computed). Cache hits: ${hits}.`,
      }));
      return memo[node.k];
    }
    frames.push(snap({
      focusId: node.id,
      note: `Call fib(${node.k}) — not cached. Recurse into fib(${node.k - 1}) + fib(${node.k - 2}).`,
    }));
    const a = visit(node.children[0]);
    const b = visit(node.children[1]);
    const v = a + b;
    memo[node.k] = v;
    resolved[node.id] = v;
    frames.push(snap({
      focusId: node.id,
      note: `fib(${node.k}) = fib(${node.k - 1}) + fib(${node.k - 2}) = ${a} + ${b} = ${v}. Store ${v} in the cache.`,
    }));
    return v;
  };

  result = visit(root);
  const naive = (function naiveCount(k) {
    if (k <= 1) return 1;
    return 1 + naiveCount(k - 1) + naiveCount(k - 2);
  })(n);
  frames.push(snap({
    focusId: root.id,
    note: `Done. fib(${n}) = ${result}. Memoization made ${calls} calls with ${hits} cache hits — versus ${naive} calls a naive (no-cache) recursion would make (~2^n).`,
  }));

  return frames;
}

function buildBottomUpFrames(n) {
  const frames = [];
  const table = new Array(n + 1).fill(null);
  let cells = 0;
  let result = null;

  const snap = (extra) => ({
    mode: 'bottom-up',
    n,
    tree: null,
    leaves: 0,
    maxDepth: 0,
    revealed: new Set(),
    cacheHit: new Set(),
    resolved: {},
    calls: 0,
    hits: 0,
    cells,
    table: [...table],
    tableFilled: cells,
    result,
    focusId: null,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `Bottom-up iterative table for fib(${n}). One array dp[0..${n}], filled left to right. Each cell is the sum of the two before it — no recursion, no stack.`,
  }));

  for (let i = 0; i <= n; i += 1) {
    if (i <= 1) {
      table[i] = i;
      cells += 1;
      frames.push(snap({
        focusId: i,
        note: `dp[${i}] = ${i} (base case). Cells computed: ${cells}.`,
      }));
    } else {
      table[i] = table[i - 1] + table[i - 2];
      cells += 1;
      frames.push(snap({
        focusId: i,
        note: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${table[i - 1]} + ${table[i - 2]} = ${table[i]}. Cells computed: ${cells}.`,
      }));
    }
  }
  result = table[n];
  frames.push(snap({
    focusId: n,
    note: `Done. fib(${n}) = dp[${n}] = ${result}. Exactly ${cells} cells, each in O(1) — total O(n) time, O(n) space (O(1) if you keep only the last two).`,
  }));

  return frames;
}

function buildFrames(mode, n) {
  return mode === 'top-down' ? buildTopDownFrames(n) : buildBottomUpFrames(n);
}

const RUN_DELAY_MS = 1100;

export default function DpRecursionVsIterationViz() {
  const [mode, setMode] = useState('top-down');
  const [n, setN] = useState(6);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode, n), [mode, n]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

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

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const switchMode = (next) => {
    if (next === mode) return;
    setIsRunning(false);
    setMode(next);
    setStep(0);
  };

  const changeN = (delta) => {
    const nextN = Math.max(MIN_N, Math.min(MAX_N, n + delta));
    if (nextN === n) return;
    setIsRunning(false);
    setN(nextN);
    setStep(0);
  };

  // SVG geometry
  const W = 940;
  const H = 430;

  // Top-down tree geometry
  const treeTop = 56;
  const treeBottom = H - 30;
  const treePadX = 40;
  const colCount = Math.max(1, current.leaves);
  const colW = (W - treePadX * 2) / colCount;
  const rowH = current.maxDepth > 0 ? (treeBottom - treeTop) / current.maxDepth : 0;
  const nodeX = (node) => treePadX + (node.x + 0.5) * colW;
  const nodeY = (node) => treeTop + node.depth * rowH;
  const nodeR = Math.min(20, colW / 2 - 4, 22);

  // collect visible nodes/edges from the revealed set
  const treeNodes = [];
  const treeEdges = [];
  if (current.tree) {
    const walk = (node, parent) => {
      const isRevealed = current.revealed.has(node.id);
      if (!isRevealed) return;
      if (parent) {
        treeEdges.push({ from: parent, to: node, key: `e-${parent.id}-${node.id}` });
      }
      treeNodes.push(node);
      const pruned = current.cacheHit.has(node.id);
      if (!pruned) {
        for (const c of node.children) walk(c, node);
      }
    };
    walk(current.tree, null);
  }

  // Bottom-up table geometry
  const tblCount = current.n + 1;
  const tblGap = 10;
  const tblTop = 150;
  const tblMaxW = W - 80;
  const tblCellW = Math.min(96, (tblMaxW - tblGap * (tblCount - 1)) / tblCount);
  const tblCellH = 70;
  const tblTotalW = tblCellW * tblCount + tblGap * (tblCount - 1);
  const tblX0 = (W - tblTotalW) / 2;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const isTopDown = mode === 'top-down';
  const naiveCalls = (function naiveCount(k) {
    if (k <= 1) return 1;
    return 1 + naiveCount(k - 1) + naiveCount(k - 2);
  })(n);

  return (
    <div className="drv">
      <div className="drv-head">
        <h3 className="drv-title">Recursion vs iteration — one DP, two shapes</h3>
        <p className="drv-sub">
          The same Fibonacci value computed two ways. Top-down memoized recursion expands a call tree but prunes any
          subtree whose value is already cached; bottom-up iteration fills a flat table left to right. Both do O(n) real work.
        </p>
      </div>

      <div className="drv-controls">
        <div className="drv-modes" role="tablist" aria-label="computation mode">
          <button
            type="button"
            className={`drv-mode ${isTopDown ? 'is-active' : ''}`}
            onClick={() => switchMode('top-down')}
          >
            Top-down (memoized)
          </button>
          <button
            type="button"
            className={`drv-mode ${!isTopDown ? 'is-active' : ''}`}
            onClick={() => switchMode('bottom-up')}
          >
            Bottom-up (table)
          </button>
        </div>

        <div className="drv-nstep">
          <span className="drv-input-label">n</span>
          <button type="button" className="drv-btn drv-btn-step" onClick={() => changeN(-1)} disabled={n <= MIN_N}>
            <Minus size={13} />
          </button>
          <span className="drv-nval">{n}</span>
          <button type="button" className="drv-btn drv-btn-step" onClick={() => changeN(1)} disabled={n >= MAX_N}>
            <Plus size={13} />
          </button>
        </div>

        <label className="drv-speed">
          <span className="drv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="drv-speed-range"
            aria-label="Playback speed"
          />
          <span className="drv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="drv-spacer" aria-hidden="true" />

        <div className="drv-buttons">
          <button
            type="button"
            className="drv-btn drv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="drv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="drv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="drv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="drv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="drv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="drv-svg" preserveAspectRatio="xMidYMid meet">
          {isTopDown ? (
            <g>
              <text className="drv-stage-label" x={treePadX} y={28}>call tree · fib({current.n})</text>
              {treeEdges.map((e) => (
                <line
                  key={e.key}
                  className="drv-edge"
                  x1={nodeX(e.from)}
                  y1={nodeY(e.from) + nodeR}
                  x2={nodeX(e.to)}
                  y2={nodeY(e.to) - nodeR}
                />
              ))}
              {treeNodes.map((node) => {
                const isHit = current.cacheHit.has(node.id);
                const isFocus = current.focusId === node.id;
                const isBase = node.k <= 1;
                const val = current.resolved[node.id];
                const cls = [
                  'drv-node',
                  isHit ? 'is-hit' : '',
                  isFocus ? 'is-focus' : '',
                  isBase ? 'is-base' : '',
                ].join(' ');
                return (
                  <g key={`n-${node.id}`}>
                    <circle className={cls} cx={nodeX(node)} cy={nodeY(node)} r={nodeR} />
                    <text className="drv-node-label" x={nodeX(node)} y={nodeY(node) - 1}>
                      fib({node.k})
                    </text>
                    {val != null && (
                      <text className="drv-node-val" x={nodeX(node)} y={nodeY(node) + 11}>={val}</text>
                    )}
                    {isHit && (
                      <text className="drv-node-tag" x={nodeX(node)} y={nodeY(node) + nodeR + 13}>cache</text>
                    )}
                  </g>
                );
              })}
            </g>
          ) : (
            <g>
              <text className="drv-stage-label" x={tblX0} y={tblTop - 28}>dp table · fill left to right</text>
              {current.table.map((v, i) => {
                const x = tblX0 + i * (tblCellW + tblGap);
                const filled = v != null;
                const isFocus = current.focusId === i;
                const cls = [
                  'drv-cell',
                  filled ? 'is-filled' : '',
                  isFocus ? 'is-focus' : '',
                ].join(' ');
                return (
                  <g key={`c-${i}`}>
                    <rect className={cls} x={x} y={tblTop} width={tblCellW} height={tblCellH} rx={8} />
                    <text className="drv-cell-idx" x={x + tblCellW / 2} y={tblTop + 20}>dp[{i}]</text>
                    <text className="drv-cell-val" x={x + tblCellW / 2} y={tblTop + 50}>
                      {filled ? v : '·'}
                    </text>
                  </g>
                );
              })}
              {/* dependency arrows: dp[i] <- dp[i-1], dp[i-2] for the focused cell */}
              {current.focusId != null && current.focusId >= 2 && (() => {
                const i = current.focusId;
                const cx = tblX0 + i * (tblCellW + tblGap) + tblCellW / 2;
                const arrows = [i - 1, i - 2].map((j) => {
                  const jx = tblX0 + j * (tblCellW + tblGap) + tblCellW / 2;
                  return (
                    <path
                      key={`dep-${i}-${j}`}
                      className="drv-dep"
                      d={`M ${jx} ${tblTop + tblCellH + 6} Q ${(jx + cx) / 2} ${tblTop + tblCellH + 34} ${cx} ${tblTop + tblCellH + 6}`}
                    />
                  );
                });
                return <g>{arrows}</g>;
              })()}
            </g>
          )}
        </svg>
      </div>

      <div className="drv-metrics">
        <div className="drv-metric">
          <span className="drv-metric-label">mode</span>
          <span className="drv-metric-value">{isTopDown ? 'top-down' : 'bottom-up'}</span>
        </div>
        <div className="drv-metric">
          <span className="drv-metric-label">n</span>
          <span className="drv-metric-value">{current.n}</span>
        </div>
        {isTopDown ? (
          <>
            <div className="drv-metric">
              <span className="drv-metric-label">calls made</span>
              <span className="drv-metric-value is-calls">{current.calls}</span>
            </div>
            <div className="drv-metric">
              <span className="drv-metric-label">cache hits</span>
              <span className="drv-metric-value is-hits">{current.hits}</span>
            </div>
          </>
        ) : (
          <div className="drv-metric">
            <span className="drv-metric-label">cells computed</span>
            <span className="drv-metric-value is-cells">{current.cells}</span>
          </div>
        )}
        <div className="drv-metric">
          <span className="drv-metric-label">result fib({current.n})</span>
          <span className="drv-metric-value is-result">{current.result != null ? current.result : '—'}</span>
        </div>
        <div className="drv-metric">
          <span className="drv-metric-label">vs naive</span>
          <span className="drv-metric-value">
            {isTopDown ? `~${2 * n + 1} calls vs ${naiveCalls} (≈2^n)` : `${n + 1} cells, O(n)`}
          </span>
        </div>
      </div>

      <div className="drv-narration">
        <span className="drv-narration-label">trace</span>
        <span className="drv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
