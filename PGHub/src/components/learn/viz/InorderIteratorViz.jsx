import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './InorderIteratorViz.css';

const INITIAL_VALUES = [20, 10, 30, 5, 15, 25, 35, 3, 7];

function makeNode(value) {
  return { value, left: null, right: null };
}

function insertInto(root, value) {
  if (!root) return makeNode(value);
  let node = root;
  while (true) {
    if (value < node.value) {
      if (!node.left) { node.left = makeNode(value); break; }
      node = node.left;
    } else if (value > node.value) {
      if (!node.right) { node.right = makeNode(value); break; }
      node = node.right;
    } else {
      break;
    }
  }
  return root;
}

function buildTree(values) {
  let root = null;
  for (const v of values) root = insertInto(root, v);
  return root;
}

// Assign x by in-order index, y by depth.
function layout(root) {
  const nodes = [];
  let order = 0;
  (function walk(node, depth) {
    if (!node) return;
    walk(node.left, depth + 1);
    node._order = order++;
    node._depth = depth;
    nodes.push(node);
    walk(node.right, depth + 1);
  })(root, 0);
  return { nodes, count: nodes.length || 1 };
}

function collectEdges(root) {
  const edges = [];
  (function collect(node) {
    if (!node) return;
    if (node.left) { edges.push([node, node.left]); collect(node.left); }
    if (node.right) { edges.push([node, node.right]); collect(node.right); }
  })(root);
  return edges;
}

// Simulate the explicit stack-based in-order iterator, one frame per atomic action.
function buildFrames(root) {
  const frames = [];
  const stack = [];
  const output = [];

  const snap = (extra) => ({
    stack: stack.map((nd) => nd.value),
    output: [...output],
    current: null,
    emitted: null,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: 'Constructor: push the entire left spine of the root. The stack now holds the path to the smallest key — its top is the next() value.',
  }));

  // pushLeftSpine
  const pushLeft = (node) => {
    const pushed = [];
    let cur = node;
    while (cur) {
      stack.push(cur);
      pushed.push(cur.value);
      cur = cur.left;
    }
    return pushed;
  };

  const initPushed = pushLeft(root);
  frames.push(snap({
    current: stack.length ? stack[stack.length - 1].value : null,
    note: initPushed.length
      ? `Push left spine ${initPushed.join(', ')}. Top of stack = ${initPushed[initPushed.length - 1]} is the smallest key, so next() will pop it first.`
      : 'Tree is empty: stack stays empty, hasNext() is false.',
  }));

  // each next(): pop top -> emit, then push left spine of its right child.
  while (stack.length) {
    const node = stack[stack.length - 1];
    frames.push(snap({
      current: node.value,
      note: `next(): top of stack is ${node.value}. Its left subtree is already exhausted, so ${node.value} is the next in-order key.`,
    }));

    stack.pop();
    output.push(node.value);
    frames.push(snap({
      current: node.value,
      emitted: node.value,
      note: `Pop ${node.value} and emit it. Output so far: ${output.join(', ')}.`,
    }));

    if (node.right) {
      const pushed = pushLeft(node.right);
      frames.push(snap({
        current: stack.length ? stack[stack.length - 1].value : null,
        emitted: node.value,
        note: `${node.value} has a right child ${node.right.value}: push its left spine ${pushed.join(', ')}. New top ${pushed[pushed.length - 1]} is the next key.`,
      }));
    } else {
      frames.push(snap({
        current: stack.length ? stack[stack.length - 1].value : null,
        emitted: node.value,
        note: stack.length
          ? `${node.value} has no right child: nothing to push. New top ${stack[stack.length - 1].value} (an ancestor) is the next key.`
          : `${node.value} has no right child and the stack is now empty: hasNext() is false. In-order traversal complete.`,
      }));
    }
  }

  frames.push(snap({
    note: `Done. Emitted all ${output.length} keys in sorted order: ${output.join(', ')}. Each node was pushed once and popped once, so the whole walk is O(n) with O(h) stack space.`,
  }));

  return frames;
}

const NODE_R = 17;

