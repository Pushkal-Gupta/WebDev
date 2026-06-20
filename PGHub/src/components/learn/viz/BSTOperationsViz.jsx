import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Search, Plus } from 'lucide-react';
import './BSTOperationsViz.css';

const INITIAL_VALUES = [50, 30, 70, 20, 40, 60, 80, 35, 65];

function makeNode(value) {
  return { value, left: null, right: null };
}

function buildTree(values) {
  let root = null;
  for (const v of values) {
    root = insertInto(root, v);
  }
  return root;
}

function insertInto(root, value) {
  if (!root) return makeNode(value);
  let node = root;
  while (true) {
    if (value < node.value) {
      if (!node.left) { node.left = makeNode(value); break; }
      node = node.left;
    } else if (value > node.value) {
      if (!node.right) { node.right = makeNode(value); break; }
      node = node.right;
    } else {
      break; // duplicate, ignore
    }
  }
  return root;
}

function cloneTree(root) {
  if (!root) return null;
  return { value: root.value, left: cloneTree(root.left), right: cloneTree(root.right) };
}

// Assign x by in-order index, y by depth.
function layout(root) {
  const nodes = [];
  let order = 0;
  let maxDepth = 0;
  (function walk(node, depth) {
    if (!node) return;
    walk(node.left, depth + 1);
    node._order = order++;
    node._depth = depth;
    if (depth > maxDepth) maxDepth = depth;
    nodes.push(node);
    walk(node.right, depth + 1);
  })(root, 0);
  const count = nodes.length || 1;
  return { nodes, count, maxDepth };
}

// Build a step-by-step trace of a search (find) operation.
function buildSearchFrames(root, target) {
  const frames = [];
  const path = [];
  let node = root;
  const stepsTaken = [];

  frames.push({
    op: 'search', target, current: null, found: false, done: false,
    path: [], inserted: null, parent: null,
    note: `Search for ${target}: start at the root. A BST keeps left < node < right, so each comparison halves the search space.`,
  });

  while (node) {
    path.push(node.value);
    if (target === node.value) {
      frames.push({
        op: 'search', target, current: node.value, found: true, done: true,
        path: [...path], inserted: null, parent: null,
        note: `${target} == ${node.value}: match found. ${stepsTaken.length ? stepsTaken.join('; ') + '; ' : ''}stop.`,
      });
      return frames;
    }
    if (target < node.value) {
      stepsTaken.push(`${target} < ${node.value} go left`);
      frames.push({
        op: 'search', target, current: node.value, found: false, done: false,
        path: [...path], inserted: null, parent: null,
        note: `${target} < ${node.value} -> go left.`,
      });
      node = node.left;
    } else {
      stepsTaken.push(`${target} > ${node.value} go right`);
      frames.push({
        op: 'search', target, current: node.value, found: false, done: false,
        path: [...path], inserted: null, parent: null,
        note: `${target} > ${node.value} -> go right.`,
      });
      node = node.right;
    }
  }

  frames.push({
    op: 'search', target, current: null, found: false, done: true,
    path: [...path], inserted: null, parent: null,
    note: `Fell off the tree: ${target} is not present. ${stepsTaken.length ? stepsTaken.join('; ') + '.' : ''}`,
  });
  return frames;
}

