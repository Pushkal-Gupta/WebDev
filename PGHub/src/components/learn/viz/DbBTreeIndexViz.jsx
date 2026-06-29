import React, { useMemo, useState } from 'react';
import { Network, Plus, Search, RotateCcw, Gauge } from 'lucide-react';
import './DbBTreeIndexViz.css';

const ORDER = 4;            // max children; a node holds at most ORDER-1 = 3 keys
const SEQ = [10, 20, 5, 30, 40, 50, 25, 35, 15, 45, 60, 70];

function makeLeaf() { return { leaf: true, keys: [] }; }

function insertRec(node, key) {
  if (node.leaf) {
    if (node.keys.includes(key)) return null;
    let i = 0;
    while (i < node.keys.length && node.keys[i] < key) i += 1;
    node.keys.splice(i, 0, key);
    if (node.keys.length > ORDER - 1) {
      const mid = Math.ceil(node.keys.length / 2);
      const right = { leaf: true, keys: node.keys.slice(mid) };
      node.keys = node.keys.slice(0, mid);
      return { key: right.keys[0], node: right };
    }
    return null;
  }
  let i = 0;
  while (i < node.keys.length && key >= node.keys[i]) i += 1;
  const split = insertRec(node.children[i], key);
  if (!split) return null;
  node.keys.splice(i, 0, split.key);
  node.children.splice(i + 1, 0, split.node);
  if (node.keys.length > ORDER - 1) {
    const mid = Math.floor(node.keys.length / 2);
    const upKey = node.keys[mid];
    const right = { leaf: false, keys: node.keys.slice(mid + 1), children: node.children.slice(mid + 1) };
    node.keys = node.keys.slice(0, mid);
    node.children = node.children.slice(0, mid + 1);
    return { key: upKey, node: right };
  }
  return null;
}

function buildTree(count) {
  let root = makeLeaf();
  for (let i = 0; i < count; i += 1) {
    const split = insertRec(root, SEQ[i]);
    if (split) root = { leaf: false, keys: [split.key], children: [root, split.node] };
  }
  return root;
}

function treeDepth(node) {
  return node.leaf ? 1 : 1 + treeDepth(node.children[0]);
}

// Layout: leaves get sequential slots, parents centre over their children.
function layout(root) {
  const nodes = [];
  const depth = treeDepth(root);
  let slot = 0;
  function walk(node, level) {
    let x;
    if (node.leaf) { x = slot; slot += 1; }
    else {
      const childXs = node.children.map((c) => walk(c, level + 1));
      x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    }
    nodes.push({ node, level, slot: x });
    return x;
  }
  walk(root, 0);
  return { nodes, depth, leafCount: slot };
}

// Path of node-refs from root to the leaf that would hold `key`, + comparison count.
function searchPath(root, key) {
  const path = [];
  let comparisons = 0;
  let node = root;
  while (node && !node.leaf) {
    let i = 0;
    while (i < node.keys.length && key >= node.keys[i]) { i += 1; comparisons += 1; }
    if (i < node.keys.length) comparisons += 1;
    path.push(node);
    node = node.children[i];
  }
  if (node) {
    path.push(node);
    for (const k of node.keys) { comparisons += 1; if (k === key) break; }
  }
  const found = node ? node.keys.includes(key) : false;
  return { path, comparisons, found };
}

const W = 760;
const H = 300;

