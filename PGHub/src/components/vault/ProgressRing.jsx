import React from 'react';

export default function ProgressRing({ solved = 0, total = 0, color = 'var(--accent)', size = 44, stroke = 5 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(1, solved / total) : 0;
  const offset = circumference * (1 - pct);
  const label = total > 0 ? `${Math.round(pct * 100)}%` : '0';

  return (
    <svg
      className="vault-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${solved} of ${total} solved`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--text-main)"
        fontSize={size * 0.26}
        fontFamily="var(--mono)"
        fontWeight="700"
      >
        {label}
      </text>
    </svg>
  );
}
