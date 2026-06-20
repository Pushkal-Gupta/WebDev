import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, Search } from 'lucide-react';
import './SegmentTreeLazyViz.css';

const INITIAL_ARR = [3, 1, 4, 1, 5, 9, 2, 6];

// Build canonical segment tree shape. Each node has id, lo, hi, depth, children ids.
function buildTreeShape(n) {
  const nodes = [];
  function rec(lo, hi, depth) {
    const id = nodes.length;
    const node = { id, lo, hi, depth, left: -1, right: -1 };
    nodes.push(node);
    if (lo !== hi) {
      const mid = (lo + hi) >> 1;
      node.left = rec(lo, mid, depth + 1);
      node.right = rec(mid + 1, hi, depth + 1);
    }
    return id;
  }
  rec(0, n - 1, 0);
  return nodes;
}

function initState(arr, shape) {
  const sum = new Array(shape.length).fill(0);
  const lazy = new Array(shape.length).fill(0);
  function build(idx) {
    const node = shape[idx];
    if (node.lo === node.hi) {
      sum[idx] = arr[node.lo];
      return;
    }
    build(node.left);
    build(node.right);
    sum[idx] = sum[node.left] + sum[node.right];
  }
  build(0);
  return { sum, lazy };
}

function cloneState(s) {
  return { sum: [...s.sum], lazy: [...s.lazy] };
}

function pushDownFrames(idx, shape, state, frames, baseNote) {
  if (state.lazy[idx] === 0) return;
  const node = shape[idx];
  if (node.left === -1) return;
  const add = state.lazy[idx];
  const L = shape[node.left];
  const R = shape[node.right];
  state.sum[node.left] += add * (L.hi - L.lo + 1);
  state.sum[node.right] += add * (R.hi - R.lo + 1);
  state.lazy[node.left] += add;
  state.lazy[node.right] += add;
  state.lazy[idx] = 0;
  frames.push({
    phase: 'push',
    activeNodes: [idx, node.left, node.right],
    pathEdges: [[idx, node.left], [idx, node.right]],
    state: cloneState(state),
    op: baseNote,
    note: `Push lazy +${add} from node #${idx} into children #${node.left}, #${node.right}. Sums update; child lazy tags absorb the value.`,
  });
}

function updateFrames(idx, l, r, val, shape, state, frames, baseNote) {
  const node = shape[idx];
  if (r < node.lo || node.hi < l) {
    frames.push({
      phase: 'visit',
      activeNodes: [idx],
      pathEdges: [],
      state: cloneState(state),
      op: baseNote,
      note: `Node #${idx} [${node.lo}, ${node.hi}] is fully outside [${l}, ${r}]. Skip.`,
    });
    return;
  }
  if (l <= node.lo && node.hi <= r) {
    state.sum[idx] += val * (node.hi - node.lo + 1);
    state.lazy[idx] += val;
    frames.push({
      phase: 'tag',
      activeNodes: [idx],
      pathEdges: [],
      state: cloneState(state),
      op: baseNote,
      note: `Node #${idx} [${node.lo}, ${node.hi}] is fully inside [${l}, ${r}]. Add +${val} lazily — stop here, don't descend.`,
    });
    return;
  }
  frames.push({
    phase: 'visit',
    activeNodes: [idx],
    pathEdges: [],
    state: cloneState(state),
    op: baseNote,
    note: `Node #${idx} [${node.lo}, ${node.hi}] partially overlaps [${l}, ${r}]. Push any lazy, then recurse.`,
  });
  pushDownFrames(idx, shape, state, frames, baseNote);
  updateFrames(node.left, l, r, val, shape, state, frames, baseNote);
  updateFrames(node.right, l, r, val, shape, state, frames, baseNote);
  state.sum[idx] = state.sum[node.left] + state.sum[node.right];
  frames.push({
    phase: 'pull',
    activeNodes: [idx, node.left, node.right],
    pathEdges: [[idx, node.left], [idx, node.right]],
    state: cloneState(state),
    op: baseNote,
    note: `Recombine #${idx}.sum = #${node.left}.sum + #${node.right}.sum = ${state.sum[node.left]} + ${state.sum[node.right]} = ${state.sum[idx]}.`,
  });
}

