import React, { useMemo } from 'react';
import './BubbleCloud.css';

// Topic-distribution bubble chart. Pure SVG, no external lib.
//   items: [{ id, label, solved, total, kind? }]
// Each bubble = one topic; area ∝ solved count; colour cycles through a small
// theme-token palette (or a fixed difficulty hue when `kind` is set) so the
// chart reads as a set of distinct topics rather than one featureless blob.
//
// Layout strategy is chosen by topic count so it never collapses to a single
// oversized circle:
//   • 1 topic   → one centred bubble + a readable caption beneath it.
//   • 2–3       → an evenly-spaced row, each sized by its own count.
//   • 4+        → a deterministic spiral pack (largest in the middle).

const PALETTE = [
  'var(--accent)',
  'var(--easy)',
  'var(--medium)',
  'var(--hard)',
  'color-mix(in srgb, var(--accent) 55%, var(--easy))',
  'color-mix(in srgb, var(--accent) 55%, var(--medium))',
  'color-mix(in srgb, var(--easy) 60%, var(--accent))',
  'color-mix(in srgb, var(--medium) 60%, var(--hard))',
];

const KIND_FILL = {
  easy: 'var(--easy)',
  medium: 'var(--medium)',
  hard: 'var(--hard)',
};

function colourFor(item, index) {
  if (item.kind && KIND_FILL[item.kind]) return KIND_FILL[item.kind];
  return PALETTE[index % PALETTE.length];
}

// Radius from solved count: sqrt scale (area ∝ count) clamped to a sane band so
// a single dominant topic never balloons and tiny topics stay legible.
function radiusScale(items, minR, maxR) {
  const max = Math.max(1, ...items.map(i => Math.max(0, i.solved || 0)));
  return (n) => {
    const v = Math.max(0, n || 0);
    if (max <= 0) return minR;
    const t = Math.sqrt(v) / Math.sqrt(max);
    return minR + t * (maxR - minR);
  };
}

function spiralPack(items, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const placed = [];
  const sorted = [...items].sort((a, b) => b.r - a.r);
  for (const item of sorted) {
    if (placed.length === 0) { placed.push({ ...item, x: cx, y: cy }); continue; }
    let ok = false;
    for (let t = 0; t < 6000 && !ok; t += 0.16) {
      const rad = 5 + 2.3 * t;
      const x = cx + rad * Math.cos(t);
      const y = cy + rad * Math.sin(t);
      if (x - item.r < 1 || x + item.r > width - 1 || y - item.r < 1 || y + item.r > height - 1) continue;
      const collides = placed.some(p => Math.hypot(p.x - x, p.y - y) < (p.r + item.r + 3));
      if (!collides) { placed.push({ ...item, x, y }); ok = true; }
    }
    if (!ok) placed.push({ ...item, x: cx, y: cy, hidden: true });
  }
  return placed.filter(p => !p.hidden);
}

export default function BubbleCloud({ items, width = 320, height = 220 }) {
  const { bubbles, layout } = useMemo(() => {
    const src = (items || []).filter(i => (i.solved || 0) >= 0);
    if (src.length === 0) return { bubbles: [], layout: 'empty' };

    const n = src.length;
    if (n === 1) {
      const r = Math.min(width, height) * 0.34;
      return {
        layout: 'single',
        bubbles: [{ ...src[0], r, x: width / 2, y: height / 2 - 8, color: colourFor(src[0], 0) }],
      };
    }

    if (n <= 3) {
      const minR = Math.min(width, height) * 0.16;
      const maxR = Math.min(width, height) * 0.3;
      const scale = radiusScale(src, minR, maxR);
      const slot = width / n;
      return {
        layout: 'row',
        bubbles: src.map((it, i) => ({
          ...it,
          r: scale(it.solved),
          x: slot * (i + 0.5),
          y: height / 2,
          color: colourFor(it, i),
        })),
      };
    }

    // 4+ → spiral pack. Cap the bubble count we draw so a long tail of 1-solve
    // topics doesn't shrink everything; group the rest into an "others" bubble.
    const sorted = [...src].sort((a, b) => (b.solved || 0) - (a.solved || 0));
    const TOP = 12;
    let work = sorted;
    if (sorted.length > TOP) {
      const head = sorted.slice(0, TOP - 1);
      const tail = sorted.slice(TOP - 1);
      const othersSolved = tail.reduce((s, t) => s + (t.solved || 0), 0);
      work = [...head, { id: '__others', label: `+${tail.length} more`, solved: othersSolved, total: othersSolved, kind: 'others' }];
    }
    const minR = 13;
    const maxR = Math.min(width, height) * 0.24;
    const scale = radiusScale(work, minR, maxR);
    const sized = work.map((it, i) => ({ ...it, r: scale(it.solved), color: colourFor(it, i) }));
    return { layout: 'pack', bubbles: spiralPack(sized, width, height) };
  }, [items, width, height]);

  if (layout === 'empty') {
    return (
      <div className="bcl-empty">No solves yet — solve a problem to start filling the cloud.</div>
    );
  }

  const single = bubbles[0];

  return (
    <svg
      className={`bcl bcl-${layout}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Solved problems by topic"
    >
      {bubbles.map((b, i) => {
        const showCount = b.r >= 13;
        const showLabel = b.r >= 24 && b.label;
        const countSize = Math.max(9, Math.min(20, b.r * 0.7));
        const labelSize = Math.max(7, Math.min(10, b.r * 0.26));
        return (
          <g
            key={b.id}
            className={`bcl-bubble ${b.kind === 'others' ? 'bcl-bubble-others' : ''}`}
            style={{ '--bcl-fill': b.color, '--bcl-i': i }}
          >
            <title>{b.label} — {b.solved} solved</title>
            <circle className="bcl-circle" cx={b.x} cy={b.y} r={b.r} />
            {showCount && (
              <text className="bcl-count" x={b.x} y={layout === 'single' ? b.y : (showLabel ? b.y - b.r * 0.1 : b.y)} dy=".32em" textAnchor="middle" fontSize={countSize}>
                {b.solved}
              </text>
            )}
            {showLabel && layout !== 'single' && (
              <text className="bcl-label" x={b.x} y={b.y + b.r * 0.45} textAnchor="middle" fontSize={labelSize}>
                {b.label.length > 12 ? `${b.label.slice(0, 11)}…` : b.label}
              </text>
            )}
          </g>
        );
      })}
      {layout === 'single' && single && (
        <text className="bcl-single-caption" x={width / 2} y={single.y + single.r + 22} textAnchor="middle">
          {single.label}
        </text>
      )}
    </svg>
  );
}
