// RoleIcon — small SVG glyph for the unit role on each card.
// Sword (frontline), Bow (ranged), Hammer (heavy).

const PATHS = {
  frontline: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19l4-4 9-9 1 1-9 9-4 4z" fill="currentColor"/>
      <path d="M16 6l3 3" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    </svg>
  ),
  ranged: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20c8-2 12-10 14-16" stroke="currentColor" strokeWidth="1.8" fill="none"/>
      <path d="M5 19l4-1 1-4" stroke="currentColor" strokeWidth="1.4" fill="none"/>
      <path d="M3 21l16-16" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    </svg>
  ),
  heavy: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6"  y="4"  width="12" height="6" fill="currentColor"/>
      <rect x="11" y="10" width="2"  height="9" fill="currentColor"/>
      <rect x="9"  y="19" width="6"  height="1" fill="currentColor"/>
    </svg>
  ),
};

export default function RoleIcon({ role, className }) {
  const node = PATHS[role] || PATHS.frontline;
  return <span className={`es-role-icon ${className || ''}`}>{node}</span>;
}
