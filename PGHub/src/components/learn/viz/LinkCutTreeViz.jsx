import React, { useMemo, useState } from 'react';
import { RotateCcw, MousePointerClick } from 'lucide-react';
import './LinkCutTreeViz.css';

// Represented rooted tree (parent map). Root = A.
const NODES = {
  A: { x: 360, y: 50, parent: null, depth: 0 },
  B: { x: 230, y: 140, parent: 'A', depth: 1 },
  C: { x: 490, y: 140, parent: 'A', depth: 1 },
  D: { x: 160, y: 240, parent: 'B', depth: 2 },
  E: { x: 320, y: 240, parent: 'B', depth: 2 },
  F: { x: 490, y: 240, parent: 'C', depth: 2 },
  G: { x: 250, y: 330, parent: 'E', depth: 3 },
};

function rootPath(target) {
  const path = [];
  let cur = target;
  while (cur) { path.unshift(cur); cur = NODES[cur].parent; }
  return path;
}

export default function LinkCutTreeViz() {
  // Initial preferred child map: which child each node currently prefers (or null).
  const initialPreferred = useMemo(() => ({ A: 'B', B: 'D', C: 'F', E: 'G' }), []);
  const [preferred, setPreferred] = useState(initialPreferred);
  const [accessed, setAccessed] = useState(null);

  // After access(v): the preferred path becomes exactly root..v.
  function access(v) {
    const path = rootPath(v); // e.g. [A, B, E, G]
    const next = {};
    for (let i = 0; i < path.length - 1; i++) next[path[i]] = path[i + 1];
    // v has no preferred child after access (it is the deepest exposed node).
    setPreferred(next);
    setAccessed(v);
  }

  const reset = () => { setPreferred(initialPreferred); setAccessed(null); };

  // An edge (parent -> child) is "preferred" if preferred[parent] === child.
  const isPreferred = (parent, child) => preferred[parent] === child;
  const exposedPath = accessed ? rootPath(accessed) : [];
  const exposedSet = new Set(exposedPath);

  const W = 640;
  const H = 380;

  return (
    <div className="lctv">
      <div className="lctv-head">
        <h3 className="lctv-title">Link-cut tree — access(v) exposes the root-to-v path</h3>
        <p className="lctv-sub">
          The forest is split into preferred paths (solid), each stored as one splay tree; other children hang off
          a dotted path-parent pointer. Click a node to run access(v) — every edge on root&hellip;v becomes preferred,
          collapsing that path into a single splay tree for an O(log n) query.
        </p>
      </div>

      <div className="lctv-controls">
        <span className="lctv-hint"><MousePointerClick size={14} /> click any node to access(v)</span>
        <div className="lctv-pills">
          {Object.keys(NODES).map((k) => (
            <button key={k} type="button" className={`lctv-pill ${accessed === k ? 'lctv-pill-on' : ''}`} onClick={() => access(k)}>{k}</button>
          ))}
        </div>
        <button type="button" className="lctv-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="lctv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lctv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={10} y={10} width={W - 20} height={H - 20} fill="var(--surface)" stroke="var(--border)" rx={8} />
          {Object.entries(NODES).map(([id, n]) => {
            if (!n.parent) return null;
            const p = NODES[n.parent];
            const pref = isPreferred(n.parent, id);
            const onExposed = exposedSet.has(id) && exposedSet.has(n.parent);
            return (
              <line key={`e-${id}`} x1={p.x} y1={p.y + 22} x2={n.x} y2={n.y - 22}
                stroke={onExposed ? 'var(--accent)' : pref ? 'var(--hue-violet)' : 'var(--border)'}
                strokeWidth={onExposed ? 3.2 : pref ? 2.4 : 1.6}
                strokeDasharray={pref ? '0' : '5 4'}
                opacity={pref || onExposed ? 1 : 0.7} />
            );
          })}
          {Object.entries(NODES).map(([id, n]) => {
            const onExposed = exposedSet.has(id);
            const isTarget = accessed === id;
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            let label = 'var(--text-main)';
            if (isTarget) { fill = 'var(--accent)'; stroke = 'var(--accent)'; label = 'var(--bg)'; }
            else if (onExposed) { fill = 'rgba(var(--accent-rgb), 0.2)'; stroke = 'var(--accent)'; }
            return (
              <g key={id} className="lctv-node" onClick={() => access(id)}>
                <circle cx={n.x} cy={n.y} r={22} fill={fill} stroke={stroke} strokeWidth={isTarget ? 3 : 2} />
                <text x={n.x} y={n.y + 5} className="lctv-node-label" style={{ fill: label }}>{id}</text>
              </g>
            );
          })}
          {/* legend */}
          <g>
            <line x1={W - 200} y1={H - 56} x2={W - 168} y2={H - 56} stroke="var(--hue-violet)" strokeWidth={2.4} />
            <text x={W - 162} y={H - 52} className="lctv-legend">preferred edge</text>
            <line x1={W - 200} y1={H - 36} x2={W - 168} y2={H - 36} stroke="var(--border)" strokeWidth={1.6} strokeDasharray="5 4" />
            <text x={W - 162} y={H - 32} className="lctv-legend">path-parent</text>
          </g>
        </svg>
      </div>

      <div className="lctv-info">
        <div className="lctv-card">
          <span className="lctv-card-tag">exposed splay tree (preferred path containing v)</span>
          <div className="lctv-path">
            {exposedPath.length === 0
              ? <span className="lctv-path-empty">no access yet — preferred paths sit as drawn</span>
              : exposedPath.map((id, i) => (
                <React.Fragment key={id}>
                  <span className="lctv-path-node">{id}</span>
                  {i < exposedPath.length - 1 && <span className="lctv-path-arrow">&rarr;</span>}
                </React.Fragment>
              ))}
          </div>
          <span className="lctv-card-sub">
            {accessed
              ? `After access(${accessed}): root..${accessed} is one splay tree, ${accessed} at the deepest position. Any path aggregate (sum/max/count) is now one splay traversal in O(log n) amortized.`
              : 'access(v) splays v up its path, then splices each path-parent jump so the whole root..v chain joins one splay tree.'}
          </span>
        </div>
      </div>
    </div>
  );
}
