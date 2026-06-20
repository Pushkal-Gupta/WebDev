import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Edit3,
  RotateCcw,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Wand2,
  Hammer,
} from 'lucide-react';
import './SegmentTreeRangeSumViz.css';

const INITIAL_ARRAY = [3, 8, 1, 6, 4, 9, 2, 7];
const SVG_W = 920;
const SVG_H = 460;
const STEP_MS = 800;

function buildLayout(n) {
  const tree = new Array(4 * n).fill(0);
  const range = new Array(4 * n).fill(null);
  const build = (node, l, r) => {
    range[node] = [l, r];
    if (l === r) return;
    const mid = (l + r) >> 1;
    build(node * 2, l, mid);
    build(node * 2 + 1, mid + 1, r);
  };
  build(1, 0, n - 1);
  return { tree, range };
}

function recomputeAll(arr) {
  const n = arr.length;
  const { tree, range } = buildLayout(n);
  const fill = (node) => {
    const [l, r] = range[node];
    if (l === r) {
      tree[node] = arr[l];
      return;
    }
    fill(node * 2);
    fill(node * 2 + 1);
    tree[node] = tree[node * 2] + tree[node * 2 + 1];
  };
  fill(1);
  return { tree, range, n };
}

function buildFrames(arr) {
  const n = arr.length;
  const { tree, range } = buildLayout(n);
  const localTree = tree.slice();
  const frames = [];
  const built = [];
  const post = (node) => {
    const [l, r] = range[node];
    if (l === r) {
      localTree[node] = arr[l];
      built.push(node);
      frames.push({
        kind: 'build',
        phase: 'leaf',
        node,
        tree: localTree.slice(),
        built: built.slice(),
        caption: `Leaf at node ${node} covers [${l}, ${l}]. Store arr[${l}] = ${arr[l]}.`,
      });
      return;
    }
    post(node * 2);
    post(node * 2 + 1);
    const left = localTree[node * 2];
    const right = localTree[node * 2 + 1];
    localTree[node] = left + right;
    built.push(node);
    frames.push({
      kind: 'build',
      phase: 'merge',
      node,
      tree: localTree.slice(),
      built: built.slice(),
      caption: `Merge at node ${node} covering [${l}, ${r}]: ${left} + ${right} = ${localTree[node]}.`,
    });
  };
  post(1);
  frames.push({
    kind: 'build',
    phase: 'done',
    node: 1,
    tree: localTree.slice(),
    built: built.slice(),
    caption: `Build complete. Root holds total sum ${localTree[1]} over [0, ${n - 1}].`,
  });
  return { frames, range };
}

function queryFrames(tree, range, n, ql, qr) {
  const frames = [];
  let total = 0;
  const contributors = [];
  const visited = [];

  const recurse = (node) => {
    visited.push(node);
    const [l, r] = range[node];
    if (qr < l || r < ql) {
      frames.push({
        kind: 'query',
        action: 'no-overlap',
        node,
        visited: visited.slice(),
        contributors: contributors.slice(),
        total,
        ql,
        qr,
        caption: `Node ${node} covers [${l}, ${r}] — disjoint from [${ql}, ${qr}]. Return 0.`,
      });
      return 0;
    }
    if (ql <= l && r <= qr) {
      contributors.push({ node, value: tree[node], l, r });
      total += tree[node];
      frames.push({
        kind: 'query',
        action: 'accept',
        node,
        visited: visited.slice(),
        contributors: contributors.slice(),
        total,
        ql,
        qr,
        caption: `Node ${node} covers [${l}, ${r}] — fully inside [${ql}, ${qr}]. Accept ${tree[node]} (sum = ${total}).`,
      });
      return tree[node];
    }
    frames.push({
      kind: 'query',
      action: 'partial',
      node,
      visited: visited.slice(),
      contributors: contributors.slice(),
      total,
      ql,
      qr,
      caption: `Node ${node} covers [${l}, ${r}] — partial overlap. Recurse into both children.`,
    });
    const leftSum = recurse(node * 2);
    frames.push({
      kind: 'query',
      action: 'return-left',
      node,
      visited: visited.slice(),
      contributors: contributors.slice(),
      total,
      ql,
      qr,
      caption: `Left child of ${node} returned ${leftSum}. Move to right child.`,
    });
    const rightSum = recurse(node * 2 + 1);
    frames.push({
      kind: 'query',
      action: 'return-right',
      node,
      visited: visited.slice(),
      contributors: contributors.slice(),
      total,
      ql,
      qr,
      caption: `Right child of ${node} returned ${rightSum}. Combined sum at node ${node} = ${leftSum + rightSum}.`,
    });
    return leftSum + rightSum;
  };
  recurse(1);

  frames.push({
    kind: 'query',
    action: 'done',
    node: 1,
    visited: visited.slice(),
    contributors: contributors.slice(),
    total,
    ql,
    qr,
    caption: `RangeSum(${ql}, ${qr}) = ${total} from ${contributors.length} segment${contributors.length === 1 ? '' : 's'}.`,
  });
  return frames;
}