// Build a step-by-step trace of an insert operation against a clone.
function buildInsertFrames(root, value) {
  const frames = [];
  const working = cloneTree(root);
  const path = [];
  const steps = [];

  frames.push({
    op: 'insert', target: value, current: null, found: false, done: false,
    path: [], inserted: null, parent: null, tree: working,
    note: `Insert ${value}: walk down comparing at each node, then hang it as a new leaf where the search falls off.`,
  });

  if (!working) {
    const newRoot = makeNode(value);
    frames.push({
      op: 'insert', target: value, current: value, found: false, done: true,
      path: [value], inserted: value, parent: null, tree: newRoot,
      note: `Tree was empty: ${value} becomes the root.`,
    });
    return { frames, newTree: newRoot };
  }

  let node = working;
  let parent = null;
  let side = null;
  while (node) {
    path.push(node.value);
    if (value === node.value) {
      frames.push({
        op: 'insert', target: value, current: node.value, found: true, done: true,
        path: [...path], inserted: null, parent: null, tree: working,
        note: `${value} == ${node.value}: already in the tree. BSTs hold no duplicates — nothing to insert.`,
      });
      return { frames, newTree: working };
    }
    parent = node;
    if (value < node.value) {
      steps.push(`${value} < ${node.value} go left`);
      frames.push({
        op: 'insert', target: value, current: node.value, found: false, done: false,
        path: [...path], inserted: null, parent: null, tree: working,
        note: `${value} < ${node.value} -> go left.`,
      });
      side = 'left';
      node = node.left;
    } else {
      steps.push(`${value} > ${node.value} go right`);
      frames.push({
        op: 'insert', target: value, current: node.value, found: false, done: false,
        path: [...path], inserted: null, parent: null, tree: working,
        note: `${value} > ${node.value} -> go right.`,
      });
      side = 'right';
      node = node.right;
    }
  }

  const fresh = makeNode(value);
  if (side === 'left') parent.left = fresh; else parent.right = fresh;
  path.push(value);
  frames.push({
    op: 'insert', target: value, current: value, found: false, done: true,
    path: [...path], inserted: value, parent: parent.value, tree: working,
    note: `${steps.join('; ')}; empty ${side} slot -> insert ${value} as the ${side} child of ${parent.value}.`,
  });
  return { frames, newTree: working };
}

const NODE_R = 18;

