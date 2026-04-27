// Full-screen pause overlay. Bound to P key + a HUD pause button.
// Sim stops ticking while paused (see engine/loop.js getPaused).

export default function PauseOverlay({ paused, onResume }) {
  if (!paused) return null;
  return (
    <div className="es-pause" role="dialog" aria-label="Game paused" onClick={onResume}>
      <div className="es-pause-card" onClick={(e) => e.stopPropagation()}>
        <div className="es-pause-tag">Paused</div>
        <div className="es-pause-hint">Press <kbd>P</kbd> or click anywhere to resume</div>
        <button type="button" className="es-pause-resume" onClick={onResume}>Resume</button>
      </div>
    </div>
  );
}
