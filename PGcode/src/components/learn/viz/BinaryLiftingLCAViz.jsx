import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './BinaryLiftingLCAViz.css';

// Rooted tree (root = 0). parent[i] = direct parent, -1 for root.
// Laid out by depth-rows so the SVG reads top-down.
function buildTree() {
  const parent = [-1, 0, 0, 0, 1, 1, 2, 3, 3, 4, 6, 8];
  const pos = [
    { id: 0, x: 470, y: 46 },
    { id: 1, x: 200, y: 130 },
    { id: 2, x: 470, y: 130 },
    { id: 3, x: 740, y: 130 },
    { id: 4, x: 110, y: 214 },
    { id: 5, x: 290, y: 214 },
    { id: 6, x: 470, y: 214 },
    { id: 7, x: 660, y: 214 },
    { id: 8, x: 820, y: 214 },
    { id: 9, x: 110, y: 298 },
    { id: 10, x: 470, y: 298 },
    { id: 11, x: 820, y: 298 },
  ];
  const n = parent.length;
  const depth = new Array(n).fill(0);
  for (let i = 1; i < n; i++) depth[i] = depth[parent[i]] + 1;
  return { parent, pos, depth, n };
}

// up[node][k] = 2^k-th ancestor (or -1). LOG chosen to cover the tree height.
const LOG = 4;

function buildJumpTable(parent, n) {
  const up = Array.from({ length: n }, () => new Array(LOG).fill(-1));
  for (let v = 0; v < n; v++) up[v][0] = parent[v];
  for (let k = 1; k < LOG; k++) {
    for (let v = 0; v < n; v++) {
      const mid = up[v][k - 1];
      up[v][k] = mid === -1 ? -1 : up[mid][k - 1];
    }
  }
  return up;
}

function toBinary(x) {
  if (x === 0) return '0';
  return x.toString(2);
}

// Produce the step-by-step animation frames for LCA(u, v).
function buildFrames(tree, up, uStart, vStart) {
  const { depth } = tree;
  const frames = [];

  let u = uStart;
  let v = vStart;

  const snap = (extra) => ({
    u,
    v,
    activeNode: -1,
    activeK: -1,
    target: -1,
    lca: -1,
    pathFrom: [],
    phase: 'phase1',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Query LCA(${uStart}, ${vStart}). depth[${uStart}] = ${depth[uStart]}, depth[${vStart}] = ${depth[vStart]}. Phase 1: lift the deeper node up to equal depth.`,
  }));

  // Phase 1 — equalize depth by lifting the deeper node in 2^k jumps.
  // Always treat `u` as the deeper one for the lift bookkeeping note.
  let deeper = depth[u] >= depth[v] ? 'u' : 'v';
  let diff = Math.abs(depth[u] - depth[v]);
  const diffBin = toBinary(diff);

  if (diff === 0) {
    frames.push(snap({
      phase: 'phase1',
      note: `Depths already equal (diff 0). Skip phase 1.`,
    }));
  } else {
    frames.push(snap({
      phase: 'phase1',
      note: `Depth difference = ${diff} = ${diffBin}b. Lift the deeper node (${deeper === 'u' ? uStart : vStart}) up by the set bits of ${diff}.`,
    }));
    for (let k = LOG - 1; k >= 0; k--) {
      if ((diff >> k) & 1) {
        const node = deeper === 'u' ? u : v;
        const dest = up[node][k];
        frames.push(snap({
          phase: 'phase1',
          activeNode: node,
          activeK: k,
          target: dest,
          note: `Bit ${k} of ${diff} is set: jump ${node} up 2^${k} = ${1 << k} via up[${node}][${k}] = ${dest}.`,
        }));
        if (deeper === 'u') u = dest; else v = dest;
      }
    }
    frames.push(snap({
      phase: 'phase1',
      note: `Depths equalized: u = ${u}, v = ${v} both at depth ${depth[u]}.`,
    }));
  }

  // If already the same node, that node is the LCA.
  if (u === v) {
    frames.push(snap({
      phase: 'done',
      lca: u,
      note: `u and v are the same node after equalizing — ${u} is an ancestor of the other. LCA = ${u}.`,
    }));
    return frames;
  }

  frames.push(snap({
    phase: 'phase2',
    note: `Phase 2: lift BOTH up by decreasing powers of two, taking a jump only while it lands on DIFFERENT ancestors. When the jump would merge them, skip it.`,
  }));

  // Phase 2 — lift both while ancestors differ.
  for (let k = LOG - 1; k >= 0; k--) {
    const uk = up[u][k];
    const vk = up[v][k];
    if (uk !== -1 && uk !== vk) {
      frames.push(snap({
        phase: 'phase2',
        activeK: k,
        note: `2^${k} = ${1 << k}: up[${u}][${k}] = ${uk}, up[${v}][${k}] = ${vk} differ -> take the jump. Move both up.`,
      }));
      u = uk;
      v = vk;
    } else {
      frames.push(snap({
        phase: 'phase2',
        activeK: k,
        note: `2^${k} = ${1 << k}: up[${u}][${k}] = ${uk}, up[${v}][${k}] = ${vk} ${uk === vk ? 'are equal (would merge)' : 'is out of range'} -> skip this jump.`,
      }));
    }
  }

  const lca = up[u][0];
  frames.push(snap({
    phase: 'done',
    lca,
    note: `Both nodes are now the LCA's direct children: u = ${u}, v = ${v}. Their parent up[${u}][0] = ${lca} is the answer. LCA(${uStart}, ${vStart}) = ${lca}.`,
  }));

  return frames;
}

