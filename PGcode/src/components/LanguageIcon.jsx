import React from 'react';

// Monotone letter-chip language icons. Single-color, inherits currentColor so
// they sit on any background and pick up the active tab's accent.
const LETTERS = {
  python: 'PY',
  javascript: 'JS',
  typescript: 'TS',
  java: 'JV',
  kotlin: 'KT',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  go: 'GO',
  rust: 'RS',
  swift: 'SW',
  ruby: 'RB',
  php: 'PHP',
  bash: 'SH',
};

export default function LanguageIcon({ lang, size = 14 }) {
  const text = LETTERS[lang];
  if (!text) return null;
  // Tighter font-size for 3-char labels (C++, PHP) so they fit the chip.
  const fontSize = text.length >= 3 ? 7.5 : 9;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="700"
        fill="currentColor"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {text}
      </text>
    </svg>
  );
}
