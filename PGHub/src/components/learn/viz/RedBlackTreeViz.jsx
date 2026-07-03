import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RotateCcw, Play, Pause, SkipForward, SkipBack, FastForward } from 'lucide-react';
import './RedBlackTreeViz.css';

const SVG_W = 820;
const SVG_H = 460;
const NODE_R = 22;
const NIL_SIZE = 12;
const STEP_MS = 950;
const DEFAULT_SEQUENCE = [10, 20, 30, 15, 25, 5, 1];

// --- Red-Black Tree core ------------------------------------------------
// Uses a singleton NIL sentinel per tree. Every leaf pointer points at NIL.
// Colors: 'R' = red, 'B' = black.

let __idCounter = 1;
const nextId = () => `n${__idCounter++}`;

function makeNIL() {
  return {
    id: 'NIL-' + nextId(),
    value: null,
    color: 'B',
    isNil: true,
    left: null,
    right: null,
    parent: null,
  };
}

function makeNode(value, NIL) {
  const n = {
    id: nextId(),
    value,
    color: 'R',
    isNil: false,
    left: NIL,
    right: NIL,
    parent: NIL,
  };
  return n;
}

function newTree() {
  const NIL = makeNIL();
  return { root: NIL, NIL };
}

// Snapshot a tree for frame storage. We must preserve identities (ids) so
// React keys + position interpolation remain stable across rotations.
function cloneTree(tree) {
  const { root, NIL } = tree;
  const newNIL = {
    id: NIL.id,
    value: null,
    color: 'B',
    isNil: true,
    left: null,
    right: null,
    parent: null,
  };
  const map = new Map();
  const visit = (n) => {
    if (n === NIL) return newNIL;
    if (map.has(n.id)) return map.get(n.id);
    const copy = {
      id: n.id,
      value: n.value,
      color: n.color,
      isNil: false,
      left: newNIL,
      right: newNIL,
      parent: newNIL,
    };
    map.set(n.id, copy);
    copy.left = visit(n.left);
    copy.right = visit(n.right);
    return copy;
  };
  const newRoot = visit(root);
  // Fix parent pointers on the clone.
  const fixParents = (n, p) => {
    if (n === newNIL) return;
    n.parent = p;
    fixParents(n.left, n);
    fixParents(n.right, n);
  };
  fixParents(newRoot, newNIL);
  return { root: newRoot, NIL: newNIL };
}

// --- Frame helpers -----------------------------------------------------

function pushFrame(frames, tree, caption, extras = {}) {
  frames.push({
    tree: cloneTree(tree),
    caption,
    highlight: extras.highlight || [],
    flash: extras.flash || [],
    recolor: extras.recolor || [],
    newId: extras.newId || null,
    rotation: extras.rotation || null,
    rbCase: extras.rbCase || null,
  });
}

// --- Rotations ---------------------------------------------------------

function leftRotate(tree, x) {
  const { NIL } = tree;
  const y = x.right;
  x.right = y.left;
  if (y.left !== NIL) y.left.parent = x;
  y.parent = x.parent;
  if (x.parent === NIL) tree.root = y;
  else if (x === x.parent.left) x.parent.left = y;
  else x.parent.right = y;
  y.left = x;
  x.parent = y;
}

function rightRotate(tree, x) {
  const { NIL } = tree;
  const y = x.left;
  x.left = y.right;
  if (y.right !== NIL) y.right.parent = x;
  y.parent = x.parent;
  if (x.parent === NIL) tree.root = y;
  else if (x === x.parent.right) x.parent.right = y;
  else x.parent.left = y;
  y.right = x;
  x.parent = y;
}

// --- Insert with frame recording --------------------------------------

