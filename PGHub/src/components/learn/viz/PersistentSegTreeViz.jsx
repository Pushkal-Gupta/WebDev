import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, Search, RotateCcw, Play, Pause, SkipForward, SkipBack, GitBranch } from 'lucide-react';
import './PersistentSegTreeViz.css';

const INITIAL_ARRAY = [5, 2, 7, 1, 9, 3, 8, 4];
const SVG_W = 920;
const SVG_H = 400;
const STEP_MS = 900;

// --- Persistent segment tree core (sum). Path-copying: update never mutates,
// it builds O(log n) new nodes and shares the rest with the prior version. ---

let NODE_SEQ = 0;
function freshId() {
  return NODE_SEQ++;
}

function makeNode(sum, left, right, lo, hi) {
  return { id: freshId(), sum, left, right, lo, hi };
}

function build(arr, lo, hi) {
  if (lo === hi) return makeNode(arr[lo], null, null, lo, hi);
  const mid = (lo + hi) >> 1;
  const l = build(arr, lo, mid);
  const r = build(arr, mid + 1, hi);
  return makeNode(l.sum + r.sum, l, r, lo, hi);
}

// Returns { root, copied:[ids in copy order, leaf-first], path:[node refs root->leaf] }.
function updateVersion(prevRoot, idx, val) {
  const copied = [];
  const path = [];
  function rec(node) {
    const lo = node.lo;
    const hi = node.hi;
    if (lo === hi) {
      const leaf = makeNode(val, null, null, lo, hi);
      copied.push(leaf.id);
      path.push(leaf);
      return leaf;
    }
    const mid = (lo + hi) >> 1;
    let l = node.left;
    let r = node.right;
    if (idx <= mid) l = rec(node.left);
    else r = rec(node.right);
    const made = makeNode(l.sum + r.sum, l, r, lo, hi);
    copied.push(made.id);
    path.push(made);
    return made;
  }
  const root = rec(prevRoot);
  path.reverse(); // root -> ... -> leaf
  return { root, copied, path };
}

function toArray(root, n) {
  const out = new Array(n).fill(0);
  (function rec(node) {
    if (node.lo === node.hi) {
      out[node.lo] = node.sum;
      return;
    }
    rec(node.left);
    rec(node.right);
  })(root);
  return out;
}

// Range sum [ql, qr] on a version root; records the nodes visited.
function rangeSumTrace(root, ql, qr) {
  const visited = [];
  function rec(node) {
    if (node.hi < ql || qr < node.lo) return 0;
    visited.push(node.id);
    if (ql <= node.lo && node.hi <= qr) return node.sum;
    return rec(node.left) + rec(node.right);
  }
  const total = rec(root);
  return { total, visited };
}

function countDistinct(roots) {
  const seen = new Set();
  for (const r of roots) {
    (function rec(node) {
      if (!node || seen.has(node.id)) return;
      seen.add(node.id);
      rec(node.left);
      rec(node.right);
    })(r);
  }
  return seen.size;
}

// Layout the full segment tree over [0, n-1] by recursion: x spread across the
// width at the leaf level, internal nodes centered over their children.
function layoutTree(root) {
  const pos = {};
  let maxDepth = 0;
  (function findDepth(node, d) {
    if (!node) return;
    if (d > maxDepth) maxDepth = d;
    findDepth(node.left, d + 1);
    findDepth(node.right, d + 1);
  })(root, 0);

  const padX = 36;
  const topY = 44;
  const usableW = SVG_W - padX * 2;
  const yStep = maxDepth === 0 ? 0 : (SVG_H - 130 - topY) / maxDepth;
  const total = root.hi - root.lo + 1; // leaf count the tree spans

  // x by the midpoint of the covered range, normalized over the full leaf span.
  (function place(node, d) {
    if (!node) return;
    const mid = node.lo + (node.hi - node.lo) / 2 + 0.5;
    const cx = padX + (mid / total) * usableW;
    pos[node.id] = { x: cx, y: topY + d * yStep, lo: node.lo, hi: node.hi };
    place(node.left, d + 1);
    place(node.right, d + 1);
  })(root, 0);

  return pos;
}

// Collect edges (parent -> child) for a tree.
function collectEdges(root) {
  const edges = [];
  (function rec(node) {
    if (!node) return;
    if (node.left) {
      edges.push({ from: node.id, to: node.left.id });
      rec(node.left);
    }
    if (node.right) {
      edges.push({ from: node.id, to: node.right.id });
      rec(node.right);
    }
  })(root);
  return edges;
}

function collectNodes(root) {
  const out = [];
  (function rec(node) {
    if (!node) return;
    out.push(node);
    rec(node.left);
    rec(node.right);
  })(root);
  return out;
}

