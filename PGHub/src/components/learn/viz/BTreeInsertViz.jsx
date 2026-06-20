import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, Shuffle } from 'lucide-react';
import './BTreeInsertViz.css';

// Order-3 B-tree: each node holds at most ORDER-1 = 2 keys and at most ORDER = 3 children.
// On overflow (3 keys) the median is promoted to the parent and the node splits in two.
const ORDER = 3;
const MAX_KEYS = ORDER - 1; // 2

let UID = 1;
function makeNode(leaf) {
  return { id: UID++, keys: [], children: [], leaf };
}

function cloneNode(node) {
  if (!node) return null;
  return {
    id: node.id,
    keys: [...node.keys],
    children: node.children.map(cloneNode),
    leaf: node.leaf,
  };
}

function treeHeight(node) {
  if (!node) return 0;
  if (node.leaf) return 1;
  return 1 + Math.max(...node.children.map(treeHeight));
}

// Insert `key` into a B-tree, recording one frame per meaningful step.
// Returns { frames, newTree }. Each frame is a full clone snapshot so playback is pure.
function buildInsertFrames(root, key) {
  const frames = [];
  let tree = cloneNode(root);

  const snap = (extra) => {
    frames.push({
      tree: cloneNode(tree),
      inserting: key,
      activeId: null,
      highlightKey: null,
      splitId: null,
      promoted: null,
      ...extra,
    });
  };

  snap({
    note: `Insert ${key}: B-trees grow from the leaves up. Walk down to the right leaf, drop the key in sorted order, then split upward only if a node overflows.`,
  });

  if (!tree) {
    tree = makeNode(true);
    tree.keys.push(key);
    snap({ activeId: tree.id, highlightKey: key, note: `Tree was empty. ${key} becomes the only key of a new root leaf.` });
    return { frames, newTree: tree };
  }

  // Descend to the target leaf, recording the path. Track parent chain for split promotion.
  const path = []; // array of { node, childIndex }
  let node = tree;
  while (!node.leaf) {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i += 1;
    snap({
      activeId: node.id,
      note: `At internal node [${node.keys.join(', ')}]: ${key} ${
        i < node.keys.length ? `< ${node.keys[i]}` : `> ${node.keys[node.keys.length - 1]}`
      } -> descend into child ${i}.`,
    });
    path.push({ node, childIndex: i });
    node = node.children[i];
  }

  // Insert into the leaf in sorted position.
  let pos = 0;
  while (pos < node.keys.length && key > node.keys[pos]) pos += 1;
  node.keys.splice(pos, 0, key);
  snap({
    activeId: node.id,
    highlightKey: key,
    note: `Reached leaf [${node.keys.filter((k) => k !== key).join(', ') || 'empty'}]. Place ${key} in sorted order -> [${node.keys.join(', ')}].`,
  });

  // Split upward while a node overflows (has more than MAX_KEYS keys).
  let cur = node;
  let level = path.length; // depth of cur
  while (cur.keys.length > MAX_KEYS) {
    const medianIdx = Math.floor(cur.keys.length / 2);
    const medianKey = cur.keys[medianIdx];

    snap({
      activeId: cur.id,
      splitId: cur.id,
      note: `Node [${cur.keys.join(', ')}] holds ${cur.keys.length} keys > max ${MAX_KEYS}. Overflow: median ${medianKey} promotes up, the node divides into two.`,
    });

    const left = makeNode(cur.leaf);
    const right = makeNode(cur.leaf);
    left.keys = cur.keys.slice(0, medianIdx);
    right.keys = cur.keys.slice(medianIdx + 1);
    if (!cur.leaf) {
      left.children = cur.children.slice(0, medianIdx + 1);
      right.children = cur.children.slice(medianIdx + 1);
    }

    if (level === 0) {
      // Splitting the root: grow a new root, height + 1.
      const newRoot = makeNode(false);
      newRoot.keys = [medianKey];
      newRoot.children = [left, right];
      tree = newRoot;
      snap({
        activeId: newRoot.id,
        promoted: medianKey,
        highlightKey: medianKey,
        note: `Root split: ${medianKey} becomes a brand-new root. Tree height grows by one — the only way a B-tree gets taller.`,
      });
      cur = newRoot; // root never overflows here (1 key)
      break;
    }

    // Promote median into the parent, replacing cur with [left, right].
    const parentEntry = path[level - 1];
    const parent = parentEntry.node;
    const ci = parentEntry.childIndex;
    parent.keys.splice(ci, 0, medianKey);
    parent.children.splice(ci, 1, left, right);
    snap({
      activeId: parent.id,
      promoted: medianKey,
      highlightKey: medianKey,
      note: `Promote ${medianKey} into parent -> [${parent.keys.join(', ')}]. Parent now has children [${left.keys.join('|')}] and [${right.keys.join('|')}].`,
    });
    cur = parent;
    level -= 1;
  }

  if (cur.keys.length <= MAX_KEYS) {
    snap({
      activeId: cur.id,
      note: `No more overflow. Tree is balanced again — every leaf sits at the same depth. Insert of ${key} complete.`,
    });
  }

  return { frames, newTree: tree };
}