function updateFrames(treeIn, rangeIn, arrIn, n, pos, newVal) {
  const tree = treeIn.slice();
  const arr = arrIn.slice();
  const frames = [];
  const path = [];

  const findPath = (node) => {
    path.push(node);
    const [l, r] = rangeIn[node];
    if (l === r) return;
    const mid = (l + r) >> 1;
    if (pos <= mid) findPath(node * 2);
    else findPath(node * 2 + 1);
  };
  findPath(1);

  for (let step = 0; step < path.length; step++) {
    const node = path[step];
    const [l, r] = rangeIn[node];
    const isLeaf = l === r;
    frames.push({
      kind: 'update',
      phase: 'descend',
      node,
      path: path.slice(0, step + 1),
      tree: tree.slice(),
      arr: arr.slice(),
      pos,
      newVal,
      caption: isLeaf
        ? `Reached leaf at node ${node} (covers [${l}, ${r}]). Replace ${tree[node]} with ${newVal}.`
        : `Walking down node ${node} covering [${l}, ${r}] — target ${pos} sits in the ${pos <= ((l + r) >> 1) ? 'left' : 'right'} child.`,
    });
  }

  const leaf = path[path.length - 1];
  const oldLeafVal = tree[leaf];
  tree[leaf] = newVal;
  arr[pos] = newVal;
  frames.push({
    kind: 'update',
    phase: 'leaf-set',
    node: leaf,
    path: path.slice(),
    tree: tree.slice(),
    arr: arr.slice(),
    pos,
    newVal,
    delta: newVal - oldLeafVal,
    caption: `Leaf node ${leaf} updated: ${oldLeafVal} -> ${newVal} (delta ${newVal - oldLeafVal >= 0 ? '+' : ''}${newVal - oldLeafVal}).`,
  });

  for (let step = path.length - 2; step >= 0; step--) {
    const node = path[step];
    const oldVal = tree[node];
    const left = tree[node * 2];
    const right = tree[node * 2 + 1];
    tree[node] = left + right;
    const [l, r] = rangeIn[node];
    frames.push({
      kind: 'update',
      phase: 'propagate',
      node,
      path: path.slice(),
      tree: tree.slice(),
      arr: arr.slice(),
      pos,
      newVal,
      caption: `Propagate to ancestor ${node} covering [${l}, ${r}]: ${oldVal} -> ${left} + ${right} = ${tree[node]}.`,
    });
  }

  frames.push({
    kind: 'update',
    phase: 'done',
    node: 1,
    path: path.slice(),
    tree: tree.slice(),
    arr: arr.slice(),
    pos,
    newVal,
    caption: `PointUpdate done. arr[${pos}] = ${newVal}; root holds ${tree[1]}.`,
  });

  return frames;
}

function visibleNodes(range) {
  const out = [];
  for (let i = 1; i < range.length; i++) if (range[i]) out.push(i);
  return out;
}

