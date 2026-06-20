import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, ArrowDownToLine } from 'lucide-react';
import './LeftistHeapViz.css';

// Leftist heap: a mergeable min-heap. Each node carries npl (null-path-length),
// the distance to the nearest null. The leftist invariant is npl(left) >= npl(right),
// which keeps the RIGHT spine length O(log n) — and MERGE only ever recurses down
// right spines, so every operation is O(log n).
//
// Skew heaps are the simpler cousin: same merge-down-the-right-spine idea, but
// they skip npl bookkeeping and unconditionally swap children after each merge —
// amortized O(log n) instead of worst-case.

function makeNode(value) {
  return { value, left: null, right: null, npl: 1 };
}

function npl(n) {
  return n ? n.npl : 0;
}

function clone(n) {
  if (!n) return null;
  return { value: n.value, left: clone(n.left), right: clone(n.right), npl: n.npl };
}

// Insert a value building a fresh leftist heap (used for the two presets).
function mergeQuiet(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.value > b.value) { const t = a; a = b; b = t; }
  a.right = mergeQuiet(a.right, b);
  if (npl(a.left) < npl(a.right)) { const t = a.left; a.left = a.right; a.right = t; }
  a.npl = npl(a.right) + 1;
  return a;
}

function buildHeap(values) {
  let root = null;
  for (const v of values) root = mergeQuiet(root, makeNode(v));
  return root;
}

// ---- Frame-generating merge: records each compare / recurse / swap step. ----

function buildMergeFrames(h1, h2) {
  const frames = [];

  const root = { v: null }; // shared mutable handle so snapshots see the growing result

  const snap = (extra) => ({
    tree: clone(root.v),
    activePath: [],
    swapNode: null,
    note: '',
    phase: 'merge',
    ...extra,
  });

  // Merge with path tracking. `path` is the chain of node values from result root
  // down to the node currently being merged (so we can highlight the right spine).
  function merge(a, b, path) {
    if (!a) {
      frames.push(snap({
        activePath: path,
        note: b
          ? `One side is empty -> attach the whole subtree rooted at ${b.value} here. Recursion bottoms out.`
          : 'Both sides empty -> nothing to attach.',
      }));
      return b;
    }
    if (!b) {
      frames.push(snap({
        activePath: path,
        note: `One side is empty -> keep subtree rooted at ${a.value} as-is. Recursion bottoms out.`,
      }));
      return a;
    }

    // Compare roots; smaller becomes the local root.
    if (a.value > b.value) { const t = a; a = b; b = t; }
    const localPath = [...path, a.value];

    frames.push(snap({
      activePath: localPath,
      note: `merge: root ${a.value} <= root ${b.value} -> ${a.value} stays on top; recurse merge( right(${a.value}), heap(${b.value}) ) down the right spine.`,
    }));

    // Recurse into the right spine of the smaller-root heap.
    a.right = merge(a.right, b, localPath);

    // Fix the leftist invariant: ensure npl(left) >= npl(right).
    const nl = npl(a.left);
    const nr = npl(a.right);
    if (nl < nr) {
      const t = a.left; a.left = a.right; a.right = t;
      a.npl = npl(a.right) + 1;
      if (root.v == null) root.v = a;
      frames.push(snap({
        activePath: localPath,
        swapNode: a.value,
        phase: 'swap',
        note: `at ${a.value}: npl(left)=${nl} < npl(right)=${nr} -> SWAP children so the right spine stays short. npl(${a.value}) = npl(right)+1 = ${a.npl}.`,
      }));
    } else {
      a.npl = npl(a.right) + 1;
      if (root.v == null) root.v = a;
      frames.push(snap({
        activePath: localPath,
        note: `at ${a.value}: npl(left)=${nl} >= npl(right)=${nr} -> leftist property already holds, no swap. npl(${a.value}) = ${a.npl}.`,
      }));
    }
    if (root.v == null || path.length === 0) root.v = a;
    return a;
  }

  frames.push(snap({
    activePath: [],
    note: `MERGE(h1, h2): compare the two roots, recurse down the right spine of the smaller-root heap, then swap children on the way back up wherever the leftist property breaks.`,
    phase: 'start',
  }));

  const result = merge(clone(h1), clone(h2), []);
  root.v = result;

  frames.push(snap({
    tree: clone(result),
    activePath: [],
    note: `Done. Result is a valid min-heap and every node has npl(left) >= npl(right). The right spine is O(log n) long, so the merge touched only O(log n) nodes.`,
    phase: 'done',
  }));

  return { frames, result };
}

