import React from 'react';

// Type-appropriate inline SVG motifs for the PGVault hub cards.
// Each motif fills a 16/7 banner via viewBox; theme tokens only, no scrollbars.
// `hue` is the card's accent token; a muted secondary is derived with color-mix.

function Frame({ children, hue }) {
  const dim = `color-mix(in srgb, ${hue} 40%, var(--text-dim))`;
  return (
    <svg
      className="pgv-motif"
      viewBox="0 0 120 56"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-hidden="true"
      style={{ '--m-hue': hue, '--m-dim': dim }}
    >
      {children}
    </svg>
  );
}

// Review -> a vertical timeline of due-soon markers
function ReviewMotif({ hue }) {
  const rows = [
    { y: 12, on: true },
    { y: 28, on: true },
    { y: 44, on: false },
  ];
  return (
    <Frame hue={hue}>
      <line x1="26" y1="6" x2="26" y2="50" stroke="var(--border)" strokeWidth="2" />
      {rows.map((r, i) => (
        <g key={i}>
          <circle cx="26" cy={r.y} r="6" fill="var(--surface)"
            stroke={r.on ? 'var(--m-hue)' : 'var(--border)'} strokeWidth="2.5" />
          <circle cx="26" cy={r.y} r="2.4" fill={r.on ? 'var(--m-hue)' : 'var(--text-dim)'} />
          <rect x="42" y={r.y - 4} width={r.on ? 56 : 38} height="3.4" rx="1.7"
            fill={r.on ? 'var(--m-hue)' : 'var(--border)'} opacity={r.on ? 0.85 : 0.7} />
          <rect x="42" y={r.y + 2} width={r.on ? 34 : 22} height="3" rx="1.5"
            fill="var(--m-dim)" opacity="0.45" />
        </g>
      ))}
    </Frame>
  );
}

// Lists -> a progress ring + checklist rows
function ListsMotif({ hue }) {
  const C = 2 * Math.PI * 14;
  return (
    <Frame hue={hue}>
      <circle cx="28" cy="28" r="14" fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle cx="28" cy="28" r="14" fill="none" stroke="var(--m-hue)" strokeWidth="5"
        strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * 0.32}
        transform="rotate(-90 28 28)" />
      <path d="M22 28 l4 4 l8 -9" fill="none" stroke="var(--m-hue)" strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round" />
      {[16, 28, 40].map((y, i) => (
        <g key={i}>
          <rect x="56" y={y - 3} width="7" height="7" rx="2" fill="none"
            stroke="var(--m-dim)" strokeWidth="2" />
          <rect x="70" y={y - 2} width={i === 2 ? 24 : 38} height="3.4" rx="1.7"
            fill="var(--m-dim)" opacity="0.55" />
        </g>
      ))}
    </Frame>
  );
}

// Notes -> stacked note tiles with preview lines
function NotesMotif({ hue }) {
  return (
    <Frame hue={hue}>
      <rect x="20" y="14" width="46" height="34" rx="5" fill="var(--m-dim)" opacity="0.18"
        transform="rotate(-5 43 31)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="40" y="10" width="60" height="40" rx="6" fill="var(--surface)"
        stroke="var(--m-hue)" strokeWidth="2" />
      <rect x="40" y="10" width="60" height="9" rx="6" fill="var(--m-hue)" opacity="0.22" />
      {[26, 33, 40].map((y, i) => (
        <rect key={i} x="48" y={y} width={i === 2 ? 30 : 44} height="3.2" rx="1.6"
          fill="var(--m-hue)" opacity={0.7 - i * 0.15} />
      ))}
    </Frame>
  );
}

// Progress -> a rising sparkline over faint bars
function ProgressMotif({ hue }) {
  const bars = [10, 16, 13, 22, 19, 28, 34];
  return (
    <Frame hue={hue}>
      {bars.map((h, i) => (
        <rect key={i} x={14 + i * 14} y={48 - h} width="8" height={h} rx="2"
          fill="var(--m-dim)" opacity="0.3" />
      ))}
      <polyline
        points={bars.map((h, i) => `${18 + i * 14},${48 - h - 4}`).join(' ')}
        fill="none" stroke="var(--m-hue)" strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round" />
      {bars.map((h, i) => (
        <circle key={i} cx={18 + i * 14} cy={48 - h - 4} r="2.4" fill="var(--m-hue)" />
      ))}
    </Frame>
  );
}

