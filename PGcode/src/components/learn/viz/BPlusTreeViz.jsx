import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, Shuffle } from 'lucide-react';
import './BPlusTreeViz.css';

// Order-4 B+ tree.
// Leaf nodes hold up to ORDER-1 = 3 keys (the actual data) and are chained left->right.
// Internal nodes hold only separator/router keys (up to ORDER-1) and ORDER children.
// On leaf overflow: split, and COPY the first key of the new right leaf up as a separator
// (the key stays in the leaf — that's the B+ distinction from a B-tree, which MOVES it).
const ORDER = 4;
const MAX_KEYS = ORDER - 1; // 3
const SPLIT_AT = Math.ceil(ORDER / 2); // 2 — keys kept in the left leaf after a split

let UID = 1;
function makeNode(leaf) {
  return { id: UID++, keys: [], children: [], leaf, next: null };
}

function cloneTree(node) {
  // Two-pass clone so leaf `next` pointers point at clones, not originals.
  const map = new Map();
  function pass1(n) {
    if (!n) return null;
    const c = { id: n.id, keys: [...n.keys], children: [], leaf: n.leaf, next: null, _src: n };
    map.set(n.id, c);
    if (!n.leaf) c.children = n.children.map(pass1);
    return c;
  }
  const root = pass1(node);
  map.forEach((c) => {
    if (c.leaf && c._src.next) c.next = map.get(c._src.next.id) || null;
    delete c._src;
  });
  return root;
}

function treeHeight(node) {
  if (!node) return 0;
  if (node.leaf) return 1;
  return 1 + Math.max(...node.children.map(treeHeight));
}

function leftmostLeaf(node) {
  let n = node;
  while (n && !n.leaf) n = n.children[0];
  return n;
}

// The linked leaf chain == the sorted data sequence. Walk `next` from the leftmost leaf.
function leafChain(root) {
  const out = [];
  let leaf = leftmostLeaf(root);
  const guard = new Set();
  while (leaf && !guard.has(leaf.id)) {
    guard.add(leaf.id);
    out.push(leaf.keys);
    leaf = leaf.next;
  }
  return out;
}

