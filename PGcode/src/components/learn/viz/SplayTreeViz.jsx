import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Search } from 'lucide-react';
import './SplayTreeViz.css';

// Splay tree as a plain node model: {key, left, right}.
// On ACCESS we bottom-up splay the found (or last-visited) node to the root
// using zig / zig-zig / zig-zag steps, snapshotting one frame per step so the
// reader watches the node climb. Parent pointers are recomputed each step from
// the live root (cheaper to reason about than threading them through clones).

function clone(n) {
  if (!n) return null;
  return { key: n.key, left: clone(n.left), right: clone(n.right) };
}

function insertBST(root, key) {
  if (!root) return { node: { key, left: null, right: null } };
  let cur = root;
  while (true) {
    if (key === cur.key) return { node: root };
    if (key < cur.key) {
      if (!cur.left) { cur.left = { key, left: null, right: null }; return { node: root }; }
      cur = cur.left;
    } else {
      if (!cur.right) { cur.right = { key, left: null, right: null }; return { node: root }; }
      cur = cur.right;
    }
  }
}

// Walk from root toward key; return the key held at the found node, or the
// last node visited before falling off (standard splay-tree access behaviour).
function searchTarget(root, key) {
  let cur = root, last = root;
  while (cur) {
    last = cur;
    if (key === cur.key) return cur.key;
    cur = key < cur.key ? cur.left : cur.right;
  }
  return last ? last.key : null;
}

// Build parent map + path (root..target) for the current root snapshot.
function pathTo(root, key) {
  const parent = new Map();
  const path = [];
  let cur = root;
  parent.set(root ? root.key : null, null);
  while (cur) {
    path.push(cur.key);
    if (cur.key === key) break;
    const next = key < cur.key ? cur.left : cur.right;
    if (next) parent.set(next.key, cur.key);
    cur = next;
  }
  return { parent, path };
}

function findNode(root, key) {
  let cur = root;
  while (cur) {
    if (cur.key === key) return cur;
    cur = key < cur.key ? cur.left : cur.right;
  }
  return null;
}

function findParent(node, k) {
  if (!node) return null;
  if (node.left && node.left.key === k) return node;
  if (node.right && node.right.key === k) return node;
  if (k < node.key) return findParent(node.left, k);
  return findParent(node.right, k);
}

// Rotate `childKey` above its parent. Returns the (possibly new) root.
function rotate(root, childKey) {
  const par = findParent(root, childKey);
  if (!par) return root; // child is root already
  const child = par.left && par.left.key === childKey ? par.left : par.right;
  const gp = findParent(root, par.key);
  const isLeftChild = par.left === child;

  if (isLeftChild) {
    par.left = child.right;
    child.right = par;
  } else {
    par.right = child.left;
    child.left = par;
  }
  if (!gp) return child; // par was root -> child becomes root
  if (gp.left === par) gp.left = child; else gp.right = child;
  return root;
}

