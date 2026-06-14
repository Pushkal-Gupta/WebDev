import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus } from 'lucide-react';
import './AVLRotationViz.css';

// AVL tree as a plain object model. Each node: {key, left, right, height}.
// We build frames by replaying insertions, snapshotting before/after each rotation.

function nodeHeight(n) {
  return n ? n.height : 0;
}
function balanceFactor(n) {
  return n ? nodeHeight(n.left) - nodeHeight(n.right) : 0;
}
function update(n) {
  n.height = 1 + Math.max(nodeHeight(n.left), nodeHeight(n.right));
}
function clone(n) {
  if (!n) return null;
  return { key: n.key, height: n.height, left: clone(n.left), right: clone(n.right) };
}

// Layout: assign x by in-order index, y by depth. Returns a flat map keyed by node key.
function layout(root, W) {
  const positions = {};
  let order = 0;
  const maxDepth = { v: 0 };
  function walk(n, depth) {
    if (!n) return;
    walk(n.left, depth + 1);
    positions[n.key] = { order: order++, depth };
    maxDepth.v = Math.max(maxDepth.v, depth);
    walk(n.right, depth + 1);
  }
  walk(root, 0);
  const count = order;
  const padX = 46;
  const usableW = W - padX * 2;
  const stepX = count > 1 ? usableW / (count - 1) : 0;
  const stepY = 78;
  const out = {};
  for (const key of Object.keys(positions)) {
    const p = positions[key];
    out[key] = {
      x: count > 1 ? padX + p.order * stepX : W / 2,
      y: 54 + p.depth * stepY,
    };
  }
  return out;
}

function edgeList(root) {
  const edges = [];
  function walk(n) {
    if (!n) return;
    if (n.left) { edges.push([n.key, n.left.key]); walk(n.left); }
    if (n.right) { edges.push([n.key, n.right.key]); walk(n.right); }
  }
  walk(root);
  return edges;
}

function buildFrames(values) {
  const frames = [];
  let root = null;

  const snap = (extra) => ({
    root: clone(root),
    activeKey: null,
    rotationNodes: [],
    rotationKind: null,
    insertedKey: null,
    ...extra,
  });

  frames.push(snap({ phase: 'init', note: 'Empty tree. Insert keys one at a time; each insert keeps every balance factor in {-1, 0, +1}.' }));

  function rotateRight(y) {
    const x = y.left;
    const t2 = x.right;
    x.right = y;
    y.left = t2;
    update(y);
    update(x);
    return x;
  }
  function rotateLeft(x) {
    const y = x.right;
    const t2 = y.left;
    y.left = x;
    x.right = t2;
    update(x);
    update(y);
    return y;
  }

  function insert(n, key) {
    if (!n) return { node: { key, left: null, right: null, height: 1 }, fired: null, pivot: null, children: [] };

    if (key < n.key) {
      const r = insert(n.left, key);
      n.left = r.node;
      if (r.fired) return { node: n, fired: r.fired, pivot: r.pivot, children: r.children };
    } else if (key > n.key) {
      const r = insert(n.right, key);
      n.right = r.node;
      if (r.fired) return { node: n, fired: r.fired, pivot: r.pivot, children: r.children };
    } else {
      return { node: n, fired: null, pivot: null, children: [] };
    }

    update(n);
    const bf = balanceFactor(n);

    if (bf > 1 && key < n.left.key) {
      const pivot = n.key, c = n.left.key;
      n = rotateRight(n);
      return { node: n, fired: 'LL', pivot, children: [c] };
    }
    if (bf < -1 && key > n.right.key) {
      const pivot = n.key, c = n.right.key;
      n = rotateLeft(n);
      return { node: n, fired: 'RR', pivot, children: [c] };
    }
    if (bf > 1 && key > n.left.key) {
      const pivot = n.key, c = n.left.key, gc = n.left.right.key;
      n.left = rotateLeft(n.left);
      n = rotateRight(n);
      return { node: n, fired: 'LR', pivot, children: [c, gc] };
    }
    if (bf < -1 && key < n.right.key) {
      const pivot = n.key, c = n.right.key, gc = n.right.left.key;
      n.right = rotateRight(n.right);
      n = rotateLeft(n);
      return { node: n, fired: 'RL', pivot, children: [c, gc] };
    }
    return { node: n, fired: null, pivot: null, children: [] };
  }

  const ROT_NAME = { LL: 'Left-Left -> single right rotation', RR: 'Right-Right -> single left rotation', LR: 'Left-Right -> left then right rotation', RL: 'Right-Left -> right then left rotation' };

  for (const key of values) {
    const r = insert(root, key);
    root = r.node;

    if (r.fired) {
      frames.push(snap({
        phase: 'imbalance', activeKey: key, insertedKey: key,
        rotationNodes: [r.pivot, ...r.children],
        rotationKind: r.fired,
        note: `Inserted ${key}. Node ${r.pivot} now has |balance factor| = 2 -> ${r.fired} case. Apply ${ROT_NAME[r.fired]}.`,
      }));
      frames.push(snap({
        phase: 'rebalanced', activeKey: r.children[0] != null ? root.key : key, insertedKey: key,
        rotationNodes: [root.key, ...r.children],
        rotationKind: r.fired,
        note: `${r.fired} rotation done. ${root.key} is the new local root; every balance factor is back in {-1, 0, +1}. Tree height stays O(log n).`,
      }));
    } else {
      frames.push(snap({
        phase: 'insert', activeKey: key, insertedKey: key,
        note: `Inserted ${key}. All balance factors already in {-1, 0, +1} — no rotation needed.`,
      }));
    }
  }

  frames.push(snap({ phase: 'done', note: `Done. ${values.length} insertions; the tree stayed height-balanced the whole way, guaranteeing O(log n) search, insert and delete.` }));

  return frames;
}

