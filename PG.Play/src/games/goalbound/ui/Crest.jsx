// Procedural SVG team crests. No external assets; one style per
// glyph with primary/secondary team palette baked in.

const glyphs = {
  bird: (p, s) => (
    <g>
      <circle cx="24" cy="22" r="12" fill={p} opacity="0.22"/>
      <path d="M6 22 L24 14 L36 30 L24 28 L18 34 Z" fill={p} stroke={s} strokeLinejoin="round" strokeWidth="1.2"/>
      <circle cx="28" cy="17" r="1.5" fill={s}/>
    </g>
  ),
  flame: (p, s) => (
    <g>
      <path d="M20 38 C 6 30, 12 16, 20 6 C 22 16, 30 18, 26 28 C 32 24, 30 36, 20 38 Z"
            fill={p} stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
    </g>
  ),
  bolt: (p, s) => (
    <g>
      <path d="M24 4 L12 24 L20 24 L14 40 L30 18 L22 18 L28 4 Z"
            fill={p} stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
    </g>
  ),
  wave: (p, s) => (
    <g>
      <path d="M4 26 C 12 20, 16 32, 24 26 C 32 20, 36 32, 44 26" stroke={p} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M4 18 C 12 12, 16 24, 24 18 C 32 12, 36 24, 44 18" stroke={p} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
      <circle cx="24" cy="34" r="2" fill={s}/>
    </g>
  ),
  wolf: (p, s) => (
    <g>
      <path d="M8 32 L16 12 L24 20 L32 12 L40 32 L32 28 L24 34 L16 28 Z"
            fill={p} stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="19" cy="24" r="1.4" fill={s}/>
      <circle cx="29" cy="24" r="1.4" fill={s}/>
    </g>
  ),
  sun: (p, s) => (
    <g>
      <circle cx="24" cy="24" r="9" fill={p}/>
      {[0,45,90,135,180,225,270,315].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        const x1 = 24 + Math.cos(rad) * 12, y1 = 24 + Math.sin(rad) * 12;
        const x2 = 24 + Math.cos(rad) * 20, y2 = 24 + Math.sin(rad) * 20;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={p} strokeWidth="3" strokeLinecap="round"/>;
      })}
      <circle cx="24" cy="24" r="3" fill={s}/>
    </g>
  ),
  kite: (p, s) => (
    <g>
      <path d="M24 4 L38 22 L24 42 L10 22 Z" fill={p} stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M24 4 L24 42 M10 22 L38 22" stroke={s} strokeWidth="1"/>
    </g>
  ),
  stag: (p, s) => (
    <g>
      <path d="M24 30 L14 42 M24 30 L34 42 M24 30 L24 16" stroke={p} strokeWidth="3" strokeLinecap="round"/>
      <path d="M24 16 L16 6 M24 16 L32 6 M20 10 L14 10 M28 10 L34 10" stroke={p} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="20" r="3" fill={s}/>
    </g>
  ),
  gryphon: (p, s) => (
    <g>
      <path d="M10 30 L24 8 L38 30 L30 32 L24 24 L18 32 Z" fill={p} stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="24" cy="22" r="2" fill={s}/>
    </g>
  ),
  serpent: (p, s) => (
    <g>
      <path d="M10 34 C 20 24, 28 34, 38 24" stroke={p} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M36 24 L42 22 L38 20 Z" fill={p}/>
      <circle cx="38" cy="23" r="1.2" fill={s}/>
    </g>
  ),
  fox: (p, s) => (
    <g>
      <path d="M12 18 L16 6 L22 14 L26 14 L32 6 L36 18 L28 32 L20 32 Z"
            fill={p} stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="19" cy="22" r="1.4" fill={s}/>
      <circle cx="29" cy="22" r="1.4" fill={s}/>
      <path d="M22 26 L24 28 L26 26" stroke={s} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </g>
  ),
  phoenix: (p, s) => (
    <g>
      <path d="M24 6 C 32 14, 40 14, 42 24 C 36 22, 32 26, 32 30 C 34 34, 30 38, 24 38 C 18 38, 14 34, 16 30 C 16 26, 12 22, 6 24 C 8 14, 16 14, 24 6 Z"
            fill={p} stroke={s} strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="24" cy="22" r="2" fill={s}/>
    </g>
  ),
};

export function Crest({ team, size = 48, rounded = true }) {
  if (!team) return null;
  const g = glyphs[team.crest] || glyphs.kite;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="gb-crest" aria-hidden="true">
      <defs>
        <linearGradient id={`gb-crest-bg-${team.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={team.primary} stopOpacity="0.22"/>
          <stop offset="1" stopColor={team.secondary} stopOpacity="0.9"/>
        </linearGradient>
      </defs>
      {rounded
        ? <rect x="1" y="1" width="46" height="46" rx="10" fill={`url(#gb-crest-bg-${team.id})`} stroke={team.primary} strokeOpacity="0.6" strokeWidth="1.3"/>
        : <rect x="0" y="0" width="48" height="48" fill="transparent"/>}
      {g(team.primary, team.secondary)}
    </svg>
  );
}
