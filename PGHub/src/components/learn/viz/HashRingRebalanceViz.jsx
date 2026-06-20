import React, { useMemo, useState } from 'react';
import { Plus, Minus, RotateCcw, Share2, Server, KeyRound, Move } from 'lucide-react';
import './HashRingRebalanceViz.css';

// Consistent hashing ring. Physical nodes are hashed to many virtual positions
// (vnodes) around a 2^32 ring; each key lands at a hashed position and is owned
// by the first vnode clockwise from it. Adding or removing a node only disturbs
// the keys in the wedges its vnodes capture or vacate — about 1/N of the keyspace,
// the entire point of consistent hashing versus modulo hashing.

const RING_SIZE = 2 ** 32; // positions 0 .. 2^32-1 mapped to angles
const KEY_COUNT = 32; // fixed key set, deterministic positions
const HUES = ['--hue-violet', '--hue-sky', '--hue-pink', '--hue-mint']; // per-node color cycle

// Deterministic 32-bit string hash (FNV-1a style). No Math.random anywhere.
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % RING_SIZE;
}

// A physical node owns vnodeCount virtual positions, each hashed from its label.
function buildVnodes(nodeLabels, vnodeCount) {
  const vnodes = [];
  nodeLabels.forEach((label, idx) => {
    for (let v = 0; v < vnodeCount; v += 1) {
      vnodes.push({
        node: label,
        nodeIndex: idx,
        pos: hash32(`${label}-v-${v}`),
      });
    }
  });
  vnodes.sort((a, b) => a.pos - b.pos);
  return vnodes;
}

const KEYS = Array.from({ length: KEY_COUNT }, (_, k) => ({
  id: k,
  label: `key-${k}`,
  pos: hash32(`key-${k}`),
}));

// First vnode clockwise from a position (wraps around the ring).
function ownerVnode(pos, vnodes) {
  for (let i = 0; i < vnodes.length; i += 1) {
    if (vnodes[i].pos >= pos) return vnodes[i];
  }
  return vnodes[0];
}

// Map every key to its owning physical node label given a vnode layout.
function assignKeys(vnodes) {
  const map = {};
  KEYS.forEach((key) => {
    map[key.id] = vnodes.length ? ownerVnode(key.pos, vnodes).node : null;
  });
  return map;
}

const INITIAL_NODES = ['N1', 'N2', 'N3'];

function nextLabel(existing) {
  let n = existing.length + 1;
  while (existing.includes(`N${n}`)) n += 1;
  return `N${n}`;
}