function queryFrames(idx, l, r, shape, state, frames, baseNote) {
  const node = shape[idx];
  if (r < node.lo || node.hi < l) {
    frames.push({
      phase: 'visit',
      activeNodes: [idx],
      pathEdges: [],
      state: cloneState(state),
      op: baseNote,
      note: `Node #${idx} [${node.lo}, ${node.hi}] is fully outside [${l}, ${r}]. Contribute 0.`,
    });
    return 0;
  }
  if (l <= node.lo && node.hi <= r) {
    frames.push({
      phase: 'collect',
      activeNodes: [idx],
      pathEdges: [],
      state: cloneState(state),
      op: baseNote,
      note: `Node #${idx} [${node.lo}, ${node.hi}] fully inside [${l}, ${r}]. Contribute sum = ${state.sum[idx]}.`,
    });
    return state.sum[idx];
  }
  frames.push({
    phase: 'visit',
    activeNodes: [idx],
    pathEdges: [],
    state: cloneState(state),
    op: baseNote,
    note: `Node #${idx} [${node.lo}, ${node.hi}] partial overlap. Push lazy, recurse both children.`,
  });
  pushDownFrames(idx, shape, state, frames, baseNote);
  const a = queryFrames(node.left, l, r, shape, state, frames, baseNote);
  const b = queryFrames(node.right, l, r, shape, state, frames, baseNote);
  return a + b;
}

function buildFrames(ops, arr, shape) {
  const state = initState(arr, shape);
  const frames = [{
    phase: 'init',
    activeNodes: [],
    pathEdges: [],
    state: cloneState(state),
    op: 'init',
    note: 'Tree built. Internal nodes store segment sums; lazy tags all 0.',
    result: null,
  }];
  for (const op of ops) {
    if (op.kind === 'update') {
      const baseNote = `update(+${op.val}, [${op.l}, ${op.r}])`;
      frames.push({
        phase: 'op-start',
        activeNodes: [],
        pathEdges: [],
        state: cloneState(state),
        op: baseNote,
        note: `Begin range update: add +${op.val} to positions [${op.l}, ${op.r}].`,
      });
      updateFrames(0, op.l, op.r, op.val, shape, state, frames, baseNote);
      frames.push({
        phase: 'op-done',
        activeNodes: [],
        pathEdges: [],
        state: cloneState(state),
        op: baseNote,
        note: `Update done. Root sum = ${state.sum[0]}.`,
      });
    } else {
      const baseNote = `query([${op.l}, ${op.r}])`;
      frames.push({
        phase: 'op-start',
        activeNodes: [],
        pathEdges: [],
        state: cloneState(state),
        op: baseNote,
        note: `Begin range sum query on [${op.l}, ${op.r}].`,
      });
      const ans = queryFrames(0, op.l, op.r, shape, state, frames, baseNote);
      frames.push({
        phase: 'op-done',
        activeNodes: [],
        pathEdges: [],
        state: cloneState(state),
        op: baseNote,
        note: `Query done. sum([${op.l}, ${op.r}]) = ${ans}.`,
        result: ans,
      });
    }
  }
  return frames;
}

const DEFAULT_OPS = [
  { kind: 'update', l: 1, r: 5, val: 3 },
  { kind: 'query', l: 2, r: 6 },
  { kind: 'update', l: 0, r: 3, val: 2 },
  { kind: 'query', l: 1, r: 7 },
];

function leafValues(arr, shape, state) {
  // Effective leaf value = base sum at leaf node (since lazy applies as we push)
  const vals = [...arr];
  // We can't reconstruct effective values without pushing; compute via DFS applying lazy:
  const pending = [...state.lazy];
  const out = [...vals];
  function walk(idx, acc) {
    const node = shape[idx];
    const next = acc + pending[idx];
    if (node.left === -1) {
      out[node.lo] = next;
      return;
    }
    walk(node.left, next);
    walk(node.right, next);
  }
  walk(0, 0);
  return out;
}

