// Procedural player portrait. Silhouette head + jersey crop, tinted
// with team colors. Deterministic per-player-id so the avatar stays
// stable between renders.

const HAIR_STYLES = ['crop','spikes','curls','fade','slick','tied'];
const SKIN_TONES = ['#f2c693','#d9a06b','#b37d55','#885a3a','#5d3c25','#eed2b0'];

const hash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export function Portrait({ player, team, size = 72 }) {
  if (!player || !team) return null;
  const h = hash(player.id);
  const hair = HAIR_STYLES[h % HAIR_STYLES.length];
  const skin = SKIN_TONES[(h >> 3) % SKIN_TONES.length];
  const hairColor = ['#1a1616','#30221a','#513320','#3b2a1a','#8a5b37','#c2a66a'][(h >> 5) % 6];
  const jersey = team.primary, trim = team.secondary;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="gb-portrait" aria-hidden="true">
      <defs>
        <radialGradient id={`gb-port-bg-${player.id}`} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor={trim} stopOpacity="0.18"/>
          <stop offset="1" stopColor={trim} stopOpacity="0.8"/>
        </radialGradient>
      </defs>
      <rect width="80" height="80" rx="14" fill={`url(#gb-port-bg-${player.id})`}/>
      {/* jersey crop */}
      <path d="M10 70 C 14 56, 22 52, 40 52 C 58 52, 66 56, 70 70 L 70 80 L 10 80 Z" fill={jersey}/>
      <path d="M32 52 L48 52 L44 58 L36 58 Z" fill={trim}/>
      {/* neck */}
      <rect x="36" y="44" width="8" height="10" fill={skin}/>
      {/* head */}
      <circle cx="40" cy="36" r="14" fill={skin}/>
      {/* hair */}
      {hairStyle(hair, hairColor)}
      {/* eyes + mouth */}
      <circle cx="34" cy="36" r="1.6" fill="#1a1616"/>
      <circle cx="46" cy="36" r="1.6" fill="#1a1616"/>
      <path d="M34 42 Q 40 46 46 42" stroke="#2b1a12" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      {/* shirt number */}
      <text x="40" y="72" textAnchor="middle" fontFamily="'Space Mono', monospace" fontSize="11" fontWeight="700" fill={trim} stroke={jersey} strokeWidth="0.2">
        {player.num}
      </text>
    </svg>
  );
}

const hairStyle = (style, color) => {
  switch (style) {
    case 'crop':    return <path d="M26 28 Q 40 14 54 28 Q 52 20 40 18 Q 28 20 26 28 Z" fill={color}/>;
    case 'spikes':  return <path d="M28 28 L34 18 L38 26 L42 18 L46 26 L50 18 L54 28 Z" fill={color}/>;
    case 'curls':   return (
      <g fill={color}>
        <circle cx="32" cy="26" r="4"/><circle cx="40" cy="22" r="5"/><circle cx="48" cy="26" r="4"/>
      </g>
    );
    case 'fade':    return <path d="M28 30 Q 40 18 52 30 L 52 32 Q 40 24 28 32 Z" fill={color}/>;
    case 'slick':   return <path d="M28 32 Q 30 22 40 22 Q 50 22 52 32 L 48 28 Q 40 24 32 28 Z" fill={color}/>;
    case 'tied':    return (
      <g fill={color}>
        <path d="M28 30 Q 40 16 52 30 L 52 32 Q 40 22 28 32 Z"/>
        <rect x="38" y="44" width="4" height="10" rx="2"/>
      </g>
    );
    default: return null;
  }
};
