import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Edit3, RotateCcw, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import './SegmentTreeViz.css';

const INITIAL_ARRAY = [2, 5, 1, 4, 9, 3, 6, 7];
const SVG_W = 880;
const SVG_H = 420;
const STEP_MS = 850;

// Segment tree stored in 1-indexed array of size 4n. Leaves cover [l..r] with l===r.
function buildTree(arr) {
  const n = arr.length;
  const tree = new Array(4 * n).fill(0);
  const range = new Array(4 * n).fill(null);
  const build = (node, l, r) => {
    range[node] = [l, r];
    if (l === r) {
      tree[node] = arr[l];
      return;
    }
    const mid = (l + r) >> 1;
    build(node * 2, l, mid);
    build(node * 2 + 1, mid + 1, r);
    tree[node] = tree[node * 2] + tree[node * 2 + 1];
  };
  build(1, 0, n - 1);
  return { tree, range, n };
}

function visibleNodes(range) {
  const out = [];
  for (let i = 1; i < range.length; i++) {
    if (range[i]) out.push(i);
  }
  return out;
}

// Layout each node according to depth and midpoint of its [l, r] range.
function layoutNodes(range, n) {
  const pad = 50;
  const usable = SVG_W - pad * 2;
  const cellW = usable / n;
  const positions = {};

  let maxDepth = 0;
  for (let i = 1; i < range.length; i++) {
    if (!range[i]) continue;
    const d = Math.floor(Math.log2(i));
    if (d > maxDepth) maxDepth = d;
  }
  const yTop = 40;
  const yBottom = SVG_H - 40;
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
        visited: [...visited],
        contributors: [...contributors],
        total,
        ql,
        qr,
        caption: `Node ${node} covers [${l}, ${r}] — outside query [${ql}, ${qr}]. Return 0.`,
      });
      return 0;
    }
    if (ql <= l && r <= qr) {
      contributors.push({ node, value: tree[node], l, r });
      total += tree[node];
      frames.push({
        kind: 'query',
        action: 'total-overlap',
        node,
        visited: [...visited],
        contributors: [...contributors],
        total,
        ql,
        qr,
        caption: `Node ${node} covers [${l}, ${r}] — fully inside [${ql}, ${qr}]. Add ${tree[node]} (sum = ${total}).`,
      });
      return tree[node];
    }
    frames.push({
      kind: 'query',
      action: 'partial',
      node,
      visited: [...visited],
      contributors: [...contributors],
      total,
      ql,
      qr,
      caption: `Node ${node} covers [${l}, ${r}] — partial overlap with [${ql}, ${qr}]. Recurse into both children.`,
    });
    const leftSum = recurse(node * 2);
    frames.push({
      kind: 'query',
      action: 'return-left',
      node,
      visited: [...visited],
      contributors: [...contributors],
      total,
      ql,
      qr,
      caption: `Left subtree of node ${node} returned ${leftSum}. Now exploring right child.`,
    });
    const rightSum = recurse(node * 2 + 1);
    frames.push({
      kind: 'query',
      action: 'return-right',
      node,
      visited: [...visited],
      contributors: [...contributors],
      total,
      ql,
      qr,
      caption: `Right subtree of node ${node} returned ${rightSum}. Combined at node ${node} = ${leftSum + rightSum}.`,
    });
    return leftSum + rightSum;
  };

  recurse(1);

  frames.push({
    kind: 'query',
    action: 'done',
    node: 1,
    visited: [...visited],
    contributors: [...contributors],
    total,
    ql,
    qr,
    caption: `Query [${ql}, ${qr}] done. Sum = ${total} (from ${contributors.length} segment${contributors.length === 1 ? '' : 's'}).`,
  });
  return frames;
}

function updateFrames(treeIn, rangeIn, arrIn, n, pos, newVal) {
  const tree = [...treeIn];
  const arr = [...arrIn];
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

  // Descend down the path.
  for (let step = 0; step < path.length; step++) {
    const node = path[step];
    const [l, r] = rangeIn[node];
    const isLeaf = l === r;
    frames.push({
      kind: 'update',
      phase: 'descend',
      node,
      path: path.slice(0, step + 1),
      tree: [...tree],
      arr: [...arr],
      pos,
      newVal,
      caption: isLeaf
        ? `Reached leaf at node ${node} (covers [${l}, ${r}]). Replace ${tree[node]} with ${newVal}.`
        : `Descend through node ${node} covering [${l}, ${r}] — target index ${pos} sits in the ${pos <= ((l + r) >> 1) ? 'left' : 'right'} child.`,
    });
  }

  // Update the leaf.
  const leaf = path[path.length - 1];
  const oldLeafVal = tree[leaf];
  tree[leaf] = newVal;
  arr[pos] = newVal;
  frames.push({
    kind: 'update',
    phase: 'leaf-set',
    node: leaf,
    path: [...path],
    tree: [...tree],
    arr: [...arr],
    pos,
    newVal,
    caption: `Leaf node ${leaf} updated: ${oldLeafVal} -> ${newVal}.`,
  });

  // Propagate up to root, recomputing each ancestor as left + right.
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
      path: [...path],
      tree: [...tree],
      arr: [...arr],
      pos,
      newVal,
      caption: `Updating ancestor node ${node} covering [${l}, ${r}]: ${oldVal} -> ${left} + ${right} = ${tree[node]}.`,
    });
  }

  frames.push({
    kind: 'update',
    phase: 'done',
    node: 1,
    path: [...path],
    tree: [...tree],
    arr: [...arr],
    pos,
    newVal,
    caption: `Point update done. arr[${pos}] = ${newVal}; root sum = ${tree[1]}.`,
  });

  return frames;
}