export default function DbBTreeIndexViz() {
  const [count, setCount] = useState(6);
  const [target, setTarget] = useState(null);

  const root = useMemo(() => buildTree(count), [count]);
  const { nodes, depth, leafCount } = useMemo(() => layout(root), [root]);
  const inserted = SEQ.slice(0, count).slice().sort((a, b) => a - b);
  const totalKeys = inserted.length;

  const result = useMemo(() => (target == null ? null : searchPath(root, target)), [root, target]);
  const onPath = useMemo(() => new Set(result ? result.path : []), [result]);

  const padX = 40;
  const usableW = W - padX * 2;
  const colW = leafCount > 0 ? usableW / leafCount : usableW;
  const levelY = (lvl) => 40 + lvl * ((H - 80) / Math.max(1, depth - 1 || 1));
  const nodeX = (slot) => padX + (slot + 0.5) * colW;

  const NODE_H = 30;
  const keyW = 26;

  function reset() { setCount(0); setTarget(null); }

  return (
    <div className="dbbt">
      <div className="dbbt-head">
        <div className="dbbt-head-icon"><Network size={18} /></div>
        <div className="dbbt-head-text">
          <h3 className="dbbt-title">B+ tree index: log-time lookup</h3>
          <p className="dbbt-sub">
            Insert keys to watch full leaves <b>split</b> and push a separator up. Search a key to
            descend root → leaf — a handful of comparisons versus scanning every row.
          </p>
        </div>
        <button type="button" className="dbbt-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="dbbt-chips">
        <span className="dbbt-chip-label">search:</span>
        {inserted.map((k) => (
          <button
            key={k}
            type="button"
            className={`dbbt-chip${target === k ? ' is-active' : ''}`}
            onClick={() => setTarget(k)}
          >
            {k}
          </button>
        ))}
        {inserted.length === 0 && <span className="dbbt-chip-empty">insert keys first</span>}
      </div>

      <div className="dbbt-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dbbt-svg" preserveAspectRatio="xMidYMid meet">
          {/* edges */}
          {nodes.map((n, ni) => {
            if (n.node.leaf) return null;
            return n.node.children.map((c, ci) => {
              const cn = nodes.find((x) => x.node === c);
              if (!cn) return null;
              const lit = onPath.has(n.node) && onPath.has(c);
              return (
                <line
                  key={`e${ni}-${ci}`}
                  x1={nodeX(n.slot)} y1={levelY(n.level) + NODE_H / 2}
                  x2={nodeX(cn.slot)} y2={levelY(cn.level) - NODE_H / 2}
                  className={`dbbt-edge${lit ? ' is-path' : ''}`}
                />
              );
            });
          })}

          {/* leaf chaining */}
          {nodes.filter((n) => n.node.leaf).sort((a, b) => a.slot - b.slot).map((n, i, arr) => {
            if (i === arr.length - 1) return null;
            const next = arr[i + 1];
            const w1 = n.node.keys.length * keyW;
            const w2 = next.node.keys.length * keyW;
            return (
              <line
                key={`chain${i}`}
                x1={nodeX(n.slot) + w1 / 2} y1={levelY(n.level)}
                x2={nodeX(next.slot) - w2 / 2} y2={levelY(next.level)}
                className="dbbt-chain"
              />
            );
          })}

          {/* nodes */}
          {nodes.map((n, ni) => {
            const w = Math.max(keyW, n.node.keys.length * keyW);
            const x = nodeX(n.slot) - w / 2;
            const y = levelY(n.level) - NODE_H / 2;
            const lit = onPath.has(n.node);
            return (
              <g key={`n${ni}`}>
                <rect x={x} y={y} width={w} height={NODE_H} rx={6}
                  className={`dbbt-node${n.node.leaf ? ' is-leaf' : ''}${lit ? ' is-path' : ''}`} />
                {n.node.keys.map((k, ki) => {
                  const hit = result && result.found && n.node.leaf && k === target;
                  return (
                    <text key={ki} x={x + ki * keyW + keyW / 2} y={y + NODE_H / 2 + 4}
                      className={`dbbt-key${hit ? ' is-hit' : ''}`} textAnchor="middle">{k}</text>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dbbt-controls">
        <button type="button" className="dbbt-btn" onClick={() => setCount((c) => Math.min(SEQ.length, c + 1))} disabled={count >= SEQ.length}>
          <Plus size={14} /> Insert {count < SEQ.length ? SEQ[count] : '—'}
        </button>
        <button type="button" className="dbbt-btn" onClick={() => setCount(SEQ.length)} disabled={count >= SEQ.length}>
          <Search size={14} /> Insert all
        </button>
        <span className="dbbt-meta">{totalKeys} keys · depth {depth}</span>
      </div>

      <div className="dbbt-stats">
        <div className="dbbt-statcard dbbt-accent">
          <span className="dbbt-stat-label"><Search size={11} /> index lookup</span>
          <span className="dbbt-stat-val">{result ? `${result.comparisons} comparisons` : '— pick a key'}</span>
        </div>
        <div className="dbbt-statcard dbbt-pink">
          <span className="dbbt-stat-label"><Gauge size={11} /> full table scan</span>
          <span className="dbbt-stat-val">{totalKeys} comparisons</span>
        </div>
        <div className="dbbt-statcard">
          <span className="dbbt-stat-label">result</span>
          <span className="dbbt-stat-val">
            {result ? (result.found ? `key ${target} found` : `${target} not present`) : 'idle'}
          </span>
        </div>
      </div>

      <div className="dbbt-trace">
        <span className="dbbt-trace-body">
          {result
            ? `Descended ${result.path.length} levels: ${result.comparisons} key comparisons against ${totalKeys} for a full scan. As rows grow, the gap becomes O(log n) vs O(n).`
            : 'Leaves stay chained left-to-right (dashed) so a range scan walks them in order. Every leaf sits at the same depth — the tree self-balances on each split.'}
        </span>
      </div>
    </div>
  );
}