// ---- Layout (in-order x, depth y) ----

function layout(root, W) {
  const positions = {};
  let order = 0;
  const ids = [];
  function walk(n, depth, parentId, side) {
    if (!n) return null;
    const id = ids.length;
    ids.push(n);
    n._id = id;
    const lid = walk(n.left, depth + 1, id, 'L');
    positions[id] = { order: order++, depth, value: n.value, npl: n.npl, lid, rid: null, parentId, side };
    const rid = walk(n.right, depth + 1, id, 'R');
    positions[id].rid = rid;
    return id;
  }
  walk(root, 0, null, null);
  const count = order;
  const padX = 56;
  const usableW = W - padX * 2;
  const stepX = count > 1 ? usableW / (count - 1) : 0;
  const stepY = 76;
  const out = {};
  for (const key of Object.keys(positions)) {
    const p = positions[key];
    out[key] = {
      ...p,
      x: count > 1 ? padX + p.order * stepX : W / 2,
      y: 56 + p.depth * stepY,
    };
  }
  return out;
}

function flatten(root) {
  const list = [];
  (function walk(n) {
    if (!n) return;
    list.push(n);
    walk(n.left);
    walk(n.right);
  })(root);
  return list;
}

const PRESETS = {
  'classic': { h1: [3, 10, 8, 21], h2: [5, 7, 23, 6] },
  'right-heavy': { h1: [2, 4, 9], h2: [1, 6, 11, 17] },
  'single + heap': { h1: [4], h2: [2, 8, 12, 15, 9] },
};

