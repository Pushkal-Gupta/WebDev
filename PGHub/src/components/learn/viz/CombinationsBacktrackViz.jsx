import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Scissors } from 'lucide-react';
import './CombinationsBacktrackViz.css';

// Build the full DFS recursion tree for choosing k of {1..n}, then emit one
// animation frame per visited tree event (enter / emit / prune / backtrack).
// The pruning is the teaching point: at node (start, partial), if even taking
// every remaining element can't reach size k, we stop without descending.
function buildPlan(n, k) {
  // Tree nodes carry geometry so the SVG can draw the recursion tree statically
  // while frames only toggle which node/edge is "active".
  const nodes = [];
  const edges = [];
  let idCounter = 0;

  // First pass: build the pruned recursion tree structure with depth + order,
  // recording for each node whether it is a leaf (emit) or pruned.
  function build(start, partial, parentId, depth) {
    const id = idCounter++;
    const need = k - partial.length;
    const remaining = n - start + 1; // candidates start..n inclusive
    const pruned = need > 0 && remaining < need; // can't possibly fill k
    const isLeaf = partial.length === k;
    const node = {
      id,
      depth,
      start,
      partial: partial.slice(),
      need,
      remaining,
      pruned,
      isLeaf,
      children: [],
      x: 0,
      y: 0,
    };
    nodes.push(node);
    if (parentId !== null) edges.push({ from: parentId, to: id });

    if (!pruned && !isLeaf) {
      for (let v = start; v <= n; v++) {
        // Bound: if choosing v leaves too few candidates to finish, the whole
        // subtree from v onward is doomed, so we stop expanding siblings.
        if (n - v + 1 < need) {
          // mark the cut visually as a pruned stub child
          const stubId = idCounter++;
          nodes.push({
            id: stubId,
            depth: depth + 1,
            start: v,
            partial: [...partial, v],
            need: need - 1,
            remaining: n - v + 1,
            pruned: true,
            isLeaf: false,
            isStub: true,
            children: [],
            x: 0,
            y: 0,
          });
          edges.push({ from: id, to: stubId });
          node.children.push(stubId);
          break;
        }
        const childId = build(v + 1, [...partial, v], id, depth + 1);
        node.children.push(childId);
      }
    }
    return id;
  }

  build(1, [], null, 0);

  // Layout: assign x by in-order leaf positions, y by depth.
  const byId = new Map(nodes.map((nd) => [nd.id, nd]));
  let leafCursor = 0;
  function layout(id) {
    const nd = byId.get(id);
    if (nd.children.length === 0) {
      nd.x = leafCursor;
      leafCursor += 1;
      return nd.x;
    }
    let sum = 0;
    for (const c of nd.children) sum += layout(c);
    nd.x = sum / nd.children.length;
    return nd.x;
  }
  layout(0);
  const spanCols = Math.max(leafCursor - 1, 1);
  const maxDepth = nodes.reduce((m, nd) => Math.max(m, nd.depth), 0);

  // Second pass: DFS walk producing frames, mirroring real backtracking order.
  const frames = [];
  const found = []; // emitted combinations
  let explored = 0;
  let prunedCount = 0;

  function setStr(arr) {
    return arr.length ? `{ ${arr.join(', ')} }` : '{ }';
  }

  function walk(id) {
    const nd = byId.get(id);
    if (nd.isStub) {
      prunedCount += 1;
      frames.push({
        activeId: id,
        partial: nd.partial.slice(),
        kind: 'prune',
        found: found.map((f) => f.slice()),
        explored,
        prunedCount,
        note: `Prune: from index ${nd.start} only ${nd.remaining} element(s) remain but ${nd.need} more are needed. This branch can't reach size ${k} — cut it.`,
      });
      return;
    }
    explored += 1;
    if (nd.pruned) {
      prunedCount += 1;
      frames.push({
        activeId: id,
        partial: nd.partial.slice(),
        kind: 'prune',
        found: found.map((f) => f.slice()),
        explored,
        prunedCount,
        note: `Prune: partial ${setStr(nd.partial)} has ${nd.remaining} candidate(s) left from index ${nd.start}, but needs ${nd.need} more. Impossible — backtrack.`,
      });
      return;
    }
    if (nd.isLeaf) {
      found.push(nd.partial.slice());
      frames.push({
        activeId: id,
        partial: nd.partial.slice(),
        kind: 'emit',
        found: found.map((f) => f.slice()),
        explored,
        prunedCount,
        note: `Leaf: partial ${setStr(nd.partial)} has size ${k} = k. Emit combination #${found.length}, then backtrack.`,
      });
      return;
    }
    // internal node: descend
    const last = nd.partial.length ? nd.partial[nd.partial.length - 1] : null;
    frames.push({
      activeId: id,
      partial: nd.partial.slice(),
      kind: 'enter',
      found: found.map((f) => f.slice()),
      explored,
      prunedCount,
      note:
        nd.partial.length === 0
          ? `Start DFS at index ${nd.start} with empty partial. Choose or skip each of {1..${n}}.`
          : `Chose ${last} -> partial ${setStr(nd.partial)} (size ${nd.partial.length}). Need ${nd.need} more; try candidates from index ${nd.start}.`,
    });
    for (const c of nd.children) walk(c);
    // backtrack frame after exploring all children (only for real internal nodes)
    frames.push({
      activeId: id,
      partial: nd.partial.slice(),
      kind: 'backtrack',
      found: found.map((f) => f.slice()),
      explored,
      prunedCount,
      note:
        nd.partial.length === 0
          ? `All branches from the root explored. ${found.length} combination(s) found — that is C(${n},${k}).`
          : `Exhausted choices after ${setStr(nd.partial)}. Undo ${last} (pop) and backtrack to the parent.`,
    });
  }

  walk(0);

  return { nodes, edges, frames, spanCols, maxDepth, found };
}