export default function PersistentSegTreeViz() {
  // versions[k] = { root, copied:Set, label } ; versions[0] is the base build.
  const [versions, setVersions] = useState(() => {
    NODE_SEQ = 0;
    const root = build(INITIAL_ARRAY, 0, INITIAL_ARRAY.length - 1);
    return [{ root, copiedSet: new Set(), label: 'v0' }];
  });
  const [selected, setSelected] = useState(0); // version being viewed
  const [upi, setUpi] = useState('2');
  const [upv, setUpv] = useState('100');
  const [ql, setQl] = useState('1');
  const [qr, setQr] = useState('4');
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playingRaw, setPlaying] = useState(false);
  const playRef = useRef(null);

  const n = INITIAL_ARRAY.length;
  const logn = Math.ceil(Math.log2(n)) + 1; // nodes copied per update

  const currentFrame = idx >= 0 && idx < frames.length ? frames[idx] : null;
  const playing = playingRaw && idx >= 0 && idx < frames.length - 1;

  // Which version's tree is drawn + which previous version it shares with.
  const viewVersion = currentFrame ? currentFrame.version : selected;
  const drawRoot = versions[viewVersion]?.root ?? versions[0].root;
  const prevRoot = viewVersion > 0 ? versions[viewVersion - 1].root : null;

  // Union of nodes reachable from drawRoot (and prev root, so shared nodes show
  // their dimmed link to the old version too).
  const treeNodes = useMemo(() => {
    const map = new Map();
    for (const nd of collectNodes(drawRoot)) map.set(nd.id, nd);
    if (prevRoot) for (const nd of collectNodes(prevRoot)) if (!map.has(nd.id)) map.set(nd.id, nd);
    return [...map.values()];
  }, [drawRoot, prevRoot]);

  const positions = useMemo(() => {
    // Lay out from whichever root is the full tree (both span [0,n-1]).
    const pos = layoutTree(drawRoot);
    if (prevRoot) {
      const prevPos = layoutTree(prevRoot);
      for (const k of Object.keys(prevPos)) if (!pos[k]) pos[k] = prevPos[k];
    }
    return pos;
  }, [drawRoot, prevRoot]);

  const newEdges = useMemo(() => collectEdges(drawRoot), [drawRoot]);
  const prevEdges = useMemo(() => (prevRoot ? collectEdges(prevRoot) : []), [prevRoot]);

  const copiedSet = versions[viewVersion]?.copiedSet ?? new Set();

  // The set of node ids highlighted as "copied so far" during the animation,
  // and the set highlighted as "query path" in query mode.
  const animCopied = currentFrame && currentFrame.kind === 'update' ? currentFrame.copiedSoFar : null;
  const queryVisited = currentFrame && currentFrame.kind === 'query' ? currentFrame.visitedSoFar : null;

  const displayArray = useMemo(() => toArray(drawRoot, n), [drawRoot, n]);

  const naiveNodes = (2 * n - 1) * versions.length;
  const actualNodes = useMemo(() => countDistinct(versions.map((v) => v.root)), [versions]);

  const runUpdate = useCallback(() => {
    const i = Number(upi);
    const v = Number(upv);
    if (!Number.isInteger(i) || !Number.isFinite(v)) return;
    if (i < 0 || i >= n) return;
    const prev = versions[versions.length - 1];
    const { root, copied, path } = updateVersion(prev.root, i, v);
    const newVersionIndex = versions.length;
    const copiedSetNew = new Set(copied);
    const built = [];
    // Step 1: announce.
    built.push({
      kind: 'update',
      phase: 'start',
      version: newVersionIndex - 1, // still show old tree at announce
      activeId: null,
      copiedSoFar: new Set(),
      idx0: i,
      val: v,
      caption: `Update a[${i}] = ${v}. Instead of mutating v${newVersionIndex - 1}, build v${newVersionIndex} by copying only the root-to-leaf path (${path.length} nodes) and sharing the rest.`,
    });
    // Steps: reveal each copied node along the path, root -> leaf.
    const running = new Set();
    for (let s = 0; s < path.length; s++) {
      const node = path[s];
      running.add(node.id);
      const where = node.lo === node.hi ? `leaf [${node.lo}]` : `node [${node.lo}, ${node.hi}]`;
      const isLeaf = node.lo === node.hi;
      built.push({
        kind: 'update',
        phase: 'copy',
        version: newVersionIndex,
        activeId: node.id,
        copiedSoFar: new Set(running),
        idx0: i,
        val: v,
        caption: isLeaf
          ? `Copy ${where}: write ${v}. Path copy complete — ${path.length} new nodes.`
          : `Copy ${where} -> new node (sum recomputed). Its untouched child still points into v${newVersionIndex - 1} (shared).`,
      });
    }
    built.push({
      kind: 'update',
      phase: 'done',
      version: newVersionIndex,
      activeId: null,
      copiedSoFar: copiedSetNew,
      idx0: i,
      val: v,
      caption: `v${newVersionIndex} ready. ${copied.length} nodes copied (O(log n) = ${logn}); every other subtree is shared with v${newVersionIndex - 1}. Old versions are unchanged.`,
    });

    setVersions((vs) => [...vs, { root, copiedSet: copiedSetNew, label: `v${newVersionIndex}` }]);
    setSelected(newVersionIndex);
    setFrames(built);
    setIdx(0);
    setPlaying(true);
  }, [upi, upv, versions, n, logn]);

  const runQuery = useCallback(() => {
    const a = Number(ql);
    const b = Number(qr);
    if (!Number.isInteger(a) || !Number.isInteger(b)) return;
    if (a < 0 || b >= n || a > b) return;
    const root = versions[selected].root;
    const { total, visited } = rangeSumTrace(root, a, b);
    const built = [];
    built.push({
      kind: 'query',
      phase: 'start',
      version: selected,
      activeId: null,
      visitedSoFar: new Set(),
      total: 0,
      ql: a,
      qr: b,
      caption: `Time-travel query on v${selected}: rangeSum[${a}, ${b}]. Descend v${selected}'s root — it returns the array state as of that version.`,
    });
    const running = new Set();
    let acc = 0;
    // Re-walk to attach partial sums for the readout.
    (function rec(node) {
      if (node.hi < a || b < node.lo) return 0;
      running.add(node.id);
      if (a <= node.lo && node.hi <= b) {
        acc += node.sum;
        built.push({
          kind: 'query',
          phase: 'add',
          version: selected,
          activeId: node.id,
          visitedSoFar: new Set(running),
          total: acc,
          ql: a,
          qr: b,
          caption: `[${node.lo}, ${node.hi}] fully inside [${a}, ${b}]: add sum ${node.sum}. Running total = ${acc}.`,
        });
        return node.sum;
      }
      built.push({
        kind: 'query',
        phase: 'descend',
        version: selected,
        activeId: node.id,
        visitedSoFar: new Set(running),
        total: acc,
        ql: a,
        qr: b,
        caption: `[${node.lo}, ${node.hi}] partially overlaps [${a}, ${b}]: recurse into both children.`,
      });
      return rec(node.left) + rec(node.right);
    })(root);
    built.push({
      kind: 'query',
      phase: 'done',
      version: selected,
      activeId: null,
      visitedSoFar: new Set(visited),
      total,
      ql: a,
      qr: b,
      caption: `rangeSum[${a}, ${b}] on v${selected} = ${total}. Older versions stay intact — querying v${selected} never touches v${versions.length - 1}.`,
    });
    setFrames(built);
    setIdx(0);
    setPlaying(true);
  }, [ql, qr, selected, versions, n]);

  const reset = useCallback(() => {
    setPlaying(false);
    NODE_SEQ = 0;
    const root = build(INITIAL_ARRAY, 0, INITIAL_ARRAY.length - 1);
    setVersions([{ root, copiedSet: new Set(), label: 'v0' }]);
    setSelected(0);
    setFrames([]);
    setIdx(-1);
    setUpi('2');
    setUpv('100');
    setQl('1');
    setQr('4');
  }, []);

  useEffect(() => {
    if (!playing) return;
    playRef.current = setTimeout(() => setIdx((i) => i + 1), STEP_MS);
    return () => clearTimeout(playRef.current);
  }, [playing, idx]);

  const stepNext = () => {
    if (idx < frames.length - 1) setIdx(idx + 1);
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

  const selectVersion = (k) => {
    setPlaying(false);
    setFrames([]);
    setIdx(-1);
    setSelected(k);
  };

  const step = idx + 1;
  const totalSteps = frames.length;
  const caption = currentFrame
    ? currentFrame.caption
    : 'Run an update to fork a new version (path-copy), or query an old version to time-travel.';

  // Range highlight on the array strip during a query.
  const qRange =
    currentFrame && currentFrame.kind === 'query'
      ? [currentFrame.ql, currentFrame.qr]
      : null;
  const upTarget =
    currentFrame && currentFrame.kind === 'update' ? currentFrame.idx0 : null;

  const modeLabel = !currentFrame
    ? `viewing v${selected}`
    : currentFrame.kind === 'update'
      ? `update a[${currentFrame.idx0}] = ${currentFrame.val}`
      : `query v${currentFrame.version} rangeSum[${currentFrame.ql}, ${currentFrame.qr}]`;

  const runningTotal =
    currentFrame && currentFrame.kind === 'query' ? currentFrame.total : null;

  const copiedThisUpdate =
    currentFrame && currentFrame.kind === 'update'
      ? currentFrame.copiedSoFar.size
      : viewVersion > 0
        ? copiedSet.size
        : 0;

  return (
    <div className="pstv-root">
      <div className="pstv-head">
        <h3 className="pstv-title">Persistent segment tree — versions by path-copying</h3>
        <p className="pstv-sub">
          An update never mutates. It clones only the O(log n) nodes on the root-to-leaf path; every
          other subtree is shared with the previous version. Each root is a frozen snapshot you can
          query later.
        </p>
      </div>

      <div className="pstv-controls">
        <div className="pstv-control-group">
          <span className="pstv-group-label">Update -&gt; new version</span>
          <label className="pstv-input-label">
            i
            <input
              type="number"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              className="pstv-input"
              min={0}
              max={n - 1}
            />
          </label>
          <label className="pstv-input-label">
            =val
            <input
              type="number"
              value={upv}
              onChange={(e) => setUpv(e.target.value)}
              className="pstv-input"
            />
          </label>
          <button type="button" className="pstv-btn pstv-btn-primary" onClick={runUpdate}>
            <Edit3 size={14} /> Update
          </button>
        </div>

        <div className="pstv-control-group">
          <span className="pstv-group-label">Query v{selected}</span>
          <label className="pstv-input-label">
            l
            <input
              type="number"
              value={ql}
              onChange={(e) => setQl(e.target.value)}
              className="pstv-input"
              min={0}
              max={n - 1}
            />
          </label>
          <label className="pstv-input-label">
            r
            <input
              type="number"
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              className="pstv-input"
              min={0}
              max={n - 1}
            />
          </label>
          <button type="button" className="pstv-btn pstv-btn-primary" onClick={runQuery}>
            <Search size={14} /> Query
          </button>
        </div>

        <div className="pstv-control-group pstv-control-group-end">
          <button type="button" className="pstv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <div className="pstv-control-divider" />
          <button
            type="button"
            className="pstv-btn"
            onClick={stepPrev}
            disabled={frames.length === 0 || idx <= 0}
            aria-label="Previous step"
          >
            <SkipBack size={14} />
          </button>
          <button
            type="button"
            className="pstv-btn"
            onClick={togglePlay}
            disabled={frames.length === 0}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            className="pstv-btn"
            onClick={stepNext}
            disabled={frames.length === 0 || idx >= frames.length - 1}
            aria-label="Next step"
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>

      <div className="pstv-versions">
        <span className="pstv-versions-label">
          <GitBranch size={13} /> versions
        </span>
        <div className="pstv-versions-rail">
          {versions.map((v, k) => {
            const isView = k === viewVersion;
            const isSel = k === selected && !currentFrame;
            return (
              <button
                type="button"
                key={k}
                className={[
                  'pstv-ver-chip',
                  isView ? 'pstv-ver-chip-view' : '',
                  isSel ? 'pstv-ver-chip-sel' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => selectVersion(k)}
              >
                <span className="pstv-ver-name">root_{k}</span>
                <span className="pstv-ver-arr">[{toArray(v.root, n).join(', ')}]</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pstv-array-row">
        <span className="pstv-array-label">v{viewVersion} array</span>
        <div className="pstv-array-cells">
          {displayArray.map((val, i) => {
            const inQ = qRange && i >= qRange[0] && i <= qRange[1];
            const isUp = upTarget === i;
            return (
              <div
                key={i}
                className={[
                  'pstv-cell',
                  inQ ? 'pstv-cell-in-range' : '',
                  isUp ? 'pstv-cell-update' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="pstv-cell-value">{val}</span>
                <span className="pstv-cell-index">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pstv-stage">
        <svg
          className="pstv-svg"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Persistent segment tree visualization"
        >
          {/* Previous-version edges (shared / old): drawn first, dimmed. */}
          {prevEdges.map((e, ei) => {
            const a = positions[e.from];
            const b = positions[e.to];
            if (!a || !b) return null;
            return (
              <line
                key={`pe-${ei}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="pstv-edge pstv-edge-old"
              />
            );
          })}

          {/* New-version edges: an edge into a freshly copied node is the new path. */}
          {newEdges.map((e, ei) => {
            const a = positions[e.from];
            const b = positions[e.to];
            if (!a || !b) return null;
            const childCopied = animCopied
              ? animCopied.has(e.to)
              : copiedSet.has(e.to);
            const parentCopied = animCopied
              ? animCopied.has(e.from)
              : copiedSet.has(e.from);
            // Edge along the copied path = both ends are new nodes.
            const onPath = childCopied && parentCopied;
            // Edge from a new node to a shared (old) child = the share pointer.
            const sharePtr = parentCopied && !childCopied;
            return (
              <line
                key={`ne-${ei}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={[
                  'pstv-edge',
                  onPath ? 'pstv-edge-path' : '',
                  sharePtr ? 'pstv-edge-share' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                strokeDasharray={sharePtr ? '4 4' : undefined}
              />
            );
          })}

          {/* Nodes. */}
          {treeNodes.map((node) => {
            const p = positions[node.id];
            if (!p) return null;
            const isLeaf = node.lo === node.hi;
            const isCopied = animCopied
              ? animCopied.has(node.id)
              : currentFrame
                ? copiedSet.has(node.id)
                : copiedSet.has(node.id);
            const isActive = currentFrame && currentFrame.activeId === node.id;
            const isQueryHit = queryVisited && queryVisited.has(node.id);
            // A node belongs to the previous version only (shared/dim) if it
            // isn't part of the freshly copied set for this version.
            const isShared = viewVersion > 0 && !copiedSet.has(node.id) && !animCopied;
            const cls = [
              'pstv-node',
              isActive ? 'pstv-node-active' : '',
              isCopied && !isActive ? 'pstv-node-copied' : '',
              isQueryHit && !isActive ? 'pstv-node-query' : '',
              isShared && !isQueryHit ? 'pstv-node-shared' : '',
              isLeaf ? 'pstv-node-leaf' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const w = isLeaf ? 40 : 56;
            const h = 38;
            return (
              <g key={node.id} className={cls} transform={`translate(${p.x}, ${p.y})`}>
                {isActive && (
                  <rect
                    x={-w / 2 - 5}
                    y={-h / 2 - 5}
                    width={w + 10}
                    height={h + 10}
                    rx={9}
                    className="pstv-node-ring"
                  />
                )}
                <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={7} className="pstv-node-box" />
                <text x={0} y={-4} textAnchor="middle" className="pstv-node-sum">
                  {node.sum}
                </text>
                <text x={0} y={11} textAnchor="middle" className="pstv-node-range">
                  {isLeaf ? `[${node.lo}]` : `[${node.lo},${node.hi}]`}
                </text>
              </g>
            );
          })}

          {/* Legend. */}
          <g transform={`translate(${SVG_W - 230}, ${SVG_H - 64})`}>
            <rect x={0} y={0} width={14} height={14} rx={3} className="pstv-lg-copied" />
            <text x={20} y={11} className="pstv-legend-text">
              copied this version
            </text>
            <rect x={0} y={22} width={14} height={14} rx={3} className="pstv-lg-shared" />
            <text x={20} y={33} className="pstv-legend-text">
              shared with prior version
            </text>
          </g>
        </svg>
      </div>

      <div className="pstv-footer">
        <div className="pstv-stat">
          <span className="pstv-stat-label">Step</span>
          <span className="pstv-stat-value">
            {totalSteps === 0 ? '0 / 0' : `${step} / ${totalSteps}`}
          </span>
        </div>
        <div className="pstv-stat">
          <span className="pstv-stat-label">Current version</span>
          <span className="pstv-stat-value">
            v{viewVersion} of {versions.length - 1}
          </span>
        </div>
        <div className="pstv-stat">
          <span className="pstv-stat-label">Operation</span>
          <span className="pstv-stat-value">{modeLabel}</span>
        </div>
        <div className="pstv-stat">
          <span className="pstv-stat-label">Copied this update</span>
          <span className="pstv-stat-value pstv-stat-emph">
            {copiedThisUpdate} {copiedThisUpdate ? `(O(log n)=${logn})` : ''}
          </span>
        </div>
        <div className="pstv-stat">
          <span className="pstv-stat-label">Nodes: persistent vs naive-copy</span>
          <span className="pstv-stat-value">
            {actualNodes} vs {naiveNodes}
          </span>
        </div>
        {runningTotal !== null && (
          <div className="pstv-stat">
            <span className="pstv-stat-label">Query sum</span>
            <span className="pstv-stat-value pstv-stat-emph">{runningTotal}</span>
          </div>
        )}
        <div className="pstv-stat pstv-stat-grow">
          <span className="pstv-stat-label">Status</span>
          <span className="pstv-stat-value">{caption}</span>
        </div>
      </div>
    </div>
  );
}