// Layout: assign x by an in-order-ish leaf sweep, y by depth. Node width scales with key count.
const KEY_W = 30;
const NODE_H = 30;
const LEVEL_GAP = 78;

function layout(root, W) {
  if (!root) return { boxes: [], links: [], height: 0 };
  const boxes = [];
  const links = [];
  let cursor = 0; // running x slot for leaves
  const slotW = KEY_W + 8;

  function widthOf(node) {
    return Math.max(1, node.keys.length) * KEY_W + 12;
  }

  function place(node, depth) {
    if (node.leaf || node.children.length === 0) {
      const w = widthOf(node);
      const x = cursor + w / 2;
      cursor += w + slotW;
      const box = { node, x, y: 0, depth, w };
      boxes.push(box);
      return box;
    }
    const childBoxes = node.children.map((c) => place(c, depth + 1));
    const x = (childBoxes[0].x + childBoxes[childBoxes.length - 1].x) / 2;
    const w = widthOf(node);
    const box = { node, x, y: 0, depth, w };
    boxes.push(box);
    childBoxes.forEach((cb, i) => {
      links.push({ from: box, to: cb, keyIndex: i });
    });
    return box;
  }

  place(root, 0);

  const maxDepth = Math.max(...boxes.map((b) => b.depth));
  const usedW = cursor - slotW;
  const offsetX = Math.max(20, (W - usedW) / 2);
  const topY = 46;
  boxes.forEach((b) => {
    b.x += offsetX;
    b.y = topY + b.depth * LEVEL_GAP;
  });

  return { boxes, links, height: maxDepth + 1 };
}

const SAMPLE = [10, 20, 5, 6, 12, 30, 7, 17];