// Insert `key`, recording one frame per meaningful step. Pure-snapshot playback.
function buildInsertFrames(root, key) {
  const frames = [];
  let tree = cloneTree(root);

  const snap = (extra) => {
    frames.push({
      tree: cloneTree(tree),
      inserting: key,
      activeId: null,
      highlightKey: null,
      splitId: null,
      copiedUp: null,
      relink: null,
      ...extra,
    });
  };

  snap({
    note: `Insert ${key}: in a B+ tree every value lives in a leaf. Walk down through separator keys to the right leaf, drop ${key} in sorted order, then split the leaf only if it overflows.`,
  });

  if (!tree) {
    tree = makeNode(true);
    tree.keys.push(key);
    snap({ activeId: tree.id, highlightKey: key, note: `Tree was empty. ${key} becomes the first value in a new root leaf.` });
    return { frames, newTree: tree };
  }

  // Descend through internal (router) nodes to the target leaf.
  const path = []; // { node, childIndex }
  let node = tree;
  while (!node.leaf) {
    let i = 0;
    while (i < node.keys.length && key >= node.keys[i]) i += 1; // B+ routing: >= goes right
    snap({
      activeId: node.id,
      note: `Router node [${node.keys.join(', ')}] holds separators only — no data. ${key} ${
        i < node.keys.length ? `< ${node.keys[i]}` : `>= ${node.keys[node.keys.length - 1]}`
      } -> follow child ${i}.`,
    });
    path.push({ node, childIndex: i });
    node = node.children[i];
  }

  // Insert into the leaf in sorted position (data lives here).
  let pos = 0;
  while (pos < node.keys.length && key > node.keys[pos]) pos += 1;
  node.keys.splice(pos, 0, key);
  snap({
    activeId: node.id,
    highlightKey: key,
    note: `Reached leaf [${node.keys.filter((k) => k !== key).join(', ') || 'empty'}]. Place ${key} in sorted order -> [${node.keys.join(', ')}].`,
  });

  if (node.keys.length <= MAX_KEYS) {
    snap({ activeId: node.id, note: `Leaf holds ${node.keys.length} <= ${MAX_KEYS} keys. No split needed — insert of ${key} complete.` });
    return { frames, newTree: tree };
  }

  // Leaf overflow: split. Right leaf takes the upper half; its FIRST key is COPIED up.
  let cur = node;
  let level = path.length;
  let separator = null;
  let leftPart = null;
  let rightPart = null;

  {
    snap({ activeId: cur.id, splitId: cur.id, note: `Leaf [${cur.keys.join(', ')}] holds ${cur.keys.length} > max ${MAX_KEYS} keys. Overflow: split the leaf in two.` });

    const left = makeNode(true);
    const right = makeNode(true);
    left.keys = cur.keys.slice(0, SPLIT_AT);
    right.keys = cur.keys.slice(SPLIT_AT);
    separator = right.keys[0]; // COPIED up — stays in the right leaf

    // Relink the leaf chain: left -> right -> (cur's old next).
    right.next = cur.next;
    left.next = right;
    leftPart = left;
    rightPart = right;

    if (level === 0) {
      // Splitting the only leaf -> new root of separators, height becomes 2.
      const newRoot = makeNode(false);
      newRoot.keys = [separator];
      newRoot.children = [left, right];
      tree = newRoot;
      snap({
        activeId: newRoot.id,
        splitId: left.id,
        copiedUp: separator,
        relink: [left.id, right.id],
        highlightKey: separator,
        note: `Left leaf keeps [${left.keys.join(', ')}], right leaf takes [${right.keys.join(', ')}]. COPY ${separator} up as the root separator (it still lives in the right leaf). Relink leaves: [${left.keys.join('|')}] -> [${right.keys.join('|')}].`,
      });
      return { frames, newTree: tree };
    }

    // Splice the two leaves into the parent, copying the separator up.
    const parentEntry = path[level - 1];
    const parent = parentEntry.node;
    const ci = parentEntry.childIndex;
    // fix the predecessor leaf's next pointer (the leaf to the left of cur in the chain)
    if (ci > 0) {
      const prevLeaf = parent.children[ci - 1];
      if (prevLeaf && prevLeaf.leaf) prevLeaf.next = left;
    } else {
      // cur was the parent's first child; find the global predecessor leaf via the chain.
      let p = leftmostLeaf(tree);
      while (p && p.next && p.next.id !== cur.id) p = p.next;
      if (p && p.next && p.next.id === cur.id) p.next = left;
    }
    parent.keys.splice(ci, 0, separator);
    parent.children.splice(ci, 1, left, right);
    snap({
      activeId: parent.id,
      splitId: left.id,
      copiedUp: separator,
      relink: [left.id, right.id],
      highlightKey: separator,
      note: `Left leaf keeps [${left.keys.join(', ')}], right leaf takes [${right.keys.join(', ')}]. COPY ${separator} up into parent -> [${parent.keys.join(', ')}] (key stays in the right leaf). Relink: [${left.keys.join('|')}] -> [${right.keys.join('|')}].`,
    });
    cur = parent;
    level -= 1;
  }

  // Internal-node overflow: split routers. Here the median MOVES up (no copy) — pure B-tree behaviour above the leaves.
  while (cur.keys.length > MAX_KEYS) {
    const medianIdx = Math.floor(cur.keys.length / 2);
    const medianKey = cur.keys[medianIdx];

    snap({ activeId: cur.id, splitId: cur.id, note: `Router node [${cur.keys.join(', ')}] overflowed to ${cur.keys.length} separators. Split: median ${medianKey} MOVES up (routers, unlike leaves, do not keep a copy).` });

    const left = makeNode(false);
    const right = makeNode(false);
    left.keys = cur.keys.slice(0, medianIdx);
    right.keys = cur.keys.slice(medianIdx + 1);
    left.children = cur.children.slice(0, medianIdx + 1);
    right.children = cur.children.slice(medianIdx + 1);

    if (level === 0) {
      const newRoot = makeNode(false);
      newRoot.keys = [medianKey];
      newRoot.children = [left, right];
      tree = newRoot;
      snap({
        activeId: newRoot.id,
        copiedUp: medianKey,
        highlightKey: medianKey,
        note: `Root router split: ${medianKey} moves up to a brand-new root. Tree height grows by one — the only way a B+ tree gets taller.`,
      });
      return { frames, newTree: tree };
    }

    const parentEntry = path[level - 1];
    const parent = parentEntry.node;
    const ci = parentEntry.childIndex;
    parent.keys.splice(ci, 0, medianKey);
    parent.children.splice(ci, 1, left, right);
    snap({
      activeId: parent.id,
      copiedUp: medianKey,
      highlightKey: medianKey,
      note: `Move ${medianKey} up into parent -> [${parent.keys.join(', ')}].`,
    });
    cur = parent;
    level -= 1;
  }

  void leftPart; void rightPart;
  snap({ activeId: cur.id, note: `Balanced again — every leaf sits at the same depth and the leaf chain stays fully sorted. Insert of ${key} complete.` });
  return { frames, newTree: tree };
}

// Layout: leaves swept left-to-right, internal nodes centred over their children, y by depth.
const KEY_W = 30;
const NODE_H = 30;
const LEVEL_GAP = 84;