export default function InorderIteratorViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { nodes, edges, frames, total } = useMemo(() => {
    const t = buildTree(INITIAL_VALUES);
    const { nodes: nds, count } = layout(t);
    return {
      nodes: nds,
      edges: collectEdges(t),
      frames: buildFrames(t),
      total: count,
    };
  }, []);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);
  const playing = isRunningRaw && step < totalSteps - 1;

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

  const W = 940;
  const H = 360;
  const treeX = 20;
  const treeW = 600;
  const stackX = treeX + treeW + 20;
  const stackW = W - stackX - 20;

  const padX = 44;
  const topY = 56;
  const levelGap = 64;
  const xOf = (nd) => treeX + padX + (nd._order + 0.5) * ((treeW - padX * 2) / total);
  const yOf = (nd) => topY + nd._depth * levelGap;

  const stackVals = current.stack;
  const onStack = new Set(stackVals);
  const cellH = 30;
  const cellGap = 6;
  // Stack grows from the bottom up so the visual top sits at the bottom-near region.
  const stackBaseY = H - 36;
  const cellY = (i) => stackBaseY - (i + 1) * (cellH + cellGap);

  const outputVals = current.output;
  const outChipW = 36;
  const outGap = 6;

  return (
    <div className="iiv">
      <div className="iiv-head">
        <h3 className="iiv-title">BST in-order iterator — explicit stack, O(1) amortized next()</h3>
        <p className="iiv-sub">
          No recursion: a stack holds the unvisited left spine. next() pops the top (the next key in
          sorted order), emits it, then pushes the left spine of its right child.
        </p>
      </div>

      <div className="iiv-controls">
        <div className="iiv-actions">
          <div className="iiv-buttons">
            <button
              type="button"
              className="iiv-btn iiv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="iiv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> next()
            </button>
            <button
              type="button"
              className="iiv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="iiv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="iiv-speed">
            <span className="iiv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="iiv-speed-range"
            />
            <span className="iiv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="iiv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="iiv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="iiv-svg" preserveAspectRatio="xMidYMid meet">
          {/* tree panel */}
          <rect x={treeX} y={20} width={treeW} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={treeX + 12} y={38} className="iiv-row-label">binary search tree</text>

          {edges.map(([p, c], i) => {
            const both = onStack.has(p.value) && onStack.has(c.value);
            return (
              <line
                key={`edge-${i}`}
                x1={xOf(p)} y1={yOf(p)} x2={xOf(c)} y2={yOf(c)}
                stroke={both ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={both ? 2.4 : 1.5}
                opacity={both ? 1 : 0.7}
              />
            );
          })}

          {nodes.map((nd) => {
            const isCurrent = nd.value === current.current;
            const isEmittedNow = nd.value === current.emitted;
            const inStack = onStack.has(nd.value);
            const alreadyOut = current.output.includes(nd.value);
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            let labelFill = 'var(--text-main)';
            if (isCurrent) {
              fill = 'var(--medium)'; stroke = 'var(--medium)'; labelFill = 'var(--bg)';
            } else if (inStack) {
              fill = 'rgba(var(--accent-rgb), 0.20)'; stroke = 'var(--accent)';
            } else if (alreadyOut) {
              fill = 'var(--easy)'; stroke = 'var(--easy)'; labelFill = 'var(--bg)';
            }
            return (
              <g key={`node-${nd.value}`}>
                <circle
                  cx={xOf(nd)} cy={yOf(nd)} r={NODE_R}
                  fill={fill} stroke={stroke}
                  strokeWidth={isCurrent || isEmittedNow ? 3 : 2}
                />
                <text x={xOf(nd)} y={yOf(nd) + 4} className="iiv-node-label" style={{ fill: labelFill }}>
                  {nd.value}
                </text>
              </g>
            );
          })}

          {/* explicit stack panel */}
          <rect x={stackX} y={20} width={stackW} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={stackX + 12} y={38} className="iiv-row-label">explicit stack</text>
          <text x={stackX + 12} y={54} className="iiv-stack-hint">top = next()</text>

          {stackVals.length === 0 && (
            <text x={stackX + stackW / 2} y={H / 2} className="iiv-empty" textAnchor="middle">empty</text>
          )}
          {stackVals.map((v, i) => {
            const isTop = i === stackVals.length - 1;
            return (
              <g key={`cell-${v}-${i}`}>
                <rect
                  x={stackX + 16} y={cellY(i)}
                  width={stackW - 32} height={cellH} rx={5}
                  fill={isTop ? 'var(--accent)' : 'rgba(var(--accent-rgb), 0.16)'}
                  stroke="var(--accent)"
                  strokeWidth={isTop ? 2.4 : 1.4}
                />
                <text
                  x={stackX + stackW / 2} y={cellY(i) + cellH / 2 + 4}
                  className="iiv-stack-text"
                  style={{ fill: isTop ? 'var(--bg)' : 'var(--accent)' }}
                >
                  {v}
                </text>
                {isTop && (
                  <text x={stackX + stackW - 24} y={cellY(i) + cellH / 2 + 4} className="iiv-stack-tag">top</text>
                )}
              </g>
            );
          })}

          {/* emitted in-order sequence (bottom band) */}
          <text x={treeX + 12} y={H - 50} className="iiv-row-label">in-order output</text>
          {outputVals.length === 0 && (
            <text x={treeX + 12} y={H - 24} className="iiv-empty">—</text>
          )}
          {outputVals.map((v, i) => {
            const justEmitted = v === current.emitted && i === outputVals.length - 1;
            return (
              <g key={`out-${v}-${i}`}>
                <rect
                  x={treeX + 12 + i * (outChipW + outGap)} y={H - 44}
                  width={outChipW} height={26} rx={5}
                  fill={justEmitted ? 'var(--easy)' : 'var(--bg)'}
                  stroke="var(--easy)"
                  strokeWidth={justEmitted ? 2.4 : 1.4}
                />
                <text
                  x={treeX + 12 + i * (outChipW + outGap) + outChipW / 2} y={H - 25}
                  className="iiv-out-text"
                  style={{ fill: justEmitted ? 'var(--bg)' : 'var(--easy)' }}
                >
                  {v}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="iiv-metrics">
        <div className="iiv-metric">
          <span className="iiv-metric-label">stack (bottom -&gt; top)</span>
          <span className="iiv-metric-value">[{stackVals.join(', ') || '—'}]</span>
        </div>
        <div className="iiv-metric">
          <span className="iiv-metric-label">last emitted</span>
          <span className="iiv-metric-value">{current.emitted == null ? '—' : current.emitted}</span>
        </div>
        <div className="iiv-metric">
          <span className="iiv-metric-label">emitted count</span>
          <span className="iiv-metric-value">{outputVals.length} / {total}</span>
        </div>
        <div className="iiv-metric iiv-metric-dim">
          <span className="iiv-metric-label">output so far</span>
          <span className="iiv-metric-value iiv-metric-dimval">{outputVals.join(', ') || '—'}</span>
        </div>
      </div>

      <div className="iiv-arith">
        <span className="iiv-arith-label">trace</span>
        <span className="iiv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
