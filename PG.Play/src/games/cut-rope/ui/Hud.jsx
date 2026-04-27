// Cut the Rope HUD — thin overlay over the canvas. Reuses platform CSS.

export default function Hud({ level, stars, onPause, onRetry, onMenu }) {
  return (
    <div className="cr-hud">
      <button className="cr-hud-btn" onClick={onMenu} aria-label="Levels">
        <span className="cr-hud-icon">≡</span>
      </button>
      <div className="cr-hud-title">
        <div className="cr-hud-level">Level {level.world}-{level.number}</div>
        <div className="cr-hud-name">{level.name}</div>
      </div>
      <div className="cr-hud-stars">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`cr-star-pip ${i < stars ? 'on' : ''}`}>★</span>
        ))}
      </div>
      <button className="cr-hud-btn" onClick={onRetry} aria-label="Retry">↺</button>
      <button className="cr-hud-btn" onClick={onPause} aria-label="Pause">II</button>
    </div>
  );
}