// Ancestor chain from a node up to the root (inclusive), used to draw the
// highlighted path each node has climbed.
function chainToRoot(parent, node) {
  const chain = [];
  let cur = node;
  while (cur !== -1) {
    chain.push(cur);
    cur = parent[cur];
  }
  return chain;
}

export default function BinaryLiftingLCAViz() {
  const tree = useMemo(() => buildTree(), []);
  const up = useMemo(() => buildJumpTable(tree.parent, tree.n), [tree]);

  const [uPick, setUPick] = useState(9);
  const [vPick, setVPick] = useState(10);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => buildFrames(tree, up, uPick, vPick),
    [tree, up, uPick, vPick],
  );

  const totalSteps = frames.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
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

  const pickU = (val) => {
    setIsRunningRaw(false);
    setStep(0);
    setUPick(val);
  };
  const pickV = (val) => {
    setIsRunningRaw(false);
    setStep(0);
    setVPick(val);
  };

  const W = 940;
  const H = 540;

  // Current positions of the two travellers (u / v as lifted so far).
  const uNow = current.u;
  const vNow = current.v;

  // Highlighted climbed chains (from original pick up to current position).
  const uChain = useMemo(() => {
    const full = chainToRoot(tree.parent, uPick);
    const idx = full.indexOf(uNow);
    return idx === -1 ? [uPick] : full.slice(0, idx + 1);
  }, [tree.parent, uPick, uNow]);
  const vChain = useMemo(() => {
    const full = chainToRoot(tree.parent, vPick);
    const idx = full.indexOf(vNow);
    return idx === -1 ? [vPick] : full.slice(0, idx + 1);
  }, [tree.parent, vPick, vNow]);

  const uChainSet = new Set(uChain);
  const vChainSet = new Set(vChain);

  const lca = current.lca;

  // Jump-table layout (right side panel).
  const tableX = 560;
  const tableTop = 40;
  const cellW = 76;
  const headW = 44;
  const rowH = 33;

  const nodeFill = (id) => {
    if (id === lca && lca !== -1) return 'var(--hue-mint)';
    if (id === uNow) return 'var(--accent)';
    if (id === vNow) return 'var(--hue-pink)';
    if (uChainSet.has(id) && vChainSet.has(id)) return 'rgba(var(--accent-rgb), 0.18)';
    if (uChainSet.has(id)) return 'rgba(var(--accent-rgb), 0.16)';
    if (vChainSet.has(id)) return 'rgba(var(--accent-rgb), 0.10)';
    return 'var(--bg)';
  };
  const nodeStroke = (id) => {
    if (id === lca && lca !== -1) return 'var(--hue-mint)';
    if (id === uNow) return 'var(--accent)';
    if (id === vNow) return 'var(--hue-pink)';
    if (id === current.target) return 'var(--warning)';
    return 'var(--border)';
  };
  const labelFill = (id) => {
    if ((id === lca && lca !== -1) || id === uNow || id === vNow) return 'var(--bg)';
    return 'var(--text-main)';
  };

  const phaseLabel = {
    init: 'setup',
    phase1: 'phase 1 · equalize depth',
    phase2: 'phase 2 · lift together',
    done: 'answer',
  }[current.phase] || current.phase;

  return (
    <div className="blv">
      <div className="blv-head">
        <h3 className="blv-title">Binary lifting — Lowest Common Ancestor in O(log n)</h3>
        <p className="blv-sub">
          Precompute up[node][k] = the 2&#179;-th ancestor. Each query: equalize depth, then lift both nodes
          together by halving jumps until they sit just below their meeting point.
        </p>
      </div>

      <div className="blv-controls">
        <div className="blv-pickers">
          <label className="blv-picker">
            <span className="blv-picker-label blv-picker-u">node u</span>
            <select className="blv-select" value={uPick} onChange={(e) => pickU(Number(e.target.value))}>
              {tree.pos.map((nd) => (
                <option key={`u-${nd.id}`} value={nd.id}>{nd.id}</option>
              ))}
            </select>
          </label>
          <label className="blv-picker">
            <span className="blv-picker-label blv-picker-v">node v</span>
            <select className="blv-select" value={vPick} onChange={(e) => pickV(Number(e.target.value))}>
              {tree.pos.map((nd) => (
                <option key={`v-${nd.id}`} value={nd.id}>{nd.id}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="blv-buttons">
          <button
            type="button"
            className="blv-btn blv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((r) => !r);
            }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="blv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="blv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="blv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <label className="blv-speed">
          <span className="blv-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="blv-speed-range"
          />
          <span className="blv-speed-value">{speed.toFixed(1)}&#215;</span>
        </label>
        <div className="blv-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="blv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="blv-svg" preserveAspectRatio="xMidYMid meet">
          {/* Tree panel */}
          <rect x={16} y={20} width={524} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={8} />
          <text x={30} y={40} className="blv-panel-label">rooted tree (root 0)</text>

          {/* Edges */}
          {tree.pos.map((nd) => {
            const p = tree.parent[nd.id];
            if (p === -1) return null;
            const a = tree.pos[p];
            const onUChain = uChainSet.has(nd.id) && uChainSet.has(p);
            const onVChain = vChainSet.has(nd.id) && vChainSet.has(p);
            const stroke = onUChain && onVChain ? 'var(--hue-mint)'
              : onUChain ? 'var(--accent)'
              : onVChain ? 'var(--hue-pink)'
              : 'var(--border)';
            const sw = (onUChain || onVChain) ? 2.6 : 1.4;
            const op = (onUChain || onVChain) ? 1 : 0.5;
            return (
              <line
                key={`edge-${nd.id}`}
                x1={a.x} y1={a.y} x2={nd.x} y2={nd.y}
                stroke={stroke} strokeWidth={sw} opacity={op}
              />
            );
          })}

          {/* Active jump arc (phase 1) */}
          {current.activeNode !== -1 && current.target !== -1 && (() => {
            const a = tree.pos[current.activeNode];
            const b = tree.pos[current.target];
            const mx = (a.x + b.x) / 2 - 60;
            const my = (a.y + b.y) / 2;
            return (
              <path
                d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                fill="none" stroke="var(--warning)" strokeWidth={2.6}
                strokeDasharray="6 4" markerEnd="url(#blv-arrow)"
              />
            );
          })()}

          {/* Nodes */}
          {tree.pos.map((nd) => {
            const isU = nd.id === uNow;
            const isV = nd.id === vNow;
            const isLca = nd.id === lca && lca !== -1;
            const r = (isU || isV || isLca) ? 20 : 17;
            return (
              <g key={`node-${nd.id}`}>
                <circle
                  cx={nd.x} cy={nd.y} r={r}
                  fill={nodeFill(nd.id)} stroke={nodeStroke(nd.id)}
                  strokeWidth={(isU || isV || isLca) ? 3 : 1.6}
                />
                <text x={nd.x} y={nd.y + 4} className="blv-node-label" style={{ fill: labelFill(nd.id) }}>
                  {nd.id}
                </text>
                {(isU || isV) && (
                  <text x={nd.x} y={nd.y - r - 6} className="blv-node-tag" style={{ fill: isU ? 'var(--accent)' : 'var(--hue-pink)' }}>
                    {isU && isV ? 'u=v' : isU ? 'u' : 'v'}
                  </text>
                )}
                {isLca && (
                  <text x={nd.x} y={nd.y + r + 16} className="blv-node-tag" style={{ fill: 'var(--hue-mint)' }}>LCA</text>
                )}
              </g>
            );
          })}

          {/* Jump-pointer table panel */}
          <text x={tableX} y={28} className="blv-panel-label">up[node][k] — 2&#7495;-th ancestor</text>
          {/* header row */}
          <g>
            <rect x={tableX} y={tableTop} width={headW} height={rowH - 4} rx={4} fill="var(--surface)" stroke="var(--border)" />
            <text x={tableX + headW / 2} y={tableTop + (rowH - 4) / 2 + 4} className="blv-th">node</text>
            {Array.from({ length: LOG }, (_, k) => {
              const active = k === current.activeK;
              return (
                <g key={`hk-${k}`}>
                  <rect
                    x={tableX + headW + k * cellW} y={tableTop} width={cellW} height={rowH - 4} rx={4}
                    fill={active ? 'rgba(var(--accent-rgb), 0.2)' : 'var(--surface)'}
                    stroke={active ? 'var(--accent)' : 'var(--border)'}
                  />
                  <text x={tableX + headW + k * cellW + cellW / 2} y={tableTop + (rowH - 4) / 2 + 4} className="blv-th">
                    k={k} (2{['⁰', '¹', '²', '³'][k] || ''})
                  </text>
                </g>
              );
            })}
          </g>
          {/* one row per node, but only show the rows for u/v and a few near to keep it tight */}
          {tree.pos.map((nd, i) => {
            const y = tableTop + (i + 1) * rowH;
            const rowIsU = nd.id === uNow;
            const rowIsV = nd.id === vNow;
            const rowHi = rowIsU || rowIsV;
            return (
              <g key={`trow-${nd.id}`}>
                <rect
                  x={tableX} y={y} width={headW} height={rowH - 4} rx={4}
                  fill={rowIsU ? 'rgba(var(--accent-rgb), 0.2)' : rowIsV ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--bg)'}
                  stroke={rowIsU ? 'var(--accent)' : rowIsV ? 'var(--hue-pink)' : 'var(--border)'}
                />
                <text x={tableX + headW / 2} y={y + (rowH - 4) / 2 + 4} className="blv-tnode">{nd.id}</text>
                {Array.from({ length: LOG }, (_, k) => {
                  const cellActive = rowHi && k === current.activeK;
                  const val = up[nd.id][k];
                  return (
                    <g key={`tc-${nd.id}-${k}`}>
                      <rect
                        x={tableX + headW + k * cellW} y={y} width={cellW} height={rowH - 4} rx={4}
                        fill={cellActive ? 'var(--warning)' : 'var(--bg)'}
                        stroke={cellActive ? 'var(--warning)' : 'var(--border)'}
                        opacity={rowHi ? 1 : 0.5}
                      />
                      <text
                        x={tableX + headW + k * cellW + cellW / 2}
                        y={y + (rowH - 4) / 2 + 4}
                        className="blv-tcell"
                        style={{ fill: cellActive ? 'var(--bg)' : rowHi ? 'var(--text-main)' : 'var(--text-dim)' }}
                      >
                        {val === -1 ? '—' : val}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          <defs>
            <marker id="blv-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--warning)" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="blv-metrics">
        <div className="blv-metric">
          <span className="blv-metric-label">phase</span>
          <span className="blv-metric-value">{phaseLabel}</span>
        </div>
        <div className="blv-metric">
          <span className="blv-metric-label">u now / v now</span>
          <span className="blv-metric-value">{uNow} / {vNow}</span>
        </div>
        <div className="blv-metric">
          <span className="blv-metric-label">depths</span>
          <span className="blv-metric-value">{tree.depth[uNow]} / {tree.depth[vNow]}</span>
        </div>
        <div className="blv-metric blv-metric-ans">
          <span className="blv-metric-label">LCA</span>
          <span className="blv-metric-value">{lca === -1 ? '—' : lca}</span>
        </div>
      </div>

      <div className="blv-trace">
        <span className="blv-trace-label">trace</span>
        <span className="blv-trace-text">{current.note}</span>
      </div>
    </div>
  );
}