export default function BTreeInsertViz() {
  const [tree, setTree] = useState(() => null);
  const [queue, setQueue] = useState(() => [...SAMPLE]);
  const [qIndex, setQIndex] = useState(0);
  const [inputVal, setInputVal] = useState('25');
  const [lastAction, setLastAction] = useState('Insert keys one at a time. Overflowing nodes split and push their median up.');
  const [frames, setFrames] = useState(() => [{
    tree: null,
    inserting: null,
    activeId: null,
    highlightKey: null,
    splitId: null,
    promoted: null,
    note: 'B-tree of order 3: each node keeps at most 2 keys and 3 children. Press Insert (or Play) to drop keys in and watch nodes split when they overflow.',
  }]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1000 / speed);

  const W = 940;
  const H = 360;
  const { boxes, links } = useMemo(() => layout(current.tree, W), [current.tree]);

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

  const runInsert = (key, opts = {}) => {
    if (Number.isNaN(key)) return;
    setIsRunningRaw(false);
    const { frames: f, newTree } = buildInsertFrames(tree, key);
    setFrames(f);
    setStep(0);
    setTree(newTree);
    setLastAction(`insert ${key}` + (opts.tail ? ` ${opts.tail}` : ''));
    setIsRunningRaw(true);
  };

  const insertFromInput = () => {
    const v = parseInt(inputVal, 10);
    if (Number.isNaN(v)) return;
    runInsert(v);
  };

  const insertNextSample = () => {
    if (qIndex >= queue.length) return;
    const v = queue[qIndex];
    setQIndex((i) => i + 1);
    runInsert(v, { tail: `(sample ${qIndex + 1}/${queue.length})` });
  };

  const reshuffle = () => {
    const fresh = [...SAMPLE];
    for (let i = fresh.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
    }
    setIsRunningRaw(false);
    setTree(null);
    setQueue(fresh);
    setQIndex(0);
    setStep(0);
    setLastAction(`new sample order: ${fresh.join(', ')}`);
    setFrames([{
      tree: null, inserting: null, activeId: null, highlightKey: null, splitId: null, promoted: null,
      note: `Fresh sample queue [${fresh.join(', ')}]. Press the sample button to insert them one at a time.`,
    }]);
  };

  const reset = () => {
    setIsRunningRaw(false);
    setTree(null);
    setQueue([...SAMPLE]);
    setQIndex(0);
    setStep(0);
    setLastAction('Insert keys one at a time. Overflowing nodes split and push their median up.');
    setFrames([{
      tree: null, inserting: null, activeId: null, highlightKey: null, splitId: null, promoted: null,
      note: 'B-tree of order 3: each node keeps at most 2 keys and 3 children. Press Insert (or Play) to drop keys in and watch nodes split when they overflow.',
    }]);
  };

  const playing = isRunningRaw && step < totalSteps - 1;
  const liveHeight = current.tree ? treeHeight(current.tree) : 0;
  const sampleLeft = queue.length - qIndex;

  return (
    <div className="btv">
      <div className="btv-head">
        <h3 className="btv-title">B-tree insertion (order 3) — split &amp; promote</h3>
        <p className="btv-sub">
          Each node carries up to 2 keys. Insert lands in a leaf; when a node overflows to 3 keys its median
          climbs to the parent and the node splits. Every leaf always ends at the same depth.
        </p>
      </div>

      <div className="btv-controls">
        <div className="btv-actions">
          <div className="btv-opbar">
            <input
              type="number"
              className="btv-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              aria-label="key to insert"
            />
            <button type="button" className="btv-btn btv-btn-primary" onClick={insertFromInput}>
              <Plus size={14} /> Insert
            </button>
            <button type="button" className="btv-btn" onClick={insertNextSample} disabled={sampleLeft <= 0}>
              <ChevronRight size={14} /> Sample{sampleLeft > 0 ? ` (${sampleLeft} left)` : ''}
            </button>
            <button type="button" className="btv-btn" onClick={reshuffle}>
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
          <div className="btv-buttons">
            <button
              type="button"
              className="btv-btn"
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
              className="btv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="btv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="btv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="btv-speed">
            <span className="btv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="btv-speed-range"
            />
            <span className="btv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="btv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="btv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="btv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={12} y={12} width={W - 24} height={H - 24} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {!current.tree && (
            <text x={W / 2} y={H / 2} className="btv-empty" textAnchor="middle">
              empty tree — insert a key to begin
            </text>
          )}

          {links.map((lk, i) => {
            // anchor the link to the gap between keys in the parent box.
            const parentLeft = lk.from.x - lk.from.w / 2;
            const ax = parentLeft + lk.keyIndex * (lk.from.w / lk.from.node.children.length) + (lk.from.w / lk.from.node.children.length) / 2;
            return (
              <line
                key={`lk-${i}`}
                x1={ax} y1={lk.from.y + NODE_H / 2}
                x2={lk.to.x} y2={lk.to.y - NODE_H / 2}
                stroke="var(--border)"
                strokeWidth={1.6}
                opacity={0.8}
              />
            );
          })}

          {boxes.map((b) => {
            const isActive = b.node.id === current.activeId;
            const isSplit = b.node.id === current.splitId;
            const stroke = isSplit ? 'var(--hard)' : isActive ? 'var(--accent)' : 'var(--border)';
            const fillBox = isSplit ? 'rgba(var(--accent-rgb), 0.05)' : 'var(--bg)';
            const left = b.x - b.w / 2;
            return (
              <g key={`box-${b.node.id}`}>
                <rect
                  x={left} y={b.y - NODE_H / 2} width={b.w} height={NODE_H}
                  rx={6}
                  fill={fillBox}
                  stroke={stroke}
                  strokeWidth={isActive || isSplit ? 2.6 : 1.6}
                />
                {b.node.keys.map((k, ki) => {
                  const cx = left + 6 + ki * KEY_W + KEY_W / 2;
                  const isHot = k === current.highlightKey && b.node.id === current.activeId;
                  const isPromoted = k === current.promoted && b.node.id === current.activeId;
                  const keyFill = isPromoted ? 'var(--accent)' : isHot ? 'var(--medium)' : 'transparent';
                  const txtFill = (isPromoted || isHot) ? 'var(--bg)' : 'var(--text-main)';
                  return (
                    <g key={`k-${b.node.id}-${ki}`}>
                      {(isHot || isPromoted) && (
                        <rect
                          x={left + 4 + ki * KEY_W} y={b.y - NODE_H / 2 + 4}
                          width={KEY_W - 4} height={NODE_H - 8} rx={4}
                          fill={keyFill}
                        />
                      )}
                      {ki > 0 && (
                        <line
                          x1={left + 4 + ki * KEY_W} y1={b.y - NODE_H / 2 + 4}
                          x2={left + 4 + ki * KEY_W} y2={b.y + NODE_H / 2 - 4}
                          stroke="var(--border)" strokeWidth={1} opacity={0.7}
                        />
                      )}
                      <text x={cx} y={b.y + 4} className="btv-key" style={{ fill: txtFill }}>{k}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="btv-metrics">
        <div className="btv-metric">
          <span className="btv-metric-label">order</span>
          <span className="btv-metric-value">{ORDER}</span>
        </div>
        <div className="btv-metric">
          <span className="btv-metric-label">max keys / node</span>
          <span className="btv-metric-value">{MAX_KEYS}</span>
        </div>
        <div className="btv-metric">
          <span className="btv-metric-label">height</span>
          <span className="btv-metric-value">{liveHeight}</span>
        </div>
        <div className="btv-metric btv-metric-dim">
          <span className="btv-metric-label">last action</span>
          <span className="btv-metric-value btv-metric-dimval">{lastAction}</span>
        </div>
      </div>

      <div className="btv-arith">
        <span className="btv-arith-label">trace</span>
        <span className="btv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
