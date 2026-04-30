// Celebration — confetti burst + headline card.
//
// `intensity` (0-6) scales particle count and animation duration so a 4096
// pop feels bigger than 2048, and a player win feels bigger than a draw.
// intensity 0 means no confetti (used for "you lost to the bot" cards).
//
// Positions absolutely inside its parent — the parent should be
// `position: relative` so the overlay scopes to the game frame instead of
// the whole viewport.

import { useMemo } from 'react';

const COLORS = ['#f5c14a', '#e54562', '#7ad17a', '#5fb6e5', '#c879ff', '#ffaf5b', '#56e0c2'];

export default function Celebration({
  intensity = 3,
  title,
  subtitle,
  ctaLabel = 'Continue',
  onDismiss,
}) {
  const particles = useMemo(() => {
    if (intensity <= 0) return [];
    const count = 40 + intensity * 30;        // 70 → 220
    const dur   = 2.4 + intensity * 0.4;      // 2.8 → 4.8s
    return Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 30 + Math.random() * 60;  // % of vmin
      return {
        cx: `${Math.cos(angle) * dist}vmin`,
        cy: `${Math.sin(angle) * dist}vmin`,
        rot: `${(Math.random() - 0.5) * 1080}deg`,
        bg: COLORS[i % COLORS.length],
        size: `${5 + Math.random() * 10}px`,
        delay: `${Math.random() * 0.5}s`,
        dur: `${dur}s`,
      };
    });
  }, [intensity]);

  return (
    <div className={`celebrate celebrate-i${Math.min(6, intensity)}`}>
      <div className="celebrate-particles" aria-hidden="true">
        {particles.map((p, i) => (
          <span key={i} className="celebrate-confetti" style={{
            '--cx': p.cx,
            '--cy': p.cy,
            '--rot': p.rot,
            '--bg': p.bg,
            '--size': p.size,
            '--delay': p.delay,
            '--dur': p.dur,
          }}/>
        ))}
      </div>
      <div className="celebrate-card">
        {title    && <div className="celebrate-title">{title}</div>}
        {subtitle && <div className="celebrate-sub">{subtitle}</div>}
        {onDismiss && (
          <button className="btn btn-primary celebrate-cta" onClick={onDismiss}>
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
