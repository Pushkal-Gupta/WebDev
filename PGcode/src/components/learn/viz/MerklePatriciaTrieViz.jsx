import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Plus, Search, Hash, GitBranch, ShieldCheck,
} from 'lucide-react';
import './MerklePatriciaTrieViz.css';

// Merkle Patricia Trie — the structure Ethereum uses for its state tree. Two
// ideas fused:
//   1. Patricia / radix trie: keys are walked nibble by nibble (a nibble = one
//      hex digit). Keys that share a prefix share a path; where they diverge a
//      BRANCH node fans out by the next nibble. A node holding only one child
//      collapses that child's nibbles into an EXTENSION so we never store a
//      chain of single-child nodes.
//   2. Merkle hashing: every node's identity is the hash of its contents, and a
//      branch's contents include the hashes of its children. So a node's hash
//      depends on the hash of everything beneath it. Change one leaf and the
//      hash change ripples all the way up to a brand-new ROOT HASH.
//
// The payoff is the Merkle proof: to convince a verifier that key K maps to
// value V, you don't ship the whole trie — you ship the chain of nodes from the
// root down to K's leaf. The verifier re-hashes that chain bottom-up and checks
// the result equals the trusted root hash. O(depth) data proves one key.
//
// All hashes here are short deterministic 4-hex digests (a toy hash, not keccak)
// so the viz is reproducible and the ripple is visible.

// Deterministic toy hash -> 4 hex chars. Stable across runs, no Math.random.
function toyHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0').slice(0, 4);
}

// A node: { id, kind:'branch'|'leaf', nibble, label, value?, children:[ids],
//           parent, hash, depth }. We keep the trie tiny and pre-shaped per
// insert step so layout is deterministic.
//
// Keys are 2-nibble hex strings for clarity. Inserts (in order):
//   a7 -> "alice"   ab -> "bob"   f2 -> "carol"   a9 -> "dave"
// "a7","ab","a9" share the first nibble 'a' -> they branch on the 2nd nibble
// under a shared 'a' path. "f2" lives off the root's 'f' slot.

const INSERTS = [
  { key: 'a7', value: 'alice' },
  { key: 'ab', value: 'bob' },
  { key: 'f2', value: 'carol' },
  { key: 'a9', value: 'dave' },
];

// Build the trie state after `count` inserts as a flat node map + layout.
// Returns { nodes:[...], rootHash, leaves:{key->id} }.
function buildTrie(count) {
  const entries = INSERTS.slice(0, count);
  // group by first nibble
  const byFirst = {};
  entries.forEach((e) => {
    const f = e.key[0];
    if (!byFirst[f]) byFirst[f] = [];
    byFirst[f].push(e);
  });

  const nodes = [];
  let uid = 0;
  const newId = () => { uid += 1; return `n${uid}`; };
  const leaves = {};

  const root = { id: newId(), kind: 'branch', nibble: '', label: 'root', children: [], parent: null, depth: 0 };
  nodes.push(root);

  Object.keys(byFirst).sort().forEach((first) => {
    const group = byFirst[first];
    if (group.length === 1) {
      // single leaf hanging off the root slot `first`
      const e = group[0];
      const leaf = {
        id: newId(), kind: 'leaf', nibble: e.key, label: e.key, value: e.value,
        children: [], parent: root.id, depth: 1,
      };
      nodes.push(leaf);
      root.children.push(leaf.id);
      leaves[e.key] = leaf.id;
    } else {
      // shared prefix `first` -> extension/branch node, then leaves on 2nd nibble
      const branch = {
        id: newId(), kind: 'branch', nibble: first, label: `${first}_`,
        children: [], parent: root.id, depth: 1,
      };
      nodes.push(branch);
      root.children.push(branch.id);
      group.forEach((e) => {
        const leaf = {
          id: newId(), kind: 'leaf', nibble: e.key, label: e.key, value: e.value,
          children: [], parent: branch.id, depth: 2,
        };
        nodes.push(leaf);
        branch.children.push(leaf.id);
        leaves[e.key] = leaf.id;
      });
    }
  });

  // compute hashes bottom-up: leaf hash = H(key|value); branch hash = H(nibble|child hashes)
  const map = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const hashOf = (id) => {
    const n = map[id];
    if (n.kind === 'leaf') {
      n.hash = toyHash(`${n.nibble}:${n.value}`);
      return n.hash;
    }
    const childHashes = n.children.map((c) => hashOf(c)).join('');
    n.hash = toyHash(`${n.nibble || 'R'}:${childHashes}`);
    return n.hash;
  };
  const rootHash = nodes.length ? hashOf(root.id) : '----';

  return { nodes, rootHash, leaves, map };
}

