import { useEffect } from 'react';
import { Icon } from '../../icons.jsx';

function trapFocus(node) {
  if (!node) return () => {};
  const first = node.querySelector('button, [tabindex]:not([tabindex="-1"])');
  first?.focus?.();
  return () => {};
}

export function PauseOverlay({ open, onResume, onRestart, onExit, onToggleMute, muted }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onResume?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onResume]);
  if (!open) return null;
  return (
    <div className="shell-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div className="shell-overlay-card" ref={trapFocus}>
        <h2 id="pause-title" className="shell-overlay-title">Paused</h2>
        <div className="shell-overlay-actions">
          <button className="btn btn-primary btn-lg" onClick={onResume}>{Icon.play} Resume</button>
          <button className="btn btn-ghost btn-lg" onClick={onRestart}>{Icon.restart} Restart</button>
          {onToggleMute && (
            <button className="btn btn-ghost btn-lg" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
              {muted ? Icon.mute : Icon.volume} {muted ? 'Unmute' : 'Mute'}
            </button>
          )}
          <button className="btn btn-subtle" onClick={onExit}>{Icon.back} Exit</button>
        </div>
      </div>
    </div>
  );
}

export function HelpOverlay({ open, onClose, title, sections = [] }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="shell-overlay" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div className="shell-overlay-card shell-overlay-card-wide">
        <div className="shell-overlay-kicker">How to play</div>
        <h2 id="help-title" className="shell-overlay-title">{title}</h2>
        <div className="shell-help-grid">
          {sections.map((section, i) => (
            <div key={i} className="shell-help-section">
              <div className="shell-help-section-title">{section.title}</div>
              <ul className="shell-help-list">
                {section.items.map((it, j) => (
                  <li key={j} className="shell-help-item">
                    {it.keys && (
                      <span className="shell-help-keys">
                        {it.keys.map((k, kk) => (
                          <kbd key={kk} className="shell-help-kbd">{k}</kbd>
                        ))}
                      </span>
                    )}
                    <span className="shell-help-desc">{it.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="shell-overlay-actions">
          <button className="btn btn-primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}

export function EndOverlay({ open, title, kicker, score, subtitle, primaryLabel = 'Rematch', onPrimary, onExit, extras }) {
  if (!open) return null;
  return (
    <div className="shell-overlay shell-overlay-end" role="dialog" aria-modal="true" aria-labelledby="end-title">
      <div className="shell-overlay-card shell-overlay-card-centered">
        <div className="shell-overlay-kicker">{kicker || 'Full time'}</div>
        <h2 id="end-title" className="shell-overlay-title">{title}</h2>
        {score !== undefined && score !== null && (
          <div className="shell-overlay-score">{score}</div>
        )}
        {subtitle && <p className="shell-overlay-desc">{subtitle}</p>}
        {extras && <div className="shell-overlay-extras">{extras}</div>}
        <div className="shell-overlay-actions">
          <button className="btn btn-primary btn-lg" onClick={onPrimary}>{Icon.restart} {primaryLabel}</button>
          <button className="btn btn-ghost btn-lg" onClick={onExit}>{Icon.back} Back</button>
        </div>
      </div>
    </div>
  );
}
