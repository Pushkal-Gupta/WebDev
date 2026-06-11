import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Minus, Undo2, RotateCcw } from 'lucide-react';
import './PersistentStackViz.css';

const SEED = 0xBADF00D;
const INITIAL_PUSHES = [3, 7, 1, 8, 4, 2];
const MAX_NODES = 12;

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

/*
 * Persistent stack — linked-list backing, structural sharing.
 * Each node: { id, value, next: nodeId|null }.
 * Each version: { head: nodeId|null, op: string }.
 * pop returns the previous version's head (no new node allocated).
 * push allocates a single new node whose `next` points at the previous head.
 */

function buildInitialState() {
  const nodes = []; // { id, value, next }
  const versions = [{ head: null, op: 'init' }];
  let nextId = 0;

  const push = (val) => {
    const node = { id: nextId++, value: val, next: versions[versions.length - 1].head };
    nodes.push(node);
    versions.push({ head: node.id, op: `push(${val})` });
  };

  for (const v of INITIAL_PUSHES) push(v);
  return { nodes, versions, nextId };
}

function deepCloneState(s) {
  return {
    nodes: s.nodes.map(n => ({ ...n })),
    versions: s.versions.map(v => ({ ...v })),
    nextId: s.nextId,
  };
}

function applyPush(state, val) {
  const s = deepCloneState(state);
  const head = s.versions[s.versions.length - 1].head;
  const node = { id: s.nextId++, value: val, next: head };
  s.nodes.push(node);
  s.versions.push({ head: node.id, op: `push(${val})` });
  return s;
}

function applyPop(state) {
  const s = deepCloneState(state);
  const cur = s.versions[s.versions.length - 1];
  if (cur.head === null) {
    s.versions.push({ head: null, op: 'pop (empty — no change)' });
    return s;
  }
  const headNode = s.nodes.find(n => n.id === cur.head);
  s.versions.push({ head: headNode.next, op: `pop → ${headNode.value}` });
  return s;
}

function applyUndo(state) {
  if (state.versions.length <= 1) return state;
  const s = deepCloneState(state);
  s.versions.pop();
  return s;
}

function getReachableNodeIds(state, showShared) {
  if (showShared) {
    // Every node currently allocated.
    return new Set(state.nodes.map(n => n.id));
  }
  // Only nodes reachable from any version's head.
  const set = new Set();
  const next = (id) => {
    const n = state.nodes.find(x => x.id === id);
    return n ? n.next : null;
  };
  for (const v of state.versions) {
    let cur = v.head;
    while (cur !== null && !set.has(cur)) {
      set.add(cur);
      cur = next(cur);
    }
  }
  return set;
}

/*
 * Layout: shared-node view.
 * - Lay out every alive node on a single horizontal axis, ordered by their depth
 *   from any deepest version's head.
 * - We compute the depth of each node as max over all version heads of position-in-chain.
 * - Then nodes get x by depth. Version heads draw an arrow down to their head node.
 */
function layoutShared(state) {
  const nodeById = {};
  for (const n of state.nodes) nodeById[n.id] = n;

  // depth of node = distance from head of the longest chain that contains it.
  // Compute by walking each version chain and recording max position-from-bottom.
  const positionFromBottom = {}; // node id → smallest distance from list bottom (so bottom = 0)
  for (const v of state.versions) {
    // walk chain to count length
    const chain = [];
    let cur = v.head;
    while (cur !== null) {
      chain.push(cur);
      cur = nodeById[cur]?.next ?? null;
    }
    // chain[0] is head (top of stack), chain[chain.length-1] is bottom.
    chain.forEach((id, idx) => {
      const fromBottom = chain.length - 1 - idx;
      if (positionFromBottom[id] === undefined || positionFromBottom[id] < fromBottom) {
        positionFromBottom[id] = fromBottom;
      }
    });
  }

  const aliveIds = Object.keys(positionFromBottom).map(Number);
  const maxPos = aliveIds.length > 0 ? Math.max(...aliveIds.map(id => positionFromBottom[id])) : 0;

  const nodeR = 18;
  const nodeGap = 70;
  const leftPad = 200;
  const rightPad = 40;
  const topPad = 40;
  const versionRowGap = 36;

  const nodeY = topPad + (state.versions.length) * versionRowGap + 30;

  const nodePos = {};
  for (const id of aliveIds) {
    const x = leftPad + (maxPos - positionFromBottom[id]) * nodeGap;
    nodePos[id] = { x, y: nodeY };
  }

  const W = leftPad + (maxPos + 1) * nodeGap + rightPad;
  const H = nodeY + nodeR + 50;

  return { nodePos, W, H, nodeR, leftPad, topPad, versionRowGap, nodeY };
}

