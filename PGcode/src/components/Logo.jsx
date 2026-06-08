import React from 'react';

export default function Logo({ size = 28, withWordmark = false, wordmarkSize = 'md', subtitle = null, tone = 'auto' }) {
  const fontSize = wordmarkSize === 'lg' ? '1.65rem' : wordmarkSize === 'sm' ? '0.95rem' : '1.18rem';
  const subFont = wordmarkSize === 'lg' ? '0.82rem' : '0.72rem';
  const titleColor = tone === 'light' ? '#f5f5f5' : 'var(--text-main)';
  const subColor = tone === 'light' ? 'rgba(245, 245, 245, 0.7)' : 'var(--text-dim)';

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PG · Pushkal Gupta Code"
      role="img"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <path
        d="M3 4 L3 28 M3 4 L10.5 4 Q15.5 4 15.5 10 Q15.5 16 10.5 16 L3 16"
        stroke="var(--accent)"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33 9.5 Q33 4 27 4 Q20.5 4 20.5 11.5 L20.5 20.5 Q20.5 28 27 28 Q33 28 33 22.5 L33 18.5 L27.5 18.5"
        stroke="var(--accent)"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (!withWordmark) return mark;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'nowrap',
      }}
    >
      {mark}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.18rem', minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--sans, -apple-system, system-ui, sans-serif)',
            fontWeight: 700,
            fontSize,
            letterSpacing: '-0.02em',
            color: titleColor,
            lineHeight: 1.05,
            whiteSpace: 'nowrap',
          }}
        >
          Pushkal Gupta <span style={{ color: 'var(--accent)', fontWeight: 800 }}>Code</span>
        </span>
        {subtitle && (
          <span
            style={{
              fontFamily: 'var(--sans, -apple-system, system-ui, sans-serif)',
              fontSize: subFont,
              color: subColor,
              letterSpacing: '0',
              lineHeight: 1.35,
              fontWeight: 400,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
