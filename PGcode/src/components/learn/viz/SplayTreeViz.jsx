import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Search } from 'lucide-react';
import './SplayTreeViz.css';

const INSERT_KEYS = [10, 20, 30, 40, 50];
const DEFAULT_SEARCH = 20;
const SEED = 0x5B1A1F;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clone(root) {
  if (!root) return null;
  return { key: root.key, left: clone(root.left), right: clone(root.right) };
}

function bstInsert(root, key) {
  if (!root) return { key, left: null, right: null };
  if (key < root.key) root.left = bstInsert(root.left, key);
  else if (key > root.key) root.right = bstInsert(root.right, key);
  return root;
}

function findPath(root, key) {
  const path = [];
  let cur = root;
  while (cur) {
    path.push(cur.key);
    if (key === cur.key) return { path, found: true };
    cur = key < cur.key ? cur.left : cur.right;
  }
  return { path, found: false };
}

// Find node and its parent chain (returning array of {node, parent, gp} top-down).
function getAncestry(root, key) {
  const stack = []; // array of nodes top-down, including target if found
  let cur = root;
  while (cur) {
    stack.push(cur);
    if (key === cur.key) return { stack, found: true };
    cur = key < cur.key ? cur.left : cur.right;
  }
  return { stack, found: false };
}

// rotate utility on a parent pointer: we'll do it by rebuilding via path
function rotateRight(p) {
  const l = p.left;
  p.left = l.right;
  l.right = p;
  return l;
}
function rotateLeft(p) {
  const r = p.right;
  p.right = r.left;
  r.left = p;
  return r;
}

// Splay node with given key to root (top-down emulated by repeatedly splaying-from-bottom).
// We'll do bottom-up: find ancestry list, then apply zig/zig-zig/zig-zag from leaf-side up.
// To track rotations frame-by-frame, we splay one step at a time and reconnect.
function splayStep(root, key, frames) {
  // Find ancestry each iteration; rotate one step; record frame.
  while (true) {
    const { stack } = getAncestry(root, key);
    if (stack.length < 2) return root;
    const target = stack[stack.length - 1];
    if (target.key !== key) return root; // not found, stop

    const parent = stack[stack.length - 2];
    const gp = stack.length >= 3 ? stack[stack.length - 3] : null;

    if (!gp) {
      // zig
      if (parent.left === target) {
        // rotate right at parent
        const newSub = rotateRight(parent);
        root = newSub;
        frames.push({
          tree: clone(root),
          highlight: key,
          rotation: `zig (right) at ${parent.key}`,
          note: `Zig: ${target.key} is the left child of root ${parent.key}. Single right rotation lifts it to root.`,
        });
      } else {
        const newSub = rotateLeft(parent);
        root = newSub;
        frames.push({
          tree: clone(root),
          highlight: key,
          rotation: `zig (left) at ${parent.key}`,
          note: `Zig: ${target.key} is the right child of root ${parent.key}. Single left rotation lifts it to root.`,
        });
      }
      return root;
    }

    // zig-zig or zig-zag — perform two rotations at once
    const ggp = stack.length >= 4 ? stack[stack.length - 4] : null;
    const gpIsLeftOfGgp = ggp && ggp.left === gp;

    const targetIsLeft = parent.left === target;
    const parentIsLeft = gp.left === parent;

    let newSub;
    let rotLabel;
    let note;
    if (targetIsLeft && parentIsLeft) {
      // zig-zig (both left): rotate right at gp first, then at the new root (parent).
      newSub = rotateRight(gp);   // lifts parent above gp
      newSub = rotateRight(newSub); // lifts target above parent
      rotLabel = `zig-zig (right-right) at ${gp.key}`;
      note = `Zig-zig: ${target.key}, ${parent.key}, ${gp.key} are all left-left. Rotate ${gp.key} right, then ${parent.key} right.`;
    } else if (!targetIsLeft && !parentIsLeft) {
      newSub = rotateLeft(gp);
      newSub = rotateLeft(newSub);
      rotLabel = `zig-zig (left-left) at ${gp.key}`;
      note = `Zig-zig: ${target.key}, ${parent.key}, ${gp.key} are all right-right. Rotate ${gp.key} left, then ${parent.key} left.`;
    } else if (targetIsLeft && !parentIsLeft) {
      // zig-zag: target left of parent (right child of gp).
      // Rotate right at parent first, then left at gp.
      gp.right = rotateRight(parent);
      newSub = rotateLeft(gp);
      rotLabel = `zig-zag (right-left) at ${gp.key}`;
      note = `Zig-zag: ${target.key} is left of ${parent.key}, which is right of ${gp.key}. Rotate ${parent.key} right, then ${gp.key} left.`;
    } else {
      // target right of parent (left child of gp). Rotate left at parent, then right at gp.
      gp.left = rotateLeft(parent);
      newSub = rotateRight(gp);
      rotLabel = `zig-zag (left-right) at ${gp.key}`;
      note = `Zig-zag: ${target.key} is right of ${parent.key}, which is left of ${gp.key}. Rotate ${parent.key} left, then ${gp.key} right.`;
    }

    if (!ggp) {
      root = newSub;
    } else if (gpIsLeftOfGgp) {
      ggp.left = newSub;
    } else {
      ggp.right = newSub;
    }

    frames.push({
      tree: clone(root),
      highlight: key,
      rotation: rotLabel,
      note,
    });
  }
}