export default function BSTOperationsViz() {
  const [tree, setTree] = useState(() => buildTree(INITIAL_VALUES));
  const [inputVal, setInputVal] = useState('45');
  const [frames, setFrames] = useState(() => [{
    op: 'idle', target: null, current: null, found: false, done: true,
    path: [], inserted: null, parent: null,
    note: 'Insert a value or search for one. Each comparison decides left or right — the highlighted path is exactly what the algorithm visits.',
  }]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [pendingTree, setPendingTree] = useState(null);
  const runTimer = useRef(null);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  // Only reveal the freshly attached node on the final insert frame; mid-walk shows the pre-insert tree.
  const displayTree = (current.op === 'insert' && current.inserted != null && current.done)
    ? current.tree
    : tree;
  const { nodes } = useMemo(() => layout(displayTree), [displayTree]);

  const W = 940;
  const H = 360;
  const padX = 46;
  const topY = 52;
  const levelGap = 70;
  const count = Math.max(nodes.length, 1);
  const xOf = (node) => padX + (node._order + 0.5) * ((W - padX * 2) / count);
  const yOf = (node) => topY + node._depth * levelGap;

  useEffect(() => {
    if (!isRunning) return;
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

  // Commit a completed insert into the live tree once the animation reaches the final frame.
  useEffect(() => {
    if (pendingTree && step >= totalSteps - 1) {
      setTree(pendingTree);
      setPendingTree(null);
    }
  }, [pendingTree, step, totalSteps]);

  const startSearch = () => {
    const v = parseInt(inputVal, 10);
    if (Number.isNaN(v)) return;
    setIsRunningRaw(false);
    setPendingTree(null);
    setFrames(buildSearchFrames(tree, v));
    setStep(0);
    setIsRunningRaw(true);
  };

  const startInsert = () => {
    const v = parseInt(inputVal, 10);
    if (Number.isNaN(v)) return;
    setIsRunningRaw(false);
    const { frames: f, newTree } = buildInsertFrames(tree, v);
    setFrames(f);
    setPendingTree(newTree);
    setStep(0);
    setIsRunningRaw(true);
  };

  const reset = () => {
    setIsRunningRaw(false);
    setPendingTree(null);
    setTree(buildTree(INITIAL_VALUES));
    setFrames([{
      op: 'idle', target: null, current: null, found: false, done: true,
      path: [], inserted: null, parent: null,
      note: 'Insert a value or search for one. Each comparison decides left or right — the highlighted path is exactly what the algorithm visits.',
    }]);
    setStep(0);
  };

  const pathSet = new Set(current.path);
  const onPath = (val) => pathSet.has(val);
  const currentVal = current.current;

  // Tree edges: from each node to its existing children present in layout.
  const edges = [];
  (function collect(node) {
    if (!node) return;
    if (node.left) { edges.push([node, node.left]); collect(node.left); }
    if (node.right) { edges.push([node, node.right]); collect(node.right); }
  })(displayTree);

  const playing = isRunningRaw && step < totalSteps - 1;

  return (
    <div className="bstv">
      <div className="bstv-head">
        <h3 className="bstv-title">Binary search tree — insert &amp; search in O(h)</h3>
        <p className="bstv-sub">
          Left subtree &lt; node &lt; right subtree. Every operation is one comparison per level, so the work is the
          height h — O(log n) when balanced, O(n) when the tree degrades to a chain.
        </p>
      </div>

      <div className="bstv-controls">
        <div className="bstv-actions">
          <div className="bstv-opbar">
            <input
              type="number"
              className="bstv-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              aria-label="value to insert or search"
            />
            <button type="button" className="bstv-btn bstv-btn-primary" onClick={startInsert}>
              <Plus size={14} /> Insert
            </button>
            <button type="button" className="bstv-btn" onClick={startSearch}>
              <Search size={14} /> Search
            </button>
          </div>
          <div className="bstv-buttons">
            <button
              type="button"
              className="bstv-btn"
              onClick={() => {
                if (step >= totalSteps - 1) return;
                setIsRunningRaw((v) => !v);
              }}
              disabled={totalSteps <= 1}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="bstv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="bstv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="bstv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="bstv-speed">
            <span className="bstv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bstv-speed-range"
            />
            <span className="bstv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="bstv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="bstv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bstv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={12} y={12} width={W - 24} height={H - 24} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {edges.map(([p, c], i) => {
            const onp = onPath(p.value) && onPath(c.value);
            return (
              <line
                key={`edge-${i}`}
                x1={xOf(p)} y1={yOf(p)} x2={xOf(c)} y2={yOf(c)}
                stroke={onp ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={onp ? 2.6 : 1.6}
                opacity={onp ? 1 : 0.7}
              />
            );
          })}

          {nodes.map((nd) => {
            const isCurrent = nd.value === currentVal;
            const isInserted = current.inserted === nd.value && current.done;
            const isFoundHit = current.found && current.done && nd.value === currentVal;
            const visited = onPath(nd.value);
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            let labelFill = 'var(--text-main)';
            if (isFoundHit) {
              fill = 'var(--easy)'; stroke = 'var(--easy)'; labelFill = 'var(--bg)';
            } else if (isInserted) {
              fill = 'var(--accent)'; stroke = 'var(--accent)'; labelFill = 'var(--bg)';
            } else if (isCurrent) {
              fill = 'var(--medium)'; stroke = 'var(--medium)'; labelFill = 'var(--bg)';
            } else if (visited) {
              fill = 'rgba(var(--accent-rgb), 0.18)'; stroke = 'var(--accent)';
            }
            return (
              <g key={`node-${nd.value}`}>
                <circle
                  cx={xOf(nd)} cy={yOf(nd)} r={NODE_R}
                  fill={fill} stroke={stroke}
                  strokeWidth={isCurrent || isInserted || isFoundHit ? 3 : 2}
                />
                <text x={xOf(nd)} y={yOf(nd) + 4} className="bstv-node-label" style={{ fill: labelFill }}>
                  {nd.value}
                </text>
              </g>
            );
          })}

          {/* target chip while an op is active */}
          {current.target != null && (
            <g>
              <rect x={W - 168} y={22} width={146} height={30} rx={6} fill="var(--bg)" stroke="var(--accent)" strokeWidth={1.4} />
              <text x={W - 156} y={41} className="bstv-target-label">
                {current.op === 'insert' ? 'insert' : 'search'} {current.target}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="bstv-metrics">
        <div className="bstv-metric">
          <span className="bstv-metric-label">operation</span>
          <span className="bstv-metric-value">{current.op}</span>
        </div>
        <div className="bstv-metric">
          <span className="bstv-metric-label">at node</span>
          <span className="bstv-metric-value">{currentVal == null ? '—' : currentVal}</span>
        </div>
        <div className="bstv-metric">
          <span className="bstv-metric-label">comparisons</span>
          <span className="bstv-metric-value">{current.path.length}</span>
        </div>
        <div className="bstv-metric bstv-metric-dim">
          <span className="bstv-metric-label">result</span>
          <span className="bstv-metric-value bstv-metric-dimval">
            {current.op === 'search' && current.done ? (current.found ? 'found' : 'not found')
              : current.op === 'insert' && current.done ? (current.inserted == null ? 'duplicate' : 'inserted')
              : current.done ? 'ready' : 'walking'}
          </span>
        </div>
      </div>

      <div className="bstv-arith">
        <span className="bstv-arith-label">comparison path</span>
        <span className="bstv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
