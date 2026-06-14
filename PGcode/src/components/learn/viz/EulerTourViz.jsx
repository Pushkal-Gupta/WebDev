import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './EulerTourViz.css';

// A rooted tree. children[v] is the (sorted) child list explored left-to-right.
// Euler-tour flattening: DFS the tree; on ENTER assign tin[v] and write v into
// the flat array at that position; on EXIT assign tout[v]. The subtree of v then
// occupies the contiguous interval flat[tin[v] .. tout[v]].
function buildTree() {
  const nodes = [
    { id: 0, x: 250, y: 56 },
    { id: 1, x: 130, y: 150 },
    { id: 2, x: 370, y: 150 },
    { id: 3, x: 70, y: 250 },
    { id: 4, x: 190, y: 250 },
    { id: 5, x: 330, y: 250 },
    { id: 6, x: 440, y: 250 },
    { id: 7, x: 160, y: 344 },
    { id: 8, x: 440, y: 344 },
  ];
  const children = {
    0: [1, 2],
    1: [3, 4],
    2: [5, 6],
    3: [],
    4: [7],
    5: [],
    6: [8],
    7: [],
    8: [],
  };
  const parent = {};
  parent[0] = null;
  Object.entries(children).forEach(([p, cs]) => cs.forEach((c) => { parent[c] = Number(p); }));
  return { nodes, children, parent, root: 0 };
}

const NODE_R = 18;

function buildFrames(tree) {
  const { children, root } = tree;
  const n = tree.nodes.length;
  const tin = {};
  const tout = {};
  const flat = new Array(n).fill(null);
  const pathStack = [];
  let timer = 0;
  const frames = [];

  const snap = (extra) => ({
    tin: { ...tin },
    tout: { ...tout },
    flat: [...flat],
    pathStack: [...pathStack],
    activeNode: null,
    enteredNode: null,
    exitedNode: null,
    writeIndex: null,
    done: false,
    ...extra,
  });

  frames.push(snap({
    note: 'Flatten the tree with a DFS Euler tour. On entry assign tin[v] and write v into the flat array; on exit assign tout[v]. Counter t starts at 0.',
  }));

  function dfs(u) {
    const myTin = timer;
    tin[u] = myTin;
    flat[myTin] = u;
    pathStack.push(u);
    timer += 1;
    frames.push(snap({
      activeNode: u,
      enteredNode: u,
      writeIndex: myTin,
      note: `Enter node ${u} -> tin[${u}] = ${myTin}. Write ${u} into flat[${myTin}]. Advance t to ${timer}.`,
    }));

    for (const c of children[u]) {
      frames.push(snap({
        activeNode: u,
        note: `Node ${u}: descend into child ${c}.`,
      }));
      dfs(c);
      frames.push(snap({
        activeNode: u,
        note: `Back at node ${u} after finishing child ${c}'s subtree.`,
      }));
    }

    const myTout = timer - 1;
    tout[u] = myTout;
    pathStack.pop();
    frames.push(snap({
      activeNode: u,
      exitedNode: u,
      note: `Exit node ${u} -> tout[${u}] = ${myTout}. subtree(${u}) = flat[${myTin}..${myTout}] (${myTout - myTin + 1} node${myTout - myTin === 0 ? '' : 's'}), one contiguous range.`,
    }));
  }

  dfs(root);

  frames.push(snap({
    done: true,
    note: `Tour complete. Every node v now owns a contiguous interval flat[tin[v]..tout[v]] = its whole subtree. A subtree query is now a range query on the flat array.`,
  }));

  return frames;
}

// Subtree membership of a chosen node, by walking parent pointers.
function subtreeSet(tree, root) {
  const out = new Set();
  const stack = [root];
  while (stack.length) {
    const u = stack.pop();
    out.add(u);
    for (const c of tree.children[u]) stack.push(c);
  }
  return out;
}