function layout(root, W) {
  if (!root) return { boxes: [], links: [], leafOrder: [] };
  const boxes = [];
  const links = [];
  const leafOrder = [];
  let cursor = 0;
  const slotW = KEY_W + 12;

  function widthOf(node) {
    return Math.max(1, node.keys.length) * KEY_W + 12;
  }

  function place(node, depth) {
    if (node.leaf || node.children.length === 0) {
      const w = widthOf(node);
      const x = cursor + w / 2;
      cursor += w + slotW;
      const box = { node, x, y: 0, depth, w, leaf: node.leaf };
      boxes.push(box);
      if (node.leaf) leafOrder.push(box);
      return box;
    }
    const childBoxes = node.children.map((c) => place(c, depth + 1));
    const x = (childBoxes[0].x + childBoxes[childBoxes.length - 1].x) / 2;
    const w = widthOf(node);
    const box = { node, x, y: 0, depth, w, leaf: false };
    boxes.push(box);
    childBoxes.forEach((cb, i) => {
      links.push({ from: box, to: cb, keyIndex: i });
    });
    return box;
  }

  place(root, 0);

  const usedW = cursor - slotW;
  const offsetX = Math.max(20, (W - usedW) / 2);
  const topY = 46;
  boxes.forEach((b) => {
    b.x += offsetX;
    b.y = topY + b.depth * LEVEL_GAP;
  });

  // Build leaf-link chain segments following node.next, in display order.
  const byId = new Map(boxes.filter((b) => b.leaf).map((b) => [b.node.id, b]));
  const chain = [];
  let leaf = leftmostLeaf(root);
  const guard = new Set();
  while (leaf && leaf.next && !guard.has(leaf.id)) {
    guard.add(leaf.id);
    const a = byId.get(leaf.id);
    const b = byId.get(leaf.next.id);
    if (a && b) chain.push({ a, b, fromId: leaf.id, toId: leaf.next.id });
    leaf = leaf.next;
  }

  return { boxes, links, leafOrder, chain };
}

const SAMPLE = [10, 20, 5, 6, 12, 30, 7, 17, 3, 25];

