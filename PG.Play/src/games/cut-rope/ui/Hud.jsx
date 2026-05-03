// Snip HUD — thin overlay over the canvas. Vector icons + vector stars
// keep the UI looking deliberate at every DPI; system Unicode glyphs
// were betraying the "kid-made" feel.

const Star = ({ filled }) => (
  <svg className={`cr-star-svg ${filled ? 'on' : ''}`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.5l2.95 6.36 6.93.6-5.27 4.59 1.6 6.81L12 17.27l-6.21 3.59 1.6-6.81L2.12 9.46l6.93-.6L12 2.5z" />
  </svg>
);

const IconMenu = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);
const IconRetry = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3.5-7.1" />
    <polyline points="3 4 3 10 9 10" />
  </svg>
);
const IconPause = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

export default function Hud({ level, stars, onPause, onRetry, onMenu }) {
  return (
    <div className="cr-hud">
      <button className="cr-hud-btn" onClick={onMenu} aria-label="Levels">
        <IconMenu />
      </button>
      <div className="cr-hud-title">
        <div className="cr-hud-level">Level {level.world}-{level.number}</div>
        <div className="cr-hud-name">{level.name}</div>
      </div>
      <div className="cr-hud-stars">
        {[0, 1, 2].map((i) => <Star key={i} filled={i < stars} />)}
      </div>
      <button className="cr-hud-btn" onClick={onRetry} aria-label="Retry">
        <IconRetry />
      </button>
      <button className="cr-hud-btn" onClick={onPause} aria-label="Pause">
        <IconPause />
      </button>
    </div>
  );
}