export default function LeftistHeapViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [presetKey, setPresetKey] = useState('classic');
  const [insertDraft, setInsertDraft] = useState('14');
  const runTimer = useRef(null);

  // The two input heaps for the current preset.
  const inputs = useMemo(() => {
    const p = PRESETS[presetKey];
    return { h1: buildHeap(p.h1), h2: buildHeap(p.h2) };
  }, [presetKey]);

  // Operation = which merge we're animating. Default: merge h1 with h2.
  const [op, setOp] = useState({ kind: 'merge' });

  const { frames } = useMemo(() => {
    if (op.kind === 'insert') {
      return buildMergeFrames(inputs.h1, buildHeap([op.value]));
    }
    return buildMergeFrames(inputs.h1, inputs.h2);
  }, [inputs, op]);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const applyPreset = (key) => {
    setIsRunningRaw(false);
    setPresetKey(key);
    setOp({ kind: 'merge' });
    setStep(0);
  };

  const runMerge = () => {
    setIsRunningRaw(false);
    setOp({ kind: 'merge' });
    setStep(0);
    setIsRunningRaw(true);
  };

  const runInsert = () => {
    const v = parseInt(insertDraft, 10);
    if (Number.isNaN(v)) return;
    setIsRunningRaw(false);
    setOp({ kind: 'insert', value: v });
    setStep(0);
    setIsRunningRaw(true);
  };

  const W = 940;
  const HMERGE = 360;
  const HINPUT = 200;

  // ---- input heaps render ----
  const h1pos = useMemo(() => layout(inputs.h1, W / 2 - 30), [inputs.h1]);
  const h2pos = useMemo(() => layout(inputs.h2, W / 2 - 30), [inputs.h2]);
  const h1nodes = useMemo(() => flatten(inputs.h1), [inputs.h1]);
  const h2nodes = useMemo(() => flatten(inputs.h2), [inputs.h2]);

  // ---- merge result render ----
  const positions = useMemo(() => layout(current.tree, W), [current.tree]);
  const nodes = useMemo(() => flatten(current.tree), [current.tree]);

  const pathSet = new Set(current.activePath || []);
  const rootValue = current.tree ? current.tree.value : null;
  const playing = isRunningRaw && step < totalSteps - 1;

  // right-spine length of the current result tree
  const rightSpineLen = useMemo(() => {
    let n = current.tree;
    let len = 0;
    while (n) { len += 1; n = n.right; }
    return len;
  }, [current.tree]);

  const edgesOf = (root) => {
    const out = [];
    (function walk(n) {
      if (!n) return;
      if (n.left) { out.push([n._id, n.left._id, 'L']); walk(n.left); }
      if (n.right) { out.push([n._id, n.right._id, 'R']); walk(n.right); }
    })(root);
    return out;
  };

  const resultEdges = useMemo(() => edgesOf(current.tree), [current.tree]);
  const h1edges = useMemo(() => edgesOf(inputs.h1), [inputs.h1]);
  const h2edges = useMemo(() => edgesOf(inputs.h2), [inputs.h2]);

  const renderInputHeap = (root, pos, nlist, edges, label, accent) => (
    <div className="lhv-input">
      <div className="lhv-input-head">
        <span className="lhv-input-label" style={{ color: accent }}>{label}</span>
        <span className="lhv-input-sub">root {root ? root.value : '—'}</span>
      </div>
      <svg viewBox={`0 0 ${W / 2 - 30} ${HINPUT}`} className="lhv-svg" preserveAspectRatio="xMidYMid meet">
        <rect x={4} y={4} width={W / 2 - 38} height={HINPUT - 8} fill="var(--bg)" stroke="var(--border)" rx={8} />
        {edges.map(([p, c, side]) => {
          const a = pos[p]; const b = pos[c];
          if (!a || !b) return null;
          return (
            <line
              key={`ie-${p}-${c}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={side === 'R' ? accent : 'var(--text-dim)'}
              strokeWidth={1.6} opacity={0.6}
            />
          );
        })}
        {nlist.map((nd) => {
          const p = pos[nd._id];
          if (!p) return null;
          return (
            <g key={`in-${nd._id}`}>
              <circle cx={p.x} cy={p.y} r={17} fill="var(--surface)" stroke={accent} strokeWidth={2} />
              <text x={p.x} y={p.y + 4} className="lhv-node-label">{nd.value}</text>
              <text x={p.x + 21} y={p.y - 9} className="lhv-node-npl">{nd.npl}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );

  return (
    <div className="lhv">
      <div className="lhv-head">
        <h3 className="lhv-title">Leftist heap — MERGE in O(log n)</h3>
        <p className="lhv-sub">
          Merge recurses down the right spine of the smaller-root heap, then swaps children wherever
          npl(left) &lt; npl(right). That keeps the right spine short, so every op touches O(log n) nodes.
          A skew heap is the simpler cousin: same idea, but it swaps unconditionally and drops the npl labels.
        </p>
      </div>

      <div className="lhv-controls">
        <div className="lhv-actions">
          <div className="lhv-buttons">
            <button
              type="button"
              className="lhv-btn lhv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) { setStep(0); setIsRunningRaw(true); return; }
                setIsRunningRaw((v) => !v);
              }}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="lhv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="lhv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="lhv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="lhv-speed">
            <span className="lhv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="lhv-speed-range"
            />
            <span className="lhv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="lhv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>

        <div className="lhv-ops">
          <button type="button" className="lhv-btn lhv-btn-primary" onClick={runMerge}>
            <ArrowDownToLine size={14} /> Merge h1 + h2
          </button>
          <span className="lhv-ops-sep" />
          <span className="lhv-ops-label">insert =</span>
          <input
            type="number"
            className="lhv-input-num"
            value={insertDraft}
            onChange={(e) => setInsertDraft(e.target.value)}
            aria-label="value to insert into h1"
          />
          <button type="button" className="lhv-btn" onClick={runInsert}>
            <Plus size={14} /> Insert into h1 (= merge with singleton)
          </button>
          <div className="lhv-presets">
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                type="button"
                className={`lhv-chip${presetKey === name ? ' lhv-chip-on' : ''}`}
                onClick={() => applyPreset(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lhv-inputs">
        {renderInputHeap(inputs.h1, h1pos, h1nodes, h1edges, 'h1', 'var(--hue-sky)')}
        {renderInputHeap(
          op.kind === 'insert' ? buildHeap([op.value]) : inputs.h2,
          op.kind === 'insert' ? layout(buildHeap([op.value]), W / 2 - 30) : h2pos,
          op.kind === 'insert' ? flatten(buildHeap([op.value])) : h2nodes,
          op.kind === 'insert' ? edgesOf(buildHeap([op.value])) : h2edges,
          op.kind === 'insert' ? `singleton(${op.value})` : 'h2',
          'var(--hue-pink)',
        )}
      </div>

      <div className="lhv-stage">
        <div className="lhv-stage-label">merge result (npl shown top-right of each node)</div>
        <svg viewBox={`0 0 ${W} ${HMERGE}`} className="lhv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={10} y={10} width={W - 20} height={HMERGE - 20} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {!current.tree && (
            <text x={W / 2} y={HMERGE / 2} className="lhv-empty">press Play to watch the merge build the result</text>
          )}

          {resultEdges.map(([p, c, side]) => {
            const a = positions[p]; const b = positions[c];
            if (!a || !b) return null;
            const onPath = pathSet.has(a.value) && pathSet.has(b.value);
            return (
              <line
                key={`re-${p}-${c}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={onPath ? 'var(--accent)' : side === 'R' ? 'var(--hue-mint)' : 'var(--text-dim)'}
                strokeWidth={onPath ? 3 : 1.6}
                opacity={onPath ? 1 : 0.55}
                className="lhv-edge"
              />
            );
          })}

          {nodes.map((nd) => {
            const p = positions[nd._id];
            if (!p) return null;
            const onPath = pathSet.has(nd.value);
            const isSwap = current.swapNode === nd.value;
            const fill = isSwap
              ? 'var(--hue-pink)'
              : onPath
                ? 'rgba(var(--accent-rgb), 0.2)'
                : 'var(--bg)';
            const stroke = isSwap ? 'var(--hue-pink)' : onPath ? 'var(--accent)' : 'var(--border)';
            const labelFill = isSwap ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`rn-${nd._id}`} className="lhv-node">
                <circle cx={p.x} cy={p.y} r={20} fill={fill} stroke={stroke} strokeWidth={isSwap || onPath ? 3 : 2} />
                <text x={p.x} y={p.y + 5} className="lhv-node-label" style={{ fill: labelFill }}>{nd.value}</text>
                <text x={p.x + 25} y={p.y - 11} className="lhv-node-npl-big">npl {nd.npl}</text>
                {nd.value === rootValue && (
                  <text x={p.x} y={p.y - 28} className="lhv-node-root">root (min)</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="lhv-metrics">
        <div className="lhv-metric">
          <span className="lhv-metric-label">phase</span>
          <span className="lhv-metric-value">{current.phase}</span>
        </div>
        <div className="lhv-metric">
          <span className="lhv-metric-label">min (root)</span>
          <span className="lhv-metric-value">{rootValue == null ? '—' : rootValue}</span>
        </div>
        <div className="lhv-metric">
          <span className="lhv-metric-label">npl(root)</span>
          <span className="lhv-metric-value">{current.tree ? current.tree.npl : '—'}</span>
        </div>
        <div className="lhv-metric lhv-metric-dim">
          <span className="lhv-metric-label">right-spine length</span>
          <span className="lhv-metric-value lhv-metric-dimval">{rightSpineLen}</span>
        </div>
      </div>

      <div className="lhv-arith">
        <span className="lhv-arith-label">merge step</span>
        <span className="lhv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
