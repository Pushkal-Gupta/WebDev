import React, { useMemo, useState } from 'react';
import { ChevronRight, RotateCcw, List, Network } from 'lucide-react';
import './IteratorPatternViz.css';

// Iterator pattern: the client loop `while (it.hasNext()) use(it.next())` is
// identical for an array and a tree. Each collection returns its own iterator
// that knows how to walk its internals — the client never sees them.

const ARRAY = [12, 7, 23, 4, 9, 31];

// A small binary tree; in-order iterator yields a sorted-looking sequence.
const TREE = {
  value: 23,
  x: 470, y: 50,
  left: {
    value: 9, x: 320, y: 120,
    left: { value: 4, x: 250, y: 190, left: null, right: null },
    right: { value: 12, x: 390, y: 190, left: null, right: null },
  },
  right: {
    value: 31, x: 620, y: 120,
    left: { value: 27, x: 560, y: 190, left: null, right: null },
    right: { value: 40, x: 690, y: 190, left: null, right: null },
  },
};

// Flatten the tree in-order -> the order its iterator yields nodes.
function inorder(node, out) {
  if (!node) return;
  inorder(node.left, out);
  out.push(node);
  inorder(node.right, out);
}

function collectTreeNodes(node, out) {
  if (!node) return;
  out.push(node);
  collectTreeNodes(node.left, out);
  collectTreeNodes(node.right, out);
}

export default function IteratorPatternViz() {
  const [structure, setStructure] = useState('array'); // 'array' | 'tree'
  const [pos, setPos] = useState(-1); // index into the iteration sequence
  const [note, setNote] = useState('The same client loop drives both. Pick a structure, then step the iterator — only next()/hasNext() are called, never the internals.');

  // The iteration sequence for the active structure (uniform output of next()).
  const sequence = useMemo(() => {
    if (structure === 'array') return ARRAY.map((v, i) => ({ value: v, id: i }));
    const ord = [];
    inorder(TREE, ord);
    return ord;
  }, [structure]);

  const treeNodes = useMemo(() => {
    const out = [];
    collectTreeNodes(TREE, out);
    return out;
  }, []);

  const hasNext = pos < sequence.length - 1;
  const current = pos >= 0 ? sequence[pos] : null;

  const step = () => {
    if (!hasNext) { setNote('hasNext() returned false — traversal complete. Reset to walk again.'); return; }
    const np = pos + 1;
    setPos(np);
    setNote(`hasNext() → true, so next() advances to position ${np}, yielding value ${sequence[np].value}. The client just reads the value.`);
  };

  const pick = (s) => {
    setStructure(s);
    setPos(-1);
    setNote(`switched the underlying collection to a ${s}. The client loop is unchanged — same hasNext()/next() interface.`);
  };

  const reset = () => {
    setPos(-1);
    setNote('reset — iterator back before the first element.');
  };

  // SVG geometry
  const W = 940;
  const H = 260;
  const cellW = 110;
  const cellH = 60;
  const startX = (W - sequence.length * (cellW + 10)) / 2;
  const arrY = 90;

  // tree edges
  const treeEdges = [];
  const pushEdges = (node) => {
    if (!node) return;
    if (node.left) { treeEdges.push([node, node.left]); pushEdges(node.left); }
    if (node.right) { treeEdges.push([node, node.right]); pushEdges(node.right); }
  };
  pushEdges(TREE);

  return (
    <div className="itv">
      <div className="itv-head">
        <h3 className="itv-title">Iterator — one loop over different structures</h3>
        <p className="itv-sub">
          while (it.hasNext()) use(it.next()) runs unchanged over an array and a tree. Each collection
          returns an iterator that walks its own internals; the client never touches them.
        </p>
      </div>

      <div className="itv-controls">
        <div className="itv-buttons">
          <button type="button" className={`itv-btn ${structure === 'array' ? 'is-sel' : ''}`} onClick={() => pick('array')}><List size={14} /> array</button>
          <button type="button" className={`itv-btn ${structure === 'tree' ? 'is-sel' : ''}`} onClick={() => pick('tree')}><Network size={14} /> tree (in-order)</button>
        </div>
        <span className="itv-spacer" aria-hidden="true" />
        <div className="itv-code">while (it.hasNext()) use(it.next())</div>
        <div className="itv-buttons">
          <button type="button" className="itv-btn itv-btn-primary" onClick={step} disabled={!hasNext}><ChevronRight size={14} /> next()</button>
          <button type="button" className="itv-btn" onClick={reset}><RotateCcw size={14} /> reset</button>
        </div>
      </div>

      <div className="itv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="itv-svg" preserveAspectRatio="xMidYMid meet">
          {structure === 'array' ? (
            <>
              <text className="itv-region-sub" x={W / 2} y={arrY - 24}>array — iterator walks indices left to right</text>
              {sequence.map((item, i) => {
                const x = startX + i * (cellW + 10);
                const visited = i < pos;
                const isCur = i === pos;
                return (
                  <g key={`a-${i}`}>
                    <rect
                      className={`itv-cell ${visited ? 'is-visited' : ''} ${isCur ? 'is-current' : ''}`}
                      x={x} y={arrY} width={cellW} height={cellH} rx={9}
                    />
                    <text className="itv-cell-val" x={x + cellW / 2} y={arrY + 30}>{item.value}</text>
                    <text className="itv-cell-idx" x={x + cellW / 2} y={arrY + 48}>idx {i}</text>
                  </g>
                );
              })}
            </>
          ) : (
            <>
              <text className="itv-region-sub" x={W / 2} y={26}>binary tree — iterator yields in-order</text>
              {treeEdges.map(([p, c], i) => (
                <line key={`te-${i}`} className="itv-tree-edge" x1={p.x} y1={p.y} x2={c.x} y2={c.y} />
              ))}
              {treeNodes.map((n) => {
                const seqIndex = sequence.findIndex((s) => s === n);
                const visited = seqIndex < pos && seqIndex >= 0;
                const isCur = seqIndex === pos;
                return (
                  <g key={`tn-${n.value}`}>
                    <circle
                      className={`itv-node ${visited ? 'is-visited' : ''} ${isCur ? 'is-current' : ''}`}
                      cx={n.x} cy={n.y} r={24}
                    />
                    <text className="itv-node-val" x={n.x} y={n.y + 5}>{n.value}</text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      <div className="itv-metrics">
        <div className="itv-metric">
          <span className="itv-metric-label">structure</span>
          <span className="itv-metric-value">{structure}</span>
        </div>
        <div className="itv-metric">
          <span className="itv-metric-label">position</span>
          <span className="itv-metric-value is-pos">{pos < 0 ? 'before first' : `${pos} / ${sequence.length - 1}`}</span>
        </div>
        <div className="itv-metric">
          <span className="itv-metric-label">it.next() value</span>
          <span className="itv-metric-value is-val">{current ? current.value : '—'}</span>
        </div>
        <div className="itv-metric">
          <span className="itv-metric-label">it.hasNext()</span>
          <span className="itv-metric-value is-has">{String(hasNext)}</span>
        </div>
        <div className="itv-metric">
          <span className="itv-metric-label">yielded so far</span>
          <span className="itv-metric-value is-seq">[{sequence.slice(0, pos + 1).map((s) => s.value).join(', ') || '—'}]</span>
        </div>
      </div>

      <div className="itv-narration">
        <span className="itv-narration-label">trace</span>
        <span className="itv-narration-body">{note}</span>
      </div>
    </div>
  );
}