export default function SegmentTreeViz() {
  const [arr, setArr] = useState(INITIAL_ARRAY);
  const [ql, setQl] = useState('1');
  const [qr, setQr] = useState('5');
  const [upi, setUpi] = useState('3');
  const [upv, setUpv] = useState('10');
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(null);

  const { tree: baseTree, range: baseRange, n } = useMemo(() => buildTree(arr), [arr]);

  const currentFrame = idx >= 0 && idx < frames.length ? frames[idx] : null;

  // For UPDATE frames the tree mutates; for QUERY frames the tree is static.
  const displayTree = currentFrame && currentFrame.kind === 'update' ? currentFrame.tree : baseTree;
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

  const runQuery = useCallback(() => {
    const a = Number(ql);
    const b = Number(qr);
    if (!Number.isInteger(a) || !Number.isInteger(b)) return;
    if (a < 0 || b >= n || a > b) return;
    const built = queryFrames(baseTree, baseRange, n, a, b);
    setFrames(built);
    setIdx(0);
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
    setPlaying(true);
  }, [upi, upv, baseTree, baseRange, arr, n]);

  const reset = useCallback(() => {
    setPlaying(false);
    setArr(INITIAL_ARRAY);
    setFrames([]);
    setIdx(-1);
    setQl('1');
    setQr('5');
    setUpi('3');
    setUpv('10');
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (idx < 0 || idx >= frames.length - 1) {
      // Commit array state for updates when the animation completes.
      if (idx === frames.length - 1 && frames.length > 0) {
        const last = frames[frames.length - 1];
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

  const contributorSet = useMemo(() => {
    if (!currentFrame || currentFrame.kind !== 'query') return new Set();
    return new Set((currentFrame.contributors || []).map((c) => c.node));
  }, [currentFrame]);

  const pathSet = useMemo(() => {
    if (!currentFrame || currentFrame.kind !== 'update') return new Set();
    return new Set(currentFrame.path || []);
  }, [currentFrame]);

  const step = idx + 1;
  const totalSteps = frames.length;

  const caption = currentFrame
    ? currentFrame.caption
    : 'Run a range query or point update to begin.';

  const headerMode = !currentFrame
    ? 'idle'
    : currentFrame.kind === 'query'
      ? `Range query [${currentFrame.ql}, ${currentFrame.qr}]`
      : `Point update arr[${currentFrame.pos}] = ${currentFrame.newVal}`;

  return (
    <div className="stv-root">
      <div className="stv-head">
        <div className="stv-title-block">
          <h3 className="stv-title">Segment tree — range sum</h3>
          <p className="stv-sub">
            Each internal node stores the sum of a contiguous slice of the array. Range queries split
            the slice across O(log n) nodes; point updates walk one leaf-to-root path.
          </p>
        </div>
      </div>

      <div className="stv-controls">
        <div className="stv-control-group">
          <span className="stv-group-label">Range query</span>
          <label className="stv-input-label">
            l
            <input
              type="number"
              value={ql}
              onChange={(e) => setQl(e.target.value)}
              className="stv-input"
              min={0}
              max={n - 1}
            />
          </label>
          <label className="stv-input-label">
            r
            <input
              type="number"
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              className="stv-input"
              min={0}
              max={n - 1}
            />
          </label>
          <button type="button" className="stv-btn stv-btn-primary" onClick={runQuery}>
            <Search size={14} /> Query
          </button>
        </div>

        <div className="stv-control-group">
          <span className="stv-group-label">Point update</span>
          <label className="stv-input-label">
            i
            <input
              type="number"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              className="stv-input"
              min={0}
              max={n - 1}
            />
          </label>
          <label className="stv-input-label">
            val
            <input
              type="number"
              value={upv}
              onChange={(e) => setUpv(e.target.value)}
              className="stv-input"
            />
          </label>
          <button type="button" className="stv-btn stv-btn-primary" onClick={runUpdate}>
            <Edit3 size={14} /> Update
          </button>
        </div>

        <div className="stv-control-group stv-control-group-end">
          <button type="button" className="stv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <div className="stv-control-divider" />
          <button
            type="button"
            className="stv-btn"
            onClick={stepPrev}
            disabled={frames.length === 0 || idx <= 0}
            aria-label="Previous step"
          >
            <SkipBack size={14} />
          </button>
          <button
            type="button"
            className="stv-btn"
            onClick={togglePlay}
            disabled={frames.length === 0}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            className="stv-btn"
            onClick={stepNext}
            disabled={frames.length === 0 || idx >= frames.length - 1}
            aria-label="Next step"
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>

      <div className="stv-array-row">
        <span className="stv-array-label">Array</span>
        <div className="stv-array-cells">
          {displayArr.map((v, i) => {
            const inQueryRange =
              currentFrame &&
              currentFrame.kind === 'query' &&
              i >= currentFrame.ql &&
              i <= currentFrame.qr;
            const isUpdateTarget =
              currentFrame && currentFrame.kind === 'update' && i === currentFrame.pos;
            return (
              <div
                key={i}
                className={[
                  'stv-cell',
                  inQueryRange ? 'stv-cell-in-range' : '',
                  isUpdateTarget ? 'stv-cell-update' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="stv-cell-value">{v}</span>
                <span className="stv-cell-index">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stv-stage">
        <svg
          className="stv-svg"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          role="img"
          aria-label="Segment tree visualization"
        >
          {edges.map((e, ei) => {
            const a = positions[e.a];
            const b = positions[e.b];
            if (!a || !b) return null;
            const onPath =
              (visitedSet.has(e.a) && visitedSet.has(e.b)) ||
              (pathSet.has(e.a) && pathSet.has(e.b));
            return (
              <line
                key={`e${ei}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={`stv-edge ${onPath ? 'stv-edge-active' : ''}`}
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
            const isContributor = contributorSet.has(node);
            const isOnPath = pathSet.has(node) && !isCurrent;
            const cls = [
              'stv-node',
              isLeaf ? 'stv-node-leaf' : '',
              isVisited ? 'stv-node-visited' : '',
              isContributor ? 'stv-node-contributor' : '',
              isOnPath ? 'stv-node-path' : '',
              isCurrent ? 'stv-node-current' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const w = isLeaf ? 44 : 56;
            const h = isLeaf ? 36 : 40;
            return (
              <g key={node} className={cls} transform={`translate(${p.x}, ${p.y})`}>
                {isCurrent && (
                  <rect
                    x={-w / 2 - 5}
                    y={-h / 2 - 5}
                    width={w + 10}
                    height={h + 10}
                    rx={9}
                    className="stv-node-ring"
                  />
                )}
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  rx={7}
                  className="stv-node-box"
                />
                <text x={0} y={-3} textAnchor="middle" className="stv-node-value">
                  {displayTree[node]}
                </text>
                <text x={0} y={11} textAnchor="middle" className="stv-node-range">
                  [{l},{r}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="stv-footer">
        <div className="stv-stat">
          <span className="stv-stat-label">Step</span>
          <span className="stv-stat-value">
            {totalSteps === 0 ? '0 / 0' : `${step} / ${totalSteps}`}
          </span>
        </div>
        <div className="stv-stat">
          <span className="stv-stat-label">Mode</span>
          <span className="stv-stat-value">{headerMode}</span>
        </div>
        <div className="stv-stat stv-stat-grow">
          <span className="stv-stat-label">Status</span>
          <span className="stv-stat-value">{caption}</span>
        </div>
        {currentFrame && currentFrame.kind === 'query' && (
          <div className="stv-stat">
            <span className="stv-stat-label">Running sum</span>
            <span className="stv-stat-value stv-stat-emph">{currentFrame.total}</span>
          </div>
        )}
        {currentFrame && currentFrame.kind === 'update' && (
          <div className="stv-stat">
            <span className="stv-stat-label">Root sum</span>
            <span className="stv-stat-value stv-stat-emph">{currentFrame.tree[1]}</span>
          </div>
        )}
      </div>

      {currentFrame && currentFrame.kind === 'query' && currentFrame.contributors.length > 0 && (
        <div className="stv-contrib-row">
          <span className="stv-array-label">Contributors</span>
          <div className="stv-contrib-chips">
            {currentFrame.contributors.map((c) => (
              <span key={c.node} className="stv-chip">
                node {c.node} <span className="stv-chip-range">[{c.l},{c.r}]</span> = {c.value}
              </span>
            ))}
            <span className="stv-chip stv-chip-total">total {currentFrame.total}</span>
          </div>
        </div>
      )}
    </div>
  );
}
