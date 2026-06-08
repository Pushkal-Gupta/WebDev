import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Minus, RotateCcw, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import './AVLTreeViz.css';

const SVG_W = 760;
const SVG_H = 420;
const NODE_R = 24;
const STEP_MS = 900;
const INITIAL_INSERTS = [10, 20, 30, 40, 50, 25];

// --- Pure AVL core (operates on plain node objects) ---------------------

let __idCounter = 1;
const nextId = () => `n${__idCounter++}`;

function makeNode(value) {
  return { id: nextId(), value, height: 1, left: null, right: null };
}

const height = (n) => (n ? n.height : 0);
const balance = (n) => (n ? height(n.left) - height(n.right) : 0);
const recompute = (n) => {
  if (!n) return;
  n.height = 1 + Math.max(height(n.left), height(n.right));
};

function cloneTree(n) {
  if (!n) return null;
  return {
    id: n.id,
    value: n.value,
    height: n.height,
    left: cloneTree(n.left),
    right: cloneTree(n.right),
  };
}

function rotateRight(y) {
  const x = y.left;
  const T2 = x.right;
  x.right = y;
  y.left = T2;
  recompute(y);
  recompute(x);
  return x;
}

function rotateLeft(x) {
  const y = x.right;
  const T2 = y.left;
  y.left = x;
  x.right = T2;
  recompute(x);
  recompute(y);
  return y;
}

// findMin returns the in-order successor for delete.
function findMin(n) {
  let cur = n;
  while (cur.left) cur = cur.left;
  return cur;
}

// --- Frame builders -----------------------------------------------------
// Each frame: { tree, caption, highlight: Set<id>, flash: Set<id>, fading: Set<id>, newId, op, step }

function pushFrame(frames, tree, caption, extras = {}) {
  frames.push({
    tree: cloneTree(tree),
    caption,
    highlight: extras.highlight || [],
    flash: extras.flash || [],
    fading: extras.fading || [],
    newId: extras.newId || null,
  });
}

function insertFrames(root, value) {
  const frames = [];
  let rootRef = cloneTree(root);

  // Walk down recording the path, then build a balancing pass that mutates.
  const path = [];
  let cur = rootRef;
  while (cur) {
    path.push(cur);
    if (value === cur.value) {
      pushFrame(frames, rootRef, `Value ${value} already in tree — no insert.`, {
        highlight: [cur.id],
      });
      return { frames, tree: rootRef };
    }
    cur = value < cur.value ? cur.left : cur.right;
  }

  const newNode = makeNode(value);

  if (path.length === 0) {
    rootRef = newNode;
    pushFrame(frames, rootRef, `Tree empty — ${value} becomes the root.`, {
      newId: newNode.id,
      highlight: [newNode.id],
    });
    return { frames, tree: rootRef };
  }

  // Show search path step-by-step.
  for (let i = 0; i < path.length; i++) {
    const node = path[i];
    const direction =
      value < node.value ? 'less than' : 'greater than';
    const next = value < node.value ? node.left : node.right;
    const target = value < node.value ? 'left' : 'right';
    if (next) {
      pushFrame(
        frames,
        rootRef,
        `Inserting ${value}. At node ${node.value}: ${value} is ${direction} ${node.value}, descend ${target}.`,
        { highlight: path.slice(0, i + 1).map((p) => p.id) },
      );
    } else {
      // Attach the new node here.
      const parent = node;
      if (value < parent.value) parent.left = newNode;
      else parent.right = newNode;
      pushFrame(
        frames,
        rootRef,
        `Attach new node ${value} as ${target} child of ${parent.value}.`,
        {
          newId: newNode.id,
          highlight: [...path.map((p) => p.id), newNode.id],
        },
      );
    }
  }

  // Rebalance pass: walk from new node's parent upward through the path.
  // We need to rebuild each subtree along the path with rebalancing.
  // Easiest: re-run rebalance from root using the path.
  const rebalanced = rebalanceAlongPath(rootRef, path, value, frames);
  return { frames, tree: rebalanced };
}

