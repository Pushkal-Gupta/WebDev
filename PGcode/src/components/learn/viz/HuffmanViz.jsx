import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Wand2 } from 'lucide-react';
import './HuffmanViz.css';

const DEFAULT_INPUT = 'ABRACADABRA';
const SVG_W = 960;
const SVG_H = 540;
const NODE_R = 22;
const STEP_MS = 1100;
const TREE_TOP = 36;
const TREE_BOTTOM = 290;
const QUEUE_Y = 430;
const QUEUE_TOP_PAD = 380;
const NODE_GAP = 70;

let UID = 0;
const nextId = () => `n${++UID}`;

function countFreqs(input) {
  const map = new Map();
  for (const ch of input) {
    if (!ch) continue;
    map.set(ch, (map.get(ch) || 0) + 1);
  }
  return [...map.entries()]
    .map(([char, freq]) => ({ char, freq }))
    .sort((a, b) => a.freq - b.freq || a.char.localeCompare(b.char));
}

function buildLeafNodes(freqs) {
  return freqs.map(({ char, freq }) => ({
    id: nextId(),
    char,
    freq,
    leftId: null,
    rightId: null,
    isLeaf: true,
  }));
}

function sortQueue(queue) {
  return [...queue].sort((a, b) => a.freq - b.freq || a.id.localeCompare(b.id));
}

function buildFrames(inputStr) {
  UID = 0;
  const frames = [];
  const freqs = countFreqs(inputStr);
  if (freqs.length === 0) return { frames: [], nodes: {}, rootId: null, codes: {} };

  const nodes = {};
  let queue = buildLeafNodes(freqs);
  for (const n of queue) nodes[n.id] = n;
  queue = sortQueue(queue);

  // initial frame
  frames.push({
    queue: queue.map((n) => n.id),
    pickedIds: [],
    parentId: null,
    action: 'init',
    label: `Build initial priority queue from ${freqs.length} unique character${freqs.length === 1 ? '' : 's'}`,
  });

  // Edge case: single unique character
  if (queue.length === 1) {
    frames.push({
      queue: queue.map((n) => n.id),
      pickedIds: [],
      parentId: queue[0].id,
      action: 'done',
      label: `Only one character — tree is a single leaf`,
    });
    return { frames, nodes, rootId: queue[0].id, codes: { [queue[0].char]: '0' } };
  }

  while (queue.length > 1) {
    const a = queue[0];
    const b = queue[1];

    // pop frame
    frames.push({
      queue: queue.map((n) => n.id),
      pickedIds: [a.id, b.id],
      parentId: null,
      action: 'pop',
      label: `Pop the two smallest: ${describeNode(a)} and ${describeNode(b)}`,
    });

    // create parent
    const parent = {
      id: nextId(),
      char: null,
      freq: a.freq + b.freq,
      leftId: a.id,
      rightId: b.id,
      isLeaf: false,
    };
    nodes[parent.id] = parent;

    const rest = queue.slice(2);
    const merged = sortQueue([...rest, parent]);

    // merge frame (parent created, children leaving queue)
    frames.push({
      queue: rest.map((n) => n.id),
      pickedIds: [a.id, b.id],
      parentId: parent.id,
      action: 'merge',
      label: `Combine into new node with freq ${a.freq} + ${b.freq} = ${parent.freq}`,
    });

    // push frame (parent inserted back into queue)
    frames.push({
      queue: merged.map((n) => n.id),
      pickedIds: [],
      parentId: parent.id,
      action: 'push',
      label: `Push parent (freq ${parent.freq}) back into the priority queue`,
    });

    queue = merged;
  }

  const rootId = queue[0].id;

  // final tree frame
  frames.push({
    queue: [rootId],
    pickedIds: [],
    parentId: rootId,
    action: 'tree-done',
    label: `Tree complete — root holds total weight ${nodes[rootId].freq}`,
  });

  // assign codes by walking the tree
  const codes = {};
  (function walk(id, prefix) {
    const n = nodes[id];
    if (!n) return;
    if (n.isLeaf) {
      codes[n.char] = prefix || '0';
      return;
    }
    walk(n.leftId, prefix + '0');
    walk(n.rightId, prefix + '1');
  })(rootId, '');

  frames.push({
    queue: [rootId],
    pickedIds: [],
    parentId: rootId,
    action: 'codes',
    label: 'Read each codeword by walking root → leaf: 0 left, 1 right',
  });

  return { frames, nodes, rootId, codes };
}