function insertFrames(srcTree, value) {
  const frames = [];
  const tree = cloneTree(srcTree);
  const { NIL } = tree;

  // BST descent.
  let y = NIL;
  let x = tree.root;
  const path = [];
  while (x !== NIL) {
    y = x;
    path.push(x);
    if (value === x.value) {
      pushFrame(frames, tree, `Value ${value} already in tree. No insert.`, {
        highlight: [x.id],
      });
      return { frames, tree };
    }
    if (path.length > 0) {
      const dir = value < x.value ? 'left' : 'right';
      pushFrame(
        frames,
        tree,
        `Searching for spot. At ${x.value}: ${value} ${value < x.value ? '<' : '>'} ${x.value}, descend ${dir}.`,
        { highlight: path.map((p) => p.id) },
      );
    }
    x = value < x.value ? x.left : x.right;
  }

  const z = makeNode(value, NIL);
  z.parent = y;
  if (y === NIL) {
    tree.root = z;
  } else if (value < y.value) {
    y.left = z;
  } else {
    y.right = z;
  }

  if (y === NIL) {
    // Root insert — RB requires root to be black, fix-up will handle.
    pushFrame(frames, tree, `Tree empty. Place ${value} as a red root.`, {
      newId: z.id,
      highlight: [z.id],
      rbCase: 'insert red leaf',
    });
  } else {
    pushFrame(
      frames,
      tree,
      `Attach ${value} as red ${value < y.value ? 'left' : 'right'} child of ${y.value}.`,
      {
        newId: z.id,
        highlight: [...path.map((p) => p.id), z.id],
        rbCase: 'insert red leaf',
      },
    );
  }

  insertFixupFrames(tree, z, frames);

  // Final safety: root is always black.
  if (tree.root.color === 'R') {
    tree.root.color = 'B';
    pushFrame(frames, tree, `Root must be black. Recolour ${tree.root.value} from red to black.`, {
      highlight: [tree.root.id],
      recolor: [tree.root.id],
      rbCase: 'root -> black',
    });
  }

  pushFrame(frames, tree, `Insert of ${value} complete. All RB invariants restored.`, {
    highlight: [z.id],
    rbCase: 'balanced',
  });

  return { frames, tree };
}

