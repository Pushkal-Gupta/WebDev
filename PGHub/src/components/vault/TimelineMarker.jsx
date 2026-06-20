import React from 'react';

export default function TimelineMarker({ status = 'due-today', height = 56, first = false, last = false }) {
  const color = status === 'overdue' ? 'var(--hard)' : 'var(--warning)';
  const cy = height / 2;

  return (
    <svg
      className="vault-tl"
      width="18"
      height={height}
      viewBox={`0 0 18 ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={status === 'overdue' ? 'Overdue' : 'Due today'}
    >
      <line
        x1="9"
        y1={first ? cy : 0}
        x2="9"
        y2={last ? cy : height}
        stroke="var(--border)"
        strokeWidth="2"
      />
      <circle cx="9" cy={cy} r="6.5" fill="var(--surface)" stroke={color} strokeWidth="2.5" />
      <circle cx="9" cy={cy} r="2.5" fill={color} />
    </svg>
  );
}