function describeNode(n) {
  if (n.isLeaf) return `'${n.char}' (${n.freq})`;
  return `node[${n.freq}]`;
}

// Layout: walk subtree under given root, assign x by in-order index, y by depth.
function layoutTree(nodes, rootId) {
  if (!rootId || !nodes[rootId]) return {};
  const positions = {};
  let nextX = 0;
  let maxDepth = 0;
  const order = [];

  (function dfs(id, depth) {
    const n = nodes[id];
    if (!n) return;
    if (depth > maxDepth) maxDepth = depth;
    if (n.leftId) dfs(n.leftId, depth + 1);
    positions[id] = { _xi: nextX++, _depth: depth };
    order.push(id);
    if (n.rightId) dfs(n.rightId, depth + 1);
  })(rootId, 0);

  const total = nextX;
  if (total === 0) return {};
  const xLeft = 60;
  const xRight = SVG_W - 60;
  const xSpan = xRight - xLeft;
  const yTop = TREE_TOP + 6;
  const yBot = TREE_BOTTOM - 10;
  const ySpan = yBot - yTop;
  const stepY = maxDepth === 0 ? 0 : ySpan / maxDepth;

  for (const id of order) {
    const p = positions[id];
    const x = total === 1 ? (xLeft + xRight) / 2 : xLeft + (p._xi / (total - 1)) * xSpan;
    const y = yTop + p._depth * stepY;
    positions[id] = { x, y };
  }
  return positions;
}

// Layout positions for nodes in the priority queue (along bottom).
function layoutQueue(queueIds) {
  const positions = {};
  const n = queueIds.length;
  if (n === 0) return positions;
  const totalW = n * NODE_GAP;
  const startX = Math.max(40, (SVG_W - totalW) / 2 + NODE_GAP / 2);
  queueIds.forEach((id, i) => {
    positions[id] = { x: startX + i * NODE_GAP, y: QUEUE_Y };
  });
  return positions;
}