// Build the frame list. Each frame is a snapshot of the trie plus which nodes
// are highlighted (insert path or proof path) and a note.
function buildFrames() {
  const frames = [];

  frames.push({
    phase: 'init',
    count: 0,
    highlight: [],
    proof: [],
    rippled: [],
    lookupKey: null,
    note: 'An empty Merkle Patricia Trie. Each key is walked one hex nibble at a time; every node carries a hash of its contents, and a branch hashes in its children, so the single ROOT HASH summarizes the entire tree. Step to insert keys and watch the root recompute.',
  });

  // Insert frames
  INSERTS.forEach((e, i) => {
    const count = i + 1;
    const trie = buildTrie(count);
    const leafId = trie.leaves[e.key];
    // path from root to the new leaf = the nodes whose hash changed (rippled)
    const path = [];
    let cur = leafId;
    while (cur) { path.unshift(cur); cur = trie.map[cur].parent; }
    frames.push({
      phase: 'insert',
      count,
      key: e.key,
      value: e.value,
      highlight: [leafId],
      proof: [],
      rippled: path,
      lookupKey: null,
      note: `Insert key ${e.key} -> "${e.value}". The trie walks the nibbles ${e.key.split('').join(', ')}${i === 1 ? ` — it shares the first nibble '${e.key[0]}' with ${INSERTS[0].key}, so a branch node forms and both diverge on the second nibble.` : i === 3 ? ` — '${e.key[0]}' is already a branch, so ${e.key} just adds a third leaf there.` : '.'} A new leaf hash is computed, and every ancestor up to the root re-hashes (highlighted) — that is the Merkle ripple producing root hash ${trie.rootHash}.`,
    });
  });

  // Merkle proof for key a9 ("dave")
  const full = buildTrie(INSERTS.length);
  const proofKey = 'a9';
  const proofLeaf = full.leaves[proofKey];
  const proofPath = [];
  let c = proofLeaf;
  while (c) { proofPath.unshift(c); c = full.map[c].parent; }

  frames.push({
    phase: 'lookup',
    count: INSERTS.length,
    highlight: [proofLeaf],
    proof: proofPath,
    rippled: [],
    lookupKey: proofKey,
    note: `Lookup ${proofKey}. Walk from the root following nibble '${proofKey[0]}' to the branch, then nibble '${proofKey[1]}' to the leaf holding "dave". The highlighted chain root -> branch -> leaf is exactly the Merkle proof for this key.`,
  });

  frames.push({
    phase: 'proof',
    count: INSERTS.length,
    highlight: [proofLeaf],
    proof: proofPath,
    rippled: proofPath,
    lookupKey: proofKey,
    note: `Merkle proof. To prove ${proofKey} maps to "dave" WITHOUT the whole trie, ship only these ${proofPath.length} nodes plus the sibling hashes at each branch. A verifier re-hashes bottom-up — leaf hash, then the branch with its children, then the root — and checks the result equals the trusted root hash ${full.rootHash}. O(depth) data, not O(n), proves one key. Tamper with any node and the recomputed root no longer matches.`,
  });

  return frames;
}