function buildFrames(values, accessKey) {
  const frames = [];
  let root = null;

  const snap = (extra) => ({
    root: clone(root),
    activeKey: null,
    caseKind: null,
    moveNodes: [],
    pathKeys: [],
    ...extra,
  });

  // Build the starting tree (plain BST inserts, no splaying) so the reader sees
  // an unbalanced shape that the access then fixes.
  for (const v of values) {
    const r = insertBST(root, v);
    root = r.node;
  }

  const target = searchTarget(root, accessKey);
  const wasFound = findNode(root, accessKey) != null;

  const { path: pathBefore } = pathTo(root, target);
  const depthBefore = pathBefore.length - 1;

  frames.push(snap({
    phase: 'start', activeKey: target, pathKeys: pathBefore,
    depthBefore,
    note: wasFound
      ? `Access ${accessKey}: found at depth ${depthBefore}. Splay it to the root so the next access of ${accessKey} is O(1).`
      : `Access ${accessKey}: not present — splay the last node on the search path (${target}) to the root instead.`,
  }));

  // Bottom-up splay loop. One or two rotations per iteration.
  let guard = 0;
  while (guard++ < 64) {
    const { parent } = pathTo(root, target);
    const p = parent.get(target);
    if (p == null) break; // target is root -> done
    const g = parent.get(p);

    if (g == null) {
      // ZIG: parent is root, single rotation
      root = rotate(root, target);
      frames.push(snap({
        phase: 'zig', activeKey: target, caseKind: 'zig', moveNodes: [target, p],
        depthBefore,
        note: `zig: ${target}'s parent ${p} is the root -> single rotation lifts ${target} to the root.`,
      }));
      continue;
    }

    const gNode = findNode(root, g);
    const pNode = findNode(root, p);
    const pIsLeft = gNode.left && gNode.left.key === p;
    const xIsLeft = pNode.left && pNode.left.key === target;

    if (pIsLeft === xIsLeft) {
      // ZIG-ZIG: both left or both right. Rotate grandparent (p up), then parent (x up).
      const side = xIsLeft ? 'left' : 'right';
      root = rotate(root, p);       // grandparent rotation first
      root = rotate(root, target);  // then parent rotation
      frames.push(snap({
        phase: 'zigzig', activeKey: target, caseKind: 'zig-zig', moveNodes: [target, p, g],
        depthBefore,
        note: `zig-zig: ${target} and parent ${p} are both ${side} children -> rotate grandparent ${g}, then parent ${p}. ${target} rises two levels.`,
      }));
    } else {
      // ZIG-ZAG: left-right or right-left. Rotate parent (x up), then grandparent (x up again).
      const shape = xIsLeft ? 'left-then-right' : 'right-then-left';
      root = rotate(root, target);  // parent rotation first
      root = rotate(root, target);  // then grandparent rotation
      frames.push(snap({
        phase: 'zigzag', activeKey: target, caseKind: 'zig-zag', moveNodes: [target, p, g],
        depthBefore,
        note: `zig-zag (${shape}): ${target} is a ${xIsLeft ? 'left' : 'right'} child of a ${pIsLeft ? 'left' : 'right'} child -> rotate parent ${p}, then grandparent ${g}. ${target} rises two levels.`,
      }));
    }
  }

  frames.push(snap({
    phase: 'done', activeKey: target,
    depthBefore,
    note: `Done. ${target} is now the root (depth 0, was ${depthBefore}). The whole search path got shallower — the splay's amortized payoff. Inorder order is unchanged: still a valid BST.`,
  }));

  return { frames, target, wasFound, finalRoot: root };
}

function nodeHeight(n) {
  if (!n) return 0;
  return 1 + Math.max(nodeHeight(n.left), nodeHeight(n.right));
}