// ML Progress -> small neuron graph with a progress arc
function MLMotif({ hue }) {
  const a = [16, 30, 44];
  const b = [22, 38];
  return (
    <Frame hue={hue}>
      {a.map((y) => b.map((y2) => (
        <line key={`${y}-${y2}`} x1="32" y1={y} x2="64" y2={y2}
          stroke="var(--m-dim)" strokeWidth="1.4" opacity="0.4" />
      )))}
      {b.map((y) => (
        <line key={`o${y}`} x1="64" y1={y} x2="92" y2="30"
          stroke="var(--m-dim)" strokeWidth="1.4" opacity="0.4" />
      ))}
      {a.map((y) => <circle key={`a${y}`} cx="32" cy={y} r="4" fill="var(--m-dim)" opacity="0.7" />)}
      {b.map((y) => <circle key={`b${y}`} cx="64" cy={y} r="4.5" fill="var(--m-hue)" />)}
      <circle cx="92" cy="30" r="5" fill="var(--surface)" stroke="var(--m-hue)" strokeWidth="2.5" />
      <circle cx="92" cy="30" r="2" fill="var(--m-hue)" />
    </Frame>
  );
}

// History -> activity bars by recency, last few highlighted
function HistoryMotif({ hue }) {
  const bars = [12, 20, 8, 26, 16, 30, 14, 24, 34];
  return (
    <Frame hue={hue}>
      {bars.map((h, i) => {
        const recent = i >= bars.length - 3;
        return (
          <rect key={i} x={12 + i * 11} y={48 - h} width="7" height={h} rx="2"
            fill={recent ? 'var(--m-hue)' : 'var(--m-dim)'}
            opacity={recent ? 0.9 : 0.4} />
        );
      })}
      <line x1="8" y1="49" x2="114" y2="49" stroke="var(--border)" strokeWidth="1.5" />
    </Frame>
  );
}

// Achievements -> a medal with ribbon and a star
function AchievementsMotif({ hue }) {
  return (
    <Frame hue={hue}>
      <path d="M50 12 L46 30 M70 12 L74 30" stroke="var(--m-dim)" strokeWidth="4"
        strokeLinecap="round" opacity="0.6" />
      <circle cx="60" cy="34" r="15" fill="none" stroke="var(--m-hue)" strokeWidth="3" />
      <circle cx="60" cy="34" r="9" fill="var(--m-hue)" opacity="0.18" />
      <path d="M60 27 l2.3 4.7 l5.2 0.7 l-3.8 3.6 l0.9 5.1 l-4.6 -2.4 l-4.6 2.4 l0.9 -5.1 l-3.8 -3.6 l5.2 -0.7 Z"
        fill="var(--m-hue)" />
      <circle cx="30" cy="20" r="2.6" fill="var(--m-dim)" opacity="0.5" />
      <circle cx="92" cy="44" r="2.2" fill="var(--m-dim)" opacity="0.5" />
    </Frame>
  );
}

// Assessments -> a clipboard with a timer ring
function AssessmentsMotif({ hue }) {
  const C = 2 * Math.PI * 11;
  return (
    <Frame hue={hue}>
      <rect x="22" y="12" width="42" height="36" rx="5" fill="var(--surface)"
        stroke="var(--m-hue)" strokeWidth="2" />
      <rect x="36" y="8" width="14" height="7" rx="3" fill="var(--m-hue)" opacity="0.5" />
      {[22, 30, 38].map((y, i) => (
        <g key={i}>
          <path d={`M28 ${y} l2 2 l4 -4`} fill="none" stroke="var(--m-hue)" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
          <rect x="38" y={y - 2} width={i === 2 ? 14 : 20} height="3" rx="1.5"
            fill="var(--m-dim)" opacity="0.5" />
        </g>
      ))}
      <circle cx="92" cy="32" r="11" fill="none" stroke="var(--border)" strokeWidth="3.5" />
      <circle cx="92" cy="32" r="11" fill="none" stroke="var(--m-hue)" strokeWidth="3.5"
        strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * 0.4}
        transform="rotate(-90 92 32)" />
      <line x1="92" y1="32" x2="92" y2="25" stroke="var(--m-hue)" strokeWidth="2" strokeLinecap="round" />
      <line x1="92" y1="32" x2="97" y2="34" stroke="var(--m-hue)" strokeWidth="2" strokeLinecap="round" />
    </Frame>
  );
}

const MOTIFS = {
  review: ReviewMotif,
  lists: ListsMotif,
  notes: NotesMotif,
  progress: ProgressMotif,
  ml: MLMotif,
  history: HistoryMotif,
  achievements: AchievementsMotif,
  assessments: AssessmentsMotif,
};

export default function VaultMotif({ kind, hue }) {
  const Comp = MOTIFS[kind] || ProgressMotif;
  return <Comp hue={hue} />;
}
