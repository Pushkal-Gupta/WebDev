import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './TreapViz.css';

const KEYS = [50, 30, 70, 20, 40, 60, 80];
const SEED = 0xC0FFEE;

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

function cloneTree(root) {
  if (!root) return null;
  return {
    key: root.key,
    prio: root.prio,
    left: cloneTree(root.left),
    right: cloneTree(root.right),
  };
}

function rotateRight(node) {
  const l = node.left;
  node.left = l.right;
  l.right = node;
  return l;
}

function rotateLeft(node) {
  const r = node.right;
  node.right = r.left;
  r.left = node;
  return r;
}

function buildFrames() {
  const rng = mulberry32(SEED);
  const prios = KEYS.map(() => Math.floor(rng() * 1000));
  const frames = [];
  let root = null;

  frames.push({
    root: null,
    activeKey: null,
    activePrio: null,
    descentPath: [],
    rotation: null,
    note: 'Empty treap. Insert keys in order; each gets a random heap priority.',
    queueIndex: -1,
    prios,
  });

  for (let i = 0; i < KEYS.length; i++) {
    const key = KEYS[i];
    const prio = prios[i];
    const path = [];

    // BST descent
    let stackRefs = [];
    let cur = root;
    let parent = null;
    let dir = null;
    while (cur) {
      path.push(cur.key);
      parent = cur;
      stackRefs.push({ ref: parent, dir: key < cur.key ? 'L' : 'R' });
      if (key < cur.key) {
        cur = cur.left;
        dir = 'L';
      } else {
        cur = cur.right;
        dir = 'R';
      }
    }

    const newNode = { key, prio, left: null, right: null };
    if (!parent) {
      root = newNode;
    } else if (key < parent.key) {
      parent.left = newNode;
    } else {
      parent.right = newNode;
    }

    frames.push({
      root: cloneTree(root),
      activeKey: key,
      activePrio: prio,
      descentPath: [...path, key],
      rotation: null,
      note: `Insert key ${key} with priority ${prio}. Descended through [${path.length ? path.join(', ') : 'root'}], attached as ${parent ? (key < parent.key ? 'left' : 'right') + ' child of ' + parent.key : 'root'}.`,
      queueIndex: i,
      prios,
    });

    // Bubble up: rotate while parent's priority > node's priority (min-heap on priority)
    // Walk back up using stackRefs - need to rebuild root each rotation
    // Use a recursive rebuild via path
    while (stackRefs.length > 0) {
      const { ref: par, dir: d } = stackRefs[stackRefs.length - 1];
      const child = d === 'L' ? par.left : par.right;
      if (!child || child.prio >= par.prio) break;

      // Need to rotate child up. Find par's parent reference (or root).
      let rotated;
      if (d === 'L') {
        rotated = rotateRight(par);
      } else {
        rotated = rotateLeft(par);
      }

      // Re-link: rotated should replace par in parent of par
      if (stackRefs.length === 1) {
        root = rotated;
      } else {
        const grand = stackRefs[stackRefs.length - 2];
        if (grand.dir === 'L') grand.ref.left = rotated;
        else grand.ref.right = rotated;
      }

      // Pop par off; the rotated node now sits where par was
      stackRefs.pop();
      // Push rotated in place (its child of interest is now par, which has the original key)
      // For further bubbling, we look at rotated.parent's relation, which is what stackRefs holds.
      // We don't push rotated; we just continue checking against grandparent.

      frames.push({
        root: cloneTree(root),
        activeKey: key,
        activePrio: prio,
        descentPath: [],
        rotation: { type: d === 'L' ? 'rotateRight' : 'rotateLeft', pivot: par.key, child: child.key },
        note: `Heap violation: child ${child.key} (prio ${child.prio}) < parent ${par.key} (prio ${par.prio}). ${d === 'L' ? 'Right' : 'Left'}-rotate at ${par.key}.`,
        queueIndex: i,
        prios,
      });
    }

    if (frames[frames.length - 1].rotation == null && frames[frames.length - 1].descentPath.length === 0) {
      // we just inserted at root; no rotations
    }
  }

  frames.push({
    root: cloneTree(root),
    activeKey: null,
    activePrio: null,
    descentPath: [],
    rotation: null,
    note: 'Done. Tree is a BST on keys AND a min-heap on priorities. Expected depth O(log n).',
    queueIndex: KEYS.length,
    prios,
  });

  return { frames, prios };
}

function layoutTree(root) {
  const positions = new Map();
  if (!root) return positions;

  // assign x via inorder index
  const order = [];
  const dfs = (node, depth) => {
    if (!node) return;
    dfs(node.left, depth + 1);
    order.push({ node, depth });
    dfs(node.right, depth + 1);
  };
  dfs(root, 0);

  order.forEach((entry, idx) => {
    positions.set(entry.node.key, { x: idx, depth: entry.depth });
  });

  return positions;
}

