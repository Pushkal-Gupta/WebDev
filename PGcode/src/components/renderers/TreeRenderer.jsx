import React, { useMemo } from 'react';
import './Renderers.css';

const NODE_R = 22;
const LEVEL_H = 70;
const BASE_SPREAD = 140;

const stateColors = {
  unvisited: { fill: 'var(--surface)', stroke: 'var(--border)', text: 'var(--text-dim)' },
  current: { fill: 'rgba(0, 255, 245, 0.15)', stroke: 'var(--accent)', text: 'var(--accent)' },
  visited: { fill: 'rgba(34, 197, 94, 0.12)', stroke: 'var(--easy)', text: 'var(--easy)' },
};

export default function TreeRenderer({ data }) {
  const { nodes = [], edges = [] } = data;

  // Build tree layout
  const layout = useMemo(() => {
    if (nodes.length === 0) return { positions: {}, svgNodes: [], svgEdges: [] };

    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // Find root (node with no parent edge)
    const childSet = new Set(edges.map(e => e.child));
    const rootId = nodes.find(n => !childSet.has(n.id))?.id || nodes[0]?.id;

    // Build children map
    const childrenMap = {};
    edges.forEach(e => {
      if (!childrenMap[e.parent]) childrenMap[e.parent] = [];
      childrenMap[e.parent].push({ id: e.child, side: e.side });
    });

    // Layout via recursive positioning
    const positions = {};
    function layoutNode(id, x, y, spread) {
      positions[id] = { x, y };
      const children = childrenMap[id] || [];

      // Sort: left first, then right
      children.sort((a, b) => (a.side === 'left' ? -1 : 1));

      children.forEach(child => {
        const dx = child.side === 'left' ? -spread : spread;
        layoutNode(child.id, x + dx, y + LEVEL_H, spread * 0.55);
      });
    }

    layoutNode(rootId, 300, 40, BASE_SPREAD);

    const svgNodes = nodes.map(n => ({
      ...n,
      x: positions[n.id]?.x || 0,
      y: positions[n.id]?.y || 0,
    }));

    const svgEdges = edges.map(e => ({
      ...e,
      x1: positions[e.parent]?.x || 0,
      y1: positions[e.parent]?.y || 0,
      x2: positions[e.child]?.x || 0,
      y2: positions[e.child]?.y || 0,
    }));

    return { positions, svgNodes, svgEdges };
  }, [nodes, edges]);

  const viewBox = useMemo(() => {
    const xs = layout.svgNodes.map(n => n.x);
    const ys = layout.svgNodes.map(n => n.y);
    if (xs.length === 0) return '0 0 600 400';
    const pad = 50;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const maxX = Math.max(...xs) + pad;
    const maxY = Math.max(...ys) + pad;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [layout.svgNodes]);

  return (
    <svg className="tree-svg" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
      {/* Edges */}
      {layout.svgEdges.map((e, i) => (
        <line
          key={i}
          x1={e.x1} y1={e.y1 + NODE_R}
          x2={e.x2} y2={e.y2 - NODE_R}
          stroke="var(--border)"
          strokeWidth={1.5}
          className="tree-edge"
        />
      ))}

      {/* Nodes */}
      {layout.svgNodes.map(n => {
        const colors = stateColors[n.state] || stateColors.unvisited;
        return (
          <g key={n.id} className="tree-node-group">
            {n.state === 'current' && (
              <circle cx={n.x} cy={n.y} r={NODE_R + 5} className="graph-node-glow" />
            )}
            <circle
              cx={n.x} cy={n.y} r={NODE_R}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={n.state === 'current' ? 2.5 : 1.5}
              className="tree-node-circle"
            />
            <text
              x={n.x} y={n.y + 1}
              textAnchor="middle" dominantBaseline="middle"
              fill={colors.text}
              className="tree-node-label"
            >
              {n.value !== undefined ? n.value : n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