// Walk from the deepest path node upward, recompute heights and rotate as needed.
// Replace child pointers on parents to preserve the rotated subtree roots.
function rebalanceAlongPath(root, path, insertedValue, frames) {
  // We mutate nodes in place (heights/rotations) but parents are still in path.
  // When a rotation replaces a subtree root, we need to fix the parent's pointer.
  for (let i = path.length - 1; i >= 0; i--) {
    const node = path[i];
    recompute(node);
    const bf = balance(node);

    pushFrame(
      frames,
      root,
      `Update at ${node.value}: height = ${node.height}, balance = ${bf}.`,
      { highlight: [node.id] },
    );

    let newSubRoot = node;

    if (bf > 1 && insertedValue < node.left.value) {
      // LL
      rotationLabel = `Imbalance at ${node.value} (LL) — right rotation.`;
      pushFrame(frames, root, `Imbalance detected at ${node.value} (left-left). Performing right rotation.`, {
        highlight: [node.id, node.left.id, node.left.left.id],
        flash: [node.id, node.left.id, node.left.left.id],
      });
      newSubRoot = rotateRight(node);
    } else if (bf < -1 && insertedValue > node.right.value) {
      // RR
      rotationLabel = `Imbalance at ${node.value} (RR) — left rotation.`;
      pushFrame(frames, root, `Imbalance detected at ${node.value} (right-right). Performing left rotation.`, {
        highlight: [node.id, node.right.id, node.right.right.id],
        flash: [node.id, node.right.id, node.right.right.id],
      });
      newSubRoot = rotateLeft(node);
    } else if (bf > 1 && insertedValue > node.left.value) {
      // LR
      rotationLabel = `Imbalance at ${node.value} (LR) — left-rotate child, then right-rotate self.`;
      pushFrame(frames, root, `Imbalance at ${node.value} (left-right). First, left-rotate child ${node.left.value}.`, {
        highlight: [node.id, node.left.id, node.left.right.id],
        flash: [node.left.id, node.left.right.id],
      });
      node.left = rotateLeft(node.left);
      // Fix parent's left pointer was already pointing at the original node; node's own left changed.
      // We must re-emit a frame *after* the LR child rotation so the parent's pointer (root replacement) is correct.
      // Patch root/parent link before frame:
      patchParent(root, path, i, node);
      pushFrame(frames, root, `Now right-rotate ${node.value} itself.`, {
        highlight: [node.id, node.left.id],
        flash: [node.id, node.left.id],
      });
      newSubRoot = rotateRight(node);
    } else if (bf < -1 && insertedValue < node.right.value) {
      // RL
      rotationLabel = `Imbalance at ${node.value} (RL) — right-rotate child, then left-rotate self.`;
      pushFrame(frames, root, `Imbalance at ${node.value} (right-left). First, right-rotate child ${node.right.value}.`, {
        highlight: [node.id, node.right.id, node.right.left.id],
        flash: [node.right.id, node.right.left.id],
      });
      node.right = rotateRight(node.right);
      patchParent(root, path, i, node);
      pushFrame(frames, root, `Now left-rotate ${node.value} itself.`, {
        highlight: [node.id, node.right.id],
        flash: [node.id, node.right.id],
      });
      newSubRoot = rotateLeft(node);
    }

    if (newSubRoot !== node) {
      if (i === 0) {
        root = newSubRoot;
      } else {
        const parent = path[i - 1];
        if (parent.left && parent.left.id === node.id) parent.left = newSubRoot;
        else if (parent.right && parent.right.id === node.id) parent.right = newSubRoot;
        else {
          if (parent.value > newSubRoot.value) parent.left = newSubRoot;
          else parent.right = newSubRoot;
        }
      }
      path[i] = newSubRoot;
      pushFrame(frames, root, `Subtree at ${newSubRoot.value} rebalanced. New height = ${newSubRoot.height}.`, {
        highlight: [newSubRoot.id],
      });
    }
  }
  return root;
}

