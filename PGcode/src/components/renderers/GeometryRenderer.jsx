import React, { useMemo } from 'react';
import './renderers.css';

const PAD = 30;
const CANVAS_W = 480;
const CANVAS_H = 320;

const stateColors = {
  default: { fill: 'var(--surface)', stroke: 'var(--border)', text: 'var(--text-dim)' },
  current: { fill: 'rgba(0, 255, 245, 0.18)', stroke: 'var(--accent)', text: 'var(--accent)' },
  highlighted: { fill: 'rgba(0, 255, 245, 0.18)', stroke: 'var(--accent)', text: 'var(--accent)' },
  visited: { fill: 'rgba(34, 197, 94, 0.15)', stroke: 'var(--easy)', text: 'var(--easy)' },
  match: { fill: 'rgba(34, 197, 94, 0.15)', stroke: 'var(--easy)', text: 'var(--easy)' },
  reject: { fill: 'rgba(239, 68, 68, 0.15)', stroke: 'var(--hard)', text: 'var(--hard)' },
};

export default function GeometryRenderer({ data }) {
  const {
    points = [],         // [{x, y, label, state}]
    lines = [],          // [{x1, y1, x2, y2, state}]
    rectangles = [],     // [{x1, y1, x2, y2, label, state}]
    bounds,              // optional {minX, maxX, minY, maxY}
  } = data;

  const view = useMemo(() => {
    const allXs = [
      ...points.map(p => p.x),
      ...lines.flatMap(l => [l.x1, l.x2]),
      ...rectangles.flatMap(r => [r.x1, r.x2]),
    ];
    const allYs = [
      ...points.map(p => p.y),
      ...lines.flatMap(l => [l.y1, l.y2]),
      ...rectangles.flatMap(r => [r.y1, r.y2]),
    ];
    let minX = bounds?.minX ?? (allXs.length ? Math.min(...allXs) : -5);
    let maxX = bounds?.maxX ?? (allXs.length ? Math.max(...allXs) : 5);
    let minY = bounds?.minY ?? (allYs.length ? Math.min(...allYs) : -5);
    let maxY = bounds?.maxY ?? (allYs.length ? Math.max(...allYs) : 5);
    // Add padding to range
    const rangeX = Math.max(maxX - minX, 1);
    const rangeY = Math.max(maxY - minY, 1);
    minX -= rangeX * 0.15; maxX += rangeX * 0.15;
    minY -= rangeY * 0.15; maxY += rangeY * 0.15;

    const sx = (CANVAS_W - 2 * PAD) / (maxX - minX);
    const sy = (CANVAS_H - 2 * PAD) / (maxY - minY);

    const toX = (x) => PAD + (x - minX) * sx;
    const toY = (y) => CANVAS_H - PAD - (y - minY) * sy;  // y flipped

    return { toX, toY, minX, maxX, minY, maxY };
  }, [points, lines, rectangles, bounds]);

  const { toX, toY, minX, maxX, minY, maxY } = view;

  // Axis lines (only if 0 within range)
  const showXAxis = minY <= 0 && maxY >= 0;
  const showYAxis = minX <= 0 && maxX >= 0;

  return (
    <svg className="geo-svg" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="xMidYMid meet">
      {/* Grid border */}
      <rect
        x={PAD - 4} y={PAD - 4}
        width={CANVAS_W - 2 * PAD + 8}
        height={CANVAS_H - 2 * PAD + 8}
        fill="none"
        stroke="var(--border)"
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.5}
      />

      {/* X axis */}
      {showXAxis && (
        <line
          x1={PAD - 4} y1={toY(0)}
          x2={CANVAS_W - PAD + 4} y2={toY(0)}
          stroke="var(--text-dim)" strokeWidth={1} opacity={0.7}
        />
      )}
      {/* Y axis */}
      {showYAxis && (
        <line
          x1={toX(0)} y1={PAD - 4}
          x2={toX(0)} y2={CANVAS_H - PAD + 4}
          stroke="var(--text-dim)" strokeWidth={1} opacity={0.7}
        />
      )}

      {/* Rectangles */}
      {rectangles.map((r, i) => {
        const colors = stateColors[r.state] || stateColors.default;
        const x = Math.min(toX(r.x1), toX(r.x2));
        const y = Math.min(toY(r.y1), toY(r.y2));
        const w = Math.abs(toX(r.x2) - toX(r.x1));
        const h = Math.abs(toY(r.y2) - toY(r.y1));
        return (
          <g key={`r${i}`}>
            <rect
              x={x} y={y} width={w} height={h}
              fill={colors.fill} stroke={colors.stroke}
              strokeWidth={2}
              className="geo-rect"
            />
            {r.label && (
              <text
                x={x + w / 2} y={y + h / 2}
                textAnchor="middle" dominantBaseline="middle"
                fill={colors.text}
                className="geo-label"
              >
                {r.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Lines */}
      {lines.map((l, i) => {
        const colors = stateColors[l.state] || stateColors.default;
        return (
          <line
            key={`l${i}`}
            x1={toX(l.x1)} y1={toY(l.y1)}
            x2={toX(l.x2)} y2={toY(l.y2)}
            stroke={colors.stroke}
            strokeWidth={l.state === 'highlighted' || l.state === 'current' ? 2.5 : 1.5}
            className="geo-line"
          />
        );
      })}

      {/* Points */}
      {points.map((p, i) => {
        const colors = stateColors[p.state] || stateColors.default;
        const r = p.state === 'current' || p.state === 'highlighted' ? 7 : 5;
        return (
          <g key={`p${i}`}>
            {(p.state === 'current' || p.state === 'highlighted') && (
              <circle cx={toX(p.x)} cy={toY(p.y)} r={r + 4} className="graph-node-glow" />
            )}
            <circle
              cx={toX(p.x)} cy={toY(p.y)} r={r}
              fill={colors.stroke}
              stroke={colors.stroke}
              strokeWidth={1.5}
              className="geo-point"
            />
            <text
              x={toX(p.x) + 9} y={toY(p.y) - 8}
              fill={colors.text}
              className="geo-label"
            >
              {p.label !== undefined ? p.label : `(${p.x},${p.y})`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