function layout(root, W) {
  const positions = {};
  let order = 0;
  function walk(n, depth) {
    if (!n) return;
    walk(n.left, depth + 1);
    positions[n.key] = { order: order++, depth };
    walk(n.right, depth + 1);
  }
  walk(root, 0);
  const count = order;
  const padX = 46;
  const usableW = W - padX * 2;
  const stepX = count > 1 ? usableW / (count - 1) : 0;
  const stepY = 72;
  const out = {};
  for (const key of Object.keys(positions)) {
    const p = positions[key];
    out[key] = {
      x: count > 1 ? padX + p.order * stepX : W / 2,
      y: 52 + p.depth * stepY,
      depth: p.depth,
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

const PRESETS = {
  'right-leaning chain': { tree: [10, 20, 30, 40, 50, 60], access: 60 },
  'zig-zig (deep left)': { tree: [50, 40, 30, 20, 10], access: 10 },
  'zig-zag mix': { tree: [50, 20, 70, 10, 30, 60, 80, 25], access: 25 },
  'balanced, access leaf': { tree: [40, 20, 60, 10, 30, 50, 70], access: 70 },
};

export default function SplayTreeViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [config, setConfig] = useState(PRESETS['right-leaning chain']);
  const [activePreset, setActivePreset] = useState('right-leaning chain');
  const [accessDraft, setAccessDraft] = useState('');
  const runTimer = useRef(null);

  const { frames, target, wasFound } = useMemo(
    () => buildFrames(config.tree, config.access),
    [config],
  );

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

  const applyConfig = (cfg, presetName) => {
    if (!cfg.tree.length) return;
    setIsRunningRaw(false);
    setConfig(cfg);
    setActivePreset(presetName || null);
    setStep(0);
  };

  const runAccess = () => {
    const v = parseInt(accessDraft, 10);
    if (Number.isNaN(v)) return;
    applyConfig({ tree: config.tree, access: v }, null);
    setAccessDraft('');
  };

  const W = 940;
  const H = 420;

  const positions = useMemo(() => layout(current.root, W), [current.root]);
  const edges = useMemo(() => edgeList(current.root), [current.root]);

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

  const moveSet = new Set(current.moveNodes || []);
  const pathSet = new Set(current.pathKeys || []);
  const kindColor = {
    zig: 'var(--hue-sky)', 'zig-zig': 'var(--hue-violet)', 'zig-zag': 'var(--hue-pink)',
  };
  const activeColor = current.caseKind ? kindColor[current.caseKind] : 'var(--accent)';

  const rootKey = current.root ? current.root.key : null;
  const treeHeight = nodeHeight(current.root);
  const targetPos = positions[target];
  const depthNow = targetPos ? targetPos.depth : current.depthBefore;

  return (
    <div className="sptv">
      <div className="sptv-head">
        <h3 className="sptv-title">Splay tree — access splays the node to the root</h3>
        <p className="sptv-sub">
          Every search or insert moves the touched node to the root via zig / zig-zig / zig-zag rotations.
          Recently-accessed keys end up shallow, giving O(log n) amortized cost without storing balance data.
        </p>
      </div>

      <div className="sptv-controls">
        <div className="sptv-actions">
          <div className="sptv-buttons">
            <button
              type="button"
              className="sptv-btn sptv-btn-primary"
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
              className="sptv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="sptv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="sptv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="sptv-speed">
            <span className="sptv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="sptv-speed-range"
            />
            <span className="sptv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="sptv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>

        <div className="sptv-access">
          <span className="sptv-access-label">access value</span>
          <input
            type="text"
            className="sptv-access-input"
            placeholder={`e.g. ${config.tree[config.tree.length - 1] ?? 30}`}
            value={accessDraft}
            onChange={(e) => setAccessDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runAccess(); }}
          />
          <button
            type="button"
            className="sptv-btn sptv-btn-primary"
            onClick={runAccess}
            disabled={Number.isNaN(parseInt(accessDraft, 10))}
          >
            <Search size={14} /> Splay
          </button>
          <div className="sptv-presets">
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                type="button"
                className={`sptv-chip${activePreset === name ? ' sptv-chip-on' : ''}`}
                onClick={() => applyConfig(PRESETS[name], name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sptv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sptv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={10} y={10} width={W - 20} height={H - 20} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {!current.root && (
            <text x={W / 2} y={H / 2} className="sptv-empty">empty tree</text>
          )}

          {edges.map(([p, c]) => {
            const a = positions[p];
            const b = positions[c];
            if (!a || !b) return null;
            const onMove = moveSet.has(p) && moveSet.has(c);
            const onPath = pathSet.has(p) && pathSet.has(c);
            return (
              <line
                key={`e-${p}-${c}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={onMove ? activeColor : onPath ? 'var(--accent)' : 'var(--text-dim)'}
                strokeWidth={onMove ? 3 : onPath ? 2.4 : 1.6}
                opacity={onMove || onPath ? 1 : 0.5}
                className="sptv-edge"
              />
            );
          })}

          {nodes.map((nd) => {
            const p = positions[nd.key];
            if (!p) return null;
            const inMove = moveSet.has(nd.key);
            const onPath = pathSet.has(nd.key);
            const isTarget = nd.key === target;
            const fill = inMove
              ? activeColor
              : isTarget
                ? 'rgba(var(--accent-rgb), 0.22)'
                : 'var(--bg)';
            const stroke = inMove
              ? activeColor
              : isTarget
                ? 'var(--accent)'
                : onPath
                  ? 'var(--accent)'
                  : 'var(--border)';
            const labelFill = inMove ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${nd.key}`} className="sptv-node">
                <circle cx={p.x} cy={p.y} r={21} fill={fill} stroke={stroke} strokeWidth={inMove || isTarget ? 3 : 2} />
                <text x={p.x} y={p.y + 5} className="sptv-node-label" style={{ fill: labelFill }}>{nd.key}</text>
                {isTarget && (
                  <text x={p.x} y={p.y - 30} className="sptv-node-tag" style={{ fill: activeColor }}>access</text>
                )}
                {nd.key === rootKey && (
                  <text x={p.x} y={p.y + 38} className="sptv-node-root">root</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="sptv-metrics">
        <div className="sptv-metric">
          <span className="sptv-metric-label">splay case</span>
          <span className="sptv-metric-value" style={{ color: current.caseKind ? activeColor : 'var(--text-dim)' }}>
            {current.caseKind || (current.phase === 'done' ? 'at root' : 'start')}
          </span>
        </div>
        <div className="sptv-metric">
          <span className="sptv-metric-label">depth of {target}</span>
          <span className="sptv-metric-value">{current.depthBefore} &rarr; {depthNow}</span>
        </div>
        <div className="sptv-metric">
          <span className="sptv-metric-label">tree height</span>
          <span className="sptv-metric-value">{treeHeight}</span>
        </div>
        <div className="sptv-metric sptv-metric-dim">
          <span className="sptv-metric-label">access {target}</span>
          <span className="sptv-metric-value sptv-metric-dimval">{wasFound ? 'found' : 'absent, last on path'}</span>
        </div>
      </div>

      <div className="sptv-arith">
        <span className="sptv-arith-label">trace</span>
        <span className="sptv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