function patchParent(root, path, i, node) {
  if (i === 0) return root;
  const parent = path[i - 1];
  if (parent.left && parent.left.id === node.id) parent.left = node;
  else if (parent.right && parent.right.id === node.id) parent.right = node;
  return root;
}

// --- Delete frames ------------------------------------------------------

function deleteFrames(root, value) {
  const frames = [];
  let rootRef = cloneTree(root);
  if (!rootRef) {
    pushFrame(frames, rootRef, `Tree is empty — nothing to delete.`, {});
    return { frames, tree: rootRef };
  }

  // Locate node + path.
  const path = [];
  let cur = rootRef;
  while (cur && cur.value !== value) {
    path.push(cur);
    const direction = value < cur.value ? 'left' : 'right';
    pushFrame(frames, rootRef, `Deleting ${value}. At ${cur.value}: descend ${direction}.`, {
      highlight: path.map((p) => p.id),
    });
    cur = value < cur.value ? cur.left : cur.right;
  }

  if (!cur) {
    pushFrame(frames, rootRef, `Value ${value} not found in the tree.`, {
      highlight: path.map((p) => p.id),
    });
    return { frames, tree: rootRef };
  }

  pushFrame(frames, rootRef, `Found ${value}. Preparing to remove.`, {
    highlight: [...path.map((p) => p.id), cur.id],
    fading: [cur.id],
  });

  // Case A: at most one child.
  let replacement = null;
  if (!cur.left || !cur.right) {
    replacement = cur.left || cur.right;
    if (replacement) {
      pushFrame(
        frames,
        rootRef,
        `${value} has one child (${replacement.value}). Promote child into its place.`,
        { highlight: [cur.id, replacement.id], fading: [cur.id] },
      );
    } else {
      pushFrame(frames, rootRef, `${value} is a leaf — detach.`, {
        highlight: [cur.id],
        fading: [cur.id],
      });
    }
    if (path.length === 0) {
      rootRef = replacement;
    } else {
      const parent = path[path.length - 1];
      if (parent.left && parent.left.id === cur.id) parent.left = replacement;
      else parent.right = replacement;
    }
  } else {
    // Case B: two children — replace value with in-order successor and delete successor.
    const succPath = [cur];
    let succ = cur.right;
    while (succ.left) {
      succPath.push(succ);
      succ = succ.left;
    }
    pushFrame(
      frames,
      rootRef,
      `${value} has two children. In-order successor is ${succ.value}.`,
      { highlight: [cur.id, succ.id] },
    );
    cur.value = succ.value;
    pushFrame(
      frames,
      rootRef,
      `Copy successor value ${succ.value} into the slot held by ${value}.`,
      { highlight: [cur.id] },
    );
    // Now remove succ (which has at most a right child).
    const succParent = succPath[succPath.length - 1];
    if (succParent === cur) succParent.right = succ.right;
    else succParent.left = succ.right;
    pushFrame(
      frames,
      rootRef,
      `Remove the original successor node.`,
      { highlight: [cur.id], fading: [succ.id] },
    );
    // The path for rebalancing is path + cur + succPath descent (excluding succ itself).
    // succPath already starts with cur, so concat path with succPath.
    path.push(...succPath);
  }

  // Rebalance walking up.
  rootRef = rebalanceAfterDelete(rootRef, path, frames);
  return { frames, tree: rootRef };
}