export default function TreapViz() {
  const { frames, prios } = useMemo(() => buildFrames(), []);
  const totalSteps = frames.length;
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

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

  const positions = useMemo(() => layoutTree(current.root), [current.root]);
  const inorderCount = positions.size || 1;
  const maxDepth = Math.max(0, ...Array.from(positions.values()).map((p) => p.depth));

  // Build key -> node lookup so we can show the actual priority each node carries
  const keyToNode = useMemo(() => {
    const m = new Map();
    const walk = (n) => {
      if (!n) return;
      m.set(n.key, n);
      walk(n.left); walk(n.right);
    };
    walk(current.root);
    return m;
  }, [current.root]);

  const padX = 30;
  const padY = 36;
  const W = 720;
  const xStep = (W - padX * 2) / Math.max(inorderCount - 1, 1);
  const yStep = 70;
  const H = padY * 2 + (maxDepth) * yStep + 80;

  const nodeXY = (key) => {
    const p = positions.get(key);
    if (!p) return null;
    const x = inorderCount === 1 ? W / 2 : padX + p.x * xStep;
    const y = padY + p.depth * yStep + 20;
    return { x, y };
  };

  const edges = [];
  const collect = (node) => {
    if (!node) return;
    if (node.left) {
      edges.push([node.key, node.left.key]);
      collect(node.left);
    }
    if (node.right) {
      edges.push([node.key, node.right.key]);
      collect(node.right);
    }
  };
  collect(current.root);

  const descSet = new Set(current.descentPath);
  const rotationKeys = current.rotation ? new Set([current.rotation.pivot, current.rotation.child]) : new Set();

  return (
    <div className="trv">
      <div className="trv-head">
        <h3 className="trv-title">Treap — BST on keys, heap on random priorities</h3>
        <p className="trv-sub">
          Insert each key like a normal BST, then rotate it up while its priority beats the parent. The random
          priorities make the expected depth O(log n) without any explicit balancing.
        </p>
      </div>

      <div className="trv-controls">
        <div className="trv-buttons">
          <button
            type="button"
            className="trv-btn trv-btn-primary"
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
            className="trv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="trv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="trv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <label className="trv-speed">
          <span className="trv-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="trv-speed-range"
          />
          <span className="trv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="trv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="trv-stage">
        <div className="trv-queue">
          <span className="trv-queue-label">insert order</span>
          {KEYS.map((k, idx) => {
            const isActive = idx === current.queueIndex;
            const isDone = idx < current.queueIndex;
            return (
              <span
                key={idx}
                className={`trv-chip ${isActive ? 'trv-chip-active' : ''} ${isDone ? 'trv-chip-done' : ''}`}
              >
                {k}
                <span style={{ marginLeft: 4, opacity: 0.7 }}>·{prios[idx]}</span>
              </span>
            );
          })}
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="trv-svg" preserveAspectRatio="xMidYMid meet">
          {edges.map(([a, b], i) => {
            const A = nodeXY(a);
            const B = nodeXY(b);
            if (!A || !B) return null;
            const both = rotationKeys.has(a) && rotationKeys.has(b);
            return (
              <line
                key={`e-${i}`}
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke={both ? 'var(--hard)' : 'var(--border)'}
                strokeWidth={both ? 2.5 : 1.5}
                strokeDasharray={both ? '5 3' : undefined}
              />
            );
          })}

          {Array.from(positions.entries()).map(([key]) => {
            const p = nodeXY(key);
            if (!p) return null;
            const isActive = key === current.activeKey;
            const inPath = descSet.has(key);
            const inRot = rotationKeys.has(key);
            return (
              <g key={`n-${key}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={20}
                  fill={
                    isActive
                      ? 'rgba(var(--accent-rgb), 0.18)'
                      : inRot
                      ? 'rgba(var(--hard-rgb, 239, 68, 68), 0.12)'
                      : inPath
                      ? 'rgba(var(--hue-sky-rgb, 56, 189, 248), 0.10)'
                      : 'var(--surface)'
                  }
                  stroke={
                    isActive
                      ? 'var(--accent)'
                      : inRot
                      ? 'var(--hard)'
                      : inPath
                      ? 'var(--hue-sky)'
                      : 'var(--border)'
                  }
                  strokeWidth={isActive || inRot ? 2.4 : 1.4}
                />
                <text x={p.x} y={p.y - 1} className="trv-node-key">{key}</text>
                <text x={p.x} y={p.y + 12} className="trv-node-prio">p={keyToNode.get(key)?.prio ?? '?'}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="trv-metrics">
        <div className="trv-metric">
          <span className="trv-metric-label">inserting</span>
          <span className="trv-metric-value">{current.activeKey ?? '—'}</span>
        </div>
        <div className="trv-metric">
          <span className="trv-metric-label">priority</span>
          <span className="trv-metric-value">{current.activePrio ?? '—'}</span>
        </div>
        <div className="trv-metric">
          <span className="trv-metric-label">nodes</span>
          <span className="trv-metric-value">{positions.size}</span>
        </div>
        <div className="trv-metric">
          <span className="trv-metric-label">depth</span>
          <span className="trv-metric-value">{maxDepth + (positions.size ? 1 : 0)}</span>
        </div>
        <div className="trv-metric trv-metric-dim">
          <span className="trv-metric-label">phase</span>
          <span className="trv-metric-value trv-metric-dimval">
            {current.rotation ? 'rotate' : current.descentPath.length ? 'descend' : current.queueIndex < 0 ? 'init' : 'idle'}
          </span>
        </div>
      </div>

      <div className="trv-arith">
        <span className="trv-arith-label">trace</span>
        <span className="trv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