const N_RANGE = [3, 4, 5, 6];
const NODE_R = 17;

export default function CombinationsBacktrackViz() {
  const [n, setN] = useState(4);
  const [k, setK] = useState(2);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const plan = useMemo(() => buildPlan(n, k), [n, k]);
  const { nodes, edges, frames, spanCols, maxDepth } = plan;
  const byId = useMemo(() => new Map(nodes.map((nd) => [nd.id, nd])), [nodes]);

  const totalSteps = frames.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(950 / speed);

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

  const changeN = (next) => {
    if (next === n) return;
    setIsRunningRaw(false);
    setStep(0);
    setN(next);
    if (k > next) setK(next);
  };

  const changeK = (next) => {
    const clamped = Math.max(1, Math.min(next, n));
    if (clamped === k) return;
    setIsRunningRaw(false);
    setStep(0);
    setK(clamped);
  };

  // ---- geometry ----
  const W = 940;
  const H = 430;
  const treeLeft = 56;
  const treeRight = W - 320;
  const treeTop = 64;
  const treeBottom = H - 48;
  const colW = (treeRight - treeLeft) / Math.max(spanCols, 1);
  const rowH = (treeBottom - treeTop) / Math.max(maxDepth, 1);
  const nx = (nd) => treeLeft + nd.x * colW;
  const ny = (nd) => treeTop + nd.depth * rowH;

  // visited set: every node whose enter/emit/prune frame index <= safeStep.
  const visitedFirstIdx = useMemo(() => {
    const m = new Map();
    frames.forEach((f, i) => {
      if (!m.has(f.activeId)) m.set(f.activeId, i);
    });
    return m;
  }, [frames]);

  const activeId = current.activeId;
  const activeNode = byId.get(activeId);
  const pathIds = useMemo(() => {
    // ids on the current partial path (chain of chosen ancestors of activeNode)
    const ids = new Set();
    if (!activeNode) return ids;
    // Walk up via edges (find parent of each node).
    const parentOf = new Map();
    for (const e of edges) parentOf.set(e.to, e.from);
    let cur = activeId;
    while (cur !== undefined) {
      ids.add(cur);
      cur = parentOf.get(cur);
    }
    return ids;
  }, [activeId, activeNode, edges]);

  const foundList = current.found;
  const totalFound = foundList.length;
  const cnk = plan.found.length;

  const nodeFill = (nd) => {
    const visited = visitedFirstIdx.has(nd.id) && visitedFirstIdx.get(nd.id) <= safeStep;
    if (nd.id === activeId) {
      if (current.kind === 'emit') return 'var(--easy)';
      if (current.kind === 'prune') return 'var(--hard)';
      return 'var(--hue-pink)';
    }
    if (!visited) return 'var(--bg)';
    if (nd.pruned || nd.isStub) return 'var(--surface)';
    if (nd.isLeaf) return 'rgba(var(--accent-rgb), 0.22)';
    return 'rgba(var(--accent-rgb), 0.12)';
  };
  const nodeStroke = (nd) => {
    if (nd.id === activeId) {
      if (current.kind === 'emit') return 'var(--easy)';
      if (current.kind === 'prune') return 'var(--hard)';
      return 'var(--hue-pink)';
    }
    if (pathIds.has(nd.id)) return 'var(--accent)';
    if (nd.pruned || nd.isStub) return 'var(--hard)';
    if (nd.isLeaf) return 'var(--easy)';
    return 'var(--border)';
  };

  const kindLabel = {
    enter: 'descend',
    emit: 'emit',
    prune: 'prune',
    backtrack: 'backtrack',
  }[current.kind];

  return (
    <div className="cbv">
      <div className="cbv-head">
        <h3 className="cbv-title">Combinations by backtracking — generate every C(n, k)</h3>
        <p className="cbv-sub">
          DFS chooses elements in increasing order. At each node, if the elements left can&rsquo;t fill the
          remaining slots, the branch is pruned. A partial of size k is a leaf: emit it and backtrack.
        </p>
      </div>

      <div className="cbv-controls">
        <div className="cbv-params">
          <div className="cbv-param">
            <span className="cbv-param-label">n</span>
            <div className="cbv-seg">
              {N_RANGE.map((val) => (
                <button
                  key={`n-${val}`}
                  type="button"
                  className={`cbv-seg-btn ${n === val ? 'cbv-seg-active' : ''}`}
                  onClick={() => changeN(val)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
          <div className="cbv-param">
            <span className="cbv-param-label">k</span>
            <div className="cbv-seg">
              {Array.from({ length: n }, (_, i) => i + 1).map((val) => (
                <button
                  key={`k-${val}`}
                  type="button"
                  className={`cbv-seg-btn ${k === val ? 'cbv-seg-active' : ''}`}
                  onClick={() => changeK(val)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
          <div className="cbv-target">
            C({n},{k}) = <strong>{cnk}</strong>
          </div>
        </div>

        <div className="cbv-actions">
          <div className="cbv-buttons">
            <button
              type="button"
              className="cbv-btn cbv-btn-primary"
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
              className="cbv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="cbv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="cbv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="cbv-speed">
            <span className="cbv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="cbv-speed-range"
            />
            <span className="cbv-speed-value">{speed.toFixed(1)}&times;</span>
          </label>
          <div className="cbv-stepcount">
            step <strong>{safeStep + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="cbv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cbv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={treeRight - 16 + 18} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={28} y={40} className="cbv-row-label">
            recursion tree — choose in increasing order, prune the impossible
          </text>

          {/* edges */}
          {edges.map((e) => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
            if (!a || !b) return null;
            const onPath = pathIds.has(e.to) && pathIds.has(e.from);
            const childVisited =
              visitedFirstIdx.has(e.to) && visitedFirstIdx.get(e.to) <= safeStep;
            const stroke = onPath
              ? 'var(--accent)'
              : childVisited
                ? (b.pruned || b.isStub ? 'var(--hard)' : 'var(--text-dim)')
                : 'var(--border)';
            return (
              <line
                key={`e-${e.from}-${e.to}`}
                x1={nx(a)}
                y1={ny(a) + NODE_R}
                x2={nx(b)}
                y2={ny(b) - NODE_R}
                stroke={stroke}
                strokeWidth={onPath ? 2.6 : 1.2}
                opacity={childVisited || onPath ? 0.95 : 0.4}
                strokeDasharray={b.pruned || b.isStub ? '4 3' : undefined}
              />
            );
          })}

          {/* nodes */}
          {nodes.map((nd) => {
            const label = nd.partial.length ? nd.partial.join('') : 'root';
            const isActive = nd.id === activeId;
            const visited =
              visitedFirstIdx.has(nd.id) && visitedFirstIdx.get(nd.id) <= safeStep;
            const fadeText = !visited && !isActive;
            const showCut = (nd.pruned || nd.isStub) && visited;
            return (
              <g key={`n-${nd.id}`} opacity={fadeText ? 0.5 : 1}>
                <circle
                  cx={nx(nd)}
                  cy={ny(nd)}
                  r={NODE_R}
                  fill={nodeFill(nd)}
                  stroke={nodeStroke(nd)}
                  strokeWidth={isActive ? 3 : pathIds.has(nd.id) ? 2.2 : 1.4}
                />
                <text
                  x={nx(nd)}
                  y={ny(nd) + 4}
                  className="cbv-node-label"
                  style={{
                    fill:
                      isActive
                        ? 'var(--bg)'
                        : fadeText
                          ? 'var(--text-dim)'
                          : 'var(--text-main)',
                  }}
                >
                  {label}
                </text>
                {showCut && (
                  <Scissors
                    x={nx(nd) + NODE_R - 4}
                    y={ny(nd) - NODE_R - 10}
                    size={12}
                    color="var(--hard)"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* readouts */}
      <div className="cbv-readouts">
        <div className="cbv-panel">
          <div className="cbv-panel-head">
            current partial
            <span className={`cbv-kind cbv-kind-${current.kind}`}>{kindLabel}</span>
          </div>
          <div className="cbv-partial">
            {current.partial.length ? (
              current.partial.map((v, i) => (
                <span key={`p-${i}`} className="cbv-chip">
                  {v}
                </span>
              ))
            ) : (
              <span className="cbv-empty">empty</span>
            )}
            <span className="cbv-size">
              size {current.partial.length} / k={k}
            </span>
          </div>
        </div>

        <div className="cbv-panel cbv-panel-found">
          <div className="cbv-panel-head">
            combinations found
            <span className="cbv-count">
              {totalFound} / {cnk}
            </span>
          </div>
          <div className="cbv-found">
            {foundList.length ? (
              foundList.map((combo, i) => (
                <span
                  key={`f-${i}`}
                  className={`cbv-combo ${
                    current.kind === 'emit' && i === foundList.length - 1 ? 'cbv-combo-new' : ''
                  }`}
                >
                  {`{${combo.join(',')}}`}
                </span>
              ))
            ) : (
              <span className="cbv-empty">none yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="cbv-metrics">
        <div className="cbv-metric">
          <span className="cbv-metric-label">nodes explored</span>
          <span className="cbv-metric-value">{current.explored}</span>
        </div>
        <div className="cbv-metric cbv-metric-prune">
          <span className="cbv-metric-label">branches pruned</span>
          <span className="cbv-metric-value">{current.prunedCount}</span>
        </div>
        <div className="cbv-metric">
          <span className="cbv-metric-label">found</span>
          <span className="cbv-metric-value">
            {totalFound} of C({n},{k})={cnk}
          </span>
        </div>
        <div className="cbv-metric cbv-metric-dim">
          <span className="cbv-metric-label">phase</span>
          <span className="cbv-metric-value cbv-metric-dimval">{kindLabel}</span>
        </div>
      </div>

      <div className="cbv-trace">
        <span className="cbv-trace-label">trace</span>
        <span className="cbv-trace-vals">{current.note}</span>
      </div>
    </div>
  );
}