function buildInsertFrames(keys) {
  const frames = [];
  let root = null;

  frames.push({
    tree: null,
    highlight: null,
    rotation: null,
    note: 'Empty splay tree. Each insert: BST-insert the key, then splay it to the root.',
    inserted: null,
  });

  for (const k of keys) {
    root = bstInsert(root, k);
    frames.push({
      tree: clone(root),
      highlight: k,
      rotation: null,
      note: `BST-insert ${k}. Now splay it to the root.`,
      inserted: k,
    });
    root = splayStep(root, k, frames);
  }

  return { frames, finalTree: root };
}

function buildSearchFrames(rootIn, key) {
  const frames = [];
  let root = clone(rootIn);
  const { path, found } = findPath(root, key);

  frames.push({
    tree: clone(root),
    highlight: null,
    rotation: null,
    note: `Search ${key}: walk BST path ${path.join(' → ')}${found ? ' (found)' : ' (not found)'}. Splay the last node touched to root.`,
    searchPath: path,
  });

  if (!found) {
    // Splay the last accessed node (its key is path[last])
    if (path.length > 0) {
      root = splayStep(root, path[path.length - 1], frames);
    }
    frames.push({
      tree: clone(root),
      highlight: null,
      rotation: null,
      note: `Key ${key} not in tree. The last node on the search path is now the root.`,
    });
    return frames;
  }

  root = splayStep(root, key, frames);
  frames.push({
    tree: clone(root),
    highlight: key,
    rotation: null,
    note: `Found ${key} and splayed it to the root. Subsequent accesses to ${key} are O(1).`,
  });
  return frames;
}

function layoutTree(root) {
  if (!root) return { positions: {}, edges: [], W: 600, H: 200 };
  const positions = {};
  let inorderIdx = 0;
  function assignX(node, depth) {
    if (!node) return;
    assignX(node.left, depth + 1);
    positions[node.key] = { x: inorderIdx, y: depth };
    inorderIdx++;
    assignX(node.right, depth + 1);
  }
  assignX(root, 0);

  const keys = Object.keys(positions);
  const maxX = Math.max(...keys.map(k => positions[k].x));
  const maxY = Math.max(...keys.map(k => positions[k].y));

  const stepX = 70;
  const stepY = 70;
  const padX = 40;
  const padY = 30;
  const W = padX * 2 + maxX * stepX;
  const H = padY * 2 + maxY * stepY;

  const final = {};
  for (const k of keys) {
    final[k] = {
      x: padX + positions[k].x * stepX,
      y: padY + positions[k].y * stepY,
    };
  }

  const edges = [];
  function collectEdges(node) {
    if (!node) return;
    if (node.left) {
      edges.push({ from: node.key, to: node.left.key });
      collectEdges(node.left);
    }
    if (node.right) {
      edges.push({ from: node.key, to: node.right.key });
      collectEdges(node.right);
    }
  }
  collectEdges(root);

  return { positions: final, edges, W, H };
}

