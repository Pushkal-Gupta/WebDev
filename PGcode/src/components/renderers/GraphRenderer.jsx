import React, { useMemo } from 'react';
import './renderers.css';

const NODE_R = 24;

const stateColors = {
  unvisited: { fill: 'var(--surface)', stroke: 'var(--border)', text: 'var(--text-dim)' },
  current: { fill: 'rgba(0, 255, 245, 0.15)', stroke: 'var(--accent)', text: 'var(--accent)' },
  visited: { fill: 'rgba(34, 197, 94, 0.12)', stroke: 'var(--easy)', text: 'var(--easy)' },
  processing: { fill: 'rgba(240, 165, 0, 0.12)', stroke: 'var(--medium)', text: 'var(--medium)' },
};

const edgeStateColors = {
  default: 'var(--border)',
  traversed: 'var(--accent)',
  highlighted: 'var(--medium)',
};

export default function GraphRenderer({ data }) {
  const { nodes = [], edges = [], directed = false } = data;

  const viewBox = useMemo(() => {
    if (nodes.length === 0) return '0 0 400 300';
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const pad = 60;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const maxX = Math.max(...xs) + pad;
    const maxY = Math.max(...ys) + pad;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [nodes]);

  const nodeMap = useMemo(() => {
    const m = {};
    nodes.forEach(n => { m[n.id] = n; });
    return m;
  }, [nodes]);

  return (
    <svg className="graph-svg" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="arrow-default" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="var(--border)" />
        </marker>
        <marker id="arrow-traversed" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="var(--accent)" />
        </marker>
        <marker id="arrow-highlighted" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="var(--medium)" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((e, i) => {
        const src = nodeMap[e.from];
        const tgt = nodeMap[e.to];
        if (!src || !tgt) return null;

        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;

        const x1 = src.x + ux * NODE_R;
        const y1 = src.y + uy * NODE_R;
        const x2 = tgt.x - ux * (NODE_R + 8);
        const y2 = tgt.y - uy * (NODE_R + 8);

        const color = edgeStateColors[e.state] || edgeStateColors.default;
        const markerId = `arrow-${e.state || 'default'}`;

        return (
          <g key={i}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color}
              strokeWidth={e.state === 'traversed' ? 2.5 : 1.5}
              markerEnd={directed ? `url(#${markerId})` : undefined}
              className="graph-edge"
            />
            {e.weight !== undefined && (
              <text
                x={(x1 + x2) / 2 + 8}
                y={(y1 + y2) / 2 - 6}
                className="graph-weight-label"
                fill={color}
              >
                {e.weight}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map(n => {
        const colors = stateColors[n.state] || stateColors.unvisited;
        return (
          <g key={n.id} className="graph-node-group">
            {n.state === 'current' && (
              <circle cx={n.x} cy={n.y} r={NODE_R + 6} className="graph-node-glow" />
            )}
            <circle
              cx={n.x} cy={n.y} r={NODE_R}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={n.state === 'current' ? 2.5 : 1.5}
              className="graph-node-circle"
            />
            <text
              x={n.x} y={n.y + 1}
              textAnchor="middle" dominantBaseline="middle"
              fill={colors.text}
              className="graph-node-label"
            >
              {n.label || n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