export default function HuffmanViz() {
  const [inputStr, setInputStr] = useState(DEFAULT_INPUT);
  const [committed, setCommitted] = useState(DEFAULT_INPUT);
  const [{ frames, nodes, rootId, codes }, setData] = useState(() => buildFrames(DEFAULT_INPUT));
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(null);

  const currentFrame = frames[idx] || frames[frames.length - 1] || null;

  const rebuild = useCallback((str) => {
    const cleaned = (str || '').replace(/\s+/g, '').toUpperCase();
    const data = buildFrames(cleaned || DEFAULT_INPUT);
    setData(data);
    setCommitted(cleaned || DEFAULT_INPUT);
    setIdx(0);
    setPlaying(false);
  }, []);

  const apply = useCallback(() => {
    rebuild(inputStr);
  }, [inputStr, rebuild]);

  const reset = useCallback(() => {
    setInputStr(DEFAULT_INPUT);
    rebuild(DEFAULT_INPUT);
  }, [rebuild]);

  useEffect(() => {
    if (!playing) return;
    if (idx >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    playRef.current = setTimeout(() => setIdx((i) => i + 1), STEP_MS);
    return () => clearTimeout(playRef.current);
  }, [playing, idx, frames]);

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
      return;
    }
    setPlaying((p) => !p);
  };

  // Determine which tree nodes to render at current frame:
  //   - any node that has been the "parentId" so far (i.e., already created)
  //   - their subtrees
  const visibleTreeIds = useMemo(() => {
    if (!currentFrame) return new Set();
    const visible = new Set();
    for (let i = 0; i <= idx; i++) {
      const f = frames[i];
      if (!f) continue;
      if (f.parentId) visible.add(f.parentId);
    }
    // Expand to include descendants
    const expanded = new Set();
    const addSubtree = (id) => {
      if (!id || expanded.has(id)) return;
      expanded.add(id);
      const n = nodes[id];
      if (!n) return;
      addSubtree(n.leftId);
      addSubtree(n.rightId);
    };
    for (const id of visible) addSubtree(id);
    return expanded;
  }, [currentFrame, frames, idx, nodes]);

  // Find disjoint subtree roots in visible set (root if its parent is not visible)
  const subtreeRoots = useMemo(() => {
    const childToParent = new Map();
    for (const id of visibleTreeIds) {
      const n = nodes[id];
      if (!n) continue;
      if (n.leftId) childToParent.set(n.leftId, id);
      if (n.rightId) childToParent.set(n.rightId, id);
    }
    const roots = [];
    for (const id of visibleTreeIds) {
      const p = childToParent.get(id);
      if (!p || !visibleTreeIds.has(p)) roots.push(id);
    }
    return roots;
  }, [visibleTreeIds, nodes]);

  // Layout: each subtree gets a slot at the top.
  const treePositions = useMemo(() => {
    if (subtreeRoots.length === 0) return {};
    if (subtreeRoots.length === 1) {
      return layoutTree(nodes, subtreeRoots[0]);
    }
    // multiple disjoint subtrees: lay them side by side
    const positions = {};
    const slotW = SVG_W / subtreeRoots.length;
    subtreeRoots.forEach((rid, si) => {
      const sub = layoutTreeIsolated(nodes, rid);
      const xs = Object.values(sub).map((p) => p.x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const w = maxX - minX || 1;
      const slotCenter = slotW * si + slotW / 2;
      const scale = Math.min(1, (slotW - 60) / w);
      for (const [id, p] of Object.entries(sub)) {
        const dx = (p.x - (minX + maxX) / 2) * scale;
        positions[id] = { x: slotCenter + dx, y: p.y };
      }
    });
    return positions;
  }, [subtreeRoots, nodes]);

  // For queue, exclude any nodes whose subtrees are already shown in tree
  const queueLayout = useMemo(() => {
    if (!currentFrame) return {};
    const ids = currentFrame.queue.filter((id) => !visibleTreeIds.has(id));
    return layoutQueue(ids);
  }, [currentFrame, visibleTreeIds]);

  // also need positions for picked nodes that are leaving the queue
  const allNodePositions = useMemo(() => {
    if (!currentFrame) return {};
    const combined = { ...queueLayout, ...treePositions };
    // For picked nodes (during 'pop' action), they should still be at queue position
    // For merge action, picked nodes fly up to their tree positions (which they have if children are in tree)
    return combined;
  }, [currentFrame, queueLayout, treePositions]);

  const freqsList = useMemo(() => countFreqs(committed), [committed]);
  const inputLen = committed.length;

  const totalSteps = frames.length;
  const stepNum = idx + 1;

  // edges to render (parent -> child) for visible tree
  const treeEdges = useMemo(() => {
    const out = [];
    for (const id of visibleTreeIds) {
      const n = nodes[id];
      if (!n) continue;
      const a = treePositions[id];
      if (!a) continue;
      if (n.leftId && visibleTreeIds.has(n.leftId) && treePositions[n.leftId]) {
        out.push({ from: id, to: n.leftId, label: '0', a, b: treePositions[n.leftId] });
      }
      if (n.rightId && visibleTreeIds.has(n.rightId) && treePositions[n.rightId]) {
        out.push({ from: id, to: n.rightId, label: '1', a, b: treePositions[n.rightId] });
      }
    }
    return out;
  }, [visibleTreeIds, nodes, treePositions]);

  // For "merge" action: render ghost edges from picked queue positions up to parent target
  const mergeArrows = useMemo(() => {
    if (!currentFrame || currentFrame.action !== 'merge') return [];
    const parentPos = treePositions[currentFrame.parentId];
    if (!parentPos) return [];
    return currentFrame.pickedIds
      .map((pid) => {
        const childPos = treePositions[pid];
        if (!childPos) return null;
        return { from: { x: childPos.x, y: QUEUE_Y }, to: childPos, parent: parentPos };
      })
      .filter(Boolean);
  }, [currentFrame, treePositions]);

  const allCharCodes = useMemo(() => {
    if (!codes) return [];
    return Object.entries(codes)
      .map(([ch, code]) => ({ ch, code, freq: freqsList.find((f) => f.char === ch)?.freq ?? 0 }))
      .sort((a, b) => b.freq - a.freq || a.ch.localeCompare(b.ch));
  }, [codes, freqsList]);

  const showCodes = currentFrame && currentFrame.action === 'codes';

  const fixedBits = inputLen > 0 ? Math.max(1, Math.ceil(Math.log2(Math.max(2, freqsList.length)))) : 0;
  const fixedTotal = fixedBits * inputLen;
  const huffmanTotal = useMemo(() => {
    if (!codes) return 0;
    return freqsList.reduce((acc, f) => acc + (codes[f.char]?.length || 0) * f.freq, 0);
  }, [codes, freqsList]);

  return (
    <div className="hfv-root">
      <div className="hfv-head">
        <div className="hfv-title-block">
          <h3 className="hfv-title">Huffman coding — build the prefix tree</h3>
          <p className="hfv-sub">
            Count character frequencies, repeatedly merge the two lowest-frequency nodes, and read each codeword off the
            finished tree.
          </p>
        </div>
      </div>

      <div className="hfv-controls">
        <label className="hfv-input-label">
          Input
          <input
            type="text"
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            className="hfv-input"
            placeholder="ABRACADABRA"
            maxLength={32}
          />
        </label>
        <button type="button" className="hfv-btn hfv-btn-primary" onClick={apply}>
          <Wand2 size={14} /> Build
        </button>
        <button type="button" className="hfv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
        <div className="hfv-control-divider" />
        <button
          type="button"
          className="hfv-btn"
          onClick={stepPrev}
          disabled={idx <= 0}
          aria-label="Previous step"
        >
          <SkipBack size={14} />
        </button>
        <button
          type="button"
          className="hfv-btn"
          onClick={togglePlay}
          disabled={frames.length === 0}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          <span className="hfv-btn-text">{playing ? 'Pause' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="hfv-btn"
          onClick={stepNext}
          disabled={idx >= frames.length - 1}
          aria-label="Next step"
        >
          <SkipForward size={14} />
        </button>
      </div>

      <div className="hfv-stage">
        <svg
          className="hfv-svg"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          role="img"
          aria-label="Huffman coding tree construction"
        >
          <defs>
            <marker
              id="hfv-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="hfv-arrow-head" />
            </marker>
          </defs>

          {/* zone labels */}
          <text x={20} y={22} className="hfv-zone-label">
            TREE
          </text>
          <text x={20} y={QUEUE_TOP_PAD - 12} className="hfv-zone-label">
            PRIORITY QUEUE (min-heap by frequency)
          </text>
          <line
            x1={12}
            y1={QUEUE_TOP_PAD}
            x2={SVG_W - 12}
            y2={QUEUE_TOP_PAD}
            className="hfv-zone-divider"
          />

          {/* tree edges */}
          {treeEdges.map((e, ei) => {
            const midX = (e.a.x + e.b.x) / 2;
            const midY = (e.a.y + e.b.y) / 2;
            return (
              <g key={`edge-${ei}`} className="hfv-edge-group">
                <line
                  x1={e.a.x}
                  y1={e.a.y + NODE_R - 4}
                  x2={e.b.x}
                  y2={e.b.y - NODE_R + 4}
                  className="hfv-tree-edge"
                />
                <rect
                  x={midX - 9}
                  y={midY - 9}
                  width={18}
                  height={18}
                  rx={4}
                  className="hfv-edge-bit-bg"
                />
                <text x={midX} y={midY + 4} textAnchor="middle" className="hfv-edge-bit">
                  {e.label}
                </text>
              </g>
            );
          })}

          {/* merge animation arrows during merge frame */}
          {mergeArrows.map((m, mi) => (
            <line
              key={`merge-${mi}`}
              x1={m.from.x}
              y1={m.from.y}
              x2={m.to.x}
              y2={m.to.y + NODE_R + 4}
              className="hfv-merge-arrow"
              markerEnd="url(#hfv-arrow)"
            />
          ))}

          {/* tree nodes */}
          {[...visibleTreeIds].map((id) => {
            const n = nodes[id];
            const p = treePositions[id];
            if (!n || !p) return null;
            const isJustCreated =
              currentFrame &&
              (currentFrame.action === 'merge' || currentFrame.action === 'push') &&
              currentFrame.parentId === id;
            const isPicked = currentFrame && currentFrame.pickedIds.includes(id);
            const cls = [
              'hfv-node',
              n.isLeaf ? 'hfv-node-leaf' : 'hfv-node-internal',
              isJustCreated ? 'hfv-node-pop' : '',
              isPicked ? 'hfv-node-picked' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g key={id} className={cls} transform={`translate(${p.x}, ${p.y})`}>
                <circle r={NODE_R} />
                {n.isLeaf ? (
                  <>
                    <text y={-2} textAnchor="middle" className="hfv-node-char">
                      {n.char}
                    </text>
                    <text y={12} textAnchor="middle" className="hfv-node-freq-leaf">
                      {n.freq}
                    </text>
                  </>
                ) : (
                  <text y={5} textAnchor="middle" className="hfv-node-freq">
                    {n.freq}
                  </text>
                )}
              </g>
            );
          })}

          {/* priority queue nodes (those not already in tree) */}
          {Object.entries(queueLayout).map(([id, pos]) => {
            const n = nodes[id];
            if (!n) return null;
            const isPicked = currentFrame && currentFrame.pickedIds.includes(id);
            const cls = [
              'hfv-node',
              'hfv-node-queue',
              n.isLeaf ? 'hfv-node-leaf' : 'hfv-node-internal',
              isPicked ? 'hfv-node-picked' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g key={`q-${id}`} className={cls} transform={`translate(${pos.x}, ${pos.y})`}>
                {isPicked && <circle r={NODE_R + 6} className="hfv-pick-ring" />}
                <circle r={NODE_R} />
                {n.isLeaf ? (
                  <>
                    <text y={-2} textAnchor="middle" className="hfv-node-char">
                      {n.char}
                    </text>
                    <text y={12} textAnchor="middle" className="hfv-node-freq-leaf">
                      {n.freq}
                    </text>
                  </>
                ) : (
                  <text y={5} textAnchor="middle" className="hfv-node-freq">
                    {n.freq}
                  </text>
                )}
                <text y={NODE_R + 16} textAnchor="middle" className="hfv-queue-idx">
                  {currentFrame ? currentFrame.queue.indexOf(id) : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="hfv-info-grid">
        <div className="hfv-panel">
          <div className="hfv-panel-head">
            <span className="hfv-panel-title">Frequencies</span>
            <span className="hfv-panel-meta">
              {freqsList.length} symbol{freqsList.length === 1 ? '' : 's'} · {inputLen} char{inputLen === 1 ? '' : 's'}
            </span>
          </div>
          <div className="hfv-freq-row">
            {freqsList.map(({ char, freq }) => (
              <div key={char} className="hfv-freq-cell">
                <div className="hfv-freq-bar-wrap">
                  <div
                    className="hfv-freq-bar"
                    style={{ height: `${Math.max(6, (freq / Math.max(...freqsList.map((f) => f.freq))) * 56)}px` }}
                  />
                </div>
                <span className="hfv-freq-char">{char}</span>
                <span className="hfv-freq-num">{freq}</span>
              </div>
            ))}
            {freqsList.length === 0 && <span className="hfv-empty">Enter a string to count frequencies.</span>}
          </div>
        </div>

        <div className="hfv-panel">
          <div className="hfv-panel-head">
            <span className="hfv-panel-title">Codewords</span>
            <span className="hfv-panel-meta">
              {showCodes ? `Compressed: ${huffmanTotal} bits` : 'revealed at the final step'}
            </span>
          </div>
          <div className="hfv-codes-row">
            {allCharCodes.map(({ ch, code, freq }) => (
              <div key={ch} className={`hfv-code-cell ${showCodes ? 'hfv-code-cell-on' : ''}`}>
                <span className="hfv-code-char">{ch}</span>
                <span className="hfv-code-bits">
                  {showCodes
                    ? [...code].map((bit, bi) => (
                        <span key={bi} className={bit === '0' ? 'hfv-bit-0' : 'hfv-bit-1'}>
                          {bit}
                        </span>
                      ))
                    : '·····'}
                </span>
                <span className="hfv-code-meta">
                  {showCodes ? `${code.length} bits × ${freq}` : `freq ${freq}`}
                </span>
              </div>
            ))}
            {allCharCodes.length === 0 && <span className="hfv-empty">Tree not built yet.</span>}
          </div>
          {showCodes && fixedTotal > 0 && (
            <div className="hfv-savings">
              <span className="hfv-save-label">Fixed-width baseline</span>
              <span className="hfv-save-num">
                {fixedBits} bits × {inputLen} = {fixedTotal} bits
              </span>
              <span className="hfv-save-arrow">→</span>
              <span className="hfv-save-label">Huffman</span>
              <span className="hfv-save-num">{huffmanTotal} bits</span>
              {huffmanTotal < fixedTotal && (
                <span className="hfv-save-pct">
                  saves {Math.round(((fixedTotal - huffmanTotal) / fixedTotal) * 100)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="hfv-footer">
        <div className="hfv-stat">
          <span className="hfv-stat-label">Step</span>
          <span className="hfv-stat-value">{`${stepNum} / ${totalSteps}`}</span>
        </div>
        <div className="hfv-stat hfv-stat-grow">
          <span className="hfv-stat-label">Action</span>
          <span className="hfv-stat-value">{currentFrame ? currentFrame.label : '—'}</span>
        </div>
        <div className="hfv-stat">
          <span className="hfv-stat-label">Queue size</span>
          <span className="hfv-stat-value">{currentFrame ? currentFrame.queue.length : 0}</span>
        </div>
      </div>
    </div>
  );
}

// Layout subtree starting at rootId without scaling to full canvas — returns raw coords.
function layoutTreeIsolated(nodes, rootId) {
  if (!rootId || !nodes[rootId]) return {};
  const positions = {};
  let nextX = 0;
  let maxDepth = 0;
  const order = [];

  (function dfs(id, depth) {
    const n = nodes[id];
    if (!n) return;
    if (depth > maxDepth) maxDepth = depth;
    if (n.leftId) dfs(n.leftId, depth + 1);
    positions[id] = { _xi: nextX++, _depth: depth };
    order.push(id);
    if (n.rightId) dfs(n.rightId, depth + 1);
  })(rootId, 0);

  const total = nextX;
  if (total === 0) return {};
  const yTop = TREE_TOP + 6;
  const yBot = TREE_BOTTOM - 10;
  const ySpan = yBot - yTop;
  const stepY = maxDepth === 0 ? 0 : ySpan / maxDepth;
  const result = {};
  for (const id of order) {
    const p = positions[id];
    result[id] = { x: p._xi * 60, y: yTop + p._depth * stepY };
  }
  return result;
}