function layoutNodes(range, n) {
  const pad = 56;
  const usable = SVG_W - pad * 2;
  const cellW = usable / n;
  const positions = {};

  let maxDepth = 0;
  for (let i = 1; i < range.length; i++) {
    if (!range[i]) continue;
    const d = Math.floor(Math.log2(i));
    if (d > maxDepth) maxDepth = d;
  }
  const yTop = 48;
  const yBottom = SVG_H - 56;
  const yStep = maxDepth === 0 ? 0 : (yBottom - yTop) / maxDepth;

  for (let i = 1; i < range.length; i++) {
    if (!range[i]) continue;
    const [l, r] = range[i];
    const depth = Math.floor(Math.log2(i));
    const centerIdx = (l + r) / 2 + 0.5;
    const x = pad + centerIdx * cellW;
    const y = yTop + depth * yStep;
    positions[i] = { x, y, depth };
  }
  return positions;
}

function parseArrayInput(text) {
  const parts = text.split(/[,\s]+/).map((p) => p.trim()).filter(Boolean);
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n))) return null;
  if (nums.length < 2 || nums.length > 16) return null;
  return nums;
}

export default function SegmentTreeRangeSumViz() {
  const [arr, setArr] = useState(INITIAL_ARRAY);
  const [arrInput, setArrInput] = useState(INITIAL_ARRAY.join(', '));
  const [ql, setQl] = useState('1');
  const [qr, setQr] = useState('5');
  const [upi, setUpi] = useState('3');
  const [upv, setUpv] = useState('10');
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState('idle');
  const playRef = useRef(null);

  const {
    tree: baseTree,
    range: baseRange,
    n,
  } = useMemo(() => recomputeAll(arr), [arr]);

  const currentFrame = idx >= 0 && idx < frames.length ? frames[idx] : null;

  const displayTree = currentFrame && (currentFrame.kind === 'update' || currentFrame.kind === 'build')
    ? currentFrame.tree
    : baseTree;
  const displayArr = currentFrame && currentFrame.kind === 'update' ? currentFrame.arr : arr;

  const nodes = useMemo(() => visibleNodes(baseRange), [baseRange]);
  const positions = useMemo(() => layoutNodes(baseRange, n), [baseRange, n]);

  const edges = useMemo(() => {
    const out = [];
    for (const node of nodes) {
      const left = node * 2;
      const right = node * 2 + 1;
      if (positions[left]) out.push({ a: node, b: left });
      if (positions[right]) out.push({ a: node, b: right });
    }
    return out;
  }, [nodes, positions]);

  const applyArrayInput = useCallback(() => {
    const parsed = parseArrayInput(arrInput);
    if (!parsed) return;
    setArr(parsed);
    setFrames([]);
    setIdx(-1);
    setMode('idle');
    setPlaying(false);
    if (Number(ql) >= parsed.length) setQl(String(parsed.length - 1));
    if (Number(qr) >= parsed.length) setQr(String(parsed.length - 1));
    if (Number(upi) >= parsed.length) setUpi(String(parsed.length - 1));
  }, [arrInput, ql, qr, upi]);

  const runBuild = useCallback(() => {
    const { frames: built } = buildFrames(arr);
    setFrames(built);
    setIdx(0);
    setMode('build');
    setPlaying(true);
  }, [arr]);

  const runQuery = useCallback(() => {
    const a = Number(ql);
    const b = Number(qr);
    if (!Number.isInteger(a) || !Number.isInteger(b)) return;
    if (a < 0 || b >= n || a > b) return;
    const built = queryFrames(baseTree, baseRange, n, a, b);
    setFrames(built);
    setIdx(0);
    setMode('query');
    setPlaying(true);
  }, [ql, qr, baseTree, baseRange, n]);

  const runUpdate = useCallback(() => {
    const i = Number(upi);
    const v = Number(upv);
    if (!Number.isInteger(i) || !Number.isFinite(v)) return;
    if (i < 0 || i >= n) return;
    const built = updateFrames(baseTree, baseRange, arr, n, i, v);
    setFrames(built);
    setIdx(0);
    setMode('update');
    setPlaying(true);
  }, [upi, upv, baseTree, baseRange, arr, n]);

  const reset = useCallback(() => {
    setPlaying(false);
    setArr(INITIAL_ARRAY);
    setArrInput(INITIAL_ARRAY.join(', '));
    setFrames([]);
    setIdx(-1);
    setMode('idle');
    setQl('1');
    setQr('5');
    setUpi('3');
    setUpv('10');
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (idx < 0 || idx >= frames.length - 1) {
      if (idx === frames.length - 1 && frames.length > 0) {
        const last = frames[frames.length - 1];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (last.kind === 'update') setArr(last.arr);
      }
      setPlaying(false);
      return;
    }
    playRef.current = setTimeout(() => setIdx((i) => i + 1), STEP_MS);
    return () => clearTimeout(playRef.current);
  }, [playing, idx, frames]);

  const stepNext = () => {
    if (idx < frames.length - 1) {
      const next = idx + 1;
      setIdx(next);
      if (next === frames.length - 1) {
        const last = frames[next];
        if (last.kind === 'update') setArr(last.arr);
      }
    }
  };
  const stepPrev = () => {
    if (idx > 0) setIdx(idx - 1);
  };
  const togglePlay = () => {
    if (frames.length === 0) return;
    if (idx >= frames.length - 1) {
      setIdx(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };

  const visitedSet = useMemo(() => {
    if (!currentFrame || currentFrame.kind !== 'query') return new Set();
    return new Set(currentFrame.visited || []);
  }, [currentFrame]);

  const acceptedSet = useMemo(() => {
    if (!currentFrame || currentFrame.kind !== 'query') return new Set();
    return new Set((currentFrame.contributors || []).map((c) => c.node));
  }, [currentFrame]);

  const rejectedSet = useMemo(() => {
    if (!currentFrame || currentFrame.kind !== 'query') return new Set();
    if (currentFrame.action !== 'no-overlap') {
      const set = new Set();
      // accumulate from earlier no-overlap frames is tricky without history; instead recompute
      return set;
    }
    return new Set([currentFrame.node]);
  }, [currentFrame]);

  const pathSet = useMemo(() => {
    if (!currentFrame || currentFrame.kind !== 'update') return new Set();
    return new Set(currentFrame.path || []);
  }, [currentFrame]);

  const builtSet = useMemo(() => {
    if (!currentFrame || currentFrame.kind !== 'build') return new Set();
    return new Set(currentFrame.built || []);
  }, [currentFrame]);

  const step = idx + 1;
  const totalSteps = frames.length;

  const caption = currentFrame
    ? currentFrame.caption
    : 'Run Build, Range Sum, or Point Update to begin.';

  const modeLabel =
    mode === 'idle'
      ? 'idle'
      : mode === 'build'
        ? 'Bottom-up build'
        : mode === 'query'
          ? `RangeSum(${currentFrame?.ql ?? ql}, ${currentFrame?.qr ?? qr})`
          : `PointUpdate(arr[${currentFrame?.pos ?? upi}] = ${currentFrame?.newVal ?? upv})`;

  return (
    <div className="strs-root">
      <div className="strs-head">
        <div className="strs-title-block">
          <h3 className="strs-title">Segment tree — range sum + point update</h3>
          <p className="strs-sub">
            Bottom-up build, then RangeSum decomposes [l, r] into O(log n) accepted segments and PointUpdate
            walks one leaf-to-root path recomputing sums.
          </p>
        </div>
      </div>

      <div className="strs-array-edit">
        <span className="strs-group-label">Array (2-16 ints, comma or space)</span>
        <input
          type="text"
          className="strs-array-input"
          value={arrInput}
          onChange={(e) => setArrInput(e.target.value)}
          spellCheck={false}
        />
        <button type="button" className="strs-btn" onClick={applyArrayInput}>
          Apply
        </button>
        <button type="button" className="strs-btn strs-btn-primary" onClick={runBuild}>
          <Hammer size={14} /> Build
        </button>
      </div>

      <div className="strs-controls">
        <div className="strs-control-group">
          <span className="strs-group-label">Range sum</span>
          <label className="strs-input-label">
            l
            <input
              type="number"
              value={ql}
              onChange={(e) => setQl(e.target.value)}
              className="strs-input"
              min={0}
              max={n - 1}
            />
          </label>
          <label className="strs-input-label">
            r
            <input
              type="number"
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              className="strs-input"
              min={0}
              max={n - 1}
            />
          </label>
          <button type="button" className="strs-btn strs-btn-primary" onClick={runQuery}>
            <Search size={14} /> Query
          </button>
        </div>

        <div className="strs-control-group">
          <span className="strs-group-label">Point update</span>
          <label className="strs-input-label">
            i
            <input
              type="number"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              className="strs-input"
              min={0}
              max={n - 1}
            />
          </label>
          <label className="strs-input-label">
            val
            <input
              type="number"
              value={upv}
              onChange={(e) => setUpv(e.target.value)}
              className="strs-input"
            />
          </label>
          <button type="button" className="strs-btn strs-btn-primary" onClick={runUpdate}>
            <Edit3 size={14} /> Update
          </button>
        </div>

        <div className="strs-control-group strs-control-group-end">
          <button type="button" className="strs-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <div className="strs-control-divider" />
          <button
            type="button"
            className="strs-btn"
            onClick={stepPrev}
            disabled={frames.length === 0 || idx <= 0}
            aria-label="Previous step"
          >
            <SkipBack size={14} />
          </button>
          <button
            type="button"
            className="strs-btn"
            onClick={togglePlay}
            disabled={frames.length === 0}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            className="strs-btn"
            onClick={stepNext}
            disabled={frames.length === 0 || idx >= frames.length - 1}
            aria-label="Next step"
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>

      <div className="strs-array-row">
        <span className="strs-array-label">arr</span>
        <div className="strs-array-cells">
          {displayArr.map((v, i) => {
            const inQueryRange =
              currentFrame &&
              currentFrame.kind === 'query' &&
              i >= currentFrame.ql &&
              i <= currentFrame.qr;
            const isUpdateTarget =
              currentFrame && currentFrame.kind === 'update' && i === currentFrame.pos;
            const isBuildLeaf =
              currentFrame &&
              currentFrame.kind === 'build' &&
              currentFrame.phase === 'leaf' &&
              baseRange[currentFrame.node] &&
              baseRange[currentFrame.node][0] === i;
            return (
              <div
                key={i}
                className={[
                  'strs-cell',
                  inQueryRange ? 'strs-cell-in-range' : '',
                  isUpdateTarget ? 'strs-cell-update' : '',
                  isBuildLeaf ? 'strs-cell-build' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="strs-cell-value">{v}</span>
                <span className="strs-cell-index">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="strs-stage">
        <svg
          className="strs-svg"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          role="img"
          aria-label="Segment tree range sum visualization"
        >
          <defs>
            <linearGradient id="strs-grad-accept" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.55)" />
              <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.25)" />
            </linearGradient>
            <linearGradient id="strs-grad-path" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.35)" />
              <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.12)" />
            </linearGradient>
          </defs>

          {edges.map((e, ei) => {
            const a = positions[e.a];
            const b = positions[e.b];
            if (!a || !b) return null;
            const onPath =
              (visitedSet.has(e.a) && visitedSet.has(e.b)) ||
              (pathSet.has(e.a) && pathSet.has(e.b)) ||
              (builtSet.has(e.a) && builtSet.has(e.b));
            return (
              <line
                key={`e${ei}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={`strs-edge ${onPath ? 'strs-edge-active' : ''}`}
              />
            );
          })}

          {nodes.map((node) => {
            const p = positions[node];
            if (!p) return null;
            const [l, r] = baseRange[node];
            const isLeaf = l === r;
            const isCurrent = currentFrame && currentFrame.node === node;
            const isVisited = visitedSet.has(node) && !isCurrent;
            const isAccepted = acceptedSet.has(node);
            const isRejected = rejectedSet.has(node) && !isAccepted && !isCurrent;
            const isOnPath = pathSet.has(node) && !isCurrent;
            const isBuilt = builtSet.has(node) && !isCurrent;
            const cls = [
              'strs-node',
              isLeaf ? 'strs-node-leaf' : '',
              isVisited ? 'strs-node-visited' : '',
              isAccepted ? 'strs-node-accept' : '',
              isRejected ? 'strs-node-reject' : '',
              isOnPath ? 'strs-node-path' : '',
              isBuilt ? 'strs-node-built' : '',
              isCurrent ? 'strs-node-current' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const w = isLeaf ? 46 : 58;
            const h = isLeaf ? 38 : 42;
            return (
              <g key={node} className={cls} transform={`translate(${p.x}, ${p.y})`}>
                {isCurrent && (
                  <rect
                    x={-w / 2 - 6}
                    y={-h / 2 - 6}
                    width={w + 12}
                    height={h + 12}
                    rx={10}
                    className="strs-node-ring"
                  />
                )}
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  rx={8}
                  className="strs-node-box"
                />
                <text x={0} y={-3} textAnchor="middle" className="strs-node-value">
                  {displayTree[node]}
                </text>
                <text x={0} y={12} textAnchor="middle" className="strs-node-range">
                  [{l},{r}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="strs-footer">
        <div className="strs-stat">
          <span className="strs-stat-label">Step</span>
          <span className="strs-stat-value">
            {totalSteps === 0 ? '0 / 0' : `${step} / ${totalSteps}`}
          </span>
        </div>
        <div className="strs-stat">
          <span className="strs-stat-label">Mode</span>
          <span className="strs-stat-value">{modeLabel}</span>
        </div>
        <div className="strs-stat strs-stat-grow">
          <span className="strs-stat-label">Status</span>
          <span className="strs-stat-value">{caption}</span>
        </div>
        {currentFrame && currentFrame.kind === 'query' && (
          <div className="strs-stat">
            <span className="strs-stat-label">Accumulator</span>
            <span className="strs-stat-value strs-stat-emph">{currentFrame.total}</span>
          </div>
        )}
        {currentFrame && currentFrame.kind === 'update' && (
          <div className="strs-stat">
            <span className="strs-stat-label">Root sum</span>
            <span className="strs-stat-value strs-stat-emph">{currentFrame.tree[1]}</span>
          </div>
        )}
        {currentFrame && currentFrame.kind === 'build' && (
          <div className="strs-stat">
            <span className="strs-stat-label">Built</span>
            <span className="strs-stat-value strs-stat-emph">
              {currentFrame.built.length} / {nodes.length}
            </span>
          </div>
        )}
      </div>

      {currentFrame && currentFrame.kind === 'query' && (
        <div className="strs-accum">
          <div className="strs-accum-head">
            <Wand2 size={14} />
            <span className="strs-accum-title">Accepted segments</span>
            <span className="strs-accum-total">
              sum = {currentFrame.total}
            </span>
          </div>
          <div className="strs-accum-body">
            {currentFrame.contributors.length === 0 ? (
              <span className="strs-accum-empty">No segments accepted yet.</span>
            ) : (
              <div className="strs-chips">
                {currentFrame.contributors.map((c, ci) => (
                  <React.Fragment key={c.node}>
                    <span className="strs-chip">
                      <span className="strs-chip-tag">node {c.node}</span>
                      <span className="strs-chip-range">
                        [{c.l},{c.r}]
                      </span>
                      <span className="strs-chip-val">{c.value}</span>
                    </span>
                    {ci < currentFrame.contributors.length - 1 && (
                      <span className="strs-chip-plus">+</span>
                    )}
                  </React.Fragment>
                ))}
                <span className="strs-chip-eq">=</span>
                <span className="strs-chip strs-chip-total">{currentFrame.total}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="strs-legend">
        <span className="strs-legend-item">
          <span className="strs-swatch strs-swatch-leaf" />
          leaf
        </span>
        <span className="strs-legend-item">
          <span className="strs-swatch strs-swatch-visited" />
          visited
        </span>
        <span className="strs-legend-item">
          <span className="strs-swatch strs-swatch-accept" />
          accepted (fully inside)
        </span>
        <span className="strs-legend-item">
          <span className="strs-swatch strs-swatch-path" />
          update path
        </span>
        <span className="strs-legend-item">
          <span className="strs-swatch strs-swatch-current" />
          current
        </span>
      </div>
    </div>
  );
}