export default function PersistentStackViz() {
  const [state, setState] = useState(() => buildInitialState());
  const [pushInput, setPushInput] = useState('5');
  const [showShared, setShowShared] = useState(true);
  const [highlightVersion, setHighlightVersion] = useState(() => buildInitialState().versions.length - 1);
  const [flash, setFlash] = useState(null); // { op: 'push'|'pop'|'undo', detail }
  const flashTimer = useRef(null);

  const rng = useMemo(() => mulberry32(SEED), []);
  void rng;

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const doFlash = (op, detail) => {
    setFlash({ op, detail });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1100);
  };

  const doPush = () => {
    const v = pushInput.trim();
    if (v === '') return;
    const next = applyPush(state, v);
    if (next.nodes.length > MAX_NODES) return;
    setState(next);
    setHighlightVersion(next.versions.length - 1);
    doFlash('push', v);
  };

  const doPop = () => {
    const next = applyPop(state);
    setState(next);
    setHighlightVersion(next.versions.length - 1);
    doFlash('pop', null);
  };

  const doUndo = () => {
    if (state.versions.length <= 1) return;
    const next = applyUndo(state);
    setState(next);
    setHighlightVersion(Math.min(highlightVersion, next.versions.length - 1));
    doFlash('undo', null);
  };

  const doReset = () => {
    const fresh = buildInitialState();
    setState(fresh);
    setHighlightVersion(fresh.versions.length - 1);
    setFlash(null);
  };

  const reachable = useMemo(() => getReachableNodeIds(state, showShared), [state, showShared]);

  const layout = useMemo(() => layoutShared(state), [state]);
  const { nodePos, W, H, nodeR, leftPad, topPad, versionRowGap, nodeY } = layout;

  const nodeById = useMemo(() => {
    const m = {};
    for (const n of state.nodes) m[n.id] = n;
    return m;
  }, [state.nodes]);

  // Compute which nodes belong to each version chain
  const versionChains = useMemo(() => {
    return state.versions.map(v => {
      const chain = [];
      let cur = v.head;
      while (cur !== null) {
        chain.push(cur);
        cur = nodeById[cur]?.next ?? null;
      }
      return chain;
    });
  }, [state.versions, nodeById]);

  // Which nodes are shared among multiple versions (for legend coloring)
  const nodeRefCount = useMemo(() => {
    const cnt = {};
    versionChains.forEach(ch => ch.forEach(id => { cnt[id] = (cnt[id] || 0) + 1; }));
    return cnt;
  }, [versionChains]);

  const sharedNodes = useMemo(() => {
    return new Set(Object.entries(nodeRefCount).filter(([, c]) => c > 1).map(([id]) => Number(id)));
  }, [nodeRefCount]);

  // Version row y positions
  const versionY = (i) => topPad + i * versionRowGap;

  // Edges from each version head down to its head node, plus chain edges between nodes.
  const nodeChainEdges = useMemo(() => {
    const edges = [];
    for (const n of state.nodes) {
      if (!reachable.has(n.id)) continue;
      if (n.next !== null && reachable.has(n.next)) {
        edges.push({ from: n.id, to: n.next });
      }
    }
    return edges;
  }, [state.nodes, reachable]);

  const currentVersion = state.versions[highlightVersion];
  const currentChain = versionChains[highlightVersion];

  // text strip for current version stack from top to bottom
  const currentStackStr = currentChain
    .map(id => nodeById[id].value)
    .join(' → ') || '(empty)';

  return (
    <div className="psv">
      <div className="psv-head">
        <h3 className="psv-title">Persistent stack — immutable versions with structural sharing</h3>
        <p className="psv-sub">
          A push allocates one node and points at the previous head; a pop returns the previous version. Every version v<sub>0</sub>…v<sub>n</sub> shares the same backing list, so n persistent versions cost O(n) total, not O(n²).
        </p>
      </div>

      <div className="psv-controls">
        <div className="psv-field">
          <span className="psv-label">push value</span>
          <input
            className="psv-input"
            value={pushInput}
            onChange={(e) => setPushInput(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="psv-buttons">
          <button type="button" className="psv-btn psv-btn-primary" onClick={doPush} disabled={!pushInput.trim() || state.nodes.length >= MAX_NODES}>
            <Plus size={14} /> Push
          </button>
          <button type="button" className="psv-btn" onClick={doPop}>
            <Minus size={14} /> Pop
          </button>
          <button type="button" className="psv-btn" onClick={doUndo} disabled={state.versions.length <= 1}>
            <Undo2 size={14} /> Undo
          </button>
          <button type="button" className="psv-btn" onClick={doReset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <label className="psv-toggle">
          <input type="checkbox" checked={showShared} onChange={(e) => setShowShared(e.target.checked)} />
          show shared nodes
        </label>

        <div className="psv-actions">
          <div className="psv-stepcount">
            versions <strong>{state.versions.length}</strong> · nodes alive <strong>{reachable.size}</strong>
          </div>
        </div>
      </div>

      <div className="psv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="psv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="psv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker id="psv-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--easy)" />
            </marker>
            <marker id="psv-arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--border)" />
            </marker>
          </defs>

          {/* version labels + head-arrow indicators */}
          {state.versions.map((v, i) => {
            const y = versionY(i);
            const isHighlight = i === highlightVersion;
            return (
              <g key={`v-${i}`}>
                <text x={140} y={y + 4} className="psv-version-label" fill={isHighlight ? 'var(--accent)' : 'var(--text-dim)'}>
                  v{i} · {v.op}
                </text>
                {v.head !== null && nodePos[v.head] ? (
                  <line
                    x1={nodePos[v.head].x}
                    y1={y + 8}
                    x2={nodePos[v.head].x}
                    y2={nodeY - nodeR - 2}
                    stroke={isHighlight ? 'var(--easy)' : 'var(--border)'}
                    strokeWidth={isHighlight ? 2 : 1}
                    strokeDasharray={isHighlight ? '0' : '3 3'}
                    markerEnd={isHighlight ? 'url(#psv-arrow-active)' : 'url(#psv-arrow-dim)'}
                    opacity={isHighlight ? 1 : 0.55}
                    onClick={() => setHighlightVersion(i)}
                  />
                ) : (
                  <text x={leftPad} y={y + 4} fontSize="11" fontFamily="var(--mono)" fill={isHighlight ? 'var(--accent)' : 'var(--text-dim)'}>
                    (empty)
                  </text>
                )}
                {/* clickable rect over label */}
                <rect
                  x={20}
                  y={y - 11}
                  width={130}
                  height={22}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setHighlightVersion(i)}
                />
              </g>
            );
          })}

          {/* chain edges between nodes */}
          {nodeChainEdges.map((e, idx) => {
            const a = nodePos[e.from];
            const b = nodePos[e.to];
            if (!a || !b) return null;
            const inCurrent = currentChain.includes(e.from) && nodeById[e.from].next === e.to;
            const x1 = a.x - nodeR;
            const x2 = b.x + nodeR;
            return (
              <line
                key={`ce-${idx}`}
                x1={x1}
                y1={a.y}
                x2={x2}
                y2={b.y}
                stroke={inCurrent ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={inCurrent ? 1.8 : 1.2}
                opacity={inCurrent ? 1 : 0.55}
                markerEnd={inCurrent ? 'url(#psv-arrow)' : 'url(#psv-arrow-dim)'}
              />
            );
          })}

          {/* nodes */}
          {Object.entries(nodePos).map(([id, p]) => {
            const nid = Number(id);
            const node = nodeById[nid];
            if (!node) return null;
            const inCurrent = currentChain.includes(nid);
            const isShared = sharedNodes.has(nid);
            const isHead = currentVersion.head === nid;
            const fill = isHead
              ? 'var(--easy)'
              : inCurrent
              ? 'rgba(var(--accent-rgb), 0.22)'
              : isShared
              ? 'rgba(var(--accent-rgb), 0.10)'
              : 'var(--surface)';
            const stroke = isHead
              ? 'var(--easy)'
              : inCurrent
              ? 'var(--accent)'
              : isShared
              ? 'var(--accent)'
              : 'var(--border)';
            const textFill = isHead ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`n-${id}`}>
                <circle cx={p.x} cy={p.y} r={nodeR} fill={fill} stroke={stroke} strokeWidth={isHead || inCurrent ? 2 : 1.4} />
                <text x={p.x} y={p.y} className="psv-node-label" fill={textFill}>{node.value}</text>
                {isShared && (
                  <text x={p.x} y={p.y + nodeR + 14} fontSize="9" fontFamily="var(--mono)" fill="var(--hue-pink)" textAnchor="middle">
                    refs: {nodeRefCount[nid]}
                  </text>
                )}
              </g>
            );
          })}

          {/* x-axis label */}
          <text x={leftPad - 12} y={nodeY + 4} className="psv-row-label" textAnchor="end">backing list</text>

          {/* flash indicator (e.g. just pushed) */}
          {flash && currentVersion.head !== null && nodePos[currentVersion.head] && flash.op === 'push' && (
            <circle
              cx={nodePos[currentVersion.head].x}
              cy={nodePos[currentVersion.head].y}
              r={nodeR + 7}
              fill="none"
              stroke="var(--easy)"
              strokeWidth="2"
              opacity="0.7"
              strokeDasharray="3 2"
            />
          )}
        </svg>
      </div>

      <div className="psv-metrics">
        <div className="psv-metric">
          <span className="psv-metric-label">current version</span>
          <span className="psv-metric-value">v{highlightVersion}</span>
        </div>
        <div className="psv-metric">
          <span className="psv-metric-label">stack depth</span>
          <span className="psv-metric-value">{currentChain.length}</span>
        </div>
        <div className="psv-metric">
          <span className="psv-metric-label">shared nodes</span>
          <span className="psv-metric-value">{sharedNodes.size}</span>
        </div>
        <div className="psv-metric">
          <span className="psv-metric-label">total alive</span>
          <span className="psv-metric-value">{reachable.size}</span>
        </div>
        <div className="psv-metric psv-metric-dim">
          <span className="psv-metric-label">last op</span>
          <span className="psv-metric-value psv-metric-dimval">{currentVersion.op}</span>
        </div>
      </div>

      <div className="psv-arith">
        <span className="psv-arith-label">v{highlightVersion} (top → bottom)</span>
        <span className="psv-arith-vals">{currentStackStr}</span>
      </div>
    </div>
  );
}
