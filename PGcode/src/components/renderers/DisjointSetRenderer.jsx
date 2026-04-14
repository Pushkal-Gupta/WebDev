import React, { useMemo } from 'react';
import './Renderers.css';

const NODE_R = 20;
const LEVEL_H = 64;
const SPREAD = 70;

const stateColors = {
  default: { fill: 'var(--surface)', stroke: 'var(--border)', text: 'var(--text-dim)' },
  current: { fill: 'rgba(0, 255, 245, 0.15)', stroke: 'var(--accent)', text: 'var(--accent)' },
  root: { fill: 'rgba(34, 197, 94, 0.12)', stroke: 'var(--easy)', text: 'var(--easy)' },
  merging: { fill: 'rgba(240, 165, 0, 0.15)', stroke: 'var(--medium)', text: 'var(--medium)' },
};

/**
 * data shape:
 * {
 *   type: 'disjoint-set',
 *   parent: [0, 0, 1, 3, 3],          // parent[i] = i's parent (i if root)
 *   labels: ['A','B','C','D','E'],     // optional display labels per index
 *   highlights: [2, 3],                // optional highlighted node indices
 *   merging: [1, 3],                   // optional pair currently being unioned
 *   status: 'text'
 * }
 */
export default function DisjointSetRenderer({ data }) {
  const { parent = [], labels = [], highlights = [], merging = [] } = data;

  const layout = useMemo(() => {
    if (parent.length === 0) return { trees: [], totalW: 600 };

    // Build children map
    const children = {};
    parent.forEach((p, i) => {
      if (p !== i) {
        if (!children[p]) children[p] = [];
        children[p].push(i);
      }
    });

    const roots = parent
      .map((p, i) => (p === i ? i : null))
      .filter(i => i !== null);

    // Recursive layout for each root
    const positioned = {};
    let cursorX = 0;

    function measureWidth(id) {
      const ch = children[id] || [];
      if (ch.length === 0) return 1;
      return ch.reduce((sum, c) => sum + measureWidth(c), 0);
    }

    function layoutTree(id, x, y) {
      const ch = children[id] || [];
      if (ch.length === 0) {
        positioned[id] = { x, y };
        return { x, w: 1 };
      }
      const widths = ch.map(c => measureWidth(c));
      const total = widths.reduce((a, b) => a + b, 0);
      let childX = x - ((total - 1) * SPREAD) / 2;
      ch.forEach((c, i) => {
        const cx = childX + ((widths[i] - 1) * SPREAD) / 2;
        layoutTree(c, cx, y + LEVEL_H);
        childX += widths[i] * SPREAD;
      });
      positioned[id] = { x, y };
      return { x, w: total };
    }

    const trees = [];
    roots.forEach(rootId => {
      const w = measureWidth(rootId);
      const rootX = cursorX + ((w - 1) * SPREAD) / 2 + SPREAD / 2;
      layoutTree(rootId, rootX, 36);
      trees.push({ rootId, width: w * SPREAD });
      cursorX += w * SPREAD + SPREAD;
    });

    return { trees, positioned, totalW: Math.max(cursorX, 300) };
  }, [parent]);

  const { positioned = {}, totalW } = layout;

  const getState = (i) => {
    if (merging.includes(i)) return 'merging';
    if (highlights.includes(i)) return 'current';
    if (parent[i] === i) return 'root';
    return 'default';
  };

  // Edges: child -> parent
  const edges = parent
    .map((p, i) => (p !== i ? { from: i, to: p } : null))
    .filter(Boolean);

  const totalH = 36 + LEVEL_H * 3 + 20;

  return (
    <div className="dsu-renderer">
      {/* Parent array row */}
      <div className="dsu-array">
        <span className="dsu-array-label">parent[]</span>
        <div className="dsu-array-cells">
          {parent.map((p, i) => {
            const state = getState(i);
            const colors = stateColors[state] || stateColors.default;
            return (
              <div key={i} className="dsu-array-cell-wrap">
                <div
                  className="dsu-array-cell"
                  style={{ borderColor: colors.stroke, background: colors.fill, color: colors.text }}
                >
                  {p}
                </div>
                <span className="dsu-array-idx">{labels[i] !== undefined ? labels[i] : i}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forest visualization */}
      <svg
        className="dsu-svg"
        viewBox={`0 0 ${totalW} ${totalH}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {edges.map((e, i) => {
          const a = positioned[e.from];
          const b = positioned[e.to];
          if (!a || !b) return null;
          return (
            <line
              key={i}
              x1={a.x} y1={a.y - NODE_R}
              x2={b.x} y2={b.y + NODE_R}
              stroke="var(--border)"
              strokeWidth={1.5}
              markerEnd="url(#dsu-arrow)"
            />
          );
        })}
        <defs>
          <marker id="dsu-arrow" viewBox="0 0 10 10" refX="8" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
          </marker>
        </defs>
        {parent.map((_, i) => {
          const pos = positioned[i];
          if (!pos) return null;
          const state = getState(i);
          const colors = stateColors[state] || stateColors.default;
          return (
            <g key={i}>
              {state === 'current' && (
                <circle cx={pos.x} cy={pos.y} r={NODE_R + 5} className="graph-node-glow" />
              )}
              <circle
                cx={pos.x} cy={pos.y} r={NODE_R}
                fill={colors.fill} stroke={colors.stroke}
                strokeWidth={state === 'current' ? 2.5 : 1.5}
              />
              <text
                x={pos.x} y={pos.y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fill={colors.text}
                className="tree-node-label"
              >
                {labels[i] !== undefined ? labels[i] : i}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