function rebalanceAfterDelete(root, path, frames) {
  for (let i = path.length - 1; i >= 0; i--) {
    const node = path[i];
    // Node may have been replaced earlier in the loop by a rotation; refresh from path slot.
    recompute(node);
    const bf = balance(node);
    pushFrame(frames, root, `Update at ${node.value}: height = ${node.height}, balance = ${bf}.`, {
      highlight: [node.id],
    });

    let newSubRoot = node;
    if (bf > 1 && balance(node.left) >= 0) {
      // LL
      pushFrame(frames, root, `Imbalance at ${node.value} (LL). Right rotation.`, {
        highlight: [node.id, node.left.id],
        flash: [node.id, node.left.id],
      });
      newSubRoot = rotateRight(node);
    } else if (bf > 1 && balance(node.left) < 0) {
      // LR
      pushFrame(frames, root, `Imbalance at ${node.value} (LR). Left-rotate child ${node.left.value}.`, {
        highlight: [node.id, node.left.id, node.left.right.id],
        flash: [node.left.id, node.left.right.id],
      });
      node.left = rotateLeft(node.left);
      patchParent(root, path, i, node);
      pushFrame(frames, root, `Now right-rotate ${node.value}.`, {
        highlight: [node.id, node.left.id],
        flash: [node.id, node.left.id],
      });
      newSubRoot = rotateRight(node);
    } else if (bf < -1 && balance(node.right) <= 0) {
      // RR
      pushFrame(frames, root, `Imbalance at ${node.value} (RR). Left rotation.`, {
        highlight: [node.id, node.right.id],
        flash: [node.id, node.right.id],
      });
      newSubRoot = rotateLeft(node);
    } else if (bf < -1 && balance(node.right) > 0) {
      // RL
      pushFrame(frames, root, `Imbalance at ${node.value} (RL). Right-rotate child ${node.right.value}.`, {
        highlight: [node.id, node.right.id, node.right.left.id],
        flash: [node.right.id, node.right.left.id],
      });
      node.right = rotateRight(node.right);
      patchParent(root, path, i, node);
      pushFrame(frames, root, `Now left-rotate ${node.value}.`, {
        highlight: [node.id, node.right.id],
        flash: [node.id, node.right.id],
      });
      newSubRoot = rotateLeft(node);
    }

    if (newSubRoot !== node) {
      if (i === 0) {
        root = newSubRoot;
      } else {
        const parent = path[i - 1];
        if (parent.left && parent.left.id === node.id) parent.left = newSubRoot;
        else if (parent.right && parent.right.id === node.id) parent.right = newSubRoot;
        else {
          if (parent.value > newSubRoot.value) parent.left = newSubRoot;
          else parent.right = newSubRoot;
        }
      }
      path[i] = newSubRoot;
      pushFrame(frames, root, `Subtree at ${newSubRoot.value} rebalanced. New height = ${newSubRoot.height}.`, {
        highlight: [newSubRoot.id],
      });
    }
  }
  return root;
}

// --- Build the initial pre-loaded tree --------------------------------

function buildInitialTree(values) {
  let root = null;
  for (const v of values) {
    const result = insertFrames(root, v);
    root = result.tree;
  }
  return root;
}

// --- Layout ------------------------------------------------------------

function layoutTree(root) {
  // Assign x by in-order index, y by depth.
  const positions = {};
  let order = 0;
  const depths = {};

  const visit = (node, depth) => {
    if (!node) return;
    visit(node.left, depth + 1);
    positions[node.id] = { order: order++ };
    depths[node.id] = depth;
    visit(node.right, depth + 1);
  };
  visit(root, 0);

  const total = order;
  const maxDepth = Math.max(0, ...Object.values(depths));
  const padX = 50;
  const padY = 50;
  const innerW = SVG_W - padX * 2;
  const innerH = SVG_H - padY * 2;

  const out = {};
  Object.entries(positions).forEach(([id, { order: o }]) => {
    const d = depths[id];
    const x = total > 1 ? padX + (o / (total - 1)) * innerW : SVG_W / 2;
    const y = maxDepth === 0 ? padY : padY + (d / maxDepth) * innerH;
    out[id] = { x, y };
  });
  return out;
}

function collectNodes(root) {
  const list = [];
  const visit = (n) => {
    if (!n) return;
    list.push(n);
    visit(n.left);
    visit(n.right);
  };
  visit(root);
  return list;
}