function insertFixupFrames(tree, z, frames) {
  const { NIL } = tree;
  while (z.parent.color === 'R') {
    const parent = z.parent;
    const grand = parent.parent;
    if (parent === grand.left) {
      const uncle = grand.right;
      if (uncle !== NIL && uncle.color === 'R') {
        // Case 1: uncle red — recolour parent + uncle black, grand red, recurse on grand.
        pushFrame(
          frames,
          tree,
          `Case 1 (left): parent ${parent.value} and uncle ${uncle.value} are both red. Recolour both black, grandparent ${grand.value} red.`,
          {
            highlight: [z.id, parent.id, uncle.id, grand.id],
            recolor: [parent.id, uncle.id, grand.id],
            flash: [parent.id, uncle.id, grand.id],
            rbCase: 'uncle red -> recolor',
          },
        );
        parent.color = 'B';
        uncle.color = 'B';
        grand.color = 'R';
        z = grand;
        pushFrame(frames, tree, `Move violation pointer up to ${z.value === null ? 'root' : z.value}.`, {
          highlight: [z.id],
        });
      } else {
        if (z === parent.right) {
          // Case 2: z is right child — left-rotate parent.
          pushFrame(
            frames,
            tree,
            `Case 2 (left): ${z.value} is a right child. Left-rotate parent ${parent.value} to reduce to case 3.`,
            {
              highlight: [z.id, parent.id, grand.id],
              flash: [z.id, parent.id],
              rotation: { type: 'left', pivot: parent.id },
              rbCase: 'triangle -> rotate',
            },
          );
          z = parent;
          leftRotate(tree, z);
          pushFrame(frames, tree, `After left rotation around ${z.value}.`, {
            highlight: [z.id, z.parent.id],
          });
        }
        // Case 3: right-rotate grand, swap colors of parent and grand.
        pushFrame(
          frames,
          tree,
          `Case 3 (left): recolour parent ${z.parent.value} black, grandparent ${z.parent.parent.value} red, then right-rotate grandparent.`,
          {
            highlight: [z.id, z.parent.id, z.parent.parent.id],
            recolor: [z.parent.id, z.parent.parent.id],
            flash: [z.parent.id, z.parent.parent.id],
            rotation: { type: 'right', pivot: z.parent.parent.id },
            rbCase: 'line -> rotate + recolor',
          },
        );
        z.parent.color = 'B';
        z.parent.parent.color = 'R';
        rightRotate(tree, z.parent.parent);
        pushFrame(frames, tree, `Right rotation complete. Local subtree balanced.`, {
          highlight: [z.id, z.parent.id],
        });
      }
    } else {
      const uncle = grand.left;
      if (uncle !== NIL && uncle.color === 'R') {
        pushFrame(
          frames,
          tree,
          `Case 1 (right): parent ${parent.value} and uncle ${uncle.value} are both red. Recolour both black, grandparent ${grand.value} red.`,
          {
            highlight: [z.id, parent.id, uncle.id, grand.id],
            recolor: [parent.id, uncle.id, grand.id],
            flash: [parent.id, uncle.id, grand.id],
            rbCase: 'uncle red -> recolor',
          },
        );
        parent.color = 'B';
        uncle.color = 'B';
        grand.color = 'R';
        z = grand;
        pushFrame(frames, tree, `Move violation pointer up to ${z === tree.root ? 'root' : z.value}.`, {
          highlight: [z.id],
        });
      } else {
        if (z === parent.left) {
          pushFrame(
            frames,
            tree,
            `Case 2 (right): ${z.value} is a left child. Right-rotate parent ${parent.value} to reduce to case 3.`,
            {
              highlight: [z.id, parent.id, grand.id],
              flash: [z.id, parent.id],
              rotation: { type: 'right', pivot: parent.id },
              rbCase: 'triangle -> rotate',
            },
          );
          z = parent;
          rightRotate(tree, z);
          pushFrame(frames, tree, `After right rotation around ${z.value}.`, {
            highlight: [z.id, z.parent.id],
          });
        }
        pushFrame(
          frames,
          tree,
          `Case 3 (right): recolour parent ${z.parent.value} black, grandparent ${z.parent.parent.value} red, then left-rotate grandparent.`,
          {
            highlight: [z.id, z.parent.id, z.parent.parent.id],
            recolor: [z.parent.id, z.parent.parent.id],
            flash: [z.parent.id, z.parent.parent.id],
            rotation: { type: 'left', pivot: z.parent.parent.id },
            rbCase: 'line -> rotate + recolor',
          },
        );
        z.parent.color = 'B';
        z.parent.parent.color = 'R';
        leftRotate(tree, z.parent.parent);
        pushFrame(frames, tree, `Left rotation complete. Local subtree balanced.`, {
          highlight: [z.id, z.parent.id],
        });
      }
    }
    if (z === tree.root) break;
  }
}

// --- Layout ------------------------------------------------------------

function layoutTree(tree, includeNil = true) {
  const { root, NIL } = tree;
  const positions = {};
  if (root === NIL) return positions;

  // First, compute in-order index and depth.
  let order = 0;
  const orderMap = {};
  const depthMap = {};
  const visit = (n, d) => {
    if (n === NIL) return;
    visit(n.left, d + 1);
    orderMap[n.id] = order++;
    depthMap[n.id] = d;
    visit(n.right, d + 1);
  };
  visit(root, 0);

  const realCount = order;
  const maxDepth = Math.max(0, ...Object.values(depthMap));
  const padX = 50;
  const padTop = 50;
  const padBottom = 60;
  const innerW = SVG_W - padX * 2;
  const innerH = SVG_H - padTop - padBottom;

  Object.entries(orderMap).forEach(([id, o]) => {
    const d = depthMap[id];
    const x = realCount > 1 ? padX + (o / (realCount - 1)) * innerW : SVG_W / 2;
    const y = maxDepth === 0 ? padTop + innerH / 2 : padTop + (d / maxDepth) * innerH;
    positions[id] = { x, y };
  });

  // Place NIL nodes immediately below their parent slot, offset slightly.
  if (includeNil) {
    const placeNil = (parent, side, parentPos) => {
      const offsetX = side === 'left' ? -28 : 28;
      const offsetY = 50;
      return { x: parentPos.x + offsetX, y: parentPos.y + offsetY };
    };
    const visitNil = (n) => {
      if (n === NIL) return;
      const p = positions[n.id];
      if (n.left === NIL) {
        const nilId = `${n.id}-NL`;
        positions[nilId] = placeNil(n, 'left', p);
      }
      if (n.right === NIL) {
        const nilId = `${n.id}-NR`;
        positions[nilId] = placeNil(n, 'right', p);
      }
      visitNil(n.left);
      visitNil(n.right);
    };
    visitNil(root);
  }

  return positions;
}