export default function SplayTreeViz() {
  const [searchInput, setSearchInput] = useState(String(DEFAULT_SEARCH));
  const [frames, setFrames] = useState(() => buildInsertFrames(INSERT_KEYS).frames);
  const [finalAfterInserts, setFinalAfterInserts] = useState(() => buildInsertFrames(INSERT_KEYS).finalTree);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const rng = useMemo(() => mulberry32(SEED), []);
  void rng;

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return;
    runTimer.current = setTimeout(() => {
      setStep((s2) => Math.min(s2 + 1, totalSteps - 1));
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
    const { frames: f, finalTree } = buildInsertFrames(INSERT_KEYS);
    setFrames(f);
    setFinalAfterInserts(finalTree);
    setStep(0);
  };

  const doSearch = () => {
    const k = Number(searchInput);
    if (!Number.isFinite(k)) return;
    // Use the state at end of frames as the current tree to search.
    const currentTree = frames[frames.length - 1]?.tree || finalAfterInserts;
    const searchFrames = buildSearchFrames(currentTree, k);
    setFrames((prev) => [...prev, ...searchFrames]);
    setStep(frames.length); // jump to start of new search
    setIsRunningRaw(true);
  };

  const tree = current.tree;
  const { positions, edges, W, H } = useMemo(() => layoutTree(tree), [tree]);
  const stageW = Math.max(W, 600);
  const stageH = Math.max(H, 220);
  const r = 20;

  return (
    <div className="spv">
      <div className="spv-head">
        <h3 className="spv-title">Splay tree — self-adjusting BST</h3>
        <p className="spv-sub">
          Every access (search, insert, delete) splays the touched node to the root via zig / zig-zig / zig-zag rotations. The tree often looks unbalanced — that's intentional; recently-touched keys stay near the top.
        </p>
      </div>

      <div className="spv-controls">
        <div className="spv-field">
          <span className="spv-label">search key</span>
          <input
            className="spv-input"
            type="number"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            spellCheck={false}
          />
        </div>
        <button type="button" className="spv-btn" onClick={doSearch} disabled={searchInput === ''}>
          <Search size={14} /> Search
        </button>

        <div className="spv-actions">
          <div className="spv-buttons">
            <button
              type="button"
              className="spv-btn spv-btn-primary"
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
              className="spv-btn"
              onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="spv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="spv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="spv-speed">
            <span className="spv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="spv-speed-range"
            />
            <span className="spv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="spv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="spv-stage">
        <svg viewBox={`0 0 ${stageW} ${stageH}`} className="spv-svg" preserveAspectRatio="xMidYMid meet">
          {/* edges */}
          {edges.map((e, idx) => {
            const a = positions[e.from];
            const b = positions[e.to];
            if (!a || !b) return null;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const sx = a.x + (dx / len) * r;
            const sy = a.y + (dy / len) * r;
            const ex = b.x - (dx / len) * r;
            const ey = b.y - (dy / len) * r;
            return (
              <line
                key={`e-${idx}`}
                x1={sx}
                y1={sy}
                x2={ex}
                y2={ey}
                stroke="var(--border)"
                strokeWidth="1.5"
              />
            );
          })}

          {/* nodes */}
          {Object.entries(positions).map(([key, p]) => {
            const k = Number(key);
            const isHighlight = current.highlight === k;
            const isRoot = tree && tree.key === k;
            const inSearch = (current.searchPath || []).includes(k);
            const fill = isHighlight
              ? 'var(--easy)'
              : isRoot
              ? 'rgba(var(--accent-rgb), 0.22)'
              : inSearch
              ? 'rgba(var(--accent-rgb), 0.1)'
              : 'var(--surface)';
            const stroke = isHighlight ? 'var(--easy)' : isRoot ? 'var(--accent)' : inSearch ? 'var(--accent)' : 'var(--border)';
            const textFill = isHighlight ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${k}`}>
                <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke={stroke} strokeWidth={isHighlight || isRoot ? 2.2 : 1.4} />
                <text x={p.x} y={p.y} className="spv-node-label" fill={textFill}>{k}</text>
              </g>
            );
          })}

          {current.rotation && (
            <text x={stageW / 2} y={stageH - 8} className="spv-rot-label">
              {current.rotation}
            </text>
          )}
        </svg>
      </div>

      <div className="spv-metrics">
        <div className="spv-metric">
          <span className="spv-metric-label">root</span>
          <span className="spv-metric-value">{tree ? tree.key : '—'}</span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">touched</span>
          <span className="spv-metric-value">{current.highlight ?? '—'}</span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">nodes</span>
          <span className="spv-metric-value">{Object.keys(positions).length}</span>
        </div>
        <div className="spv-metric spv-metric-dim">
          <span className="spv-metric-label">rotation</span>
          <span className="spv-metric-value spv-metric-dimval">{current.rotation || '—'}</span>
        </div>
      </div>

      <div className="spv-arith">
        <span className="spv-arith-label">trace</span>
        <span className="spv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