export default function SegmentTreeLazyViz() {
  const arr = INITIAL_ARR;
  const shape = useMemo(() => buildTreeShape(arr.length), [arr.length]);

  const [lInput, setLInput] = useState('1');
  const [rInput, setRInput] = useState('5');
  const [kInput, setKInput] = useState('3');
  const [ops, setOps] = useState(DEFAULT_OPS);

  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(ops, arr, shape), [ops, arr, shape]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return;
    runTimer.current = setTimeout(() => {
      setStep((s2) => Math.min(s2 + 1, totalSteps - 1));
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

  const parseRange = () => {
    const l = parseInt(lInput, 10);
    const r = parseInt(rInput, 10);
    if (Number.isNaN(l) || Number.isNaN(r) || l < 0 || r >= arr.length || l > r) return null;
    return { l, r };
  };

  const addUpdate = () => {
    const range = parseRange();
    const k = parseInt(kInput, 10);
    if (!range || Number.isNaN(k)) return;
    setOps((prev) => [...prev, { kind: 'update', l: range.l, r: range.r, val: k }]);
    setIsRunningRaw(false);
    setStep(0);
  };

  const addQuery = () => {
    const range = parseRange();
    if (!range) return;
    setOps((prev) => [...prev, { kind: 'query', l: range.l, r: range.r }]);
    setIsRunningRaw(false);
    setStep(0);
  };

  const clearOps = () => {
    setOps([]);
    setIsRunningRaw(false);
    setStep(0);
  };

  // Layout
  const W = 880;
  const padX = 30;
  const treeTopY = 40;
  const levelH = 60;
  const maxDepth = Math.max(...shape.map((n) => n.depth));
  const leafCount = arr.length;

  // Position internal nodes by depth + symmetric layout. Use leaf positions to anchor.
  const leafW = (W - padX * 2) / leafCount;
  const leafXs = arr.map((_, i) => padX + i * leafW + leafW / 2);

  const nodePos = new Array(shape.length).fill(null);
  // Leaves anchor first
  for (const n of shape) {
    if (n.lo === n.hi) {
      nodePos[n.id] = { x: leafXs[n.lo], y: treeTopY + maxDepth * levelH };
    }
  }
  // Internal: children midpoint
  for (let d = maxDepth - 1; d >= 0; d--) {
    for (const n of shape) {
      if (n.depth === d && n.left !== -1) {
        const lp = nodePos[n.left];
        const rp = nodePos[n.right];
        nodePos[n.id] = { x: (lp.x + rp.x) / 2, y: treeTopY + d * levelH };
      }
    }
  }

  const nodeW = 46;
  const nodeH = 30;
  const leafH = 34;
  const leafCellW = Math.min(50, leafW - 4);
  const treeH = treeTopY + maxDepth * levelH + nodeH;
  const leafRowY = treeH + 28;
  const H = leafRowY + leafH + 40;

  const activeSet = new Set(current.activeNodes);
  const activeEdges = new Set(current.pathEdges.map(([a, b]) => `${a}-${b}`));

  const effLeaves = leafValues(arr, shape, current.state);

  const lastResultFrame = [...frames.slice(0, step + 1)].reverse().find((f) => f.result != null);
  const lastResult = lastResultFrame ? lastResultFrame.result : null;

  return (
    <div className="stlz">
      <div className="stlz-head">
        <h3 className="stlz-title">Segment tree with lazy propagation — range update, range sum</h3>
        <p className="stlz-sub">
          Fully-covered nodes absorb a lazy tag and stop. The tag pushes down to children only when a later
          operation needs to descend through them — touching O(log n) nodes per call.
        </p>
      </div>

      <div className="stlz-controls">
        <div className="stlz-field">
          <span className="stlz-label">l</span>
          <input className="stlz-input" value={lInput} onChange={(e) => setLInput(e.target.value)} />
        </div>
        <div className="stlz-field">
          <span className="stlz-label">r</span>
          <input className="stlz-input" value={rInput} onChange={(e) => setRInput(e.target.value)} />
        </div>
        <div className="stlz-field">
          <span className="stlz-label">k</span>
          <input className="stlz-input" value={kInput} onChange={(e) => setKInput(e.target.value)} />
        </div>
        <button type="button" className="stlz-btn" onClick={addUpdate}>
          <Plus size={14} /> +k on [l,r]
        </button>
        <button type="button" className="stlz-btn" onClick={addQuery}>
          <Search size={14} /> sum [l,r]
        </button>
        <button type="button" className="stlz-btn" onClick={clearOps}>
          Clear ops
        </button>

        <div className="stlz-actions">
          <div className="stlz-buttons">
            <button
              type="button"
              className="stlz-btn stlz-btn-primary"
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
              className="stlz-btn"
              onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="stlz-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="stlz-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="stlz-speed">
            <span className="stlz-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="stlz-speed-range"
            />
            <span className="stlz-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="stlz-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="stlz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="stlz-svg" preserveAspectRatio="xMidYMid meet">
          <text x={padX} y={20} className="stlz-row-label">segment tree</text>

          {shape.map((n) => {
            if (n.left === -1) return null;
            const p = nodePos[n.id];
            const lp = nodePos[n.left];
            const rp = nodePos[n.right];
            const leftActive = activeEdges.has(`${n.id}-${n.left}`);
            const rightActive = activeEdges.has(`${n.id}-${n.right}`);
            return (
              <g key={`edge-${n.id}`}>
                <line
                  x1={p.x} y1={p.y + nodeH / 2}
                  x2={lp.x} y2={lp.y - (lp.y === treeTopY + maxDepth * levelH ? 0 : nodeH / 2)}
                  className={leftActive ? 'stlz-edge stlz-edge-active' : 'stlz-edge'}
                />
                <line
                  x1={p.x} y1={p.y + nodeH / 2}
                  x2={rp.x} y2={rp.y - (rp.y === treeTopY + maxDepth * levelH ? 0 : nodeH / 2)}
                  className={rightActive ? 'stlz-edge stlz-edge-active' : 'stlz-edge'}
                />
              </g>
            );
          })}

          {shape.map((n) => {
            const p = nodePos[n.id];
            const isLeaf = n.lo === n.hi;
            if (isLeaf) return null;
            const isActive = activeSet.has(n.id);
            const hasLazy = current.state.lazy[n.id] !== 0;
            return (
              <g key={`node-${n.id}`}>
                <rect
                  x={p.x - nodeW / 2}
                  y={p.y - nodeH / 2}
                  width={nodeW}
                  height={nodeH}
                  rx={5}
                  className="stlz-node-rect"
                  fill={isActive ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--surface)'}
                  stroke={isActive ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text x={p.x} y={p.y - 2} className="stlz-node-val">{current.state.sum[n.id]}</text>
                <text x={p.x} y={p.y + 11} className="stlz-node-range">[{n.lo},{n.hi}]</text>
                {hasLazy && (
                  <g>
                    <circle
                      cx={p.x + nodeW / 2 - 4}
                      cy={p.y - nodeH / 2 + 4}
                      r={9}
                      className="stlz-lazy-chip"
                    />
                    <text
                      x={p.x + nodeW / 2 - 4}
                      y={p.y - nodeH / 2 + 4}
                      className="stlz-lazy-text"
                    >
                      +{current.state.lazy[n.id]}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          <text x={padX} y={leafRowY - 8} className="stlz-row-label">array (effective)</text>
          {arr.map((_, i) => {
            const x = leafXs[i] - leafCellW / 2;
            const isActive = activeSet.has(shape.findIndex((n) => n.lo === i && n.hi === i));
            return (
              <g key={`leaf-${i}`}>
                <rect
                  x={x}
                  y={leafRowY}
                  width={leafCellW}
                  height={leafH}
                  rx={4}
                  className="stlz-leaf-rect"
                  fill={isActive ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={isActive ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text x={leafXs[i]} y={leafRowY + leafH / 2 + 2} className="stlz-leaf-val">{effLeaves[i]}</text>
                <text x={leafXs[i]} y={leafRowY + leafH + 12} className="stlz-leaf-idx">{i}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="stlz-metrics">
        <div className="stlz-metric">
          <span className="stlz-metric-label">phase</span>
          <span className="stlz-metric-value">{current.phase}</span>
        </div>
        <div className="stlz-metric">
          <span className="stlz-metric-label">op</span>
          <span className="stlz-metric-value">{current.op}</span>
        </div>
        <div className="stlz-metric">
          <span className="stlz-metric-label">root sum</span>
          <span className="stlz-metric-value">{current.state.sum[0]}</span>
        </div>
        <div className="stlz-metric stlz-metric-dim">
          <span className="stlz-metric-label">last query</span>
          <span className="stlz-metric-value stlz-metric-dimval">{lastResult == null ? '—' : lastResult}</span>
        </div>
      </div>

      <div className="stlz-arith">
        <span className="stlz-arith-label">trace</span>
        <span className="stlz-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