export default function EulerTourViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [selected, setSelected] = useState(1);
  const runTimer = useRef(null);

  const { frames, tree } = useMemo(() => {
    const t = buildTree();
    return { frames: buildFrames(t), tree: t };
  }, []);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return;
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

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  // Selected subtree highlighting only makes sense once tin/tout are settled.
  const finalFrame = frames[totalSteps - 1];
  const selTin = finalFrame.tin[selected];
  const selTout = finalFrame.tout[selected];
  const selSubtree = useMemo(() => subtreeSet(tree, selected), [tree, selected]);
  const showSubtree = current.done;

  const W = 940;
  const H = 400;
  const treeW = 520;
  const arrX = treeW + 36;
  const arrW = W - arrX - 24;
  const n = tree.nodes.length;
  const cellW = arrW / n;

  const inSelRange = (i) => showSubtree && i >= selTin && i <= selTout;

  const nodeFill = (id) => {
    if (current.enteredNode === id) return 'var(--hue-mint)';
    if (current.exitedNode === id) return 'var(--hue-pink)';
    if (showSubtree && selSubtree.has(id)) return 'rgba(var(--accent-rgb), 0.3)';
    if (id === current.activeNode) return 'rgba(var(--accent-rgb), 0.18)';
    if (current.flat.includes(id)) return 'var(--surface)';
    return 'var(--bg)';
  };
  const nodeStroke = (id) => {
    if (current.enteredNode === id) return 'var(--hue-mint)';
    if (current.exitedNode === id) return 'var(--hue-pink)';
    if (showSubtree && id === selected) return 'var(--accent)';
    if (showSubtree && selSubtree.has(id)) return 'var(--accent)';
    if (id === current.activeNode) return 'var(--accent)';
    return 'var(--border)';
  };
  const labelFill = (id) => {
    if (current.enteredNode === id || current.exitedNode === id) return 'var(--bg)';
    return 'var(--text-main)';
  };

  return (
    <div className="etv">
      <div className="etv-head">
        <h3 className="etv-title">Euler tour — flatten a tree into an array</h3>
        <p className="etv-sub">
          DFS the tree; on entry record tin[v] and write v into the flat array, on exit record
          tout[v]. Every subtree then maps to one contiguous range flat[tin..tout], so a subtree
          query becomes a range query.
        </p>
      </div>

      <div className="etv-controls">
        <div className="etv-actions">
          <div className="etv-buttons">
            <button
              type="button"
              className="etv-btn etv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="etv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="etv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="etv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="etv-speed">
            <span className="etv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="etv-speed-range"
            />
            <span className="etv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="etv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
        <div className="etv-subtree-pick">
          <span className="etv-pick-label">subtree of</span>
          {tree.nodes.map((nd) => (
            <button
              key={`pick-${nd.id}`}
              type="button"
              className={`etv-pick-btn ${selected === nd.id ? 'etv-pick-btn-on' : ''}`}
              onClick={() => setSelected(nd.id)}
            >
              {nd.id}
            </button>
          ))}
        </div>
      </div>

      <div className="etv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="etv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={treeW - 8} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={40} className="etv-row-label">rooted tree (root 0)</text>

          {tree.nodes.map((nd) => {
            const p = tree.parent[nd.id];
            if (p === null || p === undefined) return null;
            const a = tree.nodes.find((m) => m.id === p);
            const onSelEdge = showSubtree && selSubtree.has(nd.id) && (selSubtree.has(p) || nd.id === selected);
            return (
              <line
                key={`edge-${nd.id}`}
                x1={a.x} y1={a.y} x2={nd.x} y2={nd.y}
                stroke={onSelEdge ? 'var(--accent)' : 'var(--text-dim)'}
                strokeWidth={onSelEdge ? 2.4 : 1.4}
                opacity={onSelEdge ? 1 : 0.5}
              />
            );
          })}

          {tree.nodes.map((nd) => {
            const tinV = current.tin[nd.id];
            const toutV = current.tout[nd.id];
            return (
              <g key={`node-${nd.id}`}>
                <circle
                  cx={nd.x} cy={nd.y} r={NODE_R}
                  fill={nodeFill(nd.id)}
                  stroke={nodeStroke(nd.id)}
                  strokeWidth={nd.id === current.activeNode || current.enteredNode === nd.id || current.exitedNode === nd.id ? 3 : 2}
                />
                <text x={nd.x} y={nd.y + 4} className="etv-node-label" style={{ fill: labelFill(nd.id) }}>{nd.id}</text>
                {(tinV !== undefined || toutV !== undefined) && (
                  <text x={nd.x} y={nd.y - NODE_R - 5} className="etv-node-meta">
                    [{tinV === undefined ? '·' : tinV},{toutV === undefined ? '·' : toutV}]
                  </text>
                )}
              </g>
            );
          })}

          {/* Flattened array on the right */}
          <text x={arrX} y={40} className="etv-row-label">flattened array (index = tin)</text>
          {Array.from({ length: n }, (_, i) => {
            const x = arrX + i * cellW;
            const y = 110;
            const v = current.flat[i];
            const isWrite = current.writeIndex === i;
            const inRange = inSelRange(i);
            const cellFill = isWrite
              ? 'var(--hue-mint)'
              : inRange
                ? 'rgba(var(--accent-rgb), 0.22)'
                : v === null
                  ? 'var(--surface)'
                  : 'var(--bg)';
            const cellStroke = isWrite
              ? 'var(--hue-mint)'
              : inRange
                ? 'var(--accent)'
                : 'var(--border)';
            return (
              <g key={`cell-${i}`}>
                <rect
                  x={x + 2} y={y} width={cellW - 4} height={42} rx={5}
                  fill={cellFill} stroke={cellStroke}
                  strokeWidth={isWrite || inRange ? 2.2 : 1.4}
                />
                <text x={x + cellW / 2} y={y + 27} className="etv-cell-value" style={{ fill: isWrite ? 'var(--bg)' : 'var(--text-main)' }}>
                  {v === null ? '' : v}
                </text>
                <text x={x + cellW / 2} y={y + 58} className="etv-cell-index">{i}</text>
              </g>
            );
          })}

          {/* Selected subtree range bracket */}
          {showSubtree && selTin !== undefined && (
            <g>
              <rect
                x={arrX + selTin * cellW + 2}
                y={170}
                width={(selTout - selTin + 1) * cellW - 4}
                height={6}
                rx={3}
                fill="var(--accent)"
              />
              <text
                x={arrX + ((selTin + selTout + 1) / 2) * cellW}
                y={196}
                className="etv-range-label"
              >
                subtree({selected}) = flat[{selTin}..{selTout}]
              </text>
            </g>
          )}

          {/* recursion path */}
          <text x={32} y={H - 78} className="etv-row-label">recursion path (DFS stack)</text>
          {current.pathStack.map((vid, i) => (
            <g key={`ps-${vid}-${i}`}>
              <rect x={32 + i * 38} y={H - 66} width={32} height={28} rx={5} fill="rgba(var(--accent-rgb), 0.18)" stroke="var(--accent)" strokeWidth={1.5} />
              <text x={32 + i * 38 + 16} y={H - 47} className="etv-stack-text">{vid}</text>
            </g>
          ))}
          {current.pathStack.length === 0 && (
            <text x={32} y={H - 47} className="etv-empty">empty</text>
          )}
        </svg>
      </div>

      <div className="etv-panels">
        <div className="etv-panel">
          <div className="etv-panel-label">tin / tout (entry, exit times)</div>
          <div className="etv-times">
            {tree.nodes.map((nd) => {
              const tinV = current.tin[nd.id];
              const toutV = current.tout[nd.id];
              const has = tinV !== undefined;
              return (
                <span key={`t-${nd.id}`} className={`etv-time ${has ? 'etv-time-set' : ''}`}>
                  <span className="etv-time-node">{nd.id}</span>
                  <span className="etv-time-vals">
                    {tinV === undefined ? '·' : tinV}/{toutV === undefined ? '·' : toutV}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="etv-panel">
          <div className="etv-panel-label">selected subtree range</div>
          <div className="etv-range-readout">
            {showSubtree ? (
              <>
                <span className="etv-range-strong">subtree({selected})</span>
                <span className="etv-range-eq">=</span>
                <span className="etv-range-strong">flat[{selTin}..{selTout}]</span>
                <span className="etv-range-nodes">
                  {finalFrame.flat.slice(selTin, selTout + 1).join(', ')}
                </span>
              </>
            ) : (
              <span className="etv-muted">finish the tour (Skip) to highlight a subtree as a contiguous range</span>
            )}
          </div>
        </div>
      </div>

      <div className="etv-arith">
        <span className="etv-arith-label">trace</span>
        <span className="etv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