function collectEdges(root) {
  const edges = [];
  const visit = (n) => {
    if (!n) return;
    if (n.left) {
      edges.push({ from: n.id, to: n.left.id, key: `${n.id}-${n.left.id}` });
      visit(n.left);
    }
    if (n.right) {
      edges.push({ from: n.id, to: n.right.id, key: `${n.id}-${n.right.id}` });
      visit(n.right);
    }
  };
  visit(root);
  return edges;
}

// --- Component ---------------------------------------------------------

export default function AVLTreeViz() {
  const [tree, setTree] = useState(() => buildInitialTree(INITIAL_INSERTS));
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [insertVal, setInsertVal] = useState('15');
  const [deleteVal, setDeleteVal] = useState('30');
  const [opLabel, setOpLabel] = useState('Pre-loaded with [10, 20, 30, 40, 50, 25].');
  const playRef = useRef(null);

  const currentFrame = idx >= 0 && idx < frames.length ? frames[idx] : null;
  const displayTree = currentFrame ? currentFrame.tree : tree;

  const runInsert = useCallback(() => {
    const n = Number(insertVal);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return;
    const result = insertFrames(tree, n);
    setOpLabel(`Insert ${n}`);
    setFrames(result.frames);
    setIdx(0);
    setPlaying(true);
    // Commit final tree when playback ends (handled in effect below).
    // Stash pending tree on a ref via closure:
    pendingTreeRef.current = result.tree;
  }, [insertVal, tree]);

  const runDelete = useCallback(() => {
    const n = Number(deleteVal);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return;
    const result = deleteFrames(tree, n);
    setOpLabel(`Delete ${n}`);
    setFrames(result.frames);
    setIdx(0);
    setPlaying(true);
    pendingTreeRef.current = result.tree;
  }, [deleteVal, tree]);

  const reset = useCallback(() => {
    setPlaying(false);
    const fresh = buildInitialTree(INITIAL_INSERTS);
    setTree(fresh);
    setFrames([]);
    setIdx(-1);
    setOpLabel('Pre-loaded with [10, 20, 30, 40, 50, 25].');
  }, []);

  const pendingTreeRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    if (idx < 0 || idx >= frames.length - 1) {
      if (idx === frames.length - 1 && frames.length > 0 && pendingTreeRef.current) {
        setTree(pendingTreeRef.current);
        pendingTreeRef.current = null;
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
      if (next === frames.length - 1 && pendingTreeRef.current) {
        setTree(pendingTreeRef.current);
        pendingTreeRef.current = null;
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

  const positions = useMemo(() => layoutTree(displayTree), [displayTree]);
  const nodes = useMemo(() => collectNodes(displayTree), [displayTree]);
  const edges = useMemo(() => collectEdges(displayTree), [displayTree]);

  const highlightSet = useMemo(
    () => new Set(currentFrame ? currentFrame.highlight : []),
    [currentFrame],
  );
  const flashSet = useMemo(
    () => new Set(currentFrame ? currentFrame.flash : []),
    [currentFrame],
  );
  const fadingSet = useMemo(
    () => new Set(currentFrame ? currentFrame.fading : []),
    [currentFrame],
  );
  const newId = currentFrame ? currentFrame.newId : null;

  const step = idx + 1;
  const totalSteps = frames.length;
  const caption =
    currentFrame ? currentFrame.caption : 'Press Insert or Delete to begin a step-through.';

  return (
    <div className="avlviz-root">
      <div className="avlviz-head">
        <div>
          <h3 className="avlviz-title">AVL self-balancing BST</h3>
          <p className="avlviz-sub">
            Insert or delete any integer. The tree re-balances via single or
            double rotations whenever a node's balance factor leaves [-1, 1].
          </p>
        </div>
      </div>

      <div className="avlviz-controls">
        <div className="avlviz-control-group">
          <label className="avlviz-input-label">
            Insert
            <input
              type="number"
              value={insertVal}
              onChange={(e) => setInsertVal(e.target.value)}
              className="avlviz-input"
              placeholder="e.g. 15"
            />
          </label>
          <button type="button" className="avlviz-btn avlviz-btn-primary" onClick={runInsert}>
            <Plus size={14} /> Insert
          </button>
        </div>

        <div className="avlviz-control-group">
          <label className="avlviz-input-label">
            Delete
            <input
              type="number"
              value={deleteVal}
              onChange={(e) => setDeleteVal(e.target.value)}
              className="avlviz-input"
              placeholder="e.g. 30"
            />
          </label>
          <button type="button" className="avlviz-btn" onClick={runDelete}>
            <Minus size={14} /> Delete
          </button>
        </div>

        <div className="avlviz-control-divider" />

        <button type="button" className="avlviz-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>

        <div className="avlviz-control-divider" />

        <button
          type="button"
          className="avlviz-btn"
          onClick={stepPrev}
          disabled={frames.length === 0 || idx <= 0}
          aria-label="Previous step"
        >
          <SkipBack size={14} />
        </button>
        <button
          type="button"
          className="avlviz-btn"
          onClick={togglePlay}
          disabled={frames.length === 0}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type="button"
          className="avlviz-btn"
          onClick={stepNext}
          disabled={frames.length === 0 || idx >= frames.length - 1}
          aria-label="Next step"
        >
          <SkipForward size={14} />
        </button>
      </div>

      <div className="avlviz-stage">
        {displayTree ? (
          <svg
            className="avlviz-svg"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            role="img"
            aria-label="AVL tree visualization"
          >
            <g className="avlviz-edges">
              {edges.map((e) => {
                const a = positions[e.from];
                const b = positions[e.to];
                if (!a || !b) return null;
                const active = highlightSet.has(e.from) && highlightSet.has(e.to);
                return (
                  <line
                    key={e.key}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    className={`avlviz-edge ${active ? 'avlviz-edge-active' : ''}`}
                  />
                );
              })}
            </g>

            <g className="avlviz-nodes">
              {nodes.map((n) => {
                const p = positions[n.id];
                if (!p) return null;
                const hl = highlightSet.has(n.id);
                const flash = flashSet.has(n.id);
                const fading = fadingSet.has(n.id);
                const isNew = newId === n.id;
                const bf = balance(n);
                const cls = [
                  'avlviz-node',
                  hl ? 'avlviz-node-highlight' : '',
                  flash ? 'avlviz-node-flash' : '',
                  fading ? 'avlviz-node-fading' : '',
                  isNew ? 'avlviz-node-new' : '',
                  Math.abs(bf) > 1 ? 'avlviz-node-unbalanced' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <g
                    key={n.id}
                    className={cls}
                    style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
                  >
                    {hl && <circle r={NODE_R + 6} className="avlviz-node-ring" />}
                    <circle r={NODE_R} className="avlviz-node-circle" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="avlviz-node-value"
                      y={-2}
                    >
                      {n.value}
                    </text>
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="avlviz-node-meta"
                      y={NODE_R + 14}
                    >
                      h={n.height}, bf={bf}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        ) : (
          <div className="avlviz-empty">Tree is empty. Insert a value to begin.</div>
        )}
      </div>

      <p className="avlviz-caption">{caption}</p>

      <div className="avlviz-footer">
        <div className="avlviz-stat">
          <span className="avlviz-stat-label">Step</span>
          <span className="avlviz-stat-value">
            {totalSteps === 0 ? '0 / 0' : `${step} / ${totalSteps}`}
          </span>
        </div>
        <div className="avlviz-stat avlviz-stat-grow">
          <span className="avlviz-stat-label">Operation</span>
          <span className="avlviz-stat-value">{opLabel}</span>
        </div>
        <div className="avlviz-stat">
          <span className="avlviz-stat-label">Root height</span>
          <span className="avlviz-stat-value">{height(displayTree)}</span>
        </div>
        <div className="avlviz-stat">
          <span className="avlviz-stat-label">Node count</span>
          <span className="avlviz-stat-value">{nodes.length}</span>
        </div>
      </div>
    </div>
  );
}