const PRESETS = {
  'LL + RR + LR + RL': [30, 10, 5, 20, 25, 40, 50, 35, 33],
  'ascending (all RR)': [10, 20, 30, 40, 50, 60, 70],
  'descending (all LL)': [70, 60, 50, 40, 30, 20, 10],
  'zig-zag (LR / RL)': [30, 10, 20, 50, 70, 60],
};

function parseInput(text) {
  const seen = new Set();
  const out = [];
  for (const tok of text.split(/[,\s]+/)) {
    if (!tok) continue;
    const v = parseInt(tok, 10);
    if (!Number.isNaN(v) && !seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out.slice(0, 18);
}

export default function AVLRotationViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [values, setValues] = useState(PRESETS['LL + RR + LR + RL']);
  const [draft, setDraft] = useState('');
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(values), [values]);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const applyValues = (vals) => {
    if (!vals.length) return;
    setIsRunningRaw(false);
    setValues(vals);
    setStep(0);
  };

  const W = 940;
  const H = 420;

  const positions = useMemo(() => layout(current.root, W), [current.root]);
  const edges = useMemo(() => edgeList(current.root), [current.root]);

  // flatten nodes for rendering
  const nodes = useMemo(() => {
    const list = [];
    function walk(n) {
      if (!n) return;
      list.push(n);
      walk(n.left);
      walk(n.right);
    }
    walk(current.root);
    return list;
  }, [current.root]);

  const rotSet = new Set(current.rotationNodes || []);
  const kindColor = {
    LL: 'var(--hue-violet)', RR: 'var(--hue-sky)', LR: 'var(--hue-pink)', RL: 'var(--hue-mint)',
  };
  const activeColor = current.rotationKind ? kindColor[current.rotationKind] : 'var(--accent)';

  const rootKey = current.root ? current.root.key : null;
  const treeHeight = current.root ? current.root.height : 0;

  return (
    <div className="avlv">
      <div className="avlv-head">
        <h3 className="avlv-title">AVL tree rotations — self-balancing on insert</h3>
        <p className="avlv-sub">
          After each insert, walk back to the root recomputing balance factors. The first node where
          |bf| hits 2 triggers a rotation — LL, RR, LR or RL — that restores every factor to {'{-1, 0, +1}'}.
        </p>
      </div>

      <div className="avlv-controls">
        <div className="avlv-actions">
          <div className="avlv-buttons">
            <button
              type="button"
              className="avlv-btn avlv-btn-primary"
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
              className="avlv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="avlv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="avlv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="avlv-speed">
            <span className="avlv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="avlv-speed-range"
            />
            <span className="avlv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="avlv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>

        <div className="avlv-insert">
          <span className="avlv-insert-label">insert keys</span>
          <input
            type="text"
            className="avlv-insert-input"
            placeholder="e.g. 50 40 30 60 70 35"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = parseInput(draft);
                if (v.length) { applyValues(v); setDraft(''); }
              }
            }}
          />
          <button
            type="button"
            className="avlv-btn avlv-btn-primary"
            onClick={() => {
              const v = parseInput(draft);
              if (v.length) { applyValues(v); setDraft(''); }
            }}
            disabled={parseInput(draft).length === 0}
          >
            <Plus size={14} /> Build
          </button>
          <div className="avlv-presets">
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                type="button"
                className={`avlv-chip${values === PRESETS[name] ? ' avlv-chip-on' : ''}`}
                onClick={() => applyValues(PRESETS[name])}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="avlv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="avlv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={10} y={10} width={W - 20} height={H - 20} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {!current.root && (
            <text x={W / 2} y={H / 2} className="avlv-empty">empty tree — insert a key to begin</text>
          )}

          {edges.map(([p, c]) => {
            const a = positions[p];
            const b = positions[c];
            if (!a || !b) return null;
            const onRot = rotSet.has(p) && rotSet.has(c);
            return (
              <line
                key={`e-${p}-${c}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={onRot ? activeColor : 'var(--text-dim)'}
                strokeWidth={onRot ? 3 : 1.6}
                opacity={onRot ? 1 : 0.5}
                className="avlv-edge"
              />
            );
          })}

          {nodes.map((nd) => {
            const p = positions[nd.key];
            if (!p) return null;
            const bf = balanceFactor(nd);
            const inRot = rotSet.has(nd.key);
            const isInserted = nd.key === current.insertedKey;
            const unbalanced = Math.abs(bf) > 1;
            const fill = inRot
              ? activeColor
              : isInserted
                ? 'rgba(var(--accent-rgb), 0.22)'
                : 'var(--bg)';
            const stroke = inRot
              ? activeColor
              : unbalanced
                ? 'var(--hard)'
                : isInserted
                  ? 'var(--accent)'
                  : 'var(--border)';
            const labelFill = inRot ? 'var(--bg)' : 'var(--text-main)';
            const bfColor = unbalanced ? 'var(--hard)' : bf === 0 ? 'var(--text-dim)' : 'var(--medium)';
            return (
              <g key={`n-${nd.key}`} className="avlv-node">
                <circle cx={p.x} cy={p.y} r={21} fill={fill} stroke={stroke} strokeWidth={inRot || unbalanced ? 3 : 2} />
                <text x={p.x} y={p.y + 5} className="avlv-node-label" style={{ fill: labelFill }}>{nd.key}</text>
                <text x={p.x} y={p.y - 30} className="avlv-node-bf" style={{ fill: bfColor }}>
                  bf {bf > 0 ? `+${bf}` : bf}
                </text>
                <text x={p.x + 26} y={p.y - 6} className="avlv-node-h">h{nd.height}</text>
                {nd.key === rootKey && (
                  <text x={p.x} y={p.y + 38} className="avlv-node-root">root</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="avlv-metrics">
        <div className="avlv-metric">
          <span className="avlv-metric-label">phase</span>
          <span className="avlv-metric-value">{current.phase}</span>
        </div>
        <div className="avlv-metric">
          <span className="avlv-metric-label">rotation</span>
          <span className="avlv-metric-value" style={{ color: current.rotationKind ? activeColor : 'var(--text-dim)' }}>
            {current.rotationKind || 'none'}
          </span>
        </div>
        <div className="avlv-metric">
          <span className="avlv-metric-label">tree height</span>
          <span className="avlv-metric-value">{treeHeight}</span>
        </div>
        <div className="avlv-metric avlv-metric-dim">
          <span className="avlv-metric-label">keys</span>
          <span className="avlv-metric-value avlv-metric-dimval">{nodes.length} / {values.length}</span>
        </div>
      </div>

      <div className="avlv-arith">
        <span className="avlv-arith-label">trace</span>
        <span className="avlv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