export default function BPlusTreeViz() {
  const [tree, setTree] = useState(() => null);
  const [queue, setQueue] = useState(() => [...SAMPLE]);
  const [qIndex, setQIndex] = useState(0);
  const [inputVal, setInputVal] = useState('15');
  const [lastAction, setLastAction] = useState('Insert keys one at a time. Values live in leaves; overflowing leaves split and copy a separator up.');
  const [frames, setFrames] = useState(() => [{
    tree: null,
    inserting: null,
    activeId: null,
    highlightKey: null,
    splitId: null,
    copiedUp: null,
    relink: null,
    note: 'B+ tree of order 4: leaves hold up to 3 values and are chained left-to-right; internal nodes hold only separator keys. Press Insert (or Play) to drop keys in and watch leaves split.',
  }]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1000 / speed);

  const W = 960;
  const H = 360;
  const { boxes, links, chain } = useMemo(() => layout(current.tree, W), [current.tree]);

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
      tree: null, inserting: null, activeId: null, highlightKey: null, splitId: null, copiedUp: null, relink: null,
      note: `Fresh sample queue [${fresh.join(', ')}]. Press the sample button to insert them one at a time.`,
    }]);
  };

  const reset = () => {
    setIsRunningRaw(false);
    setTree(null);
    setQueue([...SAMPLE]);
    setQIndex(0);
    setStep(0);
    setLastAction('Insert keys one at a time. Values live in leaves; overflowing leaves split and copy a separator up.');
    setFrames([{
      tree: null, inserting: null, activeId: null, highlightKey: null, splitId: null, copiedUp: null, relink: null,
      note: 'B+ tree of order 4: leaves hold up to 3 values and are chained left-to-right; internal nodes hold only separator keys. Press Insert (or Play) to drop keys in and watch leaves split.',
    }]);
  };

  const playing = isRunningRaw && step < totalSteps - 1;
  const liveHeight = current.tree ? treeHeight(current.tree) : 0;
  const sampleLeft = queue.length - qIndex;
  const chainKeys = current.tree ? leafChain(current.tree).map((g) => `[${g.join(', ')}]`).join(' -> ') : '(empty)';
  const sortedSeq = current.tree ? leafChain(current.tree).flat().join(', ') : '(empty)';

  return (
    <div className="bpv">
      <div className="bpv-head">
        <h3 className="bpv-title">B+ tree insertion (order 4) — all data in chained leaves</h3>
        <p className="bpv-sub">
          Every value lives in a leaf; internal nodes carry only separators that route the search. When a
          leaf overflows to 4 keys it splits, the first key of the new right leaf is copied up as a separator,
          and the leaf-link chain (dashed) is re-stitched so a left-to-right walk still yields sorted data.
        </p>
      </div>

      <div className="bpv-controls">
        <div className="bpv-actions">
          <div className="bpv-opbar">
            <input
              type="number"
              className="bpv-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              aria-label="key to insert"
            />
            <button type="button" className="bpv-btn bpv-btn-primary" onClick={insertFromInput}>
              <Plus size={14} /> Insert
            </button>
            <button type="button" className="bpv-btn" onClick={insertNextSample} disabled={sampleLeft <= 0}>
              <ChevronRight size={14} /> Sample{sampleLeft > 0 ? ` (${sampleLeft} left)` : ''}
            </button>
            <button type="button" className="bpv-btn" onClick={reshuffle}>
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
          <div className="bpv-buttons">
            <button
              type="button"
              className="bpv-btn"
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
              className="bpv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="bpv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="bpv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="bpv-speed">
            <span className="bpv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bpv-speed-range"
            />
            <span className="bpv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="bpv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="bpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bpv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="bpv-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--hue-mint)" />
            </marker>
          </defs>
          <rect x={12} y={12} width={W - 24} height={H - 24} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {!current.tree && (
            <text x={W / 2} y={H / 2} className="bpv-empty" textAnchor="middle">
              empty tree — insert a key to begin
            </text>
          )}

          {links.map((lk, i) => {
            const parentLeft = lk.from.x - lk.from.w / 2;
            const slots = lk.from.node.children.length;
            const ax = parentLeft + (lk.keyIndex + 0.5) * (lk.from.w / slots);
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

          {chain.map((seg, i) => {
            const isHot = current.relink && current.relink.includes(seg.fromId) && current.relink.includes(seg.toId);
            const y = seg.a.y;
            const x1 = seg.a.x + seg.a.w / 2;
            const x2 = seg.b.x - seg.b.w / 2;
            const yOff = y + NODE_H / 2 - 6;
            return (
              <line
                key={`chain-${i}`}
                x1={x1} y1={yOff}
                x2={x2} y2={yOff}
                stroke="var(--hue-mint)"
                strokeWidth={isHot ? 2.6 : 1.6}
                strokeDasharray="5 3"
                opacity={isHot ? 1 : 0.75}
                markerEnd="url(#bpv-arrow)"
              />
            );
          })}

          {boxes.map((b) => {
            const isActive = b.node.id === current.activeId;
            const isSplit = b.node.id === current.splitId;
            const stroke = isSplit ? 'var(--hard)' : isActive ? 'var(--accent)' : (b.leaf ? 'var(--hue-mint)' : 'var(--border)');
            const fillBox = b.leaf ? 'rgba(var(--accent-rgb), 0.04)' : 'var(--bg)';
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
                  const isCopied = k === current.copiedUp && b.node.id === current.activeId;
                  const keyFill = isCopied ? 'var(--accent)' : isHot ? 'var(--medium)' : 'transparent';
                  const txtFill = (isCopied || isHot) ? 'var(--bg)' : 'var(--text-main)';
                  return (
                    <g key={`k-${b.node.id}-${ki}`}>
                      {(isHot || isCopied) && (
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
                      <text x={cx} y={b.y + 4} className="bpv-key" style={{ fill: txtFill }}>{k}</text>
                    </g>
                  );
                })}
                {b.leaf && (
                  <text x={b.x} y={b.y - NODE_H / 2 - 4} className="bpv-tag" textAnchor="middle">leaf</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="bpv-metrics">
        <div className="bpv-metric">
          <span className="bpv-metric-label">order</span>
          <span className="bpv-metric-value">{ORDER}</span>
        </div>
        <div className="bpv-metric">
          <span className="bpv-metric-label">max keys / leaf</span>
          <span className="bpv-metric-value">{MAX_KEYS}</span>
        </div>
        <div className="bpv-metric">
          <span className="bpv-metric-label">height</span>
          <span className="bpv-metric-value">{liveHeight}</span>
        </div>
        <div className="bpv-metric bpv-metric-dim">
          <span className="bpv-metric-label">last action</span>
          <span className="bpv-metric-value bpv-metric-dimval">{lastAction}</span>
        </div>
      </div>

      <div className="bpv-chain">
        <span className="bpv-chain-label">leaf chain (sorted data)</span>
        <span className="bpv-chain-vals">{chainKeys}</span>
        <span className="bpv-chain-seq">range scan: {sortedSeq}</span>
      </div>

      <div className="bpv-arith">
        <span className="bpv-arith-label">trace</span>
        <span className="bpv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