function collectNodes(tree) {
  const { root, NIL } = tree;
  const list = [];
  const visit = (n) => {
    if (n === NIL) return;
    list.push(n);
    visit(n.left);
    visit(n.right);
  };
  visit(root);
  return list;
}

function collectNilLeaves(tree) {
  const { root, NIL } = tree;
  const list = [];
  const visit = (n) => {
    if (n === NIL) return;
    if (n.left === NIL) list.push({ id: `${n.id}-NL`, parentId: n.id, side: 'left' });
    if (n.right === NIL) list.push({ id: `${n.id}-NR`, parentId: n.id, side: 'right' });
    visit(n.left);
    visit(n.right);
  };
  visit(root);
  return list;
}

function collectEdges(tree) {
  const { root, NIL } = tree;
  const edges = [];
  const visit = (n) => {
    if (n === NIL) return;
    if (n.left !== NIL) {
      edges.push({ from: n.id, to: n.left.id, key: `${n.id}-${n.left.id}` });
      visit(n.left);
    } else {
      edges.push({
        from: n.id,
        to: `${n.id}-NL`,
        key: `${n.id}-NL-edge`,
        nil: true,
      });
    }
    if (n.right !== NIL) {
      edges.push({ from: n.id, to: n.right.id, key: `${n.id}-${n.right.id}` });
      visit(n.right);
    } else {
      edges.push({
        from: n.id,
        to: `${n.id}-NR`,
        key: `${n.id}-NR-edge`,
        nil: true,
      });
    }
  };
  visit(root);
  return edges;
}

function blackHeight(tree) {
  const { root, NIL } = tree;
  if (root === NIL) return 0;
  let h = 0;
  let cur = root;
  while (cur !== NIL) {
    if (cur.color === 'B') h++;
    cur = cur.left;
  }
  return h;
}

// --- Component ---------------------------------------------------------

