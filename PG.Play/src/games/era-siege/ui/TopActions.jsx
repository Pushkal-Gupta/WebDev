// Top-right HUD action chips: pause, speed, settings. Mobile-friendly
// (large tap targets) and keyboard-friendly. Uses the platform icon set
// from src/icons.jsx — no emoji, per project convention.

import { Icon } from '../../../icons.jsx';

export default function TopActions({ paused, speed, onTogglePause, onCycleSpeed, onOpenSettings }) {
  return (
    <div className="es-actions" role="toolbar" aria-label="Game controls">
      <button
        type="button"
        className={`es-action${paused ? ' is-on' : ''}`}
        onClick={onTogglePause}
        title={paused ? 'Resume (P)' : 'Pause (P)'}
        aria-label={paused ? 'Resume' : 'Pause'}
        aria-pressed={paused}>
        <span className="es-action-icon" aria-hidden="true">
          {paused ? Icon.play : Icon.pause}
        </span>
      </button>
      <button
        type="button"
        className={`es-action es-action-speed${speed > 1 ? ' is-on' : ''}`}
        onClick={onCycleSpeed}
        title={`Game speed (${speed}×)`}
        aria-label={`Game speed ${speed} times`}>
        <span className="es-action-text">{speed}×</span>
      </button>
      <button
        type="button"
        className="es-action"
        onClick={onOpenSettings}
        title="Settings"
        aria-label="Open settings">
        <span className="es-action-icon" aria-hidden="true">
          {Icon.settings}
        </span>
      </button>
    </div>
  );
}