const RUN_DELAY_MS = 1700;

// layout columns by trie depth (root, nibble-1 branch, nibble-2 leaf)
const COL_X = [120, 420, 720];
const NODE_R = 30;
const LAYOUT_H = 440;

export default function MerklePatriciaTrieViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / Math.max(speed, 0.1));

  const trie = useMemo(() => buildTrie(current.count), [current.count]);

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

  const reset = () => { setIsRunning(false); setStep(0); };
  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // ---- layout ----
  // place nodes by depth (x) and within-depth order (y).
  const W = 940;
  const H = LAYOUT_H;
  const colX = COL_X;
  const nodeR = NODE_R;

  // group nodes by depth and assign positions in one memo keyed on `trie`.
  const pos = useMemo(() => {
    const byDepth = {};
    trie.nodes.forEach((n) => {
      if (!byDepth[n.depth]) byDepth[n.depth] = [];
      byDepth[n.depth].push(n);
    });
    const p = {};
    Object.keys(byDepth).forEach((depthKey) => {
      const depth = Number(depthKey);
      const col = byDepth[depth];
      const n = col.length;
      const top = 70;
      const bottom = LAYOUT_H - 70;
      const span = bottom - top;
      col.forEach((node, i) => {
        const y = n === 1 ? (top + bottom) / 2 : top + (span * i) / (n - 1);
        p[node.id] = { x: COL_X[Math.min(depth, COL_X.length - 1)], y };
      });
    });
    return p;
  }, [trie]);

  const rippledSet = new Set(current.rippled);
  const proofSet = new Set(current.proof);
  const highlightSet = new Set(current.highlight);

  return (
    <div className="mptv">
      <div className="mptv-head">
        <h3 className="mptv-title">Merkle Patricia Trie — one root hash for the whole state</h3>
        <p className="mptv-sub">
          Keys branch on shared nibbles; every node hashes its children, so a single root hash commits to
          the entire tree. Insert keys to watch the root recompute, then walk a Merkle proof that verifies
          one key without the whole trie.
        </p>
      </div>

      <div className="mptv-controls">
        <div className="mptv-rootbox">
          <Hash size={13} className="mptv-ic is-root" />
          <span className="mptv-input-label">root hash</span>
          <span className="mptv-roothash">{trie.rootHash}</span>
        </div>

        <label className="mptv-speed">
          <span className="mptv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mptv-speed-range"
            aria-label="Playback speed"
          />
          <span className="mptv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="mptv-spacer" aria-hidden="true" />

        <div className="mptv-buttons">
          <button
            type="button"
            className="mptv-btn mptv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="mptv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="mptv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="mptv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="mptv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="mptv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mptv-svg" preserveAspectRatio="xMidYMid meet">
          {/* column captions */}
          <text className="mptv-col" x={colX[0]} y={36} textAnchor="middle">root</text>
          <text className="mptv-col" x={colX[1]} y={36} textAnchor="middle">nibble 1 (branch)</text>
          <text className="mptv-col" x={colX[2]} y={36} textAnchor="middle">nibble 2 (leaf)</text>

          {/* edges */}
          {trie.nodes.map((n) => n.children.map((cid) => {
            const a = pos[n.id];
            const b = pos[cid];
            if (!a || !b) return null;
            const onProof = proofSet.has(n.id) && proofSet.has(cid);
            const onRipple = rippledSet.has(n.id) && rippledSet.has(cid);
            const tone = onProof ? 'is-proof' : onRipple ? 'is-ripple' : '';
            const childNibble = trie.map[cid].nibble.slice(trie.map[cid].depth - 1, trie.map[cid].depth) || trie.map[cid].nibble[0];
            return (
              <g key={`e-${n.id}-${cid}`}>
                <line
                  className={`mptv-edge ${tone}`}
                  x1={a.x + nodeR}
                  y1={a.y}
                  x2={b.x - nodeR}
                  y2={b.y}
                />
                <text
                  className="mptv-edge-nib"
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 6}
                  textAnchor="middle"
                >
                  {childNibble}
                </text>
              </g>
            );
          }))}

          {/* nodes */}
          {trie.nodes.map((n) => {
            const p = pos[n.id];
            if (!p) return null;
            const onProof = proofSet.has(n.id);
            const onRipple = rippledSet.has(n.id);
            const isHi = highlightSet.has(n.id);
            const tone = onProof ? 'is-proof' : onRipple ? 'is-ripple' : isHi ? 'is-hi' : '';
            return (
              <g key={`node-${n.id}`}>
                <circle className={`mptv-node ${n.kind === 'leaf' ? 'is-leaf' : 'is-branch'} ${tone}`} cx={p.x} cy={p.y} r={nodeR} />
                <g transform={`translate(${p.x - 9}, ${p.y - 20})`}>
                  {n.kind === 'leaf'
                    ? <ShieldCheck width={16} height={16} className="mptv-node-ic is-leaf" />
                    : <GitBranch width={16} height={16} className="mptv-node-ic is-branch" />}
                </g>
                <text className="mptv-node-label" x={p.x} y={p.y + 4} textAnchor="middle">
                  {n.kind === 'branch' && n.depth === 0 ? 'root' : n.label}
                </text>
                <text className={`mptv-node-hash ${tone}`} x={p.x} y={p.y + nodeR + 14} textAnchor="middle">
                  {`#${n.hash}`}
                </text>
                {n.kind === 'leaf' && (
                  <text className="mptv-node-val" x={p.x} y={p.y + nodeR + 27} textAnchor="middle">
                    {`"${n.value}"`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mptv-metrics">
        <div className="mptv-metric">
          <span className="mptv-metric-label">phase</span>
          <span className="mptv-metric-value">{current.phase === 'insert' ? `insert ${current.key}` : current.phase === 'init' ? 'empty' : current.phase}</span>
        </div>
        <div className="mptv-metric">
          <span className="mptv-metric-label">keys stored</span>
          <span className="mptv-metric-value">{current.count}</span>
        </div>
        <div className="mptv-metric">
          <span className="mptv-metric-label">root hash</span>
          <span className="mptv-metric-value is-root">{`#${trie.rootHash}`}</span>
        </div>
        <div className="mptv-metric">
          <span className="mptv-metric-label">re-hashed nodes</span>
          <span className="mptv-metric-value">{current.rippled.length}</span>
        </div>
        <div className="mptv-metric mptv-metric-dim">
          <span className="mptv-metric-label">proof size</span>
          <span className={`mptv-metric-value ${current.proof.length ? 'is-ok' : ''}`}>{current.proof.length ? `${current.proof.length} nodes (O(depth))` : '—'}</span>
        </div>
      </div>

      <div className={`mptv-narration ${current.phase === 'proof' ? 'is-ok' : ''}`}>
        <span className={`mptv-narration-label ${current.phase === 'proof' ? 'is-ok' : ''}`}>
          {current.phase === 'insert' ? `insert ${current.key}` : current.phase}
        </span>
        <span className="mptv-narration-body">{current.note}</span>
      </div>

      <div className="mptv-legend">
        <span className="mptv-legend-item"><GitBranch size={13} className="mptv-ic is-branch" /> branch — fans out on the next nibble</span>
        <span className="mptv-legend-item"><ShieldCheck size={13} className="mptv-ic is-leaf" /> leaf — holds the value, hashes key|value</span>
        <span className="mptv-legend-item"><Plus size={13} className="mptv-ic is-ripple" /> ripple — ancestors re-hash to a new root</span>
        <span className="mptv-legend-item"><Search size={13} className="mptv-ic is-proof" /> proof path — verifies one key, O(depth)</span>
      </div>
    </div>
  );
}