export default function RedBlackTreeViz() {
  const [tree, setTree] = useState(() => newTree());
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [insertVal, setInsertVal] = useState('10');
  const [opLabel, setOpLabel] = useState('Empty tree. Insert a value or run the default sequence.');
  const playRef = useRef(null);
  const pendingTreeRef = useRef(null);

  const delay = Math.round(STEP_MS / speed);

  const currentFrame = idx >= 0 && idx < frames.length ? frames[idx] : null;
  const displayTree = currentFrame ? currentFrame.tree : tree;

  const finalizeFrame = useCallback((nextIdx) => {
    if (nextIdx === frames.length - 1 && pendingTreeRef.current) {
      setTree(pendingTreeRef.current);
      pendingTreeRef.current = null;
    }
  }, [frames.length]);

  const runInsert = useCallback(() => {
    const n = Number(insertVal);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return;
    const result = insertFrames(tree, n);
    setOpLabel(`Insert ${n}`);
    setFrames(result.frames);
    setIdx(0);
    setPlaying(true);
    pendingTreeRef.current = result.tree;
  }, [insertVal, tree]);

  const runSequence = useCallback(() => {
    // Build cumulative frames for the default sequence, starting from current tree.
    let current = tree;
    const allFrames = [];
    let finalTree = current;
    DEFAULT_SEQUENCE.forEach((v) => {
      const r = insertFrames(current, v);
      r.frames.forEach((f) => allFrames.push(f));
      current = r.tree;
      finalTree = r.tree;
    });
    setOpLabel(`Sequence ${DEFAULT_SEQUENCE.join(', ')}`);
    setFrames(allFrames);
    setIdx(0);
    setPlaying(true);
    pendingTreeRef.current = finalTree;
  }, [tree]);

  const reset = useCallback(() => {
    setPlaying(false);
    setTree(newTree());
    setFrames([]);
    setIdx(-1);
    pendingTreeRef.current = null;
    setOpLabel('Empty tree. Insert a value or run the default sequence.');
  }, []);

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
    playRef.current = setTimeout(() => setIdx((i) => i + 1), delay);
    return () => clearTimeout(playRef.current);
  }, [playing, idx, frames, delay]);

  const stepNext = () => {
    if (idx < frames.length - 1) {
      const next = idx + 1;
      setIdx(next);
      finalizeFrame(next);
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

  const positions = useMemo(() => layoutTree(displayTree, true), [displayTree]);
  const nodes = useMemo(() => collectNodes(displayTree), [displayTree]);
  const nilLeaves = useMemo(() => collectNilLeaves(displayTree), [displayTree]);
  const edges = useMemo(() => collectEdges(displayTree), [displayTree]);

  const highlightSet = useMemo(
    () => new Set(currentFrame ? currentFrame.highlight : []),
    [currentFrame],
  );
  const flashSet = useMemo(
    () => new Set(currentFrame ? currentFrame.flash : []),
    [currentFrame],
  );
  const recolorSet = useMemo(
    () => new Set(currentFrame ? currentFrame.recolor : []),
    [currentFrame],
  );
  const newId = currentFrame ? currentFrame.newId : null;

  const step = idx + 1;
  const totalSteps = frames.length;
  const caption =
    currentFrame
      ? currentFrame.caption
      : 'Press Insert or Run sequence to step through Red-Black fix-up.';

  // Carry the most recent case label forward so intermediate frames still show context.
  const rbCase = useMemo(() => {
    if (idx < 0) return '—';
    for (let i = Math.min(idx, frames.length - 1); i >= 0; i -= 1) {
      if (frames[i] && frames[i].rbCase) return frames[i].rbCase;
    }
    return '—';
  }, [idx, frames]);

  const isEmpty = displayTree.root === displayTree.NIL;

  return (
    <div className="rbviz-root">
      <div className="rbviz-head">
        <div>
          <h3 className="rbviz-title">Red-Black tree insertion</h3>
          <p className="rbviz-sub">
            Each insert places a red node, then recolours and rotates upward until the four
            RB invariants hold: root is black, no two reds in a row, every NIL is black, and every
            root-to-NIL path crosses the same number of black nodes.
          </p>
        </div>
      </div>

      <div className="rbviz-controls">
        <div className="rbviz-control-group">
          <label className="rbviz-input-label">
            Value
            <input
              type="number"
              value={insertVal}
              onChange={(e) => setInsertVal(e.target.value)}
              className="rbviz-input"
              placeholder="e.g. 10"
            />
          </label>
          <button type="button" className="rbviz-btn rbviz-btn-primary" onClick={runInsert}>
            <Plus size={14} /> Insert
          </button>
        </div>

        <button type="button" className="rbviz-btn" onClick={runSequence}>
          <FastForward size={14} /> Run sequence
        </button>

        <div className="rbviz-control-divider" />

        <button type="button" className="rbviz-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>

        <div className="rbviz-control-divider" />

        <button
          type="button"
          className="rbviz-btn"
          onClick={stepPrev}
          disabled={frames.length === 0 || idx <= 0}
          aria-label="Previous step"
        >
          <SkipBack size={14} />
        </button>
        <button
          type="button"
          className="rbviz-btn"
          onClick={togglePlay}
          disabled={frames.length === 0}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type="button"
          className="rbviz-btn"
          onClick={stepNext}
          disabled={frames.length === 0 || idx >= frames.length - 1}
          aria-label="Next step"
        >
          <SkipForward size={14} />
        </button>
        <label className="rbviz-speed">
          <span className="rbviz-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rbviz-speed-range"
          />
          <span className="rbviz-speed-value">{speed.toFixed(1)}×</span>
        </label>
      </div>

      <div className="rbviz-stage">
        {isEmpty ? (
          <div className="rbviz-empty">Tree is empty. Insert a value to begin.</div>
        ) : (
          <svg
            className="rbviz-svg"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            role="img"
            aria-label="Red-Black tree visualization"
          >
            <g className="rbviz-edges">
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
                    className={`rbviz-edge ${active ? 'rbviz-edge-active' : ''} ${e.nil ? 'rbviz-edge-nil' : ''}`}
                  />
                );
              })}
            </g>

            <g className="rbviz-nil">
              {nilLeaves.map((leaf) => {
                const p = positions[leaf.id];
                if (!p) return null;
                return (
                  <g
                    key={leaf.id}
                    className="rbviz-nil-node"
                    style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
                  >
                    <rect
                      x={-NIL_SIZE / 2}
                      y={-NIL_SIZE / 2}
                      width={NIL_SIZE}
                      height={NIL_SIZE}
                      className="rbviz-nil-rect"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="rbviz-nil-label"
                      y={NIL_SIZE / 2 + 10}
                    >
                      NIL
                    </text>
                  </g>
                );
              })}
            </g>

            <g className="rbviz-nodes">
              {nodes.map((n) => {
                const p = positions[n.id];
                if (!p) return null;
                const hl = highlightSet.has(n.id);
                const flash = flashSet.has(n.id);
                const recolor = recolorSet.has(n.id);
                const isNew = newId === n.id;
                const cls = [
                  'rbviz-node',
                  hl ? 'rbviz-node-highlight' : '',
                  flash ? 'rbviz-node-flash' : '',
                  recolor ? 'rbviz-node-recolor' : '',
                  isNew ? 'rbviz-node-new' : '',
                  n.color === 'R' ? 'rbviz-node-red' : 'rbviz-node-black',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <g
                    key={n.id}
                    className={cls}
                    style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
                  >
                    {hl && <circle r={NODE_R + 6} className="rbviz-node-ring" />}
                    <circle r={NODE_R} className="rbviz-node-circle" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="rbviz-node-value"
                    >
                      {n.value}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      <p className="rbviz-caption">{caption}</p>

      <div className="rbviz-legend">
        <span className="rbviz-legend-item">
          <span className="rbviz-swatch rbviz-swatch-red" /> Red
        </span>
        <span className="rbviz-legend-item">
          <span className="rbviz-swatch rbviz-swatch-black" /> Black
        </span>
        <span className="rbviz-legend-item">
          <span className="rbviz-swatch rbviz-swatch-nil" /> NIL leaf
        </span>
        <span className="rbviz-legend-item">
          <span className="rbviz-swatch rbviz-swatch-hl" /> Active in step
        </span>
      </div>

      <div className="rbviz-footer">
        <div className="rbviz-stat">
          <span className="rbviz-stat-label">Step</span>
          <span className="rbviz-stat-value">
            {totalSteps === 0 ? '0 / 0' : `${step} / ${totalSteps}`}
          </span>
        </div>
        <div className="rbviz-stat rbviz-stat-grow">
          <span className="rbviz-stat-label">Operation</span>
          <span className="rbviz-stat-value">{opLabel}</span>
        </div>
        <div className="rbviz-stat">
          <span className="rbviz-stat-label">RB case</span>
          <span className="rbviz-stat-value">{rbCase}</span>
        </div>
        <div className="rbviz-stat">
          <span className="rbviz-stat-label">Black height</span>
          <span className="rbviz-stat-value">{blackHeight(displayTree)}</span>
        </div>
        <div className="rbviz-stat">
          <span className="rbviz-stat-label">Node count</span>
          <span className="rbviz-stat-value">{nodes.length}</span>
        </div>
      </div>
    </div>
  );
}

