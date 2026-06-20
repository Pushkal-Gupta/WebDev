import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Shuffle, RotateCcw, Play, Pause, SkipForward } from 'lucide-react';
import './TreapSplitMergeViz.css';

const SVG_W = 720;
const SVG_H = 360;
const NODE_R = 18;
const TOP_Y = 46;
const LEVEL_STEP = 64;
const X_PAD = 44;
const STEP_MS = 850;

// Deterministic priority from a key — a tiny seeded hash PRNG, never Math.random.
function priorityFor(key) {
  let h = (key | 0) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
  h ^= h >>> 16;
  return ((h >>> 0) % 900) + 100; // 100..999
}

let UID = 1;
function makeNode(key) {
  return { id: UID++, key, priority: priorityFor(key), left: null, right: null };
}

function cloneTree(node) {
  if (!node) return null;
  return {
    id: node.id,
    key: node.key,
    priority: node.priority,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

function buildPreset(keys) {
  let root = null;
  keys.forEach((k) => { root = bstThenHeapify(root, makeNode(k)).root; });
  return root;
}

// Plain BST insert then rotate up to restore heap — used only for preset seeding.
function bstThenHeapify(root, node) {
  function rec(cur) {
    if (!cur) return node;
    if (node.key < cur.key) {
      cur.left = rec(cur.left);
      if (cur.left.priority > cur.priority) return rotateRight(cur);
    } else if (node.key > cur.key) {
      cur.right = rec(cur.right);
      if (cur.right.priority > cur.priority) return rotateLeft(cur);
    }
    return cur;
  }
  return { root: rec(root) };
}

function rotateRight(p) {
  const c = p.left;
  p.left = c.right;
  c.right = p;
  return c;
}

function rotateLeft(p) {
  const c = p.right;
  p.right = c.left;
  c.left = p;
  return c;
}

function nodeCount(node) {
  if (!node) return 0;
  return 1 + nodeCount(node.left) + nodeCount(node.right);
}

function treeHeight(node) {
  if (!node) return 0;
  return 1 + Math.max(treeHeight(node.left), treeHeight(node.right));
}

function heapValid(node) {
  if (!node) return true;
  if (node.left && node.left.priority > node.priority) return false;
  if (node.right && node.right.priority > node.priority) return false;
  return heapValid(node.left) && heapValid(node.right);
}

function hasKey(node, key) {
  let cur = node;
  while (cur) {
    if (key === cur.key) return true;
    cur = key < cur.key ? cur.left : cur.right;
  }
  return false;
}

// Build INSERT frames: BST descent, then bubble up via rotations.
function buildInsertFrames(rootIn, key) {
  const frames = [];
  const node = makeNode(key);

  // Record the path of parents from root down to insertion point.
  const path = [];
  let cur = rootIn;
  while (cur) {
    path.push(cur.id);
    cur = key < cur.key ? cur.left : cur.right;
  }

  frames.push({
    tree: cloneTree(rootIn),
    highlight: new Set(path.length ? [path[path.length - 1]] : []),
    rotEdge: null,
    caption: rootIn
      ? `Insert ${key} (priority ${node.priority}): walk down by BST key to find the leaf slot.`
      : `Insert ${key} (priority ${node.priority}) into the empty treap — it becomes the root.`,
  });

  // Insert as a BST leaf, tracking the parent chain for bubble-up.
  function insert(curNode) {
    if (!curNode) return node;
    if (key < curNode.key) curNode.left = insert(curNode.left);
    else curNode.right = insert(curNode.right);
    return curNode;
  }
  let root = insert(rootIn ? cloneTree(rootIn) : null);

  frames.push({
    tree: cloneTree(root),
    highlight: new Set([node.id]),
    rotEdge: null,
    caption: `Placed ${key} as a BST leaf. Now bubble up while its priority beats its parent's.`,
  });

  // Re-run heapify bottom-up with rotation frames. Rebuild parent chain by id.
  function chainTo(targetId, n, acc) {
    if (!n) return null;
    acc.push(n);
    if (n.id === targetId) return acc;
    const left = chainTo(targetId, n.left, acc);
    if (left) return left;
    acc.pop();
    acc.push(n);
    const right = chainTo(targetId, n.right, acc);
    if (right) return right;
    acc.pop();
    return null;
  }

  // Repeatedly find the violating edge nearest the inserted node and rotate.
  let guard = 0;
  for (;;) {
    guard += 1;
    if (guard > 64) break;
    const chain = [];
    chainTo(node.id, root, chain);
    if (chain.length < 2) break;
    const child = chain[chain.length - 1];
    const parent = chain[chain.length - 2];
    if (child.priority <= parent.priority) break;

    const grand = chain.length >= 3 ? chain[chain.length - 3] : null;
    const isLeftChild = parent.left === child;

    frames.push({
      tree: cloneTree(root),
      highlight: new Set([child.id, parent.id]),
      rotEdge: { a: child.id, b: parent.id },
      caption: `Heap violation: priority[${child.key}]=${child.priority} > priority[${parent.key}]=${parent.priority}. Rotate ${isLeftChild ? 'right' : 'left'} to lift ${child.key}.`,
    });

    const rotated = isLeftChild ? rotateRight(parent) : rotateLeft(parent);
    if (!grand) {
      root = rotated;
    } else if (grand.left === parent) {
      grand.left = rotated;
    } else {
      grand.right = rotated;
    }

    frames.push({
      tree: cloneTree(root),
      highlight: new Set([child.id]),
      rotEdge: null,
      caption: `${child.key} rotated above ${parent.key}. BST order preserved; keep bubbling if needed.`,
    });
  }

  frames.push({
    tree: cloneTree(root),
    highlight: new Set([node.id]),
    rotEdge: null,
    caption: `Insert(${key}) done. Heap order restored: every parent priority ≥ its children.`,
  });

  return { frames, root };
}

// Build DELETE frames: rotate the target down to a leaf, then drop it.
function buildDeleteFrames(rootIn, key) {
  const frames = [];
  let root = cloneTree(rootIn);

  // locate node + its id
  let found = null;
  let cur = root;
  while (cur) {
    if (key === cur.key) { found = cur; break; }
    cur = key < cur.key ? cur.left : cur.right;
  }
  if (!found) {
    frames.push({
      tree: cloneTree(root),
      highlight: new Set(),
      rotEdge: null,
      caption: `Delete ${key}: key not present — nothing to remove.`,
    });
    return { frames, root, removed: false };
  }
  const targetId = found.id;

  frames.push({
    tree: cloneTree(root),
    highlight: new Set([targetId]),
    rotEdge: null,
    caption: `Delete ${key}: rotate it downward (toward the higher-priority child) until it is a leaf.`,
  });

  function chainTo(id, n, acc) {
    if (!n) return null;
    acc.push(n);
    if (n.id === id) return acc;
    const left = chainTo(id, n.left, acc);
    if (left) return left;
    acc.pop(); acc.push(n);
    const right = chainTo(id, n.right, acc);
    if (right) return right;
    acc.pop();
    return null;
  }

  let guard = 0;
  for (;;) {
    guard += 1;
    if (guard > 64) break;
    const chain = [];
    chainTo(targetId, root, chain);
    const t = chain[chain.length - 1];
    const parent = chain.length >= 2 ? chain[chain.length - 2] : null;
    if (!t.left && !t.right) break;

    const goRight = !t.left || (t.right && t.right.priority > t.left.priority);
    const child = goRight ? t.right : t.left;

    frames.push({
      tree: cloneTree(root),
      highlight: new Set([t.id, child.id]),
      rotEdge: { a: t.id, b: child.id },
      caption: `Rotate ${goRight ? 'left' : 'right'}: pull child ${child.key} (priority ${child.priority}) above ${t.key}.`,
    });

    const rotated = goRight ? rotateLeft(t) : rotateRight(t);
    if (!parent) {
      root = rotated;
    } else if (parent.left === t) {
      parent.left = rotated;
    } else {
      parent.right = rotated;
    }
  }

  // Detach the leaf.
  const chain = [];
  chainTo(targetId, root, chain);
  const parent = chain.length >= 2 ? chain[chain.length - 2] : null;
  if (!parent) {
    root = null;
  } else if (parent.left && parent.left.id === targetId) {
    parent.left = null;
  } else if (parent.right && parent.right.id === targetId) {
    parent.right = null;
  }

  frames.push({
    tree: cloneTree(root),
    highlight: new Set(),
    rotEdge: null,
    caption: `${key} reached a leaf and was removed. Heap + BST order intact.`,
  });

  return { frames, root, removed: true };
}

// Layout: in-order traversal sets x by visit order; depth sets y.
function computeLayout(root) {
  const pos = {};
  const order = [];
  (function inorder(n, depth) {
    if (!n) return;
    inorder(n.left, depth + 1);
    order.push({ id: n.id, depth });
    inorder(n.right, depth + 1);
  })(root, 0);

  const count = order.length;
  if (count === 0) return pos;
  const usableW = SVG_W - X_PAD * 2;
  const step = count === 1 ? 0 : usableW / (count - 1);
  order.forEach((o, i) => {
    pos[o.id] = {
      x: count === 1 ? SVG_W / 2 : X_PAD + i * step,
      y: TOP_Y + o.depth * LEVEL_STEP,
    };
  });
  return pos;
}

function collectEdges(root) {
  const edges = [];
  (function walk(n) {
    if (!n) return;
    if (n.left) { edges.push({ from: n.id, to: n.left.id, key: `${n.id}-${n.left.id}` }); walk(n.left); }
    if (n.right) { edges.push({ from: n.id, to: n.right.id, key: `${n.id}-${n.right.id}` }); walk(n.right); }
  })(root);
  return edges;
}

function collectNodes(root) {
  const list = [];
  (function walk(n) {
    if (!n) return;
    list.push(n);
    walk(n.left);
    walk(n.right);
  })(root);
  return list;
}

const PRESET_KEYS = [50, 30, 70, 20, 40, 60];

export default function TreapSplitMergeViz() {
  const [committed, setCommitted] = useState(() => buildPreset(PRESET_KEYS));
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [insVal, setInsVal] = useState('45');
  const [delVal, setDelVal] = useState('30');
  const [lastPriority, setLastPriority] = useState(priorityFor(60));
  const [phase, setPhase] = useState('idle');
  const pendingRef = useRef(null);
  const timerRef = useRef(null);

  const currentFrame = frames.length > 0 ? frames[idx] : null;
  const displayTree = currentFrame ? currentFrame.tree : committed;

  const positions = useMemo(() => computeLayout(displayTree), [displayTree]);
  const edges = useMemo(() => collectEdges(displayTree), [displayTree]);
  const nodes = useMemo(() => collectNodes(displayTree), [displayTree]);
  const stats = useMemo(() => ({
    count: nodeCount(displayTree),
    height: treeHeight(displayTree),
    valid: heapValid(displayTree),
  }), [displayTree]);

  const atEnd = frames.length === 0 || idx >= frames.length - 1;
  const playing = playingRaw && frames.length > 0 && idx < frames.length - 1;

  const commitPending = useCallback(() => {
    if (pendingRef.current && frames.length > 0) {
      setCommitted(cloneTree(frames[frames.length - 1].tree));
      pendingRef.current = null;
      setPhase('idle');
    }
  }, [frames]);

  const next = useCallback(() => {
    setIdx((i) => {
      if (i >= frames.length - 1) return i;
      const ni = i + 1;
      if (ni === frames.length - 1) commitPending();
      return ni;
    });
  }, [frames.length, commitPending]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(() => { next(); }, STEP_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, next]);

  const parseKey = (raw) => {
    const v = Number.parseInt(raw, 10);
    if (Number.isNaN(v) || v < 0 || v > 99) return null;
    return v;
  };

  const handleInsert = () => {
    const k = parseKey(insVal);
    if (k === null) return;
    if (hasKey(committed, k)) { setPhase('duplicate key'); return; }
    setLastPriority(priorityFor(k));
    const built = buildInsertFrames(committed, k);
    pendingRef.current = 'insert';
    setPhase('insert');
    setFrames(built.frames);
    setIdx(0);
    setPlaying(true);
  };

  const handleDelete = () => {
    const k = parseKey(delVal);
    if (k === null) return;
    const built = buildDeleteFrames(committed, k);
    pendingRef.current = 'delete';
    setPhase('delete');
    setFrames(built.frames);
    setIdx(0);
    setPlaying(true);
  };

  const handleRandom = () => {
    // Deterministic-ish pick from current key, no Math.random.
    const seed = (committed ? nodeCount(committed) * 7 + 13 : 17);
    const k = ((priorityFor(seed) % 95) + 1);
    setInsVal(String(k));
  };

  const handleReset = () => {
    setPlaying(false);
    setFrames([]);
    setIdx(0);
    pendingRef.current = null;
    setPhase('idle');
    setCommitted(buildPreset(PRESET_KEYS));
    setLastPriority(priorityFor(60));
  };

  const rotEdge = currentFrame ? currentFrame.rotEdge : null;
  const highlightSet = currentFrame ? currentFrame.highlight : new Set();
  const rotEdgeKey = rotEdge ? `${rotEdge.a}-${rotEdge.b}` : null;
  const rotEdgeKeyRev = rotEdge ? `${rotEdge.b}-${rotEdge.a}` : null;

  return (
    <div className="trpviz">
      <div className="trpviz-header">
        <div className="trpviz-title">Treap &mdash; BST on keys, max-heap on priorities</div>
        <div className="trpviz-stats">
          <span className="trpviz-stat-label">Heap valid</span>
          <span className={`trpviz-stat-value ${stats.valid ? 'trpviz-ok' : 'trpviz-bad'}`}>
            {stats.valid ? 'yes' : 'no'}
          </span>
        </div>
      </div>

      <div className="trpviz-ops">
        <div className="trpviz-op">
          <span className="trpviz-op-label">Insert key</span>
          <input
            className="trpviz-input"
            type="number"
            min="0"
            max="99"
            value={insVal}
            onChange={(e) => setInsVal(e.target.value)}
            aria-label="Insert key"
          />
          <button type="button" className="trpviz-btn trpviz-btn-primary" onClick={handleInsert} disabled={playing}>
            <Plus size={14} />
            <span>Insert</span>
          </button>
          <button type="button" className="trpviz-btn trpviz-btn-secondary" onClick={handleRandom} disabled={playing} aria-label="Pick a key">
            <Shuffle size={14} />
            <span>Pick</span>
          </button>
        </div>

        <div className="trpviz-op">
          <span className="trpviz-op-label">Delete key</span>
          <input
            className="trpviz-input"
            type="number"
            min="0"
            max="99"
            value={delVal}
            onChange={(e) => setDelVal(e.target.value)}
            aria-label="Delete key"
          />
          <button type="button" className="trpviz-btn trpviz-btn-ghost" onClick={handleDelete} disabled={playing}>
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>

        <button type="button" className="trpviz-btn trpviz-btn-ghost" onClick={handleReset} aria-label="Reset">
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="trpviz-body">
        <div className="trpviz-stage">
          <svg
            className="trpviz-svg"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Treap visualization"
          >
            <g className="trpviz-edges">
              {edges.map((e) => {
                const a = positions[e.from];
                const b = positions[e.to];
                if (!a || !b) return null;
                const active = e.key === rotEdgeKey || e.key === rotEdgeKeyRev;
                return (
                  <line
                    key={e.key}
                    className={`trpviz-edge ${active ? 'trpviz-edge-active' : ''}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                  />
                );
              })}
            </g>

            <g className="trpviz-nodes">
              {nodes.map((n) => {
                const p = positions[n.id];
                if (!p) return null;
                const hi = highlightSet.has(n.id);
                return (
                  <g
                    key={n.id}
                    className={`trpviz-node ${hi ? 'trpviz-node-hi' : ''}`}
                    transform={`translate(${p.x}, ${p.y})`}
                  >
                    {hi && <circle className="trpviz-node-ring" r={NODE_R + 6} />}
                    <circle className="trpviz-node-circle" r={NODE_R} />
                    <text className="trpviz-node-key" textAnchor="middle" dominantBaseline="central">
                      {n.key}
                    </text>
                    <text className="trpviz-prio-tag" x="0" y={NODE_R + 14} textAnchor="middle">
                      p{n.priority}
                    </text>
                  </g>
                );
              })}
              {nodes.length === 0 && (
                <text className="trpviz-empty" x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle">
                  empty treap &mdash; insert a key
                </text>
              )}
            </g>
          </svg>
        </div>

        <aside className="trpviz-sidebar">
          <div className="trpviz-panel">
            <div className="trpviz-panel-label">Phase</div>
            <div className="trpviz-panel-value">{phase}</div>
          </div>
          <div className="trpviz-panel trpviz-panel-grid">
            <div>
              <div className="trpviz-panel-label">Nodes</div>
              <div className="trpviz-panel-value">{stats.count}</div>
            </div>
            <div>
              <div className="trpviz-panel-label">Height</div>
              <div className="trpviz-panel-value">{stats.height}</div>
            </div>
          </div>
          <div className="trpviz-panel">
            <div className="trpviz-panel-label">Last priority</div>
            <div className="trpviz-panel-value">{lastPriority}</div>
          </div>
          <div className="trpviz-panel">
            <div className="trpviz-panel-label">Step</div>
            <div className="trpviz-panel-value">
              {frames.length === 0 ? '—' : `${idx + 1} / ${frames.length}`}
            </div>
          </div>
        </aside>
      </div>

      <p className="trpviz-caption">
        {currentFrame
          ? currentFrame.caption
          : 'Each key gets a seeded random priority. BST order on keys, max-heap order on priorities. Insert or delete to watch the rotations.'}
      </p>

      <div className="trpviz-controls">
        <button
          type="button"
          className="trpviz-btn trpviz-btn-ghost"
          onClick={() => { if (frames.length === 0) return; setPlaying(false); setIdx(0); }}
          disabled={frames.length === 0}
        >
          <RotateCcw size={14} />
          <span>Restart op</span>
        </button>
        <button
          type="button"
          className="trpviz-btn trpviz-btn-primary"
          onClick={() => {
            if (frames.length === 0) return;
            if (atEnd) { setIdx(0); setPlaying(true); return; }
            setPlaying((pl) => !pl);
          }}
          disabled={frames.length === 0}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="trpviz-btn trpviz-btn-ghost"
          onClick={next}
          disabled={frames.length === 0 || atEnd}
        >
          <SkipForward size={14} />
          <span>Step</span>
        </button>
      </div>
    </div>
  );
}
