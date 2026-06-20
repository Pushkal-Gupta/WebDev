import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, Minus, RefreshCw } from 'lucide-react';
import './ConsistentHashingViz.css';

// Hash ring spans [0, RING). Positions are integers on this ring.
const RING = 360;
const NODE_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const KEY_NAMES = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8', 'k9', 'k10', 'k11', 'k12'];

// Deterministic small hash -> position on the ring. Salt distinguishes replicas.
function hashPos(label, salt) {
  let h = 2166136261 >>> 0;
  const s = `${label}#${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % RING;
}

// Expand server nodes into ring tokens (1 token, or `replicas` virtual tokens each).
function buildTokens(nodes, replicas) {
  const tokens = [];
  for (const name of nodes) {
    if (replicas <= 1) {
      tokens.push({ owner: name, pos: hashPos(name, 0), vnode: 0 });
    } else {
      for (let r = 0; r < replicas; r++) {
        tokens.push({ owner: name, pos: hashPos(name, r), vnode: r });
      }
    }
  }
  tokens.sort((a, b) => a.pos - b.pos || (a.owner < b.owner ? -1 : 1));
  return tokens;
}

// First token clockwise from a key position (wraps around the ring).
function ownerOf(tokens, pos) {
  if (tokens.length === 0) return null;
  for (const t of tokens) if (t.pos >= pos) return t;
  return tokens[0]; // wrap to the smallest token
}

// Map every key to its owning node. Returns { byKey: {key->owner}, counts: {node->n} }.
function assign(tokens, keys, nodes) {
  const byKey = {};
  const counts = {};
  for (const n of nodes) counts[n] = 0;
  for (const k of keys) {
    const o = ownerOf(tokens, k.pos);
    const owner = o ? o.owner : null;
    byKey[k.name] = owner;
    if (owner != null) counts[owner] += 1;
  }
  return { byKey, counts };
}

// Build the full step trace from a list of mutations applied in order.
// Each mutation: { type: 'add-node'|'remove-node'|'add-key', payload }.
function buildFrames(initialNodes, initialKeys, replicas, mutations) {
  const frames = [];
  let nodes = [...initialNodes];
  let keys = [...initialKeys];

  const tokensOf = (ns) => buildTokens(ns, replicas);

  const snap = (extra) => {
    const tokens = tokensOf(nodes);
    const { byKey, counts } = assign(tokens, keys, nodes);
    return {
      nodes: [...nodes],
      keys: keys.map((k) => ({ ...k })),
      tokens,
      byKey,
      counts,
      moved: [],
      focusNode: null,
      focusKey: null,
      ...extra,
    };
  };

  frames.push(snap({
    note: `Ring of ${RING} slots. ${nodes.length} server node(s)${replicas > 1 ? ` × ${replicas} virtual nodes` : ''}, ${keys.length} key(s). Each key is owned by the first node clockwise from its hash position.`,
  }));

  for (const m of mutations) {
    if (m.type === 'add-node') {
      const name = m.name;
      const before = assign(tokensOf(nodes), keys, nodes).byKey;
      nodes.push(name);
      const after = assign(tokensOf(nodes), keys, nodes).byKey;
      const moved = keys.filter((k) => before[k.name] !== after[k.name]).map((k) => k.name);
      const pos = replicas > 1 ? `${replicas} vnodes` : `pos ${hashPos(name, 0)}`;
      frames.push(snap({
        focusNode: name,
        moved,
        note: moved.length
          ? `Add node ${name} (${pos}) -> only ${moved.length} key(s) remap to ${name}: ${moved.join(', ')}. Every other key stays put.`
          : `Add node ${name} (${pos}). No keys fell in its arc, so nothing moved.`,
      }));
    } else if (m.type === 'remove-node') {
      const name = m.name;
      if (!nodes.includes(name)) continue;
      const before = assign(tokensOf(nodes), keys, nodes).byKey;
      nodes = nodes.filter((n) => n !== name);
      const after = assign(tokensOf(nodes), keys, nodes).byKey;
      const moved = keys.filter((k) => before[k.name] === name).map((k) => k.name);
      const dest = {};
      for (const kn of moved) dest[kn] = after[kn];
      const destStr = moved.map((kn) => `${kn}->${dest[kn] || '∅'}`).join(', ');
      frames.push(snap({
        focusNode: name,
        moved,
        note: moved.length
          ? `Remove node ${name} -> its ${moved.length} key(s) shift to the next node clockwise: ${destStr}. Keys of other nodes are untouched.`
          : `Remove node ${name} -> it held no keys, so nothing moves.`,
      }));
    } else if (m.type === 'add-key') {
      const k = m.key;
      keys.push(k);
      const owner = assign(tokensOf(nodes), keys, nodes).byKey[k.name];
      frames.push(snap({
        focusKey: k.name,
        moved: [k.name],
        note: `Add key ${k.name} at pos ${k.pos} -> lands on node ${owner || '∅'} (first node clockwise).`,
      }));
    }
  }

  return frames;
}

function makeKey(name) {
  return { name, pos: hashPos(name, 7) };
}

const NODE_COLORS = ['var(--accent)', 'var(--hue-mint)', 'var(--hue-violet)', 'var(--hue-pink)', 'var(--hue-sky)', 'var(--medium)', 'var(--easy)', 'var(--warning)'];

const INIT_NODES = ['A', 'B', 'D'];
const INIT_KEYS = ['k1', 'k2', 'k3', 'k4', 'k5'].map(makeKey);
const INIT_MUTATIONS = [
  { type: 'add-node', name: 'C' },
  { type: 'add-key', key: makeKey('k6') },
  { type: 'remove-node', name: 'B' },
];

export default function ConsistentHashingViz() {
  const [replicas, setReplicas] = useState(1);
  const [nodes, setNodes] = useState(INIT_NODES);
  const [keys, setKeys] = useState(INIT_KEYS);
  const [mutations, setMutations] = useState(INIT_MUTATIONS);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => buildFrames(nodes, keys, replicas, mutations),
    [nodes, keys, replicas, mutations],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
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

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  // Mutation builders append to the timeline and jump to the new last frame.
  const liveNodes = current.nodes; // nodes present at the current frame

  const addNode = () => {
    const present = new Set(current.nodes);
    // also avoid names already scheduled to be added later
    for (const m of mutations) if (m.type === 'add-node') present.add(m.name);
    const next = NODE_NAMES.find((n) => !present.has(n));
    if (!next) return;
    setIsRunning(false);
    setMutations((ms) => [...ms, { type: 'add-node', name: next }]);
    setStep(totalSteps); // new frame index
  };

  const removeNode = () => {
    const ns = current.nodes;
    if (ns.length <= 1) return;
    const victim = ns[ns.length - 1];
    setIsRunning(false);
    setMutations((ms) => [...ms, { type: 'remove-node', name: victim }]);
    setStep(totalSteps);
  };

  const addKey = () => {
    const usedNow = new Set(current.keys.map((k) => k.name));
    for (const m of mutations) if (m.type === 'add-key') usedNow.add(m.key.name);
    const name = KEY_NAMES.find((kn) => !usedNow.has(kn));
    if (!name) return;
    setIsRunning(false);
    setMutations((ms) => [...ms, { type: 'add-key', key: makeKey(name) }]);
    setStep(totalSteps);
  };

  const setReplicaCount = (delta) => {
    const nextR = Math.max(1, Math.min(4, replicas + delta));
    if (nextR === replicas) return;
    setIsRunning(false);
    setReplicas(nextR);
    setStep(Math.min(step, buildFrames(nodes, keys, nextR, mutations).length - 1));
  };

  const restart = () => {
    setIsRunning(false);
    setReplicas(1);
    setNodes(INIT_NODES);
    setKeys(INIT_KEYS);
    setMutations(INIT_MUTATIONS);
    setStep(0);
  };

  // Color per node (stable by first-seen order across all frames' node universe).
  const allNodeNames = useMemo(() => {
    const order = [];
    const seen = new Set();
    for (const f of frames) {
      for (const n of f.nodes) if (!seen.has(n)) { seen.add(n); order.push(n); }
    }
    return order;
  }, [frames]);
  const colorOf = (name) => NODE_COLORS[allNodeNames.indexOf(name) % NODE_COLORS.length];

  // SVG geometry — square ring on the left, legend/table on the right.
  const W = 940;
  const H = 420;
  const cx = 220;
  const cy = H / 2;
  const R = 162;
  const tableX = 470;
  const tableW = W - tableX - 24;

  // pos (0..RING) -> point on the ring. 0 at top (12 o'clock), clockwise.
  const toXY = (pos, radius) => {
    const ang = (pos / RING) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(ang) * radius, y: cy + Math.sin(ang) * radius };
  };

  const movedSet = new Set(current.moved);
  const tokens = current.tokens;

  // Arc highlight: for a removed/added node, shade the arc it owns (token -> previous token).
  const focusArc = (() => {
    if (!current.focusNode) return null;
    const focusTokens = tokens.filter((t) => t.owner === current.focusNode);
    if (focusTokens.length === 0) return null; // removed node: no token now
    return focusTokens;
  })();

  const sortedNodes = [...current.nodes].sort();
  const totalKeys = current.keys.length;
  const counts = current.counts;
  const loads = sortedNodes.map((n) => counts[n] || 0);
  const maxLoad = loads.length ? Math.max(...loads) : 0;
  const minLoad = loads.length ? Math.min(...loads) : 0;
  const ideal = sortedNodes.length ? totalKeys / sortedNodes.length : 0;
  const imbalance = ideal > 0 ? Math.round(((maxLoad - ideal) / ideal) * 100) : 0;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  return (
    <div className="chv">
      <div className="chv-head">
        <h3 className="chv-title">Consistent hashing — minimal key movement on membership change</h3>
        <p className="chv-sub">
          Nodes and keys hash onto one ring of {RING} slots. A key belongs to the first node clockwise from it.
          Adding or removing a node only disturbs the keys in one arc — not the whole keyspace.
        </p>
      </div>

      <div className="chv-controls">
        <div className="chv-group">
          <button type="button" className="chv-btn" onClick={addNode}>
            <Plus size={13} /> node
          </button>
          <button type="button" className="chv-btn" onClick={removeNode} disabled={liveNodes.length <= 1}>
            <Minus size={13} /> node
          </button>
          <button type="button" className="chv-btn" onClick={addKey}>
            <Plus size={13} /> key
          </button>
        </div>

        <div className="chv-vnodes">
          <span className="chv-input-label">virtual nodes</span>
          <button type="button" className="chv-btn chv-btn-step" onClick={() => setReplicaCount(-1)} disabled={replicas <= 1}>−</button>
          <span className="chv-vnodes-val">{replicas}×</span>
          <button type="button" className="chv-btn chv-btn-step" onClick={() => setReplicaCount(1)} disabled={replicas >= 4}>+</button>
        </div>

        <label className="chv-speed">
          <span className="chv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="chv-speed-range"
            aria-label="Playback speed"
          />
          <span className="chv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="chv-spacer" aria-hidden="true" />

        <div className="chv-group">
          <button
            type="button"
            className="chv-btn chv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
            disabled={totalSteps <= 1}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="chv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="chv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="chv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="chv-btn" onClick={restart}>
            <RefreshCw size={13} /> Restart
          </button>
        </div>
        <div className="chv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="chv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="chv-svg" preserveAspectRatio="xMidYMid meet">
          {/* ring base */}
          <circle cx={cx} cy={cy} r={R} className="chv-ring" />
          <text x={cx} y={cy - R - 12} className="chv-ring-mark">0 / {RING}</text>
          <text x={cx + R + 8} y={cy + 4} className="chv-ring-mark" textAnchor="start">{Math.round(RING / 4)}</text>
          <text x={cx} y={cy + R + 22} className="chv-ring-mark">{Math.round(RING / 2)}</text>
          <text x={cx - R - 8} y={cy + 4} className="chv-ring-mark" textAnchor="end">{Math.round((RING * 3) / 4)}</text>

          {/* focus arc highlight (owned arc of the node being added/removed) */}
          {focusArc && focusArc.map((t, i) => {
            // arc from previous token's pos to this token's pos
            const sorted = tokens;
            const idx = sorted.indexOf(t);
            const prev = sorted[(idx - 1 + sorted.length) % sorted.length];
            const startPos = prev.pos;
            const endPos = t.pos;
            const sweep = ((endPos - startPos + RING) % RING) || RING;
            const a0 = (startPos / RING) * Math.PI * 2 - Math.PI / 2;
            const a1 = ((startPos + sweep) / RING) * Math.PI * 2 - Math.PI / 2;
            const p0 = { x: cx + Math.cos(a0) * R, y: cy + Math.sin(a0) * R };
            const p1 = { x: cx + Math.cos(a1) * R, y: cy + Math.sin(a1) * R };
            const large = sweep > RING / 2 ? 1 : 0;
            return (
              <path
                key={`arc-${i}`}
                className="chv-focus-arc"
                d={`M ${p0.x} ${p0.y} A ${R} ${R} 0 ${large} 1 ${p1.x} ${p1.y}`}
                style={{ stroke: colorOf(current.focusNode) }}
              />
            );
          })}

          {/* node tokens on the ring */}
          {tokens.map((t, i) => {
            const p = toXY(t.pos, R);
            const isFocus = t.owner === current.focusNode;
            const col = colorOf(t.owner);
            const isV = replicas > 1;
            return (
              <g key={`tok-${t.owner}-${t.vnode}-${i}`}>
                <line x1={cx + (p.x - cx) * 0.9} y1={cy + (p.y - cy) * 0.9} x2={p.x} y2={p.y} className="chv-tick" style={{ stroke: col }} />
                <rect
                  className={`chv-node ${isFocus ? 'is-focus' : ''}`}
                  x={p.x - (isV ? 11 : 15)}
                  y={p.y - (isV ? 11 : 15)}
                  width={isV ? 22 : 30}
                  height={isV ? 22 : 30}
                  rx={isV ? 6 : 8}
                  style={{ fill: col, stroke: col }}
                />
                <text className="chv-node-label" x={p.x} y={p.y + (isV ? 4 : 5)} style={{ fontSize: isV ? 10 : 14 }}>
                  {isV ? `${t.owner}${t.vnode}` : t.owner}
                </text>
              </g>
            );
          })}

          {/* keys on the ring (inner radius), connected to their owner color */}
          {current.keys.map((k, i) => {
            const p = toXY(k.pos, R - 34);
            const owner = current.byKey[k.name];
            const col = owner ? colorOf(owner) : 'var(--text-dim)';
            const moved = movedSet.has(k.name);
            const isFocusKey = current.focusKey === k.name;
            return (
              <g key={`key-${k.name}-${i}`}>
                <circle
                  className={`chv-key ${moved ? 'is-moved' : ''} ${isFocusKey ? 'is-new' : ''}`}
                  cx={p.x}
                  cy={p.y}
                  r={moved || isFocusKey ? 11 : 9}
                  style={{ fill: col, stroke: moved ? 'var(--warning)' : col }}
                />
                <text className="chv-key-label" x={p.x} y={p.y + 3}>{k.name.replace('k', '')}</text>
              </g>
            );
          })}

          {/* right panel: per-node key counts + load bars */}
          <text x={tableX} y={34} className="chv-row-label">key distribution per node</text>
          {sortedNodes.map((n, i) => {
            const y = 50 + i * 34;
            const c = counts[n] || 0;
            const col = colorOf(n);
            const barMax = tableW - 96;
            const barW = totalKeys ? Math.max(4, (c / Math.max(1, maxLoad)) * barMax) : 4;
            const isFocus = n === current.focusNode;
            return (
              <g key={`leg-${n}`}>
                <rect x={tableX} y={y} width={20} height={20} rx={5} style={{ fill: col }} className={isFocus ? 'chv-leg-focus' : ''} />
                <text x={tableX + 28} y={y + 15} className="chv-leg-name">{n}</text>
                <rect x={tableX + 50} y={y + 4} width={barMax} height={12} rx={4} className="chv-bar-bg" />
                <rect x={tableX + 50} y={y + 4} width={barW} height={12} rx={4} style={{ fill: col }} className="chv-bar" />
                <text x={tableX + 50 + barMax + 8} y={y + 15} className="chv-leg-count">{c}</text>
              </g>
            );
          })}
          {/* ideal line */}
          <text x={tableX} y={50 + sortedNodes.length * 34 + 14} className="chv-row-label">
            {totalKeys} keys · ideal {ideal.toFixed(1)}/node · spread {minLoad}–{maxLoad}
          </text>
        </svg>
      </div>

      <div className="chv-metrics">
        <div className="chv-metric">
          <span className="chv-metric-label">nodes</span>
          <span className="chv-metric-value">{sortedNodes.length}</span>
        </div>
        <div className="chv-metric">
          <span className="chv-metric-label">keys</span>
          <span className="chv-metric-value">{totalKeys}</span>
        </div>
        <div className="chv-metric">
          <span className="chv-metric-label">virtual nodes</span>
          <span className="chv-metric-value">{replicas}×</span>
        </div>
        <div className="chv-metric">
          <span className="chv-metric-label">keys moved</span>
          <span className="chv-metric-value is-moved">{current.moved.length}</span>
        </div>
        <div className="chv-metric">
          <span className="chv-metric-label">peak imbalance</span>
          <span className="chv-metric-value">{sortedNodes.length ? `+${imbalance}%` : '—'}</span>
        </div>
      </div>

      <div className="chv-narration">
        <span className="chv-narration-label">trace</span>
        <span className="chv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