export default function HashRingRebalanceViz() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [vnodeCount, setVnodeCount] = useState(4);
  const [moved, setMoved] = useState({ ids: new Set(), donors: new Set(), target: null, kind: null });
  const [note, setNote] = useState({
    text: 'Three nodes share the ring, each with several virtual positions. Add or remove a node and watch only the keys in the affected wedges remap — roughly 1/N of the keyspace.',
    tone: 'init',
  });

  const vnodes = useMemo(() => buildVnodes(nodes, vnodeCount), [nodes, vnodeCount]);
  const ownership = useMemo(() => assignKeys(vnodes), [vnodes]);

  const N = nodes.length;
  const idealPct = N > 0 ? (100 / N) : 0;
  const movedPct = (moved.ids.size / KEY_COUNT) * 100;

  const colorFor = (label) => {
    const idx = nodes.indexOf(label);
    return idx >= 0 ? HUES[idx % HUES.length] : '--text-dim';
  };

  // Count keys per node for the load readout.
  const loadByNode = useMemo(() => {
    const counts = {};
    nodes.forEach((label) => { counts[label] = 0; });
    Object.values(ownership).forEach((label) => {
      if (label != null) counts[label] = (counts[label] || 0) + 1;
    });
    return counts;
  }, [ownership, nodes]);

  const addNode = () => {
    const label = nextLabel(nodes);
    const before = ownership;
    const nextNodes = [...nodes, label];
    const nextVnodes = buildVnodes(nextNodes, vnodeCount);
    const after = assignKeys(nextVnodes);

    const ids = new Set();
    const donors = new Set();
    KEYS.forEach((key) => {
      if (before[key.id] !== after[key.id] && after[key.id] === label) {
        ids.add(key.id);
        if (before[key.id]) donors.add(before[key.id]);
      }
    });

    setNodes(nextNodes);
    setMoved({ ids, donors, target: label, kind: 'add' });
    const pct = ((ids.size / KEY_COUNT) * 100).toFixed(0);
    const ideal = (100 / nextNodes.length).toFixed(0);
    setNote({
      text: `Added ${label} — its ${vnodeCount} vnode${vnodeCount > 1 ? 's' : ''} captured ${ids.size} key${ids.size === 1 ? '' : 's'} from ${donors.size} donor${donors.size === 1 ? '' : 's'}, about ${pct}% of the keyspace remapped (ideal 1/${nextNodes.length} ≈ ${ideal}%). Every other key stayed put.`,
      tone: 'add',
    });
  };

  const removeNode = () => {
    if (N <= 2) return;
    const label = nodes[nodes.length - 1];
    const before = ownership;
    const nextNodes = nodes.slice(0, -1);
    const nextVnodes = buildVnodes(nextNodes, vnodeCount);
    const after = assignKeys(nextVnodes);

    const ids = new Set();
    const receivers = new Set();
    KEYS.forEach((key) => {
      if (before[key.id] === label && after[key.id] !== label) {
        ids.add(key.id);
        if (after[key.id]) receivers.add(after[key.id]);
      }
    });

    setNodes(nextNodes);
    setMoved({ ids, donors: receivers, target: null, kind: 'remove' });
    const pct = ((ids.size / KEY_COUNT) * 100).toFixed(0);
    setNote({
      text: `Removed ${label} — its ${ids.size} key${ids.size === 1 ? '' : 's'} rolled to the next vnode clockwise, landing on ${receivers.size} successor${receivers.size === 1 ? '' : 's'}, about ${pct}% of the keyspace remapped. No other node's keys were touched.`,
      tone: 'remove',
    });
  };

  const changeVnodes = (value) => {
    setVnodeCount(value);
    setMoved({ ids: new Set(), donors: new Set(), target: null, kind: null });
    setNote({
      text: `${value} vnode${value > 1 ? 's' : ''} per node. More virtual positions spread each node across the ring, so load evens out and the keys captured by a future join come from many donors instead of one neighbour.`,
      tone: 'init',
    });
  };

  const reset = () => {
    setNodes(INITIAL_NODES);
    setVnodeCount(4);
    setMoved({ ids: new Set(), donors: new Set(), target: null, kind: null });
    setNote({
      text: 'Reset to three nodes. Add or remove a node and watch only the keys in the affected wedges remap.',
      tone: 'init',
    });
  };

  // SVG geometry — the ring centered, keys + vnodes on its rim.
  const W = 960;
  const H = 520;
  const cx = 318;
  const cy = 262;
  const R = 196;
  const keyR = R + 26; // key dots sit just outside the ring
  const vnodeR = R; // vnode ticks on the ring itself

  // position 0 at top, clockwise.
  const posAngle = (pos) => -Math.PI / 2 + (pos / RING_SIZE) * 2 * Math.PI;
  const pointAt = (pos, radius) => {
    const a = posAngle(pos);
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };

  // Colored arcs: each vnode owns the arc from the previous vnode to itself.
  const arcs = vnodes.map((vn, i) => {
    const prev = vnodes[(i - 1 + vnodes.length) % vnodes.length];
    const startPos = prev.pos;
    const endPos = vn.pos;
    const a0 = posAngle(startPos);
    let a1 = posAngle(endPos);
    if (a1 <= a0) a1 += 2 * Math.PI; // wrap segment
    const p0 = { x: cx + R * Math.cos(a0), y: cy + R * Math.sin(a0) };
    const p1 = { x: cx + R * Math.cos(a1), y: cy + R * Math.sin(a1) };
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return {
      key: `${vn.node}-${i}`,
      node: vn.node,
      d: `M ${p0.x} ${p0.y} A ${R} ${R} 0 ${large} 1 ${p1.x} ${p1.y}`,
    };
  });

  const movedDonorsLabel = moved.donors.size
    ? Array.from(moved.donors).join(', ')
    : '—';

  return (
    <div className="hrv">
      <div className="hrv-head">
        <h3 className="hrv-title">Consistent hashing ring — rebalancing on node join and leave</h3>
        <p className="hrv-sub">
          Keys and node vnodes hash onto a ring; each key belongs to the first vnode clockwise. Adding or
          removing a node only remaps the keys in its wedges — about one Nth of the keyspace, not all of it.
        </p>
      </div>

      <div className="hrv-controls">
        <div className="hrv-buttons">
          <button
            type="button"
            className="hrv-btn hrv-btn-primary"
            onClick={addNode}
            title="Add a physical node and remap the keys its vnodes capture"
          >
            <Plus size={14} /> Add node
          </button>
          <button
            type="button"
            className="hrv-btn"
            onClick={removeNode}
            disabled={N <= 2}
            title={N <= 2 ? 'Keep at least two nodes' : 'Remove the last node; its keys roll to successors'}
          >
            <Minus size={14} /> Remove node
          </button>
          <button type="button" className="hrv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <label className="hrv-slider">
          <span className="hrv-input-label">vnodes / node</span>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={vnodeCount}
            onChange={(e) => changeVnodes(Number(e.target.value))}
            className="hrv-slider-range"
            aria-label="Virtual nodes per physical node"
          />
          <span className="hrv-slider-value">{vnodeCount}</span>
        </label>

        <span className="hrv-spacer" aria-hidden="true" />

        <div className="hrv-nodechips" aria-label="Nodes on the ring">
          {nodes.map((label) => (
            <span key={label} className="hrv-nodechip">
              <span className="hrv-nodedot" style={{ background: `var(${colorFor(label)})` }} />
              {label}
              <span className="hrv-nodechip-load">{loadByNode[label] || 0}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="hrv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="hrv-svg" preserveAspectRatio="xMidYMid meet">
          {/* base ring track */}
          <circle className="hrv-track" cx={cx} cy={cy} r={R} />

          {/* colored ownership arcs (one per vnode wedge) */}
          {arcs.map((arc) => (
            <path
              key={`arc-${arc.key}`}
              className="hrv-arc"
              d={arc.d}
              style={{ stroke: `var(${colorFor(arc.node)})` }}
            />
          ))}

          {/* center readout */}
          <text className="hrv-center-k" x={cx} y={cy - 16} textAnchor="middle">ring 0 .. 2^32</text>
          <text className="hrv-center-v" x={cx} y={cy + 14} textAnchor="middle">{`${N} nodes`}</text>
          <text className="hrv-center-s" x={cx} y={cy + 38} textAnchor="middle">{`${vnodeCount} vnodes each`}</text>

          {/* vnode ticks on the ring */}
          {vnodes.map((vn, i) => {
            const inner = pointAt(vn.pos, vnodeR - 11);
            const outer = pointAt(vn.pos, vnodeR + 11);
            const lbl = pointAt(vn.pos, vnodeR - 22);
            const isTarget = moved.target === vn.node;
            return (
              <g key={`vn-${i}`}>
                <line
                  className={`hrv-vtick ${isTarget ? 'is-target' : ''}`}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  style={{ stroke: `var(${colorFor(vn.node)})` }}
                />
                {vnodeCount <= 6 && (
                  <text className="hrv-vlabel" x={lbl.x} y={lbl.y + 3} textAnchor="middle">{vn.node}</text>
                )}
              </g>
            );
          })}

          {/* keys on the outer rim */}
          {KEYS.map((key) => {
            const p = pointAt(key.pos, keyR);
            const owner = ownership[key.id];
            const isMoved = moved.ids.has(key.id);
            return (
              <g key={`key-${key.id}`}>
                <circle
                  className={`hrv-key ${isMoved ? 'is-moved' : ''}`}
                  cx={p.x}
                  cy={p.y}
                  r={isMoved ? 8 : 6}
                  style={{ fill: `var(${colorFor(owner)})` }}
                />
                {isMoved && (
                  <circle className="hrv-key-ring" cx={p.x} cy={p.y} r={12} />
                )}
              </g>
            );
          })}
        </svg>

        <div className="hrv-side">
          <div className="hrv-side-title">
            <Move size={14} className="hrv-ic" /> last operation
          </div>
          <div className="hrv-op">
            <span className={`hrv-op-tag is-${moved.kind || 'idle'}`}>
              {moved.kind === 'add' ? `joined ${moved.target}` : moved.kind === 'remove' ? 'left' : 'no change yet'}
            </span>
          </div>
          <div className="hrv-side-row">
            <span className="hrv-side-k">keys moved</span>
            <span className="hrv-side-v is-accent">{moved.ids.size}</span>
          </div>
          <div className="hrv-side-row">
            <span className="hrv-side-k">{moved.kind === 'remove' ? 'receivers' : 'donors'}</span>
            <span className="hrv-side-v">{movedDonorsLabel}</span>
          </div>
          <div className="hrv-side-row">
            <span className="hrv-side-k">% remapped</span>
            <span className={`hrv-side-v ${movedPct > idealPct * 2.2 ? 'is-warn' : 'is-ok'}`}>
              {movedPct.toFixed(1)}%
            </span>
          </div>
          <div className="hrv-side-row">
            <span className="hrv-side-k">ideal 1/N</span>
            <span className="hrv-side-v is-dim">{idealPct.toFixed(1)}%</span>
          </div>
          <div className="hrv-bars">
            <div className="hrv-bar-row">
              <span className="hrv-bar-label">moved</span>
              <span className="hrv-bar-track">
                <span className="hrv-bar-fill is-actual" style={{ width: `${Math.min(100, movedPct)}%` }} />
              </span>
            </div>
            <div className="hrv-bar-row">
              <span className="hrv-bar-label">ideal</span>
              <span className="hrv-bar-track">
                <span className="hrv-bar-fill is-ideal" style={{ width: `${Math.min(100, idealPct)}%` }} />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="hrv-metrics">
        <div className="hrv-metric">
          <span className="hrv-metric-label">nodes (N)</span>
          <span className="hrv-metric-value">{N}</span>
        </div>
        <div className="hrv-metric">
          <span className="hrv-metric-label">vnodes / node</span>
          <span className="hrv-metric-value">{vnodeCount}</span>
        </div>
        <div className="hrv-metric">
          <span className="hrv-metric-label">total keys</span>
          <span className="hrv-metric-value">{KEY_COUNT}</span>
        </div>
        <div className="hrv-metric">
          <span className="hrv-metric-label">keys moved (last)</span>
          <span className="hrv-metric-value is-accent">{moved.ids.size}</span>
        </div>
        <div className="hrv-metric">
          <span className="hrv-metric-label">% remapped</span>
          <span className={`hrv-metric-value ${movedPct > idealPct * 2.2 ? 'is-warn' : 'is-ok'}`}>
            {movedPct.toFixed(1)}%
          </span>
        </div>
        <div className="hrv-metric hrv-metric-dim">
          <span className="hrv-metric-label">ideal 1/N</span>
          <span className="hrv-metric-value">{idealPct.toFixed(1)}%</span>
        </div>
      </div>

      <div className={`hrv-narration is-${note.tone}`}>
        <span className={`hrv-narration-label is-${note.tone}`}>
          {note.tone === 'add' ? 'joined' : note.tone === 'remove' ? 'left' : 'ring'}
        </span>
        <span className="hrv-narration-body">{note.text}</span>
      </div>

      <div className="hrv-legend">
        <span className="hrv-legend-item"><Share2 size={13} className="hrv-ic" /> arcs = ownership wedges, colored by node</span>
        <span className="hrv-legend-item"><Server size={13} className="hrv-ic" /> ticks = vnode positions on the ring</span>
        <span className="hrv-legend-item"><KeyRound size={13} className="hrv-ic" /> dots = keys, colored by current owner</span>
        <span className="hrv-legend-item"><Move size={13} className="hrv-ic is-accent" /> ringed dot = key that just moved</span>
      </div>
    </div>
  );
}
