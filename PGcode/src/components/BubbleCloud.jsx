import React, { useMemo } from 'react';
import './BubbleCloud.css';

// Lightweight non-overlapping packed bubble layout. Pure SVG, no external lib.
// Each bubble = one topic. Bubble size = number of solved problems in that topic.
// Bubble color = mostly-solved (easy palette) → mostly-unsolved (dim).
//
// Layout: spiral pack — place each bubble at the next non-overlapping spot
// along an Archimedean spiral. Stable enough for ~30 topics, simple to read.

function packBubbles(items, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const placed = [];
  const sorted = [...items].sort((a, b) => b.r - a.r);
  for (const item of sorted) {
    let placedOk = false;
    // Try center first for the largest bubble
    if (placed.length === 0) {
      placed.push({ ...item, x: cx, y: cy });
      placedOk = true;
      continue;
    }
    // Spiral outward
    for (let t = 0; t < 5000 && !placedOk; t += 0.18) {
      const r = 6 + 2.4 * t;
      const x = cx + r * Math.cos(t);
      const y = cy + r * Math.sin(t);
      // Bounds check (with margin = bubble radius)
      if (x - item.r < 0 || x + item.r > width || y - item.r < 0 || y + item.r > height) continue;
      // Overlap check
      const collides = placed.some(p => {
        const dx = p.x - x, dy = p.y - y;
        return Math.hypot(dx, dy) < (p.r + item.r + 2);
      });
      if (!collides) {
        placed.push({ ...item, x, y });
        placedOk = true;
      }
    }
    // If we couldn't place it, drop it silently (very rare with ~30 bubbles).
  }
  return placed;
}

export default function BubbleCloud({ items, width = 260, height = 200 }) {
  // items: [{ id, label, solved, total }]
  const bubbles = useMemo(() => {
    const max = Math.max(1, ...items.map(i => i.total || 0));
    const scaled = items.map(i => ({
      ...i,
      r: Math.max(6, 6 + Math.sqrt(Math.max(0, i.total)) * (28 / Math.sqrt(max))),
    }));
    return packBubbles(scaled, width, height);
  }, [items, width, height]);

  if (!items || items.length === 0) {
    return (
      <div className="bcl-empty">No solves yet — solve a problem to start filling the cloud.</div>
    );
  }

  return (
    <svg className="bcl" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Solved problems by topic">
      {bubbles.map(b => {
        const fill = (b.solved || 0) / Math.max(1, b.total || 1);
        const cls = fill >= 0.8 ? 'mastered' : fill >= 0.5 ? 'half' : fill > 0 ? 'low' : 'none';
        return (
          <g key={b.id} className={`bcl-bubble bcl-bubble-${cls}`}>
            <title>{b.label} — {b.solved}/{b.total} solved</title>
            <circle cx={b.x} cy={b.y} r={b.r} />
            {b.r >= 16 && (
              <text x={b.x} y={b.y} dy=".32em" textAnchor="middle" fontSize={Math.max(7, Math.min(11, b.r / 2.4))}>
                {b.solved}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
